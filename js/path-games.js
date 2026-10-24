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
