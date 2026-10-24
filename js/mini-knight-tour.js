// ===== 미니게임 1: 나이트 투어 =====
// 나이트로 보드의 모든 칸을 방문하며 별을 수집

const KNIGHT_TOUR_LEVELS = [
  { size: 5, label: '5×5', starCount: 5, bonusTurns: 3 },
  { size: 6, label: '6×6', starCount: 7, bonusTurns: 3 },
  { size: 7, label: '7×7', starCount: 9, bonusTurns: 3 },
];
// 솔버 탐색 한도 (7×7 실측: 한 수 판정 평균 0.4ms, 한도 초과 0.02%)
const KT_NODE_LIMIT = 300000;

// ===== 설정 (크기 · 랜덤 시작 · 갈림길 경고) =====
function getKnightTourSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem('knight_tour_settings')) || {}; } catch { s = {}; }
  const levelIdx = KNIGHT_TOUR_LEVELS.findIndex(lv => lv.size === s.size);
  return { levelIdx: levelIdx >= 0 ? levelIdx : 0, randomStart: !!s.randomStart, branchWarn: !!s.branchWarn };
}
function saveKnightTourSettings(s) {
  try {
    localStorage.setItem('knight_tour_settings', JSON.stringify({
      size: KNIGHT_TOUR_LEVELS[s.levelIdx].size, randomStart: s.randomStart, branchWarn: s.branchWarn,
    }));
  } catch {}
}

function ktSelectSize(levelIdx) {
  const s = getKnightTourSettings();
  s.levelIdx = levelIdx;
  saveKnightTourSettings(s);
  goKnightTour(levelIdx);
}

function ktToggleOption(key) {
  const s = getKnightTourSettings();
  s[key] = !s[key];
  saveKnightTourSettings(s);
  // 랜덤 시작은 다음 판부터 적용 (아직 한 수도 안 뒀으면 바로 새 시작점)
  if (key === 'randomStart' && state.kt.moveCount === 0) goKnightTour(state.kt.levelIdx);
  else renderKnightTour();
}

// 시작점: 기본은 왼쪽 아래 모서리, 랜덤이면 완주 경로가 실제로 있는 칸 중에서 선택
function ktPickStart(size, random, prev) {
  const corner = [size - 1, 0];
  if (!random) return corner;
  const cells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!(prev && prev[0] === r && prev[1] === c)) cells.push([r, c]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  for (const [r, c] of cells) {
    const board = Array.from({length: size}, () => Array(size).fill(false));
    board[r][c] = true;
    if (ktFindPath(board, size, [r, c], KT_NODE_LIMIT).path) return [r, c];
  }
  return corner;
}

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
  const settings = getKnightTourSettings();
  if (levelIdx == null) levelIdx = settings.levelIdx;
  const lv = KNIGHT_TOUR_LEVELS[levelIdx];
  const size = lv.size;
  const prev = state.kt && state.kt.size === size ? state.kt.startPos : null;
  const start = ktPickStart(size, settings.randomStart, prev);
  state.kt = {
    levelIdx: levelIdx,
    size: size,
    board: Array.from({length: size}, () => Array(size).fill(false)),
    pos: start,
    startPos: start,
    visited: 1,
    total: size * size,
    stuck: false,
    clear: false,
    doomed: false,
    analysis: null,
    stars: [],
    score: 0,
    combo: 0,
    lastWasStar: false,
    moveCount: 0,
  };
  state.kt.board[start[0]][start[1]] = true;
  ktPlaceStars(state.kt);
  showScreen('mini');
  renderKnightTour();
}

function getKnightMoves(row, col, size, board) {
  const moves = [];
  for (const [dr, dc] of KNIGHT_DELTAS) {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < size && c >= 0 && c < size && !board[r][c]) {
      moves.push([r, c]);
    }
  }
  return moves;
}

// 갈림길 판정: 이번 수의 후보마다 그 칸으로 간 뒤에도 완주할 수 있는지 검사 (수마다 한 번만 계산)
function ktAnalyze(kt) {
  if (kt.analysis && kt.analysis.at === kt.moveCount) return kt.analysis;
  const fatal = [];
  let safe = 0;
  for (const [r, c] of getKnightMoves(kt.pos[0], kt.pos[1], kt.size, kt.board)) {
    kt.board[r][c] = true;
    const res = ktFindPath(kt.board, kt.size, [r, c], KT_NODE_LIMIT);
    kt.board[r][c] = false;
    if (res.path === null) fatal.push([r, c]);
    else safe++; // 한도 초과는 막힌 수로 단정하지 않음
  }
  kt.analysis = { at: kt.moveCount, fatal, safe };
  return kt.analysis;
}

