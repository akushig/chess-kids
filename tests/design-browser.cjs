// Navigation and text containment after the club design refresh.
const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output=process.env.CHESS_DESIGN_QA_OUTPUT||'/tmp/chess-design-qa';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const errors=[],checks=[];
 try{
  for(const width of [320,360,390,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();
   page.on('pageerror',e=>errors.push(`${width}: ${e.message}`));
   await page.route('https://fonts.googleapis.com/**',r=>r.abort());
   await page.goto(process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{writeData('preferences',{motion:false,voice:false});applyPreferences();});
   async function check(label){
    await page.evaluate(()=>scrollTo(0,0));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width} ${label}: page overflow`);
    const escaped=await page.evaluate(()=>{
     const issues=[];
     for(const el of document.querySelectorAll('.screen.active button:not(.board-cell),.screen.active summary')){
      if(!el.getClientRects().length)continue;
      const button=el.getBoundingClientRect(),walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
       const node=walker.currentNode;if(!node.textContent.trim()||!node.parentElement.getClientRects().length)continue;
       if(node.parentElement.closest('[aria-hidden=true],svg'))continue;
       const range=document.createRange();range.selectNodeContents(node);
       for(const rect of range.getClientRects())if(rect.width&&rect.height&&(rect.left<button.left-2||rect.right>button.right+2||rect.top<button.top-2||rect.bottom>button.bottom+2))issues.push(node.textContent.trim().slice(0,50));
      }
     }
     return issues;
    });
    assert.deepEqual(escaped,[],`${width} ${label}: text escaped its control`);checks.push({width,label});
   }
   await check('home');
   assert.equal(await page.locator('.home-destinations button').count(),2);
   await page.screenshot({path:`${output}/home-${width}.png`,fullPage:true,animations:'disabled'});
   await page.getByRole('button',{name:'배우기',exact:true}).click();await check('study');
   await page.screenshot({path:`${output}/study-${width}.png`,fullPage:true,animations:'disabled'});
   await page.locator('.study-card').filter({hasText:'체스 수업'}).click();
   for(const label of ['내 말 지키기','말의 가치','체크와 체크메이트','전술','특별한 수']){
    await page.locator('.lesson-unit-tabs').getByRole('button',{name:label,exact:true}).click();
    assert.equal(await page.locator('.lesson-unit:visible').count(),1);
    await check('lessons '+label);
   }
   await page.getByRole('button',{name:'← 배우기',exact:true}).click();
   await page.locator('.study-card').filter({hasText:'승급 과정'}).click();await check('course');
   await page.getByRole('button',{name:'← 배우기',exact:true}).click();
   await page.getByRole('button',{name:'놀이터',exact:true}).click();
   let games=0;
   for(const label of ['탐험과 발견','새로운 도전','길찾기','잡기와 안전','대전 놀이']){
    await page.locator('.collection-tabs').getByRole('button',{name:label,exact:true}).click();await check('playground '+label);
    games+=await page.locator('.menu-btn:visible').count();
   }
   assert.equal(games,8,'every mini game remains reachable');
   await page.locator('.collection-tabs').getByRole('button',{name:'탐험과 발견',exact:true}).click();
   await page.screenshot({path:`${output}/playground-${width}.png`,fullPage:true,animations:'disabled'});
   await page.locator('.menu-btn').filter({hasText:'기사의 여행'}).click();await check('knight board');
   await page.locator('.board-cell.move-hint').first().click();await page.waitForFunction(()=>!state.animating);
   const saved=await page.evaluate(()=>JSON.stringify([state.kt,state.actionHistory]));
   await page.getByRole('button',{name:'← 놀이터',exact:true}).click();
   await page.locator('.menu-btn').filter({hasText:'기사의 여행'}).click();
   assert.equal(await page.evaluate(()=>JSON.stringify([state.kt,state.actionHistory])),saved,'new collection preserves the saved board and undo');
   await page.evaluate(()=>{leaveActivity();showScreen('home');renderHome();});
   await page.locator('.hero-play').click();await check('play setup');
   assert.equal(await page.locator('#play-board-settings').getAttribute('open'),null);
   await page.locator('#play-board-settings>summary').click();
   await page.locator('#play-board-settings .play-chip').filter({hasText:'모든 말로 한 판'}).click();
   assert.equal(await page.locator('#play-board-settings').evaluate(el=>el.open),true,'setting changes keep their panel open');
   assert.equal(await page.evaluate(()=>getPlaySettings().small),true);
   await check('expanded board options');
   await page.locator('.play-variants>summary').click();await page.locator('.play-extras>summary').click();await check('all play options');
   await page.screenshot({path:`${output}/play-${width}.png`,fullPage:true,animations:'disabled'});
   await page.evaluate(()=>{updateProfile(activeProfile,'아주 긴 이름을 가진 우리집 체스 기사님','🙂');goStudy();});
   await page.evaluate(()=>document.documentElement.style.fontSize='24px');await check('study with 150 percent text');
   await page.evaluate(()=>{goMiniMenu('explore');renderMiniMenu('challenge');});await check('games with 150 percent text');
   await page.evaluate(()=>{document.documentElement.style.fontSize='';showScreen('home');renderHome();});await check('long profile name');
   await page.locator('.home-personal button').filter({hasText:'공방'}).click();await check('workshop');
   await page.evaluate(()=>{leaveActivity();goReward();});await check('records');
   await context.close();
  }
  assert.deepEqual(errors,[],'no browser errors');
  fs.writeFileSync(`${output}/results.json`,JSON.stringify({checks,errors},null,2));
  console.log(`Design QA passed: ${checks.length} checks at 320, 360, 390, 768 and 1280 px.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
