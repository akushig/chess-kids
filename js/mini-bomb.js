// ===== 미니게임 4: 폭탄 해제 =====
// 기물로 폭탄 칸에 도달해서 해제

const BOMB_LEVELS = [
  { piece:'wR', size:6, bombs:[{pos:[0,5],timer:5}], blocks:[], name:'룩' },
  { piece:'wR', size:6, bombs:[{pos:[0,5],timer:4},{pos:[5,5],timer:6}], blocks:[[3,0]], name:'룩' },
  { piece:'wN', size:6, bombs:[{pos:[1,2],timer:4},{pos:[3,4],timer:6}], blocks:[], name:'나이트' },
  { piece:'wB', size:6, bombs:[{pos:[0,1],timer:4},{pos:[4,5],timer:5},{pos:[2,3],timer:7}], blocks:[], name:'비숍' },
  { piece:'wQ', size:6, bombs:[{pos:[0,0],timer:3},{pos:[0,5],timer:4},{pos:[5,5],timer:5},{pos:[3,1],timer:6}], blocks:[[2,3],[3,3]], name:'퀸' },
];

function goBomb(levelIdx) {
  const lv = BOMB_LEVELS[levelIdx || 0];
  const size = lv.size;
  state.bm = {
    levelIdx: levelIdx || 0,
    size: size,
    piece: lv.piece,
    pos: [size-1, 0],
    bombs: lv.bombs.map(b => ({pos:[...b.pos], timer:b.timer, defused:false})),
    blocks: lv.blocks.map(b => [...b]),
    clear: false,
    failed: false,
    moves: 0,
  };
  showScreen('mini');
  renderBomb();
}

function getBombMoves(bm) {
  const {pos, size, piece, blocks} = bm;
  const [row, col] = pos;
  const type = piece[1];
  const moves = [];
  const inB = (r,c) => r>=0 && r<size && c>=0 && c<size;
  const isBlock = (r,c) => blocks.some(([br,bc]) => br===r && bc===c);
  const add = (r,c) => { if (inB(r,c) && !isBlock(r,c)) moves.push([r,c]); };
  const slide = (dr,dc) => { let r=row+dr,c=col+dc; while(inB(r,c)&&!isBlock(r,c)) { moves.push([r,c]); r+=dr; c+=dc; } };

  if (type==='N') { for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(row+dr,col+dc); }
  else if (type==='B') { for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,dc); }
  else if (type==='R') { for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  else if (type==='Q') { for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  return moves;
}

function renderBomb() {
  const bm = state.bm;
  const size = bm.size;
  const [pr,pc] = bm.pos;
  const moves = bm.clear || bm.failed ? [] : getBombMoves(bm);

  let cells = '';
  for (let r=0; r<size; r++) {
    for (let c=0; c<size; c++) {
      const isLight = (r+c)%2===0;
      let cls = 'board-cell '+(isLight?'light':'dark');
      let content = '';

      if (bm.blocks.some(([br,bc])=>br===r&&bc===c)) {
        cls+=' block-cell'; content='<span class="block-mark">✕</span>';
      }

      const bomb = bm.bombs.find(b=>b.pos[0]===r&&b.pos[1]===c&&!b.defused);
      if (bomb) {
        cls += bomb.timer <= 2 ? ' bomb-urgent' : ' bomb-cell';
        content = `<span class="bomb-icon">💣<span class="bomb-timer">${bomb.timer}</span></span>`;
      }

      const defused = bm.bombs.find(b=>b.pos[0]===r&&b.pos[1]===c&&b.defused);
      if (defused) { content='<span class="bomb-defused">✓</span>'; }

      if (r===pr&&c===pc) { cls+=' selected'; content=getPieceSVG(bm.piece,36); }
      if (moves.some(([mr,mc])=>mr===r&&mc===c)) cls+=' move-hint';
      cells+=`<div class="${cls}" onclick="bombClick(${r},${c})">${content}</div>`;
    }
  }

  let msg;
  if (bm.clear) msg=`<div class="status-msg success">${t('bombClear')}</div>`;
  else if (bm.failed) msg=`<div class="status-msg fail">${t('bombExploded')}</div>`;
  else msg=`<div class="status-msg">${t('bombDesc')}</div>`;

  const remaining = bm.bombs.filter(b=>!b.defused);
  const minTimer = remaining.length > 0 ? Math.min(...remaining.map(b=>b.timer)) : 0;
  const info=`<div class="mission-info">
    <div class="mission-speech">💣 ×${remaining.length}</div>
    <div class="move-counter">${remaining.length > 0 ? t('bombTimer')+': '+minTimer : '✓'}</div>
  </div>`;

  const actions=(!bm.clear&&!bm.failed)?`<div class="mission-actions">
    <button class="icon-btn hint-btn" onclick="bombHint()">💡 ${t('hintBtn')}</button>
    <button class="icon-btn reset-btn" onclick="goBomb(${bm.levelIdx})">🔄 ${t('resetBtn')}</button>
  </div>`:'';

  const retryBtn=bm.failed?`<button class="action-btn" onclick="goBomb(${bm.levelIdx})">${t('missionRetryBtn')}</button>`:'';
  const nextBtn=bm.clear&&bm.levelIdx<BOMB_LEVELS.length-1?`<button class="action-btn green" onclick="goBomb(${bm.levelIdx+1})">${t('btnNext')}</button>`:'';

  document.getElementById('screen-mini').innerHTML=`
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="goMiniMenu()">← ${t('btnBack')}</button>
        <h2>${t('bombTitle')} Lv.${bm.levelIdx+1}</h2>
      </div>
      ${msg} ${info}
      <div class="chess-board" style="grid-template-columns:repeat(${size},1fr)">${cells}</div>
      ${actions} ${retryBtn} ${nextBtn}
    </div>`;
}

function bombClick(r,c) {
  if (state.animating) return;
  const bm=state.bm;
  if (bm.clear||bm.failed) return;
  const moves=getBombMoves(bm);
  if (!moves.some(([mr,mc])=>mr===r&&mc===c)) return;

  const [pr,pc]=bm.pos;
  const boardEl=document.querySelector('#screen-mini .chess-board');
  bm.pos=[r,c];
  bm.moves++;

  animateMove(boardEl,pr,pc,r,c,bm.piece,()=>{
    // 폭탄 해제
    const bomb=bm.bombs.find(b=>b.pos[0]===r&&b.pos[1]===c&&!b.defused);
    if (bomb) bomb.defused=true;

    // 타이머 감소
    for (const b of bm.bombs) { if (!b.defused) b.timer--; }

    // 폭발 체크
    if (bm.bombs.some(b=>!b.defused&&b.timer<=0)) { bm.failed=true; }
    else if (bm.bombs.every(b=>b.defused)) { bm.clear=true; saveMiniGameStars('bomb', bm.levelIdx||0, bm.moves<=bm.bombs.length?3:bm.moves<=bm.bombs.length+2?2:1); spawnParticles(); }

    renderBomb();
  },bm.size);
}

function bombHint() {
  const bm=state.bm;
  const remaining=bm.bombs.filter(b=>!b.defused);
  if (remaining.length===0) return;
  remaining.sort((a,b)=>a.timer-b.timer);
  const urgent=remaining[0];
  const boardEl=document.querySelector('#screen-mini .chess-board');
  showHintArrow(boardEl, bm.pos[0], bm.pos[1], urgent.pos[0], urgent.pos[1], bm.size, t('bombHint') + ' (' + urgent.timer + ')');
}
