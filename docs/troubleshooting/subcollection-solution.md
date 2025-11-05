# 🔄 Alternative Solution: Store Streams in Subcollection

This approach stores large stream data in a separate subcollection to avoid Firestore index limits.

## Data Structure

**Before (causes index error):**
```
users/{userId}/activities/{activityId}
  ├─ id: 12345
  ├─ name: "Morning Run"
  ├─ distance: 10000
  └─ streams: { heartrate: { data: [120,125,130,...] }, ... }  ← TOO BIG!
```

**After (no index error):**
```
users/{userId}/activities/{activityId}
  ├─ id: 12345
  ├─ name: "Morning Run"
  ├─ distance: 10000
  └─ hasStreams: true

users/{userId}/activities/{activityId}/streamData/main
  ├─ heartrate: { data: [...], original_size: 1234 }
  ├─ velocity_smooth: { data: [...], original_size: 1234 }
  └─ altitude: { data: [...], original_size: 1234 }
```

## Implementation

### 1. Update Firestore Rules

Edit `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      match /activities/{activityId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if request.auth != null && request.auth.uid == userId;
        
        // NEW: Subcollection for stream data
        match /streamData/{streamDoc} {
          allow read: if request.auth != null && request.auth.uid == userId;
          allow write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

### 2. Update Sync Function

Edit `js/strava.js` - modify `syncActivitiesToFirestore()`:

```javascript
// Around line 280-330
async function syncActivitiesToFirestore(activities) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        console.log(`📥 Syncing ${activities.length} activities to Firestore...`);
        
        for (let i = 0; i < activities.length; i++) {
            const activity = activities[i];
            console.log(`📊 Syncing activity ${i + 1}/${activities.length}: ${activity.name}`);
            
            const activityData = {
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
            };

            // Save activity document (without streams)
            const docRef = db.collection('users').doc(user.uid)
                .collection('activities').doc(activity.id.toString());
            
            await docRef.set(activityData, { merge: true });

            // Fetch and store streams in subcollection if enabled
            if (FETCH_ACTIVITY_STREAMS) {
                try {
                    console.log(`  📈 Fetching detailed streams...`);
                    const streams = await fetchActivityStreams(activity.id);
                    if (streams) {
                        // Store streams in subcollection
                        await docRef.collection('streamData').doc('main').set(streams);
                        
                        // Update activity to indicate streams are available
                        await docRef.update({ hasStreams: true });
                        
                        console.log(`  ✅ Streams saved: ${Object.keys(streams).join(', ')}`);
                    } else {
                        console.log(`  ⚠️ No streams available`);
                    }
                } catch (streamError) {
                    console.warn(`  ⚠️ Failed to fetch streams, continuing...`, streamError);
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        // Update last sync time
        await db.collection('users').doc(user.uid).set({
            lastSync: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Synced ${activities.length} activities to Firestore`);
        return activities.length;
    } catch (error) {
        console.error('Error syncing activities:', error);
        throw error;
    }
}
```

### 3. Update Chart Loading Function

Edit `js/app.js` - modify `loadStreamCharts()`:

```javascript
// Around line 220
async function loadStreamCharts(activity) {
    // Destroy previous stream charts
    streamCharts.forEach(chart => chart.destroy());
    streamCharts = [];

    const streamSection = document.getElementById('modal-stream-section');
    const streamContainer = document.getElementById('modal-stream-charts');
    streamContainer.innerHTML = '';

    // Check if activity has streams
    if (!activity.hasStreams) {
        streamSection.classList.add('hidden');
        return;
    }

    // Load streams from subcollection
    try {
        const user = auth.currentUser;
        const streamDoc = await db.collection('users').doc(user.uid)
            .collection('activities').doc(activity.id.toString())
            .collection('streamData').doc('main')
            .get();

        if (!streamDoc.exists) {
            streamSection.classList.add('hidden');
            return;
        }

        const streams = streamDoc.data();
        streamSection.classList.remove('hidden');

        // Create charts based on available stream data
        const chartsToCreate = [];

        if (streams.heartrate) {
            chartsToCreate.push(createHRZonesChart(streams.heartrate, streams.time));
        }

        if (streams.velocity_smooth && streams.time) {
            chartsToCreate.push(createPaceProgressionChart(streams.velocity_smooth, streams.time));
        }

        if (streams.altitude && streams.distance) {
            chartsToCreate.push(createElevationProfileChart(streams.altitude, streams.distance));
        }

        if (streams.cadence && streams.time) {
            chartsToCreate.push(createCadenceChart(streams.cadence, streams.time));
        }

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
```

### 4. Update Delete Function

Edit `js/strava.js` - modify `deleteAllActivities()`:

```javascript
async function deleteAllActivities() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        console.log('🗑️ Deleting all activities...');

        const activitiesRef = db.collection('users').doc(user.uid).collection('activities');
        const snapshot = await activitiesRef.get();
        
        const totalCount = snapshot.size;
        console.log(`Found ${totalCount} activities to delete`);

        if (totalCount === 0) {
            return 0;
        }

        // Delete activities and their subcollections
        for (const doc of snapshot.docs) {
            // Delete stream data subcollection first
            const streamSnapshot = await doc.ref.collection('streamData').get();
            for (const streamDoc of streamSnapshot.docs) {
                await streamDoc.ref.delete();
            }
            
            // Delete activity document
            await doc.ref.delete();
        }

        console.log(`✅ Successfully deleted ${totalCount} activities`);
        return totalCount;
    } catch (error) {
        console.error('Error deleting activities:', error);
        throw error;
    }
}
```

## Benefits

✅ **No Index Errors** - Stream data not indexed by Firestore
✅ **Better Performance** - Activity list loads faster (doesn't need to load huge stream data)
✅ **Scalable** - Can handle unlimited stream data size
✅ **Cleaner Structure** - Separation of concerns
✅ **Same Features** - Charts still work the same way

## Drawbacks

⚠️ **Extra Read** - Loading activity modal requires 2 reads instead of 1
⚠️ **More Complex** - Slightly more code to manage
⚠️ **Migration** - Existing data needs to be restructured

## Migration Steps

1. Implement the code changes above
2. Set `FETCH_ACTIVITY_STREAMS = true`
3. Delete all existing activities
4. Re-sync activities
5. Streams will be stored in subcollections
6. Charts will work without index errors!

## Testing

After implementation:
1. Enable streams: `FETCH_ACTIVITY_STREAMS = true`
2. Delete activities in Settings
3. Sync 10 test activities
4. Open activity modal
5. Check for stream charts
6. Should work without errors! 🎉
