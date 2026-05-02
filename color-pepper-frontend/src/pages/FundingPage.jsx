import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const EXCHANGES = ['Binance', 'OKX', 'Bybit', 'Bitget', 'Gate.io'];
const EX_COLORS = { Binance: '#f0b90b', OKX: '#fff', Bybit: '#f7a600', Bitget: '#00f0ff', 'Gate.io': '#2354e6' };
const SYMS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC', 'UNI', 'ARB', 'OP', 'APT', 'SUI'];

function genFunding(sym) {
  const seed = sym.charCodeAt(0) * 11 + sym.length * 7;
  const rates = {};
  let sum = 0;
  EXCHANGES.forEach((ex, i) => {
    const r = -0.015 + ((seed * (i + 3) * 7) % 60) / 1000;
    rates[ex] = +r.toFixed(4);
    sum += r;
  });
  const avg = +(sum / EXCHANGES.length).toFixed(4);
  const predicted = +(avg + (Math.sin(seed) * 0.005)).toFixed(4);
  const countdown = `${((seed * 3) % 8)}h ${((seed * 7) % 60).toString().padStart(2, '0')}m`;
  const oi = (100 + (seed * 13 % 2000)) * 1e6;

  const hist = [];
  let v = avg * 100;
  for (let i = 29; i >= 0; i--) {
    v += Math.sin(seed + i * 0.3) * 0.2 + (Math.random() - 0.48) * 0.3;
    const d = new Date(Date.now() - i * 86400000);
    hist.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, val: +v.toFixed(4) });
  }

  return { sym, rates, avg, predicted, countdown, oi, hist };
}

const DATA = SYMS.map(genFunding);

const AXIS_STYLE = {
  axisLine: { lineStyle: { color: '#262a35' } },
  axisTick: { show: false },
  axisLabel: { color: '#5e6473', fontSize: 10, fontFamily: 'ui-monospace, monospace' },
  splitLine: { lineStyle: { color: 'rgba(38,42,53,0.6)' } },
};

function FundingChart({ data, sym }) {
  const option = {
    tooltip: { trigger: 'axis', backgroundColor: '#1c1f27', borderColor: '#262a35', textStyle: { color: '#e8eaf0', fontSize: 11 }, valueFormatter: v => v + '%' },
    grid: { left: 48, right: 16, top: 12, bottom: 28 },
    xAxis: { type: 'category', data: data.map(d => d.date), ...AXIS_STYLE },
    yAxis: { type: 'value', ...AXIS_STYLE, axisLabel: { ...AXIS_STYLE.axisLabel, formatter: v => v.toFixed(2) + '%' } },
    series: [{
      type: 'bar', data: data.map(d => ({ value: d.val, itemStyle: { color: d.val >= 0 ? 'rgba(45,212,164,0.6)' : 'rgba(244,113,113,0.6)', borderRadius: [2, 2, 0, 0] } })),
    }],
  };
  return <ReactECharts option={option} style={{ height: 180 }} opts={{ renderer: 'svg' }} />;
}

