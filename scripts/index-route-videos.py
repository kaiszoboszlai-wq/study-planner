"""Index video metadata; unverified video contents never earn recommendation points."""
import datetime,json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'work/admissions/vendor'));from bs4 import BeautifulSoup
p=ROOT/'assets/book-route-editorial.json';data=json.loads(p.read_text());videos=[]
rows=[('cast-math','CASTDICE TV','BgobfZTrjSQ','entrance',['数学']),('cast-english','CASTDICE TV','CD3gCAmo_VE','entrance',['英語']),('cast-science','CASTDICE TV','Rrlfm3xEM1Y','entrance',['物理','化学','生物']),('cast-japanese','CASTDICE TV','iIAmjp2TEzs','entrance',['国語']),('pass-math','PASSLABO','OzPGGAE6WgM','entrance',['数学']),('pass-chemistry','PASSLABO','v6TXShA8ZDs','entrance',['化学']),('morite-eiken','Morite2 English Channel','1KIDpPz-fjY','eiken',['英語']),('morite-toeic','Morite2 English Channel','8AsIaCdXl0w','toeic',['英語'])]
for slug,channel,video,domain,subjects in rows:
 soup=BeautifulSoup((ROOT/('work/editorial-routes/video-'+slug+'.html')).read_text(),'html.parser');title=soup.title.get_text().split(' | ')[0];date=re.search(r'公開日時\s+(\d{4})年(\d{1,2})月(\d{1,2})日',soup.get_text(' ',strip=True));canonical=soup.select_one('link[rel="canonical"]')
 if not date:continue
 videos.append({'channel':channel,'title':title,'url':'https://www.youtube.com/watch?v='+video,'verificationUrl':canonical['href'] if canonical else 'https://yutura.net/','published':f'{int(date[1]):04}-{int(date[2]):02}-{int(date[3]):02}','checkedAt':datetime.date.today().isoformat(),'domain':domain,'subjects':subjects,'selectionEligible':False})
data['relatedVideos']=videos;p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print('Indexed',len(videos),'videos from',len({v['channel'] for v in videos}),'additional channels; video content unverified')
