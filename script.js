// Game State
const state = {
    playerMode: localStorage.getItem('ticTacToePlayerMode') || 'ai', // 'ai' or 'human'
    currentPlayer: 'x', // 'x' or 'o'
    board: Array(9).fill(''),
    xMoves: [], // Track X's moves for the limited marking feature
    oMoves: [], // Track O's moves for the limited marking feature
    gameOver: false,
    winner: null,
    moveHistory: [], // Track all moves for learning AI
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
    },
    aiDifficulty: 'hard' // Hard mode is now the only mode
};

// Learning AI data structure
const learningAI = {
    // Game state patterns and their associated moves
    patterns: {},
    
    // Performance metrics
    wins: 0,
    losses: 0,
    draws: 0,
    
    // Learning configuration (Improved learning rate)
    explorationThreshold: 3, // Learn faster - starts using patterns after just 3 games
    initialExplorationRate: 0.2, // Lower randomness at start (was 0.4)
    minExplorationRate: 0.05, // Lower min randomness (was 0.1)
    
    // Initialize from localStorage if available
    init() {
        const storedData = localStorage.getItem('ticTacToeAI');
        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                this.patterns = data.patterns || {};
                this.wins = data.wins || 0;
                this.losses = data.losses || 0;
                this.draws = data.draws || 0;
                state.gameCount = data.gameCount || 0;
                console.log('AI data loaded from storage:', Object.keys(this.patterns).length, 'patterns');
                console.log('Games played:', state.gameCount);
            } catch (e) {
                console.error('Error loading AI data:', e);
                // Reset if corrupt
                this.patterns = {};
                this.wins = 0;
                this.losses = 0;
                this.draws = 0;
                state.gameCount = 0;
            }
        }
    },
    
    // Save data to localStorage
    save() {
        try {
            const data = {
                patterns: this.patterns,
                wins: this.wins,
                losses: this.losses,
                draws: this.draws,
                gameCount: state.gameCount
            };
            localStorage.setItem('ticTacToeAI', JSON.stringify(data));
        } catch (e) {
            console.error('Error saving AI data:', e);
        }
    },
    
    // Convert board state to a string key
    getBoardKey(board) {
        return board.join('');
    },
    
    // Record a move for learning
    recordMove(board, move, outcome) {
        const key = this.getBoardKey(board);
        
        if (!this.patterns[key]) {
            this.patterns[key] = {};
        }
        
        if (!this.patterns[key][move]) {
            this.patterns[key][move] = {
                wins: 0,
                losses: 0,
                draws: 0,
                total: 0
            };
        }
        
        this.patterns[key][move].total++;
        
        if (outcome === 'win') {
            this.patterns[key][move].wins++;
        } else if (outcome === 'loss') {
            this.patterns[key][move].losses++;
        } else {
            this.patterns[key][move].draws++;
        }
    },
    
    // Record user's winning moves for faster learning
    recordPlayerWinningPattern(moveHistory, winner) {
        if (winner !== 'x') return; // Only learn from player's wins
        
        // Find the move that led to the win
        for (let i = 0; i < moveHistory.length; i += 2) { // Player's moves are at even indices
            if (i+2 >= moveHistory.length) {
                // This might be the winning move - record it with high importance
                const board = [...moveHistory[i].board];
                const move = moveHistory[i].position;
                
                // Create a special entry with high weight for blocking this pattern
                this.recordPlayerWinningMove(board, move);
            }
        }
    },
    
    // Record player's winning move with high weight
    recordPlayerWinningMove(board, move) {
        const key = this.getBoardKey(board);
        
        // When seeing this board, AI should block this move
        if (!this.patterns[key]) {
            this.patterns[key] = {};
        }
        
        // Find all other possible moves in this position
        const emptySpots = board.map((cell, index) => cell === '' ? index : -1).filter(idx => idx !== -1 && idx !== move);
        
        // Mark the player's winning move as a high priority to block
        emptySpots.forEach(blockingMove => {
            if (!this.patterns[key][blockingMove]) {
                this.patterns[key][blockingMove] = {
                    wins: 3, // Give it extra weight
                    losses: 0,
                    draws: 1,
                    total: 4
                };
            } else {
                // Increase blocking priority
                this.patterns[key][blockingMove].wins += 3;
                this.patterns[key][blockingMove].total += 3;
            }
        });
    },
    
    // Learn from game - happening during gameplay now too
    learnFromGame(moveHistory, winner) {
        // Only learn if we have moves to analyze
        if (moveHistory.length < 2) return;
        
        // Determine outcome for AI (o)
        let outcome;
        if (winner === 'o') outcome = 'win';
        else if (winner === 'x') outcome = 'loss';
        else outcome = 'draw';
        
        // Update global stats
        if (outcome === 'win') this.wins++;
        else if (outcome === 'loss') this.losses++;
        else this.draws++;
        
        // Record all AI moves with the board state before each move
        for (let i = 1; i < moveHistory.length; i += 2) {
            const board = [...moveHistory[i-1].board]; // Board before AI move
            const move = moveHistory[i].position;      // AI's move position
            
            this.recordMove(board, move, outcome);
        }
        
        // If player won, also record their winning pattern
        if (winner === 'x') {
            this.recordPlayerWinningPattern(moveHistory, winner);
        }
        
        // Save after learning
        this.save();
    },
    
    // Real-time learning after each move
    learnFromCurrentGame() {
        // If game is not in progress or no moves made, skip
        if (state.moveHistory.length < 2) return;
        
        // We don't know outcome yet, so use neutral outcome (draw)
        const tempOutcome = 'draw';
        
        // Record only AI moves made so far
        for (let i = 1; i < state.moveHistory.length; i += 2) {
            const board = [...state.moveHistory[i-1].board]; // Board before AI move
            const move = state.moveHistory[i].position;      // AI's move position
            
            this.recordMove(board, move, tempOutcome);
        }
        
        // Save incrementally
        this.save();
    },
    
    // Calculate current exploration rate based on games played
    getExplorationRate() {
        // Always use 1% exploration rate (hard mode)
        return 0.01; // 1% exploration rate for hard mode
    },
    
    // Choose best move based on learning
    chooseMove(board) {
        // First look for immediate win
        const winMove = findWinningMove('o', board);
        if (winMove !== -1) {
            return winMove;
        }
        
        // Look for immediate blocks (hard mode behavior)
        const blockMove = findWinningMove('x', board);
        if (blockMove !== -1) {
            return blockMove;
        }
        
        // Pattern-based move selection
        const key = this.getBoardKey(board);
        const availableMoves = board.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);
        
        // If no available moves or patterns for this board state
        if (availableMoves.length === 0 || !this.patterns[key]) {
            return this.fallbackStrategy(board);
        }
        
        // Calculate scores for each available move
        const moveScores = availableMoves.map(move => {
            if (!this.patterns[key][move]) {
                return { move, score: 0, confidence: 0 };
            }
            
            const stats = this.patterns[key][move];
            const total = stats.total;
            
            if (total === 0) return { move, score: 0, confidence: 0 };
            
            // Calculate weighted score (wins are most valuable, draws next)
            const winRate = stats.wins / total;
            const drawRate = stats.draws / total;
            const score = winRate * 2 + drawRate;
            
            // Confidence increases with more samples
            const confidence = Math.min(1, total / 5); // Max confidence at 5 samples (was 10)
            
            return { move, score, confidence, total };
        });
        
        // Sort by score and confidence
        moveScores.sort((a, b) => {
            // First by score
            if (b.score !== a.score) return b.score - a.score;
            // Then by confidence
            return b.confidence - a.confidence;
        });
        
        // Dynamic exploration rate based on difficulty and games played
        const explorationRate = this.getExplorationRate();
        const shouldExplore = Math.random() < explorationRate;
        
        if (shouldExplore) {
            // Choose a random move to explore
            console.log("AI exploring new move (exploration rate:", explorationRate.toFixed(2) + ")");
            return availableMoves[Math.floor(Math.random() * availableMoves.length)];
        } else {
            // Choose best move
            console.log("AI using learned move (exploration rate:", explorationRate.toFixed(2) + ")");
            return moveScores[0].move;
        }
    },
    
    // Fallback to traditional strategy when no learned patterns are available
    fallbackStrategy(board) {
        // First try to win
        const winMove = findWinningMove('o', board);
        if (winMove !== -1) return winMove;
        
        // Then try to block opponent (hard mode always blocks)
        const blockMove = findWinningMove('x', board);
        if (blockMove !== -1) {
            return blockMove;
        }
        
        // Take center if available
        if (board[4] === '') return 4;
        
        // Take corners
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Take any available cell
        const emptyCells = board.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);
        
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
};

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

