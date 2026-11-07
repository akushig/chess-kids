// 체스 수업: 실제 탭·키보드로 세 수업을 끝까지 진행한다. 상태를 코드로 성공 처리하지 않는다.
// 360×640/780, 768×1024, 1280×900에서 판 좌표 불변·조작 버튼 화면 안·다음은 오른쪽·문구 읽기·모달 초점을 확인하고,
// 응수 중 화면/프로필 전환·새로고침, 실제 파일 내보내기/가져오기, 오프라인, 수업 배치 대전을 검사한다.
const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output=process.env.CHESS_LESSON_QA_OUTPUT||'/tmp/chess-lesson-qa';fs.mkdirSync(output,{recursive:true});
const URL=process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const results=[],errors=[];
 const open=async(viewport,motion=false)=>{const context=await browser.newContext({viewport,serviceWorkers:'block',acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(`${viewport.width}x${viewport.height}: ${e.message}`));await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(URL,{waitUntil:'domcontentloaded'});await page.evaluate(m=>{writeData('preferences',{motion:m,voice:false});applyPreferences();},motion);return {context,page};};
 try{for(const viewport of [{width:360,height:640},{width:360,height:780},{width:768,height:1024},{width:1280,height:900}]){
  const tag=`${viewport.width}x${viewport.height}`,shots=viewport.width===360&&viewport.height===640,{context,page}=await open(viewport);
  const ev=(fn,arg)=>page.evaluate(fn,arg),L=page.locator('#screen-lesson'),cells=()=>L.locator('.board-cell'),tap=(r,c)=>cells().nth(r*8+c).click();
  const btn=name=>L.getByRole('button',{name,exact:true}),phase=()=>ev(()=>state.lesson.phase),waitPhase=p=>page.waitForFunction(p=>state.lesson?.phase===p,p,{timeout:15000});
  const rect=()=>ev(()=>{const r=document.querySelector('#screen-lesson .chess-board').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  let base=null;const fixed=async label=>{const r=await rect();if(!base)base=r;for(const k of ['x','y','width','height'])assert.ok(Math.abs(r[k]-base[k])<.6,`${tag} ${label}: 판 ${k} ${base[k]} → ${r[k]}`);};
  // 핵심 조작 5개가 화면 안에 있고 44px 이상이며, 진행 버튼이 오른쪽. 설명·제목은 잘리지 않는다.
  const check=async label=>{
   await fixed(label);
   const info=await ev(()=>{const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent.trim()};};const m=document.querySelector('.lesson-message'),h=document.querySelector('.lesson-header h2');
    return {tools:[...document.querySelectorAll('.lesson-tools>button')].map(box),actions:[...document.querySelectorAll('.lesson-actions>button')].map(box),message:[m.scrollHeight,m.clientHeight],title:[h.scrollWidth,h.clientWidth],scroll:document.documentElement.scrollWidth>innerWidth,back:document.querySelector('.lesson-header .back-btn').getBoundingClientRect().height};});
   assert.ok(info.back>=44,`${tag} ${label} 목록 버튼 높이 ${info.back}`);assert.equal(info.tools.length,3,label);assert.equal(info.actions.length,2,label);
   for(const b of [...info.tools,...info.actions]){assert.ok(b.y>=0&&b.y+b.h<=viewport.height+.5&&b.x>=0&&b.x+b.w<=viewport.width+.5,`${tag} ${label} ${b.text} 화면 밖 ${JSON.stringify(b)}`);assert.ok(b.h>=44,`${tag} ${label} ${b.text} 높이 ${b.h}`);}
   assert.ok(info.actions[1].x>info.actions[0].x,`${tag} ${label} 진행 버튼은 오른쪽`);
   assert.ok(info.message[0]<=info.message[1]+1,`${tag} ${label} 설명이 넘침 ${info.message}`);assert.ok(info.title[0]<=info.title[1]+1,`${tag} ${label} 제목 잘림`);assert.equal(info.scroll,false,`${tag} ${label} 가로 넘침`);
   return info;
  };
  const right=async()=>(await check('진행 버튼')).actions[1].text;

  // 다른 놀이를 하던 중이어도 처음 들어온 수업 목록에는 수업 이어하기가 없다.
  await ev(()=>{playStart();playCommitMove([6,4,4,4]);leaveActivity();showScreen('home');renderHome();});
  await page.locator('#screen-home .home-lesson').click();assert.equal(await L.locator('.lesson-status-new').count(),3);assert.equal(await L.locator('.lesson-status-resume').count(),0);
  if(shots)await page.screenshot({path:`${output}/list-${tag}.png`,fullPage:true,animations:'disabled'});

  // ===== 수업 1: 지목 =====
  await L.getByRole('button',{name:/1\. 상대가 노리는 말 찾기/}).click();assert.equal(await phase(),'demoReady');await check('보기 처음');
  await btn('▶ 시범 보기').click();assert.equal(await phase(),'demoPlaying');await page.waitForFunction(()=>state.lesson.demoStep===2,null,{timeout:6000});
  assert.equal(await L.locator('.lesson-predict-badge').count(),1,'예측 화면으로 구분');await check('예측 시범');if(shots)await page.screenshot({path:`${output}/demo-predict-${tag}.png`,animations:'disabled'});
  await btn('⏭ 끝 장면 보기').click();assert.equal(await ev(()=>state.lesson.demoStep),3);assert.equal(await phase(),'demoReady');await check('시범 끝');
  await btn('직접 해보기').click();assert.equal(await ev(()=>state.lesson.sceneRole),'guided');await check('함께 해보기');
  const spotBoard=await ev(()=>JSON.stringify(state.lesson.game.board));await tap(7,4);
  assert.equal(await ev(()=>state.lesson.result),'retry');assert.equal(await ev(()=>JSON.stringify(state.lesson.game.board)),spotBoard);assert.equal(await L.locator('.lesson-target').count(),0,'첫 오답에 정답 없음');assert.equal(await right(),'다른 방법으로');
  await btn('다른 방법으로').click();await L.getByRole('button',{name:/💡 도움/}).click();await L.getByRole('button',{name:/💡 도움/}).click();assert.equal(await ev(()=>state.lesson.helpLevel),2);await check('도움 2');
  if(shots)await page.screenshot({path:`${output}/spot-help-${tag}.png`,animations:'disabled'});
  await tap(5,0);assert.equal(await ev(()=>state.lesson.result),'success');assert.equal(await right(),'다음 연습');await check('지목 성공');
  await btn('다음 연습').click();await tap(3,3);assert.equal(await right(),'수업 마치기');await page.waitForTimeout(500);
  // 마무리 직후 같은 자리를 다시 눌러도 다음 수업으로 건너뛰지 않는다.
  await btn('수업 마치기').dblclick();assert.equal(await phase(),'complete');assert.equal(await ev(()=>state.lesson.lessonId),'protect-spot-v1');assert.equal(await right(),'다음 수업');
  if(shots)await page.screenshot({path:`${output}/spot-complete-${tag}.png`,animations:'disabled'});
  await page.waitForTimeout(500);await btn('다음 수업').click();

  // ===== 수업 2: 피하기, 혼자 해보기는 키보드로 =====
  assert.equal(await ev(()=>state.lesson.lessonId),'protect-escape-v1');await check('수업 2 보기');await page.waitForTimeout(500);await btn('직접 해보기').click();
  await tap(5,7);assert.equal(await L.locator('.board-cell.move-hint').count(),7);await check('비숍 선택');
  await tap(0,2);assert.equal(await phase(),'response');await waitPhase('result');
  assert.deepEqual(await ev(()=>[state.lesson.result,state.lesson.game.board[0][2],state.lesson.game.turn]),['retry','bR','w'],'흑이 실제로 잡고 멈춤');await check('피하기 실패');
  if(shots)await page.screenshot({path:`${output}/escape-retry-${tag}.png`,animations:'disabled'});
  await btn('다른 방법으로').click();assert.equal(await ev(()=>state.lesson.game.board[5][7]),'wB');await tap(5,7);await tap(2,4);await waitPhase('result');assert.equal(await ev(()=>state.lesson.result),'success','증거 수순이 아닌 다른 안전한 칸도 성공');
  await btn('다음 연습').click();await cells().nth(3*8+4).focus();await page.keyboard.press('Enter');assert.deepEqual(await ev(()=>state.lesson.selected),[3,4]);
  await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');await waitPhase('result');assert.equal(await ev(()=>state.lesson.result),'success');assert.equal(await ev(()=>state.lesson.game.board[2][4]),'wR');await check('키보드 성공');
  await btn('수업 마치기').click();await page.waitForTimeout(500);await btn('다음 수업').click();

  // ===== 수업 3: 잡은 다음, 설명 창 =====
  assert.equal(await ev(()=>state.lesson.lessonId),'protect-capture-v1');
  if(shots){await btn('▶ 시범 보기').click();await waitPhase('demoReady');assert.equal(await ev(()=>state.lesson.demoStep),6);await check('시범 전체');}
  await page.waitForTimeout(500);await btn('직접 해보기').click();await tap(6,3);assert.equal(await L.locator('.lesson-capture-hint').count(),2);await tap(4,3);await waitPhase('result');
  assert.deepEqual(await ev(()=>[state.lesson.result,state.lesson.game.board[4][3]]),['retry','bB']);assert.match(await L.locator('.lesson-message').innerText(),/폰을 잡았지만 상대 비숍에게 룩을 잃었어요/);await check('되잡힘');
  if(shots)await page.screenshot({path:`${output}/capture-retry-${tag}.png`,animations:'disabled'});
  await L.getByRole('button',{name:'↶ 되돌리기',exact:true}).click();assert.deepEqual(await ev(()=>[state.lesson.phase,state.lesson.game.board[6][3],state.lesson.game.board[4][3],state.lesson.game.board[1][6]]),['choose','wR','bP','bB'],'학생 수와 응수를 한 번에 되돌림');
  await tap(6,3);await tap(6,0);await waitPhase('result');await btn('다음 연습').click();
  await tap(6,4);await tap(5,4);assert.equal(await ev(()=>state.lesson.notice),'emptyMove');assert.equal(await ev(()=>state.lesson.attempts),0);await check('빈칸 이동 안내');
  // 응수 대기 중 설명 창을 열면 응수가 멈췄다가, 닫으면 한 번만 이어진다.
  assert.equal(await btn('↶ 되돌리기').isDisabled(),true,'빈칸 안내는 시도가 아니라 되돌릴 것 없음');await tap(4,4);await L.getByRole('button',{name:'❓ 왜 그런가요?'}).click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();assert.equal(await ev(()=>!!document.activeElement.closest('[role="dialog"]')),true,'초점이 설명 창 안');
  for(let i=0;i<4;i++){await page.keyboard.press('Tab');assert.equal(await ev(()=>!!document.activeElement.closest('[role="dialog"]')),true,'초점 가두기');}
  await page.waitForTimeout(900);assert.deepEqual(await ev(()=>[state.lesson.phase,state.lesson.game.board[4][4]]),['response','wR'],'읽는 동안 응수 정지');
  await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.equal(await ev(()=>document.activeElement.classList.contains('lesson-why')),true,'닫은 뒤 원래 버튼으로 초점');
  await waitPhase('result');assert.deepEqual(await ev(()=>[state.lesson.result,state.lesson.game.board[4][4],state.actionHistory.length]),['retry','bB',1]);
  await btn('다른 방법으로').click();await tap(6,4);await tap(6,7);await waitPhase('result');await btn('수업 마치기').click();assert.equal(await right(),'대전에 써보기');await check('수업 3 마무리');
  assert.equal(await ev(()=>Object.values(readData('lesson_progress_v1',{})).filter(p=>p.completed).length),3);

  // ===== 수업 배치로 대전 =====
  await L.getByRole('button',{name:'⚔ 이 배치로 대전'}).click();await page.locator('#lesson-practice-level').selectOption('2');assert.match(await page.locator('#lesson-practice-summary').innerText(),/3단계/);
  if(shots)await page.screenshot({path:`${output}/practice-dialog-${tag}.png`,animations:'disabled'});
  await page.getByRole('dialog').getByRole('button',{name:'대전 시작',exact:true}).click();
  assert.deepEqual(await ev(()=>[state.screen,state.play.content.type,state.play.level,state.game.positionKey()===ChessGame.fromFEN('7k/1b6/8/8/4p3/2N5/4R2p/K7 w - - 0 1').positionKey()]),['play','lessonPractice',2,true]);
  assert.equal(await page.locator('#screen-play .screen-header h2').innerText(),'수업 배치로 대전');
  await page.locator('#screen-play .board-cell').nth(6*8+4).click();await page.locator('#screen-play .board-cell').nth(6*8+7).click();assert.equal(await ev(()=>state.game.board[6][7]),'wR');

  // ===== 응수 중 목록·새로고침·프로필 전환: 유령 이동 없음 =====
  const interrupted=async label=>{await page.waitForTimeout(900);await ev(()=>{leaveActivity();goLessons('home');});assert.match(await L.locator('.lesson-card').nth(1).innerText(),/이어하기 · 혼자 해보기/,label);await L.locator('.lesson-card').nth(1).click();
   assert.deepEqual(await ev(()=>[state.lesson.phase,state.lesson.game.board[3][4],state.lesson.game.board[1][4],state.actionHistory.length,state.lesson.attempts]),['choose','wR',null,0,0],label);await page.waitForTimeout(900);assert.equal(await phase(),'choose',label+' 복원 뒤 자동 이동 없음');};
  await ev(()=>{lessonDiscardSave('protect-escape-v1');startLesson('protect-escape-v1');lessonChangedAt=0;lessonGoScene(2);});await tap(3,4);await tap(1,4);assert.equal(await phase(),'response');await L.getByRole('button',{name:'← 목록'}).click();await interrupted('목록');
  await tap(3,4);await tap(1,4);await page.reload({waitUntil:'domcontentloaded'});await interrupted('새로고침');
  await tap(3,4);await tap(1,4);await ev(()=>switchProfile(createProfile('둘째','🐱').id));await page.waitForTimeout(900);await ev(()=>{closeActivityDialog(false);switchProfile(allProfiles()[0].id);closeActivityDialog(false);});await interrupted('프로필 전환');
  assert.equal(await ev(()=>learningSummary().filter(r=>r.label.startsWith('체스 수업')).length),3,'완료 기록 중복 없음');

  // ===== 실제 파일 내보내기 → 다른 브라우저에서 가져오기 =====
  await tap(3,4);await tap(1,4);await waitPhase('result');await ev(()=>{leaveActivity();showScreen('home');renderHome();});await page.getByRole('button',{name:'👤 프로필 · 설정',exact:true}).click();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'플레이어 1 내보내기',exact:true}).click();const file=`${output}/lesson-profile-${tag}.json`;await (await downloaded).saveAs(file);
  assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).version,5);
  const target=await open(viewport),p=target.page;await p.getByRole('button',{name:'👤 프로필 · 설정',exact:true}).click();await p.locator('#profile-import-file').setInputFiles(file);await p.getByRole('button',{name:'새 프로필로 불러오기',exact:true}).click();await p.keyboard.press('Escape');
  await p.locator('#screen-home .home-lesson').click();const statuses=await p.locator('#screen-lesson .lesson-status').allInnerTexts();assert.match(statuses[0],/해봤어요/);assert.match(statuses[1],/이어하기 · 혼자 해보기/);assert.match(statuses[2],/해봤어요/);
  await p.locator('#screen-lesson .lesson-card').nth(1).click();assert.deepEqual(await p.evaluate(()=>[state.lesson.result,state.lesson.game.board[1][4],state.actionHistory.length]),['retry','bN',1]);
  await p.locator('#screen-lesson').getByRole('button',{name:'↶ 되돌리기',exact:true}).click();assert.deepEqual(await p.evaluate(()=>[state.lesson.phase,state.lesson.game.board[3][4]]),['choose','wR']);await target.context.close();

  results.push({viewport,lessons:3,demo:true,wrongThenRetry:true,keyboard:true,modalFocus:true,undoBundle:true,practiceGame:true,interruptions:true,fileMove:true,fixedBoard:true});await context.close();
 }
 // 실제 이동 애니메이션: 시범과 학생 수·교재 응수 모두 움직임이 보인다(동작 보통).
 {const {context,page}=await open({width:360,height:640},true),L=page.locator('#screen-lesson');
  await page.evaluate(()=>startLesson('protect-capture-v1'));await L.getByRole('button',{name:'▶ 시범 보기',exact:true}).click();await page.waitForFunction(()=>!!document.querySelector('#screen-lesson .move-anim'),null,{timeout:6000});
  await L.getByRole('button',{name:'⏭ 끝 장면 보기',exact:true}).click();await page.waitForTimeout(500);await L.getByRole('button',{name:'직접 해보기',exact:true}).click();
  await L.locator('.board-cell').nth(6*8+3).click();await L.locator('.board-cell').nth(4*8+3).click();assert.equal(await page.evaluate(()=>state.animating),true);assert.equal(await L.locator('.move-anim').count(),1,'학생의 잡기 이동');
  await page.waitForFunction(()=>state.lesson.responseMove&&!!document.querySelector('#screen-lesson .move-anim'),null,{timeout:4000});await page.waitForFunction(()=>state.lesson.phase==='result');assert.equal(await page.evaluate(()=>state.lesson.game.board[4][3]),'bB');
  results.push({motion:true});await context.close();}
 // 오프라인: 새로 설치한 서비스 워커가 수업 파일을 모두 보관한다.
 {const offline=await browser.newContext(),page=await offline.newPage();page.on('pageerror',e=>errors.push('offline: '+e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto(URL,{waitUntil:'domcontentloaded'});await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await offline.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#screen-home .home-lesson').click();await page.locator('#screen-lesson .lesson-card').first().click();
  assert.equal(await page.evaluate(()=>state.lesson.sceneRole),'demo');assert.equal(await page.locator('#screen-lesson .board-cell').count(),64);results.push({offline:true});await offline.close();}
 }finally{await browser.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(`${output}/results.json`,JSON.stringify({results,errors},null,2));console.log('체스 수업 브라우저 검사 통과:',JSON.stringify(results.map(r=>r.viewport?`${r.viewport.width}x${r.viewport.height}`:Object.keys(r)[0])));
})().catch(e=>{console.error(e);process.exitCode=1;});
