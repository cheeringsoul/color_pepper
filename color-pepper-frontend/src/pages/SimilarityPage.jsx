import { useState, useMemo, useEffect } from 'react';
import api from '../api';
import Sparkline from '../components/Sparkline';
import { fmtPrice } from '../utils';

const colors = ['#627eea','#f3ba2f','#9945ff','#e84142','#00ec97','#2a5ada','#0088cc','#28a0f0'];

export default function SimilarityPage({ symbols, onOpenSymbol, onSendToWatch }) {
  const [algo, setAlgo] = useState('pearson');
  const [tf, setTf] = useState('4h');
  const [period, setPeriod] = useState('30d');
  const [minCorr, setMinCorr] = useState(50);
  const [refSym, setRefSym] = useState('BTC');
  const [active, setActive] = useState(new Set(['ETH','BNB','SOL','AVAX']));
  const [hidden, setHidden] = useState(new Set());
  const [sim, setSim] = useState(null);

  useEffect(() => {
    api.getSimilarity(refSym, algo, period, minCorr / 100).then(setSim);
  }, [refSym, algo, period, minCorr]);

  const palette = useMemo(() => {
    if (!sim) return {};
    const p = {};
    sim.candidates.forEach((c, i) => { p[c.sym] = colors[i % colors.length]; });
    return p;
  }, [sim]);

  const filtered = useMemo(() => {
    if (!sim) return [];
    return sim.candidates.filter(c => c.corr * 100 >= minCorr);
  }, [sim, minCorr]);

  function toggleActive(sym) {
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
      return next;
    });
  }

  function toggleHidden(sym) {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
      return next;
    });
  }

  // build overlay svg
  const W = 1000, H = 440;
  const padL = 50, padR = 16, padT = 16, padB = 30;
  const innerW = W - padL - padR, innerH = H - padT - padB;

  const allSeries = useMemo(() => {
    if (!sim) return [];
    const series = [{ sym: refSym, color: 'var(--accent)', norm: sim.ref.norm, ref: true }];
    sim.candidates.filter(c => active.has(c.sym) && !hidden.has(c.sym)).forEach(c => {
      series.push({ sym: c.sym, color: palette[c.sym], norm: c.norm, corr: c.corr });
    });
    return series;
  }, [sim, refSym, active, hidden, palette]);

  const allVals = useMemo(() => allSeries.flatMap(s => s.norm), [allSeries]);
  const minY = allVals.length ? Math.min(...allVals, -2) : -2;
  const maxY = allVals.length ? Math.max(...allVals, 2) : 2;
  const yRange = maxY - minY || 1;
  const yOf = v => padT + (1 - (v - minY) / yRange) * innerH;
  const xOf = (i, len) => padL + (i / (len - 1)) * innerW;

  const yTicks = [minY, minY + yRange * 0.25, minY + yRange * 0.5, minY + yRange * 0.75, maxY];
  const zeroY = yOf(0);

  return (
    <div className="page sim-page">
      <div className="sim-head">
        <div>
          <h1>走势相似</h1>
          <p>选定参考币 · 算法识别走势相近的标的 · 归一化叠加对比</p>
        </div>
      </div>

      <div className="sim-controls">
        <div className="card sim-ctrl-card">
          <div className="row">
            <div className="lbl">参考币</div>
            <div className="ref-picker" style={{ flex: 1 }}>
              <div className="sym-bubble" style={{ background: '#f7931a' }}>B</div>
              <div className="nm">{refSym}<span className="dim" style={{ fontWeight: 400 }}>/USDT</span></div>
              <div className="ch">▾ 切换</div>
            </div>
          </div>
          <div className="row">
            <div className="lbl">周期</div>
            {['15m','1h','4h','1d'].map(t => (
              <button key={t} className={`chip ${tf === t ? 'active' : ''}`} onClick={() => setTf(t)}>{t}</button>
            ))}
          </div>
          <div className="row">
            <div className="lbl">区间</div>
            {['7d','30d','90d'].map(t => (
              <button key={t} className={`chip ${period === t ? 'active' : ''}`} onClick={() => setPeriod(t)}>{t}</button>
            ))}
          </div>
          <div className="row">
            <div className="lbl">最小相关</div>
            <input type="range" min="0" max="100" value={minCorr} onChange={e => setMinCorr(+e.target.value)} />
            <span className="val">{(minCorr / 100).toFixed(2)}</span>
          </div>
        </div>

        <div className="card sim-ctrl-card">
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 8 }}>相似度算法</div>
          <div className="algo-options">
            <div className={`algo-opt ${algo === 'pearson' ? 'sel' : ''}`} onClick={() => setAlgo('pearson')}>
              <div className="radio"></div>
              <div>皮尔森相关系数</div>
              <span className="meta">线性相关</span>
            </div>
            <div className={`algo-opt ${algo === 'dtw' ? 'sel' : ''}`} onClick={() => setAlgo('dtw')}>
              <div className="radio"></div>
              <div>DTW 时间规整</div>
              <span className="meta">形态匹配</span>
            </div>
            <div className={`algo-opt ${algo === 'euclid' ? 'sel' : ''}`} onClick={() => setAlgo('euclid')}>
              <div className="radio"></div>
              <div>欧氏距离</div>
              <span className="meta">归一化后</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main overlay chart */}
      <div className="card sim-overlay-card">
        <div className="card-head">
          <div>
            <div className="card-title">参考 vs 相似币 · 归一化叠加</div>
            <div className="card-sub">所有曲线归一化为相对起点的百分比变化 · 点击图例可隐藏单条</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {onSendToWatch && (
              <button className="btn" onClick={() => {
                const syms = [refSym, ...Array.from(active).filter(s => !hidden.has(s))];
                onSendToWatch(syms);
              }}>发送到多币观察</button>
            )}
          </div>
        </div>

        <svg className="sim-overlay-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {/* grid */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={padL} y1={yOf(t)} x2={W - padR} y2={yOf(t)} className="grid" />
              <text x={padL - 8} y={yOf(t) + 3} className="axis-label" textAnchor="end">{t.toFixed(1)}%</text>
            </g>
          ))}
          {/* zero baseline */}
          <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} className="baseline" />
          {/* series */}
          {allSeries.map((s, i) => {
            const path = s.norm.map((v, j) => `${xOf(j, s.norm.length).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
            return (
              <polyline key={i} className={`series ${s.ref ? 'ref' : ''}`} points={path} stroke={s.color} opacity={s.ref ? 1 : 0.85} />
            );
          })}
        </svg>

        <div className="sim-legend">
          <div className="lg-chip ref">
            <div className="swatch" style={{ background: 'var(--accent)' }}></div>
            <div className="lg-name">{refSym}</div>
            <div className="lg-corr">参考</div>
          </div>
          {sim && sim.candidates.filter(c => active.has(c.sym)).map(c => (
            <div key={c.sym} className={`lg-chip ${hidden.has(c.sym) ? 'off' : ''}`} onClick={() => toggleHidden(c.sym)}>
              <div className="swatch" style={{ background: palette[c.sym] }}></div>
              <div className="lg-name">{c.sym}</div>
              <div className="lg-corr">{c.corr.toFixed(2)}</div>
              <button className="x" onClick={(e) => { e.stopPropagation(); toggleActive(c.sym); }}>×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Candidates pool */}
      <div className="card sim-candidates">
        <div className="card-head">
          <div>
            <div className="card-title">候选池 · {filtered.length} 个匹配</div>
            <div className="card-sub">点击加入或移出叠加图 · 也可批量加入多图监控</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
          </div>
        </div>
        <div className="candidates-grid">
          {filtered.map(c => {
            const sym = symbols.find(s => s.sym === c.sym);
            return (
              <div key={c.sym} className={`cand-card ${active.has(c.sym) ? 'added' : ''}`} onClick={() => toggleActive(c.sym)}>
                <div className="ch">
                  <div className="sym-bubble sm" style={{ background: c.color }}>{c.sym[0]}</div>
                  <div className="nm">{c.sym}</div>
                  <div className={`corr ${c.corr >= 0.7 ? 'high' : ''}`}>r={c.corr.toFixed(2)}</div>
                </div>
                <div className="mini">
                  <Sparkline data={c.norm} color={palette[c.sym]} fill width={180} height={36} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--text-3)' }}>
                  <span>{sym ? sym.name : c.sym}</span>
                  <span className={c.norm[c.norm.length - 1] >= 0 ? 'up' : 'dn'}>
                    {c.norm[c.norm.length - 1] >= 0 ? '+' : ''}{c.norm[c.norm.length - 1].toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
