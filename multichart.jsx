// ===== 多图监控 page =====
function MultiChartPage({ data, watchlist, setWatchlist, onOpenSymbol }) {
  const [cols, setCols] = React.useState(3);
  const [timeframe, setTimeframe] = React.useState('1h');
  const [layout, setLayout] = React.useState('candle'); // 'candle' | 'mini' | 'compare'
  const [showAdd, setShowAdd] = React.useState(false);
  const [showMA, setShowMA] = React.useState(true);

  const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];

  function removeSym(sym) {
    setWatchlist(watchlist.filter(s => s !== sym));
  }
  function addSym(sym) {
    if (!watchlist.includes(sym)) setWatchlist([...watchlist, sym]);
  }
  function clearAll() {
    if (confirm('清空所有观察标的？')) setWatchlist([]);
  }
  function moveSym(sym, dir) {
    const i = watchlist.indexOf(sym);
    const j = i + dir;
    if (j < 0 || j >= watchlist.length) return;
    const next = watchlist.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setWatchlist(next);
  }

  // Compare overlay mode: build normalized series for all watched symbols
  const compareData = React.useMemo(() => {
    if (layout !== 'compare') return null;
    return watchlist.map(sym => {
      const s = data.SYMBOLS.find(x => x.sym === sym);
      if (!s) return null;
      const candles = data.candles(s.sym.charCodeAt(0) * 13 + (s.sym.charCodeAt(1) || 0), 80, s.price, 0.018);
      const closes = candles.map(c => c.close);
      const first = closes[0];
      const norm = closes.map(v => (v / first - 1) * 100);
      return { sym: s.sym, color: s.color, name: s.name, norm, last: norm[norm.length - 1] };
    }).filter(Boolean);
  }, [watchlist, layout, data]);

  return (
    <div className="page mc-page">
      <div className="mc-toolbar">
        <div className="mc-toolbar-left">
          <div className="mc-title">
            <span className="mc-title-main">多图监控</span>
            <span className="mc-title-sub">{watchlist.length} 个标的</span>
          </div>
          <div className="seg">
            {TIMEFRAMES.map(tf => (
              <button key={tf} className={`seg-item ${timeframe === tf ? 'active' : ''}`} onClick={() => setTimeframe(tf)}>{tf}</button>
            ))}
          </div>
          <div className="seg">
            <button className={`seg-item ${layout === 'candle' ? 'active' : ''}`} onClick={() => setLayout('candle')}>蜡烛</button>
            <button className={`seg-item ${layout === 'mini' ? 'active' : ''}`} onClick={() => setLayout('mini')}>迷你</button>
            <button className={`seg-item ${layout === 'compare' ? 'active' : ''}`} onClick={() => setLayout('compare')}>叠加对比</button>
          </div>
        </div>
        <div className="mc-toolbar-right">
          {layout !== 'compare' && (
            <div className="seg">
              <span className="seg-label">列数</span>
              <button className={`seg-item ${cols === 2 ? 'active' : ''}`} onClick={() => setCols(2)}>2</button>
              <button className={`seg-item ${cols === 3 ? 'active' : ''}`} onClick={() => setCols(3)}>3</button>
              <button className={`seg-item ${cols === 4 ? 'active' : ''}`} onClick={() => setCols(4)}>4</button>
            </div>
          )}
          {layout === 'candle' && (
            <button className={`chip ${showMA ? 'active' : ''}`} onClick={() => setShowMA(!showMA)}>MA</button>
          )}
          <button className="btn-ghost" onClick={clearAll} disabled={!watchlist.length}>清空</button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ 添加标的</button>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="mc-empty">
          <div className="mc-empty-icon">▦</div>
          <div className="mc-empty-title">观察列表为空</div>
          <div className="mc-empty-sub">从「走势相似」批量添加候选标的，或手动添加常关注的币对</div>
          <div className="mc-empty-actions">
            <button className="btn-primary" onClick={() => setShowAdd(true)}>添加标的</button>
            <button className="btn-ghost" onClick={() => onOpenSymbol && onOpenSymbol('BTC')}>去 K 线页</button>
          </div>
        </div>
      ) : layout === 'compare' ? (
        <CompareOverlay data={compareData} />
      ) : (
        <div className="mc-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {watchlist.map((sym, i) => {
            const s = data.SYMBOLS.find(x => x.sym === sym);
            if (!s) return null;
            return (
              <ChartTile
                key={sym}
                symbol={s}
                data={data}
                timeframe={timeframe}
                showMA={showMA}
                cols={cols}
                mode={layout}
                isFirst={i === 0}
                isLast={i === watchlist.length - 1}
                onRemove={() => removeSym(sym)}
                onMoveLeft={() => moveSym(sym, -1)}
                onMoveRight={() => moveSym(sym, 1)}
                onOpen={() => onOpenSymbol && onOpenSymbol(sym)}
              />
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddSymbolModal
          data={data}
          watchlist={watchlist}
          onAdd={addSym}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

function ChartTile({ symbol, data, timeframe, showMA, cols, mode, isFirst, isLast, onRemove, onMoveLeft, onMoveRight, onOpen }) {
  const candles = React.useMemo(
    () => data.candles(symbol.sym.charCodeAt(0) * 13 + (symbol.sym.charCodeAt(1) || 0), 80, symbol.price, 0.018),
    [symbol.sym]
  );
  const closes = candles.map(c => c.close);
  const high = Math.max(...candles.map(c => c.high));
  const low = Math.min(...candles.map(c => c.low));
  const totalVol = candles.reduce((a, c) => a + c.volume, 0);
  const ma = computeMA(closes, 10);
  const chg = symbol.chg;

  const chartH = mode === 'mini' ? 80 : (cols === 4 ? 150 : cols === 3 ? 180 : 220);

  return (
    <div className={`mc-tile ${mode === 'mini' ? 'mini' : ''}`}>
      <div className="mc-tile-head">
        <button className="mc-tile-sym" onClick={onOpen} title="在 K 线页打开">
          <span className="dot" style={{ background: symbol.color }}></span>
          <span className="ticker">{symbol.sym}</span>
          <span className="quote">/USDT</span>
          <span className="open-arrow">↗</span>
        </button>
        <div className="mc-tile-price">
          <span className="num">${window.fmtPrice(symbol.price)}</span>
          <span className={`pill ${chg >= 0 ? 'up' : 'dn'}`}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</span>
        </div>
        <div className="mc-tile-actions">
          <button className="icon-btn-sm" onClick={onMoveLeft} disabled={isFirst} title="左移">‹</button>
          <button className="icon-btn-sm" onClick={onMoveRight} disabled={isLast} title="右移">›</button>
          <button className="icon-btn-sm danger" onClick={onRemove} title="移除">✕</button>
        </div>
      </div>
      {mode !== 'mini' ? (
        <React.Fragment>
          <div className="mc-tile-chart" style={{ height: chartH }}>
            <CandleChartCompact candles={candles} ma={showMA ? ma : null} maColor={symbol.color} />
          </div>
          <div className="mc-tile-foot">
            <Stat label="高" value={`$${window.fmtPrice(high)}`} />
            <Stat label="低" value={`$${window.fmtPrice(low)}`} />
            <Stat label="量" value={fmtCompact(totalVol)} />
            <Stat label="周期" value={timeframe} />
          </div>
        </React.Fragment>
      ) : (
        <div className="mc-tile-chart" style={{ height: chartH, padding: '4px 12px 8px' }}>
          <Sparkline data={closes} color={chg >= 0 ? 'var(--up)' : 'var(--dn)'} fill width={300} height={chartH - 12} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="mc-stat">
      <span className="lbl">{label}</span>
      <span className="val">{value}</span>
    </div>
  );
}

function fmtCompact(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(0);
}

function computeMA(arr, n) {
  const out = new Array(arr.length).fill(null);
  for (let i = n - 1; i < arr.length; i++) {
    let s = 0;
    for (let j = i - n + 1; j <= i; j++) s += arr[j];
    out[i] = s / n;
  }
  return out;
}

// Compact candle chart for tiles — uses viewBox so it scales to container
function CandleChartCompact({ candles, ma, maColor }) {
  const W = 600, H = 200;
  const padL = 4, padR = 48, padT = 8, padB = 8;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = max - min || 1;
  const cw = innerW / candles.length;
  const bodyW = Math.max(1.2, cw * 0.62);

  function y(v) { return padT + (1 - (v - min) / range) * innerH; }

  // 5 horizontal price gridlines
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const v = min + range * (i / 4);
    gridLines.push({ y: y(v), v });
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mc-svg">
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.y} x2={W - padR} y2={g.y} stroke="var(--line)" strokeDasharray="2 4" />
          <text x={W - padR + 4} y={g.y + 3} fontSize="10" fill="var(--text-3)" fontFamily="var(--mono)">
            {window.fmtPrice(g.v)}
          </text>
        </g>
      ))}
      {candles.map((c, i) => {
        const cx = padL + cw * (i + 0.5);
        const up = c.close >= c.open;
        const color = up ? 'var(--up)' : 'var(--dn)';
        const yo = y(c.open), yc = y(c.close);
        const yh = y(c.high), yl = y(c.low);
        const top = Math.min(yo, yc);
        const bh = Math.max(0.5, Math.abs(yo - yc));
        return (
          <g key={i}>
            <line x1={cx} y1={yh} x2={cx} y2={yl} stroke={color} strokeWidth="1" />
            <rect x={cx - bodyW / 2} y={top} width={bodyW} height={bh} fill={color} />
          </g>
        );
      })}
      {ma && (
        <polyline
          fill="none"
          stroke={maColor || 'var(--accent)'}
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity="0.85"
          points={ma.map((v, i) => v == null ? null : `${padL + cw * (i + 0.5)},${y(v)}`).filter(Boolean).join(' ')}
        />
      )}
    </svg>
  );
}

