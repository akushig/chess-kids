// 체스 기물 유니코드
const PIECES = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
};

// 초기 보드 상태
const INIT_BOARD = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR']
];

// Attack maps are independent of legal moves: pawns attack diagonally, even empty squares.
function pieceAttacks(board, fr, fc, tr, tc, blocks = []) {
  const p = board[fr]?.[fc];
  if (!p || (fr === tr && fc === tc)) return false;
  const dr = tr-fr, dc = tc-fc, ar = Math.abs(dr), ac = Math.abs(dc);
  if (p[1] === 'P') return dr === (p[0] === 'w' ? -1 : 1) && ac === 1;
  if (p[1] === 'N') return ar*ac === 2;
  if (p[1] === 'K') return Math.max(ar,ac) === 1;
  const straight = dr === 0 || dc === 0, diagonal = ar === ac;
  if (!((p[1] === 'R' && straight) || (p[1] === 'B' && diagonal) || (p[1] === 'Q' && (straight || diagonal)))) return false;
  const sr = Math.sign(dr), sc = Math.sign(dc);
  for (let r=fr+sr,c=fc+sc; r!==tr || c!==tc; r+=sr,c+=sc) {
    if (board[r]?.[c] || blocks.some(([br,bc])=>br===r&&bc===c)) return false;
  }
  return true;
}

function boardFromFEN(fen) {
  return fen.split(' ')[0].split('/').map(row => [...row].flatMap(p =>
    /[1-8]/.test(p) ? Array(Number(p)).fill(null) : [(p === p.toUpperCase() ? 'w' : 'b') + p.toUpperCase()]));
}

class ChessGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = INIT_BOARD.map(r => [...r]);
    this.turn = 'w';
    this.selected = null;
    this.validMoves = [];
    this.status = 'playing'; // playing | check | checkmate | draw
    this.drawReason = null;  // 비긴 이유: stalemate | kings | material | repetition | fifty
    this.enPassant = null;
    this.castling = { wK: true, wR_a: true, wR_h: true, bK: true, bR_a: true, bR_h: true };
    this.captured = { w: [], b: [] }; // w: 백이 잡은 기물, b: 흑이 잡은 기물
    this.halfmoveClock = 0;  // 마지막으로 기물을 잡거나 폰을 움직인 뒤 둔 수 (50수 규칙)
    this.positionCounts = {}; // 같은 장면이 나온 횟수 (3번 반복 규칙)
    this.recordPosition();
  }

  castlingKey() {
    let rights='';for(const [color,k,q]of [['w','K','Q'],['b','k','q']]){
      if(this.castling[color+'K']&&this.castling[color+'R_h'])rights+=k;
      if(this.castling[color+'K']&&this.castling[color+'R_a'])rights+=q;
    }return rights||'-';
  }
  effectiveEnPassant() {
    if(!this.enPassant)return '-';
    const [r,c]=this.enPassant,from=r+(this.turn==='w'?1:-1);
    for(const fc of [c-1,c+1])if(this.board[from]?.[fc]===this.turn+'P'&&!this.moveLeavesCheck(from,fc,r,c))return ''+r+c;
    return '-';
  }
  positionKey() {
    return this.board.map(r=>r.map(p=>p||'--').join('')).join('/')+'/'+this.turn+this.castlingKey()+'/'+this.effectiveEnPassant();
  }

  recordPosition() {
    const key = this.positionKey();
    this.positionCounts[key] = (this.positionCounts[key] || 0) + 1;
  }

  color(piece) { return piece ? piece[0] : null; }
  type(piece) { return piece ? piece[1] : null; }

  inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

  // 특정 색의 킹 위치
  findKing(color) {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (this.board[r][c] === color + 'K') return [r, c];
    return null;
  }

  // 해당 칸이 color에게 공격받는지
  attackers(board, row, col, byColor) {
    const result = [];
    for (let r=0;r<8;r++) for (let c=0;c<8;c++)
      if (board[r][c]?.[0] === byColor && pieceAttacks(board,r,c,row,col)) result.push([r,c]);
    return result;
  }

  isAttacked(board, row, col, byColor) {
    return this.attackers(board,row,col,byColor).length > 0;
  }

  clone() { return Object.assign(new ChessGame(), JSON.parse(JSON.stringify(this))); }

  static fromFEN(fen) {
    const [placement,turn,rights='-',ep='-',half='0']=fen.split(' '),g=new ChessGame();
    g.board=boardFromFEN(placement);g.turn=turn||'w';
    g.castling={wK:/[KQ]/.test(rights),wR_a:rights.includes('Q'),wR_h:rights.includes('K'),bK:/[kq]/.test(rights),bR_a:rights.includes('q'),bR_h:rights.includes('k')};
    g.enPassant=ep==='-'?null:[8-Number(ep[1]),'abcdefgh'.indexOf(ep[0])];g.halfmoveClock=Number(half);g.positionCounts={};g.recordPosition();g.updateStatus();return g;
  }

  allMoves() {
    const moves=[];
    for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(this.color(this.board[r][c])===this.turn)
      for(const [tr,tc]of this.legalMoves(r,c)){
        if(this.board[r][c][1]==='P'&&(tr===0||tr===7))for(const promote of ['Q','R','B','N'])moves.push([r,c,tr,tc,promote]);
        else moves.push([r,c,tr,tc]);
      }
    return moves;
  }

  // 이동 후 자기 킹이 체크인지
  moveLeavesCheck(fromR, fromC, toR, toC) {
    const b = this.board.map(r => [...r]);
    // 앙파상은 옆 칸의 폰이 사라지므로 그 폰이 주던 체크도 함께 풀림
    if (this.type(b[fromR][fromC]) === 'P' && fromC !== toC && !b[toR][toC]) b[fromR][toC] = null;
    if(this.type(b[fromR][fromC])==='K'&&Math.abs(toC-fromC)===2){const rookFrom=toC===6?7:0,rookTo=toC===6?5:3;b[fromR][rookTo]=b[fromR][rookFrom];b[fromR][rookFrom]=null;}
    b[toR][toC] = b[fromR][fromC];
    b[fromR][fromC] = null;
    const color = this.color(b[toR][toC]);
    const king = this.findKingOnBoard(b, color);
    if (!king) return true;
    const [kr, kc] = king;
    return this.isAttacked(b, kr, kc, color === 'w' ? 'b' : 'w');
  }

  findKingOnBoard(board, color) {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (board[r][c] === color + 'K') return [r, c];
    return null;
  }

  // 원시 이동 (체크 무시)
  rawMoves(board, row, col, enPassant) {
    const piece = board[row][col];
    if (!piece) return [];
    const color = this.color(piece);
    const type = this.type(piece);
    const opp = color === 'w' ? 'b' : 'w';
    const moves = [];

    const add = (r, c) => {
      if (this.inBounds(r, c) && this.color(board[r][c]) !== color) moves.push([r, c]);
    };
    const slide = (dr, dc) => {
      let r = row + dr, c = col + dc;
      while (this.inBounds(r, c)) {
        if (board[r][c]) { if (this.color(board[r][c]) === opp) moves.push([r, c]); break; }
        moves.push([r, c]);
        r += dr; c += dc;
      }
    };

    if (type === 'P') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      if (this.inBounds(row + dir, col) && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        if (row === startRow && !board[row + 2 * dir][col]) moves.push([row + 2 * dir, col]);
      }
      for (const dc of [-1, 1]) {
        if (this.inBounds(row + dir, col + dc)) {
          if (this.color(board[row + dir][col + dc]) === opp) moves.push([row + dir, col + dc]);
          if (enPassant && enPassant[0] === row + dir && enPassant[1] === col + dc) moves.push([row + dir, col + dc]);
        }
      }
    } else if (type === 'N') {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(row+dr, col+dc);
    } else if (type === 'B') {
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr, dc);
    } else if (type === 'R') {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
    } else if (type === 'Q') {
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, dc);
    } else if (type === 'K') {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(row+dr, col+dc);
    }
    return moves;
  }

  // 합법 이동
  legalMoves(row, col) {
    const piece=this.board[row]?.[col];if(!piece)return [];
    const raw=this.rawMoves(this.board,row,col,this.enPassant);
    if(piece[1]==='K'&&row===(piece[0]==='w'?7:0)&&col===4&&this.castling[piece[0]+'K']){
      const opp=piece[0]==='w'?'b':'w';
      if(!this.isAttacked(this.board,row,col,opp))for(const [rook,target,through,spaces,key]of [[7,6,5,[5,6],'R_h'],[0,2,3,[1,2,3],'R_a']]){
        if(this.castling[piece[0]+key]&&this.board[row][rook]===piece[0]+'R'&&spaces.every(c=>!this.board[row][c])&&!this.moveLeavesCheck(row,col,row,through)&&!this.moveLeavesCheck(row,col,row,target))raw.push([row,target]);
      }
    }
    return raw.filter(([r,c])=>this.board[r][c]?.[1]!=='K'&&!this.moveLeavesCheck(row,col,r,c));
  }

  select(row, col) {
    const piece = this.board[row][col];
    if (piece && this.color(piece) === this.turn) {
      this.selected = [row, col];
      this.validMoves = this.legalMoves(row, col);
      return 'selected';
    }
    if (this.selected) {
      const [fr, fc] = this.selected;
      if (this.validMoves.some(([r, c]) => r === row && c === col)) {
        return this.move(fr, fc, row, col);
      }
    }
    this.selected = null;
    this.validMoves = [];
    return 'none';
  }

  move(fromR, fromC, toR, toC, promotion='Q') {
    const piece = this.board[fromR][fromC];
    if (!['Q','R','B','N'].includes(promotion))return 'illegal';
    if (!piece || this.color(piece) !== this.turn || !this.legalMoves(fromR,fromC).some(([r,c])=>r===toR&&c===toC)) return 'illegal';
    const color = this.color(piece);
    const type = this.type(piece);

    // 잡거나 폰을 움직이면 이전 장면은 다시 나올 수 없으므로 반복 기록도 비움
    const irreversible = type === 'P' || !!this.board[toR][toC];
    this.halfmoveClock = irreversible ? 0 : this.halfmoveClock + 1;
    if (irreversible) this.positionCounts = {};

    // 앙파상
    if (type === 'P' && this.enPassant && toR === this.enPassant[0] && toC === this.enPassant[1]) {
      const captureRow = color === 'w' ? toR + 1 : toR - 1;
      const epCaptured = this.board[captureRow][toC];
      if (epCaptured) this.captured[color].push(epCaptured);
      this.board[captureRow][toC] = null;
    }

    // 일반 캡처
    const target = this.board[toR][toC];
    if (target && this.color(target) !== color) {
      this.captured[color].push(target);
    }

    if(type==='K'){this.castling[color+'K']=false;if(Math.abs(toC-fromC)===2){const rookFrom=toC===6?7:0,rookTo=toC===6?5:3;this.board[fromR][rookTo]=this.board[fromR][rookFrom];this.board[fromR][rookFrom]=null;}}
    for(const [side,row]of [['w',7],['b',0]])for(const [col,key]of [[0,'R_a'],[7,'R_h']]){
      if((piece===side+'R'&&fromR===row&&fromC===col)||(target===side+'R'&&toR===row&&toC===col))this.castling[side+key]=false;
    }

    // 앙파상 설정
    this.enPassant = null;
    if (type === 'P' && Math.abs(toR - fromR) === 2) {
      this.enPassant = [(fromR + toR) / 2, toC];
    }

    this.board[toR][toC] = piece;
    this.board[fromR][fromC] = null;

    // Promotion defaults to a queen; callers can choose rook, bishop or knight.
    if (type === 'P' && (toR === 0 || toR === 7)) {
      this.board[toR][toC] = color + promotion;
    }

    this.lastMove=[fromR,fromC,toR,toC];
    this.selected = null;
    this.validMoves = [];
    this.turn = this.turn === 'w' ? 'b' : 'w';
    this.recordPosition();
    this.updateStatus();
    return 'moved';
  }

  updateStatus() {
    const color = this.turn;
    const opp = color === 'w' ? 'b' : 'w';
    const [kr, kc] = this.findKing(color);
    const inCheck = this.isAttacked(this.board, kr, kc, opp);

    // 합법 이동이 있는지 확인
    let hasLegal = false;
    outer: for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.color(this.board[r][c]) === color) {
          if (this.legalMoves(r, c).length > 0) { hasLegal = true; break outer; }
        }
      }
    }

    if (!hasLegal) {
      this.status = inCheck ? 'checkmate' : 'draw';
      this.drawReason = inCheck ? null : 'stalemate';
      return;
    }
    this.status = inCheck ? 'check' : 'playing';
    this.drawReason = this.findDrawReason();
    if (this.drawReason) this.status = 'draw';
  }

  // 더 둬도 승부가 나지 않는 상황 (체크메이트가 우선이라 합법 수가 있을 때만 확인)
  findDrawReason() {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && this.type(p) !== 'K') pieces.push({ type: this.type(p), square: (r + c) % 2 });
      }
    }
    if (pieces.length === 0) return 'kings';
    // 폰·룩·퀸 없이 마이너 기물 1개뿐이거나, 비숍만 남았는데 모두 같은 색 칸이면 체크메이트 불가
    if (!pieces.some(p => p.type === 'P' || p.type === 'R' || p.type === 'Q')
      && (pieces.length === 1 || pieces.every(p => p.type === 'B' && p.square === pieces[0].square))) return 'material';
    if (this.positionCounts[this.positionKey()] >= 3) return 'repetition';
    if (this.halfmoveClock >= 100) return 'fifty';
    return null;
  }

  // 간단한 AI: 랜덤 합법 이동
  aiMove() {
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.color(this.board[r][c]) === this.turn) {
          const legal = this.legalMoves(r, c);
          legal.forEach(([tr, tc]) => moves.push([r, c, tr, tc]));
        }
      }
    }
    if (moves.length === 0) return;
    // 캡처 우선, 없으면 랜덤
    const captures = moves.filter(([,, tr, tc]) => this.board[tr][tc]);
    const pick = captures.length > 0
      ? captures[Math.floor(Math.random() * captures.length)]
      : moves[Math.floor(Math.random() * moves.length)];
    this.move(pick[0], pick[1], pick[2], pick[3]);
  }
}

