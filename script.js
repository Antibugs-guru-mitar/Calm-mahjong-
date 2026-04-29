/* ===================================
   VITA KILLER PRO MAX ULTIMATE - JS V2
   SWIPE TO CRUSH | SCORE = WIN | 20 MIN = DEADLINE
   10x8 Grid | 12 3D Balls | Mobile Bulletproof
=================================== */

const CONFIG = {
    LEVELS: 100,
    TIME_PER_LEVEL: 20 * 60, // Deadline only, not win condition
    ROWS: 10,
    COLS: 8,
    MATCH_COUNT: 3,
    TILE_TYPES: 12, // ✅ 12 Balls ab
    TILE_COLORS: [
        '#FF1744', '#2979FF', '#00E676', '#FFEA00', // Red, Blue, Green, Yellow
        '#9C27B0', '#FF6D00', '#00BCD4', '#E91E63', // Purple, Orange, Cyan, Pink
        '#FFFFFF', '#000000', '#795548', '#607D8B' // White, Black, Brown, Grey
    ],
    POINTS: { MATCH_3: 100, MATCH_4: 300, MATCH_5: 500 },
    TARGET_SCORE_BASE: 3000 // ✅ Level 1 ka target
};

let gameState = {
    level: 1, score: 0, bestScore: 0, timeLeft: CONFIG.TIME_PER_LEVEL,
    board: [], selectedTile: null, isSwapping: false, isProcessing: false,
    timerInterval: null, moves: 0, combo: 0, targetScore: 3000,
    touchStart: null // ✅ Swipe ke liye
};

let boardEl, levelEl, scoreEl, bestEl, timerEl, winPopupEl, menuScreenEl, gameContainerEl, targetScoreEl;

document.addEventListener('DOMContentLoaded', () => {
    try {
        boardEl = document.getElementById('game-board');
        levelEl = document.getElementById('level');
        scoreEl = document.getElementById('score');
        bestEl = document.getElementById('best-score');
        timerEl = document.getElementById('timer-display');
        winPopupEl = document.getElementById('win-message');
        menuScreenEl = document.getElementById('menu-screen');
        gameContainerEl = document.getElementById('game-container');
        targetScoreEl = document.getElementById('target-score');

        if (!boardEl ||!gameContainerEl) {
            document.body.innerHTML = '<h1 style="color:red;text-align:center;margin-top:50px;">Game Error: Refresh karo.</h1>';
            return;
        }

        setTimeout(() => {
            document.querySelector('.door-left')?.classList.add('open');
            document.querySelector('.door-right')?.classList.add('open');
            setTimeout(() => document.body.classList.add('no-doors'), 800);
        }, 100);

        gameState.bestScore = parseInt(localStorage.getItem('vk_bestScore') || '0');
        loadProgress();
        updateUI();
        showMenu();
    } catch (error) {
        console.error('Init Error:', error);
        alert('Game load failed. Refresh karo.');
    }
});

function showMenu() {
    stopTimer();
    if (menuScreenEl) menuScreenEl.style.display = 'flex';
    if (gameContainerEl) gameContainerEl.style.display = 'none';
    if (winPopupEl) winPopupEl.style.display = 'none';
    const continueBtn = document.getElementById('continue-btn');
    if (localStorage.getItem('vk_savedBoard') && continueBtn) continueBtn.style.display = 'block';
}

function newGame() {
    clearSave();
    gameState.level = 1;
    gameState.score = 0;
    gameState.timeLeft = CONFIG.TIME_PER_LEVEL;
    startLevel();
}

function continueGame() { loadProgress(); startLevel(); }

function resetProgress() {
    if (confirm('Reset all progress? Level 1 se shuru hoga.')) {
        try { localStorage.clear(); location.reload(); }
        catch (e) { alert('Reset failed.'); }
    }
}

