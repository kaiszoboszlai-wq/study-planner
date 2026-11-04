(function(){'use strict';
const by=id=>document.getElementById(id),summary=document.querySelector('.account-summary109'),page=by('mypage');if(!summary||!page)return;
// Move the live controls, retaining their handlers, IDs and account updates.
const controls=document.createElement('div');controls.id='accountControls123';summary.append(controls);
for(const node of [page.querySelector('.profile-actions64'),by('profileShareStatus64'),by('myGoal62'),page.querySelector('.my-menu62'),by('loginRowStatus69'),page.querySelector('.my-account62')])if(node)controls.append(node);
const profileCard=page.querySelector('.my-profile62'),profileActions=document.createElement('div');profileActions.className='profile-actions64 profile-page-actions123';
const profileShare=document.createElement('button');profileShare.type='button';profileShare.textContent='プロフィールをシェア';profileShare.onclick=()=>by('profileShare64')?.click();
const profileEdit=document.createElement('button');profileEdit.type='button';profileEdit.onclick=()=>by('profileEdit63')?.click();profileActions.append(profileShare,profileEdit);profileCard?.append(profileActions);
const shareStatus=by('profileShareStatus64'),profileStatus=document.createElement('p');profileStatus.className='note profile-page-share-status123';profileStatus.setAttribute('role','status');profileStatus.hidden=true;profileActions.after(profileStatus);
if(shareStatus)new MutationObserver(()=>{profileStatus.textContent=shareStatus.textContent;profileStatus.hidden=shareStatus.hidden;}).observe(shareStatus,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['hidden']});
const account=controls.querySelector('.my-account62');if(!account)return;
let sync=by('appSyncPanel');if(!sync){sync=document.createElement('div');sync.id='appSyncPanel';sync.innerHTML='<div><strong>データの同期</strong><span id="appSyncStatus" role="status"></span></div><button id="appSyncButton" type="button">今すぐ同期</button>';account.append(sync);}
const button=by('appSyncButton'),label=by('appSyncStatus');let busy=false,feedback='';
function paint(){profileEdit.textContent=state.profile?.name?'プロフィールを編集':'プロフィールを追加';if(!button||!label)return;button.disabled=busy;let message='ログインすると別端末と同期できます。';if(FB.uid){const error=saveHealth.cloudError||saveHealth.localError;message=error?'同期できませんでした。通信状況を確認して再度お試しください。':saveHealth.pending?'この端末に保存済み・クラウドへの同期待ち':saveHealth.synced?'クラウドと同期済み':'クラウドのデータを確認中';}label.textContent=busy?'同期中…':feedback||message;}
const original=paintSaveStatus;paintSaveStatus=function(){const result=original.apply(this,arguments);paint();return result;};
const render=renderMy;renderMy=function(){const result=render.apply(this,arguments);feedback='';paint();return result;};
button.removeAttribute('onclick');button.onclick=async()=>{if(busy)return;feedback='';if(!FB.uid||!ownsCurrentData(FB.uid)){feedback='Googleアカウントにログインしてください。';paint();return;}if(state.timer||state.idleReview||state.pendingTimerRelease){feedback='タイマーを停止し、記録の保存が完了してから同期してください。';paint();return;}const other=[...document.querySelectorAll('[role="dialog"]:not([hidden]),dialog[open]')].some(n=>n.id!=='accountMenu96');if(other){feedback='編集中の画面を閉じてから同期してください。';paint();return;}const owner=dataOwner,epoch=authEpoch;busy=true;paint();try{if(!FB.syncReady)await fbOnAuth();else await syncPull();}catch{if(owner===dataOwner&&epoch===authEpoch)feedback='同期できませんでした。通信状況を確認して再度お試しください。';}finally{busy=false;if(owner!==dataOwner||epoch!==authEpoch)feedback='';paint();}};
paint();
})();
