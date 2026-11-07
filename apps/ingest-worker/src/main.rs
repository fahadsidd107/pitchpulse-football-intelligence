#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let _config = pitchpulse_shared::Config::from_env()?;
    pitchpulse_shared::init_tracing();
    tokio::select! {result=pitchpulse_infrastructure::pipeline::ingest()=>result,_=pitchpulse_shared::shutdown_signal()=>Ok(())}
}
