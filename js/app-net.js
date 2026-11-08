// ===== 두 기기 대전 (docs/TWO_DEVICE_PLAY.md) =====
// 같은 방: QR을 서로 한 번씩 찍어 연결. 멀리서: 초대장·답장 코드를 메신저로 주고받아 연결. 우리 서버는 없다.
// 대국 기록(net_game_v1)은 각 기기에 저장한다. 연결이 끊겨도 수 목록을 서로 비교해 다시 맞추고,
// 다시 연결이 안 되면 '편지'(지금까지의 수 목록 코드)를 메신저로 보내 이어 둔다.

const NET_RECORD_KEY = 'net_game_v1';
const NET_EMOJIS = ['👍', '😮', '🙂', '😅'];
const net = { link: null, wiz: null, record: null, recordProfile: null, present: false, drawOffered: false, rematchOffer: null, lastEmojiAt: 0, emojiIn: [], handoff: null };

// --- 대국 기록 ---
function netOpposite(c) { return c === 'w' ? 'b' : 'w'; }
function netEndValid(e, length) { return e && typeof e === 'object' && Number.isInteger(e.n) && e.n === length && (e.type === 'draw' || e.type === 'resign' && ['w', 'b'].includes(e.winner)); }
function netRecordValid(r) {
  return !!r && r.v === 1 && /^[A-Za-z0-9]{8}$/.test(r.gid) && ['w', 'b'].includes(r.color) && ['room', 'remote'].includes(r.method) && typeof r.small === 'boolean' && typeof r.inviter === 'boolean'
    && Array.isArray(r.moves) && r.moves.length <= NET_LIMITS.moves && r.moves.every(netMoveCodeValid) && (r.end === null || netEndValid(r.end, r.moves.length))
    && Number.isInteger(r.acked) && r.acked >= 0 && r.acked <= r.moves.length && r.peer && typeof r.peer.name === 'string' && typeof r.peer.icon === 'string';
}
function netMoveParse(code) {
  if (!netMoveCodeValid(code)) return null;
  return [Number(code[0]), Number(code[1]), Number(code[2]), Number(code[3]), code[4] || 'Q'];
}
function netMoveCode([fr, fc, tr, tc], promotion, piece) { return '' + fr + fc + tr + tc + (piece?.[1] === 'P' && (tr === 0 || tr === 7) ? promotion || 'Q' : ''); }
// 수 목록을 처음부터 다시 둬 본다. 규칙에 맞지 않는 수가 하나라도 있으면 null.
function netReplay(small, moves) {
  const g = small ? ChessGame.fromFEN(PLAY_SMALL_FEN) : new ChessGame();
  for (const code of moves) {
    const mv = netMoveParse(code);
    if (!mv || g.status === 'checkmate' || g.status === 'draw') return null;
    const piece = g.board[mv[0]][mv[1]];
    if (piece?.[1] === 'P' && (mv[2] === 0 || mv[2] === 7) ? code.length !== 5 : code.length !== 4) return null;
    if (g.move(...mv) !== 'moved') return null;
    g.lastMove = mv.slice(0, 4);
  }
  return g;
}
function netLoad() {
  if (net.recordProfile === activeProfile) return net.record;
  const r = readData(NET_RECORD_KEY, null);
  net.record = netRecordValid(r) && netReplay(r.small, r.moves) ? r : null; net.recordProfile = activeProfile;
  return net.record;
}
function netSave(r = net.record) {
  if (!r) return;
  r.updatedAt = Date.now(); net.record = r; net.recordProfile = activeProfile; writeData(NET_RECORD_KEY, r);
}
function netOngoing() { const r = netLoad(); return r && !r.end && !netGameOver(netReplay(r.small, r.moves)) ? r : null; }
function netGameOver(g) { return !g || g.status === 'checkmate' || g.status === 'draw'; }
function netPeerName(r = net.record) { return profileText(r?.peer?.name || '친구'); }
// 이름 뒤 조사: 받침이 있으면 '이', 없으면 '가'(한글이 아니면 '가').
function netJosa(name, withFinal, without) { const code = name.charCodeAt(name.length - 1) - 0xac00; return code >= 0 && code < 11172 && code % 28 ? withFinal : without; }
function netIsCurrentGame() { return state.activeKind === 'play' && state.play?.mode === 'net' && state.play.net?.gid === net.record?.gid; }

// --- 연결 관리 ---
function netHandlers() {
  return {
    onOpen: link => netOnOpen(link),
    onState: link => netOnState(link),
    onRecover: link => {
      if (link !== net.link) return;
      if (net.wiz?.purpose === 'continue') { netWizardClose(); netOpenGame(); }
      netSendHello(true); netToast('🟢 연결이 돌아왔어요. 판을 다시 맞췄어요.');
    },
    onMessage: (msg, link) => { if (link === net.link) netOnMessage(msg); },
    onTick: link => { if (link === net.link) netPresence(); },
  };
}
function netNewLink() { const link = new NetLink(netHandlers()); link.profile = activeProfile; return link; }
function netOnOpen(link) {
  if (link !== net.wiz?.link && link !== net.link) return link.close();
  if (net.link && net.link !== link) net.link.close();
  net.link = link; net.present = false;
  netSendHello(false);
}
function netOnState(link) {
  if (link === net.wiz?.link && state.screen === 'net' && link.state !== 'open') renderNetWizard();
  if (link !== net.link) return;
  if (link.state === 'lost' && net.wiz?.link && net.wiz.link !== link) return;
  netPaint();
}
function netConnState() {
  const l = net.link;
  if (!l || l.state === 'closed' || l.state === 'new' || l.state === 'connecting') return 'none';
  if (l.state === 'open' && l.peerAway) return 'away';
  return l.state;
}
function netSend(msg) { return !!net.link && net.link.state !== 'closed' && net.link.send(msg); }
function netHello(reply) {
  const r = net.record, p = allProfiles().find(x => x.id === activeProfile);
  return { t: 'hello', v: 1, reply, gid: r.gid, color: r.color, small: r.small, inviter: r.inviter, moves: r.moves, end: r.end, name: (p?.name || '친구').slice(0, 24), icon: p?.icon || '🙂' };
}
// 새 대국 연결이면 이 연결의 대국 기록을 만든다(이전 기록은 이때 바뀐다). 이어 두기는 있던 기록을 쓴다.
function netEnsureRecord() {
  const w = net.wiz;
  if (w?.invite && w.purpose === 'new' && netLoad()?.gid !== w.invite.gid) netCreateRecordFromWizard();
  return netLoad();
}
function netSendHello(reply) { if (netEnsureRecord()) netSend(netHello(reply)); }
function netCreateRecordFromWizard() {
  const w = net.wiz, i = w.invite;
  const color = w.kind === 'host' ? i.hostColor : netOpposite(i.hostColor);
  netSave({ v: 1, gid: i.gid, method: w.method, inviter: w.kind === 'host', color, small: i.small, moves: [], end: null, acked: 0, peer: { name: '친구', icon: '🙂' }, startedAt: Date.now() });
}

