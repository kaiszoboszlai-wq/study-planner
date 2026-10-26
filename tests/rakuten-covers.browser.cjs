const {chromium}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  for(const mode of ['success','disabled','wrong-isbn','bad-host','broken-image','stale']) {
   const page=await browser.newPage({viewport:{width:390,height:844}});let calls=0;
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname==='/api/rakuten-books') {
     if(url.searchParams.has('capabilities'))return route.fulfill({json:{enabled:mode!=='disabled'}});
     calls++;return route.fulfill({json:{book:{isbn:mode==='wrong-isbn'?'9784010347479':'9784010347478',cover:mode==='bad-host'?'https://evil.example/cover.jpg':'https://thumbnail.image.rakuten.co.jp/test.png',url:'https://hb.afl.rakuten.co.jp/hgc/test/',title:'英単語ターゲット1200'}}});
    }
    if(url.hostname==='thumbnail.image.rakuten.co.jp')return mode==='broken-image'?route.abort():route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN9sAAAAASUVORK5CYII=','base64')});
    return route.fulfill({contentType:'text/html',body:'<html><body></body></html>'});
   });
   await page.goto('http://localhost:8000/');await page.addScriptTag({content:fs.readFileSync('assets/rakuten-covers.js','utf8')});
   await page.evaluate(async(mode)=>{
    document.body.innerHTML='<li id="book"><figure><img></figure><div class="route-book-info"><a href="https://ndlsearch.ndl.go.jp/">書籍情報</a><p></p></div></li>';
    const item=document.querySelector('#book'),figure=item.querySelector('figure'),img=item.querySelector('img'),info=item.querySelector('div'),caption=info.querySelector('p');
    window.fallback=()=>{caption.hidden=true;figure.dataset.coverKind='illustration';};window.fallback();
    await RakutenCovers.show({isbn:'9784010347478',title:'英単語ターゲット1200'},{active:()=>mode!=='stale',img,figure,info,caption,fallback:window.fallback});
   },mode);
   await page.waitForTimeout(100);
   const state=await page.evaluate(()=>({kind:document.querySelector('figure').dataset.coverKind,hidden:document.querySelector('.route-book-info > a').hidden,text:document.querySelector('p').textContent,credit:document.querySelector('p a[href="https://developers.rakuten.com/"]')?.getAttribute('target')}));
   if(mode==='success'){assert.equal(state.kind,'rakuten');assert.equal(state.hidden,true);assert.equal(state.credit,'_blank');assert.match(state.text,/Supported by Rakuten Developers/);}
   else {assert.equal(state.kind,'illustration',mode);assert.equal(state.hidden,false,mode);}
   if(['disabled','stale'].includes(mode))assert.equal(calls,0);
   await page.close();
  }
  console.log('Rakuten cover success, disabled, mismatch, unsafe URL, image failure, stale view passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
