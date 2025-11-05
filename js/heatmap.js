// ========================================
// HEATMAP PAGE - Activity Route Heatmap
// ========================================

let map = null;
let heatLayer = null;
let routeLayers = []; // Store all route polylines
let allActivities = [];
let currentSportFilter = 'all';
let currentView = 'heatmap'; // 'heatmap' or 'routes'
let gpsDataCache = {}; // Cache loaded GPS data by activity ID
let lineOpacityMode = 'solid'; // 'solid' or 'heatmap'

// ========================================
// INITIALIZE HEATMAP
// ========================================
async function initializeHeatmap() {
    try {
        // Check authentication
        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in, redirecting...');
            window.location.href = 'index.html';
            return;
        }

        console.log('🔥 Initializing heatmap for user:', user.email);

        // Initialize map
        map = L.map('heatmap').setView([51.505, -0.09], 13); // Default center

        // Define different map layers
        const baseLayers = {
            "🗺️ Street Map": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }),
            "🌄 Terrain": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenTopoMap contributors',
                maxZoom: 17
            }),
            "🛰️ Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri',
                maxZoom: 18
            }),
            "🌙 Dark Mode": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© CartoDB',
                maxZoom: 19
            }),
            "🎨 Watercolor": L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
                attribution: '© Stamen Design',
                maxZoom: 16
            }),
            "🚴 Cycling": L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
                attribution: '© CyclOSM',
                maxZoom: 18
            })
        };

        // Add default layer (Street Map)
        baseLayers["🗺️ Street Map"].addTo(map);

        // Setup map opacity control
        setupMapOpacityControl(baseLayers);

        // Setup map type dropdown
        setupMapTypeDropdown(baseLayers);

        // Setup line opacity mode toggle
        setupLineOpacityToggle();

        // Load activities and create heatmap
        await loadActivitiesForHeatmap();

        // Setup sport filter buttons
        setupSportFilters();

        // Setup view toggle buttons
        setupViewToggle();

        // Hide loading overlay
        document.getElementById('loading-overlay').classList.add('hidden');

    } catch (error) {
        console.error('Error initializing heatmap:', error);
        alert('Failed to load heatmap. Please try again.');
    }
}

// ========================================
// LOAD ACTIVITIES FOR HEATMAP
// ========================================
async function loadActivitiesForHeatmap() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        // Check localStorage cache first
        const cacheKey = `activities_${user.uid}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            try {
                const parsedCache = JSON.parse(cached);
                console.log('✅ Using cached activities from localStorage');
                allActivities = parsedCache.data;
                
                // Render with current filter and view
                await renderMap(currentSportFilter, currentView);
                return;
            } catch (e) {
                console.warn('Failed to parse activity cache, fetching fresh:', e);
                localStorage.removeItem(cacheKey);
            }
        }

        console.log('📥 Loading activities from Firestore...');

        // Get all activities for the user
        const snapshot = await db.collection('users').doc(user.uid)
            .collection('activities')
            .get();

        allActivities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Loaded ${allActivities.length} activities`);

        // Cache the results (backup to localStorage, primary is IndexedDB)
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                data: allActivities,
                timestamp: Date.now()
            }));
            console.log(`💾 Cached ${allActivities.length} activities (localStorage backup)`);
        } catch (e) {
            // Silently fail localStorage - IndexedDB is primary cache
            console.log(`ℹ️ localStorage full (this is fine - using IndexedDB for ${allActivities.length} activities)`);
        }

        // Render with current filter and view
        await renderMap(currentSportFilter, currentView);

    } catch (error) {
        console.error('Error loading activities:', error);
        throw error;
    }
}

