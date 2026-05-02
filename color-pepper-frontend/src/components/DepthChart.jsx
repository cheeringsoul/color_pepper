import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { fmtPrice } from '../utils';

function genDepth(midPrice, sym) {
  const seed = sym.charCodeAt(0) * 7 + sym.length;
  const rng = () => { let s = seed; return () => { s = (s * 16807 % 2147483647); return (s & 0x7fffffff) / 0x7fffffff; }; };
  const rand = rng();

  const levels = 40;
  const step = midPrice * 0.001;
  const bids = [];
  const asks = [];
  let cumBid = 0;
  let cumAsk = 0;

  for (let i = 0; i < levels; i++) {
    const bQty = (rand() * 3 + 0.2) * (1 + i * 0.08);
    cumBid += bQty;
    bids.push({ price: midPrice - (i + 1) * step, qty: bQty, cum: cumBid });

    const aQty = (rand() * 3 + 0.2) * (1 + i * 0.08);
    cumAsk += aQty;
    asks.push({ price: midPrice + (i + 1) * step, qty: aQty, cum: cumAsk });
  }

  const wallBid = bids.reduce((max, b) => b.qty > max.qty ? b : max, bids[0]);
  const wallAsk = asks.reduce((max, a) => a.qty > max.qty ? a : max, asks[0]);

  return { bids, asks: asks, midPrice, wallBid, wallAsk };
}

export default function DepthChart({ symbol, orderBook }) {
  const midPrice = symbol?.price || 0;
  const sym = symbol?.sym || 'BTC';

  const depth = useMemo(() => genDepth(midPrice, sym), [midPrice, sym]);

  const bidPrices = depth.bids.map(b => fmtPrice(b.price)).reverse();
  const bidCums = depth.bids.map(b => b.cum).reverse();
  const askPrices = depth.asks.map(a => fmtPrice(a.price));
  const askCums = depth.asks.map(a => a.cum);

  const allPrices = [...bidPrices, fmtPrice(midPrice), ...askPrices];
  const bidData = [...bidCums, null, ...askPrices.map(() => null)];
  const askData = [...bidPrices.map(() => null), null, ...askCums];

  const maxCum = Math.max(depth.bids[depth.bids.length - 1].cum, depth.asks[depth.asks.length - 1].cum);

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1c1f27',
      borderColor: '#262a35',
      textStyle: { color: '#e8eaf0', fontSize: 11 },
      formatter: (params) => {
        const price = params[0]?.axisValue || '';
        const lines = params.filter(p => p.value != null).map(p => {
          const color = p.seriesIndex === 0 ? '#2dd4a4' : '#f47171';
          const label = p.seriesIndex === 0 ? '买单累计' : '卖单累计';
          return `<span style="color:${color}">${label}</span>: ${p.value.toFixed(3)}`;
        });
        return `<div style="font-family:var(--mono);font-size:11px">价格: ${price}<br/>${lines.join('<br/>')}</div>`;
      },
    },
    grid: { left: 60, right: 60, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: allPrices,
      axisLine: { lineStyle: { color: '#262a35' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#5e6473', fontSize: 10,
        fontFamily: 'ui-monospace, monospace',
        interval: Math.floor(allPrices.length / 8),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#262a35' } },
      axisTick: { show: false },
      axisLabel: { color: '#5e6473', fontSize: 10, fontFamily: 'ui-monospace, monospace', formatter: v => v.toFixed(1) },
      splitLine: { lineStyle: { color: 'rgba(38,42,53,0.6)' } },
    },
    series: [
      {
        name: '买单', type: 'line', data: bidData,
        step: 'end', symbol: 'none', lineStyle: { color: '#2dd4a4', width: 1.5 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(45,212,164,0.25)' }, { offset: 1, color: 'rgba(45,212,164,0.03)' }] } },
      },
      {
        name: '卖单', type: 'line', data: askData,
        step: 'start', symbol: 'none', lineStyle: { color: '#f47171', width: 1.5 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(244,113,113,0.25)' }, { offset: 1, color: 'rgba(244,113,113,0.03)' }] } },
      },
    ],
    graphic: [
      {
        type: 'line', shape: { x1: '50%', y1: 0, x2: '50%', y2: '100%' },
        style: { stroke: 'rgba(255,122,61,0.3)', lineDash: [4, 3] },
      },
    ],
  };

  const bidTotal = depth.bids[depth.bids.length - 1].cum;
  const askTotal = depth.asks[depth.asks.length - 1].cum;
  const bidPct = Math.round(bidTotal / (bidTotal + askTotal) * 100);

  return (
    <div className="depth-panel">
      <div className="depth-stats">
        <div className="depth-stat">
          <span className="depth-stat-label">中间价</span>
          <span className="depth-stat-val">{fmtPrice(midPrice)}</span>
        </div>
        <div className="depth-stat">
          <span className="depth-stat-label">买单墙</span>
          <span className="depth-stat-val up">{fmtPrice(depth.wallBid.price)} <span className="dim">({depth.wallBid.qty.toFixed(2)})</span></span>
        </div>
        <div className="depth-stat">
          <span className="depth-stat-label">卖单墙</span>
          <span className="depth-stat-val dn">{fmtPrice(depth.wallAsk.price)} <span className="dim">({depth.wallAsk.qty.toFixed(2)})</span></span>
        </div>
        <div className="depth-stat">
          <span className="depth-stat-label">买卖比</span>
          <div className="depth-ratio">
            <div className="depth-ratio-bar">
              <div className="depth-ratio-fill bid" style={{ width: `${bidPct}%` }}></div>
              <div className="depth-ratio-fill ask" style={{ width: `${100 - bidPct}%` }}></div>
            </div>
            <div className="depth-ratio-labels">
              <span className="up">{bidPct}%</span>
              <span className="dn">{100 - bidPct}%</span>
            </div>
          </div>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: 'calc(100% - 60px)', minHeight: 300 }} opts={{ renderer: 'svg' }} />
    </div>
  );
}
