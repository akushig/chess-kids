// A session owns its history, callbacks and reproducible random stream.
const SESSION_KEYS = {
  mission:['missionSpec','missionPiece','missionIdx','missionBoard','missionPlayerPos','missionSolved','missionFailed','missionMoveCount','missionNotice'],
  puzzle:['puzzleLevel','puzzleIndex','puzzleGame','puzzleSolved','puzzleMoveCount','puzzleNotice'],
  play:['game','play'], knight:['kt'], collector:['cl'], bomb:['bm'], defense:['df'], survival:['sv'],
};
function copyData(value) { return JSON.parse(JSON.stringify(value)); }
function beginActivity(kind,params={}) {
  gameLayoutSession++;
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
  if(state.activeKind==='play'&&state.play)state.play=playUpgradeDifficulty(state.play);
  if(state.game)state.game=Object.assign(new ChessGame(),state.game);
  if(state.puzzleGame)state.puzzleGame=Object.assign(new ChessGame(),state.puzzleGame);
}
function activityComplete() {
  return ({mission:()=>state.missionSolved,puzzle:()=>state.puzzleSolved,play:()=>playIsOver(),knight:()=>state.kt.clear,collector:()=>state.cl.clear,bomb:()=>state.bm.clear,defense:()=>state.df.clear,survival:()=>state.sv.clear}[state.activeKind]||(()=>true))();
}
function saveActiveSession() {
  if(!state.activeKind || !SESSION_KEYS[state.activeKind])return;
  // Rule-puzzle sessions are version 2 so an app that does not know the rules never opens them as plain tours.
  const saved={version:state.activeKind==='knight'&&state.kt?.mode==='puzzle'?2:1,rulesVersion:2,kind:state.activeKind,params:state.activityParams,snapshot:activitySnapshot(),history:state.actionHistory||[],complete:activityComplete(),updatedAt:Date.now()};
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
  const saved=kind?getSavedSession(readData('sessions',{})[kind]??null):getSavedSession();if(!saved)return;
  gameLayoutSession++;
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
  if(state.activeKind==='play'&&state.play.mode==='friend'){playTimerPauseForHelp();showChoice('둘 다 한 수 되돌리기에 동의하나요?',[{label:'함께 되돌리기',action:undoActivity},{label:'그대로 두기',action:()=>playTimerStart()}],()=>playTimerStart());}
  else undoActivity();
}

function noteHelp(level=1){state.supportLevel=Math.max(state.supportLevel||0,level);}
function finishLinks(action='goMiniMenu()',label='다른 놀이 보기',extra=''){
  const copy={knight:'ㄴ 모양 점프로 길을 찾았어요.',collector:'말의 움직임을 이어 별을 모두 모았어요.',bomb:'움직일 순서를 계획해 목표를 찾았어요.',defense:'다음 발자국을 살펴 성을 지켰어요.',survival:'현재와 다음 공격을 피해 왕을 지켰어요.',puzzle:PUZZLES[state.puzzleIndex]?.learning?.skill+'을 발견했어요.'};
  return `<section class="completion-summary"><h3>✓ 완료!</h3><p>${copy[state.activeKind]||'끝까지 해냈어요.'} ${state.supportLevel?'도움과 함께 성공!':''}</p><div class="finish-actions"><button class="action-btn green" onclick="${action}">${label}</button><button class="action-btn secondary" onclick="leaveActivity();showScreen('home');renderHome()">여기까지</button></div>${extra}<button class="text-button" onclick="goReward()">⭐ 내 성장과 꾸미기 보기</button></section>`;
}

