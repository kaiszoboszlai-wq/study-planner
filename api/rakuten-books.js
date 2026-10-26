// Node/Vercel adapter. Credentials are runtime environment variables, never browser settings.
import catalog from '../server/rakuten-catalog.json' with {type:'json'};
import {createRakutenBooks} from '../server/rakuten-books.mjs';
const lookup = createRakutenBooks({catalog});
export default async function handler(req,res) {
  const origin = process.env.RAKUTEN_APP_ORIGIN || 'http://localhost';
  const headers = new Headers();
  for (const name of ['origin','sec-fetch-site']) if (req.headers[name]) headers.set(name,req.headers[name]);
  const request = new Request(new URL(req.url,origin),{method:req.method,headers});
  const response = await lookup(request,process.env);
  res.statusCode = response.status;
  response.headers.forEach((value,key) => res.setHeader(key,value));
  res.end(await response.text());
}
