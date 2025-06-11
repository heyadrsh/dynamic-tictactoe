// ShiftTac - Dynamic Tic Tac Toe with Google Gemini AI

// Game State
const state = {
    playerMode: localStorage.getItem('ticTacToePlayerMode') || 'ai', // 'ai' or 'human'
    currentPlayer: 'x', // 'x' or 'o'
    board: Array(9).fill(''),
    xMoves: [], // Track X's moves for the limited marking feature
    oMoves: [], // Track O's moves for the limited marking feature
    gameOver: false,
    winner: null,
    moveHistory: [], // Track all moves for AI context
    gameCount: 0, // Track number of games played
    scores: {
        ai: {
            player: 0, // Human player (X) in AI mode
            ai: 0      // AI player (O) in AI mode
        },
        human: {
            x: 0,      // X player in Human mode
            o: 0       // O player in Human mode
        }
    }
};

// Gemini AI instance
const geminiAI = new window.GeminiAI();

// DOM Elements
const cells = document.querySelectorAll('.cell');
const resetBtn = document.getElementById('reset-btn');
const modeSwitch = document.getElementById('mode-switch');
const modeLabel = document.getElementById('mode-label');
const switchContainer = document.querySelector('.switch-container');
const scoreDisplay = document.getElementById('score-display');
const resetTooltip = document.getElementById('reset-tooltip');
const infoButton = document.getElementById('info-button');
const infoTooltip = document.getElementById('info-tooltip');
const closeTooltipBtn = document.getElementById('close-tooltip');
const scoreInfoTooltip = document.getElementById('score-info-tooltip');
const closeScoreTooltipBtn = document.getElementById('close-score-tooltip');

// API Key Modal Elements
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key');
const skipApiKeyBtn = document.getElementById('skip-api-key');
const aiStatus = document.getElementById('ai-status');

// Initialize the application
async function initApp() {
    console.log('Initializing ShiftTac...');
    
    // Load scores from localStorage
    loadScores();
    
    // Setup UI event listeners
    setupEventListeners();
    
    // Hide API modal
    apiKeyModal.classList.add('hidden');
    
    // Check if API key is available (from environment variable or needs user input)
    const apiKey = 'AIzaSyDsNoQfLs93EcPC4Oz4WuxlLbiHg2vqbTo';
    
    if (apiKey && apiKey.trim() !== '') {
        console.log('Using environment API key...');
        await initializeGeminiAI(apiKey);
    } else {
        console.log('No environment API key found, showing modal...');
        showApiKeyModal();
        return; // Exit early, initialization will continue after user provides key
    }
    
    // Initialize the game
    initGame();
    
    // Update score display
    updateScoreDisplay();
    
    // Initialize AI status container width
    const aiStatusContainer = document.querySelector('.ai-status-container');
    const aiStatusText = document.getElementById('ai-status-text');
    if (aiStatusContainer && aiStatusText) {
        const initialWidth = aiStatusManager.measureTextWidth(aiStatusText.textContent || 'Initializing');
        aiStatusContainer.style.width = initialWidth + 'px';
    }
    
    console.log('ShiftTac ready to play!');
}

// Show API Key Modal
function showApiKeyModal() {
    apiKeyModal.classList.remove('hidden');
    apiKeyInput.focus();
}

// Initialize Gemini AI with API key
async function initializeGeminiAI(apiKey) {
    try {
        await geminiAI.initialize(apiKey);
        
        // Test simple API call
        console.log('Testing Gemini API with simple call...');
        const testResult = await geminiAI.testSimpleCall();
        console.log('Simple test result:', testResult);
        
        console.log('Gemini AI initialized successfully');
        updateAIStatus('Ready', 'gemini');
    } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
        geminiAI.fallbackMode = true;
        updateAIStatus('Fallback Mode', 'fallback');
    }
}

