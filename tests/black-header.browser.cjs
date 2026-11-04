const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});try{
 const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('study-planner-appearance-v1',JSON.stringify({theme:'black'})));
 await page.route('**/*',require('./serve-local.cjs'));await page.goto('http://localhost:8000');await page.locator('#splash').waitFor({state:'hidden'});await page.evaluate(()=>showPage(6));
 const bg=async selector=>page.locator(selector).evaluate(e=>getComputedStyle(e).backgroundColor);
 assert.equal(await bg('#appScrollHeader68'),'rgb(0, 0, 0)');
 assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),'#000000');
 assert.equal(await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content'),'black-translucent');
 assert.equal(await page.locator('#appScrollHeader68 .plane').evaluate(e=>getComputedStyle(e).color),'rgb(245, 245, 247)');
 await page.locator('#accountMenuOpen96').click();await page.waitForTimeout(400);
 assert.equal(await bg('.account-menu-panel97'),'rgb(0, 0, 0)');
 await page.locator('#accountProfileOpen109').click();await page.waitForTimeout(350);
 assert.equal(await bg('#accountMenu96.is-profile109 #mypage'),'rgb(0, 0, 0)');
 await page.evaluate(()=>AppAppearance75.applyChrome('sky'));
 assert.notEqual(await bg('#appScrollHeader68'),'rgb(0, 0, 0)');
 assert.deepEqual(errors,[]);console.log('PASS black header, status meta, account surfaces, light-theme isolation');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
