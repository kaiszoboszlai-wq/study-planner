(function(){
'use strict';
const root=document.getElementById('rankingPage54'),tabs=root?.querySelector('.rank-tabs61'),box=document.getElementById('tlBody');if(!root||!tabs||!box)return;
document.getElementById('today')?.append(root);
const date=document.createElement('p');date.className='rank-date71';root.querySelector('.rank-title54').after(date);
const thumb=document.createElement('span');thumb.className='rank-scope-thumb71';thumb.setAttribute('aria-hidden','true');tabs.prepend(thumb);
let owner=FB.uid,scope=rankScope61,motions=[];
function stop(){motions.forEach(a=>a.cancel());motions=[];}
function paint(){tabs.style.setProperty('--rank-scope-index71',rankScope61==='global'?1:0);const now=new Date();date.textContent=now.getFullYear()+'年'+(now.getMonth()+1)+'月'+now.getDate()+'日';if(owner!==FB.uid||scope!==rankScope61){stop();owner=FB.uid;scope=rankScope61;}}
const originalScope=paintRankScope61;paintRankScope61=function(){const result=originalScope.apply(this,arguments);paint();return result;};
const originalPaint=rankPaint;rankPaint=function(target,rows,partial){
 const same=owner===FB.uid&&scope===rankScope61,old=new Map();if(target===box&&same)for(const row of box.querySelectorAll('.rkrow'))old.set(row.dataset.rankUid,row.getBoundingClientRect().top);
 stop();const result=originalPaint.apply(this,arguments);paint();
 if(target===box&&root.getClientRects().length&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  for(const row of box.querySelectorAll('.rkrow')){const previous=old.get(row.dataset.rankUid),distance=previous===undefined?0:previous-row.getBoundingClientRect().top;if(previous===undefined)motions.push(row.animate([{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.2,.75,.25,1)'}));else if(Math.abs(distance)>1)motions.push(row.animate([{transform:`translateY(${distance}px)`},{transform:'translateY(0)'}],{duration:380,easing:'cubic-bezier(.2,.75,.25,1)'}));}
 }
 return result;
};
// The original controls continue to handle scope changes, profile access and comments.
tabs.addEventListener('keydown',event=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;const buttons=[...tabs.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);if(index<0)return;event.preventDefault();const next=buttons[1-index];next.focus();next.click();});
paint();
})();

(function(){
'use strict';
const today=document.getElementById('today'),ranking=document.getElementById('rankingPage54');if(!today||!ranking)return;
const schedule=document.createElement('div');schedule.id='todaySchedulePanel';schedule.setAttribute('role','tabpanel');schedule.setAttribute('aria-labelledby','todayScheduleTab');for(const child of [...today.children])if(child!==ranking)schedule.append(child);today.prepend(schedule);
const tabs=document.createElement('div');tabs.className='today-view-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','今日の表示');today.prepend(tabs);let selected='schedule';const underline=document.createElement('span');underline.className='today-tab-underline';underline.setAttribute('aria-hidden','true');tabs.append(underline);
const choices=[['schedule','今日','todayScheduleTab',schedule],['ranking','今日の学習時間ランキング','todayRankingTab',ranking]];
function paint(){tabs.style.setProperty('--today-tab-index',selected==='ranking'?1:0);for(const [key,,id,panel] of choices){const on=key===selected,b=document.getElementById(id);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;panel.hidden=!on;}}
for(const [key,label,id,panel] of choices){const b=document.createElement('button');b.type='button';b.id=id;b.textContent=label;b.setAttribute('role','tab');b.setAttribute('aria-controls',panel.id);b.onclick=()=>{const changed=selected!==key,forward=key==='ranking';selected=key;paint();if(changed&&!matchMedia('(prefers-reduced-motion: reduce)').matches)panel.animate([{opacity:.6,transform:'translateX('+(forward?16:-16)+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:180,easing:'ease-out'});if(key==='ranking')rankLoad();};tabs.append(b);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',id);}
tabs.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:selected==='schedule'?1:0;const buttons=tabs.querySelectorAll('[role=tab]');buttons[next].click();buttons[next].focus();};
let swipe=null;today.addEventListener('touchstart',e=>{if(e.touches.length!==1||e.target.closest('button,a,input,select,textarea,.rank-tabs61'))return;swipe={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});today.addEventListener('touchmove',e=>{if(!swipe||e.touches.length!==1)return;const dx=e.touches[0].clientX-swipe.x,dy=e.touches[0].clientY-swipe.y;if(Math.abs(dy)>Math.abs(dx)+10){swipe=null;return;}if(Math.abs(dx)>12&&e.cancelable)e.preventDefault();},{passive:false});today.addEventListener('touchend',e=>{if(!swipe)return;const dx=e.changedTouches[0].clientX-swipe.x,dy=e.changedTouches[0].clientY-swipe.y;swipe=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5){const id=dx<0?'todayRankingTab':'todayScheduleTab';document.getElementById(id).click();}},{passive:true});today.addEventListener('touchcancel',()=>{swipe=null;},{passive:true});
const show=showPage;showPage=function(){const result=show.apply(this,arguments);paint();return result;};openRanking=function(){showPage(6);selected='ranking';paint();rankLoad();};paint();
})();
