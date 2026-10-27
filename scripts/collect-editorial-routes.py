"""Collect factual book/level/order references, not articles, images or video transcripts."""
import concurrent.futures,datetime,hashlib,json,re,sys,unicodedata,urllib.request,urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'work/admissions/vendor'));from bs4 import BeautifulSoup
CACHE=ROOT/'work/editorial-routes';CACHE.mkdir(exist_ok=True);today=datetime.date.today().isoformat()
books=json.loads((ROOT/'assets/book-catalog.json').read_text())['books'];sources=[];recommendations=[];errors=[]
def norm(s):
 s=unicodedata.normalize('NFKC',str(s)).replace('III','3').replace('II','2').replace('I','1')
 s=re.sub(r'(?:第)?[0-9一二三四五六七八九十]+(?:訂|改訂)?版|改訂版|新課程(?:版|対応)?','',s)
 return re.sub(r'[^\w]','',s.lower())
def get(url):
 u=urllib.parse.urlsplit(url);url=urllib.parse.urlunsplit((u.scheme,u.netloc.encode('idna').decode(),urllib.parse.quote(urllib.parse.unquote(u.path)),u.query,''));p=CACHE/(hashlib.sha256(url.encode()).hexdigest()+'.html')
 if not p.exists():p.write_bytes(urllib.request.urlopen(url,timeout=25).read())
 return BeautifulSoup(p.read_text(),'html.parser')
def matches(title,subject):
 n=norm(title)
 if len(n)<6:return []
 return [b for b in books if b.get('verified') and not b.get('excludedReason') and b['domain']=='entrance' and b['subject']==subject and any(norm(t)==n for t in [b['title'],b.get('sourceTitle','').split(' : ')[0]])]
def collect(pair):
 subject,url=pair
 try:return subject,url,get(url)
 except Exception:return subject,url,None
base='https://xn--8pr038b9h2am7a.com';codes={'en':'英語','hma':'数学','pma':'数学','la':'国語','aw':'国語','cw':'国語','ph':'物理','ch':'化学','bi':'生物','wh':'世界史','jh':'日本史','go':'地理','po':'政治経済'}
seeds=[(s,base+'/root_'+code+'/r_'+code+'_nihon/') for code,s in codes.items()]
first=list(concurrent.futures.ThreadPoolExecutor(2).map(collect,seeds));extra=[]
for subject,url,soup in first:
 if not soup:continue
 code=re.search(r'/root_(\w+)/',url)[1]
 for a in soup.select('a[href]'):
  href=a['href'];path=urllib.parse.urlsplit(href).path
  if re.fullmatch('/root_'+code+'/r_'+code+'_(?:before|marchkokkouritu|march|sokei|kokkouritu)/?',path):extra.append((subject,base+path.rstrip('/')+'/'))
rows=first+list(concurrent.futures.ThreadPoolExecutor(2).map(collect,sorted(set(extra))))
for subject,url,soup in rows:
 if not soup:errors.append(url);continue
 heading=soup.find('h2',string=lambda s:s and '2026年版' in s)
 if not heading:continue
 area=heading.parent;sid='takeda-'+hashlib.sha256(url.encode()).hexdigest()[:12];video=[]
 for i in area.select('iframe[src]'):
  m=re.search(r'youtube.com/embed/([\w-]+)',i['src'])
  if m:video.append('https://www.youtube.com/watch?v='+m[1])
 sources.append({'id':sid,'provider':'武田塾・逆転合格.com','url':url,'title':soup.title.get_text().split('|')[0].strip(),'routeYear':2026,'checkedAt':today,'videos':video})
 for pos,item in enumerate(area.select('.list__item'),1):
  name=item.select_one('.item__title');tag=item.select_one('.root__tag');h=item.find_previous('h3');level=h.get_text() if h else ''
  if not name or (tag and tag.get_text(strip=True)!='メインルート'):continue
  stage=1 if '基礎' in level else 2 if '日大' in level else 3 if re.search('MARCH|地方国公立',level) else 4 if re.search('早慶|旧帝',level) else None
  if not stage:continue
  for b in matches(name.get_text(' ',strip=True),subject):recommendations.append({'bookId':b['id'],'sourceId':sid,'stage':stage,'position':pos,'lane':'main','mathTrack':'science' if '/root_pma/' in url else 'arts' if '/root_hma/' in url else None})
