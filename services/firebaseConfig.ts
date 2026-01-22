import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBHB-iyejHZGxqx9EnYETFXVmAjsUwk1Nc",
  authDomain: "czat1-67a33.firebaseapp.com",
  projectId: "czat1-67a33",
  storageBucket: "czat1-67a33.firebasestorage.app",
  messagingSenderId: "134730589715",
  appId: "1:134730589715:web:5f86dd75a19baac4aa41e6",
  measurementId: "G-RLH95M2WF3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
