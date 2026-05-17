// ===== 앱 코어: 상태, 화면전환, 애니메이션, 파티클, 초기화 =====
const APP_VERSION = '260411.2115';

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

// ===== 공통 힌트 화살표 유틸리티 =====
function showHintArrow(boardEl, fromR, fromC, toR, toC, gridSize, text) {
  if (!boardEl) return;
  const cols = gridSize || 8;
  const cellSize = boardEl.offsetWidth / cols;

  // 출발칸 하이라이트
  const fromIdx = fromR * cols + fromC;
  const fromCell = boardEl.children[fromIdx];
  if (fromCell) fromCell.classList.add('hint-highlight');

  // 도착칸 하이라이트
  const toIdx = toR * cols + toC;
  const toCell = boardEl.children[toIdx];
  if (toCell) toCell.classList.add('hint-highlight');

  // 화살표 SVG
  const arrow = document.createElement('div');
  arrow.className = 'hint-arrow';
  const fx = (fromC + 0.5) * cellSize;
  const fy = (fromR + 0.5) * cellSize;
  const tx = (toC + 0.5) * cellSize;
  const ty = (toR + 0.5) * cellSize;
  arrow.innerHTML = `
    <svg width="${boardEl.offsetWidth}" height="${boardEl.offsetHeight}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:15;">
      <defs><marker id="hintHead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#FF6B6B"/>
      </marker></defs>
      <line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}" stroke="#FF6B6B" stroke-width="4" stroke-linecap="round" marker-end="url(#hintHead)" opacity="0.85" class="hint-arrow-line"/>
    </svg>`;
  boardEl.appendChild(arrow);

  // 텍스트 표시
  const speech = document.querySelector('.mission-speech');
  if (speech && text) {
    speech.innerHTML = '💡 ' + text;
    speech.classList.add('hint-active');
  }

  // 3초 후 제거
  setTimeout(() => {
    if (fromCell) fromCell.classList.remove('hint-highlight');
    if (toCell) toCell.classList.remove('hint-highlight');
    if (arrow.parentNode) arrow.remove();
    if (speech) speech.classList.remove('hint-active');
  }, 3000);
}

function showHintTarget(boardEl, targetR, targetC, gridSize, text) {
  if (!boardEl) return;
  const cols = gridSize || 8;
  const idx = targetR * cols + targetC;
  const cell = boardEl.children[idx];
  if (cell) cell.classList.add('hint-highlight');

  const speech = document.querySelector('.mission-speech');
  if (speech && text) {
    speech.innerHTML = '💡 ' + text;
    speech.classList.add('hint-active');
  }

  setTimeout(() => {
    if (cell) cell.classList.remove('hint-highlight');
    if (speech) speech.classList.remove('hint-active');
  }, 3000);
}