// Enhanced AI Status Manager with Dynamic Celebrations
const aiStatusManager = {
    currentMessage: '',
    isAnimating: false,
    
    // Celebration emojis and messages for AI status
    aiWinEmojis: ['🤖', '🌟', '✨', '🎯', '🧠', '⚡', '🔥', '💫', '🎊', '🎈'],
    playerWinEmojis: ['🎉', '🥳', '🙌', '👏', '🎊', '🥂', '🍾', '💃', '🕺', '🌟', '✨', '💖', '😍', '🥰', '😎', '🌞'],
    
    aiWinMessages: [
        'I Got You!', 
        'Nice Try!',
        'AI Victory!',
        'Calculated!',
        'Logic Wins!',
        'Better Luck Next Time!',
        'AI Triumph!',
        'I Won!'
    ],
    
    playerWinMessages: [
        'You Win!',
        'Victory!',
        'Well Played!',
        'Excellent!',
        'Outstanding!',
        'Brilliant Move!',
        'You Got Me!',
        'Human Triumph!',
        'Great Strategy!',
        'Impressive!'
    ],
    
    measureTextWidth(text) {
        const measureElement = document.createElement('div');
        measureElement.style.position = 'absolute';
        measureElement.style.visibility = 'hidden';
        measureElement.style.whiteSpace = 'nowrap';
        measureElement.style.fontSize = '0.75rem';
        measureElement.style.fontWeight = '500';
        measureElement.style.fontFamily = 'Inter, sans-serif';
        measureElement.textContent = text;
        
        document.body.appendChild(measureElement);
        const width = measureElement.offsetWidth + 20; // Add padding
        document.body.removeChild(measureElement);
        
        return Math.max(width, 80); // Minimum width
    },
    
    // Show dynamic AI win celebration
    showAIWin() {
        const emoji = this.aiWinEmojis[Math.floor(Math.random() * this.aiWinEmojis.length)];
        const message = this.aiWinMessages[Math.floor(Math.random() * this.aiWinMessages.length)];
        const celebrationText = `${emoji} ${message}`;
        
        this.updateStatus(celebrationText, 'gemini');
        console.log(`🎉 AI Status Celebration: ${celebrationText}`);
    },
    
    // Show dynamic player win celebration  
    showPlayerWin() {
        const emoji = this.playerWinEmojis[Math.floor(Math.random() * this.playerWinEmojis.length)];
        const message = this.playerWinMessages[Math.floor(Math.random() * this.playerWinMessages.length)];
        const celebrationText = `${emoji} ${message}`;
        
        this.updateStatus(celebrationText, 'gemini');
        console.log(`🎉 Player Status Celebration: ${celebrationText}`);
    },
    
    async updateStatus(message, type = '') {
        const aiStatusElement = document.getElementById('ai-status');
        const aiStatusText = document.getElementById('ai-status-text');
        const aiStatusContainer = document.querySelector('.ai-status-container');
        
        if (!aiStatusElement || !aiStatusText || !aiStatusContainer) return;
        
        // Don't animate if message is the same
        if (this.currentMessage === message && !this.isAnimating) {
            aiStatusElement.className = 'ai-status ' + type;
            return;
        }
        
        this.currentMessage = message;
        this.isAnimating = true;
        
        // Measure width for new text
        const newWidth = this.measureTextWidth(message);
        
        // Fade out current text
        aiStatusText.classList.add('fade-out');
        
        // Start width animation immediately
        aiStatusContainer.style.width = newWidth + 'px';
        
        // Wait for fade out, then change text and fade in
        setTimeout(() => {
            aiStatusText.textContent = message;
            aiStatusElement.className = 'ai-status ' + type;
            
            // Remove fade-out and add fade-in
            aiStatusText.classList.remove('fade-out');
            aiStatusText.classList.add('fade-in');
            
            // Clean up fade-in class
            setTimeout(() => {
                aiStatusText.classList.remove('fade-in');
                this.isAnimating = false;
            }, 600);
            
        }, 300);
    }
};

// Update AI status indicator (keeping legacy function for compatibility)
function updateAIStatus(message, type = '') {
    aiStatusManager.updateStatus(message, type);
}

// Update player turn status
function updatePlayerTurnStatus() {
    const aiType = geminiAI.isAvailable() ? 'gemini' : 'fallback';
    const aiStatusElement = document.getElementById('ai-status');
    const aiStatusLabel = document.querySelector('.ai-status-label');
    
    if (state.playerMode === 'ai') {
        // Show AI status in AI mode
        if (aiStatusElement) {
            aiStatusElement.style.display = 'flex';
        }
        if (aiStatusLabel) {
            aiStatusLabel.style.display = 'inline';
            aiStatusLabel.textContent = 'AI:';
        }
        
        if (state.currentPlayer === 'x') {
            updateAIStatus('Your Turn', aiType);
        }
        // AI turn status is handled in makeAIMove function
    } else {
        // Hide entire status area in human vs human mode
        if (aiStatusElement) {
            aiStatusElement.style.display = 'none';
        }
    }
}

