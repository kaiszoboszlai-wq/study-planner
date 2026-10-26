(function(root){
'use strict';
// Editorial summaries based on the registered book/series; no runtime model calls.
function features(book){
 if(book.features)return book.features;
 const t=book.title||'';
 if(/ターゲット/.test(t))return '頻出度を意識して単語を整理した単語帳。覚える語彙の優先順位をつけやすい構成です。';
 if(/でる順パス単/.test(t))return '受験級に合わせた頻出語彙をまとめた単語帳。英検の語彙対策に焦点を当てられます。';
 if(/ゼロから英文法/.test(t))return '英文法の基本を理解から積み上げる解説書。文の仕組みを基礎から確認できます。';
 if(/読解のための英文法/.test(t))return '英文を読むための文法・構文に焦点を当てた教材。文法知識を読解につなげられます。';
 if(/ポラリス|全レベル問題集.*英語長文/.test(t))return '難易度別に長文をまとめた問題集。今の実力に近い英文から読解力を伸ばせます。';
 if(/Next Stage|英文法レベル別問題集/.test(t))return '文法・語法の重要事項を問題形式で確認できる教材。知識の抜けを見つけやすい構成です。';
 if(/英文解釈の技術/.test(t))return '英文の構造を捉える考え方を整理した教材。複雑な一文を読み解く力を養えます。';
 if(/入門問題精講/.test(t))return '基本概念と考え方を丁寧に整理した教材。基礎知識と問題のつながりをつかみやすい構成です。';
 if(/基礎問題精講/.test(t))return '入試の基本・典型問題を厳選した問題集。要点の整理と解説を通して解法の土台を固められます。';
 if(/標準問題精講/.test(t))return '入試の標準〜応用問題を扱う問題集。基本知識を組み合わせる考え方を深められます。';
 if(/物理のエッセンス/.test(t))return '物理の重要な考え方と典型的な解法をコンパクトに整理。現象と公式のつながりを確認できます。';
 if(/名問の森/.test(t))return '入試の良問を通して物理の理解を深める問題集。複数の考え方を使う応用問題に取り組めます。';
 if(/重要問題集/.test(t))return '入試で重要な問題をまとめた演習書。分野ごとの理解と応用力を確認できます。';
 if(/ひとつひとつわかりやすく/.test(t))return 'やさしい解説と基本問題を組み合わせた教材。基礎の確認や学び直しに向いています。';
 if(/一問一答|漢字学習ステップ/.test(t))return '重要な知識を項目ごとに確認できる教材。覚えている内容と曖昧な内容を整理しやすい構成です。';
 if(/用語集|キーワード/.test(t))return '重要語句の意味や関連事項を調べやすい資料集。知識を整理する際に役立ちます。';
 if(/詳説/.test(t))return '出来事や背景を体系的にまとめた教材。用語だけでなく、全体の流れを理解できます。';
 if(/過去|本試験問題集/.test(t))return '試験形式の問題をまとめた教材。出題される内容や問われ方を把握できます。';
 if(/公式TOEIC/.test(t))return 'TOEICの公式教材。試験の出題形式や英語の難易度を確かめられます。';
 if(/TOEIC.*特急/.test(t))return 'TOEICのパートに焦点を当てたコンパクトな教材。対策したい出題形式に絞れます。';
 if(/総合対策教本/.test(t))return '受験級の出題分野をまとめた対策書。試験全体の基本事項を確認できます。';
 if(/スッキリわかる|教科書/.test(t))return '試験で必要な基本事項を体系的に整理した解説教材。初学者が全体像をつかむのに適しています。';
 if(/問題集/.test(t))return '試験範囲の知識を問題形式で確認できる演習教材。理解が曖昧な項目を見つけられます。';
 if(/IELTS.*英単語/.test(t))return 'IELTSに向けた語彙をまとめた単語帳。試験で使われる表現を増やす対策に適しています。';
 if(/マドンナ古文/.test(t))return '古文の基礎事項をやさしく解説した教材。古文への苦手意識がある段階から取り組めます。';
 if(/漢文ヤマのヤマ/.test(t))return '漢文の重要句法を整理した教材。読解の土台となる知識をまとめて確認できます。';
 if(/リスニング/.test(t))return 'リスニングの出題に焦点を当てた教材。試験で必要な聞き取りのポイントを確認できます。';
 return (book.stage<=2?'基本事項を確認するための教材。':'標準〜応用の内容を扱う教材。')+'「'+(book.subject||'対象分野')+'」の理解を整理できます。';
}
function price(book){if(Number.isFinite(book.price)&&book.price>=0)return {label:'¥'+book.price.toLocaleString('ja-JP'),kind:'参考価格'};if(book.priceLabel)return {label:/^\d+円$/.test(book.priceLabel)?Number(book.priceLabel.slice(0,-1)).toLocaleString('ja-JP')+'円':book.priceLabel,kind:'書誌価格'};return {label:'価格未登録',kind:''};}
root.BookRouteFeatures={features,price};if(typeof module!=='undefined')module.exports=root.BookRouteFeatures;
})(typeof globalThis!=='undefined'?globalThis:this);
