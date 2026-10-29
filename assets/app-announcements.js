(function(){
'use strict';
const announcement={id:'materials-10000-20261029',title:'参考書・教材が10,000冊以上に',message:'参考書・教材10000冊以上をこのアプリに搭載し、プランに追加できるようになりました。ぜひお試しください。',date:'2026-10-29',video:'assets/announcements/materials-10000-20261029.mp4',poster:'assets/announcements/materials-10000-20261029.jpg'},memorySeen=new Set();
function seenKey(){return KEY+':announcement:'+announcement.id+':'+(dataOwner||'guest');}
function unread(){const key=seenKey();try{if(localStorage.getItem(key)==='seen')return 0;}catch{}return memorySeen.has(key)?0:1;}
function markRead(){const key=seenKey();memorySeen.add(key);try{localStorage.setItem(key,'seen');}catch{}paintCounts();}
function render(host){
 const article=document.createElement('article');article.className='app-announcement86';article.id='broadcastAnnouncement86';article.setAttribute('aria-labelledby','announcementTitle86');
 const header=document.createElement('header'),label=document.createElement('span'),date=document.createElement('time');label.className='announcement-label86';label.textContent='お知らせ';date.dateTime=announcement.date;date.textContent='2026年10月29日';header.append(label,date);
 const title=document.createElement('h2');title.id='announcementTitle86';title.textContent=announcement.title;const message=document.createElement('p');message.textContent=announcement.message;
 const video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='none';video.poster=announcement.poster;video.setAttribute('aria-label','参考書・教材をプランに追加する紹介動画');const source=document.createElement('source');source.src=announcement.video;source.type='video/mp4';video.append(source,document.createTextNode('このブラウザでは動画を再生できません。'));
 const caption=document.createElement('p');caption.className='announcement-caption86';caption.textContent='紹介動画：表紙付きの教材を「今日」と週間プランに表示できます。';
 article.append(header,title,message,video,caption);host.append(article);if(!document.getElementById('dmm').hidden&&inboxTab==='req')markRead();
}
window.AppAnnouncements86={unread,render};
function pause(){document.querySelectorAll('#broadcastAnnouncement86 video').forEach(video=>video.pause());}
new MutationObserver(()=>{if(document.getElementById('dmm').hidden)pause();}).observe(document.getElementById('dmm'),{attributes:true,attributeFilter:['hidden']});document.getElementById('dmmClose').addEventListener('click',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
addEventListener('storage',e=>{if(e.key===seenKey())paintCounts();});paintCounts();
})();
