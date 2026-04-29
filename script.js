const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("win-message");
const levelText = document.getElementById("level");
const achievementBar = document.getElementById("achievement-bar");

// 🎮 GAME STATE
let gameState = "menu"; // menu | playing | win

// 💾 SAFE LOAD
let level = parseInt(localStorage.getItem("level")) || 1;
let score = parseInt(localStorage.getItem("score")) || 0;
let bestScore = parseInt(localStorage.getItem("bestScore")) || 0;

let firstTile = null;
let matchedTiles = 0;
let totalTiles = 0;

// 🧩 Base tiles
const base = ["🍎","🍌","🍇","🍒","🍉","🍍","🥝","🍓"];

// Shuffle (safe version)
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
   🎮 MENU SYSTEM (FIXED)
========================= */

function showMenu() {
    gameState = "menu";

    board.innerHTML = ""; // 🔥 FIX: clear board
    matchedTiles = 0;
    firstTile = null;

    winMessage.style.display = "block";
    winMessage.innerHTML = `
        <h2>🎮 Calm Mahjong</h2>
        <p>Choose an option</p>
        <button onclick="startGame()">▶ Start Game</button>
        <button onclick="continueGame()">⏩ Continue</button>
        <button onclick="resetProgress()">♻ Reset</button>
    `;
}

function continueGame() {
    winMessage.style.display = "none"; // 🔥 FIX
    startGame();
}

/* =========================
   🎮 LEVEL START
========================= */
function showLevelStart() {

    if (gameState !== "playing") return;

    winMessage.style.display = "block";
    winMessage.innerHTML = `
        <h2>🎮 Level ${level}</h2>
        <p>Get Ready...</p>
    `;

    setTimeout(() => {
        winMessage.style.display = "none";
    }, 600);
}

/* =========================
   🎮 START GAME (FIXED CORE)
========================= */
function startGame() {

    gameState = "playing";

    winMessage.style.display = "none"; // 🔥 FIX OVERLAY BUG

    board.innerHTML = "";

    matchedTiles = 0;
    firstTile = null;

    scoreText.innerText = score;

    if (levelText) {
        levelText.innerText = level;
    }

    setTimeout(() => {
        showLevelStart();
    }, 100);

    let shuffled = shuffle(getLevelTiles(level));
    totalTiles = shuffled.length;

    shuffled.forEach(symbol => {
        let tile = document.createElement("div");
        tile.classList.add("tile");
        tile.innerText = symbol;

        tile.style.background = "#f0f0f0";
        tile.style.transition = "0.2s";

        tile.addEventListener("click", () => handleTileClick(tile));

        board.appendChild(tile);
    });
}

/* =========================
   🎮 TILE LOGIC (SAFE)
========================= */
function handleTileClick(tile) {

    if (gameState !== "playing") return;
    if (tile.classList.contains("matched")) return;

    if (!firstTile) {
        firstTile = tile;
        tile.style.background = "#d1e7ff";
        return;
    }

    if (firstTile.innerText === tile.innerText && firstTile !== tile) {

        firstTile.classList.add("matched");
        tile.classList.add("matched");

        firstTile.style.visibility = "hidden";
        tile.style.visibility = "hidden";

        score += 10;
        matchedTiles += 2;

        localStorage.setItem("score", score);
        scoreText.innerText = score;

        if (matchedTiles === totalTiles) {

            gameState = "win";

            setTimeout(() => {
                winMessage.style.display = "block";
                winMessage.innerHTML = `
                    <h2>🎉 Level ${level} Complete!</h2>
                    <button onclick="nextLevel()">Next Level</button>
                    <button onclick="showMenu()">Main Menu</button>
                `;
            }, 300);
        }

    } else {
        firstTile.style.background = "#f0f0f0";
    }

    firstTile = null;
}

/* =========================
   🎮 NEXT LEVEL
========================= */
function nextLevel() {
    level++;
    localStorage.setItem("level", level);
    startGame();
}

/* =========================
   🔄 RESET
========================= */
function restartGame() {
    startGame();
}

function resetProgress() {
    localStorage.clear();
    level = 1;
    score = 0;
    showMenu();
}

/* =========================
   🚀 INIT
========================= */
showMenu();
