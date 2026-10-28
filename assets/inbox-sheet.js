(function(){'use strict';
const sheet=document.getElementById('dmm'),panel=sheet.querySelector('.tmbox'),tabs=document.getElementById('inboxTabs'),close=document.getElementById('dmmClose');
const header=document.createElement('header');header.className='inbox-sheet-header';const handle=document.createElement('span');handle.className='inbox-sheet-handle';handle.setAttribute('aria-hidden','true');panel.prepend(handle,header);header.append(tabs,close);close.textContent='×';close.setAttribute('aria-label','通知画面を閉じる');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','通知とメッセージ');
// Visual order keeps the original DOM order used by the unread-count renderer.
function paint(){tabs.style.setProperty('--inbox-tab',inboxTab==='req'?0:1);for(const b of tabs.children){b.setAttribute('role','tab');b.setAttribute('aria-selected',String(b.dataset.t===inboxTab));b.tabIndex=b.dataset.t===inboxTab?0:-1;}sheet.classList.toggle('inbox-chat',!!dmCur);}
const original=inboxPaint;inboxPaint=function(){const r=original.apply(this,arguments);paint();return r;};
tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const key=e.key==='Home'?'req':e.key==='End'?'dm':inboxTab==='req'?'dm':'req';setInboxTab(key);tabs.querySelector('[data-t='+key+']').focus();});
let wasOpen=false;new MutationObserver(()=>{const open=!sheet.hidden;if(open&&!wasOpen&&!matchMedia('(prefers-reduced-motion: reduce)').matches){for(const a of panel.getAnimations())a.cancel();panel.animate([{transform:'translateY(100%)'},{transform:'translateY(0)'}],{duration:480,easing:'cubic-bezier(.16,1,.3,1)'});}wasOpen=open;if(!open)sheet.classList.remove('inbox-chat');}).observe(sheet,{attributes:true,attributeFilter:['hidden']});paint();
})();
