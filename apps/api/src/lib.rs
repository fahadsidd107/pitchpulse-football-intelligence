use axum::{
    Json, Router,
    extract::{Request, State},
    http::{HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::get,
};
use pitchpulse_shared::Config;
use serde_json::{Value, json};
use sqlx::PgPool;
use std::time::Duration;
use tower_http::cors::CorsLayer;

#[derive(Clone)]
struct AppState {
    pool: PgPool,
}
fn error(status: StatusCode, code: &str, message: &str) -> Response {
    (status, Json(json!({"error": {"code": code, "message": message, "request_id": null, "retryable": status.is_server_error(), "details": {}}}))).into_response()
}
async fn request_context(
    State(timeout): State<Duration>,
    request: Request,
    next: Next,
) -> Response {
    let request_id = uuid::Uuid::new_v4().to_string();
    let method = request.method().clone();
    let started = std::time::Instant::now();
    let mut response = match tokio::time::timeout(timeout, next.run(request)).await {
        Ok(response) => response,
        Err(_) => error(
            StatusCode::GATEWAY_TIMEOUT,
            "REQUEST_TIMEOUT",
            "The request took too long. Please retry.",
        ),
    };
    // All application errors carry the server-generated ID; never trust client IDs.
    if response.status().is_client_error() || response.status().is_server_error() {
        let (parts, body) = response.into_parts();
        let bytes = axum::body::to_bytes(body, 65536).await.unwrap_or_default();
        let mut value: Value = serde_json::from_slice(&bytes).unwrap_or_else(|_| json!({"error": {"code": "HTTP_ERROR", "message": "Request could not be completed.", "retryable": false, "details": {}}}));
        value["error"]["request_id"] = json!(request_id);
        response = Response::from_parts(parts, axum::body::Body::from(value.to_string()));
        response
            .headers_mut()
            .remove(axum::http::header::CONTENT_LENGTH);
    }
    response.headers_mut().insert(
        "x-request-id",
        HeaderValue::from_str(&request_id).expect("UUID header"),
    );
    tracing::info!(%request_id, %method, status = response.status().as_u16(), duration_ms = started.elapsed().as_millis() as u64, "request completed");
    response
}
pub fn router(config: &Config, pool: PgPool) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(
            config
                .web_origin
                .parse::<HeaderValue>()
                .expect("validated origin"),
        )
        .allow_methods([Method::GET])
        .expose_headers([axum::http::HeaderName::from_static("x-request-id")]);
    Router::new()
        .route("/health", get(live))
        .route("/health/live", get(live))
        .route("/health/ready", get(ready))
        .route("/api/v1/health/live", get(live))
        .route("/api/v1/health/ready", get(ready))
        .route("/api/v1/system", get(system))
        .fallback(|| async { error(StatusCode::NOT_FOUND, "NOT_FOUND", "Resource not found.") })
        .method_not_allowed_fallback(|| async {
            error(
                StatusCode::METHOD_NOT_ALLOWED,
                "METHOD_NOT_ALLOWED",
                "Method not allowed.",
            )
        })
        .with_state(AppState { pool })
        .layer(middleware::from_fn_with_state(
            config.request_timeout,
            request_context,
        ))
        .layer(cors)
}
async fn live() -> Json<Value> {
    Json(json!({"status": "ok", "service": "pitchpulse-api"}))
}
async fn ready(State(state): State<AppState>) -> Response {
    if pitchpulse_infrastructure::database_ready(&state.pool).await {
        Json(json!({"status": "ready", "dependencies": {"postgresql": "up"}})).into_response()
    } else {
        error(
            StatusCode::SERVICE_UNAVAILABLE,
            "DATABASE_UNAVAILABLE",
            "The database is unavailable. Please retry.",
        )
    }
}
async fn system() -> Json<Value> {
    let info = pitchpulse_application::system_info();
    Json(
        json!({"name": info.name, "version": env!("CARGO_PKG_VERSION"), "data_mode": info.data_mode.as_str(), "football_data_available": info.football_data_available}),
    )
}
#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::{Body, to_bytes};
    use tower::ServiceExt;
    fn app() -> Router {
        let config = Config::from_lookup(|key| {
            (key == "DATABASE_URL").then(|| "postgresql://test:test@127.0.0.1:1/test".into())
        })
        .unwrap();
        router(
            &config,
            pitchpulse_infrastructure::database_pool(&config.database_url).unwrap(),
        )
    }
    #[tokio::test]
    async fn liveness_does_not_require_database() {
        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert!(response.headers().contains_key("x-request-id"));
    }
    #[tokio::test]
    async fn readiness_reports_dependency_failure_safely() {
        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/health/ready")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        let id = response.headers()["x-request-id"]
            .to_str()
            .unwrap()
            .to_owned();
        let value: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
        assert_eq!(value["error"]["code"], "DATABASE_UNAVAILABLE");
        assert_eq!(value["error"]["request_id"], id);
    }
    #[tokio::test]
    async fn cors_allows_only_configured_origin() {
        for (origin, allowed) in [
            ("http://localhost:5173", true),
            ("https://untrusted.example", false),
        ] {
            let response = app()
                .oneshot(
                    Request::builder()
                        .uri("/api/v1/system")
                        .header("origin", origin)
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(
                response
                    .headers()
                    .get("access-control-allow-origin")
                    .is_some_and(|v| v == origin),
                allowed
            );
        }
    }
    #[tokio::test]
    async fn system_is_explicitly_mock_without_football_data() {
        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/api/v1/system")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let value: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
        assert_eq!(value["data_mode"], "MOCK");
        assert_eq!(value["football_data_available"], false);
    }
    #[tokio::test]
    async fn unknown_route_has_error_envelope() {
        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/missing")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }
}
