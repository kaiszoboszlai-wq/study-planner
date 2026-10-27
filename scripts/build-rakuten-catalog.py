"""Build the server ISBN/title allowlist from independent local bibliography only."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
books=json.loads((root/'assets/book-catalog.json').read_text())['books']
index={}
for b in books:
 if not b.get('verified') or b.get('excludedReason') or not b.get('isbn'):continue
 labels=index.setdefault(b['isbn'],[])
 for title in [b.get('title'),b.get('sourceTitle')]:
  if title and title not in labels:labels.append(title)
(root/'server/rakuten-catalog.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':'),sort_keys=True)+'\n')
print('ISBN allowlist:',len(index))
