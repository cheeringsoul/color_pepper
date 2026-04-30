import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import TradingChart from '../components/TradingChart';
import { fmtPrice } from '../utils';

function KlinePanel({ sym, symbolInfo, onRemove }) {
  const [tf, setTf] = useState('1h');
  const [klines, setKlines] = useState([]);

  useEffect(() => {
    api.getKlines(sym, tf).then(setKlines);
  }, [sym, tf]);

  return (
    <div className="mk-panel">
      <div className="mk-panel-head">
        <div className="mk-panel-sym">
          {symbolInfo && (
            <div className="sym-bubble sm" style={{ background: symbolInfo.color }}>{sym[0]}</div>
          )}
          <span className="mk-pair">{sym}<span className="quote">/USDT</span></span>
          {symbolInfo && (
            <span className={`mk-chg ${symbolInfo.chg >= 0 ? 'up' : 'dn'}`}>
              {symbolInfo.chg >= 0 ? '+' : ''}{symbolInfo.chg.toFixed(2)}%
            </span>
          )}
          {symbolInfo && (
            <span className="mk-price">{fmtPrice(symbolInfo.price)}</span>
          )}
        </div>
        <div className="mk-panel-actions">
          <div className="tf-group compact">
            {['15m', '1h', '4h', '1d'].map(t => (
              <button key={t} className={`tf ${tf === t ? 'active' : ''}`} onClick={() => setTf(t)}>{t}</button>
            ))}
          </div>
          <button className="mk-remove" onClick={() => onRemove(sym)} title="移除">×</button>
        </div>
      </div>
      <div className="mk-panel-chart">
        <TradingChart klines={klines} symbol={sym} />
      </div>
    </div>
  );
}

export default function MultiKlinePage({ symbols }) {
  const [panels, setPanels] = useState(['BTC', 'ETH']);
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = symbols.filter(s =>
    !panels.includes(s.sym) &&
    (s.sym.toLowerCase().includes(input.toLowerCase()) || s.name.toLowerCase().includes(input.toLowerCase()))
  );

  const addSymbol = useCallback((sym) => {
    if (!panels.includes(sym)) {
      setPanels(prev => [...prev, sym]);
    }
    setInput('');
    setShowDropdown(false);
  }, [panels]);

  const removeSymbol = useCallback((sym) => {
    setPanels(prev => prev.filter(s => s !== sym));
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filtered.length > 0) {
      addSymbol(filtered[0].sym);
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setInput('');
    }
  };

  return (
    <div className="page mk-page">
      <div className="mk-head">
        <div>
          <h1>多币观察</h1>
          <p>同时观察多个币种K线走势，快速对比行情</p>
        </div>
        <div className="mk-add-wrap">
          <div className="mk-add-input">
            <span style={{ color: 'var(--text-3)' }}>+</span>
            <input
              value={input}
              onChange={e => { setInput(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder="输入币种添加面板，如 SOL、DOGE…"
            />
          </div>
          {showDropdown && input && filtered.length > 0 && (
            <div className="mk-dropdown">
              {filtered.slice(0, 8).map(s => (
                <div key={s.sym} className="mk-drop-item" onMouseDown={() => addSymbol(s.sym)}>
                  <div className="sym-bubble sm" style={{ background: s.color }}>{s.sym[0]}</div>
                  <span className="mk-drop-sym">{s.sym}</span>
                  <span className="mk-drop-name">{s.name}</span>
                  <span className={`mk-drop-chg ${s.chg >= 0 ? 'up' : 'dn'}`}>
                    {s.chg >= 0 ? '+' : ''}{s.chg.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mk-tags">
        {panels.map(sym => (
          <span key={sym} className="mk-tag">
            {sym}
            <button className="mk-tag-x" onClick={() => removeSymbol(sym)}>×</button>
          </span>
        ))}
        <span className="mk-tag-count">{panels.length} 个面板</span>
      </div>

      <div className="mk-grid">
        {panels.map(sym => (
          <KlinePanel
            key={sym}
            sym={sym}
            symbolInfo={symbols.find(s => s.sym === sym)}
            onRemove={removeSymbol}
          />
        ))}
      </div>

      {panels.length === 0 && (
        <div className="mk-empty">
          <div className="mk-empty-icon">📊</div>
          <div>暂无观察面板</div>
          <div className="mk-empty-sub">在上方搜索栏输入币种名称添加K线面板</div>
        </div>
      )}
    </div>
  );
}
