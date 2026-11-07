// 체스 수업 흐름 (docs/lessons/LESSON_REDESIGN_V2.md, LESSON_EXPANSION_V4.md). 결과는 실제 입력 함수(lessonClick 등)로만 만든다.
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
 assert.ok((h.match(/lesson-owner mine/g)||[]).length>=2&&(h.match(/lesson-owner theirs/g)||[]).length>=2,'나/상대 표시');assert.match(text(run),/빨간 화살표: 상대가 노리는 내 말.*내 말\(흰색\)을 눌러/);assert.match(h,/disabled>💡 힌트 보는 중/,'첫 판은 힌트가 이미 켜져 있다');
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

test('힌트: 같은 판에서 두 번 해본 뒤에 열리고, 정답 화살표 없이 생각할 곳만 보여 준다. 힌트로 성공한 판은 💡, 힌트 없이 다시 풀면 ✓',()=>{
 const {run,timers,elements}=load();run("openLesson('protect-escape-v3')");play(run,timers,level(run).witness);run('lessonPrimary()');
 const board=run('lessonBoardKey(state.lesson.game)'),sec=()=>run('lessonSecondaryLabel(state.lesson,lessonContext().level)');
 assert.equal(sec(),'🔒 힌트 0/2');run('lessonHint()');assert.equal(run('state.lesson.hintLevel'),0,'아직 잠김');assert.equal(run('state.lesson.notice'),'hintLocked');assert.match(text(run),/2번 해본 뒤에 열려요/);assert.equal(run('state.lesson.helpUsed'),false);
 play(run,timers,level(run).trap);assert.equal(run('state.lesson.fails'),1);assert.equal(sec(),'🔒 힌트 1/2');assert.match(html(elements),/disabled>🔒 힌트 1\/2/,'결과 화면의 잠긴 힌트는 누를 수 없다');
 run('lessonSecondary()');assert.equal(run('state.lesson.phase'),'result','잠긴 힌트는 아무것도 하지 않는다');
 run('lessonPrimary()');play(run,timers,level(run).trap);assert.equal(run('state.lesson.fails'),2);assert.equal(sec(),'💡 힌트 보고 다시');
 run('lessonSecondary()');assert.deepEqual([run('state.lesson.phase'),run('state.lesson.hintLevel')],['choose',1],'힌트 보고 다시');assert.match(text(run),/빨간 화살표: 상대가 노리는 내 말/);
 assert.match(html(elements),/lesson-arrow-attack/);assert.doesNotMatch(html(elements),/lesson-arrow-suggest|초록 화살표/,'정답 화살표는 없다');assert.equal(run('lessonBoardKey(state.lesson.game)'),board,'힌트는 수를 두지 않는다');assert.equal(run('state.lesson.helpUsed'),true);
 play(run,timers,level(run).witness);assert.equal(headline(run),'🎉 판 2 성공! 💡 2/15 클리어');assert.match(text(run),/힌트 없이 다시 풀면 ✓가 돼요/);
 assert.deepEqual(J(run,"[readData('lesson_progress_v1',{})['protect-escape-v3'].solved,readData('lesson_progress_v1',{})['protect-escape-v3'].helped]"),[['escape-01'],['escape-02']]);
 run("globalThis.dialogs=[];showActivityDialog=(title,html,actions)=>{dialogs.push({title,html,labels:actions.map(a=>a.label)});};lessonPicker()");const d=J(run,'dialogs.at(-1)');
 assert.match(d.html,/aria-label="판 1 · 첫걸음 · 혼자 성공"[^>]*>1 ✓/);assert.match(d.html,/lesson-pick helped[^"]*" aria-label="판 2 · 첫걸음 · 힌트로 성공[^"]*"[^>]*>2 💡/);assert.match(d.html,/✓ 1 · 💡 1 \/ 15/);
 // 같은 판을 힌트 없이 다시 풀면 ✓로 바뀐다(💡 목록에서 빠짐).
 run("lessonPickLevel('protect-escape-v3',1)");assert.equal(run('state.lesson.hintLevel'),0,'판을 다시 열면 힌트도 다시 잠김');play(run,timers,level(run).witness);assert.equal(headline(run),'🎉 판 2 성공! 2/15 클리어');
 assert.deepEqual(J(run,"readData('lesson_progress_v1',{})['protect-escape-v3']").solved,['escape-01','escape-02']);assert.equal(J(run,"readData('lesson_progress_v1',{})['protect-escape-v3']").helped,undefined,'💡가 없으면 기록에서 뺀다');
 // 잡기 수업 첫 판: 노려지는 말이 없으면 '그 칸을 지키는 상대 말'을 보여준다(첫 판은 처음부터 켜짐).
 run("openLesson('protect-capture-v3')");assert.match(html(elements),/lesson-arrow-attack/);assert.equal(J(run,'lessonThreatMarks(lessonView().start)').kind,'defended');assert.match(text(run),/상대가 지키는 칸/);
 play(run,timers,level(run).trap);assert.equal(run('state.lesson.result'),'fail');run('lessonPrimary()');
 // 잡지 않는 수는 목표 미달로 알려주고 상대는 움직이지 않는다.
 const quiet=J(run,`(()=>{const lv=lessonContext().level,g=lessonLevelGame(lv);return g.allMoves().find(m=>lessonOutcome(g,m,lv).result==='goal');})()`);
 play(run,timers,quiet);assert.equal(run('state.lesson.result'),'goal');assert.equal(run('state.lesson.reply'),null);assert.match(text(run),/상대 말을 하나 잡아야 해요/);assert.equal(headline(run),'✗ 아직 목표를 이루지 못했어요');
});

test('15판을 모두 성공(✓ 또는 💡)하면 수업 완료가 기록되고 마지막 판에서 수업 마치기, 💡 판이 있으면 도움, 모두 ✓면 혼자 성공. 마지막 수업 다음은 대전 입구',()=>{
 const {run,timers}=load();run("openLesson('protect-capture-v3')");play(run,timers,level(run).witness);
 for(let i=1;i<15;i++){run('lessonPrimary()');assert.match(run('lessonStatusHTML(state.lesson,lessonContext().lesson)'),new RegExp(`판 ${i+1}/15 · `+['첫걸음','쉬움','보통','어려움','도전'][Math.floor(i/3)]));
  if(i===1){play(run,timers,level(run).trap);run('lessonPrimary()');play(run,timers,level(run).trap);run('lessonSecondary()');assert.equal(run('state.lesson.hintLevel'),1);}
  if(i===13)assert.equal(J(run,"readData('lesson_progress_v1',{})['protect-capture-v3'].completed"),false,'한 판이라도 남으면 아직');play(run,timers,level(run).witness);}
 assert.equal(J(run,"readData('lesson_progress_v1',{})['protect-capture-v3'].completed"),true,'15판을 모두 성공한 순간 기록');assert.equal(J(run,"readData('lesson_progress_v1',{})['protect-capture-v3'].solved.length"),14);
 run('lessonPrimary()');assert.equal(run('state.lesson.phase'),'complete');assert.equal(headline(run),'🏆 15판 모두 성공!');assert.match(text(run),/수업을 마쳤어요.*다음 수업/);
 const solvedAll=J(run,"lessonById('protect-capture-v3').levels.map(l=>l.id)");
 assert.deepEqual(J(run,"readData('lesson_progress_v1',{})['protect-capture-v3']"),{version:1,completed:true,assisted:true,independent:false,lastSceneId:'capture-15',solved:solvedAll.filter(id=>id!=='capture-02'),helped:['capture-02']});
 finish(run,timers,'protect-capture-v3');const after=J(run,"readData('lesson_progress_v1',{})['protect-capture-v3']");assert.deepEqual({...after,solved:after.solved.slice().sort()},{version:1,completed:true,assisted:true,independent:true,lastSceneId:'capture-15',solved:solvedAll.slice().sort()});
 assert.ok(run("learningSummary().some(r=>r.label==='체스 수업 · 잡을 때도 조심하기'&&r.independent===1&&r.assisted===1)"));
 run('lessonPrimary()');assert.equal(run('state.lesson.lessonId'),'protect-all-v3','다음 수업');
 finish(run,timers,'protect-all-v3');run('lessonPrimary()');assert.equal(run('state.lesson.lessonId'),'guard-v1','셋째 수업 다음은 새 단원의 첫 수업');
 finish(run,timers,'promote-v1');assert.equal(run('lessonPrimaryLabel(state.lesson,lessonContext().lesson)'),'대전에 써보기 ▶');run('lessonPrimary()');assert.equal(run('state.screen'),'play','마지막 수업 뒤에는 대전 입구');
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

test('수업 목록: 5단원 15개 주제, 다른 놀이의 저장판을 섞지 않고, 수업을 오가도 각각 이어하며, 처음부터 다시는 그 수업만 지운다',()=>{
 const {run,timers,elements}=load();run("playStart();playCommitMove([6,4,4,4]);startSolo(0);goLessons('home')");
 let h=html(elements);assert.equal((h.match(/lesson-status-new/g)||[]).length,15);assert.doesNotMatch(h,/이어하기|resume-card/);assert.match(h,/5단원 · 15개 주제 · 225판/);assert.match(h,/첫걸음 → 쉬움 → 보통 → 어려움 → 도전/);
 assert.deepEqual([...h.matchAll(/lesson-unit-title">([^<]+)/g)].map(m=>m[1]),['내 말 지키기','말의 가치','체크와 체크메이트','전술','특별한 수']);assert.equal((h.match(/∞ 무한 연습<\/button>/g)||[]).length,15);
 run("openLesson('protect-escape-v3')");play(run,timers,level(run).witness);run('lessonPrimary()');
 run("openLesson('protect-capture-v3')");play(run,timers,level(run).trap);
 run("lessonPickLevel('protect-all-v3',4)");
 run('goLessons()');h=html(elements);assert.equal((h.match(/lesson-status-resume/g)||[]).length,3);assert.match(h,/이어하기 · 판 2\/15/);
 assert.match(h,/lessonPicker\('protect-escape-v3'\)">☰ 판 고르기 · 1\/15[\s\S]*lessonDrillDialog\('protect-escape-v3'\)">∞ 무한 연습[\s\S]*openLesson\('protect-escape-v3'\)">▶ 이어하기/);
 run("openLesson('protect-escape-v3')");assert.equal(run('state.lesson.levelIndex'),1);run("openLesson('protect-capture-v3')");assert.equal(run('state.lesson.result'),'fail');run("openLesson('protect-all-v3')");assert.equal(run('state.lesson.levelIndex'),4);
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

test('판 고르기: 잠금 없이 아무 판이나 바로 시작하고, 성공 표시는 판별로 남으며, 어떤 순서로든 모두 성공하면 완료로 기록한다',()=>{
 const {run,timers,elements}=load();run("globalThis.dialogs=[];showActivityDialog=(title,html,actions)=>{dialogs.push({title,html,labels:actions.map(a=>a.label),actions});};goLessons('home')");
 assert.match(html(elements),/lessonPicker\('protect-all-v3'\)">☰ 판 고르기 · 0\/15[\s\S]*openLesson\('protect-all-v3'\)">▶ 시작하기/,'처음 수업도 판 고르기');
 run("lessonPicker('protect-all-v3')");let d=J(run,'dialogs.at(-1)');assert.equal(d.title,'3. 내 말 모두 지키기 · 판 고르기');assert.equal((d.html.match(/class="lesson-pick[ "]/g)||[]).length,15);
 for(const tier of ['첫걸음','쉬움','보통','어려움','도전'])assert.match(d.html,new RegExp(tier));assert.deepEqual(d.labels,['닫기','∞ 무한 연습','↺ 1판부터 다시']);
 // 잘하는 사람은 바로 도전 단계로: 13판부터.
 run("lessonPickLevel('protect-all-v3',12)");assert.deepEqual([run('state.lesson.lessonId'),run('state.lesson.levelIndex'),run('state.screen')],['protect-all-v3',12,'lesson']);assert.match(html(elements),/판 13\/15 · 도전/);
 play(run,timers,level(run).witness);assert.equal(run('state.lesson.result'),'success');assert.equal(run('lessonPrimaryLabel(state.lesson,lessonContext().lesson)'),'다음 판 ▶');
 run('lessonPrimary()');run('lessonPrimary()');assert.equal(run('state.lesson.levelIndex'),13);
 // 수업 안에서도 판 고르기: ✓와 지금 판 표시, 고르면 그 판으로.
 run('lessonPicker()');d=J(run,'dialogs.at(-1)');assert.match(d.html,/aria-label="판 13 · 도전 · 혼자 성공"[^>]*>13 ✓/);assert.match(d.html,/lesson-pick current" aria-label="판 14 · 도전 · 지금 판"/);
 run("lessonPickLevel('protect-all-v3',14)");play(run,timers,level(run).witness);assert.equal(run('lessonPrimaryLabel(state.lesson,lessonContext().lesson)'),'남은 판 하기 ▶','마지막 판이지만 안 푼 판이 남음');
 run('lessonPrimary()');assert.equal(run('state.lesson.levelIndex'),0,'아직 안 푼 첫 판으로');
 // 응수 중에 판을 골라도 예약된 잡기는 버려진다.
 const t=level(run).trap;run(`lessonClick(${t[0]},${t[1]});lessonClick(${t[2]},${t[3]})`);assert.equal(run('state.lesson.phase'),'response');run("lessonPickLevel('protect-all-v3',5)");flush(timers);
 assert.deepEqual([run('state.lesson.levelIndex'),run('state.lesson.phase'),run('state.lesson.move')],[5,'choose',null]);
 // 나머지 판을 거꾸로 풀어도 마지막으로 남은 판을 푸는 순간 완료가 기록된다.
 for(const i of [13,11,10,9,8,7,6,4,3,2,1,0]){run(`lessonPickLevel('protect-all-v3',${i})`);play(run,timers,level(run).witness);}
 assert.equal(J(run,"readData('lesson_progress_v1',{})['protect-all-v3'].completed"),false);run("lessonPickLevel('protect-all-v3',5)");play(run,timers,level(run).witness);
 assert.equal(J(run,"readData('lesson_progress_v1',{})['protect-all-v3'].completed"),true,'어떤 순서로든 모두 성공');assert.equal(run('lessonPrimaryLabel(state.lesson,lessonContext().lesson)'),'다음 판 ▶');
 // 목록에서 고르면 하던 판 위치만 바뀌고, 다시 열어도 ✓는 그대로.
 run("goLessons();lessonPicker('protect-all-v3')");assert.equal((J(run,'dialogs.at(-1)').html.match(/ ✓</g)||[]).length,15);
 run("lessonPickLevel('protect-all-v3',2)");assert.equal(run('state.lesson.levelIndex'),2);assert.equal(J(run,'state.lesson.solved').every(Boolean),true);
 // 기록의 판별 성공 목록도 파일 검증 대상이다.
 assert.equal(run("lessonProgressValid({'protect-all-v3':{version:1,completed:false,assisted:false,independent:false,lastSceneId:null,solved:['escape-01']}})"),false);
 assert.equal(run("lessonProgressValid({'protect-all-v3':{version:1,completed:false,assisted:false,independent:false,lastSceneId:null,solved:['all-01','all-01']}})"),false);
});

test('새 12개 수업: 판마다 함정은 상대의 실제 응수나 목표 미달로, 예시는 성공으로 끝나고, 첫 판은 주제별 힌트를 처음부터 보여 준다',()=>{
 const {run,timers,elements}=load();
 for(const id of J(run,'LESSONS.slice(3).map(l=>l.id)')){
  run(`openLesson('${id}')`);const lv=level(run);assert.ok(html(elements).includes('🎯 '+lv.goal),id);assert.match(text(run),/💡/,id+' 첫 판 힌트');
  play(run,timers,lv.trap);const r=run('state.lesson.result');assert.ok(['fail','goal'].includes(r),id);assert.match(text(run),/^✗ /,id);assert.match(headline(run),/^✗ /,id);
  if(r==='fail'&&run('state.lesson.reply')!==null)assert.notEqual(run('lessonBoardKey(state.lesson.game)'),run('lessonBoardKey(lessonContext().level&&lessonLevelGame(lessonContext().level))'),id+' 상대가 실제로 응수');
  run('lessonPrimary()');play(run,timers,lv.witness);assert.equal(run('state.lesson.result'),'success',id);assert.match(text(run),/^✓ /,id);assert.match(headline(run),/판 1 성공!/,id);
  run('lessonPrimary()');assert.equal(run('state.lesson.levelIndex'),1,id);
  // 둘째 판: 두 번 해본 뒤 힌트. 힌트 표시는 정답 수를 화살표로 그리지 않는다.
  const l2=level(run);play(run,timers,l2.trap);run('lessonPrimary()');play(run,timers,l2.trap);run('lessonSecondary()');assert.equal(run('state.lesson.hintLevel'),1,id);
  assert.match(text(run),/^💡/,id);assert.equal(J(run,"(lessonView().marks.arrows||[]).some(a=>String(a.slice(0,4))===String(lessonContext().level.witness))"),false,id);
 }
});

test('무한 연습: 단계를 고르면 시드로 정해진 새 판을 만들고, 힌트는 자유, 연속 기록·단계별 기록이 남고, 저장·복원·변조 거부가 된다',()=>{
 const {run,timers,elements,storage}=load();
 run("globalThis.dialogs=[];showActivityDialog=(title,html,actions)=>{dialogs.push({title,html,labels:actions.map(a=>a.label)});};lessonDrillDialog('fork-v1')");
 let d=J(run,'dialogs.at(-1)');assert.equal(d.title,'11. 포크(양수겸장) · 무한 연습');assert.equal((d.html.match(/class="lesson-drill-tier[ "]/g)||[]).length,5);assert.match(d.html,/매번 새 판/);
 run("startLessonDrill('fork-v1',0,12345)");assert.equal(run('state.lesson.phase'),'loading');assert.match(html(elements),/새 판을 만들고 있어요/);assert.match(html(elements),/판 #/);
 flush(timers);assert.equal(run('state.lesson.phase'),'choose');const fen=run('state.lesson.fen');assert.ok(fen);
 assert.equal(run("lgLevelFromFen('fork-v1',0,state.lesson.fen)!==null"),true,'단계 조건을 통과한 판');assert.match(html(elements),/∞ 첫걸음 · 연속 0/);assert.match(html(elements),new RegExp('판 #'+run('lgSeedCode(12345)')));
 // 같은 시드는 같은 판(다른 기기에서도)
 const other=load();other.run("startLessonDrill('fork-v1',0,12345)");flush(other.timers);assert.equal(other.run('state.lesson.fen'),fen);
 assert.equal(run('lessonSecondaryLabel(state.lesson,lessonContext().level)'),'💡 힌트','무한 연습 힌트는 처음부터');
 play(run,timers,level(run).witness);assert.equal(run('state.lesson.result'),'success');assert.match(headline(run),/성공! 연속 1/);assert.equal(run('lessonPrimaryLabel(state.lesson,lessonContext().lesson)'),'새 판 ▶');
 assert.deepEqual(J(run,"readData('lesson_drill_v1',null)"),{version:1,lessons:{'fork-v1':{solved:[1,0,0,0,0],helped:[0,0,0,0,0],best:[1,0,0,0,0]}}});
 run('lessonSecondary()');play(run,timers,level(run).witness);assert.deepEqual(J(run,"lessonDrillStats('fork-v1').solved"),[1,0,0,0,0],'같은 판을 한 번 더 성공한 것은 다시 세지 않음');
 run('lessonPrimary()');flush(timers);assert.equal(run('state.lesson.phase'),'choose');assert.notEqual(run('state.lesson.fen'),fen,'새 판');assert.equal(run('state.lesson.count'),2);
 play(run,timers,level(run).trap);assert.equal(run('state.lesson.streak'),0,'실패하면 연속 0');run('lessonSecondary()');assert.deepEqual([run('state.lesson.phase'),run('state.lesson.hintLevel')],['choose',1],'힌트 보고 다시');
 assert.equal(run('lessonSecondaryLabel(state.lesson,lessonContext().level)'),'⏭ 다른 판');play(run,timers,level(run).witness);assert.match(headline(run),/💡 힌트 사용/);assert.deepEqual(J(run,"lessonDrillStats('fork-v1').helped"),[1,0,0,0,0]);
 run('lessonPrimary()');flush(timers);const third=run('state.lesson.fen');run('lessonHint();lessonSecondary()');flush(timers);assert.notEqual(run('state.lesson.fen'),third,'⏭ 다른 판');
 // 저장·복원: 같은 판, 판 분석은 저장하지 않고 다시 계산
 const saved=J(run,"readData('sessions',{}).lesson");assert.equal(saved.version,6);assert.equal(saved.snapshot.values.lesson.drillLevel,undefined);assert.equal(saved.snapshot.values.lesson.mode,'drill');
 assert.equal(J(run,"Object.keys(readData('lesson_sessions_v1',{}))").length,0,'무한 연습은 수업별 이어하기 저장에 섞이지 않음');
 const b=load(Object.fromEntries(storage));b.run("resumeActivity('lesson')");assert.equal(b.run('state.lesson.fen'),run('state.lesson.fen'));assert.equal(b.run('state.lesson.phase'),'choose');assert.ok(b.run('!!lessonContext().level.goal'));
 const bad=fn=>{const v=JSON.parse(JSON.stringify(saved.snapshot.values.lesson));fn(v);return run(`lessonRebuild(${JSON.stringify(v)})`)===null;};
 assert.ok(bad(v=>{v.fen=v.fen.replace(/^(\S*?)[NBRQ]/,'$1Q');}),'다른 배치');assert.ok(bad(v=>{v.tier=4;}),'다른 단계 조건');assert.ok(bad(v=>{v.seed=0;}),'잘못된 시드');
 assert.ok(bad(v=>{v.lessonId='mate-v1';}),'다른 수업');assert.ok(bad(v=>{v.phase='complete';}),'무한 연습에는 완료 단계 없음');assert.ok(bad(v=>{v.streak=-1;}),'음수 기록');
 assert.equal(run("lessonDrillValid({version:1,lessons:{'fork-v1':{solved:[1,0,0,0],helped:[0,0,0,0,0],best:[0,0,0,0,0]}}})"),false);assert.equal(run("lessonDrillValid({version:1,lessons:{'x':{solved:[0,0,0,0,0],helped:[0,0,0,0,0],best:[0,0,0,0,0]}}})"),false);
 // 단계 바꾸기와 목록 복귀
 run("lessonDrillDialog('fork-v1')");assert.match(J(run,'dialogs.at(-1)').html,/lesson-drill-tier current/);run("startLessonDrill('fork-v1',2,99)");flush(timers);assert.equal(run("lgLevelFromFen('fork-v1',2,state.lesson.fen)!==null"),true);assert.match(html(elements),/∞ 보통/);
});

test('무한 연습 판 만들기: 모든 수업의 첫 단계 판이 단계 조건을 통과하고, 만드는 도중 다른 화면으로 가면 작업이 멈춘다',()=>{
 const {run,timers}=load();
 for(const id of J(run,'LESSONS.map(l=>l.id)')){run(`startLessonDrill('${id}',0,${7})`);flush(timers);assert.equal(run('state.lesson.phase'),'choose',id);assert.equal(run(`lgLevelFromFen('${id}',0,state.lesson.fen)!==null`),true,id);}
 run("startLessonDrill('pin-v1',3,5)");run("goLessons()");flush(timers);assert.equal(run('lessonDrillJob'),null,'목록으로 가면 판 만들기를 멈춘다');
});
