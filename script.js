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
        firstTile.classList.add("matched");
        tile.classList.add("matched");
        firstTile.classList.remove("selected");

        setTimeout(() => {
            firstTile.style.opacity = "0";
            tile.style.opacity = "0";
        }, 200);

        score += 10;
        matchedTiles += 2;

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("bestScore", bestScore);
            bestScoreText.innerText = bestScore;
        }

        localStorage.setItem("score", score);
        scoreText.innerText = score;

        if (matchedTiles === totalTiles) {
            gameState = "win";
            localStorage.removeItem("savedBoard"); // Level complete = board clear
            localStorage.removeItem("savedMatched");
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
    startGame();
}

function resetProgress() {
    if (!confirm("Sara progress delete ho jaye ga. Pakka?")) return;
    localStorage.clear();
    level = 1;
    score = 0;
    bestScore = 0;
    board.innerHTML = "";
    winMessage.style.display = "none";
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
   🚀 INIT
========================= */

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
