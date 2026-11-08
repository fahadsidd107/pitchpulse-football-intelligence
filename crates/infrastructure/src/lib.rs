use sqlx::{PgPool, postgres::PgPoolOptions};
use std::time::Duration;

pub fn database_pool(url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(2))
        .connect_lazy(url)
}
pub async fn database_ready(pool: &PgPool) -> bool {
    matches!(
        tokio::time::timeout(
            Duration::from_secs(2),
            sqlx::query_scalar::<_, i32>("SELECT 1").fetch_one(pool)
        )
        .await,
        Ok(Ok(1))
    )
}

pub async fn migrate(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::raw_sql("CREATE TABLE IF NOT EXISTS schema_versions(version integer PRIMARY KEY)")
        .execute(pool)
        .await?;
    let mut tx = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(582046)")
        .execute(&mut *tx)
        .await?;
    let exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM schema_versions WHERE version=1)")
            .fetch_one(&mut *tx)
            .await?;
    if !exists {
        sqlx::raw_sql(include_str!(
            "../../../database/migrations/0001_foundation.up.sql"
        ))
        .execute(&mut *tx)
        .await?;
        sqlx::query("INSERT INTO schema_versions VALUES(1)")
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await
}
pub async fn seed(pool: &PgPool) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    sqlx::raw_sql(include_str!("../../../database/seeds/demo.sql"))
        .execute(&mut *tx)
        .await?;
    tx.commit().await
}
pub async fn catalogue(
    pool: &PgPool,
    section: &str,
) -> Result<Vec<(String, String, String, String)>, sqlx::Error> {
    sqlx::query_as("SELECT id,name,detail,value FROM demo_catalogue WHERE section=$1 ORDER BY id")
        .bind(section)
        .fetch_all(pool)
        .await
}
pub mod engines;
pub mod pipeline;
