// 승급 과정 화면 (docs/PREMIUM_COURSE.md §5)
// 체스 수업과 같은 화면 틀: 목표·설명 영역 + 같은 크기의 판 + 버튼 두 개(왼쪽 보조, 오른쪽 진행).
// 세 가지 방식: 주제 판(15판, mode 'level') · 무한 연습(mode 'drill') · 승급 시험(mode 'test').
// 판 하나는 여러 수일 수 있다: 두 수 메이트·두 수로 말 얻기(내 수 → 상대 → 내 수), 끝내기(제한 수 안에서 계속).
const COURSE_REPLY_DELAY = 550, COURSE_HINT_UNLOCK = 2, COURSE_SLICE = 14;
let courseToken = 0, courseChangedAt = 0, courseOrigin = 'home', courseJob = null, courseReady = null;

function courseContext() {
  const c = state.course, topic = courseTopic(c?.topicId);
  return { c, topic, level: !topic ? null : c.mode === 'level' ? topic.levels[c.levelIndex] : c.level || null };
}
function courseMulti(topic) { return ['endgame', 'ladder'].includes(topic.mode); }
function courseHintFree(c, topic, level) { return c.mode === 'drill' || courseMulti(topic) || !!level?.showHint || (c.fails || 0) >= COURSE_HINT_UNLOCK; }

// ===== 판정: 지금 판(board)에서 내 수 하나 =====
// step은 이 판에서 내가 이미 둔 수의 개수. 결과 {result:'success'|'fail'|'goal'|'continue', reply, note, ...}
function courseJudge(topic, level, game, step, move, banked) {
  if (!lessonMovesFrom(game, move).some(m => m[2] === move[2] && m[3] === move[3])) return null;
  const b = game.board;
  let out = null;
  if (topic.mode === 'mate2') out = step === 0 ? crMate2First(b, move) : crMate2Second(b, move);
  else if (topic.mode === 'win2') out = step === 0 ? crWin2First(b, move) : crWin2Second(b, move, banked || 0);
  else if (topic.mode === 'endgame') out = crEndgameStep(topic.piece, b, move);
  else if (topic.mode === 'ladder') out = crLadderStep(b, move);
  else if (topic.mode === 'opening') { const o = crOpeningJudge(topic.topic, game, move); out = o && { result: o.result, reply: o.reply ? o.reply.slice(0, 4) : null, note: o.note }; }
  if (!out) return null;
  // 두 번째 수가 남은 방식은 두 수까지만. 끝내기는 제한 수 안에서.
  if (out.result === 'continue' && (topic.mode === 'mate2' || topic.mode === 'win2') && step >= 1) out = { result: 'fail', reply: out.reply, note: 'tooLong' };
  if (out.result === 'continue' && courseMulti(topic) && step + 1 >= (level.limit || 99)) out = { ...out, result: 'fail', note: 'limit' };
  if (out.result === 'continue' && !out.reply) out = { result: 'fail', reply: null, note: 'stalemate' };
  return out;
}
// 저장된 수 목록(line)을 신뢰된 시작 배치에서 다시 두어 지금 판을 만든다. 상대 응수는 다시 계산해 저장 값과 비교한다.
function courseReplay(topic, level, line) {
  const game = courseGame(level);
  let step = 0, banked = 0, last = null, i = 0, ended = false;
  while (i < line.length) {
    if (ended) return null;
    const move = line[i]; if (!lessonMoveValid(move)) return null;
    const out = courseJudge(topic, level, game, step, move, banked); if (!out) return null;
    game.move(move[0], move[1], move[2], move[3]); i++; step++;
    if (topic.mode === 'win2' && out.result === 'continue') banked = out.note?.banked || 0;
    if (out.reply) {
      const r = line[i]; if (!lessonMoveValid(r) || String(r) !== String(out.reply.slice(0, 4))) return null;
      game.move(r[0], r[1], r[2], r[3]); i++;
    }
    last = { out, move };
    if (out.result !== 'continue') ended = true;
  }
  game.selected = null; game.validMoves = [];
  return { game, step, banked, last, ended };
}
function courseFresh(topic, extra = {}) {
  return { topicId: topic.id, contentVersion: COURSE_CONTENT_VERSION, line: [], phase: 'choose', result: null, note: null, hintLevel: 0, fails: 0, helpUsed: false, attempts: 0, ...extra };
}
// 저장할 때는 화면용 값(게임 객체·선택·분석)을 빼고, 응수 중이면 그 수 직전으로 남긴다.
function courseStableState(c) {
  if (!c) return c;
  const { game, selected, inspect, notice, level, banked, progress, ...rest } = c;
  if (c.phase !== 'response') return rest;
  return { ...rest, phase: 'choose', line: (c.pendingLine || rest.line).slice(), pendingLine: undefined };
}
function courseRevive(c) {
  if (!c) return c;
  const topic = courseTopic(c.topicId);
  if (c.mode !== 'level' && c.fen && topic) c.level = cgLevelFromFen(topic.id, c.tier, c.fen);
  const level = c.mode === 'level' ? topic?.levels[c.levelIndex] : c.level;
  if (level && c.phase !== 'loading') { const r = courseReplay(topic, level, c.line || []); if (r) { c.game = r.game; c.banked = r.banked; } }
  c.selected = null; c.inspect = null; c.notice = null;
  return c;
}
const courseCount = (n, max = 100000) => Number.isInteger(n) && n >= 0 && n <= max;
// 저장 값 검증과 재구성(세션 복원·파일 가져오기). 파일 속 배치·결과를 믿지 않고 교재와 수로 다시 만든다.
function courseRebuild(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || v.contentVersion !== COURSE_CONTENT_VERSION) return null;
  const topic = courseTopic(v.topicId); if (!topic) return null;
  if (!['level', 'drill', 'test'].includes(v.mode) || !['loading', 'choose', 'result', 'complete'].includes(v.phase)) return null;
  if (!Array.isArray(v.line) || v.line.length > 80 || !courseCount(v.attempts) || !courseCount(v.fails) || ![0, 1].includes(v.hintLevel) || typeof v.helpUsed !== 'boolean') return null;
  const out = { topicId: topic.id, contentVersion: COURSE_CONTENT_VERSION, mode: v.mode, line: v.line.map(m => m.slice ? m.slice(0, 4) : m), phase: v.phase, result: null, note: null, hintLevel: v.hintLevel, fails: v.fails, helpUsed: v.helpUsed, attempts: v.attempts };
  let level;
  if (v.mode === 'level') {
    if (!Number.isInteger(v.levelIndex) || !topic.levels[v.levelIndex] || !Array.isArray(v.solved) || v.solved.length !== topic.levels.length || !v.solved.every(x => typeof x === 'boolean')) return null;
    level = topic.levels[v.levelIndex]; Object.assign(out, { levelIndex: v.levelIndex, solved: v.solved.slice() });
  } else {
    if (!Number.isInteger(v.tier) || v.tier < 0 || v.tier > 4 || !Number.isInteger(v.seed) || v.seed < 1 || v.seed > 0xffffffff || !courseCount(v.streak) || !courseCount(v.count) || typeof v.recorded !== 'boolean') return null;
    Object.assign(out, { tier: v.tier, seed: v.seed, streak: v.streak, count: v.count, recorded: v.recorded, fen: null });
    if (v.mode === 'test') {
      const t = v.test, stage = courseStage(t?.stage);
      if (!stage || !Array.isArray(t.items) || t.items.length < 3 || t.items.length > 6 || !Number.isInteger(t.index) || t.index < 0 || t.index >= t.items.length || !Array.isArray(t.results) || t.results.length > t.items.length || !t.results.every(x => typeof x === 'boolean')) return null;
      if (!t.items.every(it => courseTopic(it?.topicId)?.stage === stage.id && Number.isInteger(it.tier) && it.tier >= 0 && it.tier <= 4 && Number.isInteger(it.seed) && it.seed > 0 && it.seed <= 0xffffffff)) return null;
      const item = t.items[t.index]; if (item.topicId !== topic.id || item.tier !== v.tier || item.seed !== v.seed) return null;
      out.test = { stage: stage.id, items: t.items.map(it => ({ topicId: it.topicId, tier: it.tier, seed: it.seed })), index: t.index, results: t.results.slice() };
    }
    if (v.phase === 'loading') { if (v.fen !== null || v.line.length) return null; return out; }
    level = cgLevelFromFen(topic.id, v.tier, v.fen); if (!level) return null;
    out.fen = level.fen;
  }
  if (v.phase === 'complete') { if (v.line.length) return null; if (v.mode === 'level' && !out.solved.every(Boolean)) return null; return out; }
  const r = courseReplay(topic, level, out.line); if (!r) return null;
  if (v.phase === 'choose' && r.ended) return null;
  if (v.phase === 'result') { if (!r.ended) return null; out.result = r.last.out.result; out.note = typeof r.last.out.note === 'string' ? r.last.out.note : null; if (v.result !== out.result) return null; }
  return out;
}

