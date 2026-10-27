const {readFileSync}=require('node:fs');const {join}=require('node:path');let service;
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 try{if(!service)service=import('../server/rakuten-sales.mjs').then(m=>m.createSalesLookup({catalog:JSON.parse(readFileSync(join(process.cwd(),'server/rakuten-catalog.json'),'utf8'))})).catch(e=>{service=null;throw e;});
 const origin=process.env.RAKUTEN_APP_ORIGIN||'http://localhost',headers=new Headers();for(const name of ['origin','sec-fetch-site'])if(req.headers[name])headers.set(name,req.headers[name]);const response=await(await service)(new Request(new URL(req.url,origin),{method:req.method,headers}),process.env);res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));res.end(await response.text());
 }catch{res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({books:[],available:false}));}
};
