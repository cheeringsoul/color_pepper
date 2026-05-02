import { useState, useMemo, useEffect } from 'react';
import api from '../api';
import Sparkline from '../components/Sparkline';
import { fmtPrice } from '../utils';

export default function HomePage({ symbols, onOpenSymbol }) {
  const [tab, setTab] = useState('all');
  const [favorites, setFavorites] = useState(new Set(['BTC', 'ETH', 'SOL']));
  const [overview, setOverview] = useState(null);
  const [sparklines, setSparklines] = useState({});

  useEffect(() => {
    api.getMarketOverview().then(setOverview);
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'fav') return symbols.filter(s => favorites.has(s.sym));
    if (tab === 'gainers') return [...symbols].sort((a, b) => b.chg - a.chg);
    if (tab === 'losers') return [...symbols].sort((a, b) => a.chg - b.chg);
    return symbols;
  }, [tab, favorites, symbols]);

  const visible = useMemo(() => filtered.slice(0, 12), [filtered]);

  useEffect(() => {
    if (visible.length === 0) return;
    const toFetch = visible.filter(s => !sparklines[s.sym]);
    if (toFetch.length === 0) return;
    Promise.all(
      toFetch.map(s => api.getSparkline(s.sym, 30).then(data => [s.sym, data]))
    ).then(results => {
      setSparklines(prev => {
        const next = { ...prev };
        for (const [sym, data] of results) next[sym] = data;
        return next;
      });
    });
  }, [visible]);

  function toggleFav(sym) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
      return next;
    });
  }

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
          <div className="kpi-value">{overview ? overview.totalMcap.label : '$--'}</div>
          <div className="kpi-foot">
            <span className="pill up">{overview ? `+${overview.totalMcap.change}%` : '--'}</span>
            <span className="dim">24h</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">24h 量</div>
          <div className="kpi-value">{overview ? overview.volume24h.label : '$--'}</div>
          <div className="kpi-foot">
            <span className="pill up">{overview ? `+${overview.volume24h.change}%` : '--'}</span>
            <span className="dim">vs 7d 均值</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">BTC 主导率</div>
          <div className="kpi-value">{overview ? overview.btcDominance.label : '--%'}</div>
          <div className="kpi-foot">
            <span className="pill flat">{overview ? `${overview.btcDominance.change}pp` : '--'}</span>
            <span className="dim">7d</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">恐慌贪婪指数</div>
          <div className="kpi-value">{overview ? overview.fearGreed.label : '--'}</div>
          <div className="kpi-foot">
            <span className="pill up">{overview ? overview.fearGreed.sentiment : '--'}</span>
            <span className="dim">{overview ? `+${overview.fearGreed.change} vs 昨日` : '--'}</span>
          </div>
        </div>
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
          {visible.map(s => {
            const lo = s.low24h || s.price * 0.96;
            const hi = s.high24h || s.price * 1.04;
            const range = hi - lo || 1;
            const markerPct = Math.max(0, Math.min(100, ((s.price - lo) / range) * 100));
            const spark = sparklines[s.sym] || [];
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
                <div className="right num" style={{ fontSize: 13 }}>{fmtPrice(s.price)}</div>
                <div className="right">
                  <span className={`pill ${s.chg >= 0 ? 'up' : 'dn'}`}>
                    {s.chg >= 0 ? '+' : ''}{s.chg.toFixed(2)}%
                  </span>
                </div>
                <div style={{ height: 32 }}>
                  {spark.length > 0 && (
                    <Sparkline data={spark} color={s.chg >= 0 ? 'var(--up)' : 'var(--dn)'} fill />
                  )}
                </div>
                <div>
                  <div className="range-bar">
                    <div className="marker" style={{ left: `${markerPct}%` }} />
                  </div>
                  <div className="endpoints">
                    <span>{fmtPrice(lo)}</span>
                    <span>{fmtPrice(hi)}</span>
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
