const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");
const winMessage = document.getElementById("win-message");

let score = 0;
let firstTile = null;
let matchedTiles = 0;
let totalTiles = 0;

// Tiles
const tiles = ["🍎","🍎","🍌","🍌","🍇","🍇","🍒","🍒","🍉","🍉","🍍","🍍"];

// Shuffle
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Start Game
function startGame() {
    board.innerHTML = "";
    score = 0;
    matchedTiles = 0;
    firstTile = null;

    scoreText.innerText = score;

    // Hide win screen
    if (winMessage) {
        winMessage.style.display = "none";
    }

    let shuffled = shuffle([...tiles]);
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

            // MATCH FOUND
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

// Restart Game
function restartGame() {
    startGame();
}

// Auto start
startGame();
