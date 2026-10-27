import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSalesLookup} from '../server/rakuten-sales.mjs';
const isbn='9784010347478',title='英単語ターゲット1200';
const env={RAKUTEN_APPLICATION_ID:'test-id',RAKUTEN_ACCESS_KEY:'test-key',RAKUTEN_AFFILIATE_ID:'test-aff',RAKUTEN_APP_ORIGIN:'https://app.example',RAKUTEN_USE_CONTEXT:'public'};
const item={isbn,title,itemUrl:'https://books.rakuten.co.jp/rb/12345/',affiliateUrl:'https://hb.afl.rakuten.co.jp/hgc/test/',largeImageUrl:'https://thumbnail.image.rakuten.co.jp/book.jpg'};
const req=(scope='entrance:英語',opts={})=>new Request('https://app.example/api/book-sales?scope='+encodeURIComponent(scope),opts);
const make=fetcher=>createSalesLookup({catalog:{[isbn]:[title]},fetcher,interval:0});
test('sales order, pagination, credentials in header, registered exact edition only',async()=>{
 let calls=0;const handle=make(async(url,options)=>{calls++;const u=new URL(url);assert.equal(u.searchParams.get('sort'),'sales');assert.equal(u.searchParams.get('accessKey'),null);assert.equal(options.headers.accessKey,'test-key');assert.equal(options.headers.Origin,env.RAKUTEN_APP_ORIGIN);assert.equal(options.redirect,'error');return Response.json({pageCount:2,Items:calls===1?[{...item,isbn:'9784000000000'},item]:[{...item,title:'別の教材'}]});});
 const response=await handle(req(),env),text=await response.text(),body=JSON.parse(text);assert.equal(calls,2);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(body.available,true);assert.equal(body.books.length,1);assert.equal(body.books[0].rank,2);assert(!text.includes('test-key'));assert(!text.includes('test-id'));assert.match(body.sourceLabel,/全国の販売順位ではありません/);
});
test('private, invalid scope, cross-origin and method stop before provider',async()=>{
 let calls=0;const handle=make(async()=>{calls++;return Response.json({Items:[]});});
 for(const settings of [{},{...env,RAKUTEN_USE_CONTEXT:'disabled'}])assert.equal((await (await handle(req(),settings)).json()).available,false);
 for(const r of [req('arbitrary'),req(undefined,{method:'POST'}),req(undefined,{headers:{Origin:'https://evil.example'}}),req(undefined,{headers:{'Sec-Fetch-Site':'cross-site'}})])assert((await handle(r,env)).status>=400);
 assert.equal(calls,0);
});
test('unsafe product links and title mismatch cannot enter recommendation',async()=>{
 for(const change of [{title:'別の版'},{itemUrl:'https://evil.example/rb/1/'},{affiliateUrl:'https://evil.example/hgc/test'}]){const handle=make(async()=>Response.json({Items:[{...item,...change}]}));assert.deepEqual((await (await handle(req(),env)).json()).books,[]);}
});
test('duplicate scope coalesces and rate-limit cooldown prevents retry storm',async()=>{
 let release,calls=0;const handle=make(async()=>{calls++;await new Promise(r=>release=r);return Response.json({Items:[item]});});const a=handle(req(),env),b=handle(req(),env);await new Promise(r=>setTimeout(r,5));assert.equal(calls,1);release();assert.deepEqual(await (await a).json(),await (await b).json());
 let limited=0;const deny=make(async()=>{limited++;return new Response('',{status:429});});await deny(req(),env);assert.equal((await deny(req(),env)).status,429);assert.equal(limited,1);
});
