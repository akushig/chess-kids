const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
const base='r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
const cases=[
 ['clear board',base,null,null],
 ['check','4r2k/8/8/8/8/8/8/R3K2R w KQ - 0 1','check','check'],
 ['through attacked','5r1k/8/8/8/8/8/8/R3K2R w KQ - 0 1','through-attacked',null],
 ['destination attacked','6rk/8/8/8/8/8/8/R3K2R w KQ - 0 1','destination-attacked',null],
 ['rook attacked','4k2r/8/8/8/8/8/8/R3K2R w KQ - 0 1',null,null],
 ['b1 attacked','1r2k3/8/8/8/8/8/8/R3K2R w KQ - 0 1',null,null],
 ['b1 occupied','4k3/8/8/8/8/8/8/RN2K2R w KQ - 0 1',null,'occupied'],
 ['missing rook','4k3/8/8/8/8/8/8/R3K3 w Q - 0 1','rook-missing',null],
];
test('castling reasons and legal destinations agree, including rook-only and b-file attacks',()=>{
 const {run}=load();
 for(const [label,fen,k,q]of cases)for(const [side,reason,to]of [['king',k,6],['queen',q,2]]){
  const info=run(`(()=>{const g=ChessGame.fromFEN(${JSON.stringify(fen)}),info=g.castlingStatus('w','${side}');return {...info,legal:g.legalMoves(7,4).some(([r,c])=>r===7&&c===${to})};})()`);
  assert.equal(info.reason,reason,label+' '+side);assert.equal(info.allowed,!reason);assert.equal(info.legal,info.allowed);
 }
});
test('returning the king or a rook never restores lost castling rights',()=>{
 const {run}=load();
 run(`state.game=ChessGame.fromFEN('${base}');for(const m of [[7,4,7,5],[0,4,0,5],[7,5,7,4],[0,5,0,4]])state.game.move(...m)`);
 for(const side of ['king','queen'])assert.equal(run(`state.game.castlingStatus('w','${side}').reason`),'king-moved');
 run(`state.game=ChessGame.fromFEN('${base}');for(const m of [[7,7,6,7],[0,4,0,5],[6,7,7,7],[0,5,0,4]])state.game.move(...m)`);
 assert.equal(run("state.game.castlingStatus('w','king').reason"),'rook-moved');assert.equal(run("state.game.castlingStatus('w','queen').allowed"),true);
});
test('both colors can castle by tapping the king then its destination or rook, and undo restores rights',()=>{
 for(const color of ['w','b'])for(const side of ['king','queen'])for(const input of ['target','rook']){
  const {run}=load(),row=color==='w'?7:0,to=side==='king'?6:2,rook=side==='king'?7:0;
  run(`playStart();state.play.mode='friend';state.game=ChessGame.fromFEN('${base.replace(' w ',' '+color+' ')}');playClick(${row},4)`);
  assert.match(run('playBoardHTML(true)'),/castle-target/);assert.match(run('playActionsHTML()'),/캐슬링 안내/);
  run(`playClick(${row},${input==='target'?to:rook})`);
  assert.equal(run(`state.game.board[${row}][${to}]`),color+'K');assert.equal(run(`state.game.board[${row}][${side==='king'?5:3}]`),color+'R');
  assert.match(run('state.play.notice'),/캐슬링/);assert.equal(run('state.actionHistory.length'),1);
  run('undoActivity()');assert.equal(run(`state.game.castlingStatus('${color}','${side}').allowed`),true);
 }
});
test('blocked attempts keep the king selected and explain the exact obstruction instead of a one-square rule',()=>{
 const {run}=load();run("playStart();state.play.mode='friend';state.game=ChessGame.fromFEN('5r1k/8/8/8/8/8/8/R3K2R w KQ - 0 1');playClick(7,4);playClick(7,6)");
 assert.match(run('state.play.notice'),/지나갈 f1 칸이 공격/);assert.equal(run('state.play.castleBlocked.join()'),'7,5');assert.equal(run('state.game.selected.join()'),'7,4');assert.equal(run('state.actionHistory.length'),0);
 run('playClick(7,7)');assert.match(run('state.play.notice'),/지나갈 f1/);
 assert.equal(run('state.game.selected.join()'),'7,7');assert.equal(run('state.game.validMoves.some(([r,c])=>r===6&&c===7)'),true,'blocked castling must not trap rook selection');
 // Occupied destination is also a castling attempt, not a silent selection change.
 run("state.game=new ChessGame();playClick(7,4);playClick(7,6)");assert.match(run('state.play.notice'),/사이의 f1 칸에 말/);assert.equal(run('state.game.selected.join()'),'7,4');
});
test('short-board setup and help explicitly explain that castling is unavailable',()=>{
 const {run,elements}=load();run("savePlaySettings({...getPlaySettings(),small:true});renderPlaySetup();playStart()");
 assert.match(elements.get('screen-play').innerHTML,/chess-board/);assert.equal(run('state.play.small'),true);
 run('playClick(7,4);playClick(7,6)');assert.match(run('state.play.notice'),/짧은 판에서는 캐슬링/);
 run('goPlay()');assert.match(elements.get('screen-play').innerHTML,/짧은 판.*캐슬링을 하지/);
});
