const assert=require('node:assert/strict'),p=require('../assets/book-route-policy.js'),e=require('../assets/book-route-engine.js'),q=require('../assets/book-route-questions.js');
const now=new Date(2026,9,26),b=(id,title,extra={})=>({id,title,publisher:'出版社',subject:'英語',domain:'entrance',stage:2,skills:['文法'],studyDays:20,price:null,verified:true,exams:[],...extra}),input={category:'共通テスト',exam:'共通テスト',subject:'英文法',baseSubject:'英語',level:'基礎は学んだ',target:'8割',currentStage:2,targetStage:2,days:90};
const unknown=b('a','条件に合う教材'),known=b('z','Next Stage 英文法・語法問題',{publisher:'桐原書店'}),catalog={version:1,books:[unknown,known]};
assert.equal(e.recommend(input,catalog).routes[0].books[0].id,'z');
assert.equal(e.recommend({...input,owned:unknown.title},catalog).routes[0].books[0].id,'a');
assert.equal(e.recommend(input,{books:[unknown,{...known,stage:4}]}).routes[0].books[0].id,'a');
assert(!p.recognition({...known,publisher:'別の出版社'}));assert(!p.recognition(b('x','無名の教材',{publisher:'旺文社'})));assert(!p.recognition(b('x','基礎からの数学1完成ノート',{publisher:'数研出版'})));
for(const title of ['試験対策 2024年版','試験対策 2025年度版',"試験対策 '24年版",'試験対策 令和6年度版','試験対策. [2024]']){const old=b('old',title);assert(p.annualYear(old)<2026);assert(!p.currentIds({books:[old]},now).has('old'));assert(!e.recommend(input,{books:[old]}).routes.length);assert(!q.ownedBooks({category:'共通テスト',subject:'英語'},{books:[old]}).length);}
assert.equal(p.annualYear(b('x','試験対策 2026-2027年版')),2027);assert.equal(p.annualYear(b('x','試験対策 2024年版',{sourceTitle:'試験対策 2027年版'})),2024);
for(const title of ['英単語ターゲット1900','高校英単語 2000','入試問題研究 2001〜2025年入試','この問題が合否を決める! 2022～2024年入試'])assert.equal(p.annualYear(b('x',title)),null);
const fresh=b('fresh','定番文法',{published:'2022.4',edition:'第4版'}),old=b('old','定番文法',{published:'2020.4',edition:'第3版'});assert(p.currentIds({books:[old,fresh]},now).has('fresh'));assert(!p.currentIds({books:[old,fresh]},now).has('old'));
assert(p.currentIds({books:[old,{...fresh,verified:false}]},now).has('old'));
assert.equal(p.editionNumber(b('x','数学Ⅰ・A 基礎問題精講',{edition:'六訂版'})),6);assert.equal(p.editionNumber(b('x','English grammar',{edition:'4th Edition'})),4);
const yearly=[b('y26','資格対策. 2026年版'),b('y27','資格対策. 2027年版')];assert.deepEqual([...p.currentIds({books:yearly},now)],['y27']);
assert.equal(p.annualYear(b('x',"対策 '26-27年版")),2027);const ranges=[b('r1','対策 2025-2026年版'),b('r2','対策 2026-2027年版')];assert.deepEqual([...p.currentIds({books:ranges},now)],['r2']);
const real=require('../assets/book-catalog.json'),ids=p.currentIds(real,now),rows=real.books.filter(b=>ids.has(b.id));assert(rows.length>1100);assert(rows.every(b=>!p.annualYear(b)||p.annualYear(b)>=2026));
console.log('PASS known-series preference keeps fit/ownership first, publisher checks, old annual editions and superseded versions excluded, current long-sellers retained; eligible books:',rows.length);

assert.equal(p.annualYear({title:'過去問題集',sourceVolume:'2024年度版'}),2024);assert.equal(p.annualYear({title:'数学問題集',sourceVolume:'1'}),null);

for(const title of ['数学Ⅲ・C','数学演習Ⅲ・C','数学I・II・III','理系数学3'])assert.equal(p.bookFitsScope({title,subject:'数学'},{mathIII:false}),false);assert.equal(p.bookFitsScope({title:'数学Ⅰ・A',subject:'数学'},{mathIII:false}),true);
