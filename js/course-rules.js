// 승급 과정 판정 (docs/PREMIUM_COURSE.md §3)
// 좌표 [row,col] = [8-rank, fileIndex], 수는 [fr,fc,tr,tc(,승격)]. 과정 판은 모두 백(나) 차례에서 시작한다.
// 두 수 메이트는 대전 AI의 빠른 수 생성기(chess-ai.js)로 모든 수를 끝까지 확인하고,
// 끝내기(퀸·룩·폰)는 가능한 모든 국면의 결과를 미리 계산한 표로 판정한다. 추측하거나 시간 제한으로 자르지 않는다.

// ===== 빠른 수 생성 도우미 =====
const CR_BUF = Array.from({ length: 10 }, () => new Int32Array(256));
function crPos(board, turn = 'w') { return aiFromPosition({ board, turn, enPassant: null, castling: {} }); }
function crInCheck(pos) { return aiAttacked(pos.board, pos.king[pos.side], pos.side ^ 1); }
function crLegal(pos, ply) {
  const buf = CR_BUF[ply], n = aiGenMoves(pos, false, buf), out = [];
  for (let i = 0; i < n; i++) { const m = buf[i]; if (crPromoMinor(m)) continue; aiMake(pos, m); if (!aiLeftInCheck(pos)) out.push(m); aiUnmake(pos, m); }
  return out;
}
// 과정 판은 승격을 퀸으로만 센다(수업과 같은 규칙). 비숍·나이트·룩 승격 수는 건너뛴다.
function crPromoMinor(m) { const f = m >> 14; return (f & 4) && ((f >> 4) || 5) !== 5; }
function crHasLegal(pos, ply) {
  const buf = CR_BUF[ply], n = aiGenMoves(pos, false, buf);
  for (let i = 0; i < n; i++) { const m = buf[i]; aiMake(pos, m); const ok = !aiLeftInCheck(pos); aiUnmake(pos, m); if (ok) return true; }
  return false;
}
// 둘 차례인 쪽이 한 수에 체크메이트할 수 있는가
function crMateIn1Exists(pos, ply) {
  const buf = CR_BUF[ply], n = aiGenMoves(pos, false, buf);
  for (let i = 0; i < n; i++) {
    const m = buf[i]; if (crPromoMinor(m)) continue;
    aiMake(pos, m);
    const mate = !aiLeftInCheck(pos) && crInCheck(pos) && !crHasLegal(pos, ply + 1);
    aiUnmake(pos, m);
    if (mate) return true;
  }
  return false;
}
function crCountMateIn1(pos, ply) {
  const buf = CR_BUF[ply], n = aiGenMoves(pos, false, buf); let count = 0;
  for (let i = 0; i < n; i++) {
    const m = buf[i]; if (crPromoMinor(m)) continue;
    aiMake(pos, m);
    if (!aiLeftInCheck(pos) && crInCheck(pos) && !crHasLegal(pos, ply + 1)) count++;
    aiUnmake(pos, m);
  }
  return count;
}
function crToMove(m) { const from = m & 127, to = (m >> 7) & 127; return [from >> 4, from & 7, to >> 4, to & 7]; }
function crSameMove(m, mv) { const a = crToMove(m); return a[0] === mv[0] && a[1] === mv[1] && a[2] === mv[2] && a[3] === mv[3]; }

