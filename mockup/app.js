// ===== Mock data =====
const SECTORS_TAB = [
  "自选", "All", "主流币", "Layer 1", "Layer 2", "DeFi", "Meme",
  "AI", "RWA", "Solana", "DePIN", "GameFi", "新币种"
];

const SYMBOLS = [
  { sym: "BTC",  pair: "USDT", name: "Bitcoin",      price: 67234.50, chg: +2.34, low: 65012.30, high: 67890.10, vol: "1.42亿", mcap: "1.32万亿", color: "#f7931a", fav: true,  seed: 11,  cats: ["主流币","All"] },
  { sym: "ETH",  pair: "USDT", name: "Ethereum",     price:  3548.10, chg: +1.92, low:  3402.10, high:  3620.45, vol: "780亿",  mcap: "4280亿",  color: "#627eea", fav: true,  seed: 22,  cats: ["主流币","Layer 1","All"] },
  { sym: "SOL",  pair: "USDT", name: "Solana",       price:   178.43, chg: +6.12, low:   168.20, high:   179.10, vol: "612亿",  mcap: "820亿",   color: "#9945ff", fav: true,  seed: 33,  cats: ["Layer 1","Solana","All"] },
  { sym: "BNB",  pair: "USDT", name: "BNB",          price:   612.20, chg: +0.81, low:   606.40, high:   618.90, vol: "210亿",  mcap: "920亿",   color: "#f0b341", fav: false, seed: 44,  cats: ["主流币","Layer 1","All"] },
  { sym: "AVAX", pair: "USDT", name: "Avalanche",    price:    36.20, chg: +4.51, low:    34.50, high:    36.80, vol: "188亿",  mcap: "140亿",   color: "#e84142", fav: false, seed: 55,  cats: ["Layer 1","All"] },
  { sym: "DOGE", pair: "USDT", name: "Dogecoin",     price:     0.142,chg: -3.20, low:     0.139, high:     0.149, vol: "245亿", mcap: "200亿",  color: "#c2a633", fav: true,  seed: 66,  cats: ["Meme","All"] },
  { sym: "APT",  pair: "USDT", name: "Aptos",        price:     7.81, chg: -5.12, low:     7.72,  high:     8.32,  vol: "98亿",  mcap: "42亿",   color: "#5db5a8", fav: false, seed: 77,  cats: ["Layer 1","All"] },
  { sym: "XRP",  pair: "USDT", name: "XRP",          price:     0.612,chg: +0.42, low:     0.605, high:     0.618, vol: "320亿", mcap: "330亿",  color: "#23292f", fav: true,  seed: 88,  cats: ["主流币","All"] },
  { sym: "ARB",  pair: "USDT", name: "Arbitrum",     price:     1.122,chg: +3.04, low:     1.080, high:     1.140, vol: "82亿",  mcap: "31亿",   color: "#2d374b", fav: false, seed: 99,  cats: ["Layer 2","All"] },
  { sym: "TON",  pair: "USDT", name: "Toncoin",      price:     6.42, chg: +1.18, low:     6.30,  high:     6.51,  vol: "65亿",  mcap: "220亿",  color: "#0098ea", fav: true,  seed: 110, cats: ["Layer 1","All"] },
  { sym: "LINK", pair: "USDT", name: "Chainlink",    price:    18.10, chg: -1.42, low:    17.85,  high:    18.62,  vol: "75亿",  mcap: "110亿",  color: "#2a5ada", fav: false, seed: 121, cats: ["DeFi","All"] },
  { sym: "ADA",  pair: "USDT", name: "Cardano",      price:     0.452,chg: -0.92, low:     0.448, high:     0.461, vol: "98亿",  mcap: "160亿",  color: "#0033ad", fav: false, seed: 132, cats: ["Layer 1","All"] },
  { sym: "TRX",  pair: "USDT", name: "TRON",         price:     0.122,chg: +0.62, low:     0.120, high:     0.124, vol: "55亿",  mcap: "98亿",   color: "#ff060a", fav: false, seed: 143, cats: ["Layer 1","All"] },
  { sym: "OP",   pair: "USDT", name: "Optimism",     price:     2.18, chg: +2.81, low:     2.10,  high:     2.22,  vol: "60亿",  mcap: "23亿",   color: "#ff0420", fav: true,  seed: 154, cats: ["Layer 2","All"] },
  { sym: "SUI",  pair: "USDT", name: "Sui",          price:     1.42, chg: +7.21, low:     1.30,  high:     1.45,  vol: "112亿", mcap: "36亿",   color: "#6fbcf0", fav: false, seed: 165, cats: ["Layer 1","新币种","All"] },
  { sym: "INJ",  pair: "USDT", name: "Injective",    price:    28.10, chg: -2.41, low:    27.50,  high:    29.10,  vol: "48亿",  mcap: "27亿",   color: "#00d2ff", fav: false, seed: 176, cats: ["DeFi","All"] },
  { sym: "PEPE", pair: "USDT", name: "Pepe",         price:     0.0000091, chg: +9.42, low: 0.00000820, high: 0.00000924, vol: "85亿", mcap: "38亿", color: "#3aa847", fav: false, seed: 187, cats: ["Meme","All"] },
  { sym: "WIF",  pair: "USDT", name: "dogwifhat",    price:     2.34, chg: -4.52, low:     2.21,  high:     2.50,  vol: "42亿",  mcap: "23亿",   color: "#f0a640", fav: false, seed: 198, cats: ["Meme","Solana","All"] },
  { sym: "RNDR", pair: "USDT", name: "Render",       price:     8.21, chg: +5.10, low:     7.80,  high:     8.30,  vol: "38亿",  mcap: "32亿",   color: "#cd1c5a", fav: false, seed: 209, cats: ["AI","DePIN","All"] },
  { sym: "FET",  pair: "USDT", name: "Fetch.ai",     price:     1.62, chg: +3.81, low:     1.55,  high:     1.66,  vol: "33亿",  mcap: "16亿",   color: "#1a1a2e", fav: false, seed: 220, cats: ["AI","All"] },
  { sym: "ONDO", pair: "USDT", name: "Ondo",         price:     0.91, chg: +2.21, low:     0.88,  high:     0.93,  vol: "28亿",  mcap: "13亿",   color: "#1f3a5c", fav: false, seed: 231, cats: ["RWA","All"] },
  { sym: "JUP",  pair: "USDT", name: "Jupiter",      price:     1.10, chg: +4.12, low:     1.05,  high:     1.13,  vol: "31亿",  mcap: "15亿",   color: "#9945ff", fav: false, seed: 242, cats: ["Solana","DeFi","All"] },
];

