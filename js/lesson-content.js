// 체스 수업 v2: 직접 한 수 두고, 둔 수의 결과를 설명한다 (docs/lessons/LESSON_REDESIGN_V2.md)
// 판마다 목표 한 줄 → 내가 한 수 → (위험하면) 상대가 실제로 잡음 → 한 문장 설명 → 다시/다음.
// 좌표는 [row,col] = [8-rank, fileIndex]. 모든 판은 백(나) 차례, 캐슬링·앙파상 없음.
// 성공: 이동 뒤 흑의 합법 수 중 백 말(킹 제외)을 잡는 수가 없다. mustCapture 판은 잡는 수여야 한다.
// 범위는 '상대의 바로 다음 한 수'뿐이다. witness/trap은 검사·힌트용 예시이며 유일한 정답이 아니다.
const LESSON_CONTENT_VERSION = 2;
// v1(보기·함께·혼자 구조) 수업 ID. 예전 저장·파일에 남아 있으면 오류 대신 조용히 버린다.
const LESSON_RETIRED_IDS = ['protect-spot-v1', 'protect-escape-v1', 'protect-capture-v1'];
const LESSON_PIECE_VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };
const LESSON_PIECE_MOVES = {
  R: '가로·세로로 끝까지 와요', B: '대각선으로 끝까지 와요', Q: '가로·세로·대각선으로 끝까지 와요',
  N: 'L자로 뛰어 다른 말을 넘어와요', P: '앞쪽 대각선 한 칸을 잡아요', K: '바로 옆 칸을 잡아요',
};
const LESSONS = [
  {
    id: 'protect-escape-v2', version: 2, number: 1, title: '공격받는 말 피하기',
    skill: '상대가 노리는 내 말을 잡히지 않는 칸으로 옮겨요',
    learned: '두기 전에 상대가 노리는 내 말이 있는지 봐요. 있으면 상대 말이 닿지 않는 칸으로 옮겨요.',
    levels: [
      { id: 'escape-1', fen: '7k/6b1/8/8/3R4/8/K7/8 w - - 0 1', showThreat: true, goal: '상대 비숍이 내 룩을 노려요(빨간 화살표). 룩을 피해요.', witness: [4, 3, 3, 3], trap: [6, 0, 5, 0] },
      { id: 'escape-2', fen: 'k6r/8/8/8/8/7B/8/3K4 w - - 0 1', goal: '상대 룩이 내 비숍을 노려요. 안전한 칸으로 피해요.', witness: [5, 7, 4, 6], trap: [5, 7, 0, 2] },
      { id: 'escape-3', fen: 'k7/8/2n5/4R3/8/8/8/7K w - - 0 1', goal: '상대 나이트가 내 룩을 노려요. 나이트를 피해요.', witness: [3, 4, 2, 4], trap: [3, 4, 1, 4] },
      { id: 'escape-4', fen: '4r3/1p6/1b4k1/8/3N4/7r/8/K7 w - - 0 1', goal: '내 나이트가 공격받아요. 안전한 칸은 몇 개 없어요.', witness: [4, 3, 3, 1], trap: [4, 3, 2, 4] },
      { id: 'escape-5', fen: '7k/8/8/4b3/8/3B1N2/1R6/7K w - - 0 1', goal: '내 말 하나가 공격받아요. 어떤 말인지 찾아 지켜요.', witness: [6, 1, 4, 1], trap: [5, 3, 4, 4] },
    ],
  },
  {
    id: 'protect-capture-v2', version: 2, number: 2, title: '잡을 때도 조심하기',
    skill: '잡은 뒤에 상대가 내 말을 다시 잡을 수 있는지 살펴요',
    learned: '잡을 수 있는 말이 보여도 바로 잡지 말고, 그 칸을 상대가 지키는지 먼저 봐요.',
    levels: [
      { id: 'capture-1', fen: '7k/1b6/8/8/4p3/8/4R2p/K7 w - - 0 1', mustCapture: true, showThreat: true, goal: '폰 하나를 잡아요. 빨간 화살표는 그 폰을 지키는 말이에요.', witness: [6, 4, 6, 7], trap: [6, 4, 4, 4] },
      { id: 'capture-2', fen: 'k7/6b1/8/8/3p4/8/p2R4/7K w - - 0 1', mustCapture: true, goal: '폰 하나를 잡아요. 잡은 뒤에도 룩이 안전하게!', witness: [6, 3, 6, 0], trap: [6, 3, 4, 3] },
      { id: 'capture-3', fen: '6k1/2p2p2/8/1N6/8/1B6/8/7K w - - 0 1', mustCapture: true, goal: '폰 하나를 잡아요. 상대 킹도 바로 옆 칸을 지켜요.', witness: [3, 1, 1, 2], trap: [5, 1, 1, 5] },
      { id: 'capture-4', fen: '7k/4p3/3n4/6p1/8/5N2/8/K2R4 w - - 0 1', mustCapture: true, goal: '상대 말 하나를 잡아요. 큰 말이 늘 좋은 건 아니에요.', witness: [5, 5, 3, 6], trap: [7, 3, 2, 3] },
      { id: 'capture-5', fen: '6k1/8/2n4p/8/1b6/8/3Q4/K7 w - - 0 1', mustCapture: true, goal: '내 퀸이 공격받아요! 상대 말을 잡으면서 피해요.', witness: [6, 3, 2, 7], trap: [6, 3, 4, 1] },
    ],
  },
  {
    id: 'protect-all-v2', version: 2, number: 3, title: '내 말 모두 지키기',
    skill: '노려지는 내 말을 찾아 피하거나, 공격한 말을 잡아요',
    learned: '상대가 잡을 수 있는 내 말이 없게 두어요. 피하거나, 공격한 말을 잡을 수 있어요.',
    levels: [
      { id: 'all-1', fen: '6k1/2p5/3p4/4N3/1B6/8/8/7K w - - 0 1', goal: '상대 폰이 내 나이트를 노려요. 폰은 대각선으로 잡아요.', witness: [3, 4, 2, 2], trap: [4, 1, 2, 3] },
      { id: 'all-2', fen: '6k1/8/2n5/4p3/3Q4/8/8/6K1 w - - 0 1', goal: '작은 폰이 내 퀸을 노려요! 퀸을 안전한 칸으로.', witness: [4, 3, 5, 2], trap: [4, 3, 3, 4] },
      { id: 'all-3', fen: '8/5pk1/8/1R3B2/3n4/4P3/8/K7 w - - 0 1', goal: '나이트가 내 말 두 개를 노려요. 둘 다 지킬 방법은?', witness: [5, 4, 4, 3], trap: [3, 1, 0, 1] },
      { id: 'all-4', fen: '6k1/8/8/8/5p2/4n3/8/2BR2K1 w - - 0 1', goal: '내 말 하나가 공격받아요. 찾아서 지켜요.', witness: [7, 3, 4, 3], trap: [7, 2, 5, 4] },
      { id: 'all-5', fen: 'r5k1/5ppp/8/8/1b6/2N5/5PPP/3R2K1 w - - 0 1', goal: '실전처럼 말이 많아요. 잡힐 수 있는 내 말이 없게!', witness: [5, 2, 4, 4], trap: [5, 2, 4, 0] },
    ],
  },
];