// Setup all event listeners
function setupEventListeners() {
    // API Key Modal
    saveApiKeyBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            await initializeGeminiAI(apiKey);
            apiKeyModal.classList.add('hidden');
        } else {
            alert('Please enter a valid API key');
        }
    });
    
    skipApiKeyBtn.addEventListener('click', () => {
        geminiAI.fallbackMode = true;
        updateAIStatus('Fallback Mode', 'fallback');
        apiKeyModal.classList.add('hidden');
    });
    
    // Allow Enter key to save API key
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveApiKeyBtn.click();
        }
    });
    
    // Game controls
    resetBtn.addEventListener('click', initGame);
    modeSwitch.addEventListener('click', handleSwitchClick);
    modeSwitch.addEventListener('keydown', handleSwitchKeydown);
    
    // Info tooltips
    infoButton.addEventListener('click', showInfoTooltip);
    closeTooltipBtn.addEventListener('click', () => {
        infoTooltip.classList.remove('visible');
    });
    closeScoreTooltipBtn.addEventListener('click', () => {
        scoreInfoTooltip.classList.remove('visible');
    });
    
    // Score reset functionality
    setupScoreReset();
}

// Helper function to ensure O marks are visible
function ensureOMarksVisible() {
    const oCells = Array.from(cells).filter(cell => cell.classList.contains('o'));
    oCells.forEach(cell => {
        void cell.offsetWidth;
        if (cell.classList.contains('next-to-fade') || cell.classList.contains('winning')) {
            cell.classList.add('visible');
        }
    });
}

// Initialize Game
function initGame() {
    state.board = Array(9).fill('');
    state.xMoves = [];
    state.oMoves = [];
    state.gameOver = false;
    state.winner = null;
    state.currentPlayer = 'x'; // Always start with human player (X)
    state.moveHistory = [];
    
    // Hide any active celebrations
    celebrationSystem.hide();
    
    // Reset UI
    cells.forEach(cell => {
        cell.className = 'cell';
        cell.addEventListener('click', handleCellClick);
    });
    
    // Hide reset button
    resetBtn.classList.add('hidden');
    
    // Clear any indicators
    clearNextToFadeIndicators();
    
    // Reset AI thinking panel
    if (typeof aiThinkingPanel !== 'undefined') {
        aiThinkingPanel.reset();
    }
    
    // Reset AI conversation history for new game
    if (window.geminiAI && window.geminiAI.resetGameHistory) {
        window.geminiAI.resetGameHistory();
    }
    
    // Update turn status
    updatePlayerTurnStatus();
    
    console.log('Game initialized - Human (X) goes first');
}

function handleCellClick(e) {
    if (state.gameOver) return;
    if (state.playerMode === 'ai' && state.currentPlayer === 'o') return;
    
    const cell = e.target;
    const index = parseInt(cell.dataset.index);
    
    // Check if cell is already marked
    if (state.board[index] !== '') return;
    
    // Place mark
    placeMark(index);
    
    // Update AI panel with game state after human move
    if (typeof aiThinkingPanel !== 'undefined') {
        aiThinkingPanel.updateGameState();
    }
    
    // Check for win or game over
    if (!checkGameEnd()) {
        // AI turn if playing against AI
        if (state.playerMode === 'ai') {
            setTimeout(makeAIMove, 800); // Slightly longer delay for Gemini AI
        } else {
            // Switch players in 2-player mode
            state.currentPlayer = state.currentPlayer === 'x' ? 'o' : 'x';
            updatePlayerTurnStatus();
        }
    }
}

function placeMark(index) {
    const player = state.currentPlayer;
    const prevBoard = [...state.board]; // Save board state before the move
    
    state.board[index] = player;
    
    // Record move for AI context
    const moveRecord = {
        player,
        position: index,
        board: prevBoard
    };
    
    // If this move will cause fading, record what will fade
    const currentPlayerMoves = player === 'x' ? state.xMoves : state.oMoves;
    if (currentPlayerMoves.length >= 3) {
        moveRecord.fadedPosition = currentPlayerMoves[0];
    }
    
    state.moveHistory.push(moveRecord);
    
    // Handle limited marks logic
    const playerMoves = player === 'x' ? state.xMoves : state.oMoves;
    playerMoves.push(index);
    
    // Add visual mark
    cells[index].classList.add(player);
    
    // Apply random animation
    applyRandomAnimation(cells[index]);
    
    // If player has more than 3 marks, remove the oldest
    if (playerMoves.length > 3) {
        const oldestIndex = playerMoves.shift();
        const oldestCell = cells[oldestIndex];
        
        // Add fading animation
        oldestCell.classList.add('fading');
        
        // Remove mark after animation
        setTimeout(() => {
            oldestCell.classList.remove(player, 'fading');
            state.board[oldestIndex] = '';
            
            // Check if removing this mark affects any winning condition
            if (!state.gameOver) {
                ensureOMarksVisible();
            }
        }, 500);
    }
    
    // Update next-to-fade indicators after move
    setTimeout(() => {
        if (!state.gameOver) {
    updateNextToFadeIndicators();
        }
    }, 100);
}

