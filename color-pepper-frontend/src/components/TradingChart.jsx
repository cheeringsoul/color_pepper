import { useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { calcMA, calcBOLL, calcMACD, calcRSI } from '../utils/indicators';

const MA_COLORS = { 7: '#f5c842', 25: '#6ea8ff', 99: '#b48cff' };

function calcLayout(indicators) {
  const sections = [
    { id: 'price', weight: 5 },
    { id: 'volume', weight: 1.5 },
  ];
  if (indicators.macd) sections.push({ id: 'macd', weight: 2 });
  if (indicators.rsi) sections.push({ id: 'rsi', weight: 1.5 });

  const totalWeight = sections.reduce((s, sec) => s + sec.weight, 0);
  const gap = 0.015;
  const totalGaps = (sections.length - 1) * gap;
  const usable = 1 - totalGaps;

  const layout = {};
  let cursor = 0;
  sections.forEach((sec, i) => {
    const size = (sec.weight / totalWeight) * usable;
    layout[sec.id] = { top: cursor, bottom: Math.max(0, 1 - cursor - size) };
    cursor += size + gap;
  });
  return layout;
}

const TradingChart = forwardRef(function TradingChart({ klines, symbol, indicators = {} }, ref) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getChart: () => chartRef.current?.chart,
    getCandleSeries: () => chartRef.current?.candleSeries,
    getContainer: () => containerRef.current,
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();

    const chart = createChart(containerRef.current, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9aa0ad',
        fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(38,42,53,0.6)' },
        horzLines: { color: 'rgba(38,42,53,0.6)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(255,122,61,0.3)', labelBackgroundColor: '#ff7a3d' },
        horzLine: { color: 'rgba(255,122,61,0.3)', labelBackgroundColor: '#ff7a3d' },
      },
      rightPriceScale: { borderColor: '#262a35' },
      timeScale: { borderColor: '#262a35', timeVisible: true, secondsVisible: false },
      handleScale: { axisPressedMouseMove: true },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#2dd4a4', downColor: '#f47171',
      borderDownColor: '#f47171', borderUpColor: '#2dd4a4',
      wickDownColor: '#f47171', wickUpColor: '#2dd4a4',
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chartRef.current = { chart, candleSeries, volumeSeries, extras: [] };

    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0) chart.resize(w, h);
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !klines?.length) return;
    const { chart, candleSeries, volumeSeries, extras } = chartRef.current;
    const times = klines.map(k => k.time);
    const closes = klines.map(k => k.close);

    extras.forEach(s => { try { chart.removeSeries(s); } catch {} });
    chartRef.current.extras = [];
    const addExtra = (s) => { chartRef.current.extras.push(s); return s; };

    const layout = calcLayout(indicators);

    chart.priceScale('right').applyOptions({ scaleMargins: layout.price });
    chart.priceScale('volume').applyOptions({ scaleMargins: layout.volume });

    candleSeries.setData(klines.map(k => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close })));
    volumeSeries.setData(klines.map(k => ({
      time: k.time, value: k.volume,
      color: k.close >= k.open ? 'rgba(45,212,164,0.3)' : 'rgba(244,113,113,0.3)',
    })));

    if (indicators.ma) {
      for (const period of indicators.ma) {
        const values = calcMA(closes, period);
        const s = addExtra(chart.addLineSeries({
          color: MA_COLORS[period] || '#888', lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        }));
        const data = [];
        for (let i = 0; i < values.length; i++) if (values[i] !== null) data.push({ time: times[i], value: values[i] });
        s.setData(data);
      }
    }

    if (indicators.boll) {
      const { mid, upper, lower } = calcBOLL(closes, 20, 2);
      const makeData = (arr) => arr.reduce((d, v, i) => { if (v !== null) d.push({ time: times[i], value: v }); return d; }, []);
      const opts = { lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };
      addExtra(chart.addLineSeries({ ...opts, color: '#f5c842' })).setData(makeData(mid));
      addExtra(chart.addLineSeries({ ...opts, color: 'rgba(110,168,255,0.6)', lineStyle: 2 })).setData(makeData(upper));
      addExtra(chart.addLineSeries({ ...opts, color: 'rgba(110,168,255,0.6)', lineStyle: 2 })).setData(makeData(lower));
    }

    if (indicators.macd) {
      const { dif, dea, histogram } = calcMACD(closes);
      const macdOpts = { priceScaleId: 'macd', priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };

      const histS = addExtra(chart.addHistogramSeries({ ...macdOpts, priceFormat: { type: 'price', precision: 2, minMove: 0.01 } }));
      histS.setData(histogram.map((v, i) => ({ time: times[i], value: v, color: v >= 0 ? 'rgba(45,212,164,0.6)' : 'rgba(244,113,113,0.6)' })));

      const difS = addExtra(chart.addLineSeries({ ...macdOpts, color: '#6ea8ff', lineWidth: 1 }));
      difS.setData(times.map((t, i) => ({ time: t, value: dif[i] })));

      const deaS = addExtra(chart.addLineSeries({ ...macdOpts, color: '#f5c842', lineWidth: 1 }));
      deaS.setData(times.map((t, i) => ({ time: t, value: dea[i] })));

      chart.priceScale('macd').applyOptions({ scaleMargins: layout.macd, borderVisible: false });
    }

    if (indicators.rsi) {
      const rsi = calcRSI(closes, 14);
      const data = [];
      for (let i = 0; i < rsi.length; i++) if (rsi[i] !== null) data.push({ time: times[i], value: rsi[i] });
      const rsiOpts = { priceScaleId: 'rsi', priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };

      addExtra(chart.addLineSeries({ ...rsiOpts, color: '#b48cff', lineWidth: 1.5 })).setData(data);
      addExtra(chart.addLineSeries({ ...rsiOpts, color: 'rgba(244,113,113,0.3)', lineWidth: 1, lineStyle: 2 })).setData(data.map(d => ({ time: d.time, value: 70 })));
      addExtra(chart.addLineSeries({ ...rsiOpts, color: 'rgba(45,212,164,0.3)', lineWidth: 1, lineStyle: 2 })).setData(data.map(d => ({ time: d.time, value: 30 })));

      chart.priceScale('rsi').applyOptions({ scaleMargins: layout.rsi, borderVisible: false });
    }

    chart.timeScale().fitContent();
  }, [klines, indicators]);

  return <div ref={containerRef} className="tv-chart-container" />;
});

export default TradingChart;
