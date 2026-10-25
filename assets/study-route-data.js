(function(root){
'use strict';
const catalog={version:1,status:'draft',scope:'中学英語・高校英語・中学数学・高校数学ⅠA。書籍の現行版・目次の照合は未実施。',books:[
{id:'em-basic',subject:'english',stage:'middle',rank:0,title:'中学英語をもう一度ひとつひとつわかりやすく。',kind:'文法の基礎',use:'説明と例文を読み、対応する基本問題を解く。間違えた問題は翌日に解き直す。',check:'学習した単元の基本問題を、理由を説明しながら8割程度解ける。'},
{id:'eh-basic',subject:'english',stage:'high',rank:0,title:'大岩のいちばんはじめの英文法【超基礎文法編】',kind:'文法の基礎',use:'例文の意味と語順を説明してから、確認問題を解く。わからない中学範囲は教科書へ戻る。',check:'例文の主語・動詞・時制を示し、基本問題の答えの理由を言える。'},
{id:'eh-words',subject:'english',stage:'high',rank:1,title:'英単語ターゲット1900',kind:'入試の語彙',use:'知っている語を除き、少量ずつ意味を隠して答える。翌日と数日後にも復習する。',check:'学習した範囲を順不同で確認し、8割程度の意味を見ずに答えられる。',parallel:true},
{id:'eh-reading',subject:'english',stage:'high',rank:1,title:'入門英文解釈の技術70',kind:'一文を正確に読む',use:'自力で文を読み、構造と意味を説明する。解説と照合した後、解説なしで再確認する。',check:'未読の同程度の英文で主語・動詞・修飾関係と意味を説明できる。'},
{id:'eh-long',subject:'english',stage:'high',rank:2,title:'英語長文ハイパートレーニング レベル2 標準編',kind:'長文演習',use:'設問を解き、根拠を本文中に示す。読めなかった文を確認し、後日もう一度読む。',check:'同程度の未読長文で、要点と設問の根拠を説明できる。'}],
levels:[['foundation','基礎から確認したい','教科書の説明や基本例題にも不安がある'],['basic','基本問題は解ける','例題に似た問題は解けるが、初見では迷う'],['standard','標準問題に進みたい','基本事項は説明でき、問題演習を増やしたい']]};
if(typeof module!=='undefined'&&module.exports)module.exports=catalog;root.StudyRouteCatalog=catalog;
})(typeof window!=='undefined'?window:globalThis);
