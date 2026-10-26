"""Build-time bibliographic verification. No model or API key is used.
NDL metadata use: https://ndlsearch.ndl.go.jp/help/api
Only exact/contained title matches from the same publisher are accepted.
Review collected editions before publication; missing matches stay disabled.
"""
import concurrent.futures,json,re,time,threading,hashlib,sys,unicodedata,urllib.request,urllib.parse,xml.etree.ElementTree as ET
from pathlib import Path
PATH=Path(__file__).resolve().parents[1]/'assets/book-catalog.json'
NS={'dc':'http://purl.org/dc/elements/1.1/','ndl':'http://ndl.go.jp/dcndl/terms/','dt':'http://purl.org/dc/terms/'}
def norm(v):
 v=unicodedata.normalize('NFKC',v.replace('Ⅲ','3').replace('Ⅱ','2').replace('Ⅰ','1')).lower()
 return re.sub(r'[^\w]','',v)
def isbn13(v):
 v=re.sub('[^0-9X]','',v)
 if len(v)==10:
  v='978'+v[:9];v+=str((-sum(int(c)*(1 if i%2==0 else 3) for i,c in enumerate(v)))%10)
 return v if re.fullmatch(r'97[89]\d{10}',v) and sum(int(c)*(1 if i%2==0 else 3) for i,c in enumerate(v))%10==0 else ''
def title_key(v):
 v=re.sub(r'大学入試問題集|大学入試|大学受験|[\[［].*?[\]］]','',v)
 return norm(v)
LOCKS={};GUARD=threading.Lock()
def search_title(title):
 for key in ['英文法レベル別問題集','全レベル問題集','英語長文ポラリス','入門問題精講','基礎問題精講','標準問題精講','チャート式','漢字学習ステップ','過去6回全問題集']:
  if key in title:return key
 return re.sub('大学入試 |高校入試 ','',title)
def get_xml(url):
 cache=PATH.parents[1]/'work'/'ndl-cache';cache.mkdir(parents=True,exist_ok=True)
 file=cache/(hashlib.sha256(url.encode()).hexdigest()+'.xml')
 with GUARD:lock=LOCKS.setdefault(url,threading.Lock())
 with lock:
  if file.exists():return ET.fromstring(file.read_bytes())
  if '--cached-only' in sys.argv:raise RuntimeError('not cached')
  req=urllib.request.Request(url,headers={'User-Agent':'StudyPlannerCatalog/1.0'})
  for attempt in range(3):
   try:
    raw=urllib.request.urlopen(req,timeout=20).read();root=ET.fromstring(raw);file.write_bytes(raw);time.sleep(1);return root
   except Exception:
    if attempt==2:raise
    time.sleep(2*(attempt+1))

def verify(b):
 if b.get('excludedReason'):return b
 if b.get('verified') and '--recheck' not in sys.argv:return b
 original=dict(b)
 q=urllib.parse.urlencode({'title':search_title(b['title']),'cnt':100,'from':'2015','dpid':'iss-ndl-opac'})
 url='https://ndlsearch.ndl.go.jp/api/opensearch?'+q
 try:
  root=get_xml(url);matches=[]
  for item in root.findall('./channel/item'):
   title=item.findtext('dc:title','',NS);publisher=item.findtext('dc:publisher','',NS);issued=item.findtext('dt:issued','',NS)
   volume=item.findtext('ndl:volume','',NS);a,c=title_key(b['title']),title_key(title.split(' : ')[0]);publisherOK=norm(b['publisher']) in norm(publisher) or (b['publisher']=='TAC出版' and 'tac' in norm(publisher)) or (b['publisher']=='学研' and ('学研' in publisher or 'gakken' in publisher.lower()))
   # Full title or a main title identical apart from punctuation; no fuzzy subject matching.
   series=False
   if '英文法レベル別問題集' in b['title']:
    expected=re.search(r'問題集 (\d)',b['title']).group(1);series='英文法レベル別問題集' in title and volume==expected
   elif '英語長文ポラリス' in b['title']:
    expected=re.search(r'［(\d)',b['title']).group(1);series='英語長文ポラリス' in title and volume==expected
   elif '全レベル問題集' in b['title']:
    expected=re.search(r'英語長文 (\d)',b['title']).group(1);series='全レベル問題集英語長文' in title_key(title) and volume==expected
   is_series=any(t in b['title'] for t in ['英文法レベル別問題集','英語長文ポラリス','全レベル問題集'])
   if not publisherOK or not (series if is_series else a==c):continue
   if not is_series and volume and not re.match(r'^20\d\d',volume) and norm(volume) not in norm(b['title']):continue
   # Skip future publication records.
   parts=[int(n) for n in re.findall(r'\d+',issued)]
   if parts and tuple((parts+[1,1])[:3])>(2026,10,25):continue
   isbn=next((isbn13(e.text or '') for e in item.findall('dc:identifier',NS) if 'ISBN' in str(e.attrib) and isbn13(e.text or '')),'')
   if not isbn:continue
   price=item.findtext('ndl:price','',NS);edition=item.findtext('ndl:edition','',NS)
   matches.append((issued,dict(sourceTitle=title,sourceVolume=volume,publisher=publisher,isbn=isbn,edition=edition,published=issued,source=item.findtext('link',''),priceLabel=price,price=None,verified=True,verifiedAt=time.strftime('%Y-%m-%d'),metadataStatus='国立国会図書館サーチの書誌情報と照合済み。最新版・販売価格は購入前に確認')))
  if matches:b.update(max(matches,key=lambda x:tuple(int(n) for n in re.findall(r'\d+',x[0])))[1]);b.pop('verificationNote',None)
  else:b['verified']=False;b['verificationNote']='2015年以降の書誌で書名・出版社が一致するISBNを確認できず。提案対象外。'
 except Exception as e:
  if original.get('verified'):return original
  b['verificationNote']=type(e).__name__+'：未確認のため提案対象外'
 print(b['id'], 'OK' if b.get('verified') else 'pending',flush=True)
 if '--cached-only' not in sys.argv:time.sleep(1)
 return b
if __name__=='__main__':
 data=json.loads(PATH.read_text())
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  for task in concurrent.futures.as_completed([pool.submit(verify,dict(b)) for b in data['books']]):
   book=task.result()
   data['books'][next(i for i,b in enumerate(data['books']) if b['id']==book['id'])]=book
   PATH.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print('Verified',sum(bool(b.get('verified')) for b in data['books']),'/',len(data['books']))
