// 내 대국 코치 (docs/PREMIUM_COURSE.md §7)
// 컴퓨터와 둔 판(나 = 흰색)을 끝까지 다시 두며, 내 수마다 체스 수업과 같은 판정으로 살펴볼 장면을 찾는다.
// 장면: 상대에게 메이트 기회를 줌 · 메이트를 놓침 · 이기던 판을 비김 · 말을 공짜로 줌 · 공짜 말을 놓침 · 전술을 놓침, 그리고 잘한 수.
// 장면마다 그 국면에서 다시 두어 보고, 원래 둔 수와 비교하고, 같은 주제의 체스 수업 무한 연습으로 이어진다.
const COACH_LIMIT = 20, COACH_SLICE = 14;
const COACH_TYPES = {
  allowedMate: { icon: '🚨', title: '상대에게 메이트 기회', goal: '이 수 다음에 상대가 체크메이트할 수 있었어요. 상대의 메이트를 막는 수를 찾아요.', lesson: 'stop-mate-v1' },
  missedMate: { icon: '👑', title: '체크메이트 기회', goal: '여기서 한 수에 체크메이트할 수 있었어요. 찾아볼까요?', lesson: 'mate-v1' },
  stalemated: { icon: '🤝', title: '이기던 판이 비김', goal: '이 수로 상대가 둘 곳이 없어져 비겼어요(스테일메이트). 상대 킹에게 칸을 남기는 수를 찾아요.', lesson: 'stalemate-v1' },
  hung: { icon: '🛡', title: '말을 공짜로 줌', goal: '이 수 뒤에 상대가 내 말을 이득 보고 잡을 수 있었어요. 말을 잃지 않는 수를 찾아요.', lesson: 'protect-all-v3' },
  missedCapture: { icon: '🎯', title: '공짜로 잡을 말', goal: '여기서 이득 보고 잡을 수 있는 상대 말이 있었어요. 찾아볼까요?', lesson: 'trade-v1' },
  missedTactic: { icon: '⚡', title: '전술 기회', goal: '여기서 상대가 무엇을 해도 이득을 보는 수가 있었어요.', lesson: 'fork-v1' },
};
const COACH_SHAPE = { fork: ['포크', 'fork-v1'], pin: ['핀', 'pin-v1'], skewer: ['꼬치 공격', 'skewer-v1'], discover: ['발견 공격', 'discover-v1'] };

