// ===== 미니게임 5: 체스 디펜스 =====
// 적 폰이 전진, 끝줄 도달 전에 내 기물로 잡기

const DEFENSE_LEVELS = [
  { piece:'wR', size:6, waves:[[{pos:[0,1],p:'bP'},{pos:[0,3],p:'bP'},{pos:[0,5],p:'bP'}]], name:'룩' },
  { piece:'wR', size:6, waves:[[{pos:[0,0],p:'bP'},{pos:[0,2],p:'bP'},{pos:[0,4],p:'bP'}],[{pos:[0,1],p:'bP'},{pos:[0,3],p:'bP'},{pos:[0,5],p:'bP'}]], name:'룩' },
  { piece:'wQ', size:6, waves:[[{pos:[0,0],p:'bP'},{pos:[0,2],p:'bP'},{pos:[0,4],p:'bP'}],[{pos:[0,1],p:'bP'},{pos:[0,3],p:'bP'},{pos:[0,5],p:'bP'}],[{pos:[0,0],p:'bP'},{pos:[0,2],p:'bN'},{pos:[0,5],p:'bP'}]], name:'퀸' },
  { piece:'wQ', size:6, waves:[[{pos:[0,0],p:'bP'},{pos:[0,1],p:'bP'},{pos:[0,3],p:'bP'},{pos:[0,5],p:'bP'}],[{pos:[0,0],p:'bP'},{pos:[0,2],p:'bN'},{pos:[0,4],p:'bP'}],[{pos:[0,1],p:'bP'},{pos:[0,3],p:'bR'},{pos:[0,5],p:'bP'}]], name:'퀸' },
];

function goDefense(levelIdx) {
  const lv = DEFENSE_LEVELS[levelIdx || 0];
  const size = lv.size;
  state.df = {
    levelIdx: levelIdx || 0,
    size: size,
    piece: lv.piece,
    pos: [size - 1, Math.floor(size / 2)],
    enemies: [],
    waves: lv.waves.map(w => w.map(e => ({pos:[...e.pos], p:e.p}))),
    waveIdx: 0,
    turn: 0,
    breached: 0,
    maxBreach: 2,
    clear: false,
    failed: false,
  };
  // 첫 웨이브 배치
  defenseSpawnWave(state.df);
  showScreen('mini');
  renderDefense();
}

function defenseSpawnWave(df) {
  if (df.waveIdx >= df.waves.length) return;
  const wave = df.waves[df.waveIdx];
  for (const e of wave) {
    df.enemies.push({pos:[...e.pos], p:e.p});
  }
  df.waveIdx++;
}

