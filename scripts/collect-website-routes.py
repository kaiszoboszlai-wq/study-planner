"""Add verified series-level references from independent study-route websites."""
import datetime,json,re,sys,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'work/admissions/vendor'));from bs4 import BeautifulSoup
p=ROOT/'assets/book-route-editorial.json';data=json.loads(p.read_text());books=json.loads((ROOT/'assets/book-catalog.json').read_text())['books'];today=datetime.date.today().isoformat()
rules=[('やさしい高校数学',r'やさしい高校数学',r'学研|Gakken'),('初めから始める数学',r'初めから始める',r'マセマ'),('入門問題精講',r'入門問題精講',r'旺文社'),('基礎問題精講',r'基礎問題精講',r'旺文社'),('青チャート',r'チャート式.*基礎からの数学',r'数研|チャート'),('黄チャート',r'チャート式.*解法と演習数学',r'数研|チャート'),('Focus Gold',r'Focus Gold',r'啓林館'),('1対1対応の演習',r'1対1対応の演習',r'東京出版'),('標準問題精講',r'標準問題精講',r'旺文社'),('上級問題精講',r'上級問題精講',r'旺文社'),('文系数学の良問プラチカ',r'文系数学の良問プラチカ',r'河合'),('理系数学の良問プラチカ',r'理系数学の良問プラチカ',r'河合'),('やさしい理系数学',r'やさしい理系数学',r'河合')]
for slug,provider,url in [('ukaroute-math','ウカルート','https://www.ukaroute.com/blog/sugaku-sankosho-route-by-level'),('jukenlab-math','受験Lab','https://juken-lab.com/reference/suugaku-sankousho-route/')]:
 soup=BeautifulSoup((ROOT/('work/editorial-routes/'+slug+'.html')).read_text(),'html.parser');sid='website-'+slug;data['sources']=[s for s in data['sources'] if s['id']!=sid];data['recommendations']=[r for r in data['recommendations'] if r['sourceId']!=sid];meta=soup.select_one('meta[property="article:modified_time"]');date=meta.get('content') if meta else None
 data['sources'].append({'id':sid,'provider':provider,'url':url,'title':soup.title.get_text().split('｜')[0],'updatedAt':date,'checkedAt':today,'videos':[],'basis':'段階別に紹介された数学教材シリーズを出版社・書名で照合。特定ISBNの版を保証する出典ではない。'})
 for h in soup.select('h3'):
  label=h.get_text(' ',strip=True);m=re.search('STEP([1-4])',label)
  stage=int(m[1]) if m else 1 if label.startswith('教科書レベル｜') else 2 if label.startswith('入門・基礎レベル｜') else 3 if label.startswith(('標準・網羅レベル｜','応用・演習レベル｜')) else 4 if label.startswith('難関レベル｜') else None
  if stage is None:continue
  text=[]
  for node in h.next_siblings:
   if getattr(node,'name',None) in ['h2','h3']:break
   if hasattr(node,'get_text'):text.append(node.get_text(' ',strip=True))
  body=unicodedata.normalize('NFKC',' '.join(text))
  for series,pattern,publisher in rules:
   if unicodedata.normalize('NFKC',series) not in body:continue
   for b in books:
    if b.get('verified') and not b.get('excludedReason') and b['domain']=='entrance' and b['subject']=='数学' and re.search(pattern,unicodedata.normalize('NFKC',b['title']),re.I) and re.search(publisher,b['publisher'],re.I):data['recommendations'].append({'bookId':b['id'],'sourceId':sid,'stage':stage,'position':1,'lane':'reference','mathTrack':None,'evidenceType':'series','series':series})
data['checkedAt']=today;p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print({'sources':len(data['sources']),'references':len(data['recommendations']),'books':len({r['bookId'] for r in data['recommendations']})})
