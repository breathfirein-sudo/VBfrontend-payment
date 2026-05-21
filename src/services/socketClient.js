import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const token = localStorage.getItem('vb_token');

const socket = io(backendUrl, {
  autoConnect: false,
  transports: ['websocket'],
  auth: { token },
});

export default socket;