function clearAnimationClasses(cell) {
    const animationClasses = [
        'animated', 'shadow-burst', 'floating', 
        'spin-in', 'color-flash'
    ];
    animationClasses.forEach(cls => cell.classList.remove(cls));
}

function applyRandomAnimation(cell) {
    clearAnimationClasses(cell);
    
    const animations = ['animated', 'spin-in', 'color-flash'];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    
    setTimeout(() => {
    cell.classList.add(randomAnimation);
    
        setTimeout(() => {
            cell.classList.remove(randomAnimation);
        }, 1000);
    }, 50);
}

// Clear 'next-to-fade' indicators from all cells
function clearNextToFadeIndicators() {
    cells.forEach(cell => {
        cell.classList.remove('next-to-fade');
    });
}

// Update next-to-fade indicators based on current moves
function updateNextToFadeIndicators() {
    clearNextToFadeIndicators();
    
    const cellsToFade = [];
    
    // Only show indicators if there are 3 marks (the next one will cause a removal)
    if (state.xMoves.length === 3) {
        const nextToFadeIndex = state.xMoves[0];
        cellsToFade.push(cells[nextToFadeIndex]);
    }
    
    if (state.oMoves.length === 3) {
        const nextToFadeIndex = state.oMoves[0];
        cellsToFade.push(cells[nextToFadeIndex]);
        cells[nextToFadeIndex].classList.add('visible');
    }
    
    // Force reflow and add fade indicators
    if (cellsToFade.length > 0) {
        void document.body.offsetWidth;
        cellsToFade.forEach(cell => {
            cell.classList.add('next-to-fade');
        });
    }
    
    ensureOMarksVisible();
}

// Dynamic Celebration Emoji System
const celebrationSystem = {
    // Different animation types for variety
    animationTypes: ['slide-in', 'fade-up', 'slide-down', 'slide-right', 'zoom-in'],
    
    // Apply random animation to emoji
    applyRandomAnimation() {
        const container = document.getElementById('celebration-container');
        const emoji = document.getElementById('celebration-emoji');
        
        if (!container || !emoji) return;
        
        // Clear previous animation classes
        container.classList.remove('slide-in', 'fade-up', 'slide-down', 'slide-right', 'zoom-in');
        
        // Apply random animation type
        const randomAnimation = this.animationTypes[Math.floor(Math.random() * this.animationTypes.length)];
        container.classList.add(randomAnimation);
        
        console.log(`🎬 Applied ${randomAnimation} animation to celebration`);
    },
    
    // Different emoji categories for variety
    aiWinEmojis: ['🤖', '🌟', '✨', '🎯', '🧠', '⚡', '🔥', '💫', '🎊', '🎈'],
    playerWinEmojis: ['🎉', '🥳', '🙌', '👏', '🎊', '🥂', '🍾', '💃', '🕺', '🌟', '✨', '💖', '😍', '🥰', '😎', '🌞'],
    
    // Different celebration messages
    aiWinMessages: [
        'AI Wins!',
        'I Got You!', 
        'Nice Try!',
        'AI Victory!',
        'Calculated!',
        'Logic Wins!',
        'Better Luck Next Time!',
        'AI Triumph!'
    ],
    
    playerWinMessages: [
        'You Win!',
        'Victory!',
        'Well Played!',
        'Excellent!',
        'Outstanding!',
        'Brilliant Move!',
        'You Got Me!',
        'Human Triumph!',
        'Great Strategy!',
        'Impressive!'
    ],
    
    // Show celebration
    show(isAI, isSpecialWin = false) {
        const container = document.getElementById('celebration-container');
        const emojiElement = document.getElementById('celebration-emoji');
        const textElement = document.getElementById('celebration-text');
        
        if (!container || !emojiElement || !textElement) {
            console.warn('⚠️ Celebration elements not found');
            return;
        }
        
        // Select random emoji and message
        const emojis = isAI ? this.aiWinEmojis : this.playerWinEmojis;
        const messages = isAI ? this.aiWinMessages : this.playerWinMessages;
        
        const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const selectedMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Apply content
        emojiElement.textContent = selectedEmoji;
        textElement.textContent = selectedMessage;
        
        // Clear any existing animation classes
        container.classList.remove('hidden', 'special-win', 'floating-emojis');
        container.classList.remove(...this.animationTypes);
        
        // Apply random linear animation
        this.applyRandomAnimation();
        
        // Add special effects for special wins
        if (isSpecialWin) {
            container.classList.add('special-win');
            if (Math.random() < 0.3) {
                container.classList.add('floating-emojis');
            }
        }
        
        // Show celebration
        container.classList.remove('hidden');
        
        console.log(`🎉 Showing celebration: ${selectedEmoji} "${selectedMessage}" (Special: ${isSpecialWin})`);
        
        // Auto-hide after delay
        setTimeout(() => {
            this.hide();
        }, 3000);
    },
    
    // Hide celebration
    hide() {
        const container = document.getElementById('celebration-container');
        if (container) {
            container.classList.add('hidden');
            
            // Clean up classes after animation
            setTimeout(() => {
                container.className = 'celebration-container hidden';
            }, 300);
        }
    },
    
    // Get random emoji from array
    getRandomEmoji(emojiArray) {
        return emojiArray[Math.floor(Math.random() * emojiArray.length)];
    },
    
    // Get random message from array
    getRandomMessage(messageArray) {
        return messageArray[Math.floor(Math.random() * messageArray.length)];
    },
    
    // Check if this is a special win (comeback, perfect game, etc.)
    isSpecialWin(winner) {
        // Special win conditions:
        // 1. Comeback win (opponent had more moves)
        // 2. Perfect game (winner didn't lose any pieces to fading)
        // 3. Quick win (won in minimum moves)
        
        const winnerMoves = winner === 'x' ? state.xMoves : state.oMoves;
        const opponentMoves = winner === 'x' ? state.oMoves : state.xMoves;
        
        // Quick win - won with exactly 3 moves
        if (winnerMoves.length === 3) {
            console.log('🎯 Special Win: Quick Victory!');
            return true;
        }
        
        // Comeback win - opponent had more moves at some point
        if (opponentMoves.length >= winnerMoves.length && winnerMoves.length > 3) {
            console.log('🔥 Special Win: Comeback Victory!');
            return true;
        }
        
        // Random chance for special celebration
        if (Math.random() < 0.2) {
            console.log('✨ Special Win: Lucky Celebration!');
            return true;
        }
        
        return false;
    }
};