// --- 메시지 ---
function netOnMessage(msg) {
  if (net.link?.profile !== activeProfile) { net.link?.close(); return; }
  const r = net.record;
  switch (msg.t) {
    case 'hello': return netOnHello(msg);
    case 'move': return netOnMove(msg);
    case 'ack': if (r && Number.isInteger(msg.n) && msg.n <= r.moves.length && msg.n > r.acked) { r.acked = msg.n; netSave(r); netPaint(); } return;
    case 'resign': if (r && !r.end) { r.end = { type: 'resign', winner: r.color, n: r.moves.length }; netSave(r); netAfterRemoteChange(); } return;
    case 'draw?': if (r && !r.end && netIsCurrentGame() && !playIsOver()) netDrawAsk(); else netSend({ t: 'draw-' }); return;
    case 'draw!': if (r && !r.end && net.drawOffered) { net.drawOffered = false; r.end = { type: 'draw', n: r.moves.length }; netSave(r); netAfterRemoteChange(); } return;
    case 'draw-': net.drawOffered = false; netToast('🙂 친구가 계속 두고 싶대요.'); return;
    case 'rematch?':
      // 둘이 동시에 '한 판 더'를 누르면 대국 번호가 작은 쪽 제안으로 정한다(양쪽이 같은 규칙).
      if (net.rematchOffer && /^[A-Za-z0-9]{8}$/.test(msg.gid) && ['w', 'b'].includes(msg.color)) { if (msg.gid < net.rematchOffer.gid) { net.rematchOffer = null; netSend({ t: 'rematch!', gid: msg.gid }); netStartRematch(msg.gid, netOpposite(msg.color), false); } return; }
      if (/^[A-Za-z0-9]{8}$/.test(msg.gid) && ['w', 'b'].includes(msg.color) && r && (r.end || netGameOver(netReplay(r.small, r.moves)))) netRematchAsk(msg.gid, netOpposite(msg.color)); else netSend({ t: 'rematch-' }); return;
    case 'rematch!': if (net.rematchOffer && msg.gid === net.rematchOffer.gid) { const o = net.rematchOffer; net.rematchOffer = null; netStartRematch(o.gid, o.color, true); } return;
    case 'rematch-': net.rematchOffer = null; netToast('🙂 친구가 이번엔 그만하고 싶대요.'); netPaint(); return;
    case 'emoji': return netEmojiIn(msg.e);
  }
}
function netHelloValid(m) {
  return m.v === 1 && /^[A-Za-z0-9]{8}$/.test(m.gid) && ['w', 'b'].includes(m.color) && typeof m.small === 'boolean' && typeof m.inviter === 'boolean'
    && Array.isArray(m.moves) && m.moves.length <= NET_LIMITS.moves && m.moves.every(netMoveCodeValid) && (m.end === null || netEndValid(m.end, m.moves.length)) && typeof m.name === 'string' && typeof m.icon === 'string';
}
// 두 기기의 수 목록 맞추기: 한쪽이 다른 쪽의 앞부분이면 긴 쪽을 쓴다. 서로 다르면(있으면 안 되는 일) 처음 초대한 쪽 목록을 쓴다.
function netMergeMoves(mine, theirs, myInviter, theirInviter) {
  const prefix = (a, b) => a.length <= b.length && a.every((m, i) => m === b[i]);
  if (prefix(mine, theirs)) return { moves: theirs.slice(), changed: theirs.length !== mine.length, conflict: false };
  if (prefix(theirs, mine)) return { moves: mine.slice(), changed: false, conflict: false };
  return theirInviter && !myInviter ? { moves: theirs.slice(), changed: true, conflict: true } : { moves: mine.slice(), changed: false, conflict: true };
}
function netOnHello(m) {
  if (!netHelloValid(m)) return;
  const r = netEnsureRecord(), expected = net.wiz?.invite?.gid || r?.gid;
  if (!r || m.gid !== expected || r.gid !== m.gid || r.color !== netOpposite(m.color) || r.small !== m.small) {
    netSend({ t: 'bye' }); net.link?.close(); net.link = null;
    return netWizardError('다른 대국의 연결이에요. 두 기기 모두 처음부터 다시 연결해 주세요.');
  }
  const before = r.moves.length, merged = netMergeMoves(r.moves, m.moves, r.inviter, m.inviter);
  if (merged.changed && netReplay(r.small, merged.moves)) r.moves = merged.moves;
  if (r.moves.length < before) r.end = null;
  if (!r.end && m.end && m.end.n === r.moves.length) r.end = m.end;
  if (r.end && r.end.n !== r.moves.length) r.end = null;
  const prefixOf = m.moves.length <= r.moves.length && m.moves.every((x, i) => x === r.moves[i]);
  r.acked = Math.min(r.moves.length, Math.max(prefixOf ? m.moves.length : 0, r.acked));
  if (net.wiz) r.method = net.wiz.method;
  r.peer = { name: m.name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 12) || '친구', icon: PROFILE_ICONS.includes(m.icon) ? m.icon : '🙂' };
  netSave(r);
  netSend({ t: 'ack', n: r.moves.length });
  if (m.reply) netSend(netHello(false));
  if (net.wiz) {
    const wasReconnect = net.wiz.purpose === 'continue';
    netWizardDone();
    netOpenGame();
    netToast(wasReconnect ? `🟢 다시 연결됐어요! ${netPeerName()}와 판을 맞췄어요.` : `🟢 연결됐어요! ${netPeerName()}와 대국을 시작해요.`);
    return;
  }
  if (r.moves.length !== before || merged.conflict) netAfterRemoteChange(merged.conflict ? '판이 서로 달라서 처음 초대한 쪽 판으로 맞췄어요.' : '');
  else netPaint();
}
function netOnMove(msg) {
  const r = net.record;
  if (!r || !Number.isInteger(msg.n) || !netMoveCodeValid(msg.m)) return;
  if (msg.n < r.moves.length) { if (r.moves[msg.n] === msg.m) netSend({ t: 'ack', n: r.moves.length }); else netSend(netHello(true)); return; }
  if (msg.n > r.moves.length || r.end) { netSend(netHello(true)); return; }
  const game = netReplay(r.small, r.moves), mv = netMoveParse(msg.m);
  if (!game || netGameOver(game) || game.turn === r.color) return void netSend(netHello(true));
  const check = game.clone(); if (check.move(...mv) !== 'moved' || netReplay(r.small, [...r.moves, msg.m]) === null) return void netSend(netHello(true));
  if (netIsCurrentGame() && state.screen === 'play' && !state.animating) {
    playCloseDialog(false); hideGameToast();
    state.game.selected = null; state.game.validMoves = [];
    playCommitMove(mv);   // 기록·저장은 playCommitMove → netAfterMove에서 한다.
  } else {
    r.moves.push(msg.m); netSave(r);
    if (netIsCurrentGame()) { state.game = netReplay(r.small, r.moves); if (state.screen === 'play') renderPlay(); }
    else netToast(`♟ ${netPeerName()}${netJosa(netPeerName(), '이', '가')} 수를 두었어요. 대전 → 두 기기로에서 이어 둬요.`);
  }
  netSend({ t: 'ack', n: r.moves.length });
}
// 원격 변화(합치기·기권·비기기)를 화면에 반영한다.
function netAfterRemoteChange(note = '') {
  const r = net.record;
  if (netIsCurrentGame()) {
    const g = netReplay(r.small, r.moves);
    if (g && (g.positionKey() !== state.game.positionKey() || g.lastMove?.join() !== state.game.lastMove?.join())) state.game = g;
    if (note) state.play.notice = note;
    if (state.screen === 'play' && !state.animating) { gameToastKey = ''; renderPlay(); }
  } else netPaint();
}
// 내 수든 상대 수든 판에 둔 뒤 부른다(playCommitMove 안에서).
function netAfterMove(mover, move, piece, promotion) {
  const r = net.record; if (!r) return;
  const code = netMoveCode(move, promotion, piece);
  r.moves.push(code); netSave(r);
  if (mover === r.color) netSend({ t: 'move', n: r.moves.length - 1, m: code });
}

