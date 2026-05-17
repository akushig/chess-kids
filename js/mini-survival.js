// ===== 미니게임 2: 서바이벌 =====
// 킹으로 적 기물의 공격을 피하며 생존

const SURVIVAL_LEVELS = [
  { name: '1', spawnRate: 3, pieces: ['bP'], maxEnemies: 6, initEnemies: 2 },
  { name: '2', spawnRate: 2, pieces: ['bP','bR'], maxEnemies: 7, initEnemies: 3 },
  { name: '3', spawnRate: 2, pieces: ['bP','bR','bB'], maxEnemies: 8, initEnemies: 3 },
  { name: '4', spawnRate: 2, pieces: ['bP','bR','bB','bQ'], maxEnemies: 8, initEnemies: 3 },
];

function goSurvival(levelIdx) {
  const lv = SURVIVAL_LEVELS[levelIdx || 0];
  const size = 6;
  state.sv = {
    levelIdx: levelIdx || 0,
    size: size,
    board: Array.from({length: size}, () => Array(size).fill(null)),
    kingPos: [size - 1, Math.floor(size / 2)],
    turn: 0,
    gameOver: false,
    record: parseInt(localStorage.getItem('survival_record_' + (levelIdx || 0)) || '0'),
  };
  state.sv.board[state.sv.kingPos[0]][state.sv.kingPos[1]] = 'wK';
  // 첫 턴부터 적 배치
  for (let i = 0; i < lv.initEnemies; i++) survivalSpawnEnemy(state.sv);
  showScreen('mini');
  renderSurvival();
}

function getSurvivalSafeMoves(sv) {
  const [kr, kc] = sv.kingPos;
  const size = sv.size;
  const safeMoves = [];
  for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,0],[0,1],[1,-1],[1,0],[1,1]]) {
    const r = kr + dr, c = kc + dc;
    if (r < 0 || r >= size || c < 0 || c >= size) continue;
    if (sv.board[r][c] && sv.board[r][c] !== 'wK') continue;
    if (!isSurvivalAttacked(sv, r, c)) safeMoves.push([r, c]);
  }
  return safeMoves;
}

function isSurvivalAttacked(sv, row, col) {
  const size = sv.size;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const p = sv.board[r][c];
      if (!p || p[0] !== 'b') continue;
      const type = p[1];
      if (type === 'P') {
        if (r + 1 === row && (c - 1 === col || c + 1 === col)) return true;
      } else if (type === 'R') {
        if (r === row) { let blocked = false; const dir = col > c ? 1 : -1; for (let cc = c + dir; cc !== col; cc += dir) { if (sv.board[r][cc]) { blocked = true; break; } } if (!blocked) return true; }
        if (c === col) { let blocked = false; const dir = row > r ? 1 : -1; for (let rr = r + dir; rr !== row; rr += dir) { if (sv.board[rr][c]) { blocked = true; break; } } if (!blocked) return true; }
      } else if (type === 'B') {
        if (Math.abs(row - r) === Math.abs(col - c) && Math.abs(row - r) > 0) {
          const dr = row > r ? 1 : -1, dc = col > c ? 1 : -1;
          let blocked = false; let cr = r + dr, cc = c + dc;
          while (cr !== row || cc !== col) { if (sv.board[cr][cc]) { blocked = true; break; } cr += dr; cc += dc; }
          if (!blocked) return true;
        }
      } else if (type === 'Q') {
        if (r === row) { let blocked = false; const dir = col > c ? 1 : -1; for (let cc = c + dir; cc !== col; cc += dir) { if (sv.board[r][cc]) { blocked = true; break; } } if (!blocked) return true; }
        if (c === col) { let blocked = false; const dir = row > r ? 1 : -1; for (let rr = r + dir; rr !== row; rr += dir) { if (sv.board[rr][c]) { blocked = true; break; } } if (!blocked) return true; }
        if (Math.abs(row - r) === Math.abs(col - c) && Math.abs(row - r) > 0) {
          const dr = row > r ? 1 : -1, dc = col > c ? 1 : -1;
          let blocked = false; let cr = r + dr, cc = c + dc;
          while (cr !== row || cc !== col) { if (sv.board[cr][cc]) { blocked = true; break; } cr += dr; cc += dc; }
          if (!blocked) return true;
        }
      } else if (type === 'N') {
        const dr = Math.abs(row - r), dc = Math.abs(col - c);
        if ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) return true;
      }
    }
  }
  return false;
}

