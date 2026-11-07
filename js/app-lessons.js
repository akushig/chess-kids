// 체스 수업 v2: 판마다 목표 한 줄 → 내가 한 수 → 결과와 한 문장 설명 → 다시/다음 (docs/lessons/LESSON_REDESIGN_V2.md)
// 화면은 고정된 목표·설명 영역 + 같은 크기의 판 + 버튼 두 개(왼쪽 보조, 오른쪽 진행).
const LESSON_REPLY_DELAY = 500;  // 내 수 뒤 상대가 잡기까지의 여유
const LESSON_TAP_GUARD = 450;    // 단계가 바뀐 직후 같은 자리의 진행 버튼이 연타로 눌리지 않게
let lessonToken = 0, lessonPending = null, lessonOrigin = 'home', lessonPracticeLevel = null, lessonChangedAt = 0;

function lessonContext() { const l = state.lesson, lesson = lessonById(l?.lessonId); return { l, lesson, level: lesson?.levels[l?.levelIndex] }; }
function lessonFreshState(lesson, levelIndex = 0, keep = {}) {
  return { lessonId: lesson.id, contentVersion: LESSON_CONTENT_VERSION, levelIndex, phase: 'choose', game: lessonLevelGame(lesson.levels[levelIndex]),
    move: null, reply: null, result: null, hintLevel: 0, helpUsed: !!keep.helpUsed, solved: keep.solved ? keep.solved.slice() : lesson.levels.map(() => false),
    attempts: keep.attempts || 0, selected: null, inspect: null, notice: null };
}
// 저장할 때: 상대가 잡기 전(응수 중)이면 그 판의 처음으로 남긴다. 선택·살펴보기·안내 문구는 저장하지 않는다.
function lessonStableState(l) {
  if (!l) return l;
  const { selected, inspect, notice, ...rest } = l;
  if (l.phase !== 'response') return rest;
  const level = lessonById(l.lessonId).levels[l.levelIndex];
  return { ...rest, phase: 'choose', game: lessonLevelGame(level), move: null, reply: null, result: null };
}
function lessonUnstable() { return state.activeKind === 'lesson' && state.lesson?.phase === 'response'; }
function lessonRevive(l) {
  if (!l) return l;
  l.game = Object.assign(new ChessGame(), l.game); l.game.selected = null; l.game.validMoves = [];
  l.selected = null; l.inspect = null; l.notice = null;
  return l;
}
function lessonAfterRestore() { lessonRevive(state.lesson); lessonToken++; }
// 예약한 상대 응수는 다른 화면/수업/프로필로 가면 버려진다. 창이 열려 있으면 닫힐 때까지 멈춘다.
function lessonLater(token, fn, delay) {
  laterInScreen(() => {
    if (token !== lessonToken || state.activeKind !== 'lesson') return;
    if (activityDialog) { lessonPending = { token, fn }; return; }
    fn();
  }, delay);
}
function lessonResumePending() { const p = lessonPending; lessonPending = null; if (p && p.token === lessonToken) lessonLater(p.token, p.fn, 300); }
function lessonBoardElement() { return document.querySelector('#screen-lesson .chess-board'); }

// ===== 기록 =====
// 수업별 완료 기록. 예전·모르는 수업 ID나 잘못된 항목은 읽을 때 버린다.
function lessonProgressAll() {
  const p = readData('lesson_progress_v1', {});
  if (!p || typeof p !== 'object' || Array.isArray(p)) return {};
  return Object.fromEntries(Object.entries(p).filter(([id, value]) => lessonProgressValid({ [id]: value })));
}
function lessonProgressUpdate(id, change) {
  const all = lessonProgressAll(), prev = all[id] || { version: 1, completed: false, assisted: false, independent: false, lastSceneId: null };
  all[id] = { ...prev, ...change(prev), version: 1 }; writeData('lesson_progress_v1', all);
}
function lessonSessionsAll() { const all = readData('lesson_sessions_v1', {}); return all && typeof all === 'object' && !Array.isArray(all) ? all : {}; }
function lessonSavedSession(id) {
  const s = getSavedSession(lessonSessionsAll()[id] ?? null);
  return s && !s.complete && s.kind === 'lesson' && s.snapshot.values.lesson.lessonId === id ? s : null;
}
function lessonDiscardSave(id) {
  const all = lessonSessionsAll(); delete all[id]; writeData('lesson_sessions_v1', all);
  const sessions = readData('sessions', {});
  if (sessions.lesson?.snapshot?.values?.lesson?.lessonId === id) { delete sessions.lesson; writeData('sessions', sessions); }
}

