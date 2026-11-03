const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const output=process.env.CHESS_AI_QA_OUTPUT||'/tmp/chess-ai-qa';fs.mkdirSync(output,{recursive:true});const results=[],errors=[];
 try{
  for(const width of [360,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(process.env.CHESS_TEST_URL||'http://127.0.0.1:8765',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{writeData('preferences',{motion:false});applyPreferences();safeStore.setItem('play_settings',JSON.stringify({level:4}));goPlay();});
   const buttons=page.locator('.play-level');assert.equal(await buttons.count(),10);assert.match(await page.locator('.play-level[aria-pressed="true"]').getAttribute('aria-label'),/^8단계/);
   for(let level=0;level<10;level++){
    await page.getByRole('button',{name:new RegExp('^'+(level+1)+'단계 ·')}).click();assert.equal(await page.evaluate(()=>getPlaySettings().level),level);
    assert.match(await page.locator('.play-level-summary').innerText(),new RegExp('^'+(level+1)+'단계'));
    assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-pressed')),'true','selection keeps keyboard focus');
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(width===360)await page.screenshot({path:output+'/levels-mobile.png',fullPage:true});
   if(width===768)await page.screenshot({path:output+'/levels-tablet.png',fullPage:true});
   await page.locator('.play-info-button').click();assert.equal(await page.locator('.play-difficulty-table tbody tr').count(),10);
   if(width===360)await page.screenshot({path:output+'/comparison-mobile.png',fullPage:true});
   await page.locator('#play-dialog footer button').click();await page.getByRole('button',{name:/시작/}).click();
   await page.locator('#screen-play .board-cell').first().waitFor();assert.match(await page.locator('.play-badge').innerText(),/10단계/);
   if(width===360)await page.screenshot({path:output+'/play-mobile.png',fullPage:true});
   await page.evaluate(()=>{globalThis.aiUiTicks=0;globalThis.aiUiTimer=setInterval(()=>aiUiTicks++,25);});
   await page.locator('#screen-play .board-cell').nth(52).click();await page.locator('#screen-play .board-cell').nth(36).click();
   await page.waitForFunction(()=>state.game.turn==='w'&&!state.animating&&state.actionHistory.length>=2,null,{timeout:18000});
   assert.equal(await page.evaluate(()=>playAiWorker instanceof Worker),true,'AI is computed in a worker');assert.ok(await page.evaluate(()=>aiUiTicks)>15,'UI stays responsive during high-level search');
   await page.evaluate(()=>{clearInterval(aiUiTimer);saveActiveSession();});await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>resumeActivity());
   assert.equal(await page.evaluate(()=>state.play.level),9);assert.match(await page.locator('.play-badge').innerText(),/10단계/);
   await page.getByRole('button',{name:/되돌리기/}).click();assert.equal(await page.evaluate(()=>state.play.level),9);assert.equal(await page.evaluate(()=>state.game.board[6][4]),'wP');
   await page.locator('#screen-play .back-btn').click();await page.evaluate(()=>{savePlaySettings({...getPlaySettings(),level:9});playStart();});
   await page.locator('#screen-play .board-cell').nth(52).click();await page.locator('#screen-play .board-cell').nth(36).click();await page.waitForFunction(()=>state.game.turn==='b');
   await page.locator('#screen-play .back-btn').click();assert.equal(await page.evaluate(()=>playAiWorker),null);await page.waitForTimeout(450);assert.equal(await page.locator('.play-level').count(),10,'leaving cancels old search');
   // Real Worker execution confirms the highest levels reach deeper completed searches.
   const searches=await page.evaluate(async()=>{
    const worker=new Worker('js/chess-ai.js'),position=playPosition(ChessGame.fromFEN('k7/8/8/8/8/8/4P3/4K3 w - - 0 1')),rows=[];
    try{for(const level of [7,8,9])rows.push(await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('worker search timeout')),12000);worker.onmessage=e=>{clearTimeout(timer);resolve({level:level+1,...e.data.search,move:e.data.move});};worker.onerror=e=>reject(Error(e.message));worker.postMessage({id:level,position,level});}));}finally{worker.terminate();}return rows;
   });assert.deepEqual(searches.map(s=>s.completedDepth),[6,8,10]);
   results.push({width,build:await page.evaluate(()=>CHESS_BUILD),levels:10,migration:true,resumeUndo:true,workerResponsive:true,searches});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(output+'/results.json',JSON.stringify({results,errors},null,2));console.log('Ten-level AI browser QA passed:',JSON.stringify(results));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
