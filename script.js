// Canvas and UI elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const restartBtn = document.getElementById('restartBtn');

// Doby settings (cartoon boy)
const player = {
    width: 46,
    height: 78,
    x: canvas.width / 2 - 23,
    y: canvas.height - 90,
    speed: 5
};

// Store viruses
let viruses = [];

// Controls
let leftPressed = false;
let rightPressed = false;

// Score & game state
let score = 0;
let isGameOver = false;
let obstacleTimer = 0;

// Key listeners
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') leftPressed = true;
    if (e.key === 'ArrowRight') rightPressed = true;
});

document.addEventListener('keyup', function(e) {
    if (e.key === 'ArrowLeft') leftPressed = false;
    if (e.key === 'ArrowRight') rightPressed = false;
});

restartBtn.addEventListener('click', startGame);

// Draw Doby as a cartoon boy (simple)
function drawDoby(p) {
    let cx = p.x + p.width / 2;
    let faceY = p.y + 38;

    // Shirt
    ctx.beginPath();
    ctx.rect(p.x + 7, p.y + 59, p.width - 14, 16);
    ctx.fillStyle = "#4a82e4";
    ctx.fill();
    ctx.closePath();

    // Neck
    ctx.beginPath();
    ctx.rect(cx - 8, faceY + 18, 16, 10);
    ctx.fillStyle = "#f9dfc5";
    ctx.fill();
    ctx.closePath();

    // Head (face)
    ctx.beginPath();
    ctx.arc(cx, faceY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#f9dfc5";
    ctx.shadowColor = "#e1c29a";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();

    // Hair: top arc with bangs
    ctx.beginPath();
    ctx.arc(cx, faceY - 12, 26, Math.PI*1.03, Math.PI*1.97, false);
    ctx.fillStyle = "#442617";
    ctx.fill();
    ctx.closePath();

    // Bangs
    ctx.beginPath();
    ctx.moveTo(cx - 22, faceY - 10);
    ctx.quadraticCurveTo(cx, faceY - 28, cx + 22, faceY - 10);
    ctx.fillStyle = "#442617";
    ctx.fill();
    ctx.closePath();

    // Left eye
    ctx.beginPath();
    ctx.ellipse(cx - 10, faceY + 3, 4, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#333";
    ctx.stroke();
    ctx.closePath();

    // Right eye
    ctx.beginPath();
    ctx.ellipse(cx + 10, faceY + 3, 4, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.stroke();
    ctx.closePath();

    // Pupils
    ctx.beginPath();
    ctx.arc(cx - 10, faceY + 6, 2, 0, Math.PI * 2);
    ctx.arc(cx + 10, faceY + 6, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#222";
    ctx.fill();
    ctx.closePath();

    // Smile
    ctx.beginPath();
    ctx.arc(cx, faceY + 14, 10, 0.13*Math.PI, 0.87*Math.PI, false);
    ctx.strokeStyle = "#784514";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Arms
    ctx.beginPath();
    ctx.moveTo(p.x + 7, p.y + 66);
    ctx.lineTo(p.x - 6, p.y + 50);
    ctx.moveTo(p.x + p.width - 7, p.y + 66);
    ctx.lineTo(p.x + p.width + 6, p.y + 50);
    ctx.strokeStyle = "#f9dfc5";
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.lineWidth = 1;
}

// Draw a virus (spiky green)
function drawVirus(virus) {
    const spikes = 12;
    const innerRadius = virus.radius * 0.68;
    const outerRadius = virus.radius;
    let angle = Math.PI / 2;
    ctx.save();
    ctx.translate(virus.x, virus.y);
    ctx.rotate((virus.time/4) % (2*Math.PI));
    ctx.beginPath();
    for (let i = 0; i < spikes*2; i++) {
        let r = (i % 2 === 0) ? outerRadius : innerRadius;
        let a = angle + (Math.PI / spikes) * i;
        ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    ctx.closePath();
    ctx.fillStyle = "#70c945";
    ctx.strokeStyle = "#41752a";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, virus.radius * 0.5, 0, Math.PI *2);
    ctx.fillStyle = "#98e576";
    ctx.fill();
    ctx.strokeStyle = "#41752a";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

// Collision: Use the head center of Doby & radius, and virus as circles
function circleCollision(a, b) {
    // a: player; b: virus
    const ax = a.x + a.width / 2;
    const ay = a.y + 38;
    const ar = 28; // just the head

    const dx = ax - b.x;
    const dy = ay - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < (ar + b.radius * 0.78);
}

// MAIN GAME LOOP
function gameLoop() {
    if (isGameOver) return;

    // Move Doby
    if (leftPressed) player.x -= player.speed;
    if (rightPressed) player.x += player.speed;
    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Viruses: Spawn every 40 frames (~0.66s at 60fps)
    obstacleTimer++;
    if (obstacleTimer % 40 === 0) {
        let radius = 21 + Math.random() * 13;
        let vx = Math.random() * (canvas.width - 2 * radius) + radius;
        viruses.push({
            x: vx,
            y: -radius,
            radius: radius,
            speed: 2.5 + Math.random() * 1.5,
            time: Math.random() * 2000
        });
    }

    // Move viruses & remove offscreen
    for (let v of viruses) {
        v.y += v.speed;
        v.time++;
    }
    viruses = viruses.filter(v => v.y < canvas.height + v.radius);

    // Collision check
    for (let v of viruses) {
        if (circleCollision(player, v)) {
            isGameOver = true;
            restartBtn.style.display = "inline-block";
        }
    }

    // Draw everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDoby(player);
    for (let v of viruses) {
        drawVirus(v);
    }

    // Score
    score++;
    scoreDisplay.textContent = "Score: " + score;

    if (!isGameOver) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 36px Arial";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2);
        ctx.font = "bold 24px Arial";
        ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 40);
        ctx.restore();
    }
}

// RESET GAME STATE
function startGame() {
    player.x = canvas.width / 2 - player.width/2;
    player.y = canvas.height - player.height - 12;
    viruses = [];
    score = 0;
    isGameOver = false;
    obstacleTimer = 0;
    restartBtn.style.display = "none";
    scoreDisplay.textContent = "Score: 0";
    requestAnimationFrame(gameLoop);
}

// INITIALIZE
window.onload = startGame;

