// ========================================
// DASHBOARD APP - Main Logic
// ========================================

// Pagination and Filter State
let allActivities = [];
let filteredActivities = [];
let currentPage = 1;
let currentSportFilter = 'Ride'; // Default to cycling
const ACTIVITIES_PER_PAGE = 10;

// ========================================
// INITIALIZE DASHBOARD
// ========================================
async function initializeDashboard() {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user logged in');
        return;
    }

    try {
        // Setup hamburger menu
        setupHamburgerMenu();
        
        // Check Strava connection status
        const connected = await isStravaConnected();
        updateStravaConnectionUI(connected);

        if (connected) {
            // Load and display activities
            await loadActivities();
            
            // Setup chart toggles
            setupSummaryToggle();
            
            // Update last sync time
            const userData = await getUserData(user.uid);
            if (userData.lastSync) {
                updateLastSyncTime(userData.lastSync.toDate());
            }
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// ========================================
// UPDATE STRAVA CONNECTION UI
// ========================================
function updateStravaConnectionUI(isConnected) {
    const welcomeMessage = document.getElementById('welcome-message');
    const dashboardContent = document.getElementById('dashboard-content');
    const syncIndicator = document.getElementById('strava-connected-indicator');

    if (isConnected) {
        welcomeMessage.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        if (syncIndicator) syncIndicator.classList.remove('hidden');
    } else {
        welcomeMessage.classList.remove('hidden');
        dashboardContent.classList.add('hidden');
        if (syncIndicator) syncIndicator.classList.add('hidden');
    }
}

// ========================================
// UPDATE LAST SYNC TIME
// ========================================
function updateLastSyncTime(date) {
    const lastSyncEl = document.getElementById('last-sync-time');
    if (!lastSyncEl) return;

    const now = new Date();
    const diff = now - date;
    
    // Calculate time difference
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

    lastSyncEl.textContent = timeAgo;
}

// ========================================
// LOAD ACTIVITIES
// ========================================
async function loadActivities() {
    try {
        allActivities = await getAllActivitiesFromFirestore();
        
        if (allActivities.length === 0) {
            displayNoActivities();
            return;
        }

        // Update stats
        updateQuickStats(allActivities);

        // Setup sport filter tabs
        setupSportFilterTabs();

        // Apply default filter (Cycling) and display
        // This will also update charts with filtered data
        applyFilter(currentSportFilter);
    } catch (error) {
        console.error('Error loading activities:', error);
        showError('Failed to load activities');
    }
}

// ========================================
// UPDATE QUICK STATS
// ========================================
function updateQuickStats(activities) {
    // Get current date and time boundaries
    const now = new Date();
    const currentYear = now.getFullYear();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Filter activities by time period
    const thisYearActivities = activities.filter(a => {
        const date = new Date(a.start_date_local);
        return date.getFullYear() === currentYear;
    });
    
    const last30DaysActivities = activities.filter(a => {
        const date = new Date(a.start_date_local);
        return date >= thirtyDaysAgo;
    });
    
    // Calculate All Time stats
    const totalCount = activities.length;
    const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000; // km
    const totalTime = activities.reduce((sum, a) => sum + (a.moving_time || 0), 0) / 3600; // hours
    
    // Calculate This Year stats
    const yearCount = thisYearActivities.length;
    const yearDistance = thisYearActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
    const yearTime = thisYearActivities.reduce((sum, a) => sum + (a.moving_time || 0), 0) / 3600;
    
    // Calculate Last 30 Days stats
    const monthCount = last30DaysActivities.length;
    const monthDistance = last30DaysActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
    const monthTime = last30DaysActivities.reduce((sum, a) => sum + (a.moving_time || 0), 0) / 3600;
    
    // Update All Time stats
    const totalActivitiesEl = document.getElementById('total-activities');
    const totalDistanceEl = document.getElementById('total-distance');
    const totalTimeEl = document.getElementById('total-time');
    
    if (totalActivitiesEl) totalActivitiesEl.textContent = totalCount;
    if (totalDistanceEl) totalDistanceEl.textContent = totalDistance.toFixed(0) + ' km';
    if (totalTimeEl) totalTimeEl.textContent = totalTime.toFixed(0) + 'h';
    
    // Update This Year stats
    const yearActivitiesEl = document.getElementById('year-activities');
    const yearDistanceEl = document.getElementById('year-distance');
    const yearTimeEl = document.getElementById('year-time');
    
    if (yearActivitiesEl) yearActivitiesEl.textContent = yearCount;
    if (yearDistanceEl) yearDistanceEl.textContent = yearDistance.toFixed(0) + ' km';
    if (yearTimeEl) yearTimeEl.textContent = yearTime.toFixed(0) + 'h';
    
    // Update Last 30 Days stats
    const monthActivitiesEl = document.getElementById('month-activities');
    const monthDistanceEl = document.getElementById('month-distance');
    const monthTimeEl = document.getElementById('month-time');
    
    if (monthActivitiesEl) monthActivitiesEl.textContent = monthCount;
    if (monthDistanceEl) monthDistanceEl.textContent = monthDistance.toFixed(0) + ' km';
    if (monthTimeEl) monthTimeEl.textContent = monthTime.toFixed(0) + 'h';
}

// ========================================
// DISPLAY ACTIVITIES LIST
// ========================================
function displayActivitiesList(activities) {
    const listContainer = document.getElementById('activities-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (activities.length === 0) {
        let sportName = currentSportFilter.toLowerCase();
        if (currentSportFilter === 'Ride') sportName = 'cycling';
        if (currentSportFilter === 'VirtualCycling') sportName = 'virtual cycling';
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p style="font-size: 1.25rem; margin-bottom: 0.5rem;">No ${sportName} activities found</p>
                <p>Try selecting a different sport filter</p>
            </div>
        `;
        return;
    }

    activities.forEach(activity => {
        const card = createActivityCard(activity);
        listContainer.appendChild(card);
    });
}

// ========================================
// SPORT FILTER FUNCTIONS
// ========================================
function setupSportFilterTabs() {
    const dropdown = document.getElementById('sport-filter-dropdown');
    if (dropdown) {
        dropdown.addEventListener('change', (e) => {
            const sport = e.target.value;
            applyFilter(sport);
        });
        
        // Set default value
        dropdown.value = currentSportFilter;
    }
}

function applyFilter(sport) {
    currentSportFilter = sport;
    
    if (sport === 'all') {
        filteredActivities = [...allActivities];
    } else {
        // Filter activities by sport type
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
    
    // Reset to first page and display
    currentPage = 1;
    displayActivitiesPage(currentPage);
    setupPaginationControls();
    
    // Update charts with filtered data
    updateAllCharts(filteredActivities, sport);
    
    // Update stats with filtered data
    updateQuickStats(filteredActivities);
}

// ========================================
// PAGINATION FUNCTIONS
// ========================================
function displayActivitiesPage(page, shouldScroll = false) {
    const startIndex = (page - 1) * ACTIVITIES_PER_PAGE;
    const endIndex = startIndex + ACTIVITIES_PER_PAGE;
    const pageActivities = filteredActivities.slice(startIndex, endIndex);
    
    displayActivitiesList(pageActivities);
    updatePaginationInfo(startIndex, endIndex);
    updatePaginationButtons(page);
    
    // Only scroll if explicitly requested (e.g., when clicking pagination buttons)
    if (shouldScroll) {
        const activitiesSection = document.querySelector('.activities-section');
        if (activitiesSection) {
            activitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function updatePaginationInfo(startIndex, endIndex) {
    const paginationInfo = document.getElementById('pagination-info');
    const pageStart = document.getElementById('page-start');
    const pageEnd = document.getElementById('page-end');
    const totalCount = document.getElementById('total-activities-count');
    
    if (filteredActivities.length === 0) {
        paginationInfo.classList.add('hidden');
        return;
    }
    
    paginationInfo.classList.remove('hidden');
    pageStart.textContent = startIndex + 1;
    pageEnd.textContent = Math.min(endIndex, filteredActivities.length);
    totalCount.textContent = filteredActivities.length;
}

function setupPaginationControls() {
    const totalPages = Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE);
    const paginationControls = document.getElementById('pagination-controls');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    
    if (totalPages <= 1) {
        paginationControls.classList.add('hidden');
        return;
    }
    
    paginationControls.classList.remove('hidden');
    
    // Previous button
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displayActivitiesPage(currentPage, true);
        }
    };
    
    // Next button
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayActivitiesPage(currentPage, true);
        }
    };
    
    renderPageNumbers(totalPages);
}

function renderPageNumbers(totalPages) {
    const pageNumbersContainer = document.getElementById('page-numbers');
    pageNumbersContainer.innerHTML = '';
    
    // Calculate which page numbers to show
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // First page and ellipsis
    if (startPage > 1) {
        addPageButton(pageNumbersContainer, 1);
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            pageNumbersContainer.appendChild(ellipsis);
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        addPageButton(pageNumbersContainer, i);
    }
    
    // Ellipsis and last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            pageNumbersContainer.appendChild(ellipsis);
        }
        addPageButton(pageNumbersContainer, totalPages);
    }
}

function addPageButton(container, pageNumber) {
    const btn = document.createElement('button');
    btn.className = 'page-number-btn';
    btn.textContent = pageNumber;
    
    if (pageNumber === currentPage) {
        btn.classList.add('active');
    }
    
    btn.onclick = () => {
        currentPage = pageNumber;
        displayActivitiesPage(currentPage, true);
    };
    
    container.appendChild(btn);
}

function updatePaginationButtons(page) {
    const totalPages = Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE);
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    
    prevBtn.disabled = page === 1;
    nextBtn.disabled = page === totalPages;
    
    renderPageNumbers(totalPages);
}

// ========================================
// CREATE ACTIVITY CARD
// ========================================
function createActivityCard(activity) {
    const card = document.createElement('div');
    card.className = 'activity-card';
    card.style.cursor = 'pointer';

    // Activity icon based on type
    const icon = getActivityIcon(activity.sport_type || activity.type);

    // Format date
    const date = new Date(activity.start_date_local);
    const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });

    // Calculate pace if applicable
    const distance = (activity.distance / 1000).toFixed(2); // km
    const time = formatTime(activity.moving_time);
    const pace = calculatePace(activity.distance, activity.moving_time);

    card.innerHTML = `
        <div class="activity-icon">${icon}</div>
        <div class="activity-details">
            <div class="activity-name">${activity.name}</div>
            <div class="activity-meta">
                ${activity.sport_type || activity.type} • ${formattedDate}
            </div>
        </div>
        <div class="activity-stats">
            <div class="activity-stat">
                <div class="activity-stat-value">${distance}</div>
                <div class="activity-stat-label">km</div>
            </div>
            <div class="activity-stat">
                <div class="activity-stat-value">${time}</div>
                <div class="activity-stat-label">time</div>
            </div>
            ${pace ? `
                <div class="activity-stat">
                    <div class="activity-stat-value">${pace}</div>
                    <div class="activity-stat-label">pace</div>
                </div>
            ` : ''}
        </div>
    `;

    // Add click event to show modal
    card.addEventListener('click', () => {
        showActivityModal(activity);
    });

    return card;
}

// Store chart instances for modal
let modalCharts = [];
let streamCharts = [];
let routeMap = null; // Store map instance

// ========================================
// CREATE ROUTE MAP
// ========================================
function createRouteMap(latlngData) {
    const mapSection = document.getElementById('modal-route-section');
    const mapContainer = document.getElementById('modal-route-map');
    
    // Handle new format: {lat: [...], lng: [...]}
    if (!latlngData || !latlngData.lat || !latlngData.lng || latlngData.lat.length === 0) {
        mapSection.classList.add('hidden');
        return;
    }

    // Show map section
    mapSection.classList.remove('hidden');
    
    // Clear previous map
    mapContainer.innerHTML = '';
    if (routeMap) {
        routeMap.remove();
        routeMap = null;
    }

    // Convert separate lat/lng arrays to Leaflet format [[lat, lng], ...]
    const routeCoords = latlngData.lat.map((lat, i) => [lat, latlngData.lng[i]]);
    
    // Calculate center point
    const centerLat = latlngData.lat.reduce((sum, lat) => sum + lat, 0) / latlngData.lat.length;
    const centerLng = latlngData.lng.reduce((sum, lng) => sum + lng, 0) / latlngData.lng.length;

    // Create map
    routeMap = L.map('modal-route-map').setView([centerLat, centerLng], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(routeMap);

    // Draw route line
    const routeLine = L.polyline(routeCoords, {
        color: '#FC4C02',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
    }).addTo(routeMap);

    // Add start marker (green)
    L.circleMarker(routeCoords[0], {
        radius: 8,
        fillColor: '#22c55e',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
    }).addTo(routeMap).bindPopup('Start');

    // Add end marker (red)
    L.circleMarker(routeCoords[routeCoords.length - 1], {
        radius: 8,
        fillColor: '#ef4444',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
    }).addTo(routeMap).bindPopup('Finish');

    // Fit map to route bounds
    routeMap.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
}

// ========================================
// LOAD STREAM CHARTS (from subcollection)
// ========================================
async function loadStreamCharts(activity) {
    // Destroy previous stream charts
    streamCharts.forEach(chart => chart.destroy());
    streamCharts = [];

    const streamSection = document.getElementById('modal-stream-section');
    const streamContainer = document.getElementById('modal-stream-charts');
    streamContainer.innerHTML = '';

    // Load streams from subcollection
    try {
        const user = auth.currentUser;
        if (!user) {
            streamSection.classList.add('hidden');
            return;
        }

        console.log(`📊 Loading stream data for activity ${activity.id}...`);
        
        let streams = null;
        
        // 1. Try IndexedDB cache first (unlimited storage, best option)
        if (typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
            streams = await cacheDB.getStream(user.uid, activity.id);
            if (streams) {
                console.log('✅ Using cached stream from IndexedDB');
            }
        }
        
        // 2. Fetch from Firestore if not cached
        if (!streams) {
            const streamDoc = await db.collection('users').doc(user.uid)
                .collection('activities').doc(activity.id.toString())
                .collection('streamData').doc('main')
                .get();

            if (!streamDoc.exists) {
                console.log('⚠️ Stream data document not found - activity needs to be re-synced');
                streamSection.classList.add('hidden');
                document.getElementById('modal-route-section').classList.add('hidden');
                
                // Show helpful message to user
                const routeSection = document.getElementById('modal-route-section');
                routeSection.classList.remove('hidden');
                routeSection.innerHTML = `
                    <div style="padding: 2rem; text-align: center; background: var(--background); border-radius: 12px; border: 2px dashed var(--border-color);">
                        <h3 style="margin-bottom: 1rem;">📊 No Detailed Data Available</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                            This activity was synced before detailed charts and route maps were enabled.
                        </p>
                        <p style="color: var(--text-secondary);">
                            <strong>To see charts and route map:</strong><br>
                            1. Open Settings (⚙️)<br>
                            2. Delete all activities<br>
                            3. Sync activities again
                        </p>
                    </div>
                `;
                return;
            }

            streams = streamDoc.data();
            
            // 3. Cache in IndexedDB for next time
            if (typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
                await cacheDB.cacheStream(user.uid, activity.id, streams);
                console.log('💾 Cached stream in IndexedDB');
            }
        }
        
        console.log(`✅ Loaded streams: ${Object.keys(streams).join(', ')}`);
        
        // Create route map if GPS data available (new format: {lat: [...], lng: [...]})
        if (streams.latlng && streams.latlng.lat && streams.latlng.lng) {
            createRouteMap(streams.latlng);
        } else {
            // Hide map section if no GPS data
            document.getElementById('modal-route-section').classList.add('hidden');
        }
        
        streamSection.classList.remove('hidden');

        // Create charts based on available stream data
        const chartsToCreate = [];

        // 1. Heart Rate Zones (if HR data available)
        if (streams.heartrate) {
            chartsToCreate.push(createHRZonesChart(streams.heartrate, streams.time));
        }

        // 2. Pace/Speed Progression
        if (streams.velocity_smooth && streams.time) {
            chartsToCreate.push(createPaceProgressionChart(streams.velocity_smooth, streams.time));
        }

        // 3. Elevation Profile
        if (streams.altitude && streams.distance) {
            chartsToCreate.push(createElevationProfileChart(streams.altitude, streams.distance));
        }

        // 4. Cadence Pattern
        if (streams.cadence && streams.time) {
            chartsToCreate.push(createCadenceChart(streams.cadence, streams.time));
        }

        // 5. Power Output
        if (streams.watts && streams.time) {
            chartsToCreate.push(createPowerChart(streams.watts, streams.time));
        }

        // Render all charts
        chartsToCreate.forEach(chartElement => {
            streamContainer.appendChild(chartElement);
        });
    } catch (error) {
        console.error('Error loading stream charts:', error);
        streamSection.classList.add('hidden');
    }
}

// Create HR Zones Chart
function createHRZonesChart(hrStream, timeStream) {
    const chartCard = document.createElement('div');
    chartCard.className = 'modal-chart-card';
    chartCard.innerHTML = `
        <h4>❤️ Heart Rate Over Time</h4>
        <canvas></canvas>
    `;

    const canvas = chartCard.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    // Convert time to minutes and create data points
    const timeData = timeStream ? timeStream.data : hrStream.data.map((_, i) => i);
    const chartData = timeData.map((t, i) => ({
        x: t / 60, // Convert seconds to minutes
        y: hrStream.data[i]
    }));

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Heart Rate (bpm)',
                data: chartData,
                borderColor: '#fc4c02',
                backgroundColor: 'rgba(252, 76, 2, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].parsed.x.toFixed(1)} min`,
                        label: (item) => `${Math.round(item.parsed.y)} bpm`
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Time (minutes)' },
                    min: 0,
                    max: Math.max(...timeData.map(t => t / 60)),
                    ticks: { 
                        maxTicksLimit: 8,
                        callback: function(value) { return Math.round(value); }
                    }
                },
                y: {
                    title: { display: true, text: 'Heart Rate (bpm)' },
                    beginAtZero: false
                }
            }
        }
    });

    streamCharts.push(chart);
    return chartCard;
}

