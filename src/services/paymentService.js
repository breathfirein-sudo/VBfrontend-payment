import axios from 'axios';
import { getAuthToken } from '../utils/authHelper';

const backendUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://hour-60kr.onrender.com');
const API_BASE_URL = `${backendUrl}/api/payments`;

const getAuthHeaders = async () => {
  let localUser = null;
  const saved = localStorage.getItem('vb_local_user');
  if (saved) {
    try {
      localUser = JSON.parse(saved);
    } catch (e) {}
  }
  
  const token = await getAuthToken(localUser);
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const createOrder = async (amount, type = 'deposit', payoutDetails = null) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/create-order`, { amount, currency: 'INR', type, payoutDetails }, headers);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/verify-payment`, paymentData, headers);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

export const getPaymentHistory = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(API_BASE_URL, headers);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};
