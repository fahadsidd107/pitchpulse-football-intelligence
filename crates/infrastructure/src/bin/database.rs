#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = std::env::var("DATABASE_URL")?;
    let pool = pitchpulse_infrastructure::database_pool(&url)?;
    pitchpulse_infrastructure::migrate(&pool).await?;
    pitchpulse_infrastructure::seed(&pool).await?;
    pitchpulse_infrastructure::pipeline::setup(&pool).await?;
    println!("Migrations and fictional demo seed applied.");
    Ok(())
}
