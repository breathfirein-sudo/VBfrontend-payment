import React, { useState, useEffect } from 'react';
import { createOrder, verifyPayment } from '../../services/paymentService';
import { Plus, Minus, Loader2 } from 'lucide-react';

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RazorpayButton = ({ amount, type, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      alert(`Please enter a valid amount to ${type}.`);
      return;
    }

    if (type === 'deposit') {
      if (amount < 100) {
        alert("Minimum deposit amount is ₹100");
        return;
      }
      if (amount > 10000) {
        alert("Maximum deposit amount is ₹10000");
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Create order on our backend
      const orderData = await createOrder(amount, type);

      if (!orderData.success) {
        throw new Error('Failed to initiate transaction');
      }

      // If it's a withdrawal, it auto-completes in the backend (simulation)
      if (type === 'withdraw') {
        const upiId = window.prompt("Please enter your UPI ID or Bank Account Number to receive the withdrawal:");
        
        if (!upiId) {
          alert("Withdrawal cancelled. You must provide a valid UPI ID or Bank Account.");
          setLoading(false);
          return;
        }

        // Simulate a tiny processing delay for realism
        await new Promise(resolve => setTimeout(resolve, 800));

        alert(`Successfully initiated withdrawal of ₹${amount} to ${upiId}. Funds deducted from wallet and will arrive in 24 hours.`);
        if (onSuccess) onSuccess(orderData);
        setLoading(false);
        return;
      }

      // 2. Setup Razorpay Checkout options for deposit
      const options = {
        key: orderData.keyId, // Using the key provided by the backend
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Investhour Secure Wallet',
        description: 'Fund Deposit',
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // 3. Verify payment signature on backend
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResult.success) {
              alert('Payment successful! Funds added to your wallet.');
              if (onSuccess) onSuccess(verifyResult);
            } else {
              alert('Payment verification failed.');
              if (onError) onError('Verification failed');
            }
          } catch (err) {
            console.error(err);
            alert('Error verifying payment.');
            if (onError) onError(err);
          }
        },
        prefill: {
          name: 'Investhour Customer',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#10b981' // Matching Investhour's green theme for deposits
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        console.error(response.error);
        alert(`Payment failed: ${response.error.description}`);
        if (onError) onError(response.error);
      });
      
      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || `Error processing ${type}. Please try again.`);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  const isDeposit = type === 'deposit';

  return (
    <button 
      onClick={handlePayment} 
      disabled={loading}
      className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${
        isDeposit 
        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 border border-emerald-400/30'
        : 'bg-[#120524] text-white border border-[rgba(255,255,255,0.1)] hover:bg-[#1a0b2e]'
      }`}
      style={{
        background: isDeposit ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#120524',
        border: isDeposit ? 'none' : '1px solid rgba(255,255,255,0.1)',
        padding: '16px',
        width: '100%',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 'bold',
        color: '#fff',
        cursor: loading ? 'not-allowed' : 'pointer',
        marginTop: '15px'
      }}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isDeposit ? (
        <Plus size={16} />
      ) : (
        <Minus size={16} />
      )}
      {loading ? 'Processing...' : isDeposit ? 'Deposit Funds Securely' : 'Withdraw Funds'}
    </button>
  );
};

export default RazorpayButton;
