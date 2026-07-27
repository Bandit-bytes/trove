# Trove

A price tracker for consoles, handhelds and games — for a household of two. Installs on your
phone from the browser, keeps working offline, links straight to real listings, and does the
buy-low / sell-high math with marketplace fees taken out.

It runs in three tiers. **Tier 0 works the moment you publish it — no accounts, no keys.**

| Tier | What you get | What it needs |
| --- | --- | --- |
| 0 | Full app on both phones, saved data, real buy links, manual prices | nothing |
| 1 | One shared watchlist + ledger, synced live between phones | free Supabase project |
| 2 | Live eBay prices with a refresh button | free eBay developer keys |

---

## Tier 0 — publish it (5 minutes)

1. Put the contents of this `app/` folder at the **root of the repo** (so `index.html` sits at the top level).
2. Repo → **Settings → Pages** → Branch `main`, folder `/ (root)` → **Save**.
3. Wait a minute, then open `https://<your-username>.github.io/trove/` on your iPhone **in Safari**.
4. Share button → **Add to Home Screen** → Add.
5. Send your wife the same URL so she adds it too.

That's a real installed app: full screen, no browser chrome, opens offline, data survives restarts.

**Watch out for:** the file must be named exactly `index.html` (not `index.html.html`), and Pages
serves from HTTPS — required for the offline service worker to register.

### Using it
- **Trending** ranks everything you track by net profit. Sort by dollars, percentage, or cheapest.
- **+** in the header adds anything — type it the way you'd search eBay, because that text drives every buy link.
- Tapping an item opens the detail sheet: edit buy/sold prices, see the history curve, open Best Buy / Walmart / Amazon / GameStop / eBay / Mercari / FB Marketplace / OfferUp, jump to sold comps and PriceCharting, and set a target price.
- **Watch** shows how far each target still has to fall.
- **Ledger** records real flips with fees and shipping subtracted, and totals your actual profit.
- **You** holds fee assumptions, default venue, JSON export, and sync setup.

---

## Tier 1 — sync between two phones

1. Create a free project at [supabase.com](https://supabase.com).
2. SQL Editor → paste `supabase/schema.sql` → **Run**.
3. Authentication → Providers → **Email** → enable magic links.
4. Project Settings → API → copy the **Project URL** and the **anon public key**.
5. Edit `config.js`, paste both in, commit. (The anon key is designed to be public — row-level
   security in the schema is what protects the data.)
6. On your phone: You → **Sign in to sync** → enter your email → tap the link it sends.
7. Your household gets an invite code. Your wife signs in on her phone, enters that code, and
   both phones now read and write the same watchlist, items and ledger — live.

---

## Tier 2 — live prices

1. Register at [developer.ebay.com](https://developer.ebay.com), create a **production** keyset,
   and copy the App ID (client id) and Cert ID (client secret).
2. Install the Supabase CLI, then from the repo root:

   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase secrets set EBAY_CLIENT_ID=xxx EBAY_CLIENT_SECRET=yyy
   supabase functions deploy prices --no-verify-jwt
   ```
3. Put the function URL in `config.js` as `PRICES_ENDPOINT`
   (`https://<ref>.supabase.co/functions/v1/prices`), commit.
4. In the app, the refresh icon on any item now pulls live eBay listings, updates the buy price,
   and records a point on the history curve.

**Honest caveat:** eBay's Browse API gives *live asking prices*. Real **sold** comps come from the
Marketplace Insights API, which eBay grants on application. Until you're approved, the function
estimates the sold median from live listings and flags it with `soldMedianIsEstimate`. Retail
prices (Best Buy, Walmart, Amazon) are link-outs — their public APIs are partner-gated, so the
app sends you to the search page rather than pretending to know the price.

### Keeping prices fresh automatically
In Supabase → Database → **Cron**, schedule a job that calls the function for your watched items
(hourly is plenty, and stays inside eBay's 5,000 calls/day free tier).

---

## Files

```
index.html              app shell + all styling
config.js               your keys and fee assumptions   ← the only file you normally edit
data.js                 starting catalog + marketplace link builders
store.js                local-first storage, optional Supabase sync
app.js                  screens, sheets, interactions
sw.js                   offline cache
manifest.webmanifest    home-screen install metadata
icons/                  app icons
supabase/schema.sql     households + memberships + row-level security
supabase/functions/prices/index.ts   eBay price service
```

## What this deliberately does not do

No buying, listing or payments on your behalf — Trove hands you a link and you finish the purchase
on the marketplace. No scraping of sites that forbid it. No price guarantees: treat every number as
a lead, and check the listing before you buy.
