// Canvas and UI elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const restartBtn = document.getElementById('restartBtn');

// Game settings
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const playerWidth = 46;
const playerHeight = 78; // Taller to fit whole body

const playerSpeed = 5;

// Player: draw Doby as a cartoon boy
let player = {
    x: canvasWidth / 2 - playerWidth / 2,
    y: canvasHeight - playerHeight - 12,
    width: playerWidth,
    height: playerHeight,
    radius: 28 // Face radius for circle collision
};

// Viruses (obstacles)
let viruses = [];

// Controls
let keys = { left: false, right: false };

// State
let score = 0;
let isGameOver = false;
let obstacleTimer = 0;

// Arrow key listeners
document.addEventListener('keydown', e => {
    if (e.key === "ArrowLeft") keys.left = true;
    if (e.key === "ArrowRight") keys.right = true;
});
document.addEventListener('keyup', e => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
});

// Restart
restartBtn.addEventListener('click', startGame);

// Draw Doby: cartoon boy
function drawDoby(p) {
    let cx = p.x + p.width / 2;
    let faceY = p.y + 38;

    // Body (shirt)
    ctx.beginPath();
    ctx.rect(p.x + 7, p.y + 56, p.width - 14, 22);
    ctx.fillStyle = "#4a82e4";
    ctx.fill();
    ctx.closePath();

    // Neck
    ctx.beginPath();
    ctx.rect(cx - 8, faceY + 18, 16, 12);
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

    // Hair: top arc
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
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#333";
    ctx.stroke();
    ctx.closePath();

    // Left pupil
    ctx.beginPath();
    ctx.arc(cx - 10, faceY + 6, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#222";
    ctx.fill();
    ctx.closePath();

    // Right pupil
    ctx.beginPath();
    ctx.arc(cx + 10, faceY + 6, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#222";
    ctx.fill();
    ctx.closePath();

    // Smile (simple arc)
    ctx.beginPath();
    ctx.arc(cx, faceY + 14, 10, 0.13*Math.PI, 0.87*Math.PI, false);
    ctx.strokeStyle = "#784514";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Simple arms
    ctx.beginPath();
    ctx.moveTo(p.x + 7, p.y + 66);
    ctx.lineTo(p.x - 6, p.y + 50);
    ctx.moveTo(p.x + p.width - 7, p.y + 66);
    ctx.lineTo(p.x + p.width + 6, p.y + 50);
    ctx.strokeStyle = "#f9dfc5";
    ctx.lineWidth = 7;
    ctx.stroke();

    // Reset lineWidth
    ctx.lineWidth = 1;
}

// Draw a virus (star circle)
function drawVirus(virus) {
    const spikes = 12;
    const innerRadius = virus.radius * 0.68;
    const outerRadius = virus.radius;
    let angle = Math.PI / 2;
    ctx.save();
    ctx.translate(virus.x, virus.y);
    ctx.rotate((virus.time/4) % (2*Math.PI)); // random rotation
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

// Collision: simplest - use face center for Doby
function circleCollision(a, b) {
    // a: player "face", b: virus
    const playerMid = { x: a.x + a.width / 2, y: a.y + 38, radius: a.radius };
    const dx = playerMid.x - b.x;
    const dy = playerMid.y - b.y;
    const distance = Math.hypot(dx, dy);
    return distance < (playerMid.radius + b.radius*0.78);
}

function startGame() {
    player.x = canvasWidth / 2 - playerWidth /2;
    player.y = canvasHeight - playerHeight - 12;
