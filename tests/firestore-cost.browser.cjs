// Real UI with an in-memory Firestore boundary; never connects to production.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',require('./serve-local.cjs'));await page.goto('http://localhost:8000');await page.waitForTimeout(2600);
 await page.evaluate(async()=>{
  leaveFlow40(true);deferFlow40(true);FB.uid='cost-test';rankScope61='global';publishGlobalRank61=async()=>{};commentCountRead=async()=>0;
  todayStudySeconds=()=>1800;window.rankDocuments=Array.from({length:205},(_,i)=>({id:'rank-'+i,data:()=>({seconds:4000-(i===100?99:i)*10,name:'テスト'+i})}));
  FB.Fs={collection:(_db,p)=>p,orderBy:(field,dir)=>({field,dir}),limit:n=>({limit:n}),where:(field,op,value)=>({field,op,value}),startAfter:doc=>({cursor:doc}),query:(p,...parts)=>({p,parts}),getCountFromServer:async()=>({data:()=>({count:205})}),getDocs:async q=>{const cursor=q.parts.find(p=>p.cursor),start=cursor?rankDocuments.findIndex(d=>d.id===cursor.cursor.id)+1:0;return {docs:rankDocuments.slice(start,start+100)}}};
  const rows=await globalRankRows61(()=>{},e=>{throw e});rankPaint54(document.getElementById('tlBody'),rows,false);
 });
 assert.equal(await page.locator('#tlBody .rkrow').count(),101);
 assert.equal(await page.locator('#rankPlace59').innerText(),'—');assert.equal(await page.locator('#rankPlaceUnit59').innerText(),'取得範囲外');
 assert.match(await page.locator('#rankStatus59').innerText(),/上位100件/);assert.equal(await page.locator('#rankCount59').innerText(),'上位100件と自分');
 await page.evaluate(()=>loadOwnGlobalRank61());assert.equal(await page.locator('#rankPlace59').innerText(),'206');assert.equal(await page.locator('#rankPlaceUnit59').innerText(),'位（確認時点）');
 await page.evaluate(()=>Promise.all([loadMoreGlobalRank61(),loadMoreGlobalRank61()]));assert.equal(await page.locator('#tlBody .rkrow').count(),201);
 assert.equal(await page.locator('#tlBody [data-rank-uid=rank-100] .rn').innerText(),'100');
 assert.equal(await page.locator('#tlBody [data-rank-uid=rank-101] .rn').innerText(),'102');
 await page.evaluate(()=>loadMoreGlobalRank61());assert.equal(await page.locator('#tlBody .rkrow').count(),206);assert.equal(await page.evaluate(()=>globalRankSession61.more),false);
 assert.equal(await page.locator('#tlBody [data-rank-uid=cost-test] .rn').innerText(),'206');
 await page.evaluate(async()=>{
  FB.Fs.getDocs=async()=>({docs:[{id:'other',data:()=>({seconds:3600,name:'相手'})}]});
  const rows=await globalRankRows61(()=>{},e=>{throw e});rankPaint54(document.getElementById('tlBody'),rows,false);
 });
 assert.equal(await page.locator('#tlBody .rkrow').count(),2);assert.equal(await page.locator('#rankCount59').innerText(),'2人中');
 await page.evaluate(async()=>{
  document.getElementById('dmm').hidden=false;inboxTab='dm';
  const c={uid:FB.uid,epoch:authEpoch,cid:'cost-test_other',other:'other',messages:new Map(),atBottom:true};dmCur=c;window.costChat=c;window.costReads=0;
  fGet=async p=>{costReads++;return p.includes('/reads/')?{at:0}:{updated:1,lastFrom:'other',last:'最初'}};
  fQ=async()=>[{id:'one',data:{from:'other',text:'最初',at:1}}];markDmRead38=()=>{};await dmLoad(true);await dmLoad(false);
 });
 assert.match(await page.locator('#dmBody').innerText(),/最初/);
 await page.evaluate(async()=>{fGet=async()=>({updated:2,lastFrom:'other',last:'新着'});fQ=async()=>[{id:'two',data:{from:'other',text:'新着',at:2}},{id:'one',data:{from:'other',text:'最初',at:1}}];await dmLoad(false);});
 assert.match(await page.locator('#dmBody').innerText(),/新着/);assert.match(await page.locator('#dmBody').innerText(),/最初/);
 await page.evaluate(async()=>{
  const c=costChat,p={id:'own-message',text:'時刻差のある送信',at:1.5};state.dmOutbox={[c.cid]:p};
  fSet=async(path,data)=>{if(path.includes('/messages/'))fQ=async()=>[{id:'two',data:{from:'other',text:'新着',at:2}},{id:p.id,data},{id:'one',data:{from:'other',text:'最初',at:1}}]};
  await sendDmPending38(c,p);
 });
 assert.match(await page.locator('#dmBody').innerText(),/時刻差のある送信/);
 await page.evaluate(()=>dmStop());assert.equal(await page.evaluate(()=>dmCur),null);assert.deepEqual(errors,[]);
 console.log('PASS bounded ranking UI, outside-top label, small ranking count, cached DM and new message display, chat cleanup, no browser errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
