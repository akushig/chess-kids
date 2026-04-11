// ===== 모험 화면: 월드 선택 → 스테이지 맵 → 미션 플레이 =====

// --- 월드 선택 ---
function goAdventure() {
  showScreen('learn');
  renderWorldSelect();
}

function renderWorldSelect() {
  let cards = PIECE_ORDER.map(key => {
    const missions = MISSIONS[key];
    const cleared = getPieceClearCount(key);
    const total = missions.length;
    const stars = getPieceTotalStars(key);
    const maxStars = total * 3;
    const pct = Math.round((cleared / total) * 100);
    return `
      <button class="world-card" onclick="goStageMap('${key}')">
        <span class="world-card-icon">${getPieceSVG(PIECE_ICONS[key], 52)}</span>
        <span class="world-card-name">${t(PIECE_NAMES[key])}</span>
        <div class="world-card-stars">⭐ ${stars}/${maxStars}</div>
        <div class="world-card-bar"><div class="world-card-fill" style="width:${pct}%"></div></div>
      </button>
    `;
  }).join('');

  document.getElementById('screen-learn').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('adventureTitle')}</h2>
      </div>
      <div class="world-grid">${cards}</div>
    </div>
  `;
}

// --- 스테이지 맵 ---
function goStageMap(pieceKey) {
  state.missionPiece = pieceKey;
  renderStageMap();
}

function renderStageMap() {
  const key = state.missionPiece;
  const missions = MISSIONS[key];
  let nodes = '';

  for (let i = missions.length - 1; i >= 0; i--) {
    const stars = getMissionStars(key, i);
    const cleared = stars > 0;
    const locked = i > 0 && getMissionStars(key, i - 1) === 0;
    const isCurrent = !cleared && !locked;

    let cls = 'stage-node';
    if (cleared) cls += ' cleared';
    else if (isCurrent) cls += ' current';
    else if (locked) cls += ' locked';

    const starDisplay = cleared
      ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars)
      : '☆☆☆';

    nodes += `
      <div class="stage-row">
        <button class="${cls}" ${locked ? 'disabled' : `onclick="goMissionPlay('${key}', ${i})"`}>
          <span class="stage-num">${i + 1}</span>
          <span class="stage-stars">${starDisplay}</span>
        </button>
      </div>
    `;

    if (i > 0) {
      const connActive = cleared ? ' active' : '';
      nodes += `<div class="stage-connector${connActive}"></div>`;
    }
  }

  document.getElementById('screen-learn').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="renderWorldSelect()">← ${t('btnBack')}</button>
        <h2>${getPieceSVG(PIECE_ICONS[key], 24)} ${t(PIECE_NAMES[key])}${t('worldTitle')}</h2>
      </div>
      <div class="stage-map">${nodes}</div>
    </div>
  `;
}

// --- 미션 플레이 ---
function goMissionPlay(pieceKey, missionIdx) {
  const mission = MISSIONS[pieceKey][missionIdx];
  state.missionPiece = pieceKey;
  state.missionIdx = missionIdx;
  state.missionBoard = buildMissionBoard(mission);
  state.missionPlayerPos = [...mission.start];
  state.missionSolved = false;
  state.missionFailed = false;
  state.missionMoveCount = 0;
  state.missionHintShown = false;
  showScreen('learn');
  renderMissionBoard();
}

function buildMissionBoard(mission) {
  const size = MISSION_BOARD_SIZE;
  const board = Array.from({ length: size }, () => Array(size).fill(null));
  board[mission.start[0]][mission.start[1]] = mission.piece;
  if (mission.targets) {
    mission.targets.forEach(([r, c, p]) => { board[r][c] = p; });
  }
  if (mission.enemies) {
    mission.enemies.forEach(([r, c, p]) => { board[r][c] = p; });
  }
  return board;
}

function getMissionValidMoves(board, row, col, mission) {
  const piece = board[row][col];
  if (!piece) return [];
  const type = piece[1];
  const color = piece[0];
  const opp = color === 'w' ? 'b' : 'w';
  const size = MISSION_BOARD_SIZE;
  const moves = [];

  const inB = (r, c) => r >= 0 && r < size && c >= 0 && c < size;
  const isBlock = (r, c) => mission.blocks.some(([br, bc]) => br === r && bc === c);
  const isEnemy = (r, c) => board[r][c] && board[r][c][0] === opp;
  const isFriendly = (r, c) => board[r][c] && board[r][c][0] === color;

  const add = (r, c) => {
    if (inB(r, c) && !isBlock(r, c) && !isFriendly(r, c)) moves.push([r, c]);
  };
  const slide = (dr, dc) => {
    let r = row + dr, c = col + dc;
    while (inB(r, c) && !isBlock(r, c)) {
      if (isFriendly(r, c)) break;
      moves.push([r, c]);
      if (isEnemy(r, c)) break;
      r += dr; c += dc;
    }
  };

  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? size - 2 : 1;
    if (inB(row + dir, col) && !board[row + dir][col] && !isBlock(row + dir, col)) {
      moves.push([row + dir, col]);
      if (row === startRow && !board[row + 2 * dir][col] && !isBlock(row + 2 * dir, col)) {
        moves.push([row + 2 * dir, col]);
      }
    }
    for (const dc of [-1, 1]) {
      if (inB(row + dir, col + dc) && isEnemy(row + dir, col + dc)) {
        moves.push([row + dir, col + dc]);
      }
    }
  } else if (type === 'N') {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(row+dr, col+dc);
  } else if (type === 'B') {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr, dc);
  } else if (type === 'R') {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
  } else if (type === 'Q') {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
  } else if (type === 'K') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(row+dr, col+dc);
  }
  return moves;
}

