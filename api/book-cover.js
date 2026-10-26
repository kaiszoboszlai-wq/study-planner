// Only openBD-provided book introductions. Terms: https://openbd.jp/terms/
// Fetch on display; do not persist images or URLs, so corrections/removals apply.
const normalized = s => String(s || '').normalize('NFKC').replace(/[\s　]/g,'').toLowerCase();
function validISBN(s) {
  return /^97[89]\d{10}$/.test(s) && [...s].reduce((sum,c,i)=>sum+Number(c)*(i%2?3:1),0)%10===0;
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'GETで送信してください。'});}
  const isbn=String(req.query?.isbn||''),title=String(req.query?.title||'').slice(0,300);
  if(!validISBN(isbn)||!title)return res.status(200).json({cover:null});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
  try {
    const response=await fetch('https://api.openbd.jp/v1/get?isbn='+isbn,{signal:controller.signal});
    if(!response.ok)return res.status(200).json({cover:null});
    const data=await response.json(),summary=data?.[0]?.summary;
    if(!summary||summary.isbn!==isbn||normalized(summary.title)!==normalized(title)||!summary.cover)return res.status(200).json({cover:null});
    const url=new URL(summary.cover);
    if(url.protocol!=='https:'||url.hostname!=='cover.openbd.jp'||url.username||url.password||url.port)return res.status(200).json({cover:null});
    return res.status(200).json({cover:url.href,source:'https://openbd.jp/',title:summary.title});
  }catch(e){return res.status(200).json({cover:null});}finally{clearTimeout(timer);}
}
