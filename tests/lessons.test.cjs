// 체스 수업 (docs/lessons/INTERACTIVE_LESSONS_DESIGN.md). 결과는 실제 입력 함수로만 만든다.
const test=require('node:test'),assert=require('node:assert/strict'),harness=require('./harness.cjs');
// 사람의 연속 탭과 달리 검사는 같은 순간에 다음 버튼을 부르므로, 연타 방지 시각만 비우고 원래 함수를 부른다(아래 연타 검사는 원래 함수 그대로).
const load=(initial)=>{const h=harness(initial);h.run('const __lessonPrimary=lessonPrimary;lessonPrimary=()=>{lessonChangedAt=0;return __lessonPrimary();}');return h;};
const J=(run,expr)=>JSON.parse(run(`JSON.stringify(${expr})`));
const flush=timers=>{for(let n=0;timers.length&&n<100;n++)timers.splice(0).forEach(cb=>cb());};
const lesson=run=>J(run,'{phase:state.lesson.phase,scene:state.lesson.sceneId,result:state.lesson.result,notice:state.lesson.notice,attempts:state.lesson.attempts,board:state.lesson.game.board,turn:state.lesson.game.turn,history:state.actionHistory.length}');
// 시범 → 함께 해보기 → 혼자 해보기를 실제 입력으로 통과한다.
const SOLVE={'protect-spot-v1':[[[5,0]],[[3,3]]],'protect-escape-v1':[[[5,7],[4,6]],[[3,4],[2,4]]],'protect-capture-v1':[[[6,3],[6,0]],[[6,4],[6,7]]]};
function finish(run,timers,id){run(`openLesson('${id}');lessonPrimary()`);for(const clicks of SOLVE[id]){for(const [r,c] of clicks)run(`lessonClick(${r},${c})`);flush(timers);assert.equal(run('state.lesson.result'),'success',id);run('lessonPrimary()');}assert.equal(run('state.lesson.phase'),'complete');}

test('수업을 마치면 홈의 다음 걸음은 다음 수업, 마지막 수업 뒤에는 대전이다',()=>{
 const {run,timers}=load();finish(run,timers,'protect-spot-v1');run('leaveActivity()');assert.equal(run('recommendedActivity().action'),"openLesson('protect-escape-v1')");
 finish(run,timers,'protect-capture-v1');run('leaveActivity()');assert.equal(run('recommendedActivity().action'),'goPlay()');
});

test('수업 1: 지목은 판·차례를 바꾸지 않고, 오답에 정답을 바로 보이지 않으며, 우리 말이 아닌 칸은 시도로 세지 않는다',()=>{
 const {run}=load();run("openLesson('protect-spot-v1');lessonPrimary()");const start=lesson(run);
 run('lessonClick(0,0)');assert.equal(run('state.lesson.notice'),'pickOurs');assert.equal(run('state.lesson.attempts'),0);assert.equal(run('state.actionHistory.length'),0);
 run('lessonClick(4,4)');assert.equal(run('state.lesson.attempts'),0,'빈칸');
 run('lessonClick(7,4)');let s=lesson(run);assert.equal(s.result,'retry');assert.deepEqual(s.board,start.board);assert.equal(s.turn,'w');
 const html=run('lessonBoardHTML(lessonView(),lessonById("protect-spot-v1"))');assert.doesNotMatch(html,/lesson-target|lesson-attacker/,'첫 오답에서 정답 표시 없음');assert.match(run('lessonMessage(lessonView()).html'),/지금 바로 잡히지 않아요/);
 run('lessonRetry()');assert.equal(run('state.lesson.phase'),'choose');assert.equal(run('state.actionHistory.length'),0);
 run('lessonClick(5,0)');s=lesson(run);assert.equal(s.result,'success');assert.deepEqual(s.board,start.board);assert.equal(s.attempts,2);
 assert.match(run('lessonMessage(lessonView()).html'),/이 룩이 우리 비숍을 노려요/);assert.match(run('lessonBoardHTML(lessonView(),lessonById("protect-spot-v1"))'),/lesson-attacker[\s\S]*lesson-overlay/);
 run('lessonPrimary()');assert.equal(run('state.lesson.sceneId'),'protect-spot-transfer-v1');assert.equal(run('state.actionHistory.length'),0,'새 장면은 새 되돌리기');
});

