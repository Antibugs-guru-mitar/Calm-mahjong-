const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("win-message");
const levelText = document.getElementById("level");
const bestScoreText = document.getElementById("best-score");
const menuScreen = document.getElementById("menu-screen");
const gameContainer = document.getElementById("game-container");
const continueBtn = document.getElementById("continue-btn");

// PHASE 12: DOOR ELEMENTS - FIX
const doorLeft = document.querySelector('.door-left');
const doorRight = document.querySelector('.door-right');

// 🎮 GAME STATE
let gameState = "menu";

// 💾 SAFE LOAD
let level = parseInt(localStorage.getItem("level")) || 1;
let score = parseInt(localStorage.getItem("score")) || 0;
let bestScore = parseInt(localStorage.getItem("bestScore")) || 0;

// PHASE 12 VARIABLES
let firstTile = null;
let matchedTiles = 0;
let totalTiles = 0;
let combo = 0;
let lastMatchTime = 0;
let timerInterval = null;
let timeLeft = 60;
let isDarkMode = localStorage.getItem("darkMode") === "true";
let maxCombo = parseInt(localStorage.getItem("maxCombo")) || 0;
let totalGames = parseInt(localStorage.getItem("totalGames")) || 0;
let undoStack = [];
let zenMode = localStorage.getItem("zenMode") === "true";
let achievements = JSON.parse(localStorage.getItem("achievements")) || [];

// 🧩 Base tiles
const base = ["🍎","🍌","🍇","🍒","🍉","🍍","🥝","🍓","🥭","🍑","🍐","🥥"];

