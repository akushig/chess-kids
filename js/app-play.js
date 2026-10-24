// ===== 대전 화면 + 리워드 화면 =====
// 대전: 컴퓨터(난이도 5단계) 또는 친구(위·아래 마주 보기 + 한 수 제한 시간)

const PLAY_TIMER_OPTIONS = [0, 15, 30, 60];
const PLAY_LEVEL_ICONS = ['🐣', '🐥', '🐱', '🦁', '🐲'];
const PLAY_AI_MIN_DELAY = 400;  // 컴퓨터가 너무 빨리 두면 아이가 수를 못 따라감
const PLAY_TIMEOUT_LEVEL = 2;   // 시간 초과 때 대신 두는 수의 수준 (보통)
const PLAY_DRAW_KEYS = {
  stalemate: 'playDrawStalemate',
  kings: 'playDrawKings',
  material: 'playDrawMaterial',
  repetition: 'playDrawRepetition',
  fifty: 'playDrawFifty',
};

let playToken = 0;          // 새 대국·화면 이탈마다 증가해서 늦게 도착한 콜백을 버림
let playTimerHandle = null;
let playAiWorker = null;    // null: 아직 안 만듦, false: 워커를 못 씀
let playAiSeq = 0;
const playAiPending = {};

function getPlaySettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem('play_settings')) || {}; } catch { s = {}; }
  return {
    mode: s.mode === 'friend' ? 'friend' : 'ai',
    level: Number.isInteger(s.level) && AI_LEVELS[s.level] ? s.level : 1,
    timer: PLAY_TIMER_OPTIONS.includes(s.timer) ? s.timer : 30,
  };
}
function savePlaySettings(s) {
  try { localStorage.setItem('play_settings', JSON.stringify(s)); } catch {}
}

// --- 설정 화면 ---
function goPlay() {
  playStop();
  showScreen('play');
  renderPlaySetup();
}

function renderPlaySetup() {
  const s = getPlaySettings();
  const modes = [['ai', '🤖', 'playModeAi'], ['friend', '👫', 'playModeFriend']].map(([mode, icon, key]) => `
    <button class="play-mode ${s.mode === mode ? 'active' : ''}" onclick="playSetOption('mode', '${mode}')">
      <span class="play-mode-icon">${icon}</span>${t(key)}
    </button>
  `).join('');

  let options;
  if (s.mode === 'ai') {
    const levels = AI_LEVELS.map((_, i) => `
      <button class="play-level ${s.level === i ? 'active' : ''}" onclick="playSetOption('level', ${i})">
        <span class="play-level-icon">${PLAY_LEVEL_ICONS[i]}</span>
        <span class="play-level-name">${t('playLevel' + i)}</span>
        <span class="play-level-desc">${t('playLevelDesc' + i)}</span>
      </button>
    `).join('');
    options = `<div class="play-section-title">${t('playDifficulty')}</div><div class="play-levels">${levels}</div>`;
  } else {
    const timers = PLAY_TIMER_OPTIONS.map(sec => `
      <button class="play-chip ${s.timer === sec ? 'active' : ''}" onclick="playSetOption('timer', ${sec})">${playTimerLabel(sec)}</button>
    `).join('');
    options = `
      <div class="play-section-title">${t('playTimer')}</div>
      <div class="play-timers">${timers}</div>
      <div class="play-note">${t('playFriendNote')}${s.timer ? '<br>' + t('playTimerNote') : ''}</div>
    `;
  }

  document.getElementById('screen-play').innerHTML = `
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="showScreen('home'); renderHome()">← ${t('btnBack')}</button>
        <h2>${t('menuPlay')}</h2>
      </div>
      <div class="play-setup">
        <div class="play-modes">${modes}</div>
        ${options}
      </div>
      <button class="action-btn" onclick="playStart()">${t('btnStart')}</button>
    </div>
  `;
}

function playTimerLabel(sec) {
  return sec ? t('playSeconds').replace('{n}', sec) : t('playTimerOff');
}

function playSetOption(key, value) {
  const s = getPlaySettings();
  s[key] = value;
  savePlaySettings(s);
  renderPlaySetup();
}

