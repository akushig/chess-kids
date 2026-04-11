// ===== 미니게임 1: 나이트 투어 =====
// 나이트로 보드의 모든 칸을 한 번씩 방문

const KNIGHT_TOUR_LEVELS = [
  { size: 5, label: '5×5' },
  { size: 6, label: '6×6' },
];

function goKnightTour(levelIdx) {
  const lv = KNIGHT_TOUR_LEVELS[levelIdx || 0];
  const size = lv.size;
  state.kt = {
    levelIdx: levelIdx || 0,
    size: size,
    board: Array.from({length: size}, () => Array(size).fill(false)),
    pos: [size - 1, 0],
    visited: 1,
    total: size * size,
    stuck: false,
    clear: false,
  };
  state.kt.board[size - 1][0] = true;
  showScreen('mini');
  renderKnightTour();
}

function getKnightMoves(row, col, size, board) {
  const moves = [];
  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < size && c >= 0 && c < size && !board[r][c]) {
      moves.push([r, c]);
    }
  }
  return moves;
}

// Warnsdorff 힌트: 다음 이동 가능 칸 중 가장 적은 선택지를 가진 칸
function getKnightTourHint(kt) {
  const moves = getKnightMoves(kt.pos[0], kt.pos[1], kt.size, kt.board);
  if (moves.length === 0) return null;
  let best = null, bestCount = Infinity;
  for (const [r, c] of moves) {
    kt.board[r][c] = true;
    const next = getKnightMoves(r, c, kt.size, kt.board).length;
    kt.board[r][c] = false;
    if (next < bestCount) { bestCount = next; best = [r, c]; }
  }
  return best;
}

function renderKnightTour() {
  const kt = state.kt;
  const size = kt.size;
  const [pr, pc] = kt.pos;
  const moves = kt.clear || kt.stuck ? [] : getKnightMoves(pr, pc, size, kt.board);

  let cells = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isLight = (r + c) % 2 === 0;
      let cls = 'board-cell ' + (isLight ? 'light' : 'dark');
      let content = '';

      if (r === pr && c === pc) {
        cls += ' selected';
        content = getPieceSVG('wN', 36);
      } else if (kt.board[r][c]) {
        cls += ' kt-visited';
        content = '<span class="kt-check">✓</span>';
      } else if (moves.some(([mr, mc]) => mr === r && mc === c)) {
        cls += ' move-hint';
      }

      cells += `<div class="${cls}" onclick="knightTourClick(${r},${c})">${content}</div>`;
    }
  }

  let msg;
  if (kt.clear) {
    msg = `<div class="status-msg success">${t('knightTourClear')}</div>`;
  } else if (kt.stuck) {
    msg = `<div class="status-msg fail">${t('knightTourStuck')} (${kt.visited}/${kt.total})</div>`;
  } else {
    msg = `<div class="status-msg">${t('knightTourDesc')}</div>`;
  }

  const info = `<div class="mission-info">
    <div class="mission-speech">${t('knightTourVisited')}: ${kt.visited}/${kt.total}</div>
    <div class="move-counter">${t('knightTourRemain')}: ${kt.total - kt.visited}</div>
  </div>`;

  const actions = (!kt.clear && !kt.stuck) ? `
    <div class="mission-actions">
      <button class="icon-btn hint-btn" onclick="knightTourHint()">💡 ${t('hintBtn')}</button>
      <button class="icon-btn reset-btn" onclick="goKnightTour(${kt.levelIdx})">🔄 ${t('resetBtn')}</button>
    </div>` : '';

  const nextBtn = kt.clear && kt.levelIdx < KNIGHT_TOUR_LEVELS.length - 1
    ? `<button class="action-btn green" onclick="goKnightTour(${kt.levelIdx + 1})">${t('btnNext')}</button>` : '';
  const retryBtn = kt.stuck
    ? `<button class="action-btn" onclick="goKnightTour(${kt.levelIdx})">${t('missionRetryBtn')}</button>` : '';

  document.getElementById('screen-mini').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="goMiniMenu()">← ${t('btnBack')}</button>
        <h2>${t('knightTourTitle')} ${KNIGHT_TOUR_LEVELS[kt.levelIdx].label}</h2>
      </div>
      ${msg} ${info}
      <div class="chess-board" style="grid-template-columns:repeat(${size},1fr)">${cells}</div>
      ${actions} ${nextBtn} ${retryBtn}
    </div>`;
}

function knightTourClick(r, c) {
  if (state.animating) return;
  const kt = state.kt;
  if (kt.clear || kt.stuck) return;
  const moves = getKnightMoves(kt.pos[0], kt.pos[1], kt.size, kt.board);
  if (!moves.some(([mr, mc]) => mr === r && mc === c)) return;

  const [pr, pc] = kt.pos;
  const boardEl = document.querySelector('#screen-mini .chess-board');
  kt.board[r][c] = true;
  kt.pos = [r, c];
  kt.visited++;

  animateMove(boardEl, pr, pc, r, c, 'wN', () => {
    if (kt.visited === kt.total) {
      kt.clear = true;
      spawnParticles();
    } else {
      const next = getKnightMoves(r, c, kt.size, kt.board);
      if (next.length === 0) kt.stuck = true;
    }
    renderKnightTour();
  }, kt.size);
}

function knightTourHint() {
  const kt = state.kt;
  const hint = getKnightTourHint(kt);
  if (!hint) return;
  const [hr, hc] = hint;
  const boardEl = document.querySelector('#screen-mini .chess-board');
  if (!boardEl) return;
  const idx = hr * kt.size + hc;
  const cell = boardEl.children[idx];
  if (cell) {
    cell.classList.add('hint-highlight');
    setTimeout(() => cell.classList.remove('hint-highlight'), 2500);
  }
  const speech = document.querySelector('.mission-speech');
  if (speech) { speech.innerHTML = `💡 ${t('knightTourHint')}`; speech.classList.add('hint-active'); setTimeout(() => speech.classList.remove('hint-active'), 2500); }
}
