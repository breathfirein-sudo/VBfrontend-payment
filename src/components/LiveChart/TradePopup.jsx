import React, { useEffect, useState } from 'react';

const TradePopup = ({ trade, onClose }) => {
  const [visible, setVisible] = useState(false);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for CSS fade out before unmounting
  };

  useEffect(() => {
    if (trade) {
      setVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [trade?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!trade) return null;

  const isWin = trade.status === 'WON';
  const isLoss = trade.status === 'LOST';
  const isTie = trade.status === 'TIE';
  const isRejected = trade.status === 'REJECTED';

  const entryPrice = parseFloat(trade.price);
  const closePrice = parseFloat(trade.close_price || trade.price);
  const quantity = parseFloat(trade.quantity);

  const getContractMultiplier = (sym) => {
    if (!sym) return 1;
    const cleanSymbol = sym.replace('=X', '').toUpperCase();
    if (/^[A-Z]{6}$/.test(cleanSymbol)) {
      return 100000;
    }
    return 1;
  };

  const isContest = trade.entry_amount !== undefined;
  
  // Calculate PnL for contest, or retrieve database fields for standard
  let pnl = 0;
  if (isContest) {
    pnl = parseFloat(trade.pnl || 0);
  } else {
    pnl = parseFloat(trade.profit_loss_amount !== undefined && trade.profit_loss_amount !== null ? trade.profit_loss_amount : (trade.pnl || 0));
  }

  const borderBottomColor = isWin ? '#10b981' : (isLoss ? '#ef4444' : isRejected ? '#f59e0b' : '#9c93a8');

  const renderStandardBreakdown = () => {
    const investment = parseFloat(trade.investment_amount || 100);
    const stake = parseFloat(trade.trade_stake || 10);
    const fee = parseFloat(trade.application_fee || 1);
    const returned = parseFloat(trade.returned_amount || 0);
    const profitLoss = pnl;
    
    const color = isWin ? '#10b981' : (isLoss ? '#ef4444' : isRejected ? '#f59e0b' : '#9c93a8');
    const titleText = isWin ? 'Trade Won!' : (isLoss ? 'Trade Lost' : isRejected ? 'Trade Rejected' : 'Trade Tied');
    const emoji = isWin ? '🎉' : (isLoss ? '📉' : isRejected ? '🚫' : '🤝');

    return (
      <>
        <div className="lc-popup-emoji">{emoji}</div>
        <div className="lc-popup-title" style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold', marginBottom: '14px' }}>
          {titleText}
        </div>
        
        {isRejected && (
          <div style={{ 
            color: '#f59e0b', 
            fontSize: '12.5px', 
            marginBottom: '12px', 
            textAlign: 'center', 
            fontWeight: 'bold', 
            padding: '6px 10px', 
            background: 'rgba(245, 158, 11, 0.08)', 
            border: '1px solid rgba(245, 158, 11, 0.2)', 
            borderRadius: '6px' 
          }}>
            Trade was rejected because the price remained constant.
          </div>
        )}
        
        <div className="lc-popup-details-box" style={{
          width: '100%',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          padding: '12px',
          boxSizing: 'border-box',
          marginBottom: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '13px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8' }}>Symbol:</span>
            <strong style={{ color: '#ffffff' }}>{trade.symbol} ({trade.type})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8' }}>Price Path:</span>
            <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>
              {entryPrice.toFixed(2)} → {closePrice.toFixed(2)}
            </span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8' }}>Entered Investment:</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>₹{investment.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8' }}>Trade Stake / Fee:</span>
            <span style={{ color: '#ffffff' }}>₹{stake.toFixed(2)} / ₹{fee.toFixed(2)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8' }}>Payout (Returned):</span>
            <span style={{ color: '#ffffff', fontWeight: 'bold' }}>₹{returned.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8' }}>Wallet Before:</span>
            <span style={{ color: '#ffffff' }}>₹{parseFloat(trade.wallet_balance_before || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8' }}>Wallet After:</span>
            <span style={{ color: '#ffffff' }}>₹{parseFloat(trade.wallet_balance_after || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span style={{ color: '#9c93a8', fontWeight: 600 }}>Net P&L:</span>
            <strong style={{ color: color, fontSize: '14px' }}>
              {profitLoss >= 0 ? '+' : ''}₹{profitLoss.toFixed(2)}
            </strong>
          </div>
        </div>
      </>
    );
  };

  const renderContestBreakdown = () => {
    const investment = parseFloat(trade.entry_amount || 100);
    const profitLoss = pnl;
    const color = isWin ? '#10b981' : (isLoss ? '#ef4444' : '#9c93a8');
    const titleText = isWin ? 'Tournament Trade Won!' : (isLoss ? 'Tournament Trade Lost' : 'Tournament Trade Tied');
    const emoji = isWin ? '🏆' : (isLoss ? '📉' : '🤝');

    return (
      <>
        <div className="lc-popup-emoji">{emoji}</div>
        <div className="lc-popup-title" style={{ color: '#d9af56', fontSize: '18px', fontWeight: 'bold', marginBottom: '14px' }}>
          {titleText}
        </div>
        
        <div className="lc-popup-details-box" style={{
          width: '100%',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          padding: '12px',
          boxSizing: 'border-box',
          marginBottom: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '13px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8' }}>Symbol:</span>
            <strong style={{ color: '#ffffff' }}>{trade.symbol} ({trade.type})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8' }}>Price Path:</span>
            <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>
              {entryPrice.toFixed(2)} → {closePrice.toFixed(2)}
            </span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8' }}>Risked Amount:</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>₹{investment.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9c93a8', fontWeight: 600 }}>Profit/Loss:</span>
            <strong style={{ color: color }}>
              {profitLoss >= 0 ? '+' : ''}₹{profitLoss.toFixed(2)}
            </strong>
          </div>
        </div>
      </>
    );
  };

  return (
    <div 
      className={`lc-trade-popup ${visible ? 'show' : ''}`}
      style={{ borderBottom: `3px solid ${borderBottomColor}` }}
    >
      <div className="lc-popup-content">
        {isContest ? renderContestBreakdown() : renderStandardBreakdown()}
      </div>
      <button className="lc-popup-close" onClick={handleClose}>×</button>
    </div>
  );
};

export default TradePopup;
