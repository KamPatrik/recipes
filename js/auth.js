// ========================================
// FIREBASE CONFIGURATION
// ========================================
const firebaseConfig = {
    apiKey: "AIzaSyB-FVTdXaEN4qb5Mm0QqJGaWHpbet5gq-8",
    authDomain: "datable-8dc0e.firebaseapp.com",
    projectId: "datable-8dc0e",
    storageBucket: "datable-8dc0e.firebasestorage.app",
    messagingSenderId: "958208191519",
    appId: "1:958208191519:web:4c008a8bb4680ccf59b92a",
    measurementId: "G-TPQM66P7NR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ========================================
// AUTH STATE OBSERVER
// ========================================
auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
        // User is signed in
        console.log('User signed in:', user.email);
        
        // Redirect to dashboard if on login page
        if (currentPage === 'index.html' || currentPage === '') {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is signed out
        console.log('User signed out');
        
        // Redirect to login if on protected page
        if (currentPage === 'dashboard.html') {
            window.location.href = 'index.html';
        }
    }
});

// ========================================
// SIGNUP FUNCTION
// ========================================
async function signUp(email, password, displayName) {
    try {
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        await user.updateProfile({
            displayName: displayName
        });
        
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            email: email,
            displayName: displayName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            stravaConnected: false,
            lastSync: null
        });
        
        console.log('User created successfully:', user.uid);
        return user;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

// ========================================
// LOGIN FUNCTION
// ========================================
async function login(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('User logged in:', userCredential.user.email);
        return userCredential.user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// ========================================
// LOGOUT FUNCTION
// ========================================
async function logout() {
    try {
        const user = auth.currentUser;
        
        // Clear IndexedDB cache before logging out
        if (user && typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
            console.log('🗑️ Clearing cache on logout...');
            await cacheDB.clearUserCache(user.uid);
        }
        
        await auth.signOut();
        console.log('User logged out');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}

// ========================================
// GET CURRENT USER
// ========================================
function getCurrentUser() {
    return auth.currentUser;
}

// ========================================
// GET USER DATA FROM FIRESTORE
// ========================================
async function getUserData(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            return doc.data();
        } else {
            throw new Error('User document not found');
        }
    } catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
}

// ========================================
// UPDATE USER DATA
// ========================================
async function updateUserData(userId, data) {
    try {
        await db.collection('users').doc(userId).update(data);
        console.log('User data updated');
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
}

// ========================================
// EVENT LISTENERS FOR AUTH FORMS
// ========================================
if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');
            
            try {
                errorDiv.textContent = '';
                await login(email, password);
                // Redirect happens automatically in onAuthStateChanged
            } catch (error) {
                let errorMessage = 'Login failed. Please try again.';
                if (error.code === 'auth/user-not-found') {
                    errorMessage = 'No account found with this email.';
                } else if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Incorrect password.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Invalid email address.';
                }
                errorDiv.textContent = errorMessage;
            }
        });
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const displayName = document.getElementById('signup-name').value;
            const errorDiv = document.getElementById('signup-error');
            
            try {
                errorDiv.textContent = '';
                await signUp(email, password, displayName);
                // Redirect happens automatically in onAuthStateChanged
            } catch (error) {
                let errorMessage = 'Signup failed. Please try again.';
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'An account with this email already exists.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Invalid email address.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Password should be at least 6 characters.';
                }
                errorDiv.textContent = errorMessage;
            }
        });
    }
}

// ========================================
// GLOBAL USER NAME & PROFILE IMAGE UPDATE
// ========================================
// Update user name and profile image display on all pages
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            // Try to get Strava profile data from Firestore
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                
                if (userData && userData.stravaProfile) {
                    // Use Strava name if available
                    userNameEl.textContent = userData.stravaProfile.firstname + ' ' + userData.stravaProfile.lastname;
                    
                    // Add profile image if available
                    const navUser = document.querySelector('.nav-user');
                    if (navUser && userData.stravaProfile.profile) {
                        // Check if profile image already exists
                        let profileImg = document.getElementById('profile-img');
                        if (!profileImg) {
                            profileImg = document.createElement('img');
                            profileImg.id = 'profile-img';
                            profileImg.className = 'profile-img';
                            profileImg.alt = 'Profile';
                            navUser.insertBefore(profileImg, userNameEl);
                        }
                        profileImg.src = userData.stravaProfile.profile;
                    }
                } else {
                    // Fallback to Firebase auth name/email
                    userNameEl.textContent = user.displayName || user.email;
                }
            } catch (error) {
                console.warn('Could not load Strava profile:', error);
                // Fallback to Firebase auth name/email
                userNameEl.textContent = user.displayName || user.email;
            }
        }
    }
});

// ========================================
// LOGOUT BUTTON (Dashboard only)
// ========================================
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    });
}
