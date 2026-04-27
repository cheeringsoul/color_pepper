// ===== Mock data =====
const SYMBOLS = [
  { sym: "BTC",  pair: "USDT", name: "Bitcoin",      price: 67234.50,  chg: +2.34, vol: "1.42B", mcap: "1.32T", color: "#f7931a", fav: true,  seed: 11 },
  { sym: "ETH",  pair: "USDT", name: "Ethereum",     price:  3548.10,  chg: +1.92, vol: "780M",  mcap: "428B",  color: "#627eea", fav: true,  seed: 22 },
  { sym: "SOL",  pair: "USDT", name: "Solana",       price:   178.43,  chg: +6.12, vol: "612M",  mcap: "82B",   color: "#9945ff", fav: true,  seed: 33 },
  { sym: "BNB",  pair: "USDT", name: "BNB",          price:   612.20,  chg: +0.81, vol: "210M",  mcap: "92B",   color: "#f0b341", fav: false, seed: 44 },
  { sym: "AVAX", pair: "USDT", name: "Avalanche",    price:    36.20,  chg: +4.51, vol: "188M",  mcap: "14B",   color: "#e84142", fav: false, seed: 55 },
  { sym: "DOGE", pair: "USDT", name: "Dogecoin",     price:     0.142, chg: -3.20, vol: "245M",  mcap: "20B",   color: "#c2a633", fav: true,  seed: 66 },
  { sym: "APT",  pair: "USDT", name: "Aptos",        price:     7.81,  chg: -5.12, vol:  "98M",  mcap:  "4.2B", color: "#5db5a8", fav: false, seed: 77 },
  { sym: "XRP",  pair: "USDT", name: "XRP",          price:     0.612, chg: +0.42, vol: "320M",  mcap: "33B",   color: "#23292f", fav: true,  seed: 88 },
  { sym: "ARB",  pair: "USDT", name: "Arbitrum",     price:     1.122, chg: +3.04, vol:  "82M",  mcap:  "3.1B", color: "#2d374b", fav: false, seed: 99 },
  { sym: "TON",  pair: "USDT", name: "Toncoin",      price:     6.42,  chg: +1.18, vol:  "65M",  mcap: "22B",   color: "#0098ea", fav: true,  seed: 110 },
  { sym: "LINK", pair: "USDT", name: "Chainlink",    price:    18.10,  chg: -1.42, vol:  "75M",  mcap: "11B",   color: "#2a5ada", fav: false, seed: 121 },
  { sym: "ADA",  pair: "USDT", name: "Cardano",      price:     0.452, chg: -0.92, vol:  "98M",  mcap: "16B",   color: "#0033ad", fav: false, seed: 132 },
  { sym: "TRX",  pair: "USDT", name: "TRON",         price:     0.122, chg: +0.62, vol:  "55M",  mcap:  "9.8B", color: "#ff060a", fav: false, seed: 143 },
  { sym: "OP",   pair: "USDT", name: "Optimism",     price:     2.18,  chg: +2.81, vol:  "60M",  mcap:  "2.3B", color: "#ff0420", fav: true,  seed: 154 },
  { sym: "SUI",  pair: "USDT", name: "Sui",          price:     1.42,  chg: +7.21, vol:  "112M", mcap:  "3.6B", color: "#6fbcf0", fav: false, seed: 165 },
  { sym: "INJ",  pair: "USDT", name: "Injective",    price:    28.10,  chg: -2.41, vol:  "48M",  mcap:  "2.7B", color: "#00d2ff", fav: false, seed: 176 },
];

const SECTORS = [
  { name: "L1 公链",     pct: +3.8 },
  { name: "L2 扩容",     pct: +2.4 },
  { name: "DeFi",       pct: +1.1 },
  { name: "AI",         pct: +5.2 },
  { name: "DePIN",      pct: -1.4 },
  { name: "MEME",       pct: -2.7 },
  { name: "RWA",        pct: +0.9 },
  { name: "GameFi",     pct: -3.1 },
  { name: "Privacy",    pct: -0.6 },
  { name: "Storage",    pct: +1.6 },
];

// ===== Tiny pseudo-random based on seed for repeatable sparkline =====
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

// ===== Render: Symbols list =====
function colorFor(chg) { return chg >= 0 ? "var(--up)" : "var(--dn)"; }
function fmt(n, d = 2) { return Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }

