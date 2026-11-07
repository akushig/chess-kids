// 승급 과정 · 내 대국 코치 · 나의 체스 공방 · 보호자 구매 화면 (docs/PREMIUM_COURSE.md)
// 실제 탭으로 판을 둔다. 둘 수는 판정기와 같은 계산(예시 풀이)으로 페이지 안에서 구하지만, 결과는 탭으로만 만든다.
// 360×640과 1280×900: 판 위치 고정, 버튼 화면 안·44px 이상, 목표·설명 넘침 없음, 가로 넘침 없음.
const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output=process.env.CHESS_PREMIUM_QA_OUTPUT||'/tmp/chess-premium-qa';fs.mkdirSync(output,{recursive:true});
const URL=process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const errors=[],results=[];
 try{for(const viewport of [{width:360,height:640},{width:1280,height:900}]){
  const tag=`${viewport.width}x${viewport.height}`,context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(`${tag}: ${e.message}`));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto(URL,{waitUntil:'domcontentloaded'});await page.evaluate(()=>{writeData('preferences',{motion:false,voice:false});applyPreferences();});
  const ev=(fn,arg)=>page.evaluate(fn,arg),settle=()=>page.waitForTimeout(480);
  const noScroll=async label=>assert.equal(await ev(()=>document.documentElement.scrollWidth>innerWidth),false,`${tag} ${label} 가로 넘침`);
  // 홈: 보조 타일 네 칸(체스 수업·승급 과정·놀이터·모험 지도), 칭호 칩, 공방 칩
  await ev(()=>{showScreen('home');renderHome();});
  assert.deepEqual(await page.locator('.home-more strong').allInnerTexts(),['체스 수업','승급 과정','놀이터','모험 지도']);
  for(const b of await page.locator('.home-more').all())assert.ok((await b.boundingBox()).height>=44);
  await noScroll('홈');await page.screenshot({path:`${output}/${tag}-home.png`,fullPage:true});
  // 승급 과정: 홈 타일을 눌러 들어가 단계 탭을 바꾼다
  await page.locator('.home-more',{hasText:'승급 과정'}).click();assert.equal(await ev(()=>state.screen),'course');
  assert.equal(await page.locator('.course-tabs [role=tab][aria-selected=true]').innerText(),'1단계');
  await page.locator('.course-tabs [role=tab]',{hasText:'2단계'}).click();assert.match(await page.locator('.course-stage h3').innerText(),/2단계/);
  await page.locator('.course-tabs [role=tab]',{hasText:'1단계'}).click();await noScroll('과정 목록');
  await page.screenshot({path:`${output}/${tag}-course.png`,fullPage:true});
  const C=page.locator('#screen-course'),cells=()=>C.locator('.board-cell'),tap=(r,c)=>cells().nth(r*8+c).click();
  const rect=()=>ev(()=>{const r=document.querySelector('#screen-course .chess-board').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  let base=null;
  const check=async label=>{
   const r=await rect();if(!base)base=r;for(const k of ['x','y','width','height'])assert.ok(Math.abs(r[k]-base[k])<.6,`${tag} ${label}: 판 ${k} ${base[k]} → ${r[k]}`);
   const info=await ev(()=>{const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent.trim()};},over=e=>e.scrollHeight-e.clientHeight;
    return {buttons:[...document.querySelectorAll('#screen-course .lesson-actions>button,#screen-course .lesson-header .back-btn,#screen-course .lesson-pick-btn')].map(box),goal:over(document.querySelector('#screen-course .lesson-goal')),feedback:over(document.querySelector('#screen-course .lesson-feedback')),title:over(document.querySelector('#screen-course .lesson-header h2'))};});
   for(const b of info.buttons){assert.ok(b.y>=0&&b.y+b.h<=viewport.height+.5&&b.x>=0&&b.x+b.w<=viewport.width+.5,`${tag} ${label} ${b.text} 화면 밖`);assert.ok(b.h>=44,`${tag} ${label} ${b.text} 높이 ${b.h}`);}
   assert.ok(info.goal<=1&&info.feedback<=1&&info.title<=1,`${tag} ${label} 문구 넘침 ${JSON.stringify(info)}`);await noScroll(label);
  };
  const solve=()=>ev(()=>{const {c,topic,level}=courseContext(),b=c.game.board,step=courseReplay(topic,level,c.line).step;
   if(topic.mode==='mate2')return step===0?level.witness:crMatesIn1(b)[0];
   if(topic.mode==='win2')return step===0?level.witness:lrMoves(b,'w').find(m=>crWin2Second(b,m,c.banked||0).result==='success');
   if(topic.mode==='endgame')return crEndgameBest(b);if(topic.mode==='ladder')return crLadderBest(b);return level.witness;});
  const move=async m=>{await tap(m[0],m[1]);await tap(m[2],m[3]);await page.waitForFunction(()=>['choose','result'].includes(state.course?.phase),null,{timeout:15000});};
  const play=async label=>{for(let i=0;i<40&&await ev(()=>state.course.phase)==='choose';i++){await move(await solve());await check(`${label} ${i+1}수`);}return ev(()=>state.course.result);};
  // 1-1 첫 판: 카드 탭 → 열쇠 → 상대 응수 → 메이트
  await C.locator('.course-card').first().click();assert.equal(await ev(()=>state.course.topicId),'m2-check');await check('두 수 메이트 시작');
  assert.equal(await play('두 수 메이트'),'success');assert.match(await C.locator('.lesson-goal').innerText(),/판 1 성공/);
  await page.screenshot({path:`${output}/${tag}-m2-success.png`});
  await settle();await C.locator('.lesson-actions .action-btn').nth(1).click();assert.equal(await ev(()=>state.course.levelIndex),1);await check('다음 판');
  // 끝내기: 룩 메이트 판에서 상자 힌트, 표의 가장 좋은 수로 끝까지
  await ev(()=>startCourseLevel('eg-krk',4));base=null;await check('룩 메이트');
  await C.locator('.lesson-actions .action-btn').first().click();assert.ok(await C.locator('.course-box').count()>0,'상자 힌트');
  assert.equal(await play('룩 메이트'),'success');await page.screenshot({path:`${output}/${tag}-krk-success.png`});
  // 초반: 캐슬링
  await ev(()=>startCourseLevel('op-castle',2));base=null;assert.equal(await play('캐슬링'),'success');
  // 승급 시험(1단계): 판을 만들고 실제 탭으로 다섯 문제
  await ev(()=>startCourseTest('stage1'));base=null;
  for(let i=0;i<5;i++){await page.waitForFunction(()=>state.course.phase==='choose',null,{timeout:30000});await check(`시험 ${i+1}`);assert.equal(await play(`시험 ${i+1}`),'success');await settle();await C.locator('.lesson-actions .action-btn').nth(1).click();}
  await page.waitForFunction(()=>state.course.phase==='complete');assert.match(await C.locator('.lesson-goal').innerText(),/통과/);
  await page.waitForSelector('#course-cert-overlay',{timeout:3000});assert.match(await page.locator('#course-cert').innerText(),/수료증|1단계/);
  await page.screenshot({path:`${output}/${tag}-certificate.png`});await page.locator('#course-cert-overlay .dialog-close').click();
  // 대국 코치: 장면 대전을 실제 탭으로 끝내고 결과 창의 코치 링크로 이동
  await ev(()=>openPlayScene(4));await page.waitForSelector('#screen-play.active');
  const P=page.locator('#screen-play .chess-board .board-cell');await P.nth(2*8+6).click();await P.nth(1*8+6).click();
  await page.waitForSelector('#play-dialog .play-coach-link',{timeout:5000});await page.locator('#play-dialog .play-coach-link').click();
  await page.waitForFunction(()=>state.screen==='coach'&&state.coach?.analysis,null,{timeout:10000});
  assert.match(await page.locator('#screen-coach').innerText(),/잘한 수|큰 실수 없이/);await noScroll('코치');await page.screenshot({path:`${output}/${tag}-coach.png`,fullPage:true});
  // 공방: 탭과 고르기, 잠긴 판 안내
  await ev(()=>{showScreen('home');renderHome();});await page.locator('.home-chip',{hasText:'꾸미기'}).click();assert.equal(await ev(()=>state.screen),'workshop');
  await page.locator('.workshop-tab',{hasText:'판'}).click();await page.locator('.workshop-card',{hasText:'대리석'}).click();await page.waitForSelector('.activity-dialog');assert.match(await page.locator('.activity-dialog').innerText(),/별 80개/);
  await page.locator('.activity-dialog .dialog-close').click();await page.locator('.workshop-tab',{hasText:'칭호'}).click();
  await page.locator('.workshop-card',{hasText:'두 수 박사'}).click();assert.equal(await ev(()=>workshopTitle().name),'두 수 박사');
  await noScroll('공방');await page.screenshot({path:`${output}/${tag}-workshop.png`,fullPage:true});
  // 보호자: 설정에서 곱셈 확인 → 잠금 미리보기 → 잠긴 판은 안내 창
  await ev(()=>openFamilySettings());await page.locator('.profile-parent button',{hasText:'잠금 미리보기'}).click();
  const q=await page.locator('#store-gate label').innerText(),[a,b]=q.match(/\d+/g).map(Number);await page.fill('#store-gate-input',String(a*b));await page.locator('#store-gate button[type=submit]').click();
  assert.equal(await ev(()=>storeMode()),'locked');await page.locator('#family-overlay .dialog-close').click();
  await ev(()=>goCourse());await page.locator('.course-tabs [role=tab]',{hasText:'2단계'}).click();
  await page.locator('.course-card',{hasText:'룩으로 메이트'}).click();assert.equal(await ev(()=>state.course?.levelIndex),0,'맛보기 첫 판은 열림');
  await ev(()=>coursePicker());await page.locator('.lesson-pick.locked').first().click();await page.waitForSelector('#store-locked-overlay');
  await page.locator('#store-locked-overlay .action-btn',{hasText:'보호자에게'}).click();await page.waitForSelector('#store-gate-overlay');
  await page.screenshot({path:`${output}/${tag}-parent-gate.png`});
  await ev(()=>{closeActivityDialog(false);storeTogglePreview();});assert.equal(await ev(()=>storeMode()),'preview');
  results.push(tag);await context.close();
 }}finally{await browser.close();}
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({passed:results,screenshots:output}));
})().catch(e=>{console.error(e);process.exit(1);});
