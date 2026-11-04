const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
test('each playground entry resumes its exact board and undo history through a new app context',()=>{
 for(const [kind,start,move,key]of [
  ['knight',"goKnightTour(0,'tour')",'knightTourClick(2,1)','kt'],
  ['collector','goCollector(1)','collectorClick(...getCollectorMoves(state.cl)[0])','cl'],
  ['bomb','goBomb(1)','bombClick(...getBombMoves(state.bm)[0])','bm'],
  ['defense','goDefense(1)','defenseClick(...getDefenseMoves(state.df)[0])','df'],
  ['survival','goSurvival(1)','survivalClick(...getSurvivalSafeMoves(state.sv)[0])','sv'],
 ]){
  const a=load();a.run(`${start};${move};goMiniMenu()`);const before=a.run(`JSON.stringify(activitySaved('${kind}').snapshot.values.${key})`);
  const b=load(Object.fromEntries(a.storage));b.run(`enterActivity('${kind}')`);
  assert.equal(b.run(`JSON.stringify(state.${key})`),before,kind);assert.equal(b.run('state.actionHistory.length'),1,kind);
  b.run('undoActivity()');assert.equal(b.run('state.actionHistory.length'),0,kind);
 }
});
test('a new learner gets a short knight walk; explicit legacy settings and challenge preference keep full tours',()=>{
 const a=load();a.run('goKnightSetup()');assert.equal(a.run('state.kt.mode'),'walk');assert.equal(a.run('knightGoalPath().path.length'),4);
 const b=load({knight_tour_settings:JSON.stringify({size:6,branchWarn:false})});b.run('goKnightSetup()');assert.equal(b.run('state.kt.mode'),'tour');assert.equal(b.run('state.kt.size'),6);
 const c=load();c.run("writeData('experience','challenge');goKnightSetup()");assert.equal(c.run('state.kt.mode'),'tour');
});
test('basic next steps skip every optional lesson while free challenges remain in the map',()=>{
 const {run}=load();for(const piece of ['R','B','N','P','Q','K']){
  const steps=run(`(()=>{let i=-1,out=[];while((i=nextBasicMission('${piece}',i))>=0)out.push(i);return out;})()`);
  assert.ok(steps.length>=6);for(const i of steps)assert.equal(run(`!!MISSIONS.${piece}[${i}].optional`),false);
  assert.equal(run(`nextBasicMission('${piece}',6)`),-1);
 }
});
test('new curricula preserve old saved boards including the old size, goals, par and undo',()=>{
 const a=load();a.run("goMissionPlay('B',0);state.missionSpec=copyData(LEGACY_MISSIONS.B[0]);state.missionBoard=buildMissionBoard(state.missionSpec);state.missionPlayerPos=[...state.missionSpec.start];delete state.activityParams.curriculumVersion;delete state.missionSpec;rememberAction();saveActiveSession();goMiniMenu()");
 const b=load(Object.fromEntries(a.storage));b.run("resumeActivity('mission')");assert.equal(b.run('missionSize()'),6);assert.equal(b.run('currentMission().minMoves'),1);
 b.run('undoActivity()');assert.equal(b.run('missionSize()'),6);const path=b.run('findMissionSolvePath()');assert.ok(path);b.run(`for(const p of ${JSON.stringify(path)}.slice(1))missionClick(...p)`);assert.equal(b.run('state.missionSolved'),true);
});
test('every curriculum provides skill, prerequisite, new-rule, recovery and planning information',()=>{
 const {run}=load();assert.equal(run('Object.values(MISSIONS).flat().every(m=>m.learning?.skill&&Array.isArray(m.learning.prerequisites)&&m.learning.newRule&&m.learning.recovery&&m.learning.planning>0)'),true);
 assert.equal(run('Object.values(MISSIONS).every(ms=>ms.slice(0,3).every(m=>m.size===4&&m.minMoves===1))'),true);
 assert.equal(run('PUZZLES.length'),30);assert.equal(run('PUZZLES.every(p=>!!p.learning.skill)'),true);
});
test('a pawn cannot gain its first two-square move after already advancing from a training back rank',()=>{
 const {run}=load();run("goMissionPlay('P',5);missionClick(2,2)");assert.equal(run("getMissionValidMoves(state.missionBoard,2,2,currentMission()).some(([r])=>r===0)"),false);
});
test('growth records assisted success without removing stars and retains a past independent success',()=>{
 const {run}=load();run("goMissionPlay('R',0);noteHelp(2);missionClick(3,3)");assert.equal(run("learningSummary()[0].assisted"),1);assert.equal(run("getMissionStars('R',0)"),3);
 run("goMissionPlay('R',0);missionClick(3,3)");assert.equal(run("learningSummary()[0].independent"),1);
 run("goMissionPlay('R',0);noteHelp(2);missionClick(3,3)");assert.equal(run("learningSummary()[0].independent"),1);
});
test('puzzle continuation recommends the next unseen scene of the skill just practised',()=>{
 const {run}=load();run("goPuzzleLevel(2);const m=puzzleWinningMoves(state.puzzleGame,PUZZLES[state.puzzleIndex])[0];puzzleClick(m[0],m[1]);puzzleClick(m[2],m[3]);goMiniMenu()");assert.match(run('recommendedActivity().action'),/capture-knight-v1/);
});

test('an absent per-kind save never falls back to another kind last session',()=>{
 const {run}=load();run('goDefense(0);goMiniMenu()');assert.equal(run("activitySaved('knight')"),null);run("enterActivity('knight')");assert.equal(run('state.activeKind'),'knight');assert.equal(run('state.kt.mode'),'walk');
});

test('all playground levels declare prerequisites, a new rule and a recovery route',()=>{
 const {run}=load();assert.equal(run("['knight','collector','bomb','defense','survival'].every(kind=>[0,1,2].every(i=>{const m=activityLearning(kind,i);return m.skill&&m.prerequisites.length&&m.newRule&&m.recovery&&m.next;}))"),true);
});
test('a first capture that rescues a checked king keeps the king-safe feedback',()=>{
 const {run}=load();run("playStart();state.play.mode='friend';state.game=ChessGame.fromFEN('7k/8/8/8/8/8/P3r3/4K3 w - - 0 1');playCommitMove([7,4,6,4])");assert.equal(run('state.play.notice'),run("t('playKingSafe')"));assert.equal(run("progressLedger().achievements['play-first-capture']"),1);
});
