#!/usr/bin/env node
// 체스 수업 판 생성기 (docs/lessons/LESSON_REDESIGN_V2.md §3)
// 수업마다 5단계 × 3판 = 15판. 단계마다 개념 조건으로 후보를 만들고, 난이도 점수가 판 번호를 따라 오르도록 고른다.
// 시드가 고정되어 같은 결과를 낸다. 결과는 js/lesson-levels.js에 쓴다(검토 후 커밋).
// 사용: node scripts/generate-lesson-levels.cjs [--check]  (--check는 파일을 쓰지 않고 결과만 비교)
const fs = require('node:fs'), path = require('node:path');
const load = require('../tests/harness.cjs');
const { run, context: C } = load();
run('globalThis.__CG = ChessGame');
const CG = C.__CG;
const NAMES = { K: '킹', Q: '퀸', R: '룩', B: '비숍', N: '나이트', P: '폰' };
const VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9 };
const josa = (w, pair) => C.lessonJosa(w, pair);
const sq = ([r, c]) => 'abcdefgh'[c] + (8 - r);

// 결정적 난수
let seed = 20261107;
function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const pick = list => list[Math.floor(rnd() * list.length)];

function fenOf(board) {
  return board.map(row => { let s = '', e = 0; for (const p of row) { if (!p) { e++; continue; } if (e) { s += e; e = 0; } s += p[0] === 'w' ? p[1] : p[1].toLowerCase(); } return s + (e || ''); }).join('/') + ' w - - 0 1';
}
// 킹은 가장자리 쪽에, 폰은 승격·첫 줄을 피한다.
function place(white, black) {
  const b = Array.from({ length: 8 }, () => Array(8).fill(null)), empty = (r, c) => !b[r][c];
  // 킹은 자기 진영에: 흰 킹은 아래쪽 두 줄, 검은 킹은 위쪽 두 줄(판의 방향이 늘 같다).
  const home = rows => { for (;;) { const r = pick(rows), c = pick([0, 1, 2, 5, 6, 7]); if (empty(r, c)) return [r, c]; } };
  const wk = home([7, 7, 6]); b[wk[0]][wk[1]] = 'wK';
  const bk = home([0, 0, 1]); b[bk[0]][bk[1]] = 'bK';
  const put = (color, type) => { for (let n = 0; n < 200; n++) { const r = type === 'P' ? (color === 'w' ? 2 + Math.floor(rnd() * 5) : 1 + Math.floor(rnd() * 5)) : Math.floor(rnd() * 8), c = Math.floor(rnd() * 8); if (empty(r, c)) { b[r][c] = color + type; return true; } } return false; };
  for (const t of white) if (!put('w', t)) return null;
  for (const t of black) if (!put('b', t)) return null;
  return b;
}
// 한 판의 분석: 모든 백 수의 결과와 난이도 특성
function analyze(fen, mustCapture, needThreat) {
  const g = CG.fromFEN(fen);
  if (g.status !== 'playing' || g.isAttacked(g.board, ...g.findKing('b'), 'w')) return null;
  // 처음 위협 유무는 계산이 싸므로 먼저 거른다.
  const early = C.lessonThreats(g).length;
  if (needThreat === true && !early || needThreat === false && early) return null;
  const level = { mustCapture }, moves = g.allMoves();
  if (moves.some(m => m[4])) return null;  // 승격 수가 있는 판은 쓰지 않는다
  const outs = moves.map(m => ({ m, o: C.lessonOutcome(g, m, level), cap: g.board[m[2]][m[3]] }));
  if (outs.some(x => !x.o) || outs.some(x => x.o.result === 'success' && x.o.check)) return null;  // 체크 덕분에만 안전한 수 금지
  const safe = outs.filter(x => x.o.result === 'success'), fail = outs.filter(x => x.o.result === 'fail');
  const threats = C.lessonThreats(g);
  if (threats.some(t => g.board[t[0]][t[1]][1] === 'K')) return null;  // 상대 킹이 공격자인 판은 쓰지 않는다
  if (outs.some(x => x.cap && g.board[x.m[0]][x.m[1]][1] === 'K')) return null;  // 내 킹으로 잡는 수가 있는 판도 쓰지 않는다
  const targets = [...new Set(threats.map(t => t[2] + ',' + t[3]))];
  const pieces = color => g.board.flat().filter(p => p && p[0] === color && p[1] !== 'K');
  return { g, fen, outs, safe, fail, moves, threats, targets, white: pieces('w'), black: pieces('b'), mustCapture };
}
const at = (a, [r, c]) => a.g.board[r][c];
const attackersOf = (a, target) => a.threats.filter(t => t[2] === target[0] && t[3] === target[1]).map(t => [t[0], t[1]]);
const movesOfPiece = (a, from) => a.outs.filter(x => x.m[0] === from[0] && x.m[1] === from[1]);
const failCaptures = a => a.fail.filter(x => x.cap);
// 난이도 점수: 안전한 수 비율이 낮을수록, 말이 많을수록, 함정(실패하는 잡기)이 많을수록, 보이지 않는 공격(나이트·폰)일수록 어렵다.
function score(a) {
  const hidden = a.threats.some(t => 'NP'.includes(at(a, t)[1])) ? 1 : 0;
  return +((1 - a.safe.length / a.moves.length) * 4 + (a.white.length - 1) * 0.8 + (a.black.length - 1) * 0.5 + Math.min(4, failCaptures(a).length) * 0.4 + hidden * 0.6 + Math.max(0, a.targets.length - 1) * 0.6).toFixed(3);
}