function getSavedSession(saved=readData('last_session',null)){
  if(!saved||!SESSION_KEYS[saved.kind]||!saved.snapshot?.values)return null;
  const rulePuzzle=saved.kind==='knight'&&saved.snapshot.values.kt?.mode==='puzzle';
  if(saved.version!==(rulePuzzle?2:1))return null;
  const v=saved.snapshot.values,validBoard=(b,size)=>Array.isArray(b)&&b.length===size&&b.every(row=>Array.isArray(row)&&row.length===size);
  if(saved.kind==='mission'){
    const index=saved.params?.id?MISSIONS[v.missionPiece]?.findIndex(m=>m.id===saved.params.id):v.missionIdx;
    if(!Number.isInteger(index)||index<0||!MISSIONS[v.missionPiece]?.[index])return null;
    const original=LEGACY_MISSIONS[v.missionPiece]?.find(m=>m.id===saved.params?.id)||LEGACY_MISSIONS[v.missionPiece]?.[index];
    const m=v.missionSpec||(saved.params?.curriculumVersion===CURRICULUM_VERSION?MISSIONS[v.missionPiece][index]:original);
    if(!m||!['reach','capture','escape'].includes(m.type)||!Array.isArray(m.start)||!Array.isArray(m.goals)||!Array.isArray(m.blocks)||!Array.isArray(m.targets)||!Array.isArray(m.enemies)||!validBoard(v.missionBoard,m.size||6)||!Array.isArray(v.missionPlayerPos))return null;
    v.missionIdx=index;v.missionSpec ||= copyData(m);
    for(const snap of saved.history||[])if(snap.values){snap.values.missionIdx=index;snap.values.missionSpec ||= copyData(m);}
  }else if(saved.kind==='puzzle'){
    const index=saved.params?.id?PUZZLES.findIndex(p=>p.id===saved.params.id):v.puzzleIndex;
    if(!PUZZLES[index]||!validBoard(v.puzzleGame?.board,8))return null;v.puzzleIndex=index;v.puzzleLevel=PUZZLES[index].level;for(const snap of saved.history||[])if(snap.values){snap.values.puzzleIndex=index;snap.values.puzzleLevel=v.puzzleLevel;}
  }else if(saved.kind==='play'){
    if(!validBoard(v.game?.board,8)||!['w','b'].includes(v.game.turn)||!v.play)return null;
    if(v.play.preset!=null&&!(Object.hasOwn(PLAY_PRESETS,v.play.preset)&&v.play.mode==='ai'))return null;
    v.play=playUpgradeDifficulty(v.play);
    for(const snap of saved.history||[])if(snap.values?.play)snap.values.play=playUpgradeDifficulty(snap.values.play);
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
    if(index<0||!levels[index])return null;
    if(saved.kind==='knight'&&(rulePuzzle?!ktPuzzleStateValid(data)||!(saved.history||[]).every(s=>s.values?.kt&&ktPuzzleStateValid(s.values.kt)):(saved.history||[]).some(s=>s.values?.kt?.mode==='puzzle')))return null;
    data.levelIdx=index;for(const snap of saved.history||[])if(snap.values?.[key])snap.values[key].levelIdx=index;
  }
  return saved;
}

const ACTIVITY_NAMES={mission:'모험',puzzle:'한 수 발견',play:'체스 대전',knight:'기사의 여행',collector:'별 모으기',bomb:'이동 수 도전',defense:'성 지키기',survival:'왕 지키기'};
const KNIGHT_MODE_NAMES={walk:'산책',explore:'10칸 탐험',tour:'전체 투어',puzzle:'규칙 문제'};
function ongoingActivities(){return Object.entries(readData('sessions',{})).filter(([kind,s])=>!!getSavedSession(s)&&!s.complete).sort((a,b)=>b[1].updatedAt-a[1].updatedAt);}
function openSavedActivities(){
 const entries=ongoingActivities();if(!entries.length)return;
 showChoice('하던 놀이를 이어서 해요.',[...entries.map(([kind])=>({label:ACTIVITY_NAMES[kind],action:()=>resumeActivity(kind)})),{label:'닫기',action:()=>{}}]);
}
function recommendedActivity(){
 const saved=getSavedSession();
 // fallback: a general suggestion that the home entries already offer.
 if(!saved?.complete&&readData('experience','beginner')==='challenge')return {action:'goPlay()',title:'나에게 맞는 대전',description:'표준 판과 10단계 상대를 골라 도전해요.',fallback:true};
 if(saved?.complete&&saved.kind==='puzzle'){
  const last=PUZZLES[saved.snapshot.values.puzzleIndex],next=PUZZLES.find(p=>p.level===last.level&&!progressLedger().puzzles[p.id]);
  if(next)return {action:`openPuzzleScene('${next.id}')`,title:'같은 기술, 새로운 장면',description:last.learning.skill+'을 다른 배치에서도 찾아봐요.'};
  return {action:last.level===5?'enterActivity(\'survival\')':'enterActivity(\'defense\')',title:'발견한 수로 놀기',description:'방금 익힌 기술을 움직이는 놀이에서 써봐요.'};
 }
 if(saved?.complete&&saved.kind==='knight'){
  const kt=saved.snapshot.values.kt,mode=kt.mode==='walk'?'explore':'tour';
  if(kt.mode==='puzzle'){const next=ktNextPuzzle(kt.puzzle.id);return next?{action:`openKnightPuzzle('${next.id}')`,title:'다음 규칙 문제',description:`${KNIGHT_PUZZLE_RULES[next.rule]} · ${next.title}`}:{action:'goKnightPuzzles()',title:'규칙 문제 고르기',description:'10판을 모두 지나왔어요. 다시 해보고 싶은 판을 골라요.'};}
  return {action:`goKnightTour(${kt.levelIdx},'${mode}')`,title:mode==='explore'?'나이트 10칸 탐험':'나이트 완주 도전',description:'방금 해낸 탐험에서 한 걸음 더 가볼까요?'};
 }
 if(saved?.complete&&saved.kind==='mission'){
  const {missionPiece:piece,missionIdx:index}=saved.snapshot.values,nextIndex=nextBasicMission(piece,index),next=MISSIONS[piece][nextIndex];
  if(next&&!next.optional)return {action:`goMissionPlay('${piece}',${nextIndex})`,title:'다음 모험으로',description:next.desc.ko};
  return {action:piece==='N'?'goKnightSetup()':piece==='R'?"enterActivity('defense')":PLAY_PRESETS[piece]?`playStarterBattle('${piece}')`:'goPlay()',title:'배운 말로 놀기',description:'방금 배운 움직임을 다른 놀이에서 써봐요.'};
 }
 const next=MISSIONS.R.findIndex((m,i)=>!m.optional&&!isMissionCleared('R',i));
 return next>=0?{action:`goMissionPlay('R',${next})`,title:'룩과 모험하기',description:'한 걸음씩 해봐요. 막히면 돌아와도 괜찮아요.',fallback:true}:{action:'goKnightSetup()',title:'나이트와 놀기',description:'좋아하는 목표를 골라서 뛰어봐요.',fallback:true};
}

