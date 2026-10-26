(function(root){
'use strict';
const scopes={物理:['力学','波動','熱','電磁気','原子'],化学:['理論','無機','有機'],国語:['現代文','古文','漢文']};
const text=b=>String(b.title||'').normalize('NFKC');
function topics(book){
 if(Array.isArray(book.coverageTopics))return book.coverageTopics;
 const wanted=scopes[book.subject];if(!wanted)return book.skills||[];
 const title=text(book).replace(/熱力学/g,'熱'),explicit=wanted.filter(t=>t==='現代文'?/現代文|現代の国語/.test(title):title.includes(t));
 if(explicit.length)return explicit;
 // A basic-only science book, a supplement, or an unidentified numbered volume
 // must not inherit every chapter of the full high-school subject.
 if(/(?:公式|計算|実験|補充資料|一問一答|用語|語彙|まとめノート)|(?:[.．]\s*[1-9]|[上下]巻)$/.test(title))return [];
 if(book.subject==='物理'&&title.includes('物理'))return title.includes('物理基礎')&&!title.replace(/物理基礎/g,'').includes('物理')?wanted.filter(t=>t!=='原子'):wanted;
 if(book.subject==='化学'&&title.includes('化学'))return title.includes('化学基礎')&&!title.replace(/化学基礎/g,'').includes('化学')?['理論']:wanted;
 return (book.skills||[]).filter(t=>wanted.includes(t));
}
function required(c,subject){
 const all=scopes[subject];if(!all)return [];
 const range=String(c.unit&&c.unit!=='全範囲'?c.unit:c.subject||'').replace(/熱力学/g,'熱');
 const narrowed=all.filter(t=>t==='現代文'?/現代文|現代の国語/.test(range):range.includes(t));
 if(narrowed.length)return narrowed;
 if(c.unit&&c.unit!=='全範囲')return [];
 if(c.category==='高校入試')return [];
 return all;
}
function setKey(book){
 const t=text(book);let series='';
 for(const pattern of [/物理のエッセンス/,/名問の森/,/宇宙一わかりやすい高校(?:物理|化学)/,/これならわかる物理/,/島村・宇都のゼロから劇的にわかる物理/,/為近の解法を見抜く物理/]){const m=t.match(pattern);if(m){series=m[0];break;}}
 if(!series&&/漆原晃の物理.*が面白いほどわかる本/.test(t))series='漆原晃の物理が面白いほどわかる本';
 if(!series&&/亀田和久の化学.*が面白いほどわかる本/.test(t))series='亀田和久の化学が面白いほどわかる本';
 if(!series||topics(book).length===0)return null;
 return [book.publisher,book.subject,book.stage,series].join('|');
}
// Preserve split-series volumes and required fields. Science coverage is checked
// at each selected level; Japanese coverage spans the route. Book limits are soft.
function complete(chosen,candidates,c){
 const books=[],obligations=[];
 for(const b of chosen){const needed=required(c,b.subject),covered=topics(b);if(!b.owned&&needed.length&&books.some(x=>x.subject===b.subject&&x.stage===b.stage)&&covered.every(t=>books.some(x=>x.subject===b.subject&&x.stage===b.stage&&topics(x).includes(t))))continue;books.push(b);}
 for(const book of books){const needed=required(c,book.subject);if(!needed.length)continue;const key=book.subject+'|'+(book.subject==='国語'?'all':book.stage);if(!obligations.some(o=>o.key===key))obligations.push({key,subject:book.subject,stage:book.subject==='国語'?null:book.stage,needed});}
 for(const o of obligations){
  const peers=candidates.filter(b=>b.subject===o.subject&&(o.stage===null||b.stage===o.stage)),atLevel=()=>books.filter(b=>b.subject===o.subject&&(o.stage===null||b.stage===o.stage)),append=b=>{if(!books.some(x=>x.id===b.id))books.push(b);};
  // Include companion volumes relevant to the requested whole subject or unit.
  for(const b of atLevel()){const key=setKey(b);if(key)peers.filter(x=>setKey(x)===key&&topics(x).some(t=>o.needed.includes(t))).forEach(append);}
  const missing=()=>o.needed.filter(t=>!atLevel().some(b=>topics(b).includes(t)));
  while(missing().length){const gaps=missing();let best=null,gain=0;for(const b of peers){if(books.some(x=>x.id===b.id))continue;const n=gaps.filter(t=>topics(b).includes(t)).length;if(n>gain){best=b;gain=n;}}if(!best)return null;append(best);}
 }
 return books;
}
function skills(book){const scoped=scopes[book.subject];return scoped?[...new Set((book.skills||[]).filter(t=>!scoped.includes(t)).concat(topics(book)))]:book.skills||[];}
root.BookRouteCoverage={topics,required,complete,setKey,skills};if(typeof module!=='undefined')module.exports=root.BookRouteCoverage;
})(typeof globalThis!=='undefined'?globalThis:this);
