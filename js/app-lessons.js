// 체스 수업: 판마다 목표 한 줄 → 내가 한 수 → 결과와 한 문장 설명 → 다시/다음 (docs/lessons/LESSON_REDESIGN_V2.md, LESSON_EXPANSION_V4.md)
// 화면은 고정된 목표·설명 영역 + 같은 크기의 판 + 버튼 두 개(왼쪽 보조, 오른쪽 진행).
// 두 가지 방식: 기본 수업(수업마다 고정 15판, mode 없음)과 무한 연습(mode 'drill', 단계 규칙으로 매번 새 판).
const LESSON_REPLY_DELAY = 500;  // 내 수 뒤 상대가 응수하기까지의 여유
const LESSON_TAP_GUARD = 450;    // 단계가 바뀐 직후 같은 자리의 진행 버튼이 연타로 눌리지 않게
const LESSON_HINT_UNLOCK = 2;    // 기본 수업의 힌트는 같은 판에서 이만큼 해본 뒤에 열린다
const LESSON_DRILL_SLICE = 12;   // 무한 연습 판 만들기: 한 번에 일하는 시간(ms)
let lessonToken = 0, lessonPending = null, lessonOrigin = 'home', lessonPracticeLevel = null, lessonChangedAt = 0;

function lessonIsDrill(l = state.lesson) { return l?.mode === 'drill'; }
function lessonContext() {
  const l = state.lesson, lesson = lessonById(l?.lessonId);
  return { l, lesson, level: !lesson ? null : lessonIsDrill(l) ? l.drillLevel : lesson.levels[l.levelIndex] };
}
// 판 기록: solved는 힌트 없이 성공한 판, helped는 힌트를 보고만 성공한 판(✓와 💡). 새 상태의 '클리어' 표시는 둘을 합친다.
function lessonSolvedFlags(lesson, extra) {
  const p = lessonProgressAll()[lesson.id], ids = new Set([...(p?.solved || []), ...(p?.helped || [])]);
  return lesson.levels.map((level, i) => ids.has(level.id) || !!extra?.[i]);
}
function lessonLevelMarks(lesson) {
  const p = lessonProgressAll()[lesson.id], solved = new Set(p?.solved || []), helped = new Set(p?.helped || []);
  return lesson.levels.map(level => solved.has(level.id) ? 'solved' : helped.has(level.id) ? 'helped' : null);
}
function lessonFreshState(lesson, levelIndex = 0, keep = {}) {
  return { lessonId: lesson.id, contentVersion: LESSON_CONTENT_VERSION, levelIndex, phase: 'choose', game: lessonLevelGame(lesson.levels[levelIndex]),
    move: null, reply: null, result: null, hintLevel: 0, fails: 0, helpUsed: !!keep.helpUsed, solved: lessonSolvedFlags(lesson, keep.solved),
    attempts: keep.attempts || 0, selected: null, inspect: null, notice: null };
}
// 저장할 때: 상대가 응수하기 전(응수 중)이면 그 판의 처음으로 남긴다. 선택·살펴보기·안내 문구와 무한 연습의 판 분석은 저장하지 않는다.
function lessonStableState(l) {
  if (!l) return l;
  const { selected, inspect, notice, drillLevel, ...rest } = l;
  if (l.phase !== 'response') return rest;
  const level = lessonIsDrill(l) ? drillLevel : lessonById(l.lessonId).levels[l.levelIndex];
  return { ...rest, phase: 'choose', game: lessonLevelGame(level), move: null, reply: null, result: null };
}
function lessonUnstable() { return state.activeKind === 'lesson' && state.lesson?.phase === 'response'; }
function lessonRevive(l) {
  if (!l) return l;
  if (l.game) { l.game = Object.assign(new ChessGame(), l.game); l.game.selected = null; l.game.validMoves = []; }
  if (lessonIsDrill(l)) l.drillLevel = l.fen ? lessonDrillLevel(lessonById(l.lessonId), l.tier, l.fen) : null;
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
  const all = lessonProgressAll(), prev = all[id] || { version: 1, completed: false, assisted: false, independent: false, lastSceneId: null, solved: [] };
  all[id] = { ...prev, ...change(prev), version: 1 };
  if (!all[id].helped?.length) delete all[id].helped;  // 💡 기록이 없으면 v5 형식 그대로 둔다(예전 앱과 파일 호환)
  writeData('lesson_progress_v1', all);
}
// 판 하나 성공: 힌트를 봤으면 💡(이미 ✓면 그대로), 아니면 ✓(💡였으면 ✓로 바뀜). 모든 판이 ✓나 💡이면 수업 완료.
function lessonRecordSolve(lesson, level, hinted) {
  lessonProgressUpdate(lesson.id, p => {
    const solved = new Set(p.solved || []), helped = new Set(p.helped || []);
    if (hinted) { if (!solved.has(level.id)) helped.add(level.id); } else { solved.add(level.id); helped.delete(level.id); }
    const all = lesson.levels.every(lv => solved.has(lv.id) || helped.has(lv.id)), alone = lesson.levels.every(lv => solved.has(lv.id));
    return { solved: [...solved], helped: [...helped], ...(all ? { completed: true, independent: p.independent || alone, assisted: p.assisted || !alone } : {}) };
  });
}
function lessonSessionsAll() { const all = readData('lesson_sessions_v1', {}); return all && typeof all === 'object' && !Array.isArray(all) ? all : {}; }
function lessonSavedSession(id) {
  const s = getSavedSession(lessonSessionsAll()[id] ?? null);
  return s && !s.complete && s.kind === 'lesson' && !lessonIsDrill(s.snapshot.values.lesson) && s.snapshot.values.lesson.lessonId === id ? s : null;
}
function lessonDiscardSave(id) {
  const all = lessonSessionsAll(); delete all[id]; writeData('lesson_sessions_v1', all);
  const sessions = readData('sessions', {}), v = sessions.lesson?.snapshot?.values?.lesson;
  if (v?.lessonId === id && !lessonIsDrill(v)) { delete sessions.lesson; writeData('sessions', sessions); }
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
function lessonCardHTML(lesson) {
  const status = lessonStatus(lesson), cleared = lessonSolvedFlags(lesson).filter(Boolean).length;
  return `<div class="lesson-card-item"><button class="lesson-card" onclick="openLesson('${lesson.id}')"><span class="lesson-number" aria-hidden="true">${lesson.number}</span><span class="lesson-card-text"><strong>${lesson.number}. ${lesson.title}</strong><small>${lesson.skill}</small></span><span class="lesson-status lesson-status-${status.key}">${status.label}</span></button>
    <div class="lesson-card-actions"><button class="action-btn secondary" aria-label="${lesson.number}번 판 고르기" onclick="lessonPicker('${lesson.id}')">☰ 판 고르기 · ${cleared}/${lesson.levels.length}</button><button class="action-btn secondary lesson-drill-btn" aria-label="${lesson.number}번 무한 연습" onclick="lessonDrillDialog('${lesson.id}')">∞ 무한 연습</button><button class="action-btn green" aria-label="${lesson.number}번 ${status.key === 'resume' ? '이어하기' : '시작하기'}" onclick="openLesson('${lesson.id}')">▶ ${status.key === 'resume' ? '이어하기' : '시작하기'}</button></div></div>`;
}
function renderLessonList() {
  const fromPlay = lessonOrigin === 'play', total = LESSONS.reduce((n, l) => n + l.levels.length, 0);
  const units = LESSON_UNITS.map(unit => ({ unit, lessons: LESSONS.filter(l => l.unit === unit.id) })).filter(u => u.lessons.length);
  document.getElementById('screen-lesson').innerHTML = `<div class="screen-wrap lesson-list"><div class="screen-header"><button class="back-btn" onclick="${fromPlay ? 'goPlay()' : "showScreen('home');renderHome()"}">← ${fromPlay ? '체스 대전' : '홈'}</button><h2>체스 수업</h2></div>
    <section class="lesson-course"><h3>${units.length}단원 · ${LESSONS.length}개 주제 · ${total}판</h3><p>나는 <b>흰색</b>이에요. 판마다 목표를 보고 <b>직접 한 수</b>를 두면, 무슨 일이 일어났는지 바로 알려줘요. 수업마다 ${LESSON_TIER_NAMES.join(' → ')} 순서로 조금씩 어려워져요. <b>∞ 무한 연습</b>은 컴퓨터가 매번 새 판을 만들어 줘요.</p></section>
    ${units.map(({ unit, lessons }) => `<section class="lesson-unit"><h3 class="lesson-unit-title">${unit.title}</h3><div class="lesson-cards">${lessons.map(lessonCardHTML).join('')}</div></section>`).join('')}
    <p class="section-note">순서는 추천이에요. 어느 수업, 어느 판부터 시작해도 돼요. 잘하는 사람은 판 고르기에서 어려운 판으로 바로 가요.</p></div>`;
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
  if (l.phase === 'result') return l.result !== 'success' ? lessonRetry() : lessonIsDrill(l) ? lessonDrillNext() : lessonNextLevel();
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
  if (lessonIsDrill(l) && l.phase === 'choose' && l.hintLevel) return lessonDrillNext();
  lessonHint();
}
function lessonRetry() {
  const { l, level } = lessonContext(); if (l?.phase !== 'result' || state.animating) return;
  cancelActivityCallbacks(); lessonToken++;
  Object.assign(l, { phase: 'choose', game: lessonLevelGame(level), move: null, reply: null, result: null, selected: null, inspect: null, notice: null });
  lessonChangedAt = Date.now(); renderLesson();
}
// 성공 뒤: 다음 판으로. 마지막 판이면 모두 성공했을 때 수업 마치기, 아니면 아직 안 푼 첫 판으로.
function lessonNextLevel() {
  const { l, lesson } = lessonContext(); if (l?.phase !== 'result' || l.result !== 'success') return;
  if (l.levelIndex < lesson.levels.length - 1) return lessonGoLevel(l.levelIndex + 1);
  if (l.solved.every(Boolean)) return lessonFinish();
  lessonGoLevel(l.solved.findIndex(x => !x));
}
function lessonGoLevel(index) {
  const { l, lesson } = lessonContext(); if (!lesson?.levels[index]) return;
  cancelActivityCallbacks(); lessonToken++;
  state.lesson = lessonFreshState(lesson, index, { helpUsed: l.helpUsed, solved: l.solved, attempts: l.attempts });
  lessonProgressUpdate(lesson.id, () => ({ lastSceneId: lesson.levels[index].id }));
  lessonChangedAt = Date.now(); renderLesson();
}
// 판 고르기: 잠금 없이 아무 판이나 바로 시작한다. ✓는 혼자 성공, 💡는 힌트로 성공, 테두리는 지금(하던) 판.
function lessonPicker(id) {
  const lesson = lessonById(id || state.lesson?.lessonId); if (!lesson) return;
  const active = state.activeKind === 'lesson' && state.lesson?.lessonId === lesson.id && !lessonIsDrill() ? state.lesson : null;
  const marks = lessonLevelMarks(lesson), cleared = active ? active.solved : lessonSolvedFlags(lesson), current = active ? active.levelIndex : lessonSavedSession(lesson.id)?.snapshot.values.lesson.levelIndex ?? -1;
  const label = i => marks[i] === 'solved' ? ' ✓' : marks[i] === 'helped' || cleared[i] ? ' 💡' : '';
  const word = i => marks[i] === 'solved' ? ' · 혼자 성공' : marks[i] === 'helped' || cleared[i] ? ' · 힌트로 성공' : '';
  const rows = LESSON_TIER_NAMES.map((name, t) => `<div class="lesson-pick-row"><span class="lesson-pick-tier">${name}</span>${lesson.levels.map((level, i) => [level, i]).filter(([level]) => level.tier === t + 1).map(([, i]) => `<button class="lesson-pick${marks[i] === 'solved' ? ' done' : cleared[i] ? ' helped' : ''}${i === current ? ' current' : ''}" aria-label="판 ${i + 1} · ${name}${word(i)}${i === current ? ' · 지금 판' : ''}" onclick="lessonPickLevel('${lesson.id}',${i})">${i + 1}${label(i)}</button>`).join('')}</div>`).join('');
  const alone = marks.filter(m => m === 'solved').length, helped = cleared.filter(Boolean).length - alone;
  showActivityDialog(`${lesson.number}. ${lesson.title} · 판 고르기`, `<p class="lesson-pick-note">어느 판부터 해도 돼요. 아래로 갈수록 어려워요. ✓는 혼자 성공, 💡는 힌트를 보고 성공한 판이에요(힌트 없이 다시 풀면 ✓). <b>✓ ${alone} · 💡 ${helped} / ${lesson.levels.length}</b></p><div class="lesson-pick-grid">${rows}</div>`,
    [{ label: '닫기', action: lessonResumePending }, { label: '∞ 무한 연습', action: () => lessonDrillDialog(lesson.id) }, { label: '↺ 1판부터 다시', action: () => restartLesson(lesson.id) }], 'lesson-picker-overlay', lessonResumePending);
}
function lessonPickLevel(id, index) {
  const lesson = lessonById(id); if (!lesson?.levels[index]) return;
  closeActivityDialog(false);
  if (state.activeKind === 'lesson' && state.lesson?.lessonId === id && !lessonIsDrill()) return lessonGoLevel(index);
  // 목록에서 고르면 하던 판 위치만 바뀐다. 성공 기록·힌트 사용 여부는 이어간다.
  const saved = lessonSavedSession(id)?.snapshot.values.lesson;
  beginActivity('lesson', { id }); lessonToken++;
  state.lesson = lessonFreshState(lesson, index, { helpUsed: !!saved?.helpUsed, solved: saved?.solved, attempts: saved?.attempts || 0 });
  lessonProgressUpdate(id, () => ({ lastSceneId: lesson.levels[index].id }));
  lessonChangedAt = Date.now(); showScreen('lesson'); renderLesson();
}
function lessonFinish() {
  const { l, lesson } = lessonContext();
  if (l.phase !== 'result' || l.result !== 'success' || !l.solved.every(Boolean)) return;
  l.phase = 'complete';
  lessonProgressUpdate(lesson.id, () => ({ completed: true, lastSceneId: lesson.levels.at(-1).id }));
  lessonChangedAt = Date.now(); spawnParticles(); renderLesson();
}
// 힌트: 기본 수업은 같은 판에서 두 번 해본 뒤에 열린다(첫 판은 처음부터 켜져 있음). 무한 연습은 처음부터 쓸 수 있다.
function lessonHintReady(l, level) { return lessonIsDrill(l) || !!level?.showThreat || (l.fails || 0) >= LESSON_HINT_UNLOCK; }
function lessonHint() {
  const { l, level } = lessonContext(); if (!l || state.animating) return;
  if (l.phase === 'result' && l.result !== 'success') { if (!lessonHintReady(l, level)) return; lessonRetry(); }
  if (l.phase !== 'choose' || l.hintLevel || level.showThreat && !lessonIsDrill(l)) return;
  if (!lessonHintReady(l, level)) { l.notice = 'hintLocked'; l.inspect = null; return renderLesson(); }
  l.hintLevel = 1; l.helpUsed = true; l.inspect = null; l.notice = null;
  noteHelp(1); renderLesson();
}
function lessonNudge() {
  const button = document.querySelector('#screen-lesson .lesson-actions .lesson-next');
  if (!button?.classList) return;
  button.classList.remove('lesson-nudge'); void button.offsetWidth; button.classList.add('lesson-nudge');
}

// ===== 입력: 내 말을 고르고 점이 찍힌 칸을 누른다. 상대 말을 누르면 갈 수 있는 칸을 보여준다. =====
function lessonClick(r, c) {
  const { l } = lessonContext();
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
    if (out.result !== 'fail' || !out.reply) return lessonShowResult(out.result);
    renderLesson();
    lessonLater(token, () => {
      const reply = out.reply, taker = l.game.board[reply[0]][reply[1]];
      l.game.move(reply[0], reply[1], reply[2], reply[3]); l.game.selected = null; l.game.validMoves = []; l.reply = reply.slice();
      animateMove(lessonBoardElement(), reply[0], reply[1], reply[2], reply[3], taker, () => { if (token === lessonToken) lessonShowResult('fail'); });
    }, LESSON_REPLY_DELAY);
  });
}
function lessonShowResult(result) {
  const { l, lesson, level } = lessonContext();
  l.phase = 'result'; l.result = result; l.attempts++;
  if (result !== 'success') l.fails = (l.fails || 0) + 1;
  if (lessonIsDrill(l)) lessonDrillResult(l, lesson, result);
  else if (result === 'success') { l.solved[l.levelIndex] = true; lessonRecordSolve(lesson, level, l.hintLevel > 0); }
  renderLesson();
}

