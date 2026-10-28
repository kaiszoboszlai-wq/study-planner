// Baseline extracted from commit bfacdfa for reproducible mocked request counts.
function fbSchedule(){if(!ownsCurrentData(FB.uid)||!FB.code||!FB.syncReady)return;clearTimeout(fbTimer);fbTimer=setTimeout(function(){fbPublish(false)},3000)}
async function fbPublish(force){ // プロフィールと、目標・学習記録を、保存する(承認した人は全員、見られる)
  var uid=FB.uid,epoch=authEpoch;if(!ownsCurrentData(uid)||!FB.code||!FB.syncReady)return;
  await ensureSmallPhoto();
  if(!ownsCurrentData(uid)||epoch!==authEpoch)return;
  var me=fbMine(),st={share:true,colors:sharedColors54(),grade:me.grade,high:me.high,goal:String(state.goal||"").slice(0,60),log:trimLog(),live:state.timer?{n:String((findBlock(state.timer.id)||{}).name||"").slice(0,30),at:Date.now()}:null,updated:Date.now()};
  var sig=JSON.stringify([me.name,me.icon,me.color,me.photo,me.grade,me.school,me.high,FB.code,st.goal,st.log,st.colors,!!state.timer]);
  await publishGlobalRank61().catch(function(){});
  if(!ownsCurrentData(uid)||epoch!==authEpoch)return;
  if(!force&&sig===fbSig)return;
  var base={name:me.name,icon:me.icon,color:me.color,code:FB.code,updated:Date.now()},full=Object.assign({},base);
  if(me.photo)full.photo=me.photo;if(me.grade)full.grade=me.grade;if(me.school)full.school=me.school;
  var noGs=Object.assign({},full);delete noGs.grade;delete noGs.school;
  try{
    var saved=false,tries=[full,noGs,base];
    for(var i=0;i<tries.length&&!saved;i++){if(!ownsCurrentData(uid)||epoch!==authEpoch)return;try{await fSet("profiles/"+uid,tries[i]);saved=true}catch(e){}} // ルールが新しい項目を断ったときは、項目を減らして保存し直す
    if(!saved)throw new Error("profile");
    if(!ownsCurrentData(uid)||epoch!==authEpoch)return;
    await fSet("stats/"+uid,st);
    if(!ownsCurrentData(uid)||epoch!==authEpoch)return;
    fbSig=sig;FB.err="";publishFollowerProfile(false);
  }catch(e){}
}

var rankScope61='following',globalRankSig61='',globalRankTask61=null,globalRankAgain61=false;
async function publishGlobalRank61(){
  var uid=FB.uid,epoch=authEpoch;if(!ownsCurrentData(uid)||!FB.syncReady||!FB.Fs)return;
  if(globalRankTask61){globalRankAgain61=true;return globalRankTask61}
  var day=fmtDate(new Date()),logs=logData(),me=fbMine(),seconds=Math.floor(todayStudySeconds());
  var data={name:me.name,icon:me.icon,color:me.color,photo:me.photo||'',seconds:seconds,live:!!state.timer,updated:Date.now()};
  var signature=JSON.stringify([uid,day,data.name,data.icon,data.color,data.photo,seconds,data.live]);if(signature===globalRankSig61)return;
  var task=(async function(){
    if(!ownsCurrentData(uid)||epoch!==authEpoch)return;
    await limitRead(FB.Fs.setDoc(FB.Fs.doc(FB.db,'dailyRankings/'+day+'/users/'+uid),data));
    if(ownsCurrentData(uid)&&epoch===authEpoch)globalRankSig61=signature;
  })();globalRankTask61=task;
  try{await task}finally{if(globalRankTask61===task){globalRankTask61=null;var again=globalRankAgain61;globalRankAgain61=false;if(again)publishGlobalRank61().catch(function(){})}}
}

async function globalRankRows61(onRows,onError){
  var uid=FB.uid,epoch=authEpoch,day=fmtDate(new Date()),fs=FB.Fs,rows=new Map(),me=fbMine(),logs=logData();
  rows.set(uid,{uid:uid,me:true,name:me.name,icon:me.icon,color:me.color,photo:me.photo,s:todayStudySeconds(),live:!!state.timer});
  var active=function(){return uid===FB.uid&&epoch===authEpoch&&rankScope61==='global'&&day===fmtDate(new Date())};
  if(active())onRows(Array.from(rows.values()),false);
  try{await publishGlobalRank61()}catch(e){if(active()&&onError)onError(e)}
  var cursor=null;
  while(active()){
    var parts=[fs.orderBy(fs.documentId()),fs.limit(200)];if(cursor)parts.push(fs.startAfter(cursor));
    var query=fs.query.apply(fs,[fs.collection(FB.db,'dailyRankings/'+day+'/users')].concat(parts));
    var snapshot=await limitRead(fs.getDocs(query));if(!active())return [];
    snapshot.docs.forEach(function(doc){if(doc.id===uid)return;var d=doc.data();if(!d||!Number.isFinite(d.seconds)||d.seconds<0)return;rows.set(doc.id,{uid:doc.id,me:false,name:typeof d.name==='string'?d.name.slice(0,20):'名無し',icon:goodIcon(d.icon),color:goodColor(d.color),photo:goodPhoto(d.photo),s:d.seconds,live:!!d.live&&Date.now()-Number(d.updated)<150000})});
    var final=snapshot.docs.length<200;onRows(Array.from(rows.values()),final);if(final)break;cursor=snapshot.docs[snapshot.docs.length-1];
  }
  return Array.from(rows.values());
}
