// B: knight rule puzzles (docs/KNIGHT_RULE_PUZZLES.md). The checker below is independent of the app code.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),load=require('./harness.cjs');
const alternates=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/knight-puzzle-alternates.json'),'utf8'));
const JUMPS=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
function checkRoute(p,route){
 const key=([r,c])=>r+','+c,holes=new Set(p.blocked.map(key)),seen=new Set();let mark=0;
 assert.equal(key(route[0]),key(p.start),p.id+' starts at the start');
 route.forEach((cell,i)=>{
  const [r,c]=cell;assert.ok(r>=0&&c>=0&&r<p.size&&c<p.size,p.id+' inside');assert.ok(!holes.has(key(cell)),p.id+' never lands on a missing square');assert.ok(!seen.has(key(cell)),p.id+' visits once');seen.add(key(cell));
  if(i)assert.ok(JUMPS.some(([dr,dc])=>route[i-1][0]+dr===r&&route[i-1][1]+dc===c),p.id+' knight jump');
  const k=p.marks.findIndex(m=>key(m)===key(cell));if(k>=0){assert.equal(k,mark,p.id+' marks in order');mark++;}
 });
 assert.equal(seen.size,p.size*p.size-p.blocked.length,p.id+' every valid square');assert.equal(mark,p.marks.length);
}
const catalogue=run=>JSON.parse(run('JSON.stringify(KNIGHT_PUZZLES)'));

test('ten boards follow the content contract and each has a valid, independently checked solution and an alternate',()=>{
 const {run}=load(),list=catalogue(run);assert.equal(list.length,10);assert.equal(new Set(list.map(p=>p.id)).size,10);assert.equal(run('KNIGHT_PUZZLE_SET_VERSION'),1);
 for(const rule of ['shape','order'])assert.deepEqual(list.filter(p=>p.rule===rule).map(p=>p.stage),['intro','apply','apply','deep','deep'],rule);
 for(const p of list){
  assert.equal(p.version,1);assert.ok(p.title&&p.intent);assert.ok([5,6,7].includes(p.size));
  assert.ok(p.rule==='shape'?p.blocked.length>0&&p.marks.length===0:p.marks.length>0&&p.blocked.length===0,p.id+' introduces one rule only');
  checkRoute(p,p.solution);checkRoute(p,alternates[p.id]);assert.notEqual(JSON.stringify(p.solution),JSON.stringify(alternates[p.id]),p.id+' alternate differs');
 }
});

test('every board is completed through the real tap handler by the stored solution and by a different route',()=>{
 const {run}=load();
 for(const p of catalogue(run))for(const route of [p.solution,alternates[p.id]]){
  run(`goKnightPuzzle('${p.id}');for(const [r,c] of ${JSON.stringify(route.slice(1))})knightTourClick(r,c)`);
  assert.equal(run('state.kt.clear'),true,p.id);assert.equal(run('state.kt.visited'),p.size*p.size-p.blocked.length);assert.equal(run('state.kt.stuck'),false);
  assert.match(run("ktStatus(state.kt,null).title"),/칸을 모두 해냈어요/);assert.equal(run(`progressLedger().mini['${p.id}']`),3);assert.ok(run(`!!progressLedger().completions['${p.id}']`));
 }
});

test('missing squares and out-of-order marks are refused with an explanation and change nothing',()=>{
 const {run,elements}=load();
 run("goKnightPuzzle('knight-shape-wall-7-v1')");const before=run('JSON.stringify(state.kt.board)');
 run('knightTourClick(0,3)');assert.match(run('state.kt.notice'),/판에 없어요.*뛰어넘을 수 있지만/);assert.equal(run('JSON.stringify(state.kt.board)'),before);assert.equal(run('state.actionHistory.length'),0);
 assert.equal(run('ktMoves(state.kt).some(([r,c])=>r===0&&c===3)'),false);
 const html=elements.get('screen-mini').innerHTML;assert.match(html,/class="board-cell [^"]*kt-hole" data-note="판에 없는 칸"/);assert.doesNotMatch(html,/kt-hole[^"]*kt-visited|kt-visited[^"]*kt-hole/);
 run("goKnightPuzzle('knight-order-two-5-v1');knightTourClick(3,2)");assert.equal(run('ktNextMark(state.kt)'),0);
 assert.equal(run('ktMoves(state.kt).some(([r,c])=>r===4&&c===4)'),false,'mark 2 is not a landing square yet');
 run('knightTourClick(4,4)');assert.equal(run('state.kt.notice'),'② 표식은 ① 표식 다음에 밟아요. 지금은 ① 차례예요.');assert.equal(run('state.kt.board[4][4]'),false);assert.equal(run('state.actionHistory.length'),1);
 run('knightTourClick(3,2)');assert.match(run('state.kt.notice'),/이미 간 칸/);run('knightTourClick(0,0)');assert.match(run('state.kt.notice'),/두 칸, 옆으로 한 칸/);
 assert.match(elements.get('screen-mini').innerHTML,/다음 표식 <b class="kt-next-mark">①<\/b>/);
});

