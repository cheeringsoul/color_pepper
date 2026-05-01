import { useState, useEffect, useRef, useCallback } from 'react';

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_COLORS = ['#2dd4a4', '#6ea8ff', '#b48cff', '#f5c842', '#ff7a3d', '#f47171', '#f47171'];

function toPixel(chart, series, pt) {
  const x = chart.timeScale().timeToCoordinate(pt.time);
  const y = series.priceToCoordinate(pt.price);
  return (x !== null && y !== null) ? { x, y } : null;
}

function fromParam(series, param) {
  if (!param.time || !param.point) return null;
  const price = series.coordinateToPrice(param.point.y);
  return price !== null ? { time: param.time, price } : null;
}

function drawTrendline(ctx, p1, p2, preview) {
  ctx.save();
  ctx.strokeStyle = '#6ea8ff';
  ctx.lineWidth = 1.5;
  if (preview) ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  [p1, p2].forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#6ea8ff';
    ctx.fill();
  });
  ctx.restore();
}

function drawHline(ctx, y, w, price, preview) {
  ctx.save();
  ctx.strokeStyle = '#ff7a3d';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  if (preview) ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ff7a3d';
  ctx.font = '10px ui-monospace, monospace';
  ctx.textAlign = 'right';
  const label = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  ctx.fillText(label, w - 4, y - 4);
  ctx.restore();
}