// --- 대국 화면 ---
function netOpenGame() {
  const r = netLoad(); if (!r) return goPlay();
  const game = netReplay(r.small, r.moves);
  if (!game) { net.record = null; writeData(NET_RECORD_KEY, null); return goPlay(); }
  const s = getPlaySettings();
  beginActivity('play'); playStop();
  state.game = game; game.selected = null; game.validMoves = [];
  state.play = { mode: 'net', help: s.help, autoMove: false, face: false, small: r.small, preset: null, notice: '', level: 0, levelVersion: AI_DIFFICULTY_VERSION, timer: 0, deadline: 0, pausedLeft: null, buzzed: null, timeoutSide: null, net: { gid: r.gid, color: r.color, method: r.method } };
  if (playIsOver()) state.play.moveEvent = { kind: 'result', key: playStateKey(), acknowledged: true };
  net.drawOffered = false; net.rematchOffer = null;
  showScreen('play'); renderPlay(); netPresence();
}
function netLeaveGame() { leaveActivity(); netPresence(); goPlay(); }
// 내가 이 대국 화면을 보고 있는지 친구에게 알린다(앱을 내리거나 다른 화면에 가면 '잠깐 자리 비움').
function netPresence() {
  const present = !document.hidden && state.screen === 'play' && netIsCurrentGame();
  if (present === net.present) return;
  net.present = present;
  if (present) { net.link?.wake(); netSend({ t: 'back' }); netSend(netHello(true)); } else netSend({ t: 'away' });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) net.link?.wake(); netPresence(); });

function netStatusCopy() {
  const g = state.game, p = state.play, me = p.net.color, r = net.record, peer = netPeerName(), ga = netJosa(peer, '이', '가');
  if (r?.end?.type === 'resign') { const won = r.end.winner === me; return { tone: won ? 'success' : 'fail', icon: won ? '🏆' : '🏳️', title: won ? `${peer}${ga} 기권했어요. 내가 이겼어요!` : '기권했어요. 다음 판에서 다시 겨뤄요.', detail: '기권도 대국을 끝내는 방법이에요.' }; }
  if (r?.end?.type === 'draw') return { tone: 'draw', icon: '🤝', title: '비기기로 했어요', detail: '둘 다 비기기에 동의했어요.' };
  if (g.status === 'checkmate') { const won = g.turn !== me; return { tone: won ? 'success' : 'fail', icon: won ? '🏆' : '🏁', title: won ? '체크메이트! 내가 이겼어요' : `${peer}${ga} 이겼어요`, detail: t('playMateExplained') }; }
  if (g.status === 'draw') return { tone: 'draw', icon: '🤝', title: t('playDrawTitle'), detail: g.drawReason === 'stalemate' ? t('playStalemateExplained') : t(PLAY_DRAW_KEYS[g.drawReason]) };
  const conn = netConnState();
  if (conn === 'lost' || conn === 'none') return { tone: 'warn', icon: '🔌', title: '연결이 끊겼어요', detail: g.turn === me ? `그래도 내 수를 둘 수 있어요. 아래 ‘다시 연결’${r?.method === 'remote' ? '이나 ‘편지로 보내기’' : ''}로 친구에게 전해요.` : '아래 ‘다시 연결’을 눌러 친구와 다시 이어요.' };
  if (conn === 'weak') return { tone: 'warn', icon: '📶', title: '연결이 약해요 · 다시 잇는 중', detail: `${Math.round((Date.now() - net.link.weakSince) / 1000) ? Math.round((Date.now() - net.link.weakSince) / 1000) + '초째 · ' : ''}둔 수는 연결되면 친구에게 전해져요.` };
  if (g.status === 'check') return { tone: 'warn', icon: '⚠️', title: g.turn === me ? t('playMyKingCheck') : t('playOpponentKingCheck'), detail: t('playCheckRestriction') };
  const mine = g.turn === me, sending = r && r.acked < r.moves.length && !mine;
  if (mine) return { tone: '', icon: '♟', title: t('playYourTurn'), detail: p.moveEvent?.special === 'castle' ? t('playCastleComplete') : p.notice || t('playChoosePiece') };
  return { tone: 'dim', icon: sending ? '📨' : '⏳', title: `${peer} 차례예요`, detail: sending ? '내 수를 친구에게 보내는 중이에요.' : conn === 'away' ? '친구가 잠깐 다른 화면에 있어요. 돌아오면 이어서 둬요.' : p.notice || '친구가 두면 바로 보여요.' };
}
function netPillHTML() {
  const s = netConnState(), label = { open: '연결됨', away: '자리 비움', weak: '약함', lost: '끊김', none: '끊김' }[s];
  return `<span class="net-pill net-pill--${s}" role="status" aria-label="연결 상태 ${label}"><i aria-hidden="true"></i>${label}</span>`;
}
function renderPlayNet() {
  const g = state.game, p = state.play, r = net.record, me = p.net.color, opp = netOpposite(me);
  const row = (side, mine) => `<div class="net-side${mine ? ' mine' : ''}${!playIsOver() && g.turn === side ? ' turn' : ''}" id="${mine ? 'captured-bottom' : 'captured-top'}"><span class="net-side-who">${getPieceSVG(side + 'K', 22)}<b>${mine ? '나' : `${profileText(r?.peer?.icon || '🙂')} ${netPeerName()}`}</b></span><span class="net-side-captured">${g.captured[side].map(pc => getPieceSVG(pc, 20)).join('')}</span></div>`;
  renderGameScreen('screen-play', `<div class="screen-wrap play-net">
    <div class="screen-header"><button class="back-btn" onclick="netLeaveGame()">← 나가기</button><h2>두 기기 대전</h2>${netPillHTML()}</div>
    ${playStatusHTML()}
    ${row(opp, false)}
    ${playBoardHTML(false, me === 'b')}
    ${row(me, true)}
    ${playActionsHTML()}
  </div>`);
  const screen = document.getElementById('screen-play'); if (screen?.dataset) screen.dataset.netConn = netConnState();
}
// 연결 상태가 바뀌거나 '약함' 초가 늘 때: 판을 다시 그리지 않고 표시만 바꾼다.
function netPaint() {
  if (state.screen === 'net' && net.wiz) return;
  if (!netIsCurrentGame() || state.screen !== 'play') return;
  const screen = document.getElementById('screen-play'); if (!screen?.dataset) return;
  const conn = netConnState(), key = conn + '|' + (net.record?.acked ?? '') + '|' + !!net.rematchOffer + '|' + !!net.drawOffered;
  // 연결 상태가 바뀌면 지난 연결 안내('연결이 돌아왔어요' 등)는 지운다.
  if (screen.dataset.netConn !== conn) { screen.dataset.netConn = conn; if (state.play.notice && state.play.notice === state.play.netNotice) state.play.notice = ''; }
  const pill = screen.querySelector('.net-pill'), status = screen.querySelector('.play-state');
  if (screen.dataset.netKey !== key && !state.animating && !playDialogState) { screen.dataset.netKey = key; renderPlay(); return; }
  if (pill) pill.outerHTML = netPillHTML();
  if (status) status.outerHTML = playStatusHTML();
}
function netActionsHTML() {
  const g = state.game, p = state.play, r = net.record, over = playIsOver(), conn = netConnState(), connected = conn === 'open' || conn === 'away' || conn === 'weak';
  const mine = g.turn === p.net.color;
  const fix = !connected ? `<div class="net-fix"><button class="action-btn green" onclick="netReconnect()">🔄 다시 연결</button>${r?.method === 'remote' ? '<button class="action-btn secondary" onclick="netSendLetter()">💌 편지로 보내기</button>' : ''}<button class="action-btn secondary" onclick="netPasteDialog()">📥 받은 코드 넣기</button></div>` : '';
  const emoji = connected && conn !== 'weak' ? `<div class="net-emoji-row" role="group" aria-label="친구에게 표정 보내기">${NET_EMOJIS.map((e, i) => `<button class="play-chip net-emoji-btn" onclick="netEmojiSend(${i})" aria-label="표정 ${e} 보내기">${e}</button>`).join('')}</div>` : '';
  if (over) return `${fix}${emoji}<button class="play-chip" onclick="playPresentEvent(true)">🏁 ${t('playReviewResult')}</button><div class="finish-actions"><button class="action-btn" onclick="netRematchRequest()" ${connected && conn !== 'weak' && !net.rematchOffer ? '' : 'disabled'}>${net.rematchOffer ? '친구의 대답을 기다려요' : '🔁 한 판 더 하자고 하기'}</button><button class="action-btn secondary" onclick="netLeaveGame()">여기까지</button></div>`;
  return `${fix}${emoji}${p.moveEvent?.special && p.moveEvent.acknowledged ? '<button class="play-chip" onclick="playPresentEvent(true)">방금 특수 수 다시 보기</button>' : ''}${g.selected && g.board[g.selected[0]][g.selected[1]]?.[1] === 'K' ? '<button class="play-chip" onclick="playCastlingHelp()">🏰 캐슬링 안내</button>' : ''}${playGuideChipHTML()}${g.status === 'check' ? '<button class="play-chip" onclick="showGameToast(playGuideHTML(), \'\', true)">🛡 왕 구하기 안내</button>' : ''}<div class="mission-actions">${mine ? '<button class="icon-btn hint-btn" onclick="playHint()">💡 한 수 보기</button>' : ''}<button class="icon-btn" onclick="netDrawOffer()" ${connected && conn !== 'weak' && !net.drawOffered ? '' : 'disabled'}>🤝 ${net.drawOffered ? '대답 기다리는 중' : '비기기 제안'}</button><button class="icon-btn" onclick="netResignAsk()">🏳 기권</button></div><div class="finish-actions"><button class="action-btn secondary" onclick="netLeaveGame()">나가기 (나중에 이어 두기)</button></div>`;
}
function netResultActions() {
  const conn = netConnState(), ok = conn === 'open' || conn === 'away';
  return [...(ok ? [{ label: '🔁 한 판 더 하자고 하기', action: netRematchRequest }] : []), { label: '여기까지', secondary: true, action: netLeaveGame }];
}

