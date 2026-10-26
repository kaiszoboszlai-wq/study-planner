"""Collect NDL-owned bibliographies in bulk, classify study books, keep latest editions.
No model, credentials, paid API, book contents or cover scraping is used.
Raw SRU responses and the review report are kept under ignored work/.
"""
import argparse,concurrent.futures,datetime,hashlib,importlib.util,json,re,time,threading,unicodedata,urllib.error,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];PATH=ROOT/'assets/book-catalog.json';CACHE=ROOT/'work/catalog-bulk';CACHE.mkdir(parents=True,exist_ok=True)
NS={'s':'http://www.loc.gov/zing/srw/','n':'http://ndl.go.jp/dcndl/terms/','d':'http://purl.org/dc/terms/','dc':'http://purl.org/dc/elements/1.1/','rdf':'http://www.w3.org/1999/02/22-rdf-syntax-ns#','f':'http://xmlns.com/foaf/0.1/'}
TODAY=datetime.date(2026,10,26);BASELINE=110;CACHED_ONLY=False
REQUEST_LOCK=threading.Lock();LAST_REQUEST=0.0
spec=importlib.util.spec_from_file_location('original',ROOT/'scripts/refresh-book-catalog.py');original=importlib.util.module_from_spec(spec);spec.loader.exec_module(original)
uni=re.search("const universities='([^']+)'",(ROOT/'assets/book-route-questions.js').read_text()).group(1).split(',');uni=[u for u in uni if u.endswith('大学') and not u.startswith('その他')]
ALIASES={'東大':'東京大学','京大':'京都大学','阪大':'大阪大学','九大':'九州大学','北大':'北海道大学','名大':'名古屋大学','慶大':'慶應義塾大学','東工大':'東京科学大学'}
PLANS=[('math','ndlc=Y37 AND from=2022'),('japanese','ndlc=Y35 AND from=2022'),('social','ndlc=Y36 AND from=2022'),('science','ndlc=Y38 AND from=2022'),('english','ndlc=Y42 AND from=2022'),('junior','ndlc=Y33 AND from=2022'),('information','ndlc=Y44 AND from=2022'),('eiken','title="英検" AND from=2022'),('toeic','title="TOEIC" AND from=2022'),('it','ndlc=Y57 AND from=2025'),('business','ndlc=Y54 AND from=2025'),('health','title="登録販売者" AND from=2025')]
EXTENDED_PLANS=[('school-'+code,'ndlc='+code+' AND from=2000') for code in ['Y33','Y35','Y36','Y37','Y38','Y42','Y44','Y45']]+[('qualification-'+code,'ndlc='+code+' AND from=2025') for code in ['Y52','Y53','Y54','Y55','Y56','Y57','Y58','Y59'] ]
LEGAL={'宅建','FP3級','FP2級','行政書士','社会保険労務士','登録販売者'}
def norm(v):
 v=str(v).replace('Ⅲ','3').replace('Ⅱ','2').replace('Ⅰ','1');v=unicodedata.normalize('NFKC',v)
 v=re.sub(r'数学\s*(III|II|I)(?=[^A-Za-z]|$)',lambda m:'数学'+{'I':'1','II':'2','III':'3'}[m[1]],v)
 return re.sub(r'[^\w]','',v.lower())
def clean_year(v):
 v=unicodedata.normalize('NFKC',v)
 v=re.sub(r'(?:20\d{2})(?:\s*[-〜～/・]\s*(?:20)?\d{2})?\s*(?:年度?(?:版)?|年版|版)','',v)
 if re.fullmatch(r'20\d{2}(?:[-〜～/]20?\d{2})?',v.strip()):v=''
 v=re.sub(r'^20[23]\d(?=\D|$)','',v)
 v=re.sub(r"(?<!\d)['’‘]?\d{2}(?:[-〜～/]\d{2})?年(?:度)?(?:版)?",'',v)
 v=re.sub(r'[\[【(（]\s*20\d{2}(?:[-〜～/]\d{2,4})?\s*[\]】)）]','',v)
 v=re.sub(r'[ .]+20\d{2}(?:[-〜～/]\d{2,4})?$','',v)
 v=re.sub(r'(?:令和|平成)[元\d]+(?:年度?|年版)?(?:版)?','',v)
 v=re.sub(r'(?:第\s*[\d一二三四五六七八九十]+\s*版|[\d一二三四五六七八九十]+訂(?:増補)?版|改訂(?:新版|版)?|新装版|最新版|新訂版|新版|新課程(?:対応)?|全訂版|増補版)','',v)
 return v.strip(' .、,:：・-—()（）[]【】')
