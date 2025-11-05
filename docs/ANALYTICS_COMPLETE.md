# Analytics Page - Complete Feature List

## ✅ Implemented Charts

### 1. **📊 Distance Analysis**
- Weekly/monthly/yearly distance totals
- Multi-year comparison with selectable years
- Color-coded by year
- Status: **COMPLETE**

### 2. **⛰️ Elevation Analysis**
- Weekly/monthly/yearly elevation gain
- Multi-year comparison
- Status: **COMPLETE**

### 3. **❤️ Heart Rate Zone Analysis**
- Zone 2 detection and filtering
- Time spent in different HR zones
- Activity-level zone breakdown
- Status: **COMPLETE**

### 4. **📅 Activity Calendar (GitHub-style)**
- Year-by-year activity visualization
- Consecutive days without activity tracking
- Heat map showing activity frequency
- Status: **COMPLETE**

### 5. **💪 Performance Management Chart (PMC)** ⭐ **FITNESS-FATIGUE MODEL**
- **CTL (Chronic Training Load)**: 42-day exponentially weighted moving average
  - Represents long-term fitness
  - Higher CTL = better endurance
  
- **ATL (Acute Training Load)**: 7-day exponentially weighted moving average
  - Represents short-term fatigue
  - Spikes after hard training weeks
  
- **TSB (Training Stress Balance)**: CTL - ATL
  - **Form indicator**:
    - +25 or higher: 🎯 Peak form - ready to race!
    - +10 to +25: ✨ Good form - feeling fresh
    - -10 to +10: 💪 Productive training zone
    - -30 to -10: ⚠️ Accumulating fatigue
    - -30 or lower: 🚨 High risk of overtraining

- **TSS (Training Stress Score)**: Sport-science based calculation
  - Considers duration, intensity (HR/pace), sport type
  - Different formulas for running, cycling, swimming, etc.
  - Adjusted for workout difficulty

- **Time Ranges**: 3 months, 6 months, 1 year
- Status: **COMPLETE** ✅

### 6. **🏃 Speed Analysis** ⭐ NEW
- **Speed Trend**: Line chart showing average speed over time
  - Moving average overlay (7-activity window)
  - Speeds in km/h
  
- **Speed vs HR**: Scatter plot correlating speed with heart rate
  - Each point is an activity
  - Shows efficiency relationship
  
- **Time Ranges**: 3 months, 6 months, 1 year
- Status: **COMPLETE** ✅

### 7. **🫁 VO2 Max Estimation** ⭐ NEW
- **Estimated VO2 Max**: Cardiovascular fitness metric
  - Formula: (speed × sport_factor) / HR_intensity
  - Different calculations for running, cycling, other sports
  - Values clamped between 20-80 ml/kg/min
  
- **Weekly Averages**: Grouped by week with trend line
- **Trend Analysis**: Linear regression showing fitness progression
- **Time Ranges**: 3 months, 6 months, 1 year
- Status: **COMPLETE** ✅

### 8. **❤️ Heart Rate Variability (HRV)** ⭐ NEW
- **Three Metrics**:
  1. **HR Variability Index**: Percentage-based measure
  2. **Standard Deviation**: HR spread during activity
  3. **HR Range**: Max HR - Avg HR
  
- **Moving Average**: Smoothed trend line
- **Recovery Indicator**: Higher variability = better recovery
- **Time Ranges**: 1 month, 3 months, 6 months
- Status: **COMPLETE** ✅

### 9. **⛰️ Effort vs Elevation** ⭐ NEW
- **Scatter Plot**: Elevation gain (x) vs Effort (y)
- **Three Effort Metrics**:
  1. **Average HR**: Mean heart rate during activity
  2. **Max HR**: Peak heart rate reached
  3. **Effort Score**: Combined metric (elevation × HR intensity)
  
- **Color Coding**:
  - 🟢 Green: Low effort (< 40% of max)
  - 🟡 Yellow: Medium effort (40-60%)
  - 🟠 Orange: High effort (60-80%)
  - 🔴 Red: Very high effort (> 80%)
  
- **Time Ranges**: 3 months, 6 months, 1 year
- Status: **COMPLETE** ✅

---

## 🎨 Design Features

- **Glassmorphism UI**: Consistent card design with backdrop blur
- **Responsive Layout**: Works on desktop and mobile
- **Interactive Controls**: Time period selectors, metric toggles
- **Chart.js Integration**: Professional, interactive charts
- **Color Scheme**: Strava orange (#FC4C02) with accent colors
- **Tooltips**: Detailed information on hover
- **Empty States**: Graceful handling of missing data

---

## 📁 File Structure

```
js/
  ├── analytics.js (65KB)           # Main analytics logic, PMC implementation
  ├── analytics-new-charts.js (27KB) # Speed, VO2, HRV, Effort charts
  ├── charts.js (23KB)              # Chart utilities
  └── auth.js                       # Firebase authentication

analytics.html (17KB)               # Analytics page with all chart sections
css/styles.css (53KB)               # Complete styling including all chart controls
```

---

## 🔬 Sport Science Implementation

### Training Stress Score (TSS)
- Formula: `duration_hours × intensity_factor² × 100 × sport_multiplier`
- Intensity estimation from HR zones or pace
- Sport-specific multipliers (Run=1.0, Swim=1.1, Yoga=0.4, etc.)

### Exponentially Weighted Moving Average (EWMA)
- Alpha = 2 / (time_constant + 1)
- CTL: 42-day time constant (long-term fitness)
- ATL: 7-day time constant (short-term fatigue)
- TSB: Difference between CTL and ATL (form indicator)

### VO2 Max Estimation
- Running: (speed_kmh × 3.5) / HR_intensity
- Cycling: (speed_kmh × 2.5) / HR_intensity
- HR intensity = (current_HR - resting_HR) / (max_HR - resting_HR)
- Assumes: max_HR = 220 - 30 (age 30), resting_HR = 60

### Heart Rate Variability (Simplified)
- True HRV requires R-R interval data (not available from Strava)
- Estimation: stdDev = (max_HR - avg_HR) / 4
- Variability index = (stdDev / avg_HR) × 100

---

## 🚀 Usage

1. **Start Server**: `node server.js`
2. **Open**: http://localhost:3000/analytics.html
3. **Login**: Authenticate with Firebase
4. **Sync**: Connect Strava and sync activities
5. **Analyze**: All charts auto-populate with your data

---

## 📊 Data Requirements

- **Distance/Elevation Charts**: Any activity with distance data
- **HR Zone Analysis**: Activities with heart rate stream data
- **PMC Chart**: Any activity (TSS calculated from available metrics)
- **Speed Analysis**: Activities with average_speed
- **VO2 Max**: Activities with average_speed + average_heartrate
- **HRV**: Activities with average_heartrate + max_heartrate
- **Effort/Elevation**: Activities with total_elevation_gain + heart rate

---

## ✅ All Features Tested and Working!
