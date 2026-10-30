const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',require('./serve-local.cjs'));await page.goto('http://localhost:8000');await page.waitForTimeout(2600);
 await page.evaluate(async()=>{leaveFlow40(true);deferFlow40(true);FB.uid='me';window.testReads=[];fGet=async p=>{testReads.push(p);return null};collectionCountRead=async p=>{testReads.push(p);return 0};publishFollowerProfile=()=>{};profileRead=async p=>{testReads.push(p);return null};fillReq=async()=>{};AppAnnouncements86.unread=()=>0;rankRows=async paint=>{const rows=[{uid:'me',me:true,name:'自分',s:100},{uid:'other',name:'相手',s:200}];paint(rows,true);return rows};showPage(6);document.getElementById('todayRankingTab').click();await rankLoad();});
 assert.equal(await page.locator('.rkrow').count(),2);assert.equal(await page.locator('.rcm,#pxm,#dmSend,#dmIn,[data-t=dm]').count(),0);
 assert(await page.evaluate(()=>typeof openChat==='undefined'&&typeof dmSend==='undefined'&&typeof openPost==='undefined'&&typeof pxSend==='undefined'));
 await page.evaluate(()=>openInbox());assert.equal(await page.locator('#dmm').isVisible(),true);assert.equal(await page.locator('#inboxTabs button').count(),1);assert.match(await page.locator('#dmT').innerText(),/通知/);
 await page.evaluate(()=>{document.getElementById('dmm').hidden=true;openProfile('other');});await page.waitForTimeout(50);assert.equal(await page.locator('#pmBody button').filter({hasText:'メッセージ'}).count(),0);
 const reads=await page.evaluate(()=>testReads);assert(!reads.some(p=>p.startsWith('dm/')||p==='dm'||p.includes('/comments')));assert.deepEqual(errors,[]);
 console.log('PASS startup, ranking, profile, request-only notifications; no DM/comment controls, entry points or reads; no browser errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
