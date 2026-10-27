"""Collect source-linked topic/faculty facts from public Kei-Net advice pages.
Full pages remain in ignored work/. Publish tags, never copied analyses.
"""
import concurrent.futures,datetime,json,re,sys,urllib.request,urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'work/admissions/vendor'));from bs4 import BeautifulSoup
CACHE=ROOT/'work/university-topics';CACHE.mkdir(exist_ok=True);TODAY=datetime.date.today().isoformat()
universities=json.loads((ROOT/'assets/university-admissions.json').read_text())['universities']
tags={'文法':r'文法|語法','長文':r'長文|読解|英文要約','解釈':r'英文解釈|英文和訳|構文|和訳','英作文':r'英作文|和文英訳|自由英作','リスニング':r'リスニング|聞き取り','単語':r'単語|語彙','図形':r'図形','確率':r'確率','整数':r'整数','数列':r'数列','ベクトル':r'ベクトル','微分積分':r'微分|積分|微積','複素数':r'複素数','三角関数':r'三角関数','極限':r'極限','指数対数':r'指数|対数','統計':r'統計','二次関数':r'2次関数|二次関数','力学':r'力学','波動':r'波動','電磁気':r'電磁気','熱':r'熱力学|熱の|熱分野','原子':r'原子','理論':r'理論化学','無機':r'無機','有機':r'有機','論述':r'論述|記述','現代文':r'現代文','古文':r'古文','漢文':r'漢文','通史':r'通史|歴史の流れ','資料':r'史料|資料'}
def get(url):
 import hashlib
 p=CACHE/(hashlib.sha256(url.encode()).hexdigest()+'.html')
 if not p.exists():p.write_bytes(urllib.request.urlopen(url,timeout=20).read())
 return BeautifulSoup(p.read_text(),'html.parser')
def parse(soup,url,u):
 area=soup.find(id='Topics');h=area.find('h3') if area else None
 if not h:return []
 subject=h.get_text(' ',strip=True);whole=area.get_text(' ',strip=True)
 if not re.search('英語|数学|国語|現代文|古文|漢文|物理|化学|生物|日本史|世界史|地理',subject):return []
 years=[int(y) for y in re.findall(r'(20\d{2})年度',whole)]
 years=[y for y in years if y<=datetime.date.today().year]
 if not years or max(years)<2026:return []
 headings=area.find_all('h4');sections=[]
 faculty_heads=[x for x in headings if re.search('学部|学科|学群|学門',x.get_text())]
 segments=[]
 if faculty_heads:
  for head in faculty_heads:
   text=[]
   for sib in head.next_siblings:
    if getattr(sib,'name',None) in ['h3','h4']:break
    if hasattr(sib,'get_text'):text.append(sib.get_text(' ',strip=True))
   label=head.get_text(' ',strip=True);facultyNames=[f['name'] for f in u['faculties'] if f['name'] in label]
   if facultyNames:segments.append((' '.join(text),facultyNames))
 else:segments=[(whole,[])]
 for body,faculties in segments:
  observed=set();important=set()
  for sentence in re.split('[。！？]',body):
   if re.search('出題されない|出題がない|出題されなく|出題範囲外',sentence):continue
   found={k for k,pattern in tags.items() if re.search(pattern,sentence)};observed.update(found)
   if re.search('頻出|よく出題|毎年|重視|中心|重要|必須|重点|多く出題',sentence):important.update(found)
  if observed:sections.append({'subject':subject,'facultyNames':faculties,'topics':sorted(observed),'prioritySkills':sorted(important or observed),'source':url,'checkedAt':TODAY,'analysisYear':max(years),'admissionYear':max(years)+1,'basis':'過去の出題分析・学習対策に基づく分野タグ。次年度の出題を保証しない。'})
 return sections

def collect(u):
 url='https://search.keinet.ne.jp/'+u['id']+'/topics/33';out=[];errors=[]
 try:
  soup=get(url);out+=parse(soup,url,u);links=set()
  for a in soup.select('a[href]'):
   if 'pageCode=advice_' not in a['href']:continue
   target=urllib.parse.urljoin(url,a['href']);parsed=urllib.parse.urlparse(target)
   if parsed.hostname=='search.keinet.ne.jp':links.add(target)
  for target in sorted(links):
   try:out+=parse(get(target),target,u)
   except Exception:errors.append(target)
 except Exception:errors.append(url)
 print('TOPICS',u['name'],len(out),flush=True);return u['id'],out,errors
results=list(concurrent.futures.ThreadPoolExecutor(2).map(collect,universities));out={'updated':TODAY,'universities':{code:sections for code,sections,errors in results},'errors':[url for _,_,errors in results for url in errors]}
(ROOT/'assets/university-exam-trends.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n');print('TOTAL',sum(bool(rows) for rows in out['universities'].values()),sum(len(rows) for rows in out['universities'].values()),flush=True)
