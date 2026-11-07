#!/usr/bin/env python3
"""PitchPulse two-week rolling demo HTTP API. Python stdlib only. No provider credentials."""
import json,os,time,urllib.parse
from datetime import datetime,timedelta,timezone
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import demo_engine as eng

def now():return datetime.now(timezone.utc)
def enc(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode('utf-8')
def intval(v,default,lower=1,upper=1000):
 try:return min(upper,max(lower,int(v)))
 except:return default

class API(BaseHTTPRequestHandler):
 protocol_version='HTTP/1.1'
 def log_message(self,fmt,*args):pass
 def send_json(self,code,payload):
  b=enc(payload);self.send_response(code)
  self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(b)))
  self.send_header('Access-Control-Allow-Origin','*');self.send_header('Access-Control-Allow-Headers','Content-Type');self.send_header('Cache-Control','no-store')
  self.end_headers();self.wfile.write(b)
 def result(self,data,extra=None):return self.send_json(200,{'data':data,'meta':{**eng.pp_meta(),**(extra or {})}})
 def pagination(self,items,q):
  page=intval(q.get('page',['1'])[0],1,1,100000);limit=intval(q.get('limit',['30'])[0],30,1,500)
  return self.send_json(200,{'data':items[(page-1)*limit:page*limit],'pagination':{'page':page,'limit':limit,'total':len(items),'pages':(len(items)+limit-1)//limit},'meta':eng.pp_meta()})
 def do_OPTIONS(self):self.send_json(200,{'ok':True})
 def do_GET(self):
  u=urllib.parse.urlparse(self.path);q=urllib.parse.parse_qs(u.query);get=lambda name,default='':q.get(name,[default])[0]
  p=u.path.strip('/').split('/');tm=now()
  if p==['health'] or p==['api','v1','health']:return self.result({'ok':True,'clock_utc':eng.iso(tm),'mode':'mock'})
  if p==['demo']:
   content=(eng.ROOT/'docs'/'demo.html').read_bytes();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(content)));self.end_headers();self.wfile.write(content);return
  if p[:2]!=['api','v1']:return self.send_json(404,{'error':'Unknown route','example':'/api/v1/home'})
  key=p[2] if len(p)>2 else ''
  if key=='mock':
   if p[3:]==['manifest']:
    return self.result({'mode':'simulated','dataset':'PitchPulse always-on 14-day loop','clubs':len(eng.CLUBS),'players':len(eng.PLAYERS),'competitions':len(eng.COMPETITIONS),'schedule':'rolling two-week calendar, cached by ISO week','tracking':'on-demand 5-second virtual trajectories for every fixture','season_rosters_verified':False,'all_scores_fictional':True,'clock_utc':eng.iso(tm)})
   if p[3:]==['clock']:return self.result({'utc':eng.iso(tm),'rotation_index':int(tm.timestamp()//5400),'rotation_remains_seconds':5400-int(tm.timestamp()%5400)})
   if p[3:]==['showcase']:return self.result([eng.live_state(f,tm) for f in eng.showcase(tm)])
  if key=='home':
   allfx=eng.all_fixtures(tm)
   upcoming=sorted((f for f in allfx if eng.parse_date(f['kickoff_utc'])>tm),key=lambda x:x['kickoff_utc'])[:16]
   recent=sorted((f for f in allfx if eng.parse_date(f['kickoff_utc'])<tm),key=lambda x:x['kickoff_utc'],reverse=True)[:12]
   return self.result({'live_matches':[eng.live_state(f,tm) for f in eng.showcase(tm)],'upcoming_fixtures':[eng.live_state(f,tm) for f in upcoming],'recent_results':[eng.live_state(f,tm) for f in recent],'competitions':eng.COMPETITIONS,'news':eng.mock_news(tm)[:8],'transfers':eng.mock_transfers(tm)[:8],'top_players':eng.PLAYERS[:12],'fantasy_leaders':eng.load('fantasy_teams')[:10],'sections':['live','upcoming','standings','clubs','players','rankings','tracking','ai-context','fantasy','predictions','news','transfers','simulations']})
  if key=='competitions':
   if len(p)==3:return self.pagination([c for c in eng.COMPETITIONS if not get('gender') or c['gender']==get('gender')],q)
   cid=p[3];c=eng.COMP.get(cid)
   if not c:return self.send_json(404,{'error':'Competition not found'})
   if len(p)==4:return self.result(c)
   if p[4]=='clubs':return self.pagination(eng.TEAMS[cid],q)
   if p[4]=='fixtures':return self.pagination([eng.live_state(f,tm) for f in eng.all_fixtures(tm) if f['competition_id']==cid],q)
   if p[4]=='standings':
    standings=[x for x in eng.load('standings') if x['competition_id']==cid]
    standings.sort(key=lambda x:(-x['points'],-x['goal_difference'],-x['gf']))
    return self.result([{**v,'position':i+1,'club_name':eng.CLUB[v['club_id']]['name']} for i,v in enumerate(standings)],{'type':'simulated_season_baseline'})
  if key=='clubs':
   if len(p)==3:
    a=eng.CLUBS
    if get('competition'):a=[v for v in a if v['competition_id']==get('competition')]
    if get('q'):a=[v for v in a if get('q').lower() in v['name'].lower()]
    return self.pagination(a,q)
   c=eng.CLUB.get(p[3]);
   if not c:return self.send_json(404,{'error':'Club not found'})
   if len(p)==4:return self.result(c)
   if p[4]=='squad':return self.result(eng.SQUADS[c['id']],{'season_roster_verified':False})
   if p[4]=='fixtures':return self.pagination([eng.live_state(f,tm) for f in eng.all_fixtures(tm) if c['id'] in (f['home_team_id'],f['away_team_id'])],q)
  if key=='players':
   if len(p)==3:
    a=eng.PLAYERS
    if get('club'):a=eng.SQUADS[get('club')]
    if get('q'):a=[v for v in a if get('q').lower() in v['name'].lower()]
    return self.pagination(a,q)
   v=eng.PLAYER.get(p[3]);return self.result(v) if v else self.send_json(404,{'error':'Player not found'})
  if key in ('fixtures','live'):
   if key=='live':return self.pagination([eng.live_state(f,tm) for f in eng.showcase(tm)],q)
   if len(p)==3:
    a=eng.get_fixtures(tm)
    if get('competition'):a=[v for v in a if v['competition_id']==get('competition')]
    if get('club'):a=[v for v in a if get('club') in (v['home_team_id'],v['away_team_id'])]
    if get('from'):a=[v for v in a if v['kickoff_utc'][:10]>=get('from')]
    if get('to'):a=[v for v in a if v['kickoff_utc'][:10]<=get('to')]
    a=[eng.live_state(f,tm) for f in a]
    if get('status'):a=[v for v in a if v['status']==get('status')]
    a.sort(key=lambda v:v['kickoff_utc'])
    return self.pagination(a,q)
   fid=p[3];f=next((v for v in eng.get_fixtures(tm) if v['id']==fid),None)
   if not f:return self.send_json(404,{'error':'Fixture not found in current rolling window','hint':'Select a fixture from /api/v1/fixtures'})
   if len(p)==4 or p[4]=='live-state':return self.result(eng.live_state(f,tm))
   action=p[4]
   if action=='events':return self.result(eng.events(f))
   if action=='lineups':return self.result(eng.lineups(f))
   if action=='statistics':return self.result(eng.stats(f))
   if action=='tracking':
    start=intval(get('start','0'),0,0,5400);end=intval(get('end','5400'),5400,0,5400);step=intval(get('step','5'),5,1,60)
    if end<start:return self.send_json(400,{'error':'end must be >= start'})
    return self.result(eng.tracking(f,start,end,step),{'tracking_type':'fully_synthetic','recording':'algorithmic_on_demand','step_seconds':step})
   if action=='ai-context':
    sec=eng.match_clock(f,tm);return self.result({'fixture':eng.live_state(f,tm),'statistics':eng.stats(f),'events_so_far':[v for v in eng.events(f) if v['clock_seconds']<=sec],'source_is_synthetic':True,'suggested_questions':['Why is the team with less possession leading?','Who scored?','Who was booked?','Who committed the penalty foul?']})
   if action=='stream':return self.stream(f,intval(get('speed','20'),20,1,1000))
  if key=='news':return self.pagination(eng.mock_news(tm),q)
  if key=='transfers':return self.pagination(eng.mock_transfers(tm),q)
  if key=='standings':return self.pagination(eng.load('standings'),q)
  if key=='rankings':
   a=eng.load('player_ratings');a.sort(key=lambda x:-x['rating']);return self.pagination(a,q)
  if key=='scout':return self.pagination(eng.load('scouting_stats'),q)
  if key=='simulations':return self.result(eng.load('simulations'))
  if key=='fantasy':
   teams=eng.load('fantasy_teams');teams.sort(key=lambda x:-x['total_points']);return self.pagination(teams,q)
  if key=='predictions':
   fixtures=eng.all_fixtures(tm)[:200];a=[]
   for i,f in enumerate(fixtures):
    r=eng.rng(f['id'],'pred');a.append({'id':f'demo-pred-{i:04d}','fixture_id':f['id'],'user_id':f'demo-user-{i%40+1:03d}','predicted_home':r.randint(0,4),'predicted_away':r.randint(0,3),'points':r.randint(0,12),'data_mode':'simulated'})
   return self.pagination(a,q)
  return self.send_json(404,{'error':'Unknown endpoint','path':u.path})
 def stream(self,f,speed):
  ev=eng.events(f);self.send_response(200)
  self.send_header('Content-Type','text/event-stream');self.send_header('Cache-Control','no-cache');self.send_header('Access-Control-Allow-Origin','*');self.send_header('Connection','close');self.end_headers()
  try:
   self.wfile.write(b'event: metadata\ndata: '+enc({'fixture_id':f['id'],'speed':speed,**eng.pp_meta()})+b'\n\n');self.wfile.flush()
   last=0
   for e in ev:
    d=max(0,e['clock_seconds']-last);time.sleep(min(d/max(speed,1),2.0))
    self.wfile.write(b'event: match_event\ndata: '+enc(e)+b'\n\n');self.wfile.flush();last=e['clock_seconds']
  except (BrokenPipeError,ConnectionResetError):pass

if __name__=='__main__':
 port=int(os.getenv('PORT','8089'));print(f'PitchPulse simulated demo API: http://127.0.0.1:{port}/demo\nNo API keys needed',flush=True)
 ThreadingHTTPServer(('127.0.0.1',port),API).serve_forever()
