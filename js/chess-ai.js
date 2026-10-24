// ===== 컴퓨터 대전 AI: 난이도별 수 선택 (페이지 · Web Worker 겸용) =====
// 규칙은 ChessGame과 똑같이 맞춘다: 캐슬링 없음, 앙파상 있음, 프로모션은 퀸 고정.
// 보드는 0x88 배열(sq = 행*16 + 열, 0행이 흑 쪽), 기물 코드는 흰색 1~6 / 검은색 9~14.

// depth: 탐색 깊이, quiesce: 잡기 연쇄 끝까지 보기, margin: 최선 수와 이 점수(센티폰) 차이 안의 수 중 무작위
const AI_LEVELS = [
  { random: true },                                  // 매우 쉬움: 아무 수나
  { depth: 1, quiesce: false, margin: 150 },         // 쉬움: 눈앞의 기물만 노림
  { depth: 2, quiesce: true, margin: 60 },           // 보통: 공짜로 내주는 기물은 피함
  { depth: 3, quiesce: true, margin: 20, timeMs: 1500 },  // 어려움
  { depth: 6, quiesce: true, margin: 5, timeMs: 1200 },   // 매우 어려움: 시간 안에서 최대한 깊게
];

const AI_VAL = [0, 100, 320, 330, 500, 900, 20000];
const AI_CODE = { P: 1, N: 2, B: 3, R: 4, Q: 5, K: 6 };
const AI_MATE = 100000;
const AI_INF = 1000000;
const AI_N_DIRS = [-33, -31, -18, -14, 14, 18, 31, 33];
const AI_K_DIRS = [-17, -16, -15, -1, 1, 15, 16, 17];
const AI_B_DIRS = [-17, -15, 15, 17];
const AI_R_DIRS = [-16, -1, 1, 16];
const AI_SQUARES = [];
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) AI_SQUARES.push(r * 16 + c);
const AI_NAMES = [];
for (const [k, v] of Object.entries(AI_CODE)) { AI_NAMES[v] = 'w' + k; AI_NAMES[v | 8] = 'b' + k; }

// 위치 점수표 (흰색 기준, 0행 = 8랭크)
const AI_PST = [
  null,
  [ 0,  0,  0,  0,  0,  0,  0,  0,
   50, 50, 50, 50, 50, 50, 50, 50,
   10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0],
  [-50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 10, 15, 15, 10,  0,-30,
   -30,  5, 15, 20, 20, 15,  5,-30,
   -30,  0, 15, 20, 20, 15,  0,-30,
   -30,  5, 10, 15, 15, 10,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50],
  [-20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5, 10, 10,  5,  0,-10,
   -10,  5,  5, 10, 10,  5,  5,-10,
   -10,  0, 10, 10, 10, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20],
  [ 0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0],
  [-20,-10,-10, -5, -5,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
     0,  0,  5,  5,  5,  5,  0, -5,
   -10,  5,  5,  5,  5,  5,  0,-10,
   -10,  0,  5,  0,  0,  0,  0,-10,
   -20,-10,-10, -5, -5,-10,-10,-20],
  // 킹(중반): 캐슬링이 없으니 손으로 옮기며 수를 낭비하지 않게 첫 줄은 거의 평평하게
  [-30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
   -10,-10,-15,-20,-20,-15,-10,-10,
     0,  5,  0,  0,  0,  0,  5,  0],
];
const AI_KING_END = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50];

// ChessGame 상태 → 엔진 상태
function aiFromPosition(position) {
  const board = new Int8Array(128);
  const king = [-1, -1];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = position.board[r][c];
      if (!p) continue;
      const code = AI_CODE[p[1]] | (p[0] === 'b' ? 8 : 0);
      board[r * 16 + c] = code;
      if ((code & 7) === 6) king[code >> 3] = r * 16 + c;
    }
  }
  const ep = position.enPassant ? position.enPassant[0] * 16 + position.enPassant[1] : -1;
  return { board, side: position.turn === 'b' ? 1 : 0, ep, king, hist: [] };
}

