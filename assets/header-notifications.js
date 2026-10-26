(function(){
'use strict';
const button=document.getElementById('planeBtn'),badge=document.getElementById('planeBdg');if(!button)return;
function paint(){button.hidden=false;const count=FB.uid?FBN.req+FBN.dm:0;badge.hidden=count<1;badge.textContent=count?String(Math.min(count,99))+(count>99?'+':''):'';button.setAttribute('aria-label',count?'通知 '+count+'件':'通知');}
const counts=paintCounts;paintCounts=function(){const out=counts.apply(this,arguments);paint();return out;};
const render=renderFb;renderFb=function(){const out=render.apply(this,arguments);paint();Promise.resolve(out).finally(paint).catch(()=>{});return out;};
button.onclick=function(){if(!FB.uid){showPage(5);return;}openInbox(FBN.dm&&!FBN.req?'dm':'req');};
let pending=null;
async function poll(){if(!FB.uid||document.hidden)return;const uid=FB.uid,epoch=authEpoch,key=uid+'/'+epoch;if(pending===key)return;pending=key;
 try{const [requests,messages]=await Promise.allSettled([fList('requests/'+uid+'/from'),fMem(uid)]);if(uid!==FB.uid||epoch!==authEpoch||document.hidden)return;
 if(requests.status==='fulfilled')FBN.req=requests.value.length;
 if(messages.status==='fulfilled'){const seen=state.dmSeen||{};FBN.dm=messages.value.filter(c=>c.data.lastFrom&&c.data.lastFrom!==uid&&(c.data.updated||0)>(seen[c.id]||0)).length;}
 paintCounts();}finally{if(pending===key)pending=null;}}
// Use the same guarded reader for existing refresh/visibility events as well.
fbPoll=function(){if(!FB.uid||document.hidden)return Promise.resolve();publishFollowerProfile(true);renderRank();return poll();};dmCheck=poll;
setInterval(poll,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
paint();poll();
})();
