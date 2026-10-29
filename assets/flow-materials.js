(function(){
'use strict';
let photoDialog=null;
function valid(w){return weeklyFlow40===w&&w.owner===dataOwner&&w.epoch===authEpoch;}
function coverFor(entry){return {...(entry.book||{}),id:entry.book?.id||entry.key,title:entry.name||'科目・教材'};}
function photo(entry,w,refresh){
 if(photoDialog)photoDialog.close();
 const d=document.createElement('dialog');photoDialog=d;d.className='subject-book-picker flow-photo83';d.setAttribute('aria-label','表紙の写真を設定');
 const title=document.createElement('h2');title.textContent=entry.name+'の表紙';d.append(title);
 const status=document.createElement('p');status.setAttribute('role','status');
 for(const [label,capture] of [['写真を撮る',true],['写真を選ぶ',false]]){
  const input=document.createElement('input');input.type='file';input.accept='image/*';input.hidden=true;if(capture)input.setAttribute('capture','environment');
  const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>input.click();d.append(b,input);
  input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const data=await LongTermPlannerUI.cropPhoto(file,d);if(!data||!d.isConnected||!valid(w)||!w.entries.includes(entry))return;entry.book={...coverFor(entry),customCover:data};persistFlow40();refresh();d.close();}catch{if(d.isConnected)status.textContent='写真を読み込めませんでした。別の写真を選んでください。';}finally{input.value='';}};
 }
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='キャンセル';cancel.onclick=()=>d.close();d.append(status,cancel);d.onclose=()=>{if(photoDialog===d)photoDialog=null;d.remove();};document.body.append(d);d.showModal();
}
function attachCover(book,host){if(window.BookCovers73){BookCovers73.attach(book,host,{links:false});return;}const img=document.createElement('img');img.src='assets/book-cover-placeholder.svg';img.alt=book.title+'の表紙';host.append(img);addEventListener('load',()=>{if(host.isConnected&&window.BookCovers73){host.replaceChildren();BookCovers73.attach(book,host,{links:false});}},{once:true});}
function render(body,w){
 const field=document.createElement('label');field.className='flow-inline-search83';field.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
 const input=document.createElement('input');input.type='search';input.placeholder='参考書を検索（書名・出版社・ISBN）';input.setAttribute('aria-label','参考書を検索');input.autocomplete='off';field.append(input);
 const results=document.createElement('section');results.className='flow-search-results83';results.hidden=true;results.setAttribute('aria-label','参考書の検索候補');
 const status=document.createElement('p');status.className='flow-search-status83';status.setAttribute('role','status');const matches=document.createElement('div');matches.className='flow-search-matches83';results.append(status,matches);
 const list=document.createElement('div');list.id='flowSubjects40';body.append(field,results,list);flowCustomMaterial40(body,w,list);
 function rows(){const top=body.scrollTop;list.replaceChildren();w.entries.forEach((entry,i)=>{
  const row=document.createElement('div');row.className='flow-subject40 flow-book-row';
  const color=document.createElement('input');color.type='color';color.value=entry.color;color.setAttribute('aria-label','科目'+(i+1)+'の色');color.oninput=()=>{entry.color=color.value;persistFlow40();};
  const cover=document.createElement('button');cover.type='button';cover.className='flow-cover83';cover.setAttribute('aria-label',(entry.name||'科目・教材')+'の表紙を変更');cover.onclick=()=>photo(entry,w,rows);
  const name=document.createElement('input');name.type='text';name.maxLength=100;name.value=entry.name;name.placeholder='科目・教材名';name.setAttribute('aria-label','科目'+(i+1)+'の名前');name.oninput=()=>{entry.name=name.value;persistFlow40();flowError40(duplicateSubject(w.entries.map(e=>[e.name,e.weight]))?'同じ名前の科目があります。':'');};name.onchange=()=>{entry.name=cleanSubject(entry.name);name.value=entry.name;cover.setAttribute('aria-label',(entry.name||'科目・教材')+'の表紙を変更');persistFlow40();};
  const del=document.createElement('button');del.type='button';del.className='flow-remove83';del.textContent='×';del.setAttribute('aria-label',(entry.name||'科目')+'を削除');del.onclick=()=>{w.entries=w.entries.filter(e=>e!==entry);persistFlow40();rows();draw();};
  row.append(color,cover,name,del);list.append(row);attachCover(coverFor(entry),cover);
 });body.scrollTop=top;}
 let request=0,ready=false,catalog;
 const norm=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\s/g,'');
 function draw(){if(!valid(w)||!field.isConnected)return;const top=body.scrollTop,terms=input.value.trim().split(/[\s　]+/).filter(Boolean).map(norm);matches.replaceChildren();results.hidden=!terms.length;if(!terms.length){body.scrollTop=top;return;}if(!ready){status.textContent='教材を読み込んでいます…';body.scrollTop=top;return;}
  const books=catalog.books.filter(b=>b.verified&&!b.excludedReason&&terms.every(t=>norm(b.title+' '+b.publisher+' '+b.isbn).includes(t)));status.textContent=books.length?books.length+'冊見つかりました'+(books.length>30?'（先頭30冊を表示）':''):'見つかりませんでした。教材名を変えて検索してください。';
  for(const book of books.slice(0,30)){
   const row=document.createElement('article');row.className='subject-picker-book';const info=document.createElement('div'),title=document.createElement('strong'),publisher=document.createElement('small'),add=document.createElement('button');title.textContent=book.title;publisher.textContent=book.publisher||'';info.append(title,publisher);
   const selected=w.entries.some(e=>cleanSubject(e.name)===book.title);add.type='button';add.textContent=selected?'✓':'＋';add.setAttribute('aria-label',book.title+(selected?'は追加済み':'を追加'));add.disabled=selected;add.onclick=()=>{if(!valid(w))return;if(w.entries.length>=100){flowError40('科目・教材は100個以内にしてください。');return;}if(w.entries.some(e=>cleanSubject(e.name)===book.title))return;w.entries.push({key:rid(),name:book.title,book:{id:book.id,title:book.title,isbn:book.isbn||'',publisher:book.publisher||''},weight:1,color:PALETTE[w.entries.length%PALETTE.length],oldName:''});persistFlow40();rows();const scroll=results.scrollTop;draw();results.scrollTop=scroll;input.focus({preventScroll:true});};
   row.append(info,add);matches.append(row);attachCover(book,row);
  }body.scrollTop=top;
 }
 input.oninput=async()=>{const token=++request;draw();if(!input.value.trim()||ready)return;const finish=window.AppLoading72?.start(matches,'books')||(()=>{});try{const data=await loadSubjectBookCatalog80();if(token!==request||!valid(w)||!field.isConnected)return;catalog=data;ready=true;draw();}catch{if(token===request&&field.isConnected)status.textContent='教材を読み込めませんでした。検索文字を入力し直してください。';}finally{finish();}};
 rows();
}
addEventListener('DOMContentLoaded',()=>{const change=switchAccountData;switchAccountData=function(uid){if(uid!==dataOwner&&photoDialog)photoDialog.close();return change.apply(this,arguments);};},{once:true});
window.FlowMaterials83={render};
})();
