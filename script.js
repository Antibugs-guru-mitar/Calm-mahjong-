/* ===================================
   VITA KILLER PRO MAX ULTIMATE - JS
   Candy Crush Rule: 3 Match = Crush
   10 Lines x 8 Tiles | 100 Levels | 20 Min
   Mobile DOM Fix + Solvable Boards + Bug Free
=================================== */

// ========== CONFIG ==========
const CONFIG = {
    LEVELS: 100,
    TIME_PER_LEVEL: 20 * 60,
    ROWS: 10,
    COLS: 8,
    MATCH_COUNT: 3,
    TILE_TYPES: 8,
    TILE_COLORS: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ],
    POINTS: { MATCH_3: 100, MATCH_4: 300, MATCH_5: 500 }
};

// ========== GAME STATE ==========
let gameState = {
    level: 1,
    score: 0,
    bestScore: 0,
    timeLeft: CONFIG.TIME_PER_LEVEL,
    board: [],
    selectedTile: null,
    isSwapping: false,
    isProcessing: false,
    timerInterval: null,
    moves: 0,
    combo: 0
};

// ========== DOM ELEMENTS ==========
let boardEl, levelEl, scoreEl, bestEl, timerEl, winPopupEl;
let menuScreenEl, gameContainerEl;

// ========== INIT GAME - FIXED DOM CRASH ==========
document.addEventListener('DOMContentLoaded', () => {
    try {
        // ✅ BUG FIX 1: Safe DOM cache with fallback
        boardEl = document.getElementById('game-board');
        levelEl = document.getElementById('level');
        scoreEl = document.getElementById('score');
        bestEl = document.getElementById('best-score');
        timerEl = document.getElementById('timer-display');
        winPopupEl = document.getElementById('win-message');
        menuScreenEl = document.getElementById('menu-screen');
        gameContainerEl = document.getElementById('game-container');

        // ✅ BUG FIX 2: Agar DOM element na mile to error na de
        if (!boardEl ||!gameContainerEl) {
            console.error('Critical DOM elements missing!');
            document.body.innerHTML = '<h1 style="color:red;text-align:center;margin-top:50px;">Game Error: HTML structure missing. Refresh karo.</h1>';
            return;
        }

        // Door animation fix - Hide doors after animation
        setTimeout(() => {
            document.querySelector('.door-left')?.classList.add('open');
            document.querySelector('.door-right')?.classList.add('open');
            setTimeout(() => {
                document.body.classList.add('no-doors');
            }, 800);
        }, 100);

        // ✅ BUG FIX 3: Safe localStorage access
        gameState.bestScore = parseInt(localStorage.getItem('vk_bestScore') || '0');

        loadProgress();
        updateUI();
        showMenu();
    } catch (error) {
        console.error('Init Error:', error);
        alert('Game load failed. Page refresh karo.');
    }
});

// ========== MENU FUNCTIONS ==========
function showMenu() {
    stopTimer();
    if (menuScreenEl) menuScreenEl.style.display = 'flex';
    if (gameContainerEl) gameContainerEl.style.display = 'none';
    if (winPopupEl) winPopupEl.style.display = 'none';

    const continueBtn = document.getElementById('continue-btn');
    if (localStorage.getItem('vk_savedBoard') && continueBtn) {
        continueBtn.style.display = 'block';
    }
}

function newGame() {
    clearSave();
    gameState.level = 1;
    gameState.score = 0;
    gameState.timeLeft = CONFIG.TIME_PER_LEVEL;
    startLevel();
}

function continueGame() {
    loadProgress();
    startLevel();
}

function resetProgress() {
    if (confirm('Reset all progress? Level 1 se shuru hoga.')) {
        try {
            localStorage.clear();
            location.reload();
        } catch (e) {
            alert('Reset failed. Browser storage issue.');
        }
    }
}

