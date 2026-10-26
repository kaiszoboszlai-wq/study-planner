"""Collect TAC publisher covers only for book introductions with official product links.

Policy: https://www.tac-school.co.jp/copyright/permission.html
Public product search uses the store's normal session and search form parameters.
No login, private data, affiliate credentials or third-party retailer images.
"""
import concurrent.futures,datetime,hashlib,html,io,json,pathlib,re,threading,time,unicodedata
from http.cookiejar import CookieJar
from urllib.request import Request,build_opener,HTTPCookieProcessor
from urllib.parse import urlencode,urlparse
from PIL import Image

ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'assets/book-covers';OUT.mkdir(exist_ok=True)
CACHE=ROOT/'work/tac-covers';CACHE.mkdir(parents=True,exist_ok=True)
NOW=datetime.datetime.now(datetime.timezone.utc);TERMS='https://www.tac-school.co.jp/copyright/permission.html'
denied=set(json.loads((ROOT/'assets/book-cover-denylist.json').read_text()))
catalog=json.loads((ROOT/'assets/book-catalog.json').read_text())['books']
books={b['isbn']:b for b in catalog if b.get('verified') and b['publisher'].startswith('TAC') and b['isbn'] not in denied}
local=threading.local();lock=threading.Lock();last=[0.0]
def pace():
 with lock:
  delay=.3-(time.monotonic()-last[0])
  if delay>0:time.sleep(delay)
  last[0]=time.monotonic()
