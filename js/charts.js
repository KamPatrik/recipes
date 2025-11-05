// ========================================
// CHART INSTANCES
// ========================================
let distanceTimeChart = null;
let summaryChart = null;
let yearProgressChart = null;
let elevationChart = null;
let activityCountChart = null;
let currentSummaryPeriod = 'weekly';

// ========================================
// CHART COLOR PALETTE
// ========================================
const chartColors = {
    primary: '#FC4C02',
    secondary: '#6C757D',
    success: '#28A745',
    info: '#17A2B8',
    warning: '#FFC107',
    danger: '#DC3545',
    purple: '#764ba2',
    blue: '#667eea',
    orange: '#FF9800',
    green: '#4CAF50'
};

// ========================================
// ACTIVITY CALENDAR
// ========================================
let currentCalendarMonth = new Date();
let calendarActivities = [];

function createDistanceTimeChart(activities) {
    calendarActivities = activities;
    currentCalendarMonth = new Date();
    renderCalendar();
    setupCalendarNavigation();
}

function setupCalendarNavigation() {
    const prevBtn = document.getElementById('calendar-prev');
    const nextBtn = document.getElementById('calendar-next');
    
    if (prevBtn && !prevBtn.hasAttribute('data-initialized')) {
        prevBtn.setAttribute('data-initialized', 'true');
        prevBtn.addEventListener('click', () => {
            currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextBtn && !nextBtn.hasAttribute('data-initialized')) {
        nextBtn.setAttribute('data-initialized', 'true');
        nextBtn.addEventListener('click', () => {
            currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + 1);
            renderCalendar();
        });
    }
}

function renderCalendar() {
    const container = document.getElementById('activity-calendar');
    const titleEl = document.getElementById('calendar-month-title');
    
    if (!container) return;
    
    // Update title
    const monthName = currentCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (titleEl) titleEl.textContent = monthName;
    
    // Group activities by date
    const dailyData = {};
    calendarActivities.forEach(activity => {
        const date = new Date(activity.start_date_local);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
                distance: 0,
                count: 0
            };
        }
        
        dailyData[dateKey].distance += activity.distance / 1000;
        dailyData[dateKey].count += 1;
    });
    
    // Get calendar data
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // Get today for highlighting
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Clear and render
    container.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        container.appendChild(header);
    });
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        container.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = dailyData[dateKey];
        const isToday = dateKey === todayKey;
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        if (isToday) dayEl.classList.add('today');
        if (dayData) dayEl.classList.add('has-activity');
        
        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayEl.appendChild(dayNumber);
        
        // Activity indicator
        if (dayData) {
            const indicator = document.createElement('div');
            indicator.className = 'calendar-activity-indicator';
            
            // Add dots for each activity (max 3)
            const dotsToShow = Math.min(dayData.count, 3);
            for (let i = 0; i < dotsToShow; i++) {
                const dot = document.createElement('div');
                dot.className = 'calendar-activity-dot';
                indicator.appendChild(dot);
            }
            
            dayEl.appendChild(indicator);
            
            // Distance
            const distance = document.createElement('div');
            distance.className = 'calendar-activity-distance';
            distance.textContent = dayData.distance.toFixed(1) + ' km';
            dayEl.appendChild(distance);
            
            // Tooltip on hover
            dayEl.title = `${dayData.count} activit${dayData.count > 1 ? 'ies' : 'y'}\n${dayData.distance.toFixed(1)} km total`;
        }
        
        container.appendChild(dayEl);
    }
}

// ========================================
// SUMMARY CHART (Weekly/Monthly Toggle)
// ========================================
function setupSummaryToggle() {
    const toggleBtns = document.querySelectorAll('.summary-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const period = btn.getAttribute('data-period');
            currentSummaryPeriod = period;
            
            // Update active state
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Recreate chart with new period
            if (summaryChart) {
                const activities = summaryChart.config._activities;
                createSummaryChart(activities);
            }
        });
    });
}