// Check for game end
function checkGameEnd() {
    // Check for win using ONLY active moves (not faded marks)
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    // Check both players for wins using their active moves only
    const players = [
        { symbol: 'x', moves: state.xMoves },
        { symbol: 'o', moves: state.oMoves }
    ];
    
    for (const player of players) {
    for (const pattern of winPatterns) {
            // Check if all three positions in pattern are in player's active moves
            const hasAllThree = pattern.every(pos => player.moves.includes(pos));
            
            if (hasAllThree) {
                state.winner = player.symbol;
            state.gameOver = true;
            
                console.log(`🏆 WIN DETECTED: ${player.symbol.toUpperCase()} wins with pattern ${pattern.join('-')}`);
                console.log(`Active ${player.symbol} moves:`, player.moves);
                
                // Check if this is a special win
                const isSpecialWin = celebrationSystem.isSpecialWin(player.symbol);
                
                // Update AI status based on winner with dynamic celebrations
                if (state.playerMode === 'ai') {
                    if (player.symbol === 'o') {
                        // AI won - show dynamic celebration
                        aiStatusManager.showAIWin();
                    } else {
                        // Human won - show dynamic celebration  
                        aiStatusManager.showPlayerWin();
                    }
                } else {
                    // Human vs Human mode - temporarily show status for celebration
                    const aiStatusElement = document.getElementById('ai-status');
                    const aiStatusLabel = document.querySelector('.ai-status-label');
                    
                    if (aiStatusElement && aiStatusLabel) {
                        aiStatusElement.style.display = 'flex';
                        aiStatusLabel.style.display = 'none'; // Hide AI: label
                        
                        // Show winner celebration
                        if (player.symbol === 'x') {
                            aiStatusManager.showPlayerWin();
                        } else {
                            const emoji = aiStatusManager.playerWinEmojis[Math.floor(Math.random() * aiStatusManager.playerWinEmojis.length)];
                            const message = aiStatusManager.playerWinMessages[Math.floor(Math.random() * aiStatusManager.playerWinMessages.length)];
                            updateAIStatus(`${emoji} O ${message}`, 'gemini');
                        }
                        
                        // Hide status again after 3 seconds
                        setTimeout(() => {
                            if (state.playerMode === 'human') {
                                aiStatusElement.style.display = 'none';
                            }
                        }, 3000);
                    }
                }
                
                // Highlight winning cells
            pattern.forEach((index, i) => {
                cells[index].classList.add('winning');
                setTimeout(() => {
                    applyVictoryAnimation(cells[index]);
                    }, i * 150);
            });
            
                // Show reset button
            resetBtn.classList.remove('hidden');
            
            // Update AI thinking panel to stop thinking
            if (typeof aiThinkingPanel !== 'undefined') {
                aiThinkingPanel.setThinking(false);
                aiThinkingPanel.updateGameState();
            }
            
            // Update score
            updateScore(state.winner);
                
                // Increment game counter
                state.gameCount++;
            
            return true;
            }
        }
    }
    
    return false;
}

