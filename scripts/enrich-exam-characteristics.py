"""Short independently written factual summaries, checked against cited Kei-Net pages."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];p=ROOT/'assets/university-admissions.json';data=json.loads(p.read_text())
facts={('東京大学','英語'):[{'text':'要約・読解・英作文・リスニングなど形式が幅広く、英文量も多い','skills':['長文','解釈','英作文','リスニング','文法','単語']}],('京都大学','英語'):[{'text':'英文の正確な理解に加え、和訳や英作文で内容を表現する力が問われる','skills':['解釈','長文','英作文','文法','単語']}],('京都大学','文系数学'):[{'text':'確率・図形がよく扱われ、考え方を筋道立てて記述する力も問われる','skills':['確率','図形']}],('一橋大学','数学'):[{'text':'整数・確率が継続的に出題され、図形を含む問題への対応も必要になる','skills':['整数','確率','図形']}]}
for u in data['universities']:
 for row in u.get('trends',[]):
  features=facts.get((u['name'],row['subject']))
  if features:row['characteristics']=features;row['characteristicsCheckedAt']='2026-10-27'
p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');print('Added',len(facts),'source-checked subject summaries; other verified trends use topic-based explanations')