// Create Pace Progression Chart
function createPaceProgressionChart(velocityStream, timeStream) {
    const chartCard = document.createElement('div');
    chartCard.className = 'modal-chart-card';
    chartCard.innerHTML = `
        <h4>⚡ Speed Over Time</h4>
        <canvas></canvas>
    `;

    const canvas = chartCard.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const timeData = timeStream ? timeStream.data : velocityStream.data.map((_, i) => i);
    const chartData = timeData.map((t, i) => ({
        x: t / 60, // Convert seconds to minutes
        y: velocityStream.data[i] * 3.6 // Convert m/s to km/h
    }));

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Speed (km/h)',
                data: chartData,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].parsed.x.toFixed(1)} min`,
                        label: (item) => `${item.parsed.y.toFixed(1)} km/h`
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Time (minutes)' },
                    min: 0,
                    max: Math.max(...timeData.map(t => t / 60)),
                    ticks: { maxTicksLimit: 8, callback: function(value) { return Math.round(value); } }
                },
                y: {
                    title: { display: true, text: 'Speed (km/h)' },
                    beginAtZero: true
                }
            }
        }
    });

    streamCharts.push(chart);
    return chartCard;
}

// Create Elevation Profile Chart
function createElevationProfileChart(altitudeStream, distanceStream) {
    const chartCard = document.createElement('div');
    chartCard.className = 'modal-chart-card';
    chartCard.innerHTML = `
        <h4>🏔️ Elevation Profile</h4>
        <canvas></canvas>
    `;

    const canvas = chartCard.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const chartData = distanceStream.data.map((d, i) => ({
        x: d / 1000, // Convert meters to km
        y: altitudeStream.data[i]
    }));

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Elevation (m)',
                data: chartData,
                borderColor: '#9C27B0',
                backgroundColor: 'rgba(156, 39, 176, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].parsed.x.toFixed(1)} km`,
                        label: (item) => `${Math.round(item.parsed.y)} m`
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Distance (km)' },
                    min: 0,
                    max: Math.max(...distanceStream.data.map(d => d / 1000)),
                    ticks: { maxTicksLimit: 8, callback: function(value) { return value.toFixed(1); } }
                },
                y: {
                    title: { display: true, text: 'Elevation (m)' },
                    beginAtZero: false
                }
            }
        }
    });

    streamCharts.push(chart);
    return chartCard;
}

