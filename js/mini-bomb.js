// ===== 미니게임 4: 폭탄 해제 =====
// 기물로 폭탄 칸에 도달해서 해제

const BOMB_LEVELS = [
  { id:'bomb-rook-one-v1', piece:'wR', size:6, bombs:[{pos:[0,5],timer:5}], blocks:[], name:'룩' },
  { id:'bomb-rook-two-v1', piece:'wR', size:6, bombs:[{pos:[0,5],timer:4},{pos:[5,5],timer:6}], blocks:[[3,0]], name:'룩' },
  { id:'bomb-knight-v1', piece:'wN', size:6, bombs:[{pos:[1,2],timer:4},{pos:[3,4],timer:6}], blocks:[], name:'나이트' },
  { id:'bomb-bishop-v1', piece:'wB', size:6, bombs:[{pos:[0,1],timer:4},{pos:[4,5],timer:5},{pos:[2,3],timer:7}], blocks:[], name:'비숍' },
  { id:'bomb-queen-v1', piece:'wQ', size:6, bombs:[{pos:[0,0],timer:3},{pos:[0,5],timer:4},{pos:[5,5],timer:5},{pos:[3,1],timer:6}], blocks:[[2,3],[3,3]], name:'퀸' },
];

function goBomb(levelIdx,challenge=true) {
  beginActivity('bomb',{levelIdx,id:BOMB_LEVELS[levelIdx||0].id,challenge});
  const lv = BOMB_LEVELS[levelIdx || 0];
  const size = lv.size;
  state.bm = {
    levelIdx: levelIdx || 0,
    challenge,notice:'',
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

function getBombMoves(bm) { return pathGameMoves(bm.piece,bm.pos,bm.size,bm.blocks); }

function renderBomb() {
  saveActiveSession();
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
        cls += bm.challenge && bomb.timer <= 2 ? ' bomb-urgent' : ' bomb-cell';
        content = `<span class="bomb-icon">💣<span class="bomb-timer">${bm.challenge?bomb.timer:'·'}</span></span>`;
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
  else msg=`<div class="status-msg">${bm.notice || (bm.challenge?'한 번 움직이면 남은 이동 수가 줄어요. 먼저 갈 곳을 골라요.':'이동 수 제한 없이 해제해봐요.')}</div>`;

  const remaining = bm.bombs.filter(b=>!b.defused);
  const minTimer = remaining.length > 0 ? Math.min(...remaining.map(b=>b.timer)) : 0;
  const info=`<div class="mission-info">
    <div class="mission-speech">💣 ×${remaining.length}</div>
    <div class="move-counter">${remaining.length > 0 ? bm.challenge?'남은 이동 '+minTimer+'번':'이동 수 제한 없음' : '✓'}</div>
  </div>`;

  const actions=(!bm.clear&&!bm.failed)?`<div class="mission-actions">
    <button class="icon-btn hint-btn" onclick="bombHint()">💡 ${t('hintBtn')}</button>
    <button class="icon-btn reset-btn" onclick="goBomb(${bm.levelIdx},${bm.challenge})">🔄 ${t('resetBtn')}</button>
  </div>`:'';

  const retryBtn=bm.failed?`<button class="action-btn" onclick="goBomb(${bm.levelIdx},${bm.challenge})">${t('missionRetryBtn')}</button>`:'';
  const nextBtn=bm.clear&&bm.levelIdx<BOMB_LEVELS.length-1?`<button class="action-btn green" onclick="goBomb(${bm.levelIdx+1},${bm.challenge})">${t('btnNext')}</button>`:'';

  document.getElementById('screen-mini').innerHTML=`
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="goMiniMenu()">← ${t('btnBack')}</button>
        <h2>${t('bombTitle')} Lv.${bm.levelIdx+1}</h2>
      </div>
      ${msg} ${info}<button class="play-chip" onclick="goBomb(${bm.levelIdx},${!bm.challenge})">${bm.challenge?'느긋하게 연습하기':'이동 수 도전하기'}</button>
      <div class="chess-board" style="grid-template-columns:repeat(${size},1fr)">${cells}</div>
      ${undoButton()} ${actions} ${retryBtn} ${nextBtn} ${bm.clear?finishLinks('goCollector(0)','별 모으러 가기'):''}
    </div>`;
}

function bombClick(r,c) {
  if (state.animating) return;
  const bm=state.bm;
  if (bm.clear||bm.failed) return;
  const moves=getBombMoves(bm);
  if (!moves.some(([mr,mc])=>mr===r&&mc===c)){bm.notice=movementNotice(bm.piece);renderBomb();return;}

  rememberAction();
  const [pr,pc]=bm.pos;
  const boardEl=document.querySelector('#screen-mini .chess-board');
  bm.notice='';bm.pos=[r,c];
  bm.moves++;


    // 폭탄 해제
    const bomb=bm.bombs.find(b=>b.pos[0]===r&&b.pos[1]===c&&!b.defused);
    if (bomb) bomb.defused=true;

    // 타이머 감소
    for (const b of bm.bombs) { if (!b.defused) b.timer--; }

    // 폭발 체크
    if (bm.challenge&&bm.bombs.some(b=>!b.defused&&b.timer<=0)) { bm.failed=true; }
    else if (bm.bombs.every(b=>b.defused)) { bm.clear=true; saveMiniGameStars('bomb', bm.levelIdx||0, calculateStars(bm.moves,[2,2,6,3,5][bm.levelIdx])); spawnParticles(); }


  saveActiveSession();
  animateMove(boardEl,pr,pc,r,c,bm.piece,()=>renderBomb(),bm.size);
}

// BFS로 모든 폭탄 해제 경로 탐색
function findBombSolvePath() {
  const bm = state.bm;
  const bombs = bm.bombs.map((b, i) => ({...b, idx: i})).filter(b => !b.defused);
  if (bombs.length === 0) return [];

  // 상태: (row, col, defusedMask)
  const queue = [[bm.pos[0], bm.pos[1], 0, 0, [bm.pos]]];
  const visited = new Set();
  visited.add(bm.pos[0] + ',' + bm.pos[1] + ',0');

  while (queue.length > 0) {
    const [row, col, mask, moveCount, path] = queue.shift();
    const tempBm = {...bm, pos: [row, col]};
    const moves = getBombMoves(tempBm);

    for (const [r, c] of moves) {
      let newMask = mask;
      const mc = moveCount + 1;
      for (let i = 0; i < bombs.length; i++) {
        if (!(mask & (1 << i)) && bombs[i].pos[0] === r && bombs[i].pos[1] === c) newMask |= (1 << i);
      }
      // 폭발 체크
      let exploded = false;
      for (let i = 0; i < bombs.length; i++) {
        if (bm.challenge && !(newMask & (1 << i)) && bombs[i].timer - mc <= 0) { exploded = true; break; }
      }
      if (exploded) continue;

      const key = r + ',' + c + ',' + newMask;
      if (visited.has(key)) continue;
      visited.add(key);

      const newPath = [...path, [r, c]];
      if (newMask === (1 << bombs.length) - 1) return newPath;
      queue.push([r, c, newMask, mc, newPath]);
    }
  }
  return null;
}

function bombHint() {
  const bm = state.bm;
  if (bm.clear || bm.failed) return;
  const remaining = bm.bombs.filter(b => !b.defused);
  if (remaining.length === 0) return;
  const boardEl = document.querySelector('#screen-mini .chess-board');
  if (!boardEl) return;

  const path = findBombSolvePath();
  if (!path) {
    const speech = document.querySelector('.mission-speech');
    if (speech) {
      speech.innerHTML = '⚠️ ' + t('bombUnsolvable');
      speech.classList.add('hint-active', 'hint-unsolvable');
    }
    return;
  }
  showHintArrow(boardEl,...path[0],...path[1],bm.size,'이 한 걸음부터 계획해봐요.');
}
