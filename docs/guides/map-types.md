# Map Type Options 🗺️

## Available Map Layers

The heatmap now supports 6 different map styles, accessible via the layer control in the top-right corner of the map.

### 1. 🗺️ Street Map (Default)
- **Source**: OpenStreetMap
- **Best for**: General navigation, urban areas
- **Max Zoom**: 19
- **Features**: Streets, buildings, labels
- **Use case**: Standard view for most activities

### 2. 🌄 Terrain
- **Source**: OpenTopoMap
- **Best for**: Hiking, trail running, elevation viewing
- **Max Zoom**: 17
- **Features**: Topographic lines, elevation shading, trails
- **Use case**: Mountain activities, understanding elevation

### 3. 🛰️ Satellite
- **Source**: Esri World Imagery
- **Best for**: Seeing actual terrain, trails, nature
- **Max Zoom**: 18
- **Features**: Aerial photography
- **Use case**: Identifying actual route paths, nature exploration

### 4. 🌙 Dark Mode
- **Source**: CartoDB Dark
- **Best for**: Night viewing, reducing eye strain
- **Max Zoom**: 19
- **Features**: Dark background, bright routes
- **Use case**: Evening use, presentations, screenshots

### 5. 🎨 Watercolor
- **Source**: Stamen Watercolor
- **Best for**: Artistic visualization, presentations
- **Max Zoom**: 16
- **Features**: Hand-painted style, artistic rendering
- **Use case**: Beautiful visualizations, social media sharing

### 6. 🚴 Cycling
- **Source**: CyclOSM
- **Best for**: Cycling routes, bike infrastructure
- **Max Zoom**: 18
- **Features**: Bike lanes, cycling routes, bike shops
- **Use case**: Planning cycling routes, seeing bike infrastructure

## How to Use

### Desktop
1. Look for the **layer control box** in the top-right corner
2. Click on any map type to switch
3. Control stays open for easy switching

### Mobile
1. Tap the **layer icon** in top-right
2. Select your preferred map type
3. Control collapses after selection

## Recommendations by Activity Type

| Activity | Recommended Map |
|----------|----------------|
| **Running** | Street Map or Dark Mode |
| **Cycling** | Cycling or Street Map |
| **Hiking** | Terrain or Satellite |
| **Trail Running** | Terrain or Satellite |
| **Walking** | Street Map |
| **Presentations** | Dark Mode or Watercolor |

## Recommendations by View Mode

| View Mode | Best Map Types |
|-----------|---------------|
| **Heatmap** | Dark Mode, Street Map |
| **All Routes** | Dark Mode, Terrain, Street Map |

### Why?
- **Dark Mode**: Routes pop more against dark background
- **Terrain**: Shows where you train (flat vs hills)
- **Street Map**: Best for urban route details

## Performance Notes

- All map tiles load on-demand (zoom/pan)
- Switching maps is instant (no reload needed)
- Tiles are cached by browser
- No performance impact on route rendering

## Tips

### Best Combinations

1. **For Route Visibility**:
   - Use Dark Mode or Satellite
   - Routes contrast better

2. **For Training Analysis**:
   - Use Terrain
   - See elevation patterns

3. **For Sharing**:
   - Use Watercolor or Dark Mode
   - Most visually appealing

4. **For Planning**:
   - Use Cycling or Street Map
   - See infrastructure details

### Zoom Limitations

- **Watercolor**: Limited to zoom 16 (less detail)
- **Terrain**: Limited to zoom 17
- **Others**: Up to zoom 18-19 (very detailed)

## Technical Details

### Map Providers
- **OpenStreetMap**: Free, community-driven
- **OpenTopoMap**: Free, topographic
- **Esri**: Free for non-commercial use
- **CartoDB**: Free tier
- **Stamen**: Free with attribution
- **CyclOSM**: Free, cycling-focused

### Attribution
All maps show proper attribution in bottom-right corner as required by providers.

### Privacy
- Map tiles load from public servers
- No personal data sent to map providers
- Only coordinates of viewed area are requested

## Future Enhancements

Possible additions:
- Custom map styles
- Satellite hybrid (satellite + labels)
- Historical maps
- Weather overlay
- Traffic layer
- Save preferred map choice
