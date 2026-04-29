const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("win-message");
const levelText = document.getElementById("level");
const bestScoreText = document.getElementById("best-score");
const menuScreen = document.getElementById("menu-screen");
const gameContainer = document.getElementById("game-container");
const continueBtn = document.getElementById("continue-btn");
const doorLeft = document.querySelector('.door-left');
const doorRight = document.querySelector('.door-right');

// 🎮 GAME STATE
let gameState = "menu";

// 💾 SAFE LOAD
let level = parseInt(localStorage.getItem("level")) || 1;
let score = parseInt(localStorage.getItem("score")) || 0;
let bestScore = parseInt(localStorage.getItem("bestScore")) || 0;

// PHASE 13 VARIABLES
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

// UPGRADE 9: STREAK
let streak = parseInt(localStorage.getItem("streak")) || 0;
// UPGRADE 10: TILE SKINS
let currentSkin = localStorage.getItem("tileSkin") || "fruit";
// UPGRADE 12: SOUND
let soundOn = localStorage.getItem("soundOn")!== "false";
// UPGRADE 14: OFFLINE REWARDS
let lastOnlineTime = parseInt(localStorage.getItem("lastOnlineTime")) || Date.now();
// UPGRADE 15: DAILY SPIN
let lastSpinDate = localStorage.getItem("lastSpinDate") || "";
// UPGRADE 22: GEMS + COINS
let coins = parseInt(localStorage.getItem("coins")) || 100;
let gems = parseInt(localStorage.getItem("gems")) || 5;

// UPGRADE 10: TILE SKINS DATA
const TILE_SKINS = {
    fruit: ["🍎","🍌","🍇","🍒","🍉","🍍","🥝","🍓","🥭","🍑","🍐","🥥"],
    animals: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮"],
    neon: ["🔵","🔴","🟢","🟡","🟠","🟣","⚫","⚪","🟤","🔶","🔷","🔺"],
    mahjong: ["🀄","🀅","🀆","🀇","🀈","🀉","🀊","🀋","🀌","🀍","🀎","🀏"]
};

let base = TILE_SKINS[currentSkin];

// UPGRADE 13: SPECIAL TILES
const SPECIAL_TILES = {
    bomb: "💣",
    ice: "🧊",
    rainbow: "🌈"
};
let specialTileChance = 0.1;
let iceFreeze = 0;

// UPGRADE 16: LEVEL MAP DATA
const LEVEL_MAP = Array.from({length: 100}, (_, i) => ({
    level: i + 1,
    stars: parseInt(localStorage.getItem(`level_${i+1}_stars`)) || 0,
    locked: i > 0 &&!localStorage.getItem(`level_${i}_stars`)
}));

// UPGRADE 11: LEADERBOARD - LOCAL FOR NOW
let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

// UPGRADE 15: DAILY SPIN PRIZES
const SPIN_PRIZES = [
    {type: 'coins', amount: 50, chance: 0.4, text: '50 Coins'},
    {type: 'coins', amount: 100, chance: 0.25, text: '100 Coins'},
    {type: 'gems', amount: 1, chance: 0.2, text: '1 Gem'},
    {type: 'gems', amount: 5, chance: 0.1, text: '5 Gems JACKPOT'},
    {type: 'undo', amount: 3, chance: 0.05, text: '3 Free Undo'}
];

