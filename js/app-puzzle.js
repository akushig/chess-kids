// ===== 퍼즐 화면: 레벨 선택 → 퍼즐 플레이 =====

const PUZZLE_LEVELS = [
  { level: 1, name: { ko: '1수 체크메이트', en: 'Mate in 1' } },
  { level: 2, name: { ko: '기물 잡기', en: 'Capture' } },
  { level: 3, name: { ko: '동시 공격', en: 'Fork' } },
  { level: 4, name: { ko: '2수 체크메이트', en: 'Mate in 2' } },
];

function goPuzzleLevelSelect() {
  showScreen('puzzle');
  renderPuzzleLevelSelect();
}

function renderPuzzleLevelSelect() {
  const cards = PUZZLE_LEVELS.map(lv => {
    const puzzles = PUZZLES.filter(p => p.level === lv.level);
    const name = lv.name[currentLang] || lv.name['ko'];
    return `
      <button class="puzzle-level-card" onclick="goPuzzleLevel(${lv.level})">
        <span class="level-num">${t('puzzleLevel')} ${lv.level}</span>
        <span class="level-name">${name}</span>
        <span class="level-progress">${puzzles.length} ${t('puzzleTitle')}</span>
      </button>
    `;
  }).join('');

  document.getElementById('screen-puzzle').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('puzzleTitle')}</h2>
      </div>
      <div class="puzzle-level-grid">${cards}</div>
    </div>
  `;
}

function goPuzzleLevel(level) {
  state.puzzleLevel = level;
  const puzzles = PUZZLES.filter(p => p.level === level);
  if (puzzles.length === 0) return;
  state.puzzleIndex = PUZZLES.indexOf(puzzles[0]);
  state.puzzleSolved = false;
  state.puzzleMoveCount = 0;
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
  state.puzzleSolved = false;
  state.puzzleFailed = false;
  state.puzzleMoveCount = 0;
  state.puzzleSolutionStep = 0;
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
      const pieceContent = piece ? getPieceSVG(piece) : '';
      cells += `<div class="${cls}" onclick="puzzleClick(${r},${c})">${pieceContent}</div>`;
    }
  }

  const desc = puzzle.desc[currentLang] || puzzle.desc['ko'];
  let msg;
  if (state.puzzleSolved) {
    msg = `<div class="status-msg success">${t('puzzleSuccess')}</div>`;
  } else if (state.puzzleFailed) {
    msg = `<div class="status-msg fail">${t('puzzleFail')}</div>`;
  } else {
    msg = `<div class="status-msg">${desc}</div>`;
  }

  // 같은 레벨의 퍼즐 목록에서 현재 위치
  const levelPuzzles = PUZZLES.filter(p => p.level === puzzle.level);
  const posInLevel = levelPuzzles.indexOf(puzzle) + 1;

  const nextInLevel = levelPuzzles[posInLevel];
  const nextBtn = state.puzzleSolved && nextInLevel
    ? `<button class="action-btn green" onclick="state.puzzleIndex = ${PUZZLES.indexOf(nextInLevel)}; renderPuzzle()">${t('btnNext')}</button>`
    : '';
  const retryBtn = state.puzzleFailed
    ? `<button class="action-btn" onclick="renderPuzzle()">🔄 ${t('missionRetryBtn')}</button>`
    : '';

  document.getElementById('screen-puzzle').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="renderPuzzleLevelSelect()">← ${t('btnBack')}</button>
        <h2>${t('puzzleLevel')} ${puzzle.level} - ${posInLevel}/${levelPuzzles.length}</h2>
      </div>
      ${msg}
      <div class="chess-board">${cells}</div>
      <div class="mission-speech"></div>
      <div class="mission-actions">
        ${state.puzzleSolved || state.puzzleFailed ? '' : `<button class="icon-btn hint-btn" onclick="puzzleHint()">💡 ${t('hintBtn')}</button><button class="icon-btn reset-btn" onclick="renderPuzzle()">🔄 ${t('resetBtn')}</button>`}
        ${retryBtn}
        ${nextBtn}
      </div>
    </div>
  `;
}

