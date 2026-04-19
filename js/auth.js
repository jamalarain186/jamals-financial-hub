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

// Admin: Create new user without logging out admin
export async function createUserByAdmin(email, password, role, name) {
    let secondaryApp;
    let secondaryAuth;
    try {
        // Get the current Firebase app config
        const app = auth.app;
        const config = {
            apiKey: app.options.apiKey,
            authDomain: app.options.authDomain,
            projectId: app.options.projectId,
            storageBucket: app.options.storageBucket,
            messagingSenderId: app.options.messagingSenderId,
            appId: app.options.appId
        };
        
        // Create a secondary app instance
        const secondaryAppName = 'Secondary_' + Date.now();
        secondaryApp = initializeApp(config, secondaryAppName);
        secondaryAuth = getSecondaryAuth(secondaryApp);
        
        // Create the user with the secondary auth
        const userCredential = await secondaryCreateUser(secondaryAuth, email, password);
        const user = userCredential.user;
        
        // Sign out from the secondary app (important)
        await secondaryAuth.signOut();
        
        // Now use the PRIMARY db (admin's session) to write the user document
        // This will succeed because the primary auth is still the admin
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            role: role,
            name: name,
            createdAt: new Date().toISOString()
        });
        
        console.log('✅ User document created in Firestore for', email);
        
        // Delete the secondary app to clean up
        await secondaryApp.delete();
        
        return { success: true, user };
    } catch (error) {
        console.error('Admin user creation error:', error);
        // Attempt to clean up
        if (secondaryApp) {
            try { await secondaryApp.delete(); } catch (e) {}
        }
        throw error;
    }
}