function shuffle(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getLevelTiles(level) {
    let tiles = [];
    let pairs = Math.min(4 + level, 20);
    let skinTiles = TILE_SKINS[currentSkin];

    for (let i = 0; i < pairs; i++) {
        let item = skinTiles[i % skinTiles.length];
        tiles.push(item, item);
    }

    // UPGRADE 13: SPECIAL TILES ADD
    if (level >= 3 && Math.random() < specialTileChance) {
        const special = Object.values(SPECIAL_TILES)[Math.floor(Math.random() * 3)];
        tiles[Math.floor(Math.random() * tiles.length)] = special;
        tiles[Math.floor(Math.random() * tiles.length)] = special;
    }

    return tiles;
}

/* =========================
   🚪 DOOR ANIMATION
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
   🧠 SCREEN CONTROL
========================= */

function showGame() {
    closeDoor();
    setTimeout(() => {
        menuScreen.style.display = "none";
        gameContainer.style.display = "block";
        startParticleTrail();
        checkOfflineRewards(); // UPGRADE 14
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
        checkDailySpin(); // UPGRADE 15
        checkAchievements();
        updateCurrencyDisplay();
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
    streak = 0;
    localStorage.setItem("totalGames", totalGames);
    localStorage.setItem("level", level);
    localStorage.setItem("score", score);
    localStorage.setItem("streak", streak);
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
        ${streak > 0? `<p>🔥 Streak: ${streak} | 2x Coins!</p>` : ''}
        <p>Get Ready...</p>
    `;
    playSound('start');
    setTimeout(() => {
        winMessage.style.display = "none";
    }, 700);
}

/* =========================
   🎮 START GAME
========================= */

function startGame(savedBoard = null, savedMatched = 0) {
    gameState = "playing";
    board.innerHTML = "";
    matchedTiles = savedMatched;
    firstTile = null;
    combo = 0;
    undoStack = [];
    iceFreeze = 0;

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

        if (Object.values(SPECIAL_TILES).includes(symbol)) {
            tile.classList.add("special-tile");
            tile.dataset.special = Object.keys(SPECIAL_TILES).find(k => SPECIAL_TILES[k] === symbol);
        }

        tile.addEventListener("click", () => handleTileClick(tile));
        board.appendChild(tile);
    });

    if (level >= 5 &&!savedBoard &&!zenMode) {
        timeLeft = 60 + (level - 5) * 10;
        timeLeft = Math.min(timeLeft, 180);
        startTimer();
    }

    saveCurrentBoard();
    checkAchievement('game_start');
}

/* =========================
   🎮 TILE LOGIC + SPECIAL
========================= */

function handleTileClick(tile) {
    if (gameState!== "playing") return;
    if (tile.classList.contains("matched")) return;
    if (tile === firstTile) return;
    if (iceFreeze > 0) {
        iceFreeze--;
        showToast(`🧊 Frozen! ${iceFreeze} moves left`);
        return;
    }

    if (navigator.vibrate) navigator.vibrate(30);

    if (!firstTile) {
        firstTile = tile;
        tile.classList.add("selected");
        return;
    }

    saveUndoState();

    const isSpecial = tile.dataset.special || firstTile.dataset.special;
    const isRainbow = tile.innerText === SPECIAL_TILES.rainbow || firstTile.innerText === SPECIAL_TILES.rainbow;
    const isMatch = firstTile.innerText === tile.innerText || isRainbow;

    if (isMatch) {
        if (isSpecial) {
            handleSpecialTile(firstTile.dataset.special || tile.dataset.special);
        }

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

        let coinGain = 10 * comboMultiplier;
        if (streak >= 3) coinGain *= 2;

        score += coinGain;
        coins += Math.floor(coinGain / 10);
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
        localStorage.setItem("coins", coins);
        scoreText.innerText = score;
        updateCurrencyDisplay();

        playSound('match');
        checkAchievement('combo', combo);
        checkAchievement('match');

        if (matchedTiles === totalTiles) {
            gameState = "win";
            stopTimer();
            localStorage.removeItem("savedBoard");
            localStorage.removeItem("savedMatched");

            streak++;
            localStorage.setItem("streak", streak);

            const stars = timeLeft > 30? 3 : timeLeft > 10? 2 : 1;
            const oldStars = parseInt(localStorage.getItem(`level_${level}_stars`)) || 0;
            localStorage.setItem(`level_${level}_stars`, Math.max(stars, oldStars));

            updateLeaderboard(); // UPGRADE 11

            playVictoryJashan();
            checkAchievement('level_complete', level);

            setTimeout(() => {
                winMessage.style.display = "block";
                winMessage.innerHTML = `
                    <h2>🎉 Level ${level} Complete!</h2>
                    <p>Score: ${score} | Coins: +${Math.floor(coinGain / 10)}</p>
                    ${combo > 1? `<p>Max Combo: X${maxCombo} 🔥</p>` : ''}
                    ${streak >= 3? `<p>🔥 Streak: ${streak} | 2x Coins Active!</p>` : ''}
                    <p>⭐ Stars: ${'⭐'.repeat(stars)}</p>
                    <button class="btn-primary" onclick="nextLevel()">Next Level</button>
                    <button class="btn-ghost" onclick="showLevelMap()">Level Map</button>
                    <button class="btn-ghost" onclick="showLeaderboard()">Leaderboard</button>
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
        playSound('wrong');
    }

    firstTile = null;
    saveCurrentBoard();
}/* =========================
   💣 UPGRADE 13: SPECIAL TILES
========================= */

function handleSpecialTile(type) {
    const tiles = Array.from(board.querySelectorAll('.tile:not(.matched)'));

    if (type === 'bomb') {
        for (let i = 0; i < 3 && tiles.length > 0; i++) {
            const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
            randomTile.classList.add('matched');
            matchedTiles++;
            tiles.splice(tiles.indexOf(randomTile), 1);
        }
        showToast('💣 Bomb! 3 tiles cleared!');
        playSound('bomb');
    } else if (type === 'ice') {
        iceFreeze = 2;
        showToast('🧊 Ice! Next 2 moves safe!');
    } else if (type === 'rainbow') {
        showToast('🌈 Rainbow! Any match!');
    }
}

/* =========================
   ↩️ UNDO MOVE - COIN COST
========================= */

function saveUndoState() {
    const state = {
        board: board.innerHTML,
        score: score,
        combo: combo,
        matchedTiles: matchedTiles,
        coins: coins
    };
    undoStack.push(state);
    if (undoStack.length > 3) undoStack.shift();
}

function undoMove() {
    if (undoStack.length === 0) return;
    if (gameState!== "playing") return;
    if (coins < 5) {
        showToast('❌ Need 5 coins for Undo!');
        return;
    }

    const state = undoStack.pop();
    board.innerHTML = state.board;
    score = state.score;
    combo = state.combo;
    matchedTiles = state.matchedTiles;
    coins -= 5;

    scoreText.innerText = score;
    localStorage.setItem("coins", coins);
    updateCurrencyDisplay();

    board.querySelectorAll('.tile').forEach(tile => {
        if (!tile.classList.contains('matched')) {
            tile.addEventListener("click", () => handleTileClick(tile));
        }
    });

    showToast('↩️ Move Undone! -5 coins');
    playSound('undo');
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
    streak = 0;
    coins = 100;
    gems = 5;
    board.innerHTML = "";
    winMessage.style.display = "none";
    stopTimer();
    showMenu();
}

/* =========================
   💡 HINT & SHUFFLE - COIN COST
========================= */

function hint() {
    if (gameState!== "playing") return;
    if (coins < 10) {
        showToast('❌ Need 10 coins for Hint!');
        return;
    }

    coins -= 10;
    localStorage.setItem("coins", coins);
    updateCurrencyDisplay();

    const tiles = Array.from(board.querySelectorAll('.tile:not(.matched)'));
    if (tiles.length < 2) return;

    for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
            if (tiles[i].innerText === tiles[j].innerText ||
                tiles[i].innerText === SPECIAL_TILES.rainbow ||
                tiles[j].innerText === SPECIAL_TILES.rainbow) {
                tiles[i].style.boxShadow = "0 0 0 4px #00ff00";
                tiles[j].style.boxShadow = "0 0 0 4px #00ff00";
                setTimeout(() => {
                    tiles[i].style.boxShadow = "";
                    tiles[j].style.boxShadow = "";
                }, 1000);
                playSound('hint');
                return;
            }
        }
    }
}

