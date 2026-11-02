(function(){'use strict';
const by=id=>document.getElementById(id),profile=by('mypage'),info=by('meName')?.parentElement,counts=by('cntRow');if(info&&counts)info.append(counts);
const row=profile?.querySelector('.profile-actions64'),share=by('profileShare64');if(row&&share)row.prepend(share);
const goal=by('myGoal62'),heading=goal?.previousElementSibling,edit=by('myGoalEdit62');if(goal&&heading?.classList.contains('section-heading62')){goal.prepend(heading);if(edit){goal.append(edit);edit.textContent='目標を変更';}}

const panel=document.querySelector('.account-menu-panel97');if(panel){const search=document.createElement('button');search.id='profileSearch108';search.type='button';search.hidden=true;search.setAttribute('aria-label','ユーザーを検索');search.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>';search.onclick=()=>openFriend();panel.prepend(search);}
by('accountMenu96')?.setAttribute('aria-label','マイページ');by('accountMenuOpen96')?.setAttribute('aria-label','ユーザーメニューを開く');
})();
