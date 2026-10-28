(function(){
'use strict';
const button=document.getElementById('planeBtn'),badge=document.getElementById('planeBdg');if(!button)return;
function paint(){button.hidden=false;const count=FB.uid?FBN.req+FBN.dm:0;badge.hidden=count<1;badge.textContent=count?String(Math.min(count,99))+(count>99?'+':''):'';button.setAttribute('aria-label',count?'通知 '+count+'件':'通知');}
const counts=paintCounts;paintCounts=function(){const out=counts.apply(this,arguments);paint();return out;};
const render=renderFb;renderFb=function(){const out=render.apply(this,arguments);paint();Promise.resolve(out).finally(paint).catch(()=>{});return out;};
button.onclick=function(){if(!FB.uid){showPage(5);return;}openInbox(FBN.dm&&!FBN.req?'dm':'req');};
let pending=null,lastKey='',lastAt=0,lastMessages=[];
function unread(messages,uid){const seen=state.dmSeen||{};return messages.filter(c=>c.data.lastFrom&&c.data.lastFrom!==uid&&(c.data.updated||0)>(seen[c.id]||0)).length;}
async function poll(force=false){if(!FB.uid||document.hidden)return;const uid=FB.uid,epoch=authEpoch,key=uid+'/'+epoch;if(pending===key)return;if(!force&&lastKey===key&&Date.now()-lastAt<59000){FBN.dm=unread(lastMessages,uid);paintCounts();return;}pending=key;const startedAt=Date.now();
 try{const [requests,messages]=await Promise.allSettled([commentCountRead('requests/'+uid+'/from'),fMem(uid)]);if(uid!==FB.uid||epoch!==authEpoch||document.hidden)return;
 if(requests.status==='fulfilled')FBN.req=requests.value;
 if(messages.status==='fulfilled'){lastMessages=messages.value;FBN.dm=unread(lastMessages,uid);}
 if(requests.status==='fulfilled'&&messages.status==='fulfilled'){lastKey=key;lastAt=startedAt;}paintCounts();}finally{if(pending===key)pending=null;}}
// Use the same guarded reader for existing refresh/visibility events as well.
fbPoll=function(){if(!FB.uid||document.hidden)return Promise.resolve();publishFollowerProfile(false);renderRank();return poll();};dmCheck=poll;
const after=fbAfter;fbAfter=function(){lastAt=0;const result=after.apply(this,arguments);poll(true);return result;};
setInterval(poll,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
paint();poll();
})();