const SECTORS_DATA = [
  { name: "L1 公链", pct: +3.8 },
  { name: "L2 扩容", pct: +2.4 },
  { name: "DeFi",    pct: +1.1 },
  { name: "AI",      pct: +5.2 },
  { name: "DePIN",   pct: -1.4 },
  { name: "MEME",    pct: -2.7 },
  { name: "RWA",     pct: +0.9 },
  { name: "GameFi",  pct: -3.1 },
  { name: "Privacy", pct: -0.6 },
  { name: "Storage", pct: +1.6 },
];

// ===== Helpers =====
function rng(seed) {
  let s = seed | 0;
  return () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) % 10000) / 10000; };
}
function sparkPoints(seed, w = 100, h = 30, drift = 0) {
  const r = rng(seed);
  const n = 40;
  const ys = [];
  let v = h * 0.6;
  for (let i = 0; i < n; i++) {
    v += (r() - 0.5 + drift * 0.05) * h * 0.18;
    v = Math.max(h * 0.1, Math.min(h * 0.9, v));
    ys.push(v);
  }
  return ys.map((y, i) => `${(i / (n - 1)) * w},${y.toFixed(1)}`).join(" ");
}
function colorFor(chg) { return chg >= 0 ? "var(--up)" : "var(--dn)"; }
function fmtPx(p) {
  if (p < 0.0001) return p.toExponential(2);
  if (p < 1) return p.toFixed(4);
  return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== Sector tabs =====
function renderSectorTabs() {
  const wrap = document.querySelector(".sector-tabs");
  wrap.innerHTML = SECTORS_TAB.map((t, i) => `
    <button class="st-item ${i === 1 ? "active" : ""}" data-cat="${t}">${t}</button>
  `).join("");
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".st-item");
    if (!btn) return;
    wrap.querySelectorAll(".st-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderSymbolsTable(btn.dataset.cat);
  });
}

// ===== Symbols table =====
function renderSymbolsTable(cat = "All") {
  const tbody = document.querySelector('[data-page="market"] .tbody');
  let list = SYMBOLS;
  if (cat === "自选") list = SYMBOLS.filter((s) => s.fav);
  else if (cat !== "All") list = SYMBOLS.filter((s) => s.cats.includes(cat));

  tbody.innerHTML = list.map((s) => {
    const pos = ((s.price - s.low) / (s.high - s.low)) * 100;
    return `
    <div class="trow" data-sym="${s.sym}">
      <div class="col-name sym-cell">
        <span class="sym-bubble" style="background:${s.color}">${s.sym[0]}</span>
        <div class="name-block">
          <span class="ticker">${s.sym}<span class="muted small"> /${s.pair}</span></span>
          <span class="full">${s.name}</span>
        </div>
      </div>
      <div class="col-num">${fmtPx(s.price)}</div>
      <div class="col-num"><span class="${s.chg >= 0 ? "up" : "dn"}">${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%</span></div>
      <div class="col-spark">
        <svg class="spark" viewBox="0 0 100 32" preserveAspectRatio="none">
          <polyline fill="none" style="stroke:${colorFor(s.chg)};stroke-width:1.4" fill="none"
            points="${sparkPoints(s.seed, 100, 32, s.chg / 5)}" />
        </svg>
      </div>
      <div class="col-range range-cell">
        <div class="range-bar">
          <span class="lo">${fmtPx(s.low)}</span>
          <span class="marker" style="left:${Math.max(0, Math.min(100, pos))}%"></span>
          <span class="hi">${fmtPx(s.high)}</span>
        </div>
      </div>
      <div class="col-num">$${s.mcap}</div>
      <div class="col-act">
        <button class="tbtn">详情</button>
        <button class="tbtn primary">交易</button>
      </div>
    </div>`;
  }).join("");

  tbody.querySelectorAll(".trow").forEach((row) => {
    row.addEventListener("click", () => openKline(row.dataset.sym));
    row.querySelectorAll(".tbtn").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        openKline(row.dataset.sym);
      })
    );
  });
}

// ===== Kline page (left list + chart + orderbook) =====
function renderKlineSidebar(activeSym = "BTC") {
  const list = document.querySelector(".kps-list");
  list.innerHTML = SYMBOLS.map((s) => `
    <div class="kps-row ${s.sym === activeSym ? "active" : ""}" data-sym="${s.sym}">
      <div class="name">
        <div style="display:flex;flex-direction:column;gap:1px;min-width:0">
          <div><span class="ticker">${s.sym}/${s.pair}</span><span class="lev">10x</span></div>
          <div class="vol">$${s.mcap}</div>
        </div>
      </div>
      <div class="price">${fmtPx(s.price)}</div>
      <div class="chg ${s.chg >= 0 ? "up" : "dn"}">${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%</div>
    </div>
  `).join("");

  list.querySelectorAll(".kps-row").forEach((row) =>
    row.addEventListener("click", () => openKline(row.dataset.sym))
  );

  // chips
  const chips = document.querySelector(".kps-chips");
  chips.innerHTML = ["全部","主流币","新币种","AI","Solana","RWA","Meme","Layer 1","Layer 2","DeFi"]
    .map((c, i) => `<button class="chip ${i === 0 ? "active" : ""}">${c}</button>`).join("");
}

function renderKlineChart(s) {
  const r = rng(s.seed * 7 + 1);
  const n = 80;
  let price = s.price * 0.96;
  const candles = [];
  for (let i = 0; i < n; i++) {
    const open = price;
    const driftBias = (s.chg / 100) * 0.6;
    const change = (r() - 0.5 + driftBias / n) * s.price * 0.012;
    const close = open + change;
    const hi = Math.max(open, close) + r() * s.price * 0.004;
    const lo = Math.min(open, close) - r() * s.price * 0.004;
    candles.push({ open, close, high: hi, low: lo, vol: 200 + r() * 800 });
    price = close;
  }
  const min = Math.min(...candles.map((c) => c.low));
  const max = Math.max(...candles.map((c) => c.high));
  const w = 800, h = 320;
  const cw = w / n;
  const y = (p) => ((max - p) / (max - min)) * (h - 20) + 10;

  document.querySelector(".kp-chart .candles").innerHTML = candles.map((c, i) => {
    const x = i * cw + cw / 2;
    const up = c.close >= c.open;
    const color = up ? "var(--up)" : "var(--dn)";
    const b1 = y(Math.max(c.open, c.close));
    const b2 = y(Math.min(c.open, c.close));
    return `<line x1="${x}" x2="${x}" y1="${y(c.high)}" y2="${y(c.low)}" style="stroke:${color};stroke-width:1"/>
            <rect x="${i * cw + 1}" y="${b1}" width="${cw - 2}" height="${Math.max(1, b2 - b1)}" style="fill:${color}"/>`;
  }).join("");

  const vmax = Math.max(...candles.map((c) => c.vol));
  document.querySelector(".kp-vol .vols").innerHTML = candles.map((c, i) => {
    const x = i * cw + 1;
    const bh = (c.vol / vmax) * 90;
    const up = c.close >= c.open;
    const color = up ? "var(--up)" : "var(--dn)";
    return `<rect x="${x}" y="${100 - bh}" width="${cw - 2}" height="${bh}" style="fill:${color};fill-opacity:.55"/>`;
  }).join("");

  // price axis
  const axis = document.querySelector(".kp-chart .price-axis");
  const span = max - min;
  axis.innerHTML = [0, 1, 2, 3].map((i) => {
    const v = max - (span * i) / 3;
    return `<span>${fmtPx(v)}</span>`;
  }).join("");
}