// Function to apply special victory animations
function applyVictoryAnimation(cell) {
    clearAnimationClasses(cell);
    
    cell.classList.add('color-flash');
    
    setTimeout(() => {
        cell.classList.remove('color-flash');
        cell.classList.add('shadow-burst');
        
        setTimeout(() => {
            cell.classList.remove('shadow-burst');
            cell.classList.add('animated');
            
            setTimeout(() => {
                cell.classList.add('floating');
            }, 500);
        }, 600);
    }, 600);
}

// AI Move using Gemini AI
async function makeAIMove() {
    if (state.gameOver) return;
    
    // Set current player to 'o' for AI
    state.currentPlayer = 'o';
    
    // Update AI thinking panel
    aiThinkingPanel.setThinking(true);
    aiThinkingPanel.updateGameState();
    
    updateAIStatus('Analyzing...', 'thinking');
    
    try {
        // Show preliminary analysis
        aiThinkingPanel.showAIReasoning({
            analysis: "🎯 Scanning board for winning opportunities and threats...",
            winCheck: { result: "Checking...", type: "neutral" },
            blockCheck: { result: "Checking...", type: "neutral" },
            fadingImpact: { result: "Analyzing...", type: "neutral" },
            bestMove: { result: "Calculating...", type: "neutral" }
        });
        
        // Update status to show thinking progress
        updateAIStatus('Strategizing...', 'thinking');
        
        // Get move from Gemini AI with enhanced reasoning
        const result = await geminiAI.getMoveWithReasoning(state);
        const index = result.move;
        
        // Show AI reasoning in the panel
        if (result.reasoning) {
            aiThinkingPanel.showAIReasoning(result.reasoning);
        }
        
        // Update status for final decision
        updateAIStatus('Deciding...', 'thinking');
        
        // Small delay to show the reasoning
        await new Promise(resolve => setTimeout(resolve, 500));
    
    // Place the mark
    placeMark(index);
    
    // Check for win
    if (!checkGameEnd()) {
        ensureOMarksVisible();
        state.currentPlayer = 'x';
        
        // Update panel state
        aiThinkingPanel.setThinking(false);
        aiThinkingPanel.updateGameState();
        
        // Update status for player turn
        updateAIStatus('Your Turn', geminiAI.isAvailable() ? 'gemini' : 'fallback');
    }
        
    } catch (error) {
        console.error('Error making AI move:', error);
        updateAIStatus('Error - Fallback', 'fallback');
        
        // Show fallback reasoning
        aiThinkingPanel.showAIReasoning({
            analysis: "⚠️ Gemini AI unavailable, using fallback strategy...",
            winCheck: { result: "Skipped", type: "neutral" },
            blockCheck: { result: "Basic check", type: "neutral" },
            fadingImpact: { result: "Not analyzed", type: "neutral" },
            bestMove: { result: "Center/corner preference", type: "neutral" }
        });
        
        // Fallback to simple AI
        const fallbackMove = geminiAI.getFallbackMove(state);
        placeMark(fallbackMove);
        
        if (!checkGameEnd()) {
            ensureOMarksVisible();
        state.currentPlayer = 'x';
            
            aiThinkingPanel.setThinking(false);
            aiThinkingPanel.updateGameState();
            
            // Update status for player turn
            updateAIStatus('Your Turn', 'fallback');
        }
    }
}

function findWinningMove(player, boardState = state.board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    // Get player's active moves (excluding faded ones)
    const playerMoves = player === 'x' ? state.xMoves : state.oMoves;
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        
        // Count how many positions in this pattern the player has (active moves only)
        const playerPositions = pattern.filter(pos => playerMoves.includes(pos));
        const emptyPositions = pattern.filter(pos => boardState[pos] === '');
        
        // If player has 2 active positions and 1 empty position, they can win
        if (playerPositions.length === 2 && emptyPositions.length === 1) {
            const winPos = emptyPositions[0];
            console.log(`🎯 Winning move found for ${player}: position ${winPos} in pattern ${pattern.join('-')}`);
            console.log(`${player} active moves:`, playerMoves);
            return winPos;
        }
    }
    
    return -1;
}