// ========== LEVEL SYSTEM - FIXED TIMER RESET ==========
function startLevel() {
    if (menuScreenEl) menuScreenEl.style.display = 'none';
    if (gameContainerEl) gameContainerEl.style.display = 'block';

    gameState.isProcessing = false;
    gameState.selectedTile = null;
    gameState.combo = 0;
    gameState.moves = 0;

    // ✅ BUG FIX 4: Timer color reset har level pe
    timerEl?.classList.remove('warning', 'danger');

    generateBoard();
    renderBoard();
    startTimer();
    updateUI();
    saveProgress();
}

function generateBoard() {
    gameState.board = [];
    let attempts = 0;
    do {
        gameState.board = [];
        for (let row = 0; row < CONFIG.ROWS; row++) {
            gameState.board[row] = [];
            for (let col = 0; col < CONFIG.COLS; col++) {
                let tileType;
                let tries = 0;
                do {
                    tileType = Math.floor(Math.random() * CONFIG.TILE_TYPES);
                    tries++;
                } while (tries < 50 && wouldCauseMatch(row, col, tileType));

                gameState.board[row][col] = {
                    type: tileType,
                    id: `${row}-${col}-${Date.now()}-${Math.random()}`,
                    matched: false,
                    falling: false
                };
            }
        }
        attempts++;
    } while (!hasPossibleMoves() && attempts < 100);

    if (!hasPossibleMoves()) {
        forcePossibleMove();
    }
}

function wouldCauseMatch(row, col, tileType) {
    if (col >= 2 &&
        gameState.board[row][col-1]?.type === tileType &&
        gameState.board[row][col-2]?.type === tileType) {
        return true;
    }
    if (row >= 2 &&
        gameState.board[row-1][col]?.type === tileType &&
        gameState.board[row-2][col]?.type === tileType) {
        return true;
    }
    return false;
}

function forcePossibleMove() {
    for (let row = 0; row < CONFIG.ROWS - 1; row++) {
        for (let col = 0; col < CONFIG.COLS - 1; col++) {
            gameState.board[row][col].type = 0;
            gameState.board[row][col + 1].type = 0;
            gameState.board[row + 1][col].type = 0;
            return;
        }
    }
}

