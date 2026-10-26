"""Editorial metadata (separate from bibliographic facts); run after refresh."""
import json,re,importlib.util
from pathlib import Path
path=Path(__file__).resolve().parents[1]/'assets/book-catalog.json'
spec=importlib.util.spec_from_file_location('bulk',path.parents[1]/'scripts/expand-book-catalog.py');bulk=importlib.util.module_from_spec(spec);spec.loader.exec_module(bulk)
data=json.loads(path.read_text())
for book in data['books']:
 if book.get('verified') and book.get('published'):
  raw=book['published'];normalized=bulk.publication_date(raw)
  if normalized and normalized!=raw:book.setdefault('sourcePublished',raw);book['published']=normalized
 if book['subject']=='物理':
  tags=[topic for topic in ['力学','波動','熱','電磁気','原子'] if topic in book['title'].replace('熱力学','熱')]
  if tags:book['skills']=list(dict.fromkeys([s for s in book['skills'] if s not in ['力学','波動','熱','電磁気','原子']]+tags))
 if book['subject']=='数学':
  title=book['title'].replace('Ⅲ','3').replace('Ⅱ','2').replace('Ⅰ','1')
  tags=[]
  if re.search('数学1|数学Ⅰ',title) or '数学Ⅰ・A' in book['skills']:tags+=['二次関数','図形','確率','整数','データ']
  if re.search('数学2|数学Ⅱ',title) or '数学Ⅱ・B' in book['skills']:tags+=['三角関数','指数対数','微分積分','数列','ベクトル','統計']
  if re.search('数学3|数学Ⅲ',title):tags+=['極限','微分積分','複素数','曲線']
  book['skills']=list(dict.fromkeys(book['skills']+tags))
 if book['domain']=='junior' and book['subject']=='英語':book['skills']=list(dict.fromkeys(book['skills']+['文法','単語','長文']))
 if book['domain']=='junior' and book['subject']=='数学':
  tags=['図形','データ']
  if not book['title'].startswith(('中1','中2')):tags+=['二次関数']
  if not book['title'].startswith('中1'):tags+=['確率']
  book['skills']=list(dict.fromkeys(book['skills']+tags))
 book['editorialNote']='難易度・分野タグ・学習日数はアプリ編集上の目安。出版社による保証ではありません。'
data['verifiedCount']=sum(bool(b.get('verified')) and not b.get('excludedReason') for b in data['books'])
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Verified usable:',data['verifiedCount'],'of',len(data['books']))