function createSummaryChart(activities) {
    const ctx = document.getElementById('summaryChart');
    if (!ctx) return;

    let periodData = {};
    let labels, distances;

    if (currentSummaryPeriod === 'weekly') {
        // Group by week
        activities.forEach(activity => {
            const date = new Date(activity.start_date_local);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
            const weekKey = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart - new Date(weekStart.getFullYear(), 0, 1)) / 604800000)).padStart(2, '0')}`;
            
            if (!periodData[weekKey]) {
                periodData[weekKey] = { distance: 0, date: weekStart };
            }
            
            periodData[weekKey].distance += activity.distance / 1000; // km
        });

        // Sort and take last 12 weeks
        const sortedPeriods = Object.keys(periodData).sort().slice(-12);
        labels = sortedPeriods.map(key => {
            const date = periodData[key].date;
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        distances = sortedPeriods.map(key => periodData[key].distance.toFixed(0));
    } else {
        // Group by month
        activities.forEach(activity => {
            const date = new Date(activity.start_date_local);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!periodData[monthKey]) {
                periodData[monthKey] = { distance: 0 };
            }
            
            periodData[monthKey].distance += activity.distance / 1000; // km
        });

        // Sort and take last 12 months
        const sortedPeriods = Object.keys(periodData).sort().slice(-12);
        labels = sortedPeriods.map(key => {
            const [year, month] = key.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        distances = sortedPeriods.map(key => periodData[key].distance.toFixed(0));
    }

    // Destroy existing chart
    if (summaryChart) {
        summaryChart.destroy();
    }

    summaryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Distance (km)',
                    data: distances,
                    backgroundColor: chartColors.primary,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' km';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        autoSkip: true,
                        autoSkipPadding: 10
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' km';
                        }
                    }
                }
            }
        }
    });

    // Store activities for toggle
    summaryChart.config._activities = activities;
}

// ========================================
// YEAR PROGRESS CHART (Line - Cumulative)
// ========================================
function createYearProgressChart(activities) {
    const ctx = document.getElementById('yearProgressChart');
    if (!ctx) return;

    // Sort activities by date
    const sortedActivities = [...activities].sort((a, b) => {
        return new Date(a.start_date) - new Date(b.start_date);
    });

    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Filter activities for current year and group by month
    const yearActivities = sortedActivities.filter(a => {
        return new Date(a.start_date).getFullYear() === currentYear;
    });

    // Create cumulative data by month
    const monthlyData = {};
    let cumulativeDistance = 0;
    
    yearActivities.forEach(activity => {
        const date = new Date(activity.start_date_local);
        const monthKey = date.getMonth(); // 0-11
        
        cumulativeDistance += activity.distance / 1000; // km
        monthlyData[monthKey] = cumulativeDistance;
    });

    // Fill in all 12 months
    const labels = [];
    const distances = [];
    for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1);
        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        distances.push(monthlyData[i] || (i > 0 ? distances[i - 1] || 0 : 0));
    }

    // Destroy existing chart
    if (yearProgressChart) {
        yearProgressChart.destroy();
    }

    yearProgressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${currentYear} Cumulative Distance (km)`,
                data: distances,
                borderColor: chartColors.primary,
                backgroundColor: chartColors.primary + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y.toFixed(0) + ' km total';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' km';
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// ELEVATION GAIN CHART (Line - Cumulative Year Progress)
// ========================================
function createElevationChart(activities) {
    const ctx = document.getElementById('elevationChart');
    if (!ctx) return;

    // Sort activities by date
    const sortedActivities = [...activities].sort((a, b) => {
        return new Date(a.start_date) - new Date(b.start_date);
    });

    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Filter activities for current year
    const yearActivities = sortedActivities.filter(a => {
        return new Date(a.start_date).getFullYear() === currentYear;
    });

    // Create cumulative elevation data by month
    const monthlyData = {};
    let cumulativeElevation = 0;
    
    yearActivities.forEach(activity => {
        const date = new Date(activity.start_date_local);
        const monthKey = date.getMonth(); // 0-11
        
        cumulativeElevation += activity.total_elevation_gain || 0; // meters
        monthlyData[monthKey] = cumulativeElevation;
    });

    // Fill in all 12 months
    const labels = [];
    const elevations = [];
    for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1);
        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        elevations.push(monthlyData[i] || (i > 0 ? elevations[i - 1] || 0 : 0));
    }

    // Destroy existing chart
    if (elevationChart) {
        elevationChart.destroy();
    }

    elevationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${currentYear} Cumulative Elevation (m)`,
                data: elevations,
                borderColor: chartColors.green,
                backgroundColor: chartColors.green + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y.toFixed(0) + ' m total';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' m';
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// ACTIVITY COUNT CHART (Monthly Bar Chart)
// ========================================
function createActivityCountChart(activities) {
    const ctx = document.getElementById('activityCountChart');
    if (!ctx) return;

    // Group activities by month
    const monthCounts = {};
    const currentYear = new Date().getFullYear();
    
    activities.forEach(activity => {
        const date = new Date(activity.start_date_local);
        if (date.getFullYear() === currentYear) {
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        }
    });

    // Sort by date
    const sortedMonths = Object.keys(monthCounts).sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    const counts = sortedMonths.map(month => monthCounts[month]);

    if (activityCountChart) {
        activityCountChart.destroy();
    }

    activityCountChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Activities',
                data: counts,
                backgroundColor: chartColors.primary,
                borderColor: chartColors.primary,
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' activities';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Math.floor(value);
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// UPDATE ALL CHARTS
// ========================================
function updateAllCharts(activities, sportType) {
    if (!activities || activities.length === 0) {
        console.log('No activities to display');
        return;
    }

    // Update calendar for all sports
    calendarActivities = activities;
    currentCalendarMonth = new Date();
    renderCalendar();
    setupCalendarNavigation();

    // Check if current sport is Badminton or similar (no distance tracking)
    const isBadminton = sportType === 'Badminton';

    // Show/hide appropriate charts
    const yearProgressCard = document.getElementById('year-progress-card');
    const elevationCard = document.getElementById('elevation-progress-card');
    const activityCountCard = document.getElementById('activity-count-card');
    const yearTotalCard = document.getElementById('year-total-card');

    if (isBadminton) {
        // Hide distance/elevation based charts for Badminton
        if (yearProgressCard) yearProgressCard.classList.add('hidden');
        if (elevationCard) elevationCard.classList.add('hidden');
        if (activityCountCard) activityCountCard.classList.remove('hidden');
        if (yearTotalCard) yearTotalCard.classList.remove('hidden');
        
        // Update year total display
        const currentYear = new Date().getFullYear();
        const yearActivities = activities.filter(a => {
            const activityYear = new Date(a.start_date_local).getFullYear();
            return activityYear === currentYear;
        });
        
        const yearTotalNumber = document.getElementById('year-total-number');
        const yearTotalYearSpan = document.getElementById('year-total-year');
        if (yearTotalNumber) yearTotalNumber.textContent = yearActivities.length;
        if (yearTotalYearSpan) yearTotalYearSpan.textContent = currentYear;
        
        // Calculate days since last activity
        const daysSinceNumber = document.getElementById('days-since-number');
        if (daysSinceNumber && activities.length > 0) {
            // Sort activities by date (most recent first)
            const sortedActivities = [...activities].sort((a, b) => {
                return new Date(b.start_date_local) - new Date(a.start_date_local);
            });
            
            const lastActivity = sortedActivities[0];
            const lastDate = new Date(lastActivity.start_date_local);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            lastDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            daysSinceNumber.textContent = daysDiff;
        }
        
        // Create activity count chart
        createActivityCountChart(activities);
    } else {
        // Show normal charts for other sports
        if (yearProgressCard) yearProgressCard.classList.remove('hidden');
        if (elevationCard) elevationCard.classList.remove('hidden');
        if (activityCountCard) activityCountCard.classList.add('hidden');
        if (yearTotalCard) yearTotalCard.classList.add('hidden');
        
        createDistanceTimeChart(activities);
        createYearProgressChart(activities);
        createElevationChart(activities);
        updateTargetProgress(activities, sportType);
    }
}

// ========================================
// TARGET PROGRESS - SIMPLE DISPLAY
// ========================================
async function updateTargetProgress(activities, sportType) {
    console.log('🎯 Updating target progress for:', sportType);
    
    if (!activities || activities.length === 0) {
        console.log('⚠️ No activities for target progress');
        return;
    }
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const user = auth.currentUser;
    
    if (!user) {
        console.log('⚠️ No user logged in');
        return;
    }
    
    // Load year target from Firestore
    let yearTarget = 0;
    try {
        const targetId = `${sportType}_${currentYear}`;
        const targetDoc = await db.collection('users').doc(user.uid)
            .collection('targets').doc(targetId)
            .get();
        
        if (targetDoc.exists) {
            yearTarget = targetDoc.data().targetKm || 0;
            console.log('✅ Year target:', yearTarget, 'km');
        } else {
            console.log('ℹ️ No target set');
        }
    } catch (e) {
        console.error('❌ Error loading target:', e);
    }
    
    // Calculate year progress
    const yearActivities = activities.filter(a => {
        const activityYear = new Date(a.start_date_local).getFullYear();
        return activityYear === currentYear;
    });
    const yearDistance = yearActivities.reduce((sum, a) => sum + ((a.distance || 0) / 1000), 0);
    
    // Calculate month progress
    const monthActivities = activities.filter(a => {
        const activityDate = new Date(a.start_date_local);
        return activityDate.getFullYear() === currentYear && activityDate.getMonth() === currentMonth;
    });
    const monthDistance = monthActivities.reduce((sum, a) => sum + ((a.distance || 0) / 1000), 0);
    const monthTarget = yearTarget > 0 ? yearTarget / 12 : 0;
    
    // Calculate days since last activity
    let daysSince = 0;
    if (activities.length > 0) {
        const sortedActivities = [...activities].sort((a, b) => {
            return new Date(b.start_date_local) - new Date(a.start_date_local);
        });
        const lastActivity = sortedActivities[0];
        const lastDate = new Date(lastActivity.start_date_local);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);
        daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    }
    
    // Update Year Target Display
    const yearNumberEl = document.getElementById('target-year-number');
    const yearDescEl = document.getElementById('target-year-description');
    const yearDonutEl = document.getElementById('year-donut-fill');
    
    if (yearTarget > 0) {
        const yearPercent = Math.min((yearDistance / yearTarget) * 100, 100);
        if (yearNumberEl) yearNumberEl.textContent = `${Math.round(yearPercent)}%`;
        if (yearDescEl) yearDescEl.textContent = `${Math.round(yearDistance)} / ${Math.round(yearTarget)} km`;
        if (yearDonutEl) yearDonutEl.setAttribute('stroke-dasharray', `${yearPercent}, 100`);
    } else {
        if (yearNumberEl) yearNumberEl.textContent = '-';
        if (yearDescEl) yearDescEl.textContent = 'No target set';
        if (yearDonutEl) yearDonutEl.setAttribute('stroke-dasharray', '0, 100');
    }
    
    // Update Month Target Display
    const monthNumberEl = document.getElementById('target-month-number');
    const monthDescEl = document.getElementById('target-month-description');
    const monthDonutEl = document.getElementById('month-donut-fill');
    
    if (monthTarget > 0) {
        const monthPercent = Math.min((monthDistance / monthTarget) * 100, 100);
        if (monthNumberEl) monthNumberEl.textContent = `${Math.round(monthPercent)}%`;
        if (monthDescEl) monthDescEl.textContent = `${Math.round(monthDistance)} / ${Math.round(monthTarget)} km`;
        if (monthDonutEl) monthDonutEl.setAttribute('stroke-dasharray', `${monthPercent}, 100`);
    } else {
        if (monthNumberEl) monthNumberEl.textContent = '-';
        if (monthDescEl) monthDescEl.textContent = 'No target set';
        if (monthDonutEl) monthDonutEl.setAttribute('stroke-dasharray', '0, 100');
    }
    
    // Update Days Since Last Activity
    const daysNumberEl = document.getElementById('target-days-number');
    if (daysNumberEl) {
        daysNumberEl.textContent = daysSince;
    }
    
    console.log('✅ Target progress updated:', {
        yearDistance: Math.round(yearDistance),
        yearTarget: Math.round(yearTarget),
        monthDistance: Math.round(monthDistance),
        monthTarget: Math.round(monthTarget),
        daysSince
    });
}

// ========================================
// DESTROY ALL CHARTS
// ========================================
function destroyAllCharts() {
    if (distanceTimeChart) distanceTimeChart.destroy();
    if (summaryChart) summaryChart.destroy();
    if (yearProgressChart) yearProgressChart.destroy();
    if (elevationChart) elevationChart.destroy();
    if (activityCountChart) activityCountChart.destroy();
}
