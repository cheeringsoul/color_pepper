import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { calcMACD, calcRSI } from '../utils/indicators';

const SUB_THEME = {
  layout: {
    background: { type: ColorType.Solid, color: 'transparent' },
    textColor: '#9aa0ad',
    fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
    fontSize: 10,
  },
  grid: {
    vertLines: { color: 'rgba(38,42,53,0.4)' },
    horzLines: { color: 'rgba(38,42,53,0.4)' },
  },
  crosshair: {
    mode: 0,
    vertLine: { color: 'rgba(255,122,61,0.3)', labelBackgroundColor: '#ff7a3d' },
    horzLine: { color: 'rgba(255,122,61,0.3)', labelBackgroundColor: '#ff7a3d' },
  },
  handleScale: { axisPressedMouseMove: true },
  handleScroll: { vertTouchDrag: false },
};

function useSubChart({ containerRef, showTimeAxis, mainChartRef }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const chart = createChart(containerRef.current, {
      ...SUB_THEME,
      width,
      height,
      rightPriceScale: { borderColor: '#262a35', scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: '#262a35', timeVisible: true, secondsVisible: false },
    });

    chartRef.current = { chart, series: [] };

    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0) chart.resize(w, h);
    });
    ro.observe(containerRef.current);

    const syncing = { current: false };
    const mainChart = mainChartRef?.current?.getChart?.();
    let unsub1, unsub2;
    if (mainChart) {
      unsub1 = mainChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (syncing.current || !range) return;
        syncing.current = true;
        chart.timeScale().setVisibleLogicalRange(range);
        syncing.current = false;
      });
      unsub2 = chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (syncing.current || !range) return;
        syncing.current = true;
        mainChart.timeScale().setVisibleLogicalRange(range);
        syncing.current = false;
      });
    }

    return () => {
      if (unsub1) unsub1();
      if (unsub2) unsub2();
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.chart.timeScale().applyOptions({ visible: showTimeAxis });
  }, [showTimeAxis]);

  return chartRef;
}

export function MacdPane({ klines, showTimeAxis = false, mainChartRef }) {
  const containerRef = useRef(null);
  const chartRef = useSubChart({ containerRef, showTimeAxis, mainChartRef });

  useEffect(() => {
    if (!chartRef.current || !klines?.length) return;
    const { chart, series: old } = chartRef.current;
    old.forEach(s => { try { chart.removeSeries(s); } catch {} });

    const closes = klines.map(k => k.close);
    const times = klines.map(k => k.time);
    const { dif, dea, histogram } = calcMACD(closes);

    const histS = chart.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false, priceFormat: { type: 'price', precision: 2, minMove: 0.01 } });
    histS.setData(histogram.map((v, i) => ({ time: times[i], value: v, color: v >= 0 ? 'rgba(45,212,164,0.6)' : 'rgba(244,113,113,0.6)' })));

    const lineOpts = { lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };
    const difS = chart.addLineSeries({ ...lineOpts, color: '#6ea8ff' });
    difS.setData(times.map((t, i) => ({ time: t, value: dif[i] })));
    const deaS = chart.addLineSeries({ ...lineOpts, color: '#f5c842' });
    deaS.setData(times.map((t, i) => ({ time: t, value: dea[i] })));

    chartRef.current.series = [histS, difS, deaS];
    chart.timeScale().fitContent();
  }, [klines]);

  return (
    <div className="sub-chart-pane" style={{ height: 130 }}>
      <span className="sub-chart-label">MACD(12,26,9)</span>
      <div ref={containerRef} className="sub-chart-inner" />
    </div>
  );
}

export function RsiPane({ klines, showTimeAxis = false, mainChartRef }) {
  const containerRef = useRef(null);
  const chartRef = useSubChart({ containerRef, showTimeAxis, mainChartRef });

  useEffect(() => {
    if (!chartRef.current || !klines?.length) return;
    const { chart, series: old } = chartRef.current;
    old.forEach(s => { try { chart.removeSeries(s); } catch {} });

    const closes = klines.map(k => k.close);
    const times = klines.map(k => k.time);
    const rsi = calcRSI(closes, 14);
    const data = [];
    for (let i = 0; i < rsi.length; i++) if (rsi[i] !== null) data.push({ time: times[i], value: rsi[i] });

    const lineOpts = { lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };
    const rsiS = chart.addLineSeries({ ...lineOpts, color: '#b48cff', lineWidth: 1.5 });
    rsiS.setData(data);
    const obS = chart.addLineSeries({ ...lineOpts, color: 'rgba(244,113,113,0.3)', lineStyle: 2 });
    obS.setData(data.map(d => ({ time: d.time, value: 70 })));
    const osS = chart.addLineSeries({ ...lineOpts, color: 'rgba(45,212,164,0.3)', lineStyle: 2 });
    osS.setData(data.map(d => ({ time: d.time, value: 30 })));

    chartRef.current.series = [rsiS, obS, osS];
    chart.timeScale().fitContent();
  }, [klines]);

  return (
    <div className="sub-chart-pane" style={{ height: 110 }}>
      <span className="sub-chart-label">RSI(14)</span>
      <div ref={containerRef} className="sub-chart-inner" />
    </div>
  );
}
