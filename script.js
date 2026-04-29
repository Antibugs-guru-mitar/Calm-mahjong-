const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("win-message");
const levelText = document.getElementById("level");

const menuScreen = document.getElementById("menu-screen");
const gameContainer = document.getElementById("game-container");

// 💾 SAFE LOAD
let level = parseInt(localStorage.getItem("level")) || 1;
let score = parseInt(localStorage.getItem("score")) || 0;
let bestScore = parseInt(localStorage.getItem("bestScore")) || 0;

// 🎮 GAME STATE
let gameState = "menu"; // menu | playing | win

let firstTile = null;
let matchedTiles = 0;
let totalTiles = 0;

// 🏆 ACHIEVEMENTS
let achievements = JSON.parse(localStorage.getItem("achievements")) || [];

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

// 🎮 MENU SHOW
function showMenu() {
    gameState = "menu";

    if (menuScreen) menuScreen.style.display = "flex";
    if (gameContainer) gameContainer.style.display = "none";
}

// 🎮 GAME SHOW
function showGame() {
    if (menuScreen) menuScreen.style.display = "none";
    if (gameContainer) gameContainer.style.display = "block";
}

// 🆕 NEW GAME
function newGame() {
    level = 1;
    score = 0;

    localStorage.setItem("level", level);
    localStorage.setItem("score", score);

    showGame();
    startGame();
}

// ▶ CONTINUE
function continueGame() {
    level = parseInt(localStorage.getItem("level")) || 1;
    score = parseInt(localStorage.getItem("score")) || 0;

    showGame();
    startGame();
}

// 🎮 LEVEL START
function showLevelStart() {
    if (winMessage) {
        winMessage.style.display = "block";
        winMessage.innerHTML = `
            <h2>🎮 Level ${level}</h2>
            <p>Get Ready...</p>
        `;
    }

    setTimeout(() => {
        if (winMessage) winMessage.style.display = "none";
    }, 700);
}

// 🔊 SOUND HOOK
function playSound(type) {
    console.log("Sound:", type);
}

// 🏆 ACHIEVEMENTS
function checkAchievements() {
    if (score >= 100 && !achievements.includes("score100")) {
        achievements.push("score100");
    }

    if (level >= 5 && !achievements.includes("level5")) {
        achievements.push("level5");
    }

    localStorage.setItem("achievements", JSON.stringify(achievements));
}

// 🎮 START GAME
function startGame() {
    board.innerHTML = "";

    matchedTiles = 0;
    firstTile = null;
    gameState = "playing";

    scoreText.innerText = score;

    if (levelText) levelText.innerText = level;

    showLevelStart();

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

// 🎯 TILE LOGIC
function handleTileClick(tile) {

    if (gameState !== "playing") return;
    if (tile.classList.contains("matched")) return;

    playSound("click");

    if (!firstTile) {
        firstTile = tile;
        tile.style.background = "#d1e7ff";
        tile.style.transform = "scale(1.05)";
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

        checkAchievements();

        if (matchedTiles === totalTiles) {

            gameState = "win";
            playSound("win");

            setTimeout(() => {

                if (winMessage) {
                    winMessage.style.display = "block";

                    winMessage.innerHTML = `
                        <h2>🎉 Level ${level} Complete!</h2>
                        <p>Great Job!</p>
                        <button onclick="nextLevel()">Next Level</button>
                    `;
                }

            }, 300);
        }

    } else {
        firstTile.style.background = "#f0f0f0";
        firstTile.style.transform = "scale(1)";
    }

    firstTile = null;
}

// 🔥 NEXT LEVEL
function nextLevel() {
    level++;

    localStorage.setItem("level", level);
    localStorage.setItem("score", score);

    startGame();
}

// 🔁 RESTART
function restartGame() {
    startGame();
}

// 💡 HINT
function hint() {
    let tiles = document.querySelectorAll(".tile:not(.matched)");

    if (tiles.length > 0) {
        let randomTile = tiles[Math.floor(Math.random() * tiles.length)];

        randomTile.style.background = "#fff3cd";

        setTimeout(() => {
            randomTile.style.background = "#f0f0f0";
        }, 700);
    }
}

// 🔀 SHUFFLE
function shuffleBoard() {
    let tiles = Array.from(board.children);

    board.innerHTML = "";

    shuffle(tiles);

    tiles.forEach(tile => board.appendChild(tile));
}

// ♻ RESET PROGRESS
function resetProgress() {
    localStorage.clear();

    level = 1;
    score = 0;
    achievements = [];

    showMenu();
}

// 🚀 AUTO START MENU
showMenu();
