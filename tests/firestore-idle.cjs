const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function slice(a,b){return html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)))}
test('automatic reads stop after five idle minutes and interaction resumes once without affecting saving',()=>{
 let now=0;const events={},calls=[];const c={Date:{now:()=>now},document:{hidden:false,addEventListener:(n,f)=>events[n]=f},fbPoll:()=>calls.push('notifications'),syncRefresh:async()=>calls.push('sync'),dmCur:{},dmLoad:()=>calls.push('chat'),renderRank:()=>calls.push('rank')};vm.createContext(c);vm.runInContext(slice('var lastReadActivity=','// ---- Firestore('),c);
 assert(c.automaticReadsAllowed());now=299999;assert(c.automaticReadsAllowed());now=300000;assert(!c.automaticReadsAllowed());now=3600000;assert(!c.automaticReadsAllowed());events.pointerdown();assert(c.automaticReadsAllowed());assert.equal(calls.length,2);events.keydown();assert.equal(calls.length,2);c.document.hidden=true;assert(!c.automaticReadsAllowed());now+=3600000;c.document.hidden=false;events.visibilitychange();assert(c.automaticReadsAllowed());
});
