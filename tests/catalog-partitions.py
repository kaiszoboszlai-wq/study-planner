import importlib.util,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('collector',Path(__file__).resolve().parents[1]/'scripts/collect-comprehensive-catalog.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
class DatePartitions(unittest.TestCase):
 def test_single_year_over_limit_partitions_by_month(self):
  with patch.object(c.m,'fetch',return_value={'total':601}):
   leaves,jobs,failed=c.collect(('test','ndlc=Y35','2026','2026'))
  self.assertFalse(leaves);self.assertFalse(failed);self.assertEqual([j[2:] for j in jobs],[('2026-01','2026-06'),('2026-07','2026-12')])
 def test_only_complete_leaf_is_retained(self):
  with patch.object(c.m,'fetch',side_effect=[{'total':400},{'total':400,'path':'verified-response.xml'}]):
   leaves,jobs,failed=c.collect(('test','ndlc=Y35','2025','2026'))
  self.assertEqual(len(leaves),1);self.assertEqual(leaves[0]['path'],'verified-response.xml');self.assertFalse(jobs or failed)
 def test_empty_search_is_a_complete_partition(self):
  with patch.object(c.m,'fetch',return_value={'total':0,'path':'empty-response.xml'}):leaves,jobs,failed=c.collect(('test','title="no match"','2026','2026'))
  self.assertEqual(len(leaves),1);self.assertFalse(jobs or failed)
 def test_failure_stays_explicit(self):
  job=('test','ndlc=Y35','2025','2026')
  with patch.object(c.m,'fetch',return_value=None):leaves,jobs,failed=c.collect(job)
  self.assertEqual(failed,[job]);self.assertFalse(leaves or jobs)
if __name__=='__main__':unittest.main()