// ===== 목록 =====
function goCourse(origin) {
  if (origin) courseOrigin = origin;
  leaveActivity(); courseToken++;
  showScreen('course'); renderCourseHome();
}
function courseSaved(topicId) {
  const s = activitySaved('course');
  return s && !s.complete && s.snapshot.values.course?.topicId === topicId && s.snapshot.values.course.mode === 'level' ? s : null;
}
function courseStatus(topic) {
  const saved = courseSaved(topic.id), marks = courseTopicMarks(topic), cleared = marks.filter(Boolean).length;
  if (saved) return { key: 'resume', label: `이어하기 · 판 ${saved.snapshot.values.course.levelIndex + 1}/${topic.levels.length}` };
  if (courseTopicDone(topic)) return { key: 'done', label: marks.every(m => m === 'solved') ? '해봤어요 ✓ 혼자 성공' : '해봤어요 ✓' };
  if (!courseLevelOpen(topic, COURSE_FREE_LEVELS)) return { key: 'locked', label: `맛보기 ${COURSE_FREE_LEVELS}판 무료 · 🔒` };
  return { key: cleared ? 'resume' : 'new', label: cleared ? `${cleared}/${topic.levels.length}판` : `처음 · ${topic.levels.length}판` };
}
function courseTopicCardHTML(topic) {
  const status = courseStatus(topic), cleared = courseTopicMarks(topic).filter(Boolean).length, go = status.key === 'resume' ? '이어하기' : '시작하기', drill = courseDrillOpen(topic);
  return `<div class="lesson-card-item course-card-item"><button class="lesson-card course-card" aria-label="${topic.stageNumber}-${topic.number} ${go} · ${topic.title} · ${status.label}" onclick="openCourseTopic('${topic.id}')"><span class="lesson-number course-number" aria-hidden="true">${topic.stageNumber}-${topic.number}</span><span class="lesson-card-text"><strong>${topic.title}${topic.free ? ' <b class="course-free">무료</b>' : ''}</strong><small>${topic.skill}</small><span class="lesson-status lesson-status-${status.key === 'locked' ? 'new' : status.key} course-status-${status.key}">${status.label}</span></span><span class="lesson-go" aria-hidden="true">▶ ${go}</span></button>
    <div class="lesson-card-actions"><button class="lesson-sub-btn" aria-label="${topic.stageNumber}-${topic.number} 판 고르기" onclick="coursePicker('${topic.id}')">☰ 판 고르기 <b>${cleared}/${topic.levels.length}</b></button><button class="lesson-sub-btn lesson-drill-btn" aria-label="${topic.stageNumber}-${topic.number} 무한 연습${drill ? '' : ' 잠김'}" onclick="courseDrillDialog('${topic.id}')">${drill ? '∞ 무한 연습' : '🔒 무한 연습'}</button></div></div>`;
}
function courseStageHTML(stage) {
  const s = courseStageSummary(stage.id), owned = courseOwnsStage(stage.id), pct = Math.round(s.cleared / s.total * 100);
  const test = s.test?.passed ? `🏅 수료 · ${s.test.best ?? s.test.score}/${s.test.total}` : s.test ? `시험 ${s.test.score}/${s.test.total} · 다시 도전` : '아직 시험 전';
  return `<section class="course-stage" aria-labelledby="course-stage-${stage.id}"><div class="course-stage-head"><span class="course-stage-icon" aria-hidden="true">${stage.icon}</span><div><h3 id="course-stage-${stage.id}">${stage.number}단계 · ${stage.title}${owned ? '' : ' <b class="course-lock">🔒 일부 무료</b>'}</h3><p>${stage.summary}</p><span class="lesson-bar course-bar" role="progressbar" aria-label="${stage.number}단계 클리어한 판" aria-valuemin="0" aria-valuemax="${s.total}" aria-valuenow="${s.cleared}"><i style="width:${pct}%"></i></span><small>${s.cleared}/${s.total}판 · 주제 ${s.done}/${s.topics.length} 완료 · ${test}</small></div></div>
    <div class="lesson-cards">${s.topics.map(courseTopicCardHTML).join('')}</div>
    <div class="course-stage-actions"><button class="action-btn ${owned ? 'green' : 'secondary'}" onclick="courseTestDialog('${stage.id}')">${owned ? '📝' : '🔒'} ${stage.number}단계 승급 시험</button><button class="action-btn secondary" onclick="courseMatchDialog('${stage.id}')">⚔️ 실전 승급전${s.match ? ' ✓' : ''}</button>${s.test?.passed ? `<button class="action-btn secondary" onclick="courseCertificate('${stage.id}')">🏅 수료증</button>` : ''}</div></section>`;
}
// 단계 탭: 한 번에 한 단계의 주제만 보여 준다(긴 목록을 줄인다). 처음에는 아직 끝내지 않은 첫 단계.
let courseStageTab = null;
function courseDefaultStage() { const p = courseProgress(); return (COURSE_STAGES.find(s => !p.tests[s.id]?.passed) || COURSE_STAGES[0]).id; }
function courseSetStage(id) { if (courseStage(id)) { courseStageTab = id; renderCourseHome(); } }
function renderCourseHome() {
  const mode = storeMode(), total = COURSE_TOPICS.reduce((n, t) => n + t.levels.length, 0);
  if (!courseStage(courseStageTab)) courseStageTab = courseDefaultStage();
  const note = mode === 'preview' ? `<p class="course-preview-note">🌐 웹 미리보기: 모든 판을 써 볼 수 있어요. 앱에서는 단계마다 첫 주제와 주제마다 처음 ${COURSE_FREE_LEVELS}판이 무료예요.</p>`
    : mode === 'locked' ? '<p class="course-preview-note">🔒 앱 잠금 미리보기 중이에요. 보호자 화면에서 끌 수 있어요.</p>' : '';
  document.getElementById('screen-course').innerHTML = `<div class="screen-wrap lesson-list course-list"><div class="screen-header"><button class="back-btn" onclick="${courseOrigin === 'play' ? 'goPlay()' : "showScreen('home');renderHome()"}">← ${courseOrigin === 'play' ? '체스 대전' : '홈'}</button><h2>승급 과정</h2></div>
    <section class="lesson-course course-intro"><h3>3단계 · ${COURSE_TOPICS.length}개 주제 · ${total}판</h3><p>체스 수업 다음 단계예요. 이번에는 <b>두 수 이상</b> 내다봐요. 단계마다 <b>승급 시험</b>을 통과하면 수료증을 받아요. 나는 <b>흰색</b>이에요.</p>${note}</section>
    <div class="workshop-tabs course-tabs" role="tablist" aria-label="단계">${COURSE_STAGES.map(s => { const sum = courseStageSummary(s.id); return `<button role="tab" aria-selected="${courseStageTab === s.id}" class="workshop-tab${courseStageTab === s.id ? ' active' : ''}" onclick="courseSetStage('${s.id}')">${s.number}단계${sum.test?.passed ? ' 🏅' : ''}</button>`; }).join('')}</div>
    ${courseStageHTML(courseStage(courseStageTab))}
    <p class="section-note">순서는 추천이에요. 어느 단계부터 해도 돼요. 수료증은 이 앱 안의 과정 기록이며 공인 급수가 아니에요.</p><button class="text-button" onclick="openStoreSheet()">보호자 · 구매와 복원</button></div>`;
}
function openCourseTopic(id) {
  const topic = courseTopic(id); if (!topic) return goCourse();
  if (courseSaved(id)) return resumeActivity('course');
  const marks = courseTopicMarks(topic), next = marks.findIndex(m => !m);
  startCourseLevel(id, next < 0 ? 0 : next);
}
function startCourseLevel(id, index) {
  const topic = courseTopic(id); if (!topic?.levels[index]) return;
  courseStageTab = topic.stage;
  if (!courseLevelOpen(topic, index)) return storeLockedDialog(topic.entitlement, `${topic.title} ${index + 1}번 판`);
  closeActivityDialog(false);
  const keep = state.activeKind === 'course' && state.course?.topicId === id && state.course.mode === 'level' ? state.course : null;
  beginActivity('course', { id, mode: 'level' }); courseToken++;
  const marks = courseTopicMarks(topic);
  state.course = courseFresh(topic, { mode: 'level', levelIndex: index, solved: keep?.solved || marks.map(Boolean), helpUsed: !!keep?.helpUsed, attempts: keep?.attempts || 0 });
  courseRevive(state.course); courseChangedAt = Date.now(); showScreen('course'); renderCourse();
}
function coursePicker(id) {
  const topic = courseTopic(id || state.course?.topicId); if (!topic) return;
  const marks = courseTopicMarks(topic), current = state.activeKind === 'course' && state.course?.topicId === topic.id && state.course.mode === 'level' ? state.course.levelIndex : -1;
  const rows = CG_TIER_NAMES.map((name, t) => `<div class="lesson-pick-row"><span class="lesson-pick-tier">${name}</span>${topic.levels.map((lv, i) => [lv, i]).filter(([lv]) => lv.tier === t + 1).map(([, i]) => { const open = courseLevelOpen(topic, i); return `<button class="lesson-pick${marks[i] === 'solved' ? ' done' : marks[i] ? ' helped' : ''}${i === current ? ' current' : ''}${open ? '' : ' locked'}" aria-label="판 ${i + 1} · ${name}${marks[i] === 'solved' ? ' · 혼자 성공' : marks[i] ? ' · 힌트로 성공' : ''}${open ? '' : ' · 잠김'}" onclick="startCourseLevel('${topic.id}',${i})">${i + 1}${marks[i] === 'solved' ? ' ✓' : marks[i] ? ' 💡' : open ? '' : ' 🔒'}</button>`; }).join('')}</div>`).join('');
  const alone = marks.filter(m => m === 'solved').length, helped = marks.filter(m => m === 'helped').length;
  showActivityDialog(`${topic.stageNumber}-${topic.number}. ${topic.title} · 판 고르기`, `<p class="lesson-pick-note">어느 판부터 해도 돼요. 아래로 갈수록 어려워요. ✓는 혼자 성공, 💡는 힌트를 보고 성공한 판이에요. <b>✓ ${alone} · 💡 ${helped} / ${topic.levels.length}</b></p><div class="lesson-pick-grid">${rows}</div>`,
    [{ label: '닫기', action: () => {} }, { label: '∞ 무한 연습', action: () => courseDrillDialog(topic.id) }], 'course-picker-overlay');
}

