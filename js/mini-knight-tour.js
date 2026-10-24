// Knight tour: the board and its familiar controls stay in one place.
const KNIGHT_TOUR_LEVELS = [
  { id: 'knight-tour-5-v1', size: 5, label: '5×5' },
  { id: 'knight-tour-6-v1', size: 6, label: '6×6' },
  { id: 'knight-tour-7-v1', size: 7, label: '7×7' },
];
const KT_NODE_LIMIT = 300000;

function getKnightTourSettings() {
  const saved = readData('knight_tour_settings', {});
  const index = KNIGHT_TOUR_LEVELS.findIndex(level => level.size === saved.size);
  return {
    levelIdx: index >= 0 ? index : 0,
    randomStart: !!saved.randomStart,
    branchWarn: typeof saved.branchWarn === 'boolean' ? saved.branchWarn : true,
    hintStyle: saved.hintStyle === 'next' ? 'next' : 'path',
  };
}

function saveKnightTourSettings(settings) {
  writeData('knight_tour_settings', {
    size: KNIGHT_TOUR_LEVELS[settings.levelIdx].size,
    randomStart: settings.randomStart,
    branchWarn: settings.branchWarn,
    hintStyle: settings.hintStyle,
  });
}

function ktSelectSize(levelIdx) {
  if (state.kt.mode === 'tour' && state.kt.levelIdx === levelIdx) return;
  ktRequestNewGame(levelIdx, 'tour');
}

function ktSelectMode(mode) {
  if (state.kt.mode === mode) return;
  ktRequestNewGame(getKnightTourSettings().levelIdx, mode);
}

function ktToggleOption(key) {
  if (key !== 'branchWarn' && key !== 'randomStart') return;
  const settings = getKnightTourSettings();
  settings[key] = !settings[key];
  saveKnightTourSettings(settings);
  renderKnightTour();
  if (key === 'branchWarn') document.getElementById('kt-branch-alert')?.focus?.({ preventScroll: true });
}

function ktSetStartMode(mode) {
  const settings = getKnightTourSettings();
  settings.randomStart = mode === 'random';
  saveKnightTourSettings(settings);
  state.kt.settingsOpen = true;
  renderKnightTour();
  document.getElementById('kt-start-' + mode)?.focus?.({ preventScroll: true });
}

function ktToggleFamily() {
  state.kt.family = !state.kt.family;
  state.kt.jointUsed ||= state.kt.family;
  state.kt.settingsOpen = true;
  renderKnightTour();
  document.getElementById('kt-family-play')?.focus?.({ preventScroll: true });
}

function ktRequestNewGame(levelIdx, mode, shared = null, sameBoard = false) {
  const start = () => goKnightTour(levelIdx, mode, shared);
  if (state.kt?.moveCount > 0 && !state.kt.clear) {
    showChoice(sameBoard ? '같은 시작점에서 다시 해볼까요?' : '지금 판을 마치고 새 판을 시작할까요?', [
      { label: sameBoard ? '같은 판 다시 하기' : '새 판 시작', action: start },
      { label: '이어서 하기', action: () => {} },
    ]);
  } else start();
}

function ktRestart() {
  const kt = state.kt;
  ktRequestNewGame(kt.levelIdx, kt.mode, { startPos: [...kt.startPos], family: kt.family }, true);
}

