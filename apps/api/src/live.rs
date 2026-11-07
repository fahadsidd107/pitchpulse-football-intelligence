use super::{AppState, error};
use axum::{
    Json,
    extract::{Path, State, WebSocketUpgrade, ws::Message},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;
pub(super) async fn socket(
    State(state): State<AppState>,
    Path(id): Path<String>,
    ws: WebSocketUpgrade,
) -> Response {
    if id.is_empty() || id.len() > 120 {
        return error(
            StatusCode::BAD_REQUEST,
            "INVALID_FIXTURE",
            "Invalid fixture",
        );
    }
    ws.on_upgrade(move|mut socket|async move{
 let mut last=0;
 loop{
 match pitchpulse_infrastructure::pipeline::snapshot(&state.pool,&id).await{
 Ok(Some(value))=>{let revision=value["revision"].as_i64().unwrap_or(0);if revision>last{if socket.send(Message::Text(value.to_string().into())).await.is_err(){break}last=revision}},
 _=>{if socket.send(Message::Text(json!({"type":"pending","mode":"SIMULATED"}).to_string().into())).await.is_err(){break}}
 }
 tokio::select!{_=tokio::time::sleep(std::time::Duration::from_secs(1))=>{},message=socket.recv()=>{match message{Some(Ok(Message::Close(_)))|None|Some(Err(_))=>break,_=>{}}}}
 }
 }).into_response()
}
pub(super) async fn projection(State(state): State<AppState>, Path(id): Path<String>) -> Response {
    match pitchpulse_infrastructure::pipeline::snapshot(&state.pool, &id).await {
        Ok(Some(v)) => Json(v).into_response(),
        _ => error(
            StatusCode::SERVICE_UNAVAILABLE,
            "PROJECTION_PENDING",
            "Waiting for a committed fixture projection.",
        ),
    }
}
