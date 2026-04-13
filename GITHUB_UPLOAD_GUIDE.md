# GitHub Upload Guide - 2025 Carbon Counter Update

## Quick Upload Options

Since Git isn't installed on your system, here are 3 easy ways to push your updated carbon counter to GitHub:

### Option 1: GitHub Web Interface (Easiest)
1. Go to https://github.com/Moxi89/carbon-counter
2. Click "Add file" dropdown
3. Select "Upload files"
4. Drag and drop these updated files:
   - `static/js/script.js`
   - `static/index.html`
5. Add commit message: "Update to 2025 Global Carbon Budget data"
6. Click "Commit changes"

### Option 2: GitHub Desktop (Recommended)
1. Download GitHub Desktop from https://desktop.github.com/
2. Clone your repository: https://github.com/Moxi89/carbon-counter.git
3. Copy your updated `static` folder into the cloned repo
4. In GitHub Desktop, you'll see the changes
5. Add commit message: "Update to 2025 Global Carbon Budget data"
6. Click "Commit to main" then "Publish branch"

### Option 3: Install Git (Full Control)
1. Install Git from https://git-scm.com/download/win
2. Open Command Prompt/PowerShell
3. Run these commands:

```bash
cd C:\Users\OMISTAJA\CascadeProjects\carbon-counter-master
git init
git remote add origin https://github.com/Moxi89/carbon-counter.git
git add .
git commit -m "Update to 2025 Global Carbon Budget data"
git push -u origin main
```

## Files That Were Updated

### Core Changes Made:
1. **static/js/script.js** - Updated all emission constants and calculations
2. **static/index.html** - Updated all tooltips and data displays

### Specific Updates:
- Annual emissions: 41.6 Gt -> 42.2 Gt CO2 (2025)
- Carbon budget: 200 Gt -> 170 Gt remaining
- Emissions rate: 1,100 -> 1,338 tons/second
- Country percentages updated to 2025 estimates
- CO2 concentration: 422.5 -> 427.1 ppm
- All tooltips updated with 2025 Global Carbon Budget data
- Added critical status warnings for 1.5°C target

## Commit Message Suggestion
```
Update to 2025 Global Carbon Budget data

- Updated annual emissions to 42.2 Gt CO2 (38.1 fossil + 4.1 land-use)
- Revised carbon budget to 170 Gt remaining for 1.5°C (virtually exhausted)
- Updated country emissions percentages to 2025 estimates
- Increased emissions rate to 1,338 tons/second
- Updated CO2 concentration to 427.1 ppm
- Added critical climate warnings and timeline updates
- Based on Global Carbon Project 2025 report (COP30)
```

## After Upload
Once pushed, your website will automatically deploy to Cloudflare Pages (if configured) with the latest 2025 climate data!
