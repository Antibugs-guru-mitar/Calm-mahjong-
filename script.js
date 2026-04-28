const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("win-message");

let score = 0;
let firstTile = null;
let matchedTiles = 0;
let totalTiles = 0;

// 🧩 LEVEL SYSTEM
let level = 1;

// Base tiles
const base = ["🍎","🍌","🍇","🍒","🍉","🍍"];

// Shuffle
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// 🔥 FIXED LEVEL TILE GENERATOR
function getLevelTiles(level) {
    let tiles = [];

    // pairs increase with level
    let pairs = 6 + (level - 1) * 2;

    for (let i = 0; i < pairs; i++) {
        let item = base[i % base.length];
        tiles.push(item, item);
    }

    return tiles;
}

// Start / Reset Game (FULL FIXED)
function startGame() {
    board.innerHTML = "";

    score = 0;
    matchedTiles = 0;
    firstTile = null;

    scoreText.innerText = score;

    if (winMessage) {
        winMessage.style.display = "none";
    }

    let levelTiles = getLevelTiles(level);
    let shuffled = shuffle(levelTiles);

    totalTiles = shuffled.length;

    shuffled.forEach(symbol => {
        let tile = document.createElement("div");
        tile.classList.add("tile");
        tile.innerText = symbol;

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
    } else {
        if (firstTile.innerText === tile.innerText && firstTile !== tile) {

            firstTile.classList.add("matched");
            tile.classList.add("matched");

            firstTile.style.visibility = "hidden";
            tile.style.visibility = "hidden";

            score += 10;
            matchedTiles += 2;

            scoreText.innerText = score;

            // WIN CHECK 🔥
            if (matchedTiles === totalTiles) {
                setTimeout(() => {
                    if (winMessage) {
                        winMessage.style.display = "block";
                    }
                }, 300);
            }

        } else {
            firstTile.style.background = "#f0f0f0";
        }

        firstTile = null;
    }
}

// 🏆 NEXT LEVEL SYSTEM
function restartGame() {
    level++;
    startGame();
}

// Auto start
startGame();
