#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = pitchpulse_shared::Config::from_env()?;
    let pool = pitchpulse_infrastructure::database_pool(&config.database_url)?;
    pitchpulse_shared::init_tracing();
    tokio::select! {result=pitchpulse_infrastructure::pipeline::consume(pool)=>result,_=pitchpulse_shared::shutdown_signal()=>Ok(())}
}
