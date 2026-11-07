// 체스 수업 판정용 빠른 판 계산 (docs/lessons/LESSON_EXPANSION_V4.md §3)
// 판(8×8 배열)만 복사하며 둔다. 수업 판에는 캐슬링·앙파상이 없고, 승격은 퀸으로만 한다.
// 좌표는 [row,col] = [8-rank, fileIndex], 수는 [fr,fc,tr,tc].
const LR_VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };
const LR_ENGINE = new ChessGame();
const LR_LINES = { R: [[-1, 0], [1, 0], [0, -1], [0, 1]], B: [[-1, -1], [-1, 1], [1, -1], [1, 1]] };
LR_LINES.Q = [...LR_LINES.R, ...LR_LINES.B];

function lrOpp(color) { return color === 'w' ? 'b' : 'w'; }
function lrCopy(b) { return b.map(row => row.slice()); }
function lrKing(b, color) { const k = color + 'K'; for (let r = 0; r < 8; r++) { const c = b[r].indexOf(k); if (c >= 0) return [r, c]; } return null; }
// by 색 말 가운데 (r,c)를 노리는 말. 그 칸에 누가 있든 상관없다(같은 색이면 '지킨다').
function lrAttackers(b, r, c, by) {
  const out = [];
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (b[i][j]?.[0] === by && pieceAttacks(b, i, j, r, c)) out.push([i, j]);
  return out;
}
function lrAttacked(b, r, c, by) {
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (b[i][j]?.[0] === by && pieceAttacks(b, i, j, r, c)) return true;
  return false;
}
function lrInCheck(b, color) { const k = lrKing(b, color); return !!k && lrAttacked(b, k[0], k[1], lrOpp(color)); }
function lrPromotes(b, m) { return b[m[0]][m[1]]?.[1] === 'P' && (m[2] === 0 || m[2] === 7); }
function lrApply(b, m) {
  const n = lrCopy(b), p = n[m[0]][m[1]];
  n[m[2]][m[3]] = lrPromotes(b, m) ? p[0] + 'Q' : p; n[m[0]][m[1]] = null;
  return n;
}
// 합법 수(엔진과 같은 순서). 승격은 퀸 하나로만 센다.
function lrMoves(b, color) {
  const out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (b[r][c]?.[0] !== color) continue;
    for (const [tr, tc] of LR_ENGINE.rawMoves(b, r, c, null)) {
      if (b[tr][tc]?.[1] === 'K') continue;
      const m = [r, c, tr, tc];
      if (!lrInCheck(lrApply(b, m), color)) out.push(m);
    }
  }
  return out;
}
function lrHasMove(b, color) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (b[r][c]?.[0] !== color) continue;
    for (const [tr, tc] of LR_ENGINE.rawMoves(b, r, c, null)) if (b[tr][tc]?.[1] !== 'K' && !lrInCheck(lrApply(b, [r, c, tr, tc]), color)) return true;
  }
  return false;
}
// 'checkmate' | 'stalemate' | 'check' | 'playing' (color가 둘 차례라고 볼 때)
function lrStatus(b, color) {
  const check = lrInCheck(b, color);
  if (lrHasMove(b, color)) return check ? 'check' : 'playing';
  return check ? 'checkmate' : 'stalemate';
}
// color의 합법 잡기(상대 킹 제외)
function lrCaptures(b, color) {
  const out = [], opp = lrOpp(color);
  for (let tr = 0; tr < 8; tr++) for (let tc = 0; tc < 8; tc++) {
    const t = b[tr][tc]; if (!t || t[0] !== opp || t[1] === 'K') continue;
    for (const [r, c] of lrAttackers(b, tr, tc, color)) { const m = [r, c, tr, tc]; if (!lrInCheck(lrApply(b, m), color)) out.push(m); }
  }
  return out.sort(lessonCompareMoves);
}
// 잡고 잡히기만 이어 볼 때 side가 얻을 수 있는 가장 큰 점수(잡지 않으면 0). depth는 남은 수.
function lrQs(b, side, depth = 4) {
  if (depth <= 0) return 0;
  let best = 0;
  for (const m of lrCaptures(b, side)) {
    const v = LR_VALUE[b[m[2]][m[3]][1]];
    if (v <= best) continue;
    const g = v - lrQs(lrApply(b, m), lrOpp(side), depth - 1);
    if (g > best) best = g;
  }
  return best;
}
// side의 가장 이득 되는 잡기와 그 점수(잡고 잡히기를 이어 본 값)
function lrBestCapture(b, side, depth = 4) {
  let best = null, gain = 0;
  for (const m of lrCaptures(b, side)) {
    const g = LR_VALUE[b[m[2]][m[3]][1]] - lrQs(lrApply(b, m), lrOpp(side), depth - 1);
    if (g > gain) { gain = g; best = m; }
  }
  return { move: best, gain };
}
// 상대 응수 뒤 백의 다음 수 가치: 가장 좋은 잡기. 잡지 않으면 흑이 잡을 수 있는 만큼 잃는다고 본다(보수적).
function lrFollow(b2) {
  if (lrInCheck(b2, 'w') && !lrHasMove(b2, 'w')) return -100;
  let best = -lrQs(b2, 'b', 3);
  for (const c of lrCaptures(b2, 'w')) {
    const g = LR_VALUE[b2[c[2]][c[3]][1]] - lrQs(lrApply(b2, c), 'b', 3);
    if (g > best) best = g;
  }
  return best;
}
// 전술 판정: 백 수 m 뒤 흑의 모든 응수에 대해 백이 확실히 얻는 점수의 최솟값과, 그 최솟값을 만드는 흑의 응수(가장 좋은 대응).
function lrGain(b, m) {
  const cap = b[m[2]][m[3]], v0 = cap ? LR_VALUE[cap[1]] : 0, b1 = lrApply(b, m), replies = lrMoves(b1, 'b');
  if (!replies.length) return lrInCheck(b1, 'b') ? { gain: 100, mate: true, reply: null } : { gain: 0, stalemate: true, reply: null };
  let worst = Infinity, reply = null;
  for (const r of replies) {
    const t = b1[r[2]][r[3]], total = v0 - (t ? LR_VALUE[t[1]] : 0) + lrFollow(lrApply(b1, r));
    if (total < worst) { worst = total; reply = r; }
  }
  return { gain: worst, reply };
}

