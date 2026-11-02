(function(){
'use strict';
const nav=document.querySelector('nav.side');if(!nav)return;
const marker=document.createElement('span');marker.className='nav-glass-indicator';marker.setAttribute('aria-hidden','true');nav.prepend(marker);
let frame=0,ready=false,drag=null;const handledClicks=new WeakMap();
const buttons=()=>Array.from(nav.querySelectorAll('button.nv'));
function place(button,followX){if(!button)return;const bounds=nav.getBoundingClientRect(),box=button.getBoundingClientRect();if(!bounds.width||!box.width)return;const style=getComputedStyle(nav),originX=bounds.left+parseFloat(style.borderLeftWidth),originY=bounds.top+parseFloat(style.borderTopWidth);const x=followX===undefined?box.left-originX:Math.max(5,Math.min(bounds.width-box.width-5,followX-originX-box.width/2));marker.style.width=box.width+'px';marker.style.height=box.height+'px';marker.style.transform='translate3d('+x+'px,'+(box.top-originY)+'px,0)';if(!ready){ready=true;nav.classList.add('nav-motion-ready');requestAnimationFrame(()=>nav.classList.add('nav-motion-animate'));}}
function sync(){frame=0;if(drag&&drag.moving)return;const selected=nav.querySelector('button.nv.on');place(selected);buttons().forEach(b=>{if(b===selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});}
function schedule(){if(!frame)frame=requestAnimationFrame(sync)}
new MutationObserver(schedule).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
new ResizeObserver(schedule).observe(nav);window.addEventListener('resize',schedule);window.addEventListener('pageshow',schedule);
function nearest(x){return buttons().filter(b=>!b.disabled).reduce((best,b)=>{const r=b.getBoundingClientRect(),distance=Math.abs(x-r.left-r.width/2);return !best||distance<best.distance?{button:b,distance}:best},null)?.button;}
nav.addEventListener('pointerdown',e=>{if(e.isPrimary===false){finish(null,false);return;}const button=e.target.closest('button.nv');if(!button||button.disabled||e.button!==0||e.isPrimary===false)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moving:false,button,pointerType:e.pointerType};nav.classList.add('nav-touching');});
nav.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moving){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>9){finish(null,false);return;}if(Math.abs(dx)<9)return;drag.moving=true;nav.setPointerCapture(e.pointerId);nav.classList.add('nav-dragging');}e.preventDefault();const button=nearest(e.clientX);buttons().forEach(b=>b.classList.toggle('nav-preview',b===button));place(button,e.clientX);});
// Commit touch navigation once at release; discard only the matching native compatibility click.
function finish(e,commit){if(!drag||(e&&e.pointerId!==drag.id))return;const old=drag;drag=null;nav.classList.remove('nav-touching','nav-dragging');buttons().forEach(b=>b.classList.remove('nav-preview'));if(nav.hasPointerCapture(old.id))nav.releasePointerCapture(old.id);
 const touch=old.pointerType==='touch'||old.pointerType==='pen';if(commit&&e&&(old.moving||touch)){const bounds=nav.getBoundingClientRect(),inside=e.clientX>=bounds.left-10&&e.clientX<=bounds.right+10&&e.clientY>=bounds.top-10&&e.clientY<=bounds.bottom+10,button=old.moving?nearest(e.clientX):old.button;if(inside&&button?.isConnected&&!button.disabled){handledClicks.set(button,{until:performance.now()+1000,type:old.pointerType});button.click();}}
 schedule();}
nav.addEventListener('pointerup',e=>finish(e,true));nav.addEventListener('pointercancel',e=>finish(e,false));nav.addEventListener('lostpointercapture',e=>{if(drag&&e.target===nav&&!nav.hasPointerCapture(e.pointerId))finish(e,false)});nav.addEventListener('pointerleave',()=>{if(drag&&!drag.moving)finish(null,false)});
nav.addEventListener('click',e=>{const button=e.target.closest('button.nv'),handled=button&&handledClicks.get(button);if(e.isTrusted&&e.detail!==0&&handled&&performance.now()<handled.until&&(!e.pointerType||e.pointerType===handled.type)){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(null,false);else schedule()});schedule();
})();
