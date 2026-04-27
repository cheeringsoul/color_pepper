// ===== Mock data for Color Pepper redesign =====
window.fmtPrice = function (p) {
  if (p == null || isNaN(p)) return '–';
  if (p === 0) return '0';
  const abs = Math.abs(p);
  let digits;
  if (abs >= 1000) digits = 2;
  else if (abs >= 1) digits = 2;
  else if (abs >= 0.01) digits = 4;
  else if (abs >= 0.0001) digits = 6;
  else digits = 8;
  return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: digits });
};
window.CPData = (function () {
  // deterministic pseudo-random
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const SYMBOLS = [
    { sym: 'BTC',  name: 'Bitcoin',         color: '#f7931a', sector: '主流币',  price: 67234.50, chg: 2.34,  mcap: 1320e9, vol: 14.2e9, lev: '125x' },
    { sym: 'ETH',  name: 'Ethereum',        color: '#627eea', sector: '主流币',  price: 3548.10,  chg: 1.92,  mcap: 426e9,  vol: 8.6e9,  lev: '100x' },
    { sym: 'SOL',  name: 'Solana',          color: '#9945ff', sector: 'Solana',  price: 178.43,   chg: 6.12,  mcap: 82e9,   vol: 3.4e9,  lev: '50x' },
    { sym: 'BNB',  name: 'BNB',             color: '#f3ba2f', sector: 'Layer 1', price: 612.20,   chg: 0.84,  mcap: 90e9,   vol: 1.8e9,  lev: '50x' },
    { sym: 'XRP',  name: 'Ripple',          color: '#23292f', sector: '支付',    price: 0.5821,   chg: -1.24, mcap: 32e9,   vol: 1.1e9,  lev: '50x' },
    { sym: 'DOGE', name: 'Dogecoin',        color: '#c2a633', sector: 'Meme',    price: 0.1582,   chg: 4.78,  mcap: 22e9,   vol: 1.6e9,  lev: '75x' },
    { sym: 'TON',  name: 'Toncoin',         color: '#0088cc', sector: 'Layer 1', price: 7.34,     chg: 3.21,  mcap: 18e9,   vol: 0.7e9,  lev: '50x' },
    { sym: 'AVAX', name: 'Avalanche',       color: '#e84142', sector: 'Layer 1', price: 38.42,    chg: -0.92, mcap: 14e9,   vol: 0.5e9,  lev: '50x' },
    { sym: 'LINK', name: 'Chainlink',       color: '#2a5ada', sector: 'DeFi',    price: 16.78,    chg: 2.64,  mcap: 9.6e9,  vol: 0.6e9,  lev: '50x' },
    { sym: 'MATIC',name: 'Polygon',         color: '#8247e5', sector: 'Layer 2', price: 0.8821,   chg: -2.18, mcap: 8.4e9,  vol: 0.4e9,  lev: '50x' },
    { sym: 'DOT',  name: 'Polkadot',        color: '#e6007a', sector: 'Layer 1', price: 7.12,     chg: -0.34, mcap: 9.2e9,  vol: 0.3e9,  lev: '50x' },
    { sym: 'SHIB', name: 'Shiba Inu',       color: '#ffa409', sector: 'Meme',    price: 0.0000235,chg: 8.42,  mcap: 13e9,   vol: 0.9e9,  lev: '50x' },
    { sym: 'ARB',  name: 'Arbitrum',        color: '#28a0f0', sector: 'Layer 2', price: 1.21,     chg: 5.34,  mcap: 4.6e9,  vol: 0.5e9,  lev: '50x' },
    { sym: 'OP',   name: 'Optimism',        color: '#ff0420', sector: 'Layer 2', price: 2.18,     chg: 2.81,  mcap: 4.2e9,  vol: 0.4e9,  lev: '50x' },
    { sym: 'INJ',  name: 'Injective',       color: '#00d2ff', sector: 'DeFi',    price: 28.10,    chg: -2.41, mcap: 2.8e9,  vol: 0.3e9,  lev: '50x' },
    { sym: 'SUI',  name: 'Sui',             color: '#6fbcf0', sector: 'Layer 1', price: 1.42,     chg: 7.21,  mcap: 3.8e9,  vol: 0.5e9,  lev: '50x' },
    { sym: 'WIF',  name: 'dogwifhat',       color: '#9b56e0', sector: 'Meme',    price: 2.41,     chg: 12.45, mcap: 2.4e9,  vol: 0.8e9,  lev: '50x' },
    { sym: 'PEPE', name: 'Pepe',            color: '#52b788', sector: 'Meme',    price: 0.0000089,chg: 15.20, mcap: 3.7e9,  vol: 1.2e9,  lev: '50x' },
    { sym: 'FET',  name: 'Fetch.ai',        color: '#3b3b3b', sector: 'AI',      price: 1.84,     chg: 4.21,  mcap: 1.6e9,  vol: 0.2e9,  lev: '50x' },
    { sym: 'RNDR', name: 'Render',          color: '#ee2362', sector: 'AI',      price: 7.89,     chg: 6.71,  mcap: 3.0e9,  vol: 0.3e9,  lev: '50x' },
    { sym: 'AAVE', name: 'Aave',            color: '#b6509e', sector: 'DeFi',    price: 88.40,    chg: 1.18,  mcap: 1.3e9,  vol: 0.1e9,  lev: '50x' },
    { sym: 'UNI',  name: 'Uniswap',         color: '#ff007a', sector: 'DeFi',    price: 7.21,     chg: -1.84, mcap: 4.4e9,  vol: 0.2e9,  lev: '50x' },
    { sym: 'NEAR', name: 'Near Protocol',   color: '#00ec97', sector: 'Layer 1', price: 4.56,     chg: 0.92,  mcap: 5.0e9,  vol: 0.2e9,  lev: '50x' },
    { sym: 'TIA',  name: 'Celestia',        color: '#7b1cff', sector: 'Layer 1', price: 6.12,     chg: -3.21, mcap: 1.4e9,  vol: 0.15e9, lev: '50x' },
  ];

  const SECTORS = ['主流币', 'Layer 1', 'Layer 2', 'DeFi', 'Meme', 'AI', 'Solana', '支付'];

  // sector rotation timeline: rows = sectors, cols = days. Each cell = % change vs market avg
  function generateRotationGrid() {
    const days = 7;
    const rng = mulberry32(42);
    return SECTORS.map((s, si) => {
      const cells = [];
      let trend = (rng() - 0.5) * 2;
      for (let d = 0; d < days; d++) {
        trend = trend * 0.7 + (rng() - 0.5) * 6;
        cells.push(+trend.toFixed(2));
      }
      return { sector: s, cells };
    });
  }

  // generate sparkline points
  function generateSpark(seed, points = 30, trend = 0) {
    const rng = mulberry32(seed);
    const arr = [];
    let v = 50;
    for (let i = 0; i < points; i++) {
      v += (rng() - 0.5) * 8 + trend;
      arr.push(v);
    }
    return arr;
  }

  // ohlc candles
  function generateCandles(seed, n = 80, basePrice = 100, vol = 0.02) {
    const rng = mulberry32(seed);
    const candles = [];
    let close = basePrice;
    for (let i = 0; i < n; i++) {
      const open = close;
      const drift = (rng() - 0.48) * basePrice * vol;
      close = Math.max(0.0001, open + drift);
      const range = Math.abs(drift) + basePrice * vol * (rng() * 0.6 + 0.2);
      const high = Math.max(open, close) + range * rng() * 0.6;
      const low = Math.min(open, close) - range * rng() * 0.6;
      const volume = (rng() * 0.7 + 0.3) * basePrice * 200;
      candles.push({ open, high, low, close, volume });
    }
    return candles;
  }

  // normalize close prices, return % change vs first
  function toNormalized(candles) {
    const base = candles[0].close;
    return candles.map(c => ((c.close - base) / base) * 100);
  }

  // for similarity page: ref + 8 candidates with varying correlations
  function generateSimilarity() {
    const ref = generateCandles(7, 90, 67000, 0.018);
    const refNorm = toNormalized(ref);

    const candidates = [
      { sym: 'ETH',  corr: 0.92, color: '#627eea' },
      { sym: 'BNB',  corr: 0.86, color: '#f3ba2f' },
      { sym: 'SOL',  corr: 0.78, color: '#9945ff' },
      { sym: 'AVAX', corr: 0.71, color: '#e84142' },
      { sym: 'NEAR', corr: 0.64, color: '#00ec97' },
      { sym: 'LINK', corr: 0.58, color: '#2a5ada' },
      { sym: 'TON',  corr: 0.51, color: '#0088cc' },
      { sym: 'ARB',  corr: 0.43, color: '#28a0f0' },
    ];

    return {
      ref: { sym: 'BTC', color: '#f7931a', norm: refNorm },
      candidates: candidates.map((c, i) => {
        const candle = generateCandles(100 + i, 90, 100, 0.02 + i * 0.005);
        let norm = toNormalized(candle);
        // blend with ref proportional to corr
        norm = norm.map((v, j) => v * (1 - c.corr) + refNorm[j] * c.corr);
        return { ...c, norm };
      }),
    };
  }

  return {
    SYMBOLS, SECTORS,
    rotation: generateRotationGrid(),
    candles: generateCandles,
    spark: generateSpark,
    similarity: generateSimilarity(),
    mulberry32,
  };
})();