function lessonById(id) { return typeof id === 'string' ? LESSONS.find(l => l.id === id) || null : null; }
function lessonLevelGame(level) { return ChessGame.fromFEN(level.fen); }
function lessonSquareName([r, c]) { return 'abcdefgh'[c] + (8 - r); }
function lessonPieceName(piece) { return piece ? t(PIECE_NAMES[piece[1]]) : ''; }
// 받침에 따라 조사를 고른다: lessonJosa('룩','이/가') → '룩이'
function lessonJosa(word, pair) {
  const code = word.charCodeAt(word.length - 1), [withFinal, withoutFinal] = pair.split('/');
  return word + (code >= 0xAC00 && code <= 0xD7A3 && (code - 0xAC00) % 28 ? withFinal : withoutFinal);
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
function lessonRebuild(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const lesson = lessonById(v.lessonId);
  if (!lesson || v.contentVersion !== LESSON_CONTENT_VERSION || !Number.isInteger(v.levelIndex) || !lesson.levels[v.levelIndex]) return null;
  const level = lesson.levels[v.levelIndex], n = lesson.levels.length;
  if (!LESSON_PHASES.includes(v.phase) || !lessonGameDataValid(v.game)) return null;
  if (!Number.isInteger(v.attempts) || v.attempts < 0 || v.attempts > 100000 || !Number.isInteger(v.hintLevel) || v.hintLevel < 0 || v.hintLevel > 2 || typeof v.helpUsed !== 'boolean') return null;
  if (!Array.isArray(v.solved) || v.solved.length !== n || !v.solved.every(x => typeof x === 'boolean')) return null;
  if (v.move !== null && !lessonMoveValid(v.move) || v.reply !== null && !lessonMoveValid(v.reply)) return null;
  const start = lessonLevelGame(level);
  let game = start, result = null, reply = null;
  if (v.phase === 'choose') { if (v.move !== null || v.reply !== null || v.result !== null) return null; }
  else {
    const out = v.move && lessonOutcome(start, v.move, level);
    if (!out) return null;
    result = out.result; reply = out.reply ? out.reply.slice() : null; game = out.after;
    if (reply) game.move(reply[0], reply[1], reply[2], reply[3]);
    if (v.result !== result || JSON.stringify(v.reply) !== JSON.stringify(reply)) return null;
    if (result === 'success' && !v.solved[v.levelIndex]) return null;
    if (v.phase === 'complete' && (result !== 'success' || v.levelIndex !== n - 1 || !v.solved.every(Boolean))) return null;
  }
  if (lessonBoardKey(v.game) !== lessonBoardKey(game)) return null;
  game.selected = null; game.validMoves = [];
  return { lessonId: lesson.id, contentVersion: LESSON_CONTENT_VERSION, levelIndex: v.levelIndex, phase: v.phase, game, move: v.move ? v.move.slice() : null, reply, result,
    hintLevel: v.hintLevel, helpUsed: v.helpUsed, solved: v.solved.slice(), attempts: v.attempts };
}
function lessonProgressValid(all) {
  if (!all || typeof all !== 'object' || Array.isArray(all)) return false;
  return Object.entries(all).every(([id, p]) => {
    const lesson = lessonById(id);
    return !!lesson && !!p && typeof p === 'object' && p.version === 1 && ['completed', 'assisted', 'independent'].every(k => typeof p[k] === 'boolean') && (p.lastSceneId === null || lesson.levels.some(l => l.id === p.lastSceneId));
  });
}
// 예전(v1) 수업 자료는 오류로 막지 않고 버린다. 그 밖의 모르는 ID는 그대로 거절 대상이다.
function lessonRetired(id) { return LESSON_RETIRED_IDS.includes(id); }
function lessonRecordRetired(saved) {
  const v = saved?.snapshot?.values;
  return saved?.kind === 'lesson' && lessonRetired(v?.lesson?.lessonId) || saved?.kind === 'play' && v?.play?.content?.type === 'lessonPractice' && lessonRetired(v.play.content.lessonId);
}
