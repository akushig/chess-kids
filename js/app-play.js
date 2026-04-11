// ===== 대전 화면 + 리워드 화면 =====

// --- 대전 ---
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
      const pieceContent = piece ? getPieceSVG(piece) : '';
      cells += `<div class="${cls}" onclick="playClick(${r},${c})">${pieceContent}</div>`;
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
      <div class="captured-pieces" id="captured-top">${game.captured.b.map(p => getPieceSVG(p, 24)).join('')}</div>
      <div class="chess-board">${cells}</div>
      <div class="captured-pieces" id="captured-bottom">${game.captured.w.map(p => getPieceSVG(p, 24)).join('')}</div>
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
      const captured = game.board[r][c];
      const boardEl = document.querySelector('#screen-play .chess-board');

      game.move(fr, fc, r, c);
      animateMove(boardEl, fr, fc, r, c, piece, () => {
        if (captured) {
          animateCapture(boardEl, r, c, captured, 'captured-bottom');
        }
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
  const captured = game.board[tr][tc];
  const boardEl = document.querySelector('#screen-play .chess-board');

  game.move(fr, fc, tr, tc);
  animateMove(boardEl, fr, fc, tr, tc, piece, () => {
    if (captured) {
      animateCapture(boardEl, tr, tc, captured, 'captured-top');
    }
    renderPlay();
  });
}

// --- 리워드 ---
function goReward() {
  showScreen('reward');
  const totalStars = getTotalStars();

  let pieceCards = PIECE_ORDER.map(key => {
    const stars = getPieceTotalStars(key);
    const maxStars = MISSIONS[key].length * 3;
    return `
      <div class="reward-piece">
        ${getPieceSVG(PIECE_ICONS[key], 36)}
        <span class="reward-piece-name">${t(PIECE_NAMES[key])}</span>
        <span class="reward-piece-stars">⭐ ${stars}/${maxStars}</span>
      </div>
    `;
  }).join('');

  document.getElementById('screen-reward').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('rewardTitle')}</h2>
      </div>
      <div class="reward-wrap">
        <div class="reward-big">⭐ ${totalStars}</div>
        <div class="reward-label">${t('rewardTotal')}</div>
        <div class="reward-grid">${pieceCards}</div>
      </div>
    </div>
  `;
}
