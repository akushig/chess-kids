// 승급 과정 (docs/PREMIUM_COURSE.md). 판정은 끝까지 계산한 결과로 확인하고, 흐름은 실제 입력 함수(courseClick 등)로만 진행한다.
const test = require('node:test'), assert = require('node:assert/strict'), harness = require('./harness.cjs'), fastLoad = require('../scripts/fast-load.cjs');
const ENGINE = ['js/course-rules.js', 'js/course-gen.js', 'js/course-levels.js'];
const J = (run, expr) => JSON.parse(run(`JSON.stringify(${expr})`));
const flush = timers => { for (let n = 0; timers.length && n < 400; n++) timers.splice(0).forEach(cb => cb()); };
const load = initial => { const h = harness(initial); h.run('const __cp=coursePrimary;coursePrimary=()=>{courseChangedAt=0;return __cp();};'); return h; };
const click = (h, m) => { h.run(`courseClick(${m[0]},${m[1]});courseClick(${m[2]},${m[3]})`); flush(h.timers); };
// 지금 판에서 성공으로 이어지는 수(예시 풀이). 판정기와 같은 계산을 쓴다.
const SOLVE = `(()=>{const {c,topic,level}=courseContext(),b=c.game.board,step=courseReplay(topic,level,c.line).step;
  if(topic.mode==='mate2')return step===0?level.witness||crMate2Analyze(b).keyMoves[0]:crMatesIn1(b)[0];
  if(topic.mode==='win2'){if(step===0)return level.witness||lrMoves(b,'w').find(m=>lrGain(b,m).gain>=2);return lrMoves(b,'w').find(m=>crWin2Second(b,m,c.banked||0).result==='success');}
  if(topic.mode==='endgame')return crEndgameBest(b);
  if(topic.mode==='ladder')return crLadderBest(b);
  return level.witness;})()`;
function solveCurrent(h, maxSteps = 40) {
  for (let i = 0; i < maxSteps && h.run('state.course.phase') === 'choose'; i++) click(h, J(h.run, SOLVE));
  return h.run('state.course.result');
}

test('교재: 3단계 × 4주제 × 15판 = 180판, 판 ID가 겹치지 않고 단계마다 첫걸음~도전 3판씩', () => {
  const { run } = load();
  const topics = J(run, 'COURSE_TOPICS.map(t=>({id:t.id,stage:t.stage,free:!!t.free,levels:t.levels.map(l=>({id:l.id,tier:l.tier}))}))');
  assert.equal(topics.length, 12);
  assert.deepEqual([...new Set(topics.map(t => t.stage))], ['stage1', 'stage2', 'stage3']);
  assert.equal(topics.filter(t => t.free).length, 3, '단계마다 첫 주제는 무료');
  for (const t of topics) {
    assert.equal(t.levels.length, 15, t.id);
    assert.deepEqual(t.levels.map(l => l.tier), [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5], t.id);
  }
  const ids = topics.flatMap(t => t.levels.map(l => t.id + '/' + l.id)); assert.equal(new Set(ids).size, 180);
});

test('끝내기 계산표: 퀸 메이트 최대 10수·룩 메이트 최대 16수, 폰 끝내기의 알려진 승·무', () => {
  const A = fastLoad(ENGINE), { run } = A;
  const maxWhite = k => run(`(()=>{const a=crTable('${k}');let m=0;for(let i=0;i<a.length;i+=2)if(a[i]>m)m=a[i];return m;})()`);
  assert.equal(maxWhite('Q'), 19); assert.equal(maxWhite('R'), 31);
  const d = (fen, turn) => run(`crDistance(boardFromFEN('${fen}'),'${turn}')`);
  assert.ok(d('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', 'w') > 0 && d('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', 'b') > 0, '6랭크의 킹이 폰 앞: 누가 두어도 승');
  assert.equal(d('8/4k3/8/4K3/4P3/8/8/8 w - - 0 1', 'w'), -1, '대치(백 차례): 비김');
  assert.ok(d('8/4k3/8/4K3/4P3/8/8/8 w - - 0 1', 'b') > 0, '대치(흑 차례): 승');
  assert.equal(d('k7/8/K7/P7/8/8/8/8 w - - 0 1', 'w'), -1, '가장자리 폰: 비김');
  // 표의 가장 좋은 수를 계속 두면 표가 말한 수만큼에 메이트(상대는 가장 오래 버티는 수)
  for (const fen of ['8/8/8/3k4/8/8/8/K5Q1 w - - 0 1', '8/8/3k4/8/8/8/8/R3K3 w - - 0 1']) {
    let b = run(`boardFromFEN('${fen}')`), n = 0; const plies = run(`crDistance(boardFromFEN('${fen}'),'w')`);
    A.run(`globalThis.__b=${JSON.stringify(b)}`);
    for (; n < 40; n++) {
      const st = run(`(()=>{const k=crEndgameOf(__b).type,m=crEndgameBest(__b),o=crEndgameStep(k,__b,m);if(o.result==='continue')__b=lrApply(lrApply(__b,m),o.reply);return o.result;})()`);
      if (st === 'success') break; assert.equal(st, 'continue');
    }
    assert.equal(n + 1, Math.ceil(plies / 2), fen);
  }
});