function puzzleClick(r, c) {
  if (state.puzzleSolved || state.puzzleFailed || state.animating) return;
  const game = state.puzzleGame;
  const puzzle = PUZZLES[state.puzzleIndex];

  if (state.puzzleSelected) {
    const [fr, fc] = state.puzzleSelected;
    if (state.puzzleValidMoves.some(([mr, mc]) => mr === r && mc === c)) {
      const piece = game.board[fr][fc];
      const boardEl = document.querySelector('#screen-puzzle .chess-board');

      // solution 기반 판정: 현재 스텝의 정답과 비교
      const step = state.puzzleSolutionStep;
      const sol = puzzle.solution[step];
      const isCorrect = sol && sol[0] === fr && sol[1] === fc && sol[2] === r && sol[3] === c;

      if (!isCorrect) {
        // 틀린 수 → 실패
        game.move(fr, fc, r, c);
        state.puzzleSelected = null;
        state.puzzleValidMoves = [];
        animateMove(boardEl, fr, fc, r, c, piece, () => {
          state.puzzleFailed = true;
          renderPuzzleBoard();
        });
        return;
      }

      // 정답 수
      game.move(fr, fc, r, c);
      state.puzzleSelected = null;
      state.puzzleValidMoves = [];
      state.puzzleMoveCount++;
      state.puzzleSolutionStep++;

      animateMove(boardEl, fr, fc, r, c, piece, () => {
        // 모든 solution 스텝을 완료했거나 체크메이트 달성
        if (state.puzzleSolutionStep >= puzzle.solution.length || game.status === 'checkmate') {
          state.puzzleSolved = true;
          savePuzzleStars(puzzle.level, state.puzzleIndex, 1);
          spawnParticles();
          renderPuzzleBoard();
          return;
        }

        // 다수 체크메이트: AI 응수 후 계속
        if (game.turn === 'b') {
          setTimeout(() => {
            doPuzzleAiMove();
            renderPuzzleBoard();
          }, 400);
          return;
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

function puzzleHint() {
  if (state.puzzleSolved || state.puzzleFailed) return;
  const puzzle = PUZZLES[state.puzzleIndex];
  const step = state.puzzleSolutionStep;
  const remaining = puzzle.solution.slice(step);
  if (remaining.length === 0) return;

  const boardEl = document.querySelector('#screen-puzzle .chess-board');
  if (!boardEl) return;

  const cols = 'abcdefgh';
  const game = state.puzzleGame;

  // 남은 모든 수를 화살표로 표시
  const pNames = {wK:'King',wQ:'Queen',wR:'Rook',wB:'Bishop',wN:'Knight',wP:'Pawn',
                  bK:'King',bQ:'Queen',bR:'Rook',bB:'Bishop',bN:'Knight',bP:'Pawn'};
  let textParts = [];
  for (let i = 0; i < remaining.length; i++) {
    const [fr, fc, tr, tc] = remaining[i];
    const piece = i === 0 ? game.board[fr][fc] : null;
    const pName = piece ? (pNames[piece] || '') : '';
    textParts.push((i + 1) + '. ' + (pName ? pName + ' ' : '') + cols[tc] + (8 - tr));
  }

  showHintMoves(boardEl, remaining, 8, textParts.join(' → '));
}

function doPuzzleAiMove() {
  const game = state.puzzleGame;
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (game.color(game.board[r][c]) === 'b') {
        const legal = game.legalMoves(r, c);
        legal.forEach(([tr, tc]) => moves.push([r, c, tr, tc]));
      }
    }
  }
  if (moves.length === 0) return;
  const pick = moves[Math.floor(Math.random() * moves.length)];
  game.move(pick[0], pick[1], pick[2], pick[3]);
}
