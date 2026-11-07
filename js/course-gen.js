// 승급 과정 판 생성기 (docs/PREMIUM_COURSE.md §3·§4)
// 기본 판(js/course-levels.js)은 scripts/generate-course-levels.cjs가 이 생성기를 고정 시드로 돌려 고른 것이다.
// 무한 연습과 승급 시험은 같은 생성기를 새 시드로 돌린다. 만든 판은 모두 판정기(course-rules.js)로 끝까지 확인한다.
// 난수는 수업 생성기의 lgRnd(같은 시드 → 같은 판)를 같이 쓴다.

// ===== 주제 정의 =====
// mode: mate2(두 수 메이트) · win2(두 수로 이득) · endgame(퀸·룩·폰 끝내기, 계산표) · ladder(두 룩) · opening(초반 원칙)
const CG_SHELTER = n => lgBuildShelter('b', n);
const CG_M2_OPTS = n => ({ bk: { rows: [0, 0, 1], cols: [0, 1, 2, 3, 4, 5, 6, 7] }, wk: { rows: [5, 6, 7], cols: [0, 1, 2, 3, 4, 5, 6, 7] }, build: n ? CG_SHELTER(n) : null, wPawn: [2, 5], bPawn: [1, 4] });
const CG_MATE2_TIERS = [
  { white: () => ['Q', 'R'], black: () => [], opts: () => CG_M2_OPTS(lgPick([2, 3])) },
  { white: () => ['R', 'R'], black: () => [lgPick(['P', 'N', 'B'])], opts: () => CG_M2_OPTS(lgPick([1, 2, 3])) },
  { white: () => ['Q', lgPick(['N', 'B'])], black: () => [lgPick(['N', 'B', 'R'])], opts: () => CG_M2_OPTS(lgPick([1, 2, 3])) },
  { white: () => [lgPick(['Q', 'R']), lgPick(['R', 'B', 'N']), lgPick(['N', 'B', 'P'])], black: () => [lgPick(['R', 'B', 'N']), 'P'], opts: () => CG_M2_OPTS(lgPick([1, 2])) },
  { white: () => [lgPick(['Q', 'R']), lgPick(['R', 'B', 'N']), lgPick(['N', 'B']), 'P'], black: () => [lgPick(['R', 'Q']), lgPick(['B', 'N']), 'P'], opts: () => CG_M2_OPTS(lgPick([1, 2, 3])) },
];
const CG_TOPICS = {
  'm2-check': { key: 'm2check', mode: 'mate2', seed: 31001, tiers: CG_MATE2_TIERS, want: a => a.checkKeys === a.keys.length,
    goals: ['두 수 만에 체크메이트! 첫 수는 체크예요.', '체크로 몰아서 두 수 메이트를 만들어요.', '두 수 메이트! 상대 킹이 피할 곳을 생각해요.', '체크를 두 번 이어 체크메이트해요.', '말이 많아요. 두 수 메이트를 찾아요.'] },
  'm2-quiet': { key: 'm2quiet', mode: 'mate2', seed: 32001, tiers: CG_MATE2_TIERS, want: a => a.checkKeys === 0, attempts: 120000,
    goals: ['체크하지 않는 첫 수로 킹의 길을 막고, 다음 수에 메이트!', '조용한 첫 수 뒤에 메이트해요. 상대가 무엇을 해도!', '먼저 킹이 도망갈 칸을 막아요. 그다음 메이트!', '체크가 아닌 첫 수를 찾아요. 두 수 메이트예요.', '말이 많아요. 조용한 첫 수로 두 수 메이트!'] },
  'm2-sac': { key: 'm2sac', mode: 'mate2', seed: 33001, want: a => a.sacrifice, attempts: 160000, tiers: [
    { white: () => ['Q', 'R'], black: () => [lgPick(['R', 'B'])], opts: () => CG_M2_OPTS(lgPick([2, 3])) },
    { white: () => ['Q', 'R'], black: () => [lgPick(['R', 'B']), 'P'], opts: () => CG_M2_OPTS(lgPick([1, 2])) },
    { white: () => ['Q', lgPick(['B', 'R'])], black: () => [lgPick(['R', 'N']), lgPick(['N', 'B', 'P'])], opts: () => CG_M2_OPTS(lgPick([2, 3])) },
    { white: () => ['Q', 'R', lgPick(['N', 'B'])], black: () => [lgPick(['R', 'Q']), lgPick(['B', 'N']), 'P'], opts: () => CG_M2_OPTS(lgPick([1, 2, 3])) },
    { white: () => ['Q', 'R', lgPick(['N', 'B']), 'P'], black: () => ['Q', lgPick(['R', 'B']), lgPick(['N', 'P'])], opts: () => CG_M2_OPTS(lgPick([1, 2, 3])) },
  ],
    goals: ['내 말을 내주는 첫 수! 상대가 잡으면 메이트해요.', '말을 내주고 두 수 메이트를 만들어요.', '잡혀도 괜찮은 첫 수를 찾아요. 그다음 메이트!', '킹을 끌어내는 희생 수를 찾아요.', '말이 많아요. 내주고 메이트하는 길을 찾아요.'] },
  'remove-defender': { key: 'defender', mode: 'win2', seed: 34001, tiers: [
    { white: () => [lgPick(['Q', 'R']), lgPick(['N', 'B', 'P'])], black: () => [lgPick(['R', 'N', 'B']), lgPick(['N', 'B', 'P'])] },
    { white: () => [lgPick(['Q', 'R']), lgPick(['N', 'B', 'R']), 'P'], black: () => [lgPick(['R', 'Q']), lgPick(['N', 'B']), 'P'] },
    { white: () => [lgPick(['Q', 'R']), lgPick(['N', 'B']), lgPick(['N', 'B', 'P'])], black: () => [lgPick(['R', 'Q']), lgPick(['N', 'B']), lgPick(['N', 'B', 'P'])] },
    { white: () => [lgPick(['Q', 'R']), lgPick(['N', 'B', 'R']), lgPick(['N', 'B']), 'P'], black: () => [lgPick(['R', 'Q']), lgPick(['N', 'B', 'R']), lgPick(['N', 'B']), 'P'] },
    { white: () => ['Q', lgPick(['R', 'B']), lgPick(['N', 'B']), 'P', 'P'], black: () => [lgPick(['R', 'Q']), lgPick(['R', 'B']), lgPick(['N', 'B']), 'P', 'P'] },
  ], goals: ['지금 잡으면 손해예요. 첫 수로 흔들고, 두 번째 수에 말을 얻어요.', '체크나 공격으로 먼저 흔들어요. 그다음 말을 잡아요.', '지켜 주는 말을 살펴요. 두 수 만에 말을 얻는 길은?', '상대가 무엇을 해도 두 번째 수에 이득을 보는 첫 수를 찾아요.', '말이 많아요. 두 수 계획으로 말을 얻어요.'] },
  'eg-kqk': { key: 'kqk', mode: 'endgame', piece: 'Q', seed: 35001, bands: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]],
    goals: ['퀸과 킹으로 체크메이트해요.', '퀸으로 상대 킹을 가장자리로 몰아요.', '퀸은 나이트처럼 한 칸 떨어져 따라가요. 킹을 가장자리로!', '상대 킹을 상자에 가두고 상자를 줄여요.', '처음부터 끝까지! 퀸과 킹으로 체크메이트.'] },
  'eg-krk': { key: 'krk', mode: 'endgame', piece: 'R', seed: 36001, bands: [[1, 2], [3, 5], [6, 9], [10, 13], [14, 16]],
    goals: ['룩과 킹으로 체크메이트해요.', '룩으로 줄을 막고 킹으로 다가가요.', '룩이 상자를 만들고, 킹이 룩을 도와요.', '상자를 한 줄씩 줄여요. 룩이 잡히지 않게!', '처음부터 끝까지! 룩과 킹으로 체크메이트.'] },
  'eg-krrk': { key: 'krrk', mode: 'ladder', seed: 37001, edges: [0, 0, 1, 2, 3],
    goals: ['두 룩으로 사다리 메이트! 마지막 한두 수예요.', '두 룩이 번갈아 한 줄씩 밀어요.', '사다리처럼 한 줄씩! 룩이 킹 옆에 서지 않게.', '킹이 가운데 가까워요. 두 룩으로 가장자리까지 밀어요.', '가운데에서 시작해요. 두 룩 사다리로 끝까지!'] },
  'eg-kpk': { key: 'kpk', mode: 'endgame', piece: 'P', seed: 38001,
    goals: ['폰을 끝 줄까지 보내 퀸을 만들어요.', '상대 킹이 폰을 따라잡을 수 있나요? 폰을 퀸으로!', '킹이 폰 앞에서 길을 열어 줘요.', '킹과 킹이 마주 보는 자리(대치)를 생각해요.', '킹을 앞세워 폰을 퀸으로 만들어요.'] },
  'op-center': { key: 'center', mode: 'opening', topic: 'center', seed: 39001, plies: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 6]],
    goals: ['가운데 네 칸을 차지하거나 노리는 수를 두어요.', '폰이나 나이트로 가운데를 차지해요.', '가운데를 더 많이 차지하는 수는?', '말을 잃지 않으면서 가운데를 노려요.', '안전하게 가운데를 차지해요.'] },
  'op-develop': { key: 'develop', mode: 'opening', topic: 'develop', seed: 40001, plies: [[1, 2], [2, 3], [3, 5], [5, 7], [7, 9]],
    goals: ['집에 있는 나이트나 비숍을 꺼내요.', '작은 말(나이트·비숍)을 꺼내요.', '말을 잃지 않는 칸으로 꺼내요.', '나이트는 가장자리보다 가운데 쪽으로!', '아직 집에 있는 작은 말을 안전하게 꺼내요.'] },
  'op-castle': { key: 'castle', mode: 'opening', topic: 'castle', seed: 41001, plies: [[6, 8], [7, 9], [8, 10], [9, 12], [10, 14]],
    goals: ['캐슬링으로 킹을 안전한 곳으로 옮겨요.', '킹을 두 칸 옮기면 룩이 넘어와요. 캐슬링!', '캐슬링할 수 있을 때 해요.', '어느 쪽으로 캐슬링할 수 있나요?', '말이 많아요. 캐슬링으로 킹을 지켜요.'] },
  'op-trap': { key: 'trap', mode: 'opening', topic: 'trap', seed: 42001, plies: [[3, 5], [3, 6], [4, 7], [5, 8], [6, 10]],
    goals: ['상대가 다음 수에 체크메이트를 노려요! 막아요.', '초반 함정이에요. 상대 퀸이 노리는 칸을 막아요.', '체크메이트 위협을 찾아 막아요.', '막으면서 내 말도 잃지 않게!', '상대의 노림수를 찾아 막아요.'] },
};
const CG_TIER_NAMES = ['첫걸음', '쉬움', '보통', '어려움', '도전'];
function cgSpec(id) { return CG_TOPICS[id] || null; }