// ===== 판 진행 =====
function coursePrimary() {
  const { c, topic } = courseContext(); if (!c || state.animating || Date.now() - courseChangedAt < LESSON_TAP_GUARD) return;
  if (c.phase === 'result') {
    if (c.mode === 'test') return courseTestNext();
    if (c.result !== 'success') return courseRetry();
    return c.mode === 'drill' ? courseDrillNext() : courseNextLevel();
  }
  if (c.phase === 'complete') {
    if (c.mode === 'test') return courseTestPrimary();
    const list = courseStageTopics(topic.stage), next = list[list.indexOf(topic) + 1];
    if (next) return openCourseTopic(next.id);
    return courseTestDialog(topic.stage);
  }
}
function courseSecondary() {
  const { c, topic, level } = courseContext(); if (!c || state.animating) return;
  if (c.phase === 'complete') return c.mode === 'test' ? goCourse() : courseTestDialog(topic.stage);
  if (c.phase === 'result' && c.result === 'success') return c.mode === 'test' ? null : courseRetry();
  if (c.phase === 'result' && courseMulti(topic) && c.mode !== 'test') return courseStepBack();
  if (c.mode === 'test') return;
  if (c.mode === 'drill' && c.phase === 'choose' && c.hintLevel) return courseDrillNext();
  courseHint();
}
function courseRetry() {
  const { c, level } = courseContext(); if (c?.phase !== 'result' || state.animating || c.mode === 'test') return;
  cancelActivityCallbacks(); courseToken++;
  Object.assign(c, { phase: 'choose', line: [], result: null, note: null, selected: null, inspect: null, notice: null, progress: null });
  courseRevive(c); courseChangedAt = Date.now(); renderCourse();
}
// 끝내기에서 실패한 수 직전으로(처음부터 다시 하지 않아도 되게)
function courseStepBack() {
  const { c, topic } = courseContext(); if (c?.phase !== 'result' || !courseMulti(topic) || c.mode === 'test') return;
  cancelActivityCallbacks(); courseToken++;
  // 마지막 내 수(와 그 뒤 응수)를 뺀다: 응수가 있었으면 두 개, 없었으면 한 개
  const line = c.line.slice(), out = courseReplay(topic, courseContext().level, line); if (!out?.last) return courseRetry();
  line.splice(line.length - (out.last.out.reply ? 2 : 1));
  Object.assign(c, { phase: 'choose', line, result: null, note: null, selected: null, inspect: null, notice: null, progress: null });
  courseRevive(c); courseChangedAt = Date.now(); renderCourse();
}
function courseNextLevel() {
  const { c, topic } = courseContext(); if (c?.phase !== 'result' || c.result !== 'success') return;
  const next = c.levelIndex + 1;
  if (next < topic.levels.length) { if (!courseLevelOpen(topic, next)) return storeLockedDialog(topic.entitlement, `${topic.title} ${next + 1}번 판`); return courseGoLevel(next); }
  if (c.solved.every(Boolean)) { c.phase = 'complete'; c.line = []; courseProgressSave(p => { p.topics[topic.id] = { ...(p.topics[topic.id] || {}), completed: true }; }); spawnParticles(); courseChangedAt = Date.now(); return renderCourse(); }
  const todo = c.solved.findIndex(x => !x); if (todo >= 0 && courseLevelOpen(topic, todo)) return courseGoLevel(todo);
  goCourse();
}
function courseGoLevel(index) {
  const { c, topic } = courseContext(); if (!topic?.levels[index]) return;
  cancelActivityCallbacks(); courseToken++;
  state.course = courseFresh(topic, { mode: 'level', levelIndex: index, solved: c.solved, helpUsed: c.helpUsed, attempts: c.attempts });
  courseRevive(state.course); courseChangedAt = Date.now(); renderCourse();
}
function courseHint() {
  const { c, topic, level } = courseContext(); if (!c || state.animating || c.mode === 'test') return;
  if (c.phase === 'result' && c.result !== 'success') { if (!courseHintFree(c, topic, level)) return; courseRetry(); }
  if (c.phase !== 'choose' || c.hintLevel) return;
  if (!courseHintFree(c, topic, level)) { c.notice = 'hintLocked'; return renderCourse(); }
  c.hintLevel = 1; c.helpUsed = true; c.inspect = null; c.notice = null; noteHelp(1); renderCourse();
}

// ===== 입력 =====
function courseClick(r, col) {
  const { c, topic, level } = courseContext();
  if (!c || state.animating || activityDialog) return;
  if (c.phase === 'result' || c.phase === 'complete') return lessonNudge();
  if (c.phase !== 'choose' || !c.game) return;
  courseChangedAt = 0;
  const piece = c.game.board[r][col];
  if (c.selected) {
    if (lessonSameSquare(c.selected, [r, col])) { c.selected = null; c.notice = null; return renderCourse(); }
    if (lessonMovesFrom(c.game, c.selected).some(m => m[2] === r && m[3] === col)) return courseAttempt([c.selected[0], c.selected[1], r, col]);
  }
  c.inspect = null; c.notice = null;
  if (piece?.[0] === 'w') { c.selected = [r, col]; if (!lessonMovesFrom(c.game, [r, col]).length) c.notice = 'noMoves'; return renderCourse(); }
  if (piece?.[0] === 'b') { c.selected = null; c.inspect = [r, col]; return renderCourse(); }
  c.notice = c.selected ? 'cannotGo' : 'pickOwn'; renderCourse();
}
function courseAttempt(move) {
  const { c, topic, level } = courseContext(), step = Math.ceil(courseStepCount(c)), out = courseJudge(topic, level, c.game, step, move, c.banked);
  if (!out) return;
  const token = ++courseToken, piece = c.game.board[move[0]][move[1]], before = c.game.board.map(row => row.slice());
  c.pendingLine = c.line.slice();
  Object.assign(c, { phase: 'response', selected: null, inspect: null, notice: null });
  c.game.move(move[0], move[1], move[2], move[3]); c.game.selected = null; c.game.validMoves = []; c.line.push(move.slice(0, 4));
  if (topic.mode === 'win2' && out.result === 'continue') c.banked = out.note?.banked || 0;
  animateMove(courseBoardElement(), move[0], move[1], move[2], move[3], piece, () => {
    if (token !== courseToken) return;
    if (!out.reply) return courseFinish(out, before);
    renderCourse();
    courseLater(token, () => {
      const reply = out.reply, taker = c.game.board[reply[0]][reply[1]];
      c.game.move(reply[0], reply[1], reply[2], reply[3]); c.game.selected = null; c.game.validMoves = []; c.line.push(reply.slice(0, 4));
      animateMove(courseBoardElement(), reply[0], reply[1], reply[2], reply[3], taker, () => { if (token === courseToken) courseFinish(out, before); });
    }, COURSE_REPLY_DELAY);
  });
}
function courseStepCount(c) { const { topic, level } = courseContext(); if (!c.line.length) return 0; const r = courseReplay(topic, level, c.line); return r ? r.step : 0; }
function courseLater(token, fn, delay) { laterInScreen(() => { if (token !== courseToken || state.activeKind !== 'course') return; fn(); }, delay); }
function courseBoardElement() { return document.querySelector('#screen-course .chess-board'); }
function courseFinish(out, before) {
  const { c, topic, level } = courseContext(); c.pendingLine = undefined;
  if (out.result === 'continue') {
    c.phase = 'choose';
    c.progress = topic.mode === 'endgame' ? { before: out.before, after: out.after, now: crDistance(c.game.board, 'w') } : topic.mode === 'mate2' || topic.mode === 'win2' ? { firstOk: true } : { ladder: true };
    courseChangedAt = Date.now(); saveActiveSession(); return renderCourse();
  }
  c.phase = 'result'; c.result = out.result; c.note = typeof out.note === 'string' ? out.note : null; c.attempts++; c.progress = null;
  if (out.result !== 'success') c.fails = (c.fails || 0) + 1;
  if (c.mode === 'level' && out.result === 'success') { c.solved[c.levelIndex] = true; courseRecordSolve(topic, level, c.hintLevel > 0); }
  if (c.mode === 'drill') courseDrillResult(c, topic, out.result);
  if (c.mode === 'test') c.test.results[c.test.index] = out.result === 'success';
  if (out.result === 'success' && courseMulti(topic)) spawnParticles();
  courseChangedAt = Date.now(); renderCourse();
}