// --- 기권 · 비기기 · 한 판 더 · 표정 ---
function netResignAsk() {
  if (playIsOver()) return;
  showChoice('정말 기권할까요? 이번 대국은 친구가 이긴 것으로 끝나요.', [{ label: '계속 둘래요', action: () => {} }, { label: '기권할게요', action: netResign }]);
}
function netResign() {
  const r = net.record; if (!r || r.end) return;
  r.end = { type: 'resign', winner: netOpposite(r.color), n: r.moves.length }; netSave(r);
  netSend({ t: 'resign', n: r.moves.length });
  state.play.moveEvent = null; renderPlay();
}
function netDrawOffer() {
  if (playIsOver() || net.drawOffered) return;
  if (!netSend({ t: 'draw?' })) return netToast('연결된 뒤에 비기기를 제안할 수 있어요.');
  net.drawOffered = true; netToast('🤝 비기기를 제안했어요. 친구의 대답을 기다려요.'); renderPlay();
}
function netDrawAsk() {
  showChoice(`${netPeerName()}${netJosa(netPeerName(), '이', '가')} 비기기를 제안했어요. 여기서 비기고 끝낼까요?`, [
    { label: '계속 둘래요', action: () => netSend({ t: 'draw-' }) },
    { label: '비기기 좋아요', action: () => { const r = net.record; if (!r || r.end) return; r.end = { type: 'draw', n: r.moves.length }; netSave(r); netSend({ t: 'draw!' }); state.play.moveEvent = null; renderPlay(); } },
  ], () => netSend({ t: 'draw-' }));
}
function netRematchRequest() {
  const r = net.record; if (!r || net.rematchOffer) return;
  const offer = { gid: netRandom(8), color: netOpposite(r.color) };
  if (!netSend({ t: 'rematch?', gid: offer.gid, color: offer.color })) return netToast('연결된 뒤에 한 판 더 할 수 있어요.');
  net.rematchOffer = offer; netToast(`🔁 한 판 더 하자고 했어요. 이번엔 내가 ${offer.color === 'w' ? '흰색' : '검은색'}이에요.`); netPaint();
}
function netRematchAsk(gid, myColor) {
  playCloseDialog(false);
  showChoice(`${netPeerName()}${netJosa(netPeerName(), '이', '가')} 한 판 더 하재요. 이번엔 내가 ${myColor === 'w' ? '흰색(먼저)' : '검은색'}이에요.`, [
    { label: '좋아요, 한 판 더!', action: () => { netSend({ t: 'rematch!', gid }); netStartRematch(gid, myColor, false); } },
    { label: '이번엔 그만할래요', action: () => netSend({ t: 'rematch-' }) },
  ], () => netSend({ t: 'rematch-' }));
}
function netStartRematch(gid, myColor, inviter) {
  const old = net.record;
  netSave({ v: 1, gid, method: old.method, inviter, color: myColor, small: old.small, moves: [], end: null, acked: 0, peer: old.peer, startedAt: Date.now() });
  netOpenGame(); netToast(`🔁 새 대국! 이번엔 내가 ${myColor === 'w' ? '흰색이라 먼저 둬요' : '검은색이에요. 친구가 먼저 둬요'}.`);
}
function netEmojiSend(i) {
  if (!NET_EMOJIS[i] || Date.now() - net.lastEmojiAt < 1200) return;
  if (netSend({ t: 'emoji', e: i })) { net.lastEmojiAt = Date.now(); netEmojiBubble(NET_EMOJIS[i], true); }
}
function netEmojiIn(i) {
  if (!Number.isInteger(i) || !NET_EMOJIS[i]) return;
  const now = Date.now(); net.emojiIn = net.emojiIn.filter(t => now - t < 4000); if (net.emojiIn.length >= 3) return; net.emojiIn.push(now);
  if (netIsCurrentGame() && state.screen === 'play') netEmojiBubble(NET_EMOJIS[i], false);
}
function netEmojiBubble(emoji, mine) {
  const anchor = document.getElementById(mine ? 'captured-bottom' : 'captured-top'); if (!anchor?.getBoundingClientRect) return;
  const rect = anchor.getBoundingClientRect(), b = document.createElement('div');
  b.className = 'net-emoji-bubble' + (mine ? ' mine' : ''); b.textContent = emoji; b.setAttribute('aria-hidden', 'true');
  b.style.left = Math.max(8, rect.right - 72) + 'px'; b.style.top = (rect.top - 10) + 'px';
  document.body.appendChild(b); setTimeout(() => b.remove(), 2400);
  if (!mine) { const live = document.querySelector('#screen-play .play-state small'); if (live) live.textContent = `${netPeerName()}: ${emoji}`; }
}
// 대국 화면에서는 안내를 판 위 안내(notice)로 보여 다시 그려도 사라지지 않게 한다.
function netToast(text) {
  if (netIsCurrentGame() && state.screen === 'play' && !state.animating) { state.play.notice = state.play.netNotice = text; gameToastKey = ''; renderPlay(); return; }
  showGameToast(`<div class="guide-card">${text}</div>`, 'net|' + text + Date.now(), true);
}

