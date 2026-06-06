import React, { useState } from 'react';
import axios from 'axios';
import { getAuthToken } from '../../utils/authHelper';

const BuySellButtons = ({ 
  user,
  symbol, 
  currentPrice, 
  interval, 
  onTradeExecuted,
  isContest,
  setIsContest,
  contestRegistered,
  riskAmount,
  setRiskAmount,
  contestBalance,
  setContestBalance
}) => {
  const [loading, setLoading] = useState(false);
  const [standardQuantity, setStandardQuantity] = useState('50');

  const getAuthHeaders = async () => {
    const token = await getAuthToken(user);
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const handleTrade = async (type) => {
    if (!currentPrice) {
      alert('Waiting for price feed...');
      return;
    }

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      
      if (isContest) {
        const amt = 100;
        if (isNaN(amt) || amt <= 0) {
          alert('Please enter a valid risk amount.');
          setLoading(false);
          return;
        }

        if (contestBalance < amt) {
          alert(`Insufficient contest balance! You only have ₹${contestBalance.toLocaleString()} remaining.`);
          setLoading(false);
          return;
        }

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await axios.post(`${backendUrl}/api/contest/trade`, {
          symbol,
          price: currentPrice,
          type,
          entryAmount: amt,
          interval
        }, headers);

        if (res.data.success) {
          alert(`Contest Trade executed successfully! Risked ₹${amt} on ${symbol} (${type}).`);
          setContestBalance(prev => prev - amt);
          if (onTradeExecuted) {
            onTradeExecuted(res.data.trade);
          }
        }
      } else {
        const amt = 100;
        const qty = amt / currentPrice;
        
        // Standard paper trade with authentication scoping
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await axios.post(`${backendUrl}/api/` + type.toLowerCase(), {
          symbol,
          price: currentPrice,
          quantity: qty,
          interval
        }, headers);
        
        if (onTradeExecuted) {
          onTradeExecuted(res.data);
        }
      }
    } catch (error) {
      console.error('Trade failed:', error);
      alert(error.response?.data?.error || 'Trade failed to execute. Verify the backend service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {contestRegistered && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#d9af56', fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              checked={isContest} 
              onChange={(e) => setIsContest(e.target.checked)} 
              style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#d9af56' }}
            />
            🏆 Place Contest Trade
          </label>
          {isContest && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#9c93a8' }}>Risk Amount:</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '8px', color: '#9c93a8', fontSize: '12px' }}>₹</span>
                <input 
                  type="number" 
                  value="100"
                  readOnly
                  style={{ 
                    background: '#120524', 
                    color: '#ffffff', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '6px', 
                    padding: '4px 8px 4px 18px', 
                    width: '80px', 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'not-allowed',
                    opacity: 0.8
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>(Bal: ₹{contestBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })})</span>
            </div>
          )}
        </div>
      )}
      
      {!isContest && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 'bold' }}>Standard Mode</span>
        </div>
      )}

      <div className="lc-buy-sell-container" style={{ display: 'flex', gap: '10px' }}>
        <button 
          className="lc-btn-buy" 
          onClick={() => handleTrade('BUY')}
          disabled={loading}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
        >
          {loading ? 'Processing...' : 'Buy'}
        </button>
        <button 
          className="lc-btn-sell" 
          onClick={() => handleTrade('SELL')}
          disabled={loading}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
        >
          {loading ? 'Processing...' : 'Sell'}
        </button>
      </div>
    </div>
  );
};

export default BuySellButtons;