// ========================================
// RENDER MAP (Heatmap or Routes)
// ========================================
async function renderMap(sportType, viewType) {
    try {
        console.log(`🗺️ Rendering ${viewType} for: ${sportType}`);

        // Filter activities by sport type
        let filteredActivities = allActivities;
        if (sportType !== 'all') {
            filteredActivities = allActivities.filter(activity => 
                activity.sport_type === sportType || activity.type === sportType
            );
        }

        console.log(`   Filtered to ${filteredActivities.length} activities`);

        // Filter activities with streams
        const activitiesWithStreams = filteredActivities.filter(a => a.hasStreams);
        console.log(`   ${activitiesWithStreams.length} activities have GPS data`);

        if (activitiesWithStreams.length === 0) {
            document.getElementById('activities-count').textContent = '0';
            alert(`No GPS data available for ${sportType === 'all' ? 'any activities' : sportType}.\n\nMake sure you have synced activities with GPS data.`);
            return;
        }

        // Load GPS data in parallel with IndexedDB caching (unlimited storage!)
        const user = auth.currentUser;
        
        // Step 1: Check in-memory cache first (fastest)
        const uncachedActivities = activitiesWithStreams.filter(a => !gpsDataCache[a.id]);
        const memCached = activitiesWithStreams.length - uncachedActivities.length;
        
        if (memCached > 0) {
            console.log(`   ⚡ ${memCached} activities from memory cache`);
        }
        
        // Step 2: Batch load from IndexedDB for uncached activities
        let idbCachedStreams = {};
        if (uncachedActivities.length > 0 && typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
            const activityIds = uncachedActivities.map(a => a.id);
            idbCachedStreams = await cacheDB.getMultipleStreams(user.uid, activityIds);
            
            // Store in memory cache
            for (const [activityId, streams] of Object.entries(idbCachedStreams)) {
                gpsDataCache[activityId] = streams;
            }
        }
        
        // Step 3: Determine which activities need Firestore fetch
        const stillUncached = uncachedActivities.filter(a => !idbCachedStreams[a.id]);
        
        if (stillUncached.length > 0) {
            console.log(`   ⬇️ Loading ${stillUncached.length} GPS datasets from Firestore...`);
        }
        
        // Step 4: Fetch from Firestore and cache in IndexedDB
        const streamPromises = activitiesWithStreams.map(async (activity) => {
            // Return from memory cache if available
            if (gpsDataCache[activity.id]) {
                return {
                    activity: activity,
                    streams: gpsDataCache[activity.id],
                    cached: true
                };
            }
            
            // Fetch from Firestore
            try {
                const doc = await db.collection('users').doc(user.uid)
                    .collection('activities').doc(activity.id.toString())
                    .collection('streamData').doc('main')
                    .get();
                
                const streams = doc.exists ? doc.data() : null;
                
                // Cache in IndexedDB and memory
                if (streams) {
                    gpsDataCache[activity.id] = streams;
                    
                    if (typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
                        await cacheDB.cacheStream(user.uid, activity.id, streams);
                    }
                }
                
                return {
                    activity: activity,
                    streams: streams,
                    cached: false
                };
            } catch (error) {
                console.warn(`Failed to load GPS for activity ${activity.id}:`, error);
                return { activity: activity, streams: null, cached: false };
            }
        });
        
        const startTime = Date.now();
        const results = await Promise.all(streamPromises);
        const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        console.log(`   ✅ All GPS data ready in ${loadTime}s`);

        // Collect all GPS points from results
        const allPoints = [];
        const activitiesWithGPSData = [];

        for (const result of results) {
            if (result.streams && result.streams.latlng && 
                result.streams.latlng.lat && result.streams.latlng.lng) {
                
                activitiesWithGPSData.push(result);
                
                // Add all GPS points from this activity
                for (let i = 0; i < result.streams.latlng.lat.length; i++) {
                    allPoints.push([
                        result.streams.latlng.lat[i],
                        result.streams.latlng.lng[i],
                        1 // Intensity
                    ]);
                }
            }
        }

        const activitiesWithGPS = activitiesWithGPSData.length;

        console.log(`   Collected ${allPoints.length} GPS points from ${activitiesWithGPS} activities`);

        // Update stats
        document.getElementById('activities-count').textContent = activitiesWithGPS;

        // Remove existing layers
        if (heatLayer) {
            map.removeLayer(heatLayer);
            heatLayer = null;
        }
        routeLayers.forEach(layer => map.removeLayer(layer));
        routeLayers = [];

        if (allPoints.length === 0) {
            // No GPS data available
            console.log('⚠️ No GPS data available for selected sport type');
            if (activitiesWithGPS === 0) {
                alert(`No GPS data available for ${sportType === 'all' ? 'any activities' : sportType}.\n\nMake sure you have synced activities with GPS data.`);
            }
            return;
        }

        // Render based on view type
        if (viewType === 'heatmap') {
            // ========== HEATMAP VIEW ==========
            // Smaller radius and minimal blur for sharper, more readable lines
            heatLayer = L.heatLayer(allPoints, {
                radius: 5,   // Much smaller for clearer individual routes
                blur: 6,    // Minimal blur for sharp definition
                maxZoom: 17,
                max: 1.0,
                gradient: {
                    0.0: 'blue',
                    0.3: 'cyan',
                    0.5: 'lime',
                    0.7: 'yellow',
                    1.0: 'red'
                }
            }).addTo(map);

            // Fit map to show all points
            const bounds = L.latLngBounds(allPoints.map(p => [p[0], p[1]]));
            map.fitBounds(bounds, { padding: [50, 50] });

        } else if (viewType === 'routes') {
            // ========== ROUTES VIEW ==========
            // Use already-loaded GPS data (no additional fetching needed!)
            
            const totalRoutes = activitiesWithGPSData.length;
            
            activitiesWithGPSData.forEach((result, index) => {
                try {
                    const activity = result.activity;
                    const streams = result.streams;
                    
                    // Convert to route coordinates
                    const routeCoords = streams.latlng.lat.map((lat, i) => [lat, streams.latlng.lng[i]]);
                    
                    // Calculate opacity based on mode
                    let opacity;
                    if (lineOpacityMode === 'solid') {
                        // Solid mode: 100% opacity for all routes
                        opacity = 1.0;
                    } else {
                        // Heatmap mode: opacity decreases with more routes
                        // This creates a cumulative effect where overlapping routes appear darker
                        if (totalRoutes <= 5) {
                            opacity = 0.7;
                        } else if (totalRoutes <= 10) {
                            opacity = 0.5;
                        } else if (totalRoutes <= 20) {
                            opacity = 0.35;
                        } else if (totalRoutes <= 50) {
                            opacity = 0.25;
                        } else {
                            opacity = 0.15;
                        }
                    }
                    
                    // Draw route line with increased visibility
                    const routeLine = L.polyline(routeCoords, {
                        color: '#FC4C02',  // Strava orange
                        weight: 3,  // Line width for better visibility
                        opacity: opacity,
                        smoothFactor: 1,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }).addTo(map);

                    // Add popup
                    const popupContent = `
                        <strong>${activity.name}</strong><br>
                        ${activity.sport_type || activity.type}<br>
                        ${(activity.distance / 1000).toFixed(2)} km
                    `;
                    routeLine.bindPopup(popupContent);

                    routeLayers.push(routeLine);
                } catch (error) {
                    console.warn(`Failed to render route for activity ${result.activity.id}:`, error);
                }
            });

            // Fit map to show all routes
            if (routeLayers.length > 0) {
                const group = L.featureGroup(routeLayers);
                map.fitBounds(group.getBounds(), { padding: [50, 50] });
            }
        }

    } catch (error) {
        console.error('Error rendering map:', error);
        throw error;
    }
}

