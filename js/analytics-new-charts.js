// ========================================
// NEW ANALYTICS CHARTS
// Speed, VO2 Max, HRV, Effort vs Elevation
// ========================================

// Chart instances
let speedChart = null;
let vo2Chart = null;
let hrvChart = null;
let effortChart = null;

// Chart settings
let speedPeriod = 90; // days
let speedChartType = 'speed'; // 'speed' or 'speed-hr'
let vo2Period = 90; // days
let hrvPeriod = 30; // days
let hrvMetric = 'variability'; // 'variability', 'std-dev', 'range'
let effortPeriod = 90; // days
let effortMetric = 'avg-hr'; // 'avg-hr', 'max-hr', 'effort-score'

// ========================================
// SPEED ANALYSIS CHART
// ========================================
function setupSpeedChart() {
    const periodButtons = document.querySelectorAll('.period-btn-speed');
    const typeButtons = document.querySelectorAll('.chart-type-btn-speed');
    
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            speedPeriod = parseInt(btn.dataset.period);
            updateSpeedChart();
        });
    });
    
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            speedChartType = btn.dataset.type;
            updateSpeedChart();
        });
    });
    
    updateSpeedChart();
}

function updateSpeedChart() {
    const canvas = document.getElementById('speedChart');
    if (!canvas) return;
    
    // Filter activities by time period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - speedPeriod);
    
    const periodActivities = filteredActivities.filter(a => {
        const actDate = a.start_date?.toDate ? a.start_date.toDate() : new Date(a.start_date);
        return actDate >= cutoffDate && a.average_speed && a.average_speed > 0;
    });
    
    if (periodActivities.length === 0) {
        if (speedChart) {
            speedChart.destroy();
            speedChart = null;
        }
        return;
    }
    
    // Sort by date
    periodActivities.sort((a, b) => {
        const dateA = a.start_date?.toDate ? a.start_date.toDate() : new Date(a.start_date);
        const dateB = b.start_date?.toDate ? b.start_date.toDate() : new Date(b.start_date);
        return dateA - dateB;
    });
    
    if (speedChartType === 'speed') {
        // Speed trend over time
        const labels = periodActivities.map(a => {
            const date = a.start_date?.toDate ? a.start_date.toDate() : new Date(a.start_date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const speeds = periodActivities.map(a => a.average_speed * 3.6); // m/s to km/h
        
        // Calculate moving average
        const movingAvg = [];
        const window = Math.min(7, Math.floor(speeds.length / 3));
        for (let i = 0; i < speeds.length; i++) {
            const start = Math.max(0, i - window + 1);
            const subset = speeds.slice(start, i + 1);
            movingAvg.push(subset.reduce((a, b) => a + b, 0) / subset.length);
        }
        
        const data = {
            labels,
            datasets: [
                {
                    label: 'Average Speed',
                    data: speeds,
                    borderColor: '#FC4C02',
                    backgroundColor: 'rgba(252, 76, 2, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3
                },
                {
                    label: `${window}-Activity Moving Avg`,
                    data: movingAvg,
                    borderColor: '#3B82F6',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4
                }
            ]
        };
        
        const config = {
            type: 'line',
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} km/h`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Speed (km/h)',
                            color: '#fff',
                            font: { size: 14, weight: '600' }
                        },
                        ticks: {
                            color: '#fff',
                            callback: value => value.toFixed(1) + ' km/h'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#fff',
                            font: { size: 14, weight: '600' }
                        },
                        ticks: { color: '#fff', maxRotation: 45, minRotation: 45 },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        };
        
        if (speedChart) {
            speedChart.destroy();
        }
        speedChart = new Chart(canvas, config);
        
    } else {
        // Speed vs HR scatter plot
        const activitiesWithHR = periodActivities.filter(a => a.average_heartrate && a.average_heartrate > 0);
        
        if (activitiesWithHR.length === 0) {
            if (speedChart) {
                speedChart.destroy();
                speedChart = null;
            }
            return;
        }
        
        const scatterData = activitiesWithHR.map(a => ({
            x: a.average_heartrate,
            y: a.average_speed * 3.6,
            activity: a
        }));
        
        const data = {
            datasets: [{
                label: 'Speed vs Heart Rate',
                data: scatterData,
                backgroundColor: 'rgba(252, 76, 2, 0.6)',
                borderColor: '#FC4C02',
                borderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        };
        
        const config = {
            type: 'scatter',
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top',
                        labels: { 
                            color: '#fff', 
                            font: { size: 13, weight: '600' },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            title: function(context) {
                                const activity = context[0].raw.activity;
                                return activity.name || 'Activity';
                            },
                            label: function(context) {
                                return [
                                    `Speed: ${context.parsed.y.toFixed(2)} km/h`,
                                    `Heart Rate: ${context.parsed.x.toFixed(0)} bpm`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Average Heart Rate (bpm)',
                            color: '#fff',
                            font: { size: 14, weight: '600' }
                        },
                        ticks: { color: '#fff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Average Speed (km/h)',
                            color: '#fff',
                            font: { size: 14, weight: '600' }
                        },
                        ticks: { color: '#fff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        };
        
        if (speedChart) {
            speedChart.destroy();
        }
        speedChart = new Chart(canvas, config);
    }
}

// ========================================
// VO2 MAX CHART
// ========================================
function setupVO2Chart() {
    const periodButtons = document.querySelectorAll('.period-btn-vo2');
    
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            vo2Period = parseInt(btn.dataset.period);
            updateVO2Chart();
        });
    });
    
    updateVO2Chart();
}

function calculateVO2Max(activity) {
    // Simplified VO2 Max estimation based on speed and heart rate
    // Uses Cooper formula adapted for cycling/running
    
    if (!activity.average_speed || !activity.average_heartrate) {
        return null;
    }
    
    const speedKmh = activity.average_speed * 3.6; // m/s to km/h
    const hr = activity.average_heartrate;
    const maxHR = 220 - 30; // Assume age 30 as default
    const hrReserve = maxHR - 60; // Assume resting HR of 60
    const hrIntensity = (hr - 60) / hrReserve;
    
    if (hrIntensity <= 0) return null;
    
    // Different calculations for different sport types
    if (activity.sport_type === 'Run' || activity.type === 'Run') {
        // Running VO2 Max estimation (ml/kg/min)
        const vo2 = (speedKmh * 3.5) / hrIntensity;
        return Math.min(Math.max(vo2, 20), 80);
    } else if (activity.sport_type === 'Ride' || activity.type === 'Ride') {
        // Cycling VO2 Max estimation
        const vo2 = (speedKmh * 2.5) / hrIntensity;
        return Math.min(Math.max(vo2, 20), 80);
    } else {
        // Generic estimation
        const vo2 = (speedKmh * 3.0) / hrIntensity;
        return Math.min(Math.max(vo2, 20), 80);
    }
}

function updateVO2Chart() {
    const canvas = document.getElementById('vo2Chart');
    if (!canvas) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - vo2Period);
    
    const periodActivities = filteredActivities.filter(a => {
        const actDate = a.start_date?.toDate ? a.start_date.toDate() : new Date(a.start_date);
        return actDate >= cutoffDate;
    });
    
    const vo2Data = [];
    periodActivities.forEach(a => {
        const vo2 = calculateVO2Max(a);
        if (vo2 !== null) {
            const date = a.start_date?.toDate ? a.start_date.toDate() : new Date(a.start_date);
            vo2Data.push({ date, vo2, activity: a });
        }
    });
    
    if (vo2Data.length === 0) {
        if (vo2Chart) {
            vo2Chart.destroy();
            vo2Chart = null;
        }
        return;
    }
    
    vo2Data.sort((a, b) => a.date - b.date);
    
    // Group by week
    const weeklyData = new Map();
    vo2Data.forEach(item => {
        const weekStart = new Date(item.date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, []);
        }
        weeklyData.get(weekKey).push(item.vo2);
    });
    
    const labels = [];
    const avgVO2 = [];
    
    weeklyData.forEach((values, weekKey) => {
        const date = new Date(weekKey);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        avgVO2.push(avg);
    });
    
    const trend = calculateTrendLine(avgVO2);
    
    const data = {
        labels,
        datasets: [
            {
                label: 'Estimated VO2 Max',
                data: avgVO2,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
                fill: true
            },
            {
                label: 'Trend',
                data: trend,
                borderColor: '#3B82F6',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                tension: 0
            }
        ]
    };
    
    const config = {
        type: 'line',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { 
                        color: '#fff', 
                        font: { size: 14, weight: '600', family: 'system-ui, -apple-system, sans-serif' },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        boxHeight: 8
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `VO2 Max: ${context.parsed.y.toFixed(1)} ml/kg/min`;
                            }
                            return `Trend: ${context.parsed.y.toFixed(1)} ml/kg/min`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'VO2 Max (ml/kg/min)',
                        font: { size: 14, weight: '600' },
                        color: '#fff'
                    },
                    ticks: {
                        color: '#fff',
                        callback: value => value.toFixed(0)
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Week',
                        color: '#fff',
                        font: { size: 14, weight: '600' }
                    },
                    ticks: { color: '#fff', maxRotation: 45, minRotation: 45 },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    };
    
    if (vo2Chart) {
        vo2Chart.destroy();
    }
    vo2Chart = new Chart(canvas, config);
}

function calculateTrendLine(data) {
    if (data.length < 2) return data;
    
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return data.map((_, i) => slope * i + intercept);
}

// ========================================
// HEART RATE VARIABILITY CHART
// ========================================
function setupHRVChart() {
    const periodButtons = document.querySelectorAll('.period-btn-hrv');
    const metricButtons = document.querySelectorAll('.metric-btn-hrv');
    
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            hrvPeriod = parseInt(btn.dataset.period);
            updateHRVChart();
        });
    });
    
    metricButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            metricButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            hrvMetric = btn.dataset.metric;
            updateHRVChart();
        });
    });
    
    updateHRVChart();
}

function calculateHRVMetrics(activity) {
    if (!activity.average_heartrate || !activity.max_heartrate) {
        return null;
    }
    
    const avgHR = activity.average_heartrate;
    const maxHR = activity.max_heartrate;
    const hrRange = maxHR - avgHR;
    const stdDev = hrRange / 4;
    const variability = (stdDev / avgHR) * 100;
    
    return {
        variability: variability,
        stdDev: stdDev,
        range: hrRange
    };
}

function updateHRVChart() {
    const canvas = document.getElementById('hrvChart');
    if (!canvas) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - hrvPeriod);
    
    const periodActivities = filteredActivities.filter(a => {
        const actDate = a.start_date?.toDate ? a.start_date.toDate() : new Date(a.start_date);
        return actDate >= cutoffDate && a.average_heartrate && a.max_heartrate;
    });
    
    if (periodActivities.length === 0) {
        if (hrvChart) {
            hrvChart.destroy();
            hrvChart = null;
        }
        return;
    }
    
    periodActivities.sort((a, b) => {
        const dateA = a.start_date?.toDate ? a.start_date.toDate() : new Date(a.start_date);
        const dateB = b.start_date?.toDate ? b.start_date.toDate() : new Date(b.start_date);
        return dateA - dateB;
    });
    
    const labels = periodActivities.map(a => {
        const date = a.start_date?.toDate ? a.start_date.toDate() : new Date(a.start_date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const hrvData = periodActivities.map(a => calculateHRVMetrics(a));
    
    let metricData, metricLabel, metricUnit;
    
    switch (hrvMetric) {
        case 'variability':
            metricData = hrvData.map(d => d.variability);
            metricLabel = 'HR Variability Index';
            metricUnit = '%';
            break;
        case 'std-dev':
            metricData = hrvData.map(d => d.stdDev);
            metricLabel = 'HR Standard Deviation';
            metricUnit = ' bpm';
            break;
        case 'range':
            metricData = hrvData.map(d => d.range);
            metricLabel = 'HR Range';
            metricUnit = ' bpm';
            break;
    }
    
    const movingAvg = [];
    const window = Math.min(5, Math.floor(metricData.length / 2));
    for (let i = 0; i < metricData.length; i++) {
        const start = Math.max(0, i - window + 1);
        const subset = metricData.slice(start, i + 1);
        movingAvg.push(subset.reduce((a, b) => a + b, 0) / subset.length);
    }
    
    const data = {
        labels,
        datasets: [
            {
                label: metricLabel,
                data: metricData,
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.3
            },
            {
                label: `${window}-Activity Moving Avg`,
                data: movingAvg,
                borderColor: '#8B5CF6',
                backgroundColor: 'transparent',
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.4
            }
        ]
    };
    
    const config = {
        type: 'line',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { 
                        color: '#fff', 
                        font: { size: 14, weight: '600', family: 'system-ui, -apple-system, sans-serif' },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        boxHeight: 8
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}${metricUnit}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: metricLabel,
                        color: '#fff',
                        font: { size: 14, weight: '600' }
                    },
                    ticks: {
                        color: '#fff',
                        callback: value => value.toFixed(1) + metricUnit
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                        color: '#fff',
                        font: { size: 14, weight: '600' }
                    },
                    ticks: { color: '#fff', maxRotation: 45, minRotation: 45 },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    };
    
    if (hrvChart) {
        hrvChart.destroy();
    }
    hrvChart = new Chart(canvas, config);
}

// ========================================
// EFFORT BY ELEVATION CHART
// ========================================
function setupEffortChart() {
    const periodButtons = document.querySelectorAll('.period-btn-effort');
    const metricButtons = document.querySelectorAll('.effort-metric-btn');
    
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            effortPeriod = parseInt(btn.dataset.period);
            updateEffortChart();
        });
    });
    
    metricButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            metricButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            effortMetric = btn.dataset.metric;
            updateEffortChart();
        });
    });
    
    updateEffortChart();
}

function calculateEffortScore(activity) {
    if (!activity.total_elevation_gain || !activity.average_heartrate) {
        return null;
    }
    
    const elevationKm = activity.total_elevation_gain / 1000;
    const avgHR = activity.average_heartrate;
    const maxHR = 220 - 30;
    const hrPercent = (avgHR / maxHR) * 100;
    const effortScore = elevationKm * hrPercent;
    
    return effortScore;
}

function updateEffortChart() {
    const canvas = document.getElementById('effortChart');
    if (!canvas) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - effortPeriod);
    
    const periodActivities = filteredActivities.filter(a => {
        const actDate = a.start_date?.toDate ? a.start_date.toDate() : new Date(a.start_date);
        return actDate >= cutoffDate && 
               a.total_elevation_gain > 0 && 
               a.average_heartrate > 0;
    });
    
    if (periodActivities.length === 0) {
        if (effortChart) {
            effortChart.destroy();
            effortChart = null;
        }
        return;
    }
    
    const scatterData = periodActivities.map(a => {
        const elevation = a.total_elevation_gain;
        let yValue;
        
        switch (effortMetric) {
            case 'avg-hr':
                yValue = a.average_heartrate;
                break;
            case 'max-hr':
                yValue = a.max_heartrate || a.average_heartrate;
                break;
            case 'effort-score':
                yValue = calculateEffortScore(a);
                break;
        }
        
        return {
            x: elevation,
            y: yValue,
            activity: a
        };
    }).filter(d => d.y !== null);
    
    if (scatterData.length === 0) {
        if (effortChart) {
            effortChart.destroy();
            effortChart = null;
        }
        return;
    }
    
    let yAxisLabel, yAxisUnit;
    switch (effortMetric) {
        case 'avg-hr':
            yAxisLabel = 'Average Heart Rate';
            yAxisUnit = ' bpm';
            break;
        case 'max-hr':
            yAxisLabel = 'Maximum Heart Rate';
            yAxisUnit = ' bpm';
            break;
        case 'effort-score':
            yAxisLabel = 'Effort Score';
            yAxisUnit = '';
            break;
    }
    
    const maxY = Math.max(...scatterData.map(d => d.y));
    const colors = scatterData.map(d => {
        const intensity = d.y / maxY;
        if (intensity > 0.8) return 'rgba(239, 68, 68, 0.7)';
        if (intensity > 0.6) return 'rgba(251, 146, 60, 0.7)';
        if (intensity > 0.4) return 'rgba(252, 211, 77, 0.7)';
        return 'rgba(16, 185, 129, 0.7)';
    });
    
    const data = {
        datasets: [{
            label: `${yAxisLabel} vs Elevation`,
            data: scatterData,
            backgroundColor: colors,
            borderColor: colors.map(c => c.replace('0.7', '1')),
            borderWidth: 1,
            pointRadius: 7,
            pointHoverRadius: 9
        }]
    };
    
    const config = {
        type: 'scatter',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true,
                    position: 'top',
                    labels: { 
                        color: '#fff', 
                        font: { size: 14, weight: '600', family: 'system-ui, -apple-system, sans-serif' },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        boxHeight: 8,
                        generateLabels: function(chart) {
                            return [
                                {
                                    text: 'Activity Effort',
                                    fillStyle: '#FC4C02',
                                    strokeStyle: '#FC4C02',
                                    lineWidth: 2,
                                    hidden: false,
                                    pointStyle: 'circle'
                                },
                                {
                                    text: '🟢 Low  🟡 Medium  🟠 High  🔴 Very High',
                                    fillStyle: 'transparent',
                                    strokeStyle: 'transparent',
                                    lineWidth: 0,
                                    hidden: false,
                                    fontColor: '#999'
                                }
                            ];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        title: function(context) {
                            const activity = context[0].raw.activity;
                            return activity.name || 'Activity';
                        },
                        label: function(context) {
                            const labels = [
                                `Elevation: ${context.parsed.x.toFixed(0)}m`,
                                `${yAxisLabel}: ${context.parsed.y.toFixed(1)}${yAxisUnit}`
                            ];
                            const activity = context.raw.activity;
                            if (activity.distance) {
                                labels.push(`Distance: ${(activity.distance / 1000).toFixed(2)} km`);
                            }
                            return labels;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Total Elevation Gain (m)',
                        color: '#fff',
                        font: { size: 14, weight: '600' }
                    },
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel + (yAxisUnit ? ` (${yAxisUnit.trim()})` : ''),
                        color: '#fff',
                        font: { size: 14, weight: '600' }
                    },
                    ticks: {
                        color: '#fff',
                        callback: value => value.toFixed(0) + yAxisUnit
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    };
    
    if (effortChart) {
        effortChart.destroy();
    }
    effortChart = new Chart(canvas, config);
}
