(function(){
'use strict';
const account=document.querySelector('.my-account62');if(!account)return;
const row=document.createElement('button');row.id='loginRow69';row.type='button';row.innerHTML='<span id="loginRowLabel69">ログイン</span><span class="login-providers69"><img src="assets/google-signin-mark.svg" alt="Google" width="24" height="24"></span>';document.querySelector('.my-menu62').append(row);for(const heading of document.querySelectorAll('#mypage > h3,#mypage > .section-heading62'))if(heading.textContent.trim()==='アカウント')heading.remove();
const status=document.createElement('p');status.id='loginRowStatus69';status.className='note';status.setAttribute('role','status');status.hidden=true;document.querySelector('.my-menu62').after(status);let busy=false;
function render(){const signed=!!FB.uid;document.getElementById('loginRowLabel69').textContent=signed?'ログイン済み':'ログイン';row.setAttribute('aria-label',signed?'ログイン中のアカウントを確認':'Googleアカウントでログイン');row.disabled=busy;status.textContent=FB.err?'ログインを利用できませんでした。通信状況を確認して、もう一度お試しください。':'';status.hidden=!status.textContent;}
const fb=renderFb;renderFb=function(){const result=fb.apply(this,arguments);render();return result;};
row.onclick=async()=>{if(FB.uid){const sheet=v36Dialog('アカウント');v36Text(sheet.box,FB.user?.email||'ログイン済み');v36Button(sheet.box,'ログアウト',()=>{sheet.hide();document.getElementById('fbLogout').click()});v36Button(sheet.box,'閉じる',()=>sheet.hide());return;}if(busy)return;if(!FB.loaded||!FB.Au){busy=true;render();status.textContent='ログインを準備しています…';status.hidden=false;try{await fbInit();}finally{busy=false;render();if(FB.loaded){status.textContent='準備ができました。もう一度ログインを押してください。';status.hidden=false;}}return;}busy=true;FB.err="";render();try{await fbSignIn();}finally{busy=false;render();}};render();
})();
