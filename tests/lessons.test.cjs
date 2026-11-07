// 체스 수업 흐름 (docs/lessons/LESSON_REDESIGN_V2.md). 결과는 실제 입력 함수(lessonClick 등)로만 만든다.
// 판 좌표는 박아 두지 않고 판 데이터(예시 정답·함정)에서 읽는다.
const test=require('node:test'),assert=require('node:assert/strict'),harness=require('./harness.cjs');
// 사람의 연속 탭과 달리 검사는 같은 순간에 진행 버튼을 부르므로, 연타 방지 시각만 비우고 원래 함수를 부른다(연타 검사는 원래 함수 그대로).
const load=(initial)=>{const h=harness(initial);h.run('const __lessonPrimary=lessonPrimary;lessonPrimary=()=>{lessonChangedAt=0;return __lessonPrimary();}');return h;};
const J=(run,expr)=>JSON.parse(run(`JSON.stringify(${expr})`));
const flush=timers=>{for(let n=0;timers.length&&n<100;n++)timers.splice(0).forEach(cb=>cb());};
const play=(run,timers,[a,b,c,d])=>{run(`lessonClick(${a},${b});lessonClick(${c},${d})`);flush(timers);};
const level=run=>J(run,'lessonContext().level');
const html=elements=>elements.get('screen-lesson').innerHTML;
const text=run=>run('lessonFeedback(lessonView()).html').replace(/<[^>]+>/g,'');
const headline=run=>run('(()=>{const {l,lesson,level}=lessonContext();return lessonHeadline(l,lesson,level).html;})()').replace(/<[^>]+>/g,'');
function finish(run,timers,id){run(`openLesson('${id}')`);const n=J(run,`lessonById('${id}').levels.length`);for(let i=0;i<n;i++){play(run,timers,level(run).witness);assert.equal(run('state.lesson.result'),'success');run('lessonPrimary()');}assert.equal(run('state.lesson.phase'),'complete');}

