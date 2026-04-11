// ===== 미니게임 3: 기물 수집 =====
// 특정 기물로 별을 수집, 적 순찰 회피

const COLLECTOR_LEVELS = [
  { piece:'wN', size:5, stars:[[0,4],[2,2],[4,4]], enemies:[], turns:8, name:'나이트' },
  { piece:'wN', size:5, stars:[[0,0],[0,4],[4,4]], enemies:[{pos:[2,2],piece:'bR',path:[[2,2],[2,4],[2,0],[2,2]]}], turns:10, name:'나이트' },
  { piece:'wB', size:6, stars:[[0,1],[2,3],[4,5]], enemies:[{pos:[1,1],piece:'bR',path:[[1,1],[1,5],[1,1]]}], turns:8, name:'비숍' },
  { piece:'wR', size:6, stars:[[0,5],[3,0],[5,3],[1,2]], enemies:[{pos:[2,2],piece:'bB',path:[[2,2],[4,4],[2,2]]},{pos:[3,3],piece:'bN',path:[[3,3],[1,4],[3,3]]}], turns:12, name:'룩' },
  { piece:'wQ', size:6, stars:[[0,0],[0,5],[5,0],[5,5],[2,3]], enemies:[{pos:[1,3],piece:'bR',path:[[1,3],[1,0],[1,5],[1,3]]},{pos:[4,2],piece:'bB',path:[[4,2],[2,0],[4,2]]}], turns:10, name:'퀸' },
];

function goCollector(levelIdx) {
  const lv = COLLECTOR_LEVELS[levelIdx || 0];
  const size = lv.size;
  state.cl = {
    levelIdx: levelIdx || 0,
    size: size,
    piece: lv.piece,
    pos: [size - 1, 0],
    stars: lv.stars.map(s => [...s]),
    starsLeft: lv.stars.length,
    enemies: lv.enemies.map(e => ({pos:[...e.pos], piece:e.piece, path:e.path.map(p=>[...p]), pathIdx:0})),
    turnsLeft: lv.turns,
    clear: false,
    failed: false,
    failMsg: '',
  };
  showScreen('mini');
  renderCollector();
}

