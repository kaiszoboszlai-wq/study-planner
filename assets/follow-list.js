(function(){
'use strict';
const el=id=>document.getElementById(id),modal=el('lm'),box=modal.querySelector('.tmbox'),title=el('lmt'),content=el('lmBody'),closeButton=el('lmClose');
const header=document.createElement('div');header.className='following-header66';closeButton.textContent='';closeButton.setAttribute('aria-label','一覧を閉じる');closeButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 4-8 8 8 8"/></svg>';header.append(closeButton,title);const add=document.createElement('button');add.type='button';add.setAttribute('aria-label','友達を追加');add.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7M19 8v6M16 11h6"/></svg>';add.onclick=()=>openFriend();header.append(add);box.prepend(header);
const tabs=document.createElement('div');tabs.className='following-tabs66';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','フォロー一覧');const tabButtons={};for(const [mode,label] of [['fr','フォロワー'],['fol','フォロー中']]){const button=document.createElement('button');button.type='button';button.setAttribute('role','tab');button.id='followingTab66-'+mode;button.onclick=()=>openList(mode);tabs.append(button);tabButtons[mode]=button;}header.after(tabs);
const status=document.createElement('p');status.className='following-status66';content.after(status);
let origin=null,scheduled=0;
function decorate(){scheduled=0;if(modal.hidden)return;const follow=listMode==='fol'||listMode==='fr';modal.classList.toggle('follow-list66',follow);document.body.classList.toggle('follow-list-open66',follow);tabs.hidden=status.hidden=!follow;if(!follow)return;
 title.textContent=state.profile?.name||'プロフィール';for(const [mode,label,id] of [['fr','フォロワー','nFr'],['fol','フォロー中','nFol']]){const button=tabButtons[mode];button.textContent=(el(id)?.textContent||'0')+' '+label;button.setAttribute('aria-selected',String(mode===listMode));button.tabIndex=mode===listMode?0:-1;}
 const rows=[...content.querySelectorAll('.fcard')];
 for(const row of rows){const main=row.querySelector('.fbrow');if(main){const meta=main.children[1],actions=meta?.querySelector('.actions');if(actions)main.append(actions);row.querySelectorAll('.friend-details,.request-profile-details').forEach(e=>e.classList.add('following-hidden66'));}
 for(const target of [row.querySelector('.av'),row.querySelector('b')])if(target){target.setAttribute('role','button');target.tabIndex=0;target.setAttribute('aria-label',(row.querySelector('b')?.textContent||'ユーザー')+'のプロフィールを開く');target.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();target.click();}};}
 row.hidden=false;}
 for(const more of content.querySelectorAll('.collection-more'))if(more.parentElement.lastElementChild!==more)more.parentElement.append(more);
 status.textContent='';
}
function schedule(){if(!scheduled)scheduled=requestAnimationFrame(decorate)}
const observer=new MutationObserver(schedule);observer.observe(content,{subtree:true,childList:true,characterData:true});for(const id of ['nFol','nFr'])observer.observe(el(id),{subtree:true,childList:true,characterData:true});
const originalOpen=openList;openList=function(mode){origin=document.activeElement;const result=originalOpen(mode);decorate();if(mode==='fr'||mode==='fol')closeButton.focus();return result;};const originalClose=closeList;closeList=function(){const result=originalClose();document.body.classList.remove('follow-list-open66');origin?.focus?.();return result;};closeButton.onclick=closeList;
modal.addEventListener('keydown',e=>{if(e.key==='Tab'){const items=[...modal.querySelectorAll('button,input,select,[tabindex="0"]')].filter(x=>!x.disabled&&x.getClientRects().length),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}if(e.key==='Escape'){e.preventDefault();closeList();}if(e.target.getAttribute('role')==='tab'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const mode=listMode==='fol'?'fr':'fol';openList(mode);tabButtons[mode].focus();}});
// Existing permissions, follow requests and confirmation flows remain the source of truth.
const account=switchAccountData;switchAccountData=function(uid){if(uid!==dataOwner)closeList();return account.apply(this,arguments);};
})();
