// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// --- TAMBAHKAN IMPORT INI ---
import { getFirestore, serverTimestamp } from "firebase/firestore";
// --- AKHIR TAMBAH IMPORT ---


const firebaseConfig = {
  apiKey: "AIzaSyDYaQDDtjFyppROt9VELTdV9WRmTv5Yg7k",
  authDomain: "warungin-81dbb.firebaseapp.com",
  projectId: "warungin-81dbb",
  storageBucket: "warungin-81dbb.firebasestorage.app",
  messagingSenderId: "506081431460",
  appId: "1:506081431460:web:51faaf60fcd2c9c33c3b31",
  measurementId: "G-YVEW8HP4ED",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); //analytics tetap diinisialisasi jika Anda menggunakannya

// Get services
// --- PERBAIKI TYPO DAN TAMBAHKAN INISIALISASI/EKSPOR DB ---
export const auth = getAuth(app); // Perbaiki dari 'App' menjadi 'app'
export const db = getFirestore(app); // Inisialisasi Firestore
export { serverTimestamp }; // Ekspor serverTimestamp agar bisa digunakan di service
// --- AKHIR PERBAIKAN/TAMBAHAN ---

// Anda bisa tetap mengekspor analytics jika diperlukan di bagian lain aplikasi
// export { analytics };