function shuffleBoard() {
    if (gameState!== "playing") return;
    if (coins < 15) {
        showToast('❌ Need 15 coins for Shuffle!');
        return;
    }

    coins -= 15;
    localStorage.setItem("coins", coins);
    updateCurrencyDisplay();

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
    playSound('shuffle');
}

/* =========================
   💾 BOARD SAVE
========================= */

function saveCurrentBoard() {
    const tiles = Array.from(board.children).map(tile => tile.innerText);
    localStorage.setItem("savedBoard", JSON.stringify(tiles));
    localStorage.setItem("savedMatched", matchedTiles);
    localStorage.setItem("lastOnlineTime", Date.now());
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

// UPGRADE 22: CURRENCY DISPLAY
function updateCurrencyDisplay() {
    let currencyEl = document.getElementById('currency-display');
    if (!currencyEl) {
        currencyEl = document.createElement('div');
        currencyEl.id = 'currency-display';
        currencyEl.style.position = 'fixed';
        currencyEl.style.top = '20px';
        currencyEl.style.left = '20px';
        currencyEl.style.background = 'var(--glass)';
        currencyEl.style.backdropFilter = 'blur(12px)';
        currencyEl.style.padding = '10px 20px';
        currencyEl.style.borderRadius = '12px';
        currencyEl.style.boxShadow = 'var(--shadow)';
        currencyEl.style.zIndex = '100';
        currencyEl.style.border = '2px solid var(--glass-border)';
        currencyEl.style.fontFamily = 'Cinzel, serif';
        currencyEl.style.fontWeight = '700';
        currencyEl.style.color = 'var(--text-gold)';
        document.body.appendChild(currencyEl);
    }
    currencyEl.innerHTML = `🪙 ${coins} | 💎 ${gems}`;
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
    playSound('win');
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
   ⏱️ TIMER MODE
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
    streak = 0;
    localStorage.setItem("streak", streak);
    winMessage.style.display = "block";
    winMessage.innerHTML = `
        <h2>⏰ Time's Up!</h2>
        <p>Score: ${score}</p>
        <p>🔥 Streak Lost!</p>
        <button class="btn-primary" onclick="restartGame()">Try Again</button>
        <button class="btn-ghost" onclick="showMenu()">Main Menu</button>
    `;
    document.getElementById('timer-display')?.remove();
    playSound('lose');
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
    no_undo: { name: 'Perfect', desc: 'Complete level without undo', icon: '✨' },
    streak_5: { name: 'Hot Streak', desc: 'Win 5 levels in a row', icon: '🔥' }
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
    } else if (type === 'level_complete' && streak >= 5 &&!achievements.includes('streak_5')) {
        newAchievement = 'streak_5';
    }

    if (newAchievement) {
        achievements.push(newAchievement);
        localStorage.setItem("achievements", JSON.stringify(achievements));
        showAchievementToast(ACHIEVEMENTS[newAchievement]);
        gems += 2;
        localStorage.setItem("gems", gems);
        updateCurrencyDisplay();
    }
}

