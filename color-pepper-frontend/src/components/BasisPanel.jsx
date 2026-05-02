import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { fmtPrice } from '../utils';

const EXCHANGES = [
  { id: 'binance', name: 'Binance', color: '#f0b90b' },
  { id: 'okx', name: 'OKX', color: '#fff' },
  { id: 'bybit', name: 'Bybit', color: '#f7a600' },
  { id: 'bitget', name: 'Bitget', color: '#00f0ff' },
  { id: 'gate', name: 'Gate.io', color: '#2354e6' },
];

const AXIS_STYLE = {
  axisLine: { lineStyle: { color: '#262a35' } },
  axisTick: { show: false },
  axisLabel: { color: '#5e6473', fontSize: 10, fontFamily: 'ui-monospace, monospace' },
  splitLine: { lineStyle: { color: 'rgba(38,42,53,0.6)' } },
};

function mockBidAsk(mid, spreadBps) {
  const half = mid * spreadBps / 20000;
  return { bid1: mid - half, ask1: mid + half };
}

function mockContracts(sym, basePrice) {
  const seed = sym.charCodeAt(0) * 7 + sym.length * 13;
  const spotMid = basePrice;
  const spotBA = mockBidAsk(spotMid, 1.2 + (seed % 8) / 10);

  const now = new Date();
  const q1Month = [3, 6, 9, 12].find(m => m >= now.getMonth() + 1) || 3;
  const q1Year = q1Month <= now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear();
  const q1Date = new Date(q1Year, q1Month - 1, 28);
  const q1Days = Math.max(1, Math.ceil((q1Date - now) / 86400000));
  const q1Label = `${String(q1Month).padStart(2, '0')}28`;

  const q2Month = q1Month + 3 > 12 ? q1Month + 3 - 12 : q1Month + 3;
  const q2Year = q1Month + 3 > 12 ? q1Year + 1 : q1Year;
  const q2Date = new Date(q2Year, q2Month - 1, 28);
  const q2Days = Math.max(1, Math.ceil((q2Date - now) / 86400000));
  const q2Label = `${String(q2Month).padStart(2, '0')}28`;

  function mkContract(id, name, pair, driftBps, spreadBps, funding, days) {
    const mid = spotMid * (1 + driftBps / 10000);
    const ba = mockBidAsk(mid, spreadBps);
    const oi = spotMid * (300 + (seed * (id.charCodeAt(0) + 1) % 4000)) * 1000;

    const hist = [];
    let v = driftBps;
    for (let i = 29; i >= 0; i--) {
      v += Math.sin(seed + i * 0.4 + id.length) * 1.5 + (Math.random() - 0.48) * 2;
      const d = new Date(Date.now() - i * 86400000);
      hist.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, val: +v.toFixed(2) });
    }

    return { id, name, pair, mid, bid1: ba.bid1, ask1: ba.ask1, funding, oi, days, hist };
  }

  const contracts = [
    mkContract('perp_u', 'U本位永续', `${sym}USDT Perp`, -5 + (seed % 18), 1.5 + (seed % 6) / 10, -0.005 + ((seed * 3) % 30) / 1000, null),
    mkContract('perp_c', '币本位永续', `${sym}USD Perp`, -3 + (seed % 14), 2.0 + (seed % 8) / 10, -0.003 + ((seed * 5) % 25) / 1000, null),
    mkContract('q1', '当季交割', `${sym}USD ${q1Label}`, (-5 + (seed % 18)) * 1.6 + (seed % 10), 2.5 + (seed % 10) / 10, null, q1Days),
    mkContract('q2', '次季交割', `${sym}USD ${q2Label}`, (-5 + (seed % 18)) * 2.5 + (seed % 15), 3.0 + (seed % 12) / 10, null, q2Days),
  ];

  return { spot: { mid: spotMid, bid1: spotBA.bid1, ask1: spotBA.ask1 }, contracts };
}

function mockCrossExchange(sym, contractId, baseMid) {
  const seed = sym.charCodeAt(0) * 11 + contractId.charCodeAt(0) * 7;
  return EXCHANGES.map((ex, i) => {
    const drift = ((seed * (i + 1) * 7) % 100 - 50) / 100000;
    const mid = baseMid * (1 + drift);
    const spreadBps = 1.5 + ((seed * (i + 3)) % 20) / 10;
    const ba = mockBidAsk(mid, spreadBps);
    const funding = contractId.startsWith('q') ? null : -0.005 + ((seed * (i + 2) * 3) % 30) / 1000;
    return { ...ex, mid, bid1: ba.bid1, ask1: ba.ask1, spreadBps, funding };
  });
}