// ===== 수업별 단계 정의: 말 구성, 조건, 목표 문장 =====
const pieceOf = (a, target) => NAMES[at(a, target)[1]];
const oneThreat = a => a.targets.length === 1 && attackersOf(a, a.targets[0].split(',').map(Number)).length === 1;
const target0 = a => a.targets[0].split(',').map(Number);
const attacker0 = a => attackersOf(a, target0(a))[0];
const canTakeAttacker = a => a.outs.some(x => x.cap && a.threats.some(t => t[0] === x.m[2] && t[1] === x.m[3]));
const TIER_NAMES = ['첫걸음', '쉬움', '보통', '어려움', '도전'];
const LESSONS = [
  { id: 'protect-escape-v3', key: 'escape', mustCapture: false, tiers: [
    { white: () => [pick(['R', 'B', 'Q', 'N'])], black: () => [pick(['R', 'B', 'Q'])],
      ok: a => oneThreat(a) && !canTakeAttacker(a) && movesOfPiece(a, target0(a)).length >= 6 && movesOfPiece(a, target0(a)).filter(x => x.o.result === 'success').length / movesOfPiece(a, target0(a)).length >= 0.6,
      goal: (a, i) => `상대 ${josa(pieceOf(a, attacker0(a)), '이/가')} 내 ${josa(pieceOf(a, target0(a)), '을/를')} 노려요${i === 0 ? '(빨간 화살표)' : ''}. 안전한 칸으로 피해요.` },
    { white: () => [pick(['R', 'B', 'Q', 'N'])], black: () => [pick(['N', 'P', 'N']), pick(['P', 'B', 'R'])],
      ok: a => oneThreat(a) && 'NP'.includes(at(a, attacker0(a))[1]) && !canTakeAttacker(a) && (r => r >= 0.3 && r <= 0.7)(movesOfPiece(a, target0(a)).filter(x => x.o.result === 'success').length / Math.max(1, movesOfPiece(a, target0(a)).length)),
      goal: a => { const t = at(a, attacker0(a))[1]; return `상대 ${josa(NAMES[t], '이/가')} 내 ${josa(pieceOf(a, target0(a)), '을/를')} 노려요. ${t === 'N' ? '나이트는 L자로 뛰어와요.' : '폰은 대각선으로 잡아요.'}`; } },
    { white: () => [pick(['R', 'B', 'Q', 'N'])], black: () => [pick(['R', 'B', 'N']), pick(['R', 'B', 'N', 'P']), pick(['P', 'N'])],
      ok: a => oneThreat(a) && !canTakeAttacker(a) && movesOfPiece(a, target0(a)).length >= 5 && (n => n >= 1 && n <= 3)(movesOfPiece(a, target0(a)).filter(x => x.o.result === 'success').length),
      goal: a => { const n = movesOfPiece(a, target0(a)).filter(x => x.o.result === 'success').length; return `내 ${josa(pieceOf(a, target0(a)), '이/가')} 공격받아요. 안전한 칸은 ${n}개뿐이에요.`; } },
    { white: () => [pick(['R', 'B', 'N']), pick(['R', 'B', 'N', 'Q'])], black: () => [pick(['R', 'B', 'N']), pick(['P', 'N', 'B'])],
      ok: a => oneThreat(a) && a.safe.length >= 1 && a.safe.length <= 6 && a.safe.every(x => x.m[0] === target0(a)[0] && x.m[1] === target0(a)[1] || x.cap),
      goal: () => '내 말 하나가 공격받아요. 어떤 말인지 찾아 지켜요.' },
    { white: () => [pick(['R', 'B', 'N']), pick(['R', 'N', 'Q']), 'P', 'P'], black: () => [pick(['R', 'B', 'N']), pick(['B', 'N', 'Q']), 'P', 'P'],
      ok: a => a.targets.length === 1 && a.safe.length >= 1 && a.safe.length <= 4,
      goal: () => '말이 많아요. 노려지는 내 말을 찾아 지켜요.' },
  ] },
  { id: 'protect-capture-v3', key: 'capture', mustCapture: true, tiers: [
    { white: () => [pick(['R', 'Q', 'B'])], black: () => ['P', 'P', pick(['B', 'R'])],
      ok: a => !a.threats.length && a.outs.filter(x => x.cap).length === 2 && a.safe.length === 1 && failCaptures(a).length === 1 && 'BR'.includes(at(a, [failCaptures(a)[0].o.reply[0], failCaptures(a)[0].o.reply[1]])[1]),
      goal: (a, i) => i === 0 ? '상대 말 하나를 잡아요. 빨간 화살표는 그 말을 지키는 상대 말이에요.' : `상대 말 하나를 잡아요. 잡은 뒤에도 내 ${josa(NAMES[a.white[0][1]], '이/가')} 안전하게!` },
    { white: () => [pick(['R', 'Q', 'B', 'N'])], black: () => [pick(['P', 'N']), pick(['P', 'B', 'N']), pick(['N', 'P'])],
      ok: a => !a.threats.length && a.outs.filter(x => x.cap).length === 2 && a.safe.length === 1 && failCaptures(a).length === 1 && 'NPK'.includes(failCaptures(a)[0].o.after.board[failCaptures(a)[0].o.reply[0]][failCaptures(a)[0].o.reply[1]][1]),
      goal: a => { const f = failCaptures(a)[0], d = NAMES[f.o.after.board[f.o.reply[0]][f.o.reply[1]][1]]; return `상대 말 하나를 잡아요. 상대 ${d}도 말을 지켜요.`; } },
    { white: () => [pick(['R', 'Q', 'B', 'N'])], black: () => [pick(['N', 'B', 'R']), pick(['P', 'N', 'B']), pick(['P', 'N']), pick(['P', 'B'])],
      ok: a => !a.threats.length && a.outs.filter(x => x.cap).length >= 3 && a.safe.length === 1 && failCaptures(a).some(x => VALUE[x.cap[1]] > VALUE[a.safe[0].cap[1]]),
      goal: () => '잡을 수 있는 말이 여러 개예요. 안전하게 잡을 수 있는 하나는?' },
    { white: () => [pick(['R', 'B', 'N', 'Q']), pick(['R', 'B', 'N'])], black: () => [pick(['N', 'B', 'R']), pick(['P', 'N', 'B']), pick(['P', 'N', 'R'])],
      attempts: 300000, ok: a => !a.threats.length && a.safe.length >= 1 && a.safe.length <= 2 && new Set(a.outs.filter(x => x.cap).map(x => x.m[0] + ',' + x.m[1])).size === 2 && a.fail.some(x => x.cap && !(x.o.reply[2] === x.m[2] && x.o.reply[3] === x.m[3])),
      goal: () => '내 말 두 개로 잡을 수 있어요. 잡은 뒤 내 말이 모두 안전한 쪽은?' },
    { white: () => [pick(['Q', 'R', 'B', 'N']), pick(['R', 'B', 'N']), 'P'], black: () => [pick(['R', 'B', 'N']), pick(['P', 'N', 'B']), pick(['P', 'N', 'B', 'R']), 'P'],
      ok: a => a.targets.length === 1 && a.safe.length >= 1 && a.safe.length <= 2 && a.safe.every(x => x.m[0] === target0(a)[0] && x.m[1] === target0(a)[1]),
      goal: a => `내 ${josa(pieceOf(a, target0(a)), '이/가')} 공격받아요! 상대 말을 잡으면서 피해요.` },
  ] },
  { id: 'protect-all-v3', key: 'all', mustCapture: false, tiers: [
    { white: () => [pick(['R', 'B', 'Q', 'N']), pick(['R', 'B', 'N'])], black: () => [pick(['R', 'B', 'N'])],
      ok: a => oneThreat(a) && a.safe.some(x => x.cap && x.m[2] === attacker0(a)[0] && x.m[3] === attacker0(a)[1]) && a.safe.length >= 3,
      goal: a => `상대 ${josa(pieceOf(a, attacker0(a)), '이/가')} 내 ${josa(pieceOf(a, target0(a)), '을/를')} 노려요. 피하거나, 그 말을 잡아도 돼요.` },
    { white: () => [pick(['R', 'B', 'N', 'Q']), pick(['R', 'B', 'N'])], black: () => ['P', 'P', pick(['N', 'B'])],
      ok: a => oneThreat(a) && at(a, attacker0(a))[1] === 'P' && a.fail.some(x => x.cap && x.m[2] === attacker0(a)[0] && x.m[3] === attacker0(a)[1]) && a.safe.length >= 2,
      goal: a => `상대 폰이 내 ${josa(pieceOf(a, target0(a)), '을/를')} 노려요. 지켜진 폰은 잡지 말아요.` },
    { white: () => [pick(['R', 'B', 'Q']), pick(['R', 'B', 'N']), pick(['P', 'N'])], black: () => [pick(['N', 'N', 'B', 'R', 'Q']), pick(['P', 'B'])],
      ok: a => a.targets.length >= 2 && new Set(a.threats.map(t => t[0] + ',' + t[1])).size === 1 && a.safe.length >= 1 && a.safe.length <= 2,
      goal: a => `상대 ${josa(NAMES[at(a, [a.threats[0][0], a.threats[0][1]])[1]], '이/가')} 내 말 두 개를 노려요. 둘 다 지키는 방법은?` },
    { white: () => [pick(['R', 'B', 'Q']), pick(['R', 'B', 'N', 'Q']), pick(['N', 'P'])], black: () => [pick(['R', 'B', 'Q']), pick(['N', 'B', 'P']), 'P'],
      ok: a => a.targets.length >= 1 && a.safe.length >= 1 && a.safe.length <= 4 && a.fail.some(x => !(x.o.reply[2] === x.m[2] && x.o.reply[3] === x.m[3]) && !a.threats.some(t => t[2] === x.o.reply[2] && t[3] === x.o.reply[3])),
      goal: () => '내 말을 옮기면 뒤에 있던 말이 드러날 수 있어요. 조심해서 지켜요.' },
    { white: () => [pick(['R', 'Q']), pick(['B', 'N']), pick(['B', 'N', 'R']), 'P', 'P'], black: () => [pick(['R', 'Q']), pick(['B', 'N']), pick(['B', 'N', 'P']), 'P', 'P'],
      ok: a => a.targets.length >= 1 && a.targets.length <= 2 && a.safe.length >= 1 && a.safe.length <= 4,
      goal: () => '실전처럼 말이 많아요. 잡힐 수 있는 내 말이 없게!' },
  ] },
];
// 예시 정답과 함정: 사람이 떠올릴 법한 수를 고른다.
function witnessOf(a, lessonKey) {
  const t = a.targets.length ? target0(a) : null, attackers = new Set(a.threats.map(m => m[0] + ',' + m[1]));
  const pref = [x => a.mustCapture && x.cap, x => lessonKey === 'all' && x.cap && attackers.has(x.m[2] + ',' + x.m[3]), x => t && x.m[0] === t[0] && x.m[1] === t[1], () => true];
  for (const p of pref) { const hit = a.safe.find(p); if (hit) return hit.m.slice(0, 4); }
}
function trapOf(a) {
  // 판이 가르치려는 상대 말이 잡는 함정을 먼저 고른다(상대 킹이 옆 칸을 잡는 함정은 뒤로).
  const t = a.targets.length ? target0(a) : null, attackers = new Set(a.threats.map(m => m[0] + ',' + m[1]));
  const byKing = x => x.o.after.board[x.o.reply[0]][x.o.reply[1]][1] === 'K', byAttacker = x => attackers.has(x.o.reply[0] + ',' + x.o.reply[1]);
  const pref = [x => x.cap && !byKing(x), x => t && x.m[0] === t[0] && x.m[1] === t[1] && byAttacker(x), x => t && x.m[0] === t[0] && x.m[1] === t[1] && !byKing(x),
    x => !(x.o.reply[2] === x.m[2] && x.o.reply[3] === x.m[3]) && !byKing(x), x => !byKing(x), () => true];
  for (const p of pref) { const hit = a.fail.find(p); if (hit) return hit.m.slice(0, 4); }
}

