const I18N = {
  ko: {
    appName: '어린이체스',
    menuLearn: '배우기',
    menuPuzzle: '퍼즐',
    menuPlay: '대전하기',
    menuReward: '내 별',
    pieceKing: '왕',
    pieceQueen: '여왕',
    pieceRook: '성',
    pieceBishop: '주교',
    pieceKnight: '말',
    piecePawn: '병사',
    learnTitle: '기물을 배워요!',
    learnTap: '기물을 눌러보세요',
    puzzleTitle: '퍼즐 도전!',
    puzzleInstruction: '체크메이트를 만들어보세요!',
    puzzleSuccess: '정말 잘했어요! ⭐',
    puzzleFail: '다시 해봐요!',
    playTitle: '컴퓨터와 대전',
    playYourTurn: '내 차례예요!',
    playAiTurn: '컴퓨터가 생각 중...',
    playCheck: '체크!',
    playCheckmate: '체크메이트! 이겼어요! 🎉',
    playLose: '졌어요. 다시 해봐요!',
    playDraw: '비겼어요!',
    playRestart: '다시 시작',
    rewardTitle: '내가 모은 별',
    rewardStars: '개',
    btnBack: '뒤로',
    btnNext: '다음',
    btnStart: '시작!',
    rewardEmpty: '아직 별이 없어요. 퍼즐을 풀어보세요!',
  },
  en: {
    appName: 'Kids Chess',
    menuLearn: 'Learn',
    menuPuzzle: 'Puzzle',
    menuPlay: 'Play',
    menuReward: 'My Stars',
    pieceKing: 'King',
    pieceQueen: 'Queen',
    pieceRook: 'Rook',
    pieceBishop: 'Bishop',
    pieceKnight: 'Knight',
    piecePawn: 'Pawn',
    learnTitle: 'Learn the Pieces!',
    learnTap: 'Tap a piece to learn',
    puzzleTitle: 'Puzzle Challenge!',
    puzzleInstruction: 'Find the checkmate!',
    puzzleSuccess: 'Great job! ⭐',
    puzzleFail: 'Try again!',
    playTitle: 'Play vs Computer',
    playYourTurn: 'Your turn!',
    playAiTurn: 'Computer thinking...',
    playCheck: 'Check!',
    playCheckmate: 'Checkmate! You win! 🎉',
    playLose: 'You lost. Try again!',
    playDraw: 'Draw!',
    playRestart: 'Restart',
    rewardTitle: 'My Stars',
    rewardStars: '',
    btnBack: 'Back',
    btnNext: 'Next',
    btnStart: 'Start!',
    rewardEmpty: 'No stars yet. Try solving a puzzle!',
  }
};

let currentLang = 'ko';

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N['ko'][key] || key;
}

function setLang(lang) {
  if (I18N[lang]) currentLang = lang;
}