function renderSymbolsTable() {
  const tbody = document.querySelector('[data-view="symbols"] .tbody');
  tbody.innerHTML = SYMBOLS.map((s, idx) => `
    <div class="trow" data-sym="${s.sym}">
      <div class="col-fav">
        <button class="fav-btn ${s.fav ? "on" : ""}">${s.fav ? "★" : "☆"}</button>
      </div>
      <div class="col-name sym-cell">
        <span class="sym-bubble" style="background:${s.color}">${s.sym[0]}</span>
        <span><strong>${s.sym}</strong><span class="pair">/${s.pair}</span></span>
        <span class="muted small" style="margin-left:6px">${s.name}</span>
      </div>
      <div class="col-num">${fmt(s.price, s.price < 1 ? 4 : 2)}</div>
      <div class="col-num">
        <span class="pill ${s.chg >= 0 ? "up" : "dn"}">${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%</span>
      </div>
      <div class="col-spark">
        <svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
          <polyline fill="none" stroke="${colorFor(s.chg)}" stroke-width="1.5"
            points="${sparkPoints(s.seed, 100, 30, s.chg / 5)}" />
        </svg>
      </div>
      <div class="col-num">${s.vol}</div>
      <div class="col-num">${s.mcap}</div>
    </div>
  `).join("");

  // Click row → open kline view (mock)
  tbody.querySelectorAll(".trow").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn")) return;
      switchView("kline");
    });
    row.querySelector(".fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      btn.classList.toggle("on");
      btn.textContent = btn.classList.contains("on") ? "★" : "☆";
    });
  });
}

// ===== Render: Watchlist cards =====
function renderWatchlist() {
  const grid = document.querySelector('[data-view="watchlist"] .watch-grid');
  const favs = SYMBOLS.filter((s) => s.fav);
  grid.innerHTML = favs.map((s) => `
    <div class="watch-card" data-sym="${s.sym}">
      <div class="wc-head">
        <span class="sym-bubble" style="background:${s.color}">${s.sym[0]}</span>
        <span class="wc-name">${s.sym}<span class="pair">/${s.pair}</span></span>
        <span class="wc-fav">★</span>
      </div>
      <div class="wc-price">${fmt(s.price, s.price < 1 ? 4 : 2)}</div>
      <svg class="wc-spark" viewBox="0 0 100 50" preserveAspectRatio="none">
        <polyline fill="none" stroke="${colorFor(s.chg)}" stroke-width="1.6"
          points="${sparkPoints(s.seed + 1, 100, 50, s.chg / 6)}" />
        <polyline fill="${s.chg >= 0 ? "var(--up-bg)" : "var(--dn-bg)"}" stroke="none"
          points="${sparkPoints(s.seed + 1, 100, 50, s.chg / 6)} 100,50 0,50" />
      </svg>
      <div class="wc-row">
        <span>24h</span>
        <span class="v ${s.chg >= 0 ? "up" : "dn"}">${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%</span>
      </div>
      <div class="wc-row"><span>成交额</span><span class="v">${s.vol}</span></div>
    </div>
  `).join("");

  grid.querySelectorAll(".watch-card").forEach((c) =>
    c.addEventListener("click", () => switchView("kline"))
  );
}