test('180판 모두 생성 규칙(단계 조건)을 다시 통과하고, 예시 풀이로 제한 수 안에 끝까지 풀린다', () => {
  const A = fastLoad(ENGINE.concat(['js/course-content.js'])), { run } = A;
  const ids = run('COURSE_TOPICS.map(t=>t.id)');
  for (const id of ids) {
    const levels = run(`COURSE_LEVEL_DATA['${id}']`);
    levels.forEach((lv, i) => {
      const again = run(`cgLevelFromFen('${id}',${lv.tier - 1},'${lv.fen}')`);
      assert.ok(again, `${id} ${i + 1}번 판이 단계 조건을 다시 통과해야 한다`);
      assert.equal(again.score, lv.score, `${id} ${i + 1} 점수`);
      // 판정기만으로 끝까지: 예시 풀이(첫 수는 witness, 그다음은 계산)로 성공해야 한다
      const out = run(`(()=>{const topic=courseTopic('${id}'),level=topic.levels[${i}],g=courseGame(level);let step=0,banked=0;
        for(;step<(level.limit||2)+1;step++){const b=g.board;let m;
          if(topic.mode==='mate2')m=step===0?level.witness:crMatesIn1(b)[0];
          else if(topic.mode==='win2')m=step===0?level.witness:lrMoves(b,'w').find(x=>crWin2Second(b,x,banked).result==='success');
          else if(topic.mode==='endgame')m=crEndgameBest(b);else if(topic.mode==='ladder')m=crLadderBest(b);else m=level.witness;
          if(!m)return 'noMove@'+step;
          const o=courseJudge(topic,level,g,step,m,banked);if(!o)return 'illegal@'+step;
          if(o.result!=='continue')return o.result+'@'+(step+1);
          if(topic.mode==='win2')banked=o.note?.banked||0;
          g.move(m[0],m[1],m[2],m[3]);g.move(o.reply[0],o.reply[1],o.reply[2],o.reply[3]);}
        return 'tooLong';})()`);
      assert.match(out, /^success@/, `${id} ${i + 1}번 판: ${out}`);
    });
  }
});

test('두 수 메이트: 열쇠가 아닌 첫 수는 상대가 실제로 빠져나가고, 열쇠 → 응수 → 메이트로 성공. 성공은 기록된다', () => {
  const h = load(); h.run("startCourseLevel('m2-check',0)");
  assert.equal(h.run('state.screen'), 'course'); assert.match(h.elements.get('screen-course').innerHTML, /판 1\/15 · 첫걸음/);
  // 열쇠가 아닌 수
  const bad = J(h.run, `(()=>{const {c,level}=courseContext(),b=c.game.board,keys=crMate2Analyze(b).keyMoves.map(String);return lrMoves(b,'w').find(m=>!keys.includes(String(m))&&crMate2First(b,m).result==='fail'&&crMate2First(b,m).reply);})()`);
  click(h, bad);
  assert.equal(h.run('state.course.phase'), 'result'); assert.equal(h.run('state.course.result'), 'fail'); assert.equal(h.run('state.course.line.length'), 2, '상대 응수까지 둠');
  assert.match(h.run('courseFeedback(state.course,courseTopic("m2-check"),courseContext().level).html'), /메이트가 없어요/);
  h.run('coursePrimary()'); assert.equal(h.run('state.course.phase'), 'choose'); assert.equal(h.run('state.course.line.length'), 0, '다시 해보기는 처음 배치');
  click(h, J(h.run, SOLVE));
  assert.equal(h.run('state.course.phase'), 'choose', '첫 수가 맞으면 상대가 응수하고 내 차례'); assert.equal(h.run('state.course.line.length'), 2);
  assert.match(h.run('courseFeedback(state.course,courseTopic("m2-check"),courseContext().level).html'), /좋은 첫 수/);
  click(h, J(h.run, SOLVE));
  assert.equal(h.run('state.course.result'), 'success');
  assert.deepEqual(J(h.run, "readData('course_progress_v1',{}).topics['m2-check'].solved"), ['m2check-01']);
  h.run('coursePrimary()'); assert.equal(h.run('state.course.levelIndex'), 1);
});

