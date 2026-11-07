// 체스 수업 저장·프로필 파일 v5·이전 파일 호환·수업 배치 대전 (명세 §7·§8). 결과는 실제 입력 함수로만 만든다.
const test=require('node:test'),assert=require('node:assert/strict'),harness=require('./harness.cjs');
// 사람의 연속 탭과 달리 검사는 같은 순간에 다음 버튼을 부르므로, 연타 방지 시각만 비우고 원래 함수를 부른다.
const load=(initial)=>{const h=harness(initial);h.run('const __lessonPrimary=lessonPrimary;lessonPrimary=()=>{lessonChangedAt=0;return __lessonPrimary();}');return h;};
const J=(run,expr)=>JSON.parse(run(`JSON.stringify(${expr})`));
const flush=timers=>{for(let n=0;timers.length&&n<100;n++)timers.splice(0).forEach(cb=>cb());};
const lesson=run=>J(run,'{phase:state.lesson.phase,scene:state.lesson.sceneId,result:state.lesson.result,notice:state.lesson.notice,attempts:state.lesson.attempts,board:state.lesson.game.board,turn:state.lesson.game.turn,history:state.actionHistory.length}');
// 시범 → 함께 해보기 → 혼자 해보기를 실제 입력으로 통과한다.
const SOLVE={'protect-spot-v1':[[[5,0]],[[3,3]]],'protect-escape-v1':[[[5,7],[4,6]],[[3,4],[2,4]]],'protect-capture-v1':[[[6,3],[6,0]],[[6,4],[6,7]]]};
function finish(run,timers,id){run(`openLesson('${id}');lessonPrimary()`);for(const clicks of SOLVE[id]){for(const [r,c] of clicks)run(`lessonClick(${r},${c})`);flush(timers);assert.equal(run('state.lesson.result'),'success',id);run('lessonPrimary()');}assert.equal(run('state.lesson.phase'),'complete');}

test('수업 배치로 대전: 혼자 해보기 초기 배치로 표준 대전을 시작하고, 재대결은 같은 배치·난이도, 잘못된 연결 값은 거부한다',()=>{
 const {run,timers}=load();finish(run,timers,'protect-capture-v1');
 run("globalThis.dialog=null;showActivityDialog=(title,html,actions)=>{dialog={title,html,actions};};lessonPracticeDialog()");assert.equal(run('dialog.title'),'이 배치로 대전');assert.match(run('dialog.html'),/lesson-practice-level/);
 run("lessonPracticeLevel=3;dialog.actions[0].action()");
 assert.deepEqual(J(run,'state.play.content'),{version:1,type:'lessonPractice',lessonId:'protect-capture-v1',lessonVersion:1,sceneId:'protect-capture-transfer-v1'});assert.equal(run('state.play.level'),3);
 assert.equal(run('state.game.positionKey()'),run("ChessGame.fromFEN('7k/1b6/8/8/4p3/2N5/4R2p/K7 w - - 0 1').positionKey()"),'목표 성공 뒤 결과판이 아니라 원래 초기 배치');
 assert.match(run('playContentPanel()'),/수업 배치로 대전 · 잡은 다음도 살펴보기/);assert.equal(run("readData('sessions',{}).play.version"),5);assert.ok(run("!!readData('play_content_saves',{}).lessonPractice"));
 run("state.game=ChessGame.fromFEN('7k/8/5KQ1/8/8/8/8/8 w - - 0 1');playCommitMove([2,6,1,6]);playRematch()");assert.equal(run('state.play.level'),3);assert.equal(run('state.play.content.sceneId'),'protect-capture-transfer-v1');
 assert.equal(run('state.game.positionKey()'),run("ChessGame.fromFEN('7k/1b6/8/8/4p3/2N5/4R2p/K7 w - - 0 1').positionKey()"));
 for(const bad of [{lessonId:'x'},{lessonVersion:2},{sceneId:'protect-capture-guided-v1'}])assert.equal(run(`playContentValid(${JSON.stringify({version:1,type:'lessonPractice',lessonId:'protect-capture-v1',lessonVersion:1,sceneId:'protect-capture-transfer-v1',...bad})})`),false,JSON.stringify(bad));
 // 이미 있는 수업 배치 대전이 있을 때만 이어하기/교체를 묻는다.
 run("playCommitMove([6,4,6,7]);globalThis.choice=null;showChoice=(m,c)=>{choice={m,c};};startLessonPractice('protect-capture-v1')");assert.match(run('choice.m'),/하던 판을 바꾸고/);
 run('choice.c[0].action()');assert.equal(run('state.actionHistory.length')>0,true);
});

