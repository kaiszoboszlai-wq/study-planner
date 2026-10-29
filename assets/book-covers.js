(function(){
'use strict';
const PLACEHOLDER='assets/book-cover-placeholder.svg',checks=new Map(),recentImages=new Map();let files;
const normalize=s=>String(s||'').replace(/\([Rr]\)|®/g,'').normalize('NFKC').replace(/[\s・:：+＋,，.．「」『』〈〉<>\[\]［］【】()（）!！?？\-—‐]/g,'').toLowerCase();
function validISBN(value){return /^97[89]\d{10}$/.test(value)&&[...value].reduce((sum,c,i)=>sum+Number(c)*(i%2?3:1),0)%10===0;}
function official(value){try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='cover.openbd.jp'&&!url.username&&!url.password&&!url.port;}catch{return false;}}
function matches(book,title,volume=''){const titles=[normalize(title),normalize(title+' '+volume)];return [book.title,book.sourceTitle].filter(Boolean).flatMap(t=>[t,t.split(/[:：]/)[0]]).some(t=>titles.includes(normalize(t)));}
function load(){if(!files)files=Promise.all([fetch('assets/book-covers.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null),fetch('assets/book-cover-denylist.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null)]).catch(()=>[null,null]);return files;}
function current(book){const key=book.isbn+'|'+normalize(book.title);if(!checks.has(key)){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);checks.set(key,fetch('https://api.openbd.jp/v1/get?isbn='+book.isbn,{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('unavailable');const data=await r.json(),s=data?.[0]?.summary;return s&&s.isbn===book.isbn&&matches(book,s.title,s.volume)&&official(s.cover)?s.cover:null;}).finally(()=>clearTimeout(timer)));}return checks.get(key);}
function attach(book,item,options={}){
 const links=options.links!==false;
 const owner=dataOwner,epoch=authEpoch,figure=document.createElement('figure');figure.className='route-cover73';
 const img=document.createElement('img');img.width=90;img.height=124;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
 const info=item.querySelector('.route-book-info'),caption=document.createElement(info?'p':'figcaption');caption.className='route-book-meta route-cover-credit73';caption.hidden=true;const attribution=document.createElement(links?'a':'span');if(links){attribution.href='https://openbd.jp/';attribution.target='_blank';attribution.rel='noopener noreferrer';}attribution.textContent='書影提供：openBD';caption.append(attribution);figure.append(img);if(info)info.append(caption);else figure.append(caption);
 const heading=item.querySelector('.route-book-heading');if(info)item.insertBefore(figure,info);else if(heading)heading.after(figure);else item.append(figure);
 function active(){return owner===dataOwner&&epoch===authEpoch&&item.isConnected;}
 const imageKey=(book.isbn||'')+'|'+normalize(book.title)+(links?'':'|plain');img.onload=()=>{if(active()&&['licensed','rakuten'].includes(figure.dataset.coverKind))recentImages.set(imageKey,{src:img.src,kind:figure.dataset.coverKind,alt:img.alt,caption:Array.from(caption.childNodes).map(n=>n.cloneNode(true)),captionHidden:caption.hidden,until:Date.now()+60000});};
 function fallback(){img.onerror=null;img.src=PLACEHOLDER;img.alt=book.title+'の本のイラスト';figure.dataset.coverKind='illustration';caption.hidden=true;}
 let requestedRakuten=false;
 function rakuten(){if(requestedRakuten||!active()||!window.RakutenCovers)return;requestedRakuten=true;window.RakutenCovers.show(book,{active,img,figure,info,caption,fallback,links}).catch(()=>{});}
 function show(src){if(!active())return;img.onerror=()=>{fallback();rakuten();};img.src=src;img.alt=book.title+'の表紙';figure.dataset.coverKind='licensed';caption.hidden=false;}
 fallback();if(typeof book.customCover==='string'&&/^data:image\/(?:jpeg|png|webp);base64,/.test(book.customCover)){img.src=book.customCover;img.alt=book.title+'の写真';figure.dataset.coverKind='custom';return;}if(!validISBN(book.isbn||''))return;const cached=recentImages.get(imageKey);if(cached&&cached.until>Date.now()){img.src=cached.src;img.alt=cached.alt;figure.dataset.coverKind=cached.kind;caption.replaceChildren(...cached.caption.map(n=>n.cloneNode(true)));caption.hidden=cached.captionHidden;img.onerror=()=>{recentImages.delete(imageKey);fallback();rakuten();};}else if(cached)recentImages.delete(imageKey);
 (async()=>{const [manifest,denied]=await load();if(!active()||!Array.isArray(denied)||denied.includes(book.isbn))return;if(book.rakutenSales){rakuten();return;}const entry=manifest?.entries?.[book.isbn],localPath=entry&&new RegExp('^assets/book-covers/'+book.isbn+'\\.(jpg|png|gif|webp)$').test(entry.path),valid=entry&&entry.isbn===book.isbn&&Date.parse(entry.validUntil)>Date.now()&&entry.catalogTitles?.includes(book.title)&&localPath;
  if(entry?.provider==='TAC'){
   const policy=entry.terms==='https://www.tac-school.co.jp/copyright/permission.html'&&/^https:\/\/bookstore\.tac-school\.co\.jp\/book\/detail\/\d{6}$/.test(entry.productUrl||'')&&/^https:\/\/bookstore\.tac-school\.co\.jp\/storage\/common\/images\/cover\/\d+\/\d+\.(jpg|png|webp)$/.test(entry.source||'');
   if(valid&&policy){if(links)attribution.href=entry.productUrl;attribution.textContent='TAC公式書籍情報';show(entry.path);}else rakuten();return;
  }
  const fresh=valid&&entry.provider==='openBD'&&official(entry.source);
  if(fresh)show(entry.path);
  // A live check reflects publisher changes/removals. Valid cached images survive outages for at most seven days.
  const recent=manifest&&Date.now()-Date.parse(manifest.checkedAt)<7*86400000;
  if(!entry&&recent){rakuten();return;}
  try{const url=await current(book);if(!active())return;if(url)show(url);else{fallback();rakuten();}}catch{if(!fresh&&active()){fallback();rakuten();}}
 })().catch(()=>{if(active())fallback();});
}
window.BookCovers73={attach};
})();