test('hints and branch checks use the same rule, a timeout stays unknown, and a dead end is reported and undone',()=>{
 const {run}=load();
 for(const id of ['knight-shape-cross-7-v1','knight-order-mixed-6-v1']){
  run(`goKnightPuzzle('${id}');knightTourHint('path')`);const p=catalogue(run).find(x=>x.id===id);checkRoute(p,JSON.parse(run('JSON.stringify(state.kt.hint.path)')));
  const a=JSON.parse(run('JSON.stringify(ktAnalyze(state.kt))'));const legal=JSON.parse(run('JSON.stringify(ktMoves(state.kt))'));
  assert.deepEqual([...a.fatal,...a.viable,...a.unknown].map(String).sort(),legal.map(String).sort(),id+' analysis covers exactly the legal landings');
 }
 // A dead end reached by real taps: search a short prefix whose last square has no legal landing.
 run(`goKnightPuzzle('knight-shape-plus-6-v1');globalThis.deadEnd=(function find(depth){if(!ktMoves(state.kt).length&&!state.kt.clear)return true;if(!depth)return false;for(const m of ktMoves(state.kt)){knightTourClick(...m);if(find(depth-1))return true;undoActivity();}return false;})(8)`);
 assert.equal(run('deadEnd'),true);assert.equal(run('state.kt.stuck'),true);assert.equal(run('ktStatus(state.kt,null).title'),'더 갈 수 있는 칸이 없어요');assert.equal(run("progressLedger().completions['knight-shape-plus-6-v1']"),undefined,'a dead end is not a completion');
 run('undoActivity()');assert.equal(run('state.kt.stuck'),false);
 run("goKnightPuzzle('knight-order-edges-7-v1');ktFindPath=()=>({timeout:true});state.kt.analysis=null");
 assert.ok(run('ktAnalyze(state.kt).unknown.length')>0);assert.notEqual(run('ktStatus(state.kt,ktAnalyze(state.kt)).tone'),'blocked');
 run("knightTourHint('path')");assert.match(run('state.kt.hintMessage'),/아직 찾지 못했어요/);
});

test('a rule board survives leaving, a fresh app and undo, and is saved so older apps cannot open it as a plain tour',()=>{
 // Play up to and including mark ① so the restored board also carries mark progress.
 const a=load();a.run("const sol=KNIGHT_PUZZLES[8].solution,upto=sol.findIndex(([r,c])=>r===0&&c===5);goKnightPuzzle('knight-order-mixed-6-v1');for(const [r,c] of sol.slice(1,upto+1))knightTourClick(r,c);globalThis.played=upto;goMiniMenu()");
 const played=a.run('played');assert.ok(played>1);
 const record=JSON.parse(a.run("JSON.stringify(readData('sessions',{}).knight)"));assert.equal(record.version,2);assert.equal(record.snapshot.values.kt.mode,'puzzle');
 const before=a.run("JSON.stringify([readData('sessions',{}).knight.snapshot.values.kt,readData('sessions',{}).knight.history.length])");
 const b=load(Object.fromEntries(a.storage));b.run("enterActivity('knight')");
 assert.equal(b.run('JSON.stringify([state.kt,state.actionHistory.length])'),before);assert.equal(b.run('ktNextMark(state.kt)'),1);
 assert.equal(b.run('state.actionHistory.length'),played);
 b.run('undoActivity()');assert.equal(b.run('state.kt.moveCount'),played-1);assert.equal(b.run('ktNextMark(state.kt)'),0,'undo also takes back the mark');assert.equal(b.run('state.kt.puzzle.id'),'knight-order-mixed-6-v1');
 const c=load();c.run("goKnightTour(0,'tour');knightTourClick(2,1);goMiniMenu()");assert.equal(c.run("readData('sessions',{}).knight.version"),1,'free tours keep version 1');assert.equal(c.run("readData('knight_last_mode',null)"),'tour');
 const d=load();d.run("goKnightPuzzle('knight-shape-hole-5-v1')");assert.equal(d.run("readData('knight_last_mode',null)"),null,'rule boards never become the remembered free-tour mode');
});

