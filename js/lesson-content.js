// 체스 수업 교재와 순수 판정: 내 말 지키기 · 첫 세 수업
// 명세: docs/lessons/INTERACTIVE_LESSONS_DESIGN.md, 장면: docs/lessons/LESSON_SCENES_V1.json
// 좌표는 [row,col] = [8-rank, fileIndex]. 모든 장면은 백(학습자) 차례, 캐슬링·앙파상 없음.
// witness 수순은 검사 근거일 뿐 정답 배열이 아니다. 성공은 아래 술어로 계산한다.
const LESSON_CONTENT_VERSION = 1;
const LESSON_BASE_FENS = {
  A: '7k/6b1/8/8/3R4/8/K7/8 w - - 0 1',
  B: 'r6k/8/8/8/8/B7/8/4K3 w - - 0 1',
  C: '7k/8/5n2/3R4/8/8/8/K7 w - - 0 1',
  D: '7k/1b6/8/8/4p3/8/4R2p/K7 w - - 0 1',
};
// mirror(X): 모든 행의 좌우만 뒤집는다. 차례·캐슬링 정보는 그대로. 테스트에서 아래 고정값과 비교한다.
function lessonMirrorFEN(fen) {
  const [placement, ...rest] = fen.split(' ');
  const rows = placement.split('/').map(row => [...row.replace(/[1-8]/g, n => '.'.repeat(Number(n)))].reverse().join('').replace(/\.+/g, s => String(s.length)));
  return [rows.join('/'), ...rest].join(' ');
}
const LESSONS = [
  {
    id: 'protect-spot-v1', version: 1, number: 1, task: 'spot',
    title: '상대가 노리는 말 찾기', skill: '상대가 다음에 잡을 수 있는 우리 말을 찾아요', prerequisites: ['말 잡기'],
    prompt: '상대가 다음에 잡을 수 있는 우리 말을 찾아 눌러요.',
    why: '내가 두기 전에 상대가 다음에 무엇을 잡을지 살펴봐요.',
    learned: '두기 전에, 상대가 다음에 잡을 수 있는 우리 말부터 찾아요.',
    scenes: [
      { id: 'protect-spot-demo-v1', role: 'demo', fen: LESSON_BASE_FENS.A, focusSquare: [4, 3], witnessSuccess: { select: [4, 3] }, witnessFailure: null },
      { id: 'protect-spot-guided-v1', role: 'guided', fen: LESSON_BASE_FENS.B, focusSquare: [5, 0], witnessSuccess: { select: [5, 0] }, witnessFailure: null,
        guide: '상대 말을 하나씩 보고, 그 말이 갈 수 있는 길을 따라가 봐요.' },
      { id: 'protect-spot-transfer-v1', role: 'transfer', fen: LESSON_BASE_FENS.C, focusSquare: [3, 3], witnessSuccess: { select: [3, 3] }, witnessFailure: null },
    ],
  },
  {
    id: 'protect-escape-v1', version: 1, number: 2, task: 'escape',
    title: '안전한 곳으로 피하기', skill: '공격받는 말을 잡히지 않는 칸으로 옮겨요', prerequisites: ['공격 찾기'],
    prompt: '공격받는 말을 잡히지 않는 칸으로 옮겨요.',
    why: '움직일 수 있는 칸과 안전한 칸은 다를 수 있어요.',
    learned: '공격받는 말은 상대가 다음 수에 잡을 수 없는 칸으로 옮겨요.',
    scenes: [
      { id: 'protect-escape-demo-v1', role: 'demo', fen: LESSON_BASE_FENS.A, focusSquare: [4, 3], witnessSuccess: { move: [4, 3, 3, 3], reply: null }, witnessFailure: null },
      { id: 'protect-escape-guided-v1', role: 'guided', fen: 'k6r/8/8/8/8/7B/8/3K4 w - - 0 1', focusSquare: [5, 7], witnessSuccess: { move: [5, 7, 4, 6], reply: null }, witnessFailure: { move: [5, 7, 0, 2], reply: [0, 7, 0, 2] },
        guide: '테두리의 말을 누르면 갈 수 있는 칸이 보여요. 상대 말이 닿지 않는 칸을 골라요.' },
      { id: 'protect-escape-transfer-v1', role: 'transfer', fen: 'k7/8/2n5/4R3/8/8/8/7K w - - 0 1', focusSquare: [3, 4], witnessSuccess: { move: [3, 4, 2, 4], reply: null }, witnessFailure: { move: [3, 4, 1, 4], reply: [2, 2, 1, 4] } },
    ],
  },
  {
    id: 'protect-capture-v1', version: 1, number: 3, task: 'captureSafe',
    title: '잡은 다음도 살펴보기', skill: '잡은 뒤에도 내 말이 안전한지 살펴요', prerequisites: ['안전한 목적지'],
    prompt: '룩으로 상대 폰을 잡아요. 잡은 뒤에도 룩이 안전한 곳을 찾아요.',
    why: '잡을 수 있는 말이 보여도 바로 움직이지 말고, 상대가 내 말을 다시 잡을 수 있는지 살펴봐요.',
    whyNote: '모든 교환이나 희생이 나쁘다는 뜻은 아니에요. 그런 수는 더 깊은 수업에서 다뤄요.',
    learned: '잡기 전에, 잡은 뒤 상대가 내 말을 다시 잡을 수 있는지 살펴봐요.',
    scenes: [
      { id: 'protect-capture-demo-v1', role: 'demo', fen: LESSON_BASE_FENS.D, focusSquare: [6, 4], witnessSuccess: { move: [6, 4, 6, 7], reply: null }, witnessFailure: { move: [6, 4, 4, 4], reply: [1, 1, 4, 4] } },
      { id: 'protect-capture-guided-v1', role: 'guided', fen: 'k7/6b1/8/8/3p4/8/p2R4/7K w - - 0 1', focusSquare: [6, 3], witnessSuccess: { move: [6, 3, 6, 0], reply: null }, witnessFailure: { move: [6, 3, 4, 3], reply: [1, 6, 4, 3] },
        guide: '테두리의 룩으로 잡을 수 있는 폰이 두 개예요. 잡은 뒤 상대가 룩을 잡을 수 있는지 살펴봐요.' },
      // D에 백 나이트 c3만 더한 배치. 나이트는 배경 변화이고 학습 대상은 여전히 룩이다.
      { id: 'protect-capture-transfer-v1', role: 'transfer', fen: '7k/1b6/8/8/4p3/2N5/4R2p/K7 w - - 0 1', focusSquare: [6, 4], witnessSuccess: { move: [6, 4, 6, 7], reply: null }, witnessFailure: { move: [6, 4, 4, 4], reply: [1, 1, 4, 4] } },
    ],
  },
];
const LESSON_ROLE_LABELS = { demo: '보기', guided: '함께 해보기', transfer: '혼자 해보기' };