function renderKnightTour() {
  const kt = state.kt;
  const size = kt.size;
  const [pr, pc] = kt.pos;
  const moves = kt.clear || kt.stuck ? [] : getKnightMoves(pr, pc, size, kt.board);
  const settings = getKnightTourSettings();

  let branch = false;
  if (settings.branchWarn && !kt.clear && !kt.stuck && !kt.doomed) {
    const a = ktAnalyze(kt);
    if (a.safe === 0) kt.doomed = true;
    else branch = a.fatal.length > 0;
  }

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
  } else if (settings.branchWarn && kt.doomed) {
    msg = `<div class="status-msg fail">😢 ${t('knightTourDoomed')}</div>`;
  } else if (branch) {
    msg = `<div class="status-msg warn">⚠️ ${t('knightTourBranch')}</div>`;
  } else {
    msg = `<div class="status-msg">${t('knightTourDesc')}</div>`;
  }

  const comboText = kt.combo >= 2 ? ` 🔥x${kt.combo}` : '';
  const info = `<div class="mission-info">
    <div class="mission-speech">⭐ ${kt.score}${comboText}</div>
    <div class="move-counter">${t('knightTourVisited')}: ${kt.visited}/${kt.total}</div>
  </div>`;

  const sizeChips = KNIGHT_TOUR_LEVELS.map((lv, i) =>
    `<button class="kt-chip${i === kt.levelIdx ? ' active' : ''}" onclick="ktSelectSize(${i})">${lv.label}</button>`
  ).join('');
  const toggle = (key, label) =>
    `<button class="kt-toggle${settings[key] ? ' on' : ''}" onclick="ktToggleOption('${key}')">
      <span class="kt-switch"></span>${label}
    </button>`;
  const options = `<div class="kt-options">
    <div class="kt-sizes">${sizeChips}</div>
    <div class="kt-toggles">
      ${toggle('randomStart', '🎲 ' + t('knightTourRandomStart'))}
      ${toggle('branchWarn', '⚠️ ' + t('knightTourBranchWarn'))}
    </div>
  </div>`;

  const actions = (!kt.clear && !kt.stuck) ? `
    <div class="mission-actions">
      <button class="icon-btn hint-btn" onclick="knightTourHint()">💡 ${t('hintBtn')}</button>
      <button class="icon-btn reset-btn" onclick="goKnightTour(${kt.levelIdx})">🔄 ${t('resetBtn')}</button>
    </div>` : '';

  const nextBtn = kt.clear && kt.levelIdx < KNIGHT_TOUR_LEVELS.length - 1
    ? `<button class="action-btn green" onclick="ktSelectSize(${kt.levelIdx + 1})">${t('btnNext')}</button>` : '';
  const retryBtn = (kt.stuck || kt.clear)
    ? `<button class="action-btn" onclick="goKnightTour(${kt.levelIdx})">${t('missionRetryBtn')}</button>` : '';

  document.getElementById('screen-mini').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="goMiniMenu()">← ${t('btnBack')}</button>
        <h2>${t('knightTourTitle')} ${KNIGHT_TOUR_LEVELS[kt.levelIdx].label}</h2>
      </div>
      ${options}
      ${msg} ${info}
      <div class="chess-board${branch ? ' kt-branch' : ''}" style="grid-template-columns:repeat(${size},1fr)">${cells}</div>
      ${actions} ${nextBtn} ${retryBtn}
    </div>`;
}

function knightTourClick(r, c) {
  if (state.animating) return;
  const kt = state.kt;
  if (kt.clear || kt.stuck) return;
  const moves = getKnightMoves(kt.pos[0], kt.pos[1], kt.size, kt.board);
  if (!moves.some(([mr, mc]) => mr === r && mc === c)) return;

  // 경고했던 막힌 수를 골랐다면 이후로는 완주 불가
  const a = kt.analysis && kt.analysis.at === kt.moveCount ? kt.analysis : null;
  if (a && a.fatal.some(([fr, fc]) => fr === r && fc === c)) kt.doomed = true;

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
      const pct = kt.visited / kt.total;
      const stars = pct >= 1 ? 3 : pct >= 0.8 ? 2 : 1;
      saveMiniGameStars('knighttour', kt.levelIdx || 0, stars);
      spawnParticles();
    } else {
      const next = getKnightMoves(r, c, kt.size, kt.board);
      if (next.length === 0) { kt.stuck = true; const pct=kt.visited/kt.total; if(pct>=0.4)saveMiniGameStars('knighttour',kt.levelIdx,pct>=0.8?2:1); }
    }
    renderKnightTour();
  }, kt.size);
}

function knightTourHint() {
  const kt = state.kt;
  if (kt.clear || kt.stuck) return;
  const boardEl = document.querySelector('#screen-mini .chess-board');
  if (!boardEl) return;

  const result = ktFindPath(kt.board, kt.size, kt.pos, KT_NODE_LIMIT);

  if (result.path === null) {
    // 완주 불가능
    const speech = document.querySelector('.mission-speech');
    if (speech) {
      speech.innerHTML = '⚠️ ' + t('knightTourUnsolvable');
      speech.classList.add('hint-active', 'hint-unsolvable');
    }
    return;
  }
  if (result.timeout) {
    // 한도 초과: 갈 곳이 가장 적은 칸(Warnsdorff)으로 한 수만 안내
    const best = getKnightMoves(kt.pos[0], kt.pos[1], kt.size, kt.board).map(([r, c]) => {
      kt.board[r][c] = true;
      const next = getKnightMoves(r, c, kt.size, kt.board).length;
      kt.board[r][c] = false;
      return [r, c, next];
    }).sort((a, b) => a[2] - b[2])[0];
    if (best) showHintArrow(boardEl, kt.pos[0], kt.pos[1], best[0], best[1], kt.size, t('knightTourHint'));
    return;
  }

  showHintPath(boardEl, result.path, kt.size, t('knightTourHintPath'));
}
