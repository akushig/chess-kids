const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const output=process.env.CHESS_CASTLING_QA_OUTPUT||'/tmp/chess-castling-qa';fs.mkdirSync(output,{recursive:true});const results=[],errors=[];
 try{
  for(const width of [360,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(process.env.CHESS_TEST_URL||'http://127.0.0.1:8765',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{writeData('preferences',{motion:false});applyPreferences();});
   const cells=()=>page.locator('#screen-play .board-cell'),board=()=>page.locator('#screen-play .chess-board').boundingBox();
   async function setup(fen){await page.evaluate(fen=>{playStart();state.play.mode='friend';state.play.small=false;state.game=ChessGame.fromFEN(fen);renderPlay();scrollTo(0,0);},fen);await page.waitForTimeout(360);}
   function same(before,after){for(const k of ['x','y','width','height'])assert.ok(Math.abs(before[k]-after[k])<.6,'board moved '+k);}
   for(const color of ['w','b'])for(const side of ['king','queen'])for(const input of ['target','rook']){
    const row=color==='w'?7:0,to=side==='king'?6:2,rook=side==='king'?7:0;
    await setup(`r3k2r/8/8/8/8/8/8/R3K2R ${color} KQkq - 0 1`);const before=await board();await cells().nth(row*8+4).click();
    await page.locator('#screen-play .castle-target').first().waitFor();assert.equal(await page.locator('#screen-play .castle-mark').count(),2);
    assert.match(await cells().nth(row*8+to).getAttribute('aria-label'),/캐슬링 가능/);same(before,await board());
    if(width===360&&color==='w'&&side==='king'&&input==='target'){
     await page.screenshot({path:output+'/available-mobile.png',fullPage:true});await page.getByRole('button',{name:'🏰 캐슬링 안내',exact:true}).click();same(before,await board());
     assert.match(await page.locator('#game-toast').innerText(),/킹 쪽 · g1: 가능해요/);await page.screenshot({path:output+'/help-mobile.png',fullPage:true});await page.getByRole('button',{name:'안내 닫기',exact:true}).click();
    }
    await cells().nth(row*8+(input==='target'?to:rook)).click();await page.waitForFunction(()=>!state.animating);same(before,await board());
    assert.equal(await page.evaluate(({row,to,color})=>state.game.board[row][to]===color+'K'&&state.game.board[row][to===6?5:3]===color+'R',{row,to,color}),true);
    assert.match(await page.locator('#game-toast').innerText(),/캐슬링이에요/);results.push({width,color,side,input,passed:true});
   }
   await setup('5r1k/8/8/8/8/8/8/R3K2R w KQ - 0 1');const before=await board();await cells().nth(60).click();await cells().nth(62).click();
   assert.match(await page.locator('#game-toast').innerText(),/지나갈 f1 칸이 공격/);assert.match(await cells().nth(61).getAttribute('aria-label'),/캐슬링을 막는 칸/);same(before,await board());
   if(width===360)await page.screenshot({path:output+'/blocked-mobile.png',fullPage:true});
   await cells().nth(63).click();assert.deepEqual(await page.evaluate(()=>state.game.selected),[7,7]);assert.match(await page.locator('#game-toast').innerText(),/지나갈 f1/);
   for(const [fen,message]of [
    ['r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1','왕을 이미 움직였어요'],
    ['r3k2r/8/8/8/8/8/8/R3K2R w Q - 0 1','룩을 이미 움직였어요'],
    ['4r2k/8/8/8/8/8/8/R3K2R w KQ - 0 1','지금 왕이 체크 상태'],
    ['6rk/8/8/8/8/8/8/R3K2R w KQ - 0 1','도착할 g1 칸이 공격'],
    ['4k3/8/8/8/8/8/8/R3KB1R w KQ - 0 1','사이의 f1 칸에 말'],
   ]){
    await setup(fen);const position=await board();await cells().nth(60).click();await cells().nth(62).click();
    assert.ok((await page.locator('#game-toast').innerText()).includes(message),message);same(position,await board());
   }
   await page.evaluate(()=>{savePlaySettings({...getPlaySettings(),small:true});goPlay();});assert.match(await page.locator('#screen-play').innerText(),/짧은 판.*캐슬링을 하지/);
   await page.getByRole('button',{name:'🚀 시작!',exact:true}).count().then(async n=>{if(n)await page.getByRole('button',{name:'🚀 시작!',exact:true}).click();else await page.evaluate(()=>playStart());});
   await cells().nth(60).click();await cells().nth(62).click();assert.match(await page.locator('#game-toast').innerText(),/짧은 판에서는 캐슬링/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(output+'/results.json',JSON.stringify({results,errors},null,2));console.log(`Castling browser QA passed: ${results.length} execution combinations plus blocked/short-board/help checks.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
