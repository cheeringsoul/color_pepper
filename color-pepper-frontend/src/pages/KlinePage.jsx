import { useState, useMemo, useEffect, useRef } from 'react';
import api from '../api';
import TradingChart from '../components/TradingChart';
import DrawingCanvas from '../components/DrawingCanvas';
import BasisPanel from '../components/BasisPanel';
import DepthChart from '../components/DepthChart';
import { fmtPrice } from '../utils';

const WS_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/^http/, 'ws');

export default function KlinePage({ symbols, currentSym, setCurrentSym, favorites, toggleFav, onAskAgent }) {
  const [tab, setTab] = useState('spot');
  const [tf, setTf] = useState('1h');
  const [search, setSearch] = useState('');
  const [obMode, setObMode] = useState('split');
  const [chartView, setChartView] = useState('chart');
  const [activeIndicators, setActiveIndicators] = useState({ ma: true, boll: false, macd: false, rsi: false });
  const tradingChartRef = useRef(null);
  const [klines, setKlines] = useState([]);
  const [orderBook, setOrderBook] = useState({ asks: [], bids: [], maxTotal: 1, midPrice: 0 });

  const symbol = symbols.find(s => s.sym === currentSym) || symbols[0];

  const filtered = useMemo(
    () => symbols.filter(s =>
      !search || s.sym.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
    ),
    [symbols, search]
  );

  useEffect(() => {
    api.getKlines(currentSym, tf).then(setKlines);
  }, [currentSym, tf]);

  useEffect(() => {
    if (!WS_BASE) return;
    const ws = new WebSocket(`${WS_BASE}/ws/kline?symbol=${currentSym}&interval=${tf}`);
    ws.onmessage = (e) => {
      try {
        const candle = JSON.parse(e.data);
        if (candle.type !== 'kline') return;
        setKlines(prev => {
          if (!prev.length) return prev;
          const last = prev[prev.length - 1];
          if (candle.time === last.time) {
            return [...prev.slice(0, -1), candle];
          } else if (candle.time > last.time) {
            return [...prev.slice(1), candle];
          }
          return prev;
        });
      } catch {}
    };
    ws.onerror = () => ws.close();
    return () => ws.close();
  }, [currentSym, tf]);

  useEffect(() => {
    api.getOrderBook(currentSym).then(setOrderBook);
  }, [currentSym]);

  useEffect(() => {
    if (!WS_BASE) return;
    const ws = new WebSocket(`${WS_BASE}/ws/orderbook?symbol=${currentSym}`);
    ws.onmessage = (e) => {
      try {
        const ob = JSON.parse(e.data);
        if (ob.type !== 'orderbook') return;
        setOrderBook(ob);
      } catch {}
    };
    ws.onerror = () => ws.close();
    return () => ws.close();
  }, [currentSym]);

  function toggleIndicator(key) {
    setActiveIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const chartIndicators = useMemo(() => {
    const ind = {};
    if (activeIndicators.ma) ind.ma = [7, 25, 99];
    if (activeIndicators.boll) ind.boll = true;
    if (activeIndicators.macd) ind.macd = true;
    if (activeIndicators.rsi) ind.rsi = true;
    return ind;
  }, [activeIndicators]);

  const buyRatio = useMemo(() => {
    const totalBid = orderBook.bids.reduce((s, r) => s + r.qty, 0);
    const totalAsk = orderBook.asks.reduce((s, r) => s + r.qty, 0);
    const sum = totalBid + totalAsk;
    return sum > 0 ? Math.round((totalBid / sum) * 100) : 50;
  }, [orderBook]);

  return (
    <div className="page kline-page">
      {/* Left: symbol list */}
      <aside className="kp-symbols">
        <div className="kps-tabs-row">
          <button className={`kps-tab ${tab === 'spot' ? 'active' : ''}`} onClick={() => setTab('spot')}>现货</button>
          <button className={`kps-tab ${tab === 'perp' ? 'active' : ''}`} onClick={() => setTab('perp')}>合约</button>
          <button className={`kps-tab ${tab === 'opt' ? 'active' : ''}`} onClick={() => setTab('opt')}>期权</button>
          <button className={`kps-tab ${tab === 'dex' ? 'active' : ''}`} onClick={() => setTab('dex')}>DEX</button>
        </div>
        <div className="kps-search">
          <span style={{ color: 'var(--text-3)' }}>&#x2315;</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索币对" />
        </div>
        <div className="kps-filters">
          <button className="chip active">USDT</button>
          <button className="chip">USDC</button>
          <button className="chip">BTC</button>
          <button className="chip">ETH</button>
        </div>
        <div className="kps-thead">
          <div>名称</div>
          <div className="right">最新价</div>
          <div className="right">涨跌</div>
        </div>
        <div className="kps-list">
          {filtered.map(s => (
            <div key={s.sym} className={`kps-row ${s.sym === symbol.sym ? 'active' : ''}`}
              onClick={() => setCurrentSym(s.sym)}>
              <div className="nm">
                <div className="sym-bubble sm" style={{ background: s.color }}>{s.sym[0]}</div>
                <div>
                  <div className="ticker">{s.sym}<span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/USDT</span></div>
                  <span className="vol">${(s.vol / 1e9).toFixed(2)}B</span>
                </div>
              </div>
              <div className="price">{fmtPrice(s.price)}</div>
              <div className={`chg ${s.chg >= 0 ? 'up' : 'dn'}`}>
                {s.chg >= 0 ? '+' : ''}{s.chg.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Middle: chart + trade */}
      <section className="kp-main">
        <div className="kp-head">
          <div className="kp-symbol">
            <button className={`fav-btn ${favorites.has(symbol.sym) ? 'on' : ''}`}
              onClick={() => toggleFav(symbol.sym)}>{favorites.has(symbol.sym) ? '★' : '☆'}</button>
            <div className="sym-bubble lg" style={{ background: symbol.color }}>{symbol.sym[0]}</div>
            <div className="meta">
              <div className="kp-pair">{symbol.sym}<span className="quote">/USDT</span><span className="kp-tag">现货</span></div>
              <div className="dim" style={{ fontSize: 11 }}>{symbol.name}</div>
            </div>
          </div>
          <div className="kp-price-block">
            <div className={`kp-last ${symbol.chg >= 0 ? 'up' : 'dn'}`}>
              {fmtPrice(symbol.price)}
            </div>
            <div className={`kp-chg ${symbol.chg >= 0 ? 'up' : 'dn'}`}>
              {symbol.chg >= 0 ? '+' : ''}{(symbol.price * symbol.chg / 100).toFixed(2)} ({symbol.chg >= 0 ? '+' : ''}{symbol.chg.toFixed(2)}%)
            </div>
          </div>
          <div className="kp-stats">
            <div><span className="k">24h 高</span><span className="v">{fmtPrice(symbol.price * 1.04)}</span></div>
            <div><span className="k">24h 低</span><span className="v">{fmtPrice(symbol.price * 0.96)}</span></div>
            <div><span className="k">24h 量</span><span className="v">{(symbol.vol / 1e9).toFixed(2)}B</span></div>
          </div>
          <button className="ask-agent" onClick={() => onAskAgent(symbol.sym)}>{'✦'} 问 Agent</button>
        </div>

        <div className="kp-tabs">
          <button className={`kp-tab ${chartView === 'chart' ? 'active' : ''}`} onClick={() => setChartView('chart')}>图表</button>
          <button className={`kp-tab ${chartView === 'basis' ? 'active' : ''}`} onClick={() => setChartView('basis')}>价差</button>
          <button className={`kp-tab ${chartView === 'depth' ? 'active' : ''}`} onClick={() => setChartView('depth')}>深度</button>
          {chartView === 'chart' && (
            <>
              <div className="ind-toggles">
                {[
                  { key: 'ma', label: 'MA' },
                  { key: 'boll', label: 'BOLL' },
                  { key: 'macd', label: 'MACD' },
                  { key: 'rsi', label: 'RSI' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`ind-btn ${activeIndicators[key] ? 'active' : ''}`}
                    onClick={() => toggleIndicator(key)}
                  >{label}</button>
                ))}
              </div>
              <div className="tf-group">
                {['1m', '5m', '15m', '1h', '4h', '1d', '1w'].map(t => (
                  <button key={t} className={`tf ${tf === t ? 'active' : ''}`} onClick={() => setTf(t)}>{t}</button>
                ))}
              </div>
            </>
          )}
        </div>

        {chartView === 'chart' && (
          <div className="kp-chart-wrap">
            <div className="tv-chart-legends">
              {activeIndicators.ma && (
                <div className="ind-legend-row">
                  <span className="ind-legend-item" style={{ color: '#f5c842' }}>MA(7)</span>
                  <span className="ind-legend-item" style={{ color: '#6ea8ff' }}>MA(25)</span>
                  <span className="ind-legend-item" style={{ color: '#b48cff' }}>MA(99)</span>
                </div>
              )}
              {activeIndicators.boll && (
                <span className="ind-legend-item" style={{ color: '#f5c842' }}>BOLL(20,2)</span>
              )}
              {activeIndicators.macd && (
                <span className="ind-legend-item" style={{ color: '#5e6473' }}>MACD(12,26,9)</span>
              )}
              {activeIndicators.rsi && (
                <span className="ind-legend-item" style={{ color: '#5e6473' }}>RSI(14)</span>
              )}
            </div>
            <TradingChart ref={tradingChartRef} klines={klines} symbol={currentSym} indicators={chartIndicators} />
            <DrawingCanvas chartRef={tradingChartRef} symbol={currentSym} />
          </div>
        )}

        {chartView === 'basis' && (
          <div className="kp-exchange-wrap">
            <BasisPanel currentSym={currentSym} symbol={symbol} />
          </div>
        )}

        {chartView === 'depth' && (
          <div className="kp-depth-wrap">
            <DepthChart symbol={symbol} orderBook={orderBook} />
          </div>
        )}

      </section>

      {/* Right: orderbook */}
      <aside className="kp-side">
        <div className="kps-tabs-row">
          <button className="kps-tab active">订单簿</button>
          <button className="kps-tab">最新成交</button>
        </div>
        <div className="ob-controls">
          <div className="ob-mode">
            <button className={`om ${obMode === 'split' ? 'active' : ''}`} onClick={() => setObMode('split')}><span className="om-ic split"></span></button>
            <button className={`om ${obMode === 'bid' ? 'active' : ''}`} onClick={() => setObMode('bid')}><span className="om-ic green"></span></button>
            <button className={`om ${obMode === 'ask' ? 'active' : ''}`} onClick={() => setObMode('ask')}><span className="om-ic red"></span></button>
          </div>
          <select className="ob-step" defaultValue="0.1">
            <option>0.01</option><option>0.1</option><option>1</option><option>10</option>
          </select>
        </div>
        <div className="orderbook">
          <div className="ob-head">
            <div>价格</div>
            <div className="right">数量</div>
            <div className="right">合计</div>
          </div>
          {obMode !== 'bid' && (
            <div className="ob asks">
              {orderBook.asks.map((r, i) => (
                <div key={i} className="ob-row ask">
                  <div className="bar" style={{ width: `${(r.total / orderBook.maxTotal) * 100}%` }}></div>
                  <span className="px ask">{fmtPrice(r.price)}</span>
                  <span className="qty">{r.qty.toFixed(3)}</span>
                  <span className="total">{r.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="ob-mid">
            <span className={symbol.chg >= 0 ? 'up' : 'dn'}>
              {fmtPrice(symbol.price)} {symbol.chg >= 0 ? '↑' : '↓'}
            </span>
            <span className="dim" style={{ fontSize: 10, fontFamily: 'var(--mono)' }}>{'≈'} ${fmtPrice(symbol.price)}</span>
          </div>
          {obMode !== 'ask' && (
            <div className="ob bids">
              {orderBook.bids.map((r, i) => (
                <div key={i} className="ob-row bid">
                  <div className="bar" style={{ width: `${(r.total / orderBook.maxTotal) * 100}%` }}></div>
                  <span className="px bid">{fmtPrice(r.price)}</span>
                  <span className="qty">{r.qty.toFixed(3)}</span>
                  <span className="total">{r.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="ob-summary">
            <div className="obs-bar">
              <div className="obs-fill bid" style={{ width: `${buyRatio}%` }}></div>
              <div className="obs-fill ask" style={{ width: `${100 - buyRatio}%` }}></div>
            </div>
            <div className="obs-row"><span className="up">B {buyRatio}%</span><span className="dn">{100 - buyRatio}% S</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
