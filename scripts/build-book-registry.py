"""Build a bibliographic registry without treating library holdings as in-print stock.
Annual/revised editions stay under one resource, separate from route-ready metadata.
"""
import importlib.util,json,re,unicodedata,xml.etree.ElementTree as ET
from pathlib import Path
spec=importlib.util.spec_from_file_location('bulk',Path(__file__).with_name('expand-book-catalog.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
SCHOOL={'Y33','Y35','Y36','Y37','Y38','Y42','Y44'}
def eligible(b):
 t=unicodedata.normalize('NFKC',b['title']+' '+b['sourceVolume'])
 if re.search(r'教師用|教授資料|教員用|指導書|解答のみ|DVD|CDのみ|音声CD|専用ノート|解答用紙|解答ノート|教授用|授業づくり|教え方|指導法|合格体験|保護者|勉強法|学習法',t):return False
 if re.search(r'中学入試|中学受験|小学受験|小学校入試|大学院入試|大学編入|看護学校入試|看護医療系',t):return True
 if SCHOOL.intersection(b['codes']) or re.search(r'英検|TOEIC|TOEFL|IELTS|漢検|漢字検定|簿記|FP|ファイナンシャル',t,re.I):return True
 # The routing classifier requires explicit exam names and study/exam wording.
 return m.classify(b) is not None

def build():
 manifest=json.loads((m.CACHE/'comprehensive-manifest.json').read_text());files={x['path'] for x in manifest['leaves']};groups={};seen=set()
 supplement=m.CACHE/'supplement-manifest.json'
 if supplement.exists():
  extra=json.loads(supplement.read_text())
  if extra['failed']:raise ValueError('Incomplete supplement')
  files.update(x['path'] for x in extra['leaves'])
 seed=json.loads(m.PATH.read_text())['books']
 prior=m.ROOT/'assets/book-registry.json'
 if prior.exists():seed += [edition for resource in json.loads(prior.read_text())['books'] for edition in resource['editions']]
 for b in seed:
  if b.get('verified') is False or b.get('excludedReason') or not m.original.isbn13(b.get('isbn','')) or b.get('isbn') in seen or not b.get('source','').startswith('https://ndlsearch.ndl.go.jp/books/'):continue
  seen.add(b['isbn']);row={k:b.get(k,[] if k=='authors' else '') for k in ['title','sourceTitle','sourceVolume','publisher','isbn','source','published','edition','priceLabel','authors']};row['availabilityStatus']='未確認';groups.setdefault(m.identity(b),[]).append(row)
 for file in sorted(files):
  for el in ET.parse(file).findall('.//s:recordData',m.NS):
   b=m.record(el)
   if not b or b['isbn'] in seen or not eligible(b):continue
   seen.add(b['isbn']);key=m.identity(b)
   row={k:b[k] for k in ['title','sourceTitle','sourceVolume','publisher','isbn','source','published','edition','priceLabel','authors']}
   row['availabilityStatus']='未確認';groups.setdefault(key,[]).append(row)
 books=[]
 for key,editions in sorted(groups.items()):
  editions.sort(key=lambda b:(m.date_key(b['published']),b['isbn']),reverse=True)
  books.append({'key':key,'latestCollectedIsbn':editions[0]['isbn'],'editions':editions})
 report={'version':1,'updated':str(m.TODAY),'resourceCount':len(books),'editionCount':len(seen),'source':'https://ndlsearch.ndl.go.jp/help/api','scope':'大学・高校・中学等の受験参考書、英語・資格試験対策の書誌。販売中を保証する一覧ではありません。','books':books}
 (m.ROOT/'assets/book-registry.json').write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
 print('REGISTRY',len(books),'distinct resources;',len(seen),'ISBN editions',flush=True)
 return report
if __name__=='__main__':build()
