# 💪 Performance Management Chart (Fitness-Fatigue Model)

## Overview
The Performance Management Chart (PMC) is a scientifically-backed tool used by athletes and coaches worldwide to track training load, fitness, fatigue, and form. It helps you optimize your training by showing when you're ready to perform at your best and when you need rest.

## What is the PMC?

The PMC is based on the **Fitness-Fatigue model**, which uses three key metrics:

### 1. **Fitness (CTL - Chronic Training Load)**
- **What it is**: Your long-term fitness level
- **Calculation**: 42-day exponentially weighted moving average of daily TSS
- **What it means**: 
  - Higher CTL = Better fitness and endurance
  - Represents your body's adaptation to training over time
  - Takes weeks to build, and weeks to lose
- **Color**: Blue line

### 2. **Fatigue (ATL - Acute Training Load)**
- **What it is**: Your short-term fatigue level
- **Calculation**: 7-day exponentially weighted moving average of daily TSS
- **What it means**: 
  - Higher ATL = More current fatigue
  - Represents recent training stress
  - Rises quickly with hard training, drops quickly with rest
- **Color**: Red line

### 3. **Form (TSB - Training Stress Balance)**
- **What it is**: Your current readiness to perform
- **Calculation**: CTL - ATL (Fitness minus Fatigue)
- **What it means**:
  - Positive TSB = Fresh and ready to perform
  - Negative TSB = Fatigued, in training block
  - Zero TSB = Balanced state
- **Color**: Green line (shaded area)

## Training Stress Score (TSS)

TSS quantifies the training load of each activity:

### How TSS is Calculated

The app calculates TSS based on:
1. **Duration** - Longer activities = higher TSS
2. **Intensity** - Estimated from:
   - Heart rate data (if available)
   - Pace/speed relative to activity type
   - Sport type multipliers
3. **Sport-specific factors**:
   - Running: 1.0x (baseline)
   - Cycling: 1.0x
   - Swimming: 1.1x (higher effort)
   - Hiking: 0.7x
   - Walking: 0.5x
   - Yoga: 0.4x

### TSS Examples
- **Easy 1-hour ride**: ~40-50 TSS
- **Moderate 1-hour run**: ~60-70 TSS
- **Hard 2-hour ride**: ~150-180 TSS
- **Race effort**: ~100+ TSS per hour

## Interpreting Your Form (TSB)

### 🎯 Peak Form (+25 or higher)
- **What it means**: You're well-rested and ready for peak performance
- **Best for**: Races, time trials, max effort events
- **Action**: Time your taper to hit this zone for important events

### ✨ Good Form (+10 to +25)
- **What it means**: Fresh and strong, above baseline
- **Best for**: Hard workouts, tempo runs, threshold efforts
- **Action**: Great time for quality training

### 💪 Productive Training Zone (-10 to +10)
- **What it means**: Balanced state - building fitness
- **Best for**: Consistent training, building volume
- **Action**: Most of your training happens here

### ⚠️ Accumulating Fatigue (-10 to -30)
- **What it means**: Training hard, fitness building but tired
- **Best for**: Training blocks, base building periods
- **Action**: Monitor recovery, listen to your body

### 🚨 High Risk of Overtraining (-30 or lower)
- **What it means**: Very fatigued, high injury/illness risk
- **Best for**: Nothing - you need rest!
- **Action**: Take recovery days, reduce training load

## Using the PMC Effectively

### 1. **Training Blocks**
Push your TSB negative (-10 to -20) during training blocks to build fitness, then taper to positive TSB for events.

**Example:**
```
Week 1-3: Build CTL with consistent training (TSB: -15)
Week 4: Recovery week (TSB rises to -5)
Week 5-7: Another training block (TSB: -20)
Week 8: Taper week (TSB rises to +15)
Week 9: Race week (TSB: +20-25) 🏆
```

### 2. **Avoiding Overtraining**
- Don't let TSB drop below -30 for extended periods
- If TSB is very negative, take rest days
- Increase CTL gradually (5-10 points per week max)

