// 체스 수업 4~15의 설명 문장과 힌트 표시 (docs/lessons/LESSON_EXPANSION_V4.md §1·§3)
// 설명: 둔 수에 무슨 일이 일어났는지와 그 이유를 한두 문장으로. 힌트: 생각할 곳만 가리키고 둘 수는 알려 주지 않는다.
// 칸 이름 뒤 조사: 3(삼)·6(육)은 받침이 있어 '으로', 1·7·8은 ㄹ 받침이라 '로', 나머지는 '로'.
function lessonSqJosa(sq) { return sq + ('36'.includes(sq.at(-1)) ? '으로' : '로'); }
function lessonValueText(p) { return `${lessonPieceName(p)}(${LR_VALUE[p[1]]}점)`; }

function lessonExplainKind(level, start, move, out) {
  const b = start.board, name = p => lessonPieceName(p), mover = b[move[0]][move[1]], moverName = name(mover), captured = out.captured;
  const reply = out.reply, taker = reply ? out.after.board[reply[0]][reply[1]] : null, takerName = taker ? name(taker) : '', victim = out.victim ? name(out.victim) : '';
  const took = () => `상대 ${lessonJosa(takerName, '이/가')} 내 ${lessonJosa(victim, '을/를')} 잡았어요.`;
  const how = () => ` ${lessonJosa(takerName, '은/는')} ${LESSON_PIECE_MOVES[taker[1]]}.`;
  const stalemate = '상대가 둘 수 있는 수가 없는데 체크가 아니라서 비겼어요. 이걸 스테일메이트라고 해요.';
  const b1 = lrApply(b, move), to = [move[2], move[3]];
  switch (level.kind) {
    case 'guard': {
      if (out.result === 'goal') return `이번에는 노려지는 ${lessonJosa(moverName, '을/를')} 그대로 두고, 다른 말로 지켜 주세요.`;
      const t = lrGuardTargets(b)[0], tName = name(b[t[0]][t[1]]);
      if (out.result === 'success') {
        if (captured && lrAttackers(b, t[0], t[1], 'b').some(s => lessonSameSquare(s, to))) return `나를 노리던 상대 ${lessonJosa(name(captured), '을/를')} 잡았어요. 이제 ${lessonJosa(tName, '은/는')} 안전해요.`;
        if (lrAttackers(b1, t[0], t[1], 'b').length < lrAttackers(b, t[0], t[1], 'b').length) return `내 ${lessonJosa(moverName, '이/가')} 상대 말의 길을 막았어요. 이제 ${lessonJosa(tName, '은/는')} 안전해요.`;
        return `내 ${lessonJosa(moverName, '이/가')} ${lessonJosa(tName, '을/를')} 지켜요. 상대가 잡으면 내가 다시 잡아서 상대가 손해예요.`;
      }
      const v = [reply[2], reply[3]], defended = lrAttackers(lrApply(b1, reply), v[0], v[1], 'w').length > 0;
      if (!defended) return `${took()} 그 말을 지켜 주는 내 말이 없었어요.`;
      if (LR_VALUE[taker[1]] < LR_VALUE[out.victim[1]]) return `${took()} 다시 잡아도 ${lessonJosa(takerName, '은/는')} ${victim}보다 점수가 낮아서 내가 손해예요.`;
      return `${took()} 상대가 노리는 말이 지키는 말보다 많았어요.`;
    }
    case 'trade': {
      const net = out.note?.net, best = out.note?.best;
      if (out.result === 'goal' && !captured) return '이번에는 상대 말을 하나 잡아요. 잡을 수 있는 말의 점수를 비교해요.';
      if (out.result === 'goal') return `${lessonJosa(lessonValueText(captured), '을/를')} 잡아 ${net}점 이득이지만, ${best}점을 얻는 잡기가 있어요.`;
      if (out.result === 'success') return `${lessonJosa(lessonValueText(captured), '을/를')} 잡았어요.` + (lrQs(b1, 'b', 4) > 0 ? ` 상대가 다시 잡아도 내가 ${net}점 이득이에요.` : ' 상대는 다시 잡을 수 없어요.');
      return `${lessonJosa(lessonValueText(captured), '은/는')} 잡았지만 상대 ${lessonJosa(takerName, '이/가')} 내 ${lessonJosa(lessonValueText(out.victim), '을/를')} 잡았어요. ${-net}점 손해예요.`;
    }
    case 'check':
      if (out.result === 'goal') return '체크가 아니에요. 내 말이 상대 킹을 바로 노려야 해요.';
      if (out.result === 'success') return out.note === 'mate' ? '체크메이트! 상대 킹이 피할 곳이 없어요.' : `체크! 내 ${lessonJosa(moverName, '이/가')} 상대 킹을 노리고, 상대는 내 말을 잡을 수 없어요.`;
      return `체크했지만 ${took()}${how()}`;
    case 'escape': {
      if (out.result === 'success') {
        const k = lrKing(b, 'w'), checker = lrAttackers(b, k[0], k[1], 'b');
        const way = mover[1] === 'K' ? '킹이 안전한 칸으로 피했어요.' : captured && checker.some(s => lessonSameSquare(s, to)) ? `체크한 상대 ${lessonJosa(name(captured), '을/를')} 잡았어요.` : `내 ${lessonJosa(moverName, '이/가')} 사이를 막았어요.`;
        return `${way} 잡힐 내 말도 없어요.`;
      }
      return `체크는 풀었지만 ${took()}${lessonSameSquare([reply[2], reply[3]], to) && mover[1] !== 'K' ? ' 옮긴 말을 지켜 주는 말이 없었어요.' : how()}`;
    }
    case 'mate':
      if (out.result === 'success') return '체크메이트! 상대 킹이 피할 곳도, 막을 말도 없어요.';
      if (out.result === 'goal') return '체크가 아니에요. 체크메이트는 먼저 체크여야 해요.';
      if (out.note === 'stalemate') return stalemate;
      if (out.victim) return `체크였지만 ${took()}`;
      if (taker[1] === 'K') return `체크였지만 상대 킹이 ${lessonSqJosa(lessonSquareName([reply[2], reply[3]]))} 피했어요.`;
      return `체크였지만 상대 ${lessonJosa(takerName, '이/가')} 사이를 막았어요.`;
    case 'stopmate': {
      if (out.result === 'success') {
        if (out.note === 'mate') return '내가 먼저 체크메이트했어요!';
        const threats = lrMateThreats(b);
        const way = captured && threats.some(t => lessonSameSquare([t[0], t[1]], to)) ? ` 위협하던 상대 ${lessonJosa(name(captured), '을/를')} 잡았어요.` : mover[1] === 'K' ? ' 킹이 안전한 곳으로 옮겼어요.' : mover[1] === 'P' ? ' 폰이 비켜서 킹이 도망갈 칸이 생겼어요.' : ' 상대가 노리던 칸을 지키거나 막았어요.';
        return '이제 상대는 체크메이트할 수 없어요.' + way;
      }
      if (out.note === 'stalemate') return stalemate;
      return `상대 ${lessonJosa(takerName, '이/가')} ${lessonSquareName([reply[2], reply[3]])}에서 체크메이트했어요.${how()}`;
    }
    case 'stalemate':
      if (out.result === 'success') return out.note === 'mate' ? '체크메이트! 비기지 않고 이겼어요.' : '상대 킹에게 움직일 칸이 남았어요. 내 말도 안전해요.';
      if (out.note === 'stalemate') return stalemate;
      return `${took()}${how()}`;
    case 'promote':
      if (out.result === 'goal') return '이번에는 폰을 끝 줄까지 보내 퀸으로 바꿔요.';
      if (out.result === 'success') return '폰이 끝 줄에 닿아 퀸이 됐어요! 상대는 새 퀸을 잡을 수 없어요.' + (out.note === 'mate' ? ' 체크메이트까지!' : '');
      return lessonSameSquare([reply[2], reply[3]], to) ? `폰은 퀸이 됐지만 상대 ${lessonJosa(takerName, '이/가')} 새 퀸을 잡았어요.${how()}` : `${took()}${how()}`;
    case 'tactic': {
      if (out.result === 'success') {
        if (out.note === 'mate') return '체크메이트! 상대 킹이 피할 곳이 없어요.';
        const s = lrShape(b, move), order = [level.shape, 'fork', 'pin', 'skewer', 'discover'];
        for (const kind of order) {
          if (kind === 'fork' && s.fork) { const [x, y] = s.fork.map(t => name(b1[t[0]][t[1]])); return `포크! 내 ${lessonJosa(moverName, '이/가')} 상대 ${lessonJosa(x, '과/와')} ${lessonJosa(y, '을/를')} 한꺼번에 노려요. 둘 다 지킬 수 없어요.`; }
          if (kind === 'pin' && s.pin) return `핀! 상대 ${lessonJosa(name(b1[s.pin.front[0]][s.pin.front[1]]), '은/는')} 뒤의 ${name(b1[s.pin.back[0]][s.pin.back[1]])} 때문에 비킬 수 없어요.`;
          if (kind === 'skewer' && s.skewer) return `꼬치 공격! 상대 ${lessonJosa(name(b1[s.skewer.front[0]][s.skewer.front[1]]), '이/가')} 비키면 뒤의 ${lessonJosa(name(b1[s.skewer.back[0]][s.skewer.back[1]]), '을/를')} 잡아요.`;
          if (kind === 'discover' && s.discover) return `발견 공격! 내 ${lessonJosa(moverName, '이/가')} 비키자 내 ${lessonJosa(name(b1[s.discover.from[0]][s.discover.from[1]]), '이/가')} 상대 ${lessonJosa(name(b1[s.discover.target[0]][s.discover.target[1]]), '을/를')} 노려요.`;
        }
        return '상대가 무엇을 해도 다음에 이득 보고 잡을 수 있어요.';
      }
      if (out.note === 'stalemate') return stalemate;
      if (out.result === 'goal') return { fork: '아무것도 노리지 않는 수예요. 상대 말 두 개를 함께 노리는 칸을 찾아요.', pin: '아무것도 노리지 않는 수예요. 상대 킹 앞의 말을 긴 말로 노려요.', skewer: '아무것도 노리지 않는 수예요. 상대 킹이나 퀸을 줄 위에서 노려요.', discover: '아무것도 노리지 않는 수예요. 긴 말 앞을 막은 내 말을 비켜요.' }[level.shape];
      if (out.victim) return `${took()}${how()}`;
      return `상대가 ${lessonJosa(takerName, '을/를')} ${lessonSqJosa(lessonSquareName([reply[2], reply[3]]))} 옮겨 막았어요. 이제 이득 보고 잡을 말이 없어요.`;
    }
  }
  return '';
}

