(async function(){
'use strict';const storage=window.AccountStorage88;
try{await storage.ready;let key=legacyUnclaimed?KEY+':legacy-backup':accountKey(dataOwner);if(!dataOwner&&!storage.read(key)){const legacy=KEY+':legacy-backup';if(storage.newer(legacy)){key=legacy;legacyUnclaimed=true;}}
 if(storage.newer(key)){const restored=storage.read(key);if(restored&&Number(state._persistedAt88||0)!==Number(restored._persistedAt88||0)){leaveFlow40(false);closePlanDialogs();state=Object.assign(JSON.parse(initialState),restored);accountNeedsCloud=false;loadTimerRuntime();repairLog58(state);ensureIds();rollForward();lastData=syncData();fillWeeklySetup();countdown();renderSubjects();renderPlan();showPage(state.plan&&!state.weekSetupPending?3:state.weekSetupPending?1:(state.goal||'').trim()?1:0);}}
}catch(error){saveHealth.localError=error;}
finally{storage.complete();store();}
})();
