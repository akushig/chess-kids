const {run}=require('../tests/harness.cjs')();
console.log(JSON.stringify(run(`({puzzles:PUZZLES.map(p=>({...p,winningUci:puzzleWinningMoves(ChessGame.fromFEN(p.fen),p,p.type==='checkmate2'?2:1).map(([fr,fc,tr,tc])=>'abcdefgh'[fc]+(8-fr)+'abcdefgh'[tc]+(8-tr))})),missions:MISSIONS})`)));
