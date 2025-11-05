## 🎯 Quick Start Guide - Stream Charts Feature

### What You'll See

When you open an activity that has stream data, the modal will now show:

```
┌─────────────────────────────────────────────────────┐
│  Morning Run                                    X   │
│  Run • Sunday, October 31, 2025, 07:30 AM          │
├─────────────────────────────────────────────────────┤
│  📏 10.5 km    ⏱️ 52:30    ⚡ 5:00 min/km           │
│  🏔️ 150 m     ❤️ 145 bpm  💓 178 bpm               │
│  🚀 12.0 km/h  ⚡ 18.5 km/h 👍 5  🏆 2              │
├─────────────────────────────────────────────────────┤
│  📊 Detailed Activity Analysis                      │
│                                                     │
│  ❤️ Heart Rate Over Time                           │
│  [Interactive line chart showing HR throughout]    │
│                                                     │
│  ⚡ Speed Over Time                                 │
│  [Interactive line chart showing pace changes]     │
│                                                     │
│  🏔️ Elevation Profile                              │
│  [Interactive line chart showing terrain]          │
│                                                     │
│  🦵 Cadence Pattern (if available)                  │
│  [Interactive line chart showing cadence]          │
│                                                     │
│  ⚡ Power Output (if available)                     │
│  [Interactive line chart showing watts]            │
├─────────────────────────────────────────────────────┤
│  📈 Your Progress with This Activity Type          │
│  [6 comparison charts with other activities]       │
└─────────────────────────────────────────────────────┘
```

### 3-Step Setup

1. **Delete & Re-Sync Activities**
   - Open Settings ⚙️
   - Click "Delete All Activities"
   - Click "Sync Activities Now"
   - Wait for completion (~1-2 minutes for 10 activities)

2. **Open Any Activity**
   - Click on an activity card
   - Scroll down past the stats grid
   - See "Detailed Activity Analysis" section

3. **Explore the Charts**
   - Hover over charts to see exact values
   - Watch your HR, pace, and elevation during the activity
   - Understand your performance patterns

### Expected Sync Output

When syncing with stream data enabled, you'll see:
```
📥 Syncing 10 activities to Firestore...
📊 Syncing activity 1/10: Morning Run
  📈 Fetching detailed streams...
  ✅ Streams fetched: heartrate, distance, altitude, time, velocity_smooth
📊 Syncing activity 2/10: Evening Ride
  📈 Fetching detailed streams...
  ✅ Streams fetched: heartrate, distance, altitude, time, velocity_smooth, cadence, watts
...
✅ Synced 10 activities to Firestore
```

### What Each Chart Shows

| Chart | X-Axis | Y-Axis | Useful For |
|-------|--------|--------|------------|
| ❤️ Heart Rate | Time (min) | BPM | See intensity, warm-up/cool-down, HR zones |
| ⚡ Speed | Time (min) | km/h | Identify pace changes, consistency |
| 🏔️ Elevation | Distance (km) | Meters | Visualize climbs/descents, terrain difficulty |
| 🦵 Cadence | Time (min) | RPM | Monitor running/cycling rhythm |
| ⚡ Power | Time (min) | Watts | Analyze cycling power output |

### Color Coding

- **Heart Rate:** Red/Orange (#fc4c02) - Strava brand color
- **Speed:** Green (#4CAF50) - Go faster!
- **Elevation:** Purple (#9C27B0) - Mountain majesty
- **Cadence:** Orange (#FF9800) - Rhythm and motion
- **Power:** Red (#F44336) - Raw power

### Pro Tips

✨ **Smooth Data:** Charts use Strava's "velocity_smooth" which filters out GPS noise
✨ **Time Format:** All time-based charts show minutes for easy reading
✨ **Auto-Scaling:** Y-axis automatically adjusts to your data range
✨ **No Clutter:** Point markers hidden for cleaner visualization
✨ **Filled Area:** Charts filled with transparent color for better visualization

### API Usage

Each sync with stream data:
- **Old Method:** 1 API call per page of activities (30 activities = 1 call)
- **New Method:** 1 call per page + 1 call per activity for streams
- **Example:** 10 activities = 1 + 10 = **11 total API calls**
- **Strava Limits:** 100 calls per 15 min, 1000 per day
- **Result:** You can sync ~90 activities before hitting 15-min limit

### Browser Console Tips

Want to see what's happening? Open Developer Tools (F12) and check:
```javascript
// See what streams were fetched
console.log(activity.streams);

// Check available stream types
Object.keys(activity.streams);
// → ['heartrate', 'distance', 'altitude', 'time', 'velocity_smooth']

// View HR data
activity.streams.heartrate.data;
// → [120, 125, 130, 135, 140, ...]
```

---

**Ready to see your activities in a whole new way! 🚀**

Server is running at: http://localhost:3000
