CREATE TABLE IF NOT EXISTS football_messages(event_id text PRIMARY KEY,fixture_id text NOT NULL,kind text NOT NULL,payload jsonb NOT NULL,received_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS football_messages_fixture ON football_messages(fixture_id,received_at);
CREATE TABLE IF NOT EXISTS football_snapshots(fixture_id text PRIMARY KEY,revision bigint NOT NULL DEFAULT 1,payload jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS computed_match_results(fixture_id text PRIMARY KEY,source_revision bigint NOT NULL,model_version text NOT NULL,payload jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