// --- 대국 시작/종료 ---
function playStart() {
  playStop();
  const s = getPlaySettings();
  state.game = new ChessGame();
  state.play = {
    mode: s.mode,
    level: s.level,
    timer: s.mode === 'friend' ? s.timer : 0,
    deadline: 0,
    pausedLeft: null,
    buzzed: null,
    timeoutSide: null,  // 시간 초과로 대신 둔 쪽 (그 패널에 안내 표시)
  };
  showScreen('play');
  renderPlay();
  playTimerStart();
}

function playStop() {
  playToken++;
  playTimerStop();
  if (state.play) state.play.pausedLeft = null;
}

function playIsOver() {
  return state.game.status === 'checkmate' || state.game.status === 'draw';
}

// --- 화면 ---
function renderPlay() {
  if (state.play.mode === 'friend') renderPlayFriend();
  else renderPlayAi();
}

function playBoardHTML(faceToFace) {
  const game = state.game;
  let cells = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      const piece = game.board[r][c];
      let cls = 'board-cell ' + (isLight ? 'light' : 'dark');
      if (game.selected && game.selected[0] === r && game.selected[1] === c) cls += ' selected';
      if (game.validMoves && game.validMoves.some(([mr, mc]) => mr === r && mc === c)) cls += ' move-hint';
      if (piece) cls += ' pc-' + piece[0];
      const pieceContent = piece ? getPieceSVG(piece) : '';
      cells += `<div class="${cls}" onclick="playClick(${r},${c})">${pieceContent}</div>`;
    }
  }
  return `<div class="chess-board${faceToFace ? ' face-to-face' : ''}">${cells}</div>`;
}

