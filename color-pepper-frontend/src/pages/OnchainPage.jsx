import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const COMMON_AXIS = {
  axisLine: { lineStyle: { color: '#262a35' } },
  axisTick: { show: false },
  axisLabel: { color: '#5e6473', fontSize: 10, fontFamily: 'ui-monospace, "JetBrains Mono", monospace' },
  splitLine: { lineStyle: { color: 'rgba(38,42,53,0.6)' } },
};

function genDates(n) {
  const d = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) {
    const t = new Date(now - i * 86400000);
    d.push(`${t.getMonth() + 1}/${t.getDate()}`);
  }
  return d;
}

function genRandWalk(n, base, volatility) {
  const r = [base];
  for (let i = 1; i < n; i++) r.push(r[i - 1] + (Math.random() - 0.48) * volatility);
  return r;
}

function genRand(n, min, max) {
  return Array.from({ length: n }, () => min + Math.random() * (max - min));
}

const DATES_30 = genDates(30);

const MOCK = {
  kpis: [
    { label: 'BTC 链上活跃地址', value: '1,024,381', chg: +3.2, sub: '24h' },
    { label: 'ETH Gas (Gwei)', value: '8.3', chg: -12.5, sub: '当前中位' },
    { label: 'DeFi TVL', value: '$182.6B', chg: +1.8, sub: '全链合计' },
    { label: '稳定币总供给', value: '$233.4B', chg: +0.4, sub: 'USDT+USDC+DAI' },
  ],
  exchangeFlow: {
    dates: DATES_30.slice(-14),
    btcIn: genRand(14, 8000, 28000),
    btcOut: genRand(14, 8000, 28000).map(v => -v),
  },
  activeAddresses: {
    dates: DATES_30,
    btc: genRandWalk(30, 950000, 30000).map(v => Math.round(v)),
    eth: genRandWalk(30, 520000, 20000).map(v => Math.round(v)),
    sol: genRandWalk(30, 1800000, 80000).map(v => Math.round(v)),
  },
  tvl: [
    { name: 'Lido', val: 33.2, chg: +1.2, color: '#6ea8ff' },
    { name: 'AAVE', val: 23.8, chg: +3.5, color: '#b48cff' },
    { name: 'EigenLayer', val: 15.4, chg: -0.8, color: '#f5c842' },
    { name: 'Maker', val: 10.1, chg: +0.3, color: '#2dd4a4' },
    { name: 'ether.fi', val: 8.7, chg: +5.2, color: '#ff7a3d' },
    { name: 'Uniswap', val: 6.9, chg: -1.1, color: '#f47171' },
    { name: 'Pendle', val: 5.3, chg: +8.4, color: '#4ade80' },
    { name: 'Rocket Pool', val: 4.2, chg: -0.5, color: '#60a5fa' },
  ],
  stablecoin: {
    dates: DATES_30,
    usdt: genRandWalk(30, 144, 0.8),
    usdc: genRandWalk(30, 60, 0.5),
    dai: genRandWalk(30, 5.3, 0.1),
  },
  whales: [
    { time: '2 分钟前', from: '0x21a3…e8f1', to: 'Binance', amount: '2,400 BTC', usd: '$227.5M', type: 'in' },
    { time: '8 分钟前', from: 'Coinbase', to: '0x8bc4…12dd', amount: '18,000 ETH', usd: '$57.6M', type: 'out' },
    { time: '15 分钟前', from: '0xf3e1…a902', to: '0x5d22…b734', amount: '50M USDT', usd: '$50.0M', type: 'transfer' },
    { time: '23 分钟前', from: 'Kraken', to: '0xab71…c3e8', amount: '1,100 BTC', usd: '$104.3M', type: 'out' },
    { time: '31 分钟前', from: '0x1f9a…d4c7', to: 'OKX', amount: '8,200 ETH', usd: '$26.2M', type: 'in' },
    { time: '42 分钟前', from: '0xe7b2…8a19', to: 'Binance', amount: '35M USDC', usd: '$35.0M', type: 'in' },
    { time: '56 分钟前', from: 'Bitfinex', to: '0xc442…f1b3', amount: '800 BTC', usd: '$75.8M', type: 'out' },
    { time: '1 小时前', from: '0x3da9…7e52', to: '0x91c0…5af6', amount: '120M USDT', usd: '$120.0M', type: 'transfer' },
  ],
  gasHistory: {
    dates: DATES_30,
    values: genRandWalk(30, 12, 3).map(v => Math.max(1, v)),
  },
};

