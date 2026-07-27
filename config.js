// Supabase Edge Function: live prices from eBay.
// Deploy:  supabase functions deploy prices --no-verify-jwt
// Secrets: supabase secrets set EBAY_CLIENT_ID=... EBAY_CLIENT_SECRET=...
//
// POST { query: "Analogue Pocket", condition: "used" }
// ->   { lowestBuy, soldMedian, listings: [{ title, price, shipping, condition, url }] }
//
// Browse API (live listings) works with any eBay developer account.
// Marketplace Insights (real sold comps) needs eBay's approval; until you have it
// this function estimates the sold median from live asking prices and says so.

const EBAY_ENV = Deno.env.get('EBAY_ENV') ?? 'production';
const BASE = EBAY_ENV === 'sandbox' ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

let token: { value: string; exp: number } | null = null;

async function getToken() {
  if (token && token.exp > Date.now() + 30_000) return token.value;
  const id = Deno.env.get('EBAY_CLIENT_ID');
  const secret = Deno.env.get('EBAY_CLIENT_SECRET');
  if (!id || !secret) throw new Error('EBAY_CLIENT_ID / EBAY_CLIENT_SECRET are not set');
  const res = await fetch(`${BASE}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + btoa(`${id}:${secret}`),
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=' + encodeURIComponent('https://api.ebay.com/oauth/api_scope'),
  });
  if (!res.ok) throw new Error('eBay auth failed: ' + res.status);
  const j = await res.json();
  token = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return token.value;
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { query, condition } = await req.json();
    if (!query) throw new Error('query is required');

    const filters = ['buyingOptions:{FIXED_PRICE}'];
    if (condition === 'new' || condition === 'sealed') filters.push('conditions:{NEW}');
    if (condition === 'used' || condition === 'cib') filters.push('conditions:{USED}');

    const url = `${BASE}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}`
      + `&limit=30&sort=price&filter=${encodeURIComponent(filters.join(','))}`;

    const res = await fetch(url, {
      headers: {
        authorization: 'Bearer ' + (await getToken()),
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      },
    });
    if (!res.ok) throw new Error('eBay search failed: ' + res.status + ' ' + (await res.text()).slice(0, 200));
    const data = await res.json();

    const items = (data.itemSummaries ?? []).map((it: any) => {
      const price = parseFloat(it.price?.value ?? '0');
      const shipping = parseFloat(it.shippingOptions?.[0]?.shippingCost?.value ?? '0');
      return {
        title: it.title,
        price,
        shipping,
        landed: price + shipping,
        condition: it.condition,
        image: it.thumbnailImages?.[0]?.imageUrl ?? it.image?.imageUrl ?? null,
        url: it.itemWebUrl,
      };
    }).filter((i: any) => i.price > 0);

    // Trim obvious junk: parts-only lots priced far under the pack.
    const landed = items.map((i: any) => i.landed).sort((a: number, b: number) => a - b);
    const cut = landed.length > 6 ? landed.slice(1, -1) : landed;
    const lowestBuy = cut.length ? cut[0] : 0;
    // Sort listings so listings[0] IS the cheapest landed price the app shows.
    items.sort((a: any, b: any) => a.landed - b.landed);
    const asking = median(cut);

    return new Response(JSON.stringify({
      query,
      lowestBuy: Math.round(lowestBuy),
      soldMedian: Math.round(asking * 1.0),   // swap for Marketplace Insights once approved
      soldMedianIsEstimate: true,
      count: items.length,
      listings: items.slice(0, 8),
      fetchedAt: new Date().toISOString(),
    }), { headers: { ...CORS, 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err.message ?? err) }), {
      status: 400, headers: { ...CORS, 'content-type': 'application/json' },
    });
  }
});
