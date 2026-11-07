// 체스 수업 저장·프로필 파일 v5/v6·예전(v1·v2) 자료 처리·수업 배치 대전. 결과는 실제 입력 함수로만 만든다.
const test=require('node:test'),assert=require('node:assert/strict'),harness=require('./harness.cjs');
const load=(initial)=>{const h=harness(initial);h.run('const __lessonPrimary=lessonPrimary;lessonPrimary=()=>{lessonChangedAt=0;return __lessonPrimary();}');return h;};
const J=(run,expr)=>JSON.parse(run(`JSON.stringify(${expr})`));
const flush=timers=>{for(let n=0;timers.length&&n<100;n++)timers.splice(0).forEach(cb=>cb());};
const play=(run,timers,[a,b,c,d])=>{run(`lessonClick(${a},${b});lessonClick(${c},${d})`);flush(timers);};
const level=run=>J(run,'lessonContext().level');
function finish(run,timers,id){run(`openLesson('${id}')`);for(let i=0;i<15;i++){play(run,timers,level(run).witness);run('lessonPrimary()');}}

test('수업 배치로 대전: 마지막 판의 원래 배치로 표준 대전을 시작하고, 재대결은 같은 배치·난이도, 잘못된 연결 값은 거부한다',()=>{
 const {run,timers}=load();finish(run,timers,'protect-all-v3');assert.equal(run('state.lesson.phase'),'complete');
 run("globalThis.dialog=null;showActivityDialog=(title,html,actions)=>{dialog={title,html,actions};};lessonSecondary()");assert.equal(run('dialog.title'),'이 배치로 대전');assert.match(run('dialog.html'),/lesson-practice-level/);
 run("lessonPracticeLevel=3;dialog.actions[0].action()");
 assert.deepEqual(J(run,'state.play.content'),{version:1,type:'lessonPractice',lessonId:'protect-all-v3',lessonVersion:3,sceneId:'all-15'});assert.equal(run('state.play.level'),3);
 const key=run("lessonBoardKey(lessonLevelGame(lessonById('protect-all-v3').levels[14]))");assert.equal(run('lessonBoardKey(state.game)'),key,'목표 성공 뒤 결과판이 아니라 원래 배치');
 assert.match(run('playContentPanel()'),/수업 배치로 대전 · 내 말 모두 지키기/);assert.equal(run("readData('sessions',{}).play.version"),5);assert.ok(run("!!readData('play_content_saves',{}).lessonPractice"));
 run("state.game=ChessGame.fromFEN('7k/8/5KQ1/8/8/8/8/8 w - - 0 1');playCommitMove([2,6,1,6]);playRematch()");assert.equal(run('state.play.level'),3);assert.equal(run('lessonBoardKey(state.game)'),key);
 for(const bad of [{lessonId:'x'},{lessonVersion:2},{sceneId:'all-01'},{lessonId:'protect-all-v2',lessonVersion:2,sceneId:'all-5'}])assert.equal(run(`playContentValid(${JSON.stringify({version:1,type:'lessonPractice',lessonId:'protect-all-v3',lessonVersion:3,sceneId:'all-15',...bad})})`),false,JSON.stringify(bad));
 const mv=J(run,'state.game.allMoves()[0]');run(`playCommitMove(${JSON.stringify(mv)});globalThis.choice=null;showChoice=(m,c)=>{choice={m,c};};startLessonPractice('protect-all-v3')`);assert.match(run('choice.m'),/하던 판을 바꾸고/);
});