test('tampered or mislabeled rule boards are not restored',()=>{
 const a=load();a.run("goKnightPuzzle('knight-order-center-5-v1');knightTourClick(...KNIGHT_PUZZLES[6].solution[1]);goMiniMenu()");
 const record=JSON.parse(a.run("JSON.stringify(readData('sessions',{}).knight)"));
 const variants=[
  r=>{r.version=1;},
  r=>{r.snapshot.values.kt.puzzle.id='knight-unknown-v1';},
  r=>{r.snapshot.values.kt.puzzle.marks=[[0,0],[2,2],[4,4]];},
  r=>{r.snapshot.values.kt.puzzle.blocked=[[2,2]];},
  r=>{const kt=r.snapshot.values.kt;kt.board[0][0]=true;kt.visited++;kt.moveCount++;},
  r=>{r.snapshot.values.kt.pos=[9,9];},
  r=>{r.history[0].values.kt.puzzle.version=2;},
 ];
 assert.ok(a.run(`!!getSavedSession(${JSON.stringify(record)})`),'the untouched record is valid');
 for(const change of variants){const r=JSON.parse(JSON.stringify(record));change(r);assert.equal(a.run(`getSavedSession(${JSON.stringify(r)})`),null,change.toString());}
});

test('profile files are version 2 only with a rule board, still read version 1, and reject tampered boards',()=>{
 const a=load();a.run("goKnightTour(0,'tour');knightTourClick(2,1);leaveActivity()");const v1=a.run('JSON.stringify(createProfileBackup())');assert.equal(JSON.parse(v1).version,1);
 a.run("goKnightPuzzle('knight-shape-pond-6-v1');for(const [r,c] of KNIGHT_PUZZLES[2].solution.slice(1,5))knightTourClick(r,c);leaveActivity()");
 const v2=a.run('JSON.stringify(createProfileBackup())');assert.equal(JSON.parse(v2).version,2);
 const b=load();b.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(v2)})).id);enterActivity('knight')`);
 assert.equal(b.run('state.kt.puzzle.id'),'knight-shape-pond-6-v1');assert.equal(b.run('state.kt.moveCount'),4);assert.equal(b.run('state.actionHistory.length'),4);b.run('undoActivity()');assert.equal(b.run('state.kt.moveCount'),3);
 const c=load();c.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(v1)})).id);enterActivity('knight')`);assert.equal(c.run('state.kt.mode'),'tour');assert.equal(c.run('state.kt.moveCount'),1);
 const file=JSON.parse(v2),sessions=JSON.parse(file.data.sessions);sessions.knight.snapshot.values.kt.board[2][2]=true;file.data.sessions=JSON.stringify(sessions);
 assert.throws(()=>c.run(`parseProfileBackup(${JSON.stringify(JSON.stringify(file))})`),/진행 중인 판/);
 const future={...JSON.parse(v2),version:8};assert.throws(()=>c.run(`parseProfileBackup(${JSON.stringify(JSON.stringify(future))})`),/이 버전의 파일은/);
 // Even a finished rule board in the last session marks the file as version 2.
 const d=load();d.run("goKnightPuzzle('knight-shape-hole-5-v1');for(const [r,c] of KNIGHT_PUZZLES[0].solution.slice(1))knightTourClick(r,c);leaveActivity()");assert.equal(JSON.parse(d.run('JSON.stringify(createProfileBackup())')).version,2);
});

