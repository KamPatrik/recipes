// ========================================
// ADVANCED ANALYTICS - Main Logic
// ========================================

let allActivities = [];
let filteredActivities = [];
let currentSportFilter = 'Ride';
let distanceChart = null;
let elevationChart = null;
let hrZoneChart = null;
let distancePeriod = 'week';
let elevationPeriod = 'week';
let hrZonePeriod = 'week';
let selectedDistanceYears = [];
let selectedElevationYears = [];
let selectedHRYears = [];
let availableYears = [];
let hrPeriodActivitiesData = {}; // Store activities data for each year/period for tooltips

// Heart Rate Zone 2 thresholds
const ZONE2_MIN = 125;
const ZONE2_MAX = 150;
const ZONE2_THRESHOLD = 0.6; // 60% of time in zone to qualify as Zone 2 ride

// Chart colors for different years
const yearColors = [
    '#FC4C02', // Orange (primary)
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#EC4899', // Pink
];

// ========================================
// INITIALIZATION
// ========================================
async function initializeAnalytics() {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user logged in');
        window.location.href = 'index.html';
        return;
    }

    try {
        // Setup hamburger menu
        setupHamburgerMenu();
        
        // Setup settings
        setupSettings();
        
        // Load activities
        await loadAnalyticsData();
        
    } catch (error) {
        console.error('Error initializing analytics:', error);
        showNoData();
    }
}

// ========================================
// LOAD ANALYTICS DATA
// ========================================
async function loadAnalyticsData() {
    const loadingEl = document.getElementById('analytics-loading');
    const noDataEl = document.getElementById('analytics-no-data');
    
    try {
        // Show loading
        if (loadingEl) loadingEl.style.display = 'flex';
        if (noDataEl) noDataEl.classList.add('hidden');
        
        // Fetch all activities
        allActivities = await getAllActivitiesFromFirestore();
        
        if (allActivities.length === 0) {
            showNoData();
            return;
        }
        
        // Hide loading
        if (loadingEl) loadingEl.style.display = 'none';
        
        // Pre-calculate zone times for activities with HR data (async, non-blocking)
        preCalculateZoneTimes(allActivities);
        
        // Get available years from activities
        availableYears = getAvailableYears(allActivities);
        
        // Select current year and last year by default for distance/elevation
        const currentYear = new Date().getFullYear();
        selectedDistanceYears = availableYears.filter(y => y >= currentYear - 1);
        selectedElevationYears = [...selectedDistanceYears];
        // Select only current year for HR zones
        selectedHRYears = availableYears.includes(currentYear) ? [currentYear] : [Math.max(...availableYears)];
        
        // Setup sport filter
        setupSportFilter();
        
        // Apply initial filter
        await applyFilter(currentSportFilter);
        
        // Setup year checkboxes
        setupYearCheckboxes();
        
        // Setup period toggles
        setupPeriodToggles();
        
        // Setup year target functionality
        setupYearTarget();
        
        // Setup activity calendar
        setupActivityCalendar();
        
        // Setup Performance Management Chart
        setupPMCChart();
        
        // Setup new analytics charts
        setupSpeedChart();
        setupHRVChart();
        
        // Create initial charts
        updateDistanceChart();
        updateElevationChart();
        updateHRZoneChart();
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showNoData();
    }
}

// ========================================
// YEAR TARGET FUNCTIONALITY
// ========================================
let currentYearTarget = 0;

function setupYearTarget() {
    const targetInput = document.getElementById('year-target-input');
    const saveBtn = document.getElementById('save-target-btn');
    
    if (!targetInput || !saveBtn) return;
    
    // Load existing target
    loadYearTarget();
    
    // Save target on button click
    saveBtn.addEventListener('click', () => {
        const targetValue = parseFloat(targetInput.value);
        if (targetValue && targetValue > 0) {
            saveYearTarget(targetValue);
            targetInput.value = '';
        }
    });
    
    // Also save on Enter key
    targetInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const targetValue = parseFloat(targetInput.value);
            if (targetValue && targetValue > 0) {
                saveYearTarget(targetValue);
                targetInput.value = '';
            }
        }
    });
}

function getTargetStorageKey() {
    const currentYear = new Date().getFullYear();
    return `yearTarget_${currentSportFilter}_${currentYear}`;
}

async function saveYearTarget(targetKm) {
    currentYearTarget = targetKm;
    
    try {
        const user = auth.currentUser;
        if (!user) {
            showTargetMessage('Please log in to save targets.', 'error');
            return;
        }
        
        const currentYear = new Date().getFullYear();
        const targetId = `${currentSportFilter}_${currentYear}`;
        
        // Save to Firestore
        await db.collection('users').doc(user.uid)
            .collection('targets').doc(targetId)
            .set({
                sport: currentSportFilter,
                year: currentYear,
                targetKm: targetKm,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        
        console.log(`✅ Saved year target to Firestore: ${targetKm} km for ${currentSportFilter} ${currentYear}`);
        
        // Also save to localStorage as backup/cache
        try {
            localStorage.setItem(getTargetStorageKey(), targetKm.toString());
        } catch (e) {
            console.log('ℹ️ Could not cache to localStorage, but saved to Firestore');
        }
        
        // Update UI
        updateTargetDisplay();
        
        // Refresh distance chart to show target line
        updateDistanceChart();
        
        // Show success message
        showTargetMessage('Target saved successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error saving target to Firestore:', error);
        showTargetMessage('Failed to save target. Please try again.', 'error');
        
        // Still update UI with the value for current session
        currentYearTarget = targetKm;
        updateTargetDisplay();
        updateDistanceChart();
    }
}

async function loadYearTarget() {
    try {
        const user = auth.currentUser;
        if (!user) {
            currentYearTarget = 0;
            return;
        }
        
        const currentYear = new Date().getFullYear();
        const targetId = `${currentSportFilter}_${currentYear}`;
        
        // Try loading from Firestore first
        const targetDoc = await db.collection('users').doc(user.uid)
            .collection('targets').doc(targetId)
            .get();
        
        if (targetDoc.exists) {
            const data = targetDoc.data();
            currentYearTarget = data.targetKm || 0;
            
            // Cache in localStorage
            try {
                localStorage.setItem(getTargetStorageKey(), currentYearTarget.toString());
            } catch (e) {
                // Ignore localStorage errors
            }
            
            console.log(`✅ Loaded target from Firestore: ${currentYearTarget} km`);
        } else {
            // Fallback to localStorage (for migration)
            const stored = localStorage.getItem(getTargetStorageKey());
            currentYearTarget = stored ? parseFloat(stored) : 0;
            
            // If we found a target in localStorage, migrate it to Firestore
            if (currentYearTarget > 0) {
                console.log('📤 Migrating target from localStorage to Firestore...');
                await saveYearTarget(currentYearTarget);
            }
        }
        
        if (currentYearTarget > 0) {
            updateTargetDisplay();
        }
    } catch (e) {
        console.error('Error loading target:', e);
        
        // Fallback to localStorage
        try {
            const stored = localStorage.getItem(getTargetStorageKey());
            currentYearTarget = stored ? parseFloat(stored) : 0;
            if (currentYearTarget > 0) {
                updateTargetDisplay();
            }
        } catch (lsError) {
            currentYearTarget = 0;
        }
    }
}

function cleanupLocalStorage() {
    try {
        // Remove old activity cache data if it exists (common culprit for quota issues)
        const keysToRemove = [];
        const targetKeys = []; // Keys we want to keep
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            
            // Keep year target keys
            if (key.startsWith('yearTarget_')) {
                targetKeys.push(key);
                continue;
            }
            
            // Remove everything else that could be taking up space
            if (
                key.startsWith('activities_') || 
                key.startsWith('cachedActivities') ||
                key.startsWith('activityCache') ||
                key.startsWith('strava_cache') ||
                key.startsWith('zone_') ||
                key.startsWith('stream_') ||
                key.includes('cache') ||
                key.includes('Cache')
            ) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
                console.log(`🗑️ Removed localStorage key: ${key}`);
            } catch (e) {
                console.warn(`Could not remove ${key}:`, e);
            }
        });
        
        console.log(`✅ Cleaned up ${keysToRemove.length} localStorage items (kept ${targetKeys.length} targets)`);
    } catch (e) {
        console.error('Error during cleanup:', e);
    }
}

