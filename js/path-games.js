// Shared movement for collection and limited-move route challenges.
function pathGameMoves(piece,pos,size,blocks=[],occupied=[]) {
  const [row,col]=pos,moves=[],type=piece[1];
  const blocked=(r,c)=>blocks.some(([br,bc])=>r===br&&c===bc)||occupied.some(([er,ec])=>r===er&&c===ec);
  const inside=(r,c)=>r>=0&&r<size&&c>=0&&c<size;
  if(type==='N'){
    for(const [dr,dc]of KNIGHT_DELTAS){const r=row+dr,c=col+dc;if(inside(r,c)&&!blocked(r,c))moves.push([r,c]);}
  }else{
    const dirs=type==='R'?[[1,0],[-1,0],[0,1],[0,-1]]:type==='B'?[[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    for(const [dr,dc]of dirs)for(let r=row+dr,c=col+dc;inside(r,c)&&!blocked(r,c);r+=dr,c+=dc)moves.push([r,c]);
  }
  return moves;
}
function movementNotice(piece){return ({N:'나이트는 두 칸, 옆으로 한 칸 뛰어요. 점이 있는 곳을 찾아봐요.',B:'비숍은 대각선으로 가요. 막힌 길은 돌아가요.',R:'룩은 가로와 세로로 가요. 말이나 상자를 뛰어넘을 수 없어요.',Q:'퀸은 가로·세로·대각선으로 가요. 막힌 길은 돌아가요.'})[piece[1]]||'점이 있는 칸으로 움직여요.';}
