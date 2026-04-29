const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("win-message");
const levelText = document.getElementById("level");
const bestScoreText = document.getElementById("best-score");
const menuScreen = document.getElementById("menu-screen");
const gameContainer = document.getElementById("game-container");
const continueBtn = document.getElementById("continue-btn");

// 🎮 GAME STATE
let gameState = "menu";

// 💾 SAFE LOAD
let level = parseInt(localStorage.getItem("level")) || 1;
let score = parseInt(localStorage.getItem("score")) || 0;
let bestScore = parseInt(localStorage.getItem("bestScore")) || 0;

// PHASE 9 VARIABLES
let firstTile = null;
let matchedTiles = 0;
let totalTiles = 0;
let combo = 0; // UPGRADE 3: COMBO
let lastMatchTime = 0; // UPGRADE 3: COMBO
let timerInterval = null; // UPGRADE 4: TIMER
let timeLeft = 60; // UPGRADE 4: TIMER
let isDarkMode = localStorage.getItem("darkMode") === "true"; // UPGRADE 7: THEME

// 🧩 Base tiles - EMOJI HI RAKHE HAIN LALA TENSION NA LE 😂✅
const base = ["🍎","🍌","🍇","🍒","🍉","🍍","🥝","🍓"];

// Shuffle
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Level generator
function getLevelTiles(level) {
    let tiles = [];
    let pairs = Math.min(6 + level * 2, 24);
    for (let i = 0; i < pairs; i++) {
        let item = base[i % base.length];
        tiles.push(item, item);
    }
    return tiles;
}

/* =========================
   🧠 SCREEN CONTROL
========================= */

function showGame() {
    menuScreen.style.display = "none";
    gameContainer.style.display = "block";
    startParticleTrail(); // UPGRADE 5: PARTICLE START
}

function showMenu() {
    gameState = "menu";
    menuScreen.style.display = "flex";
    gameContainer.style.display = "none";
    board.innerHTML = "";
    stopTimer(); // UPGRADE 4: TIMER STOP
    stopParticleTrail(); // UPGRADE 5: PARTICLE STOP
    checkContinueButton();
    checkDailyChallenge(); // UPGRADE 6: DAILY CHECK
}

/* =========================
   🎮 MENU BUTTONS
========================= */