test('힌트: 두 번 해본 뒤에 열리고(첫 판은 처음부터), 힌트로 푼 판은 💡. 끝내기는 처음부터 상자 힌트', () => {
  const h = load(); h.run("startCourseLevel('m2-quiet',1)");
  assert.equal(h.run('courseSecondaryLabel(state.course,courseTopic("m2-quiet"),courseContext().level)'), '🔒 힌트 0/2');
  h.run('courseHint()'); assert.equal(h.run('state.course.hintLevel'), 0); assert.equal(h.run('state.course.notice'), 'hintLocked');
  const bad = J(h.run, `(()=>{const b=state.course.game.board,keys=crMate2Analyze(b).keyMoves.map(String);return lrMoves(b,'w').find(m=>!keys.includes(String(m)));})()`);
  for (let i = 0; i < 2; i++) { click(h, bad); if (h.run('state.course.phase') === 'choose') { click(h, J(h.run, 'crMatesIn1(state.course.game.board)[0]||lrMoves(state.course.game.board,"w")[0]')); } h.run('coursePrimary()'); }
  assert.equal(h.run('state.course.fails'), 2);
  h.run('courseSecondary()'); assert.equal(h.run('state.course.hintLevel'), 1);
  assert.match(h.elements.get('screen-course').innerHTML, /lesson-flight/);
  assert.equal(solveCurrent(h), 'success');
  assert.deepEqual(J(h.run, "readData('course_progress_v1',{}).topics['m2-quiet'].helped"), ['m2quiet-02']);
  const e = load(); e.run("startCourseLevel('eg-krk',6)");
  assert.equal(e.run('courseHintFree(state.course,courseTopic("eg-krk"),courseContext().level)'), true);
  e.run('courseHint()'); assert.match(e.elements.get('screen-course').innerHTML, /course-box/);
});

test('끝내기: 스테일메이트·말 잃기·제한 수는 실패, 한 수 전으로 돌아갈 수 있고 남은 수와 거리를 알려 준다', () => {
  const h = load();
  const index = h.run(`courseTopic('eg-kqk').levels.findIndex(lv=>{const b=boardFromFEN(lv.fen);return lrMoves(b,'w').some(m=>crEndgameStep('Q',b,m).note==='lost');})`);
  assert.ok(index >= 0, '퀸을 잃는 수가 있는 판'); h.run(`startCourseLevel('eg-kqk',${index})`);
  const hang = J(h.run, `(()=>{const b=state.course.game.board;return lrMoves(b,'w').find(m=>crEndgameStep('Q',b,m).note==='lost')||null;})()`);
  click(h, hang); assert.equal(h.run('state.course.result'), 'fail'); assert.match(h.run('courseFeedback(state.course,courseTopic("eg-kqk"),courseContext().level).html'), /잡았어요/);
  h.run('courseSecondary()'); assert.equal(h.run('state.course.phase'), 'choose'); assert.equal(h.run('state.course.line.length'), 0, '한 수 전으로');
  click(h, J(h.run, 'crEndgameBest(state.course.game.board)'));
  assert.match(h.run('courseFeedback(state.course,courseTopic("eg-kqk"),courseContext().level).html'), /가장 빠른 길이에요!.*메이트까지 최소 \d+수 · 남은 수 \d+/);
  // 제한 수: 아무 의미 없는 수만 두면 제한에 걸린다
  const l = load(); l.run("startCourseLevel('eg-krrk',12)"); const limit = l.run('courseContext().level.limit');
  let n = 0; while (l.run('state.course.phase') === 'choose' && n < 60) { const m = J(l.run, `(()=>{const b=state.course.game.board;return lrMoves(b,'w').find(m=>{const o=crLadderStep(b,m);return o.result==='continue';})||lrMoves(b,'w')[0];})()`); click(l, m); n++; }
  assert.equal(l.run('state.course.result'), 'fail'); assert.equal(l.run('state.course.note'), 'limit'); assert.ok(n <= limit);
});