function survivalSpawnEnemy(sv) {
  const lv = SURVIVAL_LEVELS[sv.levelIdx];
  const size = sv.size;
  let enemyCount = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (sv.board[r][c] && sv.board[r][c][0] === 'b') enemyCount++;
  if (enemyCount >= lv.maxEnemies) return;

  const piece = lv.pieces[Math.floor(Math.random() * lv.pieces.length)];
  const empties = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < size; c++) {
    if (!sv.board[r][c]) empties.push([r, c]);
  }
  if (empties.length === 0) return;
  const [sr, sc] = empties[Math.floor(Math.random() * empties.length)];
  sv.board[sr][sc] = piece;
}

// 적 이동 로직
function survivalMoveEnemies(sv) {
  const size = sv.size;
  const [kr, kc] = sv.kingPos;
  const enemies = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (sv.board[r][c] && sv.board[r][c][0] === 'b') enemies.push({r, c, p: sv.board[r][c]});

  for (const e of enemies) {
    const type = e.p[1];
    let nr = e.r, nc = e.c;

    if (type === 'P') {
      // 폰: 아래로 1칸, 끝줄이면 윗줄로 리스폰
      if (e.r + 1 < size && !sv.board[e.r + 1][e.c]) {
        nr = e.r + 1;
      } else if (e.r + 1 >= size) {
        // 끝줄 도달 → 윗줄 빈칸으로 리스폰
        sv.board[e.r][e.c] = null;
        const empties = [];
        for (let c = 0; c < size; c++) if (!sv.board[0][c]) empties.push(c);
        if (empties.length > 0) sv.board[0][empties[Math.floor(Math.random() * empties.length)]] = e.p;
        continue;
      }
    } else if (type === 'R') {
      // 룩: 킹 방향으로 1칸 (가로 또는 세로)
      if (Math.abs(kr - e.r) >= Math.abs(kc - e.c)) {
        const dir = kr > e.r ? 1 : kr < e.r ? -1 : 0;
        if (dir !== 0 && e.r + dir >= 0 && e.r + dir < size && !sv.board[e.r + dir][e.c]) nr = e.r + dir;
      } else {
        const dir = kc > e.c ? 1 : kc < e.c ? -1 : 0;
        if (dir !== 0 && e.c + dir >= 0 && e.c + dir < size && !sv.board[e.r][e.c + dir]) nc = e.c + dir;
      }
    } else if (type === 'B') {
      // 비숍: 킹 방향 대각선 1칸
      const dr = kr > e.r ? 1 : kr < e.r ? -1 : 0;
      const dc = kc > e.c ? 1 : kc < e.c ? -1 : 0;
      if (dr !== 0 && dc !== 0 && e.r + dr >= 0 && e.r + dr < size && e.c + dc >= 0 && e.c + dc < size && !sv.board[e.r + dr][e.c + dc]) {
        nr = e.r + dr; nc = e.c + dc;
      }
    } else if (type === 'Q') {
      // 퀸: 킹 방향으로 1칸 (8방향)
      const dr = kr > e.r ? 1 : kr < e.r ? -1 : 0;
      const dc = kc > e.c ? 1 : kc < e.c ? -1 : 0;
      if ((dr !== 0 || dc !== 0) && e.r + dr >= 0 && e.r + dr < size && e.c + dc >= 0 && e.c + dc < size && !sv.board[e.r + dr][e.c + dc]) {
        nr = e.r + dr; nc = e.c + dc;
      }
    }

    if (nr !== e.r || nc !== e.c) {
      sv.board[e.r][e.c] = null;
      sv.board[nr][nc] = e.p;
    }
  }
}

