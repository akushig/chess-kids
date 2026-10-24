// Read-only content audit. Run from any directory: node docs/product-review/evidence/audit.cjs
// DOM/animation stubs exercise shipped logic, not browser layout or touch behavior.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const storage = new Map(), elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, { innerHTML: '', classList: { add(){}, remove(){} } });
  return elements.get(id);
};
const context = vm.createContext({
  console, setTimeout: () => 0, clearTimeout(){},
  document: { addEventListener(){}, querySelectorAll: () => [], getElementById: element, querySelector: () => null },
  localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) },
  navigator: {}, getPieceSVG: p => p,
});
const files = ['i18n','chess','chess-ai','missions','app-core','app-adventure','app-puzzle','mini-knight-solver','mini-knight-tour','mini-collector','mini-bomb','mini-defense','mini-survival'];
const hashes = {};
for (const name of files) {
  const source = fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8');
  hashes[name] = crypto.createHash('sha256').update(source).digest('hex');
  vm.runInContext(source, context, { filename: name + '.js' });
}
vm.runInContext('animateMove = (el, fr, fc, tr, tc, p, cb) => cb(); spawnParticles = () => {};', context);
const result = vm.runInContext(`(() => {
  const missions = [];
  for (const [piece, levels] of Object.entries(MISSIONS)) for (let i=0; i<levels.length; i++) {
    const m = levels[i]; goMissionPlay(piece,i);
    const solution = findMissionSolvePath();
    const valid = getMissionValidMoves(state.missionBoard,...m.start,m);
    const safe = valid.filter(([r,c]) => {
      const b=state.missionBoard.map(row=>[...row]); b[r][c]=m.piece; b[m.start[0]][m.start[1]]=null;
      return !isSquareAttacked(b,r,c,'b',m);
    });
    const overlaps = m.blocks.filter(([r,c]) => state.missionBoard[r][c]);
    missions.push({ id:piece+'-'+(i+1), type:m.type, statedMin:m.minMoves,
      actualMin:solution ? solution.length-1 : null, path:solution, initialMoves:valid.length,
      safeFirstMoves:m.type==='escape'?safe:undefined,
      staticHintLegal:valid.some(([r,c])=>r===m.hint[2]&&c===m.hint[3]), overlaps });
  }
  // Exercise the silent failure transition and its rendered recovery controls.
  goMissionPlay('R',5); missionClick(3,4);
  const rookFailure = { failed:state.missionFailed, solved:state.missionSolved,
    controls:document.getElementById('screen-learn').innerHTML.match(/onclick="[^"]+"/g),
    html:document.getElementById('screen-learn').innerHTML };
  const fresh = puzzle => { const g=new ChessGame(); g.board=puzzle.board.map(r=>[...r]); g.turn=puzzle.turn; return g; };
  const allMoves = g => { const a=[]; for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(g.color(g.board[r][c])===g.turn)
    for(const [tr,tc] of g.legalMoves(r,c))a.push([r,c,tr,tc]); return a; };
  const copy = g => Object.assign(new ChessGame(), JSON.parse(JSON.stringify(g)));
  const legal = (g,m) => !!g.board[m[0]][m[1]] && g.color(g.board[m[0]][m[1]])===g.turn && g.legalMoves(m[0],m[1]).some(([r,c])=>r===m[2]&&c===m[3]);
  const puzzles = PUZZLES.map((p,i) => {
    const g=fresh(p), first=p.solution[0];
    const out={id:'L'+p.level+'-'+(i%3+1), index:i, type:p.type, board:p.board, turn:p.turn, solution:p.solution, firstLegal:legal(g,first)};
    if (!out.firstLegal) return out;
    g.move(...first); out.afterFirst=g.status;
    if(p.type==='fork') out.attackedTargets=g.rawMoves(g.board,first[2],first[3],null).filter(([r,c])=>g.board[r][c]?.[0]==='b').map(([r,c])=>({square:[r,c],piece:g.board[r][c]}));
    if(p.solution.length>1) out.replies=allMoves(g).map(reply=>{
      const b=copy(g); b.move(...reply); const second=p.solution[1]; const ok=legal(b,second);
      if(ok)b.move(...second);
      return {reply,secondLegal:ok,afterSecond:ok?b.status:null};
    });
    return out;
  });
  const collector=COLLECTOR_LEVELS.map((lv,i)=>{goCollector(i);const p=findCollectorSolvePath();return {level:i+1,turns:lv.turns,shortest:p?p.length-1:null,path:p};});
  const bomb=BOMB_LEVELS.map((lv,i)=>{goBomb(i);const p=findBombSolvePath();return {level:i+1,shortest:p?p.length-1:null,path:p,threeStarMaxMoves:lv.bombs.length};});
  // Raw move maps treat empty pawn diagonals incorrectly, but check simulation occupies the king square.
  const attackGame=new ChessGame(); attackGame.board=Array.from({length:8},()=>Array(8).fill(null));
  attackGame.board[3][3]='bP'; attackGame.board[7][7]='wK'; attackGame.board[0][0]='bK';
  const pawnAttack={emptyDiagonal:attackGame.isAttacked(attackGame.board,4,4,'b'),emptyForward:attackGame.isAttacked(attackGame.board,4,3,'b')};
  const knightTours=KNIGHT_TOUR_LEVELS.map((lv,i)=>{
    goKnightTour(i); const before=JSON.stringify(state.kt.board);
    const found=ktFindPath(state.kt.board,lv.size,state.kt.pos,KT_NODE_LIMIT);
    const path=found.path;
    const valid=!!path && path.length===lv.size*lv.size && new Set(path.map(p=>p.join(','))).size===path.length && path.every((p,j)=>j===0 || (Math.abs(p[0]-path[j-1][0])*Math.abs(p[1]-path[j-1][1])===2));
    return {size:lv.size,validCompletion:valid,inputUnchanged:before===JSON.stringify(state.kt.board),timeout:!!found.timeout};
  });
  // Replay the computed routes through actual click handlers, with animation callbacks run synchronously.
  const replays=[];
  for(const entry of missions){const [piece,n]=entry.id.split('-');goMissionPlay(piece,Number(n)-1);for(const [r,c] of entry.path.slice(1))missionClick(r,c);replays.push({id:entry.id,solved:state.missionSolved});}
  for(const entry of collector){goCollector(entry.level-1);for(const [r,c] of entry.path.slice(1))collectorClick(r,c);replays.push({id:'collector-'+entry.level,solved:state.cl.clear,stars:getMiniGameProgress()['collector_'+(entry.level-1)]});}
  for(const entry of bomb){goBomb(entry.level-1);for(const [r,c] of entry.path.slice(1))bombClick(r,c);replays.push({id:'bomb-'+entry.level,solved:state.bm.clear,stars:getMiniGameProgress()['bomb_'+(entry.level-1)]});}
  return {missions,rookFailure,puzzles,collector,bomb,pawnAttack,knightTours,replays};
})()`, context, { timeout: 60000 });
console.log(JSON.stringify({ note:'Current shipped rules; not independent certification of standard chess. Coordinates are zero-based row/column.', hashes, ...result },null,2));