// ===== 대국 기록 =====
// 수는 'frfctrtc'(+승격 글자) 문자열로 짧게. 시작 배치는 FEN(캐슬링 포함).
function coachMoveCode(m, promo) { return `${m[0]}${m[1]}${m[2]}${m[3]}${promo || ''}`; }
function coachMoveOf(code) { const m = [0, 1, 2, 3].map(i => Number(code[i])); if (code[4]) m.push(code[4]); return m; }
function coachRecordStart() {
  if (!state.play || state.play.mode !== 'ai') return;
  state.play.record = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), fen: cgFen(state.game), moves: [] };
}
function coachRecordMove(fr, fc, tr, tc, piece, promotion) {
  const r = state.play?.record; if (!r || r.moves.length > 400) return;
  r.moves.push(coachMoveCode([fr, fc, tr, tc], piece?.[1] === 'P' && (tr === 0 || tr === 7) ? promotion || 'Q' : ''));
}
function coachRecords() { const d = readData('game_records_v1', null); return coachRecordsValid(d) ? d.games : []; }
function coachRecordValid(g) {
  return !!g && typeof g === 'object' && !Array.isArray(g) && typeof g.id === 'string' && /^[a-z0-9]{4,24}$/.test(g.id) && Number.isFinite(g.at) && g.at > 0 && ['win', 'loss', 'draw'].includes(g.result)
    && Number.isInteger(g.level) && g.level >= 0 && g.level < 10 && typeof g.fen === 'string' && /^[1-8KQRBNPkqrbnp/]{15,71} [wb] (-|K?Q?k?q?) - 0 1$/.test(g.fen)
    && Array.isArray(g.moves) && g.moves.length <= 400 && g.moves.every(m => typeof m === 'string' && /^[0-7]{4}[QRBN]?$/.test(m)) && (g.content === null || typeof g.content === 'string' && /^[a-zA-Z]{1,24}$/.test(g.content))
    && (g.scenes === undefined || Array.isArray(g.scenes) && g.scenes.length <= 8 && g.scenes.every(s => s && typeof s.type === 'string' && (COACH_TYPES[s.type] || s.type === 'good') && Number.isInteger(s.ply) && s.ply >= 0 && s.ply < g.moves.length));
}
function coachRecordsValid(d) { return !!d && typeof d === 'object' && !Array.isArray(d) && d.version === 1 && Array.isArray(d.games) && d.games.length <= COACH_LIMIT && d.games.every(coachRecordValid) && new Set(d.games.map(g => g.id)).size === d.games.length; }
// 대국이 끝나면 기록을 저장한다(되돌리기 뒤 다시 끝나면 같은 ID를 새 기록으로 바꾼다).
function coachSaveRecord() {
  const p = state.play, g = state.game, r = p?.record; if (!r || p.mode !== 'ai' || !playIsOver() || !r.moves.length) return null;
  const result = g.status === 'checkmate' ? (g.turn === 'b' ? 'win' : 'loss') : 'draw';
  const games = coachRecords().filter(x => x.id !== r.id);
  games.unshift({ id: r.id, at: Date.now(), result, level: p.level, fen: r.fen, moves: r.moves.slice(), content: p.content?.type || null });
  writeData('game_records_v1', { version: 1, games: games.slice(0, COACH_LIMIT) });
  return r.id;
}
function coachStats() { const s = readData('coach_stats_v1', null); return s && s.version === 1 && Number.isInteger(s.solved) && s.solved >= 0 ? s : { version: 1, solved: 0 }; }

