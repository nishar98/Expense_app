# Personal Expense Management Web App

A minimal, fast, dark-themed expense tracking app designed for daily use.

---

## How to Run Locally

### Method 1: Simple Double-Click (Basic)

1. Open the `expense-app` folder on your computer
2. Double-click `index.html`
3. The app opens in your browser
4. You can start adding expenses immediately

**Note:** With this method, the PWA install feature won't work. But expense tracking will work perfectly.

### Method 2: Using a Local Server (Recommended for full PWA features)

This method enables offline support and the "Install App" feature.

**Step 1:** Open Command Prompt or Terminal

- Windows: Press `Win + R`, type `cmd`, press Enter
- Mac: Open Terminal from Applications

**Step 2:** Navigate to the expense-app folder

```
cd "C:\Users\Nishara\Desktop\Dashboard & Management\expense-app"
```

**Step 3:** Start a simple server (pick one that works for you)

If you have Python installed:
```
python -m http.server 8000
```

If you have Node.js installed:
```
npx serve .
```

**Step 4:** Open your browser and go to:
```
http://localhost:8000
```

---

## How to Install on Android

1. Open the app in Chrome on your phone (using Method 2 URL or after hosting)
2. Tap the three dots menu (⋮) in the top right
3. Tap "Add to Home Screen" or "Install App"
4. The app will appear on your home screen like a regular app

---

## How to Install on iPhone

1. Open the app in Safari on your phone
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. The app will appear on your home screen

---

## How to Export Data

1. Open the app
2. Tap "Export" in the navigation
3. Choose "Export as CSV" or "Export as Markdown"
4. The file downloads automatically

**CSV** — For importing into your Personal CFO Dashboard  
**Markdown** — For pasting into ChatGPT for analysis

---

## How to Host (Free)

When you're ready to access the app from anywhere:

### Option 1: GitHub Pages (Free)

1. Create a GitHub account
2. Create a new repository
3. Upload all files from the `expense-app` folder
4. Go to Settings → Pages → Select "main" branch
5. Your app will be live at `https://yourusername.github.io/repo-name`

### Option 2: Netlify (Free)

1. Go to netlify.com
2. Drag and drop the `expense-app` folder
3. Your app is live instantly

---

## File Structure

```
expense-app/
├── index.html       ← Main page (entry, history, export)
├── styles.css       ← All styling (dark theme)
├── script.js        ← All logic (storage, export)
├── sw.js            ← Service worker (offline support)
├── manifest.json    ← PWA configuration
├── icons/
│   ├── icon-192.svg ← App icon (small)
│   └── icon-512.svg ← App icon (large)
└── README.md        ← This file
```

---

## Data Storage

- All data is stored in your browser's **localStorage**
- Data stays on YOUR device — nothing is sent anywhere
- If you clear browser data, expenses will be lost
- Export regularly to keep backups

---

## Version

v1.0.0 — Initial Release
