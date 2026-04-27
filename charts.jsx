// ===== Shared chart components =====
const { useState, useEffect, useRef, useMemo } = React;

function Sparkline({ data, color = 'currentColor', width = 80, height = 24, fill = false }) {
  if (!data || !data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = pts.join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      {fill && (
        <polyline
          points={`${path} ${width},${height} 0,${height}`}
          fill={color} opacity="0.12" stroke="none"
        />
      )}
      <polyline points={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CandleChart({ candles, height = 320, showAxis = true, showCrosshair = true }) {
  if (!candles || !candles.length) return null;
  const W = 800, H = height;
  const padR = showAxis ? 56 : 4, padL = 4;
  const innerW = W - padR - padL;
  const high = Math.max(...candles.map(c => c.high));
  const low = Math.min(...candles.map(c => c.low));
  const range = high - low || 1;
  const cw = innerW / candles.length;
  const yOf = v => ((high - v) / range) * (H - 20) + 10;

  // moving average
  const ma = candles.map((_, i) => {
    const start = Math.max(0, i - 9);
    const slice = candles.slice(start, i + 1);
    const sum = slice.reduce((s, c) => s + c.close, 0);
    return sum / slice.length;
  });
  const maPath = ma.map((v, i) => `${(padL + i * cw + cw / 2).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');

  const ticks = 5;
  const yTicks = Array.from({ length: ticks }, (_, i) => low + (range * i) / (ticks - 1));

  const last = candles[candles.length - 1];
  const lastY = yOf(last.close);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      {/* grid */}
      {yTicks.map((t, i) => {
        const y = yOf(t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--line)" strokeDasharray="3 5" strokeWidth="1" />
            {showAxis && (
              <text x={W - padR + 6} y={y + 3} fill="var(--text-3)" fontSize="9" fontFamily="var(--mono)">
                {t.toLocaleString(undefined, { maximumFractionDigits: t < 1 ? 4 : 0 })}
              </text>
            )}
          </g>
        );
      })}
      {/* candles */}
      {candles.map((c, i) => {
        const x = padL + i * cw + cw / 2;
        const up = c.close >= c.open;
        const color = up ? 'var(--up)' : 'var(--dn)';
        const bw = Math.max(1, cw * 0.7);
        return (
          <g key={i}>
            <line x1={x} y1={yOf(c.high)} x2={x} y2={yOf(c.low)} stroke={color} strokeWidth="1" />
            <rect
              x={x - bw / 2}
              y={yOf(Math.max(c.open, c.close))}
              width={bw}
              height={Math.max(1, Math.abs(yOf(c.open) - yOf(c.close)))}
              fill={color}
            />
          </g>
        );
      })}
      {/* MA */}
      <polyline points={maPath} fill="none" stroke="var(--accent-2)" strokeWidth="1.4" opacity="0.85" />
      {/* crosshair */}
      {showCrosshair && (
        <>
          <line x1={padL} y1={lastY} x2={W - padR} y2={lastY} stroke="var(--accent)" strokeDasharray="2 4" strokeWidth="1" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

function VolumeBars({ candles, height = 70 }) {
  if (!candles || !candles.length) return null;
  const W = 800, H = height;
  const padR = 56, padL = 4;
  const innerW = W - padR - padL;
  const maxV = Math.max(...candles.map(c => c.volume));
  const cw = innerW / candles.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      {candles.map((c, i) => {
        const x = padL + i * cw + cw / 2;
        const up = c.close >= c.open;
        const color = up ? 'var(--up)' : 'var(--dn)';
        const bw = Math.max(1, cw * 0.7);
        const h = (c.volume / maxV) * (H - 8);
        return (
          <rect key={i} x={x - bw / 2} y={H - h} width={bw} height={h} fill={color} opacity="0.55" />
        );
      })}
    </svg>
  );
}

window.Sparkline = Sparkline;
window.CandleChart = CandleChart;
window.VolumeBars = VolumeBars;
