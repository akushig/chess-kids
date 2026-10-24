const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output=process.env.CHESS_QA_OUTPUT||'/tmp/chess-kids-ui';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const summary={build:'',viewports:[],offline:false,errors:[]};fs.mkdirSync(output,{recursive:true});
 try{
  for(const viewport of [{width:360,height:780},{width:768,height:1024},{width:1280,height:900}]){
   const context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>summary.errors.push(e.message));
   await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(process.env.CHESS_TEST_URL||'http://127.0.0.1:8765',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{writeData('preferences',{motion:false});applyPreferences();});
   for(const title of ['모험','놀이터','대전'])assert.equal(await page.getByRole('button',{name:new RegExp('^'+(title==='모험'?'🗺':title==='놀이터'?'🎲':'♟')+' '+title)}).count(),1);
   summary.build=await page.evaluate(()=>APP_VERSION);
   if(viewport.width===360)await page.screenshot({path:output+'/home-mobile.png',fullPage:true,animations:'disabled'});
   await page.getByRole('button',{name:/가족 · 소리/}).click();await page.locator('#family-overlay .profile-list').getByRole('button',{name:/어른의 도전/}).click();assert.equal(await page.evaluate(()=>activeProfile),'adult');
   await page.getByRole('button',{name:/가족 · 소리/}).click();await page.locator('#family-overlay .profile-list').getByRole('button',{name:/내 모험/}).click();assert.equal(await page.evaluate(()=>activeProfile),'child');
   await page.evaluate(()=>goMissionPlay('R',0));const selected=page.locator('#screen-learn [aria-selected="true"]');await selected.waitFor();await selected.focus();
   await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await page.waitForFunction(()=>state.missionSolved);
   assert.ok(await page.evaluate(()=>getMissionStars('R',0))>0,'keyboard can finish a lesson');
   await page.evaluate(()=>{playStart();state.game=ChessGame.fromFEN('7k/P7/8/8/8/8/8/3K4 w - - 0 1');renderPlay();});
   await page.locator('#screen-play .board-cell').nth(8).click();await page.locator('#screen-play .board-cell').nth(0).click();await page.getByRole('button',{name:'나이트',exact:true}).click();assert.equal(await page.evaluate(()=>state.game.board[0][0]),'wN');
   await page.evaluate(()=>{playStart();state.play.mode='friend';state.game=ChessGame.fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');renderPlay();});
   await page.locator('#screen-play .board-cell').nth(60).click();await page.locator('#screen-play .board-cell').nth(62).click();assert.equal(await page.evaluate(()=>state.game.board[7][5]),'wR');
   await page.evaluate(()=>{playStart();state.game=ChessGame.fromFEN('4r2k/8/8/8/8/8/R7/4K3 w - - 0 1');renderPlay();});
   if(viewport.width===360)await page.screenshot({path:output+'/check-mobile.png',fullPage:true,animations:'disabled'});
   if(viewport.width===768)await page.screenshot({path:output+'/check-tablet.png',fullPage:true,animations:'disabled'});
   for(const fn of ['goKnightTour(0,"walk")','goCollector(0)','goBomb(0)','goDefense(0)','goSurvival(0)','goPuzzleLevel(4)']){
    await page.evaluate(fn);await page.locator('.screen.active [role="gridcell"]').first().waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,fn+' overflow '+viewport.width);
   }
   await page.evaluate(()=>goKnightTour(2,'tour'));await page.getByRole('button',{name:/같은 판을 가족에게/}).click();await page.getByRole('button',{name:'어른이 완주 도전',exact:true}).click();assert.equal(await page.evaluate(()=>activeProfile),'adult');assert.equal(await page.locator('.screen.active .board-cell').count(),49);
   summary.viewports.push({...viewport,passed:true});await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();page.on('pageerror',e=>summary.errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto(process.env.CHESS_TEST_URL||'http://127.0.0.1:8765',{waitUntil:'domcontentloaded'});await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.evaluate(()=>SKIN_ORDER.every(name=>Object.keys(SKINS[name]).length===12)),true,'all skins load offline');
  await page.evaluate(()=>{writeData('preferences',{motion:false});applyPreferences();playStart();});await page.locator('#screen-play .board-cell').nth(52).click();await page.locator('#screen-play .board-cell').nth(36).click();await page.waitForFunction(()=>state.game.turn==='w'&&state.actionHistory.length>=2,null,{timeout:15000});
  summary.offline=true;assert.deepEqual(summary.errors,[]);await context.close();fs.writeFileSync(output+'/browser-results.json',JSON.stringify(summary,null,2));console.log('Final browser QA passed:',JSON.stringify(summary));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
