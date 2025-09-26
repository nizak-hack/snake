const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const ui = {
  score: document.getElementById('score'),
  speed: document.getElementById('speed'),
  btnPause: document.getElementById('btn-pause'),
  btnReset: document.getElementById('btn-reset'),
};
const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const footer = document.getElementById('footer');
const startBtn = document.getElementById('btn-start');

function resize() {
  const w = Math.min(window.innerWidth * 0.92, 520);
  canvas.style.width = canvas.style.height = w + 'px';
}
window.addEventListener('resize', resize);
resize();

const CELL = 24;
const COLS = Math.floor(canvas.width / CELL);
const ROWS = Math.floor(canvas.height / CELL);
const key = (x, y) => `${x},${y}`;

let state = 'idle';
let score = 0;
let tickAcc = 0;
let lastTime = 0;
let animId = 0;
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = { x: 0, y: 0 };

function levelFps() {
  if (score < 10) return 6;
  else if (score < 20) return 10;
  else return 14;
}
function levelName() {
  if (score < 10) return 'Noob';
  if (score < 20) return 'Normish';
  return 'Goat';
}
function updateHUD() {
  ui.score.textContent = 'Score: ' + score;
  ui.speed.textContent = 'Niveau: ' + levelName();
}
function sameCell(a, b) { return a.x === b.x && a.y === b.y; }

function resetGame() {
  state = 'playing';
  score = 0;
  tickAcc = 0;
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  spawnFood();
  lastTime = performance.now();
  updateHUD();
  if (animId) cancelAnimationFrame(animId);
  loop();
}

function spawnFood() {
  while (true) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    const onSnake = snake.some(c => c.x === x && c.y === y);
    if (!onSnake) { food = { x, y }; return; }
  }
}

function handleInput(key) {
  const k = key.toLowerCase();
  const map = {
    arrowup: { x: 0, y: -1 },  z: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 }, q: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 },
  };
  if (map[k]) {
    const d = map[k];
    if (dir.x + d.x === 0 && dir.y + d.y === 0) return;
    nextDir = d;
  } else if (k === 'p') {
    togglePause();
  } else if (k === 'r') {
    resetGame();
  }
}

function togglePause() {
  if (state === 'gameover') return;
  if (state === 'paused') {
    state = 'playing';
    lastTime = performance.now();
  } else if (state === 'playing') {
    state = 'paused';
  }
  ui.btnPause.setAttribute('aria-pressed', String(state === 'paused'));
}

function nextHead() {
  const h = snake[0];
  return { x: h.x + nextDir.x, y: h.y + nextDir.y };
}
function occupies(pos) {
  return snake.some(c => c.x === pos.x && c.y === pos.y);
}

function tick() {
  dir = { ...nextDir };
  const h = nextHead();
  if (h.x < 0 || h.x >= COLS || h.y < 0 || h.y >= ROWS) {
    state = 'gameover';
    return;
  }
  if (occupies(h)) {
    state = 'gameover';
    return;
  }
  const ate = sameCell(h, food);
  snake.unshift(h);
  if (!ate) {
    snake.pop();
  } else {
    score++;
    spawnFood();
    updateHUD();
  }
}

function render() {
  const s = CELL;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.12;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * s, y * s, s, s);
    }
  }
  ctx.globalAlpha = 1;
  const css = getComputedStyle(document.documentElement);
  ctx.fillStyle = css.getPropertyValue('--apple').trim() || '#ff5b6e';
  ctx.fillRect(food.x * s, food.y * s, s, s);
  ctx.fillStyle = css.getPropertyValue('--accent').trim() || '#7fdc5b';
  for (const c of snake) ctx.fillRect(c.x * s, c.y * s, s, s);
  if (state !== 'playing') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e6e6e6';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state === 'paused' ? 'PAUSE' : 'GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }
}

function loop() {
  animId = requestAnimationFrame(loop);
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  if (state !== 'playing') { render(); return; }
  tickAcc += dt;
  const step = 1 / levelFps();
  while (tickAcc >= step) {
    tickAcc -= step;
    tick();
  }
  render();
}

let keyboardBound = false;
startBtn.addEventListener('click', () => {
  startBtn.disabled = true;
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  footer.classList.remove('hidden');
  canvas.classList.remove('hidden');
  resetGame();
  if (!keyboardBound) {
    ui.btnPause.addEventListener('click', togglePause);
    ui.btnReset.addEventListener('click', resetGame);
    document.addEventListener('keydown', (e) => handleInput(e.key));
    keyboardBound = true;
  }
});