function isSquareAttacked(board, row, col, byColor, mission) {
  const size = MISSION_BOARD_SIZE;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const p = board[r][c];
      if (p && p[0] === byColor) {
        const moves = getMissionValidMoves(board, r, c, mission);
        if (moves.some(([mr, mc]) => mr === row && mc === col)) return true;
      }
    }
  }
  return false;
}

function renderMissionBoard() {
  const mission = MISSIONS[state.missionPiece][state.missionIdx];
  const board = state.missionBoard;
  const size = MISSION_BOARD_SIZE;
  const [pr, pc] = state.missionPlayerPos;

  const validMoves = state.missionSolved || state.missionFailed
    ? [] : getMissionValidMoves(board, pr, pc, mission);

  let cells = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isLight = (r + c) % 2 === 0;
      let cls = 'board-cell ' + (isLight ? 'light' : 'dark');
      let content = '';

      if (mission.blocks.some(([br, bc]) => br === r && bc === c)) {
        cls += ' block-cell';
        content = '<span class="block-mark">✕</span>';
      } else if (mission.goals && mission.goals.some(([gr, gc]) => gr === r && gc === c)) {
        cls += ' goal-cell';
        if (!board[r][c]) content = '<span class="goal-mark">●</span>';
      }

      const piece = board[r][c];
      if (piece) content = getPieceSVG(piece, 36);
      if (r === pr && c === pc) cls += ' selected';
      if (validMoves.some(([mr, mc]) => mr === r && mc === c)) cls += ' move-hint';

      cells += `<div class="${cls}" onclick="missionClick(${r},${c})">${content}</div>`;
    }
  }

  const desc = mission.desc[currentLang] || mission.desc['ko'];

  // 상단 정보: 말풍선 + 이동 카운터
  const infoBar = `
    <div class="mission-info">
      <div class="mission-speech">${desc}</div>
      <div class="move-counter">${t('missionMoves')}: ${state.missionMoveCount}</div>
    </div>
  `;

  // 하단 버튼: 힌트 + 리셋
  const actionBtns = (!state.missionSolved && !state.missionFailed) ? `
    <div class="mission-actions">
      <button class="icon-btn hint-btn" onclick="showMissionHint()">💡 ${t('hintBtn')}</button>
      <button class="icon-btn reset-btn" onclick="goMissionPlay('${state.missionPiece}', ${state.missionIdx})">🔄 ${t('resetBtn')}</button>
    </div>
  ` : '';

  document.getElementById('screen-learn').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="renderStageMap()">← ${t('btnBack')}</button>
        <h2>${t('missionTitle')} ${state.missionIdx + 1}</h2>
      </div>
      ${infoBar}
      <div class="chess-board mission-board">${cells}</div>
      ${actionBtns}
    </div>
  `;
}

function missionClick(r, c) {
  if (state.animating || state.missionSolved || state.missionFailed) return;
  const mission = MISSIONS[state.missionPiece][state.missionIdx];
  const board = state.missionBoard;
  const [pr, pc] = state.missionPlayerPos;
  const validMoves = getMissionValidMoves(board, pr, pc, mission);

  if (!validMoves.some(([mr, mc]) => mr === r && mc === c)) return;

  const piece = board[pr][pc];
  const boardEl = document.querySelector('#screen-learn .mission-board');

  board[r][c] = piece;
  board[pr][pc] = null;
  state.missionPlayerPos = [r, c];
  state.missionMoveCount++;

  animateMove(boardEl, pr, pc, r, c, piece, () => {
    if (mission.type === 'reach') {
      if (mission.goals.some(([gr, gc]) => gr === r && gc === c)) {
        missionClear();
      }
    } else if (mission.type === 'capture') {
      let remaining = 0;
      for (let rr = 0; rr < MISSION_BOARD_SIZE; rr++)
        for (let cc = 0; cc < MISSION_BOARD_SIZE; cc++)
          if (board[rr][cc] && board[rr][cc][0] === 'b') remaining++;
      if (mission.enemies) {
        remaining -= mission.enemies.filter(([er, ec, ep]) => board[er][ec] === ep).length;
      }
      if (remaining === 0) missionClear();
    } else if (mission.type === 'escape') {
      const safe = !isSquareAttacked(board, r, c, 'b', mission);
      if (safe && mission.goals.some(([gr, gc]) => gr === r && gc === c)) {
        missionClear();
      } else if (!safe) {
        state.missionFailed = true;
      }
    }
    renderMissionBoard();
  }, MISSION_BOARD_SIZE);
}

function missionClear() {
  state.missionSolved = true;
  const mission = MISSIONS[state.missionPiece][state.missionIdx];
  const stars = calculateStars(state.missionMoveCount, mission.minMoves);
  saveMissionProgress(state.missionPiece, state.missionIdx, stars);

  // 클리어 팝업을 약간 딜레이 후 표시
  setTimeout(() => showClearPopup(stars), 300);
}

function showClearPopup(stars) {
  spawnParticles();

  const starHtml = Array.from({length: 3}, (_, i) =>
    `<span class="${i < stars ? 'star-on' : 'star-off'}">★</span>`
  ).join('');

  let msg = '';
  if (stars === 3) msg = t('missionPerfect');
  else if (stars === 2) msg = t('missionGreat');
  else msg = t('missionGood');

  const hasNext = state.missionIdx < MISSIONS[state.missionPiece].length - 1;
  const nextBtn = hasNext
    ? `<button class="action-btn green" onclick="closeClearPopup(); goMissionPlay('${state.missionPiece}', ${state.missionIdx + 1})">${t('btnNext')}</button>`
    : '';

  const overlay = document.createElement('div');
  overlay.className = 'clear-overlay';
  overlay.id = 'clear-overlay';
  overlay.innerHTML = `
    <div class="clear-popup">
      <div class="clear-title">${t('missionClear')}</div>
      <div class="clear-stars">${starHtml}</div>
      <div class="clear-msg">${msg}</div>
      <div class="clear-btns">
        <button class="action-btn secondary" onclick="closeClearPopup(); renderStageMap()">${t('btnBack')}</button>
        <button class="action-btn" onclick="closeClearPopup(); goMissionPlay('${state.missionPiece}', ${state.missionIdx})">🔄</button>
        ${nextBtn}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function closeClearPopup() {
  const overlay = document.getElementById('clear-overlay');
  if (overlay) overlay.remove();
}