// 수 = from | to<<7 | flags<<14 (1: 앙파상, 2: 폰 두 칸, 4: 프로모션)
function aiGenMoves(pos, capturesOnly, out) {
  const b = pos.board, side = pos.side, opp = side ^ 1;
  let n = 0;
  for (let i = 0; i < 64; i++) {
    const sq = AI_SQUARES[i], p = b[sq];
    if (!p || (p >> 3) !== side) continue;
    const type = p & 7;
    if (type === 1) {
      const dir = side ? 16 : -16;
      const promoRow = side ? 7 : 0;
      const to = sq + dir;
      if (!(to & 0x88) && !b[to]) {
        const promo = (to >> 4) === promoRow;
        if (!capturesOnly || promo) out[n++] = sq | (to << 7) | (promo ? 4 << 14 : 0);
        if (!capturesOnly && (sq >> 4) === (side ? 1 : 6) && !b[to + dir]) out[n++] = sq | ((to + dir) << 7) | (2 << 14);
      }
      for (const t of [to - 1, to + 1]) {
        if (t & 0x88) continue;
        if (b[t] && (b[t] >> 3) === opp) out[n++] = sq | (t << 7) | ((t >> 4) === promoRow ? 4 << 14 : 0);
        else if (t === pos.ep) out[n++] = sq | (t << 7) | (1 << 14);
      }
    } else if (type === 2 || type === 6) {
      const dirs = type === 2 ? AI_N_DIRS : AI_K_DIRS;
      for (let d = 0; d < 8; d++) {
        const t = sq + dirs[d];
        if (t & 0x88) continue;
        const q = b[t];
        if (q ? (q >> 3) === opp : !capturesOnly) out[n++] = sq | (t << 7);
      }
    } else {
      const dirs = type === 3 ? AI_B_DIRS : type === 4 ? AI_R_DIRS : AI_K_DIRS;
      for (let d = 0; d < dirs.length; d++) {
        let t = sq + dirs[d];
        while (!(t & 0x88)) {
          const q = b[t];
          if (q) { if ((q >> 3) === opp) out[n++] = sq | (t << 7); break; }
          if (!capturesOnly) out[n++] = sq | (t << 7);
          t += dirs[d];
        }
      }
    }
  }
  return n;
}

function aiAttacked(b, sq, by) {
  const pawn = by ? 9 : 1;
  const pd = by ? -16 : 16;
  for (const t of [sq + pd - 1, sq + pd + 1]) if (!(t & 0x88) && b[t] === pawn) return true;
  const knight = (by << 3) | 2, king = (by << 3) | 6;
  for (let d = 0; d < 8; d++) {
    let t = sq + AI_N_DIRS[d];
    if (!(t & 0x88) && b[t] === knight) return true;
    t = sq + AI_K_DIRS[d];
    if (!(t & 0x88) && b[t] === king) return true;
  }
  const bishop = (by << 3) | 3, rook = (by << 3) | 4, queen = (by << 3) | 5;
  for (let d = 0; d < 4; d++) {
    let t = sq + AI_B_DIRS[d];
    while (!(t & 0x88)) {
      const q = b[t];
      if (q) { if (q === bishop || q === queen) return true; break; }
      t += AI_B_DIRS[d];
    }
    t = sq + AI_R_DIRS[d];
    while (!(t & 0x88)) {
      const q = b[t];
      if (q) { if (q === rook || q === queen) return true; break; }
      t += AI_R_DIRS[d];
    }
  }
  return false;
}

function aiMake(pos, m) {
  const b = pos.board, from = m & 127, to = (m >> 7) & 127, flags = m >> 14;
  const p = b[from];
  let capSq = to;
  if (flags & 1) capSq = to + (pos.side ? -16 : 16);
  pos.hist.push(b[capSq], capSq, pos.ep);
  b[capSq] = 0;
  b[to] = (flags & 4) ? ((p & 8) | 5) : p;
  b[from] = 0;
  if ((p & 7) === 6) pos.king[pos.side] = to;
  pos.ep = (flags & 2) ? (from + to) >> 1 : -1;
  pos.side ^= 1;
}

