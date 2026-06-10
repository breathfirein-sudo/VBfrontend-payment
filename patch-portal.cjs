const fs = require('fs');
const path = 'c:/Users/shiva/OneDrive/Desktop/VB2/frontend/src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

const block = `                {/* Platinum Card */}
                <motion.div className="holding-card platinum">
                  <div className="card-top">
                    <h4>Platinum Vault</h4>
                    <span className="symbol-label">PT</span>
                  </div>
                  <div className="holding-weight">{holdings.platinum.toFixed(4)} <span className="grams-lbl">g</span></div>
                  <div className="holding-value">₹{platVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="holding-action-row">
                    <span className="live-pricing-indicator">₹{rates.platinum.price.toFixed(2)}/g</span>
                    <button className="btn-card-action" onClick={() => { setActiveAsset('platinum'); setDashTab('trade'); }}>Trade</button>
                  </div>
                </div>

                {/* Iron Card */}
                <div className="holding-card iron">
                  <div className="card-top">
                    <h4>Iron Vault</h4>
                    <span className="symbol-label">FE</span>
                  </div>
                  <div className="holding-weight">{holdings.iron.toFixed(4)} <span className="grams-lbl">g</span></div>
                  <div className="holding-value">₹{ironVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</motion.div>
                  <div className="holding-action-row">
                    <span className="live-pricing-indicator">₹{rates.iron.price.toFixed(2)}/g</span>
                    <button className="btn-card-action" onClick={() => { setActiveAsset('iron'); setDashTab('trade'); }}>Trade</button>
                  </div>
                </div>
`;

// Try exact file content
const block2 = `                {/* Platinum Card */}
                <div className="holding-card platinum">
                  <motion.div className="card-top">
                    <h4>Platinum Vault</h4>
                    <span className="symbol-label">PT</span>
                  </div>
                  <div className="holding-weight">{holdings.platinum.toFixed(4)} <span className="grams-lbl">g</span></div>
                  <div className="holding-value">₹{platVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="holding-action-row">
                    <span className="live-pricing-indicator">₹{rates.platinum.price.toFixed(2)}/g</span>
                    <button className="btn-card-action" onClick={() => { setActiveAsset('platinum'); setDashTab('trade'); }}>Trade</button>
                  </div>
                </div>

                {/* Iron Card */}
                <div className="holding-card iron">
                  <div className="card-top">
                    <h4>Iron Vault</h4>
                    <span className="symbol-label">FE</span>
                  </div>
                  <div className="holding-weight">{holdings.iron.toFixed(4)} <span className="grams-lbl">g</span></div>
                  <div className="holding-value">₹{ironVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="holding-action-row">
                    <span className="live-pricing-indicator">₹{rates.iron.price.toFixed(2)}/g</span>
                    <button className="btn-card-action" onClick={() => { setActiveAsset('iron'); setDashTab('trade'); }}>Trade</button>
                  </div>
                </div>
`;

if (s.includes(block2)) {
  s = s.replace(block2, '');
  fs.writeFileSync(path, s);
  console.log('removed holding cards');
} else {
  const start = s.indexOf('                {/* Platinum Card */}');
  const end = s.indexOf('              </motion.div>\n\n              {/* Transactions Activity Table */}', start);
  if (start === -1) {
    const end2 = s.indexOf('              {/* Transactions Activity Table */}', start);
    console.log('start', start, 'end2', end2);
    if (start >= 0 && end2 >= 0) {
      s = s.slice(0, start) + s.slice(end2);
      fs.writeFileSync(path, s);
      console.log('removed by index');
    }
  } else {
    s = s.slice(0, start) + s.slice(end);
    fs.writeFileSync(path, s);
    console.log('removed by index 2', start, end);
  }
}