// ===== 두 수 메이트 =====
// 판 분석: 한 수 메이트가 없고, 첫 수(key) 뒤 상대의 모든 응수에 한 수 메이트가 남는 수들.
// refute: 열쇠가 아닌 수마다 상대의 빠져나가는 응수(또는 'stalemate'). 생성기와 검사에서 쓴다.
function crMate2Analyze(board) {
  const pos = crPos(board);
  if (crInCheck({ ...pos, side: 1, king: pos.king }) || crMateIn1Exists(pos, 0)) return null;
  const moves = crLegal(pos, 0), keys = [];
  let replyTotal = 0, checks = 0;
  for (const m of moves) {
    aiMake(pos, m);
    const replies = crLegal(pos, 1);
    let ok = replies.length > 0;
    for (const r of replies) { aiMake(pos, r); const has = crMateIn1Exists(pos, 2); aiUnmake(pos, r); if (!has) { ok = false; break; } }
    if (ok) { keys.push(m); replyTotal += replies.length; if (crInCheck(pos)) checks++; }
    aiUnmake(pos, m);
  }
  return { moves, keys, keyMoves: keys.map(crToMove), replies: keys.length ? replyTotal / keys.length : 0, checkKeys: checks };
}
// 한 수 메이트: [fr,fc,tr,tc] 목록 (lr 판 계산)
function crMatesIn1(b) { return lrMoves(b, 'w').filter(m => { const b1 = lrApply(b, m); return lrInCheck(b1, 'b') && !lrHasMove(b1, 'b'); }); }
function crHasMateIn1(b) { return crMateIn1Exists(crPos(b), 0); }
// 응수 고르기: 빠져나가는 수는 킹이 피하기 → 잡기 → 막기 순으로, 버티는 수는 내 메이트 수가 가장 적게 남는 수.
function crReplyOrder(b1) {
  const k = lrKing(b1, 'b');
  return (x, y) => {
    const rank = r => r[0] === k[0] && r[1] === k[1] ? 0 : b1[r[2]][r[3]] ? 1 : 2;
    return rank(x) - rank(y) || lessonCompareMoves(x, y);
  };
}
// 첫 수 판정. continue면 상대의 응수(reply)를 받은 뒤 두 번째 수를 둔다.
function crMate2First(b, move) {
  const b1 = lrApply(b, move), st = lrStatus(b1, 'b');
  if (st === 'checkmate') return { result: 'success', note: 'mate' };
  if (st === 'stalemate') return { result: 'fail', reply: null, note: 'stalemate' };
  const replies = lrMoves(b1, 'b').sort(crReplyOrder(b1));
  const escape = replies.find(r => !crHasMateIn1(lrApply(b1, r)));
  if (escape) return { result: 'fail', reply: escape, note: 'escape' };
  // 모든 응수에 메이트가 남는다: 내 메이트 수가 가장 적은(가장 끈질긴) 응수를 둔다.
  let best = null, fewest = Infinity;
  for (const r of replies) { const n = crCountMateIn1(crPos(lrApply(b1, r)), 0); if (n < fewest) { fewest = n; best = r; } }
  return { result: 'continue', reply: best };
}
// 두 번째 수 판정: 체크메이트여야 한다. 아니면 상대가 어떻게 빠져나가는지 보여 준다.
function crMate2Second(b2, move) {
  const b3 = lrApply(b2, move), st = lrStatus(b3, 'b');
  if (st === 'checkmate') return { result: 'success', note: 'mate' };
  if (st === 'stalemate') return { result: 'fail', reply: null, note: 'stalemate' };
  const replies = lrMoves(b3, 'b').sort(crReplyOrder(b3));
  const take = replies.filter(r => b3[r[2]][r[3]]).sort(lrVictimOrder(b3))[0];
  return { result: 'fail', reply: take || replies[0], note: st === 'check' ? 'escape' : 'noCheck' };
}

// ===== 지키는 말 없애기: 두 수로 이득 보기 =====
// 첫 수는 lrGain(내 수 → 상대의 모든 응수 → 내 가장 좋은 잡기)이 2점 이상이어야 한다(수업의 전술 판정과 같은 계산).
function crWin2First(b, move) {
  const g = lrGain(b, move);
  if (g.mate) return { result: 'success', note: 'mate' };
  if (g.stalemate) return { result: 'fail', reply: null, note: 'stalemate' };
  if (g.gain >= 2) return { result: 'continue', reply: g.reply, note: { banked: crCapValue(b, move) - crCapValue(lrApply(b, move), g.reply) } };
  const b1 = lrApply(b, move), r = g.reply;
  return { result: 'fail', reply: r, note: b1[r[2]][r[3]] ? 'lost' : 'parried' };
}
function crCapValue(b, m) { const p = b[m[2]][m[3]]; return p ? LR_VALUE[p[1]] : 0; }
// 두 번째 수: 첫 수와 응수로 얻은 점수(banked)에 이 수의 잡고 잡히기 결과를 더해 2점 이상이면 성공.
function crWin2Second(b2, move, banked) {
  const b3 = lrApply(b2, move);
  if (lrStatus(b3, 'b') === 'checkmate') return { result: 'success', note: 'mate' };
  const cap = crCapValue(b2, move), loss = lrQs(b3, 'b', 3), total = banked + cap - loss;
  if (total >= 2) return { result: 'success', note: { total } };
  const best = lrBestCapture(b3, 'b', 3).move;
  return { result: 'fail', reply: best || null, note: cap ? 'recaptured' : 'missed' };
}