function aiUnmake(pos, m) {
  const b = pos.board, from = m & 127, to = (m >> 7) & 127, flags = m >> 14;
  pos.side ^= 1;
  pos.ep = pos.hist.pop();
  const capSq = pos.hist.pop(), cap = pos.hist.pop();
  const p = b[to];
  b[from] = (flags & 4) ? ((p & 8) | 1) : p;
  b[to] = 0;
  b[capSq] = cap;
  if ((p & 7) === 6) pos.king[pos.side] = from;
}

// 방금 둔 쪽의 킹이 공격받으면 불법 수
function aiLeftInCheck(pos) {
  return aiAttacked(pos.board, pos.king[pos.side ^ 1], pos.side);
}

function aiCenterDist(sq) {
  const r = sq >> 4, c = sq & 7;
  return Math.max(3 - r, r - 4) + Math.max(3 - c, c - 4);
}

// 둘 차례인 쪽 기준 점수
function aiEvaluate(pos) {
  const b = pos.board;
  const score = [0, 0], minor = [0, 0];
  const strong = [0, 0], minors = [0, 0];  // 폰·룩·퀸 수, 나이트·비숍 수
  let knights = 0, bishopSquares = 0;       // bishopSquares: 비숍이 있는 칸 색 (비트 1 = 밝은 칸, 2 = 어두운 칸)
  for (let i = 0; i < 64; i++) {
    const sq = AI_SQUARES[i], p = b[sq];
    if (!p) continue;
    const color = p >> 3, type = p & 7;
    score[color] += AI_VAL[type];
    if (type === 6) continue;
    if (type !== 1) minor[color] += AI_VAL[type];
    if (type === 1 || type >= 4) strong[color]++;
    else { minors[color]++; if (type === 2) knights++; else bishopSquares |= 1 << (((sq >> 4) + (sq & 7)) & 1); }
    score[color] += AI_PST[type][color ? (7 - (sq >> 4)) * 8 + (sq & 7) : i];
  }
  // ChessGame과 같은 기준: 체크메이트할 기물이 없으면 무승부
  if (!strong[0] && !strong[1] && (minors[0] + minors[1] <= 1 || (!knights && bishopSquares !== 3))) return 0;
  const endgame = minor[0] + minor[1] <= 1600;
  for (let color = 0; color < 2; color++) {
    const sq = pos.king[color];
    const idx = color ? (7 - (sq >> 4)) * 8 + (sq & 7) : (sq >> 4) * 8 + (sq & 7);
    score[color] += endgame ? AI_KING_END[idx] : AI_PST[6][idx];
  }
  // 이기고 있는 끝내기: 상대 킹을 구석으로 몰고 내 킹을 붙여서 체크메이트까지 가게 함
  const lead = score[0] - score[1];
  if (endgame && Math.abs(lead) >= 400) {
    const win = lead > 0 ? 0 : 1;
    const wk = pos.king[win], lk = pos.king[win ^ 1];
    const dist = Math.abs((wk >> 4) - (lk >> 4)) + Math.abs((wk & 7) - (lk & 7));
    score[win] += 10 * aiCenterDist(lk) + 4 * (14 - dist);
  }
  // 폰·룩·퀸 없이 마이너 기물 하나뿐인 쪽은 이길 수 없으니 그쪽 우세는 인정하지 않음
  let result = score[0] - score[1];
  if (result > 0 && !strong[0] && minors[0] <= 1) result = 0;
  if (result < 0 && !strong[1] && minors[1] <= 1) result = 0;
  return pos.side ? -result : result;
}

// ChessGame.positionKey()와 같은 형식
function aiPositionKey(pos) {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let row = '';
    for (let c = 0; c < 8; c++) row += AI_NAMES[pos.board[r * 16 + c]] || '--';
    rows.push(row);
  }
  return rows.join('/') + (pos.side ? 'b' : 'w') + (pos.ep >= 0 ? '' + (pos.ep >> 4) + (pos.ep & 7) : '-');
}