function renderOrderbook(s) {
  const r = rng(s.seed + 7);
  const askRows = [];
  const bidRows = [];
  let pa = s.price, pb = s.price;
  let totA = 0, totB = 0;
  const step = s.price < 1 ? 0.0001 : (s.price < 100 ? 0.01 : 0.1);
  for (let i = 0; i < 14; i++) {
    pa += step + r() * step * 3;
    const qa = +(0.05 + r() * 1.6).toFixed(3);
    totA += qa;
    askRows.push({ p: pa, q: qa, t: totA });

    pb -= step + r() * step * 3;
    const qb = +(0.05 + r() * 1.6).toFixed(3);
    totB += qb;
    bidRows.push({ p: pb, q: qb, t: totB });
  }
  const maxTot = Math.max(askRows[askRows.length - 1].t, bidRows[bidRows.length - 1].t);

  document.querySelector(".kp-side .asks").innerHTML = [...askRows].reverse().map((row) => `
    <div class="ob-row ask">
      <div class="bar" style="width:${(row.t / maxTot) * 100}%"></div>
      <span class="px ask">${fmtPx(row.p)}</span>
      <span class="qty">${row.q.toFixed(3)}</span>
      <span class="total">${row.t.toFixed(2)}</span>
    </div>
  `).join("");
  document.querySelector(".kp-side .bids").innerHTML = bidRows.map((row) => `
    <div class="ob-row bid">
      <div class="bar" style="width:${(row.t / maxTot) * 100}%"></div>
      <span class="px bid">${fmtPx(row.p)}</span>
      <span class="qty">${row.q.toFixed(3)}</span>
      <span class="total">${row.t.toFixed(2)}</span>
    </div>
  `).join("");

  // mid price
  const mid = document.querySelector(".kp-side .ob-mid");
  mid.innerHTML = `
    <span class="${s.chg >= 0 ? "up" : "dn"}">${fmtPx(s.price)} ${s.chg >= 0 ? "↑" : "↓"}</span>
    <span class="muted small">≈ $${fmtPx(s.price)}</span>
  `;
}

function renderKlineHeader(s) {
  document.querySelector(".kp-pair").innerHTML = `${s.sym}/${s.pair} <span class="muted small">现货</span>`;
  document.querySelector(".kp-symbol .muted.small + div, .kp-symbol .name-block")?.remove?.();
  const nameDiv = document.querySelector(".kp-symbol > div:last-child");
  nameDiv.innerHTML = `<div class="kp-pair">${s.sym}/${s.pair} <span class="muted small">现货</span></div>
                       <div class="muted small">${s.name}</div>`;
  const last = document.querySelector(".kp-last");
  last.textContent = fmtPx(s.price);
  last.className = "kp-last " + (s.chg >= 0 ? "up" : "dn");
  const chgEl = document.querySelector(".kp-chg");
  const delta = (s.price * s.chg / 100).toFixed(2);
  chgEl.textContent = `${s.chg >= 0 ? "+" : ""}${delta} (${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%)`;
  chgEl.className = "kp-chg small " + (s.chg >= 0 ? "up" : "dn");

  // bubble
  const bubble = document.querySelector(".kp-symbol .sym-bubble");
  bubble.style.background = s.color;
  bubble.textContent = s.sym[0];

  // stats
  const stats = document.querySelector(".kp-stats");
  stats.innerHTML = `
    <div><span class="muted small">指数价格</span><span>${fmtPx(s.price * 0.999)}</span></div>
    <div><span class="muted small">24h 高</span><span>${fmtPx(s.high)}</span></div>
    <div><span class="muted small">24h 低</span><span>${fmtPx(s.low)}</span></div>
    <div><span class="muted small">24h 量(${s.sym})</span><span>${s.vol}</span></div>
    <div><span class="muted small">24h 额(USDT)</span><span>${s.vol}</span></div>
  `;

  // trade form labels
  document.querySelectorAll(".kt-form .input .suffix").forEach((el, idx) => {
    if (idx % 3 === 0) el.textContent = "USDT";
    else if (idx % 3 === 1) el.textContent = s.sym;
    else el.textContent = "USDT";
  });
  document.querySelector(".kt-cta.buy").textContent = `买入 ${s.sym}`;
  document.querySelector(".kt-cta.sell").textContent = `卖出 ${s.sym}`;
  document.querySelectorAll(".kt-form .input input").forEach((el, idx) => {
    if (idx === 0 || idx === 4) el.value = fmtPx(s.price);
  });
}

function openKline(symKey) {
  const s = SYMBOLS.find((x) => x.sym === symKey) || SYMBOLS[0];
  switchPage("kline");
  renderKlineHeader(s);
  renderKlineChart(s);
  renderOrderbook(s);
  document.querySelectorAll(".kps-row").forEach((r) => {
    r.classList.toggle("active", r.dataset.sym === s.sym);
  });
}