// ===== 끝내기 계산표 (K+Q/R 대 K: 메이트까지 거리, K+P 대 K: 승격까지 거리) =====
// 칸 번호 s = r*8+c. 인덱스 ((백킹*64+흑킹)*64+말)*2+차례(0 백, 1 흑). 값: -1 비김/불가능, 그 밖에는 반수(ply) 거리.
const CR_TB = {};
const CR_KN = Array.from({ length: 64 }, (_, s) => { const r = s >> 3, c = s & 7, out = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const i = r + dr, j = c + dc; if ((dr || dc) && i >= 0 && i < 8 && j >= 0 && j < 8) out.push(i * 8 + j); } return out; });
const CR_ADJ = new Uint8Array(4096);
for (let a = 0; a < 64; a++) for (let b = 0; b < 64; b++) CR_ADJ[a * 64 + b] = Math.max(Math.abs((a >> 3) - (b >> 3)), Math.abs((a & 7) - (b & 7))) <= 1 ? 1 : 0;
const crAdj = (a, b) => CR_ADJ[a * 64 + b] === 1;
const CR_DIRS = { Q: [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]], R: [[-1, 0], [1, 0], [0, -1], [0, 1]] };
// 긴 말(x)이 칸 t를 노리는가. block은 길을 막는 칸(백 킹). 흑 킹은 움직이는 쪽이라 막는 칸에 넣지 않는다.
// 표를 빨리 만들도록 같은 줄 여부와 사이 칸을 미리 계산해 둔다.
const CR_LINE = { Q: new Uint8Array(4096), R: new Uint8Array(4096) }, CR_BETWEEN = new Uint8Array(262144);
for (let x = 0; x < 64; x++) for (let t = 0; t < 64; t++) {
  if (x === t) continue;
  const xr = x >> 3, xc = x & 7, tr = t >> 3, tc = t & 7, dr = Math.sign(tr - xr), dc = Math.sign(tc - xc);
  const straight = !dr || !dc, diagonal = Math.abs(tr - xr) === Math.abs(tc - xc);
  if (!straight && !diagonal) continue;
  CR_LINE.Q[x * 64 + t] = 1; if (straight) CR_LINE.R[x * 64 + t] = 1;
  for (let r = xr + dr, c = xc + dc; r !== tr || c !== tc; r += dr, c += dc) CR_BETWEEN[(x * 64 + t) * 64 + r * 8 + c] = 1;
}
function crSlideHits(type, x, t, block) { const k = x * 64 + t; return CR_LINE[type][k] === 1 && (block < 0 || CR_BETWEEN[k * 64 + block] === 0); }
const crIdx = (wk, bk, x, stm) => ((((wk << 6) | bk) << 6) | x) << 1 | stm;
function crBuildKXK(type) {
  const N = 1 << 19, dtm = new Int8Array(N).fill(-1), cnt = new Uint8Array(N), legal = new Uint8Array(N), queue = new Int32Array(N);
  let tail = 0;
  for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) {
    if (wk === bk || crAdj(wk, bk)) continue;
    for (let x = 0; x < 64; x++) {
      if (x === wk || x === bk) continue;
      const check = crSlideHits(type, x, bk, wk);
      if (!check) legal[crIdx(wk, bk, x, 0)] = 1;
      const q = crIdx(wk, bk, x, 1); legal[q] = 1;
      let n = 0, capture = false;
      for (const d of CR_KN[bk]) {
        if (d === wk || crAdj(d, wk)) continue;
        if (d === x) { if (!crAdj(x, wk)) capture = true; continue; }
        if (crSlideHits(type, x, d, wk)) continue;
        n++;
      }
      if (capture) cnt[q] = 255;
      else if (!n) { if (check) { dtm[q] = 0; queue[tail++] = q; } else cnt[q] = 255; }
      else cnt[q] = n;
    }
  }
  for (let head = 0; head < tail; head++) {
    const p = queue[head], stm = p & 1, x = (p >> 1) & 63, bk = (p >> 7) & 63, wk = (p >> 13) & 63, d = dtm[p];
    if (stm === 1) {
      for (const s of CR_KN[wk]) { if (s === x || s === bk || crAdj(s, bk)) continue; const q = crIdx(s, bk, x, 0); if (legal[q] && dtm[q] < 0) { dtm[q] = d + 1; queue[tail++] = q; } }
      for (const [dr, dc] of CR_DIRS[type]) {
        for (let r = (x >> 3) + dr, c = (x & 7) + dc; r >= 0 && r < 8 && c >= 0 && c < 8; r += dr, c += dc) {
          const s = r * 8 + c; if (s === wk || s === bk) break;
          const q = crIdx(wk, bk, s, 0); if (legal[q] && dtm[q] < 0) { dtm[q] = d + 1; queue[tail++] = q; }
        }
      }
    } else {
      for (const s of CR_KN[bk]) {
        if (s === wk || s === x || crAdj(s, wk)) continue;
        const q = crIdx(wk, s, x, 1); if (!legal[q] || dtm[q] >= 0 || cnt[q] === 255) continue;
        if (--cnt[q] === 0) { dtm[q] = d + 1; queue[tail++] = q; }
      }
    }
  }
  return dtm;
}
// K+P 대 K. 폰은 1~6행(7랭크~2랭크). 승격은 퀸으로, 승격 직후 상대가 퀸을 잡거나 스테일메이트면 비김.
function crPawnHits(p, t) { return (t >> 3) === (p >> 3) - 1 && Math.abs((t & 7) - (p & 7)) === 1; }
function crBuildKPK() {
  const N = 1 << 19, dtp = new Int8Array(N).fill(-1), cnt = new Uint8Array(N), legal = new Uint8Array(N), queue = new Int32Array(N);
  let tail = 0;
  // 승격한 퀸(q, 0행) + 백 킹 대 흑 킹, 흑 차례: 흑이 퀸을 잡거나 둘 곳이 없고 체크가 아니면 비김
  const promoteSafe = (wk, bk, q) => {
    if (crAdj(q, bk) && !crAdj(q, wk)) return false;
    const check = crSlideHits('Q', q, bk, wk);
    if (check) return true;
    for (const d of CR_KN[bk]) { if (d === wk || crAdj(d, wk) || d === q) continue; if (!crSlideHits('Q', q, d, wk)) return true; }
    return false;
  };
  for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) {
    if (wk === bk || crAdj(wk, bk)) continue;
    for (let p = 8; p < 56; p++) {
      if (p === wk || p === bk) continue;
      const check = crPawnHits(p, bk), w = crIdx(wk, bk, p, 0), q = crIdx(wk, bk, p, 1);
      if (!check) {
        legal[w] = 1;
        if ((p >> 3) === 1 && p - 8 !== wk && p - 8 !== bk && promoteSafe(wk, bk, p - 8)) { dtp[w] = 1; queue[tail++] = w; }
      }
      legal[q] = 1;
      let n = 0, capture = false;
      for (const d of CR_KN[bk]) {
        if (d === wk || crAdj(d, wk)) continue;
        if (d === p) { if (!crAdj(p, wk)) capture = true; continue; }
        if (crPawnHits(p, d)) continue;
        n++;
      }
      if (capture) cnt[q] = 255;
      else if (!n) { if (check) { dtp[q] = 0; queue[tail++] = q; } else cnt[q] = 255; }
      else cnt[q] = n;
    }
  }
  for (let head = 0; head < tail; head++) {
    const pIdx = queue[head], stm = pIdx & 1, p = (pIdx >> 1) & 63, bk = (pIdx >> 7) & 63, wk = (pIdx >> 13) & 63, d = dtp[pIdx];
    if (stm === 1) {
      for (const s of CR_KN[wk]) { if (s === p || s === bk || crAdj(s, bk)) continue; const q = crIdx(s, bk, p, 0); if (legal[q] && dtp[q] < 0) { dtp[q] = d + 1; queue[tail++] = q; } }
      // 폰이 한 칸(또는 2행→4행 두 칸) 올라온 수를 거꾸로
      const back = p + 8;
      if ((back >> 3) <= 6 && back !== wk && back !== bk) {
        const q = crIdx(wk, bk, back, 0); if (legal[q] && dtp[q] < 0) { dtp[q] = d + 1; queue[tail++] = q; }
        const back2 = p + 16;
        if ((p >> 3) === 4 && back2 !== wk && back2 !== bk) { const q2 = crIdx(wk, bk, back2, 0); if (legal[q2] && dtp[q2] < 0) { dtp[q2] = d + 1; queue[tail++] = q2; } }
      }
    } else {
      for (const s of CR_KN[bk]) {
        if (s === wk || s === p || crAdj(s, wk)) continue;
        const q = crIdx(wk, s, p, 1); if (!legal[q] || dtp[q] >= 0 || cnt[q] === 255) continue;
        if (--cnt[q] === 0) { dtp[q] = d + 1; queue[tail++] = q; }
      }
    }
  }
  return dtp;
}
function crTable(kind) {
  if (!CR_TB[kind]) CR_TB[kind] = kind === 'P' ? crBuildKPK() : crBuildKXK(kind);
  return CR_TB[kind];
}
function crTableReady(kind) { return !!CR_TB[kind]; }

