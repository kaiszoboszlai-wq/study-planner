const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const ctx=await browser.newContext(),route=require('./serve-local.cjs');await ctx.route('**/*',route);let p=await ctx.newPage();await p.goto('http://localhost:8000');await p.waitForTimeout(2600);
 await p.evaluate(()=>{
  leaveFlow40(true);deferFlow40(true);FB.uid='recovery';dataOwner='recovery';localStorage.setItem(KEY+':owner',dataOwner);const date=fmtDate(new Date());
  state.plan=[{date,blocks:[{id:'recovery-timer',name:'数学',h:2}]}];state.planDaySeen=date;state.weekSetupPending=false;
  state.log={[date]:{'数学':120}};state.contrib={'recovery-timer':[{date,name:'数学',sec:120,k:'t'}]};state.spent={'recovery-timer':120};
  state.timer={id:'recovery-timer',start:Date.now()-14000,lease:{uid:'recovery',device:timerDeviceId,tab:timerTabId,token:'recovery-token',active:true}};store();
 });
 // Crash the renderer without visibilitychange/pagehide/beforeunload flushing.
 const cdp=await ctx.newCDPSession(p);await Promise.race([cdp.send('Page.crash').catch(()=>{}),new Promise(r=>setTimeout(r,1500))]);await p.close();
 p=await ctx.newPage();await p.goto('http://localhost:8000');await p.waitForTimeout(700);
 const result=await p.evaluate(()=>({spent:state.spent['recovery-timer'],log:state.log[fmtDate(new Date())]?.['数学'],timer:state.timer}));assert.equal(result.spent,120);assert.equal(result.log,120);assert.equal(result.timer,null,'new tab must not resume another tab lease or credit downtime');
 const merged=await p.evaluate(()=>{FB.uid='recovery';const remote=JSON.parse(syncData());remote.goal='別端末で更新';remote.log={};remote.spent={};remote.contrib={};const ok=syncApply({data:JSON.stringify(remote),dataAt:Date.now()+10000});return {ok,seconds:state.log[fmtDate(new Date())]['数学']}});assert.equal(merged.ok,true);assert.equal(merged.seconds,120);
 await p.evaluate(()=>{state.timer={id:'recovery-timer',start:Date.now()-14000,lease:{uid:'recovery',device:timerDeviceId,tab:timerTabId,token:'same-tab',active:true}};store()});
 await p.reload();await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>!!state.timer),true);assert((await p.evaluate(()=>logData()[fmtDate(new Date())]['数学']))>=134,'same-tab runtime retains its start timestamp and includes reload downtime');
 console.log('PASS real renderer crash/new-tab restart: last local 120s recovered, uncheckpointed tail not falsely credited, stale timer cleared, newer cloud snapshot preserves local records');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
