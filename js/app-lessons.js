// 체스 수업: 목록 → 보기 → 함께 해보기 → 혼자 해보기 → 마무리 (docs/lessons/INTERACTIVE_LESSONS_DESIGN.md)
// 화면은 고정된 설명 영역 + 같은 크기의 판 + 하단 행동 영역. 진행(다음)은 항상 오른쪽.
const LESSON_REPLY_DELAY = 500;  // 학생 수 뒤 교재 응수까지의 여유
const LESSON_DEMO_GAP = 700;     // 시범 단계 사이 간격
const LESSON_TAP_GUARD = 450;   // 단계가 바뀐 직후 같은 자리의 다음 버튼이 연타로 눌리지 않게
let lessonToken = 0, lessonPending = null, lessonOrigin = 'home', lessonPracticeLevel = null, lessonChangedAt = 0;

function lessonContext() { const l = state.lesson, lesson = lessonById(l?.lessonId); return { l, lesson, scene: lessonScene(lesson, l?.sceneId) }; }
function lessonFreshState(lesson, scene, progress = { guided: false, transfer: false }) {
  const g = lessonSceneGame(scene);
  return { lessonId: lesson.id, contentVersion: LESSON_CONTENT_VERSION, sceneId: scene.id, sceneRole: scene.role, phase: scene.role === 'demo' ? 'demoReady' : 'choose',
    game: g, attemptStartGame: g.clone(), selected: null, attempts: 0, helpLevel: 0, helpUsed: false, helpShown: false,
    result: null, responseMove: null, studentMove: null, demoStep: 0, progress: { ...progress }, notice: null };
}
// 응수·시범 도중의 저장은 그 시도의 시작(choose)으로 남긴다. 복원할 때 갑자기 말이 움직이지 않는다.
// 진행 중 선택과 잠깐의 안내 문구는 저장하지 않는다. 수업 1의 지목 결과(result의 selected)는 시도 내용이라 남긴다.
function lessonStableState(l) {
  if (!l) return l;
  if (l.phase === 'response') return { ...l, phase: 'choose', game: l.attemptStartGame, selected: null, result: null, responseMove: null, studentMove: null, notice: null, helpShown: false };
  if (l.phase === 'demoPlaying') return { ...l, phase: 'demoReady', demoStep: 0, notice: null };
  if (l.notice || (l.phase === 'choose' && l.selected)) return { ...l, notice: null, selected: l.phase === 'choose' ? null : l.selected };
  return l;
}
function lessonUnstable() { return state.activeKind === 'lesson' && ['response', 'demoPlaying'].includes(state.lesson?.phase); }
function lessonRevive(l) {
  if (!l) return l;
  l.game = Object.assign(new ChessGame(), l.game); l.attemptStartGame = Object.assign(new ChessGame(), l.attemptStartGame);
  l.game.selected = null; l.game.validMoves = [];
  return l;
}
// 되돌리기·재시도 뒤에도 시도 수, 도움 기록, 이미 얻은 성공은 줄이지 않는다.
function lessonAfterRestore(previous) {
  const l = lessonRevive(state.lesson);
  if (previous && previous.sceneId === l.sceneId) {
    l.attempts = Math.max(l.attempts, previous.attempts); l.helpLevel = Math.max(l.helpLevel, previous.helpLevel); l.helpUsed = l.helpUsed || previous.helpUsed;
    l.progress = { guided: l.progress.guided || previous.progress.guided, transfer: l.progress.transfer || previous.progress.transfer };
  }
  l.helpShown = false; l.notice = null; l.selected = null; lessonToken++;
}
// 예약한 시범·응수는 다른 화면/수업/프로필로 가면 버려진다. 설명 창이 열려 있으면 닫힐 때까지 멈춘다.
function lessonLater(token, fn, delay) {
  laterInScreen(() => {
    if (token !== lessonToken || state.activeKind !== 'lesson') return;
    if (activityDialog) { lessonPending = { token, fn }; return; }
    fn();
  }, delay);
}
function lessonResumePending() {
  const p = lessonPending; lessonPending = null;
  if (p && p.token === lessonToken) lessonLater(p.token, p.fn, 300);
}
function lessonReducedMotion() { return readData('preferences', {}).motion === false || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
function lessonBoardElement() { return document.querySelector('#screen-lesson .chess-board'); }

// ===== 기록 =====
function lessonProgressAll() { const p = readData('lesson_progress_v1', {}); return lessonProgressValid(p) ? p : {}; }
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
  if (saved) return { key: 'resume', label: '이어하기 · ' + LESSON_ROLE_LABELS[saved.snapshot.values.lesson.sceneRole] };
  if (p?.completed) return { key: 'done', label: p.independent ? '해봤어요 ✓ 혼자 성공' : '해봤어요 ✓' };
  return { key: 'new', label: '처음' };
}
function renderLessonList() {
  const fromPlay = lessonOrigin === 'play';
  document.getElementById('screen-lesson').innerHTML = `<div class="screen-wrap lesson-list"><div class="screen-header"><button class="back-btn" onclick="${fromPlay ? 'goPlay()' : "showScreen('home');renderHome()"}">← ${fromPlay ? '체스 대전' : '홈'}</button><h2>체스 수업</h2></div>
    <section class="lesson-course"><h3>내 말 지키기 · 첫 세 수업</h3><p>우리는 <b>흰색(판 아래쪽)</b>, 상대는 검은색이에요. 상대가 잡으려는 우리 말을 찾고 지켜요. 수업마다 <b>보기 → 함께 해보기 → 혼자 해보기</b> 순서예요.</p></section>
    <div class="lesson-cards">${LESSONS.map(lesson => { const status = lessonStatus(lesson); return `<div class="lesson-card-item"><button class="lesson-card" onclick="openLesson('${lesson.id}')"><span class="lesson-number" aria-hidden="true">${lesson.number}</span><span class="lesson-card-text"><strong>${lesson.number}. ${lesson.title}</strong><small>${lesson.skill}</small></span><span class="lesson-status lesson-status-${status.key}">${status.label}</span></button>${status.key === 'resume' ? `<div class="lesson-card-actions"><button class="action-btn secondary" aria-label="${lesson.number}번 처음부터 다시" onclick="restartLesson('${lesson.id}')">↺ 처음부터 다시</button><button class="action-btn green" aria-label="${lesson.number}번 이어하기" onclick="openLesson('${lesson.id}')">▶ 이어하기</button></div>` : ''}</div>`; }).join('')}</div>
    <p class="section-note">순서는 추천이에요. 어느 수업부터 시작해도 돼요. 수업마다 하던 곳을 따로 기억해요.</p></div>`;
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
  state.lesson = lessonFreshState(lesson, lesson.scenes[0]);
  lessonProgressUpdate(id, () => ({ lastSceneId: lesson.scenes[0].id }));
  lessonChangedAt = Date.now(); showScreen('lesson'); renderLesson();
  lessonHowTo(true);
}
function restartLesson(id) {
  const lesson = lessonById(id); if (!lesson) return;
  showChoice(`${lesson.number}. ${lesson.title}을 처음부터 다시 할까요? 시범부터 다시 시작해요. 해본 기록은 그대로예요.`, [
    { label: '처음부터 시작', action: () => { lessonDiscardSave(id); startLesson(id); } },
    { label: '취소', action: () => {} },
  ]);
}