function renderSurvival() {
  const sv = state.sv;
  const size = sv.size;
  const [kr, kc] = sv.kingPos;
  const safeMoves = sv.gameOver ? [] : getSurvivalSafeMoves(sv);

  let cells = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isLight = (r + c) % 2 === 0;
      let cls = 'board-cell ' + (isLight ? 'light' : 'dark');
      let content = '';
      const p = sv.board[r][c];
      if (p) content = getPieceSVG(p, 36);
      if (p && p[0] === 'b') cls += ' enemy-cell';
      if (r === kr && c === kc) cls += ' selected';
      if (safeMoves.some(([mr, mc]) => mr === r && mc === c) && !(r === kr && c === kc)) cls += ' move-hint';
      cells += `<div class="${cls}" onclick="survivalClick(${r},${c})">${content}</div>`;
    }
  }

  const isNewRecord = sv.gameOver && sv.turn > sv.record;
  let msg;
  if (sv.gameOver) {
    msg = `<div class="status-msg fail">${t('survivalGameOver')} ${isNewRecord ? '🎉 ' + t('survivalNewRecord') : ''}</div>`;
  } else {
    msg = `<div class="status-msg">${t('survivalDesc')}</div>`;
  }

  const info = `<div class="mission-info">
    <div class="mission-speech">${t('survivalTurn')}: ${sv.turn}</div>
    <div class="move-counter">${t('survivalRecord')}: ${Math.max(sv.record, sv.turn)}</div>
  </div>`;

  const actions = !sv.gameOver ? `
    <div class="mission-actions">
      <button class="icon-btn hint-btn" onclick="survivalHint()">💡 ${t('hintBtn')}</button>
    </div>` : '';

  const retryBtn = sv.gameOver ? `<button class="action-btn" onclick="goSurvival(${sv.levelIdx})">${t('missionRetryBtn')}</button>` : '';
  const nextBtn = sv.gameOver && sv.turn >= 10 && sv.levelIdx < SURVIVAL_LEVELS.length - 1
    ? `<button class="action-btn green" onclick="goSurvival(${sv.levelIdx + 1})">${t('btnNext')}</button>` : '';

  document.getElementById('screen-mini').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="goMiniMenu()">← ${t('btnBack')}</button>
        <h2>${t('survivalTitle')} Lv.${sv.levelIdx + 1}</h2>
      </div>
      ${msg} ${info}
      <div class="chess-board" style="grid-template-columns:repeat(${size},1fr)">${cells}</div>
      ${actions} ${retryBtn} ${nextBtn}
    </div>`;
}

function survivalClick(r, c) {
  if (state.animating) return;
  const sv = state.sv;
  if (sv.gameOver) return;
  const safeMoves = getSurvivalSafeMoves(sv);
  if (!safeMoves.some(([mr, mc]) => mr === r && mc === c)) return;

  const [kr, kc] = sv.kingPos;
  const boardEl = document.querySelector('#screen-mini .chess-board');
  sv.board[kr][kc] = null;
  sv.board[r][c] = 'wK';
  sv.kingPos = [r, c];
  sv.turn++;

  animateMove(boardEl, kr, kc, r, c, 'wK', () => {
    // 적 이동
    survivalMoveEnemies(sv);

    // 새 적 스폰
    const lv = SURVIVAL_LEVELS[sv.levelIdx];
    if (sv.turn % lv.spawnRate === 0) survivalSpawnEnemy(sv);

    // 킹이 적에게 잡혔는지 (적이 킹 위치로 이동했을 수 있음)
    if (sv.board[sv.kingPos[0]][sv.kingPos[1]] !== 'wK') {
      sv.gameOver = true;
    }

    // 안전한 이동이 없는지
    const nextSafe = getSurvivalSafeMoves(sv);
    if (nextSafe.length === 0) {
      sv.gameOver = true;
    }

    if (sv.gameOver && sv.turn > sv.record) {
      sv.record = sv.turn;
      localStorage.setItem('survival_record_' + sv.levelIdx, sv.turn);
    }
    if (sv.gameOver) {
      const stars = sv.turn >= 15 ? 3 : sv.turn >= 10 ? 2 : sv.turn >= 5 ? 1 : 0;
      if (stars > 0) saveMiniGameStars('survival', sv.levelIdx, stars);
    }

    renderSurvival();
  }, sv.size);
}

function survivalHint() {
  const sv = state.sv;
  if (sv.gameOver) return;
  const safeMoves = getSurvivalSafeMoves(sv);
  const boardEl = document.querySelector('#screen-mini .chess-board');
  if (!boardEl) return;

  if (safeMoves.length === 0) {
    const speech = document.querySelector('.mission-speech');
    if (speech) {
      speech.innerHTML = '⚠️ ' + t('hintUnsolvable');
      speech.classList.add('hint-active', 'hint-unsolvable');
    }
    return;
  }

  // 2턴 선읽기: 각 이동 후 적 이동까지 시뮬레이션해서 가장 많은 안전칸을 확보하는 수 선택
  let best = safeMoves[0], bestScore = -1;
  for (const [r, c] of safeMoves) {
    sv.board[sv.kingPos[0]][sv.kingPos[1]] = null;
    sv.board[r][c] = 'wK';
    const oldPos = sv.kingPos;
    sv.kingPos = [r, c];
    const futureSafe = getSurvivalSafeMoves(sv).length;
    sv.board[r][c] = null;
    sv.board[oldPos[0]][oldPos[1]] = 'wK';
    sv.kingPos = oldPos;
    if (futureSafe > bestScore) { bestScore = futureSafe; best = [r, c]; }
  }
  showHintArrow(boardEl, sv.kingPos[0], sv.kingPos[1], best[0], best[1], sv.size, t('survivalHint'));
}
