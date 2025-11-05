// ========================================
// HR ZONES CALCULATOR - Karvonen Method
// ========================================

// ========================================
// INITIALIZE
// ========================================
function initializeHRCalculator() {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user logged in');
        window.location.href = 'index.html';
        return;
    }

    // Update user name
    document.getElementById('user-name').textContent = user.email;

    // Setup event listeners
    setupEventListeners();

    // Auto-fill max HR based on age
    const ageInput = document.getElementById('age-input');
    ageInput.addEventListener('input', () => {
        const maxHRInput = document.getElementById('max-hr-input');
        if (!maxHRInput.value || maxHRInput.value === '') {
            const estimatedMaxHR = 220 - parseInt(ageInput.value);
            maxHRInput.placeholder = estimatedMaxHR.toString();
        }
    });

    // Trigger initial placeholder update
    ageInput.dispatchEvent(new Event('input'));
}

// ========================================
// SETUP EVENT LISTENERS
// ========================================
function setupEventListeners() {
    const calculateBtn = document.getElementById('calculate-btn');
    calculateBtn.addEventListener('click', calculateZones);

    // Allow Enter key to calculate
    const inputs = document.querySelectorAll('.hr-input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                calculateZones();
            }
        });
    });

    // Settings button (navigate to settings page)
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }

    // Logout button (should not exist in navbar anymore, but keep handler for settings page button)
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
            }
        });
    }
}

// ========================================
// CALCULATE ZONES - Karvonen Method
// ========================================
function calculateZones() {
    // Get input values
    const age = parseInt(document.getElementById('age-input').value);
    const restingHR = parseInt(document.getElementById('resting-hr-input').value);
    let maxHR = parseInt(document.getElementById('max-hr-input').value);

    // Validate inputs
    if (!age || age < 10 || age > 100) {
        alert('Please enter a valid age (10-100)');
        return;
    }

    if (!restingHR || restingHR < 30 || restingHR > 100) {
        alert('Please enter a valid resting heart rate (30-100 bpm)');
        return;
    }

    // Calculate max HR if not provided (using 220 - age formula)
    if (!maxHR || isNaN(maxHR)) {
        maxHR = 220 - age;
    }

    if (maxHR < 100 || maxHR > 220) {
        alert('Maximum heart rate seems invalid. Please check your inputs.');
        return;
    }

    if (restingHR >= maxHR) {
        alert('Resting heart rate must be lower than maximum heart rate.');
        return;
    }

    // Calculate Heart Rate Reserve (HRR)
    const hrReserve = maxHR - restingHR;

    // Calculate zones using Karvonen method
    // Target HR = ((Max HR - Resting HR) × Intensity%) + Resting HR
    
    const zones = [
        {
            number: 1,
            name: 'Recovery',
            minPercent: 0.50,
            maxPercent: 0.60,
            minHR: Math.round((hrReserve * 0.50) + restingHR),
            maxHR: Math.round((hrReserve * 0.60) + restingHR)
        },
        {
            number: 2,
            name: 'Endurance',
            minPercent: 0.60,
            maxPercent: 0.70,
            minHR: Math.round((hrReserve * 0.60) + restingHR),
            maxHR: Math.round((hrReserve * 0.70) + restingHR)
        },
        {
            number: 3,
            name: 'Tempo',
            minPercent: 0.70,
            maxPercent: 0.80,
            minHR: Math.round((hrReserve * 0.70) + restingHR),
            maxHR: Math.round((hrReserve * 0.80) + restingHR)
        },
        {
            number: 4,
            name: 'Threshold',
            minPercent: 0.80,
            maxPercent: 0.90,
            minHR: Math.round((hrReserve * 0.80) + restingHR),
            maxHR: Math.round((hrReserve * 0.90) + restingHR)
        },
        {
            number: 5,
            name: 'Maximum',
            minPercent: 0.90,
            maxPercent: 1.00,
            minHR: Math.round((hrReserve * 0.90) + restingHR),
            maxHR: Math.round((hrReserve * 1.00) + restingHR)
        }
    ];

    // Display results
    displayResults(restingHR, maxHR, hrReserve, zones);
}

// ========================================
// DISPLAY RESULTS
// ========================================
function displayResults(restingHR, maxHR, hrReserve, zones) {
    // Show results section
    const resultsSection = document.getElementById('results-section');
    resultsSection.classList.remove('hidden');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update summary
    document.getElementById('summary-resting').textContent = `${restingHR} bpm`;
    document.getElementById('summary-max').textContent = `${maxHR} bpm`;
    document.getElementById('summary-reserve').textContent = `${hrReserve} bpm`;

    // Update zone cards
    zones.forEach(zone => {
        const rangeElement = document.getElementById(`zone-${zone.number}-range`);
        rangeElement.textContent = `${zone.minHR} - ${zone.maxHR} bpm`;
    });

    // Add animation
    setTimeout(() => {
        const zoneCards = document.querySelectorAll('.hr-zone-card');
        zoneCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'slideInUp 0.4s ease-out';
            }, index * 100);
        });
    }, 100);
}

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        initializeHRCalculator();
    } else {
        window.location.href = 'index.html';
    }
});
