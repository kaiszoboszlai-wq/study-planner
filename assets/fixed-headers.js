(function(){'use strict';
const selector='#planbox>.plan-heading,#today>.today-view-tabs,#longTermPlanner>.lt-view-tabs',spacers=new WeakMap();let frame=0;
function install(){frame=0;for(const bar of document.querySelectorAll(selector)){if(spacers.has(bar))continue;const spacer=document.createElement('div');spacer.className='fixed-heading-spacer101';spacer.setAttribute('aria-hidden','true');bar.after(spacer);spacers.set(bar,spacer);const resize=new ResizeObserver(()=>{spacer.style.height=(bar.getBoundingClientRect().height+8)+'px';});resize.observe(bar);spacer.style.height=(bar.getBoundingClientRect().height+8)+'px';}}
function schedule(){if(!frame)frame=requestAnimationFrame(install);}
new MutationObserver(schedule).observe(document.querySelector('.app main'),{subtree:true,childList:true});const show=showPage;showPage=function(){const result=show.apply(this,arguments);install();return result;};install();
// Older mobile Safari can move the visual viewport during native edge bounce.
// Cancel only outward vertical motion when no ancestor can consume the scroll.
let touch=null;
document.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
document.addEventListener('touchmove',e=>{if(!touch||e.touches.length!==1)return;const t=e.touches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;touch={x:t.clientX,y:t.clientY};if(Math.abs(dy)<Math.abs(dx)||!dy||!e.cancelable)return;
 if(e.target.closest('#appScrollHeader68,'+selector)){e.preventDefault();return;}
 for(let node=e.target;node&&node!==document.body;node=node.parentElement){const css=getComputedStyle(node);if(/auto|scroll/.test(css.overflowY)&&node.scrollHeight>node.clientHeight+1){if((dy>0&&node.scrollTop>0)||(dy<0&&node.scrollTop+node.clientHeight<node.scrollHeight-1))return;e.preventDefault();return;}}
 const root=document.scrollingElement;if((dy>0&&root.scrollTop<=0)||(dy<0&&root.scrollTop+root.clientHeight>=root.scrollHeight-1))e.preventDefault();
},{passive:false});document.addEventListener('touchend',()=>touch=null,{passive:true});document.addEventListener('touchcancel',()=>touch=null,{passive:true});
})();
