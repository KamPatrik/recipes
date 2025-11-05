// ========================================
// STRAVA API CONFIGURATION
// ========================================
const STRAVA_CLIENT_ID = '105945';
const STRAVA_CLIENT_SECRET = '4a765020553c25ab1f555cc5a35e94ba6b985b09';
const STRAVA_REDIRECT_URI = 'http://localhost:3000/strava-callback.html'; // Change to your hosted URL when deploying

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

// ========================================
// TESTING MODE - LIMIT API CALLS
// ========================================
// Set to true to limit activity sync (saves API calls during testing)
const TESTING_MODE = true;
const TESTING_MAX_ACTIVITIES = 100; // Only fetch this many activities in testing mode

// ========================================
// ACTIVITY STREAMS - DETAILED DATA
// ========================================
// Fetch detailed time-series data (HR, speed, altitude over time)
// ✅ ENABLED: Streams now stored in subcollections to avoid index errors
const FETCH_ACTIVITY_STREAMS = true; // Streams stored in activities/{id}/streamData/main
const STREAM_TYPES = ['heartrate', 'distance', 'altitude', 'time', 'latlng', 'velocity_smooth', 'cadence', 'watts'];
// Available streams: heartrate, distance, altitude, time, latlng, velocity_smooth, cadence, watts, temp, moving, grade_smooth

// Downsampling configuration
const DOWNSAMPLE_STREAMS = true; // Reduce data points for better performance
const DOWNSAMPLE_FACTOR = 10; // Keep every 10th data point (90% reduction)

// ========================================
// CONNECT TO STRAVA (OAuth Flow)
// ========================================
function connectStrava() {
    const scope = 'read,activity:read_all,profile:read_all';
    const authUrl = `${STRAVA_AUTH_URL}?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&approval_prompt=force&scope=${scope}`;
    
    // Redirect to Strava authorization page
    window.location.href = authUrl;
}

