const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.testIntervals=[];const native=setInterval;window.setInterval=function(fn,ms,...args){testIntervals.push({fn,ms});return native(fn,ms,...args)};});
 await page.route('**/*',require('./serve-local.cjs'));await page.goto('http://localhost:8000');await page.waitForTimeout(2500);
 const result=await page.evaluate(async()=>{
  leaveFlow40(true);deferFlow40(true);FB.uid='idle-user';let rankingQueries=0;rankRows=async function(paint){rankingQueries++;paint([],true);return []};showPage(6);document.getElementById('todayRankingTab').click();await rankLoad();const visibleQueries=rankingQueries;document.getElementById('todayScheduleTab').click();rankFetch55.at=0;await rankLoad();const hiddenQueries=rankingQueries;
  window.readCounts={notification:0,sync:0,chat:0,rank:0};publishFollowerProfile=()=>{};
  collectionCountRead=async()=>{readCounts.notification++;return 0};fMem=async()=>{readCounts.notification++;return []};syncRefresh=async()=>{readCounts.sync++};
  renderRank=()=>{readCounts.rank++};
  const automatic=testIntervals.filter(t=>(t.ms===60000&&(/fbPoll\(\)|syncRefresh\(\)|rankVisible54\(\)/.test(t.fn.toString())||t.fn.name==='poll'))||t.ms===4000);
  lastReadActivity=Date.now()-3600000;
  for(let minute=0;minute<60;minute++){for(const timer of automatic)await timer.fn();}
  const idle={...readCounts};document.dispatchEvent(new Event('pointerdown'));await new Promise(r=>setTimeout(r,0));
  const resumed={...readCounts};return {idle,resumed,timers:automatic.length,visibleQueries,hiddenQueries};
 });
 assert.equal(result.visibleQueries,1);assert.equal(result.hiddenQueries,1);assert(result.timers>=4);assert.deepEqual(result.idle,{notification:0,sync:0,chat:0,rank:0});assert.equal(result.resumed.notification,1);assert.equal(result.resumed.sync,1);assert.equal(result.resumed.chat,0);assert.equal(result.resumed.rank,1);assert.deepEqual(errors,[]);
 console.log('PASS real page automatic timer callbacks: no idle reads across 60 simulated ticks; one interaction resumes notifications, sync, chat and ranking; no browser errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
