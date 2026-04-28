function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYMBOLS = [
  { sym: 'BTC',  name: 'Bitcoin',       color: '#f7931a', sector: '主流币',  price: 67234.50, chg: 2.34,  mcap: 1320e9, vol: 14.2e9 },
  { sym: 'ETH',  name: 'Ethereum',      color: '#627eea', sector: '主流币',  price: 3548.10,  chg: 1.92,  mcap: 426e9,  vol: 8.6e9 },
  { sym: 'SOL',  name: 'Solana',        color: '#9945ff', sector: 'Solana',  price: 178.43,   chg: 6.12,  mcap: 82e9,   vol: 3.4e9 },
  { sym: 'BNB',  name: 'BNB',           color: '#f3ba2f', sector: 'Layer 1', price: 612.20,   chg: 0.84,  mcap: 90e9,   vol: 1.8e9 },
  { sym: 'XRP',  name: 'Ripple',        color: '#23292f', sector: '支付',    price: 0.5821,   chg: -1.24, mcap: 32e9,   vol: 1.1e9 },
  { sym: 'DOGE', name: 'Dogecoin',      color: '#c2a633', sector: 'Meme',    price: 0.1582,   chg: 4.78,  mcap: 22e9,   vol: 1.6e9 },
  { sym: 'TON',  name: 'Toncoin',       color: '#0088cc', sector: 'Layer 1', price: 7.34,     chg: 3.21,  mcap: 18e9,   vol: 0.7e9 },
  { sym: 'AVAX', name: 'Avalanche',     color: '#e84142', sector: 'Layer 1', price: 38.42,    chg: -0.92, mcap: 14e9,   vol: 0.5e9 },
  { sym: 'LINK', name: 'Chainlink',     color: '#2a5ada', sector: 'DeFi',    price: 16.78,    chg: 2.64,  mcap: 9.6e9,  vol: 0.6e9 },
  { sym: 'MATIC',name: 'Polygon',       color: '#8247e5', sector: 'Layer 2', price: 0.8821,   chg: -2.18, mcap: 8.4e9,  vol: 0.4e9 },
  { sym: 'DOT',  name: 'Polkadot',      color: '#e6007a', sector: 'Layer 1', price: 7.12,     chg: -0.34, mcap: 9.2e9,  vol: 0.3e9 },
  { sym: 'SHIB', name: 'Shiba Inu',     color: '#ffa409', sector: 'Meme',    price: 0.0000235,chg: 8.42,  mcap: 13e9,   vol: 0.9e9 },
  { sym: 'ARB',  name: 'Arbitrum',      color: '#28a0f0', sector: 'Layer 2', price: 1.21,     chg: 5.34,  mcap: 4.6e9,  vol: 0.5e9 },
  { sym: 'OP',   name: 'Optimism',      color: '#ff0420', sector: 'Layer 2', price: 2.18,     chg: 2.81,  mcap: 4.2e9,  vol: 0.4e9 },
  { sym: 'INJ',  name: 'Injective',     color: '#00d2ff', sector: 'DeFi',    price: 28.10,    chg: -2.41, mcap: 2.8e9,  vol: 0.3e9 },
  { sym: 'SUI',  name: 'Sui',           color: '#6fbcf0', sector: 'Layer 1', price: 1.42,     chg: 7.21,  mcap: 3.8e9,  vol: 0.5e9 },
  { sym: 'WIF',  name: 'dogwifhat',     color: '#9b56e0', sector: 'Meme',    price: 2.41,     chg: 12.45, mcap: 2.4e9,  vol: 0.8e9 },
  { sym: 'PEPE', name: 'Pepe',          color: '#52b788', sector: 'Meme',    price: 0.0000089,chg: 15.20, mcap: 3.7e9,  vol: 1.2e9 },
  { sym: 'FET',  name: 'Fetch.ai',      color: '#3b3b3b', sector: 'AI',      price: 1.84,     chg: 4.21,  mcap: 1.6e9,  vol: 0.2e9 },
  { sym: 'RNDR', name: 'Render',        color: '#ee2362', sector: 'AI',      price: 7.89,     chg: 6.71,  mcap: 3.0e9,  vol: 0.3e9 },
  { sym: 'AAVE', name: 'Aave',          color: '#b6509e', sector: 'DeFi',    price: 88.40,    chg: 1.18,  mcap: 1.3e9,  vol: 0.1e9 },
  { sym: 'UNI',  name: 'Uniswap',       color: '#ff007a', sector: 'DeFi',    price: 7.21,     chg: -1.84, mcap: 4.4e9,  vol: 0.2e9 },
  { sym: 'NEAR', name: 'Near Protocol', color: '#00ec97', sector: 'Layer 1', price: 4.56,     chg: 0.92,  mcap: 5.0e9,  vol: 0.2e9 },
  { sym: 'TIA',  name: 'Celestia',      color: '#7b1cff', sector: 'Layer 1', price: 6.12,     chg: -3.21, mcap: 1.4e9,  vol: 0.15e9 },
];

