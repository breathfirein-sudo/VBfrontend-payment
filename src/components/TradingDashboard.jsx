import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import socket from '../services/socketClient';
import useTradingStore from '../store/useTradingStore';
import RealTimeChart from '../charts/RealTimeChart';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const TradingDashboard = () => {
  const [activeAsset, setActiveAsset] = useState('gold');
  const [tradeSize, setTradeSize] = useState(2500);
  const [side, setSide] = useState('buy');
  const [duration, setDuration] = useState(60);
  const [notifications, setNotifications] = useState([]);
  const [resultMessage, setResultMessage] = useState('');

  const {
    wallet,
    market,
    openTrades,
    closedTrades,
    transactions,
    setWallet,
    mergeMarket,
    setOpenTrades,
    setClosedTrades,
    setTransactions,
    setConnectionStatus,
    addTransaction,
    addOpenTrade,
    addClosedTrade,
    appendCandle,
  } = useTradingStore();

  const activeCandles = useMemo(() => market.candles[activeAsset] || [], [activeAsset, market.candles]);
  const activePrice = market.prices[activeAsset]?.price || 0;

  const pushNotification = (message) => {
    setNotifications((current) => [message, ...current].slice(0, 5));
  };

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => setConnectionStatus('online'));
    socket.on('disconnect', () => setConnectionStatus('offline'));

    socket.on('market:init', (payload) => {
      mergeMarket(payload);
    });

    socket.on('market:update', (payload) => {
      mergeMarket({ prices: payload.prices, status: payload.status });
    });

    socket.on('candle:update', ({ assetId, candle }) => {
      appendCandle(assetId, candle);
    });

    socket.on('wallet:init', setWallet);
    socket.on('trade:init', (payload) => {
      setOpenTrades(payload.openTrades || []);
      setClosedTrades(payload.closedTrades || []);
      setTransactions(payload.transactions || []);
    });

    socket.on('trade:open', ({ trade, wallet: updatedWallet, transaction }) => {
      addOpenTrade(trade);
      setWallet(updatedWallet);
      if (transaction) addTransaction(transaction);
      pushNotification(`Opened ${trade.side.toUpperCase()} ${trade.asset}`);
    });

    socket.on('trade:close', ({ trade, wallet: updatedWallet, transaction }) => {
      setOpenTrades((current) => current.filter((item) => item.id !== trade.id));
      addClosedTrade(trade);
      setWallet(updatedWallet);
      if (transaction) addTransaction(transaction);
      setResultMessage(`Trade closed ${trade.result.toUpperCase()} • PnL ${formatCurrency(trade.pnl)}`);
      pushNotification(`Closed ${trade.asset} ${trade.result.toUpperCase()}`);
    });

    socket.on('wallet:update', setWallet);
    socket.on('connect_error', (error) => pushNotification(`Socket error: ${error.message}`));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [setConnectionStatus, mergeMarket, setWallet, setOpenTrades, setClosedTrades, setTransactions, addOpenTrade, addClosedTrade, addTransaction, appendCandle]);

  const executeTrade = (selectedSide) => {
    socket.emit('trade:execute', { asset: activeAsset, side: selectedSide, amount: tradeSize, duration, leverage: 1 }, (response) => {
      if (!response?.success) {
        pushNotification(response?.message || 'Trade failed');
      } else {
        pushNotification(`Trade request accepted for ${activeAsset}`);
      }
    });
  };

  const updateAsset = (asset) => {
    setActiveAsset(asset);
    setResultMessage('');
  };

  const walletCards = [
    { label: 'Balance', value: wallet.balance },
    { label: 'Locked', value: wallet.locked },
    { label: 'Daily PnL', value: wallet.dailyPnL, positive: wallet.dailyPnL >= 0 },
    { label: 'Win Rate', value: `${wallet.winRate}%` },
  ];

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Luxury Commodity Paper Trading</p>
          <h1>Dark Market Intelligence</h1>
        </div>
        <div className="status-pill">Live: {market.status}</div>
      </header>

      <div className="trade-dashboard-grid">
        <motion.section className="chart-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="panel-title">
            <div>
              <span className="label">Market stream</span>
              <h2>{activeAsset.toUpperCase()} price action</h2>
            </div>
            <button type="button" onClick={() => pushNotification('Refreshing live feed')}>
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
          <RealTimeChart candles={activeCandles} />
          <div className="market-footer">
            <div>
              <span className="small-label">Price</span>
              <strong>{formatCurrency(activePrice)}</strong>
            </div>
            <div className="asset-tabs">
              {market.assets.map((asset) => (
                <button key={asset} className={asset === activeAsset ? 'active' : ''} onClick={() => updateAsset(asset)}>
                  {asset.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="order-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="panel-title">
            <div>
              <span className="label">Trade ticket</span>
              <h2>Execute a paper trade</h2>
            </div>
            <div className="pill">Wallet {formatCurrency(wallet.balance)}</div>
          </div>

          <div className="trade-controls">
            <div className="control-row">
              <label>Order size</label>
              <input type="range" min="100" max="10000" step="100" value={tradeSize} onChange={(e) => setTradeSize(Number(e.target.value))} />
              <strong>{formatCurrency(tradeSize)}</strong>
            </div>
            <div className="order-actions">
              <button className="buy" type="button" onClick={() => executeTrade('buy')}>
                <TrendingUp size={16} /> BUY
              </button>
              <button className="sell" type="button" onClick={() => executeTrade('sell')}>
                <TrendingDown size={16} /> SELL
              </button>
            </div>
            <div className="trade-meta">
              <label>Duration</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                <option value={30}>30 sec</option>
                <option value={60}>60 sec</option>
                <option value={120}>120 sec</option>
              </select>
            </div>
            <div className="trade-summary">
              <span>Estimated exposure</span>
              <strong>{formatCurrency(tradeSize * 1)}</strong>
            </div>
            {resultMessage && <div className="trade-result">{resultMessage}</div>}
          </div>
        </motion.section>

        <motion.aside className="analytics-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="panel-title">
            <div>
              <span className="label">Performance</span>
              <h2>Portfolio overview</h2>
            </div>
            <button type="button" onClick={() => pushNotification('Syncing wallet snapshot')}>
              <ArrowRight size={18} /> Sync
            </button>
          </div>

          <div className="wallet-grid">
            {walletCards.map((card) => (
              <article key={card.label} className="wallet-card">
                <span>{card.label}</span>
                <strong className={card.positive === false ? 'negative' : ''}>{card.value}</strong>
              </article>
            ))}
          </div>

          <div className="history-panel">
            <h3>Recent activity</h3>
            <ul>
              {transactions.slice(0, 5).map((entry) => (
                <li key={entry.id || `${entry.type}-${entry.timestamp}`}>
                  <span>{entry.type || 'Trade'}</span>
                  <strong>{entry.asset ? `${entry.asset.toUpperCase()} ${entry.result || ''}` : formatCurrency(entry.amount)}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="notifications-panel">
            <h3>Signal feed</h3>
            <ul>
              {notifications.map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          </div>
        </motion.aside>
      </div>
    </div>
  );
};

export default TradingDashboard;