// ===== 전술 모양 =====
// sq의 말이 노리는 상대 말 칸
function lrTargetsOf(b, [r, c]) {
  const me = b[r][c], out = [];
  if (!me) return out;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (b[i][j] && b[i][j][0] !== me[0] && pieceAttacks(b, r, c, i, j)) out.push([i, j]);
  return out;
}
// 노릴 만한 목표: 킹, 노리는 말보다 비싼 말, 지켜지지 않은 말
function lrWorthy(b, attacker, [r, c]) {
  const p = b[r][c], me = b[attacker[0]][attacker[1]];
  return p[1] === 'K' || LR_VALUE[p[1]] > LR_VALUE[me[1]] || !lrAttacked(b, r, c, p[0]);
}
function lrForkTargets(b1, sq) { return lrTargetsOf(b1, sq).filter(t => lrWorthy(b1, sq, t)); }
// sq의 긴 말(룩·비숍·퀸)이 한 줄에서 처음 만나는 상대 말(앞)과 그 뒤에 바로 있는 상대 말(뒤)
function lrLinePairs(b, [r, c]) {
  const me = b[r][c], out = [];
  if (!me || !LR_LINES[me[1]]) return out;
  for (const [dr, dc] of LR_LINES[me[1]]) {
    let i = r + dr, j = c + dc, front = null;
    while (i >= 0 && i < 8 && j >= 0 && j < 8) {
      const p = b[i][j];
      if (p) {
        if (p[0] === me[0]) break;
        if (!front) front = [i, j];
        else { out.push({ front, back: [i, j] }); break; }
      }
      i += dr; j += dc;
    }
  }
  return out;
}
// 핀: 앞 말이 킹이 아니고, 뒤가 킹이거나 앞보다 비싼 말
function lrPins(b1, sq) {
  return lrLinePairs(b1, sq).filter(({ front, back }) => { const f = b1[front[0]][front[1]], k = b1[back[0]][back[1]]; return f[1] !== 'K' && (k[1] === 'K' || LR_VALUE[k[1]] > LR_VALUE[f[1]]); });
}
// 꼬치: 앞 말이 킹이거나 뒤보다 비싼 말(앞이 피하면 뒤가 잡힌다)
function lrSkewers(b1, sq) {
  return lrLinePairs(b1, sq).filter(({ front, back }) => { const f = b1[front[0]][front[1]], k = b1[back[0]][back[1]]; return k[1] !== 'K' && (f[1] === 'K' || LR_VALUE[f[1]] > LR_VALUE[k[1]]); });
}
// 발견 공격: 옮긴 말이 비키면서 내 긴 말이 새로 노리게 된 상대 말(킹 또는 노릴 만한 말)
function lrDiscovered(b, m) {
  const b1 = lrApply(b, m), color = b[m[0]][m[1]][0], out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = b1[r][c];
    if (p?.[0] !== color || !LR_LINES[p[1]] || r === m[2] && c === m[3]) continue;
    for (const t of lrTargetsOf(b1, [r, c])) if (!pieceAttacks(b, r, c, t[0], t[1]) && lrWorthy(b1, [r, c], t)) out.push({ from: [r, c], target: t });
  }
  return out;
}
// 수 하나의 전술 모양 이름: 'fork' | 'pin' | 'skewer' | 'discover' | null (판정이 아니라 설명·생성용)
function lrShape(b, m) {
  const b1 = lrApply(b, m), to = [m[2], m[3]];
  return {
    fork: lrForkTargets(b1, to).length >= 2 ? lrForkTargets(b1, to) : null,
    pin: lrPins(b1, to)[0] || null,
    skewer: lrSkewers(b1, to)[0] || null,
    discover: lrDiscovered(b, m)[0] || null,
  };
}

