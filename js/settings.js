// ========================================
// SETTINGS PAGE - Main Logic
// ========================================

// ========================================
// INITIALIZE SETTINGS
// ========================================
async function initializeSettings() {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user logged in');
        window.location.href = 'index.html';
        return;
    }

    try {
        // Update user name in nav
        document.getElementById('user-name').textContent = user.email;

        // Load account information
        loadAccountInfo(user);

        // Check Strava connection
        const connected = await isStravaConnected();
        updateStravaUI(connected);

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing settings:', error);
    }
}

// ========================================
// LOAD ACCOUNT INFORMATION
// ========================================
function loadAccountInfo(user) {
    document.getElementById('settings-email').textContent = user.email || 'N/A';
    document.getElementById('settings-uid').textContent = user.uid || 'N/A';
    
    const createdAt = user.metadata.creationTime;
    const createdDate = new Date(createdAt);
    document.getElementById('settings-created').textContent = createdDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ========================================
// UPDATE STRAVA UI
// ========================================
async function updateStravaUI(isConnected) {
    const connectedSection = document.getElementById('strava-connected-section');
    const disconnectedSection = document.getElementById('strava-disconnected-section');

    if (isConnected) {
        connectedSection.classList.remove('hidden');
        disconnectedSection.classList.add('hidden');

        // Load Strava info
        const user = auth.currentUser;
        const userData = await getUserData(user.uid);
        
        if (userData) {
            document.getElementById('strava-athlete-id').textContent = userData.stravaAthleteId || 'N/A';
            
            if (userData.lastSync) {
                const lastSyncDate = userData.lastSync.toDate();
                const now = new Date();
                const diff = now - lastSyncDate;
                const minutes = Math.floor(diff / 60000);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                let timeAgo;
                if (minutes < 1) {
                    timeAgo = 'Just now';
                } else if (minutes < 60) {
                    timeAgo = `${minutes} min ago`;
                } else if (hours < 24) {
                    timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
                } else {
                    timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
                }

                document.getElementById('strava-last-sync').textContent = timeAgo;
            } else {
                document.getElementById('strava-last-sync').textContent = 'Never';
            }
        }
    } else {
        connectedSection.classList.add('hidden');
        disconnectedSection.classList.remove('hidden');
    }
}

// ========================================
// SETUP EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Connect to Strava
    const connectBtn = document.getElementById('connect-strava-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectStrava);
    }

    // Sync Activities
    const syncBtn = document.getElementById('sync-activities-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            syncBtn.disabled = true;
            syncBtn.textContent = '🔄 Syncing...';
            
            try {
                await syncAllActivities();
                alert('Activities synced successfully!');
                location.reload();
            } catch (error) {
                console.error('Sync error:', error);
                alert('Failed to sync activities. Please try again.');
            } finally {
                syncBtn.disabled = false;
                syncBtn.textContent = '🔄 Sync Activities (Latest 100)';
            }
        });
    }

    // Full Import ALL Activities
    const fullSyncBtn = document.getElementById('full-sync-btn');
    if (fullSyncBtn) {
        fullSyncBtn.addEventListener('click', async () => {
            const confirmMessage = 'This will import ALL your Strava activities (not just the latest 100).\n\n' +
                                 'This may take several minutes depending on how many activities you have.\n\n' +
                                 'Continue?';
            
            if (!confirm(confirmMessage)) {
                return;
            }

            fullSyncBtn.disabled = true;
            fullSyncBtn.textContent = '⚡ Importing...';
            
            try {
                const result = await importAllActivities();
                alert(`Import complete!\n\n` +
                      `📊 Total activities: ${result.total}\n` +
                      `✨ New activities imported: ${result.newActivities}\n` +
                      `📄 Pages checked: ${result.pagesChecked}`);
                location.reload();
            } catch (error) {
                console.error('Full import error:', error);
                alert('Failed to import all activities: ' + error.message);
            } finally {
                fullSyncBtn.disabled = false;
                fullSyncBtn.textContent = '⚡ Import ALL Activities';
            }
        });
    }

    // Disconnect Strava
    const disconnectBtn = document.getElementById('disconnect-strava-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to disconnect from Strava? Your synced activities will remain.')) {
                return;
            }

            disconnectBtn.disabled = true;
            
            try {
                await disconnectStrava();
                alert('Disconnected from Strava successfully!');
                location.reload();
            } catch (error) {
                console.error('Disconnect error:', error);
                alert('Failed to disconnect. Please try again.');
            } finally {
                disconnectBtn.disabled = false;
            }
        });
    }

    // Delete Account
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const confirmation = prompt('⚠️ WARNING: This action cannot be undone!\n\nType "DELETE" to confirm account deletion:');
            
            if (confirmation !== 'DELETE') {
                alert('Account deletion cancelled.');
                return;
            }

            const user = auth.currentUser;
            deleteBtn.disabled = true;
            
            try {
                // Delete user data from Firestore
                await db.collection('users').doc(user.uid).delete();
                
                // Delete auth account
                await user.delete();
                
                alert('Your account has been deleted successfully.');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Delete account error:', error);
                alert('Failed to delete account. You may need to re-login and try again.');
            } finally {
                deleteBtn.disabled = false;
            }
        });
    }

    // Settings button (navigate to settings page)
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // Already on settings page, just scroll to top or do nothing
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const user = auth.currentUser;
                
                // Clear IndexedDB cache before logging out
                if (user && typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
                    console.log('🗑️ Clearing cache on logout...');
                    await cacheDB.clearUserCache(user.uid);
                }
                
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Failed to logout. Please try again.');
            }
        });
    }
}

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        initializeSettings();
    } else {
        window.location.href = 'index.html';
    }
});