// ===== 분석 =====
function coachApply(b, m) { return cgApply(b, m); }
// 내 수 mm의 말 득실: 잡은 점수 - 상대가 이어서 잡을 수 있는 점수(체크메이트면 크게)
function coachScore(b, m) { const b1 = coachApply(b, m); if (lrStatus(b1, 'b') === 'checkmate') return 100; return crCapValue(b, m) - lrQs(b1, 'b', 4); }
function coachMaterial(b) { let s = 0; for (const row of b) for (const p of row) if (p && p[1] !== 'K') s += (p[0] === 'w' ? 1 : -1) * LR_VALUE[p[1]]; return s; }
// 국면 하나(백 차례)와 실제로 둔 수를 살펴 장면을 만든다. 없으면 null.
function coachInspect(game, played) {
  const b = game.board, moves = game.allMoves().filter(m => !m[4] || m[4] === 'Q').map(m => m.slice(0, 4));
  if (!moves.length) return null;
  const b1 = coachApply(b, played), st = lrStatus(b1, 'b'), playedMate = st === 'checkmate';
  if (playedMate) return { type: 'good', kind: 'mate', severity: 30 };
  const mates = moves.filter(m => lrStatus(coachApply(b, m), 'b') === 'checkmate');
  const threats = lrMateThreats(b1);
  if (threats.length && moves.some(m => !lrMateThreats(coachApply(b, m)).length)) return { type: 'allowedMate', severity: 100, reply: threats[0] };
  if (st === 'stalemate' && coachMaterial(b) >= 3) return { type: 'stalemated', severity: 90 };
  if (mates.length) return { type: 'missedMate', severity: 80, best: mates[0] };
  const scores = moves.map(m => ({ m, s: coachScore(b, m) })), best = scores.reduce((a, x) => x.s > a.s ? x : a, scores[0]), mine = coachScore(b, played);
  if (best.s - mine >= 3) {
    if (mine <= -3) return { type: 'hung', severity: -mine * 10, best: best.m, capture: !!b[played[2]][played[3]], reply: lrBestCapture(b1, 'b', 4).move };
    if (best.s >= 3 && b[best.m[2]][best.m[3]]) return { type: 'missedCapture', severity: (best.s - mine) * 8, best: best.m };
  }
  if (mine >= 3 && b[played[2]][played[3]]) return { type: 'good', kind: 'capture', severity: 20 + mine };
  // 전술: 모양(포크·핀·꼬치·발견 공격)이 있는 수만 lrGain으로 계산한다.
  let tactic = null;
  for (const m of moves) {
    const s = lrShape(b, m), shape = ['fork', 'pin', 'skewer', 'discover'].find(k => s[k]); if (!shape) continue;
    const g = lrGain(b, m); if (g.gain >= 3 && (!tactic || g.gain > tactic.gain)) tactic = { m, gain: g.gain, shape };
  }
  if (tactic) {
    const mineGain = lrGain(b, played).gain;
    if (tactic.m.join() === played.join() || mineGain >= tactic.gain - 1) return mineGain >= 3 ? { type: 'good', kind: 'tactic', shape: tactic.shape, severity: 25 } : null;
    return { type: 'missedTactic', severity: tactic.gain * 6, best: tactic.m, shape: tactic.shape };
  }
  return null;
}
// 판 전체 분석 작업(조금씩 나눠 계산). 결과: 살펴볼 장면(중요한 순서, 최대 3) + 잘한 수(최대 1).
function coachJob(record) {
  const job = { record, ply: 0, game: ChessGame.fromFEN(record.fen), found: [], done: false, total: record.moves.length };
  job.step = (ms = COACH_SLICE) => {
    const start = Date.now();
    while (!job.done && Date.now() - start < ms) {
      if (job.ply >= record.moves.length) { job.done = true; break; }
      const m = coachMoveOf(record.moves[job.ply]), g = job.game;
      if (g.turn === 'w' && g.status !== 'checkmate' && g.status !== 'draw') {
        let s = null; try { s = coachInspect(g, m.slice(0, 4)); } catch { s = null; }
        if (s) job.found.push({ ...s, ply: job.ply, fen: cgFen(g), played: m.slice(0, 4), next: record.moves[job.ply + 1] ? coachMoveOf(record.moves[job.ply + 1]).slice(0, 4) : null });
      }
      if (g.move(m[0], m[1], m[2], m[3], m[4] || 'Q') !== 'moved') { job.done = true; break; }
      g.selected = null; g.validMoves = [];
      job.ply++;
    }
    return job.done;
  };
  job.result = () => {
    const issues = job.found.filter(s => s.type !== 'good').sort((a, b) => b.severity - a.severity || a.ply - b.ply).slice(0, 3).sort((a, b) => a.ply - b.ply);
    const good = job.found.filter(s => s.type === 'good').sort((a, b) => b.severity - a.severity)[0] || null;
    return { scenes: issues, good };
  };
  return job;
}