axiv={'english_1':'英語','mathematics_1':'数学','physics_1':'物理','chemistry_1':'化学','contemporary_japanese_1':'国語','classics-japanese_1':'国語','classics-chinese_1':'国語','biology_1':'生物','information_1':'情報'}
for slug,subject in axiv.items():
 url='https://axivacademy.com/book_routes/'+slug;soup=BeautifulSoup((CACHE/('axiv-'+slug+'.html')).read_text(),'html.parser') if (CACHE/('axiv-'+slug+'.html')).exists() else get(url)
 updated=soup.select_one('meta[property="article:modified_time"]');updated=updated.get('content','') if updated else ''
 if not updated or int(updated[:4])<2024:continue
 sid='axiv-'+slug;sources.append({'id':sid,'provider':'アクシブアカデミー','url':url,'title':soup.title.get_text().split('|')[0].strip(),'updatedAt':updated,'checkedAt':today,'videos':[]});seen=set()
 for pos,card in enumerate(soup.select('.book_routes__card'),1):
  item=card.select_one('.book_routes__card_name');label=item.get_text(' ',strip=True) if item else '';m=re.fullmatch(r'『([^』]{3,120})』(?:[（(].{0,35}[）)])?',label)
  if not m:continue
  levels=[int(re.search(r'btn_rank0([1-4])',str(tag))[1]) for tag in card.select('.book_routes__card_tags li') if re.search(r'btn_rank0([1-4])',str(tag))]
  matched=matches(m[1],subject)
  for a in card.select('a[href]'):
   isbn=re.search(r'amazon\.co\.jp/(?:dp|gp/product)/(\d{9}[\dX])',a['href'])
   if isbn:
    digits='978'+isbn[1][:9];full=digits+str((-sum(int(d)*(1 if i%2==0 else 3) for i,d in enumerate(digits)))%10)
    for b in books:
     if b.get('isbn')==full and b.get('verified') and not b.get('excludedReason') and b['subject']==subject and b['domain']=='entrance' and b not in matched:matched.append(b)
  for stage in levels:
   for b in matched:
    key=(b['id'],stage)
    if key in seen:continue
    seen.add(key);recommendations.append({'bookId':b['id'],'sourceId':sid,'stage':stage,'position':pos,'lane':'main','mathTrack':None})

# CASTDICE's official book reviews substantiate recommendations separately from
# video-title discovery. Old English reviews never override edition filtering.
review=CACHE/'castdice-english.html'
if review.exists():
 soup=BeautifulSoup(review.read_text(),'html.parser')
 for item in soup.select('.su-post'):
  title=item.select_one('.su-post-title a');excerpt=item.select_one('.su-post-excerpt')
  if not title or not excerpt:continue
  target=re.search(r'対象[:：](.*?)おすすめ',excerpt.get_text(' ',strip=True))
  if not target:continue
  label=target[1];levels=[]
  if '基礎' in label:levels.append(1)
  if re.search('共通テスト|私大',label):levels.append(2)
  if re.search('国立二次|難関',label):levels.append(3)
  if '最難関' in label:levels.append(4)
  matched=matches(title.get_text(' ',strip=True),'英語')
  if not levels or not matched:continue
  sid='castdice-review-'+item.get('id','');meta=item.select_one('.su-post-meta');date=re.search(r'(20\d{2})年(\d+)月(\d+)日',meta.get_text() if meta else '')
  sources.append({'id':sid,'provider':'CASTDICE公式書評','url':title['href'],'title':title.get_text(' ',strip=True),'published':f'{date[1]}-{int(date[2]):02}-{int(date[3]):02}' if date else None,'checkedAt':today,'videos':[],'basis':'公式Web書評の推薦と対象レベル。2026年動画の内容を確認したという意味ではない。'})
  for b in matched:
   for stage in range(min(levels),max(levels)+1):recommendations.append({'bookId':b['id'],'sourceId':sid,'stage':stage,'position':1,'lane':'review','mathTrack':None})

used={r['sourceId'] for r in recommendations};sources=[s for s in sources if s['id'] in used]
out={'version':1,'checkedAt':today,'sources':sources,'recommendations':recommendations,'errors':errors,'note':'教材名・掲載レベル・掲載順の事実だけを参照。動画は公式ページの埋込元。動画視聴・字幕の照合を意味しない。'}
(ROOT/'assets/book-route-editorial.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print({'sources':len(sources),'references':len(recommendations),'books':len({r['bookId'] for r in recommendations}),'videos':sum(len(s['videos']) for s in sources),'errors':len(errors)},flush=True)
