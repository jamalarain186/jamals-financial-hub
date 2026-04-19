import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Handle login form submission
export function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Login successful – redirect to dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = getErrorMessage(error.code);
        }
    });
}

// Check if user is logged in, and fetch role from Firestore
export async function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                // Fetch user role from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    resolve({
                        uid: user.uid,
                        email: user.email,
                        ...userDoc.data()
                    });
                } else {
                    // If no user doc, assume employee role (fallback)
                    resolve({
                        uid: user.uid,
                        email: user.email,
                        role: 'employee',
                        name: user.email.split('@')[0]
                    });
                }
            } else {
                resolve(null);
            }
        }, reject);
    });
}

// Logout function
export async function logoutUser() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Create a new user (Admin only function – to be used in Admin panel later)
export async function createUserByAdmin(email, password, role, name) {
    try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Store user details in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            role: role,
            name: name,
            createdAt: new Date().toISOString()
        });
        
        return { success: true, user };
    } catch (error) {
        console.error('Admin user creation error:', error);
        throw error;
    }
}

// Helper to translate Firebase error codes
function getErrorMessage(code) {
    switch (code) {
        case 'auth/invalid-email': return 'Invalid email format.';
        case 'auth/user-disabled': return 'This account has been disabled.';
        case 'auth/user-not-found': return 'No account found with this email.';
        case 'auth/wrong-password': return 'Incorrect password.';
        case 'auth/email-already-in-use': return 'Email already registered.';
        default: return 'Login failed. Please try again.';
    }
}