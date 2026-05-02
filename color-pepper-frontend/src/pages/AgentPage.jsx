import { useState, useEffect } from 'react';
import api from '../api';

export default function AgentPage({ contextSym, onOpenSymbol }) {
  const [messages, setMessages] = useState([
    {
      role: 'ag',
      body: '我是 Color Pepper 的研究助手。我可以帮你解读行情、对比相似标的、分析板块轮动，或基于你正在看的标的回答问题。',
      suggest: ['解读最近 24h 走势', '找相似走势的标的', '解读最近板块轮动'],
    },
    {
      role: 'user',
      body: '现在 BTC 看起来怎么样？',
    },
    {
      role: 'ag',
      body: <>
        <p><strong>BTC</strong> 当前 <span className="num">$67,234</span>，24h <span className="up">+2.34%</span>。短期处于上升通道但接近上沿，建议关注 <span className="num">$67,800</span> 阻力。</p>
        <p>从板块轮动看，<strong>主流币</strong>近 3 日强势，资金从 <strong>Layer 2</strong> 切出。</p>
        <div className="msg-card">
          <div className="mc-head">联动度最高的标的</div>
          <div className="mc-list">
            {[
              { sym: 'ETH', corr: 0.92, chg: 1.92, color: '#627eea' },
              { sym: 'BNB', corr: 0.86, chg: 0.84, color: '#f3ba2f' },
              { sym: 'SOL', corr: 0.78, chg: 6.12, color: '#9945ff' },
            ].map(r => (
              <div key={r.sym} className="mc-row" onClick={() => onOpenSymbol(r.sym)}>
                <div className="sym-bubble sm" style={{ background: r.color }}>{r.sym[0]}</div>
                <div className="nm">{r.sym}<span className="dim" style={{ fontWeight: 400, fontSize: 11 }}>/USDT</span></div>
                <div className="num dim">r={r.corr.toFixed(2)}</div>
                <div className={`num ${r.chg >= 0 ? 'up' : 'dn'}`}>{r.chg >= 0 ? '+' : ''}{r.chg}%</div>
              </div>
            ))}
          </div>
        </div>
      </>,
      suggest: ['解读 ETH 现状', '对比 BTC 和 SOL 的走势', '近 7 日资金流向哪个板块？'],
    },
  ]);
  const [input, setInput] = useState('');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.getAgentAlerts().then(setEvents);
  }, []);

  function send() {
    if (!input.trim()) return;
    const userMsg = { role: 'user', body: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    api.sendAgentMessage(currentInput, { symbol: contextSym }).then(res => {
      setMessages(prev => [...prev, {
        role: 'ag',
        body: <p>{res.body}</p>,
        suggest: res.suggestions || [],
      }]);
    });
  }

  return (
    <div className="page agent-page">
      <aside className="ag-left">
        <div className="ag-left-head">
          <h2>值得关注</h2>
          <p>Agent 主动推送的市场异动</p>
        </div>
        <div className="ag-events">
          {events.map((e, i) => (
            <div key={i} className={`event-card ${e.tag === 'hot' ? 'hot' : ''}`}>
              <div className="event-head">
                <span className={`event-tag ${e.tag}`}>{e.tagText}</span>
                <span className="event-time">{e.time}</span>
              </div>
              <div className="event-title">{e.title}</div>
              <div className="event-body">{e.body}</div>
            </div>
          ))}
        </div>
      </aside>

      <div className="ag-right">
        <div className="ag-head">
          <span className="ag-pulse"></span>
          <h2>Color Pepper Agent</h2>
          <span className="dim" style={{ fontSize: 12 }}>分析模式 · 不下单</span>
          <span className="tag">Context: {contextSym || 'BTC/USDT · 1h'}</span>
        </div>

        <div className="ag-conv">
          <div className="ag-conv-inner">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="msg-avatar">{m.role === 'ag' ? '✦' : 'A'}</div>
                <div className="msg-body">
                  {typeof m.body === 'string' ? <p>{m.body}</p> : m.body}
                  {m.suggest && m.suggest.length > 0 && (
                    <div className="msg-suggest">
                      {m.suggest.map((s, j) => (
                        <button key={j} className="sg" onClick={() => setInput(s)}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ag-input">
          <div className="ai-row">
            <textarea className="ai-textarea" rows={1} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="问点什么…例如：BTC 现在是不是该回调？" />
            <button className="ai-send" onClick={send}>↵</button>
          </div>
          <div className="ai-foot">
            <button className="qprompt" onClick={() => setInput('解读最近 24h 走势')}>解读最近 24h 走势</button>
            <button className="qprompt" onClick={() => setInput('找相似走势的标的')}>找相似走势的标的</button>
            <button className="qprompt" onClick={() => setInput('解读最近板块轮动')}>解读最近板块轮动</button>
          </div>
        </div>
      </div>
    </div>
  );
}