const SECTORS = ['主流币', 'Layer 1', 'Layer 2', 'DeFi', 'Meme', 'AI', 'Solana', '支付'];

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

function toNormalized(candles) {
  const base = candles[0].close;
  return candles.map((c) => ((c.close - base) / base) * 100);
}

// --- API implementations ---

export async function getMarketOverview() {
  return {
    totalMcap: { value: 2.67e12, change: 1.4, label: '$2.67T' },
    volume24h: { value: 76.2e9, change: 12, label: '$76.2B' },
    btcDominance: { value: 58.1, change: -0.2, label: '58.1%' },
    fearGreed: { value: 72, change: 8, label: '贪婪' },
  };
}

export async function getSymbols() {
  return SYMBOLS.map((s) => ({ ...s }));
}

export async function getTicker(symbol) {
  const s = SYMBOLS.find((x) => x.sym === symbol);
  if (!s) return null;
  return {
    symbol: s.sym,
    price: s.price,
    change24h: s.chg,
    high24h: s.price * 1.04,
    low24h: s.price * 0.96,
    volume24h: s.vol,
    mcap: s.mcap,
    name: s.name,
    color: s.color,
    sector: s.sector,
  };
}

export async function getKlines(symbol, interval = '1h', limit = 80) {
  const s = SYMBOLS.find((x) => x.sym === symbol) || SYMBOLS[0];
  const seed = s.sym.charCodeAt(0) * 13 + s.sym.charCodeAt(1);
  const candles = generateCandles(seed, limit, s.price, 0.018);
  const now = Date.now();
  const intervalMs = {
    '1m': 60000, '5m': 300000, '15m': 900000,
    '1h': 3600000, '4h': 14400000, '1d': 86400000, '1w': 604800000,
  };
  const step = intervalMs[interval] || 3600000;
  return candles.map((c, i) => ({
    time: Math.floor((now - (limit - i) * step) / 1000),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
}

export async function getOrderBook(symbol, limit = 9) {
  const s = SYMBOLS.find((x) => x.sym === symbol) || SYMBOLS[0];
  const rng = mulberry32(s.sym.charCodeAt(0) + 11);
  const mid = s.price;
  const asks = [];
  const bids = [];
  let cumA = 0;
  let cumB = 0;
  for (let i = 0; i < limit; i++) {
    const pa = mid * (1 + (i + 1) * 0.0008);
    const qa = rng() * 2 + 0.1;
    cumA += qa;
    asks.push({ price: pa, qty: qa, total: cumA });
  }
  for (let i = 0; i < limit; i++) {
    const pb = mid * (1 - (i + 1) * 0.0008);
    const qb = rng() * 2 + 0.1;
    cumB += qb;
    bids.push({ price: pb, qty: qb, total: cumB });
  }
  const maxTotal = Math.max(cumA, cumB);
  return { asks: asks.reverse(), bids, maxTotal, midPrice: mid };
}

export async function getSparkline(symbol, points = 30) {
  const s = SYMBOLS.find((x) => x.sym === symbol);
  if (!s) return [];
  const trend = s.chg / 5;
  const seed = s.sym.charCodeAt(0) + s.sym.charCodeAt(1);
  return generateSpark(seed, points, trend);
}

export async function getSectorRotation(period = '7d') {
  const days = 7;
  const rng = mulberry32(42);
  const heatmap = SECTORS.map((sec) => {
    const cells = [];
    let trend = (rng() - 0.5) * 2;
    for (let d = 0; d < days; d++) {
      trend = trend * 0.7 + (rng() - 0.5) * 6;
      cells.push(+trend.toFixed(2));
    }
    return { sector: sec, cells };
  });
  return { sectors: SECTORS, heatmap };
}

export async function getBtcKlines(period = '30d') {
  const periodCfg = {
    '7d': { vol: 0.025, off: 0 },
    '14d': { vol: 0.018, off: 50 },
    '30d': { vol: 0.012, off: 200 },
  };
  const cfg = periodCfg[period] || periodCfg['30d'];
  const N = 120;
  const btcSym = SYMBOLS.find((s) => s.sym === 'BTC');
  const seed = btcSym.sym.charCodeAt(0) * 17 + btcSym.sym.charCodeAt(1) * 3 + cfg.off;
  const candles = generateCandles(seed, N, btcSym.price, cfg.vol);
  return candles.map((c) => c.close);
}

export async function getRotationAnalysis(period = '30d') {
  const periodCfg = {
    '7d': { vol: 0.025, off: 0 },
    '14d': { vol: 0.018, off: 50 },
    '30d': { vol: 0.012, off: 200 },
  };
  const cfg = periodCfg[period] || periodCfg['30d'];
  const N = 120;
  const totalMcap = SYMBOLS.reduce((s, c) => s + c.mcap, 0);

  const series = {};
  SYMBOLS.forEach((sym) => {
    const seed = sym.sym.charCodeAt(0) * 17 + sym.sym.charCodeAt(1) * 3 + cfg.off;
    const candles = generateCandles(seed, N, sym.price, cfg.vol);
    const base = candles[0].close;
    series[sym.sym] = candles.map((c) => c.close / base);
  });

  const btcSym = SYMBOLS.find((s) => s.sym === 'BTC');
  const btcSeed = btcSym.sym.charCodeAt(0) * 17 + btcSym.sym.charCodeAt(1) * 3 + cfg.off;
  const btcCandles = generateCandles(btcSeed, N, btcSym.price, cfg.vol);
  const btcLine = btcCandles.map((c) => c.close);

  const sectorContribs = [];
  for (let t = 1; t < N; t++) {
    const c = {};
    SECTORS.forEach((sec) => (c[sec] = 0));
    SYMBOLS.forEach((sym) => {
      c[sym.sector] +=
        (sym.mcap / totalMcap) * (series[sym.sym][t] - series[sym.sym][t - 1]) * 1000;
    });
    sectorContribs.push(c);
  }

  const smooth = btcLine.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - 3); j <= Math.min(N - 1, i + 3); j++) {
      s += btcLine[j];
      n++;
    }
    return s / n;
  });

  const annotations = [];
  for (let t = 6; t < N - 6; t++) {
    const db = smooth[t] - smooth[t - 5];
    const da = smooth[t + 5] - smooth[t];
    if (!((db > 0 && da < 0) || (db < 0 && da > 0))) continue;
    if (annotations.length && t - annotations[annotations.length - 1].t < 12) continue;
    const ws = Math.max(0, t - 8);
    const we = Math.min(sectorContribs.length - 1, t - 1);
    const sums = {};
    SECTORS.forEach((sec) => (sums[sec] = 0));
    for (let j = ws; j <= we; j++) SECTORS.forEach((sec) => (sums[sec] += sectorContribs[j][sec]));
    const isUp = db > 0;
    let best = SECTORS[0];
    let bv = -Infinity;
    SECTORS.forEach((sec) => {
      const v = isUp ? sums[sec] : -sums[sec];
      if (v > bv) { bv = v; best = sec; }
    });
    annotations.push({ t, sector: best, isUp, value: btcLine[t] });
  }

  for (let i = 0; i < annotations.length - 1; i++) {
    if (annotations[i + 1].t - annotations[i].t > 25) {
      const mt = Math.round((annotations[i].t + annotations[i + 1].t) / 2);
      const isUp = btcLine[mt] > btcLine[Math.max(0, mt - 5)];
      const ws = Math.max(0, mt - 5);
      const we = Math.min(sectorContribs.length - 1, mt);
      const sums = {};
      SECTORS.forEach((sec) => (sums[sec] = 0));
      for (let j = ws; j <= we; j++) SECTORS.forEach((sec) => (sums[sec] += sectorContribs[j][sec]));
      let best = SECTORS[0];
      let bv = -Infinity;
      SECTORS.forEach((sec) => {
        const v = isUp ? sums[sec] : -sums[sec];
        if (v > bv) { bv = v; best = sec; }
      });
      annotations.splice(i + 1, 0, { t: mt, sector: best, isUp, value: btcLine[mt] });
      i++;
    }
  }

  const recent = {};
  SECTORS.forEach((sec) => (recent[sec] = 0));
  for (let t = Math.max(0, sectorContribs.length - 20); t < sectorContribs.length; t++)
    SECTORS.forEach((sec) => (recent[sec] += sectorContribs[t][sec]));

  const sectorStats = SECTORS.map((sec) => ({
    sector: sec,
    contribution: recent[sec],
    count: SYMBOLS.filter((s) => s.sector === sec).length,
  })).sort((a, b) => b.contribution - a.contribution);

  return {
    btcLine,
    annotations,
    sectorStats,
    sectors: SECTORS,
    symbolCount: SYMBOLS.length,
  };
}

