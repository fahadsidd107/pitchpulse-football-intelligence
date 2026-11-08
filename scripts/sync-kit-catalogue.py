from pathlib import Path
import json,sys
from datetime import datetime,timezone
root=Path(__file__).resolve().parents[1]
kit=root/'pitchpulse-data'
sys.path.insert(0,str(kit/'scripts'))
import demo_engine as e
load=lambda n:json.loads((kit/'data'/(n+'.json')).read_text())
club={r['id']:r for r in e.CLUBS}; player={r['id']:r for r in e.PLAYERS};comp={r['id']:r for r in e.COMPETITIONS}
row=lambda i,n,d,v='':dict(id=i,name=n,detail=d,value=str(v))
rows={}
rows['competitions']=[row(c['id'],c['name'],f"{c['country']} · {c['gender']} · {c['season']} · simulated calendar",sum(t['competition_id']==c['id'] for t in e.CLUBS)) for c in e.COMPETITIONS]
rows['clubs']=[row(c['id'],c['name'],f"{comp[c['competition_id']]['name']} · {c['country']} · roster unverified",'27 synthetic squad players') for c in e.CLUBS]
rows['players']=[row(p['id'],p['name'],f"{club[p['club_id']]['name']} · {p['position']} · synthetic identity",f"Age {p['age']}") for p in e.PLAYERS]
rows['rankings']=[row(str(i),player[p['player_id']]['name'],f"{club[player[p['player_id']]['club_id']]['name']} · kit illustrative rating, not computed engine",p['rating']) for i,p in enumerate(sorted(load('player_ratings'),key=lambda p:-p['rating']))]
now=datetime.now(timezone.utc)
rows['news']=[row(n['id'],n['title'],n['source']+' · '+n['published_at'],'Fictional news') for n in e.mock_news(now)]
rows['transfers']=[row(n['id'],player[n['player_id']]['name'],club[n['from_club_id']]['name']+' → '+club[n['to_club_id']]['name'],n['status']) for n in e.mock_transfers(now)]
rows['fantasy']=[row(n['user_id'],n['team_name'],'Kit fictional squad · illustrative baseline, not user settlement',str(n['total_points'])+' pts') for n in load('fantasy_teams')]
rows['simulator']=[row(n['id'],n['title'],n['home_team']+' v '+n['away_team']+' · hypothetical saved run',str(n['score']['home'])+' : '+str(n['score']['away'])) for n in load('simulations')]
rows['tactical-lab']=[row(c['id'],c['name']+' tactical preview','Synthetic squad and match-context exploration · open Match Center for event evidence','4-3-3') for c in e.CLUBS[:30]]
rows['ai-analyst']=[row(c['id'],c['name']+' match context','Simulated evidence lookup · open Match Center for fixture-specific questions','Evidence tools') for c in e.COMPETITIONS]
rows['favourites']=[row(c['id'],c['name'],comp[c['competition_id']]['name']+' · suggested demo club','Follow') for c in e.CLUBS[:8]]
rows['alerts']=[row('kit-alert','Simulated matchday is active','Open Match Center for rotating kit fixtures','SIMULATED DEMO')]
rows['account']=[row('kit-guest','PitchPulse guest','Local demo preferences · no authenticated account','Guest')]
output=root/'apps/web/src/features/catalogue/demo.json'
output.write_text(json.dumps(rows,separators=(',',':'))+'\n')
print('Kit catalogue generated:',{k:len(v) for k,v in rows.items()})

split=output.parent/'demo'
split.mkdir(exist_ok=True)
for section,items in rows.items():(split/(section+'.json')).write_text(json.dumps(items,separators=(',',':'))+'\n')