// --- 연결 화면 (screen-net) ---
// wiz: {kind: host(초대·QR 보여 주기) | guest(받기), method: room | remote, purpose: new | continue, step, link, code, invite, error}
function netSetupStartCopy(method) { return method === 'room' ? '📷 내 QR 보여 주기' : '💌 초대장 만들기'; }
function netHostRequest() {
  const s = getPlaySettings(), method = s.netMethod === 'remote' ? 'remote' : 'room', start = () => method === 'remote' ? storeParentGate(() => netHostStart(method, 'new'), '멀리 있는 친구와 대전') : netHostStart(method, 'new');
  const on = netOngoing();
  if (on) return showChoice(`${netPeerName(on)}와 두던 대국이 있어요. 새로 초대하면 그 대국 기록은 지워져요.`, [{ label: '하던 대국 이어 두기', action: netResume }, { label: '새로 초대하기', action: start }]);
  start();
}
async function netHostStart(method, purpose) {
  const s = getPlaySettings(), r = purpose === 'continue' ? netLoad() : null;
  if (purpose === 'continue' && !r) return goPlay();
  const pick = s.netColor === 'b' ? 'b' : s.netColor === 'random' ? (Math.random() < .5 ? 'w' : 'b') : 'w';
  const invite = r ? { gid: r.gid, hostColor: r.color, small: r.small } : { gid: netRandom(8), hostColor: pick, small: !!s.small };
  netWizardOpen({ kind: 'host', method, purpose, step: 'preparing', invite });
  const link = net.wiz.link = netNewLink(), wiz = net.wiz;
  try {
    wiz.code = await link.createOffer(invite.gid, netInfoText(method, invite.hostColor, invite.small, purpose), method);
    if (net.wiz !== wiz) return link.close();
    wiz.step = 'show-offer'; renderNetWizard();
  } catch { if (net.wiz === wiz) netWizardError('연결 정보를 만들지 못했어요. 와이파이나 인터넷에 연결되어 있는지 확인해 주세요.'); }
}
function netGuestScan(method = 'room') { netWizardOpen({ kind: 'guest', method, purpose: 'new', step: 'scan' }); }
function netWizardOpen(w) {
  netWizardClose();
  // 새 대국 연결을 시작하면 예전 대국의 연결은 닫는다(늦게 살아나 새 대국과 섞이지 않게).
  if (w.purpose === 'new' && net.link) { net.link.close(); net.link = null; }
  net.wiz = w; leaveActivity(); showScreen('net'); renderNetWizard();
}
// 연결 화면을 닫는다. 아직 대국 연결이 되지 않은 새 연결은 닫는다.
function netWizardClose() {
  netScanStop();
  const w = net.wiz; net.wiz = null;
  if (w?.link && w.link !== net.link) w.link.close();
}
function netWizardDone() { netScanStop(); net.wiz = null; }
function netWizardBack() {
  const r = netLoad();
  netWizardClose();
  if (r && state.play?.mode === 'net' && state.play.net?.gid === r.gid) netOpenGame(); else goPlay();
}
function netWizardError(text) {
  if (!net.wiz) { netToast('⚠️ ' + text); return; }
  netScanStop(); net.wiz.step = 'error'; net.wiz.error = text; if (state.screen === 'net') renderNetWizard();
}
function netWizardScan() {
  if (!net.wiz) return;
  net.wiz.returnStep = net.wiz.step; net.wiz.step = 'scan'; renderNetWizard();
}
function netCodeBlock(code, kind) {
  const share = kind === 'o' ? '💌 초대장 보내기' : kind === 'a' ? '💌 답장 보내기' : '💌 편지 보내기';
  return `<div class="net-share"><button class="action-btn green" onclick="netShare('${kind}')">${share}</button><button class="action-btn secondary" onclick="netCopy('${kind}')">📋 복사</button></div><details class="net-code-details"><summary>코드 직접 보기</summary><textarea class="net-code-text" readonly rows="3" aria-label="연결 코드" data-code="${code}">${code}</textarea></details>`;
}
function renderNetWizard() {
  const w = net.wiz, el = document.getElementById('screen-net'); if (!w || !el) return;
  const reconnect = w.purpose === 'continue';
  const title = reconnect ? '다시 연결하기' : w.kind === 'host' ? (w.method === 'room' ? '같은 방에서 연결' : '멀리 있는 친구 초대') : '친구 초대 받기';
  const conn = w.link?.state, stalled = w.link?.stalled;
  let body = '';
  if (w.step === 'preparing') body = `<div class="net-card net-wait"><span class="net-spinner" aria-hidden="true"></span><p>연결 정보를 만드는 중이에요…</p></div>`;
  else if (w.step === 'scan') body = `<div class="net-card"><p class="net-step"><b class="net-num">${w.kind === 'host' ? '②' : '①'}</b> 친구 화면의 QR을 네모 안에 맞춰요.</p><div class="net-camera"><video id="net-video" playsinline muted aria-label="카메라 화면"></video><span class="net-camera-frame" aria-hidden="true"></span></div><p class="net-scan-status" role="status">카메라를 켜는 중이에요…</p></div><div class="net-actions"><button class="action-btn secondary" onclick="netPasteDialog()">⌨️ 코드로 넣기</button>${w.returnStep ? `<button class="action-btn secondary" onclick="net.wiz.step=net.wiz.returnStep;net.wiz.returnStep=null;netScanStop();renderNetWizard()">← 내 QR 보기</button>` : ''}</div>`;
  else if (w.step === 'show-offer' && w.method === 'room') body = `<div class="net-card"><p class="net-step"><b class="net-num">①</b> 친구 휴대폰으로 이 QR을 찍어요. <small>(친구: 대전 → 두 기기로 → 친구 QR 찍기)</small></p><div class="net-qr" data-code="${w.code}">${netQrSvg(w.code)}</div></div><div class="net-card"><p class="net-step"><b class="net-num">②</b> 친구 화면에 QR이 나오면 그 QR을 찍어요.</p>${conn === 'connecting' ? netConnectingHTML(stalled) : `<button class="action-btn green net-big" onclick="netWizardScan()">📷 친구 QR 찍기</button>`}</div>${netCodeDetails(w.code)}`;
  else if (w.step === 'show-offer') body = `<div class="net-card"><p class="net-step"><b class="net-num">①</b> 초대장을 친구에게 보내요. <small>카톡 같은 메신저로 보내면 돼요.</small></p>${netCodeBlock(w.code, 'o')}</div><div class="net-card"><p class="net-step"><b class="net-num">②</b> 친구가 보낸 <strong>답장 코드</strong>를 붙여 넣어요.</p>${conn === 'connecting' ? netConnectingHTML(stalled) : netPasteFormHTML('답장 코드를 여기에 붙여 넣어요')}</div><p class="net-note">초대장에는 이 기기의 인터넷 주소가 들어 있어요. 아는 친구에게만 보내요. 대국 내용은 어떤 서버에도 저장되지 않아요. 답장은 5분 안에 주고받는 게 좋아요.</p>`;
  else if (w.step === 'show-answer' && w.method === 'room') body = `<div class="net-card"><p class="net-step"><b class="net-num">②</b> 이제 친구가 이 QR을 찍으면 연결돼요.</p><div class="net-qr" data-code="${w.code}">${netQrSvg(w.code)}</div>${netWaitingHTML()}</div>${netCodeDetails(w.code)}`;
  else if (w.step === 'show-answer') body = `<div class="net-card"><p class="net-step"><b class="net-num">②</b> 답장을 친구에게 보내요.</p>${netCodeBlock(w.code, 'a')}</div><div class="net-card"><p class="net-step"><b class="net-num">③</b> 친구가 답장을 넣으면 바로 시작해요.</p>${netWaitingHTML()}</div><p class="net-note">답장에는 이 기기의 인터넷 주소가 들어 있어요. 초대한 친구에게만 보내요.</p>`;
  else if (w.step === 'error') body = `<div class="net-card net-error" role="alert"><p>⚠️ ${w.error}</p></div><div class="net-actions"><button class="action-btn green" onclick="netWizardRetry()">처음부터 다시</button><button class="action-btn secondary" onclick="netWizardBack()">돌아가기</button></div>`;
  el.innerHTML = `<div class="screen-wrap net-screen"><div class="screen-header"><button class="back-btn" onclick="netWizardBack()">← ${t('btnBack')}</button><h2>${title}</h2></div>${reconnect && net.record ? `<p class="net-game-line">${netPeerName()}와 두던 대국 · ${net.record.moves.length}수째 · 이어서 둘 수 있어요</p>` : ''}${body}</div>`;
  if (w.step === 'scan') {
    const video = document.getElementById('net-video'), status = el.querySelector('.net-scan-status');
    netScanStart(video, text => netHandleCode(text), err => { if (status) status.textContent = { denied: '카메라를 쓸 수 없어요. 설정에서 카메라를 허락하거나 ‘코드로 넣기’를 눌러요.', nocamera: '이 기기에는 쓸 수 있는 카메라가 없어요. ‘코드로 넣기’를 눌러요.', nodecoder: 'QR을 읽는 도구를 불러오지 못했어요. ‘코드로 넣기’를 눌러요.' }[err] || '카메라를 켜지 못했어요.'; });
    setTimeout(() => { if (status && netScan.stream && /켜는 중/.test(status.textContent)) status.textContent = 'QR을 찾는 중이에요. 화면 밝기를 높이고 조금 떨어져서 찍어요.'; }, 1500);
  }
}
function netCodeDetails(code) { return `<details class="net-code-details"><summary>카메라가 없으면: 코드로 보내기</summary><div class="net-share"><button class="action-btn secondary" onclick="netCopy('${net.wiz?.step === 'show-answer' ? 'a' : 'o'}')">📋 코드 복사</button><button class="action-btn secondary" onclick="netPasteDialog()">⌨️ 받은 코드 넣기</button></div><textarea class="net-code-text" readonly rows="3" aria-label="연결 코드" data-code="${code}">${code}</textarea></details>`; }
function netWaitingHTML() {
  const l = net.wiz?.link, remote = net.wiz?.method === 'remote';
  return `<p class="net-wait-line" role="status"><span class="net-spinner small" aria-hidden="true"></span>친구를 기다리는 중이에요…</p>${l?.stalled ? `<div class="net-stall"><p>${remote ? '친구가 답장을 넣었는데도 연결되지 않으면, 통신사 망이나 학교·회사 인터넷이 직접 연결을 막고 있을 수 있어요. 와이파이로 바꿔 새 초대장으로 다시 하거나 편지로 둘 수 있어요.' : '친구가 QR을 찍었는데도 연결되지 않으면 두 기기가 같은 와이파이에 있는지 확인해요. 한 휴대폰의 핫스팟에 다른 휴대폰을 연결해도 돼요.'}</p><div class="net-actions">${remote ? '<button class="action-btn secondary" onclick="netLetterStart()">💌 편지로 두기</button>' : ''}<button class="action-btn secondary" onclick="netWizardBack()">처음으로</button></div></div>` : ''}`;
}
function netConnectingHTML(stalled) {
  return `<p class="net-wait-line" role="status"><span class="net-spinner small" aria-hidden="true"></span>연결하는 중이에요…</p>${stalled ? `<div class="net-stall"><p>아직 연결되지 않았어요. ${net.wiz.method === 'room' ? '두 기기가 같은 와이파이에 있는지 확인해요. 손님용 와이파이에서는 막힐 수 있어요. 한 휴대폰의 핫스팟에 다른 휴대폰을 연결해 봐요.' : '통신사 망이나 회사·학교 인터넷에서는 직접 연결이 막힐 수 있어요. 와이파이로 바꿔 보거나, 연결 없이 편지로 둘 수 있어요.'}</p><div class="net-actions"><button class="action-btn secondary" onclick="netWizardRetry()">새 코드로 다시</button>${net.wiz.method === 'remote' ? '<button class="action-btn secondary" onclick="netLetterStart()">💌 편지로 두기</button>' : ''}</div></div>` : ''}`;
}
function netPasteFormHTML(placeholder) {
  return `<form class="net-paste" onsubmit="event.preventDefault();netPasteSubmit(this)"><textarea name="code" rows="3" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea><p class="net-paste-error" role="alert"></p><div class="net-actions"><button type="button" class="action-btn secondary" onclick="netPasteFromClipboard(this.form)">📋 붙여넣기</button><button type="submit" class="action-btn green">연결하기</button></div></form>`;
}
async function netPasteFromClipboard(form) {
  try { const text = await navigator.clipboard.readText(); if (text) { form.code.value = text; return netPasteSubmit(form); } } catch {}
  form.querySelector('.net-paste-error').textContent = '자동 붙여넣기를 쓸 수 없어요. 칸을 길게 눌러 붙여 넣어요.'; form.code.focus();
}
function netPasteSubmit(form) {
  const text = form.code.value, err = form.querySelector('.net-paste-error');
  if (!netParseCode(text)) { err.textContent = '코드를 읽지 못했어요. 처음부터 끝까지 모두 복사했는지 확인해 주세요.'; return; }
  closeActivityDialog(false); netHandleCode(text);
}
function netPasteDialog() {
  netScanStop();
  showActivityDialog('받은 코드 넣기', `<p>친구가 보낸 초대장·답장·편지를 붙여 넣어요.</p>${netPasteFormHTML('받은 코드나 메시지를 여기에 붙여 넣어요')}`, [], 'net-paste-overlay', () => { if (net.wiz?.step === 'scan') renderNetWizard(); });
  document.querySelector('#net-paste-overlay textarea')?.focus?.({ preventScroll: true });
}
function netWizardRetry() {
  const w = net.wiz; if (!w) return goPlay();
  if (w.kind === 'host') netHostStart(w.method, w.purpose); else netWizardOpen({ kind: 'guest', method: w.method, purpose: w.purpose, step: w.method === 'room' ? 'scan' : 'error', error: '친구에게 새 초대장을 보내 달라고 한 뒤, 받은 코드를 넣어요.' });
}
async function netShare(kind) {
  const code = kind === 'm' ? net.letter : net.wiz?.code; if (!code) return;
  const url = netShareURL(code);
  const text = { o: '♟ 체스 대전 초대장이에요! 링크를 누르거나, 체스 앱 → 대전 → 두 기기로 → ‘받은 코드 넣기’에 이 메시지를 붙여 넣어요.', a: '♟ 체스 대전 답장이에요. 체스 앱의 초대장 화면에 이 메시지를 붙여 넣어요.', m: '♟ 체스 편지가 왔어요! 링크를 누르거나, 체스 앱 → 대전 → 두 기기로 → ‘받은 코드 넣기’에 붙여 넣어요.' }[kind];
  if (navigator.share) { try { await navigator.share({ title: '체스 대전', text: text + '\n' + url }); return; } catch (e) { if (e?.name === 'AbortError') return; } }
  netCopy(kind);
}
async function netCopy(kind) {
  const code = kind === 'm' ? net.letter : net.wiz?.code; if (!code) return;
  const text = netShareURL(code);
  try { await navigator.clipboard.writeText(text); showGameToast('<div class="guide-card">📋 복사했어요. 메신저에 붙여 넣어 보내요.</div>', 'net-copy' + Date.now(), true); }
  catch { const box = document.querySelector('.net-code-details'); if (box) { box.open = true; box.querySelector('textarea')?.select(); } showGameToast('<div class="guide-card">자동 복사를 쓸 수 없어요. 아래 코드를 길게 눌러 복사해요.</div>', 'net-copy' + Date.now(), true); }
}

