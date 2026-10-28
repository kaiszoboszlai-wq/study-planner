const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',require('./serve-local.cjs'));await p.goto('http://localhost:8000');await p.waitForTimeout(2600);
 await p.evaluate(()=>{
  leaveFlow40(true);deferFlow40(true);FB.uid='owner';dataOwner='owner';window.pageReads=[];
  window.pageData=Object.fromEntries(['requests/owner/from','stats/owner/viewers','posts/owner_day/comments'].map(path=>[path,Array.from({length:105},(_,i)=>({id:String(i).padStart(4,'0'),data:{uid:'owner',at:i+1,text:'コメント'+i,profile:{grade:'高1'}}}))]));
  FB.Fs={documentId:()=> '__name__',collection:(_db,path)=>path,orderBy:field=>({field}),where:(...args)=>({where:args}),limit:n=>({limit:n}),startAfter:doc=>({after:doc.id}),query:(path,...parts)=>({path,parts}),getCountFromServer:async path=>({data:()=>({count:(pageData[path]||[]).length})}),getDocs:async q=>{const all=pageData[q.path]||[],after=q.parts.find(p=>p.after),start=after?all.findIndex(d=>d.id===after.after)+1:0,n=q.parts.find(p=>p.limit)?.limit||all.length,docs=all.slice(start,start+n).map(d=>({id:d.id,data:()=>d.data}));pageReads.push({path:q.path,docs:docs.length});return {docs,forEach:fn=>docs.forEach(fn)}}};
  myFollowIds=async()=>[];profileRead=async(path,read)=>read?read(path):{name:'利用者',grade:'高1'};fDel=async path=>{const split=path.lastIndexOf('/'),collection=path.slice(0,split);pageData[collection]=pageData[collection].filter(d=>d.id!==path.slice(split+1))};
  window.requestBox=document.createElement('div');document.body.append(requestBox);window.viewerBox=document.createElement('div');document.body.append(viewerBox);
 });
 for(const [reader,box] of [['fillReq','requestBox'],['fillVie','viewerBox']]){
  await p.evaluate(async({reader,box})=>window[reader](window[box]),{reader,box});assert.equal(await p.evaluate(box=>window[box].querySelectorAll(':scope > .fcard').length,box),50);
  await p.evaluate(async({reader,box})=>window[reader](window[box],true),{reader,box});assert.equal(await p.evaluate(box=>window[box].querySelectorAll(':scope > .fcard').length,box),100);
  await p.evaluate(async({reader,box})=>window[reader](window[box],true),{reader,box});assert.equal(await p.evaluate(box=>window[box].querySelectorAll(':scope > .fcard').length,box),105);assert.equal(await p.evaluate(box=>window[box].querySelectorAll('.collection-more').length,box),0);
 }
 await p.evaluate(()=>{window.dmProfileReads=0;fMem=async()=>Array.from({length:105},(_,i)=>({id:'chat'+i,data:{members:['owner','other'+i],updated:i,last:'メッセージ'+i,lastFrom:'other'+i}}));profileCached=()=>null;const old=profileRead;profileRead=async(path,read)=>{if(path.startsWith('profiles/other'))dmProfileReads++;return old(path,read)}});
 await p.evaluate(()=>openDmList());assert.equal(await p.locator('#dmBody .dmrow').count(),50);assert.equal(await p.evaluate(()=>dmProfileReads),50);assert.match(await p.locator('#dmBody .dmrow').first().innerText(),/メッセージ104/);
 await p.locator('#dmBody .dm-more').click();await p.waitForFunction(()=>document.querySelectorAll('#dmBody .dmrow').length===100);
 await p.locator('#dmBody .dm-more').click();await p.waitForFunction(()=>document.querySelectorAll('#dmBody .dmrow').length===105);assert.equal(await p.evaluate(()=>dmProfileReads),105);
 await p.evaluate(()=>{dmStop();document.getElementById('dmm').hidden=true});
 await p.evaluate(()=>openPost('owner_day',{n:'あなた',s:3600}));assert.equal(await p.locator('#pxC .cm').count(),50);
 await p.locator('#pxBody').getByRole('button',{name:'さらに50件表示'}).click();await p.waitForFunction(()=>document.querySelectorAll('#pxC .cm').length===100);
 await p.locator('#pxBody').getByRole('button',{name:'さらに50件表示'}).click();await p.waitForFunction(()=>document.querySelectorAll('#pxC .cm').length===105);
 await p.locator('#pxC .cm').first().getByRole('button',{name:'削除'}).click();await p.waitForFunction(()=>document.querySelectorAll('#pxC .cm').length===104);
 const reads=await p.evaluate(()=>pageReads.filter(r=>pageData[r.path]));assert(reads.every(r=>r.docs<=50));assert.deepEqual(errors,[]);
 console.log('PASS requests, viewers and comments: 50/50/5 document pages, final-page cleanup, comment deletion and no browser errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
