// 체스 수업: 직접 한 수 두고, 둔 수의 결과를 설명한다 (docs/lessons/LESSON_REDESIGN_V2.md)
// 판마다 목표 한 줄 → 내가 한 수 → (위험하면) 상대가 실제로 잡음 → 한 문장 설명 → 다시/다음.
// 좌표는 [row,col] = [8-rank, fileIndex]. 모든 판은 백(나) 차례, 캐슬링·앙파상 없음.
// 성공: 이동 뒤 흑의 합법 수 중 백 말(킹 제외)을 잡는 수가 없다. mustCapture 판은 잡는 수여야 한다.
// 범위는 '상대의 바로 다음 한 수'뿐이다. witness/trap은 검사·힌트용 예시이며 유일한 정답이 아니다.
const LESSON_CONTENT_VERSION = 3;
// 예전 수업 ID(v1: 보기·함께·혼자, v2: 수업당 5판). 예전 저장·파일에 남아 있으면 오류 대신 조용히 버린다.
const LESSON_RETIRED_IDS = ['protect-spot-v1', 'protect-escape-v1', 'protect-capture-v1', 'protect-escape-v2', 'protect-capture-v2', 'protect-all-v2'];
const LESSON_PIECE_VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };
const LESSON_PIECE_MOVES = {
  R: '가로·세로로 끝까지 와요', B: '대각선으로 끝까지 와요', Q: '가로·세로·대각선으로 끝까지 와요',
  N: 'L자로 뛰어 다른 말을 넘어와요', P: '앞쪽 대각선 한 칸을 잡아요', K: '바로 옆 칸을 잡아요',
};
// 판 배치는 scripts/generate-lesson-levels.cjs가 js/lesson-gen.js로 만든 js/lesson-levels.js(LESSON_LEVEL_DATA)에서 온다.
// 수업마다 5단계(LESSON_TIER_NAMES) × 3판. 단계는 새 개념이 나오는 순서, 단계 안은 난이도 점수 순서다.
// kind: 판정 방식(docs/lessons/LESSON_EXPANSION_V4.md §3). protect는 원래 세 수업의 판정(lessonOutcome), 나머지는 lrJudge.
const LESSON_UNITS = [
  { id: 'protect', title: '내 말 지키기' }, { id: 'value', title: '말의 가치' }, { id: 'check', title: '체크와 체크메이트' },
  { id: 'tactic', title: '전술' }, { id: 'special', title: '특별한 수' },
];
const LESSON_CATALOG = [
  { id: 'protect-escape-v3', version: 3, unit: 'protect', kind: 'protect', title: '공격받는 말 피하기',
    skill: '상대가 노리는 내 말을 잡히지 않는 칸으로 옮겨요',
    learned: '두기 전에 상대가 노리는 내 말이 있는지 봐요. 있으면 상대 말이 닿지 않는 칸으로 옮겨요.' },
  { id: 'protect-capture-v3', version: 3, unit: 'protect', kind: 'protect', title: '잡을 때도 조심하기',
    skill: '잡은 뒤에 상대가 내 말을 다시 잡을 수 있는지 살펴요',
    learned: '잡을 수 있는 말이 보여도 바로 잡지 말고, 그 칸을 상대가 지키는지 먼저 봐요.' },
  { id: 'protect-all-v3', version: 3, unit: 'protect', kind: 'protect', title: '내 말 모두 지키기',
    skill: '노려지는 내 말을 찾아 피하거나, 공격한 말을 잡아요',
    learned: '상대가 잡을 수 있는 내 말이 없게 두어요. 피하거나, 공격한 말을 잡을 수 있어요.' },
  { id: 'guard-v1', version: 1, unit: 'value', kind: 'guard', title: '다른 말로 지켜 주기',
    skill: '노려지는 말은 그대로 두고, 다른 말로 지켜 줘요',
    learned: '내 말이 노려지면 다른 말로 지켜 줄 수 있어요. 상대가 잡으면 내가 다시 잡아서 상대가 손해예요.' },
  { id: 'trade-v1', version: 1, unit: 'value', kind: 'trade', title: '이득 보는 잡기',
    skill: '말의 점수를 비교해 가장 이득인 잡기를 골라요',
    learned: '퀸 9, 룩 5, 비숍·나이트 3, 폰 1점이에요. 잡은 뒤 다시 잡혀도 내가 더 많이 얻으면 이득이에요.' },
  { id: 'check-v1', version: 1, unit: 'check', kind: 'check', title: '안전하게 체크하기',
    skill: '상대 킹을 공격하되, 체크한 말이 잡히지 않게 해요',
    learned: '체크는 상대 킹을 노리는 수예요. 체크하기 전에 그 칸을 상대가 지키는지 봐요.' },
  { id: 'escape-check-v1', version: 1, unit: 'check', kind: 'escape', title: '체크에서 벗어나기',
    skill: '킹이 피하거나, 사이를 막거나, 체크한 말을 잡아요',
    learned: '체크를 받으면 피하기·막기·잡기 세 가지 방법이 있어요. 그다음 잡힐 내 말이 없는지도 봐요.' },
  { id: 'mate-v1', version: 1, unit: 'check', kind: 'mate', title: '한 수 체크메이트',
    skill: '체크하면서 상대 킹이 피할 곳도 없게 해요',
    learned: '체크메이트는 체크이면서 킹이 피할 곳도, 막을 말도, 체크한 말을 잡을 방법도 없는 것이에요.' },
  { id: 'stop-mate-v1', version: 1, unit: 'check', kind: 'stopmate', title: '체크메이트 막기',
    skill: '상대가 노리는 체크메이트를 미리 막아요',
    learned: '두기 전에 상대가 다음 수에 체크메이트할 수 있는지 봐요. 그 칸을 지키거나, 킹이 도망갈 칸을 만들어요.' },
  { id: 'stalemate-v1', version: 1, unit: 'check', kind: 'stalemate', title: '스테일메이트 피하기',
    skill: '이기고 있을 때도 상대 킹이 움직일 곳을 남겨요',
    learned: '상대가 둘 곳이 없는데 체크가 아니면 비겨요(스테일메이트). 이기고 있을수록 상대 킹의 칸을 세어 봐요.' },
  { id: 'fork-v1', version: 1, unit: 'tactic', kind: 'tactic', shape: 'fork', title: '포크(양수겸장)',
    skill: '말 하나로 상대 말 두 개를 한꺼번에 노려요',
    learned: '한 말로 두 말을 함께 노리면 상대는 하나만 구할 수 있어요. 나이트와 퀸이 포크를 잘해요.' },
  { id: 'pin-v1', version: 1, unit: 'tactic', kind: 'tactic', shape: 'pin', title: '핀',
    skill: '긴 말로 상대 킹이나 퀸 앞의 말을 묶어요',
    learned: '킹 앞의 말을 긴 말(비숍·룩·퀸)로 노리면 그 말은 비킬 수 없어요. 묶인 말은 잡기 쉬워요.' },
  { id: 'skewer-v1', version: 1, unit: 'tactic', kind: 'tactic', shape: 'skewer', title: '꼬치 공격',
    skill: '앞의 비싼 말을 공격해, 비키면 뒤의 말을 잡아요',
    learned: '킹이나 퀸을 줄 위에서 공격하면, 비킨 뒤 뒤에 있던 말을 잡을 수 있어요.' },
  { id: 'discover-v1', version: 1, unit: 'tactic', kind: 'tactic', shape: 'discover', title: '발견 공격',
    skill: '내 말이 비키면서 뒤의 긴 말로 공격해요',
    learned: '긴 말 앞을 막은 내 말을 옮기면 공격이 두 개가 돼요. 상대는 둘 다 막기 어려워요.' },
  { id: 'promote-v1', version: 1, unit: 'special', kind: 'promote', title: '폰 승격',
    skill: '폰을 끝 줄까지 보내 안전하게 퀸으로 바꿔요',
    learned: '폰이 끝 줄에 닿으면 퀸이 돼요. 그 칸을 상대가 지키는지 먼저 봐요.' },
];
const LESSON_ORDER = LESSON_CATALOG.map(l => l.id);
// 저장 형식 v5(빌드 2026.11.07.x)까지 있던 수업. 그 밖의 수업·무한 연습·힌트 기록(helped)이 들어간 저장은 v6이다.
const LESSON_V5_IDS = ['protect-escape-v3', 'protect-capture-v3', 'protect-all-v3'];
const LESSONS = LESSON_CATALOG.filter(l => LESSON_LEVEL_DATA[l.id]).map((lesson, i) => ({ ...lesson, number: i + 1,
  levels: LESSON_LEVEL_DATA[lesson.id].map(level => ({ ...level, kind: lesson.kind, ...(lesson.shape ? { shape: lesson.shape } : {}) })) }));

