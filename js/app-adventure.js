function missionSize(mission=MISSIONS[state.missionPiece]?.[state.missionIdx]) { return mission?.size || 6; }
// ===== 모험 화면: 월드 선택 → 스테이지 맵 → 미션 플레이 =====

// --- 월드 선택 ---
function goAdventure() {
  leaveActivity();
  showScreen('learn');
  renderWorldSelect();
}

function renderWorldSelect() {
  leaveActivity();
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
      <p class="section-note">룩부터 한 걸음씩. 좋아하는 말은 바로 골라도 좋아요.</p><div class="world-grid">${cards}</div><button class="action-btn secondary" onclick="goPuzzleLevel(5);showScreen('puzzle')">🛟 왕 구하기 상황 연습</button>
    </div>
  `;
}

// --- 스테이지 맵 ---
function goStageMap(pieceKey) {
  state.missionPiece = pieceKey;
  renderStageMap();
  document.querySelector('.stage-node.current')?.scrollIntoView?.({block:'center'});
}

function renderStageMap() {
  leaveActivity();
  const key = state.missionPiece;
  const missions = MISSIONS[key];
  let nodes = '';

  for (let i = 0; i < missions.length; i++) {
    const stars = getMissionStars(key, i);
    const cleared = stars > 0;
    const locked = false;
    const isCurrent = !cleared && (i===0 || getMissionStars(key,i-1)>0);

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
        </button><span class="stage-label">${missions[i].optional?'<small>선택 도전</small>':''}${missions[i].desc.ko}</span>
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
  beginActivity('mission',{pieceKey,missionIdx,id:MISSIONS[pieceKey][missionIdx].id});
  cancelActivityCallbacks();
  const mission = MISSIONS[pieceKey][missionIdx];
  state.missionPiece = pieceKey;
  state.missionIdx = missionIdx;
  state.missionBoard = buildMissionBoard(mission);
  state.missionPlayerPos = [...mission.start];
  state.missionSolved = false;
  state.missionFailed = false;
  state.missionMoveCount = 0;

  state.missionNotice = '';
  showScreen('learn');
  renderMissionBoard();
}

function buildMissionBoard(mission) {
  const size = missionSize(mission);
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
  const size = missionSize(mission);
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
      if (inB(row + dir, col + dc) && !isBlock(row + dir,col + dc) && isEnemy(row + dir, col + dc)) {
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
  for(let r=0;r<board.length;r++) for(let c=0;c<board.length;c++)
    if(board[r][c]?.[0]===byColor && pieceAttacks(board,r,c,row,col,mission.blocks)) return true;
  return false;
}

function missionNeedsSafety(mission) { return mission.type === 'escape' || mission.piece === 'wK'; }
function missionUndo() { undoActivity(); }

function renderMissionBoard() {
  saveActiveSession();
  const mission = MISSIONS[state.missionPiece][state.missionIdx];
  const board = state.missionBoard;
  const size = missionSize(mission);
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
      if (missionNeedsSafety(mission) && isSquareAttacked(board,r,c,'b',mission)) cls += ' danger-cell';

      cells += `<div class="${cls}" onclick="missionClick(${r},${c})">${content}</div>`;
    }
  }

  const desc = (state.missionFailed && state.missionNotice) || mission.desc[currentLang] || mission.desc['ko'];

  // 상단 정보: 말풍선 + 이동 카운터
  const infoBar = `
    <div class="mission-info">
      <div class="mission-speech">${desc}</div>
      <div class="move-counter">${t('missionMoves')}: ${state.missionMoveCount}</div>
    </div>
  `;

  // 하단 버튼: 힌트 + 리셋
  const actionBtns = (!state.missionSolved) ? `
    <div class="mission-actions">
      <button class="icon-btn" onclick="missionUndo()" ${state.actionHistory?.length ? '' : 'disabled'}>↶ 되돌리기</button>
      <button class="icon-btn hint-btn" onclick="showMissionHint()">💡 ${t('hintBtn')}</button>
      <button class="icon-btn reset-btn" onclick="goMissionPlay('${state.missionPiece}', ${state.missionIdx})">🔄 ${t('resetBtn')}</button>
    </div>
  ` : '';

  renderGameScreen('screen-learn', `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="renderStageMap()">← ${t('btnBack')}</button>
        <h2>${t('missionTitle')} ${state.missionIdx + 1}</h2>
      </div>
      ${infoBar}
      <div class="chess-board mission-board" style="grid-template-columns:repeat(${size},1fr) !important">${cells}</div>
      ${actionBtns}
    </div>
  `);
}

function missionClick(r, c) {
  if (state.animating || state.missionSolved || state.missionFailed) return;
  const mission = MISSIONS[state.missionPiece][state.missionIdx];
  const board = state.missionBoard;
  const [pr, pc] = state.missionPlayerPos;
  const validMoves = getMissionValidMoves(board, pr, pc, mission);

  if (!validMoves.some(([mr, mc]) => mr === r && mc === c)) {
    state.missionNotice='점이 있는 칸으로 움직여요. 막힌 길은 돌아가요.'; renderMissionBoard(); return;
  }
  rememberAction();

  state.missionNotice='';

  const piece = board[pr][pc];
  const boardEl = document.querySelector('#screen-learn .mission-board');

  board[r][c] = piece;
  board[pr][pc] = null;
  state.missionPlayerPos = [r, c];
  state.missionMoveCount++;


    if (missionNeedsSafety(mission) && isSquareAttacked(board,r,c,'b',mission)) {
      state.missionFailed=true; state.missionNotice='이 칸은 상대 말이 공격하고 있어요. ↶ 되돌려서 다른 길로 가요.';
    } else if (mission.type === 'reach') {
      if (mission.goals.some(([gr, gc]) => gr === r && gc === c)) {
        missionClear();
      }
    } else if (mission.type === 'capture') {
      let remaining = 0;
      for (let rr = 0; rr < missionSize(mission); rr++)
        for (let cc = 0; cc < missionSize(mission); cc++)
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
    if(piece==='wP' && r===0 && state.missionSolved)state.missionBoard[r][c]='wQ';
    if(!state.missionSolved&&!state.missionFailed&&!findMissionSolvePath())state.missionNotice='여기서는 목표로 갈 수 없어요. ↶ 되돌려 다른 길로 가요.';

  saveActiveSession();
  animateMove(boardEl, pr, pc, r, c, piece, () => renderMissionBoard(), missionSize(mission));
}

function missionClear() {
  state.missionSolved = true;
  const mission = MISSIONS[state.missionPiece][state.missionIdx];
  const stars = calculateStars(state.missionMoveCount, mission.minMoves);
  saveMissionProgress(state.missionPiece, state.missionIdx, stars);

  // 클리어 팝업을 약간 딜레이 후 표시
  laterInScreen(() => showClearPopup(stars), 300);
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
    : `<button class="action-btn green" onclick="closeClearPopup();${state.missionPiece==='N'?'goKnightSetup()':state.missionPiece==='R'?'goDefense(0)':'goPlay()'}">${state.missionPiece==='N'?'나이트와 탐험하기':state.missionPiece==='R'?'룩으로 성 지키기':'배운 말로 대전하기'}</button>`;

  const overlay = document.createElement('div');
  overlay.className = 'clear-overlay';
  overlay.id = 'clear-overlay';
  overlay.innerHTML = `
    <div class="clear-popup">
      <div class="clear-title">✓ 완료 도장!</div>
      <div class="clear-stars">${starHtml}</div>
      <div class="clear-msg">${msg}</div>
      <div class="clear-btns">
        <button class="action-btn secondary" onclick="closeClearPopup(); renderStageMap()">${t('btnBack')}</button>
        <button class="action-btn" onclick="closeClearPopup(); goMissionPlay('${state.missionPiece}', ${state.missionIdx})">🔄</button>
        ${nextBtn}
        <button class="action-btn secondary" onclick="closeClearPopup();showScreen('home');renderHome()">여기까지</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function closeClearPopup() {
  const overlay = document.getElementById('clear-overlay');
  if (overlay) overlay.remove();
}

// BFS로 현재 상태에서 클리어까지의 최단 경로 탐색
function findMissionSolvePath() {
  const mission = MISSIONS[state.missionPiece][state.missionIdx];
  const origBoard = state.missionBoard;
  const [pr, pc] = state.missionPlayerPos;
  const size = missionSize(mission);

  function cloneBoard(b) { return b.map(row => [...row]); }
  function boardKey(b, r, c) {
    let k = r + ',' + c;
    for (let i = 0; i < size; i++)
      for (let j = 0; j < size; j++)
        if (b[i][j]) k += ',' + i + j + b[i][j];
    return k;
  }

  function isGoal(b, r, c) {
    if (mission.type === 'reach') {
      return mission.goals.some(([gr, gc]) => gr === r && gc === c);
    } else if (mission.type === 'capture') {
      // targets에서 온 적만 세기
      let remaining = 0;
      for (let i = 0; i < size; i++)
        for (let j = 0; j < size; j++)
          if (b[i][j] && b[i][j][0] === 'b') remaining++;
      if (mission.enemies) {
        remaining -= mission.enemies.filter(([er, ec, ep]) => b[er][ec] === ep).length;
      }
      return remaining === 0;
    } else if (mission.type === 'escape') {
      return mission.goals.some(([gr, gc]) => gr === r && gc === c) &&
             !isSquareAttacked(b, r, c, 'b', mission);
    }
    return false;
  }

  const startBoard = cloneBoard(origBoard);
  const queue = [[startBoard, pr, pc, [[pr, pc]]]];
  const visited = new Set();
  visited.add(boardKey(startBoard, pr, pc));

  while (queue.length > 0) {
    const [b, row, col, path] = queue.shift();
    if (path.length > 20) continue;
    const moves = getMissionValidMoves(b, row, col, mission);

    for (const [r, c] of moves) {
      // escape 타입: 공격받는 칸 제외
      const nb = cloneBoard(b);
      nb[r][c] = nb[row][col];
      nb[row][col] = null;
      if (missionNeedsSafety(mission) && isSquareAttacked(nb, r, c, 'b', mission)) continue;

      const key = boardKey(nb, r, c);
      if (visited.has(key)) continue;
      visited.add(key);

      const newPath = [...path, [r, c]];
      if (isGoal(nb, r, c)) return newPath;
      queue.push([nb, r, c, newPath]);
    }
  }
  return null;
}

function showMissionHint() {
  const mission=MISSIONS[state.missionPiece][state.missionIdx];
  const boardEl = document.querySelector('#screen-learn .mission-board');
  if (!boardEl) return;

  const path = findMissionSolvePath();
  if (!path) {
    showHintUnsolvable();
    return;
  }
  showHintArrow(boardEl,...path[0],...path[1],missionSize(mission),'이 한 걸음부터 해볼까요?');
}