function lessonById(id) { return typeof id === 'string' ? LESSONS.find(l => l.id === id) || null : null; }
function lessonScene(lesson, sceneId) { return lesson?.scenes.find(s => s.id === sceneId) || null; }
function lessonSceneGame(scene) { return ChessGame.fromFEN(scene.fen); }
function lessonSquareName([r, c]) { return 'abcdefgh'[c] + (8 - r); }
function lessonPieceName(piece) { return piece ? t(PIECE_NAMES[piece[1]]) : ''; }
// 받침에 따라 조사를 고른다: lessonJosa('룩','이/가') → '룩이'
function lessonJosa(word, pair) {
  const code = word.charCodeAt(word.length - 1), [withFinal, withoutFinal] = pair.split('/');
  return word + (code >= 0xAC00 && code <= 0xD7A3 && (code - 0xAC00) % 28 ? withFinal : withoutFinal);
}
function lessonCompareMoves(a, b) { for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; }
function lessonSameSquare(a, b) { return !!a && !!b && a[0] === b[0] && a[1] === b[1]; }

// color가 지금 둔다고 가정한 합법 잡기(좌표 사전순). 복제본에서만 차례를 바꾸고 원본의 차례·기록은 건드리지 않는다.
function lessonLegalCaptures(game, color) {
  const g = game.clone();
  g.turn = color; g.selected = null; g.validMoves = [];
  const moves = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (g.board[r][c]?.[0] !== color) continue;
    for (const [tr, tc] of g.legalMoves(r, c)) if (g.board[tr][tc]) moves.push([r, c, tr, tc]);
  }
  return moves.sort(lessonCompareMoves);
}
// 수업 1 정답 집합: 왕을 제외하고, 흑이 합법적인 잡기로 취할 수 있는 백 말
function lessonSpotTargets(game) {
  const found = new Map();
  for (const m of lessonLegalCaptures(game, 'b')) {
    const p = game.board[m[2]][m[3]];
    if (p?.[0] === 'w' && p[1] !== 'K') found.set(m[2] + ',' + m[3], [m[2], m[3]]);
  }
  return [...found.values()];
}
function lessonSpotAttackers(game, square) {
  return lessonLegalCaptures(game, 'b').filter(m => lessonSameSquare([m[2], m[3]], square)).map(m => [m[0], m[1]]);
}
// 흑 말이 지금 차례라면 갈 수 있는 칸(공격 경로·착지점 도움)
function lessonReach(game, [r, c]) {
  const g = game.clone();
  g.turn = game.board[r][c]?.[0] || 'b'; g.selected = null; g.validMoves = [];
  return g.legalMoves(r, c);
}
function lessonLegalMoves(game, [r, c]) {
  if (game.turn !== 'w' || game.board[r]?.[c]?.[0] !== 'w') return [];
  return game.legalMoves(r, c).map(([tr, tc]) => [r, c, tr, tc]);
}
// 이동 과제의 후보: escape는 대상 말의 모든 합법 이동, captureSafe는 대상 말의 합법 잡기만
function lessonCandidates(game, scene, task) {
  const moves = lessonLegalMoves(game, scene.focusSquare);
  return task === 'captureSafe' ? moves.filter(m => game.board[m[2]][m[3]]) : moves;
}
// 이동 뒤 흑의 합법 수 중 그 말을 잡는 수가 없으면 성공. 있으면 사전순 첫 수를 교재 응수로 쓴다.
// 범위는 '다음 한 수에 잡히지 않음'뿐이다. 장기적인 최선 수라고 판정하지 않는다.
function lessonOutcome(game, move) {
  const after = game.clone();
  if (after.move(move[0], move[1], move[2], move[3]) !== 'moved') return null;
  const replies = lessonLegalCaptures(after, 'b').filter(m => m[2] === move[2] && m[3] === move[3]);
  return { safe: !replies.length, reply: replies[0] || null, captured: game.board[move[2]][move[3]] || null, after };
}
function lessonSafeMoves(game, scene, task) { return lessonCandidates(game, scene, task).filter(m => lessonOutcome(game, m)?.safe); }

