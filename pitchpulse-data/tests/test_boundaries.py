import unittest,sys
from pathlib import Path
from datetime import datetime,timezone,timedelta
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import demo_engine as e
class BoundaryTests(unittest.TestCase):
 def test_year_month_and_rotation_boundaries(self):
  for date in ['2026-12-31T23:59:59+00:00','2027-01-01T00:00:00+00:00','2028-02-29T00:00:00+00:00']:
   now=datetime.fromisoformat(date)
   for shift in [-1,0,1]:
    tm=now+timedelta(seconds=shift)
    fixtures=e.showcase(tm)
    self.assertTrue(fixtures)
    for fixture in fixtures:
     state=e.live_state(fixture,tm)
     self.assertEqual(state['status'],'live_demo')
     self.assertFalse(state['is_real_live_data'])
 def test_replay_is_independent_of_fetch_time(self):
  fixture=e.all_fixtures(datetime(2026,12,31,tzinfo=timezone.utc))[0]
  first=e.tracking(fixture,0,180,5)
  self.assertEqual(first,e.tracking(fixture,0,180,5))
  self.assertTrue(all(0<=sample['x']<=1 and 0<=sample['y']<=1 for sample in first))
