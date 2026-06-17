import React, { useState, useEffect } from 'react';
import { createOrder, verifyPayment } from '../../services/paymentService';
import { Plus, Minus, Loader2, Lock } from 'lucide-react';

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RazorpayButton = ({ amount, type, onSuccess, onError, payoutDetails }) => {
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
      if (amount > 100000) {
        alert("Maximum deposit amount is ₹1,00,000");
        return;
      }
    }

    if (type === 'withdraw') {
      if (amount < 500) {
        alert("Minimum withdrawal amount is ₹500");
        return;
      }
    }

    setLoading(true);
    try {
      let detailsToSend = null;

      // If it's a withdrawal, ensure payoutDetails are provided
      if (type === 'withdraw') {
        if (!payoutDetails) {
          alert("Please fill out all the required withdrawal payout details (Bank Account).");
          setLoading(false);
          return;
        }
        detailsToSend = payoutDetails;
      }

      // 1. Create order on our backend
      const orderData = await createOrder(amount, type, detailsToSend);

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to initiate transaction');
      }

      if (type === 'withdraw') {
        alert(`Successfully initiated withdrawal of ₹${amount} via Razorpay! Payout ID: ${orderData.payoutId || 'N/A'}`);
        if (onSuccess) onSuccess(orderData);
        setLoading(false);
        return;
      }

      const isDummyKey = !orderData.keyId || orderData.keyId === 'rzp_test_simulated';

      if (orderData.simulated && isDummyKey) {
        const confirmPay = window.confirm(
          type === 'unlock'
            ? `Simulated Unlock Fallback:\nWould you like to simulate a successful account unlock payment of ₹${amount}?`
            : `Simulated Deposit Fallback:\nWould you like to simulate a successful payment of ₹${amount}?`
        );
        if (confirmPay) {
          try {
            const verifyResult = await verifyPayment({
              razorpay_order_id: orderData.orderId,
              razorpay_payment_id: `pay_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              razorpay_signature: 'simulated_signature',
            });

            if (verifyResult.success) {
              alert(
                type === 'unlock'
                  ? 'Payment successful (Simulated)! Your account is now unlocked.'
                  : 'Payment successful (Simulated)! Funds added to your wallet.'
              );
              if (onSuccess) onSuccess(verifyResult);
            } else {
              alert('Simulated payment verification failed.');
              if (onError) onError('Simulated verification failed');
            }
          } catch (err) {
            console.error(err);
            alert('Error verifying simulated payment.');
            if (onError) onError(err);
          }
        } else {
          alert(type === 'unlock' ? 'Unlock transaction cancelled.' : 'Deposit transaction cancelled.');
          if (onError) onError('Cancelled');
        }
        setLoading(false);
        return;
      }

      // 2. Setup Razorpay Checkout options for deposit/unlock
      const options = {
        key: orderData.keyId, // Using the key provided by the backend
        amount: orderData.amount,
        currency: orderData.currency,
        name: type === 'unlock' ? 'Investhour Vault Unlock' : 'Investhour Secure Wallet',
        description: type === 'unlock' ? 'Setup & Account Opening Fee' : 'Fund Deposit',
        order_id: orderData.simulated ? undefined : orderData.orderId, // Omit order_id if standard checkout fallback
        handler: async (response) => {
          try {
            // 3. Verify payment signature on backend
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id || orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || 'standard_bypass',
            });

            if (verifyResult.success) {
              alert(
                type === 'unlock'
                  ? 'Payment successful! Your account is now unlocked.'
                  : 'Payment successful! Funds added to your wallet.'
              );
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
          color: '#10b981' // Matching Investhour's green theme
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI QR",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr"]
                  }
                ]
              }
            },
            sequence: ["block.upi"],
            preferences: {
              show_default_blocks: false
            }
          }
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
      const errMsg = error.response?.data?.error || `Error processing ${type}. Please try again.`;
      const errDetails = error.response?.data?.details ? `\nDetails: ${error.response.data.details}` : '';
      alert(errMsg + errDetails);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  const isDeposit = type === 'deposit';
  const isUnlock = type === 'unlock';
  const isGreenBtn = isDeposit || isUnlock;

  return (
    <button 
      onClick={handlePayment} 
      disabled={loading}
      className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${
        isGreenBtn 
        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 border border-emerald-400/30'
        : 'bg-[#120524] text-white border border-[rgba(255,255,255,0.1)] hover:bg-[#1a0b2e]'
      }`}
      style={{
        background: isGreenBtn ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #1c0a30 0%, #120524 100%)',
        border: isGreenBtn ? 'none' : '1px solid rgba(217, 175, 86, 0.4)',
        padding: '16px',
        width: '100%',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 'bold',
        color: isGreenBtn ? '#fff' : '#d9af56',
        cursor: loading ? 'not-allowed' : 'pointer',
        marginTop: '15px',
        boxShadow: isGreenBtn ? '0 4px 14px rgba(16, 185, 129, 0.3)' : '0 4px 14px rgba(217, 175, 86, 0.15)',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isUnlock ? (
        <Lock size={16} />
      ) : isDeposit ? (
        <Plus size={16} />
      ) : (
        <Minus size={16} />
      )}
      {loading ? 'Processing...' : isUnlock ? 'Pay ₹10 to Unlock Instantly' : isDeposit ? 'Deposit Funds Securely' : 'Withdraw Funds'}
    </button>
  );
};

export default RazorpayButton;