// ===== 단계 이동 =====
function lessonGoScene(index) {
  const { l, lesson } = lessonContext(), scene = lesson?.scenes[index]; if (!scene) return;
  cancelActivityCallbacks(); lessonToken++;
  state.actionHistory = [];  // 되돌리기는 한 연습 안에서만. 마무리 뒤 되돌리기는 같은 혼자 해보기로 돌아간다.
  state.lesson = lessonFreshState(lesson, scene, l.progress);
  lessonProgressUpdate(lesson.id, () => ({ lastSceneId: scene.id }));
  lessonChangedAt = Date.now(); renderLesson();
}
function lessonPrimary() {
  const { l, lesson } = lessonContext(); if (!l || Date.now() - lessonChangedAt < LESSON_TAP_GUARD) return;
  if (l.sceneRole === 'demo') return lessonGoScene(1);  // 시범은 언제든 건너뛸 수 있다
  if (state.animating) return;
  if (l.phase === 'result' && l.result === 'retry') return lessonRetry();
  if (l.phase === 'result' && l.result === 'success') return l.sceneRole === 'guided' ? lessonGoScene(2) : lessonFinish();
  if (l.phase === 'complete') {
    const next = LESSONS[LESSONS.indexOf(lesson) + 1];
    if (next) return openLesson(next.id);
    leaveActivity(); return goPlay();
  }
}
function lessonFinish() {
  const { l, lesson } = lessonContext();
  if (l.sceneRole !== 'transfer' || l.phase !== 'result' || l.result !== 'success' || !l.progress.guided || !l.progress.transfer) return;
  l.phase = 'complete'; l.notice = null; l.helpShown = false;
  // 완료는 함께·혼자 해보기 성공 뒤 마무리에 닿을 때만. 혼자 해보기에서 도움을 썼는지로 구분한다.
  const helped = l.helpUsed;
  lessonProgressUpdate(lesson.id, p => ({ completed: true, assisted: p.assisted || helped, independent: p.independent || !helped, lastSceneId: l.sceneId }));
  lessonChangedAt = Date.now(); spawnParticles(); renderLesson();
}
function lessonRetry() {
  const { l } = lessonContext(); if (l?.phase !== 'result' || l.result !== 'retry' || state.animating) return;
  const top = state.actionHistory?.at(-1)?.values?.lesson;
  if (top && top.sceneId === l.sceneId && top.phase === 'choose') state.actionHistory.pop();
  cancelActivityCallbacks(); lessonToken++;
  Object.assign(l, { phase: 'choose', game: l.attemptStartGame.clone(), selected: null, result: null, responseMove: null, studentMove: null, helpShown: false, notice: null });
  lessonChangedAt = Date.now(); renderLesson();
}