// BUG FIX 2: BETTER SHUFFLE
function shuffle(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// BUG FIX 2: MAHJONG FEEL - Kam pairs
function getLevelTiles(level) {
    let tiles = [];
    let pairs = Math.min(4 + level, 20);
    for (let i = 0; i < pairs; i++) {
        let item = base[i % base.length];
        tiles.push(item, item);
    }
    return tiles;
}

/* =========================
   🚪 PHASE 12: DOOR FIX
========================= */

function openDoor(callback) {
    if (!doorLeft ||!doorRight) return;
    doorLeft.classList.add('open');
    doorRight.classList.add('open');
    setTimeout(() => {
        doorLeft.style.pointerEvents = 'none';
        doorRight.style.pointerEvents = 'none';
        if(callback) callback();
    }, 800);
}

function closeDoor() {
    if (!doorLeft ||!doorRight) return;
    doorLeft.style.pointerEvents = 'auto';
    doorRight.style.pointerEvents = 'auto';
    setTimeout(() => {
        doorLeft.classList.remove('open');
        doorRight.classList.remove('open');
    }, 100);
}

/* =========================
   🧠 SCREEN CONTROL - FIXED
========================= */

function showGame() {
    closeDoor();
    setTimeout(() => {
        menuScreen.style.display = "none";
        gameContainer.style.display = "block";
        startParticleTrail();
        openDoor();
    }, 300);
}

function showMenu() {
    gameState = "menu";
    closeDoor();
    setTimeout(() => {
        menuScreen.style.display = "flex";
        gameContainer.style.display = "none";
        board.innerHTML = "";
        stopTimer();
        stopParticleTrail();
        checkContinueButton();
        checkDailyChallenge();
        checkAchievements();
        openDoor();
    }, 300);
}

/* =========================
   🎮 MENU BUTTONS
========================= */

function newGame() {
    level = 1;
    score = 0;
    combo = 0;
    undoStack = [];
    totalGames++;
    localStorage.setItem("totalGames", totalGames);
    localStorage.setItem("level", level);
    localStorage.setItem("score", score);
    localStorage.removeItem("savedBoard");
    localStorage.removeItem("savedMatched");
    showGame();
    startGame();
}

function continueGame() {
    const savedBoard = JSON.parse(localStorage.getItem("savedBoard"));
    const savedMatched = parseInt(localStorage.getItem("savedMatched")) || 0;
    undoStack = [];
    showGame();
    startGame(savedBoard, savedMatched);
}

/* =========================
   🎮 LEVEL START
========================= */

function showLevelStart() {
    winMessage.style.display = "block";
    winMessage.innerHTML = `
        <h2>🎮 Level ${level}</h2>
        <p>Get Ready...</p>
    `;
    setTimeout(() => {
        winMessage.style.display = "none";
    }, 700);
}

/* =========================
   🎮 START GAME - BUG FIX 1
========================= */

function startGame(savedBoard = null, savedMatched = 0) {
    gameState = "playing";
    board.innerHTML = "";
    matchedTiles = savedMatched;
    firstTile = null;
    combo = 0;
    undoStack = [];

    scoreText.innerText = score;
    levelText.innerText = level;
    bestScoreText.innerText = bestScore;

    showLevelStart();

    let shuffled;
    if (savedBoard) {
        shuffled = savedBoard;
        totalTiles = savedBoard.length;
    } else {
        shuffled = shuffle(getLevelTiles(level));
        totalTiles = shuffled.length;
        localStorage.removeItem("savedBoard");
        localStorage.removeItem("savedMatched");
    }

    shuffled.forEach(symbol => {
        if (symbol === "matched") return;
        let tile = document.createElement("div");
        tile.classList.add("tile");
        tile.innerText = symbol;
        tile.addEventListener("click", () => handleTileClick(tile));
        board.appendChild(tile);
    });

    // BUG FIX 1: DYNAMIC TIMER + ZEN MODE CHECK
    if (level >= 5 &&!savedBoard &&!zenMode) {
        timeLeft = 60 + (level - 5) * 10;
        timeLeft = Math.min(timeLeft, 180);
        startTimer();
    }

    saveCurrentBoard();
    checkAchievement('game_start');
}

/* =========================
   🎮 TILE LOGIC + UNDO
========================= */

function handleTileClick(tile) {
    if (gameState!== "playing") return;
    if (tile.classList.contains("matched")) return;
    if (tile === firstTile) return;

    if (navigator.vibrate) navigator.vibrate(30);

    if (!firstTile) {
        firstTile = tile;
        tile.classList.add("selected");
        return;
    }

    saveUndoState();

    if (firstTile.innerText === tile.innerText) {
        const now = Date.now();
        if (now - lastMatchTime < 2000) {
            combo++;
        } else {
            combo = 1;
        }
        lastMatchTime = now;
        const comboMultiplier = Math.min(combo, 5);

        firstTile.classList.add("matched");
        tile.classList.add("matched");
        firstTile.classList.remove("selected");

        score += 10 * comboMultiplier;
        matchedTiles += 2;

        if (combo > 1) showComboText(comboMultiplier);
        if (combo > maxCombo) {
            maxCombo = combo;
            localStorage.setItem("maxCombo", maxCombo);
        }

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("bestScore", bestScore);
            bestScoreText.innerText = bestScore;
        }

        localStorage.setItem("score", score);
        scoreText.innerText = score;

        checkAchievement('combo', combo);
        checkAchievement('match');

        if (matchedTiles === totalTiles) {
            gameState = "win";
            stopTimer();
            localStorage.removeItem("savedBoard");
            localStorage.removeItem("savedMatched");
            playVictoryJashan();
            checkAchievement('level_complete', level);

            setTimeout(() => {
                winMessage.style.display = "block";
                winMessage.innerHTML = `
                    <h2>🎉 Level ${level} Complete!</h2>
                    <p>Score: ${score}</p>
                    ${combo > 1? `<p>Max Combo: X${maxCombo} 🔥</p>` : ''}
                    ${!zenMode && level >= 5? `<p>Time: ${60 + (level - 5) * 10 - timeLeft}s</p>` : ''}
                    <button class="btn-primary" onclick="nextLevel()">Next Level</button>
                    <button class="btn-ghost" onclick="showMenu()">Main Menu</button>
                `;
            }, 400);
        }
    } else {
        combo = 0;
        firstTile.classList.remove("selected");
        tile.style.animation = "shake 0.3s";
        setTimeout(() => tile.style.animation = "", 300);
        undoStack.pop();
    }

    firstTile = null;
    saveCurrentBoard();
}

/* =========================
   ↩️ UNDO MOVE
========================= */

function saveUndoState() {
    const state = {
        board: board.innerHTML,
        score: score,
        combo: combo,
        matchedTiles: matchedTiles
    };
    undoStack.push(state);
    if (undoStack.length > 3) undoStack.shift();
}

