import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "TUMHARI_API_KEY",
  authDomain: "tumhara-project.firebaseapp.com",
  projectId: "tumhara-project",
  storageBucket: "tumhara-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Database)
export const db = getFirestore(app);