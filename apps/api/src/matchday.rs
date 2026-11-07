//! A fixed upstream, server-only credentials and a shared one-minute cache.
use super::{AppState, error};
use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use reqwest::{Client, header::HeaderValue};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::{
    sync::Arc,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tokio::sync::Mutex;

#[derive(Deserialize)]
struct Batch {
    matches: Vec<Match>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Match {
    id: u64,
    utc_date: String,
    status: String,
    competition: Named,
    home_team: Named,
    away_team: Named,
    score: Score,
}
#[derive(Deserialize)]
struct Named {
    name: Option<String>,
}
#[derive(Deserialize)]
struct Score {
    #[serde(rename = "fullTime")]
    full_time: Goals,
}
#[derive(Deserialize)]
struct Goals {
    home: Option<u16>,
    away: Option<u16>,
}
#[derive(Serialize, Clone)]
struct Fixture {
    id: u64,
    kickoff: String,
    status: String,
    competition: Option<String>,
    home: Option<String>,
    away: Option<String>,
    home_score: Option<u16>,
    away_score: Option<u16>,
}
fn normalize(batch: Batch) -> Vec<Fixture> {
    batch
        .matches
        .into_iter()
        .map(|m| Fixture {
            id: m.id,
            kickoff: m.utc_date,
            status: m.status,
            competition: m.competition.name,
            home: m.home_team.name,
            away: m.away_team.name,
            home_score: m.score.full_time.home,
            away_score: m.score.full_time.away,
        })
        .collect()
}
#[derive(Clone, Copy)]
enum Failure {
    Credential,
    Quota,
    Unavailable,
}
impl Failure {
    fn response(self) -> Response {
        let (code, msg) = match self {
            Self::Credential => (
                "FEED_ACCESS_DENIED",
                "Fixture access is not available with the configured credentials.",
            ),
            Self::Quota => (
                "FEED_RATE_LIMITED",
                "The provider request limit was reached. Try again later.",
            ),
            Self::Unavailable => (
                "FEED_UNAVAILABLE",
                "The fixture feed is temporarily unavailable.",
            ),
        };
        error(StatusCode::SERVICE_UNAVAILABLE, code, msg)
    }
}
#[derive(Default)]
struct Cache {
    snapshot: Option<Value>,
    retry_at: Option<Instant>,
    failure: Option<Failure>,
}
#[derive(Clone)]
pub(crate) struct Feed {
    key: Option<String>,
    catalogue_cache: Arc<Mutex<std::collections::HashMap<String, (Instant, Value)>>>,
    client: Client,
    cache: Arc<Mutex<Cache>>,
}
impl Feed {
    pub(crate) fn new(key: Option<String>) -> Self {
        Self {
            key: key.filter(|k| !k.trim().is_empty()),
            client: Client::builder()
                .timeout(Duration::from_secs(3))
                .redirect(reqwest::redirect::Policy::none())
                .build()
                .expect("HTTP client"),
            cache: Default::default(),
            catalogue_cache: Default::default(),
        }
    }
    pub(super) async fn catalogue(&self, section: &str) -> Option<Response> {
        let key = self.key.as_ref()?;
        let mut cache = self.catalogue_cache.lock().await;
        if let Some((until, body)) = cache.get(section)
            && *until > Instant::now()
        {
            return Some(Json(body.clone()).into_response());
        }
        let endpoint = match section {
            "competitions" => "https://api.football-data.org/v4/competitions",
            "clubs" => "https://api.football-data.org/v4/competitions/PL/teams",
            "players" => "https://api.football-data.org/v4/competitions/PL/scorers",
            _ => return None,
        };
        let mut auth = match HeaderValue::from_str(key) {
            Ok(h) => h,
            Err(_) => return Some(Failure::Credential.response()),
        };
        auth.set_sensitive(true);
        let result = self
            .client
            .get(endpoint)
            .header("X-Auth-Token", auth)
            .send()
            .await;
        let response = match result {
            Ok(r) => r,
            Err(_) => return Some(Failure::Unavailable.response()),
        };
        if !response.status().is_success() {
            return Some(if response.status().as_u16() == 429 {
                Failure::Quota.response()
            } else {
                Failure::Credential.response()
            });
        }
        let value: Value = match response.json().await {
            Ok(v) => v,
            Err(_) => return Some(Failure::Unavailable.response()),
        };
        let field = match section {
            "competitions" => "competitions",
            "clubs" => "teams",
            _ => "scorers",
        };
        let Some(rows) = value[field].as_array() else {
            return Some(Failure::Unavailable.response());
        };
        let items:Vec<Value>=rows.iter().map(|row|{
            let entity=if section=="players"{&row["player"]}else{row};
            json!({"id":entity["id"].to_string(),"name":entity["name"].as_str().unwrap_or("Name unavailable"),"detail":if section=="competitions"{row["area"]["name"].as_str().unwrap_or("Competition")}else if section=="clubs"{row["venue"].as_str().unwrap_or("Premier League")}else{row["team"]["name"].as_str().unwrap_or("Club unavailable")},"value":if section=="players"{row["goals"].to_string()}else{"".into()}})
        }).collect();
        let body = json!({"mode":"DELAYED","source":"football-data.org","items":items});
        cache.insert(
            section.into(),
            (Instant::now() + Duration::from_secs(300), body.clone()),
        );
        Some(Json(body).into_response())
    }
    pub(super) fn mode(&self) -> &'static str {
        if self.key.is_some() {
            "DELAYED"
        } else {
            "MOCK"
        }
    }
    pub(super) async fn has_observations(&self) -> bool {
        self.cache
            .lock()
            .await
            .snapshot
            .as_ref()
            .and_then(|s| s["matches"].as_array())
            .is_some_and(|rows| !rows.is_empty())
    }
    async fn read(&self, endpoint: &str) -> Response {
        let Some(key) = &self.key else {
            let batch: Batch =
                serde_json::from_str(include_str!("../../../data/mock/v1/matchday.json"))
                    .expect("valid bundled fixture");
            return Json(json!({"source":"PitchPulse demo","mode":"MOCK","fetched_at":null,"stale":false,"matches":normalize(batch)})).into_response();
        };
        let mut cache = self.cache.lock().await;
        if !cache.retry_at.is_some_and(|until| until > Instant::now()) {
            let result = async {
                let mut header = HeaderValue::from_str(key).map_err(|_| Failure::Credential)?;
                header.set_sensitive(true);
                let r = self
                    .client
                    .get(endpoint)
                    .header("X-Auth-Token", header)
                    .send()
                    .await
                    .map_err(|_| Failure::Unavailable)?;
                match r.status().as_u16() {
                    200 => (),
                    401 | 403 => return Err(Failure::Credential),
                    429 => return Err(Failure::Quota),
                    _ => return Err(Failure::Unavailable),
                }
                let batch = r.json::<Batch>().await.map_err(|_| Failure::Unavailable)?;
                Ok(normalize(batch))
            }
            .await;
            cache.retry_at = Some(Instant::now() + Duration::from_secs(60));
            match result {
                Ok(rows) => {
                    cache.failure = None;
                    cache.snapshot = Some(
                        json!({"source":"football-data.org","mode":"DELAYED","fetched_at":SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs(),"stale":false,"matches":rows}),
                    );
                }
                Err(f) => {
                    cache.failure = Some(f);
                    if matches!(f, Failure::Credential) {
                        cache.snapshot = None;
                    }
                }
            }
        }
        if let Some(mut body) = cache.snapshot.clone() {
            body["stale"] = json!(cache.failure.is_some());
            Json(body).into_response()
        } else {
            cache.failure.unwrap_or(Failure::Unavailable).response()
        }
    }
}
pub(super) async fn fixtures(State(state): State<AppState>) -> Response {
    state
        .feed
        .read("https://api.football-data.org/v4/matches")
        .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::to_bytes;
    async fn body(r: Response) -> Value {
        serde_json::from_slice(&to_bytes(r.into_body(), 65536).await.unwrap()).unwrap()
    }
    #[tokio::test]
    async fn no_key_is_fictional_and_keeps_unknown_scores() {
        let r = body(Feed::new(None).read("unused").await).await;
        assert_eq!(r["mode"], "MOCK");
        assert!(r["matches"][1]["home_score"].is_null());
    }
    #[tokio::test]
    async fn authenticated_adapter_normalizes_and_coalesces_requests() {
        use std::sync::atomic::{AtomicUsize, Ordering};
        let count = Arc::new(AtomicUsize::new(0));
        let calls = count.clone();
        let app = axum::Router::new().route(
            "/matches",
            axum::routing::get(move |headers: axum::http::HeaderMap| {
                let c = calls.clone();
                async move {
                    assert_eq!(headers["x-auth-token"], "test-only");
                    c.fetch_add(1, Ordering::SeqCst);
                    Json(
                        serde_json::from_str::<Value>(include_str!(
                            "../../../data/mock/v1/matchday.json"
                        ))
                        .unwrap(),
                    )
                }
            }),
        );
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}/matches", listener.local_addr().unwrap());
        let server = tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
        let feed = Feed::new(Some("test-only".into()));
        let (a, b) = tokio::join!(feed.read(&url), feed.read(&url));
        assert_eq!(a.status(), 200);
        let v = body(b).await;
        assert_eq!(v["mode"], "DELAYED");
        assert_eq!(v["matches"][0]["away_score"], 1);
        assert_eq!(count.load(Ordering::SeqCst), 1);
        server.abort();
        let _ = server.await;
        feed.cache.lock().await.retry_at = None;
        assert_eq!(body(feed.read(&url).await).await["stale"], true);
    }
}