// ===== FEN (캐슬링 권리 포함) =====
function cgFen(game) { return lgFen(game.board).replace(' w - - 0 1', ` ${game.turn} ${game.castlingKey()} - 0 1`); }
const cgPieces = (b, color) => b.flat().filter(p => p && p[0] === color && p[1] !== 'K');

// ===== 두 수 메이트 =====
function cgAnalyzeMate2(spec, b) {
  if (b[0].some(p => p?.[1] === 'P') || b[7].some(p => p?.[1] === 'P') || lrInCheck(b, 'b') || lrInCheck(b, 'w')) return null;
  if (!['playing', 'check'].includes(ChessGame.fromFEN(lgFen(b)).status)) return null;
  const a = crMate2Analyze(b); if (!a || !a.keys.length || a.keys.length > 3) return null;
  // 희생: 첫 수(열쇠) 가운데 옮긴 말(폰·킹 제외)을 상대가 잡을 수 있는 칸에 두는 수가 있다.
  a.sacrifice = a.keys.length <= 2 && a.keyMoves.some(m => { const p = b[m[0]][m[1]]; if (p[1] === 'P' || p[1] === 'K') return false; const b1 = lrApply(b, m); return lrMoves(b1, 'b').some(r => r[2] === m[2] && r[3] === m[3]); });
  if (!spec.want(a)) return null;
  // 함정: 체크이지만 열쇠가 아닌 수(아이가 먼저 떠올릴 수 있는 수)
  const keySet = new Set(a.keyMoves.map(String));
  a.traps = lrMoves(b, 'w').filter(m => !keySet.has(String(m)) && lrInCheck(lrApply(b, m), 'b')).length;
  a.white = cgPieces(b, 'w'); a.black = cgPieces(b, 'b');
  a.score = +((4 - a.keys.length) * 1.2 + a.white.length * 0.4 + a.black.length * 0.5 + a.replies * 0.12 + Math.min(6, a.traps) * 0.25 + (a.checkKeys ? 0 : 1.2) + (a.sacrifice ? 0.8 : 0)).toFixed(3);
  a.sig = a.white.map(p => p[1]).sort().join('') + '|' + a.black.map(p => p[1]).sort().join('');
  a.witness = a.keyMoves[0];
  return a;
}

