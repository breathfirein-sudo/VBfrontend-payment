import React, { useState, useEffect, useRef } from 'react';
import RazorpayButton from './components/Payment/RazorpayButton';
import {
  ChevronDown,
  ArrowRightLeft,
  Smartphone,
  Play,
  HelpCircle,
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Wallet,
  User,
  LogOut,
  Plus,
  Minus,
  Shield,
  Activity,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Download,
  Check,
  Lock,
  RefreshCw,
  CreditCard,
  Gem,
  Star,
  Gift,
  Copy
} from 'lucide-react';
import heroGoldOre from './assets/hero_gold_ore.png';
import './App.css';
import AboutUs from './AboutUs';
import ContestAwards from './ContestAwards';
import ReferralProgramPage from './ReferralProgramPage';
import TradingViewWidget from './charts/TradingViewWidget';
import LiveChartWidget from './components/LiveChart/LiveChartWidget';
import {
  createAllMetalRates,
  createInitialHoldings,
  getMetalLabel,
  PORTAL_TRADE_ASSETS,
  pickRandomPortalAsset,
} from './metals';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';

// Initial rates based on the screenshot
const INITIAL_RATES = {
  silver: { price: 267.21, change: -2.04, pct: -0.76 },
  platinum: { price: 7358.14, change: 12.45, pct: 0.17 },
  iron: { price: 52.10, change: -0.58, pct: -1.10 },
  gold: { price: 6143.57, change: 48.96, pct: 0.80 }
};

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const InvesthourLogoText = ({ customStyle, suffix }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...customStyle }}>
    <span className="logo-text" style={{ letterSpacing: '1.2px', fontSize: '20px', fontWeight: '800' }}>
      Investhour{suffix}
    </span>
    <span style={{ fontSize: '20px', display: 'inline-block', WebkitTextFillColor: 'initial', WebkitBackgroundClip: 'initial', background: 'none' }}>
      📈⌛
    </span>
  </span>
);

const IntervalDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState(['1', '30']);
  
  const minutes = [
    { value: '1', label: '1 minute' },
    { value: '3', label: '3 minutes' },
    { value: '5', label: '5 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' }
  ];

  const getDisplayValue = () => {
    if (value === '240') return '4h';
    if (value === '60') return '1h';
    return value + 'm';
  };

  return (
    <div className="interval-dropdown-container">
      <button 
        type="button" 
        className="interval-dropdown-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {getDisplayValue()}
        <ChevronDown size={14} style={{ marginLeft: 4 }} />
      </button>

      {isOpen && (
        <div className="interval-dropdown-menu">
          <div className="interval-menu-header">MINUTES</div>
          {minutes.map((item) => (
            <div 
              key={item.value} 
              className={`interval-menu-item ${value === item.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(item.value);
                setIsOpen(false);
              }}
            >
              <span>{item.label}</span>
              <Star 
                size={16} 
                className={`interval-star ${favorites.includes(item.value) ? 'favorite' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setFavorites(prev => 
                    prev.includes(item.value) 
                      ? prev.filter(f => f !== item.value)
                      : [...prev, item.value]
                  );
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  // --- Auth & Profile States ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); // 'home', 'auth', 'dashboard'
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' });
  
  // --- Real-time OTP Login States ---
  const [otpStep, setOtpStep] = useState('login'); // 'login', 'verify', 'register', 'register-verify'
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(120); // 2 minutes countdown
  const [otpSending, setOtpSending] = useState(false);
  const [isOtpReal, setIsOtpReal] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [lastRedisCommand, setLastRedisCommand] = useState('');
  const [redisStatus, setRedisStatus] = useState('In-Memory Sandbox');
  const otpInputRefs = useRef([]);

  // --- OTP Countdown Timer Hook ---
  useEffect(() => {
    let timer;
    if (otpStep === 'verify' && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, otpTimer]);
  
  // --- Dashboard Navigation Tab ---
  const [dashTab, setDashTab] = useState('portfolio'); // 'portfolio', 'trade', 'wallet', 'profile'
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => localStorage.getItem('vb_disclaimer_accepted') === 'true');
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);
  const [copiedInspectedReferralLink, setCopiedInspectedReferralLink] = useState(false);
  const [successfulReferralsCount, setSuccessfulReferralsCount] = useState(1245);
  const [referralsList, setReferralsList] = useState([
    { id: 'REF-8492', email: 'sh***@gmail.com', date: '2026-06-03 14:22', status: 'Completed', reward: '₹10 Gold' },
    { id: 'REF-7201', email: 'an***@yahoo.com', date: '2026-06-02 09:15', status: 'Completed', reward: '₹10 Gold' },
    { id: 'REF-6034', email: 'ro***@outlook.com', date: '2026-05-30 18:45', status: 'Completed', reward: '₹10 Gold' },
    { id: 'REF-5982', email: 'ra***@gmail.com', date: '2026-05-28 11:30', status: 'Pending KYC', reward: 'Pending' },
    { id: 'REF-4819', email: 'mi***@gmail.com', date: '2026-05-25 15:10', status: 'Joined', reward: 'Pending' },
  ]);
  
  // --- Live Portfolio Balance & Holdings State ---
  const [walletBalance, setWalletBalance] = useState(0); // Available Cash in Rupees
  const [holdings, setHoldings] = useState(() =>
    createInitialHoldings({})
  );
  
  // --- Interactive Deposit / Withdrawal Fields ---
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // --- Real-time Transaction Log Ledger ---
  const [transactions, setTransactions] = useState([]);

  // --- Super Admin - Global Clients & Real-time Live Tracking Database ---
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('vb_clients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load clients database:", e);
      }
    }
    return [];
  });

  const [selectedClientId, setSelectedClientId] = useState(''); // Default to empty
  const [adminCreditAmount, setAdminCreditAmount] = useState('');
  const [adminDeductAmount, setAdminDeductAmount] = useState('');
  const [adminNotifications, setAdminNotifications] = useState([]);

  // --- Contest Awards States & Methods ---
  const [adminTab, setAdminTab] = useState('clients'); // 'clients' or 'contest'
  const [contestParticipants, setContestParticipants] = useState([]);
  const [selectedContestParticipant, setSelectedContestParticipant] = useState(null);
  const [contestParticipantTrades, setContestParticipantTrades] = useState([]);
  const [contestSearchQuery, setContestSearchQuery] = useState('');

  const fetchAdminContestData = async () => {
    try {
      let token = 'dummy-token-for-dev';
      if (auth && auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const res = await fetch(`${VITE_BACKEND_URL}/api/contest/admin/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setContestParticipants(data.participants || []);
      }
    } catch (e) {
      console.error("Error fetching contest participants:", e);
    }
  };

  const fetchParticipantTrades = async (email) => {
    try {
      let token = 'dummy-token-for-dev';
      if (auth && auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const res = await fetch(`${VITE_BACKEND_URL}/api/contest/admin/trades/${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setContestParticipantTrades(data.trades || []);
      }
    } catch (e) {
      console.error("Error fetching participant trades:", e);
    }
  };

  const handleAdminUpdateContestant = async (email, stats) => {
    try {
      let token = 'dummy-token-for-dev';
      if (auth && auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const res = await fetch(`${VITE_BACKEND_URL}/api/contest/admin/update-participant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email, ...stats })
      });
      const data = await res.json();
      if (data.success) {
        alert("Stats updated successfully!");
        fetchAdminContestData();
        if (selectedContestParticipant && selectedContestParticipant.email === email) {
          setSelectedContestParticipant(prev => ({ 
            ...prev, 
            balance: stats.balance,
            total_trades: stats.totalTrades,
            profit_trades: stats.profitTrades,
            loss_trades: stats.lossTrades,
            success_rate: stats.successRate
          }));
        }
      } else {
        alert(data.error || "Update failed.");
      }
    } catch (e) {
      console.error("Error updating contestant:", e);
    }
  };

  const handleAdminResetContestant = async (email) => {
    if (!window.confirm(`Are you sure you want to reset contest progress for ${email}? This will delete all their contest trades and set balance back to ₹11,000.`)) return;
    try {
      let token = 'dummy-token-for-dev';
      if (auth && auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const res = await fetch(`${VITE_BACKEND_URL}/api/contest/admin/reset-participant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        alert("Account reset successfully!");
        fetchAdminContestData();
        if (selectedContestParticipant && selectedContestParticipant.email === email) {
          setSelectedContestParticipant(null);
          setContestParticipantTrades([]);
        }
      } else {
        alert(data.error || "Reset failed.");
      }
    } catch (e) {
      console.error("Error resetting contestant:", e);
    }
  };

  const handleAdminGenerateMockContestants = async () => {
    try {
      let token = 'dummy-token-for-dev';
      if (auth && auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const res = await fetch(`${VITE_BACKEND_URL}/api/contest/admin/generate-mock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("Mock contestants generated successfully!");
        fetchAdminContestData();
      } else {
        alert(data.error || "Mock generation failed.");
      }
    } catch (e) {
      console.error("Error generating mock contestants:", e);
    }
  };

  useEffect(() => {
    if (user && user.email === 'shivaram33987@gmail.com' && adminTab === 'contest') {
      fetchAdminContestData();
    }
  }, [user, adminTab]);

  // --- Core Application States ---
  const [rates, setRates] = useState(() => createAllMetalRates(INITIAL_RATES));
  const [activeAsset, setActiveAsset] = useState('gold');
  const [activeAction, setActiveAction] = useState('buy');
  const [rupees, setRupees] = useState('');
  const [grams, setGrams] = useState('');
  const [lastEdited, setLastEdited] = useState('rupees'); // 'rupees' or 'grams'
  const [chartInterval, setChartInterval] = useState('240'); // Default 4h


  // Header Dropdowns Open State
  const [openDropdown, setOpenDropdown] = useState(null);

  // Modals & Chat
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('buy'); // 'buy' or 'sip'
  const [modalData, setModalData] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Floating Help Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: 'Hello! Welcome to Investhour. How can I help you invest in precious metals today?' }
  ]);

  // Price Flashing effect triggers
  const [priceFlash, setPriceFlash] = useState(false);
  const prevPriceRef = useRef(INITIAL_RATES.iron.price);

  // --- Live Rates Simulation Effect ---
  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prev => {
        const next = { ...prev };
        const randomAsset = pickRandomPortalAsset(next);
        const percentChange = (Math.random() * 0.16 - 0.08) / 100;
        const oldPrice = next[randomAsset].price;
        const priceDiff = oldPrice * percentChange;

        next[randomAsset] = {
          price: parseFloat((oldPrice + priceDiff).toFixed(2)),
          change: parseFloat((next[randomAsset].change + priceDiff).toFixed(2)),
          pct: parseFloat((((next[randomAsset].change + priceDiff) / (oldPrice - next[randomAsset].change)) * 100).toFixed(2))
        };

        // If the active asset changed, trigger a flash effect
        if (randomAsset === activeAsset) {
          setPriceFlash(true);
          setTimeout(() => setPriceFlash(false), 800);
        }

        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeAsset]);

  // --- Super Admin & Client Shared Sync Handlers ---
  // Whenever the active logged-in standard customer state changes, sync back to clients database!
  useEffect(() => {
    if (user && user.email !== 'shivaram33987@gmail.com') {
      setClients(prev => {
        const next = prev.map(c => {
          if (c.email.toLowerCase() === user.email.toLowerCase()) {
            return {
              ...c,
              walletBalance,
              holdings,
              transactions,
              referralCount: successfulReferralsCount
            };
          }
          return c;
        });
        localStorage.setItem('vb_clients', JSON.stringify(next));
        return next;
      });
    }
  }, [walletBalance, holdings, transactions, successfulReferralsCount, user]);

  // Load client stats from clients database upon successful login
  useEffect(() => {
    if (user && user.email !== 'shivaram33987@gmail.com') {
      const match = clients.find(c => c.email.toLowerCase() === user.email.toLowerCase());
      if (match) {
        setWalletBalance(match.walletBalance || 0);
        setHoldings(createInitialHoldings(match.holdings || {}));
        setTransactions(match.transactions || []);
        setSuccessfulReferralsCount(match.referralCount || 0);
      } else {
        const cRecord = {
          id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          phone: '',
          walletBalance: 0,
          holdings: createInitialHoldings({}),
          kycStatus: 'Pending',
          transactions: [],
          referralCount: 0
        };
        setClients(prev => {
          const next = [...prev, cRecord];
          localStorage.setItem('vb_clients', JSON.stringify(next));
          return next;
        });
        setWalletBalance(cRecord.walletBalance);
        setHoldings(cRecord.holdings);
        setTransactions(cRecord.transactions);
        setSuccessfulReferralsCount(cRecord.referralCount);
      }
    }
  }, [user]);

  // --- Real-time Day-to-day Transactions Simulator for Super Admin ---
  useEffect(() => {
    if (user && user.email === 'shivaram33987@gmail.com') {
      const interval = setInterval(() => {
        const activeClientsList = clients.filter(c => c.email !== 'shivaram33987@gmail.com');
        if (activeClientsList.length === 0) return;
        
        const randomClient = activeClientsList[Math.floor(Math.random() * activeClientsList.length)];
        const actionsList = ['buy', 'sell', 'deposit', 'withdrawal'];
        const action = actionsList[Math.floor(Math.random() * actionsList.length)];
        const assetsList = PORTAL_TRADE_ASSETS;
        const asset = assetsList[Math.floor(Math.random() * assetsList.length)];
        
        let txAmount = 0;
        let txWeight = 0;
        const pricePerGram = rates[asset].price;
        
        const newClientRecord = { ...randomClient };
        newClientRecord.holdings = { ...randomClient.holdings };
        newClientRecord.transactions = [ ...randomClient.transactions ];
        
        if (action === 'deposit') {
          txAmount = parseFloat((Math.floor(Math.random() * 8 + 1) * 5000).toFixed(2));
          newClientRecord.walletBalance = parseFloat((newClientRecord.walletBalance + txAmount).toFixed(2));
        } else if (action === 'withdrawal') {
          txAmount = parseFloat((Math.floor(Math.random() * 4 + 1) * 2000).toFixed(2));
          if (newClientRecord.walletBalance > txAmount) {
            newClientRecord.walletBalance = parseFloat((newClientRecord.walletBalance - txAmount).toFixed(2));
          } else {
            return;
          }
        } else if (action === 'buy') {
          txAmount = parseFloat((Math.floor(Math.random() * 6 + 1) * 1000).toFixed(2));
          const gst = txAmount * 0.18;
          const totalCost = txAmount + gst;
          if (newClientRecord.walletBalance > totalCost) {
            txWeight = parseFloat((txAmount / pricePerGram).toFixed(4));
            newClientRecord.walletBalance = parseFloat((newClientRecord.walletBalance - totalCost).toFixed(2));
            newClientRecord.holdings[asset] = parseFloat((newClientRecord.holdings[asset] + txWeight).toFixed(4));
            txAmount = totalCost;
          } else {
            return;
          }
        } else if (action === 'sell') {
          txWeight = parseFloat((Math.random() * 2 + 0.1).toFixed(4));
          if (newClientRecord.holdings[asset] > txWeight) {
            txAmount = parseFloat((txWeight * pricePerGram).toFixed(2));
            newClientRecord.walletBalance = parseFloat((newClientRecord.walletBalance + txAmount).toFixed(2));
            newClientRecord.holdings[asset] = parseFloat((newClientRecord.holdings[asset] - txWeight).toFixed(4));
          } else {
            return;
          }
        }
        
        const newTx = {
          id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
          type: action,
          asset: action === 'deposit' || action === 'withdrawal' ? 'wallet' : asset,
          amount: txAmount,
          weight: txWeight,
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          status: 'Completed'
        };
        newClientRecord.transactions.unshift(newTx);
        
        setClients(prev => {
          const next = prev.map(c => c.email.toLowerCase() === randomClient.email.toLowerCase() ? newClientRecord : c);
          localStorage.setItem('vb_clients', JSON.stringify(next));
          return next;
        });
        
        const notif = {
          id: `NOTIF-${Math.random()}`,
          clientName: randomClient.name,
          action: action === 'deposit' ? 'deposited funds' : action === 'withdrawal' ? 'withdrew funds' : action === 'buy' ? `purchased ${getAssetLabel(asset)}` : `sold ${getAssetLabel(asset)}`,
          amount: txAmount,
          weight: txWeight,
          asset: asset
        };
        
        setAdminNotifications(prev => [notif, ...prev.slice(0, 3)]);
        
        setTimeout(() => {
          setAdminNotifications(prev => prev.filter(n => n.id !== notif.id));
        }, 6000);
        
      }, 12000);
      
      return () => clearInterval(interval);
    }
  }, [user, clients, rates]);

  // --- Real-time Calculations ---
  // Convert Rupees -> Grams
  const calculateGrams = (rVal, asset) => {
    if (!rVal || isNaN(rVal)) return '';
    const price = rates[asset].price;
    // 18% GST included in standard purchases
    const gramsCalculated = parseFloat(rVal) / price;
    return gramsCalculated.toFixed(4);
  };

  // Convert Grams -> Rupees
  const calculateRupees = (gVal, asset) => {
    if (!gVal || isNaN(gVal)) return '';
    const price = rates[asset].price;
    const rupeesCalculated = parseFloat(gVal) * price;
    return rupeesCalculated.toFixed(2);
  };

  // Handle changes when inputs are typed into
  const handleRupeesChange = (val) => {
    setRupees(val);
    setLastEdited('rupees');
    if (val === '') {
      setGrams('');
    } else {
      setGrams(calculateGrams(val, activeAsset));
    }
  };

  const handleGramsChange = (val) => {
    setGrams(val);
    setLastEdited('grams');
    if (val === '') {
      setRupees('');
    } else {
      setRupees(calculateRupees(val, activeAsset));
    }
  };

  // Recalculate if active asset changes
  useEffect(() => {
    if (lastEdited === 'rupees') {
      if (rupees) setGrams(calculateGrams(rupees, activeAsset));
    } else {
      if (grams) setRupees(calculateRupees(grams, activeAsset));
    }
  }, [activeAsset, rates]);

  useEffect(() => {
    if ((view === 'home' || view === 'dashboard') && !PORTAL_TRADE_ASSETS.includes(activeAsset)) {
      setActiveAsset('gold');
    }
  }, [view, activeAsset]);

  // Handle Quick Select Pills (₹100, ₹500, etc.)
  const handleQuickPill = (amount) => {
    handleRupeesChange(amount.toString());
  };

  // Swap fields function
  const handleSwapFields = () => {
    if (lastEdited === 'rupees') {
      setLastEdited('grams');
    } else {
      setLastEdited('rupees');
    }
    // Visually toggle inputs or flash them
    const tempGrams = grams;
    setGrams(grams);
    setRupees(rupees);
  };

  // --- Auth Session State Listener ---
  useEffect(() => {
    const savedLocalUser = localStorage.getItem('vb_local_user');
    if (savedLocalUser) {
      try {
        const parsed = JSON.parse(savedLocalUser);
        setUser(parsed);
        setView('dashboard');
        setLoading(false);
        return;
      } catch (e) {
        console.error("Error loading local user session:", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setView('dashboard');
      } else {
        setView(prev => prev === 'dashboard' ? 'home' : prev);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Transaction Triggers ---
  const handleTransactionSubmit = (type) => {
    const finalRupees = parseFloat(rupees) || 0;
    const finalGrams = parseFloat(grams) || 0;

    if (finalRupees <= 0) {
      return;
    }

    const pricePerGram = rates[activeAsset].price;
    const subtotal = finalRupees;
    const gstAmount = subtotal * 0.18;
    const totalPayable = subtotal + gstAmount;

    setModalType(type);
    setModalData({
      asset: activeAsset,
      action: activeAction,
      weight: finalGrams,
      rate: pricePerGram,
      subtotal: subtotal,
      gst: gstAmount,
      total: totalPayable
    });
    setShowModal(true);
  };

  const confirmTransaction = () => {
    if (view === 'dashboard' || view === 'about') {
      const finalRupees = parseFloat(rupees) || parseFloat(modalData.subtotal) || 0;
      const finalGrams = parseFloat(grams) || parseFloat(modalData.weight) || 0;
      const asset = modalData.asset;
      const action = modalData.action;

      if (action === 'buy') {
        const gst = finalRupees * 0.18;
        const totalCost = finalRupees + gst;
        if (walletBalance < totalCost) {
          setShowModal(false);
          return;
        }
        // Deduct wallet and add holdings
        setWalletBalance(prev => parseFloat((prev - totalCost).toFixed(2)));
        setHoldings(prev => ({
          ...prev,
          [asset]: parseFloat(((prev[asset] ?? 0) + finalGrams).toFixed(4))
        }));
        // Add transaction to ledger
        setTransactions(prev => [
          {
            id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
            type: 'buy',
            asset: asset,
            amount: totalCost,
            weight: finalGrams,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            status: 'Completed'
          },
          ...prev
        ]);
      } else if (action === 'sell') {
        if ((holdings[asset] ?? 0) < finalGrams) {
          alert(`Insufficient metal weight. You only own ${holdings[asset] ?? 0}g of ${getAssetLabel(asset)}.`);
          setShowModal(false);
          return;
        }
        // Add to wallet and deduct holdings
        setWalletBalance(prev => parseFloat((prev + finalRupees).toFixed(2)));
        setHoldings(prev => ({
          ...prev,
          [asset]: parseFloat(((prev[asset] ?? 0) - finalGrams).toFixed(4))
        }));
        // Add transaction to ledger
        setTransactions(prev => [
          {
            id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
            type: 'sell',
            asset: asset,
            amount: finalRupees,
            weight: finalGrams,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            status: 'Completed'
          },
          ...prev
        ]);
      }
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowModal(false);
      setRupees('');
      setGrams('');
    }, 2500);
  };

  // --- OTP Verification Input Handlers ---
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newInputs = [...otpInputs];
    newInputs[index] = value;
    setOtpInputs(newInputs);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const newInputs = [...otpInputs];
      if (!newInputs[index] && index > 0) {
        newInputs[index - 1] = '';
        setOtpInputs(newInputs);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        newInputs[index] = '';
        setOtpInputs(newInputs);
      }
    }
  };

  // --- Real-time Gmail OTP Sender with Secure Custom Express Backend ---
  const sendSecureOtp = async (emailAddress, type = 'login') => {
    setOtpSending(true);
    setOtpError('');
    setOtpInputs(['', '', '', '', '', '']);
    setOtpTimer(120);

    try {
      const response = await fetch(`${VITE_BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: emailAddress })
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch secure OTP.');
      }
      
      console.log(`[Backend OTP Dispatch] Status: OK. Delivery: ${data.deliveryType}. Redis Cache: ${data.redisType}`);
      
      setOtpSending(false);
      setOtpStep(type === 'register' ? 'register-verify' : 'verify');

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error("Backend OTP Dispatch Error:", err);
      setOtpError(`Server Connection Failed: ${err.message}`);
      setOtpSending(false);
    }
  };

  const handleSignInStart = (e) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      alert("Please fill in all secure fields.");
      return;
    }
    sendSecureOtp(authForm.email);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const enteredCode = otpInputs.join('');
    if (enteredCode.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      const response = await fetch(`${VITE_BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: authForm.email,
          otp: enteredCode
        })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setOtpError(data.error || "Invalid OTP code. Please check your email or resend code.");
        return;
      }

      console.log("[Backend OTP Verify] Verification successful.");

      // OTP Verified! Log user in
      if (authForm.email.toLowerCase() === 'shivaram33987@gmail.com' && authForm.password === 'Shiva@143') {
        const localUser = { email: 'shivaram33987@gmail.com', uid: 'admin-super-uid', displayName: 'Super Admin' };
        localStorage.setItem('vb_local_user', JSON.stringify(localUser));
        setUser(localUser);
        setView('dashboard');
        setOtpStep('login');
        return;
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        setView('dashboard');
        setOtpStep('login');
      } catch (error) {
        console.warn("Firebase Auth failed, falling back to local session:", error.message);
        // Fallback: Create a local session for development so the user is never blocked
        const localUser = { 
          email: authForm.email, 
          uid: 'local-session-uid-' + Date.now(), 
          displayName: authForm.email.split('@')[0] 
        };
        localStorage.setItem('vb_local_user', JSON.stringify(localUser));
        setUser(localUser);
        setView('dashboard');
        setOtpStep('login');
      }
    } catch (err) {
      console.error("Backend OTP Verify Error:", err);
      setOtpError(`Server Verification Error: ${err.message}`);
    }
  };

  // --- Auto-submit OTP when 6 digits are typed ---
  useEffect(() => {
    const enteredCode = otpInputs.join('');
    if (enteredCode.length === 6) {
      if (otpStep === 'verify') {
        handleVerifyOtp();
      } else if (otpStep === 'register-verify') {
        handleVerifyRegistrationOtp();
      }
    }
  }, [otpInputs, otpStep]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      alert("Please enter a valid email and custom vault password.");
      return;
    }
    // Send OTP for registration verification
    sendSecureOtp(authForm.email, 'register');
  };

  const handleVerifyRegistrationOtp = async (e) => {
    if (e) e.preventDefault();
    const enteredCode = otpInputs.join('');
    if (enteredCode.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      const response = await fetch(`${VITE_BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: authForm.email,
          otp: enteredCode
        })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setOtpError(data.error || "Invalid OTP code. Please check your email or resend code.");
        return;
      }

      console.log("[Backend OTP Verify] Registration OTP verified successfully.");

      // OTP Verified! Now create the account
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        alert(`OTP Verified! Vault Created Securely! Welcome: ${userCredential.user.email}`);
        setAuthTab('login');
        setOtpStep('login');
        setAuthForm({ name: '', email: '', phone: '', password: '' });
      } catch (error) {
        console.warn("Firebase account creation failed, using local registration fallback:", error.message);
        const localUser = { 
          email: authForm.email, 
          uid: 'local-session-uid-' + Date.now(), 
          displayName: authForm.email.split('@')[0] 
        };
        localStorage.setItem('vb_local_user', JSON.stringify(localUser));
        setUser(localUser);
        alert(`OTP Verified! Vault Created Securely (Local Fallback)! Welcome: ${localUser.email}`);
        setView('dashboard');
        setOtpStep('login');
        setAuthForm({ name: '', email: '', phone: '', password: '' });
      }
    } catch (err) {
      console.error("Backend OTP Verify Error:", err);
      setOtpError(`Server Verification Error: ${err.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase signout error:", error);
    }
    localStorage.removeItem('vb_local_user');
    setUser(null);
    setView('home');
  };


  // --- Chat Drawer Interactions ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatMessage('');

    // Mock bot response generator
    setTimeout(() => {
      let reply = "Thank you for reaching out. An investment advisor will connect with you shortly.";
      const lower = userMsg.toLowerCase();
      if (lower.includes('sip')) {
        reply = "SIP (Systematic Investment Plan) with Investhour is an elegant way to accumulate gold or silver daily. You can start with as little as ₹10 per day!";
      } else if (lower.includes('rate') || lower.includes('price')) {
        reply = `Our current live prices are updated in real-time. Gold: ₹${rates.gold.price.toFixed(2)}/g, Silver: ₹${rates.silver.price.toFixed(2)}/g. GST of 18% is applicable on purchases.`;
      } else if (lower.includes('buy') || lower.includes('sell')) {
        reply = "You can instantly buy and sell metals directly through our simplified dashboard. Simply type the Rupees or Grams you wish to transact, and click buy!";
      } else if (lower.includes('minimum')) {
        reply = "The minimum investment amount for a standard transaction is ₹100, and for SIP is just ₹10!";
      }

      setChatHistory(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 1000);
  };

  // Helper for asset label title
  const getAssetLabel = (asset) => getMetalLabel(asset);

  const handleAboutTradeRequest = (data) => {
    setActiveAsset(data.asset);
    setActiveAction(data.action);
    setModalType(data.action);
    setModalData({
      asset: data.asset,
      action: data.action,
      weight: data.weight,
      rate: data.rate,
      subtotal: data.subtotal,
      gst: data.gst,
      total: data.total,
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div id="root" className="loading-view">
        <div className="spinner-container">
          <div className="gold-spinner"></div>
          <h2>Unlocking Your Metal Vault...</h2>
          <p>Establishing quantum-secure channel & loading assets</p>
        </div>
      </div>
    );
  }

  const isAdmin = user && user.email === 'shivaram33987@gmail.com';

  if (view === 'dashboard' && isAdmin) {
    // Collect all transactions from clients database for system-wide display
    const allSystemTransactions = clients.reduce((acc, client) => {
      const clientTx = client.transactions.map(tx => ({
        ...tx,
        clientName: client.name,
        clientEmail: client.email
      }));
      return [...acc, ...clientTx];
    }, []).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Select the currently inspected client
    const inspectedClient = clients.find(c => c.id === selectedClientId) || clients[0] || {
      id: 'CUST-NONE',
      name: 'No Customers Active',
      email: '',
      phone: '',
      walletBalance: 0,
      holdings: { gold: 0, silver: 0, platinum: 0, iron: 0 },
      kycStatus: 'Pending',
      transactions: []
    };

    // Calculate system-wide total precious metal holdings
    const systemReserves = clients.reduce((res, client) => {
      res.gold += client.holdings.gold || 0;
      res.silver += client.holdings.silver || 0;
      res.platinum += client.holdings.platinum || 0;
      res.iron += client.holdings.iron || 0;
      res.wallet += client.walletBalance || 0;
      return res;
    }, { gold: 0, silver: 0, platinum: 0, iron: 0, wallet: 0 });

    const totalSystemValuation =
      systemReserves.gold * rates.gold.price +
      systemReserves.silver * rates.silver.price +
      systemReserves.wallet;

    const clientGoldVal = (inspectedClient.holdings?.gold || 0) * rates.gold.price;
    const clientSilverVal = (inspectedClient.holdings?.silver || 0) * rates.silver.price;
    const clientPlatinumVal = (inspectedClient.holdings?.platinum || 0) * rates.platinum.price;
    const clientIronVal = (inspectedClient.holdings?.iron || 0) * rates.iron.price;
    const clientCash = inspectedClient.walletBalance || 0;
    const clientTotalVal = clientGoldVal + clientSilverVal + clientPlatinumVal + clientIronVal + clientCash;

    const goldPct = clientTotalVal > 0 ? (clientGoldVal / clientTotalVal) * 100 : 0;
    const silverPct = clientTotalVal > 0 ? (clientSilverVal / clientTotalVal) * 100 : 0;
    const platinumPct = clientTotalVal > 0 ? (clientPlatinumVal / clientTotalVal) * 100 : 0;
    const ironPct = clientTotalVal > 0 ? (clientIronVal / clientTotalVal) * 100 : 0;
    const cashPct = clientTotalVal > 0 ? (clientCash / clientTotalVal) * 100 : 0;

    return (
      <div id="root" className="dashboard-page-view admin-dashboard animate-fade-in" style={{ background: '#0e041b', color: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Admin Header */}
        <header className="header" style={{ borderBottom: '1px solid rgba(217, 175, 86, 0.15)', background: '#120524' }}>
          <div className="container nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px' }}>
            <div className="logo-section" onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <div>
                <InvesthourLogoText customStyle={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', display: 'block' }} suffix=" Exchange" />
                <span style={{ fontSize: '10px', color: '#f43f5e', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Super Admin Console</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="admin-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(244, 63, 94, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#f43f5e', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #f43f5e' }}></span>
                <span style={{ fontSize: '12px', color: '#f43f5e', fontWeight: 600 }}>LIVE TRACKING</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>shivaram33987@gmail.com</div>
                <div style={{ fontSize: '11px', color: '#d9af56', fontWeight: 600 }}>Master Administrator</div>
              </div>
              <button 
                className="btn-sec-signout" 
                onClick={handleSignOut} 
                style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '8px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                <LogOut size={14} /> Exit Console
              </button>
            </div>
          </div>
        </header>

        {/* Admin notifications live updates bar */}
        {adminNotifications.length > 0 && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', borderBottom: '1px solid rgba(244, 63, 94, 0.25)', padding: '10px 20px', display: 'flex', gap: '15px', overflowX: 'auto', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', borderRight: '1px solid rgba(244, 63, 94, 0.3)', paddingRight: '15px', flexShrink: 0 }}>Live Activity Monitor</span>
            <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
              {adminNotifications.map(n => (
                <div key={n.id} style={{ fontSize: '13px', background: 'rgba(12, 5, 36, 0.9)', padding: '4px 12px', borderRadius: '6px', borderLeft: '3px solid #10b981', display: 'flex', alignItems: 'center', gap: '8px', animation: 'slide-in 0.3s ease-out' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>{n.clientName}</span>
                  <span style={{ color: '#9c93a8' }}>{n.action}</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>₹{n.amount.toLocaleString()}</span>
                  {n.weight > 0 && <span style={{ fontSize: '11px', color: '#d9af56' }}>({n.weight.toFixed(4)}g)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          
          {/* Top Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            
            {/* Metric 1 */}
            <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '12px', borderRadius: '10px' }}>
                <User size={24} />
              </div>
              <div>
                <span style={{ color: '#9c93a8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Registered Clients</span>
                <span style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff' }}>{clients.length} <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 'normal' }}>Active</span></span>
              </div>
            </div>

            {/* Metric 2 */}
            <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(217, 175, 86, 0.1)', color: '#d9af56', padding: '12px', borderRadius: '10px' }}>
                <Activity size={24} />
              </div>
              <div>
                <span style={{ color: '#9c93a8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Cumulative Transactions</span>
                <span style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff' }}>{allSystemTransactions.length} <span style={{ fontSize: '14px', color: '#d9af56', fontWeight: 'normal' }}>Ledgered</span></span>
              </div>
            </div>

            {/* Metric 3 */}
            <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '10px' }}>
                <Wallet size={24} />
              </div>
              <div>
                <span style={{ color: '#9c93a8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Platform Assets Managed</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>₹{totalSystemValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '12px', borderRadius: '10px' }}>
                <Shield size={24} />
              </div>
              <div>
                <span style={{ color: '#9c93a8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Physical Vault Reserves</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'block', marginTop: '4px' }}>
                  Au: {systemReserves.gold.toFixed(2)}g | Ag: {systemReserves.silver.toFixed(0)}g
                </span>
              </div>
            </div>

          </div>

          {/* Admin Tabs Toggle */}
          <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginTop: '10px' }}>
            <button 
              type="button"
              onClick={() => setAdminTab('clients')}
              style={{
                background: adminTab === 'clients' ? '#f43f5e' : 'transparent',
                color: '#ffffff',
                border: '1px solid',
                borderColor: adminTab === 'clients' ? '#f43f5e' : 'rgba(255,255,255,0.15)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              👥 Client Watchlist & Balances
            </button>
            <button 
              type="button"
              onClick={() => setAdminTab('contest')}
              style={{
                background: adminTab === 'contest' ? '#f43f5e' : 'transparent',
                color: '#ffffff',
                border: '1px solid',
                borderColor: adminTab === 'contest' ? '#f43f5e' : 'rgba(255,255,255,0.15)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              🏆 Contest Leaderboard & Participants
            </button>
            <button 
              type="button"
              onClick={() => setAdminTab('referrals')}
              style={{
                background: adminTab === 'referrals' ? '#f43f5e' : 'transparent',
                color: '#ffffff',
                border: '1px solid',
                borderColor: adminTab === 'referrals' ? '#f43f5e' : 'rgba(255,255,255,0.15)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              🎁 Referral Program Tracking
            </button>
          </div>

          {/* Main Content Workspace Split */}
          {adminTab === 'clients' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
            
            {/* Left Side: Client Roster list (7 Cols) */}
            <div style={{ gridColumn: 'span 7', background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>Registered Client Directory</h2>
                  <p style={{ fontSize: '12px', color: '#9c93a8', margin: '4px 0 0' }}>Real-time balance, KYC tracking, and portfolio inspect controls</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all client data? This action cannot be undone.')) {
                        localStorage.removeItem('vb_clients');
                        setClients([]);
                        setSelectedClientId('');
                        alert('All client data has been cleared successfully.');
                      }
                    }}
                    style={{ 
                      background: '#dc2626', 
                      color: '#ffffff', 
                      border: 'none', 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <X size={14} /> Clear All Data
                  </button>
                  <div style={{ background: '#1e0b36', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', color: '#d9af56', fontWeight: 600 }}>
                    {clients.length} Clients
                  </div>
                </div>
              </div>

              {/* Clients Roster Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '12px 10px', fontSize: '11px', color: '#9c93a8', textTransform: 'uppercase', fontWeight: 700 }}>Client Profile</th>
                      <th style={{ padding: '12px 10px', fontSize: '11px', color: '#9c93a8', textTransform: 'uppercase', fontWeight: 700 }}>Vault Wallet</th>
                      <th style={{ padding: '12px 10px', fontSize: '11px', color: '#9c93a8', textTransform: 'uppercase', fontWeight: 700 }}>KYC Status</th>
                      <th style={{ padding: '12px 10px', fontSize: '11px', color: '#9c93a8', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(c => {
                      const isSelected = selectedClientId === c.id;
                      const matchedVal = (c.holdings?.gold || 0) * rates.gold.price + (c.holdings?.silver || 0) * rates.silver.price + (c.holdings?.platinum || 0) * rates.platinum.price + (c.holdings?.iron || 0) * rates.iron.price + (c.walletBalance || 0);
                      return (
                        <tr 
                          key={c.id} 
                          onClick={() => setSelectedClientId(c.id)}
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.04)', 
                            background: isSelected ? 'rgba(244, 63, 94, 0.05)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          className="client-directory-row"
                        >
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: isSelected ? '#f43f5e' : '#ffffff' }}>{c.name}</div>
                            <div style={{ fontSize: '12px', color: '#9c93a8' }}>{c.email}</div>
                            <div style={{ fontSize: '10px', color: '#d9af56', fontFamily: 'monospace', marginTop: '2px' }}>
                              Code: IH-{c.email?.split('@')[0].toUpperCase() || 'USER'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#ffffff' }}>₹{c.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div style={{ fontSize: '11px', color: '#10b981' }}>Valuation: ₹{matchedVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              letterSpacing: '0.5px',
                              textTransform: 'uppercase',
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              background: c.kycStatus === 'Verified' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: c.kycStatus === 'Verified' ? '#10b981' : '#f59e0b',
                            }}>
                              {c.kycStatus}
                            </span>
                          </td>
                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClientId(c.id);
                                }}
                                style={{ 
                                  padding: '6px 12px', 
                                  fontSize: '12px', 
                                  border: '1px solid',
                                  borderColor: isSelected ? '#f43f5e' : 'rgba(255,255,255,0.15)', 
                                  background: isSelected ? '#f43f5e' : 'transparent',
                                  color: '#ffffff',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Inspect Portfolio
                              </button>
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to delete ${c.name}'s account? This will permanently delete:\n- Client profile data\n- Firebase authentication account\n- All transaction history\n\nThis action cannot be undone.`)) {
                                    try {
                                      // Call backend to delete Firebase user
                                      const response = await fetch(`${VITE_BACKEND_URL}/api/admin/delete-user`, {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json"
                                        },
                                        body: JSON.stringify({ 
                                          email: c.email,
                                          clientId: c.id 
                                        })
                                      });
                                      
                                      const data = await response.json();
                                      
                                      if (!response.ok) {
                                        console.warn("Firebase deletion warning:", data.message);
                                        // Continue with local deletion even if Firebase deletion fails
                                      }
                                      
                                      // Remove from local state and localStorage
                                      const updatedClients = clients.filter(client => client.id !== c.id);
                                      setClients(updatedClients);
                                      localStorage.setItem('vb_clients', JSON.stringify(updatedClients));
                                      
                                      // Update selected client if needed
                                      if (selectedClientId === c.id) {
                                        setSelectedClientId(updatedClients.length > 0 ? updatedClients[0].id : '');
                                      }
                                      
                                      alert(`${c.name}'s account has been deleted successfully from all systems.`);
                                    } catch (error) {
                                      console.error("Error deleting user:", error);
                                      // Still delete locally even if backend fails
                                      const updatedClients = clients.filter(client => client.id !== c.id);
                                      setClients(updatedClients);
                                      localStorage.setItem('vb_clients', JSON.stringify(updatedClients));
                                      
                                      if (selectedClientId === c.id) {
                                        setSelectedClientId(updatedClients.length > 0 ? updatedClients[0].id : '');
                                      }
                                      
                                      alert(`${c.name}'s local data has been deleted. Note: Firebase account deletion may have failed. Error: ${error.message}`);
                                    }
                                  }
                                }}
                                style={{ 
                                  padding: '6px 12px', 
                                  fontSize: '12px', 
                                  border: '1px solid #dc2626',
                                  background: 'transparent',
                                  color: '#dc2626',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title={`Delete ${c.name}'s account`}
                              >
                                <X size={14} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Master System-Wide Ledger monitor */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>System-Wide Transaction Feed</h3>
                  <span style={{ fontSize: '11px', color: '#9c93a8' }}>Sorted by recency</span>
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
                  {allSystemTransactions.map((tx, idx) => (
                    <div key={`${tx.id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', borderLeft: `3px solid ${tx.type === 'buy' ? '#a855f7' : tx.type === 'sell' ? '#d9af56' : tx.type === 'deposit' ? '#10b981' : '#f43f5e'}` }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>{tx.clientName}</span>
                          <span style={{ fontSize: '11px', color: '#9c93a8' }}>{tx.clientEmail}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#9c93a8', marginTop: '2px' }}>
                          {tx.type === 'buy' ? 'Purchased' : tx.type === 'sell' ? 'Sold' : tx.type === 'deposit' ? 'Deposited' : 'Withdrew'} {tx.asset !== 'wallet' ? getAssetLabel(tx.asset) : 'Wallet Credits'} • {tx.date}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '13px' }}>
                          ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {tx.weight > 0 && (
                          <div style={{ fontSize: '10px', color: '#d9af56' }}>
                            {tx.weight.toFixed(4)} g
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Side: Visual Inspector Pane (5 Cols) */}
            <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Customer Inspection Dashboard Card */}
              <div style={{ background: '#120524', border: '1px solid rgba(217, 175, 86, 0.2)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                  <span style={{ fontSize: '10px', color: '#d9af56', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Vault Client Inspector</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: 0 }}>{inspectedClient.name}</h2>
                    <span style={{ fontSize: '11px', color: '#9c93a8' }}>ID: {inspectedClient.id}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9c93a8', marginTop: '2px' }}>{inspectedClient.email} • {inspectedClient.phone}</div>
                </div>

                {/* KYC Interactive Toggle Panel */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block' }}>KYC Status Verification</span>
                    <strong style={{ color: inspectedClient.kycStatus === 'Verified' ? '#10b981' : '#f59e0b', fontSize: '13px' }}>{inspectedClient.kycStatus}</strong>
                  </div>
                  <button 
                    onClick={() => {
                      const updated = clients.map(c => {
                        if (c.id === inspectedClient.id) {
                          return {
                            ...c,
                            kycStatus: c.kycStatus === 'Verified' ? 'Pending' : 'Verified'
                          };
                        }
                        return c;
                      });
                      setClients(updated);
                      localStorage.setItem('vb_clients', JSON.stringify(updated));
                    }}
                    style={{ background: inspectedClient.kycStatus === 'Verified' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: inspectedClient.kycStatus === 'Verified' ? '#f59e0b' : '#10b981', border: '1px solid', borderColor: inspectedClient.kycStatus === 'Verified' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {inspectedClient.kycStatus === 'Verified' ? 'Revoke Approval' : 'Approve KYC'}
                  </button>
                </div>

                {/* Inspected Customer Wallet & Assets Grid */}
                <div>
                  <h4 style={{ fontSize: '12px', color: '#9c93a8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>Vault Assets & Balances</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    
                    <div style={{ background: '#1e0b36', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block' }}>Wallet Balance</span>
                      <strong style={{ fontSize: '15px', color: '#ffffff' }}>₹{inspectedClient.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>

                    <div style={{ background: 'rgba(217,175,86,0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(217,175,86,0.15)' }}>
                      <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block' }}>🥇 Gold Holdings</span>
                      <strong style={{ fontSize: '15px', color: '#d9af56' }}>{(inspectedClient.holdings?.gold || 0).toFixed(4)} g</strong>
                      <span style={{ fontSize: '10px', color: '#9c93a8', display: 'block' }}>₹{clientGoldVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>

                    <div style={{ background: 'rgba(192,192,192,0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(192,192,192,0.15)' }}>
                      <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block' }}>🥈 Silver Holdings</span>
                      <strong style={{ fontSize: '15px', color: '#c0c0c0' }}>{(inspectedClient.holdings?.silver || 0).toFixed(4)} g</strong>
                      <span style={{ fontSize: '10px', color: '#9c93a8', display: 'block' }}>₹{clientSilverVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>

                    <div style={{ background: 'rgba(229,228,226,0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(229,228,226,0.15)' }}>
                      <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block' }}>💎 Platinum Holdings</span>
                      <strong style={{ fontSize: '15px', color: '#e5e4e2' }}>{(inspectedClient.holdings?.platinum || 0).toFixed(4)} g</strong>
                      <span style={{ fontSize: '10px', color: '#9c93a8', display: 'block' }}>₹{clientPlatinumVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>

                    <div style={{ background: 'rgba(136,136,136,0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(136,136,136,0.15)' }}>
                      <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block' }}>⚙️ Iron Holdings</span>
                      <strong style={{ fontSize: '15px', color: '#888888' }}>{(inspectedClient.holdings?.iron || 0).toFixed(4)} g</strong>
                      <span style={{ fontSize: '10px', color: '#9c93a8', display: 'block' }}>₹{clientIronVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>

                  </div>
                </div>

                {/* Visual Portfolio Allocation Chart Segment Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '12px', color: '#9c93a8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Asset Allocation Breakdown</h4>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Total: ₹{clientTotalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  
                  {/* Progress bar allocations */}
                  <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }}>
                    {goldPct > 0 && <div style={{ width: `${goldPct}%`, background: '#d9af56', transition: 'width 0.4s' }} title={`Gold: ${goldPct.toFixed(1)}%`}></div>}
                    {silverPct > 0 && <div style={{ width: `${silverPct}%`, background: '#c0c0c0', transition: 'width 0.4s' }} title={`Silver: ${silverPct.toFixed(1)}%`}></div>}
                    {platinumPct > 0 && <div style={{ width: `${platinumPct}%`, background: '#e5e4e2', transition: 'width 0.4s' }} title={`Platinum: ${platinumPct.toFixed(1)}%`}></div>}
                    {ironPct > 0 && <div style={{ width: `${ironPct}%`, background: '#888888', transition: 'width 0.4s' }} title={`Iron: ${ironPct.toFixed(1)}%`}></div>}
                    {cashPct > 0 && <div style={{ width: `${cashPct}%`, background: '#10b981', transition: 'width 0.4s' }} title={`Cash: ${cashPct.toFixed(1)}%`}></div>}
                  </div>

                  {/* Allocation Legends */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '10px', color: '#9c93a8', marginTop: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d9af56' }}></span> Gold ({goldPct.toFixed(0)}%)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c0c0c0' }}></span> Silver ({silverPct.toFixed(0)}%)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e5e4e2' }}></span> Platinum ({platinumPct.toFixed(0)}%)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#888888' }}></span> Iron ({ironPct.toFixed(0)}%)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Cash ({cashPct.toFixed(0)}%)</span>
                  </div>
                </div>

                {/* Client Referral Details */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '12px', color: '#9c93a8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Client Referral Details</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#ec4899', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Gift size={12} /> {inspectedClient.referralCount !== undefined ? inspectedClient.referralCount : (user && inspectedClient.email?.toLowerCase() === user.email?.toLowerCase() ? successfulReferralsCount : Math.floor((inspectedClient.name?.charCodeAt(0) || 0) * 12) % 1550)} Referrals
                      </span>
                      <button
                        onClick={() => {
                          const currentCount = inspectedClient.referralCount !== undefined ? inspectedClient.referralCount : (user && inspectedClient.email?.toLowerCase() === user.email?.toLowerCase() ? successfulReferralsCount : Math.floor((inspectedClient.name?.charCodeAt(0) || 0) * 12) % 1550);
                          const newCount = prompt(`Enter new referral count for ${inspectedClient.name}:`, currentCount);
                          if (newCount !== null) {
                            const parsed = parseInt(newCount, 10);
                            if (isNaN(parsed) || parsed < 0) return alert("Please enter a valid non-negative number.");
                            
                            const updated = clients.map(client => {
                              if (client.id === inspectedClient.id) {
                                return { ...client, referralCount: parsed };
                              }
                              return client;
                            });
                            setClients(updated);
                            localStorage.setItem('vb_clients', JSON.stringify(updated));
                            
                            if (user && inspectedClient.email?.toLowerCase() === user.email?.toLowerCase()) {
                              setSuccessfulReferralsCount(parsed);
                            }
                            
                            alert(`Successfully updated referral count for ${inspectedClient.name} to ${parsed}.`);
                          }
                        }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Edit Count
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#9c93a8' }}>Unique Code</span>
                      <strong style={{ fontSize: '13px', color: '#d9af56', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                        IH-{inspectedClient.email?.split('@')[0].toUpperCase() || 'USER'}
                      </strong>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                      <span style={{ fontSize: '10px', color: '#9c93a8' }}>Account Registration URL</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <input 
                          type="text" 
                          readOnly 
                          value={`https://invest-hour.com?ref=IH-${inspectedClient.email?.split('@')[0].toUpperCase() || 'USER'}`} 
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#ffffff', fontSize: '11px', outline: 'none', padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        />
                        <button 
                          onClick={() => {
                            const link = `https://invest-hour.com?ref=IH-${inspectedClient.email?.split('@')[0].toUpperCase() || 'USER'}`;
                            navigator.clipboard.writeText(link);
                            setCopiedInspectedReferralLink(true);
                            setTimeout(() => setCopiedInspectedReferralLink(false), 2000);
                          }}
                          style={{ background: 'transparent', border: 'none', color: copiedInspectedReferralLink ? '#10b981' : '#9c93a8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', transition: 'color 0.2s' }}
                          title="Copy Link"
                        >
                          {copiedInspectedReferralLink ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Credit / Adjustments Controls */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '12px', color: '#9c93a8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Wallet Vault Ledger Adjuster</h4>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ display: 'flex', flex: 1, gap: '6px' }}>
                      <input 
                        type="number" 
                        placeholder="Amt (₹)" 
                        value={adminCreditAmount}
                        onChange={(e) => setAdminCreditAmount(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#ffffff', fontSize: '13px' }}
                      />
                      <button 
                        onClick={() => {
                          const val = parseFloat(adminCreditAmount);
                          if (isNaN(val) || val <= 0) return alert("Please enter a valid credit amount.");
                          const updated = clients.map(c => {
                            if (c.id === inspectedClient.id) {
                              const newTx = {
                                id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
                                type: 'deposit',
                                asset: 'wallet',
                                amount: val,
                                weight: 0,
                                date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                                status: 'Completed'
                              };
                              return {
                                ...c,
                                walletBalance: parseFloat((c.walletBalance + val).toFixed(2)),
                                transactions: [newTx, ...c.transactions]
                              };
                            }
                            return c;
                          });
                          setClients(updated);
                          localStorage.setItem('vb_clients', JSON.stringify(updated));
                          setAdminCreditAmount('');
                          alert(`Successfully credited ₹${val.toLocaleString()} to ${inspectedClient.name}'s wallet.`);
                        }}
                        style={{ background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={14} /> Credit
                      </button>
                    </div>

                    <div style={{ display: 'flex', flex: 1, gap: '6px' }}>
                      <input 
                        type="number" 
                        placeholder="Amt (₹)" 
                        value={adminDeductAmount}
                        onChange={(e) => setAdminDeductAmount(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#ffffff', fontSize: '13px' }}
                      />
                      <button 
                        onClick={() => {
                          const val = parseFloat(adminDeductAmount);
                          if (isNaN(val) || val <= 0) return alert("Please enter a valid deduction amount.");
                          if (inspectedClient.walletBalance < val) return alert("Deduction value exceeds customer's active wallet balance.");
                          const updated = clients.map(c => {
                            if (c.id === inspectedClient.id) {
                              const newTx = {
                                id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
                                type: 'withdrawal',
                                asset: 'wallet',
                                amount: val,
                                weight: 0,
                                date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                                status: 'Completed'
                              };
                              return {
                                ...c,
                                walletBalance: parseFloat((c.walletBalance - val).toFixed(2)),
                                transactions: [newTx, ...c.transactions]
                              };
                            }
                            return c;
                          });
                          setClients(updated);
                          localStorage.setItem('vb_clients', JSON.stringify(updated));
                          setAdminDeductAmount('');
                          alert(`Successfully deducted ₹${val.toLocaleString()} from ${inspectedClient.name}'s wallet.`);
                        }}
                        style={{ background: '#f43f5e', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Minus size={14} /> Deduct
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* Inspected client specific scrollable transaction history */}
              <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>Client Personal Ledger</h4>
                  <span style={{ fontSize: '11px', color: '#9c93a8' }}>{inspectedClient.transactions?.length || 0} Records</span>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px' }}>
                  {inspectedClient.transactions?.map((tx, idx) => (
                    <div key={`${tx.id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: tx.type === 'buy' ? '#a855f7' : tx.type === 'sell' ? '#d9af56' : tx.type === 'deposit' ? '#10b981' : '#f43f5e' }}>
                          {tx.type === 'deposit' ? 'Added Funds' : tx.type === 'withdrawal' ? 'Withdrew Cash' : tx.type === 'buy' ? `Bought ${getAssetLabel(tx.asset)}` : `Sold ${getAssetLabel(tx.asset)}`}
                        </strong>
                        <div style={{ fontSize: '11px', color: '#9c93a8', marginTop: '2px' }}>{tx.date} • ID: {tx.id}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px' }}>₹{tx.amount.toLocaleString()}</span>
                        {tx.weight > 0 && <div style={{ fontSize: '10px', color: '#d9af56' }}>{tx.weight.toFixed(4)} g</div>}
                      </div>
                    </div>
                  ))}
                  {(!inspectedClient.transactions || inspectedClient.transactions.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#9c93a8', fontSize: '12px' }}>No transactions recorded yet.</div>
                  )}
                </div>
              </div>

            </div>

          </div>
          )}

          {/* Contest Management Tab content */}
          {adminTab === 'contest' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
              {/* Left Column: Contest Roster */}
              <div style={{ gridColumn: 'span 7', background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>Tournament Roster Manager</h2>
                    <p style={{ fontSize: '12px', color: '#9c93a8', margin: '4px 0 0' }}>Inspect contestant metrics, success rates, overrides, and logs</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAdminGenerateMockContestants}
                    style={{ background: '#f43f5e', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    🏆 Seed Tournament Data
                  </button>
                </div>

                <input 
                  type="text" 
                  placeholder="Search participants by name or email..." 
                  value={contestSearchQuery}
                  onChange={(e) => setContestSearchQuery(e.target.value)}
                  style={{
                    background: '#0c0615',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: '12px 10px', fontSize: '11px', color: '#9c93a8', textTransform: 'uppercase', fontWeight: 700 }}>Trader</th>
                        <th style={{ padding: '12px 10px', fontSize: '11px', color: '#9c93a8', textTransform: 'uppercase', fontWeight: 700 }}>Balance</th>
                        <th style={{ padding: '12px 10px', fontSize: '11px', color: '#9c93a8', textTransform: 'uppercase', fontWeight: 700 }}>Trades</th>
                        <th style={{ padding: '12px 10px', fontSize: '11px', color: '#9c93a8', textTransform: 'uppercase', fontWeight: 700 }}>Win Rate</th>
                        <th style={{ padding: '12px 10px', fontSize: '11px', color: '#9c93a8', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contestParticipants
                        .filter(p => p.name?.toLowerCase().includes(contestSearchQuery.toLowerCase()) || p.email?.toLowerCase().includes(contestSearchQuery.toLowerCase()))
                        .map(p => {
                          const isSelected = selectedContestParticipant?.email === p.email;
                          return (
                            <tr 
                              key={p.email}
                              onClick={() => {
                                setSelectedContestParticipant(p);
                                fetchParticipantTrades(p.email);
                              }}
                              style={{ 
                                borderBottom: '1px solid rgba(255,255,255,0.04)', 
                                background: isSelected ? 'rgba(244, 63, 94, 0.05)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              className="client-directory-row"
                            >
                              <td style={{ padding: '14px 10px' }}>
                                <div style={{ fontWeight: '700', fontSize: '14px', color: isSelected ? '#f43f5e' : '#ffffff' }}>{p.name}</div>
                                <div style={{ fontSize: '11.5px', color: '#9c93a8' }}>{p.email}</div>
                              </td>
                              <td style={{ padding: '14px 10px', fontWeight: '700' }}>
                                ₹{parseFloat(p.balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </td>
                              <td style={{ padding: '14px 10px', color: p.total_trades >= 365 ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                                {p.total_trades}
                              </td>
                              <td style={{ padding: '14px 10px', color: '#10b981', fontWeight: 700 }}>
                                {parseFloat(p.success_rate).toFixed(1)}%
                              </td>
                              <td style={{ padding: '14px 10px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => {
                                      const bal = prompt("Enter new Balance (INR):", p.balance);
                                      const total = prompt("Enter total Trades completed:", p.total_trades);
                                      const profit = prompt("Enter profitable Trades:", p.profit_trades);
                                      const loss = prompt("Enter losing Trades:", p.loss_trades);
                                      if (bal !== null && total !== null && profit !== null && loss !== null) {
                                        const rate = total > 0 ? ((profit / total) * 100).toFixed(2) : '0.00';
                                        handleAdminUpdateContestant(p.email, {
                                          balance: bal,
                                          totalTrades: total,
                                          profitTrades: profit,
                                          lossTrades: loss,
                                          successRate: rate
                                        });
                                      }
                                    }}
                                    style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleAdminResetContestant(p.email)}
                                    style={{ background: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    Reset
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {contestParticipants.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#9c93a8' }}>
                            No contestants registered yet. Use the button above to seed mock tournament data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Contestant Detail Panel */}
              <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {selectedContestParticipant ? (
                  <div style={{ background: '#120524', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#f43f5e', margin: 0 }}>Tournament Inspector</h3>
                      <p style={{ fontSize: '12px', color: '#9c93a8', margin: '4px 0 0' }}>Reviewing user: {selectedContestParticipant.name}</p>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9c93a8' }}>Email Address</span>
                        <strong>{selectedContestParticipant.email}</strong>
                      </div>
                      <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9c93a8' }}>Contest Balance</span>
                        <strong style={{ color: '#d9af56' }}>₹{parseFloat(selectedContestParticipant.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9c93a8' }}>Win Rate Status</span>
                        <strong style={{ color: '#10b981' }}>{parseFloat(selectedContestParticipant.success_rate).toFixed(1)}%</strong>
                      </div>
                      <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9c93a8' }}>Trades Recorded</span>
                        <strong>{selectedContestParticipant.total_trades} / 365</strong>
                      </div>
                      <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9c93a8' }}>Winning Trades</span>
                        <strong style={{ color: '#10b981' }}>{selectedContestParticipant.profit_trades}</strong>
                      </div>
                      <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9c93a8' }}>Losing Trades</span>
                        <strong style={{ color: '#ef4444' }}>{selectedContestParticipant.loss_trades}</strong>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Contest Trade Feed</h4>
                      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px' }}>
                        {contestParticipantTrades.map((tx) => (
                          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px' }}>
                            <div>
                              <strong style={{ fontSize: '13px', color: tx.type === 'BUY' ? '#10b981' : '#f43f5e' }}>
                                {tx.type} {tx.symbol}
                              </strong>
                              <div style={{ fontSize: '11px', color: '#9c93a8', marginTop: '2px' }}>Price: ₹{parseFloat(tx.price).toFixed(2)} • Risk: ₹{parseFloat(tx.entry_amount).toLocaleString()}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 800, fontSize: '13px', color: tx.status === 'WON' ? '#10b981' : (tx.status === 'LOST' ? '#ef4444' : '#fff') }}>
                                {tx.status === 'WON' ? '+' : ''}{tx.status !== 'OPEN' ? `₹${parseFloat(tx.pnl).toLocaleString()}` : 'OPEN'}
                              </span>
                              <div style={{ fontSize: '10px', color: '#9c93a8' }}>{new Date(tx.timestamp).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        ))}
                        {contestParticipantTrades.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '20px 0', color: '#9c93a8', fontSize: '12px' }}>No contest trades placed yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#9c93a8' }}>
                    Select a contestant from the roster to inspect their live statistics, override credentials, and logs.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Referral Program Tracking Tab content */}
          {adminTab === 'referrals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fade-in 0.3s ease-out' }}>
              {/* Referrals Metric Overview Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '12px', borderRadius: '10px' }}>
                    <Gift size={24} />
                  </div>
                  <div>
                    <span style={{ color: '#9c93a8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Registered Referrals</span>
                    <span style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff' }}>
                      {clients.reduce((acc, c) => acc + (c.referralCount !== undefined ? c.referralCount : Math.floor((c.name.charCodeAt(0) || 0) * 12) % 1550), 0)} <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 'normal' }}>Invited</span>
                    </span>
                  </div>
                </div>

                <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(217, 175, 86, 0.1)', color: '#d9af56', padding: '12px', borderRadius: '10px' }}>
                    <Star size={24} />
                  </div>
                  <div>
                    <span style={{ color: '#9c93a8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Gold Coin Milestone Achievers</span>
                    <span style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff' }}>
                      {clients.filter(c => (c.referralCount !== undefined ? c.referralCount : Math.floor((c.name.charCodeAt(0) || 0) * 12) % 1550) >= 1500).length} <span style={{ fontSize: '14px', color: '#d9af56', fontWeight: 'normal' }}>Claimable</span>
                    </span>
                  </div>
                </div>

                <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '10px' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <span style={{ color: '#9c93a8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Gold Bonus Paid Out (Est.)</span>
                    <span style={{ fontSize: '26px', fontWeight: '800', color: '#10b981' }}>
                      ₹{(clients.reduce((acc, c) => acc + (c.referralCount !== undefined ? c.referralCount : Math.floor((c.name.charCodeAt(0) || 0) * 12) % 1550), 0) * 10).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Roster of clients and their referral stats */}
              <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Referral Ledger Directory</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#9c93a8' }}>Review client referral counts, gold payouts, and milestone eligibility for the 1 Gram Physical Gold Coin.</p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9c93a8', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800 }}>
                        <th style={{ padding: '12px 10px' }}>Customer Name / ID</th>
                        <th style={{ padding: '12px 10px' }}>Invites Count</th>
                        <th style={{ padding: '12px 10px' }}>Gold Earned (Est.)</th>
                        <th style={{ padding: '12px 10px' }}>Milestone Progress (to 1500)</th>
                        <th style={{ padding: '12px 10px' }}>Milestone Status</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map(c => {
                        const count = c.referralCount !== undefined ? c.referralCount : (user && c.email.toLowerCase() === user.email.toLowerCase() ? successfulReferralsCount : Math.floor((c.name.charCodeAt(0) || 0) * 12) % 1550);
                        const pct = Math.min(100, (count / 1500) * 100);
                        const isEligible = count >= 1500;
                        
                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                            <td style={{ padding: '14px 10px' }}>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: '#ffffff' }}>{c.name}</div>
                              <div style={{ fontSize: '12px', color: '#9c93a8' }}>{c.email}</div>
                            </td>
                            <td style={{ padding: '14px 10px' }}>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: '#ffffff' }}>{count}</div>
                            </td>
                            <td style={{ padding: '14px 10px' }}>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: '#10b981' }}>₹{(count * 10).toLocaleString()}</div>
                              <div style={{ fontSize: '11px', color: '#d9af56' }}>{((count * 10) / rates.gold.price).toFixed(4)} g Gold</div>
                            </td>
                            <td style={{ padding: '14px 10px', minWidth: '150px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: isEligible ? 'linear-gradient(90deg, #d9af56, #f5d061)' : '#ec4899', borderRadius: '3px' }}></div>
                                </div>
                                <span style={{ fontSize: '11px', color: '#9c93a8', fontWeight: 600 }}>{pct.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 10px' }}>
                              {isEligible ? (
                                <span style={{ fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', background: 'rgba(217, 175, 86, 0.15)', color: '#d9af56', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  🏆 1g Coin Unlocked
                                </span>
                              ) : (
                                <span style={{ fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#9c93a8' }}>
                                  Progressing
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                              <button 
                                onClick={() => {
                                  const newCount = prompt(`Enter new referral count for ${c.name}:`, count);
                                  if (newCount !== null) {
                                    const parsed = parseInt(newCount, 10);
                                    if (isNaN(parsed) || parsed < 0) return alert("Please enter a valid non-negative number.");
                                    
                                    const updated = clients.map(client => {
                                      if (client.id === c.id) {
                                        return { ...client, referralCount: parsed };
                                      }
                                      return client;
                                    });
                                    setClients(updated);
                                    localStorage.setItem('vb_clients', JSON.stringify(updated));
                                    
                                    if (user && c.email.toLowerCase() === user.email.toLowerCase()) {
                                      setSuccessfulReferralsCount(parsed);
                                    }
                                    
                                    alert(`Successfully updated referral count for ${c.name} to ${parsed}.`);
                                  }
                                }}
                                style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#ffffff', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
                              >
                                Edit Count
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {clients.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#9c93a8' }}>No clients registered yet to track referrals.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>

        <footer style={{ background: '#120524', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#9c93a8', marginTop: 'auto' }}>
          © 2026 Investhour Digital Commodities Exchange. Secure Master Administrative Access Console.
        </footer>
      </div>
    );
  }
  const renderTickerItems = (prefix) =>
    Object.keys(rates).flatMap((asset) => {
      const data = rates[asset];
      return [
        <div className="ticker-item" key={`${prefix}-${asset}-1`}>
          <span className="ticker-name">{getAssetLabel(asset)}</span>
          <span className="ticker-val">{'\u20b9'}{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className={`ticker-change ${data.change >= 0 ? 'up' : 'down'}`}>
            {data.change >= 0 ? <ArrowUpRight size={14} strokeWidth={2.5} /> : <ArrowDownRight size={14} strokeWidth={2.5} />}
            {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.pct >= 0 ? '+' : ''}{data.pct.toFixed(2)}%)
          </span>
          <span className="ticker-separator">|</span>
        </div>,
        <div className="ticker-item" key={`${prefix}-${asset}-2`}>
          <span className="ticker-name">{getAssetLabel(asset)}</span>
          <span className="ticker-val">{'\u20b9'}{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className={`ticker-change ${data.change >= 0 ? 'up' : 'down'}`}>
            {data.change >= 0 ? <ArrowUpRight size={14} strokeWidth={2.5} /> : <ArrowDownRight size={14} strokeWidth={2.5} />}
            {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.pct >= 0 ? '+' : ''}{data.pct.toFixed(2)}%)
          </span>
          <span className="ticker-separator">|</span>
        </div>,
      ];
    });

  if (view === 'dashboard') {
    const goldVal = (holdings?.gold || 0) * rates.gold.price;
    const silverVal = (holdings?.silver || 0) * rates.silver.price;
    const totalValuation = goldVal + silverVal + walletBalance;

    return (
      <div id="root" className="dashboard-page-view animate-fade-in">
        {/* Dashboard Header */}
        <header className="header">
          <div className="container nav-container">
            <div className="logo-section">
              <InvesthourLogoText />
            </div>
            
            <nav className="nav-menu dashboard-nav">
              <button 
                className={`dash-nav-item ${dashTab === 'portfolio' ? 'active' : ''}`}
                onClick={() => setDashTab('portfolio')}
              >
                <Briefcase size={16} /> Portfolio
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'trade' ? 'active' : ''}`}
                onClick={() => setDashTab('trade')}
              >
                <ArrowRightLeft size={16} /> Trade
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'wallet' ? 'active' : ''}`}
                onClick={() => setDashTab('wallet')}
              >
                <Wallet size={16} /> Wallet
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'contest' ? 'active' : ''}`}
                onClick={() => setDashTab('contest')}
              >
                <Star size={16} /> Contest Awards
              </button>
              <button 
                className="dash-nav-item"
                onClick={() => setView('about')}
              >
                <Gem size={16} /> Explore Elements
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'referral' ? 'active' : ''}`}
                onClick={() => setDashTab('referral')}
              >
                <Gift size={16} /> Referral Program
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'profile' ? 'active' : ''}`}
                onClick={() => setDashTab('profile')}
              >
                <User size={16} /> Vault Profile
              </button>
            </nav>
            
            <div className="dash-user-badge">
              <div className="user-info-text">
                <span className="user-email-text">{user?.email || 'vault.holder@example.com'}</span>
                <span className="kyc-badge">KYC SECURED</span>
              </div>
              <button className="btn-sec-signout" onClick={handleSignOut} title="Secure Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Live Rates Ticker */}
        <div className="ticker-bar">
          <div className="ticker-track">
            {Object.entries(rates).map(([key, data]) => (
              <div className="ticker-item" key={`dash-t1-${key}`}>
                <span className="ticker-name">{key}</span>
                <span className="ticker-val">{'₹'}{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`ticker-change ${data.change >= 0 ? 'up' : 'down'}`}>
                  {data.change >= 0 ? <ArrowUpRight size={14} strokeWidth={2.5} /> : <ArrowDownRight size={14} strokeWidth={2.5} />}
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.pct >= 0 ? '+' : ''}{data.pct.toFixed(2)}%)
                </span>
                <span className="ticker-separator">|</span>
              </div>
            ))}
            {/* Duplicate for scrolling */}
            {Object.entries(rates).map(([key, data]) => (
              <div className="ticker-item" key={`dash-t2-${key}`}>
                <span className="ticker-name">{key}</span>
                <span className="ticker-val">{'\u20b9'}{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`ticker-change ${data.change >= 0 ? 'up' : 'down'}`}>
                  {data.change >= 0 ? <ArrowUpRight size={14} strokeWidth={2.5} /> : <ArrowDownRight size={14} strokeWidth={2.5} />}
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.pct >= 0 ? '+' : ''}{data.pct.toFixed(2)}%)
                </span>
                <span className="ticker-separator">|</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Views Container */}
        <main className={`dashboard-content ${dashTab === 'trade' ? 'fluid-container' : 'container'}`}>
          {dashTab === 'portfolio' && (
            <div className="tab-pane-view portfolio-view animate-fade-in">
              <div className="portfolio-hero-grid">
                {/* Total Value Card */}
                <div className="portfolio-value-card">
                  <div className="val-card-header">
                    <span>TOTAL VAULT ASSETS VALUE</span>
                    <span className="secured-badge"><Shield size={12} /> 100% physically backed</span>
                  </div>
                  <div className="total-valuation-display">
                    ₹{totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="valuation-trend-row">
                    <span className="trend-percentage positive">
                      <TrendingUp size={14} /> +5.40%
                    </span>
                    <span>All-Time Vault Growth</span>
                  </div>
                  <div className="cash-indicator">
                    <Wallet size={12} /> Available Cash: ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Allocation Chart Card */}
                <div className="portfolio-allocation-card">
                  <h3>Asset Allocation</h3>
                  <div className="allocation-details-row">
                    <div className="alloc-bar-container">
                      <div className="alloc-segment gold" style={{ width: `${(goldVal / totalValuation) * 100}%` }} title="Gold"></div>
                      <div className="alloc-segment silver" style={{ width: `${(silverVal / totalValuation) * 100}%` }} title="Silver"></div>
                      <div className="alloc-segment cash" style={{ width: `${(walletBalance / totalValuation) * 100}%` }} title="Cash"></div>
                    </div>
                    <div className="alloc-legend-grid">
                      <div className="legend-item"><span className="dot gold"></span> Gold: {((goldVal / totalValuation) * 100).toFixed(1)}%</div>
                      <div className="legend-item"><span className="dot silver"></span> Silver: {((silverVal / totalValuation) * 100).toFixed(1)}%</div>
                      <div className="legend-item"><span className="dot cash"></span> Cash: {((walletBalance / totalValuation) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Holdings Grid */}
              <h3 className="section-title">Your Physical Metal Vaults</h3>
              <div className="holdings-grid">
                {/* Gold Card */}
                <div className="holding-card gold">
                  <div className="card-top">
                    <h4>Gold Vault</h4>
                    <span className="symbol-label">AU</span>
                  </div>
                  <div className="holding-weight">{(holdings?.gold || 0).toFixed(4)} <span className="grams-lbl">g</span></div>
                  <div className="holding-value">₹{goldVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="holding-action-row">
                    <span className="live-pricing-indicator">₹{rates.gold.price.toFixed(2)}/g</span>
                    <button className="btn-card-action" onClick={() => { setActiveAsset('gold'); setDashTab('trade'); }}>Trade</button>
                  </div>
                </div>

                {/* Silver Card */}
                <div className="holding-card silver">
                  <div className="card-top">
                    <h4>Silver Vault</h4>
                    <span className="symbol-label">AG</span>
                  </div>
                  <div className="holding-weight">{(holdings?.silver || 0).toFixed(4)} <span className="grams-lbl">g</span></div>
                  <div className="holding-value">₹{silverVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="holding-action-row">
                    <span className="live-pricing-indicator">₹{rates.silver.price.toFixed(2)}/g</span>
                    <button className="btn-card-action" onClick={() => { setActiveAsset('silver'); setDashTab('trade'); }}>Trade</button>
                  </div>
                </div>



              </div>

              <div className="activity-ledger-section">
                <div className="ledger-header">
                  <h3>Recent Vault Activity</h3>
                  <button type="button" className="btn-text-link" onClick={() => setDashTab('wallet')}>View All Ledger</button>
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
                            <span className={`tx-type-tag ${tx.type}`}>
                              {tx.type === 'deposit' ? <ArrowDownLeft size={12} /> : tx.type === 'buy' ? <Plus size={12} /> : <Minus size={12} />}
                              {tx.type}
                            </span>
                          </td>
                          <td>{getAssetLabel(tx.asset)}</td>
                          <td>{tx.weight > 0 ? `${tx.weight.toFixed(4)} g` : '-'}</td>
                          <td className={`tx-amt-col ${tx.type}`}>
                            {tx.type === 'buy' ? '-' : '+'}{'\u20b9'}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
            <div className="tab-pane-view trade-view animate-fade-in" style={{ display: 'flex', gap: '30px', width: '100%', padding: '0 40px', boxSizing: 'border-box' }}>
              {/* Disclaimer on the left side */}
              <div style={{ 
                width: '260px', 
                flexShrink: 0, 
                alignSelf: 'flex-start', 
                background: 'rgba(217, 175, 86, 0.05)', 
                border: '1px solid rgba(217, 175, 86, 0.2)', 
                borderRadius: '16px', 
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} style={{ color: '#d9af56' }} />
                  <h3 style={{ color: '#d9af56', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Disclaimer</h3>
                </div>
                <p style={{ lineHeight: '1.6', margin: 0, color: '#e5d3b3', fontSize: '12.5px' }}>
                  Past performance in paper trading does not guarantee future results in real trading. Users are solely responsible for their investment and trading decisions. This platform does not provide financial, investment, or legal advice. This is completely based on your technical knowledge and only for practice session.
                </p>
                {!disclaimerAccepted ? (
                  <button 
                    onClick={() => {
                      setDisclaimerAccepted(true);
                      localStorage.setItem('vb_disclaimer_accepted', 'true');
                    }}
                    style={{
                      background: '#d9af56',
                      color: '#120524',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginTop: '5px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                  >
                    I Accept
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setDisclaimerAccepted(false);
                      localStorage.removeItem('vb_disclaimer_accepted');
                    }}
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginTop: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: 'center',
                      width: '100%'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
                    onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                  >
                    <CheckCircle2 size={14} /> Accepted
                  </button>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <LiveChartWidget user={user} />
              </div>
            </div>
          )}

          {dashTab === 'wallet' && (
            <div className="tab-pane-view wallet-view animate-fade-in">
              <div className="grid-2col wallet-layout-grid">
                <div className="wallet-balance-pane">
                  <div className="credit-card-wallet">
                    <div className="card-top-row">
                      <span className="vault-acc-id">Investhour SECURE WALLET</span>
                      <CreditCard size={20} className="cc-icon" />
                    </div>
                    <div className="cc-balance-lbl">Available Wallet Cash</div>
                    <div className="cc-balance-val">{'\u20b9'}{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="card-bottom-row">
                      <span>Vault holder: {user?.email?.split('@')[0].toUpperCase()}</span>
                      <span>STATUS: SECURED</span>
                    </div>
                  </div>
                  <div className="wallet-funding-actions">
                    <h3>Deposit & Withdraw Funds</h3>
                    <div className="funding-inputs-row">
                      <div className="funding-input-group">
                        <label>Deposit Amount (INR)</label>
                        <div className="funding-input-field-wrapper">
                          <span className="currency-symbol">{'\u20b9'}</span>
                          <input type="number" placeholder="Enter amount to add" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                        </div>
                        <RazorpayButton 
                          amount={parseFloat(depositAmount) || 0} 
                          type="deposit" 
                          onSuccess={(data) => {
                            const val = parseFloat(depositAmount);
                            setWalletBalance((prev) => parseFloat((prev + val).toFixed(2)));
                            setTransactions((prev) => [{ id: `TX-${Math.floor(1000 + Math.random() * 9000)}`, type: 'deposit', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                            setDepositAmount('');
                          }}
                        />
                      </div>
                      <div className="funding-input-group">
                        <label>Withdraw Amount (INR)</label>
                        <div className="funding-input-field-wrapper">
                          <span className="currency-symbol">{'\u20b9'}</span>
                          <input type="number" placeholder="Enter amount to withdraw" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                        </div>
                        <RazorpayButton 
                          amount={parseFloat(withdrawAmount) || 0} 
                          type="withdraw" 
                          onSuccess={(data) => {
                            const val = parseFloat(withdrawAmount);
                            setWalletBalance((prev) => parseFloat((prev - val).toFixed(2)));
                            setTransactions((prev) => [{ id: `TX-${Math.floor(1000 + Math.random() * 9000)}`, type: 'withdrawal', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                            setWithdrawAmount('');
                          }}
                          onError={(err) => {
                            if (err?.response?.data?.error === 'Insufficient wallet balance' || walletBalance < parseFloat(withdrawAmount)) {
                               alert('Insufficient balance in your secure wallet.');
                            }
                          }}
                        />
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
                          <div className={`ledger-type-circle ${tx.type}`}>
                            {tx.type === 'deposit' ? <ArrowDownLeft size={16} /> : tx.type === 'withdrawal' ? <ArrowUpRight size={16} /> : <ArrowRightLeft size={16} />}
                          </div>
                          <div>
                            <div className="ledger-item-title">
                              {tx.type === 'deposit' ? 'Added Funds' : tx.type === 'withdrawal' ? 'Withdrew Cash' : tx.type === 'buy' ? `Purchased ${getAssetLabel(tx.asset)}` : `Sold ${getAssetLabel(tx.asset)}`}
                            </div>
                            <div className="ledger-item-date">{tx.date} {'\u2022'} ID: {tx.id}</div>
                          </div>
                        </div>
                        <div className="ledger-item-right">
                          <div className={`ledger-item-amount ${tx.type}`}>{tx.type === 'buy' || tx.type === 'withdrawal' ? '-' : '+'}{'\u20b9'}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          {tx.weight > 0 && <div className="ledger-item-weight">{tx.weight.toFixed(4)} g</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {dashTab === 'contest' && (
            <div className="tab-pane-view contest-view animate-fade-in">
              <ContestAwards 
                user={user} 
                rates={rates} 
                onTradeRedirect={() => setDashTab('trade')} 
              />
            </div>
          )}

          {dashTab === 'profile' && (
            <div className="tab-pane-view profile-view animate-fade-in">
              <div className="profile-dashboard-layout">
                <div className="profile-security-badge-card">
                  <div className="security-icon-shield"><Shield size={42} className="shield-glow" /></div>
                  <h3>Verified Vault Account</h3>
                  <p className="profile-desc-p">Your digital assets are 100% physically stored in hyper-secure vaults and backed by a 1-to-1 ratio.</p>
                  <div className="security-credentials-list">
                    <div className="cred-row"><span>Vault Identifier</span><strong>IH-958204-A</strong></div>
                    <div className="cred-row"><span>KYC Verification Status</span><strong className="positive-text"><Check size={12} /> SECURED & VERIFIED</strong></div>
                    <div className="cred-row"><span>Security Standard</span><strong>Mandatory OTP Login Enabled</strong></div>
                    <div className="cred-row"><span>Physical Vault Storage</span><strong>Brink&apos;s & Sequel London</strong></div>
                  </div>
                </div>
                <div className="profile-details-settings-card">
                  <h3>Account Settings</h3>
                  <div className="profile-settings-grid">
                    <div className="p-setting-item">
                      <label>Vault Email Address</label>
                      <input type="text" readOnly value={user?.email || ''} className="profile-readonly-input" />
                    </div>
                    <div className="p-setting-item">
                      <label>Vault Registered Date</label>
                      <input type="text" readOnly value="May 18, 2026" className="profile-readonly-input" />
                    </div>
                    <div className="p-setting-item">
                      <label>Account Class</label>
                      <input type="text" readOnly value="Premium Institutional Bullion Vault" className="profile-readonly-input" />
                    </div>
                    <div className="p-setting-item">
                      <label>Active Client Session ID</label>
                      <input type="text" readOnly value="IH-SESSION-73019A" className="profile-readonly-input" />
                    </div>
                  </div>
                  <div className="profile-quick-actions-row">
                    <button type="button" className="btn-profile-secondary" onClick={() => alert('Downloading Vault Asset Certification PDF...')}><Download size={14} /> Download Vault Certificate</button>
                    <button type="button" className="btn-profile-secondary" onClick={() => alert('Exporting all transaction logs as CSV...')}><Download size={14} /> Export Vault Ledger (CSV)</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {dashTab === 'referral' && (
            <div className="tab-pane-view referral-view animate-fade-in">
              <div className="referral-hero-card">
                <div className="referral-hero-content">
                  <div className="referral-gift-badge">
                    <Gift size={28} />
                  </div>
                  <h2>Invite & Accumulate Gold</h2>
                  <p>
                    Accumulate real wealth together. Get <strong>₹10 worth of Gold</strong> credited instantly to your vault for every friend who registers and verifies their account. 
                    <br />
                    <span className="milestone-highlight">Milestone Reward: Refer 1,500 successful friends to claim <strong>1 Gram of Physical Gold</strong> delivered to your doorstep!</span>
                  </p>
                </div>
              </div>

              <div className="grid-2col referral-details-grid" style={{ gap: '30px', margin: '30px 0' }}>
                <div className="referral-stats-card">
                  <h3>Your Referral Progress</h3>
                  <div className="referral-stats-container">
                    <div className="referral-stat-box">
                      <span className="stat-label">Successful Invites</span>
                      <strong className="stat-val">{successfulReferralsCount} <span className="stat-max">/ 1,500</span></strong>
                    </div>
                    <div className="referral-stat-box">
                      <span className="stat-label">Gold Earned (Est.)</span>
                      <strong className="stat-val gold-text">
                        ₹{(successfulReferralsCount * 10).toLocaleString('en-IN')}
                        <span className="stat-sub">
                          ({((successfulReferralsCount * 10) / rates.gold.price).toFixed(4)} g)
                        </span>
                      </strong>
                    </div>
                  </div>

                  <div className="milestone-progress-container">
                    <div className="progress-labels">
                      <span>Milestone Progress</span>
                      <span>{((successfulReferralsCount / 1500) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${Math.min(100, (successfulReferralsCount / 1500) * 100)}%` }}></div>
                    </div>
                    <p className="progress-tip">
                      {successfulReferralsCount >= 1500 
                        ? "🎉 Congratulations! You have unlocked your 1 Gram Physical Gold coin! Contact support to claim shipping."
                        : `Need ${1500 - successfulReferralsCount} more referrals to unlock your 1 Gram Physical Gold coin!`
                      }
                    </p>
                  </div>
                </div>

                <div className="referral-share-card">
                  <h3>Share Your Invitation Link</h3>
                  <p className="share-desc">Send this unique link to your network. Rewards are processed automatically in real-time.</p>
                  
                  <div className="referral-link-wrapper">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}?ref=IH-${user?.email?.split('@')[0].toUpperCase() || 'USER'}`} 
                      className="referral-link-input"
                    />
                    <button 
                      type="button" 
                      className={`btn-copy-link ${copiedReferralLink ? 'copied' : ''}`}
                      onClick={() => {
                        const link = `${window.location.origin}?ref=IH-${user?.email?.split('@')[0].toUpperCase() || 'USER'}`;
                        navigator.clipboard.writeText(link);
                        setCopiedReferralLink(true);
                        setTimeout(() => setCopiedReferralLink(false), 2000);
                      }}
                    >
                      {copiedReferralLink ? <Check size={18} /> : <Copy size={18} />}
                      <span>{copiedReferralLink ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="referral-steps-mini">
                    <div className="ref-step">
                      <span className="step-num">1</span>
                      <span className="step-txt">Share your link</span>
                    </div>
                    <div className="ref-step">
                      <span className="step-num">2</span>
                      <span className="step-txt">Friend signs up & KYC completes</span>
                    </div>
                    <div className="ref-step">
                      <span className="step-num">3</span>
                      <span className="step-txt">₹10 Gold goes to your vault!</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="referral-ledger-section">
                <div className="ledger-header">
                  <h3>Referral Log Activity</h3>
                  <span className="ref-count-tag">{successfulReferralsCount} Referred Friends</span>
                </div>
                <div className="activity-ledger-table-container">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Referral ID</th>
                        <th>Invited User Email</th>
                        <th>Signup Date</th>
                        <th>Verification Status</th>
                        <th>Vault Credit Reward</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralsList.map((ref) => (
                        <tr key={ref.id}>
                          <td className="tx-id-col">{ref.id}</td>
                          <td><strong>{ref.email}</strong></td>
                          <td>{ref.date}</td>
                          <td>
                            <span className={`status-badge ${ref.status === 'Completed' ? 'success' : (ref.status === 'Pending KYC' ? 'warning' : 'info')}`}>
                              {ref.status}
                            </span>
                          </td>
                          <td className="gold-reward-cell">
                            {ref.status === 'Completed' ? `+₹10 Gold (${(10 / rates.gold.price).toFixed(4)} g)` : 'Pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer style={{ background: '#120524', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#9c93a8', marginTop: 'auto' }}>
          {'\u00a9'} 2026 Investhour Digital Commodities Exchange. Secure Vault Access.
        </footer>

        <button type="button" className="help-fab" onClick={() => setIsChatOpen(true)}><HelpCircle size={18} /><span>Help?</span></button>

        {isChatOpen && (
          <div style={chatOverlayStyle}>
            <div style={chatPanelStyle}>
              <div style={chatHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={chatAvatarStyle}>IH</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Investhour Advisor</div>
                    <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={chatOnlineDotStyle}></span> Online Help Desk</div>
                  </div>
                </div>
                <button type="button" style={chatCloseBtnStyle} onClick={() => setIsChatOpen(false)}><X size={18} /></button>
              </div>
              <div style={chatBodyStyle}>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                    <div style={{ backgroundColor: msg.sender === 'user' ? '#a855f7' : '#270f44', color: '#ffffff', padding: '10px 14px', borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px', maxWidth: '80%', fontSize: '13px', lineHeight: 1.4, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>{msg.text}</div>
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
                    <p style={{ fontSize: '13px', color: '#9c93a8' }}>Your vault transaction has been completed and secured. Your balances and holdings have been updated in real-time.</p>
                  </div>
                ) : (
                  <>
                    <div className="modal-detail-row"><span className="modal-detail-label">Asset type</span><span className="modal-detail-val gold">{getAssetLabel(modalData.asset)}</span></div>
                    <div className="modal-detail-row"><span className="modal-detail-label">Transaction category</span><span className="modal-detail-val" style={{ textTransform: 'uppercase' }}>{modalType === 'sip' ? 'Daily SIP' : modalData.action}</span></div>
                    <div className="modal-detail-row"><span className="modal-detail-label">Weight</span><span className="modal-detail-val">{modalData.weight} Grams</span></div>
                    <div className="modal-detail-row"><span className="modal-detail-label">Live rate per gram</span><span className="modal-detail-val">{'\u20b9'}{modalData.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="modal-detail-row"><span className="modal-detail-label">Subtotal</span><span className="modal-detail-val">{'\u20b9'}{modalData.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    {modalData.action === 'buy' && (
                      <div className="modal-detail-row"><span className="modal-detail-label">GST tax (18.0%)</span><span className="modal-detail-val">{'\u20b9'}{modalData.gst?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    )}
                    <div className="modal-detail-total">
                      <span style={{ color: '#fff' }}>{modalData.action === 'buy' ? 'Total payable amount' : 'You receive'}</span>
                      <span style={{ color: '#d9af56' }}>{'\u20b9'}{modalData.total?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <button type="button" className="btn-modal-confirm" onClick={confirmTransaction}>{modalType === 'sip' ? 'Confirm & Start SIP' : 'Authorize Order'}</button>
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
              <InvesthourLogoText />
            </div>
            <button type="button" className="btn-signin" onClick={() => setView('home')}>Back to Home</button>
          </div>
        </header>
        <div className="auth-container">
          <div className="auth-card animate-fade-in">
            <div className="auth-tabs">
              <button type="button" className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`} onClick={() => setAuthTab('login')}>Sign In</button>
              <button type="button" className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`} onClick={() => setAuthTab('register')}>Sign Up</button>
            </div>
            {authTab === 'login' ? (
              otpStep === 'verify' ? (
                <div className="auth-form otp-verify-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="auth-form-header">
                    <h2>Verify Your Identity</h2>
                    <p style={{ color: '#9c93a8', fontSize: '13px' }}>We sent a secure 6-digit OTP code to <strong style={{ color: '#ffffff' }}>{authForm.email}</strong></p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', margin: '15px 0' }}>
                    {otpInputs.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        pattern="\d*"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="otp-input-box"
                        style={{ width: '45px', height: '52px', background: 'rgba(255, 255, 255, 0.03)', border: '2px solid rgba(217, 175, 86, 0.15)', borderRadius: '10px', textAlign: 'center', fontSize: '22px', fontWeight: 800, color: '#ffffff', outline: 'none' }}
                      />
                    ))}
                  </div>
                  {otpError && <div style={{ color: '#f43f5e', fontSize: '12px', textAlign: 'center', background: 'rgba(244, 63, 94, 0.08)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.15)' }}>{otpError}</div>}
                  <div style={{ textAlign: 'center', fontSize: '13px', color: '#9c93a8' }}>
                    {otpTimer > 0 ? (
                      <div>Code expires in: <span style={{ color: '#ffffff', fontWeight: 700 }}>{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</span></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                        <span>Didn&apos;t receive code?</span>
                        <button type="button" onClick={() => sendSecureOtp(authForm.email)} style={{ background: 'transparent', color: '#d9af56', border: 'none', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}>Resend Secure OTP</button>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={handleVerifyOtp} className="btn-auth-submit" style={{ marginTop: '10px' }}>Verify & Log In</button>
                  <button type="button" onClick={() => setOtpStep('login')} style={{ background: 'transparent', color: '#9c93a8', border: 'none', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>Back to password login</button>
                </div>
              ) : (
                <form className="auth-form" onSubmit={handleSignInStart}>
                  <div className="auth-form-header"><h2>Welcome Back</h2><p>Access your precious metal vault securely</p></div>
                  <div className="auth-input-group">
                    <label>Email or Mobile Number</label>
                    <input type="text" required placeholder="Enter email or mobile" value={authForm.email || ''} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
                  </div>
                  <div className="auth-input-group">
                    <label>Password</label>
                    <input type="password" required placeholder="••••••••" value={authForm.password || ''} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
                  </div>
                  <div className="auth-actions-row">
                    <label className="auth-checkbox"><input type="checkbox" /> Keep me signed in</label>
                    <a href="#forgot" className="forgot-password">Forgot Password?</a>
                  </div>
                  <button type="submit" className="btn-auth-submit" disabled={otpSending}>{otpSending ? 'Sending OTP...' : 'Sign In Securely'}</button>
                </form>
              )
            ) : (
              otpStep === 'register-verify' ? (
                <div className="auth-form otp-verify-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="auth-form-header">
                    <h2>Verify Your Email</h2>
                    <p style={{ color: '#9c93a8', fontSize: '13px' }}>We sent a secure 6-digit OTP code to <strong style={{ color: '#ffffff' }}>{authForm.email}</strong></p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', margin: '15px 0' }}>
                    {otpInputs.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        pattern="\d*"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="otp-input-box"
                        style={{ width: '45px', height: '52px', background: 'rgba(255, 255, 255, 0.03)', border: '2px solid rgba(217, 175, 86, 0.15)', borderRadius: '10px', textAlign: 'center', fontSize: '22px', fontWeight: 800, color: '#ffffff', outline: 'none' }}
                      />
                    ))}
                  </div>
                  {otpError && <div style={{ color: '#f43f5e', fontSize: '12px', textAlign: 'center', background: 'rgba(244, 63, 94, 0.08)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.15)' }}>{otpError}</div>}
                  <div style={{ textAlign: 'center', fontSize: '13px', color: '#9c93a8' }}>
                    {otpTimer > 0 ? (
                      <div>Code expires in: <span style={{ color: '#ffffff', fontWeight: 700 }}>{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</span></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                        <span>Didn&apos;t receive code?</span>
                        <button type="button" onClick={() => sendSecureOtp(authForm.email, 'register')} style={{ background: 'transparent', color: '#d9af56', border: 'none', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}>Resend Secure OTP</button>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={handleVerifyRegistrationOtp} className="btn-auth-submit" style={{ marginTop: '10px' }}>Verify & Create Account</button>
                  <button type="button" onClick={() => { setOtpStep('login'); setAuthTab('register'); }} style={{ background: 'transparent', color: '#9c93a8', border: 'none', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>Back to registration form</button>
                </div>
              ) : (
                <form className="auth-form" onSubmit={handleSignUp}>
                  <div className="auth-form-header"><h2>Create Vault</h2><p>Begin accumulating premium physical metals today</p></div>
                  <div className="auth-input-group">
                    <label>Full Name</label>
                    <input type="text" required placeholder="John Doe" value={authForm.name || ''} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />
                  </div>
                  <div className="auth-input-group">
                    <label>Email Address</label>
                    <input type="email" required placeholder="john@example.com" value={authForm.email || ''} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
                  </div>
                <div className="auth-input-group">
                  <label>Mobile Number</label>
                  <input type="tel" required placeholder="+91 XXXXX XXXXX" value={authForm.phone || ''} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} />
                </div>
                <div className="auth-input-group">
                  <label>Vault Password</label>
                  <input type="password" required placeholder="Create secure password" value={authForm.password || ''} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
                </div>
                <label className="auth-checkbox agreement"><input type="checkbox" required /> I agree to the physical metal vaulting terms and conditions</label>
                <button type="submit" className="btn-auth-submit" disabled={otpSending}>{otpSending ? 'Sending OTP...' : 'Send Verification Code'}</button>
              </form>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'contest-awards') {
    return (
      <div id="root">
        <header className="header">
          <div className="container nav-container">
            <div className="logo-section" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
              <InvesthourLogoText />
            </div>
            
            {user && (
              <nav className="nav-menu dashboard-nav">
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('portfolio'); }}
                >
                  <Briefcase size={16} /> Portfolio
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('trade'); }}
                >
                  <ArrowRightLeft size={16} /> Trade
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('wallet'); }}
                >
                  <Wallet size={16} /> Wallet
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('contest'); }}
                >
                  <Star size={16} /> Contest Awards
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => setView('about')}
                >
                  <Gem size={16} /> Explore Elements
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('referral'); }}
                >
                  <Gift size={16} /> Referral Program
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('profile'); }}
                >
                  <User size={16} /> Vault Profile
                </button>
              </nav>
            )}
            
            {user ? (
              <div className="dash-user-badge">
                <div className="user-info-text">
                  <span className="user-email-text">{user?.email || 'vault.holder@example.com'}</span>
                  <span className="kyc-badge">KYC SECURED</span>
                </div>
                <button className="btn-sec-signout" onClick={handleSignOut} title="Secure Sign Out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button type="button" className="btn-signin" onClick={() => setView('auth')}>Sign In / Sign Up</button>
            )}
          </div>
        </header>
        
        <main className="container" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <ContestAwards 
            user={user} 
            rates={rates} 
            onTradeRedirect={() => {
              if (user) {
                setDashTab('trade');
                setView('dashboard');
              } else {
                setView('auth');
              }
            }} 
          />
        </main>
      </div>
    );
  }

  if (view === 'about') {
    return (
      <div id="root">
        <header className="header">
          <div className="container nav-container">
            <div className="logo-section" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
              <InvesthourLogoText />
            </div>
            
            {user && (
              <nav className="nav-menu dashboard-nav">
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('portfolio'); }}
                >
                  <Briefcase size={16} /> Portfolio
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('trade'); }}
                >
                  <ArrowRightLeft size={16} /> Trade
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('wallet'); }}
                >
                  <Wallet size={16} /> Wallet
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('contest'); }}
                >
                  <Star size={16} /> Contest Awards
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => setView('about')}
                >
                  <Gem size={16} /> Explore Elements
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('referral'); }}
                >
                  <Gift size={16} /> Referral Program
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('profile'); }}
                >
                  <User size={16} /> Vault Profile
                </button>
              </nav>
            )}
            
            {user ? (
              <div className="dash-user-badge">
                <div className="user-info-text">
                  <span className="user-email-text">{user?.email || 'vault.holder@example.com'}</span>
                  <span className="kyc-badge">KYC SECURED</span>
                </div>
                <button className="btn-sec-signout" onClick={handleSignOut} title="Secure Sign Out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button type="button" className="btn-signin" onClick={() => setView('home')}>Back to Home</button>
            )}
          </div>
        </header>
        <AboutUs rates={rates} holdings={holdings} walletBalance={walletBalance} isLoggedIn={!!user} onRequireAuth={() => setView('auth')} onTradeRequest={handleAboutTradeRequest} onExplore={() => { setDashTab('trade'); setView('dashboard'); }} />
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <span className="modal-title">Secure Order Checkout</span>
                <button type="button" className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                {showSuccess ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#fff' }}>Order Placed Successfully!</h3>
                  </div>
                ) : (
                  <>
                    <div className="modal-detail-row"><span className="modal-detail-label">Asset</span><span className="modal-detail-val gold">{getAssetLabel(modalData.asset)}</span></div>
                    <div className="modal-detail-row"><span className="modal-detail-label">Action</span><span className="modal-detail-val">{modalData.action}</span></div>
                    <div className="modal-detail-row"><span className="modal-detail-label">Weight</span><span className="modal-detail-val">{modalData.weight} g</span></div>
                    <div className="modal-detail-total">
                      <span style={{ color: '#fff' }}>Total</span>
                      <span style={{ color: '#d9af56' }}>{'\u20b9'}{modalData.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button type="button" className="btn-modal-confirm" onClick={confirmTransaction}>Authorize {modalData.action === 'buy' ? 'Buy' : 'Sell'}</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'referral-program') {
    return (
      <div id="root">
        <header className="header">
          <div className="container nav-container">
            <div className="logo-section" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
              <InvesthourLogoText />
            </div>
            
            {user && (
              <nav className="nav-menu dashboard-nav">
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('portfolio'); }}
                >
                  <Briefcase size={16} /> Portfolio
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('trade'); }}
                >
                  <ArrowRightLeft size={16} /> Trade
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('wallet'); }}
                >
                  <Wallet size={16} /> Wallet
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('contest'); }}
                >
                  <Star size={16} /> Contest Awards
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => setView('about')}
                >
                  <Gem size={16} /> Explore Elements
                </button>
                <button 
                  className="dash-nav-item active"
                  onClick={() => setView('referral-program')}
                >
                  <Gift size={16} /> Referral Program
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('profile'); }}
                >
                  <User size={16} /> Vault Profile
                </button>
              </nav>
            )}

            {!user && (
              <nav className="nav-menu">
                <a href="#home" className="nav-item" onClick={(e) => { e.preventDefault(); setView('home'); }}>Home</a>
                <a href="#contest" className="nav-item" onClick={(e) => { e.preventDefault(); setView('contest-awards'); }}>Contest Awards</a>
                <a href="#about" className="nav-item" onClick={(e) => { e.preventDefault(); setView('about'); }}>Explore Elements</a>
                <a href="#referral" className="nav-item active" onClick={(e) => { e.preventDefault(); setView('referral-program'); }}>Referral Program</a>
              </nav>
            )}
            
            {user ? (
              <div className="dash-user-badge">
                <div className="user-info-text">
                  <span className="user-email-text">{user?.email || 'vault.holder@example.com'}</span>
                  <span className="kyc-badge">KYC SECURED</span>
                </div>
                <button className="btn-sec-signout" onClick={handleSignOut} title="Secure Sign Out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button type="button" className="btn-signin" onClick={() => setView('auth')}>Sign In / Sign Up</button>
            )}
          </div>
        </header>
        <ReferralProgramPage 
          rates={rates} 
          isLoggedIn={!!user} 
          onRequireAuth={() => setView('auth')} 
          onGoToDashboard={() => {
            setDashTab('referral');
            setView('dashboard');
          }}
        />
      </div>
    );
  }

  return (
    <div id="root">
      <header className="header">
        <div className="container nav-container">
          <div className="logo-section">
            <InvesthourLogoText />
          </div>
          <nav className="nav-menu">
            <a href="#home" className="nav-item active">Home</a>
            <a href="#contest" className="nav-item" onClick={(e) => { e.preventDefault(); setView('contest-awards'); }}>Contest Awards</a>
            <a href="#about" className="nav-item" onClick={(e) => { e.preventDefault(); setView('about'); }}>Explore Elements</a>
            <a href="#referral" className="nav-item" onClick={(e) => { e.preventDefault(); setView('referral-program'); }}>Referral Program</a>
          </nav>
          {user ? (
            <div className="dash-user-badge" style={{ cursor: 'pointer' }} onClick={() => setView('dashboard')}>
              <div className="user-info-text">
                <span className="user-email-text">{user.email}</span>
                <span className="kyc-badge">{user.email === 'shivaram33987@gmail.com' ? 'ADMIN' : 'KYC SECURED'}</span>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-signin" onClick={() => setView('auth')}>Sign In / Sign Up</button>
          )}
        </div>
      </header>

      <div className="ticker-bar">
        <div className="ticker-track">{renderTickerItems('home')}</div>
      </div>

      <main className="hero-layout" style={{ backgroundImage: `url(${heroGoldOre})` }}>
        <div className="container">
          <div className="grid-2col">
            <div className="hero-text-box">
              <div className="tagline">PREMIUM METAL INVESTMENTS</div>
              <h1 className="hero-title">Burning a cigarette gives you ash, but investing the cigarette cost will give you the future</h1>
              <p className="hero-desc">Begin your wealth accumulation journey with 100% physically backed institutional-grade metals.</p>
              <div className="hero-actions">
                <button type="button" className="btn-hero-primary" onClick={() => setView('auth')}>Proceed to Sign Up</button>
              </div>
            </div>
            <div className="widget-column">
              <div className="trade-card">
                <div className="asset-tabs portal-asset-tabs">
                  {PORTAL_TRADE_ASSETS.map((asset) => (
                    <button key={asset} type="button" className={`tab-btn ${activeAsset === asset ? 'active' : ''}`} onClick={() => setActiveAsset(asset)}>{getAssetLabel(asset)}</button>
                  ))}
                </div>
                <div className="price-display-box">
                  <div className={`current-price ${priceFlash ? 'glowing' : ''}`} style={priceFlash ? { color: '#e7c376' } : {}}>
                    {'\u20b9'}{rates[activeAsset].price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g
                  </div>
                  <div className="live-rates-indicator"><span className="live-dot"></span><span>Live Rates</span></div>
                  <div className="price-subtext">Additional 18% GST applicable</div>
                </div>
                <div className="action-tabs">
                  <button type="button" className={`action-tab-btn buy ${activeAction === 'buy' ? 'active' : ''}`} onClick={() => setActiveAction('buy')}>Buy</button>
                  <button type="button" className={`action-tab-btn sell ${activeAction === 'sell' ? 'active' : ''}`} onClick={() => setActiveAction('sell')}>Sell</button>
                </div>
                <div className="form-section">
                  <div className="form-label">Please enter the amount</div>
                  <div className="input-row">
                    <div className="input-group">
                      <label htmlFor="rupees-input">Rupees</label>
                      <input id="rupees-input" className="input-field" type="number" placeholder="Rupees" value={rupees} onChange={(e) => handleRupeesChange(e.target.value)} />
                    </div>
                    <button type="button" className="btn-swap" onClick={handleSwapFields} title="Swap inputs"><ArrowRightLeft size={16} /></button>
                    <div className="input-group">
                      <label htmlFor="grams-input">Grams</label>
                      <input id="grams-input" className="input-field" type="number" placeholder="Grams" value={grams} onChange={(e) => handleGramsChange(e.target.value)} />
                    </div>
                  </div>
                  <div className="quick-pills">
                    {[100, 500, 1000, 5000].map((amount) => (
                      <button key={amount} type="button" className="pill-btn" onClick={() => handleQuickPill(amount)}>{'\u20b9'}{amount}</button>
                    ))}
                  </div>
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

      <button type="button" className="help-fab" onClick={() => setIsChatOpen(true)}><HelpCircle size={18} /><span>Help?</span></button>

      {isChatOpen && (
        <div style={chatOverlayStyle}>
          <div style={chatPanelStyle}>
            <div style={chatHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={chatAvatarStyle}>IH</div>
                <div><div style={{ fontWeight: 700, fontSize: '14px' }}>Investhour Advisor</div></div>
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
    </div>
  );
}

const chatOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '24px' };
const chatPanelStyle = { width: '380px', height: '500px', backgroundColor: '#150a21', border: '1px solid rgba(217, 175, 86, 0.3)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const chatHeaderStyle = { padding: '16px 20px', backgroundColor: '#200f33', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const chatAvatarStyle = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#d9af56', color: '#060309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' };
const chatOnlineDotStyle = { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' };
const chatCloseBtnStyle = { color: '#9c93a8', background: 'none', border: 'none', cursor: 'pointer' };
const chatBodyStyle = { flexGrow: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#0c0615', display: 'flex', flexDirection: 'column' };
const chatFormStyle = { padding: '12px 16px', borderTop: '1px solid rgba(168, 85, 247, 0.2)', backgroundColor: '#150a21', display: 'flex', gap: '8px' };
const chatInputStyle = { flexGrow: 1, backgroundColor: '#200f33', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' };
const chatSendBtnStyle = { backgroundColor: '#d9af56', color: '#060309', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, border: 'none', cursor: 'pointer' };

export default App;
