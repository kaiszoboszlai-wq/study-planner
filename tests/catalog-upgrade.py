import importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('bulk',Path(__file__).resolve().parents[1]/'scripts/expand-book-catalog.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class EditionUpgrade(unittest.TestCase):
 def test_preserve_saved_id_and_editorial_metadata(self):
  old={'id':'saved-stable-id','title':'数学基礎 2024年度版','sourceTitle':'数学基礎','sourceVolume':'2024年度版','publisher':'テスト出版','published':'2024','isbn':'9784010347478','verified':True,'domain':'entrance','subject':'数学','stage':1,'skills':['数学Ⅰ・A'],'studyDays':25}
  new=dict(old,id='ndl-new-edition',title='数学基礎 2026年度版',sourceVolume='2026年度版',published='2026',isbn='9784010347461',stage=4,skills=['数学'],priceLabel='1800円')
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);catalog=root/'catalog.json';catalog.write_text(json.dumps({'books':[old]}));source=root/'source.xml';source.write_text('<searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/"><records><record><recordData/></record></records></searchRetrieveResponse>')
   with patch.object(m,'PATH',catalog),patch.object(m,'CACHE',root),patch.object(m,'record',return_value=new),patch.object(m,'classify',side_effect=lambda b:b):m.build([{'path':str(source),'label':'test'}],True)
   result=json.loads(catalog.read_text())['books'][0]
  self.assertEqual(result['id'],old['id']);self.assertEqual(result['stage'],1);self.assertEqual(result['skills'],old['skills']);self.assertEqual(result['isbn'],new['isbn']);self.assertEqual(result['sourceVolume'],'2026年度版')
if __name__=='__main__':unittest.main()
