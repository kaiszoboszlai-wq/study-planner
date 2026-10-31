(function(){
'use strict';
function material(name){const sub=(state.subjects||[]).find(s=>s[0]===name);return sub?.[2]||(state.bookRoutes||[]).flatMap(r=>r.books||[]).find(b=>b.title===name)||catalogIndex?.get(name)||null;}
let catalogIndex;
async function attach(block,item){
 const owner=dataOwner,epoch=authEpoch;let book=block.book||material(block.name);await Promise.resolve();if(owner!==dataOwner||epoch!==authEpoch)return;
 if(!book){if((DEFAULT_SUBJECTS||[]).some(s=>s[0]===block.name))return;try{const data=await loadSubjectBookCatalog80();if(!catalogIndex)catalogIndex=new Map(data.books.filter(b=>b.verified&&!b.excludedReason).map(b=>[b.title,b]));book=catalogIndex.get(block.name);}catch{return;}}
 if(!book||owner!==dataOwner||epoch!==authEpoch||!item.isConnected||item.parentElement.querySelector('.plan-material-cover80'))return;
 const cover=document.createElement('span');cover.className='plan-material-cover80';item.before(cover);item.classList.add('has-material80');BookCovers73.attach(book,cover,{links:false});
}
const controls=document.createElement('section');controls.className='plan-material-controls80';controls.innerHTML='<div class="plan-material-actions80"><button type="button" data-search>教材を検索</button><button type="button" data-custom>独自教材を追加</button></div><div class="plan-material-preview80"></div><div class="plan-material-photos80" hidden><button type="button" data-camera>表紙を撮影</button><button type="button" data-photo>表紙の写真を選ぶ</button><input type="file" accept="image/*" capture="environment" data-camera-input hidden><input type="file" accept="image/*" data-photo-input hidden></div><p role="status"></p>';
const nameLabel=$('emname').closest('label'),materialActions=controls.querySelector('.plan-material-actions80');nameLabel.after(materialActions);materialActions.after(controls);
const preview=controls.querySelector('.plan-material-preview80'),photos=controls.querySelector('.plan-material-photos80'),status=controls.querySelector('[role=status]');
function paint(){preview.replaceChildren();if(edit?.book)BookCovers73.attach(edit.book,preview,{links:false});photos.hidden=!edit?.book;status.textContent='';colorPreview();}
function active(context,owner,epoch){return edit===context&&dataOwner===owner&&authEpoch===epoch&&!$('em').hidden;}
materialActions.querySelector('[data-search]').onclick=function(){const context=edit,owner=dataOwner,epoch=authEpoch;openSubjectBookPicker(book=>{if(!active(context,owner,epoch))return;edit.book={id:book.id,title:book.title,isbn:book.isbn||'',publisher:book.publisher||''};$('emname').value=book.title;$('emname').closest('label').hidden=false;paint();},()=>{if(active(context,owner,epoch))custom();});};
function custom(){if(!edit)return;edit.book={id:rid(),title:$('emname').value.trim()||'独自教材',custom:true};$('emname').closest('label').hidden=false;paint();$('emname').focus();}
materialActions.querySelector('[data-custom]').onclick=custom;
for(const kind of ['camera','photo']){
 const input=controls.querySelector('[data-'+kind+'-input]');controls.querySelector('[data-'+kind+']').onclick=()=>input.click();
 input.onchange=async()=>{const file=input.files?.[0],context=edit,owner=dataOwner,epoch=authEpoch;if(!file||!context)return;try{const image=await LongTermPlannerUI.cropPhoto(file,controls);if(image&&active(context,owner,epoch)){context.book={...(context.book||{}),id:context.book?.id||rid(),title:$('emname').value.trim()||'独自教材',customCover:image};paint();status.textContent='表紙の写真を選択しました。保存すると反映されます。';}}catch{if(active(context,owner,epoch))status.textContent='写真を読み込めませんでした。';}finally{input.value='';}};
}
const original=openEdit;openEdit=function(id,day){original(id,day);const b=id&&findBlock(id);edit.book=b?.book||material(b?.name)||null;materialActions.hidden=!!id;$('emcolor').closest('label').hidden=false;if(edit.book)$('emtitle').textContent=id?'教材・時間を編集':'教材を追加';paint();};
function colorPreview(){preview.style.setProperty('--material-color81',$('emcolor').value);}
$('emcolor').addEventListener('input',colorPreview);
// Manual naming must never accidentally retain a different catalog book's cover.
$('emname').addEventListener('input',()=>{if(edit?.book&&!edit.book.custom&&$('emname').value.trim()!==edit.book.title){edit.book=null;paint();}});
window.PlanMaterials80={attach,commit(context,name){if(!context?.book)return;const book={...context.book,title:name};let sub=state.subjects.find(s=>s[0]===name);if(!sub){sub=[name,1];state.subjects.push(sub)}sub[2]=book;}};
if(state.plan)renderPlan();
})();
