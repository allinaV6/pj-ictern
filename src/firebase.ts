import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCndXDnZj0oC9WtyFtMEXjZtLyk4V81GNM",
  authDomain: "ictern.firebaseapp.com",
  projectId: "ictern",
  storageBucket: "ictern.firebasestorage.app",
  messagingSenderId: "966364009617",
  appId: "1:966364009617:web:3187f7005659fea7519b30",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);