// ========== RENDER BOARD ==========
function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${CONFIG.COLS}, 1fr)`;

    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            const tile = gameState.board[row][col];
            const tileEl = document.createElement('div');
            tileEl.className = 'tile';
            tileEl.dataset.row = row;
            tileEl.dataset.col = col;
            tileEl.dataset.id = tile.id;

            tileEl.style.background = CONFIG.TILE_COLORS[tile.type];
            tileEl.style.boxShadow = `inset 0 0 0 3px rgba(255,255,255,0.3), 0 4px 15px rgba(0,0,0,0.2)`;

            if (tile.matched) tileEl.classList.add('matched');
            if (tile.falling) tileEl.classList.add('falling');

            tileEl.addEventListener('click', () => handleTileClick(row, col));
            boardEl.appendChild(tileEl);
        }
    }
}

// ========== GAME LOGIC - CANDY CRUSH ==========
function handleTileClick(row, col) {
    if (gameState.isProcessing || gameState.isSwapping) return;
    if (gameState.board[row][col].matched) return;

    const clickedTile = { row, col };

    if (!gameState.selectedTile) {
        gameState.selectedTile = clickedTile;
        getTileElement(row, col)?.classList.add('selected');
    } else {
        const prevTile = gameState.selectedTile;
        getTileElement(prevTile.row, prevTile.col)?.classList.remove('selected');

        if (isAdjacent(prevTile, clickedTile)) {
            swapTiles(prevTile, clickedTile);
        } else {
            gameState.selectedTile = clickedTile;
            getTileElement(row, col)?.classList.add('selected');
        }
    }
}

function isAdjacent(tile1, tile2) {
    const rowDiff = Math.abs(tile1.row - tile2.row);
    const colDiff = Math.abs(tile1.col - tile2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function swapTiles(tile1, tile2) {
    gameState.isSwapping = true;
    gameState.moves++;

    const temp = gameState.board[tile1.row][tile1.col];
    gameState.board[tile1.row][tile1.col] = gameState.board[tile2.row][tile2.col];
    gameState.board[tile2.row][tile2.col] = temp;

    renderBoard();

    setTimeout(() => {
        const matches = findMatches();
        if (matches.length > 0) {
            gameState.selectedTile = null;
            processMatches(matches);
        } else {
            const temp2 = gameState.board[tile1.row][tile1.col];
            gameState.board[tile1.row][tile1.col] = gameState.board[tile2.row][tile2.col];
            gameState.board[tile2.row][tile2.col] = temp2;
            renderBoard();
            shakeBoard();
        }
        gameState.isSwapping = false;
    }, 300);
}

// ✅ BUG FIX 5: Duplicate match prevention
function findMatches() {
    const matchSet = new Set();
    const matches = [];

    // Horizontal
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS - 2; col++) {
            if (gameState.board[row][col].matched) continue;
            const type = gameState.board[row][col].type;
            let matchLength = 1;

            for (let k = col + 1; k < CONFIG.COLS; k++) {
                if (gameState.board[row][k].type === type &&!gameState.board[row][k].matched) {
                    matchLength++;
                } else break;
            }

            if (matchLength >= CONFIG.MATCH_COUNT) {
                for (let k = 0; k < matchLength; k++) {
                    const key = `${row}-${col + k}`;
                    if (!matchSet.has(key)) {
                        matchSet.add(key);
                        matches.push({ row, col: col + k });
                    }
                }
            }
        }
    }

    // Vertical
    for (let col = 0; col < CONFIG.COLS; col++) {
        for (let row = 0; row < CONFIG.ROWS - 2; row++) {
            if (gameState.board[row][col].matched) continue;
            const type = gameState.board[row][col].type;
            let matchLength = 1;

            for (let k = row + 1; k < CONFIG.ROWS; k++) {
                if (gameState.board[k][col].type === type &&!gameState.board[k][col].matched) {
                    matchLength++;
                } else break;
            }

            if (matchLength >= CONFIG.MATCH_COUNT) {
                for (let k = 0; k < matchLength; k++) {
                    const key = `${row + k}-${col}`;
                    if (!matchSet.has(key)) {
                        matchSet.add(key);
                        matches.push({ row: row + k, col });
                    }
                }
            }
        }
    }

    return matches;
}

// ✅ IMPROVEMENT 1: Cascade multiplier better
function processMatches(matches) {
    if (matches.length === 0) {
        gameState.isProcessing = false;
        checkLevelComplete();
        return;
    }

    gameState.isProcessing = true;
    gameState.combo++;

    // Calculate score - IMPROVED CASCADE
    let points = 0;
    const matchCount = matches.length;
    if (matchCount === 3) points = CONFIG.POINTS.MATCH_3;
    else if (matchCount === 4) points = CONFIG.POINTS.MATCH_4;
    else points = CONFIG.POINTS.MATCH_5;

    // ✅ Cascade multiplier: 1x, 1.5x, 2x, 2.5x...
    points *= (1 + gameState.combo * 0.5);
    gameState.score += Math.floor(points);

    matches.forEach(({ row, col }) => {
        gameState.board[row][col].matched = true;
        getTileElement(row, col)?.classList.add('matched');
    });

    updateUI();
    showComboText(matchCount);

    setTimeout(() => {
        dropTiles();
        fillBoard();
        renderBoard();

        setTimeout(() => {
            const newMatches = findMatches();
            if (newMatches.length > 0) {
                processMatches(newMatches);
            } else {
                gameState.combo = 0;
                gameState.isProcessing = false;
                checkLevelComplete();
                if (!hasPossibleMoves()) {
                    shuffleBoard();
                }
            }
        }, 300);
    }, 400);
}

function dropTiles() {
    for (let col = 0; col < CONFIG.COLS; col++) {
        let emptyRow = CONFIG.ROWS - 1;
        for (let row = CONFIG.ROWS - 1; row >= 0; row--) {
            if (!gameState.board[row][col].matched) {
                if (row!== emptyRow) {
                    gameState.board[emptyRow][col] = gameState.board[row][col];
                    gameState.board[emptyRow][col].falling = true;
                    gameState.board[row][col] = {
                        type: -1,
                        matched: true,
                        id: `empty-${Date.now()}`
                    };
                }
                emptyRow--;
            }
        }
    }
}

function fillBoard() {
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            if (gameState.board[row][col].matched || gameState.board[row][col].type === -1) {
                gameState.board[row][col] = {
                    type: Math.floor(Math.random() * CONFIG.TILE_TYPES),
                    id: `${row}-${col}-${Date.now()}-${Math.random()}`,
                    matched: false,
                    falling: true
                };
            }
        }
    }
}

function hasPossibleMoves() {
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            if (col < CONFIG.COLS - 1) {
                swapInArray(row, col, row, col + 1);
                if (findMatches().length > 0) {
                    swapInArray(row, col, row, col + 1);
                    return true;
                }
                swapInArray(row, col, row, col + 1);
            }
            if (row < CONFIG.ROWS - 1) {
                swapInArray(row, col, row + 1, col);
                if (findMatches().length > 0) {
                    swapInArray(row, col, row + 1, col);
                    return true;
                }
                swapInArray(row, col, row + 1, col);
            }
        }
    }
    return false;
}

function swapInArray(r1, c1, r2, c2) {
    const temp = gameState.board[r1][c1];
    gameState.board[r1][c1] = gameState.board[r2][c2];
    gameState.board[r2][c2] = temp;
}

// ========== LEVEL COMPLETE ==========
function checkLevelComplete() {
    const targetScore = gameState.level * 5000;
    if (gameState.score >= targetScore) {
        levelComplete();
    }
}

function levelComplete() {
    stopTimer();
    gameState.isProcessing = true;

    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        try {
            localStorage.setItem('vk_bestScore', gameState.bestScore);
        } catch (e) {
            console.error('Best score save failed:', e);
        }
    }

    showVictoryScreen();
    screenShake();
    createConfetti();

    setTimeout(() => {
        if (gameState.level >= CONFIG.LEVELS) {
            gameComplete();
        } else {
            gameState.level++;
            gameState.timeLeft = CONFIG.TIME_PER_LEVEL;
            startLevel();
        }
    }, 3000);
}

function showVictoryScreen() {
    if (!winPopupEl) return;
    winPopupEl.innerHTML = `
        <h2>🎉 Level ${gameState.level} Complete! 🎉</h2>
        <p>Score: ${gameState.score}</p>
        <p>Moves: ${gameState.moves}</p>
        <button class="btn-primary" onclick="hideWinPopup()">Continue</button>
    `;
    winPopupEl.style.display = 'block';
}

function hideWinPopup() {
    if (winPopupEl) winPopupEl.style.display = 'none';
}

function gameComplete() {
    if (!winPopupEl) return;
    winPopupEl.innerHTML = `
        <h2>🏆 VITA KILLER DEFEATED! 🏆</h2>
        <p>100 Levels Complete!</p>
        <p>Final Score: ${gameState.score}</p>
        <button class="btn-primary" onclick="newGame()">Play Again</button>
        <button class="btn-ghost" onclick="showMenu()">Main Menu</button>
    `;
    clearSave();
}

// ========== EFFECTS ==========
function showComboText(matchCount) {
    const comboEl = document.createElement('div');
    comboEl.className = 'combo-text';
    comboEl.textContent = matchCount >= 5? 'AMAZING!' : matchCount >= 4? 'GREAT!' : 'NICE!';
    document.body.appendChild(comboEl);
    setTimeout(() => comboEl.remove(), 1000);
}

function screenShake() {
    document.body.style.animation = 'shake 0.5s';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 500);
}

function createConfetti() {
    const flowers = ['🌸', '🌺', '🌼', '🌷', '💮', '🏵️', '🌻', '🌹'];
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'trail-particle';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-20px';
        confetti.style.fontSize = (Math.random() * 25 + 20) + 'px';
        confetti.textContent = flowers[Math.floor(Math.random() * flowers.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.position = 'fixed';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

function shakeBoard() {
    if (!boardEl) return;
    boardEl.style.animation = 'shake 0.3s';
    setTimeout(() => {
        boardEl.style.animation = '';
    }, 300);
}

// ========== TIMER ==========
function startTimer() {
    stopTimer();
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();

        if (gameState.timeLeft <= 0) {
            gameOver();
        } else if (gameState.timeLeft <= 30) {
            timerEl?.classList.add('danger');
        } else if (gameState.timeLeft <= 60) {
            timerEl?.classList.add('warning');
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function updateTimerDisplay() {
    const mins = Math.floor(gameState.timeLeft / 60);
    const secs = gameState.timeLeft % 60;
    if (timerEl) {
        timerEl.textContent = `⏱️ ${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

function gameOver() {
    stopTimer();
    if (!winPopupEl) return;
    winPopupEl.innerHTML = `
        <h2>⏰ Time's Up!</h2>
        <p>Level: ${gameState.level}</p>
        <p>Score: ${gameState.score}</p>
        <button class="btn-primary" onclick="newGame()">Try Again</button>
        <button class="btn-ghost" onclick="showMenu()">Main Menu</button>
    `;
    winPopupEl.style.display = 'block';
}

// ========== UTILS ==========
function getTileElement(row, col) {
    return boardEl?.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function updateUI() {
    if (levelEl) levelEl.textContent = gameState.level;
    if (scoreEl) scoreEl.textContent = gameState.score;
    if (bestEl) bestEl.textContent = gameState.bestScore;
    updateTimerDisplay();
}

function shuffleBoard() {
    if (gameState.isProcessing) return;
    generateBoard();
    renderBoard();
    showToast('Board Shuffled!');
}

function hint() {
    if (gameState.isProcessing) return;
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            if (col < CONFIG.COLS - 1) {
                swapInArray(row, col, row, col + 1);
                if (findMatches().length > 0) {
                    swapInArray(row, col, row, col + 1);
                    getTileElement(row, col)?.classList.add('selected');
                    getTileElement(row, col + 1)?.classList.add('selected');
                    setTimeout(() => {
                        getTileElement(row, col)?.classList.remove('selected');
                        getTileElement(row, col + 1)?.classList.remove('selected');
                    }, 1000);
                    return;
                }
                swapInArray(row, col, row, col + 1);
            }
        }
    }
}

