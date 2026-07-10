import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC2fHiWNthfiftw7oW-EQ2Herr_tuluAVE",
  authDomain: "elite-fitness-2026.firebaseapp.com",
  projectId: "elite-fitness-2026",
  storageBucket: "elite-fitness-2026.firebasestorage.app",
  messagingSenderId: "830041954136",
  appId: "1:830041954136:web:8f6ca7d111fa9aff19372d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);