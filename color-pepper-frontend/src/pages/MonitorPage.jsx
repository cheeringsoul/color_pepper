import { useState, useEffect, useCallback } from 'react';

const ALL_SYMS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX'];

function ts() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

const INITIAL_BOTS = [
  {
    id: 'basis', name: '价差监控', icon: '📊',
    desc: '期现价差超过阈值时告警，捕捉套利窗口',
    enabled: true,
    config: { symbols: ['BTC', 'ETH'], threshold: 50, unit: 'bps' },
    alerts: [
      { id: 1, time: '14:32:08', sym: 'BTC', msg: 'BTC 期现价差 +62bps，超阈值 50bps', level: 'warn' },
      { id: 2, time: '14:18:41', sym: 'ETH', msg: 'ETH 期现价差 +55bps，超阈值 50bps', level: 'warn' },
      { id: 3, time: '13:45:12', sym: 'BTC', msg: 'BTC 期现价差回落至 38bps，低于阈值', level: 'info' },
      { id: 4, time: '12:07:33', sym: 'ETH', msg: 'ETH 期现价差 +71bps，超阈值 50bps', level: 'critical' },
      { id: 5, time: '11:22:05', sym: 'BTC', msg: 'BTC 期现价差 +53bps，超阈值 50bps', level: 'warn' },
    ],
  },
  {
    id: 'funding', name: '资金费率监控', icon: '💰',
    desc: '资金费率异常偏高/偏低时告警，识别多空情绪',
    enabled: true,
    config: { symbols: ['BTC', 'ETH', 'SOL'], threshold: 0.03, unit: '%' },
    alerts: [
      { id: 1, time: '14:00:00', sym: 'SOL', msg: 'SOL 资金费率 +0.042%，超阈值 0.03%', level: 'warn' },
      { id: 2, time: '06:00:00', sym: 'ETH', msg: 'ETH 资金费率 -0.038%，低于 -0.03%', level: 'warn' },
      { id: 3, time: '22:00:01', sym: 'BTC', msg: 'BTC 资金费率 +0.010%，正常范围', level: 'info' },
    ],
  },
  {
    id: 'largeOrder', name: '大单监控', icon: '🐋',
    desc: '单笔成交超过阈值时告警，追踪主力动向',
    enabled: false,
    config: { symbols: ['BTC', 'ETH'], threshold: 500000, unit: '$' },
    alerts: [
      { id: 1, time: '14:28:17', sym: 'BTC', msg: 'BTC 大单买入 $1.2M @ 94,521', level: 'critical' },
      { id: 2, time: '13:55:44', sym: 'ETH', msg: 'ETH 大单卖出 $680K @ 3,201', level: 'warn' },
      { id: 3, time: '13:12:09', sym: 'BTC', msg: 'BTC 大单买入 $2.1M @ 94,388', level: 'critical' },
    ],
  },
  {
    id: 'breakout', name: '价格突破监控', icon: '🎯',
    desc: '价格突破关键支撑/阻力位时告警',
    enabled: true,
    config: {
      rules: [
        { sym: 'BTC', price: 95000, direction: 'above', label: '阻力位' },
        { sym: 'BTC', price: 92000, direction: 'below', label: '支撑位' },
        { sym: 'ETH', price: 3300, direction: 'above', label: '阻力位' },
      ],
    },
    alerts: [
      { id: 1, time: '14:15:22', sym: 'BTC', msg: 'BTC 触及 $95,000 阻力位（最高 $95,124）', level: 'critical' },
      { id: 2, time: '10:33:08', sym: 'ETH', msg: 'ETH 接近 $3,300 阻力位（当前 $3,287）', level: 'info' },
    ],
  },
];

const ALERT_TEMPLATES = {
  basis: (sym, t) => ({ sym, msg: `${sym} 期现价差 +${(t + Math.random() * 30).toFixed(0)}bps，超阈值 ${t}bps`, level: Math.random() > 0.7 ? 'critical' : 'warn' }),
  funding: (sym, t) => ({ sym, msg: `${sym} 资金费率 ${Math.random() > 0.5 ? '+' : '-'}${(t + Math.random() * 0.02).toFixed(4)}%，超阈值 ${t}%`, level: 'warn' }),
  largeOrder: (sym, t) => {
    const amt = (t + Math.random() * t).toFixed(0);
    const side = Math.random() > 0.5 ? '买入' : '卖出';
    return { sym, msg: `${sym} 大单${side} $${Number(amt).toLocaleString()}`, level: 'critical' };
  },
  breakout: (sym) => ({ sym, msg: `${sym} 突破关键价位`, level: 'critical' }),
};

