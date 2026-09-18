window.CLONE_WARS_GAME = true;

const DEFAULTS = {
  title: 'Flap Clone',
  fix: 'none',
  canvasWidth: 360,
  canvasHeight: 640,
  gravity: 1400,
  flapStrength: 420,
  birdSize: 34,
  pipeWidth: 64,
  pipeGap: 150,
  pipeSpacing: 260,
  pipeSpeed: 150,
  groundHeight: 80,
  modes: {
    easy: { pipeGap: 190, pipeSpeed: 110 },
    normal: { pipeGap: 150, pipeSpeed: 150 }
  }
};
const CONFIG = Object.assign({}, DEFAULTS, window.GAME_CONFIG || {});

const ART_NAMES = ['drawBackground', 'drawGround', 'drawBird', 'drawPipe'];
const SOUND_NAMES = ['flap', 'score', 'crash'];
const missing = [];
if (!window.GAME_CONFIG) missing.push('settings');
else for (const key of Object.keys(DEFAULTS)) { if (!(key in window.GAME_CONFIG)) missing.push(key); }
if (!window.SPRITES) missing.push('art');
else for (const name of ART_NAMES) { if (typeof window.SPRITES[name] !== 'function') missing.push(name); }
if (!window.SOUNDS) missing.push('sound');
else for (const name of SOUND_NAMES) { if (typeof window.SOUNDS[name] !== 'function') missing.push(name); }
document.getElementById('missing-label').textContent = missing.length ? 'placeholder: ' + missing.join(', ') + ' missing' : '';

function placeholderBackground(ctx, width, height, time) {
  ctx.fillStyle = '#09152f';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#173a68';
  ctx.fillRect(0, height * 0.55, width, height * 0.45);
}
function placeholderGround(ctx, width, height, groundHeight, offset) {
  ctx.fillStyle = '#34405a';
  ctx.fillRect(0, height - groundHeight, width, groundHeight);
}
function placeholderBird(ctx, x, y, size, velocity) {
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
}
function placeholderPipe(ctx, x, gapTop, gapBottom, pipeWidth, height) {
  ctx.fillStyle = '#52b788';
  ctx.fillRect(x, 0, pipeWidth, gapTop);
  ctx.fillRect(x, gapBottom, pipeWidth, height - gapBottom);
}

const drawBackground = (window.SPRITES && typeof window.SPRITES.drawBackground === 'function') ? window.SPRITES.drawBackground : placeholderBackground;
const drawGround = (window.SPRITES && typeof window.SPRITES.drawGround === 'function') ? window.SPRITES.drawGround : placeholderGround;
const drawBird = (window.SPRITES && typeof window.SPRITES.drawBird === 'function') ? window.SPRITES.drawBird : placeholderBird;
const drawPipe = (window.SPRITES && typeof window.SPRITES.drawPipe === 'function') ? window.SPRITES.drawPipe : placeholderPipe;

