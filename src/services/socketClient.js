import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://hour-60kr.onrender.com');
const token = localStorage.getItem('vb_jwt_token') || localStorage.getItem('vb_token') || 'dummy-token-for-dev';

const socket = io(backendUrl, {
  autoConnect: false,
  transports: ['websocket'],
  auth: { token },
});

export default socket;
