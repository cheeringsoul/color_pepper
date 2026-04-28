import { useState, useMemo, useEffect, useCallback } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import api from '../api';
import { fmtPrice } from '../utils';

echarts.use([
  LineChart, GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, MarkLineComponent, CanvasRenderer,
]);

const SECTOR_COLORS = {
  '主流币': '#e8b839', 'Layer 1': '#10b981', 'Layer 2': '#a78bfa',
  'DeFi': '#6ea8ff', 'Meme': '#fbbf24', 'AI': '#f472b6',
  'Solana': '#9945ff', '支付': '#38bdf8',
};
const BTC_COLOR = '#f7931a';

function buildChartOption(data) {
  const { btcNorm, sectorLines, sectors, dates } = data;

  const series = [
    {
      name: 'BTC',
      type: 'line',
      data: btcNorm,
      symbol: 'circle',
      symbolSize: 4,
      showSymbol: false,
      lineStyle: { width: 2.5, type: 'dashed' },
      itemStyle: { color: BTC_COLOR },
      emphasis: { lineStyle: { width: 3.5 } },
      z: 10,
    },
    ...sectors.map((sec) => ({
      name: sec,
      type: 'line',
      data: sectorLines[sec],
      symbol: 'circle',
      symbolSize: 3,
      showSymbol: false,
      smooth: 0.25,
      lineStyle: { width: 1.8 },
      itemStyle: { color: SECTOR_COLORS[sec] || '#888' },
      emphasis: { lineStyle: { width: 3 } },
    })),
  ];

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    grid: { top: 40, right: 24, bottom: 70, left: 58, containLabel: false },
    legend: {
      type: 'scroll',
      top: 6, left: 'center',
      itemWidth: 18, itemHeight: 10, itemGap: 20,
      textStyle: { color: '#9aa0ad', fontSize: 11 },
      inactiveColor: '#3a3f4c',
      icon: 'roundRect',
      pageTextStyle: { color: '#9aa0ad' },
      pageIconColor: '#9aa0ad',
      pageIconInactiveColor: '#3a3f4c',
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(28,31,39,0.95)',
      borderColor: '#353a48',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#e8eaf0', fontSize: 11 },
      axisPointer: {
        type: 'cross',
        lineStyle: { color: 'rgba(255,255,255,0.12)', type: 'dashed' },
        crossStyle: { color: 'rgba(255,255,255,0.12)' },
        label: {
          backgroundColor: '#303542', color: '#e8eaf0', fontSize: 10,
          formatter: (params) => {
            if (params.axisDimension === 'y')
              return `${params.value >= 0 ? '+' : ''}${params.value.toFixed(2)}%`;
            return params.value;
          },
        },
      },
      formatter: (params) => {
        const sorted = [...params].sort((a, b) => b.value - a.value);
        let html = `<div style="margin-bottom:6px;color:#5e6473;font-size:10px">${sorted[0]?.axisValue || ''}</div>`;
        sorted.forEach((p) => {
          const v = p.value;
          const color = v >= 0 ? '#2dd4a4' : '#f47171';
          html += `<div style="display:flex;align-items:center;gap:8px;padding:2px 0">`;
          html += `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>`;
          html += `<span style="flex:1;color:#9aa0ad">${p.seriesName}</span>`;
          html += `<span style="font-weight:600;color:${color};font-variant-numeric:tabular-nums">${v >= 0 ? '+' : ''}${v.toFixed(2)}%</span>`;
          html += `</div>`;
        });
        return html;
      },
    },
    xAxis: {
      type: 'category', data: dates,
      axisLine: { lineStyle: { color: '#262a35' } },
      axisTick: { show: false },
      axisLabel: { color: '#5e6473', fontSize: 10, margin: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: '#5e6473', fontSize: 10, formatter: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` },
      splitLine: { lineStyle: { color: '#262a35', type: 'dashed' } },
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, start: 0, end: 100, zoomOnMouseWheel: 'shift', moveOnMouseMove: false },
      {
        type: 'slider', xAxisIndex: 0, start: 0, end: 100, height: 22, bottom: 8,
        borderColor: 'transparent', backgroundColor: '#1c1f27',
        fillerColor: 'rgba(255,122,61,0.12)',
        handleStyle: { color: '#ff7a3d', borderColor: '#ff7a3d' }, handleSize: '60%',
        dataBackground: { lineStyle: { color: '#353a48' }, areaStyle: { color: 'rgba(53,58,72,0.4)' } },
        selectedDataBackground: { lineStyle: { color: '#ff7a3d' }, areaStyle: { color: 'rgba(255,122,61,0.15)' } },
        textStyle: { color: '#5e6473', fontSize: 10 },
        moveHandleStyle: { color: '#353a48' },
      },
    ],
    series,
  };
}

export default function RotationPage({ symbols, onOpenSymbol }) {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    api.getRotationAnalysis(period).then((d) => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, [period]);

  const chartOption = useMemo(() => data ? buildChartOption(data) : null, [data]);

  const onChartReady = useCallback((instance) => {
    const zr = instance.getZr();
    zr.dom.addEventListener('wheel', (e) => { e.stopPropagation = () => {}; }, { passive: true });
  }, []);

  if (!data) return <div className="page rot-page" />;

  const { sectorStats, sectors, annotations, symbolCount } = data;
  const maxContrib = Math.max(...sectorStats.map((s) => Math.abs(s.contribution)));

  return (
    <div className="page rot-page">
      <div className="rot-chart-card">
        <div className="card-head">
          <div>
            <span className="card-title">板块轮动走势</span>
            <span className="card-sub">共 {symbolCount} 个标的 · {sectors.length} 个板块 · 归一化涨跌幅 · Shift+滚轮缩放</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['7d', '14d', '30d'].map((p) => (
              <button key={p} className={'pill' + (period === p ? ' active' : '')}
                onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
        </div>
        {chartOption && (
          <ReactEChartsCore echarts={echarts} option={chartOption}
            style={{ height: 460, width: '100%' }} notMerge lazyUpdate onChartReady={onChartReady} />
        )}
      </div>

      <div className="rot-bottom">
        <div className="rot-contrib-card">
          <div className="card-head">
            <span className="card-title">板块贡献排行</span>
          </div>
          <div className="rot-bars">
            {[...sectorStats]
              .sort((a, b) => b.contribution - a.contribution)
              .map((s) => (
                <div className="rot-bar-row" key={s.sector}>
                  <span className="rot-bar-label">{s.sector}</span>
                  <div className="rot-bar-track">
                    <div className="rot-bar-fill"
                      style={{
                        width: `${(Math.abs(s.contribution) / maxContrib) * 100}%`,
                        background: SECTOR_COLORS[s.sector] || '#888',
                        opacity: s.contribution >= 0 ? 1 : 0.5,
                      }} />
                  </div>
                  <span className="rot-bar-val">
                    {s.contribution >= 0 ? '+' : ''}{s.contribution.toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="rot-timeline-card">
          <div className="card-head">
            <span className="card-title">轮动时间线</span>
          </div>
          <div className="rot-events">
            {annotations.map((ann, i) => (
              <div className="rot-event" key={i}>
                <span className={`rot-event-dot ${ann.isUp ? 'up' : 'dn'}`}
                  style={{ background: ann.isUp ? '#2dd4a4' : '#f47171' }} />
                <div className="rot-event-body">
                  <span className="rot-event-title">
                    <span className={ann.isUp ? 'up' : 'dn'}>{ann.isUp ? '▲' : '▼'}</span>
                    {' '}{(ann.topSymbols || []).join(', ')}
                    <span className="dim"> · {ann.sector}</span>
                  </span>
                  <span className="rot-event-sub">BTC ${fmtPrice(ann.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