def identity(b):
 title=b.get('sourceTitle') or b['title'];main=title.split(' : ')[0]
 volume=clean_year(b.get('sourceVolume') or '')
 publisher=norm(b['publisher']).replace('株式会社','').replace('出版事業部','').replace('学研プラス','gakken').replace('学研教育出版','gakken')
 return publisher+'|'+norm(clean_year(main))+'|'+norm(volume)
def fetch(plan,start=1,max_records=500):
 label,query=plan;params={'operation':'searchRetrieve','version':'1.2','query':query+' AND dpid=iss-ndl-opac','maximumRecords':max_records,'startRecord':start,'recordSchema':'dcndl'}
 url='https://ndlsearch.ndl.go.jp/api/sru?'+urllib.parse.urlencode(params);key=hashlib.sha256(url.encode()).hexdigest();path=CACHE/(key+'.xml')
 if not path.exists() and CACHED_ONLY:return None
 if not path.exists():
  for attempt in range(4):
   try:
    with REQUEST_LOCK:
     global LAST_REQUEST
     pause=2-(time.monotonic()-LAST_REQUEST)
     if pause>0:time.sleep(pause)
     LAST_REQUEST=time.monotonic()
    req=urllib.request.Request(url,headers={'User-Agent':'StudyPlannerCatalog/2.0 (NDL bibliographic study-book catalogue)'})
    raw=urllib.request.urlopen(req,timeout=50).read();root=ET.fromstring(raw)
    diagnostic=root.find('.//{http://www.loc.gov/zing/srw/diagnostic/}diagnostic')
    if diagnostic is not None and diagnostic.findtext('{http://www.loc.gov/zing/srw/diagnostic/}message','')!='Record does not exist':raise ValueError('SRU diagnostic')
    path.write_bytes(raw);break
   except Exception as error:
    if attempt==3:print('FETCH FAILED',label,start,type(error).__name__,flush=True);return None
    time.sleep(3*(attempt+1))
  time.sleep(1)
 root=ET.parse(path).getroot();total=int(root.findtext('s:numberOfRecords','0',NS));count=len(root.findall('.//s:recordData',NS));print('FETCH',label,start,count,'/',total,flush=True)
 return {'label':label,'query':query,'start':start,'total':total,'path':str(path),'url':url}
def date_key(value):
 parts=[int(n) for n in re.findall(r'\d+',str(value))]
 return tuple((parts+[1,1])[:3]) if parts else (0,0,0)
def publication_date(value):
 # Normalize punctuation without inventing month/day precision; keep raw text separately.
 match=re.match(r'^\D*(\d{4})(?:[./-](\d{1,2}))?(?:[./-](\d{1,2}))?',str(value))
 if not match:return ''
 year,month,day=match.groups();result=year
 if month and 1<=int(month)<=12:
  result+='-'+month.zfill(2)
  if day:
   try:datetime.date(int(year),int(month),int(day));result+='-'+day.zfill(2)
   except ValueError:pass
 return result
