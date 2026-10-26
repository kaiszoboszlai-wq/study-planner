// Request-time lookup only. Never save Rakuten responses or images in the catalog.
const endpoint = 'https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404';
const normalize = value => String(value || '').replace(/\([Rr]\)|®/g, '').normalize('NFKC').replace(/[\s・:：+＋,，.．「」『』〈〉<>\[\]［］【】()（）!！?？\-—‐]/g, '').toLowerCase();
const isbnValid = value => /^97[89]\d{10}$/.test(value) && [...value].reduce((n,c,i) => n + Number(c)*(i%2?3:1), 0)%10 === 0;
function safeUrl(value, hosts) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.port && hosts.includes(u.hostname) ? u : null; } catch { return null; }
}
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {status, headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff', ...extra}});

export function createRakutenBooks({catalog, fetcher = fetch, now = Date.now, interval = 1100} = {}) {
  const inflight = new Map(); let busy = false, nextAt = 0;
  return async function handle(request, env = {}) {
    if (request.method !== 'GET') return json({error:'method_not_allowed'},405,{'Allow':'GET'});
    const url = new URL(request.url);
    // Deployment must explicitly select a context permitted by Rakuten's terms.
    // Do not change a private Site's audience to satisfy this check.
    const enabled = !!(env.RAKUTEN_APPLICATION_ID && env.RAKUTEN_ACCESS_KEY && env.RAKUTEN_AFFILIATE_ID && env.RAKUTEN_APP_ORIGIN && ['public','private-approved'].includes(env.RAKUTEN_USE_CONTEXT));
    if (url.searchParams.get('capabilities') === '1') return json({enabled});
    if (!enabled) return json({book:null,reason:'not_configured'});
    if (url.origin !== env.RAKUTEN_APP_ORIGIN || (request.headers.get('Origin') && request.headers.get('Origin') !== env.RAKUTEN_APP_ORIGIN) || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({book:null},403);
    const isbn = url.searchParams.get('isbn') || '', titles = catalog?.[isbn];
    if (!isbnValid(isbn) || !Array.isArray(titles)) return json({book:null});
    if (inflight.has(isbn)) return json(await inflight.get(isbn));
    if (busy || now() < nextAt) return json({book:null,reason:'rate_limited'},429,{'Retry-After':String(Math.max(2,Math.ceil((nextAt-now())/1000)))});
    busy = true; nextAt = now() + interval;
    const lookup = (async () => {
      const upstream = new URL(endpoint);
      upstream.search = new URLSearchParams({applicationId:env.RAKUTEN_APPLICATION_ID,affiliateId:env.RAKUTEN_AFFILIATE_ID,isbn,format:'json',formatVersion:'2',hits:'1',elements:'title,subTitle,isbn,publisherName,largeImageUrl,itemUrl,affiliateUrl',outOfStockFlag:'1'}).toString();
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetcher(upstream.href, {headers:{accessKey:env.RAKUTEN_ACCESS_KEY},signal:controller.signal,redirect:'error'});
        if (!response.ok) {
          if ([401,403,429,503].includes(response.status)) {
            const retry = response.headers.get('Retry-After');
            const seconds = /^\d+$/.test(retry || '') ? Number(retry) : (Date.parse(retry)-now())/1000;
            nextAt = now() + Math.min(3600000,Math.max(60000,(seconds || 0)*1000));
          }
          return {book:null};
        }
        const payload = await response.json(), items = payload.Items || payload.items;
        const first = items?.[0], item = first?.Item || first?.item || first;
        const expected = titles.flatMap(t => [normalize(t),normalize(t.split(/[:：]/)[0])]);
        if (String(item?.isbn) !== isbn || ![item?.title,[item?.title,item?.subTitle].filter(Boolean).join(' ')].some(t => t && expected.includes(normalize(t)))) return {book:null};
        const cover = safeUrl(item.largeImageUrl,['thumbnail.image.rakuten.co.jp','image.books.rakuten.co.jp']);
        const product = safeUrl(item.itemUrl,['books.rakuten.co.jp']);
        const affiliate = safeUrl(item.affiliateUrl,['hb.afl.rakuten.co.jp']);
        if (!cover || !product || !/^\/rb\/\d+\/?$/.test(product.pathname) || !affiliate || !/^\/hgc\//.test(affiliate.pathname)) return {book:null};
        return {book:{isbn,title:item.title,cover:cover.href,url:affiliate.href,provider:'rakuten'}};
      } catch { return {book:null}; } finally {clearTimeout(timeout);}
    })();
    inflight.set(isbn,lookup);
    try {return json(await lookup);} finally {busy=false;inflight.delete(isbn);}
  };
}
