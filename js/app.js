// ===== 앱 상태 =====
const APP_VERSION = '1.1.0';
const state = {
  screen: 'home', // home | learn | puzzle | play | reward
  stars: parseInt(localStorage.getItem('stars') || '0'),
  puzzleIndex: 0,
  puzzleSolved: false,
  game: null,
  learnIndex: 0,
  animating: false,
};

// ===== 이동 애니메이션 =====
function animateMove(boardEl, fromR, fromC, toR, toC, symbol, pieceColorClass, callback, gridSize) {
  state.animating = true;
  const cols = gridSize || 8;
  const cellSize = boardEl.offsetWidth / cols;

  // 같은 칸이면 애니메이션 스킵
  if (fromR === toR && fromC === toC) {
    state.animating = false;
    callback();
    return;
  }

  const ghost = document.createElement('div');
  ghost.className = 'move-anim';
  ghost.innerHTML = `<span class="${pieceColorClass}">${symbol}</span>`;
  ghost.style.width = cellSize + 'px';
  ghost.style.height = cellSize + 'px';
  ghost.style.top = (fromR * cellSize) + 'px';
  ghost.style.left = (fromC * cellSize) + 'px';
  boardEl.appendChild(ghost);

  // 출발 칸의 기물 숨기기
  const fromIdx = fromR * cols + fromC;
  const fromCell = boardEl.children[fromIdx];
  if (fromCell && fromCell.querySelector('span')) {
    fromCell.querySelector('span').style.visibility = 'hidden';
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
  // fallback: transitionend가 안 불리는 디바이스 대비
  setTimeout(finish, 400);

  requestAnimationFrame(() => {
    ghost.style.top = (toR * cellSize) + 'px';
    ghost.style.left = (toC * cellSize) + 'px';
  });
}

// ===== 화면 전환 =====
function showScreen(name) {
  state.screen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
}

// ===== 홈 화면 =====
function renderHome() {
  document.getElementById('screen-home').innerHTML = `
    <div class="home-wrap">
      <div class="app-title">${t('appName')}</div>
      <div class="chess-icon">♟</div>
      <div class="menu-grid">
        <button class="menu-btn" onclick="goLearn()">
          <span class="menu-icon">📖</span>
          <span>${t('menuLearn')}</span>
        </button>
        <button class="menu-btn" onclick="goPuzzle()">
          <span class="menu-icon">🧩</span>
          <span>${t('menuPuzzle')}</span>
        </button>
        <button class="menu-btn" onclick="goPlay()">
          <span class="menu-icon">⚔️</span>
          <span>${t('menuPlay')}</span>
        </button>
        <button class="menu-btn reward-btn" onclick="goReward()">
          <span class="menu-icon">⭐</span>
          <span>${t('menuReward')} ${state.stars}</span>
        </button>
      </div>
      <div class="app-version">v${APP_VERSION}</div>
    </div>
  `;
}

// ===== 배우기 화면 (기물별 미션 학습) =====
const PIECE_ORDER = ['P', 'N', 'B', 'R', 'Q', 'K'];
const PIECE_ICONS = { P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' };
const PIECE_NAMES = { P: 'piecePawn', N: 'pieceKnight', B: 'pieceBishop', R: 'pieceRook', Q: 'pieceQueen', K: 'pieceKing' };
const MISSION_BOARD_SIZE = 6;

function goLearn() {
  showScreen('learn');
  renderPieceSelect();
}

function renderPieceSelect() {
  let cards = PIECE_ORDER.map(key => {
    const missions = MISSIONS[key];
    const cleared = getPieceClearCount(key);
    const total = missions.length;
    const pct = Math.round((cleared / total) * 100);
    return `
      <button class="piece-card" onclick="goMissionList('${key}')">
        <span class="piece-card-icon">${PIECE_ICONS[key]}</span>
        <span class="piece-card-name">${t(PIECE_NAMES[key])}</span>
        <div class="piece-card-bar"><div class="piece-card-fill" style="width:${pct}%"></div></div>
        <span class="piece-card-progress">${cleared}/${total}</span>
      </button>
    `;
  }).join('');

  document.getElementById('screen-learn').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('learnTitle')}</h2>
      </div>
      <div class="piece-card-grid">${cards}</div>
    </div>
  `;
}

function goMissionList(pieceKey) {
  state.missionPiece = pieceKey;
  renderMissionList();
}

function renderMissionList() {
  const key = state.missionPiece;
  const missions = MISSIONS[key];
  let items = missions.map((m, i) => {
    const cleared = isMissionCleared(key, i);
    const locked = i > 0 && !isMissionCleared(key, i - 1);
    const desc = m.desc[currentLang] || m.desc['ko'];
    const typeIcon = m.type === 'reach' ? '🎯' : m.type === 'capture' ? '⚔️' : '🛡️';
    return `
      <button class="mission-item ${cleared ? 'cleared' : ''} ${locked ? 'locked' : ''}"
        ${locked ? 'disabled' : `onclick="goMissionPlay('${key}', ${i})"`}>
        <span class="mission-num">${typeIcon} ${i + 1}</span>
        <span class="mission-desc">${desc}</span>
        <span class="mission-star">${cleared ? '⭐' : '☆'}</span>
      </button>
    `;
  }).join('');

  document.getElementById('screen-learn').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="renderPieceSelect()">← ${t('btnBack')}</button>
        <h2>${PIECE_ICONS[key]} ${t(PIECE_NAMES[key])}</h2>
      </div>
      <div class="mission-list">${items}</div>
    </div>
  `;
}

// ===== 미션 플레이 =====
function goMissionPlay(pieceKey, missionIdx) {
  const mission = MISSIONS[pieceKey][missionIdx];
  state.missionPiece = pieceKey;
  state.missionIdx = missionIdx;
  state.missionBoard = buildMissionBoard(mission);
  state.missionPlayerPos = [...mission.start];
  state.missionSolved = false;
  state.missionFailed = false;
  state.missionTargetsLeft = mission.targets ? mission.targets.length : 0;
  showScreen('learn');
  renderMissionBoard();
}

function buildMissionBoard(mission) {
  const size = MISSION_BOARD_SIZE;
  const board = Array.from({ length: size }, () => Array(size).fill(null));
  // 플레이어 기물
  board[mission.start[0]][mission.start[1]] = mission.piece;
  // 상대 기물 (capture 미션)
  if (mission.targets) {
    mission.targets.forEach(([r, c, p]) => { board[r][c] = p; });
  }
  // 위협 기물 (escape 미션)
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

      // 장애물
      if (mission.blocks.some(([br, bc]) => br === r && bc === c)) {
        cls += ' block-cell';
        content = '<span class="block-mark">✕</span>';
      }
      // 목표 칸
      else if (mission.goals && mission.goals.some(([gr, gc]) => gr === r && gc === c)) {
        cls += ' goal-cell';
        if (!board[r][c]) content = '<span class="goal-mark">●</span>';
      }

      // 기물
      const piece = board[r][c];
      if (piece) {
        const sym = PIECES[piece];
        const pColor = piece[0] === 'w' ? 'white-piece' : 'black-piece';
        content = `<span class="${pColor}">${sym}</span>`;
      }

      // 선택된 기물
      if (r === pr && c === pc) cls += ' selected';
      // 이동 가능 힌트
      if (validMoves.some(([mr, mc]) => mr === r && mc === c)) cls += ' move-hint';

      cells += `<div class="${cls}" onclick="missionClick(${r},${c})">${content}</div>`;
    }
  }

  let msg = '';
  if (state.missionSolved) {
    msg = `<div class="status-msg success">${t('missionClear')}</div>`;
  } else if (state.missionFailed) {
    msg = `<div class="status-msg fail">${t('missionRetry')}</div>`;
  } else {
    const desc = mission.desc[currentLang] || mission.desc['ko'];
    msg = `<div class="status-msg">${desc}</div>`;
  }

  const nextBtn = state.missionSolved && state.missionIdx < MISSIONS[state.missionPiece].length - 1
    ? `<button class="action-btn" onclick="goMissionPlay('${state.missionPiece}', ${state.missionIdx + 1})">${t('btnNext')}</button>`
    : '';
  const retryBtn = state.missionFailed
    ? `<button class="action-btn" onclick="goMissionPlay('${state.missionPiece}', ${state.missionIdx})">${t('missionRetryBtn')}</button>`
    : '';

  document.getElementById('screen-learn').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="renderMissionList()">← ${t('btnBack')}</button>
        <h2>${PIECE_ICONS[state.missionPiece]} ${t('missionTitle')} ${state.missionIdx + 1}</h2>
      </div>
      ${msg}
      <div class="chess-board mission-board">${cells}</div>
      ${nextBtn}${retryBtn}
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
  const symbol = PIECES[piece];
  const boardEl = document.querySelector('#screen-learn .mission-board');

  // 이동 실행
  board[r][c] = piece;
  board[pr][pc] = null;
  state.missionPlayerPos = [r, c];

  animateMove(boardEl, pr, pc, r, c, symbol, 'white-piece', () => {
    // 클리어 판정
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
  if (!isMissionCleared(state.missionPiece, state.missionIdx)) {
    saveMissionProgress(state.missionPiece, state.missionIdx);
    state.stars++;
    localStorage.setItem('stars', state.stars);
  }
}

// ===== 퍼즐 화면 =====
function goPuzzle() {
  state.puzzleIndex = 0;
  state.puzzleSolved = false;
  showScreen('puzzle');
  renderPuzzle();
}

function renderPuzzle() {
  const puzzle = PUZZLES[state.puzzleIndex];
  const game = new ChessGame();
  game.board = puzzle.board.map(r => [...r]);
  game.turn = puzzle.turn;
  state.puzzleGame = game;
  state.puzzleSelected = null;
  state.puzzleValidMoves = [];

  renderPuzzleBoard();
}

function renderPuzzleBoard() {
  const puzzle = PUZZLES[state.puzzleIndex];
  const game = state.puzzleGame;
  let cells = '';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      const piece = game.board[r][c];
      let cls = 'board-cell ' + (isLight ? 'light' : 'dark');
      if (state.puzzleSelected && state.puzzleSelected[0] === r && state.puzzleSelected[1] === c) cls += ' selected';
      if (state.puzzleValidMoves && state.puzzleValidMoves.some(([mr, mc]) => mr === r && mc === c)) cls += ' move-hint';
      const symbol = piece ? PIECES[piece] : '';
      const pieceColor = piece ? (piece[0] === 'w' ? 'white-piece' : 'black-piece') : '';
      cells += `<div class="${cls}" onclick="puzzleClick(${r},${c})"><span class="${pieceColor}">${symbol}</span></div>`;
    }
  }

  const msg = state.puzzleSolved
    ? `<div class="status-msg success">${t('puzzleSuccess')}</div>`
    : `<div class="status-msg">${t('puzzleInstruction')}</div>`;

  document.getElementById('screen-puzzle').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('puzzleTitle')} ${state.puzzleIndex + 1}/${PUZZLES.length}</h2>
      </div>
      ${msg}
      <div class="chess-board">${cells}</div>
      ${state.puzzleSolved && state.puzzleIndex < PUZZLES.length - 1
        ? `<button class="action-btn" onclick="state.puzzleIndex++; state.puzzleSolved=false; renderPuzzle()">${t('btnNext')}</button>`
        : ''}
    </div>
  `;
}

function puzzleClick(r, c) {
  if (state.puzzleSolved || state.animating) return;
  const game = state.puzzleGame;
  const puzzle = PUZZLES[state.puzzleIndex];

  if (state.puzzleSelected) {
    const [fr, fc] = state.puzzleSelected;
    if (state.puzzleValidMoves.some(([mr, mc]) => mr === r && mc === c)) {
      const piece = game.board[fr][fc];
      const symbol = PIECES[piece];
      const pieceColor = piece[0] === 'w' ? 'white-piece' : 'black-piece';
      const boardEl = document.querySelector('#screen-puzzle .chess-board');

      game.move(fr, fc, r, c);
      state.puzzleSelected = null;
      state.puzzleValidMoves = [];

      animateMove(boardEl, fr, fc, r, c, symbol, pieceColor, () => {
        if (game.status === 'checkmate') {
          state.puzzleSolved = true;
          state.stars++;
          localStorage.setItem('stars', state.stars);
        }
        renderPuzzleBoard();
      });
      return;
    }
  }

  const piece = game.board[r][c];
  if (piece && game.color(piece) === game.turn) {
    state.puzzleSelected = [r, c];
    state.puzzleValidMoves = game.legalMoves(r, c);
  } else {
    state.puzzleSelected = null;
    state.puzzleValidMoves = [];
  }
  renderPuzzleBoard();
}

// ===== 대전 화면 =====
function goPlay() {
  state.game = new ChessGame();
  showScreen('play');
  renderPlay();
}

function renderPlay() {
  const game = state.game;
  let cells = '';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      const piece = game.board[r][c];
      let cls = 'board-cell ' + (isLight ? 'light' : 'dark');
      if (game.selected && game.selected[0] === r && game.selected[1] === c) cls += ' selected';
      if (game.validMoves && game.validMoves.some(([mr, mc]) => mr === r && mc === c)) cls += ' move-hint';
      const symbol = piece ? PIECES[piece] : '';
      const pieceColor = piece ? (piece[0] === 'w' ? 'white-piece' : 'black-piece') : '';
      cells += `<div class="${cls}" onclick="playClick(${r},${c})"><span class="${pieceColor}">${symbol}</span></div>`;
    }
  }

  let statusMsg = '';
  if (game.status === 'checkmate') {
    statusMsg = game.turn === 'b'
      ? `<div class="status-msg success">${t('playCheckmate')}</div>`
      : `<div class="status-msg fail">${t('playLose')}</div>`;
  } else if (game.status === 'draw') {
    statusMsg = `<div class="status-msg">${t('playDraw')}</div>`;
  } else if (game.status === 'check') {
    statusMsg = `<div class="status-msg warn">${t('playCheck')}</div>`;
  } else {
    statusMsg = game.turn === 'w'
      ? `<div class="status-msg">${t('playYourTurn')}</div>`
      : `<div class="status-msg dim">${t('playAiTurn')}</div>`;
  }

  document.getElementById('screen-play').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('playTitle')}</h2>
      </div>
      ${statusMsg}
      <div class="captured-pieces">${game.captured.b.map(p => `<span class="white-piece">${PIECES[p]}</span>`).join('')}</div>
      <div class="chess-board">${cells}</div>
      <div class="captured-pieces">${game.captured.w.map(p => `<span class="black-piece">${PIECES[p]}</span>`).join('')}</div>
      <button class="action-btn" onclick="goPlay()">${t('playRestart')}</button>
    </div>
  `;
}

