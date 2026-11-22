// One generated texture, 12 pieces × 3 poses. SVG is only the clipping viewport.
const ROYAL_COLUMNS = ['K','Q','R','B','N','P'];
const SPRITE_SKINS = {royal:{atlas:'icons/skins/royal-classic/atlas.webp',effect:['#ffe6a1','#d3dcf0','✧'],motion:'classic'}};
function royalPieceSVG(piece, size, pose = 'idle', skinName = 'royal') {
  const col = ROYAL_COLUMNS.indexOf(piece[1]);
  const row = (piece[0] === 'b' ? 1 : 0) + ({idle:0,attack:2,hit:4}[pose] || 0);
  return `<svg class="royal-piece" data-sprite-skin="${skinName}" data-royal-piece="${piece}" data-pose="${pose}" viewBox="${col*256} ${row*256} 256 256" width="${size}" height="${size}" overflow="hidden"><image href="${SPRITE_SKINS[skinName].atlas}" width="1536" height="1536"/></svg>`;
}
SKINS.royal = Object.fromEntries(['w','b'].flatMap(side => ROYAL_COLUMNS.map(type => [side+type, size => royalPieceSVG(side+type,size)])));

function royalSetPose(svg, pose) {
  if (!svg?.dataset.royalPiece) return;
  const piece = svg.dataset.royalPiece;
  const row = (piece[0] === 'b' ? 1 : 0) + ({idle:0,attack:2,hit:4}[pose] || 0);
  svg.setAttribute('viewBox',`${ROYAL_COLUMNS.indexOf(piece[1])*256} ${row*256} 256 256`);
  svg.dataset.pose = pose;
}

// Cancel pending phases on navigation/undo, including both pieces in castling.
const royalActivities = new Set();
function cancelRoyalAnimations() {
  for (const activity of [...royalActivities]) activity.cancel();
}

function royalOpenPreview() {
  showActivityDialog(t(SKIN_META[currentSkin].nameKey)+' · 말 모션',`<p>나이트가 점프해서 폰을 잡아요.</p><div id="royal-demo" class="chess-board royal-demo-board" role="img" aria-label="나이트의 이동·공격과 폰의 피격 모션"></div><button class="play-chip" onclick="royalPlayPreview()">▶ 다시 보기</button>`,[{label:'닫기',action:cancelRoyalAnimations}],'royal-preview-overlay',cancelRoyalAnimations);
  royalPlayPreview();
}
function royalPlayPreview() {
  const board=document.getElementById('royal-demo');if(!board)return;
  cancelRoyalAnimations();
  function draw(finished) {
    board.innerHTML=Array.from({length:16},(_,i)=>{
      const piece=i===(finished?5:12)?'wN':!finished&&i===5?'bP':null;
      return `<div class="board-cell ${(Math.floor(i/4)+i%4)%2?'dark':'light'}">${piece?getPieceSVGForSkin(currentSkin,piece,56).replace('<svg ','<svg data-piece="'+piece+'" '):''}</div>`;
    }).join('');
  }
  draw(false);
  // Use the same animation pipeline as actual gameplay, including motion preferences.
  animateMove(board,3,0,1,1,'wN',()=>draw(true),4,{capture:{row:1,col:1}});
}

