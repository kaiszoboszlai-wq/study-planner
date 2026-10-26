"""Download unmodified openBD covers for book introductions, with ISBN/title checks.

Re-run at least weekly. Removal requests go in assets/book-cover-denylist.json;
the next run removes those files and manifest entries. No image-search scraping.
"""
import concurrent.futures,datetime,hashlib,io,json,pathlib,re,time,unicodedata
from urllib.request import Request,urlopen
from urllib.parse import urlparse
from PIL import Image

ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=ROOT/'work'/'cover-api';CACHE.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'assets'/'book-covers';OUT.mkdir(parents=True,exist_ok=True)
NOW=datetime.datetime.now(datetime.timezone.utc)
DENIED=set(json.loads((ROOT/'assets'/'book-cover-denylist.json').read_text()))
def norm(value):
 return re.sub(r'[\s・:：+＋,，.．「」『』〈〉<>\[\]［］【】()（）!！?？\-—‐]','',unicodedata.normalize('NFKC',re.sub(r'\([Rr]\)|®','',str(value or '')))).lower()
def valid_isbn(value):
 return bool(re.fullmatch(r'97[89]\d{10}',value)) and sum(int(x)*(3 if i%2 else 1) for i,x in enumerate(value))%10==0
books={}
for book in json.loads((ROOT/'assets'/'book-catalog.json').read_text())['books']:
 isbn=book.get('isbn','')
 if book.get('verified') and valid_isbn(isbn) and isbn not in DENIED:books.setdefault(isbn,[]).append(book)
isbns=sorted(books)
chunks=[isbns[i:i+100] for i in range(0,len(isbns),100)]
def fetch(url,cover=False):
 with urlopen(Request(url,headers={'User-Agent':'StudyPlanner-BookIntroduction/1.0'}),timeout=25) as response:
  if cover and urlparse(response.geturl()).hostname!='cover.openbd.jp':raise ValueError('unexpected image host')
  data=response.read(8*1024*1024+1)
  if len(data)>8*1024*1024:raise ValueError('response too large')
  return data
def batch(chunk):
 key=hashlib.sha256(','.join(chunk).encode()).hexdigest();file=CACHE/(NOW.strftime('%Y-%m-%d')+'-'+key+'.json')
 for attempt in range(3):
  try:
   if file.exists():data=json.loads(file.read_text())
   else:
    data=json.loads(fetch('https://api.openbd.jp/v1/get?isbn='+','.join(chunk)));file.write_text(json.dumps(data,ensure_ascii=False))
   if not isinstance(data,list) or len(data)!=len(chunk):raise ValueError('invalid batch')
   return [(isbn,row) for isbn,row in zip(chunk,data)],None
  except Exception as error:
   if attempt<2:time.sleep(.5*(attempt+1))
   else:return [],type(error).__name__
raw=[];failures=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for index,(rows,error) in enumerate(pool.map(batch,chunks),1):
  raw.extend(rows)
  if error:failures.append(error)
  if index%10==0 or index==len(chunks):print(f'Checked {min(index*100,len(isbns))}/{len(isbns)} ISBNs',flush=True)
def collect(pair):
 isbn,row=pair;summary=row.get('summary',{}) if isinstance(row,dict) else {}
 cover=summary.get('cover','');url=urlparse(cover)
 if summary.get('isbn')!=isbn or url.scheme!='https' or url.hostname!='cover.openbd.jp' or url.username or url.password or url.port:return None
 titles={norm(summary.get('title')),norm(str(summary.get('title',''))+' '+str(summary.get('volume','')))}
 matched=[b for b in books[isbn] if any(norm(value) in titles for k in ('title','sourceTitle') if b.get(k) for value in (b[k],re.split(r'[:：]',b[k])[0]))]
 if not matched:return None
 try:
  data=fetch(cover,cover=True)
  with Image.open(io.BytesIO(data)) as img:
   extension={'JPEG':'.jpg','PNG':'.png','GIF':'.gif','WEBP':'.webp'}.get(img.format)
   if not extension or min(img.size)<40 or max(img.size)>10000:return None
   img.verify()
  filename=isbn+extension;(OUT/filename).write_bytes(data)
  return isbn,{'path':'assets/book-covers/'+filename,'isbn':isbn,'title':summary['title'],'publisher':summary.get('publisher',''),'catalogTitles':list({b['title'] for b in matched}),'source':cover,'metadataSource':'https://api.openbd.jp/v1/get?isbn='+isbn,'provider':'openBD','terms':'https://openbd.jp/terms/','purpose':'本の紹介','checkedAt':NOW.isoformat(),'validUntil':(NOW+datetime.timedelta(days=7)).isoformat(),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
 except Exception:return None
previous=json.loads((ROOT/'assets'/'book-covers.json').read_text()) if (ROOT/'assets'/'book-covers.json').exists() else {}
entries={isbn:e for isbn,e in previous.get('entries',{}).items() if e.get('provider')!='openBD' and isbn not in DENIED and datetime.datetime.fromisoformat(e['validUntil'])>NOW and (ROOT/e['path']).exists()}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for result in pool.map(collect,raw):
  if result:entries[result[0]]=result[1]
keep={pathlib.Path(e['path']).name for e in entries.values()}
for file in OUT.iterdir():
 if file.is_file() and file.name not in keep:file.unlink()
report={'checkedAt':NOW.isoformat(),'catalogIsbns':len(isbns),'queriedIsbns':len(raw),'apiBatchFailures':len(failures),'providedCoverCount':sum(bool((r or {}).get('summary',{}).get('cover')) for _,r in raw),'downloadedCovers':len(entries),'downloadedBytes':sum(e['bytes'] for e in entries.values()),'terms':'https://openbd.jp/terms/','use':'本の紹介目的・無加工・7日以内に再確認','providers':{provider:sum(e['provider']==provider for e in entries.values()) for provider in {e['provider'] for e in entries.values()}},'entries':entries}
(ROOT/'assets'/'book-covers.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='entries'},ensure_ascii=False),flush=True)
