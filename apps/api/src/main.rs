use pitchpulse_shared::{Config, init_tracing, shutdown_signal};
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::from_env()?;
    init_tracing();
    let pool = pitchpulse_infrastructure::database_pool(&config.database_url)
        .map_err(|_| "invalid database configuration")?;
    let app = pitchpulse_api::router(&config, pool.clone());
    let listener = tokio::net::TcpListener::bind(config.bind).await?;
    tracing::info!(address = %config.bind, "API listening");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    pool.close().await;
    Ok(())
}
