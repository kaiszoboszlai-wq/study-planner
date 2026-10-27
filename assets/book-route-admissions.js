(function(root){
'use strict';
const fallbackSubjects=['国語','数学','英語','物理','化学','生物','地学','日本史','世界史','地理','公共','政治経済','倫理','情報','地理総合','地理総合／歴史総合／公共'];
const choice=(value,label)=>({value,label});
function profile(a,catalog){
 const university=catalog.admissions?.universities.find(u=>u.name===a.exam);
 const year=Number((a.date||'').slice(0,4));
 const current=university&&(!year||year===university.year);
 const faculty=university?university.faculties.find(f=>f.id===a.faculty):null;
 const department=faculty&&(faculty.departments.length===1?faculty.departments[0]:faculty.departments.find(d=>d.id===a.department));
 const method=department&&(department.methods.length===1?department.methods[0]:department.methods.find(m=>m.id===a.admissionMethod));
 return {university,current,faculty,department,method,year};
}
function fields(a,catalog){
 if(a.category!=='大学入試')return [];
 const p=profile(a,catalog);
 if(!p.university)return [];
 const result=[{key:'faculty',title:'志望する学部・学群・類は？',note:p.current?`${p.university.year}年度・一般選抜`:`学部・学科は${p.university.year}年度の収録情報です。受験年度の科目は未確認のため、この情報を参考に仮のルートを作成します。`,source:p.university.source,choices:[...p.university.faculties.map(f=>choice(f.id,f.name)),choice('manual','一覧にない学部・入試方式／学部未定')]}];
 if(a.faculty==='manual')return result;
 if(p.faculty&&(p.faculty.departments.length>1||p.faculty.departments[0].name!=='学部共通'))result.push({key:'department',title:'学科・専攻・募集区分を選んでください',choices:p.faculty.departments.map(d=>choice(d.id,d.name))});
 if(p.department?.methods.length>1){
  const methods=p.department.methods;
  result.push({key:'admissionMethod',title:'どの入試方式の対策をしますか？',note:'共通テストと個別試験を分けて選べます。',choices:methods.map(m=>{const stage=m.stage==='common'?'共通テスト':'個別試験';let label=m.name+' ／ '+stage;const same=methods.filter(x=>x.name===m.name&&x.stage===m.stage);if(same.length>1)label+=' ／ '+(m.required.length?'必須：'+m.required.join('・')+'／':'')+m.groups.map(g=>g.subjects.join('・')+'から'+(g.count||'使う')+'科目').join('／');return choice(m.id,label);})});
 }

 return result;
}
function subjects(a,catalog){
 if(a.category!=='大学入試')return fallbackSubjects;
 const p=profile(a,catalog);
 if(!p.university||a.faculty==='manual')return [];
 if(!p.method)return [];
 const allowed=new Set(p.method.required);
 for(const g of p.method.groups||[])for(const s of g.subjects)allowed.add(s);
 return fallbackSubjects.filter(s=>allowed.has(s));
}
function conditions(a,catalog){
 if(a.category!=='大学入試')return {};
 for(const f of fields(a,catalog)){
  const values=f.choices.map(o=>typeof o==='string'?o:o.value),value=a[f.key];
  const valid=f.multi?Array.isArray(value)&&value.length>0&&new Set(value).size===value.length&&value.every(v=>values.includes(v))&&(!f.count||value.length===f.count):values.includes(value);
  if(!valid)throw Error('志望学部・入試方式・選択科目を選び直してください。');
 }
 const allowed=subjects(a,catalog);if(!allowed.includes(a.subject))throw Error('受験科目からルートを作る教科を選び直してください。');
 const p=profile(a,catalog);
 const scope=p.method?.scope||{};const trendRows=[...(p.university?.trends||[]),...(catalog.examTrends?.universities?.[p.university?.id]||[])];const trends=(p.method?.stage==='individual'?trendRows:[]).filter(t=>t.admissionYear===p.year&&(a.subject==='国語'?/国語|現代文|古文|漢文/.test(t.subject):t.subject.includes(a.subject||'___'))).filter(t=>!t.facultyNames?.length||t.facultyNames.includes(p.faculty?.name)).filter(t=>!(a.subject==='数学'&&scope.mathIII===false&&/数学[Ⅲ3]|数学III/.test(t.subject))).filter(t=>a.subject!=='数学'||!/(文系|文類|理系|理類)/.test(t.subject)||(scope.mathIII===true?/理系|理類/.test(t.subject):scope.mathIII===false?/文系|文類/.test(t.subject):false));
 return {examScope:scope,examFocusSkills:[...new Set(trends.flatMap(t=>t.prioritySkills))],examTrendSources:[...new Set(trends.map(t=>t.source))],trendVerified:trends.length>0,faculty:p.faculty?.name||'',facultyId:p.faculty?.id||'',department:p.department?.name||'',departmentId:p.department?.id||'',admissionMethod:p.method?.name||'',admissionMethodId:p.method?.id||'',examStage:p.method?.stage||'manual',admissionsYear:p.university.year,requestedAdmissionsYear:p.year,admissionsProvisional:!p.current,admissionsSource:p.method?p.university.source:'',admissionsSubjects:allowed,admissionsCombinationVerified:p.method?!p.method.needsCombinationConfirmation:false};
}
root.BookRouteAdmissions={profile,fields,subjects,conditions};if(typeof module!=='undefined')module.exports=root.BookRouteAdmissions;
})(typeof globalThis!=='undefined'?globalThis:this);