def record(item):
 try:r=ET.fromstring(item.text or '') if not list(item) else item[0]
 except ET.ParseError:return None
 b=r.find('n:BibResource',NS)
 if b is None:return None
 title=b.findtext('d:title','',NS).strip();pub=b.findtext('d:publisher/f:Agent/f:name','',NS).strip();source=b.get('{'+NS['rdf']+'}about','').split('#')[0]
 if not title or not pub or not source.startswith('https://ndlsearch.ndl.go.jp/books/R100000002-I'):return None
 types=[e.get('{'+NS['rdf']+'}resource','') for e in b.findall('n:materialType',NS)]
 if not any(t.endswith('/Book') for t in types):return None
 isbn=next((original.isbn13(e.text or '') for e in b.findall('d:identifier',NS) if e.get('{'+NS['rdf']+'}datatype','').endswith('/ISBN') and original.isbn13(e.text or '')),'')
 if not isbn:return None
 issued=b.findtext('d:date','',NS) or b.findtext('d:issued','',NS)
 source_issued=issued;issued=publication_date(issued)
 if not issued or date_key(issued)>tuple([TODAY.year,TODAY.month,TODAY.day]):return None
 subjects=[e.get('{'+NS['rdf']+'}resource','') for e in b.findall('d:subject',NS)]
 codes=[x.rsplit('/',1)[-1] for x in subjects if '/ndlc/' in x]
 return dict(title=title,sourceTitle=title,sourceVolume=b.findtext('n:volume','',NS),publisher=pub,isbn=isbn,source=source,published=issued,sourcePublished=source_issued,edition=b.findtext('n:edition','',NS),price=None,priceLabel=b.findtext('n:price','',NS),codes=codes,authors=[e.text for e in b.findall('dc:creator',NS) if e.text])
