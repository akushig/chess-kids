const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
test('every deterministic defense has a winning route without overlapping enemies',()=>{
 const {run}=load();
 const rows=run(`DEFENSE_LEVELS.map((lv,i)=>{
  goDefense(i);const seen=new Set();
  function find(df,depth){if(df.clear)return [];if(df.failed||depth<=0)return null;const key=JSON.stringify([df.pos,df.enemies,df.waveIdx,df.breached]);if(seen.has(key))return null;seen.add(key);
   const ranked=getDefenseMoves(df).map(m=>({m,next:defenseTransition(df,m)})).sort((a,b)=>a.next.breached-b.next.breached||a.next.enemies.length-b.next.enemies.length);
   for(const {m,next}of ranked){const rest=find(next,depth-1);if(rest)return [m,...rest];}return null;
  }
  const path=find(state.df,36);if(!path)return {i,win:false};let unique=true;
  for(const [r,c]of path){defenseClick(r,c);unique&&=new Set(state.df.enemies.map(e=>e.pos.join(','))).size===state.df.enemies.length;}
  return {i,win:state.df.clear,unique,steps:path.length};
 })`);
 for(const r of rows){assert.ok(r.win,JSON.stringify(r));assert.ok(r.unique);}
});
test('survival previews and safe hints remain safe after the actual enemy turn',()=>{
 const {run}=load();
 assert.equal(run(`SURVIVAL_LEVELS.every((lv,i)=>{goSurvival(i);for(let t=0;t<50&&!state.sv.clear;t++){const moves=getSurvivalSafeMoves(state.sv);if(!moves.length)return false;for(const pos of moves){const next={...state.sv,kingPos:pos,board:survivalBoard(state.sv,state.sv.turn+1,pos)};if(next.board[pos[0]][pos[1]]!=='wK'||isSurvivalAttacked(next,...pos))return false;}const path=findSurvivalPath();if(!path?.[1])return false;survivalClick(...path[1]);}return state.sv.clear;})`),true);
});
test('new collector entry stages need only one and two jumps with an optional move budget',()=>{
 const {run}=load();assert.equal(run("goCollector(0);state.cl.par"),1);assert.equal(run("goCollector(1);state.cl.par"),2);
 assert.equal(run("goCollector(0);state.cl.challenge"),false);assert.equal(run("goCollector(0,true);state.cl.challenge"),true);
});
test('profile changes isolate saved sessions and stars',()=>{
 const {run}=load();run("goKnightTour(0,'walk');saveMiniGameStars('knight-walk',0,3);saveActiveSession();switchProfile('adult')");assert.equal(run('getAllStars()'),0);assert.equal(run("readData('last_session',null)"),null);
 run("switchProfile('child')");assert.equal(run('getAllStars()'),3);assert.equal(run("readData('last_session',null).kind"),'knight');
});
test('shared knight boards keep the exact start and size across child and adult goals',()=>{
 const {run}=load();run("goKnightTour(2,'tour');const shared={startPos:[...state.kt.startPos]};goKnightTour(2,'walk',shared)");assert.equal(run('state.kt.size'),7);assert.equal(run('state.kt.startPos[0]'),6);assert.ok(run('!!knightGoalPath().path'));
});
test('waiting alone cannot finish a safety challenge',()=>{
 const {run}=load();run('goSurvival(0);for(let i=0;i<12;i++)survivalClick(...state.sv.kingPos)');assert.equal(run('state.sv.clear'),false);assert.equal(run('state.sv.goalsLeft.length'),2);
});