test('초반: 캐슬링 판에서 캐슬링(킹 두 칸)은 성공, 킹 걷기는 목표 미달. 함정 판은 막지 못하면 상대가 실제로 메이트', () => {
  const h = load(); h.run("startCourseLevel('op-castle',0)");
  const castle = J(h.run, 'courseContext().level.witness'); assert.equal(Math.abs(castle[3] - castle[1]), 2);
  click(h, castle); assert.equal(h.run('state.course.result'), 'success'); assert.equal(h.run('state.course.game.board[7][5]||state.course.game.board[7][3]'), 'wR', '룩도 넘어옴');
  const t = load(); t.run("startCourseLevel('op-trap',0)");
  const bad = J(t.run, `(()=>{const {c}=courseContext();return c.game.allMoves().map(m=>m.slice(0,4)).find(m=>crOpeningJudge('trap',c.game,m)?.note==='mated');})()`);
  click(t, bad); assert.equal(t.run('state.course.result'), 'fail'); assert.equal(t.run('state.course.game.status'), 'checkmate');
});

test('저장·복원: 두 수 문제의 첫 수 뒤 저장하면 새 앱에서 같은 판·같은 수로 이어지고, 변조된 수는 거부한다', () => {
  const a = load(); a.run("startCourseLevel('m2-sac',0)"); click(a, J(a.run, SOLVE)); a.run('saveActiveSession()');
  const saved = J(a.run, "readData('sessions',{}).course"); assert.equal(saved.version, 7); assert.equal(saved.snapshot.values.course.line.length, 2);
  const b = load(Object.fromEntries(a.storage)); b.run("resumeActivity('course')");
  assert.equal(b.run('state.course.line.length'), 2); assert.equal(b.run('lessonBoardKey(state.course.game)'), a.run('lessonBoardKey(state.course.game)'));
  click(b, J(b.run, SOLVE)); assert.equal(b.run('state.course.result'), 'success');
  const bad = JSON.parse(JSON.stringify(saved)); bad.snapshot.values.course.line[1] = [0, 0, 0, 1];
  assert.equal(b.run(`getSavedSession(${JSON.stringify(bad)})`), null);
});

test('잠금 미리보기: 무료 주제는 열리고, 다른 주제는 처음 3판만. 연습·시험·실전은 보호자 안내 창', () => {
  const h = load({ chess_store_preview_locked: '1' });
  h.run("globalThis.dialogs=[];showActivityDialog=(title,html,actions)=>{dialogs.push({title,html,labels:actions.map(a=>a.label)});}");
  assert.equal(h.run('storeMode()'), 'locked');
  assert.equal(h.run("courseLevelOpen(courseTopic('m2-check'),14)"), true);
  assert.equal(h.run("courseLevelOpen(courseTopic('m2-quiet'),2)"), true);
  assert.equal(h.run("courseLevelOpen(courseTopic('m2-quiet'),3)"), false);
  h.run("startCourseLevel('m2-quiet',3)"); assert.equal(h.run('state.course'), undefined); assert.match(J(h.run, 'dialogs.at(-1)').title, /보호자와 함께/);
  h.run("courseDrillDialog('eg-krk')"); assert.match(J(h.run, 'dialogs.at(-1)').html, /승급 과정 2단계/);
  h.run("courseTestDialog('stage1')"); assert.match(J(h.run, 'dialogs.at(-1)').title, /보호자와 함께/);
  h.run("goCourse()"); assert.match(h.elements.get('screen-course').innerHTML, /앱 잠금 미리보기 중/);
  const p = load(); p.run('goCourse()'); assert.match(p.elements.get('screen-course').innerHTML, /웹 미리보기/); assert.equal(p.run("courseLevelOpen(courseTopic('m2-quiet'),14)"), true);
});