def classify(b):
 raw=b['title']+' '+b['sourceVolume'];t=unicodedata.normalize('NFKC',raw);codes=b['codes']
 if re.search(r'教師用|教授資料|教員用|指導書|解答のみ|旧課程|センター試験|地理B|日本史B|世界史B|DVD|CDのみ|音声CD|スマホアプリ|小学生|中学入試|中学受験|小[1-6](?!\d)',t):return None
 if re.search(r'専用ノート|解答用紙|解答ノート|解答別冊|教授用|授業づくり|教え方|指導法|合格体験|保護者|勉強法|学習法|最速合格術',t):return None
 # A title/volume must identify the exact qualification. Generic professional books are omitted.
 exam=None;domain=None;subject=None
 if re.search('英検|実用英語技能検定',t):
  grade=re.search(r'準2級プラス|準[12]級|[1-5]級',t)
  if not grade:return None
  exam=grade[0];domain='eiken';subject='英語'
 elif re.search('TOEIC',t,re.I):
  if re.search(r'Speaking|Writing|S&W|スピーキング|ライティング|Bridge|ブリッジ',t,re.I):return None
  domain='toeic';subject='英語'
 else:
  patterns=[('ITパスポート',r'ITパスポート'),('基本情報技術者',r'基本情報技術者'),('応用情報技術者',r'応用情報技術者'),('宅建',r'宅建'),('行政書士',r'行政書士'),('社会保険労務士',r'社労士|社会保険労務士'),('登録販売者',r'登録販売者'),('危険物乙4',r'危険物.*(?:乙種4|乙種第4|乙4)|乙[種類第]*4.*危険物'),('IELTS',r'IELTS'),('TOEFL',r'TOEFL')]
  for name,pattern in patterns:
   if re.search(pattern,t,re.I):exam=name;break
  if not exam:
   # Keep exact exam identities for future route support; never mix them into a supported exam.
   additional=[('歯科医師',r'歯科医師'),('臨床工学技士',r'臨床工学技士'),('視能訓練士',r'視能訓練士'),('歯科技工士',r'歯科技工士'),('あん摩マッサージ指圧師',r'あん摩マッサージ指圧師'),('はり師・きゅう師',r'はり師|きゅう師'),('施工管理技士',r'施工管理技士'),('電気通信主任技術者',r'電気通信主任技術者'),('工事担任者',r'工事担任者'),('消防設備士',r'消防設備士'),('危険物取扱者',r'危険物取扱者'),('ボイラー技士',r'ボイラー技士'),('エネルギー管理士',r'エネルギー管理士'),('衛生管理者',r'衛生管理者'),('運行管理者',r'運行管理者'),('気象予報士',r'気象予報士'),('色彩検定',r'色彩検定'),('秘書検定',r'秘書検定'),('サービス接遇検定',r'サービス接遇検定'),('販売士',r'販売士|リテールマーケティング'),('ビジネス実務法務検定',r'ビジネス実務法務'),('証券外務員',r'証券外務員|外務員.*試験'),('証券アナリスト',r'証券アナリスト'),('統計検定',r'統計検定'),('数学検定',r'数学検定|数検'),('医師',r'(?<!獣)(?<!歯科)医師'),('司法書士',r'司法書士'),('弁理士',r'弁理士'),('司法試験',r'司法試験|司法予備試験'),('公認会計士',r'公認会計士'),('税理士',r'税理士'),('中小企業診断士',r'中小企業診断士'),('不動産鑑定士',r'不動産鑑定士'),('土地家屋調査士',r'土地家屋調査士'),('マンション管理士',r'マンション管理士'),('管理業務主任者',r'管理業務主任者'),('賃貸不動産経営管理士',r'賃貸不動産経営管理士'),('社会福祉士',r'社会福祉士'),('精神保健福祉士',r'精神保健福祉士'),('介護福祉士',r'介護福祉士'),('ケアマネジャー',r'ケアマネジャー|介護支援専門員'),('保育士',r'保育士'),('准看護師',r'准看護師'),('看護師',r'看護師'),('助産師',r'助産師'),('保健師',r'保健師'),('理学療法士',r'理学療法士'),('作業療法士',r'作業療法士'),('言語聴覚士',r'言語聴覚士'),('管理栄養士',r'管理栄養士'),('臨床検査技師',r'臨床検査技師'),('診療放射線技師',r'診療放射線技師'),('薬剤師',r'薬剤師'),('歯科衛生士',r'歯科衛生士'),('救急救命士',r'救急救命士'),('柔道整復師',r'柔道整復師'),('獣医師',r'獣医師'),('調理師',r'調理師'),('製菓衛生師',r'製菓衛生師'),('美容師',r'美容師'),('理容師',r'理容師'),('一級建築士',r'1級建築士|一級建築士'),('二級建築士',r'2級建築士|二級建築士'),('第二種電気工事士',r'第?2種電気工事士|第二種電気工事士'),('第一種電気工事士',r'第?1種電気工事士|第一種電気工事士'),('電験三種',r'電験3種|電験三種|第三種電気主任技術者'),('電験二種',r'電験2種|電験二種'),('技術士',r'技術士'),('測量士補',r'測量士補'),('測量士',r'測量士'),('通関士',r'通関士'),('国内旅行業務取扱管理者',r'国内旅行業務'),('総合旅行業務取扱管理者',r'総合旅行業務'),('総合無線通信士',r'総合無線通信士'),('陸上無線技術士',r'陸上無線技術士'),('情報処理安全確保支援士',r'情報処理安全確保支援士'),('ネットワークスペシャリスト',r'ネットワークスペシャリスト'),('データベーススペシャリスト',r'データベーススペシャリスト'),('システムアーキテクト',r'システムアーキテクト'),('プロジェクトマネージャ',r'プロジェクトマネージャ'),('ITストラテジスト',r'ITストラテジスト'),('情報セキュリティマネジメント',r'情報セキュリティマネジメント'),('公務員採用試験',r'公務員.*(?:試験|合格|問題|過去問)|(?:試験|合格|問題|過去問).*公務員'),('教員採用試験',r'教員採用'),('警察官採用試験',r'警察官.*(?:採用|試験|問題)'),('消防官採用試験',r'消防(?:官|士).*?(?:採用|試験|問題)')]
   if re.search(r'試験|合格|問題|過去問|テキスト|教科書|受験|国試|一問一答|対策|要点',t):
    for name,pattern in additional:
     if re.search(pattern,t):exam=name;break
  if not exam and re.search(r'簿記',t):
   grade=re.search(r'[123]級',t)
   mixed=len(set(re.findall(r'([123])級',t)))>1 or re.search(r'[123](?:級)?[・/+と][123]級',t)
   if grade and not mixed:exam=('全商簿記' if '全商' in t else '全経簿記' if '全経' in t else '日商簿記')+grade[0]
  if not exam and re.search(r'FP|ファイナンシャル',t,re.I):
   grade=re.search(r'[123]級',t)
   if grade and not (len(set(re.findall(r'([123])級',t)))>1 or re.search(r'[123](?:級)?[・/+と][123]級',t)):exam='FP'+grade[0]
  if not exam and re.search(r'漢検|漢字検定',t):
   grade=re.search(r'準[12]級|10級|[1-9]級',t)
   if grade:exam='漢検'+grade[0]
  if exam:domain='qualification';subject=exam
 if domain=='qualification':
  if not any(c in ['Y54','Y56','Y57','Y45','Y42','YU37','YU51'] for c in codes) and not re.search(r'試験|合格|問題|受験|テキスト|教科書|参考書|単語|キタミ式',t):return None
  if exam in LEGAL and date_key(b['published'])[0]<2025:return None
 if not domain:
  if 'Y33' in codes or re.search(r'高校入試|中[123]|中学(?:英語|数学|国語|理科|社会|地理|歴史|公民)',t):domain='junior'
  elif any(c in ['Y35','Y36','Y37','Y38','Y42','Y44','Y352'] for c in codes) or re.search('大学入試|大学受験|共通テスト|高校(?:英語|数学|国語|物理|化学|生物|地学|情報)',t):domain='entrance'
  else:return None
  if 'Y37' in codes:subject='数学'
  elif 'Y35' in codes:subject='国語'
  elif 'Y42' in codes:subject='英語'
  else:
   for pattern,value in [(r'英語|英文|英単語|英熟語|リスニング|English','英語'),(r'数学','数学'),(r'現代文|古文|漢文|国語','国語'),(r'物理','物理'),(r'化学','化学'),(r'生物','生物'),(r'地学','地学'),(r'世界史','世界史'),(r'日本史','日本史'),(r'地理','地理'),(r'政治.*経済|政経','政治経済'),(r'倫理','倫理'),(r'公共','公共'),(r'情報[1ⅠI]|情報科','情報'),(r'理科','理科'),(r'社会','社会')]:
    if re.search(pattern,t,re.I):subject=value;break
  if not subject:return None
  if domain=='junior':
   subject='理科' if subject in ['物理','化学','生物','地学'] else '社会' if subject in ['世界史','日本史','地理','政治経済','倫理','公共'] else subject
   if subject not in ['英語','数学','国語','理科','社会']:return None
   # Region/school-specific high-school admission papers cannot be matched by the current selector.
   if re.search(r'(?:都|道|府|県).*?(?:入試|高校|高等学校)|(?:入試|高校).*?(?:都|道|府|県)',t):return None
  if domain=='entrance' and subject in ['理科','社会']:return None
  if domain=='entrance' and subject=='数学' and date_key(b['published'])[0]<2023:return None
  if domain=='entrance' and subject in ['日本史','世界史','地理','公共','政治経済','倫理','情報'] and date_key(b['published'])[0]<2024:return None
 # Preserve individual skills/grades. Do not claim a book covers chapters absent from the title unless it is a general subject reference.
 skills=[]
 for pattern,skill in [(r'文法|grammar','文法'),(r'語法','語法'),(r'単語|語彙|語句|キクタン|vocabulary','単語'),(r'熟語|イディオム','語法'),(r'長文|リーディング|reading','長文'),(r'リスニング|listening|パート[1234]','リスニング'),(r'解釈|構文','解釈'),(r'英作文|ライティング|writing','英作文'),(r'面接|二次試験','面接'),(r'現代文','現代文'),(r'古文|古典文法','古文'),(r'漢文','漢文'),(r'(?<!熱)力学','力学'),(r'波動','波動'),(r'熱','熱'),(r'電磁気','電磁気'),(r'原子','原子'),(r'理論','理論'),(r'無機','無機'),(r'有機','有機'),(r'商業','商業簿記'),(r'工業','工業簿記'),(r'アルゴリズム','アルゴリズム'),(r'プログラミング','プログラミング'),(r'過去問|本試験|予想問題|模試','過去問')]:
  if re.search(pattern,t,re.I):skills.append(skill)
 if not skills or skills==['過去問']:
  skills+= {'英語':['文法','長文'],'国語':['国語'],'物理':['力学','波動','熱','電磁気','原子'],'化学':['理論','無機','有機'],'生物':['生物基礎','遺伝','代謝','生態'],'日本史':['通史'],'世界史':['通史'],'地理':['系統地理','地誌'],'政治経済':['政治','経済'],'倫理':['倫理'],'公共':['公共'],'情報':['情報Ⅰ'],'数学':['数学'],'理科':['理科'],'社会':['社会']}.get(subject,['基礎'])
 if domain=='eiken' and not any(s in skills for s in ['単語','文法','長文','リスニング','英作文','面接']):skills+=['文法','長文','リスニング']
 if domain=='toeic' and not any(s in skills for s in ['単語','文法','長文','リスニング']):skills+=['長文','リスニング']
 if domain=='qualification' and exam and '簿記' in exam and not any(s in skills for s in ['商業簿記','工業簿記']):skills+=['商業簿記']+(['工業簿記'] if '2級' in exam else [])
 stage=2
 if re.search(r'やさしい理系数学|化学の新演習|ポレポレ|英文解釈教室|英文読解の透視図|数学の真髄|数学.*掌握|新数学演習',t):stage=4
 elif re.search(r'Focus Gold|フォーカスゴールド|基礎からの数学|化学の新研究|1対1対応',t,re.I):stage=3
 elif re.search(r'入門|やさしい|はじめて|ゼロから|初心者|超基礎|ひとつひとつ',t):stage=1
 elif re.search(r'難関|最難関|上級|発展|標準問題精講|プラチカ|名問|トップレベル|ハイレベル|900|990',t):stage=4
 elif re.search(r'応用|実戦|実践|重要問題|800|700|過去問|予想|模試',t):stage=3
 if domain=='toeic' and not re.search(r'単語|単熟語|語彙|熟語|文法|語法|フレーズ',t) and date_key(b['published'])[0]<2017:return None
 if exam=='TOEFL' and (re.search(r'ITP|PBT|CBT',t,re.I) or (not re.search(r'単語|単熟語|語彙|熟語|文法|語法',t) and date_key(b['published'])[0]<2026)):return None
 if domain=='eiken' and exam=='準2級プラス' and date_key(b['published'])[0]<2025:return None
 if domain=='eiken' and not re.search(r'単語|単熟語|語彙|熟語|文法|語法|パス単',t) and date_key(b['published'])[0]<2024:return None
 if domain=='eiken':stage={'5級':1,'4級':1,'3級':2,'準2級':2,'準2級プラス':3,'2級':3,'準1級':4,'1級':4}[exam]
 scopes=[]
 if domain=='entrance':
  scopes=[u for u in uni if u in t]
  scopes+= [u for alias,u in ALIASES.items() if re.search(alias+r'(?:の|英語|数学|国語|理科|物理|化学|日本史|世界史|対策|入試)',t)]
  if '早慶' in t:scopes+=['早稲田大学','慶應義塾大学']
  scopes=list(dict.fromkeys(scopes))
  if scopes:stage=4
  if re.search(r'大学(?:別|の)|東大|京大|阪大|早大|慶大',t) and not scopes:scopes=[t]
 volume=b['sourceVolume'].strip();main=b['title'];display=main+(' '+volume if volume and norm(volume) not in norm(main) else '')
 out={k:v for k,v in b.items() if k not in ['codes']};out.update(id='ndl-'+b['isbn'],title=display,domain=domain,subject=subject,stage=stage,skills=list(dict.fromkeys(skills)),exams=[exam] if exam else [],studyDays=35 if stage>=3 else 25,verified=True,verifiedAt=str(TODAY),availabilityStatus='販売状況未確認',metadataStatus='国立国会図書館サーチ所蔵書誌から収録。難易度・分野タグはアプリ編集情報。',editorialNote='書誌情報に基づく分類。難易度・学習日数は編集上の目安。')
 if re.search('教科書ガイド|教科書ワーク|準拠',t):out['requiresTextbookMatch']=True
 if scopes:out['examScopes']=scopes
 return out

