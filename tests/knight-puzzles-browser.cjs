// B: knight rule puzzles with real taps and the keyboard, reload, and a real profile file moved to a new browser.
const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output=process.env.CHESS_PUZZLE_QA_OUTPUT||'/tmp/chess-knight-puzzle-qa';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const results=[],errors=[],url=process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/';
 async function fresh(viewport){const context=await browser.newContext({viewport,serviceWorkers:'block',acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(`${viewport.width}: ${e.message}`));await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(url,{waitUntil:'domcontentloaded'});await page.evaluate(()=>{writeData('preferences',{motion:false,voice:false});applyPreferences();});return {context,page};}
 try{for(const viewport of [{width:360,height:780},{width:768,height:1024},{width:1280,height:900}]){
  const w=viewport.width,{context,page}=await fresh(viewport),ev=(fn,arg)=>page.evaluate(fn,arg);
  const mini=page.locator('#screen-mini'),cells=()=>mini.locator('.board-cell'),status=()=>mini.locator('.kt-status').innerText();
  const board=()=>ev(()=>{const r=document.querySelector('#screen-mini .chess-board').getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height};});
  const same=(a,b,label)=>{for(const k of ['x','y','width','height'])assert.ok(Math.abs(a[k]-b[k])<.6,`${w} ${label} board ${k}: ${a[k]} -> ${b[k]}`);};
  const noOverflow=async label=>assert.equal(await ev(()=>document.documentElement.scrollWidth>innerWidth),false,`${w} ${label} overflow`);
  const size=()=>ev(()=>state.kt.size),tap=async(r,c)=>{await cells().nth(r*await size()+c).click();await page.waitForFunction(()=>!state.animating);};
  // Keyboard: arrows move focus from the knight's square, Enter jumps.
  async function key(r,c){const [pr,pc]=await ev(()=>state.kt.pos);await mini.locator('.board-cell[tabindex="0"]').focus();
   for(let i=0;i<Math.abs(r-pr);i++)await page.keyboard.press(r>pr?'ArrowDown':'ArrowUp');for(let i=0;i<Math.abs(c-pc);i++)await page.keyboard.press(c>pc?'ArrowRight':'ArrowLeft');
   await page.keyboard.press('Enter');await page.waitForFunction(()=>!state.animating);}
  const solution=id=>ev(id=>KNIGHT_PUZZLES.find(p=>p.id===id).solution,id);

  // Home → knight → rule puzzles, without lessons first.
  await page.locator('#screen-home .home-primary .menu-btn').filter({hasText:'기사의 여행'}).click();await mini.getByRole('button',{name:'규칙 문제',exact:true}).click();
  assert.equal(await mini.locator('.kp-card').count(),10);assert.equal(await ev(()=>state.activeKind),null,'opening the list starts nothing');await noOverflow('puzzle list');
  if(w===360)await page.screenshot({path:`${output}/puzzle-list-${w}.png`,fullPage:true,animations:'disabled'});
  await mini.locator('.kp-card').first().focus();await page.keyboard.press('Enter');assert.equal(await ev(()=>state.kt.puzzle.id),'knight-shape-hole-5-v1');
  await ev(()=>scrollTo(0,0));const start=await board();
  assert.match(await cells().nth(12).getAttribute('aria-label'),/판에 없는 칸/);await cells().nth(12).click();assert.match(await status(),/판에 없어요.*뛰어넘을 수 있지만/s);same(start,await board(),'missing square tap');
  assert.equal(await ev(()=>state.kt.visited),1);
  const s1=await solution('knight-shape-hole-5-v1');await key(...s1[1]);await key(...s1[2]);assert.equal(await ev(()=>state.kt.moveCount),2,'keyboard jumps');
  assert.match(await mini.locator('.kt-progress').innerText(),/3 \/ 24칸 방문/);same(start,await board(),'progress');
  for(const [r,c] of s1.slice(3))await tap(r,c);assert.equal(await ev(()=>state.kt.clear),true);assert.match(await status(),/24칸을 모두 해냈어요/);
  if(w===360)await page.screenshot({path:`${output}/shape-clear-${w}.png`,fullPage:true,animations:'disabled'});
  await mini.getByRole('button',{name:'다음 문제',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await ev(()=>state.kt.puzzle.id),'knight-shape-plus-6-v1');

  // Hints follow the same rule: the numbered route never uses a missing square.
  await ev(()=>scrollTo(0,0));const plusBoard=await board();const s2=await solution('knight-shape-plus-6-v1');await tap(...s2[1]);
  await mini.getByRole('button',{name:'힌트 보기',exact:true}).click();await mini.getByRole('button',{name:'전체 경로',exact:true}).click();
  assert.equal(await mini.locator('.kt-route-number').count(),18);assert.equal(await mini.locator('.kt-hole .kt-route-number').count(),0);same(plusBoard,await board(),'route hint');
  if(w===360)await page.screenshot({path:`${output}/shape-hint-${w}.png`,fullPage:true,animations:'disabled'});

  // Reload and continue from the home entry, with undo.
  await page.reload({waitUntil:'domcontentloaded'});const entry=page.locator('#screen-home .home-primary .menu-btn').filter({hasText:'기사의 여행'});
  assert.match(await entry.innerText(),/▶ 이어하기.*규칙 문제 · 십자 모양 · 1번 점프/s);await entry.click();assert.deepEqual(await ev(()=>[state.kt.puzzle.id,state.kt.moveCount,state.actionHistory.length]),['knight-shape-plus-6-v1',1,1]);
  await mini.getByRole('button',{name:/되돌리기/}).click();assert.equal(await ev(()=>state.kt.moveCount),0);await tap(...s2[1]);

  // Ordered marks: an early mark is refused and explained; the list asks before replacing a saved board.
  await mini.getByRole('button',{name:'규칙 문제',exact:true}).click();assert.match(await mini.locator('.kp-card').nth(1).innerText(),/▶ 하던 판/);
  await mini.locator('.kp-card').filter({hasText:'두 모서리'}).click();await page.getByRole('dialog').waitFor();assert.match(await page.getByRole('dialog').innerText(),/하던 판이 바뀌어요/);
  await page.getByRole('button',{name:'새 판 시작',exact:true}).click();assert.equal(await ev(()=>state.kt.puzzle.id),'knight-order-two-5-v1');
  await ev(()=>scrollTo(0,0));const orderBoard=await board();await tap(3,2);await cells().nth(24).click();
  assert.match(await status(),/② 표식은 ① 표식 다음에 밟아요\. 지금은 ① 차례예요\./);assert.equal(await ev(()=>state.kt.board[4][4]),false);same(orderBoard,await board(),'early mark');
  assert.match(await mini.locator('.kt-progress').innerText(),/다음 표식 ①/);assert.match(await cells().nth(4).getAttribute('aria-label'),/표식 1번 다음 차례/);
  if(w===360)await page.screenshot({path:`${output}/order-early-mark-${w}.png`,fullPage:true,animations:'disabled'});
  await mini.getByRole('button',{name:/되돌리기/}).click();const s6=await solution('knight-order-two-5-v1');for(const [r,c] of s6.slice(1))await tap(r,c);
  assert.equal(await ev(()=>state.kt.clear),true);assert.equal(await mini.locator('.kt-mark--passed').count(),2,'both marks are shown as passed and keep their numbers');
  assert.equal(await mini.locator('.kt-mark-badge').count(),2);await noOverflow('order clear');

  // Save mid-board, export the real file, import it in a separate browser and continue with undo.
  await mini.getByRole('button',{name:'다음 문제',exact:true}).click();const s7=await solution('knight-order-center-5-v1');for(const [r,c] of s7.slice(1,4))await tap(r,c);
  await ev(()=>{leaveActivity();showScreen('home');renderHome();});await page.getByRole('button',{name:'👤 프로필 · 설정',exact:true}).click();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'플레이어 1 내보내기',exact:true}).click();const file=`${output}/puzzle-profile-${w}.json`;await (await downloaded).saveAs(file);
  assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).version,2,'a file with a rule board is version 2');
  const target=await fresh(viewport),p=target.page;await p.getByRole('button',{name:'👤 프로필 · 설정',exact:true}).click();await p.locator('#profile-import-file').setInputFiles(file);
  await p.getByRole('button',{name:'새 프로필로 불러오기',exact:true}).click();await p.keyboard.press('Escape');await p.getByRole('button',{name:/이어서 놀기/}).click();
  assert.deepEqual(await p.evaluate(()=>[state.kt.puzzle.id,state.kt.moveCount,state.actionHistory.length,ktNextMark(state.kt)]),['knight-order-center-5-v1',3,3,await ev(()=>{const s=KNIGHT_PUZZLES[6];return s.solution.slice(0,4).some(([r,c])=>r===2&&c===2)?1:0;})]);
  await p.getByRole('button',{name:/되돌리기/}).click();assert.equal(await p.evaluate(()=>state.kt.moveCount),2);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await target.context.close();

  results.push({viewport,listAndKeyboard:true,missingSquare:true,hintRule:true,reloadResume:true,earlyMark:true,fileMove:true});await context.close();
 }}finally{await browser.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(`${output}/results.json`,JSON.stringify({results,errors},null,2));console.log('Knight rule puzzle browser QA passed:',JSON.stringify(results.map(r=>r.viewport.width)));
})().catch(e=>{console.error(e);process.exitCode=1;});