// ===== 목록 =====
function goLessons(origin) {
  if (origin) lessonOrigin = origin;
  leaveActivity(); lessonToken++;
  showScreen('lesson'); renderLessonList();
}
function lessonStatus(lesson) {
  const saved = lessonSavedSession(lesson.id), p = lessonProgressAll()[lesson.id];
  if (saved) return { key: 'resume', label: `이어하기 · 판 ${saved.snapshot.values.lesson.levelIndex + 1}/${lesson.levels.length}` };
  if (p?.completed) return { key: 'done', label: p.independent ? '해봤어요 ✓ 혼자 성공' : '해봤어요 ✓' };
  return { key: 'new', label: `처음 · ${lesson.levels.length}판` };
}
function renderLessonList() {
  const fromPlay = lessonOrigin === 'play';
  document.getElementById('screen-lesson').innerHTML = `<div class="screen-wrap lesson-list"><div class="screen-header"><button class="back-btn" onclick="${fromPlay ? 'goPlay()' : "showScreen('home');renderHome()"}">← ${fromPlay ? '체스 대전' : '홈'}</button><h2>체스 수업</h2></div>
    <section class="lesson-course"><h3>내 말 지키기 · 세 수업 · ${LESSONS.reduce((n, l) => n + l.levels.length, 0)}판</h3><p>나는 <b>흰색</b>이에요. 판마다 목표를 보고 <b>직접 한 수</b>를 두면, 무슨 일이 일어났는지 바로 알려줘요. 수업마다 ${LESSON_TIER_NAMES.join(' → ')} 순서로 조금씩 어려워져요.</p></section>
    <div class="lesson-cards">${LESSONS.map(lesson => { const status = lessonStatus(lesson); return `<div class="lesson-card-item"><button class="lesson-card" onclick="openLesson('${lesson.id}')"><span class="lesson-number" aria-hidden="true">${lesson.number}</span><span class="lesson-card-text"><strong>${lesson.number}. ${lesson.title}</strong><small>${lesson.skill}</small></span><span class="lesson-status lesson-status-${status.key}">${status.label}</span></button>${status.key === 'resume' ? `<div class="lesson-card-actions"><button class="action-btn secondary" aria-label="${lesson.number}번 처음부터 다시" onclick="restartLesson('${lesson.id}')">↺ 처음부터 다시</button><button class="action-btn green" aria-label="${lesson.number}번 이어하기" onclick="openLesson('${lesson.id}')">▶ 이어하기</button></div>` : ''}</div>`; }).join('')}</div>
    <p class="section-note">순서는 추천이에요. 어느 수업부터 시작해도 돼요. 수업마다 하던 판을 따로 기억해요.</p></div>`;
}
function openLesson(id) {
  if (!lessonById(id)) return goLessons();
  if (lessonSavedSession(id)) return resumeLesson(id);
  startLesson(id);
}
function resumeLesson(id) {
  saveActiveSession();
  const s = lessonSavedSession(id); if (!s) return startLesson(id);
  const sessions = readData('sessions', {}); sessions.lesson = s; writeData('sessions', sessions);
  lessonToken++; lessonChangedAt = Date.now(); resumeActivity('lesson');
}
function startLesson(id) {
  const lesson = lessonById(id); if (!lesson) return;
  beginActivity('lesson', { id }); lessonToken++;
  state.lesson = lessonFreshState(lesson, 0);
  lessonProgressUpdate(id, () => ({ lastSceneId: lesson.levels[0].id }));
  lessonChangedAt = Date.now(); showScreen('lesson'); renderLesson();
}
function restartLesson(id) {
  const lesson = lessonById(id); if (!lesson) return;
  showChoice(`${lesson.number}. ${lesson.title}을 첫 판부터 다시 할까요? 해본 기록은 그대로예요.`, [
    { label: '처음부터 시작', action: () => { lessonDiscardSave(id); startLesson(id); } },
    { label: '취소', action: () => {} },
  ]);
}