// A new random start must admit a full tour. Restarting keeps the current start.
function ktPickStart(size, random, previous) {
  const corner = [size - 1, 0];
  if (!random) return corner;
  const cells = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (!previous || previous[0] !== r || previous[1] !== c) cells.push([r, c]);
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(activityRandom() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  for (const [r, c] of cells) {
    const board = Array.from({ length: size }, () => Array(size).fill(false));
    board[r][c] = true;
    if (ktFindPath(board, size, [r, c], KT_NODE_LIMIT).path) return [r, c];
  }
  return corner;
}

function getKnightMoves(row, col, size, board) {
  return KNIGHT_DELTAS.map(([dr, dc]) => [row + dr, col + dc])
    .filter(([r, c]) => r >= 0 && r < size && c >= 0 && c < size && !board[r][c]);
}

// All modes use the same alert control, evaluated against their own goal.
// An exhausted search is unknown, never proof that a move is fatal.
function ktAnalyze(kt) {
  if (kt.analysis?.at === kt.moveCount && Array.isArray(kt.analysis.unknown)) return kt.analysis;
  const result = { at: kt.moveCount, fatal: [], viable: [], unknown: [], safe: 0 };
  for (const next of getKnightMoves(...kt.pos, kt.size, kt.board)) {
    const candidate = { ...kt, board: kt.board.map(row => [...row]), pos: next, visited: kt.visited + 1 };
    candidate.board[next[0]][next[1]] = true;
    const solution = knightGoalPath(candidate);
    if (solution.path === null) result.fatal.push(next);
    else if (solution.timeout) result.unknown.push(next);
    else result.viable.push(next);
  }
  result.safe = result.viable.length;
  kt.analysis = result;
  return result;
}

// Existing entry points go directly to the familiar tour; gentler goals remain one tap away.
function goKnightSetup() { goKnightTour(); }

function goKnightTour(levelIdx, mode = 'tour', shared = null) {
  beginActivity('knight', { levelIdx, mode });
  const settings = getKnightTourSettings();
  if (levelIdx == null) levelIdx = settings.levelIdx;
  if (mode !== 'tour' && !shared) levelIdx = 0;
  if (mode === 'tour') {
    settings.levelIdx = levelIdx;
    saveKnightTourSettings(settings);
  }
  const size = KNIGHT_TOUR_LEVELS[levelIdx].size;
  const start = shared?.startPos || ktPickStart(size, settings.randomStart, state.kt?.startPos);
  state.kt = {
    levelIdx, size, mode, startPos: start, pos: start,
    board: Array.from({ length: size }, () => Array(size).fill(false)),
    visited: 1, total: size * size, stuck: false, clear: false, doomed: false,
    analysis: null, moveCount: 0, notice: '',
    family: !!shared?.family, jointUsed: !!shared?.family, player: 0,
    footprints: { [start.join(',')]: 0 },
    hint: null, hintOpen: false, hintMessage: '', settingsOpen: false,
  };
  const kt = state.kt;
  kt.board[start[0]][start[1]] = true;
  const route = ktFindPath(kt.board, size, start, KT_NODE_LIMIT).path;
  kt.goal = mode === 'walk' ? route[3] : null;
  kt.visitGoal = mode === 'explore' ? 10 : kt.total;
  showScreen('mini');
  renderKnightTour();
}

function knightGoalPath(kt = state.kt) {
  if (kt.mode === 'tour') return ktFindPath(kt.board, kt.size, kt.pos, KT_NODE_LIMIT);
  const board = kt.board.map(row => [...row]);
  let nodes = 0, timeout = false;
  function visit(pos, path) {
    if (kt.mode === 'walk' ? pos[0] === kt.goal[0] && pos[1] === kt.goal[1] : kt.visited + path.length - 1 >= kt.visitGoal) return path;
    if (++nodes > 20000) { timeout = true; return null; }
    const moves = getKnightMoves(...pos, kt.size, board).sort((a, b) =>
      getKnightMoves(...a, kt.size, board).length - getKnightMoves(...b, kt.size, board).length);
    for (const next of moves) {
      board[next[0]][next[1]] = true;
      const found = visit(next, [...path, next]);
      board[next[0]][next[1]] = false;
      if (found) return found;
      if (timeout) return null;
    }
    return null;
  }
  const path = visit(kt.pos, [kt.pos]);
  return path ? { path } : timeout ? { timeout: true } : { path: null };
}

function ktStatus(kt, analysis) {
  if (kt.clear) return { tone: 'success', icon: '✓', title: kt.mode === 'walk' ? '깃발을 찾았어요!' : `${kt.visited}칸을 모두 해냈어요!`, detail: '한 판 더 도전하거나 여기서 마쳐도 좋아요.' };
  if (kt.stuck) return { tone: 'blocked', icon: '↶', title: '더 갈 수 있는 칸이 없어요', detail: '되돌리기로 다른 갈림길을 찾아봐요.' };
  if (analysis && !analysis.safe && !analysis.unknown.length) return { tone: 'blocked', icon: '↶', title: kt.mode === 'tour' ? '이 길에서는 완주할 수 없어요' : '이 길에서는 목표에 갈 수 없어요', detail: '되돌려서 다른 길을 선택할 수 있어요.' };
  if (analysis?.fatal.length) return { tone: 'branch', icon: '⑂', title: '갈림길이에요!', detail: kt.notice || (kt.mode === 'tour' ? '끝까지 이어지지 않는 길이 있어요. 신중하게 골라봐요.' : '목표까지 이어지지 않는 길이 있어요. 다른 길도 살펴봐요.') };
  return { tone: 'calm', icon: '♞', title: kt.notice || (kt.mode === 'walk' ? '나이트로 뛰어서 깃발을 찾아요.' : kt.mode === 'explore' ? '서로 다른 10칸을 찾아가요.' : '모든 칸을 한 번씩 방문해요.'), detail: '' };
}

function ktRouteSVG(hint, size) {
  if (!hint || hint.path.length < 2) return '';
  const path = hint.style === 'next' ? hint.path.slice(0, 2) : hint.path;
  const lines = path.slice(1).map(([r, c], i) => {
    const [fr, fc] = path[i], fx = fc * 100 + 50, fy = fr * 100 + 50, tx = c * 100 + 50, ty = r * 100 + 50;
    return hint.style === 'next'
      ? `<path d="M ${fx} ${fy} ${Math.abs(r - fr) === 2 ? `V ${ty} H ${tx}` : `H ${tx} V ${ty}`}"/>`
      : `<path d="M ${fx} ${fy} L ${tx} ${ty}"/>`;
  }).join('');
  return `<svg class="kt-route hint-arrow ${hint.style === 'path' ? 'kt-route--full' : ''}" viewBox="0 0 ${size * 100} ${size * 100}" aria-hidden="true"><defs><marker id="kt-route-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" stroke="none"/></marker></defs><g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#kt-route-head)">${lines}</g></svg>`;
}

function renderKnightTour() {
  const kt = state.kt, settings = getKnightTourSettings();
  const moves = kt.clear || kt.stuck ? [] : getKnightMoves(...kt.pos, kt.size, kt.board);
  const analysis = settings.branchWarn && !kt.clear && !kt.stuck ? ktAnalyze(kt) : null;
  const status = ktStatus(kt, analysis);
  const hint = kt.hint?.at === kt.moveCount ? kt.hint : null;
  const path = hint ? hint.style === 'next' ? hint.path.slice(0, 2) : hint.path : [];
  const steps = new Map(path.slice(1).map(([r, c], i) => [r + ',' + c, i + 1]));
  let cells = '';
  for (let r = 0; r < kt.size; r++) for (let c = 0; c < kt.size; c++) {
    const key = r + ',' + c;
    let cls = 'board-cell ' + ((r + c) % 2 ? 'dark' : 'light'), content = '';
    if (r === kt.pos[0] && c === kt.pos[1]) { cls += ' selected'; content = getPieceSVG('wN', 36); }
    else if (kt.board[r][c]) {
      cls += ' kt-visited';
      content = `<span class="kt-check ${kt.footprints?.[key] === 1 ? 'parent-step' : ''}">${kt.footprints?.[key] === 1 ? '◆' : '✓'}</span>`;
    } else if (kt.goal?.[0] === r && kt.goal?.[1] === c) { cls += ' goal-cell'; content = '🚩'; }
    if (moves.some(([mr, mc]) => mr === r && mc === c)) cls += ' move-hint';
    if (steps.has(key)) { cls += ' kt-route-cell'; content += `<span class="kt-route-number">${steps.get(key)}</span>`; }
    cells += `<div class="${cls}" onclick="knightTourClick(${r},${c})">${content}</div>`;
  }
  const subtitle = { walk: '깃발까지 짧은 산책', explore: '10칸 탐험', tour: '모든 칸 방문' }[kt.mode];
  const progress = kt.mode === 'walk' ? '🚩 깃발 찾기' : `<strong>${kt.visited}</strong><span> / ${kt.visitGoal}칸 방문</span>`;
  const active = !kt.clear && !kt.stuck;
  document.getElementById('screen-mini').innerHTML = `
    <div class="screen-wrap kt-screen">
      <div class="screen-header kt-header"><button class="back-btn" onclick="goMiniMenu()">← 놀이터</button><h2>나이트 투어</h2><span class="kt-subtitle">${subtitle}</span></div>
      <div class="kt-mode-nav" role="group" aria-label="탐험 목표">${[['walk', '산책'], ['explore', '탐험'], ['tour', '투어']].map(([mode, label]) => `<button aria-pressed="${kt.mode === mode}" onclick="ktSelectMode('${mode}')">${label}</button>`).join('')}</div>
      <div class="kt-toolbar">
        ${kt.mode === 'tour' ? `<div class="kt-size-picker" role="group" aria-label="보드 크기">${KNIGHT_TOUR_LEVELS.map((level, i) => `<button aria-label="${level.label} 판" aria-pressed="${i === kt.levelIdx}" onclick="ktSelectSize(${i})">${level.label}</button>`).join('')}</div>` : '<span class="kt-board-size">' + kt.size + '×' + kt.size + ' 판</span>'}
        <label class="kt-alert-toggle"><span>갈림길 알림</span><input id="kt-branch-alert" type="checkbox" role="switch" ${settings.branchWarn ? 'checked' : ''} onchange="ktToggleOption('branchWarn')"><span class="kt-switch-track" aria-hidden="true"></span></label>
      </div>
      <div class="kt-progress"><span>${progress}</span><span class="kt-turn">${kt.family ? kt.player === 0 ? '🧒 내 차례' : '🧑 가족 차례' : kt.moveCount + '번 점프'}</span></div>
      ${kt.mode !== 'walk' ? `<progress class="kt-progress-bar" max="${kt.visitGoal}" value="${kt.visited}" aria-label="방문한 칸"></progress>` : ''}
      <div class="kt-status status-msg kt-status--${status.tone}" role="status" aria-live="polite"><span class="kt-status-icon" aria-hidden="true">${status.icon}</span><div><strong>${status.title}</strong>${status.detail ? `<small>${status.detail}</small>` : ''}</div></div>
      <div class="chess-board kt-board ${status.tone === 'branch' ? 'kt-board--branch' : ''}" style="grid-template-columns:repeat(${kt.size},1fr)">${cells}${ktRouteSVG(hint, kt.size)}</div>
      <div class="kt-actions">
        <button class="kt-action" onclick="requestActivityUndo()" ${state.actionHistory?.length ? '' : 'disabled'}><span aria-hidden="true">↶</span>되돌리기</button>
        <button class="kt-action kt-action--hint" onclick="knightTourHint()" aria-expanded="${!!kt.hintOpen}" aria-controls="kt-hint-panel" ${active ? '' : 'disabled'}><span aria-hidden="true">💡</span>${kt.hintOpen ? '힌트 닫기' : '힌트 보기'}</button>
        <button class="kt-action" onclick="ktRestart()"><span aria-hidden="true">↻</span>다시 하기</button>
      </div>
      ${kt.hintOpen ? `<div id="kt-hint-panel" class="kt-hint-panel"><div class="kt-hint-tabs" role="group" aria-label="힌트 종류"><button aria-pressed="${hint?.style === 'next'}" onclick="knightTourHint('next')">다음 한 수</button><button aria-pressed="${hint?.style === 'path'}" onclick="knightTourHint('path')">전체 경로</button></div><p class="mission-speech kt-hint-message" role="status">${kt.hintMessage || ''}</p></div>` : ''}
      <details class="kt-settings" ${kt.settingsOpen ? 'open' : ''} ontoggle="if(state.activeKind==='knight')state.kt.settingsOpen=this.open">
        <summary>게임 설정 <span>시작 위치 · 가족과 함께</span></summary>
        <div class="kt-settings-body">
          <fieldset class="kt-start-field"><legend>새 판의 시작 위치</legend><div>${[['corner', '모서리'], ['random', '무작위']].map(([mode, label]) => `<label class="kt-start-option"><input id="kt-start-${mode}" type="radio" name="kt-start" ${settings.randomStart === (mode === 'random') ? 'checked' : ''} onchange="ktSetStartMode('${mode}')"><span>${label}</span></label>`).join('')}</div><p>다음 새 판부터 적용해요. ‘다시 하기’는 같은 시작점으로 돌아가요.</p></fieldset>
          <button class="kt-new-game" onclick="ktRequestNewGame(${kt.levelIdx},'${kt.mode}')">설정대로 새 판 시작</button>
          <div class="kt-family-row"><label class="kt-alert-toggle"><span>가족과 번갈아 두기</span><input id="kt-family-play" type="checkbox" role="switch" ${kt.family ? 'checked' : ''} onchange="ktToggleFamily()"><span class="kt-switch-track" aria-hidden="true"></span></label></div>
          <button class="kt-share-game" onclick="offerKnightFamilyChallenge()">같은 판을 가족에게</button>
        </div>
      </details>
      ${kt.clear ? finishLinks(kt.mode === 'walk' ? `goKnightTour(${kt.levelIdx},'explore')` : kt.mode === 'explore' ? `goKnightTour(${kt.levelIdx},'tour')` : `goKnightTour(${kt.levelIdx},'tour')`, kt.mode === 'walk' ? '10칸 탐험하기' : kt.mode === 'explore' ? '모든 칸 도전하기' : '새 판 시작') : ''}
    </div>`;
  saveActiveSession();
}

function knightTourClick(r, c) {
  const kt = state.kt;
  if (state.animating || kt.clear || kt.stuck) return;
  if (!getKnightMoves(...kt.pos, kt.size, kt.board).some(([mr, mc]) => mr === r && mc === c)) {
    kt.notice = kt.board[r][c] ? '이미 간 칸이에요. 점이 있는 새 칸으로 뛰어요.' : '나이트는 두 칸, 옆으로 한 칸 뛰어요.';
    renderKnightTour();
    return;
  }
  rememberAction();
  const [pr, pc] = kt.pos;
  kt.notice = ''; kt.hint = null; kt.hintOpen = false; kt.hintMessage = '';
  kt.pos = [r, c]; kt.board[r][c] = true; kt.footprints[r + ',' + c] = kt.player;
  kt.visited++; kt.moveCount++; kt.analysis = null;
  if (kt.family) kt.player = 1 - kt.player;
  kt.clear = kt.mode === 'walk' ? r === kt.goal[0] && c === kt.goal[1] : kt.visited >= kt.visitGoal;
  if (kt.clear) {
    saveMiniGameStars(kt.mode === 'tour' ? 'knighttour' : 'knight-' + kt.mode, kt.levelIdx, 3);
    spawnParticles();
  } else if (!getKnightMoves(r, c, kt.size, kt.board).length) {
    kt.stuck = true;
    const percentage = kt.visited / kt.visitGoal;
    if (percentage >= .4) saveMiniGameStars(kt.mode === 'tour' ? 'knighttour' : 'knight-' + kt.mode, kt.levelIdx, percentage >= .8 ? 2 : 1);
  }
  saveActiveSession();
  animateMove(document.querySelector('#screen-mini .chess-board'), pr, pc, r, c, 'wN', renderKnightTour, kt.size);
}

function knightTourHint(style) {
  const kt = state.kt;
  if (state.animating || kt.clear || kt.stuck) return;
  if (!style && kt.hintOpen) {
    kt.hint = null; kt.hintOpen = false; kt.hintMessage = '';
    renderKnightTour();
    return;
  }
  const settings = getKnightTourSettings();
  style = style === 'next' || style === 'path' ? style : settings.hintStyle;
  settings.hintStyle = style;
  saveKnightTourSettings(settings);
  const result = knightGoalPath(kt);
  kt.hintOpen = true;
  if (result.path?.length > 1) {
    noteHelp(2);
    kt.hint = { style, path: result.path, at: kt.moveCount };
    kt.hintMessage = style === 'path' ? '번호 순서대로 움직이면 목표까지 갈 수 있어요.' : '표시된 한 칸으로 직접 뛰어봐요.';
  } else {
    kt.hint = null;
    kt.hintMessage = result.timeout ? '전체 길을 아직 찾지 못했어요. 되돌려 다른 길도 살펴볼까요?' : '여기서는 목표에 갈 수 없어요. 되돌려서 다른 길을 찾아요.';
  }
  renderKnightTour();
}

function offerKnightFamilyChallenge() {
  const kt = state.kt, spec = { levelIdx: kt.levelIdx, startPos: [...kt.startPos] };
  const target = activeProfile === 'adult' ? 'child' : 'adult';
  showChoice('지금 판을 저장하고, 같은 시작점에서 가족이 도전해요.', [
    { label: target === 'adult' ? '어른이 완주 도전' : '아이가 산책 도전', action: () => { switchProfile(target); goKnightTour(spec.levelIdx, target === 'adult' ? 'tour' : 'walk', spec); } },
    { label: '지금 판 계속하기', action: () => {} },
  ]);
}
