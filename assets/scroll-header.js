(function(){
'use strict';
const app=document.querySelector('.app'),main=app?.querySelector('main');if(!main)return;
const header=document.createElement('header');header.id='appScrollHeader68';header.hidden=true;header.setAttribute('aria-label','StudyPlanner');header.innerHTML='<span aria-hidden="true"></span><div class="app-wordmark68"><img class="app-icon68" src="assets/app-flag-64.png" alt="" aria-hidden="true"><span class="studyplanner-wordmark69">StudyPlanner</span></div><div class="app-header-actions68"></div>';app.insertBefore(header,main);
const notifications=document.getElementById('planeBtn');if(notifications)header.querySelector('.app-header-actions68').append(notifications);
const pages=new Set([3,4,6,8]);let previous=Math.max(0,window.scrollY),offset=0,frame=0;
function setOffset(value){const height=header.offsetHeight;offset=Math.max(0,Math.min(value,height));header.style.setProperty('--header-offset68',offset+'px');document.body.style.setProperty('--header-visible-height68',Math.max(0,height-offset)+'px');const away=height>0&&offset>=height;header.classList.toggle('header-away68',away);header.inert=away;}
function reveal(){setOffset(0);}
function sync(){const visible=pages.has(Number(state.page));header.hidden=!visible;document.body.classList.toggle('app-has-header68',visible);reveal();previous=Math.max(0,window.scrollY);}
const page=showPage;showPage=function(){const result=page.apply(this,arguments);sync();return result;};
function scroll(){frame=0;const y=Math.max(0,Math.min(window.scrollY,Math.max(0,document.documentElement.scrollHeight-innerHeight))),delta=y-previous;previous=y;if(header.hidden)return;if(y===0||header.contains(document.activeElement)){reveal();return;}setOffset(offset+delta);}
window.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(scroll)},{passive:true});window.addEventListener('resize',()=>{previous=Math.max(0,window.scrollY);setOffset(offset);});window.addEventListener('pageshow',sync);header.addEventListener('focusin',reveal);sync();
})();
