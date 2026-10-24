// Situation challenges use actual goals, not one hard-coded sequence.
const PUZZLE_LEVELS = [
  {level:2,name:{ko:'말 잡기',en:'Capture'}},
  {level:5,name:{ko:'왕 구하기',en:'Rescue the king'}},
  {level:1,name:{ko:'한 수 체크메이트',en:'Mate in one'}},
  {level:3,name:{ko:'동시에 노리기',en:'Fork'}},
  {level:4,name:{ko:'두 수 체크메이트 · 도전',en:'Mate in two · Challenge'}},
];
const puzzleSearchCache = new Map();
function puzzleMoveAchieves(before, after, move, puzzle) {
  const [fr,fc,tr,tc]=move;
  if(puzzle.type==='capture') return !!before.board[tr][tc] && (!puzzle.target || (puzzle.target[0]===tr&&puzzle.target[1]===tc));
  if(puzzle.type==='escape') { const k=after.findKing(before.turn); return !!k&&!after.isAttacked(after.board,...k,after.turn); }
  if(puzzle.type.startsWith('checkmate')) return after.status==='checkmate';
  if(puzzle.type==='fork') {
    const targets=[];
    for(let r=0;r<8;r++)for(let c=0;c<8;c++) if(after.board[r][c]?.[0]===after.turn&&pieceAttacks(after.board,tr,tc,r,c))targets.push(after.board[r][c]);
    return targets.length>=2&&targets.some(p=>p[1]==='K');
  }
  return false;
}
function puzzleWinningMoves(game,puzzle,remaining=1) {
  const key=puzzle.id+'|'+game.positionKey()+'|'+remaining;
  if(puzzleSearchCache.has(key))return puzzleSearchCache.get(key);
  const wins=[];
  for(const move of game.allMoves()) {
    const next=game.clone();next.move(...move);
    let ok=puzzleMoveAchieves(game,next,move,puzzle);
    if(!ok&&puzzle.type==='checkmate2'&&remaining>1&&next.status!=='draw') {
      const replies=next.allMoves();
      ok=replies.length>0&&replies.every(reply=>{const b=next.clone();b.move(...reply);return puzzleWinningMoves(b,puzzle,remaining-1).length>0;});
    }
    if(ok)wins.push(move);
  }
  if(puzzleSearchCache.size>5000)puzzleSearchCache.clear();
  puzzleSearchCache.set(key,wins);return wins;
}
function goPuzzleLevelSelect(){showScreen('puzzle');renderPuzzleLevelSelect();}
function renderPuzzleLevelSelect(){
  document.getElementById('screen-puzzle').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goMiniMenu()">← 놀이터</button><h2>한 수 발견</h2></div><p class="section-note">잡기부터 왕 구하기까지, 한 장면씩 해봐요.</p><div class="puzzle-level-grid">${PUZZLE_LEVELS.map(l=>`<button class="puzzle-level-card" onclick="goPuzzleLevel(${l.level})"><span class="level-name">${l.name[currentLang]||l.name.ko}</span><span class="level-progress">${PUZZLES.filter(p=>p.level===l.level).length}개 장면</span></button>`).join('')}</div></div>`;
}
function goPuzzleLevel(level){state.puzzleLevel=level;state.puzzleIndex=PUZZLES.findIndex(p=>p.level===level);renderPuzzle();}
function renderPuzzle(){
  cancelActivityCallbacks();
  const p=PUZZLES[state.puzzleIndex];
  state.puzzleGame=ChessGame.fromFEN(p.fen);state.puzzleSelected=null;state.puzzleValidMoves=[];
  state.puzzleSolved=false;state.puzzleFailed=false;state.puzzleMoveCount=0;state.puzzleWaiting=false;
  state.puzzleHistory=[];state.puzzleNotice='';state.puzzleRun=(state.puzzleRun||0)+1;
  renderPuzzleBoard();
}
function renderPuzzleBoard(){
  const p=PUZZLES[state.puzzleIndex],g=state.puzzleGame;
  const group=PUZZLES.filter(q=>q.level===p.level),pos=group.indexOf(p),next=group[pos+1];
  let cells='';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const pc=g.board[r][c];let cls='board-cell '+((r+c)%2?'dark':'light');
    if(state.puzzleSelected?.[0]===r&&state.puzzleSelected?.[1]===c)cls+=' selected';
    if(state.puzzleValidMoves.some(([mr,mc])=>mr===r&&mc===c))cls+=' move-hint';
    if(p.target?.[0]===r&&p.target?.[1]===c&&!state.puzzleSolved)cls+=' goal-cell';
    if(pc?.[1]==='K'&&g.status==='check'&&pc[0]===g.turn)cls+=' danger-cell';
    cells+=`<div class="${cls}" onclick="puzzleClick(${r},${c})">${pc?getPieceSVG(pc):''}</div>`;
  }
  document.getElementById('screen-puzzle').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="state.puzzleRun++;renderPuzzleLevelSelect()">← 장면 고르기</button><h2>한 수 발견 ${pos+1}/${group.length}</h2></div>
    <div class="status-msg ${state.puzzleSolved?'success':''}" role="status">${state.puzzleSolved?'해냈어요! '+p.desc.ko:state.puzzleNotice||p.desc[currentLang]||p.desc.ko}</div>
    <div class="chess-board">${cells}</div><div class="mission-speech" aria-live="polite">${state.puzzleWaiting?'상대가 움직여요. 잠깐 살펴봐요.':''}</div>
    <div class="mission-actions">${!state.puzzleSolved?`<button class="icon-btn" onclick="puzzleHint()" ${state.puzzleWaiting?'disabled':''}>💡 한 수 보기</button><button class="icon-btn" onclick="puzzleUndo()" ${!state.puzzleHistory.length||state.puzzleWaiting?'disabled':''}>↶ 되돌리기</button>`:''}<button class="icon-btn" onclick="renderPuzzle()">🔄 다시</button></div>
    ${state.puzzleSolved?`<button class="action-btn green" onclick="${next?`state.puzzleIndex=${PUZZLES.indexOf(next)};renderPuzzle()`:'renderPuzzleLevelSelect()'}">${next?'다음 장면':'다른 장면 발견하기'}</button><button class="action-btn secondary" onclick="showScreen('home');renderHome()">여기까지</button>`:''}</div>`;
}
function puzzleClick(r,c){
  if(state.puzzleSolved||state.animating||state.puzzleWaiting||state.puzzleGame.turn!=='w')return;
  const p=PUZZLES[state.puzzleIndex],g=state.puzzleGame;
  if(state.puzzleSelected&&state.puzzleValidMoves.some(([mr,mc])=>mr===r&&mc===c)){
    const [fr,fc]=state.puzzleSelected,move=[fr,fc,r,c];
    const remaining=(p.type==='checkmate2'?2:1)-state.puzzleMoveCount;
    if(!puzzleWinningMoves(g,p,remaining).some(m=>m.every((v,i)=>v===move[i]))){
      const preview=g.clone();preview.move(...move);
      state.puzzleNotice=p.type.startsWith('checkmate')?(preview.status==='check'?'왕이 아직 피할 수 있어요. 다른 길을 찾아봐요.':'아직 체크메이트가 아니에요. 다른 수를 둘 수 있어요.'):
        p.type==='fork'?'왕과 다른 말을 동시에 노려야 해요. 다른 칸을 살펴봐요.':p.type==='capture'?'깃발이 있는 상대 말을 찾아봐요.':'아직 왕이 위험해요.';
      state.puzzleSelected=null;state.puzzleValidMoves=[];renderPuzzleBoard();return;
    }
    state.puzzleHistory.push({game:JSON.parse(JSON.stringify(g)),moves:state.puzzleMoveCount});
    const pc=g.board[fr][fc],el=document.querySelector('#screen-puzzle .chess-board');
    g.move(...move);state.puzzleMoveCount++;state.puzzleSelected=null;state.puzzleValidMoves=[];state.puzzleNotice='';
    animateMove(el,fr,fc,r,c,pc,()=>{
      const before=Object.assign(new ChessGame(),state.puzzleHistory.at(-1).game);
      if(puzzleMoveAchieves(before,g,move,p)){
        state.puzzleSolved=true;savePuzzleStars(p.level,state.puzzleIndex,1);spawnParticles();renderPuzzleBoard();
      }else{
        state.puzzleWaiting=true;renderPuzzleBoard();const run=state.puzzleRun;
        laterInScreen(()=>{if(run!==state.puzzleRun)return;doPuzzleAiMove();state.puzzleWaiting=false;renderPuzzleBoard();},650);
      }
    });return;
  }
  const pc=g.board[r][c];state.puzzleSelected=pc?.[0]==='w'?[r,c]:null;
  state.puzzleValidMoves=state.puzzleSelected?g.legalMoves(r,c):[];renderPuzzleBoard();
}
function puzzleUndo(){
  if(state.animating||state.puzzleWaiting)return;
  const prev=state.puzzleHistory.pop();if(!prev)return;
  state.puzzleGame=Object.assign(new ChessGame(),prev.game);state.puzzleMoveCount=prev.moves;
  state.puzzleSolved=false;state.puzzleNotice='다른 방법도 해볼 수 있어요.';state.puzzleSelected=null;state.puzzleValidMoves=[];renderPuzzleBoard();
}
function puzzleHint(){
  if(state.puzzleSolved||state.puzzleWaiting)return;
  const p=PUZZLES[state.puzzleIndex],m=puzzleWinningMoves(state.puzzleGame,p,(p.type==='checkmate2'?2:1)-state.puzzleMoveCount)[0];
  if(m)showHintArrow(document.querySelector('#screen-puzzle .chess-board'),...m,8,'이 한 수를 직접 움직여 봐요.');
}
function doPuzzleAiMove(){
  const g=state.puzzleGame,p=PUZZLES[state.puzzleIndex];
  const replies=g.allMoves().map(m=>{const b=g.clone();b.move(...m);return {m,count:puzzleWinningMoves(b,p,1).length};}).sort((a,b)=>a.count-b.count);
  if(replies.length)g.move(...replies[0].m);
}