def build(files,write=False):
 data=json.loads(PATH.read_text());base=[dict(b) for b in data['books'] if not b.get('bulkImported')];current={identity(b):b for b in base if b.get('verified') and not b.get('excludedReason')};raw_count=0;classified_count=0
 for info in files:
  for element in ET.parse(info['path']).findall('.//s:recordData',NS):
   raw_count+=1;b=record(element)
   if b is None:continue
   b=classify(b)
   if b is None:continue
   classified_count+=1;key=identity(b)
   if key in current:
    previous=current[key]
    if date_key(b['published'])>date_key(previous.get('published','')):
     if previous.get('bulkImported'):current[key]=dict(b,bulkImported=True)
     else:
      # Preserve saved IDs/editorial tags while upgrading the bibliographic edition.
      for fact in ['title','publisher','isbn','source','sourceTitle','sourceVolume','published','sourcePublished','edition','price','priceLabel','authors','availabilityStatus']:
       if fact in b:previous[fact]=b[fact]
   else:current[key]=dict(b,bulkImported=True)
 seen=set();added=[]
 for b in current.values():
  if b['isbn'] in seen:continue
  seen.add(b['isbn'])
  if b.get('bulkImported'):added.append(b)
 combined=base+added;by_domain={};by_subject={}
 for b in combined:
  if b.get('verified') and not b.get('excludedReason'):
   by_domain[b['domain']]=by_domain.get(b['domain'],0)+1;k=b['domain']+':'+b['subject'];by_subject[k]=by_subject.get(k,0)+1
 count=sum(by_domain.values());report=dict(baseline=BASELINE,verified=count,added=len(added),rawRecords=raw_count,eligibleBeforeDedup=classified_count,domains=by_domain,subjects=by_subject,queries=[{k:v for k,v in i.items() if k!='path'} for i in files],date=str(TODAY),editionDedup='publisher + normalized main title + volume excluding edition/year; unique ISBN')
 (CACHE/'draft.json').write_text(json.dumps({'books':combined},ensure_ascii=False,indent=2)+'\n')
 (CACHE/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 if write:
  data.update(version=3,updated=str(TODAY),books=combined,verifiedCount=count,expansion={'baseline':BASELINE,'target':10000,'verified':count,'date':str(TODAY),'source':'https://ndlsearch.ndl.go.jp/help/api','deduplicatedEditions':True})
  temp=PATH.with_suffix('.json.tmp');temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');temp.replace(PATH)
 print('BUILD',count,'verified, new',len(added),by_domain,flush=True);return count
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');parser.add_argument('--cached-only',action='store_true');parser.add_argument('--comprehensive',action='store_true',help='Compatibility alias; collection always uses date partitions');args=parser.parse_args()
 spec=importlib.util.spec_from_file_location('collector',ROOT/'scripts/collect-comprehensive-catalog.py');collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector);collector.m.CACHED_ONLY=args.cached_only;collector.run(False)
 if args.write:import runpy;runpy.run_path(str(ROOT/'scripts/finalize-book-collection.py'),run_name='__main__')
