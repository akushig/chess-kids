// A session owns its history, callbacks and reproducible random stream.
const SESSION_KEYS = {
  mission:['missionPiece','missionIdx','missionBoard','missionPlayerPos','missionSolved','missionFailed','missionMoveCount','missionNotice'],
  puzzle:['puzzleLevel','puzzleIndex','puzzleGame','puzzleSolved','puzzleMoveCount','puzzleNotice'],
  play:['game','play'], knight:['kt'], collector:['cl'], bomb:['bm'], defense:['df'], survival:['sv'],
};
function copyData(value) { return JSON.parse(JSON.stringify(value)); }
function beginActivity(kind,params={}) {
  saveActiveSession(); cancelActivityCallbacks();
  state.activeKind=kind;state.activityParams=params;state.actionHistory=[];
  state.supportLevel=0;
  state.randomSeed=(Date.now() ^ Math.floor(Math.random()*0xffffffff))>>>0 || 1;
}
function activityRandom() {
  let n=state.randomSeed||1;n^=n<<13;n^=n>>>17;n^=n<<5;state.randomSeed=n>>>0;return state.randomSeed/4294967296;
}
function activitySnapshot() {
  const values={};for(const key of SESSION_KEYS[state.activeKind]||[])values[key]=state[key];
  return copyData({values,randomSeed:state.randomSeed,supportLevel:state.supportLevel||0});
}
function rememberAction() { state.actionHistory ||= [];state.actionHistory.push(activitySnapshot());if(state.actionHistory.length>120)state.actionHistory.shift(); }
function restoreSnapshot(snap) {
  Object.assign(state,copyData(snap.values));state.randomSeed=snap.randomSeed;state.supportLevel=Math.max(state.supportLevel||0,snap.supportLevel||0);
  if(state.game)state.game=Object.assign(new ChessGame(),state.game);
  if(state.puzzleGame)state.puzzleGame=Object.assign(new ChessGame(),state.puzzleGame);
}
function activityComplete() {
  return ({mission:()=>state.missionSolved,puzzle:()=>state.puzzleSolved,play:()=>playIsOver(),knight:()=>state.kt.clear||state.kt.stuck,collector:()=>state.cl.clear||state.cl.failed,bomb:()=>state.bm.clear||state.bm.failed,defense:()=>state.df.clear||state.df.failed,survival:()=>state.sv.gameOver}[state.activeKind]||(()=>true))();
}
function saveActiveSession() {
  if(!state.activeKind || !SESSION_KEYS[state.activeKind])return;
  const saved={version:1,kind:state.activeKind,params:state.activityParams,snapshot:activitySnapshot(),history:state.actionHistory||[],complete:activityComplete(),updatedAt:Date.now()};
  // Save remaining time, never a deadline that elapses while the app is closed.
  if(saved.kind==='play'&&saved.snapshot.values.play?.timer) saved.snapshot.values.play.pausedLeft=Math.max(0,state.play.pausedLeft??state.play.deadline-Date.now());
  writeData('last_session',saved);
}
function renderActivity() {
  ({mission:renderMissionBoard,puzzle:renderPuzzleBoard,play:renderPlay,knight:renderKnightTour,collector:renderCollector,bomb:renderBomb,defense:renderDefense,survival:renderSurvival}[state.activeKind]||renderHome)();
}
function undoActivity() {
  if(state.animating || !state.actionHistory?.length)return;
  cancelActivityCallbacks();
  if(state.activeKind==='play') {
    playStop();let snap;
    do { snap=state.actionHistory.pop(); } while(state.play.mode==='ai'&&snap.values.game.turn!=='w'&&state.actionHistory.length);
    restoreSnapshot(snap);state.game.selected=null;state.game.validMoves=[];state.play.notice='다른 수를 둘 수 있어요.';
  } else {
    restoreSnapshot(state.actionHistory.pop());
    if(state.activeKind==='puzzle'){state.puzzleRun++;state.puzzleWaiting=false;state.puzzleSelected=null;state.puzzleValidMoves=[];}
  }
  renderActivity();saveActiveSession();
  if(state.activeKind==='play')playNextTurn();
}
function resumeActivity() {
  const saved=readData('last_session',null);
  if(!saved||saved.version!==1||!SESSION_KEYS[saved.kind])return;
  if(state.play)playStop();cancelActivityCallbacks();
  state.supportLevel=saved.snapshot.supportLevel||0;state.activeKind=saved.kind;state.activityParams=saved.params;state.actionHistory=saved.history||[];restoreSnapshot(saved.snapshot);
  state.puzzleWaiting=false;state.puzzleRun=(state.puzzleRun||0)+1;
  const screen=({mission:'learn',puzzle:'puzzle',play:'play'})[saved.kind]||'mini';showScreen(screen);
  if(saved.kind==='puzzle'&&state.puzzleGame.turn==='b'&&!state.puzzleSolved)doPuzzleAiMove();
  renderActivity();
  if(saved.kind==='play')playNextTurn();
}
function undoButton() { return `<button class="icon-btn" onclick="requestActivityUndo()" ${state.actionHistory?.length?'':'disabled'}>↶ 되돌리기</button>`; }
function leaveActivity() { saveActiveSession();if(state.activeKind==='play')playStop();state.activeKind=null;cancelActivityCallbacks(); }
window.addEventListener?.('pagehide',saveActiveSession);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveActiveSession();});

function requestActivityUndo() {
  if(state.activeKind==='play'&&state.play.mode==='friend')showChoice('둘 다 한 수 되돌리기에 동의하나요?',[{label:'함께 되돌리기',action:undoActivity},{label:'그대로 두기',action:()=>{}}]);
  else undoActivity();
}

function noteHelp(level=1){state.supportLevel=Math.max(state.supportLevel||0,level);}
function finishLinks(action='goMiniMenu()',label='다른 놀이 보기'){
  return `<div class="finish-actions"><button class="action-btn green" onclick="${action}">${label}</button><button class="action-btn secondary" onclick="leaveActivity();showScreen('home');renderHome()">여기까지</button></div>`;
}