test('choosing, finishing and moving to the next board keeps saved progress and confirms replacements',()=>{
 const {run,elements}=load();
 run("goKnightPuzzle('knight-shape-hole-5-v1');for(const [r,c] of KNIGHT_PUZZLES[0].solution.slice(1))knightTourClick(r,c)");
 let html=elements.get('screen-mini').innerHTML;assert.match(html,/openKnightPuzzle\('knight-shape-plus-6-v1'\)">다음 문제/);assert.match(html,/goKnightPuzzles\(\)">규칙 문제 고르기/);
 run("openKnightPuzzle('knight-shape-plus-6-v1')");assert.equal(run('state.kt.puzzle.id'),'knight-shape-plus-6-v1');run('knightTourClick(...ktMoves(state.kt)[0])');
 run('goKnightPuzzles()');html=elements.get('screen-mini').innerHTML;assert.match(html,/1\. 가운데 구멍.*✓ 완료/s);assert.match(html,/2\. 십자 모양.*▶ 하던 판/s);assert.match(html,/하던 규칙 문제 이어하기/);
 assert.equal((html.match(/class="kp-card"/g)||[]).length,10);
 run("openKnightPuzzle('knight-shape-plus-6-v1')");assert.equal(run('state.kt.moveCount'),1,'same board resumes');
 run("goKnightPuzzles();globalThis.choice=null;showChoice=(m,c)=>{choice={m,c};};openKnightPuzzle('knight-order-two-5-v1')");assert.match(run('choice.m'),/하던 판이 바뀌어요/);
 assert.equal(run("readData('sessions',{}).knight.snapshot.values.kt.puzzle.id"),'knight-shape-plus-6-v1','nothing replaced before confirming');
 run('choice.c[1].action()');assert.equal(run('state.kt.puzzle.id'),'knight-order-two-5-v1');
 // An untouched board (no moves) is not worth a confirmation, matching the knight screen.
 run("goKnightPuzzles();choice=null;openKnightPuzzle('knight-order-center-5-v1')");assert.equal(run('choice'),null);assert.equal(run('state.kt.puzzle.id'),'knight-order-center-5-v1');
 run("goKnightPuzzle('knight-order-edges-7-v1');for(const [r,c] of KNIGHT_PUZZLES[9].solution.slice(1))knightTourClick(r,c)");assert.match(elements.get('screen-mini').innerHTML,/onclick="goKnightPuzzles\(\)">문제 고르기/);
 run("showScreen('home');renderHome()");assert.match(elements.get('screen-home').innerHTML,/규칙 문제 고르기/);
 run("goKnightTour(0,'tour')");assert.equal(run('state.kt.puzzle'),undefined);assert.equal(run('JSON.stringify(ktMoves(state.kt))'),run('JSON.stringify(getKnightMoves(...state.kt.pos,state.kt.size,state.kt.board))'),'free tours are unchanged');
 assert.match(elements.get('screen-mini').innerHTML,/onclick="goKnightPuzzles\(\)">규칙 문제/);
});

test('back from a rule puzzle returns to its list, and the list returns to where the knight was opened',()=>{
 const {run,elements}=load();
 run("renderHome();enterActivity('knight')");assert.match(elements.get('screen-mini').innerHTML,/onclick="showScreen\('home'\);renderHome\(\)">← 홈/,'free tours keep the home back');
 run("goKnightPuzzles();openKnightPuzzle('knight-order-two-5-v1');knightTourClick(3,2)");
 let html=elements.get('screen-mini').innerHTML;assert.match(html,/onclick="goKnightPuzzles\(\)">← 규칙 문제/);assert.doesNotMatch(html,/← 홈/);
 run('goKnightPuzzles()');html=elements.get('screen-mini').innerHTML;
 assert.equal(run('state.activeKind'),null);assert.match(html,/1\. 두 모서리.*▶ 하던 판/s,'the board is kept');assert.match(html,/onclick="showScreen\('home'\);renderHome\(\)">← 홈/);assert.doesNotMatch(html,/enterActivity\('knight'\)">←/,'no list ↔ puzzle loop');
 run("openKnightPuzzle('knight-order-two-5-v1')");assert.equal(run('state.kt.moveCount'),1,'the same board resumes');
 run("goMiniMenu();goKnightPuzzles()");assert.match(elements.get('screen-mini').innerHTML,/onclick="goMiniMenu\(\)">← 놀이터/);
});