function undoMove() {
    if (undoStack.length === 0) return;
    if (gameState!== "playing") return;

    const state = undoStack.pop();
    board.innerHTML = state.board;
    score = state.score;
    combo = state.combo;
    matchedTiles = state.matchedTiles;

    scoreText.innerText = score;

    board.querySelectorAll('.tile').forEach(tile => {
        if (!tile.classList.contains('matched')) {
            tile.addEventListener("click", () => handleTileClick(tile));
        }
    });

    showToast('↩️ Move Undone!');
}

/* =========================
   🎮 NEXT LEVEL
========================= */

function nextLevel() {
    level++;
    localStorage.setItem("level", level);
    winMessage.style.display = "none";
    startGame();
}

/* =========================
   🔄 RESET
========================= */

function restartGame() {
    winMessage.style.display = "none";
    localStorage.removeItem("savedBoard");
    localStorage.removeItem("savedMatched");
    stopTimer();
    startGame();
}

function resetProgress() {
    if (!confirm("Sara progress delete ho jaye ga. Pakka?")) return;
    localStorage.clear();
    level = 1;
    score = 0;
    bestScore = 0;
    combo = 0;
    maxCombo = 0;
    totalGames = 0;
    achievements = [];
    board.innerHTML = "";
    winMessage.style.display = "none";
    stopTimer();
    showMenu();
}

/* =========================
   💡 HINT & SHUFFLE
========================= */

function hint() {
    if (gameState!== "playing") return;
    const tiles = Array.from(board.querySelectorAll('.tile:not(.matched)'));
    if (tiles.length < 2) return;

    for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
            if (tiles[i].innerText === tiles[j].innerText) {
                tiles[i].style.boxShadow = "0 0 0 4px #00ff00";
                tiles[j].style.boxShadow = "0 0 0 4px #00ff00";
                setTimeout(() => {
                    tiles[i].style.boxShadow = "";
                    tiles[j].style.boxShadow = "";
                }, 1000);
                return;
            }
        }
    }
}

function shuffleBoard() {
    if (gameState!== "playing") return;
    saveUndoState();
    const tiles = Array.from(board.children);
    const symbols = tiles.map(t => t.innerText);
    const shuffledSymbols = shuffle(symbols);

    tiles.forEach((tile, i) => {
        if (!tile.classList.contains("matched")) {
            tile.innerText = shuffledSymbols[i];
            tile.style.animation = "fadeIn 0.3s";
        }
    });
    saveCurrentBoard();
}

/* =========================
   💾 BOARD SAVE
========================= */

function saveCurrentBoard() {
    const tiles = Array.from(board.children).map(tile => tile.innerText);
    localStorage.setItem("savedBoard", JSON.stringify(tiles));
    localStorage.setItem("savedMatched", matchedTiles);
}

/* =========================
   🔍 HELPER
========================= */

function checkContinueButton() {
    const savedLevel = localStorage.getItem("level");
    const savedScore = localStorage.getItem("score");
    const savedBoard = localStorage.getItem("savedBoard");
    if (savedLevel && savedScore && savedBoard) {
        continueBtn.style.display = "block";
    } else {
        continueBtn.style.display = "none";
    }
}

/* =========================
   🎉 VICTORY JASHAN
========================= */

function playVictoryJashan() {
    gameContainer.style.animation = "shake 0.5s";
    setTimeout(() => gameContainer.style.animation = "", 500);
    board.style.animation = "flash 0.3s";
    setTimeout(() => board.style.animation = "", 300);
    launchConfetti();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function launchConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6b6b', '#4ecdc4'];
    for (let i = 0; i < 50; i++) {
        createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
    }
}

function createConfettiPiece(color) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = color;
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.borderRadius = '50%';
    confetti.style.zIndex = '999';
    confetti.style.pointerEvents = 'none';
    document.body.appendChild(confetti);
    const animation = confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], {
        duration: Math.random() * 3000 + 2000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    animation.onfinish = () => confetti.remove();
}

/* =========================
   🔥 COMBO TEXT
========================= */

function showComboText(x) {
    const comboDiv = document.createElement('div');
    comboDiv.className = 'combo-text';
    comboDiv.innerText = `COMBO X${x}! 🔥`;
    document.body.appendChild(comboDiv);
    setTimeout(() => comboDiv.remove(), 1000);
}

