import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRakutenBooks} from '../server/rakuten-books.mjs';

const isbn='9784010347478', title='英単語ターゲット1200';
const env={RAKUTEN_APPLICATION_ID:'test-app-id',RAKUTEN_ACCESS_KEY:'test-secret',RAKUTEN_AFFILIATE_ID:'test-affiliate',RAKUTEN_APP_ORIGIN:'https://app.example',RAKUTEN_USE_CONTEXT:'public'};
const item={isbn,title,largeImageUrl:'https://thumbnail.image.rakuten.co.jp/example.jpg',itemUrl:'https://books.rakuten.co.jp/rb/12345/',affiliateUrl:'https://hb.afl.rakuten.co.jp/hgc/test/?pc=https%3A%2F%2Fbooks.rakuten.co.jp%2Frb%2F12345%2F'};
const request=(query='isbn='+isbn,options={})=>new Request('https://app.example/api/rakuten-books?'+query,options);
const make=(fetcher,extra={})=>createRakutenBooks({catalog:{[isbn]:[title]},fetcher,interval:0,...extra});
test('unconfigured/private preview makes no upstream calls or credential disclosures',async()=>{
 const handle=make(()=>{throw Error('must not call');});
 for(const settings of [{},{...env,RAKUTEN_USE_CONTEXT:''},{...env,RAKUTEN_ACCESS_KEY:''}]) {
  assert.deepEqual(await (await handle(request('capabilities=1'),settings)).json(),{enabled:false});
  assert.equal((await (await handle(request(),settings)).json()).book,null);
 }
});
test('exact registered ISBN uses current endpoint and accessKey header; response is minimal/no-store',async()=>{
 const handle=make(async(url,options)=>{
  const u=new URL(url);assert.equal(u.origin,'https://openapi.rakuten.co.jp');assert.equal(u.searchParams.get('applicationId'),env.RAKUTEN_APPLICATION_ID);assert.equal(u.searchParams.get('accessKey'),null);assert.equal(options.headers.accessKey,env.RAKUTEN_ACCESS_KEY);assert.equal(options.headers.Origin,env.RAKUTEN_APP_ORIGIN);assert.equal(options.headers.Referer,env.RAKUTEN_APP_ORIGIN+'/');assert.equal(options.redirect,'error');
  return Response.json({Items:[item]});
 });
 const response=await handle(request(),env),body=await response.text();
 assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(JSON.parse(body).book.isbn,isbn);assert.ok(!body.includes('test-secret'));assert.ok(!body.includes('test-app-id'));
});
test('invalid/unknown ISBN, cross-site calls and wrong methods never reach upstream',async()=>{
 let calls=0;const handle=make(async()=>{calls++;return Response.json({Items:[item]});});
 for(const r of [request('isbn=9784010347479'),request('isbn=9784010347478',{headers:{Origin:'https://evil.example'}}),request('isbn=9784010347478',{headers:{'Sec-Fetch-Site':'cross-site'}}),request('isbn='+isbn,{method:'POST'}),request('isbn=9784000000000')]) await handle(r,env);
 assert.equal(calls,0);
});
test('mismatched edition/title, unsafe image and product URLs fail closed',async()=>{
 for(const change of [{isbn:'9784010347479'},{title:'別の版'},{largeImageUrl:'https://evil.example/x.jpg'},{largeImageUrl:'https://u:p@thumbnail.image.rakuten.co.jp/x.jpg'},{itemUrl:'https://books.rakuten.co.jp/redirect?url=evil'},{itemUrl:'https://books.rakuten.co.jp.evil.example/rb/1/'},{affiliateUrl:''},{affiliateUrl:'https://evil.example/hgc/test'}]) {
  const handle=make(async()=>Response.json({items:[{...item,...change}]}));assert.equal((await (await handle(request(),env)).json()).book,null);
 }
});
test('duplicates coalesce; other books are throttled; upstream 429 creates cooldown',async()=>{
 let resolve,calls=0,time=0;const handle=make(async()=>{calls++;await new Promise(r=>resolve=r);return Response.json({Items:[item]});},{now:()=>time});
 const a=handle(request(),env),b=handle(request(),env);assert.equal(calls,1);resolve();assert.deepEqual(await (await a).json(),await (await b).json());
 let limitedCalls=0;const limited=make(async()=>{limitedCalls++;return new Response('',{status:429,headers:{'Retry-After':'120'}});},{now:()=>time});
 await limited(request(),env);assert.equal((await limited(request(),env)).status,429);assert.equal(limitedCalls,1);
 time=121000;await limited(request(),env);assert.equal(limitedCalls,2);
});
test('upstream exceptions are contained and do not leak credentials',async()=>{
 const handle=make(async()=>{throw Error('test-secret');});const response=await handle(request(),env);assert.deepEqual(await response.json(),{book:null});
});
