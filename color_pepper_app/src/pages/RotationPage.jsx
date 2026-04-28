import { useState, useMemo, useEffect } from 'react';
import api from '../api';
import { fmtPrice } from '../utils';

const SECTOR_COLORS = {
  '主流币': '#f7931a', 'Layer 1': '#10b981', 'Layer 2': '#a78bfa',
  'DeFi': '#6ea8ff', 'Meme': '#fbbf24', 'AI': '#f472b6',
  'Solana': '#9945ff', '支付': '#38bdf8',
};

const W = 1000, H = 440;
const padL = 20, padR = 20, padT = 36, padB = 24;
const N = 120;

const chartW = W - padL - padR;
const chartH = H - padT - padB;

function buildXLabels(period) {
  const now = new Date();
  const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
  const labels = [];
  const count = 6;
  for (let i = 0; i <= count; i++) {
    const d = new Date(now.getTime() - (days - (days * i) / count) * 86400000);
    labels.push({
      text: `${d.getMonth() + 1}/${d.getDate()}`,
      x: padL + (chartW * i) / count,
    });
  }
  return labels;
}

function estimateTagWidth(text) {
  let w = 14;
  for (const ch of text) w += ch.charCodeAt(0) > 255 ? 10 : 6;
  return w;
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
    const yMin = min - range * 0.08;
    const yMax = max + range * 0.08;
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

    const yTicks = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const v = yMin + (yRange * i) / tickCount;
      yTicks.push({ y: toY(v), label: `$${(v / 1000).toFixed(1)}K` });
    }

    const annPos = annotations.map((ann) => {
      const syms = ann.topSymbols || [];
      const label = `${ann.isUp ? '▲' : '▼'} ${syms.join(' ')}`;
      const tw = estimateTagWidth(label);
      const th = 20;
      const gap = 6;
      const cx = toX(ann.t);
      const cy = toY(ann.value);
      const above = ann.isUp;
      const tagY = above ? cy - gap - th : cy + gap;
      const tagX = Math.max(padL + tw / 2, Math.min(W - padR - tw / 2, cx));
      return {
        ...ann,
        cx, cy, label, tw, th, tagX, tagY,
        color: ann.isUp ? '#2dd4a4' : '#f47171',
        bgColor: ann.isUp ? 'rgba(45,212,164,0.12)' : 'rgba(244,113,113,0.12)',
        borderColor: ann.isUp ? 'rgba(45,212,164,0.35)' : 'rgba(244,113,113,0.35)',
      };
    });

    return { points, areaPoints, lastPrice, lastY, yTicks, annPos };
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

      <div className="rot-chart-card">
        <div className="card-head">
          <span className="card-title">BTC 价格 & 板块轮动标注</span>
          <span className="card-sub">共 {symbolCount} 个标的 · {sectors.length} 个板块</span>
        </div>

        <svg className="rot-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="rot-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {chart.yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={padL} y1={t.y} x2={W - padR} y2={t.y}
                stroke="var(--line)" strokeDasharray="3 5"
              />
              <text x={padL + 6} y={t.y - 4} textAnchor="start" fill="var(--text-3)" fontSize="10" fontFamily="var(--mono)">
                {t.label}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map((l, i) => (
            <text key={i} x={l.x} y={H - 4} textAnchor="middle" fill="var(--text-3)" fontSize="10" fontFamily="var(--mono)">
              {l.text}
            </text>
          ))}

          {/* Area fill */}
          <polygon points={chart.areaPoints} fill="url(#rot-grad)" />

          {/* Price line */}
          <polyline
            points={chart.points}
            fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round"
          />

          {/* Annotations — inline labels on the line */}
          {chart.annPos.map((ann, i) => (
            <g key={i}>
              {/* Stem from label to point */}
              <line
                x1={ann.tagX} y1={ann.tagY + (ann.isUp ? ann.th : 0)}
                x2={ann.cx} y2={ann.cy + (ann.isUp ? -3 : 3)}
                stroke={ann.borderColor} strokeWidth="1"
              />
              {/* Point on line */}
              <circle cx={ann.cx} cy={ann.cy} r={3} fill={ann.color} />
              {/* Tag background */}
              <rect
                x={ann.tagX - ann.tw / 2} y={ann.tagY}
                width={ann.tw} height={ann.th} rx={5}
                fill={ann.bgColor} stroke={ann.borderColor} strokeWidth={0.5}
              />
              {/* Tag text */}
              <text
                x={ann.tagX} y={ann.tagY + 14}
                textAnchor="middle" fill={ann.color}
                fontSize="10" fontWeight="600" fontFamily="var(--mono)"
              >
                {ann.label}
              </text>
            </g>
          ))}

          {/* Last-price tag (overlaid on chart) */}
          <line
            x1={W - padR - 60} y1={chart.lastY}
            x2={W - padR} y2={chart.lastY}
            stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5"
          />
          <rect
            x={W - padR - 56} y={chart.lastY - 11}
            width={56} height={22} rx={4}
            fill="var(--accent)"
          />
          <text
            x={W - padR - 28} y={chart.lastY + 4}
            textAnchor="middle" fill="#1a0f08" fontSize="10" fontWeight="700" fontFamily="var(--mono)"
          >
            ${(lastPrice / 1000).toFixed(1)}K
          </text>
        </svg>

        <div className="rot-legend">
          {sectors.map((s) => (
            <span key={s} className="rot-lg-item">
              <span className="rot-lg-dot" style={{ background: SECTOR_COLORS[s] || '#888' }} />
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="rot-bottom">
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

        <div className="rot-timeline-card">
          <div className="card-head">
            <span className="card-title">轮动时间线</span>
          </div>
          <div className="rot-events">
            {annotations.map((ann, i) => (
              <div className="rot-event" key={i}>
                <span
                  className={`rot-event-dot ${ann.isUp ? 'up' : 'dn'}`}
                  style={{ background: ann.isUp ? '#2dd4a4' : '#f47171' }}
                />
                <div className="rot-event-body">
                  <span className="rot-event-title">
                    <span className={ann.isUp ? 'up' : 'dn'}>{ann.isUp ? '▲' : '▼'}</span>
                    {' '}{(ann.topSymbols || []).join(', ')}
                    <span className="dim"> · {ann.sector}</span>
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
