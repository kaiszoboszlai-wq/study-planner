(function(){
'use strict';
let capability, queue=Promise.resolve(), nextAt=0;
const inflight=new Map(),recent=new Map();
async function get(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);try{const response=await fetch(url,{cache:'no-store',signal:controller.signal});if(!response.ok)return null;return await response.json();}catch{return null;}finally{clearTimeout(timer);}}
function enabled(){if(!capability)capability=get('/api/rakuten-books?capabilities=1').then(data=>data?.enabled===true);return capability;}
function allowed(value,hosts){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&hosts.includes(u.hostname);}catch{return false;}}
function lookup(isbn,active){
 const cached=recent.get(isbn);if(cached&&cached.until>Date.now())return Promise.resolve(cached.book);if(cached)recent.delete(isbn);
 if(inflight.has(isbn)){const pending=inflight.get(isbn);return pending.work.then(result=>result||(!pending.active()&&active()?lookup(isbn,active):null));}
 const work=queue.then(async()=>{if(!active()||!await enabled())return null;await new Promise(resolve=>setTimeout(resolve,Math.max(0,nextAt-Date.now())));if(!active())return null;nextAt=Date.now()+1200;const result=await get('/api/rakuten-books?isbn='+encodeURIComponent(isbn)),book=result?.book;
 if(!book||book.isbn!==isbn||!allowed(book.cover,['thumbnail.image.rakuten.co.jp','image.books.rakuten.co.jp'])||!allowed(book.url,['hb.afl.rakuten.co.jp'])||!/^\/hgc\//.test(new URL(book.url).pathname))return null;recent.set(isbn,{book,until:Date.now()+60000});return book;});
 queue=work.then(()=>{},()=>{});inflight.set(isbn,{work,active});work.finally(()=>inflight.delete(isbn));return work;
}
window.RakutenCovers={async show(book,{active,img,figure,info,caption,fallback}){
 const provided=book.rakutenSales;const result=provided&&provided.isbn===book.isbn&&allowed(provided.url,['hb.afl.rakuten.co.jp'])&&/^\/hgc\//.test(new URL(provided.url).pathname)&&(!provided.cover||allowed(provided.cover,['thumbnail.image.rakuten.co.jp','image.books.rakuten.co.jp']))?provided:await lookup(book.isbn,active);if(!result||!active())return;
 // Keep the API-used book area free of links to other retailers/providers.
 const links=[...(info?.querySelectorAll(':scope > a')||[])],hidden=links.map(link=>link.hidden);
 function restore(){if(book.rakutenSales){fallback();caption.hidden=false;return;}links.forEach((link,i)=>{link.hidden=hidden[i];});fallback();}
 links.forEach(link=>{link.hidden=true;});
 caption.replaceChildren();const product=document.createElement('a');product.href=result.url;product.textContent='楽天ブックスで見る';product.target='_blank';product.rel='noopener noreferrer';caption.append(product,document.createElement('br'));
 // Rakuten's required attribution snippet, unchanged.
 const credit=document.createElement('span');credit.innerHTML='<!-- Rakuten Web Services Attribution Snippet FROM HERE -->\n<a href="https://developers.rakuten.com/" target="_blank">Supported by Rakuten Developers</a>\n<!-- Rakuten Web Services Attribution Snippet TO HERE -->';caption.append(credit);
 if(!result.cover){fallback();caption.hidden=false;return;}img.onerror=restore;img.src=result.cover;img.alt=book.title+'の表紙';figure.dataset.coverKind='rakuten';caption.hidden=false;
}};
})();