// ===== Research =====
function rotationColor(pct) {
  const x = Math.max(-10, Math.min(10, pct));
  if (x >= 0) {
    const t = x / 10;
    const r = Math.round(31 + (43 - 31) * t);
    const g = Math.round(91 + (208 - 91) * t);
    const b = Math.round(58 + (122 - 58) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = -x / 10;
    const r = Math.round(42 + (176 - 42) * t);
    const g = Math.round(47 + (32 - 47) * t);
    const b = Math.round(58 + (42 - 58) * t);
    return `rgb(${r},${g},${b})`;
  }
}

function renderRotation() {
  const all = SYMBOLS.slice().sort((a, b) => b.chg - a.chg);
  const heat = document.querySelector('[data-rsection="rotation"] .heatmap');
  heat.innerHTML = all.slice(0, 16).map((s) => `
    <div class="hm-cell" style="background:${rotationColor(s.chg)}" data-sym="${s.sym}">
      <div class="name">${s.sym}</div>
      <div class="pct">${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%</div>
    </div>
  `).join("");
  heat.querySelectorAll(".hm-cell").forEach((c) =>
    c.addEventListener("click", (e) => {
      e.stopPropagation();
      showMiniKline(c.dataset.sym, c);
    })
  );

  const bars = document.querySelector('[data-rsection="rotation"] .sector-bars');
  const sorted = SECTORS_DATA.slice().sort((a, b) => b.pct - a.pct);
  bars.innerHTML = sorted.map((s) => {
    const w = Math.min(50, Math.abs(s.pct) * 5);
    const cls = s.pct >= 0 ? "up" : "dn";
    return `
      <div class="sector-row">
        <span>${s.name}</span>
        <div class="sector-bar"><div class="fill ${cls}" style="width:${w}%"></div></div>
        <span class="pct ${cls}">${s.pct >= 0 ? "+" : ""}${s.pct.toFixed(1)}%</span>
      </div>`;
  }).join("");

  const upList = SYMBOLS.filter((s) => s.chg > 0).sort((a, b) => b.chg - a.chg).slice(0, 6);
  const dnList = SYMBOLS.filter((s) => s.chg < 0).sort((a, b) => a.chg - b.chg).slice(0, 6);
  const renderRank = (arr, side) => arr.map((s, i) => `
    <div class="rank-row" data-sym="${s.sym}">
      <span class="rank-rank">${i + 1}</span>
      <span class="name"><span class="sym-bubble" style="background:${s.color};width:18px;height:18px;font-size:9px">${s.sym[0]}</span>${s.sym}</span>
      <svg class="spark" viewBox="0 0 80 24" preserveAspectRatio="none">
        <polyline fill="none" style="stroke:${side === "up" ? "var(--up)" : "var(--dn)"};stroke-width:1.4" fill="none"
          points="${sparkPoints(s.seed + 9, 80, 24, side === "up" ? 1 : -1)}" />
      </svg>
      <span class="num ${side}">${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%</span>
    </div>`).join("");

  document.querySelector('.rank-list[data-side="up"]').innerHTML = renderRank(upList, "up");
  document.querySelector('.rank-list[data-side="dn"]').innerHTML = renderRank(dnList, "dn");

  document.querySelectorAll('[data-rsection="rotation"] .rank-row')
    .forEach((el) => el.addEventListener("click", () => openKline(el.dataset.sym)));
}

// ===== Mini K-line popover =====
function renderMiniCandles(s, tf = "4h") {
  const tfSeed = { "15m": 1, "1h": 3, "4h": 7, "1d": 11 }[tf] || 7;
  const r = rng(s.seed * tfSeed + 5);
  const n = 50;
  let price = s.price * 0.95;
  const candles = [];
  for (let i = 0; i < n; i++) {
    const open = price;
    const driftBias = (s.chg / 100) * 0.5;
    const change = (r() - 0.5 + driftBias / n) * s.price * 0.013;
    const close = open + change;
    const hi = Math.max(open, close) + r() * s.price * 0.005;
    const lo = Math.min(open, close) - r() * s.price * 0.005;
    candles.push({ open, close, high: hi, low: lo });
    price = close;
  }
  const min = Math.min(...candles.map((c) => c.low));
  const max = Math.max(...candles.map((c) => c.high));
  const w = 400, h = 160, cw = w / n;
  const y = (p) => ((max - p) / (max - min)) * (h - 16) + 8;
  return candles.map((c, i) => {
    const x = i * cw + cw / 2;
    const up = c.close >= c.open;
    const color = up ? "var(--up)" : "var(--dn)";
    const b1 = y(Math.max(c.open, c.close));
    const b2 = y(Math.min(c.open, c.close));
    return `<line x1="${x}" x2="${x}" y1="${y(c.high)}" y2="${y(c.low)}" style="stroke:${color};stroke-width:1"/>
            <rect x="${i * cw + 1}" y="${b1}" width="${Math.max(1, cw - 2)}" height="${Math.max(1, b2 - b1)}" style="fill:${color}"/>`;
  }).join("");
}

let miniState = { sym: null, tf: "4h" };

function showMiniKline(symKey, anchorEl) {
  const s = SYMBOLS.find((x) => x.sym === symKey);
  if (!s) return;
  miniState = { sym: symKey, tf: miniState.tf };

  const panel = document.querySelector(".mini-kline");
  const upDn = s.chg >= 0 ? "up" : "dn";

  panel.querySelector(".mk-bubble").style.background = s.color;
  panel.querySelector(".mk-bubble").textContent = s.sym[0];
  panel.querySelector(".mk-name").textContent = `${s.sym}/${s.pair}`;
  panel.querySelector(".mk-sub").textContent = s.name;

  const priceEl = panel.querySelector(".mk-price");
  priceEl.textContent = fmtPx(s.price);
  priceEl.className = "mk-price " + upDn;

  const chgEl = panel.querySelector(".mk-chg");
  chgEl.textContent = `${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%`;
  chgEl.className = "mk-chg " + upDn;

  panel.querySelector(".mk-hi").textContent = fmtPx(s.high);
  panel.querySelector(".mk-lo").textContent = fmtPx(s.low);

  panel.querySelector(".mk-candles").innerHTML = renderMiniCandles(s, miniState.tf);

  // position near anchor
  panel.classList.remove("hidden");
  const rect = anchorEl.getBoundingClientRect();
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;
  const margin = 8;
  let left = rect.left + rect.width / 2 - pw / 2;
  let top = rect.bottom + 10;
  // clamp horizontally
  left = Math.max(margin, Math.min(left, window.innerWidth - pw - margin));
  // flip up if no room below
  if (top + ph > window.innerHeight - margin) {
    top = rect.top - ph - 10;
    panel.classList.add("flip-up");
  } else {
    panel.classList.remove("flip-up");
  }
  // arrow x position relative to panel
  const arrowX = Math.max(12, Math.min(pw - 24, rect.left + rect.width / 2 - left - 6));
  panel.style.setProperty("--mk-arrow", `${arrowX}px`);
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

function hideMiniKline() {
  document.querySelector(".mini-kline").classList.add("hidden");
}

document.querySelector(".mk-close").addEventListener("click", hideMiniKline);

document.querySelector(".mini-kline").addEventListener("click", (e) => e.stopPropagation());

document.addEventListener("click", (e) => {
  if (document.querySelector(".mini-kline").classList.contains("hidden")) return;
  if (e.target.closest(".hm-cell")) return;
  hideMiniKline();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideMiniKline();
});

document.querySelectorAll(".mk-tf-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mk-tf-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    miniState.tf = btn.textContent.trim();
    if (miniState.sym) {
      const s = SYMBOLS.find((x) => x.sym === miniState.sym);
      document.querySelector(".mk-candles").innerHTML = renderMiniCandles(s, miniState.tf);
    }
  });
});

document.querySelector(".mk-goto").addEventListener("click", () => {
  if (miniState.sym) {
    hideMiniKline();
    openKline(miniState.sym);
  }
});

