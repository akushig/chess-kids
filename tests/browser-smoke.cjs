// Optional browser integration test: set CHESS_PLAYWRIGHT_MODULE and CHESS_BROWSER_EXECUTABLE.
const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto(process.env.CHESS_TEST_URL||'http://127.0.0.1:8765',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:/모험/}).first().waitFor();
 await page.evaluate(()=>goMissionPlay('R',0));await page.locator('#screen-learn .board-cell').nth(15).click();
 await page.waitForFunction(()=>state.missionSolved);
 await page.evaluate(()=>{goMissionPlay('K',3);});await page.locator('#screen-learn .board-cell').nth(22).click();await page.waitForFunction(()=>state.missionFailed);
 await page.getByRole('button',{name:/되돌리기/}).click();assert.equal(await page.evaluate(()=>state.missionFailed),false);
 await page.evaluate(()=>{playStart();state.game=ChessGame.fromFEN('4r2k/8/8/8/8/8/R7/4K3 w - - 0 1');renderPlay();});
 await page.getByRole('button',{name:/길 막기/}).waitFor();
 fs.mkdirSync('/tmp/chess-kids-ui',{recursive:true});await page.screenshot({path:'/tmp/chess-kids-ui/check-mobile.png',fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:/길 막기/}).click();
 await page.locator('#screen-play .board-cell').nth(48).click();await page.locator('#screen-play .board-cell').nth(52).click();
 await page.waitForFunction(()=>!state.animating);
 await page.evaluate(()=>goKnightTour(0,'walk'));
 const path=await page.evaluate(()=>knightGoalPath().path);
 for(const [r,c]of path.slice(1)){await page.locator('#screen-mini .board-cell').nth(r*5+c).click();await page.waitForFunction(()=>!state.animating);}
 assert.equal(await page.evaluate(()=>state.kt.clear),true);
 await page.evaluate(()=>goKnightTour(0,'explore'));await page.locator('#screen-mini .board-cell').nth(11).click();await page.waitForFunction(()=>!state.animating);
 await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>resumeActivity());assert.equal(await page.evaluate(()=>state.kt.visited),2);
 await page.screenshot({path:'/tmp/chess-kids-ui/knight-mobile.png',fullPage:true,animations:'disabled'});
 for(const fn of ['goCollector(0)','goBomb(0)','goDefense(0)','goSurvival(0)','goPuzzleLevel(4)']){await page.evaluate(fn);assert.ok(await page.locator('.screen.active .board-cell').count()>0,fn);}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'mobile horizontal overflow');
 assert.deepEqual(errors,[],'browser errors');
 await browser.close();console.log('Browser smoke passed: real inputs, check rescue, undo, knight goal, reload/resume and all game screens.');
})().catch(e=>{console.error(e);process.exitCode=1;});
