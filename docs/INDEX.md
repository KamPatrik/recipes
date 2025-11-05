# 📚 Documentation Index

Welcome to the Strava Activity Tracker documentation! This index will help you find what you need quickly.

## 📖 Getting Started
- **[Main README](../README.md)** - Project overview, setup instructions, and quick start guide
- **[Project Context](../PROJECT_CONTEXT.md)** - Technical architecture and project structure

## ✨ Features

### Core Features
- **[Activity Heatmap](features/heatmap.md)** - Visualize all your routes on a single map with heat intensity
- **[View Toggle](features/view-toggle.md)** - Switch between heatmap and individual routes view
- **[Map Opacity Control](features/map-opacity.md)** - Adjust background map visibility to focus on routes
- **[Route Map](features/route-map.md)** - View individual activity routes with details
- **[Stream Charts](features/stream-charts.md)** - Detailed activity analytics (pace, heart rate, elevation, etc.)
- **[Performance Management Chart](features/performance-management-chart.md)** - Track fitness, fatigue, and form with the Fitness-Fatigue model

### Key Capabilities
- 🔐 **Authentication** - Firebase email/password authentication
- 🔄 **Strava Integration** - OAuth2 connection with automatic activity sync
- 📊 **Data Visualization** - Charts for distance, pace, activities by type
- 🗺️ **GPS Mapping** - Interactive maps with Leaflet.js
- 💾 **Smart Caching** - IndexedDB caching to minimize Firebase reads
- 📱 **Responsive Design** - Works on desktop and mobile devices

## 📘 Guides

### Setup & Configuration
- **[Quick Start: Stream Charts](guides/quick-start-stream-charts.md)** - Enable detailed activity charts
- **[Map Types Guide](guides/map-types.md)** - Choose and configure map backgrounds
- **[GPS Downsampling](guides/downsampling.md)** - Optimize GPS data storage

### Performance
- **[Heatmap Performance](guides/heatmap-performance.md)** - Optimize rendering for large datasets
- **[Caching Strategy](../PROJECT_CONTEXT.md#caching)** - IndexedDB implementation details

## 🔧 Troubleshooting

### Common Issues
- **[Sync Issues](troubleshooting/sync-issues.md)** - Fix Strava activity sync problems
- **[Index Error Fix](troubleshooting/index-error-fix.md)** - Resolve Firestore index errors
- **[Streams Fixed](troubleshooting/streams-fixed.md)** - Fix activity stream data issues
- **[Subcollection Solution](troubleshooting/subcollection-solution.md)** - Firestore nested data structure

### Performance Solutions
- **[Optimization Solution](troubleshooting/optimization-solution.md)** - Comprehensive IndexedDB caching implementation

## 🏗️ Technical Stack

### Frontend
- **HTML5, CSS3, Vanilla JavaScript** - No frameworks, pure web technologies
- **Chart.js 4.4.0** - Beautiful, responsive charts
- **Leaflet.js 1.9.4** - Interactive maps with Leaflet.heat plugin

### Backend
- **Firebase Authentication** - Secure user management
- **Firestore** - NoSQL cloud database
- **Node.js Server** - Local development server (port 3000)

### APIs
- **Strava OAuth2 API** - Activity data integration
- **IndexedDB API** - Browser-based caching

## 📁 Project Structure

```
strava/
├── index.html              # Login page
├── dashboard.html          # Main dashboard with activity grid
├── heatmap.html           # Full-screen heatmap visualization
├── settings.html          # User settings and Strava connection
├── analytics.html         # Detailed analytics dashboard
├── hr-calculator.html     # Heart rate zone calculator
├── css/
│   └── styles.css         # Global styles
├── js/
│   ├── auth.js           # Authentication logic
│   ├── app.js            # Dashboard functionality
│   ├── heatmap.js        # Heatmap rendering
│   ├── strava.js         # Strava API integration
│   ├── charts.js         # Chart.js configurations
│   ├── analytics.js      # Analytics page logic
│   ├── settings.js       # Settings page logic
│   ├── hr-calculator.js  # HR zone calculations
│   └── db-cache.js       # IndexedDB caching wrapper
├── docs/
│   ├── INDEX.md          # This file
│   ├── features/         # Feature documentation
│   ├── guides/           # How-to guides
│   └── troubleshooting/  # Problem solutions
├── server.js             # Node.js local server
├── firebase.json         # Firebase hosting config
├── firestore.rules       # Firestore security rules
└── PROJECT_CONTEXT.md    # Technical context

```

## 🚀 Quick Links

### For Users
1. [Setup Instructions](../README.md#setup-instructions)
2. [Connect Strava Account](../README.md#step-5-create-strava-api-application)
3. [Sync Your Activities](../README.md#step-9-sync-strava-activities)
4. [View Your Heatmap](features/heatmap.md)

### For Developers
1. [Technical Architecture](../PROJECT_CONTEXT.md#tech-stack)
2. [Firebase Configuration](../PROJECT_CONTEXT.md#firebase-configuration)
3. [Firestore Data Structure](../PROJECT_CONTEXT.md#firestore-structure)
4. [GPS Data Format](../PROJECT_CONTEXT.md#gps-data-format)
5. [IndexedDB Caching](troubleshooting/optimization-solution.md)

## 🆘 Need Help?

- **Installation Issues?** → [README Setup Instructions](../README.md#setup-instructions)
- **Sync Not Working?** → [Troubleshooting: Sync Issues](troubleshooting/sync-issues.md)
- **Firestore Errors?** → [Troubleshooting: Index Error Fix](troubleshooting/index-error-fix.md)
- **Performance Problems?** → [Optimization Solution](troubleshooting/optimization-solution.md)

## 📝 Recent Updates

### Latest Features ✨
- **Activity Type Filter** - Filter heatmap by Run, Bike, Walk, Hike, or Other
- **Route Intensity Toggle** - Switch between solid and heat-based route coloring
- **Redesigned Controls** - Apple-style glassmorphism UI with consistent styling
- **Profile Images** - Strava athlete profile photos in navigation
- **Settings Page** - Dedicated settings with logout functionality

### Recent Improvements 🔧
- **IndexedDB Caching** - Reduced Firebase reads by 97%
- **Mobile Responsive Design** - Optimized controls for smaller screens
- **SVG Icons** - Consistent icon design across all controls
- **Performance Optimizations** - Faster heatmap loading with batch processing

---

**Last Updated:** November 4, 2025

For questions or issues, please refer to the troubleshooting documentation or check the [Project Context](../PROJECT_CONTEXT.md) for technical details.
