(function(root){
'use strict';
const coverage=root.BookRouteCoverage||(typeof module!=='undefined'?require('./book-route-coverage.js'):null);
const policy=root.BookRoutePolicy||(typeof module!=='undefined'?require('./book-route-policy.js'):null);
const normalize=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/[\s・＋+〔〕［］「」!！、,\-]/g,'');
const includes=(a,b)=>normalize(a).includes(normalize(b));
const skillRules=[['文法',/文法|grammar/],['語法',/語法/],['二次関数',/二次関数|2次関数/],['確率',/確率/],['図形',/図形/],['整数',/整数/],['データ',/データ/],['三角関数',/三角関数/],['指数対数',/指数|対数/],['微分積分',/微分|積分|微積/],['数列',/数列/],['ベクトル',/ベクトル/],['統計',/統計/],['極限',/極限/],['複素数',/複素数/],['曲線',/曲線/],['リスニング',/リスニング|listening|聞き取り/],['長文',/長文|読解|reading|リーディング/],['単語',/単語|語彙|vocabulary/],['解釈',/英文解釈|構文/],['英作文',/英作文|ライティング|writing/],['面接',/面接|スピーキング|speaking/],['現代文',/現代文/],['古文',/古文/],['漢文',/漢文/],['力学',/力学/],['波動',/波動/],['電磁気',/電磁気/],['熱',/熱/],['原子',/原子/],['理論',/理論/],['無機',/無機/],['有機',/有機/],['商業簿記',/商業/],['工業簿記',/工業/],['アルゴリズム',/アルゴリズム/],['プログラミング',/プログラミング/],['過去問',/過去問|実戦|模試/]];
const skills=s=>skillRules.filter(([k,re])=>re.test(String(s).normalize('NFKC').toLowerCase().replace(/熱力学/g,'熱'))).map(([k])=>k);
function examProfile(c){
 const exam=normalize(c.exam),category=c.category;
 if(category==='TOEIC'||exam.includes('toeic'))return {domain:'toeic'};
 if(category==='英検'||exam.includes('英検')){let grade=String(c.exam).normalize('NFKC').match(/準2級プラス|準[12]級|[1-5]級/);return {domain:'eiken',exam:grade?grade[0]:null};}
 const patterns=[['ITパスポート',/itパスポート|iパス/],['基本情報技術者',/基本情報|fe試験/],['応用情報技術者',/応用情報|ap試験/],['日商簿記3級',/簿記3級/],['日商簿記2級',/簿記2級/],['FP3級',/fp3級|3級fp|ファイナンシャル.*3級/],['FP2級',/fp2級|2級fp|ファイナンシャル.*2級/],['宅建',/宅建/],['行政書士',/行政書士/],['社会保険労務士',/社会保険労務士|社労士/],['登録販売者',/登録販売者/],['危険物乙4',/危険物.*乙4|乙4.*危険物/],['漢検準2級',/漢検準2級/],['漢検2級',/漢検2級/],['漢検3級',/漢検3級/],['IELTS',/ielts/],['TOEFL',/toefl/]];
 for(const [name,re] of patterns)if(re.test(exam))return {domain:'qualification',exam:name};
 if(category==='高校入試')return {domain:'junior'};
 if(['大学入試','共通テスト'].includes(category))return {domain:'entrance'};
 return null;
}
function stage(c,target){
 const chosen=Number(c[target?'targetStage':'currentStage']);if(chosen>=1&&chosen<=4)return chosen;
 const text=String(c[target?'target':'level']||'').normalize('NFKC');
 let ratio=null,m=text.match(/(\d+(?:\.\d+)?)\s*(?:\/|点\s*\/\s*)(\d+)/);if(m)ratio=Number(m[1])/Number(m[2]);
 if(ratio===null&&(m=text.match(/(\d+(?:\.\d+)?)\s*割/)))ratio=Number(m[1])/10;
 if(ratio===null&&(m=text.match(/(\d+(?:\.\d+)?)\s*[%％]/)))ratio=Number(m[1])/100;
 if(ratio===null&&(/toeic/i.test(c.exam)||c.category==='TOEIC')&&(m=text.match(/(\d+)\s*点/)))ratio=Number(m[1])/990;
 if(ratio!==null)return ratio<.45?1:ratio<.65?2:ratio<.85?3:4;
 if(/初心|基礎から|未学習|苦手/.test(text))return 1;
 if(/難関|発展|応用/.test(text))return 4;
 return target?3:2;
}
function mathScope(s){const n=String(s).replace(/Ⅲ/g,'3').replace(/Ⅱ/g,'2').replace(/Ⅰ/g,'1').normalize('NFKC');if(/(?:数学|数|理系数学)\s*3|3\s*C|数学三/i.test(n))return 3;if(/(?:数学|数|理系数学)\s*2|2\s*B|数学二/i.test(n))return 2;if(/(?:数学|数|理系数学)\s*1|1\s*A|数学一/i.test(n))return 1;return null;}
function recommend(c,catalog){
 if(!c.exam||!c.subject||!c.level||!c.target||!Number.isInteger(Number(c.days))||Number(c.days)<0||Number(c.days)>3650)throw Error('試験・対象範囲・実力・目標・残り日数を確認してください。');
 if(c.admissionsSubjects&&!c.admissionsSubjects.includes(c.baseSubject))throw Error('選択した入試方式で使う教科を選び直してください。');
 const profile=examProfile(c),warnings=[];if(!profile)return {routes:[],warnings:['この試験に対応する教材データはまだありません。試験名や級を確認してください。']};
 if(profile.domain==='eiken'&&!profile.exam)return {routes:[],warnings:['英検の級まで入力してください（例：英検2級）。']};
 const currentBooks=policy.currentIds(catalog);
 let pool=catalog.books.filter(b=>b.domain===profile.domain&&!b.excludedReason&&b.verified&&currentBooks.has(b.id)).map(b=>({...b,skills:coverage.skills(b)}));
 if(profile.exam)pool=pool.filter(b=>b.exams.includes(profile.exam));
 pool=pool.filter(b=>!b.examScopes||b.examScopes.some(exam=>includes(c.exam,exam)));
 if(profile.domain==='qualification'&&/宅建|FP|行政書士|社会保険労務士|登録販売者/.test(profile.exam)){var cutoff=new Date().getFullYear()-1;pool=pool.filter(b=>!b.published||Number(b.published.slice(0,4))>=cutoff);}
 const requested=skills(c.subject),focus=[...new Set(skills(c.priority+' '+c.weakness).concat((c.focusSkills||[]).filter(t=>catalog.books.some(b=>b.skills.includes(t)))))],current=stage(c,false),target=Math.max(current,stage(c,true),profile.domain==='eiken'&&/^(準1|1)級$/.test(profile.exam)?4:1,c.category==='大学入試'&&c.examStage!=='common'&&profile.domain==='entrance'&&/東京大学|京都大学|大阪大学|東京科学大学|一橋大学|早稲田|慶應/.test(c.exam)?4:1);
 const subs=profile.domain==='qualification'?[profile.exam]:['英語','数学','国語','物理','化学','生物','日本史','世界史','地理','地学','情報','政治経済','倫理','公共','理科','社会'].filter(s=>c.baseSubject?s===c.baseSubject:includes(c.subject,s));
 if(!subs.length&&/文法|英文|リスニング|単語|英作文|リーディング/.test(c.subject))subs.push('英語');
 if(!subs.length&&/古文|漢文|現代文/.test(c.subject))subs.push('国語');
 if(!subs.length)return {routes:[],warnings:['対象の教科を確認できませんでした。「数学Ⅰ・A」「英文法」「物理」など教科や単元を指定してください。']};
 pool=pool.filter(b=>subs.includes(b.subject));
 const restricted=requested.length>0;
 if(restricted)pool=pool.filter(b=>requested.some(s=>b.skills.includes(s))||(subs.length>1&&!requested.some(s=>catalog.books.some(x=>x.subject===b.subject&&x.skills.includes(s)))));
 if(subs.includes('数学')){const scope=mathScope(c.subject);if(scope)pool=pool.filter(b=>b.subject!=='数学'||mathScope(b.title)===scope||b.skills.some(s=>mathScope(s)===scope));}
 pool=pool.filter(b=>policy.bookFitsScope(b,c.examScope));
 const sales=new Map((c.salesRanking?.books||[]).map(b=>[b.isbn,b]));pool=pool.map(b=>sales.has(b.isbn)?{...b,rakutenSales:sales.get(b.isbn)}:b);
 const ownedLines=String(c.owned||'').split(/[\n、]/).map(normalize).filter(Boolean),knownOwned=new Set();
 const owned=b=>ownedLines.some(line=>{const title=normalize(b.title);const matched=title===line||(title.length>=6&&line.includes(title));if(matched)knownOwned.add(line);return matched});
 pool=pool.map(b=>({...b,owned:owned(b)}));
 if(ownedLines.some(s=>!knownOwned.has(s)))warnings.push('未登録・書名や版が一致しない所持教材があります。所持教材の登録情報を確認してください。');
 let usable=pool.filter(b=>b.stage<=target&&b.stage>=Math.max(1,current-1)&&(!b.requiresTextbookMatch||b.owned));
 if(!usable.length)return {routes:[],warnings:warnings.concat('指定した試験・級・対象範囲・実力に合う確認済み教材が未収録です。別の試験向け教材は代わりに提案しません。')};
 if(!focus.length&&String(c.priority||c.weakness||'').trim())warnings.push('苦手・優先分野の表現を特定できませんでした。「英文法」「リスニング」「二次関数」など別の分野を選び直してください。');
 if(focus.length&&!usable.some(b=>focus.some(t=>b.skills.includes(t))))warnings.push('指定した優先分野に対応する教材は未収録です。今回の提案では優先分野を補えていません。');
 if(!Number(c.currentStage)||!Number(c.targetStage))warnings.push('得点の満点が不明な場合は標準レベルを仮定します。「実力の目安」「目標レベル」も指定すると選定を調整できます。');
 if(profile.domain==='qualification'&&['IELTS','TOEFL'].includes(profile.exam))warnings.push('この試験の収録教材は現在、単語対策が中心です。試験全体をカバーするルートではありません。');
 if(profile.domain==='qualification')warnings.push('資格試験は年度・法改正・出題範囲を確認し、受験年度に対応する版を選んでください。');

 if(Number(c.days)<30||target-current>=2)warnings.push('目標達成を保証する提案ではありません。残り期間が短い場合は必要な章と復習を優先します。');
 const availableDays=Number(c.days),variants=[['所持教材を優先',8,2],['基礎から順番に',3,5],['教材を絞って学習',4,1]],routes=[],seen=new Set();
 for(const [name,ownWeight,baseWeight] of variants){
  const candidates=usable.slice().sort((a,b)=>score(b)-score(a)||Number(!!policy.recognition(b))-Number(!!policy.recognition(a))||(name.includes('絞って')?coverage.topics(b).filter(t=>coverage.required(c,b.subject).includes(t)).length-coverage.topics(a).filter(t=>coverage.required(c,a.subject).includes(t)).length:0)||a.id.localeCompare(b.id));
  function score(b){return (b.owned?ownWeight*1000:0)+(c.examFocusSkills||[]).filter(t=>b.skills.includes(t)||includes(b.title,t)).length*500+(b.rakutenSales?200-Math.min(199,b.rakutenSales.rank):0)+focus.filter(s=>b.skills.includes(s)).length*(name.includes('絞って')?30:12)+(b.stage===current?baseWeight*5:0)+(b.stage===target?3:0)+((c.category==='共通テスト'||c.examStage==='common')&&b.skills.includes('共通テスト')?12:0);}
  const variantLimit=name.includes('絞って')?(usable.length<=2?1:2):name.includes('基礎')?4:3;
  const chosen=[],limit=Math.max(1,Math.min(variantLimit,Math.floor(availableDays/15)||1));
  for(const sub of subs){const first=candidates.find(b=>b.subject===sub);if(first&&chosen.length<limit)chosen.push(first);}
  for(const b of candidates){if(chosen.length>=limit)break;if(chosen.some(x=>x.id===b.id))continue;const duplicate=chosen.some(x=>x.subject===b.subject&&x.stage===b.stage&&x.skills.slice().sort().join()===b.skills.slice().sort().join());if(!duplicate)chosen.push(b);}
  // A richer catalog must not crowd out the goal-level step with many current-level alternatives.
  if(target>current&&limit>1&&!chosen.some(b=>b.stage===target)){const nextLevel=candidates.find(b=>b.stage===target);if(nextLevel){if(chosen.length>=limit)chosen[chosen.length-1]=nextLevel;else chosen.push(nextLevel);}}
  const complete=coverage.complete(chosen,candidates,c);if(!complete)continue;chosen.splice(0,chosen.length,...complete);
  chosen.sort((a,b)=>a.stage-b.stage||Number(b.owned)-Number(a.owned)||Number(!!policy.recognition(b))-Number(!!policy.recognition(a)));
  const key=chosen.map(b=>b.id).sort().join();if(seen.has(key))continue;seen.add(key);
  const books=chosen.map(b=>{const selective=availableDays<b.studyDays;
   const {days,minutes,...metadata}=b;
   return {...metadata,purpose:(restricted||(c.unit&&c.unit!=='全範囲')?'「'+c.subject+'」に対応する章のみを使用。':'')+(b.owned?'所持教材を活用。':'')+(focus.some(t=>b.skills.includes(t))?'苦手・優先分野を重点的に。':'')+(selective?'全冊完了ではなく、該当章の例題・弱点問題を選んで学習。':'例題→演習→間違い直しの順に取り組む。'),selective};});
  const absent=subs.filter(s=>!books.some(b=>b.subject===s));
  const reasons=[];if(c.admissionsProvisional)reasons.push(c.requestedAdmissionsYear+'年度は未確認のため、'+c.admissionsYear+'年度の科目・範囲を参考にした仮ルートです');if(c.category==='大学入試'&&c.examStage==='individual'&&!c.trendVerified)reasons.push('大学別の傾向は未確認のため、受験科目と現在の実力を基準にしました');if(c.examScope?.mathIII===false&&subs.includes('数学'))reasons.push('数学Ⅲを出題範囲から除外');if(c.examScope?.listening===false&&subs.includes('英語'))reasons.push('リスニングを出題範囲から除外');const emphasis=(c.examFocusSkills||[]).filter(t=>books.some(b=>b.skills.includes(t)||includes(b.title,t))).slice(0,3);if(emphasis.length)reasons.push('志望校の傾向に合わせて'+emphasis.join('・')+'を重視');if(books.some(b=>b.rakutenSales))reasons.push('条件に合う楽天ブックスの売れ筋教材を優先');if(books.some(b=>b.owned))reasons.push('お持ちの教材を活用');reasons.push('今の実力から目標へ進める'+books.length+'冊を選びました');
  routes.push({name,reason:reasons.join('。')+'。',trendSources:c.examTrendSources||[],salesChecked:!!c.salesRanking?.available,books,catalogVersion:catalog.version});
 }
 if(!routes.length)warnings.push('選んだ範囲を補える教材が不足しているため、一部の分野だけのルートは提案しません。');
 if(routes.length<2)warnings.push('条件に合う教材の組み合わせが限られるため、重複する案は表示していません。');
 return {routes,warnings};
}
root.BookRouteEngine={recommend,normalize,examProfile};
if(typeof module!=='undefined')module.exports=root.BookRouteEngine;
})(typeof globalThis!=='undefined'?globalThis:this);
