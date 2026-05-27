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

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.3)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.3)' },
      },
      width: chartContainerRef.current.clientWidth,
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

    if (data && data.length > 0) {
      candlestickSeries.setData(data);
    }
    if (volumeData && volumeData.length > 0) {
      volumeSeries.setData(volumeData);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, volumeData, backgroundColor, textColor]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
});

export default TradingChart;
