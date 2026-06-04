import axios from 'axios';
import { auth } from '../firebase';
import { getAuthToken } from '../utils/authHelper';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/payments`;

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

export const createOrder = async (amount, type = 'deposit') => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/create-order`, { amount, currency: 'INR', type }, headers);
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