test('수업 2: 대상 말의 모든 합법 이동을 실제로 두어 보면 술어대로 성공/응수가 나오고, 여러 안전한 칸을 인정한다',()=>{
 for(const sceneIndex of [1,2]){
  const probe=load();probe.run(`startLesson('protect-escape-v1');lessonGoScene(${sceneIndex})`);
  const moves=J(probe.run,'lessonLegalMoves(state.lesson.game,lessonContext().scene.focusSquare)');assert.ok(moves.length>=7);
  let safe=0;
  for(const m of moves){
   const {run,timers}=load();run(`startLesson('protect-escape-v1');lessonGoScene(${sceneIndex});lessonClick(${m[0]},${m[1]});lessonClick(${m[2]},${m[3]})`);
   assert.equal(run('state.lesson.phase')==='response'||run('state.lesson.phase')==='result',true);flush(timers);
   const s=lesson(run),expect=J(run,`lessonOutcome(state.lesson.attemptStartGame,${JSON.stringify(m)})`);
   assert.equal(s.result,expect.safe?'success':'retry',String(m));
   if(expect.safe){safe++;assert.equal(run('state.lesson.responseMove'),null);assert.equal(s.board[m[2]][m[3]][0],'w');}
   else{const reply=J(run,'state.lesson.responseMove');assert.deepEqual(reply,expect.reply);assert.deepEqual([reply[2],reply[3]],[m[2],m[3]]);assert.equal(s.board[m[2]][m[3]][0],'b','흑이 그 말을 실제로 잡음');assert.equal(s.turn,'w');}
  }
  assert.ok(safe>=6,'안전한 칸이 여러 개');
 }
 // 대상이 아닌 백 말은 과제 범위 밖으로 안내하고 시도로 세지 않는다.
 const {run}=load();run("startLesson('protect-escape-v1');lessonGoScene(1);lessonClick(7,3)");assert.equal(run('state.lesson.notice'),'notFocus');assert.match(run('lessonMessage(lessonView()).html'),/테두리의 말을 지켜봐요/);assert.equal(run('state.lesson.attempts'),0);
 run('lessonClick(5,7);lessonClick(0,0)');assert.equal(run('state.lesson.notice'),'cannotGo');assert.equal(run('state.lesson.attempts'),0);
});

test('수업 3: 안전한 잡기·되잡힘·빈칸 이동을 구분하고, 나이트가 더해진 배치에서도 룩이 학습 대상이다',()=>{
 const {run,timers}=load();run("startLesson('protect-capture-v1');lessonGoScene(2)");
 run('lessonClick(5,2)');assert.equal(run('state.lesson.notice'),'notFocus');assert.match(run('lessonMessage(lessonView()).html'),/룩으로 폰을 잡아봐요/);
 run('lessonClick(6,4);lessonClick(6,5)');assert.equal(run('state.lesson.notice'),'emptyMove');assert.match(run('lessonMessage(lessonView()).html'),/폰을 잡는 두 방법을 비교해요/);assert.equal(run('state.lesson.attempts'),0);assert.equal(run('state.lesson.phase'),'choose');
 run('lessonClick(4,4)');assert.equal(run('state.lesson.phase'),'response');assert.equal(run('state.lesson.game.board[4][4]'),'wR');
 assert.equal(run('lessonButtons(state.lesson,lessonContext().lesson).includes(\'requestActivityUndo()" disabled\')'),true,'응수 중 되돌리기 비활성');run('undoActivity()');assert.equal(run('state.lesson.phase'),'response');
 flush(timers);assert.equal(run('state.lesson.result'),'retry');assert.equal(run('state.lesson.game.board[4][4]'),'bB');assert.match(run('lessonMessage(lessonView()).html'),/폰을 잡았지만 상대 비숍에게 룩을 잃었어요/);
 // 되돌리기는 학생 수와 교재 응수를 한 번에 되돌린다.
 run('undoActivity()');let s=lesson(run);assert.equal(s.phase,'choose');assert.equal(s.board[6][4],'wR');assert.equal(s.board[4][4],'bP');assert.equal(s.board[1][1],'bB');assert.equal(s.attempts,1);
 run('lessonClick(6,4);lessonClick(6,7)');flush(timers);s=lesson(run);assert.equal(s.result,'success');assert.equal(s.board[6][7],'wR');assert.match(run('lessonMessage(lessonView()).html'),/폰을 잡고 룩도 지켰어요/);
});

