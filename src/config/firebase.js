import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDYaQDDtjFyppROt9VELTdV9WRmTv5Yg7k",
  authDomain: "warungin-81dbb.firebaseapp.com",
  projectId: "warungin-81dbb",
  storageBucket: "warungin-81dbb.firebasestorage.app",
  messagingSenderId: "506081431460",
  appId: "1:506081431460:web:51faaf60fcd2c9c33c3b31",
  measurementId: "G-YVEW8HP4ED",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(App);