// Toggle between AI and Human modes
function togglePlayerMode() {
    switchContainer.classList.add('text-changing');
    
    setTimeout(() => {
        state.playerMode = state.playerMode === 'ai' ? 'human' : 'ai';
        localStorage.setItem('ticTacToePlayerMode', state.playerMode);
        
        modeSwitch.classList.toggle('checked', state.playerMode === 'ai');
        modeSwitch.setAttribute('aria-checked', state.playerMode === 'ai');
        modeLabel.textContent = state.playerMode === 'ai' ? 'AI' : 'HUMAN';
        
        // Show/hide AI panel toggle based on mode
        if (typeof aiThinkingPanel !== 'undefined') {
            const toggle = document.getElementById('ai-panel-toggle');
            if (toggle) {
                toggle.style.display = state.playerMode === 'ai' ? 'flex' : 'none';
            }
            
            // Hide panel when switching to human mode
            if (state.playerMode === 'human') {
                aiThinkingPanel.hidePanel();
            }
        }
        
        updateScoreDisplay();
        
        switchContainer.classList.remove('text-changing');
        switchContainer.classList.add('text-changed');
        
        initGame();
        
        setTimeout(() => {
            switchContainer.classList.remove('text-changed');
        }, 300);
    }, 300);
}

function loadScores() {
    const savedScores = localStorage.getItem('ticTacToeScores');
    if (savedScores) {
        try {
            const scores = JSON.parse(savedScores);
            state.scores = { ...state.scores, ...scores };
        } catch (e) {
            console.error('Error loading scores:', e);
        }
    }
    
    const savedGameCount = localStorage.getItem('ticTacToeGameCount');
    if (savedGameCount) {
        state.gameCount = parseInt(savedGameCount) || 0;
    }
}

function saveScores() {
    try {
        localStorage.setItem('ticTacToeScores', JSON.stringify(state.scores));
        localStorage.setItem('ticTacToeGameCount', state.gameCount.toString());
    } catch (e) {
        console.error('Error saving scores:', e);
    }
}

function updateScoreDisplay() {
    const player1Label = document.getElementById('player1-label');
    const player1Score = document.getElementById('player1-score');
    const player2Label = document.getElementById('player2-label');
    const player2Score = document.getElementById('player2-score');
    
    if (state.playerMode === 'ai') {
        player1Label.textContent = 'You:';
        player2Label.textContent = 'AI:';
        player1Score.textContent = state.scores.ai.player;
        player2Score.textContent = state.scores.ai.ai;
    } else {
        player1Label.textContent = 'X:';
        player2Label.textContent = 'O:';
        player1Score.textContent = state.scores.human.x;
        player2Score.textContent = state.scores.human.o;
    }
}

function updateScore(winner) {
    if (state.playerMode === 'ai') {
        if (winner === 'x') {
            state.scores.ai.player++;
        } else if (winner === 'o') {
            state.scores.ai.ai++;
        }
    } else {
        if (winner === 'x') {
            state.scores.human.x++;
        } else if (winner === 'o') {
            state.scores.human.o++;
        }
    }
    
    updateScoreDisplay();
    saveScores();
}

function setupScoreReset() {
    let isHolding = false;
    let holdTimeout;
    
    function startScoreReset(e) {
        e.preventDefault();
        isHolding = true;
        scoreDisplay.classList.add('resetting');
        
        holdTimeout = setTimeout(() => {
            if (isHolding) {
                resetScores();
                showScoreInfoTooltip();
            }
        }, 1000);
    }
    
    function cancelScoreReset() {
        isHolding = false;
        clearTimeout(holdTimeout);
        scoreDisplay.classList.remove('resetting');
    }
    
    function resetScores() {
        state.scores = {
            ai: { player: 0, ai: 0 },
            human: { x: 0, o: 0 }
        };
        updateScoreDisplay();
        saveScores();
        cancelScoreReset();
    }
    
    scoreDisplay.addEventListener('mousedown', startScoreReset);
    scoreDisplay.addEventListener('touchstart', startScoreReset);
    scoreDisplay.addEventListener('mouseup', cancelScoreReset);
    scoreDisplay.addEventListener('touchend', cancelScoreReset);
    scoreDisplay.addEventListener('mouseleave', cancelScoreReset);
}

function showScoreInfoTooltip() {
    // Implementation for score tooltip
}

function showInfoTooltip() {
    infoTooltip.classList.add('visible');
}

function handleSwitchClick() {
    togglePlayerMode();
}

function handleSwitchKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePlayerMode();
    }
}