function getDefenseMoves(df) {
  const {pos, size, piece, enemies} = df;
  const [row, col] = pos;
  const type = piece[1];
  const moves = [];
  const inB = (r,c) => r>=0 && r<size && c>=0 && c<size;
  const slide = (dr,dc) => {
    let r=row+dr, c=col+dc;
    while(inB(r,c)) {
      moves.push([r,c]);
      if (enemies.some(e=>e.pos[0]===r&&e.pos[1]===c)) break;
      r+=dr; c+=dc;
    }
  };
  const add = (r,c) => { if (inB(r,c)) moves.push([r,c]); };

  if (type==='R') { for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  else if (type==='Q') { for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  else if (type==='N') { for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(row+dr,col+dc); }
  return moves;
}

function renderDefense() {
  const df = state.df;
  const size = df.size;
  const [pr,pc] = df.pos;
  const moves = df.clear || df.failed ? [] : getDefenseMoves(df);

  let cells = '';
  for (let r=0; r<size; r++) {
    for (let c=0; c<size; c++) {
      const isLight = (r+c)%2===0;
      let cls = 'board-cell '+(isLight?'light':'dark');
      let content = '';

      // 끝줄 표시
      if (r === size - 1) cls += ' defense-endline';

      const enemy = df.enemies.find(e=>e.pos[0]===r&&e.pos[1]===c);
      if (enemy) { content = getPieceSVG(enemy.p, 36); cls += ' enemy-cell'; }
      if (r===pr && c===pc) { cls+=' selected'; content=getPieceSVG(df.piece,36); }
      if (moves.some(([mr,mc])=>mr===r&&mc===c)) cls+=' move-hint';
      cells+=`<div class="${cls}" onclick="defenseClick(${r},${c})">${content}</div>`;
    }
  }

  let msg;
  if (df.clear) msg=`<div class="status-msg success">${t('defenseClear')}</div>`;
  else if (df.failed) msg=`<div class="status-msg fail">${t('defenseBreached')}</div>`;
  else msg=`<div class="status-msg">${t('defenseDesc')}</div>`;

  const totalWaves = df.waves.length;
  const info=`<div class="mission-info">
    <div class="mission-speech">${t('defenseWave')}: ${Math.min(df.waveIdx, totalWaves)}/${totalWaves}</div>
    <div class="move-counter">👾 ×${df.enemies.length}</div>
  </div>`;

  const actions=(!df.clear&&!df.failed)?`<div class="mission-actions">
    <button class="icon-btn hint-btn" onclick="defenseHint()">💡 ${t('hintBtn')}</button>
    <button class="icon-btn reset-btn" onclick="goDefense(${df.levelIdx})">🔄 ${t('resetBtn')}</button>
  </div>`:'';

  const retryBtn=df.failed?`<button class="action-btn" onclick="goDefense(${df.levelIdx})">${t('missionRetryBtn')}</button>`:'';
  const nextBtn=df.clear&&df.levelIdx<DEFENSE_LEVELS.length-1?`<button class="action-btn green" onclick="goDefense(${df.levelIdx+1})">${t('btnNext')}</button>`:'';

  document.getElementById('screen-mini').innerHTML=`
    <div class="screen-wrap">
      <div class="screen-header">
        <button class="back-btn" onclick="goMiniMenu()">← ${t('btnBack')}</button>
        <h2>${t('defenseTitle')} Lv.${df.levelIdx+1}</h2>
      </div>
      ${msg} ${info}
      <div class="chess-board" style="grid-template-columns:repeat(${size},1fr)">${cells}</div>
      ${actions} ${retryBtn} ${nextBtn}
    </div>`;
}

function defenseClick(r,c) {
  if (state.animating) return;
  const df = state.df;
  if (df.clear || df.failed) return;
  const moves = getDefenseMoves(df);
  if (!moves.some(([mr,mc])=>mr===r&&mc===c)) return;

  const [pr,pc] = df.pos;
  const boardEl = document.querySelector('#screen-mini .chess-board');
  df.pos = [r,c];

  // 적 잡기
  const ei = df.enemies.findIndex(e=>e.pos[0]===r&&e.pos[1]===c);
  if (ei >= 0) df.enemies.splice(ei, 1);

  df.turn++;

  animateMove(boardEl, pr, pc, r, c, df.piece, () => {
    // 적 전진 (폰은 1칸, 나이트는 랜덤, 룩은 1칸)
    for (const e of df.enemies) {
      if (e.p[1] === 'P') {
        e.pos[0]++;
      } else if (e.p[1] === 'N') {
        // 나이트: 앞으로 가는 L자 이동
        const knightMoves = [[1,2],[1,-2],[2,1],[2,-1]];
        const valid = knightMoves.filter(([dr,dc]) => {
          const nr=e.pos[0]+dr, nc=e.pos[1]+dc;
          return nr>=0 && nr<df.size && nc>=0 && nc<df.size;
        });
        if (valid.length > 0) {
          const [dr,dc] = valid[Math.floor(Math.random()*valid.length)];
          e.pos[0]+=dr; e.pos[1]+=dc;
        }
      } else if (e.p[1] === 'R') {
        e.pos[0]++;
      }
    }

    // 끝줄 도달 체크
    const breaching = df.enemies.filter(e => e.pos[0] >= df.size);
    df.breached += breaching.length;
    df.enemies = df.enemies.filter(e => e.pos[0] < df.size);

    if (df.breached >= df.maxBreach) {
      df.failed = true;
    } else if (df.enemies.length === 0) {
      // 다음 웨이브 또는 클리어
      if (df.waveIdx < df.waves.length) {
        defenseSpawnWave(df);
      } else {
        df.clear = true;
        saveMiniGameStars('defense', df.levelIdx||0, df.breached===0?3:df.breached<=1?2:1);
        spawnParticles();
      }
    }

    renderDefense();
  }, df.size);
}

function defenseHint() {
  const df = state.df;
  if (df.enemies.length === 0) return;
  let closest = df.enemies[0];
  for (const e of df.enemies) {
    if (e.pos[0] > closest.pos[0]) closest = e;
  }
  const boardEl = document.querySelector('#screen-mini .chess-board');
  showHintArrow(boardEl, df.pos[0], df.pos[1], closest.pos[0], closest.pos[1], df.size, t('defenseHint'));
}
