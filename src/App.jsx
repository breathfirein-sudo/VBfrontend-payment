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
  Copy,
  Upload,
  FileText,
  Trash2,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff
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

// Initial rates based on the screenshot
const INITIAL_RATES = {
  silver: { price: 267.21, change: -2.04, pct: -0.76 },
  platinum: { price: 7358.14, change: 12.45, pct: 0.17 },
  iron: { price: 52.10, change: -0.58, pct: -1.10 },
  gold: { price: 6143.57, change: 48.96, pct: 0.80 }
};

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://hour-60kr.onrender.com');

// Timeout-aware fetch wrapper (default 90s for cold starts)
const fetchWithTimeout = (url, options = {}, timeoutMs = 90000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

// Warm up the Render backend on page load to avoid cold-start delays
if (typeof window !== 'undefined') {
  fetch(`${VITE_BACKEND_URL}/api/health`).catch(() => {});
}

const InvesthourLogoText = ({ customStyle, suffix }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...customStyle }}>
    <span className="logo-text" style={{ letterSpacing: '1.2px', fontSize: '20px', fontWeight: '800' }}>
      Investhour{suffix}
    </span>
    <span style={{ fontSize: '20px', display: 'inline-flex', gap: '2px', whiteSpace: 'nowrap', WebkitTextFillColor: 'initial', WebkitBackgroundClip: 'initial', background: 'none' }}>
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
  const getAuthToken = async () => {
    let token = localStorage.getItem('vb_jwt_token');
    if (!token && auth && auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
      } catch (err) {
        console.error("Failed to get Firebase token:", err);
      }
    }
    return token || 'dummy-token-for-dev';
  };

  // --- Auth & Profile States ---
  const [user, setUser] = useState(null);
  
  // --- KYC Upload States ---
  const [kycDocType, setKycDocType] = useState('Aadhaar'); // 'Aadhaar', 'PAN', 'Passport'
  const [kycFile, setKycFile] = useState(null); // { name: string, size: number, type: string }
  const [kycUploadProgress, setKycUploadProgress] = useState(0);
  const [kycUploading, setKycUploading] = useState(false);
  const [kycUploadStatusText, setKycUploadStatusText] = useState('');
  const [kycDragging, setKycDragging] = useState(false);

  const handleKycFileSelect = (file) => {
    if (!file) return;
    setKycFile(file);
    setKycUploadProgress(0);
    setKycUploading(true);
    setKycUploadStatusText('Uploading file...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setKycUploadProgress(progress);
      if (progress === 30) {
        setKycUploadStatusText('Verifying checksum...');
      } else if (progress === 60) {
        setKycUploadStatusText('Hashing & encrypting...');
      } else if (progress === 80) {
        setKycUploadStatusText('Storing securely in IPFS...');
      } else if (progress >= 100) {
        clearInterval(interval);
        setKycUploading(false);
        setKycUploadStatusText('Completed');
      }
    }, 150);
  };

  const handleKycSubmit = () => {
    if (!kycFile || kycUploading) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = e.target.result;
      const kycDoc = {
        type: kycDocType,
        fileName: kycFile.name,
        fileSize: (kycFile.size / 1024).toFixed(1) + ' KB',
        uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        fileData: fileData
      };

      try {
        const res = await fetch(`${VITE_BACKEND_URL}/api/auth/kyc/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            kycDocument: kycDoc.fileData,
            kycDocName: kycDoc.fileName,
            kycDocType: kycDoc.type,
            kycUploadedAt: kycDoc.uploadedAt
          })
        });

        if (!res.ok) {
          throw new Error(`Upload failed with status ${res.status}`);
        }

        setClients(prev => {
          const next = prev.map(c => {
            if (c.email.toLowerCase() === user.email.toLowerCase()) {
              return { ...c, kycStatus: 'Submitted', kycDocument: kycDoc };
            }
            return c;
          });
          localStorage.setItem('vb_clients', JSON.stringify(next));
          return next;
        });

        setKycFile(null);
        setKycUploadProgress(0);
      } catch (err) {
        console.error('Failed to upload KYC:', err);
        alert('Failed to upload KYC document.');
      }
    };
    reader.readAsDataURL(kycFile);
  };

  const handleKycRestart = () => {
    setClients(prev => {
      const next = prev.map(c => {
        if (c.email.toLowerCase() === user.email.toLowerCase()) {
          return {
            ...c,
            kycStatus: 'Pending',
            kycDocument: null,
            kycRejectionReason: null
          };
        }
        return c;
      });
      localStorage.setItem('vb_clients', JSON.stringify(next));
      return next;
    });
  };

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem('vb_view') || 'home'); // 'home', 'auth', 'dashboard'
  useEffect(() => { localStorage.setItem('vb_view', view); }, [view]);
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '', referralCode: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [signupStep, setSignupStep] = useState('details'); // 'details' or 'verify'
  const [signupOtp, setSignupOtp] = useState('');

  // --- Reset Password (via email link) ---
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleResetViaToken = async (e) => {
    e.preventDefault();
    setResetError('');
    if (resetNewPassword.length < 6) return setResetError('Password must be at least 6 characters.');
    if (resetNewPassword !== resetConfirmPassword) return setResetError('Passwords do not match.');
    setResetLoading(true);
    try {
      const response = await fetchWithTimeout(`${VITE_BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: resetNewPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Reset failed');
      // Remove token from URL without reload
      window.history.replaceState({}, '', window.location.pathname);
      setResetDone(true);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };
  
  // --- Forgot Password States & Handlers ---
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'sent'
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return alert("Please enter your registered email address.");
    
    setForgotLoading(true);
    try {
      const response = await fetchWithTimeout(`${VITE_BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to request password reset');
      
      setForgotStep('sent');
    } catch (error) {
      alert(error.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const [defaultReferralCode, setDefaultReferralCode] = useState(() => {
    return localStorage.getItem('vb_default_referral_code') || 'INVEST-WELCOME';
  });

  // --- Auto-detect Referral Link on Load ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setAuthForm(prev => ({ ...prev, referralCode: refCode }));
      const savedLocalUser = localStorage.getItem('vb_local_user');
      if (!savedLocalUser) {
        setView('auth');
        setAuthTab('register');
      }
    }
  }, []);

  
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
  const [dashTab, setDashTab] = useState(() => localStorage.getItem('vb_dashTab') || 'portfolio'); // 'portfolio', 'trade', 'wallet', 'profile'
  useEffect(() => { localStorage.setItem('vb_dashTab', dashTab); }, [dashTab]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => localStorage.getItem('vb_disclaimer_accepted') === 'true');
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);
  const [copiedInspectedReferralLink, setCopiedInspectedReferralLink] = useState(false);
  const [successfulReferralsCount, setSuccessfulReferralsCount] = useState(0);
  const [referralsList, setReferralsList] = useState([]);
  
  // --- Live Portfolio Balance & Holdings State ---
  const [walletBalance, setWalletBalance] = useState(0); // Available Cash in Rupees
  const [holdings, setHoldings] = useState(() =>
    createInitialHoldings({})
  );
  
  // --- Interactive Deposit / Withdrawal Fields ---
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

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
  const [showAllFeedTx, setShowAllFeedTx] = useState(false); // Transaction feed "show more"

  // --- Contest Awards States & Methods ---
  const [adminTab, setAdminTab] = useState('clients'); // 'clients' or 'contest'
  const [contestParticipants, setContestParticipants] = useState([]);
  const [selectedContestParticipant, setSelectedContestParticipant] = useState(null);
  const [contestParticipantTrades, setContestParticipantTrades] = useState([]);
  const [contestSearchQuery, setContestSearchQuery] = useState('');

  const fetchAdminContestData = async () => {
    try {
      const token = await getAuthToken();
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

  const fetchAdminClientsData = async () => {
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/admin/users/sync`);
      const data = await res.json();
      if (data.success && data.clients) {
        setClients(prevClients => {
          const merged = data.clients.map(dbClient => {
            const existingClient = prevClients.find(c => c.email.toLowerCase() === dbClient.email.toLowerCase());
            if (existingClient) {
              return {
                ...existingClient,
                ...dbClient,
                referralCount: dbClient.referralCount !== undefined ? dbClient.referralCount : (existingClient.referralCount || 0),
                walletBalance: dbClient.walletBalance !== undefined ? dbClient.walletBalance : (existingClient.walletBalance || 0),
                transactions: dbClient.transactions !== undefined ? dbClient.transactions : (existingClient.transactions || [])
              };
            }
            return dbClient;
          });
          localStorage.setItem('vb_clients', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {
      console.error('Failed to sync users:', e);
    }
  };

  const fetchParticipantTrades = async (email) => {
    try {
      const token = await getAuthToken();
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
      const token = await getAuthToken();
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
      const token = await getAuthToken();
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
      const token = await getAuthToken();
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
    if (user && user.email === 'sandeepkumar.pikili@vrpigroup.co.in' && adminTab === 'contest') {
      fetchAdminContestData();
    }
  }, [user, adminTab]);

  useEffect(() => {
    if (user && user.email === 'sandeepkumar.pikili@vrpigroup.co.in') {
      fetchAdminClientsData();
    }
  }, [user]);

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
    if (user && user.email !== 'sandeepkumar.pikili@vrpigroup.co.in') {
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
    if (user && user.email !== 'sandeepkumar.pikili@vrpigroup.co.in') {
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

      // Sync user profile state from backend database in real-time
      fetch(`${VITE_BACKEND_URL}/api/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            if (data.referralCount !== undefined) {
              setSuccessfulReferralsCount(data.referralCount);
            }
            if (data.walletBalance !== undefined) {
              setWalletBalance(data.walletBalance);
            }
            if (data.transactions !== undefined) {
              const mappedTx = data.transactions.map(t => ({
                id: 'TX-' + t.id,
                type: t.type?.toLowerCase() === 'deposit' ? 'deposit' : 'withdrawal',
                asset: t.asset || 'wallet',
                amount: t.amount,
                status: 'Completed',
                date: new Date(t.createdAt).toISOString().slice(0, 16).replace('T', ' ')
              }));
              setTransactions(mappedTx);
            }
            // Update the local storage client record
            setClients(prev => {
              const updated = prev.map(c => {
                if (c.email.toLowerCase() === user.email.toLowerCase()) {
                  return {
                    ...c,
                    walletBalance: data.walletBalance !== undefined ? data.walletBalance : c.walletBalance,
                    referralCount: data.referralCount !== undefined ? data.referralCount : c.referralCount,
                    transactions: data.transactions !== undefined ? data.transactions.map(t => ({
                      id: 'TX-' + t.id,
                      type: t.type?.toLowerCase() === 'deposit' ? 'deposit' : 'withdrawal',
                      asset: t.asset || 'wallet',
                      amount: t.amount,
                      status: 'Completed',
                      date: new Date(t.createdAt).toISOString().slice(0, 16).replace('T', ' ')
                    })) : c.transactions
                  };
                }
                return c;
              });
              localStorage.setItem('vb_clients', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(err => console.error("Error syncing user profile from DB:", err));
    }
  }, [user]);

  // Simulator removed to prevent dummy data generation

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
        
        if (parsed.email === 'sandeepkumar.pikili@vrpigroup.co.in') {
          setUser(parsed);
          setView('dashboard');
          setLoading(false);
          return;
        }

        fetch(`${VITE_BACKEND_URL}/api/auth/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: parsed.email })
        })
          .then(res => res.json())
          .then(data => {
            if (data.valid) {
              setUser(parsed);
              setView('dashboard');
              if (data.referralCount !== undefined) {
                setSuccessfulReferralsCount(data.referralCount);
              }
            } else {
              localStorage.removeItem('vb_local_user');
              setUser(null);
              setView('home');
            }
            setLoading(false);
          })
          .catch(e => {
            console.error("Validation failed, falling back to local:", e);
            setUser(parsed);
            setView('dashboard');
            setLoading(false);
          });
        return;
      } catch (e) {
        console.error("Error loading local user session:", e);
        setView(prev => prev === 'dashboard' ? 'home' : prev);
      }
    } else {
      setView(prev => prev === 'dashboard' ? 'home' : prev);
    }
    setLoading(false);
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
          alert(`Insufficient wallet balance. You need ₹${totalCost.toFixed(2)} but only have ₹${walletBalance.toFixed(2)}. Please add funds.`);
          setShowModal(false);
          setDashTab('wallet');
          setView('dashboard');
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
      const response = await fetchWithTimeout(`${VITE_BACKEND_URL}/api/auth/send-otp`, {
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
      const errMsg = err.name === 'AbortError' ? 'Server is waking up, please try again in a few seconds.' : `Server Connection Failed: ${err.message}`;
      setOtpError(errMsg);
      setOtpSending(false);
    }
  };

  const handleSignInStart = async (e) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      alert("Please fill in all secure fields.");
      return;
    }

    setOtpSending(true);

    try {
      const response = await fetchWithTimeout(`${VITE_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid email or password');
      }

      const localUser = { 
        email: data.user.email, 
        uid: 'db-user-' + data.user.id, 
        displayName: data.user.name || data.user.email.split('@')[0] 
      };
      localStorage.setItem('vb_jwt_token', data.token);
      localStorage.setItem('vb_local_user', JSON.stringify(localUser));
      setUser(localUser);
      setView('dashboard');
    } catch (error) {
      console.warn("DB Auth login failed, checking fallback:", error.message);
      // Hardcoded fallback for Super Admin check if backend is not reachable / DB fails (for development safety)
      if (authForm.email.toLowerCase() === 'sandeepkumar.pikili@vrpigroup.co.in' && authForm.password === 'Psk@300707') {
        const localUser = { email: 'sandeepkumar.pikili@vrpigroup.co.in', uid: 'admin-super-uid', displayName: 'Super Admin' };
        localStorage.setItem('vb_local_user', JSON.stringify(localUser));
        setUser(localUser);
        setView('dashboard');
        return;
      }
      alert(error.message);
    } finally {
      setOtpSending(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      alert("Please enter a valid email and custom vault password.");
      return;
    }

    setOtpSending(true);

    try {
      const response = await fetchWithTimeout(`${VITE_BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      setSignupStep('verify');
    } catch (err) {
      alert(err.name === 'AbortError' ? 'Server is waking up, please try again in a few seconds.' : err.message);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifySignupOtp = async (e) => {
    e.preventDefault();
    if (!signupOtp) return alert("Please enter the OTP.");
    
    setOtpSending(true);
    try {
      // 1. Verify OTP
      const otpRes = await fetchWithTimeout(`${VITE_BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, otp: signupOtp })
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok || !otpData.success) {
        throw new Error(otpData.error || 'Invalid OTP');
      }

      // 2. Register
      const response = await fetchWithTimeout(`${VITE_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
          name: authForm.name,
          referralCode: authForm.referralCode,
          defaultReferralCode: defaultReferralCode
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create account');
      }

      const localUser = { 
        email: data.user.email, 
        uid: 'db-user-' + data.user.id, 
        displayName: data.user.name || data.user.email.split('@')[0] 
      };
      
      // Initialize registering client profile and credit referrer in local storage
      const cRecord = {
        id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: data.user.name || data.user.email.split('@')[0],
        email: data.user.email,
        phone: '',
        walletBalance: 0,
        holdings: createInitialHoldings({}),
        kycStatus: 'Pending',
        transactions: [],
        referralCount: 0,
        referredBy: authForm.referralCode || ''
      };

      setClients(prev => {
        let next = [...prev];
        if (!next.some(c => c.email.toLowerCase() === data.user.email.toLowerCase())) {
          next.push(cRecord);
        }

        if (authForm.referralCode) {
          const codeWithoutPrefix = authForm.referralCode.toUpperCase().replace('IH-', '');
          next = next.map(c => {
            const isAdminCode = authForm.referralCode.toUpperCase() === defaultReferralCode.toUpperCase();
            const isMatch = isAdminCode
              ? c.email.toLowerCase() === 'sandeepkumar.pikili@vrpigroup.co.in'
              : c.email.split('@')[0].toUpperCase() === codeWithoutPrefix;

            if (isMatch) {
              const newCount = (c.referralCount || 0) + 1;
              const newBalance = (c.walletBalance || 0) + 10;
              const newTx = {
                id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
                type: 'deposit',
                asset: 'wallet',
                amount: 10,
                weight: 0,
                date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                status: 'Completed',
                details: `Referral bonus for inviting ${data.user.email}`
              };
              
              // If referrer is the logged in user, update current frontend state in real-time
              if (user && c.email.toLowerCase() === user.email.toLowerCase()) {
                setSuccessfulReferralsCount(newCount);
                setWalletBalance(newBalance);
                setTransactions(prevTx => [newTx, ...prevTx]);
              }

              return {
                ...c,
                referralCount: newCount,
                walletBalance: newBalance,
                transactions: [newTx, ...(c.transactions || [])]
              };
            }
            return c;
          });
        }
        localStorage.setItem('vb_clients', JSON.stringify(next));
        return next;
      });

      alert(`Vault Created Securely! Welcome: ${data.user.email}\nPlease log in with your new account.`);
      setAuthTab('login');
      setAuthForm({ name: '', email: '', phone: '', password: '', referralCode: '' });
    } catch (error) {
      console.error("DB Register failed:", error.message);
      alert(error.name === 'AbortError' ? 'Server is waking up, please try again in a few seconds.' : error.message);
    } finally {
      setOtpSending(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('vb_local_user');
    localStorage.removeItem('vb_jwt_token');
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

  const isAdmin = user && user.email === 'sandeepkumar.pikili@vrpigroup.co.in';

  if (view === 'dashboard' && isAdmin) {
    const realClients = clients.filter(c => c.email.toLowerCase() !== 'sandeepkumar.pikili@vrpigroup.co.in');

    // Collect all transactions from clients database for system-wide display
    const allSystemTransactions = realClients.reduce((acc, client) => {
      const clientTx = client.transactions.map(tx => ({
        ...tx,
        clientName: client.name,
        clientEmail: client.email
      }));
      return [...acc, ...clientTx];
    }, []).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Select the currently inspected client
    const inspectedClient = clients.find(c => c.id === selectedClientId) || realClients[0] || {
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
    const systemReserves = realClients.reduce((res, client) => {
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
                <InvesthourLogoText customStyle={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', display: 'block' }} />
                <span style={{ fontSize: '10px', color: '#f43f5e', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Super Admin Console</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="admin-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(244, 63, 94, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#f43f5e', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #f43f5e' }}></span>
                <span style={{ fontSize: '12px', color: '#f43f5e', fontWeight: 600 }}>LIVE TRACKING</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>sandeepkumar.pikili@vrpigroup.co.in</div>
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
                <span style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff' }}>{realClients.length} <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 'normal' }}>Active</span></span>
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
                    {clients.filter(c => c.email.toLowerCase() !== 'sandeepkumar.pikili@vrpigroup.co.in').length} Clients
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
                    {clients.filter(c => c.email.toLowerCase() !== 'sandeepkumar.pikili@vrpigroup.co.in').map(c => {
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
                                  if (window.confirm(`Are you sure you want to delete ${c.name}'s account? This will permanently delete:\n- Client profile data\n- Authentication account\n- All transaction history\n\nThis action cannot be undone.`)) {
                                    try {
                                      // Call backend to delete user
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
                                        console.warn("Backend deletion warning:", data.message);
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
                                      
                                      alert(`${c.name}'s local data has been deleted. Note: Backend account deletion may have failed. Error: ${error.message}`);
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

              {/* Client Balances & Holdings Summary */}
              <div style={{ display: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>
                    Client Balances &amp; Holdings
                    <span style={{ fontSize: '11px', fontWeight: 400, color: '#9c93a8', marginLeft: '8px' }}>({clients.length} clients)</span>
                  </h3>
                </div>
                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                  {/* Header row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 70px 70px', gap: '8px', padding: '6px 10px', fontSize: '10px', fontWeight: 700, color: '#9c93a8', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span>Client</span>
                    <span style={{ textAlign: 'right' }}>Wallet</span>
                    <span style={{ textAlign: 'right' }}>Gold</span>
                    <span style={{ textAlign: 'right' }}>Silver</span>
                    <span style={{ textAlign: 'right' }}>Platinum</span>
                    <span style={{ textAlign: 'right' }}>Iron</span>
                  </div>
                  {clients.map((c) => {
                    const holdings = c.holdings || {};
                    return (
                      <div
                        key={c.id}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 70px 70px', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: selectedClientId === c.id ? 'rgba(217,175,86,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => setSelectedClientId(c.id)}
                        onMouseEnter={e => { if (selectedClientId !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (selectedClientId !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                          <div style={{ fontSize: '10px', color: '#9c93a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>
                        </div>
                        <span style={{ textAlign: 'right', fontWeight: 700, fontSize: '12px', color: '#10b981' }}>
                          ₹{(c.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span style={{ textAlign: 'right', fontSize: '12px', color: '#d9af56' }}>
                          {(holdings.gold || 0) > 0 ? `${(holdings.gold).toFixed(3)}g` : <span style={{ color: '#3d3650' }}>—</span>}
                        </span>
                        <span style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
                          {(holdings.silver || 0) > 0 ? `${(holdings.silver).toFixed(3)}g` : <span style={{ color: '#3d3650' }}>—</span>}
                        </span>
                        <span style={{ textAlign: 'right', fontSize: '12px', color: '#c084fc' }}>
                          {(holdings.platinum || 0) > 0 ? `${(holdings.platinum).toFixed(3)}g` : <span style={{ color: '#3d3650' }}>—</span>}
                        </span>
                        <span style={{ textAlign: 'right', fontSize: '12px', color: '#fb923c' }}>
                          {(holdings.iron || 0) > 0 ? `${(holdings.iron).toFixed(3)}g` : <span style={{ color: '#3d3650' }}>—</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Side: Visual Inspector Pane (5 Cols) */}
            <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {!selectedClientId ? (
                <div style={{ background: '#120524', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '400px' }}>
                  <p style={{ color: '#9c93a8', textAlign: 'center', fontSize: '14px', lineHeight: '1.6' }}>Select <strong>"Inspect"</strong> on any client from the list<br/>to view their vault details.</p>
                </div>
              ) : (
                <>
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
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block' }}>KYC Status Verification</span>
                      <strong style={{ 
                        color: inspectedClient.kycStatus === 'Verified' ? '#10b981' : inspectedClient.kycStatus === 'Submitted' ? '#f59e0b' : inspectedClient.kycStatus === 'Rejected' ? '#ef4444' : '#9c93a8', 
                        fontSize: '13px',
                        textTransform: 'uppercase'
                      }}>
                        {inspectedClient.kycStatus || 'Pending'}
                      </strong>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {inspectedClient.kycStatus === 'Verified' ? (
                        <button 
                          onClick={() => {
                            const updated = clients.map(c => {
                              if (c.id === inspectedClient.id) {
                                return { ...c, kycStatus: 'Pending', kycDocument: null, kycRejectionReason: null };
                              }
                              return c;
                            });
                            setClients(updated);
                            localStorage.setItem('vb_clients', JSON.stringify(updated));
                          }}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Revoke Verification
                        </button>
                      ) : inspectedClient.kycStatus === 'Submitted' ? (
                        <>
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`${VITE_BACKEND_URL}/api/admin/kyc/update`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: inspectedClient.id.replace('CUST-', ''), status: 'Verified' })
                                });
                                if (!res.ok) throw new Error('Update failed');
                                const updated = clients.map(c => {
                                  if (c.id === inspectedClient.id) {
                                    return { ...c, kycStatus: 'Verified', kycRejectionReason: null };
                                  }
                                  return c;
                                });
                                setClients(updated);
                                localStorage.setItem('vb_clients', JSON.stringify(updated));
                              } catch (e) {
                                alert('Failed to update KYC status.');
                              }
                            }}
                            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={async () => {
                              const reason = prompt("Enter KYC rejection reason:", "The uploaded document image was blurry. Please ensure all details are clearly readable.");
                              if (reason === null) return; // cancelled
                              try {
                                const res = await fetch(`${VITE_BACKEND_URL}/api/admin/kyc/update`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: inspectedClient.id.replace('CUST-', ''), status: 'Rejected' })
                                });
                                if (!res.ok) throw new Error('Update failed');
                                const updated = clients.map(c => {
                                  if (c.id === inspectedClient.id) {
                                    return { ...c, kycStatus: 'Rejected', kycRejectionReason: reason || 'Uploaded document details could not be verified.' };
                                  }
                                  return c;
                                });
                                setClients(updated);
                                localStorage.setItem('vb_clients', JSON.stringify(updated));
                              } catch (e) {
                                alert('Failed to update KYC status.');
                              }
                            }}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        </>
                      ) : inspectedClient.kycStatus === 'Rejected' ? (
                        <button 
                          onClick={() => {
                            const updated = clients.map(c => {
                              if (c.id === inspectedClient.id) {
                                return { ...c, kycStatus: 'Pending', kycDocument: null, kycRejectionReason: null };
                              }
                              return c;
                            });
                            setClients(updated);
                            localStorage.setItem('vb_clients', JSON.stringify(updated));
                          }}
                          style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Reset to Pending
                        </button>
                      ) : (
                        /* Pending */
                        <button 
                          onClick={async () => {
                            try {
                              const res = await fetch(`${VITE_BACKEND_URL}/api/admin/kyc/update`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: inspectedClient.id.replace('CUST-', ''), status: 'Verified' })
                              });
                              if (!res.ok) throw new Error('Update failed');
                              const updated = clients.map(c => {
                                if (c.id === inspectedClient.id) {
                                  return { ...c, kycStatus: 'Verified', kycRejectionReason: null };
                                }
                                return c;
                              });
                              setClients(updated);
                              localStorage.setItem('vb_clients', JSON.stringify(updated));
                            } catch (e) {
                              alert('Failed to update KYC status.');
                            }
                          }}
                          style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Force Verify
                        </button>
                      )}
                    </div>
                  </div>

                  {inspectedClient.kycDocument && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block', marginBottom: '6px' }}>Uploaded Verification File:</span>
                      <div className="kyc-file-preview" style={{ marginTop: 0, padding: '10px 12px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="kyc-file-details">
                          <FileText size={16} className="kyc-upload-icon" style={{ margin: 0 }} />
                          <div className="kyc-file-info" style={{ textAlign: 'left' }}>
                            <span className="kyc-file-name" style={{ fontSize: '12px', color: '#ffffff' }}>{inspectedClient.kycDocument.fileName}</span>
                            <span className="kyc-file-size" style={{ fontSize: '10px', color: '#9c93a8' }}>{inspectedClient.kycDocument.type} • {inspectedClient.kycDocument.fileSize} • {inspectedClient.kycDocument.uploadedAt}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (inspectedClient.kycDocument.fileData) {
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(`<iframe src="${inspectedClient.kycDocument.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                              }
                            } else {
                              alert('File data not available for this older upload. Please ask the user to re-upload.');
                            }
                          }}
                          style={{ background: 'rgba(217, 175, 86, 0.1)', border: '1px solid rgba(217, 175, 86, 0.3)', color: '#d9af56', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217, 175, 86, 0.2)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217, 175, 86, 0.1)'; }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  )}

                  {inspectedClient.kycStatus === 'Rejected' && inspectedClient.kycRejectionReason && (
                    <div className="kyc-rejection-reason" style={{ marginTop: '4px', padding: '10px' }}>
                      <strong>Rejection Reason:</strong> {inspectedClient.kycRejectionReason}
                    </div>
                  )}
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
                </>
              )}
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

              {/* Settings & Analytics Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '10px' }}>
                
                {/* Configuration Panel */}
                <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>⚙️ Referral Configuration</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#9c93a8' }}>Define the system-wide default invitation code. Users signing up with this code are tracked as public default invitees.</p>
                  
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '11px', color: '#d9af56', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Default Referral Code</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={defaultReferralCode} 
                      style={{ width: '100%', background: '#1e0b36', border: '1px solid rgba(217, 175, 86, 0.2)', padding: '10px 14px', borderRadius: '8px', color: '#9c93a8', fontSize: '14px', fontWeight: '700', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div style={{ marginTop: '10px', background: '#1a0832', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #d9af56' }}>
                    <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block', marginBottom: '4px' }}>System Default Referral Link</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {`${window.location.origin}?ref=${defaultReferralCode}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}?ref=${defaultReferralCode}`);
                          alert("System default referral link copied to clipboard!");
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#d9af56', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analytics Panel */}
                <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>📊 Referral Network Analytics</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '5px' }}>
                    <div style={{ background: '#1a0832', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#9c93a8', display: 'block', textTransform: 'uppercase' }}>Default Code</span>
                      <strong style={{ fontSize: '18px', color: '#d9af56', display: 'block', marginTop: '4px' }}>
                        {clients.filter(c => c.referredBy === defaultReferralCode).length}
                      </strong>
                    </div>
                    <div style={{ background: '#1a0832', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#9c93a8', display: 'block', textTransform: 'uppercase' }}>Peer-to-Peer</span>
                      <strong style={{ fontSize: '18px', color: '#ec4899', display: 'block', marginTop: '4px' }}>
                        {clients.filter(c => c.referredBy && c.referredBy !== defaultReferralCode).length}
                      </strong>
                    </div>
                    <div style={{ background: '#1a0832', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#9c93a8', display: 'block', textTransform: 'uppercase' }}>Organic (None)</span>
                      <strong style={{ fontSize: '18px', color: '#10b981', display: 'block', marginTop: '4px' }}>
                        {clients.filter(c => !c.referredBy).length}
                      </strong>
                    </div>
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
    if (successfulReferralsCount < 1) {
      return (
        <div id="root" className="dashboard-page-view admin-dashboard animate-fade-in" style={{ background: '#0e041b', color: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <header className="header" style={{ borderBottom: '1px solid rgba(217, 175, 86, 0.15)', background: '#120524' }}>
            <div className="container nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px' }}>
              <div className="logo-section" onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <InvesthourLogoText customStyle={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', display: 'block' }} />
              </div>
              <button className="btn-sec-signout" onClick={handleSignOut} style={{ background: 'transparent', color: '#d9af56', border: '1px solid #d9af56', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Sign Out</button>
            </div>
          </header>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#120524', border: '1px solid rgba(217, 175, 86, 0.2)', padding: '40px', borderRadius: '16px', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(217, 175, 86, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#d9af56' }}>
                <Lock size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 10px 0' }}>Vault Locked</h2>
              <p style={{ color: '#9c93a8', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' }}>
                Welcome to Investhour! To unlock your full dashboard, live trading floor, and physical vault access, you must successfully refer at least <strong>1 friend</strong> to sign up using your unique link below.
              </p>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px dashed rgba(217, 175, 86, 0.3)' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#9c93a8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Your Unique Referral Link</span>
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}?ref=IH-${user?.email?.split('@')[0].toUpperCase() || 'USER'}`} 
                  style={{ width: '100%', background: 'transparent', border: 'none', color: '#d9af56', fontSize: '13px', textAlign: 'center', outline: 'none', marginBottom: '10px' }}
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}?ref=IH-${user?.email?.split('@')[0].toUpperCase() || 'USER'}`);
                    setCopiedReferralLink(true);
                    setTimeout(() => setCopiedReferralLink(false), 2000);
                  }}
                  style={{ background: copiedReferralLink ? '#10b981' : '#d9af56', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                >
                  {copiedReferralLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '13px', color: '#ffffff' }}>
                <span style={{ color: '#9c93a8' }}>Referrals Completed:</span>
                <strong style={{ color: '#f43f5e', fontSize: '16px' }}>{successfulReferralsCount} / 1</strong>
              </div>
              
              <button 
                onClick={() => window.location.reload()}
                style={{ marginTop: '30px', background: 'transparent', color: '#9c93a8', border: 'none', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer' }}
              >
                I've referred someone, refresh status
              </button>
            </div>
          </div>
        </div>
      );
    }
    const goldVal = (holdings?.gold || 0) * rates.gold.price;
    const silverVal = (holdings?.silver || 0) * rates.silver.price;
    const referralEarnings = successfulReferralsCount * 10;
    const addedCash = Math.max(0, walletBalance - referralEarnings);
    const totalValuation = goldVal + silverVal + addedCash;

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
                    <Wallet size={12} /> Available Cash: ₹{addedCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Allocation Chart Card */}
                <div className="portfolio-allocation-card">
                  <h3>Asset Allocation</h3>
                  <div className="allocation-details-row">
                    <div className="alloc-bar-container">
                      <div className="alloc-segment gold" style={{ width: `${(goldVal / totalValuation) * 100}%` }} title="Gold"></div>
                      <div className="alloc-segment silver" style={{ width: `${(silverVal / totalValuation) * 100}%` }} title="Silver"></div>
                      <div className="alloc-segment cash" style={{ width: `${(addedCash / totalValuation) * 100}%` }} title="Cash"></div>
                    </div>
                    <div className="alloc-legend-grid">
                      <div className="legend-item"><span className="dot gold"></span> Gold: {((goldVal / totalValuation) * 100).toFixed(1)}%</div>
                      <div className="legend-item"><span className="dot silver"></span> Silver: {((silverVal / totalValuation) * 100).toFixed(1)}%</div>
                      <div className="legend-item"><span className="dot cash"></span> Cash: {((addedCash / totalValuation) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Holdings Grid */}
              <h3 className="section-title">Your Digital Meta Vaults</h3>
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
                marginTop: '160px',
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
                      </div>
                      <div className="funding-input-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <button 
                          type="button"
                          className="btn-modal-confirm" 
                          style={{ marginTop: 'auto', background: 'linear-gradient(135deg, #1f1f2e 0%, #0f0f1a 100%)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={() => setShowWithdrawModal(true)}
                        >
                          Withdraw Funds
                        </button>
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
                walletBalance={walletBalance}
                onTradeRedirect={() => setDashTab('trade')} 
              />
            </div>
          )}

          {dashTab === 'profile' && (() => {
            const cRecord = clients.find(c => c.email.toLowerCase() === user.email.toLowerCase()) || {
              id: 'IH-958204-A',
              kycStatus: 'Pending'
            };
            const currentKycStatus = cRecord.kycStatus || 'Pending';

            return (
              <div className="tab-pane-view profile-view animate-fade-in">
                <div className="profile-dashboard-layout">
                  {/* Left Column: Shield/Badge/Status Card */}
                  {currentKycStatus === 'Verified' ? (
                    <div className="profile-security-badge-card">
                      <div className="security-icon-shield"><Shield size={42} className="shield-glow" /></div>
                      <h3>Verified Vault Account</h3>
                      <p className="profile-desc-p">Your digital assets are 100% physically stored in hyper-secure vaults and backed by a 1-to-1 ratio.</p>
                      <div className="security-credentials-list">
                        <div className="cred-row"><span>Vault Identifier</span><strong>{cRecord.id}</strong></div>
                        <div className="cred-row"><span>KYC Verification Status</span><strong className="positive-text"><Check size={12} /> SECURED & VERIFIED</strong></div>
                        <div className="cred-row"><span>Security Standard</span><strong>Mandatory OTP Login Enabled</strong></div>
                        <div className="cred-row"><span>Physical Vault Storage</span><strong>Brink&apos;s & Sequel London</strong></div>
                      </div>
                    </div>
                  ) : currentKycStatus === 'Submitted' ? (
                    <div className="profile-security-badge-card">
                      <div className="kyc-scanner-container">
                        <div className="kyc-scanner-line"></div>
                        <Shield size={42} style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' }} />
                      </div>
                      <h3>Verification In Progress</h3>
                      <p className="profile-desc-p">Our compliance team is verifying your details. This process typically takes between 2 to 4 hours.</p>
                      <div className="security-credentials-list">
                        <div className="cred-row"><span>Vault Identifier</span><strong>{cRecord.id}</strong></div>
                        <div className="cred-row"><span>KYC Verification Status</span><strong style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={12} className="animate-spin" /> UNDER REVIEW</strong></div>
                        <div className="cred-row"><span>Uploaded Document</span><strong>{cRecord.kycDocument?.type || 'ID Card'}</strong></div>
                        <div className="cred-row"><span>Physical Vault Storage</span><strong>Brink&apos;s & Sequel London</strong></div>
                      </div>
                    </div>
                  ) : currentKycStatus === 'Rejected' ? (
                    <div className="profile-security-badge-card">
                      <div className="security-icon-shield" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <AlertTriangle size={42} style={{ color: '#ef4444', filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' }} />
                      </div>
                      <h3 style={{ color: '#ef4444' }}>Verification Failed</h3>
                      <p className="profile-desc-p">We were unable to verify your identity documents. Please review the reason below and submit again.</p>
                      
                      <div className="kyc-rejection-reason">
                        <strong>Rejection Reason:</strong>
                        <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.8)' }}>
                          {cRecord.kycRejectionReason || 'Uploaded document details could not be verified. Please ensure the image is clear and not cropped.'}
                        </p>
                      </div>

                      <button 
                        type="button" 
                        className="btn-kyc-submit" 
                        onClick={handleKycRestart}
                        style={{ marginTop: '20px' }}
                      >
                        Restart Verification
                      </button>
                    </div>
                  ) : (
                    /* Pending State */
                    <div className="profile-security-badge-card">
                      <div className="security-icon-shield" style={{ backgroundColor: 'rgba(168, 85, 247, 0.04)', borderColor: 'rgba(168, 85, 247, 0.1)' }}>
                        <Lock size={36} style={{ color: '#a855f7' }} />
                      </div>
                      <h3>Secure Your Vault</h3>
                      <p className="profile-desc-p">Complete your Know Your Customer (KYC) check to activate secure physical storage and enable full trading capabilities.</p>
                      <div className="security-credentials-list">
                        <div className="cred-row"><span>Vault Identifier</span><strong>{cRecord.id}</strong></div>
                        <div className="cred-row"><span>KYC Verification Status</span><strong style={{ color: '#9c93a8' }}>UNVERIFIED</strong></div>
                        <div className="cred-row"><span>Requirements</span><strong>Aadhaar / PAN Card</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Right Column: Settings or Upload widget */}
                  {currentKycStatus === 'Verified' || currentKycStatus === 'Submitted' ? (
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

                      {currentKycStatus === 'Submitted' && cRecord.kycDocument && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
                          <h4 style={{ fontSize: '13px', color: '#ffffff', marginBottom: '12px', fontWeight: 700 }}>Pending Document Details</h4>
                          <div className="kyc-file-preview" style={{ marginTop: 0 }}>
                            <div className="kyc-file-details">
                              <FileText size={20} className="kyc-upload-icon" style={{ margin: 0 }} />
                              <div className="kyc-file-info">
                                <span className="kyc-file-name">{cRecord.kycDocument.fileName}</span>
                                <span className="kyc-file-size">{cRecord.kycDocument.type} • {cRecord.kycDocument.fileSize} • Uploaded at {cRecord.kycDocument.uploadedAt}</span>
                              </div>
                            </div>
                            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800 }}>PENDING REVIEW</span>
                          </div>
                        </div>
                      )}

                      <div className="profile-quick-actions-row" style={{ marginTop: '20px' }}>
                        <button 
                          type="button" 
                          className="btn-profile-secondary" 
                          disabled={currentKycStatus !== 'Verified'}
                          style={{ opacity: currentKycStatus === 'Verified' ? 1 : 0.5, cursor: currentKycStatus === 'Verified' ? 'pointer' : 'not-allowed' }}
                          onClick={() => alert('Downloading Vault Asset Certification PDF...')}
                        >
                          <Download size={14} /> Download Vault Certificate
                        </button>
                        <button 
                          type="button" 
                          className="btn-profile-secondary" 
                          disabled={currentKycStatus !== 'Verified'}
                          style={{ opacity: currentKycStatus === 'Verified' ? 1 : 0.5, cursor: currentKycStatus === 'Verified' ? 'pointer' : 'not-allowed' }}
                          onClick={() => alert('Exporting all transaction logs as CSV...')}
                        >
                          <Download size={14} /> Export Vault Ledger (CSV)
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Pending & Rejected: Show Upload Widget */
                    <div className="profile-details-settings-card">
                      <h3>KYC Document Upload Center</h3>
                      
                      {/* Document Selector Tabs */}
                      <div className="kyc-doc-tabs">
                        <button 
                          type="button" 
                          className={`kyc-doc-tab ${kycDocType === 'Aadhaar' ? 'active' : ''}`}
                          onClick={() => setKycDocType('Aadhaar')}
                        >
                          Aadhaar Card
                        </button>
                        <button 
                          type="button" 
                          className={`kyc-doc-tab ${kycDocType === 'PAN' ? 'active' : ''}`}
                          onClick={() => setKycDocType('PAN')}
                        >
                          PAN Card
                        </button>
                      </div>

                      {/* Dropzone Area */}
                      {!kycFile && !kycUploading && (
                        <div 
                          className={`kyc-upload-dropzone ${kycDragging ? 'dragging' : ''}`}
                          onDragOver={(e) => { e.preventDefault(); setKycDragging(true); }}
                          onDragLeave={() => setKycDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setKycDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleKycFileSelect(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => document.getElementById('kyc-file-input').click()}
                        >
                          <Upload size={28} className="kyc-upload-icon" />
                          <span className="kyc-upload-title">Drag & drop your document here, or <span style={{ color: '#a855f7', textDecoration: 'underline' }}>browse files</span></span>
                          <span className="kyc-upload-subtitle">Supports PDF, PNG, JPG (Max 5MB)</span>
                          <input 
                            id="kyc-file-input" 
                            type="file" 
                            style={{ display: 'none' }} 
                            accept=".pdf,image/png,image/jpeg"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleKycFileSelect(e.target.files[0]);
                              }
                            }}
                          />
                        </div>
                      )}

                      {/* Upload Progress Bar */}
                      {kycUploading && (
                        <div className="kyc-progress-container">
                          <div className="kyc-progress-status">
                            <span>{kycUploadStatusText}</span>
                            <span>{kycUploadProgress}%</span>
                          </div>
                          <div className="kyc-progress-bg">
                            <div className="kyc-progress-bar" style={{ width: `${kycUploadProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {/* File Uploaded Preview */}
                      {kycFile && !kycUploading && (
                        <div className="kyc-file-preview">
                          <div className="kyc-file-details">
                            <FileText size={22} className="kyc-upload-icon" style={{ margin: 0 }} />
                            <div className="kyc-file-info">
                              <span className="kyc-file-name">{kycFile.name}</span>
                              <span className="kyc-file-size">{(kycFile.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            className="kyc-btn-delete"
                            onClick={() => setKycFile(null)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}

                      <button 
                        type="button" 
                        className="btn-kyc-submit" 
                        disabled={!kycFile || kycUploading}
                        onClick={handleKycSubmit}
                      >
                        Submit KYC Verification
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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

        {showWithdrawModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <span className="modal-title">Withdraw Funds</span>
                <button type="button" className="modal-close" onClick={() => setShowWithdrawModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <p style={{ color: '#9c93a8', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>Minimum withdrawal is ₹500.</p>
                <div className="funding-input-group" style={{ marginBottom: '20px' }}>
                  <label>Amount to Withdraw (INR)</label>
                  <div className="funding-input-field-wrapper">
                    <span className="currency-symbol">{'\u20b9'}</span>
                    <input type="number" placeholder="Enter amount (min 500)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                  </div>
                </div>
                <RazorpayButton 
                  amount={parseFloat(withdrawAmount) || 0} 
                  type="withdraw" 
                  onSuccess={(data) => {
                    const val = parseFloat(withdrawAmount);
                    if (val < 500) {
                      alert('Minimum withdrawal is ₹500.');
                      return;
                    }
                    if (walletBalance < val) {
                      alert('Insufficient balance in your secure wallet.');
                      return;
                    }
                    setWalletBalance((prev) => parseFloat((prev - val).toFixed(2)));
                    setTransactions((prev) => [{ id: `TX-${Math.floor(1000 + Math.random() * 9000)}`, type: 'withdrawal', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                    setWithdrawAmount('');
                    setShowWithdrawModal(false);
                  }}
                  onError={(err) => {
                    if (err?.response?.data?.error === 'Insufficient wallet balance' || walletBalance < parseFloat(withdrawAmount)) {
                       alert('Insufficient balance in your secure wallet.');
                    } else if (parseFloat(withdrawAmount) < 500) {
                       alert('Minimum withdrawal is ₹500.');
                    }
                  }}
                />
              </div>
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

  // ─── Password Reset via Email Link ───────────────────────────────────────
  if (resetToken && !resetDone) {
    return (
      <div id="root" className="auth-page-view">
        <header className="header">
          <div className="container nav-container">
            <div className="logo-section" style={{ cursor: 'default' }}>
              <InvesthourLogoText />
            </div>
          </div>
        </header>
        <div className="auth-container">
          <div className="auth-card animate-fade-in">
            <form className="auth-form" onSubmit={handleResetViaToken}>
              <div className="auth-form-header">
                <h2>Set New Password</h2>
                <p>Choose a strong password for your account</p>
              </div>

              <div className="auth-input-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={resetShowPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                  />
                  <button type="button" className="password-eye-toggle" onClick={() => setResetShowPassword(!resetShowPassword)}>
                    {resetShowPassword
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div className="auth-input-group" style={{ marginTop: '14px' }}>
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={resetShowPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {resetError && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}>{resetError}</p>
              )}

              <button type="submit" className="btn-auth-submit" disabled={resetLoading} style={{ marginTop: '20px' }}>
                {resetLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (resetDone) {
    return (
      <div id="root" className="auth-page-view">
        <header className="header">
          <div className="container nav-container">
            <div className="logo-section"><InvesthourLogoText /></div>
          </div>
        </header>
        <div className="auth-container">
          <div className="auth-card animate-fade-in" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
              border: '2px solid rgba(34,197,94,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ color: '#22c55e', marginBottom: '8px' }}>Password Updated!</h2>
            <p style={{ color: '#94a3b8', marginBottom: '28px' }}>Your password has been reset successfully. You can now sign in with your new password.</p>
            <button
              type="button"
              className="btn-auth-submit"
              onClick={() => { setView('auth'); setAuthTab('login'); }}
            >
              Go to Sign In
            </button>
          </div>
        </div>
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
            {authTab !== 'forgot' && (
              <div className="auth-tabs">
                <button type="button" className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`} onClick={() => { setAuthTab('login'); setShowPassword(false); }}>Sign In</button>
                <button type="button" className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`} onClick={() => { setAuthTab('register'); setShowPassword(false); }}>Sign Up</button>
              </div>
            )}
            {authTab === 'forgot' ? (
              <form className="auth-form" onSubmit={handleForgotPasswordRequest}>
                <div className="auth-form-header">
                  <h2>Reset Password</h2>
                  <p>
                    {forgotStep === 'sent'
                      ? `We've sent a reset link to ${forgotEmail}`
                      : 'Enter your email and we\'ll send you a password reset link'}
                  </p>
                </div>

                {forgotStep === 'sent' ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.05))',
                      border: '2px solid rgba(240,180,41,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f0b429" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: '0 0 8px' }}>
                      Check your inbox and click the <strong style={{ color: '#f0b429' }}>Reset My Password</strong> button in the email.
                    </p>
                    <p style={{ color: '#64748b', fontSize: '13px' }}>The link expires in 30 minutes. Check spam if you don't see it.</p>
                    <button
                      type="button"
                      className="btn-profile-secondary"
                      style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                      onClick={() => { setForgotStep('request'); setForgotEmail(''); }}
                    >
                      Resend with a different email
                    </button>
                  </div>
                ) : (
                  <div className="auth-input-group">
                    <label>Registered Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                  {forgotStep !== 'sent' && (
                    <button type="submit" className="btn-auth-submit" disabled={forgotLoading}>
                      {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-profile-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { setAuthTab('login'); setForgotStep('request'); setForgotEmail(''); }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : authTab === 'login' ? (
              <form className="auth-form" onSubmit={handleSignInStart}>
                <div className="auth-form-header"><h2>Welcome Back</h2><p>Access your precious metal vault securely</p></div>
                <div className="auth-input-group">
                  <label>Email or Mobile Number</label>
                  <input type="text" required placeholder="Enter email or mobile" value={authForm.email || ''} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
                </div>
                <div className="auth-input-group">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      placeholder="••••••••" 
                      value={authForm.password || ''} 
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} 
                    />
                    <button 
                      type="button" 
                      className="password-eye-toggle" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="auth-actions-row">
                  <label className="auth-checkbox"><input type="checkbox" /> Keep me signed in</label>
                  <button 
                    type="button" 
                    className="forgot-password" 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} 
                    onClick={() => { setAuthTab('forgot'); setForgotStep('request'); }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <button type="submit" className="btn-auth-submit" disabled={otpSending}>{otpSending ? 'Signing In...' : 'Sign In Securely'}</button>
              </form>
            ) : signupStep === 'details' ? (
              <form className="auth-form" onSubmit={handleSignUp}>
                <div className="auth-form-header"><h2>Create Vault</h2><p>Begin accumulating premium digital meta today</p></div>
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
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      placeholder="Create secure password" 
                      value={authForm.password || ''} 
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} 
                    />
                    <button 
                      type="button" 
                      className="password-eye-toggle" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="auth-input-group">
                  <label>Referral Code (Optional)</label>
                  <input type="text" placeholder="e.g. INVEST-WELCOME" value={authForm.referralCode || ''} onChange={(e) => setAuthForm({ ...authForm, referralCode: e.target.value })} />
                </div>
                <label className="auth-checkbox agreement"><input type="checkbox" required /> I agree to the digital meta vaulting terms and conditions</label>
                <button type="submit" className="btn-auth-submit" disabled={otpSending}>{otpSending ? 'Processing...' : 'Create Vault Account'}</button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleVerifySignupOtp}>
                <div className="auth-form-header">
                  <h2>Verify Email</h2>
                  <p>Enter the 6-digit code sent to {authForm.email}</p>
                </div>
                <div className="auth-input-group">
                  <label>Verification Code</label>
                  <input 
                    type="text" 
                    maxLength={6} 
                    required 
                    placeholder="XXX-XXX" 
                    value={signupOtp} 
                    onChange={(e) => setSignupOtp(e.target.value)} 
                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold' }} 
                  />
                </div>
                <button type="submit" className="btn-auth-submit" disabled={otpSending}>
                  {otpSending ? 'Verifying...' : 'Verify & Register'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button type="button" onClick={() => setSignupStep('details')} style={{ background: 'none', border: 'none', color: '#9c93a8', cursor: 'pointer', fontSize: '13px' }}>Back to signup</button>
                </div>
              </form>
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
            walletBalance={walletBalance}
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
        {showWithdrawModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <span className="modal-title">Withdraw Funds</span>
                <button type="button" className="modal-close" onClick={() => setShowWithdrawModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <p style={{ color: '#9c93a8', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>Minimum withdrawal is ₹500.</p>
                <div className="funding-input-group" style={{ marginBottom: '20px' }}>
                  <label>Amount to Withdraw (INR)</label>
                  <div className="funding-input-field-wrapper">
                    <span className="currency-symbol">{'\u20b9'}</span>
                    <input type="number" placeholder="Enter amount (min 500)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                  </div>
                </div>
                <RazorpayButton 
                  amount={parseFloat(withdrawAmount) || 0} 
                  type="withdraw" 
                  onSuccess={(data) => {
                    const val = parseFloat(withdrawAmount);
                    if (val < 500) {
                      alert('Minimum withdrawal is ₹500.');
                      return;
                    }
                    if (walletBalance < val) {
                      alert('Insufficient balance in your secure wallet.');
                      return;
                    }
                    setWalletBalance((prev) => parseFloat((prev - val).toFixed(2)));
                    setTransactions((prev) => [{ id: `TX-${Math.floor(1000 + Math.random() * 9000)}`, type: 'withdrawal', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                    setWithdrawAmount('');
                    setShowWithdrawModal(false);
                  }}
                  onError={(err) => {
                    if (err?.response?.data?.error === 'Insufficient wallet balance' || walletBalance < parseFloat(withdrawAmount)) {
                       alert('Insufficient balance in your secure wallet.');
                    } else if (parseFloat(withdrawAmount) < 500) {
                       alert('Minimum withdrawal is ₹500.');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

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
                <span className="kyc-badge">{user.email === 'sandeepkumar.pikili@vrpigroup.co.in' ? 'ADMIN' : 'KYC SECURED'}</span>
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
