const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function setup(){
 const nodes={};const c={state:{log:{today:{math:1800,manual:900},yesterday:{math:7200}},plan:[{date:'today',blocks:[{id:'b',h:1}]}]},FB:{uid:'me'},Date,Math,Object,Number,fmtDate:()=> 'today',elapsed:()=>7200,document:{querySelectorAll:()=>[]},$:(id)=>nodes[id]||(nodes[id]={style:{},setAttribute(){}}),fbMine:()=>({name:'me'}),myFollowIds:async()=>[],findBlock:()=>({name:'math'}),splitTimerDays:(start,end,fn)=>{fn('yesterday',600);fn('today',300)}};
 vm.createContext(c);
 for(const [a,b] of [['function logData(){','function mondayOf'],['function hm(h){','function buckets'],['function todayBar(){','// ===== 模試'],['async function rankRows(','var rankHistory=']])vm.runInContext(html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a))),c);
 return {c,nodes};
}
test('Today and ranking include manual entries, excluding previous days and block lifetime totals',async()=>{const {c,nodes}=setup();c.todayBar();const rows=await c.rankRows();assert.equal(rows[0].s,2700);assert.equal(nodes.tdMeasured.textContent,c.fmtDur(rows[0].s));assert.equal(nodes.tdPercent.textContent,'75%')});
test('running timer crossing midnight counts only today in both pages',async()=>{const {c,nodes}=setup();c.state.timer={id:'b',start:0};c.todayBar();const rows=await c.rankRows();assert.equal(rows[0].s,3000);assert.equal(nodes.tdMeasured.textContent,c.fmtDur(rows[0].s));assert.equal(c.state.log.today.math,1800)});
test('manual study counts with no plan',async()=>{const {c,nodes}=setup();c.state.plan=[];c.todayBar();const rows=await c.rankRows();assert.equal(nodes.tdMeasured.textContent,c.fmtDur(rows[0].s));assert.equal(nodes.tdMeasured.textContent,'45分')});
test('sub-minute values use the same formatter',()=>{const {c,nodes}=setup();c.state.log={today:{math:45}};c.todayBar();assert.equal(nodes.tdMeasured.textContent,c.fmtDur(45));assert.ok(html.includes("setTextIfChanged(el.querySelector('b'),fmtDur(r.s))"))});
