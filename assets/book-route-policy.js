(function(root){
'use strict';
// Curated recognition is a tie-breaker, not a live sales/popularity statistic.
// Match a named series AND its publisher; a publisher alone earns no priority.
const knownSeries=[
 {name:'問題精講',publisher:/旺文社/,title:/(?:入門|基礎|標準).*問題精講|問題精講/,source:'https://www.obunsha.co.jp/product/series/c002'},
 {name:'チャート式数学',publisher:/数研出版|チャート研究所/,title:/チャート式|^(?:基礎からの|解法と演習|基礎と演習)数学/,source:'https://www.chart.co.jp/top/chart/'},
 {name:'英単語ターゲット',publisher:/旺文社/,title:/英単語ターゲット/,source:'https://bookstore.obunsha.co.jp/collections/d232'},
 {name:'英検パス単',publisher:/旺文社/,title:/(?:でる順|重要度順)パス単/,source:'https://www.obunsha.co.jp/product/series/2/f035'},
 {name:'ひとつひとつわかりやすく',publisher:/gakken|学研/i,title:/ひとつひとつわかりやすく/,source:'https://gkp-koushiki.gakken.jp/2026/04/08/95707/'},
 {name:'物理のエッセンス・名問の森・良問の風',publisher:/河合出版/,title:/物理のエッセンス|名問の森|良問の風/,source:'https://www.kawai-publishing.jp/pamphlet/pageindices/index59.html'},
 {name:'公式TOEIC',publisher:/国際ビジネスコミュニケーション協会/,title:/公式TOEIC/i,source:'https://www.iibc-global.org/toeic/support/prep.html'},
 {name:'金のフレーズ',publisher:/朝日新聞出版/,title:/金のフレーズ/,source:'https://publications.asahi.com/product/25791.html'},
 {name:'スッキリわかる日商簿記',publisher:/TAC|タック/i,title:/スッキリわかる.*(?:日商)?簿記/,source:'https://bookstore.tac-school.co.jp/book/koza/00001'},
 {name:'みんなが欲しかったFP',publisher:/TAC|タック/i,title:/みんなが欲しかった.*FP/,source:'https://tacpub.jp/news/detail.php?i=398'},
 {name:'Next Stage・英文解釈の技術',publisher:/桐原書店/,title:/Next Stage|英文解釈の技術/i,source:'https://www.kirihara.co.jp/bookstore/'},
 {name:'山川の用語集・一問一答',publisher:/山川出版社/,title:/用語集|一問一答/,source:'https://howtouse.yamakawa.co.jp/books/'},
 {name:'漢検 漢字学習ステップ',publisher:/日本漢字能力検定協会/,title:/漢字学習ステップ/,source:'https://www.kanken.or.jp/kanken/textbook/step.html'}
];
const text=s=>String(s||'').normalize('NFKC');
function recognition(book){const title=text(book.title),publisher=text(book.publisher);if(/完成ノート|書き覚えノート/.test(title))return null;return knownSeries.find(r=>r.publisher.test(publisher)&&r.title.test(title))||null;}
function annualYear(book){
 // Prefer the displayed title, then explicit edition metadata, then source title.
 // A conflicting source title must never turn a visible old annual edition new.
 for(const [index,value] of [book.title,book.edition,book.sourceTitle,book.sourceVolume].entries()){
  const v=text(value),years=[];
  for(const m of v.matchAll(/((?:20\d{2}|['’]\d{2})(?:\s*[-〜~～・/]\s*(?:20\d{2}|\d{2}))?)\s*年(?:度(?:版|受験用)?|版|受験用)/g))for(const y of m[1].matchAll(/20\d{2}|['’]?\d{2}/g)){const n=Number(y[0].replace(/['’]/,''));years.push(n<100?2000+n:n);};
  const suffix=v.match(/(?:^|[\s.\[(])((?:20[2-9]\d))(?:[\])]*)$/);if(suffix)years.push(Number(suffix[1]));
  for(const m of v.matchAll(/令和\s*(元|\d{1,2})\s*年(?:度)?(?:版|受験用)/g))years.push(m[1]==='元'?2019:2018+Number(m[1]));
  if(index===1)for(const m of v.matchAll(/20\d{2}/g))years.push(Number(m[0]));
  if(years.length)return Math.max(...years);
 }
 return null;
}
function numeral(s){if(/^\d+$/.test(s))return Number(s);const n={'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};if(s.includes('十')){const [a,b]=s.split('十');return (n[a]||1)*10+(n[b]||0);}return n[s]||null;}
function editionNumber(b){const m=(text(b.edition)+' '+text(b.title)).match(/(?:第\s*)?([\d一二三四五六七八九十]+)\s*(?:訂|改訂)?版/);if(m)return numeral(m[1]);const english=(text(b.edition)+' '+text(b.title)).match(/(\d+)(?:st|nd|rd|th)\s+edition/i);return english?Number(english[1]):null;}
function family(b){return [text(b.publisher),text(b.subject),text(String(b.title).replace(/Ⅲ/g,'3').replace(/Ⅱ/g,'2').replace(/Ⅰ/g,'1')).replace(/(?:第\s*)?[\d一二三四五六七八九十]+\s*(?:訂|改訂)版/g,'').replace(/(?:20\d{2}|['’]\d{2}|令和\d{1,2})(?:\s*[-〜~～・/]\s*(?:20\d{2}|\d{2}))*\s*年(?:度)?(?:版|受験用)?/g,'').replace(/(?:^|[\s.\[(])20[2-9]\d[\])]*$/,'')].join('|').normalize('NFKC').toLowerCase().replace(/[\s・,.:：〈〉<>「」『』()（）[\]［］+＋/-]/g,'');}
function currentIds(catalog,now=new Date()){
 const year=now.getFullYear(),groups=new Map(),rows=catalog.books.filter(b=>b.verified&&!b.excludedReason&&(!b.published||Number(b.published.slice(0,4))<=year));
 for(const b of rows){const key=family(b),y=annualYear(b),e=editionNumber(b),old=groups.get(key)||{year:0,edition:0};groups.set(key,{year:Math.max(old.year,y||0),edition:Math.max(old.edition,e||0)});}
 return new Set(rows.filter(b=>{const y=annualYear(b),e=editionNumber(b),latest=groups.get(family(b));return (!y||y>=year&&y>=latest.year)&&(!e||e>=latest.edition);}).map(b=>b.id));
}
root.BookRoutePolicy={recognition,annualYear,editionNumber,currentIds};if(typeof module!=='undefined')module.exports=root.BookRoutePolicy;
})(typeof globalThis!=='undefined'?globalThis:this);