function HeatmapTable({ data, sortKey, sortDir, toggleSort, selected, setSelected }) {
  const sorted = useMemo(() => [...data].sort((a, b) => {
    let av, bv;
    if (sortKey === 'avg') { av = a.avg; bv = b.avg; }
    else if (sortKey === 'predicted') { av = a.predicted; bv = b.predicted; }
    else if (sortKey === 'oi') { av = a.oi; bv = b.oi; }
    else { av = a.rates[sortKey] || 0; bv = b.rates[sortKey] || 0; }
    return (av - bv) * sortDir;
  }), [data, sortKey, sortDir]);

  const si = (key) => sortKey === key ? (sortDir > 0 ? ' ↑' : ' ↓') : '';

  const rateCell = (val) => {
    const abs = Math.abs(val);
    let bg;
    if (val >= 0.03) bg = 'rgba(45,212,164,0.25)';
    else if (val >= 0.01) bg = 'rgba(45,212,164,0.12)';
    else if (val <= -0.03) bg = 'rgba(244,113,113,0.25)';
    else if (val <= -0.01) bg = 'rgba(244,113,113,0.12)';
    else bg = 'transparent';
    return (
      <span className={`right mono fr-cell ${val >= 0 ? 'up' : 'dn'}`} style={{ background: bg }}>
        {val >= 0 ? '+' : ''}{(val * 100).toFixed(4)}%
      </span>
    );
  };

  return (
    <div className="fr-table">
      <div className="fr-thead">
        <span>币种</span>
        {EXCHANGES.map(ex => (
          <span key={ex} className="fr-sortable right" onClick={() => toggleSort(ex)}>
            <span className="fr-ex-dot" style={{ background: EX_COLORS[ex] }}></span>
            {ex}{si(ex)}
          </span>
        ))}
        <span className="fr-sortable right" onClick={() => toggleSort('avg')}>均值{si('avg')}</span>
        <span className="fr-sortable right" onClick={() => toggleSort('predicted')}>预测{si('predicted')}</span>
        <span className="right">倒计时</span>
      </div>
      <div className="fr-tbody">
        {sorted.map(d => (
          <div key={d.sym} className={`fr-trow ${d.sym === selected ? 'active' : ''}`} onClick={() => setSelected(d.sym)}>
            <span className="fr-sym">{d.sym}<span className="dim">/USDT</span></span>
            {EXCHANGES.map(ex => <span key={ex}>{rateCell(d.rates[ex])}</span>)}
            {rateCell(d.avg)}
            {rateCell(d.predicted)}
            <span className="right mono" style={{ color: 'var(--text-3)' }}>{d.countdown}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FundingPage() {
  const [sortKey, setSortKey] = useState('avg');
  const [sortDir, setSortDir] = useState(-1);
  const [selected, setSelected] = useState('BTC');

  const sel = DATA.find(d => d.sym === selected) || DATA[0];

  const allAvg = (DATA.reduce((s, d) => s + d.avg, 0) / DATA.length);
  const highest = DATA.reduce((a, b) => a.avg > b.avg ? a : b);
  const lowest = DATA.reduce((a, b) => a.avg < b.avg ? a : b);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d * -1);
    else { setSortKey(key); setSortDir(-1); }
  }

  return (
    <div className="page fr-page">
      <div className="fr-head">
        <div>
          <h1>资金费率</h1>
          <p>跨交易所资金费率对比，识别多空情绪与持仓成本</p>
        </div>
      </div>

      <div className="fr-kpis">
        <div className="kpi">
          <div className="kpi-label">全市场平均费率</div>
          <div className={`kpi-value ${allAvg >= 0 ? 'up' : 'dn'}`}>{allAvg >= 0 ? '+' : ''}{(allAvg * 100).toFixed(4)}%</div>
          <div className="kpi-foot"><span className={`pill ${allAvg >= 0 ? 'up' : 'dn'}`}>{allAvg >= 0 ? '多头付费' : '空头付费'}</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">最高费率</div>
          <div className="kpi-value up">{highest.sym}</div>
          <div className="kpi-foot"><span className="pill up">+{(highest.avg * 100).toFixed(4)}%</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">最低费率</div>
          <div className="kpi-value dn">{lowest.sym}</div>
          <div className="kpi-foot"><span className="pill dn">{(lowest.avg * 100).toFixed(4)}%</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">结算周期</div>
          <div className="kpi-value">8h</div>
          <div className="kpi-foot"><span className="muted">每日 00:00 / 08:00 / 16:00</span></div>
        </div>
      </div>

      <div className="card fr-chart-card">
        <div className="card-head">
          <div>
            <div className="card-title">{sel.sym} 资金费率历史 (30d)</div>
            <div className="card-sub">每 8 小时结算一次</div>
          </div>
          <div className="basis-chip-row">
            {['BTC', 'ETH', 'SOL', 'BNB', 'DOGE'].map(s => (
              <button key={s} className={`chip ${selected === s ? 'active' : ''}`} onClick={() => setSelected(s)}>{s}</button>
            ))}
          </div>
        </div>
        <FundingChart data={sel.hist} sym={sel.sym} />
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">跨交易所费率热力图</div>
            <div className="card-sub">绿色=多头付费（看涨情绪），红色=空头付费（看跌情绪）</div>
          </div>
        </div>
        <HeatmapTable
          data={DATA}
          sortKey={sortKey}
          sortDir={sortDir}
          toggleSort={toggleSort}
          selected={selected}
          setSelected={setSelected}
        />
      </div>
    </div>
  );
}
