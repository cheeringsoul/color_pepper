import { useState, useMemo, useEffect } from 'react';
import api from '../api';
import { fmtPrice } from '../utils';

const SECTOR_COLORS = {
  '主流币': '#f7931a', 'Layer 1': '#10b981', 'Layer 2': '#a78bfa',
  'DeFi': '#6ea8ff', 'Meme': '#fbbf24', 'AI': '#f472b6',
  'Solana': '#9945ff', '支付': '#38bdf8',
};

const W = 1000, H = 440, padL = 60, padR = 60, padT = 30, padB = 30;
const N = 120;

const chartW = W - padL - padR;
const chartH = H - padT - padB;

function buildXLabels(period) {
  const now = new Date();
  const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
  const labels = [];
  const count = 5;
  for (let i = 0; i <= count; i++) {
    const d = new Date(now.getTime() - (days - (days * i) / count) * 86400000);
    labels.push({
      text: `${d.getMonth() + 1}/${d.getDate()}`,
      x: padL + (chartW * i) / count,
    });
  }
  return labels;
}

export default function RotationPage({ symbols, onOpenSymbol }) {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    api.getRotationAnalysis(period).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => { cancelled = true; };
  }, [period]);

  const chart = useMemo(() => {
    if (!data) return null;
    const { btcLine, annotations } = data;
    const min = Math.min(...btcLine);
    const max = Math.max(...btcLine);
    const range = max - min || 1;
    const yMin = min - range * 0.05;
    const yMax = max + range * 0.05;
    const yRange = yMax - yMin;

    const toX = (i) => padL + (i / (N - 1)) * chartW;
    const toY = (v) => padT + chartH - ((v - yMin) / yRange) * chartH;

    const points = btcLine.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
    const areaPoints =
      `${toX(0)},${padT + chartH} ` +
      points +
      ` ${toX(N - 1)},${padT + chartH}`;

    const lastPrice = btcLine[btcLine.length - 1];
    const lastY = toY(lastPrice);

    // Y-axis ticks
    const yTicks = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const v = yMin + (yRange * i) / tickCount;
      yTicks.push({ y: toY(v), label: `$${(v / 1000).toFixed(1)}K` });
    }

    // Annotation positions
    const annPos = annotations.map((ann) => ({
      ...ann,
      cx: toX(ann.t),
      cy: toY(ann.value),
      color: SECTOR_COLORS[ann.sector] || '#888',
    }));

    return { points, areaPoints, lastPrice, lastY, yTicks, annPos, yMin, yMax };
  }, [data]);

  const xLabels = useMemo(() => buildXLabels(period), [period]);

  if (!data) return <div className="rot-page" />;

  const { sectorStats, sectors, annotations, symbolCount } = data;

  const lastPrice = chart.lastPrice;
  const topSector = sectorStats.reduce((a, b) => (b.contribution > a.contribution ? b : a), sectorStats[0]);
  const bottomSector = sectorStats.reduce((a, b) => (b.contribution < a.contribution ? b : a), sectorStats[0]);
  const activeSector = sectorStats.reduce((a, b) => (b.count > a.count ? b : a), sectorStats[0]);

  const maxContrib = Math.max(...sectorStats.map((s) => Math.abs(s.contribution)));

  return (
    <div className="rot-page">
      <div className="rot-head">
        <h2>板块轮动分析</h2>
        <div>
          {['7d', '14d', '30d'].map((p) => (
            <button
              key={p}
              className={'pill' + (period === p ? ' active' : '')}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        <div className="kpi">
          <span className="kpi-label">BTC 价格</span>
          <span className="kpi-value">${fmtPrice(lastPrice)}</span>
          <span className="kpi-foot">实时</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">领涨板块</span>
          <span className="kpi-value" style={{ color: SECTOR_COLORS[topSector.sector] || '#10b981' }}>
            {topSector.sector}
          </span>
          <span className="kpi-foot">+{topSector.contribution.toFixed(1)}%</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">领跌板块</span>
          <span className="kpi-value" style={{ color: SECTOR_COLORS[bottomSector.sector] || '#ef4444' }}>
            {bottomSector.sector}
          </span>
          <span className="kpi-foot">{bottomSector.contribution.toFixed(1)}%</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">活跃板块</span>
          <span className="kpi-value" style={{ color: SECTOR_COLORS[activeSector.sector] || '#6ea8ff' }}>
            {activeSector.sector}
          </span>
          <span className="kpi-foot">{activeSector.count} 次轮动</span>
        </div>
      </div>

      {/* Chart card */}
      <div className="rot-chart-card">
        <div className="card-head">
          <span className="card-title">BTC 价格 & 板块轮动标注</span>
          <span className="card-sub">共 {symbolCount} 个标的 · {sectors.length} 个板块</span>
        </div>

        <svg className="rot-chart-svg" viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="rot-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6ea8ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6ea8ff" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {chart.yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={padL} y1={t.y} x2={W - padR} y2={t.y}
                stroke="#1e293b" strokeDasharray="4,3"
              />
              <text x={padL - 8} y={t.y + 4} textAnchor="end" fill="#64748b" fontSize="11">
                {t.label}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map((l, i) => (
            <text key={i} x={l.x} y={H - 4} textAnchor="middle" fill="#64748b" fontSize="11">
              {l.text}
            </text>
          ))}

          {/* Area fill */}
          <polygon points={chart.areaPoints} fill="url(#rot-grad)" />

          {/* Price line */}
          <polyline
            points={chart.points}
            fill="none" stroke="#6ea8ff" strokeWidth="2"
          />

          {/* Annotations */}
          {chart.annPos.map((ann, i) => (
            <g key={i}>
              <line
                x1={ann.cx} y1={padT} x2={ann.cx} y2={padT + chartH}
                stroke={ann.color} strokeWidth="1" strokeDasharray="3,3" opacity="0.5"
              />
              <circle cx={ann.cx} cy={ann.cy} r={5} fill={ann.color} stroke="#0f172a" strokeWidth="2" />
              <text
                x={ann.cx} y={padT - 6} textAnchor="middle"
                fill={ann.color} fontSize="10" fontWeight="600"
              >
                {ann.sector}
              </text>
            </g>
          ))}

          {/* Last-price tag */}
          <rect
            x={W - padR + 4} y={chart.lastY - 11}
            width={68} height={22} rx={4}
            fill="#6ea8ff"
          />
          <text
            x={W - padR + 38} y={chart.lastY + 4}
            textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600"
          >
            ${fmtPrice(lastPrice)}
          </text>
        </svg>

        {/* Legend */}
        <div className="rot-legend">
          {sectors.map((s) => (
            <span key={s} className="rot-lg-item">
              <span className="rot-lg-dot" style={{ background: SECTOR_COLORS[s] || '#888' }} />
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="rot-bottom">
        {/* Contribution bar chart */}
        <div className="rot-contrib-card">
          <div className="card-head">
            <span className="card-title">板块贡献排行</span>
          </div>
          <div className="rot-bars">
            {[...sectorStats]
              .sort((a, b) => b.contribution - a.contribution)
              .map((s) => (
                <div className="rot-bar-row" key={s.sector}>
                  <span className="rot-bar-label">{s.sector}</span>
                  <div className="rot-bar-track">
                    <div
                      className="rot-bar-fill"
                      style={{
                        width: `${(Math.abs(s.contribution) / maxContrib) * 100}%`,
                        background: SECTOR_COLORS[s.sector] || '#888',
                        opacity: s.contribution >= 0 ? 1 : 0.5,
                      }}
                    />
                  </div>
                  <span className="rot-bar-val">
                    {s.contribution >= 0 ? '+' : ''}{s.contribution.toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="rot-timeline-card">
          <div className="card-head">
            <span className="card-title">轮动时间线</span>
          </div>
          <div className="rot-events">
            {annotations.map((ann, i) => (
              <div className="rot-event" key={i}>
                <span
                  className="rot-event-dot"
                  style={{ background: SECTOR_COLORS[ann.sector] || '#888' }}
                />
                <div className="rot-event-body">
                  <span className="rot-event-title">
                    {ann.sector} {ann.isUp ? '领涨' : '领跌'}
                  </span>
                  <span className="rot-event-sub">
                    BTC ${fmtPrice(ann.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