// --- 받은 코드 처리 (QR · 붙여넣기 · 링크 공통) ---
async function netHandleCode(text) {
  const parsed = netParseCode(text);
  if (!parsed) return netWizardError('코드를 읽지 못했어요. 처음부터 끝까지 모두 복사했는지 확인해 주세요.');
  if (parsed.kind === 'a') {
    const w = net.wiz;
    if (w?.kind === 'host' && w.link?.nonce === parsed.nonce && w.link.state !== 'new') { closeActivityDialog(false); w.step = 'show-offer'; return renderNetWizard(); }
    if (!w || w.kind !== 'host' || !w.link || w.link.nonce !== parsed.nonce) return netWizardError(w?.kind === 'host' ? '이 답장은 지금 초대장의 답장이 아니에요. 가장 최근 초대장의 답장을 넣어 주세요.' : '이 답장을 기다리는 초대장이 없어요. 초대장을 만든 화면에서 넣어 주세요. 그 화면을 닫았다면 새 초대장을 만들어야 해요.');
    try { await w.link.acceptAnswer(parsed); } catch { return netWizardError('답장으로 연결하지 못했어요. 새 초대장으로 다시 해 봐요.'); }
    w.step = 'show-offer'; renderNetWizard(); return;
  }
  if (parsed.kind === 'm') return netApplyLetter(parsed);
  return netAcceptOffer(parsed);
}
function netAcceptOffer(parsed) {
  const i = parsed.info, r = netLoad(), myColor = netOpposite(i.hostColor);
  if (i.purpose === 'continue') {
    if (!r || r.gid !== parsed.gid || r.color !== myColor || r.small !== i.small) return netWizardError('이 기기에는 이 대국 기록이 없어요. 친구에게 ‘새로 초대’를 부탁해 주세요.');
    return netGuestStart(parsed);
  }
  const go = () => i.method === 'remote' ? storeParentGate(() => netGuestStart(parsed), '멀리 있는 친구와 대전') : netGuestStart(parsed);
  const on = netOngoing();
  if (on && on.gid !== parsed.gid) return showChoice(`${netPeerName(on)}와 두던 대국이 있어요. 새 초대를 받으면 그 대국 기록은 지워져요.`, [{ label: '하던 대국 이어 두기', action: netResume }, { label: '새 초대 받기', action: go }]);
  go();
}
async function netGuestStart(parsed) {
  const i = parsed.info;
  netWizardOpen({ kind: 'guest', method: i.method, purpose: i.purpose, step: 'preparing', invite: { gid: parsed.gid, hostColor: i.hostColor, small: i.small } });
  const wiz = net.wiz, link = wiz.link = netNewLink();
  try {
    wiz.code = await link.acceptOffer(parsed, i.method);
    if (net.wiz !== wiz) return link.close();
    wiz.step = 'show-answer'; renderNetWizard();
  } catch { if (net.wiz === wiz) netWizardError('초대장으로 연결 정보를 만들지 못했어요. 와이파이나 인터넷에 연결되어 있는지 확인해 주세요.'); }
}

