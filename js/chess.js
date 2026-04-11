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
    this.enPassant = null;
    this.castling = { wK: true, wR_a: true, wR_h: true, bK: true, bR_a: true, bR_h: true };
    this.captured = { w: [], b: [] }; // w: 백이 잡은 기물, b: 흑이 잡은 기물
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
  isAttacked(board, row, col, byColor) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p || this.color(p) !== byColor) continue;
        const moves = this.rawMoves(board, r, c, null);
        if (moves.some(([mr, mc]) => mr === row && mc === col)) return true;
      }
    }
    return false;
  }

  // 이동 후 자기 킹이 체크인지
  moveLeavesCheck(fromR, fromC, toR, toC) {
    const b = this.board.map(r => [...r]);
    b[toR][toC] = b[fromR][fromC];
    b[fromR][fromC] = null;
    const color = this.color(b[toR][toC]);
    const [kr, kc] = this.findKingOnBoard(b, color);
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
    const raw = this.rawMoves(this.board, row, col, this.enPassant);
    return raw.filter(([r, c]) => !this.moveLeavesCheck(row, col, r, c));
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

  move(fromR, fromC, toR, toC) {
    const piece = this.board[fromR][fromC];
    const color = this.color(piece);
    const type = this.type(piece);

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

    // 앙파상 설정
    this.enPassant = null;
    if (type === 'P' && Math.abs(toR - fromR) === 2) {
      this.enPassant = [(fromR + toR) / 2, toC];
    }

    this.board[toR][toC] = piece;
    this.board[fromR][fromC] = null;

    // 폰 프로모션 (자동으로 퀸)
    if (type === 'P' && (toR === 0 || toR === 7)) {
      this.board[toR][toC] = color + 'Q';
    }

    this.selected = null;
    this.validMoves = [];
    this.turn = this.turn === 'w' ? 'b' : 'w';
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
    } else {
      this.status = inCheck ? 'check' : 'playing';
    }
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
  { symbol: '♔', nameKey: 'pieceKing', desc: { ko: '왕은 모든 방향으로 한 칸씩 움직여요. 가장 소중한 기물이에요!', en: 'The King moves one square in any direction. Protect your King!' }, moves: [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]] },
  { symbol: '♕', nameKey: 'pieceQueen', desc: { ko: '여왕은 가로, 세로, 대각선 어디든 원하는 만큼 갈 수 있어요. 가장 강한 기물이에요!', en: 'The Queen moves any number of squares in any direction. The most powerful piece!' }, moves: 'queen' },
  { symbol: '♖', nameKey: 'pieceRook', desc: { ko: '성은 가로와 세로로 원하는 만큼 움직여요.', en: 'The Rook moves any number of squares horizontally or vertically.' }, moves: 'rook' },
  { symbol: '♗', nameKey: 'pieceBishop', desc: { ko: '주교는 대각선으로 원하는 만큼 움직여요.', en: 'The Bishop moves any number of squares diagonally.' }, moves: 'bishop' },
  { symbol: '♘', nameKey: 'pieceKnight', desc: { ko: '말은 L자 모양으로 움직여요. 다른 기물을 뛰어넘을 수 있어요!', en: 'The Knight moves in an L-shape and can jump over other pieces!' }, moves: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]] },
  { symbol: '♙', nameKey: 'piecePawn', desc: { ko: '병사는 앞으로 한 칸, 처음에는 두 칸 갈 수 있어요. 대각선으로 상대를 잡아요!', en: 'The Pawn moves forward one square, or two on its first move. It captures diagonally!' }, moves: [[-1,0],[-2,0]] },
];

// ===== 퍼즐 데이터 (4레벨 × 3개 = 12개) =====

// 레벨 1: 1수 체크메이트
// 레벨 2: 기물 잡기
// 레벨 3: 포크/핀
// 레벨 4: 2수 체크메이트