const SIMILAR_DATA = [
  { sym: "ETH",  corr: 0.94, color: "#627eea", seed: 222 },
  { sym: "BNB",  corr: 0.87, color: "#f0b341", seed: 223 },
  { sym: "SOL",  corr: 0.82, color: "#9945ff", seed: 224 },
  { sym: "AVAX", corr: 0.79, color: "#e84142", seed: 225 },
  { sym: "TON",  corr: 0.76, color: "#0098ea", seed: 226 },
  { sym: "ARB",  corr: 0.73, color: "#2d374b", seed: 227 },
  { sym: "LINK", corr: 0.71, color: "#2a5ada", seed: 228 },
  { sym: "OP",   corr: 0.70, color: "#ff0420", seed: 229 },
];

function renderSimilarity() {
  const grid = document.querySelector('[data-rsection="similarity"] .similar-grid');
  const refSeed = 4242;
  grid.innerHTML = SIMILAR_DATA.map((d) => {
    const refPts = sparkPoints(refSeed, 240, 70, 0.6);
    const candPts = sparkPoints(d.seed, 240, 70, 0.6 * d.corr);
    const klass = d.corr >= 0.85 ? "high" : "mid";
    const inCmp = compareState.includes(d.sym);
    return `
      <div class="sim-card" data-sym="${d.sym}">
        <button class="sim-add ${inCmp ? "added" : ""}" data-sym-add="${d.sym}" title="${inCmp ? "已在对比" : "加入对比"}">${inCmp ? "✓" : "+"}</button>
        <div class="sim-head">
          <span class="sym-bubble" style="background:${d.color}">${d.sym[0]}</span>
          <span class="sim-name">${d.sym}/USDT</span>
          <span class="sim-corr ${klass}">ρ ${d.corr.toFixed(2)}</span>
        </div>
        <svg class="sim-chart" viewBox="0 0 240 70" preserveAspectRatio="none">
          <polyline fill="none" stroke="var(--text-3)" stroke-width="1" stroke-dasharray="2 3" points="${refPts}" />
          <polyline fill="none" stroke="var(--accent)" stroke-width="1.6" points="${candPts}" />
        </svg>
        <div class="sim-meta"><span>橙线 = ${d.sym}</span><span>虚线 = BTC</span></div>
      </div>`;
  }).join("");
  grid.querySelectorAll(".sim-card").forEach((c) =>
    c.addEventListener("click", (e) => {
      if (e.target.closest(".sim-add")) return;
      openKline(c.dataset.sym);
    })
  );
  grid.querySelectorAll(".sim-add").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      compareAdd([b.dataset.symAdd]);
    })
  );
  document.querySelector(".btn-add-all")?.addEventListener("click", () => {
    compareAdd(SIMILAR_DATA.map((d) => d.sym));
    document.querySelector('.rt-item[data-rsection="compare"]').click();
  }, { once: true });
}

// ===== Compare page =====
let compareState = ["BTC", "ETH", "SOL", "BNB", "AVAX", "DOGE"];
let compareNorm = false;
let compareTf = "4h";

function compareAdd(syms) {
  const validUpper = syms
    .map((s) => String(s).trim().toUpperCase())
    .filter((s) => s);
  for (const u of validUpper) {
    const known = SYMBOLS.find((x) => x.sym === u);
    if (known && !compareState.includes(known.sym)) compareState.push(known.sym);
  }
  renderCompare();
  renderSimilarity(); // refresh "+" button states
}

function compareRemove(sym) {
  compareState = compareState.filter((s) => s !== sym);
  renderCompare();
  renderSimilarity();
}

function compareCard(sym) {
  const s = SYMBOLS.find((x) => x.sym === sym);
  if (!s) {
    return `
      <div class="cmp-card miss" data-sym="${sym}">
        <button class="cmp-rm" data-rm="${sym}" title="移除">×</button>
        <div class="cmp-head">
          <span class="cmp-name">${sym}</span>
          <span class="cmp-chg dn">未识别</span>
        </div>
        <div class="muted small">在 mock 数据里找不到这个 symbol</div>
      </div>`;
  }
  const tfSeed = { "15m": 1, "1h": 3, "4h": 7, "1d": 11, "1w": 17 }[compareTf] || 7;
  const r = rng(s.seed * tfSeed + 5);
  const n = 50;
  let price = s.price * 0.95;
  const candles = [];
  for (let i = 0; i < n; i++) {
    const open = price;
    const drift = (s.chg / 100) * 0.5;
    const change = (r() - 0.5 + drift / n) * s.price * 0.013;
    const close = open + change;
    candles.push({ open, close,
      high: Math.max(open, close) + r() * s.price * 0.005,
      low:  Math.min(open, close) - r() * s.price * 0.005 });
    price = close;
  }
  const mn = Math.min(...candles.map((c) => c.low));
  const mx = Math.max(...candles.map((c) => c.high));
  const w = 320, h = 110, cw = w / n;
  const y = (p) => ((mx - p) / (mx - mn)) * (h - 12) + 6;
  const candlesSvg = candles.map((c, i) => {
    const x = i * cw + cw / 2;
    const up = c.close >= c.open;
    const color = up ? "var(--up)" : "var(--dn)";
    const b1 = y(Math.max(c.open, c.close));
    const b2 = y(Math.min(c.open, c.close));
    return `<line x1="${x}" x2="${x}" y1="${y(c.high)}" y2="${y(c.low)}" style="stroke:${color};stroke-width:1"/>
            <rect x="${i * cw + 1}" y="${b1}" width="${Math.max(1, cw - 2)}" height="${Math.max(1, b2 - b1)}" style="fill:${color}"/>`;
  }).join("");

  return `
    <div class="cmp-card" data-sym="${sym}">
      <button class="cmp-rm" data-rm="${sym}" title="移除">×</button>
      <div class="cmp-head">
        <span class="sym-bubble" style="background:${s.color};width:18px;height:18px;font-size:9px">${s.sym[0]}</span>
        <span class="cmp-name">${s.sym}/${s.pair}</span>
        <span class="cmp-price">${fmtPx(s.price)}</span>
      </div>
      <svg class="cmp-chart" viewBox="0 0 320 110" preserveAspectRatio="none">${candlesSvg}</svg>
      <div class="cmp-meta-row">
        <span class="${s.chg >= 0 ? "up" : "dn"}">${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%</span>
        <span>H ${fmtPx(s.high)}</span>
        <span>L ${fmtPx(s.low)}</span>
      </div>
    </div>`;
}

