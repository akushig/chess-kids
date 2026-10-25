// Predictable safety challenges. Enemy patrols and their attack maps are visible before a move.
const SURVIVAL_LEVELS=[
 { id:'safety-pawn-v3',goal:2,goals:[[4,1],[2,3]],patrols:[{piece:'bP',path:[[1,1],[2,1],[3,1],[2,1]]}]},
 { id:'safety-pawns-v3',goal:2,goals:[[4,0],[1,3]],patrols:[{piece:'bP',path:[[1,1],[2,1],[3,1],[2,1]]},{piece:'bP',path:[[1,4],[2,4],[3,4],[2,4]]}]},
 { id:'safety-rook-v3',goal:2,goals:[[4,2],[2,3]],patrols:[{piece:'bR',path:[[0,0],[0,1],[0,0],[0,1]]},{piece:'bP',path:[[1,4],[2,4],[3,4],[2,4]]}]},
 { id:'safety-diagonal-v3',goal:3,goals:[[4,1],[3,2],[3,4]],patrols:[{piece:'bB',path:[[0,0],[1,1],[2,2],[1,1]]},{piece:'bR',path:[[0,5],[1,5],[2,5],[1,5]]}]},
];
function survivalBoard(sv,turn=sv.turn,pos=sv.kingPos){
 const b=Array.from({length:sv.size},()=>Array(sv.size).fill(null));
 for(const e of SURVIVAL_LEVELS[sv.levelIdx].patrols){const [r,c]=e.path[turn%e.path.length];b[r][c]=e.piece;}
 if(!b[pos[0]][pos[1]])b[pos[0]][pos[1]]='wK';return b;
}
function goSurvival(levelIdx=0){
 beginActivity('survival',{levelIdx,id:SURVIVAL_LEVELS[levelIdx||0].id});state.sv={levelIdx,size:6,kingPos:[5,3],turn:0,goal:SURVIVAL_LEVELS[levelIdx].goal,goalsLeft:copyData(SURVIVAL_LEVELS[levelIdx].goals),gameOver:false,clear:false,record:Number(safeStore.getItem('safety_best_'+SURVIVAL_LEVELS[levelIdx].id)||0),newRecord:false,notice:''};state.sv.board=survivalBoard(state.sv);showScreen('mini');renderSurvival();
}
function isSurvivalAttacked(sv,row,col){
 const b=sv.board.map(r=>[...r]);b[sv.kingPos[0]][sv.kingPos[1]]=null;
 for(let r=0;r<sv.size;r++)for(let c=0;c<sv.size;c++)if(b[r][c]?.[0]==='b'&&pieceAttacks(b,r,c,row,col))return true;
 return false;
}
function getSurvivalSafeMoves(sv){
 const result=[];
 for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
  const r=sv.kingPos[0]+dr,c=sv.kingPos[1]+dc;
  if(r<0||c<0||r>=sv.size||c>=sv.size||sv.board[r][c]?.[0]==='b'||isSurvivalAttacked(sv,r,c))continue;
  const next={...sv,kingPos:[r,c],board:survivalBoard(sv,sv.turn+1,[r,c])};
  if(next.board[r][c]==='wK'&&!isSurvivalAttacked(next,r,c))result.push([r,c]);
 }
 return result;
}
function survivalMoveEnemies(sv){sv.board=survivalBoard(sv);}
function renderSurvival(){
 saveActiveSession();const sv=state.sv,over=sv.clear||sv.gameOver,moves=over?[]:getSurvivalSafeMoves(sv),forecast=survivalBoard(sv,sv.turn+1);let cells='';
 for(let r=0;r<sv.size;r++)for(let c=0;c<sv.size;c++){
  const pc=sv.board[r][c];let cls='board-cell '+((r+c)%2?'dark':'light'),content=pc?getPieceSVG(pc,36):'';
  if(sv.goalsLeft.some(([gr,gc])=>gr===r&&gc===c)){cls+=' goal-cell';if(!pc)content='🚩';}
  if(r===sv.kingPos[0]&&c===sv.kingPos[1])cls+=' selected';
  if(forecast[r][c]?.[0]==='b'){cls+=' next-enemy';content+='<span class="next-mark">↓</span>';}
  if(moves.some(([mr,mc])=>mr===r&&mc===c)&&!(r===sv.kingPos[0]&&c===sv.kingPos[1]))cls+=' move-hint';
  if(isSurvivalAttacked(sv,r,c))cls+=' danger-cell';
  cells+=`<div class="${cls}" onclick="survivalClick(${r},${c})">${content}</div>`;
 }
 const msg=sv.clear?'왕이 모든 깃발을 안전하게 찾았어요!':sv.gameOver?'안전한 길이 막혔어요. ↶ 되돌려 다른 곳으로 가봐요.':'왕으로 깃발을 찾아요. 점은 다음 움직임까지 안전한 곳이에요.';
 renderGameScreen('screen-mini', `<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goMiniMenu()">← 놀이터</button><h2>왕 지키기 ${sv.levelIdx+1}</h2></div><div class="status-msg ${sv.clear?'success':''}" role="status">${msg}</div><div class="mission-info"><div class="mission-speech">🚩 ${sv.goal-sv.goalsLeft.length}/${sv.goal}개 찾음</div><div class="move-counter">${sv.newRecord?'🎉 새 기록!':sv.turn+'번 이동'}</div></div><div class="chess-board" style="grid-template-columns:repeat(6,1fr)">${cells}</div><p class="section-note">연습 상대는 화살표 위치로 움직여요. 대전에서는 차례를 기다리기로 넘길 수 없어요.</p><div class="mission-actions">${undoButton()}${!over?`<button class="icon-btn" onclick="survivalClick(...state.sv.kingPos)" ${moves.some(([r,c])=>r===sv.kingPos[0]&&c===sv.kingPos[1])?'':'disabled'}>⏸ 기다려요</button><button class="icon-btn hint-btn" onclick="survivalHint()">💡 안전한 칸</button>`:''}<button class="icon-btn" onclick="goSurvival(${sv.levelIdx})">🔄 다시</button></div>${sv.clear?finishLinks(sv.levelIdx<SURVIVAL_LEVELS.length-1?`goSurvival(${sv.levelIdx+1})`:'goPuzzleLevel(5);showScreen(\'puzzle\')',sv.levelIdx<SURVIVAL_LEVELS.length-1?'다음 왕 지키기':'대전의 왕 구하기'):''}</div>`);
}
function survivalClick(r,c){
 const sv=state.sv;if(state.animating||sv.clear||sv.gameOver)return;
 if(!getSurvivalSafeMoves(sv).some(([mr,mc])=>mr===r&&mc===c)){sv.notice='이곳은 지금이나 다음 움직임에 공격받아요. 점이 있는 곳을 살펴봐요.';renderSurvival();return;}
 rememberAction();const old=[...sv.kingPos];sv.kingPos=[r,c];sv.turn++;

  sv.board=survivalBoard(sv);sv.goalsLeft=sv.goalsLeft.filter(([gr,gc])=>gr!==r||gc!==c);sv.clear=sv.goalsLeft.length===0;sv.gameOver=!sv.clear&&!getSurvivalSafeMoves(sv).length;sv.notice='';
  if(sv.clear&&(!sv.record||sv.turn<sv.record)){sv.newRecord=true;sv.record=sv.turn;safeStore.setItem('safety_best_'+SURVIVAL_LEVELS[sv.levelIdx].id,sv.record);}
  if(sv.clear){saveMiniGameStars('survival-safety-v2',sv.levelIdx,3);spawnParticles();}

  saveActiveSession();
 animateMove(document.querySelector('#screen-mini .chess-board'),...old,r,c,'wK',()=>renderSurvival(),sv.size);
}
function findSurvivalPath(sv=state.sv){
 const queue=[{sv,path:[sv.kingPos]}],seen=new Set();
 for(let index=0;index<queue.length;index++){
  const {sv:current,path}=queue[index];if(!current.goalsLeft.length)return path;
  for(const pos of getSurvivalSafeMoves(current)){
   const turn=current.turn+1,goalsLeft=current.goalsLeft.filter(([r,c])=>r!==pos[0]||c!==pos[1]),key=(turn%12)+','+pos.join(',')+'|'+goalsLeft.map(p=>p.join(',')).join(';');if(seen.has(key))continue;seen.add(key);
   queue.push({sv:{...current,turn,goalsLeft,kingPos:pos,board:survivalBoard(current,turn,pos)},path:[...path,pos]});
  }
 }
 return null;
}
function survivalHint(){const sv=state.sv;if(sv.clear||sv.gameOver)return;const m=findSurvivalPath()?.[1]||getSurvivalSafeMoves(sv)[0];if(m)showHintArrow(document.querySelector('#screen-mini .chess-board'),...sv.kingPos,...m,sv.size,'지금도 다음 움직임에도 안전한 칸이에요.');}