// Create Cadence Chart
function createCadenceChart(cadenceStream, timeStream) {
    const chartCard = document.createElement('div');
    chartCard.className = 'modal-chart-card';
    chartCard.innerHTML = `
        <h4>🦵 Cadence Pattern</h4>
        <canvas></canvas>
    `;

    const canvas = chartCard.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const chartData = timeStream.data.map((t, i) => ({
        x: t / 60, // Convert seconds to minutes
        y: cadenceStream.data[i]
    }));

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Cadence (rpm)',
                data: chartData,
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].parsed.x.toFixed(1)} min`,
                        label: (item) => `${Math.round(item.parsed.y)} rpm`
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Time (minutes)' },
                    min: 0,
                    max: Math.max(...timeStream.data.map(t => t / 60)),
                    ticks: { maxTicksLimit: 8, callback: function(value) { return Math.round(value); } }
                },
                y: {
                    title: { display: true, text: 'Cadence (rpm)' },
                    beginAtZero: true
                }
            }
        }
    });

    streamCharts.push(chart);
    return chartCard;
}

// Create Power Output Chart
function createPowerChart(powerStream, timeStream) {
    const chartCard = document.createElement('div');
    chartCard.className = 'modal-chart-card';
    chartCard.innerHTML = `
        <h4>⚡ Power Output</h4>
        <canvas></canvas>
    `;

    const canvas = chartCard.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const chartData = timeStream.data.map((t, i) => ({
        x: t / 60, // Convert seconds to minutes
        y: powerStream.data[i]
    }));

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Power (watts)',
                data: chartData,
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].parsed.x.toFixed(1)} min`,
                        label: (item) => `${Math.round(item.parsed.y)} watts`
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Time (minutes)' },
                    min: 0,
                    max: Math.max(...timeStream.data.map(t => t / 60)),
                    ticks: { maxTicksLimit: 8, callback: function(value) { return Math.round(value); } }
                },
                y: {
                    title: { display: true, text: 'Power (watts)' },
                    beginAtZero: true
                }
            }
        }
    });

    streamCharts.push(chart);
    return chartCard;
}

