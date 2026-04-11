// ===== 미니게임 1: 나이트 투어 =====
// 나이트로 보드의 모든 칸을 방문하며 별을 수집

const KNIGHT_TOUR_LEVELS = [
  { size: 5, label: '5×5', starCount: 5, bonusTurns: 3 },
  { size: 6, label: '6×6', starCount: 7, bonusTurns: 3 },
];

function ktPlaceStars(kt) {
  const empties = [];
  for (let r = 0; r < kt.size; r++)
    for (let c = 0; c < kt.size; c++)
      if (!(r === kt.pos[0] && c === kt.pos[1])) empties.push([r, c]);
  // 셔플 후 앞에서 N개 선택
  for (let i = empties.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [empties[i], empties[j]] = [empties[j], empties[i]];
  }
  const lv = KNIGHT_TOUR_LEVELS[kt.levelIdx];
  kt.stars = empties.slice(0, lv.starCount);
}

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
    stars: [],
    score: 0,
    combo: 0,
    lastWasStar: false,
    moveCount: 0,
  };
  state.kt.board[size - 1][0] = true;
  ktPlaceStars(state.kt);
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

// Warnsdorff 힌트: 별이 있는 칸 우선, 없으면 가장 적은 선택지
function getKnightTourHint(kt) {
  const moves = getKnightMoves(kt.pos[0], kt.pos[1], kt.size, kt.board);
  if (moves.length === 0) return null;
  // 별이 있는 칸 우선
  const starMoves = moves.filter(([r, c]) => kt.stars.some(([sr, sc]) => sr === r && sc === c));
  if (starMoves.length > 0) return starMoves[0];
  // Warnsdorff
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

      const isStar = kt.stars.some(([sr, sc]) => sr === r && sc === c);

      if (r === pr && c === pc) {
        cls += ' selected';
        content = getPieceSVG('wN', 36);
      } else if (kt.board[r][c]) {
        cls += ' kt-visited';
        content = '<span class="kt-check">✓</span>';
      } else if (isStar) {
        content = '<span class="collector-star">⭐</span>';
        if (moves.some(([mr, mc]) => mr === r && mc === c)) cls += ' move-hint';
      } else if (moves.some(([mr, mc]) => mr === r && mc === c)) {
        cls += ' move-hint';
      }

      cells += `<div class="${cls}" onclick="knightTourClick(${r},${c})">${content}</div>`;
    }
  }

  let msg;
  if (kt.clear) {
    msg = `<div class="status-msg success">${t('knightTourClear')} 🎉</div>`;
  } else if (kt.stuck) {
    msg = `<div class="status-msg fail">${t('knightTourStuck')} (${kt.visited}/${kt.total})</div>`;
  } else {
    msg = `<div class="status-msg">${t('knightTourDesc')}</div>`;
  }

  const comboText = kt.combo >= 2 ? ` 🔥x${kt.combo}` : '';
  const info = `<div class="mission-info">
    <div class="mission-speech">⭐ ${kt.score}${comboText}</div>
    <div class="move-counter">${t('knightTourVisited')}: ${kt.visited}/${kt.total}</div>
  </div>`;

  const actions = (!kt.clear && !kt.stuck) ? `
    <div class="mission-actions">
      <button class="icon-btn hint-btn" onclick="knightTourHint()">💡 ${t('hintBtn')}</button>
      <button class="icon-btn reset-btn" onclick="goKnightTour(${kt.levelIdx})">🔄 ${t('resetBtn')}</button>
    </div>` : '';

  const nextBtn = kt.clear && kt.levelIdx < KNIGHT_TOUR_LEVELS.length - 1
    ? `<button class="action-btn green" onclick="goKnightTour(${kt.levelIdx + 1})">${t('btnNext')}</button>` : '';
  const retryBtn = (kt.stuck || kt.clear)
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
  kt.moveCount++;

  // 별 수집 체크
  const si = kt.stars.findIndex(([sr, sc]) => sr === r && sc === c);
  const gotStar = si >= 0;
  if (gotStar) {
    kt.stars.splice(si, 1);
    kt.combo = kt.lastWasStar ? kt.combo + 1 : 1;
    kt.score += kt.combo; // 콤보 보너스
    kt.lastWasStar = true;
  } else {
    kt.combo = 0;
    kt.lastWasStar = false;
  }

  animateMove(boardEl, pr, pc, r, c, 'wN', () => {
    // 별을 다 모으면 남은 칸에 새 별 추가
    if (kt.stars.length === 0 && kt.visited < kt.total) {
      const lv = KNIGHT_TOUR_LEVELS[kt.levelIdx];
      const empties = [];
      for (let rr = 0; rr < kt.size; rr++)
        for (let cc = 0; cc < kt.size; cc++)
          if (!kt.board[rr][cc]) empties.push([rr, cc]);
      for (let i = empties.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [empties[i], empties[j]] = [empties[j], empties[i]];
      }
      kt.stars = empties.slice(0, Math.min(lv.bonusTurns, empties.length));
    }

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
