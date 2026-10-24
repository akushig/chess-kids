// ===== 미니게임 5: 체스 디펜스 =====
// 적 폰이 전진, 끝줄 도달 전에 내 기물로 잡기

const DEFENSE_LEVELS = [
  { piece:'wR', size:6, waves:[[{pos:[0,1],p:'bP'},{pos:[0,3],p:'bP'},{pos:[0,5],p:'bP'}]], name:'룩' },
  { piece:'wR', size:6, waves:[[{pos:[0,0],p:'bP'},{pos:[0,2],p:'bP'},{pos:[0,4],p:'bP'}],[{pos:[0,1],p:'bP'},{pos:[0,3],p:'bP'},{pos:[0,5],p:'bP'}]], name:'룩' },
  { piece:'wQ', size:6, waves:[[{pos:[0,0],p:'bP'},{pos:[0,2],p:'bP'},{pos:[0,4],p:'bP'}],[{pos:[0,1],p:'bP'},{pos:[0,3],p:'bP'},{pos:[0,5],p:'bP'}],[{pos:[0,0],p:'bP'},{pos:[0,2],p:'bN'},{pos:[0,5],p:'bP'}]], name:'퀸' },
  { piece:'wQ', size:6, waves:[[{pos:[0,0],p:'bP'},{pos:[0,1],p:'bP'},{pos:[0,3],p:'bP'},{pos:[0,5],p:'bP'}],[{pos:[0,0],p:'bP'},{pos:[0,2],p:'bN'},{pos:[0,4],p:'bP'}],[{pos:[0,1],p:'bP'},{pos:[0,3],p:'bR'},{pos:[0,5],p:'bP'}]], name:'퀸' },
];

