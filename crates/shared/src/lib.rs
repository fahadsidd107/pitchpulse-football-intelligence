use std::{
    net::{IpAddr, SocketAddr},
    time::Duration,
};

pub struct Config {
    pub bind: SocketAddr,
    pub web_origin: String,
    pub database_url: String,
    pub request_timeout: Duration,
}
impl Config {
    pub fn from_env() -> Result<Self, String> {
        dotenvy::dotenv().ok();
        Self::from_lookup(|key| std::env::var(key).ok())
    }
    pub fn from_lookup(get: impl Fn(&str) -> Option<String>) -> Result<Self, String> {
        let value = |key: &str, default: &str| get(key).unwrap_or_else(|| default.into());
        let host: IpAddr = value("API_HOST", "127.0.0.1")
            .parse()
            .map_err(|_| "API_HOST must be an IP address")?;
        let port: u16 = value("API_PORT", "3000")
            .parse()
            .map_err(|_| "API_PORT must be a valid port")?;
        if port == 0 {
            return Err("API_PORT must not be zero".into());
        }
        let web_origin = value("PUBLIC_WEB_ORIGIN", "http://localhost:5173");
        let origin =
            url::Url::parse(&web_origin).map_err(|_| "PUBLIC_WEB_ORIGIN must be an HTTP origin")?;
        if !matches!(origin.scheme(), "http" | "https")
            || origin.host_str().is_none()
            || !origin.username().is_empty()
            || origin.password().is_some()
            || origin.query().is_some()
            || origin.fragment().is_some()
            || origin.path() != "/"
        {
            return Err(
                "PUBLIC_WEB_ORIGIN must contain only scheme, host and optional port".into(),
            );
        }
        let database_url =
            get("DATABASE_URL").ok_or("DATABASE_URL is required; copy .env.example to .env")?;
        let database =
            url::Url::parse(&database_url).map_err(|_| "DATABASE_URL must be a PostgreSQL URL")?;
        if !matches!(database.scheme(), "postgres" | "postgresql") || database.host_str().is_none()
        {
            return Err("DATABASE_URL must be a PostgreSQL URL".into());
        }
        if value("DATA_PROVIDER", "mock") != "mock" || value("DEMO_MODE", "true") != "true" {
            return Err(
                "Only DATA_PROVIDER=mock and DEMO_MODE=true are supported in Step 02".into(),
            );
        }
        let seconds: u64 = value("REQUEST_TIMEOUT_SECONDS", "5")
            .parse()
            .map_err(|_| "REQUEST_TIMEOUT_SECONDS must be an integer")?;
        if !(1..=30).contains(&seconds) {
            return Err("REQUEST_TIMEOUT_SECONDS must be between 1 and 30".into());
        }
        Ok(Self {
            bind: SocketAddr::new(host, port),
            web_origin: origin.origin().ascii_serialization(),
            database_url,
            request_timeout: Duration::from_secs(seconds),
        })
    }
}
pub fn init_tracing() {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();
}
pub async fn shutdown_signal() {
    #[cfg(unix)]
    {
        let mut terminate =
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                .expect("install SIGTERM handler");
        tokio::select! { _ = tokio::signal::ctrl_c() => {}, _ = terminate.recv() => {} }
    }
    #[cfg(not(unix))]
    tokio::signal::ctrl_c()
        .await
        .expect("install Ctrl-C handler");
    tracing::info!("shutdown requested");
}
pub async fn worker_bootstrap(role: &'static str) -> Result<(), String> {
    let _config = Config::from_env()?;
    init_tracing();
    tracing::info!(
        role,
        processing_enabled = false,
        "worker configuration valid; processing is implemented in later roadmap steps"
    );
    if std::env::args().any(|arg| arg == "--check-config") {
        return Ok(());
    }
    shutdown_signal().await;
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    fn config(overrides: &[(&str, &str)]) -> Result<Config, String> {
        Config::from_lookup(|key| {
            overrides
                .iter()
                .find(|(k, _)| *k == key)
                .map(|(_, v)| v.to_string())
                .or_else(|| {
                    (key == "DATABASE_URL")
                        .then(|| "postgresql://test:secret@localhost/test".into())
                })
        })
    }
    #[test]
    fn valid_defaults() {
        let c = config(&[]).unwrap();
        assert_eq!(c.bind.port(), 3000);
        assert_eq!(c.request_timeout.as_secs(), 5);
    }
    #[test]
    fn rejects_invalid_values_without_echoing_secrets() {
        for pair in [
            ("API_PORT", "0"),
            ("API_HOST", "bad"),
            ("PUBLIC_WEB_ORIGIN", "https://user:secret@example.com"),
            ("PUBLIC_WEB_ORIGIN", "http://localhost/path"),
            ("DATABASE_URL", "https://secret@example.com"),
            ("REQUEST_TIMEOUT_SECONDS", "31"),
            ("DATA_PROVIDER", "live"),
            ("DEMO_MODE", "false"),
        ] {
            let error = config(&[pair]).err().expect("must reject");
            assert!(!error.contains("secret"));
        }
    }
    #[test]
    fn requires_database_url() {
        assert!(Config::from_lookup(|_| None).is_err());
    }
}