// ===== 판 진행 =====
function lessonPrimary() {
  const { l, lesson } = lessonContext(); if (!l || state.animating || Date.now() - lessonChangedAt < LESSON_TAP_GUARD) return;
  if (l.phase === 'result') return l.result === 'success' ? lessonNextLevel() : lessonRetry();
  if (l.phase === 'complete') {
    const next = LESSONS[LESSONS.indexOf(lesson) + 1];
    if (next) return openLesson(next.id);
    leaveActivity(); return goPlay();
  }
}
function lessonSecondary() {
  const { l } = lessonContext(); if (!l || state.animating) return;
  if (l.phase === 'complete') return lessonPracticeDialog();
  if (l.phase === 'result' && l.result === 'success') return lessonRetry();
  lessonHint();
}
function lessonRetry() {
  const { l, level } = lessonContext(); if (l?.phase !== 'result' || state.animating) return;
  cancelActivityCallbacks(); lessonToken++;
  Object.assign(l, { phase: 'choose', game: lessonLevelGame(level), move: null, reply: null, result: null, selected: null, inspect: null, notice: null });
  lessonChangedAt = Date.now(); renderLesson();
}
function lessonNextLevel() {
  const { l, lesson } = lessonContext(); if (l?.phase !== 'result' || l.result !== 'success') return;
  if (l.levelIndex === lesson.levels.length - 1) return lessonFinish();
  cancelActivityCallbacks(); lessonToken++;
  const next = l.levelIndex + 1;
  state.lesson = lessonFreshState(lesson, next, { helpUsed: l.helpUsed, solved: l.solved, attempts: l.attempts });
  lessonProgressUpdate(lesson.id, () => ({ lastSceneId: lesson.levels[next].id }));
  lessonChangedAt = Date.now(); renderLesson();
}
function lessonFinish() {
  const { l, lesson } = lessonContext();
  if (l.phase !== 'result' || l.result !== 'success' || !l.solved.every(Boolean)) return;
  l.phase = 'complete';
  // 완료는 모든 판을 성공하고 마칠 때만. 수업 중 힌트를 썼는지로 도움/혼자를 나눈다.
  const helped = l.helpUsed;
  lessonProgressUpdate(lesson.id, p => ({ completed: true, assisted: p.assisted || helped, independent: p.independent || !helped, lastSceneId: lesson.levels.at(-1).id }));
  lessonChangedAt = Date.now(); spawnParticles(); renderLesson();
}
function lessonHint() {
  const { l } = lessonContext(); if (!l || state.animating) return;
  if (l.phase === 'result' && l.result !== 'success') lessonRetry();
  if (l.phase !== 'choose') return;
  l.hintLevel = Math.min(2, l.hintLevel + 1); l.helpUsed = true; l.inspect = null; l.notice = null;
  noteHelp(l.hintLevel); renderLesson();
}
function lessonNudge() {
  const button = document.querySelector('#screen-lesson .lesson-actions .lesson-next');
  if (!button?.classList) return;
  button.classList.remove('lesson-nudge'); void button.offsetWidth; button.classList.add('lesson-nudge');
}