// ===== 시범 =====
function lessonDemoPlay() {
  const { l, lesson, scene } = lessonContext(); if (!l || l.sceneRole !== 'demo' || state.animating) return;
  cancelActivityCallbacks(); const token = ++lessonToken;
  l.phase = 'demoPlaying'; l.demoStep = 1; l.notice = null; renderLesson();
  lessonDemoContinue(token, lessonDemoSteps(lesson, scene));
}
function lessonDemoContinue(token, steps) {
  const l = state.lesson, current = steps[l.demoStep - 1], reduced = lessonReducedMotion();
  const wait = LESSON_DEMO_GAP * (current.move && !reduced ? 1 : 2);
  lessonLater(token, () => {
    if (l.demoStep >= steps.length) { l.phase = 'demoReady'; return renderLesson(); }
    const next = steps[l.demoStep], from = current.game;
    l.demoStep++;
    if (!next.move) { renderLesson(); return lessonDemoContinue(token, steps); }
    const m = next.move;
    animateMove(lessonBoardElement(), m[0], m[1], m[2], m[3], from.board[m[0]][m[1]], () => { if (token !== lessonToken) return; renderLesson(); lessonDemoContinue(token, steps); });
  }, wait);
}
function lessonDemoSkip() {
  const { l, lesson, scene } = lessonContext(); if (l?.phase !== 'demoPlaying') return;
  cancelActivityCallbacks(); lessonToken++;
  l.phase = 'demoReady'; l.demoStep = lessonDemoSteps(lesson, scene).length; l.notice = null; renderLesson();
}

