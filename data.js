// Catalog seed + real marketplace link builders.
(function () {
  const q = encodeURIComponent;

  const SOURCES = [
    { key: 'ebay', name: 'eBay', kind: 'resale', url: (n) => `https://www.ebay.com/sch/i.html?_nkw=${q(n)}&LH_BIN=1&_sop=15` },
    { key: 'mercari', name: 'Mercari', kind: 'resale', url: (n) => `https://www.mercari.com/search/?keyword=${q(n)}&sortBy=2` },
    { key: 'fbmp', name: 'FB Marketplace', kind: 'resale', url: (n) => `https://www.facebook.com/marketplace/search/?query=${q(n)}` },
    { key: 'offerup', name: 'OfferUp', kind: 'resale', url: (n) => `https://offerup.com/search?q=${q(n)}` },
    { key: 'bestbuy', name: 'Best Buy', kind: 'retail', url: (n) => `https://www.bestbuy.com/site/searchpage.jsp?st=${q(n)}` },
    { key: 'walmart', name: 'Walmart', kind: 'retail', url: (n) => `https://www.walmart.com/search?q=${q(n)}` },
    { key: 'amazon', name: 'Amazon', kind: 'retail', url: (n) => `https://www.amazon.com/s?k=${q(n)}` },
    { key: 'gamestop', name: 'GameStop', kind: 'retail', url: (n) => `https://www.gamestop.com/search/?q=${q(n)}` },
  ];

  const soldComps = (n) => `https://www.ebay.com/sch/i.html?_nkw=${q(n)}&LH_Sold=1&LH_Complete=1&_sop=13`;
  const priceCharting = (n) => `https://www.pricecharting.com/search-products?q=${q(n)}&type=prices`;

  // Starting catalog. Prices are a starting point — refresh or edit them in the app.
  const SEED = [
    { id: 'switch2', name: 'Nintendo Switch 2', kind: 'console', buy: 449, sell: 512, cond: 'new' },
    { id: 'deck', name: 'Steam Deck OLED 1TB', kind: 'handheld', buy: 549, sell: 638, cond: 'new' },
    { id: 'ally', name: 'ROG Ally X', kind: 'handheld', buy: 649, sell: 690, cond: 'new' },
    { id: 'pocket', name: 'Analogue Pocket', kind: 'handheld', buy: 219, sell: 335, cond: 'new' },
    { id: 'playdate', name: 'Playdate console', kind: 'handheld', buy: 199, sell: 245, cond: 'new' },
    { id: 'gbasp', name: 'Game Boy Advance SP AGS-101', kind: 'retro', buy: 118, sell: 189, cond: 'used' },
    { id: 'dslite', name: 'Nintendo DS Lite', kind: 'retro', buy: 62, sell: 104, cond: 'used' },
    { id: 'vita', name: 'PS Vita Slim PCH-2000', kind: 'handheld', buy: 165, sell: 232, cond: 'used' },
    { id: 'gc', name: 'Nintendo GameCube console', kind: 'retro', buy: 105, sell: 168, cond: 'used' },
    { id: 'n64', name: 'Nintendo 64 console', kind: 'retro', buy: 88, sell: 132, cond: 'used' },
    { id: 'procon', name: 'Switch 2 Pro Controller', kind: 'accessory', buy: 79, sell: 96, cond: 'new' },
    { id: 'dock', name: 'Steam Deck Docking Station', kind: 'accessory', buy: 79, sell: 99, cond: 'new' },
    { id: 'emerald', name: 'Pokemon Emerald GBA', kind: 'game', buy: 92, sell: 148, cond: 'used' },
    { id: 'chrono', name: 'Chrono Trigger SNES CIB', kind: 'game', buy: 260, sell: 395, cond: 'cib' },
    { id: 'por', name: 'Fire Emblem Path of Radiance GameCube', kind: 'game', buy: 180, sell: 265, cond: 'used' },
    { id: 'muramasa', name: 'Muramasa Rebirth PS Vita', kind: 'game', buy: 74, sell: 126, cond: 'cib' },
  ];

  const KINDS = [
    { key: 'all', label: 'Everything' },
    { key: 'handheld', label: 'Handhelds' },
    { key: 'retro', label: 'Retro' },
    { key: 'console', label: 'Consoles' },
    { key: 'game', label: 'Games' },
    { key: 'accessory', label: 'Accessories' },
  ];

  const CONDS = [
    { key: 'new', label: 'New' },
    { key: 'used', label: 'Used' },
    { key: 'cib', label: 'CIB' },
    { key: 'sealed', label: 'Sealed' },
  ];

  window.TroveData = { SOURCES, SEED, KINDS, CONDS, soldComps, priceCharting };
})();
