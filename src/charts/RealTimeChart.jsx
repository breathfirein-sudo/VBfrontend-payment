import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const RealTimeChart = ({ candles, theme = 'dark' }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { color: theme === 'dark' ? '#050509' : '#ffffff' },
        textColor: theme === 'dark' ? '#f5f5f7' : '#1f2937',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#191a21' : '#e5e7eb' },
        horzLines: { color: theme === 'dark' ? '#191a21' : '#e5e7eb' },
      },
      crosshair: { mode: 1 },
      priceScale: { borderColor: theme === 'dark' ? '#2a2e42' : '#d1d5db' },
      timeScale: { borderColor: theme === 'dark' ? '#2a2e42' : '#d1d5db', timeVisible: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#f9c846',
      downColor: '#7c5f2f',
      borderVisible: false,
      wickUpColor: '#f9c846',
      wickDownColor: '#7c5f2f',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#8d7f4d',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.7, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [theme]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const candleData = candles.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = candles.map((c) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? '#f9c846' : '#7c5f2f',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
  }, [candles]);

  return <div ref={containerRef} className="realtime-chart-container" />;
};

export default RealTimeChart;
