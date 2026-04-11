// ===== 앱 코어: 상태, 화면전환, 애니메이션, 파티클, 초기화 =====
const APP_VERSION = '260411.1945';

const state = {
  screen: 'home',
  animating: false,
  // 모험
  missionPiece: null,
  missionIdx: 0,
  missionBoard: null,
  missionPlayerPos: null,
  missionSolved: false,
  missionFailed: false,
  missionMoveCount: 0,
  missionHintShown: false,
  // 퍼즐
  puzzleLevel: null,
  puzzleIndex: 0,
  puzzleSolved: false,
  puzzleFailed: false,
  puzzleGame: null,
  puzzleSelected: null,
  puzzleValidMoves: [],
  puzzleMoveCount: 0,
  puzzleSolutionStep: 0,
  // 대전
  game: null,
};

const PIECE_ORDER = ['P', 'R', 'N', 'B', 'Q', 'K'];
const PIECE_ICONS = { P:'wP', N:'wN', B:'wB', R:'wR', Q:'wQ', K:'wK' };
const PIECE_NAMES = { P:'piecePawn', N:'pieceKnight', B:'pieceBishop', R:'pieceRook', Q:'pieceQueen', K:'pieceKing' };
const MISSION_BOARD_SIZE = 6;

// ===== 화면 전환 =====
function showScreen(name) {
  state.screen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
}

// ===== 이동 애니메이션 =====
function animateMove(boardEl, fromR, fromC, toR, toC, pieceKey, callback, gridSize) {
  state.animating = true;
  const cols = gridSize || 8;
  const cellSize = boardEl.offsetWidth / cols;

  if (fromR === toR && fromC === toC) {
    state.animating = false;
    callback();
    return;
  }

  const ghost = document.createElement('div');
  ghost.className = 'move-anim';
  ghost.innerHTML = getPieceSVG(pieceKey, Math.round(cellSize * 0.8));
  ghost.style.width = cellSize + 'px';
  ghost.style.height = cellSize + 'px';
  ghost.style.top = (fromR * cellSize) + 'px';
  ghost.style.left = (fromC * cellSize) + 'px';
  boardEl.appendChild(ghost);

  const fromIdx = fromR * cols + fromC;
  const fromCell = boardEl.children[fromIdx];
  if (fromCell) {
    const inner = fromCell.querySelector('svg') || fromCell.querySelector('span');
    if (inner) inner.style.visibility = 'hidden';
  }

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    if (ghost.parentNode) ghost.remove();
    state.animating = false;
    callback();
  }

  ghost.addEventListener('transitionend', finish, { once: true });
  setTimeout(finish, 400);

  requestAnimationFrame(() => {
    ghost.style.top = (toR * cellSize) + 'px';
    ghost.style.left = (toC * cellSize) + 'px';
  });
}

// ===== 캡처 애니메이션 =====
function animateCapture(boardEl, toR, toC, capturedPieceKey, targetId) {
  const cellSize = boardEl.offsetWidth / 8;
  const boardRect = boardEl.getBoundingClientRect();
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;
  const targetRect = targetEl.getBoundingClientRect();

  const ghost = document.createElement('div');
  ghost.className = 'capture-anim';
  ghost.innerHTML = getPieceSVG(capturedPieceKey, 24);
  ghost.style.position = 'fixed';
  ghost.style.zIndex = '20';
  ghost.style.pointerEvents = 'none';
  ghost.style.transition = 'top 0.4s ease, left 0.4s ease, transform 0.4s ease, opacity 0.4s ease';
  ghost.style.top = (boardRect.top + toR * cellSize) + 'px';
  ghost.style.left = (boardRect.left + toC * cellSize) + 'px';
  ghost.style.width = cellSize + 'px';
  ghost.style.height = cellSize + 'px';
  ghost.style.display = 'flex';
  ghost.style.alignItems = 'center';
  ghost.style.justifyContent = 'center';
  document.body.appendChild(ghost);

  requestAnimationFrame(() => {
    ghost.style.top = targetRect.top + 'px';
    ghost.style.left = (targetRect.left + targetRect.width - 24) + 'px';
    ghost.style.transform = 'scale(0.6)';
    ghost.style.opacity = '0.6';
  });

  setTimeout(() => { if (ghost.parentNode) ghost.remove(); }, 500);
}

// ===== 파티클 효과 =====
function spawnParticles() {
  const container = document.createElement('div');
  container.className = 'particle-container';
  document.body.appendChild(container);

  const colors = ['#FFD93D','#FF6B6B','#4ECDC4','#A29BFE','#55EFC4','#FF9F43'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = '-20px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDelay = (Math.random() * 0.5) + 's';
    p.style.animationDuration = (1.5 + Math.random()) + 's';
    container.appendChild(p);
  }
  setTimeout(() => { if (container.parentNode) container.remove(); }, 3000);
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (newSW) {
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'activated' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        }
      });
    }).catch(() => {});
  }
  renderHome();
  showScreen('home');
});