// ===== 지키는 말 흔들기: 두 수로 이득 보기 =====
// 지금 바로 이득 보는 잡기는 없고(지켜진 말), 첫 수 뒤 상대가 무엇을 해도 두 번째 수에 2점 이상 얻는 판.
// 한 수 전술(포크·핀·꼬치·발견 공격)로 바로 이기는 판은 체스 수업의 몫이라 뺀다. 첫 수만으로 2점 이상 얻는 판도 뺀다.
function cgAnalyzeWin2(b) {
  if (lrInCheck(b, 'b') || lrInCheck(b, 'w') || b[0].some(p => p?.[1] === 'P') || b[7].some(p => p?.[1] === 'P')) return null;
  if (lrTradeBest(b) > 0 || lrBestCapture(b, 'b', 4).gain > 0) return null;
  // 내가 노리지만 상대가 지키는 상대 말(지키는 말이 있는 판)
  let guarded = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; if (p?.[0] === 'b' && p[1] !== 'K' && lrAttacked(b, r, c, 'w') && lrAttacked(b, r, c, 'b')) guarded++; }
  if (!guarded) return null;
  const moves = lrMoves(b, 'w'); if (moves.some(m => lrPromotes(b, m))) return null;
  // 잡기·체크·상대 말을 노리는 수만 계산한다(아무것도 노리지 않는 수는 두 수 안에 이득을 만들 수 없다).
  const active = moves.filter(m => { const b1 = lrApply(b, m); return b[m[2]][m[3]] || lrInCheck(b1, 'b') || lrTargetsOf(b1, [m[2], m[3]]).length || lrDiscovered(b, m).length; });
  const outs = active.map(m => ({ m, g: lrGain(b, m) }));
  if (outs.some(x => x.g.mate)) return null;
  const safe = outs.filter(x => x.g.gain >= 2); if (!safe.length || safe.length > 2) return null;
  if (crHasMateIn1(b) || crMate2Analyze(b)?.keys.length || lrMateThreats(b).length) return null;  // 메이트가 있는 판은 메이트 주제의 몫
  for (const x of safe) {
    const s = lrShape(b, x.m), b1 = lrApply(b, x.m);
    if (s.fork || s.pin || s.skewer || s.discover) return null;
    if (crCapValue(b, x.m) - lrQs(b1, 'b', 3) >= 2) return null;
  }
  const a = { b, moves, safe, white: cgPieces(b, 'w'), black: cgPieces(b, 'b') };
  a.fails = outs.filter(x => x.g.gain < 2).length;
  a.score = +((1 - safe.length / moves.length) * 3 + a.white.length * 0.5 + a.black.length * 0.5 + Math.min(4, a.fails) * 0.3).toFixed(3);
  a.sig = a.white.map(p => p[1]).sort().join('') + '|' + a.black.map(p => p[1]).sort().join('');
  a.witness = safe[0].m;
  return a;
}