// Menu entry always continues a valid saved activity. Explicit replacement is separate.
function activitySaved(kind){return getSavedSession(readData('sessions',{})[kind]??null)||null;}
function enterActivity(kind){
  saveActiveSession();const saved=activitySaved(kind);
  if(saved&&!saved.complete)return resumeActivity(kind);
  return startDefaultActivity(kind);
}
function startDefaultActivity(kind){
  ({knight:()=>goKnightTour(undefined,preferredKnightMode()),collector:()=>goCollector(0),bomb:()=>goBomb(0),defense:()=>goDefense(0),survival:()=>goSurvival(0),puzzle:goPuzzleLevelSelect,mission:()=>{const i=MISSIONS.R.findIndex((m,i)=>!m.optional&&!isMissionCleared('R',i));if(i<0)return goAdventure();goMissionPlay('R',i);},play:goPlay}[kind])?.();
}
function requestNewActivity(kind,start=()=>startDefaultActivity(kind)){
  saveActiveSession();const saved=activitySaved(kind);
  if(!saved||saved.complete)return start();
  showChoice('새 판을 시작하면 이 놀이의 하던 판이 바뀌어요. 모은 별과 완료 기록은 그대로예요.',[
    {label:'하던 판 이어하기',action:()=>resumeActivity(kind)},
    {label:'새 판 시작',action:start},
    {label:'취소',action:()=>{}},
  ]);
}
function savedActivityCard(kind){
  const saved=activitySaved(kind);if(!saved||saved.complete)return '';
  const v=saved.snapshot.values;
  const detail=kind==='mission'?`${t(PIECE_NAMES[v.missionPiece])} ${v.missionIdx+1}단계`:kind==='knight'?knightSavedDetail(v.kt):kind==='play'?playSavedDetail(v.play):'하던 판이 기다려요';
  // The play entry is already the new-game selector: say when the saved board would be replaced instead.
  const after=kind==='play'?'<p class="saved-activity-note">아래에서 고른 새 판은 시작할 때 하던 판을 바꿀지 먼저 물어봐요.</p>':`<button class="text-button" onclick="pickNewActivity('${kind}')">새 판 고르기</button>`;
  return `<div class="saved-activity"><button class="action-btn green" onclick="resumeActivity('${kind}')">▶ ${kind==='play'?'하던 판':ACTIVITY_NAMES[kind]} 이어하기 · ${detail}</button>${after}</div>`;
}
function openMissionStage(piece,index){
  const saved=activitySaved('mission');
  if(saved?.params.id===MISSIONS[piece][index].id)return resumeActivity('mission');
  requestNewActivity('mission',()=>goMissionPlay(piece,index));
}
function nextBasicMission(piece,index){return MISSIONS[piece].findIndex((m,i)=>i>index&&!m.optional);}
// 비숍·퀸은 기본 모험을 마치면 첫 대전으로 이어진다. 룩·나이트는 기존 연결을 먼저 두고 첫 대전을 함께 준다.
function missionTransfer(piece){if(piece==='B'||piece==='Q')return {action:`playStarterBattle('${piece}')`,label:playPresetTitle(piece)};return piece==='N'?{action:'enterActivity(\'knight\')',label:'나이트와 탐험하기'}:piece==='R'?{action:'enterActivity(\'defense\')',label:'룩으로 성 지키기'}:{action:'goPlay()',label:'배운 말로 대전하기'};}