// ===== Render: Kline candles + volumes =====
function renderKline() {
  const r = rng(4242);
  const n = 80;
  let price = 64000;
  const candles = [];
  for (let i = 0; i < n; i++) {
    const open = price;
    const change = (r() - 0.48) * 800;
    const close = open + change;
    const high = Math.max(open, close) + r() * 220;
    const low  = Math.min(open, close) - r() * 220;
    candles.push({ open, close, high, low, vol: 200 + r() * 800 });
    price = close;
  }
  const min = Math.min(...candles.map((c) => c.low));
  const max = Math.max(...candles.map((c) => c.high));
  const w = 800, h = 320;
  const cw = w / n;
  const y = (p) => ((max - p) / (max - min)) * (h - 20) + 10;

  const candlesG = document.querySelector('[data-view="kline"] .candles');
  candlesG.innerHTML = candles.map((c, i) => {
    const x = i * cw + cw / 2;
    const up = c.close >= c.open;
    const color = up ? "#2bd07a" : "#ff5b6e";
    const body1 = y(Math.max(c.open, c.close));
    const body2 = y(Math.min(c.open, c.close));
    return `
      <line x1="${x}" x2="${x}" y1="${y(c.high)}" y2="${y(c.low)}" stroke="${color}" stroke-width="1" />
      <rect x="${i * cw + 1}" y="${body1}" width="${cw - 2}" height="${Math.max(1, body2 - body1)}" fill="${color}" />
    `;
  }).join("");

  const volsG = document.querySelector('[data-view="kline"] .vols');
  const vmax = Math.max(...candles.map((c) => c.vol));
  volsG.innerHTML = candles.map((c, i) => {
    const x = i * cw + 1;
    const bh = (c.vol / vmax) * 90;
    const up = c.close >= c.open;
    const color = up ? "rgba(43,208,122,.6)" : "rgba(255,91,110,.6)";
    return `<rect x="${x}" y="${100 - bh}" width="${cw - 2}" height="${bh}" fill="${color}" />`;
  }).join("");

  // Order book
  const ob = document.querySelector('[data-view="kline"] .orderbook');
  const asks = ob.querySelector(".asks");
  const bids = ob.querySelector(".bids");
  const r2 = rng(7);
  const askRows = [];
  const bidRows = [];
  let pa = 67235, pb = 67234;
  let totA = 0, totB = 0;
  for (let i = 0; i < 12; i++) {
    pa += 0.5 + r2() * 1.5;
    const qa = +(0.05 + r2() * 1.6).toFixed(3);
    totA += qa;
    askRows.push({ p: pa, q: qa, t: totA });

    pb -= 0.5 + r2() * 1.5;
    const qb = +(0.05 + r2() * 1.6).toFixed(3);
    totB += qb;
    bidRows.push({ p: pb, q: qb, t: totB });
  }
  const maxTot = Math.max(askRows[askRows.length - 1].t, bidRows[bidRows.length - 1].t);

  asks.innerHTML = [...askRows].reverse().map((row) => `
    <div class="ob-row ask">
      <div class="bar" style="width:${(row.t / maxTot) * 100}%"></div>
      <span class="px ask">${fmt(row.p, 2)}</span>
      <span class="qty">${row.q.toFixed(3)}</span>
      <span class="total">${row.t.toFixed(2)}</span>
    </div>
  `).join("");
  bids.innerHTML = bidRows.map((row) => `
    <div class="ob-row bid">
      <div class="bar" style="width:${(row.t / maxTot) * 100}%"></div>
      <span class="px bid">${fmt(row.p, 2)}</span>
      <span class="qty">${row.q.toFixed(3)}</span>
      <span class="total">${row.t.toFixed(2)}</span>
    </div>
  `).join("");
}

// ===== Render: Sector rotation =====
function rotationColor(pct) {
  // -10 .. +10  -> red .. green
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
  // Heatmap: use SYMBOLS, pad with extras
  const all = SYMBOLS.slice().sort((a, b) => b.chg - a.chg);
  const heat = document.querySelector('[data-view="rotation"] .heatmap');
  heat.innerHTML = all.map((s) => `
    <div class="hm-cell" style="background:${rotationColor(s.chg)}" data-sym="${s.sym}">
      <div class="name">${s.sym}</div>
      <div class="pct">${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%</div>
    </div>
  `).join("");
  heat.querySelectorAll(".hm-cell").forEach((c) =>
    c.addEventListener("click", () => switchView("kline"))
  );

  // Sector bars
  const bars = document.querySelector('[data-view="rotation"] .sector-bars');
  const sorted = SECTORS.slice().sort((a, b) => b.pct - a.pct);
  bars.innerHTML = sorted.map((s) => {
    const pct = s.pct;
    const w = Math.min(50, Math.abs(pct) * 5);
    const cls = pct >= 0 ? "up" : "dn";
    return `
      <div class="sector-row">
        <span>${s.name}</span>
        <div class="sector-bar">
          <div class="fill ${cls}" style="width:${w}%"></div>
        </div>
        <span class="pct ${cls}">${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%</span>
      </div>
    `;
  }).join("");

  // Rank lists
  const ups = document.querySelector('[data-view="rotation"] .rank-list[data-side="up"]');
  const dns = document.querySelector('[data-view="rotation"] .rank-list[data-side="dn"]');
  const upList = SYMBOLS.filter((s) => s.chg > 0).sort((a, b) => b.chg - a.chg).slice(0, 6);
  const dnList = SYMBOLS.filter((s) => s.chg < 0).sort((a, b) => a.chg - b.chg).slice(0, 6);

  const renderRank = (arr, side) => arr.map((s, i) => `
    <div class="rank-row" data-sym="${s.sym}">
      <span class="rank-rank">${i + 1}</span>
      <span class="name"><span class="sym-bubble" style="background:${s.color};margin-right:6px;width:18px;height:18px;font-size:9px">${s.sym[0]}</span>${s.sym}</span>
      <svg class="spark" viewBox="0 0 80 24" preserveAspectRatio="none">
        <polyline fill="none" stroke="${side === "up" ? "var(--up)" : "var(--dn)"}" stroke-width="1.4"
          points="${sparkPoints(s.seed + 9, 80, 24, side === "up" ? 1 : -1)}" />
      </svg>
      <span class="num ${side}">${s.chg >= 0 ? "+" : ""}${s.chg.toFixed(2)}%</span>
    </div>
  `).join("");

  ups.innerHTML = renderRank(upList, "up");
  dns.innerHTML = renderRank(dnList, "dn");

  document.querySelectorAll('[data-view="rotation"] .rank-row, [data-view="rotation"] .hm-cell')
    .forEach((el) => el.addEventListener("click", () => switchView("kline")));
}