// 배우기 데이터
const PIECE_LEARN = [
  { symbol: '♔', nameKey: 'pieceKing', desc: { ko: '킹은 모든 방향으로 한 칸씩 움직여요. 가장 소중한 기물이에요!', en: 'The King moves one square in any direction. Protect your King!' }, moves: [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]] },
  { symbol: '♕', nameKey: 'pieceQueen', desc: { ko: '퀸은 가로, 세로, 대각선 어디든 원하는 만큼 갈 수 있어요. 가장 강한 기물이에요!', en: 'The Queen moves any number of squares in any direction. The most powerful piece!' }, moves: 'queen' },
  { symbol: '♖', nameKey: 'pieceRook', desc: { ko: '룩은 가로와 세로로 원하는 만큼 움직여요.', en: 'The Rook moves any number of squares horizontally or vertically.' }, moves: 'rook' },
  { symbol: '♗', nameKey: 'pieceBishop', desc: { ko: '비숍은 대각선으로 원하는 만큼 움직여요.', en: 'The Bishop moves any number of squares diagonally.' }, moves: 'bishop' },
  { symbol: '♘', nameKey: 'pieceKnight', desc: { ko: '나이트는 L자 모양으로 움직여요. 다른 기물을 뛰어넘을 수 있어요!', en: 'The Knight moves in an L-shape and can jump over other pieces!' }, moves: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]] },
  { symbol: '♙', nameKey: 'piecePawn', desc: { ko: '폰은 앞으로 한 칸, 처음에는 두 칸 갈 수 있어요. 대각선으로 상대를 잡아요!', en: 'The Pawn moves forward one square, or two on its first move. It captures diagonally!' }, moves: [[-1,0],[-2,0]] },
];