// ===== 입력 =====
function lessonClick(r, c) {
  const { l, lesson, scene } = lessonContext();
  if (!l || state.animating || activityDialog) return;
  if (l.phase === 'demoReady') { l.notice = 'demoTap'; return renderLesson(); }
  if (l.phase === 'result' || l.phase === 'complete') return lessonNudge();
  if (l.phase !== 'choose') return;
  lessonChangedAt = 0;  // 판을 눌렀다면 진행 버튼 연타가 아니다
  const piece = l.game.board[r][c];
  if (lesson.task === 'spot') {
    if (piece?.[0] !== 'w') { l.notice = 'pickOurs'; return renderLesson(); }
    return lessonSpot([r, c]);
  }
  if (l.selected) {
    const move = lessonCandidates(l.game, scene, lesson.task).find(m => m[2] === r && m[3] === c);
    if (move) return lessonAttempt(move);
    if (lessonSameSquare(l.selected, [r, c])) { l.selected = null; l.notice = null; return renderLesson(); }
    // 빈칸 이동은 학습 과제 밖이라 시도로 세지 않는다(체스에서 금지라는 뜻이 아니다).
    if (lessonLegalMoves(l.game, l.selected).some(m => m[2] === r && m[3] === c)) { l.notice = 'emptyMove'; return renderLesson(); }
  }
  if (lessonSameSquare(scene.focusSquare, [r, c])) { l.selected = [r, c]; l.notice = null; return renderLesson(); }
  if (piece?.[0] === 'w') { l.notice = 'notFocus'; l.selected = null; return renderLesson(); }
  l.notice = l.selected ? 'cannotGo' : 'pickFocus'; renderLesson();
}
function lessonRemember() { rememberAction(); if (state.actionHistory.length > 40) state.actionHistory.shift(); }
// 수업 1: 말을 지목한다. 백의 실제 이동이나 차례 소비가 아니다.
function lessonSpot(square) {
  const l = state.lesson;
  lessonRemember();
  l.selected = square; l.notice = null; l.helpShown = false;
  const ok = lessonSpotTargets(l.game).some(s => lessonSameSquare(s, square));
  lessonShowResult(ok ? 'success' : 'retry');
}
// 수업 2·3: 실제로 두고, 위험한 수였다면 그 말을 잡는 흑의 합법 응수 하나를 보여준다.
function lessonAttempt(move) {
  const l = state.lesson, out = lessonOutcome(l.game, move); if (!out) return;
  lessonRemember();
  const token = ++lessonToken, piece = l.game.board[move[0]][move[1]];
  Object.assign(l, { phase: 'response', selected: null, notice: null, helpShown: false, studentMove: move.slice(), game: out.after });
  l.game.selected = null; l.game.validMoves = [];
  saveActiveSession();
  animateMove(lessonBoardElement(), move[0], move[1], move[2], move[3], piece, () => {
    if (token !== lessonToken) return;
    if (out.safe) return lessonShowResult('success');
    renderLesson();
    lessonLater(token, () => {
      const reply = out.reply, mover = l.game.board[reply[0]][reply[1]];
      l.game.move(reply[0], reply[1], reply[2], reply[3]); l.game.selected = null; l.game.validMoves = []; l.responseMove = reply.slice();
      animateMove(lessonBoardElement(), reply[0], reply[1], reply[2], reply[3], mover, () => { if (token === lessonToken) lessonShowResult('retry'); });
    }, LESSON_REPLY_DELAY);
  });
}
function lessonShowResult(result) {
  const l = state.lesson;
  l.phase = 'result'; l.result = result; l.attempts++;
  if (result === 'success') l.progress[l.sceneRole] = true;
  renderLesson();
}
function lessonHelp() {
  const l = state.lesson; if (!l || l.phase !== 'choose' || state.animating) return;
  if (l.helpShown || !l.helpLevel) l.helpLevel = Math.min(3, l.helpLevel + 1);
  l.helpShown = true; l.helpUsed = true; l.notice = null;
  noteHelp(l.helpLevel); renderLesson();
}
// 수업 방법·표시의 뜻·이유. 새 수업을 시작할 때 자동으로, 그 뒤에는 ❓ 버튼으로 연다.
const LESSON_CONTROLS = {
  spot: '말을 움직이지 않아요. 상대(검은색)가 다음 차례에 잡을 수 있는 <b>우리 말을 찾아 한 번 눌러</b> 알려 줘요.',
  escape: '① 파란 테두리의 우리 말을 눌러요. ② 점이 찍힌 칸 중 <b>상대가 잡을 수 없는 칸</b>을 눌러 옮겨요. 위험한 칸이면 상대가 실제로 잡는 모습을 보여줘요.',
  captureSafe: '① 파란 테두리의 우리 룩을 눌러요. ② 노란 테두리 칸의 상대 폰을 눌러 잡아요. <b>잡은 뒤에도 룩이 잡히지 않는 쪽</b>이 정답이에요.',
};
function lessonHowToHTML(lesson) {
  return `<div class="lesson-howto"><p><b>배울 것</b> ${lesson.skill}.</p>
    <p class="lesson-howto-sides"><span>${getPieceSVG('wK', 28)}<b>우리 = 흰색</b> 판 아래쪽</span><span>${getPieceSVG('bK', 28)}<b>상대 = 검은색</b> 판 위쪽</span></p>
    <p class="section-note">판의 말에도 <span class="lesson-owner mine">우리</span> <span class="lesson-owner theirs">상대</span> 표시가 붙어 있어요.</p>
    <p><b>어떻게 하나요?</b> ${LESSON_CONTROLS[lesson.task]}</p>
    <ol class="lesson-howto-steps"><li><b>보기</b> 시범을 보기만 해요.</li><li><b>함께 해보기</b> 안내를 보며 직접 해요.</li><li><b>혼자 해보기</b> 다른 판에서 혼자 해요.</li></ol>
    <p><b>표시</b> <span class="lesson-legend red">빨강</span> 상대의 공격 · <span class="lesson-legend blue">파랑</span> 지킬 우리 말 · <span class="lesson-legend green">초록</span> 안전한 칸. 막히면 💡 도움을 눌러요.</p>
    <p><b>왜 그런가요?</b> ${lesson.why}${lesson.whyNote ? ' ' + lesson.whyNote : ''} 이 수업은 상대의 바로 다음 한 수만 살펴봐요.</p></div>`;
}
function lessonHowTo(first = false) {
  const { lesson } = lessonContext(); if (!lesson) return;
  const actions = first
    ? [{ label: '▶ 시범 보기', action: () => { lessonHowToClosed(); lessonDemoPlay(); } }, { label: '바로 해보기', action: () => { lessonHowToClosed(); lessonGoScene(1); } }]
    : [{ label: '알겠어요', action: lessonHowToClosed }];
  showActivityDialog(`${lesson.number}. ${lesson.title}`, lessonHowToHTML(lesson), actions, 'lesson-howto-overlay', lessonHowToClosed);
}
function lessonHowToClosed() {
  if (!document.activeElement || document.activeElement === document.body) document.querySelector?.('#screen-lesson .lesson-why')?.focus?.({ preventScroll: true });
  lessonResumePending();
}
function lessonNudge() {
  const button = document.querySelector('#screen-lesson .lesson-actions .action-btn.lesson-next');
  if (!button?.classList) return;
  button.classList.remove('lesson-nudge'); void button.offsetWidth; button.classList.add('lesson-nudge');
}