function generate(lesson) {
  const levels = [], seen = new Set();
  let floor = 0;
  lesson.tiers.forEach((tier, ti) => {
    const pool = [];
    for (let n = 0; n < (tier.attempts || 60000) && pool.length < 120; n++) {
      const b = place(tier.white(), tier.black()); if (!b) continue;
      const fen = fenOf(b); if (seen.has(fen)) continue;
      const a = analyze(fen, lesson.mustCapture, lesson.mustCapture ? ti === 4 : true); if (!a || !a.safe.length || !a.fail.length || !tier.ok(a)) continue;
      a.score = score(a); a.sig = a.threats.map(t => at(a, t)[1]).join('') + '|' + a.white.map(p => p[1]).sort().join(''); pool.push(a); seen.add(fen);
    }
    // 단계 안에서는 서로 다른 구성으로 세 판을 쉬운 순서대로 고른다. 단계 사이의 난이도 상승은 검사로 확인한다.
    pool.sort((x, y) => x.score - y.score);
    if (pool.length < 3) throw Error(`${lesson.id} ${ti + 1}단계 후보 부족: ${pool.length}개`);
    const above = pool.filter(a => a.score >= floor), sorted = above.length >= 3 ? above : pool;
    if (sorted === pool && floor) console.warn(`${lesson.id} ${ti + 1}단계: 앞 판(${floor})보다 어려운 후보가 부족해 단계 안 순서로 고름`);
    const chosen = [], sigs = new Set();
    for (const q of [0.2, 0.5, 0.8]) {
      const start = Math.floor(q * (sorted.length - 1));
      const cand = sorted.slice(start).find(a => !chosen.includes(a) && !sigs.has(a.sig) && (!chosen.length || a.score >= chosen.at(-1).score)) || sorted.slice(start).find(a => !chosen.includes(a) && (!chosen.length || a.score >= chosen.at(-1).score));
      if (!cand) throw Error(`${lesson.id} ${ti + 1}단계 고르기 실패`);
      chosen.push(cand); sigs.add(cand.sig);
    }
    floor = chosen.at(-1).score;
    chosen.forEach(a => {
      const index = levels.length;
      levels.push({ id: `${lesson.key}-${String(index + 1).padStart(2, '0')}`, tier: ti + 1, fen: a.fen, goal: tier.goal(a, index), ...(index === 0 ? { showThreat: true } : {}), ...(lesson.mustCapture ? { mustCapture: true } : {}), witness: witnessOf(a, lesson.key), trap: trapOf(a), score: a.score, safe: a.safe.length, moves: a.moves.length });
    });
  });
  return levels;
}

