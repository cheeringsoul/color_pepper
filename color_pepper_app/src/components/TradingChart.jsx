import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { calcMA, calcBOLL } from '../utils/indicators';

const MA_COLORS = { 7: '#f5c842', 25: '#6ea8ff', 99: '#b48cff' };

const CHART_THEME = {
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
  handleScale: { axisPressedMouseMove: true },
  handleScroll: { vertTouchDrag: false },
};

const TradingChart = forwardRef(function TradingChart({ klines, symbol, indicators = {}, showTimeAxis = true }, ref) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getChart: () => chartRef.current?.chart,
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();

    const chart = createChart(containerRef.current, {
      ...CHART_THEME,
      width,
      height,
      rightPriceScale: { borderColor: '#262a35', scaleMargins: { top: 0.05, bottom: 0.28 } },
      timeScale: { borderColor: '#262a35', timeVisible: true, secondsVisible: false },
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
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.74, bottom: 0 } });

    chartRef.current = { chart, candleSeries, volumeSeries, overlays: {} };

    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0) chart.resize(w, h);
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.chart.timeScale().applyOptions({ visible: showTimeAxis });
  }, [showTimeAxis]);

  useEffect(() => {
    if (!chartRef.current || !klines?.length) return;
    const { chart, candleSeries, volumeSeries } = chartRef.current;
    const times = klines.map(k => k.time);
    const closes = klines.map(k => k.close);

    candleSeries.setData(klines.map(k => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close })));
    volumeSeries.setData(klines.map(k => ({
      time: k.time, value: k.volume,
      color: k.close >= k.open ? 'rgba(45,212,164,0.3)' : 'rgba(244,113,113,0.3)',
    })));

    Object.values(chartRef.current.overlays).forEach(s => chart.removeSeries(s));
    chartRef.current.overlays = {};

    if (indicators.ma) {
      for (const period of indicators.ma) {
        const values = calcMA(closes, period);
        const series = chart.addLineSeries({
          color: MA_COLORS[period] || '#888', lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });
        const data = [];
        for (let i = 0; i < values.length; i++) {
          if (values[i] !== null) data.push({ time: times[i], value: values[i] });
        }
        series.setData(data);
        chartRef.current.overlays[`ma${period}`] = series;
      }
    }

    if (indicators.boll) {
      const { mid, upper, lower } = calcBOLL(closes, 20, 2);
      const makeData = (arr) => arr.reduce((d, v, i) => { if (v !== null) d.push({ time: times[i], value: v }); return d; }, []);
      const opts = { lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };
      const midS = chart.addLineSeries({ ...opts, color: '#f5c842' });
      const upS = chart.addLineSeries({ ...opts, color: 'rgba(110,168,255,0.6)', lineStyle: 2 });
      const loS = chart.addLineSeries({ ...opts, color: 'rgba(110,168,255,0.6)', lineStyle: 2 });
      midS.setData(makeData(mid)); upS.setData(makeData(upper)); loS.setData(makeData(lower));
      Object.assign(chartRef.current.overlays, { bollMid: midS, bollUp: upS, bollLo: loS });
    }

    chart.timeScale().fitContent();
  }, [klines, indicators]);

  return <div ref={containerRef} className="tv-chart-container" />;
});

export default TradingChart;
