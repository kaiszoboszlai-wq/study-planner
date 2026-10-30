(function(){
'use strict';
const button=document.getElementById('planeBtn'),badge=document.getElementById('planeBdg');if(!button)return;
function paint(){button.hidden=false;const count=(FB.uid?FBN.req:0)+(window.AppAnnouncements86?AppAnnouncements86.unread():0);badge.hidden=count<1;badge.textContent=count?String(Math.min(count,99))+(count>99?'+':''):'';button.setAttribute('aria-label',count?'通知 '+count+'件':'通知');}
const counts=paintCounts;paintCounts=function(){const out=counts.apply(this,arguments);paint();return out;};
const render=renderFb;renderFb=function(){const out=render.apply(this,arguments);paint();Promise.resolve(out).finally(paint).catch(()=>{});return out;};
button.onclick=function(){openInbox();};
let pending=null,lastKey='',lastAt=0;
async function poll(force=false){
 if(!FB.uid||document.hidden)return;const uid=FB.uid,epoch=authEpoch,key=uid+'/'+epoch;
 if(pending===key||(!force&&!automaticReadsAllowed())||(!force&&lastKey===key&&Date.now()-lastAt<59000))return;
 pending=key;const startedAt=Date.now();
 try{const requests=await collectionCountRead('requests/'+uid+'/from');if(uid!==FB.uid||epoch!==authEpoch||document.hidden)return;FBN.req=requests;lastKey=key;lastAt=startedAt;paintCounts();}catch{}finally{if(pending===key)pending=null;}
}
fbPoll=function(){if(!FB.uid||!automaticReadsAllowed())return Promise.resolve();publishFollowerProfile(false);renderRank();return poll();};
const inbox=openInbox;openInbox=function(){poll(true).catch(()=>{});return inbox.apply(this,arguments);};
const after=fbAfter;fbAfter=function(){lastAt=0;const result=after.apply(this,arguments);poll(true);return result;};
setInterval(poll,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
paint();poll();
})();