function showMissionHint() {
  if (state.missionHintShown) return;
  state.missionHintShown = true;
  const mission = MISSIONS[state.missionPiece][state.missionIdx];
  const hint = mission.hint;
  if (!hint) return;

  const [fromR, fromC, toR, toC] = hint;
  const boardEl = document.querySelector('#screen-learn .mission-board');
  if (!boardEl) return;

  const size = MISSION_BOARD_SIZE;
  const cellSize = boardEl.offsetWidth / size;

  // 출발칸 하이라이트
  const fromIdx = fromR * size + fromC;
  const fromCell = boardEl.children[fromIdx];
  if (fromCell) fromCell.classList.add('hint-highlight');

  // 도착칸 하이라이트
  const toIdx = toR * size + toC;
  const toCell = boardEl.children[toIdx];
  if (toCell) toCell.classList.add('hint-highlight');

  // 화살표 SVG 오버레이
  const arrow = document.createElement('div');
  arrow.className = 'hint-arrow';
  const fromX = (fromC + 0.5) * cellSize;
  const fromY = (fromR + 0.5) * cellSize;
  const toX = (toC + 0.5) * cellSize;
  const toY = (toR + 0.5) * cellSize;
  const svgW = boardEl.offsetWidth;
  const svgH = boardEl.offsetHeight;
  arrow.innerHTML = `
    <svg width="${svgW}" height="${svgH}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:15;">
      <defs>
        <marker id="hintHead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#FF6B6B"/>
        </marker>
      </defs>
      <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}"
        stroke="#FF6B6B" stroke-width="4" stroke-linecap="round"
        marker-end="url(#hintHead)" opacity="0.85"
        class="hint-arrow-line"/>
    </svg>
  `;
  boardEl.appendChild(arrow);

  // 힌트 텍스트 표시
  const desc = mission.desc[currentLang] || mission.desc['ko'];
  const speechEl = document.querySelector('.mission-speech');
  if (speechEl) {
    speechEl.innerHTML = `💡 ${desc}`;
    speechEl.classList.add('hint-active');
  }

  // 3초 후 제거
  setTimeout(() => {
    if (fromCell) fromCell.classList.remove('hint-highlight');
    if (toCell) toCell.classList.remove('hint-highlight');
    if (arrow.parentNode) arrow.remove();
    if (speechEl) speechEl.classList.remove('hint-active');
  }, 3000);
}
