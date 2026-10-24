"""Generate deterministic independent rules fixtures with python-chess 1.11.2."""
import chess,random,json
from pathlib import Path
fens=[chess.STARTING_FEN,'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1','r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1','k7/8/8/8/8/8/4p3/4K2R w K - 0 1','k7/8/8/r4pPK/8/8/8/8 w - f6 0 1','7k/P7/8/8/8/8/8/3K4 w - - 0 1','r6k/1P6/8/8/8/8/8/3K4 w - - 0 1','k7/8/8/3pP3/4K3/8/8/8 w - d6 0 1']
rng=random.Random(20261025)
for game in range(3):
 b=chess.Board()
 for ply in range(90):
  if b.is_game_over():break
  b.push(rng.choice(list(b.legal_moves)))
  if ply%3==0:fens.append(b.fen())
rows=[]
for fen in fens:
 b=chess.Board(fen);assert b.is_valid(),fen
 rows.append({'fen':fen,'legal':sorted(m.uci() for m in b.legal_moves),'check':b.is_check(),'mate':b.is_checkmate(),'stalemate':b.is_stalemate()})
Path('tests/fixtures/chess-positions.json').write_text(json.dumps({'source':'python-chess 1.11.2','positions':rows},indent=2)+'\n')
print('Generated',len(rows),'independent chess positions')
