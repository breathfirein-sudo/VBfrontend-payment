import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getAuthToken } from './utils/authHelper';
import { 
  Trophy, 
  HelpCircle, 
  TrendingUp, 
  Activity, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Wallet,
  Star
} from 'lucide-react';
import './ContestAwards.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://hour-60kr.onrender.com');
const API_BASE_URL = `${BACKEND_URL}/api/contest`;
const SOCKET_URL = BACKEND_URL;

const ContestAwards = ({ user, rates, walletBalance, onTradeRedirect }) => {
  const [profile, setProfile] = useState(null);
  const [trades, setTrades] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const socketRef = useRef(null);

  const getAuthHeaders = async () => {
    const token = await getAuthToken(user);
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchContestData = async () => {
    try {
      const headers = await getAuthHeaders();
      
      // 1. Fetch user contest profile
      const profileRes = await fetch(`${API_BASE_URL}/profile`, headers);
      const profileData = await profileRes.json();
      
      if (profileData.success) {
        setRegistered(profileData.registered);
        if (profileData.registered) {
          setProfile(profileData.profile);
          setTrades(profileData.trades || []);
        }
      }

      // 2. Fetch global leaderboard
      const lbRes = await fetch(`${API_BASE_URL}/leaderboard`, headers);
      const lbData = await lbRes.json();
      if (lbData.success) {
        setLeaderboard(lbData.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching contest data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers.headers
        }
      });
      const data = await res.json();
      if (data.success) {
        setRegistered(true);
        await fetchContestData();
      } else {
        alert(data.error || "Failed to register for contest.");
      }
    } catch (error) {
      console.error("Error registering for contest:", error);
      alert("Failed to connect to server.");
    } finally {
      setSubmitting(false);
    }
  };

  // Poll leaderboard every 10 seconds for live updates
  useEffect(() => {
    fetchContestData();

    // Establish Socket.io connection for live resolution notifications
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('contest_trade_resolved', (resolvedTrade) => {
      // If the resolved trade belongs to the current user, refresh profile & trade feed
      if (user && resolvedTrade.user_email === user.email.toLowerCase()) {
        fetchContestData();
      }
    });

    const lbInterval = setInterval(async () => {
      try {
        const headers = await getAuthHeaders();
        const lbRes = await fetch(`${API_BASE_URL}/leaderboard`, headers);
        const lbData = await lbRes.json();
        if (lbData.success) {
          setLeaderboard(lbData.leaderboard || []);
        }
      } catch (e) {
        console.error("Error polling leaderboard:", e.message);
      }
    }, 10000);

    return () => {
      clearInterval(lbInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const getQualifyingPrize = (successRate, totalTrades) => {
    if (totalTrades < 365) return "Not Qualified (Need 365 Trades)";
    if (successRate >= 80) return "🥇 1st Prize (₹1,00,000)";
    if (successRate >= 70) return "🥈 2nd Prize (₹50,000)";
    if (successRate >= 60) return "🥉 3rd Prize (₹25,000)";
    return "No Prize (Needs 60%+ success)";
  };

  const getQualifyingPrizeTag = (successRate, totalTrades) => {
    if (totalTrades < 365) return <span className="qualify-tag none">Unqualified</span>;
    if (successRate >= 80) return <span className="qualify-tag first">1st Prize</span>;
    if (successRate >= 70) return <span className="qualify-tag second">2nd Prize</span>;
    if (successRate >= 60) return <span className="qualify-tag third">3rd Prize</span>;
    return <span className="qualify-tag none">No Reward</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '15px' }}>
        <div className="gold-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(217,175,86,0.1)', borderTop: '3px solid #d9af56', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#9c93a8', fontSize: '14px' }}>Loading Contest Records...</p>
      </div>
    );
  }

  if (registered && !profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '15px' }}>
        <div className="gold-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(217,175,86,0.1)', borderTop: '3px solid #d9af56', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#9c93a8', fontSize: '14px' }}>Preparing Contest Account Stats...</p>
      </div>
    );
  }

  return (
    <div className="contest-dashboard-container">
      
      {/* 1. Public Info & Prizes Grid */}
      <div>
        <h3 className="prize-section-title">
          <Trophy size={20} color="#d9af56" /> Annual Contest Rewards Pool
        </h3>
        <div className="prize-cards-container">
          
          <div className="prize-card gold-border">
            <span className="prize-badge">🥇</span>
            <div className="prize-title">1st Prize Winner</div>
            <div className="prize-reward gold-text">₹1,00,000</div>
            <div className="prize-requirement">Around 80% Success Rate</div>
            <div style={{ fontSize: '11px', color: '#9c93a8', marginTop: '8px' }}>~292 profitable trades out of 365</div>
          </div>

          <div className="prize-card">
            <span className="prize-badge">🥈</span>
            <div className="prize-title">2nd Prize Winner</div>
            <div className="prize-reward">₹50,000</div>
            <div className="prize-requirement">Around 70% Success Rate</div>
            <div style={{ fontSize: '11px', color: '#9c93a8', marginTop: '8px' }}>~255 profitable trades out of 365</div>
          </div>

          <div className="prize-card">
            <span className="prize-badge">🥉</span>
            <div className="prize-title">3rd Prize Winner</div>
            <div className="prize-reward">₹25,000</div>
            <div className="prize-requirement">Around 60% Success Rate</div>
            <div style={{ fontSize: '11px', color: '#9c93a8', marginTop: '8px' }}>~219 profitable trades out of 365</div>
          </div>

        </div>
      </div>

      {/* 2. Registration Overlay OR User Progress Dashboard */}
      {!registered ? (
        <div className="registration-cta-card">
          <h2>Join the Annual Paper Trading Tournament</h2>
          <p>
            Prove your trading prowess. Complete a minimum of 365 trades throughout the year. Secure a success rate of 60% or higher and become eligible for cash awards of up to ₹1,00,000 (1 Lakh).
          </p>
          <button 
            type="button" 
            className="btn-register-contest"
            onClick={handleRegister}
            disabled={submitting}
          >
            {submitting ? 'Registering Account...' : '🏆 Register for Contest'}
          </button>
        </div>
      ) : (
        <>
          {/* Hero Stats Card */}
          <div className="contest-hero-card">
            <div className="contest-hero-info">
              <h2>Your Contest Account Overview</h2>
              <p>Your performance calculations, eligibility status, and paper trading wallet metrics are updated below in real time.</p>
              <div className="contest-hero-meta">
                <span className="plan-badge">
                  Active Plan: Standard
                </span>
                <span className="registered-date">
                  <Clock size={14} /> Registered: {profile?.registered_at ? new Date(profile.registered_at).toLocaleDateString() : ''}
                </span>
              </div>
            </div>

            <div className="contest-stat-box">
              <div className="contest-stat-label">Contest Balance</div>
              <div className="contest-stat-value gold">
                ₹{parseFloat(walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="contest-stat-box">
              <div className="contest-stat-label">Success Rate</div>
              <div className="contest-stat-value green">
                {parseFloat(profile?.success_rate || 0).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* User Eligibility Progress Tracker */}
          <div className="contest-progress-section">
            <div className="progress-header-row">
              <div className="progress-title">
                <Activity size={16} color="#a855f7" /> 
                Annual Trade Requirement Completion Progress
              </div>
              <div className="progress-pct">
                {profile?.total_trades || 0} / 365 trades ({Math.min(100, Math.round(((profile?.total_trades || 0) / 365) * 100))}% completed)
              </div>
            </div>
            
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${Math.min(100, ((profile?.total_trades || 0) / 365) * 100)}%` }}
              ></div>
            </div>

            <div className="progress-milestones">
              <span>0 <span className="milestone-detail">Trades (Start)</span></span>
              <span className="milestone-mid">100 <span className="milestone-detail">Trades</span></span>
              <span className="milestone-mid">200 <span className="milestone-detail">Trades</span></span>
              <span className="milestone-mid">300 <span className="milestone-detail">Trades</span></span>
              <span>365 <span className="milestone-detail">Trades (Qualification Line)</span></span>
            </div>

            <div className="progress-status-footer">
              <div className="status-text-left">
                <strong>Current Status:</strong> {(profile?.total_trades || 0) < 365 ? (
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Needs {365 - (profile?.total_trades || 0)} more trades to qualify</span>
                ) : (
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>Trades Requirement Met! Qualified for Prizes</span>
                )}
              </div>
              <div className="status-text-right">
                Projected Reward: {getQualifyingPrize(parseFloat(profile?.success_rate || 0), profile?.total_trades || 0)}
              </div>
            </div>
          </div>

          {/* Leaderboard and Live Feed splits */}
          <div className="contest-grid-2col">
            
            {/* Leaderboard Panel */}
            <div className="leaderboard-panel">
              <div className="leaderboard-header-row">
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Tournament Leaderboard</h3>
                <span className="live-dot-indicator">
                  <span className="live-dot"></span> Live Rates
                </span>
              </div>
              
              <div className="leaderboard-table-container">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Trader</th>
                      <th>Trades</th>
                      <th>Win Rate</th>
                      <th>Prize</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((trader) => {
                      const isCurrentUser = trader.name === profile?.name;
                      let rankBadgeClass = 'rank-badge other';
                      if (trader.rank === 1) rankBadgeClass = 'rank-badge gold';
                      else if (trader.rank === 2) rankBadgeClass = 'rank-badge silver';
                      else if (trader.rank === 3) rankBadgeClass = 'rank-badge bronze';

                      return (
                        <tr key={trader.email} className={isCurrentUser ? 'leaderboard-row-highlight' : ''}>
                          <td>
                            <span className={rankBadgeClass}>{trader.rank}</span>
                          </td>
                          <td style={{ fontWeight: isCurrentUser ? 800 : 'normal', color: isCurrentUser ? '#d9af56' : '#ffffff' }}>
                            {trader.name} {isCurrentUser && ' (You)'}
                          </td>
                          <td>{trader.totalTrades} / 365</td>
                          <td style={{ color: '#10b981', fontWeight: 600 }}>{trader.successRate.toFixed(1)}%</td>
                          <td>{getQualifyingPrizeTag(trader.successRate, trader.totalTrades)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Trade log panel */}
            <div className="contest-trades-panel">
              <div className="trades-panel-header">
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Your Contest Trades</h3>
                <button 
                  type="button" 
                  onClick={onTradeRedirect}
                  className="btn-place-contest-trade"
                >
                  Place Contest Trade <ArrowRight size={14} />
                </button>
              </div>

              <div className="activity-ledger-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="ledger-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Type</th>
                      <th>Entry Price</th>
                      <th>Risk Amount</th>
                      <th>Close Price</th>
                      <th>P&L</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const isWin = trade.status === 'WON';
                      const isLoss = trade.status === 'LOST';
                      
                      return (
                        <tr key={trade.id}>
                          <td style={{ fontWeight: 700 }}>{trade.symbol}</td>
                          <td>
                            <span style={{ color: trade.type === 'BUY' ? '#10b981' : '#f43f5e', fontWeight: 600, fontSize: '11px' }}>
                              {trade.type}
                            </span>
                          </td>
                          <td>₹{parseFloat(trade.price).toFixed(2)}</td>
                          <td>₹{parseFloat(trade.entry_amount).toLocaleString()}</td>
                          <td>{trade.close_price ? `₹${parseFloat(trade.close_price).toFixed(2)}` : '-'}</td>
                          <td style={{ color: isWin ? '#10b981' : (isLoss ? '#ef4444' : '#ffffff'), fontWeight: 700 }}>
                            {isWin ? '+' : ''}{trade.status !== 'OPEN' ? `₹${parseFloat(trade.pnl).toLocaleString()}` : '-'}
                          </td>
                          <td>
                            <span className={`status-text ${trade.status.toLowerCase()}`}>
                              {trade.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {trades.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#7a708a' }}>
                          No contest trades placed yet. Go to the Trading Chart and place your first contest trade!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default ContestAwards;