function drawFibonacci(ctx, chart, series, d, w, preview) {
  const p1 = toPixel(chart, series, d.start);
  const p2 = toPixel(chart, series, d.end);
  if (!p1 || !p2) return;

  ctx.save();
  if (preview) ctx.globalAlpha = 0.5;
  const highPrice = Math.max(d.start.price, d.end.price);
  const lowPrice = Math.min(d.start.price, d.end.price);
  const range = highPrice - lowPrice;

  const yLevels = FIB_LEVELS.map(level => {
    const price = highPrice - range * level;
    const y = series.priceToCoordinate(price);
    return { level, price, y };
  }).filter(l => l.y !== null);

  for (let i = 0; i < yLevels.length - 1; i++) {
    ctx.fillStyle = FIB_COLORS[i];
    ctx.globalAlpha = preview ? 0.03 : 0.06;
    ctx.fillRect(0, yLevels[i].y, w, yLevels[i + 1].y - yLevels[i].y);
  }

  ctx.globalAlpha = preview ? 0.5 : 0.8;
  yLevels.forEach(({ level, price, y }, i) => {
    ctx.strokeStyle = FIB_COLORS[Math.min(i, FIB_COLORS.length - 1)];
    ctx.lineWidth = level === 0 || level === 1 ? 1 : 0.8;
    ctx.setLineDash(level === 0 || level === 1 ? [] : [4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = '#9aa0ad';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    const pLabel = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    ctx.fillText(`${(level * 100).toFixed(1)}%  ${pLabel}`, 4, y - 3);
  });

  ctx.strokeStyle = '#6ea8ff';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.globalAlpha = preview ? 0.3 : 0.6;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  ctx.restore();
}

export default function DrawingCanvas({ chartRef, symbol }) {
  const canvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [pendingStart, setPendingStart] = useState(null);
  const drawingsRef = useRef(drawings);
  drawingsRef.current = drawings;
  const pendingRef = useRef(pendingStart);
  pendingRef.current = pendingStart;
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  const previewEndRef = useRef(null);

  useEffect(() => {
    setDrawings([]);
    setPendingStart(null);
    setActiveTool(null);
  }, [symbol]);

  const redraw = useCallback((previewEnd) => {
    const canvas = canvasRef.current;
    const cr = chartRef?.current;
    if (!canvas || !cr) return;
    const chart = cr.getChart();
    const series = cr.getCandleSeries();
    const container = cr.getContainer();
    if (!chart || !series || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    for (const d of drawingsRef.current) {
      if (d.type === 'trendline') {
        const p1 = toPixel(chart, series, d.start);
        const p2 = toPixel(chart, series, d.end);
        if (p1 && p2) drawTrendline(ctx, p1, p2, false);
      } else if (d.type === 'hline') {
        const y = series.priceToCoordinate(d.price);
        if (y !== null) drawHline(ctx, y, rect.width, d.price, false);
      } else if (d.type === 'fibonacci') {
        drawFibonacci(ctx, chart, series, d, rect.width, false);
      }
    }

    if (pendingRef.current && previewEnd) {
      const tool = activeToolRef.current;
      if (tool === 'trendline') {
        const p1 = toPixel(chart, series, pendingRef.current);
        const p2 = toPixel(chart, series, previewEnd);
        if (p1 && p2) drawTrendline(ctx, p1, p2, true);
      } else if (tool === 'fibonacci') {
        drawFibonacci(ctx, chart, series, { start: pendingRef.current, end: previewEnd }, rect.width, true);
      }
    }
  }, [chartRef]);

  useEffect(() => {
    const cr = chartRef?.current;
    if (!cr) return;
    const chart = cr.getChart();
    if (!chart) return;

    const onRange = () => redraw(previewEndRef.current);
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRange);
    return () => chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRange);
  }, [chartRef, redraw]);

  useEffect(() => { redraw(null); }, [drawings, redraw]);

  useEffect(() => {
    const cr = chartRef?.current;
    if (!cr) return;
    const chart = cr.getChart();
    const series = cr.getCandleSeries();
    const container = cr.getContainer();
    if (!chart || !series || !container) return;

    if (activeTool) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
      return;
    }

    const onClick = (param) => {
      if (!activeToolRef.current) return;
      const pt = fromParam(series, param);
      if (!pt) return;

      if (activeToolRef.current === 'hline') {
        setDrawings(prev => [...prev, { type: 'hline', price: pt.price }]);
        return;
      }

      if (!pendingRef.current) {
        setPendingStart(pt);
      } else {
        const newDrawing = { type: activeToolRef.current, start: pendingRef.current, end: pt };
        setDrawings(prev => [...prev, newDrawing]);
        setPendingStart(null);
        previewEndRef.current = null;
      }
    };

    const onMove = (param) => {
      if (!pendingRef.current || !activeToolRef.current) return;
      const pt = fromParam(series, param);
      if (pt) {
        previewEndRef.current = pt;
        redraw(pt);
      }
    };

    chart.subscribeClick(onClick);
    chart.subscribeCrosshairMove(onMove);
    return () => {
      chart.unsubscribeClick(onClick);
      chart.unsubscribeCrosshairMove(onMove);
      container.style.cursor = '';
    };
  }, [activeTool, chartRef, redraw]);

  function selectTool(tool) {
    setActiveTool(prev => prev === tool ? null : tool);
    setPendingStart(null);
    previewEndRef.current = null;
  }

  function clearAll() {
    setDrawings([]);
    setPendingStart(null);
    previewEndRef.current = null;
    setActiveTool(null);
    redraw(null);
  }

  function undoLast() {
    setDrawings(prev => prev.slice(0, -1));
    setPendingStart(null);
    previewEndRef.current = null;
  }

  const tools = [
    { id: 'trendline', icon: '╲', title: '趋势线' },
    { id: 'hline', icon: '─', title: '水平线' },
    { id: 'fibonacci', icon: 'Fib', title: '斐波那契' },
  ];

  return (
    <>
      <div className="drawing-toolbar">
        {tools.map(t => (
          <button
            key={t.id}
            className={activeTool === t.id ? 'active' : ''}
            onClick={() => selectTool(t.id)}
            title={t.title}
          >{t.icon}</button>
        ))}
        <div className="drawing-divider" />
        <button onClick={undoLast} title="撤销">↩</button>
        <button onClick={clearAll} title="清除全部">✕</button>
      </div>
      <canvas ref={canvasRef} className="drawing-canvas" />
    </>
  );
}
