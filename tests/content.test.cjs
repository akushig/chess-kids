const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
test('pawn attack maps and illegal moves obey chess rules',()=>{
 const {run}=load();
 assert.equal(run(`(()=>{const g=ChessGame.fromFEN('k7/8/8/3p4/8/8/8/7K w - - 0 1');return g.isAttacked(g.board,4,4,'b')&&!g.isAttacked(g.board,4,3,'b');})()`),true);
 assert.equal(run(`(()=>{const g=new ChessGame(),before=g.positionKey();return g.move(7,0,4,0)==='illegal'&&g.positionKey()===before;})()`),true);
});
test('every adventure is solvable, par achievable, and its solution works through input',()=>{
 const {run}=load();
 const results=run(`Object.entries(MISSIONS).flatMap(([key,ms])=>ms.map((m,i)=>{goMissionPlay(key,i);const path=findMissionSolvePath();const errors=[];const coords=[...m.blocks,...m.targets.map(t=>t.slice(0,2)),...m.enemies.map(t=>t.slice(0,2)),m.start];if(new Set(coords.map(p=>p.join(','))).size!==coords.length)errors.push('overlap');if(!path)errors.push('unsolvable');else{if(path.length-1!==m.minMoves)errors.push('par');for(const [r,c] of path.slice(1))missionClick(r,c);if(!state.missionSolved)errors.push('replay');}return {id:m.id,errors};}))`);
 for(const r of results)assert.equal(r.errors.length,0,JSON.stringify(r));
});
test('dangerous adventure movement offers immediate undo instead of trapping the player',()=>{
 const {run,elements}=load();run("goMissionPlay('K',3);missionClick(3,4)");
 assert.equal(run('state.missionFailed'),true);
 assert.match(elements.get('screen-learn').innerHTML,/되돌려서/);assert.match(elements.get('screen-learn').innerHTML,/missionUndo/);
 run('missionUndo()');assert.equal(run('state.missionFailed'),false);assert.equal(run('state.missionMoveCount'),0);
});
test('every puzzle has goal-valid moves; alternate fork answers accepted; mate is real',()=>{
 const {run}=load();
 const rows=run(`PUZZLES.map(p=>({id:p.id,wins:puzzleWinningMoves(ChessGame.fromFEN(p.fen),p,p.type==='checkmate2'?2:1).length}))`);
 for(const r of rows)assert.ok(r.wins>0,r.id);
 assert.ok(rows.find(r=>r.id==='fork-queen-v1').wins>1);
 assert.equal(run(`(()=>{const p=PUZZLES.find(p=>p.id==='mate-queen-v1'),g=ChessGame.fromFEN(p.fen);g.move(...puzzleWinningMoves(g,p)[0]);return g.status;})()`),'checkmate');
});
test('collector and bomb optimal paths earn three stars',()=>{
 const {run}=load();
 assert.equal(run(`COLLECTOR_LEVELS.every((lv,i)=>{goCollector(i);const p=findCollectorSolvePath();if(!p)return false;for(const [r,c]of p.slice(1))collectorClick(r,c);return state.cl.clear&&getMiniGameProgress()[lv.id]===3;})`),true);
 assert.equal(run(`BOMB_LEVELS.every((lv,i)=>{goBomb(i);const p=findBombSolvePath();if(!p)return false;for(const [r,c]of p.slice(1))bombClick(r,c);return state.bm.clear&&getMiniGameProgress()['bomb_'+i]===3;})`),true);
});