// ===== 끝내기 =====
function cgRandomSquare(taken) { for (let n = 0; n < 100; n++) { const s = Math.floor(lgRnd() * 64); if (!taken.includes(s)) return s; } return -1; }
function cgBoardOf(list) { const b = Array.from({ length: 8 }, () => Array(8).fill(null)); for (const [s, p] of list) b[s >> 3][s & 7] = p; return b; }
function cgAnalyzeEndgame(spec, ti, b) {
  const e = crEndgameOf(b); if (!e || e.type !== spec.piece) return null;
  if (lrInCheck(b, 'b')) return null;
  const d = crDistance(b, 'w'); if (d <= 0) return null;
  const moves = lrMoves(b, 'w');
  if (spec.piece === 'P') {
    // 폰 끝내기: 이기는 수의 비율이 낮을수록, 승격까지 멀수록 어렵다.
    const wins = moves.filter(m => { const st = crEndgameStep('P', b, m); return st.result === 'success' || st.result === 'continue'; });
    const ratio = wins.length / moves.length, pawnRow = e.x >> 3, run = moves.some(m => b[m[0]][m[1]] === 'wP' && wins.some(w => String(w) === String(m)));
    const kingFar = Math.max(Math.abs((e.wk >> 3) - pawnRow), Math.abs((e.wk & 7) - (e.x & 7)));
    const tierOk = [
      () => run && wins.length && kingFar >= 3 && d >= 5 && d <= 11,            // 폰 달리기: 킹 도움 없이
      () => ratio >= 0.3 && d <= 11 && kingFar <= 2,
      () => ratio < 0.5 && d >= 8 && d <= 15 && kingFar <= 2,
      () => ratio < 0.35 && d >= 10 && kingFar <= 3,
      () => ratio < 0.3 && d >= 14,
    ][ti];
    if ((e.x & 7) === 0 || (e.x & 7) === 7) return null;                      // 가장자리 폰은 다른 규칙이라 뺀다
    if (!tierOk()) return null;
    return { b, d, moves, wins: wins.length, score: +((1 - ratio) * 4 + d * 0.15).toFixed(3), sig: `${e.wk >> 3}${e.x >> 3}`, limit: Math.ceil(d / 2) + 8 };
  }
  const left = crMovesLeft(d), [lo, hi] = spec.bands[ti];
  if (left < lo || left > hi) return null;
  // 말이 바로 잡히는 자리(상대 킹 옆, 내 킹이 지키지 않음)에서는 시작하지 않는다.
  if (crAdj(e.x, e.bk) && !crAdj(e.x, e.wk)) return null;
  return { b, d, moves, score: +(left + moves.length * 0.01).toFixed(3), sig: `${e.bk >> 3}${e.bk & 7}`, limit: left + Math.max(3, left) };
}
function cgPlaceEndgame(spec, ti) {
  if (spec.mode === 'ladder') {
    const want = spec.edges[ti], bkCands = []; for (let s = 0; s < 64; s++) if (crEdgeDist([s >> 3, s & 7]) === want) bkCands.push(s);
    const bk = lgPick(bkCands), wk = cgRandomSquare([bk]); if (crAdj(wk, bk)) return null;
    const r1 = cgRandomSquare([bk, wk]), r2 = cgRandomSquare([bk, wk, r1]);
    return cgBoardOf([[wk, 'wK'], [bk, 'bK'], [r1, 'wR'], [r2, 'wR']]);
  }
  const wk = cgRandomSquare([]), bk = cgRandomSquare([wk]); if (crAdj(wk, bk)) return null;
  let x;
  if (spec.piece === 'P') { x = 8 + Math.floor(lgRnd() * 48); if (x === wk || x === bk) return null; }
  else x = cgRandomSquare([wk, bk]);
  return cgBoardOf([[wk, 'wK'], [bk, 'bK'], [x, 'w' + spec.piece]]);
}
// 두 룩: 예시 풀이(크게 줄이는 수 + 한 수 메이트)로 실제로 끝낼 수 있는 판만 쓴다. 제한 수 = 풀이 수 + 여유.
function cgAnalyzeLadder(spec, ti, b) {
  if (lrInCheck(b, 'b') || lrStatus(b, 'b') !== 'playing' && lrStatus(b, 'b') !== 'check') return null;
  // 흑 차례라면 바로 잡을 수 있는 룩이 있는 판(내가 먼저 지켜야 하는 판)은 쓰지 않는다.
  const bt = lrCopy(b); if (lrCaptures(bt, 'b').length) return null;
  if (crHasMateIn1(b) && ti > 0) return null;
  let cur = b, n = 0;
  for (; n < 30; n++) {
    const m = crLadderBest(cur); if (!m) return null;
    const st = crLadderStep(cur, m);
    if (st.result === 'success') break;
    if (st.result !== 'continue' || !st.reply) return null;
    cur = lrApply(lrApply(cur, m), st.reply);
  }
  if (n >= 30) return null;
  const len = n + 1, band = [[1, 2], [2, 4], [4, 7], [6, 10], [8, 14]][ti];
  if (len < band[0] || len > band[1]) return null;
  const e = lrKing(b, 'b');
  return { b, d: len * 2 - 1, moves: lrMoves(b, 'w'), score: +(len + crReachArea(b) * 0.05).toFixed(3), sig: `${e[0]}${e[1]}`, limit: len + Math.max(4, Math.ceil(len / 2)), solution: len };
}