function showTargetMessage(message, type) {
    // Create or get message element
    let messageEl = document.getElementById('target-message');
    
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'target-message';
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    
    if (type === 'success') {
        messageEl.style.background = 'linear-gradient(135deg, #2ed573 0%, #26de81 100%)';
        messageEl.style.color = 'white';
    } else {
        messageEl.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)';
        messageEl.style.color = 'white';
    }
    
    messageEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

function updateTargetDisplay() {
    const statusDiv = document.getElementById('target-status');
    const targetDisplay = document.getElementById('current-target-display');
    const progressStatus = document.getElementById('target-progress-status');
    
    if (!statusDiv || !targetDisplay || !progressStatus) return;
    
    if (currentYearTarget > 0) {
        statusDiv.style.display = 'flex';
        targetDisplay.textContent = `${currentYearTarget.toLocaleString()} km`;
        
        // Calculate progress
        const currentYear = new Date().getFullYear();
        const yearActivities = filteredActivities.filter(a => {
            const activityYear = new Date(a.start_date).getFullYear();
            return activityYear === currentYear;
        });
        
        const totalDistance = yearActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
        
        // Calculate expected distance based on day of year
        const now = new Date();
        const startOfYear = new Date(currentYear, 0, 1);
        const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        const daysInYear = isLeapYear(currentYear) ? 366 : 365;
        const expectedDistance = (currentYearTarget * dayOfYear) / daysInYear;
        
        const difference = totalDistance - expectedDistance;
        
        // Determine status (simplified inline version)
        if (Math.abs(difference) < currentYearTarget * 0.05) { // Within 5%
            progressStatus.textContent = '✓ On Track';
            progressStatus.className = 'progress-status on-track';
        } else if (difference > 0) {
            progressStatus.textContent = `↑ ${Math.abs(difference).toFixed(0)}km Ahead`;
            progressStatus.className = 'progress-status ahead';
        } else {
            progressStatus.textContent = `↓ ${Math.abs(difference).toFixed(0)}km Behind`;
            progressStatus.className = 'progress-status behind';
        }
    } else {
        statusDiv.style.display = 'none';
    }
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function generateTargetData(numPeriods, targetKm, period, year) {
    const targetData = [];
    const daysInYear = isLeapYear(year) ? 366 : 365;
    
    if (period === 'day') {
        // Daily cumulative target
        for (let i = 0; i < numPeriods; i++) {
            targetData.push((targetKm * (i + 1)) / daysInYear);
        }
    } else if (period === 'week') {
        // Weekly cumulative target (52 weeks)
        const weeksInYear = 52;
        for (let i = 0; i < numPeriods; i++) {
            targetData.push((targetKm * (i + 1)) / weeksInYear);
        }
    } else if (period === 'month') {
        // Monthly cumulative target (12 months)
        for (let i = 0; i < numPeriods; i++) {
            targetData.push((targetKm * (i + 1)) / 12);
        }
    }
    
    return targetData;
}

// ========================================
// SPORT FILTER
// ========================================
function setupSportFilter() {
    const dropdown = document.getElementById('analytics-sport-filter');
    if (dropdown) {
        dropdown.addEventListener('change', async (e) => {
            await applyFilter(e.target.value);
        });
        dropdown.value = currentSportFilter;
    }
}

async function applyFilter(sport) {
    currentSportFilter = sport;
    
    console.log('🔍 Applying filter:', sport, 'Total activities:', allActivities.length);
    
    if (sport === 'all') {
        filteredActivities = [...allActivities];
    } else {
        filteredActivities = allActivities.filter(activity => {
            const activityType = activity.sport_type || activity.type;
            
            if (sport === 'Ride') {
                // Include all cycling types with Ride
                return activityType === 'Ride' || 
                       activityType === 'VirtualRide' || 
                       activityType === 'EBikeRide' ||
                       activityType === 'IndoorCycling';
            }
            
            if (sport === 'VirtualCycling') {
                // Show only virtual cycling activities
                return activityType === 'VirtualRide' || 
                       activityType === 'IndoorCycling';
            }
            
            return activityType === sport;
        });
    }
    
    console.log('✅ Filtered activities:', filteredActivities.length, 'Types found:', 
        [...new Set(filteredActivities.map(a => a.sport_type || a.type))]);
    
    // Update available years based on filtered activities
    availableYears = getAvailableYears(filteredActivities);
    
    // Re-filter selected years to only include available ones
    selectedDistanceYears = selectedDistanceYears.filter(y => availableYears.includes(y));
    selectedElevationYears = selectedElevationYears.filter(y => availableYears.includes(y));
    selectedHRYears = selectedHRYears.filter(y => availableYears.includes(y));
    
    // If no years selected, select current year
    if (selectedDistanceYears.length === 0 && availableYears.length > 0) {
        selectedDistanceYears = [Math.max(...availableYears)];
    }
    if (selectedElevationYears.length === 0 && availableYears.length > 0) {
        selectedElevationYears = [Math.max(...availableYears)];
    }
    if (selectedHRYears.length === 0 && availableYears.length > 0) {
        selectedHRYears = [Math.max(...availableYears)];
    }
    
    // Update year checkboxes
    setupYearCheckboxes();
    
    // Reload year target for new sport
    await loadYearTarget();
    
    // Update charts
    updateDistanceChart();
    updateElevationChart();
    updateHRZoneChart();
    updatePMCChart();
    
    // Update new charts
    updateSpeedChart();
    updateHRVChart();
    
    // Update activity calendar
    const calendarYearSelect = document.getElementById('calendar-year-select');
    if (calendarYearSelect && calendarYearSelect.value) {
        renderActivityCalendar(parseInt(calendarYearSelect.value));
    }
}

// ========================================
// YEAR MANAGEMENT
// ========================================
function getAvailableYears(activities) {
    const years = new Set();
    activities.forEach(activity => {
        const date = new Date(activity.start_date_local);
        years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending
}

function setupYearCheckboxes() {
    setupYearCheckboxGroup('distance-year-checkboxes', () => selectedDistanceYears, (years) => {
        selectedDistanceYears = years;
        updateDistanceChart();
    });
    
    setupYearCheckboxGroup('elevation-year-checkboxes', () => selectedElevationYears, (years) => {
        selectedElevationYears = years;
        updateElevationChart();
    });
    
    setupYearCheckboxGroup('hr-year-checkboxes', () => selectedHRYears, (years) => {
        selectedHRYears = years;
        updateHRZoneChart();
    });
}

function setupYearCheckboxGroup(containerId, getSelectedYears, onChangeCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (availableYears.length === 0) {
        container.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.9rem;">No data available</span>';
        return;
    }
    
    availableYears.forEach((year, index) => {
        const item = document.createElement('div');
        item.className = 'year-checkbox-item';
        const currentSelectedYears = getSelectedYears();
        if (currentSelectedYears.includes(year)) {
            item.classList.add('checked');
        }
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${containerId}-${year}`;
        checkbox.checked = currentSelectedYears.includes(year);
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = year;
        
        // Color indicator
        const colorIndex = availableYears.indexOf(year) % yearColors.length;
        label.style.color = currentSelectedYears.includes(year) ? yearColors[colorIndex] : 'var(--text-primary)';
        
        checkbox.addEventListener('change', (e) => {
            const selectedYears = getSelectedYears();
            let newSelectedYears;
            if (e.target.checked) {
                newSelectedYears = [...selectedYears, year].sort((a, b) => b - a);
            } else {
                newSelectedYears = selectedYears.filter(y => y !== year);
            }
            
            if (e.target.checked) {
                item.classList.add('checked');
                label.style.color = yearColors[colorIndex];
            } else {
                item.classList.remove('checked');
                label.style.color = 'var(--text-primary)';
            }
            
            onChangeCallback(newSelectedYears);
        });
        
        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
    });
}

// ========================================
// PERIOD TOGGLES
// ========================================
function setupPeriodToggles() {
    // Distance period toggle
    const distanceBtns = document.querySelectorAll('.period-btn');
    distanceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            distancePeriod = btn.getAttribute('data-period');
            distanceBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateDistanceChart();
        });
    });
    
    // Elevation period toggle
    const elevationBtns = document.querySelectorAll('.period-btn-elevation');
    elevationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elevationPeriod = btn.getAttribute('data-period');
            elevationBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateElevationChart();
        });
    });
    
    // HR Zone period toggle
    const hrBtns = document.querySelectorAll('.period-btn-hr');
    hrBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            hrZonePeriod = btn.getAttribute('data-period');
            hrBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateHRZoneChart();
        });
    });
}

// ========================================
// DISTANCE CHART
// ========================================
function updateDistanceChart() {
    const ctx = document.getElementById('distanceProgressChart');
    if (!ctx) return;
    
    if (distanceChart) {
        distanceChart.destroy();
        distanceChart = null;
    }
    
    const datasets = [];
    let labels = [];
    const currentYear = new Date().getFullYear();
    
    // Determine which year to use for labels (prefer current year if selected, otherwise most recent)
    const labelYear = selectedDistanceYears.includes(currentYear) ? currentYear : Math.max(...selectedDistanceYears);
    const labelYearActivities = filteredActivities.filter(a => {
        const date = new Date(a.start_date_local);
        return date.getFullYear() === labelYear;
    });
    labels = aggregateDistanceData(labelYearActivities, distancePeriod, labelYear).labels;
    
    selectedDistanceYears.forEach((year, index) => {
        const yearActivities = filteredActivities.filter(a => {
            const date = new Date(a.start_date_local);
            return date.getFullYear() === year;
        });
        
        const data = aggregateDistanceData(yearActivities, distancePeriod, year);
        const colorIndex = availableYears.indexOf(year) % yearColors.length;
        
        // Pad data with null values if this year has fewer periods than the label year
        const paddedValues = [...data.values];
        while (paddedValues.length < labels.length) {
            paddedValues.push(null);
        }
        
        datasets.push({
            label: `${year}`,
            data: paddedValues,
            borderColor: yearColors[colorIndex],
            backgroundColor: yearColors[colorIndex] + '20',
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 6,
            spanGaps: false
        });
    });
    
    // Add target line if target is set for current year
    if (currentYearTarget > 0 && selectedDistanceYears.includes(currentYear) && labels.length > 0) {
        const targetData = generateTargetData(labels.length, currentYearTarget, distancePeriod, currentYear);
        datasets.push({
            label: `${currentYear} Target`,
            data: targetData,
            borderColor: '#FFD700',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [8, 4],
            tension: 0,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
        });
    }
    
    distanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 14,
                            weight: 600
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + Math.round(context.parsed.y) + ' km';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return value + ' km';
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// ELEVATION CHART
// ========================================
function updateElevationChart() {
    const ctx = document.getElementById('elevationProgressChart');
    if (!ctx) return;
    
    if (elevationChart) {
        elevationChart.destroy();
        elevationChart = null;
    }
    
    const datasets = [];
    let labels = [];
    const currentYear = new Date().getFullYear();
    
    // Determine which year to use for labels (prefer current year if selected, otherwise most recent)
    const labelYear = selectedElevationYears.includes(currentYear) ? currentYear : Math.max(...selectedElevationYears);
    const labelYearActivities = filteredActivities.filter(a => {
        const date = new Date(a.start_date_local);
        return date.getFullYear() === labelYear;
    });
    labels = aggregateElevationData(labelYearActivities, elevationPeriod, labelYear).labels;
    
    selectedElevationYears.forEach((year, index) => {
        const yearActivities = filteredActivities.filter(a => {
            const date = new Date(a.start_date_local);
            return date.getFullYear() === year;
        });
        
        const data = aggregateElevationData(yearActivities, elevationPeriod, year);
        const colorIndex = availableYears.indexOf(year) % yearColors.length;
        
        // Pad data with null values if this year has fewer periods than the label year
        const paddedValues = [...data.values];
        while (paddedValues.length < labels.length) {
            paddedValues.push(null);
        }
        
        datasets.push({
            label: `${year}`,
            data: paddedValues,
            borderColor: yearColors[colorIndex],
            backgroundColor: yearColors[colorIndex] + '20',
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 6,
            spanGaps: false
        });
    });
    
    elevationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 14,
                            weight: 600
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(0) + ' m';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return value + ' m';
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// HEART RATE ZONE ANALYSIS
// ========================================
function updateHRZoneChart() {
    const canvas = document.getElementById('hrZoneChart');
    if (!canvas) return;
    
    if (hrZoneChart) {
        hrZoneChart.destroy();
        hrZoneChart = null;
    }
    
    // Set canvas rendering for crisp pixels
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Update summary stats
    updateHRZoneStats();
    
    // Clear previous data
    hrPeriodActivitiesData = {};
    
    const datasetsZone2 = [];
    const datasetsOther = [];
    
    selectedHRYears.forEach((year, index) => {
        const yearActivities = filteredActivities.filter(a => {
            const date = new Date(a.start_date_local);
            return date.getFullYear() === year && a.average_heartrate;
        });
        
        const data = aggregateHRZoneData(yearActivities, hrZonePeriod, year);
        const colorIndex = availableYears.indexOf(year) % yearColors.length;
        
        // Store activities data for tooltip
        hrPeriodActivitiesData[year] = data.periodActivities;
        
        // Zone 2 time dataset (bottom of stack)
        datasetsZone2.push({
            label: `${year} - Zone 2`,
            data: data.zone2Values,
            backgroundColor: yearColors[colorIndex],
            borderWidth: 0,
            stack: `stack${year}`,
            borderRadius: {
                topLeft: 0,
                topRight: 0,
                bottomLeft: 6,
                bottomRight: 6
            }
        });
        
        // Other zones time dataset (top of stack)
        datasetsOther.push({
            label: `${year} - Other Zones`,
            data: data.otherValues,
            backgroundColor: 'rgba(120, 120, 120, 0.2)',
            borderWidth: 0,
            stack: `stack${year}`,
            borderRadius: {
                topLeft: 6,
                topRight: 6,
                bottomLeft: 0,
                bottomRight: 0
            }
        });
    });
    
    const datasets = [...datasetsZone2, ...datasetsOther];
    
    let labels = [];
    if (selectedHRYears.length > 0) {
        const firstYear = selectedHRYears[0];
        const yearActivities = filteredActivities.filter(a => {
            const date = new Date(a.start_date_local);
            return date.getFullYear() === firstYear && a.average_heartrate;
        });
        labels = aggregateHRZoneData(yearActivities, hrZonePeriod, firstYear).labels;
    }
    
    hrZoneChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio || 2,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 14,
                            weight: 700
                        },
                        padding: 14,
                        usePointStyle: true,
                        pointStyle: 'rect',
                        boxWidth: 16,
                        boxHeight: 16
                    }
                },
                tooltip: {
                    enabled: false, // Disable default tooltip, we'll use external
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 13,
                            weight: 600
                        },
                        maxRotation: 45,
                        minRotation: 0,
                        padding: 8
                    },
                    categoryPercentage: 0.85,
                    barPercentage: 0.9
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 13,
                            weight: 600
                        },
                        padding: 8,
                        callback: function(value) {
                            return value + ' hrs';
                        }
                    }
                }
            }
        }
    });
    
    // Add custom tooltip handler
    setupHRTooltip();
}

function setupHRTooltip() {
    const canvas = document.getElementById('hrZoneChart');
    const tooltip = document.getElementById('hrTooltip');
    
    if (!canvas || !tooltip || !hrZoneChart) return;
    
    let currentIndex = -1;
    
    canvas.addEventListener('mousemove', (e) => {
        // Only show custom tooltip in week view
        if (hrZonePeriod !== 'week') {
            tooltip.classList.remove('show');
            return;
        }
        
        const elements = hrZoneChart.getElementsAtEventForMode(e, 'index', { intersect: false }, false);
        
        if (elements.length > 0) {
            const dataIndex = elements[0].index;
            
            // Only update if we're hovering over a different bar
            if (dataIndex !== currentIndex) {
                currentIndex = dataIndex;
                const year = selectedHRYears[0];
                const activities = hrPeriodActivitiesData[year] ? hrPeriodActivitiesData[year][dataIndex] : [];
                
                if (activities && activities.length > 0) {
                    showHRTooltip(activities, hrZoneChart.data.labels[dataIndex], e.clientX, e.clientY);
                } else {
                    tooltip.classList.remove('show');
                    currentIndex = -1;
                }
            } else {
                // Just update position if still on same bar
                const containerRect = canvas.parentElement.getBoundingClientRect();
                const relativeX = e.clientX - containerRect.left;
                const relativeY = e.clientY - containerRect.top;
                tooltip.style.left = (relativeX + 15) + 'px';
                tooltip.style.top = (relativeY - 50) + 'px';
            }
        } else {
            tooltip.classList.remove('show');
            currentIndex = -1;
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
        currentIndex = -1;
    });
}

function showHRTooltip(activities, label, mouseX, mouseY) {
    const tooltip = document.getElementById('hrTooltip');
    const canvas = document.getElementById('hrZoneChart');
    if (!tooltip || !canvas) return;
    
    // Calculate max height for bar scaling
    const maxHours = Math.max(...activities.map(a => a.hours));
    const barMaxHeight = 80; // pixels
    
    // Build HTML
    let html = `<div class="hr-tooltip-title">${label}</div>`;
    html += '<div class="hr-tooltip-activities">';
    
    activities.forEach(act => {
        // Use the actual zone time breakdown
        const z2Hours = act.zone2Hours || 0;
        const otherHours = act.otherHours || 0;
        const totalActHours = z2Hours + otherHours;
        
        // Calculate the total bar height for this activity proportional to maxHours
        const activityBarHeight = (totalActHours / maxHours) * barMaxHeight;
        
        // Calculate zone portions as percentages of this activity's bar
        const z2Percentage = totalActHours > 0 ? (z2Hours / totalActHours) * 100 : 0;
        const otherPercentage = totalActHours > 0 ? (otherHours / totalActHours) * 100 : 0;
        
        const actDate = new Date(act.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        html += '<div class="hr-tooltip-activity">';
        html += `<div class="hr-tooltip-bar" style="height: ${activityBarHeight}px;">`;
        
        if (z2Percentage > 0) {
            html += `<div class="hr-tooltip-bar-z2" style="height: ${z2Percentage}%;"></div>`;
        }
        if (otherPercentage > 0) {
            html += `<div class="hr-tooltip-bar-other" style="height: ${otherPercentage}%;"></div>`;
        }
        
        html += '</div>';
        html += `<div class="hr-tooltip-activity-name" title="${act.name}">${act.name}</div>`;
        html += `<div class="hr-tooltip-activity-info">${act.hours.toFixed(1)}h</div>`;
        html += `<div class="hr-tooltip-activity-info">${z2Percentage.toFixed(1)}% Z2</div>`;
        html += '</div>';
    });
    
    html += '</div>';
    
    // Add summary - sum actual zone2Hours from each activity
    const totalHours = activities.reduce((sum, a) => sum + a.hours, 0);
    const z2Hours = activities.reduce((sum, a) => sum + (a.zone2Hours || 0), 0);
    const z2Percentage = totalHours > 0 ? ((z2Hours / totalHours) * 100).toFixed(1) : 0;
    html += `<div class="hr-tooltip-summary">Total: ${totalHours.toFixed(1)}h | Zone 2: ${z2Hours.toFixed(1)}h (${z2Percentage}%)</div>`;
    
    tooltip.innerHTML = html;
    tooltip.classList.add('show');
    
    // Position tooltip relative to canvas container
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = canvas.parentElement.getBoundingClientRect();
    
    // Calculate position relative to the container
    const relativeX = mouseX - containerRect.left;
    const relativeY = mouseY - containerRect.top;
    
    // Set position with offset
    tooltip.style.left = (relativeX + 15) + 'px';
    tooltip.style.top = (relativeY - 50) + 'px';
}

function updateHRZoneStats() {
    // Filter activities for selected years only
    const selectedYearActivities = filteredActivities.filter(a => {
        const date = new Date(a.start_date_local);
        return selectedHRYears.includes(date.getFullYear()) && a.average_heartrate;
    });
    
    let totalZone2Hours = 0;
    let totalHours = 0;
    let zone2RidesCount = 0;
    
    selectedYearActivities.forEach(activity => {
        const hours = activity.moving_time / 3600;
        totalHours += hours;
        
        // Check if average HR is in Zone 2 range (simple estimation)
        if (activity.average_heartrate >= ZONE2_MIN && activity.average_heartrate <= ZONE2_MAX) {
            totalZone2Hours += hours;
            zone2RidesCount++;
        }
    });
    
    const zone2Percentage = totalHours > 0 ? (totalZone2Hours / totalHours * 100) : 0;
    
    document.getElementById('zone2-hours').textContent = totalZone2Hours.toFixed(1) + ' h';
    document.getElementById('total-hours').textContent = totalHours.toFixed(1) + ' h';
    document.getElementById('zone2-percentage').textContent = zone2Percentage.toFixed(1) + '%';
}

// ========================================
// DATA AGGREGATION
// ========================================
function aggregateDistanceData(activities, period, year) {
    const data = {};
    
    activities.forEach(activity => {
        const date = new Date(activity.start_date_local);
        let key;
        
        if (period === 'day') {
            // Day of year (1-365)
            const start = new Date(year, 0, 0);
            const diff = date - start;
            const oneDay = 1000 * 60 * 60 * 24;
            key = Math.floor(diff / oneDay);
        } else if (period === 'week') {
            // Week of year
            const oneJan = new Date(date.getFullYear(), 0, 1);
            key = Math.ceil((((date - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
        } else {
            // Month
            key = date.getMonth() + 1;
        }
        
        if (!data[key]) {
            data[key] = 0;
        }
        data[key] += (activity.distance || 0) / 1000; // km
    });
    
    // Generate labels and values with cumulative sum
    const labels = [];
    const values = [];
    let cumulative = 0;
    const currentYear = new Date().getFullYear();
    const isCurrentYear = year === currentYear;
    const now = new Date();
    
    if (period === 'day') {
        // Always show all 365 days
        const currentDay = Math.floor((now - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
        for (let i = 1; i <= 365; i++) {
            const date = new Date(year, 0, i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Only add data up to current day for current year
            if (isCurrentYear && i > currentDay) {
                values.push(null);
            } else {
                cumulative += (data[i] || 0);
                values.push(cumulative);
            }
        }
    } else if (period === 'week') {
        // Always show all 52 weeks
        const currentWeek = Math.ceil((((now - new Date(year, 0, 1)) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
        for (let i = 1; i <= 52; i++) {
            labels.push(`Week ${i}`);
            
            // Only add data up to current week for current year
            if (isCurrentYear && i > currentWeek) {
                values.push(null);
            } else {
                cumulative += (data[i] || 0);
                values.push(cumulative);
            }
        }
    } else {
        // Always show all 12 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = now.getMonth() + 1;
        for (let i = 1; i <= 12; i++) {
            labels.push(monthNames[i - 1]);
            
            // Only add data up to current month for current year
            if (isCurrentYear && i > currentMonth) {
                values.push(null);
            } else {
                cumulative += (data[i] || 0);
                values.push(cumulative);
            }
        }
    }
    
    return { labels, values };
}

function aggregateElevationData(activities, period, year) {
    const data = {};
    
    activities.forEach(activity => {
        const date = new Date(activity.start_date_local);
        let key;
        
        if (period === 'day') {
            const start = new Date(year, 0, 0);
            const diff = date - start;
            const oneDay = 1000 * 60 * 60 * 24;
            key = Math.floor(diff / oneDay);
        } else if (period === 'week') {
            const oneJan = new Date(date.getFullYear(), 0, 1);
            key = Math.ceil((((date - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
        } else {
            key = date.getMonth() + 1;
        }
        
        if (!data[key]) {
            data[key] = 0;
        }
        data[key] += activity.total_elevation_gain || 0; // meters
    });
    
    // Generate labels and values with cumulative sum
    const labels = [];
    const values = [];
    let cumulative = 0;
    const currentYear = new Date().getFullYear();
    const isCurrentYear = year === currentYear;
    const now = new Date();
    
    if (period === 'day') {
        // Always show all 365 days
        const currentDay = Math.floor((now - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
        for (let i = 1; i <= 365; i++) {
            const date = new Date(year, 0, i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Only add data up to current day for current year
            if (isCurrentYear && i > currentDay) {
                values.push(null);
            } else {
                cumulative += (data[i] || 0);
                values.push(cumulative);
            }
        }
    } else if (period === 'week') {
        // Always show all 52 weeks
        const currentWeek = Math.ceil((((now - new Date(year, 0, 1)) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
        for (let i = 1; i <= 52; i++) {
            labels.push(`Week ${i}`);
            
            // Only add data up to current week for current year
            if (isCurrentYear && i > currentWeek) {
                values.push(null);
            } else {
                cumulative += (data[i] || 0);
                values.push(cumulative);
            }
        }
    } else {
        // Always show all 12 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = now.getMonth() + 1;
        for (let i = 1; i <= 12; i++) {
            labels.push(monthNames[i - 1]);
            
            // Only add data up to current month for current year
            if (isCurrentYear && i > currentMonth) {
                values.push(null);
            } else {
                cumulative += (data[i] || 0);
                values.push(cumulative);
            }
        }
    }
    
    return { labels, values };
}

// Helper function to calculate time in zones from HR stream data
async function calculateZoneTimeFromStream(activityId) {
    try {
        const user = auth.currentUser;
        if (!user) return null;
        
        // Try IndexedDB cache first
        let streams = null;
        if (typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
            streams = await cacheDB.getStream(user.uid, activityId);
        }
        
        // If not in IndexedDB, fetch from Firestore
        if (!streams) {
            const streamDoc = await db.collection('users').doc(user.uid)
                .collection('activities').doc(activityId.toString())
                .collection('streamData').doc('main').get();
            
            if (!streamDoc.exists) return null;
            
            streams = streamDoc.data();
            
            // Cache in IndexedDB for next time
            if (typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
                await cacheDB.cacheStream(user.uid, activityId, streams);
            }
        }
        
        // Validate we have the necessary data
        if (!streams.heartrate || !streams.heartrate.data || !streams.time || !streams.time.data) {
            return null;
        }
        
        const hrData = streams.heartrate.data;
        const timeData = streams.time.data; // Time in seconds
        
        let zone2Seconds = 0;
        
        // Calculate time spent in each zone
        for (let i = 0; i < hrData.length; i++) {
            const hr = hrData[i];
            if (hr >= ZONE2_MIN && hr <= ZONE2_MAX) {
                // Calculate duration for this data point
                const duration = i < hrData.length - 1 ? (timeData[i + 1] - timeData[i]) : 1;
                zone2Seconds += duration;
            }
        }
        
        // Use the last time value as total duration (more reliable)
        const totalSeconds = timeData[timeData.length - 1];
        
        // Ensure zone2Seconds doesn't exceed totalSeconds
        zone2Seconds = Math.min(zone2Seconds, totalSeconds);
        
        const zone2Hours = zone2Seconds / 3600;
        const totalHours = totalSeconds / 3600;
        const otherHours = Math.max(0, totalHours - zone2Hours); // Ensure non-negative
        
        const result = {
            zone2Hours: zone2Hours,
            totalHours: totalHours,
            otherHours: otherHours
        };
        
        // Cache the result in localStorage
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                data: result,
                timestamp: Date.now()
            }));
        } catch (e) {
            // Silently fail localStorage - IndexedDB handles the important data
            console.log('ℹ️ localStorage full (zone time data cached in IndexedDB)');
        }
        
        return result;
    } catch (error) {
        console.log(`Could not get stream data for activity ${activityId}:`, error);
        return null;
    }
}

// Pre-calculate zone times for activities (runs in background)
async function preCalculateZoneTimes(activities) {
    console.log('🔄 Pre-calculating zone times from HR streams...');
    
    const loadingBadge = document.getElementById('hrLoadingBadge');
    const progressText = document.getElementById('hrLoadingProgress');
    
    const activitiesWithHR = activities.filter(a => a.average_heartrate);
    
    if (activitiesWithHR.length === 0) {
        return;
    }
    
    // Show loading badge
    if (loadingBadge) {
        loadingBadge.classList.add('show');
    }
    
    let processed = 0;
    let withStreams = 0;
    
    // Process in batches to avoid overwhelming Firestore
    const batchSize = 10;
    for (let i = 0; i < activitiesWithHR.length; i += batchSize) {
        const batch = activitiesWithHR.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (activity) => {
            const zoneTime = await calculateZoneTimeFromStream(activity.id);
            processed++;
            
            if (zoneTime) {
                activity.zoneTimeCache = zoneTime;
                withStreams++;
            }
        }));
        
        // Update progress
        const progress = Math.round((processed / activitiesWithHR.length) * 100);
        if (progressText) {
            progressText.textContent = `${progress}%`;
        }
    }
    
    console.log(`✅ Zone time calculation complete: ${withStreams}/${activitiesWithHR.length} activities with HR streams`);
    
    // Hide loading badge with delay
    setTimeout(() => {
        if (loadingBadge) {
            loadingBadge.classList.remove('show');
        }
    }, 1000);
    
    // Update chart once after all calculations are done
    if (hrZoneChart) {
        updateHRZoneChart();
    }
}

function aggregateHRZoneData(activities, period, year) {
    const zone2Data = {};
    const totalData = {};
    const activitiesByPeriod = {}; // Store activities for each period
    
    activities.forEach(activity => {
        if (!activity.average_heartrate) return;
        
        const date = new Date(activity.start_date_local);
        let key;
        
        if (period === 'day') {
            const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
            key = dayOfYear;
        } else if (period === 'week') {
            const oneJan = new Date(date.getFullYear(), 0, 1);
            const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
            const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
            key = weekNumber;
        } else {
            key = date.getMonth() + 1;
        }
        
        const hours = activity.moving_time / 3600;
        
        // Use cached zone time if available, otherwise fallback to average HR
        let z2Hours = 0;
        let otherHours = hours;
        
        if (activity.zoneTimeCache) {
            // Use pre-calculated zone times, but ensure they don't exceed activity duration
            z2Hours = Math.min(activity.zoneTimeCache.zone2Hours, hours);
            otherHours = Math.max(0, hours - z2Hours);
        } else {
            // Fallback: use average HR to estimate (less accurate)
            if (activity.average_heartrate >= ZONE2_MIN && activity.average_heartrate <= ZONE2_MAX) {
                z2Hours = hours;
                otherHours = 0;
            }
        }
        
        totalData[key] = (totalData[key] || 0) + hours;
        zone2Data[key] = (zone2Data[key] || 0) + z2Hours;
        
        // Store activity details
        if (!activitiesByPeriod[key]) {
            activitiesByPeriod[key] = [];
        }
        activitiesByPeriod[key].push({
            name: activity.name,
            date: activity.start_date_local,
            hours: hours,
            zone2Hours: z2Hours,
            otherHours: otherHours,
            avgHR: activity.average_heartrate,
            isZone2: z2Hours > (hours * 0.6) // Consider Z2 ride if >60% time in zone
        });
    });
    
    const labels = [];
    const zone2Values = [];
    const otherValues = [];
    const periodActivities = [];
    
    if (period === 'day') {
        const daysInYear = new Date(year, 11, 31).getDate() === 31 ? 365 : 366;
        for (let i = 1; i <= daysInYear; i++) {
            const date = new Date(year, 0, i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            const zone2 = zone2Data[i] || 0;
            const total = totalData[i] || 0;
            zone2Values.push(zone2);
            otherValues.push(total - zone2); // Non-Zone 2 time
            periodActivities.push(activitiesByPeriod[i] || []);
        }
    } else if (period === 'week') {
        for (let i = 1; i <= 52; i++) {
            labels.push(`Week ${i}`);
            const zone2 = zone2Data[i] || 0;
            const total = totalData[i] || 0;
            zone2Values.push(zone2);
            otherValues.push(total - zone2);
            periodActivities.push(activitiesByPeriod[i] || []);
        }
    } else {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 1; i <= 12; i++) {
            labels.push(monthNames[i - 1]);
            const zone2 = zone2Data[i] || 0;
            const total = totalData[i] || 0;
            zone2Values.push(zone2);
            otherValues.push(total - zone2);
            periodActivities.push(activitiesByPeriod[i] || []);
        }
    }
    
    return { labels, zone2Values, otherValues, periodActivities };
}

// ========================================
// NO DATA STATE
// ========================================
function showNoData() {
    const loadingEl = document.getElementById('analytics-loading');
    const noDataEl = document.getElementById('analytics-no-data');
    
    if (loadingEl) loadingEl.style.display = 'none';
    if (noDataEl) noDataEl.classList.remove('hidden');
}

// ========================================
// HAMBURGER MENU & SETTINGS
// ========================================
function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const slideMenu = document.getElementById('slide-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.add('active');
            slideMenu.classList.add('active');
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    const closeMenu = () => {
        if (hamburgerBtn) hamburgerBtn.classList.remove('active');
        if (slideMenu) slideMenu.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && slideMenu && slideMenu.classList.contains('active')) {
            closeMenu();
        }
    });
}

function setupSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }
    
    const settingsCloseBtn = document.getElementById('settings-close');
    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', hideSettingsModal);
    }
    
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
                console.error('Error signing out:', error);
            }
        });
    }
}

async function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const user = auth.currentUser;
    
    if (!user) return;

    try {
        document.getElementById('settings-email').textContent = user.email;
        document.getElementById('settings-name').textContent = user.displayName || 'Not set';

        const userData = await getUserData(user.uid);
        const isConnected = userData.stravaConnected || false;

        const notConnected = document.getElementById('settings-not-connected');
        const connected = document.getElementById('settings-connected');

        if (isConnected) {
            notConnected.classList.add('hidden');
            connected.classList.remove('hidden');

            if (userData.stravaAthleteId) {
                document.getElementById('settings-athlete-id').textContent = userData.stravaAthleteId;
            }

            if (userData.lastSync) {
                const lastSyncDate = userData.lastSync.toDate();
                const formatted = lastSyncDate.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                document.getElementById('settings-last-sync').textContent = formatted;
            } else {
                document.getElementById('settings-last-sync').textContent = 'Never';
            }
        } else {
            notConnected.classList.remove('hidden');
            connected.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }

    modal.classList.remove('hidden');
}

function hideSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('hidden');
}

// ========================================
// PERFORMANCE MANAGEMENT CHART (FITNESS-FATIGUE MODEL)
// ========================================

let pmcChart = null;
let pmcPeriod = 90; // Default 3 months

// Calculate Training Stress Score (TSS) for an activity
function calculateTSS(activity) {
    // TSS formula varies by sport and available data
    // Basic formula: (duration_hours × intensity_factor^2 × 100)
    // We'll use a simplified approach based on available Strava data
    
    // Safety checks
    if (!activity || !activity.moving_time) {
        return 0;
    }
    
    const durationHours = activity.moving_time / 3600;
    const sport = activity.sport_type || activity.type || 'Unknown';
    
    // Intensity factor estimation based on sport type and relative effort
    let intensityFactor = 0.7; // Default moderate intensity
    
    // Adjust based on average heart rate if available
    if (activity.average_heartrate) {
        const maxHR = 190; // Estimated max HR (adjust based on user)
        const percentMaxHR = activity.average_heartrate / maxHR;
        
        if (percentMaxHR > 0.9) intensityFactor = 1.1; // Very hard
        else if (percentMaxHR > 0.8) intensityFactor = 1.0; // Hard
        else if (percentMaxHR > 0.7) intensityFactor = 0.85; // Moderate-hard
        else if (percentMaxHR > 0.6) intensityFactor = 0.7; // Moderate
        else intensityFactor = 0.5; // Easy
    } else if (activity.average_speed && activity.distance > 0) {
        // Estimate intensity from pace for runs/rides
        const avgPaceMinPerKm = (activity.moving_time / 60) / (activity.distance / 1000);
        
        if (sport.includes('Run')) {
            if (avgPaceMinPerKm < 4) intensityFactor = 1.0; // Fast run
            else if (avgPaceMinPerKm < 5) intensityFactor = 0.85; // Moderate run
            else if (avgPaceMinPerKm < 6) intensityFactor = 0.7; // Easy run
            else intensityFactor = 0.6; // Recovery run
        } else if (sport.includes('Ride')) {
            const avgSpeedKmh = activity.average_speed * 3.6;
            if (avgSpeedKmh > 30) intensityFactor = 1.0; // Fast ride
            else if (avgSpeedKmh > 25) intensityFactor = 0.85; // Moderate ride
            else if (avgSpeedKmh > 20) intensityFactor = 0.7; // Easy ride
            else intensityFactor = 0.6; // Recovery ride
        }
    }
    
    // Sport-specific multipliers
    const sportMultipliers = {
        'Run': 1.0,
        'Ride': 1.0,
        'VirtualRide': 1.0,
        'Walk': 0.5,
        'Hike': 0.7,
        'Swim': 1.1,
        'Workout': 0.8,
        'WeightTraining': 0.7,
        'Yoga': 0.4
    };
    
    let sportMultiplier = 1.0;
    for (const [key, value] of Object.entries(sportMultipliers)) {
        if (sport.includes(key)) {
            sportMultiplier = value;
            break;
        }
    }
    
    // Calculate TSS
    const tss = durationHours * Math.pow(intensityFactor, 2) * 100 * sportMultiplier;
    
    return Math.round(tss);
}

// Calculate exponentially weighted moving average
function calculateEWMA(dailyTSS, timeConstant) {
    // timeConstant: 7 for ATL (Acute Training Load), 42 for CTL (Chronic Training Load)
    const ewma = [];
    let currentValue = 0;
    
    const alpha = 2 / (timeConstant + 1);
    
    for (let i = 0; i < dailyTSS.length; i++) {
        const tss = dailyTSS[i];
        if (i === 0) {
            currentValue = tss;
        } else {
            currentValue = (tss * alpha) + (currentValue * (1 - alpha));
        }
        ewma.push(Math.round(currentValue * 10) / 10);
    }
    
    return ewma;
}

// Setup PMC chart
function setupPMCChart() {
    try {
        console.log('🏋️ Setting up Performance Management Chart...');
        
        const pmcPeriodBtns = document.querySelectorAll('.period-btn-pmc');
        
        if (pmcPeriodBtns.length === 0) {
            console.warn('⚠️ PMC period buttons not found');
        }
        
        pmcPeriodBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                pmcPeriodBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                pmcPeriod = parseInt(e.target.getAttribute('data-period'));
                updatePMCChart();
            });
        });
        
        updatePMCChart();
    } catch (error) {
        console.error('❌ Error setting up PMC chart:', error);
    }
}

// Update PMC chart
function updatePMCChart() {
    try {
        console.log('📊 Updating PMC chart...', {
            period: pmcPeriod,
            filteredActivities: filteredActivities.length
        });
        
        // Get date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - pmcPeriod);
        
        // Group activities by date and calculate daily TSS
        const dailyTSSMap = new Map();
        
        filteredActivities.forEach(activity => {
        const activityDate = new Date(activity.start_date_local);
        if (activityDate >= startDate && activityDate <= endDate) {
            const dateKey = activityDate.toISOString().split('T')[0];
            const tss = calculateTSS(activity);
            
            if (dailyTSSMap.has(dateKey)) {
                dailyTSSMap.set(dateKey, dailyTSSMap.get(dateKey) + tss);
            } else {
                dailyTSSMap.set(dateKey, tss);
            }
        }
    });
    
    // Create complete date array with all days (including zero TSS days)
    const dates = [];
    const dailyTSS = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        dates.push(dateKey);
        dailyTSS.push(dailyTSSMap.get(dateKey) || 0);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate CTL (Chronic Training Load - 42 day EWMA)
    const ctl = calculateEWMA(dailyTSS, 42);
    
    // Calculate ATL (Acute Training Load - 7 day EWMA)
    const atl = calculateEWMA(dailyTSS, 7);
    
    // Calculate TSB (Training Stress Balance = CTL - ATL)
    const tsb = ctl.map((c, i) => Math.round((c - atl[i]) * 10) / 10);
    
    // Check if we have valid data
    if (dates.length === 0 || ctl.length === 0 || atl.length === 0 || tsb.length === 0) {
        console.log('⚠️ No data available for PMC chart');
        if (pmcChart) {
            pmcChart.destroy();
            pmcChart = null;
        }
        return;
    }
    
    // Format dates for display
    const labels = dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Destroy existing chart
    if (pmcChart) {
        pmcChart.destroy();
    }
    
    // Create new chart
    const ctx = document.getElementById('pmcChart');
    if (!ctx) {
        console.log('⚠️ PMC chart canvas not found');
        return;
    }
    
    console.log('📈 Creating PMC chart with data:', {
        labels: labels.length,
        ctl: ctl.length,
        atl: atl.length,
        tsb: tsb.length,
        sampleCTL: ctl.slice(0, 5),
        sampleATL: atl.slice(0, 5),
        sampleTSB: tsb.slice(0, 5)
    });
    
    pmcChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Fitness (CTL)',
                    data: ctl,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                },
                {
                    label: 'Fatigue (ATL)',
                    data: atl,
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                },
                {
                    label: 'Form (TSB)',
                    data: tsb,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyColor: '#fff',
                    bodyFont: {
                        size: 13
                    },
                    displayColors: true,
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.datasetIndex === 2) { // TSB (Form)
                                const value = context.parsed.y;
                                if (value >= 25) return '🎯 Peak form - ready to race!';
                                if (value >= 10) return '✨ Good form - feeling fresh';
                                if (value >= -10) return '💪 Productive training zone';
                                if (value >= -30) return '⚠️ Accumulating fatigue';
                                return '🚨 High risk of overtraining';
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 12,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Training Load',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
    
    console.log('✅ PMC chart updated successfully');
    
    } catch (error) {
        console.error('❌ Error updating PMC chart:', error);
    }
}

// ========================================
// ACTIVITY CALENDAR (GitHub-style)
// ========================================
function setupActivityCalendar() {
    const yearSelect = document.getElementById('calendar-year-select');
    const currentYear = new Date().getFullYear();
    
    // Populate year dropdown
    yearSelect.innerHTML = '';
    availableYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    });
    
    // Initial render
    renderActivityCalendar(currentYear);
    
    // Year change handler
    yearSelect.addEventListener('change', (e) => {
        renderActivityCalendar(parseInt(e.target.value));
    });
}

function renderActivityCalendar(year) {
    const container = document.getElementById('activity-calendar');
    container.innerHTML = '';
    
    // Get activities for this year
    const yearActivities = filteredActivities.filter(a => {
        const date = new Date(a.start_date_local);
        return date.getFullYear() === year;
    });
    
    console.log('📅 Calendar Rendering:', {
        sport: currentSportFilter,
        year: year,
        totalFilteredActivities: filteredActivities.length,
        yearActivities: yearActivities.length,
        firstFewActivities: yearActivities.slice(0, 3).map(a => ({
            name: a.name,
            date: a.start_date_local,
            type: a.sport_type || a.type
        }))
    });
    
    // Create activity map (date -> activity count)
    const activityMap = {};
    yearActivities.forEach(activity => {
        const date = new Date(activity.start_date_local);
        const dateKey = date.toISOString().split('T')[0];
        if (!activityMap[dateKey]) {
            activityMap[dateKey] = 0;
        }
        activityMap[dateKey]++;
    });
    
    // Generate all days of the year in a simple grid
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(startDate);
    let consecutiveDaysWithoutActivity = 0;
    
    while (currentDate <= endDate) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'analytics-calendar-day';
        
        const dateKey = currentDate.toISOString().split('T')[0];
        const activityCount = activityMap[dateKey] || 0;
        const isFuture = currentDate > today;
        
        // Track consecutive days without activity (only for past/present days)
        if (!isFuture && activityCount === 0) {
            consecutiveDaysWithoutActivity++;
        } else if (activityCount > 0) {
            consecutiveDaysWithoutActivity = 0;
        }
        
        // Determine level based on consecutive days without activity
        let level = 0;
        if (isFuture) {
            level = 'future'; // Future days - no color
        } else if (activityCount > 0) {
            level = 1; // Has activity - bright orange
        } else {
            // No activity - slightly darker the longer the streak
            if (consecutiveDaysWithoutActivity >= 14) level = -4; // 14+ days
            else if (consecutiveDaysWithoutActivity >= 10) level = -3; // 10-13 days
            else if (consecutiveDaysWithoutActivity >= 7) level = -2; // 7-9 days
            else if (consecutiveDaysWithoutActivity >= 3) level = -1; // 3-6 days
            else level = 0; // 1-2 days
        }
        
        dayDiv.setAttribute('data-level', level);
        dayDiv.setAttribute('data-date', dateKey);
        dayDiv.setAttribute('data-count', activityCount);
        if (!isFuture && activityCount === 0) {
            dayDiv.setAttribute('data-streak', consecutiveDaysWithoutActivity);
            dayDiv.title = `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${activityCount} activities (${consecutiveDaysWithoutActivity} days without activity)`;
        } else if (isFuture) {
            dayDiv.title = `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: Future date`;
        } else {
            dayDiv.title = `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}`;
        }
        
        // Add first letter of month only if there's activity
        if (activityCount > 0) {
            const monthLetter = currentDate.toLocaleDateString('en-US', { month: 'short' })[0];
            dayDiv.textContent = monthLetter;
        }
        
        container.appendChild(dayDiv);
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

// ========================================
// START APP
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            initializeAnalytics();
        } else {
            window.location.href = 'index.html';
        }
    });
});