function lessonById(id) { return typeof id === 'string' ? LESSONS.find(l => l.id === id) || null : null; }
function lessonLevelGame(level) { return ChessGame.fromFEN(level.fen); }
function lessonSquareName([r, c]) { return 'abcdefgh'[c] + (8 - r); }
function lessonPieceName(piece) { return piece ? t(PIECE_NAMES[piece[1]]) : ''; }
// 받침에 따라 조사를 고른다: lessonJosa('룩','이/가') → '룩이'
// 괄호로 끝나면 괄호 안 마지막 글자(예: '룩(5점)' → 점)를, 숫자로 끝나면 숫자 읽기(일·삼·육·칠·팔·영은 받침)를 따른다.
function lessonJosa(word, pair) {
  const core = word.replace(/[)\]\s]+$/, ''), last = core.at(-1) || '', code = last.charCodeAt(0), [withFinal, withoutFinal] = pair.split('/');
  const final = /\d/.test(last) ? '013678'.includes(last) : code >= 0xAC00 && code <= 0xD7A3 && (code - 0xAC00) % 28 > 0;
  return word + (final ? withFinal : withoutFinal);
}
function lessonCompareMoves(a, b) { for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; }
function lessonSameSquare(a, b) { return !!a && !!b && a[0] === b[0] && a[1] === b[1]; }

