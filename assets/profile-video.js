(function(){'use strict';
const by=id=>document.getElementById(id),profile=by('mypage'),info=by('meName')?.parentElement,counts=by('cntRow');if(info&&counts)info.append(counts);
const row=profile?.querySelector('.profile-actions64'),share=by('profileShare64');if(row&&share)row.prepend(share);
const goal=by('myGoal62'),heading=goal?.previousElementSibling,edit=by('myGoalEdit62');if(goal&&heading?.classList.contains('section-heading62')){goal.prepend(heading);if(edit){goal.append(edit);edit.textContent='目標を変更';}}

by('accountMenu96')?.setAttribute('aria-label','マイページ');by('accountMenuOpen96')?.setAttribute('aria-label','ユーザーメニューを開く');
})();
