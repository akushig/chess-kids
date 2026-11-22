const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
test('Royal Classic is free with no stars, selectable, saved and available in the native app',()=>{
 const h=load();assert.equal(h.run('getAllStars()'),0);assert.equal(h.run("isSkinUnlocked('royal')"),true);
 h.run("goWorkshop();workshopPick('skin','royal')");assert.equal(h.run('currentSkin'),'royal');
 assert.match(h.elements.get('screen-workshop').innerHTML,/로열 클래식/);
 h.run("window.ChessKidsStore={purchase(){}};applyWorkshop()");assert.equal(h.run('currentSkin'),'royal');
 const backup=h.run('JSON.stringify(createProfileBackup())'),restored=load();
 restored.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(backup)})).id)`);
 assert.equal(restored.run('currentSkin'),'royal');assert.equal(h.run('Object.keys(SKINS.royal).length'),12);
});
test('En passant passes the captured pawn square to the animation and capture tray',()=>{
 const h=load();h.run("playStart({...getPlaySettings(),mode:'friend',small:false,preset:null});state.game=ChessGame.fromFEN('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');globalThis.captureMotion=null;animateMove=(el,fr,fc,tr,tc,pc,done,size,options)=>{captureMotion=options;done();};playCommitMove([3,4,2,3])");
 assert.equal(h.run('JSON.stringify(captureMotion.capture)'),JSON.stringify({row:3,col:3}));
 assert.equal(h.run('state.game.board[3][3]'),null);assert.equal(h.run('state.game.board[2][3]'),'wP');
 assert.equal(h.run('state.game.captured.w[0]'),'bP');
});
