# Quick Start Guide

## The Problem You Had

You saw a directory listing because the server was running from the wrong directory (your home directory instead of the ReActure folder).

## Solution - Run Server from Correct Directory

**IMPORTANT:** You must navigate to the ReActure folder first!

### Step 1: Open Terminal

### Step 2: Navigate to the ReActure folder
```bash
cd ~/Desktop/ReActure/ReActure
```

### Step 3: Start the server
```bash
python3 -m http.server 8000
```

### Step 4: Open in Browser
Open your browser and go to:
```
http://localhost:8000
```

You should now see the beautiful start screen with the ReActure title!

## Alternative: Using Node.js

If you have Node.js installed:
```bash
cd ~/Desktop/ReActure/ReActure
npx http-server -p 8000
```

## What You'll See

1. **Start Screen**: Beautiful welcome screen with mission briefing
2. **Click "Start Mission"**: Game begins
3. **Click to Lock Mouse**: Click anywhere to lock your mouse pointer for first-person control
4. **Play!**: Use WASD to move, mouse to look, Space to destroy rubble

## Troubleshooting

- **Still seeing directory listing?** Make sure you're in the `ReActure/ReActure` folder (check with `pwd`)
- **Game not loading?** Check browser console (F12) for errors
- **Controls not working?** Make sure you clicked to lock the mouse pointer