### 3. **Building Fitness Safely**
- **Ramp Rate**: CTL should increase by 5-8 points per week
- Too fast = injury risk
- Too slow = minimal fitness gains

### 4. **Tapering for Events**
- Reduce training volume 1-2 weeks before events
- Watch TSB rise into positive territory
- Peak performance typically at TSB +15 to +25

## Time Ranges

The PMC offers three viewing periods:

### 3 Months (Default)
- **Best for**: Short-term training cycles, race preparation
- **Shows**: Recent training trends and current form

### 6 Months
- **Best for**: Seasonal analysis, identifying patterns
- **Shows**: Fitness progression over multiple training blocks

### 1 Year
- **Best for**: Annual planning, long-term trends
- **Shows**: Complete training year, seasonality patterns

## Sport-Specific Notes

### Running
- TSS multiplier: 1.0x
- High impact = careful with high TSS
- Watch for rapid CTL increases

### Cycling
- TSS multiplier: 1.0x
- Can handle higher volume than running
- Indoor cycling = same TSS calculation

### Walking/Hiking
- Lower TSS (0.5x - 0.7x)
- Still contributes to CTL
- Good for active recovery

## Scientific Background

The PMC is based on research by:
- **Banister's Fitness-Fatigue model** (1975)
- **Training Stress Score** - Dr. Andrew Coggan
- Used by professional athletes and coaches worldwide

### Key Principles:
1. **Fitness accumulates slowly** (42-day average)
2. **Fatigue accumulates quickly** (7-day average)
3. **Performance = Fitness - Fatigue**
4. **Adaptation requires stress + recovery**

## Tips for Best Results

### 1. **Consistency is Key**
- Regular training builds stable CTL
- Sporadic training = volatile PMC metrics

### 2. **Record All Activities**
- Include recovery activities
- Even easy days affect your metrics

### 3. **Use Heart Rate Data**
- More accurate TSS calculations
- Better intensity estimation

### 4. **Listen to Your Body**
- PMC is a guide, not absolute truth
- Your personal feel matters
- Adjust based on life stress, sleep, nutrition

### 5. **Plan Your Season**
- Use PMC for macro planning
- Build CTL in base periods
- Taper for key events
- Include recovery blocks

## Common Patterns

### Building Fitness
```
CTL: Steadily rising ↗️
ATL: Fluctuating with weekly volume
TSB: Slightly negative (-10 to -20)
```

### Tapering for Race
```
CTL: Slightly declining or stable →
ATL: Dropping rapidly ↘️
TSB: Rising to positive ↗️
```

### Overreaching
```
CTL: Rising rapidly ↗️↗️
ATL: Very high
TSB: Very negative (< -30) 🚨
```

### Detraining
```
CTL: Dropping rapidly ↘️
ATL: Low
TSB: High positive (but not good!)
```

## Frequently Asked Questions

**Q: What's a good CTL target?**
A: Depends on your sport and level. Recreational: 40-60, Competitive: 80-120, Elite: 120+

**Q: Can TSB be too positive?**
A: Yes! Very high TSB (+40+) means loss of fitness. You want positive TSB only for short taper periods.

**Q: How long should I stay in negative TSB?**
A: 2-4 weeks max, then take a recovery week. Don't go below -30.

**Q: Why is my CTL dropping during recovery?**
A: Normal! CTL drops ~1-2 points per day of rest. That's why it takes time to build fitness.

**Q: Should I train every day?**
A: No! Rest days are when adaptation happens. Your ATL drops on rest days, preparing you for the next hard workout.

## Resources

For more information on PMC:
- TrainingPeaks University
- "Training and Racing with a Power Meter" by Hunter Allen & Andrew Coggan
- British Cycling Coach Resources
- Sports Science research on Fitness-Fatigue modeling

---

**Remember**: The PMC is a powerful tool when used correctly. It helps you train smarter, not just harder. Use it to balance fitness gains with recovery, peak for important events, and avoid overtraining.

🎯 Train smart, recover well, perform at your best!
