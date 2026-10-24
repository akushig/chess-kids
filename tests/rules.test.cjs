const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),load=require('./harness.cjs');
const positions=JSON.parse(fs.readFileSync('tests/fixtures/chess-positions.json')).positions;
test('ChessGame and AI legal moves match independent standard chess fixtures',()=>{
 const {run}=load();
 for(const row of positions){
  const result=run(`(()=>{const g=ChessGame.fromFEN(${JSON.stringify(row.fen)});const uci=([fr,fc,tr,tc,p])=>'abcdefgh'[fc]+(8-fr)+'abcdefgh'[tc]+(8-tr)+(p||'').toLowerCase();const pos=aiFromPosition(playPosition(g));return {game:g.allMoves().map(uci).sort(),ai:aiLegalRootMoves(pos).map(m=>{const f=m&127,t=(m>>7)&127,flags=m>>14;return uci([f>>4,f&7,t>>4,t&7,flags&4?AI_NAMES[(flags>>4)||5][1]:null]);}).sort(),keys:g.positionKey()===aiPositionKey(pos)};})()`);
  assert.deepEqual(Array.from(result.game),row.legal,row.fen);assert.deepEqual(Array.from(result.ai),row.legal,'AI '+row.fen);assert.ok(result.keys,'repetition key '+row.fen);
 }
});
test('initial-position perft through depth three agrees with standard chess',()=>{
 const {run}=load();assert.equal(run(`(()=>{function count(g,d){if(d===0)return 1;let n=0;for(const m of g.allMoves()){const b=g.clone();b.move(...m);n+=count(b,d-1);}return n;}return count(new ChessGame(),3);})()`),8902);
});
test('castling, underpromotion and en passant are fully reversible',()=>{
 const {run}=load();
 assert.equal(run(`(()=>{const g=ChessGame.fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');g.move(7,4,7,6);return g.board[7][5]==='wR'&&g.board[7][6]==='wK'&&!g.castling.wK;})()`),true);
 assert.equal(run(`(()=>{const g=ChessGame.fromFEN('7k/P7/8/8/8/8/8/3K4 w - - 0 1');g.move(1,0,0,0,'N');return g.board[0][0];})()`),'wN');
 for(const row of positions.slice(0,8))assert.equal(run(`(()=>{const g=ChessGame.fromFEN(${JSON.stringify(row.fen)}),p=aiFromPosition(playPosition(g));const snapshot=()=>JSON.stringify([Array.from(p.board),p.side,p.ep,p.castle,p.king,p.hist]);const before=snapshot();for(const m of aiLegalRootMoves(p)){aiMake(p,m);aiUnmake(p,m);if(snapshot()!==before)return false;}return true;})()`),true,row.fen);
});
test('en passant rescue is explained as capturing, not blocking a pawn check',()=>{
 const {run}=load();const methods=run(`(()=>{state.game=ChessGame.fromFEN('k7/8/8/3pP3/4K3/8/8/8 w - d6 0 1');return playRescues().filter(r=>r.move[0]===3&&r.move[1]===4&&r.move[2]===2&&r.move[3]===3).map(r=>r.method);})()`);assert.deepEqual(Array.from(methods),['capture']);
});