function showAchievementToast(ach) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-text">
            <b>Achievement Unlocked!</b>
            <p>${ach.name} +2💎</p>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
    playSound('achievement');
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
            <div class="stat-item"><b>${streak}</b><span>Current Streak</span></div>
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
   🎵 UPGRADE 12: SOUND SYSTEM
========================= */

const SOUNDS = {
    match: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    wrong: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    win: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    bomb: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    start: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    undo: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    hint: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    shuffle: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    achievement: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    lose: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    spin: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='),
    coin: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=')
};

function playSound(type) {
    if (!soundOn ||!SOUNDS[type]) return;
    SOUNDS[type].currentTime = 0;
    SOUNDS[type].play().catch(e => {});
}

function toggleSound() {
    soundOn =!soundOn;
    localStorage.setItem("soundOn", soundOn);
    showToast(soundOn? '🔊 Sound ON' : '🔇 Sound OFF');
}

/* =========================
   🎨 UPGRADE 10: TILE SKINS
========================= */

function changeSkin(skinName) {
    if (!TILE_SKINS[skinName]) return;
    currentSkin = skinName;
    base = TILE_SKINS[skinName];
    localStorage.setItem("tileSkin", skinName);
    showToast(`🎨 Skin: ${skinName.toUpperCase()}`);
    if (gameState === "playing") {
        restartGame();
    }
}

