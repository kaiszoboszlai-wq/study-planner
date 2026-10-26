(function(){
'use strict';
const root=document.getElementById('stats'),chart=document.getElementById('schart'),card=document.getElementById('statsChart62'),seg=document.getElementById('seg');
if(!root||!chart||!card||!seg)return;
const modes=[['y','年'],['h','6か月'],['m','月'],['w','週'],['d','日']];
let mode='w',offset=0,selection=-1,lastKey='',lastOwner=dataOwner,animations=[],ghost=null;
const summary=document.createElement('div');summary.className='stats-summary70';summary.setAttribute('aria-live','polite');
const selected=document.createElement('p');selected.className='stats-selection70';selected.setAttribute('aria-live','polite');selected.hidden=true;
seg.replaceChildren();seg.setAttribute('role','tablist');seg.setAttribute('aria-label','学習記録の表示期間');
const thumb=document.createElement('span');thumb.className='stats-period-thumb70';thumb.setAttribute('aria-hidden','true');seg.append(thumb);
const buttons=modes.map(([value,label],i)=>{const b=document.createElement('button');b.type='button';b.dataset.m=value;b.textContent=label;b.setAttribute('role','tab');b.setAttribute('aria-controls','schart');b.onclick=()=>choose(value);b.onkeydown=e=>{let index=i;if(e.key==='ArrowRight')index=(i+1)%5;else if(e.key==='ArrowLeft')index=(i+4)%5;else if(e.key==='Home')index=0;else if(e.key==='End')index=4;else return;e.preventDefault();buttons[index].focus();choose(modes[index][0]);};seg.append(b);return b;});
card.prepend(seg,summary);chart.after(selected);
function choose(value){if(mode===value)return;mode=value;offset=0;selection=-1;renderStats();}
document.getElementById('statsPrev38').onclick=()=>{offset++;selection=-1;renderStats();};
document.getElementById('statsNext38').onclick=()=>{if(offset){offset--;selection=-1;renderStats();}};
function dateLabel(date){return date.getFullYear()+'年'+(date.getMonth()+1)+'月'+date.getDate()+'日';}
function dateAt(date,days){const d=new Date(date);d.setDate(d.getDate()+days);return d;}
function model(log){
 const today=new Date();today.setHours(0,0,0,0);let start,end,items=[];
 if(mode==='d'){start=dateAt(today,-offset);end=start;}
 else if(mode==='w'){end=dateAt(today,-7*offset);start=dateAt(end,-6);}
 else if(mode==='m'){end=new Date(today.getFullYear(),today.getMonth()-offset+1,0);if(offset===0)end=today;start=new Date(today.getFullYear(),today.getMonth()-offset,1);}
 else{const count=mode==='h'?6:12;start=new Date(today.getFullYear(),today.getMonth()-count+1-count*offset,1);end=offset===0?today:new Date(today.getFullYear(),today.getMonth()+1-count*offset,0);}
 if(mode==='h'||mode==='y'){
  for(let i=0;i<(mode==='h'?6:12);i++){const d=new Date(start.getFullYear(),start.getMonth()+i,1);items.push({key:fmtDate(d).slice(0,7),label:(d.getMonth()+1)+'月',date:d,parts:{},total:0});}
 }else for(let d=new Date(start);d<=end;d=dateAt(d,1))items.push({key:fmtDate(d),label:mode==='w'?DAYS[d.getDay()]:mode==='d'?(d.getMonth()+1)+'/'+d.getDate():String(d.getDate()),date:new Date(d),parts:{},total:0});
 const index=new Map(items.map(b=>[b.key,b]));let total=0;
 for(const [date,parts] of Object.entries(log)){if(date<fmtDate(start)||date>fmtDate(end))continue;const b=index.get(mode==='h'||mode==='y'?date.slice(0,7):date);if(!b)continue;for(const [name,raw] of Object.entries(parts)){const sec=Math.max(0,Number(raw)||0);b.parts[name]=(b.parts[name]||0)+sec;b.total+=sec;total+=sec;}}
 const days=Math.round((Date.UTC(end.getFullYear(),end.getMonth(),end.getDate())-Date.UTC(start.getFullYear(),start.getMonth(),start.getDate()))/86400000)+1;
 return {items,start,end,total,average:total/days};
}
function svgEl(name,attrs={},text){const e=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
function stopMotion(){animations.forEach(a=>a.cancel());animations=[];if(ghost)ghost.remove();ghost=null;}
function draw(animate=false,old=null){
 if(dataOwner!==lastOwner){lastOwner=dataOwner;offset=0;selection=-1;lastKey='';animate=false;stopMotion();}
 const data=model(logData()),items=data.items,width=Math.max(280,chart.clientWidth||350),height=284,left=2,right=43,top=8,bottom=34,plotW=width-left-right,plotH=height-top-bottom,base=top+plotH;
 const maximum=Math.max(0,...items.map(b=>b.total/3600)),scale=niceTop(maximum),topValue=scale.top,slot=plotW/items.length,barWidth=Math.min(mode==='d'?52:40,slot*(items.length>15?.64:.62));
 const key=[mode,offset,width,fmtDate(data.end)].join('|');animate=animate&&key!==lastKey;lastKey=key;
 buttons.forEach((b,i)=>{const on=b.dataset.m===mode;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on)seg.style.setProperty('--period-index70',i);});
 const metric=mode==='d'?data.total:data.average;summary.replaceChildren();const small=document.createElement('small');small.textContent=mode==='d'?'合計':'1日の平均';summary.append(small);
 const minutes=Math.round(metric/60),hours=Math.floor(minutes/60);function value(n,unit){const strong=document.createElement('strong');strong.textContent=n.toLocaleString('ja-JP');const u=document.createElement('span');u.className='stats-unit70';u.textContent=unit;summary.append(strong,u);}
 if(hours)value(hours,'時間');if(minutes%60||!hours)value(minutes%60,'分');
 document.getElementById('statsRange38').textContent=mode==='d'?dateLabel(data.start):dateLabel(data.start)+'〜'+(data.start.getFullYear()===data.end.getFullYear()?'':data.end.getFullYear()+'年')+(data.end.getMonth()+1)+'月'+data.end.getDate()+'日';
 document.getElementById('statsNext38').disabled=offset===0;
 const svg=svgEl('svg',{viewBox:`0 0 ${width} ${height}`,class:'stats-plot70',role:'img','aria-label':(mode==='d'?'日別の学習時間':'表示期間の学習時間')+'、合計'+fmtDur(data.total)});
 for(const fraction of [0,.5,1]){const y=base-plotH*fraction;svg.append(svgEl('line',{x1:left,x2:left+plotW,y1:y,y2:y,class:'grid70'}));const h=topValue*fraction;svg.append(svgEl('text',{x:left+plotW+6,y:y+4},h===0?'0':h+'時間'));}
 const names=[...new Set([...(state.subjects||[]).map(s=>s[0]),...items.flatMap(b=>Object.keys(b.parts))])],groups=[];
 items.forEach((b,i)=>{
  const x=left+i*slot+slot/2;svg.append(svgEl('line',{x1:x-slot/2,x2:x-slot/2,y1:top,y2:base,class:'grid70 vertical70'}));
  const g=svgEl('g',{class:'stats-stack70','data-key':b.key});let acc=0;
  for(const name of names){const sec=b.parts[name]||0;if(sec<=0)continue;const h=sec/3600/topValue*plotH;g.append(svgEl('rect',{x:x-barWidth/2,y:base-acc-h,width:barWidth,height:h,fill:colorOf(name),class:'subject-bar70','data-subject':name}));acc+=h;}
  svg.append(g);groups.push(g);
  const hit=svgEl('rect',{x:left+i*slot,y:top,width:slot,height:plotH,class:'column-hit70','data-i':i});hit.append(svgEl('title',{},dateLabel(b.date)+' '+fmtDur(b.total)));hit.onclick=e=>{e.stopPropagation();selection=i;showSelection(data);};svg.append(hit);
  const show=items.length<=12||i===0||i===items.length-1||b.date.getDate()%7===0;if(show)svg.append(svgEl('text',{x,y:base+18,'text-anchor':'middle',class:i===selection?'selected70':''},b.label));
 });
 stopMotion();chart.replaceChildren(svg);chart.dataset.period=mode;chart.dataset.totalSeconds=String(data.total);chart.dataset.bucketCount=String(items.length);showSelection(data);
 renderPies(items,logData());
 if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  if(old){ghost=document.createElement('div');ghost.className='stats-chart-ghost70';ghost.setAttribute('aria-hidden','true');ghost.append(old);chart.append(ghost);const fading=ghost;const a=fading.animate([{opacity:1},{opacity:0}],{duration:230,easing:'ease-out',fill:'forwards'});animations.push(a);a.onfinish=()=>fading.remove();}
  animations.push(svg.animate([{opacity:0},{opacity:1}],{duration:380,easing:'ease-out',fill:'both'}));
  groups.forEach(g=>{g.style.transformOrigin=`0px ${base}px`;animations.push(g.animate([{transform:'scaleY(.05)'},{transform:'scaleY(1)'}],{duration:460,easing:'cubic-bezier(.2,.75,.25,1)',fill:'both'}));});
 }
}
function showSelection(data){const b=data.items[selection];selected.hidden=!b;if(!b)return;selected.textContent=(mode==='h'||mode==='y'?b.date.getFullYear()+'年'+(b.date.getMonth()+1)+'月':dateLabel(b.date))+'　'+fmtDur(b.total);}
function openHistory(){
 const data=model(logData()),bucket=data.items[selection>=0?selection:data.items.length-1],now=new Date(),date=bucket.date;
 const monthly=mode==='h'||mode==='y',distance=monthly?(now.getFullYear()-date.getFullYear())*12+now.getMonth()-date.getMonth():Math.round((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()))/86400000),count=monthly?6:7;
 dMode=monthly?'m':'d';dOff=Math.floor(Math.max(0,distance)/count);dSel=count-1-Math.max(0,distance)%count;mrLimit=15;mrSig='';document.getElementById('dm').hidden=false;renderDm();
}
function bindHistory(){chart.onclick=openHistory;chart.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openHistory();}};}
const baseRender=renderStats;renderStats=function(){const old=chart.querySelector('.stats-plot70')?.cloneNode(true);baseRender.apply(this,arguments);draw(state.page===4,old);bindHistory();};
const baseLive=updateStatsLive;updateStatsLive=function(){const before=statsLiveKey;baseLive.apply(this,arguments);if(statsLiveKey!==before)draw(false);};
let resizeFrame=0;new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(state.page===4)draw(false);});}).observe(chart);
root.setAttribute('aria-label','学習記録');draw(false);bindHistory();
})();
