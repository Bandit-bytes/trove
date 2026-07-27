/* Trove — app shell. Vanilla JS, no build step. */
(function () {
  const S = window.TroveStore;
  const D = window.TroveData;
  const CFG = window.TROVE_CONFIG;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Math.round(n).toLocaleString();
  const uid = () => Math.random().toString(36).slice(2, 9);

  const ICON = {
    trend: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    mark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    out: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
  };
  const svg = (d, size = 21, stroke = 'currentColor', fill = 'none') =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  const TINTS = [['#ffc6a5', '#402310'], ['#ccdbb2', '#272e1b'], ['#dcd3c4', '#2e2b25'], ['#f6a06b', '#402310'], ['#e1eecc', '#3d472b']];
  const tintOf = (id) => TINTS[Math.abs(hash(id)) % TINTS.length];
  const hash = (s) => s.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const monoOf = (name) => name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const src = (key) => D.SOURCES.find((s) => s.key === key);
  const feeRate = (venue) => CFG.FEES[venue] != null ? CFG.FEES[venue] : 0;

  let ui = { tab: 'trending', filter: 'all', detail: null, sheet: null, query: '', toast: null, busy: false };
  const setUI = (patch) => { Object.assign(ui, patch); render(); };
  const st = () => S.state;

  function netOf(item) {
    const s = st().settings;
    const venue = s.venue || 'ebay';
    const gross = item.sell;
    const fees = s.fees ? gross * feeRate(venue) + CFG.FEE_FLAT : 0;
    const net = gross - fees - item.buy;
    return { net, pct: item.buy ? (net / item.buy) * 100 : 0, fees };
  }

  function sparkline(item, w = 46, h = 20) {
    const hist = (item.history || []).map((p) => p.buy);
    if (hist.length < 2) return '';
    const lo = Math.min(...hist), hi = Math.max(...hist), span = hi - lo || 1;
    const d = hist.map((v, i) => {
      const x = (i / (hist.length - 1)) * (w - 3) + 1.5;
      const y = h - 2.5 - ((v - lo) / span) * (h - 5);
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
    const rising = hist[hist.length - 1] >= hist[0];
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" style="flex:none;opacity:.8">
      <path d="${d}" stroke="${rising ? 'var(--accent-600)' : 'var(--sage-600)'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function chart(item) {
    const hist = (item.history || []).slice(-30);
    if (hist.length < 2) return `<div class="muted" style="font-size:12px;padding:20px 0">Not enough history yet — refresh or edit the price a few times and the curve fills in.</div>`;
    const W = 300, H = 120;
    const all = hist.flatMap((p) => [p.buy, p.sell]);
    const lo = Math.min(...all) * 0.96, hi = Math.max(...all) * 1.04, span = hi - lo || 1;
    const path = (get) => hist.map((p, i) => {
      const x = (i / (hist.length - 1)) * (W - 8) + 4;
      const y = H - 8 - ((get(p) - lo) / span) * (H - 20);
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
    const buy = path((p) => p.buy);
    return `<svg width="100%" height="126" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" fill="none">
      <path d="${buy} L${W - 4} ${H} L4 ${H} Z" fill="var(--accent-200)" opacity=".8"/>
      <path d="${buy}" stroke="var(--accent-600)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${path((p) => p.sell)}" stroke="var(--sage-600)" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"/>
    </svg>`;
  }

  function avatar(subject, size, id) {
    const item = subject && typeof subject === 'object' ? subject : null;
    const name = item ? item.name : subject;
    if (item && item.image) {
      return `<img src="${esc(item.image)}" alt="" loading="lazy" style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.3)}px;object-fit:cover;background:var(--n-200);flex:none">`;
    }
    const [bg, fg] = tintOf(id || (item && item.id) || name);
    return `<div class="mono" style="width:${size}px;height:${size}px;background:${bg};color:${fg};font-size:${Math.round(size * 0.32)}px">${esc(monoOf(name))}</div>`;
  }

  // The exact listing behind the number, when we have one; otherwise the search.
  const buyUrl = (it) => it.bestUrl || src('ebay').url(it.name);
  const buyLabel = (it) => (it.bestUrl ? 'Buy — ' + money(it.bestPrice || it.buy) : 'Buy — see listings');

  // ---------------- screens ----------------
  function trendingScreen() {
    const s = st();
    let items = s.items.filter((i) => ui.filter === 'all' || i.kind === ui.filter);
    if (ui.query) items = items.filter((i) => i.name.toLowerCase().includes(ui.query.toLowerCase()));
    const sort = s.settings.sort;
    items = items.map((i) => ({ ...i, ...netOf(i) }));
    if (sort === 'margin') items.sort((a, b) => b.net - a.net);
    if (sort === 'pct') items.sort((a, b) => b.pct - a.pct);
    if (sort === 'cheap') items.sort((a, b) => a.buy - b.buy);

    const hero = items[0];
    return `
    <div class="screen">
      <div class="seg" style="margin:6px 0 12px">
        ${[['margin', 'Best $'], ['pct', 'Best %'], ['cheap', 'Cheapest']].map(([k, l]) =>
      `<button data-sort="${k}" aria-pressed="${sort === k}">${l}</button>`).join('')}
      </div>
      <div class="chips">
        ${D.KINDS.map((k) => `<button class="chip" data-filter="${k.key}" aria-pressed="${ui.filter === k.key}">${k.label}</button>`).join('')}
      </div>
      ${hero ? heroCard(hero) : '<p class="muted">Nothing here yet — add something to track.</p>'}
      <div style="display:flex;align-items:baseline;margin:24px 0 10px">
        <h4 style="margin:0">Everything tracked</h4>
        <span class="muted" style="font-size:11px;margin-left:auto">${items.length} items</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${items.slice(1).map(itemRow).join('')}
      </div>
      <button class="btn btn-secondary btn-block" data-sheet="add" style="margin-top:16px">${svg(ICON.plus, 18)} Track something new</button>
      <p class="muted" style="font-size:11px;margin-top:14px">${s.settings.fees
        ? 'Margins are net of ' + Math.round(feeRate(s.settings.venue) * 100) + '% ' + s.settings.venue + ' fees.'
        : 'Margins are gross — turn fees on in You.'}</p>
    </div>`;
  }

  function heroCard(it) {
    const good = it.net >= 0;
    return `<div class="card" style="background:var(--accent-800);color:var(--accent-100);padding:18px;position:relative;overflow:hidden">
      <div style="position:absolute;right:-46px;top:-46px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.06)"></div>
      <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-300)">Best spread right now</div>
      <div style="display:flex;align-items:center;gap:13px;margin-top:12px">
        ${avatar(it, 52)}
        <div style="min-width:0"><div style="font-family:var(--font-h);font-size:20px;line-height:1.15">${esc(it.name)}</div>
        <div style="font-size:11px;color:var(--accent-300);margin-top:3px">${money(it.buy)} → ${money(it.sell)} · ${esc(it.cond)}</div></div>
      </div>
      <div style="display:flex;align-items:flex-end;margin-top:16px">
        <div><div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-300)">Net profit</div>
        <div style="font-family:var(--font-h);font-size:30px;line-height:1.1;color:${good ? 'var(--sage-300)' : 'var(--accent-300)'}">${good ? '+' : '−'}${money(Math.abs(it.net))}</div></div>
        <div style="margin-left:auto;text-align:right;font-size:12px;color:var(--accent-300)">${it.pct.toFixed(0)}% return</div>
      </div>
      <div style="display:flex;gap:9px;margin-top:16px">
        <a class="btn" href="${buyUrl(it)}" target="_blank" rel="noopener" style="flex:1;background:var(--accent-300);color:var(--accent-900)">${it.bestUrl ? 'Buy ' + money(it.bestPrice || it.buy) : 'Buy now'}</a>
        <button class="btn" data-open="${it.id}" style="background:rgba(255,255,255,.14);color:var(--accent-100)">Details</button>
      </div>
    </div>`;
  }

  function itemRow(it) {
    const good = it.net >= 0;
    const watched = !!st().watch[it.id];
    return `<button class="row" data-open="${it.id}">
      ${avatar(it, 42)}
      <div style="flex:1;min-width:0">
        <div class="ellip" style="font-size:13.5px;font-weight:600">${esc(it.name)}${watched ? ' ★' : ''}</div>
        <div class="ellip muted" style="font-size:10.5px">${money(it.buy)} → ${money(it.sell)} · ${esc(it.cond)}${it.refreshedAt ? ' · updated ' + ago(it.refreshedAt) : ''}</div>
      </div>
      ${sparkline(it)}
      <div style="text-align:right;min-width:60px">
        <div style="font-size:14px;font-weight:700" class="${good ? 'up' : 'down'}">${good ? '+' : '−'}${money(Math.abs(it.net))}</div>
        <div class="muted" style="font-size:10px">${it.pct.toFixed(0)}%</div>
      </div>
    </button>`;
  }

  function ago(t) {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.round(m / 60);
    return h < 24 ? h + 'h ago' : Math.round(h / 24) + 'd ago';
  }

  function watchScreen() {
    const s = st();
    const ids = Object.keys(s.watch);
    if (!ids.length) return `<div class="screen"><h4 style="margin:8px 0 4px">Watchlist</h4>
      <div class="card" style="text-align:center;padding:30px 20px;background:transparent;border:1px dashed var(--n-400)">
        <div style="font-family:var(--font-h);font-size:17px">Nothing watched yet</div>
        <p class="muted" style="font-size:12px;margin:6px 0 0">Open an item and set a target price — you will see how far it has to fall.</p>
      </div></div>`;
    return `<div class="screen"><h4 style="margin:8px 0 12px">Watchlist</h4>
      <div style="display:flex;flex-direction:column;gap:10px">
      ${ids.map((id) => {
      const it = s.items.find((i) => i.id === id);
      if (!it) return '';
      const w = s.watch[id];
      const hit = it.buy <= w.target;
      const pct = Math.max(6, Math.min(100, (w.target / it.buy) * 100));
      return `<div class="card" style="padding:14px 15px">
          <div style="display:flex;align-items:center;gap:11px">
            ${avatar(it, 40)}
            <div style="flex:1;min-width:0">
              <div class="ellip" style="font-size:13.5px;font-weight:600">${esc(it.name)}</div>
              <div class="muted" style="font-size:10.5px">Alert under ${money(w.target)} · sells for ${money(it.sell)}</div>
            </div>
            <button class="icon-btn" data-unwatch="${it.id}" aria-label="Stop watching">${svg(ICON.x, 17)}</button>
          </div>
          <div style="margin-top:12px"><div class="bar"><i style="width:${pct}%;background:${hit ? 'var(--sage-600)' : 'var(--accent-600)'}"></i></div>
          <div style="display:flex;justify-content:space-between;margin-top:7px;font-size:10.5px">
            <a href="${buyUrl(it)}" target="_blank" rel="noopener">Now ${money(it.buy)} — ${it.bestUrl ? 'open this listing' : 'open listings'}</a>
            <span style="font-weight:700;color:${hit ? 'var(--sage-700)' : 'var(--accent-700)'}">${hit ? 'Target hit' : money(it.buy - w.target) + ' to go'}</span>
          </div></div>
        </div>`;
    }).join('')}
      </div></div>`;
  }

  function ledgerScreen() {
    const s = st();
    const rows = s.flips.map((f) => {
      const fees = f.venue && CFG.FEES[f.venue] != null ? f.sell * CFG.FEES[f.venue] + CFG.FEE_FLAT : 0;
      const net = f.sell - fees - (f.ship || 0) - f.buy;
      return { ...f, net, pct: f.buy ? (net / f.buy) * 100 : 0 };
    });
    const total = rows.reduce((t, r) => t + r.net, 0);
    return `<div class="screen">
      <div style="display:flex;align-items:baseline;margin:8px 0 12px">
        <h4 style="margin:0">Flip ledger</h4>
        <button class="btn btn-ghost" data-sheet="flip" style="margin-left:auto">${svg(ICON.plus, 16)} Log a flip</button>
      </div>
      <div class="card" style="flex-direction:row;display:flex;gap:8px;background:transparent;padding:0;margin-bottom:14px">
        <div class="stat" style="background:var(--surface)"><b>${rows.length}</b><span>Flips</span></div>
        <div class="stat" style="background:var(--surface)"><b class="${total >= 0 ? 'up' : 'down'}">${money(total)}</b><span>Net profit</span></div>
        <div class="stat" style="background:var(--surface)"><b>${rows.length ? Math.round(rows.reduce((t, r) => t + r.pct, 0) / rows.length) : 0}%</b><span>Avg return</span></div>
      </div>
      ${rows.length ? `<div style="display:flex;flex-direction:column;gap:8px">${rows.map((r) => `
        <div class="row" style="cursor:default">
          ${avatar(r.name, 36, r.itemId || r.name)}
          <div style="flex:1;min-width:0">
            <div class="ellip" style="font-size:12.5px;font-weight:600">${esc(r.name)}</div>
            <div class="muted" style="font-size:10px">${esc(r.when)} · ${esc(r.by || 'me')} · ${money(r.buy)} → ${money(r.sell)} on ${esc(r.venue)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:13px;font-weight:700" class="${r.net >= 0 ? 'up' : 'down'}">${r.net >= 0 ? '+' : '−'}${money(Math.abs(r.net))}</div>
            <div class="muted" style="font-size:10px">${Math.round(r.pct)}%</div>
          </div>
        </div>`).join('')}</div>`
        : `<p class="muted" style="font-size:12.5px">No flips logged yet. When you sell something, log it here and Trove keeps your real numbers — fees and shipping included.</p>`}
    </div>`;
  }

  function youScreen() {
    const s = st();
    const cloud = CFG.SUPABASE_URL ? (S.signedIn ? 'Synced' : 'Not signed in') : 'Not configured';
    const live = CFG.PRICES_ENDPOINT ? 'On' : 'Manual prices';
    return `<div class="screen">
      <h4 style="margin:8px 0 10px">Household</h4>
      <div class="card">
        <div style="display:flex;align-items:center;gap:11px">
          ${avatar(s.householdName, 44, 'hh')}
          <div style="flex:1;min-width:0">
            <div style="font-family:var(--font-h);font-size:17px">${esc(s.householdName)}</div>
            <div class="muted" style="font-size:11px">Sync: ${cloud} · Live prices: ${live}</div>
          </div>
        </div>
        ${s.inviteCode ? `<div style="display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:13px;border-top:1px solid var(--divider)">
          <div style="flex:1"><div class="muted" style="font-size:10px;letter-spacing:.12em;text-transform:uppercase">Invite code</div>
          <div style="font-family:var(--font-h);font-size:17px;letter-spacing:.04em">${esc(s.inviteCode)}</div></div>
          <button class="btn btn-secondary" data-share="1">Share</button></div>` : ''}
        <div style="display:flex;gap:9px;margin-top:14px">
          ${S.signedIn
        ? `<button class="btn btn-secondary btn-block" data-signout="1">Sign out</button>`
        : `<button class="btn btn-primary btn-block" data-sheet="signin">${CFG.SUPABASE_URL ? 'Sign in to sync' : 'Set up sync'}</button>`}
        </div>
      </div>

      <h4 style="margin:24px 0 10px">Selling assumptions</h4>
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="flex:1"><div style="font-size:12.5px;font-weight:600">Subtract marketplace fees</div>
          <div class="muted" style="font-size:10.5px">${Math.round(feeRate(s.settings.venue) * 100)}% + $${CFG.FEE_FLAT.toFixed(2)} on ${esc(s.settings.venue)}</div></div>
          <button class="switch" data-fees="1" aria-checked="${s.settings.fees}"><i></i></button>
        </div>
        <div style="margin-top:14px;padding-top:13px;border-top:1px solid var(--divider)">
          <div style="font-size:12.5px;font-weight:600;margin-bottom:9px">Default sales venue</div>
          <div class="seg">${Object.keys(CFG.FEES).map((v) => `<button data-venue="${v}" aria-pressed="${s.settings.venue === v}">${v}</button>`).join('')}</div>
        </div>
      </div>

      <h4 style="margin:24px 0 10px">Data</h4>
      <div class="card">
        <div class="muted" style="font-size:12px">Everything lives on this phone${S.signedIn ? ' and in your household' : ''}. Export a backup any time.</div>
        <div style="display:flex;gap:9px;margin-top:12px">
          <button class="btn btn-secondary" data-export="1" style="flex:1">Export JSON</button>
          <button class="btn btn-secondary" data-reset="1" style="flex:1">Reset app</button>
        </div>
      </div>
      <p class="muted" style="font-size:11px;margin-top:16px">Trove links out to retailers and marketplaces; it never buys, lists or pays on your behalf.</p>
    </div>`;
  }

  // ---------------- detail + sheets ----------------
  function detailSheet(item) {
    const n = netOf(item);
    const w = st().watch[item.id];
    const retail = D.SOURCES.filter((s) => s.kind === 'retail');
    const resale = D.SOURCES.filter((s) => s.kind === 'resale');
    const listings = item.listings || [];
    return sheet(`
      <div style="display:flex;align-items:center;gap:12px">
        ${avatar(item, 50)}
        <div style="flex:1;min-width:0"><div style="font-family:var(--font-h);font-size:20px;line-height:1.15">${esc(item.name)}</div>
        <div class="muted" style="font-size:11px;margin-top:2px">${esc(item.cond)}${item.refreshedAt ? ' · updated ' + ago(item.refreshedAt) : ' · price entered by hand'}</div></div>
        <button class="icon-btn" data-refresh="${item.id}" aria-label="Refresh price">${svg(ICON.refresh, 18)}</button>
      </div>

      <div style="display:flex;gap:9px;margin-top:12px">
        <label class="btn btn-secondary" style="flex:1;cursor:pointer">${item.image ? 'Replace photo' : 'Add a photo'}<input type="file" accept="image/*" data-photo="${item.id}" style="display:none"></label>
        ${item.image ? `<button class="btn btn-ghost" data-clearphoto="${item.id}">Remove</button>` : ''}
      </div>

      <div style="display:flex;gap:11px;margin-top:16px">
        <div style="flex:1"><label class="f">Buy at</label><input class="in" inputmode="decimal" data-price="buy" value="${item.buy}"></div>
        <div style="flex:1"><label class="f">Sells for</label><input class="in" inputmode="decimal" data-price="sell" value="${item.sell}"></div>
      </div>
      <div style="margin-top:14px;background:var(--sage-100);border-radius:24px;padding:14px 16px;display:flex;align-items:flex-end">
        <div><div class="muted" style="font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--sage-800)">Net profit</div>
        <div style="font-family:var(--font-h);font-size:26px;line-height:1.1;color:${n.net >= 0 ? 'var(--sage-800)' : 'var(--accent-700)'}">${n.net >= 0 ? '+' : '−'}${money(Math.abs(n.net))}</div></div>
        <div style="margin-left:auto;text-align:right;font-size:12px;color:var(--sage-800)">${n.pct.toFixed(0)}% return<br><span style="font-size:10.5px">after ${money(n.fees)} fees</span></div>
      </div>

      <div style="margin-top:18px">
        <div style="font-size:12px;font-weight:700;margin-bottom:6px">Price history</div>
        ${chart(item)}
      </div>

      ${listings.length ? `<div style="margin-top:18px"><div style="font-size:12px;font-weight:700;margin-bottom:8px">Live listings</div>
        ${listings.slice(0, 5).map((l) => `<a class="linkrow" href="${esc(l.url)}" target="_blank" rel="noopener">
          <div style="flex:1;min-width:0"><div class="ellip" style="font-size:12.5px;font-weight:600">${esc(l.title)}</div>
          <div class="muted" style="font-size:10px">${esc(l.condition || '')}${l.shipping ? ' · +' + money(l.shipping) + ' ship' : ' · free ship'}</div></div>
          <div style="font-weight:700;font-size:13px">${money(l.price)}</div>${svg(ICON.out, 12, 'var(--accent-700)')}</a>`).join('')}
      </div>` : ''}

      <div style="display:flex;gap:10px;margin-top:18px">
        <div style="flex:1;background:var(--sage-100);border-radius:22px;padding:13px">
          <div style="font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--sage-800);margin-bottom:6px">Retail</div>
          ${retail.map((s) => `<a class="linkrow" href="${s.url(item.name)}" target="_blank" rel="noopener"><span style="flex:1;font-size:12px;font-weight:600">${s.name}</span>${svg(ICON.out, 12, 'var(--sage-700)')}</a>`).join('')}
        </div>
        <div style="flex:1;background:var(--accent-100);border-radius:22px;padding:13px">
          <div style="font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-800);margin-bottom:6px">Resale</div>
          ${resale.map((s) => `<a class="linkrow" href="${s.url(item.name)}" target="_blank" rel="noopener"><span style="flex:1;font-size:12px;font-weight:600">${s.name}</span>${svg(ICON.out, 12, 'var(--accent-700)')}</a>`).join('')}
        </div>
      </div>

      <div style="display:flex;gap:14px;margin-top:14px;font-size:12px">
        <a href="${D.soldComps(item.name)}" target="_blank" rel="noopener">Sold comps</a>
        <a href="${D.priceCharting(item.name)}" target="_blank" rel="noopener">PriceCharting</a>
        <button class="btn btn-ghost" data-delete="${item.id}" style="margin-left:auto;font-size:12px">Remove</button>
      </div>

      <div style="margin-top:18px">
        <label class="f">Alert me when the buy price falls under</label>
        <div style="display:flex;gap:9px">
          <input class="in" inputmode="decimal" id="targetInput" value="${w ? w.target : Math.round(item.buy * 0.9)}" style="flex:1">
          <button class="btn btn-secondary" data-watch="${item.id}">${w ? 'Update' : 'Watch'}</button>
        </div>
      </div>
    `, [
      `<a class="btn btn-primary" href="${buyUrl(item)}" target="_blank" rel="noopener" style="flex:1">${buyLabel(item)}</a>`,
      `<button class="btn btn-secondary" data-sheet="flip" data-item="${item.id}">Log flip</button>`,
    ]);
  }

  function addSheet() {
    return sheet(`
      <h4 style="margin:0 0 4px">Track something new</h4>
      <p class="muted" style="font-size:12.5px">Type it the way you would search for it on eBay — that exact text drives every buy link.</p>
      <div style="margin-top:12px"><label class="f">Name</label><input class="in" id="addName" placeholder="Nintendo Switch 2 bundle" autocomplete="off"></div>
      <div style="display:flex;gap:11px;margin-top:12px">
        <div style="flex:1"><label class="f">Buy price</label><input class="in" id="addBuy" inputmode="decimal" placeholder="0"></div>
        <div style="flex:1"><label class="f">Sold price</label><input class="in" id="addSell" inputmode="decimal" placeholder="0"></div>
      </div>
      <div style="margin-top:12px"><label class="f">Category</label>
        <div class="seg" id="addKind">${D.KINDS.filter((k) => k.key !== 'all').map((k, i) => `<button data-kind="${k.key}" aria-pressed="${i === 0}">${k.label}</button>`).join('')}</div>
      </div>
      <div style="margin-top:12px"><label class="f">Condition</label>
        <div class="seg" id="addCond">${D.CONDS.map((c, i) => `<button data-cond="${c.key}" aria-pressed="${i === 1}">${c.label}</button>`).join('')}</div>
      </div>
    `, [`<button class="btn btn-primary" data-add="1" style="flex:1">Add to Trove</button>`]);
  }

  function flipSheet(itemId) {
    const it = st().items.find((i) => i.id === itemId);
    return sheet(`
      <h4 style="margin:0 0 4px">Log a flip</h4>
      <p class="muted" style="font-size:12.5px">Your real numbers, fees included.</p>
      <div style="margin-top:12px"><label class="f">Item</label>
        <select class="in" id="flipItem">${st().items.map((i) => `<option value="${i.id}" ${i.id === itemId ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select></div>
      <div style="display:flex;gap:11px;margin-top:12px">
        <div style="flex:1"><label class="f">You paid</label><input class="in" id="flipBuy" inputmode="decimal" value="${it ? it.buy : ''}"></div>
        <div style="flex:1"><label class="f">It sold for</label><input class="in" id="flipSell" inputmode="decimal" value="${it ? it.sell : ''}"></div>
      </div>
      <div style="display:flex;gap:11px;margin-top:12px">
        <div style="flex:1"><label class="f">Shipping + supplies</label><input class="in" id="flipShip" inputmode="decimal" value="0"></div>
        <div style="flex:1"><label class="f">Sold on</label>
          <select class="in" id="flipVenue">${Object.keys(CFG.FEES).map((v) => `<option value="${v}" ${st().settings.venue === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      </div>
      <div style="margin-top:12px"><label class="f">Who flipped it</label><input class="in" id="flipBy" value="${esc(st().members[0].name)}"></div>
    `, [`<button class="btn btn-primary" data-saveflip="1" style="flex:1">Save flip</button>`]);
  }

  function signinSheet() {
    if (!CFG.SUPABASE_URL) {
      return sheet(`<h4 style="margin:0 0 6px">Sync is not set up yet</h4>
        <p style="font-size:13px">To share one watchlist and ledger between two phones, Trove needs a free Supabase project — five minutes, no card.</p>
        <ol style="font-size:13px;padding-left:18px;line-height:1.7">
          <li>Create a project at supabase.com</li>
          <li>Run <code>supabase/schema.sql</code> from this repo in the SQL editor</li>
          <li>Paste the project URL and anon key into <code>config.js</code></li>
          <li>Commit — both phones pick it up on next launch</li>
        </ol>
        <p class="muted" style="font-size:12px">Full walkthrough is in README.md.</p>`,
        [`<button class="btn btn-primary" data-close="1" style="flex:1">Got it</button>`]);
    }
    return sheet(`<h4 style="margin:0 0 4px">Sign in</h4>
      <p class="muted" style="font-size:12.5px">We email you a one-tap link — no password to remember.</p>
      <div style="margin-top:12px"><label class="f">Email</label><input class="in" id="authEmail" inputmode="email" placeholder="you@example.com"></div>
      <div style="margin-top:14px"><label class="f">Joining your partner? Enter their invite code</label>
        <div style="display:flex;gap:9px"><input class="in" id="joinCode" placeholder="TROVE-0000" style="flex:1"><button class="btn btn-secondary" data-join="1">Join</button></div></div>`,
      [`<button class="btn btn-primary" data-sendlink="1" style="flex:1">Email me a link</button>`]);
  }

  function sheet(body, actions) {
    return `<div class="sheet-back" data-backdrop="1"><div class="sheet">
      <div style="position:relative;flex:none">
        <div class="grab"></div>
        <button class="icon-btn" data-close="1" aria-label="Close" style="position:absolute;right:14px;top:4px;width:36px;height:36px">${svg(ICON.x, 17)}</button>
      </div>
      <div class="sheet-body">${body}<div style="height:14px"></div></div>
      <div class="sheet-foot">${actions.join('')}</div>
    </div></div>`;
  }

  // ---------------- render ----------------
  function render() {
    const s = st();
    $('top').innerHTML = `
      <div style="margin-right:auto"><div class="brand">Trove</div><div class="kicker">Buy low · sell high</div></div>
      <button class="icon-btn" data-searchtoggle="1" aria-label="Search">${svg(ICON.search, 19)}</button>
      <button class="icon-btn" data-sheet="add" aria-label="Add item">${svg(ICON.plus, 19)}</button>`;

    const tabs = [['trending', 'Trending', ICON.trend], ['watch', 'Watch', ICON.mark], ['ledger', 'Ledger', ICON.book], ['you', 'You', ICON.user]];
    $('tabs').innerHTML = tabs.map(([k, l, i]) =>
      `<button data-tab="${k}" ${ui.tab === k ? 'aria-current="page"' : ''}>${svg(i)}<span>${l}</span></button>`).join('');

    const searchBar = ui.searching
      ? `<input class="in" id="searchBox" placeholder="Search tracked items" value="${esc(ui.query)}" style="margin:6px 0 4px">` : '';

    $('main').innerHTML = searchBar + (
      ui.tab === 'trending' ? trendingScreen()
        : ui.tab === 'watch' ? watchScreen()
          : ui.tab === 'ledger' ? ledgerScreen() : youScreen());

    const item = ui.detail && s.items.find((i) => i.id === ui.detail);
    $('overlay').innerHTML =
      (item ? detailSheet(item)
        : ui.sheet === 'add' ? addSheet()
          : ui.sheet === 'flip' ? flipSheet(ui.flipItem)
            : ui.sheet === 'signin' ? signinSheet() : '')
      + (ui.toast ? `<div class="toast">${esc(ui.toast)}</div>` : '');

    if (ui.searching) { const b = $('searchBox'); if (b) b.focus(); }
    wireSheet();
  }

  function toast(msg) {
    setUI({ toast: msg });
    clearTimeout(toast._t);
    toast._t = setTimeout(() => setUI({ toast: null }), 2200);
  }

  // ---------------- events ----------------
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tab],[data-sort],[data-filter],[data-open],[data-sheet],[data-backdrop],[data-close],[data-unwatch],[data-watch],[data-refresh],[data-delete],[data-clearphoto],[data-add],[data-saveflip],[data-fees],[data-venue],[data-kind],[data-cond],[data-export],[data-reset],[data-signout],[data-sendlink],[data-join],[data-share],[data-searchtoggle]');
    if (!t) return;
    const d = t.dataset;

    if (d.tab) return setUI({ tab: d.tab, detail: null, sheet: null, searching: false });
    if (d.sort) return S.update((s) => { s.settings.sort = d.sort; });
    if (d.filter) return setUI({ filter: d.filter });
    if (d.searchtoggle) return setUI({ searching: !ui.searching, query: '' });
    if (d.open) return setUI({ detail: d.open, sheet: null });
    if (d.sheet) return setUI({ sheet: d.sheet, flipItem: d.item || ui.detail, detail: null });
    if (d.close || (d.backdrop && e.target.classList.contains('sheet-back'))) return setUI({ sheet: null, detail: null });

    if (d.unwatch) return S.update((s) => { delete s.watch[d.unwatch]; });
    if (d.watch) {
      const target = parseFloat(($('targetInput') || {}).value);
      if (!target) return toast('Enter a target price');
      S.update((s) => { s.watch[d.watch] = { target, by: s.members[0].name }; });
      return toast('Watching — we will flag it under ' + money(target));
    }
    if (d.refresh) {
      const it = st().items.find((i) => i.id === d.refresh);
      try { toast('Checking prices…'); await S.refreshPrice(it); toast('Prices updated'); }
      catch (err) { toast(err.message); }
      return;
    }
    if (d.clearphoto) { S.update((s) => { const it = s.items.find((i) => i.id === d.clearphoto); if (it) delete it.image; }); return; }
    if (d.delete) { S.update((s) => { s.items = s.items.filter((i) => i.id !== d.delete); delete s.watch[d.delete]; }); return setUI({ detail: null }); }

    if (d.kind || d.cond) { t.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === t)); return; }

    if (d.add) {
      const name = ($('addName').value || '').trim();
      if (!name) return toast('Give it a name');
      const kind = (document.querySelector('#addKind [aria-pressed="true"]') || {}).dataset?.kind || 'handheld';
      const cond = (document.querySelector('#addCond [aria-pressed="true"]') || {}).dataset?.cond || 'used';
      const buy = parseFloat($('addBuy').value) || 0;
      const sell = parseFloat($('addSell').value) || 0;
      const item = { id: uid(), name, kind, cond, buy, sell, history: [{ t: Date.now(), buy, sell }] };
      S.update((s) => { s.items.unshift(item); });
      setUI({ sheet: null, detail: item.id });
      return toast('Tracking ' + name);
    }

    if (d.saveflip) {
      const id = $('flipItem').value;
      const it = st().items.find((i) => i.id === id);
      const buy = parseFloat($('flipBuy').value) || 0;
      const sell = parseFloat($('flipSell').value) || 0;
      if (!buy || !sell) return toast('Enter both prices');
      S.update((s) => {
        s.flips.unshift({
          id: uid(), itemId: id, name: it ? it.name : 'Item', buy, sell,
          ship: parseFloat($('flipShip').value) || 0, venue: $('flipVenue').value,
          by: $('flipBy').value || 'me', when: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        });
      });
      setUI({ sheet: null, tab: 'ledger' });
      return toast('Flip logged');
    }

    if (d.fees) return S.update((s) => { s.settings.fees = !s.settings.fees; });
    if (d.venue) return S.update((s) => { s.settings.venue = d.venue; });

    if (d.export) {
      const blob = new Blob([JSON.stringify(st(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'trove-backup.json'; a.click();
      return;
    }
    if (d.reset) { if (confirm('Reset Trove on this phone? Cloud data is kept.')) S.reset(); return; }
    if (d.signout) { await S.signOut(); return toast('Signed out'); }
    if (d.share && navigator.share) { navigator.share({ title: 'Join my Trove household', text: 'Invite code: ' + st().inviteCode }); return; }

    if (d.sendlink) {
      const email = ($('authEmail').value || '').trim();
      if (!email) return toast('Enter your email');
      try { await S.signIn(email); toast('Check your email for the link'); }
      catch (err) { toast(err.message); }
      return;
    }
    if (d.join) {
      const code = ($('joinCode').value || '').trim();
      try { await S.joinHousehold(code); toast('Joined household'); setUI({ sheet: null }); }
      catch (err) { toast(err.message); }
      return;
    }
  });

  function readPhoto(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 420;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  document.addEventListener('change', (e) => {
    const photoId = e.target.dataset.photo;
    if (photoId && e.target.files && e.target.files[0]) {
      readPhoto(e.target.files[0], (dataUrl) => {
        S.update((s) => { const it = s.items.find((i) => i.id === photoId); if (it) it.image = dataUrl; });
        toast('Photo saved');
      });
      return;
    }
    const p = e.target.dataset.price;
    if (p && ui.detail) {
      const val = parseFloat(e.target.value) || 0;
      S.update((s) => {
        const it = s.items.find((i) => i.id === ui.detail);
        it[p] = val;
        it.history = (it.history || []).concat([{ t: Date.now(), buy: it.buy, sell: it.sell }]).slice(-60);
      });
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'searchBox') { ui.query = e.target.value; const m = $('main'); const scroll = m.scrollTop; render(); m.scrollTop = scroll; }
  });

  function wireSheet() {
    const back = document.querySelector('.sheet-back');
    const sh = back && back.querySelector('.sheet');
    if (!sh || sh.dataset.wired) return;
    sh.dataset.wired = '1';
    const body = sh.querySelector('.sheet-body');
    let startY = null, dy = 0;
    const start = (y, target) => {
      if (body.scrollTop > 3 && !target.closest('.grab')) return;
      startY = y; dy = 0; sh.style.transition = 'none';
    };
    const move = (y) => {
      if (startY == null) return;
      dy = y - startY;
      if (dy > 0) sh.style.transform = 'translateY(' + dy + 'px)';
    };
    const end = () => {
      if (startY == null) return;
      sh.style.transition = 'transform .22s cubic-bezier(.2,.9,.3,1)';
      if (dy > 90) { sh.style.transform = 'translateY(100%)'; setTimeout(() => setUI({ sheet: null, detail: null }), 170); }
      else sh.style.transform = '';
      startY = null; dy = 0;
    };
    sh.addEventListener('touchstart', (e) => start(e.touches[0].clientY, e.target), { passive: true });
    sh.addEventListener('touchmove', (e) => move(e.touches[0].clientY), { passive: true });
    sh.addEventListener('touchend', end);
    sh.addEventListener('touchcancel', end);
    sh.addEventListener('mousedown', (e) => { start(e.clientY, e.target); });
    window.addEventListener('mousemove', (e) => { if (startY != null) move(e.clientY); });
    window.addEventListener('mouseup', end);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (ui.sheet || ui.detail)) setUI({ sheet: null, detail: null });
  });

  S.on(render);
  render();
})();