function showSkinSelector() {
    winMessage.style.display = "block";
    let skinButtons = Object.keys(TILE_SKINS).map(skin =>
        `<button class="btn-secondary" onclick="changeSkin('${skin}')" style="margin: 5px;">
            ${skin === currentSkin? '✅ ' : ''}${skin.toUpperCase()}
        </button>`
    ).join('');

    winMessage.innerHTML = `
        <h2>🎨 Choose Skin</h2>
        <p>Cost: Free</p>
        <div>${skinButtons}</div>
        <button class="btn-primary" onclick="winMessage.style.display='none'">Close</button>
    `;
}

/* =========================
   🎁 UPGRADE 14: OFFLINE REWARDS
========================= */

function checkOfflineRewards() {
    const now = Date.now();
    const offlineTime = now - lastOnlineTime;
    const hoursOffline = Math.floor(offlineTime / (1000 * 60 * 60));

    if (hoursOffline >= 1) {
        const rewardCoins = Math.min(hoursOffline * 10, 100);
        const rewardGems = Math.floor(hoursOffline / 8);
        coins += rewardCoins;
        gems += rewardGems;
        localStorage.setItem("coins", coins);
        localStorage.setItem("gems", gems);
        updateCurrencyDisplay();

        setTimeout(() => {
            showToast(`🎁 Welcome Back! +${rewardCoins}🪙 ${rewardGems > 0? `+${rewardGems}💎` : ''}`);
            playSound('coin');
        }, 1500);
    }
    lastOnlineTime = now;
    localStorage.setItem("lastOnlineTime", lastOnlineTime);
}

/* =========================
   🎰 UPGRADE 15: DAILY SPIN
========================= */

function checkDailySpin() {
    const today = new Date().toDateString();
    const existingBtn = document.getElementById('spin-btn');
    if (existingBtn) existingBtn.remove();

    if (lastSpinDate!== today) {
        const spinBtn = document.createElement('button');
        spinBtn.id = 'spin-btn';
        spinBtn.className = 'btn-primary';
        spinBtn.innerHTML = '🎰 Daily Spin';
        spinBtn.onclick = dailySpin;
        spinBtn.style.marginTop = '10px';
        document.querySelector('.menu-buttons').appendChild(spinBtn);
    }
}

function dailySpin() {
    const today = new Date().toDateString();
    if (lastSpinDate === today) {
        showToast('❌ Already spun today!');
        return;
    }

    playSound('spin');
    const rand = Math.random();
    let prize;
    let cumulative = 0;

    for (let p of SPIN_PRIZES) {
        cumulative += p.chance;
        if (rand < cumulative) {
            prize = p;
            break;
        }
    }

    lastSpinDate = today;
    localStorage.setItem("lastSpinDate", lastSpinDate);

    if (prize.type === 'coins') {
        coins += prize.amount;
        localStorage.setItem("coins", coins);
    } else if (prize.type === 'gems') {
        gems += prize.amount;
        localStorage.setItem("gems", gems);
    }

    updateCurrencyDisplay();
    document.getElementById('spin-btn')?.remove();

    winMessage.style.display = "block";
    winMessage.innerHTML = `
        <h2>🎰 You Won!</h2>
        <p style="font-size: 40px; margin: 20px 0;">${prize.text}</p>
        <button class="btn-primary" onclick="winMessage.style.display='none'">Awesome!</button>
    `;
    playSound('coin');
}

