// Regression: browsing and selecting a skin must keep its preview visible.
const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url=process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/';
const output=process.env.CHESS_WORKSHOP_QA_OUTPUT||'/tmp/chess-workshop-qa';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const results=[],errors=[];fs.mkdirSync(output,{recursive:true});
 try{
  for(const [width,height] of [[360,640],[390,844],[768,1024],[1280,900],[844,390],[667,320]]){
   const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.evaluate(async()=>{
    writeData('preferences',{motion:false,voice:false});applyPreferences();goWorkshop('skin');
    await Promise.all(Object.values(SPRITE_SKINS).map(async skin=>{const image=new Image();image.src=skin.atlas;await image.decode();}));
   });
   const dock=page.locator('.workshop-preview-dock');
   async function visiblePreview(){
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const box=await dock.boundingBox();
    assert.ok(box.y>=-.5&&box.y+box.height<=height,`${width}x${height}: preview and tabs stay on screen`);
    assert.ok(box.height<height*.65,`${width}x${height}: space remains for browsing skins`);
    for(const selector of ['.workshop-board','.workshop-tabs']){
     const child=await page.locator(selector).boundingBox();
     assert.ok(child.y>=0&&child.y+child.height<=height,selector+' stays fully visible');
    }
    assert.equal(await page.locator('.workshop-board [data-piece]').count(),12);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   }
   await visiblePreview();
   // Exercise a real wheel scroll before clicking the final skin in the catalogue.
   await page.mouse.move(width/2,height-40);await page.mouse.wheel(0,5000);
   await page.waitForFunction(()=>scrollY>100);
   await page.waitForFunction(()=>document.querySelector('.workshop-preview-dock').getBoundingClientRect().top<9);
   await visiblePreview();
   const card=page.getByRole('button',{name:'종이접기 왕국',exact:true});
   await card.scrollIntoViewIfNeeded();
   const cardBox=await card.boundingBox(),dockBox=await dock.boundingBox();
   assert.ok(cardBox.y+cardBox.height/2>=dockBox.y+dockBox.height,`${width}x${height}: last skin is clickable below preview: ${JSON.stringify({cardBox,dockBox})}`);
   const scroll=await page.evaluate(()=>scrollY);
   await card.click();
   assert.equal(await page.evaluate(()=>currentSkin),'origami');
   assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scroll)<1,'selecting a skin keeps the catalogue position');
   await visiblePreview();
   assert.equal(await page.locator('.workshop-board [data-sprite-skin="origami"]').count(),12);
   await page.screenshot({path:path.join(output,`${width}x${height}-scrolled.png`)});
   await page.getByRole('button',{name:'종이접기 왕국 말 12종 크게 보기',exact:true}).click();
   assert.equal(await page.locator('#skin-detail-overlay .detail-piece').count(),12);
   await page.getByRole('button',{name:'공방으로 돌아가기',exact:true}).click();
   assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scroll)<1,'closing the enlarged preview keeps the catalogue position');
   await visiblePreview();
   await page.getByRole('button',{name:'♞ 말 모션 보기',exact:true}).click();
   assert.equal(await page.getByRole('dialog').count(),1);await page.locator('.dialog-close').click();
   for(const name of ['판','효과','칭호','말']){
    await page.getByRole('tab',{name,exact:true}).click();
    assert.equal(await page.getByRole('tab',{name,exact:true}).getAttribute('aria-selected'),'true');
    await visiblePreview();
   }
   await page.evaluate(()=>{showScreen('home');renderHome();});
   assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('app')).overflow),'hidden');
   results.push({width,height,passed:true});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,errors},null,2));
  console.log(`Workshop sticky preview QA passed: ${results.length} portrait, landscape and desktop sizes.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
