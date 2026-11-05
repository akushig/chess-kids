// A capture-order puzzle, deliberately separate from standard chess.
const SOLO_PUZZLES = [
  ['첫 잡기',4,[[3,0,'R'],[3,2,'R'],[1,2,'R']]],
  ['대각선 연결',4,[[3,0,'B'],[1,2,'B'],[0,1,'B']]],
  ['모퉁이 돌아서',4,[[3,0,'R'],[3,3,'R'],[0,3,'R'],[0,1,'R']]],
  ['어느 말부터?',4,[[3,0,'R'],[3,2,'B'],[1,0,'R'],[1,2,'B']]],
  ['점프의 순서',5,[[4,0,'N'],[2,1,'N'],[0,0,'N'],[1,2,'N']]],
  ['퀸의 갈림길',4,[[3,0,'Q'],[3,3,'B'],[1,1,'R'],[0,1,'N']]],
  ['남길 말 고르기',5,[[4,0,'R'],[4,4,'B'],[2,2,'Q'],[0,2,'R'],[0,0,'B']]],
  ['긴 점프',5,[[4,0,'N'],[2,1,'N'],[0,0,'N'],[1,2,'N'],[3,3,'N']]],
  ['두 대각선',5,[[4,0,'B'],[2,2,'B'],[0,4,'B'],[0,0,'B'],[4,4,'Q']]],
  ['길을 비워요',5,[[4,0,'R'],[4,2,'R'],[4,4,'B'],[2,2,'Q'],[0,2,'R'],[0,0,'B']]],
  ['점프와 직선',5,[[4,0,'N'],[2,1,'R'],[2,4,'N'],[0,3,'R'],[0,0,'B'],[3,3,'Q']]],
  ['마지막 선택',5,[[4,0,'Q'],[4,4,'B'],[2,2,'R'],[2,0,'N'],[0,1,'Q'],[0,4,'R'],[3,4,'B']]],
].map(([title,size,pieces],i)=>({id:'solo-'+(i+1)+'-v1',title,size,pieces}));
function soloMoves(pieces) {
  const moves=[];
  pieces.forEach(([r,c,type],i)=>pieces.forEach(([tr,tc],j)=>{
    if(i===j)return;
    const dr=tr-r,dc=tc-c,ar=Math.abs(dr),ac=Math.abs(dc);
    if(type==='N'){if(ar*ac===2)moves.push([i,j]);return;}
    if(!(type==='R'&&(dr===0||dc===0)||type==='B'&&ar===ac||type==='Q'&&(dr===0||dc===0||ar===ac)))return;
    const steps=Math.max(ar,ac),sr=Math.sign(dr),sc=Math.sign(dc);
    for(let k=1;k<steps;k++)if(pieces.some(p=>p[0]===r+k*sr&&p[1]===c+k*sc))return;
    moves.push([i,j]);
  }));return moves;
}
function soloAfter(pieces,[from,to]) {
  return pieces.filter((_,i)=>i!==from&&i!==to).map(p=>[...p]).concat([[pieces[to][0],pieces[to][1],pieces[from][2]]]);
}
function soloSolve(pieces,limit=100000) {
  const dead=new Set();let nodes=0,unknown=false;
  function walk(ps){if(ps.length===1)return [];if(++nodes>limit){unknown=true;return null;}
    const key=ps.map(p=>p.join(',')).sort().join('|');if(dead.has(key))return null;
    for(const move of soloMoves(ps)){const rest=walk(soloAfter(ps,move));if(rest)return [[ps[move[0]].slice(0,2),ps[move[1]].slice(0,2)],...rest];if(unknown)return null;}
    dead.add(key);return null;
  }
  const path=walk(pieces);return {path,status:path?'solved':unknown?'unknown':'impossible'};
}
function soloValid(s){
  const p=SOLO_PUZZLES.find(p=>p.id===s?.id);
  return !!p&&s.size===p.size&&Array.isArray(s.pieces)&&s.pieces.length>=1&&s.pieces.length<=p.pieces.length&&s.pieces.every(x=>Array.isArray(x)&&x.length===3&&x.slice(0,2).every(n=>Number.isInteger(n)&&n>=0&&n<p.size)&&['R','B','N','Q'].includes(x[2]))&&new Set(s.pieces.map(x=>x.slice(0,2).join(','))).size===s.pieces.length&&(s.selected===null||Number.isInteger(s.selected)&&s.selected>=0&&s.selected<s.pieces.length)&&s.clear===(s.pieces.length===1);
}
function goSoloMenu(){leaveActivity();showScreen('mini');const done=readData('solo_done',[]);
  document.getElementById('screen-mini').innerHTML=`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goMiniMenu()">← 전체 놀이</button><h2>마지막 한 말</h2></div><p class="section-note">모든 말을 움직일 수 있어요. 한 번에 하나씩 잡아서 마지막 한 말만 남겨요. 같은 색끼리 잡는 별도의 퍼즐이에요.</p>${savedActivityCard('solo')}<div class="content-cards">${SOLO_PUZZLES.map((p,i)=>`<button class="content-card" onclick="openSolo(${i})"><strong>${i+1}. ${p.title}</strong><span>${p.pieces.length}개 → 1개 · ${p.size}×${p.size}${done.includes(p.id)?' · ✓ 완료':''}</span></button>`).join('')}</div></div>`;
}
function openSolo(index){const p=SOLO_PUZZLES[index];if(!p)return;if(activitySaved('solo')?.params.id===p.id)return resumeActivity('solo');requestNewActivity('solo',()=>startSolo(index));}
function startSolo(index){const p=SOLO_PUZZLES[index];if(!p)return;beginActivity('solo',{id:p.id});state.solo={id:p.id,size:p.size,pieces:copyData(p.pieces),selected:null,clear:false};showScreen('mini');renderSolo();}
function renderSolo(){
 const s=state.solo,p=SOLO_PUZZLES.find(p=>p.id===s.id),index=SOLO_PUZZLES.indexOf(p),moves=soloMoves(s.pieces),targets=moves.filter(m=>m[0]===s.selected).map(m=>m[1]);let cells='';
 for(let r=0;r<s.size;r++)for(let c=0;c<s.size;c++){const i=s.pieces.findIndex(x=>x[0]===r&&x[1]===c);cells+=`<div class="board-cell ${(r+c)%2?'dark':'light'}${i>=0&&i===s.selected?' selected':''}${targets.includes(i)?' move-hint':''}" onclick="soloClick(${r},${c})">${i<0?'':getPieceSVG('w'+s.pieces[i][2],40)}</div>`;}
 renderGameScreen('screen-mini',`<div class="screen-wrap"><div class="screen-header"><button class="back-btn" onclick="goSoloMenu()">← 문제 고르기</button><h2>마지막 한 말 ${index+1}</h2></div><div class="status-msg">${s.clear?'✓ 한 말만 남겼어요!':!moves.length?'↶ 잡을 말이 없어요. 되돌려서 다른 순서를 찾아요.':'말을 고르고, 점이 있는 다른 말을 잡아요.'}</div><div class="mission-info"><strong>${p.title}</strong><span>${s.pieces.length}개 → 1개</span></div><div class="chess-board" style="grid-template-columns:repeat(${s.size},1fr)">${cells}</div><div class="mission-actions">${undoButton()}<button class="icon-btn" onclick="soloHint()" ${s.clear?'disabled':''}>💡 한 수 보기</button><button class="icon-btn" onclick="requestNewActivity('solo',()=>startSolo(${index}))">다시 하기</button></div><button class="text-button" onclick="soloRules()">놀이 방법</button>${s.clear?finishLinks(index<11?`openSolo(${index+1})`:'goSoloMenu()',index<11?'다음 문제':'문제 고르기'):''}</div>`);saveActiveSession();
}
function soloRules(){showActivityDialog('마지막 한 말',`<p>이 퍼즐에서는 모든 말을 움직여요. 체스 말의 움직임대로 다른 말을 잡으세요. 빈칸으로만 움직일 수는 없어요.</p><p>대전과 달리 같은 색 말도 잡아요. 체크나 차례는 없고, 한 말만 남으면 성공이에요.</p><p>잡는 순서에 따라 막힐 수 있어요. 되돌리고 다른 말을 골라도 좋아요.</p>`,[{label:'계속하기',action:()=>{}}]);}
function soloClick(r,c){const s=state.solo;if(s.clear)return;const i=s.pieces.findIndex(p=>p[0]===r&&p[1]===c);
 if(i>=0&&s.selected!==null&&soloMoves(s.pieces).some(m=>m[0]===s.selected&&m[1]===i)){rememberAction();s.pieces=soloAfter(s.pieces,[s.selected,i]);s.selected=null;s.clear=s.pieces.length===1;if(s.clear){writeData('solo_done',[...new Set([...readData('solo_done',[]),s.id])]);spawnParticles();}renderSolo();return;}
 s.selected=i>=0?i:null;renderSolo();if(i<0)showGameToast('빈칸으로는 갈 수 없어요. 다른 말을 잡는 놀이예요.','',true);
}
function soloHint(){const result=soloSolve(state.solo.pieces);noteHelp();if(!result.path)return showGameToast(result.status==='unknown'?'아직 끝까지 확인하지 못했어요. 다른 순서를 살펴봐요.':'이 순서로는 한 말까지 줄일 수 없어요. 되돌려서 다른 말을 먼저 잡아봐요.','',true);
 const [from,to]=result.path[0];state.solo.selected=state.solo.pieces.findIndex(p=>p[0]===from[0]&&p[1]===from[1]);renderSolo();showHintArrow(document.querySelector('#screen-mini .chess-board'),...from,...to,state.solo.size,'이 말부터 잡아봐요.');
}
