import React, { useState } from 'react';
import axios from 'axios';

const BuySellButtons = ({ symbol, currentPrice, interval, onTradeExecuted }) => {
  const [loading, setLoading] = useState(false);

  const handleTrade = async (type) => {
    if (!currentPrice) {
      alert('Waiting for price feed...');
      return;
    }
    
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/' + type.toLowerCase(), {
        symbol,
        price: currentPrice,
        quantity: 1,
        interval
      });
      // Pass the executed trade to the parent to draw the line immediately
      if (onTradeExecuted) {
        onTradeExecuted(res.data);
      }
    } catch (error) {
      console.error('Trade failed:', error);
      alert('Trade failed to execute (is the backend running?)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lc-buy-sell-container">
      <button 
        className="lc-btn-buy" 
        onClick={() => handleTrade('BUY')}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Buy'}
      </button>
      <button 
        className="lc-btn-sell" 
        onClick={() => handleTrade('SELL')}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Sell'}
      </button>
    </div>
  );
};

export default BuySellButtons;
