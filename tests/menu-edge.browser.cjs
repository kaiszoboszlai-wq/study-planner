const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});try{
 const page=await browser.newPage({viewport:{width:714,height:668}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('study-planner-appearance-v1',JSON.stringify({theme:'black'})));
 await page.route('**/*',require('./serve-local.cjs'));await page.goto('http://localhost:8000');await page.locator('#splash').waitFor({state:'hidden'});await page.evaluate(()=>showPage(6));
 assert.equal(await page.locator('#today .today-view-tabs').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
 await page.locator('#accountMenuOpen96').click();await page.waitForTimeout(400);
 const panel=page.locator('.account-menu-panel97'),close=page.locator('#accountMenuClose97'),avatar=page.locator('#accountProfileOpen109');
 assert.equal(await panel.evaluate(e=>getComputedStyle(e).borderStyle),'none');
 assert.equal(await page.locator('.account-summary109').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
 for(const selector of ['#accountProfileOpen109','#profileShare64','#profileEdit63','#appSyncPanel','#appSyncButton','#onboardingOpen120'])assert.equal(await page.locator(selector).evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)',selector);
 assert.equal(await page.locator('#myGoal62').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(37, 37, 40)');
 await page.keyboard.press('Tab');assert.equal(await avatar.evaluate(e=>getComputedStyle(e).outlineColor),'rgb(245, 245, 247)');
 await page.keyboard.press('Shift+Tab');assert.equal(await close.evaluate(e=>getComputedStyle(e).outlineColor),'rgb(245, 245, 247)');
 await page.evaluate(()=>AppAppearance75.applyChrome('sky'));assert.equal(await panel.evaluate(e=>getComputedStyle(e).borderStyle),'none');
 assert.notEqual(await page.locator('#today .today-view-tabs').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
 assert.deepEqual(errors,[]);
 console.log('PASS black account surfaces, neutral keyboard focus, matching today tabs, light theme');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
