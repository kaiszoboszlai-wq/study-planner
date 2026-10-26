(function(){
'use strict';
const key='studyplanner:announcement:learning-plan-in-progress-20261027';
function seen(){try{return localStorage.getItem(key)==='dismissed';}catch{return false;}}
function show(){
 if(seen())return;
 if(document.hidden){document.addEventListener('visibilitychange',function resume(){if(!document.hidden){document.removeEventListener('visibilitychange',resume);show();}});return;}
 const dialog=document.createElement('dialog');dialog.className='app-announcement';dialog.setAttribute('aria-labelledby','announcement-title');dialog.setAttribute('aria-describedby','announcement-copy');
 dialog.innerHTML='<div class="announcement-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 10 13-5v14L4 14zM4 10H2v4h2m3 1 2 6h3l-2-5M20 9l2-1m-2 7 2 1"/></svg></div><h2 id="announcement-title">お知らせ</h2><p id="announcement-copy">学習計画のページは作り途中なのでまだ試さないでください🙇</p><button type="button" autofocus>閉じる</button>';
 function dismiss(){try{localStorage.setItem(key,'dismissed');}catch{}dialog.close();dialog.remove();}
 dialog.querySelector('button').onclick=dismiss;dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});document.body.append(dialog);dialog.showModal();
}
setTimeout(show,2400);
})();