// ===== 대전으로 연결 =====
function lessonPracticeScene(lesson) { return lesson?.scenes.find(s => s.role === 'transfer') || null; }
function lessonPracticeSummary() {
  const s = getPlaySettings();
  return `나: 흰색 · 상대: 컴퓨터 ${playLevelLabel(lessonPracticeLevel)} · 왕 구하기 도움 ${s.help ? '켜짐' : '꺼짐'}`;
}
function lessonPracticeDialog(id) {
  const lesson = lessonById(id || state.lesson?.lessonId), scene = lessonPracticeScene(lesson); if (!scene) return;
  lessonPracticeLevel = getPlaySettings().level;
  showActivityDialog('이 배치로 대전', `<p>혼자 해보기 처음 배치에서 컴퓨터와 표준 체스로 끝까지 두어요. 수업 목표가 아니라 체크메이트나 무승부로 끝나요.</p><label class="lesson-level">컴퓨터 난이도<select id="lesson-practice-level" onchange="lessonPracticeLevel=Number(this.value);document.getElementById('lesson-practice-summary').textContent=lessonPracticeSummary()">${AI_LEVELS.map((_, i) => `<option value="${i}" ${i === lessonPracticeLevel ? 'selected' : ''}>${playLevelLabel(i)}</option>`).join('')}</select></label><p id="lesson-practice-summary" class="play-dialog-note">${lessonPracticeSummary()}</p>${contentBoardPreview(lessonSceneGame(scene))}`,
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
function lessonPracticeGame(c) { return lessonSceneGame(lessonPracticeScene(lessonById(c.lessonId))); }
function lessonPracticePanel() {
  const lesson = lessonById(state.play.content.lessonId);
  return `<div class="content-context"><strong>📘 수업 배치로 대전 · ${lesson.title}</strong><span>표준 체스로 끝까지 두어요. 두기 전에 상대가 다음에 무엇을 잡을지 살펴봐요.</span><button class="play-chip" onclick="goLessons()">체스 수업 목록</button></div>`;
}

// ===== 화면 =====
// 설명 영역은 늘 '👉 지금 누를 것'을 말한다. 결과 뒤에는 다음 버튼의 이름을 그대로 적는다.
function lessonPrimaryLabel(l, lesson) {
  if (l.sceneRole === 'demo') return '직접 해보기';
  const next = LESSONS[LESSONS.indexOf(lesson) + 1];
  if (l.phase === 'complete') return next ? '다음 수업' : '대전에 써보기';
  if (l.phase === 'result' && l.result === 'retry') return '다른 방법으로';
  return l.sceneRole === 'guided' ? '다음 연습' : '수업 마치기';
}
function lessonPress(label, verb = '눌러요') { return `<span class="lesson-key">${label}</span>${lessonJosa(label, '을/를').slice(label.length)} ${verb}`; }
const LESSON_NOTICE_TEXT = {
  pickOurs: () => '그건 상대(검은색) 말이거나 빈칸이에요. 👉 <b>우리(흰색) 말</b>을 눌러요.',
  pickFocus: () => '👉 먼저 <b>파란 테두리의 우리 말</b>을 눌러요.',
  notFocus: lesson => lesson.task === 'captureSafe' ? '이번에는 파란 테두리의 우리 룩으로 폰을 잡아봐요. 👉 그 룩을 눌러요.' : '이번에는 파란 테두리의 우리 말을 지켜요. 👉 그 말을 눌러요.',
  emptyMove: () => '빈칸으로 옮기는 대신, 이번에는 폰을 잡는 두 방법을 비교해요. 👉 <b>노란 테두리 칸</b>을 눌러요.',
  cannotGo: () => '그 칸으로는 갈 수 없어요. 👉 <b>점이 찍힌 칸</b> 중에서 골라요.',
  demoTap: () => `지금은 시범 단계라 판을 누르지 않아요. 👉 ${lessonPress('직접 해보기')}.`,
};
const LESSON_HELP_TEXT = {
  spot: ['', '빨간 테두리가 상대 말이에요. 이 말이 다음에 무엇을 잡을 수 있을지 살펴봐요.', '빨간 점은 그 상대 말이 갈 수 있는 칸이에요. 점이 닿는 우리 말을 찾아봐요.', '주황 테두리의 우리 말이 정답이에요. 👉 그 말을 눌러요.'],
  escape: ['', '빨간 테두리의 상대 말이 우리 말을 노려요.', '빗금 칸으로 가면 빨간 화살표의 상대 말이 잡아요. 👉 다른 칸을 골라요.', '초록 화살표처럼 옮기면 안전해요. 다른 안전한 칸을 골라도 좋아요.'],
  captureSafe: ['', '주황 테두리가 우리 룩으로 잡을 수 있는 상대 폰이에요.', '빗금 칸의 폰을 잡으면 빨간 화살표의 상대 말이 룩을 다시 잡아요.', '초록 화살표처럼 잡으면 우리 룩도 안전해요.'],
};
function lessonHelpMarks(l, lesson, scene) {
  const g = l.game, level = l.helpLevel, marks = {};
  if (lesson.task === 'spot') {
    const targets = lessonSpotTargets(g), attackers = [...new Map(targets.flatMap(t => lessonSpotAttackers(g, t)).map(a => [a.join(','), a])).values()];
    marks.attackers = attackers;
    if (level >= 2) marks.reach = attackers.flatMap(a => lessonReach(g, a));
    if (level >= 3) marks.targets = targets;
    return marks;
  }
  const outcomes = lessonCandidates(g, scene, lesson.task).map(m => [m, lessonOutcome(g, m)]);
  if (lesson.task === 'escape') marks.attackers = lessonSpotAttackers(g, scene.focusSquare);
  else marks.targets = outcomes.map(([m]) => [m[2], m[3]]);
  if (level >= 2) { const bad = outcomes.filter(([, o]) => !o.safe); marks.danger = bad.map(([m]) => [m[2], m[3]]); marks.arrows = bad.map(([m, o]) => [o.reply[0], o.reply[1], m[2], m[3]]); }
  if (level >= 3) { const good = outcomes.find(([, o]) => o.safe); if (good) marks.suggest = [good[0]]; }
  return marks;
}
function lessonView() {
  const { l, lesson, scene } = lessonContext();
  if (l.sceneRole === 'demo') {
    if (l.demoStep > 0) { const steps = lessonDemoSteps(lesson, scene), step = steps[l.demoStep - 1]; return { game: step.game, marks: step.marks, predict: !!step.predict, text: step.text, total: steps.length }; }
    return { game: l.game, marks: lesson.task === 'spot' ? {} : { focus: [scene.focusSquare] } };
  }
  const marks = {};
  if (l.phase === 'choose') {
    if (lesson.task !== 'spot') { marks.focus = [scene.focusSquare]; if (!l.selected) marks.tap = [scene.focusSquare]; }
    if (l.selected) {
      const moves = lessonLegalMoves(l.game, l.selected);
      marks.selected = l.selected; marks.moves = moves.map(m => [m[2], m[3]]); marks.captureMoves = moves.filter(m => l.game.board[m[2]][m[3]]).map(m => [m[2], m[3]]);
    }
    if (l.helpShown && l.helpLevel) Object.assign(marks, lessonHelpMarks(l, lesson, scene));
  } else if (l.phase === 'result' || l.phase === 'complete') {
    if (lesson.task === 'spot') {
      if (l.result === 'success') { const [a] = lessonSpotAttackers(l.game, l.selected); Object.assign(marks, { attackers: [a], targets: [l.selected], arrows: [[...a, ...l.selected]] }); }
      else marks.picked = [l.selected];
    } else if (l.result === 'success') marks.safe = [[l.studentMove[2], l.studentMove[3]]];
    else { marks.danger = [[l.responseMove[2], l.responseMove[3]]]; marks.arrows = [l.responseMove]; marks.tag = [l.responseMove[2], l.responseMove[3], '잡힘']; }
  }
  return { game: l.game, marks };
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
function lessonBoardHTML(view, lesson) {
  const { game, marks, predict } = view, has = (list, r, c) => (list || []).some(p => p[0] === r && p[1] === c), last = game.lastMove;
  let cells = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const piece = game.board[r][c], notes = [];
    let cls = 'board-cell ' + ((r + c) % 2 ? 'dark' : 'light');
    if (piece) { cls += ' pc-' + piece[0]; notes.push(piece[0] === 'w' ? '우리 말' : '상대 말'); }
    if (last && ((last[0] === r && last[1] === c) || (last[2] === r && last[3] === c))) cls += ' last-move';
    if (has(marks.focus, r, c)) { cls += ' lesson-focus'; notes.push('파란 테두리: 지킬 우리 말'); }
    if (has(marks.tap, r, c)) cls += ' lesson-tap';
    if (marks.selected && lessonSameSquare(marks.selected, [r, c])) cls += ' selected';
    if (has(marks.moves, r, c)) cls += has(marks.captureMoves, r, c) ? ' move-hint lesson-capture-hint' : ' move-hint';
    if (has(marks.attackers, r, c)) { cls += ' lesson-attacker'; notes.push('공격하는 상대 말'); }
    if (has(marks.targets, r, c)) { cls += ' lesson-target'; notes.push(lesson.task === 'captureSafe' ? '잡을 수 있는 말' : '상대가 노리는 말'); }
    if (has(marks.reach, r, c)) { cls += ' lesson-reach'; notes.push('상대 말이 갈 수 있는 칸'); }
    if (has(marks.danger, r, c)) { cls += ' danger-cell'; notes.push('잡히는 칸'); }
    if (has(marks.safe, r, c)) { cls += ' lesson-safe'; notes.push('다음 수에 안전한 칸'); }
    if (has(marks.picked, r, c)) { cls += ' lesson-picked'; notes.push('고른 말'); }
    const owner = piece ? `<span class="lesson-owner ${piece[0] === 'w' ? 'mine' : 'theirs'}" aria-hidden="true">${piece[0] === 'w' ? '우리' : '상대'}</span>` : '';
    const tag = marks.tag && marks.tag[0] === r && marks.tag[1] === c ? `<span class="lesson-cell-tag" aria-hidden="true">${marks.tag[2]}</span>` : '';
    cells += `<div class="${cls}" onclick="lessonClick(${r},${c})"${notes.length ? ` data-note="${notes.join(', ')}"` : ''}>${piece ? getPieceSVG(piece) : ''}${owner}${tag}</div>`;
  }
  const arrows = [...(marks.arrows || []).map(a => [a, 'attack']), ...(marks.suggest || []).map(a => [a, 'suggest'])];
  return `<div class="chess-board lesson-board${predict ? ' lesson-predict' : ''}">${cells}${lessonArrowSVG(arrows)}${predict ? '<span class="lesson-predict-badge">예측 · 상대 차례라면</span>' : ''}</div>`;
}
function lessonMessage(view) {
  const { l, lesson, scene } = lessonContext(), next = lessonPrimaryLabel(l, lesson);
  const focusName = lessonPieceName(l.attemptStartGame.board[scene.focusSquare[0]][scene.focusSquare[1]]);
  if (l.notice) return { tone: 'warn', html: LESSON_NOTICE_TEXT[l.notice](lesson) };
  if (l.phase === 'demoReady') return l.demoStep
    ? { tone: 'success', html: `시범 끝! ${view.text} 👉 이제 ${lessonPress(next)}.` }
    : { tone: '', html: `<b>시범</b>은 보기만 하면 돼요. 👉 ${lessonPress('▶ 시범 보기')}. 바로 하려면 <span class="lesson-key">${next}</span>.` };
  if (l.phase === 'demoPlaying') return { tone: '', html: `<b>시범 ${l.demoStep}/${view.total}</b> ${view.text}` };
  if (l.phase === 'choose') {
    if (l.helpShown && l.helpLevel) {
      const noDanger = l.helpLevel === 2 && lesson.task !== 'spot' && !lessonHelpMarks(l, lesson, scene).danger?.length;
      return { tone: 'help', html: `💡 도움 ${l.helpLevel}/3 · ${noDanger ? '이 말이 갈 수 있는 칸은 모두 다음 수에 안전해요.' : LESSON_HELP_TEXT[lesson.task][l.helpLevel]}` };
    }
    if (lesson.task === 'spot') return { tone: '', html: `👉 상대(검은색)가 다음 차례에 잡을 수 있는 <b>우리(흰색) 말을 눌러</b> 알려 주세요. 말은 움직이지 않아요.` };
    if (!l.selected) return { tone: '', html: `👉 ① 파란 테두리의 <b>우리 ${focusName}</b>${lessonJosa(focusName, '을/를').slice(focusName.length)} 눌러요.${l.sceneRole === 'guided' && scene.guide ? ' ' + scene.guide : ''}` };
    return { tone: '', html: lesson.task === 'escape' ? '👉 ② 점이 찍힌 칸 중 <b>상대가 다음에 잡을 수 없는 칸</b>을 눌러 옮겨요.' : '👉 ② 노란 테두리 칸의 <b>상대 폰</b>을 눌러 잡아요. 잡은 뒤에도 우리 룩이 안전한 쪽이에요.' };
  }
  if (l.phase === 'response') return { tone: 'dim', html: '상대(검은색) 차례예요…' };
  if (l.phase === 'complete') return { tone: 'success', html: `✓ 수업 끝! ${lesson.learned} 👉 ${lessonPress(next)}.` };
  const start = l.attemptStartGame;
  if (l.result === 'success') {
    const core = lesson.task === 'spot' ? `맞아요! 빨간 화살표처럼 ${lessonSpotSuccessText(start, l.selected)}` : lesson.task === 'escape' ? `안전해요! ${lessonSuccessText(lesson, start, l.studentMove)}` : lessonSuccessText(lesson, start, l.studentMove);
    return { tone: 'success', html: `✓ ${core} 👉 ${lessonPress(next)}.` };
  }
  const why = lesson.task === 'spot' ? '그 말은 지금 바로 잡히지 않아요.' : `빨간 화살표처럼 ${lessonFailureText(lesson, start, l.studentMove, l.responseMove)}`;
  const then = lesson.task === 'spot' ? '다른 우리 말을 골라요.' : lesson.task === 'escape' ? '다른 칸을 골라요.' : '다른 폰을 잡아봐요.';
  return { tone: 'fail', html: `✗ ${why} 👉 ${lessonPress(next, '누르고')} ${then}` };
}
function lessonStepsHTML(l) {
  const order = ['demo', 'guided', 'transfer'], index = order.indexOf(l.sceneRole), done = l.phase === 'complete';
  const steps = order.map((role, k) => { const current = !done && k === index; return `<li class="${done || k < index ? 'done' : current ? 'current' : ''}"${current ? ' aria-current="step"' : ''}>${current ? `${k + 1}/3 ${LESSON_ROLE_LABELS[role]}` : LESSON_ROLE_SHORT[role]}</li>`; }).join('');
  return `<div class="lesson-statusbar"><ol class="lesson-steps" aria-label="수업 단계">${steps}${done ? '<li class="current" aria-current="step">마무리</li>' : ''}</ol><span class="lesson-side">${getPieceSVG('wK', 18)}<span>우리 = 흰색</span></span></div>`;
}
function lessonButtons(l, lesson) {
  const busy = state.animating || lessonUnstable(), canUndo = !busy && !!state.actionHistory?.length && l.sceneRole !== 'demo';
  const undo = `<button class="icon-btn" onclick="requestActivityUndo()" ${canUndo ? '' : 'disabled'}>↶ 되돌리기</button>`;
  const why = `<button class="icon-btn lesson-why" onclick="lessonHowTo()">❓ 방법과 이유</button>`;
  const middle = l.phase === 'complete' ? `<button class="icon-btn" onclick="lessonPracticeDialog()">⚔ 이 배치로 대전</button>`
    : `<button class="icon-btn" onclick="lessonHelp()" ${l.phase === 'choose' ? '' : 'disabled'}>💡 도움${l.helpLevel ? ` ${l.helpLevel}/3` : ''}</button>`;
  const label = lessonPrimaryLabel(l, lesson);
  let left, right;
  // 다음에 누를 버튼은 반짝임으로 짚어준다(동작 줄이기에서는 테두리만).
  if (l.sceneRole === 'demo') {
    left = l.phase === 'demoPlaying' ? `<button class="action-btn secondary" onclick="lessonDemoSkip()">⏭ 끝 장면 보기</button>` : `<button class="action-btn secondary${l.demoStep ? '' : ' lesson-next'}" onclick="lessonDemoPlay()">${l.demoStep ? '↻ 다시 보기' : '▶ 시범 보기'}</button>`;
    right = `<button class="action-btn green${l.phase === 'demoReady' && l.demoStep ? ' lesson-next' : ''}" onclick="lessonPrimary()">${label}</button>`;
  } else {
    left = `<button class="action-btn secondary" onclick="goLessons()">수업 목록</button>`;
    const enabled = (l.phase === 'complete' || l.phase === 'result') && !busy;
    right = `<button class="action-btn green${enabled ? ' lesson-next' : ''}" onclick="lessonPrimary()" ${enabled ? '' : 'disabled'}>${label}</button>`;
  }
  return `<div class="mission-actions lesson-tools">${undo}${middle}${why}</div><div class="lesson-actions">${left}${right}</div>`;
}
function renderLesson() {
  const { l, lesson } = lessonContext(); if (!l || !lesson) return goLessons();
  const view = lessonView(), message = lessonMessage(view);
  renderGameScreen('screen-lesson', `<div class="screen-wrap lesson-screen"><div class="screen-header lesson-header"><button class="back-btn" onclick="goLessons()">← 목록</button><h2>${lesson.number}. ${lesson.title}</h2><button class="lesson-restart-btn" onclick="restartLesson('${lesson.id}')">↺ 처음부터</button></div>${lessonStepsHTML(l)}<div class="status-msg lesson-message ${message.tone}">${message.html}</div>${lessonBoardHTML(view, lesson)}${lessonButtons(l, lesson)}</div>`);
  saveActiveSession();
}
