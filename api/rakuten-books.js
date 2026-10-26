// CommonJS entrypoint for Vercel; no JSON import attributes required at runtime.
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
let service;
async function getService(){
  if(!service)service=import('../server/rakuten-books.mjs').then(({createRakutenBooks})=>createRakutenBooks({catalog:JSON.parse(readFileSync(join(process.cwd(),'server/rakuten-catalog.json'),'utf8'))})).catch(error=>{service=null;throw error;});
  return service;
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const lookup=await getService(),origin=process.env.RAKUTEN_APP_ORIGIN||'http://localhost';
    const headers=new Headers();
    for(const name of ['origin','sec-fetch-site'])if(req.headers[name])headers.set(name,req.headers[name]);
    const request=new Request(new URL(req.url,origin),{method:req.method,headers});
    const response=await lookup(request,process.env);
    res.statusCode=response.status;
    response.headers.forEach((value,key)=>res.setHeader(key,value));
    res.end(await response.text());
  }catch{res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({book:null,reason:'unavailable'}));}
};
