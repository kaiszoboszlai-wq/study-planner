(function(){
'use strict';
const byId=id=>document.getElementById(id),loading=window.AppLoading72;
// Wrap existing readers: their permissions, request guards and error handling stay intact.
function wrap(name,id,kind='list',ready){const original=window[name];if(typeof original!=='function')return;window[name]=function(){const target=byId(id),keep=!!(ready&&ready(target,arguments)),result=original.apply(this,arguments),finish=loading.start(target,kind,keep);return Promise.resolve(result).finally(finish);};}
wrap('fillList','lmBody');wrap('openDmList','dmBody');wrap('renderInboxReq','dmBody');wrap('openPost','pxBody');wrap('openProfile','pmBody','profile',(_target,args)=>!!profileCached('profiles/'+args[0]));
wrap('rankLoad','tlBody','list');
wrap('fbSearchUsers','fbUserResults','list',(_target,args)=>args[0]===true);
const initialMessages=dmLoad;dmLoad=function(first){const result=initialMessages.apply(this,arguments);if(!first)return result;const target=byId('dmBody'),finish=loading.start(target,'list',!!target.querySelector('.msg'));return Promise.resolve(result).finally(finish);};
// Individual names may arrive after their row. Keep its geometry instead of a loading label.
const watched=['lmBody','dmBody','pmBody','pxBody'];let skeletonFrame=0;
function markNames(){skeletonFrame=0;for(const id of watched){const target=byId(id);if(!target)continue;for(const node of target.querySelectorAll('b,.note')){const pending=node.childElementCount===0&&/^(読み込み中|検索中)[…\.]*$/.test(node.textContent.trim());node.classList.toggle('async-inline72',pending);}}}
const observer=new MutationObserver(()=>{if(!skeletonFrame)skeletonFrame=requestAnimationFrame(markNames);});for(const id of watched)if(byId(id))observer.observe(byId(id),{subtree:true,childList:true,characterData:true});
const indicator=document.createElement('div');indicator.id='pullRefresh72';indicator.setAttribute('aria-hidden','true');indicator.innerHTML='<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M16 3v5" opacity=".95"/><path d="M16 3v5" transform="rotate(45 16 16)" opacity=".85"/><path d="M16 3v5" transform="rotate(90 16 16)" opacity=".72"/><path d="M16 3v5" transform="rotate(135 16 16)" opacity=".6"/><path d="M16 3v5" transform="rotate(180 16 16)" opacity=".48"/><path d="M16 3v5" transform="rotate(225 16 16)" opacity=".36"/><path d="M16 3v5" transform="rotate(270 16 16)" opacity=".25"/><path d="M16 3v5" transform="rotate(315 16 16)" opacity=".15"/></g></svg>';document.body.append(indicator);
const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.className='refresh-access72';document.body.append(status);
const access=document.createElement('button');access.type='button';access.className='refresh-access72';access.textContent='画面を更新';access.onclick=()=>run(context());document.body.append(access);
let gesture=null,flight=null,resetTimer=0,refreshGeneration=0,pullRoot=null;
function visible(id){const n=byId(id);return n&&!n.hidden&&n.getClientRects().length;}
function context(){
 if(state.timer||state.idleReview||state.pendingTimerRelease||/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)||document.activeElement?.isContentEditable)return null;
 if(document.body.matches('.route-creating,.weekly-flow-mode40,.profile-editing64,.registry-open-mode'))return null;
 if(visible('lm'))return FB.uid?{key:'list/'+listMode,root:byId('lm'),scroll:byId('lmBody'),task:()=>fillList()}:null;
 if(visible('dmm'))return FB.uid&&!dmCur?{key:'inbox/'+inboxTab,root:byId('dmm'),scroll:byId('dmBody'),task:()=>inboxTab==='req'?renderInboxReq():openDmList()}:null;
 if(visible('pxm'))return FB.uid&&pxCur?{key:'comments/'+pxCur.pid,root:byId('pxm'),scroll:byId('pxm').querySelector('.tmbox'),task:()=>openPost(pxCur.pid,pxCur.it)}:null;
 if(document.querySelector('[role="dialog"]:not([hidden]),dialog[open]'))return null;
 if(![3,4,5,6,8].includes(Number(state.page)))return null;
 const page=state.page,uid=FB.uid,epoch=authEpoch;return {key:'page/'+page,root:byId({3:'planbox',4:'stats',5:'mypage',6:'today',8:'bookRoutePage'}[page]),scroll:document.scrollingElement,task:async()=>{
   await syncRefresh();if(state.page!==page||FB.uid!==uid||authEpoch!==epoch)return;
   if(page===4){renderStats();}else if(page===5){await renderFb();}else if(page===3)renderPlan();else if(page===6){renderToday();rankFetch55.at=0;await rankLoad();}else if(page===8)showPage(8);
 }};
}
function top(ctx,target){if((ctx.scroll?.scrollTop||0)>0)return false;for(let n=target;n&&n!==ctx.root;n=n.parentElement){if(n.scrollTop>0)return false;}return true;}
function paint(distance,text,busy=false){indicator.style.setProperty('--pull-distance72',distance+'px');indicator.style.setProperty('--pull-rotation72',distance*4+'deg');indicator.classList.toggle('pull-visible72',distance>0);indicator.classList.toggle('pull-busy72',busy);indicator.dataset.status=text;}
function shift(ctx,distance){if(ctx?.scroll!==document.scrollingElement)return;if(pullRoot&&pullRoot!==ctx.root){pullRoot.classList.remove('pull-shift72');pullRoot.style.removeProperty('--pull-content72');}pullRoot=ctx.root;pullRoot.classList.add('pull-shift72');pullRoot.style.setProperty('--pull-content72',Math.min(56,distance*.5)+'px');}function hide(){paint(0,'');if(pullRoot){pullRoot.classList.remove('pull-shift72');pullRoot.style.removeProperty('--pull-content72');pullRoot=null;}document.documentElement.classList.remove('pull-active72');}
async function run(ctx){if(flight||!ctx)return;const uid=FB.uid,epoch=authEpoch,key=ctx.key,generation=++refreshGeneration;clearTimeout(resetTimer);gesture=null;paint(110,'更新中…',true);shift(ctx,110);status.textContent='更新中…';
 const active=()=>uid===FB.uid&&epoch===authEpoch&&context()?.key===key;
 // Invalidate only read caches. Existing pending writes and local data are retained.
 profileCache.clear();viewReads.clear();
 const task=(async()=>{await Promise.resolve();try{await ctx.task();if(!active())return;const failed=(FB.uid&&saveHealth.cloudError)||[...ctx.root.querySelectorAll('.read-error')].some(n=>n.getClientRects().length);const message=failed?'更新できませんでした。もう一度お試しください。':'表示を更新しました';paint(110,message);status.textContent=message;}catch{if(active()){paint(110,'更新できませんでした');status.textContent='更新できませんでした。もう一度お試しください。';}}finally{if(generation!==refreshGeneration)return;if(flight===task)flight=null;document.documentElement.classList.remove('pull-active72');if(active())resetTimer=setTimeout(hide,950);else{hide();status.textContent='';}}})();flight=task;await task;
}
document.addEventListener('touchstart',event=>{if(event.touches.length!==1||flight)return;const ctx=context(),target=event.target;if(!ctx||!ctx.root.contains(target)||target.closest('button,a,input,textarea,select,[role="button"],svg')||!top(ctx,target))return;clearTimeout(resetTimer);gesture={ctx,x:event.touches[0].clientX,y:event.touches[0].clientY,distance:0,uid:FB.uid,epoch:authEpoch};},{passive:true});
document.addEventListener('touchmove',event=>{if(!gesture)return;const touch=event.touches[0],dy=touch?.clientY-gesture.y,dx=touch?.clientX-gesture.x;if(event.touches.length!==1||Math.abs(dx)>Math.max(16,dy)||dy<0||gesture.uid!==FB.uid||gesture.epoch!==authEpoch||context()?.key!==gesture.ctx.key){gesture=null;hide();return;}if(dy<10)return;gesture.distance=Math.min(130,dy*.52);if(event.cancelable)event.preventDefault();document.documentElement.classList.add('pull-active72');paint(gesture.distance,gesture.distance>=100?'離して更新':'下に引いて更新');shift(gesture.ctx,gesture.distance);},{passive:false});
document.addEventListener('touchend',()=>{const current=gesture;gesture=null;if(!current)return;if(current.distance>=100)run(current.ctx);else hide();},{passive:true});document.addEventListener('touchcancel',()=>{gesture=null;hide();},{passive:true});
const account=switchAccountData;switchAccountData=function(uid){if(uid!==dataOwner){refreshGeneration++;flight=null;gesture=null;clearTimeout(resetTimer);hide();status.textContent='';loading.clear();}return account.apply(this,arguments);};
const show=showPage;showPage=function(){gesture=null;if(!flight)hide();const result=show.apply(this,arguments);access.hidden=!context();return result;};
access.hidden=!context();
})();