function renderPlayAi() {
  const game = state.game;
  const level = state.play.level;

  let statusMsg = '';
  if (game.status === 'checkmate') {
    statusMsg = game.turn === 'b'
      ? `<div class="status-msg success">${t('playCheckmate')}</div>`
      : `<div class="status-msg fail">${t('playLose')}</div>`;
  } else if (game.status === 'draw') {
    statusMsg = `<div class="status-msg draw">${t('playDraw')}<div class="status-sub">${t(PLAY_DRAW_KEYS[game.drawReason])}</div></div>`;
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
        <button class="back-btn" onclick="goPlay()">← ${t('btnBack')}</button>
        <h2>${t('playTitle')}</h2>
        <span class="play-badge">${PLAY_LEVEL_ICONS[level]} ${t('playLevel' + level)}</span>
      </div>
      ${statusMsg}
      <div class="captured-pieces" id="captured-top">${game.captured.b.map(p => getPieceSVG(p, 24)).join('')}</div>
      ${playBoardHTML(false)}
      <div class="captured-pieces" id="captured-bottom">${game.captured.w.map(p => getPieceSVG(p, 24)).join('')}</div>
      <button class="action-btn" onclick="playStart()">${t('playRestart')}</button>
    </div>
  `;
}

// 친구와 대전: 위쪽(검은색) 패널은 180° 돌려서 마주 앉은 친구가 바로 읽게 함
function renderPlayFriend() {
  const game = state.game, p = state.play;
  const over = playIsOver();

  const panel = side => {
    const active = !over && game.turn === side;
    let msg, reason = '', cls = active ? 'active' : '';
    if (game.status === 'checkmate') {
      const lost = game.turn === side;
      msg = lost ? t('playLoseShort') : t('playWin');
      cls = lost ? 'lose' : 'win';
    } else if (game.status === 'draw') {
      msg = t('playDraw');
      reason = `<div class="p2-reason">${t(PLAY_DRAW_KEYS[game.drawReason])}</div>`;
      cls = 'draw';
    } else if (p.timeoutSide === side) {
      msg = t('playTimeout');
    } else if (active) {
      msg = game.status === 'check' ? t('playCheck') : t('playYourTurn');
    } else {
      msg = t('playFriendTurn');
    }
    const time = p.timer && !over ? `<span class="p2-time">${p.timer}</span>` : '';
    const bar = p.timer && !over ? `<div class="p2-bar"><div class="p2-bar-fill"></div></div>` : '';
    const capturedId = side === 'w' ? 'captured-bottom' : 'captured-top';
    return `
      <div class="p2-panel ${side === 'b' ? 'p2-top' : ''} ${cls}" id="p2-panel-${side}">
        <div class="p2-head">
          <span class="p2-king">${getPieceSVG(side + 'K', 32)}</span>
          <div class="p2-text">
            <div class="p2-name">${t(side === 'w' ? 'playWhite' : 'playBlack')}</div>
            <div class="p2-msg">${msg}</div>
          </div>
          ${time}
        </div>
        ${reason}
        ${bar}
        <div class="captured-pieces" id="${capturedId}">${game.captured[side].map(pc => getPieceSVG(pc, 24)).join('')}</div>
      </div>
    `;
  };

  document.getElementById('screen-play').innerHTML = `
    <div class="screen-wrap play-2p">
      <div class="screen-header">
        <button class="back-btn" onclick="goPlay()">← ${t('btnBack')}</button>
        <h2>${t('playFriendTitle')}</h2>
        ${p.timer ? `<span class="play-badge">⏱ ${playTimerLabel(p.timer)}</span>` : ''}
      </div>
      ${panel('b')}
      ${playBoardHTML(true)}
      ${panel('w')}
      <button class="action-btn" onclick="playStart()">${t('playRestart')}</button>
    </div>
  `;
  if (playTimerHandle) playTimerPaint();
}

// --- 수 두기 ---
function playClick(r, c) {
  const game = state.game, p = state.play;
  if (state.animating || playIsOver()) return;
  if (p.mode === 'ai' && game.turn !== 'w') return;

  if (game.selected) {
    const [fr, fc] = game.selected;
    if (game.validMoves.some(([mr, mc]) => mr === r && mc === c)) {
      p.timeoutSide = null;
      playCommitMove([fr, fc, r, c]);
      return;
    }
  }

  game.select(r, c);
  renderPlay();
}

function playCommitMove([fr, fc, tr, tc]) {
  const game = state.game;
  const piece = game.board[fr][fc];
  const captured = game.board[tr][tc];
  const mover = game.turn;
  const boardEl = document.querySelector('#screen-play .chess-board');
  const token = playToken;

  playTimerStop();
  game.move(fr, fc, tr, tc);
  animateMove(boardEl, fr, fc, tr, tc, piece, () => {
    if (token !== playToken) return;
    if (captured) {
      animateCapture(boardEl, tr, tc, captured, mover === 'w' ? 'captured-bottom' : 'captured-top');
    }
    renderPlay();
    playNextTurn();
  });
}

function playNextTurn() {
  const game = state.game, p = state.play;
  if (game.status === 'checkmate') {
    if (p.mode === 'friend' || game.turn === 'b') spawnParticles();
    return;
  }
  if (game.status === 'draw') return;
  if (p.mode === 'ai' && game.turn === 'b') playAiMove();
  else playTimerStart();
}

function playPosition(game) {
  return {
    board: game.board,
    turn: game.turn,
    enPassant: game.enPassant,
    halfmove: game.halfmoveClock,
    repeated: Object.keys(game.positionCounts).filter(k => game.positionCounts[k] >= 2),
  };
}

// 엔진이 고른 수가 ChessGame 규칙에서도 합법인지 확인, 아니면 아무 합법 수
function playLegalOrFallback(mv) {
  const game = state.game;
  if (mv) {
    const [fr, fc, tr, tc] = mv;
    if (game.color(game.board[fr][fc]) === game.turn && game.legalMoves(fr, fc).some(([r, c]) => r === tr && c === tc)) return mv;
  }
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (game.color(game.board[r][c]) === game.turn) {
        game.legalMoves(r, c).forEach(([tr, tc]) => moves.push([r, c, tr, tc]));
      }
    }
  }
  return moves.length ? moves[Math.floor(Math.random() * moves.length)] : null;
}

// --- 컴퓨터 ---
function playAiMove() {
  const token = playToken, started = Date.now();
  playRequestAi(playPosition(state.game), state.play.level, mv => {
    if (token !== playToken) return;
    setTimeout(() => {
      if (token !== playToken) return;
      const move = playLegalOrFallback(mv);
      if (move) playCommitMove(move);
    }, Math.max(0, PLAY_AI_MIN_DELAY - (Date.now() - started)));
  });
}

// 생각하는 동안 화면이 멈추지 않도록 Web Worker에서 계산, 못 쓰면 메인 스레드에서
function playRequestAi(position, level, done) {
  if (playAiWorker === null) {
    try {
      playAiWorker = new Worker('js/chess-ai.js');
      playAiWorker.onmessage = e => {
        const job = playAiPending[e.data.id];
        delete playAiPending[e.data.id];
        if (job) job.done(e.data.move);
      };
      playAiWorker.onerror = () => {
        playAiWorker.terminate();
        playAiWorker = false;
        for (const id of Object.keys(playAiPending)) {
          const job = playAiPending[id];
          delete playAiPending[id];
          job.done(aiChooseMove(job.position, job.level));
        }
      };
    } catch {
      playAiWorker = false;
    }
  }
  if (playAiWorker) {
    const id = ++playAiSeq;
    playAiPending[id] = { position, level, done };
    playAiWorker.postMessage({ id, position, level });
  } else {
    setTimeout(() => done(aiChooseMove(position, level)), 0);
  }
}

// --- 한 수 타이머 (친구와 대전) ---
function playTimerStart() {
  playTimerStop();
  const p = state.play;
  if (!p || p.mode !== 'friend' || !p.timer || playIsOver()) return;
  p.deadline = Date.now() + p.timer * 1000;
  p.pausedLeft = null;
  p.buzzed = null;
  playTimerResume();
}

function playTimerResume() {
  playTimerHandle = setInterval(playTimerTick, 200);
  playTimerTick();
}

function playTimerStop() {
  if (playTimerHandle) clearInterval(playTimerHandle);
  playTimerHandle = null;
}

function playTimerTick() {
  if (state.screen !== 'play') { playTimerStop(); return; }
  playTimerPaint();
  if (Date.now() >= state.play.deadline) {
    playTimerStop();
    playTimeoutMove();
  }
}

// 남은 시간이 줄수록 패널·보드를 주황 → 빨강으로 강조, 마지막 3초는 진동
function playTimerPaint() {
  const p = state.play;
  const panel = document.getElementById('p2-panel-' + state.game.turn);
  if (!panel) return;
  const left = Math.max(0, p.deadline - Date.now());
  const secs = Math.ceil(left / 1000);
  const stage = secs <= 5 ? 'danger' : secs <= Math.min(10, Math.ceil(p.timer / 2)) ? 'warn' : '';
  panel.querySelector('.p2-time').textContent = secs;
  panel.querySelector('.p2-bar-fill').style.width = (left / (p.timer * 1000) * 100) + '%';
  panel.classList.toggle('warn', stage === 'warn');
  panel.classList.toggle('danger', stage === 'danger');
  const boardEl = document.querySelector('#screen-play .chess-board');
  if (boardEl) boardEl.classList.toggle('p2-danger', stage === 'danger');
  if (secs > 0 && secs <= 3 && p.buzzed !== secs) {
    p.buzzed = secs;
    try { if (navigator.vibrate) navigator.vibrate(60); } catch {}
  }
}

function playTimeoutMove() {
  const game = state.game;
  if (state.animating || playIsOver()) return;
  const move = playLegalOrFallback(aiChooseMove(playPosition(game), PLAY_TIMEOUT_LEVEL));
  if (!move) return;
  state.play.timeoutSide = game.turn;
  game.selected = null;
  game.validMoves = [];
  playCommitMove(move);
}

// 앱을 잠깐 내렸다 오면 그동안은 시간이 흐르지 않게 멈춤
document.addEventListener('visibilitychange', () => {
  const p = state.play;
  if (!p) return;
  if (document.hidden && playTimerHandle) {
    p.pausedLeft = p.deadline - Date.now();
    playTimerStop();
  } else if (!document.hidden && p.pausedLeft !== null && state.screen === 'play') {
    p.deadline = Date.now() + p.pausedLeft;
    p.pausedLeft = null;
    playTimerResume();
  }
});

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