// ===== Render: Similarity =====
function renderSimilarity() {
  const grid = document.querySelector('[data-view="similarity"] .similar-grid');
  // pretend correlations to BTC
  const data = [
    { sym: "ETH",  corr: 0.94, color: "#627eea", seed: 222 },
    { sym: "BNB",  corr: 0.87, color: "#f0b341", seed: 223 },
    { sym: "SOL",  corr: 0.82, color: "#9945ff", seed: 224 },
    { sym: "AVAX", corr: 0.79, color: "#e84142", seed: 225 },
    { sym: "TON",  corr: 0.76, color: "#0098ea", seed: 226 },
    { sym: "ARB",  corr: 0.73, color: "#2d374b", seed: 227 },
    { sym: "LINK", corr: 0.71, color: "#2a5ada", seed: 228 },
    { sym: "OP",   corr: 0.70, color: "#ff0420", seed: 229 },
  ];
  const refSeed = 4242; // matches kline seed for visual consistency

  grid.innerHTML = data.map((d) => {
    const refPts = sparkPoints(refSeed, 240, 70, 0.6);
    const candPts = sparkPoints(d.seed, 240, 70, 0.6 * d.corr);
    const klass = d.corr >= 0.85 ? "high" : "mid";
    return `
      <div class="sim-card" data-sym="${d.sym}">
        <div class="sim-head">
          <span class="sym-bubble" style="background:${d.color}">${d.sym[0]}</span>
          <span class="sim-name">${d.sym}/USDT</span>
          <span class="sim-corr ${klass}">ρ ${d.corr.toFixed(2)}</span>
        </div>
        <svg class="sim-chart" viewBox="0 0 240 70" preserveAspectRatio="none">
          <polyline fill="none" stroke="var(--text-3)" stroke-width="1" stroke-dasharray="2 3"
            points="${refPts}" />
          <polyline fill="none" stroke="var(--accent)" stroke-width="1.6"
            points="${candPts}" />
        </svg>
        <div class="sim-meta">
          <span>橙线 = ${d.sym}</span>
          <span>虚线 = BTC</span>
        </div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll(".sim-card").forEach((c) =>
    c.addEventListener("click", () => switchView("kline"))
  );
}

// ===== View switching =====
function switchView(name) {
  document.querySelectorAll(".nav-item[data-view]").forEach((el) =>
    el.classList.toggle("active", el.dataset.view === name)
  );
  document.querySelectorAll(".view").forEach((el) =>
    el.classList.toggle("hidden", el.dataset.view !== name)
  );
}

document.querySelectorAll(".nav-item[data-view]").forEach((el) =>
  el.addEventListener("click", () => switchView(el.dataset.view))
);

// chip toggle (visual only)
document.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const group = chip.parentElement;
  if (!group.classList.contains("filters") && !group.classList.contains("tf-group")) return;
  // single-select within same group
  group.querySelectorAll(".chip, .tf").forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");
});

// timeframe button toggle (single-select per group)
document.querySelectorAll(".tf-group").forEach((g) => {
  g.addEventListener("click", (e) => {
    const t = e.target.closest(".tf");
    if (!t) return;
    g.querySelectorAll(".tf").forEach((b) => b.classList.remove("active"));
    t.classList.add("active");
  });
});

// ===== Boot =====
renderSymbolsTable();
renderWatchlist();
renderKline();
renderRotation();
renderSimilarity();
