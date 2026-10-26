"""Partition NDL queries by publication date: SRU cannot return results after 500.
This uses documented date filters, four workers with globally spaced requests, resumable caches, and no paid API.
"""
import concurrent.futures,datetime,importlib.util,json,re,hashlib,urllib.parse,calendar
from pathlib import Path
spec=importlib.util.spec_from_file_location('bulk',Path(__file__).with_name('expand-book-catalog.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def collect(job):
 label,query,lo,hi=job
 start=lo+'-01-01' if len(lo)==4 else lo+'-01'
 end=hi+'-12-31' if len(hi)==4 else hi+'-'+str(calendar.monthrange(int(hi[:4]),int(hi[-2:]))[1])
 plan=(label,f'{query} AND from="{start}" AND until="{end}"')
 params={'operation':'searchRetrieve','version':'1.2','query':plan[1]+' AND dpid=iss-ndl-opac','maximumRecords':500,'startRecord':1,'recordSchema':'dcndl'}
 cache=m.CACHE/(hashlib.sha256(('https://ndlsearch.ndl.go.jp/api/sru?'+urllib.parse.urlencode(params)).encode()).hexdigest()+'.xml')
 info=m.fetch(plan,max_records=500 if cache.exists() else 1)
 if not info:return [],[],[job]
 if info['total']==0:return [info],[],[]
 if info['total']<=500:
  full=m.fetch(plan)
  return ([full],[],[]) if full else ([],[],[job])
 # Date intervals are disjoint; every result is retrieved in a <=500-result leaf.
 if lo==hi and len(lo)>4:return [],[],[job]
 if len(lo)==4:
  a,b=int(lo),int(hi)
  if a==b:return [],[(label,query,f'{a}-01',f'{a}-06'),(label,query,f'{a}-07',f'{a}-12')],[]
  mid=(a+b)//2;return [],[(label,query,str(a),str(mid)),(label,query,str(mid+1),str(b))],[]
 # Single-year month partitions.
 a,b=int(lo[-2:]),int(hi[-2:]);year=lo[:4]
 if a==b:return [],[],[job]
 mid=(a+b)//2;return [],[(label,query,f'{year}-{a:02}',f'{year}-{mid:02}'),(label,query,f'{year}-{mid+1:02}',f'{year}-{b:02}')],[]

def run(write=False,history=False):
 years={'Y33':2022,'Y35':2000,'Y36':2024,'Y37':2023,'Y38':2012,'Y42':2000,'Y44':2024}
 jobs=[(code,'ndlc='+code,str(year),'2026') for code,year in years.items()]
 jobs += [(name,'title="'+name+'"','2000','2026') for name in ['英検','TOEIC','TOEFL','IELTS','漢検']]
 if history:jobs += [('history-'+code,'ndlc='+code,'2000',str(year-1)) for code,year in years.items() if year>2000]
 jobs += [(code,'ndlc='+code,'2025','2026') for code in ['Y52','Y53','Y54','Y55','Y56','Y57','Y58','Y59']]
 leaves=[];failed=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  while jobs:
   more=[]
   for found,next_jobs,errors in pool.map(collect,jobs):leaves+=found;more+=next_jobs;failed+=errors
   jobs=more;print('PARTITIONS',len(leaves),'complete,',len(jobs),'pending,',len(failed),'failed',flush=True)
 manifest={'leaves':leaves,'failed':failed,'date':str(m.TODAY),'sourceSpecification':'https://ndlsearch.ndl.go.jp/file/help/api/specifications/ndlsearch_api_20260925.pdf'}
 (m.CACHE/'comprehensive-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 # Include prior source responses; collection must not remove earlier registered books.
 previous=[]
 for plan in m.PLANS:
  item=m.fetch(plan)
  if item:previous.append(item)
 count=m.build(previous+[leaf for leaf in leaves if not leaf['label'].startswith('history-')],write and not failed)
 if failed:raise SystemExit('Incomplete partitions; catalog left unchanged: '+str(len(failed)))
 print('DONE',count,flush=True)
if __name__=='__main__':
 import sys
 run('--write' in sys.argv,'--history' in sys.argv)