// ========================================
// SHOW ACTIVITY MODAL
// ========================================
async function showActivityModal(activity) {
    const modal = document.getElementById('activity-modal');
    
    // Populate modal with activity data
    document.getElementById('modal-activity-name').textContent = activity.name;
    
    const date = new Date(activity.start_date_local);
    const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('modal-activity-type').textContent = activity.sport_type || activity.type;
    document.getElementById('modal-activity-date').textContent = formattedDate;
    
    // Distance
    const distance = (activity.distance / 1000).toFixed(2);
    document.getElementById('modal-distance').textContent = distance + ' km';
    
    // Time
    const time = formatTime(activity.moving_time);
    document.getElementById('modal-time').textContent = time;
    
    // Pace
    const pace = calculatePace(activity.distance, activity.moving_time);
    document.getElementById('modal-pace').textContent = pace ? pace + ' min/km' : 'N/A';
    
    // Elevation
    const elevation = activity.total_elevation_gain ? activity.total_elevation_gain.toFixed(0) : '0';
    document.getElementById('modal-elevation').textContent = elevation + ' m';
    
    // Heart Rate
    if (activity.average_heartrate) {
        document.getElementById('modal-hr-avg').textContent = Math.round(activity.average_heartrate) + ' bpm';
    } else {
        document.getElementById('modal-hr-avg').textContent = 'N/A';
    }
    
    if (activity.max_heartrate) {
        document.getElementById('modal-hr-max').textContent = Math.round(activity.max_heartrate) + ' bpm';
    } else {
        document.getElementById('modal-hr-max').textContent = 'N/A';
    }
    
    // Speed
    const avgSpeed = activity.average_speed ? (activity.average_speed * 3.6).toFixed(2) : '0';
    document.getElementById('modal-speed-avg').textContent = avgSpeed + ' km/h';
    
    const maxSpeed = activity.max_speed ? (activity.max_speed * 3.6).toFixed(2) : '0';
    document.getElementById('modal-speed-max').textContent = maxSpeed + ' km/h';
    
    // Kudos and Achievements
    document.getElementById('modal-kudos').textContent = activity.kudos_count || '0';
    document.getElementById('modal-achievements').textContent = activity.achievement_count || '0';
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Load stream charts (detailed analysis) - now async
    await loadStreamCharts(activity);
    
    // Don't load history comparison charts - removed for cleaner view
    // await loadActivityHistoryCharts(activity);
}

