# 🔍 Troubleshooting: "Failed to sync activities" Error

## Quick Diagnosis Steps

### Step 1: Check Browser Console
1. Press **F12** to open Developer Tools
2. Click the **Console** tab
3. Click the sync button again
4. Look for red error messages

### Step 2: Common Issues & Solutions

#### Issue: "Strava not connected"
**Solution:**
1. Open Settings (⚙️)
2. Click "Connect Strava Account"
3. Authorize the app
4. Try syncing again

#### Issue: "No user logged in"
**Solution:**
1. Log out and log back in
2. Try syncing again

#### Issue: "Failed to refresh token" or "token expired"
**Solution:**
1. Open Settings (⚙️)
2. Click "Disconnect Strava"
3. Click "Connect Strava Account" again
4. Re-authorize
5. Try syncing again

#### Issue: "Rate limit exceeded" or "429 error"
**Cause:** Strava allows:
- 100 API requests per 15 minutes
- 1000 API requests per day

**Solution:**
1. Wait 15 minutes
2. Try syncing again
3. Consider disabling stream fetching temporarily:
   - Edit `js/strava.js`
   - Change `const FETCH_ACTIVITY_STREAMS = false;`
   - This reduces API calls from ~11 to 1 for 10 activities

#### Issue: CORS error or "blocked by CORS policy"
**Symptoms:** Console shows messages about CORS, cross-origin, or blocked requests

**Solution:**
- This shouldn't happen with Strava API
- Check if you're using the correct URLs
- Verify `STRAVA_API_BASE` is `https://www.strava.com/api/v3`

#### Issue: Network error or timeout
**Symptoms:** "Failed to fetch" or "Network request failed"

**Solution:**
1. Check your internet connection
2. Check if Strava.com is accessible
3. Try syncing fewer activities (edit TESTING_MAX_ACTIVITIES)

#### Issue: Firestore permission denied
**Symptoms:** "permission-denied" in console

**Solution:**
1. Check Firestore security rules in Firebase Console
2. Rules should allow authenticated users to access their own data:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /activities/{activityId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Step 3: Test Without Streams

If sync keeps failing, temporarily disable stream fetching:

**Edit `js/strava.js`:**
```javascript
// Line ~18
const FETCH_ACTIVITY_STREAMS = false;  // Change true to false
```

This will:
- Reduce API calls significantly
- Speed up sync
- Help identify if streams are causing the issue

**After fixing, change it back to `true` to get detailed charts.**

### Step 4: Check Specific Error Messages

Look in the console for these patterns:

**Pattern: "Error syncing activities: Error: [message]"**
- The [message] tells you exactly what went wrong

**Pattern: "Failed to save activity X to Firestore"**
- Firestore connection or permission issue
- Check Firebase Console → Firestore Database

**Pattern: "Failed to fetch streams for activity X"**
- This is OK! Some activities don't have streams
- Sync should continue anyway

**Pattern: "No streams available for activity X"**
- This is normal and expected
- Not all activities have detailed data

### Step 5: Verify Configuration

**Check `js/strava.js` has correct values:**
```javascript
const STRAVA_CLIENT_ID = '105945';
const STRAVA_CLIENT_SECRET = 'your_secret_here';
const STRAVA_REDIRECT_URI = 'http://localhost:3000/strava-callback.html';
```

**Check `js/auth.js` has your Firebase config:**
```javascript
const firebaseConfig = {
    apiKey: "your_key",
    authDomain: "datable-8dc0e.firebaseapp.com",
    projectId: "datable-8dc0e",
    // ...
};
```

### Step 6: Check Strava API Application

1. Go to https://www.strava.com/settings/api
2. Verify your application settings:
   - **Authorization Callback Domain:** `localhost`
   - **Authorization Callback URL:** `http://localhost:3000/strava-callback.html`
3. Check if you've hit rate limits on the API dashboard

### Step 7: Enable Detailed Logging

The app now has enhanced logging. When you sync, you should see:

**Starting:**
```
🔄 Starting activity sync...
⚠️ TESTING MODE: Fetching next 10 new activities
📊 Found X existing activities in database
```

**During sync:**
```
📥 Syncing 10 activities to Firestore...
📊 Syncing activity 1/10: Morning Run
  📈 Fetching detailed streams...
  ✅ Streams fetched: heartrate, distance, altitude, time, velocity_smooth
```

**Completion:**
```
✅ Synced 10 activities to Firestore
✅ Sync completed: 10 activities
```

**If you don't see these logs, there's an issue before the sync even starts.**

### Step 8: Test Basic Connectivity

Open browser console and run:
```javascript
// Test Strava API connectivity
fetch('https://www.strava.com/api/v3/athlete', {
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN_HERE'
  }
})
.then(r => r.json())
.then(d => console.log('✅ Strava API works:', d))
.catch(e => console.error('❌ Strava API failed:', e));
```

Replace `YOUR_ACCESS_TOKEN_HERE` with your actual token (check Firestore → users → your user ID → stravaAccessToken)

### Step 9: Clear Cache & Retry

Sometimes browser cache causes issues:
1. Press **Ctrl + Shift + Delete**
2. Clear "Cached images and files"
3. Reload page (**Ctrl + F5**)
4. Try syncing again

### Step 10: Start Fresh

If nothing works:
1. Open Settings
2. Click "Disconnect Strava"
3. Log out of the app
4. Close browser completely
5. Open browser again
6. Go to http://localhost:3000
7. Log in
8. Open Settings
9. Connect Strava
10. Try syncing

---

## 💡 Quick Fixes Summary

| Symptom | Quick Fix |
|---------|-----------|
| Fails immediately | Check Strava connection status in Settings |
| "Token" error | Disconnect & reconnect Strava |
| Takes long then fails | Reduce TESTING_MAX_ACTIVITIES to 5 |
| Rate limit error | Wait 15 minutes, or disable streams |
| Works sometimes | Strava API rate limits - wait between syncs |
| Permission denied | Check Firestore security rules |
| CORS error | Check STRAVA_REDIRECT_URI and allowed domains |

---

## 🆘 Getting More Help

If you're still stuck, share these details:

1. **Full error message from console** (copy the entire red error)
2. **What you see in the console when syncing** (the log messages)
3. **Whether Strava is connected** (Settings → Strava Connection status)
4. **How many activities you already have synced**
5. **Whether you enabled stream fetching** (FETCH_ACTIVITY_STREAMS value)

Most issues are:
- ✅ Strava not connected → Reconnect
- ✅ Token expired → Disconnect & reconnect
- ✅ Rate limits → Wait or disable streams
- ✅ Firestore rules → Check permissions

The enhanced error messages should now tell you exactly what's wrong! 🎯
