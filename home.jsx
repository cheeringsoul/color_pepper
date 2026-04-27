// ===== Home page =====
const { useState: useStateH, useMemo: useMemoH } = React;

function HomePage({ data, onOpenSymbol }) {
  const [tab, setTab] = useStateH('all');
  const [favorites, setFavorites] = useStateH(new Set(['BTC', 'ETH', 'SOL']));
  const [moversTab, setMoversTab] = useStateH('gain');

  function toggleFav(sym) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
      return next;
    });
  }

  const symbols = data.SYMBOLS;
  const filtered = useMemoH(() => {
    if (tab === 'fav') return symbols.filter(s => favorites.has(s.sym));
    if (tab === 'gainers') return [...symbols].sort((a, b) => b.chg - a.chg);
    if (tab === 'losers') return [...symbols].sort((a, b) => a.chg - b.chg);
    return symbols;
  }, [tab, favorites, symbols]);

  const movers = useMemoH(() => {
    if (moversTab === 'gain') return [...symbols].sort((a, b) => b.chg - a.chg).slice(0, 6);
    if (moversTab === 'loss') return [...symbols].sort((a, b) => a.chg - b.chg).slice(0, 6);
    return [...symbols].sort((a, b) => b.vol - a.vol).slice(0, 6);
  }, [moversTab, symbols]);

  return (
    <div className="page home">
      <div className="home-head">
        <div className="home-title">
          <h1>市场总览</h1>
          <p>关注板块轮动 · 发现强势标的 · 实时跟踪自选</p>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">总市值</div>
          <div className="kpi-value">$2.67T</div>
          <div className="kpi-foot"><span className="pill up">+1.4%</span><span className="dim">24h</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">24h 量</div>
          <div className="kpi-value">$76.2B</div>
          <div className="kpi-foot"><span className="pill up">+12%</span><span className="dim">vs 7d 均值</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">BTC 主导率</div>
          <div className="kpi-value">58.1%</div>
          <div className="kpi-foot"><span className="pill flat">−0.2pp</span><span className="dim">7d</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">恐慌贪婪指数</div>
          <div className="kpi-value">72</div>
          <div className="kpi-foot"><span className="pill up">贪婪</span><span className="dim">+8 vs 昨日</span></div>
        </div>
      </div>

      <div className="home-grid">
        <SectorRotationTimeline rotation={data.rotation} />
        <TopMovers movers={movers} tab={moversTab} setTab={setMoversTab} onOpen={onOpenSymbol} data={data} />
      </div>

      <div className="card market-card">
        <div className="market-toolbar">
          <div className="toggle-group">
            <button className={`tg-item ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>全部</button>
            <button className={`tg-item ${tab === 'fav' ? 'active' : ''}`} onClick={() => setTab('fav')}>自选</button>
            <button className={`tg-item ${tab === 'gainers' ? 'active' : ''}`} onClick={() => setTab('gainers')}>涨幅榜</button>
            <button className={`tg-item ${tab === 'losers' ? 'active' : ''}`} onClick={() => setTab('losers')}>跌幅榜</button>
          </div>
          <span className="dim" style={{ fontSize: 11 }}>{filtered.length} 个标的</span>
        </div>

        <div className="mkt-table">
          <div className="mkt-thead">
            <div></div>
            <div>名称</div>
            <div className="right">最新价</div>
            <div className="right">24h 涨跌</div>
            <div className="right">24h 走势</div>
            <div>24h 价格区间</div>
            <div className="right">市值</div>
            <div className="right">操作</div>
          </div>
          {filtered.slice(0, 12).map(s => {
            const lo = s.price * 0.96, hi = s.price * 1.04;
            const markerPct = ((s.price - lo) / (hi - lo)) * 100;
            const trend = s.chg / 5;
            const spark = data.spark(s.sym.charCodeAt(0) + s.sym.charCodeAt(1), 30, trend);
            return (
              <div key={s.sym} className="mkt-trow" onClick={() => onOpenSymbol(s.sym)}>
                <button className={`fav-btn ${favorites.has(s.sym) ? 'on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFav(s.sym); }}>
                  {favorites.has(s.sym) ? '★' : '☆'}
                </button>
                <div className="sym-cell">
                  <div className="sym-bubble" style={{ background: s.color }}>{s.sym[0]}</div>
                  <div className="name-block">
                    <div className="ticker">{s.sym}<span className="quote"> /USDT</span></div>
                    <div className="full-name">{s.name}</div>
                  </div>
                </div>
                <div className="right num" style={{ fontSize: 13 }}>{window.fmtPrice(s.price)}</div>
                <div className="right">
                  <span className={`pill ${s.chg >= 0 ? 'up' : 'dn'}`}>
                    {s.chg >= 0 ? '+' : ''}{s.chg.toFixed(2)}%
                  </span>
                </div>
                <div style={{ height: 32 }}>
                  <Sparkline data={spark} color={s.chg >= 0 ? 'var(--up)' : 'var(--dn)'} fill />
                </div>
                <div>
                  <div className="range-bar">
                    <div className="marker" style={{ left: `${markerPct}%` }} />
                  </div>
                  <div className="endpoints">
                    <span>{window.fmtPrice(lo)}</span>
                    <span>{window.fmtPrice(hi)}</span>
                  </div>
                </div>
                <div className="right num" style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  ${(s.mcap / 1e9).toFixed(1)}B
                </div>
                <div className="right">
                  <button className="btn ghost" onClick={(e) => { e.stopPropagation(); onOpenSymbol(s.sym); }}>查看</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectorRotationTimeline({ rotation }) {
  // generate day labels (last 7 days)
  const days = useMemoH(() => {
    const out = [];
    const today = new Date('2026-04-27');
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }
    return out;
  }, []);

  function colorFor(v) {
    const max = 8;
    const t = Math.max(-1, Math.min(1, v / max));
    if (t >= 0) {
      // upGreen: scale opacity
      const a = 0.30 + t * 0.65;
      return `rgba(45,212,164,${a})`;
    } else {
      const a = 0.30 + (-t) * 0.65;
      return `rgba(244,113,113,${a})`;
    }
  }

  return (
    <div className="card rotation-tl">
      <div className="tl-head">
        <div>
          <div className="card-title">板块轮动 · 7日时间轴</div>
          <div className="card-sub">每格代表板块当日相对大盘的强弱 · 可观察资金切换轨迹</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="chip">7d</button>
          <button className="chip active">14d</button>
          <button className="chip">30d</button>
        </div>
      </div>

      <div className="tl-grid">
        <div></div>
        {days.map(d => <div key={d} className="col-label">{d}</div>)}
        {rotation.map(r => (
          <React.Fragment key={r.sector}>
            <div className="row-label">{r.sector}</div>
            {r.cells.map((v, i) => (
              <div key={i} className="tl-cell" style={{ background: colorFor(v) }}>
                <span className="pct">{v >= 0 ? '+' : ''}{v.toFixed(1)}</span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, fontSize: 11, color: 'var(--text-3)' }}>
        <span>弱</span>
        <div style={{ display: 'flex', height: 10, width: 180, borderRadius: 3, overflow: 'hidden' }}>
          {[-8,-5,-3,-1,0,1,3,5,8].map((v,i) => (
            <div key={i} style={{ flex: 1, background: colorFor(v) }} />
          ))}
        </div>
        <span>强</span>
        <span style={{ marginLeft: 'auto' }}>近 3 日热点：<span style={{ color: 'var(--up)', fontWeight: 600 }}>Meme</span> · <span style={{ color: 'var(--up)', fontWeight: 600 }}>AI</span></span>
      </div>
    </div>
  );
}

function TopMovers({ movers, tab, setTab, onOpen, data }) {
  return (
    <div className="card" style={{ padding: '18px 4px 12px 4px' }}>
      <div style={{ padding: '0 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="card-title">领涨 / 领跌</div>
          <div className="card-sub">点击进入 K 线详情</div>
        </div>
        <div className="toggle-group" style={{ padding: 2 }}>
          <button className={`tg-item ${tab === 'gain' ? 'active' : ''}`} onClick={() => setTab('gain')}>领涨</button>
          <button className={`tg-item ${tab === 'loss' ? 'active' : ''}`} onClick={() => setTab('loss')}>领跌</button>
          <button className={`tg-item ${tab === 'vol' ? 'active' : ''}`} onClick={() => setTab('vol')}>成交</button>
        </div>
      </div>

      <div className="movers">
        {movers.map((s, i) => {
          const trend = s.chg / 4;
          const spark = data.spark(s.sym.charCodeAt(0) * 7 + i, 24, trend);
          return (
            <div key={s.sym} className="mover-row" onClick={() => onOpen(s.sym)}>
              <div className="rank">#{i + 1}</div>
              <div className="sym-bubble sm" style={{ background: s.color }}>{s.sym[0]}</div>
              <div className="name">
                {s.sym}<span className="quote" style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}> /USDT</span>
                <span className="sub">{s.sector}</span>
              </div>
              <div className="price">${window.fmtPrice(s.price)}</div>
              <div className="spark">
                <Sparkline data={spark} color={s.chg >= 0 ? 'var(--up)' : 'var(--dn)'} fill width={80} height={24} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`pill lg ${s.chg >= 0 ? 'up' : 'dn'}`}>
                  {s.chg >= 0 ? '+' : ''}{s.chg.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.HomePage = HomePage;