// ===== 무한 연습과 시험 판 만들기 =====
function courseDrillDialog(id) {
  const topic = courseTopic(id); if (!topic) return;
  if (!courseDrillOpen(topic)) return storeLockedDialog(topic.entitlement, `${topic.title} 무한 연습`);
  const s = courseDrillStats(id), current = state.activeKind === 'course' && state.course?.mode === 'drill' && state.course.topicId === id ? state.course.tier : -1;
  const rows = CG_TIER_NAMES.map((name, t) => `<button class="lesson-drill-tier${t === current ? ' current' : ''}" onclick="startCourseDrill('${id}',${t})"><strong>${t + 1}. ${name}</strong><small>${s.solved[t] || s.helped[t] ? `혼자 ${s.solved[t]} · 💡 ${s.helped[t]} · 최고 연속 ${s.best[t]}` : '아직 안 해봤어요'}</small></button>`).join('');
  showActivityDialog(`${topic.stageNumber}-${topic.number}. ${topic.title} · 무한 연습`, `<p class="lesson-pick-note">단계를 고르면 컴퓨터가 그 단계 규칙으로 <b>매번 새 판</b>을 만들어요. 모든 판은 끝까지 계산해서 확인한 판이에요. 힌트 없이 한 번에 성공하면 연속 기록이 올라가요.</p><div class="lesson-drill-tiers">${rows}</div>`,
    [{ label: '닫기', action: () => {} }], 'course-drill-overlay');
}
function startCourseDrill(id, tier, seed) {
  const topic = courseTopic(id); if (!topic || !Number.isInteger(tier) || tier < 0 || tier > 4) return;
  if (!courseDrillOpen(topic)) return storeLockedDialog(topic.entitlement, `${topic.title} 무한 연습`);
  closeActivityDialog(false);
  const keep = state.activeKind === 'course' && state.course?.mode === 'drill' && state.course.topicId === id && state.course.tier === tier ? state.course.streak : 0;
  beginActivity('course', { id, mode: 'drill' }); courseToken++;
  state.course = courseFresh(topic, { mode: 'drill', tier, seed: seed >>> 0 || lessonDrillRandomSeed(), fen: null, phase: 'loading', streak: keep || 0, count: 0, recorded: false });
  courseChangedAt = Date.now(); showScreen('course'); renderCourse();
}
function courseDrillNext() {
  const { c } = courseContext(); if (c?.mode !== 'drill' || state.animating) return;
  cancelActivityCallbacks(); courseToken++;
  Object.assign(c, { seed: lessonDrillSeedNext(c.seed), fen: null, level: null, game: null, phase: 'loading', line: [], result: null, note: null, hintLevel: 0, fails: 0, recorded: false, selected: null, inspect: null, notice: null, progress: null });
  courseChangedAt = Date.now(); renderCourse();
}
function courseDrillResult(c, topic, result) {
  const t = c.tier, hinted = c.hintLevel > 0, first = c.fails === 0;
  if (result !== 'success') { c.streak = 0; return; }
  if (c.recorded) return; c.recorded = true;
  courseProgressSave(p => {
    const s = p.drill[topic.id] || { solved: [0, 0, 0, 0, 0], helped: [0, 0, 0, 0, 0], best: [0, 0, 0, 0, 0] };
    if (hinted) s.helped[t]++; else { if (first) c.streak = (c.streak || 0) + 1; s.solved[t]++; s.best[t] = Math.max(s.best[t], c.streak || 0); }
    p.drill[topic.id] = s;
  });
}
function courseJobMatches(job) { const c = state.course; return state.activeKind === 'course' && c?.phase === 'loading' && c.topicId === job.id && c.tier === job.ti && c.seed === job.seed; }
function coursePump() {
  const job = courseJob; if (!job) return;
  if (!job.background && !courseJobMatches(job)) { courseJob = null; return; }
  const level = job.step(COURSE_SLICE);
  if (!level && !job.failed) return void setTimeout(coursePump, job.background ? 30 : 0);
  courseJob = null;
  if (job.background) { if (level) courseReady = { id: job.id, ti: job.ti, seed: job.seed, level }; return; }
  coursePlace(job.seed, level);
}
function courseEnsure() {
  const { c, topic } = courseContext(); if (c?.phase !== 'loading') return;
  if (courseReady && courseReady.id === c.topicId && courseReady.ti === c.tier && courseReady.seed === c.seed) { const r = courseReady; courseReady = null; return coursePlace(r.seed, r.level); }
  if (courseJob && courseJob.id === c.topicId && courseJob.ti === c.tier && courseJob.seed === c.seed) { courseJob.background = false; return; }
  courseJob = cgDrillJob(topic.id, c.tier, c.seed); courseJob.background = false;
  setTimeout(coursePump, 0);
}
function coursePrefetch() {
  const c = state.course; if (c?.mode !== 'drill' || courseJob) return;
  const seed = lessonDrillSeedNext(c.seed);
  if (courseReady && courseReady.id === c.topicId && courseReady.ti === c.tier && courseReady.seed === seed) return;
  courseReady = null; courseJob = cgDrillJob(c.topicId, c.tier, seed); courseJob.background = true;
  setTimeout(coursePump, 80);
}
function coursePlace(seed, level) {
  const { c, topic } = courseContext(); if (c?.phase !== 'loading' || c.seed !== seed) return;
  // 드물게 조건에 맞는 판을 못 찾으면 그 단계의 교재 판 하나를 대신 쓴다(늘 검사를 통과한 판).
  const fen = level?.fen || topic.levels.filter(lv => lv.tier === c.tier + 1)[seed % 3].fen;
  c.fen = fen; c.level = cgLevelFromFen(topic.id, c.tier, fen) || { ...topic.levels.find(lv => lv.fen === fen) };
  c.line = []; c.phase = 'choose'; c.count = (c.count || 0) + 1; courseRevive(c);
  courseChangedAt = Date.now(); renderCourse(); coursePrefetch();
}

// ===== 승급 시험 =====
function courseTestDialog(stageId) {
  const stage = courseStage(stageId); if (!stage) return;
  if (!courseOwnsStage(stage.id)) return storeLockedDialog(stage.entitlement, `${stage.number}단계 승급 시험`);
  const s = courseStageSummary(stage.id), n = stage.id === 'stage2' ? 4 : 5;
  showActivityDialog(`${stage.number}단계 승급 시험`, `<p>${stage.title}의 네 주제에서 <b>처음 보는 판 ${n}개</b>가 나와요. 판마다 <b>한 번</b>씩 두고, 힌트는 없어요. <b>${n - 1}개 이상</b> 성공하면 통과예요.</p><p class="section-note">연습한 판 수와 상관없이 언제든 도전할 수 있어요. ${s.test ? `지난 결과: ${s.test.score}/${s.test.total}${s.test.passed ? ' · 통과' : ''}` : ''}</p>`,
    [{ label: '시험 시작', action: () => startCourseTest(stage.id) }, { label: '나중에', action: () => {} }], 'course-test-overlay');
}
function startCourseTest(stageId) {
  const stage = courseStage(stageId); if (!stage || !courseOwnsStage(stage.id)) return;
  const topics = courseStageTopics(stage.id), rand = () => lessonDrillRandomSeed();
  const items = topics.map(t => ({ topicId: t.id, tier: 2, seed: rand() }));
  if (stage.id !== 'stage2') { const t = topics[Math.floor(Math.random() * topics.length)]; items.push({ topicId: t.id, tier: 3, seed: rand() }); }
  beginActivity('course', { mode: 'test', stage: stage.id }); courseToken++;
  const first = items[0];
  state.course = courseFresh(courseTopic(first.topicId), { mode: 'test', tier: first.tier, seed: first.seed, fen: null, phase: 'loading', streak: 0, count: 0, recorded: false, test: { stage: stage.id, items, index: 0, results: [] } });
  courseChangedAt = Date.now(); showScreen('course'); renderCourse();
}
function courseTestNext() {
  const { c } = courseContext(); if (c?.mode !== 'test' || c.phase !== 'result' || state.animating) return;
  cancelActivityCallbacks(); courseToken++;
  const t = c.test, next = t.index + 1;
  if (next >= t.items.length) return courseTestFinish();
  const item = t.items[next]; t.index = next;
  Object.assign(c, { topicId: item.topicId, tier: item.tier, seed: item.seed, fen: null, level: null, game: null, phase: 'loading', line: [], result: null, note: null, hintLevel: 0, fails: 0, selected: null, inspect: null, notice: null, progress: null });
  courseChangedAt = Date.now(); renderCourse();
}
function courseTestFinish() {
  const { c } = courseContext(), t = c.test, score = t.results.filter(Boolean).length, total = t.items.length, passed = score >= total - 1;
  const stage = courseStage(t.stage);
  courseProgressSave(p => { const prev = p.tests[t.stage]; p.tests[t.stage] = { passed: passed || !!prev?.passed, score, total, at: Date.now(), best: Math.max(score, prev?.best ?? prev?.score ?? 0) }; });
  Object.assign(c, { phase: 'complete', line: [], result: null, note: null, game: null });
  if (passed) { spawnParticles(); workshopUnlockCheck?.(); }
  courseChangedAt = Date.now(); renderCourse();
  if (passed) setTimeout(() => { if (state.screen === 'course' && state.course?.phase === 'complete') courseCertificate(stage.id); }, 700);
}
function courseTestPrimary() { const t = state.course.test; if (courseCertificateReady(t.stage) && t.results.filter(Boolean).length >= t.items.length - 1) return courseCertificate(t.stage); startCourseTest(t.stage); }

