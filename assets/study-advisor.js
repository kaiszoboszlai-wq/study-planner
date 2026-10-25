(function(root){
'use strict';
const data=root.StudyRouteCatalog||(typeof require==='function'?require('./study-route-data.js'):null);
function build(a){
 if(!['english','math'].includes(a.subject)||!(a.subject==='math'?['middle','humanities','science']:['middle','high']).includes(a.stage)||!data.levels.some(l=>l[0]===a.level)||!['school','exam'].includes(a.goal)||!['school','candidates'].includes(a.material))throw Error('教科・学習段階・目標・教材を選んでください。');
 const highMath=a.subject==='math'&&a.stage!=='middle',mathScope=a.stage==='science'?'数学Ⅰ・A・Ⅱ・B・Ⅲ・C':'数学Ⅰ・A・Ⅱ・B・C';
 const steps=[],rank={foundation:0,basic:1,standard:2}[a.level];
 const add=(title,kind,use,check,extra={})=>steps.push(Object.assign({title,kind,use,check},extra));
 const school=(kind,use,check)=>add(a.stage==='middle'?'学校の教科書・ワーク（現在の学年）':a.subject==='math'?mathScope+'の教科書・傍用問題集':'学校の英語教科書・文法教材',kind,use,check);
 if(a.subject==='english'){
   if(rank===0){const b=data.books.find(b=>b.subject===a.subject&&b.stage===a.stage&&b.rank===0);if(a.material==='candidates')steps.push({...b});else school('文法の基礎','未習・苦手な単元の例文を理解し、主語・動詞・語順を確認して基本問題を解く。','基本問題を8割程度、根拠を説明しながら解ける。');}
   if(a.stage==='high'&&a.goal==='exam'&&a.material==='candidates'){steps.push({...data.books.find(b=>b.id==='eh-words')});if(rank<2)steps.push({...data.books.find(b=>b.id==='eh-reading')});steps.push({...data.books.find(b=>b.id==='eh-long')});}
   else{school('語彙・一文の理解','教科書の基本語を見ずに答える練習をし、例文の構造と意味を説明する。','学習した基本語と例文を、別の日にも説明できる。');school('短文から長文へ','教科書本文・手持ち教材の未読文で、段落の要点と設問の根拠を確認する。','未読の同程度の文章で要点と解答の根拠を説明できる。');}
 }else{
   if(rank===0){if(highMath&&a.material==='candidates')add('数学Ⅰ・A 入門問題精講','基礎の理解','学習する単元の説明・例題を読み、途中式の理由を確かめてから自力で解き直す。','数字を変えた基本問題で、解法と途中式の理由を説明できる。');else school('基礎の理解','苦手な単元の定義・公式の条件を確認し、例題を途中式つきで解く。','基本例題を解説なしで解き、各行の理由を説明できる。');}
   if(highMath&&a.goal==='exam'&&a.material==='candidates')add('数学Ⅰ・A 基礎問題精講','典型問題の習得','まず自力で方針を考える。解説を読んだ問題は、翌日に解説を閉じて解き直す。','同じ単元の初見の基本・典型問題で、方針を選んだ理由を説明できる。');
   else school('基本・典型問題の演習','苦手な単元を少量ずつ解き、間違えた問題は原因を確認して翌日に解き直す。','同程度の別の問題でも、方針と途中式を自分で書ける。');
   if(highMath){school(a.stage==='science'?'数学Ⅱ・B・Cから数学Ⅲへ':'数学Ⅱ・B・Cの必要範囲へ','数学Ⅰ・Aの基礎を確認したら、Ⅱの関数・微積分、Bの数列や統計、Cのベクトルなど、履修済みで必要な単元を基本例題から進める。'+(a.stage==='science'?'数学ⅢはⅡの関数・微積分を理解してから極限・微分・積分へ進む。':''),'各単元の基本例題を解説なしで解き、使う公式の条件を説明できる。');}
   school('単元を混ぜた演習','単元名を隠して複数の問題を解き、どの条件から解法を選ぶか確認する。','基本・典型問題で、使う定理や公式の条件を説明できる。');
 }
 if(a.goal==='exam')add('志望校・受験方式に合う過去問','到達点の確認','出題範囲と形式を確認する。未習部分は除き、解けない原因を前の教材へ戻して補う。','解説の暗記ではなく、別の年度でも方針と根拠を説明できる。');
 else school('テスト範囲の総仕上げ','学校の指定範囲から問題を選び、時間を測って解く。誤答は前の段階へ戻して確認する。','未確認の基本事項が残っていないか、別の日に再確認できる。');
 const parallel=steps.filter(s=>s.parallel),route=steps.filter(s=>!s.parallel);
 return {scope:a.subject==='english'?(a.stage==='middle'?'中学英語':'高校英語'):(a.stage==='middle'?'中学数学':a.stage==='science'?'高校理系数学':'高校文系数学'),route,parallel,reason:rank===0?'基礎を確認してから演習へ進むルートです。':rank===1?'基本事項を確認できている前提で、典型問題から始めます。':'基本問題を解ける前提で、実戦につながる演習を中心にします。',note:(highMath?'文系・理系だけで入試範囲は確定しません。B・Cの単元を含め、学校の履修範囲と志望校の最新の募集要項に合わせて選んでください。':'')+'合わないと感じたら一つ前の段階へ戻ってください。新しい本を買う前に、現行版の目次・対象範囲・試し読みを確認し、手持ち教材で代用できないか確かめましょう。'};
}
const api={build,data};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.StudyRouteBuilder=api;
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);let a={},step=0,origin;
const modal=document.createElement('div');modal.id='studyAdvisor';modal.className='tm';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','advisorTitle');modal.innerHTML='<div class="tmbox advisor-shell"><div class="advisor-head"><h2 id="advisorTitle" tabindex="-1">参考書ルートを作る</h2><button id="advisorClose" type="button">閉じる</button></div><p id="advisorProgress" class="note"></p><div id="advisorBody"></div><div class="actions"><button id="advisorBack" type="button">戻る</button><button id="advisorNext" type="button" class="main">次へ</button></div><p id="advisorError" class="err" role="alert"></p></div>';document.body.appendChild(modal);
const entry=document.createElement('button');entry.type='button';entry.className='advisor-entry';entry.textContent='教材・参考書ルートを作る →';$('mypage').querySelector('.mh').after(entry);entry.onclick=()=>{origin=document.activeElement;modal.hidden=false;render();$('advisorTitle').focus()};
function close(){modal.hidden=true;origin?.focus()}
$('advisorClose').onclick=close;modal.onclick=e=>{if(e.target===modal)close()};modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}if(e.key==='Tab'){const nodes=Array.from(modal.querySelectorAll('button')).filter(n=>!n.disabled&&n.getClientRects().length);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
function title(box,text){box.append(el('h3',text))}
function choices(box,key,rows){const group=el('div',null,'advisor-choices');for(const [value,label] of rows){const b=el('button',label);b.type='button';b.setAttribute('aria-pressed',String(a[key]===value));b.onclick=()=>{if(key==='subject'&&a.subject!==value)delete a.stage;a[key]=value;render()};group.append(b)}box.append(group)}
function card(box,s,index){const c=el('article',null,'route-step');c.append(el('small',index===null?'並行して取り組む':`STEP ${index+1}`,'note'),el('h3',s.title),el('p',s.kind,'note'),el('p',s.use));c.append(el('strong','次へ進む目安'),el('p',s.check));box.append(c)}
const questions=[
 {key:'subject',title:'どの教科のルートを作る？',rows:()=>[['english','英語'],['math','数学']]},
 {key:'stage',title:'学習する範囲は？',rows:()=>a.subject==='math'?[['middle','中学数学'],['humanities','高校文系数学'],['science','高校理系数学']]:[['middle','中学英語'],['high','高校英語']]},
 {key:'level',title:'今のレベルに近いものは？',rows:()=>data.levels.map(l=>[l[0],l[1]+'：'+l[2]]),note:'直近の問題演習を思い出して選んでください。迷ったら基礎から始められます。'},
 {key:'goal',title:'目標は？',rows:()=>[['school','授業・定期テスト'],['exam','入試に向けた学習']]},
 {key:'material',title:'どんな教材で進めたい？',rows:()=>[['school','学校の教科書・手持ち教材で進める'],['candidates','市販の参考書候補も知りたい']],note:'同じ役割の教材を複数買う必要はありません。手持ちの教材で進めるルートも作れます。'}
];
function render(){const box=$('advisorBody');box.replaceChildren();$('advisorError').textContent='';$('advisorProgress').textContent=step===questions.length?'あなたの学習ルート':`${step+1} / ${questions.length}`;$('advisorBack').hidden=step===0;$('advisorNext').textContent=step===questions.length?'条件を変えて作り直す':step===questions.length-1?'ルートを作成':'次へ';
 if(step<questions.length){const q=questions[step];title(box,q.title);choices(box,q.key,q.rows());if(q.note)box.append(el('p',q.note,'note'));}
 if(step===questions.length){const r=build(a);title(box,r.scope+'のルート');box.append(el('p',r.reason));r.route.forEach((s,i)=>card(box,s,i));r.parallel.forEach(s=>card(box,s,null));box.append(el('p',r.note,'note'));}
 $('advisorNext').disabled=step<questions.length&&!questions[step].rows().some(row=>row[0]===a[questions[step].key]);
}
$('advisorBack').onclick=()=>{step=Math.max(0,step-1);render()};$('advisorNext').onclick=()=>{if(step===questions.length)step=0;else if(step===questions.length-1){try{build(a);step++}catch(e){$('advisorError').textContent=e.message;return}}else step++;render();modal.querySelector('.tmbox').scrollTop=0;$('advisorTitle').focus({preventScroll:true})};
})(typeof window!=='undefined'?window:globalThis);