// color가 지금 둔다고 가정한 합법 잡기(상대 킹 제외). 복제본에서만 차례를 바꾸고 원본의 차례·기록은 건드리지 않는다.
function lessonCaptures(game, color) {
  const g = game.clone();
  g.turn = color; g.selected = null; g.validMoves = [];
  const moves = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (g.board[r][c]?.[0] !== color) continue;
    for (const [tr, tc] of g.legalMoves(r, c)) { const p = g.board[tr][tc]; if (p && p[0] !== color && p[1] !== 'K') moves.push([r, c, tr, tc]); }
  }
  return moves.sort(lessonCompareMoves);
}
// 지금 상대(흑)가 잡을 수 있는 내 말과 그 공격
function lessonThreats(game) { return lessonCaptures(game, 'b'); }
// 상대 말이 지금 차례라면 갈 수 있는 칸
function lessonReach(game, [r, c]) {
  const g = game.clone();
  g.turn = game.board[r][c]?.[0] || 'b'; g.selected = null; g.validMoves = [];
  return g.legalMoves(r, c);
}
function lessonMovesFrom(game, [r, c]) {
  if (game.turn !== 'w' || game.board[r]?.[c]?.[0] !== 'w') return [];
  return game.legalMoves(r, c).map(([tr, tc]) => [r, c, tr, tc]);
}
// 한 수의 결과. 위험하면 상대가 가장 값진 내 말을 잡는 수(같으면 좌표 사전순)를 교재 응수로 쓴다.
function lessonOutcome(game, move, level) {
  if (!lessonMovesFrom(game, move).some(m => m[2] === move[2] && m[3] === move[3])) return null;
  if (level.kind && level.kind !== 'protect') return lessonOutcomeKind(game, move, level);
  const captured = game.board[move[2]][move[3]], after = game.clone();
  if (after.move(move[0], move[1], move[2], move[3]) !== 'moved') return null;
  after.selected = null; after.validMoves = [];
  if (level.mustCapture && !captured) return { result: 'goal', after, captured: null, reply: null };
  const replies = lessonCaptures(after, 'b');
  // 체크 때문에만 안전한 경우: 상대 말이 내 말을 노리지만 왕부터 지켜야 해서 잡지 못한다.
  const checkSaved = after.status === 'check' && after.board.some((row, r) => row.some((p, c) => p && p[0] === 'w' && p[1] !== 'K' && after.isAttacked(after.board, r, c, 'b')));
  if (!replies.length) return { result: 'success', after, captured, reply: null, check: checkSaved };
  const value = m => LESSON_PIECE_VALUE[after.board[m[2]][m[3]][1]];
  const reply = replies.slice().sort((a, b) => value(b) - value(a) || lessonCompareMoves(a, b))[0];
  return { result: 'fail', after, captured, reply, victim: after.board[reply[2]][reply[3]] };
}
// 수업 4~15: 빠른 판 계산의 판정을 화면용 결과(둔 뒤의 게임 객체·응수·잡힌 말)로 바꾼다.
function lessonOutcomeKind(game, move, level) {
  const j = lrJudge(level, game.board, move); if (!j) return null;
  const captured = game.board[move[2]][move[3]], after = game.clone();
  if (after.move(move[0], move[1], move[2], move[3]) !== 'moved') return null;
  after.selected = null; after.validMoves = [];
  const reply = j.reply ? j.reply.slice(0, 4) : null;
  return { result: j.result, after, captured, reply, victim: reply ? after.board[reply[2]][reply[3]] : null, note: j.note ?? null };
}
function lessonSafeMoves(game, level) { return game.allMoves().filter(m => lessonOutcome(game, m, level)?.result === 'success'); }
// 내가 잡을 수 있는 상대 말 가운데, 잡으면 다시 잡히는 칸과 그 칸을 지키는 상대 말(힌트용)
function lessonDefended(game) {
  const out = [];
  for (const m of lessonCaptures(game, 'w')) {
    const after = game.clone(); after.move(m[0], m[1], m[2], m[3]);
    for (const d of lessonCaptures(after, 'b')) if (d[2] === m[2] && d[3] === m[3]) out.push(d);
  }
  return out;
}