// Helper function to ensure O marks are visible
function ensureOMarksVisible() {
    // Find all O cells
    const oCells = Array.from(cells).filter(cell => cell.classList.contains('o'));
    
    // For each O cell, ensure it's properly visible
    oCells.forEach(cell => {
        // Force a reflow
        void cell.offsetWidth;
        
        // Remove and re-add the o class to restart animations if needed
        if (cell.classList.contains('next-to-fade') || cell.classList.contains('winning')) {
            // We just want to make sure these marks stay visible
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
    state.currentPlayer = 'x';
    state.moveHistory = [];
    
    // Reset UI
    cells.forEach(cell => {
        cell.className = 'cell';
    });
    
    // Hide reset button
    resetBtn.classList.add('hidden');
    
    // Setup event listeners for cells
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
    
    // First AI move if AI starts
    if (state.playerMode === 'ai' && state.currentPlayer === 'o') {
        makeAIMove();
    }
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
    
    // Check for win or game over
    if (!checkGameEnd()) {
        // AI turn if playing against AI
        if (state.playerMode === 'ai') {
            setTimeout(makeAIMove, 500);
        } else {
            // Switch players in 2-player mode
            state.currentPlayer = state.currentPlayer === 'x' ? 'o' : 'x';
        }
    }
}

function placeMark(index) {
    const player = state.currentPlayer;
    const prevBoard = [...state.board]; // Save board state before the move
    
    state.board[index] = player;
    
    // Record move for learning
    state.moveHistory.push({
        player,
        position: index,
        board: prevBoard
    });
    
    // Clear any existing next-to-fade indicators
    clearNextToFadeIndicators();
    
    // Add move to player's move history
    if (player === 'x') {
        state.xMoves.push(index);
        // If more than 3 marks, remove the oldest one
        if (state.xMoves.length > 3) {
            const oldestIndex = state.xMoves.shift();
            state.board[oldestIndex] = '';
            
            // Clear any existing animation classes first
            clearAnimationClasses(cells[oldestIndex]);
            
            cells[oldestIndex].classList.add('fading');
            setTimeout(() => {
                cells[oldestIndex].className = 'cell';
            }, 500);
        } else if (state.xMoves.length === 3) {
            // If this is the 3rd X mark, show which one will disappear next
            const nextToFadeIndex = state.xMoves[0];
            cells[nextToFadeIndex].classList.add('next-to-fade');
        }
    } else {
        state.oMoves.push(index);
        // If more than 3 marks, remove the oldest one
        if (state.oMoves.length > 3) {
            const oldestIndex = state.oMoves.shift();
            state.board[oldestIndex] = '';
            
            // Clear any existing animation classes first
            clearAnimationClasses(cells[oldestIndex]);
            
            cells[oldestIndex].classList.add('fading');
            setTimeout(() => {
                cells[oldestIndex].className = 'cell';
            }, 500);
        } else if (state.oMoves.length === 3) {
            // If this is the 3rd O mark, show which one will disappear next
            const nextToFadeIndex = state.oMoves[0];
            cells[nextToFadeIndex].classList.add('next-to-fade');
        }
    }
    
    // Update UI - clear any existing animation classes first
    clearAnimationClasses(cells[index]);
    
    // Apply the player class
    cells[index].classList.add(player);
    
    // Ensure O marks render properly by forcing a repaint
    if (player === 'o') {
        // Trigger browser reflow to ensure proper rendering
        void cells[index].offsetWidth;
    }
    
    // Apply random animation effects
    applyRandomAnimation(cells[index]);
    
    // Update next-to-fade indicators after move
    updateNextToFadeIndicators();
}

// Helper function to clear animation classes
function clearAnimationClasses(cell) {
    const animationClasses = [
        'animated', 'shadow-burst', 'floating', 'micro-bounce', 
        'spin-in', 'color-flash', 'zoom-bounce', 'shimmer'
    ];
    animationClasses.forEach(cls => cell.classList.remove(cls));
}

// Function to apply random animation to a cell
function applyRandomAnimation(cell) {
    // List of animation classes - removed bounce and shimmer
    const animations = [
        'animated',
        'shadow-burst',
        'floating',
        'spin-in',
        'color-flash'
    ];
    
    // Select a random animation
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    
    // Apply the animation class
    cell.classList.add(randomAnimation);
    
    // For some animations that should be temporary, remove them after animation completes
    if (['shadow-burst', 'color-flash'].includes(randomAnimation)) {
        setTimeout(() => {
            cell.classList.remove(randomAnimation);
        }, 1000);
    }
    
    // For floating animation, remove after longer period
    if (randomAnimation === 'floating') {
        setTimeout(() => {
            cell.classList.remove(randomAnimation);
        }, 3000);
    }
}

// Clear 'next-to-fade' indicators from all cells
function clearNextToFadeIndicators() {
    cells.forEach(cell => {
        cell.classList.remove('next-to-fade');
    });
}

// Update next-to-fade indicators based on current moves
function updateNextToFadeIndicators() {
    // Only show indicators if there are 3 marks (the next one will cause a removal)
    if (state.xMoves.length === 3) {
        const nextToFadeIndex = state.xMoves[0];
        cells[nextToFadeIndex].classList.add('next-to-fade');
    }
    
    if (state.oMoves.length === 3) {
        const nextToFadeIndex = state.oMoves[0];
        cells[nextToFadeIndex].classList.add('next-to-fade');
        
        // Ensure this O mark stays visible
        cells[nextToFadeIndex].classList.add('visible');
        
        // Force a reflow to ensure proper rendering
        void cells[nextToFadeIndex].offsetWidth;
    }
    
    // Ensure all O marks are visible
    ensureOMarksVisible();
}

function checkGameEnd() {
    // Check for win
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
            state.winner = state.currentPlayer;
            state.gameOver = true;
            
            // Highlight winning cells with special animations
            pattern.forEach((index, i) => {
                cells[index].classList.add('winning');
                
                // Add staggered victory animations
                setTimeout(() => {
                    applyVictoryAnimation(cells[index]);
                }, i * 150); // Stagger by 150ms
            });
            
            // Show reset icon
            resetBtn.classList.remove('hidden');
            
            // Update score
            updateScore(state.winner);
            
            // Handle game outcomes for learning AI
            if (state.playerMode === 'ai') {
                learningAI.learnFromGame(state.moveHistory, state.winner);
                
                // Increment game counter
                state.gameCount++;
            }
            
            return true;
        }
    }
    
    return false;
}

// Function to apply special victory animations
function applyVictoryAnimation(cell) {
    // Clear any existing animations
    const classesToRemove = [
        'animated', 'shadow-burst', 'floating', 
        'spin-in', 'color-flash'
    ];
    classesToRemove.forEach(cls => cell.classList.remove(cls));
    
    // Apply victory animation sequence
    cell.classList.add('color-flash');
    
    setTimeout(() => {
        cell.classList.remove('color-flash');
        cell.classList.add('shadow-burst');
        
        setTimeout(() => {
            cell.classList.remove('shadow-burst');
            cell.classList.add('animated');
            
            // Start a gentle float animation after the initial victory animations
            setTimeout(() => {
                cell.classList.add('floating');
            }, 500);
        }, 600);
    }, 600);
}

// AI LOGIC
function makeAIMove() {
    if (state.gameOver) return;
    
    // Set current player to 'o' for AI
    state.currentPlayer = 'o';
    
    // Update AI learning in real-time
    learningAI.learnFromCurrentGame();
    
    // Get AI move using the learning AI
    const index = learningAI.chooseMove(state.board);
    
    // Place the mark
    placeMark(index);
    
    // Check for win
    if (!checkGameEnd()) {
        // Ensure O marks are visible after AI moves
        ensureOMarksVisible();
        
        // Switch back to player
        state.currentPlayer = 'x';
    }
}

function findWinningMove(player, boardState = state.board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        // Check if player has two in a row and third is empty
        if (boardState[a] === player && boardState[b] === player && boardState[c] === '') {
            return c;
        }
        if (boardState[a] === player && boardState[c] === player && boardState[b] === '') {
            return b;
        }
        if (boardState[b] === player && boardState[c] === player && boardState[a] === '') {
            return a;
        }
    }
    
    return -1; // No winning move found
}