let muted = false;
function play(name) {
  if (muted) return;
  const sound = window.SOUNDS && window.SOUNDS[name];
  if (typeof sound === 'function') { try { sound(); } catch (error) {} }
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.canvasWidth;
canvas.height = CONFIG.canvasHeight;
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const fixButtons = document.getElementById('fix-buttons');
const sr = document.getElementById('sr');

let state = 'ready';
let y = (CONFIG.canvasHeight - CONFIG.groundHeight) / 2;
let velocity = 0;
let pipes = [];
let lasers = [];
let laserTimer = 0;
let pipesMade = 0;
let groundOffset = 0;
let lastGapTop = (CONFIG.canvasHeight - CONFIG.groundHeight - CONFIG.pipeGap) / 2;
let score = 0;
let checkpoint = 0;
let currentMode = 'normal';
let secondsSinceCrash = 0;
let bestScore = 0;
try { bestScore = parseInt(localStorage.getItem('cloneWarsBest'), 10) || 0; } catch (error) {}

function soundLine() { return 'Press M to turn sound ' + (muted ? 'on.' : 'off.'); }
function showReady() {
  overlayTitle.textContent = CONFIG.title;
  overlayText.textContent = ['Press Space, click or tap to start.', soundLine()].join('\n');
  overlay.hidden = false;
}
function showGameOver() {
  overlayTitle.textContent = 'Game over';
  const lines = ['Score ' + score + '   ·   Best ' + bestScore, 'Press Space, click or tap to play again.', soundLine()];
  if (checkpoint > 0) lines.splice(1, 0, 'Next game starts at checkpoint ' + checkpoint + '.');
  overlayText.textContent = lines.join('\n');
  overlay.hidden = false;
}
function startGame() {
  state = 'playing';
  y = (CONFIG.canvasHeight - CONFIG.groundHeight) / 2;
  velocity = -CONFIG.flapStrength;
  pipes = [];
  lasers = [];
  laserTimer = 0;
  pipesMade = 0;
  groundOffset = 0;
  lastGapTop = (CONFIG.canvasHeight - CONFIG.groundHeight - CONFIG.pipeGap) / 2;
  score = checkpoint;
  secondsSinceCrash = 0;
  overlay.hidden = true;
  play('flap');
}
function press() {
  if (state === 'ready') startGame();
  else if (state === 'playing') { velocity = -CONFIG.flapStrength; play('flap'); }
  else if (state === 'gameover' && secondsSinceCrash >= 0.4) startGame();
}

window.addEventListener('keydown', (event) => {
  if (event.target && event.target.closest && event.target.closest('button')) return;
  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault();
    press();
  } else if (event.code === 'KeyM') {
    muted = !muted;
    if (state === 'ready') showReady();
    if (state === 'gameover') showGameOver();
  }
});
window.addEventListener('pointerdown', (event) => {
  if (event.target && event.target.closest && event.target.closest('button')) return;
  press();
});

function addPipe(pipeGap) {
  const gap = pipeGap + (CONFIG.fix === 'gentle-start' && pipesMade < 3 ? 70 : 0);
  const lowest = CONFIG.canvasHeight - CONFIG.groundHeight - 60 - gap;
  const gapTop = Math.max(60, Math.min(lowest, lastGapTop + (Math.random() * 360 - 180)));
  const gapBottom = gapTop + gap;
  lastGapTop = gapTop;
  pipes.push({ x: CONFIG.canvasWidth, gapTop: gapTop, gapBottom: gapBottom, scored: false });
  pipesMade += 1;
}

function addLaser() {
  const laserHeight = 14;
  const highest = 70;
  const lowest = CONFIG.canvasHeight - CONFIG.groundHeight - 70 - laserHeight;
  const laserY = highest + Math.random() * Math.max(0, lowest - highest);
  lasers.push({ x: CONFIG.canvasWidth, y: laserY, width: 54, height: laserHeight });
}

