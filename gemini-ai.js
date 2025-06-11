// Gemini AI Service for ShiftTac
class GeminiAI {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
        this.model = 'gemini-2.0-flash-lite';
        this.initialized = false;
        this.fallbackMode = false;
        this.conversationHistory = [];
        this.gameNumber = 1;
    }

    async initialize(apiKey) {
        try {
            if (!apiKey) {
                console.warn('No Gemini API key provided. Using fallback AI.');
                this.fallbackMode = true;
                return false;
            }
            this.apiKey = apiKey;
            const testResponse = await this.makeRequest("Test connection. Reply with: OK");
            if (testResponse && testResponse.includes('OK')) {
                this.initialized = true;
                this.fallbackMode = false;
                console.log('Gemini AI initialized successfully');
                return true;
            } else {
                throw new Error('Invalid API response');
            }
        } catch (error) {
            console.error('Failed to initialize Gemini AI:', error);
            this.fallbackMode = true;
            return false;
        }
    }

    async makeRequest(prompt, useHistory = false) {
        try {
            let messages = [];
            if (useHistory && this.conversationHistory.length > 0) {
                messages = [...this.conversationHistory];
                messages.push({ role: "user", content: prompt });
            } else {
                messages = [{ role: "user", content: prompt }];
            }
            
            const requestBody = {
                model: this.model,
                messages: messages,
                max_tokens: 4096,
                temperature: 0.1
            };

            console.log('Making API request to:', this.baseURL);
            console.log('Using API key:', this.apiKey ? 'Present' : 'Missing');
            console.log('Request model:', this.model);
            console.log('Request body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const data = await response.json();
            console.log('API Response data:', data);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const message = data.choices[0].message;
                const choice = data.choices[0];
                
                console.log('Response message:', message);
                console.log('Message content:', message.content);
                console.log('Message content type:', typeof message.content);
                console.log('Finish reason:', choice.finish_reason);
                
                if (choice.finish_reason === 'length') {
                    console.warn('Response was truncated due to length limit!');
                }
                
                if (!message.content || message.content === null || message.content === undefined) {
                    console.error('Response message has no content field!');
                    console.error('Full message object:', message);
                    throw new Error('Empty response content');
                }
                
                return message.content;
            } else {
                console.error('Invalid response format - missing choices/message');
                console.error('Full response:', data);
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    createGamePrompt(gameState) {
        const { board, xMoves, oMoves } = gameState;
        const boardDisplay = board.map((cell, index) => {
            if (cell === '') return index.toString();
            return cell.toUpperCase();
        });

        const boardText = `Board positions (0-8):
${boardDisplay[0]} | ${boardDisplay[1]} | ${boardDisplay[2]}
---------
${boardDisplay[3]} | ${boardDisplay[4]} | ${boardDisplay[5]}
---------
${boardDisplay[6]} | ${boardDisplay[7]} | ${boardDisplay[8]}`;

        const availableMoves = board.map((cell, index) => cell === '' ? index : null).filter(x => x !== null);

        // Get fallback AI analysis for reference
        const fallbackAnalysis = this.getFallbackAnalysis(gameState);

        // Analyze immediate threats
        const winPatterns = [
            { name: "Top Row", positions: [0, 1, 2] },
            { name: "Middle Row", positions: [3, 4, 5] },
            { name: "Bottom Row", positions: [6, 7, 8] },
            { name: "Left Column", positions: [0, 3, 6] },
            { name: "Center Column", positions: [1, 4, 7] },
            { name: "Right Column", positions: [2, 5, 8] },
            { name: "Main Diagonal", positions: [0, 4, 8] },
            { name: "Anti Diagonal", positions: [2, 4, 6] }
        ];

        let threatAnalysis = "\n🚨 CRITICAL THREAT ANALYSIS:\n";
        let immediateThreats = [];
        let winningMoves = [];

        for (const pattern of winPatterns) {
            const xInPattern = pattern.positions.filter(pos => xMoves.includes(pos));
            const oInPattern = pattern.positions.filter(pos => oMoves.includes(pos));
            const emptyInPattern = pattern.positions.filter(pos => board[pos] === '');

            if (xInPattern.length === 2 && emptyInPattern.length === 1) {
                const threatPos = emptyInPattern[0];
                immediateThreats.push(threatPos);
                threatAnalysis += `⚠️  IMMEDIATE THREAT: X can win next turn in ${pattern.name} [${pattern.positions.join('-')}] by playing position ${threatPos}!\n`;
            }

            if (oInPattern.length === 2 && emptyInPattern.length === 1) {
                const winPos = emptyInPattern[0];
                winningMoves.push(winPos);
                threatAnalysis += `🎯 WINNING OPPORTUNITY: You can win immediately in ${pattern.name} [${pattern.positions.join('-')}] by playing position ${winPos}!\n`;
            }
        }

        if (immediateThreats.length === 0 && winningMoves.length === 0) {
            threatAnalysis += "✅ No immediate threats or wins detected.\n";
        }

        return `🎮 SHIFTTAC AI STRATEGY SYSTEM 🎮
🎯 GAME #${this.gameNumber} | MOVE #${gameState.moveHistory?.length + 1 || 1} | AI: GEMINI 2.0 FLASH-LITE

⚡ CRITICAL RULE REMINDER:
- Each player can only have 3 marks on board at once
- 4th mark makes OLDEST mark disappear  
- Only CURRENT/ACTIVE marks count for winning
- Faded marks are COMPLETELY USELESS

CURRENT BOARD STATE:
${boardText}

ACTIVE MARKS STATUS:
• X (Human) positions: [${xMoves.join(', ')}] (${xMoves.length}/3 marks)
• O (You) positions: [${oMoves.join(', ')}] (${oMoves.length}/3 marks)
${threatAnalysis}

🤖 FALLBACK AI ANALYSIS:
${fallbackAnalysis.reasoning}
📍 Fallback recommendation: Position ${fallbackAnalysis.move} (${fallbackAnalysis.moveType})

🎯 DECISION PRIORITY (FOLLOW EXACTLY):
1. 🏆 IF you can win immediately → TAKE THE WIN (positions: [${winningMoves.join(', ') || 'none'}])
2. 🛡️ IF X threatens to win next turn → BLOCK IMMEDIATELY (positions: [${immediateThreats.join(', ') || 'none'}])
3. 🔄 IF X is building threat → Disrupt it
4. ⚔️ IF you can setup win → Build toward it  
5. 🏗️ ELSE → Take strategic position (center/corners)

AVAILABLE MOVES: [${availableMoves.join(', ')}]

${immediateThreats.length > 0 ? 
`🚨🚨🚨 URGENT: X CAN WIN NEXT TURN! YOU MUST BLOCK AT POSITION ${immediateThreats[0]} 🚨🚨🚨` : 
''}

${winningMoves.length > 0 ? 
`🎯🎯🎯 YOU CAN WIN NOW! PLAY POSITION ${winningMoves[0]} TO WIN! 🎯🎯🎯` : 
''}

💡 STRATEGIC HINT: Consider the fallback AI's suggestion and reasoning, but prioritize immediate wins and blocks first.

Respond with ONLY the position number (0-8):`;
    }

    async getMove(gameState) {
        if (this.fallbackMode || !this.initialized) {
            console.log('🤖 Using fallback AI (API unavailable)');
            return this.getFallbackMove(gameState);
        }

        try {
            // 🎯 WIN CHECK FIRST - Always prioritize winning!
            const winMove = this.findWinningMove('o', gameState.board, gameState);
            if (winMove !== -1) {
                console.log(`🎯 IMMEDIATE WIN AVAILABLE: Taking victory at position ${winMove}!`);
                this.addToHistory("Immediate win available", `Won at position ${winMove}`);
                return winMove;
            }

            // 🛡️ CRITICAL BLOCK CHECK SECOND - Block only if we can't win
            const criticalBlockMove = this.findWinningMove('x', gameState.board, gameState);
            if (criticalBlockMove !== -1) {
                console.log(`🚨 CRITICAL THREAT DETECTED: X can win at position ${criticalBlockMove}! Blocking immediately.`);
                this.addToHistory("Critical block required", `Blocked X threat at position ${criticalBlockMove}`);
                return criticalBlockMove;
            }

            const prompt = this.createGamePrompt(gameState);
            
            console.log('🎮 Sending COMPREHENSIVE game state to Gemini 2.0 Flash-Lite...');
            console.log('Current board:', gameState.board);
            console.log('X moves:', gameState.xMoves);
            console.log('O moves:', gameState.oMoves);
            console.log('Prompt length:', prompt.length, 'characters');
            
            const responseText = await this.makeRequest(prompt, true);
            
            if (!responseText || typeof responseText !== 'string') {
                console.warn('⚠️ Invalid response from Gemini AI, falling back');
                return this.getFallbackMove(gameState);
            }

            const move = parseInt(responseText.trim());
            
            if (isNaN(move) || move < 0 || move > 8 || gameState.board[move] !== '') {
                console.warn(`⚠️ Invalid move ${move} from Gemini AI, falling back`);
                return this.getFallbackMove(gameState);
            }

            // 🎯 DOUBLE-CHECK WIN FIRST: Never miss victory opportunities!
            const finalWinCheck = this.findWinningMove('o', gameState.board, gameState);
            if (finalWinCheck !== -1 && move !== finalWinCheck) {
                console.error(`🎯🎯🎯 WIN OVERRIDE: O can win at ${finalWinCheck}! Gemini chose ${move} - TAKING WIN!`);
                this.addToHistory(prompt, `${responseText} [WIN OVERRIDE - TAKING VICTORY AT ${finalWinCheck}]`);
                return finalWinCheck;
            }

            // 🔄 THEN CHECK BLOCKS: Verify no critical threats
            const finalBlockCheck = this.findWinningMove('x', gameState.board, gameState);
            if (finalBlockCheck !== -1 && move !== finalBlockCheck) {
                console.error(`🚨🚨🚨 EMERGENCY OVERRIDE: X can win at ${finalBlockCheck}! Gemini chose ${move} - BLOCKING INSTEAD!`);
                this.addToHistory(prompt, `${responseText} [EMERGENCY OVERRIDE - CRITICAL BLOCK AT ${finalBlockCheck}]`);
                return finalBlockCheck;
            }

            // Log comparison with fallback analysis
            const fallbackAnalysis = this.getFallbackAnalysis(gameState);
            if (move !== fallbackAnalysis.move) {
                console.log(`🤔 AI Strategy Difference: Gemini chose ${move}, Fallback suggested ${fallbackAnalysis.move} (${fallbackAnalysis.moveType})`);
            } else {
                console.log(`🤝 AI Agreement: Both Gemini and Fallback chose position ${move}`);
            }

            console.log(`✅ Gemini AI analyzed game and chose position: ${move}`);
            this.addToHistory(prompt, responseText);
            return move;

        } catch (error) {
            console.error('Error getting move from Gemini:', error);
            console.log('🔄 API Error - Switching to fallback AI');
            this.fallbackMode = true; // Switch to fallback mode for reliability
            return this.getFallbackMove(gameState);
        }
    }

    async getMoveWithReasoning(gameState) {
        const move = await this.getMove(gameState);
        return {
            move,
            reasoning: {
                analysis: '🎯 Comprehensive AI analysis complete',
                winCheck: { result: 'Analyzed', type: 'positive' },
                blockCheck: { result: 'Analyzed', type: 'positive' },
                fadingImpact: { result: 'Analyzed', type: 'positive' },
                bestMove: { result: `Position ${move}`, type: 'positive' }
            }
        };
    }

    getFallbackAnalysis(gameState) {
        const { board } = gameState;
        
        // Check for immediate win
        const winMove = this.findWinningMove('o', board, gameState);
        if (winMove !== -1) {
            return {
                move: winMove,
                moveType: "WINNING MOVE",
                reasoning: "🎯 Fallback AI found immediate winning opportunity and would take it."
            };
        }
        
        // Check for critical block
        const blockMove = this.findWinningMove('x', board, gameState);
        if (blockMove !== -1) {
            return {
                move: blockMove,
                moveType: "BLOCKING MOVE",
                reasoning: "🛡️ Fallback AI detected immediate threat from X and would block it."
            };
        }
        
        // Strategic position logic
        if (board[4] === '') {
            return {
                move: 4,
                moveType: "CENTER CONTROL",
                reasoning: "🎯 Fallback AI would take center position (4) for maximum strategic control."
            };
        }
        
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => board[i] === '');
        if (availableCorners.length > 0) {
            const chosenCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
            return {
                move: chosenCorner,
                moveType: "CORNER STRATEGY",
                reasoning: `🏰 Fallback AI would take corner position (${chosenCorner}) for strong positional advantage.`
            };
        }
        
        const edges = [1, 3, 5, 7];
        const availableEdges = edges.filter(i => board[i] === '');
        if (availableEdges.length > 0) {
            const chosenEdge = availableEdges[Math.floor(Math.random() * availableEdges.length)];
            return {
                move: chosenEdge,
                moveType: "EDGE POSITION",
                reasoning: `⚡ Fallback AI would take edge position (${chosenEdge}) as a flexible option.`
            };
        }
        
        // Random fallback
        const emptyCells = board.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);
        
        const randomMove = emptyCells[Math.floor(Math.random() * emptyCells.length)] || 0;
        return {
            move: randomMove,
            moveType: "RANDOM CHOICE",
            reasoning: `🎲 Fallback AI would make random move to position (${randomMove}) as last resort.`
        };
    }

    getFallbackMove(gameState) {
        const { board } = gameState;
        
        const winMove = this.findWinningMove('o', board, gameState);
        if (winMove !== -1) return winMove;
        
        const blockMove = this.findWinningMove('x', board, gameState);
        if (blockMove !== -1) return blockMove;
        
        if (board[4] === '') return 4;
        
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        const emptyCells = board.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);
        
        return emptyCells[Math.floor(Math.random() * emptyCells.length)] || 0;
    }

    findWinningMove(player, board, gameState = null) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        const patternNames = [
            'Top Row', 'Middle Row', 'Bottom Row',
            'Left Column', 'Center Column', 'Right Column', 
            'Main Diagonal', 'Anti Diagonal'
        ];
        
        if (gameState) {
            const playerMoves = player === 'x' ? gameState.xMoves : gameState.oMoves;
            console.log(`🔍 Analyzing ${player.toUpperCase()} moves [${playerMoves.join(', ')}] for winning opportunities...`);
            console.log(`📋 Current board state:`, board);
            
            for (let i = 0; i < winPatterns.length; i++) {
                const pattern = winPatterns[i];
                const patternName = patternNames[i];
                
                // Count positions in this pattern that the player occupies (from active moves)
                const playerPositions = pattern.filter(pos => playerMoves.includes(pos));
                // Find empty positions that are actually available
                const emptyPositions = pattern.filter(pos => board[pos] === '');
                // Find positions not occupied by this player (could be empty or opponent)
                const nonPlayerPositions = pattern.filter(pos => !playerMoves.includes(pos));
                // Check what's actually on the board in this pattern
                const boardState = pattern.map(pos => board[pos] || 'empty');
                
                console.log(`  Checking ${patternName} [${pattern.join('-')}]: ${player.toUpperCase()} has ${playerPositions.length}/3, empty: [${emptyPositions.join(', ')}], board: [${boardState.join(', ')}]`);
                
                // Win/threat condition: player has 2 positions AND exactly 1 position not occupied by player AND that position is empty
                if (playerPositions.length === 2 && nonPlayerPositions.length === 1) {
                    const potentialWinPos = nonPlayerPositions[0];
                    
                    console.log(`  🎯 THREAT/WIN DETECTED: ${player.toUpperCase()} has 2/3 in ${patternName}, needs position ${potentialWinPos}`);
                    
                    // Check if this position is actually empty (can be played)
                    if (board[potentialWinPos] === '') {
                        console.log(`🎯 ${player.toUpperCase()} ${player === 'x' ? 'THREAT' : 'WIN'} FOUND: ${patternName} [${pattern.join('-')}] → position ${potentialWinPos}`);
                        return potentialWinPos;
                    } else {
                        console.log(`  ❌ Position ${potentialWinPos} blocked by opponent (${board[potentialWinPos]})`);
                    }
                }
            }
            console.log(`✅ No immediate ${player === 'x' ? 'threats' : 'wins'} found for ${player.toUpperCase()}`);
        } else {
            // Fallback analysis without gameState (less reliable)
            for (let i = 0; i < winPatterns.length; i++) {
                const pattern = winPatterns[i];
                const playerCount = pattern.filter(pos => board[pos] === player).length;
                const emptyCount = pattern.filter(pos => board[pos] === '').length;
                
                if (playerCount === 2 && emptyCount === 1) {
                    const winPos = pattern.find(pos => board[pos] === '');
                    if (winPos !== undefined) {
                        return winPos;
                    }
                }
            }
        }
        return -1;
    }

    addToHistory(userPrompt, aiResponse) {
        this.conversationHistory.push(
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: aiResponse }
        );
        
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }
    }
    
    resetGameHistory() {
        this.conversationHistory = [];
        this.gameNumber++;
        console.log(`🎮 Starting new game #${this.gameNumber} - AI memory reset`);
    }

    isAvailable() { 
        return this.initialized && !this.fallbackMode; 
    }
    
    getStatus() { 
        return this.fallbackMode ? 'Using fallback AI' : this.initialized ? 'Gemini AI ready' : 'AI not initialized'; 
    }
    
    async testSimpleCall() {
        try {
            const response = await this.makeRequest("What is 2+2? Answer with just the number.");
            return response;
        } catch (error) { 
            return null; 
        }
    }
}

// Make GeminiAI available globally
window.GeminiAI = GeminiAI;