export async function getSimilarity(refSymbol = 'BTC', algo = 'pearson', period = '30d', minCorr = 0.5) {
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
    ref: { sym: refSymbol, color: '#f7931a', norm: refNorm },
    candidates: candidates
      .filter((c) => c.corr >= minCorr)
      .map((c, i) => {
        const candle = generateCandles(100 + i, 90, 100, 0.02 + i * 0.005);
        let norm = toNormalized(candle);
        norm = norm.map((v, j) => v * (1 - c.corr) + refNorm[j] * c.corr);
        return { ...c, norm };
      }),
  };
}

export async function sendAgentMessage(message, context = {}) {
  return {
    role: 'ag',
    body: `正在分析 ${context.symbol || 'BTC'} 的相关数据... (demo)`,
    suggestions: [],
  };
}

export async function getAgentAlerts() {
  return [
    { tag: 'hot', tagText: '异动', time: '2m', title: 'WIF 30 分钟内放量上涨 12.4%', body: 'Meme 板块整体跟涨，$300M 成交。' },
    { tag: 'up',  tagText: '走强', time: '18m', title: 'AI 板块连续 3 日强于大盘', body: 'FET、RNDR 领涨，资金持续流入。' },
    { tag: 'info',tagText: '关注', time: '1h', title: 'BTC 接近 $67.8K 阻力位', body: '近 30 日 4 次未能突破，关注成交量。' },
    { tag: 'dn',  tagText: '走弱', time: '3h', title: 'TIA 跌破 30 日均线', body: '成交量放大，需关注是否破位。' },
    { tag: 'info',tagText: '相似', time: '5h', title: 'SOL 走势接近 BTC 在 2024Q1', body: '皮尔森相关 0.91，可参考历史路径。' },
  ];
}

export { SECTORS, mulberry32, generateCandles, generateSpark };
