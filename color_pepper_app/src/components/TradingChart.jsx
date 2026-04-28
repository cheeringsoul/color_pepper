import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export default function TradingChart({ klines, symbol, height = 400 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
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
      rightPriceScale: {
        borderColor: '#262a35',
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: '#262a35',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: { axisPressedMouseMove: true },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#2dd4a4',
      downColor: '#f47171',
      borderDownColor: '#f47171',
      borderUpColor: '#2dd4a4',
      wickDownColor: '#f47171',
      wickUpColor: '#2dd4a4',
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = { chart, candleSeries, volumeSeries };

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !klines?.length) return;
    const { candleSeries, volumeSeries } = chartRef.current;

    candleSeries.setData(
      klines.map((k) => ({
        time: k.time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }))
    );

    volumeSeries.setData(
      klines.map((k) => ({
        time: k.time,
        value: k.volume,
        color: k.close >= k.open ? 'rgba(45,212,164,0.35)' : 'rgba(244,113,113,0.35)',
      }))
    );

    chartRef.current.chart.timeScale().fitContent();
  }, [klines]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
