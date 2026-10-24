"""Independent goal validation. Pipe `node scripts/export-content.cjs` into this script.
Requires chess==1.11.2 in a separate validation environment, not the application.
"""
import sys,json,chess
content=json.load(sys.stdin)
def satisfies(before,after,m,p):
 t=p['type']
 if t=='capture':return before.piece_at(m.to_square) is not None and [7-chess.square_rank(m.to_square),chess.square_file(m.to_square)]==p['target']
 if t=='escape':return not after.is_attacked_by(after.turn,after.king(not after.turn))
 if t=='fork':
  targets=[s for s in after.attacks(m.to_square) if after.piece_at(s) and after.piece_at(s).color==after.turn]
  return len(targets)>=2 and any(after.piece_at(s).piece_type==chess.KING for s in targets)
 return after.is_checkmate()
def winning(b,p,depth):
 result=[]
 for m in list(b.legal_moves):
  n=b.copy();n.push(m);ok=satisfies(b,n,m,p)
  if not ok and p['type']=='checkmate2' and depth>1:
   replies=list(n.legal_moves);ok=bool(replies)
   for r in replies:
    k=n.copy();k.push(r)
    if not winning(k,p,depth-1):ok=False;break
  if ok:result.append(m.uci())
 return sorted(result)
for p in content['puzzles']:
 b=chess.Board(p['fen']);assert b.is_valid(),p['id']
 expected=winning(b,p,2 if p['type']=='checkmate2' else 1)
 assert expected,p['id']
 if 'winningUci' in p:assert expected==sorted(p['winningUci']),(p['id'],expected,p['winningUci'])
 print(p['id'],':',','.join(expected))
print('Independent validation passed:',len(content['puzzles']),'puzzles')