function getCollectorMoves(cl) {
  const {pos, size, piece} = cl;
  const [row, col] = pos;
  const type = piece[1];
  const moves = [];
  const inB = (r,c) => r>=0 && r<size && c>=0 && c<size;
  const isEnemy = (r,c) => cl.enemies.some(e => e.pos[0]===r && e.pos[1]===c);
  const add = (r,c) => { if (inB(r,c) && !isEnemy(r,c)) moves.push([r,c]); };
  const slide = (dr,dc) => { let r=row+dr,c=col+dc; while(inB(r,c)) { if(isEnemy(r,c)) break; moves.push([r,c]); r+=dr; c+=dc; } };

  if (type==='N') { for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(row+dr,col+dc); }
  else if (type==='B') { for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,dc); }
  else if (type==='R') { for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  else if (type==='Q') { for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  return moves;
}

function renderCollector() {
  const cl = state.cl;
  const size = cl.size;
  const [pr,pc] = cl.pos;
  const moves = cl.clear || cl.failed ? [] : getCollectorMoves(cl);

  let cells = '';
  for (let r=0; r<size; r++) {
    for (let c=0; c<size; c++) {
      const isLight = (r+c)%2===0;
      let cls = 'board-cell '+(isLight?'light':'dark');
      let content = '';
      if (r===pr && c===pc) { cls+=' selected'; content=getPieceSVG(cl.piece,36); }
      else if (cl.enemies.some(e=>e.pos[0]===r&&e.pos[1]===c)) { const e=cl.enemies.find(e=>e.pos[0]===r&&e.pos[1]===c); content=getPieceSVG(e.piece,36); cls+=' enemy-cell'; }
      else if (cl.stars.some(s=>s[0]===r&&s[1]===c)) { content='<span class="collector-star">⭐</span>'; cls+=' goal-cell'; }
      if (moves.some(([mr,mc])=>mr===r&&mc===c)) cls+=' move-hint';
      cells+=`<div class="${cls}" onclick="collectorClick(${r},${c})">${content}</div>`;
    }
  }

  let msg;
  if (cl.clear) msg=`<div class="status-msg success">${t('collectorClear')}</div>`;
  else if (cl.failed) msg=`<div class="status-msg fail">${cl.failMsg}</div>`;
  else msg=`<div class="status-msg">${t('collectorDesc')}</div>`;

  const info=`<div class="mission-info">
    <div class="mission-speech">${t('collectorStars')}: ${cl.starsLeft > 0 ? '⭐'.repeat(cl.starsLeft) : '✓'}</div>
    <div class="move-counter">${t('collectorTurns')}: ${cl.turnsLeft}</div>
  </div>`;

  const actions=(!cl.clear&&!cl.failed)?`<div class="mission-actions">
    <button class="icon-btn hint-btn" onclick="collectorHint()">💡 ${t('hintBtn')}</button>
    <button class="icon-btn reset-btn" onclick="goCollector(${cl.levelIdx})">🔄 ${t('resetBtn')}</button>
  </div>`:'';

  const retryBtn=cl.failed?`<button class="action-btn" onclick="goCollector(${cl.levelIdx})">${t('missionRetryBtn')}</button>`:'';
  const nextBtn=cl.clear&&cl.levelIdx<COLLECTOR_LEVELS.length-1?`<button class="action-btn green" onclick="goCollector(${cl.levelIdx+1})">${t('btnNext')}</button>`:'';

  document.getElementById('screen-mini').innerHTML=`
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="goMiniMenu()">← ${t('btnBack')}</button>
        <h2>${t('collectorTitle')} Lv.${cl.levelIdx+1}</h2>
      </div>
      ${msg} ${info}
      <div class="chess-board" style="grid-template-columns:repeat(${size},1fr)">${cells}</div>
      ${actions} ${retryBtn} ${nextBtn}
    </div>`;
}

function collectorClick(r,c) {
  if (state.animating) return;
  const cl=state.cl;
  if (cl.clear||cl.failed) return;
  const moves=getCollectorMoves(cl);
  if (!moves.some(([mr,mc])=>mr===r&&mc===c)) return;

  const [pr,pc]=cl.pos;
  const boardEl=document.querySelector('#screen-mini .chess-board');
  cl.pos=[r,c];
  cl.turnsLeft--;

  animateMove(boardEl,pr,pc,r,c,cl.piece,()=>{
    // 별 수집
    const si=cl.stars.findIndex(s=>s[0]===r&&s[1]===c);
    if (si>=0) { cl.stars.splice(si,1); cl.starsLeft--; }

    // 적 이동
    for (const e of cl.enemies) {
      e.pathIdx=(e.pathIdx+1)%e.path.length;
      e.pos=[...e.path[e.pathIdx]];
    }

    // 적에게 잡혔는지
    if (cl.enemies.some(e=>e.pos[0]===r&&e.pos[1]===c)) { cl.failed=true; cl.failMsg=t('collectorCaught'); }
    else if (cl.starsLeft===0) { cl.clear=true; spawnParticles(); }
    else if (cl.turnsLeft<=0) { cl.failed=true; cl.failMsg=t('collectorTimeout'); }

    renderCollector();
  },cl.size);
}

function collectorHint() {
  const cl=state.cl;
  if (cl.stars.length===0) return;
  // 가장 가까운 별 위치 하이라이트
  const [pr,pc]=cl.pos;
  let closest=cl.stars[0], minDist=Infinity;
  for (const s of cl.stars) {
    const d=Math.abs(s[0]-pr)+Math.abs(s[1]-pc);
    if (d<minDist) { minDist=d; closest=s; }
  }
  const boardEl=document.querySelector('#screen-mini .chess-board');
  if (!boardEl) return;
  const idx=closest[0]*cl.size+closest[1];
  const cell=boardEl.children[idx];
  if (cell) { cell.classList.add('hint-highlight'); setTimeout(()=>cell.classList.remove('hint-highlight'),2500); }
  const speech=document.querySelector('.mission-speech');
  if (speech) { speech.innerHTML=`💡 ${t('collectorHint')}`; speech.classList.add('hint-active'); setTimeout(()=>speech.classList.remove('hint-active'),2500); }
}
