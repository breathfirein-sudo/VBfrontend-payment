import React, { useState, useEffect } from 'react';
import './AboutUs.css';
import { ShieldCheck, Gem, Coins, Lock, ArrowRight, Globe, X } from 'lucide-react';
import { metals } from './metals';

const TrendingBarChart = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 20v-4" />
    <path d="M12 20v-8" />
    <path d="M18 20v-12" />
    <path d="M4 16l14-12" />
    <path d="M14 4h4v4" />
  </svg>
);

const QUICK_AMOUNTS = [500, 1000, 5000, 10000];

export default function AboutUs({
  rates = {},
  holdings = {},
  walletBalance = 0,
  isLoggedIn = false,
  onRequireAuth,
  onTradeRequest,
}) {
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [tradeAction, setTradeAction] = useState('buy');
  const [rupees, setRupees] = useState('');
  const [grams, setGrams] = useState('');

  const closeTrade = () => {
    setSelectedMetal(null);
    setRupees('');
    setGrams('');
    setTradeAction('buy');
  };

  const pricePerGram = selectedMetal && rates[selectedMetal.assetId]
    ? rates[selectedMetal.assetId].price
    : 0;

  const ownedGrams = selectedMetal ? (holdings[selectedMetal.assetId] ?? 0) : 0;

  const calcGrams = (rVal) => {
    if (!rVal || isNaN(rVal) || !pricePerGram) return '';
    return (parseFloat(rVal) / pricePerGram).toFixed(4);
  };

  const calcRupees = (gVal) => {
    if (!gVal || isNaN(gVal) || !pricePerGram) return '';
    return (parseFloat(gVal) * pricePerGram).toFixed(2);
  };

  useEffect(() => {
    if (!selectedMetal) return;
    if (rupees) setGrams(calcGrams(rupees));
    else if (grams) setRupees(calcRupees(grams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMetal?.assetId, pricePerGram]);

  const handleCardClick = (metal) => {
    setSelectedMetal(metal);
    setTradeAction('buy');
    setRupees('');
    setGrams('');
  };

  const handleRupeesChange = (val) => {
    setRupees(val);
    setGrams(val === '' ? '' : calcGrams(val));
  };

  const handleGramsChange = (val) => {
    setGrams(val);
    setRupees(val === '' ? '' : calcRupees(val));
  };

  const handleSubmitTrade = () => {
    const finalRupees = parseFloat(rupees) || 0;
    const finalGrams = parseFloat(grams) || 0;

    if (finalRupees <= 0 || finalGrams <= 0) {
      alert('Please enter a valid amount or weight.');
      return;
    }

    if (!isLoggedIn) {
      onRequireAuth?.();
      return;
    }

    const gst = finalRupees * 0.18;
    const totalPayable = tradeAction === 'buy' ? finalRupees + gst : finalRupees;

    if (tradeAction === 'buy' && walletBalance < totalPayable) {
      alert('Insufficient funds in your vault wallet. Please deposit funds first.');
      return;
    }

    if (tradeAction === 'sell' && ownedGrams < finalGrams) {
      alert(`Insufficient metal weight. You only own ${ownedGrams}g of ${selectedMetal.name}.`);
      return;
    }

    onTradeRequest?.({
      asset: selectedMetal.assetId,
      metalName: selectedMetal.name,
      action: tradeAction,
      weight: finalGrams,
      rate: pricePerGram,
      subtotal: finalRupees,
      gst,
      total: totalPayable,
    });
    closeTrade();
  };

  return (
    <div className="about-us-container">
      <div className="about-us-content">

        <div className="about-header">
          <div className="subtitle-pill">
            <Gem size={14} className="pill-icon" />
            INVEST IN PRECIOUS POSSIBILITIES
            <Gem size={14} className="pill-icon" />
          </div>

          <h1 className="main-title">THE WORLD&apos;S MOST VALUABLE METALS</h1>

          <div className="elements-subtitle">
            <span className="line-deco"></span>
            29 ELEMENTS. ENDLESS OPPORTUNITIES.
            <span className="line-deco"></span>
          </div>
          <p className="metals-hint">Click any element to buy or sell at the live market rate</p>
        </div>

        <div className="features-row top-features">
          <div className="feature-item">
            <div className="feature-icon"><ShieldCheck size={24} strokeWidth={1.5} /></div>
            <div className="feature-text">
              <h4>SECURE YOUR WEALTH</h4>
              <p>Invest in globally trusted metals</p>
            </div>
          </div>
          <div className="feature-separator"></div>
          <div className="feature-item">
            <div className="feature-icon"><TrendingBarChart size={24} /></div>
            <div className="feature-text">
              <h4>DIVERSIFY SMARTLY</h4>
              <p>Spread risk. Strengthen future.</p>
            </div>
          </div>
          <div className="feature-separator"></div>
          <div className="feature-item">
            <div className="feature-icon"><Gem size={24} strokeWidth={1.5} /></div>
            <div className="feature-text">
              <h4>BUILT TO LAST</h4>
              <p>Timeless value. Forever.</p>
            </div>
          </div>
          <div className="feature-separator"></div>
          <div className="feature-item">
            <div className="feature-icon"><Coins size={24} strokeWidth={1.5} /></div>
            <div className="feature-text">
              <h4>LIQUID & ACCESSIBLE</h4>
              <p>Easy to buy, sell & trade online.</p>
            </div>
          </div>
        </div>

        <div className="metals-grid">
          {metals.map((metal) => (
            <button
              key={metal.no}
              type="button"
              className={`metal-card ${metal.group} ${selectedMetal?.no === metal.no ? 'selected' : ''}`}
              onClick={() => handleCardClick(metal)}
              aria-label={`Trade ${metal.name}`}
            >
              <div className="metal-no">{metal.no}</div>
              <div className="metal-symbol">{metal.symbol}</div>
              <div className="metal-name">{metal.name}</div>
              <div className={`metal-image placeholder-${metal.group}`} />
              <div className="metal-type">{metal.type}</div>
              {rates[metal.assetId] && (
                <div className="metal-live-price">
                  ₹{rates[metal.assetId].price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g
                </div>
              )}
              <div className="glow-effect"></div>
            </button>
          ))}
        </div>

        <div className="bottom-section">
          <div className="side-features">
            <div className="feature-item small">
              <div className="feature-icon small"><ShieldCheck size={20} strokeWidth={1.5} /></div>
              <div className="feature-text">
                <h4>INTRINSIC VALUE</h4>
                <p>Metals that stand<br/>the test of time.</p>
              </div>
            </div>
            <div className="feature-item small">
              <div className="feature-icon small"><Globe size={20} strokeWidth={1.5} /></div>
              <div className="feature-text">
                <h4>GLOBAL DEMAND</h4>
                <p>Powering industries.<br/>Driving economies.</p>
              </div>
            </div>
          </div>

          <div className="cta-box">
            <h4>START YOUR INVESTMENT JOURNEY TODAY</h4>
            <p>Invest in purity. Invest in progress.</p>
            <button type="button" className="cta-btn" onClick={() => onRequireAuth?.()}>
              EXPLORE NOW <ArrowRight size={16} />
            </button>
          </div>

          <div className="side-features">
            <div className="feature-item small">
              <div className="feature-icon small"><Lock size={20} strokeWidth={1.5} /></div>
              <div className="feature-text">
                <h4>PORTFOLIO PROTECTION</h4>
                <p>Hedge against inflation.<br/>Secure your future.</p>
              </div>
            </div>
            <div className="feature-item small">
              <div className="feature-icon small"><Coins size={20} strokeWidth={1.5} /></div>
              <div className="feature-text">
                <h4>LIQUID & ACCESSIBLE</h4>
                <p>Easy to buy, sell &<br/>trade online.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedMetal && (
        <div className="metal-trade-overlay" onClick={closeTrade} role="presentation">
          <div
            className="metal-trade-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="metal-trade-title"
          >
            <button type="button" className="metal-trade-close" onClick={closeTrade} aria-label="Close">
              <X size={20} />
            </button>

            <div className="metal-trade-header">
              <span className="metal-trade-symbol">{selectedMetal.symbol}</span>
              <div>
                <h3 id="metal-trade-title">{selectedMetal.name}</h3>
                <p className="metal-trade-type">{selectedMetal.type}</p>
              </div>
            </div>

            <div className="metal-trade-live-rate">
              <span className="live-dot"></span>
              Live: ₹{pricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g
            </div>
            {isLoggedIn && (
              <p className="metal-trade-holdings">Your holdings: {ownedGrams.toFixed(4)} g</p>
            )}

            <div className="metal-trade-tabs">
              <button
                type="button"
                className={`metal-trade-tab buy ${tradeAction === 'buy' ? 'active' : ''}`}
                onClick={() => setTradeAction('buy')}
              >
                Buy
              </button>
              <button
                type="button"
                className={`metal-trade-tab sell ${tradeAction === 'sell' ? 'active' : ''}`}
                onClick={() => setTradeAction('sell')}
              >
                Sell
              </button>
            </div>

            <div className="metal-trade-form">
              <label>
                Amount (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={rupees}
                  onChange={(e) => handleRupeesChange(e.target.value)}
                />
              </label>
              <label>
                Weight (g)
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder="0.0000"
                  value={grams}
                  onChange={(e) => handleGramsChange(e.target.value)}
                />
              </label>
            </div>

            <div className="metal-trade-quick">
              {QUICK_AMOUNTS.map((amt) => (
                <button key={amt} type="button" onClick={() => handleRupeesChange(String(amt))}>
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {tradeAction === 'buy' && parseFloat(rupees) > 0 && (
              <p className="metal-trade-gst">
                + 18% GST: ₹{(parseFloat(rupees) * 0.18).toFixed(2)} · Total: ₹{(parseFloat(rupees) * 1.18).toFixed(2)}
              </p>
            )}

            <button type="button" className="metal-trade-submit" onClick={handleSubmitTrade}>
              {isLoggedIn
                ? `${tradeAction === 'buy' ? 'Buy' : 'Sell'} ${selectedMetal.name} at market price`
                : 'Sign in to trade'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
