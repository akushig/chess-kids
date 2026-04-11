// ===== 앱 상태 =====
const state = {
  screen: 'home', // home | learn | puzzle | play | reward
  stars: parseInt(localStorage.getItem('stars') || '0'),
  puzzleIndex: 0,
  puzzleSolved: false,
  game: null,
  learnIndex: 0,
};

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
    </div>
  `;
}

// ===== 배우기 화면 =====
function goLearn() {
  state.learnIndex = 0;
  showScreen('learn');
  renderLearn();
}

function renderLearn() {
  const piece = PIECE_LEARN[state.learnIndex];
  const desc = piece.desc[currentLang] || piece.desc['ko'];
  const boardSize = 8;
  const centerR = 4, centerC = 3;

  let cells = '';
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const isLight = (r + c) % 2 === 0;
      let content = '';
      let cls = 'learn-cell ' + (isLight ? 'light' : 'dark');

      if (r === centerR && c === centerC) {
        content = `<span class="piece-symbol">${piece.symbol}</span>`;
        cls += ' piece-cell';
      } else {
        // 이동 가능 표시
        let canMove = false;
        if (Array.isArray(piece.moves)) {
          canMove = piece.moves.some(([dr, dc]) => r === centerR + dr && c === centerC + dc);
        } else if (piece.moves === 'queen' || piece.moves === 'rook') {
          canMove = r === centerR || c === centerC;
        }
        if (piece.moves === 'queen' || piece.moves === 'bishop') {
          if (Math.abs(r - centerR) === Math.abs(c - centerC) && r !== centerR) canMove = true;
        }
        if (canMove) cls += ' move-hint';
      }
      cells += `<div class="${cls}">${content}</div>`;
    }
  }

  document.getElementById('screen-learn').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('learnTitle')}</h2>
      </div>
      <div class="piece-tabs">
        ${PIECE_LEARN.map((p, i) => `
          <button class="piece-tab ${i === state.learnIndex ? 'active' : ''}" onclick="state.learnIndex=${i}; renderLearn()">
            ${p.symbol}
          </button>
        `).join('')}
      </div>
      <div class="piece-name">${t(piece.nameKey)}</div>
      <div class="learn-board">${cells}</div>
      <div class="piece-desc">${desc}</div>
    </div>
  `;
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
  if (state.puzzleSolved) return;
  const game = state.puzzleGame;
  const puzzle = PUZZLES[state.puzzleIndex];

  if (state.puzzleSelected) {
    const [fr, fc] = state.puzzleSelected;
    if (state.puzzleValidMoves.some(([mr, mc]) => mr === r && mc === c)) {
      game.move(fr, fc, r, c);
      state.puzzleSelected = null;
      state.puzzleValidMoves = [];
      if (game.status === 'checkmate') {
        state.puzzleSolved = true;
        state.stars++;
        localStorage.setItem('stars', state.stars);
      }
      renderPuzzleBoard();
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
      <div class="chess-board">${cells}</div>
      <button class="action-btn" onclick="goPlay()">${t('playRestart')}</button>
    </div>
  `;
}

function playClick(r, c) {
  const game = state.game;
  if (game.turn !== 'w' || game.status === 'checkmate' || game.status === 'draw') return;

  const result = game.select(r, c);
  renderPlay();

  if (result === 'moved' && game.turn === 'b' && (game.status === 'playing' || game.status === 'check')) {
    setTimeout(() => {
      game.aiMove();
      renderPlay();
    }, 400);
  }
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
