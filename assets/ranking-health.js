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
