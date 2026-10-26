"""Import exact NDL records from a known middle-school textbook series."""
import importlib.util,json,re,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('refresh',Path(__file__).with_name('refresh-book-catalog.py'));r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
url='https://ndlsearch.ndl.go.jp/api/opensearch?'+r.urllib.parse.urlencode({'title':'ひとつひとつわかりやすく','cnt':100,'from':'2023','dpid':'iss-ndl-opac'})
root=r.get_xml(url);found={}
for item in root.findall('./channel/item'):
 title=item.findtext('dc:title','',r.NS);main=title.split(' : ')[0];publisher=item.findtext('dc:publisher','',r.NS);issued=item.findtext('dt:issued','',r.NS)
 if not re.search(r'^(中[123学]|高校入試)',main):continue
 if issued and issued[:4]<'2023':continue
 if not ('学研' in publisher or 'gakken' in publisher.lower()):continue
 subject=next((s for s in ['英語','数学','国語','理科','社会'] if s in main),'')
 if not subject:
  if any(s in main for s in ['地理','歴史','公民']):subject='社会'
  else:continue
 isbn=next((r.isbn13(e.text or '') for e in item.findall('dc:identifier',r.NS) if 'ISBN' in str(e.attrib) and r.isbn13(e.text or '')),'')
 if not isbn:continue
 volume=item.findtext('ndl:volume','',r.NS);key=r.norm(main+volume);date=tuple(int(n) for n in re.findall(r'\d+',issued))
 book=dict(title=main+((' '+volume) if volume else ''),sourceTitle=title,sourceVolume=volume,publisher=publisher,subject=subject,domain='junior',stage=2 if re.match(r'^(高校入試|中[23])',main) else 1,skills=[subject],studyDays=30,price=None,priceLabel=item.findtext('ndl:price','',r.NS),isbn=isbn,exams=[],source=item.findtext('link',''),published=issued,edition=item.findtext('ndl:edition','',r.NS),verified=True,verifiedAt='2026-10-25',metadataStatus='国立国会図書館サーチの書誌情報から収録。最新版・価格は購入前に確認')
 if key not in found or date>found[key][0]:found[key]=(date,book)
data=json.loads(r.PATH.read_text());known={b['isbn'] for b in data['books'] if b.get('verified')};added=0
for date,b in found.values():
 if b['isbn'] in known:continue
 b['id']='ndl-'+b['isbn'];data['books'].append(b);known.add(b['isbn']);added+=1
r.PATH.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print('Imported',added,'verified junior books')