function KpiRow() {
  return (
    <div className="oc-kpi-row">
      {MOCK.kpis.map((k, i) => (
        <div key={i} className="kpi">
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-foot">
            <span className={`pill ${k.chg >= 0 ? 'up' : 'dn'}`}>{k.chg >= 0 ? '+' : ''}{k.chg}%</span>
            <span className="muted">{k.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExchangeFlowChart() {
  const { dates, btcIn, btcOut } = MOCK.exchangeFlow;
  const option = {
    tooltip: { trigger: 'axis', backgroundColor: '#1c1f27', borderColor: '#262a35', textStyle: { color: '#e8eaf0', fontSize: 11 } },
    legend: { data: ['流入交易所', '流出交易所'], textStyle: { color: '#9aa0ad', fontSize: 11 }, top: 4, right: 8 },
    grid: { left: 50, right: 16, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: dates, ...COMMON_AXIS },
    yAxis: { type: 'value', ...COMMON_AXIS, axisLabel: { ...COMMON_AXIS.axisLabel, formatter: v => (v / 1000).toFixed(0) + 'k' } },
    series: [
      { name: '流入交易所', type: 'bar', stack: 'flow', data: btcIn.map(v => Math.round(v)), itemStyle: { color: '#f47171', borderRadius: [3, 3, 0, 0] } },
      { name: '流出交易所', type: 'bar', stack: 'flow', data: btcOut.map(v => Math.round(v)), itemStyle: { color: '#2dd4a4', borderRadius: [0, 0, 3, 3] } },
    ],
  };
  return <ReactECharts option={option} style={{ height: 260 }} opts={{ renderer: 'svg' }} />;
}

function ActiveAddressChart() {
  const { dates, btc, eth, sol } = MOCK.activeAddresses;
  const option = {
    tooltip: { trigger: 'axis', backgroundColor: '#1c1f27', borderColor: '#262a35', textStyle: { color: '#e8eaf0', fontSize: 11 } },
    legend: { data: ['BTC', 'ETH', 'SOL'], textStyle: { color: '#9aa0ad', fontSize: 11 }, top: 4, right: 8 },
    grid: { left: 56, right: 16, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: dates, ...COMMON_AXIS },
    yAxis: { type: 'value', ...COMMON_AXIS, axisLabel: { ...COMMON_AXIS.axisLabel, formatter: v => (v / 1e6).toFixed(1) + 'M' } },
    series: [
      { name: 'BTC', type: 'line', data: btc, smooth: true, symbol: 'none', lineStyle: { width: 2 }, itemStyle: { color: '#f5c842' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(245,200,66,0.15)' }, { offset: 1, color: 'rgba(245,200,66,0)' }] } } },
      { name: 'ETH', type: 'line', data: eth, smooth: true, symbol: 'none', lineStyle: { width: 2 }, itemStyle: { color: '#6ea8ff' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(110,168,255,0.12)' }, { offset: 1, color: 'rgba(110,168,255,0)' }] } } },
      { name: 'SOL', type: 'line', data: sol, smooth: true, symbol: 'none', lineStyle: { width: 2 }, itemStyle: { color: '#b48cff' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(180,140,255,0.12)' }, { offset: 1, color: 'rgba(180,140,255,0)' }] } } },
    ],
  };
  return <ReactECharts option={option} style={{ height: 260 }} opts={{ renderer: 'svg' }} />;
}

function StablecoinChart() {
  const { dates, usdt, usdc, dai } = MOCK.stablecoin;
  const option = {
    tooltip: { trigger: 'axis', backgroundColor: '#1c1f27', borderColor: '#262a35', textStyle: { color: '#e8eaf0', fontSize: 11 }, valueFormatter: v => '$' + v.toFixed(1) + 'B' },
    legend: { data: ['USDT', 'USDC', 'DAI'], textStyle: { color: '#9aa0ad', fontSize: 11 }, top: 4, right: 8 },
    grid: { left: 50, right: 16, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: dates, ...COMMON_AXIS },
    yAxis: { type: 'value', ...COMMON_AXIS, axisLabel: { ...COMMON_AXIS.axisLabel, formatter: v => '$' + v + 'B' } },
    series: [
      { name: 'USDT', type: 'line', data: usdt.map(v => +v.toFixed(1)), smooth: true, symbol: 'none', lineStyle: { width: 2 }, itemStyle: { color: '#2dd4a4' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(45,212,164,0.15)' }, { offset: 1, color: 'rgba(45,212,164,0)' }] } } },
      { name: 'USDC', type: 'line', data: usdc.map(v => +v.toFixed(1)), smooth: true, symbol: 'none', lineStyle: { width: 2 }, itemStyle: { color: '#6ea8ff' } },
      { name: 'DAI', type: 'line', data: dai.map(v => +v.toFixed(1)), smooth: true, symbol: 'none', lineStyle: { width: 2 }, itemStyle: { color: '#f5c842' } },
    ],
  };
  return <ReactECharts option={option} style={{ height: 240 }} opts={{ renderer: 'svg' }} />;
}

function GasChart() {
  const { dates, values } = MOCK.gasHistory;
  const option = {
    tooltip: { trigger: 'axis', backgroundColor: '#1c1f27', borderColor: '#262a35', textStyle: { color: '#e8eaf0', fontSize: 11 }, valueFormatter: v => v.toFixed(1) + ' Gwei' },
    grid: { left: 44, right: 16, top: 16, bottom: 28 },
    xAxis: { type: 'category', data: dates, ...COMMON_AXIS },
    yAxis: { type: 'value', ...COMMON_AXIS },
    series: [{
      type: 'bar', data: values.map(v => +v.toFixed(1)),
      itemStyle: {
        borderRadius: [3, 3, 0, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#ff7a3d' }, { offset: 1, color: 'rgba(255,122,61,0.25)' }] },
      },
    }],
  };
  return <ReactECharts option={option} style={{ height: 240 }} opts={{ renderer: 'svg' }} />;
}

function TvlTable() {
  const total = MOCK.tvl.reduce((s, p) => s + p.val, 0);
  return (
    <div className="oc-tvl-list">
      {MOCK.tvl.map((p, i) => (
        <div key={p.name} className="oc-tvl-row">
          <span className="oc-tvl-rank">{i + 1}</span>
          <span className="oc-tvl-dot" style={{ background: p.color }}></span>
          <span className="oc-tvl-name">{p.name}</span>
          <div className="oc-tvl-bar-track">
            <div className="oc-tvl-bar-fill" style={{ width: `${(p.val / total) * 100}%`, background: p.color }}></div>
          </div>
          <span className="oc-tvl-val">${p.val}B</span>
          <span className={`oc-tvl-chg ${p.chg >= 0 ? 'up' : 'dn'}`}>{p.chg >= 0 ? '+' : ''}{p.chg}%</span>
        </div>
      ))}
    </div>
  );
}

function WhaleTable() {
  return (
    <div className="oc-whale-table">
      <div className="oc-whale-thead">
        <span>时间</span><span>发送方</span><span>接收方</span><span className="right">金额</span><span className="right">USD</span>
      </div>
      <div className="oc-whale-body">
        {MOCK.whales.map((w, i) => (
          <div key={i} className="oc-whale-row">
            <span className="oc-whale-time">{w.time}</span>
            <span className="oc-whale-addr">
              {w.type === 'out' && <span className="oc-tag-ex">{w.from}</span>}
              {w.type !== 'out' && w.from}
            </span>
            <span className="oc-whale-addr">
              {w.type === 'in' && <span className="oc-tag-ex">{w.to}</span>}
              {w.type !== 'in' && w.to}
            </span>
            <span className="oc-whale-amount right">{w.amount}</span>
            <span className="oc-whale-usd right">{w.usd}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OnchainPage() {
  const [period, setPeriod] = useState('30d');

  return (
    <div className="page oc-page">
      <div className="oc-head">
        <div>
          <h1>链上数据</h1>
          <p>实时追踪链上活动、资金流向与 DeFi 生态</p>
        </div>
        <div className="tf-group">
          {['7d', '14d', '30d', '90d'].map(p => (
            <button key={p} className={`tf ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>

      <KpiRow />

      <div className="oc-grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">BTC 交易所净流量</div>
              <div className="card-sub">正值=流入（抛压），负值=流出（囤币）</div>
            </div>
          </div>
          <ExchangeFlowChart />
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">活跃地址数</div>
              <div className="card-sub">每日唯一活跃地址</div>
            </div>
          </div>
          <ActiveAddressChart />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">巨鲸动向</div>
            <div className="card-sub">链上大额转账实时追踪（&gt;$25M）</div>
          </div>
          <span className="oc-live-dot">LIVE</span>
        </div>
        <WhaleTable />
      </div>

      <div className="oc-grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">DeFi TVL 排行</div>
              <div className="card-sub">按协议锁仓量排序</div>
            </div>
          </div>
          <TvlTable />
        </div>
        <div className="oc-grid-col">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">稳定币供给趋势</div>
                <div className="card-sub">USDT / USDC / DAI 总供给</div>
              </div>
            </div>
            <StablecoinChart />
          </div>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">ETH Gas 历史</div>
                <div className="card-sub">每日中位 Gas Price (Gwei)</div>
              </div>
            </div>
            <GasChart />
          </div>
        </div>
      </div>
    </div>
  );
}
