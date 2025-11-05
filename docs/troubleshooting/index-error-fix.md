# 🔴 URGENT FIX: Firestore Index Error

## The Problem

Error: `too many index entries for entity /users/.../activities/...`

**Cause:** The `streams` field contains large arrays of data. Firestore automatically indexes all fields, and the streams data has too many entries for Firestore's index limits.

## 🚀 Quick Fix (Immediate Solution)

**Temporarily disable stream fetching until we fix the indexing:**

1. **Edit `js/strava.js` line 22:**
   ```javascript
   const FETCH_ACTIVITY_STREAMS = false;  // Change from true to false
   ```

2. **Reload the page** (Ctrl + F5)

3. **Try syncing again** - it should work now!

This will:
- ✅ Fix the sync error immediately
- ✅ Sync activities successfully
- ❌ But won't have detailed time-series charts (yet)

---

## 🔧 Permanent Fix (Requires Firebase Console Access)

You need to tell Firestore NOT to index the `streams` field.

### Option 1: Via Firebase Console (Manual)

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select your project: **datable-8dc0e**
3. Click **Firestore Database** in left menu
4. Click **Indexes** tab at top
5. Click **Single field** tab
6. Click **Add exemption**
7. Fill in:
   - **Collection group:** `activities`
   - **Field path:** `streams`
   - **Query scope:** Select **Exemption**
8. Click **Create**
9. Wait a few minutes for the change to take effect

### Option 2: Delete and Re-create Activities Collection

If Option 1 doesn't work:

1. **Open Firebase Console → Firestore**
2. Navigate to: `users → [your_user_id] → activities`
3. Delete all activity documents (or delete the entire activities collection)
4. Go back to your app
5. With streams DISABLED (`FETCH_ACTIVITY_STREAMS = false`)
6. Sync activities again
7. Should work now!

### Option 3: Firebase CLI (If you can use it)

If you can get Firebase CLI working:

```powershell
firebase deploy --only firestore:indexes
```

This will deploy the updated `firestore.indexes.json` file I just created.

---

## 📊 Alternative Solution: Store Streams Separately

If you want to keep detailed charts, we can restructure the data:

**Instead of:**
```
users/{userId}/activities/{activityId}
  - id: 12345
  - name: "Morning Run"
  - streams: { huge_data_here }  ← TOO BIG!
```

**Use:**
```
users/{userId}/activities/{activityId}
  - id: 12345
  - name: "Morning Run"
  - hasStreams: true

users/{userId}/activities/{activityId}/streams/data
  - heartrate: [...]
  - velocity: [...]
```

This requires code changes. Let me know if you want me to implement this!

---

## 🎯 Recommended Steps

**For now (to get sync working):**

1. ✅ Set `FETCH_ACTIVITY_STREAMS = false` in `js/strava.js`
2. ✅ Reload page
3. ✅ Delete existing activities in Settings
4. ✅ Sync activities (should work now!)

**Later (to add charts back):**

Choose one:
- **A)** Add index exemption via Firebase Console (easiest)
- **B)** Restructure data to store streams separately (best long-term solution)
- **C)** Store only summary statistics instead of full streams (compromise)

---

## 💡 Why This Happened

Firestore has limits:
- **Max index entries per document:** ~20,000
- **Stream data:** Each activity has ~1,000+ data points × 5-7 stream types = 5,000-7,000 entries
- **Result:** Exceeds index limits

Firestore tries to index everything by default, which is good for queries but bad for large arrays.

---

## ✅ Immediate Action

**Run this now:**

1. Open `js/strava.js`
2. Find line 22: `const FETCH_ACTIVITY_STREAMS = true;`
3. Change to: `const FETCH_ACTIVITY_STREAMS = false;`
4. Save file
5. Reload browser (Ctrl + F5)
6. Try syncing again

**Your sync should work!** 🎉

Then we can decide on the permanent solution for detailed charts.