// ===== 무한 연습: 단계 규칙으로 컴퓨터가 매번 새 판을 만든다 =====
// 판은 시드 하나로 정해진다(판 번호). 지금 판을 푸는 동안 다음 판을 미리 만들어 둔다.
let lessonDrillJob = null, lessonDrillReady = null;
function lessonDrillLevel(lesson, tier, fen) {
  const level = lesson && lgLevelFromFen(lesson.id, tier, fen);
  return level ? { ...level, id: 'drill', kind: lesson.kind, ...(lesson.shape ? { shape: lesson.shape } : {}) } : null;
}
function lessonDrillSeedNext(seed) { let s = (seed ^ 0x9E3779B9) >>> 0; s = Math.imul(s ^ s >>> 16, 0x85EBCA6B) >>> 0; s = Math.imul(s ^ s >>> 13, 0xC2B2AE35) >>> 0; return (s ^ s >>> 16) >>> 0 || 1; }
function lessonDrillRandomSeed() { return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1; }
function lessonDrillAll() {
  const d = readData('lesson_drill_v1', null);
  return lessonDrillValid(d) ? d : { version: 1, lessons: {} };
}
function lessonDrillStats(id) { return lessonDrillAll().lessons[id] || { solved: [0, 0, 0, 0, 0], helped: [0, 0, 0, 0, 0], best: [0, 0, 0, 0, 0] }; }
function lessonDrillSave(id, change) {
  const all = lessonDrillAll(), s = lessonDrillStats(id), next = { solved: s.solved.slice(), helped: s.helped.slice(), best: s.best.slice() };
  change(next); all.lessons[id] = next; writeData('lesson_drill_v1', all);
}
function lessonDrillDialog(id) {
  const lesson = lessonById(id); if (!lesson) return;
  const s = lessonDrillStats(id), current = lessonIsDrill() && state.lesson.lessonId === id ? state.lesson.tier : -1;
  const rows = LESSON_TIER_NAMES.map((name, t) => `<button class="lesson-drill-tier${t === current ? ' current' : ''}" onclick="startLessonDrill('${id}',${t})"><strong>${t + 1}. ${name}</strong><small>${s.solved[t] || s.helped[t] ? `혼자 ${s.solved[t]} · 💡 ${s.helped[t]} · 최고 연속 ${s.best[t]}` : '아직 안 해봤어요'}</small></button>`).join('');
  showActivityDialog(`${lesson.number}. ${lesson.title} · 무한 연습`, `<p class="lesson-pick-note">단계를 고르면 컴퓨터가 그 단계 규칙으로 <b>매번 새 판</b>을 만들어요. 힌트는 언제든 볼 수 있어요. 힌트 없이 한 번에 성공하면 연속 기록이 올라가요.</p><div class="lesson-drill-tiers">${rows}</div>`,
    [{ label: '닫기', action: lessonResumePending }], 'lesson-drill-overlay', lessonResumePending);
}
function startLessonDrill(id, tier, seed) {
  const lesson = lessonById(id); if (!lesson || !Number.isInteger(tier) || tier < 0 || tier > 4) return;
  closeActivityDialog(false);
  const keepStreak = lessonIsDrill() && state.activeKind === 'lesson' && state.lesson.lessonId === id && state.lesson.tier === tier ? state.lesson.streak : 0;
  beginActivity('lesson', { id, mode: 'drill' }); lessonToken++;
  state.lesson = { mode: 'drill', lessonId: id, contentVersion: LESSON_CONTENT_VERSION, tier, seed: seed >>> 0 || lessonDrillRandomSeed(), fen: null, phase: 'loading', game: null, move: null, reply: null, result: null,
    hintLevel: 0, fails: 0, recorded: false, streak: keepStreak || 0, count: 0, helpUsed: false, attempts: 0, drillLevel: null, selected: null, inspect: null, notice: null };
  lessonChangedAt = Date.now(); showScreen('lesson'); renderLesson();
}
// 다음 새 판: 미리 만든 판이 있으면 바로, 없으면 이어서 만든다.
function lessonDrillNext() {
  const { l } = lessonContext(); if (!lessonIsDrill(l) || state.animating) return;
  cancelActivityCallbacks(); lessonToken++;
  Object.assign(l, { seed: lessonDrillSeedNext(l.seed), fen: null, phase: 'loading', game: null, move: null, reply: null, result: null, hintLevel: 0, fails: 0, recorded: false, drillLevel: null, selected: null, inspect: null, notice: null });
  lessonChangedAt = Date.now(); renderLesson();
}
function lessonDrillMatches(job) { const l = state.lesson; return state.activeKind === 'lesson' && lessonIsDrill(l) && l.lessonId === job.id && l.tier === job.ti; }
function lessonDrillPump() {
  const job = lessonDrillJob; if (!job) return;
  if (!lessonDrillMatches(job)) { lessonDrillJob = null; return; }
  const level = job.step(LESSON_DRILL_SLICE);
  if (!level && !job.failed) return void setTimeout(lessonDrillPump, job.background ? 30 : 0);
  lessonDrillJob = null;
  if (job.background) { if (level) lessonDrillReady = { id: job.id, ti: job.ti, seed: job.seed, level }; return; }
  lessonDrillPlace(job.seed, level);
}
// 지금 판이 '만드는 중'이면 그 시드의 판을 구한다(미리 만든 판 → 진행 중인 작업 → 새 작업).
function lessonDrillEnsure() {
  const { l, lesson } = lessonContext(); if (!lessonIsDrill(l) || l.phase !== 'loading') return;
  if (lessonDrillReady && lessonDrillReady.id === l.lessonId && lessonDrillReady.ti === l.tier && lessonDrillReady.seed === l.seed) { const r = lessonDrillReady; lessonDrillReady = null; return lessonDrillPlace(r.seed, r.level); }
  if (lessonDrillJob && lessonDrillJob.id === l.lessonId && lessonDrillJob.ti === l.tier && lessonDrillJob.seed === l.seed) { lessonDrillJob.background = false; return; }
  lessonDrillJob = lgDrillJob(lesson.id, l.tier, l.seed); lessonDrillJob.background = false;
  setTimeout(lessonDrillPump, 0);
}
function lessonDrillPrefetch() {
  const l = state.lesson; if (!lessonIsDrill(l) || lessonDrillJob) return;
  const seed = lessonDrillSeedNext(l.seed);
  if (lessonDrillReady && lessonDrillReady.id === l.lessonId && lessonDrillReady.ti === l.tier && lessonDrillReady.seed === seed) return;
  lessonDrillReady = null; lessonDrillJob = lgDrillJob(l.lessonId, l.tier, seed); lessonDrillJob.background = true;
  setTimeout(lessonDrillPump, 60);
}
function lessonDrillPlace(seed, level) {
  const { l, lesson } = lessonContext(); if (!lessonIsDrill(l) || l.phase !== 'loading' || l.seed !== seed) return;
  // 드물게 조건에 맞는 판을 못 찾으면 그 단계의 교재 판 하나를 대신 쓴다(늘 검사를 통과한 판).
  const fen = level?.fen || lesson.levels.filter(lv => lv.tier === l.tier + 1)[seed % 3].fen;
  l.fen = fen; l.drillLevel = lessonDrillLevel(lesson, l.tier, fen); l.game = lessonLevelGame(l.drillLevel); l.phase = 'choose'; l.count = (l.count || 0) + 1;
  lessonChangedAt = Date.now(); renderLesson(); lessonDrillPrefetch();
}
function lessonDrillResult(l, lesson, result) {
  const t = l.tier, hinted = l.hintLevel > 0, firstTry = l.fails === 0;
  if (result !== 'success') { l.streak = 0; return; }
  if (l.recorded) return;  // 같은 판을 '한 번 더' 성공한 것은 다시 세지 않는다
  l.recorded = true;
  if (hinted) return lessonDrillSave(lesson.id, s => { s.helped[t]++; });
  if (firstTry) l.streak = (l.streak || 0) + 1;
  lessonDrillSave(lesson.id, s => { s.solved[t]++; s.best[t] = Math.max(s.best[t], l.streak || 0); });
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
  hintLocked: `🔒 힌트는 이 판을 ${LESSON_HINT_UNLOCK}번 해본 뒤에 열려요. 상대 말을 누르면 갈 수 있는 칸이 보여요.`,
};
function lessonKey(label) { return `<span class="lesson-key">${label.replace(/[▶↶]/g, '').trim()}</span>`; }
function lessonPrimaryLabel(l, lesson) {
  if (l.phase === 'complete') return LESSONS[LESSONS.indexOf(lesson) + 1] ? '다음 수업 ▶' : '대전에 써보기 ▶';
  if (l.phase === 'result' && l.result !== 'success') return '↶ 다시 해보기';
  if (lessonIsDrill(l)) return '새 판 ▶';
  if (l.levelIndex < lesson.levels.length - 1) return '다음 판 ▶';
  return l.solved.every(Boolean) ? '수업 마치기 ▶' : '남은 판 하기 ▶';
}
// 내 말 지키기의 힌트·첫 판 안내: 상대가 노리는 내 말(없으면 상대가 지키는 칸)을 빨간 화살표로.
function lessonThreatMarks(start) {
  const threats = lessonThreats(start), arrows = threats.length ? threats : lessonDefended(start);
  return { kind: threats.length ? 'threat' : arrows.length ? 'defended' : 'none', attackers: arrows.map(m => [m[0], m[1]]), targets: arrows.map(m => [m[2], m[3]]), arrows };
}
function lessonHintInfo(level, start) {
  if (!level.kind || level.kind === 'protect') {
    const t = lessonThreatMarks(start);
    return { marks: { attackers: t.attackers, targets: t.targets, arrows: t.arrows }, text: t.kind === 'threat' ? '💡 빨간 화살표: 상대가 노리는 내 말이에요.' : t.kind === 'defended' ? '💡 빨간 화살표: 상대가 지키는 칸이에요. 거기서 잡으면 다시 잡혀요.' : '💡 지금 노려지는 내 말은 없어요. 옮긴 뒤를 생각해요.' };
  }
  return lessonHintKind(level, start);
}
function lessonView() {
  const { l, level } = lessonContext(), start = lessonLevelGame(level), marks = {};
  let out = null;
  if (l.phase === 'choose') {
    if (!l.inspect && (l.hintLevel >= 1 || level.showThreat)) Object.assign(marks, lessonHintInfo(level, start).marks);
    if (l.inspect) { marks.attackers = [l.inspect]; marks.reach = lessonReach(l.game, l.inspect); }
    if (l.selected) {
      const moves = lessonMovesFrom(l.game, l.selected);
      marks.selected = l.selected; marks.moves = moves.map(m => [m[2], m[3]]); marks.captureMoves = moves.filter(m => l.game.board[m[2]][m[3]]).map(m => [m[2], m[3]]);
    }
  } else if (l.phase === 'result' || l.phase === 'complete') {
    out = lessonOutcome(start, l.move, level);
    if (l.result === 'fail' && l.reply) {
      const r = l.reply, mate = l.game.status === 'checkmate';
      marks.arrows = [r];
      if (out?.victim) { marks.danger = [[r[2], r[3]]]; marks.tag = [r[2], r[3], '잡힘']; }
      else if (mate) { const k = l.game.findKing('w'); marks.danger = [k]; marks.tag = [k[0], k[1], '체크메이트']; }
      else marks.focus = [[r[2], r[3]]];
    } else if (l.result === 'fail' && out?.note === 'stalemate') { const k = l.game.findKing('b'); marks.focus = [k]; marks.tag = [k[0], k[1], '비김']; }
    if (l.result === 'success') {
      marks.safe = [[l.move[2], l.move[3]]];
      if (l.game.status === 'checkmate') { const k = l.game.findKing('b'); marks.danger = [k]; marks.tag = [k[0], k[1], '체크메이트']; }
      // 원래 노리던 상대 말이 남아 있으면 그 말이 닿는 칸을 보여 준다(내 말에는 닿지 않는다).
      const attack = (!level.kind || level.kind === 'protect') && lessonThreats(start).find(m => m[2] === l.move[0] && m[3] === l.move[1]);
      if (attack && l.game.board[attack[0]][attack[1]]?.[0] === 'b') { marks.attackers = [[attack[0], attack[1]]]; marks.reach = lessonReach(l.game, [attack[0], attack[1]]); }
    }
  }
  return { game: l.game, marks, start, out };
}
function lessonArrowSVG(arrows) {
  if (!arrows.length) return '';
  const line = ([fr, fc, tr, tc], kind) => {
    const fx = fc * 100 + 50, fy = fr * 100 + 50, tx = tc * 100 + 50, ty = tr * 100 + 50, knight = Math.abs(tr - fr) * Math.abs(tc - fc) === 2;
    const path = knight ? `M ${fx} ${fy} ${Math.abs(tr - fr) === 2 ? `V ${ty} H ${tx}` : `H ${tx} V ${ty}`}` : `M ${fx} ${fy} L ${tx} ${ty}`;
    return `<path d="${path}" class="lesson-arrow lesson-arrow-${kind}" marker-end="url(#lesson-head-${kind})"/>`;
  };
  return `<svg class="attack-overlay lesson-overlay" viewBox="0 0 800 800" aria-hidden="true"><defs><marker id="lesson-head-attack" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#c83c46"/></marker></defs>${arrows.map(([a, kind]) => line(a, kind)).join('')}</svg>`;
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
    if (has(marks.targets, r, c)) { cls += ' lesson-target'; notes.push(piece?.[0] === 'b' ? '노릴 만한 상대 말' : '노려지는 말'); }
    if (has(marks.focus, r, c)) { cls += ' lesson-focus'; notes.push('살펴볼 칸'); }
    if (has(marks.reach, r, c)) { cls += ' lesson-reach'; notes.push('상대 말이 갈 수 있는 칸'); }
    if (has(marks.guarded, r, c)) { cls += ' lesson-guarded'; notes.push('상대가 지키는 칸'); }
    if (has(marks.flight, r, c)) { cls += ' lesson-flight'; notes.push('상대 킹이 갈 수 있는 칸'); }
    if (has(marks.danger, r, c)) { cls += ' danger-cell'; notes.push('잡힌 칸'); }
    if (has(marks.safe, r, c)) { cls += ' lesson-safe'; notes.push('내가 둔 칸'); }
    const owner = piece ? `<span class="lesson-owner ${piece[0] === 'w' ? 'mine' : 'theirs'}" aria-hidden="true">${piece[0] === 'w' ? '나' : '상대'}</span>` : '';
    const tags = [...(marks.tag ? [marks.tag] : []), ...(marks.tags || [])].filter(t => t[0] === r && t[1] === c);
    if (tags.length) notes.push(tags.map(t => t[2]).join(' '));
    const tag = tags.map(t => `<span class="lesson-cell-tag${/점$/.test(t[2]) ? ' lesson-value-tag' : ''}" aria-hidden="true">${t[2]}</span>`).join('');
    cells += `<div class="${cls}" onclick="lessonClick(${r},${c})"${notes.length ? ` data-note="${notes.join(', ')}"` : ''}>${piece ? getPieceSVG(piece) : ''}${owner}${tag}</div>`;
  }
  const arrows = (marks.arrows || []).map(a => [a, 'attack']);
  return `<div class="chess-board lesson-board${view.boardTone ? ' lesson-board-' + view.boardTone : ''}">${cells}${lessonArrowSVG(arrows)}</div>`;
}
function lessonLoadingBoardHTML() {
  let cells = ''; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) cells += `<div class="board-cell ${(r + c) % 2 ? 'dark' : 'light'}"></div>`;
  return `<div class="chess-board lesson-board lesson-board-loading" aria-busy="true">${cells}<span class="lesson-loading-text">새 판을 만들고 있어요…</span></div>`;
}
// 위: 이 판의 목표(판 안에서 바뀌지 않음). 아래: 지금 할 일 또는 방금 둔 수의 결과와 이유.
function lessonFeedback(view) {
  const { l, lesson, level } = lessonContext(), next = lessonKey(lessonPrimaryLabel(l, lesson));
  if (l.phase === 'loading') return { tone: 'dim', html: '컴퓨터가 이 단계 규칙으로 새 판을 만들고 있어요…' };
  if (l.phase === 'complete') return { tone: 'success', html: `🎉 수업을 마쳤어요! ${lesson.learned} 👉 ${next}` };
  if (l.phase === 'response') return { tone: 'dim', html: '상대(검은색) 차례예요…' };
  if (l.phase === 'result') {
    const out = view.out || lessonOutcome(view.start, l.move, level), text = (!level.kind || level.kind === 'protect') ? lessonExplain(level, view.start, l.move, out) : lessonExplainKind(level, view.start, l.move, out);
    if (l.result !== 'success') return { tone: 'fail', html: `✗ ${text} 👉 ${next}` };
    const upgrade = !lessonIsDrill(l) && l.hintLevel ? ' 힌트 없이 다시 풀면 ✓가 돼요.' : '';
    return { tone: 'success', html: `✓ ${text}${upgrade} 👉 ${next}` };
  }
  if (l.inspect) { const name = lessonPieceName(l.game.board[l.inspect[0]][l.inspect[1]]); return { tone: 'help', html: `상대 ${lessonJosa(name, '은/는')} 빨간 점 칸으로 갈 수 있어요. 그 칸의 내 말은 잡힐 수 있어요.` }; }
  if (l.notice) return { tone: 'warn', html: LESSON_NOTICE_TEXT[l.notice] };
  if (l.hintLevel >= 1) return { tone: 'help', html: lessonHintInfo(level, view.start).text };
  if (l.selected) return { tone: '', html: '👉 점이 찍힌 칸을 눌러 옮겨요. 상대 말을 누르면 갈 수 있는 칸이 보여요.' };
  if (level.showThreat && !lessonIsDrill(l)) return { tone: 'help', html: `${lessonHintInfo(level, view.start).text} 👉 내 말(흰색)을 눌러 옮겨요.` };
  return { tone: '', html: '👉 옮길 내 말(흰색)을 눌러요. 상대 말을 누르면 갈 수 있는 칸이 보여요.' };
}
// 진행 줄: 기본 수업은 판 번호와 단계, 클리어 막대. 무한 연습은 단계·연속 기록·판 번호.
function lessonStatusHTML(l, lesson) {
  const side = `<span class="lesson-side">${getPieceSVG('wK', 18)}<span>나 = 흰색</span></span>`;
  if (lessonIsDrill(l)) return `<div class="lesson-statusbar"><span class="lesson-progress lesson-drill-progress"><b>∞ ${LESSON_TIER_NAMES[l.tier]} · 연속 ${l.streak || 0}</b><span class="lesson-seed" aria-label="판 번호 ${lgSeedCode(l.seed)}">판 #${lgSeedCode(l.seed)}</span></span>${side}</div>`;
  const total = lesson.levels.length, cleared = l.solved.filter(Boolean).length, tier = LESSON_TIER_NAMES[lesson.levels[l.levelIndex].tier - 1];
  const label = l.phase === 'complete' ? `${total}판 모두 성공` : `판 ${l.levelIndex + 1}/${total} · ${tier}`;
  return `<div class="lesson-statusbar"><span class="lesson-progress"><b>${label}</b><span class="lesson-bar" role="progressbar" aria-label="클리어한 판" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${cleared}"><i style="width:${Math.round(cleared / total * 100)}%"></i></span></span>${side}</div>`;
}
// 목표 칸: 두는 동안에는 목표, 판이 끝나면 성공/실패를 크게 알린다.
function lessonHeadline(l, lesson, level, view) {
  if (l.phase === 'loading') return { tone: '', html: '🎲 새 판 준비 중' };
  if (l.phase === 'result' && !view) view = { out: lessonOutcome(lessonLevelGame(level), l.move, level) };
  if (l.phase === 'complete') return { tone: 'ok', html: `🏆 ${lesson.levels.length}판 모두 성공!` };
  if (l.phase === 'result' && l.result === 'success') {
    if (lessonIsDrill(l)) return { tone: 'ok', html: `🎉 성공! <small>${l.hintLevel ? '💡 힌트 사용' : l.fails ? '다시 해서 성공' : `연속 ${l.streak}`}</small>` };
    const cleared = l.solved.filter(Boolean).length;
    return { tone: 'ok', html: `🎉 판 ${l.levelIndex + 1} 성공!${l.hintLevel ? ' 💡' : ''} <small>${cleared}/${lesson.levels.length} 클리어</small>` };
  }
  if (l.phase === 'result' && l.result === 'fail') {
    if (view?.out?.note === 'stalemate') return { tone: 'no', html: '✗ 비겼어요! 다시 해봐요' };
    if (l.reply && l.game.status === 'checkmate') return { tone: 'no', html: '✗ 체크메이트를 당했어요! 다시 해봐요' };
    if (l.reply && !view?.out?.victim) return { tone: 'no', html: level.kind === 'mate' ? '✗ 상대 킹이 빠져나갔어요! 다시 해봐요' : '✗ 상대가 막았어요! 다시 해봐요' };
    return { tone: 'no', html: '✗ 잡혔어요! 다시 해봐요' };
  }
  if (l.phase === 'result') return { tone: 'no', html: '✗ 아직 목표를 이루지 못했어요' };
  return { tone: '', html: `🎯 ${level.goal}` };
}
function lessonSecondaryLabel(l, level) {
  if (l.phase === 'complete') return '⚔ 이 배치로 대전';
  if (l.phase === 'result' && l.result === 'success') return '↻ 한 번 더';
  if (lessonIsDrill(l)) return l.phase === 'result' ? '💡 힌트 보고 다시' : l.hintLevel ? '⏭ 다른 판' : '💡 힌트';
  if (level?.showThreat) return '💡 힌트 보는 중';
  const ready = lessonHintReady(l, level), left = `🔒 힌트 ${Math.min(l.fails || 0, LESSON_HINT_UNLOCK)}/${LESSON_HINT_UNLOCK}`;
  if (l.phase === 'result') return ready ? '💡 힌트 보고 다시' : left;
  return l.hintLevel ? '💡 힌트 보는 중' : ready ? '💡 힌트' : left;
}
function lessonButtons(l, lesson, level) {
  const busy = state.animating || lessonUnstable() || l.phase === 'loading';
  const course = !lessonIsDrill(l) && l.phase !== 'complete' && !(l.phase === 'result' && l.result === 'success');
  const left = lessonSecondaryLabel(l, level), leftOff = busy || course && (level?.showThreat || l.hintLevel > 0 && l.phase === 'choose' || l.phase === 'result' && !lessonHintReady(l, level));
  const rightReady = (l.phase === 'result' || l.phase === 'complete') && !busy;
  return `<div class="lesson-actions"><button class="action-btn secondary" onclick="lessonSecondary()" ${leftOff ? 'disabled' : ''}>${left}</button><button class="action-btn green${rightReady ? ' lesson-next' : ''}" onclick="lessonPrimary()" ${rightReady ? '' : 'disabled'}>${lessonPrimaryLabel(l, lesson)}</button></div>`;
}
function renderLesson() {
  const { l, lesson, level } = lessonContext(); if (!l || !lesson) return goLessons();
  const drill = lessonIsDrill(l);
  if (drill && l.phase !== 'loading' && !level) { l.phase = 'loading'; l.fen = null; }
  const header = `<div class="screen-header lesson-header"><button class="back-btn" onclick="goLessons()">← 목록</button><h2>${lesson.number}. ${lesson.title}${drill ? ' · ∞ 무한 연습' : ''}</h2>${drill ? `<button class="lesson-pick-btn" onclick="lessonDrillDialog('${lesson.id}')">단계 바꾸기</button>` : '<button class="lesson-pick-btn" onclick="lessonPicker()">☰ 판 고르기</button>'}</div>`;
  if (l.phase === 'loading') {
    const feedback = lessonFeedback(null), headline = lessonHeadline(l, lesson, null);
    renderGameScreen('screen-lesson', `<div class="screen-wrap lesson-screen">${header}${lessonStatusHTML(l, lesson)}<div class="status-msg lesson-message"><p class="lesson-goal">${headline.html}</p><p class="lesson-feedback ${feedback.tone}">${feedback.html}</p></div>${lessonLoadingBoardHTML()}${lessonButtons(l, lesson, null)}</div>`);
    saveActiveSession(); lessonDrillEnsure(); return;
  }
  const view = lessonView(), feedback = lessonFeedback(view), headline = lessonHeadline(l, lesson, level, view);
  view.boardTone = headline.tone;
  renderGameScreen('screen-lesson', `<div class="screen-wrap lesson-screen">${header}${lessonStatusHTML(l, lesson)}<div class="status-msg lesson-message"><p class="lesson-goal${headline.tone ? ' lesson-goal-' + headline.tone : ''}">${headline.html}</p><p class="lesson-feedback ${feedback.tone}">${feedback.html}</p></div>${lessonBoardHTML(view)}${lessonButtons(l, lesson, level)}</div>`);
  saveActiveSession();
}