// Toggle between AI and Human modes
function togglePlayerMode() {
    // Start the text animation
    switchContainer.classList.add('text-changing');
    
    setTimeout(() => {
        // Update player mode
        state.playerMode = state.playerMode === 'ai' ? 'human' : 'ai';
        
        // Save player mode to localStorage
        localStorage.setItem('ticTacToePlayerMode', state.playerMode);
        
        // Update switch UI
        modeSwitch.classList.toggle('checked', state.playerMode === 'ai');
        modeSwitch.setAttribute('aria-checked', state.playerMode === 'ai');
        
        // Update the mode label
        modeLabel.textContent = state.playerMode === 'ai' ? 'AI' : 'HUMAN';
        
        // Update score display
        updateScoreDisplay();
        
        // Trigger second animation phase
        switchContainer.classList.remove('text-changing');
        switchContainer.classList.add('text-changed');
        
        // Restart the game with new mode
        initGame();
        
        // Remove animation class after animation completes
        setTimeout(() => {
            switchContainer.classList.remove('text-changed');
        }, 300);
    }, 300);
}

// Load scores from localStorage
function loadScores() {
    const storedScores = localStorage.getItem('ticTacToeScores');
    if (storedScores) {
        try {
            state.scores = JSON.parse(storedScores);
            
            // Ensure all score properties exist (for backwards compatibility)
            if (!state.scores.ai) {
                state.scores.ai = { player: 0, ai: 0 };
            }
            if (!state.scores.human) {
                state.scores.human = { x: 0, o: 0 };
            }
        } catch (e) {
            console.error('Error loading scores:', e);
            state.scores = {
                ai: { player: 0, ai: 0 },
                human: { x: 0, o: 0 }
            };
        }
    }
    updateScoreDisplay();
}