// 둔 수에 대한 한 문장 설명. 무엇이 일어났는지와 왜 그런지(상대 말의 움직임)를 말한다.
function lessonExplain(level, start, move, out) {
  const name = p => lessonPieceName(p), mover = name(start.board[move[0]][move[1]]), captured = out.captured ? name(out.captured) : '';
  const threats = lessonThreats(start), attack = threats.find(m => m[2] === move[0] && m[3] === move[1]);
  const attackers = [...new Set(threats.filter(m => m[2] === move[0] && m[3] === move[1]).map(m => name(start.board[m[0]][m[1]])))];
  const attackerNames = attackers.map((n, i) => i < attackers.length - 1 ? lessonJosa(n, '과/와') : n).join(' ');
  if (out.result === 'goal') return '이번에는 상대 말을 하나 잡아야 해요. 테두리 칸이 잡을 수 있는 곳이에요.';
  if (out.result === 'success') {
    const tookAttacker = !!captured && threats.some(m => m[0] === move[2] && m[1] === move[3]);
    let text;
    if (tookAttacker) text = `나를 노리던 상대 ${lessonJosa(captured, '을/를')} 먼저 잡아서 위협을 없앴어요.`;
    else if (attack && captured) text = `${lessonJosa(captured, '을/를')} 잡으면서 내 ${mover}도 안전한 칸으로 피했어요.`;
    else if (captured) text = `${lessonJosa(captured, '을/를')} 잡았고, 상대는 내 말을 다시 잡을 수 없어요.`;
    else if (attack) text = `내 ${lessonJosa(mover, '이/가')} 상대 ${attackerNames}의 길에서 벗어났어요.`;
    else text = '이제 상대가 잡을 수 있는 내 말이 없어요.';
    return text + (out.check ? ' 체크라서 상대는 먼저 왕을 지켜야 해요.' : '');
  }
  const taker = out.after.board[out.reply[0]][out.reply[1]], takerName = name(taker), victim = name(out.victim);
  const victimMoved = out.reply[2] === move[2] && out.reply[3] === move[3];
  let text = captured && victimMoved ? `${lessonJosa(captured, '은/는')} 잡았지만 상대 ${lessonJosa(takerName, '이/가')} 내 ${lessonJosa(victim, '을/를')} 다시 잡았어요.`
    : `상대 ${lessonJosa(takerName, '이/가')} 내 ${lessonJosa(victim, '을/를')} 잡았어요.`;
  if (!victimMoved) text += threats.some(m => m[2] === out.reply[2] && m[3] === out.reply[3]) ? ` 처음부터 노려지던 ${lessonJosa(victim, '이에요/예요')}.` : ' 내 말이 움직이면서 길이 열렸어요.';
  return `${text} ${lessonJosa(takerName, '은/는')} ${LESSON_PIECE_MOVES[taker[1]]}.`;
}

