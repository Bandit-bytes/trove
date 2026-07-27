// Trove configuration.
// Tier 0 works with no keys at all (local data on the phone).
// Fill these in to unlock sync and live prices — see README.md.
window.TROVE_CONFIG = {
  // --- Tier 1: cloud sync between phones (Supabase, free tier) ---
  SUPABASE_URL: '',       // e.g. 'https://abcdefgh.supabase.co'
  SUPABASE_ANON_KEY: '',  // the public "anon" key — safe in a public repo

  // --- Tier 2: live prices (a Supabase Edge Function that talks to eBay) ---
  // Leave empty to keep entering prices by hand.
  PRICES_ENDPOINT: '',    // e.g. 'https://abcdefgh.supabase.co/functions/v1/prices'

  // Marketplace fee assumptions used for net-margin math
  FEES: { ebay: 0.1325, mercari: 0.10, whatnot: 0.08, local: 0 },
  FEE_FLAT: 0.30,
};