// 시범 장면: 강조 → 실제 이동 → 잡힘/안전 결과. 매번 교재로부터 다시 만든다(저장하지 않음).
function lessonDemoSteps(lesson, scene) {
  const start = lessonSceneGame(scene), steps = [], focus = scene.focusSquare, focusName = lessonPieceName(start.board[focus[0]][focus[1]]);
  if (lesson.task === 'spot') {
    const [attacker] = lessonSpotAttackers(start, focus), attackerName = lessonPieceName(start.board[attacker[0]][attacker[1]]);
    steps.push({ game: start, marks: { attackers: [attacker], reach: lessonReach(start, attacker) }, text: `상대 ${lessonJosa(attackerName, '이/가')} 갈 수 있는 칸을 살펴봐요.` });
    const predict = start.clone(); predict.turn = 'b'; predict.move(attacker[0], attacker[1], focus[0], focus[1]);
    steps.push({ game: predict, move: [attacker[0], attacker[1], focus[0], focus[1]], predict: true, marks: { danger: [focus] }, text: `상대 차례라면 이렇게 ${lessonJosa(focusName, '을/를')} 잡을 수 있어요.` });
    steps.push({ game: start, marks: { attackers: [attacker], targets: [focus], arrows: [[...attacker, ...focus]] }, text: lessonSpotSuccessText(start, focus) });
    return steps;
  }
  const [attacker] = lesson.task === 'escape' ? lessonSpotAttackers(start, focus) : [null];
  if (lesson.task === 'escape') {
    const attackerName = lessonPieceName(start.board[attacker[0]][attacker[1]]);
    steps.push({ game: start, marks: { attackers: [attacker], targets: [focus], arrows: [[...attacker, ...focus]] }, text: `상대 ${lessonJosa(attackerName, '이/가')} 우리 ${lessonJosa(focusName, '을/를')} 노려요.` });
  } else {
    const captures = lessonCandidates(start, scene, lesson.task).map(m => [m[2], m[3]]);
    steps.push({ game: start, marks: { focus: [focus], targets: captures }, text: `${lessonJosa(focusName, '은/는')} ${captures.map(lessonSquareName).join('와 ')}의 폰을 잡을 수 있어요. 어느 쪽이 안전할까요?` });
  }
  if (scene.witnessFailure) {
    const { move, reply } = scene.witnessFailure, tried = start.clone(); tried.move(...move);
    const captured = lessonPieceName(start.board[move[2]][move[3]]);
    steps.push({ game: tried, move, marks: {}, text: `${lessonSquareName([move[2], move[3]])}의 ${lessonJosa(captured, '을/를')} 잡으면…` });
    const lost = tried.clone(); lost.move(...reply);
    steps.push({ game: lost, move: reply, marks: { danger: [[reply[2], reply[3]]] }, text: lessonFailureText(lesson, start, move, reply) });
    steps.push({ game: start, marks: { focus: [focus] }, text: '처음으로 돌아가서 다른 방법을 볼게요.' });
  }
  const { move } = scene.witnessSuccess, done = start.clone(); done.move(...move);
  steps.push({ game: done, move, marks: {}, text: lesson.task === 'escape' ? `${lessonJosa(focusName, '을/를')} 상대 말이 닿지 않는 칸으로 옮겨요.` : `이번에는 ${lessonSquareName([move[2], move[3]])}의 폰을 잡아요.` });
  steps.push({ game: done, marks: { safe: [[move[2], move[3]]] }, text: lessonSuccessText(lesson, start, move) });
  return steps;
}
function lessonSpotSuccessText(game, target) {
  const [attacker] = lessonSpotAttackers(game, target), a = lessonPieceName(game.board[attacker[0]][attacker[1]]), b = lessonPieceName(game.board[target[0]][target[1]]);
  return `이 ${lessonJosa(a, '이/가')} 우리 ${lessonJosa(b, '을/를')} 노려요.`;
}
function lessonSuccessText(lesson, start, move) {
  if (lesson.task === 'escape') return '이 칸에서는 상대가 다음 한 수에 이 말을 잡을 수 없어요.';
  const captured = lessonPieceName(start.board[move[2]][move[3]]), mover = lessonPieceName(start.board[move[0]][move[1]]);
  return `${lessonJosa(captured, '을/를')} 잡고 ${mover}도 지켰어요.`;
}
function lessonFailureText(lesson, start, move, reply) {
  if (lesson.task === 'escape') return '여기로 가도 상대가 잡을 수 있어요. 다른 칸도 살펴볼까요?';
  const captured = lessonPieceName(start.board[move[2]][move[3]]), mover = lessonPieceName(start.board[move[0]][move[1]]), taker = lessonPieceName(start.board[reply[0]][reply[1]]);
  return `${lessonJosa(captured, '을/를')} 잡았지만 상대 ${taker}에게 ${lessonJosa(mover, '을/를')} 잃었어요.`;
}

