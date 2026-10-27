(function(root){
'use strict';
const policy=root.BookRoutePolicy||(typeof module!=='undefined'?require('./book-route-policy.js'):null);
const admissions=root.BookRouteAdmissions||(typeof module!=='undefined'?require('./book-route-admissions.js'):null);
const universities='北海道大学,東北大学,東京大学,京都大学,大阪大学,九州大学,名古屋大学,筑波大学,千葉大学,横浜国立大学,東京科学大学,一橋大学,東京外国語大学,東京学芸大学,東京農工大学,電気通信大学,お茶の水女子大学,埼玉大学,横浜市立大学,東京都立大学,神戸大学,大阪公立大学,広島大学,岡山大学,金沢大学,新潟大学,信州大学,静岡大学,岐阜大学,三重大学,滋賀大学,奈良女子大学,和歌山大学,山口大学,鳥取大学,島根大学,徳島大学,香川大学,愛媛大学,高知大学,熊本大学,長崎大学,大分大学,宮崎大学,鹿児島大学,琉球大学,弘前大学,岩手大学,秋田大学,山形大学,福島大学,茨城大学,宇都宮大学,群馬大学,山梨大学,富山大学,福井大学,佐賀大学,早稲田大学,慶應義塾大学,上智大学,東京理科大学,国際基督教大学,明治大学,青山学院大学,立教大学,中央大学,法政大学,学習院大学,同志社大学,立命館大学,関西大学,関西学院大学,日本大学,東洋大学,駒澤大学,専修大学,京都産業大学,近畿大学,甲南大学,龍谷大学,成蹊大学,成城大学,明治学院大学,南山大学,西南学院大学,福岡大学,その他の大学,志望校はまだ決まっていない'.split(',');
const categories=['大学入試','高校入試','共通テスト','英検','TOEIC','資格試験','その他'];
const supportedQualifications=new Set(['ITパスポート','基本情報技術者','応用情報技術者','日商簿記3級','日商簿記2級','FP3級','FP2級','宅建','行政書士','社会保険労務士','登録販売者','危険物乙4','漢検2級','漢検準2級','漢検3級','IELTS','TOEFL']);
const subjects=['英語','数学','国語','物理','化学','生物','日本史','世界史','地理','地学','情報','公共','政治経済','倫理'];
const unitMap={英語:['全範囲','英文法','英単語','英語長文','英文解釈','英語リスニング','英作文','面接'],数学:['全範囲','数学Ⅰ・A','数学Ⅱ・B＋ベクトル','数学Ⅲ・C','二次関数','図形','確率','整数','データ','三角関数','指数対数','微分積分','数列','ベクトル','統計','極限','複素数'],国語:['全範囲','現代文','古文','漢文'],物理:['全範囲','力学','波動','熱','電磁気','原子'],化学:['全範囲','理論','無機','有機'],生物:['全範囲','生物基礎','遺伝','代謝','生態'],日本史:['全範囲','通史','用語'],世界史:['全範囲','通史','用語'],理科:['全範囲','物理分野','化学分野','生物分野','地学分野'],社会:['全範囲','地理分野','歴史分野','公民分野']};
const options=list=>list.map((label,i)=>({value:String(i+1),label,stage:i+1}));
function subject(a){return ['英検','TOEIC'].includes(a.category)?'英語':['資格試験','その他'].includes(a.category)?'全科目':a.subject;}
function baseContext(a){
 const s=subject(a),u=a.unit||'全範囲';
 if(a.category==='TOEIC')return {current:options(['未受験、または400点未満','400〜595点くらい','600〜795点くらい','800点以上']),target:options(['500点を目指したい','650点を目指したい','800点を目指したい','900点以上を目指したい'])};
 if(s==='数学'){const prefix=u==='全範囲'?'数学':u;return {current:options([prefix+'の基本知識がまだ定着しておらず、基本問題を解くのが難しい',prefix+'の基本問題・典型問題はある程度解ける',prefix+'の標準問題は解けるが、応用問題でつまずく',prefix+'の応用問題も解け、難問や記述力を伸ばしたい']),target:options([prefix+'の基本知識と公式を身につけたい',prefix+'の基本問題・典型問題を確実に解きたい',prefix+'の標準〜応用問題を安定して解きたい',prefix+'の難関校の問題・記述問題に対応したい'])};}
 if(s==='英語'){
  let now,goal;
  if(/文法/.test(u)){now=['英文の基本構造や文法用語から確認したい','基本的な文法問題は解けるが、時制・関係詞などで迷う','標準的な文法問題は解けるが、語法や応用問題が苦手','文法・語法はおおむね理解し、難しい問題にも取り組める'];goal=['文の成り立ちと基本文法を理解したい','基本的な文法問題を確実に解きたい','文法・語法の標準〜応用問題を得点源にしたい','難関校の文法・語法問題にも対応したい'];}
  else if(/リスニング/.test(u)){now=['単語の音や短い英文を聞き取るのが難しい','ゆっくりした短い会話なら内容がわかる','標準的な会話はわかるが、長い音声や細部を聞き逃す','長い音声も理解でき、速い音声や細部を伸ばしたい'];goal=['単語の音と短い英文を聞き取れるようになりたい','基本的な会話の内容をつかみたい','試験の標準的な音声を正確に聞き取りたい','速い音声や細部まで理解し、高得点を目指したい'];}
  else if(/長文|解釈/.test(u)){now=['単語や一文の意味を理解するのが難しい','短い英文は読めるが、長文になると内容を見失う','標準的な長文は読めるが、複雑な構文や設問が苦手','長文の内容を理解でき、難しい文章の精度を高めたい'];goal=['単語と一文の意味を理解したい','短い文章を正確に読めるようになりたい','試験の標準的な長文を正確に読み解きたい','難関校の長文・記述問題にも対応したい'];}
  else if(/英単語/.test(u)){now=['基礎的な英単語の意味から覚えたい','基本的な単語はわかるが、試験の文章には未知語が多い','標準的な単語はわかるが、派生語や多義語が苦手','語彙は身についており、難しい表現まで増やしたい'];goal=['基礎的な英単語を覚えたい','試験でよく使われる基本単語を定着させたい','標準的な語彙・派生語まで身につけたい','難しい文章で使われる語彙まで増やしたい'];}
  else if(/英作文|面接/.test(u)){now=['伝えたい内容を英文にするのが難しい','簡単な文なら作れるが、誤りが多い','自分の考えを伝えられるが、構成や表現に課題がある','論理的に伝えられ、自然さや表現の幅を伸ばしたい'];goal=['短い英文で伝えられるようになりたい','基本的な表現で正確に伝えたい','理由や具体例を添えて自分の意見を伝えたい','論理的な構成と豊かな表現で高得点を目指したい'];}
  else{now=['単語・文法の基礎から確認したい','基本的な英文はわかるが、試験の問題には不安がある','標準的な問題は解けるが、応用問題や細部が苦手','標準的な問題は安定して解け、難しい問題を伸ばしたい'];goal=['単語・文法の基礎を身につけたい','試験の基本問題を安定して解きたい','標準〜応用問題で得点を伸ばしたい','難しい問題にも対応して高得点を目指したい'];}
  return {current:options(now),target:a.category==='英検'?options([a.exam+'の基礎知識を身につけたい',a.exam+'の基本問題を解けるようになりたい',a.exam+'の合格を目指したい',a.exam+'で余裕を持って合格できる力をつけたい']).map(o=>({...o,stage:Math.max(o.stage,/準1級|英検1級/.test(a.exam)?4:/英検準2級プラス|英検2級/.test(a.exam)?3:/準2|3級/.test(a.exam)?2:1)})):options(goal)};
 }
 if(a.category==='共通テスト')return {current:options(['基本事項の理解に不安がある（得点率4割未満が目安）','基本事項はある程度わかる（得点率4〜6割が目安）','標準問題はある程度解ける（得点率6〜8割が目安）','得点率8割以上で、失点を減らしたい']),target:options(['まずは基礎を固めたい','共通テストで6割を目指したい','共通テストで8割を目指したい','共通テストで9割以上を目指したい'])};
 if(s==='国語')return {current:options([u+'の語彙・基本事項から確認したい','基本的な文章は読めるが、設問の根拠をつかめない','標準的な文章は読めるが、選択肢の判断や記述が苦手','根拠をもとに解答でき、難しい文章や記述力を伸ばしたい']),target:options(['語彙と読解の基本を身につけたい','文章の要点をつかみ、基本問題を解きたい','根拠に基づき、標準的な設問に正確に答えたい','難しい文章の読解や記述問題で高得点を目指したい'])};
 if(['資格試験','その他'].includes(a.category))return {current:options([a.exam+'の専門用語・基礎知識をまだ学んでいない','基礎知識は学んだが、基本問題で迷う','基本問題は解けるが、過去問・応用問題に課題がある','過去問はある程度解け、合格の確実性を高めたい']),target:options(['試験の基礎知識を一通り理解したい','出題範囲の基本問題を解けるようになりたい','過去問・本試験で合格点を取れるようになりたい','苦手分野をなくして、余裕を持って合格したい'])};
 if(['物理','化学','生物','地学','理科','情報'].includes(s))return {current:options(['用語・仕組み・公式などの基本知識から確認したい','基本事項は理解しているが、問題での使い方に迷う','典型問題は解けるが、複数の知識を使う問題が苦手','標準的な問題は解け、応用・考察問題を伸ばしたい']),target:options(['用語・仕組み・公式を理解したい','典型問題を自力で解けるようになりたい','知識を組み合わせて標準〜応用問題を解きたい','難しい考察問題・記述問題にも対応したい'])};
 return {current:options(['用語や全体の流れをまだ十分に理解していない','基本用語は覚えているが、つながりの理解が不十分','標準的な問題は解けるが、資料問題や説明問題が苦手','知識のつながりを理解し、応用・記述を伸ばしたい']),target:options(['基本用語と全体の流れを身につけたい','重要事項のつながりを理解して基本問題を解きたい','資料や根拠を読み取り、標準〜応用問題を解きたい','論述・記述も含めて難しい問題に対応したい'])};
}
function targetOptions(a){
 const choices=(labels,stages)=>labels.map((label,i)=>({value:String(i+1),label,stage:stages[i]}));
 if(a.category==='TOEIC')return choices(['500点','650点','800点','900点以上'],[1,2,3,4]);
 if(a.category==='英検'){const grade=/準1級|英検1級/.test(a.exam)?4:/英検準2級プラス|英検2級/.test(a.exam)?3:/準2|3級/.test(a.exam)?2:1;return choices(['各試験段階の合格基準スコアを満たしたい','合格基準を余裕を持って上回るCSEスコアを目指したい','CSEスコアの満点に近づきたい'],[grade,Math.min(4,grade+1),4]);}
 if(a.exam==='IELTS')return choices(['バンド4.5','バンド5.5','バンド6.5','バンド7.5以上'],[1,2,3,4]);
 if(a.exam==='TOEFL')return choices(['スコア3.0','スコア4.0','スコア5.0','スコア5.5以上'],[1,2,3,4]);
 if(/日商簿記[23]級/.test(a.exam))return choices(['70点以上（100点満点）','80点以上（100点満点）','90点以上（100点満点）'],[2,3,4]);
 if(/FP[23]級/.test(a.exam))return choices(['学科・実技ともに6割以上','学科・実技ともに8割以上','学科・実技ともに9割以上'],[2,3,4]);
 if(a.exam==='ITパスポート')return choices(['総合評価点600点以上（分野別の基準も満たす）','総合評価点800点以上','総合評価点900点以上'],[2,3,4]);
 if(a.exam==='基本情報技術者')return choices(['科目A・Bともに評価点600点以上','科目A・Bともに評価点800点以上','科目A・Bともに評価点900点以上'],[2,3,4]);
 if(['資格試験','その他'].includes(a.category))return choices(['試験の合格基準を満たす得点','合格基準を余裕を持って上回る得点','満点に近い得点'],[2,3,4]);
 return [10,20,30,40,50,60,70,80,90].map(percent=>({value:'rate-'+percent,label:'得点率'+percent+'%'+(percent===90?'以上':'')+'（'+(percent/10)+'割'+(percent===90?'以上':'')+'）',stage:percent<60?1:percent===60?2:percent<90?3:4}));
}
// Assess each exam in its own terms; numeric stages remain stable for routing.
function currentOptions(a){
 const s=subject(a),u=a.unit||'全範囲',exam=a.exam||'受験する試験';
 if(a.category==='英検'){
  let labels;
  if(u==='英文法')labels=['英文の形や文法の理解から始めたい','文法を学んだことはあるが、英文の意味や形で迷う','文法は理解しているが、読解や英作文で使いこなせない','文法を使って英文を理解・表現でき、誤りを減らしたい'];
  else if(u==='英単語')labels=['出題される単語の多くがわからない','見覚えのある単語は増えたが、意味を思い出せないことが多い','よく出る単語はわかるが、熟語や文脈中の意味で迷う','過去問の単語はおおむねわかり、語彙による失点を減らしたい'];
  else if(u==='英語長文'||u==='英文解釈')labels=['過去問の英文は、単語や一文の意味をつかむのが難しい','一文ずつは読めるが、文章全体の内容をつかめない','文章の大意はわかるが、根拠を探して選ぶ設問で迷う','時間内に文章を読み、設問の多くに正解できる'];
  else if(u==='英語リスニング')labels=['過去問の音声は、単語や短い文を聞き取るのが難しい','一部の単語や短い文は聞き取れるが、話の内容をつかめない','話の大意はわかるが、細部や選択肢の判断で失点する','過去問の音声を聞き、設問の多くに正解できる'];
  else if(u==='英作文')labels=['課題に合った英文を作るところから学びたい','短い英文は書けるが、文法・語彙の誤りが多い','課題に沿って書けるが、内容・構成や表現に課題がある','課題に沿って時間内に書け、内容・構成・語彙・文法の精度を高めたい'];
  else if(u==='面接')labels=['面接の流れや、質問への答え方から学びたい','質問の一部はわかるが、英語で答えるのが難しい','質問に答えられるが、説明の詳しさや流暢さに課題がある','面接形式で受け答えでき、内容・語彙・発音の精度を高めたい'];
  else labels=['単語・文法の理解から始めたい','読解・リスニングの過去問は、正解が半分未満','読解・リスニングの過去問は、半分以上正解できるが安定しない','読解・リスニングの過去問は、多くに正解できている'];
  return options(labels.map(label=>exam+'：'+label));
 }
 if(a.category==='TOEIC')return options(['未受験で基礎から学びたい、または現在400点未満','現在400〜595点くらい','現在600〜795点くらい','現在800点以上']);
 if(exam==='IELTS')return options(['未受験で基礎から学びたい、または現在のOverallバンド4.5未満','現在のOverallバンド4.5以上・5.5未満','現在のOverallバンド5.5以上・6.5未満','現在のOverallバンド6.5以上']);
 if(exam==='TOEFL')return options(['未受験で基礎から学びたい、または現在の総合スコア3.0未満','現在の総合スコア3.0以上・4.0未満','現在の総合スコア4.0以上・5.0未満','現在の総合スコア5.0以上']);
 if(a.category==='共通テスト')return options([
  '共通テストの'+s+'：基本知識から確認したい（得点率4割未満が目安）',
  '共通テストの'+s+'：基本・典型問題はある程度解ける（得点率4割以上・6割未満が目安）',
  '共通テストの'+s+'：知識はあるが、試験形式の設問で失点する（得点率6割以上・8割未満が目安）',
  '共通テストの'+s+'：時間内に解き、得点率8割以上を取れている'
 ]);
 const qualification={
  'ITパスポート':['IT・経営・管理の用語から学びたい','用語は学んだが、ストラテジ・マネジメント・テクノロジの区別で迷う','過去問は解けるが、計算や特定の分野で失点する','過去問演習で総合・分野別の合格基準を安定して満たしている'],
  '基本情報技術者':['ITの基礎知識やプログラムの読み方から学びたい','科目Aの知識を学んでいるが、科目Bのアルゴリズムを追うのが難しい','科目Aはある程度解けるが、科目Bのアルゴリズム・情報セキュリティで失点する','科目A・Bの公開問題や模擬問題で、合格基準を安定して満たしている'],
  '応用情報技術者':['基本情報相当の知識から確認したい','試験範囲の知識はあるが、状況に応じた技術・管理手法の判断で迷う','知識を使う問題は解けるが、事例の読み取りや分野横断の問題で失点する','受験する試験形式の演習で、合格基準を安定して満たしている'],
  '日商簿記3級':['仕訳・勘定科目の意味から学びたい','日々の仕訳はできるが、決算整理や試算表で迷う','決算まで理解しているが、精算表・財務諸表や時間配分で失点する','本試験形式の問題で、時間内に合格点を安定して取れている'],
  '日商簿記2級':['3級の内容を確認し、商業簿記・工業簿記をこれから学びたい','商業簿記・工業簿記を学んだが、仕訳や原価計算で迷う','仕訳・原価計算はできるが、連結会計などの総合問題で失点する','商業簿記・工業簿記の本試験形式で、時間内に合格点を安定して取れている'],
  'FP3級':['お金・保険・税金・年金などの用語から学びたい','6分野の基礎は学んだが、制度や計算方法で迷う','学科はある程度解けるが、実技の事例・計算問題で失点する','受験する実技科目と学科の両方で、合格点を安定して取れている'],
  'FP2級':['3級相当の内容を確認し、2級の制度・計算をこれから学びたい','6分野を学んだが、制度の適用条件や計算で迷う','学科はある程度解けるが、実技の事例判断・計算で失点する','受験する実技科目と学科の両方で、合格点を安定して取れている'],
  '宅建':['法律用語や宅建業法・権利関係の仕組みから学びたい','出題分野を一通り学んだが、条文や制度の区別で迷う','過去問はある程度解けるが、事例・個数問題や法令上の制限で失点する','受験年度に対応した模擬試験で、合格目安の得点を安定して取れている'],
  '行政書士':['行政法・民法などの法律用語と仕組みから学びたい','法律の基礎は学んだが、条文・判例の理解に不安がある','択一式はある程度解けるが、事例判断や記述式で失点する','本試験形式の演習で、総得点・各区分の合格基準を安定して満たしている'],
  '社会保険労務士':['労働・社会保険の用語や制度から学びたい','各制度を一通り学んだが、給付要件や数字を混同する','過去問はある程度解けるが、選択式の穴埋めや科目ごとの得点に波がある','択一式・選択式の演習で、総得点・科目別の基準を安定して満たしている'],
  '登録販売者':['医薬品・人体・法規の用語から学びたい','出題範囲は学んだが、成分の効能・副作用・注意点を混同する','過去問はある程度解けるが、医薬品や法規など特定の分野で失点する','受験地の試験形式で、総得点・分野別の基準を安定して満たしている'],
  '危険物乙4':['化学・燃焼や危険物の性質から学びたい','3科目を学んだが、法令・性質・消火方法の区別で迷う','過去問はある程度解けるが、法令・物理化学・性質と消火の得点に波がある','本試験形式の演習で、3科目それぞれの合格基準を安定して満たしている']
 };
 if(qualification[exam])return options(qualification[exam].map(label=>exam+'：'+label));
 if(/^漢検(?:準2|[23])級$/.test(exam))return options(['対象の漢字の読み・書きから学びたい','読みはある程度わかるが、書き取りや熟語で迷う','過去問はある程度解けるが、部首・四字熟語・対義語などで失点する','過去問で合格目安の得点を安定して取れている'].map(label=>exam+'：'+label));
 if(['資格試験','その他'].includes(a.category))return options([exam+'の出題内容・専門用語から学びたい',exam+'の出題範囲は学んだが、知識を問う設問で迷う',exam+'の過去問は解いたことがあるが、合格基準には届いていない',exam+'の本試験形式の演習で、合格基準を安定して満たしている']);
 const answers=s==='数学'?{...a,unit:'全範囲'}:a,current=baseContext(answers).current;
 return a.category==='高校入試'?current.map(o=>({...o,label:'高校入試の'+s+'：'+o.label})):current;
}
function levelQuestion(a){
 if(a.category==='英検')return {title:(a.exam||'受験する級')+'の理解度に近いものは？',note:!a.unit||a.unit==='全範囲'?'正答の割合は理解度の目安です。英検CSEスコアや合否を表すものではありません。':''};
 if(a.category==='TOEIC')return {title:'現在のTOEIC L&Rスコアに近いものは？',note:'リスニング・リーディングの合計スコア（990点満点）を目安に選んでください。'};
 if(a.exam==='IELTS')return {title:'現在のIELTS Overallバンドに近いものは？',note:'4技能を合わせたOverallバンドを目安に選んでください。'};
 if(a.exam==='TOEFL')return {title:'現在のTOEFL iBT総合スコアに近いものは？',note:'2026年導入の1〜6のスコア尺度を目安に選んでください。'};
 return {title:'今の理解度に近いものはどれですか？',note:a.category==='共通テスト'?'選択した教科の過去問・模試の得点率などを目安に選んでください。':''};
}
function context(a,catalog){const assessment=a.category==='大学入試'&&catalog&&admissions.profile(a,catalog).method?.stage==='common'?{...a,category:'共通テスト'}:a;return {current:currentOptions(assessment),target:targetOptions(a)};}
function isoDay(date=new Date()){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
function remainingDays(value,now=new Date()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))throw Error('試験日を選んでください。');
 const end=Date.parse(value+'T00:00:00Z');if(!Number.isFinite(end)||new Date(end).toISOString().slice(0,10)!==value)throw Error('有効な試験日を選んでください。');
 const days=Math.round((end-Date.parse(isoDay(now)+'T00:00:00Z'))/86400000);
 if(days<0)throw Error('今日以降の試験日を選んでください。');if(days>3650)throw Error('試験日は10年以内の日付を選んでください。');return days;
}
function ownedBooks(a,catalog){
 const s=subject(a),domain=a.category==='高校入試'?'junior':['大学入試','共通テスト'].includes(a.category)?'entrance':a.category==='英検'?'eiken':a.category==='TOEIC'?'toeic':'qualification';
 const grade=(a.exam||'').replace(/^英検/,'');
 const scope=a.category==='大学入試'?admissions.profile(a,catalog).method?.scope:a.category==='共通テスト'?{mathIII:false}:{};const currentBooks=policy.currentIds(catalog);return catalog.books.filter(b=>policy.bookFitsScope(b,scope)&&b.verified&&!b.excludedReason&&currentBooks.has(b.id)&&b.domain===domain&&(!b.examScopes||b.examScopes.some(exam=>(a.exam||'').includes(exam)))&&(s==='全科目'||b.subject===s)&&(domain!=='eiken'||b.exams.includes(grade))&&(domain!=='qualification'||b.exams.includes(a.exam)));
}
function suggestedOwnedBooks(a,catalog,limit=6){
 const unit=({'英文法':'文法','英単語':'単語','英語長文':'長文','英語リスニング':'リスニング'})[a.unit]||a.unit;
 const books=ownedBooks(a,catalog).filter(b=>policy.recognition(b)&&!/(?:シリーズ対応|準拠|完成ノート|書き覚えノート|教科書傍用|Set up)/i.test(b.title)&&(!unit||unit==='全範囲'||b.skills.some(skill=>skill.includes(unit)||unit.includes(skill)||(unit==='長文'&&skill==='読解'))));
 books.sort((x,y)=>Number(/^book-/.test(y.id))-Number(/^book-/.test(x.id))||Math.abs(x.stage-Number(a.level||1))-Math.abs(y.stage-Number(a.level||1))||x.title.localeCompare(y.title,'ja'));
 const counts=new Map(),series=new Set(books.map(b=>policy.recognition(b).name)),cap=series.size>1?3:limit;
 return books.filter(b=>{const key=policy.recognition(b).name,count=counts.get(key)||0;if(count>=cap)return false;counts.set(key,count+1);return true;}).slice(0,limit);
}
function examOptions(a,catalog){if(a.category==='大学入試')return universities;if(a.category==='高校入試')return ['公立高校（標準）','公立高校（難関）','私立高校（標準）','私立高校（難関）','志望校はまだ決まっていない'];if(a.category==='英検')return ['英検5級','英検4級','英検3級','英検準2級','英検準2級プラス','英検2級','英検準1級','英検1級'];return [...new Set(catalog.books.filter(b=>b.domain==='qualification'&&b.verified&&!b.excludedReason).flatMap(b=>b.exams).filter(exam=>supportedQualifications.has(exam))),'その他の資格（未収録）'];}
function fields(a,catalog){const s=subject(a),qualification=['資格試験','その他'].includes(a.category),subList=a.category==='大学入試'?admissions.subjects(a,catalog):a.category==='高校入試'?['英語','数学','国語','理科','社会']:subjects,ctx=context(a,catalog),units=a.category==='英検'&&/英検[45]級/.test(a.exam)?['全範囲','英文法','英単語','英語長文','英語リスニング']:a.category==='TOEIC'?['全範囲','英文法','英単語','英語長文','英語リスニング']:a.category==='高校入試'&&s==='数学'?['全範囲','二次関数','図形','確率','データ']:qualification?['全範囲',...new Set(catalog.books.filter(b=>b.exams.includes(a.exam)).flatMap(b=>b.skills))]:(unitMap[s]||['全範囲']).slice();
 if(a.category==='大学入試'&&s==='英語'&&admissions.profile(a,catalog).method?.scope?.listening===false){const i=units.indexOf('英語リスニング');if(i>=0)units.splice(i,1);}
 const needsUnit=['英語','国語'].includes(s)||(qualification&&units.length>2);
 const scored=['大学入試','高校入試','共通テスト'].includes(a.category);
 return [{key:'category',title:'どの試験に向けて勉強しますか？',choices:categories},...(!a.category||['共通テスト','TOEIC'].includes(a.category)?[]:[{key:'exam',title:a.category==='大学入試'?'目指している大学はどこですか？':'受ける試験を選んでください',choices:examOptions(a,catalog),search:a.category==='大学入試'}]),{key:'date',title:'試験日を選んでください',type:'date'},...admissions.fields(a,catalog),...(['英検','TOEIC','資格試験','その他'].includes(a.category)?[]:[{key:'subject',title:'どの教科のルートを作りますか？',note:a.category==='大学入試'?(subList.length?'選択した学部・方式で受験できる科目だけを表示しています。':'この年度・学部・方式の科目は未確認です。前の質問で条件を変更してください。'):'',choices:subList}]),...(needsUnit?[{key:'unit',title:'取り組みたい単元・分野はどれですか？',choices:units}]:[]),{key:'level',...levelQuestion(a),choices:ctx.current},{key:'target',title:scored?'試験で目標にする得点率は？':'試験で目標にするスコアは？',note:scored?'選択した教科の満点に対する割合を選んでください。':a.category==='英検'?'級や試験段階ごとに異なる、公式の合格基準をもとに選んでください。':a.exam==='TOEFL'?'2026年導入の1〜6のスコア尺度です。':'',choices:ctx.target},{key:'owned',title:'持っている教材を選んでください',note:'複数選べます。',multi:true,choices:['この中には持っている教材がない',...ownedBooks(a,catalog).map(b=>({value:b.id,label:b.title+' ／ '+b.publisher,bookTitle:b.title,publisher:b.publisher}))]}];
}
function conditions(a,catalog){const ctx=context(a,catalog),cur=ctx.current.find(o=>o.value===a.level),target=ctx.target.find(o=>o.value===a.target);if(!cur||!target)throw Error('実力と目標を選び直してください。');const s=subject(a),selectedUnit=fields(a,catalog).some(f=>f.key==='unit')?(a.unit||'全範囲'):'全範囲',unit=selectedUnit==='全範囲'?'':selectedUnit;return {...(a.category==='共通テスト'?{examScope:{mathIII:false,listening:true}}:{}),...admissions.conditions(a,catalog),category:a.category,exam:['共通テスト','TOEIC'].includes(a.category)?a.category:a.exam,baseSubject:s,unit:selectedUnit,subject:s==='全科目'?(unit||'全科目'):s+(unit?'：'+unit:''),level:cur.label,target:target.label,currentStage:cur.stage,targetStage:target.stage,date:a.date,days:remainingDays(a.date),owned:ownedBooks(a,catalog).filter(b=>(a.owned||[]).includes(b.id)).map(b=>b.title).join('\n')};}
function mount(container,{loadCatalog,onSubmit}){let a={},index=0,catalog={books:[]},busy=false,epoch=0,ownedSearch='';const el=(tag,text,parent)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(parent)parent.append(n);return n;};
 container.id='routeWizard';container.setAttribute('aria-label','参考書ルートの質問');
 function render(focus){container.setAttribute('aria-busy',String(busy));const fs=fields(a,catalog);index=Math.min(index,fs.length-1);const f=fs[index];container.replaceChildren();container.dataset.step=f.key;const body=el('div','',container);body.className='route-question-body';const art=el('img','',body);art.className='route-question-art';art.src='assets/route-question-illustration.svg';art.alt='';art.setAttribute('aria-hidden','true');const title=el('h3',f.title,body);title.id='routeQuestionTitle';title.tabIndex=-1;if(f.note)el('p',f.note,body).className='route-question-note';if(f.source){const source=el('a','科目表を見る（河合塾 Kei-Net）',body);source.className='route-admissions-source';source.href=f.source;source.target='_blank';source.rel='noopener noreferrer';}let opts,ownedUpdate;const answered=()=>{if(f.type==='date'){try{remainingDays(a.date);return true}catch{return false}}return f.multi?Array.isArray(a[f.key])&&a[f.key].length>0&&(!f.count||a[f.key].length===f.count):!!a[f.key]};
 function choose(value){if(f.multi){let selected=a[f.key]||[];const none=f.key==='owned'?'この中には持っている教材がない':'特になし';if(value===none)selected=selected.includes(value)?[]:[value];else selected=selected.filter(v=>v!==none).includes(value)?selected.filter(v=>v!==value&&v!==none):selected.filter(v=>v!==none).concat(value);a[f.key]=selected;if(f.key==='examSubjects'||f.key.startsWith('elective-'))fs.slice(index+1).forEach(next=>delete a[next.key]);}else if(a[f.key]!==value){a[f.key]=value;if(['category','exam','date','faculty','department','admissionMethod','examSubjects','subject','unit'].includes(f.key)||f.key.startsWith('elective-')){ownedSearch='';fs.slice(index+1).forEach(next=>delete a[next.key]);}}
 body.querySelectorAll('button[role=radio],button[role=checkbox]').forEach(b=>b.setAttribute('aria-checked',String(f.multi?(a[f.key]||[]).includes(b.dataset.value):a[f.key]===b.dataset.value)));if(ownedUpdate)ownedUpdate();next.disabled=busy||!answered();error.textContent='';}
 if(f.type==='date'){const label=el('label','試験日',body),input=el('input','',label);label.className='route-date-field';input.type='date';input.id='routeExamDate';input.setAttribute('aria-label','試験日');input.min=isoDay();const max=new Date();max.setDate(max.getDate()+3650);input.max=isoDay(max);input.value=a.date||'';input.disabled=busy;input.oninput=()=>{choose(input.value);try{remainingDays(input.value)}catch(e){error.textContent=e.message;}};}
 else if(f.search){
  const searchBox=el('div','',body);searchBox.className='route-book-search route-university-search';
  const input=el('input','',searchBox);input.type='search';input.id='routeUniversitySearch';input.setAttribute('aria-label','大学名を検索');input.setAttribute('aria-controls','routeUniversityResults');input.autocomplete='off';input.placeholder='大学名を入力して検索';input.value=a[f.key]||'';input.disabled=busy;
  const clear=el('button','×',searchBox);clear.type='button';clear.setAttribute('aria-label','大学名の検索をクリア');clear.disabled=busy;
  const status=el('p','',body);status.className='route-owned-search-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  opts=el('div','',body);opts.id='routeUniversityResults';opts.className='route-question-options';opts.setAttribute('role','radiogroup');opts.setAttribute('aria-labelledby',title.id);
  const more=el('button','候補をさらに表示',body);more.type='button';more.className='route-owned-more';more.disabled=busy;let limit=12;
  const normalize=s=>String(s).normalize('NFKC').toLowerCase().replace(/慶應/g,'慶応').replace(/\s/g,'');
  const aliases={'東大':'東京大学','京大':'京都大学','阪大':'大阪大学','名大':'名古屋大学','北大':'北海道大学','九大':'九州大学','東北大':'東北大学','慶応':'慶應義塾大学','早大':'早稲田大学'};
  function search(){const raw=input.value.trim(),term=normalize(aliases[raw]||raw),fallback=f.choices.filter(c=>/その他|決まっていない/.test(c)),matches=term?f.choices.filter(c=>!fallback.includes(c)&&normalize(c).includes(term)):[];opts.replaceChildren();clear.hidden=!raw;status.textContent=fallback.includes(raw)&&a[f.key]===raw?'選択中：'+raw:term?(matches.length?matches.length+'校が見つかりました':'一致する大学が見つかりません。大学名を変えて検索してください。'):'大学名の一部から検索できます。';
   for(const name of [...matches.slice(0,limit),...fallback]){const button=option(name,opts),chooseOption=button.onclick;button.onclick=()=>{chooseOption();input.value=name;search();[...opts.querySelectorAll('button')].find(b=>b.dataset.value===name)?.focus({preventScroll:true});};}
   more.hidden=matches.length<=limit;
  }
  input.oninput=()=>{if(a[f.key])choose('');limit=12;search();};clear.onclick=()=>{input.value='';if(a[f.key])choose('');limit=12;search();input.focus();};input.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();opts.querySelector('button')?.focus();}};more.onclick=()=>{limit+=12;search();};search();
 }

 function option(choice,parent){const o=typeof choice==='string'?{value:choice,label:choice}:choice,b=el('button','',parent);const copy=el('span','',b);copy.className='route-option-label';if(o.bookTitle){el('span',o.bookTitle,copy).className='route-option-booktitle';el('small',o.publisher,copy).className='route-option-publisher';}else copy.textContent=o.label;const mark=el('span','',b);mark.className='route-option-mark';mark.setAttribute('aria-hidden','true');b.type='button';b.setAttribute('aria-label',o.label);b.dataset.value=o.value;b.setAttribute('role',f.multi?'checkbox':'radio');b.setAttribute('aria-checked',String(f.multi?(a[f.key]||[]).includes(o.value):a[f.key]===o.value));b.disabled=busy;b.onclick=()=>choose(o.value);if(!f.multi)b.onkeydown=e=>{if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const buttons=Array.from(opts.querySelectorAll('button')),i=buttons.indexOf(b),delta=['ArrowDown','ArrowRight'].includes(e.key)?1:-1,target=buttons[(i+delta+buttons.length)%buttons.length];target.click();target.focus();};return b;}
 if(f.type!=='date'&&!f.select&&!f.search){
  if(f.key==='owned'){
   const searchBox=el('div','',body);searchBox.className='route-book-search';const icon=el('span','',searchBox);icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';
   const input=el('input','',searchBox);input.type='search';input.id='routeOwnedSearch';input.setAttribute('aria-label','書名・出版社で教材を検索');input.placeholder='書名・出版社で検索';input.autocomplete='off';input.value=ownedSearch;input.disabled=busy;
   const clear=el('button','×',searchBox);clear.type='button';clear.setAttribute('aria-label','検索語をクリア');clear.disabled=busy;
   const selected=el('div','',body);selected.className='route-owned-selected';
   const none=el('div','',body);none.className='route-question-options route-owned-none';option(f.choices[0],none);
   const suggestions=suggestedOwnedBooks(a,catalog),suggestedIds=new Set(suggestions.map(b=>b.id));
   const status=el('p','',body);status.id='routeOwnedSearchStatus';status.className='route-owned-search-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
   opts=el('div','',body);opts.className='route-question-options';opts.setAttribute('role','group');opts.setAttribute('aria-labelledby',title.id);
   const more=el('button','さらに表示',body);more.type='button';more.className='route-owned-more';more.disabled=busy;
   const books=f.choices.filter(o=>typeof o==='object'),normalize=s=>String(s).normalize('NFKC').toLocaleLowerCase('ja').replace(/[\s・＋+〔〕［］「」!！、,\-]/g,'');let limit=30;
   function search(){const terms=ownedSearch.normalize('NFKC').trim().split(/\s+/).map(normalize).filter(Boolean),matches=terms.length?books.filter(o=>terms.every(t=>normalize(o.label).includes(t))):books.filter(o=>suggestedIds.has(o.value));opts.replaceChildren();if(!terms.length&&matches.length){const heading=el('p','定番の参考書から選ぶ',opts);heading.className='route-owned-suggestions-title';}matches.slice(0,limit).forEach(o=>option(o,opts));clear.hidden=!ownedSearch;more.hidden=matches.length<=limit;status.textContent=!terms.length?(matches.length?'選択した教科・分野の定番教材です。検索してほかの教材も探せます。':'書名の一部や出版社名から検索できます。'):matches.length?matches.length+'件'+(matches.length>limit?'（先頭'+limit+'件を表示）':''):'一致する教材が見つかりません。別のキーワードで検索してください。';}
   ownedUpdate=()=>{selected.replaceChildren();const chosen=books.filter(o=>(a.owned||[]).includes(o.value));selected.hidden=!chosen.length;if(chosen.length){el('p','選択済み '+chosen.length+'冊',selected);const list=el('div','',selected);list.className='route-owned-chips';for(const o of chosen){const remove=el('button','',list);remove.type='button';remove.disabled=busy;remove.setAttribute('aria-label',o.bookTitle+'の選択を解除');el('span',o.bookTitle,remove);const x=el('span','×',remove);x.setAttribute('aria-hidden','true');remove.onclick=()=>{choose(o.value);input.focus({preventScroll:true});};}}};
   input.oninput=()=>{ownedSearch=input.value;limit=30;search();};clear.onclick=()=>{ownedSearch='';input.value='';limit=30;search();input.focus({preventScroll:true});};more.onclick=()=>{limit+=30;search();};search();ownedUpdate();
  }else{opts=el('div','',body);opts.className='route-question-options';opts.setAttribute('role',f.multi?'group':'radiogroup');opts.setAttribute('aria-labelledby',title.id);f.choices.forEach(o=>option(o,opts));}
 }
 const error=el('p','',body);error.id='routeQuestionError';error.setAttribute('role','alert');const actions=el('div','',container);actions.className='route-wizard-actions';const back=el('button','',actions);back.setAttribute('aria-label','戻る');back.title='戻る';back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>';back.type='button';back.disabled=busy||index===0;back.onclick=()=>{index--;render(true)};const track=el('div','',container);container.prepend(track);track.className='route-question-track';el('p',(index+1)+' / '+fs.length+' 問',track).id='routeQuestionProgress';const p=el('progress','',track);p.max=fs.length;p.value=index+1;p.setAttribute('aria-label','質問の進み具合：'+(index+1)+' / '+fs.length+' 問');const next=el('button','',actions);next.setAttribute('aria-label',index===fs.length-1?'ルートを提案する':'次へ');next.title=index===fs.length-1?'ルートを提案する':'次へ';next.textContent=busy?'ルートを作成中…':next.title;next.type='button';next.id='routeQuestionNext';next.className='main';next.disabled=busy||!answered();next.onclick=async()=>{if(!answered())return;if(index<fields(a,catalog).length-1){index++;render(true);return;}const started=epoch;busy=true;render(false);let failure='';try{await onSubmit(conditions(a,catalog));}catch(e){failure=e.message;}finally{if(started!==epoch)return;busy=false;render(false);if(failure)container.querySelector('#routeQuestionError').textContent=failure;}};if(focus)title.focus();}
 render(false);loadCatalog().then(data=>{catalog=data;render(false)}).catch(error=>{container.querySelector('#routeQuestionError').textContent=error.message;const retry=el('button','教材データを再読み込み',container);retry.type='button';retry.onclick=()=>loadCatalog().then(data=>{catalog=data;render(false)}).catch(e=>{container.querySelector('#routeQuestionError').textContent=e.message});});
 return {reset(){epoch++;busy=false;a={};ownedSearch='';index=0;render(false)}};
}
root.BookRouteQuestions={context,fields,conditions,mount,remainingDays,ownedBooks,suggestedOwnedBooks,supportedQualifications};if(typeof module!=='undefined')module.exports=root.BookRouteQuestions;
})(typeof globalThis!=='undefined'?globalThis:this);