// ===== 화면 =====
let coachToken = 0;
function goCoach(gameId) {
  leaveActivity(); showScreen('coach');
  state.coach = { gameId: gameId || coachRecords()[0]?.id || null, phase: 'list', analysis: null, job: null, scene: null };
  renderCoach();
  if (state.coach.gameId) coachAnalyze(state.coach.gameId);
}
function coachRecord(id) { return coachRecords().find(g => g.id === id) || null; }
function coachAnalyze(id) {
  const record = coachRecord(id); if (!record) return;
  const token = ++coachToken; state.coach.gameId = id; state.coach.analysis = null; state.coach.job = coachJob(record); state.coach.phase = 'list';
  const pump = () => {
    if (token !== coachToken || state.screen !== 'coach' || !state.coach?.job) return;
    const done = state.coach.job.step();
    if (!done) { coachPaintProgress(); return void setTimeout(pump, 0); }
    state.coach.analysis = state.coach.job.result(); state.coach.job = null;
    // 기록에 장면 요약을 남겨 목록에 개수를 보여 준다.
    const all = readData('game_records_v1', null);
    if (coachRecordsValid(all)) { const g = all.games.find(x => x.id === id); if (g) { g.scenes = [...state.coach.analysis.scenes, ...(state.coach.analysis.good ? [state.coach.analysis.good] : [])].map(s => ({ type: s.type, ply: s.ply })); writeData('game_records_v1', all); } }
    renderCoach();
  };
  renderCoach(); setTimeout(pump, 30);
}
function coachPaintProgress() {
  const bar = document.querySelector('#screen-coach .coach-progress i'), job = state.coach?.job; if (!bar || !job) return;
  bar.style.width = Math.round(job.ply / Math.max(1, job.total) * 100) + '%';
}
function coachResultLabel(g) { return { win: '🏆 이김', loss: '🏁 짐', draw: '🤝 비김' }[g.result]; }
function coachGameLine(g) { return `${new Date(g.at).toLocaleDateString('ko-KR')} · 컴퓨터 ${playLevelLabel(g.level)} · ${coachResultLabel(g)} · ${Math.ceil(g.moves.length / 2)}수`; }
function coachSceneTitle(s) { if (s.type === 'missedTactic') return `${COACH_SHAPE[s.shape][0]} 기회`; return COACH_TYPES[s.type].title; }
function coachMoveNumber(s) { return Math.floor(s.ply / 2) + 1; }
function renderCoach() {
  const c = state.coach; if (!c) return goCoach();
  if (c.phase === 'scene') return renderCoachScene();
  const records = coachRecords(), full = storeOwns('coach_full'), g = coachRecord(c.gameId);
  const header = `<div class="screen-header"><button class="back-btn" onclick="goPlay()">← 체스 대전</button><h2>내 대국 코치</h2></div>`;
  if (!records.length || !g) {
    document.getElementById('screen-coach').innerHTML = `<div class="screen-wrap coach-screen">${header}<section class="lesson-course"><h3>아직 살펴볼 대국이 없어요</h3><p>컴퓨터와 한 판을 <b>끝까지</b> 두면, 코치가 내 수를 하나씩 다시 보며 살펴볼 장면을 찾아 줘요.</p></section><button class="action-btn green" onclick="goPlay()">컴퓨터와 한 판 두기</button></div>`;
    return;
  }
  let body;
  if (c.job || !c.analysis) body = `<section class="coach-summary" aria-live="polite"><h3>코치가 내 수를 살펴보는 중…</h3><span class="lesson-bar coach-progress" role="progressbar" aria-label="살펴본 수"><i style="width:${c.job ? Math.round(c.job.ply / Math.max(1, c.job.total) * 100) : 0}%"></i></span></section>`;
  else {
    const { scenes, good } = c.analysis;
    const card = (s, i) => { const t = COACH_TYPES[s.type], open = full || i === 0; return `<button class="lesson-card coach-scene-card${open ? '' : ' locked'}" onclick="${open ? `openCoachScene(${i})` : "storeLockedDialog('coach_full','코치의 다른 장면')"}" aria-label="장면 ${i + 1} · ${coachSceneTitle(s)} · ${coachMoveNumber(s)}수째${open ? '' : ' · 잠김'}"><span class="lesson-number" aria-hidden="true">${open ? t.icon : '🔒'}</span><span class="lesson-card-text"><strong>${coachSceneTitle(s)}</strong><small>${coachMoveNumber(s)}수째 · ${open ? '그 장면에서 다시 두어 봐요' : '보호자와 함께 열어요'}</small></span><span class="lesson-go" aria-hidden="true">${open ? '▶ 다시 두기' : '🔒'}</span></button>`; };
    body = `<section class="coach-summary"><h3>${scenes.length ? `살펴볼 장면 ${scenes.length}개` : '큰 실수 없이 두었어요! 👏'}</h3><p>${scenes.length ? '중요한 장면부터 골랐어요. 그 장면에서 다시 두어 보고, 원래 둔 수와 비교해요.' : '코치가 찾은 놓친 기회나 실수가 없어요. 다음에는 한 단계 높은 상대에게 도전해 봐요.'}</p></section>
      <div class="lesson-cards coach-scenes">${scenes.map(card).join('')}</div>
      ${good ? `<section class="coach-good"><strong>⭐ 잘한 수 · ${coachMoveNumber(good)}수째</strong><span>${good.kind === 'mate' ? '체크메이트로 끝냈어요!' : good.kind === 'capture' ? '상대 말을 이득 보고 잡았어요.' : `${COACH_SHAPE[good.shape][0]}으로 이득을 봤어요.`}</span></section>` : ''}
      ${!full && scenes.length > 1 ? `<p class="course-preview-note">무료로 가장 중요한 장면 1개를 볼 수 있어요. 나머지 장면과 지난 대국 ${COACH_LIMIT}판 다시 보기는 ‘내 대국 코치’에 들어 있어요.</p>` : ''}`;
  }
  const history = (full ? records : records.slice(0, 1)).map(x => `<button class="coach-game${x.id === c.gameId ? ' current' : ''}" onclick="coachAnalyze('${x.id}')" aria-pressed="${x.id === c.gameId}"><span>${coachGameLine(x)}</span><b>${x.scenes ? `장면 ${x.scenes.filter(s => s.type !== 'good').length}` : '살펴보기'}</b></button>`).join('');
  document.getElementById('screen-coach').innerHTML = `<div class="screen-wrap coach-screen">${header}<p class="coach-game-line">${coachGameLine(g)}</p>${body}<section class="coach-history"><h3>${full ? `지난 대국 (최근 ${COACH_LIMIT}판)` : '지난 대국'}</h3>${history}${!full && records.length > 1 ? `<button class="text-button" onclick="storeLockedDialog('coach_full','지난 대국 다시 보기')">🔒 이전 대국 ${records.length - 1}판 더 보기</button>` : ''}</section><div class="finish-actions"><button class="action-btn green" onclick="playStart()">새 대국 시작</button><button class="action-btn secondary" onclick="showScreen('home');renderHome()">홈으로</button></div></div>`;
}

