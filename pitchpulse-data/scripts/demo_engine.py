#!/usr/bin/env python3
"""Deterministic two-week football demonstration clock and mock engine. Python stdlib only.

Synthetic results and trajectories are demonstration data and MUST remain labeled.
"""
import calendar, hashlib, json, math, random
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'data'
BASE=datetime(2026,8,3,tzinfo=timezone.utc)
SEED=20261107

def load(n):return json.loads((DATA/(n+'.json')).read_text(encoding='utf-8'))
COMPETITIONS=load('competitions');CLUBS=load('clubs');PLAYERS=load('players')
COMP={x['id']:x for x in COMPETITIONS};CLUB={x['id']:x for x in CLUBS};PLAYER={x['id']:x for x in PLAYERS}
TEAMS=defaultdict(list);SQUADS=defaultdict(list)
for t in CLUBS: TEAMS[t['competition_id']].append(t)
for p in PLAYERS:SQUADS[p['club_id']].append(p)

def stable_int(*args):return int(hashlib.sha256('|'.join(map(str,args)).encode()).hexdigest()[:15],16)
def rng(*args):return random.Random(stable_int(SEED,*args))
def monday_of(now):return (now-timedelta(days=now.weekday())).replace(hour=0,minute=0,second=0,microsecond=0)
def iso(d):return d.isoformat().replace('+00:00','Z')
def parse_date(s):return datetime.fromisoformat(s.replace('Z','+00:00'))
def pp_meta():return {'source':'pitchpulse_mock','data_mode':'simulated','is_real_live_data':False,'season':'2026-27 DEMO','notice':'SIMULATED DEMO — not real matches, rosters, news, transfers or live tracking'}
def fixture(h,a,comp,dt,round_name,kind='scheduled'):
 fid='demo-'+hashlib.sha1(f'{comp}|{h["id"]}|{a["id"]}|{dt.isoformat()}|{kind}'.encode()).hexdigest()[:15]
 r=rng(fid); hg=r.choices([0,1,2,3,4],[22,32,24,16,6])[0];ag=r.choices([0,1,2,3,4],[25,33,23,14,5])[0]
 return {'id':fid,'competition_id':comp,'home_team_id':h['id'],'away_team_id':a['id'],'home_team_name':h['name'],'away_team_name':a['name'],'home_score_final':hg,'away_score_final':ag,'kickoff_utc':iso(dt),'round':round_name,'mode':kind,'venue':f'{h["name"]} Demo Stadium','coverage':{'timeline':True,'statistics':True,'lineups':True,'tracking':'synthetic_5s','voice_ai_context':True},'data_mode':'simulated','is_real_live_data':False}

def pairings(teams,week):
 t=sorted(teams,key=lambda z:z['id']);n=len(t);r=rng('pairing',t[0]['competition_id'] if t else '',week);r.shuffle(t)
 if n%2:t=t+[None]
 return [(t[i],t[i+1]) for i in range(0,len(t)-1,2) if t[i] and t[i+1]]

