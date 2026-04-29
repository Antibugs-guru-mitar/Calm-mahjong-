const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("win-message");
const levelText = document.getElementById("level");
const menuScreen = document.getElementById("menu-screen");
const gameContainer = document.getElementById("game-container");

// 🎮 GAME STATE
let gameState = "menu";

// 💾 SAFE LOAD
let level = parseInt(localStorage.getItem("level")) || 1;
let score = parseInt(localStorage.getItem("score")) || 0;

let firstTile = null;
let matchedTiles = 0;
let totalTiles = 0;

// 🧩 Base tiles
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