test('프로필 파일 v5: 수업 진행·기록이 새 기기에서 같은 판으로 이어지고, 변조는 거부한다',()=>{
 const a=load();finish(a.run,a.timers,'protect-escape-v3');
 a.run("openLesson('protect-capture-v3')");play(a.run,a.timers,level(a.run).witness);a.run('lessonPrimary()');play(a.run,a.timers,level(a.run).trap);
 a.run("lessonPickLevel('protect-all-v3',3)");const t3=level(a.run).trap;play(a.run,a.timers,t3);a.run('lessonPrimary()');play(a.run,a.timers,t3);a.run('lessonSecondary()');a.run('leaveActivity()');
 const text=a.run('JSON.stringify(createProfileBackup())'),file=JSON.parse(text);assert.equal(file.version,5);
 const b=load();b.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(text)})).id)`);
 b.run("openLesson('protect-capture-v3')");assert.deepEqual([b.run('state.lesson.levelIndex'),b.run('state.lesson.result')],[1,'fail']);
 b.run('lessonPrimary()');assert.equal(b.run('state.lesson.phase'),'choose');b.run("openLesson('protect-all-v3')");assert.deepEqual([b.run('state.lesson.levelIndex'),b.run('state.lesson.hintLevel'),b.run('state.lesson.fails')],[3,1,2]);
 assert.equal(J(b.run,"readData('lesson_progress_v1',{})['protect-escape-v3'].completed"),true);
 const reject=(change,label)=>{const f=JSON.parse(text);change(f);assert.throws(()=>b.run(`parseProfileBackup(${JSON.stringify(JSON.stringify(f))})`),/읽지 못했어요|안전하지 않은|올바르지 않아요/,label);};
 const editLesson=fn=>f=>{const all=JSON.parse(f.data.lesson_sessions_v1);fn(all['protect-capture-v3'].snapshot.values.lesson,all['protect-capture-v3']);f.data.lesson_sessions_v1=JSON.stringify(all);};
 reject(editLesson(v=>{v.lessonId='protect-unknown-v3';}),'모르는 수업');
 reject(editLesson(v=>{v.contentVersion=4;}),'모르는 교재 버전');
 reject(editLesson(v=>{v.phase='response';}),'응수 중 단계는 저장되지 않음');
 reject(editLesson(v=>{v.phase='complete';}),'마지막 판이 아닌데 완료');
 reject(editLesson(v=>{v.levelIndex=99;}),'없는 판');
 reject(editLesson(v=>{const row=v.game.board.findIndex(r=>r.includes(null));v.game.board[row][v.game.board[row].indexOf(null)]='wQ';}),'교재로 만들 수 없는 배치');
 reject(editLesson(v=>{v.reply=[0,0,0,0];}),'교재와 다른 응수');
 reject(editLesson(v=>{v.move=[v.move[0],v.move[1],9,v.move[3]];}),'범위 밖 좌표');
 reject(editLesson(v=>{v.solved=[true];}),'판 수와 다른 기록');
 reject(editLesson((v,s)=>{s.history=Array(121).fill({values:{lesson:v}});}),'초과 배열');
 reject(editLesson(v=>{v.result='<img src=x onerror=alert(1)>';}),'스크립트 문자열');
 reject(f=>{const p=JSON.parse(f.data.lesson_progress_v1);p['protect-escape-v3'].lastSceneId='all-01';f.data.lesson_progress_v1=JSON.stringify(p);},'다른 수업의 판');
 reject(f=>{const all=JSON.parse(f.data.lesson_sessions_v1);all['protect-escape-v3']=all['protect-capture-v3'];f.data.lesson_sessions_v1=JSON.stringify(all);},'다른 수업 ID 아래 저장');
});

test('예전(v1·v2) 체스 수업 자료가 든 파일과 기기 저장은 오류 없이 버리고 나머지는 그대로 가져온다',()=>{
 const a=load();a.run("startSolo(0);soloClick(3,0);soloClick(3,2);leaveActivity()");finish(a.run,a.timers,'protect-escape-v3');a.run('leaveActivity()');
 const file=JSON.parse(a.run('JSON.stringify(createProfileBackup())'));
 // 이전 배포본이 남긴 형태: v1(2026.11.07.1~.2)과 v2(2026.11.07.3) 수업 자료를 섞는다.
 const oldLesson=(id,cv)=>({version:5,rulesVersion:2,kind:'lesson',params:{id},snapshot:{values:{lesson:{lessonId:id,contentVersion:cv,levelIndex:0,phase:'choose'}},randomSeed:1,supportLevel:0},history:[],complete:false,updatedAt:1});
 const v1=oldLesson('protect-spot-v1',1),v2=oldLesson('protect-capture-v2',2);
 const oldPractice={version:5,rulesVersion:2,kind:'play',params:{},snapshot:{values:{game:{},play:{mode:'ai',content:{version:1,type:'lessonPractice',lessonId:'protect-all-v2',lessonVersion:2,sceneId:'all-5'}}}},history:[],complete:false,updatedAt:1};
 const sessions=JSON.parse(file.data.sessions||'{}');sessions.lesson=v2;sessions.play=oldPractice;file.data.sessions=JSON.stringify(sessions);file.data.last_session=JSON.stringify(v1);
 file.data.lesson_sessions_v1=JSON.stringify({...JSON.parse(file.data.lesson_sessions_v1||'{}'),'protect-spot-v1':v1,'protect-capture-v2':v2});
 file.data.lesson_progress_v1=JSON.stringify({...JSON.parse(file.data.lesson_progress_v1),'protect-spot-v1':{version:1,completed:true,assisted:false,independent:true,lastSceneId:'protect-spot-transfer-v1'},'protect-escape-v2':{version:1,completed:true,assisted:false,independent:true,lastSceneId:'escape-5'}});
 file.data.play_content_saves=JSON.stringify({...JSON.parse(file.data.play_content_saves||'{}'),lessonPractice:oldPractice});
 const b=load();const parsed=J(b.run,`parseProfileBackup(${JSON.stringify(JSON.stringify(file))})`);
 assert.equal(parsed.data.last_session,undefined);assert.deepEqual(Object.keys(JSON.parse(parsed.data.sessions)).sort(),['solo']);assert.deepEqual(Object.keys(JSON.parse(parsed.data.lesson_progress_v1)),['protect-escape-v3']);
 assert.equal(JSON.parse(parsed.data.play_content_saves).lessonPractice,undefined);assert.deepEqual(Object.keys(JSON.parse(parsed.data.lesson_sessions_v1)),[]);
 b.run(`switchProfile(importProfileBackup(${JSON.stringify(parsed)}).id);resumeActivity('solo')`);assert.equal(b.run('state.solo.pieces.length'),2);assert.equal(J(b.run,"lessonProgressAll()['protect-escape-v3'].completed"),true);
 // 같은 기기에 남은 예전 기록: 새 수업 목록은 '처음'으로 보이고, 기록을 고쳐 쓸 때 예전 항목은 사라진다.
 const c=load({'chess.child.lesson_progress_v1':JSON.stringify({'protect-escape-v2':{version:1,completed:true,assisted:false,independent:true,lastSceneId:'escape-5'}}),'chess.child.sessions':JSON.stringify({lesson:v2}),'chess.child.last_session':JSON.stringify(v2)});
 c.run("renderHome();goLessons('home')");assert.equal((c.elements.get('screen-lesson').innerHTML.match(/lesson-status-new/g)||[]).length,15);assert.doesNotMatch(c.elements.get('screen-home').innerHTML,/이어서 놀기/);
 c.run("openLesson('protect-escape-v3')");assert.deepEqual(Object.keys(J(c.run,"readData('lesson_progress_v1',{})")),['protect-escape-v3']);
});

test('이전 v1~v4 파일은 그대로 읽고, 다른 놀이의 저장 버전 계산은 바뀌지 않는다',()=>{
 const {run}=load();
 assert.deepEqual(J(run,"[sessionVersion('mission',{}),sessionVersion('knight',{kt:{mode:'tour'}}),sessionVersion('knight',{kt:{mode:'puzzle'}}),sessionVersion('solo',{}),sessionVersion('play',{play:{content:{type:'scene'}}}),sessionVersion('play',{play:{}}),sessionVersion('challenge',{ch:{spec:{version:2}}}),sessionVersion('lesson',{}),sessionVersion('play',{play:{content:{type:'lessonPractice'}}})]"),[1,1,2,3,3,1,4,5,5]);
 const a=load();a.run("goKnightTour(0,'tour');knightTourClick(2,1);leaveActivity()");const v1=a.run('JSON.stringify(createProfileBackup())');assert.equal(JSON.parse(v1).version,1);
 const b=load();b.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(v1)})).id);enterActivity('knight')`);assert.equal(b.run('state.kt.moveCount'),1);
 const c=load();c.run("startSolo(0);soloClick(3,0);soloClick(3,2);leaveActivity()");const v3=c.run('JSON.stringify(createProfileBackup())');assert.equal(JSON.parse(v3).version,3);
 const d=load();d.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(v3)})).id);resumeActivity('solo')`);assert.equal(d.run('state.solo.pieces.length'),2);
 assert.throws(()=>d.run(`parseProfileBackup(${JSON.stringify(JSON.stringify({...JSON.parse(v3),version:8}))})`),/이 버전의 파일은/);
});

test('프로필 파일 v6: 새 수업의 진행·💡 기록·무한 연습 판과 기록이 새 기기에서 그대로 이어지고, 변조는 거부한다. 원래 세 수업만 쓴 파일은 v5 그대로',()=>{
 const a=load();a.run("openLesson('mate-v1')");play(a.run,a.timers,level(a.run).witness);a.run('lessonPrimary()');const t=level(a.run).trap;play(a.run,a.timers,t);a.run('lessonPrimary()');play(a.run,a.timers,t);a.run('lessonSecondary()');play(a.run,a.timers,level(a.run).witness);a.run('lessonPrimary()');
 a.run("startLessonDrill('pin-v1',0,4242)");flush(a.timers);play(a.run,a.timers,level(a.run).witness);a.run('lessonPrimary()');flush(a.timers);const fen=a.run('state.lesson.fen');a.run('leaveActivity()');
 const text=a.run('JSON.stringify(createProfileBackup())'),file=JSON.parse(text);assert.equal(file.version,6);
 assert.deepEqual(JSON.parse(file.data.lesson_progress_v1)['mate-v1'].helped,['mate-02']);
 const b=load();b.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(text)})).id)`);
 b.run("resumeActivity('lesson')");assert.deepEqual([b.run('state.lesson.mode'),b.run('state.lesson.fen')],['drill',fen]);assert.deepEqual(J(b.run,"lessonDrillStats('pin-v1').solved"),[1,0,0,0,0]);
 b.run("openLesson('mate-v1')");assert.deepEqual([b.run('state.lesson.levelIndex'),b.run('state.lesson.phase')],[2,'choose']);assert.deepEqual(J(b.run,'state.lesson.solved').slice(0,3),[true,true,false]);
 const reject=(change,label)=>{const f=JSON.parse(text);change(f);assert.throws(()=>b.run(`parseProfileBackup(${JSON.stringify(JSON.stringify(f))})`),/읽지 못했어요|안전하지 않은|올바르지 않아요/,label);};
 const editDrill=fn=>f=>{const s=JSON.parse(f.data.sessions);fn(s.lesson.snapshot.values.lesson);f.data.sessions=JSON.stringify(s);};
 reject(editDrill(v=>{v.fen='8/8/8/8/8/8/8/K6k w - - 0 1';}),'단계 조건에 맞지 않는 배치');reject(editDrill(v=>{v.tier=9;}),'없는 단계');reject(editDrill(v=>{v.mode='free';}),'모르는 방식');
 reject(f=>{const d=JSON.parse(f.data.lesson_drill_v1);d.lessons['pin-v1'].best=[1];f.data.lesson_drill_v1=JSON.stringify(d);},'무한 연습 기록 형식');
 reject(f=>{const p=JSON.parse(f.data.lesson_progress_v1);p['mate-v1'].helped=['mate-01'];f.data.lesson_progress_v1=JSON.stringify(p);},'✓와 💡에 같은 판');
 reject(f=>{const all=JSON.parse(f.data.lesson_sessions_v1||'{}');all['pin-v1']=JSON.parse(f.data.sessions).lesson;f.data.lesson_sessions_v1=JSON.stringify(all);},'무한 연습을 수업 이어하기 저장에 넣음');
 // 원래 세 수업만, 💡 없이 쓴 기록은 예전 앱도 읽는 v5로 남는다.
 const c=load();finish(c.run,c.timers,'protect-escape-v3');c.run('leaveActivity()');assert.equal(JSON.parse(c.run('JSON.stringify(createProfileBackup())')).version,5);
});
