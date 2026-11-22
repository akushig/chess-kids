const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url=process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/';
const output=process.env.CHESS_ROYAL_QA_OUTPUT||'/tmp/chess-royal-qa';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const errors=[],results=[];fs.mkdirSync(output,{recursive:true});
 try{
  for(const width of [360,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>goWorkshop('skin'));
   await page.getByRole('button',{name:'로열 클래식',exact:true}).click();
   assert.equal(await page.evaluate(()=>currentSkin),'royal');assert.equal(await page.evaluate(()=>getAllStars()),0);
   assert.equal(await page.evaluate(()=>isSkinUnlocked('royal')),true);
   assert.deepEqual(await page.evaluate(async()=>{const im=new Image();im.src='icons/skins/royal-classic/atlas.webp';await im.decode();return [im.naturalWidth,im.naturalHeight];}),[1536,1536]);
   await page.screenshot({path:path.join(output,`workshop-${width}.png`),fullPage:true});
   await page.getByRole('button',{name:'♞ 말 모션 보기',exact:true}).click();
   await page.locator('#royal-demo .royal-victim').waitFor();
   await page.waitForFunction(()=>!state.animating);
   await page.getByRole('button',{name:'▶ 다시 보기',exact:true}).click();
   await page.locator('#royal-demo .royal-mover').waitFor();
   await page.locator('#royal-preview-overlay .dialog-close').click();
   assert.equal(await page.evaluate(()=>royalActivities.size),0);
   async function setup(fen,face=false,flipped=false){
    await page.evaluate(({fen,face,flipped})=>{
     cancelRoyalAnimations();setSkin('royal');writeData('preferences',{motion:true,voice:false});applyPreferences();
     playStart({...getPlaySettings(),mode:'friend',face,small:false,preset:null,timer:0,content:null,help:false});
     state.game=ChessGame.fromFEN(fen);renderPlay();if(flipped)document.querySelector('#screen-play .chess-board').classList.add('flipped');
    },{fen,face,flipped});
   }
   async function move(m,capture=false){
    await page.evaluate(m=>playCommitMove(m),m);
    await page.locator('.royal-mover').waitFor();
    if(capture){
     assert.equal(await page.locator('.royal-mover svg').getAttribute('data-pose'),'attack');
     await page.locator('.royal-victim').waitFor();
     assert.equal(await page.locator('.royal-victim svg').getAttribute('data-pose'),'hit');
    }
    await page.waitForFunction(()=>!state.animating&&royalActivities.size===0);
    assert.equal(await page.locator('.royal-mover,.royal-victim,.royal-impact').count(),0);
    assert.equal(await page.locator('.board-cell svg[style*="visibility: hidden"]').count(),0);
   }
   await setup('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
   await page.screenshot({path:path.join(output,`board-${width}.png`),fullPage:true});
   await move([7,6,5,5]);assert.equal(await page.evaluate(()=>state.game.board[5][5]),'wN');
   await setup('4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1');
   await move([5,2,3,3],true);assert.equal(await page.evaluate(()=>state.game.captured.w[0]),'bP');
   await setup('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
   await move([3,4,2,3],true);assert.equal(await page.evaluate(()=>state.game.board[3][3]),null);
   await setup('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
   await page.evaluate(()=>playCommitMove([7,4,7,6]));
   assert.equal(await page.locator('.royal-mover').count(),2);
   await page.waitForFunction(()=>!state.animating&&royalActivities.size===0);
   assert.equal(await page.evaluate(()=>state.game.board[7][5]),'wR');
   await setup('4k3/8/2n5/8/3P4/8/8/4K3 b - - 0 1',true);
   await move([2,2,4,3],true);
   await setup('4k3/8/2n5/8/3P4/8/8/4K3 b - - 0 1',false,true);
   await move([2,2,4,3],true);
   // Promotion replaces the moving pawn only after landing.
   await setup('7k/P7/8/8/8/8/8/4K3 w - - 0 1');await move([1,0,0,0,'Q']);
   assert.equal(await page.evaluate(()=>state.game.board[0][0]),'wQ');
   // Leaving during recoil must cancel callbacks and remove every transient.
   await setup('4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1');
   await page.evaluate(()=>playCommitMove([5,2,3,3]));await page.locator('.royal-victim').waitFor();
   await page.evaluate(()=>{showScreen('home');renderHome();});
   assert.equal(await page.evaluate(()=>royalActivities.size),0);assert.equal(await page.locator('.royal-mover,.royal-victim,.royal-impact').count(),0);
   // Both app preferences and OS accessibility preferences bypass motion.
   for(const reduced of ['app','os']){
    await setup('4k3/8/8/8/8/8/P7/4K3 w - - 0 1');
    if(reduced==='app')await page.evaluate(()=>{writeData('preferences',{motion:false});applyPreferences();});
    else await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(()=>playCommitMove([6,0,5,0]));
    assert.equal(await page.locator('.royal-mover').count(),0);assert.equal(await page.evaluate(()=>state.animating),false);
    await page.emulateMedia({reducedMotion:'no-preference'});
   }
   // Existing skins still use their original movement path.
   await setup('4k3/8/8/8/8/8/P7/4K3 w - - 0 1');
   await page.evaluate(()=>{setSkin('cute');renderPlay();playCommitMove([6,0,5,0]);});
   assert.equal(await page.locator('.move-anim:not(.royal-mover)').count(),1);await page.waitForFunction(()=>!state.animating);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   // Persist the free selection across reloads.
   await page.evaluate(()=>setSkin('royal'));await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.evaluate(()=>currentSkin),'royal');
   results.push({width,passed:true});await context.close();
  }
  const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(url);
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.evaluate(()=>setSkin('royal'));await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(async()=>{const im=new Image();im.src='icons/skins/royal-classic/atlas.webp';await im.decode();return im.naturalWidth;}),1536);
  await page.evaluate(()=>{playStart({...getPlaySettings(),mode:'friend',small:false,preset:null,content:null});playCommitMove([7,6,5,5]);});
  await page.waitForFunction(()=>!state.animating);assert.equal(await page.evaluate(()=>state.game.board[5][5]),'wN');
  await context.close();assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,offline:true,errors},null,2));
  console.log('Royal browser QA passed:',JSON.stringify({results,offline:true,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
