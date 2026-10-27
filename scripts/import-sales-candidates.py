"""Discover best-selling study books via Rakuten, register independent NDL metadata.
Provider responses/ranks stay in ignored work/, never in the published catalog.
Usage: --credentials-file /private/file --pages 10 (up to API page limit 100).
"""
import argparse,concurrent.futures,datetime,importlib.util,json,re,time,urllib.request,urllib.parse,urllib.error,xml.etree.ElementTree as ET,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];CACHE=ROOT/'work/sales-import';CACHE.mkdir(parents=True,exist_ok=True)
p=argparse.ArgumentParser();p.add_argument('--credentials-file',required=True);p.add_argument('--pages',type=int,default=10);args=p.parse_args()
s=Path(args.credentials_file).read_text(encoding='utf-8-sig');env={k:v.strip().strip('\"\'') for k,v in re.findall(r'(?m)^\s*(RAKUTEN_[A-Z_]+)\s*=\s*(.*?)\s*$',s)}
headers={'accessKey':env['RAKUTEN_ACCESS_KEY'],'Origin':'https://study-planner-sigma-tawny.vercel.app','Referer':'https://study-planner-sigma-tawny.vercel.app/'}
queries=['大学入試','共通テスト','高校入試','数学','英文法','英単語','物理','化学','生物','現代文','古文','日本史','世界史','英検','TOEIC','ITパスポート','基本情報技術者','簿記','FP','宅建','行政書士','漢検']
seeds=set();failed=[]
for q in queries:
 for page in range(1,min(100,args.pages)+1):
  path=CACHE/(hashlib.sha256((q+':'+str(page)).encode()).hexdigest()+'.json')
  if path.exists():d=json.loads(path.read_text())
  else:
   params={'applicationId':env['RAKUTEN_APPLICATION_ID'],'title':q,'sort':'sales','format':'json','formatVersion':'2','hits':'30','page':str(page),'outOfStockFlag':'0','elements':'isbn,title,count,pageCount'}
   url='https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404?'+urllib.parse.urlencode(params)
   try:
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=25) as r:d=json.load(r)
    path.write_text(json.dumps(d,ensure_ascii=False))
   except urllib.error.HTTPError as e:
    failed.append({'query':q,'page':page,'status':e.code});print('API_ERROR',q,page,e.code,flush=True)
    if e.code in [401,403,429]:raise SystemExit('Stopped without exposing credentials; resume later')
    break
   time.sleep(1.2)
  items=d.get('Items',d.get('items',[]));items=[x.get('Item',x.get('item',x)) for x in items]
  seeds.update(str(x.get('isbn','')) for x in items if re.fullmatch(r'97[89]\d{10}',str(x.get('isbn',''))))
  if not items or page>=int(d.get('pageCount',0) or 0):break
 print('DISCOVERED',q,'unique ISBNs',len(seeds),flush=True)
(CACHE/'discovered-isbns.json').write_text(json.dumps(sorted(seeds)))
spec=importlib.util.spec_from_file_location('bulk',ROOT/'scripts/expand-book-catalog.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.TODAY=datetime.date.today()
data=json.loads(m.PATH.read_text());known={b.get('isbn') for b in data['books']};unknown=sorted(seeds-known);added=[];rejected=0
def verify_batch(offset):
 batch=unknown[offset:offset+35];query='anywhere any "'+' '.join(batch)+'"'
 return offset,batch,m.fetch(('sales-discovery',query),1,200)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 futures=[pool.submit(verify_batch,o) for o in range(0,len(unknown),35)]
 done=0
 for future in concurrent.futures.as_completed(futures):
  offset,batch,leaf=future.result();done+=len(batch)
  if not leaf:failed.append({'ndlBatch':offset});continue
  for node in ET.parse(leaf['path']).findall('.//s:recordData',m.NS):
   b=m.record(node)
   if not b or b['isbn'] not in batch or b['isbn'] in known:continue
   b=m.classify(b)
   if not b:rejected+=1;continue
   b['id']='sales-ndl-'+b['isbn'];b['discoverySource']='売れ筋から候補発見後、NDL書誌で確認';data['books'].append(b);known.add(b['isbn']);added.append(b['isbn'])
  print('NDL_VERIFIED',done,'/',len(unknown),'added',len(added),flush=True)
data['updated']=datetime.date.today().isoformat();data['verifiedCount']=sum(bool(b.get('verified')) and not b.get('excludedReason') for b in data['books']);m.PATH.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
report={'checkedAt':datetime.date.today().isoformat(),'queries':queries,'maxPagesPerQuery':args.pages,'discoveredISBNs':len(seeds),'alreadyRegistered':len(seeds)-len(unknown),'newNDLVerified':len(added),'unregisteredOrExcluded':len(unknown)-len(added),'errors':failed,'note':'売れ筋の生データ・順位・画像URLは公開カタログに保存しない。書誌はNDLで独立確認。'}
(ROOT/'assets/sales-import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False),flush=True)
