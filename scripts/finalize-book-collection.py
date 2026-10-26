"""Integrate complete cached collection manifests and preserve prior catalog IDs."""
import importlib.util,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('registry',ROOT/'scripts/build-book-registry.py');registry=importlib.util.module_from_spec(spec);spec.loader.exec_module(registry);m=registry.m;m.CACHED_ONLY=True
manifest=json.loads((m.CACHE/'comprehensive-manifest.json').read_text())
if manifest['failed']:raise SystemExit('Collection has incomplete partitions; not writing catalog')
# Capture the previously registered editions before updating bibliographic facts.
registry.build()
files=[x for x in manifest['leaves'] if not x['label'].startswith('history-')]
for plan in m.PLANS:
 item=m.fetch(plan)
 if not item:raise SystemExit('Missing prior source cache')
 files.append(item)
m.build(files,True)
subprocess.run([sys.executable,str(ROOT/'scripts/enrich-book-catalog.py')],check=True)
r=registry.build();data=json.loads(m.PATH.read_text());data['registry']={'url':'assets/book-registry.json','resourceCount':r['resourceCount'],'editionCount':r['editionCount'],'availabilityVerified':False};m.PATH.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
report={'updated':str(m.TODAY),'target':10000,'registryResources':r['resourceCount'],'registryEditions':r['editionCount'],'catalogVerified':data['verifiedCount'],'availabilityVerified':False,'collectionPartitions':len(manifest['leaves']),'failedPartitions':len(manifest['failed']),'source':r['source'],'sourceSpecification':manifest['sourceSpecification']}
counts=json.loads(subprocess.check_output(['node','-e',"const c=require('./assets/book-catalog.json'),p=require('./assets/book-route-policy.js'),q=require('./assets/book-route-questions.js');const ids=p.currentIds(c),rows=c.books.filter(b=>ids.has(b.id));process.stdout.write(JSON.stringify({currentEditionBooks:rows.length,currentSupportedBooks:rows.filter(b=>b.domain!=='qualification'||b.exams.some(exam=>q.supportedQualifications.has(exam))).length}));"],cwd=ROOT,text=True));report.update(counts)
supplement=m.CACHE/'supplement-manifest.json'
if supplement.exists():
 extra=json.loads(supplement.read_text());report['supplementPartitions']=len(extra['leaves']);report['supplementFailedPartitions']=len(extra['failed'])
source_rows=[{key:value for key,value in row.items() if key!='path'} for row in manifest['leaves']]
if supplement.exists():source_rows += [{key:value for key,value in row.items() if key!='path'} for row in extra['leaves']]
(ROOT/'assets/book-collection-sources.json').write_text(json.dumps({'updated':str(m.TODAY),'queries':source_rows},ensure_ascii=False,indent=2)+'\n')
(ROOT/'assets/book-collection-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False),flush=True)