function restartGame() {
    if (confirm('Restart current level?')) {
        gameState.timeLeft = CONFIG.TIME_PER_LEVEL;
        startLevel();
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ========== SAVE/LOAD - FIXED CRASH ==========
function saveProgress() {
    try {
        localStorage.setItem('vk_level', gameState.level);
        localStorage.setItem('vk_score', gameState.score);
        localStorage.setItem('vk_timeLeft', gameState.timeLeft);
        localStorage.setItem('vk_savedBoard', JSON.stringify(gameState.board));
    } catch (e) {
        console.error('Save failed:', e);
    }
}

function loadProgress() {
    try {
        gameState.level = parseInt(localStorage.getItem('vk_level') || '1');
        gameState.score = parseInt(localStorage.getItem('vk_score') || '0');
        gameState.timeLeft = parseInt(localStorage.getItem('vk_timeLeft') || CONFIG.TIME_PER_LEVEL);

        const savedBoard = localStorage.getItem('vk_savedBoard');
        if (savedBoard) {
            gameState.board = JSON.parse(savedBoard);
        }
    } catch (e) {
        console.error('Load failed:', e);
        // ✅ BUG FIX: Agar load fail ho to fresh start
        gameState.level = 1;
        gameState.score = 0;
        gameState.timeLeft = CONFIG.TIME_PER_LEVEL;
    }
}

function clearSave() {
    try {
        localStorage.removeItem('vk_level');
        localStorage.removeItem('vk_score');
        localStorage.removeItem('vk_timeLeft');
        localStorage.removeItem('vk_savedBoard');
    } catch (e) {
        console.error('Clear save failed:', e);
    }
}

// Auto-save every 10 seconds
setInterval(() => {
    if (gameContainerEl?.style.display!== 'none') {
        saveProgress();
    }
}, 10000);
