import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const token = localStorage.getItem('vb_jwt_token') || localStorage.getItem('vb_token') || 'dummy-token-for-dev';

const socket = io(backendUrl, {
  autoConnect: false,
  transports: ['websocket'],
  auth: { token },
});

export default socket;
