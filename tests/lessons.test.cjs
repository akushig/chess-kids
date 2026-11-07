// 체스 수업 v2 흐름 (docs/lessons/LESSON_REDESIGN_V2.md). 결과는 실제 입력 함수(lessonClick 등)로만 만든다.
const test=require('node:test'),assert=require('node:assert/strict'),harness=require('./harness.cjs');
// 사람의 연속 탭과 달리 검사는 같은 순간에 진행 버튼을 부르므로, 연타 방지 시각만 비우고 원래 함수를 부른다(연타 검사는 원래 함수 그대로).
const load=(initial)=>{const h=harness(initial);h.run('const __lessonPrimary=lessonPrimary;lessonPrimary=()=>{lessonChangedAt=0;return __lessonPrimary();}');return h;};
const J=(run,expr)=>JSON.parse(run(`JSON.stringify(${expr})`));
const flush=timers=>{for(let n=0;timers.length&&n<100;n++)timers.splice(0).forEach(cb=>cb());};
const play=(run,timers,[a,b,c,d])=>{run(`lessonClick(${a},${b});lessonClick(${c},${d})`);flush(timers);};
const S=run=>J(run,'{phase:state.lesson.phase,level:state.lesson.levelIndex,result:state.lesson.result,notice:state.lesson.notice,selected:state.lesson.selected,inspect:state.lesson.inspect,solved:state.lesson.solved,board:state.lesson.game.board}');
const feedback=run=>run('lessonFeedback(lessonView()).html').replace(/<[^>]+>/g,'');
// 한 수업을 함정 없이 예시 정답으로 끝까지
function finish(run,timers,id){run(`openLesson('${id}')`);for(let i=0;i<5;i++){play(run,timers,J(run,'lessonContext().level.witness'));assert.equal(run('state.lesson.result'),'success');run('lessonPrimary()');}assert.equal(run('state.lesson.phase'),'complete');}