/* =========================
   🗺️ UPGRADE 16: LEVEL MAP
========================= */

function showLevelMap() {
    winMessage.style.display = "block";
    let mapHTML = '<h2>🗺️ Level Map</h2><div class="level-map">';

    for (let i = 0; i < Math.min(level + 5, 100); i++) {
        const lvl = LEVEL_MAP[i];
        const locked = lvl.locked && i > 0;
        const stars = '⭐'.repeat(lvl.stars);
        mapHTML += `
            <button class="level-btn ${locked? 'locked' : ''}"
                    onclick="${locked? '' : `loadLevel(${lvl.level})`}"
                    ${locked? 'disabled' : ''}>
                <b>${lvl.level}</b>
                <span>${locked? '🔒' : stars || '○'}</span>
            </button>
        `;
    }

    mapHTML += '</div><button class="btn-primary" onclick="winMessage.style.display=\'none\'">Close</button>';
    winMessage.innerHTML = mapHTML;
}

function loadLevel(lvl) {
    if (LEVEL_MAP[lvl-1].locked) return;
    level = lvl;
    localStorage.setItem("level", level);
    winMessage.style.display = "none";
    startGame();
}

/* =========================
   👑 UPGRADE 11: LEADERBOARD
========================= */

function updateLeaderboard() {
    const playerName = localStorage.getItem("playerName") || "Player" + Math.floor(Math.random() * 9999);
    localStorage.setItem("playerName", playerName);

    const entry = { name: playerName, score: score, level: level, date: Date.now() };
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function showLeaderboard() {
    winMessage.style.display = "block";
    let boardHTML = '<h2>👑 Leaderboard</h2><div class="leaderboard-list">';

    if (leaderboard.length === 0) {
        boardHTML += '<p>No scores yet. Be the first!</p>';
    } else {
        leaderboard.forEach((entry, i) => {
            boardHTML += `
                <div class="leader-item">
                    <span class="rank">${i+1}</span>
                    <span class="name">${entry.name}</span>
                    <span class="score">${entry.score}</span>
                    <span class="lvl">L${entry.level}</span>
                </div>
            `;
        });
    }

    boardHTML += '</div><button class="btn-primary" onclick="winMessage.style.display=\'none\'">Close</button>';
    winMessage.innerHTML = boardHTML;
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
.special-tile {
  animation: glow 1s infinite alternate;
  border: 2px solid gold!important;
}
@keyframes glow {
  from { box-shadow: 0 0 5px gold; }
  to { box-shadow: 0 0 20px gold, 0 0 30px orange; }
}
.level-map {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
}
.level-btn {
  background: var(--glass);
  border: 2px solid var(--glass-border);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: 0.2s;
}
.level-btn:hover:not(.locked) {
  transform: scale(1.05);
  border-color: gold;
}
.level-btn.locked {
  opacity: 0.5;
  cursor: not-allowed;
}
.level-btn b {
  font-size: 18px;
  color: var(--text-gold);
}
.level-btn span {
  font-size: 12px;
}
.leaderboard-list {
  max-height: 300px;
  overflow-y: auto;
  text-align: left;
}
.leader-item {
  display: grid;
  grid-template-columns: 30px 1fr 80px 50px;
  gap: 10px;
  padding: 10px;
  background: rgba(0,0,0,0.2);
  margin: 5px 0;
  border-radius: 8px;
  align-items: center;
}
.leader-item.rank {
  font-weight: bold;
  color: var(--text-gold);
}
.leader-item.score {
  font-weight: bold;
}
`;
document.head.appendChild(style);

applyTheme();

const btnContainer = document.createElement('div');
btnContainer.style.display = 'flex';
btnContainer.style.gap = '10px';
btnContainer.style.marginTop = '10px';
btnContainer.style.flexWrap = 'wrap';

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

const skinBtn = document.createElement('button');
skinBtn.className = 'btn-ghost';
skinBtn.innerHTML = '🎨 Skins';
skinBtn.onclick = showSkinSelector;

const soundBtn = document.createElement('button');
soundBtn.className = 'btn-ghost';
soundBtn.innerHTML = soundOn? '🔊 Sound' : '🔇 Mute';
soundBtn.onclick = () => {
    toggleSound();
    soundBtn.innerHTML = soundOn? '🔊 Sound' : '🔇 Mute';
};

const undoBtn = document.createElement('button');
undoBtn.className = 'btn-ghost';
undoBtn.innerHTML = '↩️ Undo';
undoBtn.onclick = undoMove;
undoBtn.style.display = 'none';
undoBtn.id = 'undo-btn';

btnContainer.appendChild(themeBtn);
btnContainer.appendChild(zenBtn);
btnContainer.appendChild(statsBtn);
btnContainer.appendChild(skinBtn);
btnContainer.appendChild(soundBtn);

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
/* =========================
   🎰 UPGRADE 15: DAILY SPIN
========================= */

function checkDailySpin() {
    const today = new Date().toDateString();
    const existingBtn = document.getElementById('spin-btn');
    if (existingBtn) existingBtn.remove();

    if (lastSpinDate!== today) {
        const spinBtn = document.createElement('button');
        spinBtn.id = 'spin-btn';
        spinBtn.className = 'btn-primary';
        spinBtn.innerHTML = '🎰 Daily Spin';
        spinBtn.onclick = dailySpin;
        spinBtn.style.marginTop = '10px';
        document.querySelector('.menu-buttons').appendChild(spinBtn);
    }
}

function dailySpin() {
    const today = new Date().toDateString();
    if (lastSpinDate === today) {
        showToast('❌ Already spun today!');
        return;
    }

    playSound('spin');
    const rand = Math.random();
    let prize;
    let cumulative = 0;

    for (let p of SPIN_PRIZES) {
        cumulative += p.chance;
        if (rand < cumulative) {
            prize = p;
            break;
        }
    }

    lastSpinDate = today;
    localStorage.setItem("lastSpinDate", lastSpinDate);

    if (prize.type === 'coins') {
        coins += prize.amount;
        localStorage.setItem("coins", coins);
    } else if (prize.type === 'gems') {
        gems += prize.amount;
        localStorage.setItem("gems", gems);
    }

    updateCurrencyDisplay();
    document.getElementById('spin-btn')?.remove();

    winMessage.style.display = "block";
    winMessage.innerHTML = `
        <h2>🎰 You Won!</h2>
        <p style="font-size: 40px; margin: 20px 0;">${prize.text}</p>
        <button class="btn-primary" onclick="winMessage.style.display='none'">Awesome!</button>
    `;
    playSound('coin');
}

/* =========================
   🗺️ UPGRADE 16: LEVEL MAP
========================= */

function showLevelMap() {
    winMessage.style.display = "block";
    let mapHTML = '<h2>🗺️ Level Map</h2><div class="level-map">';

    for (let i = 0; i < Math.min(level + 5, 100); i++) {
        const lvl = LEVEL_MAP[i];
        const locked = lvl.locked && i > 0;
        const stars = '⭐'.repeat(lvl.stars);
        mapHTML += `
            <button class="level-btn ${locked? 'locked' : ''}"
                    onclick="${locked? '' : `loadLevel(${lvl.level})`}"
                    ${locked? 'disabled' : ''}>
                <b>${lvl.level}</b>
                <span>${locked? '🔒' : stars || '○'}</span>
            </button>
        `;
    }

    mapHTML += '</div><button class="btn-primary" onclick="winMessage.style.display=\'none\'">Close</button>';
    winMessage.innerHTML = mapHTML;
}

function loadLevel(lvl) {
    if (LEVEL_MAP[lvl-1].locked) return;
    level = lvl;
    localStorage.setItem("level", level);
    winMessage.style.display = "none";
    startGame();
}

/* =========================
   👑 UPGRADE 11: LEADERBOARD
========================= */

function updateLeaderboard() {
    const playerName = localStorage.getItem("playerName") || "Player" + Math.floor(Math.random() * 9999);
    localStorage.setItem("playerName", playerName);

    const entry = { name: playerName, score: score, level: level, date: Date.now() };
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function showLeaderboard() {
    winMessage.style.display = "block";
    let boardHTML = '<h2>👑 Leaderboard</h2><div class="leaderboard-list">';

    if (leaderboard.length === 0) {
        boardHTML += '<p>No scores yet. Be the first!</p>';
    } else {
        leaderboard.forEach((entry, i) => {
            boardHTML += `
                <div class="leader-item">
                    <span class="rank">${i+1}</span>
                    <span class="name">${entry.name}</span>
                    <span class="score">${entry.score}</span>
                    <span class="lvl">L${entry.level}</span>
                </div>
            `;
        });
    }

    boardHTML += '</div><button class="btn-primary" onclick="winMessage.style.display=\'none\'">Close</button>';
    winMessage.innerHTML = boardHTML;
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
.special-tile {
  animation: glow 1s infinite alternate;
  border: 2px solid gold!important;
}
@keyframes glow {
  from { box-shadow: 0 0 5px gold; }
  to { box-shadow: 0 0 20px gold, 0 0 30px orange; }
}
.level-map {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
}
.level-btn {
  background: var(--glass);
  border: 2px solid var(--glass-border);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: 0.2s;
}
.level-btn:hover:not(.locked) {
  transform: scale(1.05);
  border-color: gold;
}
.level-btn.locked {
  opacity: 0.5;
  cursor: not-allowed;
}
.level-btn b {
  font-size: 18px;
  color: var(--text-gold);
}
.level-btn span {
  font-size: 12px;
}
.leaderboard-list {
  max-height: 300px;
  overflow-y: auto;
  text-align: left;
}
.leader-item {
  display: grid;
  grid-template-columns: 30px 1fr 80px 50px;
  gap: 10px;
  padding: 10px;
  background: rgba(0,0,0,0.2);
  margin: 5px 0;
  border-radius: 8px;
  align-items: center;
}
.leader-item .rank {
  font-weight: bold;
  color: var(--text-gold);
}
.leader-item .score {
  font-weight: bold;
}
`;
document.head.appendChild(style);

applyTheme();

const btnContainer = document.createElement('div');
btnContainer.style.display = 'flex';
btnContainer.style.gap = '10px';
btnContainer.style.marginTop = '10px';
btnContainer.style.flexWrap = 'wrap';

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

const skinBtn = document.createElement('button');
skinBtn.className = 'btn-ghost';
skinBtn.innerHTML = '🎨 Skins';
skinBtn.onclick = showSkinSelector;

const soundBtn = document.createElement('button');
soundBtn.className = 'btn-ghost';
soundBtn.innerHTML = soundOn? '🔊 Sound' : '🔇 Mute';
soundBtn.onclick = () => {
    toggleSound();
    soundBtn.innerHTML = soundOn? '🔊 Sound' : '🔇 Mute';
};

const undoBtn = document.createElement('button');
undoBtn.className = 'btn-ghost';
undoBtn.innerHTML = '↩️ Undo';
undoBtn.onclick = undoMove;
undoBtn.style.display = 'none';
undoBtn.id = 'undo-btn';

btnContainer.appendChild(themeBtn);
btnContainer.appendChild(zenBtn);
btnContainer.appendChild(statsBtn);
btnContainer.appendChild(skinBtn);
btnContainer.appendChild(soundBtn);

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
