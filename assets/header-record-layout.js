(function(){'use strict';
const record=document.getElementById('mrOpen'),main=document.querySelector('.app main'),nav=document.querySelector('nav.side');if(!record||!main)return;
// Keep the existing click handler and ID. Outside animated pages, fixed means viewport-fixed.
const oldHeader=record.parentElement;document.body.append(record);record.classList.add('stats-record-fab94');record.type='button';record.textContent='+';record.setAttribute('aria-label','学習記録を追加');record.title='記録を追加';if(oldHeader.matches('#stats>.mh')&&!oldHeader.childElementCount)oldHeader.remove();
function measure(){const inline=parseFloat(getComputedStyle(main).paddingLeft)||16;document.documentElement.style.setProperty('--page-inline94',inline+'px');if(nav)document.documentElement.style.setProperty('--bottom-nav-height94',nav.getBoundingClientRect().height+'px');}
const resize=new ResizeObserver(measure);resize.observe(main);if(nav)resize.observe(nav);window.addEventListener('resize',measure);measure();
})();