// ===== 수료증 =====
function courseCertificate(stageId) {
  const stage = courseStage(stageId), p = courseProgress(), test = p.tests[stageId]; if (!stage || !test?.passed) return;
  const name = profileText(profileInfo().name), date = new Date(test.at).toLocaleDateString('ko-KR'), match = p.matches[stageId];
  const topics = courseStageTopics(stageId).map(t => `<li>${courseTopicDone(t) ? '✓' : '·'} ${t.title}</li>`).join('');
  showActivityDialog('🏅 수료증', `<div class="course-cert" id="course-cert"><p class="course-cert-kicker">어린이체스 승급 과정</p><h3>${stage.number}단계 · ${stage.title}</h3><p class="course-cert-name"><b>${name}</b></p><p>위 사람은 승급 시험을 ${test.best ?? test.score}/${test.total}로 통과했어요.</p><ul>${topics}</ul>${match ? '<p class="course-cert-ribbon">⚔️ 실전 승급전 승리</p>' : ''}<p class="course-cert-date">${date}</p><p class="course-cert-note">이 앱 안의 과정 수료 기록이에요. 공인 급수가 아니에요.</p></div>`,
    [{ label: '이미지로 저장', action: () => courseCertificateImage(stageId) }, { label: '닫기', action: () => {} }], 'course-cert-overlay');
}
function courseCertificateImage(stageId) {
  const stage = courseStage(stageId), p = courseProgress(), test = p.tests[stageId]; if (!stage || !test?.passed) return;
  const canvas = document.createElement('canvas'); if (!canvas.getContext) return;
  canvas.width = 1080; canvas.height = 1350; const g = canvas.getContext('2d');
  g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 1080, 1350);
  g.strokeStyle = '#c8962e'; g.lineWidth = 18; g.strokeRect(40, 40, 1000, 1270); g.lineWidth = 4; g.strokeRect(72, 72, 936, 1206);
  g.textAlign = 'center'; g.fillStyle = '#7a5a12'; g.font = '700 40px "Noto Sans KR", sans-serif'; g.fillText('어린이체스 승급 과정', 540, 190);
  g.fillStyle = '#223548'; g.font = '900 72px "Noto Sans KR", sans-serif'; g.fillText('수료증', 540, 300);
  g.font = '900 54px "Noto Sans KR", sans-serif'; g.fillText(`${stage.number}단계 · ${stage.title}`, 540, 420);
  g.font = '900 84px "Noto Sans KR", sans-serif'; g.fillText(profileInfo().name, 540, 580);
  g.font = '500 40px "Noto Sans KR", sans-serif'; g.fillText(`승급 시험 ${test.best ?? test.score}/${test.total} 통과`, 540, 680);
  courseStageTopics(stageId).forEach((t, i) => g.fillText(`${courseTopicDone(t) ? '✓' : '·'} ${t.title}`, 540, 780 + i * 60));
  if (p.matches[stageId]) { g.fillStyle = '#b5401f'; g.font = '900 44px "Noto Sans KR", sans-serif'; g.fillText('⚔️ 실전 승급전 승리', 540, 1060); }
  g.fillStyle = '#4d6273'; g.font = '500 36px "Noto Sans KR", sans-serif'; g.fillText(new Date(test.at).toLocaleDateString('ko-KR'), 540, 1150);
  g.font = '500 26px "Noto Sans KR", sans-serif'; g.fillText('이 앱 안의 과정 수료 기록이며 공인 급수가 아니에요.', 540, 1230);
  canvas.toBlob?.(blob => { if (!blob) return; const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `chess-certificate-stage${stage.number}.png`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }, 'image/png');
}

// ===== 실전 승급전: 표준 체스로 컴퓨터 한 판 =====
function courseMatchDialog(stageId) {
  const stage = courseStage(stageId); if (!stage) return;
  if (!courseOwnsStage(stage.id)) return storeLockedDialog(stage.entitlement, `${stage.number}단계 실전 승급전`);
  const won = courseProgress().matches[stage.id];
  showActivityDialog(`⚔️ ${stage.number}단계 실전 승급전`, `<p>처음 배치에서 <b>컴퓨터 ${playLevelLabel(stage.matchLevel)}</b>와 표준 체스로 한 판 두어요. 이기면 수료증에 <b>실전 승리</b>가 새겨져요.</p><p class="section-note">${won ? '이미 이겼어요! 다시 도전해도 기록은 그대로예요.' : '져도 괜찮아요. 몇 번이든 다시 도전할 수 있어요.'} 되돌리기와 도움은 평소 대전처럼 쓸 수 있어요.</p>`,
    [{ label: '대전 시작', action: () => startCourseMatch(stage.id) }, { label: '나중에', action: () => {} }], 'course-match-overlay');
}
function startCourseMatch(stageId) {
  const stage = courseStage(stageId); if (!stage || !courseOwnsStage(stage.id)) return;
  requestContentActivity('courseMatch', () => playStart({ ...getPlaySettings(), mode: 'ai', small: false, preset: null, level: stage.matchLevel, content: { version: 1, type: 'courseMatch', stage: stage.id } }));
}
function courseMatchValid(c) { return !!courseStage(c.stage); }
function courseMatchAfterMove(mover) {
  const c = state.play?.content; if (c?.type !== 'courseMatch' || mover !== 'w' || state.game.status !== 'checkmate') return;
  courseProgressSave(p => { if (!p.matches[c.stage]) p.matches[c.stage] = Date.now(); });
}
function courseMatchPanel() {
  const c = state.play.content, stage = courseStage(c.stage), won = state.game.status === 'checkmate' && state.game.turn === 'b';
  return `<div class="content-context"><strong>⚔️ 실전 승급전 · ${stage.number}단계</strong><span>${playIsOver() ? (won ? '승리! 수료증에 실전 승리가 새겨졌어요.' : '이번에는 아쉬워요. 다시 도전할 수 있어요.') : `컴퓨터 ${playLevelLabel(stage.matchLevel)}를 이기면 수료증에 실전 승리가 새겨져요.`}</span><button class="play-chip" onclick="goCourse()">승급 과정으로</button></div>`;
}

