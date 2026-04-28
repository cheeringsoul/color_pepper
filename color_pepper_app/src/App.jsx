import { useState, useEffect } from 'react';
import api from './api';
import HomePage from './pages/HomePage';
import KlinePage from './pages/KlinePage';
import RotationPage from './pages/RotationPage';
import SimilarityPage from './pages/SimilarityPage';
import AgentPage from './pages/AgentPage';

export default function App() {
  const [page, setPage] = useState('home');
  const [currentSym, setCurrentSym] = useState('BTC');
  const [symbols, setSymbols] = useState([]);
  const [favorites, setFavorites] = useState(new Set(['BTC', 'ETH', 'SOL']));
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.getSymbols().then(setSymbols);
  }, []);

  function toggleFav(sym) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else next.add(sym);
      return next;
    });
  }

  function openSymbol(sym) {
    setCurrentSym(sym);
    setPage('kline');
  }

  function askAgent(sym) {
    setCurrentSym(sym);
    setPage('agent');
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo"></div>
          <div className="brand-name">
            Color<span className="accent-dot">·</span>Pepper
          </div>
        </div>
        <nav className="primary-nav">
          <button className={`pn-item ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>市场</button>
          <button className={`pn-item ${page === 'rotation' ? 'active' : ''}`} onClick={() => setPage('rotation')}>轮动</button>
          <button className={`pn-item ${page === 'kline' ? 'active' : ''}`} onClick={() => setPage('kline')}>K线</button>
          <button className={`pn-item ${page === 'similarity' ? 'active' : ''}`} onClick={() => setPage('similarity')}>走势相似</button>
          <button className={`pn-item ${page === 'agent' ? 'active' : ''}`} onClick={() => setPage('agent')}>Agent</button>
        </nav>
        <div className="search">
          <span className="search-icon">⌕</span>
          <input placeholder="搜索币对，例如 BTC、SOL/USDT…" />
          <span className="search-kbd">⌘K</span>
        </div>
        <div className="topbar-right">
          <button className="icon-btn" title="刷新" onClick={() => api.getSymbols().then(setSymbols)}>↻</button>
          <button className="icon-btn" style={{ position: 'relative' }} title="提醒">
            🔔<span className="badge-dot"></span>
          </button>
          <button className="icon-btn" title="设置">⚙</button>
          <div className="avatar">A</div>
        </div>
      </header>

      {page === 'home' && <HomePage symbols={symbols} onOpenSymbol={openSymbol} />}
      {page === 'rotation' && <RotationPage symbols={symbols} onOpenSymbol={openSymbol} />}
      {page === 'kline' && (
        <KlinePage
          symbols={symbols}
          currentSym={currentSym}
          setCurrentSym={setCurrentSym}
          favorites={favorites}
          toggleFav={toggleFav}
          onAskAgent={askAgent}
        />
      )}
      {page === 'similarity' && <SimilarityPage symbols={symbols} onOpenSymbol={openSymbol} />}
      {page === 'agent' && <AgentPage contextSym={currentSym} onOpenSymbol={openSymbol} />}

      {toast && <div className="cp-toast">{toast}</div>}
    </div>
  );
}