// ========================================
// LOAD ACTIVITY HISTORY CHARTS
// ========================================
async function loadActivityHistoryCharts(currentActivity) {
    try {
        // Destroy previous charts
        modalCharts.forEach(chart => chart.destroy());
        modalCharts = [];

        // Get all activities of the same type
        const allActivities = await getAllActivitiesFromFirestore();
        const sameTypeActivities = allActivities
            .filter(a => (a.sport_type || a.type) === (currentActivity.sport_type || currentActivity.type))
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

        if (sameTypeActivities.length < 2) {
            document.getElementById('modal-no-charts').classList.remove('hidden');
            document.getElementById('modal-charts-container').innerHTML = '';
            return;
        }

        document.getElementById('modal-no-charts').classList.add('hidden');
        const container = document.getElementById('modal-charts-container');
        container.innerHTML = '';

        // Prepare data
        const labels = sameTypeActivities.map(a => {
            const date = new Date(a.start_date_local);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // Find current activity index
        const currentIndex = sameTypeActivities.findIndex(a => a.id === currentActivity.id);

        // Chart 1: Distance Over Time
        if (sameTypeActivities.some(a => a.distance > 0)) {
            const distanceData = sameTypeActivities.map(a => (a.distance / 1000).toFixed(2));
            const distanceColors = sameTypeActivities.map((a, idx) => 
                idx === currentIndex ? 'rgba(252, 76, 2, 1)' : 'rgba(102, 126, 234, 0.7)'
            );
            createModalChart(container, 'Distance Over Time (km)', labels, distanceData, distanceColors, ' km');
        }

        // Chart 2: Pace Over Time (for running/walking activities)
        const hasPace = sameTypeActivities.some(a => a.distance > 0 && a.moving_time > 0);
        if (hasPace) {
            const paceData = sameTypeActivities.map(a => {
                if (a.distance > 0 && a.moving_time > 0) {
                    const km = a.distance / 1000;
                    const minutes = a.moving_time / 60;
                    return (minutes / km).toFixed(2);
                }
                return null;
            });
            const paceColors = sameTypeActivities.map((a, idx) => 
                idx === currentIndex ? 'rgba(252, 76, 2, 1)' : 'rgba(40, 167, 69, 0.7)'
            );
            createModalChart(container, 'Pace Over Time (min/km)', labels, paceData, paceColors, ' min/km', true);
        }

        // Chart 3: Moving Time
        if (sameTypeActivities.some(a => a.moving_time > 0)) {
            const timeData = sameTypeActivities.map(a => (a.moving_time / 60).toFixed(0));
            const timeColors = sameTypeActivities.map((a, idx) => 
                idx === currentIndex ? 'rgba(252, 76, 2, 1)' : 'rgba(255, 193, 7, 0.7)'
            );
            createModalChart(container, 'Moving Time (minutes)', labels, timeData, timeColors, ' min');
        }

        // Chart 4: Heart Rate (if available)
        const hasHR = sameTypeActivities.some(a => a.average_heartrate);
        if (hasHR) {
            const hrData = sameTypeActivities.map(a => a.average_heartrate ? Math.round(a.average_heartrate) : null);
            const hrColors = sameTypeActivities.map((a, idx) => 
                idx === currentIndex ? 'rgba(252, 76, 2, 1)' : 'rgba(220, 53, 69, 0.7)'
            );
            createModalChart(container, 'Average Heart Rate (bpm)', labels, hrData, hrColors, ' bpm');
        }

        // Chart 5: Elevation Gain (if available)
        const hasElevation = sameTypeActivities.some(a => a.total_elevation_gain > 0);
        if (hasElevation) {
            const elevData = sameTypeActivities.map(a => a.total_elevation_gain ? a.total_elevation_gain.toFixed(0) : null);
            const elevColors = sameTypeActivities.map((a, idx) => 
                idx === currentIndex ? 'rgba(252, 76, 2, 1)' : 'rgba(118, 75, 162, 0.7)'
            );
            createModalChart(container, 'Elevation Gain (m)', labels, elevData, elevColors, ' m');
        }

        // Chart 6: Average Speed
        if (sameTypeActivities.some(a => a.average_speed > 0)) {
            const speedData = sameTypeActivities.map(a => a.average_speed ? (a.average_speed * 3.6).toFixed(2) : null);
            const speedColors = sameTypeActivities.map((a, idx) => 
                idx === currentIndex ? 'rgba(252, 76, 2, 1)' : 'rgba(23, 162, 184, 0.7)'
            );
            createModalChart(container, 'Average Speed (km/h)', labels, speedData, speedColors, ' km/h');
        }

    } catch (error) {
        console.error('Error loading activity history charts:', error);
    }
}

// ========================================
// CREATE MODAL CHART
// ========================================
function createModalChart(container, title, labels, data, colors, suffix = '', invertY = false) {
    const chartCard = document.createElement('div');
    chartCard.className = 'modal-chart-card';
    
    const chartTitle = document.createElement('h4');
    chartTitle.textContent = title;
    chartCard.appendChild(chartTitle);
    
    const canvas = document.createElement('canvas');
    chartCard.appendChild(canvas);
    container.appendChild(chartCard);

    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: colors.map(c => c.replace('1)', '0.2)')),
                borderColor: colors,
                borderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: colors,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.parsed.y === null) return 'No data';
                            if (title.includes('Pace')) {
                                const pace = parseFloat(context.parsed.y);
                                const min = Math.floor(pace);
                                const sec = Math.round((pace - min) * 60);
                                return `${min}:${String(sec).padStart(2, '0')} min/km`;
                            }
                            return context.parsed.y + suffix;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: !invertY,
                    reverse: invertY && title.includes('Pace'),
                    ticks: {
                        callback: function(value) {
                            if (title.includes('Pace')) {
                                return value.toFixed(1);
                            }
                            return value + suffix;
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });

    modalCharts.push(chart);
}

// ========================================
// HIDE ACTIVITY MODAL
// ========================================
function hideActivityModal() {
    const modal = document.getElementById('activity-modal');
    modal.classList.add('hidden');
    
    // Destroy modal charts
    modalCharts.forEach(chart => chart.destroy());
    modalCharts = [];
}

// ========================================
// SHOW SETTINGS MODAL
// ========================================
async function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const user = auth.currentUser;
    
    if (!user) return;

    try {
        // Update account info
        document.getElementById('settings-email').textContent = user.email;
        document.getElementById('settings-name').textContent = user.displayName || 'Not set';

        // Check Strava connection
        const userData = await getUserData(user.uid);
        const isConnected = userData.stravaConnected || false;

        // Update Strava status in settings
        const notConnected = document.getElementById('settings-not-connected');
        const connected = document.getElementById('settings-connected');
        const syncNowBtn = document.getElementById('settings-sync-now-btn');

        if (isConnected) {
            notConnected.classList.add('hidden');
            connected.classList.remove('hidden');
            if (syncNowBtn) syncNowBtn.disabled = false;

            // Show athlete ID
            if (userData.stravaAthleteId) {
                document.getElementById('settings-athlete-id').textContent = userData.stravaAthleteId;
            }

            // Show last sync time
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
            if (syncNowBtn) syncNowBtn.disabled = true;
        }

        // Update activity count
        const activities = await getAllActivitiesFromFirestore();
        const activityCount = activities.length;
        document.getElementById('settings-activity-count').textContent = activityCount;

        // Enable/disable delete button based on activity count
        const deleteBtn = document.getElementById('settings-delete-all-btn');
        if (deleteBtn) {
            deleteBtn.disabled = activityCount === 0;
        }

        // Calculate cache statistics
        updateCacheStats();

    } catch (error) {
        console.error('Error loading settings:', error);
    }

    modal.classList.remove('hidden');
}

