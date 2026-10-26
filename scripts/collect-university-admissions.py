"""Collect factual subject availability for configured universities from Kei-Net.
One public page per university, cached; no runtime request/AI in the app.
Install beautifulsoup4 for collection only. Review extraction warnings before use.
"""
import sys,re,json,time,unicodedata,urllib.request,concurrent.futures,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'work/admissions'
if (CACHE/'vendor').exists():sys.path.insert(0,str(CACHE/'vendor'))
from bs4 import BeautifulSoup
ORDER=['国語','数学','英語','物理','化学','生物','地学','日本史','世界史','地理','公共','政治経済','倫理','情報','地理総合','地理総合／歴史総合／公共']
def clean(x):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',x.get_text(' ',strip=True))).strip()
def ordered(xs):return sorted(set(xs),key=lambda s:ORDER.index(s) if s in ORDER else 99)
def grid(table):
 rows=[];pending={}
 for tr in table.select('tbody > tr'):
  row={};following={}
  for j,(c,left) in pending.items():
   row[j]=c
   if left>1:following[j]=(c,left-1)
  j=0
  for c in tr.find_all(['th','td'],recursive=False):
   while j in row:j+=1
   for k in range(int(c.get('colspan',1))):
    row[j+k]=c
    if int(c.get('rowspan',1))>1:following[j+k]=(c,int(c['rowspan'])-1)
   j+=int(c.get('colspan',1))
  rows.append([row.get(k) for k in range(max(row,default=-1)+1)]);pending=following
 return rows

def table_data(tab):
 required=set();optional={};counts={};cross=set();extra=set();unmapped=set();symbols=set();basic=False
 tables=tab.find_all('table',recursive=False)
 table=next((t for t in tables if t.find('th',string=lambda v:v and '満点' in v)),None)
 if table is None:return None
 for row in grid(table):
  cells=[]
  for c in row:
   if c is not None and not any(c is x for x in cells):cells.append(c)
  markcell=next((c for c in cells if c.find('span',class_='ff-msp-gothic')),None)
  if markcell is None:
   labels=[clean(c) for c in cells if c.name=='th'];vals=[clean(c) for c in cells if c.name=='td']
   if labels and labels[-1]=='科目数' and vals:
    m=re.match(r'^(\d+)$',vals[0])
    if m:counts[labels[0]]=int(m[1])
   continue
  marker=clean(markcell);symbols.add(marker)
  if not re.search('[●○◇]',marker):continue
  i=next(i for i,c in enumerate(cells) if c is markcell);labels=[clean(c) for c in cells[:i] if c.name=='th']
  if not labels:continue
  group=labels[0];last=labels[-1];subject=None
  if group in ['英語','外国語']:subject='英語'
  elif group in ['数学','国語']:subject=group
  elif group=='理科':
   subject=next((s for s in ['物理','化学','生物','地学'] if s in last),None)
   if '基礎' in last:basic=True
  elif group=='地歴・公民':subject='地理総合／歴史総合／公共' if last=='地歴公共' else '地理総合' if last=='地理総合' else next((s for s in ['日本史','世界史','地理','公共','倫理','政治経済'] if last==s),None)
  elif group in ['情報','情報I','情報Ⅰ']:subject='情報'
  elif group not in ['英語資格・検定試験']:
   extra.add(group)
  if subject is None:
   if group in ['理科','地歴・公民']:unmapped.add(last)
   continue
  if '●' in marker:required.add(subject)
  elif '◇' in marker:cross.add(subject)
  else:optional.setdefault(group,set()).add(subject)
 groups=[]
 for label,subjects in optional.items():
  subjects-=required
  if not subjects:continue
  count=counts.get(label)
  if label=='理科' and basic:count=None # mixed basic/advanced bundles need the applicant's selection
  if count is not None:count=max(0,count-len(required.intersection({'物理','化学','生物','地学'} if label=='理科' else {'日本史','世界史','地理','公共','倫理','政治経済'} if label=='地歴・公民' else subjects)))
  if len(subjects)==1 and not cross:required.update(subjects);continue
  if count==0:continue
  groups.append({'id':'g'+str(len(groups)+1),'label':label,'subjects':ordered(subjects),'count':count if count and count<=len(subjects) else None})
 if cross-required:groups.append({'id':'g'+str(len(groups)+1),'label':'教科をまたぐ選択','subjects':ordered(cross-required),'count':None})
 allowed=ordered(required.union(*(set(g['subjects']) for g in groups)))
 return {'required':ordered(required),'groups':groups,'subjects':allowed,'otherAssessments':sorted(extra),'needsCombinationConfirmation':bool(cross or basic or unmapped),'unmapped':sorted(unmapped)}