test('판 하나: 내 말을 고르면 갈 칸, 상대 말을 누르면 그 말이 갈 칸, 빈칸은 안내만. 위험한 수는 상대가 실제로 잡고 멈춘다',()=>{
 const {run,timers,elements}=load();run("openLesson('protect-escape-v3')");const lv=level(run);
 let h=html(elements);assert.ok(h.includes('🎯 '+lv.goal));assert.match(h,/나 = 흰색/);assert.match(h,/판 1\/15 · 첫걸음/);assert.match(h,/lesson-arrow-attack/,'첫 판은 공격선을 처음부터 보여준다');
 assert.ok((h.match(/lesson-owner mine/g)||[]).length>=2&&(h.match(/lesson-owner theirs/g)||[]).length>=2,'나/상대 표시');assert.match(text(run),/옮길 내 말\(흰색\)을 눌러요/);
 const empty=J(run,'(()=>{const b=state.lesson.game.board;for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(!b[r][c])return [r,c];})()'),enemy=J(run,"(()=>{const b=state.lesson.game.board;for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(b[r][c]&&b[r][c][0]==='b'&&b[r][c][1]!=='K')return [r,c];})()");
 run(`lessonClick(${empty})`);assert.equal(run('state.lesson.notice'),'pickOwn');assert.equal(run('state.lesson.attempts'),0);
 run(`lessonClick(${enemy})`);assert.deepEqual(J(run,'state.lesson.inspect'),enemy);assert.match(text(run),/빨간 점 칸으로 갈 수 있어요/);assert.match(html(elements),/lesson-reach/);
 const t=lv.trap;run(`lessonClick(${t[0]},${t[1]})`);assert.deepEqual(J(run,'state.lesson.selected'),[t[0],t[1]]);assert.match(text(run),/점이 찍힌 칸을 눌러 옮겨요/);
 run(`lessonClick(${t[2]},${t[3]})`);assert.equal(run('state.lesson.phase'),'response');assert.match(text(run),/상대\(검은색\) 차례/);
 flush(timers);assert.equal(run('state.lesson.result'),'fail');const reply=J(run,'state.lesson.reply');assert.equal(run(`state.lesson.game.board[${reply[2]}][${reply[3]}][0]`),'b','상대가 실제로 잡음');
 assert.match(text(run),/^✗ (상대 .+잡았어요|.+잡았지만).*다시 해보기/);assert.equal(headline(run),'✗ 잡혔어요! 다시 해봐요');
 h=html(elements);assert.match(h,/lesson-board-no/);assert.match(h,/lesson-next[^"]*" onclick="lessonPrimary\(\)" >↶ 다시 해보기/,'다음 버튼 강조');assert.match(h,/잡힘/);
 run('lessonClick(0,0)');assert.equal(run('state.lesson.phase'),'result','결과 뒤 판 누름은 진행 버튼을 짚을 뿐');
 run('lessonPrimary()');assert.equal(run('state.lesson.phase'),'choose');assert.equal(run('lessonBoardKey(state.lesson.game)'),run('lessonBoardKey(lessonLevelGame(lessonContext().level))'));
 // 예시와 다른 안전한 수도 성공. 성공은 목표 칸과 판 테두리로 분명히 알린다.
 const other=J(run,`(()=>{const lv=lessonContext().level,g=lessonLevelGame(lv);return g.allMoves().find(m=>lessonOutcome(g,m,lv).result==='success'&&String(m)!==String(lv.witness))||lv.witness;})()`);
 play(run,timers,other);assert.equal(run('state.lesson.result'),'success');assert.match(text(run),/^✓ .*다음 판/);assert.equal(headline(run),'🎉 판 1 성공! 1/15 클리어');
 h=html(elements);assert.match(h,/lesson-board-ok/);assert.match(h,/lesson-safe/);assert.match(h,/aria-valuenow="1"/);
 run('lessonPrimary()');assert.equal(run('state.lesson.levelIndex'),1);assert.doesNotMatch(html(elements),/lesson-arrow-attack/,'둘째 판부터는 공격선을 스스로 찾는다');
});

test('힌트: 1단계는 상대가 노리는 말(없으면 지키는 칸), 2단계는 예시 정답 화살표. 수를 대신 두지 않고, 실패 뒤 힌트는 다시 시작하며 보여준다',()=>{
 const {run,timers,elements}=load();run("openLesson('protect-escape-v3')");play(run,timers,level(run).witness);run('lessonPrimary()');
 const board=run('lessonBoardKey(state.lesson.game)');run('lessonHint()');assert.match(text(run),/빨간 화살표: 상대가 노리는 내 말/);assert.match(html(elements),/lesson-arrow-attack/);
 run('lessonHint()');assert.match(text(run),/초록 화살표처럼/);assert.match(html(elements),/lesson-arrow-suggest/);run('lessonHint()');assert.equal(run('state.lesson.hintLevel'),2);
 assert.equal(run('lessonBoardKey(state.lesson.game)'),board,'힌트는 수를 두지 않는다');assert.equal(run('state.lesson.helpUsed'),true);
 // 잡기 수업 첫 판: 노려지는 말이 없으면 '그 칸을 지키는 상대 말'을 보여준다.
 run("openLesson('protect-capture-v3')");assert.match(html(elements),/lesson-arrow-attack/);assert.equal(J(run,'lessonThreatMarks(lessonView().start)').kind,'defended');
 play(run,timers,level(run).trap);assert.equal(run('state.lesson.result'),'fail');run('lessonSecondary()');assert.deepEqual([run('state.lesson.phase'),run('state.lesson.hintLevel')],['choose',1],'힌트 보고 다시');
 assert.match(text(run),/상대가 지키는 칸/);
 // 잡지 않는 수는 목표 미달로 알려주고 상대는 움직이지 않는다.
 const quiet=J(run,`(()=>{const lv=lessonContext().level,g=lessonLevelGame(lv);return g.allMoves().find(m=>lessonOutcome(g,m,lv).result==='goal');})()`);
 play(run,timers,quiet);assert.equal(run('state.lesson.result'),'goal');assert.equal(run('state.lesson.reply'),null);assert.match(text(run),/상대 말을 하나 잡아야 해요/);assert.equal(headline(run),'✗ 아직 목표를 이루지 못했어요');
});

test('15판을 모두 성공해야 수업이 끝나고, 힌트 사용 여부로 도움/혼자를 나눈다. 마지막 수업 다음은 대전 입구',()=>{
 const {run,timers}=load();run("openLesson('protect-capture-v3');lessonHint()");play(run,timers,level(run).witness);
 for(let i=1;i<15;i++){run('lessonPrimary()');assert.match(run('lessonStatusHTML(state.lesson,lessonContext().lesson)'),new RegExp(`판 ${i+1}/15 · `+['첫걸음','쉬움','보통','어려움','도전'][Math.floor(i/3)]));play(run,timers,level(run).witness);}
 assert.equal(J(run,"readData('lesson_progress_v1',{})['protect-capture-v3'].completed"),false,'마지막 판 성공만으로는 아직');
 run('lessonPrimary()');assert.equal(run('state.lesson.phase'),'complete');assert.equal(headline(run),'🏆 15판 모두 성공!');assert.match(text(run),/수업을 마쳤어요.*다음 수업/);
 assert.deepEqual(J(run,"readData('lesson_progress_v1',{})['protect-capture-v3']"),{version:1,completed:true,assisted:true,independent:false,lastSceneId:'capture-15'});
 finish(run,timers,'protect-capture-v3');assert.deepEqual(J(run,"readData('lesson_progress_v1',{})['protect-capture-v3']"),{version:1,completed:true,assisted:true,independent:true,lastSceneId:'capture-15'});
 assert.ok(run("learningSummary().some(r=>r.label==='체스 수업 · 잡을 때도 조심하기'&&r.independent===1&&r.assisted===1)"));
 run('lessonPrimary()');assert.equal(run('state.lesson.lessonId'),'protect-all-v3','다음 수업');
 finish(run,timers,'protect-all-v3');run('lessonPrimary()');assert.equal(run('state.screen'),'play','마지막 수업 뒤에는 대전 입구');
 run('showScreen("home");renderHome()');assert.equal(run('recommendedActivity().action'),'goPlay()');
 const h=load();finish(h.run,h.timers,'protect-escape-v3');h.run('leaveActivity()');assert.equal(h.run('recommendedActivity().action'),"openLesson('protect-capture-v3')");
});

test('응수 중 저장·앱 종료는 그 판의 처음으로 남고, 목록·홈·프로필로 가면 예약된 잡기가 유령처럼 일어나지 않는다',()=>{
 const a=load();a.run("openLesson('protect-escape-v3')");play(a.run,a.timers,level(a.run).witness);a.run('lessonPrimary()');const t=level(a.run).trap;a.run(`lessonClick(${t[0]},${t[1]});lessonClick(${t[2]},${t[3]})`);assert.equal(a.run('state.lesson.phase'),'response');
 const saved=J(a.run,"readData('sessions',{}).lesson");assert.equal(saved.version,5);const v=saved.snapshot.values.lesson;assert.deepEqual([v.phase,v.levelIndex,v.move,v.contentVersion],['choose',1,null,3]);assert.equal(v.selected,undefined,'선택은 저장하지 않음');
 assert.equal(a.run(`lessonBoardKey(${JSON.stringify(v.game)})`),a.run('lessonBoardKey(lessonLevelGame(lessonContext().level))'));
 const b=load(Object.fromEntries(a.storage));b.run('resumeActivity()');assert.deepEqual([b.run('state.lesson.phase'),b.run('state.lesson.levelIndex')],['choose',1]);flush(b.timers);assert.equal(b.run('state.lesson.phase'),'choose','복원 뒤 자동 이동 없음');
 assert.deepEqual(J(b.run,'state.lesson.solved').slice(0,2),[true,false]);
 for(const leave of ["goLessons()","showScreen('home');renderHome()","switchProfile(createProfile('둘째','🐱').id)"]){
  const {run,timers,storage}=load();run("openLesson('protect-escape-v3')");const tr=level(run).trap;run(`lessonClick(${tr[0]},${tr[1]});lessonClick(${tr[2]},${tr[3]})`);run(leave);flush(timers);
  const s=JSON.parse(storage.get('chess.child.lesson_sessions_v1'))['protect-escape-v3'].snapshot.values.lesson;assert.equal(s.phase,'choose',leave);assert.equal(s.move,null,leave+' 유령 잡기 없음');assert.equal(s.attempts,0);
 }
 const c=load();c.run("openLesson('protect-escape-v3')");play(c.run,c.timers,level(c.run).trap);const d=load(Object.fromEntries(c.storage));d.run("openLesson('protect-escape-v3')");
 assert.equal(d.run('state.lesson.result'),'fail','끝난 실패는 결과 그대로');d.run('lessonPrimary()');assert.equal(d.run('state.lesson.phase'),'choose');
});

test('수업 목록: 다른 놀이의 저장판을 섞지 않고, 세 수업을 오가도 각각 이어하며, 처음부터 다시는 그 수업만 지운다',()=>{
 const {run,timers,elements}=load();run("playStart();playCommitMove([6,4,4,4]);startSolo(0);goLessons('home')");
 let h=html(elements);assert.equal((h.match(/lesson-status-new/g)||[]).length,3);assert.doesNotMatch(h,/이어하기|resume-card/);assert.match(h,/세 수업 · 45판/);assert.match(h,/첫걸음 → 쉬움 → 보통 → 어려움 → 도전/);
 run("openLesson('protect-escape-v3')");play(run,timers,level(run).witness);run('lessonPrimary()');
 run("openLesson('protect-capture-v3')");play(run,timers,level(run).trap);
 run("openLesson('protect-all-v3');lessonHint()");
 run('goLessons()');h=html(elements);assert.equal((h.match(/lesson-status-resume/g)||[]).length,3);assert.match(h,/이어하기 · 판 2\/15/);
 assert.match(h,/restartLesson\('protect-escape-v3'\)[\s\S]*↺ 처음부터 다시[\s\S]*openLesson\('protect-escape-v3'\)[\s\S]*▶ 이어하기/);
 run("openLesson('protect-escape-v3')");assert.equal(run('state.lesson.levelIndex'),1);run("openLesson('protect-capture-v3')");assert.equal(run('state.lesson.result'),'fail');run("openLesson('protect-all-v3')");assert.equal(run('state.lesson.hintLevel'),1);
 run("goLessons();globalThis.choice=null;showChoice=(m,c)=>{choice={m,c};};restartLesson('protect-escape-v3')");assert.match(run('choice.m'),/첫 판부터 다시/);run('choice.c[0].action()');
 assert.deepEqual([run('state.lesson.levelIndex'),run('state.lesson.phase')],[0,'choose']);run('goLessons()');assert.ok(run("!!lessonSavedSession('protect-capture-v3')&&!!lessonSavedSession('protect-all-v3')"));
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
 const h=harness(),{run,timers}=h;run("openLesson('protect-escape-v3')");
 for(let i=0;i<15;i++){play(run,timers,level(run).witness);run('lessonChangedAt=0;lessonPrimary()');}
 assert.equal(run('state.lesson.phase'),'complete');run('lessonPrimary()');assert.equal(run('state.lesson.lessonId'),'protect-escape-v3','두 번째 탭은 무시');
 run('lessonChangedAt=Date.now()-1000;lessonPrimary()');assert.equal(run('state.lesson.lessonId'),'protect-capture-v3','잠시 뒤에는 다음 수업');
});
