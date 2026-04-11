// 기물별 미션 데이터
// 보드: 6x6 미니 보드 (0~5)
// type: reach(목표 도달), capture(기물 잡기), escape(안전 이동)
// piece: 플레이어 기물
// start: [r, c] 시작 위치
// goals: [[r,c], ...] 목표 칸 (reach/escape)
// targets: [[r,c,piece], ...] 잡아야 할 상대 기물 (capture)
// blocks: [[r,c], ...] 장애물 칸 (이동 불가)
// enemies: [[r,c,piece], ...] 위협 기물 (escape에서 사용)

const MISSIONS = {
  P: [
    {
      type: 'reach',
      piece: 'wP',
      start: [4, 2],
      goals: [[2, 2]],
      blocks: [],
      enemies: [],
      targets: [],
      desc: { ko: '병사를 앞으로 이동시켜 목표 칸에 도달하세요!', en: 'Move the Pawn forward to reach the goal!' }
    },
    {
      type: 'reach',
      piece: 'wP',
      start: [4, 2],
      goals: [[2, 3]],
      blocks: [[3, 2]],
      enemies: [],
      targets: [[3, 3, 'bP']],
      desc: { ko: '장애물을 피해 상대를 잡으며 목표에 도달하세요!', en: 'Capture the enemy to get around the obstacle!' }
    },
    {
      type: 'capture',
      piece: 'wP',
      start: [4, 2],
      goals: [],
      blocks: [],
      enemies: [],
      targets: [[3, 3, 'bP'], [2, 2, 'bP']],
      desc: { ko: '병사는 대각선으로 상대를 잡아요! 모두 잡으세요!', en: 'Pawns capture diagonally! Capture all enemies!' }
    }
  ],
  R: [
    {
      type: 'reach',
      piece: 'wR',
      start: [4, 0],
      goals: [[4, 5]],
      blocks: [],
      enemies: [],
      targets: [],
      desc: { ko: '성을 가로로 이동시켜 목표 칸에 도달하세요!', en: 'Move the Rook horizontally to reach the goal!' }
    },
    {
      type: 'capture',
      piece: 'wR',
      start: [5, 0],
      goals: [],
      blocks: [],
      enemies: [],
      targets: [[5, 4, 'bP'], [1, 0, 'bP'], [1, 4, 'bP']],
      desc: { ko: '성으로 상대 기물을 모두 잡으세요!', en: 'Capture all enemies with the Rook!' }
    },
    {
      type: 'reach',
      piece: 'wR',
      start: [5, 0],
      goals: [[0, 5]],
      blocks: [[5, 3], [2, 0]],
      enemies: [],
      targets: [],
      desc: { ko: '장애물을 피해 목표 칸까지 이동하세요!', en: 'Navigate around obstacles to reach the goal!' }
    }
  ],
  B: [
    {
      type: 'reach',
      piece: 'wB',
      start: [5, 0],
      goals: [[2, 3]],
      blocks: [],
      enemies: [],
      targets: [],
      desc: { ko: '주교를 대각선으로 이동시켜 목표에 도달하세요!', en: 'Move the Bishop diagonally to reach the goal!' }
    },
    {
      type: 'capture',
      piece: 'wB',
      start: [5, 2],
      goals: [],
      blocks: [],
      enemies: [],
      targets: [[3, 0, 'bP'], [3, 4, 'bP'], [1, 0, 'bP']],
      desc: { ko: '주교로 상대 기물을 모두 잡으세요!', en: 'Capture all enemies with the Bishop!' }
    },
    {
      type: 'reach',
      piece: 'wB',
      start: [5, 1],
      goals: [[0, 4]],
      blocks: [[3, 3]],
      enemies: [],
      targets: [],
      desc: { ko: '장애물을 피해 대각선으로 이동하세요!', en: 'Avoid obstacles and move diagonally!' }
    }
  ],
  N: [
    {
      type: 'reach',
      piece: 'wN',
      start: [4, 1],
      goals: [[2, 2]],
      blocks: [],
      enemies: [],
      targets: [],
      desc: { ko: '말을 L자로 이동시켜 목표에 도달하세요!', en: 'Move the Knight in an L-shape to reach the goal!' }
    },
    {
      type: 'reach',
      piece: 'wN',
      start: [5, 0],
      goals: [[0, 5]],
      blocks: [[3, 1], [2, 2], [1, 3]],
      enemies: [],
      targets: [],
      desc: { ko: '말은 장애물을 뛰어넘을 수 있어요! 목표에 도달하세요!', en: 'Knights can jump over obstacles! Reach the goal!' }
    },
    {
      type: 'capture',
      piece: 'wN',
      start: [3, 3],
      goals: [],
      blocks: [],
      enemies: [],
      targets: [[1, 2, 'bP'], [1, 4, 'bP'], [5, 2, 'bP']],
      desc: { ko: '말로 상대 기물을 모두 잡으세요!', en: 'Capture all enemies with the Knight!' }
    }
  ],
  Q: [
    {
      type: 'reach',
      piece: 'wQ',
      start: [5, 0],
      goals: [[0, 5]],
      blocks: [],
      enemies: [],
      targets: [],
      desc: { ko: '여왕은 어디든 갈 수 있어요! 목표에 도달하세요!', en: 'The Queen can go anywhere! Reach the goal!' }
    },
    {
      type: 'capture',
      piece: 'wQ',
      start: [3, 3],
      goals: [],
      blocks: [],
      enemies: [],
      targets: [[3, 0, 'bR'], [0, 3, 'bB'], [0, 0, 'bN']],
      desc: { ko: '여왕으로 상대 기물을 모두 잡으세요!', en: 'Capture all enemies with the Queen!' }
    },
    {
      type: 'reach',
      piece: 'wQ',
      start: [5, 0],
      goals: [[0, 5]],
      blocks: [[3, 2], [2, 3], [5, 3]],
      enemies: [],
      targets: [],
      desc: { ko: '장애물을 피해 목표에 도달하세요!', en: 'Navigate around obstacles to reach the goal!' }
    }
  ],
  K: [
    {
      type: 'reach',
      piece: 'wK',
      start: [4, 2],
      goals: [[2, 2]],
      blocks: [],
      enemies: [],
      targets: [],
      desc: { ko: '왕을 한 칸씩 이동시켜 목표에 도달하세요!', en: 'Move the King one square at a time to reach the goal!' }
    },
    {
      type: 'escape',
      piece: 'wK',
      start: [3, 3],
      goals: [[3, 5], [5, 3], [5, 5]],
      blocks: [],
      enemies: [[0, 3, 'bR'], [3, 0, 'bR']],
      targets: [],
      desc: { ko: '왕이 위험해요! 안전한 칸으로 피하세요!', en: 'The King is in danger! Move to a safe square!' }
    },
    {
      type: 'capture',
      piece: 'wK',
      start: [3, 3],
      goals: [],
      blocks: [],
      enemies: [],
      targets: [[2, 3, 'bP'], [3, 4, 'bP']],
      desc: { ko: '왕으로 옆에 있는 상대를 잡으세요!', en: 'Capture nearby enemies with the King!' }
    }
  ]
};

// 미션 진행도 관리
function getMissionProgress() {
  try {
    return JSON.parse(localStorage.getItem('mission_progress')) || {};
  } catch { return {}; }
}

function saveMissionProgress(pieceKey, missionIdx) {
  const progress = getMissionProgress();
  if (!progress[pieceKey]) progress[pieceKey] = [];
  progress[pieceKey][missionIdx] = true;
  localStorage.setItem('mission_progress', JSON.stringify(progress));
}

function isMissionCleared(pieceKey, missionIdx) {
  const progress = getMissionProgress();
  return !!(progress[pieceKey] && progress[pieceKey][missionIdx]);
}

function getPieceClearCount(pieceKey) {
  const progress = getMissionProgress();
  if (!progress[pieceKey]) return 0;
  return progress[pieceKey].filter(Boolean).length;
}