def parse(name,code,html):
 soup=BeautifulSoup(html,'html.parser');yearmatch=re.search(r'(20\d\d)年度入試',soup.get_text(' ',strip=True));year=int(yearmatch[1]) if yearmatch else None
 faculties=[];warnings=[]
 for dep in soup.select('dt.dep_area'):
  dd=dep.find_next_sibling('dd');faculty={'id':code+'-f'+str(len(faculties)+1),'name':clean(dep),'departments':[]}
  if dd is None:continue
  for sub in dd.select('dt.sub_area'):
   sd=sub.find_next_sibling('dd');department={'id':sub.get('id'),'name':clean(sub) or '学部共通','methods':[]}
   if sd is None:continue
   for tab in sd.select('div.tabcontent[id]'):
    data=table_data(tab)
    if data is None:continue
    owner=tab.find_parent('dl',class_='kn-d-list');title=owner.find('dt',class_='title') if owner else None
    label=re.sub(r'[（(]募集人員.*','',clean(title)) if title else '一般選抜'
    stage='common' if tab['id'].startswith('tab1_') else 'individual'
    if not data['subjects']:continue
    method={'id':tab['id'],'name':label,'stage':stage,**data}
    # Keep distinct documented combinations, not duplicated score/seat variants.
    key=json.dumps({k:method[k] for k in ['name','stage','required','groups','subjects']},ensure_ascii=False,sort_keys=True)
    if not any(m.get('_key')==key for m in department['methods']):department['methods'].append({**method,'_key':key})
   for m in department['methods']:m.pop('_key',None)
   if department['methods']:faculty['departments'].append(department)
  if faculty['departments']:faculties.append(faculty)
 return {'id':code,'name':name,'year':year,'source':'https://search.keinet.ne.jp/'+code+'/general/exam_subject','checkedAt':'2026-10-26','faculties':faculties}

def get_page(pair):
 name,code=pair;p=CACHE/(code+'.html')
 if code=='1120' and (CACHE/'keinet-tokyo.html').exists():p=CACHE/'keinet-tokyo.html'
 if not p.exists():
  for attempt in range(3):
   try:
    with urllib.request.urlopen('https://search.keinet.ne.jp/'+code+'/general/exam_subject',timeout=60) as r:raw=r.read()
    if len(raw)<20000:raise ValueError('Incomplete page')
    p.write_bytes(raw);break
   except Exception:
    if attempt==2:raise
    time.sleep(2+attempt*2)
 return parse(name,code,p.read_text())

def main():
 CACHE.mkdir(parents=True,exist_ok=True)
 xml=CACHE/'search.xml'
 if not xml.exists():xml.write_bytes(urllib.request.urlopen('https://search.keinet.ne.jp/data/search.xml',timeout=30).read())
 names=re.search("const universities='([^']+)'",(ROOT/'assets/book-route-questions.js').read_text()).group(1).split(',')
 mapping={x.findtext('univ_name'):x.findtext('univ_cd') for x in ET.fromstring(xml.read_bytes()).iter('univ_data')}
 codes={n:mapping[n] for n in names if n not in ['その他の大学','志望校はまだ決まっていない']}
 out=[];errors=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  futures={pool.submit(get_page,p):p[0] for p in codes.items() if p[1]}
  for i,f in enumerate(concurrent.futures.as_completed(futures),1):
   try:
    item=f.result();out.append(item);print(i,item['name'],len(item['faculties']),sum(len(d['methods']) for a in item['faculties'] for d in a['departments']),flush=True)
   except Exception as e:errors.append({'name':futures[f],'error':str(e)});print('ERROR',futures[f],str(e),flush=True)
 out.sort(key=lambda u:list(codes).index(u['name']))
 result={'version':1,'updated':'2026-10-26','sourceLabel':'河合塾 Kei-Net 入試科目（一般選抜）','universities':out,'errors':errors}
 if errors:
  (CACHE/'errors.json').write_text(json.dumps(errors,ensure_ascii=False))
  raise SystemExit('Collection incomplete; existing admissions data left unchanged.')
 (ROOT/'assets/university-admissions.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
 print(json.dumps({'universities':len(out),'faculties':sum(len(x['faculties']) for x in out),'errors':errors},ensure_ascii=False),flush=True)
if __name__=='__main__':main()
