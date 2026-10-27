"""Extract factual exam scope and short topic tags; keep full source pages private.
No AI, no copied analyses in the public output. Unknown scopes remain null.
"""
import concurrent.futures,datetime,importlib.util,json,re,sys,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'work/admissions/vendor'))
from bs4 import BeautifulSoup
spec=importlib.util.spec_from_file_location('admissions',ROOT/'scripts/collect-university-admissions.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
CACHE=ROOT/'work/university-intelligence';CACHE.mkdir(exist_ok=True);today=datetime.date.today().isoformat()
data=json.loads((ROOT/'assets/university-admissions.json').read_text());scope_count=0
for u in data['universities']:
 p=ROOT/'work/admissions'/(u['id']+'.html')
 if u['id']=='1120' and (ROOT/'work/admissions/keinet-tokyo.html').exists():p=ROOT/'work/admissions/keinet-tokyo.html'
 if not p.exists():continue
 soup=BeautifulSoup(p.read_text(),'html.parser');tabs={t['id']:t for t in soup.select('div.tabcontent[id]')}
 for f in u['faculties']:
  for dep in f['departments']:
   for method in dep['methods']:
    tab=tabs.get(method['id'])
    if not tab:continue
    facts={'mathIII':None,'listening':None,'checkedAt':today,'source':u['source']};external_english=False
    for table in tab.find_all('table',recursive=False):
     for row in m.grid(table):
      cells=[]
      for c in row:
       if c is not None and not any(c is x for x in cells):cells.append(c)
      labels=[m.clean(c) for c in cells if c.name=='th'];values=[m.clean(c) for c in cells if c.name=='td'];label=' '.join(labels)
      mark=' '.join(m.clean(c) for c in cells if c.find('span',class_='ff-msp-gothic'))
      if '英語資格・検定試験' in labels and re.search('[●○◇]',mark):external_english=True
      if '数学' in labels and labels[-1] in ['III','Ⅲ']:facts['mathIII']=bool(re.search('[●○◇]',mark))
      if 'L&S' in labels or 'L＆S' in labels:facts['listening']=any(re.search('L|Ｌ|リスニング',v) for v in values)
      if method['stage']=='common' and '英語' in labels and labels[-1]=='L':facts['listening']=bool(re.search('[●○◇]',mark))
    # External English certification can require listening even when the university paper does not.
    if external_english and facts['listening'] is False:facts['listening']=None
    if method['stage']=='common':facts['mathIII']=False
    method['scope']=facts;scope_count+=1
 print('SCOPES',u['name'],scope_count,flush=True)
index=CACHE/'index.html'
if not index.exists():index.write_bytes(urllib.request.urlopen('https://www.keinet.ne.jp/learning/univ/',timeout=30).read())
soup=BeautifulSoup(index.read_text(),'html.parser');codes=set()
for a in soup.select('a[href]'):
 match=re.search(r'/univ/(\d{4})\.html',a['href'])
 if match:codes.add(match[1])
# Canonical listing uses relative and absolute forms.
if not codes:codes=set(re.findall(r'/univ/(\d{4})\.html',index.read_text()))
tags={'文法':r'文法|語法','長文':r'長文|読解|英文要約','解釈':r'英文解釈|英文和訳|構文|和訳','英作文':r'英作文|和文英訳|自由英作','リスニング':r'リスニング|聞き取り','単語':r'単語|語彙','図形':r'図形','確率':r'確率','整数':r'整数','数列':r'数列','ベクトル':r'ベクトル','微分積分':r'微分|積分|微積','複素数':r'複素数','三角関数':r'三角関数','極限':r'極限','力学':r'力学','波動':r'波動','電磁気':r'電磁気','熱':r'熱力学|熱の|熱分野','原子':r'原子','理論':r'理論化学','無機':r'無機','有機':r'有機','論述':r'論述|記述','現代文':r'現代文','古文':r'古文','漢文':r'漢文','通史':r'通史|歴史の流れ','資料':r'史料|資料'}
def collect(code):
 path=CACHE/(code+'.html');url='https://www.keinet.ne.jp/learning/univ/'+code+'.html'
 try:
  if not path.exists():path.write_bytes(urllib.request.urlopen(url,timeout=30).read())
  soup=BeautifulSoup(path.read_text(),'html.parser');sections=[]
  for h in soup.select('h3'):
   heading=h.get_text(' ',strip=True);body=h.parent.get_text(' ',strip=True)
   if not any(word in heading for word in ['英語','数学','物理','化学','生物','地学','日本史','世界史','地理','現代文','古文','漢文','国語']):continue
   found=set();priority=set()
   for sentence in re.split('[。！？]',body):
    if re.search('出題されない|出題がない|出題されなく|出題範囲外',sentence):continue
    matches={key for key,pattern in tags.items() if re.search(pattern,sentence)};found.update(matches)
    if re.search('頻出|よく出題|毎年|重視|中心|重要|必須|重点|多く出題',sentence):priority.update(matches)
   sections.append({'subject':heading,'topics':sorted(found),'prioritySkills':sorted(priority),'source':url,'checkedAt':today,'admissionYear':2027,'basis':'河合塾講師の2027年度対策・最近の出題傾向に記載された分野タグ。出題を保証する予測ではない。'})
  return code,sections
 except Exception as e:return code,[]
trends=dict(concurrent.futures.ThreadPoolExecutor(2).map(collect,sorted(codes)))
for u in data['universities']:u['trends']=trends.get(u['id'],[])
data['version']=2;data['updated']=today;(ROOT/'assets/university-admissions.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
report={'checkedAt':today,'universities':len(data['universities']),'scopeMethods':scope_count,'trendUniversities':sum(bool(u['trends']) for u in data['universities']),'trendSections':sum(len(u['trends']) for u in data['universities']),'sources':['https://www.keinet.ne.jp/learning/univ/'],'unknownTrends':'未確認校の傾向は生成・推測しない'}
(ROOT/'assets/university-intelligence-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