test('도움 3단계는 답을 대신 두지 않고, 도움 기록은 재시도·되돌리기 뒤에도 남으며 완료를 도움/혼자로 구분한다',()=>{
 const {run,timers}=load();run("startLesson('protect-escape-v1');lessonGoScene(1)");const before=lesson(run);
 run('lessonHelp()');assert.match(run('lessonBoardHTML(lessonView(),lessonContext().lesson)'),/lesson-attacker/);
 run('lessonHelp()');let html=run('lessonBoardHTML(lessonView(),lessonContext().lesson)');assert.match(html,/danger-cell/);assert.match(html,/lesson-arrow-attack/);
 run('lessonHelp()');html=run('lessonBoardHTML(lessonView(),lessonContext().lesson)');assert.match(html,/lesson-arrow-suggest/);run('lessonHelp()');assert.equal(run('state.lesson.helpLevel'),3);
 assert.deepEqual(lesson(run).board,before.board,'도움은 수를 두지 않음');assert.equal(run('state.lesson.helpUsed'),true);
 run('lessonClick(5,7);lessonClick(0,2)');flush(timers);run('lessonRetry()');assert.equal(run('state.lesson.helpUsed'),true);assert.equal(run('state.lesson.helpShown'),false,'재시도는 화살표를 지움');assert.equal(run('state.lesson.helpLevel'),3);
 run('lessonClick(5,7);lessonClick(4,6)');flush(timers);run('lessonPrimary()');
 run('lessonHelp();lessonClick(3,4);lessonClick(2,4)');flush(timers);run('lessonPrimary()');assert.equal(run('state.lesson.phase'),'complete');
 assert.deepEqual(J(run,"readData('lesson_progress_v1',{})['protect-escape-v1']"),{version:1,completed:true,assisted:true,independent:false,lastSceneId:'protect-escape-transfer-v1'});
 // 같은 수업을 다시 도움 없이 풀면 혼자 성공 기록이 더해진다.
 finish(run,timers,'protect-escape-v1');assert.deepEqual(J(run,"readData('lesson_progress_v1',{})['protect-escape-v1']"),{version:1,completed:true,assisted:true,independent:true,lastSceneId:'protect-escape-transfer-v1'});
 assert.ok(run("learningSummary().some(r=>r.label==='체스 수업 · 안전한 곳으로 피하기'&&r.independent===1&&r.assisted===1)"));
});

