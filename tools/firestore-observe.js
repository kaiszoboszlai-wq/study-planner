// Paste into DevTools on a LOCAL build configured for an isolated test project.
// Observes SDK calls only; this does not measure Firestore billing.
(function(){
  'use strict';
  if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('Local test build only');
  if(!window.FB||!FB.Fs||!FB.db)throw Error('Load Firebase before installing the observer');
  const project=FB.db.app?.options?.projectId;
  if(!project||window.FIRESTORE_MEASUREMENT_PROJECT_ID!==project)throw Error('Set FIRESTORE_MEASUREMENT_PROJECT_ID to the isolated test project ID first');
  window.FirestoreObserve?.uninstall();
  const original=FB.Fs,wrapped={...original},events=[];let recording=false,started=null,label='';
  function record(method,detail={}){if(recording)events.push({at:new Date().toISOString(),method,...detail});}
  function observed(method,fn,detail){return async function(...args){record(method,{phase:'attempt',...detail});try{const value=await fn.apply(this,args);let extra={};if(method==='getDocs')extra={returnedDocuments:value.size??value.docs?.length??0,fromCache:!!value.metadata?.fromCache};if(method==='getDoc'||method==='getDocFromServer')extra={returnedDocuments:value.exists()?1:0,fromCache:!!value.metadata?.fromCache};record(method,{phase:'resolved',...detail,...extra});return value}catch(e){record(method,{phase:'rejected',code:e.code||'unknown',...detail});throw e}};}
  for(const method of ['getDoc','getDocFromServer','getDocs','getCountFromServer','setDoc','updateDoc','deleteDoc'])if(typeof original[method]==='function')wrapped[method]=observed(method,original[method]);
  if(original.runTransaction)wrapped.runTransaction=function(db,callback,...options){return observed('runTransaction',original.runTransaction)(db,async tx=>{
    record('transactionCallback',{phase:'attempt'});const facade={get:observed('transaction.get',tx.get.bind(tx)),set(...a){record('transaction.set',{phase:'queued'});tx.set(...a);return facade},update(...a){record('transaction.update',{phase:'queued'});tx.update(...a);return facade},delete(...a){record('transaction.delete',{phase:'queued'});tx.delete(...a);return facade}};
    return callback(facade);
  },...options)};
  if(original.writeBatch)wrapped.writeBatch=function(db){const batch=original.writeBatch(db);let queued=0;const facade={set(...a){queued++;batch.set(...a);return facade},update(...a){queued++;batch.update(...a);return facade},delete(...a){queued++;batch.delete(...a);return facade},commit(){return observed('batch.commit',batch.commit.bind(batch),{queuedDocumentWrites:queued})()}};return facade};
  FB.Fs=wrapped;
  const api={start(name){events.length=0;label=String(name);started=new Date().toISOString();recording=true;return {label,started}},stop(){recording=false;return api.report()},report(){const totals={};for(const e of events){const key=e.method+':'+e.phase;totals[key]=(totals[key]||0)+1;}return {kind:'SDK observation; NOT billed Firestore operations',project,label,started,ended:new Date().toISOString(),totals,events:events.slice()}},uninstall(){recording=false;if(FB.Fs===wrapped)FB.Fs=original;delete window.FirestoreObserve}};
  window.FirestoreObserve=api;
})();