/* =========================
   ⏱️ TIMER MODE - BUG FIX 1
========================= */

function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            gameOver();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    let timerEl = document.getElementById('timer-display');
    if (!timerEl) {
        timerEl = document.createElement('div');
        timerEl.id = 'timer-display';
        document.body.appendChild(timerEl);
    }
    timerEl.innerText = `⏱️ ${timeLeft}s`;
    if (timeLeft < 10) {
        timerEl.classList.add('danger');
        timerEl.classList.remove('warning');
    } else if (timeLeft < 20) {
        timerEl.classList.add('warning');
        timerEl.classList.remove('danger');
    } else {
        timerEl.classList.remove('warning', 'danger');
    }
}

function gameOver() {
    stopTimer();
    gameState = "gameover";
    winMessage.style.display = "block";
    winMessage.innerHTML = `
        <h2>⏰ Time's Up!</h2>
        <p>Score: ${score}</p>
        <button class="btn-primary" onclick="restartGame()">Try Again</button>
        <button class="btn-ghost" onclick="showMenu()">Main Menu</button>
    `;
    document.getElementById('timer-display')?.remove();
}

/* =========================
   ✨ PARTICLE TRAIL
========================= */

let particles = [];
let mouseX = 0, mouseY = 0;

function startParticleTrail() {
    document.addEventListener('mousemove', updateMousePos);
    document.addEventListener('touchmove', updateTouchPos);
    requestAnimationFrame(createTrailParticle);
}

function stopParticleTrail() {
    document.removeEventListener('mousemove', updateMousePos);
    document.removeEventListener('touchmove', updateTouchPos);
    particles.forEach(p => p.remove());
    particles = [];
}

function updateMousePos(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

function updateTouchPos(e) {
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
}

function createTrailParticle() {
    if (gameState!== "playing") return;
    if (Math.random() > 0.7) {
        const particle = document.createElement('div');
        particle.className = 'trail-particle';
        particle.style.left = mouseX + 'px';
        particle.style.top = mouseY + 'px';
        document.body.appendChild(particle);
        particles.push(particle);
        setTimeout(() => {
            particle.remove();
            particles = particles.filter(p => p!== particle);
        }, 1000);
    }
    requestAnimationFrame(createTrailParticle);
}

/* =========================
   📅 DAILY CHALLENGE
========================= */

function checkDailyChallenge() {
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem("lastPlayedDate");
    const existingBtn = document.getElementById('daily-btn');
    if (existingBtn) existingBtn.remove();

    if (lastPlayed!== today) {
        const dailyBtn = document.createElement('button');
        dailyBtn.id = 'daily-btn';
        dailyBtn.className = 'btn-primary';
        dailyBtn.innerHTML = '📅 Daily Challenge';
        dailyBtn.onclick = startDailyChallenge;
        dailyBtn.style.marginTop = '10px';
        document.querySelector('.menu-buttons').appendChild(dailyBtn);
    }
}

function startDailyChallenge() {
    const today = new Date().toDateString();
    localStorage.setItem("lastPlayedDate", today);
    level = new Date().getDate();
    score = 0;
    undoStack = [];
    localStorage.setItem("level", level);
    localStorage.setItem("score", score);
    showGame();
    startGame();
}

/* =========================
   🌙 THEME SWITCHER
========================= */

function toggleTheme() {
    isDarkMode =!isDarkMode;
    localStorage.setItem("darkMode", isDarkMode);
    applyTheme();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDarkMode? 'dark' : 'light');
}

/* =========================
   🧘 ZEN MODE
========================= */

function toggleZenMode() {
    zenMode =!zenMode;
    localStorage.setItem("zenMode", zenMode);
    showToast(zenMode? '🧘 Zen Mode ON - No Timer' : '🎮 Normal Mode ON');
}

/* =========================
   🏆 ACHIEVEMENTS
========================= */