function animateRoyalMove(board, fr, fc, tr, tc, piece, callback, cols, options = {}) {
  const skinName=currentSkin,theme=SPRITE_SKINS[skinName];
  const epoch = screenEpoch, cellSize = board.clientWidth / cols;
  const cells = board.querySelectorAll('.board-cell');
  const origin = cells[fr*cols+fc]?.querySelector('svg');
  // Other game modes infer captures from the pre-rendered board.
  const target = options.capture === false ? null : options.capture
    ? cells[options.capture.row*cols+options.capture.col]?.querySelector('[data-piece]')
    : cells[tr*cols+tc]?.querySelector('[data-piece]');
  const victim = target?.dataset.piece;
  const capture = victim && victim[0] !== piece[0];
  const ghost = document.createElement('div');
  ghost.className = 'move-anim royal-mover pc-'+piece[0];
  ghost.setAttribute('aria-hidden','true');
  ghost.dataset.motion=theme.motion;
  ghost.style.setProperty('--motion-color',theme.effect[piece[0]==='b'?1:0]);
  ghost.innerHTML = royalPieceSVG(piece,Math.round(cellSize*.88),'idle',skinName);
  Object.assign(ghost.style,{width:cellSize+'px',height:cellSize+'px',left:fc*cellSize+'px',top:fr*cellSize+'px'});
  board.appendChild(ghost);
  const svg = ghost.querySelector('svg'),transients=[ghost];
  const hidden = new Map();
  function hide(el) { if(el&&!hidden.has(el)){hidden.set(el,el.style.visibility);el.style.visibility='hidden';} }
  hide(origin);
  const animations=[],timers=[];let ended=false;
  const activity={cancel:()=>finish(false)};
  royalActivities.add(activity);state.animating=true;
  function finish(complete) {
    if(ended)return;ended=true;
    timers.forEach(clearTimeout);animations.forEach(a=>a.cancel());transients.forEach(el=>el.remove());
    hidden.forEach((value,el)=>{el.style.visibility=value;royalSetPose(el,'idle');});
    royalActivities.delete(activity);
    if(epoch===screenEpoch){state.animating=royalActivities.size>0;if(complete)callback();}
  }
  function later(fn,ms){timers.push(setTimeout(()=>{if(!ended&&epoch===screenEpoch&&board.isConnected)fn();else if(!ended)finish(false);},ms));}
  function play(el,frames,ms,extra={}) {const a=el.animate(frames,{duration:ms,fill:'forwards',easing:'ease-out',...extra});animations.push(a);return a;}
  const dx=(tc-fc)*cellSize,dy=(tr-fr)*cellSize;
  const jump=piece[1]==='N',travel=capture?310:360;
  const up=board.classList.contains('flipped')?1:-1;
  const lift=cellSize*(jump ? .7 : theme.motion==='float' ? .36 : theme.motion==='wave' ? .26 : .17)*up;
  play(ghost,[{transform:'translate(0,0)'},{transform:`translate(${dx*.48}px,${dy*.48+lift}px)`,offset:.48},{transform:`translate(${dx}px,${dy}px)`}],travel);
  play(svg,[{scale:'1 1'},{scale:theme.motion==='fold'?'1.08 .7':theme.motion==='bounce'?'1.12 .88':jump?'1.04 .96':'1.02 .98',offset:.45},{scale:'.94 1.06',offset:.8},{scale:'1 1'}],travel);
  if(capture){
    royalSetPose(svg,'attack');
    later(()=>{
      hide(target);
      const recoil=document.createElement('div');
      recoil.className='move-anim royal-victim pc-'+victim[0];recoil.setAttribute('aria-hidden','true');
      const vr=options.capture?.row??tr,vc=options.capture?.col??tc;
      Object.assign(recoil.style,{width:cellSize+'px',height:cellSize+'px',top:vr*cellSize+'px',left:vc*cellSize+'px'});
      recoil.innerHTML=royalPieceSVG(victim,Math.round(cellSize*.88),'hit',skinName);board.appendChild(recoil);transients.push(recoil);
      const sx=Math.sign(dx||1),sy=Math.sign(dy||-1);
      const impact=document.createElement('span');impact.className='royal-impact';impact.setAttribute('aria-hidden','true');
      impact.style.setProperty('--impact-color',theme.effect[piece[0]==='b'?1:0]);
      impact.style.setProperty('--impact-symbol',JSON.stringify(theme.effect[2]));
      Object.assign(impact.style,{width:cellSize+'px',height:cellSize+'px',top:vr*cellSize+'px',left:vc*cellSize+'px'});board.appendChild(impact);transients.push(impact);
      play(recoil,[{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${sx*cellSize*.17}px,${sy*cellSize*.17}px) scale(.94)`,opacity:1,offset:.3},{transform:`translate(${sx*cellSize*.28}px,${sy*cellSize*.28}px) scale(.3)`,opacity:0}],230);
      play(svg,[{translate:'0 0'},{translate:`${sx*cellSize*.12}px ${sy*cellSize*.12}px`,offset:.35},{translate:'0 0'}],180);
      later(()=>{recoil.remove();royalSetPose(svg,'idle');},235);
    },travel-35);
  }
  const total=capture?travel+250:travel+110;
  later(()=>{royalSetPose(svg,'idle');play(svg,[{scale:'1 1'},{scale:'1.1 .9',offset:.35},{scale:'1 1'}],100);},capture?travel+140:travel);
  // Complete in background tabs too, where animation completion events may pause.
  later(()=>finish(true),total+15);
}
