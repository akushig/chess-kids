// Regression: feedback, captures, hints and outcomes cannot move an active board.
const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const output=process.env.CHESS_LAYOUT_QA_OUTPUT||'/tmp/chess-layout-qa';fs.mkdirSync(output,{recursive:true});
 const results=[],errors=[];
 try {
  for(const width of [360,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
   await page.goto(process.env.CHESS_TEST_URL||'http://127.0.0.1:8765',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{writeData('preferences',{motion:false,voice:false});applyPreferences();});
   const box=()=>page.locator('.screen.active .chess-board').boundingBox();
   async function stable(label,code){
    const before=await box();await page.evaluate(code);
    // Include accessibility enrichment, layout and the next several animation frames.
    const samples=await page.evaluate(async()=>{const samples=[];for(let i=0;i<8;i++){await new Promise(requestAnimationFrame);const r=document.querySelector('.screen.active .chess-board').getBoundingClientRect();samples.push({x:r.x,y:r.y,width:r.width,height:r.height});}return samples;});
    for(const after of samples)for(const key of ['x','y','width','height'])assert.ok(Math.abs(before[key]-after[key])<.6,`${width} ${label} ${key}: ${before[key]} -> ${after[key]}`);
    await page.waitForFunction(()=>!state.animating);
    const final=await box();for(const key of ['x','y','width','height'])assert.ok(Math.abs(before[key]-final[key])<.6,`${width} ${label} after animation: ${key}`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,label+' horizontal overflow');results.push({width,label});
   }
   for(const mode of ['ai','friend']){
    await page.evaluate(mode=>{playStart();state.play.mode=mode;state.play.timer=30;renderPlay();window.scrollTo(0,0);},mode);await page.waitForTimeout(400);
    await stable(mode+' check appears',()=>{state.game=ChessGame.fromFEN('4r2k/8/8/8/8/8/R7/4K3 w - - 0 1');renderPlay();});
    assert.ok(await page.getByRole('button',{name:/길 막기/}).count());
    await stable(mode+' dismiss rescue',()=>document.querySelector('.toast-close').click());
    await stable(mode+' reopen rescue',()=>document.querySelector('[onclick^="showGameToast(playGuideHTML"]').click());
    await stable(mode+' invalid move explanation',()=>{state.play.notice='이 말을 옮기면 왕이 공격받아요. 안전한 곳으로 왕을 피하거나 공격선을 막아봐요. '.repeat(4);renderPlay();});
    assert.equal(await page.locator('#screen-play .game-screen > .guide-card').count(),0,'no in-flow notice');
    await stable(mode+' many captures',()=>{state.game.captured.b=Array(15).fill('wP');state.game.captured.w=Array(15).fill('bP');renderPlay();});
    await stable(mode+' hint overlay',()=>playHint());
    await stable(mode+' draw and timer end',()=>{state.play.notice='';state.game.status='draw';state.game.drawReason='stalemate';renderPlay();});
    await stable(mode+' reset counters',()=>{state.game=new ChessGame();renderPlay();});
    if(width===360&&mode==='ai')await page.screenshot({path:output+'/play-mobile.png',fullPage:true});
   }
   const games=[
    ['mission',"goMissionPlay('R',2)",'state.missionNotice','renderMissionBoard()','showMissionHint()','state.missionFailed=true'],
    ['puzzle','goPuzzleLevel(4)','state.puzzleNotice','renderPuzzleBoard()','puzzleHint()','state.puzzleSolved=true'],
    ['collector','goCollector(0)','state.cl.notice','renderCollector()','collectorHint()','state.cl.failed=true;state.cl.failMsg="되돌려 다른 길로 가봐요."'],
    ['bomb','goBomb(0)','state.bm.notice','renderBomb()','bombHint()','state.bm.failed=true'],
    ['defense','goDefense(0)','state.df.notice','renderDefense()','defenseHint()','state.df.failed=true'],
    ['survival','goSurvival(0)','state.sv.notice','renderSurvival()','survivalHint()','state.sv.gameOver=true']
   ];
   for(const [name,start,notice,render,hint,end] of games){
    await page.evaluate(start);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(400);
    await stable(name+' long feedback',`${notice}='점이 있는 칸으로 움직여요. 다른 말이 길을 막고 있어요. '.repeat(6);${render}`);
    await stable(name+' feedback clears',`${notice}='';${render}`);
    await stable(name+' hint',hint);
    await stable(name+' outcome',`${end};${render}`);
   }
   await page.evaluate(()=>{goKnightTour(0,'tour');scrollTo(0,0);});await page.waitForTimeout(400);
   await stable('knight full route',()=>knightTourHint('path'));
   await stable('knight close route',()=>knightTourHint());
   await stable('knight branch alert',()=>{for(const [r,c]of [[2,1],[0,0],[1,2],[2,4]])knightTourClick(r,c);});
   await stable('knight blocked route',()=>knightTourClick(3,2));
   await stable('knight undo',()=>undoActivity());
   await stable('voice controls',()=>{writeData('preferences',{motion:false,voice:true});renderKnightTour();});
   if(width===360)await page.screenshot({path:output+'/knight-mobile.png',fullPage:true});
   // Closing a tall below-board hint/settings panel must not clamp page scroll.
   await page.evaluate(()=>{document.querySelector('.kt-settings').open=true;state.kt.settingsOpen=true;knightTourHint('path');});
   await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight-innerHeight));
   await stable('scrolled knight hint closes',()=>knightTourHint());
   await stable('scrolled settings close',()=>{state.kt.settingsOpen=false;renderKnightTour();});
   await stable('scrolled undo',()=>undoActivity());
   await page.evaluate(()=>{writeData('preferences',{motion:true,voice:false});goKnightTour(0,'tour');scrollTo(0,0);});await page.waitForTimeout(400);
   await stable('knight animated move',()=>knightTourClick(2,1));
   await page.evaluate(()=>{playStart();state.play.mode='friend';renderPlay();scrollTo(0,0);});await page.waitForTimeout(400);
   await stable('friend animated move',()=>{playClick(6,4);playClick(4,4);});
   await stable('toast closes',()=>{showGameToast('잠깐 나타나는 안내예요.');hideGameToast();});
   await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(output+'/results.json',JSON.stringify({results,errors},null,2));console.log(`Board layout QA passed: ${results.length} scenarios at 360, 768 and 1280 px.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