function SpreadChart({ hist }) {
  const option = {
    tooltip: { trigger: 'axis', backgroundColor: '#1c1f27', borderColor: '#262a35', textStyle: { color: '#e8eaf0', fontSize: 11 }, valueFormatter: v => v + ' bps' },
    grid: { left: 44, right: 12, top: 8, bottom: 24 },
    xAxis: { type: 'category', data: hist.map(d => d.date), ...AXIS_STYLE },
    yAxis: { type: 'value', ...AXIS_STYLE },
    series: [{
      type: 'line', data: hist.map(d => d.val), smooth: true, symbol: 'none',
      lineStyle: { width: 1.5, color: '#6ea8ff' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(110,168,255,0.12)' }, { offset: 1, color: 'rgba(110,168,255,0)' }] } },
    }],
  };
  return <ReactECharts option={option} style={{ height: 140 }} opts={{ renderer: 'svg' }} />;
}

export default function BasisPanel({ currentSym, symbol }) {
  const [selectedId, setSelectedId] = useState('perp_c');

  const basePrice = symbol?.price || 0;
  const { spot, contracts } = useMemo(() => mockContracts(currentSym, basePrice), [currentSym, basePrice]);
  const selected = contracts.find(c => c.id === selectedId) || contracts[0];
  const crossEx = useMemo(() => mockCrossExchange(currentSym, selectedId, selected.mid), [currentSym, selectedId, selected.mid]);
  const bestBid = Math.max(...crossEx.map(e => e.bid1));
  const bestAsk = Math.min(...crossEx.map(e => e.ask1));

  const arbShort = selected.bid1 - spot.ask1;
  const arbShortPct = spot.ask1 ? (arbShort / spot.ask1 * 100) : 0;
  const arbLong = spot.bid1 - selected.ask1;
  const arbLongPct = selected.ask1 ? (arbLong / selected.ask1 * 100) : 0;
  const annDivisor = selected.days || 8;
  const arbShortAnn = arbShortPct / annDivisor * 365;
  const arbLongAnn = arbLongPct / annDivisor * 365;

  return (
    <div className="bp-panel">
      {/* Spot card */}
      <div className="bp-spot-row">
        <div className="bp-spot-card">
          <span className="bp-spot-label">现货</span>
          <span className="bp-spot-pair">{currentSym}/USDT</span>
          <div className="bp-ba-row">
            <div className="bp-ba-item">
              <span className="bp-ba-label">Bid1</span>
              <span className="bp-ba-price up">{fmtPrice(spot.bid1)}</span>
            </div>
            <div className="bp-ba-item">
              <span className="bp-ba-label">Ask1</span>
              <span className="bp-ba-price dn">{fmtPrice(spot.ask1)}</span>
            </div>
            <div className="bp-ba-item">
              <span className="bp-ba-label">Mid</span>
              <span className="bp-ba-price">{fmtPrice(spot.mid)}</span>
            </div>
          </div>
        </div>

        {contracts.map(c => {
          const shortSpread = c.bid1 - spot.ask1;
          const shortPct = spot.ask1 ? (shortSpread / spot.ask1 * 100) : 0;
          const isUp = shortSpread >= 0;
          return (
            <div key={c.id} className={`bp-contract-card ${selectedId === c.id ? 'selected' : ''}`} onClick={() => setSelectedId(c.id)}>
              <div className="bp-cc-top">
                <span className="bp-cc-name">{c.name}</span>
                {c.days !== null && <span className="bp-cc-expiry">{c.days}天</span>}
                {c.funding !== null && (
                  <span className={`bp-cc-funding ${c.funding >= 0 ? 'up' : 'dn'}`}>
                    {c.funding >= 0 ? '+' : ''}{(c.funding * 100).toFixed(4)}%
                  </span>
                )}
              </div>
              <div className="bp-cc-pair">{c.pair}</div>
              <div className="bp-ba-row compact">
                <div className="bp-ba-item">
                  <span className="bp-ba-label">B1</span>
                  <span className="bp-ba-price up">{fmtPrice(c.bid1)}</span>
                </div>
                <div className="bp-ba-item">
                  <span className="bp-ba-label">A1</span>
                  <span className="bp-ba-price dn">{fmtPrice(c.ask1)}</span>
                </div>
              </div>
              <div className="bp-cc-spread-row">
                <span className="bp-cc-spread-label">合约B1−现货A1</span>
                <span className={`bp-cc-pct ${isUp ? 'up' : 'dn'}`}>
                  {isUp ? '+' : ''}{shortPct.toFixed(4)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bp-detail-grid">
        {/* Chart */}
        <div className="bp-detail-card">
          <div className="bp-detail-head">
            <span className="bp-detail-title">现货 vs {selected.name} 价差 (30d)</span>
            <div className="bp-detail-tabs">
              {contracts.map(c => (
                <button key={c.id} className={`chip ${selectedId === c.id ? 'active' : ''}`} onClick={() => setSelectedId(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <SpreadChart hist={selected.hist} />
        </div>

        {/* Arb card */}
        <div className="bp-arb-card">
          <div className="bp-arb-title">套利计算 · {selected.name}</div>
          <div className="bp-arb-rows">
            <div className="bp-arb-section-label">正套（做空合约 + 买入现货）</div>
            <div className="bp-arb-row">
              <span className="bp-arb-label">可执行价差</span>
              <span className="bp-arb-val mono dim">合约Bid1 − 现货Ask1</span>
            </div>
            <div className="bp-arb-row">
              <span className="bp-arb-label">{fmtPrice(selected.bid1)} − {fmtPrice(spot.ask1)}</span>
              <span className={`bp-arb-val mono ${arbShort >= 0 ? 'up' : 'dn'}`} style={{ fontWeight: 700 }}>
                {arbShort >= 0 ? '+' : ''}{fmtPrice(arbShort)} ({arbShortPct >= 0 ? '+' : ''}{arbShortPct.toFixed(4)}%)
              </span>
            </div>
            <div className="bp-arb-row">
              <span className="bp-arb-label">年化</span>
              <span className={`bp-arb-val mono ${arbShortAnn >= 0 ? 'up' : 'dn'}`}>{arbShortAnn >= 0 ? '+' : ''}{arbShortAnn.toFixed(2)}%</span>
            </div>

            <div className="bp-arb-divider" />

            <div className="bp-arb-section-label">反套（做多合约 + 卖出现货）</div>
            <div className="bp-arb-row">
              <span className="bp-arb-label">可执行价差</span>
              <span className="bp-arb-val mono dim">现货Bid1 − 合约Ask1</span>
            </div>
            <div className="bp-arb-row">
              <span className="bp-arb-label">{fmtPrice(spot.bid1)} − {fmtPrice(selected.ask1)}</span>
              <span className={`bp-arb-val mono ${arbLong >= 0 ? 'up' : 'dn'}`} style={{ fontWeight: 700 }}>
                {arbLong >= 0 ? '+' : ''}{fmtPrice(arbLong)} ({arbLongPct >= 0 ? '+' : ''}{arbLongPct.toFixed(4)}%)
              </span>
            </div>
            <div className="bp-arb-row">
              <span className="bp-arb-label">年化</span>
              <span className={`bp-arb-val mono ${arbLongAnn >= 0 ? 'up' : 'dn'}`}>{arbLongAnn >= 0 ? '+' : ''}{arbLongAnn.toFixed(2)}%</span>
            </div>

            <div className="bp-arb-divider" />

            <div className="bp-arb-row">
              <span className="bp-arb-label">合约持仓量</span>
              <span className="bp-arb-val mono">${(selected.oi / 1e9).toFixed(2)}B</span>
            </div>
            {selected.funding !== null && (
              <div className="bp-arb-row">
                <span className="bp-arb-label">资金费率 (8h)</span>
                <span className={`bp-arb-val mono ${selected.funding >= 0 ? 'up' : 'dn'}`}>
                  {selected.funding >= 0 ? '+' : ''}{(selected.funding * 100).toFixed(4)}%
                </span>
              </div>
            )}
            {selected.days !== null && (
              <div className="bp-arb-row">
                <span className="bp-arb-label">距交割</span>
                <span className="bp-arb-val mono">{selected.days} 天</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-exchange comparison */}
      <div className="bp-cross-card">
        <div className="bp-cross-head">
          <span className="bp-cross-title">{selected.name} 跨交易所盘口</span>
          <span className="bp-cross-sub">
            最优Bid <span className="up">{fmtPrice(bestBid)}</span>
            {' / '}最优Ask <span className="dn">{fmtPrice(bestAsk)}</span>
            {' / '}跨所价差 <span className="mono">{fmtPrice(bestAsk - bestBid)}</span>
          </span>
        </div>
        <div className="bp-cross-table">
          <div className="bp-cross-thead">
            <span>交易所</span>
            <span className="right">Bid1</span>
            <span className="right">Ask1</span>
            <span className="right">盘口价差</span>
            {selected.funding !== null && <span className="right">资金费率</span>}
            <span className="right">vs 最优Bid</span>
          </div>
          {crossEx.map(ex => {
            const vsBest = ex.bid1 - bestBid;
            const vsBestPct = bestBid ? (vsBest / bestBid * 10000) : 0;
            return (
              <div key={ex.id} className="bp-cross-trow">
                <span className="bp-cross-name">
                  <span className="exc-dot" style={{ background: ex.color }}></span>
                  {ex.name}
                </span>
                <span className={`right mono ${ex.bid1 === bestBid ? 'up' : ''}`}>{fmtPrice(ex.bid1)}</span>
                <span className={`right mono ${ex.ask1 === bestAsk ? 'up' : ''}`}>{fmtPrice(ex.ask1)}</span>
                <span className="right mono dim">{ex.spreadBps.toFixed(1)} bps</span>
                {ex.funding !== null && (
                  <span className={`right mono ${ex.funding >= 0 ? 'up' : 'dn'}`}>
                    {ex.funding >= 0 ? '+' : ''}{(ex.funding * 100).toFixed(4)}%
                  </span>
                )}
                {ex.funding === null && selected.funding !== null && <span></span>}
                <span className={`right mono ${vsBest >= 0 ? 'up' : 'dn'}`}>
                  {vsBest >= 0 ? '+' : ''}{vsBestPct.toFixed(1)} bps
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
