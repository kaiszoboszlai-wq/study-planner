(function(){
'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),active=new Set(),pageAnimations=new Set(),presses=new Map(),lastPress=new WeakMap(),visibility=new WeakMap();
const roots={8:'bookRoutePage',3:'planbox',6:'today',4:'stats',5:'mypage',7:'grades'},order=[8,3,6,4,5,7],ease='cubic-bezier(.16,1,.3,1)';
let questionMotion=null,questionKey=window.weeklyFlow40?.key||'',questionMode=window.weeklyFlow40?.mode||'';
function play(node,frames,options={}){
 if(reduced.matches||!node?.isConnected||!node.getClientRects().length)return null;
 const animation=node.animate(frames,{duration:300,easing:ease,...options});active.add(animation);
 const cleanup=()=>active.delete(animation);animation.addEventListener('finish',cleanup,{once:true});animation.addEventListener('cancel',cleanup,{once:true});return animation;
}
function enter(node,direction=1){return play(node,[{opacity:.28,transform:'translate3d('+(direction*18)+'px,8px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:360});}
function pageAnimation(a){if(a){pageAnimations.add(a);const done=()=>pageAnimations.delete(a);a.addEventListener('finish',done,{once:true});a.addEventListener('cancel',done,{once:true});}}
function stagger(root){
 const cards=[...root.querySelectorAll('.plan-items62 .blk,.today-summary,#tdList .tcard,#myGoal62,.my-menu62,.lt-goal,.route-saved-item')].filter(n=>{const r=n.getBoundingClientRect();return r.height&&r.top<innerHeight+80&&r.bottom>0}).slice(0,7);
 cards.forEach((card,i)=>pageAnimation(play(card,[{opacity:.35,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:340,delay:Math.min(i*35,180),fill:'backwards'})));
}
const show=showPage;showPage=function(){const previous=Number(state.page),result=show.apply(this,arguments),next=Number(state.page),root=document.getElementById(roots[next]);
 if(previous!==next&&root){for(const a of [...pageAnimations])a.cancel();pageAnimation(enter(root,order.indexOf(next)>=order.indexOf(previous)?1:-1));stagger(root);}return result;
};
const renderQuestion=renderFlow40;renderFlow40=function(){const w=window.weeklyFlow40,key=w?.key||'',mode=w?.mode||'',steps=w?flowSteps40(w):[],old=steps.findIndex(s=>s.key===questionKey),next=steps.findIndex(s=>s.key===key),changed=key!==questionKey||mode!==questionMode;
 const result=renderQuestion.apply(this,arguments);questionKey=w?.key||'';questionMode=mode;
 if(changed){questionMotion?.cancel();questionMotion=enter(document.getElementById('flowBody40'),next>=old?1:-1);}return result;
};
function eligible(target){const b=target?.closest?.('button');return b&&!b.disabled&&b.getAttribute('aria-disabled')!=='true'&&!b.closest('[inert]')&&!b.matches('.lt-grip,.lt-bar-open,.lt-zoom,[data-no-motion]')?b:null;}
function ink(button,x,y){
 if(reduced.matches)return null;if(getComputedStyle(button).position==='static')button.classList.add('motion-button76');
 const rect=button.getBoundingClientRect(),wrap=document.createElement('span'),dot=document.createElement('span'),size=Math.max(rect.width,rect.height)*2;
 wrap.className='motion-ink76';wrap.setAttribute('aria-hidden','true');dot.className='motion-ink-dot76';dot.style.cssText='width:'+size+'px;height:'+size+'px;left:'+(x-rect.left-size/2)+'px;top:'+(y-rect.top-size/2)+'px';wrap.append(dot);button.append(wrap);
 const a=play(dot,[{transform:'scale(0)',opacity:.18},{transform:'scale(1)',opacity:0}],{duration:550,easing:'cubic-bezier(.2,.7,.2,1)'});if(a){a.addEventListener('finish',()=>wrap.remove(),{once:true});a.addEventListener('cancel',()=>wrap.remove(),{once:true});}else wrap.remove();return wrap;
}
function release(id,cancel=false){const p=presses.get(id);if(!p)return;presses.delete(id);p.animation?.cancel();if(cancel){p.ink?.remove();return;}
 lastPress.set(p.button,performance.now());play(p.button,[{transform:'scale(.975)'},{transform:'scale(1.012)',offset:.65},{transform:'scale(1)'}],{duration:260});
}
document.addEventListener('pointerdown',e=>{
 if(e.button!==0||!e.isPrimary){for(const id of [...presses.keys()])release(id,true);return;}const button=eligible(e.target);if(!button||reduced.matches)return;
 release(e.pointerId,true);presses.set(e.pointerId,{button,x:e.clientX,y:e.clientY,ink:ink(button,e.clientX,e.clientY),animation:play(button,[{transform:'scale(1)'},{transform:'scale(.975)'}],{duration:110,fill:'forwards'})});
},{passive:true,capture:true});
document.addEventListener('pointermove',e=>{const p=presses.get(e.pointerId);if(p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>10)release(e.pointerId,true);},{passive:true,capture:true});
document.addEventListener('pointerup',e=>release(e.pointerId),{passive:true,capture:true});document.addEventListener('pointercancel',e=>release(e.pointerId,true),{passive:true,capture:true});
document.addEventListener('click',e=>{const b=eligible(e.target);if(!b||!e.isTrusted||performance.now()-(lastPress.get(b)||-1000)<600)return;if(e.detail===0){const r=b.getBoundingClientRect();ink(b,r.left+r.width/2,r.top+r.height/2);play(b,[{transform:'scale(.975)'},{transform:'scale(1)'}],{duration:230});}},true);
document.addEventListener('change',e=>{if(e.target.matches('input[type=checkbox],input[type=radio]'))play(e.target,[{transform:'scale(.88)'},{transform:'scale(1.12)',offset:.6},{transform:'scale(1)'}],{duration:260});},true);
document.addEventListener('toggle',e=>{if(e.target.tagName==='DETAILS'&&e.target.open)[...e.target.children].filter(n=>n.tagName!=='SUMMARY').slice(0,3).forEach(n=>play(n,[{opacity:.2,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}],{duration:240}));},true);
document.addEventListener('load',e=>{const img=e.target;if(img.tagName==='IMG'&&img.closest('.route-cover73')&&!img.src.includes('placeholder'))play(img,[{opacity:.1},{opacity:1}],{duration:300});},true);
const dialogSelector='dialog,.tm[role=dialog],#weeklyFlow40,#profileEditor64,#routeCreation';
function watchDialog(node){
 const on=node.tagName==='DIALOG'?node.open:!node.hidden&&!!node.getClientRects().length;
 if(visibility.get(node)===on)return;visibility.set(node,on);if(!on)return;
 const surface=node.querySelector(':scope > .tmbox,:scope > .flow-shell40,:scope > .profile-editor-shell64')||node;
 play(surface,[{opacity:.15,transform:'translateY(18px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:330});
}
document.querySelectorAll(dialogSelector).forEach(watchDialog);
const observer=new MutationObserver(records=>{
 for(const record of records){if(record.type==='attributes'){if(record.target.matches(dialogSelector))watchDialog(record.target);}else for(const node of record.addedNodes)if(node.nodeType===1&&node.matches(dialogSelector))watchDialog(node);}
});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open']});
const route=document.getElementById('routeQuestionContainer');let routeTitle=route?.querySelector('h1,h2,h3')?.textContent||'';
if(route)new MutationObserver(()=>{const title=route.querySelector('h1,h2,h3')?.textContent||'';if(title&&title!==routeTitle){routeTitle=title;enter(route);}}).observe(route,{childList:true,subtree:true});
let fullCalendar=document.body.classList.contains('lt-calendar-open');new MutationObserver(()=>{const next=document.body.classList.contains('lt-calendar-open');if(next&&!fullCalendar){for(const a of [...pageAnimations])a.cancel();enter(document.querySelector('.lt-calendar-full'));}fullCalendar=next;}).observe(document.body,{attributes:true,attributeFilter:['class']});
function clear(){for(const id of [...presses.keys()])release(id,true);for(const animation of [...active])animation.cancel();document.querySelectorAll('.motion-ink76').forEach(n=>n.remove());}
const account=switchAccountData;switchAccountData=function(uid){if(uid!==dataOwner)clear();return account.apply(this,arguments);};
reduced.addEventListener('change',()=>{if(reduced.matches)clear()});document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
window.addEventListener('blur',()=>{for(const id of [...presses.keys()])release(id,true)});
window.AppMotion76={enter,clear,activeCount:()=>[...active].filter(a=>a.playState==='running'||a.playState==='pending').length};
})();
