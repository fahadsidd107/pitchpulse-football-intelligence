#[tokio::main]
async fn main() -> Result<(), String> {
    pitchpulse_shared::worker_bootstrap("event-consumer").await
}