test('프로필 파일 v5: 수업 저장·기록·수업 배치 대전이 새 기기에서 같은 단계·되돌리기로 이어지고, 변조는 거부한다',()=>{
 const a=load();finish(a.run,a.timers,'protect-spot-v1');
 a.run("startLesson('protect-escape-v1');lessonGoScene(1);lessonClick(5,7);lessonClick(0,2)");flush(a.timers);
 a.run("startLesson('protect-capture-v1');lessonGoScene(1);lessonHelp()");a.run("leaveActivity()");
 const text=a.run('JSON.stringify(createProfileBackup())'),file=JSON.parse(text);assert.equal(file.version,5);
 const b=load();b.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(text)})).id)`);
 b.run("openLesson('protect-escape-v1')");assert.equal(b.run('state.lesson.result'),'retry');assert.equal(b.run('state.actionHistory.length'),1);b.run('undoActivity()');assert.equal(b.run('state.lesson.game.board[5][7]'),'wB');
 b.run("openLesson('protect-capture-v1')");assert.equal(b.run('state.lesson.helpLevel'),1);assert.equal(J(b.run,"readData('lesson_progress_v1',{})['protect-spot-v1'].completed"),true);
 const reject=(change,label)=>{const f=JSON.parse(text);change(f);assert.throws(()=>b.run(`parseProfileBackup(${JSON.stringify(JSON.stringify(f))})`),/읽지 못했어요|안전하지 않은|올바르지 않아요/,label);};
 const editLesson=fn=>f=>{const all=JSON.parse(f.data.lesson_sessions_v1);fn(all['protect-escape-v1']);f.data.lesson_sessions_v1=JSON.stringify(all);};
 reject(editLesson(s=>{s.snapshot.values.lesson.lessonId='protect-unknown-v1';}),'모르는 수업');
 reject(editLesson(s=>{s.snapshot.values.lesson.contentVersion=2;}),'모르는 버전');
 reject(editLesson(s=>{s.snapshot.values.lesson.phase='complete';}),'잘못된 단계');
 reject(editLesson(s=>{s.snapshot.values.lesson.phase='response';}),'응수 중 단계는 저장되지 않음');
 reject(editLesson(s=>{s.snapshot.values.lesson.attemptStartGame=JSON.parse(JSON.stringify(s.snapshot.values.lesson.game));s.snapshot.values.lesson.attemptStartGame.board[0][0]=null;}),'다른 장면의 초기 배치');
 reject(editLesson(s=>{s.snapshot.values.lesson.game.board[4][4]='wQ';}),'교재로 만들 수 없는 현재 배치');
 reject(editLesson(s=>{s.history=Array(121).fill(s.history[0]);}),'초과 배열');
 reject(editLesson(s=>{s.snapshot.values.lesson.studentMove=[5,7,9,2];}),'범위 밖 좌표');
 reject(editLesson(s=>{s.snapshot.values.lesson.notice='<img src=x onerror=alert(1)>';}),'스크립트 문자열');
 reject(f=>{const p=JSON.parse(f.data.lesson_progress_v1);p['protect-spot-v1'].lastSceneId='protect-escape-demo-v1';f.data.lesson_progress_v1=JSON.stringify(p);},'다른 수업의 장면');
 reject(f=>{const all=JSON.parse(f.data.lesson_sessions_v1);all['protect-spot-v1']=all['protect-escape-v1'];f.data.lesson_sessions_v1=JSON.stringify(all);},'다른 수업 ID 아래 저장');
 // 수업 배치 대전만 있어도 v5, 그리고 가져온 뒤 같은 대전으로 이어진다.
 const c=load();c.run("startLessonPractice('protect-spot-v1');playCommitMove([3,3,3,0])");const practice=c.run('JSON.stringify(createProfileBackup())');assert.equal(JSON.parse(practice).version,5);
 const d=load();d.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(practice)})).id);resumeContent('lessonPractice')`);assert.equal(d.run('state.play.content.lessonId'),'protect-spot-v1');assert.equal(d.run('state.game.board[3][0]'),'wR');
});

test('이전 v1~v4 저장과 파일은 그대로 읽고, 다른 놀이의 저장 버전 계산은 바뀌지 않는다',()=>{
 const {run}=load();
 assert.deepEqual(J(run,"[sessionVersion('mission',{}),sessionVersion('knight',{kt:{mode:'tour'}}),sessionVersion('knight',{kt:{mode:'puzzle'}}),sessionVersion('solo',{}),sessionVersion('play',{play:{content:{type:'scene'}}}),sessionVersion('play',{play:{}}),sessionVersion('challenge',{ch:{spec:{version:2}}}),sessionVersion('lesson',{}),sessionVersion('play',{play:{content:{type:'lessonPractice'}}})]"),[1,1,2,3,3,1,4,5,5]);
 const a=load();a.run("goKnightTour(0,'tour');knightTourClick(2,1);leaveActivity()");const v1=a.run('JSON.stringify(createProfileBackup())');assert.equal(JSON.parse(v1).version,1);
 const b=load();b.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(v1)})).id);enterActivity('knight')`);assert.equal(b.run('state.kt.moveCount'),1);
 const c=load();c.run("startSolo(0);soloClick(3,0);soloClick(3,2);leaveActivity()");const v3=c.run('JSON.stringify(createProfileBackup())');assert.equal(JSON.parse(v3).version,3);
 const d=load();d.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(v3)})).id);resumeActivity('solo')`);assert.equal(d.run('state.solo.pieces.length'),2);
 assert.throws(()=>d.run(`parseProfileBackup(${JSON.stringify(JSON.stringify({...JSON.parse(v3),version:6}))})`),/이 버전의 파일은/);
});
