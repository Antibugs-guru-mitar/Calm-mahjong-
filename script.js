// ===== VITA SNOW RIDER - BULLETPROOF JS =====
const player = document.getElementById('player');
const game = document.getElementById('game');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const tapEl = document.getElementById('tap');

let gameState = {
    y: 120, vy: 0, gravity: 0.8, jumpPower: -16,
    isGrounded: true, score: 0, gameOver: false,
    groundHeight: 120, speed: 4
};

// BARAF GENERATOR
function createSnow() {
    if (gameState.gameOver) return;
    const snow = document.createElement('div');
    snow.className = 'snow';
    snow.style.left = Math.random() * 100 + 'vw';
    snow.style.animationDuration = (Math.random() * 3 + 2) + 's';
    snow.style.opacity = Math.random();
    game.appendChild(snow);
    setTimeout(() => snow.remove(), 5000);
}
setInterval(createSnow, 100);

// JUMP FUNCTION
function jump() {
    if (gameState.gameOver) return;
    if (gameState.isGrounded) {
        gameState.vy = gameState.jumpPower;
        gameState.isGrounded = false;
        player.classList.add('jumping');
        setTimeout(() => player.classList.remove('jumping'), 500);
        tapEl.style.display = 'none';
    }
}

// CONTROLS
game.addEventListener('click', jump);
game.addEventListener('touchstart', e => { e.preventDefault(); jump(); });
document.addEventListener('keydown', e => { if(e.code === 'Space') jump(); });
restartBtn.addEventListener('click', () => location.reload());

// GAME LOOP
function update() {
    if (gameState.gameOver) return;
    
    gameState.vy += gameState.gravity;
    gameState.y += gameState.vy;
    
    if (gameState.y >= window.innerHeight - gameState.groundHeight - 50) {
        gameState.y = window.innerHeight - gameState.groundHeight - 50;
        gameState.vy = 0;
        gameState.isGrounded = true;
    }
    
    player.style.bottom = (window.innerHeight - gameState.y - 50) + 'px';
    
    gameState.score += gameState.speed / 10;
    scoreEl.textContent = Math.floor(gameState.score) + 'M';
    gameState.speed += 0.001;
    
    requestAnimationFrame(update);
}

update();
