import React, { useState } from 'react';

const intervals = [
  '1m', '3m', '5m', '15m', '30m', '45m',
  '1h', '2h', '3h', '4h',
  '1D', '1W', '1M', '3M', '6M', '12M',
  '1R', '10R', '100R', '1000R'
];

const IntervalSelector = ({ active, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lc-interval-dropdown" onMouseLeave={() => setIsOpen(false)}>
      <button 
        className="lc-interval-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {active}
        <span className="lc-chevron">▼</span>
      </button>

      {isOpen && (
        <div className="lc-interval-menu">
          <div className="lc-interval-group">
            <span className="lc-interval-label">Minutes</span>
            <div className="lc-interval-grid">
              {intervals.filter(i => i.includes('m') && !i.includes('M')).map(intv => (
                <button 
                  key={intv} 
                  className={`lc-interval-btn ${active === intv ? 'active' : ''}`}
                  onClick={() => { onChange(intv); setIsOpen(false); }}
                >
                  {intv}
                </button>
              ))}
            </div>
          </div>
          <div className="lc-interval-group">
            <span className="lc-interval-label">Hours</span>
            <div className="lc-interval-grid">
              {intervals.filter(i => i.includes('h')).map(intv => (
                <button 
                  key={intv} 
                  className={`lc-interval-btn ${active === intv ? 'active' : ''}`}
                  onClick={() => { onChange(intv); setIsOpen(false); }}
                >
                  {intv}
                </button>
              ))}
            </div>
          </div>
          <div className="lc-interval-group">
            <span className="lc-interval-label">Days</span>
            <div className="lc-interval-grid">
              {intervals.filter(i => i.includes('D') || i.includes('W') || i.includes('M') && !i.includes('m')).map(intv => (
                <button 
                  key={intv} 
                  className={`lc-interval-btn ${active === intv ? 'active' : ''}`}
                  onClick={() => { onChange(intv); setIsOpen(false); }}
                >
                  {intv}
                </button>
              ))}
            </div>
          </div>
          <div className="lc-interval-group">
            <span className="lc-interval-label">Ranges</span>
            <div className="lc-interval-grid">
              {intervals.filter(i => i.includes('R')).map(intv => (
                <button 
                  key={intv} 
                  className={`lc-interval-btn ${active === intv ? 'active' : ''}`}
                  onClick={() => { onChange(intv); setIsOpen(false); }}
                >
                  {intv}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntervalSelector;
