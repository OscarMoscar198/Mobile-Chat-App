// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA5YGx2e4qY2ZzoLWvmz6zCIAkXloChjjw",
  authDomain: "chat-app-1868c.firebaseapp.com",
  projectId: "chat-app-1868c",
  storageBucket: "chat-app-1868c.appspot.com",
  messagingSenderId: "849038947483",
  appId: "1:849038947483:web:9fefdc709d2f1c6f1c023e"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth()
export const database = getFirestore()
export const storage = getStorage(app);