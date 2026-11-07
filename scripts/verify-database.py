from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1]
up=(root/'database/migrations/0001_foundation.up.sql').read_text()
down=(root/'database/migrations/0001_foundation.down.sql').read_text()
seed=(root/'database/seeds/demo.sql').read_text()
checks="""DO $$ BEGIN
IF (SELECT count(*) FROM players)<>120 THEN RAISE EXCEPTION 'player seed failed'; END IF;
IF (SELECT count(*) FROM fixtures)<>20 THEN RAISE EXCEPTION 'fixture seed failed'; END IF;
BEGIN INSERT INTO fixtures SELECT 'bad',season_id,stage_id,home_id,home_id,kickoff_at,status,0,0,mode,1 FROM fixtures LIMIT 1; RAISE EXCEPTION 'invalid fixture accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
"""
sql='BEGIN; CREATE SCHEMA step4_verify; SET LOCAL search_path TO step4_verify;'+up+seed+seed+checks+down+up+seed+checks+'ROLLBACK;'
subprocess.run(['docker','compose','exec','-T','postgres','sh','-c','psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'],input=sql,text=True,check=True,stdout=subprocess.DEVNULL)
print('PASS: migrate, idempotent seed, query, constraints, rollback schema, recreate, reseed; verification transaction rolled back')
