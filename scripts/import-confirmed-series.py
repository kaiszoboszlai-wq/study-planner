"""Import reviewed exact series titles from collected NDL bibliographies."""
import importlib.util,json,re,xml.etree.ElementTree as ET
from pathlib import Path
spec=importlib.util.spec_from_file_location('refresh',Path(__file__).with_name('refresh-book-catalog.py'));r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
data=json.loads(r.PATH.read_text());known={b['isbn'] for b in data['books'] if b.get('verified')};found={}
subjects={'世界史':['通史'],'日本史':['通史'],'政治・経済':['政治','経済'],'現代文':['現代文'],'古文':['古文'],'化学':['理論','無機','有機'],'物理':['力学','波動','熱','電磁気','原子'],'生物':['生物基礎','遺伝','代謝','生態']}
for file in (r.PATH.parents[1]/'work'/'ndl-cache').glob('*.xml'):
 for item in ET.parse(file).findall('./channel/item'):
  title=item.findtext('dc:title','',r.NS);main=title.split(' : ')[0];publisher=item.findtext('dc:publisher','',r.NS);issued=item.findtext('dt:issued','',r.NS)
  match=re.fullmatch(r'(世界史|日本史|政治・経済|現代文|古文|物理〈物理基礎・物理〉|化学〈化学基礎・化学〉|生物〈生物基礎・生物〉)(入門|基礎|標準)問題精講',main)
  if not match or publisher!='旺文社':continue
  if issued and tuple((list(map(int,re.findall(r'\d+',issued)))+[1,1])[:3])>(2026,10,25):continue
  subject=match[1].split('〈')[0];date=tuple(map(int,re.findall(r'\d+',issued)))
  isbn=next((r.isbn13(e.text or '') for e in item.findall('dc:identifier',r.NS) if 'ISBN' in str(e.attrib) and r.isbn13(e.text or '')),'')
  if not isbn:continue
  b=dict(title=main,sourceTitle=title,sourceVolume=item.findtext('ndl:volume','',r.NS),publisher=publisher,subject='国語' if subject in ['現代文','古文'] else '政治経済' if subject=='政治・経済' else subject,domain='entrance',stage={'入門':1,'基礎':2,'標準':4}[match[2]],skills=subjects[subject],studyDays=30,price=None,priceLabel=item.findtext('ndl:price','',r.NS),isbn=isbn,exams=[],source=item.findtext('link',''),published=issued,edition=item.findtext('ndl:edition','',r.NS),verified=True,verifiedAt='2026-10-25',metadataStatus='国立国会図書館サーチの書誌情報から収録。最新版・価格は購入前に確認')
  if main not in found or date>found[main][0]:found[main]=(date,b)
added=0
for date,b in found.values():
 if b['isbn'] in known:continue
 b['id']='ndl-'+b['isbn'];known.add(b['isbn']);data['books'].append(b);added+=1
r.PATH.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print('Imported',added,'reviewed series books')