// Save scores to localStorage
function saveScores() {
    try {
        localStorage.setItem('ticTacToeScores', JSON.stringify(state.scores));
    } catch (e) {
        console.error('Error saving scores:', e);
    }
}

// Update the score display based on current mode
function updateScoreDisplay() {
    const player1Label = document.getElementById('player1-label');
    const player2Label = document.getElementById('player2-label');
    const player1Score = document.getElementById('player1-score');
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

// Update score based on winner
function updateScore(winner) {
    if (state.playerMode === 'ai') {
        // In AI mode: player = human (X), ai = AI (O)
        if (winner === 'x') {
            state.scores.ai.player++;
        } else if (winner === 'o') {
            state.scores.ai.ai++;
        }
    } else {
        // In Human mode: player1 = X, player2 = O
        if (winner === 'x') {
            state.scores.human.x++;
        } else if (winner === 'o') {
            state.scores.human.o++;
        }
    }
    
    // Update score display
    updateScoreDisplay();
    
    // Save scores to localStorage
    saveScores();
}

// Score reset functionality
let scoreResetTimer;
let tooltipTimer;

function setupScoreReset() {
    scoreDisplay.addEventListener('mousedown', startScoreReset);
    scoreDisplay.addEventListener('touchstart', startScoreReset, { passive: true });
    
    scoreDisplay.addEventListener('mouseup', cancelScoreReset);
    scoreDisplay.addEventListener('mouseleave', cancelScoreReset);
    scoreDisplay.addEventListener('touchend', cancelScoreReset);
    scoreDisplay.addEventListener('touchcancel', cancelScoreReset);
    
    // Show tooltip on first hover/touch
    scoreDisplay.addEventListener('mouseover', showTooltip);
    scoreDisplay.addEventListener('touchstart', showTooltip, { passive: true });
    
    // Show score info tooltip on click (if not dismissed)
    scoreDisplay.addEventListener('click', showScoreInfoTooltip);
}

function showScoreInfoTooltip() {
    scoreInfoTooltip.classList.add('visible');
}

function showTooltip() {
    resetTooltip.classList.add('visible');
    
    // Clear any existing timer
    if (tooltipTimer) clearTimeout(tooltipTimer);
    
    // Hide tooltip after 3 seconds
    tooltipTimer = setTimeout(() => {
        resetTooltip.classList.remove('visible');
    }, 3000);
}

function startScoreReset(e) {
    // Add visual feedback
    scoreDisplay.classList.add('resetting');
    
    // Start timer - 1 second hold
    scoreResetTimer = setTimeout(() => {
        // Reset only the current mode's scores
        if (state.playerMode === 'ai') {
            state.scores.ai.player = 0;
            state.scores.ai.ai = 0;
        } else {
            state.scores.human.x = 0;
            state.scores.human.o = 0;
        }
        
        // Update display
        updateScoreDisplay();
        
        // Save to localStorage
        saveScores();
        
        // Add some visual feedback
        scoreDisplay.classList.add('resetting');
        setTimeout(() => {
            scoreDisplay.classList.remove('resetting');
        }, 300);
        
        // Show confirmation message
        resetTooltip.textContent = "Scores reset!";
        resetTooltip.classList.add('visible');
        
        setTimeout(() => {
            resetTooltip.classList.remove('visible');
            setTimeout(() => {
                resetTooltip.textContent = "Hold for 1 second to reset scores";
            }, 500);
        }, 2000);
        
    }, 1000); // 1 second hold
}

function cancelScoreReset() {
    // Remove visual feedback
    scoreDisplay.classList.remove('resetting');
    
    // Cancel timer
    if (scoreResetTimer) {
        clearTimeout(scoreResetTimer);
    }
}

// Initialize the info tooltip
function initInfoTooltip() {
    // Always show the info button
    infoButton.style.display = 'flex';
    
    // Show tooltip on click - use direct click handler for better reliability
    infoButton.onclick = function() {
        infoTooltip.classList.add('visible');
    };
    
    // Close main tooltip button
    closeTooltipBtn.onclick = function() {
        infoTooltip.classList.remove('visible');
    };
    
    // Close score tooltip button
    closeScoreTooltipBtn.onclick = function() {
        scoreInfoTooltip.classList.remove('visible');
    };
}

// Function to show info tooltip on first visit
function showInfoTooltip() {
    // Check if this is the first visit
    const hasVisitedBefore = localStorage.getItem('ticTacToeVisited');
    
    if (!hasVisitedBefore) {
        // Show tooltip on first visit
        infoTooltip.classList.add('visible');
        
        // Mark as visited for future sessions
        localStorage.setItem('ticTacToeVisited', 'true');
    }
}

// Switch interactions
function handleSwitchClick() {
    togglePlayerMode();
}

function handleSwitchKeydown(e) {
    // Toggle with Space or Enter
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        togglePlayerMode();
    }
}

// EVENT LISTENERS
resetBtn.addEventListener('click', initGame);
modeSwitch.addEventListener('click', handleSwitchClick);
modeSwitch.addEventListener('keydown', handleSwitchKeydown);

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    // Initialize learning AI
    learningAI.init();
    
    // Load scores
    loadScores();
    
    // Set initial toggle state based on saved preference
    modeSwitch.classList.toggle('checked', state.playerMode === 'ai');
    modeSwitch.setAttribute('aria-checked', state.playerMode === 'ai');
    modeLabel.textContent = state.playerMode === 'ai' ? 'AI' : 'HUMAN';
    
    // Setup score reset functionality
    setupScoreReset();
    
    // Initialize info tooltip
    initInfoTooltip();
    
    // Initialize the game
    initGame();
    
    // Show info tooltip only on first visit
    setTimeout(showInfoTooltip, 1000);
}); 