test('판 하나: 내 말을 고르면 갈 칸, 상대 말을 누르면 그 말이 갈 칸, 빈칸은 안내만. 위험한 수는 상대가 실제로 잡고 멈춘다',()=>{
 const {run,timers,elements}=load();run("openLesson('protect-escape-v2')");
 let html=elements.get('screen-lesson').innerHTML;
 assert.match(html,/🎯 상대 비숍이 내 룩을 노려요/);assert.match(html,/나 = 흰색/);assert.match(html,/판 1\/5/);assert.match(html,/lesson-arrow-attack/,'첫 판은 공격선을 처음부터 보여준다');
 assert.equal((html.match(/lesson-owner mine/g)||[]).length,2);assert.equal((html.match(/lesson-owner theirs/g)||[]).length,2);
 assert.match(feedback(run),/옮길 내 말\(흰색\)을 눌러요/);
 run('lessonClick(4,4)');assert.equal(run('state.lesson.notice'),'pickOwn');assert.equal(run('state.lesson.attempts'),0);
 run('lessonClick(1,6)');assert.deepEqual(S(run).inspect,[1,6]);assert.match(feedback(run),/상대 비숍은 빨간 점 칸으로 갈 수 있어요/);assert.match(elements.get('screen-lesson').innerHTML,/lesson-reach/);
 run('lessonClick(6,0)');assert.deepEqual(S(run).selected,[6,0]);assert.equal(S(run).inspect,null);assert.match(feedback(run),/점이 찍힌 칸을 눌러 옮겨요/);
 run('lessonClick(5,0)');assert.equal(run('state.lesson.phase'),'response');assert.equal(run('state.lesson.game.board[5][0]'),'wK');assert.match(feedback(run),/상대\(검은색\) 차례/);
 flush(timers);let s=S(run);assert.equal(s.result,'fail');assert.equal(s.board[4][3],'bB','상대가 룩을 실제로 잡음');assert.deepEqual(J(run,'state.lesson.reply'),[1,6,4,3]);
 assert.match(feedback(run),/✗ 상대 비숍이 내 룩을 잡았어요.*비숍은 대각선으로 끝까지 와요.*다시 해보기/);
 html=elements.get('screen-lesson').innerHTML;assert.match(html,/lesson-next[^"]*" onclick="lessonPrimary\(\)" >↶ 다시 해보기/,'다음 버튼 강조');assert.match(html,/잡힘/);
 run('lessonClick(0,0)');assert.equal(run('state.lesson.phase'),'result','결과 뒤 판 누름은 진행 버튼을 짚을 뿐');
 run('lessonPrimary()');s=S(run);assert.equal(s.phase,'choose');assert.equal(s.board[4][3],'wR');assert.equal(s.board[6][0],'wK');
 // 예시와 다른 안전한 칸도 성공. 성공 뒤에는 원래 노리던 비숍의 길을 보여준다.
 play(run,timers,[4,3,4,0]);s=S(run);assert.equal(s.result,'success');assert.deepEqual(s.solved,[true,false,false,false,false]);assert.match(feedback(run),/✓ 내 룩이 상대 비숍의 길에서 벗어났어요.*다음 판/);
 assert.match(elements.get('screen-lesson').innerHTML,/lesson-safe/);
 run('lessonPrimary()');assert.equal(run('state.lesson.levelIndex'),1);assert.doesNotMatch(elements.get('screen-lesson').innerHTML,/lesson-arrow-attack/,'둘째 판부터는 공격선을 스스로 찾는다');
});

test('힌트: 1단계는 상대가 노리는 말(없으면 지키는 칸), 2단계는 예시 정답 화살표. 수를 대신 두지 않고, 실패 뒤 힌트는 다시 시작하며 보여준다',()=>{
 const {run,timers,elements}=load();run("openLesson('protect-escape-v2');lessonClick(4,3);lessonClick(3,3)");flush(timers);run('lessonPrimary()');
 const board=S(run).board;run('lessonHint()');assert.match(feedback(run),/빨간 화살표: 상대가 노리는 내 말/);assert.match(elements.get('screen-lesson').innerHTML,/lesson-arrow-attack/);
 run('lessonHint()');assert.match(feedback(run),/초록 화살표처럼/);assert.match(elements.get('screen-lesson').innerHTML,/lesson-arrow-suggest/);run('lessonHint()');assert.equal(run('state.lesson.hintLevel'),2);
 assert.deepEqual(S(run).board,board,'힌트는 수를 두지 않는다');assert.equal(run('state.lesson.helpUsed'),true);
 // 잡기 수업 첫 판: 노려지는 말이 없으면 '그 칸을 지키는 상대 말'을 보여준다.
 run("openLesson('protect-capture-v2')");assert.match(elements.get('screen-lesson').innerHTML,/lesson-arrow-attack/);assert.deepEqual(J(run,'lessonThreatMarks(lessonView().start)').kind,'defended');
 play(run,timers,[6,4,4,4]);assert.equal(run('state.lesson.result'),'fail');run('lessonSecondary()');assert.equal(run('state.lesson.phase'),'choose');assert.equal(run('state.lesson.hintLevel'),1,'힌트 보고 다시');
 assert.match(feedback(run),/상대가 지키는 칸/);
 // 잡지 않는 수는 목표 미달로 알려주고 상대는 움직이지 않는다.
 play(run,timers,[6,4,5,4]);assert.equal(run('state.lesson.result'),'goal');assert.equal(run('state.lesson.reply'),null);assert.match(feedback(run),/상대 말을 하나 잡아야 해요/);
});

test('모든 판을 성공해야 수업이 끝나고, 힌트 사용 여부로 도움/혼자를 나눈다. 마지막 수업 다음은 대전 입구',()=>{
 const {run,timers}=load();run("openLesson('protect-capture-v2');lessonHint()");play(run,timers,J(run,'lessonContext().level.witness'));
 for(let i=1;i<5;i++){run('lessonPrimary()');play(run,timers,J(run,'lessonContext().level.witness'));}
 assert.equal(J(run,"readData('lesson_progress_v1',{})['protect-capture-v2'].completed"),false,'마지막 판 성공만으로는 아직');
 run('lessonPrimary()');assert.equal(run('state.lesson.phase'),'complete');assert.match(feedback(run),/수업을 마쳤어요.*다음 수업/);
 assert.deepEqual(J(run,"readData('lesson_progress_v1',{})['protect-capture-v2']"),{version:1,completed:true,assisted:true,independent:false,lastSceneId:'capture-5'});
 finish(run,timers,'protect-capture-v2');assert.deepEqual(J(run,"readData('lesson_progress_v1',{})['protect-capture-v2']"),{version:1,completed:true,assisted:true,independent:true,lastSceneId:'capture-5'});
 assert.ok(run("learningSummary().some(r=>r.label==='체스 수업 · 잡을 때도 조심하기'&&r.independent===1&&r.assisted===1)"));
 run('lessonPrimary()');assert.equal(run('state.lesson.lessonId'),'protect-all-v2','다음 수업');
 finish(run,timers,'protect-all-v2');run('lessonPrimary()');assert.equal(run('state.screen'),'play','마지막 수업 뒤에는 대전 입구');
 run('showScreen("home");renderHome()');assert.equal(run('recommendedActivity().action'),'goPlay()');
 const h=load();finish(h.run,h.timers,'protect-escape-v2');h.run('leaveActivity()');assert.equal(h.run('recommendedActivity().action'),"openLesson('protect-capture-v2')");
});

test('응수 중 저장·앱 종료는 그 판의 처음으로 남고, 목록·홈·프로필로 가면 예약된 잡기가 유령처럼 일어나지 않는다',()=>{
 const a=load();a.run("openLesson('protect-escape-v2')");play(a.run,a.timers,[4,3,3,3]);a.run('lessonPrimary()');a.run('lessonClick(5,7);lessonClick(0,2)');assert.equal(a.run('state.lesson.phase'),'response');
 const saved=J(a.run,"readData('sessions',{}).lesson");assert.equal(saved.version,5);const v=saved.snapshot.values.lesson;assert.deepEqual([v.phase,v.levelIndex,v.game.board[5][7],v.move],['choose',1,'wB',null]);assert.equal(v.selected,undefined,'선택은 저장하지 않음');
 const b=load(Object.fromEntries(a.storage));b.run('resumeActivity()');assert.deepEqual([b.run('state.lesson.phase'),b.run('state.lesson.levelIndex')],['choose',1]);flush(b.timers);assert.equal(b.run('state.lesson.phase'),'choose','복원 뒤 자동 이동 없음');
 assert.deepEqual(J(b.run,'state.lesson.solved'),[true,false,false,false,false]);
 for(const leave of ["goLessons()","showScreen('home');renderHome()","switchProfile(createProfile('둘째','🐱').id)"]){
  const {run,timers,storage}=load();run("openLesson('protect-escape-v2');lessonClick(6,0);lessonClick(5,0)");run(leave);flush(timers);
  const s=JSON.parse(storage.get('chess.child.lesson_sessions_v1'))['protect-escape-v2'].snapshot.values.lesson;assert.equal(s.phase,'choose',leave);assert.equal(s.game.board[4][3],'wR',leave+' 유령 잡기 없음');assert.equal(s.attempts,0);
 }
 // 결과가 끝난 실패는 결과 그대로, 다시 해보기도 그대로 된다.
 const c=load();c.run("openLesson('protect-escape-v2')");play(c.run,c.timers,[6,0,5,0]);const d=load(Object.fromEntries(c.storage));d.run("openLesson('protect-escape-v2')");
 assert.deepEqual([d.run('state.lesson.result'),d.run('state.lesson.game.board[4][3]')],['fail','bB']);d.run('lessonPrimary()');assert.equal(d.run('state.lesson.game.board[4][3]'),'wR');
});

test('수업 목록: 다른 놀이의 저장판을 섞지 않고, 세 수업을 오가도 각각 이어하며, 처음부터 다시는 그 수업만 지운다',()=>{
 const {run,timers,elements}=load();run("playStart();playCommitMove([6,4,4,4]);startSolo(0);goLessons('home')");
 let html=elements.get('screen-lesson').innerHTML;assert.equal((html.match(/lesson-status-new/g)||[]).length,3);assert.doesNotMatch(html,/이어하기|resume-card/);assert.match(html,/나는 <b>흰색<\/b>/);
 run("openLesson('protect-escape-v2')");play(run,timers,[4,3,3,3]);run('lessonPrimary()');
 run("openLesson('protect-capture-v2')");play(run,timers,[6,4,4,4]);
 run("openLesson('protect-all-v2');lessonHint()");
 run('goLessons()');html=elements.get('screen-lesson').innerHTML;assert.equal((html.match(/lesson-status-resume/g)||[]).length,3);assert.match(html,/이어하기 · 판 2\/5/);
 assert.match(html,/restartLesson\('protect-escape-v2'\)[\s\S]*↺ 처음부터 다시[\s\S]*openLesson\('protect-escape-v2'\)[\s\S]*▶ 이어하기/);
 run("openLesson('protect-escape-v2')");assert.equal(run('state.lesson.levelIndex'),1);run("openLesson('protect-capture-v2')");assert.equal(run('state.lesson.result'),'fail');run("openLesson('protect-all-v2')");assert.equal(run('state.lesson.hintLevel'),1);
 run("goLessons();globalThis.choice=null;showChoice=(m,c)=>{choice={m,c};};restartLesson('protect-escape-v2')");assert.match(run('choice.m'),/첫 판부터 다시/);run('choice.c[0].action()');
 assert.deepEqual([run('state.lesson.levelIndex'),run('state.lesson.phase')],[0,'choose']);run('goLessons()');assert.ok(run("!!lessonSavedSession('protect-capture-v2')&&!!lessonSavedSession('protect-all-v2')"));
 assert.ok(run("!!activitySaved('play')&&!!activitySaved('solo')"),'다른 놀이 저장판 보존');
});

test('진입: 홈 보조 진입과 대전 설정에 체스 수업이 있고, 주 진입 3개와 진행 중 대전은 그대로다',()=>{
 const {run,elements}=load();run('renderHome()');const home=elements.get('screen-home').innerHTML;
 assert.match(home.slice(home.indexOf('home-secondary')),/goLessons\('home'\)[\s\S]*체스 수업/);
 const primary=home.slice(home.indexOf('home-primary'),home.indexOf('home-secondary'));assert.equal((primary.match(/class="menu-btn /g)||[]).length,3);
 run("playStart();playCommitMove([6,4,4,4]);goPlay()");assert.match(elements.get('screen-play').innerHTML,/goLessons\('play'\)/);
 run("goLessons('play')");assert.match(elements.get('screen-lesson').innerHTML,/goPlay\(\)">← 체스 대전/);assert.ok(run("!!activitySaved('play')"));
});

test('수업 마치기 직후 같은 자리의 다음 수업 버튼은 연타로 눌리지 않는다',()=>{
 const h=harness(),{run,timers}=h;run("openLesson('protect-escape-v2')");
 for(let i=0;i<5;i++){play(run,timers,J(run,'lessonContext().level.witness'));run('lessonChangedAt=0;lessonPrimary()');}
 assert.equal(run('state.lesson.phase'),'complete');run('lessonPrimary()');assert.equal(run('state.lesson.lessonId'),'protect-escape-v2','두 번째 탭은 무시');
 run('lessonChangedAt=Date.now()-1000;lessonPrimary()');assert.equal(run('state.lesson.lessonId'),'protect-capture-v2','잠시 뒤에는 다음 수업');
});