// ===== 저장 상태 검증 =====
// 저장된 수업은 신뢰된 교재와 기록된 수로 다시 만든다. 파일 속 배치·문구를 그대로 믿지 않는다.
const LESSON_PHASES_BY_ROLE = { demo: ['demoReady'], guided: ['choose', 'result'], transfer: ['choose', 'result', 'complete'] };
const LESSON_NOTICES = ['pickOurs', 'pickFocus', 'notFocus', 'emptyMove', 'cannotGo'];
function lessonCoordValid(p) { return Array.isArray(p) && p.length === 2 && p.every(n => Number.isInteger(n) && n >= 0 && n < 8); }
function lessonMoveValid(m) { return Array.isArray(m) && m.length === 4 && m.every(n => Number.isInteger(n) && n >= 0 && n < 8); }
function lessonBoardKey(g) { return g.board.map(r => r.map(p => p || '--').join('')).join('/') + '/' + g.turn; }
function lessonGameDataValid(g) {
  return !!g && typeof g === 'object' && Array.isArray(g.board) && g.board.length === 8 && g.board.every(row => Array.isArray(row) && row.length === 8 && row.every(p => p === null || typeof p === 'string' && /^[wb][KQRBNP]$/.test(p))) && ['w', 'b'].includes(g.turn);
}
function lessonRebuild(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const lesson = lessonById(v.lessonId), scene = lessonScene(lesson, v.sceneId);
  if (!lesson || lesson.version !== 1 || v.contentVersion !== LESSON_CONTENT_VERSION || !scene || v.sceneRole !== scene.role) return null;
  if (!LESSON_PHASES_BY_ROLE[scene.role].includes(v.phase)) return null;
  if (!lessonGameDataValid(v.game) || !lessonGameDataValid(v.attemptStartGame)) return null;
  if (!Number.isInteger(v.attempts) || v.attempts < 0 || v.attempts > 10000 || !Number.isInteger(v.helpLevel) || v.helpLevel < 0 || v.helpLevel > 3) return null;
  if (typeof v.helpUsed !== 'boolean' || typeof v.helpShown !== 'boolean' || !v.progress || typeof v.progress.guided !== 'boolean' || typeof v.progress.transfer !== 'boolean') return null;
  if (v.notice !== null && !LESSON_NOTICES.includes(v.notice)) return null;
  if (v.selected !== null && !lessonCoordValid(v.selected)) return null;
  if (v.studentMove !== null && !lessonMoveValid(v.studentMove) || v.responseMove !== null && !lessonMoveValid(v.responseMove)) return null;
  const start = lessonSceneGame(scene);
  if (lessonBoardKey(v.attemptStartGame) !== lessonBoardKey(start)) return null;
  const steps = scene.role === 'demo' ? lessonDemoSteps(lesson, scene).length : 0;
  if (!Number.isInteger(v.demoStep) || (scene.role === 'demo' ? ![0, steps].includes(v.demoStep) : v.demoStep !== 0)) return null;
  let game = start.clone(), result = null, studentMove = null, responseMove = null;
  if (v.phase === 'demoReady' || v.phase === 'choose') {
    if (v.result !== null || v.studentMove !== null || v.responseMove !== null) return null;
    if (v.selected !== null) return null;  // 진행 중 선택은 저장하지 않는다
  } else if (lesson.task === 'spot') {
    if (!v.selected || start.board[v.selected[0]][v.selected[1]]?.[0] !== 'w' || v.studentMove !== null || v.responseMove !== null) return null;
    result = lessonSpotTargets(start).some(s => lessonSameSquare(s, v.selected)) ? 'success' : 'retry';
  } else {
    if (v.selected !== null || !v.studentMove || !lessonCandidates(start, scene, lesson.task).some(m => lessonCompareMoves(m, v.studentMove) === 0)) return null;
    const out = lessonOutcome(start, v.studentMove);
    studentMove = v.studentMove.slice(); game = out.after;
    if (out.safe) result = 'success';
    else { result = 'retry'; responseMove = out.reply.slice(); game.move(...responseMove); }
    if (JSON.stringify(v.responseMove) !== JSON.stringify(responseMove)) return null;
  }
  if (v.phase !== 'demoReady' && v.phase !== 'choose' && v.result !== result) return null;
  if (v.phase === 'complete' && (result !== 'success' || !v.progress.transfer)) return null;
  if (lessonBoardKey(v.game) !== lessonBoardKey(game)) return null;
  game.selected = null; game.validMoves = [];
  return {
    lessonId: lesson.id, contentVersion: LESSON_CONTENT_VERSION, sceneId: scene.id, sceneRole: scene.role, phase: v.phase,
    game, attemptStartGame: start, selected: v.selected ? v.selected.slice() : null, attempts: v.attempts, helpLevel: v.helpLevel,
    helpUsed: v.helpUsed, helpShown: v.helpShown, result, responseMove, studentMove, demoStep: v.demoStep,
    progress: { guided: v.progress.guided, transfer: v.progress.transfer }, notice: v.notice,
  };
}
function lessonProgressValid(all) {
  if (!all || typeof all !== 'object' || Array.isArray(all)) return false;
  return Object.entries(all).every(([id, p]) => {
    const lesson = lessonById(id);
    return !!lesson && !!p && typeof p === 'object' && p.version === 1 && ['completed', 'assisted', 'independent'].every(k => typeof p[k] === 'boolean') && (p.lastSceneId === null || !!lessonScene(lesson, p.lastSceneId));
  });
}
