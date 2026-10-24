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
  return ({mission:()=>state.missionSolved,puzzle:()=>state.puzzleSolved,play:()=>playIsOver(),knight:()=>state.kt.clear,collector:()=>state.cl.clear,bomb:()=>state.bm.clear,defense:()=>state.df.clear,survival:()=>state.sv.clear}[state.activeKind]||(()=>true))();
}
function saveActiveSession() {
  if(!state.activeKind || !SESSION_KEYS[state.activeKind])return;
  const saved={version:1,rulesVersion:2,kind:state.activeKind,params:state.activityParams,snapshot:activitySnapshot(),history:state.actionHistory||[],complete:activityComplete(),updatedAt:Date.now()};
  // Save remaining time, never a deadline that elapses while the app is closed.
  if(saved.kind==='play'&&saved.snapshot.values.play?.timer) saved.snapshot.values.play.pausedLeft=Math.max(0,state.play.pausedLeft??state.play.deadline-Date.now());
  const sessions=readData('sessions',{});if(saved.complete)delete sessions[saved.kind];else sessions[saved.kind]=saved;
  writeData('sessions',sessions);writeData('last_session',saved);
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
function resumeActivity(kind) {
  const saved=kind?getSavedSession(readData('sessions',{})[kind]):getSavedSession();if(!saved)return;
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
  if(state.activeKind==='play'&&state.play.mode==='friend'){playTimerPauseForHelp();showChoice('둘 다 한 수 되돌리기에 동의하나요?',[{label:'함께 되돌리기',action:undoActivity},{label:'그대로 두기',action:()=>playTimerStart()}]);}
  else undoActivity();
}

function noteHelp(level=1){state.supportLevel=Math.max(state.supportLevel||0,level);}
function finishLinks(action='goMiniMenu()',label='다른 놀이 보기'){
  return `<div class="finish-actions"><button class="action-btn green" onclick="${action}">${label}</button><button class="action-btn secondary" onclick="leaveActivity();showScreen('home');renderHome()">여기까지</button></div>`;
}

function getSavedSession(saved=readData('last_session',null)){
  if(!saved||saved.version!==1||!SESSION_KEYS[saved.kind]||!saved.snapshot?.values)return null;
  const v=saved.snapshot.values,validBoard=(b,size)=>Array.isArray(b)&&b.length===size&&b.every(row=>Array.isArray(row)&&row.length===size);
  if(saved.kind==='mission'){
    const index=saved.params?.id?MISSIONS[v.missionPiece]?.findIndex(m=>m.id===saved.params.id):v.missionIdx;
    const m=MISSIONS[v.missionPiece]?.[index];if(!m||!validBoard(v.missionBoard,m.size||6)||!Array.isArray(v.missionPlayerPos))return null;v.missionIdx=index;for(const snap of saved.history||[])if(snap.values)snap.values.missionIdx=index;
  }else if(saved.kind==='puzzle'){
    const index=saved.params?.id?PUZZLES.findIndex(p=>p.id===saved.params.id):v.puzzleIndex;
    if(!PUZZLES[index]||!validBoard(v.puzzleGame?.board,8))return null;v.puzzleIndex=index;v.puzzleLevel=PUZZLES[index].level;for(const snap of saved.history||[])if(snap.values){snap.values.puzzleIndex=index;snap.values.puzzleLevel=v.puzzleLevel;}
  }else if(saved.kind==='play'){
    if(!validBoard(v.game?.board,8)||!['w','b'].includes(v.game.turn)||!v.play)return null;
    if(saved.rulesVersion!==2){
      for(const game of [v.game,...(saved.history||[]).map(s=>s.values?.game).filter(Boolean)]){
        for(const k of Object.keys(game.castling||{}))game.castling[k]=false;
        const g=Object.assign(new ChessGame(),game);g.positionCounts={};g.recordPosition();game.positionCounts=g.positionCounts;
      }
    }
  }else{
    const key={knight:'kt',collector:'cl',bomb:'bm',defense:'df',survival:'sv'}[saved.kind],data=v[key];
    if(!data||!Number.isInteger(data.size)||data.size<3||data.size>8||!Array.isArray(data.pos||data.kingPos))return null;
    const levels={collector:COLLECTOR_LEVELS,bomb:BOMB_LEVELS,defense:DEFENSE_LEVELS,survival:SURVIVAL_LEVELS,knight:KNIGHT_TOUR_LEVELS}[saved.kind];
    const index=saved.kind==='knight'?levels.findIndex(lv=>lv.size===data.size):saved.params?.id?levels.findIndex(lv=>lv.id===saved.params.id):data.levelIdx;
    if(index<0||!levels[index])return null;data.levelIdx=index;for(const snap of saved.history||[])if(snap.values?.[key])snap.values[key].levelIdx=index;
  }
  return saved;
}

const ACTIVITY_NAMES={mission:'모험',puzzle:'한 수 발견',play:'체스 대전',knight:'나이트 탐험',collector:'별 모으기',bomb:'이동 수 도전',defense:'성 지키기',survival:'왕 지키기'};
function ongoingActivities(){return Object.entries(readData('sessions',{})).filter(([kind,s])=>!!getSavedSession(s)&&!s.complete).sort((a,b)=>b[1].updatedAt-a[1].updatedAt);}
function openSavedActivities(){
 const entries=ongoingActivities();if(!entries.length)return;
 showChoice('하던 놀이를 이어서 해요.',[...entries.map(([kind])=>({label:ACTIVITY_NAMES[kind],action:()=>resumeActivity(kind)})),{label:'닫기',action:()=>{}}]);
}
function recommendedActivity(){
 const saved=getSavedSession();
 if(saved?.complete&&saved.kind==='knight'){
  const kt=saved.snapshot.values.kt,mode=kt.mode==='walk'?'explore':'tour';return {action:`goKnightTour(${kt.levelIdx},'${mode}')`,title:mode==='explore'?'나이트 10칸 탐험':'나이트 완주 도전',description:'방금 해낸 탐험에서 한 걸음 더 가볼까요?'};
 }
 if(saved?.complete&&saved.kind==='mission'){
  const {missionPiece:piece,missionIdx:index}=saved.snapshot.values,next=MISSIONS[piece][index+1];
  if(next&&!next.optional)return {action:`goMissionPlay('${piece}',${index+1})`,title:'다음 모험으로',description:next.desc.ko};
  return {action:piece==='N'?'goKnightSetup()':piece==='R'?'goDefense(0)':'goPlay()',title:'배운 말로 놀기',description:'방금 배운 움직임을 다른 놀이에서 써봐요.'};
 }
 const next=MISSIONS.R.findIndex((m,i)=>!isMissionCleared('R',i));
 return next>=0?{action:`goMissionPlay('R',${next})`,title:'룩과 모험하기',description:'한 걸음씩 해봐요. 막히면 돌아와도 괜찮아요.'}:{action:'goKnightSetup()',title:'나이트와 놀기',description:'좋아하는 목표를 골라서 뛰어봐요.'};
}
