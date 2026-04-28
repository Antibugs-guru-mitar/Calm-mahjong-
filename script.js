const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("win-message");
const levelText = document.getElementById("level");

let score = 0;
let firstTile = null;
let matchedTiles = 0;
let totalTiles = 0;

// 🧩 LEVEL SYSTEM
let level = 1;

// Base tiles (Phase 4 upgraded pool)
const base = ["🍎","🍌","🍇","🍒","🍉","🍍","🥝","🍓"];

// Shuffle
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// 🔥 LEVEL TILE GENERATOR (PHASE 4 BALANCED DIFFICULTY)
function getLevelTiles(level) {
    let tiles = [];

    let pairs = Math.min(6 + level * 2, 24); // capped difficulty

    for (let i = 0; i < pairs; i++) {
        let item = base[i % base.length];
        tiles.push(item, item);
    }

    return tiles;
}

// 🎮 LEVEL START ANIMATION (PHASE 4 ADD)
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
    }, 900);
}

// Start / Reset Game
function startGame() {
    board.innerHTML = "";

    score = 0;
    matchedTiles = 0;
    firstTile = null;

    scoreText.innerText = score;

    // 🔥 LEVEL UI UPDATE
    if (levelText) {
        levelText.innerText = level;
    }

    if (winMessage) {
        winMessage.style.display = "none";
    }

    showLevelStart(); // 🔥 PHASE 4 FEEL

    let levelTiles = getLevelTiles(level);
    let shuffled = shuffle(levelTiles);

    totalTiles = shuffled.length;

    shuffled.forEach(symbol => {
        let tile = document.createElement("div");
        tile.classList.add("tile");
        tile.innerText = symbol;

        // 🎨 POLISH
        tile.style.background = "#f0f0f0";
        tile.style.transition = "0.2s";

        tile.addEventListener("click", () => handleTileClick(tile));

        board.appendChild(tile);
    });
}

// Tile Click Logic
function handleTileClick(tile) {

    if (tile.classList.contains("matched")) return;

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

        scoreText.innerText = score;

        // 🏆 WIN + NEXT LEVEL (PHASE 4 SMOOTH FLOW)
        if (matchedTiles === totalTiles) {
            setTimeout(() => {

                if (winMessage) {
                    winMessage.style.display = "block";
                    winMessage.innerHTML = `
                        <h2>🎉 Level ${level} Complete!</h2>
                        <p>Great Job!</p>
                        <button onclick="restartGame()">Next Level</button>
                    `;
                }

                setTimeout(() => {
                    level++;
                    startGame();
                }, 1200);

            }, 300);
        }

    } else {
        firstTile.style.background = "#f0f0f0";
        firstTile.style.transform = "scale(1)";
    }

    firstTile = null;
}

// 🔁 RESTART (clean)
function restartGame() {
    startGame();
}

// Auto start
startGame();