test('승급 시험: 처음 보는 판 5개를 힌트 없이 한 번씩, 4개 이상 성공하면 통과·수료증. 중간 판은 다시 둘 수 없다', () => {
  const h = load();
  h.run("globalThis.dialogs=[];showActivityDialog=(title,html,actions)=>{dialogs.push({title,html,labels:actions.map(a=>a.label)});}");
  h.run("startCourseTest('stage1')");
  assert.equal(h.run('state.course.mode'), 'test'); assert.equal(h.run('state.course.test.items.length'), 5);
  for (let i = 0; i < 5; i++) {
    flush(h.timers); assert.equal(h.run('state.course.phase'), 'choose', `${i + 1}번 문제 준비`);
    assert.match(h.run('courseSecondaryLabel(state.course,courseContext().topic,courseContext().level)'), /힌트 없음/);
    if (i === 0) { const bad = J(h.run, `(()=>{const {c,topic}=courseContext(),b=c.game.board;return lrMoves(b,'w').find(m=>courseJudge(topic,courseContext().level,c.game,0,m,0)?.result==='fail');})()`); click(h, bad); }
    else solveCurrent(h);
    assert.equal(h.run('state.course.phase'), 'result');
    h.run('coursePrimary()');
  }
  assert.equal(h.run('state.course.phase'), 'complete');
  const t = J(h.run, "readData('course_progress_v1',{}).tests.stage1"); assert.equal(t.passed, true); assert.equal(t.score, 4); assert.equal(t.total, 5);
  h.run('coursePrimary()'); assert.match(J(h.run, 'dialogs.at(-1)').html, /수료|공인 급수가 아니에요/);
});

test('무한 연습: 판을 만들어 풀면 단계 기록과 연속이 오르고, 판 번호가 같으면 같은 판', () => {
  const h = load(); h.run("startCourseDrill('eg-kqk',1,12345)"); flush(h.timers);
  assert.equal(h.run('state.course.phase'), 'choose'); const fen = h.run('state.course.fen');
  assert.equal(solveCurrent(h), 'success'); assert.deepEqual(J(h.run, "readData('course_progress_v1',{}).drill['eg-kqk'].solved"), [0, 1, 0, 0, 0]); assert.equal(h.run('state.course.streak'), 1);
  const g = load(); g.run("startCourseDrill('eg-kqk',1,12345)"); flush(g.timers); assert.equal(g.run('state.course.fen'), fen);
});

test('실전 승급전: 표준 처음 배치·정해진 단계로 시작하고, 이기면 기록된다. 프로필 파일 v7로 옮겨진다', () => {
  const h = load(); h.run("startCourseMatch('stage2')");
  assert.equal(h.run('state.play.content.type'), 'courseMatch'); assert.equal(h.run('state.play.level'), 3); assert.equal(h.run('lessonBoardKey(state.game)'), h.run('lessonBoardKey(new ChessGame())'));
  h.run("state.game=ChessGame.fromFEN('7k/8/5KQ1/8/8/8/8/8 w - - 0 1');playCommitMove([2,6,1,6])"); flush(h.timers);
  assert.equal(h.run('state.game.status'), 'checkmate'); assert.ok(J(h.run, "readData('course_progress_v1',{}).matches.stage2") > 0);
  const file = h.run('JSON.stringify(createProfileBackup())'); assert.equal(JSON.parse(file).version, 7);
  const b = load(); b.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(file)})).id)`); assert.ok(J(b.run, "courseProgress().matches.stage2") > 0);
  const bad = JSON.parse(file); bad.data.course_progress_v1 = JSON.stringify({ version: 1, topics: { 'm2-check': { solved: ['nope'] } }, drill: {}, tests: {}, matches: {} });
  assert.throws(() => b.run(`parseProfileBackup(${JSON.stringify(JSON.stringify(bad))})`), /승급 과정 기록/);
});
