# Strava Activity Tracker - Project Context

## Overview
Web application for tracking and visualizing Strava activities with Firebase backend, featuring detailed activity analysis and GPS heatmap visualization.

## Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js 4.4.0
- **Maps**: Leaflet.js 1.9.4, Leaflet.heat 0.2.0
- **Backend**: Firebase (Auth + Firestore), Strava OAuth2 API
- **Server**: Node.js HTTP server on port 3000

## Firebase Configuration
- **Project**: datable-8dc0e
- **Auth**: Email/password authentication
- **Firestore Structure**:
  - Collection: `users/{userId}/activities/{activityId}`
  - Subcollection: `activities/{activityId}/streamData/{streamType}`
  - Security rules configured for subcollection access

## Strava API
- **Client ID**: 105945
- **Redirect URI**: http://localhost:3000/callback
- **Scopes**: activity:read_all
- **Streams**: time, distance, altitude, heartrate, cadence, watts, latlng

## GPS Data Format (IMPORTANT!)
Due to Firestore nested array limitations, GPS coordinates are stored in **flattened format**:
```javascript
// NOT: [[lat1, lng1], [lat2, lng2]]  ❌
// YES: {lat: [lat1, lat2], lng: [lng3, lng4]}  ✅
```

## Key Files

### Main Application
- **dashboard.html** - Main dashboard page with activity grid and charts
- **analytics.html** - Detailed analytics with advanced visualizations
- **settings.html** - User settings and Strava account management
- **heatmap.html** - Separate full-screen heatmap page with Apple-style UI
- **hr-calculator.html** - Heart rate zone calculator tool

### JavaScript Modules
- **js/auth.js** - Authentication logic with Firebase and profile management
- **js/app.js** - Dashboard logic, activity modals with individual route maps
- **js/strava.js** - Strava API integration, GPS data flattening, OAuth flow
- **js/heatmap.js** - Heatmap rendering with performance optimizations
- **js/charts.js** - Chart.js configurations for activity visualization
- **js/analytics.js** - Advanced analytics page logic
- **js/settings.js** - Settings page functionality
- **js/hr-calculator.js** - Heart rate zone calculations
- **js/db-cache.js** - IndexedDB wrapper for caching Firestore data (367 lines)

## Major Features

### 1. Activity Dashboard
- Sync activities from Strava
- Activity grid with cards showing type, distance, duration, pace
- Detailed modals with stream data charts (pace, heart rate, elevation, cadence, power)
- Individual GPS route maps with start/end markers
- Real-time activity statistics

### 2. Heatmap Visualization
- **Activity Type Filtering**: All, Run, Bike, Walk, Hike, Other (with SVG icons)
- **View Modes**: 🔥 Heatmap (intensity) / 🗺️ All Routes (individual paths)
- **Route Intensity Toggle**: Solid mode / Heat mode (color by frequency)
- **Map Types**: 6 tile layers (Street, Terrain, Satellite, Dark Mode, Watercolor, Cycling)
- **Map Visibility Control**: 0-100% opacity slider for background map
- **Performance**: IndexedDB caching + batch GPS loading with Promise.all()
  - Initial load: ~1-3s for 100+ activities
  - Subsequent loads: Instant (cached)
  - 97% reduction in Firebase reads

### 3. IndexedDB Caching (NEW)
- **db-cache.js**: Comprehensive caching wrapper
- **Caches**: Activities, GPS data, stream data
- **Storage**: Unlimited (vs localStorage 5-10MB limit)
- **Performance**: Near-instant page loads after first visit
- **Cost Savings**: 97% fewer Firestore reads = significant cost reduction
- **Offline Support**: Works without internet after initial cache

### 4. Analytics Dashboard
- Advanced activity metrics and trends
- Comparative analysis across time periods
- Detailed stream chart visualizations
- Performance insights

### 5. User Profile & Settings
- Strava profile image integration
- Account settings management
- Logout functionality with cache clearing
- Connection status indicators

### 6. Route Rendering
- White 6px outline for visibility
- Orange-red #FF4500 4px main line (solid mode)
- Heat-based coloring by route frequency (heat mode)
- Popups with activity details
- 0.9 opacity for layering

