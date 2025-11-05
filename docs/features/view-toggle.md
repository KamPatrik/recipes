# View Toggle Feature - Heatmap vs All Routes 🔥🗺️

## What's New
Added a toggle button to switch between two visualization modes on the heatmap page.

## Two Views

### 🔥 Heatmap View (Default)
- **What it shows**: Heat intensity overlay
- **Colors**: Blue → Cyan → Green → Yellow → Red
- **Best for**: Seeing route frequency patterns
- **Use case**: "Where do I run most often?"

**Visual**: Smooth blurred overlay with intensity colors

### 🗺️ All Routes View
- **What it shows**: Individual routes as colored lines
- **Colors**: Each route gets a unique color (6 colors cycle)
- **Best for**: Seeing route variety and specific paths
- **Use case**: "What are all my different routes?"
- **Interactive**: Click any route to see activity details (name, type, distance)

**Visual**: Sharp colored lines showing exact GPS tracks

## How to Use

1. **Access heatmap page** (click "🔥 Heatmap" in dashboard)
2. **Click toggle button** at the top:
   - `🔥 Heatmap` - Shows heat overlay
   - `🗺️ All Routes` - Shows individual routes
3. **Combine with sport filters**:
   - Filter by Running → Switch to Routes view
   - See all your running routes clearly!

## Technical Implementation

### Updated Files
- `heatmap.html` - Added view toggle buttons with styling
- `js/heatmap.js` - Added routes rendering logic

### Key Changes

**Variables**:
```javascript
let routeLayers = [];      // Store route polylines
let currentView = 'heatmap'; // Track current view
```

**New Function**:
```javascript
setupViewToggle()  // Handles toggle button clicks
```

**Updated Function**:
```javascript
renderMap(sportType, viewType)  // Now handles both views
```

### Route Colors
Uses 6 rotating colors:
- Orange (#FC4C02) - Primary
- Blue (#0066CC)
- Green (#00CC66)
- Purple (#CC00CC)
- Yellow (#FFCC00)
- Dark Orange (#FF6600)

### Route Popups
Each route shows:
- Activity name
- Sport type
- Distance in km

## Comparison

| Feature | Heatmap View | Routes View |
|---------|--------------|-------------|
| **Visual** | Blurred overlay | Sharp lines |
| **Info** | Frequency | Individual routes |
| **Interactive** | No | Yes (popups) |
| **Performance** | Fast | Slightly slower |
| **Best for** | Patterns | Details |

## Use Cases

### Use Heatmap View When:
- ✅ Finding your most common training areas
- ✅ Seeing overall activity patterns
- ✅ Identifying hotspots
- ✅ Comparing frequency across areas

### Use Routes View When:
- ✅ Exploring route variety
- ✅ Seeing exact paths taken
- ✅ Comparing different routes
- ✅ Finding specific activities
- ✅ Seeing route start/end points clearly

## Performance Notes

- **Heatmap**: Single layer, very fast
- **Routes**: Multiple polylines, may be slower with 100+ activities
- **Optimization**: Uses same downsampled GPS data (10x reduction)

## Tips

1. **Start with Heatmap** to see overall patterns
2. **Switch to Routes** to explore details
3. **Filter first** if you have many activities
4. **Zoom in** on Routes view to see overlapping paths
5. **Click routes** to identify specific activities

## Future Enhancements
- Custom route colors by activity type
- Opacity slider for routes
- Route clustering for better performance
- Route comparison (highlight selected routes)
- Export routes as GPX files
