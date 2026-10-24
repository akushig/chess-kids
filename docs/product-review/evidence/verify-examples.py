"""Validate proposed rook boards with BFS and chess fixtures with python-chess."""
import json
from pathlib import Path
from collections import deque
import chess

data = json.loads((Path(__file__).parent.parent / 'lesson-examples.json').read_text())
results = []
for lv in data['rookLessons']:
    targets = tuple(tuple(t) for t in lv['targets'])
    blocks = set(map(tuple, lv['blocks']))
    start = (tuple(lv['start']), (1 << len(targets))-1)
    queue = deque([(start, 0)])
    seen = {start}
    found = None
    while queue:
        (pos, mask), distance = queue.popleft()
        if (lv['objective']=='reach' and list(pos) in lv['goals']) or (lv['objective']=='captureAll' and mask==0):
            found = distance; break
        for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
            r,c = pos[0]+dr,pos[1]+dc
            while 0<=r<lv['size'] and 0<=c<lv['size'] and (r,c) not in blocks:
                hit = next((i for i,t in enumerate(targets) if t==(r,c) and mask&(1<<i)), None)
                next_mask = mask if hit is None else mask & ~(1<<hit)
                state = ((r,c),next_mask)
                if state not in seen:
                    seen.add(state); queue.append((state,distance+1))
                if hit is not None: break
                r+=dr; c+=dc
    assert found == lv['par'], (lv['id'],found,lv['par'])
    results.append({'id':lv['id'],'shortest':found,'valid':True})

for case in data['chessFixtures']:
    board = chess.Board(case['fen'])
    assert board.is_valid(), case['id']
    status = 'checkmate' if board.is_checkmate() else 'stalemate' if board.is_stalemate() else 'check' if board.is_check() else 'playing'
    assert status==case['expected'], (case['id'],status)
    if 'illegalAttempt' in case:
        assert chess.Move.from_uci(case['illegalAttempt']) not in board.legal_moves
    if 'demo' in case:
        move=chess.Move.from_uci(case['demo'])
        assert move in board.legal_moves,case['id']
        board.push(move)
        # Opponent may now be checked; verify the mover's king is safe.
        assert not board.is_attacked_by(board.turn, board.king(not board.turn)),case['id']
    results.append({'id':case['id'],'initialStatus':status,'valid':True})
print(json.dumps(results,ensure_ascii=False,indent=2))
