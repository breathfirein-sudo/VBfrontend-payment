import React, { useState, useEffect, useRef } from 'react';
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
  Download,
  Check,
  Lock,
  RefreshCw,
  CreditCard,
  Gem
} from 'lucide-react';
import heroGoldOre from './assets/hero_gold_ore.png';
import './App.css';
import AboutUs from './AboutUs';
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

  // --- Core Application States ---
  const [rates, setRates] = useState(() => createAllMetalRates(INITIAL_RATES));
  const [activeAsset, setActiveAsset] = useState('gold');
  const [activeAction, setActiveAction] = useState('buy');
  const [rupees, setRupees] = useState('');
  const [grams, setGrams] = useState('');
  const [lastEdited, setLastEdited] = useState('rupees'); // 'rupees' or 'grams'


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
    { sender: 'bot', text: 'Hello! Welcome to VB. How can I help you invest in precious metals today?' }
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
              transactions
            };
          }
          return c;
        });
        localStorage.setItem('vb_clients', JSON.stringify(next));
        return next;
      });
    }
  }, [walletBalance, holdings, transactions, user]);

  // Load client stats from clients database upon successful login
  useEffect(() => {
    if (user && user.email !== 'shivaram33987@gmail.com') {
      const match = clients.find(c => c.email.toLowerCase() === user.email.toLowerCase());
      if (match) {
        setWalletBalance(match.walletBalance);
        setHoldings(match.holdings);
        setTransactions(match.transactions);
      } else {
        const cRecord = {
          id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          phone: '',
          walletBalance: 0,
          holdings: {},
          kycStatus: 'Pending',
          transactions: []
        };
        setClients(prev => {
          const next = [...prev, cRecord];
          localStorage.setItem('vb_clients', JSON.stringify(next));
          return next;
        });
        setWalletBalance(cRecord.walletBalance);
        setHoldings(cRecord.holdings);
        setTransactions(cRecord.transactions);
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
      alert("Please enter a valid amount or metal weight.");
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
      const finalRupees = parseFloat(rupees) || modalData.subtotal || 0;
      const finalGrams = parseFloat(grams) || modalData.weight || 0;
      const asset = modalData.asset;
      const action = modalData.action;

      if (action === 'buy') {
        const gst = finalRupees * 0.18;
        const totalCost = finalRupees + gst;
        if (walletBalance < totalCost) {
          alert("Insufficient funds in your vault wallet. Please deposit funds first.");
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
      const response = await fetch("http://localhost:5000/api/auth/send-otp", {
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
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
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
        setOtpError(data.error || "Invalid OTP code. Please check your Gmail or resend code.");
        return;
      }

      console.log("[Backend OTP Verify] Verification successful.");

      // OTP Verified! Log user in
      if (authForm.email.toLowerCase() === 'shivaram33987@gmail.com' && authForm.password === 'Shiva@143') {
        alert("OTP Verified Successfully! Welcoming Super Admin to VB Commodity Vault Monitor.");
        setUser({ email: 'shivaram33987@gmail.com', uid: 'admin-super-uid', displayName: 'Super Admin' });
        setView('dashboard');
        setOtpStep('login');
        return;
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        alert(`OTP Verified Successfully! Welcoming you to your vault: ${userCredential.user.email}`);
        setView('dashboard');
        setOtpStep('login');
      } catch (error) {
        let errMsg = error.message;
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          errMsg = "Invalid credentials. Please verify your vault key.";
        } else if (error.code === 'auth/invalid-email') {
          errMsg = "Invalid email format. Please enter a valid email address.";
        } else if (error.code === 'auth/configuration-not-found') {
          errMsg = "Configuration Not Found! Please make sure Email/Password provider is enabled in the Firebase Console.";
        }
        setOtpError(`Vault Access Denied: ${errMsg}`);
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
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
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
        let errMsg = error.message;
        if (error.code === 'auth/email-already-in-use') {
          errMsg = "This email is already associated with an active vault.";
        } else if (error.code === 'auth/weak-password') {
          errMsg = "Weak key! Password must be at least 6 characters.";
        } else if (error.code === 'auth/configuration-not-found') {
          errMsg = "Configuration Not Found! Please make sure Email/Password provider is enabled in the Firebase Console.";
        }
        setOtpError(`Registration Failed: ${errMsg}`);
      }
    } catch (err) {
      console.error("Backend OTP Verify Error:", err);
      setOtpError(`Server Verification Error: ${err.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setView('home');
      alert("Vault secured and session terminated successfully.");
    } catch (error) {
      setUser(null);
      setView('home');
      alert("Sign out session secured.");
    }
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
        reply = "SIP (Systematic Investment Plan) with VB is an elegant way to accumulate gold or silver daily. You can start with as little as ₹10 per day!";
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
            <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', color: '#ffffff', fontWeight: 800, padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                VB
              </div>
              <div>
                <span className="logo-text" style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', display: 'block' }}>VB Exchange</span>
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

          {/* Main Content Workspace Split */}
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
                                      const response = await fetch("http://localhost:5000/api/admin/delete-user", {
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

        </main>

        <footer style={{ background: '#120524', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#9c93a8', marginTop: 'auto' }}>
          © 2026 VB Digital Commodities Exchange. Secure Master Administrative Access Console.
        </footer>
      </div>
    );
  }

  if (view === 'dashboard') {
    const goldVal = holdings.gold * rates.gold.price;
    const silverVal = holdings.silver * rates.silver.price;
    const totalValuation = goldVal + silverVal + walletBalance;

    return (
      <div id="root" className="dashboard-page-view animate-fade-in">
        {/* Dashboard Header */}
        <header className="header">
          <div className="container nav-container">
            <div className="logo-section">
              <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #d9af56 0%, #8c713b 100%)', color: '#120524', fontWeight: 800 }}>
                VB
              </div>
              <span className="logo-text" style={{ letterSpacing: '1.2px', fontSize: '20px', fontWeight: '800' }}>VB</span>
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
                className="dash-nav-item"
                onClick={() => setView('about')}
              >
                <Gem size={16} /> About Us
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
                <span className="ticker-val">₹{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`ticker-change ${data.change >= 0 ? 'up' : 'down'}`}>
                  {data.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.pct >= 0 ? '+' : ''}{data.pct.toFixed(2)}%)
                </span>
              </div>
            ))}
            {/* Duplicate for scrolling */}
            {Object.entries(rates).map(([key, data]) => (
              <div className="ticker-item" key={`dash-t2-${key}`}>
                <span className="ticker-name">{key}</span>
                <span className="ticker-val">₹{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`ticker-change ${data.change >= 0 ? 'up' : 'down'}`}>
                  {data.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.pct >= 0 ? '+' : ''}{data.pct.toFixed(2)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Views Container */}
        <main className="dashboard-content container">
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
                  <div className="holding-weight">{holdings.gold.toFixed(4)} <span className="grams-lbl">g</span></div>
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
                  <div className="holding-weight">{holdings.silver.toFixed(4)} <span className="grams-lbl">g</span></div>
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
            <div className="tab-pane-view trade-view animate-fade-in">
              <div className="grid-2col trade-layout-grid">
                <div className="live-trend-card">
                  <div className="trend-card-header">
                    <div className="trend-meta">
                      <h3>{getAssetLabel(activeAsset)} Market Dynamics</h3>
                      <span className="live-pricing-tag">{'\u20b9'}{rates[activeAsset].price.toFixed(2)}/g</span>
                    </div>
                    <button type="button" className="btn-refresh" onClick={() => alert('Market rates refreshed live.')}><RefreshCw size={14} /></button>
                  </div>
                  <div className="mock-chart-container">
                    <div className="chart-toolbar">
                      <div className="chart-toolbar-left">
                        <span className="ticker-chip">TSLA · 4h</span>
                        <span className="chart-label">TradingView</span>
                      </div>
                      <button type="button" className="btn-chart-trade">Trade</button>
                    </div>
                    <svg viewBox="0 0 400 180" className="mock-svg-chart">
                      <defs>
                        <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <rect x="0" y="0" width="400" height="180" fill="url(#gridFade)" />
                      <g stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1">
                        <line x1="20" y1="30" x2="380" y2="30" />
                        <line x1="20" y1="60" x2="380" y2="60" />
                        <line x1="20" y1="90" x2="380" y2="90" />
                        <line x1="20" y1="120" x2="380" y2="120" />
                        <line x1="20" y1="150" x2="380" y2="150" />
                      </g>
                      <g fill="#d9af56" opacity="0.9">
                        <rect x="52" y="95" width="10" height="40" rx="2" />
                        <rect x="86" y="65" width="10" height="70" rx="2" />
                        <rect x="120" y="83" width="10" height="52" rx="2" />
                        <rect x="154" y="58" width="10" height="77" rx="2" />
                        <rect x="188" y="72" width="10" height="63" rx="2" />
                        <rect x="222" y="45" width="10" height="90" rx="2" />
                        <rect x="256" y="68" width="10" height="67" rx="2" />
                        <rect x="290" y="85" width="10" height="50" rx="2" />
                        <rect x="324" y="55" width="10" height="80" rx="2" />
                      </g>
                      <path d="M 24,150 L 52,135 L 86,120 L 120,132 L 154,108 L 188,122 L 222,96 L 256,118 L 290,104 L 324,86 L 376,52"
                            fill="none" stroke="#f9d97c" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="market-stats-grid">
                    <div className="m-stat"><span className="stat-label">Daily Range</span><span className="stat-val">{'\u20b9'}{(rates[activeAsset].price * 0.985).toFixed(2)} - {'\u20b9'}{(rates[activeAsset].price * 1.012).toFixed(2)}</span></div>
                    <div className="m-stat"><span className="stat-label">24h Vol</span><span className="stat-val">84.28 kg</span></div>
                    <div className="m-stat"><span className="stat-label">GST Tax</span><span className="stat-val">18.0% standard</span></div>
                    <div className="m-stat"><span className="stat-label">Vaulting</span><span className="stat-val">Fully Insured</span></div>
                  </div>
                </div>
                <div className="widget-column">
                  <div className="trade-card dash-trade-card">
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', borderBottom: '1px solid rgba(18, 5, 36, 0.08)', paddingBottom: '10px' }}>
                        <div className="form-label" style={{ color: '#120524', margin: 0, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Wallet Balance:</span>
                          <span style={{ fontSize: '15px', color: '#10b981' }}>{'\u20b9'}{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ color: '#4a3764', fontSize: '12.5px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Vault Holdings ({getAssetLabel(activeAsset)}):</span>
                          <span style={{ color: '#b88e36', fontWeight: 700 }}>{(holdings[activeAsset] ?? 0).toFixed(4)} g</span>
                        </div>
                        <div style={{ color: '#7a6a90', fontSize: '11px', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Holdings Value:</span>
                          <span>{'\u20b9'}{((holdings[activeAsset] || 0) * rates[activeAsset].price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                          <button key={amount} type="button" className="pill-btn" onClick={() => handleQuickPill(amount)}>{'\u20b9'}{amount}</button>
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
                    <div className="card-top-row">
                      <span className="vault-acc-id">VB SECURE WALLET</span>
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
                        <button type="button" className="btn-funding-submit deposit" onClick={() => {
                          const val = parseFloat(depositAmount);
                          if (isNaN(val) || val <= 0) { alert('Please enter a valid deposit amount.'); return; }
                          setWalletBalance((prev) => parseFloat((prev + val).toFixed(2)));
                          setTransactions((prev) => [{ id: `TX-${Math.floor(1000 + Math.random() * 9000)}`, type: 'deposit', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                          setDepositAmount('');
                          alert(`Success! Deposited \u20b9${val.toLocaleString()} to your secure wallet.`);
                        }}><Plus size={16} /> Deposit Funds</button>
                      </div>
                      <div className="funding-input-group">
                        <label>Withdraw Amount (INR)</label>
                        <div className="funding-input-field-wrapper">
                          <span className="currency-symbol">{'\u20b9'}</span>
                          <input type="number" placeholder="Enter amount to withdraw" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                        </div>
                        <button type="button" className="btn-funding-submit withdraw" onClick={() => {
                          const val = parseFloat(withdrawAmount);
                          if (isNaN(val) || val <= 0) { alert('Please enter a valid withdrawal amount.'); return; }
                          if (walletBalance < val) { alert('Insufficient balance in your secure wallet.'); return; }
                          setWalletBalance((prev) => parseFloat((prev - val).toFixed(2)));
                          setTransactions((prev) => [{ id: `TX-${Math.floor(1000 + Math.random() * 9000)}`, type: 'withdrawal', asset: 'wallet', amount: val, weight: 0, date: new Date().toISOString().slice(0, 16).replace('T', ' '), status: 'Completed' }, ...prev]);
                          setWithdrawAmount('');
                          alert(`Success! Initiated withdrawal of \u20b9${val.toLocaleString()} to verified bank account.`);
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

          {dashTab === 'profile' && (
            <div className="tab-pane-view profile-view animate-fade-in">
              <div className="profile-dashboard-layout">
                <div className="profile-security-badge-card">
                  <div className="security-icon-shield"><Shield size={42} className="shield-glow" /></div>
                  <h3>Verified Vault Account</h3>
                  <p className="profile-desc-p">Your digital assets are 100% physically stored in hyper-secure vaults and backed by a 1-to-1 ratio.</p>
                  <div className="security-credentials-list">
                    <div className="cred-row"><span>Vault Identifier</span><strong>VB-958204-A</strong></div>
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
                      <input type="text" readOnly value="VB-SESSION-73019A" className="profile-readonly-input" />
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
        </main>

        <footer style={{ background: '#120524', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#9c93a8', marginTop: 'auto' }}>
          {'\u00a9'} 2026 VB Digital Commodities Exchange. Secure Vault Access.
        </footer>

        <button type="button" className="help-fab" onClick={() => setIsChatOpen(true)}><HelpCircle size={18} /><span>Help?</span></button>

        {isChatOpen && (
          <div style={chatOverlayStyle}>
            <div style={chatPanelStyle}>
              <div style={chatHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={chatAvatarStyle}>VB</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>VB Advisor</div>
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
              <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #d9af56 0%, #8c713b 100%)', color: '#120524', fontWeight: 800 }}>VB</div>
              <span className="logo-text" style={{ letterSpacing: '1.2px', fontSize: '20px', fontWeight: '800' }}>VB</span>
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

  if (view === 'about') {
    return (
      <div id="root">
        <header className="header">
          <div className="container nav-container">
            <div className="logo-section" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
              <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #d9af56 0%, #8c713b 100%)', color: '#120524', fontWeight: 800 }}>VB</div>
              <span className="logo-text" style={{ letterSpacing: '1.2px', fontSize: '20px', fontWeight: '800' }}>VB</span>
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
        <AboutUs rates={rates} holdings={holdings} walletBalance={walletBalance} isLoggedIn={!!user} onRequireAuth={() => setView('auth')} onTradeRequest={handleAboutTradeRequest} />
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

  const renderTickerItems = (prefix) =>
    PORTAL_TRADE_ASSETS.flatMap((asset) => {
      const data = rates[asset];
      return [
        <div className="ticker-item" key={`${prefix}-${asset}-1`}>
          <span className="ticker-name">{getAssetLabel(asset)}</span>
          <span className="ticker-val">{'\u20b9'}{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className={`ticker-change ${data.change >= 0 ? 'up' : 'down'}`}>
            {data.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.pct >= 0 ? '+' : ''}{data.pct.toFixed(2)}%)
          </span>
        </div>,
        <div className="ticker-item" key={`${prefix}-${asset}-2`}>
          <span className="ticker-name">{getAssetLabel(asset)}</span>
          <span className="ticker-val">{'\u20b9'}{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className={`ticker-change ${data.change >= 0 ? 'up' : 'down'}`}>
            {data.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.pct >= 0 ? '+' : ''}{data.pct.toFixed(2)}%)
          </span>
        </div>,
      ];
    });

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
                <div style={chatAvatarStyle}>VB</div>
                <div><div style={{ fontWeight: 700, fontSize: '14px' }}>VB Advisor</div></div>
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
