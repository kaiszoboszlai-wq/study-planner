const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});try{
 const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('study-planner-appearance-v1',JSON.stringify({theme:'black'})));
 await page.route('**/*',require('./serve-local.cjs'));await page.goto('http://localhost:8000');await page.locator('#splash').waitFor({state:'hidden'});
 const background=selector=>page.locator(selector).evaluate(e=>getComputedStyle(e).backgroundColor);
 await page.evaluate(()=>showPage(3));assert.equal(await background('#planbox>.plan-heading'),'rgb(0, 0, 0)');await page.waitForTimeout(450);
 await page.evaluate(()=>showPage(8));assert.equal(await background('#longTermPlanner>.lt-view-tabs'),'rgb(0, 0, 0)');await page.waitForTimeout(450);
 await page.evaluate(()=>openInbox());assert.equal(await background('#dmm>.tmbox'),'rgb(0, 0, 0)');await page.waitForTimeout(450);
 await page.evaluate(()=>AppAppearance75.applyChrome('sky'));
 for(const selector of ['#planbox>.plan-heading','#longTermPlanner>.lt-view-tabs','#dmm>.tmbox'])assert.notEqual(await background(selector),'rgb(0, 0, 0)',selector);
 assert.deepEqual(errors,[]);console.log('PASS black weekly, learning plan and notification headers with light theme isolation');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
