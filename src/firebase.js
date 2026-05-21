import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// --- Firebase Web App Configuration ---
// Replace the values below with your actual Firebase project settings
// You can retrieve these from the Firebase Console (Project Settings > General)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY_PLACEHOLDER",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN_PLACEHOLDER",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID_PLACEHOLDER",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID_PLACEHOLDER"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize & Export Firebase Auth Service
export const auth = getAuth(app);