// AI Thinking Panel Management
const aiThinkingPanel = {
    panel: null,
    toggle: null,
    indicator: null,
    analysisText: null,
    reasoningElements: {},
    gameStateElements: {},
    isVisible: false,
    
    init() {
        this.panel = document.getElementById('ai-thinking-panel');
        this.toggle = document.getElementById('ai-panel-toggle');
        this.indicator = document.getElementById('ai-thinking-indicator');
        this.analysisText = document.getElementById('ai-current-analysis');
        
        // Cache reasoning step elements
        this.reasoningElements = {
            winCheck: document.getElementById('win-check'),
            blockCheck: document.getElementById('block-check'),
            fadingImpact: document.getElementById('fading-impact'),
            bestMove: document.getElementById('best-move')
        };
        
        // Cache game state elements
        this.gameStateElements = {
            playerMarks: document.getElementById('player-marks'),
            aiMarks: document.getElementById('ai-marks'),
            nextFade: document.getElementById('next-fade')
        };
        
        // Set initial visibility based on game mode
        if (this.toggle) {
            this.toggle.style.display = state.playerMode === 'ai' ? 'flex' : 'none';
        }
        
        this.setupEventListeners();
        this.updateGameState();
    },
    
    setupEventListeners() {
        this.toggle.addEventListener('click', () => this.togglePanel());
        document.getElementById('ai-panel-close').addEventListener('click', () => this.hidePanel());
        
        // Close panel when clicking outside (optional)
        document.addEventListener('click', (e) => {
            if (this.isVisible && !this.panel.contains(e.target) && !this.toggle.contains(e.target)) {
                // Uncomment to enable click-outside-to-close
                // this.hidePanel();
            }
        });
    },
    
    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    },
    
    showPanel() {
        this.panel.classList.remove('hidden');
        this.toggle.classList.add('panel-open');
        this.isVisible = true;
        this.updateGameState();
    },
    
    hidePanel() {
        this.panel.classList.add('hidden');
        this.toggle.classList.remove('panel-open');
        this.isVisible = false;
    },
    
    setThinking(isThinking = true) {
        if (this.indicator) {
            if (isThinking) {
                this.indicator.className = 'ai-status-indicator thinking';
                this.updateAnalysis("🤔 Analyzing game state and considering all possible moves...");
            } else {
                this.indicator.className = 'ai-status-indicator idle';
            }
        }
    },
    
    updateAnalysis(text) {
        if (this.analysisText) {
            this.analysisText.textContent = text;
        }
    },
    
    updateReasoning(step, result, type = 'neutral') {
        if (this.reasoningElements[step]) {
            this.reasoningElements[step].textContent = result;
            this.reasoningElements[step].className = `step-result ${type}`;
        }
    },
    
    updateGameState() {
        if (!this.gameStateElements.playerMarks) return;
        
        const xPositions = state.xMoves.map(pos => pos + 1).join(', ') || 'None';
        const oPositions = state.oMoves.map(pos => pos + 1).join(', ') || 'None';
        
        this.gameStateElements.playerMarks.textContent = `[${xPositions}]`;
        this.gameStateElements.aiMarks.textContent = `[${oPositions}]`;
        
        // Determine what will fade next
        let nextToFade = 'None';
        if (state.playerMode === 'ai') {
            if (state.currentPlayer === 'x' && state.xMoves.length === 3) {
                nextToFade = `Your mark at ${state.xMoves[0] + 1}`;
            } else if (state.currentPlayer === 'o' && state.oMoves.length === 3) {
                nextToFade = `AI mark at ${state.oMoves[0] + 1}`;
            }
        }
        
        this.gameStateElements.nextFade.textContent = nextToFade;
    },
    
    showAIReasoning(reasoning) {
        if (!reasoning) return;
        
        // Update analysis
        if (reasoning.analysis) {
            this.updateAnalysis(reasoning.analysis);
        }
        
        // Update reasoning steps
        if (reasoning.winCheck !== undefined) {
            this.updateReasoning('winCheck', reasoning.winCheck.result, reasoning.winCheck.type);
        }
        
        if (reasoning.blockCheck !== undefined) {
            this.updateReasoning('blockCheck', reasoning.blockCheck.result, reasoning.blockCheck.type);
        }
        
        if (reasoning.fadingImpact !== undefined) {
            this.updateReasoning('fadingImpact', reasoning.fadingImpact.result, reasoning.fadingImpact.type);
        }
        
        if (reasoning.bestMove !== undefined) {
            this.updateReasoning('bestMove', reasoning.bestMove.result, reasoning.bestMove.type);
        }
    },
    
    reset() {
        this.setThinking(false);
        this.updateAnalysis("Waiting for AI move...");
        
        // Reset all reasoning steps
        Object.keys(this.reasoningElements).forEach(step => {
            this.updateReasoning(step, "Analyzing...", "neutral");
        });
        
        this.updateGameState();
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    aiThinkingPanel.init();
}); 