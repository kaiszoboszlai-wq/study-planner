(function(){'use strict';
const header=document.getElementById('appScrollHeader68'),actions=header?.querySelector('.app-header-actions68'),my=document.getElementById('navMy');if(!actions||!my)return;
const host=document.createElement('div');host.className='account-menu96';
const trigger=document.createElement('button');trigger.id='accountMenuOpen96';trigger.type='button';trigger.setAttribute('aria-label','ユーザーメニュー');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','accountMenu96');
const menu=document.createElement('div');menu.id='accountMenu96';menu.hidden=true;menu.setAttribute('aria-label','ユーザーメニュー');
// Move the original navigation button, preserving its existing page handler and badge.
my.classList.remove('nv');my.type='button';menu.append(my);host.append(trigger,menu);actions.append(host);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let origin=null;
function close(focus=false){if(menu.hidden)return;menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();}
function paint(){trigger.replaceChildren();const photo=goodPhoto(state.profile?.photoS||state.profile?.photo);if(photo){const img=document.createElement('img');img.src=photo;img.alt='';trigger.append(img);}else{trigger.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>';}}
trigger.onclick=()=>{if(!menu.hidden){close();return;}origin=document.activeElement;menu.hidden=false;trigger.setAttribute('aria-expanded','true');if(!reduced.matches)menu.animate([{opacity:0,transform:'translateY(-5px) scale(.97)'},{opacity:1,transform:'none'}],{duration:180,easing:'ease-out'});my.focus();};
my.addEventListener('click',()=>close());
document.addEventListener('pointerdown',e=>{if(!host.contains(e.target))close();});document.addEventListener('focusin',e=>{if(!host.contains(e.target))close();});
host.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);}if(e.target===trigger&&e.key==='ArrowDown'){e.preventDefault();if(menu.hidden)trigger.click();else my.focus();}});
const render=renderMy;renderMy=function(){const result=render.apply(this,arguments);paint();return result;};
const show=showPage;showPage=function(){close();const result=show.apply(this,arguments);trigger.setAttribute('aria-current',Number(state.page)===5?'page':'false');return result;};
const account=switchAccountData;switchAccountData=function(){close();const result=account.apply(this,arguments);paint();return result;};paint();
// Place settings beside the weekly hours, below the week range.
const week=document.querySelector('#planbox>.plan-week62'),hours=document.getElementById('planWeekHours62'),settings=document.querySelector('#planbox .plan-header-actions');if(week&&hours&&settings){const row=document.createElement('div');row.className='plan-hours-actions96';week.append(row);row.append(hours,settings);}
})();
