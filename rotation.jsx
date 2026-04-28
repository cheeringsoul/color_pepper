// ===== Rotation page =====
function RotationPage({ data, onOpenSymbol }) {
  const [period, setPeriod] = React.useState('30d');

  const SECTOR_COLORS = {
    '主流币': '#f7931a',
    'Layer 1': '#10b981',
    'Layer 2': '#a78bfa',
    'DeFi': '#6ea8ff',
    'Meme': '#fbbf24',
    'AI': '#f472b6',
    'Solana': '#9945ff',
    '支付': '#38bdf8',
  };

  const N = 120;
  const periodCfg = { '7d': { vol: 0.025, off: 0 }, '14d': { vol: 0.018, off: 50 }, '30d': { vol: 0.012, off: 200 } };

  const computed = React.useMemo(() => {
    const cfg = periodCfg[period] || periodCfg['30d'];
    const { SYMBOLS, SECTORS } = data;
    const totalMcap = SYMBOLS.reduce((s, c) => s + c.mcap, 0);

    const series = {};
    SYMBOLS.forEach(sym => {
      const seed = sym.sym.charCodeAt(0) * 17 + sym.sym.charCodeAt(1) * 3 + cfg.off;
      const candles = data.candles(seed, N, sym.price, cfg.vol);
      const base = candles[0].close;
      series[sym.sym] = candles.map(c => c.close / base);
    });

    const btcSym = SYMBOLS.find(s => s.sym === 'BTC');
    const btcSeed = btcSym.sym.charCodeAt(0) * 17 + btcSym.sym.charCodeAt(1) * 3 + cfg.off;
    const btcCandles = data.candles(btcSeed, N, btcSym.price, cfg.vol);
    const indexLine = btcCandles.map(c => c.close);

    const sectorContribs = [];
    for (let t = 1; t < N; t++) {
      const c = {};
      SECTORS.forEach(sec => c[sec] = 0);
      SYMBOLS.forEach(sym => {
        c[sym.sector] += (sym.mcap / totalMcap) * (series[sym.sym][t] - series[sym.sym][t - 1]) * 1000;
      });
      sectorContribs.push(c);
    }

    const smooth = indexLine.map((_, i) => {
      let s = 0, n = 0;
      for (let j = Math.max(0, i - 3); j <= Math.min(N - 1, i + 3); j++) { s += indexLine[j]; n++; }
      return s / n;
    });

    const annotations = [];
    for (let t = 6; t < N - 6; t++) {
      const db = smooth[t] - smooth[t - 5];
      const da = smooth[t + 5] - smooth[t];
      if (!((db > 0 && da < 0) || (db < 0 && da > 0))) continue;
      if (annotations.length && t - annotations[annotations.length - 1].t < 12) continue;

      const ws = Math.max(0, t - 8), we = Math.min(sectorContribs.length - 1, t - 1);
      const sums = {};
      SECTORS.forEach(sec => sums[sec] = 0);
      for (let j = ws; j <= we; j++) SECTORS.forEach(sec => sums[sec] += sectorContribs[j][sec]);

      const isUp = db > 0;
      let best = SECTORS[0], bv = -Infinity;
      SECTORS.forEach(sec => { const v = isUp ? sums[sec] : -sums[sec]; if (v > bv) { bv = v; best = sec; } });
      annotations.push({ t, sector: best, isUp, value: indexLine[t] });
    }

    for (let i = 0; i < annotations.length - 1; i++) {
      if (annotations[i + 1].t - annotations[i].t > 25) {
        const mt = Math.round((annotations[i].t + annotations[i + 1].t) / 2);
        const isUp = indexLine[mt] > indexLine[Math.max(0, mt - 5)];
        const ws = Math.max(0, mt - 5), we = Math.min(sectorContribs.length - 1, mt);
        const sums = {};
        SECTORS.forEach(sec => sums[sec] = 0);
        for (let j = ws; j <= we; j++) SECTORS.forEach(sec => sums[sec] += sectorContribs[j][sec]);
        let best = SECTORS[0], bv = -Infinity;
        SECTORS.forEach(sec => { const v = isUp ? sums[sec] : -sums[sec]; if (v > bv) { bv = v; best = sec; } });
        annotations.splice(i + 1, 0, { t: mt, sector: best, isUp, value: indexLine[mt] });
        i++;
      }
    }

    const recent = {};
    SECTORS.forEach(sec => recent[sec] = 0);
    for (let t = Math.max(0, sectorContribs.length - 20); t < sectorContribs.length; t++)
      SECTORS.forEach(sec => recent[sec] += sectorContribs[t][sec]);

    const sectorStats = SECTORS.map(sec => ({
      sector: sec,
      contribution: recent[sec],
      count: SYMBOLS.filter(s => s.sector === sec).length,
    })).sort((a, b) => b.contribution - a.contribution);

    return {
      indexLine,
      annotations,
      sectorStats,
      lastIndex: indexLine[N - 1],
      indexChg: ((indexLine[N - 1] - indexLine[0]) / indexLine[0]) * 100,
    };
  }, [data, period]);

  const { indexLine, annotations, sectorStats, lastIndex, indexChg } = computed;

  const W = 1000, H = 440;
  const padL = 60, padR = 60, padT = 30, padB = 30;
  const iW = W - padL - padR, iH = H - padT - padB;
  const minV = Math.min(...indexLine), maxV = Math.max(...indexLine);
  const vR = maxV - minV || 1;
  const yPad = vR * 0.15;
  const yMin = minV - yPad, yMax = maxV + yPad, yR = yMax - yMin;
  const xOf = t => padL + (t / (N - 1)) * iW;
  const yOf = v => padT + (1 - (v - yMin) / yR) * iH;

  const linePts = indexLine.map((v, t) => `${xOf(t).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
  const areaPts = `${linePts} ${xOf(N - 1).toFixed(1)},${(padT + iH).toFixed(1)} ${padL.toFixed(1)},${(padT + iH).toFixed(1)}`;
  const baseY = yOf(indexLine[0]);
  const yTicks = Array.from({ length: 6 }, (_, i) => yMin + (yR * i) / 5);

  const daysSpan = period === '7d' ? 7 : period === '14d' ? 14 : 30;
  const xLabels = React.useMemo(() => {
    const labels = [];
    const step = Math.ceil(daysSpan / 6);
    for (let d = 0; d <= daysSpan; d += step) {
      const t = Math.round((d / daysSpan) * (N - 1));
      const date = new Date('2026-04-28');
      date.setDate(date.getDate() - (daysSpan - d));
      labels.push({ t, label: `${date.getMonth() + 1}/${date.getDate()}` });
    }
    return labels;
  }, [period]);

  function tagWidth(sector) {
    let w = 42;
    for (const ch of sector) w += ch.charCodeAt(0) > 255 ? 12 : 7.5;
    return w;
  }

  return (
    <div className="page rot-page">
      <div className="rot-head">
        <div>
          <h1>板块轮动</h1>
          <p>市值加权合成指数 · 标注各阶段主导板块 · 追踪资金轮动轨迹</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d', '14d', '30d'].map(p => (
            <button key={p} className={`chip ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">BTC 价格</div>
          <div className="kpi-value">${window.fmtPrice(lastIndex)}</div>
          <div className="kpi-foot">
            <span className={`pill ${indexChg >= 0 ? 'up' : 'dn'}`}>{indexChg >= 0 ? '+' : ''}{indexChg.toFixed(2)}%</span>
            <span className="dim">{period}</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">领涨板块</div>
          <div className="kpi-value" style={{ color: SECTOR_COLORS[sectorStats[0]?.sector] || 'var(--up)', fontSize: 18 }}>
            {sectorStats[0]?.sector || '–'}
          </div>
          <div className="kpi-foot">
            <span className="pill up">+{(sectorStats[0]?.contribution || 0).toFixed(2)}</span>
            <span className="dim">贡献值</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">领跌板块</div>
          <div className="kpi-value" style={{ color: SECTOR_COLORS[sectorStats[sectorStats.length - 1]?.sector] || 'var(--dn)', fontSize: 18 }}>
            {sectorStats[sectorStats.length - 1]?.sector || '–'}
          </div>
          <div className="kpi-foot">
            <span className="pill dn">{(sectorStats[sectorStats.length - 1]?.contribution || 0).toFixed(2)}</span>
            <span className="dim">贡献值</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">活跃板块</div>
          <div className="kpi-value">
            {sectorStats.filter(s => Math.abs(s.contribution) > 0.05).length}
            <span style={{ fontSize: 14, color: 'var(--text-3)' }}>/{data.SECTORS.length}</span>
          </div>
          <div className="kpi-foot">
            <span className="pill flat">轮动中</span>
            <span className="dim">近 {period}</span>
          </div>
        </div>
      </div>

      <div className="card rot-chart-card">
        <div className="card-head">
          <div>
            <div className="card-title">BTC · 板块轮动标注</div>
            <div className="card-sub">BTC 价格走势 · 拐点标注主导板块</div>
          </div>
        </div>
        <svg className="rot-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="rot-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={padL} y1={yOf(v)} x2={W - padR} y2={yOf(v)} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 5" />
              <text x={padL - 8} y={yOf(v) + 3} textAnchor="end" fill="var(--text-3)" fontSize="10" fontFamily="var(--mono)">${(v/1000).toFixed(1)}K</text>
            </g>
          ))}
          {xLabels.map((l, i) => (
            <text key={i} x={xOf(l.t)} y={padT + iH + 22} textAnchor="middle" fill="var(--text-3)" fontSize="10" fontFamily="var(--mono)">{l.label}</text>
          ))}
          <line x1={padL} y1={baseY} x2={W - padR} y2={baseY} stroke="var(--text-3)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
          <polygon points={areaPts} fill="url(#rot-grad)" />
          <polyline points={linePts} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
          {annotations.map((ann, i) => {
            const x = xOf(ann.t);
            const y = yOf(ann.value);
            const label = `${ann.isUp ? '▲' : '▼'} ${ann.sector}`;
            const tw = tagWidth(ann.sector);
            const th = 22;
            const gap = 10;
            const tagY = ann.isUp ? y - gap - th : y + gap;
            const stemEnd = ann.isUp ? tagY + th : tagY;
            const cx = Math.max(padL + tw / 2, Math.min(W - padR - tw / 2, x));
            const upC = 'rgba(45,212,164,';
            const dnC = 'rgba(244,113,113,';
            const base = ann.isUp ? upC : dnC;
            return (
              <g key={i}>
                <line x1={x} y1={y + (ann.isUp ? -4 : 4)} x2={cx} y2={stemEnd}
                  stroke={base + '0.5)'} strokeWidth="1" strokeDasharray="2 2" />
                <circle cx={x} cy={y} r="3" fill={base + '0.9)'} />
                <rect x={cx - tw / 2} y={tagY} width={tw} height={th}
                  rx="6" fill={base + '0.10)'} stroke={base + '0.35)'} strokeWidth="1" />
                <text x={cx} y={tagY + 14.5} textAnchor="middle"
                  fill={ann.isUp ? 'var(--up)' : 'var(--dn)'} fontSize="11" fontWeight="600">{label}</text>
              </g>
            );
          })}
          {(() => {
            const ly = yOf(lastIndex);
            return (
              <g>
                <line x1={xOf(N - 1)} y1={ly} x2={W - padR} y2={ly}
                  stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
                <rect x={W - padR + 2} y={ly - 11} width="68" height="22" rx="5" fill="var(--accent)" />
                <text x={W - padR + 36} y={ly + 4} textAnchor="middle"
                  fill="#1a0f08" fontSize="10" fontWeight="700" fontFamily="var(--mono)">${(lastIndex/1000).toFixed(1)}K</text>
              </g>
            );
          })()}
        </svg>
        <div className="rot-legend">
          {data.SECTORS.map(sec => (
            <div key={sec} className="rot-lg-item">
              <div className="rot-lg-dot" style={{ background: SECTOR_COLORS[sec] }}></div>
              <span>{sec}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rot-bottom">
        <div className="card rot-contrib-card">
          <div className="card-head">
            <div>
              <div className="card-title">板块贡献排行</div>
              <div className="card-sub">近期各板块对指数的贡献值</div>
            </div>
          </div>
          <div className="rot-bars">
            {(() => {
              const maxAbs = Math.max(...sectorStats.map(x => Math.abs(x.contribution)), 0.01);
              return sectorStats.map(s => {
                const pct = (Math.abs(s.contribution) / maxAbs) * 100;
                const isUp = s.contribution >= 0;
                return (
                  <div key={s.sector} className="rot-bar-row">
                    <div className="rot-bar-label">
                      <div className="rot-lg-dot" style={{ background: SECTOR_COLORS[s.sector] }}></div>
                      <span>{s.sector}</span>
                      <span className="dim" style={{ fontSize: 10 }}>({s.count})</span>
                    </div>
                    <div className="rot-bar-track">
                      <div className={`rot-bar-fill ${isUp ? 'up' : 'dn'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className={`rot-bar-val ${isUp ? 'up' : 'dn'}`}>
                      {isUp ? '+' : ''}{s.contribution.toFixed(3)}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="card rot-timeline-card">
          <div className="card-head">
            <div>
              <div className="card-title">轮动时间线</div>
              <div className="card-sub">拐点主导板块切换记录</div>
            </div>
          </div>
          <div className="rot-events">
            {annotations.map((ann, i) => (
              <div key={i} className="rot-event">
                <div className={`rot-event-dot ${ann.isUp ? 'up' : 'dn'}`}></div>
                <div className="rot-event-body">
                  <div className="rot-event-title">
                    <span style={{ color: SECTOR_COLORS[ann.sector], fontWeight: 600 }}>{ann.sector}</span>
                    <span className={ann.isUp ? 'up' : 'dn'}>{ann.isUp ? ' 主导上涨' : ' 主导下跌'}</span>
                  </div>
                  <div className="rot-event-sub">${window.fmtPrice(ann.value)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.RotationPage = RotationPage;
