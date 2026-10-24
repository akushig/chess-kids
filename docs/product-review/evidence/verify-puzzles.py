"""Independent verification with python-chess (chess==1.11.2).
Run after audit.cjs; writes JSON to stdout. Does not modify app or progress.
"""
import json
from pathlib import Path
import chess

source = json.loads((Path(__file__).parent / 'audit-results.json').read_text())

def move(coords):
    fr, fc, tr, tc = coords
    return chess.Move(chess.square(fc, 7-fr), chess.square(tc, 7-tr))

def status(board):
    return 'checkmate' if board.is_checkmate() else 'check' if board.is_check() else 'playing'

rows = []
for puzzle in source['puzzles']:
    board = chess.Board(None)
    for r, row in enumerate(puzzle['board']):
        for c, p in enumerate(row):
            if p:
                board.set_piece_at(chess.square(c, 7-r), chess.Piece.from_symbol(p[1] if p[0]=='w' else p[1].lower()))
    board.turn = puzzle['turn']=='w'
    result = {'id':puzzle['id'], 'fen':board.fen(), 'positionValid':board.is_valid()}
    first = move(puzzle['solution'][0])
    result['firstLegal'] = first in board.legal_moves
    result['firstUci'] = first.uci()
    result['objectiveVerified'] = False
    if result['firstLegal']:
        captured = board.piece_at(first.to_square)
        board.push(first)
        result['afterFirst'] = status(board)
        if puzzle['type']=='checkmate':
            result['objectiveVerified'] = board.is_checkmate()
            result['legalReplies'] = [m.uci() for m in board.legal_moves]
        elif puzzle['type']=='capture':
            result['objectiveVerified'] = captured is not None
        elif puzzle['type']=='fork':
            targets = [s for s in board.attacks(first.to_square) if board.piece_at(s) and board.piece_at(s).color==chess.BLACK]
            result['attackedTargets'] = [chess.square_name(s) for s in targets]
            result['objectiveVerified'] = len(targets)>=2 and any(board.piece_at(s).piece_type==chess.KING for s in targets)
        else:
            replies = []
            for reply in list(board.legal_moves):
                b = board.copy(); b.push(reply)
                second = move(puzzle['solution'][1]); legal = second in b.legal_moves
                if legal: b.push(second)
                replies.append({'reply':reply.uci(),'secondLegal':legal,'afterSecond':status(b) if legal else None})
            result['replies'] = replies
            result['objectiveVerified'] = bool(replies) and all(r['secondLegal'] and r['afterSecond']=='checkmate' for r in replies)
    rows.append(result)
print(json.dumps({'library':'chess '+chess.__version__, 'verified':sum(r['objectiveVerified'] for r in rows), 'total':len(rows), 'puzzles':rows},ensure_ascii=False,indent=2))
