const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
test('closing during animation saves a complete logical turn, including a completed puzzle',()=>{
 for(const start of ["goCollector(0);collectorClick(2,1)","goBomb(0);for(const [r,c]of findBombSolvePath().slice(1))bombClick(r,c)","goKnightTour(0,'walk');const path=knightGoalPath().path;for(const [r,c]of path.slice(1))knightTourClick(r,c)","goPuzzleLevel(1);const m=puzzleWinningMoves(state.puzzleGame,PUZZLES[state.puzzleIndex])[0];puzzleClick(m[0],m[1]);puzzleClick(m[2],m[3])"]){
  const a=load();a.run('animateMove=()=>{}');a.run(start);a.run('saveActiveSession()');assert.equal(a.run('activityComplete()'),true,start);
  const b=load(Object.fromEntries(a.storage));b.run('resumeActivity()');assert.equal(b.run('activityComplete()'),true,start);
 }
});
test('failed activity remains resumable for undo, and partial knight stars do not claim completion',()=>{
 const a=load();a.run("goMissionPlay('K',3);missionClick(3,4);saveActiveSession()");assert.equal(a.run('getSavedSession().complete'),false);
 const b=load(Object.fromEntries(a.storage));b.run('resumeActivity();undoActivity()');assert.equal(b.run('state.missionFailed'),false);
});
test('malformed saved sessions are ignored and write failures do not stop play',()=>{
 const a=load({'chess.child.last_session':JSON.stringify({version:1,kind:'play',snapshot:{values:{}}})});assert.equal(a.run('getSavedSession()'),null);
 a.run("localStorage.setItem=()=>{throw Error('quota')};goMissionPlay('R',0);missionClick(3,3)");assert.equal(a.run('state.missionSolved'),true);assert.equal(a.run('storageUnavailable'),true);
});
test('content IDs keep a saved board and undo history attached after reordering',()=>{
 const {run}=load();run("goMissionPlay('R',4);missionClick(0,0);saveActiveSession();MISSIONS.R.reverse();resumeActivity()");assert.equal(run('state.missionIdx'),3);assert.equal(run('state.missionMoveCount'),1);run('undoActivity()');assert.equal(run('state.missionIdx'),3);assert.equal(run('state.missionMoveCount'),0);
});
test('each kind keeps its recent board when another activity starts',()=>{
 const a=load();a.run("goMissionPlay('R',4);missionClick(0,0);goKnightTour(0,'explore');knightTourClick(2,1);saveActiveSession()");
 const b=load(Object.fromEntries(a.storage));assert.equal(b.run('ongoingActivities().length'),2);b.run("resumeActivity('mission')");assert.equal(b.run('state.missionMoveCount'),1);b.run("resumeActivity('knight')");assert.equal(b.run('state.kt.visited'),2);
});
test('partial progress never becomes a completion stamp and joint play stays joint',()=>{
 const {run}=load();run("goKnightTour(0,'tour');state.kt.stuck=true;saveMiniGameStars('knighttour',0,1)");assert.equal(run("!!progressLedger().completions[KNIGHT_TOUR_LEVELS[0].id]"),false);
 run("state.kt.stuck=false;state.kt.jointUsed=true;saveMiniGameStars('knighttour',0,3)");assert.equal(run("progressLedger().completions[KNIGHT_TOUR_LEVELS[0].id].independent"),false);
});
