const assert=require('node:assert/strict'),engine=require('../assets/book-route-engine.js'),coverage=require('../assets/book-route-coverage.js'),policy=require('../assets/book-route-policy.js'),catalog=require('../assets/book-catalog.json');
const input={category:'共通テスト',exam:'共通テスト',subject:'物理',baseSubject:'物理',unit:'全範囲',level:'実力',target:'8割',currentStage:1,targetStage:4,days:90,owned:''};
const fields=['力学','波動','熱','電磁気','原子'];let routes=0;
for(const category of ['共通テスト','大学入試'])for(const currentStage of [1,2,3,4])for(const days of [1,7,30,90,365]){
 const r=engine.recommend({...input,category,exam:category==='大学入試'?'京都大学':'共通テスト',currentStage,days},catalog);assert(r.routes.length);
 for(const route of r.routes){routes++;for(const stage of new Set(route.books.map(b=>b.stage))){const books=route.books.filter(b=>b.stage===stage);assert(fields.every(t=>books.some(b=>coverage.topics(b).includes(t))),`Missing ${category}/${currentStage}/${days}/${stage}`);}assert(route.books.every(b=>policy.currentIds(catalog).has(b.id)));assert(!route.books.some(b=>'days' in b||'minutes' in b));}
}
const b=(id,title,skills,extra={})=>({id,title,skills,publisher:'出版社',domain:'entrance',subject:'物理',stage:2,verified:true,exams:[],studyDays:20,price:null,...extra});
const first=b('a','名問の森 物理［力学・熱・波動Ⅰ］',fields),second=b('b','名問の森 物理［波動Ⅱ・電磁気・原子］',fields);
assert.equal(engine.recommend({...input,currentStage:2,targetStage:2},{books:[first]}).routes.length,0,'Incorrect broad tags must not hide a missing volume');
let r=engine.recommend({...input,currentStage:2,targetStage:2,days:1},{books:[first,second]});assert(r.routes.every(route=>route.books.length===2));
r=engine.recommend({...input,currentStage:2,targetStage:2,subject:'物理：力学',unit:'力学',days:1},{books:[first,second]});assert(r.routes.every(route=>route.books.length===1&&route.books[0].id==='a'));
r=engine.recommend({...input,currentStage:2,targetStage:2,subject:'物理：波動',unit:'波動',days:1},{books:[first,second]});assert(r.routes.every(route=>route.books.length===2));
assert.equal(engine.recommend({...input,currentStage:2,targetStage:2},{books:[first,{...second,title:second.title+' 2024年版'}]}).routes.length,0);
assert.deepEqual(coverage.topics(b('x','物理〈熱力学〉',fields)),['熱']);assert(!coverage.topics(b('x','高校物理基礎',fields)).includes('原子'));
const chemistry=[b('a','化学〈理論〉',['理論','無機','有機'],{subject:'化学'}),b('b','化学〈無機・有機〉',['理論','無機','有機'],{subject:'化学'})];
r=engine.recommend({...input,subject:'化学',baseSubject:'化学',currentStage:2,targetStage:2,days:1},{books:chemistry});assert(r.routes.length);assert(r.routes.every(route=>route.books.length===2));
assert.equal(engine.recommend({...input,subject:'化学',baseSubject:'化学',currentStage:2,targetStage:2},{books:[chemistry[0]]}).routes.length,0);
const japanese=[b('a','現代文の読解',['現代文'],{subject:'国語',stage:1}),b('b','古文の読解',['古文'],{subject:'国語'}),b('c','漢文の読解',['漢文'],{subject:'国語'})];
r=engine.recommend({...input,subject:'国語',baseSubject:'国語',currentStage:1,targetStage:2,days:1},{books:japanese});assert(r.routes.length);assert(r.routes.every(route=>route.books.length===3));
for(const book of catalog.books.filter(b=>b.verified&&b.subject==='物理'))for(const topic of ['熱','原子'])if(book.title.includes(topic))assert(book.skills.includes(topic),book.title+' lacks '+topic);
console.log('PASS',routes,'real-catalog routes cover every physics field at each selected level; split volumes, short deadlines, unit-only scope, missing data, chemistry/Japanese coverage and old-edition protection');
