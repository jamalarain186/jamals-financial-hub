// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
// 🔴 REPLACE THIS OBJECT WITH YOUR ACTUAL CONFIG FROM FIREBASE CONSOLE
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAiRfms1zpYprktorksh6l5_pnIQRrO89I",
  authDomain: "jamalfinancialhub-a05f9.firebaseapp.com",
  databaseURL: "https://jamalfinancialhub-a05f9-default-rtdb.firebaseio.com",
  projectId: "jamalfinancialhub-a05f9",
  storageBucket: "jamalfinancialhub-a05f9.firebasestorage.app",
  messagingSenderId: "855943300849",
  appId: "1:855943300849:web:8095b63b4a7949cdd40b50",
  measurementId: "G-YN0LW2VQH6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence (data saves on phone)
enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Offline persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Browser doesn\'t support offline persistence');
        }
    });

export { auth, db };