function Toggle({ checked, onChange }) {
  return (
    <label className="mn-toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="mn-toggle-track"><span className="mn-toggle-thumb" /></span>
    </label>
  );
}

function BotCard({ bot, onUpdate }) {
  function toggleEnabled() {
    onUpdate({ ...bot, enabled: !bot.enabled });
  }

  function toggleSym(sym) {
    const syms = bot.config.symbols || [];
    const next = syms.includes(sym) ? syms.filter(s => s !== sym) : [...syms, sym];
    onUpdate({ ...bot, config: { ...bot.config, symbols: next } });
  }

  function setThreshold(val) {
    onUpdate({ ...bot, config: { ...bot.config, threshold: val } });
  }

  function addRule() {
    const rules = bot.config.rules || [];
    onUpdate({ ...bot, config: { ...bot.config, rules: [...rules, { sym: 'BTC', price: 0, direction: 'above', label: '阻力位' }] } });
  }

  function updateRule(idx, field, val) {
    const rules = [...bot.config.rules];
    rules[idx] = { ...rules[idx], [field]: val };
    if (field === 'direction') rules[idx].label = val === 'above' ? '阻力位' : '支撑位';
    onUpdate({ ...bot, config: { ...bot.config, rules } });
  }

  function removeRule(idx) {
    const rules = bot.config.rules.filter((_, i) => i !== idx);
    onUpdate({ ...bot, config: { ...bot.config, rules } });
  }

  const isBreakout = bot.id === 'breakout';

  return (
    <div className={`card mn-bot-card ${bot.enabled ? '' : 'disabled'}`}>
      <div className="mn-bot-head">
        <div className="mn-bot-icon">{bot.icon}</div>
        <div className="mn-bot-info">
          <div className="card-title">{bot.name}</div>
          <div className="card-sub">{bot.desc}</div>
        </div>
        <Toggle checked={bot.enabled} onChange={toggleEnabled} />
      </div>

      <div className="mn-bot-status">
        <span className={`mn-status-dot ${bot.enabled ? 'on' : 'off'}`}></span>
        <span style={{ color: bot.enabled ? 'var(--up)' : 'var(--text-3)' }}>{bot.enabled ? '运行中' : '已停止'}</span>
        <span className="mn-alert-badge">{bot.alerts.length} 条告警</span>
      </div>

      <div className="mn-bot-config">
        {!isBreakout && (
          <>
            <div className="mn-config-row">
              <span className="mn-config-label">监控币对</span>
              <div className="mn-config-chips">
                {ALL_SYMS.map(s => (
                  <button key={s} className={`chip ${(bot.config.symbols || []).includes(s) ? 'active' : ''}`} onClick={() => toggleSym(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="mn-config-row">
              <span className="mn-config-label">告警阈值</span>
              <div className="mn-input">
                <input
                  type="number"
                  value={bot.config.threshold}
                  onChange={e => setThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                  step={bot.config.unit === '%' ? 0.001 : bot.config.unit === '$' ? 10000 : 1}
                />
                <span className="mn-input-suffix">{bot.config.unit}</span>
              </div>
            </div>
          </>
        )}

        {isBreakout && (
          <div className="mn-breakout-rules">
            <div className="mn-config-row" style={{ marginBottom: 6 }}>
              <span className="mn-config-label">价位规则</span>
              <button className="chip active" onClick={addRule} style={{ fontSize: 11 }}>+ 添加</button>
            </div>
            {(bot.config.rules || []).map((r, i) => (
              <div key={i} className="mn-rule-row">
                <select className="mn-rule-select" value={r.sym} onChange={e => updateRule(i, 'sym', e.target.value)}>
                  {ALL_SYMS.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="mn-rule-select" value={r.direction} onChange={e => updateRule(i, 'direction', e.target.value)}>
                  <option value="above">上破</option>
                  <option value="below">下破</option>
                </select>
                <div className="mn-input" style={{ flex: 1 }}>
                  <input type="number" value={r.price} onChange={e => updateRule(i, 'price', Number(e.target.value))} />
                  <span className="mn-input-suffix">$</span>
                </div>
                <span className="mn-rule-label-tag">{r.label}</span>
                <button className="mn-rule-del" onClick={() => removeRule(i)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mn-bot-alerts">
        <div className="mn-alerts-head">
          <span className="mn-alerts-title">最近告警</span>
          <span className="mn-alerts-count">{bot.alerts.length}</span>
        </div>
        <div className="mn-alert-list">
          {bot.alerts.slice(0, 6).map((a, i) => (
            <div key={a.id} className={`mn-alert-item ${i === 0 ? 'latest' : ''}`}>
              <span className="mn-alert-time">{a.time}</span>
              <span className={`mn-alert-dot ${a.level}`}></span>
              <span className="mn-alert-msg">{a.msg}</span>
            </div>
          ))}
          {bot.alerts.length === 0 && <div className="mn-alert-empty">暂无告警记录</div>}
        </div>
      </div>
    </div>
  );
}

export default function MonitorPage() {
  const [bots, setBots] = useState(INITIAL_BOTS);
  const [banner, setBanner] = useState(null);

  const updateBot = useCallback((updated) => {
    setBots(prev => prev.map(b => b.id === updated.id ? updated : b));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setBots(prev => {
        const enabled = prev.filter(b => b.enabled && b.id !== 'breakout');
        if (!enabled.length) return prev;
        const bot = enabled[Math.floor(Math.random() * enabled.length)];
        const sym = (bot.config.symbols || ['BTC'])[Math.floor(Math.random() * (bot.config.symbols || ['BTC']).length)];
        const tpl = ALERT_TEMPLATES[bot.id];
        const alert = { id: Date.now(), time: ts(), ...tpl(sym, bot.config.threshold) };
        setBanner(alert);
        return prev.map(b => b.id === bot.id ? { ...b, alerts: [alert, ...b.alerts].slice(0, 20) } : b);
      });
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(t);
  }, [banner]);

  const activeCount = bots.filter(b => b.enabled).length;
  const totalAlerts = bots.reduce((s, b) => s + b.alerts.length, 0);
  const lastAlert = bots.flatMap(b => b.alerts).sort((a, b) => b.id - a.id)[0];

  return (
    <div className="page mn-page">
      <div className="mn-head">
        <div>
          <h1>监控中心</h1>
          <p>配置自动监控机器人，实时追踪市场异动</p>
        </div>
      </div>

      {banner && (
        <div className="mn-banner">
          <span className={`mn-alert-dot ${banner.level}`}></span>
          <span className="mn-banner-sym">{banner.sym}</span>
          <span className="mn-banner-msg">{banner.msg}</span>
          <span className="mn-banner-time">{banner.time}</span>
          <button className="mn-banner-close" onClick={() => setBanner(null)}>×</button>
        </div>
      )}

      <div className="mn-kpi-row">
        <div className="kpi">
          <div className="kpi-label">运行中</div>
          <div className="kpi-value">{activeCount}<span style={{ fontSize: 12, color: 'var(--text-3)' }}> / {bots.length}</span></div>
          <div className="kpi-foot"><span className="pill up">{activeCount} 个机器人活跃</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">累计告警</div>
          <div className="kpi-value">{totalAlerts}</div>
          <div className="kpi-foot"><span className="muted">全部机器人</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">最近告警</div>
          <div className="kpi-value" style={{ fontSize: 14 }}>{lastAlert?.msg.slice(0, 16) || '—'}…</div>
          <div className="kpi-foot"><span className="muted">{lastAlert?.time || '—'}</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">响应延迟</div>
          <div className="kpi-value">{'< 1s'}</div>
          <div className="kpi-foot"><span className="pill flat">实时推送</span></div>
        </div>
      </div>

      <div className="mn-bot-grid">
        {bots.map(bot => (
          <BotCard key={bot.id} bot={bot} onUpdate={updateBot} />
        ))}
      </div>
    </div>
  );
}
