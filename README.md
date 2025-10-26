# My Recipe Collection

A beautiful, modern web application for storing and organizing your cooking recipes. Built with vanilla HTML, CSS, and JavaScript.

## Features

- 📝 **Add New Recipes**: Complete form with ingredients, instructions, prep/cook times, and servings
- 🔍 **Search & Filter**: Find recipes by name, description, or filter by cooking time
- 👀 **View Recipes**: Click on any recipe card to see full details in a modal
- 💾 **Dual Storage**: Local browser storage + file-based backup system
- 📁 **Export/Import**: Save recipes as JSON files for backup and sharing
- 🔄 **Data Management**: Export all recipes, import from files, clear data
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- 🌐 **GitHub Pages Ready**: Perfect for free hosting on GitHub Pages

## Getting Started

1. **Open the Website**: Simply open `index.html` in your web browser
2. **Add Your First Recipe**: Use the form at the top to add a new recipe
3. **View Recipes**: Click on any recipe card to see the full recipe details
4. **Search**: Use the search bar to find specific recipes
5. **Filter**: Use the dropdown to filter recipes by cooking time

## File Structure

```
recipe-website/
├── index.html          # Main HTML file
├── styles.css          # All CSS styling
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## How to Use

### Adding a Recipe
1. Fill in the recipe name (required)
2. Add a description (optional)
3. Set prep time, cook time, and servings
4. Add ingredients - click "Add Ingredient" to add more
5. Add cooking instructions - click "Add Step" to add more
6. Optionally add an image URL
7. Click "Save Recipe"

### Viewing Recipes
- **Recipe Cards**: See a preview of each recipe with key information
- **Full Recipe**: Click on any recipe card to see complete details
- **Search**: Type in the search bar to find recipes by name or ingredients
- **Filter**: Use the dropdown to filter by cooking time (Quick/Medium/Long)

### Managing Recipes
- **View**: Click on any recipe card to see full details
- **Export**: Click "Export" button to download individual recipe as JSON file
- **Delete**: Click the "Delete" button on any recipe card
- **Edit**: Currently, you need to delete and re-add to edit (feature can be added)

### Data Management
- **Export All**: Download complete recipe collection as backup file
- **Import Recipes**: Upload previously exported JSON files
- **Clear All Data**: Remove all recipes (with confirmation)
- **File Format**: All exports use JSON format for easy sharing and backup

## Sample Recipes

The app comes with two sample recipes to get you started:
- Classic Spaghetti Carbonara
- Chocolate Chip Cookies

## Technical Details

- **Storage**: Dual storage system - localStorage + file-based backup
- **File Format**: JSON exports with version control and metadata
- **Responsive**: Mobile-first design with breakpoints at 768px and 480px
- **Icons**: Uses Font Awesome for beautiful icons
- **Fonts**: Uses Google Fonts (Poppins) for modern typography
- **No Dependencies**: Pure vanilla JavaScript - no frameworks required
- **GitHub Pages**: Optimized for static hosting on GitHub Pages

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Customization

You can easily customize the website by editing the CSS file:

- **Colors**: Change the gradient colors in the CSS variables
- **Fonts**: Modify the font family in the CSS
- **Layout**: Adjust grid layouts and spacing
- **Animations**: Modify or disable animations

## Future Enhancements

Potential features that could be added:
- Recipe editing functionality
- Recipe categories/tags
- Export recipes to PDF
- Recipe sharing via URL
- Recipe rating system
- Nutritional information
- Recipe scaling (adjust servings)

## Deployment

### GitHub Pages (Recommended)
This website is optimized for GitHub Pages hosting. See `DEPLOYMENT.md` for detailed instructions.

**Quick Steps:**
1. Create a public GitHub repository
2. Upload all files to the repository
3. Enable GitHub Pages in repository settings
4. Your site will be live at `https://YOUR_USERNAME.github.io/REPOSITORY_NAME`

### Local Development
- Simply open `index.html` in your browser
- No server required for development
- All features work offline after initial load

## Data Persistence

### Browser Storage
- **Primary storage**: localStorage in your browser
- **Automatic saving**: Recipes saved immediately when added
- **Cross-session**: Data persists between browser sessions

### File-Based Backup
- **Export individual recipes**: Download single recipe as JSON
- **Export all recipes**: Create complete backup file
- **Import recipes**: Restore from previously exported files
- **File sharing**: Share recipes by sending JSON files
- **Version control**: Export files include metadata and timestamps

### Backup Strategy
1. **Regular exports**: Export all recipes weekly/monthly
2. **Cloud storage**: Save exported files to Google Drive, Dropbox, etc.
3. **Multiple devices**: Import recipes on each device you use
4. **Version naming**: Use descriptive filenames with dates

## Support

This is a simple, self-contained web application with robust data management:
- **No internet required** after initial load
- **No server needed** - pure client-side application
- **No data sent** to external services
- **Your recipes stay private** on your device
- **File-based backups** ensure data safety
- **GitHub Pages hosting** provides free, reliable hosting

Enjoy cooking and organizing your recipes! 🍳👨‍🍳👩‍🍳
