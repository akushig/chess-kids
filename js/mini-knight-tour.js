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
  ktConfirmReplace(() => goKnightTour(levelIdx, mode, shared), sameBoard);
}
// Replacing a board with moves on it is always confirmed once.
function ktConfirmReplace(start, sameBoard = false) {
  if (state.kt?.moveCount > 0 && !state.kt.clear) {
    showChoice(sameBoard ? '같은 시작점에서 다시 해볼까요?' : '지금 판을 마치고 새 판을 시작할까요?', [
      { label: sameBoard ? '같은 판 다시 하기' : '새 판 시작', action: start },
      { label: '이어서 하기', action: () => {} },
    ]);
  } else start();
}

function ktRestart() {
  const kt = state.kt;
  if (kt.mode === 'puzzle') return ktConfirmReplace(() => goKnightPuzzle(kt.puzzle.id, { family: kt.family }), true);
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

// ===== One landing rule for moves, completion, hints and branch checks (docs/KNIGHT_RULE_PUZZLES.md) =====
// A missing square is not a wall: the knight jumps over it but cannot land on it.
// Visited squares stay in kt.board; missing squares stay in kt.puzzle.blocked. Only the solver input merges them.
function ktIsBlocked(kt, r, c) { return !!kt.puzzle?.blocked.some(([br, bc]) => br === r && bc === c); }
function ktMarkIndex(kt, r, c) { return kt.puzzle ? kt.puzzle.marks.findIndex(([mr, mc]) => mr === r && mc === c) : -1; }
function ktNextMark(kt) {
  const marks = kt.puzzle?.marks || [];
  let k = 0;
  while (k < marks.length && kt.board[marks[k][0]][marks[k][1]]) k++;
  return k;
}
function ktMoves(kt) {
  const next = ktNextMark(kt);
  return getKnightMoves(...kt.pos, kt.size, kt.board).filter(([r, c]) => {
    if (ktIsBlocked(kt, r, c)) return false;
    const k = ktMarkIndex(kt, r, c);
    return k < 0 || k === next;
  });
}
function ktSolverBoard(kt) { return kt.puzzle ? kt.board.map((row, r) => row.map((v, c) => v || ktIsBlocked(kt, r, c))) : kt.board; }
const KT_MARK_LABELS = ['①', '②', '③', '④', '⑤', '⑥'];
function ktIllegalReason(kt, r, c) {
  if (ktIsBlocked(kt, r, c)) return '이 칸은 판에 없어요. 나이트는 뛰어넘을 수 있지만 이 칸에 설 수는 없어요.';
  if (kt.board[r][c]) return '이미 간 칸이에요. 점이 있는 새 칸으로 뛰어요.';
  const jump = KNIGHT_DELTAS.some(([dr, dc]) => kt.pos[0] + dr === r && kt.pos[1] + dc === c), k = ktMarkIndex(kt, r, c), next = ktNextMark(kt);
  if (jump && k > next) return `${KT_MARK_LABELS[k]} 표식은 ${KT_MARK_LABELS[k - 1]} 표식 다음에 밟아요. 지금은 ${KT_MARK_LABELS[next]} 차례예요.`;
  return '나이트는 두 칸, 옆으로 한 칸 뛰어요.';
}

// All modes use the same alert control, evaluated against their own goal.
// An exhausted search is unknown, never proof that a move is fatal.
function ktAnalyze(kt) {
  if (kt.analysis?.at === kt.moveCount && Array.isArray(kt.analysis.unknown)) return kt.analysis;
  const result = { at: kt.moveCount, fatal: [], viable: [], unknown: [], safe: 0 };
  for (const next of ktMoves(kt)) {
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

// Back returns to where the knight was opened: home (primary entry) or the playground.
function ktBackButton() {
  return state.miniOrigin === 'home'
    ? '<button class="back-btn" onclick="showScreen(\'home\');renderHome()">← 홈</button>'
    : '<button class="back-btn" onclick="goMiniMenu()">← 놀이터</button>';
}

// Menu entry resumes the saved board; new learners start with a short walk.
function goKnightSetup() { enterActivity('knight'); }

function goKnightTour(levelIdx, mode = 'tour', shared = null) {
  beginActivity('knight', { levelIdx, mode });
  const settings = getKnightTourSettings();
  if (levelIdx == null) levelIdx = settings.levelIdx;
  if (mode !== 'tour' && !shared) levelIdx = 0;
  if (mode === 'tour') {
    settings.levelIdx = levelIdx;
    saveKnightTourSettings(settings);
  }
  writeData('knight_last_mode',mode);
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

// ===== Rule puzzles: fixed boards with missing squares or ordered marks =====
function ktPuzzleSpec(kt) { return KNIGHT_PUZZLES.find(p => p.id === kt?.puzzle?.id && p.version === kt.puzzle.version) || null; }
function goKnightPuzzle(id, shared = null) {
  const spec = KNIGHT_PUZZLES.find(p => p.id === id);
  if (!spec) return goKnightPuzzles();
  beginActivity('knight', { mode: 'puzzle', id: spec.id, version: spec.version, set: KNIGHT_PUZZLE_SET_VERSION });
  const size = spec.size, start = [...spec.start], total = size * size - spec.blocked.length;
  state.kt = {
    levelIdx: Math.max(0, KNIGHT_TOUR_LEVELS.findIndex(level => level.size === size)), size, mode: 'puzzle', startPos: start, pos: start,
    puzzle: { id: spec.id, version: spec.version, rule: spec.rule, blocked: copyData(spec.blocked), marks: copyData(spec.marks) },
    board: Array.from({ length: size }, () => Array(size).fill(false)),
    visited: 1, total, visitGoal: total, stuck: false, clear: false, doomed: false,
    analysis: null, moveCount: 0, notice: '', goal: null,
    family: !!shared?.family, jointUsed: !!shared?.family, player: 0,
    footprints: { [start.join(',')]: 0 },
    hint: null, hintOpen: false, hintMessage: '', settingsOpen: false,
  };
  state.kt.board[start[0]][start[1]] = true;
  showScreen('mini');
  renderKnightTour();
}
// A saved or imported rule board must match the catalogue and be internally consistent.
function ktPuzzleStateValid(kt) {
  const spec = ktPuzzleSpec(kt), coord = p => Array.isArray(p) && p.length === 2 && p.every(n => Number.isInteger(n) && n >= 0 && n < kt.size);
  if (!spec || kt.mode !== 'puzzle' || kt.size !== spec.size || kt.puzzle.rule !== spec.rule) return false;
  if (JSON.stringify(kt.puzzle.blocked) !== JSON.stringify(spec.blocked) || JSON.stringify(kt.puzzle.marks) !== JSON.stringify(spec.marks)) return false;
  const b = kt.board;
  if (!Array.isArray(b) || b.length !== spec.size || b.some(row => !Array.isArray(row) || row.length !== spec.size || row.some(v => typeof v !== 'boolean'))) return false;
  if (spec.blocked.some(([r, c]) => b[r][c]) || !b[spec.start[0]][spec.start[1]]) return false;
  if (!coord(kt.pos) || !b[kt.pos[0]][kt.pos[1]] || !Array.isArray(kt.startPos) || kt.startPos.join() !== spec.start.join()) return false;
  const total = spec.size * spec.size - spec.blocked.length;
  if (kt.visited !== b.flat().filter(Boolean).length || kt.visitGoal !== total || !Number.isInteger(kt.moveCount) || kt.moveCount !== kt.visited - 1) return false;
  const passed = spec.marks.map(([r, c]) => b[r][c]);
  if (passed.some((v, i) => v && passed.slice(0, i).some(x => !x))) return false;
  kt.puzzle = { id: spec.id, version: spec.version, rule: spec.rule, blocked: copyData(spec.blocked), marks: copyData(spec.marks) };
  kt.total = total;
  return true;
}
function ktNextPuzzle(id) { const i = KNIGHT_PUZZLES.findIndex(p => p.id === id); return KNIGHT_PUZZLES[i + 1] || null; }
function knightSavedDetail(kt) {
  if (kt.mode === 'puzzle') return `규칙 문제 · ${ktPuzzleSpec(kt)?.title || ''} · ${kt.moveCount}번 점프`;
  return `${KNIGHT_MODE_NAMES[kt.mode]} · ${kt.size}×${kt.size} · ${kt.moveCount}번 점프`;
}
// Same rule as the knight screen: only a board with moves on it needs a replacement confirmation.
function openKnightPuzzle(id) {
  const saved = activitySaved('knight'), kt = saved && !saved.complete ? saved.snapshot.values.kt : null;
  if (kt?.puzzle?.id === id) return resumeActivity('knight');
  if (kt?.moveCount > 0) return requestNewActivity('knight', () => goKnightPuzzle(id));
  goKnightPuzzle(id);
}
// Choosing a board is safe; the saved board is replaced only after the usual confirmation.
function goKnightPuzzles() { leaveActivity(); showScreen('mini'); renderKnightPuzzles(); }
function ktPuzzlePreview(p) {
  const marks = new Map(p.marks.map(([r, c], k) => [r + ',' + c, KT_MARK_LABELS[k]]));
  let cells = '';
  for (let r = 0; r < p.size; r++) for (let c = 0; c < p.size; c++) {
    const key = r + ',' + c, hole = p.blocked.some(([br, bc]) => br === r && bc === c), start = p.start[0] === r && p.start[1] === c;
    cells += `<span class="${hole ? 'kp-hole' : (r + c) % 2 ? 'kp-dark' : 'kp-light'}">${start ? '♞' : marks.get(key) || ''}</span>`;
  }
  return `<span class="kp-preview" aria-hidden="true" style="grid-template-columns:repeat(${p.size},1fr)">${cells}</span>`;
}
function renderKnightPuzzles() {
  const saved = activitySaved('knight'), current = saved && !saved.complete && saved.snapshot.values.kt.mode === 'puzzle' ? saved.snapshot.values.kt : null;
  const done = progressLedger().completions || {};
  const groups = Object.entries(KNIGHT_PUZZLE_RULES).map(([rule, name]) => {
    const list = KNIGHT_PUZZLES.filter(p => p.rule === rule);
    return `<section class="activity-group kp-group"><h3>${name}</h3><p class="section-note">${rule === 'shape' ? '빗금 칸은 판에 없는 칸이에요. 그 칸에는 설 수 없지만 뛰어넘을 수 있어요.' : '번호 표식은 ①부터 차례대로만 밟을 수 있어요.'}</p><div class="kp-list">${list.map((p, i) => {
      const status = current?.puzzle.id === p.id ? '▶ 하던 판' : done[p.id] ? '✓ 완료' : '';
      return `<button class="kp-card" onclick="openKnightPuzzle('${p.id}')">${ktPuzzlePreview(p)}<span class="kp-text"><strong>${i + 1}. ${p.title}</strong><small>${KNIGHT_PUZZLE_STAGES[p.stage]} · ${p.size}×${p.size} · ${p.size * p.size - p.blocked.length}칸${p.marks.length ? ' · 표식 ' + p.marks.length + '개' : ''}</small>${status ? `<b class="kp-status">${status}</b>` : ''}</span></button>`;
    }).join('')}</div></section>`;
  }).join('');
  document.getElementById('screen-mini').innerHTML = `<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="enterActivity('knight')">← 나이트 투어</button><h2>규칙 문제</h2></div><p class="section-note">새 규칙이 있는 판 10개예요. 되돌리기·힌트·갈림길 알림을 그대로 쓸 수 있어요.</p>${current ? `<div class="saved-activity"><button class="action-btn green" onclick="resumeActivity('knight')">▶ 하던 규칙 문제 이어하기 · ${ktPuzzleSpec(current)?.title || ''} · ${current.moveCount}번 점프</button></div>` : ''}${groups}</div>`;
}

function knightGoalPath(kt = state.kt) {
  if (kt.mode === 'tour' || kt.mode === 'puzzle') return ktFindPath(ktSolverBoard(kt), kt.size, kt.pos, KT_NODE_LIMIT, kt.puzzle?.marks);
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
  if (analysis && !analysis.safe && !analysis.unknown.length) return { tone: 'blocked', icon: '↶', title: kt.mode === 'tour' || kt.mode === 'puzzle' ? '이 길에서는 완주할 수 없어요' : '이 길에서는 목표에 갈 수 없어요', detail: '되돌려서 다른 길을 선택할 수 있어요.' };
  if (analysis?.fatal.length) return { tone: 'branch', icon: '⑂', title: '갈림길이에요!', detail: kt.notice || (kt.mode === 'tour' || kt.mode === 'puzzle' ? '끝까지 이어지지 않는 길이 있어요. 신중하게 골라봐요.' : '목표까지 이어지지 않는 길이 있어요. 다른 길도 살펴봐요.') };
  const puzzleGoal = kt.puzzle?.rule === 'order' ? '번호 순서대로 표식을 지나며 모든 칸을 방문해요.' : '없는 칸을 빼고 모든 칸을 한 번씩 방문해요.';
  return { tone: 'calm', icon: '♞', title: kt.notice || (kt.mode === 'walk' ? '나이트로 뛰어서 깃발을 찾아요.' : kt.mode === 'explore' ? '서로 다른 10칸을 찾아가요.' : kt.mode === 'puzzle' ? puzzleGoal : '모든 칸을 한 번씩 방문해요.'), detail: kt.mode === 'puzzle' && !kt.notice ? ktPuzzleSpec(kt)?.intent || '' : '' };
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
  const moves = kt.clear || kt.stuck ? [] : ktMoves(kt);
  const nextMark = ktNextMark(kt), puzzle = kt.mode === 'puzzle' ? ktPuzzleSpec(kt) : null;
  const analysis = settings.branchWarn && !kt.clear && !kt.stuck ? ktAnalyze(kt) : null;
  const status = ktStatus(kt, analysis);
  const hint = kt.hint?.at === kt.moveCount ? kt.hint : null;
  const path = hint ? hint.style === 'next' ? hint.path.slice(0, 2) : hint.path : [];
  const steps = new Map(path.slice(1).map(([r, c], i) => [r + ',' + c, i + 1]));
  let cells = '';
  for (let r = 0; r < kt.size; r++) for (let c = 0; c < kt.size; c++) {
    const key = r + ',' + c;
    let cls = 'board-cell ' + ((r + c) % 2 ? 'dark' : 'light'), content = '', note = '';
    const mark = ktMarkIndex(kt, r, c);
    if (ktIsBlocked(kt, r, c)) { cls += ' kt-hole'; note = '판에 없는 칸'; }
    else if (r === kt.pos[0] && c === kt.pos[1]) { cls += ' selected'; content = getPieceSVG('wN', 36); note = '나이트가 있는 칸'; }
    else if (kt.board[r][c]) {
      cls += ' kt-visited'; note = '이미 간 칸';
      content = `<span class="kt-check ${kt.footprints?.[key] === 1 ? 'parent-step' : ''}">${kt.footprints?.[key] === 1 ? '◆' : '✓'}</span>`;
    } else if (kt.goal?.[0] === r && kt.goal?.[1] === c) { cls += ' goal-cell'; content = '🚩'; }
    if (mark >= 0) {
      const state_ = mark < nextMark ? 'passed' : mark === nextMark ? 'next' : 'later';
      cls += ' kt-mark kt-mark--' + state_;
      if (!(r === kt.pos[0] && c === kt.pos[1])) content = `<span class="kt-mark-badge">${KT_MARK_LABELS[mark]}</span>`;
      note = `표식 ${mark + 1}번${state_ === 'passed' ? ' 지남' : state_ === 'next' ? ' 다음 차례' : ''}`;
    }
    if (moves.some(([mr, mc]) => mr === r && mc === c)) cls += ' move-hint';
    if (steps.has(key)) { cls += ' kt-route-cell'; content += `<span class="kt-route-number">${steps.get(key)}</span>`; }
    cells += `<div class="${cls}"${note ? ` data-note="${note}"` : ''} onclick="knightTourClick(${r},${c})">${content}</div>`;
  }
  const subtitle = puzzle ? KNIGHT_PUZZLE_RULES[puzzle.rule] + ' ' + (KNIGHT_PUZZLES.filter(p => p.rule === puzzle.rule).indexOf(puzzle) + 1) + '/5' : { walk: '깃발까지 짧은 산책', explore: '10칸 탐험', tour: '모든 칸 방문' }[kt.mode];
  const marksLeft = kt.puzzle?.marks.length ? (nextMark < kt.puzzle.marks.length ? ` · 다음 표식 <b class="kt-next-mark">${KT_MARK_LABELS[nextMark]}</b>` : ' · 표식 모두 지남') : '';
  const progress = kt.mode === 'walk' ? '🚩 깃발 찾기' : `<strong>${kt.visited}</strong><span> / ${kt.visitGoal}칸 방문${marksLeft}</span>`;
  const next = puzzle && ktNextPuzzle(puzzle.id);
  const finish = puzzle ? finishLinks(next ? `openKnightPuzzle('${next.id}')` : 'goKnightPuzzles()', next ? '다음 문제' : '문제 고르기', next ? '<button class="text-button" onclick="goKnightPuzzles()">규칙 문제 고르기</button>' : '')
    : finishLinks(kt.mode === 'walk' ? `goKnightTour(${kt.levelIdx},'explore')` : kt.mode === 'explore' ? `goKnightTour(${kt.levelIdx},'tour')` : `goKnightTour(${kt.levelIdx},'tour')`, kt.mode === 'walk' ? '10칸 탐험하기' : kt.mode === 'explore' ? '모든 칸 도전하기' : '새 판 시작');
  const active = !kt.clear && !kt.stuck;
  renderGameScreen('screen-mini', `
    <div class="screen-wrap kt-screen">
      <div class="screen-header kt-header">${ktBackButton()}<h2>나이트 투어</h2><span class="kt-subtitle">${subtitle}</span></div>
      <div class="kt-mode-nav" role="group" aria-label="탐험 목표">${[['walk', '산책'], ['explore', '탐험'], ['tour', '투어'], ['puzzle', '규칙 문제']].map(([mode, label]) => `<button aria-pressed="${kt.mode === mode}" onclick="${mode === 'puzzle' ? 'goKnightPuzzles()' : `ktSelectMode('${mode}')`}">${label}</button>`).join('')}</div>
      <div class="kt-toolbar">
        ${puzzle ? `<span class="kt-board-size">${puzzle.title} · ${kt.size}×${kt.size}</span>` : kt.mode === 'tour' ? `<div class="kt-size-picker" role="group" aria-label="보드 크기">${KNIGHT_TOUR_LEVELS.map((level, i) => `<button aria-label="${level.label} 판" aria-pressed="${i === kt.levelIdx}" onclick="ktSelectSize(${i})">${level.label}</button>`).join('')}</div>` : '<span class="kt-board-size">' + kt.size + '×' + kt.size + ' 판</span>'}
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
        <summary>게임 설정 <span>${puzzle ? '가족과 함께' : '시작 위치 · 가족과 함께'}</span></summary>
        <div class="kt-settings-body">
          ${puzzle ? '<p class="kt-puzzle-note">규칙 문제는 시작 칸이 정해져 있어요. ‘다시 하기’는 같은 판의 처음으로 돌아가요.</p>' : `<fieldset class="kt-start-field"><legend>새 판의 시작 위치</legend><div>${[['corner', '모서리'], ['random', '무작위']].map(([mode, label]) => `<label class="kt-start-option"><input id="kt-start-${mode}" type="radio" name="kt-start" ${settings.randomStart === (mode === 'random') ? 'checked' : ''} onchange="ktSetStartMode('${mode}')"><span>${label}</span></label>`).join('')}</div><p>다음 새 판부터 적용해요. ‘다시 하기’는 같은 시작점으로 돌아가요.</p></fieldset>
          <button class="kt-new-game" onclick="ktRequestNewGame(${kt.levelIdx},'${kt.mode}')">설정대로 새 판 시작</button>`}
          <div class="kt-family-row"><label class="kt-alert-toggle"><span>가족과 번갈아 두기</span><input id="kt-family-play" type="checkbox" role="switch" ${kt.family ? 'checked' : ''} onchange="ktToggleFamily()"><span class="kt-switch-track" aria-hidden="true"></span></label></div>
          <button class="kt-share-game" onclick="offerKnightFamilyChallenge()">같은 판을 가족에게</button>
        </div>
      </details>
      ${kt.clear ? finish : ''}
    </div>`);
  saveActiveSession();
}

function knightTourClick(r, c) {
  const kt = state.kt;
  if (state.animating || kt.clear || kt.stuck) return;
  if (!ktMoves(kt).some(([mr, mc]) => mr === r && mc === c)) {
    kt.notice = ktIllegalReason(kt, r, c);
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
  const award = (stars, completed = true) => kt.mode === 'puzzle' ? awardStars('mini', kt.puzzle.id, stars, completed) : saveMiniGameStars(kt.mode === 'tour' ? 'knighttour' : 'knight-' + kt.mode, kt.levelIdx, stars);
  if (kt.clear) {
    award(3);
    spawnParticles();
  } else if (!ktMoves(kt).length) {
    kt.stuck = true;
    const percentage = kt.visited / kt.visitGoal;
    if (percentage >= .4) award(percentage >= .8 ? 2 : 1, false);
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

function offerKnightFamilyChallenge(){
  const kt=state.kt,spec={levelIdx:kt.levelIdx,mode:kt.mode,startPos:[...kt.startPos],puzzleId:kt.puzzle?.id};
  const launch=id=>{switchProfile(id);requestNewActivity('knight',()=>spec.puzzleId?goKnightPuzzle(spec.puzzleId):goKnightTour(spec.levelIdx,spec.mode,spec));};
  const others=allProfiles().filter(p=>p.id!==activeProfile);
  showChoice('같은 시작점과 목표로 도전할 프로필을 골라요.',[
    ...others.map(p=>({label:p.icon+' '+p.name,action:()=>launch(p.id)})),
    {label:'새 프로필 추가',action:()=>openProfileEditor(null,p=>launch(p.id))},
    {label:'현재 프로필에서 번갈아 하기',action:()=>{if(!state.kt.family)ktToggleFamily();}},
    {label:'지금 판 계속하기',action:()=>{}},
  ]);
}
