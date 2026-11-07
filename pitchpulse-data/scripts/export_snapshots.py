#!/usr/bin/env python3
"""Optional point-in-time JSON exports; always prefer live rolling mock API for dynamic dates."""
import json
from datetime import datetime,timezone,timedelta
from pathlib import Path
import demo_engine as e
OUT=e.ROOT/'data'/'snapshots';OUT.mkdir(parents=True,exist_ok=True)
now=datetime.now(timezone.utc);end=now+timedelta(days=14)
fixtures=[e.live_state(f,now) for f in e.get_fixtures(now) if now-timedelta(days=2)<=e.parse_date(f['kickoff_utc'])<=end]
artifacts={'two_week_fixtures':fixtures,'home':{'live_matches':[e.live_state(f,now) for f in e.showcase(now)],'news':e.mock_news(now)[:20],'transfers':e.mock_transfers(now)[:20]},'coverage':{'generated_at_utc':e.iso(now),'all_data_simulated':True,'fixture_count':len(fixtures),'competitions':len(e.COMPETITIONS),'all_fixtures_support_synthetic_tracking':True}}
for n,payload in artifacts.items():(OUT/(n+'.json')).write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
f=e.showcase(now)[0]
(OUT/'example_match_events.json').write_text(json.dumps(e.events(f),ensure_ascii=False,indent=2)+'\n')
(OUT/'example_match_tracking.json').write_text(json.dumps(e.tracking(f,0,5400,5),ensure_ascii=False,indent=2)+'\n')
(OUT/'example_match_statistics.json').write_text(json.dumps(e.stats(f),ensure_ascii=False,indent=2)+'\n')
print('Created',len(fixtures),'two-week fixture records and example tracking replay. Source is simulated.')
