import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

const TradingChart = forwardRef(({ data, volumeData, backgroundColor = 'transparent', textColor = '#d1d4dc' }, ref) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const priceLinesRef = useRef({});

  useImperativeHandle(ref, () => ({
    updateCandle: (candle, volume) => {
      if (candlestickSeriesRef.current && candle) {
        candlestickSeriesRef.current.update(candle);
      }
      if (volumeSeriesRef.current && volume) {
        volumeSeriesRef.current.update(volume);
      }
    },
    addPriceLine: (tradeId, price, type) => {
      if (!candlestickSeriesRef.current) return;
      const color = type === 'BUY' ? '#10b981' : '#ef4444';
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) return;

      const line = candlestickSeriesRef.current.createPriceLine({
        price: parsedPrice,
        color: color,
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `${type} Entry`,
      });
      priceLinesRef.current[tradeId] = line;
    },
    removePriceLine: (tradeId) => {
      if (candlestickSeriesRef.current && priceLinesRef.current[tradeId]) {
        candlestickSeriesRef.current.removePriceLine(priceLinesRef.current[tradeId]);
        delete priceLinesRef.current[tradeId];
      }
    },
    takeScreenshot: () => {
      if (chartRef.current) {
        return chartRef.current.takeScreenshot();
      }
      return null;
    }
  }));

  // Effect 1: Create the chart instance ONCE on mount. Never re-run this.
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.3)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.3)' },
      },
      width: chartContainerRef.current.clientWidth || 300,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
      }
    });

    chartRef.current = chart;

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // set as an overlay
      scaleMargins: {
        top: 0.8, // highest point of the series will be at 80% of the chart height
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    candlestickSeriesRef.current = candlestickSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (chartRef.current && width > 0) {
        chartRef.current.applyOptions({ width });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: Load historical candle data whenever the symbol/interval changes.
  // Live tick updates go through the imperative updateCandle() handle — NOT here.
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;
    if (data && data.length > 0) {
      candlestickSeriesRef.current.setData(data);
    }
    if (volumeData && volumeData.length > 0) {
      volumeSeriesRef.current.setData(volumeData);
    }
  }, [data, volumeData]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    />
  );
});

export default TradingChart;
