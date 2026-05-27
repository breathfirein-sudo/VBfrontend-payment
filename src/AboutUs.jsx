import React, { useState } from 'react';
import { X, ArrowRight, ArrowRightLeft } from 'lucide-react';
import './AboutUs.css';
import { metals } from './metals';
import exactBg from './assets/about_us_exact.jpg';

const AboutUs = ({ rates = {}, holdings, walletBalance, isLoggedIn, onRequireAuth, onTradeRequest, onExplore }) => {
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [activeAction, setActiveAction] = useState('buy');
  const [rupees, setRupees] = useState('');
  const [grams, setGrams] = useState('');

  const handleCardClick = (metal) => {
    setSelectedMetal(metal);
    setRupees('');
    setGrams('');
  };

  const handleRupeesChange = (val) => {
    setRupees(val);
    const pricePerGram = rates[selectedMetal?.assetId]?.price;
    if (val && !isNaN(val) && pricePerGram) {
      setGrams((parseFloat(val) / pricePerGram).toFixed(4));
    } else {
      setGrams('');
    }
  };

  const handleGramsChange = (val) => {
    setGrams(val);
    const pricePerGram = rates[selectedMetal?.assetId]?.price;
    if (val && !isNaN(val) && pricePerGram) {
      setRupees((parseFloat(val) * pricePerGram).toFixed(2));
    } else {
      setRupees('');
    }
  };

  const handleSwapFields = () => {
    setRupees('');
    setGrams('');
  };

  const handleTradeSubmit = (actionType) => {
    if (!isLoggedIn) {
      onRequireAuth?.();
      return;
    }

    const finalRupees = parseFloat(rupees) || 0;
    const finalGrams = parseFloat(grams) || 0;
    
    if (finalRupees <= 0) return;

    const rate = rates[selectedMetal.assetId]?.price || 0;
    const subtotal = finalRupees;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;

    onTradeRequest?.({
      asset: selectedMetal.assetId,
      action: actionType,
      weight: finalGrams.toFixed(4),
      rate: rate,
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2)
    });
  };

  return (
    <div className="about-us-exact-container">
      <div className="image-wrapper" style={{ position: 'relative', width: '100%', maxWidth: '1600px' }}>
        <img src={exactBg} alt="The World's Most Valuable Metals" className="exact-bg-img" />
      
      {/* Overlay for interactive metal cards */}
      <div className="metals-interactive-overlay">
        {metals.map((metal) => {
          return (
            <button
              key={metal.no}
              type="button"
              className={`metal-overlay-btn ${selectedMetal?.no === metal.no ? 'selected' : ''}`}
              onClick={() => handleCardClick(metal)}
              aria-label={`View ${metal.name}`}
              title={`View ${metal.name}`}
            >
              {selectedMetal?.no === metal.no && <div className="metal-selected-ring" />}
            </button>
          );
        })}
      </div>

      {/* Overlay for CTA Button */}
      <div className="cta-interactive-overlay">
        <button 
          type="button" 
          className="cta-invisible-btn" 
          onClick={onExplore}
          aria-label="Explore Now"
          title="Explore Now"
        />
      </div>
      </div>

      {/* Modal Overlay for Metal Details and Live Prices */}
      {selectedMetal && (
        <div className="metal-modal-overlay" onClick={() => setSelectedMetal(null)}>
          <div className="trade-card dash-trade-card" onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '90%', maxWidth: '400px', background: '#110a1a', border: '1px solid rgba(217, 175, 86, 0.3)', borderRadius: '12px', overflow: 'hidden' }}>
            <button className="close-btn" style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: 'transparent', border: 'none', color: '#8c8693', cursor: 'pointer' }} onClick={() => setSelectedMetal(null)}>
              <X size={20} />
            </button>
            
            <div className="asset-tabs portal-asset-tabs" style={{ marginBottom: '10px', gridTemplateColumns: '1fr' }}>
              <button type="button" className="tab-btn active" style={{ flex: 1 }}>{selectedMetal.name}</button>
            </div>
            
            <div className="price-display-box" style={{ padding: '0 20px 20px', borderBottom: 'none' }}>
              <div className="current-price" style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
                {'\u20b9'}{rates[selectedMetal.assetId]?.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}/g
              </div>
              <div className="live-rates-indicator" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8c8693' }}>
                <span className="live-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }}></span><span>Live Rates</span>
              </div>
              <div className="price-subtext" style={{ textAlign: 'center', fontSize: '11px', color: '#6b6475', marginTop: '4px' }}>Additional 18% GST applicable</div>
            </div>
            
            <div className="action-tabs" style={{ padding: '0 2px' }}>
              <button type="button" className={`action-tab-btn buy ${activeAction === 'buy' ? 'active' : ''}`} onClick={() => setActiveAction('buy')}>Buy</button>
              <button type="button" className={`action-tab-btn sell ${activeAction === 'sell' ? 'active' : ''}`} onClick={() => setActiveAction('sell')}>Sell</button>
            </div>
            
            <div className="form-section" style={{ padding: '20px', background: '#ffffff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <div className="input-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="dash-rupees-input" style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#8c8693', textTransform: 'uppercase', marginBottom: '4px' }}>Rupees</label>
                  <input id="dash-rupees-input" className="input-field" type="number" placeholder="Rupees" value={rupees} onChange={(e) => handleRupeesChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2dce8', fontSize: '18px', color: '#110a1a', background: '#fff', boxSizing: 'border-box' }} />
                </div>
                <button type="button" className="btn-swap" onClick={handleSwapFields} title="Clear inputs" style={{ background: '#f5f3f7', border: '1px solid #e2dce8', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#110a1a', cursor: 'pointer', flexShrink: 0, marginTop: '16px' }}><ArrowRightLeft size={16} /></button>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="dash-grams-input" style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#8c8693', textTransform: 'uppercase', marginBottom: '4px' }}>Grams</label>
                  <input id="dash-grams-input" className="input-field" type="number" placeholder="Grams" value={grams} onChange={(e) => handleGramsChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2dce8', fontSize: '18px', color: '#110a1a', background: '#fff', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div className="quick-pills" style={{ display: 'flex', gap: '8px', marginBottom: '25px', justifyContent: 'space-between' }}>
                {[10, 100, 500, 1000].map((amount) => (
                  <button key={amount} type="button" className="pill-btn" onClick={() => handleRupeesChange(amount.toString())} style={{ flex: 1, padding: '8px 0', background: '#f5f3f7', border: '1px solid #e2dce8', borderRadius: '6px', fontSize: '13px', color: '#110a1a', cursor: 'pointer' }}>
                    {'\u20b9'}{amount}
                  </button>
                ))}
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: '15px' }}>
                <button type="button" className="btn-submit-buy" onClick={() => handleTradeSubmit(activeAction)} style={{ flex: 1, padding: '15px', background: '#1c0d2b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
                  {activeAction === 'buy' ? 'Buy Asset' : 'Sell Asset'}
                </button>
                <button type="button" className="btn-submit-sip" onClick={() => handleTradeSubmit('sip')} style={{ flex: 1, padding: '15px', background: '#110a1a', color: '#d9af56', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
                  Start Metal SIP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutUs;