// ===== 장면 다시 두기 =====
function openCoachScene(i) {
  const c = state.coach, s = c?.analysis?.scenes[i]; if (!s) return;
  if (i > 0 && !storeOwns('coach_full')) return storeLockedDialog('coach_full', '코치의 다른 장면');
  c.phase = 'scene'; c.scene = { index: i, game: ChessGame.fromFEN(s.fen), phase: 'choose', move: null, reply: null, result: null, selected: null, inspect: null, original: false, hint: false };
  renderCoach();
}
function coachSceneJudge(s, game, m) {
  const b = game.board, b1 = coachApply(b, m), st = lrStatus(b1, 'b');
  if (s.type === 'missedMate') { if (st === 'checkmate') return { result: 'success' }; return { result: 'fail', reply: lrMoves(b1, 'b')[0] || null }; }
  if (st === 'checkmate') return { result: 'success', note: 'mate' };
  if (s.type === 'allowedMate') { const t = lrMateThreats(b1)[0]; return t ? { result: 'fail', reply: t } : st === 'stalemate' ? { result: 'fail', note: 'stalemate' } : { result: 'success' }; }
  if (s.type === 'stalemated' && st === 'stalemate') return { result: 'fail', note: 'stalemate' };
  if (s.type === 'missedTactic') { const g = lrGain(b, m); return g.gain >= 2 ? { result: 'success' } : { result: 'fail', reply: g.reply }; }
  const moves = game.allMoves().filter(x => !x[4] || x[4] === 'Q').map(x => x.slice(0, 4)), best = Math.max(...moves.map(x => coachScore(b, x)));
  const threat = lrMateThreats(b1)[0]; if (threat) return { result: 'fail', reply: threat };
  return coachScore(b, m) >= best - 1 ? { result: 'success' } : { result: 'fail', reply: lrBestCapture(b1, 'b', 4).move };
}
function coachClick(r, col) {
  const c = state.coach, sc = c?.scene; if (!sc || state.animating || activityDialog) return;
  if (sc.phase !== 'choose') return;
  const piece = sc.game.board[r][col];
  if (sc.selected) {
    if (lessonSameSquare(sc.selected, [r, col])) { sc.selected = null; return renderCoach(); }
    if (lessonMovesFrom(sc.game, sc.selected).some(m => m[2] === r && m[3] === col)) return coachAttempt([sc.selected[0], sc.selected[1], r, col]);
  }
  sc.inspect = null; sc.original = false;
  if (piece?.[0] === 'w') { sc.selected = [r, col]; return renderCoach(); }
  if (piece?.[0] === 'b') { sc.selected = null; sc.inspect = [r, col]; return renderCoach(); }
  renderCoach();
}
function coachAttempt(m) {
  const c = state.coach, sc = c.scene, s = c.analysis.scenes[sc.index], out = coachSceneJudge(s, sc.game, m), token = ++coachToken, piece = sc.game.board[m[0]][m[1]];
  sc.selected = null; sc.inspect = null; sc.phase = 'response'; sc.move = m; sc.result = out.result; sc.note = out.note || null;
  sc.game.move(m[0], m[1], m[2], m[3]); sc.game.selected = null; sc.game.validMoves = [];
  animateMove(document.querySelector('#screen-coach .chess-board'), m[0], m[1], m[2], m[3], piece, () => {
    if (token !== coachToken) return;
    if (out.result === 'fail' && out.reply) {
      renderCoach();
      laterInScreen(() => { if (token !== coachToken) return; const r = out.reply, taker = sc.game.board[r[0]][r[1]]; sc.game.move(r[0], r[1], r[2], r[3]); sc.reply = r.slice(0, 4); animateMove(document.querySelector('#screen-coach .chess-board'), r[0], r[1], r[2], r[3], taker, () => { if (token === coachToken) { sc.phase = 'result'; renderCoach(); } }); }, 550);
      return;
    }
    sc.phase = 'result';
    if (out.result === 'success' && !sc.counted) { sc.counted = true; const st = coachStats(); writeData('coach_stats_v1', { version: 1, solved: st.solved + 1 }); workshopUnlockCheck(); }
    renderCoach();
  });
}
function coachRetry() { const c = state.coach, s = c.analysis.scenes[c.scene.index]; c.scene = { ...c.scene, game: ChessGame.fromFEN(s.fen), phase: 'choose', move: null, reply: null, result: null, selected: null, inspect: null, original: false }; coachToken++; renderCoach(); }
function coachShowOriginal() { const sc = state.coach.scene; if (sc.phase === 'response') return; if (sc.phase === 'result') coachRetry(); state.coach.scene.original = !state.coach.scene.original; renderCoach(); }
function coachNextScene() { const c = state.coach, next = c.scene.index + 1; if (c.analysis.scenes[next] && (storeOwns('coach_full'))) return openCoachScene(next); c.phase = 'list'; c.scene = null; renderCoach(); }
function coachLessonLink(s) { if (s.type === 'missedTactic') return COACH_SHAPE[s.shape][1]; if (s.type === 'hung' && s.capture) return 'protect-capture-v3'; return COACH_TYPES[s.type].lesson; }
function renderCoachScene() {
  const c = state.coach, sc = c.scene, s = c.analysis.scenes[sc.index], t = COACH_TYPES[s.type], lesson = lessonById(coachLessonLink(s)), game = sc.game, marks = {};
  if (sc.phase === 'choose') {
    if (sc.selected) { const mv = lessonMovesFrom(game, sc.selected); marks.selected = sc.selected; marks.moves = mv.map(m => [m[2], m[3]]); marks.captureMoves = mv.filter(m => game.board[m[2]][m[3]]).map(m => [m[2], m[3]]); }
    if (sc.inspect) { marks.attackers = [sc.inspect]; marks.reach = lessonReach(game, sc.inspect); }
    if (sc.original) { marks.arrows = [s.played, ...(s.reply ? [] : [])]; marks.focus = [[s.played[2], s.played[3]]]; }
  } else if (sc.phase === 'result') {
    if (sc.result === 'success') marks.safe = [[sc.move[2], sc.move[3]]];
    else if (sc.reply) { marks.arrows = [sc.reply]; marks.focus = [[sc.reply[2], sc.reply[3]]]; }
  }
  const tone = sc.phase === 'result' ? (sc.result === 'success' ? 'ok' : 'no') : '';
  const playedText = `원래 둔 수: ${lessonPieceName(ChessGame.fromFEN(s.fen).board[s.played[0]][s.played[1]])} ${lessonSquareName([s.played[0], s.played[1]])}→${lessonSquareName([s.played[2], s.played[3]])}`;
  const feedback = sc.phase === 'result' ? (sc.result === 'success' ? `✓ 좋아요! 이 수라면 ${s.type === 'missedMate' ? '바로 이겼어요' : s.type === 'allowedMate' ? '상대가 메이트할 수 없어요' : s.type === 'missedTactic' ? '상대가 무엇을 해도 이득이에요' : s.type === 'stalemated' ? '비기지 않아요' : '말을 잃지 않고 더 좋아요'}. ${playedText}.` : `✗ ${sc.note === 'stalemate' ? '스테일메이트로 비겼어요.' : sc.reply ? courseReplyText(coachApply(ChessGame.fromFEN(s.fen).board, sc.move), sc.reply) + '.' : '아직이에요.'} 다시 해 봐요.`)
    : sc.original ? `${playedText}. 화살표가 원래 둔 수예요. ${s.next ? `그 뒤 상대는 ${lessonSquareName([s.next[0], s.next[1]])}→${lessonSquareName([s.next[2], s.next[3]])}로 두었어요.` : ''}` : sc.phase === 'response' ? '상대(검은색) 차례예요…' : '👉 옮길 내 말(흰색)을 눌러요. 원래 둔 수는 왼쪽 버튼으로 볼 수 있어요.';
  const right = sc.phase === 'result' ? (sc.result === 'success' ? (c.analysis.scenes[sc.index + 1] && storeOwns('coach_full') ? '다음 장면 ▶' : '장면 목록 ▶') : '↶ 다시 해보기') : '장면 목록';
  const rightAction = sc.phase === 'result' && sc.result !== 'success' ? 'coachRetry()' : 'coachNextScene()';
  renderGameScreen('screen-coach', `<div class="screen-wrap lesson-screen coach-scene-screen"><div class="screen-header lesson-header"><button class="back-btn" onclick="state.coach.phase='list';renderCoach()">← 장면 목록</button><h2>${t.icon} ${coachSceneTitle(s)} · ${coachMoveNumber(s)}수째</h2>${lesson ? `<button class="lesson-pick-btn" onclick="lessonDrillDialog('${lesson.id}')">비슷한 판 연습</button>` : ''}</div><div class="lesson-statusbar"><span class="lesson-progress"><b>장면 ${sc.index + 1}/${c.analysis.scenes.length}</b></span><span class="lesson-side">${getPieceSVG('wK', 18)}<span>나 = 흰색</span></span></div><div class="status-msg lesson-message"><p class="lesson-goal${tone ? ' lesson-goal-' + tone : ''}">${sc.phase === 'result' ? (sc.result === 'success' ? '🎉 찾았어요!' : '✗ 아직이에요') : '🎯 ' + (s.type === 'missedTactic' ? `${t.goal} (${COACH_SHAPE[s.shape][0]})` : t.goal)}</p><p class="lesson-feedback ${sc.phase === 'result' ? (sc.result === 'success' ? 'success' : 'fail') : sc.original ? 'help' : ''}">${feedback}${sc.phase === 'result' && sc.result === 'success' && lesson ? ` 👉 같은 주제: 체스 수업 ‘${lesson.title}’` : ''}</p></div>${courseBoardHTML({ game, marks, boardTone: tone }, 'coachClick')}<div class="lesson-actions"><button class="action-btn secondary" onclick="coachShowOriginal()" ${sc.phase === 'response' ? 'disabled' : ''}>${sc.original ? '원래 수 숨기기' : '👀 원래 둔 수'}</button><button class="action-btn green${sc.phase === 'result' ? ' lesson-next' : ''}" onclick="${rightAction}" ${sc.phase === 'response' ? 'disabled' : ''}>${right}</button></div></div>`);
}