test('시범은 자동으로 시작하지 않고, 시범·건너뛰기만으로는 완료되지 않으며, 마무리 뒤 되돌리기는 완료 기록을 지우지 않는다',()=>{
 const {run,timers}=load();run("openLesson('protect-capture-v1')");assert.equal(run('state.lesson.phase'),'demoReady');flush(timers);assert.equal(run('state.lesson.demoStep'),0,'자동 시작 없음');
 run('lessonDemoPlay()');assert.equal(run('state.lesson.phase'),'demoPlaying');const steps=J(run,'lessonDemoSteps(lessonContext().lesson,lessonContext().scene).map(s=>!!s.move)');assert.deepEqual(steps,[false,true,true,false,true,false]);
 flush(timers);assert.equal(run('state.lesson.phase'),'demoReady');assert.equal(run('state.lesson.demoStep'),6);assert.equal(J(run,"readData('lesson_progress_v1',{})['protect-capture-v1'].completed"),false);
 run('lessonDemoPlay();lessonDemoSkip()');assert.equal(run('state.lesson.demoStep'),6);run('lessonPrimary()');assert.equal(run('state.lesson.sceneRole'),'guided');
 run('lessonClick(6,3);lessonClick(6,0)');flush(timers);run('lessonPrimary();lessonClick(6,4);lessonClick(6,7)');flush(timers);run('lessonPrimary()');assert.equal(run('state.lesson.phase'),'complete');
 assert.equal(run("readData('sessions',{}).lesson"),undefined);assert.equal(run("Object.keys(readData('lesson_sessions_v1',{})).length"),0);
 run('undoActivity()');assert.equal(run('state.lesson.phase'),'choose');assert.equal(run('state.lesson.sceneRole'),'transfer');assert.equal(run('state.lesson.progress.transfer'),true,'얻은 성공 유지');
 assert.equal(J(run,"readData('lesson_progress_v1',{})['protect-capture-v1'].completed"),true);assert.ok(run("!!lessonSavedSession('protect-capture-v1')"),'다시 시도할 수 있게 저장');
});

test('응수 중 저장·앱 종료는 시도 시작으로 남고, 화면·수업·프로필 전환 뒤 예약된 수가 유령처럼 움직이지 않는다',()=>{
 const a=load();a.run("startLesson('protect-escape-v1');lessonGoScene(2);lessonClick(3,4);lessonClick(1,4)");assert.equal(a.run('state.lesson.phase'),'response');
 const saved=J(a.run,"readData('sessions',{}).lesson");assert.equal(saved.version,5);assert.equal(saved.snapshot.values.lesson.phase,'choose');assert.equal(saved.snapshot.values.lesson.game.board[3][4],'wR');assert.equal(saved.history.length,0);
 const b=load(Object.fromEntries(a.storage));b.run('resumeActivity()');assert.equal(b.run('state.lesson.phase'),'choose');assert.equal(b.run('state.lesson.game.board[3][4]'),'wR');flush(b.timers);assert.equal(b.run('state.lesson.phase'),'choose','복원 뒤 자동 이동 없음');
 // 응수 대기 중에 수업 목록·홈·프로필로 가면 예약은 버려진다.
 for(const leave of ["goLessons()","showScreen('home');renderHome()","switchProfile(createProfile('둘째','🐱').id)"]){
  const {run,timers,storage}=load();run("startLesson('protect-escape-v1');lessonGoScene(2);lessonClick(3,4);lessonClick(1,4)");run(leave);flush(timers);
  const sessions=JSON.parse(storage.get('chess.child.lesson_sessions_v1'));const v=sessions['protect-escape-v1'].snapshot.values.lesson;assert.equal(v.phase,'choose',leave);assert.equal(v.game.board[1][4],null,leave+' 유령 이동 없음');assert.equal(v.attempts,0);
 }
 // 결과가 끝난 실패는 결과 그대로 복원한다.
 const c=load();c.run("startLesson('protect-escape-v1');lessonGoScene(2);lessonClick(3,4);lessonClick(1,4)");flush(c.timers);const d=load(Object.fromEntries(c.storage));d.run("openLesson('protect-escape-v1')");
 assert.equal(d.run('state.lesson.result'),'retry');assert.equal(d.run('state.lesson.game.board[1][4]'),'bN');d.run('undoActivity()');assert.equal(d.run('state.lesson.game.board[3][4]'),'wR');
 // 시범 도중 저장은 시범 전으로.
 const e=load();e.run("openLesson('protect-spot-v1');lessonDemoPlay()");const demo=J(e.run,"readData('sessions',{}).lesson.snapshot.values.lesson");assert.equal(demo.phase,'demoReady');assert.equal(demo.demoStep,0);
});

