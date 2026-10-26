import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('registry',Path(__file__).resolve().parents[1]/'scripts/build-book-registry.py');r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
class Registry(unittest.TestCase):
 def test_school_bibliographies_can_be_archived_without_route_suitability(self):
  b={'title':'大学入試数学問題集','sourceVolume':'2005年度版','publisher':'テスト出版','published':'2004','codes':['Y37'],'isbn':'9784010347478'}
  self.assertTrue(r.eligible(b));self.assertIsNone(r.m.classify(b))
 def test_no_generic_professional_manuals(self):
  b={'title':'業務マニュアル','sourceVolume':'','publisher':'テスト出版','published':'2026','codes':['Y54'],'isbn':'9784010347478'}
  self.assertFalse(r.eligible(b));self.assertFalse(r.eligible(dict(b,title='数学指導書',codes=['Y37'])))
if __name__=='__main__':unittest.main()
