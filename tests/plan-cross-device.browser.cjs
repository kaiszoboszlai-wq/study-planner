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
 assert(await pages[1].locator('#appSyncStatus').count());
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
 for(const width of [360,1280]){await pages[1].setViewportSize({width,height:800});await pages[1].locator('#navMy').click();const button=pages[1].locator('.my-account62 #appSyncButton');await button.scrollIntoViewIfNeeded();assert(await button.isVisible());const rect=await button.boundingBox();assert(rect.x>=0&&rect.x+rect.width<=width);for(const tab of ['#navRank54','#navToday']){await pages[1].locator(tab).click();assert.equal(await pages[1].locator('#appSyncButton').isVisible(),false);}}
 await pages[1].locator('#navMy').click();
 await pages[1].evaluate(()=>{window.manualReadCount=0;const read=fGet;fGet=(...args)=>{manualReadCount++;return read(...args)};});
 await pages[1].locator('#appSyncButton').click();assert(await pages[1].evaluate(()=>manualReadCount>0),'visible button must actually fetch cloud data');
 // Reproduce Firestore's document limit with real JPEGs, not placeholder strings.
 const large=await pages[0].evaluate(async()=>{const c=document.createElement('canvas');c.width=600;c.height=800;const ctx=c.getContext('2d'),pixels=ctx.createImageData(600,800);let seed=7;for(let i=0;i<pixels.data.length;i+=4){for(let j=0;j<3;j++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;pixels.data[i+j]=seed>>>24;}pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);const photo=c.toDataURL('image/jpeg',.95);state.bookRoutes[0].books=Array.from({length:4},(_,i)=>({id:'large-'+i,title:'写真付き教材'+i,subject:'数学',customCover:photo}));save();clearTimeout(syncTimer);const before=new TextEncoder().encode(syncData()).length;await syncPull();return {before,after:new TextEncoder().encode(syncData()).length,error:saveHealth.cloudError?.message,original:photo};});
 assert(large.before>1048576);assert(large.after<900000,large.error);assert.equal(new TextEncoder().encode(cloud.data).length,large.after);
 assert(await pages[0].evaluate(async original=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('studyplanner-account-storage-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{const rows=await new Promise((resolve,reject)=>{const r=db.transaction('backups').objectStore('backups').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return rows.some(r=>r.sourceKey.endsWith(':original-photos')&&JSON.parse(r.json).bookRoutes[0].books[0].customCover===original);}finally{db.close()}},large.original),'original photo must be durably backed up');
 await pages[1].evaluate(()=>syncPull());assert.equal(await pages[1].evaluate(()=>state.bookRoutes[0].books.length),4);const compressed=cloud.data;await pages[0].evaluate(()=>syncPull());assert.equal(cloud.data,compressed);
 // Failed original-photo backup must prevent upload and leave the source unchanged.
 await pages[0].evaluate(async original=>{state.bookRoutes[0].books.forEach(b=>b.customCover=original);const before=syncData(),backup=AccountStorage88.backupDurable;AccountStorage88.backupDurable=async()=>{throw new Error('backup unavailable')};await syncPush();AccountStorage88.backupDurable=backup;if(syncData()!==before)throw new Error('original modified on backup failure');},large.original);assert.equal(cloud.data,compressed);
 console.log('Photo payload bytes:',large.before,'->',large.after);
 assert.deepEqual(errors,[]);console.log('PASS photo compression, durable originals, second-device sync, backup failure protection, account sync card and button');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
