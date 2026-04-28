const board = document.getElementById("game-board");
const scoreText = document.getElementById("score");

let score = 0;
let firstTile = null;

// Simple tiles (emoji based for now)
const tiles = ["🍎","🍎","🍌","🍌","🍇","🍇","🍒","🍒","🍉","🍉","🍍","🍍"];

// Shuffle function
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Create board
function startGame() {
    board.innerHTML = "";
    score = 0;
    scoreText.innerText = score;

    let shuffled = shuffle([...tiles]);

    shuffled.forEach(symbol => {
        let tile = document.createElement("div");
        tile.classList.add("tile");
        tile.innerText = symbol;

        tile.addEventListener("click", () => handleTileClick(tile));

        board.appendChild(tile);
    });
}

// Tile click logic
function handleTileClick(tile) {
    if (tile.classList.contains("matched")) return;

    if (!firstTile) {
        firstTile = tile;
        tile.style.background = "#d1e7ff";
    } else {
        if (firstTile.innerText === tile.innerText && firstTile !== tile) {
            // Match found
            firstTile.classList.add("matched");
            tile.classList.add("matched");

            firstTile.style.visibility = "hidden";
            tile.style.visibility = "hidden";

            score += 10;
            scoreText.innerText = score;
        } else {
            firstTile.style.background = "#f0f0f0";
        }

        firstTile = null;
    }
}

// Restart game
function restartGame() {
    startGame();
}
