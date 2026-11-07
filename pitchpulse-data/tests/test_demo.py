import sys,unittest
from datetime import datetime,timezone,timedelta
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import demo_engine as e
class DemoTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.now=datetime(2026,11,7,9,30,tzinfo=timezone.utc)
  cls.fs=e.all_fixtures(cls.now)
 def test_competitions(self):
  self.assertGreaterEqual(len(e.COMPETITIONS),40)
  for key in ['eng-d1','eng-d2','eng-d3','esp-d1','esp-d2','esp-d3','uefa-ucl','uefa-uel','uefa-uecl','uefa-uwcl','sau-d1','qat-d1','usa-d1']:
   self.assertIn(key,e.COMP)
 def test_calendar_two_weekends_and_uefa(self):
  anchor=e.monday_of(self.now)
  for week in (0,1):
   base=anchor+timedelta(weeks=week)
   for comp,day in [('eng-d1',5),('uefa-ucl',1),('uefa-uel',3),('uefa-uecl',3)]:
    all_comp=[f for f in self.fs if f['competition_id']==comp and e.parse_date(f['kickoff_utc']).date()==(base+timedelta(days=day)).date()]
    self.assertTrue(all_comp,(comp,week,day))
 def test_every_fixture_has_coordinates(self):
  for f in (self.fs[0],self.fs[len(self.fs)//2],self.fs[-1]):
   coords=e.tracking(f,0,5400,5);self.assertEqual(len(coords),1081)
   self.assertTrue(all(0<=p['x']<=1 and 0<=p['y']<=1 for p in coords))
 def test_goals_consistent(self):
  f=self.fs[7];gs=[x for x in e.events(f) if x['type']=='goal']
  self.assertEqual(len(gs),f['home_score_final']+f['away_score_final'])
  fin=e.live_state(f,e.parse_date(f['kickoff_utc'])+timedelta(hours=2))
  self.assertEqual((fin['home_score'],fin['away_score']),(f['home_score_final'],f['away_score_final']))
 def test_always_on(self):
  for h in range(24):
   tm=datetime(2027,2,18,h,30,tzinfo=timezone.utc)
   self.assertGreater(len(e.showcase(tm)),0)
   self.assertTrue(all(e.live_state(f,tm)['status']=='live_demo' for f in e.showcase(tm)))
 def test_determinism(self):
  f=self.fs[0];self.assertEqual(e.events(f),e.events(f));self.assertEqual(e.tracking(f,0,90,5),e.tracking(f,0,90,5))
 def test_transparency(self):
  self.assertFalse(e.pp_meta()['is_real_live_data'])
  self.assertTrue(all(f['is_real_live_data'] is False for f in self.fs[:100]))
if __name__=='__main__':unittest.main()
