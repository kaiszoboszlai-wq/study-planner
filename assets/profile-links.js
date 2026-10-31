(function(){'use strict';
const by=id=>document.getElementById(id),original=openProfile;
// Reuse the existing permission checks and request transaction; sharing grants no record access.
openProfile=async function(id){const viewer=FB.uid,epoch=authEpoch,result=await original.apply(this,arguments);if(!viewer||viewer!==FB.uid||epoch!==authEpoch||pmCur!==id||by('pm').hidden)return result;
 const body=by('pmBody');body.querySelector('.profile-request91')?.remove();const actions=document.createElement('div');actions.className='profile-request91';const status=document.createElement('p');status.className='note';status.setAttribute('role','status');
 if(id===viewer){status.textContent='あなたのプロフィールです。';actions.append(status);body.querySelector('.me')?.after(actions);return result;}
 try{const profile=await profileRead('profiles/'+id);if(!profile||FB.uid!==viewer||epoch!==authEpoch||pmCur!==id||by('pm').hidden)return result;const ids=await myFollowIds(true);if(FB.uid!==viewer||epoch!==authEpoch||pmCur!==id||by('pm').hidden)return result;const button=makeFollowButton(id,ids);button.classList.add('main');if(button.dataset.followState==='none')button.textContent='フォローリクエストを送る';const submit=button.onclick;button.onclick=async function(e){await submit.call(this,e);if(!button.isConnected||FB.uid!==viewer)return;status.textContent=button.dataset.followState==='pending'?'フォローリクエストを送りました。承認されると学習記録を見られます。':button.dataset.followState==='following'?'フォロー中です。':button.dataset.followState==='none'?'リクエストは送信されていません。':'';};actions.append(button,status);body.querySelector('.me')?.after(actions);
 }catch{if(FB.uid===viewer&&pmCur===id&&!by('pm').hidden){status.textContent='リクエストの状態を確認できませんでした。プロフィールを開き直してください。';actions.append(status);body.querySelector('.me')?.after(actions);}}return result;};
const target=new URL(location.href).searchParams.get('profile');if(!target||!/^[-A-Za-z0-9_:]{1,128}$/.test(target))return;
let handled=null,scheduled=false;
function visit(){scheduled=false;const viewer=FB.uid||'guest';if(handled===viewer)return;handled=viewer;deferFlow40(true);leaveFlow40(false);showPage(5);
 if(FB.uid){openProfile(target);return;}
 const modal=by('pm'),body=by('pmBody');modal.hidden=false;body.replaceChildren();const title=document.createElement('h3');title.textContent='共有されたプロフィール';const note=document.createElement('p');note.textContent='プロフィールを見るにはログインしてください。ログイン後、この相手にフォローリクエストを送れます。';const login=document.createElement('button');login.type='button';login.className='main';login.textContent='Googleでログイン';login.onclick=()=>by('loginRow69').click();body.append(title,note,login);
}
function schedule(){if(scheduled)return;scheduled=true;Promise.resolve(window.AccountStorage88?.hydration).then(()=>requestAnimationFrame(visit));}
const render=renderFb;renderFb=function(){const result=render.apply(this,arguments);schedule();return result;};schedule();
})();
