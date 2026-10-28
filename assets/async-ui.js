(function(){
'use strict';
const pending=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)'),reveals=new WeakMap(),revealAnimations=new Set();
const status=document.createElement('span');status.className='async-access76';status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.append(status);
function skeleton(kind='list'){
 const host=document.createElement('div');host.className='async-placeholder72 async-kind-'+kind;host.setAttribute('aria-hidden','true');
 if(kind==='profile'){const cover=document.createElement('div');cover.className='async-shape72 async-profile72';host.append(cover);}
 for(let i=0;i<(kind==='profile'||kind==='books'?3:4);i++){
  const row=document.createElement('div');row.className='async-row72';
  row.innerHTML=kind==='form'?'<span class="async-form-copy76"><span class="async-shape72 async-form-label76"></span><span class="async-shape72 async-form-field76"></span></span>':'<span class="async-shape72 '+(kind==='books'?'async-book76':'async-avatar72')+'"></span><span class="async-copy72"><span class="async-shape72"></span><span class="async-shape72"></span></span><span class="async-shape72 async-value72"></span>';
  host.append(row);
 }
 return host;
}
function start(target,kind='list',keep=false){
 if(!target)return ()=>{};pending.get(target)?.finish(false);reveals.get(target)?.cancel();
 const token={placeholder:null,prior:target.getAttribute('aria-busy'),timer:0};target.setAttribute('aria-busy','true');
 token.finish=function(reveal=true){
  if(pending.get(target)!==token)return;clearTimeout(token.timer);const shown=!!token.placeholder;
  token.placeholder?.remove();target.classList.remove('async-covered72');
  if(token.prior===null)target.removeAttribute('aria-busy');else target.setAttribute('aria-busy',token.prior);pending.delete(target);
  if(!pending.size)status.textContent='';
  if(shown&&reveal&&!reduced.matches&&target.isConnected&&target.getClientRects().length){const a=target.animate([{opacity:.25,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.75,.25,1)'});reveals.set(target,a);revealAnimations.add(a);const done=()=>revealAnimations.delete(a);a.addEventListener('finish',done,{once:true});a.addEventListener('cancel',done,{once:true});}
 };
 pending.set(target,token);
 if(!keep)token.timer=setTimeout(()=>{if(!target.isConnected||pending.get(target)!==token)return;token.placeholder=skeleton(kind);token.placeholder.style.minHeight=Math.min(420,target.getBoundingClientRect().height)+'px';target.before(token.placeholder);target.classList.add('async-covered72');status.textContent='読み込み中';},120);
 return token.finish;
}
function clear(){for(const token of [...pending.values()])token.finish(false);for(const a of [...revealAnimations])a.cancel();status.textContent='';}
new MutationObserver(()=>{if(!pending.size)return;for(const [target,token] of [...pending])if(!target.isConnected||target.closest('[hidden],dialog:not([open])'))token.finish(false);}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open']});
reduced.addEventListener('change',()=>{if(reduced.matches)for(const a of [...revealAnimations])a.cancel()});
window.AppLoading72={start,clear,create:skeleton};
})();