const PUZZLES = [
  // === 레벨 1: 1수 체크메이트 ===
  { level:1, type:'checkmate',
    board: [
      [null,null,null,null,'bK',null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ['wR',null,null,null,'wK',null,null,'wQ']
    ], turn:'w', solution:[[7,7,0,7]],
    desc:{ ko:'퀸으로 체크메이트!', en:'Checkmate with the Queen!' }},

  { level:1, type:'checkmate',
    board: [
      [null,null,null,null,'bK',null,null,null],
      [null,null,null,null,'bP',null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,'wQ',null,null,null,'wK']
    ], turn:'w', solution:[[7,3,0,3]],
    desc:{ ko:'퀸으로 체크메이트!', en:'Checkmate with the Queen!' }},

  { level:1, type:'checkmate',
    board: [
      [null,null,null,null,null,null,'bK',null],
      [null,null,null,null,null,null,'bP','bP'],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,'wK',null,null,'wR']
    ], turn:'w', solution:[[7,7,0,7]],
    desc:{ ko:'룩으로 체크메이트!', en:'Checkmate with the Rook!' }},

  // === 레벨 2: 기물 잡기 (보호 안 된 기물 캡처) ===
  { level:2, type:'capture',
    board: [
      ['bR',null,null,null,'bK',null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,'wK',null,null,'wQ']
    ], turn:'w', solution:[[7,7,0,0]],
    desc:{ ko:'보호 안 된 룩을 잡으세요!', en:'Capture the undefended Rook!' }},

  { level:2, type:'capture',
    board: [
      [null,null,null,null,'bK',null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,'bN',null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,'wR',null,'wK',null,null]
    ], turn:'w', solution:[[7,3,3,3]],
    desc:{ ko:'보호 안 된 나이트를 잡으세요!', en:'Capture the undefended Knight!' }},

  { level:2, type:'capture',
    board: [
      [null,null,null,null,'bK',null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,'bB',null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,'wK',null,null,null,null,null,'wB']
    ], turn:'w', solution:[[7,7,4,2]],
    desc:{ ko:'보호 안 된 비숍을 잡으세요!', en:'Capture the undefended Bishop!' }},

  // === 레벨 3: 포크 (두 기물 동시 위협) ===
  { level:3, type:'fork',
    board: [
      [null,null,null,null,'bK',null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,'bR'],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,'wK',null,'wN',null]
    ], turn:'w', solution:[[7,6,5,5]],
    desc:{ ko:'나이트로 킹과 룩을 동시에 위협하세요!', en:'Fork the King and Rook with the Knight!' }},

  { level:3, type:'fork',
    board: [
      ['bR',null,null,null,'bK',null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,'wK',null,null,'wQ']
    ], turn:'w', solution:[[7,7,0,7]],
    desc:{ ko:'퀸으로 킹과 룩을 동시에 위협하세요!', en:'Fork the King and Rook with the Queen!' }},

  { level:3, type:'fork',
    board: [
      [null,null,null,'bR','bK',null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,'wN',null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,'wK',null,null,null]
    ], turn:'w', solution:[[5,2,3,3]],
    desc:{ ko:'나이트 포크! 킹과 룩을 동시에!', en:'Knight fork! King and Rook at once!' }},

  // === 레벨 4: 2수 체크메이트 ===
  { level:4, type:'checkmate2',
    board: [
      [null,null,null,null,null,null,'bK',null],
      [null,null,null,null,null,null,'bP',null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,'wK',null,'wQ','wR']
    ], turn:'w', solution:[[7,6,1,6],[7,7,0,7]],
    desc:{ ko:'2수 만에 체크메이트를 만드세요!', en:'Checkmate in 2 moves!' }},

  { level:4, type:'checkmate2',
    board: [
      [null,null,null,null,'bK',null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ['wR',null,null,null,null,null,null,null],
      [null,null,null,null,'wK',null,null,'wR']
    ], turn:'w', solution:[[6,0,0,0],[7,7,0,7]],
    desc:{ ko:'두 룩으로 2수 체크메이트!', en:'Checkmate in 2 with two Rooks!' }},

  { level:4, type:'checkmate2',
    board: [
      [null,null,null,null,null,'bK',null,null],
      [null,null,null,null,null,'bP',null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ['wR',null,null,null,'wK',null,'wQ',null]
    ], turn:'w', solution:[[7,6,1,6],[7,0,0,0]],
    desc:{ ko:'퀸과 룩으로 2수 체크메이트!', en:'Checkmate in 2 with Queen and Rook!' }},
];
