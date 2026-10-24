// ===== 미니게임 1: 나이트 투어 =====
// 나이트로 보드의 모든 칸을 방문하며 별을 수집

const KNIGHT_TOUR_LEVELS = [
  { id:'knight-tour-5-v1', size: 5, label: '5×5', starCount: 5, bonusTurns: 3 },
  { id:'knight-tour-6-v1', size: 6, label: '6×6', starCount: 7, bonusTurns: 3 },
  { id:'knight-tour-7-v1', size: 7, label: '7×7', starCount: 9, bonusTurns: 3 },
];
// 솔버 탐색 한도 (7×7 실측: 한 수 판정 평균 0.4ms, 한도 초과 0.02%)
const KT_NODE_LIMIT = 300000;

// ===== 설정 (크기 · 랜덤 시작 · 갈림길 경고) =====
function getKnightTourSettings() {
  let s = {};
  try { s = JSON.parse(safeStore.getItem('knight_tour_settings')) || {}; } catch { s = {}; }
  const levelIdx = KNIGHT_TOUR_LEVELS.findIndex(lv => lv.size === s.size);
  return { levelIdx: levelIdx >= 0 ? levelIdx : 0, randomStart: !!s.randomStart, branchWarn: !!s.branchWarn };
}
function saveKnightTourSettings(s) {
  try {
    safeStore.setItem('knight_tour_settings', JSON.stringify({
      size: KNIGHT_TOUR_LEVELS[s.levelIdx].size, randomStart: s.randomStart, branchWarn: s.branchWarn,
    }));
  } catch {}
}

function ktSelectSize(levelIdx) {
  const s = getKnightTourSettings();
  s.levelIdx = levelIdx;
  saveKnightTourSettings(s);
  goKnightTour(levelIdx);
}

function ktToggleOption(key) {
  const s = getKnightTourSettings();
  s[key] = !s[key];
  saveKnightTourSettings(s);
  // 랜덤 시작은 다음 판부터 적용 (아직 한 수도 안 뒀으면 바로 새 시작점)
  if (key === 'randomStart' && state.kt.moveCount === 0) goKnightTour(state.kt.levelIdx,state.kt.mode);
  else renderKnightTour();
}

// 시작점: 기본은 왼쪽 아래 모서리, 랜덤이면 완주 경로가 실제로 있는 칸 중에서 선택
function ktPickStart(size, random, prev) {
  const corner = [size - 1, 0];
  if (!random) return corner;
  const cells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!(prev && prev[0] === r && prev[1] === c)) cells.push([r, c]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(activityRandom() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  for (const [r, c] of cells) {
    const board = Array.from({length: size}, () => Array(size).fill(false));
    board[r][c] = true;
    if (ktFindPath(board, size, [r, c], KT_NODE_LIMIT).path) return [r, c];
  }
  return corner;
}

function ktPlaceStars(kt) {
  const empties = [];
  for (let r = 0; r < kt.size; r++)
    for (let c = 0; c < kt.size; c++)
      if (!(r === kt.pos[0] && c === kt.pos[1])) empties.push([r, c]);
  // 셔플 후 앞에서 N개 선택
  for (let i = empties.length - 1; i > 0; i--) {
    const j = Math.floor(activityRandom() * (i + 1));
    [empties[i], empties[j]] = [empties[j], empties[i]];
  }
  const lv = KNIGHT_TOUR_LEVELS[kt.levelIdx];
  kt.stars = empties.slice(0, lv.starCount);
}

function getKnightMoves(row, col, size, board) {
  const moves = [];
  for (const [dr, dc] of KNIGHT_DELTAS) {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < size && c >= 0 && c < size && !board[r][c]) {
      moves.push([r, c]);
    }
  }
  return moves;
}

