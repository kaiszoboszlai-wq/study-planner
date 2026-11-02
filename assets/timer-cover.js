(function(){'use strict';
const clock=document.getElementById('clock'),timer=document.getElementById('tm');if(!clock||!timer)return;
const cover=document.createElement('div');cover.id='timerCover117';cover.setAttribute('aria-hidden','true');clock.insertBefore(cover,document.getElementById('tmtime'));let previous=null;
function clear(){previous=null;cover.replaceChildren();clock.classList.remove('has-cover117');}
function paint(){if(timer.hidden||openId==null)return;const block=findBlock(openId);if(!block)return;const book=block.book||(state.subjects||[]).find(s=>s[0]===block.name)?.[2]||(state.bookRoutes||[]).flatMap(r=>r.books||[]).find(b=>b.title===block.name)||{title:block.name},key=[dataOwner,authEpoch,openId,book.id,book.title,book.isbn,book.customCover];if(previous&&key.every((v,i)=>v===previous[i]))return;previous=key;cover.replaceChildren();clock.classList.add('has-cover117');if(window.BookCovers73)BookCovers73.attach({...book,title:book.title||block.name},cover,{links:false});}
const update=updateTimer;updateTimer=function(){const result=update.apply(this,arguments);paint();return result;};
const close=closeTimer;closeTimer=function(){clear();return close.apply(this,arguments);};
const account=switchAccountData;switchAccountData=function(uid){if((uid||null)!==dataOwner)clear();return account.apply(this,arguments);};paint();
})();