// ===== 첫 수부터 잘 두기: 그럴듯한 초반을 무작위로 두어 판을 만든다 =====
// 말을 공짜로 주지 않는 수 가운데 가운데 폰·말 꺼내기·캐슬링에 가중치를 둔다. 함정 주제의 흑은 f2를 노린다.
function cgOpeningWeight(game, m, mode) {
  const b = game.board, p = b[m[0]][m[1]], color = p[0], type = p[1], home = color === 'w' ? 7 : 0, toR = m[2], toC = m[3];
  if (type === 'K') return Math.abs(toC - m[1]) === 2 ? (mode === 'nocastle' || mode === 'weak' ? 0 : 8) : 0.05;
  if (type === 'P') { if (toC === 3 || toC === 4) return m[0] === (color === 'w' ? 6 : 1) ? 6 : 1.5; if (toC === 2 || toC === 5) return mode === 'weak' && toC === 5 ? 4 : 1.5; return mode === 'weak' && toC === 6 ? 2.5 : 0.4; }
  if (type === 'N') return m[0] === home ? (toC === 0 || toC === 7 ? 0.5 : 5) : 0.6;
  if (type === 'B') return m[0] === home ? 3.5 : 0.5;
  if (type === 'Q') {
    if (mode === 'attack' && color === 'b') { const f2 = [6, 5]; const b1 = lrApply(b, m); return pieceAttacks(b1, toR, toC, f2[0], f2[1]) ? 10 : 0.3; }
    return 0.3;
  }
  return 0.2;
}
// 판만 옮겨 보기(캐슬링이면 룩도 함께). 생성기에서 수마다 게임 객체를 복제하지 않으려고 쓴다.
function cgApply(b, m) {
  const n = lrApply(b, m), p = b[m[0]][m[1]];
  if (p?.[1] === 'K' && Math.abs(m[3] - m[1]) === 2) { const rf = m[3] === 6 ? 7 : 0, rt = m[3] === 6 ? 5 : 3; n[m[0]][rt] = n[m[0]][rf]; n[m[0]][rf] = null; }
  return n;
}
function cgOpeningPick(game, mode) {
  const color = game.turn, opp = color === 'w' ? 'b' : 'w', moves = [];
  for (const m of game.allMoves()) {
    if (m[4] && m[4] !== 'Q') continue;
    const b1 = cgApply(game.board, m);
    if (lrBestCapture(b1, opp, 4).gain > 0) continue;
    let w = cgOpeningWeight(game, m, mode);
    if (mode === 'attack' && color === 'b') {
      if (b1[m[2]][m[3]]?.[1] === 'B' && pieceAttacks(b1, m[2], m[3], 6, 5)) w += 8;
      if (b1[m[2]][m[3]]?.[1] === 'N' && pieceAttacks(b1, m[2], m[3], 6, 5)) w += 5;
    }
    moves.push([m, w]);
  }
  if (!moves.length) return null;
  let total = moves.reduce((s, x) => s + x[1], 0), r = lgRnd() * total;
  for (const [m, w] of moves) { r -= w; if (r <= 0) return m; }
  return moves.at(-1)[0];
}
// 함정 주제의 흑 계획: 초반에 실제로 자주 나오는 f2 노리기(퀸+비숍)와 h4 대각선 노리기.
const CG_TRAP_PLANS = [['e7e5', 'f8c5', 'd8h4'], ['e7e5', 'f8c5', 'd8f6'], ['e7e6', 'f8c5', 'd8h4'], ['e7e5', 'b8c6', 'f8c5', 'd8h4'], ['e7e6', 'f8c5', 'd8f6'], ['e7e5', 'd8h4'], ['e7e6', 'd8h4']];
const cgSqMove = s => [8 - Number(s[1]), 'abcdefgh'.indexOf(s[0]), 8 - Number(s[3]), 'abcdefgh'.indexOf(s[2])];
function cgPlanMove(game, plan) {
  while (plan.length) {
    const m = cgSqMove(plan.shift());
    if (game.board[m[0]][m[1]]?.[0] === game.turn && game.legalMoves(m[0], m[1]).some(([r, c]) => r === m[2] && c === m[3]) && lrBestCapture(cgApply(game.board, m), 'w', 4).gain <= 0) return m;
  }
  return null;
}
function cgOpeningGame(spec, ti) {
  const [lo, hi] = spec.plies[ti], plies = lo + Math.floor(lgRnd() * (hi - lo + 1)), g = new ChessGame();
  const trap = spec.topic === 'trap', plan = trap ? lgPick(CG_TRAP_PLANS).slice() : null;
  const whiteMode = trap ? 'weak' : spec.topic === 'castle' ? 'nocastle' : 'normal';
  // 백이 두는 수 plies개(흑은 그 사이에 한 수씩). 시작 판(0수)은 백 차례. 함정은 위협이 생기면 바로 멈춘다.
  for (let i = 0; i < plies * 2; i++) {
    if (trap && g.turn === 'w' && i >= 2 && lrMateThreats(g.board).length) return g;
    const m = g.turn === 'b' && plan?.length ? (cgPlanMove(g, plan) || cgOpeningPick(g, 'normal')) : cgOpeningPick(g, g.turn === 'w' ? whiteMode : 'normal'); if (!m) return null;
    g.move(m[0], m[1], m[2], m[3]); g.selected = null; g.validMoves = [];
    if (g.status !== 'playing') return null;
  }
  return g;
}
function cgAnalyzeOpening(spec, ti, fen) {
  const game = ChessGame.fromFEN(fen); if (game.turn !== 'w' || game.status !== 'playing') return null;
  const b = game.board;
  if (lrBestCapture(b, 'b', 4).gain > 0 && spec.topic !== 'trap') return null;   // 이미 잃을 말이 있는 판은 쓰지 않는다
  const threat = lrMateThreats(b);
  if (spec.topic === 'trap' ? !threat.length : threat.length) return null;
  if (spec.topic === 'castle' && !['king', 'queen'].some(side => game.castlingStatus('w', side).allowed)) return null;
  if (spec.topic === 'develop' && crUndeveloped(b).length < 2) return null;
  if (spec.topic === 'center' && crCenterScore(b) >= 8) return null;
  const moves = game.allMoves().filter(m => !m[4] || m[4] === 'Q').map(m => m.slice(0, 4));
  const outs = moves.map(m => ({ m, o: crOpeningJudge(spec.topic, game, m) })).filter(x => x.o);
  const safe = outs.filter(x => x.o.result === 'success'), fail = outs.filter(x => x.o.result === 'fail');
  if (!safe.length || safe.length > Math.max(3, moves.length * 0.4)) return null;
  if (spec.topic === 'trap' && (!fail.length || safe.length > 6)) return null;
  const a = { fen, moves, safe, fail, score: +((1 - safe.length / moves.length) * 4 + fail.length * 0.05 + ti * 0.5).toFixed(3) };
  a.sig = String(safe.length) + '|' + b.flat().filter(Boolean).length;
  // 예시 첫 수: 가운데는 폰, 그 밖에는 킹이 걷는 수보다 다른 말의 수를 먼저 고른다.
  a.witness = (safe.find(x => b[x.m[0]][x.m[1]]?.[1] === 'P' && spec.topic === 'center') || safe.find(x => b[x.m[0]][x.m[1]]?.[1] !== 'K' || spec.topic === 'castle') || safe[0]).m;
  return a;
}