function preferredKnightMode(){
  const last=readData('knight_last_mode',null);if(['walk','explore','tour'].includes(last))return last;
  if(readData('experience','beginner')==='challenge'||safeStore.getItem('knight_tour_settings'))return 'tour';
  return 'walk';
}
function learningSummary(){
  const p=progressLedger(),rows=[];
  for(const key of PIECE_ORDER){const ms=MISSIONS[key],done=ms.filter(m=>(p.missions[m.id]||0)>0);if(!done.length)continue;
    rows.push({label:t(PIECE_NAMES[key])+' 움직임',count:done.length,total:ms.filter(m=>!m.optional).length,independent:done.filter(m=>p.completions?.[m.id]?.independent).length,assisted:done.filter(m=>p.completions?.[m.id]?.assisted).length,joint:done.filter(m=>p.completions?.[m.id]?.joint).length});
  }
  for(const [level,label] of [[2,'말 잡기'],[5,'왕 안전'],[1,'체크메이트'],[3,'동시 공격'],[4,'두 수 계획']]){
    const done=PUZZLES.filter(m=>m.level===level&&p.puzzles[m.id]);if(done.length)rows.push({label,count:done.length,total:PUZZLES.filter(m=>m.level===level).length,independent:done.filter(m=>p.completions?.[m.id]?.independent).length,assisted:done.filter(m=>p.completions?.[m.id]?.assisted).length,joint:0});
  }
  const mini=Object.keys(p.completions||{}).filter(id=>p.mini[id]);
  if(mini.length)rows.push({label:'경로 찾기와 안전 연습',count:mini.length,independent:mini.filter(id=>p.completions[id].independent).length,assisted:mini.filter(id=>p.completions[id].assisted).length,joint:mini.filter(id=>p.completions[id].joint).length});
  for(const [id,label]of [['play-first-capture','대전에서 첫 잡기'],['play-first-rescue','대전에서 왕 구하기'],['play-first-finish-ai','컴퓨터와 한 판 완료'],['play-first-finish-friend','가족과 한 판 완료'],...Object.entries(PLAY_PRESETS).map(([key,p])=>[p.id,playPresetTitle(key)+' 완료'])])if(p.achievements[id])rows.push({label,count:1,independent:p.completions?.[id]?.independent?1:0,assisted:p.completions?.[id]?.assisted?1:0,joint:p.completions?.[id]?.joint?1:0});
  return rows;
}
function learningSummaryHTML(){
  const rows=learningSummary();return `<section class="learning-summary"><h3>내가 익힌 것</h3>${rows.length?`<ul>${rows.map(r=>`<li><strong>${r.label}</strong><span>${r.count}개 완료 · ${r.independent?'혼자 성공 '+r.independent+'번 ':''}${r.assisted?'도움으로 성공 '+r.assisted+'번 ':''}${r.joint?'함께 성공 '+r.joint+'번':''}</span></li>`).join('')}</ul>`:'<p>첫 놀이를 해보면 여기에 배운 것이 쌓여요.</p>'}<p class="section-note">도움받아 해낸 것도 소중한 성공이에요. 모든 기록은 이 기기의 현재 프로필에 보관해요.</p></section>`;
}
function showPracticeRules(kind){
  const defense=kind==='defense';noteHelp(1);
  showActivityDialog('연습 놀이의 움직임',`<div class="practice-boards"><figure>${practiceBoardHTML(kind)}<figcaption>지금</figcaption></figure><span aria-hidden="true">→</span><figure>${practiceBoardHTML(kind,true)}<figcaption>상대의 다음 발자국</figcaption></figure></div><div class="practice-preview" aria-label="내 말 이동 다음 상대 이동"><span>♟ 내 말 한 번</span><b>→</b><span>${defense?'↓ 상대 전진':'↗ 상대 순찰'}</span></div><p>${defense?'내 말을 움직이면 살아남은 상대가 표시된 발자국으로 전진해요. 끝줄이나 내 말에 닿기 전에 잡아요.':'내 왕을 움직이면 상대가 표시된 발자국으로 움직여요. 현재와 다음 공격을 모두 피해서 깃발을 모아요. 안전할 때는 제자리에서 기다릴 수 있어요.'}</p><p class="section-note">그림은 지금 보이는 상대의 다음 위치예요. 내가 먼저 잡은 상대는 움직이지 않아요. 이 놀이의 상대는 정해진 길로 자동 이동해요. 실제 대전에서는 서로 한 수씩 골라 두고, 차례를 그냥 넘길 수 없어요.</p>`,[{label:'알겠어요 · 계속',action:()=>{}}]);
}