// ===== 화면 =====
const COURSE_NOTICE_TEXT = { ...LESSON_NOTICE_TEXT, hintLocked: `🔒 힌트는 이 판을 ${COURSE_HINT_UNLOCK}번 해본 뒤에 열려요. 상대 말을 누르면 갈 수 있는 칸이 보여요.` };
function coursePieceName(p) { return lessonPieceName(p); }
// 상대 응수 한 줄 설명: 킹이 피함 / 잡음 / 막음
function courseReplyText(board, reply) {
  const mover = board[reply[0]][reply[1]], cap = board[reply[2]][reply[3]], sq = lessonSquareName([reply[2], reply[3]]);
  if (!mover) return '';
  if (cap) return `상대 ${lessonJosa(coursePieceName(mover), '이/가')} 내 ${lessonJosa(coursePieceName(cap), '을/를')} 잡았어요`;
  if (mover[1] === 'K') return `상대 킹이 ${lessonSqJosa(sq)} 피했어요`;
  return `상대 ${lessonJosa(coursePieceName(mover), '이/가')} ${lessonSqJosa(sq)} 움직였어요`;
}
function courseBoards(c) {
  // 마지막 내 수 직전 판(설명에 쓰는 원래 칸 정보)과 응수 직전 판
  const { topic, level } = courseContext(), line = c.line, r = courseReplay(topic, level, line); if (!r?.last) return null;
  const before = courseReplay(topic, level, line.slice(0, line.length - (r.last.out.reply ? 2 : 1)));
  const mid = before.game.board.map(row => row.slice()); const mv = r.last.move, piece = mid[mv[0]][mv[1]];
  const afterMove = lrApply(mid, mv); if (piece?.[1] === 'K' && Math.abs(mv[3] - mv[1]) === 2) { const rf = mv[3] === 6 ? 7 : 0, rt = mv[3] === 6 ? 5 : 3; afterMove[mv[0]][rt] = afterMove[mv[0]][rf]; afterMove[mv[0]][rf] = null; }
  return { before: mid, afterMove, out: r.last.out, move: mv, steps: r.step };
}
function courseExplain(c, topic, level) {
  const info = courseBoards(c); if (!info) return '';
  const { before, afterMove, out, move } = info, mover = coursePieceName(before[move[0]][move[1]]), captured = before[move[2]][move[3]];
  const reply = out.reply ? courseReplyText(afterMove, out.reply) + '.' : '';
  const stalemate = '상대가 둘 수 있는 수가 없는데 체크가 아니라서 비겼어요(스테일메이트).';
  if (out.note === 'stalemate') return stalemate;
  if (topic.mode === 'mate2') {
    if (out.result === 'success') return info.steps >= 2 ? '체크메이트! 두 수 만에 이겼어요.' : '체크메이트!';
    if (out.note === 'escape' && info.steps === 1) return `${reply} 이제 한 수 메이트가 없어요. 상대가 어떻게 응수해도 메이트가 남는 첫 수를 찾아요.`;
    return `${reply ? reply + ' ' : ''}${out.note === 'noCheck' ? '체크가 아니라서 메이트가 아니에요.' : '메이트가 아니에요.'} 다음 수는 상대 킹이 피할 곳이 없는 체크여야 해요.`;
  }
  if (topic.mode === 'win2') {
    if (out.result === 'success') return out.note === 'mate' ? '체크메이트!' : `${captured ? lessonJosa(coursePieceName(captured), '을/를') + ' 얻었어요! ' : ''}두 수 계획으로 이득을 봤어요.`;
    if (info.steps === 1) return `${reply} ${out.note === 'lost' ? '이득보다 잃는 게 많아요.' : '두 번째 수에 이득 볼 말이 없어요.'} 상대가 무엇을 해도 이득이 남는 첫 수를 찾아요.`;
    return out.note === 'recaptured' ? `${lessonJosa(coursePieceName(captured), '을/를')} 잡았지만 ${reply} 이득이 모자라요.` : '이 수로는 말을 얻지 못했어요. 이제 지켜지지 않은 상대 말을 찾아요.';
  }
  if (courseMulti(topic)) {
    if (out.result === 'success') return out.note === 'promoted' ? `폰이 퀸이 됐어요! ${info.steps}수 만이에요. 이제 퀸으로 이길 수 있어요.` : `체크메이트! ${info.steps}수 만에 끝냈어요.`;
    if (out.note === 'limit') return `제한 ${level.limit}수 안에 끝내지 못했어요. 상대 킹이 갈 수 있는 상자를 더 빨리 줄여요.`;
    if (out.note === 'drawn') return `${reply} 이제 상대 킹이 폰을 막을 수 있어서 비기는 판이 됐어요. 킹을 폰 앞으로!`;
    if (out.note === 'lost') return `${reply} 상대 킹 옆에 둔 말은 내 킹이 지켜 줘야 해요.`;
    return reply;
  }
  // 초반
  const goalText = { queenEarly: '퀸이 너무 일찍 나왔어요. 상대 말에게 쫓기기 쉬워요.', edgePawn: '가장자리 폰은 가운데를 차지하지 못해요.', notCenter: '가운데 네 칸을 차지하거나 노리지 않는 수예요.', kingWalk: '킹이 걸어가면 캐슬링을 할 수 없게 돼요.', notCastle: '이번에는 캐슬링을 해요. 킹을 룩 쪽으로 두 칸!', notDevelop: '아직 집에 있는 나이트나 비숍을 꺼내요.', rimKnight: '가장자리 나이트는 갈 수 있는 칸이 적어요. 가운데 쪽으로!' };
  if (out.result === 'goal') return goalText[out.note] || '목표와 다른 수예요.';
  if (out.result === 'fail') return out.note === 'mated' ? `${reply} 체크메이트예요! 상대가 노리는 칸을 먼저 막아요.` : `${reply} 말을 잃지 않는 칸을 골라요.`;
  return { center: `내 ${lessonJosa(mover, '이/가')} 가운데를 차지했어요. 다음에 말들이 나올 길도 열려요.`, develop: `${lessonJosa(mover, '이/가')} 집에서 나왔어요. 다른 말도 차례로 꺼내요.`, castle: '캐슬링! 킹은 구석으로, 룩은 가운데로 왔어요.', trap: '위협을 막았어요! 이제 상대는 체크메이트할 수 없어요.' }[topic.topic];
}
// 진행 중(여러 수) 설명: 끝내기 거리, 두 수 문제의 다음 할 일
function courseProgressText(c, topic, level) {
  if (!c.line.length) return '';
  const info = courseBoards(c); if (!info) return '';
  const reply = info.out.reply ? courseReplyText(info.afterMove, info.out.reply) + '.' : '';
  if (topic.mode === 'mate2') return `좋은 첫 수! ${reply} 👉 이제 체크메이트할 수 있어요.`;
  if (topic.mode === 'win2') return `좋아요! ${reply} 👉 이제 이득 보는 잡기를 찾아요.`;
  const left = (level.limit || 0) - info.steps;
  if (topic.mode === 'endgame' && c.progress?.before >= 0) {
    const best = c.progress.after === c.progress.before - 1, now = crMovesLeft(c.progress.now ?? crDistance(c.game.board, 'w'));
    return `${best ? '👍 가장 빠른 길이에요!' : '괜찮아요. 더 빨리 몰아붙이는 수도 있었어요.'} ${reply} ${topic.piece === 'P' ? '승격' : '메이트'}까지 최소 ${now}수 · 남은 수 ${left}`;
  }
  return `${reply} 남은 수 ${left}`;
}
function courseKeySquares(b) {
  const e = crEndgameOf(b); if (!e || e.type !== 'P') return [];
  const r = e.x >> 3, c = e.x & 7, rows = r >= 4 ? [r - 2] : [r - 1, r - 2], out = [];
  for (const row of rows) for (const dc of [-1, 0, 1]) { const col = c + dc; if (row >= 0 && col >= 0 && col < 8) out.push([row, col]); }
  return out;
}
function courseHintInfo(topic, level, game) {
  const b = game.board, marks = { attackers: [], targets: [], arrows: [], tags: [], guarded: [], flight: [], focus: [], box: [], keys: [] };
  const kingFlight = () => { const k = lrKing(b, 'b'); return lrMoves(b, 'b').filter(m => m[0] === k[0] && m[1] === k[1]).map(m => [m[2], m[3]]); };
  if (topic.mode === 'mate2') { marks.flight = kingFlight(); marks.targets = [lrKing(b, 'b')]; return { marks, text: topic.id === 'm2-quiet' ? '💡 동그라미: 상대 킹이 갈 수 있는 칸이에요. 체크하지 말고, 이 칸들을 먼저 막는 수를 생각해요.' : topic.id === 'm2-sac' ? '💡 동그라미: 상대 킹이 갈 수 있는 칸이에요. 내 말을 내주면 상대 말이 어디로 끌려올까요?' : '💡 동그라미: 상대 킹이 갈 수 있는 칸이에요. 두 번의 체크로 이 칸을 모두 막아요.' }; }
  if (topic.mode === 'win2') {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; if (p?.[0] === 'b' && p[1] !== 'K' && lrAttacked(b, r, c, 'w') && lrAttacked(b, r, c, 'b')) { marks.targets.push([r, c]); for (const d of lrAttackers(b, r, c, 'b')) marks.arrows.push([d[0], d[1], r, c]); } }
    marks.attackers = marks.arrows.map(a => [a[0], a[1]]);
    return { marks, text: '💡 테두리: 내가 노리지만 지켜진 상대 말, 빨간 화살표: 그 말을 지키는 상대 말이에요. 지키는 말을 흔들어요.' };
  }
  if (topic.mode === 'endgame' && topic.piece === 'P') { marks.keys = courseKeySquares(b); return { marks, text: '💡 별 칸(열쇠 칸): 내 킹이 이 칸 가운데 하나에 서면 폰이 퀸이 될 수 있어요. 폰 혼자 달려도 상대 킹이 못 따라오면 그냥 달려요.' }; }
  if (courseMulti(topic)) { marks.box = crBoxSquares(b); return { marks, text: `💡 색칠한 칸: 상대 킹이 갈 수 있는 상자예요(${marks.box.length}칸). 내 말이 잡히지 않게 하면서 상자를 줄여요.` }; }
  if (topic.topic === 'center') { marks.focus = CR_CENTER.slice(); return { marks, text: '💡 파란 테두리: 가운데 네 칸이에요. 폰이나 나이트로 이 칸을 차지하거나 노려요.' }; }
  if (topic.topic === 'develop') { marks.focus = crUndeveloped(b).map(([r, c]) => [r, c]); return { marks, text: '💡 파란 테두리: 아직 집에 있는 작은 말이에요. 잡히지 않는 칸으로 꺼내요.' }; }
  if (topic.topic === 'castle') { const k = lrKing(b, 'w'); marks.focus = [k, ...[[7, 0], [7, 7]].filter(([r, c]) => b[r][c] === 'wR')]; return { marks, text: '💡 킹을 룩 쪽으로 두 칸 옮기면 캐슬링이에요. 킹을 먼저 눌러요.' }; }
  const t = lrMateThreats(b); marks.arrows = t.map(m => m.slice(0, 4)); marks.attackers = t.map(m => [m[0], m[1]]);
  return { marks, text: '💡 빨간 화살표: 상대가 다음 수에 노리는 체크메이트예요. 이 길을 막거나 그 칸을 지켜요.' };
}
function courseView() {
  const { c, topic, level } = courseContext(), game = c.game, marks = {};
  if (c.phase === 'choose') {
    if (!c.inspect && (c.hintLevel >= 1 || (level.showHint && c.mode === 'level' && !c.line.length))) Object.assign(marks, courseHintInfo(topic, level, game).marks);
    if (c.inspect) { marks.attackers = [c.inspect]; marks.reach = lessonReach(game, c.inspect); }
    if (c.selected) { const moves = lessonMovesFrom(game, c.selected); marks.selected = c.selected; marks.moves = moves.map(m => [m[2], m[3]]); marks.captureMoves = moves.filter(m => game.board[m[2]][m[3]]).map(m => [m[2], m[3]]); }
    if (c.line.length >= 2) { const r = c.line.at(-1); marks.arrows = [...(marks.arrows || []), r]; }
  } else if (c.phase === 'result') {
    const last = c.line.at(-1), info = c.line.length ? courseBoards(c) : null;
    if (c.result === 'success') { const k = lrKing(game.board, 'b'); marks.safe = [[c.line.at(-1)[2], c.line.at(-1)[3]]]; if (info?.out.note === 'mate') { marks.danger = [k]; marks.tag = [k[0], k[1], '체크메이트']; } }
    else if (info?.out.reply) { marks.arrows = [last]; marks.focus = [[last[2], last[3]]]; }
    else if (info?.out.note === 'stalemate') { const k = lrKing(game.board, 'b'); marks.focus = [k]; marks.tag = [k[0], k[1], '비김']; }
  }
  return { game, marks };
}
function courseBoardHTML(view, click = 'courseClick') {
  const { game, marks } = view, has = (list, r, c) => (list || []).some(p => p[0] === r && p[1] === c), last = game.lastMove;
  let cells = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const piece = game.board[r][c], notes = [];
    let cls = 'board-cell ' + ((r + c) % 2 ? 'dark' : 'light');
    if (piece) { cls += ' pc-' + piece[0]; notes.push(piece[0] === 'w' ? '내 말' : '상대 말'); }
    if (last && ((last[0] === r && last[1] === c) || (last[2] === r && last[3] === c))) cls += ' last-move';
    if (marks.selected && lessonSameSquare(marks.selected, [r, c])) cls += ' selected';
    if (has(marks.moves, r, c)) cls += has(marks.captureMoves, r, c) ? ' move-hint lesson-capture-hint' : ' move-hint';
    if (has(marks.attackers, r, c)) { cls += ' lesson-attacker'; notes.push('상대 말'); }
    if (has(marks.targets, r, c)) { cls += ' lesson-target'; notes.push(piece?.[0] === 'b' ? '노릴 만한 상대 말' : '노려지는 말'); }
    if (has(marks.focus, r, c)) { cls += ' lesson-focus'; notes.push('살펴볼 칸'); }
    if (has(marks.reach, r, c)) { cls += ' lesson-reach'; notes.push('상대 말이 갈 수 있는 칸'); }
    if (has(marks.flight, r, c)) { cls += ' lesson-flight'; notes.push('상대 킹이 갈 수 있는 칸'); }
    if (has(marks.box, r, c)) { cls += ' course-box'; notes.push('상대 킹의 상자'); }
    if (has(marks.keys, r, c)) { cls += ' course-key'; notes.push('열쇠 칸'); }
    if (has(marks.danger, r, c)) { cls += ' danger-cell'; notes.push('체크메이트'); }
    if (has(marks.safe, r, c)) { cls += ' lesson-safe'; notes.push('내가 둔 칸'); }
    const owner = piece ? `<span class="lesson-owner ${piece[0] === 'w' ? 'mine' : 'theirs'}" aria-hidden="true">${piece[0] === 'w' ? '나' : '상대'}</span>` : '';
    const tags = (marks.tag ? [marks.tag] : []).filter(t => t[0] === r && t[1] === c);
    if (tags.length) notes.push(tags.map(t => t[2]).join(' '));
    cells += `<div class="${cls}" onclick="${click}(${r},${c})"${notes.length ? ` data-note="${notes.join(', ')}"` : ''}>${piece ? getPieceSVG(piece) : ''}${owner}${tags.map(t => `<span class="lesson-cell-tag" aria-hidden="true">${t[2]}</span>`).join('')}</div>`;
  }
  return `<div class="chess-board lesson-board course-board${view.boardTone ? ' lesson-board-' + view.boardTone : ''}">${cells}${lessonArrowSVG((marks.arrows || []).map(a => [a, 'attack']))}</div>`;
}
function coursePrimaryLabel(c, topic) {
  if (c.phase === 'complete') { if (c.mode === 'test') { const t = c.test, pass = t.results.filter(Boolean).length >= t.items.length - 1; return pass ? '🏅 수료증 보기' : '↺ 다시 도전'; } const list = courseStageTopics(topic.stage); return list[list.indexOf(topic) + 1] ? '다음 주제 ▶' : '📝 승급 시험'; }
  if (c.mode === 'test') return c.test.index < c.test.items.length - 1 ? '다음 문제 ▶' : '시험 결과 ▶';
  if (c.phase === 'result' && c.result !== 'success') return courseMulti(topic) ? '↺ 처음부터' : '↶ 다시 해보기';
  if (c.mode === 'drill') return '새 판 ▶';
  if (c.levelIndex < topic.levels.length - 1) return '다음 판 ▶';
  return c.solved.every(Boolean) ? '주제 마치기 ▶' : '남은 판 하기 ▶';
}
function courseSecondaryLabel(c, topic, level) {
  if (c.phase === 'complete') return c.mode === 'test' ? '← 과정으로' : '📝 승급 시험';
  if (c.mode === 'test') return c.phase === 'result' ? (c.result === 'success' ? '✓ 성공' : '✗ 실패') : '시험 중 · 힌트 없음';
  if (c.phase === 'result' && c.result === 'success') return '↻ 한 번 더';
  if (c.phase === 'result' && courseMulti(topic)) return '↶ 한 수 전으로';
  if (c.mode === 'drill') return c.phase === 'result' ? '💡 힌트 보고 다시' : c.hintLevel ? '⏭ 다른 판' : '💡 힌트';
  const ready = courseHintFree(c, topic, level), left = `🔒 힌트 ${Math.min(c.fails || 0, COURSE_HINT_UNLOCK)}/${COURSE_HINT_UNLOCK}`;
  if (c.phase === 'result') return ready ? '💡 힌트 보고 다시' : left;
  return c.hintLevel || (level?.showHint && !c.line.length) ? '💡 힌트 보는 중' : ready ? '💡 힌트' : left;
}
function courseButtons(c, topic, level) {
  const busy = state.animating || c.phase === 'response' || c.phase === 'loading';
  const left = courseSecondaryLabel(c, topic, level);
  const leftOff = busy || (c.mode === 'test' && c.phase !== 'complete') || c.phase === 'choose' && (c.hintLevel > 0 && c.mode !== 'drill' || level?.showHint && c.mode === 'level' && !c.line.length && !courseMulti(topic)) || c.phase === 'result' && c.result !== 'success' && !courseMulti(topic) && !courseHintFree(c, topic, level);
  const rightReady = (c.phase === 'result' || c.phase === 'complete') && !busy;
  return `<div class="lesson-actions"><button class="action-btn secondary" onclick="courseSecondary()" ${leftOff ? 'disabled' : ''}>${left}</button><button class="action-btn green${rightReady ? ' lesson-next' : ''}" onclick="coursePrimary()" ${rightReady ? '' : 'disabled'}>${coursePrimaryLabel(c, topic)}</button></div>`;
}
function courseStatusHTML(c, topic, level) {
  const side = `<span class="lesson-side">${getPieceSVG('wK', 18)}<span>나 = 흰색</span></span>`;
  if (c.mode === 'test') { const t = c.test; return `<div class="lesson-statusbar"><span class="lesson-progress"><b>📝 시험 ${t.index + 1}/${t.items.length} · 성공 ${t.results.filter(Boolean).length}</b></span>${side}</div>`; }
  if (c.mode === 'drill') return `<div class="lesson-statusbar"><span class="lesson-progress lesson-drill-progress"><b>∞ ${CG_TIER_NAMES[c.tier]} · 연속 ${c.streak || 0}</b><span class="lesson-seed" aria-label="판 번호 ${lgSeedCode(c.seed)}">판 #${lgSeedCode(c.seed)}</span></span>${side}</div>`;
  const total = topic.levels.length, cleared = c.solved.filter(Boolean).length, tier = CG_TIER_NAMES[topic.levels[c.levelIndex].tier - 1];
  const label = c.phase === 'complete' ? `${total}판 모두 성공` : `판 ${c.levelIndex + 1}/${total} · ${tier}`;
  return `<div class="lesson-statusbar"><span class="lesson-progress"><b>${label}</b><span class="lesson-bar" role="progressbar" aria-label="클리어한 판" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${cleared}"><i style="width:${Math.round(cleared / total * 100)}%"></i></span></span>${side}</div>`;
}
function courseHeadline(c, topic, level) {
  if (c.phase === 'loading') return { tone: '', html: c.mode === 'test' ? '📝 시험 문제 준비 중' : '🎲 새 판 준비 중' };
  if (c.phase === 'complete') {
    if (c.mode === 'test') { const t = c.test, n = t.results.filter(Boolean).length, pass = n >= t.items.length - 1; return { tone: pass ? 'ok' : 'no', html: pass ? `🏅 통과! <small>${n}/${t.items.length}</small>` : `다시 도전해요 <small>${n}/${t.items.length}</small>` }; }
    return { tone: 'ok', html: `🏆 ${topic.levels.length}판 모두 성공!` };
  }
  if (c.phase === 'result' && c.result === 'success') return { tone: 'ok', html: c.mode === 'level' ? `🎉 판 ${c.levelIndex + 1} 성공!${c.hintLevel ? ' 💡' : ''} <small>${c.solved.filter(Boolean).length}/${topic.levels.length} 클리어</small>` : `🎉 성공!${c.mode === 'drill' ? ` <small>${c.hintLevel ? '💡 힌트 사용' : c.fails ? '다시 해서 성공' : `연속 ${c.streak}`}</small>` : ''}` };
  if (c.phase === 'result' && c.result === 'fail') return { tone: 'no', html: c.note === 'stalemate' ? '✗ 비겼어요!' : c.note === 'limit' ? '✗ 제한 수를 넘었어요' : c.note === 'mated' ? '✗ 체크메이트를 당했어요!' : '✗ 아직이에요! 다시 해봐요' };
  if (c.phase === 'result') return { tone: 'no', html: '✗ 목표와 다른 수예요' };
  const limit = courseMulti(topic) ? ` <small>제한 ${level.limit}수</small>` : '';
  return { tone: '', html: `🎯 ${level.goal}${limit}` };
}
function courseFeedback(c, topic, level) {
  const next = lessonKey(coursePrimaryLabel(c, topic));
  if (c.phase === 'loading') return { tone: 'dim', html: '컴퓨터가 판을 만들고 끝까지 확인하고 있어요…' };
  if (c.phase === 'complete') {
    if (c.mode === 'test') { const t = c.test, pass = t.results.filter(Boolean).length >= t.items.length - 1; return { tone: pass ? 'success' : 'warn', html: pass ? `수료증을 받았어요! 수료증에는 이름과 날짜가 들어가요. 👉 ${next}` : `${t.items.length - 1}개 이상 성공하면 통과예요. 주제 연습을 조금 더 하고 다시 도전해요. 👉 ${next}` }; }
    return { tone: 'success', html: `🎉 주제를 마쳤어요! ${topic.learned} 👉 ${next}` };
  }
  if (c.phase === 'response') return { tone: 'dim', html: '상대(검은색) 차례예요…' };
  if (c.phase === 'result') { const text = courseExplain(c, topic, level); return { tone: c.result === 'success' ? 'success' : 'fail', html: `${c.result === 'success' ? '✓' : '✗'} ${text}${c.result === 'success' && c.hintLevel && c.mode === 'level' ? ' 힌트 없이 다시 풀면 ✓가 돼요.' : ''} 👉 ${next}` }; }
  if (c.inspect) { const name = lessonPieceName(c.game.board[c.inspect[0]][c.inspect[1]]); return { tone: 'help', html: `상대 ${lessonJosa(name, '은/는')} 빨간 점 칸으로 갈 수 있어요.` }; }
  if (c.notice) return { tone: 'warn', html: COURSE_NOTICE_TEXT[c.notice] };
  if (c.line.length) return { tone: 'help', html: courseProgressText(c, topic, level) };
  if (c.hintLevel >= 1 || level.showHint && c.mode === 'level') return { tone: 'help', html: courseHintInfo(topic, level, c.game).text };
  if (c.selected) return { tone: '', html: '👉 점이 찍힌 칸을 눌러 옮겨요. 상대 말을 누르면 갈 수 있는 칸이 보여요.' };
  return { tone: '', html: `👉 옮길 내 말(흰색)을 눌러요.${c.mode === 'test' ? ' 시험은 판마다 한 번씩이에요.' : ''}` };
}
function renderCourse() {
  const { c, topic, level } = courseContext(); if (!c || !topic) return goCourse();
  const back = c.mode === 'test' ? `<button class="back-btn" onclick="courseLeaveTest()">← 과정</button>` : `<button class="back-btn" onclick="goCourse()">← 과정</button>`;
  const tool = c.mode === 'level' ? `<button class="lesson-pick-btn" onclick="coursePicker()">☰ 판 고르기</button>` : c.mode === 'drill' ? `<button class="lesson-pick-btn" onclick="courseDrillDialog('${topic.id}')">단계 바꾸기</button>` : '';
  const title = c.mode === 'test' ? `${courseStage(c.test.stage).number}단계 승급 시험` : `${topic.stageNumber}-${topic.number}. ${topic.title}${c.mode === 'drill' ? ' · ∞' : ''}`;
  const header = `<div class="screen-header lesson-header">${back}<h2>${title}</h2>${tool}</div>`;
  if (c.phase === 'loading' || c.phase === 'complete' || !level || !c.game) {
    if (c.phase !== 'complete' && c.phase !== 'loading') { c.phase = 'loading'; c.fen = null; }
    const headline = courseHeadline(c, topic, level), feedback = courseFeedback(c, topic, level);
    renderGameScreen('screen-course', `<div class="screen-wrap lesson-screen course-screen">${header}${courseStatusHTML(c, topic, level)}<div class="status-msg lesson-message"><p class="lesson-goal${headline.tone ? ' lesson-goal-' + headline.tone : ''}">${headline.html}</p><p class="lesson-feedback ${feedback.tone}">${feedback.html}</p></div>${c.phase === 'complete' ? courseCompleteBoard(c, topic) : lessonLoadingBoardHTML()}${courseButtons(c, topic, level)}</div>`);
    saveActiveSession(); if (c.phase === 'loading') courseEnsure(); return;
  }
  const view = courseView(), headline = courseHeadline(c, topic, level), feedback = courseFeedback(c, topic, level);
  view.boardTone = headline.tone;
  renderGameScreen('screen-course', `<div class="screen-wrap lesson-screen course-screen">${header}${courseStatusHTML(c, topic, level)}<div class="status-msg lesson-message"><p class="lesson-goal${headline.tone ? ' lesson-goal-' + headline.tone : ''}">${headline.html}</p><p class="lesson-feedback ${feedback.tone}">${feedback.html}</p></div>${courseBoardHTML(view)}${courseButtons(c, topic, level)}</div>`);
  saveActiveSession();
}
// 주제 완료·시험 결과 화면의 판 자리: 같은 크기의 판 위에 결과 요약
function courseCompleteBoard(c, topic) {
  let cells = ''; for (let r = 0; r < 8; r++) for (let col = 0; col < 8; col++) cells += `<div class="board-cell ${(r + col) % 2 ? 'dark' : 'light'}"></div>`;
  const body = c.mode === 'test' ? c.test.items.map((it, i) => `<li>${c.test.results[i] ? '✓' : '✗'} ${courseTopic(it.topicId).title}</li>`).join('') : courseStageTopics(topic.stage).map(t => `<li>${courseTopicDone(t) ? '✓' : '·'} ${t.title}</li>`).join('');
  return `<div class="chess-board lesson-board course-board course-summary-board">${cells}<div class="course-summary"><ul>${body}</ul></div></div>`;
}
function courseLeaveTest() {
  const c = state.course; if (c?.mode !== 'test' || c.phase === 'complete') return goCourse();
  showChoice('시험을 그만두면 이번 시험 결과는 남지 않아요. 나중에 처음부터 다시 볼 수 있어요.', [{ label: '시험 계속하기', action: () => {} }, { label: '그만두기', action: () => { state.activeKind = null; const s = readData('sessions', {}); delete s.course; writeData('sessions', s); goCourse(); } }]);
}
