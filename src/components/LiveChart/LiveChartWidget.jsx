import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import TradingChart from './TradingChart';
import IntervalSelector from './IntervalSelector';
import BuySellButtons from './BuySellButtons';
import TradePopup from './TradePopup';
import { Search, Settings, Maximize2, Camera } from 'lucide-react';
import './LiveChart.css';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

const LiveChartWidget = () => {
  const [symbol, setSymbol] = useState('TSLA');
  const [interval, setIntervalTime] = useState('1m');
  const [candles, setCandles] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [ohlc, setOhlc] = useState({ open: 0, high: 0, low: 0, close: 0, vol: 0 });
  const [resolvedTrade, setResolvedTrade] = useState(null);
  
  const chartRef = useRef();
  const socketRef = useRef(null);
  const lastCandleTimeRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Fetch initial historical data
    const fetchHistory = async () => {
      try {
        console.log(`Fetching history for ${symbol} on ${interval}...`);
        const res = await axios.get(`${API_URL}/chart/${symbol}/${interval}`);
        const historicalData = res.data;
        
        console.log(`Received ${historicalData.length} candles from backend.`);
        
        if (historicalData && historicalData.length > 0 && isMounted) {
          const candleData = historicalData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
          const volData = historicalData.map(d => ({ 
            time: d.time, 
            value: d.value, 
            color: d.close >= d.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)' 
          }));

          setCandles(candleData);
          setVolumeData(volData);

          const last = historicalData[historicalData.length - 1];
          lastCandleTimeRef.current = last.time;
          setCurrentPrice(last.close);
          setOhlc({ open: last.open, high: last.high, low: last.low, close: last.close, vol: last.value });
        }
        
        // 2. Setup Socket Connection ONLY AFTER history is loaded to prevent update() errors
        if (!socketRef.current) {
          socketRef.current = io(SOCKET_URL);
          
          socketRef.current.on('live_candle', (candle) => {
            if (!isMounted) return;
            setCurrentPrice(candle.close);
            setOhlc({ open: candle.open, high: candle.high, low: candle.low, close: candle.close, vol: candle.value });
            
            if (chartRef.current && lastCandleTimeRef.current) {
              try {
                // Ensure the live candle time is >= the last historical candle time
                if (candle.time >= lastCandleTimeRef.current) {
                  chartRef.current.updateCandle(
                    { time: candle.time, open: candle.open, high: candle.high, low: candle.low, close: candle.close },
                    { time: candle.time, value: candle.value, color: candle.close >= candle.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)' }
                  );
                  lastCandleTimeRef.current = candle.time;
                }
              } catch (e) {
                console.warn('Chart update ignored:', e.message);
              }
            }
          });
        }
        
        // Subscribe to new symbol/interval logic
        if (isMounted) {
          socketRef.current.emit('subscribe_interval', { symbol, interval });
        }
        
      } catch (error) {
        console.error('Failed to fetch historical data (is backend running?):', error);
      }
    };

    fetchHistory();

    // 3. Listen for Trade Resolutions
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
    }
    
    socketRef.current.on('trade_resolved', (trade) => {
      if (!isMounted) return;
      if (trade.symbol === symbol) {
        if (chartRef.current) {
          chartRef.current.removePriceLine(trade.id);
        }
        setResolvedTrade(trade);
      }
    });

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('live_candle');
        socketRef.current.off('trade_resolved');
      }
    };
  }, [symbol, interval]);

  const handleTradeExecuted = (trade) => {
    if (chartRef.current) {
      chartRef.current.addPriceLine(trade.id, trade.price, trade.type);
    }
  };

  const handleScreenshot = () => {
    if (chartRef.current && chartRef.current.takeScreenshot) {
      const canvas = chartRef.current.takeScreenshot();
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${symbol}-chart.png`;
        a.click();
      }
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (widgetRef.current?.requestFullscreen) {
        widgetRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleSettings = () => {
    alert("Chart settings configuration will be available in the next update.");
  };

  return (
    <div className="lc-widget-container" ref={widgetRef}>
      {/* Header */}
      <div className="lc-header">
        <div className="lc-top-row">
          <div className="lc-symbol-search">
            <Search size={16} />
            <input 
              type="text" 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="lc-symbol-input"
            />
          </div>
          <div className="lc-header-tools">
            <IntervalSelector active={interval} onChange={setIntervalTime} />
            <div className="lc-tool-icons">
              <Camera size={16} onClick={handleScreenshot} style={{ cursor: 'pointer' }} title="Take Snapshot" />
              <Maximize2 size={16} onClick={handleFullscreen} style={{ cursor: 'pointer' }} title="Toggle Fullscreen" />
              <Settings size={16} onClick={handleSettings} style={{ cursor: 'pointer' }} title="Chart Settings" />
            </div>
          </div>
        </div>
        
        {/* OHLCV Bar */}
        <div className="lc-ohlcv-bar">
          <div className="lc-symbol-title">
            <span className="lc-logo-mock">{symbol.charAt(0)}</span>
            <span className="lc-full-name">{symbol === 'TSLA' ? 'Tesla, Inc.' : symbol}</span>
            <span className="lc-exchange-tag">D</span>
          </div>
          <div className="lc-ohlcv-values">
            <span>O<span className={ohlc.open >= currentPrice ? 'red' : 'green'}>{ohlc.open.toFixed(2)}</span></span>
            <span>H<span className={ohlc.high >= currentPrice ? 'red' : 'green'}>{ohlc.high.toFixed(2)}</span></span>
            <span>L<span className={ohlc.low >= currentPrice ? 'red' : 'green'}>{ohlc.low.toFixed(2)}</span></span>
            <span>C<span className={ohlc.close >= currentPrice ? 'red' : 'green'}>{ohlc.close.toFixed(2)}</span></span>
            <span>Vol<span className="gray">{(ohlc.vol / 1000).toFixed(1)}M</span></span>
          </div>
        </div>
        <div className="lc-current-price-stamp">
            <span className="lc-live-price" style={{ color: currentPrice >= ohlc.open ? '#10b981' : '#ef4444' }}>
              {currentPrice.toFixed(2)}
            </span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="lc-chart-area">
        <TradingChart ref={chartRef} data={candles} volumeData={volumeData} />
        <TradePopup trade={resolvedTrade} onClose={() => setResolvedTrade(null)} />
      </div>

      {/* Footer Buttons */}
      <BuySellButtons symbol={symbol} currentPrice={currentPrice} interval={interval} onTradeExecuted={handleTradeExecuted} />
    </div>
  );
};

export default LiveChartWidget;