// --- 하던 대국 · 다시 연결 ---
function netResume() { if (netLoad()) netOpenGame(); else goPlay(); }
function netReconnect() {
  const r = netLoad(); if (!r) return goPlay();
  showActivityDialog('다시 연결하기', `<p>${netPeerName(r)}와 두던 대국을 그대로 이어요. 한 사람만 ‘새 연결 만들기’를 눌러요.</p><p class="section-note">같은 방이면 QR을, 멀리 있으면 코드를 메신저로 주고받아요.</p>`, [
    { label: r.method === 'room' ? '📷 내가 새 QR 보여 주기' : '💌 내가 새 초대장 보내기', action: () => netHostStart(r.method, 'continue') },
    { label: r.method === 'room' ? '📥 친구 QR 찍기' : '📥 친구가 보낸 코드 넣기', action: () => r.method === 'room' ? netWizardOpen({ kind: 'guest', method: 'room', purpose: 'continue', step: 'scan' }) : netPasteDialog() },
    { label: r.method === 'room' ? '멀리서 코드로 연결' : '같은 방이면 QR로 연결', action: () => netHostStart(r.method === 'room' ? 'remote' : 'room', 'continue') },
  ], 'net-reconnect-overlay');
}

// --- 편지: 연결 없이 수 목록을 메신저로 ---
function netSendLetter() {
  const r = netLoad(); if (!r) return;
  net.letter = netMakeLetter(r.gid, r.small, netOpposite(r.color), r.moves, r.end);
  showActivityDialog('💌 편지로 보내기', `<p>지금까지 둔 수를 모두 담은 편지예요. 친구가 받은 코드 넣기에 붙여 넣으면 같은 판이 돼요.</p>${netCodeBlock(net.letter, 'm')}<p class="section-note">연결이 돌아오면 편지 없이도 판이 저절로 맞춰져요.</p>`, [{ label: '닫기', action: () => {} }], 'net-letter-overlay');
}
function netLetterStart() {
  const w = net.wiz; if (!w?.invite) return;
  if (!net.record || net.record.gid !== w.invite.gid) netCreateRecordFromWizard();
  netWizardClose(); netOpenGame();
  netToast('💌 연결 없이 두는 중이에요. 내가 수를 두면 ‘편지로 보내기’로 친구에게 보내요.');
}
function netApplyLetter(p) {
  const r = netLoad(), game = netReplay(p.small, p.moves);
  if (!game) return netWizardError('편지의 수가 규칙에 맞지 않아요. 친구에게 다시 보내 달라고 해 주세요.');
  if (!r || r.gid !== p.gid) {
    const adopt = () => {
      netWizardClose();
      netSave({ v: 1, gid: p.gid, method: 'remote', inviter: false, color: p.toColor, small: p.small, moves: p.moves.slice(), end: p.end, acked: p.moves.length, peer: { name: '친구', icon: '🙂' }, startedAt: Date.now() });
      netOpenGame(); netToast('💌 편지로 대국을 이어 둬요. 내가 둔 뒤 ‘편지로 보내기’로 답장해요.');
    };
    return showChoice(r && !r.end ? `이 편지는 다른 대국이에요. 열면 ${netPeerName(r)}와 두던 대국 기록은 지워져요.` : '친구가 보낸 체스 편지예요. 이 기기에서 이어 둘까요?', [{ label: '편지 대국 열기', action: adopt }, { label: '닫기', action: () => {} }]);
  }
  if (p.toColor !== r.color) return netWizardError('이 편지는 내가 보낸 편지예요. 친구가 보낸 편지를 넣어 주세요.');
  const merged = netMergeMoves(r.moves, p.moves, r.inviter, false);
  netWizardClose();
  if (merged.conflict) { netOpenGame(); return netToast('⚠️ 편지의 판이 이 기기의 판과 달라요. 다시 연결하면 처음 초대한 쪽 판으로 맞춰져요.'); }
  const fresh = merged.moves.length > r.moves.length;
  r.moves = merged.moves; if (!r.end && p.end && p.end.n === r.moves.length) r.end = p.end; r.acked = Math.max(r.acked, Math.min(p.moves.length, r.moves.length)); netSave(r);
  netOpenGame(); netToast(fresh ? `💌 ${netPeerName()}의 수가 도착했어요!` : '💌 이미 받은 편지예요. 판은 그대로예요.');
}

