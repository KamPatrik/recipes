# 🏃 Strava Activity Tracker

A web application for tracking, analyzing, and visualizing your Strava activities. Built with vanilla JavaScript, Firebase, and Chart.js.

![Strava Activity Tracker](https://img.shields.io/badge/Status-Ready-brightgreen) ![Firebase](https://img.shields.io/badge/Firebase-10.7.1-orange) ![Chart.js](https://img.shields.io/badge/Chart.js-4.4.0-blue)

> **📚 [Complete Documentation](docs/INDEX.md)** | **🔧 [Technical Context](PROJECT_CONTEXT.md)** | **🚀 [Quick Start](#-setup-instructions)**

## 🌟 Features

### Core Functionality
- **🔐 User Authentication**: Secure signup/login with Firebase Authentication
- **🔄 Strava Integration**: Connect your Strava account via OAuth2
- **📊 Activity Sync**: Download all your Strava activities to Firebase
- **💾 Smart Caching**: IndexedDB caching reduces Firebase reads by 97%
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices

### Data Visualization
- **Activity Dashboard**: Grid view with detailed activity cards
- **Advanced Charts**: Distance over time, pace analysis, activity type breakdown
- **Stream Charts**: Detailed pace, heart rate, elevation, cadence, and power graphs
- **Analytics Page**: Comprehensive activity metrics and trends
- **💪 Performance Management Chart**: Track fitness (CTL), fatigue (ATL), and form (TSB) using sport science

### Heatmap Features
- **🔥 Activity Heatmap**: Visualize all routes with heat intensity overlay
- **🗺️ Individual Routes**: View each route separately with unique colors
- **🎯 Route Intensity**: Toggle between solid and heat-based coloring
- **🏃 Activity Type Filter**: Filter by Run, Bike, Walk, Hike, or Other
- **🎨 Map Visibility**: Adjust background map opacity (0-100%)
- **🗺️ Multiple Map Layers**: Street, Terrain, Satellite, Dark Mode, Watercolor, Cycling

### Additional Tools
- **❤️ HR Zone Calculator**: Calculate personalized heart rate training zones
- **⚙️ Settings Page**: Manage profile, Strava connection, and account settings
- **📊 Analytics Dashboard**: Deep dive into your activity data
- **☁️ Cloud Hosting**: Deploy to Firebase Hosting for free

## 📋 Prerequisites

Before you start, make sure you have:

- **Node.js** installed (v16 or higher)
- A **Firebase account** (free tier is sufficient)
- A **Strava account** with activities
- A **Strava API application** (we'll create this)

## 🚀 Setup Instructions

### Step 1: Clone/Download the Project

You already have the files, so skip to Step 2!

### Step 2: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "strava-tracker")
4. Disable Google Analytics (optional for this project)
5. Click **"Create project"**

### Step 3: Enable Firebase Authentication

1. In your Firebase project, go to **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Enable **"Email/Password"** sign-in method
4. Click **"Save"**

### Step 4: Create Firestore Database

1. Go to **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select a location (choose closest to you)
5. Click **"Enable"**

### Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon) → **"General"**
2. Scroll down to **"Your apps"**
3. Click the **web icon** (`</>`) to add a web app
4. Register app with a nickname (e.g., "Strava Tracker Web")
5. Copy the `firebaseConfig` object

### Step 6: Update Firebase Config in Your Code

Open `js/auth.js` and replace the Firebase config (lines 4-10):

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 7: Deploy Firestore Security Rules

1. Install Firebase CLI (if not already installed):
   ```powershell
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```powershell
   firebase login
   ```

3. Initialize Firebase in your project directory:
   ```powershell
   cd c:\Users\TB49503\Desktop\strava
   firebase init
   ```
   
   - Select **"Firestore"** and **"Hosting"**
   - Use existing project (select your project)
   - Accept default files (firestore.rules, firestore.indexes.json)
   - For public directory, enter: `.` (current directory)
   - Configure as single-page app: **No**
   - Don't overwrite existing files

4. Deploy security rules:
   ```powershell
   firebase deploy --only firestore:rules
   ```

### Step 8: Create Strava API Application

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Click **"Create an App"** or go to [Create App](https://www.strava.com/oauth/authorize)
3. Fill in the form:
   - **Application Name**: Strava Activity Tracker
   - **Category**: Data Analysis
   - **Club**: Leave blank
   - **Website**: `http://localhost:3000` (for testing)
   - **Authorization Callback Domain**: `localhost` (for testing)
   - **Application Description**: Personal activity tracker (optional)
4. Click **"Create"**
5. Copy your **Client ID** and **Client Secret**

### Step 9: Update Strava Config in Your Code

Open `js/strava.js` and replace the Strava credentials (lines 4-6):

```javascript
const STRAVA_CLIENT_ID = 'YOUR_STRAVA_CLIENT_ID';
const STRAVA_CLIENT_SECRET = 'YOUR_STRAVA_CLIENT_SECRET';
const STRAVA_REDIRECT_URI = 'http://localhost:3000/strava-callback.html';
```

### Step 10: Update .firebaserc

Open `.firebaserc` and replace with your Firebase project ID:

```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

## 🖥️ Local Development

### Run Locally with a Simple HTTP Server

Since you have Node.js installed, you can use `http-server`:

1. Install http-server globally:
   ```powershell
   npm install -g http-server
   ```

2. Start the server:
   ```powershell
   cd c:\Users\TB49503\Desktop\strava
   http-server -p 3000
   ```

3. Open your browser and go to: `http://localhost:3000`

### Alternative: Use VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select **"Open with Live Server"**

## 🌐 Deploy to Firebase Hosting

### Deploy Your App

1. Make sure you're in the project directory:
   ```powershell
   cd c:\Users\TB49503\Desktop\strava
   ```

2. Deploy to Firebase Hosting:
   ```powershell
   firebase deploy --only hosting
   ```

3. Firebase will give you a URL like: `https://YOUR_PROJECT_ID.web.app`

### Update Strava Callback URL for Production

After deploying:

1. Go back to [Strava API Settings](https://www.strava.com/settings/api)
2. Update **Authorization Callback Domain** to: `YOUR_PROJECT_ID.web.app`
3. Update **Website** to: `https://YOUR_PROJECT_ID.web.app`
4. Update `js/strava.js` with your production URL:
   ```javascript
   const STRAVA_REDIRECT_URI = 'https://YOUR_PROJECT_ID.web.app/strava-callback.html';
   ```
5. Redeploy: `firebase deploy --only hosting`

## 📱 How to Use the App

### First Time Setup

1. **Create Account**: 
   - Go to the app URL
   - Click "Sign up"
   - Enter your email, password, and name
   - Click "Create Account"

2. **Connect Strava**:
   - You'll be redirected to the dashboard
   - Click "Connect Strava" button
   - Authorize the app on Strava's website
   - You'll be redirected back to the dashboard

3. **Sync Activities**:
   - Click "Sync Activities" button
   - Wait for all activities to download (may take a minute)
   - View your activities and charts!

### Daily Use

- **Login**: Use your email and password
- **Sync New Activities**: Click "Sync Activities" to get new workouts
- **View Stats**: Explore charts and activity list
- **Logout**: Click "Logout" button in the top-right

## 📊 Features Explained

### Quick Stats Sidebar
- **Total Activities**: Count of all synced activities
- **Total Distance**: Sum of all distances in kilometers
- **Total Time**: Sum of all moving time in hours

### Charts
- **Activities by Type**: See distribution of your workout types
- **Distance Over Time**: Track distance trends for last 30 activities
- **Monthly Summary**: Compare monthly distance and activity count
- **Average Pace**: Compare pace across different activity types

### Activity List
- View recent 20 activities
- See name, type, date, distance, time, and pace
- Icons represent different activity types

## 🔒 Security & Privacy

- **Your data is private**: Only you can access your activities
- **Secure authentication**: Firebase handles all security
- **Firestore rules**: Restrict data access to authenticated users only
- **No data selling**: This is for personal use only
- **Strava API limits**: Respects Strava's rate limits (100 requests/15min)

## 🛠️ Troubleshooting

### Firebase Errors

**Error: "Missing or insufficient permissions"**
- Make sure you deployed Firestore rules: `firebase deploy --only firestore:rules`

**Error: "Firebase: Error (auth/...)"**
- Check that Firebase Authentication is enabled
- Verify your Firebase config is correct in `js/auth.js`

### Strava Errors

**Error: "Failed to exchange token"**
- Verify your Strava Client ID and Secret are correct
- Check that callback URL matches your Strava app settings
- Make sure your app URL matches the callback domain

**Error: "Authorization callback domain mismatch"**
- Update Strava app settings to match your hosting URL
- Use `localhost` for local testing, `YOUR_PROJECT_ID.web.app` for production

### Activities Not Syncing

- Check browser console for errors (F12)
- Verify Strava connection is active (green checkmark)
- Try disconnecting and reconnecting Strava
- Check that you have activities in your Strava account

## 📈 Firebase Free Tier Limits

Your app will work perfectly on Firebase's free "Spark" plan:

- **Firestore**: 50,000 reads/day, 20,000 writes/day
- **Storage**: 1 GB
- **Hosting**: 10 GB/month bandwidth
- **Authentication**: Unlimited users

For personal use (1 user), you'll never hit these limits!

## 🔧 Customization Ideas

- Add more chart types (elevation, heart rate trends)
- Filter activities by date range or type
- Add activity goals and achievements
- Export data to CSV/Excel
- Add dark mode theme
- Show weather data for activities
- Compare year-over-year statistics

## 📝 Project Structure

```
strava-app/
├── index.html              # Login/signup page
├── dashboard.html          # Main dashboard
├── strava-callback.html    # OAuth callback handler
├── css/
│   └── styles.css         # All styling
├── js/
│   ├── auth.js            # Firebase authentication
│   ├── strava.js          # Strava API integration
│   ├── charts.js          # Chart.js visualizations
│   └── app.js             # Main application logic
├── firebase.json          # Firebase hosting config
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── .firebaserc            # Firebase project config
├── .gitignore             # Git ignore file
└── README.md              # This file
```

## 🤝 Support

If you run into issues:

1. Check the browser console (F12) for errors
2. Verify all configuration steps were completed
3. Make sure Firebase and Strava credentials are correct
4. Check that services are enabled in Firebase Console

## 📜 License

This project is for personal/educational use only. Not for commercial distribution.

## 🎉 Enjoy!

You now have a fully functional Strava activity tracker! Start syncing your activities and exploring your fitness data! 🏃‍♂️🚴‍♀️🏊‍♂️

---

**Made with ❤️ for fitness enthusiasts**