test('수업 목록: 다른 놀이의 저장판을 수업 이어하기로 보이지 않고, 세 수업을 오가도 각각 이어할 수 있다',()=>{
 const {run,elements}=load();run("playStart();playCommitMove([6,4,4,4]);startSolo(0);goLessons('home')");
 let html=elements.get('screen-lesson').innerHTML;assert.equal((html.match(/lesson-status-new/g)||[]).length,3);assert.doesNotMatch(html,/이어하기|resume-card/);
 run("openLesson('protect-spot-v1');lessonPrimary();lessonClick(7,4)");
 run("openLesson('protect-escape-v1');lessonPrimary();lessonClick(5,7)");
 run("openLesson('protect-capture-v1');lessonPrimary();lessonHelp()");
 run("goLessons()");html=elements.get('screen-lesson').innerHTML;assert.equal((html.match(/lesson-status-resume/g)||[]).length,3);assert.match(html,/이어하기 · 함께 해보기/);
 run("openLesson('protect-spot-v1')");assert.equal(run('state.lesson.result'),'retry');assert.equal(run('state.actionHistory.length'),1);
 run("openLesson('protect-escape-v1')");assert.equal(run('state.lesson.sceneRole'),'guided');assert.equal(run('state.lesson.selected'),null,'선택은 하던 판 상태가 아님');
 run("openLesson('protect-capture-v1')");assert.equal(run('state.lesson.helpLevel'),1);
 // 처음부터 다시는 그 수업만 지운다.
 run("goLessons();globalThis.choice=null;showChoice=(m,c)=>{choice={m,c};};restartLesson('protect-spot-v1');choice.c[0].action()");assert.equal(run('state.lesson.sceneRole'),'demo');
 run("goLessons()");assert.ok(run("!!lessonSavedSession('protect-escape-v1')&&!!lessonSavedSession('protect-capture-v1')"));
 assert.ok(run("!!activitySaved('play')&&!!activitySaved('solo')"),'다른 놀이 저장판 보존');
});

test('진입: 홈 보조 진입과 대전 설정에 체스 수업이 있고, 주 진입 3개와 진행 중 대전은 그대로다',()=>{
 const {run,elements}=load();run('renderHome()');const home=elements.get('screen-home').innerHTML;
 assert.match(home.slice(home.indexOf('home-secondary')),/goLessons\('home'\)[\s\S]*상대의 공격을 보고 내 말을 지켜요 · 체험 3수업/);
 const primary=home.slice(home.indexOf('home-primary'),home.indexOf('home-secondary'));assert.equal((primary.match(/class="menu-btn /g)||[]).length,3);assert.doesNotMatch(primary,/goLessons/);
 run("playStart();playCommitMove([6,4,4,4]);goPlay()");assert.match(elements.get('screen-play').innerHTML,/goLessons\('play'\)/);
 run("goLessons('play')");assert.match(elements.get('screen-lesson').innerHTML,/goPlay\(\)">← 체스 대전/);assert.ok(run("!!activitySaved('play')"),'진행 중 대전은 그대로');
});

test('마무리 직후 같은 자리의 다음 수업 버튼은 연타로 눌리지 않는다',()=>{
 const h=harness(),{run,timers}=h;run("startLesson('protect-spot-v1');lessonChangedAt=0;lessonGoScene(1)");
 run('lessonClick(5,0);lessonChangedAt=0;lessonPrimary();lessonClick(3,3);lessonChangedAt=0;lessonPrimary()');assert.equal(run('state.lesson.phase'),'complete');
 run('lessonPrimary()');assert.equal(run('state.lesson.lessonId'),'protect-spot-v1','두 번째 탭은 무시');
 run('lessonChangedAt=Date.now()-1000;lessonPrimary()');assert.equal(run('state.lesson.lessonId'),'protect-escape-v1','잠시 뒤에는 다음 수업');
});