function startLevel() {
    if (menuScreenEl) menuScreenEl.style.display = 'none';
    if (gameContainerEl) gameContainerEl.style.display = 'flex';
    gameState.isProcessing = false;
    gameState.selectedTile = null;
    gameState.combo = 0;
    gameState.moves = 0;
    gameState.targetScore = CONFIG.TARGET_SCORE_BASE + (gameState.level - 1) * 2000; // ✅ Har level target badhega
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
                let tileType, tries = 0;
                do {
                    tileType = Math.floor(Math.random() * CONFIG.TILE_TYPES);
                    tries++;
                } while (tries < 50 && wouldCauseMatch(row, col, tileType));
                gameState.board[row][col] = {
                    type: tileType,
                    id: `${row}-${col}-${Date.now()}-${Math.random()}`,
                    matched: false
                };
            }
        }
        attempts++;
    } while (!hasPossibleMoves() && attempts < 100);
    if (!hasPossibleMoves()) forcePossibleMove();
}

function wouldCauseMatch(row, col, tileType) {
    if (col >= 2 && gameState.board[row][col-1]?.type === tileType && gameState.board[row][col-2]?.type === tileType) return true;
    if (row >= 2 && gameState.board[row-1][col]?.type === tileType && gameState.board[row-2][col]?.type === tileType) return true;
    return false;
}

function forcePossibleMove() {
    gameState.board[0][0].type = 0;
    gameState.board[0][1].type = 0;
    gameState.board[1][0].type = 0;
}

