import axios from 'axios';
import { auth } from '../firebase';

const API_BASE_URL = 'http://localhost:5000/api/payments';

const getAuthHeaders = async () => {
  let token = 'dummy-token-for-dev';
  try {
    if (auth && auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    } else {
      // Fallback for super admin local test
      const savedClients = localStorage.getItem('vb_clients');
      if (savedClients) {
         // just a hacky fallback if Firebase isn't initialized but we have local state
      }
    }
  } catch (e) {
    console.error("Error getting auth token", e);
  }
  
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