const ACHIEVEMENTS = {
    first_win: { name: 'First Win', desc: 'Complete your first level', icon: '🎉' },
    combo_5: { name: 'Combo Master', desc: 'Get a 5x combo', icon: '🔥' },
    level_10: { name: 'Level 10', desc: 'Reach level 10', icon: '🏆' },
    level_20: { name: 'Level 20', desc: 'Reach level 20', icon: '💎' },
    score_1000: { name: '1000 Points', desc: 'Score 1000 points', icon: '💯' },
    no_undo: { name: 'Perfect', desc: 'Complete level without undo', icon: '✨' }
};

function checkAchievement(type, value) {
    let newAchievement = null;

    if (type === 'game_start' && totalGames === 1 &&!achievements.includes('first_game')) {
        newAchievement = 'first_game';
    } else if (type === 'combo' && value >= 5 &&!achievements.includes('combo_5')) {
        newAchievement = 'combo_5';
    } else if (type === 'level_complete' && value === 10 &&!achievements.includes('level_10')) {
        newAchievement = 'level_10';
    } else if (type === 'level_complete' && value === 20 &&!achievements.includes('level_20')) {
        newAchievement = 'level_20';
    } else if (type === 'match' && score >= 1000 &&!achievements.includes('score_1000')) {
        newAchievement = 'score_1000';
    }

    if (newAchievement) {
        achievements.push(newAchievement);
        localStorage.setItem("achievements", JSON.stringify(achievements));
        showAchievementToast(ACHIEVEMENTS[newAchievement]);
    }
}

function showAchievementToast(ach) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-text">
            <b>Achievement Unlocked!</b>
            <p>${ach.name}</p>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function checkAchievements() {}

/* =========================
   📊 STATS
========================= */

function showStats() {
    winMessage.style.display = "block";
    winMessage.innerHTML = `
        <h2>📊 Your Stats</h2>
        <div class="stats-grid">
            <div class="stat-item"><b>${totalGames}</b><span>Games Played</span></div>
            <div class="stat-item"><b>${level}</b><span>Highest Level</span></div>
            <div class="stat-item"><b>${bestScore}</b><span>Best Score</span></div>
            <div class="stat-item"><b>X${maxCombo}</b><span>Best Combo</span></div>
            <div class="stat-item"><b>${achievements.length}</b><span>Achievements</span></div>
        </div>
        <button class="btn-primary" onclick="winMessage.style.display='none'">Close</button>
    `;
}

/* =========================
   🔔 TOAST
========================= */

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

/* =========================
   🚀 INIT
========================= */

const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
@keyframes flash {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.5); }
}
@keyframes comboPop {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
}
@keyframes particleFade {
  to { opacity: 0; transform: scale(0); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes popupIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
`;
document.head.appendChild(style);

applyTheme();

const btnContainer = document.createElement('div');
btnContainer.style.display = 'flex';
btnContainer.style.gap = '10px';
btnContainer.style.marginTop = '10px';

const themeBtn = document.createElement('button');
themeBtn.className = 'btn-ghost';
themeBtn.innerHTML = isDarkMode? '☀️ Light' : '🌙 Dark';
themeBtn.onclick = () => {
    toggleTheme();
    themeBtn.innerHTML = isDarkMode? '☀️ Light' : '🌙 Dark';
};

const zenBtn = document.createElement('button');
zenBtn.className = 'btn-ghost';
zenBtn.innerHTML = zenMode? '🎮 Normal' : '🧘 Zen';
zenBtn.onclick = () => {
    toggleZenMode();
    zenBtn.innerHTML = zenMode? '🎮 Normal' : '🧘 Zen';
};

const statsBtn = document.createElement('button');
statsBtn.className = 'btn-ghost';
statsBtn.innerHTML = '📊 Stats';
statsBtn.onclick = showStats;

const undoBtn = document.createElement('button');
undoBtn.className = 'btn-ghost';
undoBtn.innerHTML = '↩️ Undo';
undoBtn.onclick = undoMove;
undoBtn.style.display = 'none';
undoBtn.id = 'undo-btn';

btnContainer.appendChild(themeBtn);
btnContainer.appendChild(zenBtn);
btnContainer.appendChild(statsBtn);

showMenu();
setTimeout(() => {
    document.querySelector('.menu-buttons')?.appendChild(btnContainer);
    document.querySelector('.controls')?.appendChild(undoBtn);
}, 100);

const originalShowGame = showGame;
showGame = function() {
    originalShowGame();
    document.getElementById('undo-btn').style.display = 'block';
};
