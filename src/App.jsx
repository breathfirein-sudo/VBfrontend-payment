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
  EyeOff,
  Menu,
  Home,
  Building,
  Hash,
  Phone,
  PhoneCall,
  Calendar,
  Globe,
  History,
  BarChart2,
  Settings,
  MoreHorizontal,
  List,
  Clock,
  Search,
  Filter,
  CheckCircle,
  Paperclip,
  Smile,
  MoreVertical,
  UserPlus,
  PhoneMissed,
  ChevronLeft,
  ChevronRight
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
  const isSupportSubdomain = window.location.hostname.startsWith('support.');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const handleKycRestart = async () => {
    try {
      await fetch(`${VITE_BACKEND_URL}/api/auth/kyc/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
    } catch (e) {
      console.error("Failed to sync KYC restart on backend:", e);
    }

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

  const handleKycDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your submitted KYC document?")) return;
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/auth/kyc/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      if (res.ok) {
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
        alert("KYC document deleted successfully.");
      } else {
        alert("Failed to delete KYC document.");
      }
    } catch (err) {
      alert("Error deleting KYC document: " + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    const doubleConfirm = window.prompt("WARNING: Deleting your account will permanently wipe all your trading progress, wallets, transactions, and documents.\n\nType 'DELETE' to confirm deletion:");
    if (doubleConfirm !== 'DELETE') {
      alert("Account deletion cancelled.");
      return;
    }

    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/auth/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      if (res.ok) {
        alert("Your account has been permanently deleted. Logging you out...");
        setClients(prev => {
          const next = prev.filter(c => c.email.toLowerCase() !== user.email.toLowerCase());
          localStorage.setItem('vb_clients', JSON.stringify(next));
          return next;
        });
        localStorage.removeItem('vb_jwt_token');
        localStorage.removeItem('vb_local_user');
        setUser(null);
        setView(isSupportSubdomain ? 'auth' : 'home');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert("Failed to delete account: " + (errData.error || errData.message || "Unknown server error"));
      }
    } catch (error) {
      alert("Error deleting account: " + error.message);
    }
  };

  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState(() => {
    if (isSupportSubdomain && !localStorage.getItem('vb_jwt_token')) return 'auth';
    return localStorage.getItem('vb_view') || 'home';
  }); // 'home', 'auth', 'dashboard'
  
  useEffect(() => { localStorage.setItem('vb_view', view); }, [view]);
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'register'
  const [authRole, setAuthRole] = useState(isSupportSubdomain ? 'support' : 'client'); // 'client' or 'support'
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
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [referralsList, setReferralsList] = useState([]);
  const [realtimeWinners, setRealtimeWinners] = useState([]);
  
  // --- Live Portfolio Balance & Holdings State ---
  const [walletBalance, setWalletBalance] = useState(0); // Available Cash in Rupees
  const [holdings, setHoldings] = useState(() =>
    createInitialHoldings({})
  );

  // --- Interactive Deposit / Withdrawal Fields ---
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState('bank'); // 'bank'
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [lockedBankDetails, setLockedBankDetails] = useState(null);
  const [payoutMode, setPayoutMode] = useState('IMPS');

  // --- Manual Deposit States ---
  const [showManualDepositModal, setShowManualDepositModal] = useState(false);
  const [manualUtr, setManualUtr] = useState('');
  const [manualScreenshot, setManualScreenshot] = useState(null);
  const [manualDepositSubmitting, setManualDepositSubmitting] = useState(false);

  const handleManualDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0 || !manualUtr || !manualScreenshot) {
      alert("Amount, UTR number, and screenshot are required.");
      return;
    }
    setManualDepositSubmitting(true);
    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('amount', depositAmount);
      formData.append('utrNumber', manualUtr);
      formData.append('screenshot', manualScreenshot);

      const res = await fetch(`${VITE_BACKEND_URL}/api/deposits/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert("Manual deposit submitted! Waiting for executive approval.");
        setShowManualDepositModal(false);
        setManualUtr('');
        setManualScreenshot(null);
        setDepositAmount('');
      } else {
        alert(data.error || "Submission failed");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setManualDepositSubmitting(false);
    }
  };  const withdrawableBalance = Math.max(0, walletBalance - (successfulReferralsCount * 10));

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

  const syncLockedBankDetails = async (email) => {
    if (!email) return;
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.valid && data.lockedBankDetails) {
        setLockedBankDetails(data.lockedBankDetails);
        setAccountHolderName(data.lockedBankDetails.accountHolder || '');
        setBankName(data.lockedBankDetails.bankName || '');
        setAccountNumber(data.lockedBankDetails.bankAccount || '');
        setIfscCode(data.lockedBankDetails.ifsc || '');
      } else {
        setLockedBankDetails(null);
      }
    } catch (err) {
      console.error("Failed to sync locked bank details:", err);
    }
  };

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
  
  // --- Admin Withdrawal Request States & Methods ---
  const [adminWithdrawals, setAdminWithdrawals] = useState([]);
  const [fetchingWithdrawals, setFetchingWithdrawals] = useState(false);

  // --- Support Executives States & Methods ---
  const [executives, setExecutives] = useState([]);
  const [fetchingExecutives, setFetchingExecutives] = useState(false);
  const [showAddExecModal, setShowAddExecModal] = useState(false);
  const [showEditExecModal, setShowEditExecModal] = useState(false);
  const [execForm, setExecForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'Chat',
    salary: '',
    status: 'Active',
    shift: 'Day',
    languages: 'English, Hindi',
    rating: '5.0',
    experienceYrs: '0'
  });
  const [editingExecId, setEditingExecId] = useState(null);

  const fetchExecutives = async () => {
    setFetchingExecutives(true);
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/admin/support-executives`);
      const data = await res.json();
      if (data.success) {
        setExecutives(data.executives);
      }
    } catch (e) {
      console.error("Error fetching support executives:", e);
    } finally {
      setFetchingExecutives(false);
    }
  };

  const handleAddExecutive = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/admin/support-executives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(execForm)
      });
      const data = await res.json();
      if (data.success) {
        setExecutives(prev => [data.executive, ...prev]);
        setShowAddExecModal(false);
        setExecForm({
          name: '',
          phone: '',
          email: '',
          role: 'Chat',
          salary: '',
          status: 'Active',
          shift: 'Day',
          languages: 'English, Hindi',
          rating: '5.0',
          experienceYrs: '0'
        });
        alert(`✅ Support executive added successfully!\n\nEmail: ${data.executive.email}\nTemporary Password: ${data.tempPassword}\n\nAn onboarding email notification has been dispatched.`);
      } else {
        alert("Failed to add: " + data.message);
      }
    } catch (err) {
      alert("Error adding support executive: " + err.message);
    }
  };

  const handleUpdateExecutive = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/admin/support-executives/${editingExecId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(execForm)
      });
      const data = await res.json();
      if (data.success) {
        setExecutives(prev => prev.map(ex => ex.id === editingExecId ? data.executive : ex));
        setShowEditExecModal(false);
        setEditingExecId(null);
        alert("✅ Support executive updated successfully!");
      } else {
        alert("Failed to update: " + data.message);
      }
    } catch (err) {
      alert("Error updating support executive: " + err.message);
    }
  };

  const handleToggleExecStatus = async (exec) => {
    const newStatus = exec.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/admin/support-executives/${exec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setExecutives(prev => prev.map(ex => ex.id === exec.id ? data.executive : ex));
      } else {
        alert("Failed to update status: " + data.message);
      }
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleDeleteExecutive = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete support executive "${name}"?`)) return;
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/admin/support-executives/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setExecutives(prev => prev.filter(ex => ex.id !== id));
        alert("✅ Support executive deleted successfully!");
      } else {
        alert("Failed to delete: " + data.message);
      }
    } catch (err) {
      alert("Error deleting support executive: " + err.message);
    }
  };

  // --- Support Executive Panel States & Methods ---
  const [execProfile, setExecProfile] = useState(null);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChatEmail, setSelectedChatEmail] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [callRequests, setCallRequests] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [execTab, setExecTab] = useState('dashboard');
  const [realTimeClock, setRealTimeClock] = useState(new Date());

  const fetchExecProfile = async () => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      if (!token) return;
      const res = await fetch(`${VITE_BACKEND_URL}/api/support/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setExecProfile(data.executive);
      }
    } catch (err) {
      console.error("Error fetching exec profile:", err);
    }
  };

  const handleClockIn = async () => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      const res = await fetch(`${VITE_BACKEND_URL}/api/support/attendance/clock-in`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setExecProfile(prev => ({ ...prev, attendance: data.attendance }));
        alert("⏰ Clocked in successfully!");
      } else {
        alert(data.error || "Failed to clock in");
      }
    } catch (err) {
      alert("Error clocking in: " + err.message);
    }
  };

  const handleClockOut = async () => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      const res = await fetch(`${VITE_BACKEND_URL}/api/support/attendance/clock-out`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setExecProfile(prev => ({ ...prev, attendance: data.attendance }));
        alert("⏰ Clocked out successfully!");
      } else {
        alert(data.error || "Failed to clock out");
      }
    } catch (err) {
      alert("Error clocking out: " + err.message);
    }
  };

  const fetchActiveChats = async () => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      if (!token) return;
      const res = await fetch(`${VITE_BACKEND_URL}/api/support/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveChats(data.threads);
      }
    } catch (err) {
      console.error("Error fetching active chats:", err);
    }
  };

  const fetchChatMessages = async (email) => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      if (!token) return;
      const res = await fetch(`${VITE_BACKEND_URL}/api/support/chats/${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.messages);
      }
    } catch (err) {
      console.error("Error fetching chat messages:", err);
    }
  };

  const handleSendExecReply = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedChatEmail) return;

    try {
      const token = localStorage.getItem('vb_jwt_token');
      const res = await fetch(`${VITE_BACKEND_URL}/api/support/chats/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userEmail: selectedChatEmail, text: newMessageText })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, data.message]);
        setNewMessageText('');
        fetchActiveChats();
      }
    } catch (err) {
      console.error("Error sending reply:", err);
    }
  };

  const fetchCallRequests = async () => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      if (!token) return;
      const res = await fetch(`${VITE_BACKEND_URL}/api/support/call-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCallRequests(data.requests);
      }
    } catch (err) {
      console.error("Error fetching call requests:", err);
    }
  };

  const [pendingDeposits, setPendingDeposits] = useState([]);
  const fetchPendingDeposits = async () => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      if (!token) return;
      const res = await fetch(`${VITE_BACKEND_URL}/api/deposits/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPendingDeposits(data.deposits);
      }
    } catch (err) {
      console.error("Error fetching pending deposits:", err);
    }
  };

  const handleDepositAction = async (id, action) => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      const res = await fetch(`${VITE_BACKEND_URL}/api/deposits/${id}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Deposit ${action}d successfully`);
        fetchPendingDeposits();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      alert("Error processing deposit: " + err.message);
    }
  };

  const handleUpdateCallStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      const res = await fetch(`${VITE_BACKEND_URL}/api/support/call-requests/${id}/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchCallRequests();
      }
    } catch (err) {
      alert("Error updating call request: " + err.message);
    }
  };

  useEffect(() => {
    if (view === 'support-dashboard' && user && user.isExecutive) {
      fetchExecProfile();
      fetchActiveChats();
      fetchCallRequests();
      fetchPendingDeposits();

      // Poll chats & call requests every 5 seconds for responsive updates
      const interval = setInterval(() => {
        fetchActiveChats();
        fetchCallRequests();
        fetchPendingDeposits();
        if (selectedChatEmail) {
          fetchChatMessages(selectedChatEmail);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [view, user]);

  // Real-time clock ticker for shift progress bar
  useEffect(() => {
    if (view === 'support-dashboard') {
      const clockInterval = setInterval(() => {
        setRealTimeClock(new Date());
      }, 1000);
      return () => clearInterval(clockInterval);
    }
  }, [view]);


  useEffect(() => {
    if (selectedChatEmail) {
      fetchChatMessages(selectedChatEmail);
    } else {
      setChatMessages([]);
    }
  }, [selectedChatEmail]);

  const fetchAdminWithdrawals = async () => {
    setFetchingWithdrawals(true);
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/admin/withdrawals`);
      const data = await res.json();
      if (data.success) {
        setAdminWithdrawals(data.withdrawals || []);
      }
    } catch (e) {
      console.error("Error fetching withdrawals:", e);
    } finally {
      setFetchingWithdrawals(false);
    }
  };
  
  const exportPendingToExcelAndClear = async () => {
    const pending = adminWithdrawals.filter(w => w.status === 'processing');
    if (pending.length === 0) {
      alert("No pending withdrawal requests to export.");
      return;
    }

    if (!window.confirm(`Export ${pending.length} pending withdrawal requests to Excel (CSV) and delete them from database?`)) {
      return;
    }

    // 1. Generate CSV content with Bank Payout Format
    let startingSeq = parseInt(localStorage.getItem('vb_payout_ref_seq') || '1000001', 10);

    const headers = [
      "Beneficiary Name (Mandatory)",
      "Beneficiary's Account Number (Mandatory)",
      "IFSC Code (Mandatory)",
      "Payout Amount (Mandatory)",
      "Payout Mode (Mandatory)",
      "Payout Narration (Optional)",
      "Notes (Optional)",
      "Phone Number (Optional)",
      "Email ID (Optional)",
      "Contact Reference ID (Optional)",
      "Payout Reference ID (Optional)"
    ];

    const rows = pending.map(w => {
      const beneficiaryName = w.accountHolder || '';
      const beneficiaryAccount = w.bankAccount ? `\t${w.bankAccount}` : '';
      const ifsc = w.ifsc || 'N/A';
      const amount = w.amount || 0;
      // upiId stores the selected payoutMode ('IMPS', 'RTGS', 'NEFT')
      const mode = w.upiId || 'IMPS';
      const narration = 'Wallet Withdrawal';
      const notes = '';
      const phone = w.user?.phone ? `\t${w.user.phone}` : '';
      const email = w.user?.email || 'N/A';
      const contactRefId = w.userId ? `CUST-${w.userId}` : '';
      const payoutRefId = `PSK@${startingSeq++}`;

      return [
        beneficiaryName,
        beneficiaryAccount,
        ifsc,
        amount,
        mode,
        narration,
        notes,
        phone,
        email,
        contactRefId,
        payoutRefId
      ];
    });

    localStorage.setItem('vb_payout_ref_seq', startingSeq.toString());

    // Create CSV string with BOM for Excel UTF-8 compatibility
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(e => e.map(val => {
        // Escape quotes and wrap strings containing commas
        const strVal = String(val);
        if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(","))
    ].join("\n");

    // 2. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pending_withdrawals_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 3. Clear Data (Delete from DB)
    try {
      const paymentIds = pending.map(w => w.id);
      const res = await fetch(`${VITE_BACKEND_URL}/api/admin/withdrawals/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIds })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Excel downloaded successfully!\n${pending.length} pending request(s) have been deleted from the database.`);
        // Reload list
        fetchAdminWithdrawals();
      } else {
        alert(`Excel downloaded, but failed to clear data from database: ${data.message}`);
      }
    } catch (err) {
      alert(`Excel downloaded, but error clearing database: ${err.message}`);
    }
  };

  // Platform Profit (fees + GST from trades)
  const [platformProfit, setPlatformProfit] = useState({ totalFees: 0, totalGst: 0, totalProfit: 0, tradeCount: 0 });

  const fetchPlatformProfit = async () => {
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/admin/platform-profit`);
      const data = await res.json();
      if (data.success) {
        setPlatformProfit({
          totalFees: data.totalFees || 0,
          totalGst: data.totalGst || 0,
          totalProfit: data.totalProfit || 0,
          tradeCount: data.tradeCount || 0
        });
      }
    } catch (e) {
      console.error("Error fetching platform profit:", e);
    }
  };

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
    if (user && user.email === 'sandeepkumar.pikili@vrpigroup.co.in') {
      if (adminTab === 'contest') {
        fetchAdminContestData();
      } else if (adminTab === 'withdrawals') {
        fetchAdminWithdrawals();
      } else if (adminTab === 'support') {
        fetchExecutives();
      }
    }
  }, [user, adminTab]);

  useEffect(() => {
    if (user && user.email === 'sandeepkumar.pikili@vrpigroup.co.in') {
      fetchAdminClientsData();
      fetchPlatformProfit();
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
        // Load non-balance data from localStorage instantly for speed
        setHoldings(createInitialHoldings(match.holdings || {}));
        setSuccessfulReferralsCount(match.referralCount || 0);
        // Load transactions from localStorage as a temporary display (backend will override)
        if (match.transactions && match.transactions.length > 0) {
          setTransactions(match.transactions);
        }
        // For wallet balance: start with localStorage value but backend WILL override it
        setWalletBalance(match.walletBalance || 0);
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
        setWalletBalance(0);
        setHoldings(cRecord.holdings);
        setTransactions(cRecord.transactions);
        setSuccessfulReferralsCount(cRecord.referralCount);
      }

      // *** PRIMARY SOURCE OF TRUTH: Always sync from backend DB on login ***
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
            if (data.isUnlocked !== undefined) {
              setIsUnlocked(data.isUnlocked);
            }
            // ALWAYS use backend balance — it's the authoritative value
            if (data.walletBalance !== undefined) {
              setWalletBalance(data.walletBalance);
            }
            if (data.lockedBankDetails) {
              setLockedBankDetails(data.lockedBankDetails);
              setAccountHolderName(data.lockedBankDetails.accountHolder || '');
              setBankName(data.lockedBankDetails.bankName || '');
              setAccountNumber(data.lockedBankDetails.bankAccount || '');
              setIfscCode(data.lockedBankDetails.ifsc || '');
            } else {
              setLockedBankDetails(null);
            }
            if (data.transactions !== undefined) {
              const mappedTx = data.transactions.map(t => ({
                id: 'TX-' + t.id,
                type: t.type?.toLowerCase() === 'deposit' ? 'deposit' : 
                      t.type?.toLowerCase() === 'referral' ? 'referral' : 
                      t.type?.toLowerCase() === 'refund' ? 'refund' : 'withdrawal',
                asset: t.asset || 'wallet',
                amount: t.amount,
                status: 'Completed',
                date: new Date(t.createdAt).toISOString().slice(0, 16).replace('T', ' ')
              }));
              setTransactions(mappedTx);
            }
            // Update localStorage with the correct backend values
            setClients(prev => {
              const updated = prev.map(c => {
                if (c.email.toLowerCase() === user.email.toLowerCase()) {
                  return {
                    ...c,
                    walletBalance: data.walletBalance !== undefined ? data.walletBalance : c.walletBalance,
                    referralCount: data.referralCount !== undefined ? data.referralCount : c.referralCount,
                    transactions: data.transactions !== undefined ? data.transactions.map(t => ({
                      id: 'TX-' + t.id,
                      type: t.type?.toLowerCase() === 'deposit' ? 'deposit' : 
                            t.type?.toLowerCase() === 'referral' ? 'referral' : 
                            t.type?.toLowerCase() === 'refund' ? 'refund' : 'withdrawal',
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
          } else {
            localStorage.removeItem('vb_local_user');
            setUser(null);
            setView(isSupportSubdomain ? 'auth' : 'home');
          }
        })
        .catch(err => console.error("Error syncing user profile from DB:", err));
    }
  }, [user]);

  useEffect(() => {
    fetch(`${VITE_BACKEND_URL}/api/contest/leaderboard`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.leaderboard) {
          setRealtimeWinners(data.leaderboard);
        }
      })
      .catch(err => console.error("Error fetching homepage leaderboard:", err));
  }, []);

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
    const startTime = Date.now();
    const minDelay = 2000; // 2 seconds minimum loading screen time

    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDelay - elapsed);
      setTimeout(() => {
        setLoading(false);
      }, remaining);
    };

    const savedLocalUser = localStorage.getItem('vb_local_user');
    if (savedLocalUser) {
      try {
        const parsed = JSON.parse(savedLocalUser);
        
        if (parsed.isExecutive) {
          setUser(parsed);
          setView('support-dashboard');
          finishLoading();
          return;
        }

        if (parsed.email === 'sandeepkumar.pikili@vrpigroup.co.in') {
          setUser(parsed);
          setView('dashboard');
          finishLoading();
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
              if (data.isUnlocked !== undefined) {
                setIsUnlocked(data.isUnlocked);
              }
              if (data.lockedBankDetails) {
                setLockedBankDetails(data.lockedBankDetails);
                setAccountHolderName(data.lockedBankDetails.accountHolder || '');
                setBankName(data.lockedBankDetails.bankName || '');
                setAccountNumber(data.lockedBankDetails.bankAccount || '');
                setIfscCode(data.lockedBankDetails.ifsc || '');
              } else {
                setLockedBankDetails(null);
              }
            } else {
              localStorage.removeItem('vb_local_user');
              setUser(null);
              setView(isSupportSubdomain ? 'auth' : 'home');
            }
            finishLoading();
          })
          .catch(e => {
            console.error("Validation failed, falling back to local:", e);
            setUser(parsed);
            setView('dashboard');
            finishLoading();
          });
        return;
      } catch (e) {
        console.error("Error loading local user session:", e);
        setView(prev => prev === 'dashboard' ? 'home' : prev);
      }
    } else {
      setView(prev => prev === 'dashboard' ? 'home' : prev);
    }
    finishLoading();
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
        if (withdrawableBalance < totalCost) {
          alert(`Insufficient withdrawable balance. Referral rewards cannot be used for buying elements. You need ₹${totalCost.toFixed(2)} but only have ₹${withdrawableBalance.toFixed(2)} withdrawable balance. Please add funds.`);
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

    if (authRole === 'support') {
      try {
        const response = await fetchWithTimeout(`${VITE_BACKEND_URL}/api/auth/support/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password
          })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Invalid support credentials');
        }

        const localUser = { 
          email: data.executive.email, 
          uid: 'exec-user-' + data.executive.id, 
          displayName: data.executive.name,
          isExecutive: true,
          role: data.executive.role,
          id: data.executive.id
        };
        localStorage.setItem('vb_jwt_token', data.token);
        localStorage.setItem('vb_local_user', JSON.stringify(localUser));
        setUser(localUser);
        setLoading(true);
        setView('support-dashboard');
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      } catch (error) {
        alert(error.message);
      } finally {
        setOtpSending(false);
      }
      return;
    }

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
      setLoading(true);
      setView('dashboard');
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.warn("DB Auth login failed, checking fallback:", error.message);
      // Hardcoded fallback for Super Admin check if backend is not reachable / DB fails (for development safety)
      if (authForm.email.toLowerCase() === 'sandeepkumar.pikili@vrpigroup.co.in' && authForm.password === 'Psk@300707') {
        const localUser = { email: 'sandeepkumar.pikili@vrpigroup.co.in', uid: 'admin-super-uid', displayName: 'Super Admin' };
        localStorage.setItem('vb_local_user', JSON.stringify(localUser));
        setUser(localUser);
        setLoading(true);
        setView('dashboard');
        setTimeout(() => {
          setLoading(false);
        }, 2000);
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

    const emailLower = authForm.email.trim().toLowerCase();
    if (!emailLower.endsWith('@gmail.com')) {
      alert("Please enter a valid email ID.");
      return;
    }

    setOtpSending(true);

    try {
      const response = await fetchWithTimeout(`${VITE_BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: authForm.email,
          referralCode: authForm.referralCode
        })
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
          phone: authForm.phone,
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
        phone: data.user.phone || authForm.phone || '',
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
                type: 'referral',
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
    setView(isSupportSubdomain ? 'auth' : 'home');
  };


  const fetchUserChatHistory = async () => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      if (!token) return;
      const res = await fetch(`${VITE_BACKEND_URL}/api/user/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        const mapped = data.messages.map(msg => ({
          sender: msg.sender === 'user' ? 'user' : 'bot',
          text: msg.text,
          createdAt: msg.createdAt
        }));
        setChatHistory(mapped);
      }
    } catch (err) {
      console.error("Error loading support history:", err);
    }
  };

  useEffect(() => {
    if (isChatOpen && user && !user.isExecutive) {
      fetchUserChatHistory();
      const interval = setInterval(fetchUserChatHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen, user]);

  const handleRequestCallback = async () => {
    try {
      const token = localStorage.getItem('vb_jwt_token');
      if (!token) {
        alert("Please log in to request a callback.");
        return;
      }
      const res = await fetch(`${VITE_BACKEND_URL}/api/user/call-request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      alert("Error requesting callback: " + err.message);
    }
  };

  // --- Chat Drawer Interactions ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatMessage('');

    try {
      const token = localStorage.getItem('vb_jwt_token');
      if (token && user && !user.isExecutive) {
        await fetch(`${VITE_BACKEND_URL}/api/user/chats/send`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: userMsg })
        });
        fetchUserChatHistory();
      } else {
        // Fallback to local bot if not logged in (e.g. guest viewing home page)
        setTimeout(() => {
          let reply = "Thank you for reaching out. Please sign in to connect with a support executive.";
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
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
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
          <h2>Unlocking Your Meta Vault...</h2>
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
          <div className="container admin-header-nav">
            <div className="logo-section" onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <div>
                <InvesthourLogoText customStyle={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', display: 'block' }} />
                <span style={{ fontSize: '10px', color: '#f43f5e', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Super Admin Console</span>
              </div>
            </div>

            <div className="admin-header-right">
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

            {/* Metric 5 - Platform Profit from Client Trades */}
            <div style={{ background: '#120524', border: '1px solid rgba(217,175,86,0.15)', padding: '20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
              <div style={{ background: 'rgba(217, 175, 86, 0.12)', color: '#d9af56', padding: '12px', borderRadius: '10px', flexShrink: 0 }}>
                <TrendingUp size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: '#9c93a8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Profit Received from Clients</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#d9af56' }}>
                  ₹{platformProfit.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#9c93a8' }}>
                    Fees: <span style={{ color: '#10b981', fontWeight: 700 }}>₹{platformProfit.totalFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </span>
                  <span style={{ fontSize: '11px', color: '#9c93a8' }}>
                    GST: <span style={{ color: '#f59e0b', fontWeight: 700 }}>₹{platformProfit.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </span>
                  <span style={{ fontSize: '11px', color: '#9c93a8' }}>
                    {platformProfit.tradeCount} <span style={{ color: '#9c93a8' }}>trades</span>
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Admin Tabs Toggle */}
          <div className="admin-tabs-toggle">
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
            <button 
              type="button"
              onClick={() => setAdminTab('withdrawals')}
              style={{
                background: adminTab === 'withdrawals' ? '#f43f5e' : 'transparent',
                color: '#ffffff',
                border: '1px solid',
                borderColor: adminTab === 'withdrawals' ? '#f43f5e' : 'rgba(255,255,255,0.15)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              💰 Withdrawal Requests
            </button>
            <button 
              type="button"
              onClick={() => setAdminTab('support')}
              style={{
                background: adminTab === 'support' ? '#f43f5e' : 'transparent',
                color: '#ffffff',
                border: '1px solid',
                borderColor: adminTab === 'support' ? '#f43f5e' : 'rgba(255,255,255,0.15)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              🎧 Customer Service
            </button>
          </div>

          {/* Customer Service Management Tab */}
          {adminTab === 'support' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fade-in 0.3s ease-out' }}>
              {/* Header & Refresh */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>🎧 Customer Service Directory</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9c93a8' }}>Manage call & chat support executives, shifts, salaries, and performance reviews.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setExecForm({
                        name: '',
                        phone: '',
                        email: '',
                        role: 'Chat',
                        salary: '',
                        status: 'Active',
                        shift: 'Day',
                        languages: 'English, Hindi',
                        rating: '5.0',
                        experienceYrs: '0'
                      });
                      setShowAddExecModal(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', border: 'none', color: '#ffffff',
                      padding: '10px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 12px rgba(244, 63, 94, 0.2)'
                    }}
                  >
                    ➕ Add Executive
                  </button>
                  <button
                    type="button"
                    onClick={fetchExecutives}
                    disabled={fetchingExecutives}
                    style={{
                      background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff',
                      padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                      cursor: fetchingExecutives ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      opacity: fetchingExecutives ? 0.6 : 1, transition: 'all 0.2s'
                    }}
                  >
                    {fetchingExecutives ? '⟳ Refreshing...' : '↻ Refresh'}
                  </button>
                </div>
              </div>

              {/* KPI Summary Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {/* Metric 1 */}
                <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', fontSize: '20px' }}>👥</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 500 }}>Total Executives</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>{executives.length}</div>
                  </div>
                </div>
                {/* Metric 2 */}
                <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '20px' }}>🟢</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 500 }}>Active Support</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>{executives.filter(e => e.status === 'Active').length}</div>
                  </div>
                </div>
                {/* Metric 3 */}
                <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '20px' }}>💳</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 500 }}>Monthly Payroll</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                      ₹{executives.reduce((acc, curr) => acc + (curr.salary || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
                {/* Metric 4 */}
                <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(217, 175, 86, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d9af56', fontSize: '20px' }}>⭐</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 500 }}>Average Rating</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                      {executives.length > 0 ? (executives.reduce((acc, curr) => acc + (curr.rating || 0), 0) / executives.length).toFixed(1) : '5.0'} / 5.0
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Grid/Table */}
              <div style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px' }}>
                {fetchingExecutives ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9c93a8' }}>Loading support executives...</div>
                ) : executives.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9c93a8' }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎧</div>
                    <div>No customer service staff registered yet. Click "+ Add Executive" to register support staff.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9c93a8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800 }}>
                          <th style={{ padding: '12px 10px' }}>Executive Details</th>
                          <th style={{ padding: '12px 10px' }}>Role</th>
                          <th style={{ padding: '12px 10px' }}>Shift</th>
                          <th style={{ padding: '12px 10px' }}>Monthly Salary</th>
                          <th style={{ padding: '12px 10px' }}>Performance & Experience</th>
                          <th style={{ padding: '12px 10px' }}>Status</th>
                          <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executives.map((ex) => {
                          const ratingVal = ex.rating || 5.0;
                          const perfLabel = ratingVal >= 4.5 ? 'Outstanding' :
                                            ratingVal >= 4.0 ? 'Good' :
                                            ratingVal >= 3.0 ? 'Average' : 'Underperforming';
                          const perfColor = ratingVal >= 4.5 ? '#10b981' :
                                            ratingVal >= 4.0 ? '#3b82f6' :
                                            ratingVal >= 3.0 ? '#f59e0b' : '#f43f5e';
                          const perfBg = ratingVal >= 4.5 ? 'rgba(16,185,129,0.15)' :
                                         ratingVal >= 4.0 ? 'rgba(59,130,246,0.15)' :
                                         ratingVal >= 3.0 ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)';

                          const roleBg = ex.role === 'Chat' ? 'rgba(16,185,129,0.1)' :
                                         ex.role === 'Call' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)';
                          const roleColor = ex.role === 'Chat' ? '#10b981' :
                                            ex.role === 'Call' ? '#3b82f6' : '#8b5cf6';

                          return (
                            <tr key={ex.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }} className="client-directory-row">
                              <td style={{ padding: '14px 10px' }}>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>{ex.name}</div>
                                <div style={{ fontSize: '11px', color: '#9c93a8', marginTop: '2px' }}>
                                  {ex.email || 'No Email'} • {ex.phone || 'No Phone'}
                                </div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                                  🗣️ Speaks: {ex.languages}
                                </div>
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', background: roleBg, color: roleColor }}>
                                  {ex.role} Support
                                </span>
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>
                                  ☀️ {ex.shift} Shift
                                </span>
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff' }}>
                                  ₹{(ex.salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#d9af56' }}>★ {ratingVal.toFixed(1)}</span>
                                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', padding: '3px 6px', borderRadius: '4px', background: perfBg, color: perfColor }}>
                                    {perfLabel}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#9c93a8', marginTop: '4px' }}>{ex.experienceYrs} Yrs Experience</div>
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleExecStatus(ex)}
                                  style={{
                                    border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
                                    fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                                    color: ex.status === 'Active' ? '#10b981' : '#f43f5e'
                                  }}
                                >
                                  ● {ex.status}
                                </button>
                              </td>
                              <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingExecId(ex.id);
                                      setExecForm({
                                        name: ex.name,
                                        phone: ex.phone || '',
                                        email: ex.email || '',
                                        role: ex.role,
                                        salary: ex.salary.toString(),
                                        status: ex.status,
                                        shift: ex.shift,
                                        languages: ex.languages,
                                        rating: ex.rating.toString(),
                                        experienceYrs: ex.experienceYrs.toString()
                                      });
                                      setShowEditExecModal(true);
                                    }}
                                    style={{
                                      padding: '5px 10px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.15)',
                                      background: 'rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteExecutive(ex.id, ex.name)}
                                    style={{
                                      padding: '5px 10px', fontSize: '11px', border: '1px solid #f43f5e',
                                      background: 'rgba(244,63,94,0.1)', color: '#f43f5e', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Executive Modal Overlay */}
          {showAddExecModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, animation: 'fade-in 0.2s ease-out'
            }}>
              <div style={{
                background: '#120524', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%',
                maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>➕ Register Support Executive</h3>
                  <button type="button" onClick={() => setShowAddExecModal(false)} style={{ background: 'transparent', border: 'none', color: '#9c93a8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>
                <form onSubmit={handleAddExecutive} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Name field */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Name *</label>
                    <input type="text" required value={execForm.name} onChange={e => setExecForm({...execForm, name: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                  </div>
                  {/* Phone & Email Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Phone</label>
                      <input type="text" value={execForm.phone} onChange={e => setExecForm({...execForm, phone: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Email</label>
                      <input type="email" value={execForm.email} onChange={e => setExecForm({...execForm, email: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                  </div>
                  {/* Role & Shift Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Role *</label>
                      <select value={execForm.role} onChange={e => setExecForm({...execForm, role: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }}>
                        <option value="Chat">Chat</option>
                        <option value="Call">Call</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Shift *</label>
                      <select value={execForm.shift} onChange={e => setExecForm({...execForm, shift: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }}>
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                        <option value="Rotational">Rotational</option>
                      </select>
                    </div>
                  </div>
                  {/* Salary & Experience Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Monthly Salary (₹) *</label>
                      <input type="number" required value={execForm.salary} onChange={e => setExecForm({...execForm, salary: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Experience (Yrs)</label>
                      <input type="number" value={execForm.experienceYrs} onChange={e => setExecForm({...execForm, experienceYrs: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                  </div>
                  {/* Languages & Rating Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Languages</label>
                      <input type="text" value={execForm.languages} onChange={e => setExecForm({...execForm, languages: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Initial Rating (1-5) *</label>
                      <input type="number" step="0.1" min="1.0" max="5.0" required value={execForm.rating} onChange={e => setExecForm({...execForm, rating: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="button" onClick={() => setShowAddExecModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', border: 'none', color: '#ffffff', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Executive Modal Overlay */}
          {showEditExecModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, animation: 'fade-in 0.2s ease-out'
            }}>
              <div style={{
                background: '#120524', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%',
                maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>✏️ Edit Support Executive</h3>
                  <button type="button" onClick={() => { setShowEditExecModal(false); setEditingExecId(null); }} style={{ background: 'transparent', border: 'none', color: '#9c93a8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>
                <form onSubmit={handleUpdateExecutive} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Name field */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Name *</label>
                    <input type="text" required value={execForm.name} onChange={e => setExecForm({...execForm, name: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                  </div>
                  {/* Phone & Email Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Phone</label>
                      <input type="text" value={execForm.phone} onChange={e => setExecForm({...execForm, phone: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Email</label>
                      <input type="email" value={execForm.email} onChange={e => setExecForm({...execForm, email: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                  </div>
                  {/* Role & Shift Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Role *</label>
                      <select value={execForm.role} onChange={e => setExecForm({...execForm, role: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }}>
                        <option value="Chat">Chat</option>
                        <option value="Call">Call</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Shift *</label>
                      <select value={execForm.shift} onChange={e => setExecForm({...execForm, shift: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }}>
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                        <option value="Rotational">Rotational</option>
                      </select>
                    </div>
                  </div>
                  {/* Salary & Experience Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Monthly Salary (₹) *</label>
                      <input type="number" required value={execForm.salary} onChange={e => setExecForm({...execForm, salary: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Experience (Yrs)</label>
                      <input type="number" value={execForm.experienceYrs} onChange={e => setExecForm({...execForm, experienceYrs: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                  </div>
                  {/* Languages & Rating Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Languages</label>
                      <input type="text" value={execForm.languages} onChange={e => setExecForm({...execForm, languages: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Rating (1-5) *</label>
                      <input type="number" step="0.1" min="1.0" max="5.0" required value={execForm.rating} onChange={e => setExecForm({...execForm, rating: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }} />
                    </div>
                  </div>
                  {/* Status Selection */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#9c93a8', fontWeight: 600 }}>Status *</label>
                    <select value={execForm.status} onChange={e => setExecForm({...execForm, status: e.target.value})} style={{ background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', fontSize: '14px' }}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="button" onClick={() => { setShowEditExecModal(false); setEditingExecId(null); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', border: 'none', color: '#ffffff', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Main Content Workspace Split */}
          {adminTab === 'clients' && (
            <div className="admin-grid-layout">
            
            {/* Left Side: Client Roster list (7 Cols) */}
            <div className="admin-col-7" style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <div className="admin-col-5" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                    
                    <div className="admin-kyc-actions">
                      {inspectedClient.kycStatus !== 'Verified' && (
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
                      )}
                      {inspectedClient.kycStatus !== 'Rejected' && (
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
                      )}
                      {inspectedClient.kycStatus !== 'Pending' && (
                        <button 
                          onClick={async () => {
                            try {
                              const res = await fetch(`${VITE_BACKEND_URL}/api/admin/kyc/update`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: inspectedClient.id.replace('CUST-', ''), status: 'Pending' })
                              });
                              if (!res.ok) throw new Error('Update failed');
                              const updated = clients.map(c => {
                                if (c.id === inspectedClient.id) {
                                  return { ...c, kycStatus: 'Pending', kycRejectionReason: null };
                                }
                                return c;
                              });
                              setClients(updated);
                              localStorage.setItem('vb_clients', JSON.stringify(updated));
                            } catch (e) {
                              alert('Failed to reset KYC status.');
                            }
                          }}
                          style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Reset to Pending
                        </button>
                      )}
                    </div>
                  </div>

                  {inspectedClient.kycDocument ? (
                    <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block', marginBottom: '6px' }}>Uploaded Verification File:</span>
                      <div className="kyc-file-preview">
                        <div className="kyc-file-details">
                          <FileText size={16} className="kyc-upload-icon" style={{ margin: 0 }} />
                          <div className="kyc-file-info" style={{ textAlign: 'left' }}>
                            <span className="kyc-file-name" style={{ fontSize: '12px', color: '#ffffff', wordBreak: 'break-all' }}>{inspectedClient.kycDocument.fileName}</span>
                            <span className="kyc-file-size" style={{ fontSize: '10px', color: '#9c93a8' }}>{inspectedClient.kycDocument.type} • {inspectedClient.kycDocument.uploadedAt}</span>
                          </div>
                        </div>
                        <div className="admin-kyc-file-actions">
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
                          
                          <button 
                            onClick={() => {
                              document.getElementById('admin-kyc-replace-input').click();
                            }}
                            style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#a855f7', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'; }}
                          >
                            Replace
                          </button>
                          
                          <button 
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to delete this user's KYC document? This will clear it from the database.")) return;
                              try {
                                const res = await fetch(`${VITE_BACKEND_URL}/api/admin/kyc/delete`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: inspectedClient.id.replace('CUST-', '') })
                                });
                                if (!res.ok) throw new Error('Delete failed');
                                const updated = clients.map(c => {
                                  if (c.id === inspectedClient.id) {
                                    return { ...c, kycDocument: null, kycStatus: 'Pending', kycRejectionReason: null };
                                  }
                                  return c;
                                });
                                setClients(updated);
                                localStorage.setItem('vb_clients', JSON.stringify(updated));
                                alert("Document deleted successfully.");
                              } catch (e) {
                                alert("Failed to delete document.");
                              }
                            }}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#9c93a8', display: 'block', marginBottom: '6px' }}>No verification document uploaded.</span>
                      <button 
                        onClick={() => {
                          document.getElementById('admin-kyc-replace-input').click();
                        }}
                        style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={12} /> Upload / Add Document
                      </button>
                    </div>
                  )}

                  <input 
                    type="file" 
                    id="admin-kyc-replace-input" 
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        alert("File size exceeds 5MB limit.");
                        return;
                      }
                      
                      const reader = new FileReader();
                      reader.onload = async () => {
                        try {
                          const base64Data = reader.result;
                          const res = await fetch(`${VITE_BACKEND_URL}/api/admin/kyc/replace`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId: inspectedClient.id.replace('CUST-', ''),
                              document: base64Data,
                              fileName: file.name,
                              fileType: file.type
                            })
                          });
                          if (!res.ok) throw new Error('Replacement failed');
                          
                          const updated = clients.map(c => {
                            if (c.id === inspectedClient.id) {
                              return { 
                                ...c, 
                                kycStatus: 'Submitted', 
                                kycDocument: {
                                  type: file.type,
                                  fileName: file.name,
                                  fileSize: 'Uploaded',
                                  uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                                  fileData: base64Data
                                },
                                kycRejectionReason: null
                              };
                            }
                            return c;
                          });
                          setClients(updated);
                          localStorage.setItem('vb_clients', JSON.stringify(updated));
                          alert("Document uploaded/replaced successfully.");
                        } catch (err) {
                          alert("Failed to upload/replace document.");
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />

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
                  
                  <div className="admin-ledger-adjuster-row">
                    <div className="admin-ledger-adjuster-group">
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

                    <div className="admin-ledger-adjuster-group">
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
                        <strong style={{ fontSize: '13px', color: tx.type === 'buy' ? '#a855f7' : tx.type === 'sell' ? '#d9af56' : tx.type === 'deposit' ? '#10b981' : tx.type === 'referral' ? '#38a3fd' : tx.type === 'refund' ? '#10b981' : '#f43f5e' }}>
                          {tx.type === 'deposit' ? 'Added Funds' : tx.type === 'referral' ? 'Referral Bonus' : tx.type === 'refund' ? 'Refund (Rejected)' : tx.type === 'withdrawal' ? 'Withdrew Cash' : tx.type === 'buy' ? `Bought ${getAssetLabel(tx.asset)}` : `Sold ${getAssetLabel(tx.asset)}`}
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
            <div className="admin-grid-layout">
              {/* Left Column: Contest Roster */}
              <div className="admin-col-7" style={{ background: '#120524', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                                      const total = prompt("Enter total Trades completed:", p.total_trades);
                                      const profit = prompt("Enter profitable Trades:", p.profit_trades);
                                      const loss = prompt("Enter losing Trades:", p.loss_trades);
                                      if (total !== null && profit !== null && loss !== null) {
                                        const rate = total > 0 ? ((profit / total) * 100).toFixed(2) : '0.00';
                                        handleAdminUpdateContestant(p.email, {
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
                          <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#9c93a8' }}>
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

          {/* Withdrawal Requests Tab */}
          {adminTab === 'withdrawals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fade-in 0.3s ease-out' }}>
              {/* Header & Refresh */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>💰 Withdrawal Requests</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9c93a8' }}>Review and approve or reject client payout requests.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={exportPendingToExcelAndClear}
                    disabled={fetchingWithdrawals || adminWithdrawals.filter(w => w.status === 'processing').length === 0}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#ffffff',
                      padding: '10px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                      cursor: (fetchingWithdrawals || adminWithdrawals.filter(w => w.status === 'processing').length === 0) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      opacity: (fetchingWithdrawals || adminWithdrawals.filter(w => w.status === 'processing').length === 0) ? 0.6 : 1, transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    📥 Export Pending & Clear
                  </button>
                  <button
                    type="button"
                    onClick={fetchAdminWithdrawals}
                    disabled={fetchingWithdrawals}
                    style={{
                      background: '#1e0b36', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff',
                      padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                      cursor: fetchingWithdrawals ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      opacity: fetchingWithdrawals ? 0.6 : 1, transition: 'all 0.2s'
                    }}
                  >
                    {fetchingWithdrawals ? '⟳ Refreshing...' : '↻ Refresh'}
                  </button>
                </div>
              </div>

              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Pending (Processing)', value: adminWithdrawals.filter(w => w.status === 'processing').length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                  { label: 'Approved (Successful)', value: adminWithdrawals.filter(w => w.status === 'successful').length, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                  { label: 'Rejected (Failed)', value: adminWithdrawals.filter(w => w.status === 'failed').length, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
                  { label: 'Total Amount (₹)', value: `₹${adminWithdrawals.reduce((a, w) => a + (w.amount || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: '#d9af56', bg: 'rgba(217,175,86,0.1)' },
                ].map((metric, i) => (
                  <div key={i} style={{ background: '#120524', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ background: metric.bg, borderRadius: '10px', padding: '10px 14px', fontSize: '20px', fontWeight: 800, color: metric.color }}>
                      {metric.value}
                    </div>
                    <span style={{ fontSize: '12px', color: '#9c93a8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{metric.label}</span>
                  </div>
                ))}
              </div>

              {/* Withdrawal Requests Table */}
              <div style={{ background: '#120524', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>All Withdrawal Requests</h3>
                {fetchingWithdrawals ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9c93a8' }}>Loading withdrawal requests...</div>
                ) : adminWithdrawals.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9c93a8', fontSize: '14px' }}>
                    No withdrawal requests found. Requests will appear here when clients submit them.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9c93a8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800 }}>
                          <th style={{ padding: '12px 10px' }}>Client</th>
                          <th style={{ padding: '12px 10px' }}>Amount</th>
                          <th style={{ padding: '12px 10px' }}>Method</th>
                          <th style={{ padding: '12px 10px' }}>Payout ID</th>
                          <th style={{ padding: '12px 10px' }}>Date</th>
                          <th style={{ padding: '12px 10px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminWithdrawals.map((wd) => {
                          const isPending = wd.status === 'processing';
                          const isSuccess = wd.status === 'successful';
                          const isFailed = wd.status === 'failed';
                          const methodLabel = wd.paymentMethod === 'upi_withdrawal' ? 'UPI (Live)' :
                                             wd.paymentMethod === 'upi_withdrawal_sim' ? 'UPI (Simulated)' :
                                             wd.paymentMethod === 'bank_withdrawal' ? 'Bank (Live)' :
                                             wd.paymentMethod === 'bank_withdrawal_sim' ? 'Bank (Simulated)' : wd.paymentMethod;
                          return (
                            <tr
                              key={wd.id}
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                              className="client-directory-row"
                            >
                               <td style={{ padding: '14px 10px' }}>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>{wd.user?.name || wd.user?.email?.split('@')[0]}</div>
                                <div style={{ fontSize: '11px', color: '#9c93a8', marginTop: '2px' }}>{wd.user?.email}</div>
                                {wd.availableBalanceAfter !== null && wd.availableBalanceAfter !== undefined && (
                                  <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
                                    Bal After: ₹{wd.availableBalanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <div style={{ fontWeight: 800, fontSize: '16px', color: isPending ? '#f59e0b' : isSuccess ? '#10b981' : '#f43f5e' }}>
                                  ₹{wd.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <span style={{ fontSize: '12px', color: '#d9af56', fontWeight: 600 }}>{methodLabel}</span>
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <span style={{ fontSize: '11px', color: '#9c93a8', fontFamily: 'monospace' }}>{wd.orderId}</span>
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <span style={{ fontSize: '12px', color: '#9c93a8' }}>
                                  {new Date(wd.createdAt).toISOString().slice(0, 16).replace('T', ' ')}
                                </span>
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <span style={{
                                  fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px',
                                  background: isPending ? 'rgba(245,158,11,0.15)' : isSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                                  color: isPending ? '#f59e0b' : isSuccess ? '#10b981' : '#f43f5e',
                                  letterSpacing: '0.5px'
                                }}>
                                  {isPending ? 'Processing' : isSuccess ? 'Approved' : 'Rejected'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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

  if (view === 'support-dashboard') {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLog = execProfile?.attendance?.find(log => log.date === todayStr);
    const isClockedIn = !!todayLog;
    const isClockedOut = !!(todayLog && todayLog.clockOut);

    return (
      <div id="root" className="dashboard-page-view admin-dashboard animate-fade-in" style={{ background: '#f8f9fa', color: '#111827', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
        {/* Support Portal Header */}
        <header className="header" style={{ borderBottom: 'none', background: '#110b24', padding: '16px 30px' }}>
          <div className="container nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'linear-gradient(90deg, #e8b84b, #f5d78e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Investhour</span>
                  <span style={{ fontSize: '20px' }}>📈</span>
                  <span style={{ fontSize: '20px' }}>⏳</span>
                </div>
                <div style={{ fontSize: '11px', background: 'linear-gradient(90deg, #f87171, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: '2px' }}>Support Executive Portal</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', background: 'rgba(139, 92, 246, 0.25)', color: '#a78bfa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  <User size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>{execProfile?.name || 'Support Agent'}</div>
                  <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 500 }}>{execProfile?.role} Support • {execProfile?.shift} Shift</div>
                </div>
              </div>
              <button 
                className="btn-sec-signout" 
                onClick={handleSignOut} 
                style={{ background: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', fontWeight: 600 }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main style={{ flex: 1, padding: '24px 30px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
          
          {/* Left Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Profile Card */}
            <div style={{ background: 'linear-gradient(145deg, #7c3aed, #6366f1)', padding: '24px 20px', borderRadius: '16px', textAlign: 'center', color: '#ffffff', position: 'relative', boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px' }}>
                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                  <User size={40} color="#ffffff" />
                </div>
                <div style={{ position: 'absolute', bottom: '0', right: '-10px', background: '#dcfce7', color: '#16a34a', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', border: '2px solid #6366f1' }}>
                  Online
                </div>
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>{execProfile?.name}</h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{execProfile?.email}</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ★ {execProfile?.rating ? execProfile.rating.toFixed(1) : '5.0'} Rating
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)' }}>
                  {execProfile?.experienceYrs} YRS EXP
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Globe size={14} /> Speaks: {execProfile?.languages || 'English'}
              </div>
            </div>

            {/* Navigation Menu */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              {[
                { key: 'dashboard', icon: <Home size={18} />, label: 'Dashboard' },
                { key: 'callbacks', icon: <Phone size={18} />, label: 'Callback Requests' },
                { key: 'deposits', icon: <CreditCard size={18} />, label: 'Manual Deposits' },
                { key: 'attendance', icon: <Calendar size={18} />, label: 'Shift Attendance' },
                { key: 'chats', icon: <MessageSquare size={18} />, label: 'Client Threads' },
                { key: 'reports', icon: <BarChart2 size={18} />, label: 'Reports' },
                { key: 'settings', icon: <Settings size={18} />, label: 'Settings' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setExecTab(item.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    marginBottom: '4px', transition: 'all 0.2s',
                    background: execTab === item.key ? '#f3e8ff' : 'transparent',
                    color: execTab === item.key ? '#6d28d9' : '#4b5563',
                    fontWeight: execTab === item.key ? 600 : 500,
                    fontSize: '14px'
                  }}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>

            {/* Recent Logs Card */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#4f46e5', fontWeight: 700, fontSize: '14px' }}>
                <History size={16} /> Recent Logs
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#111827', fontSize: '14px', marginBottom: '4px' }}>{todayLog?.date || todayStr}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {todayLog?.clockIn ? new Date(todayLog.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} - {todayLog?.clockOut ? new Date(todayLog.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                  </div>
                </div>
                <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
                  {todayLog?.status || 'No Log'}
                </span>
              </div>
              <button style={{ width: '100%', padding: '10px', background: '#f9fafb', color: '#4f46e5', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                View All Logs
              </button>
            </div>
          </div>

          {/* Right Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ===== FULL-PAGE SHIFT ATTENDANCE TAB ===== */}
            {execTab === 'attendance' && (() => {
              const now = realTimeClock;
              const shiftStart = new Date(now); shiftStart.setHours(9, 0, 0, 0);
              const shiftEnd = new Date(now); shiftEnd.setHours(18, 0, 0, 0);
              const totalMs = shiftEnd - shiftStart;
              const elapsedMs = Math.max(0, Math.min(now - shiftStart, totalMs));
              const pct = Math.round((elapsedMs / totalMs) * 100);
              const hrsWorked = Math.floor(elapsedMs / 3600000);
              const minsWorked = Math.floor((elapsedMs % 3600000) / 60000);
              const secsWorked = Math.floor((elapsedMs % 60000) / 1000);
              const remainMs = Math.max(0, totalMs - elapsedMs);
              const remH = Math.floor(remainMs / 3600000);
              const remM = Math.floor((remainMs % 3600000) / 60000);
              const remS = Math.floor((remainMs % 60000) / 1000);
              // Break time = tea breaks (30min) + lunch (60min) = 90min
              const breakMs = 90 * 60 * 1000;
              const workMs = Math.max(0, elapsedMs - Math.min(elapsedMs, breakMs));
              const workH = Math.floor(workMs / 3600000);
              const workM = Math.floor((workMs % 3600000) / 60000);
              const breakH = Math.floor(Math.min(elapsedMs, breakMs) / 3600000);
              const breakM = Math.floor((Math.min(elapsedMs, breakMs) % 3600000) / 60000);
              const estEnd = new Date(isClockedIn && todayLog?.clockIn ? new Date(todayLog.clockIn).getTime() + 9 * 3600000 : shiftEnd);
              const startedAt = todayLog?.clockIn ? new Date(todayLog.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--';
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Shift Progress Card */}
                  <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #f0f0f5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#eef0ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrendingUp size={20} color="#6366f1" />
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Shift Progress</div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Track your shift time and tasks</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#6366f1' }}>{hrsWorked}h {minsWorked}m {secsWorked}s / 9h</div>
                        <div style={{ fontSize: '13px', color: '#6366f1', fontWeight: 600, marginTop: '2px' }}>{pct}% Complete</div>
                      </div>
                    </div>

                    {/* Progress bar with floating tooltip */}
                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                      <div style={{ position: 'absolute', left: `calc(${Math.min(pct, 97)}% - 18px)`, top: '-32px', background: '#6366f1', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', zIndex: 2 }}>
                        {pct}%
                        <div style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #6366f1' }}></div>
                      </div>
                      <div style={{ width: '100%', height: '12px', background: '#e0e7ff', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '99px', transition: 'width 0.5s ease' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                        <div style={{ width: '28px', height: '28px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={14} color="#6b7280" /></div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>Started at</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{startedAt}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>Estimated End</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{estEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        </div>
                        <div style={{ width: '28px', height: '28px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={14} color="#6b7280" /></div>
                      </div>
                    </div>
                  </div>

                  {/* Today's Timeline */}
                  <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #f0f0f5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>Today's Timeline</div>
                      <button style={{ background: '#f8f9fe', border: '1px solid #e0e7ff', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} /> View Full Schedule
                      </button>
                    </div>

                    {/* Segments definition */}
                    {(() => {
                      const segs = [
                        { label: 'Work Block 1', start: '9:00 AM',  end: '11:00 AM', dur: '2h 00m',  color: '#6366f1', bg: '#eef0ff', flex: 2,    type: 'work'  },
                        { label: 'Tea Break',    start: '11:00 AM', end: '11:15 AM', dur: '15m',     color: '#f59e0b', bg: '#fef3c7', flex: 0.25,  type: 'tea'   },
                        { label: 'Work Block 2', start: '11:15 AM', end: '1:00 PM',  dur: '1h 45m',  color: '#6366f1', bg: '#eef0ff', flex: 1.75,  type: 'work'  },
                        { label: 'Lunch Break',  start: '1:00 PM',  end: '2:00 PM',  dur: '1h 00m',  color: '#10b981', bg: '#dcfce7', flex: 1,     type: 'lunch' },
                        { label: 'Work Block 3', start: '2:00 PM',  end: '4:00 PM',  dur: '2h 00m',  color: '#6366f1', bg: '#eef0ff', flex: 2,     type: 'work'  },
                        { label: 'Tea Break',    start: '4:00 PM',  end: '4:15 PM',  dur: '15m',     color: '#f59e0b', bg: '#fef3c7', flex: 0.25,  type: 'tea'   },
                        { label: 'Work Block 4', start: '4:15 PM',  end: '6:00 PM',  dur: '1h 45m',  color: '#6366f1', bg: '#eef0ff', flex: 1.75,  type: 'work'  },
                      ];
                      const totalFlex = segs.reduce((a, s) => a + s.flex, 0);
                      return (
                        <div>
                          {/* Colored bar */}
                          <div style={{ display: 'flex', height: '12px', borderRadius: '99px', overflow: 'hidden', marginBottom: '0px' }}>
                            {segs.map((s, i) => (
                              <div key={i} style={{ flex: s.flex, background: s.color, borderRadius: i === 0 ? '99px 0 0 99px' : i === segs.length - 1 ? '0 99px 99px 0' : '0' }} />
                            ))}
                          </div>

                          {/* Dot + time ruler row */}
                          <div style={{ display: 'flex', marginTop: '6px', marginBottom: '12px' }}>
                            {segs.map((s, i) => (
                              <div key={i} style={{ flex: s.flex, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${s.color}44`, marginTop: '0px' }}></div>
                                  <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap' }}>{s.start}</div>
                                </div>
                              </div>
                            ))}
                            {/* End dot */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', border: '2px solid #fff', boxShadow: '0 0 0 2px #f43f5e44' }}></div>
                              <div style={{ fontSize: '9px', color: '#f43f5e', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap' }}>6:00 PM</div>
                            </div>
                          </div>

                          {/* Segment detail cards */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {segs.map((s, i) => {
                              const isTea = s.type === 'tea';
                              return (
                                <div key={i} style={{
                                  flex: s.flex,
                                  minWidth: isTea ? '92px' : '0',
                                  background: s.bg,
                                  border: `1px solid ${s.color}55`,
                                  borderRadius: '10px',
                                  padding: isTea ? '7px 8px' : '8px 10px',
                                  overflow: 'hidden',
                                  flexShrink: isTea ? 0 : 1,
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                                    <span style={{ fontSize: '12px' }}>{isTea ? '☕' : s.type === 'lunch' ? '🍽️' : '🖥️'}</span>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: s.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.start} – {s.end}</div>
                                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>{s.dur}</div>
                                </div>
                              );
                            })}
                            {/* Shift End pill */}
                            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '12px' }}>🏁</span>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#e11d48', whiteSpace: 'nowrap' }}>Shift End</div>
                              <div style={{ fontSize: '10px', color: '#e11d48', fontWeight: 600 }}>6:00 PM</div>
                            </div>
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                  {/* 4 Stat Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {/* Work Time */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', background: '#eef0ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Briefcase size={20} color="#6366f1" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Work Time</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{workH}h {workM < 10 ? '0'+workM : workM}m</div>
                        <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, marginTop: '2px' }}>{Math.round((workMs / totalMs) * 100)}% of shift</div>
                      </div>
                    </div>
                    {/* Break Time */}
                    <div style={{ background: '#fffbeb', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', background: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <RefreshCw size={20} color="#f59e0b" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Break Time</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309', lineHeight: 1.1 }}>{breakH}h {breakM < 10 ? '0'+breakM : breakM}m</div>
                        <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>{Math.round((Math.min(elapsedMs, breakMs) / totalMs) * 100)}% of shift</div>
                      </div>
                    </div>
                    {/* Remaining Time */}
                    <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', background: '#dcfce7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={20} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remaining Time</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{remH}h {remM < 10 ? '0'+remM : remM}m {remS < 10 ? '0'+remS : remS}s</div>
                        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>{100 - pct}% of shift</div>
                      </div>
                    </div>
                    {/* Shift Status */}
                    <div style={{ background: '#f8f9fe', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e0e7ff', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', background: '#eef0ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Shield size={20} color="#6366f1" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#4338ca', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shift Status</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#4f46e5', lineHeight: 1.1 }}>
                          {isClockedIn ? (isClockedOut ? 'Ended' : 'Active') : 'Idle'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, marginTop: '2px' }}>
                          {isClockedIn ? (isClockedOut ? 'Shift complete' : 'On duty now') : 'Not clocked in'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clock In / Clock Out */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button
                      onClick={handleClockIn}
                      disabled={isClockedIn}
                      style={{ background: isClockedIn ? '#f3f4f6' : '#f0f0ff', color: isClockedIn ? '#9ca3af' : '#4f46e5', border: `1.5px solid ${isClockedIn ? '#e5e7eb' : '#c7d2fe'}`, padding: '18px 24px', borderRadius: '14px', fontWeight: 700, fontSize: '16px', cursor: isClockedIn ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: isClockedIn ? 'none' : '0 4px 12px rgba(99,102,241,0.15)' }}
                    >
                      <LogOut size={18} style={{ transform: 'scaleX(-1)' }} /> Clock In
                    </button>
                    <button
                      onClick={handleClockOut}
                      disabled={!isClockedIn || isClockedOut}
                      style={{ background: (!isClockedIn || isClockedOut) ? '#f3f4f6' : '#fff1f2', color: (!isClockedIn || isClockedOut) ? '#9ca3af' : '#e11d48', border: `1.5px solid ${(!isClockedIn || isClockedOut) ? '#e5e7eb' : '#fecdd3'}`, padding: '18px 24px', borderRadius: '14px', fontWeight: 700, fontSize: '16px', cursor: (!isClockedIn || isClockedOut) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: (!isClockedIn || isClockedOut) ? 'none' : '0 4px 12px rgba(225,29,72,0.15)' }}
                    >
                      <LogOut size={18} /> Clock Out
                    </button>
                  </div>

                  {/* In / Out / Status Footer */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f0f0f5', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr' }}>
                    <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#f0fdf4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={18} color="#16a34a" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>In Time</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a' }}>{todayLog?.clockIn ? new Date(todayLog.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                      </div>
                    </div>
                    <div style={{ background: '#f0f0f5' }}></div>
                    <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#fff1f2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={18} color="#e11d48" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>Out Time</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#e11d48' }}>{todayLog?.clockOut ? new Date(todayLog.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                      </div>
                    </div>
                    <div style={{ background: '#f0f0f5' }}></div>
                    <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#eef0ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} color="#6366f1" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>Status</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#6366f1' }}>{todayLog?.status || 'On Time'}</div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Top Row: Callbacks & Deposits - shown on dashboard */}
            {execTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Callback Request Queue (Dashboard only) */}
              {execTab === 'dashboard' && (
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={24} />
                  </div>
                  <div style={{ width: '40px', height: '40px', background: '#ffffff', color: '#8b5cf6', borderRadius: '50%', border: '2px solid #f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PhoneCall size={20} />
                  </div>
                </div>
                <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Callback Request Queue</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  {callRequests.length} <span style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280', textTransform: 'none' }}>Pending</span>
                </div>
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0', padding: 0 }}></div>
                
                {callRequests.length > 0 ? (
                  <div style={{ display: 'grid', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {callRequests.map(req => (
                      <div key={req.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{req.userName}</div>
                          <div style={{ fontSize: '11px', color: '#4f46e5', marginTop: '2px', fontWeight: 600 }}>{req.phone}</div>
                          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{req.userEmail}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {req.status === 'Pending' ? (
                            <button onClick={() => handleUpdateCallStatus(req.id, 'Connected')} style={{ background: '#10b981', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>Connect</button>
                          ) : (
                            <button onClick={() => handleUpdateCallStatus(req.id, 'Closed')} style={{ background: '#f43f5e', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>End Call</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                    <CheckCircle2 size={16} color="#10b981" /> No callback requests in queue. Staff is up to date!
                  </div>
                )}
              </div>
              )}

              {/* Pending Manual Deposits */}
              {execTab === 'dashboard' && (
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#e0f2fe', color: '#0ea5e9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={24} />
                  </div>
                  <div style={{ width: '40px', height: '40px', background: '#ffffff', color: '#3b82f6', borderRadius: '12px', border: '2px solid #e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} />
                  </div>
                </div>
                <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Pending Manual Deposits</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  {pendingDeposits.length} <span style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280', textTransform: 'none' }}>Pending</span>
                </div>
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0', padding: 0 }}></div>
                
                {pendingDeposits.length > 0 ? (
                  <div style={{ display: 'grid', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {pendingDeposits.map(dep => (
                      <div key={dep.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: '#10b981' }}>₹{dep.amount.toLocaleString()}</div>
                          <div style={{ fontSize: '10px', color: '#6b7280' }}>{new Date(dep.createdAt).toLocaleString()}</div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#374151' }}>UTR: <span style={{ color: '#8b5cf6', fontFamily: 'monospace', fontWeight: 700 }}>{dep.utrNumber}</span></div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>User: {dep.user?.email}</div>
                        {dep.screenshotUrl && (
                          <div style={{ marginTop: '4px' }}>
                            <a href={`${VITE_BACKEND_URL}${dep.screenshotUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '11px', textDecoration: 'underline', fontWeight: 600 }}>View Screenshot</a>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button onClick={() => handleDepositAction(dep.id, 'approve')} style={{ flex: 1, background: '#10b981', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => handleDepositAction(dep.id, 'reject')} style={{ flex: 1, background: '#f43f5e', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                    <CheckCircle2 size={16} color="#10b981" /> No pending deposits to review.
                  </div>
                )}
              </div>
              )}
            </div>
            )}

            {/* Middle Row: Attendance & Chat Threads */}
            {(execTab === 'dashboard' || execTab === 'attendance' || execTab === 'chats' || execTab === 'callbacks' || execTab === 'deposits') && (
            <div style={{ display: 'grid', gridTemplateColumns: (execTab === 'attendance' || execTab === 'chats' || execTab === 'callbacks' || execTab === 'deposits') ? '1fr' : '1fr 2fr', gap: '24px' }}>
              
              {/* Shift Attendance - Full width on dashboard (same design as attendance tab) */}
              {execTab === 'dashboard' && (() => {
                const now = realTimeClock;
                const shiftStart = new Date(now); shiftStart.setHours(9, 0, 0, 0);
                const shiftEnd = new Date(now); shiftEnd.setHours(18, 0, 0, 0);
                const totalMs = shiftEnd - shiftStart;
                const elapsedMs = Math.max(0, Math.min(now - shiftStart, totalMs));
                const pct = Math.round((elapsedMs / totalMs) * 100);
                const hrsWorked = Math.floor(elapsedMs / 3600000);
                const minsWorked = Math.floor((elapsedMs % 3600000) / 60000);
                const secsWorked = Math.floor((elapsedMs % 60000) / 1000);
                const remainMs = Math.max(0, totalMs - elapsedMs);
                const remH = Math.floor(remainMs / 3600000);
                const remM = Math.floor((remainMs % 3600000) / 60000);
                const remS = Math.floor((remainMs % 60000) / 1000);
                const breakMs = 90 * 60 * 1000;
                const workMs = Math.max(0, elapsedMs - Math.min(elapsedMs, breakMs));
                const workH = Math.floor(workMs / 3600000);
                const workM = Math.floor((workMs % 3600000) / 60000);
                const breakH = Math.floor(Math.min(elapsedMs, breakMs) / 3600000);
                const breakM = Math.floor((Math.min(elapsedMs, breakMs) % 3600000) / 60000);
                const estEnd = new Date(isClockedIn && todayLog?.clockIn ? new Date(todayLog.clockIn).getTime() + 9 * 3600000 : shiftEnd);
                const startedAt = todayLog?.clockIn ? new Date(todayLog.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--';
                const segs = [
                  { label: 'Work Block 1', start: '9:00 AM',  end: '11:00 AM', dur: '2h 00m', color: '#6366f1', bg: '#eef0ff', flex: 2,    type: 'work'  },
                  { label: 'Tea Break',    start: '11:00 AM', end: '11:15 AM', dur: '15m',    color: '#f59e0b', bg: '#fef3c7', flex: 0.25,  type: 'tea'   },
                  { label: 'Work Block 2', start: '11:15 AM', end: '1:00 PM',  dur: '1h 45m', color: '#6366f1', bg: '#eef0ff', flex: 1.75,  type: 'work'  },
                  { label: 'Lunch Break', start: '1:00 PM',  end: '2:00 PM',  dur: '1h 00m', color: '#10b981', bg: '#dcfce7', flex: 1,     type: 'lunch' },
                  { label: 'Work Block 3', start: '2:00 PM',  end: '4:00 PM',  dur: '2h 00m', color: '#6366f1', bg: '#eef0ff', flex: 2,     type: 'work'  },
                  { label: 'Tea Break',    start: '4:00 PM',  end: '4:15 PM',  dur: '15m',    color: '#f59e0b', bg: '#fef3c7', flex: 0.25,  type: 'tea'   },
                  { label: 'Work Block 4', start: '4:15 PM',  end: '6:00 PM',  dur: '1h 45m', color: '#6366f1', bg: '#eef0ff', flex: 1.75,  type: 'work'  },
                ];
                return (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Row 1: Shift Progress + Today's Timeline side by side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px' }}>

                      {/* Shift Progress Card */}
                      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f5', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', background: '#eef0ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <TrendingUp size={18} color="#6366f1" />
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Shift Progress</div>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isClockedIn ? (isClockedOut ? '#fff1f2' : '#f0fdf4') : '#f9fafb', color: isClockedIn ? (isClockedOut ? '#e11d48' : '#16a34a') : '#6b7280', border: `1px solid ${isClockedIn ? (isClockedOut ? '#fecdd3' : '#bbf7d0') : '#e5e7eb'}`, fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isClockedIn ? (isClockedOut ? '#e11d48' : '#16a34a') : '#9ca3af', display: 'inline-block' }}></span>
                                {isClockedIn ? (isClockedOut ? 'Shift Ended' : 'On Duty') : 'Off Duty'}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#6366f1' }}>{hrsWorked}h {minsWorked}m {secsWorked}s</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>of 9h · {pct}% done</div>
                          </div>
                        </div>

                        {/* Progress bar with tooltip */}
                        <div style={{ position: 'relative', paddingTop: '22px' }}>
                          <div style={{ position: 'absolute', left: `calc(${Math.min(pct, 95)}% - 16px)`, top: '0px', background: '#6366f1', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '5px', whiteSpace: 'nowrap', zIndex: 2 }}>
                            {pct}%
                            <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #6366f1' }}></div>
                          </div>
                          <div style={{ width: '100%', height: '10px', background: '#e0e7ff', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '99px', transition: 'width 0.5s ease' }}></div>
                          </div>
                        </div>

                        {/* Start / End */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <div><div style={{ color: '#9ca3af', fontWeight: 600 }}>Started at</div><div style={{ color: '#111827', fontWeight: 700, fontSize: '13px' }}>{startedAt}</div></div>
                          <div style={{ textAlign: 'right' }}><div style={{ color: '#9ca3af', fontWeight: 600 }}>Estimated End</div><div style={{ color: '#111827', fontWeight: 700, fontSize: '13px' }}>{estEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div></div>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid #f3f4f6' }}></div>

                        {/* Clock In / Out buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <button onClick={handleClockIn} disabled={isClockedIn} style={{ background: isClockedIn ? '#f3f4f6' : '#f0f0ff', color: isClockedIn ? '#9ca3af' : '#4f46e5', border: `1.5px solid ${isClockedIn ? '#e5e7eb' : '#c7d2fe'}`, padding: '10px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: isClockedIn ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                            <LogOut size={14} style={{ transform: 'scaleX(-1)' }} /> Clock In
                          </button>
                          <button onClick={handleClockOut} disabled={!isClockedIn || isClockedOut} style={{ background: (!isClockedIn || isClockedOut) ? '#f3f4f6' : '#fff1f2', color: (!isClockedIn || isClockedOut) ? '#9ca3af' : '#e11d48', border: `1.5px solid ${(!isClockedIn || isClockedOut) ? '#e5e7eb' : '#fecdd3'}`, padding: '10px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: (!isClockedIn || isClockedOut) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                            <LogOut size={14} /> Clock Out
                          </button>
                        </div>

                        {/* In / Out / Status footer */}
                        {todayLog && (
                          <div style={{ background: '#f8f9fa', borderRadius: '10px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 12px', border: '1px solid #f0f0f5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle2 size={13} color="#16a34a" />
                              <div><div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>In</div><div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>{todayLog.clockIn ? new Date(todayLog.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div></div>
                            </div>
                            <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Activity size={13} color="#e11d48" />
                              <div><div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>Out</div><div style={{ fontSize: '11px', fontWeight: 700, color: '#e11d48' }}>{todayLog.clockOut ? new Date(todayLog.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}</div></div>
                            </div>
                            <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Shield size={13} color="#6366f1" />
                              <div><div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>Status</div><div style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1' }}>{todayLog?.status || 'On Time'}</div></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Today's Timeline Card */}
                      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Today's Timeline</div>
                          <button style={{ background: '#f8f9fe', border: '1px solid #e0e7ff', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={12} /> View Full Schedule
                          </button>
                        </div>

                        {/* Colored bar */}
                        <div style={{ display: 'flex', height: '12px', borderRadius: '99px', overflow: 'hidden', marginBottom: '0' }}>
                          {segs.map((s, i) => (
                            <div key={i} style={{ flex: s.flex, background: s.color, borderRadius: i === 0 ? '99px 0 0 99px' : i === segs.length - 1 ? '0 99px 99px 0' : '0' }} />
                          ))}
                        </div>

                        {/* Dot + time ruler */}
                        <div style={{ display: 'flex', marginTop: '6px', marginBottom: '12px' }}>
                          {segs.map((s, i) => (
                            <div key={i} style={{ flex: s.flex, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${s.color}44` }}></div>
                                <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap' }}>{s.start}</div>
                              </div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', border: '2px solid #fff', boxShadow: '0 0 0 2px #f43f5e44' }}></div>
                            <div style={{ fontSize: '9px', color: '#f43f5e', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap' }}>6:00 PM</div>
                          </div>
                        </div>

                        {/* Segment cards */}
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {segs.map((s, i) => {
                            const isTea = s.type === 'tea';
                            return (
                              <div key={i} style={{ flex: s.flex, minWidth: isTea ? '90px' : '0', background: s.bg, border: `1px solid ${s.color}55`, borderRadius: '8px', padding: isTea ? '6px 8px' : '7px 9px', overflow: 'hidden', flexShrink: isTea ? 0 : 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                                  <span style={{ fontSize: '11px' }}>{isTea ? '☕' : s.type === 'lunch' ? '🍽️' : '🖥️'}</span>
                                  <div style={{ fontSize: '10px', fontWeight: 800, color: s.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                                </div>
                                <div style={{ fontSize: '9px', color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.start} – {s.end}</div>
                                <div style={{ fontSize: '9px', color: '#9ca3af' }}>{s.dur}</div>
                              </div>
                            );
                          })}
                          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '7px 9px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px' }}>🏁</span>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#e11d48', whiteSpace: 'nowrap' }}>Shift End</div>
                            <div style={{ fontSize: '9px', color: '#e11d48', fontWeight: 600 }}>6:00 PM</div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid #f3f4f6', margin: '14px 0 12px' }}></div>

                        {/* 4 stat mini cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                          <div style={{ background: '#f8f9fe', borderRadius: '10px', padding: '10px', border: '1px solid #e0e7ff', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Work</div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#4f46e5', lineHeight: 1.1 }}>{workH}h {workM < 10 ? '0'+workM : workM}m</div>
                            <div style={{ fontSize: '9px', color: '#6366f1', fontWeight: 600 }}>{Math.round((workMs / totalMs) * 100)}% of shift</div>
                          </div>
                          <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '10px', border: '1px solid #fde68a', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Break</div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#b45309', lineHeight: 1.1 }}>{breakH}h {breakM < 10 ? '0'+breakM : breakM}m</div>
                            <div style={{ fontSize: '9px', color: '#d97706', fontWeight: 600 }}>{Math.round((Math.min(elapsedMs, breakMs) / totalMs) * 100)}% of shift</div>
                          </div>
                          <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Remaining</div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{remH}h {remM < 10 ? '0'+remM : remM}m {remS < 10 ? '0'+remS : remS}s</div>
                            <div style={{ fontSize: '9px', color: '#10b981', fontWeight: 600 }}>{100 - pct}% of shift</div>
                          </div>
                          <div style={{ background: '#f8f9fe', borderRadius: '10px', padding: '10px', border: '1px solid #e0e7ff', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#4338ca', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#4f46e5', lineHeight: 1.1 }}>{isClockedIn ? (isClockedOut ? 'Ended' : 'Active') : 'Idle'}</div>
                            <div style={{ fontSize: '9px', color: '#6366f1', fontWeight: 600 }}>{isClockedIn ? (isClockedOut ? 'Shift complete' : 'On duty') : 'Not clocked in'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}



              {/* ================= CALLBACK REQUESTS PAGE ================= */}
              {execTab === 'callbacks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Callback Requests</h2>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Manage and track all customer callback requests</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button style={{ background: '#ffffff', border: '1px solid #f0f0f5', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Calendar size={15} color="#9ca3af" /> 17 Jun 2026
                      </button>
                      <button style={{ background: '#ffffff', border: '1px solid #f0f0f5', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Download size={15} color="#9ca3af" /> Export Report
                      </button>
                    </div>
                  </div>

                  {/* Top KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                    {/* Total Requests */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#f5f3ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}><PhoneCall size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Total Requests</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>248</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}><span style={{ color: '#10b981' }}>↑ 18%</span> vs yesterday</div>
                      </div>
                    </div>
                    {/* Pending */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}><Clock size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Pending</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>42</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}><span style={{ color: '#3b82f6' }}>↑ 12%</span> vs yesterday</div>
                      </div>
                    </div>
                    {/* Completed */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#fffbeb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}><Phone size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Completed</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>186</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}><span style={{ color: '#10b981' }}>↑ 10%</span> vs yesterday</div>
                      </div>
                    </div>
                    {/* Answered */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#ecfdf5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}><CheckCircle2 size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Answered</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>152</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}><span style={{ color: '#10b981' }}>↑ 14%</span> vs yesterday</div>
                      </div>
                    </div>
                    {/* Missed */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#fff1f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', flexShrink: 0 }}><PhoneMissed size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Missed</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>34</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}><span style={{ color: '#e11d48' }}>↓ 5%</span> vs yesterday</div>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid: Data Table and Sidebar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
                    
                    {/* Data Table Column */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                      {/* Filters Row */}
                      <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f5', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1 1 200px' }}>
                          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                          <input type="text" placeholder="Search by name, phone number..." style={{ width: '100%', padding: '10px 10px 10px 36px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
                        </div>
                        <div style={{ position: 'relative', flex: '0 0 140px' }}>
                          <select style={{ width: '100%', padding: '10px 30px 10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', appearance: 'none', color: '#4b5563', fontWeight: 600 }}>
                            <option>All Status</option>
                          </select>
                          <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: '12px', top: '11px', pointerEvents: 'none' }} />
                        </div>
                        <div style={{ position: 'relative', flex: '0 0 140px' }}>
                          <select style={{ width: '100%', padding: '10px 30px 10px 14px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', appearance: 'none', color: '#4b5563', fontWeight: 600 }}>
                            <option>All Priority</option>
                          </select>
                          <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: '12px', top: '11px', pointerEvents: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
                          17 Jun 2026 <span style={{ color: '#9ca3af' }}>-</span> 17 Jun 2026
                        </div>
                        <button style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <Filter size={14} color="#7c3aed" /> Filter
                        </button>
                      </div>

                      {/* Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #f0f0f5' }}>
                              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Customer Details</th>
                              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Preferred Time</th>
                              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Request Time</th>
                              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Status</th>
                              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Priority</th>
                              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Assigned To</th>
                              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Row 1 */}
                            <tr style={{ borderBottom: '1px solid #f0f0f5' }}>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>RA</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Ramesh Agarwal</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>+91 98765 43210</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>02:00 PM - 03:00 PM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>11:15 AM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>Completed</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#e11d48', background: '#fff1f2', padding: '4px 10px', borderRadius: '20px' }}>High</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>Shiva prasad</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Phone size={14} /></button>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={14} /></button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Row 2 */}
                            <tr style={{ borderBottom: '1px solid #f0f0f5' }}>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>PS</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Priya Sharma</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>+91 91234 56789</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>01:00 PM - 02:00 PM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>10:48 AM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '20px' }}>Pending</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '4px 10px', borderRadius: '20px' }}>Medium</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Unassigned</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Phone size={14} /></button>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={14} /></button>
                                </div>
                              </td>
                            </tr>

                            {/* Row 3 */}
                            <tr style={{ borderBottom: '1px solid #f0f0f5' }}>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>AK</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Amit Kumar</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>+91 98887 66554</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>04:00 PM - 05:00 PM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>10:30 AM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>Answered</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>Low</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>Anjali Verma</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Phone size={14} /></button>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={14} /></button>
                                </div>
                              </td>
                            </tr>

                            {/* Row 4 */}
                            <tr style={{ borderBottom: '1px solid #f0f0f5' }}>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>SS</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Sunita Singh</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>+91 94444 33221</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>03:00 PM - 04:00 PM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>09:57 AM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#e11d48', background: '#fff1f2', padding: '4px 10px', borderRadius: '20px' }}>Missed</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '4px 10px', borderRadius: '20px' }}>Medium</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>Shiva prasad</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Phone size={14} /></button>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={14} /></button>
                                </div>
                              </td>
                            </tr>

                            {/* Row 5 */}
                            <tr style={{ borderBottom: '1px solid #f0f0f5' }}>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ffedd5', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>VB</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Vikram Bansal</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>+91 90000 11122</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>11:00 AM - 12:00 PM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>09:20 AM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '20px' }}>Pending</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#e11d48', background: '#fff1f2', padding: '4px 10px', borderRadius: '20px' }}>High</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Unassigned</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Phone size={14} /></button>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={14} /></button>
                                </div>
                              </td>
                            </tr>

                            {/* Row 6 */}
                            <tr style={{ borderBottom: '1px solid #f0f0f5' }}>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>NK</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Neha Kapoor</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>+91 88776 54321</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>05:00 PM - 06:00 PM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>08:45 AM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>Completed</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>Low</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>Anjali Verma</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Phone size={14} /></button>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={14} /></button>
                                </div>
                              </td>
                            </tr>

                            {/* Row 7 */}
                            <tr>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>DG</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Deepak Gupta</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>+91 77665 44332</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>12:00 PM - 01:00 PM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/> 17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>08:10 AM</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>Answered</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '4px 10px', borderRadius: '20px' }}>Medium</span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>Shiva prasad</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Phone size={14} /></button>
                                  <button style={{ width: '28px', height: '28px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination Footer */}
                      <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Showing 1 to 7 of 248 entries</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button style={{ width: '32px', height: '32px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                            <button style={{ width: '32px', height: '32px', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#ffffff', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>1</button>
                            <button style={{ width: '32px', height: '32px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#4b5563', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>2</button>
                            <button style={{ width: '32px', height: '32px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#4b5563', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>3</button>
                            <button style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', color: '#9ca3af', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>...</button>
                            <button style={{ width: '32px', height: '32px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#4b5563', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>36</button>
                            <button style={{ width: '32px', height: '32px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={16} /></button>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <select style={{ padding: '8px 30px 8px 12px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', color: '#4b5563', fontWeight: 600, appearance: 'none' }}>
                              <option>10 / page</option>
                            </select>
                            <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: '10px', top: '10px', pointerEvents: 'none' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar Analytics Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Callback Overview Donut Chart */}
                      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #f0f0f5' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: 800, color: '#111827' }}>Callback Overview (Today)</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{ width: '130px', height: '130px', position: 'relative' }}>
                            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f0f0f5" strokeWidth="18" />
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.17)} strokeLinecap="butt" /> {/* Pending 17% */}
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f43f5e" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.14)} strokeLinecap="butt" style={{ transform: 'rotate(61.2deg)', transformOrigin: 'center' }} /> {/* Missed 14% */}
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.75)} strokeLinecap="butt" style={{ transform: 'rotate(111.6deg)', transformOrigin: 'center' }} /> {/* Completed 75% */}
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#fbbf24" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.20)} strokeLinecap="butt" style={{ transform: 'rotate(18deg)', transformOrigin: 'center' }} /> {/* Yellow segment from mockup */}
                            </svg>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>248</div>
                              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>Total</div>
                            </div>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Completed</div>
                              <div style={{ color: '#111827' }}>186 (75%)</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> Pending</div>
                              <div style={{ color: '#111827' }}>42 (17%)</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }}></span> Missed</div>
                              <div style={{ color: '#111827' }}>34 (14%)</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }}></span> Answered</div>
                              <div style={{ color: '#111827' }}>152 (61%)</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Response Time Gauge */}
                      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #f0f0f5' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: 800, color: '#111827' }}>Response Time (Avg.)</h3>
                        <div style={{ position: 'relative', height: '110px', display: 'flex', justifyContent: 'center' }}>
                          <svg viewBox="0 0 200 100" style={{ width: '200px' }}>
                            <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="#f3f4f6" strokeWidth="12" strokeLinecap="round" />
                            <path d="M 20 90 A 80 80 0 0 1 140 30" fill="none" stroke="#7c3aed" strokeWidth="12" strokeLinecap="round" />
                          </svg>
                          <div style={{ position: 'absolute', bottom: '15px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>01m 24s</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginTop: '4px' }}>Average Response Time</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid #f0f0f5', paddingTop: '16px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Best</div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>32s</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Average</div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#7c3aed' }}>01m 24s</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Worst</div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#e11d48' }}>05m 16s</div>
                          </div>
                        </div>
                      </div>

                      {/* Peak Callback Hours Line Chart */}
                      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #f0f0f5' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: 800, color: '#111827' }}>Peak Callback Hours</h3>
                        <div style={{ height: '140px', position: 'relative', marginTop: '10px' }}>
                          <svg viewBox="0 0 400 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                            {/* Grid Lines */}
                            <line x1="0" y1="0" x2="400" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                            <line x1="0" y1="40" x2="400" y2="40" stroke="#f3f4f6" strokeWidth="1" />
                            <line x1="0" y1="80" x2="400" y2="80" stroke="#f3f4f6" strokeWidth="1" />
                            <line x1="0" y1="120" x2="400" y2="120" stroke="#f3f4f6" strokeWidth="1" />
                            
                            {/* Y Axis Labels */}
                            <text x="-10" y="5" fontSize="10" fill="#9ca3af" fontWeight="600" textAnchor="end">60</text>
                            <text x="-10" y="45" fontSize="10" fill="#9ca3af" fontWeight="600" textAnchor="end">40</text>
                            <text x="-10" y="85" fontSize="10" fill="#9ca3af" fontWeight="600" textAnchor="end">20</text>
                            <text x="-10" y="125" fontSize="10" fill="#9ca3af" fontWeight="600" textAnchor="end">0</text>

                            {/* X Axis Labels */}
                            <text x="0" y="140" fontSize="10" fill="#9ca3af" fontWeight="600" textAnchor="middle">6 AM</text>
                            <text x="66" y="140" fontSize="10" fill="#9ca3af" fontWeight="600" textAnchor="middle">9 AM</text>
                            <text x="133" y="140" fontSize="10" fill="#9ca3af" fontWeight="600" textAnchor="middle">12 PM</text>
                            <text x="200" y="140" fontSize="10" fill="#9ca3af" fontWeight="600" textAnchor="middle">3 PM</text>
                            <text x="266" y="140" fontSize="10" fill="#9ca3af" fontWeight="600" textAnchor="middle">6 PM</text>
                            <text x="333" y="140" fontSize="10" fill="#9ca3af" fontWeight="600" textAnchor="middle">9 PM</text>
                            
                            {/* Area Fill */}
                            <linearGradient id="gradientCall" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                            </linearGradient>
                            <path d="M 0 110 L 33 105 L 66 70 L 100 65 L 133 65 L 166 40 L 200 65 L 233 50 L 266 80 L 300 110 L 333 115 L 333 120 L 0 120 Z" fill="url(#gradientCall)" />
                            
                            {/* Line */}
                            <path d="M 0 110 L 33 105 L 66 70 L 100 65 L 133 65 L 166 40 L 200 65 L 233 50 L 266 80 L 300 110 L 333 115" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" />
                            
                            {/* Data Points */}
                            <circle cx="66" cy="70" r="3" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
                            <circle cx="166" cy="40" r="3" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
                            <circle cx="233" cy="50" r="3" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
                          </svg>

                          {/* Tooltip Mock */}
                          <div style={{ position: 'absolute', top: '-15px', left: '166px', transform: 'translateX(-50%)', background: '#ffffff', border: '1px solid #f0f0f5', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', zIndex: 10 }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#111827', textAlign: 'center' }}>3 PM</div>
                            <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>48 Requests</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* ================= MANUAL DEPOSITS PAGE ================= */}
              {execTab === 'deposits' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Manual Deposits</h2>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Review and manage all manual deposit requests</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button style={{ background: '#ffffff', border: '1px solid #f0f0f5', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Upload size={15} color="#4f46e5" /> Upload Statement
                      </button>
                      <button style={{ background: '#4f46e5', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}>
                        <Plus size={15} /> Add Manual Deposit
                      </button>
                    </div>
                  </div>

                  {/* Top KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                    {/* Total Requests */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#f5f3ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}><Activity size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Total Requests</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '2px 0' }}>128</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> 18% vs yesterday</div>
                      </div>
                    </div>
                    {/* Pending */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}><Clock size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Pending</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '2px 0' }}>26</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> 12% vs yesterday</div>
                      </div>
                    </div>
                    {/* Approved */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#fdf4ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}><CheckCircle2 size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Approved</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '2px 0' }}>86</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> 15% vs yesterday</div>
                      </div>
                    </div>
                    {/* Rejected */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}><AlertCircle size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Rejected</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '2px 0' }}>12</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingDown size={12} /> 5% vs yesterday</div>
                      </div>
                    </div>
                    {/* Total Amount */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#fdf2f8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', flexShrink: 0 }}><CreditCard size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Total Amount</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '2px 0' }}>₹ 18,74,560</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> 20% vs yesterday</div>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid: Table (2fr) + Sidebar (1fr) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    
                    {/* Left Column: Filters + Table */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                      
                      {/* Filter Bar */}
                      <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f5', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                          <input type="text" placeholder="Search by name, email, transaction ID..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <select style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#4b5563', outline: 'none', cursor: 'pointer', background: '#fff' }}>
                          <option>All Status</option>
                          <option>Pending</option>
                          <option>Approved</option>
                          <option>Rejected</option>
                        </select>
                        <select style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#4b5563', outline: 'none', cursor: 'pointer', background: '#fff' }}>
                          <option>All Payment Methods</option>
                          <option>UPI</option>
                          <option>Bank Transfer</option>
                          <option>Net Banking</option>
                          <option>Wallet</option>
                        </select>
                        <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#fff' }}>
                          17 Jun 2026 - 17 Jun 2026 <Calendar size={14} color="#9ca3af" />
                        </div>
                        <button style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#f3f4f6', color: '#4f46e5', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <Filter size={14} /> Filter
                        </button>
                      </div>

                      {/* Data Table */}
                      <div style={{ padding: '0 20px', overflowX: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', borderBottom: '1px solid #f0f0f5' }}>
                          <CreditCard size={18} color="#4f46e5" />
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>Deposit Requests</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>Customer Details</th>
                              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>Transaction ID</th>
                              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>Amount</th>
                              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>Payment Method</th>
                              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>Requested On</th>
                              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>Status</th>
                              <th style={{ textAlign: 'center', padding: '12px 0', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Row 1 */}
                            <tr>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>RA</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Ramesh Agarwal</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>ramesh@gmail.com</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>+91 98765 43210</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 500, color: '#4b5563', borderBottom: '1px solid #f9fafb' }}>TXN1234567890</td>
                              <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600, color: '#111827', borderBottom: '1px solid #f9fafb' }}>₹ 25,000</td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}><span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>UPI</span></td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>11:15 AM</div>
                              </td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}><span style={{ background: '#eff6ff', color: '#3b82f6', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>Pending</span></td>
                              <td style={{ padding: '16px 0', textAlign: 'center', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4f46e5' }}><Eye size={14} /></button>
                                  <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af' }}><MoreVertical size={14} /></button>
                                </div>
                              </td>
                            </tr>
                            {/* Row 2 */}
                            <tr>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>PS</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Priya Sharma</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>priya.sharma@gmail.com</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>+91 91234 56789</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 500, color: '#4b5563', borderBottom: '1px solid #f9fafb' }}>TXN1234567891</td>
                              <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600, color: '#111827', borderBottom: '1px solid #f9fafb' }}>₹ 15,500</td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}><span style={{ background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>Bank Transfer</span></td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>10:48 AM</div>
                              </td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}><span style={{ background: '#ecfdf5', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>Approved</span></td>
                              <td style={{ padding: '16px 0', textAlign: 'center', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4f46e5' }}><Eye size={14} /></button>
                                  <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af' }}><MoreVertical size={14} /></button>
                                </div>
                              </td>
                            </tr>
                            {/* Row 3 */}
                            <tr>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>AK</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Amit Kumar</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>amit.kumar@gmail.com</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>+91 99887 66554</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 500, color: '#4b5563', borderBottom: '1px solid #f9fafb' }}>TXN1234567892</td>
                              <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600, color: '#111827', borderBottom: '1px solid #f9fafb' }}>₹ 8,750</td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}><span style={{ background: '#ecfdf5', color: '#10b981', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>Net Banking</span></td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>10:30 AM</div>
                              </td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}><span style={{ background: '#ecfdf5', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>Approved</span></td>
                              <td style={{ padding: '16px 0', textAlign: 'center', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4f46e5' }}><Eye size={14} /></button>
                                  <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af' }}><MoreVertical size={14} /></button>
                                </div>
                              </td>
                            </tr>
                            {/* Row 4 */}
                            <tr>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>SS</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Sunita Singh</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>sunita.singh@gmail.com</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>+91 94444 33221</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 500, color: '#4b5563', borderBottom: '1px solid #f9fafb' }}>TXN1234567893</td>
                              <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600, color: '#111827', borderBottom: '1px solid #f9fafb' }}>₹ 12,000</td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}><span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>UPI</span></td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>09:57 AM</div>
                              </td>
                              <td style={{ padding: '16px 0', borderBottom: '1px solid #f9fafb' }}><span style={{ background: '#eff6ff', color: '#3b82f6', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>Pending</span></td>
                              <td style={{ padding: '16px 0', textAlign: 'center', borderBottom: '1px solid #f9fafb' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4f46e5' }}><Eye size={14} /></button>
                                  <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af' }}><MoreVertical size={14} /></button>
                                </div>
                              </td>
                            </tr>
                            {/* Row 5 */}
                            <tr>
                              <td style={{ padding: '16px 0', borderBottom: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>VB</div>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Vikram Bansal</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>vikram.bansal@gmail.com</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>+91 90000 11122</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 500, color: '#4b5563', borderBottom: 'none' }}>TXN1234567894</td>
                              <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600, color: '#111827', borderBottom: 'none' }}>₹ 9,300</td>
                              <td style={{ padding: '16px 0', borderBottom: 'none' }}><span style={{ background: '#fff7ed', color: '#ea580c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>Wallet</span></td>
                              <td style={{ padding: '16px 0', borderBottom: 'none' }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>17 Jun 2026</div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>09:20 AM</div>
                              </td>
                              <td style={{ padding: '16px 0', borderBottom: 'none' }}><span style={{ background: '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>Rejected</span></td>
                              <td style={{ padding: '16px 0', textAlign: 'center', borderBottom: 'none' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4f46e5' }}><Eye size={14} /></button>
                                  <button style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af' }}><MoreVertical size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Showing 1 to 5 of 128 entries</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', color: '#9ca3af' }}><ChevronLeft size={16} /></button>
                          <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#4f46e5', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#fff', fontSize: '13px', fontWeight: 600 }}>1</button>
                          <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', color: '#4b5563', fontSize: '13px', fontWeight: 600 }}>2</button>
                          <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', color: '#4b5563', fontSize: '13px', fontWeight: 600 }}>3</button>
                          <div style={{ color: '#9ca3af', margin: '0 4px' }}>...</div>
                          <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', color: '#4b5563', fontSize: '13px', fontWeight: 600 }}>26</button>
                          <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', color: '#4b5563' }}><ChevronRight size={16} /></button>
                        </div>
                        <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#4b5563', outline: 'none', cursor: 'pointer', background: '#fff' }}>
                          <option>5 / page</option>
                        </select>
                      </div>
                    </div>

                    {/* Right Column: Sidebar Analytics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* Amount Summary (Today) */}
                      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>Amount Summary (Today)</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          {/* Donut Chart Mock */}
                          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="6" />
                              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray="67 33" strokeDashoffset="0" />
                              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray="22 78" strokeDashoffset="-67" />
                              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ec4899" strokeWidth="6" strokeDasharray="6 94" strokeDashoffset="-89" />
                              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="6" strokeDasharray="5 95" strokeDashoffset="-95" />
                            </svg>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>₹ 18,74,560</div>
                              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>Total</div>
                            </div>
                          </div>
                          {/* Legend */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4b5563', fontWeight: 600 }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div> Approved
                              </div>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginLeft: '14px', marginTop: '2px' }}>₹ 12,65,000 (67%)</div>
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4b5563', fontWeight: 600 }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div> Pending
                              </div>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginLeft: '14px', marginTop: '2px' }}>₹ 4,12,000 (22%)</div>
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4b5563', fontWeight: 600 }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }}></div> Rejected
                              </div>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginLeft: '14px', marginTop: '2px' }}>₹ 1,20,560 (6%)</div>
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4b5563', fontWeight: 600 }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div> Others
                              </div>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginLeft: '14px', marginTop: '2px' }}>₹ 77,000 (5%)</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Distribution */}
                      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>Payment Method Distribution</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>
                              <span>UPI</span><span>₹ 7,25,000 (39%)</span>
                            </div>
                            <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: '39%', height: '100%', background: '#7c3aed', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>
                              <span>Bank Transfer</span><span>₹ 6,10,000 (33%)</span>
                            </div>
                            <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: '33%', height: '100%', background: '#3b82f6', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>
                              <span>Net Banking</span><span>₹ 3,25,000 (17%)</span>
                            </div>
                            <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: '17%', height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>
                              <span>Wallet</span><span>₹ 1,25,000 (7%)</span>
                            </div>
                            <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: '7%', height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>
                              <span>Others</span><span>₹ 89,560 (4%)</span>
                            </div>
                            <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: '4%', height: '100%', background: '#ef4444', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>Recent Activity</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', marginTop: '5px' }}></div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>Ramesh Agarwal</span> deposit of <span style={{ fontWeight: 600, color: '#111827' }}>₹25,000</span> is pending
                              </div>
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>11:15 AM</div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginTop: '5px' }}></div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>Priya Sharma</span> deposit of <span style={{ fontWeight: 600, color: '#111827' }}>₹15,500</span> approved
                              </div>
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>10:48 AM</div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginTop: '5px' }}></div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>Vikram Bansal</span> deposit of <span style={{ fontWeight: 600, color: '#111827' }}>₹9,300</span> rejected
                              </div>
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>09:20 AM</div>
                          </div>
                        </div>
                        <button style={{ width: '100%', marginTop: '16px', padding: '10px 0', border: '1px solid #e0e7ff', borderRadius: '10px', background: '#f8f9fe', color: '#4f46e5', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>View All Activity</button>
                      </div>

                    </div>
                  </div>
                </div>
              )}


              {/* ================= CLIENT THREADS PAGE ================= */}
              {execTab === 'chats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Client Threads</h2>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Manage and respond to client conversations</p>
                    </div>
                    <div>
                      <button style={{ background: '#ffffff', border: '1px solid #f0f0f5', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                        <Download size={15} /> Export
                      </button>
                    </div>
                  </div>

                  {/* Top KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                    {/* Total Threads */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#f5f3ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}><MessageSquare size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Total Threads</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>186</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}><span style={{ color: '#10b981' }}>↑ 12%</span> vs yesterday</div>
                      </div>
                    </div>
                    {/* Open */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}><MessageSquare size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Open</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>32</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}><span style={{ color: '#10b981' }}>↑ 8%</span> vs yesterday</div>
                      </div>
                    </div>
                    {/* In Progress */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#fffbeb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}><Clock size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>In Progress</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>18</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}><span style={{ color: '#e11d48' }}>↑ 5%</span> vs yesterday</div>
                      </div>
                    </div>
                    {/* Closed */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#ecfdf5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}><CheckCircle2 size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Closed</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>136</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}><span style={{ color: '#10b981' }}>↑ 15%</span> vs yesterday</div>
                      </div>
                    </div>
                    {/* SLA Met */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: '#fff1f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', flexShrink: 0 }}><Star size={22} /></div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>SLA Met</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>92%</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}><span style={{ color: '#10b981' }}>↑ 6%</span> vs yesterday</div>
                      </div>
                    </div>
                  </div>

                  {/* 3-Column Layout */}
                  <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 320px', gap: '20px', alignItems: 'start' }}>
                     {/* Column 1: Thread List */}
                     <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f5' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              All Threads <span style={{ background: '#7c3aed', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>32</span>
                            </div>
                            <button style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', cursor: 'pointer' }}><Filter size={14} /></button>
                          </div>
                          <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                            <input type="text" placeholder="Search threads..." style={{ width: '100%', padding: '10px 10px 10px 36px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: 600 }}>
                            <span style={{ background: '#7c3aed', color: '#ffffff', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer' }}>All 32</span>
                            <span style={{ color: '#6b7280', padding: '4px 4px', cursor: 'pointer' }}>Open <span style={{ color: '#111827' }}>12</span></span>
                            <span style={{ color: '#6b7280', padding: '4px 4px', cursor: 'pointer' }}>In Progress <span style={{ color: '#111827' }}>8</span></span>
                            <span style={{ color: '#6b7280', padding: '4px 4px', cursor: 'pointer' }}>Closed <span style={{ color: '#111827' }}>12</span></span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '600px' }}>
                          {/* Thread 1 (Active) */}
                          <div style={{ padding: '16px 20px', borderLeft: '3px solid #7c3aed', background: '#f9fafb', borderBottom: '1px solid #f0f0f5', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>RA</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>Ramesh Agarwal</div>
                                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>11:42 AM</div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>Issue with gold deposit</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>I have made a payment for gold deposit but...</div>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#e11d48', background: '#fff1f2', padding: '2px 8px', borderRadius: '10px' }}>Open</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Thread 2 */}
                          <div style={{ padding: '16px 20px', borderLeft: '3px solid transparent', borderBottom: '1px solid #f0f0f5', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>PS</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>Priya Sharma</div>
                                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>11:20 AM</div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>Silver purchase not showing</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>I have purchased silver but it's not showing...</div>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: '10px' }}>In Progress</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Thread 3 */}
                          <div style={{ padding: '16px 20px', borderLeft: '3px solid transparent', borderBottom: '1px solid #f0f0f5', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>AK</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>Amit Kumar</div>
                                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>10:58 AM</div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>Withdrawal request</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>I want to withdraw my amount. Please help.</div>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: '10px' }}>Closed</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Thread 4 */}
                          <div style={{ padding: '16px 20px', borderLeft: '3px solid transparent', borderBottom: '1px solid #f0f0f5', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>SS</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>Sunita Singh</div>
                                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>10:45 AM</div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>Account verification</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>Please help me verify my account.</div>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#e11d48', background: '#fff1f2', padding: '2px 8px', borderRadius: '10px' }}>Open</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Thread 5 */}
                          <div style={{ padding: '16px 20px', borderLeft: '3px solid transparent', borderBottom: '1px solid #f0f0f5', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ffedd5', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>VB</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>Vikram Bansal</div>
                                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>10:30 AM</div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>Price difference query</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>Why is there a difference in today's price?</div>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: '10px' }}>In Progress</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
                          <button style={{ width: '100%', background: '#ffffff', border: '1px solid #e9d5ff', color: '#7c3aed', padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>View All Threads</button>
                        </div>
                     </div>

                     {/* Column 2: Chat Interface */}
                     <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
                        {/* Chat Header */}
                        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>RA</div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Ramesh Agarwal
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: '10px' }}>Open</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginTop: '2px' }}>ramesh.agarwal@email.com</div>
                            </div>
                          </div>
                          <button style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><MoreVertical size={20} /></button>
                        </div>

                        {/* Chat History */}
                        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff' }}>
                          <div style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>17 Jun 2026</div>
                          
                          {/* Client Message */}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}><User size={14} /></div>
                            <div style={{ background: '#f3f4f6', padding: '14px 16px', borderRadius: '12px', borderTopLeftRadius: '2px', maxWidth: '75%' }}>
                              <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.5 }}>I have made a payment for gold deposit but it's not showing in my account.</div>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', fontWeight: 600 }}>11:35 AM</div>
                            </div>
                          </div>

                          {/* Agent Message */}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', alignSelf: 'flex-end', flexDirection: 'row-reverse' }}>
                            <div style={{ background: '#f3e8ff', padding: '14px 16px', borderRadius: '12px', borderTopRightRadius: '2px', maxWidth: '75%' }}>
                              <div style={{ fontSize: '13px', color: '#4c1d95', lineHeight: 1.5 }}>Hi Ramesh, I'm checking your payment details. Please allow me a moment.</div>
                              <div style={{ fontSize: '10px', color: '#7c3aed', marginTop: '8px', fontWeight: 600, textAlign: 'right' }}>11:37 AM <Check size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }}/></div>
                            </div>
                          </div>

                          {/* Client Message (System block info) */}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ background: '#f3f4f6', padding: '14px 16px', borderRadius: '12px', borderTopLeftRadius: '2px', maxWidth: '75%' }}>
                              <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.5 }}>
                                Payment ID: TXN1234567890<br/>
                                Amount: ₹25,000<br/>
                                Paid at: 11:33 AM
                              </div>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', fontWeight: 600 }}>11:38 AM</div>
                            </div>
                          </div>

                          {/* Agent Message */}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', alignSelf: 'flex-end', flexDirection: 'row-reverse' }}>
                            <div style={{ background: '#f3e8ff', padding: '14px 16px', borderRadius: '12px', borderTopRightRadius: '2px', maxWidth: '75%' }}>
                              <div style={{ fontSize: '13px', color: '#4c1d95', lineHeight: 1.5 }}>Thank you! I can see the payment is successful. It will reflect in your account within 10 minutes.</div>
                              <div style={{ fontSize: '10px', color: '#7c3aed', marginTop: '8px', fontWeight: 600, textAlign: 'right' }}>11:40 AM <Check size={12} style={{ verticalAlign: 'middle', marginLeft: '4px' }}/></div>
                            </div>
                          </div>

                          {/* Client Message */}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ background: '#f3f4f6', padding: '14px 16px', borderRadius: '12px', borderTopLeftRadius: '2px', maxWidth: '75%' }}>
                              <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.5 }}>Great! Thanks for the quick help.</div>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', fontWeight: 600 }}>11:41 AM</div>
                            </div>
                          </div>
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '20px', borderTop: '1px solid #f0f0f5' }}>
                          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed', paddingBottom: '12px', borderBottom: '2px solid #7c3aed', cursor: 'pointer' }}>Reply</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', paddingBottom: '12px', cursor: 'pointer' }}>Internal Note</div>
                          </div>
                          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                            <textarea placeholder="Type your message..." style={{ width: '100%', border: 'none', padding: '16px', fontSize: '13px', color: '#111827', outline: 'none', resize: 'none', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }}></textarea>
                            <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f9fafb' }}>
                              <div style={{ display: 'flex', gap: '16px', color: '#9ca3af' }}>
                                <Smile size={18} style={{ cursor: 'pointer' }} />
                                <Paperclip size={18} style={{ cursor: 'pointer' }} />
                                <FileText size={18} style={{ cursor: 'pointer' }} />
                              </div>
                              <button style={{ background: '#7c3aed', border: 'none', color: '#ffffff', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)' }}>
                                <Send size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                     </div>

                     {/* Column 3: Thread Details & Actions */}
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Thread Details */}
                        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', padding: '24px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: '0 0 20px 0' }}>Thread Details</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Customer Name</span>
                              <span style={{ color: '#111827', fontWeight: 700 }}>Ramesh Agarwal</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Email</span>
                              <span style={{ color: '#111827', fontWeight: 700 }}>ramesh.agarwal@email.com</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Phone</span>
                              <span style={{ color: '#111827', fontWeight: 700 }}>+91 98765 43210</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Thread ID</span>
                              <span style={{ color: '#111827', fontWeight: 700 }}>#THD-2026-0617-001</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Created On</span>
                              <span style={{ color: '#111827', fontWeight: 700 }}>17 Jun 2026, 11:35 AM</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Last Updated</span>
                              <span style={{ color: '#111827', fontWeight: 700 }}>17 Jun 2026, 11:42 AM</span>
                            </div>
                          </div>
                        </div>

                        {/* Thread Summary */}
                        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', padding: '24px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: '0 0 20px 0' }}>Thread Summary</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Total Messages</span>
                              <span style={{ color: '#111827', fontWeight: 800 }}>6</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>First Response Time</span>
                              <span style={{ color: '#111827', fontWeight: 700 }}>2m 15s</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Last Response Time</span>
                              <span style={{ color: '#111827', fontWeight: 700 }}>1m 30s</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Status</span>
                              <span style={{ color: '#e11d48', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e11d48' }}></span> Open</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Priority</span>
                              <span style={{ color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span> Medium</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Assigned To</span>
                              <span style={{ color: '#111827', fontWeight: 700 }}>Shiva prasad</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', padding: '24px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111827', margin: '0 0 20px 0' }}>Quick Actions</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><CheckCircle2 size={14} /> Resolve Thread</button>
                              <button style={{ flex: 1, background: '#f3e8ff', border: '1px solid #e9d5ff', color: '#7c3aed', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><UserPlus size={14} /> Assign To</button>
                            </div>
                            <button style={{ width: '100%', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><FileText size={14} /> Add Internal Note</button>
                          </div>
                        </div>

                     </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* ================= REPORTS PAGE ================= */}
            {execTab === 'reports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Reports Overview</h2>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Monitor your daily performance and activities</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ background: '#ffffff', border: '1px solid #f0f0f5', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                      <Calendar size={15} /> 17 Jun 2026
                    </button>
                    <button style={{ background: '#ffffff', border: '1px solid #f0f0f5', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                      <Download size={15} /> Download Report
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                  {/* Calls Responded */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#f5f3ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}><Phone size={18} /></div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Calls Responded</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>128</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '4px' }}><span style={{ color: '#7c3aed' }}>↑ 18%</span> vs yesterday</div>
                    </div>
                    <svg style={{ position: 'absolute', bottom: '15px', right: '15px' }} width="60" height="25" viewBox="0 0 60 25" fill="none">
                      <path d="M2 20C10 20 15 5 25 10C35 15 40 20 45 20C50 20 55 5 58 5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  {/* Chats Closed */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#ecfdf5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><MessageSquare size={18} /></div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Chats Closed</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>96</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '4px' }}><span style={{ color: '#10b981' }}>↑ 12%</span> vs yesterday</div>
                    </div>
                    <svg style={{ position: 'absolute', bottom: '15px', right: '15px' }} width="60" height="25" viewBox="0 0 60 25" fill="none">
                      <path d="M2 20 L15 20 L25 15 L35 15 L45 5 L58 5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {/* Deposits Closed */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><CreditCard size={18} /></div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Deposits Closed</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>42</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '4px' }}><span style={{ color: '#3b82f6' }}>↑ 8%</span> vs yesterday</div>
                    </div>
                    <svg style={{ position: 'absolute', bottom: '15px', right: '15px' }} width="60" height="25" viewBox="0 0 60 25" fill="none">
                      <path d="M2 20 Q 15 20 25 15 T 45 10 T 58 5" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  {/* Attended */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#fffbeb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}><User size={18} /></div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Attended</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>156</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '4px' }}><span style={{ color: '#f59e0b' }}>↑ 20%</span> vs yesterday</div>
                    </div>
                    <svg style={{ position: 'absolute', bottom: '15px', right: '15px' }} width="60" height="25" viewBox="0 0 60 25" fill="none">
                      <path d="M2 20 L15 15 L25 18 L35 10 L45 12 L58 5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {/* Avg. Response Time */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#fff1f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}><Clock size={18} /></div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Avg. Response Time</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1.2, marginTop: '3px', marginBottom: '1px' }}>01m 24s</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '4px' }}><span style={{ color: '#e11d48' }}>↓ 15%</span> vs yesterday</div>
                    </div>
                    <svg style={{ position: 'absolute', bottom: '15px', right: '15px' }} width="60" height="25" viewBox="0 0 60 25" fill="none">
                      <path d="M2 5 C10 5 15 15 25 15 C35 15 40 20 45 10 C50 5 55 15 58 5" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>

                {/* Middle Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  {/* Line Chart */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0' }}>Performance Trend</h3>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }}></span> Calls Responded</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Chats Closed</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> Deposits Closed</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> Attended</span>
                        </div>
                      </div>
                      <select style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 600, color: '#4b5563', outline: 'none' }}>
                        <option>Daily</option>
                        <option>Weekly</option>
                      </select>
                    </div>
                    {/* SVG Line Chart (Mocked) */}
                    <div style={{ position: 'relative', height: '220px', width: '100%', marginTop: '20px' }}>
                      {/* Grid lines */}
                      <div style={{ position: 'absolute', top: 0, left: '30px', right: 0, bottom: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '1px solid #f3f4f6' }}>
                        {[200, 150, 100, 50, 0].map(val => (
                          <div key={val} style={{ position: 'relative', width: '100%', borderTop: '1px solid #f3f4f6' }}>
                            <span style={{ position: 'absolute', left: '-25px', top: '-7px', fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>{val}</span>
                          </div>
                        ))}
                      </div>
                      {/* X Axis Labels */}
                      <div style={{ position: 'absolute', bottom: '-5px', left: '30px', right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>
                        <span>11 Jun</span><span>12 Jun</span><span>13 Jun</span><span>14 Jun</span><span>15 Jun</span><span>16 Jun</span><span>17 Jun</span>
                      </div>
                      {/* SVG Paths */}
                      <svg style={{ position: 'absolute', top: 0, left: '30px', right: 0, bottom: '20px', width: 'calc(100% - 30px)', height: '200px', overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 600 200">
                        {/* Orange Line (Attended) ~ 140-180 */}
                        <path d="M0 60 L100 45 L200 60 L300 40 L400 40 L500 20 L600 50" fill="none" stroke="#f59e0b" strokeWidth="2" />
                        <circle cx="0" cy="60" r="4" fill="#f59e0b" /> <circle cx="100" cy="45" r="4" fill="#f59e0b" /> <circle cx="200" cy="60" r="4" fill="#f59e0b" /> <circle cx="300" cy="40" r="4" fill="#f59e0b" /> <circle cx="400" cy="40" r="4" fill="#f59e0b" /> <circle cx="500" cy="20" r="4" fill="#f59e0b" /> <circle cx="600" cy="50" r="4" fill="#f59e0b" />
                        
                        {/* Purple Line (Calls) ~ 100-128 */}
                        <path d="M0 95 L100 75 L200 102 L300 76 L400 85 L500 72 L600 90" fill="none" stroke="#7c3aed" strokeWidth="2" />
                        <circle cx="0" cy="95" r="4" fill="#7c3aed" /> <circle cx="100" cy="75" r="4" fill="#7c3aed" /> <circle cx="200" cy="102" r="4" fill="#7c3aed" /> <circle cx="300" cy="76" r="4" fill="#7c3aed" /> <circle cx="400" cy="85" r="4" fill="#7c3aed" /> <circle cx="500" cy="72" r="4" fill="#7c3aed" /> <circle cx="600" cy="90" r="4" fill="#7c3aed" />

                        {/* Green Line (Chats) ~ 60-96 */}
                        <path d="M0 133 L100 124 L200 133 L300 114 L400 117 L500 110 L600 125" fill="none" stroke="#10b981" strokeWidth="2" />
                        <circle cx="0" cy="133" r="4" fill="#10b981" /> <circle cx="100" cy="124" r="4" fill="#10b981" /> <circle cx="200" cy="133" r="4" fill="#10b981" /> <circle cx="300" cy="114" r="4" fill="#10b981" /> <circle cx="400" cy="117" r="4" fill="#10b981" /> <circle cx="500" cy="110" r="4" fill="#10b981" /> <circle cx="600" cy="125" r="4" fill="#10b981" />

                        {/* Blue Line (Deposits) ~ 30-42 */}
                        <path d="M0 167 L100 160 L200 167 L300 160 L400 160 L500 160 L600 160" fill="none" stroke="#3b82f6" strokeWidth="2" />
                        <circle cx="0" cy="167" r="4" fill="#3b82f6" /> <circle cx="100" cy="160" r="4" fill="#3b82f6" /> <circle cx="200" cy="167" r="4" fill="#3b82f6" /> <circle cx="300" cy="160" r="4" fill="#3b82f6" /> <circle cx="400" cy="160" r="4" fill="#3b82f6" /> <circle cx="500" cy="160" r="4" fill="#3b82f6" /> <circle cx="600" cy="160" r="4" fill="#3b82f6" />
                      </svg>
                    </div>
                  </div>

                  {/* Gauge Chart */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '24px' }}>
                      <Activity size={18} color="#7c3aed" /> Response Time
                    </div>
                    
                    {/* SVG Gauge */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <div style={{ position: 'relative', width: '220px', height: '110px' }}>
                        {/* Background track */}
                        <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%' }}>
                          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f3f4f6" strokeWidth="16" strokeLinecap="round" />
                          {/* Foreground track (purple) */}
                          <path d="M 20 100 A 80 80 0 0 1 150 40" fill="none" stroke="#7c3aed" strokeWidth="16" strokeLinecap="round" />
                        </svg>
                        {/* Text inside gauge */}
                        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center' }}>
                          <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>01m 24s</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginTop: '4px' }}>Average Response Time</div>
                        </div>
                      </div>
                    </div>

                    {/* Stats footer */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#f9fafb', borderRadius: '12px', padding: '16px', marginTop: '24px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Best</div>
                        <div style={{ fontSize: '16px', color: '#10b981', fontWeight: 800 }}>45s</div>
                      </div>
                      <div style={{ borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Average</div>
                        <div style={{ fontSize: '16px', color: '#7c3aed', fontWeight: 800 }}>01m 24s</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Worst</div>
                        <div style={{ fontSize: '16px', color: '#e11d48', fontWeight: 800 }}>03m 16s</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  {/* Daily Summary Table */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '20px' }}>
                      <List size={18} color="#7c3aed" /> Daily Summary
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>
                          <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600 }}>Calls Responded</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600 }}>Chats Closed</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600 }}>Deposits Closed</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600 }}>Attended</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600 }}>Avg. Response Time</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontWeight: 700, color: '#111827' }}>
                        <tr style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>17 Jun 2026</td>
                          <td style={{ padding: '16px 8px' }}>128</td>
                          <td style={{ padding: '16px 8px' }}>96</td>
                          <td style={{ padding: '16px 8px' }}>42</td>
                          <td style={{ padding: '16px 8px' }}>156</td>
                          <td style={{ padding: '16px 8px', color: '#f59e0b' }}>01m 24s</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>16 Jun 2026</td>
                          <td style={{ padding: '16px 8px' }}>108</td>
                          <td style={{ padding: '16px 8px' }}>85</td>
                          <td style={{ padding: '16px 8px' }}>38</td>
                          <td style={{ padding: '16px 8px' }}>130</td>
                          <td style={{ padding: '16px 8px' }}>01m 35s</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>15 Jun 2026</td>
                          <td style={{ padding: '16px 8px' }}>97</td>
                          <td style={{ padding: '16px 8px' }}>78</td>
                          <td style={{ padding: '16px 8px' }}>31</td>
                          <td style={{ padding: '16px 8px' }}>112</td>
                          <td style={{ padding: '16px 8px' }}>01m 48s</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>14 Jun 2026</td>
                          <td style={{ padding: '16px 8px' }}>88</td>
                          <td style={{ padding: '16px 8px' }}>74</td>
                          <td style={{ padding: '16px 8px' }}>29</td>
                          <td style={{ padding: '16px 8px' }}>104</td>
                          <td style={{ padding: '16px 8px' }}>01m 55s</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>13 Jun 2026</td>
                          <td style={{ padding: '16px 8px' }}>69</td>
                          <td style={{ padding: '16px 8px' }}>58</td>
                          <td style={{ padding: '16px 8px' }}>22</td>
                          <td style={{ padding: '16px 8px' }}>81</td>
                          <td style={{ padding: '16px 8px' }}>02m 10s</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                      <button style={{ background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: 700, color: '#7c3aed', cursor: 'pointer' }}>View Full Report</button>
                    </div>
                  </div>

                  {/* Activity Donut */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #f0f0f5', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '24px' }}>Activity Distribution</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flex: 1 }}>
                      {/* SVG Donut */}
                      <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                          {/* Attended (Orange) 37% */}
                          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="6" strokeDasharray="37 63" strokeDashoffset="0"></circle>
                          {/* Deposits Closed (Blue) 10% */}
                          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray="10 90" strokeDashoffset="-37"></circle>
                          {/* Chats Closed (Green) 23% */}
                          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray="23 77" strokeDashoffset="-47"></circle>
                          {/* Calls Responded (Purple) 30% */}
                          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#7c3aed" strokeWidth="6" strokeDasharray="30 70" strokeDashoffset="-70"></circle>
                        </svg>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Total</div>
                          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>422</div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, color: '#4b5563' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }}></span> Calls Responded</span>
                          <span>128 <span style={{ color: '#9ca3af', fontWeight: 600 }}>(30.3%)</span></span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, color: '#4b5563' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Chats Closed</span>
                          <span>96 <span style={{ color: '#9ca3af', fontWeight: 600 }}>(22.7%)</span></span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, color: '#4b5563' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> Deposits Closed</span>
                          <span>42 <span style={{ color: '#9ca3af', fontWeight: 600 }}>(9.9%)</span></span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, color: '#4b5563' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> Attended</span>
                          <span>156 <span style={{ color: '#9ca3af', fontWeight: 600 }}>(37.0%)</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Insight footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f9fafb', padding: '12px', borderRadius: '10px', marginTop: '24px', fontSize: '12px' }}>
                      <div style={{ color: '#7c3aed' }}><TrendingUp size={16} /></div>
                      <div><span style={{ fontWeight: 800, color: '#4f46e5' }}>Insight</span> <span style={{ color: '#6b7280', fontWeight: 600 }}>You performed <span style={{ color: '#10b981', fontWeight: 800 }}>20%</span> better than yesterday! Keep it up!</span></div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Bottom Row: Stat Cards */}
            {(execTab === 'dashboard') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                  <div style={{ background: '#f3e8ff', color: '#7c3aed', padding: '4px', borderRadius: '6px' }}><Phone size={14} /></div>
                  Total Callbacks
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{callRequests.length}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Today</div>
                  </div>
                  <svg width="60" height="25" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 20C10 20 15 5 25 10C35 15 40 20 45 20C50 20 55 5 58 5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                  <div style={{ background: '#e0f2fe', color: '#0ea5e9', padding: '4px', borderRadius: '6px' }}><CreditCard size={14} /></div>
                  Manual Deposits
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{pendingDeposits.length}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Pending</div>
                  </div>
                  <svg width="60" height="25" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 18C10 18 15 22 25 22C35 22 40 10 45 10C50 10 55 5 58 5" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                  <div style={{ background: '#dcfce7', color: '#16a34a', padding: '4px', borderRadius: '6px' }}><MessageSquare size={14} /></div>
                  Chats Handled
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{activeChats.length}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Today</div>
                  </div>
                  <svg width="60" height="25" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 22C10 22 15 15 25 20C35 25 40 10 45 10C50 10 55 5 58 5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                  <div style={{ background: '#ffedd5', color: '#ea580c', padding: '4px', borderRadius: '6px' }}><Calendar size={14} /></div>
                  Attendance
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>100%</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>This Month</div>
                  </div>
                  <svg width="60" height="25" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 20C10 20 15 10 25 15C35 20 40 15 45 15C50 15 55 5 58 5" stroke="#ea580c" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

            </div>
            )}

            {/* Settings Tab Content */}
            {execTab === 'settings' && (
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <Settings size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#111827', fontWeight: 700 }}>Settings</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Account settings, notification preferences, and profile management coming soon.</p>
              </div>
            )}

          </div>
        </main>
        
        <footer style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#6b7280', marginTop: 'auto' }}>
          © 2026 Investhour. All rights reserved.
        </footer>
      </div>
    );
  }
  if (view === 'dashboard') {
    if (successfulReferralsCount < 1 && !isUnlocked) {
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

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div style={{ 
              background: 'linear-gradient(145deg, #120524 0%, #17092c 100%)', 
              border: '1px solid rgba(217, 175, 86, 0.25)', 
              padding: '40px', 
              borderRadius: '24px', 
              maxWidth: '850px', 
              width: '100%', 
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(217, 175, 86, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#d9af56' }}>
                <Lock size={32} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Vault Locked</h2>
              <p style={{ color: '#9c93a8', fontSize: '15px', lineHeight: '1.6', maxWidth: '600px', textAlign: 'center', marginBottom: '35px' }}>
                Welcome to Investhour! To unlock your full dashboard, live trading floor, and physical vault access, please choose one of the options below.
              </p>

              {/* Two Column Layout */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '24px', 
                width: '100%',
                justifyContent: 'center'
              }}>
                {/* Option 1: Referral */}
                <div style={{ 
                  flex: '1 1 350px', 
                  minWidth: '280px',
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid rgba(255, 255, 255, 0.06)', 
                  borderRadius: '16px', 
                  padding: '28px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#d9af56', display: 'block', marginBottom: '8px' }}>Option A (Free)</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0' }}>Invite a Friend</h3>
                    <p style={{ fontSize: '13px', color: '#9c93a8', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                      Share your unique referral link with a friend. Once they register their account, your vault will be unlocked instantly.
                    </p>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px dashed rgba(217, 175, 86, 0.2)' }}>
                      <span style={{ display: 'block', fontSize: '10px', color: '#9c93a8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Your Referral Link</span>
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}?ref=IH-${user?.email?.split('@')[0].toUpperCase() || 'USER'}`} 
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#d9af56', fontSize: '12px', textAlign: 'center', outline: 'none', marginBottom: '10px', fontFamily: 'monospace' }}
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}?ref=IH-${user?.email?.split('@')[0].toUpperCase() || 'USER'}`);
                          setCopiedReferralLink(true);
                          setTimeout(() => setCopiedReferralLink(false), 2000);
                        }}
                        style={{ background: copiedReferralLink ? '#10b981' : '#d9af56', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                      >
                        {copiedReferralLink ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#9c93a8' }}>Referrals Completed:</span>
                      <strong style={{ color: '#f43f5e', fontSize: '15px' }}>{successfulReferralsCount} / 1</strong>
                    </div>
                    <button 
                      onClick={() => window.location.reload()}
                      style={{ background: 'transparent', color: '#9c93a8', border: 'none', textDecoration: 'underline', fontSize: '11px', cursor: 'pointer' }}
                    >
                      I've referred someone, refresh status
                    </button>
                  </div>
                </div>

                {/* Option 2: Payment */}
                <div style={{ 
                  flex: '1 1 350px', 
                  minWidth: '280px',
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(217, 175, 86, 0.15)', 
                  borderRadius: '16px', 
                  padding: '28px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 25px rgba(217, 175, 86, 0.05)'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#10b981', display: 'block', marginBottom: '8px' }}>Option B (Instant)</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0' }}>Instant Pay Unlock</h3>
                    <p style={{ fontSize: '13px', color: '#9c93a8', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                      Unlock your vault immediately by paying a one-time setup and account opening fee of ₹10.
                    </p>

                    <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '20px 15px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'center', marginBottom: '20px' }}>
                      <span style={{ display: 'block', fontSize: '10px', color: '#9c93a8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>Account Opening Fee</span>
                      <strong style={{ fontSize: '28px', color: '#10b981', display: 'block' }}>₹10</strong>
                      <span style={{ fontSize: '10px', color: '#9c93a8', display: 'block', marginTop: '4px' }}>Secured payment via Razorpay</span>
                    </div>
                  </div>

                  <div>
                    <RazorpayButton 
                      amount={10} 
                      type="unlock" 
                      onSuccess={(verifyResult) => {
                        if (verifyResult.isUnlocked || verifyResult.success) {
                          setIsUnlocked(true);
                          // Re-sync with backend to be absolutely sure
                          fetch(`${VITE_BACKEND_URL}/api/auth/validate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: user.email })
                          })
                            .then(r => r.json())
                            .then(data => {
                              if (data.valid && data.isUnlocked) {
                                setIsUnlocked(true);
                              }
                            });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

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
            
            <button 
              type="button" 
              className="hamburger-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <nav className={`nav-menu dashboard-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
              <button 
                className="dash-nav-item"
                onClick={() => { setView('home'); setIsMobileMenuOpen(false); }}
              >
                <Home size={16} /> Home
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'portfolio' ? 'active' : ''}`}
                onClick={() => { setDashTab('portfolio'); setIsMobileMenuOpen(false); }}
              >
                <Briefcase size={16} /> Portfolio
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'trade' ? 'active' : ''}`}
                onClick={() => { setDashTab('trade'); setIsMobileMenuOpen(false); }}
              >
                <ArrowRightLeft size={16} /> Trade
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'wallet' ? 'active' : ''}`}
                onClick={() => { setDashTab('wallet'); setIsMobileMenuOpen(false); }}
              >
                <Wallet size={16} /> Wallet
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'contest' ? 'active' : ''}`}
                onClick={() => { setDashTab('contest'); setIsMobileMenuOpen(false); }}
              >
                <Star size={16} /> Contest Awards
              </button>
              <button 
                className="dash-nav-item"
                onClick={() => { setView('about'); setIsMobileMenuOpen(false); }}
              >
                <Gem size={16} /> Explore Elements
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'referral' ? 'active' : ''}`}
                onClick={() => { setDashTab('referral'); setIsMobileMenuOpen(false); }}
              >
                <Gift size={16} /> Referral Program
              </button>
              <button 
                className={`dash-nav-item ${dashTab === 'profile' ? 'active' : ''}`}
                onClick={() => { setDashTab('profile'); setIsMobileMenuOpen(false); }}
              >
                <User size={16} /> Vault Profile
              </button>
              {user && (
                <div className="mobile-user-badge">
                  <div className="user-info-text">
                    <span className="user-email-text">{user.email}</span>
                    <span className="kyc-badge">{user.email === 'sandeepkumar.pikili@vrpigroup.co.in' ? 'ADMIN' : 'KYC SECURED'}</span>
                  </div>
                  <button type="button" className="btn-sec-signout" onClick={handleSignOut} title="Secure Sign Out">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
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
            <div className="tab-pane-view trade-view animate-fade-in trade-view-layout">
              {/* Disclaimer on the left side */}
              <div className="trade-disclaimer-card">
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
              <div className="trade-chart-container">
                <LiveChartWidget user={user} withdrawableBalance={withdrawableBalance} />
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
                    <div className="cc-balance-lbl">Total Wallet Balance</div>
                    <div className="cc-balance-val">{'₹'}{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    {successfulReferralsCount > 0 && (
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '-6px', marginBottom: '6px', display: 'flex', gap: '12px' }}>
                        <span>Deposited: <span style={{ color: '#10b981', fontWeight: 700 }}>₹{Math.max(0, walletBalance - successfulReferralsCount * 10).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></span>
                        <span>Referral Bonus: <span style={{ color: '#d9af56', fontWeight: 700 }}>₹{(Math.min(walletBalance, successfulReferralsCount * 10)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></span>
                      </div>
                    )}
                    <div className="card-bottom-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <span>Withdrawable: ₹{withdrawableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                          <input type="number" placeholder="Enter amount (min 100)" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                        </div>
                        <RazorpayButton 
                          amount={parseFloat(depositAmount) || 0} 
                          type="deposit" 
                          onSuccess={(data) => {
                            const val = parseFloat(depositAmount);
                            // Use exact server-returned balance if available, otherwise add to current
                            if (data.newBalance !== undefined) {
                              setWalletBalance(parseFloat(data.newBalance.toFixed(2)));
                            } else {
                              setWalletBalance((prev) => parseFloat((prev + val).toFixed(2)));
                            }
                            setTransactions((prev) => [{ id: `TX-${Math.floor(1000 + Math.random() * 9000)}`, type: 'deposit', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                            setDepositAmount('');
                            // Re-sync from backend to get latest balance and transactions
                            setTimeout(() => {
                              fetch(`${VITE_BACKEND_URL}/api/auth/validate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: user.email })
                              }).then(r => r.json()).then(syncData => {
                                if (syncData.valid) {
                                  if (syncData.walletBalance !== undefined) setWalletBalance(syncData.walletBalance);
                                  if (syncData.transactions !== undefined) {
                                    setTransactions(syncData.transactions.map(t => ({
                                      id: 'TX-' + t.id,
                                      type: t.type?.toLowerCase() === 'deposit' ? 'deposit' : t.type?.toLowerCase() === 'referral' ? 'referral' : t.type?.toLowerCase() === 'refund' ? 'refund' : 'withdrawal',
                                      asset: t.asset || 'wallet', amount: t.amount, status: 'Completed',
                                      date: new Date(t.createdAt).toISOString().slice(0, 16).replace('T', ' ')
                                    })));
                                  }
                                }
                              }).catch(() => {});
                            }, 500);
                          }}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowManualDepositModal(true)} 
                          style={{ 
                            marginTop: '10px', width: '100%', padding: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s'
                          }}
                        >
                          Manual Deposit (via UTR)
                        </button>
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
                    {transactions.filter(tx => tx.type !== 'referral').map((tx) => (
                      <div key={tx.id} className="ledger-card-item">
                        <div className="ledger-item-left">
                          <div className={`ledger-type-circle ${tx.type === 'refund' ? 'deposit' : tx.type}`}>
                            {tx.type === 'deposit' || tx.type === 'refund' ? <ArrowDownLeft size={16} /> : tx.type === 'withdrawal' ? <ArrowUpRight size={16} /> : <ArrowRightLeft size={16} />}
                          </div>
                          <div>
                            <div className="ledger-item-title">
                              {tx.type === 'deposit' ? 'Added Funds' : tx.type === 'refund' ? 'Refund (Rejected)' : tx.type === 'withdrawal' ? 'Withdrew Cash' : tx.type === 'buy' ? `Purchased ${getAssetLabel(tx.asset)}` : `Sold ${getAssetLabel(tx.asset)}`}
                            </div>
                            <div className="ledger-item-date">{tx.date} {'\u2022'} ID: {tx.id}</div>
                          </div>
                        </div>
                        <div className="ledger-item-right">
                          <div className={`ledger-item-amount ${tx.type === 'refund' ? 'deposit' : tx.type}`}>{tx.type === 'buy' || tx.type === 'withdrawal' ? '-' : '+'}{'\u20b9'}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          {tx.weight > 0 && <div className="ledger-item-weight">{tx.weight.toFixed(4)} g</div>}
                        </div>
                      </div>
                    ))}
                    {transactions.filter(tx => tx.type !== 'referral').length === 0 && (
                      <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No transactions yet.</div>
                    )}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  

                  </div>

                  {/* Right Column: Settings or Upload widget */}
                  <div className="profile-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

                      {(currentKycStatus === 'Submitted' || currentKycStatus === 'Verified') && cRecord.kycDocument && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
                          <h4 style={{ fontSize: '13px', color: '#ffffff', marginBottom: '12px', fontWeight: 700 }}>
                            {currentKycStatus === 'Verified' ? 'Verified Document Details' : 'Pending Document Details'}
                          </h4>
                          <div className="kyc-file-preview" style={{ marginTop: 0 }}>
                            <div className="kyc-file-details">
                              <FileText size={20} className="kyc-upload-icon" style={{ margin: 0 }} />
                              <div className="kyc-file-info">
                                <span className="kyc-file-name">{cRecord.kycDocument.fileName}</span>
                                <span className="kyc-file-size">{cRecord.kycDocument.type} • {cRecord.kycDocument.fileSize} • Uploaded at {cRecord.kycDocument.uploadedAt}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '11px', color: currentKycStatus === 'Verified' ? '#10b981' : '#f59e0b', fontWeight: 800 }}>
                                {currentKycStatus === 'Verified' ? 'VERIFIED' : 'PENDING REVIEW'}
                              </span>
                              <button 
                                type="button"
                                onClick={handleKycDelete}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 0.2s',
                                }}
                                title="Delete document"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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

                  {/* Danger Zone Card */}
                  <div className="profile-security-badge-card" style={{ 
                    marginTop: '0px', 
                    background: 'rgba(220, 38, 38, 0.03)', 
                    borderColor: 'rgba(220, 38, 38, 0.2)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(220, 38, 38, 0.2)'
                  }}>
                    <h3 style={{ color: '#ef4444', fontSize: '16px', margin: '0 0 8px 0', fontWeight: 800 }}>⚠️ Danger Zone</h3>
                    <p className="profile-desc-p" style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
                      Permanently delete your account and all associated trading data. This action is irreversible.
                    </p>
                    <button 
                      type="button" 
                      onClick={handleDeleteAccount}
                      style={{ 
                        width: '100%', 
                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                        border: 'none', 
                        color: '#ffffff', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        fontWeight: 700, 
                        fontSize: '13px', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
                      }}
                    >
                      Delete Total Account
                    </button>
                  </div>
                </div>

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
                    Accumulate real wealth together. Get <strong>Gold bonus</strong> credited instantly to your vault for every friend who registers and verifies their account. 
                    <br />
                    <span className="milestone-highlight">Milestone Reward: Refer 1,500 successful friends to claim <strong>1 Gram of Physical Gold</strong> delivered to your doorstep!</span>
                  </p>
                </div>
              </div>

              <div className="grid-2col referral-details-grid" style={{ gap: '30px', margin: '30px 0' }}>
                <div className="referral-stats-card">
                  <h3>Your Referral Progress</h3>
                  <div className="referral-stats-container">
                    <div className="referral-stat-box" style={{ width: '100%' }}>
                      <span className="stat-label">Successful Invites</span>
                      <strong className="stat-val">{successfulReferralsCount} <span className="stat-max">/ 1,500</span></strong>
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
                      <span className="step-txt">Gold goes to your vault!</span>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {user && !user.isExecutive && (
                    <button 
                      type="button" 
                      onClick={handleRequestCallback}
                      style={{ 
                        background: 'rgba(217, 175, 86, 0.15)', 
                        color: '#d9af56', 
                        border: '1px solid rgba(217, 175, 86, 0.25)', 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Request a callback"
                    >
                      📞 Callback
                    </button>
                  )}
                  <button type="button" style={chatCloseBtnStyle} onClick={() => setIsChatOpen(false)}><X size={18} /></button>
                </div>
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
            <div className="modal-content" style={{ maxWidth: '440px', border: '1px solid rgba(217, 175, 86, 0.2)', background: 'linear-gradient(135deg, #18092a 0%, #0d0418 100%)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)' }}>
              <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="modal-title" style={{ fontSize: '18px', color: '#d9af56' }}>Withdraw Funds</span>
                <button type="button" className="modal-close" onClick={() => setShowWithdrawModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body" style={{ padding: '20px', gap: '14px' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 4px', textAlign: 'center' }}>Securely withdraw your wallet balance to your bank account.</p>
                
                {/* Compact Balance Display */}
                <div style={{
                  background: 'rgba(217, 175, 86, 0.04)',
                  border: '1px solid rgba(217, 175, 86, 0.12)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Withdrawable Balance</span>
                  <strong style={{ fontSize: '15px', color: '#d9af56' }}>₹{withdrawableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className="funding-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px', fontWeight: 'bold' }}>
                    <span>AMOUNT TO WITHDRAW (INR)</span>
                    <span>Min. ₹500</span>
                  </div>
                  <div className="premium-amount-wrapper">
                    <span className="premium-input-icon" style={{ fontSize: '16px', fontWeight: 'bold' }}>₹</span>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={withdrawAmount} 
                      onChange={(e) => setWithdrawAmount(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="payout-mode-container">
                  <span className="payout-mode-label">Payout Mode</span>
                  <div className="payout-mode-options">
                    {['IMPS', 'RTGS', 'NEFT'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`payout-mode-btn ${payoutMode === mode ? 'active' : ''}`}
                        onClick={() => setPayoutMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {lockedBankDetails && (
                    <div style={{ fontSize: '11px', color: 'rgba(217, 175, 86, 0.85)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px', padding: '6px 10px', background: 'rgba(217, 175, 86, 0.05)', borderRadius: '6px', border: '1px solid rgba(217, 175, 86, 0.15)' }}>
                      <Lock size={12} style={{ color: '#d9af56' }} />
                      <span>Bank details are locked and cannot be changed.</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Account Holder</label>
                      <div className={`premium-input-wrapper ${lockedBankDetails ? 'locked' : ''}`}>
                        <User size={13} className="premium-input-icon" />
                        <input 
                          type="text" 
                          placeholder="Holder Name" 
                          value={accountHolderName} 
                          onChange={(e) => setAccountHolderName(e.target.value)} 
                          readOnly={!!lockedBankDetails}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Bank Name</label>
                      <div className={`premium-input-wrapper ${lockedBankDetails ? 'locked' : ''}`}>
                        <Building size={13} className="premium-input-icon" />
                        <input 
                          type="text" 
                          placeholder="Bank Name" 
                          value={bankName} 
                          onChange={(e) => setBankName(e.target.value)} 
                          readOnly={!!lockedBankDetails}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Account Number</label>
                      <div className={`premium-input-wrapper ${lockedBankDetails ? 'locked' : ''}`}>
                        <CreditCard size={13} className="premium-input-icon" />
                        <input 
                          type="text" 
                          placeholder="Account Number" 
                          value={accountNumber} 
                          onChange={(e) => setAccountNumber(e.target.value)} 
                          readOnly={!!lockedBankDetails}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>IFSC Code</label>
                      <div className={`premium-input-wrapper ${lockedBankDetails ? 'locked' : ''}`}>
                        <Hash size={13} className="premium-input-icon" />
                        <input 
                          type="text" 
                          placeholder="IFSC" 
                          value={ifscCode} 
                          onChange={(e) => setIfscCode(e.target.value)} 
                          style={{ textTransform: 'uppercase' }} 
                          readOnly={!!lockedBankDetails}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <RazorpayButton 
                  amount={parseFloat(withdrawAmount) || 0} 
                  type="withdraw" 
                  payoutDetails={
                    bankName && accountHolderName && accountNumber && ifscCode ? { accountName: accountHolderName, bankName, accountNumber, ifsc: ifscCode.toUpperCase(), mode: payoutMode } : null
                  }
                  onSuccess={(data) => {
                    const val = parseFloat(withdrawAmount);
                    if (val < 500) {
                      alert('Minimum withdrawal is ₹500.');
                      return;
                    }
                    if (withdrawableBalance < val) {
                      alert(`Insufficient withdrawable balance. Your withdrawable balance is ₹${withdrawableBalance.toFixed(2)}.`);
                      return;
                    }
                    setWalletBalance((prev) => parseFloat((prev - val).toFixed(2)));
                    setTransactions((prev) => [{ id: `TX-${Math.floor(1000 + Math.random() * 9000)}`, type: 'withdrawal', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                    setWithdrawAmount('');
                    setUpiId('');
                    if (user && user.email) {
                      syncLockedBankDetails(user.email);
                    }
                    setShowWithdrawModal(false);
                  }}
                  onError={(err) => {
                    if (err?.response?.data?.error) {
                      alert(err.response.data.error);
                    } else if (withdrawableBalance < parseFloat(withdrawAmount)) {
                      alert(`Insufficient withdrawable balance. Your withdrawable balance is ₹${withdrawableBalance.toFixed(2)}.`);
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
            <div className="logo-section" onClick={() => { if (!isSupportSubdomain) setView('home'); }} style={{ cursor: isSupportSubdomain ? 'default' : 'pointer' }}>
              <InvesthourLogoText />
            </div>
            {!isSupportSubdomain && <button type="button" className="btn-signin" onClick={() => setView('home')}>Back to Home</button>}
          </div>
        </header>
        <div className="auth-container">
          <div className="auth-card animate-fade-in">
            {authTab !== 'forgot' && !isSupportSubdomain && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button 
                  type="button" 
                  style={{
                    background: 'none', border: 'none', 
                    color: authRole === 'client' ? '#f43f5e' : 'rgba(255,255,255,0.4)', 
                    fontWeight: 700, cursor: 'pointer', fontSize: '13px',
                    borderBottom: authRole === 'client' ? '2px solid #f43f5e' : 'none',
                    paddingBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'
                  }} 
                  onClick={() => { setAuthRole('client'); setAuthTab('login'); }}
                >
                  👤 Client Access
                </button>
                <button 
                  type="button" 
                  style={{
                    background: 'none', border: 'none', 
                    color: authRole === 'support' ? '#f43f5e' : 'rgba(255,255,255,0.4)', 
                    fontWeight: 700, cursor: 'pointer', fontSize: '13px',
                    borderBottom: authRole === 'support' ? '2px solid #f43f5e' : 'none',
                    paddingBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'
                  }} 
                  onClick={() => { setAuthRole('support'); setAuthTab('login'); }}
                >
                  🎧 Support Staff
                </button>
              </div>
            )}
            {authTab !== 'forgot' && !isSupportSubdomain && (
              <div className="auth-tabs">
                <button type="button" className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`} onClick={() => { setAuthTab('login'); setShowPassword(false); }}>Sign In</button>
                {authRole === 'client' && (
                  <button type="button" className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`} onClick={() => { setAuthTab('register'); setShowPassword(false); }}>Sign Up</button>
                )}
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
                <div className="auth-form-header">
                  <h2>{isSupportSubdomain ? 'Support Staff Sign In' : 'Welcome Back'}</h2>
                  <p>{isSupportSubdomain ? 'Access the support console securely' : 'Access your precious metal vault securely'}</p>
                </div>
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
              <>
                <button 
                  type="button" 
                  className="hamburger-btn" 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle Menu"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <nav className={`nav-menu dashboard-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('home'); setIsMobileMenuOpen(false); }}
                  >
                    <Home size={16} /> Home
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('portfolio'); setIsMobileMenuOpen(false); }}
                  >
                    <Briefcase size={16} /> Portfolio
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('trade'); setIsMobileMenuOpen(false); }}
                  >
                    <ArrowRightLeft size={16} /> Trade
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('wallet'); setIsMobileMenuOpen(false); }}
                  >
                    <Wallet size={16} /> Wallet
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('contest'); setIsMobileMenuOpen(false); }}
                  >
                    <Star size={16} /> Contest Awards
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('about'); setIsMobileMenuOpen(false); }}
                  >
                    <Gem size={16} /> Explore Elements
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('referral'); setIsMobileMenuOpen(false); }}
                  >
                    <Gift size={16} /> Referral Program
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('profile'); setIsMobileMenuOpen(false); }}
                  >
                    <User size={16} /> Vault Profile
                  </button>
                  {user && (
                    <div className="mobile-user-badge">
                      <div className="user-info-text">
                        <span className="user-email-text">{user.email}</span>
                        <span className="kyc-badge">{user.email === 'sandeepkumar.pikili@vrpigroup.co.in' ? 'ADMIN' : 'KYC SECURED'}</span>
                      </div>
                      <button type="button" className="btn-sec-signout" onClick={handleSignOut} title="Secure Sign Out">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </nav>
              </>
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
              <>
                <button 
                  type="button" 
                  className="hamburger-btn" 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle Menu"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <nav className={`nav-menu dashboard-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('home'); setIsMobileMenuOpen(false); }}
                  >
                    <Home size={16} /> Home
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('portfolio'); setIsMobileMenuOpen(false); }}
                  >
                    <Briefcase size={16} /> Portfolio
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('trade'); setIsMobileMenuOpen(false); }}
                  >
                    <ArrowRightLeft size={16} /> Trade
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('wallet'); setIsMobileMenuOpen(false); }}
                  >
                    <Wallet size={16} /> Wallet
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('contest'); setIsMobileMenuOpen(false); }}
                  >
                    <Star size={16} /> Contest Awards
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('about'); setIsMobileMenuOpen(false); }}
                  >
                    <Gem size={16} /> Explore Elements
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('referral'); setIsMobileMenuOpen(false); }}
                  >
                    <Gift size={16} /> Referral Program
                  </button>
                  <button 
                    className="dash-nav-item"
                    onClick={() => { setView('dashboard'); setDashTab('profile'); setIsMobileMenuOpen(false); }}
                  >
                    <User size={16} /> Vault Profile
                  </button>
                  {user && (
                    <div className="mobile-user-badge">
                      <div className="user-info-text">
                        <span className="user-email-text">{user.email}</span>
                        <span className="kyc-badge">{user.email === 'sandeepkumar.pikili@vrpigroup.co.in' ? 'ADMIN' : 'KYC SECURED'}</span>
                      </div>
                      <button type="button" className="btn-sec-signout" onClick={handleSignOut} title="Secure Sign Out">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </nav>
              </>
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
            <div className="modal-content" style={{ maxWidth: '440px', border: '1px solid rgba(217, 175, 86, 0.2)', background: 'linear-gradient(135deg, #18092a 0%, #0d0418 100%)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)' }}>
              <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="modal-title" style={{ fontSize: '18px', color: '#d9af56' }}>Withdraw Funds</span>
                <button type="button" className="modal-close" onClick={() => setShowWithdrawModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body" style={{ padding: '20px', gap: '14px' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 4px', textAlign: 'center' }}>Securely withdraw your wallet balance to your bank account.</p>
                
                {/* Compact Balance Display */}
                <div style={{
                  background: 'rgba(217, 175, 86, 0.04)',
                  border: '1px solid rgba(217, 175, 86, 0.12)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Withdrawable Balance</span>
                  <strong style={{ fontSize: '15px', color: '#d9af56' }}>₹{withdrawableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className="funding-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px', fontWeight: 'bold' }}>
                    <span>AMOUNT TO WITHDRAW (INR)</span>
                    <span>Min. ₹500</span>
                  </div>
                  <div className="premium-amount-wrapper">
                    <span className="premium-input-icon" style={{ fontSize: '16px', fontWeight: 'bold' }}>₹</span>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={withdrawAmount} 
                      onChange={(e) => setWithdrawAmount(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="payout-mode-container">
                  <span className="payout-mode-label">Payout Mode</span>
                  <div className="payout-mode-options">
                    {['IMPS', 'RTGS', 'NEFT'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`payout-mode-btn ${payoutMode === mode ? 'active' : ''}`}
                        onClick={() => setPayoutMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {lockedBankDetails && (
                    <div style={{ fontSize: '11px', color: 'rgba(217, 175, 86, 0.85)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px', padding: '6px 10px', background: 'rgba(217, 175, 86, 0.05)', borderRadius: '6px', border: '1px solid rgba(217, 175, 86, 0.15)' }}>
                      <Lock size={12} style={{ color: '#d9af56' }} />
                      <span>Bank details are locked and cannot be changed.</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Account Holder</label>
                      <div className={`premium-input-wrapper ${lockedBankDetails ? 'locked' : ''}`}>
                        <User size={13} className="premium-input-icon" />
                        <input 
                          type="text" 
                          placeholder="Holder Name" 
                          value={accountHolderName} 
                          onChange={(e) => setAccountHolderName(e.target.value)} 
                          readOnly={!!lockedBankDetails}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Bank Name</label>
                      <div className={`premium-input-wrapper ${lockedBankDetails ? 'locked' : ''}`}>
                        <Building size={13} className="premium-input-icon" />
                        <input 
                          type="text" 
                          placeholder="Bank Name" 
                          value={bankName} 
                          onChange={(e) => setBankName(e.target.value)} 
                          readOnly={!!lockedBankDetails}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>Account Number</label>
                      <div className={`premium-input-wrapper ${lockedBankDetails ? 'locked' : ''}`}>
                        <CreditCard size={13} className="premium-input-icon" />
                        <input 
                          type="text" 
                          placeholder="Account Number" 
                          value={accountNumber} 
                          onChange={(e) => setAccountNumber(e.target.value)} 
                          readOnly={!!lockedBankDetails}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 'bold' }}>IFSC Code</label>
                      <div className={`premium-input-wrapper ${lockedBankDetails ? 'locked' : ''}`}>
                        <Hash size={13} className="premium-input-icon" />
                        <input 
                          type="text" 
                          placeholder="IFSC" 
                          value={ifscCode} 
                          onChange={(e) => setIfscCode(e.target.value)} 
                          style={{ textTransform: 'uppercase' }} 
                          readOnly={!!lockedBankDetails}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <RazorpayButton 
                  amount={parseFloat(withdrawAmount) || 0} 
                  type="withdraw" 
                  payoutDetails={
                    bankName && accountHolderName && accountNumber && ifscCode ? { accountName: accountHolderName, bankName, accountNumber, ifsc: ifscCode.toUpperCase(), mode: payoutMode } : null
                  }
                  onSuccess={(data) => {
                    const val = parseFloat(withdrawAmount);
                    if (val < 500) {
                      alert('Minimum withdrawal is ₹500.');
                      return;
                    }
                    if (withdrawableBalance < val) {
                      alert('Insufficient balance in your secure wallet.');
                      return;
                    }
                    setWalletBalance((prev) => parseFloat((prev - val).toFixed(2)));
                    setTransactions((prev) => [{ id: `TX-${Math.floor(1000 + Math.random() * 9000)}`, type: 'withdrawal', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                    setWithdrawAmount('');
                    setUpiId('');
                    if (user && user.email) {
                      syncLockedBankDetails(user.email);
                    }
                    setShowWithdrawModal(false);
                  }}
                  onError={(err) => {
                    if (err?.response?.data?.error === 'Insufficient wallet balance' || withdrawableBalance < parseFloat(withdrawAmount)) {
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

        {/* --- Manual Deposit Modal --- */}
        {showManualDepositModal && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ maxWidth: '400px', background: '#120524', border: '1px solid rgba(217, 175, 86, 0.3)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid rgba(217, 175, 86, 0.1)', paddingBottom: '12px' }}>
                <h3 style={{ color: '#d9af56', margin: 0, fontSize: '18px' }}>Submit Manual Deposit</h3>
                <button className="btn-close" onClick={() => setShowManualDepositModal(false)} style={{ color: '#9c93a8', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleManualDepositSubmit} style={{ padding: '20px 0 0 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="funding-input-group">
                  <label style={{ fontSize: '12px', color: '#9c93a8' }}>Deposit Amount</label>
                  <div className="funding-input-field-wrapper" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center' }}>
                    <span className="currency-symbol" style={{ color: '#fff' }}>₹</span>
                    <input type="number" readOnly value={depositAmount} style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '16px', marginLeft: '8px' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#f43f5e', marginTop: '4px' }}>* Change amount in the previous screen if needed.</div>
                </div>

                <div className="funding-input-group">
                  <label style={{ fontSize: '12px', color: '#9c93a8' }}>12-Digit UTR / Ref Number</label>
                  <input type="text" required placeholder="e.g. 123456789012" value={manualUtr} onChange={(e) => setManualUtr(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none' }} />
                </div>

                <div className="funding-input-group">
                  <label style={{ fontSize: '12px', color: '#9c93a8' }}>Payment Screenshot</label>
                  <input type="file" required accept="image/*" onChange={(e) => setManualScreenshot(e.target.files[0])} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
                </div>

                <button type="submit" disabled={manualDepositSubmitting} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: manualDepositSubmitting ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
                  {manualDepositSubmitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </form>
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
            
            <button 
              type="button" 
              className="hamburger-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {user && (
              <nav className={`nav-menu dashboard-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('home'); setIsMobileMenuOpen(false); }}
                >
                  <Home size={16} /> Home
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('portfolio'); setIsMobileMenuOpen(false); }}
                >
                  <Briefcase size={16} /> Portfolio
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('trade'); setIsMobileMenuOpen(false); }}
                >
                  <ArrowRightLeft size={16} /> Trade
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('wallet'); setIsMobileMenuOpen(false); }}
                >
                  <Wallet size={16} /> Wallet
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('contest'); setIsMobileMenuOpen(false); }}
                >
                  <Star size={16} /> Contest Awards
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('about'); setIsMobileMenuOpen(false); }}
                >
                  <Gem size={16} /> Explore Elements
                </button>
                <button 
                  className="dash-nav-item active"
                  onClick={() => { setView('referral-program'); setIsMobileMenuOpen(false); }}
                >
                  <Gift size={16} /> Referral Program
                </button>
                <button 
                  className="dash-nav-item"
                  onClick={() => { setView('dashboard'); setDashTab('profile'); setIsMobileMenuOpen(false); }}
                >
                  <User size={16} /> Vault Profile
                </button>
                {user && (
                  <div className="mobile-user-badge">
                    <div className="user-info-text">
                      <span className="user-email-text">{user.email}</span>
                      <span className="kyc-badge">{user.email === 'sandeepkumar.pikili@vrpigroup.co.in' ? 'ADMIN' : 'KYC SECURED'}</span>
                    </div>
                    <button type="button" className="btn-sec-signout" onClick={handleSignOut} title="Secure Sign Out">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </nav>
            )}

            {!user && (
              <nav className={`nav-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <a href="#home" className="nav-item" onClick={(e) => { e.preventDefault(); setView('home'); setIsMobileMenuOpen(false); }}>Home</a>
                <a href="#contest" className="nav-item" onClick={(e) => { e.preventDefault(); setView('contest-awards'); setIsMobileMenuOpen(false); }}>Contest Awards</a>
                <a href="#about" className="nav-item" onClick={(e) => { e.preventDefault(); setView('about'); setIsMobileMenuOpen(false); }}>Explore Elements</a>
                <a href="#referral" className="nav-item active" onClick={(e) => { e.preventDefault(); setView('referral-program'); setIsMobileMenuOpen(false); }}>Referral Program</a>
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
          
          <button 
            type="button" 
            className="hamburger-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {user ? (
            <nav className={`nav-menu dashboard-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
              <button 
                className="dash-nav-item active"
                onClick={() => { setView('home'); setIsMobileMenuOpen(false); }}
              >
                <Home size={16} /> Home
              </button>
              <button 
                className="dash-nav-item"
                onClick={() => { setView('dashboard'); setDashTab('portfolio'); setIsMobileMenuOpen(false); }}
              >
                <Briefcase size={16} /> Portfolio
              </button>
              <button 
                className="dash-nav-item"
                onClick={() => { setView('dashboard'); setDashTab('trade'); setIsMobileMenuOpen(false); }}
              >
                <ArrowRightLeft size={16} /> Trade
              </button>
              <button 
                className="dash-nav-item"
                onClick={() => { setView('dashboard'); setDashTab('wallet'); setIsMobileMenuOpen(false); }}
              >
                <Wallet size={16} /> Wallet
              </button>
              <button 
                className="dash-nav-item"
                onClick={() => { setView('dashboard'); setDashTab('contest'); setIsMobileMenuOpen(false); }}
              >
                <Star size={16} /> Contest
              </button>
              <button 
                className="dash-nav-item"
                onClick={() => { setView('about'); setIsMobileMenuOpen(false); }}
              >
                <Gem size={16} /> Explore Elements
              </button>
              <button 
                className="dash-nav-item"
                onClick={() => { setView('dashboard'); setDashTab('referral'); setIsMobileMenuOpen(false); }}
              >
                <Gift size={16} /> Referral Program
              </button>
              <button 
                className="dash-nav-item"
                onClick={() => { setView('dashboard'); setDashTab('profile'); setIsMobileMenuOpen(false); }}
              >
                <User size={16} /> Vault Profile
              </button>
              {user && (
                <div className="mobile-user-badge">
                  <div className="user-info-text">
                    <span className="user-email-text">{user.email}</span>
                    <span className="kyc-badge">{user.email === 'sandeepkumar.pikili@vrpigroup.co.in' ? 'ADMIN' : 'KYC SECURED'}</span>
                  </div>
                  <button type="button" className="btn-sec-signout" onClick={handleSignOut} title="Secure Sign Out">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </nav>
          ) : (
            <nav className={`nav-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
              <a href="#home" className="nav-item active" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); }}>Home</a>
              <a href="#contest" className="nav-item" onClick={(e) => { e.preventDefault(); setView('contest-awards'); setIsMobileMenuOpen(false); }}>Contest Awards</a>
              <a href="#about" className="nav-item" onClick={(e) => { e.preventDefault(); setView('about'); setIsMobileMenuOpen(false); }}>Explore Elements</a>
              <a href="#referral" className="nav-item" onClick={(e) => { e.preventDefault(); setView('referral-program'); setIsMobileMenuOpen(false); }}>Referral Program</a>
            </nav>
          )}
          {user ? (
            <div className="dash-user-badge">
              <div className="user-info-text">
                <span className="user-email-text">{user.email}</span>
                <span className="kyc-badge">{user.email === 'sandeepkumar.pikili@vrpigroup.co.in' ? 'ADMIN' : 'KYC SECURED'}</span>
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
                {!user ? (
                  <button type="button" className="btn-hero-primary" onClick={() => setView('auth')}>Proceed to Sign Up</button>
                ) : (
                  <button type="button" className="btn-hero-primary" onClick={() => { setView('dashboard'); setDashTab('portfolio'); }}>Go to Portfolio</button>
                )}
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

      {/* Winners Hall of Fame Section */}
      <section className="home-winners-section" style={{ padding: '80px 24px', background: '#0a0514', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ color: '#d9af56', fontSize: '13px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>🏆 Hall of Fame</span>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: 'var(--font-title)' }}>Tournament Winners Circle</h2>
            <p style={{ color: '#9c93a8', fontSize: '15px', maxWidth: '600px', margin: '12px auto 0', lineHeight: 1.6 }}>
              Congratulations to our top-performing traders! These champions demonstrated superior market analysis, disciplined risk management, and exceptional success rates to secure the leaderboard's top positions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }} className="grid-2col-winners">
            
            {/* Monthly Winners */}
            <div style={{ background: 'linear-gradient(135deg, rgba(29,13,53,0.3) 0%, rgba(12,6,21,0.5) 100%)', border: '1px solid rgba(217,175,86,0.15)', borderRadius: '16px', padding: '30px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#d9af56', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📅 Monthly Contest Champions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #d9af56, #a67c1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '800', fontSize: '20px' }}>🥇</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#fff' }}>{realtimeWinners[0]?.name || 'Position Open'}</div>
                    <div style={{ fontSize: '12px', color: '#9c93a8' }}>
                      {realtimeWinners[0] 
                        ? `Success Rate: ${realtimeWinners[0].successRate}% (₹1,00,000 Cash Winner)` 
                        : 'Join the contest to claim this rank!'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #c0c0c0, #7a7a7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '800', fontSize: '20px' }}>🥈</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#fff' }}>{realtimeWinners[1]?.name || 'Position Open'}</div>
                    <div style={{ fontSize: '12px', color: '#9c93a8' }}>
                      {realtimeWinners[1] 
                        ? `Success Rate: ${realtimeWinners[1].successRate}% (₹50,000 Cash Winner)` 
                        : 'Join the contest to claim this rank!'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #cd7f32, #8c4c1a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '800', fontSize: '20px' }}>🥉</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#fff' }}>{realtimeWinners[2]?.name || 'Position Open'}</div>
                    <div style={{ fontSize: '12px', color: '#9c93a8' }}>
                      {realtimeWinners[2] 
                        ? `Success Rate: ${realtimeWinners[2].successRate}% (₹25,000 Cash Winner)` 
                        : 'Join the contest to claim this rank!'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Winners */}
            <div style={{ background: 'linear-gradient(135deg, rgba(29,13,53,0.3) 0%, rgba(12,6,21,0.5) 100%)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '16px', padding: '30px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#a855f7', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                ⚡ Weekly Contest Champions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6c23b5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '16px' }}>💻</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#fff' }}>{realtimeWinners[3]?.name || 'Position Open'}</div>
                    <div style={{ fontSize: '12px', color: '#9c93a8' }}>
                      {realtimeWinners[3] 
                        ? `Success Rate: ${realtimeWinners[3].successRate}% (Gaming Laptop Winner)` 
                        : 'Join the contest to claim this rank!'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6c23b5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '16px' }}>📱</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#fff' }}>{realtimeWinners[4]?.name || 'Position Open'}</div>
                    <div style={{ fontSize: '12px', color: '#9c93a8' }}>
                      {realtimeWinners[4] 
                        ? `Success Rate: ${realtimeWinners[4].successRate}% (Smart Mobile Winner)` 
                        : 'Join the contest to claim this rank!'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6c23b5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '16px' }}>⌚</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#fff' }}>{realtimeWinners[5]?.name || 'Position Open'}</div>
                    <div style={{ fontSize: '12px', color: '#9c93a8' }}>
                      {realtimeWinners[5] 
                        ? `Success Rate: ${realtimeWinners[5].successRate}% (Smart Watch Winner)` 
                        : 'Join the contest to claim this rank!'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="home-about-section" style={{ padding: '80px 24px', background: '#060309', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="grid-2col-about" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', alignItems: 'center' }}>
            
            {/* Left: Beautiful brand presentation */}
            <div>
              <span style={{ color: '#d9af56', fontSize: '13px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>🔍 About Investhour</span>
              <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', margin: '0 0 16px 0', lineHeight: 1.2 }}>Accumulate Wealth, Learn Risk-Free</h2>
              <p style={{ color: '#9c93a8', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
                Investhour is a state-of-the-art financial simulation and precious metal vaulting portal designed to merge real-time financial literacy with physical asset building.
              </p>
              <p style={{ color: '#9c93a8', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
                Our mission is to help individuals transition from risky speculation to structured wealth accumulation. By providing risk-free paper trading environments paired with actual rewards and premium physically-backed metal portfolios, we offer a comprehensive system to secure your financial future.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="about-grid-metrics">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#d9af56', fontWeight: 'bold', fontSize: '18px' }}>✓</div>
                  <div>
                    <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '14px' }}>100% physically backed</h4>
                    <p style={{ color: '#9c93a8', margin: 0, fontSize: '12px' }}>Real asset vault custody</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#d9af56', fontWeight: 'bold', fontSize: '18px' }}>✓</div>
                  <div>
                    <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '14px' }}>No Entry Fees</h4>
                    <p style={{ color: '#9c93a8', margin: 0, fontSize: '12px' }}>Free weekly/monthly contests</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Security details */}
            <div style={{ background: 'linear-gradient(145deg, #150a21 0%, #0c0515 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '40px', boxShadow: 'var(--shadow-purple-glow)' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>Secure Trading Infrastructure</h3>
              <p style={{ color: '#9c93a8', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                We prioritize user vault security and transparent trade executions. Our backend maintains end-to-end encryption for client wallets, referral ledger updates, and automated contest rankings.
              </p>
              <ul style={{ color: '#9c93a8', fontSize: '13.5px', paddingLeft: '20px', lineHeight: 1.8, margin: 0, listStyleType: 'none' }}>
                <li style={{ marginBottom: '8px' }}>🔒 SSL-encrypted communication channels</li>
                <li style={{ marginBottom: '8px' }}>🏦 Institutional custodian vault partners</li>
                <li style={{ marginBottom: '8px' }}>💼 Automated payout mechanisms via RazorpayX</li>
                <li>📋 Clear, audited transaction ledgers and KYC compliance</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      <button type="button" className="help-fab" onClick={() => setIsChatOpen(true)}><HelpCircle size={18} /><span>Help?</span></button>

      {isChatOpen && (
        <div style={chatOverlayStyle}>
          <div style={chatPanelStyle}>
            <div style={chatHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={chatAvatarStyle}>IH</div>
                <div><div style={{ fontWeight: 700, fontSize: '14px' }}>Investhour Advisor</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {user && !user.isExecutive && (
                  <button 
                    type="button" 
                    onClick={handleRequestCallback}
                    style={{ 
                      background: 'rgba(217, 175, 86, 0.15)', 
                      color: '#d9af56', 
                      border: '1px solid rgba(217, 175, 86, 0.25)', 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Request a callback"
                  >
                    📞 Callback
                  </button>
                )}
                <button type="button" style={chatCloseBtnStyle} onClick={() => setIsChatOpen(false)}><X size={18} /></button>
              </div>
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