// 판에서 끝내기 종류와 말 위치를 읽는다: 백 킹 + (퀸|룩|폰 하나) 대 흑 킹만 있을 때.
function crEndgameOf(b) {
  let wk = -1, bk = -1, x = -1, type = null, extra = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = b[r][c]; if (!p) continue; const s = r * 8 + c;
    if (p === 'wK') wk = s; else if (p === 'bK') bk = s;
    else if (p[0] === 'w' && 'QRP'.includes(p[1]) && x < 0) { x = s; type = p[1]; }
    else extra++;
  }
  return wk >= 0 && bk >= 0 && x >= 0 && !extra ? { wk, bk, x, type } : null;
}
// 그 판의 거리(반수). turn: 'w'|'b'. -1이면 비김(또는 불가능).
function crDistance(b, turn) {
  const e = crEndgameOf(b); if (!e) return -1;
  return crTable(e.type)[crIdx(e.wk, e.bk, e.x, turn === 'w' ? 0 : 1)];
}
// 사람이 읽는 수(내 차례 기준 '몇 수 안에'): 백 차례 거리 d반수 → (d+1)/2수
function crMovesLeft(plies) { return plies < 0 ? -1 : Math.ceil(plies / 2); }
// 상대(흑)의 끝내기 응수: 비기는 수(말 잡기)가 있으면 그 수, 없으면 가장 오래 버티는 수(같으면 좌표 순).
function crEndgameDefense(b1) {
  const replies = lrMoves(b1, 'b'); if (!replies.length) return null;
  let best = null, score = -Infinity;
  for (const r of replies) {
    const b2 = lrApply(b1, r), e = crEndgameOf(b2);
    const s = !e ? 1000 : (d => d < 0 ? 999 : d)(crDistance(b2, 'w'));
    if (s > score || s === score && lessonCompareMoves(r, best) < 0) { score = s; best = r; }
  }
  return best;
}
// 끝내기에서 내 수 하나: mate(성공) | promoted(폰 끝내기 성공) | stalemate·lost(실패) | continue(상대 응수).
// kind: 'Q'|'R'|'P'. before/after 거리로 '가까워졌는지'를 알려 준다(정답 수를 알려 주지는 않는다).
function crEndgameStep(kind, b, move) {
  const before = crDistance(b, 'w'), b1 = lrApply(b, move), st = lrStatus(b1, 'b');
  if (st === 'checkmate') return { result: 'success', note: 'mate', before, after: 0 };
  if (st === 'stalemate') return { result: 'fail', reply: null, note: 'stalemate', before };
  if (kind === 'P' && lrPromotes(b, move)) {
    const take = lrCaptures(b1, 'b')[0];
    return take ? { result: 'fail', reply: take, note: 'lost', before } : { result: 'success', note: 'promoted', before, after: 0 };
  }
  const after = crDistance(b1, 'b');
  if (after < 0) {
    const take = lrCaptures(b1, 'b')[0];
    if (take) return { result: 'fail', reply: take, note: 'lost', before };
    // 폰 끝내기: 잡히지는 않아도 이제 승격을 막을 수 있다 → 상대가 막는 수를 보여 준다.
    return { result: 'fail', reply: crEndgameDefense(b1), note: kind === 'P' ? 'drawn' : 'lost', before };
  }
  return { result: 'continue', reply: crEndgameDefense(b1), before, after };
}
// 표의 가장 좋은 수(검사·예시 풀이용. 화면의 힌트로는 쓰지 않는다)
function crEndgameBest(b) {
  let best = null, score = Infinity;
  for (const m of lrMoves(b, 'w')) {
    const b1 = lrApply(b, m), st = lrStatus(b1, 'b');
    let s;
    if (st === 'checkmate') s = 0;
    else if (st === 'stalemate') s = Infinity;
    else if (lrPromotes(b, m)) s = lrCaptures(b1, 'b').length ? Infinity : 0;  // 폰 끝내기는 안전한 승격이 곧 성공
    else { const e = crEndgameOf(b1); s = e ? (d => d < 0 ? Infinity : d)(crDistance(b1, 'b')) : Infinity; }
    if (s < score || s === score && best && lessonCompareMoves(m, best) < 0) { score = s; best = m; }
  }
  return best;
}

