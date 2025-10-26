# GitHub Pages Deployment Guide

## 🚀 Deploy Your Recipe Website to GitHub Pages

This guide will help you deploy your recipe collection website to GitHub Pages for free hosting.

### Prerequisites
- A GitHub account
- Git installed on your computer
- Your recipe website files

### Step 1: Create a GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. **Click the "+" icon** in the top right corner and select "New repository"
3. **Repository settings:**
   - Repository name: `recipe-collection` (or any name you prefer)
   - Description: `My personal recipe collection website`
   - Set to **Public** (required for free GitHub Pages)
   - **Don't** initialize with README, .gitignore, or license (we already have files)
4. **Click "Create repository"**

### Step 2: Upload Your Files to GitHub

#### Option A: Using GitHub Web Interface (Easiest)

1. **Go to your new repository** on GitHub
2. **Click "uploading an existing file"** link
3. **Drag and drop** all your files (`index.html`, `styles.css`, `script.js`, `README.md`, `package.json`)
4. **Add commit message:** "Initial commit - Recipe collection website"
5. **Click "Commit changes"**

#### Option B: Using Git Command Line

1. **Open terminal/command prompt** in your recipe-website folder
2. **Initialize git repository:**
   ```bash
   git init
   ```
3. **Add all files:**
   ```bash
   git add .
   ```
4. **Make initial commit:**
   ```bash
   git commit -m "Initial commit - Recipe collection website"
   ```
5. **Add GitHub repository as remote:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/recipe-collection.git
   ```
6. **Push to GitHub:**
   ```bash
   git push -u origin main
   ```

### Step 3: Enable GitHub Pages

1. **Go to your repository** on GitHub
2. **Click "Settings"** tab (at the top of the repository)
3. **Scroll down to "Pages"** section in the left sidebar
4. **Under "Source":**
   - Select **"Deploy from a branch"**
   - Branch: **"main"** (or "master")
   - Folder: **"/ (root)"**
5. **Click "Save"**

### Step 4: Access Your Live Website

1. **Wait 2-5 minutes** for GitHub Pages to build your site
2. **Your website will be available at:**
   ```
   https://YOUR_USERNAME.github.io/recipe-collection
   ```
3. **You can find the exact URL** in the Pages settings section

### Step 5: Custom Domain (Optional)

If you have a custom domain:

1. **Add a file named `CNAME`** to your repository root
2. **Put your domain name** in the file (e.g., `myrecipes.com`)
3. **Configure DNS** with your domain provider:
   - Add a CNAME record pointing to `YOUR_USERNAME.github.io`
4. **Update GitHub Pages settings** to use your custom domain

## 🔄 Updating Your Website

### Method 1: GitHub Web Interface
1. **Edit files directly** on GitHub
2. **Commit changes** with a descriptive message
3. **Changes go live** automatically within minutes

### Method 2: Local Development
1. **Make changes** to your local files
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Updated recipe features"
   git push
   ```

## 📁 File Structure for GitHub Pages

Your repository should look like this:
```
recipe-collection/
├── index.html          # Main page (required)
├── styles.css          # Styling
├── script.js           # JavaScript functionality
├── README.md           # Documentation
├── package.json        # Project metadata
└── CNAME               # Custom domain (optional)
```

## 🔒 Data Persistence Strategy

Since GitHub Pages only serves static files, your recipes are stored using:

### Browser Storage (Primary)
- **localStorage**: Recipes saved in user's browser
- **Persistent**: Survives browser restarts
- **Private**: Only accessible to the user

### File Export/Import (Backup)
- **Export**: Download recipes as JSON files
- **Import**: Upload previously exported files
- **Backup**: Create full collection backups
- **Sharing**: Share individual recipes or entire collections

### Usage Workflow
1. **Add recipes** using the web interface
2. **Export regularly** to create backups
3. **Import** when switching devices or browsers
4. **Share recipes** by exporting and sending files

## 🛠️ Advanced Features

### Automatic Backups
Consider setting up:
- **Regular exports** to cloud storage (Google Drive, Dropbox)
- **Browser extensions** for automatic backups
- **Scheduled downloads** using browser automation

### Recipe Sharing
- **Individual recipes**: Export single recipe files
- **Full collections**: Export complete backup files
- **Social sharing**: Copy recipe URLs or export files

## 🚨 Important Notes

### Limitations
- **No server-side processing**: All functionality is client-side
- **Browser dependency**: Requires JavaScript-enabled browser
- **Storage limits**: localStorage has size limits (~5-10MB)
- **No user accounts**: No login system (by design for simplicity)

### Best Practices
- **Regular backups**: Export your recipes frequently
- **Multiple devices**: Import recipes on each device you use
- **File organization**: Keep exported files organized by date
- **Version control**: Use descriptive filenames for exports

## 🆘 Troubleshooting

### Common Issues

**Website not loading:**
- Check repository is public
- Verify GitHub Pages is enabled
- Wait 5-10 minutes for initial deployment

**Changes not appearing:**
- Clear browser cache
- Check if commit was successful
- Wait 2-5 minutes for GitHub Pages to update

**Import/Export not working:**
- Check browser supports File API
- Verify file format is JSON
- Try different browser

**Recipes not saving:**
- Check browser allows localStorage
- Clear browser data and try again
- Use incognito/private mode to test

### Getting Help
- **GitHub Pages Documentation**: https://docs.github.com/en/pages
- **GitHub Community**: https://github.community/
- **Stack Overflow**: Search for "GitHub Pages" issues

## 🎉 Success!

Once deployed, you'll have:
- ✅ **Free hosting** on GitHub Pages
- ✅ **Custom URL** for your recipe collection
- ✅ **File-based backups** for data persistence
- ✅ **Easy updates** through GitHub
- ✅ **Version control** for your website
- ✅ **Professional URL** to share with others

Your recipe collection is now live and accessible from anywhere! 🍳👨‍🍳👩‍🍳
