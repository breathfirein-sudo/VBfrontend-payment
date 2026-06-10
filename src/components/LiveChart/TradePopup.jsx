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
  const entryPrice = parseFloat(trade.price);
  const closePrice = parseFloat(trade.close_price);
  const quantity = parseFloat(trade.quantity);
  
  // Calculate PnL
  let pnl = 0;
  if (trade.type === 'BUY') pnl = (closePrice - entryPrice) * quantity;
  else if (trade.type === 'SELL') pnl = (entryPrice - closePrice) * quantity;

  // Timed binary options style fixed payout (80%) vs standard stock PnL.
  // The user asked to show "investment amount + profit amount".
  // Let's assume investment = entryPrice * quantity.
  const investment = entryPrice * quantity;
  
  // If we won, let's show an 80% binary options style profit since standard stock PnL on 1 minute is tiny.
  // Or just show real PnL if they prefer, but the prompt says "display how much profit the user earned".
  // Let's use real absolute PnL to be safe and accurate to the math.
  const absolutePnl = Math.abs(pnl).toFixed(2);
  const totalReturn = (investment + Math.abs(pnl)).toFixed(2);

  return (
    <div className={`lc-trade-popup ${visible ? 'show' : ''} ${isWin ? 'win' : 'loss'}`}>
      <div className="lc-popup-content">
        {isWin ? (
          <>
            <div className="lc-popup-emoji">😊</div>
            <div className="lc-popup-title">Trade Won!</div>
            <div className="lc-popup-details">
              <p className="lc-profit-text">+${absolutePnl} Profit</p>
              <p className="lc-total-text">Total Return: ${totalReturn}</p>
            </div>
          </>
        ) : (
          <>
            <div className="lc-popup-emoji">😔</div>
            <div className="lc-popup-title">Trade Lost</div>
            <div className="lc-popup-details">
              <p className="lc-loss-text">-${absolutePnl} Loss</p>
            </div>
          </>
        )}
      </div>
      <button className="lc-popup-close" onClick={handleClose}>×</button>
    </div>
  );
};

export default TradePopup;
