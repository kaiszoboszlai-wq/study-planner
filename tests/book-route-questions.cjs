const assert=require('node:assert/strict'),q=require('../assets/book-route-questions.js'),engine=require('../assets/book-route-engine.js'),catalog=require('../assets/book-catalog.json'),presentation=require('../assets/book-route-features.js');
const now=new Date(2026,9,26,23,55),math={category:'共通テスト',subject:'数学',unit:'数学Ⅰ・A',level:'2',target:'rate-80',date:'2027-02-01',owned:['book-032','book-003']};
assert.match(q.context(math).current[0].label,/基本知識/);assert.match(q.context(math).current[1].label,/典型問題/);assert.match(q.context(math).target.find(o=>o.value==='rate-80').label,/80%/);
assert(q.context({...math,category:'大学入試',exam:'東京大学'}).target.every(t=>/得点率/.test(t.label)));
assert.match(q.context({category:'大学入試',subject:'英語',unit:'英文法'}).current[1].label,/時制/);
assert.match(q.context({category:'大学入試',subject:'英語',unit:'英語リスニング'}).current[0].label,/聞き取/);
assert.match(q.context({category:'TOEIC'}).target[2].label,/800点/);
assert.match(q.context({category:'英検',exam:'英検2級'}).target[0].label,/合格基準/);
assert.match(q.context({category:'資格試験',exam:'日商簿記3級'}).target[0].label,/70点/);
assert.match(q.context({category:'資格試験',exam:'IELTS'}).target[2].label,/6.5/);
assert.match(q.context({category:'資格試験',exam:'TOEFL'}).target[2].label,/5.0/);
// Every offered exam must use its own assessment, including Eiken subskills.
for(const exam of ['英検5級','英検4級','英検3級','英検準2級','英検準2級プラス','英検2級','英検準1級','英検1級']){
 const a={category:'英検',exam};
 for(const unit of q.fields(a,catalog).find(f=>f.key==='unit').choices){
  const current=q.context({...a,unit}).current;
  assert.equal(current.length,4);assert(current.every((o,i)=>o.label.startsWith(exam+'：')&&o.value===String(i+1)&&o.stage===i+1));
  assert(current.every(o=>!/標準問題|標準的な問題|応用問題|難関校/.test(o.label)));
 }
 const listening=q.context({...a,unit:'英語リスニング'}).current.map(o=>o.label).join();assert.match(listening,/聞き取/);assert.doesNotMatch(listening,/英作文|文法用語/);
 if(!/英検[45]級/.test(exam))assert.match(q.context({...a,unit:'面接'}).current[0].label,/面接/);
}
const qualificationAssessments={ITパスポート:/経営|管理/,基本情報技術者:/アルゴリズム/,応用情報技術者:/技術・管理手法/,日商簿記3級:/仕訳|決算/,日商簿記2級:/工業簿記|連結会計/,FP3級:/保険|年金/,FP2級:/制度・計算/,宅建:/宅建業法|権利関係/,行政書士:/行政法|記述式/,社会保険労務士:/選択式|給付要件/,登録販売者:/医薬品|副作用/,危険物乙4:/燃焼|消火/,漢検2級:/書き取り|四字熟語/,漢検準2級:/書き取り|四字熟語/,漢検3級:/書き取り|四字熟語/,IELTS:/Overallバンド/,TOEFL:/総合スコア/};
const offeredQualifications=q.fields({category:'資格試験'},catalog).find(f=>f.key==='exam').choices.filter(e=>e!=='その他の資格（未収録）');
assert(!offeredQualifications.includes('司法試験'),'Catalog-only exams must not expose an unsupported questionnaire');
for(const exam of offeredQualifications){
 assert(qualificationAssessments[exam],'Add a specific assessment for '+exam);
 const current=q.context({category:'資格試験',exam}).current;assert.match(current.map(o=>o.label).join(),qualificationAssessments[exam]);assert(current.every(o=>!/標準問題|標準的な問題|応用問題|難関校/.test(o.label)));
}
for(const a of [{category:'TOEIC'},{category:'資格試験',exam:'IELTS'},{category:'資格試験',exam:'TOEFL'}]){const fs=q.fields(a,catalog);assert(fs.some(f=>f.key==='purpose'));assert(!fs.some(f=>['level','target'].includes(f.key)));}
const eikenConditions=q.conditions({category:'英検',exam:'英検2級',unit:'英語リスニング',level:'3',target:'1',date:'2027-02-01',owned:[]},catalog);assert.match(eikenConditions.level,/話の大意/);assert.equal(eikenConditions.currentStage,3);assert.equal(eikenConditions.targetStage,3);assert(engine.recommend(eikenConditions,catalog).routes.length);
assert.notDeepEqual(q.context({category:'高校入試',subject:'数学'}).current,q.context({category:'大学入試',subject:'数学'}).current);
assert(!q.fields(math,catalog).some(f=>['days','weakness','priority','minutes'].includes(f.key)));
assert.equal(q.fields({category:'TOEIC'},catalog)[1].key,'date');
assert.equal(q.fields({category:'大学入試'},catalog)[2].key,'date');
for(const category of ['大学入試','高校入試','共通テスト']){assert(!q.fields({category,subject:'数学'},catalog).some(f=>f.key==='unit'));}for(const subject of ['英語','国語'])assert(q.fields({category:'大学入試',subject},catalog).some(f=>f.key==='unit'));
for(const percent of [10,20,30,40])assert(q.context(math).target.some(o=>o.value==='rate-'+percent));
assert(q.ownedBooks(math,catalog).every(b=>b.subject==='数学'&&b.domain==='entrance'));assert(q.ownedBooks({category:'英検',exam:'英検2級'},catalog).every(b=>b.exams.includes('2級')));
assert.equal(q.remainingDays('2026-10-27',now),1);assert.equal(q.remainingDays('2026-10-26',now),0);assert.throws(()=>q.remainingDays('2026-10-25',now));assert.throws(()=>q.remainingDays('2027-02-30',now));
let c=q.conditions(math,catalog);assert.equal(c.currentStage,2);assert.equal(c.targetStage,3);assert.equal(c.date,math.date);assert.equal(c.unit,'全範囲');assert.equal(c.subject,'数学');assert.equal(c.minutes,undefined);assert(c.owned.includes('数学'));assert(!c.owned.includes('英単語'));assert(!('priority' in c));assert(!('weakness' in c));
let result=engine.recommend(c,catalog);assert(result.routes.length);assert(result.routes.some(r=>r.books.some(b=>b.owned)));assert(result.routes.every(r=>!r.schedule&&r.books.every(b=>b.days===undefined)));
for(const b of catalog.books.filter(b=>b.verified)){assert(presentation.features(b).length>15);assert(!/例題→|取り組む|学習してください/.test(presentation.features(b)));assert(presentation.price(b).label);}
const uni=require('../assets/university-admissions.json');catalog.admissions=uni;const fac=uni.universities.find(u=>u.name==='東京大学').faculties.find(f=>f.name==='理科一類'),dep=fac.departments[0],method=dep.methods.find(m=>m.stage==='individual');const hard=q.conditions({...math,date:'2027-03-01',category:'大学入試',exam:'東京大学',faculty:fac.id,department:dep.id,admissionMethod:method.id,level:'3',target:'rate-20'},catalog);assert.equal(hard.target,'得点率20%（2割）');assert(engine.recommend(hard,catalog).routes.some(r=>r.books.some(b=>b.stage===4)));
console.log('PASS math skips unit, English/Japanese retain units, low target rates preserve hard-exam difficulty; score/criterion branches, calendar dates, removed questions, subject/grade ownership filters, recomputed days and concise book features');

const basic=q.conditions({...math,category:'大学入試',exam:'東京大学',faculty:fac.id,department:dep.id,admissionMethod:method.id,date:'2028-03-01',purpose:'1'},catalog);assert.equal(basic.purpose,'基本知識を身につけたい');assert.equal(basic.targetStage,1);assert(engine.recommend(basic,catalog).routes.every(r=>r.books.every(b=>b.stage===1)));assert(engine.recommend(basic,catalog).routes.every(r=>!/年度は未確認|今の実力/.test(r.reason)));