function newGame() {
    level = 1;
    score = 0;
    combo = 0;
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
   🎮 START GAME
========================= */

function startGame(savedBoard = null, savedMatched = 0) {
    gameState = "playing";
    board.innerHTML = "";
    matchedTiles = savedMatched;
    firstTile = null;
    combo = 0;

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

    // UPGRADE 4: TIMER MODE - Level 5 ke baad
    if (level >= 5 &&!savedBoard) {
        startTimer();
    }

    saveCurrentBoard();
}

/* =========================
   🎮 TILE LOGIC
========================= */

function handleTileClick(tile) {
    if (gameState!== "playing") return;
    if (tile.classList.contains("matched")) return;
    if (tile === firstTile) return;

    if (!firstTile) {
        firstTile = tile;
        tile.classList.add("selected");
        return;
    }

    if (firstTile.innerText === tile.innerText) {
        // UPGRADE 3: COMBO SYSTEM 🔥
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

        // UPGRADE 2: TILE POP ANIMATION - CSS handle karega

        score += 10 * comboMultiplier; // Combo se score
        matchedTiles += 2;

        // COMBO TEXT
        if (combo > 1) showComboText(comboMultiplier);

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("bestScore", bestScore);
            bestScoreText.innerText = bestScore;
        }

        localStorage.setItem("score", score);
        scoreText.innerText = score;

        if (matchedTiles === totalTiles) {
            gameState = "win";
            stopTimer(); // UPGRADE 4: TIMER STOP
            localStorage.removeItem("savedBoard");
            localStorage.removeItem("savedMatched");
            playVictoryJashan(); // UPGRADE 1: JHATKA + CONFETTI

            setTimeout(() => {
                winMessage.style.display = "block";
                winMessage.innerHTML = `
                    <h2>🎉 Level ${level} Complete!</h2>
                    <p>Score: ${score}</p>
                    ${combo > 1? `<p>Max Combo: X${combo} 🔥</p>` : ''}
                    <button class="btn-primary" onclick="nextLevel()">Next Level</button>
                    <button class="btn-ghost" onclick="showMenu()">Main Menu</button>
                `;
            }, 400);
        }
    } else {
        combo = 0; // Combo toot gaya
        firstTile.classList.remove("selected");
        tile.style.animation = "shake 0.3s";
        setTimeout(() => tile.style.animation = "", 300);
    }

    firstTile = null;
    saveCurrentBoard();
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
   🎉 UPGRADE 1: VICTORY JASHAN - NO AUDIO
========================= */

function playVictoryJashan() {
    // 1. SCREEN JHATKA 📳
    gameContainer.style.animation = "shake 0.5s";
    setTimeout(() => gameContainer.style.animation = "", 500);

    // 2. BOARD FLASH
    board.style.animation = "flash 0.3s";
    setTimeout(() => board.style.animation = "", 300);

    // 3. PHOOL/CONFETTI GIRAO 🌸
    launchConfetti();
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
   🔥 UPGRADE 3: COMBO TEXT
========================= */

function showComboText(x) {
    const comboDiv = document.createElement('div');
    comboDiv.innerText = `COMBO X${x}! 🔥`;
    comboDiv.style.position = 'fixed';
    comboDiv.style.top = '50%';
    comboDiv.style.left = '50%';
    comboDiv.style.transform = 'translate(-50%, -50%)';
    comboDiv.style.fontSize = '40px';
    comboDiv.style.fontWeight = '700';
    comboDiv.style.color = '#ff6b6b';
    comboDiv.style.zIndex = '999';
    comboDiv.style.pointerEvents = 'none';
    comboDiv.style.animation = 'comboPop 1s forwards';
    document.body.appendChild(comboDiv);
    setTimeout(() => comboDiv.remove(), 1000);
}

/* =========================
   ⏱️ UPGRADE 4: TIMER MODE
========================= */

function startTimer() {
    timeLeft = 60;
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
        timerEl.style.position = 'fixed';
        timerEl.style.top = '20px';
        timerEl.style.right = '20px';
        timerEl.style.fontSize = '24px';
        timerEl.style.fontWeight = '700';
        timerEl.style.color = timeLeft < 10? '#ff0000' : '#ffffff';
        timerEl.style.zIndex = '100';
        document.body.appendChild(timerEl);
    }
    timerEl.innerText = `⏱️ ${timeLeft}s`;
    timerEl.style.color = timeLeft < 10? '#ff0000' : '#ffffff';
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
   ✨ UPGRADE 5: PARTICLE TRAIL
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
   📅 UPGRADE 6: DAILY CHALLENGE
========================= */

function checkDailyChallenge() {
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem("lastPlayedDate");

    if (lastPlayed!== today) {
        const dailyBtn = document.createElement('button');
        dailyBtn.className = 'btn-primary';
        dailyBtn.innerHTML = '📅 Daily Challenge';
        dailyBtn.onclick = startDailyChallenge;
        dailyBtn.style.marginTop = '10px';
        document.querySelector('.menu-buttons').appendChild(dailyBtn);
    }
}

function startDailyChallenge() {
    // Seed based on date for same board daily
    const today = new Date().toDateString();
    localStorage.setItem("lastPlayedDate", today);
    level = new Date().getDate(); // Date = Level
    score = 0;
    localStorage.setItem("level", level);
    localStorage.setItem("score", score);
    showGame();
    startGame();
}

/* =========================
   🌙 UPGRADE 7: THEME SWITCHER
========================= */

function toggleTheme() {
    isDarkMode =!isDarkMode;
    localStorage.setItem("darkMode", isDarkMode);
    applyTheme();
}

function applyTheme() {
    if (isDarkMode) {
        document.documentElement.style.setProperty('--bg', 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)');
        document.documentElement.style.setProperty('--tile-bg', 'rgba(255, 255, 255, 0.1)');
    } else {
        document.documentElement.style.setProperty('--bg', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
        document.documentElement.style.setProperty('--tile-bg', 'rgba(255, 255, 255, 0.9)');
    }
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
.trail-particle {
  position: fixed;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 998;
  animation: particleFade 1s forwards;
}
@keyframes particleFade {
  to { opacity: 0; transform: scale(0); }
}
`;
document.head.appendChild(style);

// Theme apply on load
applyTheme();

// Add theme toggle button to menu
const themeBtn = document.createElement('button');
themeBtn.className = 'btn-ghost';
themeBtn.innerHTML = isDarkMode? '☀️ Light Mode' : '🌙 Dark Mode';
themeBtn.onclick = () => {
    toggleTheme();
    themeBtn.innerHTML = isDarkMode? '☀️ Light Mode' : '🌙 Dark Mode';
};
themeBtn.style.marginTop = '10px';

showMenu();
setTimeout(() => {
    document.querySelector('.menu-buttons')?.appendChild(themeBtn);
}, 100);