function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${CONFIG.COLS}, 1fr)`;
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            const tile = gameState.board[row][col];
            const tileEl = document.createElement('div');
            tileEl.className = 'tile ball-3d'; // ✅ 3D Ball class
            tileEl.dataset.row = row;
            tileEl.dataset.col = col;
            tileEl.style.setProperty('--ball-color', CONFIG.TILE_COLORS[tile.type]);
            if (tile.matched) tileEl.classList.add('matched');
            boardEl.appendChild(tileEl);
        }
    }
    addSwipeListeners(); // ✅ Swipe listeners har render pe
}

// ✅ SWIPE LOGIC - CANDY CRUSH STYLE
function addSwipeListeners() {
    boardEl.querySelectorAll('.tile').forEach(tile => {
        tile.addEventListener('touchstart', handleTouchStart, { passive: true });
        tile.addEventListener('touchmove', handleTouchMove, { passive: false });
        tile.addEventListener('touchend', handleTouchEnd);
        tile.addEventListener('mousedown', handleMouseDown);
    });
}

function handleTouchStart(e) {
    if (gameState.isProcessing || gameState.isSwapping) return;
    const touch = e.touches[0];
    const tile = e.target.closest('.tile');
    if (!tile) return;
    gameState.touchStart = {
        row: parseInt(tile.dataset.row),
        col: parseInt(tile.dataset.col),
        x: touch.clientX,
        y: touch.clientY
    };
}

function handleTouchMove(e) { if (gameState.touchStart) e.preventDefault(); }

function handleTouchEnd(e) {
    if (!gameState.touchStart || gameState.isProcessing || gameState.isSwapping) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - gameState.touchStart.x;
    const dy = touch.clientY - gameState.touchStart.y;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) { // Minimum swipe distance
        let targetRow = gameState.touchStart.row;
        let targetCol = gameState.touchStart.col;

        if (absDx > absDy) targetCol += dx > 0? 1 : -1;
        else targetRow += dy > 0? 1 : -1;

        if (targetRow >= 0 && targetRow < CONFIG.ROWS && targetCol >= 0 && targetCol < CONFIG.COLS) {
            swapTiles(
                { row: gameState.touchStart.row, col: gameState.touchStart.col },
                { row: targetRow, col: targetCol }
            );
        }
    }
    gameState.touchStart = null;
}

// Mouse support for desktop
function handleMouseDown(e) {
    if (gameState.isProcessing || gameState.isSwapping) return;
    const tile = e.target.closest('.tile');
    if (!tile) return;
    gameState.touchStart = {
        row: parseInt(tile.dataset.row),
        col: parseInt(tile.dataset.col),
        x: e.clientX,
        y: e.clientY
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e) { if (gameState.touchStart) e.preventDefault(); }

function handleMouseUp(e) {
    if (!gameState.touchStart) return;
    const dx = e.clientX - gameState.touchStart.x;
    const dy = e.clientY - gameState.touchStart.y;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) {
        let targetRow = gameState.touchStart.row;
        let targetCol = gameState.touchStart.col;
        if (absDx > absDy) targetCol += dx > 0? 1 : -1;
        else targetRow += dy > 0? 1 : -1;

        if (targetRow >= 0 && targetRow < CONFIG.ROWS && targetCol >= 0 && targetCol < CONFIG.COLS) {
            swapTiles(
                { row: gameState.touchStart.row, col: gameState.touchStart.col },
                { row: targetRow, col: targetCol }
            );
        }
    }
    gameState.touchStart = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
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

function findMatches() {
    const matchSet = new Set();
    const matches = [];
    for (let row = 0; row < CONFIG.ROWS; row++) {
        for (let col = 0; col < CONFIG.COLS - 2; col++) {
            if (gameState.board[row][col].matched) continue;
            const type = gameState.board[row][col].type;
            let matchLength = 1;
            for (let k = col + 1; k < CONFIG.COLS; k++) {
                if (gameState.board[row][k].type === type &&!gameState.board[row][k].matched) matchLength++;
                else break;
            }
            if (matchLength >= CONFIG.MATCH_COUNT) {
                for (let k = 0; k < matchLength; k++) {
                    const key = `${row}-${col + k}`;
                    if (!matchSet.has(key)) { matchSet.add(key); matches.push({ row, col: col + k }); }
                }
            }
        }
    }
    for (let col = 0; col < CONFIG.COLS; col++) {
        for (let row = 0; row < CONFIG.ROWS - 2; row++) {
            if (gameState.board[row][col].matched) continue;
            const type = gameState.board[row][col].type;
            let matchLength = 1;
            for (let k = row + 1; k < CONFIG.ROWS; k++) {
                if (gameState.board[k][col].type === type &&!gameState.board[k][col].matched) matchLength++;
                else break;
            }
            if (matchLength >= CONFIG.MATCH_COUNT) {
                for (let k = 0; k < matchLength; k++) {
                    const key = `${row + k}-${col}`;
                    if (!matchSet.has(key)) { matchSet.add(key); matches.push({ row: row + k, col }); }
                }
            }
        }
    }
    return matches;
}

function processMatches(matches) {
    if (matches.length === 0) {
        gameState.isProcessing = false;
        checkLevelComplete();
        return;
    }
    gameState.isProcessing = true;
    gameState.combo++;
    let points = 0;
    const matchCount = matches.length;
    if (matchCount === 3) points = CONFIG.POINTS.MATCH_3;
    else if (matchCount === 4) points = CONFIG.POINTS.MATCH_4;
    else points = CONFIG.POINTS.MATCH_5;
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
            if (newMatches.length > 0) processMatches(newMatches);
            else {
                gameState.combo = 0;
                gameState.isProcessing = false;
                checkLevelComplete();
                if (!hasPossibleMoves()) shuffleBoard();
            }
        }, 300);
    }, 400);
}

// ✅ FIXED DROP LOGIC - NO GAPS/LOOPS
function dropTiles() {
    for (let col = 0; col < CONFIG.COLS; col++) {
        let writeRow = CONFIG.ROWS - 1;
        for (let row = CONFIG.ROWS - 1; row >= 0; row--) {
            if (!gameState.board[row][col].matched) {
                if (writeRow!== row) {
                    gameState.board[writeRow][col] = gameState.board[row][col];
                    gameState.board[row][col] = { type: -1, matched: true, id: 'empty' };
                }
                writeRow--;
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
                    matched: false
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
                if (findMatches().length > 0) { swapInArray(row, col, row, col + 1); return true; }
                swapInArray(row, col, row, col + 1);
            }
            if (row < CONFIG.ROWS - 1) {
                swapInArray(row, col, row + 1, col);
                if (findMatches().length > 0) { swapInArray(row, col, row + 1, col); return true; }
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

// ✅ FIXED: SCORE = WIN, TIME = DEADLINE ONLY
function checkLevelComplete() {
    if (gameState.score >= gameState.targetScore) {
        levelComplete();
    }
}

function levelComplete() {
    stopTimer();
    gameState.isProcessing = true;
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        try { localStorage.setItem('vk_bestScore', gameState.bestScore); } catch (e) {}
    }
    showVictoryScreen();
    screenShake();
    createConfetti();
    setTimeout(() => {
        if (gameState.level >= CONFIG.LEVELS) gameComplete();
        else {
            gameState.level++;
            gameState.timeLeft = CONFIG.TIME_PER_LEVEL; // Reset timer for next level
            startLevel();
        }
    }, 3000);
}

function showVictoryScreen() {
    if (!winPopupEl) return;
    winPopupEl.innerHTML = `
        <h2>🎉 Level ${gameState.level} Complete! 🎉</h2>
        <p>Score: ${gameState.score} / ${gameState.targetScore}</p>
        <p>Moves: ${gameState.moves}</p>
        <button class="btn-primary" onclick="hideWinPopup()">Continue</button>
    `;
    winPopupEl.style.display = 'block';
}

function hideWinPopup() { if (winPopupEl) winPopupEl.style.display = 'none'; }

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

function showComboText(matchCount) {
    const comboEl = document.createElement('div');
    comboEl.className = 'combo-text';
    comboEl.textContent = matchCount >= 5? 'AMAZING!' : matchCount >= 4? 'GREAT!' : 'NICE!';
    document.body.appendChild(comboEl);
    setTimeout(() => comboEl.remove(), 1000);
}

function screenShake() {
    document.body.style.animation = 'shake 0.5s';
    setTimeout(() => { document.body.style.animation = ''; }, 500);
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
    setTimeout(() => { boardEl.style.animation = ''; }, 300);
}

function startTimer() {
    stopTimer();
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        if (gameState.timeLeft <= 0) gameOver(); // ✅ Time 0 = Lose
        else if (gameState.timeLeft <= 30) timerEl?.classList.add('danger');
        else if (gameState.timeLeft <= 60) timerEl?.classList.add('warning');
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
    if (timerEl) timerEl.textContent = `⏱️ ${mins}:${secs.toString().padStart(2, '0')}`;
}

function gameOver() {
    stopTimer();
    if (!winPopupEl) return;
    winPopupEl.innerHTML = `
        <h2>⏰ Time's Up!</h2>
        <p>Level: ${gameState.level}</p>
        <p>Score: ${gameState.score} / ${gameState.targetScore}</p>
        <p>You needed ${gameState.targetScore - gameState.score} more points!</p>
        <button class="btn-primary" onclick="newGame()">Try Again</button>
        <button class="btn-ghost" onclick="showMenu()">Main Menu</button>
    `;
    winPopupEl.style.display = 'block';
}

function getTileElement(row, col) {
    return boardEl?.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function updateUI() {
    if (levelEl) levelEl.textContent = gameState.level;
    if (scoreEl) scoreEl.textContent = gameState.score;
    if (bestEl) bestEl.textContent = gameState.bestScore;
    if (targetScoreEl) targetScoreEl.textContent = gameState.targetScore;
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
        gameState.score = 0;
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

function saveProgress() {
    try {
        localStorage.setItem('vk_level', gameState.level);
        localStorage.setItem('vk_score', gameState.score);
        localStorage.setItem('vk_timeLeft', gameState.timeLeft);
        localStorage.setItem('vk_savedBoard', JSON.stringify(gameState.board));
    } catch (e) { console.error('Save failed:', e); }
}

function loadProgress() {
    try {
        gameState.level = parseInt(localStorage.getItem('vk_level') || '1');
        gameState.score = parseInt(localStorage.getItem('vk_score') || '0');
        gameState.timeLeft = parseInt(localStorage.getItem('vk_timeLeft') || CONFIG.TIME_PER_LEVEL);
        const savedBoard = localStorage.getItem('vk_savedBoard');
        if (savedBoard) gameState.board = JSON.parse(savedBoard);
    } catch (e) {
        console.error('Load failed:', e);
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
    } catch (e) { console.error('Clear save failed:', e); }
}

setInterval(() => {
    if (gameContainerEl?.style.display!== 'none') saveProgress();
}, 10000);