// --- 대전 설정 화면의 '두 기기로' ---
function netSetupHTML(s) {
  const method = s.netMethod === 'remote' ? 'remote' : 'room', color = ['w', 'b', 'random'].includes(s.netColor) ? s.netColor : 'w';
  const methods = [['room', '📷', '같은 방에서', 'QR을 서로 찍어요'], ['remote', '💌', '멀리 있는 친구', '메신저로 초대장']].map(([m, icon, title, sub]) => `<button class="play-mode net-method ${method === m ? 'active' : ''}" aria-pressed="${method === m}" onclick="playSetOption('netMethod','${m}')"><span class="play-mode-icon" aria-hidden="true">${icon}</span><span class="play-mode-text"><strong>${title}</strong><small>${sub}</small></span></button>`).join('');
  const colors = [['w', '흰색 (먼저)'], ['b', '검은색'], ['random', '무작위']].map(([c, label]) => `<button class="play-chip ${color === c ? 'active' : ''}" aria-pressed="${color === c}" onclick="playSetOption('netColor','${c}')">${label}</button>`).join('');
  return `<div class="play-section-title">연결 방법</div><div class="play-modes net-methods">${methods}</div><div class="play-section-title">내 색 <small class="net-hint">초대하는 사람이 정해요</small></div><div class="play-timers">${colors}</div>`;
}
function netSetupCtaHTML(s) {
  const method = s.netMethod === 'remote' ? 'remote' : 'room';
  return `<div class="play-cta"><button class="action-btn play-start" onclick="netHostRequest()">${netSetupStartCopy(method)}</button><button class="action-btn secondary" onclick="${method === 'room' ? 'netGuestScan()' : 'netPasteDialog()'}">${method === 'room' ? '📥 친구 QR 찍기 (초대 받기)' : '📥 받은 코드 넣기'}</button><p class="play-entry-note">${method === 'room' ? '두 기기가 같은 와이파이에 있어야 해요. 와이파이가 없으면 한 휴대폰의 핫스팟에 다른 휴대폰을 연결해요.' : '초대장에는 이 기기의 인터넷 주소가 들어 있어요. 아는 친구에게만 보내요. 대국 내용은 어떤 서버에도 저장되지 않아요.'}</p></div>`;
}
function netSavedCardHTML() {
  const r = netOngoing(); if (!r) return '';
  const g = netReplay(r.small, r.moves), mine = g && g.turn === r.color, conn = net.link?.profile === activeProfile ? netConnState() : 'none';
  return `<button class="content-card choice-card net-saved-card" onclick="netResume()"><span class="choice-icon" aria-hidden="true">📡</span><span class="choice-text"><strong>${netPeerName(r)}와 두던 대국 이어 두기</strong><span>${r.moves.length}수째 · ${mine ? '내 차례예요' : '친구 차례예요'} · ${conn === 'open' || conn === 'away' ? '🟢 연결됨' : '연결 끊김'}</span></span><span class="choice-arrow" aria-hidden="true">›</span></button>`;
}

// 홈: 두 기기 대국이 내 차례이거나 지금 연결돼 있으면 바로 가는 카드
function netHomeCardHTML() {
  const r = netOngoing(); if (!r) return '';
  const g = netReplay(r.small, r.moves), mine = g && g.turn === r.color, live = net.link?.profile === activeProfile && ['open', 'weak'].includes(net.link.state);
  return mine || live ? `<button class="new-skin-card net-home-card" onclick="netResume()">📡 ${netPeerName(r)}와 두는 대국 · ${mine ? '내 차례예요' : '연결돼 있어요'}</button>` : '';
}

// --- 링크(#net=코드)로 열렸을 때 ---
// 이미 열려 있는 체스 화면(같은 브라우저의 다른 탭)이 있으면 그 화면에 코드를 넘긴다. 답장은 초대장을 만든 화면에서만 쓸 수 있다.
// 통로는 화면이 준비된 뒤(브라우저)에만 연다. Node에도 BroadcastChannel이 있어 미리 열면 검사 프로세스가 끝나지 않는다.
let netChannel = null;
function netChannelOpen() {
  if (netChannel || typeof BroadcastChannel !== 'function') return netChannel;
  try { netChannel = new BroadcastChannel('chess-kids-net'); } catch { return null; }
  netChannel.onmessage = e => {
    const d = e.data || {};
    if (d.type === 'code' && typeof d.code === 'string' && typeof d.id === 'string') {
      const parsed = netParseCode(d.code); if (!parsed) return;
      const mine = parsed.kind === 'a' ? net.wiz?.link?.nonce === parsed.nonce : !!(net.link || net.wiz);
      if (mine) { netChannel.postMessage({ type: 'taken', id: d.id }); netHandleCode(d.code); }
    } else if (d.type === 'taken' && d.id === net.handoff) net.handoff = 'taken';
  };
  return netChannel;
}
function netBoot() {
  netChannelOpen();
  const m = /[#&]net=(CK1[oam]\.[A-Za-z0-9_-]+)/.exec(window.location.hash || ''); if (!m) return;
  try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch {}
  const code = m[1];
  if (!netChannel) return netHandleCode(code);
  const id = netRandom(8); net.handoff = id; netChannel.postMessage({ type: 'code', code, id });
  setTimeout(() => {
    if (net.handoff === 'taken') return showActivityDialog('열려 있던 체스 화면으로', '<p>이미 열려 있던 체스 화면에 코드를 넘겼어요. 그 화면으로 돌아가 주세요. 이 창은 닫아도 돼요.</p>', [{ label: '확인', action: () => {} }]);
    net.handoff = null; netHandleCode(code);
  }, 600);
}
document.addEventListener('DOMContentLoaded', netBoot);
window.addEventListener?.('hashchange', netBoot);