function crash() {
  if (state !== 'playing') return;
  state = 'gameover';
  secondsSinceCrash = 0;
  play('crash');
  if (score > bestScore) bestScore = score;
  try { localStorage.setItem('cloneWarsBest', String(bestScore)); } catch (error) {}
  checkpoint = CONFIG.fix === 'checkpoints' ? Math.floor(score / 10) * 10 : 0;
  sr.textContent = 'Game over. Score ' + score + '. Best ' + bestScore + '.';
  showGameOver();
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastTime = 0;
function frame(now) {
  const seconds = lastTime ? Math.min(0.05, Math.max(0, (now - lastTime) / 1000)) : 0;
  lastTime = now;
  const time = reduceMotion ? 0 : now / 1000;
  const birdX = CONFIG.canvasWidth / 4;
  if (state === 'playing') {
    const mode = CONFIG.fix === 'easy-mode' ? CONFIG.modes[currentMode] : CONFIG;
    const pipeGap = mode.pipeGap;
    const pipeSpeed = mode.pipeSpeed * (CONFIG.fix === 'gentle-start' && score < 3 ? 0.75 : 1);
    velocity += CONFIG.gravity * seconds;
    y += velocity * seconds;
    groundOffset += pipeSpeed * seconds;
    if (pipes.length === 0) addPipe(pipeGap);
    else if (pipes[pipes.length - 1].x <= CONFIG.canvasWidth - CONFIG.pipeSpacing) addPipe(pipeGap);
    if (CONFIG.fix === 'custom') {
      laserTimer += seconds;
      if (laserTimer >= 1.4) {
        laserTimer = 0;
        addLaser();
      }
    }
    for (const pipe of pipes) {
      pipe.x -= pipeSpeed * seconds;
      if (!pipe.scored && pipe.x + CONFIG.pipeWidth < birdX) { pipe.scored = true; score += 1; play('score'); }
    }
    for (const laser of lasers) laser.x -= pipeSpeed * 1.4 * seconds;
    pipes = pipes.filter((pipe) => pipe.x + CONFIG.pipeWidth > 0);
    lasers = lasers.filter((laser) => laser.x + laser.width > 0);
    const half = CONFIG.birdSize / 2;
    const birdLeft = birdX - half;
    const birdRight = birdX + half;
    const birdTop = y - half;
    const birdBottom = y + half;
    if (birdBottom >= CONFIG.canvasHeight - CONFIG.groundHeight || birdTop <= 0) crash();
    for (const pipe of pipes) {
      const horizontal = birdRight >= pipe.x && birdLeft <= pipe.x + CONFIG.pipeWidth;
      const vertical = birdTop <= pipe.gapTop || birdBottom >= pipe.gapBottom;
      if (horizontal && vertical) { crash(); break; }
    }
    for (const laser of lasers) {
      const horizontal = birdRight >= laser.x && birdLeft <= laser.x + laser.width;
      const vertical = birdBottom >= laser.y && birdTop <= laser.y + laser.height;
      if (horizontal && vertical) { crash(); break; }
    }
  } else if (state === 'gameover') {
    secondsSinceCrash += seconds;
  }
  drawBackground(ctx, CONFIG.canvasWidth, CONFIG.canvasHeight, time);
  for (const pipe of pipes) drawPipe(ctx, pipe.x, pipe.gapTop, pipe.gapBottom, CONFIG.pipeWidth, CONFIG.canvasHeight - CONFIG.groundHeight);
  if (CONFIG.fix === 'custom') {
    ctx.save();
    for (const laser of lasers) {
      ctx.fillStyle = '#ff3158';
      ctx.strokeStyle = '#26051a';
      ctx.lineWidth = 3;
      ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
      ctx.strokeRect(laser.x, laser.y, laser.width, laser.height);
    }
    ctx.restore();
  }
  drawGround(ctx, CONFIG.canvasWidth, CONFIG.canvasHeight, CONFIG.groundHeight, groundOffset);
  drawBird(ctx, birdX, y, CONFIG.birdSize, velocity);
  if (state === 'playing') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px sans-serif';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0b1020';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(String(score), CONFIG.canvasWidth / 2, 64);
    ctx.fillText(String(score), CONFIG.canvasWidth / 2, 64);
    ctx.restore();
  }
  requestAnimationFrame(frame);
}

if (CONFIG.fix === 'easy-mode') {
  for (const mode of ['easy', 'normal']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = mode === 'easy' ? 'Easy' : 'Normal';
    button.setAttribute('aria-pressed', String(mode === currentMode));
    button.addEventListener('click', (event) => {
      currentMode = mode;
      for (const other of fixButtons.querySelectorAll('button')) {
        other.setAttribute('aria-pressed', String(other === event.currentTarget));
      }
      event.currentTarget.blur();
    });
    fixButtons.appendChild(button);
  }
}

showReady();
requestAnimationFrame(frame);
