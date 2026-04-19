// js/auth.js
import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// For admin user creation without affecting main session
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth as getSecondaryAuth, 
    createUserWithEmailAndPassword as secondaryCreateUser 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Get current user with role from Firestore
export async function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    resolve({ uid: user.uid, email: user.email, ...userDoc.data() });
                } else {
                    // Fallback: if no user doc, treat as employee with basic info
                    resolve({ uid: user.uid, email: user.email, role: 'employee', name: user.email.split('@')[0] });
                }
            } else {
                resolve(null);
            }
        }, reject);
    });
}

// Logout
export async function logoutUser() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Admin: Create new user without logging out the admin
export async function createUserByAdmin(email, password, role, name) {
    try {
        // Get the current Firebase app config
        const app = auth.app;
        const config = app.options;
        
        // Create a secondary app instance with same config
        const secondaryApp = initializeApp(config, 'Secondary');
        const secondaryAuth = getSecondaryAuth(secondaryApp);
        
        // Create user with secondary auth (doesn't affect main session)
        const userCredential = await secondaryCreateUser(secondaryAuth, email, password);
        const user = userCredential.user;
        
        // Store user details in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            role: role,
            name: name,
            createdAt: new Date().toISOString()
        });
        
        // Delete the secondary app to clean up
        await secondaryApp.delete();
        
        return { success: true, user };
    } catch (error) {
        console.error('Admin user creation error:', error);
        throw error;
    }
}