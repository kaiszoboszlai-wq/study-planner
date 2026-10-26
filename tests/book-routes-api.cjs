const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
const load=async file=>(await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file)).toString('base64'))).default;
const invoke=async(handler,req)=>{const res={code:200,headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body;return this}};await handler(req,res);return res};
const cover=await load('api/book-cover.js');let fetches=0;
global.fetch=async()=>{fetches++;return {ok:true,json:async()=>[{summary:{isbn:'9784101010014',title:'坊っちゃん',cover:'https://cover.openbd.jp/9784101010014.jpg'}}]}};
assert.equal((await invoke(cover,{method:'GET',query:{isbn:'9784101010015',title:'坊っちゃん'}})).body.cover,null);assert.equal(fetches,0);
assert.match((await invoke(cover,{method:'GET',query:{isbn:'9784101010014',title:'坊っちゃん'}})).body.cover,/cover.openbd.jp/);
assert.equal((await invoke(cover,{method:'GET',query:{isbn:'9784101010014',title:'別の本'}})).body.cover,null);
global.fetch=async()=>({ok:true,json:async()=>[{summary:{isbn:'9784101010014',title:'坊っちゃん',cover:'https://example.com/unauthorized.jpg'}}]});assert.equal((await invoke(cover,{method:'GET',query:{isbn:'9784101010014',title:'坊っちゃん'}})).body.cover,null);
global.fetch=async()=>{throw Error('offline')};assert.equal((await invoke(cover,{method:'GET',query:{isbn:'9784101010014',title:'坊っちゃん'}})).body.cover,null);
console.log('PASS ISBN checksum, exact title, permitted cover host and graceful failures');
})().catch(e=>{console.error(e);process.exit(1)});
