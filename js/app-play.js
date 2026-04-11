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
  const adventureStars = getTotalStars();
  const puzzleStars = getTotalPuzzleStars();
  const miniStars = getTotalMiniGameStars();
  const allStars = getAllStars();

  // 별 출처별 카드
  const sourceCards = `
    <div class="reward-sources">
      <div class="reward-source"><span class="reward-source-icon">🗺️</span><span>${t('rewardAdventure')}</span><span class="reward-source-val">⭐ ${adventureStars}</span></div>
      <div class="reward-source"><span class="reward-source-icon">🧩</span><span>${t('rewardPuzzle')}</span><span class="reward-source-val">⭐ ${puzzleStars}</span></div>
      <div class="reward-source"><span class="reward-source-icon">🎮</span><span>${t('rewardMiniGame')}</span><span class="reward-source-val">⭐ ${miniStars}</span></div>
    </div>
  `;

  // 스킨 보상 로드맵
  const sortedSkins = Object.entries(SKIN_UNLOCK).sort((a,b) => a[1] - b[1]);
  const roadmap = sortedSkins.map(([name, req]) => {
    const unlocked = allStars >= req;
    const isActive = currentSkin === name;
    const meta = SKIN_META[name];
    const pct = req === 0 ? 100 : Math.min(100, Math.round(allStars / req * 100));
    const preview = ['wK','bK'].map(p => getPieceSVGForSkin(name, p, 24)).join('');

    return `
      <div class="roadmap-item ${unlocked ? 'unlocked' : 'locked'} ${isActive ? 'active' : ''}">
        <div class="roadmap-star-req">${req === 0 ? '🎁' : '⭐ ' + req}</div>
        <div class="roadmap-connector"><div class="roadmap-line"></div><div class="roadmap-dot ${unlocked ? 'dot-unlocked' : ''}"></div></div>
        <div class="roadmap-card ${unlocked ? '' : 'roadmap-card-locked'}">
          <div class="roadmap-preview ${unlocked ? '' : 'skin-blur'}">${preview}</div>
          <div class="roadmap-info">
            <div class="roadmap-name">${t(meta.nameKey)}</div>
            ${unlocked
              ? `<div class="roadmap-status unlocked">${isActive ? t('skinCurrent') : t('rewardUnlocked')}</div>`
              : `<div class="roadmap-progress-bar"><div class="roadmap-progress-fill" style="width:${pct}%"></div></div>
                 <div class="roadmap-status locked">⭐ ${allStars}/${req}</div>`
            }
          </div>
        </div>
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
        <div class="reward-big">⭐ ${allStars}</div>
        <div class="reward-label">${t('rewardTotal')}</div>
        ${sourceCards}
        <div class="roadmap-title">${t('rewardRoadmap')}</div>
        <div class="roadmap-list">${roadmap}</div>
      </div>
    </div>
  `;
}
