use rdkafka::{
    ClientConfig, Message,
    consumer::{CommitMode, Consumer, StreamConsumer},
    producer::{FutureProducer, FutureRecord},
};
use serde_json::{Value, json};
use sqlx::PgPool;
use std::time::Duration;
pub async fn setup(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::raw_sql(include_str!(
        "../../../database/migrations/0002_pipeline.up.sql"
    ))
    .execute(pool)
    .await?;
    Ok(())
}
pub async fn ingest() -> Result<(), Box<dyn std::error::Error>> {
    let producer: FutureProducer = ClientConfig::new()
        .set(
            "bootstrap.servers",
            std::env::var("KAFKA_BROKERS").unwrap_or("localhost:9092".into()),
        )
        .set("message.timeout.ms", "10000")
        .set("enable.idempotence", "true")
        .create()?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()?;
    loop {
        let batch: Value = client
            .get("http://127.0.0.1:8089/api/v1/live?limit=100")
            .send()
            .await?
            .error_for_status()?
            .json()
            .await?;
        if batch["meta"]["is_real_live_data"] != false {
            return Err("invalid provenance".into());
        }
        for fixture in batch["data"].as_array().ok_or("missing live data")? {
            let id = fixture["id"].as_str().ok_or("missing ID")?;
            let clock = fixture["clock_seconds"].as_i64().ok_or("missing clock")?;
            let tracking:Value=client.get(format!("http://127.0.0.1:8089/api/v1/fixtures/{id}/tracking?start={clock}&end={}&step=5",(clock+5).min(5400))).send().await?.error_for_status()?.json().await?;
            for (kind, payload) in [
                ("fixture", fixture.clone()),
                ("tracking", tracking["data"].clone()),
            ] {
                let envelope = json!({"schema_version":1,"event_id":format!("{id}:{kind}:{clock}"),"fixture_id":id,"kind":kind,"clock_seconds":clock,"mode":"SIMULATED","payload":payload});
                let text = envelope.to_string();
                producer
                    .send(
                        FutureRecord::to("pitchpulse.football.v1")
                            .key(id)
                            .payload(&text),
                        Duration::from_secs(10),
                    )
                    .await
                    .map_err(|_| "Kafka publication failed")?;
            }
        }
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}
pub async fn consume(pool: PgPool) -> Result<(), Box<dyn std::error::Error>> {
    setup(&pool).await?;
    let redis =
        redis::Client::open(std::env::var("REDIS_URL").unwrap_or("redis://127.0.0.1:6379".into()))?;
    let consumer: StreamConsumer = ClientConfig::new()
        .set(
            "bootstrap.servers",
            std::env::var("KAFKA_BROKERS").unwrap_or("localhost:9092".into()),
        )
        .set("group.id", "pitchpulse-projection-v1")
        .set("enable.auto.commit", "false")
        .set("auto.offset.reset", "earliest")
        .create()?;
    consumer.subscribe(&["pitchpulse.football.v1"])?;
    loop {
        let message = consumer.recv().await?;
        let result:Result<(),Box<dyn std::error::Error>>=async{
 let envelope:Value=serde_json::from_slice(message.payload().ok_or("empty Kafka payload")?)?;
 if envelope["schema_version"]!=1||envelope["mode"]!="SIMULATED"{return Err("invalid envelope".into())}
 let event=envelope["event_id"].as_str().ok_or("event id")?;let id=envelope["fixture_id"].as_str().ok_or("fixture id")?;let kind=envelope["kind"].as_str().ok_or("kind")?;
 let payload=envelope["payload"].to_string();
 let mut tx=pool.begin().await?;
 let inserted=sqlx::query("INSERT INTO football_messages(event_id,fixture_id,kind,payload) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT DO NOTHING").bind(event).bind(id).bind(kind).bind(&payload).execute(&mut *tx).await?.rows_affected();
 if inserted>0&&kind=="fixture"{
 sqlx::query("INSERT INTO football_snapshots(fixture_id,payload) VALUES($1,$2::jsonb) ON CONFLICT(fixture_id) DO UPDATE SET payload=EXCLUDED.payload,revision=football_snapshots.revision+1,updated_at=now() WHERE (EXCLUDED.payload->>'clock_seconds')::int >= (football_snapshots.payload->>'clock_seconds')::int").bind(id).bind(&payload).execute(&mut *tx).await?;
 }
 tx.commit().await?;
 // Repair Redis on repeated delivery too; PostgreSQL remains canonical.
 if kind=="fixture"{
 let (revision,snapshot):(i64,String)=sqlx::query_as("SELECT revision,payload::text FROM football_snapshots WHERE fixture_id=$1").bind(id).fetch_one(&pool).await?;
 let value=json!({"type":"snapshot","revision":revision,"mode":"SIMULATED","data":serde_json::from_str::<Value>(&snapshot)?}).to_string();
 let mut connection=redis.get_multiplexed_async_connection().await?;
 let _:()=redis::cmd("SET").arg(format!("pitchpulse:fixture:{id}")).arg(value).arg("EX").arg(120).query_async(&mut connection).await?;
 }
 Ok(())}.await;
        match result {
            Ok(()) => consumer.commit_message(&message, CommitMode::Sync)?,
            Err(e) => {
                eprintln!("projection failed; delivery retained: {e}");
                return Err(e);
            }
        }
    }
}
pub async fn snapshot(pool: &PgPool, id: &str) -> Result<Option<Value>, sqlx::Error> {
    let row: Option<(i64, String)> =
        sqlx::query_as("SELECT revision,payload::text FROM football_snapshots WHERE fixture_id=$1")
            .bind(id)
            .fetch_optional(pool)
            .await?;
    Ok(row.map(|(revision,payload)|json!({"type":"snapshot","mode":"SIMULATED","revision":revision,"data":serde_json::from_str::<Value>(&payload).unwrap_or(Value::Null)})))
}
