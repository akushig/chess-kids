// A-1/A-2: direct home entries and rematching from the finished game's own settings, with real input.
const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const {acknowledgePlayEvent}=require('./browser-helpers.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output=process.env.CHESS_ENTRY_QA_OUTPUT||'/tmp/chess-entry-qa';fs.mkdirSync(output,{recursive:true});
const WIN='7k/8/5KQ1/8/8/8/8/8 w - - 0 1',LOSS='8/8/8/8/8/6k1/6q1/7K w - - 0 1',DRAW='7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
const SMALL='3rk3/2ppp3/8/8/8/8/2PPP3/3RK3 w - - 0 1';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const results=[],errors=[];
 try{for(const viewport of [{width:360,height:780},{width:768,height:1024},{width:1280,height:900}]){
  const w=viewport.width,context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(`${w}: ${e.message}`));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  const url=process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/';
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.evaluate(()=>{writeData('preferences',{motion:false,voice:false});applyPreferences();});
  const play=page.locator('#screen-play'),dialog=()=>page.locator('#play-dialog'),cells=()=>page.locator('#screen-play .board-cell');
  const ev=(fn,arg)=>page.evaluate(fn,arg);
  const noOverflow=async label=>assert.equal(await ev(()=>document.documentElement.scrollWidth>innerWidth),false,`${w} ${label} horizontal overflow`);
  const boardDoc=()=>ev(()=>{const r=document.querySelector('.screen.active .chess-board').getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height};});
  const same=(a,b,label)=>{for(const k of ['x','y','width','height'])assert.ok(Math.abs(a[k]-b[k])<.6,`${w} ${label} board ${k}: ${a[k]} -> ${b[k]}`);};
  const home=async()=>{await ev(()=>{leaveActivity();showScreen('home');renderHome();scrollTo(0,0);});};
  const primary=name=>page.locator('#screen-home .home-primary .menu-btn').filter({hasText:name});
  const config=()=>ev(()=>playConfigOf(state.play));
  const position=()=>ev(()=>state.game.positionKey());
  // Mate with real taps after placing a known position into the current game.
  async function mateWithClicks(){await ev(fen=>{state.game=ChessGame.fromFEN(fen);state.game.selected=null;renderPlay();},WIN);await cells().nth(22).click();await cells().nth(14).click();await dialog().waitFor();}

  // --- A-1: a first visit reaches each purpose with one tap; everything else is still there. ---
  for(const name of ['체스 대전','기사의 여행','체스 처음 배우기'])assert.equal(await primary(name).count(),1,name);
  assert.equal(await page.locator('#screen-home .experience-picker, #screen-home .resume-card').count(),0,'no duplicate start picker on a first visit');
  assert.ok((await primary('체스 대전').boundingBox()).y+40<viewport.height,'primary entries start above the fold');
  await noOverflow('home');await page.screenshot({path:`${output}/home-first-${w}.png`,fullPage:true,animations:'disabled'});

  await primary('기사의 여행').click();assert.equal(await ev(()=>state.activeKind),'knight');assert.equal(await ev(()=>state.kt.mode),'walk');
  assert.equal(await page.locator('.kt-mode-nav button').count(),4,'goal choice (walk, explore, tour, rule puzzles) is on the knight screen');assert.equal(await ev(()=>Object.keys(progressLedger().missions).length),0,'no lesson required');
  await page.locator('#screen-mini .board-cell.move-hint').first().click();await page.waitForFunction(()=>!state.animating);
  const knight=await ev(()=>JSON.stringify([state.kt,state.actionHistory]));
  await page.getByRole('button',{name:'← 홈',exact:true}).click();assert.match(await primary('기사의 여행').innerText(),/▶ 이어하기/);
  await primary('기사의 여행').click();assert.equal(await ev(()=>JSON.stringify([state.kt,state.actionHistory])),knight,'menu re-entry keeps board, moves and undo');
  await page.getByRole('button',{name:/되돌리기/}).click();assert.equal(await ev(()=>state.kt.moveCount),0);await noOverflow('knight');

  await home();await primary('체스 처음 배우기').click();assert.equal(await ev(()=>state.activeKind),'mission');assert.equal(await ev(()=>state.missionPiece),'R');
  assert.ok(await page.locator('#screen-learn .board-cell').count()>0);await noOverflow('lesson');
  await home();await page.getByRole('button',{name:/^놀이터/}).click();
  for(const name of ['나이트 투어','한 수 발견','별 모으기','이동 수 도전','성 지키기','왕 지키기'])assert.equal(await page.locator('#screen-mini .menu-btn').filter({hasText:name}).count(),1,name);
  await page.locator('#screen-mini .menu-btn').filter({hasText:'성 지키기'}).click();assert.equal(await ev(()=>state.activeKind),'defense');
  await home();await page.getByRole('button',{name:/모험 지도/}).click();assert.equal(await page.locator('#screen-learn .world-card').count(),6);

  // --- A-1 play entry: saved game, computer game and same-device play; nothing replaced early. ---
  await home();await primary('체스 대전').click();
  assert.equal(await play.locator('.play-mode').filter({hasText:'컴퓨터와 두기'}).count(),1);assert.equal(await play.locator('.play-mode').filter({hasText:'함께 두기'}).count(),1);
  assert.doesNotMatch(await play.innerText(),/온라인/);await page.getByRole('button',{name:'5단계 · 보통',exact:true}).click();
  await play.locator('.play-chip').filter({hasText:'모든 말로 한 판'}).click();await play.getByRole('button',{name:'🤖 컴퓨터와 새 판 시작',exact:true}).click();
  assert.equal(await position(),await ev(f=>ChessGame.fromFEN(f).positionKey(),SMALL));
  await cells().nth(50).click();await cells().nth(42).click();await page.waitForFunction(()=>state.game.turn==='w'&&state.actionHistory.length>=2,null,{timeout:15000});
  // The computer's reply may give check; its explanation must be acknowledged first.
  await acknowledgePlayEvent(page);if(await page.locator('#game-toast .toast-close').count())await page.locator('#game-toast .toast-close').click();
  const savedGame=await ev(()=>JSON.stringify([state.game.board,state.actionHistory.length,playConfigOf(state.play)]));
  await play.getByRole('button',{name:'저장하고 나가기',exact:true}).click();assert.match(await primary('체스 대전').innerText(),/▶ 이어하기.*컴퓨터 5단계.*짧은 판/s);
  await primary('체스 대전').click();assert.equal(await play.getByRole('button',{name:/▶ 하던 판 이어하기/}).count(),1);
  await play.locator('.play-mode').filter({hasText:'함께 두기'}).click();await play.getByRole('button',{name:'👫 같은 기기에서 함께 두기 시작',exact:true}).click();
  await page.getByRole('dialog').waitFor();assert.match(await page.getByRole('dialog').innerText(),/하던 판이 바뀌어요/);await page.getByRole('button',{name:'취소',exact:true}).click();
  assert.equal(await ev(()=>JSON.stringify(readData('sessions',{}).play.snapshot.values.game.board)),JSON.stringify(JSON.parse(savedGame)[0]),'save survives choosing options and cancelling');
  if(w===360)await page.screenshot({path:`${output}/play-entry-${w}.png`,fullPage:true,animations:'disabled'});await noOverflow('play entry');

  // --- A-2: reload, change the global settings, restore through the menu and rematch from the game's settings. ---
  await page.reload({waitUntil:'domcontentloaded'});
  await ev(()=>{savePlaySettings({...getPlaySettings(),mode:'friend',level:0,timer:15,small:false,help:true});showScreen('home');renderHome();});
  await page.locator('#screen-home .resume-card').click();assert.equal(await ev(()=>JSON.stringify([state.game.board,state.actionHistory.length,playConfigOf(state.play)])),savedGame,'restored game and undo');
  await ev(()=>scrollTo(0,0));const beforeMate=await boardDoc();await mateWithClicks();same(beforeMate,await boardDoc(),'result');
  assert.equal(await ev(()=>document.activeElement.textContent),'확인했어요 · 마지막 판 보기','result focus starts on the non-starting action');
  const labels=await dialog().locator('footer button').allInnerTexts();assert.deepEqual(labels,['확인했어요 · 마지막 판 보기','같은 상대와 다시 두기','다음 단계 도전 · 6단계','설정 바꾸기']);
  assert.match(await dialog().innerText(),/다시 두면.*5단계.*짧은 판/s);assert.equal(await ev(()=>state.play.level),4,'no automatic level change');
  for(let i=0;i<5;i++)await page.keyboard.press('Tab');assert.equal(await ev(()=>!!document.activeElement.closest('#play-dialog')),true,'focus stays in the result');
  if(w===360)await page.screenshot({path:`${output}/result-win-${w}.png`,fullPage:true,animations:'disabled'});
  await dialog().getByRole('button',{name:'확인했어요 · 마지막 판 보기',exact:true}).click();same(beforeMate,await boardDoc(),'final board');
  assert.equal(await play.getByRole('button',{name:'다음 단계 도전 · 6단계',exact:true}).count(),1);await noOverflow('finished game');
  if(w===360)await page.screenshot({path:`${output}/finished-actions-${w}.png`,fullPage:true,animations:'disabled'});
  await play.getByRole('button',{name:'같은 상대와 다시 두기',exact:true}).click();
  assert.deepEqual(await config(),JSON.parse(savedGame)[2],'rematch keeps the restored game settings, not the global ones');
  assert.equal(await position(),await ev(f=>ChessGame.fromFEN(f).positionKey(),SMALL));assert.deepEqual(await ev(()=>[state.game.selected,state.actionHistory.length,!!state.play.moveEvent,document.getElementById('app').inert]),[null,0,false,false]);
  await ev(()=>scrollTo(0,0));const fresh=await boardDoc();
  await mateWithClicks();await dialog().getByRole('button',{name:'다음 단계 도전 · 6단계',exact:true}).click();
  assert.deepEqual(await config(),{...JSON.parse(savedGame)[2],level:5},'only the level changes');same(fresh,await boardDoc(),'next level');
  const globalAfter=await ev(()=>getPlaySettings());assert.equal(globalAfter.level,5);assert.equal(globalAfter.timer,15,'same-device timer choice kept');

  // --- A-2: level 10 has no next step; loss and draw never change the level. ---
  await ev(()=>goPlay());await page.getByRole('button',{name:'10단계 · 최고 도전',exact:true}).click();await play.getByRole('button',{name:'🤖 컴퓨터와 새 판 시작',exact:true}).click();
  const conf=page.getByRole('dialog');if(await conf.count())await page.getByRole('button',{name:'새 판 시작',exact:true}).click();
  await mateWithClicks();assert.equal(await dialog().getByRole('button',{name:/다음 단계/}).count(),0);assert.match(await dialog().innerText(),/가장 높은 10단계/);
  await dialog().getByRole('button',{name:'같은 상대와 다시 두기',exact:true}).click();assert.equal(await ev(()=>state.play.level),9);assert.equal(await play.getByRole('button',{name:/다음 단계/}).count(),0);
  for(const [fen,text] of [[LOSS,/컴퓨터가 이겼어요/],[DRAW,/무승부/]]){
   await ev(f=>{state.game=ChessGame.fromFEN(f);renderPlay();},fen);await dialog().waitFor();assert.match(await dialog().innerText(),text);
   assert.equal(await dialog().getByRole('button',{name:/다음 단계/}).count(),0,String(text));await dialog().getByRole('button',{name:'같은 상대와 다시 두기',exact:true}).click();
   assert.equal(await ev(()=>state.play.level),9,String(text));assert.equal(await ev(()=>state.game.status),'playing');
  }
  // Changing settings after a game starts from that game's settings.
  await ev(()=>savePlaySettings({...getPlaySettings(),level:2}));await ev(f=>{state.game=ChessGame.fromFEN(f);renderPlay();},LOSS);await dialog().waitFor();
  await dialog().getByRole('button',{name:'설정 바꾸기',exact:true}).click();assert.equal(await play.locator('.play-level[aria-pressed="true"] .play-level-number').innerText(),'10');
  assert.equal(await play.getByRole('button',{name:/▶ 하던 판 이어하기/}).count(),0,'a finished game is not offered to continue');
  await play.getByRole('button',{name:'🤖 컴퓨터와 새 판 시작',exact:true}).click();assert.equal(await ev(()=>state.play.level),9);

  // --- A-2: a reply requested by the replaced game never lands on the new board. ---
  await cells().nth(50).click();await cells().nth(42).click();assert.ok(await ev(()=>Object.keys(playAiPending).length>0||state.game.turn==='b'),'computer is thinking');
  await play.getByRole('button',{name:'새 판',exact:true}).click();assert.match(await page.getByRole('dialog').innerText(),/같은 설정으로 새 판/);
  await page.getByRole('button',{name:'새 판 시작',exact:true}).click();const replaced=await position();await page.waitForTimeout(5600);
  assert.equal(await position(),replaced);assert.deepEqual(await ev(()=>[state.game.turn,state.actionHistory.length,state.play.level]),['w',0,9]);

  // --- A-2 same device: short game, move timer, seating and helper survive; fresh full timer; clock pauses for the result. ---
  await ev(()=>goPlay());await play.locator('.play-mode').filter({hasText:'함께 두기'}).click();await play.locator('.play-timers .play-chip').filter({hasText:'30초'}).click();
  await play.locator('.play-chip').filter({hasText:'마주 보고 두기'}).click();await play.locator('.play-chip').filter({hasText:'천천히 계속하기'}).click();
  await play.getByRole('button',{name:'👫 같은 기기에서 함께 두기 시작',exact:true}).click();if(await page.getByRole('dialog').count())await page.getByRole('button',{name:'새 판 시작',exact:true}).click();
  assert.equal(await play.locator('.screen-header h2').innerText(),'같은 기기에서 함께');assert.doesNotMatch(await play.innerText(),/온라인/);
  const friend=await config();assert.deepEqual([friend.mode,friend.timer,friend.face,friend.autoMove,friend.small],['friend',30,false,true,true]);
  await cells().nth(50).click();await cells().nth(42).click();await play.getByRole('button',{name:'새 판',exact:true}).click();assert.equal(await ev(()=>playTimerHandle),null,'clock pauses for the confirmation');
  await page.keyboard.press('Escape');assert.notEqual(await ev(()=>playTimerHandle),null,'Escape resumes the clock');assert.equal(await ev(()=>state.actionHistory.length),1);
  await ev(()=>scrollTo(0,0));const friendBoard=await boardDoc();await mateWithClicks();assert.equal(await ev(()=>playTimerHandle),null,'clock stopped at the result');
  assert.equal(await dialog().getByRole('button',{name:/다음 단계/}).count(),0);if(w===360)await page.screenshot({path:`${output}/friend-result-${w}.png`,fullPage:true,animations:'disabled'});
  await ev(()=>{state.play.pausedLeft=1000;});await dialog().getByRole('button',{name:'같은 상대와 다시 두기',exact:true}).click();
  assert.deepEqual(await config(),friend);assert.ok(await ev(()=>state.play.deadline-Date.now())>28000,'fresh full move time');assert.notEqual(await ev(()=>playTimerHandle),null);
  assert.equal(await position(),await ev(f=>ChessGame.fromFEN(f).positionKey(),SMALL));same(friendBoard,await boardDoc(),'same-device rematch');
  // Moves and checks still behave normally on the rematched board.
  await cells().nth(50).click();await cells().nth(42).click();assert.equal(await ev(()=>state.game.turn),'b');
  await ev(()=>{state.game=ChessGame.fromFEN('4r2k/8/8/8/8/8/R7/4K3 w - - 0 1');renderPlay();});await dialog().waitFor();assert.match(await dialog().innerText(),/체크/);await acknowledgePlayEvent(page);
  await noOverflow('same-device');results.push({viewport,homeEntries:true,menuResume:true,restoredRematch:true,nextLevel:true,topLevel:true,lossDraw:true,staleAiIgnored:true,sameDevice:true});
  await context.close();
 }}finally{await browser.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(`${output}/results.json`,JSON.stringify({results,errors},null,2));console.log('Entry and rematch browser QA passed:',JSON.stringify(results.map(r=>r.viewport.width)));
})().catch(e=>{console.error(e);process.exitCode=1;});