// ===== 두 룩 사다리 메이트 (K+R+R 대 K): 표 없이 결과로 판정 =====
// 상대 응수: 한 수 메이트를 허용하지 않는 수 → 가장자리에서 먼 칸 → 룩을 노리는 칸 순서.
function crEdgeDist(sq) { const r = sq[0], c = sq[1]; return Math.min(r, 7 - r, c, 7 - c); }
function crLadderDefense(b1) {
  const replies = lrMoves(b1, 'b'); if (!replies.length) return null;
  let best = null, score = -Infinity;
  for (const r of replies) {
    const b2 = lrApply(b1, r);
    const s = (b1[r[2]][r[3]] ? 1000 : 0) + (crHasMateIn1(b2) ? 0 : 100) + crEdgeDist([r[2], r[3]]) * 10 + lrMoves(b2, 'b').length * 0;
    if (s > score || s === score && lessonCompareMoves(r, best) < 0) { score = s; best = r; }
  }
  return best;
}
function crLadderStep(b, move) {
  const b1 = lrApply(b, move), st = lrStatus(b1, 'b');
  if (st === 'checkmate') return { result: 'success', note: 'mate' };
  if (st === 'stalemate') return { result: 'fail', reply: null, note: 'stalemate' };
  const take = lrCaptures(b1, 'b')[0];
  if (take) return { result: 'fail', reply: take, note: 'lost' };
  return { result: 'continue', reply: crLadderDefense(b1) };
}
// 예시 풀이(생성기 검증용): 한 수 메이트 → 룩을 잃지 않으면서 상대 킹의 칸을 가장 많이 줄이는 수.
function crLadderBest(b) {
  const mates = crMatesIn1(b); if (mates.length) return mates[0];
  let best = null, score = Infinity;
  for (const m of lrMoves(b, 'w')) {
    const b1 = lrApply(b, m);
    if (lrStatus(b1, 'b') !== 'check' && lrStatus(b1, 'b') !== 'playing') continue;
    if (lrCaptures(b1, 'b').length) continue;
    const r = crLadderDefense(b1); if (!r) continue;
    const b2 = lrApply(b1, r); if (lrCaptures(b2, 'w').some(c => b2[c[2]][c[3]]?.[1] === 'K')) continue;
    const k = lrKing(b2, 'b'), mob = lrMoves(b2, 'b').length;
    const s = crEdgeDist(k) * 40 + crReachArea(b2) + (crHasMateIn1(b2) ? -500 : 0) + mob * 0.1;
    if (s < score || s === score && lessonCompareMoves(m, best) < 0) { score = s; best = m; }
  }
  return best;
}
// 상대 킹이 백 말에 막히지 않고 걸어갈 수 있는 칸(상자). 끝내기 힌트와 예시 풀이에서 쓴다.
function crNoBlackKing(b) { const n = lrCopy(b), k = lrKing(b, 'b'); if (k) n[k[0]][k[1]] = null; return n; }
function crBoxSquares(b) {
  const k = lrKing(b, 'b'); if (!k) return [];
  const nb = crNoBlackKing(b), free = (r, c) => !lrAttacked(nb, r, c, 'w') && b[r][c]?.[0] !== 'w';
  const seen = new Set([k[0] * 8 + k[1]]), stack = [k];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const i = r + dr, j = c + dc; if ((!dr && !dc) || i < 0 || i > 7 || j < 0 || j > 7 || seen.has(i * 8 + j) || !free(i, j)) continue;
      seen.add(i * 8 + j); stack.push([i, j]);
    }
  }
  return [...seen].map(s => [s >> 3, s & 7]);
}
function crReachArea(b) { return crBoxSquares(b).length; }

