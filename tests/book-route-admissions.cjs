const assert=require('node:assert/strict');
const a=require('../assets/book-route-admissions.js'),q=require('../assets/book-route-questions.js'),engine=require('../assets/book-route-engine.js');
const catalog={...require('../assets/book-catalog.json'),admissions:require('../assets/university-admissions.json')};
const all=catalog.admissions.universities;
assert.equal(all.length,87);assert(all.every(u=>u.year===2027&&u.faculties.length&&u.source.startsWith('https://search.keinet.ne.jp/')));
let methods=0;
for(const u of all){
 const ids=new Set();
 for(const f of u.faculties)for(const d of f.departments)for(const m of d.methods){
  methods++;assert(!ids.has(m.id));ids.add(m.id);assert(m.subjects.length);
  assert(m.required.every(s=>m.subjects.includes(s)));
  assert(m.groups.every(g=>g.subjects.every(s=>m.subjects.includes(s)&&!m.required.includes(s))));
  assert(m.groups.every(g=>!g.count||(g.count>0&&g.count<=g.subjects.length)));
  assert(['common','individual'].includes(m.stage));
 }
}
assert(methods>9000);
function answers(university,faculty,department,method,stage='individual'){
 const u=all.find(u=>u.name===university),f=u.faculties.find(f=>f.name===faculty),d=department?f.departments.find(d=>d.name===department):f.departments[0],m=d.methods.find(m=>m.stage===stage&&(!method||m.name===method));assert(m);
 return {category:'大学入試',exam:university,date:'2027-03-01',faculty:f.id,department:d.id,admissionMethod:m.id,subject:'英語',unit:'全範囲',level:'2',target:'rate-70',owned:[]};
}
const science=answers('東京大学','理科一類');science['elective-g1']=['物理','化学'];
assert.deepEqual(a.subjects(science,catalog),['国語','数学','英語','物理','化学']);
let c=q.conditions(science,catalog);assert.equal(c.faculty,'理科一類');assert.equal(c.examStage,'individual');assert.deepEqual(c.admissionsSubjects,['国語','数学','英語','物理','化学']);assert(engine.recommend(c,catalog).routes.length);
assert.throws(()=>q.conditions({...science,subject:'日本史'},catalog));assert.throws(()=>q.conditions({...science,'elective-g1':['物理']},catalog));assert.throws(()=>q.conditions({...science,'elective-g1':['物理','化学','生物']},catalog));
const arts=answers('東京大学','文科一類');arts['elective-g1']=['日本史','世界史'];assert.deepEqual(a.subjects(arts,catalog),['国語','数学','英語','日本史','世界史']);
const keio=answers('慶應義塾大学','理工学部','学門A');assert.deepEqual(a.subjects(keio,catalog),['数学','英語','物理','化学']);assert.equal(q.conditions(keio,catalog).department,'学門A');
const econA=answers('慶應義塾大学','経済学部',null,'A方式'),econB=answers('慶應義塾大学','経済学部',null,'B方式');econB['elective-g1']=['日本史'];assert.deepEqual(a.subjects(econA,catalog),['数学','英語']);assert.deepEqual(a.subjects(econB,catalog),['英語','日本史']);
const kyoto=answers('京都大学','工学部','地球工学科');assert.deepEqual(a.subjects(kyoto,catalog),['国語','数学','英語','物理','化学']);
assert.throws(()=>q.conditions({...keio,faculty:science.faculty},catalog));assert.deepEqual(a.subjects({...science,date:'2028-03-01'},catalog),[]);
const manual={...science,date:'2028-03-01',examSubjects:['数学','英語']};assert.equal(q.conditions(manual,catalog).examStage,'manual');assert.throws(()=>q.conditions({...manual,examSubjects:['架空の科目']},catalog));
const common=answers('東京大学','理科一類',null,null,'common');common['elective-g1']=['物理','化学'];common['elective-g2']=['日本史'];assert(a.subjects(common,catalog).includes('情報'));assert.match(q.fields(common,catalog).find(f=>f.key==='level').choices[0].label,/共通テスト/);
assert.throws(()=>engine.recommend({...c,baseSubject:'世界史'},catalog));
const unlisted={...science,faculty:'manual',examSubjects:['数学','英語']};assert.equal(q.conditions(unlisted,catalog).admissionsSource,'');assert.deepEqual(a.subjects(unlisted,catalog),['数学','英語']);
console.log(`PASS ${all.length} universities / ${methods} methods, faculty/department/method/elective filtering, stale answers, exact counts, common-test distinction, year fallback, and route persistence metadata`);
