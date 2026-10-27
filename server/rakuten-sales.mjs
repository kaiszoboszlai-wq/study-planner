// Live provider ranking; never publish or persist a provider response in the catalog.
const norm=s=>String(s||'').normalize('NFKC').replace(/[\s・:：+＋,，.．「」『』〈〉<>\[\]［］【】()（）!！?？\-—‐®]/g,'').toLowerCase();
const safe=(value,hosts)=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&hosts.includes(u.hostname)?u.href:null;}catch{return null;}};
export function createSalesLookup({catalog,fetcher=fetch,interval=1200}={}){
 const pending=new Map();let last=0,cooldown=0,tail=Promise.resolve();
 const queries=new Map();for(const subject of ['英語','数学','国語','物理','化学','生物','地学','日本史','世界史','地理','情報','公共','政治経済','倫理'])queries.set('entrance:'+subject,{title:subject,booksGenreId:'001002006'});
 for(const subject of ['英語','数学','国語','理科','社会'])queries.set('junior:'+subject,{title:'中学 '+subject,booksGenreId:'001002006'});
 for(const grade of ['5級','4級','3級','準2級','準2級プラス','2級','準1級','1級'])queries.set('eiken:'+grade,{title:'英検 '+grade});
 queries.set('toeic:英語',{title:'TOEIC'});for(const exam of ['ITパスポート','基本情報技術者','応用情報技術者','日商簿記3級','日商簿記2級','FP3級','FP2級','宅建','行政書士','社会保険労務士','登録販売者','危険物乙4','漢検2級','漢検準2級','漢検3級','IELTS','TOEFL'])queries.set('qualification:'+exam,{title:exam});
 const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
 return async(request,env={})=>{
  if(request.method!=='GET')return json({books:[],available:false},405);
  const u=new URL(request.url),origin=env.RAKUTEN_APP_ORIGIN;
  if(!env.RAKUTEN_APPLICATION_ID||!env.RAKUTEN_ACCESS_KEY||!env.RAKUTEN_AFFILIATE_ID||!['public','private-approved'].includes(env.RAKUTEN_USE_CONTEXT))return json({books:[],available:false});
  if(u.origin!==origin||(request.headers.get('Origin')&&request.headers.get('Origin')!==origin)||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({books:[],available:false},403);
  const key=u.searchParams.get('scope'),query=queries.get(key);if(!query)return json({books:[],available:false},400);
  if(Date.now()<cooldown)return json({books:[],available:false},429);
  if(!pending.has(key)){
   if(pending.size>=2)return json({books:[],available:false},429);
   const job=tail.then(async()=>{
    if(Date.now()<cooldown)return {books:[],available:false};
    const books=[];let available=false;
    for(let page=1;page<=3;page++){
     await new Promise(r=>setTimeout(r,Math.max(0,last+interval-Date.now())));last=Date.now();
     const url=new URL('https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404');url.search=new URLSearchParams({...query,applicationId:env.RAKUTEN_APPLICATION_ID,affiliateId:env.RAKUTEN_AFFILIATE_ID,sort:'sales',outOfStockFlag:'0',format:'json',formatVersion:'2',hits:'30',page:String(page),elements:'isbn,title,subTitle,largeImageUrl,itemUrl,affiliateUrl,pageCount'});
     try{
      const response=await fetcher(url.href,{headers:{accessKey:env.RAKUTEN_ACCESS_KEY,Origin:origin,Referer:origin+'/'},signal:AbortSignal.timeout(5000),redirect:'error'});
      if(!response.ok){if([401,403,429,503].includes(response.status))cooldown=Date.now()+60000;break;}
      const data=await response.json(),items=data.Items||data.items||[];available=true;
      for(let index=0;index<items.length;index++){
       const raw=items[index],item=raw.Item||raw.item||raw,known=catalog?.[String(item.isbn)];if(!known)continue;
       const labels=[norm(item.title),norm([item.title,item.subTitle].filter(Boolean).join(' '))];if(!known.some(t=>labels.includes(norm(t))||labels.includes(norm(t.split(/[:：]/)[0]))))continue;
       const product=safe(item.itemUrl,['books.rakuten.co.jp']),link=safe(item.affiliateUrl,['hb.afl.rakuten.co.jp']),cover=safe(item.largeImageUrl,['thumbnail.image.rakuten.co.jp','image.books.rakuten.co.jp']);
       if(!product||!/^https:\/\/books\.rakuten\.co\.jp\/rb\/\d+\/?(?:\?.*)?$/.test(product)||!link||!new URL(link).pathname.startsWith('/hgc/'))continue;
       if(!books.some(b=>b.isbn===String(item.isbn)))books.push({isbn:String(item.isbn),title:item.title,rank:(page-1)*30+index+1,cover:cover||'',url:link});
      }
      if(!items.length||page>=Number(data.pageCount||1))break;
     }catch{break;}
    }
    return {books,available,scope:key,checkedAt:new Date().toISOString(),sourceLabel:'楽天ブックス・検索条件内の売れている順（全国の販売順位ではありません）'};
   });pending.set(key,job);tail=job.then(()=>{},()=>{});job.finally(()=>pending.delete(key));
  }
  return json(await pending.get(key));
 };
}