function renderCompare() {
  const grid = document.querySelector('[data-rsection="compare"] .cmp-grid');
  const meta = document.querySelector('[data-rsection="compare"] .cmp-meta');
  if (!grid) return;

  if (!compareState.length) {
    grid.innerHTML = `
      <div class="cmp-empty">
        <div>对比池为空</div>
        <button id="cmp-empty-add">＋ 添加 symbol</button>
        <button id="cmp-empty-import">⇪ 批量导入</button>
        <button id="cmp-empty-similar">从"走势相似"导入</button>
      </div>`;
    meta.textContent = "";
    grid.querySelector("#cmp-empty-add")?.addEventListener("click", () => openImportDialog(true));
    grid.querySelector("#cmp-empty-import")?.addEventListener("click", () => openImportDialog());
    grid.querySelector("#cmp-empty-similar")?.addEventListener("click", () =>
      document.querySelector('.rt-item[data-rsection="similarity"]').click()
    );
    return;
  }

  meta.textContent = `共 ${compareState.length} 个 · 周期 ${compareTf}${compareNorm ? " · 已归一化" : ""}`;
  grid.innerHTML = compareState.map(compareCard).join("");
  grid.querySelectorAll(".cmp-rm").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      compareRemove(b.dataset.rm);
    })
  );
  grid.querySelectorAll(".cmp-card").forEach((c) =>
    c.addEventListener("click", () => openKline(c.dataset.sym))
  );
}

// ----- Toolbar bindings -----
function bindCompareToolbar() {
  const sec = document.querySelector('[data-rsection="compare"]');
  // timeframe chips
  sec.querySelectorAll(".filters .chip").forEach((c) => {
    if (["15m","1h","4h","1d","1w"].includes(c.textContent.trim())) {
      c.addEventListener("click", () => {
        compareTf = c.textContent.trim();
        renderCompare();
      });
    }
  });
  // grid density buttons
  sec.querySelectorAll(".cmp-cols").forEach((b) => {
    b.addEventListener("click", () => {
      sec.querySelectorAll(".cmp-cols").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      sec.querySelector("div.cmp-grid").dataset.cols = b.dataset.cols;
    });
  });
  // norm toggle
  document.querySelector("#cmp-norm")?.addEventListener("click", function () {
    compareNorm = !compareNorm;
    this.classList.toggle("active", compareNorm);
    renderCompare();
  });
  // clear
  document.querySelector("#cmp-clear")?.addEventListener("click", () => {
    compareState = [];
    renderCompare();
    renderSimilarity();
  });
  // add (one symbol via prompt-like dialog, reuse import dialog)
  document.querySelector("#cmp-add")?.addEventListener("click", () => openImportDialog());
  document.querySelector("#cmp-import")?.addEventListener("click", () => openImportDialog());
}

// ----- Batch import dialog -----
function parseSymbolList(text) {
  return text.split(/[\s,;\n\t]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);
}
function classifySymbols(arr) {
  const known = new Set(SYMBOLS.map((s) => s.sym));
  const ok = [], miss = [];
  for (const s of arr) (known.has(s) ? ok : miss).push(s);
  return { ok: [...new Set(ok)], miss: [...new Set(miss)] };
}
function updateImportPreview() {
  const ta = document.querySelector(".cd-input");
  const preview = document.querySelector(".cd-preview");
  const replaceBtn = document.querySelector('[data-cd-action="apply"]');
  const appendBtn = document.querySelector('[data-cd-action="append"]');
  const { ok, miss } = classifySymbols(parseSymbolList(ta.value));
  preview.innerHTML =
    (ok.length ? `<span class="pill-ok">识别 ${ok.length} 个</span>: ${ok.join(", ")}` : `<span>暂未识别任何 symbol</span>`) +
    (miss.length ? ` <span class="pill-miss">未识别 ${miss.length}</span>: ${miss.join(", ")}` : "");
  replaceBtn.textContent = `替换 (${ok.length})`;
  appendBtn.textContent = `追加 (${ok.length})`;
}

function openImportDialog() {
  const dlg = document.querySelector('[data-dialog="cmp-import"]');
  dlg.classList.remove("hidden");
  const ta = dlg.querySelector(".cd-input");
  ta.value = "";
  updateImportPreview();
  setTimeout(() => ta.focus(), 30);
}
function closeImportDialog() {
  document.querySelector('[data-dialog="cmp-import"]').classList.add("hidden");
}

function bindImportDialog() {
  const dlg = document.querySelector('[data-dialog="cmp-import"]');
  if (!dlg) return;
  dlg.querySelector(".cd-close").addEventListener("click", closeImportDialog);
  dlg.querySelector('[data-cd-action="cancel"]').addEventListener("click", closeImportDialog);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeImportDialog(); });
  dlg.querySelector(".cd-input").addEventListener("input", updateImportPreview);
  dlg.querySelectorAll(".cd-quick .chip").forEach((c) =>
    c.addEventListener("click", () => {
      const cat = c.dataset.quick;
      let syms = [];
      if (cat === "自选") syms = SYMBOLS.filter((s) => s.fav).map((s) => s.sym);
      else syms = SYMBOLS.filter((s) => s.cats.includes(cat)).map((s) => s.sym);
      const ta = dlg.querySelector(".cd-input");
      const existing = parseSymbolList(ta.value);
      const merged = [...new Set([...existing, ...syms])];
      ta.value = merged.join(", ");
      updateImportPreview();
    })
  );
  dlg.querySelector('[data-cd-action="apply"]').addEventListener("click", () => {
    const { ok } = classifySymbols(parseSymbolList(dlg.querySelector(".cd-input").value));
    compareState = [];
    compareAdd(ok);
    closeImportDialog();
  });
  dlg.querySelector('[data-cd-action="append"]').addEventListener("click", () => {
    const { ok } = classifySymbols(parseSymbolList(dlg.querySelector(".cd-input").value));
    compareAdd(ok);
    closeImportDialog();
  });
}

// ===== ETF bars decoration =====
function renderEtfBars() {
  const svg = document.querySelector(".etf-bars");
  if (!svg) return;
  const r = rng(909);
  const n = 30, w = 200, h = 50;
  const bw = w / n;
  let html = "";
  for (let i = 0; i < n; i++) {
    const v = (r() - 0.4) * 24;
    const up = v >= 0;
    const bh = Math.abs(v);
    const y = up ? h / 2 - bh : h / 2;
    html += `<rect x="${i * bw + 1}" y="${y}" width="${bw - 2}" height="${bh}" fill="${up ? "var(--up)" : "var(--dn)"}" opacity=".85"/>`;
  }
  svg.innerHTML = html;
}

// ===== Page switching =====
function switchPage(name) {
  document.querySelectorAll(".pn-item").forEach((el) =>
    el.classList.toggle("active", el.dataset.page === name && name !== "kline")
  );
  if (name === "kline") {
    // when on kline page, keep "市场" highlighted as parent context
    document.querySelector('.pn-item[data-page="market"]').classList.add("active");
  }
  document.querySelectorAll(".page").forEach((el) =>
    el.classList.toggle("hidden", el.dataset.page !== name)
  );
  if (name === "agent") bootAgent();
}