const out = {};
for (const lesson of LESSONS) out[lesson.id] = generate(lesson);
const file = path.join(__dirname, '..', 'js', 'lesson-levels.js');
const body = `// 자동 생성: node scripts/generate-lesson-levels.cjs (직접 고치지 말고 생성기를 고친다)\n// 수업마다 5단계(${TIER_NAMES.join('·')}) × 3판. score는 난이도 점수, safe/moves는 안전한 수/전체 수.\nconst LESSON_TIER_NAMES = ${JSON.stringify(TIER_NAMES)};\nconst LESSON_LEVEL_DATA = ${JSON.stringify(out, null, 1).replace(/\[\n\s+(-?\d+),\n\s+(-?\d+),\n\s+(-?\d+),\n\s+(-?\d+)\n\s+\]/g, '[$1, $2, $3, $4]')};\n`;
if (process.argv.includes('--check')) { const same = fs.existsSync(file) && fs.readFileSync(file, 'utf8') === body; console.log(same ? '생성 결과가 저장된 파일과 같습니다.' : '생성 결과가 저장된 파일과 다릅니다.'); process.exitCode = same ? 0 : 1; }
else { fs.writeFileSync(file, body); console.log('저장:', path.relative(process.cwd(), file)); }
for (const [id, levels] of Object.entries(out)) {
  console.log(`\n${id}`);
  for (const l of levels) console.log(` ${l.id} ${TIER_NAMES[l.tier - 1]} 점수 ${l.score} 안전 ${l.safe}/${l.moves}  ${l.fen.split(' ')[0]}  예시 ${sq(l.witness)}${sq(l.witness.slice(2))} 함정 ${sq(l.trap)}${sq(l.trap.slice(2))}  ${l.goal}`);
}