// ========================================
// UPDATE CACHE STATISTICS
// ========================================
function updateCacheStats() {
    try {
        let totalSize = 0;
        let itemCount = 0;
        
        // Count items with our cache prefixes
        const cacheKeys = ['activities_', 'streamData_', 'hrZone_'];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (cacheKeys.some(prefix => key.startsWith(prefix))) {
                itemCount++;
                const item = localStorage.getItem(key);
                if (item) {
                    totalSize += item.length;
                }
            }
        }
        
        // Convert to KB
        const sizeKB = (totalSize / 1024).toFixed(2);
        
        document.getElementById('settings-cache-count').textContent = itemCount;
        document.getElementById('settings-cache-size').textContent = `${sizeKB} KB`;
        
    } catch (error) {
        console.error('Error calculating cache stats:', error);
        document.getElementById('settings-cache-count').textContent = 'Error';
        document.getElementById('settings-cache-size').textContent = 'Error';
    }
}

// ========================================
// CLEAR ALL CACHE
// ========================================
function clearAllCache() {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        let cleared = 0;
        const cacheKeys = ['activities_', 'streamData_', 'hrZone_'];
        
        // Find all cache keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (cacheKeys.some(prefix => key.startsWith(prefix))) {
                keysToRemove.push(key);
            }
        }
        
        // Remove all cache keys
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            cleared++;
        });
        
        console.log(`🗑️ Cleared ${cleared} cache items`);
        
        // Update stats
        updateCacheStats();
        
        // Show success message
        alert(`✅ Cache cleared!\n\nRemoved ${cleared} cached items.\n\nThe next page load will fetch fresh data from Firestore.`);
        
    } catch (error) {
        console.error('Error clearing cache:', error);
        alert('❌ Failed to clear cache. Please try again.');
    }
}

