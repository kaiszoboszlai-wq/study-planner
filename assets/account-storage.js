(function(){
'use strict';
const cache=new Map();let db=null,hydrated=false,sequence=0,queue=Promise.resolve(),resolveHydration;
document.documentElement.classList.add('account-loading88');
const hydration=new Promise(resolve=>resolveHydration=resolve);
const ready=new Promise(resolve=>{let settled=false;const finish=()=>{if(settled)return;settled=true;clearTimeout(timer);resolve();};const timer=setTimeout(finish,2000);try{const request=indexedDB.open('studyplanner-account-storage-v1',1);request.onupgradeneeded=()=>{const value=request.result;value.createObjectStore('accounts',{keyPath:'key'});value.createObjectStore('backups',{keyPath:'id'});};request.onerror=finish;request.onblocked=finish;request.onsuccess=()=>{if(settled){request.result.close();return;}db=request.result;db.onversionchange=()=>db.close();const tx=db.transaction('accounts'),get=tx.objectStore('accounts').getAll();get.onsuccess=()=>{for(const row of get.result){cache.set(row.key,row);sequence=Math.max(sequence,Number(row.stamp)||0);}finish();};get.onerror=finish;};}catch{finish();}});
function local(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
function read(key){const primary=local(key),row=cache.get(key);sequence=Math.max(sequence,Number(primary?._persistedAt88)||0);if(row&&(!primary||Number(row.stamp)>Number(primary._persistedAt88||0))){try{return JSON.parse(row.json);}catch{}}return primary;}
function newer(key){const value=local(key),row=cache.get(key);return !!row&&(!value||Number(row.stamp)>Number(value._persistedAt88||0));}
function payload(key,value){const stamp=Math.max(Date.now()*1000,sequence+1,Number(value._persistedAt88||0)+1,Number(cache.get(key)?.stamp||0)+1);sequence=stamp;value._persistedAt88=stamp;return {key,stamp,json:JSON.stringify(value)};}
function put(store,value){if(!db)return Promise.reject(new Error('端末内データベースが利用できません。'));return new Promise((resolve,reject)=>{let tx;try{tx=db.transaction(store,'readwrite',{durability:'strict'});}catch{tx=db.transaction(store,'readwrite');}tx.objectStore(store).put(value);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('保存が中断されました。'));});}
function enqueue(task){const result=queue.catch(()=>{}).then(task);queue=result.catch(()=>{});return result;}
function record(row){return enqueue(async()=>{await put('accounts',row);cache.set(row.key,row);});}
function changed(error){if(window.saveHealth){saveHealth.localError=error||null;saveHealth.localSaved=!error;if(window.paintSaveStatus)paintSaveStatus();}}
async function write(key,value){await ready;const row=payload(key,value);try{localStorage.setItem(key,row.json);if(cache.has(key))record(row).catch(changed);return true;}catch(primaryError){try{await record(row);return true;}catch(error){throw error||primaryError;}}}
function sync(key,value){if(!hydrated)return true;const row=payload(key,value);try{localStorage.setItem(key,row.json);if(cache.has(key))record(row).catch(changed);return true;}catch(error){if(!db){changed(error);return false;}record(row).then(()=>changed(null),changed);return true;}}
function backup(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(error){if(!db)return false;enqueue(()=>put('backups',{id:key+':'+Date.now()+':'+Math.random(),sourceKey:key,json:JSON.stringify(value),savedAt:Date.now()})).catch(changed);return true;}}
window.AccountStorage88={ready,hydration,read,newer,write,sync,backup,get hydrated(){return hydrated;},complete(){hydrated=true;document.documentElement.classList.remove('account-loading88');resolveHydration();},flush(){return queue;}};
})();
