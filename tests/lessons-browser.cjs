// 체스 수업: 실제 탭·키보드로 판을 둔다. 상태를 코드로 성공 처리하지 않는다(새 12개 수업의 문구 넘침 검사만 결과 화면을 직접 그린다). 판 좌표는 판 데이터(예시 정답·함정)에서 읽는다.
// 360×640에서는 45판 모두 '함정 → 실패 표시 → 다시 → 정답 → 성공 표시'를 실제 탭으로 거치며 판 위치·버튼·문구 넘침을 확인한다.
// 다른 화면 크기(360×780, 768×1024, 1280×900)에서는 대표 흐름과 한 수업 전체, 응수 중 목록·새로고침·프로필 전환,
// 처음부터 다시, 실제 파일 내보내기/가져오기, 수업 배치 대전을 확인한다. 이동 애니메이션과 오프라인도 검사한다.
const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output=process.env.CHESS_LESSON_QA_OUTPUT||'/tmp/chess-lesson-qa';fs.mkdirSync(output,{recursive:true});
const URL=process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const results=[],errors=[];
 const open=async(viewport,motion=false)=>{const context=await browser.newContext({viewport,serviceWorkers:'block',acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(`${viewport.width}x${viewport.height}: ${e.message}`));await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(URL,{waitUntil:'domcontentloaded'});await page.evaluate(m=>{writeData('preferences',{motion:m,voice:false});applyPreferences();},motion);return {context,page};};
 try{for(const viewport of [{width:360,height:640},{width:360,height:780},{width:768,height:1024},{width:1280,height:900}]){
  const tag=`${viewport.width}x${viewport.height}`,full=viewport.width===360&&viewport.height===640,{context,page}=await open(viewport);
  const ev=(fn,arg)=>page.evaluate(fn,arg),L=page.locator('#screen-lesson'),cells=()=>L.locator('.board-cell'),tap=(r,c)=>cells().nth(r*8+c).click();
  const left=()=>L.locator('.lesson-actions .action-btn').first(),right=()=>L.locator('.lesson-actions .action-btn').nth(1);
  const result=async()=>{await page.waitForFunction(()=>state.lesson?.phase==='result',null,{timeout:15000});return ev(()=>state.lesson.result);};
  const feedback=()=>L.locator('.lesson-feedback').innerText(),headline=()=>L.locator('.lesson-goal').innerText();
  const settle=()=>page.waitForTimeout(480);  // 진행 버튼 연타 방지 시간이 지난 뒤 누른다
  const rect=()=>ev(()=>{const r=document.querySelector('#screen-lesson .chess-board').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  let base=null;
  // 판은 모든 판·상태에서 같은 자리. 버튼(진행 둘·목록·처음부터)은 화면 안·44px 이상, 진행은 오른쪽. 목표·설명·제목은 넘치지 않는다.
  const check=async label=>{
   const r=await rect();if(!base)base=r;for(const k of ['x','y','width','height'])assert.ok(Math.abs(r[k]-base[k])<.6,`${tag} ${label}: 판 ${k} ${base[k]} → ${r[k]}`);
   const info=await ev(()=>{const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent.trim()};};const over=e=>e.scrollHeight-e.clientHeight;
    return {buttons:[...document.querySelectorAll('.lesson-actions>button,.lesson-header .back-btn,.lesson-pick-btn')].map(box),actions:[...document.querySelectorAll('.lesson-actions>button')].map(box),goal:over(document.querySelector('.lesson-goal')),feedback:over(document.querySelector('.lesson-feedback')),title:over(document.querySelector('.lesson-header h2')),side:!!document.querySelector('.lesson-side'),scroll:document.documentElement.scrollWidth>innerWidth};});
   for(const b of info.buttons){assert.ok(b.y>=0&&b.y+b.h<=viewport.height+.5&&b.x>=0&&b.x+b.w<=viewport.width+.5,`${tag} ${label} ${b.text} 화면 밖 ${JSON.stringify(b)}`);assert.ok(b.h>=44,`${tag} ${label} ${b.text} 높이 ${b.h}`);}
   assert.ok(info.actions.length===2&&info.actions[1].x>info.actions[0].x,`${tag} ${label} 진행 버튼은 오른쪽`);
   assert.ok(info.goal<=1&&info.feedback<=1&&info.title<=1,`${tag} ${label} 문구 넘침 ${JSON.stringify(info)}`);assert.equal(info.side,true);assert.equal(info.scroll,false,`${tag} ${label} 가로 넘침`);
  };
  const level=()=>ev(()=>lessonContext().level);
  const move=async([a,b,c,d])=>{await tap(a,b);await tap(c,d);return result();};
  // 한 판: (원하면) 함정으로 실패 표시를 확인하고 다시, 예시 정답으로 성공 표시를 확인한다.
  const playLevel=async(withTrap,label)=>{
   const lv=await level(),index=await ev(()=>state.lesson.levelIndex),total=await ev(()=>lessonContext().lesson.levels.length);
   if(withTrap){assert.equal(await move(lv.trap),'fail',label);assert.match(await headline(),/^✗ 잡혔어요! 다시 해봐요/);assert.match(await feedback(),/^✗ /);assert.equal(await L.locator('.lesson-board-no').count(),1);await check(label+' 실패');await settle();await right().click();}
   assert.equal(await move(lv.witness),'success',label);assert.match(await headline(),new RegExp(`판 ${index+1} 성공!`));assert.match(await feedback(),/^✓ /);assert.equal(await L.locator('.lesson-board-ok').count(),1);
   assert.equal(await L.locator('.lesson-bar').getAttribute('aria-valuenow'),String(await ev(()=>state.lesson.solved.filter(Boolean).length)));await check(label+' 성공');
   assert.equal((await right().innerText()).trim(),index===total-1?'수업 마치기 ▶':'다음 판 ▶');
  };

  // 다른 놀이를 하던 중이어도 수업 목록에는 수업 이어하기가 없다.
  await ev(()=>{playStart();playCommitMove([6,4,4,4]);leaveActivity();showScreen('home');renderHome();});
  const versionColor=await ev(()=>getComputedStyle(document.querySelector('.app-version')).color.match(/\d+/g).slice(0,3).map(Number));assert.ok(versionColor.every(v=>v<120),`버전 글자색 ${versionColor}`);
  await page.locator('#screen-home .home-lesson').click();assert.equal(await L.locator('.lesson-status-new').count(),15);assert.match(await L.locator('.lesson-course').innerText(),/5단원 · 15개 주제 · 225판/);assert.equal(await L.locator('.lesson-unit-title').count(),5);
  for(const b of await L.locator('.lesson-card-actions .lesson-sub-btn').evaluateAll(list=>list.map(e=>{const r=e.getBoundingClientRect();return [e.textContent,r.height,r.right,e.scrollWidth-e.clientWidth];})))assert.ok(b[1]>=44&&b[2]<=viewport.width+.5&&b[3]<=1,`${tag} 카드 버튼 ${JSON.stringify(b)}`);
  if(full)await page.screenshot({path:`${output}/list-${tag}.png`,fullPage:true,animations:'disabled'});

  // ===== 수업 1 첫 판: 목표·살펴보기·실패 표시·다시·성공 표시 =====
  await L.locator('.lesson-card').first().click();assert.equal(await L.locator('.lesson-arrow-attack').count()>=1,true,'첫 판은 공격선을 보여준다');await check('첫 판');
  assert.match(await headline(),/^🎯 /);assert.match(await feedback(),/내 말\(흰색\)을 눌러/);assert.match(await L.locator('.lesson-progress').innerText(),/판 1\/15 · 첫걸음/);
  if(full)await page.screenshot({path:`${output}/level1-${tag}.png`,animations:'disabled'});
  const enemy=await ev(()=>{const b=state.lesson.game.board;for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(b[r][c]&&b[r][c][0]==='b'&&b[r][c][1]!=='K')return [r,c];});
  await tap(...enemy);assert.ok(await L.locator('.lesson-reach').count()>=1,'상대 말이 갈 수 있는 칸');assert.match(await feedback(),/빨간 점 칸으로 갈 수 있어요/);await check('상대 말 살펴보기');
  const first=await level();assert.equal(await move(first.trap),'fail');assert.equal(await right().evaluate(b=>b.classList.contains('lesson-next')),true,'다시 해보기 강조');
  if(full)await page.screenshot({path:`${output}/fail-${tag}.png`,animations:'disabled'});
  await tap(0,0);assert.equal(await ev(()=>state.lesson.phase),'result','결과 뒤 판 누름은 진행하지 않음');await settle();await right().click();assert.equal(await ev(()=>state.lesson.phase),'choose');
  assert.equal(await move(first.witness),'success');assert.match(await headline(),/🎉 판 1 성공! 1\/15 클리어/);await check('첫 판 성공');
  if(full)await page.screenshot({path:`${output}/success-${tag}.png`,animations:'disabled'});
  await settle();await right().click();assert.equal(await L.locator('.lesson-arrow-attack').count(),0,'둘째 판부터 스스로 찾기');
  // 둘째 판은 키보드로: 예시 정답의 말에서 Enter → 방향키로 도착 칸 → Enter
  {const [a,b,c,d]=(await level()).witness;await cells().nth(a*8+b).focus();await page.keyboard.press('Enter');assert.deepEqual(await ev(()=>state.lesson.selected),[a,b]);
   for(let i=0;i<Math.abs(c-a);i++)await page.keyboard.press(c>a?'ArrowDown':'ArrowUp');for(let i=0;i<Math.abs(d-b);i++)await page.keyboard.press(d>b?'ArrowRight':'ArrowLeft');
   await page.keyboard.press('Enter');assert.equal(await result(),'success','키보드로 성공');}
  // 셋째 판: 힌트는 두 번 해본 뒤에 열리고, 정답 화살표 없이 노려지는 말만 보여 준다. 힌트로 성공하면 💡.
  await settle();await right().click();assert.match(await left().innerText(),/🔒 힌트 0\/2/);await left().click();assert.match(await feedback(),/2번 해본 뒤에 열려요/);
  {const t3=(await level()).trap;for(let k=0;k<2;k++){assert.equal(await move(t3),'fail');await settle();if(k===0){assert.equal(await left().isDisabled(),true,'아직 잠김');await right().click();}}
   assert.match(await left().innerText(),/힌트 보고 다시/);await left().click();assert.equal(await ev(()=>state.lesson.hintLevel),1);assert.ok(await L.locator('.lesson-arrow-attack').count()>=1);assert.equal(await L.locator('.lesson-arrow-suggest').count(),0,'정답 화살표 없음');await check('힌트');}
  await playLevel(false,'수업1-3');assert.match(await headline(),/판 3 성공! 💡/);

  // ===== 나머지 판: 360×640은 45판 모두 함정→실패→정답, 다른 크기는 수업 1을 정답으로 끝낸다 =====
  for(let i=3;i<15;i++){await settle();await right().click();await playLevel(full,`수업1-${i+1}`);}
  await settle();await right().dblclick();assert.equal(await ev(()=>state.lesson.phase),'complete');assert.equal(await ev(()=>state.lesson.lessonId),'protect-escape-v3','두 번 탭해도 다음 수업으로 건너뛰지 않음');
  assert.match(await headline(),/🏆 15판 모두 성공!/);await check('수업 1 끝');assert.equal(await ev(()=>readData('lesson_progress_v1',{})['protect-escape-v3'].assisted),true);
  if(full){
   for(const n of [2,3]){await settle();await right().click();assert.equal(await ev(()=>state.lesson.lessonId),`protect-${n===2?'capture':'all'}-v3`);
    for(let i=0;i<15;i++){if(i){await settle();await right().click();}
     if(n===2&&i===0){const quiet=await ev(()=>{const lv=lessonContext().level,g=lessonLevelGame(lv);return g.allMoves().find(m=>lessonOutcome(g,m,lv).result==='goal');});
      assert.equal(await move(quiet),'goal');assert.match(await headline(),/아직 목표를 이루지 못했어요/);assert.match(await feedback(),/상대 말을 하나 잡아야 해요/);await check('잡기 미달');await settle();await right().click();}
     await playLevel(true,`수업${n}-${i+1}`);}
    await settle();await right().click();assert.match(await headline(),/🏆 15판 모두 성공!/);}
   await page.screenshot({path:`${output}/complete-${tag}.png`,animations:'disabled'});
  }else{
   await ev(()=>{leaveActivity();goLessons('home');});await L.locator('.lesson-card').nth(2).click();for(let i=0;i<15;i++){if(i){await settle();await right().click();}await playLevel(i===8,`수업3-${i+1}`);}await settle();await right().click();
  }
  assert.equal((await right().innerText()).trim(),'다음 수업 ▶','셋째 수업 다음은 새 단원');await check('수업 3 끝');

  // ===== 수업 배치로 대전 =====
  await left().click();await page.locator('#lesson-practice-level').selectOption('2');assert.match(await page.locator('#lesson-practice-summary').innerText(),/3단계/);
  if(full)await page.screenshot({path:`${output}/practice-dialog-${tag}.png`,animations:'disabled'});
  await page.getByRole('dialog').getByRole('button',{name:'대전 시작',exact:true}).click();
  assert.deepEqual(await ev(()=>[state.screen,state.play.content.type,state.play.level,lessonBoardKey(state.game)===lessonBoardKey(lessonLevelGame(lessonById('protect-all-v3').levels[14]))]),['play','lessonPractice',2,true]);
  {const m=await ev(()=>state.game.allMoves()[0]);await page.locator('#screen-play .board-cell').nth(m[0]*8+m[1]).click();await page.locator('#screen-play .board-cell').nth(m[2]*8+m[3]).click();assert.equal(await ev(m=>state.game.board[m[2]][m[3]]?.[0],m),'w','실제 수');}

  // ===== 판 고르기: 목록에서 도전 단계로 바로 가고, 수업 안에서 ✓와 지금 판을 확인한다 =====
  await ev(()=>{leaveActivity();goLessons('home');});await L.getByRole('button',{name:'2번 판 고르기',exact:true}).click();const picker=page.getByRole('dialog');await picker.waitFor();
  assert.equal(await picker.locator('.lesson-pick').count(),15);assert.match(await picker.innerText(),/첫걸음[\s\S]*쉬움[\s\S]*보통[\s\S]*어려움[\s\S]*도전/);
  for(const b of await picker.locator('.lesson-pick').evaluateAll(list=>list.map(e=>{const r=e.getBoundingClientRect();return [r.height,r.bottom];})))assert.ok(b[0]>=44,`${tag} 판 버튼 높이 ${b[0]}`);
  if(full)await page.screenshot({path:`${output}/picker-${tag}.png`,animations:'disabled'});
  await picker.getByRole('button',{name:/^판 13 · 도전/}).click();assert.deepEqual(await ev(()=>[state.lesson.lessonId,state.lesson.levelIndex]),['protect-capture-v3',12]);assert.match(await L.locator('.lesson-progress').innerText(),/판 13\/15 · 도전/);await check('판 고르기로 13판');
  if(!full){assert.equal(await move((await level()).witness),'success');assert.match(await headline(),/판 13 성공!/);}
  await L.getByRole('button',{name:'☰ 판 고르기',exact:true}).click();await picker.waitFor();assert.equal(await picker.getByRole('button',{name:/^판 13 · 도전 · 혼자 성공/}).count(),1,'성공한 판은 ✓');assert.match(await picker.locator('.lesson-pick.current').innerText(),/13/);
  await picker.getByRole('button',{name:/^판 4 · 쉬움/}).click();assert.equal(await ev(()=>state.lesson.levelIndex),3);await check('수업 안에서 판 고르기');

  // ===== 응수 중 목록·새로고침·프로필 전환: 유령 잡기 없음, 처음부터 다시 =====
  await ev(()=>{leaveActivity();goLessons('home');});assert.equal(await L.getByRole('button',{name:/^1번 이어하기/}).count(),0,'끝난 수업은 이어하기 없음');
  await L.locator('.lesson-card').first().click();const trap=(await level()).trap;
  const interrupted=async label=>{await page.waitForTimeout(900);await ev(()=>{leaveActivity();goLessons('home');});assert.match(await L.locator('.lesson-card').first().innerText(),/이어하기 · 판 1\/15/,label);assert.equal(await L.getByRole('button',{name:/^1번 이어하기/}).count(),1,label);
   await L.locator('.lesson-card').first().click();assert.deepEqual(await ev(()=>[state.lesson.phase,state.lesson.move,state.lesson.attempts,lessonBoardKey(state.lesson.game)===lessonBoardKey(lessonLevelGame(lessonContext().level))]),['choose',null,0,true],label);await page.waitForTimeout(900);assert.equal(await ev(()=>state.lesson.phase),'choose',label+' 복원 뒤 자동 이동 없음');};
  await tap(trap[0],trap[1]);await tap(trap[2],trap[3]);assert.equal(await ev(()=>state.lesson.phase),'response');await L.getByRole('button',{name:'← 목록'}).click();await interrupted('목록');
  await tap(trap[0],trap[1]);await tap(trap[2],trap[3]);await page.reload({waitUntil:'domcontentloaded'});await interrupted('새로고침');
  await tap(trap[0],trap[1]);await tap(trap[2],trap[3]);await ev(()=>switchProfile(createProfile('둘째','🐱').id));await page.waitForTimeout(900);await ev(()=>{closeActivityDialog(false);switchProfile(allProfiles()[0].id);closeActivityDialog(false);});await interrupted('프로필 전환');
  await ev(()=>{leaveActivity();goLessons('home');});await L.getByRole('button',{name:'1번 판 고르기',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'↺ 1판부터 다시',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'처음부터 시작',exact:true}).click();
  assert.deepEqual(await ev(()=>[state.lesson.lessonId,state.lesson.levelIndex,state.lesson.phase]),['protect-escape-v3',0,'choose']);
  assert.equal(await ev(()=>learningSummary().filter(r=>r.label.startsWith('체스 수업')).length),full?3:2,'완료 기록 중복 없음');

  // ===== 무한 연습: 목록 → 단계 고르기 → 새 판(실제 탭) · 힌트 자유 · 다른 판 =====
  {await ev(()=>{leaveActivity();goLessons('home');});await L.getByRole('button',{name:'11번 무한 연습',exact:true}).click();const dlg=page.getByRole('dialog');await dlg.waitFor();
   assert.equal(await dlg.locator('.lesson-drill-tier').count(),5);for(const h of await dlg.locator('.lesson-drill-tier').evaluateAll(l=>l.map(e=>e.getBoundingClientRect().height)))assert.ok(h>=44);
   await dlg.locator('.lesson-drill-tier').first().click();await page.waitForFunction(()=>state.lesson?.mode==='drill'&&state.lesson.phase==='choose',null,{timeout:15000});
   assert.match(await L.locator('.lesson-progress').innerText(),/∞ 첫걸음 · 연속 0[\s\S]*판 #/);assert.match(await L.locator('.lesson-header h2').innerText(),/무한 연습/);await check('무한 연습 판');
   if(full)await page.screenshot({path:`${output}/drill-${tag}.png`,animations:'disabled'});
   assert.equal(await move((await level()).witness),'success');assert.match(await headline(),/성공! 연속 1/);await check('무한 연습 성공');
   const before=await ev(()=>state.lesson.fen);await settle();await right().click();await page.waitForFunction(f=>state.lesson.phase==='choose'&&state.lesson.fen!==f,before,{timeout:15000});
   await left().click();assert.equal(await ev(()=>state.lesson.hintLevel),1,'무한 연습 힌트는 바로');assert.match(await feedback(),/^💡/);assert.match(await left().innerText(),/다른 판/);await check('무한 연습 힌트');
   const third=await ev(()=>state.lesson.fen);await left().click();await page.waitForFunction(f=>state.lesson.phase==='choose'&&state.lesson.fen!==f,third,{timeout:15000});
   await L.getByRole('button',{name:'단계 바꾸기',exact:true}).click();await dlg.waitFor();await dlg.locator('.lesson-drill-tier').nth(4).click();await page.waitForFunction(()=>state.lesson.tier===4&&state.lesson.phase==='choose',null,{timeout:30000});assert.match(await L.locator('.lesson-progress').innerText(),/∞ 도전/);await check('무한 연습 도전');}
  // ===== 새 12개 수업: 목표·실패·성공 문구가 넘치지 않는다(360×640은 225판 중 새 180판 모두, 다른 크기는 수업마다 첫 판) =====
  for(const id of await ev(()=>LESSONS.slice(3).map(l=>l.id))){
   const n=full?15:1;
   for(let i=0;i<n;i++){
    await ev(([id,i])=>{closeActivityDialog(false);lessonPickLevel(id,i);},[id,i]);await check(`${id} ${i+1}판 목표`);
    for(const which of ['trap','witness']){
     await ev(w=>{const {l,level}=lessonContext(),start=lessonLevelGame(level),m=level[w],out=lessonOutcome(start,m,level),g=out.after;if(out.reply)g.move(...out.reply);Object.assign(l,{phase:'result',move:m,game:g,reply:out.reply,result:out.result,hintLevel:w==='witness'?1:0});if(out.result==='success')l.solved[l.levelIndex]=true;renderLesson();},which);
     await check(`${id} ${i+1}판 ${which==='trap'?'실패':'성공'} 문구`);}
   }
   if(!full){await ev(id=>lessonPickLevel(id,0),id);const lv=await level();const r=await move(lv.trap);assert.ok(['fail','goal'].includes(r),id);await settle();await right().click();assert.equal(await move(lv.witness),'success',id);await check(`${id} 실제 탭`);}
   await ev(id=>{leaveActivity();lessonDiscardSave(id);},id);  // 문구 검사용으로 직접 그린 상태는 저장에 남기지 않는다
  }

  // ===== 실제 파일 내보내기 → 다른 브라우저에서 가져오기 =====
  await ev(()=>{leaveActivity();goLessons('home');});await L.locator('.lesson-card').first().click();assert.deepEqual(await ev(()=>[state.lesson.lessonId,state.lesson.levelIndex]),['protect-escape-v3',0]);
  assert.equal(await move((await level()).witness),'success');await settle();await right().click();assert.equal(await move((await level()).trap),'fail');
  await ev(()=>{leaveActivity();showScreen('home');renderHome();});await page.getByRole('button',{name:/^프로필 · 설정/}).click();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'플레이어 1 내보내기',exact:true}).click();const file=`${output}/lesson-profile-${tag}.json`;await (await downloaded).saveAs(file);
  assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).version,6,'💡 기록이 있으면 v6');
  const target=await open(viewport),p=target.page;await p.getByRole('button',{name:/^프로필 · 설정/}).click();await p.locator('#profile-import-file').setInputFiles(file);await p.getByRole('button',{name:'새 프로필로 불러오기',exact:true}).click();await p.keyboard.press('Escape');
  await p.locator('#screen-home .home-lesson').click();const statuses=await p.locator('#screen-lesson .lesson-status').allInnerTexts();assert.match(statuses[0],/이어하기 · 판 2\/15/);assert.match(statuses[2],/해봤어요/);
  await p.locator('#screen-lesson .lesson-card').first().click();assert.deepEqual(await p.evaluate(()=>[state.lesson.levelIndex,state.lesson.result]),[1,'fail']);assert.match(await p.locator('#screen-lesson .lesson-goal').innerText(),/잡혔어요/);
  await p.waitForTimeout(480);await p.locator('#screen-lesson .lesson-actions .action-btn').nth(1).click();assert.equal(await p.evaluate(()=>state.lesson.phase),'choose');await target.context.close();

  results.push({viewport,levelsPlayed:full?45:31,newLevelsChecked:full?180:12,drill:true,failShown:true,successShown:true,inspect:true,hints:true,keyboard:true,practiceGame:true,interruptions:true,restart:true,fileMove:true,fixedBoard:true});await context.close();
 }
 // 실제 이동 애니메이션: 내 수와 상대의 잡기 모두 움직임이 보인다(동작 보통).
 {const {context,page}=await open({width:360,height:640},true),L=page.locator('#screen-lesson');
  await page.evaluate(()=>startLesson('protect-escape-v3'));const [a,b,c,d]=await page.evaluate(()=>lessonContext().level.trap);await L.locator('.board-cell').nth(a*8+b).click();await L.locator('.board-cell').nth(c*8+d).click();
  assert.equal(await page.evaluate(()=>state.animating),true);assert.equal(await L.locator('.move-anim').count(),1,'내 말 이동');
  await page.waitForFunction(()=>state.lesson.reply&&!!document.querySelector('#screen-lesson .move-anim'),null,{timeout:4000});await page.waitForFunction(()=>state.lesson.phase==='result');assert.equal(await page.evaluate(()=>state.lesson.result),'fail');
  results.push({motion:true});await context.close();}
 // 오프라인: 새로 설치한 서비스 워커가 수업 파일(판 데이터 포함)을 보관한다.
 {const offline=await browser.newContext(),page=await offline.newPage();page.on('pageerror',e=>errors.push('offline: '+e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto(URL,{waitUntil:'domcontentloaded'});await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await offline.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#screen-home .home-lesson').click();await page.locator('#screen-lesson .lesson-card').first().click();
  assert.equal(await page.evaluate(()=>LESSONS.reduce((n,l)=>n+l.levels.length,0)),225);assert.equal(await page.locator('#screen-lesson .board-cell').count(),64);
  await page.evaluate(()=>startLessonDrill('fork-v1',0,31));await page.waitForFunction(()=>state.lesson.phase==='choose',null,{timeout:15000});results.push({offline:true});await offline.close();}
 }finally{await browser.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(`${output}/results.json`,JSON.stringify({results,errors},null,2));console.log('체스 수업 브라우저 검사 통과:',JSON.stringify(results.map(r=>r.viewport?`${r.viewport.width}x${r.viewport.height}`:Object.keys(r)[0])));
})().catch(e=>{console.error(e);process.exitCode=1;});
