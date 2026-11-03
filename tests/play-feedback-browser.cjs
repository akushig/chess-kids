const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const {acknowledgePlayEvent}=require('./browser-helpers.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const output=process.env.CHESS_FEEDBACK_QA_OUTPUT||'/tmp/chess-feedback-qa';fs.mkdirSync(output,{recursive:true});const results=[],errors=[];
 try{
  for(const viewport of [{width:360,height:780},{width:768,height:1024},{width:1280,height:900}]){
   const context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
   await page.goto(process.env.CHESS_TEST_URL||'http://127.0.0.1:8765',{waitUntil:'domcontentloaded'});await page.evaluate(()=>{writeData('preferences',{motion:false});applyPreferences();goPlay();});
   const board=()=>page.locator('#screen-play .chess-board').boundingBox(),cells=()=>page.locator('#screen-play .board-cell'),dialog=()=>page.locator('#play-dialog');
   function same(a,b){for(const k of ['x','y','width','height'])assert.ok(Math.abs(a[k]-b[k])<.6,`${viewport.width} board ${k}: ${a[k]} -> ${b[k]}`);}
   const selected=await page.evaluate(()=>getPlaySettings().level),scroll=await page.evaluate(()=>scrollY);
   const label=await page.locator('.play-difficulty-heading > span').boundingBox(),info=await page.locator('.play-info-button').boundingBox();assert.ok(info.x>=label.x+label.width,'! is beside the label');assert.ok(info.width>=44);
   await page.locator('.play-info-button').click();assert.equal(await page.locator('.play-difficulty-table tbody tr').count(),10);assert.equal(await page.locator('.play-difficulty-table thead th').count(),4);assert.match(await dialog().innerText(),/0.15초/);assert.match(await dialog().innerText(),/1.5초/);
   assert.ok((await dialog().boundingBox()).height<=viewport.height);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(viewport.width===360)await page.screenshot({path:output+'/difficulty-mobile.png',fullPage:true});
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'play-dialog-close');await page.keyboard.press('Shift+Tab');
   await page.locator('.play-dialog-note').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>scrollY),scroll);
   await page.keyboard.press('Escape');assert.equal(await dialog().count(),0);assert.equal(await page.evaluate(()=>document.activeElement.className),'play-info-button');assert.equal(await page.evaluate(()=>getPlaySettings().level),selected);assert.equal(await page.evaluate(()=>scrollY),scroll);
   async function start(fen,options={}){
    await page.evaluate(({fen,options})=>{savePlaySettings({...getPlaySettings(),mode:options.mode||'friend',timer:30,help:options.help??true,small:false,level:0});playStart();state.game=ChessGame.fromFEN(fen);renderPlay();scrollTo(0,0);},{fen,options});await page.waitForTimeout(380);
   }
   const check='4r2k/8/8/8/8/8/R7/4K3 w - - 0 1';
   await start(check,{help:false});const checkBox=await board();assert.match(await dialog().innerText(),/체크/);assert.match(await dialog().innerText(),/먼저 왕을 피하거나/);
   assert.equal(await page.evaluate(()=>playTimerHandle),null);assert.equal(await page.locator('.checked-king .play-cell-alert').count(),1);
   if(viewport.width===360)await page.screenshot({path:output+'/first-check-mobile.png',fullPage:true});
   await page.evaluate(()=>playClick(7,4));assert.equal(await page.evaluate(()=>state.game.selected),null,'modal protects against accidental board moves');
   await acknowledgePlayEvent(page);same(checkBox,await board());assert.equal(await page.evaluate(()=>state.play.seenChecks.w),true);assert.ok(await page.evaluate(()=>state.play.deadline-Date.now())>25000);
   assert.match(await page.locator('#game-toast').innerText(),/왕을 안전하게 하는 수만/);assert.equal(await page.locator('.attack-overlay').count(),0,'help off still has essential check warning');
   if(viewport.width===360){await page.waitForTimeout(6600);assert.equal(await page.locator('#game-toast').count(),1,'check explanation does not time out');await page.screenshot({path:output+'/check-help-off-mobile.png',fullPage:true});}
   await page.evaluate(()=>{state.play.help=true;renderPlay();});assert.equal(await dialog().count(),0,'same check does not interrupt again');
   await cells().nth(48).click();await cells().nth(40).click();assert.match(await page.locator('#game-toast').innerText(),/아직 왕이 위험/);assert.ok(await page.getByRole('button',{name:/길 막기/}).count());same(checkBox,await board());
   await page.locator('#game-toast .toast-close').click();await cells().nth(40).click();assert.match(await page.locator('#game-toast').innerText(),/아직 왕이 위험/);
   if(viewport.width===360)await page.screenshot({path:output+'/check-restriction-mobile.png',fullPage:true});
   await cells().nth(52).click();assert.equal(await page.evaluate(()=>state.game.status),'playing');assert.match(await page.locator('#game-toast').innerText(),/왕을 구했어요/);same(checkBox,await board());
   // Both castle pieces animate and the next player's full timer waits for acknowledgement.
   await start('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');await page.evaluate(()=>{writeData('preferences',{motion:true});applyPreferences();});const castleBox=await board();
   await cells().nth(60).click();await cells().nth(62).click();await page.waitForFunction(()=>document.querySelectorAll('.move-anim').length===2);await dialog().waitFor();same(castleBox,await board());
   assert.match(await dialog().innerText(),/캐슬링/);assert.match(await dialog().innerText(),/e1 → g1/);assert.match(await dialog().innerText(),/h1 → f1/);assert.equal(await page.evaluate(()=>playTimerHandle),null);assert.equal(await page.evaluate(()=>state.play.pausedLeft),30000);
   if(viewport.width===360)await page.screenshot({path:output+'/castle-mobile.png',fullPage:true});
   await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>resumeActivity('play'));await dialog().waitFor();assert.match(await dialog().innerText(),/캐슬링/);assert.equal(await page.evaluate(()=>state.play.moveEvent.acknowledged),false);
   await acknowledgePlayEvent(page);assert.equal(await page.locator('.castle-completed').count(),2);assert.ok(await page.evaluate(()=>state.play.deadline-Date.now())>25000);
   await page.getByRole('button',{name:/되돌리기/}).click();await page.getByRole('button',{name:'함께 되돌리기',exact:true}).click();assert.equal(await page.evaluate(()=>state.game.castlingStatus('w','king').allowed),true);assert.equal(await dialog().count(),0);
   // An AI opponent cannot reply while the user is reading what castling did.
   await page.evaluate(()=>{writeData('preferences',{motion:false});applyPreferences();});
   await start('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',{mode:'ai'});await cells().nth(60).click();await cells().nth(62).click();await dialog().waitFor();await page.waitForTimeout(550);assert.equal(await page.evaluate(()=>state.actionHistory.length),1);assert.equal(await page.evaluate(()=>playAiWorker),null);
   await acknowledgePlayEvent(page);await page.waitForFunction(()=>state.actionHistory.length>=2,null,{timeout:10000});
   // Actual winning input, clear loss, and a draw without check all have different results.
   await start('7k/8/5KQ1/8/8/8/8/8 w - - 0 1',{mode:'ai'});const winBox=await board();await cells().nth(22).click();await cells().nth(14).click();await dialog().waitFor();assert.match(await dialog().innerText(),/내가 이겼어요/);assert.match(await dialog().innerText(),/대국이 끝났어요/);same(winBox,await board());
   if(viewport.width===360)await page.screenshot({path:output+'/win-mobile.png',fullPage:true});
   await acknowledgePlayEvent(page);await cells().nth(0).click();assert.equal(await dialog().count(),1,'tapping a finished board reopens the result');assert.equal(await page.evaluate(()=>state.game.status),'checkmate');
   await start('8/8/8/8/8/6k1/6q1/7K w - - 0 1',{mode:'ai'});assert.match(await dialog().innerText(),/컴퓨터가 이겼어요/);await acknowledgePlayEvent(page);
   await start('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');assert.match(await dialog().innerText(),/무승부/);assert.match(await dialog().innerText(),/체크가 아니지만/);
   if(viewport.width===360)await page.screenshot({path:output+'/draw-mobile.png',fullPage:true});
   await acknowledgePlayEvent(page);const review=page.getByRole('button',{name:/결과 다시 보기/});await review.scrollIntoViewIfNeeded();const beforeReview=await board();await review.click();same(beforeReview,await board());await page.getByRole('button',{name:'새 판 시작',exact:true}).click();assert.equal(await page.evaluate(()=>state.game.status),'playing');assert.equal(await page.evaluate(()=>document.getElementById('app').inert),false);assert.equal(await dialog().count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);results.push({viewport,build:await page.evaluate(()=>CHESS_BUILD),difficultyPopup:true,essentialCheck:true,castlePair:true,eventPersistence:true,timerAndAiPaused:true,results:true,stationaryBoard:true});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(output+'/results.json',JSON.stringify({results,errors},null,2));console.log('Play feedback browser QA passed:',JSON.stringify(results));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
