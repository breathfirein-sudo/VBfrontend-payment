import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import TradingChart from './TradingChart';
import IntervalSelector from './IntervalSelector';
import BuySellButtons from './BuySellButtons';
import TradePopup from './TradePopup';
import { Search, Settings, Maximize2, Camera, Trophy, Activity, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { auth } from '../../firebase';
import { getAuthToken } from '../../utils/authHelper';
import './LiveChart.css';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

const LiveChartWidget = ({ user }) => {
  const [symbol, setSymbol] = useState('TSLA');
  const [interval, setIntervalTime] = useState('1m');
  const [candles, setCandles] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [ohlc, setOhlc] = useState({ open: 0, high: 0, low: 0, close: 0, vol: 0 });
  const [resolvedTrade, setResolvedTrade] = useState(null);
  
  // Lifted and portfolio states
  const [isContest, setIsContest] = useState(false);
  const [contestRegistered, setContestRegistered] = useState(false);
  const [contestBalance, setContestBalance] = useState(11000);
  const [riskAmount, setRiskAmount] = useState('1000');
  
  const [standardTrades, setStandardTrades] = useState([]);
  const [contestTrades, setContestTrades] = useState([]);
  const [contestProfile, setContestProfile] = useState(null);

  const chartRef = useRef();
  const socketRef = useRef(null);
  const lastCandleTimeRef = useRef(null);
  const widgetRef = useRef(null);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const token = await getAuthToken(user);
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Fetch standard trades
      const stdRes = await axios.get(`${API_URL}/trades`, headers);
      if (Array.isArray(stdRes.data)) {
        setStandardTrades(stdRes.data);
      }

      // 2. Fetch contest profile
      const contestRes = await axios.get(`${API_URL}/contest/profile`, headers);
      if (contestRes.data && contestRes.data.success) {
        setContestRegistered(contestRes.data.registered);
        if (contestRes.data.registered) {
          setContestProfile(contestRes.data.profile);
          setContestBalance(parseFloat(contestRes.data.profile.balance));
          setContestTrades(contestRes.data.trades || []);
        }
      }
    } catch (err) {
      console.error("Error fetching user trading data:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user, symbol]);

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
      fetchUserData();
    });

    socketRef.current.on('contest_trade_resolved', (trade) => {
      if (!isMounted) return;
      if (trade.symbol === symbol) {
        if (chartRef.current) {
          chartRef.current.removePriceLine(trade.id);
        }
        setResolvedTrade(trade);
      }
      fetchUserData();
    });

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('live_candle');
        socketRef.current.off('trade_resolved');
        socketRef.current.off('contest_trade_resolved');
      }
    };
  }, [symbol, interval]);

  const handleTradeExecuted = (trade) => {
    if (chartRef.current) {
      chartRef.current.addPriceLine(trade.id, trade.price, trade.type);
    }
    fetchUserData();
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

  const getContractMultiplier = (sym) => {
    if (!sym) return 1;
    const cleanSymbol = sym.replace('=X', '').toUpperCase();
    if (/^[A-Z]{6}$/.test(cleanSymbol)) {
      return 100000;
    }
    return 1;
  };

  const formatMTNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0.00';
    const parts = parseFloat(num).toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
  };

  const formatPrice = (priceVal, sym) => {
    if (priceVal === undefined || priceVal === null || isNaN(priceVal)) return '0.00';
    const parsed = parseFloat(priceVal);
    const cleanSymbol = sym ? sym.replace('=X', '').toUpperCase() : '';
    if (/^[A-Z]{6}$/.test(cleanSymbol)) {
      return parsed.toFixed(5);
    }
    return parsed.toFixed(2);
  };

  // Live P&L and metrics calculations for right side panel
  const calculatePortfolioMetrics = () => {
    const activeTrades = isContest ? contestTrades : standardTrades;
    const initialCapital = isContest ? 11000 : 200000;
    
    const hasTrades = activeTrades.length > 0;
    
    let totalPnL = 0;
    let commission = 0;
    const commissionPerTrade = -150; // ₹150 commission per trade to match MT styling
    
    let totalProfit = 0;
    let totalLoss = 0;
    
    const processedTrades = activeTrades.map(t => {
      const entryPrice = parseFloat(t.price);
      const qty = parseFloat(t.quantity);
      const multiplier = getContractMultiplier(t.symbol);
      
      let currentOrClosePrice = entryPrice;
      let pnl = 0;
      const status = t.status;
      
      if (status === 'OPEN') {
        if (t.symbol === symbol && currentPrice) {
          currentOrClosePrice = currentPrice;
        }
        
        if (t.type === 'BUY') {
          pnl = (currentOrClosePrice - entryPrice) * qty * multiplier;
        } else {
          pnl = (entryPrice - currentOrClosePrice) * qty * multiplier;
        }
      } else {
        currentOrClosePrice = parseFloat(t.close_price || t.price);
        pnl = parseFloat(t.pnl || 0);
        if (!isContest) {
          // Standard closed P&L calculation
          if (t.type === 'BUY') {
            pnl = (currentOrClosePrice - entryPrice) * qty * multiplier;
          } else {
            pnl = (entryPrice - currentOrClosePrice) * qty * multiplier;
          }
        }
      }
      
      totalPnL += pnl;
      commission += commissionPerTrade;
      
      if (pnl >= 0) {
        totalProfit += pnl;
      } else {
        totalLoss += pnl;
      }
      
      return {
        ...t,
        currentOrClosePrice,
        pnl
      };
    });
    
    const deposit = hasTrades ? initialCapital : 0;
    const profit = hasTrades ? totalPnL : 0;
    const swap = 0.00;
    const finalCommission = hasTrades ? commission : 0;
    const balance = hasTrades ? (deposit + profit + swap + finalCommission) : 0;
    
    return {
      processedTrades,
      deposit,
      profit,
      swap,
      commission: finalCommission,
      balance,
      totalProfit: hasTrades ? totalProfit : 0,
      totalLoss: hasTrades ? totalLoss : 0
    };
  };

  const metrics = calculatePortfolioMetrics();

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const pad = (num) => String(num).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

      {/* Split Layout Body */}
      <div className="lc-widget-body">
        {/* Left Side: Chart Area and Buttons */}
        <div className="lc-chart-side">
          <div className="lc-chart-area">
            <TradingChart ref={chartRef} data={candles} volumeData={volumeData} />
            <TradePopup trade={resolvedTrade} onClose={() => setResolvedTrade(null)} />
          </div>

          {/* Footer Buttons */}
          <BuySellButtons 
            user={user}
            symbol={symbol} 
            currentPrice={currentPrice} 
            interval={interval} 
            onTradeExecuted={handleTradeExecuted}
            isContest={isContest}
            setIsContest={setIsContest}
            contestRegistered={contestRegistered}
            riskAmount={riskAmount}
            setRiskAmount={setRiskAmount}
            contestBalance={contestBalance}
            setContestBalance={setContestBalance}
          />
        </div>

        {/* Right Side: Real-time Portfolio Panel */}
        <div className="lc-portfolio-panel">
          <div className="lc-portfolio-header">
            <h3>{isContest ? "Tournament Portfolio" : "Standard Portfolio"}</h3>
            <span className={`lc-mode-badge ${isContest ? 'contest' : 'standard'}`}>
              {isContest ? '🏆 Tournament' : '💼 Standard'}
            </span>
          </div>

          {isContest && !contestRegistered ? (
            <div className="lc-portfolio-unregistered">
              <Trophy size={48} style={{ color: '#d9af56', marginBottom: '16px' }} />
              <h5>Tournament Locked</h5>
              <p>You have not registered for the annual contest yet.</p>
              <p style={{ fontSize: '11px', color: '#9c93a8', marginTop: '8px' }}>
                Head over to the <strong>Contest Awards</strong> tab to register and claim your ₹11,000 paper trading capital!
              </p>
            </div>
          ) : (
            <div className="lc-mt-container">
              {/* Trades List (Scrollable) */}
              <div className="lc-mt-trade-list">
                {metrics.processedTrades.map((t, index) => {
                  const isProfit = t.pnl >= 0;
                  const typeLabel = t.type.toLowerCase();
                  const qtyFormatted = parseFloat(t.quantity) % 1 === 0 
                    ? parseFloat(t.quantity).toFixed(0) 
                    : parseFloat(t.quantity).toFixed(2);
                  
                  return (
                    <div 
                      key={t.id || index} 
                      className="lc-mt-trade-item"
                      style={{ borderLeft: `4px solid ${isProfit ? '#38a3fd' : '#ff4a4a'}` }}
                    >
                      <div className="lc-mt-trade-header">
                        <span className="trade-title-left">
                          <strong>{t.symbol}</strong>{' '}
                          <span className={`trade-type ${typeLabel}`}>{typeLabel} {qtyFormatted}</span>
                        </span>
                        <span className={`trade-pnl ${isProfit ? 'positive' : 'negative'}`}>
                          {formatMTNumber(t.pnl)}
                        </span>
                      </div>
                      <div className="lc-mt-trade-sub">
                        <span className="trade-prices">
                          {formatPrice(t.price, t.symbol)} → {formatPrice(t.currentOrClosePrice, t.symbol)}
                        </span>
                        <span className="trade-date">
                          {formatDate(t.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {metrics.processedTrades.length === 0 && (
                  <div className="lc-mt-empty-state">
                    No active positions. Placed trades will track here live.
                  </div>
                )}
              </div>

              {/* Account Balance Summary Table */}
              <div className="lc-mt-summary-table">
                <div className="lc-mt-summary-row">
                  <span>Vklad (Deposit)</span>
                  <strong>{formatMTNumber(metrics.deposit)}</strong>
                </div>
                <div className="lc-mt-summary-row">
                  <span>Zisk (Profit)</span>
                  <strong className={metrics.profit > 0 ? 'positive' : (metrics.profit < 0 ? 'negative' : '')}>
                    {formatMTNumber(metrics.profit)}
                  </strong>
                </div>
                <div className="lc-mt-summary-row sub-row">
                  <span style={{ paddingLeft: '12px', fontSize: '11px', color: '#8e8e93' }}>└ Ziskové (Profit)</span>
                  <strong className="positive" style={{ fontSize: '11px' }}>{formatMTNumber(metrics.totalProfit)}</strong>
                </div>
                <div className="lc-mt-summary-row sub-row">
                  <span style={{ paddingLeft: '12px', fontSize: '11px', color: '#8e8e93' }}>└ Ztrátové (Loss)</span>
                  <strong className="negative" style={{ fontSize: '11px' }}>{formatMTNumber(metrics.totalLoss)}</strong>
                </div>
                <div className="lc-mt-summary-row">
                  <span>Swap</span>
                  <strong>{formatMTNumber(metrics.swap)}</strong>
                </div>
                <div className="lc-mt-summary-row">
                  <span>Provize (Commission)</span>
                  <strong className={metrics.commission < 0 ? 'negative' : ''}>
                    {formatMTNumber(metrics.commission)}
                  </strong>
                </div>
                <div className="lc-mt-summary-row balance-row">
                  <span>Zůstatek (Balance)</span>
                  <strong>{formatMTNumber(metrics.balance)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChartWidget;
