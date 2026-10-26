(function(){
'use strict';
const pending=new Map();
function skeleton(kind){const host=document.createElement('div');host.className='async-placeholder72';host.setAttribute('aria-hidden','true');if(kind==='profile'){const cover=document.createElement('div');cover.className='async-shape72 async-profile72';host.append(cover);}for(let i=0;i<(kind==='profile'?3:4);i++){const row=document.createElement('div');row.className='async-row72';row.innerHTML='<span class="async-shape72 async-avatar72"></span><span class="async-copy72"><span class="async-shape72"></span><span class="async-shape72"></span></span><span class="async-shape72 async-value72"></span>';host.append(row);}return host;}
function start(target,kind='list',keep=false){if(!target)return ()=>{};pending.get(target)?.finish();const token={placeholder:null,prior:target.getAttribute('aria-busy'),timer:0};target.setAttribute('aria-busy','true');
 token.finish=function(){if(pending.get(target)!==token)return;clearTimeout(token.timer);token.placeholder?.remove();target.classList.remove('async-covered72');if(token.prior===null)target.removeAttribute('aria-busy');else target.setAttribute('aria-busy',token.prior);pending.delete(target);};pending.set(target,token);
 if(!keep)token.timer=setTimeout(()=>{if(!target.isConnected||pending.get(target)!==token)return;token.placeholder=skeleton(kind);target.before(token.placeholder);target.classList.add('async-covered72');},120);
 return token.finish;
}
function clear(){for(const token of [...pending.values()])token.finish();}
window.AppLoading72={start,clear};
})();
