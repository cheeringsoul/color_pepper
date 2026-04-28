// ===== Main app =====
function App() {
  const data = window.CPData;
  const [page, setPage] = React.useState('home');
  const [currentSym, setCurrentSym] = React.useState('BTC');
  const [favorites, setFavorites] = React.useState(new Set(['BTC', 'ETH', 'SOL']));
  const [toast, setToast] = React.useState(null);

  const [tweaks, setTweaks] = window.useTweaks
    ? window.useTweaks(/*EDITMODE-BEGIN*/{ "accent": "orange" }/*EDITMODE-END*/)
    : [{ accent: 'orange' }, () => {}];

  React.useEffect(() => {
    const map = { orange: '', red: 'red', green: 'green', blue: 'blue' };
    const v = map[tweaks.accent] || '';
    if (v) document.documentElement.setAttribute('data-accent', v);
    else document.documentElement.removeAttribute('data-accent');
  }, [tweaks.accent]);

  function toggleFav(sym) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
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
          <div className="brand-name">Color<span className="accent-dot">·</span>Pepper</div>
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
          <button className="icon-btn" title="刷新">↻</button>
          <button className="icon-btn" style={{ position: 'relative' }} title="提醒">
            🔔<span className="badge-dot"></span>
          </button>
          <button className="icon-btn" title="设置">⚙</button>
          <div className="avatar">A</div>
        </div>
      </header>

      {page === 'home' && <HomePage data={data} onOpenSymbol={openSymbol} />}
      {page === 'rotation' && <RotationPage data={data} onOpenSymbol={openSymbol} />}
      {page === 'kline' && (
        <KlinePage data={data} currentSym={currentSym} setCurrentSym={setCurrentSym}
          favorites={favorites} toggleFav={toggleFav} onAskAgent={askAgent} />
      )}
      {page === 'similarity' && (
        <SimilarityPage data={data} onOpenSymbol={openSymbol} />
      )}
      {page === 'agent' && <AgentPage data={data} contextSym={currentSym} onOpenSymbol={openSymbol} />}

      {toast && <div className="cp-toast">{toast}</div>}

      {window.TweaksPanel && (
        <window.TweaksPanel>
          <window.TweakSection title="主色">
            <window.TweakRadio
              value={tweaks.accent}
              onChange={v => setTweaks('accent', v)}
              options={[
                { value: 'orange', label: '橙' },
                { value: 'red', label: '红' },
                { value: 'green', label: '绿' },
                { value: 'blue', label: '蓝' },
              ]}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