// ===== 힌트: 주제마다 '어디를 봐야 하는지' =====
// 돌려주는 표시: attackers·targets(테두리), arrows(빨간 화살표), tags([r,c,글자]), guarded(빨간 점: 상대가 지키는 칸), flight(동그라미: 상대 킹이 갈 수 있는 칸), focus(파란 테두리)
function lessonHintKind(level, start) {
  const b = start.board, marks = { attackers: [], targets: [], arrows: [], tags: [], guarded: [], flight: [], focus: [] };
  const blackGuards = (filter = () => true) => { const out = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (filter(r, c) && lrAttacked(b, r, c, 'b') && b[r][c]?.[0] !== 'b') out.push([r, c]); return out; };
  const kingFlight = () => { const k = lrKing(b, 'b'); return lrMoves(b, 'b').filter(m => m[0] === k[0] && m[1] === k[1]).map(m => [m[2], m[3]]); };
  const arrowsTo = sq => lrAttackers(b, sq[0], sq[1], 'b').map(a => [a[0], a[1], sq[0], sq[1]]);
  switch (level.kind) {
    case 'guard': {
      const t = lrGuardTargets(b)[0]; if (!t) break;
      marks.arrows = arrowsTo(t); marks.attackers = marks.arrows.map(a => [a[0], a[1]]); marks.targets = [t];
      return { marks, text: '💡 빨간 화살표: 상대가 노리는 내 말이에요. 그 말은 두고, 지켜 줄 내 말을 찾아요.' };
    }
    case 'escape': {
      const k = lrKing(b, 'w'); marks.arrows = arrowsTo(k); marks.attackers = marks.arrows.map(a => [a[0], a[1]]); marks.targets = [k];
      return { marks, text: '💡 빨간 화살표: 체크하는 상대 말이에요. 피하기·막기·잡기 가운데 내 말을 잃지 않는 방법을 찾아요.' };
    }
    case 'trade': {
      for (const m of lrCaptures(b, 'w')) { const p = b[m[2]][m[3]]; if (!marks.tags.some(t => t[0] === m[2] && t[1] === m[3])) marks.tags.push([m[2], m[3], LR_VALUE[p[1]] + '점']); }
      const d = lessonDefended(start); marks.arrows = d; marks.attackers = d.map(m => [m[0], m[1]]);
      return { marks, text: '💡 숫자는 잡을 수 있는 말의 점수, 빨간 화살표는 그 말을 지키는 상대 말이에요.' };
    }
    case 'check': case 'promote':
      marks.guarded = blackGuards(level.kind === 'promote' ? r => r === 0 : undefined); marks.targets = level.kind === 'check' ? [lrKing(b, 'b')] : [];
      return { marks, text: level.kind === 'check' ? '💡 빨간 점: 상대가 지키는 칸이에요. 그 칸에서 체크하면 잡혀요.' : '💡 빨간 점: 상대가 지키는 끝 줄 칸이에요. 그 칸에서 퀸이 되면 잡혀요.' };
    case 'mate': case 'stalemate': {
      marks.flight = kingFlight(); marks.targets = [lrKing(b, 'b')];
      const none = !marks.flight.length;
      return { marks, text: level.kind === 'mate' ? (none ? '💡 상대 킹은 지금 갈 칸이 없어요. 체크만 하면 될까요? 체크한 말이 잡히지 않게!' : '💡 동그라미: 상대 킹이 지금 갈 수 있는 칸이에요. 체크하면서 이 칸을 모두 막아요.')
        : (none ? '💡 상대 킹이 지금 갈 칸이 없어요. 칸을 열어 주거나 체크해요.' : '💡 동그라미: 상대 킹이 갈 수 있는 칸이에요. 적어도 한 칸은 남겨 두어요.') };
    }
    case 'stopmate': {
      const t = lrMateThreats(b); marks.arrows = t.map(m => m.slice(0, 4)); marks.attackers = t.map(m => [m[0], m[1]]);
      return { marks, text: '💡 빨간 화살표: 상대가 다음 수에 노리는 체크메이트예요. 이 수를 막아요.' };
    }
    case 'tactic': {
      if (level.shape === 'fork') {
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; if (p?.[0] === 'b' && (p[1] === 'K' || LR_VALUE[p[1]] >= 5 || p[1] !== 'P' && !lrAttacked(b, r, c, 'b'))) marks.targets.push([r, c]); }
        return { marks, text: '💡 테두리: 노릴 만한 상대 말이에요(킹, 비싼 말, 지켜지지 않은 말). 두 말을 함께 노리는 칸을 찾아요.' };
      }
      if (level.shape === 'discover') {
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
          const p = b[r][c]; if (p?.[0] !== 'w' || !LR_LINES[p[1]]) continue;
          for (const [dr, dc] of LR_LINES[p[1]]) {
            let i = r + dr, j = c + dc, blocker = null;
            while (i >= 0 && i < 8 && j >= 0 && j < 8) { const q = b[i][j]; if (q) { if (!blocker && q[0] === 'w') blocker = [i, j]; else { if (blocker && q[0] === 'b') { marks.focus.push([r, c], blocker); } break; } } i += dr; j += dc; }
          }
        }
        return { marks, text: '💡 파란 테두리: 내 말에 막힌 내 긴 말과 막고 있는 말이에요. 막은 말을 비키면 길이 열려요.' };
      }
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c] === 'bK' || b[r][c] === 'bQ') marks.targets.push([r, c]);
      return { marks, text: level.shape === 'pin' ? '💡 테두리: 상대 킹과 퀸이에요. 그 앞에 있는 상대 말을 긴 말로 노려요.' : '💡 테두리: 상대 킹과 퀸이에요. 줄 위에서 노리면 뒤의 말이 드러나요.' };
    }
  }
  return { marks, text: '💡 상대가 다음에 무엇을 할 수 있는지 살펴요.' };
}
