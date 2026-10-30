const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 let cloud=null;const contexts=[],pages=[],errors=[];
 for(let i=0;i<2;i++){const ctx=await browser.newContext();contexts.push(ctx);const p=await ctx.newPage();pages.push(p);p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',require('./serve-local.cjs'));await p.exposeFunction('testCloudRead',()=>cloud);await p.exposeFunction('testCloudWrite',data=>{cloud=data});await p.goto('http://localhost:8000');await p.waitForTimeout(2600);
 await p.evaluate(()=>{leaveFlow40(true);deferFlow40(true);state=JSON.parse(initialState);state.goal='同期テスト';dataOwner=FB.uid='same-user';FB.syncReady=true;FB.code='';fbSchedule=()=>{};publishFollowerProfile=()=>{};fGet=()=>testCloudRead();fSet=(_path,data)=>testCloudWrite(data);syncSig=syncData();rememberSyncBase(syncSig);lastData=syncSig;showPage(8);});}
 cloud=await pages[0].evaluate(()=>({data:syncData(),dataAt:1}));
 await pages[0].evaluate(async()=>{state.plan=[{date:'2030-01-01',h:1,blocks:[{id:'phone-math',name:'数学',h:1}]}];state.longTermPlan={version:1,goal:{declaration:'別端末から届く目標',start:'2026-10-01',end:'2030-01-01',exam:'2030-01-01'},blocks:[]};save();await syncPull();});
 const sent=cloud;assert(JSON.parse(sent.data).plan[0].blocks.length===1);
 await pages[1].evaluate(async()=>{state.dataAt=Date.now()+86400000;await syncRefresh();});
 assert.equal(await pages[1].evaluate(()=>state.plan[0].blocks[0].id),'phone-math');assert.match(await pages[1].locator('.lt-goal').innerText(),/別端末から届く目標/);
 // Independent book/plan edits are merged and the result must be scheduled for upload.
 await pages[1].evaluate(()=>{state.longTermPlan.blocks.push({id:'pc-book',title:'数学の教材',subject:'数学',start:'2027-01-01',end:'2027-02-01'});save();clearTimeout(syncTimer);syncTimer=null;});
 await pages[0].evaluate(async()=>{state.longTermPlan.goal.declaration='スマホで更新した目標';save();await syncPull();});
 await pages[1].evaluate(()=>syncPull());assert(await pages[1].evaluate(()=>state.longTermPlan.blocks.some(b=>b.id==='pc-book')));assert(await pages[1].evaluate(()=>saveHealth.pending&&syncTimer!==null));
 await pages[1].evaluate(()=>syncPull());await pages[0].evaluate(()=>syncPull());assert(await pages[0].evaluate(()=>state.longTermPlan.blocks.some(b=>b.id==='pc-book')));
 // A device without a baseline may already have a local goal and a later clock.
 // It must fetch the existing library rather than upload its empty library.
 const photo=await pages[0].evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=20;const ctx=c.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,20,20);return c.toDataURL('image/jpeg');});
 await pages[0].evaluate(async photo=>{state.bookRoutes=[{id:'route-photo',name:'写真付き教材',books:[{id:'book-photo',title:'手持ちの教材',subject:'数学',customCover:photo}]}];state.longTermPlan.blocks=[{id:'block-photo',routeId:'route-photo',bookId:'book-photo',title:'手持ちの教材',subject:'数学',start:'2027-01-01',end:'2027-02-01'}];save();await syncPull();},photo);
 const photoSnapshot=structuredClone(cloud);
 await pages[1].evaluate(async()=>{state=JSON.parse(initialState);state.goal='この端末の目標';state.dataAt=Date.now()+86400000;syncSig='';localStorage.removeItem(accountKey(dataOwner)+':sync-base');FB.syncReady=false;accountNeedsCloud=false;await syncStart();showPage(8);});
 assert.equal(await pages[1].evaluate(()=>state.bookRoutes?.[0]?.books?.[0]?.customCover),photo,'first sync must restore the photo even with a later local timestamp');
 assert.equal(await pages[1].evaluate(()=>state.longTermPlan.blocks[0].bookId),'book-photo');
 assert.equal(cloud.data,photoSnapshot.data,'initial read must not replace the populated cloud with empty local plans');
 assert(await pages[1].locator('#appSyncStatus').isVisible());
 assert.equal(await pages[1].locator('.lt-bar-cover img').first().getAttribute('src'),photo);
 // A legacy cloud snapshot without a weekly plan must not block all other sync.
 cloud={...photoSnapshot,data:JSON.stringify({...JSON.parse(photoSnapshot.data),plan:null,longTermPlan:{...JSON.parse(photoSnapshot.data).longTermPlan,goal:{...JSON.parse(photoSnapshot.data).longTermPlan.goal,declaration:'クラウドの更新'}}})};
 await pages[0].evaluate(()=>syncPull());
 assert.equal(await pages[0].evaluate(()=>state.longTermPlan.goal.declaration),'クラウドの更新');
 assert.equal(await pages[0].evaluate(()=>state.plan[0].blocks[0].id),'phone-math');
 await pages[0].evaluate(()=>syncPull());assert.equal(JSON.parse(cloud.data).plan[0].blocks[0].id,'phone-math');
 // Recover a library still present on this device after an old client omitted it.
 const legacy=JSON.parse(cloud.data);delete legacy.bookRoutes;delete legacy.longTermPlan;cloud={...cloud,data:JSON.stringify(legacy)};
 await pages[0].evaluate(()=>syncPull());assert.equal(await pages[0].evaluate(()=>state.bookRoutes[0].books[0].customCover),photo);
 await pages[0].evaluate(()=>syncPull());assert.equal(JSON.parse(cloud.data).bookRoutes[0].books[0].customCover,photo);
 for(const width of [360,1280]){await pages[1].setViewportSize({width,height:800});for(const tab of ['#navMy','#navRank54','#navToday']){await pages[1].locator(tab).click();const button=pages[1].locator('#appSyncButton');assert(await button.isVisible(),tab+' must expose sync');const rect=await button.boundingBox();assert(rect.x>=0&&rect.x+rect.width<=width&&rect.y>=0&&rect.y+rect.height<800,tab+' sync button must fit the viewport');}}
 await pages[1].evaluate(()=>{window.manualReadCount=0;const read=fGet;fGet=(...args)=>{manualReadCount++;return read(...args)};});
 await pages[1].locator('#appSyncButton').click();assert(await pages[1].evaluate(()=>manualReadCount>0),'visible button must actually fetch cloud data');
 assert.deepEqual(errors,[]);console.log('PASS photo sync and recovery; global sync button visible on mobile/desktop navigation and fetches cloud data');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
