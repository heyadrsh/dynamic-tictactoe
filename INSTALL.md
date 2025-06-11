# ShiftTac Installation Guide

## Quick Start (No Setup Required)

1. **Download/Clone** the repository
2. **Open** `index.html` in any modern browser (Chrome, Firefox, Safari, Edge)
3. **Enter API Key** when prompted, or skip to use basic AI

That's it! No server or installation required.

## For Enhanced AI Experience

### Step 1: Get a Google Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key
5. Copy the key (it starts with `AIza...`)

### Step 2: Enter API Key in Game

1. Open the game in your browser
2. A modal will appear asking for your API key
3. Paste your API key and click "Save & Enable AI"
4. The AI status will show "Gemini AI Ready" 

### Step 3: Play!

The AI now understands:
- ✅ ShiftTac rules (3 marks max, oldest fades)
- ✅ Strategic positioning 
- ✅ Blocking and winning moves
- ✅ Fading mark timing

## Development Setup (Optional)

If you want to run a local development server:

```bash
# Install Node.js dependencies
npm install

# Start development server on localhost:3000
npm run dev
```

## Troubleshooting

### "AI Error - Using Fallback"
- Check your API key is correct
- Ensure you have internet connection
- Try refreshing the page

### "Using Fallback AI" 
- This is normal if you skipped entering an API key
- The basic AI still plays strategically
- You can add your API key later by refreshing the page

### Game Won't Load
- Ensure you're using a modern browser
- Check browser console for errors (F12 → Console)
- Try disabling browser extensions

## Privacy & Security

- ✅ API key stored locally in your browser only
- ✅ No data sent to any servers except Google's official Gemini API
- ✅ Game state and scores stored locally
- ✅ No tracking or analytics

## API Key Management

- **Stored:** Locally in browser localStorage
- **Used for:** Communicating with Google Gemini API only
- **Remove:** Refresh page and click "Skip" to remove stored key
- **Change:** Refresh page to enter a new key

---

**Need help?** Check the [README.md](./README.md) for game rules and features. 