// 체스 수업 판 생성기 (docs/lessons/LESSON_EXPANSION_V4.md §2·§3)
// 기본 수업 판(js/lesson-levels.js)은 scripts/generate-lesson-levels.cjs가 이 생성기를 고정 시드로 돌려 고른 것이다.
// 무한 연습은 같은 생성기를 판마다 새 시드로 돌린다. 만든 판은 판정기(lessonOutcome)로 모든 수를 검사해 단계 조건을 확인한다.
const LG_NAMES = { K: '킹', Q: '퀸', R: '룩', B: '비숍', N: '나이트', P: '폰' };

// ===== 결정적 난수: 같은 시드는 같은 판 =====
let lgSeed = 1;
function lgRnd() { lgSeed |= 0; lgSeed = lgSeed + 0x6D2B79F5 | 0; let t = Math.imul(lgSeed ^ lgSeed >>> 15, 1 | lgSeed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const lgPick = list => list[Math.floor(lgRnd() * list.length)];
// 브라우저마다 같은 결과가 나오도록 정렬 대신 직접 섞는다(같은 시드 → 같은 판).
function lgShuffle(list) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(lgRnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const lgJosa = (w, pair) => lessonJosa(w, pair);
const lgSq = ([r, c]) => 'abcdefgh'[c] + (8 - r);

function lgFen(board) {
  return board.map(row => { let s = '', e = 0; for (const p of row) { if (!p) { e++; continue; } if (e) { s += e; e = 0; } s += p[0] === 'w' ? p[1] : p[1].toLowerCase(); } return s + (e || ''); }).join('/') + ' w - - 0 1';
}
// 킹은 자기 진영(기본: 흰 킹 아래 두 줄, 검은 킹 위 두 줄), 폰은 승격·첫 줄을 피한다.
// 옵션 o: wk/bk {rows, cols}, kingOk(b, wk, bk), wPawn/bPawn [첫 줄, 줄 수], build(b) — 킹 다음에 정해진 모양을 먼저 놓는다.
function lgPlace(white, black, o = {}) {
  const b = Array.from({ length: 8 }, () => Array(8).fill(null)), empty = (r, c) => !b[r][c];
  const home = (rows, cols) => { for (let n = 0; n < 50; n++) { const r = lgPick(rows), c = lgPick(cols); if (empty(r, c)) return [r, c]; } return null; };
  const wk = home(o.wk?.rows || [7, 7, 6], o.wk?.cols || [0, 1, 2, 5, 6, 7]); if (!wk) return null; b[wk[0]][wk[1]] = 'wK';
  const bk = home(o.bk?.rows || [0, 0, 1], o.bk?.cols || [0, 1, 2, 5, 6, 7]); if (!bk) return null; b[bk[0]][bk[1]] = 'bK';
  if (Math.max(Math.abs(wk[0] - bk[0]), Math.abs(wk[1] - bk[1])) < 2 || o.kingOk && !o.kingOk(b, wk, bk)) return null;
  if (o.build && !o.build(b, wk, bk)) return null;
  const [wp, wn] = o.wPawn || [2, 5], [bp, bn] = o.bPawn || [1, 5];
  const put = (color, type) => { for (let n = 0; n < 200; n++) { const r = type === 'P' ? (color === 'w' ? wp + Math.floor(lgRnd() * wn) : bp + Math.floor(lgRnd() * bn)) : Math.floor(lgRnd() * 8), c = Math.floor(lgRnd() * 8); if (empty(r, c)) { b[r][c] = color + type; return true; } } return false; };
  for (const t of white) if (!put('w', t)) return null;
  for (const t of black) if (!put('b', t)) return null;
  return b;
}

// ===== 내 말 지키기(수업 1~3): 판정은 lessonOutcome(게임 객체) =====
// 처음 위협 유무는 계산이 싸므로 먼저 거른다. pre(b)는 모든 수를 검사하기 전에 쓰는 '반드시 필요한 조건'이라 결과를 바꾸지 않는다.
function lgAnalyzeProtect(fen, mustCapture, needThreat, pre) {
  const g = ChessGame.fromFEN(fen);
  if (g.status !== 'playing' || g.isAttacked(g.board, ...g.findKing('b'), 'w')) return null;
  const early = lessonThreats(g).length;
  if (needThreat === true && !early || needThreat === false && early) return null;
  if (pre && !pre(g.board)) return null;
  const level = { mustCapture }, moves = g.allMoves();
  if (moves.some(m => m[4])) return null;  // 승격 수가 있는 판은 쓰지 않는다
  const outs = moves.map(m => ({ m, o: lessonOutcome(g, m, level), cap: g.board[m[2]][m[3]] }));
  if (outs.some(x => !x.o) || outs.some(x => x.o.result === 'success' && x.o.check)) return null;  // 체크 덕분에만 안전한 수 금지
  const safe = outs.filter(x => x.o.result === 'success'), fail = outs.filter(x => x.o.result === 'fail');
  const threats = lessonThreats(g);
  if (threats.some(t => g.board[t[0]][t[1]][1] === 'K')) return null;  // 상대 킹이 공격자인 판은 쓰지 않는다
  if (outs.some(x => x.cap && g.board[x.m[0]][x.m[1]][1] === 'K')) return null;  // 내 킹으로 잡는 수가 있는 판도 쓰지 않는다
  const targets = [...new Set(threats.map(t => t[2] + ',' + t[3]))];
  const pieces = color => g.board.flat().filter(p => p && p[0] === color && p[1] !== 'K');
  return { g, b: g.board, fen, outs, safe, fail, moves, threats, targets, white: pieces('w'), black: pieces('b'), mustCapture };
}
const lgAt = (a, [r, c]) => a.b[r][c];
const lgAttackersOf = (a, target) => a.threats.filter(t => t[2] === target[0] && t[3] === target[1]).map(t => [t[0], t[1]]);
const lgMovesOfPiece = (a, from) => a.outs.filter(x => x.m[0] === from[0] && x.m[1] === from[1]);
const lgFailCaptures = a => a.fail.filter(x => x.cap);
// 난이도 점수: 안전한 수 비율이 낮을수록, 말이 많을수록, 함정(실패하는 잡기)이 많을수록, 보이지 않는 공격(나이트·폰)일수록 어렵다.
function lgScoreProtect(a) {
  const hidden = a.threats.some(t => 'NP'.includes(lgAt(a, t)[1])) ? 1 : 0;
  return +((1 - a.safe.length / a.moves.length) * 4 + (a.white.length - 1) * 0.8 + (a.black.length - 1) * 0.5 + Math.min(4, lgFailCaptures(a).length) * 0.4 + hidden * 0.6 + Math.max(0, a.targets.length - 1) * 0.6).toFixed(3);
}
const lgPieceOf = (a, target) => LG_NAMES[lgAt(a, target)[1]];
const lgOneThreat = a => a.targets.length === 1 && lgAttackersOf(a, a.targets[0].split(',').map(Number)).length === 1;
const lgTarget0 = a => a.targets[0].split(',').map(Number);
const lgAttacker0 = a => lgAttackersOf(a, lgTarget0(a))[0];
const lgCanTakeAttacker = a => a.outs.some(x => x.cap && a.threats.some(t => t[0] === x.m[2] && t[1] === x.m[3]));
// 예시 정답과 함정: 사람이 떠올릴 법한 수를 고른다.
function lgWitnessProtect(a, lessonKey) {
  const t = a.targets.length ? lgTarget0(a) : null, attackers = new Set(a.threats.map(m => m[0] + ',' + m[1]));
  const pref = [x => a.mustCapture && x.cap, x => lessonKey === 'all' && x.cap && attackers.has(x.m[2] + ',' + x.m[3]), x => t && x.m[0] === t[0] && x.m[1] === t[1], () => true];
  for (const p of pref) { const hit = a.safe.find(p); if (hit) return hit.m.slice(0, 4); }
}
function lgTrapProtect(a) {
  // 판이 가르치려는 상대 말이 잡는 함정을 먼저 고른다(상대 킹이 옆 칸을 잡는 함정은 뒤로).
  const t = a.targets.length ? lgTarget0(a) : null, attackers = new Set(a.threats.map(m => m[0] + ',' + m[1]));
  const byKing = x => x.o.after.board[x.o.reply[0]][x.o.reply[1]][1] === 'K', byAttacker = x => attackers.has(x.o.reply[0] + ',' + x.o.reply[1]);
  const pref = [x => x.cap && !byKing(x), x => t && x.m[0] === t[0] && x.m[1] === t[1] && byAttacker(x), x => t && x.m[0] === t[0] && x.m[1] === t[1] && !byKing(x),
    x => !(x.o.reply[2] === x.m[2] && x.o.reply[3] === x.m[3]) && !byKing(x), x => !byKing(x), () => true];
  for (const p of pref) { const hit = a.fail.find(p); if (hit) return hit.m.slice(0, 4); }
}
// 잡을 수 있는 말 수 같은 싼 조건(엔진 판정과 같은 결과)으로 먼저 거른다.
const lgCapCount = (b, color) => lrCaptures(b, color).length;

// ===== 수업별 단계 정의: 말 구성, 조건, 목표 문장 =====
// 원래 세 수업은 v3 생성기와 같은 순서로 난수를 써서 같은 45판이 나온다(시드 20261107을 세 수업이 이어 쓴다).
const LG_TIER_NAMES = ['첫걸음', '쉬움', '보통', '어려움', '도전'];
const LG_PROTECT = {
  'protect-escape-v3': { key: 'escape', kind: 'protect', tiers: [
    { white: () => [lgPick(['R', 'B', 'Q', 'N'])], black: () => [lgPick(['R', 'B', 'Q'])],
      ok: a => lgOneThreat(a) && !lgCanTakeAttacker(a) && lgMovesOfPiece(a, lgTarget0(a)).length >= 6 && lgMovesOfPiece(a, lgTarget0(a)).filter(x => x.o.result === 'success').length / lgMovesOfPiece(a, lgTarget0(a)).length >= 0.6,
      goal: (a, i) => `상대 ${lgJosa(lgPieceOf(a, lgAttacker0(a)), '이/가')} 내 ${lgJosa(lgPieceOf(a, lgTarget0(a)), '을/를')} 노려요${i === 0 ? '(빨간 화살표)' : ''}. 안전한 칸으로 피해요.` },
    { white: () => [lgPick(['R', 'B', 'Q', 'N'])], black: () => [lgPick(['N', 'P', 'N']), lgPick(['P', 'B', 'R'])],
      ok: a => lgOneThreat(a) && 'NP'.includes(lgAt(a, lgAttacker0(a))[1]) && !lgCanTakeAttacker(a) && (r => r >= 0.3 && r <= 0.7)(lgMovesOfPiece(a, lgTarget0(a)).filter(x => x.o.result === 'success').length / Math.max(1, lgMovesOfPiece(a, lgTarget0(a)).length)),
      goal: a => { const t = lgAt(a, lgAttacker0(a))[1]; return `상대 ${lgJosa(LG_NAMES[t], '이/가')} 내 ${lgJosa(lgPieceOf(a, lgTarget0(a)), '을/를')} 노려요. ${t === 'N' ? '나이트는 L자로 뛰어와요.' : '폰은 대각선으로 잡아요.'}`; } },
    { white: () => [lgPick(['R', 'B', 'Q', 'N'])], black: () => [lgPick(['R', 'B', 'N']), lgPick(['R', 'B', 'N', 'P']), lgPick(['P', 'N'])],
      ok: a => lgOneThreat(a) && !lgCanTakeAttacker(a) && lgMovesOfPiece(a, lgTarget0(a)).length >= 5 && (n => n >= 1 && n <= 3)(lgMovesOfPiece(a, lgTarget0(a)).filter(x => x.o.result === 'success').length),
      goal: a => { const n = lgMovesOfPiece(a, lgTarget0(a)).filter(x => x.o.result === 'success').length; return `내 ${lgJosa(lgPieceOf(a, lgTarget0(a)), '이/가')} 공격받아요. 안전한 칸은 ${n}개뿐이에요.`; } },
    { white: () => [lgPick(['R', 'B', 'N']), lgPick(['R', 'B', 'N', 'Q'])], black: () => [lgPick(['R', 'B', 'N']), lgPick(['P', 'N', 'B'])],
      ok: a => lgOneThreat(a) && a.safe.length >= 1 && a.safe.length <= 6 && a.safe.every(x => x.m[0] === lgTarget0(a)[0] && x.m[1] === lgTarget0(a)[1] || x.cap),
      goal: () => '내 말 하나가 공격받아요. 어떤 말인지 찾아 지켜요.' },
    { white: () => [lgPick(['R', 'B', 'N']), lgPick(['R', 'N', 'Q']), 'P', 'P'], black: () => [lgPick(['R', 'B', 'N']), lgPick(['B', 'N', 'Q']), 'P', 'P'],
      ok: a => a.targets.length === 1 && a.safe.length >= 1 && a.safe.length <= 4,
      goal: () => '말이 많아요. 노려지는 내 말을 찾아 지켜요.' },
  ] },
  'protect-capture-v3': { key: 'capture', kind: 'protect', mustCapture: true, tiers: [
    { white: () => [lgPick(['R', 'Q', 'B'])], black: () => ['P', 'P', lgPick(['B', 'R'])], pre: b => lgCapCount(b, 'w') === 2,
      ok: a => !a.threats.length && a.outs.filter(x => x.cap).length === 2 && a.safe.length === 1 && lgFailCaptures(a).length === 1 && 'BR'.includes(lgAt(a, [lgFailCaptures(a)[0].o.reply[0], lgFailCaptures(a)[0].o.reply[1]])[1]),
      goal: (a, i) => i === 0 ? '상대 말 하나를 잡아요. 빨간 화살표는 그 말을 지키는 상대 말이에요.' : `상대 말 하나를 잡아요. 잡은 뒤에도 내 ${lgJosa(LG_NAMES[a.white[0][1]], '이/가')} 안전하게!` },
    { white: () => [lgPick(['R', 'Q', 'B', 'N'])], black: () => [lgPick(['P', 'N']), lgPick(['P', 'B', 'N']), lgPick(['N', 'P'])], pre: b => lgCapCount(b, 'w') === 2,
      ok: a => !a.threats.length && a.outs.filter(x => x.cap).length === 2 && a.safe.length === 1 && lgFailCaptures(a).length === 1 && 'NPK'.includes(lgFailCaptures(a)[0].o.after.board[lgFailCaptures(a)[0].o.reply[0]][lgFailCaptures(a)[0].o.reply[1]][1]),
      goal: a => { const f = lgFailCaptures(a)[0], d = LG_NAMES[f.o.after.board[f.o.reply[0]][f.o.reply[1]][1]]; return `상대 말 하나를 잡아요. 상대 ${d}도 말을 지켜요.`; } },
    { white: () => [lgPick(['R', 'Q', 'B', 'N'])], black: () => [lgPick(['N', 'B', 'R']), lgPick(['P', 'N', 'B']), lgPick(['P', 'N']), lgPick(['P', 'B'])], pre: b => lgCapCount(b, 'w') >= 3,
      ok: a => !a.threats.length && a.outs.filter(x => x.cap).length >= 3 && a.safe.length === 1 && lgFailCaptures(a).some(x => LR_VALUE[x.cap[1]] > LR_VALUE[a.safe[0].cap[1]]),
      goal: () => '잡을 수 있는 말이 여러 개예요. 안전하게 잡을 수 있는 하나는?' },
    { white: () => [lgPick(['R', 'B', 'N', 'Q']), lgPick(['R', 'B', 'N'])], black: () => [lgPick(['N', 'B', 'R']), lgPick(['P', 'N', 'B']), lgPick(['P', 'N', 'R'])], pre: b => new Set(lrCaptures(b, 'w').map(m => m[0] * 8 + m[1])).size === 2,
      attempts: 300000, ok: a => !a.threats.length && a.safe.length >= 1 && a.safe.length <= 2 && new Set(a.outs.filter(x => x.cap).map(x => x.m[0] + ',' + x.m[1])).size === 2 && a.fail.some(x => x.cap && !(x.o.reply[2] === x.m[2] && x.o.reply[3] === x.m[3])),
      goal: () => '내 말 두 개로 잡을 수 있어요. 잡은 뒤 내 말이 모두 안전한 쪽은?' },
    { white: () => [lgPick(['Q', 'R', 'B', 'N']), lgPick(['R', 'B', 'N']), 'P'], black: () => [lgPick(['R', 'B', 'N']), lgPick(['P', 'N', 'B']), lgPick(['P', 'N', 'B', 'R']), 'P'],
      ok: a => a.targets.length === 1 && a.safe.length >= 1 && a.safe.length <= 2 && a.safe.every(x => x.m[0] === lgTarget0(a)[0] && x.m[1] === lgTarget0(a)[1]),
      goal: a => `내 ${lgJosa(lgPieceOf(a, lgTarget0(a)), '이/가')} 공격받아요! 상대 말을 잡으면서 피해요.` },
  ] },
  'protect-all-v3': { key: 'all', kind: 'protect', tiers: [
    { white: () => [lgPick(['R', 'B', 'Q', 'N']), lgPick(['R', 'B', 'N'])], black: () => [lgPick(['R', 'B', 'N'])],
      ok: a => lgOneThreat(a) && a.safe.some(x => x.cap && x.m[2] === lgAttacker0(a)[0] && x.m[3] === lgAttacker0(a)[1]) && a.safe.length >= 3,
      goal: a => `상대 ${lgJosa(lgPieceOf(a, lgAttacker0(a)), '이/가')} 내 ${lgJosa(lgPieceOf(a, lgTarget0(a)), '을/를')} 노려요. 피하거나, 그 말을 잡아도 돼요.` },
    { white: () => [lgPick(['R', 'B', 'N', 'Q']), lgPick(['R', 'B', 'N'])], black: () => ['P', 'P', lgPick(['N', 'B'])],
      ok: a => lgOneThreat(a) && lgAt(a, lgAttacker0(a))[1] === 'P' && a.fail.some(x => x.cap && x.m[2] === lgAttacker0(a)[0] && x.m[3] === lgAttacker0(a)[1]) && a.safe.length >= 2,
      goal: a => `상대 폰이 내 ${lgJosa(lgPieceOf(a, lgTarget0(a)), '을/를')} 노려요. 지켜진 폰은 잡지 말아요.` },
    { white: () => [lgPick(['R', 'B', 'Q']), lgPick(['R', 'B', 'N']), lgPick(['P', 'N'])], black: () => [lgPick(['N', 'N', 'B', 'R', 'Q']), lgPick(['P', 'B'])],
      ok: a => a.targets.length >= 2 && new Set(a.threats.map(t => t[0] + ',' + t[1])).size === 1 && a.safe.length >= 1 && a.safe.length <= 2,
      goal: a => `상대 ${lgJosa(LG_NAMES[lgAt(a, [a.threats[0][0], a.threats[0][1]])[1]], '이/가')} 내 말 두 개를 노려요. 둘 다 지키는 방법은?` },
    { white: () => [lgPick(['R', 'B', 'Q']), lgPick(['R', 'B', 'N', 'Q']), lgPick(['N', 'P'])], black: () => [lgPick(['R', 'B', 'Q']), lgPick(['N', 'B', 'P']), 'P'],
      ok: a => a.targets.length >= 1 && a.safe.length >= 1 && a.safe.length <= 4 && a.fail.some(x => !(x.o.reply[2] === x.m[2] && x.o.reply[3] === x.m[3]) && !a.threats.some(t => t[2] === x.o.reply[2] && t[3] === x.o.reply[3])),
      goal: () => '내 말을 옮기면 뒤에 있던 말이 드러날 수 있어요. 조심해서 지켜요.' },
    { white: () => [lgPick(['R', 'Q']), lgPick(['B', 'N']), lgPick(['B', 'N', 'R']), 'P', 'P'], black: () => [lgPick(['R', 'Q']), lgPick(['B', 'N']), lgPick(['B', 'N', 'P']), 'P', 'P'],
      ok: a => a.targets.length >= 1 && a.targets.length <= 2 && a.safe.length >= 1 && a.safe.length <= 4,
      goal: () => '실전처럼 말이 많아요. 잡힐 수 있는 내 말이 없게!' },
  ] },
};

// ===== 수업 4~15: 판정은 lrJudge(빠른 판 계산) =====
function lgAnalyzeKind(spec, tier, fen) {
  const b = boardFromFEN(fen), kind = spec.kind;
  if (lrInCheck(b, 'b') || (kind === 'escape') !== lrInCheck(b, 'w') || b[6].includes('bP')) return null;
  const moves = lrMoves(b, 'w');
  if (!moves.length || kind !== 'promote' && moves.some(m => lrPromotes(b, m))) return null;
  if (tier.pre && !tier.pre(b) || LG_KIND_PRE[kind] && !LG_KIND_PRE[kind](b, moves)) return null;
  if (!['playing', 'check'].includes(ChessGame.fromFEN(fen).status)) return null;  // 기물 부족 무승부 같은 판 제외
  const level = { kind, shape: spec.shape };
  const outs = moves.map(m => ({ m, o: lrJudge(level, b, m), cap: b[m[2]][m[3]] }));
  const pieces = color => b.flat().filter(p => p && p[0] === color && p[1] !== 'K');
  const a = { b, fen, kind, shape: spec.shape, moves, outs, safe: outs.filter(x => x.o.result === 'success'), fail: outs.filter(x => x.o.result === 'fail'), goal: outs.filter(x => x.o.result === 'goal'), white: pieces('w'), black: pieces('b') };
  if (!a.safe.length || !a.fail.length && !a.goal.length || !lgKindOk(a)) return null;
  return a;
}
// 모든 수를 검사하기 전에 거르는 싼 조건. 내 킹으로 잡는 수가 있는 판은 쓰지 않는다(체크를 푸는 수업 제외).
const lgKingTakes = (b, moves) => moves.some(m => b[m[2]][m[3]] && b[m[0]][m[1]][1] === 'K');
const LG_KIND_PRE = {
  guard: (b, moves) => !lgKingTakes(b, moves) && !lrCaptures(b, 'b').some(c => b[c[0]][c[1]][1] === 'K'),
  trade: (b, moves) => !lgKingTakes(b, moves), check: (b, moves) => !lgKingTakes(b, moves), promote: (b, moves) => !lgKingTakes(b, moves), tactic: (b, moves) => !lgKingTakes(b, moves),
  stopmate: b => lrMateThreats(b).length > 0,
};
// 주제마다 늘 지키는 조건: 의도한 방법 말고 다른 방법으로 성공하는 판은 쓰지 않는다.
function lgKindOk(a) {
  const { b, kind } = a, mates = a.safe.filter(x => x.o.note === 'mate');
  // 지키기·잡기 계열은 '체크 덕분에만 안전한 성공 수'가 있는 판을 쓰지 않는다(원래 세 수업과 같은 규칙).
  if (['guard', 'trade', 'check', 'escape', 'promote', 'stalemate'].includes(kind) && a.safe.some(x => lrCheckOnlySafe(lrApply(b, x.m)))) return false;
  switch (kind) {
    case 'guard': return lrGuardTargets(b).length === 1;
    case 'trade': return lrTradeBest(b) > 0;
    case 'escape': return !a.safe.some(x => { const b1 = lrApply(b, x.m); return lrInCheck(b1, 'b') && b1.some((row, r) => row.some((p, c) => p && p[0] === 'w' && p[1] !== 'K' && lrAttacked(b1, r, c, 'b'))); });
    // 체크로 시간만 버는 수는 막은 것이 아니다: 체크로 성공하는 수가 있는 판은 쓰지 않는다.
    case 'stopmate': return lrMateThreats(b).length > 0 && !mates.length && !a.fail.some(x => x.o.note === 'stalemate') && !a.safe.some(x => lrInCheck(lrApply(b, x.m), 'b'));
    case 'stalemate': return a.fail.filter(x => x.o.note === 'stalemate').length >= 1;
    case 'check': case 'promote': return true;
    case 'mate': return a.safe.length <= 3;
    case 'tactic': return !mates.length && a.safe.every(x => lgShapeOf(a, x.m));
  }
  return false;
}
function lgShapeOf(a, m) {
  const s = lrShape(a.b, m);
  return a.shape === 'fork' ? s.fork : a.shape === 'pin' ? s.pin : a.shape === 'skewer' ? s.skewer : s.discover;
}
function lgScoreKind(a) {
  return +((1 - a.safe.length / a.moves.length) * 4 + (a.white.length - 1) * 0.8 + (a.black.length - 1) * 0.5 + Math.min(4, a.fail.length) * 0.4).toFixed(3);
}
function lgWitnessKind(a) {
  const quiet = x => !x.cap, noMate = x => x.o.note !== 'mate';
  const pref = { guard: [quiet], check: [noMate], stalemate: [noMate], tactic: [x => lgShapeOf(a, x.m)] }[a.kind] || [];
  for (const p of [...pref, () => true]) { const hit = a.safe.find(p); if (hit) return hit.m.slice(0, 4); }
}
function lgTrapKind(a) {
  const pref = [x => x.o.result === 'fail' && x.o.reply, x => x.o.result === 'fail', x => x.o.result === 'goal'];
  for (const p of pref) { const hit = a.outs.find(p); if (hit) return hit.m.slice(0, 4); }
}

// ===== 모양을 먼저 놓는 도우미 =====
const lgEmpty = (b, ok = () => true) => { const out = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (!b[r][c] && ok(r, c)) out.push([r, c]); return out; };
function lgSet(b, color, type, squares) { const list = squares.filter(([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8 && !b[r][c]); if (!list.length) return null; const s = lgPick(list); b[s[0]][s[1]] = color + type; return s; }
// 빈 판에서 type 말이 sq에서 닿는 칸(긴 말은 막힐 때까지)
function lgReach(b, type, [r, c], color = 'w') {
  const out = [], inb = (i, j) => i >= 0 && i < 8 && j >= 0 && j < 8;
  if (type === 'N') for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) { if (inb(r + dr, c + dc)) out.push([r + dr, c + dc]); }
  else if (type === 'K') for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if ((dr || dc) && inb(r + dr, c + dc)) out.push([r + dr, c + dc]); }
  else if (type === 'P') { const d = color === 'w' ? -1 : 1; for (const dc of [-1, 1]) if (inb(r + d, c + dc)) out.push([r + d, c + dc]); }
  else for (const [dr, dc] of LR_LINES[type]) { let i = r + dr, j = c + dc; while (inb(i, j)) { out.push([i, j]); if (b[i][j]) break; i += dr; j += dc; } }
  return out;
}
// sq로 한 수에 올 수 있는 type 말의 출발 칸(빈 칸, sq와 다른 줄 조건은 호출하는 쪽이 거른다)
function lgFrom(b, type, sq, color = 'w') {
  if (type === 'P') { const d = color === 'w' ? 1 : -1; const out = [[sq[0] + d, sq[1]]]; if (color === 'w' && sq[0] === 4) out.push([6, sq[1]]); return out.filter(([r]) => r >= 1 && r <= 6); }
  return lgReach(b, type, sq, color).filter(([r, c]) => !b[r][c]);
}
const lgOnLine = (a, b2, c) => (b2[0] - a[0]) * (c[1] - a[1]) === (b2[1] - a[1]) * (c[0] - a[0]);

// ===== 모양 만들기: 포크·핀·꼬치·발견 공격·체크·뒷줄 =====
// type 말이 sq를 노리려면 서 있어야 하는 칸(대칭)
function lgAttackFrom(b, type, sq) { return type === 'P' ? [[sq[0] + 1, sq[1] - 1], [sq[0] + 1, sq[1] + 1]].filter(([r, c]) => r >= 2 && r <= 6 && c >= 0 && c < 8) : lgReach(b, type, sq); }
function lgBuildFork(type, targets) {
  return (b, wk, bk) => {
    const fs = (targets.includes('K') ? lgAttackFrom(b, type, bk) : lgEmpty(b, r => type !== 'P' || r >= 2 && r <= 5)).filter(([r, c]) => !b[r][c] && (type !== 'P' || r >= 2 && r <= 5));
    if (!fs.length) return false;
    const f = lgPick(fs), reach = lgReach(b, type, f, 'w').filter(([r, c]) => !b[r][c]);
    for (const t of targets) if (t !== 'K' && !lgSet(b, 'b', t, reach.filter(([r]) => t !== 'P' || r >= 1 && r <= 5))) return false;
    return !!lgSet(b, 'w', type, lgFrom(b, type, f).filter(s => !lgReach(b, type, s, 'w').some(([r, c]) => b[r][c] && b[r][c][0] === 'b')));
  };
}
// 한 줄 위에 [뒤, 앞, 내 긴 말이 설 칸]을 놓는다. 내 긴 말은 줄 밖에서 그 칸으로 온다.
function lgLineMotif(b, slider, back, frontType, gap) {
  const dir = lgPick(LR_LINES[slider]), at = k => [back[0] + dir[0] * k, back[1] + dir[1] * k], inb = ([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const k1 = 1 + Math.floor(lgRnd() * 3), k2 = k1 + gap + Math.floor(lgRnd() * 3);
  for (let k = 1; k <= k2; k++) { const s = at(k); if (!inb(s) || b[s[0]][s[1]]) return null; }
  const front = at(k1), stand = at(k2);
  if (frontType === 'P' && (front[0] < 1 || front[0] > 5)) return null;
  b[front[0]][front[1]] = 'b' + frontType;
  const starts = lgReach(b, slider, stand).filter(([r, c]) => !b[r][c] && !lgOnLine(back, front, [r, c]));
  if (!starts.length) return null;
  const s = lgPick(starts); b[s[0]][s[1]] = 'w' + slider;
  return { front, stand, start: s };
}
function lgBuildPin(sliders, fronts, backs, helper) {
  return (b, wk, bk) => {
    const backType = lgPick(backs), back = backType === 'K' ? bk : lgSet(b, 'b', backType, lgEmpty(b, r => r <= 5));
    if (!back) return false;
    const m = lgLineMotif(b, lgPick(sliders), back, lgPick(fronts), 1);
    if (!m) return false;
    if (!helper) return true;
    const h = lgPick(helper);
    return !!lgSet(b, 'w', h, lgAttackFrom(b, h, m.front).filter(([r, c]) => !b[r][c] && (h !== 'P' || r >= 2)));
  };
}
function lgBuildSkewer(sliders, fronts, backs) {
  return (b, wk, bk) => {
    const frontType = lgPick(fronts), front = frontType === 'K' ? bk : lgSet(b, 'b', frontType, lgEmpty(b, r => r <= 5));
    if (!front) return false;
    // 앞 말 뒤쪽에 뒤 말, 반대쪽에 내 긴 말이 설 칸
    const slider = lgPick(sliders), dir = lgPick(LR_LINES[slider]), inb = ([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8;
    const k1 = 1 + Math.floor(lgRnd() * 3), k2 = 1 + Math.floor(lgRnd() * 4), backSq = [front[0] + dir[0] * k1, front[1] + dir[1] * k1], stand = [front[0] - dir[0] * k2, front[1] - dir[1] * k2];
    for (let k = 1; k <= k1; k++) { const s = [front[0] + dir[0] * k, front[1] + dir[1] * k]; if (!inb(s) || b[s[0]][s[1]]) return false; }
    for (let k = 1; k <= k2; k++) { const s = [front[0] - dir[0] * k, front[1] - dir[1] * k]; if (!inb(s) || b[s[0]][s[1]]) return false; }
    const backType = lgPick(backs); if (backType === 'P' && (backSq[0] < 1 || backSq[0] > 5)) return false;
    b[backSq[0]][backSq[1]] = 'b' + backType;
    const starts = lgReach(b, slider, stand).filter(([r, c]) => !b[r][c] && !lgOnLine(front, backSq, [r, c]));
    return !!lgSet(b, 'w', slider, starts);
  };
}
// 발견 공격: 목표(킹 또는 말) — 내 막는 말 — 내 긴 말이 한 줄. 막는 말이 비키며 잡거나 노릴 상대 말(미끼)을 하나 둔다.
function lgBuildDiscover(sliders, blockers, targets, bait) {
  return (b, wk, bk) => {
    const targetType = lgPick(targets), target = targetType === 'K' ? bk : lgSet(b, 'b', targetType, lgEmpty(b, r => r <= 5));
    if (!target) return false;
    const slider = lgPick(sliders), dir = lgPick(LR_LINES[slider]), inb = ([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8;
    const k1 = 1 + Math.floor(lgRnd() * 3), k2 = k1 + 1 + Math.floor(lgRnd() * 3);
    for (let k = 1; k <= k2; k++) { const s = [target[0] + dir[0] * k, target[1] + dir[1] * k]; if (!inb(s) || b[s[0]][s[1]]) return false; }
    const blockSq = [target[0] + dir[0] * k1, target[1] + dir[1] * k1], sliderSq = [target[0] + dir[0] * k2, target[1] + dir[1] * k2], blocker = lgPick(blockers);
    if (blocker === 'P' && (blockSq[0] < 2 || blockSq[0] > 6)) return false;
    b[blockSq[0]][blockSq[1]] = 'w' + blocker; b[sliderSq[0]][sliderSq[1]] = 'w' + slider;
    if (!bait) return true;
    const offLine = lgReach(b, blocker, blockSq, 'w').filter(s => !lgOnLine(target, sliderSq, s) && !b[s[0]][s[1]]);
    return !!lgSet(b, 'b', lgPick(bait), offLine.filter(([r]) => r <= 5));
  };
}
// 체크하는 상대 말을 먼저 놓는다(체크에서 벗어나기).
function lgBuildChecker(types) {
  return (b, wk) => { const t = lgPick(types); return !!lgSet(b, 'b', t, t === 'P' ? [[wk[0] - 1, wk[1] - 1], [wk[0] - 1, wk[1] + 1]].filter(([r]) => r >= 1 && r <= 5) : lgReach(b, t, wk)); };
}
// 킹 앞의 폰 벽(뒷줄): color 킹 바로 앞 줄의 세 칸 중 n칸
function lgBuildShelter(color, n) {
  return (b, wk, bk) => {
    const k = color === 'w' ? wk : bk, row = k[0] + (color === 'w' ? -1 : 1), cols = [k[1] - 1, k[1], k[1] + 1].filter(c => c >= 0 && c < 8);
    if (row < 1 || row > 6) return false;
    const pick = lgShuffle(cols).slice(0, Math.min(n, cols.length));
    for (const c of pick) { if (b[row][c]) return false; b[row][c] = color + 'P'; }
    return true;
  };
}
const lgBoth = (...fs) => (b, wk, bk) => fs.every(f => f(b, wk, bk));

// ===== 수업 4~15 단계 정의 =====
const lgName = (a, [r, c]) => LG_NAMES[a.b[r][c][1]];
const lgGuard = a => { const t = lrGuardTargets(a.b)[0]; return { t, attackers: lrAttackers(a.b, t[0], t[1], 'b'), defenders: lrAttackers(a.b, t[0], t[1], 'w') }; };
const lgChecker = a => { const k = lrKing(a.b, 'w'); return lrAttackers(a.b, k[0], k[1], 'b')[0]; };
const lgSafeN = (a, lo, hi) => a.safe.length >= lo && a.safe.length <= hi;
const lgNoThreat = b => lrCaptures(b, 'b').length === 0;
const lgQuietTactic = b => lrBestCapture(b, 'w').gain < 1 && lrBestCapture(b, 'b').gain < 1;
const lgMoveIs = (a, x, type) => a.b[x.m[0]][x.m[1]][1] === type;
const lgNear = (rows, d) => ({ wk: { rows, cols: [0, 1, 2, 3, 4, 5, 6, 7] }, bk: { rows: [0], cols: [0, 1, 2, 3, 4, 5, 6, 7] }, kingOk: (b, wk, bk) => Math.abs(wk[1] - bk[1]) <= d });
const LG_TOPICS = {
  'guard-v1': { key: 'guard', kind: 'guard', seed: 4001, tiers: [
    { white: () => [lgPick(['N', 'B']), lgPick(['R', 'Q', 'B', 'N'])], black: () => [lgPick(['R', 'Q'])],
      ok: a => { const g = lgGuard(a), v = ([r, c]) => LR_VALUE[a.b[r][c][1]]; return a.safe.length >= 2 && a.goal.length >= 1 && v(g.attackers[0]) > v(g.t) && a.safe.some(x => !x.cap); },
      goal: a => { const g = lgGuard(a), t = lgName(a, g.t); return `상대 ${lgJosa(lgName(a, g.attackers[0]), '이/가')} 내 ${lgJosa(t, '을/를')} 노려요. ${lgJosa(t, '은/는')} 두고 다른 말로 지켜요.`; } },
    { white: () => [lgPick(['N', 'B', 'R']), lgPick(['R', 'B', 'N']), 'P'], black: () => [lgPick(['Q', 'R']), 'P'],
      ok: a => lgSafeN(a, 1, 4) && a.safe.some(x => lgMoveIs(a, x, 'P') && !x.cap),
      goal: a => `폰도 내 말을 지킬 수 있어요. 내 ${lgJosa(lgName(a, lgGuard(a).t), '을/를')} 지켜요.` },
    { white: () => [lgPick(['N', 'B', 'R']), lgPick(['R', 'B', 'N', 'Q']), lgPick(['R', 'B', 'N'])], black: () => [lgPick(['Q', 'R']), lgPick(['B', 'N', 'P'])],
      ok: a => lgSafeN(a, 1, 3) && a.fail.length >= 2 && a.safe.some(x => !x.cap),
      goal: a => `내 ${lgJosa(lgName(a, lgGuard(a).t), '이/가')} 노려져요. 지켜 줄 말을 잘 골라요.` },
    { white: () => [lgPick(['N', 'B', 'R']), lgPick(['R', 'B', 'N', 'Q']), lgPick(['R', 'B', 'N', 'P'])], black: () => [lgPick(['Q', 'R', 'B']), lgPick(['R', 'B', 'N']), 'P'],
      ok: a => { const g = lgGuard(a); return g.attackers.length === 2 && g.defenders.length >= 1 && lgSafeN(a, 1, 3) && a.safe.some(x => !x.cap); },
      goal: a => `상대가 내 ${lgJosa(lgName(a, lgGuard(a).t), '을/를')} 두 번 노려요. 한 번 더 지켜요.` },
    { white: () => [lgPick(['R', 'Q']), lgPick(['B', 'N']), lgPick(['B', 'N', 'R']), 'P', 'P'], black: () => [lgPick(['R', 'Q']), lgPick(['B', 'N']), lgPick(['B', 'N', 'P']), 'P'],
      ok: a => lgSafeN(a, 1, 3) && a.safe.some(x => !x.cap),
      goal: () => '노려지는 내 말을 찾아, 옮기지 말고 지켜요.' },
  ] },
  'trade-v1': { key: 'trade', kind: 'trade', seed: 5001, tiers: [
    { white: () => [lgPick(['R', 'Q', 'B', 'N'])], black: () => [lgPick(['P', 'N', 'B']), lgPick(['R', 'Q', 'R'])], pre: b => lgNoThreat(b) && lrCaptures(b, 'w').length === 2,
      ok: a => a.safe.length === 1 && lrCaptures(a.b, 'w').every(m => lrTradeNet(a.b, m) === LR_VALUE[a.b[m[2]][m[3]][1]]),
      goal: () => '더 값진 말을 잡아요. 퀸9·룩5·비숍3·나이트3·폰1' },
    { white: () => [lgPick(['N', 'B'])], black: () => [lgPick(['R', 'Q']), 'P', lgPick(['P', 'N', 'B'])], pre: b => lgNoThreat(b) && lrCaptures(b, 'w').length >= 2,
      ok: a => a.safe.length === 1 && lrQs(lrApply(a.b, a.safe[0].m), 'b', 3) > 0 && a.goal.some(x => x.cap),
      goal: () => '지켜진 말이라도 내 말보다 비싸면 잡아도 이득!' },
    { white: () => [lgPick(['Q', 'R']), lgPick(['N', 'B'])], black: () => [lgPick(['R', 'B', 'N']), lgPick(['P', 'N', 'B']), lgPick(['P', 'R'])], pre: b => lgNoThreat(b) && lrCaptures(b, 'w').length >= 2,
      ok: a => a.safe.length === 1 && a.fail.some(x => x.cap && LR_VALUE[x.cap[1]] >= LR_VALUE[a.safe[0].cap[1]]),
      goal: () => '잡은 뒤 다시 잡히면 손해예요. 점수를 따져요.' },
    { white: () => [lgPick(['Q', 'R']), lgPick(['N', 'B', 'P'])], black: () => [lgPick(['N', 'B', 'R']), lgPick(['P', 'N']), lgPick(['P', 'B'])], pre: b => lgNoThreat(b) && lrCaptures(b, 'w').length >= 2,
      ok: a => a.safe.length === 1 && a.outs.some(x => x.cap && x !== a.safe[0] && x.m[2] === a.safe[0].m[2] && x.m[3] === a.safe[0].m[3] && x.o.result !== 'success'),
      goal: () => '같은 말을 두 말로 잡을 수 있어요. 어느 쪽이 이득?' },
    { white: () => [lgPick(['Q', 'R']), lgPick(['N', 'B']), lgPick(['R', 'B', 'N', 'P'])], black: () => [lgPick(['Q', 'R']), lgPick(['N', 'B']), lgPick(['P', 'N', 'B']), 'P'], pre: b => lgNoThreat(b) && lrCaptures(b, 'w').length >= 3,
      ok: a => a.safe.length === 1 && a.fail.length >= 1,
      goal: () => '잡을 수 있는 말이 많아요. 가장 이득인 잡기는?' },
  ] },
  'check-v1': { key: 'check', kind: 'check', seed: 6001, tiers: [
    { white: () => [lgPick(['Q', 'R'])], black: () => [], pre: lgNoThreat,
      ok: a => a.safe.length >= 2 && a.fail.length >= 1,
      goal: () => '상대 킹을 체크해요. 킹 바로 옆에서 체크하면 킹이 잡아요!' },
    { white: () => [lgPick(['R', 'B', 'Q', 'N'])], black: () => [lgPick(['R', 'B', 'N'])], pre: lgNoThreat,
      ok: a => a.fail.some(x => a.b[x.o.reply[0]][x.o.reply[1]][1] !== 'K') && lgSafeN(a, 1, 6),
      goal: a => `체크해요. 상대 ${lgJosa(LG_NAMES[a.black[0][1]], '이/가')} 지키는 칸은 피해요.` },
    { white: () => [lgPick(['R', 'B', 'Q', 'N']), lgPick(['R', 'B', 'N'])], black: () => [lgPick(['R', 'B', 'N']), lgPick(['B', 'N', 'P'])], pre: lgNoThreat,
      ok: a => lgSafeN(a, 1, 3) && a.fail.length >= 2,
      goal: () => '잡히지 않는 체크를 찾아요.' },
    { white: () => ['N', lgPick(['R', 'B', 'N']), 'P'], black: () => [lgPick(['R', 'B', 'N', 'Q']), lgPick(['B', 'N', 'P']), 'P'], pre: lgNoThreat,
      ok: a => lgSafeN(a, 1, 3) && a.safe.every(x => lgMoveIs(a, x, 'N')) && a.fail.length >= 1,
      goal: () => '나이트로 체크해 봐요. 잡히지 않는 칸에서!' },
    { white: () => [lgPick(['Q', 'R']), lgPick(['B', 'N']), lgPick(['R', 'B', 'N']), 'P'], black: () => [lgPick(['R', 'Q']), lgPick(['B', 'N']), lgPick(['B', 'N', 'P']), 'P'], pre: lgNoThreat,
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 3,
      goal: () => '체크할 수 있는 수는 많아요. 잡히지 않는 체크는?' },
  ] },
  'escape-check-v1': { key: 'getout', kind: 'escape', seed: 7001, tiers: [
    { white: () => [lgPick(['R', 'B', 'N'])], black: () => [], opts: { build: lgBuildChecker(['R', 'Q', 'B']) },
      ok: a => a.safe.length / a.moves.length >= 0.4 && a.fail.length >= 1,
      goal: () => '체크! 피하거나, 막거나, 잡아서 킹을 지켜요.' },
    { white: () => [lgPick(['R', 'B', 'N', 'Q']), lgPick(['R', 'B', 'N'])], black: () => [], opts: { build: lgBuildChecker(['N', 'P', 'N']) },
      ok: a => a.fail.length >= 1 && lgSafeN(a, 1, 6),
      goal: a => `${lgJosa(lgName(a, lgChecker(a)), '은/는')} 막을 수 없어요. 피하거나 잡아서 체크를 풀어요.` },
    { white: () => [lgPick(['R', 'B', 'N', 'Q']), lgPick(['R', 'B', 'N'])], black: () => [lgPick(['R', 'B', 'N'])], opts: { build: lgBuildChecker(['R', 'Q', 'B', 'N']) },
      ok: a => lgSafeN(a, 1, 3) && a.fail.length >= 2,
      goal: () => '체크를 풀면서 내 말도 잃지 않게!' },
    { white: () => [lgPick(['R', 'B', 'N', 'Q']), lgPick(['R', 'B', 'N']), lgPick(['N', 'B', 'P'])], black: () => [lgPick(['R', 'B', 'N']), 'P'], opts: { build: lgBuildChecker(['R', 'Q', 'B', 'N']) },
      ok: a => { const k = lrKing(a.b, 'w'); return lgSafeN(a, 1, 2) && a.outs.filter(x => x.m[0] === k[0] && x.m[1] === k[1]).every(x => x.o.result !== 'success'); },
      goal: () => '킹만 피하면 다른 말이 잡혀요. 다른 방법은?' },
    { white: () => [lgPick(['Q', 'R']), lgPick(['B', 'N']), lgPick(['R', 'B', 'N']), 'P'], black: () => [lgPick(['R', 'B', 'N']), lgPick(['B', 'N', 'P']), 'P'], opts: { build: lgBuildChecker(['R', 'Q', 'B', 'N', 'P']) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 2,
      goal: () => '말이 많아요. 체크를 풀고 내 말도 지켜요.' },
  ] },
  'mate-v1': { key: 'mate', kind: 'mate', seed: 8001, tiers: [
    { white: () => ['R'], black: () => [], opts: lgNear([2], 1),
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 1,
      goal: () => '룩으로 체크메이트! 내 킹이 상대 킹 앞을 막아 줘요.' },
    { white: () => ['Q'], black: () => [], opts: lgNear([2], 2),
      ok: a => lgSafeN(a, 1, 3) && a.fail.length >= 1,
      goal: () => '퀸으로 체크메이트! 퀸이 킹 옆에 가면 내 킹이 지켜 줘야 해요.' },
    { white: () => [lgPick(['R', 'Q', 'R'])], black: () => [], opts: { bk: { rows: [0], cols: [0, 1, 2, 3, 4, 5, 6, 7] }, build: lgBuildShelter('b', 3) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 1,
      goal: () => '뒷줄 체크메이트! 상대 폰이 킹의 길을 막아요.' },
    { white: () => [lgPick(['Q', 'R']), lgPick(['R', 'B', 'N'])], black: () => [lgPick(['R', 'B', 'N', 'P'])], opts: { bk: { rows: [0, 0, 1], cols: [0, 1, 2, 3, 4, 5, 6, 7] }, build: lgBuildShelter('b', 2) },
      ok: a => a.safe.length === 1 && a.fail.length >= 2,
      goal: () => '두 말이 힘을 합쳐 체크메이트해요.' },
    { white: () => [lgPick(['Q', 'R']), lgPick(['R', 'B', 'N']), lgPick(['B', 'N', 'P'])], black: () => [lgPick(['R', 'B', 'N']), lgPick(['B', 'N', 'P']), 'P'], opts: { bk: { rows: [0, 0, 1], cols: [0, 1, 2, 3, 4, 5, 6, 7] }, build: lgBuildShelter('b', 2) },
      ok: a => a.safe.length === 1 && a.fail.length >= 3,
      goal: () => '체크는 많지만 체크메이트는 하나예요.' },
  ] },
  'stop-mate-v1': { key: 'stopmate', kind: 'stopmate', seed: 9001, tiers: [
    { white: () => [lgPick(['R', 'B', 'N', 'Q'])], black: () => [lgPick(['R', 'Q', 'R'])], opts: { wk: { rows: [7], cols: [0, 1, 2, 5, 6, 7] }, build: lgBuildShelter('w', 3) },
      ok: a => a.fail.length >= 1 && a.safe.length >= 1,
      goal: () => '상대가 뒷줄 체크메이트를 노려요. 막아요!' },
    { white: () => [lgPick(['R', 'B', 'N'])], black: () => ['Q', lgPick(['B', 'N', 'R'])], opts: { wk: { rows: [7], cols: [0, 1, 2, 5, 6, 7] }, build: lgBuildShelter('w', 2) },
      ok: a => lgSafeN(a, 1, 6) && a.fail.length >= 2,
      goal: a => `상대 ${lgJosa(lgName(a, lrMateThreats(a.b)[0]), '이/가')} 체크메이트를 노려요. 막아요!` },
    { white: () => [lgPick(['R', 'B', 'N', 'Q']), lgPick(['R', 'B', 'N'])], black: () => [lgPick(['Q', 'R']), lgPick(['B', 'N', 'R'])], opts: { wk: { rows: [7, 7, 6], cols: [0, 1, 2, 5, 6, 7] }, build: lgBuildShelter('w', 2) },
      ok: a => lgSafeN(a, 1, 3) && a.fail.length >= 3,
      goal: () => '상대의 체크메이트 위협을 찾아 막아요.' },
    { white: () => [lgPick(['R', 'B', 'N', 'Q']), lgPick(['R', 'B', 'N'])], black: () => [lgPick(['Q', 'R']), lgPick(['B', 'N', 'R']), 'P'], opts: { wk: { rows: [7], cols: [0, 1, 2, 5, 6, 7] }, build: lgBuildShelter('w', 3) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 4,
      goal: () => '막을 방법이 적어요. 잘 찾아봐요.' },
    { white: () => [lgPick(['R', 'Q']), lgPick(['B', 'N']), 'P'], black: () => ['Q', lgPick(['B', 'N', 'R']), lgPick(['B', 'N']), 'P'], opts: { wk: { rows: [7], cols: [0, 1, 2, 5, 6, 7] }, build: lgBuildShelter('w', 2) },
      ok: a => lgSafeN(a, 1, 3) && a.fail.length >= 3,
      goal: () => '말이 많아요. 체크메이트 위협을 막아요.' },
  ] },
  'stalemate-v1': { key: 'stalemate', kind: 'stalemate', seed: 10001, tiers: [
    { white: () => ['Q'], black: () => [], opts: { ...lgNear([1, 2, 2], 3), bk: { rows: [0], cols: [0, 1, 6, 7] } }, pre: lgNoThreat,
      ok: a => a.fail.filter(x => x.o.note === 'stalemate').length >= 2,
      goal: () => '상대 킹이 움직일 칸을 남겨요. 다 막으면 비겨요!' },
    { white: () => ['Q'], black: () => [], opts: { ...lgNear([1, 2, 2, 3], 3), bk: { rows: [0, 0, 1], cols: [0, 1, 6, 7] }, build: (b) => { const c = Math.floor(lgRnd() * 8), r = 2 + Math.floor(lgRnd() * 3); if (b[r][c] || b[r + 1][c]) return false; b[r][c] = 'bP'; b[r + 1][c] = 'wP'; return true; } }, pre: lgNoThreat,
      ok: a => a.fail.filter(x => x.o.note === 'stalemate').length >= 2,
      goal: () => '상대 폰은 막혀서 못 움직여요. 킹이 갈 곳을 남겨요.' },
    { white: () => ['Q', 'R'], black: () => [], opts: { ...lgNear([1, 2, 3], 4), bk: { rows: [0, 0, 1], cols: [0, 1, 6, 7] } }, pre: lgNoThreat,
      ok: a => a.fail.filter(x => x.o.note === 'stalemate').length >= 3,
      goal: () => '말이 많을수록 조심! 상대 킹이 갈 곳을 남겨요.' },
    { white: () => ['Q', lgPick(['N', 'B'])], black: () => [], opts: { ...lgNear([1, 2, 3], 4), bk: { rows: [0, 0, 1], cols: [0, 1, 6, 7] } }, pre: lgNoThreat,
      ok: a => a.fail.filter(x => x.o.note === 'stalemate').length >= 4,
      goal: () => '비기지 않게 조심! 체크메이트하면 더 좋아요.' },
    { white: () => ['Q', lgPick(['R', 'B']), lgPick(['N', 'B'])], black: () => [], opts: { ...lgNear([1, 2, 3], 4), bk: { rows: [0, 0, 1], cols: [0, 1, 6, 7] }, build: (b) => { const c = Math.floor(lgRnd() * 8), r = 2 + Math.floor(lgRnd() * 3); if (b[r][c] || b[r + 1][c]) return false; b[r][c] = 'bP'; b[r + 1][c] = 'wP'; return true; } }, pre: lgNoThreat,
      ok: a => a.fail.filter(x => x.o.note === 'stalemate').length >= 5,
      goal: () => '말이 많아요. 상대가 둘 곳을 남기고, 내 말도 지켜요.' },
  ] },
};
const lgTactic = (shape, seed, tiers) => ({ key: shape, kind: 'tactic', shape, seed, tiers: tiers.map(t => ({ ...t, pre: lgQuietTactic })) });
Object.assign(LG_TOPICS, {
  'fork-v1': lgTactic('fork', 11001, [
    { white: () => [], black: () => [], opts: { build: (b, wk, bk) => lgBuildFork('N', ['K', lgPick(['R', 'Q'])])(b, wk, bk) },
      ok: a => lgSafeN(a, 1, 2), goal: () => '나이트로 상대 킹과 다른 말을 한꺼번에 노려요!' },
    { white: () => [], black: () => ['P'], opts: { build: (b, wk, bk) => lgBuildFork('N', lgPick([['R', 'Q'], ['R', 'R'], ['Q', 'B'], ['R', 'B']]))(b, wk, bk) },
      ok: a => lgSafeN(a, 1, 2), goal: () => '나이트 하나로 상대 말 두 개를 노려요.' },
    { white: () => [lgPick(['R', 'B', 'N'])], black: () => ['P'], opts: { build: (b, wk, bk) => lgBuildFork('P', lgPick([['N', 'B'], ['R', 'N'], ['B', 'R'], ['Q', 'R'], ['N', 'N']]))(b, wk, bk) },
      ok: a => lgSafeN(a, 1, 2) && a.safe.every(x => lgMoveIs(a, x, 'P')), goal: () => '폰 하나로 상대 말 두 개를 노려요. 폰은 1점이에요!' },
    { white: () => ['P'], black: () => ['P', lgPick(['P', 'N'])], opts: { build: (b, wk, bk) => lgBuildFork('Q', lgPick([['K', 'R'], ['K', 'B'], ['K', 'N'], ['R', 'B'], ['R', 'N']]))(b, wk, bk) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 1, goal: () => '퀸으로 두 말을 한꺼번에 노려요. 지켜지지 않은 말을 찾아요.' },
    { white: () => [lgPick(['R', 'B']), 'P'], black: () => [lgPick(['B', 'N']), 'P', 'P'], opts: { build: (b, wk, bk) => { const t = lgPick(['N', 'N', 'B', 'R', 'Q', 'P']); return lgBuildFork(t, lgPick([['K', 'R'], ['R', 'B'], ['Q', 'R'], ['K', 'Q'], ['R', 'N']]))(b, wk, bk); } },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 2, goal: () => '포크할 수 있는 말과 칸을 찾아요.' },
  ]),
  'pin-v1': lgTactic('pin', 12001, [
    { white: () => [], black: () => [], opts: { build: lgBuildPin(['B', 'R'], ['Q', 'R'], ['K']) },
      ok: a => lgSafeN(a, 1, 2), goal: () => '상대 킹 앞의 말을 묶어요. 묶인 말은 비킬 수 없어요!' },
    { white: () => [], black: () => ['P', lgPick(['P', 'N', 'B'])], opts: { build: lgBuildPin(['B', 'R', 'Q'], ['R', 'Q', 'N', 'B'], ['K']) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 1, goal: () => '상대 킹 앞의 말을 묶어요. 그 말을 지키는 말이 있나 봐요.' },
    { white: () => [], black: () => ['P'], opts: { build: lgBuildPin(['B', 'R', 'Q'], ['N', 'B', 'R'], ['K'], ['N', 'B', 'R']) },
      ok: a => lgSafeN(a, 1, 2), goal: () => '묶인 말을 내 다른 말과 함께 노려요.' },
    { white: () => [lgPick(['N', 'P'])], black: () => [lgPick(['N', 'B', 'P']), 'P'], opts: { build: lgBuildPin(['B', 'R', 'Q'], ['N', 'B', 'R'], ['K', 'Q']) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 1, goal: () => '킹이나 퀸 앞의 말을 묶어요. 핀을 걸 줄을 찾아요.' },
    { white: () => [lgPick(['N', 'B']), 'P'], black: () => [lgPick(['N', 'B', 'R']), 'P', 'P'], opts: { build: lgBuildPin(['B', 'R', 'Q'], ['N', 'B', 'R'], ['K', 'Q', 'K']) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 2, goal: () => '말이 많아요. 상대 킹과 퀸이 있는 줄을 살펴요.' },
  ]),
  'skewer-v1': lgTactic('skewer', 13001, [
    { white: () => [], black: () => [], opts: { build: lgBuildSkewer(['R', 'Q'], ['K'], ['R', 'Q']) },
      ok: a => lgSafeN(a, 1, 2), goal: () => '체크해서 킹이 비키면, 뒤의 말을 잡아요!' },
    { white: () => [], black: () => ['P'], opts: { build: lgBuildSkewer(['B'], ['K'], ['R', 'Q']) },
      ok: a => lgSafeN(a, 1, 2), goal: () => '비숍으로 꼬치 공격! 킹 뒤의 말을 노려요.' },
    { white: () => [], black: () => ['P', lgPick(['P', 'N'])], opts: { build: lgBuildSkewer(['Q'], ['K'], ['R', 'B', 'N']) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 1, goal: () => '퀸으로 꼬치 공격! 킹이 비키면 뒤의 말을 잡아요.' },
    { white: () => [lgPick(['N', 'P'])], black: () => [lgPick(['N', 'B', 'P']), 'P'], opts: { build: lgBuildSkewer(['R', 'B', 'Q'], ['K', 'Q'], ['R', 'B', 'N']) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 1, goal: () => '꼬치 공격할 줄을 찾아요.' },
    { white: () => [lgPick(['N', 'B']), 'P'], black: () => [lgPick(['N', 'B']), 'P', 'P'], opts: { build: lgBuildSkewer(['R', 'B', 'Q'], ['K', 'Q', 'K'], ['R', 'B', 'N', 'Q']) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 2, goal: () => '말이 많아요. 킹이나 퀸 뒤에 숨은 말을 찾아요.' },
  ]),
  'discover-v1': lgTactic('discover', 14001, [
    { white: () => [], black: () => [], opts: { build: lgBuildDiscover(['R', 'B', 'Q'], ['N', 'B'], ['K'], ['R', 'Q', 'B', 'N']) },
      ok: a => lgSafeN(a, 1, 3), goal: () => '내 말이 비키면 뒤의 긴 말이 체크해요. 어디로 비킬까요?' },
    { white: () => [], black: () => ['P'], opts: { build: lgBuildDiscover(['R', 'B', 'Q'], ['N', 'B', 'R'], ['K'], ['R', 'Q', 'N', 'B']) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 1, goal: () => '비키는 말을 잘 골라요. 체크하면서 무엇을 노릴까요?' },
    { white: () => [], black: () => ['P'], opts: { build: lgBuildDiscover(['R', 'B'], ['N', 'B', 'P'], ['Q'], null) },
      ok: a => lgSafeN(a, 1, 2), goal: () => '내 말이 비키면 긴 말이 상대 퀸을 노려요. 비키는 말로도 노려요!' },
    { white: () => [lgPick(['N', 'P'])], black: () => [lgPick(['N', 'B', 'P']), 'P'], opts: { build: lgBuildDiscover(['R', 'B', 'Q'], ['N', 'B', 'R', 'P'], ['K', 'Q'], ['R', 'B', 'N', 'Q']) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 1, goal: () => '비키면 길이 열리는 내 긴 말을 찾아요.' },
    { white: () => [lgPick(['N', 'B']), 'P'], black: () => [lgPick(['N', 'B', 'R']), 'P', 'P'], opts: { build: lgBuildDiscover(['R', 'B', 'Q'], ['N', 'B', 'R', 'P'], ['K', 'Q', 'K'], ['R', 'B', 'N', 'Q']) },
      ok: a => lgSafeN(a, 1, 2) && a.fail.length >= 2, goal: () => '말이 많아요. 막고 있는 내 말을 비켜 공격해요.' },
  ]),
  'promote-v1': { key: 'promote', kind: 'promote', seed: 15001, tiers: [
    { white: () => ['P'], black: () => [], opts: { wPawn: [1, 1] }, pre: b => lgNoThreat(b) && lrMoves(b, 'w').some(m => lrPromotes(b, m)),
      ok: a => a.goal.length >= 1 && a.fail.length === 0, goal: () => '폰이 끝 줄에 닿으면 퀸이 돼요! 폰을 올려요.' },
    { white: () => [], black: () => [lgPick(['R', 'B', 'N', 'Q'])], opts: { wPawn: [1, 1], build: (b) => { const c = Math.floor(lgRnd() * 8), d = lgPick([-1, 1]); if (c + d < 0 || c + d > 7 || b[1][c] || b[0][c + d]) return false; b[1][c] = 'wP'; b[0][c + d] = 'b' + lgPick(['N', 'B', 'R']); return true; } }, pre: b => lgNoThreat(b),
      ok: a => a.fail.length >= 1 && a.safe.length >= 1 && a.safe.every(x => x.cap), goal: () => '앞 칸이 위험하면, 잡으면서 올라갈 수도 있어요.' },
    { white: () => ['P', 'P'], black: () => [lgPick(['R', 'B', 'N', 'Q'])], opts: { wPawn: [1, 1] }, pre: b => lgNoThreat(b),
      ok: a => a.fail.length >= 1 && lgSafeN(a, 1, 2), goal: () => '어느 폰을 올려야 새 퀸이 안전할까요?' },
    { white: () => ['P', lgPick(['R', 'B', 'N'])], black: () => [lgPick(['R', 'B', 'N'])], opts: { wPawn: [1, 1], bk: { rows: [0, 1], cols: [0, 1, 2, 3, 4, 5, 6, 7] } }, pre: b => lgNoThreat(b),
      ok: a => a.fail.length >= 1 && lgSafeN(a, 1, 2) && a.fail.some(x => a.b[x.o.reply[0]][x.o.reply[1]][1] === 'K'), goal: () => '상대 킹 옆 칸은 위험해요. 안전하게 승격해요.' },
    { white: () => ['P', 'P', lgPick(['R', 'B', 'N'])], black: () => [lgPick(['R', 'Q']), lgPick(['B', 'N']), 'P'], opts: { wPawn: [1, 1] }, pre: b => lgNoThreat(b),
      ok: a => a.fail.length >= 2 && a.safe.length === 1, goal: () => '안전하게 퀸을 만들 수 있는 폰은 하나뿐이에요.' },
  ] },
});

// ===== 판 하나 만들기 =====
function lgSpec(id) { return LG_PROTECT[id] || LG_TOPICS[id] || null; }
// 후보 한 번: 배치 → 검사. 통과하면 분석 결과(점수·구성 서명 포함), 아니면 null.
function lgCandidate(id, ti, seen) {
  const spec = lgSpec(id), tier = spec.tiers[ti];
  const b = lgPlace(tier.white(), tier.black(), tier.opts || {}); if (!b) return null;
  const fen = lgFen(b); if (seen && seen.has(fen)) return null;
  let a;
  if (spec.kind === 'protect') {
    a = lgAnalyzeProtect(fen, !!spec.mustCapture, spec.mustCapture ? ti === 4 : true, tier.pre);
    if (!a || !a.safe.length || !a.fail.length || !tier.ok(a)) return null;
    a.score = lgScoreProtect(a); a.sig = a.threats.map(t => lgAt(a, t)[1]).join('') + '|' + a.white.map(p => p[1]).sort().join('');
  } else {
    a = lgAnalyzeKind(spec, tier, fen); if (!a || !tier.ok(a)) return null;
    a.score = lgScoreKind(a); a.sig = a.white.map(p => p[1]).sort().join('') + '|' + a.black.map(p => p[1]).sort().join('');
  }
  return a;
}
// 판 기록(교재 판·무한 연습 판 공통). index는 수업 안의 판 순서(첫 판만 안내 표시), 무한 연습은 -1.
function lgLevelOf(id, ti, a, index) {
  const spec = lgSpec(id), protect = spec.kind === 'protect';
  return { tier: ti + 1, fen: a.fen, goal: spec.tiers[ti].goal(a, index), ...(index === 0 ? { showThreat: true } : {}), ...(spec.mustCapture ? { mustCapture: true } : {}),
    witness: protect ? lgWitnessProtect(a, spec.key) : lgWitnessKind(a), trap: protect ? lgTrapProtect(a) : lgTrapKind(a), score: a.score, safe: a.safe.length, moves: a.moves.length };
}
// 저장된 배치를 다시 검사해 판 기록을 만든다(무한 연습 이어하기·파일 가져오기). 단계 조건을 통과하지 못하면 null.
const LG_FEN_CACHE = new Map();
function lgLevelFromFen(id, ti, fen) {
  const key = `${id}|${ti}|${fen}`;
  if (LG_FEN_CACHE.has(key)) return LG_FEN_CACHE.get(key);
  const level = lgLevelFromFenUncached(id, ti, fen);
  if (LG_FEN_CACHE.size > 200) LG_FEN_CACHE.clear();
  LG_FEN_CACHE.set(key, level);
  return level;
}
function lgLevelFromFenUncached(id, ti, fen) {
  const spec = lgSpec(id); if (!spec?.tiers[ti] || typeof fen !== 'string' || !/^[1-8KQRBNPkqrbnp/]{15,71} w - - 0 1$/.test(fen)) return null;
  let a;
  try {
    const rows = fen.split(' ')[0].split('/');
    if (rows.length !== 8 || rows.some(r => [...r].reduce((n, ch) => n + (/[1-8]/.test(ch) ? +ch : 1), 0) !== 8)) return null;
    const b = boardFromFEN(fen); if (b.flat().filter(p => p === 'wK').length !== 1 || b.flat().filter(p => p === 'bK').length !== 1) return null;
    const tier = spec.tiers[ti];
    if (spec.kind === 'protect') { a = lgAnalyzeProtect(fen, !!spec.mustCapture, spec.mustCapture ? ti === 4 : true, tier.pre); if (!a || !a.safe.length || !a.fail.length || !tier.ok(a)) return null; a.score = lgScoreProtect(a); }
    else { a = lgAnalyzeKind(spec, tier, fen); if (!a || !tier.ok(a)) return null; a.score = lgScoreKind(a); }
  } catch { return null; }
  return lgLevelOf(id, ti, a, -1);
}
// 무한 연습 판 만들기: 시드 하나로 결정되는 후보를 차례로 검사한다. step(ms)은 그만큼만 일하고 돌아와 화면이 멈추지 않게 한다.
const LG_DRILL_MAX_TRIES = 40000;
function lgDrillJob(id, ti, seed) {
  const band = (typeof LESSON_DRILL_BANDS !== 'undefined' && LESSON_DRILL_BANDS[id]?.[ti]) || null;
  const job = { id, ti, seed: seed >>> 0 || 1, rng: seed >>> 0 || 1, tries: 0, level: null, failed: false };
  job.step = (ms = 12) => {
    if (job.level || job.failed) return job.level;
    const saved = lgSeed, start = Date.now(); lgSeed = job.rng;
    try {
      while (Date.now() - start < ms && job.tries < LG_DRILL_MAX_TRIES) {
        job.tries++;
        const a = lgCandidate(id, ti, null);
        if (a && (!band || a.score >= band[0] && a.score <= band[1])) { job.level = lgLevelOf(id, ti, a, -1); break; }
      }
      if (!job.level && job.tries >= LG_DRILL_MAX_TRIES) job.failed = true;
    } finally { job.rng = lgSeed; lgSeed = saved; }
    return job.level;
  };
  return job;
}
// 판 번호: 시드를 짧은 글자로(같은 번호 = 같은 판)
function lgSeedCode(seed) { return (seed >>> 0).toString(36).toUpperCase().padStart(7, '0'); }
function lgSeedFromCode(code) { const n = parseInt(String(code || ''), 36); return Number.isFinite(n) && n > 0 && n <= 0xffffffff ? n >>> 0 : null; }