// ========================================
// HIDE SETTINGS MODAL
// ========================================
function hideSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('hidden');
}

// ========================================
// GET ACTIVITY ICON
// ========================================
function getActivityIcon(type) {
    const icons = {
        'Run': '🏃',
        'Ride': '🚴',
        'VirtualRide': '🚴',
        'Swim': '🏊',
        'Walk': '🚶',
        'Hike': '🥾',
        'AlpineSki': '⛷️',
        'BackcountrySki': '⛷️',
        'NordicSki': '⛷️',
        'Snowboard': '🏂',
        'Rowing': '🚣',
        'Kayaking': '🛶',
        'Canoeing': '🛶',
        'Badminton': '🏸',
        'Workout': '💪',
        'WeightTraining': '🏋️',
        'Yoga': '🧘',
        'default': '🏃'
    };

    return icons[type] || icons['default'];
}

// ========================================
// FORMAT TIME (seconds to HH:MM:SS or MM:SS)
// ========================================
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    }
}

// ========================================
// CALCULATE PACE (min/km)
// ========================================
function calculatePace(distance, time) {
    if (!distance || distance === 0) return null;
    
    const km = distance / 1000;
    const minutes = time / 60;
    const paceMinutes = minutes / km;
    
    const min = Math.floor(paceMinutes);
    const sec = Math.round((paceMinutes - min) * 60);
    
    return `${min}:${String(sec).padStart(2, '0')}`;
}

