const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
const check='4r2k/8/8/8/8/8/R7/4K3 w - - 0 1';
test('essential check state remains visible with help disabled and errors cannot hide the restriction',()=>{
 const {run}=load();run(`playStart();state.play.help=false;state.game=ChessGame.fromFEN('${check}');renderPlay()`);
 assert.match(run('playBoardHTML(false)'),/checked-king/);assert.match(run('playBoardHTML(false)'),/play-cell-alert/);assert.match(run('playStatusCopy().title'),/체크/);
 assert.match(run('playGuideHTML()'),/왕을 안전하게 하는 수만/);assert.doesNotMatch(run('playGuideHTML()'),/playShowRescue/);
 run("state.play.help=true;state.play.notice='이 말로는 왕을 구할 수 없어요.'");const guide=run('playGuideHTML()');assert.match(guide,/왕을 안전하게 하는 수만/);assert.match(guide,/이 말로는 왕/);assert.match(guide,/길 막기/);
});
test('first-check acknowledgement survives reload and is tracked separately for each king',()=>{
 const a=load();a.run(`playStart();state.game=ChessGame.fromFEN('${check}');renderPlay();playAcknowledgeEvent()`);
 assert.equal(a.run('state.play.seenChecks.w'),true);assert.equal(a.run('state.play.moveEvent.acknowledged'),true);
 const b=load(Object.fromEntries(a.storage));b.run('resumeActivity()');assert.equal(b.run('state.play.seenChecks.w'),true);
 b.run("state.game=ChessGame.fromFEN('4k3/r7/8/8/8/8/8/4R2K b - - 0 1');state.play.mode='friend';renderPlay()");assert.equal(b.run('state.play.moveEvent.kind'),'check');assert.equal(b.run('!!state.play.seenChecks.b'),false);
});
test('castling records both paths before animation and unread explanations survive a reload',()=>{
 const a=load();a.run("playStart();state.play.mode='friend';state.game=ChessGame.fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');animateMove=()=>{};playCommitMove([7,4,7,6])");
 assert.equal(a.run('state.play.moveEvent.special'),'castle');assert.equal(a.run('state.play.moveEvent.rookFrom.join()'),'7,7');assert.equal(a.run('state.play.moveEvent.rookTo.join()'),'7,5');assert.equal(a.run('state.game.board[7][5]'),'wR');
 const b=load(Object.fromEntries(a.storage));b.run('resumeActivity()');assert.equal(b.run('state.play.moveEvent.special'),'castle');assert.equal(b.run('state.play.moveEvent.acknowledged'),false);
 b.run('playAcknowledgeEvent();undoActivity()');assert.equal(b.run("state.game.castlingStatus('w','king').allowed"),true);assert.equal(b.run('!!state.play.moveEvent'),false);
});
test('result copy distinguishes winning side, checkmate and a stalemate without check',()=>{
 const {run}=load();run("playStart();state.game=ChessGame.fromFEN('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1');renderPlay()");
 assert.match(run('playStatusCopy().title'),/내가 이겼/);assert.equal(run('state.play.moveEvent.kind'),'result');
 run("state.game=ChessGame.fromFEN('8/8/8/8/8/6k1/6q1/7K w - - 0 1');renderPlay()");assert.match(run('playStatusCopy().title'),/컴퓨터가 이겼/);
 run("state.play.mode='friend';renderPlay()");assert.match(run('playStatusCopy().title'),/검은색 승리/);
 run("state.game=ChessGame.fromFEN('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');renderPlay()");assert.match(run('playStatusCopy().title'),/무승부/);assert.match(run('playStatusCopy().detail'),/체크가 아니지만/);assert.match(run('playActionsHTML()'),/결과 다시 보기/);
});
test('end-of-game explanations take priority over promotion or castling notices',()=>{
 const {run}=load();run("playStart();state.play.mode='friend';state.game=ChessGame.fromFEN('7k/P7/8/8/8/8/8/3K4 w - - 0 1');playCommitMove([1,0,0,0,'N'])");
 assert.equal(run('state.game.status'),'draw');assert.equal(run('state.play.moveEvent.kind'),'result');assert.equal(run('state.play.moveEvent.special'),'promotion');
});
test('difficulty information is attached to the label and includes actual search budgets in both languages',()=>{
 const {run,elements}=load();
 for(const lang of ['ko','en']){
  run(`currentLang='${lang}';goPlay()`);assert.match(elements.get('screen-play').innerHTML,/play-info-button/);assert.match(elements.get('screen-play').innerHTML,/aria-haspopup="dialog"/);assert.doesNotMatch(elements.get('screen-play').innerHTML,/play-level-guide/);
  run("globalThis.dialogContents='';playShowDialog=(kind,title,html)=>{dialogContents=html};playShowDifficultyHelp()");
  const html=run('dialogContents');assert.equal((html.match(/<tr>/g)||[]).length,11);assert.ok(html.includes('0.15'));assert.ok(html.includes('1.5'));assert.ok(html.includes('1.2'));assert.doesNotMatch(html,/undefined/);
 }
});