// ========================================
// EXCHANGE AUTHORIZATION CODE FOR TOKENS
// ========================================
async function exchangeStravaToken(code) {
    try {
        const response = await fetch(STRAVA_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to exchange token');
        }

        const data = await response.json();
        
        // Store tokens in Firestore
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        await db.collection('users').doc(user.uid).set({
            email: user.email,
            displayName: user.displayName || user.email,
            stravaConnected: true,
            stravaAccessToken: data.access_token,
            stravaRefreshToken: data.refresh_token,
            stravaExpiresAt: data.expires_at,
            stravaAthleteId: data.athlete.id,
            stravaProfile: {
                firstname: data.athlete.firstname,
                lastname: data.athlete.lastname,
                profile: data.athlete.profile_medium || data.athlete.profile,
                city: data.athlete.city,
                state: data.athlete.state,
                country: data.athlete.country,
                sex: data.athlete.sex,
                premium: data.athlete.premium
            },
            lastSync: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('Strava connected successfully');
        return data;
    } catch (error) {
        console.error('Error exchanging Strava token:', error);
        throw error;
    }
}

// ========================================
// REFRESH STRAVA ACCESS TOKEN
// ========================================
async function refreshStravaToken(refreshToken) {
    try {
        const response = await fetch(STRAVA_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        
        // Update tokens in Firestore
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        await db.collection('users').doc(user.uid).set({
            stravaAccessToken: data.access_token,
            stravaRefreshToken: data.refresh_token,
            stravaExpiresAt: data.expires_at
        }, { merge: true });

        console.log('Strava token refreshed');
        return data.access_token;
    } catch (error) {
        console.error('Error refreshing Strava token:', error);
        throw error;
    }
}

// ========================================
// GET VALID ACCESS TOKEN
// ========================================
async function getValidAccessToken() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('No user logged in');
    }

    const userData = await getUserData(user.uid);
    
    if (!userData.stravaConnected) {
        throw new Error('Strava not connected');
    }

    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is expired (with 5 minute buffer)
    if (userData.stravaExpiresAt <= now + 300) {
        console.log('Token expired, refreshing...');
        return await refreshStravaToken(userData.stravaRefreshToken);
    }

    return userData.stravaAccessToken;
}

// ========================================
// FETCH STRAVA ACTIVITIES
// ========================================
async function fetchStravaActivities(perPage = 50, page = 1) {
    try {
        const accessToken = await getValidAccessToken();
        
        const response = await fetch(
            `${STRAVA_API_BASE}/athlete/activities?per_page=${perPage}&page=${page}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            // Check for rate limiting
            if (response.status === 429) {
                const rateLimitInfo = {
                    limit: response.headers.get('X-RateLimit-Limit'),
                    usage: response.headers.get('X-RateLimit-Usage')
                };
                console.error('⚠️ Strava API rate limit exceeded:', rateLimitInfo);
                throw new Error('Strava API rate limit exceeded. Please wait 15 minutes and try again.');
            }
            
            // Check for authentication errors
            if (response.status === 401) {
                throw new Error('Strava authentication failed. Please reconnect your Strava account.');
            }
            
            throw new Error(`Failed to fetch activities (Status: ${response.status})`);
        }

        const activities = await response.json();
        console.log(`Fetched ${activities.length} activities from Strava (page ${page})`);
        return activities;
    } catch (error) {
        console.error('Error fetching Strava activities:', error);
        throw error;
    }
}

// ========================================
// DOWNSAMPLE STREAM DATA
// ========================================
function downsampleStream(streamData, factor) {
    // Handle latlng special format (separate lat/lng arrays)
    if (streamData && streamData.lat && streamData.lng) {
        const originalSize = streamData.lat.length;
        const downsampledLat = [];
        const downsampledLng = [];
        
        // Always keep first and last points for accuracy
        for (let i = 0; i < streamData.lat.length; i += factor) {
            downsampledLat.push(streamData.lat[i]);
            downsampledLng.push(streamData.lng[i]);
        }
        
        // Ensure we have the last point
        if (downsampledLat[downsampledLat.length - 1] !== streamData.lat[originalSize - 1]) {
            downsampledLat.push(streamData.lat[originalSize - 1]);
            downsampledLng.push(streamData.lng[originalSize - 1]);
        }
        
        return {
            lat: downsampledLat,
            lng: downsampledLng,
            original_size: originalSize,
            resolution: factor,
            type: 'latlng'
        };
    }
    
    // Handle regular stream data format
    if (!streamData || !streamData.data || !Array.isArray(streamData.data)) {
        return streamData;
    }
    
    const originalSize = streamData.data.length;
    const downsampledData = [];
    
    // Always keep first and last points for accuracy
    for (let i = 0; i < streamData.data.length; i += factor) {
        downsampledData.push(streamData.data[i]);
    }
    
    // Ensure we have the last point
    if (downsampledData[downsampledData.length - 1] !== streamData.data[originalSize - 1]) {
        downsampledData.push(streamData.data[originalSize - 1]);
    }
    
    return {
        data: downsampledData,
        original_size: originalSize,
        resolution: factor
    };
}

// ========================================
// FETCH ACTIVITY STREAMS (Detailed Data)
// ========================================
async function fetchActivityStreams(activityId) {
    try {
        const accessToken = await getValidAccessToken();
        
        const streamTypesParam = STREAM_TYPES.join(',');
        const response = await fetch(
            `${STRAVA_API_BASE}/activities/${activityId}/streams?keys=${streamTypesParam}&key_by_type=true`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            // Some activities might not have streams (e.g., manual entries)
            console.log(`No streams available for activity ${activityId}`);
            return null;
        }

        const streams = await response.json();
        
        // Firestore doesn't support nested arrays, so we need to flatten latlng data
        // Convert [[lat1,lng1], [lat2,lng2]] to {lat: [lat1,lat2], lng: [lng1,lng2]}
        if (streams.latlng && streams.latlng.data) {
            const latlngData = streams.latlng.data;
            streams.latlng = {
                lat: latlngData.map(point => point[0]),
                lng: latlngData.map(point => point[1]),
                original_size: latlngData.length,
                type: 'latlng'
            };
        }
        
        // Downsample streams if enabled
        if (DOWNSAMPLE_STREAMS && streams) {
            const downsampledStreams = {};
            let reduction = 0;
            let originalTotal = 0;
            
            for (const [key, value] of Object.entries(streams)) {
                const original = value.data ? value.data.length : (value.lat ? value.lat.length : 0);
                downsampledStreams[key] = downsampleStream(value, DOWNSAMPLE_FACTOR);
                const downsampled = downsampledStreams[key].data ? downsampledStreams[key].data.length : (downsampledStreams[key].lat ? downsampledStreams[key].lat.length : 0);
                
                originalTotal += original;
                reduction += (original - downsampled);
            }
            
            console.log(`  📉 Downsampled: ${originalTotal} → ${originalTotal - reduction} points (${Math.round(reduction/originalTotal*100)}% reduction)`);
            return downsampledStreams;
        }
        
        return streams;
    } catch (error) {
        console.error(`Error fetching streams for activity ${activityId}:`, error);
        return null;
    }
}

// ========================================
// DELETE ALL ACTIVITIES (Simple Version)
// ========================================
async function deleteAllActivitiesSimple() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        console.log('🗑️ Deleting all activities (simple method)...');

        // Get all activity documents
        const activitiesRef = db.collection('users').doc(user.uid).collection('activities');
        const snapshot = await activitiesRef.get();
        
        const totalCount = snapshot.size;
        console.log(`Found ${totalCount} activities to delete`);

        if (totalCount === 0) {
            return 0;
        }

        // Simple delete without subcollections
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`✅ Successfully deleted ${totalCount} activities`);
        return totalCount;
    } catch (error) {
        console.error('Error deleting activities:', error);
        throw error;
    }
}

// ========================================
// DELETE ALL ACTIVITIES (With Subcollections)
// ========================================
async function deleteAllActivities() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        console.log('🗑️ Deleting all activities and their stream data...');

        // Get all activity documents
        const activitiesRef = db.collection('users').doc(user.uid).collection('activities');
        const snapshot = await activitiesRef.get();
        
        const totalCount = snapshot.size;
        console.log(`Found ${totalCount} activities to delete`);

        if (totalCount === 0) {
            return 0;
        }

        // Delete activities and their subcollections one by one
        let deletedCount = 0;
        
        for (const doc of snapshot.docs) {
            try {
                // Delete stream data subcollection first
                const streamSnapshot = await doc.ref.collection('streamData').get();
                
                if (!streamSnapshot.empty) {
                    for (const streamDoc of streamSnapshot.docs) {
                        await streamDoc.ref.delete();
                    }
                    console.log(`  📊 Deleted stream data for activity ${doc.id}`);
                }
                
                // Delete activity document
                await doc.ref.delete();
                deletedCount++;
                
                if (deletedCount % 10 === 0 || deletedCount === totalCount) {
                    console.log(`Deleted ${deletedCount}/${totalCount} activities`);
                }
            } catch (deleteError) {
                console.error(`❌ Error deleting activity ${doc.id}:`, deleteError);
                // Continue with other activities
            }
        }

        console.log(`✅ Successfully deleted ${deletedCount}/${totalCount} activities and their stream data`);
        return deletedCount;
    } catch (error) {
        console.error('Error deleting activities:', error);
        throw error;
    }
}

// ========================================
// HELPER: Remove undefined fields from object
// ========================================
function removeUndefinedFields(obj) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = value;
        }
    }
    return cleaned;
}

// ========================================
// SYNC ACTIVITIES TO FIRESTORE (with Streams)
// ========================================
async function syncActivitiesToFirestore(activities) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        console.log(`📥 Syncing ${activities.length} activities to Firestore...`);
        
        // Sync activities one by one to fetch streams
        for (let i = 0; i < activities.length; i++) {
            const activity = activities[i];
            console.log(`📊 Syncing activity ${i + 1}/${activities.length}: ${activity.name}`);
            
            const activityData = removeUndefinedFields({
                id: activity.id,
                name: activity.name,
                type: activity.type,
                sport_type: activity.sport_type || activity.type,
                distance: activity.distance,
                moving_time: activity.moving_time,
                elapsed_time: activity.elapsed_time,
                total_elevation_gain: activity.total_elevation_gain,
                start_date: activity.start_date,
                start_date_local: activity.start_date_local,
                average_speed: activity.average_speed,
                max_speed: activity.max_speed,
                average_heartrate: activity.average_heartrate,
                max_heartrate: activity.max_heartrate,
                kudos_count: activity.kudos_count,
                achievement_count: activity.achievement_count,
                hasStreams: false, // Will be updated if streams are fetched
                syncedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Save activity document first (without streams)
            const docRef = db.collection('users').doc(user.uid)
                .collection('activities').doc(activity.id.toString());
            
            try {
                await docRef.set(activityData, { merge: true });
            } catch (firestoreError) {
                console.error(`  ❌ Failed to save activity ${activity.id} to Firestore:`, firestoreError);
                throw firestoreError; // This is critical, so we throw
            }

            // Fetch and store streams in subcollection if enabled
            if (FETCH_ACTIVITY_STREAMS) {
                try {
                    console.log(`  📈 Fetching detailed streams...`);
                    const streams = await fetchActivityStreams(activity.id);
                    if (streams) {
                        // Store streams in subcollection (avoids index limits)
                        await docRef.collection('streamData').doc('main').set(streams);
                        
                        // Update activity to indicate streams are available
                        await docRef.update({ hasStreams: true });
                        
                        console.log(`  ✅ Streams saved to subcollection: ${Object.keys(streams).join(', ')}`);
                    } else {
                        console.log(`  ⚠️ No streams available`);
                    }
                } catch (streamError) {
                    console.warn(`  ⚠️ Failed to fetch/save streams for activity ${activity.id}, continuing...`, streamError);
                    // Continue without streams - don't fail the entire sync
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        // Update last sync time
        await db.collection('users').doc(user.uid).set({
            lastSync: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Invalidate activity cache after sync (both localStorage and IndexedDB)
        const cacheKey = `activities_${user.uid}`;
        localStorage.removeItem(cacheKey);
        
        if (typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
            await cacheDB.clearActivitiesCache(user.uid);
            console.log('🗑️ Invalidated activity cache (localStorage + IndexedDB)');
        } else {
            console.log('🗑️ Invalidated activity cache (localStorage only)');
        }

        console.log(`✅ Synced ${activities.length} activities to Firestore`);
        return activities.length;
    } catch (error) {
        console.error('Error syncing activities:', error);
        throw error;
    }
}

// ========================================
// SYNC ALL ACTIVITIES (SMART INCREMENTAL SYNC)
// ========================================
async function syncAllActivities() {
    try {
        let page = 1;
        let totalSynced = 0;
        let hasMore = true;

        // TESTING MODE: Smart incremental fetch (no duplicates)
        if (TESTING_MODE) {
            console.log(`⚠️ TESTING MODE: Fetching next ${TESTING_MAX_ACTIVITIES} new activities`);
            
            // Get existing activity IDs to avoid duplicates
            const existingActivities = await getAllActivitiesFromFirestore();
            const existingIds = new Set(existingActivities.map(a => a.id));
            console.log(`📊 Found ${existingActivities.length} existing activities in database`);
            
            let newActivitiesCollected = [];
            let currentPage = 1;
            
            // Keep fetching until we have TESTING_MAX_ACTIVITIES new ones (or run out)
            while (newActivitiesCollected.length < TESTING_MAX_ACTIVITIES) {
                console.log(`🔍 Fetching page ${currentPage} from Strava...`);
                const activities = await fetchStravaActivities(50, currentPage);
                
                if (activities.length === 0) {
                    console.log('📌 No more activities available on Strava');
                    break;
                }
                
                // Filter out activities we already have
                const newActivities = activities.filter(a => !existingIds.has(a.id));
                newActivitiesCollected.push(...newActivities);
                
                console.log(`✅ Found ${newActivities.length} new activities on page ${currentPage}`);
                
                // If we have enough, take only what we need
                if (newActivitiesCollected.length >= TESTING_MAX_ACTIVITIES) {
                    newActivitiesCollected = newActivitiesCollected.slice(0, TESTING_MAX_ACTIVITIES);
                    break;
                }
                
                // If we got less than 50, we've reached the end of Strava activities
                if (activities.length < 50) {
                    console.log('📌 Reached end of Strava activities');
                    break;
                }
                
                currentPage++;
            }
            
            if (newActivitiesCollected.length > 0) {
                const synced = await syncActivitiesToFirestore(newActivitiesCollected);
                console.log(`✅ Testing sync complete: ${synced} NEW activities synced (Total in DB: ${existingActivities.length + synced})`);
                return synced;
            } else {
                console.log('✨ All activities already synced! No new activities found.');
                return 0;
            }
        }

        // PRODUCTION MODE: Smart incremental sync
        console.log('🔍 Checking for existing activities...');
        const existingActivities = await getAllActivitiesFromFirestore();
        const latestActivityDate = existingActivities.length > 0 
            ? new Date(existingActivities[0].start_date).getTime() / 1000 
            : 0;

        console.log(`📊 Found ${existingActivities.length} existing activities in database`);
        
        let newActivitiesCount = 0;
        let shouldContinue = true;

        while (hasMore && shouldContinue) {
            const activities = await fetchStravaActivities(50, page);
            
            if (activities.length === 0) {
                hasMore = false;
                break;
            }

            // Filter out activities we already have
            const newActivities = activities.filter(activity => {
                const activityDate = new Date(activity.start_date).getTime() / 1000;
                return activityDate > latestActivityDate;
            });

            if (newActivities.length > 0) {
                const synced = await syncActivitiesToFirestore(newActivities);
                totalSynced += synced;
                newActivitiesCount += newActivities.length;
                console.log(`✅ Synced ${newActivities.length} new activities from page ${page}`);
            }

            // If we found activities older than our latest, we can stop
            if (newActivities.length < activities.length) {
                console.log('📌 Reached activities we already have, stopping sync');
                shouldContinue = false;
                break;
            }
            
            // If we got less than 50, we've reached the end
            if (activities.length < 50) {
                hasMore = false;
            } else {
                page++;
            }
        }

        if (newActivitiesCount === 0 && existingActivities.length > 0) {
            console.log('✨ All activities up to date! No new activities found.');
        } else {
            console.log(`🎉 Total new activities synced: ${totalSynced}`);
        }
        
        return totalSynced;
    } catch (error) {
        console.error('Error syncing all activities:', error);
        throw error;
    }
}

// ========================================
// FULL RESYNC - Force download all activities
// ========================================
async function fullResyncActivities() {
    try {
        console.log('🔄 Starting FULL RESYNC of all activities...');
        let page = 1;
        let totalSynced = 0;
        let hasMore = true;

        while (hasMore) {
            const activities = await fetchStravaActivities(50, page);
            
            if (activities.length === 0) {
                hasMore = false;
                break;
            }

            const synced = await syncActivitiesToFirestore(activities);
            totalSynced += synced;
            console.log(`✅ Page ${page}: Synced ${synced} activities`);
            
            if (activities.length < 50) {
                hasMore = false;
            } else {
                page++;
            }
        }

        console.log(`🎉 Full resync complete: ${totalSynced} activities synced`);
        return totalSynced;
    } catch (error) {
        console.error('Error in full resync:', error);
        throw error;
    }
}

// ========================================
// GET ACTIVITIES FROM FIRESTORE
// ========================================
async function getActivitiesFromFirestore(limit = 20) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        const snapshot = await db.collection('users').doc(user.uid)
            .collection('activities')
            .orderBy('start_date', 'desc')
            .limit(limit)
            .get();

        const activities = [];
        snapshot.forEach(doc => {
            activities.push(doc.data());
        });

        return activities;
    } catch (error) {
        console.error('Error getting activities:', error);
        throw error;
    }
}

// ========================================
// GET ALL ACTIVITIES FROM FIRESTORE
// ========================================
async function getAllActivitiesFromFirestore() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        // 1. Try IndexedDB cache first (best option - unlimited storage)
        if (typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
            const cached = await cacheDB.getActivities(user.uid);
            if (cached && cached.length > 0) {
                return cached;
            }
        }

        // 2. Fallback to localStorage cache
        const cacheKey = `activities_${user.uid}`;
        const lsCached = localStorage.getItem(cacheKey);
        
        if (lsCached) {
            try {
                const parsedCache = JSON.parse(lsCached);
                const cacheAge = Date.now() - parsedCache.timestamp;
                
                if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
                    console.log('✅ Using cached activities from localStorage');
                    return parsedCache.data;
                }
            } catch (e) {
                console.warn('Failed to parse localStorage cache:', e);
                localStorage.removeItem(cacheKey);
            }
        }

        // 3. Fetch from Firestore (source of truth)
        console.log('📥 Fetching activities from Firestore...');
        
        const snapshot = await db.collection('users').doc(user.uid)
            .collection('activities')
            .get();

        const activities = [];
        snapshot.forEach(doc => {
            activities.push(doc.data());
        });

        // Sort in memory by start_date (descending)
        activities.sort((a, b) => {
            const dateA = new Date(a.start_date);
            const dateB = new Date(b.start_date);
            return dateB - dateA;
        });

        // 4. Cache the results (IndexedDB primary, localStorage backup)
        if (typeof cacheDB !== 'undefined' && cacheDB.isSupported) {
            await cacheDB.cacheActivities(user.uid, activities);
        }

        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                data: activities,
                timestamp: Date.now()
            }));
            console.log(`💾 Cached ${activities.length} activities (localStorage backup)`);
        } catch (e) {
            // Silently fail localStorage - IndexedDB is primary cache now
            console.log(`ℹ️ localStorage full (this is fine - using IndexedDB)`);
        }

        return activities;
    } catch (error) {
        console.error('Error getting all activities:', error);
        throw error;
    }
}

// ========================================
// IMPORT ALL ACTIVITIES (Bypass Testing Mode)
// ========================================
async function importAllActivities() {
    try {
        console.log('🚀 Starting FULL IMPORT of ALL activities (bypassing limits)...');
        
        // Get existing activities to avoid duplicates
        const existingActivities = await getAllActivitiesFromFirestore();
        const existingIds = new Set(existingActivities.map(a => a.id));
        console.log(`📊 Found ${existingActivities.length} existing activities in database`);
        
        let page = 1;
        let totalSynced = 0;
        let totalNew = 0;
        let hasMore = true;

        while (hasMore) {
            console.log(`🔍 Fetching page ${page} from Strava...`);
            const activities = await fetchStravaActivities(200, page); // Max per page is 200
            
            if (activities.length === 0) {
                console.log('📌 No more activities available on Strava');
                hasMore = false;
                break;
            }

            // Filter out activities we already have
            const newActivities = activities.filter(a => !existingIds.has(a.id));
            
            if (newActivities.length > 0) {
                console.log(`✅ Found ${newActivities.length} new activities on page ${page}`);
                const synced = await syncActivitiesToFirestore(newActivities);
                totalSynced += synced;
                totalNew += newActivities.length;
                
                // Add to existing IDs set
                newActivities.forEach(a => existingIds.add(a.id));
            } else {
                console.log(`⏭️ Page ${page}: All ${activities.length} activities already in database`);
            }
            
            // If we got less than 200, we've reached the end of Strava activities
            if (activities.length < 200) {
                console.log('📌 Reached end of Strava activities');
                hasMore = false;
            } else {
                page++;
            }
        }

        const finalCount = existingActivities.length + totalNew;
        console.log(`🎉 FULL IMPORT COMPLETE!`);
        console.log(`   📊 Total activities in database: ${finalCount}`);
        console.log(`   ✨ New activities imported: ${totalNew}`);
        console.log(`   📄 Pages fetched: ${page}`);
        
        return {
            total: finalCount,
            newActivities: totalNew,
            pagesChecked: page
        };
    } catch (error) {
        console.error('❌ Error importing all activities:', error);
        throw error;
    }
}

// ========================================
// DISCONNECT STRAVA
// ========================================
async function disconnectStrava() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        await db.collection('users').doc(user.uid).set({
            stravaConnected: false,
            stravaAccessToken: firebase.firestore.FieldValue.delete(),
            stravaRefreshToken: firebase.firestore.FieldValue.delete(),
            stravaExpiresAt: firebase.firestore.FieldValue.delete(),
            stravaAthleteId: firebase.firestore.FieldValue.delete(),
            lastSync: null
        }, { merge: true });

        console.log('Strava disconnected');
    } catch (error) {
        console.error('Error disconnecting Strava:', error);
        throw error;
    }
}

// ========================================
// CHECK STRAVA CONNECTION STATUS
// ========================================
async function isStravaConnected() {
    try {
        const user = auth.currentUser;
        if (!user) {
            return false;
        }

        const userData = await getUserData(user.uid);
        return userData.stravaConnected || false;
    } catch (error) {
        console.error('Error checking Strava connection:', error);
        return false;
    }
}