// ===== 후보 하나 =====
function cgCandidate(id, ti, seen) {
  const spec = cgSpec(id); if (!spec) return null;
  let a = null;
  if (spec.mode === 'mate2') {
    const tier = spec.tiers[ti], b = lgPlace(tier.white(), tier.black(), tier.opts()); if (!b) return null;
    const fen = lgFen(b); if (seen?.has(fen)) return null;
    a = cgAnalyzeMate2(spec, b); if (a) a.fen = fen;
  } else if (spec.mode === 'win2') {
    const tier = spec.tiers[ti], b = lgPlace(tier.white(), tier.black(), { wPawn: [2, 5], bPawn: [1, 5] }); if (!b) return null;
    const fen = lgFen(b); if (seen?.has(fen)) return null;
    a = cgAnalyzeWin2(b); if (a) a.fen = fen;
  } else if (spec.mode === 'endgame' || spec.mode === 'ladder') {
    const b = cgPlaceEndgame(spec, ti); if (!b) return null;
    const fen = lgFen(b); if (seen?.has(fen)) return null;
    a = spec.mode === 'ladder' ? cgAnalyzeLadder(spec, ti, b) : cgAnalyzeEndgame(spec, ti, b); if (a) a.fen = fen;
  } else if (spec.mode === 'opening') {
    const g = cgOpeningGame(spec, ti); if (!g) return null;
    const fen = cgFen(g); if (seen?.has(fen)) return null;
    a = cgAnalyzeOpening(spec, ti, fen);
  }
  return a;
}
// 판 기록(교재 판·연습 판·시험 판 공통). index는 주제 안의 판 순서, 연습·시험은 -1.
function cgLevelOf(id, ti, a, index) {
  const spec = cgSpec(id);
  const level = { tier: ti + 1, fen: a.fen, goal: spec.goals[ti], score: a.score };
  if (a.witness) level.witness = a.witness.slice(0, 4);
  if (a.limit) level.limit = a.limit;
  if (a.d !== undefined) level.distance = a.d;
  if (index === 0) level.showHint = true;
  return level;
}
// 저장된 배치를 다시 검사해 판 기록을 만든다(연습 이어하기·파일 가져오기). 그 단계 조건을 통과하지 못하면 null.
const CG_FEN_CACHE = new Map();
function cgLevelFromFen(id, ti, fen) {
  const key = `${id}|${ti}|${fen}`; if (CG_FEN_CACHE.has(key)) return CG_FEN_CACHE.get(key);
  let level = null;
  try {
    const spec = cgSpec(id);
    if (spec?.mode && Number.isInteger(ti) && ti >= 0 && ti < 5 && typeof fen === 'string' && /^[1-8KQRBNPkqrbnp/]{15,71} w (-|K?Q?k?q?) - 0 1$/.test(fen)) {
      const rows = fen.split(' ')[0].split('/');
      if (rows.length === 8 && rows.every(r => [...r].reduce((n, ch) => n + (/[1-8]/.test(ch) ? +ch : 1), 0) === 8)) {
        const b = boardFromFEN(fen);
        if (b.flat().filter(p => p === 'wK').length === 1 && b.flat().filter(p => p === 'bK').length === 1) {
          let a = null;
          if (spec.mode === 'opening') a = cgAnalyzeOpening(spec, ti, fen);
          else if (!/ w - - 0 1$/.test(fen)) a = null;
          else if (spec.mode === 'mate2') a = cgAnalyzeMate2(spec, b);
          else if (spec.mode === 'win2') a = cgAnalyzeWin2(b);
          else if (spec.mode === 'ladder') a = cgAnalyzeLadder(spec, ti, b);
          else a = cgAnalyzeEndgame(spec, ti, b);
          if (a) { a.fen = fen; level = cgLevelOf(id, ti, a, -1); }
        }
      }
    }
  } catch { level = null; }
  if (CG_FEN_CACHE.size > 200) CG_FEN_CACHE.clear();
  CG_FEN_CACHE.set(key, level);
  return level;
}
// 연습·시험 판 만들기: 시드 하나로 정해지는 후보를 차례로 검사한다. step(ms)만큼만 일하고 돌아와 화면이 멈추지 않게 한다.
const CG_DRILL_MAX_TRIES = 60000;
function cgDrillJob(id, ti, seed) {
  const band = (typeof COURSE_DRILL_BANDS !== 'undefined' && COURSE_DRILL_BANDS[id]?.[ti]) || null;
  const job = { id, ti, seed: seed >>> 0 || 1, rng: seed >>> 0 || 1, tries: 0, level: null, failed: false };
  job.step = (ms = 12) => {
    if (job.level || job.failed) return job.level;
    const spec = cgSpec(id); if (spec?.piece && !crTableReady(spec.piece)) { crTable(spec.piece); return null; }
    const saved = lgSeed, start = Date.now(); lgSeed = job.rng;
    try {
      while (Date.now() - start < ms && job.tries < CG_DRILL_MAX_TRIES) {
        job.tries++;
        const a = cgCandidate(id, ti, null);
        if (a && (!band || a.score >= band[0] && a.score <= band[1])) { job.level = cgLevelOf(id, ti, a, -1); break; }
      }
      if (!job.level && job.tries >= CG_DRILL_MAX_TRIES) job.failed = true;
    } finally { job.rng = lgSeed; lgSeed = saved; }
    return job.level;
  };
  return job;
}