// ========================================
// SETUP SPORT FILTERS
// ========================================
function setupSportFilters() {
    const filterButtons = document.querySelectorAll('.sport-filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Get sport type
            const sportType = button.getAttribute('data-sport');
            currentSportFilter = sportType;

            // Show loading
            document.getElementById('loading-overlay').classList.remove('hidden');

            // Render map with new filter and current view
            await renderMap(sportType, currentView);

            // Hide loading
            document.getElementById('loading-overlay').classList.add('hidden');
        });
    });
}

// ========================================
// SETUP VIEW TOGGLE
// ========================================
function setupViewToggle() {
    const toggleButtons = document.querySelectorAll('.view-toggle-btn');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Update active state
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Get view type
            const viewType = button.getAttribute('data-view');
            currentView = viewType;

            // Show loading
            document.getElementById('loading-overlay').classList.remove('hidden');

            // Render map with current filter and new view
            await renderMap(currentSportFilter, viewType);

            // Hide loading
            document.getElementById('loading-overlay').classList.add('hidden');
        });
    });
}

// ========================================
// SETUP MAP TYPE DROPDOWN
// ========================================
function setupMapTypeDropdown(baseLayers) {
    const mapTypeSelect = document.getElementById('map-type-select');
    let currentLayer = baseLayers["🗺️ Street Map"];

    // Map dropdown values to layer keys
    const layerMap = {
        'streets': "🗺️ Street Map",
        'outdoors': "🌄 Terrain",
        'satellite': "🛰️ Satellite",
        'dark': "🌙 Dark Mode",
        'light': "🎨 Watercolor"
    };

    mapTypeSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        const layerKey = layerMap[selectedValue];
        const newLayer = baseLayers[layerKey];

        if (newLayer && newLayer !== currentLayer) {
            // Remove current layer
            if (map.hasLayer(currentLayer)) {
                map.removeLayer(currentLayer);
            }

            // Add new layer
            newLayer.addTo(map);
            
            // Apply current opacity
            const slider = document.getElementById('map-opacity-slider');
            const currentOpacity = slider.value / 100;
            newLayer.setOpacity(currentOpacity);

            currentLayer = newLayer;
        }
    });
}

// ========================================
// SETUP MAP OPACITY CONTROL
// ========================================
function setupMapOpacityControl(baseLayers) {
    const slider = document.getElementById('map-opacity-slider');
    const valueDisplay = document.getElementById('opacity-value');

    slider.addEventListener('input', function() {
        const opacity = this.value / 100;
        valueDisplay.textContent = this.value + '%';

        // Apply opacity to all base layers
        Object.values(baseLayers).forEach(layer => {
            if (map.hasLayer(layer)) {
                layer.setOpacity(opacity);
            }
        });
    });

    // Also update opacity when layer changes
    map.on('baselayerchange', function(e) {
        const currentOpacity = slider.value / 100;
        e.layer.setOpacity(currentOpacity);
    });
}

// ========================================
// SETUP LINE OPACITY MODE TOGGLE
// ========================================
function setupLineOpacityToggle() {
    const buttons = document.querySelectorAll('.line-mode-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update mode
            lineOpacityMode = this.getAttribute('data-mode');
            
            // Re-render routes if in routes view
            if (currentView === 'routes') {
                renderMap(currentSportFilter, currentView);
            }
        });
    });
}

// ========================================
// INITIALIZATION
// ========================================
// Wait for auth state to be ready
auth.onAuthStateChanged((user) => {
    if (user) {
        initializeHeatmap();
    } else {
        window.location.href = 'index.html';
    }
});