// 갈림길 판정: 이번 수의 후보마다 그 칸으로 간 뒤에도 완주할 수 있는지 검사 (수마다 한 번만 계산)
function ktAnalyze(kt) {
  if (kt.analysis && kt.analysis.at === kt.moveCount) return kt.analysis;
  const fatal = [];
  let safe = 0;
  for (const [r, c] of getKnightMoves(kt.pos[0], kt.pos[1], kt.size, kt.board)) {
    kt.board[r][c] = true;
    const res = ktFindPath(kt.board, kt.size, [r, c], KT_NODE_LIMIT);
    kt.board[r][c] = false;
    if (res.path === null) fatal.push([r, c]);
    else safe++; // 한도 초과는 막힌 수로 단정하지 않음
  }
  kt.analysis = { at: kt.moveCount, fatal, safe };
  return kt.analysis;
}

function goKnightSetup() {
  leaveActivity();showScreen('mini');
  document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goMiniMenu()">← 놀이터</button><h2>나이트 탐험</h2></div><p class="section-note">짧게 걷거나, 넓게 탐험하거나, 끝까지 도전해요.</p><div class="menu-grid">${[['walk','🚩','산책','몇 번 뛰어서 깃발 찾기'],['explore','👣','탐험','서로 다른 10칸 찾아가기'],['tour','🏁','완주 도전','5×5부터 모든 칸을 한 번씩']].map(([mode,icon,title,desc])=>`<button class="menu-btn mini-green" onclick="goKnightTour(null,'${mode}')"><span class="menu-icon">${icon}</span><span class="menu-label">${title}<span class="menu-sub">${desc}</span></span><span>›</span></button>`).join('')}</div></div>`;
}
function goKnightTour(levelIdx,mode='tour',shared=null) {
  beginActivity('knight',{levelIdx,mode});
  const settings=getKnightTourSettings();if(levelIdx==null)levelIdx=settings.levelIdx;
  if(mode!=='tour'&&!shared)levelIdx=0;
  const size=KNIGHT_TOUR_LEVELS[levelIdx].size,prev=state.kt?.startPos;
  const start=shared?.startPos || ktPickStart(size,settings.randomStart,prev);
  state.kt={levelIdx,size,mode,startPos:start,pos:start,board:Array.from({length:size},()=>Array(size).fill(false)),visited:1,total:size*size,stuck:false,clear:false,doomed:false,analysis:null,stars:[],score:0,combo:0,lastWasStar:false,moveCount:0,family:false,jointUsed:false,notice:'',player:0,footprints:{[start.join(',')]:0}};
  const kt=state.kt;kt.board[start[0]][start[1]]=true;
  const route=ktFindPath(kt.board,size,start,KT_NODE_LIMIT).path;
  kt.goal=mode==='walk'?route[3]:null;kt.visitGoal=mode==='explore'?10:kt.total;
  showScreen('mini');renderKnightTour();
}
function knightGoalPath(kt=state.kt) {
  if(kt.mode==='tour')return ktFindPath(kt.board,kt.size,kt.pos,KT_NODE_LIMIT);
  const board=kt.board.map(r=>[...r]);let nodes=0,timeout=false;
  function visit(pos,path){
    if(kt.mode==='walk'?(pos[0]===kt.goal[0]&&pos[1]===kt.goal[1]):kt.visited+path.length-1>=kt.visitGoal)return path;
    if(++nodes>20000){timeout=true;return null;}
    const moves=getKnightMoves(...pos,kt.size,board).sort((a,b)=>getKnightMoves(...a,kt.size,board).length-getKnightMoves(...b,kt.size,board).length);
    for(const next of moves){board[next[0]][next[1]]=true;const found=visit(next,[...path,next]);board[next[0]][next[1]]=false;if(found)return found;if(timeout)return null;}
    return null;
  }
  const path=visit(kt.pos,[kt.pos]);return path?{path}:timeout?{timeout:true}:{path:null};
}
function renderKnightTour() {
  saveActiveSession();
  const kt=state.kt,moves=kt.clear||kt.stuck?[]:getKnightMoves(...kt.pos,kt.size,kt.board),settings=getKnightTourSettings();
  const analysis=settings.branchWarn&&kt.mode==='tour'&&!kt.clear&&!kt.stuck?ktAnalyze(kt):null;
  let cells='';
  for(let r=0;r<kt.size;r++)for(let c=0;c<kt.size;c++){
    let cls='board-cell '+((r+c)%2?'dark':'light'),content='';
    if(r===kt.pos[0]&&c===kt.pos[1]){cls+=' selected';content=getPieceSVG('wN',36);}
    else if(kt.board[r][c]){cls+=' kt-visited';content=`<span class="kt-check ${kt.footprints?.[r+','+c]===1?'parent-step':''}">${kt.family&&kt.footprints?.[r+','+c]===1?'◆':'✓'}</span>`;}
    else if(kt.goal?.[0]===r&&kt.goal?.[1]===c){cls+=' goal-cell';content='🚩';}
    if(moves.some(([mr,mc])=>mr===r&&mc===c))cls+=' move-hint';
    cells+=`<div class="${cls}" onclick="knightTourClick(${r},${c})">${content}</div>`;
  }
  const title=({walk:'산책',explore:'탐험',tour:'완주 도전'})[kt.mode];
  let msg=kt.notice|| (kt.clear?'해냈어요! '+(kt.mode==='walk'?'깃발을 찾았어요.':`${kt.visited}칸을 탐험했어요.`):kt.stuck?'길이 막혔어요. ↶ 되돌려 다른 갈림길을 찾아봐요.':analysis?.fatal.length?'길이 나뉘어요. 막히면 돌아와도 괜찮아요.':kt.mode==='walk'?'나이트로 뛰어서 깃발을 찾아요.':'한 번 간 칸을 피해서 새 칸으로 뛰어요.');
  const progress=kt.mode==='walk'?`🚩 깃발 찾기 · ${kt.moveCount}번 점프`:`👣 ${kt.visited}/${kt.visitGoal}칸`;
  document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goKnightSetup()">← 목표 고르기</button><h2>나이트 ${title}</h2></div>
    ${kt.mode==='tour'?`<div class="kt-sizes">${KNIGHT_TOUR_LEVELS.map((lv,i)=>`<button class="kt-chip ${i===kt.levelIdx?'active':''}" onclick="goKnightTour(${i},'tour')">${lv.label}</button>`).join('')}</div>`:''}
    <div class="status-msg ${kt.clear?'success':''}" role="status">${msg}</div><div class="mission-info"><div class="mission-speech">${kt.family?(kt.player===0?'🧒 내 차례':'🧑 함께하는 사람 차례'):progress}</div>${kt.family?`<div class="move-counter">${progress}</div>`:''}</div>
    <div class="chess-board" style="grid-template-columns:repeat(${kt.size},1fr)">${cells}</div>
    <div class="mission-actions">${undoButton()}${!kt.clear&&!kt.stuck?'<button class="icon-btn hint-btn" onclick="knightTourHint()">💡 한 점프 보기</button><button class="icon-btn" onclick="knightTourDemo()">▶ 시범</button>':''}<button class="icon-btn" onclick="goKnightTour(${kt.levelIdx},'${kt.mode}')">🔄 다시</button></div>
    <div class="kt-options"><button class="kt-toggle ${kt.family?'on':''}" onclick="state.kt.family=!state.kt.family;state.kt.jointUsed ||= state.kt.family;renderKnightTour()">👪 ${kt.family?'번갈아 탐험 중':'함께 번갈아 하기'}</button><button class="kt-toggle ${settings.randomStart?'on':''}" onclick="ktToggleOption('randomStart')">🎲 다른 시작점 ${settings.randomStart?'켜짐':'꺼짐'}</button><button class="kt-toggle" onclick="offerKnightFamilyChallenge()">👪 같은 판을 가족에게</button>${kt.mode==='tour'?`<button class="kt-toggle ${settings.branchWarn?'on':''}" onclick="ktToggleOption('branchWarn')">갈림길 알려주기 ${settings.branchWarn?'켜짐':'꺼짐'}</button>`:''}</div>
    ${kt.clear?`<button class="action-btn green" onclick="goKnightTour(${kt.levelIdx},'${kt.mode==='walk'?'explore':kt.mode==='explore'?'tour':'tour'}')">${kt.mode==='walk'?'10칸 탐험하기':kt.mode==='explore'?'모든 칸 도전하기':'한 번 더 도전'}</button><button class="action-btn secondary" onclick="leaveActivity();showScreen('home');renderHome()">여기까지</button>`:''}</div>`;
}
function knightTourClick(r,c) {
  const kt=state.kt;if(state.animating||kt.clear||kt.stuck)return;
  if(!getKnightMoves(...kt.pos,kt.size,kt.board).some(([mr,mc])=>mr===r&&mc===c)){kt.notice=kt.board[r][c]?'이미 간 칸이에요. 점이 있는 새 칸으로 뛰어요.':'나이트는 두 칸, 옆으로 한 칸 뛰어요.';renderKnightTour();return;}
  kt.notice='';
  rememberAction();const [pr,pc]=kt.pos;kt.pos=[r,c];kt.board[r][c]=true;kt.footprints[r+','+c]=kt.player;kt.visited++;kt.moveCount++;kt.analysis=null;
  if(kt.family)kt.player=1-kt.player;

    kt.clear=kt.mode==='walk'?r===kt.goal[0]&&c===kt.goal[1]:kt.visited>=kt.visitGoal;
    if(kt.clear){saveMiniGameStars(kt.mode==='tour'?'knighttour':'knight-'+kt.mode,kt.levelIdx,3);spawnParticles();}
    else if(!getKnightMoves(r,c,kt.size,kt.board).length){kt.stuck=true;const pct=kt.visited/kt.visitGoal;if(pct>=.4)saveMiniGameStars(kt.mode==='tour'?'knighttour':'knight-'+kt.mode,kt.levelIdx,pct>=.8?2:1);}

  saveActiveSession();
  animateMove(document.querySelector('#screen-mini .chess-board'),pr,pc,r,c,'wN',()=>renderKnightTour(),kt.size);
}
function knightTourHint(){
  const kt=state.kt;if(kt.clear||kt.stuck)return;
  const result=knightGoalPath();
  if(result.path?.length>1)showHintArrow(document.querySelector('#screen-mini .chess-board'),...result.path[0],...result.path[1],kt.size,'두 칸, 옆으로 한 칸! 직접 뛰어봐요.');
  else {const speech=document.querySelector('#screen-mini .mission-speech');if(speech)speech.textContent=result.timeout?'아직 길을 찾고 있어요. 한 걸음 되돌려 볼까요?':'여기서는 목표로 갈 수 없어요. ↶ 되돌려서 다시 찾아봐요.';}
}
function knightTourDemo(){
  const kt=state.kt;if(state.animating||kt.clear||kt.stuck)return;const path=knightGoalPath().path;if(!path?.[1])return;
  noteHelp(3);kt.demoUsed=true;animateMove(document.querySelector('#screen-mini .chess-board'),...path[0],...path[1],'wN',()=>renderKnightTour(),kt.size);
}

function offerKnightFamilyChallenge(){
 const kt=state.kt,spec={levelIdx:kt.levelIdx,mode:kt.mode,startPos:[...kt.startPos]};
 const target=activeProfile==='adult'?'child':'adult';
 showChoice('지금 판을 저장하고, 같은 시작점에서 가족이 도전해요.',[{label:target==='adult'?'어른이 완주 도전':'아이가 산책 도전',action:()=>{switchProfile(target);goKnightTour(spec.levelIdx,target==='adult'?'tour':'walk',spec);}},{label:'지금 판 계속하기',action:()=>{}}]);
}
