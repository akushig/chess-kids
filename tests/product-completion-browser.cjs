const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const output='/tmp/chess-product-qa';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});const errors=[],results=[];
 try{for(const viewport of [{width:360,height:780},{width:768,height:1024},{width:1280,height:900}]){
  const context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/^체스 처음 배우기/}).click();
  assert.equal(await page.locator('.goal-mark').textContent(),'🚩');assert.equal(await page.locator('.board-cell').filter({has:page.locator('.goal-mark')}).count(),1);
  assert.equal(await page.locator('.mission-speech .read-guide').isVisible(),true,'manual speech is available with automatic speech off');
  await page.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){window.heardGuide=u.text;}}}));await page.locator('.mission-speech .read-guide').click();assert.match(await page.evaluate(()=>window.heardGuide),/룩/);assert.equal(await page.evaluate(()=>!!readData('preferences',{}).voice),false);await page.screenshot({path:`${output}/rook-${viewport.width}.png`,fullPage:true});
  const before=await page.locator('.mission-board').boundingBox();await page.locator('#screen-learn .board-cell').nth(15).click();await page.locator('#clear-overlay').waitFor();
  const buttons=await page.locator('#clear-overlay footer button').evaluateAll(bs=>bs.map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height,text:b.textContent})));
  assert.ok(buttons.every(b=>b.w>=100&&b.h>=44),JSON.stringify(buttons));
  assert.equal(await page.getByRole('button',{name:'다음 모험',exact:true}).isVisible(),true);assert.equal(await page.locator('#app').evaluate(el=>el.inert),true);
  await page.screenshot({path:`${output}/complete-${viewport.width}.png`,fullPage:true});await page.keyboard.press('Escape');assert.equal(await page.locator('#clear-overlay').count(),0);assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);
  const after=await page.locator('.mission-board').boundingBox();assert.ok(Math.abs(before.y-after.y)<1,'result did not move board');
  await page.evaluate(()=>{writeData('preferences',{motion:false});applyPreferences();goMissionPlay('R',6);for(const p of findMissionSolvePath().slice(1))missionClick(...p);});await page.locator('#clear-overlay').waitFor();
  assert.equal(await page.getByRole('button',{name:'다음 모험',exact:true}).count(),0);await page.getByRole('button',{name:'룩으로 성 지키기',exact:true}).click();assert.equal(await page.evaluate(()=>state.activeKind),'defense');
  await page.getByRole('button',{name:'▶ 움직임 보기 · 연습 규칙',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
  await page.evaluate(()=>{writeData('preferences',{motion:false});goMiniMenu();});
  await page.getByRole('button',{name:/나이트 투어/}).click();assert.equal(await page.evaluate(()=>state.kt.mode),'walk');
  await page.evaluate(()=>knightTourClick(...getKnightMoves(...state.kt.pos,state.kt.size,state.kt.board)[0]));const saved=await page.evaluate(()=>JSON.stringify([state.kt.pos,state.kt.board,state.actionHistory]));
  await page.getByRole('button',{name:'← 놀이터',exact:true}).click();await page.getByRole('button',{name:/나이트 투어/}).click();assert.equal(await page.evaluate(()=>JSON.stringify([state.kt.pos,state.kt.board,state.actionHistory])),saved);
  await page.getByRole('button',{name:'← 놀이터',exact:true}).click();await page.getByRole('button',{name:'새 판 고르기',exact:true}).first().click();await page.getByRole('button',{name:'취소',exact:true}).click();
  await page.getByRole('button',{name:/나이트 투어/}).click();assert.equal(await page.evaluate(()=>JSON.stringify([state.kt.pos,state.kt.board,state.actionHistory])),saved);
  await page.getByRole('button',{name:'다시 하기',exact:true}).click();await page.getByRole('button',{name:'같은 판 다시 하기',exact:true}).click();assert.equal(await page.evaluate(()=>state.kt.moveCount),0);
  await page.getByRole('button',{name:'투어',exact:true}).click();await page.getByRole('button',{name:'힌트 보기',exact:true}).click();assert.equal(await page.locator('.kt-route-number').count(),24);
  await page.evaluate(()=>{goMiniMenu();showScreen('home');renderHome();});await page.getByRole('button',{name:/프로필 · 설정/}).click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'놀이 기록 보기',exact:true}).click();assert.ok(await page.locator('.learning-summary').textContent());
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('[aria-modal="true"]')),true);await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'🎨 내 꾸미기',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),1);await page.keyboard.press('Escape');
  await page.evaluate(()=>goPuzzleLevel(2));assert.equal(await page.locator('.target-badge').count(),1);
  await page.evaluate(()=>{const m=puzzleWinningMoves(state.puzzleGame,PUZZLES[state.puzzleIndex])[0];puzzleClick(m[0],m[1]);puzzleClick(m[2],m[3]);});assert.equal(await page.locator('.completion-summary').count(),1);
  await page.getByRole('button',{name:'다음 장면',exact:true}).click();assert.equal(await page.evaluate(()=>state.puzzleIndex),1);
  await page.evaluate(()=>{goMiniMenu();scrollTo(0,0);});assert.ok((await page.locator('.screen.active').boundingBox()).width<=viewport.width);
  const widths=await page.locator('.activity-menu-item .menu-btn').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().width));assert.ok(Math.max(...widths)-Math.min(...widths)<1,'playground cards have consistent width');await page.screenshot({path:`${output}/playground-${viewport.width}.png`,fullPage:true});await page.evaluate(()=>{savePlaySettings({...getPlaySettings(),mode:'friend',timer:30});playStart();playCommitMove([6,4,4,4]);});await page.getByRole('button',{name:/되돌리기/}).click();assert.equal(await page.evaluate(()=>playTimerHandle),null);await page.keyboard.press('Escape');assert.notEqual(await page.evaluate(()=>playTimerHandle),null);assert.equal(await page.evaluate(()=>state.actionHistory.length),1);await page.evaluate(()=>{Object.defineProperty(window,'speechSynthesis',{configurable:true,value:undefined});goMissionPlay('B',0);});await page.locator('.mission-speech .read-guide').click();assert.match(await page.locator('#game-toast').innerText(),/음성 읽기를 지원하지/);await page.locator('#game-toast .toast-close').click();results.push({viewport,passed:true});await context.close();
 }}finally{await browser.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(`${output}/results.json`,JSON.stringify({results,errors},null,2));console.log('Product journeys passed:',JSON.stringify(results));
})().catch(e=>{console.error(e);process.exitCode=1});
