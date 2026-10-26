import importlib.util,json,re,unittest
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('bulk',BASE/'scripts/expand-book-catalog.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Expansion(unittest.TestCase):
 def test_real_catalog(self):
  data=json.loads((BASE/'assets/book-catalog.json').read_text());rows=[b for b in data['books'] if b.get('verified') and not b.get('excludedReason')]
  self.assertGreaterEqual(len(rows),1100);self.assertEqual(len(rows),data['verifiedCount']);self.assertEqual(len(rows),data['expansion']['verified']);self.assertEqual(len(rows),len(set(m.identity(b) for b in rows)));self.assertEqual(len(rows),len(set(b['isbn'] for b in rows)))
  for b in rows:
   self.assertTrue(m.original.isbn13(b['isbn']));self.assertRegex(b['source'],r'^https://ndlsearch.ndl.go.jp/books/R100000002-I');self.assertTrue(b['sourceTitle']);self.assertTrue(b['publisher']);self.assertLessEqual(m.date_key(b['published']),(2026,10,26))
 def test_edition_and_volume_identity(self):
  base={'publisher':'出版テスト','sourceTitle':'英検3級過去6回問題集','title':'英検3級過去6回問題集','sourceVolume':'2024年度版'}
  for volume in ['2026年度版',"'26年度版",'令和8年度版','2025-2026年版']:
   self.assertEqual(m.identity(base),m.identity(dict(base,sourceVolume=volume)))
  self.assertEqual(m.identity(dict(base,sourceTitle="英検3級過去6回問題集. '24年度版")),m.identity(dict(base,sourceTitle="英検3級過去6回問題集. '26年度版")))
  self.assertNotEqual(m.identity(dict(base,sourceVolume='1')),m.identity(dict(base,sourceVolume='2')))
  self.assertNotEqual(m.identity(dict(base,sourceTitle='英単語2000')),m.identity(dict(base,sourceTitle='英単語2200')))
 def test_annual_volume_and_exact_new_exam(self):
  base={'title':'看護師国家試験問題集','sourceVolume':'2026年度版','publisher':'テスト出版','published':'2026','codes':['Y56'],'isbn':'9784010347478'}
  book=m.classify(base);self.assertEqual(book['exams'],['看護師']);self.assertIn('2026年度版',book['title']);self.assertEqual(book['availabilityStatus'],'販売状況未確認')
  self.assertIsNone(m.classify(dict(base,title='看護師のための日常業務マニュアル')))
  self.assertIsNone(m.classify(dict(base,title='センター試験国語',codes=['Y35'])))
 def test_publication_precision(self):
  self.assertEqual(m.publication_date('[2025.8]'),'2025-08');self.assertEqual(m.publication_date('[2026]'),'2026');self.assertEqual(m.publication_date('2026-04-09'),'2026-04-09')
 def test_language_format_changes(self):
  base={'title':'TOEFL iBT試験総合対策','sourceVolume':'','publisher':'テスト出版','published':'2025','codes':['Y45'],'isbn':'9784010347478'}
  self.assertIsNone(m.classify(base));self.assertIsNotNone(m.classify(dict(base,published='2026')))
  self.assertIsNone(m.classify(dict(base,title='TOEFL ITP試験対策',published='2026')))
  self.assertIsNone(m.classify(dict(base,title='TOEIC実戦問題集',published='2015')))
  self.assertIsNotNone(m.classify(dict(base,title='TOEIC単語帳',published='2015')))
 def test_qualification_grade_boundaries(self):
  base={'title':'全商簿記3級問題集','sourceVolume':'','publisher':'テスト出版','published':'2026','codes':['Y54'],'isbn':'9784010347478'}
  self.assertEqual(m.classify(base)['exams'],['全商簿記3級'])
  self.assertEqual(m.classify(dict(base,title='日商簿記1級テキスト'))['exams'],['日商簿記1級'])
  self.assertEqual(m.classify(dict(base,title='漢検5級問題集'))['exams'],['漢検5級'])
 def test_scope_and_current_format(self):
  base={'title':'愛知県公立高入試数学','sourceVolume':'','publisher':'テスト出版','published':'2026','codes':['Y33'],'isbn':'9784010347478'}
  self.assertIsNone(m.classify(base))
  self.assertIsNone(m.classify(dict(base,title='英検2級予想問題集',codes=['Y45'],published='2023')))
  valid=m.classify(dict(base,title='英検2級単語帳',codes=['Y45'],published='2023'));self.assertEqual(valid['exams'],['2級'])
  scoped=m.classify(dict(base,title='東大の数学',codes=['Y37']));self.assertEqual(scoped['examScopes'],['東京大学'])
if __name__=='__main__':unittest.main()