def schedule(now):
 # Four calendar weeks generated to allow yesterday, the current two weeks, and next week.
 anchor=monday_of(now);all_fx=[]
 for delta_w in (-1,0,1,2):
  mon=anchor+timedelta(weeks=delta_w)
  week_index=int((mon-BASE).days//7)
  for c in COMPETITIONS:
   cid=c['id']; t=TEAMS[cid]
   if c.get('kind')=='domestic_league':
    for i,(h,a) in enumerate(pairings(t,week_index)):
     # Friday evening, Saturday afternoon/evening, Sunday afternoon/evening (all UTC)
     slots=[(4,19),(5,12),(5,15),(5,17),(5,19),(6,12),(6,15),(6,17)]
     dow,hour=slots[(i+week_index)%len(slots)]
     dt=mon+timedelta(days=dow,hours=hour)
     all_fx.append(fixture(h,a,cid,dt,f'Demo Week {week_index}', 'scheduled'))
   else:
    eligible=[t for t in CLUBS if t['division']==1 and t['country'] not in ('Saudi Arabia','Qatar','United States') and t['gender']==c['gender']]
    if cid=='uefa-super':
     # Showcase once per 2-week cycle, not every week
     if week_index%2:continue
     chosen=pairings(eligible[:16],week_index)[:1]
     dow=2
    else:
     selected=rng('europa',cid,week_index).sample(eligible,min(36,len(eligible)))
     chosen=pairings(selected,week_index)
     dow=1 if cid=='uefa-ucl' else 2 if cid=='uefa-uwcl' else 3
    for i,(h,a) in enumerate(chosen):
     # UCL Tue/Wed; Europa and Conference Thu; UWCL Wed
     weekday=(1+(i%2)) if cid=='uefa-ucl' else dow
     dt=mon+timedelta(days=weekday,hours=17 if i%3==0 else 20)
     all_fx.append(fixture(h,a,cid,dt,f'Demo European Matchday {week_index}','scheduled'))
 return sorted(all_fx,key=lambda f:f['kickoff_utc'])

@lru_cache(maxsize=4)
def cached_schedule(week_key):return schedule(parse_date(week_key))

def all_fixtures(now):return cached_schedule(iso(monday_of(now)))

def showcase(now,number=4):
 # Always-on 90-minute demo rotation. Shows active simulated matches even at 04:00.
 slot=int(now.timestamp()//5400);slot_start=datetime.fromtimestamp(slot*5400,tz=timezone.utc)
 primary=['uefa-ucl','esp-d1','eng-d1','ger-d1','uefa-uel','uefa-uecl','ita-d1','fra-d1','uefa-uwcl','sau-d1','qat-d1','usa-d1']
 # domestic/UEFA competition choice rotates automatically, even when no actual game would be played.
 ranked=primary[slot%len(primary):]+primary[:slot%len(primary)]
 chosen=[]
 for ix,cid in enumerate(ranked[:number]):
  t=TEAMS.get(cid) or TEAMS['eng-d1']
  a,b=pairings(t,slot+ix)[0]
  f=fixture(a,b,cid,slot_start,f'Always-On Demo Rotation {slot}','always_on')
  f['clock_rate']=1.0;f['showcase']=True;chosen.append(f)
 return chosen

def get_fixtures(now):return all_fixtures(now)+showcase(now)

def status(f,now):
 st=parse_date(f['kickoff_utc']);elapsed=(now-st).total_seconds();
 if elapsed<0:return 'scheduled'
 if elapsed<5400:return 'live_demo'
 return 'finished_demo'

def match_clock(f,now):return min(5400,max(0,int((now-parse_date(f['kickoff_utc'])).total_seconds())))

def goals(f):
 r=rng(f['id'],'goals');res=[]
 for side,num in [('home',f['home_score_final']),('away',f['away_score_final'])]:
  minute_pool=r.sample(range(5,90),num)
  for m in minute_pool:res.append((m*60+r.randint(0,59),side))
 return sorted(res)

def events(f):
 r=rng(f['id'],'events');ev=[]
 def add(sec,kind,side=None,actor=None,**details):
  ev.append({'id':f'{f["id"]}-event-{len(ev)+1:03d}','fixture_id':f['id'],'clock_seconds':sec,'minute':sec//60,'type':kind,'team_id':f[f'{side}_team_id'] if side else None,'player_id':actor,'details':details,'data_mode':'simulated'})
 add(0,'kickoff');add(2700,'halftime');add(2760,'second_half_start')
 for sec,side in goals(f):
  players=[p for p in SQUADS[f[f'{side}_team_id']] if p['position']!='GK'];actor=r.choice(players)['id'] if players else None
  helper=r.choice(players)['id'] if players else None
  add(sec,'goal',side,actor,assist_player_id=helper,shot_x=0.94 if side=='home' else 0.06,shot_y=r.uniform(.33,.67))
 for i in range(18):
  sec=r.randint(180,5240);side=r.choice(['home','away']);squad=SQUADS[f[f'{side}_team_id']];actor=r.choice(squad)['id']
  kind=r.choices(['foul','shot','corner','offside','yellow_card','ball_recovery','key_pass'],[5,5,3,2,2,4,4])[0]
  add(sec,kind,side,actor,x=round(r.random(),3),y=round(r.random(),3))
 for side in ['home','away']:
  sq=SQUADS[f[f'{side}_team_id']];add(r.randint(3300,4800),'substitution',side,sq[12]['id'],out_player_id=sq[4]['id'])
 if stable_int(f['id'])%3==0:
  side=r.choice(['home','away']);p=SQUADS[f[f'{side}_team_id']];op=SQUADS[f['away_team_id' if side=='home' else 'home_team_id']]
  add(r.randint(2800,4800),'penalty_awarded',side,p[9]['id'],fouling_player_id=op[3]['id'])
 add(5400,'fulltime');ev.sort(key=lambda e:(e['clock_seconds'],e['id']))
 for i,e in enumerate(ev):e['sequence']=i+1
 return ev

def live_state(f,now):
 sec=match_clock(f,now);g=[e for e in events(f) if e['type']=='goal' and e['clock_seconds']<=sec]
 return {**f,'status':status(f,now),'clock_seconds':sec,'minute':sec//60,'home_score':sum(e['team_id']==f['home_team_id'] for e in g),'away_score':sum(e['team_id']==f['away_team_id'] for e in g),'data_mode':'simulated','is_real_live_data':False}

def stats(f):
 r=rng(f['id'],'stats');p=r.randint(35,65)
 return {'fixture_id':f['id'],'home':{'possession_pct':p,'shots':r.randint(8,20),'shots_on_target':r.randint(2,9),'passes':r.randint(300,650),'fouls':r.randint(6,19),'corners':r.randint(1,11),'xg':round(r.uniform(.5,3.1),2)},'away':{'possession_pct':100-p,'shots':r.randint(6,20),'shots_on_target':r.randint(2,8),'passes':r.randint(300,650),'fouls':r.randint(6,19),'corners':r.randint(1,11),'xg':round(r.uniform(.4,3.0),2)},'data_mode':'simulated'}

def lineups(f):return {'fixture_id':f['id'],'home':{'formation':'4-3-3','starting_xi':[p['id'] for p in SQUADS[f['home_team_id']][:11]],'substitutes':[p['id'] for p in SQUADS[f['home_team_id']][11:20]]},'away':{'formation':'4-2-3-1','starting_xi':[p['id'] for p in SQUADS[f['away_team_id']][:11]],'substitutes':[p['id'] for p in SQUADS[f['away_team_id']][11:20]]},'data_mode':'simulated'}

def tracking(f,start=0,end=5400,step=5):
 # Deterministic spline-like ball path with goals pulling ball towards the goal mouth.
 # Generated on demand so every fixture has pitch playback without 800 enormous JSON files.
 start=max(0,int(start));end=min(5400,int(end));step=max(1,min(60,int(step)))
 goal_events=[e for e in events(f) if e['type']=='goal'];out=[];seed=stable_int(f['id'],'track')
 # Smooth, repeatable, coordinate-limited harmonic trajectory; event-aware scoring anchors.
 for t in range(start,end+1,step):
  x=.5+.34*math.sin(t/51+(seed%1000)/127)+.08*math.sin(t/9.3+(seed%97))
  y=.5+.33*math.sin(t/39+(seed%300)/41)+.065*math.cos(t/12.5)
  marker=None
  for e in goal_events:
   dist=abs(t-e['clock_seconds']);
   if dist<=18:
    w=max(0,1-dist/18);target=.96 if e['team_id']==f['home_team_id'] else .04
    x=x*(1-w)+target*w;y=y*(1-w)+.5*w;marker='goal' if dist<=step else 'shot'
  x=max(.015,min(.985,x));y=max(.02,min(.98,y))
  out.append({'fixture_id':f['id'],'t_seconds':t,'x':round(x,4),'y':round(y,4),'period':1 if t<=2700 else 2,'event_marker':marker,'data_mode':'synthetic_simulation'})
 return out

def mock_news(now):
 out=[]
 for i,c in enumerate(CLUBS[:90]):
  d=now-timedelta(hours=i*2+1);out.append({'id':f'news-demo-{i+1:03d}','title':f'Demo update: {c["name"]} prepare for upcoming football fixtures','club_id':c['id'],'published_at':iso(d),'source':'PitchPulse fictional demo newsroom','url':None,'is_fictional':True,'data_mode':'simulated'})
 return out

def mock_transfers(now):
 out=[]
 for i,p in enumerate(PLAYERS[100:165]):
  to=CLUBS[(i*17+40)%len(CLUBS)];out.append({'id':f'transfer-demo-{i:03d}','player_id':p['id'],'from_club_id':p['club_id'],'to_club_id':to['id'],'status':'rumour_demo' if i%3 else 'confirmed_demo_fictional','published_at':iso(now-timedelta(hours=i*3)),'is_real_transfer':False,'data_mode':'simulated'})
 return out

def fixtures_in_window(now,from_dt=None,to_dt=None):
 items=get_fixtures(now)
 if from_dt:items=[f for f in items if parse_date(f['kickoff_utc'])>=from_dt]
 if to_dt:items=[f for f in items if parse_date(f['kickoff_utc'])<=to_dt]
 return items