// Compare/overlay mode — all symbols on one chart, normalized to %
function CompareOverlay({ data }) {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const W = 1200, H = 520;
  const padL = 8, padR = 88, padT = 16, padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  if (!data || !data.length) return null;
  const allVals = data.flatMap(d => d.norm);
  const max = Math.max(...allVals);
  const min = Math.min(...allVals);
  const range = (max - min) || 1;
  const pad = range * 0.05;
  const yMin = min - pad, yMax = max + pad, yRange = yMax - yMin;
  const N = data[0].norm.length;
  function x(i) { return padL + (i / (N - 1)) * innerW; }
  function y(v) { return padT + (1 - (v - yMin) / yRange) * innerH; }

  const grids = [];
  for (let i = 0; i <= 5; i++) {
    const v = yMin + yRange * (i / 5);
    grids.push({ y: y(v), v });
  }
  const zeroY = y(0);

  const sorted = [...data].sort((a, b) => b.last - a.last);

  return (
    <div className="mc-compare">
      <div className="mc-compare-legend">
        {sorted.map(d => (
          <div key={d.sym} className="mc-compare-item">
            <span className="dot" style={{ background: d.color }}></span>
            <span className="sym">{d.sym}</span>
            <span className={`pill ${d.last >= 0 ? 'up' : 'dn'}`}>{d.last >= 0 ? '+' : ''}{d.last.toFixed(2)}%</span>
          </div>
        ))}
      </div>
      <div className="mc-compare-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mc-svg"
             onMouseMove={e => {
               const r = e.currentTarget.getBoundingClientRect();
               const xPx = (e.clientX - r.left) / r.width * W;
               const idx = Math.round(((xPx - padL) / innerW) * (N - 1));
               setHoverIdx(idx >= 0 && idx < N ? idx : null);
             }}
             onMouseLeave={() => setHoverIdx(null)}>
          {grids.map((g, i) => (
            <g key={i}>
              <line x1={padL} y1={g.y} x2={W - padR} y2={g.y} stroke="var(--line)" strokeDasharray="2 4" />
              <text x={W - padR + 6} y={g.y + 3} fontSize="11" fill="var(--text-3)" fontFamily="var(--mono)">
                {g.v >= 0 ? '+' : ''}{g.v.toFixed(1)}%
              </text>
            </g>
          ))}
          {zeroY > padT && zeroY < padT + innerH && (
            <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="var(--text-3)" strokeWidth="1" opacity="0.5" />
          )}
          {data.map(d => (
            <polyline
              key={d.sym}
              fill="none"
              stroke={d.color}
              strokeWidth="1.8"
              strokeLinejoin="round"
              opacity="0.92"
              points={d.norm.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
          ))}
          {hoverIdx != null && (
            <line x1={x(hoverIdx)} y1={padT} x2={x(hoverIdx)} y2={padT + innerH}
                  stroke="var(--text-2)" strokeDasharray="3 3" opacity="0.5" />
          )}
          {hoverIdx != null && data.map(d => (
            <circle key={d.sym} cx={x(hoverIdx)} cy={y(d.norm[hoverIdx])} r="3" fill={d.color} />
          ))}
        </svg>
        {hoverIdx != null && (
          <div className="mc-compare-tooltip">
            <div className="ttp-head">第 {hoverIdx + 1} 根</div>
            {[...data].sort((a, b) => b.norm[hoverIdx] - a.norm[hoverIdx]).map(d => (
              <div key={d.sym} className="ttp-row">
                <span className="dot" style={{ background: d.color }}></span>
                <span className="sym">{d.sym}</span>
                <span className={`val ${d.norm[hoverIdx] >= 0 ? 'up' : 'dn'}`}>
                  {d.norm[hoverIdx] >= 0 ? '+' : ''}{d.norm[hoverIdx].toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddSymbolModal({ data, watchlist, onAdd, onClose }) {
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('all');
  const [selected, setSelected] = React.useState(new Set());

  const sectors = ['全部', ...new Set(data.SYMBOLS.map(s => s.sector))];
  const tabFilter = tab === 'all' ? '全部' : tab;

  const filtered = data.SYMBOLS.filter(s => {
    if (tabFilter !== '全部' && s.sector !== tabFilter) return false;
    if (!q) return true;
    const Q = q.toUpperCase();
    return s.sym.includes(Q) || s.name.toUpperCase().includes(Q);
  });

  function toggle(sym) {
    const next = new Set(selected);
    if (next.has(sym)) next.delete(sym); else next.add(sym);
    setSelected(next);
  }
  function commit() {
    selected.forEach(s => onAdd(s));
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card add-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">添加观察标的</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="add-search">
          <span className="search-icon">⌕</span>
          <input autoFocus placeholder="搜索 BTC、Solana…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="add-tabs">
          {sectors.map(sec => (
            <button key={sec} className={`chip ${(tab === 'all' && sec === '全部') || tab === sec ? 'active' : ''}`}
                    onClick={() => setTab(sec === '全部' ? 'all' : sec)}>{sec}</button>
          ))}
        </div>
        <div className="add-list">
          {filtered.map(s => {
            const inList = watchlist.includes(s.sym);
            const sel = selected.has(s.sym);
            return (
              <div key={s.sym} className={`add-row ${inList ? 'in-list' : ''} ${sel ? 'sel' : ''}`}
                   onClick={() => !inList && toggle(s.sym)}>
                <input type="checkbox" checked={inList || sel} disabled={inList} readOnly />
                <span className="dot" style={{ background: s.color }}></span>
                <div className="nm">
                  <div className="ticker">{s.sym}<span className="quote">/USDT</span></div>
                  <div className="name">{s.name} · {s.sector}</div>
                </div>
                <div className="num">${window.fmtPrice(s.price)}</div>
                <span className={`pill ${s.chg >= 0 ? 'up' : 'dn'}`}>{s.chg >= 0 ? '+' : ''}{s.chg.toFixed(2)}%</span>
                {inList && <span className="in-tag">已添加</span>}
              </div>
            );
          })}
          {!filtered.length && <div className="add-empty">未找到匹配的标的</div>}
        </div>
        <div className="modal-foot">
          <span className="modal-foot-info">
            {selected.size > 0 ? `已选 ${selected.size} 个` : '勾选标的后批量添加'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={onClose}>取消</button>
            <button className="btn-primary" onClick={commit} disabled={!selected.size}>
              添加 {selected.size > 0 && `(${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
