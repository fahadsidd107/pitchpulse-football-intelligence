use pitchpulse_domain::scoring::{Performance, Position, fantasy, prediction, rating};
use serde_json::{Value, json};
/// Compute a reproducible event-based demo model. Full fantasy roster rules are separate.
pub fn calculate(fixture: &Value, events: &Value, players: &[Value]) -> Result<Value, String> {
    let clock = fixture["clock_seconds"].as_i64().ok_or("clock missing")?;
    let observed: Vec<&Value> = events
        .as_array()
        .ok_or("events missing")?
        .iter()
        .filter(|e| e["clock_seconds"].as_i64().is_some_and(|s| s <= clock))
        .collect();
    let mut rows = Vec::new();
    for player in players {
        let id = player["id"].as_str().ok_or("player ID missing")?;
        let role = match player["position"].as_str() {
            Some("GK") => Position::Goalkeeper,
            Some("DF" | "CB" | "LB" | "RB") => Position::Defender,
            Some("MF" | "CM" | "DM" | "AM") => Position::Midfielder,
            Some("FW" | "ST" | "LW" | "RW") => Position::Forward,
            _ => continue,
        };
        let goals = observed
            .iter()
            .filter(|e| e["type"] == "goal" && e["player_id"] == id)
            .count() as i16;
        let assists = observed
            .iter()
            .filter(|e| {
                e["type"] == "goal"
                    && e["details"]["assist_player_id"] == id
                    && e["player_id"] != id
            })
            .count() as i16;
        let yellow = observed
            .iter()
            .filter(|e| e["type"] == "yellow_card" && e["player_id"] == id)
            .count() as i16;
        let red = observed
            .iter()
            .filter(|e| e["type"] == "red_card" && e["player_id"] == id)
            .count() as i16;
        let minutes = (clock / 60).clamp(1, 90) as u16;
        let p = Performance {
            position: role,
            minutes,
            goals,
            assists,
            yellow,
            red,
            clean_sheet: false,
        };
        let participation = if minutes >= 60 { 2 } else { 1 };
        let event_points = fantasy(p).map_err(str::to_owned)? - participation;
        let (score, confidence) = rating(p).map_err(str::to_owned)?;
        rows.push(json!({"player_id":id,"name":player["name"],"position":player["position"],"goals":goals,"assists":assists,"event_points":event_points,"rating":score,"confidence":confidence}));
    }
    rows.sort_by(|a, b| {
        b["rating"]
            .as_f64()
            .unwrap_or(0.)
            .total_cmp(&a["rating"].as_f64().unwrap_or(0.))
    });
    let actual = (
        fixture["home_score"].as_u64().unwrap_or(0) as u16,
        fixture["away_score"].as_u64().unwrap_or(0) as u16,
    );
    let predictions:Vec<Value>=[(0,0),(1,0),(1,1),(2,1),(1,2)].iter().map(|&pick|json!({"pick":pick,"points":prediction(pick,actual),"settled":fixture["status"]=="finished_demo"})).collect();
    Ok(
        json!({"model_version":"event-demo-v1","data_mode":"simulated","fixture_id":fixture["id"],"clock_seconds":clock,"coverage":"Illustrative event-only ratings; participation minutes not verified. Fantasy points exclude appearance and clean-sheet awards.","players":rows,"predictions":predictions}),
    )
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn future_events_not_scored() {
        let fixture =
            json!({"id":"f","clock_seconds":60,"home_score":0,"away_score":0,"status":"live_demo"});
        let players = vec![json!({"id":"p","name":"Demo","position":"FW"})];
        let data = calculate(
            &fixture,
            &json!([{"clock_seconds":120,"type":"goal","player_id":"p"}]),
            &players,
        )
        .unwrap();
        assert_eq!(data["players"][0]["event_points"], 0);
        assert_eq!(data["predictions"][0]["settled"], false);
    }
}