// ===== 입력: 내 말을 고르고 점이 찍힌 칸을 누른다. 상대 말을 누르면 갈 수 있는 칸을 보여준다. =====
function lessonClick(r, c) {
  const { l, level } = lessonContext();
  if (!l || state.animating || activityDialog) return;
  if (l.phase === 'result' || l.phase === 'complete') return lessonNudge();
  if (l.phase !== 'choose') return;
  lessonChangedAt = 0;  // 판을 눌렀다면 진행 버튼 연타가 아니다
  const piece = l.game.board[r][c];
  if (l.selected) {
    if (lessonSameSquare(l.selected, [r, c])) { l.selected = null; l.notice = null; return renderLesson(); }
    if (lessonMovesFrom(l.game, l.selected).some(m => m[2] === r && m[3] === c)) return lessonAttempt([l.selected[0], l.selected[1], r, c]);
  }
  l.inspect = null; l.notice = null;
  if (piece?.[0] === 'w') { l.selected = [r, c]; if (!lessonMovesFrom(l.game, [r, c]).length) l.notice = 'noMoves'; return renderLesson(); }
  if (piece?.[0] === 'b') { l.selected = null; l.inspect = [r, c]; return renderLesson(); }
  l.notice = l.selected ? 'cannotGo' : 'pickOwn'; renderLesson();
}
function lessonAttempt(move) {
  const { l, level } = lessonContext(), start = lessonLevelGame(level), out = lessonOutcome(start, move, level); if (!out) return;
  const token = ++lessonToken, piece = start.board[move[0]][move[1]];
  Object.assign(l, { phase: 'response', selected: null, inspect: null, notice: null, move: move.slice(), game: out.after });
  saveActiveSession();
  animateMove(lessonBoardElement(), move[0], move[1], move[2], move[3], piece, () => {
    if (token !== lessonToken) return;
    if (out.result !== 'fail') return lessonShowResult(out.result);
    renderLesson();
    lessonLater(token, () => {
      const reply = out.reply, taker = l.game.board[reply[0]][reply[1]];
      l.game.move(reply[0], reply[1], reply[2], reply[3]); l.game.selected = null; l.game.validMoves = []; l.reply = reply.slice();
      animateMove(lessonBoardElement(), reply[0], reply[1], reply[2], reply[3], taker, () => { if (token === lessonToken) lessonShowResult('fail'); });
    }, LESSON_REPLY_DELAY);
  });
}
function lessonShowResult(result) {
  const l = state.lesson;
  l.phase = 'result'; l.result = result; l.attempts++;
  if (result === 'success') l.solved[l.levelIndex] = true;
  renderLesson();
}

// ===== 대전으로 연결: 수업 마지막 판의 배치에서 표준 체스 =====
function lessonPracticeScene(lesson) { return lesson?.levels.at(-1) || null; }
function lessonPracticeSummary() {
  const s = getPlaySettings();
  return `나: 흰색 · 상대: 컴퓨터 ${playLevelLabel(lessonPracticeLevel)} · 왕 구하기 도움 ${s.help ? '켜짐' : '꺼짐'}`;
}
function lessonPracticeDialog(id) {
  const lesson = lessonById(id || state.lesson?.lessonId), scene = lessonPracticeScene(lesson); if (!scene) return;
  lessonPracticeLevel = getPlaySettings().level;
  showActivityDialog('이 배치로 대전', `<p>수업 마지막 판의 배치에서 컴퓨터와 표준 체스로 끝까지 두어요. 체크메이트나 무승부로 끝나요.</p><label class="lesson-level">컴퓨터 난이도<select id="lesson-practice-level" onchange="lessonPracticeLevel=Number(this.value);document.getElementById('lesson-practice-summary').textContent=lessonPracticeSummary()">${AI_LEVELS.map((_, i) => `<option value="${i}" ${i === lessonPracticeLevel ? 'selected' : ''}>${playLevelLabel(i)}</option>`).join('')}</select></label><p id="lesson-practice-summary" class="play-dialog-note">${lessonPracticeSummary()}</p>${contentBoardPreview(lessonLevelGame(scene))}`,
    [{ label: '대전 시작', action: () => startLessonPractice(lesson.id) }, { label: '취소', action: () => {} }], 'lesson-practice-overlay');
}
function startLessonPractice(id) {
  const lesson = lessonById(id), scene = lessonPracticeScene(lesson); if (!scene) return;
  const level = Number.isInteger(lessonPracticeLevel) && lessonPracticeLevel >= 0 && lessonPracticeLevel < AI_LEVELS.length ? lessonPracticeLevel : getPlaySettings().level;
  requestContentActivity('lessonPractice', () => playStart({ ...getPlaySettings(), mode: 'ai', small: false, preset: null, level, content: { version: 1, type: 'lessonPractice', lessonId: lesson.id, lessonVersion: lesson.version, sceneId: scene.id } }));
}
function lessonPracticeValid(c) {
  const lesson = lessonById(c.lessonId);
  return !!lesson && c.lessonVersion === lesson.version && lessonPracticeScene(lesson)?.id === c.sceneId;
}
function lessonPracticeGame(c) { return lessonLevelGame(lessonPracticeScene(lessonById(c.lessonId))); }
function lessonPracticePanel() {
  const lesson = lessonById(state.play.content.lessonId);
  return `<div class="content-context"><strong>📘 수업 배치로 대전 · ${lesson.title}</strong><span>표준 체스로 끝까지 두어요. 두기 전에 상대가 잡을 수 있는 내 말이 있는지 살펴봐요.</span><button class="play-chip" onclick="goLessons()">체스 수업 목록</button></div>`;
}

