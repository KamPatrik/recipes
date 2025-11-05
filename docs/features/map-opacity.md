# Map Opacity Control Feature 🎨

## Overview
Added an opacity slider to control the visibility of the background map, allowing you to tune down the map and make your activity routes stand out more prominently.

## Location
**Bottom-right corner** of the map (floating control panel)

## How to Use

### Adjust Map Visibility
1. Locate the **"🎨 Map Visibility"** control at bottom-right
2. **Drag the slider** left or right
3. Watch the map fade in real-time
4. Percentage displays current visibility (0-100%)

### Slider Values
- **100%** - Full visibility (default)
- **75%** - Slightly faded
- **50%** - Half faded (great for route focus)
- **25%** - Very faded (routes dominant)
- **0%** - Completely invisible (routes only!)

## Use Cases

### 1. **Focus on Routes** (50% opacity)
- Dim the background map
- Make your activity routes the star
- Best for: Route analysis

### 2. **Screenshot/Presentation** (30-50% opacity)
- Clean, professional look
- Routes pop beautifully
- Best for: Sharing, presentations

### 3. **Pattern Recognition** (70% opacity)
- Slightly fade map
- Still see street names
- Best for: Understanding route context

### 4. **Pure Routes** (0% opacity)
- Completely hide map
- Only routes visible
- Best for: Artistic visualization

## Best Combinations

### For Maximum Route Visibility
1. **Dark Mode** map + **50% opacity**
   - Routes really pop!
   - Great contrast

2. **Satellite** map + **70% opacity**
   - See terrain but routes dominant
   - Natural background

3. **Any map** + **25% opacity**
   - Routes are focal point
   - Map provides minimal context

### By View Type

#### Heatmap View
- **Recommended**: 75-100% opacity
- Heat gradient needs map context
- Lower opacity makes heatmap harder to interpret

#### All Routes View
- **Recommended**: 30-70% opacity
- Routes benefit from faded background
- Sweet spot: 50% opacity

## Technical Details

### How It Works
```javascript
// Adjusts opacity of active tile layer
layer.setOpacity(value / 100);
```

### Features
- **Real-time**: Changes instantly as you drag
- **Persists**: Opacity maintained when switching map types
- **Smooth**: 1% increments for fine control
- **Responsive**: Works on mobile and desktop

### Performance
- Zero performance impact
- CSS opacity is hardware-accelerated
- No effect on route rendering

## Keyboard Accessibility
- Can be controlled with keyboard
- Arrow keys adjust value
- Tab to focus slider

## Mobile Experience
- Full-width at bottom of screen
- Easy touch control
- Same functionality as desktop

## Tips

### Finding the Right Balance
1. Start at 100%
2. Slowly decrease until routes look good
3. Different maps need different opacity

### Save Your Preferences
Currently, opacity resets on page reload. Recommended values:
- **Street Map**: 60-70%
- **Dark Mode**: 70-80%
- **Satellite**: 50-60%
- **Terrain**: 60-70%
- **Watercolor**: 80-90% (already artistic)
- **Cycling**: 60-70%

### For Different Activities
- **Dense urban routes**: Lower opacity (40-60%)
- **Sparse rural routes**: Higher opacity (70-90%)
- **Overlapping routes**: Lower opacity (30-50%)

## Comparison

### Before (100% opacity)
- Map fully visible
- Routes blend with background
- Hard to distinguish overlapping routes

### After (50% opacity)
- Map faded to background
- Routes prominent
- Easy to see patterns

### After (0% opacity)
- No map visible
- Only routes showing
- Pure route visualization

## Common Questions

**Q: Does this affect performance?**
A: No, it's just a CSS transparency effect.

**Q: Can I save my preferred opacity?**
A: Not yet, but it's planned for future update.

**Q: Does it work in heatmap view?**
A: Yes, but heatmap looks best at higher opacity (75-100%).

**Q: Can I make routes transparent too?**
A: No, only the background map can be adjusted.

**Q: What's the best opacity?**
A: 50-60% is the sweet spot for most use cases.

## Future Enhancements

Planned improvements:
- Save opacity preference (localStorage)
- Separate opacity for routes/heatmap
- Presets (Focus Mode, Balanced, Context Mode)
- Route opacity control
- Grayscale filter option
- Contrast boost option

## Visual Examples

### Use Case Scenarios

**Presentation Mode**: 40% opacity
- Professional look
- Clean visualization
- Routes are focal point

**Analysis Mode**: 70% opacity
- Can read street names
- Routes clearly visible
- Best balance

**Artistic Mode**: 20% opacity + Watercolor map
- Beautiful visualization
- Great for social media
- Eye-catching

## Summary

The map opacity control gives you fine-grained control over background visibility, allowing you to highlight your routes exactly how you want. Experiment with different combinations of map types and opacity levels to find what works best for your use case!