// ===== 저장 상태 검증 =====
// 저장된 수업은 신뢰된 교재와 기록된 수로 다시 만든다. 파일 속 배치·문구를 그대로 믿지 않는다.
const LESSON_PHASES = ['choose', 'result', 'complete'];
function lessonMoveValid(m) { return Array.isArray(m) && m.length === 4 && m.every(n => Number.isInteger(n) && n >= 0 && n < 8); }
function lessonBoardKey(g) { return g.board.map(r => r.map(p => p || '--').join('')).join('/') + '/' + g.turn; }
function lessonGameDataValid(g) {
  return !!g && typeof g === 'object' && Array.isArray(g.board) && g.board.length === 8 && g.board.every(row => Array.isArray(row) && row.length === 8 && row.every(p => p === null || typeof p === 'string' && /^[wb][KQRBNP]$/.test(p))) && ['w', 'b'].includes(g.turn);
}
// 판 하나의 진행(처음 → 내 수 → 응수)을 신뢰된 시작 배치로 다시 만들고 저장 값과 비교한다.
function lessonReplay(level, v) {
  const start = lessonLevelGame(level);
  let game = start, result = null, reply = null;
  if (v.phase === 'choose' || v.phase === 'loading') { if (v.move !== null || v.reply !== null || v.result !== null) return null; }
  else {
    const out = v.move && lessonOutcome(start, v.move, level);
    if (!out) return null;
    result = out.result; reply = out.reply ? out.reply.slice() : null; game = out.after;
    if (reply) game.move(reply[0], reply[1], reply[2], reply[3]);
    if (v.result !== result || JSON.stringify(v.reply) !== JSON.stringify(reply)) return null;
  }
  if (v.phase !== 'loading' && lessonBoardKey(v.game) !== lessonBoardKey(game)) return null;
  game.selected = null; game.validMoves = [];
  return { game, result, reply };
}
const lessonCount = (n, max = 100000) => Number.isInteger(n) && n >= 0 && n <= max;
function lessonRebuild(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const lesson = lessonById(v.lessonId);
  if (!lesson || v.contentVersion !== LESSON_CONTENT_VERSION) return null;
  // 힌트는 v4부터 한 단계다. 예전 저장의 2단계(정답 화살표)는 1단계로 읽는다. fails(이 판에서 해본 횟수)는 v4에서 생겼다.
  if (!lessonCount(v.attempts) || !Number.isInteger(v.hintLevel) || v.hintLevel < 0 || v.hintLevel > 2 || typeof v.helpUsed !== 'boolean' || v.fails !== undefined && !lessonCount(v.fails)) return null;
  if (v.move !== null && !lessonMoveValid(v.move) || v.reply !== null && !lessonMoveValid(v.reply)) return null;
  const common = { lessonId: lesson.id, contentVersion: LESSON_CONTENT_VERSION, move: v.move ? v.move.slice() : null, hintLevel: Math.min(1, v.hintLevel), fails: v.fails || 0, helpUsed: v.helpUsed, attempts: v.attempts };
  if (v.mode === 'drill') return lessonRebuildDrill(v, lesson, common);
  if (v.mode !== undefined || !Number.isInteger(v.levelIndex) || !lesson.levels[v.levelIndex]) return null;
  const level = lesson.levels[v.levelIndex], n = lesson.levels.length;
  if (!LESSON_PHASES.includes(v.phase) || !lessonGameDataValid(v.game)) return null;
  if (!Array.isArray(v.solved) || v.solved.length !== n || !v.solved.every(x => typeof x === 'boolean')) return null;
  const replay = lessonReplay(level, v); if (!replay) return null;
  if (replay.result === 'success' && !v.solved[v.levelIndex]) return null;
  if (v.phase === 'complete' && (replay.result !== 'success' || v.levelIndex !== n - 1 || !v.solved.every(Boolean))) return null;
  return { ...common, levelIndex: v.levelIndex, phase: v.phase, game: replay.game, reply: replay.reply, result: replay.result, solved: v.solved.slice() };
}
// 무한 연습: 판 배치를 그 단계 검사기로 다시 확인한다(파일 속 목표 문구·정답은 저장하지 않고 다시 계산).
function lessonRebuildDrill(v, lesson, common) {
  if (!Number.isInteger(v.tier) || v.tier < 0 || v.tier > 4 || !Number.isInteger(v.seed) || v.seed < 1 || v.seed > 0xffffffff) return null;
  if (!['loading', 'choose', 'result'].includes(v.phase) || !lessonCount(v.streak) || !lessonCount(v.count) || typeof v.recorded !== 'boolean') return null;
  if (v.phase === 'loading') {
    if (v.fen !== null || v.game !== null || v.move !== null) return null;
    return { ...common, mode: 'drill', tier: v.tier, seed: v.seed, fen: null, phase: 'loading', game: null, reply: null, result: null, streak: v.streak, count: v.count, recorded: false };
  }
  if (!lessonGameDataValid(v.game)) return null;
  const level = lessonDrillLevel(lesson, v.tier, v.fen); if (!level) return null;
  // 무한 연습 판은 그 단계의 난이도 범위 안이어야 한다(판을 못 만들 때 대신 쓰는 그 단계의 교재 판은 예외).
  const band = LESSON_DRILL_BANDS[lesson.id]?.[v.tier], fixed = lesson.levels.some(lv => lv.tier === v.tier + 1 && lv.fen === level.fen);
  if (!fixed && band && (level.score < band[0] || level.score > band[1])) return null;
  const replay = lessonReplay(level, v); if (!replay) return null;
  return { ...common, mode: 'drill', tier: v.tier, seed: v.seed, fen: level.fen, phase: v.phase, game: replay.game, reply: replay.reply, result: replay.result, streak: v.streak, count: v.count, recorded: v.recorded };
}
function lessonProgressValid(all) {
  if (!all || typeof all !== 'object' || Array.isArray(all)) return false;
  return Object.entries(all).every(([id, p]) => {
    const lesson = lessonById(id);
    return !!lesson && !!p && typeof p === 'object' && p.version === 1 && ['completed', 'assisted', 'independent'].every(k => typeof p[k] === 'boolean') && (p.lastSceneId === null || lesson.levels.some(l => l.id === p.lastSceneId))
      && ['solved', 'helped'].every(k => p[k] === undefined || Array.isArray(p[k]) && p[k].length <= lesson.levels.length && new Set(p[k]).size === p[k].length && p[k].every(id => lesson.levels.some(l => l.id === id)))
      && !(p.helped || []).some(id => (p.solved || []).includes(id));
  });
}
// 무한 연습 기록: 수업별·단계별(5) 혼자 성공 수, 힌트 성공 수, 최고 연속
function lessonDrillValid(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d) || d.version !== 1 || !d.lessons || typeof d.lessons !== 'object' || Array.isArray(d.lessons) || Object.keys(d).length !== 2) return false;
  return Object.entries(d.lessons).every(([id, s]) => !!lessonById(id) && !!s && typeof s === 'object' && Object.keys(s).length === 3 && ['solved', 'helped', 'best'].every(k => Array.isArray(s[k]) && s[k].length === 5 && s[k].every(n => lessonCount(n, 1e7))));
}
// 예전(v1) 수업 자료는 오류로 막지 않고 버린다. 그 밖의 모르는 ID는 그대로 거절 대상이다.
function lessonRetired(id) { return LESSON_RETIRED_IDS.includes(id); }
function lessonRecordRetired(saved) {
  const v = saved?.snapshot?.values;
  return saved?.kind === 'lesson' && lessonRetired(v?.lesson?.lessonId) || saved?.kind === 'play' && v?.play?.content?.type === 'lessonPractice' && lessonRetired(v.play.content.lessonId);
}