// ===== 화면 =====
const LESSON_NOTICE_TEXT = {
  pickOwn: '흰색이 내 말이에요. 👉 옮길 내 말을 먼저 눌러요.',
  cannotGo: '그 칸으로는 갈 수 없어요. 👉 점이 찍힌 칸을 눌러요.',
  noMoves: '이 말은 지금 움직일 수 없어요. 👉 다른 내 말을 골라요.',
};
function lessonKey(label) { return `<span class="lesson-key">${label.replace(/[▶↶]/g, '').trim()}</span>`; }
function lessonPrimaryLabel(l, lesson) {
  if (l.phase === 'complete') return LESSONS[LESSONS.indexOf(lesson) + 1] ? '다음 수업 ▶' : '대전에 써보기 ▶';
  if (l.phase === 'result' && l.result !== 'success') return '↶ 다시 해보기';
  return l.levelIndex === lesson.levels.length - 1 ? '수업 마치기 ▶' : '다음 판 ▶';
}
// 힌트 1단계·첫 판: 상대가 노리는 내 말(없으면 상대가 지키는 칸)을 빨간 화살표로. 2단계: 예시 정답을 초록 화살표로.
function lessonThreatMarks(start) {
  const threats = lessonThreats(start), arrows = threats.length ? threats : lessonDefended(start);
  return { kind: threats.length ? 'threat' : arrows.length ? 'defended' : 'none', attackers: arrows.map(m => [m[0], m[1]]), targets: arrows.map(m => [m[2], m[3]]), arrows };
}
function lessonView() {
  const { l, lesson, level } = lessonContext(), start = lessonLevelGame(level), marks = {};
  if (l.phase === 'choose') {
    if (l.inspect) { marks.attackers = [l.inspect]; marks.reach = lessonReach(l.game, l.inspect); }
    if (l.selected) {
      const moves = lessonMovesFrom(l.game, l.selected);
      marks.selected = l.selected; marks.moves = moves.map(m => [m[2], m[3]]); marks.captureMoves = moves.filter(m => l.game.board[m[2]][m[3]]).map(m => [m[2], m[3]]);
    }
    if (!l.inspect && (l.hintLevel >= 1 || level.showThreat)) { const t = lessonThreatMarks(start); marks.attackers = t.attackers; marks.targets = t.targets; marks.arrows = t.arrows; }
    if (l.hintLevel >= 2) marks.suggest = [level.witness];
  } else if (l.phase === 'result' || l.phase === 'complete') {
    if (l.result === 'fail') { marks.danger = [[l.reply[2], l.reply[3]]]; marks.arrows = [l.reply]; marks.tag = [l.reply[2], l.reply[3], '잡힘']; }
    if (l.result === 'success') {
      marks.safe = [[l.move[2], l.move[3]]];
      // 원래 노리던 상대 말이 남아 있으면 그 말이 닿는 칸을 보여 준다(내 말에는 닿지 않는다).
      const attack = lessonThreats(start).find(m => m[2] === l.move[0] && m[3] === l.move[1]);
      if (attack && l.game.board[attack[0]][attack[1]]?.[0] === 'b') { marks.attackers = [[attack[0], attack[1]]]; marks.reach = lessonReach(l.game, [attack[0], attack[1]]); }
    }
  }
  return { game: l.game, marks, start };
}
function lessonArrowSVG(arrows) {
  if (!arrows.length) return '';
  const line = ([fr, fc, tr, tc], kind) => {
    const fx = fc * 100 + 50, fy = fr * 100 + 50, tx = tc * 100 + 50, ty = tr * 100 + 50, knight = Math.abs(tr - fr) * Math.abs(tc - fc) === 2;
    const path = knight ? `M ${fx} ${fy} ${Math.abs(tr - fr) === 2 ? `V ${ty} H ${tx}` : `H ${tx} V ${ty}`}` : `M ${fx} ${fy} L ${tx} ${ty}`;
    return `<path d="${path}" class="lesson-arrow lesson-arrow-${kind}" marker-end="url(#lesson-head-${kind})"/>`;
  };
  return `<svg class="attack-overlay lesson-overlay" viewBox="0 0 800 800" aria-hidden="true"><defs><marker id="lesson-head-attack" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#c83c46"/></marker><marker id="lesson-head-suggest" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#2c8a55"/></marker></defs>${arrows.map(([a, kind]) => line(a, kind)).join('')}</svg>`;
}
function lessonBoardHTML(view) {
  const { game, marks } = view, has = (list, r, c) => (list || []).some(p => p[0] === r && p[1] === c), last = game.lastMove;
  let cells = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const piece = game.board[r][c], notes = [];
    let cls = 'board-cell ' + ((r + c) % 2 ? 'dark' : 'light');
    if (piece) { cls += ' pc-' + piece[0]; notes.push(piece[0] === 'w' ? '내 말' : '상대 말'); }
    if (last && ((last[0] === r && last[1] === c) || (last[2] === r && last[3] === c))) cls += ' last-move';
    if (marks.selected && lessonSameSquare(marks.selected, [r, c])) cls += ' selected';
    if (has(marks.moves, r, c)) cls += has(marks.captureMoves, r, c) ? ' move-hint lesson-capture-hint' : ' move-hint';
    if (has(marks.attackers, r, c)) { cls += ' lesson-attacker'; notes.push('공격하는 상대 말'); }
    if (has(marks.targets, r, c)) { cls += ' lesson-target'; notes.push('노려지는 말'); }
    if (has(marks.reach, r, c)) { cls += ' lesson-reach'; notes.push('상대 말이 갈 수 있는 칸'); }
    if (has(marks.danger, r, c)) { cls += ' danger-cell'; notes.push('잡힌 칸'); }
    if (has(marks.safe, r, c)) { cls += ' lesson-safe'; notes.push('안전한 칸'); }
    const owner = piece ? `<span class="lesson-owner ${piece[0] === 'w' ? 'mine' : 'theirs'}" aria-hidden="true">${piece[0] === 'w' ? '나' : '상대'}</span>` : '';
    const tag = marks.tag && marks.tag[0] === r && marks.tag[1] === c ? `<span class="lesson-cell-tag" aria-hidden="true">${marks.tag[2]}</span>` : '';
    cells += `<div class="${cls}" onclick="lessonClick(${r},${c})"${notes.length ? ` data-note="${notes.join(', ')}"` : ''}>${piece ? getPieceSVG(piece) : ''}${owner}${tag}</div>`;
  }
  const arrows = [...(marks.arrows || []).map(a => [a, 'attack']), ...(marks.suggest || []).map(a => [a, 'suggest'])];
  return `<div class="chess-board lesson-board${view.boardTone ? ' lesson-board-' + view.boardTone : ''}">${cells}${lessonArrowSVG(arrows)}</div>`;
}
// 위: 이 판의 목표(판 안에서 바뀌지 않음). 아래: 지금 할 일 또는 방금 둔 수의 결과와 이유.
function lessonFeedback(view) {
  const { l, lesson, level } = lessonContext(), next = lessonKey(lessonPrimaryLabel(l, lesson));
  if (l.phase === 'complete') return { tone: 'success', html: `🎉 수업을 마쳤어요! ${lesson.learned} 👉 ${next}` };
  if (l.phase === 'response') return { tone: 'dim', html: '상대(검은색) 차례예요…' };
  if (l.phase === 'result') {
    const out = lessonOutcome(view.start, l.move, level), text = lessonExplain(level, view.start, l.move, out);
    return l.result === 'success' ? { tone: 'success', html: `✓ ${text} 👉 ${next}` } : { tone: 'fail', html: `✗ ${text} 👉 ${next}` };
  }
  if (l.inspect) { const name = lessonPieceName(l.game.board[l.inspect[0]][l.inspect[1]]); return { tone: 'help', html: `상대 ${lessonJosa(name, '은/는')} 빨간 점 칸으로 갈 수 있어요. 그 칸의 내 말은 잡힐 수 있어요.` }; }
  if (l.notice) return { tone: 'warn', html: LESSON_NOTICE_TEXT[l.notice] };
  if (l.hintLevel >= 2) return { tone: 'help', html: '💡 초록 화살표처럼 두어 보세요. 다른 안전한 수도 괜찮아요.' };
  if (l.hintLevel === 1) {
    const kind = lessonThreatMarks(view.start).kind;
    return { tone: 'help', html: kind === 'threat' ? '💡 빨간 화살표: 상대가 노리는 내 말이에요.' : kind === 'defended' ? '💡 빨간 화살표: 상대가 지키는 칸이에요. 거기서 잡으면 다시 잡혀요.' : '💡 지금 노려지는 내 말은 없어요. 옮긴 뒤를 생각해요.' };
  }
  return { tone: '', html: l.selected ? '👉 점이 찍힌 칸을 눌러 옮겨요. 상대 말을 누르면 갈 수 있는 칸이 보여요.' : '👉 옮길 내 말(흰색)을 눌러요. 상대 말을 누르면 갈 수 있는 칸이 보여요.' };
}
// 진행 줄: 판 번호와 단계(첫걸음→도전), 클리어한 판 수만큼 찬 막대
function lessonStatusHTML(l, lesson) {
  const total = lesson.levels.length, cleared = l.solved.filter(Boolean).length, tier = LESSON_TIER_NAMES[lesson.levels[l.levelIndex].tier - 1];
  const label = l.phase === 'complete' ? `${total}판 모두 성공` : `판 ${l.levelIndex + 1}/${total} · ${tier}`;
  return `<div class="lesson-statusbar"><span class="lesson-progress"><b>${label}</b><span class="lesson-bar" role="progressbar" aria-label="클리어한 판" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${cleared}"><i style="width:${Math.round(cleared / total * 100)}%"></i></span></span><span class="lesson-side">${getPieceSVG('wK', 18)}<span>나 = 흰색</span></span></div>`;
}
// 목표 칸: 두는 동안에는 목표, 판이 끝나면 성공/실패를 크게 알린다.
function lessonHeadline(l, lesson, level) {
  const total = lesson.levels.length, cleared = l.solved.filter(Boolean).length;
  if (l.phase === 'complete') return { tone: 'ok', html: `🏆 ${total}판 모두 성공!` };
  if (l.phase === 'result' && l.result === 'success') return { tone: 'ok', html: `🎉 판 ${l.levelIndex + 1} 성공! <small>${cleared}/${total} 클리어</small>` };
  if (l.phase === 'result' && l.result === 'fail') return { tone: 'no', html: '✗ 잡혔어요! 다시 해봐요' };
  if (l.phase === 'result') return { tone: 'no', html: '✗ 아직 목표를 이루지 못했어요' };
  return { tone: '', html: `🎯 ${level.goal}` };
}
function lessonButtons(l, lesson) {
  const busy = state.animating || lessonUnstable();
  const left = l.phase === 'complete' ? '⚔ 이 배치로 대전' : l.phase === 'result' && l.result === 'success' ? '↻ 한 번 더' : l.phase === 'result' ? '💡 힌트 보고 다시' : `💡 힌트${l.hintLevel ? ` ${l.hintLevel}/2` : ''}`;
  const rightReady = (l.phase === 'result' || l.phase === 'complete') && !busy;
  return `<div class="lesson-actions"><button class="action-btn secondary" onclick="lessonSecondary()" ${busy ? 'disabled' : ''}>${left}</button><button class="action-btn green${rightReady ? ' lesson-next' : ''}" onclick="lessonPrimary()" ${rightReady ? '' : 'disabled'}>${lessonPrimaryLabel(l, lesson)}</button></div>`;
}
function renderLesson() {
  const { l, lesson, level } = lessonContext(); if (!l || !lesson) return goLessons();
  const view = lessonView(), feedback = lessonFeedback(view), headline = lessonHeadline(l, lesson, level);
  view.boardTone = headline.tone;
  renderGameScreen('screen-lesson', `<div class="screen-wrap lesson-screen"><div class="screen-header lesson-header"><button class="back-btn" onclick="goLessons()">← 목록</button><h2>${lesson.number}. ${lesson.title}</h2><button class="lesson-restart-btn" onclick="restartLesson('${lesson.id}')">↺ 처음부터</button></div>${lessonStatusHTML(l, lesson)}<div class="status-msg lesson-message"><p class="lesson-goal${headline.tone ? ' lesson-goal-' + headline.tone : ''}">${headline.html}</p><p class="lesson-feedback ${feedback.tone}">${feedback.html}</p></div>${lessonBoardHTML(view)}${lessonButtons(l, lesson)}</div>`);
  saveActiveSession();
}
