// 배운 말로 첫 대전: 실제 탭으로 대전 입구 → 첫 대전 → 말 움직임 보기 → 모험 → 이어하기 → 재대결 → 모험 완료 연결
const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const {acknowledgePlayEvent}=require('./browser-helpers.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output=process.env.CHESS_STARTER_QA_OUTPUT||'/tmp/chess-starter-qa';fs.mkdirSync(output,{recursive:true});
const WIN='7k/8/5KQ1/8/8/8/8/8 w - - 0 1';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const results=[],errors=[];
 try{for(const viewport of [{width:360,height:780},{width:768,height:1024},{width:1280,height:900}]){
  const w=viewport.width,context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(`${w}: ${e.message}`));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto(process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>{writeData('preferences',{motion:false,voice:false});applyPreferences();});
  const ev=(fn,arg)=>page.evaluate(fn,arg),play=page.locator('#screen-play'),cells=()=>play.locator('.board-cell'),dialog=()=>page.getByRole('dialog');
  const board=()=>ev(()=>{const r=document.querySelector('#screen-play .chess-board').getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height};});
  const same=(a,b,label)=>{for(const k of ['x','y','width','height'])assert.ok(Math.abs(a[k]-b[k])<.6,`${w} ${label} board ${k}: ${a[k]} -> ${b[k]}`);};
  const noOverflow=async label=>assert.equal(await ev(()=>document.documentElement.scrollWidth>innerWidth),false,`${w} ${label} 가로 넘침`);
  const clearHints=async()=>{await acknowledgePlayEvent(page);if(await page.locator('#game-toast .toast-close').count())await page.locator('#game-toast .toast-close').click();};

  // 대전 입구에서 첫 대전 4판을 찾고 비숍 첫 대전을 시작한다.
  await page.locator('#screen-home .home-primary .menu-btn').filter({hasText:'체스 대전'}).click();
  assert.equal(await play.locator('.play-starter').count(),4);await play.locator('.play-starters').scrollIntoViewIfNeeded();await noOverflow('대전 입구');
  if(w===360)await page.screenshot({path:`${output}/starters-${w}.png`,fullPage:true,animations:'disabled'});
  await play.locator('.play-starter').filter({hasText:'비숍 첫 대전'}).click();
  assert.equal(await play.locator('.screen-header h2').innerText(),'비숍 첫 대전');assert.equal(await ev(()=>state.play.preset),'B');
  assert.match(await page.locator('#game-toast').innerText(),/대각선/);
  await clearHints();await ev(()=>scrollTo(0,0));const start=await board();

  // 실제 수: d2-d3 뒤 컴퓨터 응수, 비숍을 골라 움직임 보기
  await cells().nth(51).click();await cells().nth(43).click();await page.waitForFunction(()=>state.game.turn==='w'&&state.actionHistory.length>=2,null,{timeout:15000});await clearHints();
  await cells().nth(58).click();const guide=play.getByRole('button',{name:/비숍 움직임 보기/});await guide.click();
  assert.equal(await dialog().locator('.pg-dot').count(),8);assert.equal(await ev(()=>document.getElementById('app').inert),true);same(start,await board(),'움직임 보기');
  if(w===360)await page.screenshot({path:`${output}/piece-guide-${w}.png`,animations:'disabled'});
  await page.keyboard.press('Escape');assert.equal(await dialog().count(),0);same(start,await board(),'움직임 보기 닫기');
  const saved=await ev(()=>JSON.stringify([state.game.board,state.actionHistory.length]));

  // 모험에서 연습하기 → 대전 저장 → 홈 이어하기로 같은 판
  await guide.click();await dialog().getByRole('button',{name:'모험에서 연습하기',exact:true}).click();
  assert.equal(await ev(()=>state.screen),'learn');assert.equal(await ev(()=>state.missionPiece),'B');assert.ok(await page.locator('#screen-learn .stage-node').count()>0);
  await ev(()=>{showScreen('home');renderHome();});await page.locator('#screen-home .resume-card').click();
  assert.equal(await ev(()=>JSON.stringify([state.game.board,state.actionHistory.length])),saved);assert.equal(await ev(()=>state.play.preset),'B');

  // 메이트 → 결과 요약에 판 이름 → 재대결은 같은 첫 대전 판
  await ev(f=>{state.game=ChessGame.fromFEN(f);state.game.selected=null;renderPlay();scrollTo(0,0);},WIN);await cells().nth(22).click();await cells().nth(14).click();
  await page.locator('#play-dialog').waitFor();assert.match(await page.locator('#play-dialog').innerText(),/다시 두면.*비숍 첫 대전/s);
  await page.locator('#play-dialog').getByRole('button',{name:'같은 상대와 다시 두기',exact:true}).click();
  assert.equal(await ev(()=>state.play.preset),'B');assert.equal(await ev(()=>state.game.positionKey()===ChessGame.fromFEN(PLAY_PRESETS.B.fen).positionKey()),true);
  assert.equal(await ev(()=>progressLedger().achievements['starter-bishop-v1']),1);await clearHints();await ev(()=>scrollTo(0,0));same(start,await board(),'재대결');

  // 퀸 기본 모험 마지막 과제를 실제 탭으로 풀면 완료 창 첫 버튼이 퀸 첫 대전
  await ev(()=>{const i=MISSIONS.Q.reduce((a,m,i)=>m.optional?a:i,-1);goMissionPlay('Q',i);});const path=await ev(()=>findMissionSolvePath()),size=await ev(()=>missionSize());
  for(const [r,c] of path.slice(1)){await page.locator('#screen-learn .board-cell').nth(r*size+c).click();await page.waitForFunction(()=>!state.animating);}
  await page.locator('#clear-overlay').waitFor();assert.equal(await page.locator('#clear-overlay footer button').first().innerText(),'퀸 첫 대전');
  if(w===360)await page.screenshot({path:`${output}/adventure-link-${w}.png`,fullPage:true,animations:'disabled'});
  await page.locator('#clear-overlay footer button').first().click();
  if(await page.getByRole('dialog').count()){assert.match(await dialog().innerText(),/하던 판이 바뀌어요/);await page.getByRole('button',{name:'새 판 시작',exact:true}).click();}
  assert.equal(await ev(()=>state.play.preset),'Q');assert.equal(await play.locator('.screen-header h2').innerText(),'퀸 첫 대전');await noOverflow('퀸 첫 대전');

  results.push({viewport,entry:true,realMoves:true,pieceGuide:true,adventureRoundTrip:true,rematch:true,adventureLink:true});await context.close();
 }}finally{await browser.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(`${output}/results.json`,JSON.stringify({results,errors},null,2));console.log('첫 대전 브라우저 검사 통과:',JSON.stringify(results.map(r=>r.viewport.width)));
})().catch(e=>{console.error(e);process.exitCode=1;});
