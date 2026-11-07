// 체스 수업 v2: 실제 탭·키보드로 세 수업 15판을 끝까지 둔다. 상태를 코드로 성공 처리하지 않는다.
// 360×640/780, 768×1024, 1280×900에서 판 좌표 불변·버튼 화면 안·진행은 오른쪽·문구 넘침 없음을 확인하고,
// 상대 말 살펴보기, 실패 → 실제 잡기 → 다시, 힌트, 응수 중 목록·새로고침·프로필 전환, 실제 파일 내보내기/가져오기,
// 수업 배치 대전, 이동 애니메이션, 오프라인을 검사한다.
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
  const left=()=>L.locator('.lesson-actions .action-btn').first(),right=()=>L.locator('.lesson-actions .action-btn').nth(1);
  const result=async()=>{await page.waitForFunction(()=>state.lesson?.phase==='result',null,{timeout:15000});return ev(()=>state.lesson.result);};
  const feedback=()=>L.locator('.lesson-feedback').innerText();
  const settle=()=>page.waitForTimeout(480);  // 진행 버튼 연타 방지 시간이 지난 뒤 누른다
  const rect=()=>ev(()=>{const r=document.querySelector('#screen-lesson .chess-board').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  let base=null;
  // 판은 모든 판·상태에서 같은 자리. 버튼 두 개(+목록·처음부터)는 화면 안·44px 이상, 진행은 오른쪽. 목표·설명·제목은 넘치지 않는다.
  const check=async label=>{
   const r=await rect();if(!base)base=r;for(const k of ['x','y','width','height'])assert.ok(Math.abs(r[k]-base[k])<.6,`${tag} ${label}: 판 ${k} ${base[k]} → ${r[k]}`);
   const info=await ev(()=>{const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent.trim()};};const over=e=>e.scrollHeight-e.clientHeight;
    return {buttons:[...document.querySelectorAll('.lesson-actions>button,.lesson-header .back-btn,.lesson-restart-btn')].map(box),actions:[...document.querySelectorAll('.lesson-actions>button')].map(box),goal:over(document.querySelector('.lesson-goal')),feedback:over(document.querySelector('.lesson-feedback')),title:over(document.querySelector('.lesson-header h2')),side:!!document.querySelector('.lesson-side'),scroll:document.documentElement.scrollWidth>innerWidth};});
   for(const b of info.buttons){assert.ok(b.y>=0&&b.y+b.h<=viewport.height+.5&&b.x>=0&&b.x+b.w<=viewport.width+.5,`${tag} ${label} ${b.text} 화면 밖 ${JSON.stringify(b)}`);assert.ok(b.h>=44,`${tag} ${label} ${b.text} 높이 ${b.h}`);}
   assert.ok(info.actions.length===2&&info.actions[1].x>info.actions[0].x,`${tag} ${label} 진행 버튼은 오른쪽`);
   assert.ok(info.goal<=1&&info.feedback<=1&&info.title<=1,`${tag} ${label} 문구 넘침 ${JSON.stringify(info)}`);assert.equal(info.side,true);assert.equal(info.scroll,false,`${tag} ${label} 가로 넘침`);
  };
  const witness=async()=>{const [a,b,c,d]=await ev(()=>lessonContext().level.witness);await tap(a,b);await tap(c,d);assert.equal(await result(),'success');};

  // 다른 놀이를 하던 중이어도 수업 목록에는 수업 이어하기가 없다.
  await ev(()=>{playStart();playCommitMove([6,4,4,4]);leaveActivity();showScreen('home');renderHome();});
  const versionColor=await ev(()=>getComputedStyle(document.querySelector('.app-version')).color.match(/\d+/g).slice(0,3).map(Number));assert.ok(versionColor.every(v=>v<120),`버전 글자색 ${versionColor}`);
  await page.locator('#screen-home .home-lesson').click();assert.equal(await L.locator('.lesson-status-new').count(),3);assert.equal(await L.locator('.lesson-status-resume').count(),0);
  if(shots)await page.screenshot({path:`${output}/list-${tag}.png`,fullPage:true,animations:'disabled'});

  // ===== 수업 1: 공격받는 말 피하기 =====
  await L.locator('.lesson-card').first().click();assert.equal(await L.locator('.lesson-arrow-attack').count(),1,'첫 판은 공격선을 보여준다');await check('첫 판');
  assert.match(await L.locator('.lesson-goal').innerText(),/상대 비숍이 내 룩을 노려요/);assert.match(await feedback(),/옮길 내 말\(흰색\)을 눌러요/);
  assert.ok(await L.locator('.lesson-owner.mine').count()===2&&await L.locator('.lesson-owner.theirs').count()===2,'나/상대 표시');
  if(shots)await page.screenshot({path:`${output}/level1-${tag}.png`,animations:'disabled'});
  await tap(1,6);assert.ok(await L.locator('.lesson-reach').count()>=5,'상대 말이 갈 수 있는 칸');assert.match(await feedback(),/상대 비숍은 빨간 점 칸으로 갈 수 있어요/);await check('상대 말 살펴보기');
  await tap(6,0);assert.ok(await L.locator('.move-hint').count()>=3);await tap(5,0);assert.equal(await ev(()=>state.lesson.phase),'response');
  assert.equal(await result(),'fail');assert.equal(await ev(()=>state.lesson.game.board[4][3]),'bB','상대가 룩을 실제로 잡음');assert.match(await feedback(),/✗ 상대 비숍이 내 룩을 잡았어요[\s\S]*대각선으로 끝까지 와요/);
  assert.equal((await right().innerText()).trim(),'↶ 다시 해보기');assert.equal(await right().evaluate(b=>b.classList.contains('lesson-next')),true,'다음 버튼 강조');await check('실패');
  if(shots)await page.screenshot({path:`${output}/fail-${tag}.png`,animations:'disabled'});
  await tap(2,2);assert.equal(await ev(()=>state.lesson.phase),'result','결과 뒤 판 누름은 진행하지 않음');
  await settle();await right().click();assert.equal(await ev(()=>state.lesson.game.board[4][3]),'wR');
  await tap(4,3);await tap(4,0);assert.equal(await result(),'success','예시와 다른 안전한 칸도 성공');assert.match(await feedback(),/✓ 내 룩이 상대 비숍의 길에서 벗어났어요/);await check('성공');
  if(shots)await page.screenshot({path:`${output}/success-${tag}.png`,animations:'disabled'});
  await settle();await right().click();assert.equal(await ev(()=>state.lesson.levelIndex),1);assert.equal(await L.locator('.lesson-arrow-attack').count(),0,'둘째 판부터 스스로 찾기');
  // 둘째 판은 키보드로: 비숍 h3에서 Enter → 위·왼쪽으로 g4 → Enter
  await cells().nth(5*8+7).focus();await page.keyboard.press('Enter');assert.deepEqual(await ev(()=>state.lesson.selected),[5,7]);
  await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');assert.equal(await result(),'success');assert.equal(await ev(()=>state.lesson.game.board[4][6]),'wB');
  for(let i=2;i<5;i++){await settle();await right().click();if(i===3){await left().click();await left().click();assert.equal(await L.locator('.lesson-arrow-suggest').count(),1,'힌트 2: 예시 화살표');await check('힌트');}await witness();}
  assert.equal((await right().innerText()).trim(),'수업 마치기 ▶');await settle();await right().dblclick();
  assert.equal(await ev(()=>state.lesson.phase),'complete');assert.equal(await ev(()=>state.lesson.lessonId),'protect-escape-v2','두 번 탭해도 다음 수업으로 건너뛰지 않음');assert.match(await feedback(),/수업을 마쳤어요/);await check('수업 1 끝');
  assert.equal(await ev(()=>readData('lesson_progress_v1',{})['protect-escape-v2'].assisted),true);
  await settle();await right().click();

  // ===== 수업 2: 잡을 때도 조심하기 =====
  assert.equal(await ev(()=>state.lesson.lessonId),'protect-capture-v2');assert.equal(await L.locator('.lesson-arrow-attack').count(),1,'지키는 말 화살표');
  await tap(6,4);assert.equal(await L.locator('.lesson-capture-hint').count(),2);await tap(4,4);assert.equal(await result(),'fail');assert.match(await feedback(),/폰은 잡았지만 상대 비숍이 내 룩을 다시 잡았어요/);
  if(shots)await page.screenshot({path:`${output}/capture-fail-${tag}.png`,animations:'disabled'});
  await left().click();assert.equal(await ev(()=>[state.lesson.phase,state.lesson.hintLevel].join()),'choose,1','힌트 보고 다시');assert.match(await feedback(),/상대가 지키는 칸/);
  await witness();await settle();await right().click();
  await tap(6,3);await tap(5,3);assert.equal(await result(),'goal');assert.match(await feedback(),/상대 말을 하나 잡아야 해요/);await settle();await right().click();
  await witness();for(let i=2;i<5;i++){await settle();await right().click();await witness();}
  await settle();await right().click();assert.equal(await ev(()=>state.lesson.phase),'complete');await settle();await right().click();

  // ===== 수업 3: 내 말 모두 지키기 =====
  assert.equal(await ev(()=>state.lesson.lessonId),'protect-all-v2');
  for(let i=0;i<5;i++){if(i){await settle();await right().click();}
   if(i===2){await tap(3,1);await tap(0,1);assert.equal(await result(),'fail');assert.equal(await ev(()=>state.lesson.game.board[0][1]),'wR');assert.match(await feedback(),/처음부터 노려지던 비숍/);await settle();await right().click();}
   await witness();if(i===2)assert.match(await feedback(),/노리던 상대 나이트를 먼저 잡아서/);}
  await settle();await right().click();assert.equal((await right().innerText()).trim(),'대전에 써보기 ▶');await check('수업 3 끝');
  if(shots)await page.screenshot({path:`${output}/complete-${tag}.png`,animations:'disabled'});

  // ===== 수업 배치로 대전 =====
  await left().click();await page.locator('#lesson-practice-level').selectOption('2');assert.match(await page.locator('#lesson-practice-summary').innerText(),/3단계/);
  await page.getByRole('dialog').getByRole('button',{name:'대전 시작',exact:true}).click();
  assert.deepEqual(await ev(()=>[state.screen,state.play.content.type,state.play.level,state.game.positionKey()===ChessGame.fromFEN('r5k1/5ppp/8/8/1b6/2N5/5PPP/3R2K1 w - - 0 1').positionKey()]),['play','lessonPractice',2,true]);
  await page.locator('#screen-play .board-cell').nth(5*8+2).click();await page.locator('#screen-play .board-cell').nth(4*8+4).click();assert.equal(await ev(()=>state.game.board[4][4]),'wN');

  // ===== 응수 중 목록·새로고침·프로필 전환: 유령 잡기 없음, 처음부터 다시 =====
  await ev(()=>{leaveActivity();goLessons('home');});await L.getByRole('button',{name:'1번 처음부터 다시',exact:true}).count().then(n=>assert.equal(n,0,'끝난 수업은 이어하기 없음'));
  await L.locator('.lesson-card').first().click();
  const interrupted=async label=>{await page.waitForTimeout(900);await ev(()=>{leaveActivity();goLessons('home');});assert.match(await L.locator('.lesson-card').first().innerText(),/이어하기 · 판 1\/5/,label);assert.equal(await L.getByRole('button',{name:'1번 처음부터 다시',exact:true}).count(),1,label);
   await L.locator('.lesson-card').first().click();assert.deepEqual(await ev(()=>[state.lesson.phase,state.lesson.game.board[4][3],state.lesson.game.board[6][0],state.lesson.attempts]),['choose','wR','wK',0],label);await page.waitForTimeout(900);assert.equal(await ev(()=>state.lesson.phase),'choose',label+' 복원 뒤 자동 이동 없음');};
  await tap(6,0);await tap(5,0);assert.equal(await ev(()=>state.lesson.phase),'response');await L.getByRole('button',{name:'← 목록'}).click();await interrupted('목록');
  await tap(6,0);await tap(5,0);await page.reload({waitUntil:'domcontentloaded'});await interrupted('새로고침');
  await tap(6,0);await tap(5,0);await ev(()=>switchProfile(createProfile('둘째','🐱').id));await page.waitForTimeout(900);await ev(()=>{closeActivityDialog(false);switchProfile(allProfiles()[0].id);closeActivityDialog(false);});await interrupted('프로필 전환');
  await ev(()=>{leaveActivity();goLessons('home');});await L.getByRole('button',{name:'1번 처음부터 다시',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'처음부터 시작',exact:true}).click();
  assert.deepEqual(await ev(()=>[state.lesson.lessonId,state.lesson.levelIndex,state.lesson.phase]),['protect-escape-v2',0,'choose']);
  assert.equal(await ev(()=>learningSummary().filter(r=>r.label.startsWith('체스 수업')).length),3,'완료 기록 중복 없음');

  // ===== 실제 파일 내보내기 → 다른 브라우저에서 가져오기 =====
  await tap(4,3);await tap(3,3);assert.equal(await result(),'success');await settle();await right().click();await tap(5,7);await tap(0,2);assert.equal(await result(),'fail');
  await ev(()=>{leaveActivity();showScreen('home');renderHome();});await page.getByRole('button',{name:'👤 프로필 · 설정',exact:true}).click();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'플레이어 1 내보내기',exact:true}).click();const file=`${output}/lesson-profile-${tag}.json`;await (await downloaded).saveAs(file);
  assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).version,5);
  const target=await open(viewport),p=target.page;await p.getByRole('button',{name:'👤 프로필 · 설정',exact:true}).click();await p.locator('#profile-import-file').setInputFiles(file);await p.getByRole('button',{name:'새 프로필로 불러오기',exact:true}).click();await p.keyboard.press('Escape');
  await p.locator('#screen-home .home-lesson').click();const statuses=await p.locator('#screen-lesson .lesson-status').allInnerTexts();assert.match(statuses[0],/이어하기 · 판 2\/5/);assert.match(statuses[1],/해봤어요/);assert.match(statuses[2],/해봤어요/);
  await p.locator('#screen-lesson .lesson-card').first().click();assert.deepEqual(await p.evaluate(()=>[state.lesson.levelIndex,state.lesson.result,state.lesson.game.board[0][2]]),[1,'fail','bR']);
  await p.waitForTimeout(480);await p.locator('#screen-lesson .lesson-actions .action-btn').nth(1).click();assert.deepEqual(await p.evaluate(()=>[state.lesson.phase,state.lesson.game.board[5][7]]),['choose','wB']);await target.context.close();

  results.push({viewport,lessons:3,levels:15,inspect:true,failThenRetry:true,hints:true,keyboard:true,practiceGame:true,interruptions:true,restart:true,fileMove:true,fixedBoard:true});await context.close();
 }
 // 실제 이동 애니메이션: 내 수와 상대의 잡기 모두 움직임이 보인다(동작 보통).
 {const {context,page}=await open({width:360,height:640},true),L=page.locator('#screen-lesson');
  await page.evaluate(()=>startLesson('protect-escape-v2'));await L.locator('.board-cell').nth(6*8).click();await L.locator('.board-cell').nth(5*8).click();
  assert.equal(await page.evaluate(()=>state.animating),true);assert.equal(await L.locator('.move-anim').count(),1,'내 말 이동');
  await page.waitForFunction(()=>state.lesson.reply&&!!document.querySelector('#screen-lesson .move-anim'),null,{timeout:4000});await page.waitForFunction(()=>state.lesson.phase==='result');assert.equal(await page.evaluate(()=>state.lesson.game.board[4][3]),'bB');
  results.push({motion:true});await context.close();}
 // 오프라인: 새로 설치한 서비스 워커가 수업 파일을 보관한다.
 {const offline=await browser.newContext(),page=await offline.newPage();page.on('pageerror',e=>errors.push('offline: '+e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto(URL,{waitUntil:'domcontentloaded'});await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await offline.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#screen-home .home-lesson').click();await page.locator('#screen-lesson .lesson-card').first().click();
  assert.equal(await page.evaluate(()=>state.lesson.levelIndex),0);assert.equal(await page.locator('#screen-lesson .board-cell').count(),64);results.push({offline:true});await offline.close();}
 }finally{await browser.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(`${output}/results.json`,JSON.stringify({results,errors},null,2));console.log('체스 수업 브라우저 검사 통과:',JSON.stringify(results.map(r=>r.viewport?`${r.viewport.width}x${r.viewport.height}`:Object.keys(r)[0])));
})().catch(e=>{console.error(e);process.exitCode=1;});