// ===== 주제별 판정 (수업 4~15). 내 수 m 하나에 대해 {result:'success'|'fail'|'goal', reply, note} =====
// fail은 상대(흑)의 실제 응수(reply)를 보여 준다(없으면 비김 등). goal은 목표를 이루지 못한 수(응수 없이 설명만).
function lrVictimOrder(b1) { return (x, y) => LR_VALUE[b1[y[2]][y[3]][1]] - LR_VALUE[b1[x[2]][x[3]][1]] || lessonCompareMoves(x, y); }
// 흑이 잡을 수 있는 가장 값진 내 말의 잡기(같으면 좌표 사전순) — 내 말 지키기와 같은 응수 규칙
function lrBestVictimCapture(b1) { const caps = lrCaptures(b1, 'b'); return caps.length ? caps.sort(lrVictimOrder(b1))[0] : null; }
// 지켜 주기: 상대가 잡으면 이득인 내 말(잡고 잡히기를 이어 본 값이 +)
function lrGuardTargets(b) {
  return lrCaptures(b, 'b').filter(c => LR_VALUE[b[c[2]][c[3]][1]] - lrQs(lrApply(b, c), 'w', 3) > 0).map(c => [c[2], c[3]])
    .filter((t, i, all) => all.findIndex(u => u[0] === t[0] && u[1] === t[1]) === i);
}
// 이득 보는 잡기: 잡은 점수 - 상대가 이어서 잡을 수 있는 점수
function lrTradeNet(b, m) { const cap = b[m[2]][m[3]]; return cap ? LR_VALUE[cap[1]] - lrQs(lrApply(b, m), 'b', 4) : null; }
function lrTradeBest(b) { return Math.max(0, ...lrCaptures(b, 'w').map(m => lrTradeNet(b, m))); }
// 상대(흑)가 지금 둔다면 체크메이트하는 수
function lrMateThreats(b) { return lrMoves(b, 'b').filter(r => { const b2 = lrApply(b, r); return lrInCheck(b2, 'w') && !lrHasMove(b2, 'w'); }); }
function lrJudge(level, b, m) {
  const b1 = lrApply(b, m), cap = b[m[2]][m[3]], protect = () => { const r = lrBestVictimCapture(b1); return r ? { result: 'fail', reply: r } : { result: 'success' }; };
  switch (level.kind) {
    case 'guard': {
      if (lrGuardTargets(b).some(t => t[0] === m[0] && t[1] === m[1])) return { result: 'goal', note: 'moved' };
      const best = lrBestCapture(b1, 'b', 4);
      return best.gain > 0 ? { result: 'fail', reply: best.move } : { result: 'success' };
    }
    case 'trade': {
      if (!cap) return { result: 'goal', note: 'noCapture' };
      const net = lrTradeNet(b, m), best = lrTradeBest(b);
      if (net < 0) return { result: 'fail', reply: lrBestCapture(b1, 'b', 4).move, note: { net, best } };
      if (net < best) return { result: 'goal', note: { net, best } };
      return { result: 'success', note: { net, best } };
    }
    case 'check': {
      if (!lrInCheck(b1, 'b')) return { result: 'goal', note: 'noCheck' };
      if (!lrHasMove(b1, 'b')) return { result: 'success', note: 'mate' };
      return protect();
    }
    case 'escape': return protect();
    case 'promote': {
      if (!lrPromotes(b, m)) return { result: 'goal', note: 'noPromote' };
      const out = protect();
      return out.result === 'success' && lrStatus(b1, 'b') === 'checkmate' ? { ...out, note: 'mate' } : out;
    }
    case 'stalemate': {
      const st = lrStatus(b1, 'b');
      if (st === 'stalemate') return { result: 'fail', reply: null, note: 'stalemate' };
      if (st === 'checkmate') return { result: 'success', note: 'mate' };
      return protect();
    }
    case 'mate': {
      const st = lrStatus(b1, 'b');
      if (st === 'checkmate') return { result: 'success', note: 'mate' };
      if (st === 'stalemate') return { result: 'fail', reply: null, note: 'stalemate' };
      if (st !== 'check') return { result: 'goal', note: 'noCheck' };
      // 체크였지만 벗어남: 체크한 말 잡기 > 킹이 피하기 > 막기 순으로 보여 준다
      const replies = lrMoves(b1, 'b'), king = lrKing(b1, 'b');
      const take = replies.filter(r => b1[r[2]][r[3]]).sort(lrVictimOrder(b1))[0], run = replies.find(r => r[0] === king[0] && r[1] === king[1]);
      return { result: 'fail', reply: take || run || replies[0] };
    }
    case 'stopmate': {
      const st = lrStatus(b1, 'b');
      if (st === 'checkmate') return { result: 'success', note: 'mate' };
      if (st === 'stalemate') return { result: 'fail', reply: null, note: 'stalemate' };
      const mate = lrMateThreats(b1)[0];
      return mate ? { result: 'fail', reply: mate } : { result: 'success' };
    }
    case 'tactic': {
      const g = lrGain(b, m);
      if (g.gain >= 2) return { result: 'success', note: g.mate ? 'mate' : null };
      if (g.stalemate) return { result: 'fail', reply: null, note: 'stalemate' };
      const r = g.reply;
      if (b1[r[2]][r[3]]) return { result: 'fail', reply: r };
      // 무언가를 노린 수(체크·공격·발견 공격)는 상대의 막는 수를 보여 주고, 아무것도 노리지 않은 수는 목표 미달로 알린다.
      const active = lrInCheck(b1, 'b') || lrTargetsOf(b1, [m[2], m[3]]).length > 0 || lrDiscovered(b, m).length > 0;
      return active ? { result: 'fail', reply: r, note: 'parried' } : { result: 'goal', note: 'quiet' };
    }
  }
  return null;
}
// 체크 덕분에만 안전한 수: 상대가 체크를 먼저 풀어야 해서 못 잡을 뿐, 체크가 아니면 이득 보고 잡을 수 있는 내 말이 있다.
// (원래 세 수업처럼 지키기·잡기 계열 수업에서는 이런 판을 쓰지 않는다.)
function lrCheckOnlySafe(b1) {
  if (!lrInCheck(b1, 'b')) return false;
  const k = lrKing(b1, 'b'), nb = lrCopy(b1); nb[k[0]][k[1]] = null;
  return lrBestCapture(nb, 'b', 4).gain > 0;
}