function activityLearning(kind,index=0){
  const rows={collector:COLLECTOR_LEVELS,bomb:BOMB_LEVELS,defense:DEFENSE_LEVELS,survival:SURVIVAL_LEVELS};
  const piece=rows[kind]?.[index]?.piece?.[1];
  const data={
    knight:{skill:'나이트 경로 찾기',prerequisites:['나이트 점프'],newRule:'한 번 간 칸은 다시 밟지 않아요',planning:index+1,recovery:'되돌리기 · 다음 한 수 · 전체 경로',next:'별 모으기'},
    collector:{skill:'기물 경로 연결',prerequisites:[piece?t(PIECE_NAMES[piece])+' 이동':'기물 이동'],newRule:'별까지의 길을 찾아요. 기본은 이동 수 제한이 없어요',planning:index<2?1:3,recovery:'되돌리기 · 경로 도움',next:'이동 수 도전'},
    bomb:{skill:'마감 순서 계획',prerequisites:[piece?t(PIECE_NAMES[piece])+' 이동':'기물 이동','기물 경로 연결'],newRule:'목표마다 남은 이동 수가 달라요',planning:index<1?1:3,recovery:'되돌리기 · 느긋한 연습 · 경로 도움',next:'성 지키기'},
    defense:{skill:'상대 이동 예측과 잡기',prerequisites:['룩 또는 퀸 이동','말 잡기'],newRule:'내가 움직이면 상대는 발자국으로 전진해요',planning:index+1,recovery:'되돌리기 · 한 수 보기 · 움직임 보기',next:'체스 대전'},
    survival:{skill:'현재와 다음 공격 피하기',prerequisites:['왕 한 칸 이동','공격받는 칸 구별'],newRule:'상대의 정해진 순찰을 피해요. 안전하면 기다릴 수 있어요',planning:index<2?1:2,recovery:'되돌리기 · 안전한 칸 · 움직임 보기',next:'한 수 발견 · 왕 구하기'},
  };
  return data[kind]||null;
}
function practiceBoardHTML(kind,next=false){
  const defense=kind==='defense',game=defense?state.df:state.sv,size=game.size;
  const enemies=defense?(next?defenseEnemyPlan(game):game.enemies).map(e=>({pos:e.pos,piece:e.p})):
    SURVIVAL_LEVELS[game.levelIdx].patrols.map(e=>({piece:e.piece,pos:e.path[(game.turn+(next?1:0))%e.path.length]}));
  const pos=defense?game.pos:game.kingPos;let cells='';
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const enemy=enemies.find(e=>e.pos[0]===r&&e.pos[1]===c),player=pos[0]===r&&pos[1]===c;
    cells+=`<span style="background:${(r+c)%2?'#c29b62':'#f2dfb8'}">${enemy?getPieceSVG(enemy.piece,22):player?getPieceSVG(defense?game.piece:'wK',22):''}</span>`;
  }
  return `<div class="practice-board" role="img" aria-label="${next?'상대의 다음 위치':'현재 위치'}" style="grid-template-columns:repeat(${size},1fr)">${cells}</div>`;
}

function pickNewActivity(kind){
  // Opening a selector is safe; confirm once when a replacement board is chosen.
  if(kind==='play')return goPlay();
  if(kind==='puzzle')return goPuzzleLevelSelect();
  if(kind==='mission')return goAdventure();
  requestNewActivity(kind);
}
