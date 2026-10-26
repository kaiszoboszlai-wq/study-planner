"""Recent entrance-exam bibliographies for exam families not yet routed by the app.
Stored in the searchable registry only, never mixed into university/high-school routes.
"""
import concurrent.futures,importlib.util,json
from pathlib import Path
spec=importlib.util.spec_from_file_location('collector',Path(__file__).with_name('collect-comprehensive-catalog.py'));c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
def run():
 terms=['中学受験','中学入試','小学受験','小学校入試','大学院入試','大学編入','看護学校入試','看護医療系']
 jobs=[('registry-'+term,'title="'+term+'"','2022','2026') for term in terms];leaves=[];failed=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  while jobs:
   more=[]
   for found,next_jobs,errors in pool.map(c.collect,jobs):leaves+=found;more+=next_jobs;failed+=errors
   jobs=more;print('SUPPLEMENT',len(leaves),'complete,',len(jobs),'pending,',len(failed),'failed',flush=True)
 target=c.m.CACHE/'supplement-manifest.json';target.write_text(json.dumps({'leaves':leaves,'failed':failed},ensure_ascii=False,indent=2)+'\n')
 if failed:raise SystemExit('Incomplete supplementary partitions')
if __name__=='__main__':run()
