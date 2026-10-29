// Local regressions only: no Firebase or production requests are allowed.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const serve=require('./serve-local.cjs'),ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,timezoneId:'Asia/Tokyo'}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',serve);await p.goto('http://localhost:8000');await p.waitForTimeout(2700);
 await p.locator('#flowBody40 input[type=text]').fill('第一志望校に合格する');
 await p.evaluate(()=>{FB.uid=null;return fbOnAuth()});
 assert.equal(await p.locator('#flowBody40 input').inputValue(),'第一志望校に合格する');
 await p.locator('#flowNext40').click();assert.equal(await p.evaluate(()=>weeklyFlow40.key),'exam');assert(await p.locator('#weeklyFlow40').isVisible());assert(await p.locator('#flowTitle40').isVisible());
 const exam=await p.evaluate(()=>fmtDate(new Date(Date.now()+90*86400000)));await p.locator('#flowBody40 input[type=date]').fill(exam);await p.locator('#flowNext40').click();
 for(const key of ['weekday','weekend','subjects','allocation']){assert.equal(await p.evaluate(()=>weeklyFlow40.key),key);assert(await p.locator('#flowTitle40').isVisible());await p.locator('#flowNext40').click();}
 assert.equal(await p.evaluate(()=>weeklyFlow40.key),'carry');await p.locator('#flowNext40').click();assert.equal(await p.evaluate(()=>weeklyFlow40.key),'plan');await p.locator('#flowNext40').click();await p.waitForFunction(()=>state.plan?.length>0&&!weeklyFlow40);assert(await p.locator('#planbox').isVisible());assert.equal(await p.evaluate(()=>state.goal),'第一志望校に合格する');
 await p.evaluate(()=>{FB.uid='owner-one';switchAccountData(FB.uid);syncStart=async()=>{FB.syncReady=true};fbEnsure=restoreTimerLease=fbPublish=fbSocialSync=async()=>{};dmCheck=()=>{}});
 await p.locator('#flowBody40 input[type=text]').fill('このアカウントの目標');await p.evaluate(()=>fbOnAuth());assert.equal(await p.locator('#flowBody40 input').inputValue(),'このアカウントの目標');await p.locator('#flowNext40').click();assert.equal(await p.evaluate(()=>weeklyFlow40.key),'exam');
 await p.evaluate(()=>{FB.uid='owner-two';return fbOnAuth()});assert.equal(await p.evaluate(()=>weeklyFlow40.owner),'owner-two');assert.equal(await p.evaluate(()=>weeklyFlow40.config.goal),'');assert(await p.locator('#weeklyFlow40').isVisible());assert.deepEqual(errors,[]);await ctx.close();
 console.log('PASS fresh mobile guest: initial signed-out auth callback preserves goal and all setup steps and preview reach the created plan');
 const black=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,colorScheme:'light'}),q=await black.newPage();let release;const gate=new Promise(r=>release=r);
 q.on('pageerror',e=>errors.push(e.message));await q.addInitScript(()=>localStorage.setItem('study-planner-appearance-v1',JSON.stringify({theme:'black'})));
 await q.route('**/*',async r=>{if(new URL(r.request().url()).pathname==='/assets/step-indicator.js')await gate;return serve(r)});
 await q.goto('http://localhost:8000',{waitUntil:'commit'});await q.waitForFunction(()=>!!window.AppAppearance75);
 assert.equal(await q.locator('meta[name=theme-color]').getAttribute('content'),'#090909');assert.equal(await q.locator('meta[name=apple-mobile-web-app-status-bar-style]').getAttribute('content'),'black-translucent');assert.equal(await q.locator('html').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(9, 9, 9)');assert.equal(await q.locator('html').evaluate(e=>getComputedStyle(e).colorScheme),'dark');
 release();await q.waitForLoadState('load');await q.waitForTimeout(2700);await q.locator('#flowLater40').click();
 assert.equal(await q.locator('#appScrollHeader68').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(9, 9, 9)');
 const manifest=await q.evaluate(()=>JSON.parse(decodeURIComponent(document.getElementById('appManifest').href.split(',')[1])));assert.equal(manifest.theme_color,'#090909');assert.equal(manifest.background_color,'#090909');
 await q.evaluate(()=>document.querySelector('.theme-choice[data-app-theme=sky]').click());assert.equal(await q.locator('meta[name=color-scheme]').getAttribute('content'),'light');assert.equal(await q.locator('meta[name=apple-mobile-web-app-status-bar-style]').getAttribute('content'),'default');
 await q.evaluate(()=>document.querySelector('.theme-choice[data-app-theme=black]').click());await q.reload();assert.equal(await q.locator('meta[name=theme-color]').getAttribute('content'),'#090909');assert.equal(await q.locator('#appScrollHeader68').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(9, 9, 9)');assert.deepEqual(errors,[]);
 console.log('PASS saved black theme applies before blocking assets, header/status/manifest stay black on reload, switching to light resets chrome');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
