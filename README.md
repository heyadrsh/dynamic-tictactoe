# ShiftTac - Never DRAW A GAME

A unique twist on classic Tic Tac Toe with a learning AI and limited marks per player.

![ShiftTac Icon](favicon/android-chrome-192x192.png)

## Play Online

**[Play the game here](https://heyadrsh.github.io/dynamic-tictactoe/)**

## Game Rules

- Each player can only have 3 marks on the board
- Placing a 4th mark removes your oldest mark
- Connect 3 in a row to win
- Pulsing marks show which one will disappear next

## Features

- **Google Gemini 2.0 Flash Lite AI:** Real AI opponent powered by Google's latest Gemini 2.0 Flash Lite model
- **Intelligent Gameplay:** AI understands the unique ShiftTac rules and fading mechanics
- **Fallback AI:** Works without API key using basic strategic AI
- **Environment Variable Support:** Secure API key management via Vercel environment variables
- **Score tracking:** Keeps track of your wins and losses
- **Human vs Human mode:** Play against a friend
- **Minimalist design:** Clean black and white interface
- **Real-time AI thinking panel:** See how the AI analyzes moves and makes decisions

## How to Play

1. Click any cell to place your X
2. Each player gets only 3 marks at a time
3. Win by connecting 3 marks in a row

## Controls

- **Top-right toggle:** Switch between AI and Human opponent
- **Bottom center:** Click restart icon after a game ends
- **Bottom right:** View and reset scores (hold to reset)
- **Bottom left:** Game info and rules

## Setup & Installation

### 🚀 Deploy to Vercel (Recommended)
1. Fork this repository to your GitHub account
2. Go to [vercel.com/new](https://vercel.com/new) and import your fork
3. Add environment variable `GEMINI_API_KEY` with your API key
4. Deploy! See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions

### Quick Start (Browser)
1. Clone or download this repository
2. Open `index.html` in any modern browser
3. Enter your Gemini API key when prompted, or skip to use basic AI

### Development Setup
```bash
# Install dependencies
npm install

# For local development with environment variables
npm run build
npx http-server dist -p 3000

# For simple development
npm run dev
```

### Getting a Gemini API Key
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Create a new API key
4. For Vercel deployment: Add as `GEMINI_API_KEY` environment variable
5. For local play: Enter when prompted in the game

**Note:** API keys are stored securely via Vercel environment variables (encrypted at rest) or locally in your browser. Keys are never sent anywhere except to Google's official Gemini API.

## Technical

- **Frontend:** Vanilla HTML, CSS, and JavaScript
- **AI Integration:** Google Gemini 2.0 Flash Lite API via direct fetch calls
- **Dependencies:** Zero external dependencies - pure vanilla JS
- **Storage:** localStorage for game state, scores, and API key
- **Deployment:** Vercel-ready with environment variable support
- **Build System:** Custom build script for secure API key injection 