document.querySelectorAll(".pn-item").forEach((el) =>
  el.addEventListener("click", () => switchPage(el.dataset.page))
);

// research sub-tabs
document.querySelectorAll(".rt-item").forEach((el) =>
  el.addEventListener("click", () => {
    document.querySelectorAll(".rt-item").forEach((b) => b.classList.remove("active"));
    el.classList.add("active");
    document.querySelectorAll(".rsection").forEach((s) =>
      s.classList.toggle("hidden", s.dataset.rsection !== el.dataset.rsection)
    );
  })
);

// Generic chip / tf single-select inside a parent
document.addEventListener("click", (e) => {
  const t = e.target.closest(".chip, .tf, .qchip, .kt-tab, .kp-tab, .kps-tab, .ko-tab, .om");
  if (!t) return;
  const group = t.parentElement;
  group.querySelectorAll(t.matches(".chip") ? ".chip"
    : t.matches(".tf") ? ".tf"
    : t.matches(".qchip") ? ".qchip"
    : t.matches(".kt-tab") ? ".kt-tab"
    : t.matches(".kp-tab") ? ".kp-tab"
    : t.matches(".kps-tab") ? ".kps-tab"
    : t.matches(".ko-tab") ? ".ko-tab"
    : ".om"
  ).forEach((b) => b.classList.remove("active"));
  t.classList.add("active");
});

// ===== Boot =====
// ===== Agent page =====
let agentCtx = { sym: null, tf: null }; // active context chips

function renderAgentContext() {
  const wrap = document.querySelector(".ai-context");
  const chips = [];
  if (agentCtx.sym) chips.push({ k: "sym", label: `📈 ${agentCtx.sym}/USDT` });
  if (agentCtx.tf)  chips.push({ k: "tf",  label: `⏱ ${agentCtx.tf}` });
  wrap.innerHTML = chips.map((c) =>
    `<span class="ai-chip">${c.label}<button class="x" data-clear="${c.k}" title="移除">×</button></span>`
  ).join("");
  wrap.querySelectorAll(".x").forEach((b) =>
    b.addEventListener("click", () => {
      agentCtx[b.dataset.clear] = null;
      renderAgentContext();
    })
  );
}

function appendUserMsg(text) {
  const wrap = document.querySelector(".agent-conv-inner");
  const div = document.createElement("div");
  div.className = "msg user";
  div.innerHTML = `
    <div class="msg-avatar">A</div>
    <div class="msg-body">${escapeHtml(text)}</div>`;
  wrap.appendChild(div);
  scrollConvToBottom();
}

function appendAgentMsg(html) {
  const wrap = document.querySelector(".agent-conv-inner");
  const div = document.createElement("div");
  div.className = "msg ag";
  div.innerHTML = `<div class="msg-avatar">✦</div><div class="msg-body">${html}</div>`;
  wrap.appendChild(div);
  scrollConvToBottom();
  return div;
}

function appendTypingMsg() {
  return appendAgentMsg(`<span class="msg-typing"><span></span><span></span><span></span></span>`);
}

