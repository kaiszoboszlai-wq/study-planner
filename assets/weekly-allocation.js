(function(root){'use strict';
function hours(config,date){const day=new Date(date+'T00:00:00').getDay(),value=Array.isArray(config.dayHours)?config.dayHours[day]:null;return value!=null?Number(value):Number(day===0||day===6?config.we:config.wd)||0;}
function validDays(values){return Array.isArray(values)&&values.length===7&&values.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=16&&Math.abs(v*4-Math.round(v*4))<1e-7);}
function dailyQuotas(subjects,names,days){const chosen=subjects.filter(s=>names.includes(s[0])),out={};if(!chosen.length||!days.length)return out;const selected=new Set(chosen.map(s=>s[0])),total=days.reduce((n,d)=>n+d.hours,0),sum=subjects.reduce((n,s)=>n+Number(s[1]),0)||1;
const available=days.map(d=>d.hours-d.blocks.filter(b=>!selected.has(b.name)).reduce((n,b)=>n+b.h,0)),capacity=Math.floor(Math.min(...available)*12+1e-7),minimum=chosen.map(s=>Math.max(1,...days.map(d=>Math.ceil(d.blocks.filter(b=>b.name===s[0]).reduce((n,b)=>n+b.h,0)*12-1e-7))));
if(minimum.reduce((n,v)=>n+v,0)>capacity)throw Error('毎日均等に入れる教材には1冊あたり5分以上が必要です。日別の時間を増やすか、チェックする教材を減らしてください。計測済み・手動の予定は残します。');
const all=chosen.length===subjects.length;if(all&&days.some(d=>Math.abs(d.hours-days[0].hours)>1e-7))throw Error('すべての教材を毎日均等にする場合は、各曜日の勉強時間も同じにしてください。一部の教材のチェックを外すと、残りの時間を曜日ごとに配分できます。');
if(all&&available.some(v=>Math.abs(v-available[0])>1e-7||Math.abs(v*12-Math.round(v*12))>1e-7))throw Error('計測済み・手動の予定を残すと、すべての教材を毎日均等にできません。一部の教材のチェックを外すか、各曜日の時間を調整してください。');
const ideal=chosen.map(s=>total/days.length*Number(s[1])/sum*12),units=minimum.slice(),target=all?capacity:Math.min(capacity,Math.max(units.reduce((n,v)=>n+v,0),ideal.reduce((n,v)=>n+Math.round(v),0)));
while(units.reduce((n,v)=>n+v,0)<target){let best=0;for(let i=1;i<units.length;i++)if(ideal[i]-units[i]>ideal[best]-units[best])best=i;units[best]++;}
chosen.forEach((s,i)=>out[s[0]]=units[i]/12);return out;
}
root.WeeklyAllocation110={hours,validDays,dailyQuotas};if(typeof module!=='undefined')module.exports=root.WeeklyAllocation110;
})(typeof globalThis!=='undefined'?globalThis:this);
