const assert=require('node:assert/strict'),engine=require('../assets/book-route-engine.js');
const book=(id,subject,stage,skills,extra={})=>({id,title:'教材'+id,publisher:'出版社',subject,domain:'entrance',stage,skills,studyDays:21,price:null,verified:true,exams:[],...extra});
const data={version:1,books:[book('1','英語',1,['文法']),book('2','英語',2,['文法']),book('3','英語',3,['文法']),book('4','英語',2,['リスニング']),book('5','数学',2,['数学Ⅰ・A'],{title:'数学Ⅰ・A 基礎問題精講'}),book('6','数学',2,['数学Ⅲ・C'],{title:'数学Ⅲ・C 基礎問題精講'}),book('7','英語',2,['文法'],{verified:false}),book('8','英語',2,['文法'],{excludedReason:'旧課程'}),book('9','日商簿記3級',1,['商業簿記'],{domain:'qualification',exams:['日商簿記3級']})]};
const input={category:'共通テスト',exam:'共通テスト',subject:'英文法のみ',level:'55/100',target:'8割',days:60,currentStage:2,targetStage:3};
let r=engine.recommend(input,data);assert(r.routes.length);for(const route of r.routes){assert(route.books.every(b=>b.skills.includes('文法')));assert(!route.books.some(b=>['7','8'].includes(b.id)));assert.equal(route.schedule,undefined);assert(route.books.every(b=>b.days===undefined));}
r=engine.recommend({...input,subject:'数学1Aのみ'},data);assert(r.routes[0].books.every(b=>b.id==='5'));
r=engine.recommend({...input,owned:'教材3'},data);assert(r.routes[0].books.some(b=>b.id==='3'&&b.owned));
r=engine.recommend({...input,days:1},data);assert.equal(r.routes[0].books.length,1);assert(r.routes[0].books.every(b=>b.days===undefined));assert(r.routes[0].books.every(b=>b.selective));
assert.equal(engine.recommend({...input,category:'資格試験',exam:'未登録資格'},data).routes.length,0);
r=engine.recommend({...input,category:'資格試験',exam:'日商簿記3級',subject:'全科目',currentStage:1,targetStage:3},data);assert(r.routes[0].books.every(b=>b.exams.includes('日商簿記3級')));
assert.equal(engine.recommend({...input,category:'資格試験',exam:'日商簿記2級',subject:'全科目'},data).routes.length,0);
assert.equal(engine.recommend({...input,category:'英検',exam:'英検準2級プラス'},data).routes.length,0);
assert.throws(()=>engine.recommend({...input,days:-1},data));
assert.deepEqual(engine.recommend(input,data),engine.recommend(input,data));
console.log('PASS deterministic selection, exact scope, owned priority, verified-only, duration, unsupported exams and exam-level isolation');
// Actual sales rank wins within compatible books, while scope and ownership remain constraints.
const salesData={version:2,books:[book('a','英語',2,['文法'],{isbn:'9784010347478'}),book('b','英語',2,['文法'],{isbn:'9784010349182'})]};
const sold={available:true,books:[{isbn:'9784010349182',rank:1}]};
r=engine.recommend({...input,days:1,salesRanking:sold},salesData);assert.equal(r.routes[0].books[0].id,'b');assert.match(r.routes[0].reason,/楽天ブックスの売れ筋/);
r=engine.recommend({...input,days:1,salesRanking:sold,owned:'教材a'},salesData);assert.equal(r.routes[0].books[0].id,'a');
r=engine.recommend({...input,subject:'数学',baseSubject:'数学',examScope:{mathIII:false}},data);assert(r.routes.every(x=>x.books.every(b=>b.id!=='6')));assert.match(r.routes[0].reason,/数学Ⅲを出題範囲から除外/);
assert.equal(salesData.books[1].rakutenSales,undefined);
console.log('PASS live sales prioritization, ownership precedence, scope exclusions and concise reasons');