// ========================================
// DISPLAY NO ACTIVITIES MESSAGE
// ========================================
function displayNoActivities() {
    const listContainer = document.getElementById('activities-list');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');
    
    if (!listContainer) return;

    listContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
            <p style="font-size: 1.25rem; margin-bottom: 0.5rem;">No activities found</p>
            <p>Sync your Strava data from Settings</p>
        </div>
    `;
    
    // Hide pagination when no activities
    if (paginationInfo) paginationInfo.classList.add('hidden');
    if (paginationControls) paginationControls.classList.add('hidden');
}

// ========================================
// SYNC ACTIVITIES HANDLER
// ========================================
async function handleSyncActivities() {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    try {
        loadingOverlay.classList.remove('hidden');
        
        console.log('🔄 Starting activity sync...');
        const totalSynced = await syncAllActivities();
        console.log(`✅ Sync completed: ${totalSynced} activities`);
        
        // Reload activities
        await loadActivities();
        
        // Update last sync time
        const userData = await getUserData(auth.currentUser.uid);
        if (userData.lastSync) {
            updateLastSyncTime(userData.lastSync.toDate());
        }
        
        alert(`Successfully synced ${totalSynced} activities!`);
    } catch (error) {
        console.error('❌ Error syncing activities:', error);
        
        // Show more detailed error message
        let errorMessage = 'Failed to sync activities. ';
        
        if (error.message.includes('Strava not connected')) {
            errorMessage += 'Please connect your Strava account first.';
        } else if (error.message.includes('No user logged in')) {
            errorMessage += 'Please log in again.';
        } else if (error.message.includes('token')) {
            errorMessage += 'Authentication error. Try disconnecting and reconnecting Strava.';
        } else if (error.message.includes('rate limit')) {
            errorMessage += 'Strava API rate limit exceeded. Please wait 15 minutes and try again.';
        } else {
            errorMessage += `Error: ${error.message}\n\nCheck browser console (F12) for details.`;
        }
        
        alert(errorMessage);
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

// ========================================
// SHOW ERROR MESSAGE
// ========================================
function showError(message) {
    alert(message);
}

// ========================================
// EVENT LISTENERS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth state
    auth.onAuthStateChanged((user) => {
        if (user && window.location.pathname.includes('dashboard.html')) {
            initializeDashboard();
        }
    });

    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }

    // Connect Strava button (in settings)
    const settingsConnectBtn = document.getElementById('settings-connect-strava-btn');
    if (settingsConnectBtn) {
        settingsConnectBtn.addEventListener('click', () => {
            connectStrava();
        });
    }

    // Sync activities button (in settings)
    const settingsSyncBtn = document.getElementById('settings-sync-now-btn');
    if (settingsSyncBtn) {
        settingsSyncBtn.addEventListener('click', async () => {
            hideSettingsModal();
            await handleSyncActivities();
        });
    }

    // Delete all activities button (in settings)
    const settingsDeleteBtn = document.getElementById('settings-delete-all-btn');
    if (settingsDeleteBtn) {
        settingsDeleteBtn.addEventListener('click', async () => {
            const confirmed = confirm('⚠️ WARNING: This will permanently delete all your synced activities!\n\nYou can re-sync them from Strava afterwards.\n\nAre you sure?');
            if (!confirmed) return;
            
            const doubleCheck = confirm('This action cannot be undone. Are you REALLY sure?');
            if (!doubleCheck) return;

            try {
                settingsDeleteBtn.disabled = true;
                settingsDeleteBtn.textContent = '🗑️ Deleting...';
                
                const deletedCount = await deleteAllActivities();
                
                // Refresh the dashboard
                hideSettingsModal();
                await initializeDashboard();
                
                alert(`✅ Successfully deleted ${deletedCount} activities!\n\nYou can now re-sync with the latest data.`);
            } catch (error) {
                console.error('Error deleting activities:', error);
                alert('❌ Failed to delete activities. Check console for details.');
            } finally {
                settingsDeleteBtn.disabled = false;
                settingsDeleteBtn.textContent = '🗑️ Delete All Activities';
            }
        });
    }

    // Disconnect Strava button (in settings)
    const settingsDisconnectBtn = document.getElementById('settings-disconnect-strava-btn');
    if (settingsDisconnectBtn) {
        settingsDisconnectBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to disconnect Strava? Your activities will remain stored.')) {
                try {
                    await disconnectStrava();
                    updateStravaConnectionUI(false);
                    hideSettingsModal();
                    alert('Strava disconnected successfully');
                } catch (error) {
                    console.error('Error disconnecting:', error);
                    alert('Failed to disconnect Strava');
                }
            }
        });
    }

    // Clear cache button (in settings)
    const settingsClearCacheBtn = document.getElementById('settings-clear-cache-btn');
    if (settingsClearCacheBtn) {
        settingsClearCacheBtn.addEventListener('click', () => {
            const confirmed = confirm('Clear all cached data?\n\nThis will free up space but the next page load will fetch fresh data from Firestore.');
            if (confirmed) {
                clearAllCache();
            }
        });
    }

    // Settings modal close button
    const settingsCloseBtn = document.getElementById('settings-close');
    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', hideSettingsModal);
    }

    // Settings modal - close when clicking outside
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                hideSettingsModal();
            }
        });
    }

    // Activity modal close button
    const modalCloseBtn = document.querySelector('.modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', hideActivityModal);
    }

    // Close modal when clicking outside
    const modal = document.getElementById('activity-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideActivityModal();
            }
        });
    }

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideActivityModal();
            hideSettingsModal();
        }
    });
});

// ========================================
// HAMBURGER MENU
// ========================================
function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const slideMenu = document.getElementById('slide-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    
    // Open menu
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.add('active');
            slideMenu.classList.add('active');
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Close menu function
    const closeMenu = () => {
        if (hamburgerBtn) hamburgerBtn.classList.remove('active');
        if (slideMenu) slideMenu.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    // Close menu button
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }
    
    // Close menu on overlay click
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }
    
    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && slideMenu && slideMenu.classList.contains('active')) {
            closeMenu();
        }
    });
}
