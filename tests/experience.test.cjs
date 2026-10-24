const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),load=require('./harness.cjs');
const fixtures=JSON.parse(fs.readFileSync('docs/product-review/lesson-examples.json')).chessFixtures;
test('check rescue groups are actual legal moves and exclude impossible blocking',()=>{
 const {run}=load();
 for(const f of fixtures){
  const result=run(`(()=>{state.game=ChessGame.fromFEN(${JSON.stringify(f.fen)});return playRescues().map(r=>({method:r.method,piece:state.game.board[r.move[0]][r.move[1]][1],legal:state.game.allMoves().some(m=>m.every((v,i)=>v===r.move[i]))}));})()`);
  for(const r of result)assert.ok(r.legal,f.id);
  if(f.id==='check.knight')assert.ok(!result.some(r=>r.method==='block'));
  if(f.id==='check.double')assert.ok(result.every(r=>r.piece==='K'));
  if(f.id==='check.block')assert.ok(result.some(r=>r.method==='block'));
  if(f.id==='check.capture')assert.ok(result.some(r=>r.method==='capture'));
 }
});
test('adventure, knight, collector, bomb, survival and defense restore exact pre-move state',()=>{
 for(const [start,move]of [
  ["goMissionPlay('R',4)","missionClick(0,0)"],
  ["goKnightTour(0,'explore')","knightTourClick(...getKnightMoves(...state.kt.pos,state.kt.size,state.kt.board)[0])"],
  ['goCollector(0)','collectorClick(...getCollectorMoves(state.cl)[0])'],
  ['goBomb(0)','bombClick(...getBombMoves(state.bm)[0])'],
  ['goSurvival(0)','survivalClick(...getSurvivalSafeMoves(state.sv)[0])'],
  ['goDefense(0)','defenseClick(...getDefenseMoves(state.df)[0])'],
 ]){
  const {run}=load();run(start);const before=run('JSON.stringify(activitySnapshot())');run(move);assert.equal(run('state.actionHistory.length'),1,start);run('undoActivity()');assert.equal(run('JSON.stringify(activitySnapshot())'),before,start);
 }
});
test('AI undo restores the human turn and both moves',()=>{
 const {run}=load();run("playStart();playCommitMove([6,4,4,4]);playCommitMove([1,4,3,4]);undoActivity()");
 assert.equal(run('state.game.turn'),'w');assert.equal(run('state.game.board[6][4]'),'wP');assert.equal(run('state.game.board[1][4]'),'bP');assert.equal(run('state.actionHistory.length'),0);
});
test('sessions survive a fresh application context including move history',()=>{
 const a=load();a.run("goKnightTour(0,'explore');knightTourClick(2,1);saveActiveSession()");const saved=Object.fromEntries(a.storage);
 const b=load(saved);b.run('resumeActivity()');assert.equal(b.run('state.kt.visited'),2);b.run('undoActivity()');assert.equal(b.run('state.kt.visited'),1);
});
test('a saved puzzle awaiting an opponent reply resumes on the human turn',()=>{
 const a=load();a.run("goPuzzleLevel(4);puzzleClick(5,6);puzzleClick(1,6)");
 // Use an actual winning move for this particular generated puzzle.
 a.run("renderPuzzle();const m=puzzleWinningMoves(state.puzzleGame,PUZZLES[state.puzzleIndex],2)[0];puzzleClick(m[0],m[1]);puzzleClick(m[2],m[3]);saveActiveSession()");
 const b=load(Object.fromEntries(a.storage));b.run('resumeActivity()');assert.equal(b.run('state.puzzleGame.turn'),'w');assert.equal(b.run('state.puzzleMoveCount'),1);
});
test('old family stars survive redesigned rook content without falsely completing new lessons',()=>{
 const {run,storage}=load({mission_progress_v2:JSON.stringify({R:{0:3,5:2},P:{0:3}}),puzzle_stars:JSON.stringify({'1_0':1}),minigame_stars:JSON.stringify({knighttour_0:3})});
 assert.equal(run('getAllStars()'),12);assert.equal(run("getMissionStars('R',0)"),0);assert.equal(run("getMissionStars('P',0)"),3);
 assert.equal(storage.get('mission_progress_v2'),JSON.stringify({R:{0:3,5:2},P:{0:3}}));
});
test('short knight goals have playable paths while full tours remain available',()=>{
 const {run}=load();
 for(const mode of ['walk','explore','tour']){
  run(`goKnightTour(0,'${mode}')`);const path=run('knightGoalPath().path');assert.ok(path.length>1);
  run(`for(const [r,c]of ${JSON.stringify(path)}.slice(1))knightTourClick(r,c)`);assert.equal(run('state.kt.clear'),true,mode);
 }
});
