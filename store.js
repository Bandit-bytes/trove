// Local-first store with optional Supabase sync.
// Data shape is one JSON document per household, so two phones stay in step
// without a schema migration every time the app grows.
(function () {
  const CFG = window.TROVE_CONFIG || {};
  const KEY = 'trove.state.v1';
  const listeners = new Set();

  const freshState = () => ({
    v: 1,
    householdName: 'My household',
    inviteCode: null,
    members: [{ id: 'me', name: 'Me', initials: 'ME' }],
    items: window.TroveData.SEED.map((s) => ({ ...s, history: [{ t: Date.now(), buy: s.buy, sell: s.sell }] })),
    watch: {},          // itemId -> { target, by }
    flips: [],          // { id, itemId, name, buy, sell, ship, venue, cond, when, by }
    settings: { fees: true, minMargin: 10, venue: 'ebay', sort: 'margin' },
    updatedAt: Date.now(),
  });

  let state = load();
  let supa = null;
  let householdId = null;
  let channel = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted storage — start clean */ }
    return freshState();
  }

  function emit() { listeners.forEach((fn) => fn(state)); }

  function persist(push = true) {
    state.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    emit();
    if (push && supa && householdId) pushRemote();
  }

  // ---------- Supabase (optional) ----------
  async function initCloud() {
    if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) return null;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    supa = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    const { data } = await supa.auth.getSession();
    if (data.session) await attachHousehold();
    supa.auth.onAuthStateChange((_e, session) => { if (session) attachHousehold(); });
    return supa;
  }

  async function attachHousehold() {
    const { data: me } = await supa.auth.getUser();
    if (!me.user) return;
    let { data: rows } = await supa.from('memberships').select('household_id').eq('user_id', me.user.id).limit(1);
    if (!rows || !rows.length) {
      const code = 'TROVE-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const { data: hh } = await supa.from('households')
        .insert({ name: state.householdName, code, data: state }).select().single();
      if (!hh) return;
      await supa.from('memberships').insert({ user_id: me.user.id, household_id: hh.id });
      householdId = hh.id;
      state.inviteCode = code;
      persist(false);
    } else {
      householdId = rows[0].household_id;
      await pullRemote();
    }
    subscribe();
  }

  async function pullRemote() {
    const { data } = await supa.from('households').select('data, code, name').eq('id', householdId).single();
    if (data && data.data && data.data.updatedAt > (state.updatedAt || 0)) {
      state = { ...data.data, inviteCode: data.code, householdName: data.name };
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
      emit();
    } else if (data) {
      state.inviteCode = data.code;
      pushRemote();
    }
  }

  let pushTimer = null;
  function pushRemote() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      try { await supa.from('households').update({ data: state, updated_at: new Date().toISOString() }).eq('id', householdId); }
      catch (e) {}
    }, 700);
  }

  function subscribe() {
    if (!supa || !householdId || channel) return;
    channel = supa.channel('hh:' + householdId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'households', filter: 'id=eq.' + householdId },
        (payload) => {
          const remote = payload.new && payload.new.data;
          if (remote && remote.updatedAt > state.updatedAt) {
            state = remote;
            try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
            emit();
          }
        })
      .subscribe();
  }

  // ---------- Public API ----------
  const Store = {
    get state() { return state; },
    get cloudReady() { return !!supa; },
    get signedIn() { return !!householdId; },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    update(mutator) { mutator(state); persist(); },
    reset() { state = freshState(); persist(); },

    async signIn(email) {
      if (!supa) await initCloud();
      if (!supa) throw new Error('Cloud sync is not configured yet — see README.');
      const { error } = await supa.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href } });
      if (error) throw error;
    },
    async signOut() { if (supa) await supa.auth.signOut(); householdId = null; },

    async joinHousehold(code) {
      if (!supa) throw new Error('Cloud sync is not configured yet — see README.');
      const { data: me } = await supa.auth.getUser();
      const { data: hh } = await supa.from('households').select('id').eq('code', code.trim().toUpperCase()).single();
      if (!hh) throw new Error('No household with that code.');
      await supa.from('memberships').insert({ user_id: me.user.id, household_id: hh.id });
      householdId = hh.id;
      await pullRemote();
      subscribe();
    },

    // Live prices via the optional edge function.
    async refreshPrice(item) {
      if (!CFG.PRICES_ENDPOINT) throw new Error('Live prices are not configured yet — see README.');
      const res = await fetch(CFG.PRICES_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(CFG.SUPABASE_ANON_KEY ? { authorization: 'Bearer ' + CFG.SUPABASE_ANON_KEY } : {}) },
        body: JSON.stringify({ query: item.name, condition: item.cond }),
      });
      if (!res.ok) throw new Error('Price service returned ' + res.status);
      const out = await res.json(); // { lowestBuy, soldMedian, listings: [...] }
      Store.update((s) => {
        const it = s.items.find((i) => i.id === item.id);
        if (!it) return;
        if (out.lowestBuy) it.buy = Math.round(out.lowestBuy);
        if (out.soldMedian) it.sell = Math.round(out.soldMedian);
        it.listings = out.listings || [];
        it.refreshedAt = Date.now();
        it.history = (it.history || []).concat([{ t: Date.now(), buy: it.buy, sell: it.sell }]).slice(-60);
      });
      return out;
    },

    initCloud,
  };

  window.TroveStore = Store;
  initCloud().catch(() => {});
})();