## UI Design (Apple Style)
All controls use consistent design language:
- **Background**: `rgba(255,255,255,0.95)` with `backdrop-filter: blur(20px)`
- **Borders**: `1px solid rgba(0,0,0,0.1)`, `border-radius: 10-12px`
- **Shadows**: Multi-layer `0 4px 16px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)`
- **Text**: `#1d1d1f` primary, `#86868b` secondary
- **Typography**: `font-weight: 500-600`, `letter-spacing: -0.01em`

## Performance Optimizations

### IndexedDB Caching Strategy (PRIMARY)
1. **db-cache.js**: Universal caching wrapper for all Firestore data
2. **Three-tier approach**:
   - Try IndexedDB cache first (instant)
   - Fall back to Firestore if cache miss
   - Update cache on successful fetch
3. **Cache invalidation**: Manual via logout or user action
4. **Storage capacity**: Unlimited (browser-dependent, typically GBs)
5. **Performance impact**: 97% reduction in Firestore reads

### Heatmap-Specific Optimizations
1. **Batch GPS Loading**: `Promise.all()` for parallel data fetching
2. **Client-side Caching**: In-memory `gpsDataCache` for view switches
3. **Smart Rendering**: Only load GPS for filtered activities
4. **Progressive Loading**: Activities appear as data loads

### Optional Development Settings
1. **Data Downsampling**: DOWNSAMPLE_FACTOR for testing (disabled in production)
2. **Testing Limits**: TESTING_MAX_ACTIVITIES for development

## Known Constraints
- Running on work PC with PowerShell restrictions (no npm)
- Using Node.js server directly on port 3000
- Firestore does not support nested arrays (hence flattened GPS format)

## Recent Development

### Latest Updates (November 2025)
- ✅ **IndexedDB Caching System**: Comprehensive caching layer (367 lines, db-cache.js)
- ✅ **Activity Type Filter Redesign**: SVG icons, glassmorphism design, moved to header
- ✅ **Route Intensity Toggle**: Switch between solid and heat-based coloring
- ✅ **Profile Integration**: Strava athlete profile images in navigation
- ✅ **Settings Page**: Dedicated settings with logout functionality
- ✅ **Mobile Responsive**: Optimized control positioning for small screens
- ✅ **Performance**: 97% reduction in Firebase reads, near-instant page loads

### Previous Milestones
- ✅ Complete UI redesign to Apple-style (unified, solid, readable)
- ✅ Fixed view toggle white-on-white contrast issue
- ✅ All controls use glassmorphism and consistent styling
- ✅ 10-50x performance improvement with parallel loading

## Documentation Structure
All documentation has been organized into `/docs/` directory:

### Core Documentation
- **README.md** - Main project documentation
- **PROJECT_CONTEXT.md** - This file (technical reference)
- **docs/INDEX.md** - Comprehensive documentation index

### Feature Documentation (`/docs/features/`)
- `heatmap.md` - Activity heatmap visualization
- `view-toggle.md` - Heatmap vs all routes view
- `map-opacity.md` - Background map visibility control
- `route-map.md` - Individual activity GPS maps
- `stream-charts.md` - Detailed activity analytics

### Guides (`/docs/guides/`)
- `quick-start-stream-charts.md` - Enable activity charts
- `map-types.md` - Map layer configuration
- `downsampling.md` - GPS data optimization
- `heatmap-performance.md` - Performance tuning

### Troubleshooting (`/docs/troubleshooting/`)
- `sync-issues.md` - Fix Strava sync problems
- `index-error-fix.md` - Firestore index errors
- `streams-fixed.md` - Activity stream data issues
- `subcollection-solution.md` - Nested data structure
- `optimization-solution.md` - Comprehensive caching guide

## Quick Start Context for Copilot
"I'm working on a Strava activity tracker with Firebase backend. The main app (dashboard.html) shows activities with Chart.js visualizations. There's a separate heatmap feature (heatmap.html) that uses Leaflet.js with performance optimization via parallel loading and caching. GPS data is stored in flattened format {lat: [...], lng: [...]} due to Firestore limitations. All UI follows Apple-style design with glassmorphism effects."
