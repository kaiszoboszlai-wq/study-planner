(function(){'use strict';
const key='studyplanner:onboarding:v2';let saved=null,hadLocal=false;
try{saved=JSON.parse(localStorage.getItem(key)||'null');for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if((k==='study-planner-v1'||k==='study-planner-v1:legacy-backup'||/^study-planner-v1:(guest|user:[^:]+)$/.test(k))&&localStorage.getItem(k)){hadLocal=true;break;}}}catch{}
try{saved=saved||JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
window.FirstVisit118={key,saved,hadLocal};
})();
