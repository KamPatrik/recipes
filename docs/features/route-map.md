# Route Map Feature 🗺️

## Overview
Activities now display an interactive route map showing the GPS track with start and end markers.

## What Was Added

### 1. Leaflet.js Integration
- Added Leaflet CSS and JS library for interactive maps
- Uses OpenStreetMap tiles (free, no API key needed)

### 2. GPS Data Collection
- Updated `STREAM_TYPES` to include `'latlng'` (GPS coordinates)
- GPS data stored in same subcollection as other streams
- Downsampled along with other data (90% reduction)

### 3. Route Visualization
- **Route Line**: Orange line (#FC4C02 - Strava color) showing your path
- **Start Marker**: Green circle at beginning of activity
- **Finish Marker**: Red circle at end of activity
- **Auto-zoom**: Map automatically fits to show entire route
- **Interactive**: Pan, zoom, click markers for labels

### 4. Smart Display
- Map only shows for activities with GPS data
- Hidden for manual entries or indoor activities
- Positioned between stats and detailed charts

## How to Test

1. **Delete existing activities** (they don't have GPS data yet):
   - Open Settings modal
   - Click "Delete All Activities"

2. **Re-sync activities** with GPS data:
   - Click "Sync Activities" button
   - Wait for sync to complete

3. **View route maps**:
   - Click any outdoor activity (Run, Ride, etc.)
   - Scroll down below the stats grid
   - See "🗺️ Route Map" section

## Technical Details

### Files Modified
- `dashboard.html` - Added Leaflet CDN, map container
- `css/styles.css` - Added route map styling (400px height)
- `js/strava.js` - Added 'latlng' to STREAM_TYPES
- `js/app.js` - Added createRouteMap() function, integrated into modal

### Data Structure
```
activities/{activityId}/streamData/main
{
  latlng: {
    data: [[lat1, lng1], [lat2, lng2], ...],
    original_size: 5000,
    resolution: 10
  }
}
```

### Map Features
- **Library**: Leaflet.js 1.9.4
- **Tiles**: OpenStreetMap (free)
- **Route color**: #FC4C02 (Strava orange)
- **Line weight**: 4px
- **Start marker**: Green (#22c55e)
- **End marker**: Red (#ef4444)

## Foundation for Heatmap

This implementation provides the perfect foundation for creating a heatmap:

1. **All GPS data is now collected** and stored
2. **Downsampled for performance** (90% smaller)
3. **Easy to aggregate** - just query all activities and combine latlng arrays
4. **Same map library** - Leaflet supports heatmap layers via plugins

### Future Heatmap Implementation
To create a heatmap showing all your routes combined:
1. Add Leaflet.heat plugin
2. Query all activities and collect latlng data
3. Combine all GPS points into single array
4. Render with heat layer showing intensity

## Notes

- Indoor activities (treadmill, trainer) won't have GPS data
- Manual activities won't have GPS data
- GPS data uses same downsampling as other streams (every 10th point)
- Map height is fixed at 400px for consistent display
- Each activity shows its own map (not overlapping)

## API Usage Impact

- **Minimal**: latlng is just one more stream type
- Same API call that fetches HR, speed, altitude
- Downsampling keeps storage efficient
- No additional API requests needed