// 두면 3번 반복이나 50수 규칙으로 바로 비기게 되는 수
// (잡기·폰 이동은 새 장면이라 해당 없고, 그 수로 체크메이트가 되면 체크메이트가 우선)
function aiRuleDrawMoves(pos, moves, position) {
  const repeated = new Set(position.repeated || []);
  const fifty = (position.halfmove || 0) >= 99;
  const draws = new Set();
  if (!repeated.size && !fifty) return draws;
  for (const m of moves) {
    const from = m & 127, to = (m >> 7) & 127;
    if ((pos.board[from] & 7) === 1 || pos.board[to]) continue;
    aiMake(pos, m);
    const mate = aiAttacked(pos.board, pos.king[pos.side], pos.side ^ 1) && !aiLegalRootMoves(pos).length;
    if (!mate && (fifty || repeated.has(aiPositionKey(pos)))) draws.add(m);
    aiUnmake(pos, m);
  }
  return draws;
}

// ---- 탐색 ----
const AI_MAX_PLY = 64;
const aiMoveBuf = [], aiKeyBuf = [];
for (let i = 0; i < AI_MAX_PLY; i++) { aiMoveBuf.push(new Int32Array(256)); aiKeyBuf.push(new Int32Array(256)); }
let aiNodes = 0, aiDeadline = 0, aiAborted = false, aiQuiesce = true, aiExtendLimit = 0;
let aiKillers = [];

function aiOrderKeys(pos, moves, keys, n, ply) {
  const b = pos.board, k = aiKillers[ply];
  for (let i = 0; i < n; i++) {
    const m = moves[i], from = m & 127, to = (m >> 7) & 127, flags = m >> 14;
    const victim = (flags & 1) ? 1 : (b[to] & 7);
    let key = 0;
    if (victim) key = 1000 + victim * 10 - (b[from] & 7);
    if (flags & 4) key += 900;
    if (!key && k) key = m === k[0] ? 500 : m === k[1] ? 400 : 0;
    keys[i] = key;
  }
}

// 남은 수 중 점수가 가장 높은 것을 i 자리로 당겨옴
function aiPickNext(moves, keys, i, n) {
  let best = i;
  for (let j = i + 1; j < n; j++) if (keys[j] > keys[best]) best = j;
  if (best !== i) {
    const m = moves[i]; moves[i] = moves[best]; moves[best] = m;
    const k = keys[i]; keys[i] = keys[best]; keys[best] = k;
  }
  return moves[i];
}

function aiTimeUp() {
  if ((++aiNodes & 2047) === 0 && aiDeadline && Date.now() > aiDeadline) aiAborted = true;
  return aiAborted;
}

