# Activity Heatmap Feature 🔥

## Overview
The Activity Heatmap shows all your routes with two powerful visualization modes: a heat-intensity overlay showing frequency patterns, or individual colored routes displayed together. This helps you see your most common routes, training grounds, and explore patterns in your activities.

## Features

### � Two Visualization Modes
- **Heatmap View**: Color gradient overlay showing route frequency
  - Red = most frequent areas
  - Blue = less traveled areas
  - Blurred smooth visualization
- **All Routes View**: Individual routes shown as colored lines
  - Each route has a unique color
  - Click any route to see activity details
  - Perfect for seeing route variety

### 🗺️ Full-Screen Interactive Map
- **Pan & Zoom**: Navigate anywhere in the world
- **Auto-zoom**: Map automatically fits to show all your routes
- **Smooth Rendering**: Optimized for thousands of GPS points

### 🏃 Sport Type Filtering
Choose which activities to include:
- **All Activities**: Combined view of everything
- **🏃 Running**: Running and jogging activities only
- **🚴 Cycling**: Road cycling, mountain biking, etc.
- **🚶 Walking**: Walking activities
- **⛰️ Hiking**: Hiking and trekking

### 📊 Real-Time Stats
- **Activities Count**: Number of activities shown
- **GPS Points**: Total number of location points rendered

## How to Use

1. **Access the Heatmap**
   - Click "🔥 Heatmap" button in dashboard navbar
   - Or navigate to `heatmap.html` directly

2. **Choose Your View**
   - **🔥 Heatmap**: See heat intensity overlay (default)
   - **🗺️ All Routes**: See individual colored routes
   - Toggle between views anytime

3. **View Your Routes**
   - Wait for all activities to load (may take a few seconds)
   - Map will automatically center and zoom to show all data

4. **Filter by Sport**
   - Click any sport filter button at the top
   - Map updates to show only that sport type
   - Stats update to reflect current filter
   - Works in both heatmap and routes view

5. **Explore**
   - Zoom in to see specific routes
   - Zoom out to see overall patterns
   - Pan around to explore different areas
   - **In Routes View**: Click any line to see activity details

6. **Return to Dashboard**
   - Click the ← back button
   - Or click the Strava logo

## Understanding the Colors

The heatmap uses a gradient to show route frequency:
- 🔵 **Blue**: Areas you've been to once or twice
- 🟢 **Green/Yellow**: Moderately frequent routes
- 🔴 **Red**: Your most common routes

The brighter and redder an area, the more times you've been there!

## Technical Details

### Data Source
- Loads GPS data from Firestore subcollections
- Same data used for individual route maps
- Downsampled for performance (every 10th point)

### Performance
- Optimized for thousands of GPS points
- Efficient rendering with Leaflet.heat plugin
- Lazy loading per activity (loads as needed)

### Heatmap Configuration
```javascript
{
  radius: 15,        // Point spread radius
  blur: 20,          // Blur intensity
  maxZoom: 17,       // Max zoom level
  gradient: {
    0.0: 'blue',     // Lowest intensity
    0.3: 'cyan',
    0.5: 'lime',
    0.7: 'yellow',
    1.0: 'red'       // Highest intensity
  }
}
```

## Requirements

### Activities Must Have:
1. ✅ GPS data (outdoor activities only)
2. ✅ Stream data fetched during sync
3. ✅ `hasStreams: true` flag

### Won't Show:
- ❌ Indoor activities (treadmill, trainer)
- ❌ Manual entries
- ❌ Activities synced before GPS feature was enabled

## Tips

### Get the Best Heatmap
1. **Sync Recent Activities**: Make sure you've synced after enabling GPS
2. **Include More Sports**: Don't filter too much initially
3. **Zoom In**: Details appear at higher zoom levels
4. **Compare Sports**: Switch between running/cycling to see different patterns

### Common Patterns to Look For
- **Training loops**: Red hotspots where you train often
- **Commute routes**: Red lines for daily routes
- **Exploration**: Blue scattered points for new areas
- **Vacation trips**: Clusters in different regions

### Performance Tips
- More activities = longer initial load time
- Filter by sport to improve rendering speed
- Close other browser tabs if slow
- Zoom in for better detail, zoom out for overview

## Files

### New Files Created
- `heatmap.html` - Heatmap page with filters and map
- `js/heatmap.js` - Heatmap logic and rendering

### Libraries Used
- **Leaflet.js 1.9.4** - Interactive map rendering
- **Leaflet.heat 0.2.0** - Heatmap layer plugin
- **OpenStreetMap** - Free map tiles

### Modified Files
- `dashboard.html` - Added "🔥 Heatmap" button in navbar

## Troubleshooting

### No data showing on heatmap
**Solution**: 
1. Go back to dashboard
2. Open Settings → Delete all activities
3. Sync activities again (GPS will be fetched)
4. Return to heatmap

### Heatmap is blank
**Possible causes**:
- No outdoor activities (all indoor/manual)
- Activities don't have GPS data
- Selected sport type has no activities
**Solution**: Try "All Activities" filter first

### Very slow loading
**Possible causes**:
- Many activities with GPS (thousands of points)
- Slow internet connection
**Solution**: Be patient, or filter by specific sport

### Map not centered correctly
**Solution**: Refresh the page - map will auto-zoom to data

## Privacy Note
All GPS data is stored in your private Firestore database. The heatmap only shows your data and is only visible when you're logged in. No data is shared publicly.

## Future Enhancements
Possible improvements:
- Export heatmap as image
- Share public heatmap link
- Time-based filtering (this year, this month)
- Intensity based on activity metrics (speed, HR)
- Compare athletes (if multiple users)
- 3D elevation heatmap