function goDefense(levelIdx=0){
  beginActivity('defense',{levelIdx});const lv=DEFENSE_LEVELS[levelIdx];
  state.df={levelIdx,size:lv.size,piece:lv.piece,pos:[lv.size-1,Math.floor(lv.size/2)],enemies:[],waves:copyData(lv.waves),waveIdx:0,turn:0,breached:0,maxBreach:2,clear:false,failed:false,notice:''};
  defenseSpawnWave(state.df);showScreen('mini');renderDefense();
}
function defenseSpawnWave(df){if(df.waveIdx<df.waves.length){df.enemies=copyData(df.waves[df.waveIdx++]);}}
function getDefenseMoves(df){
  const moves=pathGameMoves(df.piece,df.pos,df.size,[],df.enemies.map(e=>e.pos));
  // Capture is allowed at the first occupied cell along each ray.
  for(const e of df.enemies)if(pieceAttacks(Array.from({length:df.size},(_,r)=>Array.from({length:df.size},(_,c)=>r===df.pos[0]&&c===df.pos[1]?df.piece:df.enemies.find(x=>x.pos[0]===r&&x.pos[1]===c)?.p||null)),...df.pos,...e.pos))moves.push([...e.pos]);
  return moves;
}
function defenseEnemyPlan(df){
  const occupied=new Set(df.enemies.map(e=>e.pos.join(','))),plans=[];
  for(const e of df.enemies){
    occupied.delete(e.pos.join(','));
    const candidates=e.p[1]==='N'?[[e.pos[0]+2,e.pos[1]-1],[e.pos[0]+2,e.pos[1]+1],[e.pos[0]+1,e.pos[1]-2],[e.pos[0]+1,e.pos[1]+2]]:[[e.pos[0]+1,e.pos[1]]];
    const pos=candidates.find(([r,c])=>c>=0&&c<df.size&&!occupied.has(r+','+c))||e.pos;
    plans.push({...e,from:[...e.pos],pos:[...pos]});occupied.add(pos.join(','));
  }
  return plans;
}
function defenseTransition(df,move){
  const next=copyData(df);next.pos=[...move];next.turn++;
  next.enemies=next.enemies.filter(e=>e.pos[0]!==move[0]||e.pos[1]!==move[1]);
  const planned=defenseEnemyPlan(df).filter(e=>e.from[0]!==move[0]||e.from[1]!==move[1]),remaining=[];
  for(const e of planned){
    if(e.pos[0]>=next.size-1||(e.pos[0]===move[0]&&e.pos[1]===move[1]))next.breached++;
    else remaining.push(e);
  }
  next.enemies=remaining;next.failed=next.breached>=next.maxBreach;
  if(!next.failed&&!next.enemies.length){if(next.waveIdx<next.waves.length)defenseSpawnWave(next);else next.clear=true;}
  return next;
}
function renderDefense(){
  saveActiveSession();const df=state.df,over=df.clear||df.failed,moves=over?[]:getDefenseMoves(df),forecast=defenseEnemyPlan(df);let cells='';
  for(let r=0;r<df.size;r++)for(let c=0;c<df.size;c++){
    let cls='board-cell '+((r+c)%2?'dark':'light'),content='';
    if(r===df.size-1)cls+=' defense-endline';
    const e=df.enemies.find(e=>e.pos[0]===r&&e.pos[1]===c);if(e){cls+=' enemy-cell';content=getPieceSVG(e.p,36);}
    if(forecast.some(e=>Math.min(e.pos[0],df.size-1)===r&&e.pos[1]===c)){cls+=' next-enemy';content+='<span class="next-mark">↓</span>';}
    if(r===df.pos[0]&&c===df.pos[1]){cls+=' selected';content=getPieceSVG(df.piece,36);}
    if(moves.some(([mr,mc])=>r===mr&&c===mc))cls+=' move-hint';
    cells+=`<div class="${cls}" onclick="defenseClick(${r},${c})">${content}</div>`;
  }
  const msg=df.clear?(df.breached?'성을 지켰어요! 한 번 지나갔지만 끝까지 해냈어요.':'완벽하게 성을 지켰어요!'):df.failed?'상대가 성에 들어왔어요. ↶ 되돌려 다른 순서로 잡아봐요.':df.notice||'상대를 잡아서 성을 지켜요. 화살표는 다음 발자국이에요.';
  document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goMiniMenu()">← 놀이터</button><h2>성 지키기 ${df.levelIdx+1}</h2></div><div class="status-msg ${df.clear?'success':''}" role="status">${msg}</div><div class="mission-info"><div class="mission-speech">${'❤️'.repeat(Math.max(0,df.maxBreach-df.breached))}${'🤍'.repeat(Math.min(df.maxBreach,df.breached))}</div><div class="move-counter">물결 ${df.waveIdx}/${df.waves.length}</div></div><div class="chess-board" style="grid-template-columns:repeat(${df.size},1fr)">${cells}</div><p class="section-note">연습 침입자는 화살표대로 전진해요. 빨간 끝줄이나 내 말에 닿으면 하트가 줄어요.</p><div class="mission-actions">${undoButton()}${!over?'<button class="icon-btn hint-btn" onclick="defenseHint()">💡 한 수 보기</button>':''}<button class="icon-btn" onclick="goDefense(${df.levelIdx})">🔄 다시</button></div>${df.clear?finishLinks(df.levelIdx<DEFENSE_LEVELS.length-1?`goDefense(${df.levelIdx+1})`:'goPlay()',df.levelIdx<DEFENSE_LEVELS.length-1?'다음 성 지키기':'배운 말로 대전하기'):''}</div>`;
}
function defenseClick(r,c){
  const df=state.df;if(state.animating||df.clear||df.failed)return;
  if(!getDefenseMoves(df).some(([mr,mc])=>r===mr&&c===mc))return;
  rememberAction();const [pr,pc]=df.pos,piece=df.piece;state.df=defenseTransition(df,[r,c]);
  animateMove(document.querySelector('#screen-mini .chess-board'),pr,pc,r,c,piece,()=>{if(state.df.clear){saveMiniGameStars('defense',df.levelIdx,state.df.breached?2:3);spawnParticles();}renderDefense();},df.size);
}
function defenseHint(){
  const df=state.df;if(df.clear||df.failed)return;
  const ranked=getDefenseMoves(df).map(move=>{const next=defenseTransition(df,move);let score=next.clear?1000:next.failed?-1000:0;score-=next.breached*100;score-=(next.enemies.length+(next.waves.length-next.waveIdx)*3)*5;score+=getDefenseMoves(next).filter(([r,c])=>next.enemies.some(e=>e.pos[0]===r&&e.pos[1]===c)).length*3;return {move,score};}).sort((a,b)=>b.score-a.score);
  if(ranked.length)showHintArrow(document.querySelector('#screen-mini .chess-board'),...df.pos,...ranked[0].move,df.size,'다음 발자국을 보고 이 칸을 살펴봐요.');
}
