(function(){
'use strict';
const app=document.querySelector('.app'),main=app?.querySelector('main');if(!main)return;
const header=document.createElement('header');header.id='appScrollHeader68';header.hidden=true;header.setAttribute('aria-label','StudyPlanner');header.innerHTML='<span aria-hidden="true"></span><div class="app-wordmark68"><img class="app-icon68" src="assets/app-flag-64.png" alt="" aria-hidden="true"><span class="studyplanner-wordmark69">StudyPlanner</span></div><div class="app-header-actions68"></div>';app.insertBefore(header,main);
const notifications=document.getElementById('planeBtn');if(notifications)header.querySelector('.app-header-actions68').append(notifications);
// Keep the header anchored while content scrolls in either direction.
const pages=new Set([3,4,5,6,8]);
function reveal(){header.style.setProperty('--header-offset68','0px');document.body.style.setProperty('--header-visible-height68',header.offsetHeight+'px');header.classList.remove('header-away68');header.inert=false;}
function sync(){const visible=pages.has(Number(state.page));header.hidden=!visible;document.body.classList.toggle('app-has-header68',visible);reveal();}
const page=showPage;showPage=function(){const result=page.apply(this,arguments);sync();return result;};
new ResizeObserver(reveal).observe(header);window.addEventListener('pageshow',sync);header.addEventListener('focusin',reveal);sync();
})();