def opener():
 if not hasattr(local,'opener'):
  local.opener=build_opener(HTTPCookieProcessor(CookieJar()))
  pace();local.opener.open(Request('https://bookstore.tac-school.co.jp/book/detail/001019',headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read()
 return local.opener
def get(url,ajax=False):
 op=opener();pace();headers={'User-Agent':'Mozilla/5.0'}
 if ajax:headers.update({'X-Requested-With':'XMLHttpRequest','Accept':'application/json','Referer':'https://bookstore.tac-school.co.jp/book/detail/001019'})
 with op.open(Request(url,headers=headers),timeout=20) as response:
  host=urlparse(response.geturl()).hostname
  if host not in ['bookstore.tac-school.co.jp','www.tac-school.co.jp']:raise ValueError('unexpected host')
  data=response.read(8*1024*1024+1)
  if len(data)>8*1024*1024:raise ValueError('too large')
  return data
def normalize(value):
 value=unicodedata.normalize('NFKC',value)
 value=re.sub(r'20\d{2}\s*年(?:度)?(?:版)?|(?:第)?\d+版','',value)
 return re.sub(r'[\s:：・+＋,，.．「」『』<>\[\]［］【】()（）!！?？/\-—‐]','',value).lower()
terms=get(TERMS).decode();text=html.unescape(re.sub('<[^>]+>',' ',terms))
if '当社の出版物をご紹介いただく場合には' not in text or '許諾は必要ありません' not in text:raise RuntimeError('Re-review TAC policy before collecting')
(CACHE/'permission.html').write_text(terms)
def collect(pair):
 isbn,book=pair;record=CACHE/(isbn+'.json')
 try:
  cache=json.loads(record.read_text()) if record.exists() else None
  if cache and cache.get('schemaVersion')==2 and cache.get('checkedAt','')[:10]==NOW.strftime('%Y-%m-%d'):
   return cache.get('entry'),cache.get('status')
  url='https://bookstore.tac-school.co.jp/book/search?'+urlencode({'q':isbn,'search_by_q':1,'dl_type':'','page':1,'limit':16})
  data=json.loads(get(url,True));links=list(dict.fromkeys(re.findall(r'https://bookstore\.tac-school\.co\.jp/book/detail/\d{6}',data.get('itemView',''))))
  if not links:result={'status':'not_found','entry':None}
  else:
   result={'status':'not_matched','entry':None}
   for link in links[:4]:
    page=get(link).decode('utf-8','replace');plain=html.unescape(re.sub(r'\s+',' ',re.sub('<[^>]+>',' ',page)))
    code=link.rsplit('/',1)[-1]
    if not re.search(r'ISBNコード[^\d]{0,30}'+isbn,plain):continue
    titlematch=re.search(r'<title\b[^>]*>(.*?)</title>',page,re.S)
    title=html.unescape(re.sub('<[^>]+>',' ',titlematch[1])).split('|',1)[0].strip() if titlematch else ''
    expected=[book['title'],book.get('sourceTitle','')]
    if not title or not any(normalize(value) and (normalize(value) in normalize(title) or normalize(title) in normalize(value)) for value in expected):continue
    images=re.findall(r'<img[^>]+src="(https://bookstore\.tac-school\.co\.jp/storage/common/images/cover/\d+/'+code+r'\.(?:jpg|png|webp))"',page)
    if not images:continue
    source=images[0];raw=get(source)
    with Image.open(io.BytesIO(raw)) as img:
     extension={'JPEG':'.jpg','PNG':'.png','WEBP':'.webp'}.get(img.format)
     if not extension or min(img.size)<40 or max(img.size)>10000:continue
     img.verify()
    filename=isbn+extension;(OUT/filename).write_bytes(raw)
    entry={'isbn':isbn,'path':'assets/book-covers/'+filename,'title':title,'publisher':book['publisher'],'catalogTitles':[book['title']],'source':source,'metadataSource':link,'provider':'TAC','terms':TERMS,'purpose':'本の紹介（公式商品ページへのリンクを併記）','productUrl':link,'checkedAt':NOW.isoformat(),'validUntil':(NOW+datetime.timedelta(days=7)).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'policySha256':hashlib.sha256(terms.encode()).hexdigest()}
    result={'status':'downloaded','entry':entry};break
  result['checkedAt']=NOW.isoformat();result['schemaVersion']=2;record.write_text(json.dumps(result,ensure_ascii=False,indent=2));return result['entry'],result['status']
 except Exception as error:
  return None,'error:'+type(error).__name__
entries={};statuses={}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for index,(entry,status) in enumerate(pool.map(collect,books.items()),1):
  statuses[status]=statuses.get(status,0)+1
  if entry:entries[entry['isbn']]=entry
  if index%20==0 or index==len(books):print(f'Checked {index}/{len(books)} TAC ISBNs, matched {len(entries)}',flush=True)
file=ROOT/'assets/book-covers.json';manifest=json.loads(file.read_text())
manifest['entries']={isbn:e for isbn,e in manifest['entries'].items() if e['provider']!='TAC' and isbn not in denied}
for isbn,entry in entries.items():
 entry['catalogTitles']=list(dict.fromkeys(b['title'] for b in catalog if b.get('isbn')==isbn and b['publisher'].startswith('TAC') and any(normalize(value) and (normalize(value) in normalize(entry['title']) or normalize(entry['title']) in normalize(value)) for value in [b['title'],b.get('sourceTitle','')])))
manifest['entries'].update(entries);manifest['downloadedCovers']=len(manifest['entries']);manifest['downloadedBytes']=sum(e['bytes'] for e in manifest['entries'].values())
manifest['providers']={provider:sum(e['provider']==provider for e in manifest['entries'].values()) for provider in {e['provider'] for e in manifest['entries'].values()}}
manifest['lastUpdatedAt']=NOW.isoformat();manifest['providerTerms']={'openBD':'https://openbd.jp/terms/','TAC':TERMS};manifest['use']='提供元別の本の紹介条件に従い、無加工の原画像と出典を保持。7日以内に再確認。'
manifest['tacCollection']={'checkedAt':NOW.isoformat(),'candidates':len(books),'statuses':statuses,'downloaded':len(entries),'terms':TERMS}
file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
keep={pathlib.Path(e['path']).name for e in manifest['entries'].values()}
for item in OUT.iterdir():
 if item.is_file() and item.name not in keep:item.unlink()
print(json.dumps({'total':manifest['downloadedCovers'],'providers':manifest['providers'],'statuses':statuses},ensure_ascii=False),flush=True)