function scrollConvToBottom() {
  const c = document.querySelector(".agent-conv");
  c.scrollTop = c.scrollHeight;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Build a small candle SVG card for an agent reply
function miniCandleSvg(seed, drift = 0) {
  const r = rng(seed);
  const n = 30;
  let v = 50;
  const pts = [];
  for (let i = 0; i < n; i++) {
    v += (r() - 0.5 + drift * 0.05) * 14;
    v = Math.max(15, Math.min(85, v));
    pts.push({ x: (i / (n - 1)) * 240, y: v });
  }
  const stroke = drift >= 0 ? "var(--up)" : "var(--dn)";
  const fill = drift >= 0 ? "var(--up-bg)" : "var(--dn-bg)";
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${line} 240,90 0,90`;
  return `
    <svg viewBox="0 0 240 90" preserveAspectRatio="none" class="mc-mini-svg">
      <polyline fill="none" style="stroke:${stroke};stroke-width:1.6" points="${line}" />
      <polyline fill="${fill}" stroke="none" points="${area}" />
    </svg>`;
}

// Mock answers — each takes user text + ctx, returns rich HTML
function fakeAnswer(text, ctx) {
  const sym = ctx.sym || "BTC";
  const s = SYMBOLS.find((x) => x.sym === sym) || SYMBOLS[0];
  const lower = text.toLowerCase();

  // Pattern 1: 解读最近 X
  if (text.includes("解读") || text.includes("走势") || lower.includes("trend")) {
    const dir = s.chg >= 0 ? "上行" : "下行";
    const adj = Math.abs(s.chg) > 4 ? "明显" : "温和";
    return `
      <p><strong>简短结论</strong>：${s.sym}/USDT 近 24h 处于${adj}${dir}通道，幅度 ${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%；当前价 <span class="num">${fmtPx(s.price)}</span>。</p>
      <div class="msg-card">
        <div class="mc-head">${s.sym} · 24h <span class="muted">归一化走势</span></div>
        ${miniCandleSvg(s.seed + 1, s.chg)}
      </div>
      <div class="msg-card">
        <div class="mc-head">关键数据</div>
        <div class="mc-table">
          <span class="k">24h 高 / 低</span><span class="v">${fmtPx(s.high)} / ${fmtPx(s.low)}</span>
          <span class="k">当前位置</span><span class="v">${(((s.price - s.low) / (s.high - s.low)) * 100).toFixed(0)}%</span>
          <span class="k">24h 量 / 额</span><span class="v">${s.vol} / $${s.vol}</span>
          <span class="k">市值</span><span class="v">$${s.mcap}</span>
        </div>
      </div>
      <p>${s.chg >= 0
        ? "短线动能仍在，但已接近 24h 高点，回踩支撑后再观察追多更稳。"
        : "动能转弱，建议等到日内 RSI 回升或 5m 出现底分型再看反弹机会。"}</p>
      <div class="msg-actions">
        <button class="msg-action" data-go-kline="${s.sym}">查看完整 K 线 →</button>
        <button class="msg-action" data-go-similar="${s.sym}">找相似走势</button>
        <button class="msg-action">设置告警</button>
      </div>`;
  }

  // Pattern 2: 找相似
  if (text.includes("相似") || text.includes("类似")) {
    const similars = SYMBOLS
      .filter((x) => x.sym !== s.sym)
      .map((x) => ({ ...x, corr: 0.65 + Math.random() * 0.30 }))
      .sort((a, b) => b.corr - a.corr)
      .slice(0, 5);
    return `
      <p>用 <strong>皮尔森</strong> 计算 ${s.sym} 近 30d 的相关度，前 5 名：</p>
      <div class="msg-card">
        <div class="mc-head">相似标的 <span class="muted">点击进 K 线</span></div>
        <div class="mc-list">
          ${similars.map((x) => `
            <div class="mc-list-row clickable" data-go-kline="${x.sym}">
              <span class="sym-bubble" style="background:${x.color};width:18px;height:18px;font-size:9px">${x.sym[0]}</span>
              <span>${x.sym}/USDT</span>
              <span class="corr">ρ ${x.corr.toFixed(2)}</span>
              <span class="delta ${x.chg >= 0 ? "up" : "dn"}">${x.chg >= 0 ? "+" : ""}${x.chg.toFixed(2)}%</span>
            </div>`).join("")}
        </div>
      </div>
      <p>注意：高相关 ≠ 因果，仅供寻找替代 / 套保标的参考。</p>`;
  }

  // Pattern 3: 板块轮动
  if (text.includes("板块") || text.includes("轮动")) {
    const sorted = [...SECTORS_DATA].sort((a, b) => b.pct - a.pct);
    const winners = sorted.slice(0, 3).map((x) => x.name).join("、");
    const losers = sorted.slice(-3).map((x) => x.name).join("、");
    return `
      <p>近 24h 板块强弱排序如下：</p>
      <div class="msg-card">
        <div class="mc-head">板块强弱</div>
        <div class="mc-table">
          ${sorted.map((x) => `<span class="k">${x.name}</span><span class="v ${x.pct >= 0 ? "up" : "dn"}">${x.pct >= 0 ? "+" : ""}${x.pct.toFixed(1)}%</span>`).join("")}
        </div>
      </div>
      <p><strong>领涨</strong>：${winners}。</p>
      <p><strong>领跌</strong>：${losers}。</p>
      <p>资金近期偏好高叙事板块（AI / L1），从 GameFi、MEME 流出，建议避开后者短线回踩位。</p>
      <div class="msg-actions">
        <button class="msg-action" data-go-research="rotation">打开完整板块轮动 →</button>
      </div>`;
  }

  // Default
  return `<p>已收到。这是 mockup —— 在真实实现里，会基于上下文 <strong>${ctx.sym || "(未指定)"}</strong>${ctx.tf ? ` · <strong>${ctx.tf}</strong>` : ""} 调用模型回答："${escapeHtml(text)}"。</p>`;
}

function sendAgentMessage(text) {
  if (!text || !text.trim()) return;
  appendUserMsg(text);
  const placeholder = appendTypingMsg();
  setTimeout(() => {
    placeholder.querySelector(".msg-body").innerHTML = fakeAnswer(text, agentCtx);
    bindAgentMsgActions(placeholder);
    scrollConvToBottom();
  }, 380);
  // clear input
  const ta = document.querySelector(".ai-textarea");
  ta.value = "";
  ta.style.height = "";
}

function bindAgentMsgActions(scope) {
  scope.querySelectorAll("[data-go-kline]").forEach((b) =>
    b.addEventListener("click", () => openKline(b.dataset.goKline))
  );
  scope.querySelectorAll("[data-go-similar]").forEach((b) =>
    b.addEventListener("click", () => {
      switchPage("research");
      document.querySelector('.rt-item[data-rsection="similarity"]').click();
    })
  );
  scope.querySelectorAll("[data-go-research]").forEach((b) =>
    b.addEventListener("click", () => switchPage("research"))
  );
}

function bootAgent() {
  // Initial greeting
  const wrap = document.querySelector(".agent-conv-inner");
  if (wrap.children.length) return;
  const greet = appendAgentMsg(`
    <p>你好。我是 Color Pepper 的行情研究助手 —— 只读分析，不会下单。</p>
    <p>你可以这样问我：</p>
    <div class="msg-suggest">
      <button class="sg">解读 BTC 最近 24h 走势</button>
      <button class="sg">和 SOL 走势相似的标的有哪些？</button>
      <button class="sg">最近哪些板块在轮动？</button>
    </div>
  `);
  greet.querySelectorAll(".sg").forEach((b) =>
    b.addEventListener("click", () => sendAgentMessage(b.textContent.trim()))
  );
}

function openAgent({ sym = null, tf = null } = {}) {
  if (sym) agentCtx.sym = sym;
  if (tf)  agentCtx.tf = tf;
  switchPage("agent");
  renderAgentContext();
  bootAgent();
  setTimeout(() => document.querySelector(".ai-textarea")?.focus(), 50);
}

// Quick prompts in the input footer
document.querySelectorAll(".qprompt").forEach((b) =>
  b.addEventListener("click", () => sendAgentMessage(b.textContent.trim()))
);

// Send button + Enter to send (Shift+Enter newline)
document.querySelector(".ai-send")?.addEventListener("click", () => {
  sendAgentMessage(document.querySelector(".ai-textarea").value);
});
document.querySelector(".ai-textarea")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendAgentMessage(e.currentTarget.value);
  }
});
// Auto-grow textarea
document.querySelector(".ai-textarea")?.addEventListener("input", (e) => {
  e.currentTarget.style.height = "";
  e.currentTarget.style.height = Math.min(200, e.currentTarget.scrollHeight) + "px";
});

// "问 Agent" button in K-line header
document.querySelector(".ask-agent")?.addEventListener("click", () => {
  // Read current symbol from the K-line header
  const pair = document.querySelector(".kp-pair")?.textContent || "";
  const sym = pair.split("/")[0].trim();
  const tfBtn = document.querySelector(".kp-tabs .tf-group .tf.active");
  const tf = tfBtn?.textContent.trim();
  openAgent({ sym, tf });
});

// ===== Theme switching =====
function applyTheme(name) {
  const root = document.documentElement;
  if (name === "cyber" || !name) delete root.dataset.theme;
  else root.dataset.theme = name;
  document.querySelectorAll(".tt-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.themeSet === (name || "cyber"))
  );
  try { localStorage.setItem("cp.theme", name || "cyber"); } catch {}
}
document.querySelectorAll(".tt-btn").forEach((b) =>
  b.addEventListener("click", () => applyTheme(b.dataset.themeSet))
);
const savedTheme = (() => { try { return localStorage.getItem("cp.theme"); } catch { return null; } })();
if (savedTheme && savedTheme !== "cyber") applyTheme(savedTheme);

renderSectorTabs();
renderSymbolsTable("All");
renderKlineSidebar("BTC");
renderRotation();
renderSimilarity();
renderCompare();
bindCompareToolbar();
bindImportDialog();
renderEtfBars();
// preload kline chart so opening is instant
renderKlineChart(SYMBOLS[0]);
renderOrderbook(SYMBOLS[0]);
renderKlineHeader(SYMBOLS[0]);