// ===== 첫 수부터 잘 두기 (캐슬링이 있는 실제 초반 판) =====
// 판정은 ChessGame(캐슬링 포함)으로 수를 두고, 안전은 lr 판 계산(상대가 이득 보고 잡을 수 있는 내 말이 있는가)으로 본다.
const CR_CENTER = [[3, 3], [3, 4], [4, 3], [4, 4]];
function crCenterScore(b, color = 'w') {
  let s = 0;
  for (const [r, c] of CR_CENTER) { if (b[r][c]?.[0] === color) s += 2; s += lrAttackers(b, r, c, color).length; }
  return s;
}
// 내 수 뒤 상대가 이득 보고 잡을 수 있는 가장 큰 점수(잡고 잡히기)와 그 잡기
function crHanging(b1) { const best = lrBestCapture(b1, 'b', 4); return best.gain > 0 ? best : null; }
function crUndeveloped(b) { return [[7, 1, 'N'], [7, 6, 'N'], [7, 2, 'B'], [7, 5, 'B']].filter(([r, c, t]) => b[r][c] === 'w' + t); }
// game: ChessGame(백 차례), move: [fr,fc,tr,tc]. 결과 {result, reply, note}
function crOpeningJudge(topic, game, move) {
  const b = game.board, piece = b[move[0]][move[1]], after = game.clone();
  if (after.move(move[0], move[1], move[2], move[3]) !== 'moved') return null;
  const b1 = after.board, castle = piece[1] === 'K' && Math.abs(move[3] - move[1]) === 2;
  const mate = lrMateThreats(b1)[0];
  if (mate) return { result: 'fail', reply: mate, note: 'mated', after };
  const hang = crHanging(b1);
  if (topic === 'trap') return hang && hang.gain >= 3 ? { result: 'fail', reply: hang.move, note: 'lost', after } : { result: 'success', note: castle ? 'castle' : null, after };
  if (hang) return { result: 'fail', reply: hang.move, note: 'lost', after };
  if (topic === 'castle') return castle ? { result: 'success', note: 'castle', after } : { result: 'goal', note: piece[1] === 'K' ? 'kingWalk' : 'notCastle', after };
  if (topic === 'center') {
    if (!'PN'.includes(piece[1])) return { result: 'goal', note: piece[1] === 'Q' ? 'queenEarly' : 'notCenter', after };
    const gain = crCenterScore(b1) - crCenterScore(b);
    if (piece[1] === 'P' && (move[1] === 0 || move[1] === 7)) return { result: 'goal', note: 'edgePawn', after };
    return gain >= 2 ? { result: 'success', note: { gain }, after } : { result: 'goal', note: 'notCenter', after };
  }
  if (topic === 'develop') {
    const minor = 'NB'.includes(piece[1]) && move[0] === 7;
    if (!minor) return { result: 'goal', note: piece[1] === 'Q' ? 'queenEarly' : piece[1] === 'K' ? 'kingWalk' : 'notDevelop', after };
    if (piece[1] === 'N' && (move[3] === 0 || move[3] === 7)) return { result: 'goal', note: 'rimKnight', after };
    return { result: 'success', note: null, after };
  }
  return null;
}
