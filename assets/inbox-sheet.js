(function(){'use strict';
const sheet=document.getElementById('dmm'),panel=sheet.querySelector('.tmbox'),tabs=document.getElementById('inboxTabs'),close=document.getElementById('dmmClose');
const header=document.createElement('header');header.className='inbox-sheet-header';const handle=document.createElement('span');handle.className='inbox-sheet-handle';handle.setAttribute('aria-hidden','true');panel.prepend(handle,header);header.append(tabs,close);close.textContent='×';close.setAttribute('aria-label','通知画面を閉じる');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','通知');
// Visual order keeps the original DOM order used by the unread-count renderer.
function paint(){tabs.style.setProperty('--inbox-tab',inboxTab==='req'?0:1);for(const b of tabs.children){b.setAttribute('role','tab');b.setAttribute('aria-selected',String(b.dataset.t===inboxTab));b.tabIndex=b.dataset.t===inboxTab?0:-1;}}
const original=inboxPaint;inboxPaint=function(){const r=original.apply(this,arguments);paint();return r;};
let wasOpen=false,generation=0,closing=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),originalClose=close.onclick;
close.onclick=function(e){if(closing)return;if(reduced.matches)return originalClose.call(this,e);closing=true;panel.inert=true;const current=generation;for(const a of panel.getAnimations())a.cancel();const a=panel.animate([{transform:'translateX(0)'},{transform:'translateX(100%)'}],{duration:300,easing:'cubic-bezier(.4,0,.8,.2)',fill:'forwards'});a.finished.catch(()=>{}).finally(()=>{a.cancel();panel.inert=false;closing=false;if(current===generation&&!sheet.hidden)originalClose.call(close,e);});};
new MutationObserver(()=>{const open=!sheet.hidden;if(open&&!wasOpen){generation++;if(!reduced.matches){for(const a of panel.getAnimations())a.cancel();panel.animate([{transform:'translateX(100%)',easing:'cubic-bezier(.18,.85,.22,1)'},{transform:'translateX(-.25%)',offset:.86,easing:'ease-in-out'},{transform:'translateX(0)'}],{duration:700});}}wasOpen=open;if(!open)sheet.classList.remove('inbox-chat');}).observe(sheet,{attributes:true,attributeFilter:['hidden']});paint();
})();
