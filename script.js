const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("win-message");
const levelText = document.getElementById("level");
const bestScoreText = document.getElementById("best-score"); // PHASE 7 ADD
const menuScreen = document.getElementById("menu-screen");
const gameContainer = document.getElementById("game-container");
const continueBtn = document.getElementById("continue-btn"); // PHASE 7 ADD

// 🎮 GAME STATE
let gameState = "menu";

// 💾 SAFE LOAD
let level = parseInt(localStorage.getItem("level")) || 1;
let score = parseInt(localStorage.getItem("score")) || 0;
let bestScore = parseInt(localStorage.getItem("bestScore")) || 0; // PHASE 7 ADD

let firstTile = null;
let matchedTiles = 0;
let totalTiles = 0;

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
}

function showMenu() {
    gameState = "menu";
    menuScreen.style.display = "flex";
    gameContainer.style.display = "none";
    board.innerHTML = "";

    // PHASE 7: Continue button check
    checkContinueButton();
}

/* =========================
   🎮 MENU BUTTONS
========================= */

function newGame() {
    level = 1;
    score = 0;
    localStorage.setItem("level", level);
    localStorage.setItem("score", score);
    showGame();
    startGame();
}

function continueGame() {
    showGame();
    startGame();
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

function startGame() {
    gameState = "playing";
    board.innerHTML = "";
    matchedTiles = 0;
    firstTile = null;

    scoreText.innerText = score;
    levelText.innerText = level;
    bestScoreText.innerText = bestScore; // PHASE 7 ADD

    showLevelStart();

    let shuffled = shuffle(getLevelTiles(level));
    totalTiles = shuffled.length;

    shuffled.forEach(symbol => {
        let tile = document.createElement("div");
        tile.classList.add("tile");
        tile.innerText = symbol;
        tile.addEventListener("click", () => handleTileClick(tile));
        board.appendChild(tile);
    });
}

/* =========================
   🎮 TILE LOGIC
========================= */

function handleTileClick(tile) {
    if (gameState!== "playing") return;
    if (tile.classList.contains("matched")) return;
    if (tile === firstTile) return; // PHASE 7 BUG FIX: Same tile dobara click

    // PHASE 7: CSS class use karo, hardcoded color nahi
    if (!firstTile) {
        firstTile = tile;
        tile.classList.add("selected"); // CSS se color aye ga
        return;
    }

    if (firstTile.innerText === tile.innerText) {
        firstTile.classList.add("matched");
        tile.classList.add("matched");
        firstTile.classList.remove("selected");

        // PHASE 7: Visibility ki jagah opacity for smooth animation
        setTimeout(() => {
            firstTile.style.opacity = "0";
            tile.style.opacity = "0";
        }, 200);

        score += 10;
        matchedTiles += 2;

        // PHASE 7: Best Score Update
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("bestScore", bestScore);
            bestScoreText.innerText = bestScore;
        }

        localStorage.setItem("score", score);
        scoreText.innerText = score;

        if (matchedTiles === totalTiles) {
            gameState = "win";
            setTimeout(() => {
                winMessage.style.display = "block";
                winMessage.innerHTML = `
                    <h2>🎉 Level ${level} Complete!</h2>
                    <p>Score: ${score}</p>
                    <button class="btn-primary" onclick="nextLevel()">Next Level</button>
                    <button class="btn-ghost" onclick="showMenu()">Main Menu</button>
                `;
            }, 400);
        }
    } else {
        // Wrong match
        firstTile.classList.remove("selected");
        // Thora shake effect
        tile.style.animation = "shake 0.3s";
        setTimeout(() => tile.style.animation = "", 300);
    }

    firstTile = null;
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
    startGame();
}

function resetProgress() {
    if (!confirm("Sara progress delete ho jaye ga. Pakka?")) return; // PHASE 7: Confirmation
    localStorage.clear();
    level = 1;
    score = 0;
    bestScore = 0;
    board.innerHTML = ""; // PHASE 7 BUG FIX
    winMessage.style.display = "none";
    showMenu();
}

/* =========================
   💡 HINT & SHUFFLE - PHASE 7 ADD
========================= */

function hint() {
    if (gameState!== "playing") return;
    const tiles = Array.from(board.querySelectorAll('.tile:not(.matched)'));
    if (tiles.length < 2) return;

    // Random match dhoond
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
}

/* =========================
   🔍 PHASE 7 HELPER
========================= */

function checkContinueButton() {
    const savedLevel = localStorage.getItem("level");
    const savedScore = localStorage.getItem("score");
    if (savedLevel && savedScore && (parseInt(savedLevel) > 1 || parseInt(savedScore) > 0)) {
        continueBtn.style.display = "block";
    } else {
        continueBtn.style.display = "none";
    }
}

/* =========================
   🚀 INIT
========================= */

// PHASE 7: Shake animation CSS mein add kar do
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);

showMenu();
