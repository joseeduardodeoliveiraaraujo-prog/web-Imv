import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA_DoXMAn_YkioilGUn7YmB1t_pyC97MQw",
  authDomain: "login-cert-imv.firebaseapp.com",
  projectId: "login-cert-imv",
  storageBucket: "login-cert-imv.firebasestorage.app",
  messagingSenderId: "1091678652290",
  appId: "1:1091678652290:web:66b34bb1df74c9f132b19b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