// ===== 전체 경로 힌트 표시 =====
// path: [[r,c], ...] 순서대로 이동할 위치 배열 (첫 번째는 현재 위치)
function showHintPath(boardEl, path, gridSize, text) {
  if (!boardEl || !path || path.length < 2) return;
  const cols = gridSize || 8;
  const cellSize = boardEl.offsetWidth / cols;

  // 경로 셀 하이라이트
  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];
    const idx = r * cols + c;
    const cell = boardEl.children[idx];
    if (cell) cell.classList.add(i === 0 ? 'hint-path-start' : 'hint-path-cell');
  }

  // 화살표 SVG
  let lines = '';
  for (let i = 0; i < path.length - 1; i++) {
    const [fr, fc] = path[i];
    const [tr, tc] = path[i + 1];
    const fx = (fc + 0.5) * cellSize, fy = (fr + 0.5) * cellSize;
    const tx = (tc + 0.5) * cellSize, ty = (tr + 0.5) * cellSize;
    lines += `<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}"
      stroke="#43A047" stroke-width="3" stroke-linecap="round"
      marker-end="url(#pathHead)" opacity="0.7" class="hint-path-line"/>`;
  }
  const arrowEl = document.createElement('div');
  arrowEl.className = 'hint-arrow hint-path-overlay';
  arrowEl.innerHTML = `
    <svg width="${boardEl.offsetWidth}" height="${boardEl.offsetHeight}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:15;">
      <defs><marker id="pathHead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#43A047"/>
      </marker></defs>
      ${lines}
    </svg>`;
  boardEl.appendChild(arrowEl);

  // 번호 마커
  const markerEl = document.createElement('div');
  markerEl.className = 'hint-path-overlay';
  markerEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:16;';
  for (let i = 1; i < path.length; i++) {
    const [r, c] = path[i];
    const badge = document.createElement('div');
    badge.className = 'hint-step-badge';
    badge.style.left = ((c + 0.5) * cellSize) + 'px';
    badge.style.top = ((r + 0.5) * cellSize) + 'px';
    badge.textContent = i;
    markerEl.appendChild(badge);
  }
  boardEl.appendChild(markerEl);

  // 텍스트
  const speech = document.querySelector('.mission-speech');
  if (speech && text) {
    speech.innerHTML = '💡 ' + text;
    speech.classList.add('hint-active');
  }
}

// moves: [[fromR, fromC, toR, toC], ...] 각 수의 출발/도착 배열 (퍼즐용)
function showHintMoves(boardEl, moves, gridSize, text) {
  if (!boardEl || !moves || moves.length === 0) return;
  const cols = gridSize || 8;
  const cellSize = boardEl.offsetWidth / cols;

  let lines = '';
  for (let i = 0; i < moves.length; i++) {
    const [fr, fc, tr, tc] = moves[i];
    const fx = (fc + 0.5) * cellSize, fy = (fr + 0.5) * cellSize;
    const tx = (tc + 0.5) * cellSize, ty = (tr + 0.5) * cellSize;
    // 출발/도착 하이라이트
    const fromIdx = fr * cols + fc, toIdx = tr * cols + tc;
    const fromCell = boardEl.children[fromIdx], toCell = boardEl.children[toIdx];
    if (fromCell) fromCell.classList.add('hint-path-start');
    if (toCell) toCell.classList.add('hint-path-cell');
    lines += `<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}"
      stroke="#43A047" stroke-width="3" stroke-linecap="round"
      marker-end="url(#pathHead2)" opacity="0.75" class="hint-path-line"/>`;
  }

  const arrowEl = document.createElement('div');
  arrowEl.className = 'hint-arrow hint-path-overlay';
  arrowEl.innerHTML = `
    <svg width="${boardEl.offsetWidth}" height="${boardEl.offsetHeight}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:15;">
      <defs><marker id="pathHead2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#43A047"/>
      </marker></defs>
      ${lines}
    </svg>`;
  boardEl.appendChild(arrowEl);

  // 번호 마커 (도착칸에 표시)
  const markerEl = document.createElement('div');
  markerEl.className = 'hint-path-overlay';
  markerEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:16;';
  for (let i = 0; i < moves.length; i++) {
    const [, , tr, tc] = moves[i];
    const badge = document.createElement('div');
    badge.className = 'hint-step-badge';
    badge.style.left = ((tc + 0.5) * cellSize) + 'px';
    badge.style.top = ((tr + 0.5) * cellSize) + 'px';
    badge.textContent = i + 1;
    markerEl.appendChild(badge);
  }
  boardEl.appendChild(markerEl);

  const speech = document.querySelector('.mission-speech');
  if (speech && text) {
    speech.innerHTML = '💡 ' + text;
    speech.classList.add('hint-active');
  }
}

function showHintUnsolvable() {
  const speech = document.querySelector('.mission-speech');
  if (speech) {
    speech.innerHTML = '⚠️ ' + t('hintUnsolvable');
    speech.classList.add('hint-active', 'hint-unsolvable');
  }
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
