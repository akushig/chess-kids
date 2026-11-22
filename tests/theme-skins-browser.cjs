const {chromium}=require(process.env.CHESS_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url=process.env.CHESS_TEST_URL||'http://127.0.0.1:8765/',output=process.env.CHESS_THEME_QA_OUTPUT||'/tmp/chess-theme-qa';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHESS_BROWSER_EXECUTABLE?{executablePath:process.env.CHESS_BROWSER_EXECUTABLE}:{})});
 const errors=[],results=[];fs.mkdirSync(output,{recursive:true});
 try{
  for(const width of [360,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.abort());
   await page.goto(url,{waitUntil:'domcontentloaded'});assert.equal(await page.evaluate(()=>currentSkin),'royal');
   // Record short animation phases inside the browser so a busy test runner cannot miss them.
   await page.evaluate(()=>{
    window.skinMotionObservations=[];
    new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){
     if(node.nodeType===1&&(node.matches('.royal-mover')||node.matches('.royal-victim'))){
      skinMotionObservations.push({kind:node.matches('.royal-victim')?'hit':'move',skin:node.querySelector('svg')?.dataset.spriteSkin});
     }
    }}).observe(document.body,{childList:true,subtree:true});
   });
   const allThemes=await page.evaluate(()=>[{id:'royal',name:'로열 클래식'},...FREE_SPRITE_THEMES.map(({id,name})=>({id,name}))]);
   const wanted=process.env.CHESS_THEME_IDS?.split(',');
   const themes=wanted?allThemes.filter(theme=>wanted.includes(theme.id)):allThemes;
   assert.equal(allThemes.length,16);
   await page.evaluate(()=>goWorkshop('skin'));assert.equal(await page.locator('.workshop-card').count(),16);assert.equal(await page.evaluate(()=>getAllStars()),0);
   if(width===360){
    await page.evaluate(()=>Promise.all(Object.values(SPRITE_SKINS).map(async theme=>{const im=new Image();im.src=theme.atlas;await im.decode();})));
    await page.screenshot({path:path.join(output,'workshop-mobile.png'),fullPage:true,animations:'disabled'});
   }
   for(const theme of themes){
    await page.evaluate(()=>goWorkshop('skin'));
    await page.getByRole('button',{name:new RegExp('^'+theme.name+'(?: · 사용 중)?$')}).click();
    assert.equal(await page.evaluate(()=>currentSkin),theme.id);assert.equal(await page.evaluate(id=>isSkinUnlocked(id),theme.id),true);
    // Verify all 36 cells contain real, padded sprites in the decoded runtime image.
    const occupied=await page.evaluate(async id=>{
     const im=new Image();im.src=SPRITE_SKINS[id].atlas;await im.decode();
     const c=document.createElement('canvas');c.width=c.height=1536;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);
     const cells=[];for(let row=0;row<6;row++)for(let col=0;col<6;col++){
      const data=ctx.getImageData(col*256,row*256,256,256).data;let count=0;
      for(let i=3;i<data.length;i+=4)if(data[i]>127)count++;
      cells.push(count);
     }return cells;
    },theme.id);
    assert.equal(occupied.length,36);assert.ok(occupied.every(n=>n>1500),`${theme.id}: missing sprite`);
    await page.evaluate(()=>{skinMotionObservations=[];});
    await page.getByRole('button',{name:'♞ 말 모션 보기',exact:true}).click();
    await page.waitForFunction(()=>skinMotionObservations.some(event=>event.kind==='hit'));
    assert.deepEqual(await page.evaluate(()=>skinMotionObservations.map(event=>event.skin)),[theme.id,theme.id]);
    await page.waitForFunction(()=>!state.animating);await page.locator('.dialog-close').click();
    await page.evaluate(()=>{
     skinMotionObservations=[];
     playStart({...getPlaySettings(),mode:'friend',face:false,small:false,preset:null,timer:0,content:null});
     state.game=ChessGame.fromFEN('4k3/8/8/3p4/8/2N5/8/R3K3 w - - 0 1');renderPlay();
     playCommitMove([5,2,3,3]);
    });
    await page.waitForFunction(()=>skinMotionObservations.some(event=>event.kind==='hit'));
    assert.deepEqual(await page.evaluate(()=>skinMotionObservations.map(event=>event.skin)),[theme.id,theme.id]);
    await page.waitForFunction(()=>!state.animating);assert.equal(await page.evaluate(()=>state.game.board[3][3]),'wN');
    assert.equal(await page.locator('.royal-mover,.royal-victim,.royal-impact').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(width===360&&['plush','jelly','crayon','motors','clouds'].includes(theme.id))await page.screenshot({path:path.join(output,theme.id+'-mobile.png'),fullPage:true,animations:'disabled'});
    results.push({width,skin:theme.id,passed:true});
   }
   await page.evaluate(()=>{goWorkshop();openSkinSelector();});assert.equal(await page.locator('.skin-card').count(),16);await page.locator('.dialog-close').click();
   await page.evaluate(()=>goReward());assert.equal(await page.locator('.roadmap-item').count(),16);
   await page.evaluate(()=>{safeStore.setItem('skin','classic');});await page.reload({waitUntil:'domcontentloaded'});
   assert.equal(await page.evaluate(()=>currentSkin),'royal');
   assert.equal(await page.evaluate(()=>safeStore.getItem('skin')),'royal');
   await page.evaluate(()=>switchProfile(createProfile('새 가족','🐱').id));assert.equal(await page.evaluate(()=>currentSkin),'royal');
   await context.close();console.log(`Passed ${width}px: ${themes.length} skins, selection, motion, migration and hidden lists.`);
  }
  const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
  const decoded=await page.evaluate(async()=>{
   const ids=SKIN_ORDER.filter(workshopSkinVisible);
   for(const id of ids){const im=new Image();im.src=SPRITE_SKINS[id].atlas;await im.decode();if(im.naturalWidth!==1536)throw Error('Missing offline '+id);}
   return ids.length;
  });assert.equal(decoded,16);await context.close();
  const gallery=await browser.newPage({viewport:{width:1240,height:1500},serviceWorkers:'block'});
  await gallery.goto(new URL('docs/theme-skins/gallery.html',url).href);await gallery.evaluate(()=>Promise.all([...document.images].map(im=>im.decode())));
  await gallery.screenshot({path:path.join(output,'gallery.jpg'),fullPage:true,quality:90});await gallery.close();
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,offline:decoded,migration:true,default:'royal',errors},null,2));
  console.log('Theme skin browser QA passed:',JSON.stringify({combinations:results.length,offline:decoded,default:'royal',errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