// Stable puzzle IDs survive menu reordering. Historical stars stay in the legacy ledger.
const PUZZLES = [
  {id:'capture-rook-v1',level:2,type:'capture',fen:'r3k3/8/8/8/8/8/8/4K2Q w - - 0 1',target:[0,0]},
  {id:'capture-knight-v1',level:2,type:'capture',fen:'4k3/8/8/3n4/8/8/8/3R1K2 w - - 0 1',target:[3,3]},
  {id:'capture-bishop-v1',level:2,type:'capture',fen:'4k3/8/8/8/4b3/8/8/1K5B w - - 0 1',target:[4,4]},
  {id:'check-escape-v1',level:5,type:'escape',fen:'k3r3/8/8/8/8/8/8/4K3 w - - 0 1'},
  {id:'check-capture-v1',level:5,type:'escape',fen:'k7/8/8/8/8/8/4r3/4K3 w - - 0 1'},
  {id:'check-block-v1',level:5,type:'escape',fen:'4r2k/8/8/8/8/8/R7/4K3 w - - 0 1'},
  {id:'mate-queen-v1',level:1,type:'checkmate',fen:'6k1/8/5K1Q/8/8/8/8/8 w - - 0 1'},
  {id:'mate-rook-v1',level:1,type:'checkmate',fen:'k7/8/1K6/8/8/8/8/7R w - - 0 1'},
  {id:'mate-edge-v1',level:1,type:'checkmate',fen:'7k/8/5KQ1/8/8/8/8/8 w - - 0 1'},
  {id:'fork-knight-v1',level:3,type:'fork',fen:'8/8/8/4k3/7r/8/8/4K1N1 w - - 0 1'},
  {id:'fork-queen-v1',level:3,type:'fork',fen:'r3k3/8/8/8/8/8/8/4K2Q w - - 0 1'},
  {id:'fork-jump-v1',level:3,type:'fork',fen:'8/2r1k3/8/8/8/2N5/8/4K3 w - - 0 1'},
  {id:'mate-two-a-v1',level:4,type:'checkmate2',fen:'8/8/k7/2K5/8/6Q1/8/8 w - - 0 1'},
  {id:'mate-two-b-v1',level:4,type:'checkmate2',fen:'1k6/6Q1/8/2K5/8/8/8/8 w - - 0 1'},
  {id:'mate-two-c-v1',level:4,type:'checkmate2',fen:'6Q1/8/8/8/8/8/7k/4K3 w - - 0 1'},
].map(p => ({...p,board:boardFromFEN(p.fen),turn:'w',desc:{
  ko:({capture:'표시된 상대 말을 잡아요.',escape:'왕을 안전하게 해요. 피하거나, 잡거나, 막아 보세요.',checkmate:'상대 왕이 피할 수 없게 해요.',fork:'한 말로 상대 왕과 다른 말을 동시에 노려요.',checkmate2:'내 말 두 번으로 체크메이트! 상대가 어떻게 움직여도 해낼 수 있어요.'})[p.type],
  en:({capture:'Capture the marked piece.',escape:'Make your king safe: move, capture, or block.',checkmate:'Checkmate the king.',fork:'Attack the king and another piece at once.',checkmate2:'Force checkmate in two of your moves.'})[p.type]
}}));
