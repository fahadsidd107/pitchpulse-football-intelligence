//! Boundary for the local rolling reference provider. Frontend never calls Python directly.
use super::error;
use axum::{
    Json,
    extract::{Path, RawQuery},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::{Value, json};
use std::time::Duration;
fn allowed(path: &str) -> bool {
    let p: Vec<_> = path.split('/').collect();
    if p.iter().any(|s| {
        s.is_empty()
            || s.len() > 120
            || !s
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    }) {
        return false;
    }
    match p[0] {
        "home" | "live" | "rankings" | "scout" | "news" | "transfers" | "fantasy"
        | "predictions" | "simulations" => p.len() == 1,
        "competitions" => {
            p.len() == 1
                || p.len() == 2
                || (p.len() == 3 && matches!(p[2], "clubs" | "fixtures" | "standings"))
        }
        "clubs" => {
            p.len() == 1 || p.len() == 2 || (p.len() == 3 && matches!(p[2], "squad" | "fixtures"))
        }
        "players" => p.len() <= 2,
        "fixtures" => {
            p.len() == 1
                || (p.len() == 3
                    && matches!(
                        p[2],
                        "live-state"
                            | "events"
                            | "lineups"
                            | "statistics"
                            | "tracking"
                            | "ai-context"
                    ))
        }
        "mock" => p.len() == 2 && matches!(p[1], "manifest" | "clock" | "showcase"),
        _ => false,
    }
}
pub(super) async fn get(Path(path): Path<String>, RawQuery(query): RawQuery) -> Response {
    if !allowed(&path) {
        return error(
            StatusCode::NOT_FOUND,
            "UNKNOWN_FOOTBALL_RESOURCE",
            "Football resource not found.",
        );
    }
    let mode = std::env::var("APP_DATA_MODE").unwrap_or_else(|_| "mock".into());
    if mode != "mock" {
        return error(
            StatusCode::SERVICE_UNAVAILABLE,
            "PROVIDER_NOT_SUPPORTED",
            "This rolling provider supports mock mode only. Real mode requires a compatible adapter; no simulated data was substituted.",
        );
    }
    let query = query.unwrap_or_default();
    if query.len() > 1024 {
        return error(StatusCode::BAD_REQUEST, "INVALID_QUERY", "Query too long.");
    }
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(4))
        .redirect(reqwest::redirect::Policy::none())
        .build()
    {
        Ok(c) => c,
        Err(_) => {
            return error(
                StatusCode::SERVICE_UNAVAILABLE,
                "PROVIDER_UNAVAILABLE",
                "Provider unavailable.",
            );
        }
    };
    let response = match client
        .get(format!("http://127.0.0.1:8089/api/v1/{path}"))
        .query(&url_pairs(&query))
        .send()
        .await
    {
        Ok(r) => r,
        Err(_) => {
            return error(
                StatusCode::SERVICE_UNAVAILABLE,
                "MOCK_PROVIDER_OFFLINE",
                "Start the rolling provider with npm run dev.",
            );
        }
    };
    if !response.status().is_success() {
        return error(
            StatusCode::BAD_GATEWAY,
            "PROVIDER_ERROR",
            "The requested provider resource is unavailable.",
        );
    }
    let value: Value = match response.json().await {
        Ok(v) => v,
        Err(_) => {
            return error(
                StatusCode::BAD_GATEWAY,
                "INVALID_PROVIDER_RESPONSE",
                "Invalid football provider response.",
            );
        }
    };
    if value["meta"]["is_real_live_data"] != false || value.get("data").is_none() {
        return error(
            StatusCode::BAD_GATEWAY,
            "INVALID_PROVENANCE",
            "Provider response failed provenance validation.",
        );
    }
    Json(json!({"data":value["data"],"meta":value["meta"],"pagination":value["pagination"]}))
        .into_response()
}
fn url_pairs(query: &str) -> Vec<(String, String)> {
    let Ok(url) = reqwest::Url::parse(&format!("http://localhost/?{query}")) else {
        return Vec::new();
    };
    url.query_pairs()
        .filter(|(k, _)| {
            matches!(
                k.as_ref(),
                "page"
                    | "limit"
                    | "competition"
                    | "club"
                    | "gender"
                    | "status"
                    | "from"
                    | "to"
                    | "q"
                    | "start"
                    | "end"
                    | "step"
            )
        })
        .map(|(k, v)| (k.into_owned(), v.into_owned()))
        .collect()
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn restricts_paths() {
        assert!(allowed("fixtures/demo-123/tracking"));
        assert!(allowed("competitions"));
        for p in [
            "../secret",
            "fixtures/x/stream",
            "http://evil",
            "players/x/y",
        ] {
            assert!(!allowed(p));
        }
    }
}