function playClick(r, c) {
  const game = state.game;
  if (state.animating) return;
  if (game.turn !== 'w' || game.status === 'checkmate' || game.status === 'draw') return;

  if (game.selected) {
    const [fr, fc] = game.selected;
    if (game.validMoves.some(([mr, mc]) => mr === r && mc === c)) {
      const piece = game.board[fr][fc];
      const symbol = PIECES[piece];
      const pieceColor = piece[0] === 'w' ? 'white-piece' : 'black-piece';
      const boardEl = document.querySelector('#screen-play .chess-board');

      game.move(fr, fc, r, c);
      animateMove(boardEl, fr, fc, r, c, symbol, pieceColor, () => {
        renderPlay();
        if (game.turn === 'b' && (game.status === 'playing' || game.status === 'check')) {
          setTimeout(() => doAiMove(), 300);
        }
      });
      return;
    }
  }

  game.select(r, c);
  renderPlay();
}

function doAiMove() {
  const game = state.game;
  // AI 이동 전 좌표 기록
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (game.color(game.board[r][c]) === game.turn) {
        const legal = game.legalMoves(r, c);
        legal.forEach(([tr, tc]) => moves.push([r, c, tr, tc]));
      }
    }
  }
  if (moves.length === 0) return;
  const captures = moves.filter(([,, tr, tc]) => game.board[tr][tc]);
  const pick = captures.length > 0
    ? captures[Math.floor(Math.random() * captures.length)]
    : moves[Math.floor(Math.random() * moves.length)];

  const [fr, fc, tr, tc] = pick;
  const piece = game.board[fr][fc];
  const symbol = PIECES[piece];
  const pieceColor = 'black-piece';
  const boardEl = document.querySelector('#screen-play .chess-board');

  game.move(fr, fc, tr, tc);
  animateMove(boardEl, fr, fc, tr, tc, symbol, pieceColor, () => {
    renderPlay();
  });
}

// ===== 리워드 화면 =====
function goReward() {
  showScreen('reward');
  const stars = state.stars;
  const display = Array.from({length: Math.min(stars, 30)}, () => '⭐').join(' ');
  document.getElementById('screen-reward').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('rewardTitle')}</h2>
      </div>
      <div class="reward-count">${stars} ${t('rewardStars')}</div>
      <div class="stars-display">${display || t('rewardEmpty')}</div>
    </div>
  `;
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  renderHome();
  showScreen('home');
});
