// Regression tests for the production sync functions; no Firebase connection.
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function setup(){
  const c={state:{plan:null,goal:'',log:{},exams:[],dataAt:999},FB:{uid:'same-google-user',syncReady:false},authEpoch:1,accountNeedsCloud:false,saveHealth:{},document:{hidden:false,activeElement:null,querySelector:()=>null},setTimeout:()=>1,clearTimeout(){},Date,JSON,Promise,paintSaveStatus(){},store(){},ownsCurrentData(uid){return uid===c.FB.uid},syncData(){return JSON.stringify({goal:c.state.goal})},writes:[],applied:[],fGet:async()=>c.remote,fSet:async(path,data)=>c.writes.push({path,data}),syncApply(r){c.applied.push(r);return true}};
  vm.createContext(c);
  const start=html.indexOf('var syncTimer=null');const end=html.indexOf('async function fbSocialSync()',start);
  // Keep the real network flow, replacing only the reload/storage boundary.
  const source=html.slice(start,end).replace(/function syncApply\(r\)[\s\S]*?(?=async function syncPull)/,'');
  vm.runInContext(source,c);return c;
}
test('empty device takes cloud data even if startup set a newer local timestamp',async()=>{const c=setup();c.remote={data:'{"goal":"saved on phone"}',dataAt:100};assert.equal(await c.syncStart(),true);assert.equal(c.applied.length,1);assert.equal(c.writes.length,0)});
test('failed initial read never uploads local data, then automatically retries',async()=>{const c=setup();c.state.goal='local';const error={code:'unavailable'};c.fGet=async()=>{throw error};await c.syncStart();assert.equal(c.FB.syncReady,false);assert.equal(c.writes.length,0);assert.equal(c.saveHealth.cloudError,error);let calls=0;c.fbOnAuth=async()=>{calls++;c.fGet=async()=>null;await c.syncStart()};await c.syncRefresh();assert.equal(calls,1);assert.equal(c.FB.syncReady,true);assert.equal(c.writes.length,1)});
test('failed cloud application never overwrites the remote record',async()=>{const c=setup();c.state.goal='older local';c.remote={data:'{"goal":"remote"}',dataAt:1000};c.syncApply=()=>false;await c.syncStart();assert.equal(c.FB.syncReady,false);assert.equal(c.writes.length,0)});
test('open idle app fetches newer changes from another device',async()=>{const c=setup();c.FB.syncReady=true;c.remote={data:'{"goal":"updated"}',dataAt:1000};await c.syncRefresh();assert.equal(c.applied.length,1)});
test('periodic refresh protects active timers and unfinished forms',async()=>{const c=setup();c.FB.syncReady=true;let reads=0;c.fGet=async()=>{reads++;return null};c.state.timer={};await c.syncRefresh();c.state.timer=null;c.document.activeElement={tagName:'INPUT'};await c.syncRefresh();assert.equal(reads,0)});
test('account change discards an outstanding read',async()=>{const c=setup();let finish;c.fGet=()=>new Promise(r=>finish=r);const task=c.syncStart();c.authEpoch++;finish({data:'{"goal":"other account"}',dataAt:1000});await task;assert.equal(c.applied.length,0);assert.equal(c.writes.length,0)});
test('identical empty cloud data does not cause a reload loop',async()=>{const c=setup();c.remote={data:c.syncData(),dataAt:100};await c.syncStart();assert.equal(c.applied.length,0);assert.equal(c.FB.syncReady,true);assert.equal(c.saveHealth.synced,true)});
test('failed upload retries even after its debounce timer is gone',async()=>{const c=setup();c.FB.syncReady=true;c.state.goal='unsent';c.fSet=async()=>{throw {code:'unavailable'}};await c.syncPush();assert.equal(c.syncTimer,null);assert.equal(c.saveHealth.pending,true);c.fSet=async(path,data)=>c.writes.push({path,data});await c.syncPull();assert.equal(c.writes.length,1);assert.equal(c.saveHealth.synced,true)});
test('reads newer remote data before uploading an older queued edit',async()=>{const c=setup();c.FB.syncReady=true;c.state.goal='local';c.syncTimer=1;c.localStorage={setItem(){c.backedUp=true}};c.accountKey=uid=>uid;c.remote={data:'{"goal":"newer remote"}',dataAt:1000};await c.syncPull();assert.equal(c.writes.length,0);assert.equal(c.applied.length,1);assert.equal(c.backedUp,true)});
test('edits made during a cloud read are not replaced',async()=>{const c=setup();c.FB.syncReady=true;let finish;c.fGet=()=>new Promise(r=>finish=r);const pending=c.syncPull();c.state.goal='typed while loading';finish({data:'{"goal":"remote"}',dataAt:1000});await pending;assert.equal(c.applied.length,0);assert.equal(c.writes.length,0)});
test('identical remote content acknowledges a write without reloading',async()=>{const c=setup();c.FB.syncReady=true;c.state.goal='same';c.remote={data:c.syncData(),dataAt:1000};await c.syncPull();assert.equal(c.applied.length,0);assert.equal(c.writes.length,0);assert.equal(c.saveHealth.synced,true)});