function aiQsearch(pos, alpha, beta, ply) {
  if (aiTimeUp()) return 0;
  const stand = aiEvaluate(pos);
  if (stand >= beta || ply >= AI_MAX_PLY - 1) return stand;
  if (stand > alpha) alpha = stand;
  const moves = aiMoveBuf[ply], keys = aiKeyBuf[ply];
  const n = aiGenMoves(pos, true, moves);
  aiOrderKeys(pos, moves, keys, n, ply);
  for (let i = 0; i < n; i++) {
    const m = aiPickNext(moves, keys, i, n);
    aiMake(pos, m);
    if (aiLeftInCheck(pos)) { aiUnmake(pos, m); continue; }
    const score = -aiQsearch(pos, -beta, -alpha, ply + 1);
    aiUnmake(pos, m);
    if (aiAborted) return 0;
    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function aiNegamax(pos, depth, alpha, beta, ply) {
  if (aiTimeUp()) return 0;
  const inCheck = aiAttacked(pos.board, pos.king[pos.side], pos.side ^ 1);
  if (inCheck && ply < aiExtendLimit) depth++;
  if (depth <= 0 || ply >= AI_MAX_PLY - 1) return aiQuiesce ? aiQsearch(pos, alpha, beta, ply) : aiEvaluate(pos);
  const moves = aiMoveBuf[ply], keys = aiKeyBuf[ply];
  const n = aiGenMoves(pos, false, moves);
  aiOrderKeys(pos, moves, keys, n, ply);
  let best = -AI_INF, legal = 0;
  for (let i = 0; i < n; i++) {
    const m = aiPickNext(moves, keys, i, n);
    aiMake(pos, m);
    if (aiLeftInCheck(pos)) { aiUnmake(pos, m); continue; }
    legal++;
    const score = -aiNegamax(pos, depth - 1, -beta, -alpha, ply + 1);
    aiUnmake(pos, m);
    if (aiAborted) return 0;
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) {
      if (keys[i] < 900) {
        const k = aiKillers[ply] || (aiKillers[ply] = [0, 0]);
        if (k[0] !== m) { k[1] = k[0]; k[0] = m; }
      }
      break;
    }
  }
  if (!legal) return inCheck ? -AI_MATE + ply : 0;
  return best;
}

function aiLegalRootMoves(pos) {
  const buf = new Int32Array(256);
  const n = aiGenMoves(pos, false, buf);
  const legal = [];
  for (let i = 0; i < n; i++) {
    aiMake(pos, buf[i]);
    if (!aiLeftInCheck(pos)) legal.push(buf[i]);
    aiUnmake(pos, buf[i]);
  }
  return legal;
}

// position: { board: 8x8 ('wP' 등 또는 null), turn: 'w'|'b', enPassant: [r,c]|null,
//             halfmove: 50수 규칙 카운트, repeated: 이미 두 번 나온 장면 키 목록 }
// 반환: [fromR, fromC, toR, toC] 또는 null(둘 수 있는 수 없음)
function aiChooseMove(position, levelIdx) {
  const level = AI_LEVELS[levelIdx] || AI_LEVELS[1];
  const pos = aiFromPosition(position);
  let moves = aiLegalRootMoves(pos);
  if (!moves.length) return null;
  let pick = moves[Math.floor(Math.random() * moves.length)];

  if (!level.random) {
    aiNodes = 0;
    aiAborted = false;
    aiQuiesce = level.quiesce;
    aiKillers = [];
    aiDeadline = level.timeMs ? Date.now() + level.timeMs : 0;
    const ruleDraws = aiRuleDrawMoves(pos, moves, position);
    let scores = null;
    for (let depth = 1; depth <= level.depth; depth++) {
      aiExtendLimit = depth * 2;
      const cur = new Map();
      let best = -AI_INF;
      for (const m of moves) {
        aiMake(pos, m);
        // 최선 수와 margin 안에 드는 수만 정확한 점수가 필요하므로 그 아래는 잘라냄
        const floor = best === -AI_INF ? -AI_INF : best - level.margin - 1;
        let score = -aiNegamax(pos, depth - 1, -AI_INF, -floor, 1);
        aiUnmake(pos, m);
        if (aiAborted) break;
        // 두는 순간 대국이 비기며 끝나므로 그 뒤 수읽기와 상관없이 0점
        if (ruleDraws.has(m)) score = 0;
        cur.set(m, score);
        if (score > best) best = score;
      }
      if (aiAborted && scores) break;
      scores = cur;
      if (aiAborted) break;
      // 다음 깊이는 이번 점수 순으로 탐색해서 가지치기를 빠르게
      moves = moves.filter(m => cur.has(m)).sort((a, b) => cur.get(b) - cur.get(a));
      if (best >= AI_MATE - AI_MAX_PLY) break;
    }
    if (scores && scores.size) {
      let best = -AI_INF;
      for (const s of scores.values()) if (s > best) best = s;
      const cands = [...scores.keys()].filter(m => scores.get(m) >= best - level.margin);
      pick = cands[Math.floor(Math.random() * cands.length)];
    }
  }
  const from = pick & 127, to = (pick >> 7) & 127;
  return [from >> 4, from & 7, to >> 4, to & 7];
}

// Web Worker로 실행될 때: 메시지로 받은 국면에 대한 수를 돌려줌
if (typeof document === 'undefined' && typeof self !== 'undefined' && typeof importScripts === 'function') {
  self.onmessage = e => {
    const { id, position, level } = e.data;
    let move = null;
    try { move = aiChooseMove(position, level); } catch (err) { move = null; }
    self.postMessage({ id, move });
  };
}
