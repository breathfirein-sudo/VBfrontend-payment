const fs = require('fs');
const appPath = 'c:/Users/shiva/OneDrive/Desktop/VB2/frontend/src/App.jsx';
const head = fs.readFileSync(appPath, 'utf8').trimEnd();

const tail = `
              </motion.div>

              <div className="activity-ledger-section">
                <div className="ledger-header">
                  <h3>Recent Vault Activity</h3>
                  <button className="btn-text-link" type="button" onClick={() => setDashTab('wallet')}>View All Ledger</button>
                </div>
                <div className="activity-ledger-table-container">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Type</th>
                        <th>Asset Type</th>
                        <th>Metal Weight</th>
                        <th>Total Amount</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 3).map((tx) => (
                        <tr key={tx.id}>
                          <td className="tx-id-col">{tx.id}</td>
                          <td>
                            <span className={\`tx-type-tag \${tx.type}\`}>
                              {tx.type === 'deposit' ? <ArrowDownLeft size={12} /> : tx.type === 'buy' ? <Plus size={12} /> : <Minus size={12} />}
                              {tx.type}
                            </span>
                          </td>
                          <td>{getAssetLabel(tx.asset)}</td>
                          <td>{tx.weight > 0 ? \`\${tx.weight.toFixed(4)} g\` : '-'}</td>
                          <td className={\`tx-amt-col \${tx.type}\`}>
                            {tx.type === 'buy' ? '-' : '+'}\u20b9{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="tx-date-col">{tx.date}</td>
                          <td><span className="status-badge success">{tx.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {dashTab === 'trade' && (
            <div className="tab-pane-view trade-view animate-fade-in">
              <motion.div className="grid-2col trade-layout-grid">
                <div className="live-trend-card">
                  <div className="trend-card-header">
                    <div className="trend-meta">
                      <h3>{getAssetLabel(activeAsset)} Market Dynamics</h3>
                      <span className="live-pricing-tag">\u20b9{rates[activeAsset].price.toFixed(2)}/g</span>
                    </div>
                    <button type="button" className="btn-refresh" onClick={() => alert('Market rates refreshed live.')}><RefreshCw size={14} /></button>
                  </div>
                </div>
                <div className="widget-column">
                  <div className="trade-card dash-trade-card">
                    <div className="asset-tabs portal-asset-tabs">
                      {PORTAL_TRADE_ASSETS.map((asset) => (
                        <button key={asset} type="button" className={\`tab-btn \${activeAsset === asset ? 'active' : ''}\`} onClick={() => setActiveAsset(asset)}>{getAssetLabel(asset)}</button>
                      ))}
                    </div>
                    <div className="price-display-box">
                      <motion.div className={\`current-price \${priceFlash ? 'glowing' : ''}\`} style={priceFlash ? { color: '#e7c376' } : {}}>
                        \u20b9{rates[activeAsset].price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g
                      </div>
                      <div className="live-rates-indicator"><span className="live-dot"></span><span>Live Rates</span></div>
                      <div className="price-subtext">Additional 3% GST applicable</div>
                    </div>
                    <div className="action-tabs">
                      <button type="button" className={\`action-tab-btn buy \${activeAction === 'buy' ? 'active' : ''}\`} onClick={() => setActiveAction('buy')}>Buy</button>
                      <button type="button" className={\`action-tab-btn sell \${activeAction === 'sell' ? 'active' : ''}\`} onClick={() => setActiveAction('sell')}>Sell</button>
                    </div>
                    <div className="form-section">
                      <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', borderBottom: '1px solid rgba(18, 5, 36, 0.08)', paddingBottom: '10px' }}>
                        <div className="form-label" style={{ color: '#120524', margin: 0, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Wallet Balance:</span>
                          <span style={{ fontSize: '15px', color: '#10b981' }}>\u20b9{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ color: '#4a3764', fontSize: '12.5px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Vault Holdings ({getAssetLabel(activeAsset)}):</span>
                          <span style={{ color: '#b88e36', fontWeight: 700 }}>{(holdings[activeAsset] ?? 0).toFixed(4)} g</span>
                        </div>
                      </div>
                      <div className="input-row">
                        <div className="input-group">
                          <label htmlFor="dash-rupees-input">Rupees</label>
                          <input id="dash-rupees-input" className="input-field" type="number" placeholder="Rupees" value={rupees} onChange={(e) => handleRupeesChange(e.target.value)} />
                        </div>
                        <button type="button" className="btn-swap" onClick={handleSwapFields} title="Swap inputs"><ArrowRightLeft size={16} /></button>
                        <div className="input-group">
                          <label htmlFor="dash-grams-input">Grams</label>
                          <input id="dash-grams-input" className="input-field" type="number" placeholder="Grams" value={grams} onChange={(e) => handleGramsChange(e.target.value)} />
                        </div>
                      </div>
                      <div className="quick-pills">
                        {[100, 500, 1000, 5000].map((amount) => (
                          <button key={amount} type="button" className="pill-btn" onClick={() => handleQuickPill(amount)}>\u20b9{amount}</button>
                        ))}
                      </div>
                      <div className="form-actions">
                        <button type="button" className="btn-submit-buy" onClick={() => handleTransactionSubmit(activeAction)}>{activeAction === 'buy' ? 'Buy Asset' : 'Sell Asset'}</button>
                        <button type="button" className="btn-submit-sip" onClick={() => handleTransactionSubmit('sip')}>Start Metal SIP</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {dashTab === 'wallet' && (
            <div className="tab-pane-view wallet-view animate-fade-in">
              <div className="grid-2col wallet-layout-grid">
                <div className="wallet-balance-pane">
                  <div className="credit-card-wallet">
                    <div className="card-top-row"><span className="vault-acc-id">VB SECURE WALLET</span><CreditCard size={20} className="cc-icon" /></div>
                    <div className="cc-balance-lbl">Available Wallet Cash</motion.div>
                    <div className="cc-balance-val">\u20b9{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="wallet-funding-actions">
                    <h3>Deposit & Withdraw Funds</h3>
                    <div className="funding-inputs-row">
                      <div className="funding-input-group">
                        <label>Deposit Amount (INR)</label>
                        <div className="funding-input-field-wrapper">
                          <span className="currency-symbol">\u20b9</span>
                          <input type="number" placeholder="Enter amount to add" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                        </div>
                        <button type="button" className="btn-funding-submit deposit" onClick={() => {
                          const val = parseFloat(depositAmount);
                          if (isNaN(val) || val <= 0) { alert('Please enter a valid deposit amount.'); return; }
                          setWalletBalance((prev) => parseFloat((prev + val).toFixed(2)));
                          setTransactions((prev) => [{ id: \`TX-\${Math.floor(1000 + Math.random() * 9000)}\`, type: 'deposit', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                          setDepositAmount('');
                          alert(\`Success! Deposited \u20b9\${val.toLocaleString()} to your secure wallet.\`);
                        }}><Plus size={16} /> Deposit Funds</button>
                      </div>
                      <div className="funding-input-group">
                        <label>Withdraw Amount (INR)</label>
                        <div className="funding-input-field-wrapper">
                          <span className="currency-symbol">\u20b9</span>
                          <input type="number" placeholder="Enter amount to withdraw" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                        </div>
                        <button type="button" className="btn-funding-submit withdraw" onClick={() => {
                          const val = parseFloat(withdrawAmount);
                          if (isNaN(val) || val <= 0) { alert('Please enter a valid withdrawal amount.'); return; }
                          if (walletBalance < val) { alert('Insufficient balance in your secure wallet.'); return; }
                          setWalletBalance((prev) => parseFloat((prev - val).toFixed(2)));
                          setTransactions((prev) => [{ id: \`TX-\${Math.floor(1000 + Math.random() * 9000)}\`, type: 'withdrawal', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                          setWithdrawAmount('');
                          alert(\`Success! Initiated withdrawal of \u20b9\${val.toLocaleString()}.\`);
                        }}><Minus size={16} /> Withdraw Funds</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="complete-vault-ledger">
                  <h3>Full Transaction History</h3>
                  <div className="full-ledger-scrollable">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="ledger-card-item">
                        <div className="ledger-item-left">
                          <div className={\`ledger-type-circle \${tx.type}\`}>
                            {tx.type === 'deposit' ? <ArrowDownLeft size={16} /> : tx.type === 'withdrawal' ? <ArrowUpRight size={16} /> : <ArrowRightLeft size={16} />}
                          </div>
                          <div>
                            <div className="ledger-item-title">
                              {tx.type === 'deposit' ? 'Added Funds' : tx.type === 'withdrawal' ? 'Withdrew Cash' : tx.type === 'buy' ? \`Purchased \${getAssetLabel(tx.asset)}\` : \`Sold \${getAssetLabel(tx.asset)}\`}
                            </div>
                            <div className="ledger-item-date">{tx.date} \u2022 ID: {tx.id}</div>
                          </div>
                        </div>
                        <div className="ledger-item-right">
                          <div className={\`ledger-item-amount \${tx.type}\`}>{tx.type === 'buy' || tx.type === 'withdrawal' ? '-' : '+'}\u20b9{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          {tx.weight > 0 && <div className="ledger-item-weight">{tx.weight.toFixed(4)} g</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {dashTab === 'profile' && (
            <div className="tab-pane-view profile-view animate-fade-in">
              <div className="profile-dashboard-layout">
                <div className="profile-security-badge-card">
                  <div className="security-icon-shield"><Shield size={42} className="shield-glow" /></div>
                  <h3>Verified Vault Account</h3>
                  <p className="profile-desc-p">Your digital assets are 100% physically stored in hyper-secure vaults.</p>
                </div>
                <div className="profile-details-settings-card">
                  <h3>Account Settings</h3>
                  <div className="profile-settings-grid">
                    <div className="p-setting-item">
                      <label>Vault Email Address</label>
                      <input type="text" readOnly value={user?.email || ''} className="profile-readonly-input" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer style={{ background: '#120524', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#9c93a8', marginTop: 'auto' }}>
          \u00a9 2026 VB Digital Commodities Exchange. Secure Vault Access.
        </footer>

        <button type="button" className="help-fab" onClick={() => setIsChatOpen(true)}><HelpCircle size={18} /><span>Help?</span></button>

        {isChatOpen && (
          <div style={chatOverlayStyle}>
            <div style={chatPanelStyle}>
              <div style={chatHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={chatAvatarStyle}>VB</div>
                  <motion.div><motion.div style={{ fontWeight: 700, fontSize: '14px' }}>VB Advisor</motion.div></div>
                </div>
                <button type="button" style={chatCloseBtnStyle} onClick={() => setIsChatOpen(false)}><X size={18} /></button>
              </div>
              <div style={chatBodyStyle}>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                    <div style={{ backgroundColor: msg.sender === 'user' ? '#a855f7' : '#270f44', color: '#fff', padding: '10px 14px', borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px', maxWidth: '80%', fontSize: '13px' }}>{msg.text}</div>
                  </div>
                ))}
              </div>
              <form style={chatFormStyle} onSubmit={handleSendMessage}>
                <input type="text" placeholder="Type your question..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} style={chatInputStyle} />
                <button type="submit" style={chatSendBtnStyle}><Send size={16} /></button>
              </form>
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <span className="modal-title">{modalType === 'sip' ? 'Systematic Plan Initializer' : 'Secure Order Checkout'}</span>
                <button type="button" className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                {showSuccess ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#fff' }}>Order Placed Successfully!</h3>
                    <p style={{ fontSize: '13px', color: '#9c93a8' }}>Your vault transaction has been completed.</p>
                  </div>
                ) : (
                  <>
                    <div className="modal-detail-row"><span className="modal-detail-label">Asset type</span><span className="modal-detail-val gold">{getAssetLabel(modalData.asset)}</span></div>
                    <motion.div className="modal-detail-row"><span className="modal-detail-label">Transaction category</span><span className="modal-detail-val" style={{ textTransform: 'uppercase' }}>{modalType === 'sip' ? 'Daily SIP' : modalData.action}</span></div>
                    <div className="modal-detail-row"><span className="modal-detail-label">Weight</span><span className="modal-detail-val">{modalData.weight} Grams</span></div>
                    <div className="modal-detail-row"><span className="modal-detail-label">Live rate per gram</span><span className="modal-detail-val">\u20b9{modalData.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="modal-detail-row"><span className="modal-detail-label">Subtotal</span><span className="modal-detail-val">\u20b9{modalData.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    {modalData.action === 'buy' && (
                      <div className="modal-detail-row"><span className="modal-detail-label">GST tax (3.0%)</span><span className="modal-detail-val">\u20b9{modalData.gst?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    )}
                    <div className="modal-detail-total">
                      <span style={{ color: '#fff' }}>{modalData.action === 'buy' ? 'Total payable' : 'You receive'}</span>
                      <span style={{ color: '#d9af56' }}>\u20b9{modalData.total?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <button type="button" className="btn-modal-confirm" onClick={confirmTransaction}>Authorize Order</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div id="root" className="auth-page-view">
        <header className="header">
          <div className="container nav-container">
            <div className="logo-section" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
              <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #d9af56 0%, #8c713b 100%)', color: '#120524', fontWeight: 800 }}>VB</div>
              <span className="logo-text" style={{ letterSpacing: '1.2px', fontSize: '20px', fontWeight: '800' }}>VB</span>
            </div>
            <button type="button" className="btn-signin" onClick={() => setView('home')}>Back to Home</button>
          </div>
        </header>
        <div className="auth-container">
          <div className="auth-card animate-fade-in">
            <div className="auth-tabs">
              <button type="button" className={\`auth-tab-btn \${authTab === 'login' ? 'active' : ''}\`} onClick={() => setAuthTab('login')}>Sign In</button>
              <button type="button" className={\`auth-tab-btn \${authTab === 'register' ? 'active' : ''}\`} onClick={() => setAuthTab('register')}>Sign Up</button>
            </div>
            {authTab === 'login' ? (
              <form className="auth-form" onSubmit={handleSignInStart}>
                <div className="auth-form-header"><h2>Welcome Back</h2><p>Access your precious metal vault securely</p></div>
                <div className="auth-input-group">
                  <label>Email</label>
                  <input type="text" required placeholder="Enter email" value={authForm.email || ''} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
                </div>
                <div className="auth-input-group">
                  <label>Password</label>
                  <input type="password" required placeholder="Password" value={authForm.password || ''} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
                </div>
                <button type="submit" className="btn-auth-submit">Sign In Securely</button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSignUp}>
                <div className="auth-form-header"><h2>Create Vault</h2><p>Begin accumulating premium physical metals today</p></div>
                <motion.div className="auth-input-group"><label>Email</label><input type="email" required value={authForm.email || ''} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} /></div>
                <div className="auth-input-group"><label>Password</label><input type="password" required value={authForm.password || ''} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} /></div>
                <button type="submit" className="btn-auth-submit">Generate Account Securely</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'about') {
    return (
      <div id="root">
        <header className="header">
          <div className="container nav-container">
            <div className="logo-section" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
              <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #d9af56 0%, #8c713b 100%)', color: '#120524', fontWeight: 800 }}>VB</div>
              <span className="logo-text" style={{ letterSpacing: '1.2px', fontSize: '20px', fontWeight: '800' }}>VB</span>
            </div>
            <button type="button" className="btn-signin" onClick={() => (user ? setView('dashboard') : setView('home'))}>{user ? 'My Vault' : 'Back to Home'}</button>
          </div>
        </header>
        <AboutUs rates={rates} holdings={holdings} walletBalance={walletBalance} isLoggedIn={!!user} onRequireAuth={() => setView('auth')} onTradeRequest={handleAboutTradeRequest} />
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <span className="modal-title">Secure Order Checkout</span>
                <button type="button" className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                {!showSuccess ? (
                  <>
                    <div className="modal-detail-row"><span className="modal-detail-label">Asset</span><span className="modal-detail-val gold">{getAssetLabel(modalData.asset)}</span></motion.div>
                    <button type="button" className="btn-modal-confirm" onClick={confirmTransaction}>Authorize {modalData.action === 'buy' ? 'Buy' : 'Sell'}</button>
                  </>
                ) : (
                  <p style={{ color: '#9c93a8', textAlign: 'center' }}>Order placed successfully.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="root">
      <header className="header">
        <div className="container nav-container">
          <div className="logo-section">
            <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #d9af56 0%, #8c713b 100%)', color: '#120524', fontWeight: 800 }}>VB</div>
            <span className="logo-text" style={{ letterSpacing: '1.2px', fontSize: '20px', fontWeight: '800' }}>VB</span>
          </div>
          <nav className="nav-menu">
            <a href="#home" className="nav-item active">Home</a>
            <a href="#about" className="nav-item" onClick={(e) => { e.preventDefault(); setView('about'); }}>About Us</a>
          </nav>
          <button type="button" className="btn-signin" onClick={() => setView('auth')}>Sign In / Sign Up</button>
        </div>
      </header>

      <motion.div className="ticker-bar">
        <div className="ticker-track">
          {PORTAL_TRADE_ASSETS.flatMap((asset) => [rates[asset], rates[asset]]).map((data, idx) => (
            <div className="ticker-item" key={\`home-t-\${idx}\`}>
              <span className="ticker-name">{getAssetLabel(PORTAL_TRADE_ASSETS[Math.floor(idx / 2)])}</span>
              <span className="ticker-val">\u20b9{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      </div>

      <main className="hero-layout" style={{ backgroundImage: \`url(\${heroGoldOre})\` }}>
        <div className="container">
          <div className="grid-2col">
            <div className="hero-text-box">
              <div className="tagline">PREMIUM METAL INVESTMENTS</div>
              <h1 className="hero-title">Ready to invest in precious metals?<br />Buy gold and silver online with VB</h1>
              <p className="hero-desc">Begin your wealth accumulation journey with 100% physically backed institutional-grade metals.</p>
              <div className="hero-actions">
                <button type="button" className="btn-hero-primary" onClick={() => setView('auth')}>Proceed to Sign Up</button>
              </div>
            </div>
            <div className="widget-column">
              <div className="trade-card">
                <div className="asset-tabs portal-asset-tabs">
                  {PORTAL_TRADE_ASSETS.map((asset) => (
                    <button key={asset} type="button" className={\`tab-btn \${activeAsset === asset ? 'active' : ''}\`} onClick={() => setActiveAsset(asset)}>{getAssetLabel(asset)}</button>
                  ))}
                </div>
                <div className="price-display-box">
                  <div className={\`current-price \${priceFlash ? 'glowing' : ''}\`} style={priceFlash ? { color: '#e7c376' } : {}}>
                    \u20b9{rates[activeAsset].price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g
                  </div>
                  <div className="live-rates-indicator"><span className="live-dot"></span><span>Live Rates</span></div>
                  <div className="price-subtext">Additional 3% GST applicable</div>
                </div>
                <div className="action-tabs">
                  <button type="button" className={\`action-tab-btn buy \${activeAction === 'buy' ? 'active' : ''}\`} onClick={() => setActiveAction('buy')}>Buy</button>
                  <button type="button" className={\`action-tab-btn sell \${activeAction === 'sell' ? 'active' : ''}\`} onClick={() => setActiveAction('sell')}>Sell</button>
                </div>
                <div className="form-section">
                  <div className="form-label">Please enter the amount</div>
                  <div className="input-row">
                    <div className="input-group"><label htmlFor="rupees-input">Rupees</label><input id="rupees-input" className="input-field" type="number" value={rupees} onChange={(e) => handleRupeesChange(e.target.value)} /></div>
                    <button type="button" className="btn-swap" onClick={handleSwapFields}><ArrowRightLeft size={16} /></button>
                    <div className="input-group"><label htmlFor="grams-input">Grams</label><input id="grams-input" className="input-field" type="number" value={grams} onChange={(e) => handleGramsChange(e.target.value)} /></div>
                  </div>
                  <div className="quick-pills">{[100, 500, 1000, 5000].map((amount) => (<button key={amount} type="button" className="pill-btn" onClick={() => handleQuickPill(amount)}>\u20b9{amount}</button>))}</div>
                  <div className="form-actions">
                    <button type="button" className="btn-submit-buy" onClick={() => setView('auth')}>{activeAction === 'buy' ? 'Buy' : 'Sell'}</button>
                    <button type="button" className="btn-submit-sip" onClick={() => setView('auth')}>Start SIP</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">Secure Order Checkout</span>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <button type="button" className="btn-modal-confirm" onClick={confirmTransaction}>Authorize Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const dropdownStyles = { position: 'absolute', top: '100%', left: 0, backgroundColor: '#150a21', border: '1px solid rgba(168, 85, 247, 0.2)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)', borderRadius: '8px', padding: '8px 0', width: '180px', zIndex: 1000, display: 'flex', flexDirection: 'column', marginTop: '4px' };
const dropdownItemStyles = { padding: '8px 16px', fontSize: '13.5px', color: '#9c93a8', transition: 'all 0.2s', textAlign: 'left' };
const chatOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '24px' };
const chatPanelStyle = { width: '380px', height: '500px', backgroundColor: '#150a21', border: '1px solid rgba(217, 175, 86, 0.3)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const chatHeaderStyle = { padding: '16px 20px', backgroundColor: '#200f33', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const chatAvatarStyle = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#d9af56', color: '#060309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' };
const chatCloseBtnStyle = { color: '#9c93a8' };
const chatBodyStyle = { flexGrow: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#0c0615', display: 'flex', flexDirection: 'column' };
const chatFormStyle = { padding: '12px 16px', borderTop: '1px solid rgba(168, 85, 247, 0.2)', backgroundColor: '#150a21', display: 'flex', gap: '8px' };
const chatInputStyle = { flexGrow: 1, backgroundColor: '#200f33', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' };
const chatSendBtnStyle = { backgroundColor: '#d9af56', color: '#060309', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 };

export default App;
`;

// Fix accidental motion.div tags in tail
const cleaned = tail.replace(/<\/?motion\.div>/g, (m) => (m.includes('/') ? '</motion.div>'.replace('motion.', '') : '<div').replace('<div', '<div');
const fixed = cleaned.replace(/<\/motion\.motion\.div>/g, '</div>').replace(/<motion\.div>/g, '<motion.div>').replace(/<\/motion\.div>/g, '</div>').replace(/<motion\.motion\.div>/g, '<div>');

fs.writeFileSync(appPath, head + fixed.replace(/motion\.div/g, 'motion.div').replace(/<motion\.div>/g, '<div>').replace(/<\/motion\.motion\.div>/g, '</div>').replace(/<\/motion\.div>/g, '</motion.div>').replace(/motion\.motion\.div/g, 'div'));
console.log('restored', appPath);
