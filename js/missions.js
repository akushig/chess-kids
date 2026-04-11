// ===== 기물별 스테이지 데이터 =====
// 보드: 6x6 미니 보드 (0~5)
// type: reach(목표 도달), capture(기물 잡기), escape(안전 이동)
// piece: 플레이어 기물, start: [r,c], goals: [[r,c],...], targets: [[r,c,piece],...]
// blocks: [[r,c],...], enemies: [[r,c,piece],...], minMoves: 최소 이동수 (별 등급용)
// hint: 첫 이동 힌트 [fromR, fromC, toR, toC]

const MISSIONS = {
  // ===== 월드 1: 폰의 모험 =====
  P: [
    // Stage 1: 앞으로 전진!
    { type:'reach', piece:'wP', start:[4,2], goals:[[2,2]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[4,2,2,2],
      desc:{ ko:'병사를 앞으로 이동시켜 목표에 도달하세요!', en:'Move the Pawn forward to the goal!' }},
    // Stage 2: 두 칸 점프
    { type:'reach', piece:'wP', start:[4,3], goals:[[2,3]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[4,3,2,3],
      desc:{ ko:'병사는 처음에 두 칸을 갈 수 있어요!', en:'Pawns can move two squares on their first move!' }},
    // Stage 3: 대각선 공격
    { type:'capture', piece:'wP', start:[4,2], goals:[], blocks:[], enemies:[], targets:[[3,3,'bP']], minMoves:1,
      hint:[4,2,3,3],
      desc:{ ko:'병사는 대각선으로 상대를 잡아요!', en:'Pawns capture diagonally!' }},
    // Stage 4: 장애물 피하기
    { type:'reach', piece:'wP', start:[4,2], goals:[[2,3]], blocks:[[3,2]], enemies:[], targets:[[3,3,'bP']], minMoves:2,
      hint:[4,2,3,3],
      desc:{ ko:'장애물을 피해 상대를 잡으며 전진하세요!', en:'Avoid the obstacle and capture to advance!' }},
    // Stage 5: 적을 모두 잡아라
    { type:'capture', piece:'wP', start:[4,2], goals:[], blocks:[], enemies:[], targets:[[3,3,'bP'],[2,2,'bP']], minMoves:2,
      hint:[4,2,3,3],
      desc:{ ko:'대각선 공격으로 적을 모두 잡으세요!', en:'Capture all enemies with diagonal attacks!' }},
    // Stage 6: 미로 탈출
    { type:'reach', piece:'wP', start:[4,1], goals:[[1,4]], blocks:[[3,1],[2,3]], enemies:[], targets:[[3,2,'bP'],[2,3,'bP'],[1,4,'bP']], minMoves:3,
      hint:[4,1,3,2],
      desc:{ ko:'적을 잡으며 미로를 통과하세요!', en:'Capture enemies to navigate through!' }},
    // Stage 7: 끝까지 전진 (프로모션 느낌)
    { type:'reach', piece:'wP', start:[4,2], goals:[[0,2]], blocks:[], enemies:[], targets:[], minMoves:3,
      hint:[4,2,2,2],
      desc:{ ko:'끝줄까지 전진하세요! 병사가 강해져요!', en:'Advance to the last row! The Pawn gets promoted!' }},
    // Stage 8: 폰 마스터
    { type:'capture', piece:'wP', start:[4,0], goals:[], blocks:[[3,0],[2,1]], enemies:[], targets:[[3,1,'bP'],[2,2,'bP'],[1,1,'bP']], minMoves:3,
      hint:[4,0,3,1],
      desc:{ ko:'폰 마스터 도전! 모든 적을 잡으세요!', en:'Pawn Master! Capture all enemies!' }},
  ],

  // ===== 월드 2: 룩의 모험 =====
  R: [
    // Stage 1: 직선 이동
    { type:'reach', piece:'wR', start:[4,0], goals:[[4,5]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[4,0,4,5],
      desc:{ ko:'성을 가로로 이동시켜 목표에 도달하세요!', en:'Move the Rook horizontally to the goal!' }},
    // Stage 2: 세로 이동
    { type:'reach', piece:'wR', start:[5,2], goals:[[0,2]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[5,2,0,2],
      desc:{ ko:'성을 세로로 이동시켜 목표에 도달하세요!', en:'Move the Rook vertically to the goal!' }},
    // Stage 3: 적 잡기
    { type:'capture', piece:'wR', start:[5,0], goals:[], blocks:[], enemies:[], targets:[[5,4,'bP']], minMoves:1,
      hint:[5,0,5,4],
      desc:{ ko:'성으로 적을 잡으세요!', en:'Capture the enemy with the Rook!' }},
    // Stage 4: 장애물 미로
    { type:'reach', piece:'wR', start:[5,0], goals:[[0,5]], blocks:[[5,3],[2,0]], enemies:[], targets:[], minMoves:3,
      hint:[5,0,5,2],
      desc:{ ko:'장애물을 피해 목표에 도달하세요!', en:'Navigate around obstacles to the goal!' }},
    // Stage 5: 연속 캡처
    { type:'capture', piece:'wR', start:[5,0], goals:[], blocks:[], enemies:[], targets:[[5,4,'bP'],[1,0,'bP'],[1,4,'bP']], minMoves:3,
      hint:[5,0,5,4],
      desc:{ ko:'성으로 적을 모두 잡으세요!', en:'Capture all enemies with the Rook!' }},
    // Stage 6: 안전 이동
    { type:'escape', piece:'wR', start:[3,3], goals:[[0,0],[5,5]], blocks:[], enemies:[[0,3,'bR'],[3,0,'bR']], targets:[], minMoves:3,
      hint:[3,3,5,5],
      desc:{ ko:'적의 공격을 피해 안전한 곳으로!', en:'Escape to a safe square!' }},
    // Stage 7: 복잡한 미로
    { type:'reach', piece:'wR', start:[5,0], goals:[[0,5]], blocks:[[3,0],[5,2],[0,3]], enemies:[], targets:[], minMoves:3,
      hint:[5,0,5,1],
      desc:{ ko:'복잡한 장애물을 피해 목표에 도달하세요!', en:'Navigate the complex maze!' }},
    // Stage 8: 룩 마스터
    { type:'capture', piece:'wR', start:[5,0], goals:[], blocks:[[3,3]], enemies:[], targets:[[0,0,'bP'],[0,5,'bP'],[5,5,'bP'],[2,0,'bP']], minMoves:4,
      hint:[5,0,5,5],
      desc:{ ko:'룩 마스터 도전! 모든 적을 잡으세요!', en:'Rook Master! Capture all enemies!' }},
  ],

  // ===== 월드 3: 나이트의 모험 =====
  N: [
    // Stage 1: L자 점프
    { type:'reach', piece:'wN', start:[4,1], goals:[[2,2]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[4,1,2,2],
      desc:{ ko:'말을 L자로 이동시켜 목표에 도달하세요!', en:'Move the Knight in an L-shape!' }},
    // Stage 2: 장애물 뛰어넘기
    { type:'reach', piece:'wN', start:[5,0], goals:[[3,1]], blocks:[[4,0],[4,1],[5,1]], enemies:[], targets:[], minMoves:1,
      hint:[5,0,3,1],
      desc:{ ko:'말은 장애물을 뛰어넘을 수 있어요!', en:'Knights can jump over obstacles!' }},
    // Stage 3: 2수 목표 도달
    { type:'reach', piece:'wN', start:[5,0], goals:[[2,3]], blocks:[], enemies:[], targets:[], minMoves:2,
      hint:[5,0,3,1],
      desc:{ ko:'두 번 이동해서 목표에 도달하세요!', en:'Reach the goal in two moves!' }},
    // Stage 4: 적 잡기
    { type:'capture', piece:'wN', start:[4,1], goals:[], blocks:[], enemies:[], targets:[[2,2,'bP']], minMoves:1,
      hint:[4,1,2,2],
      desc:{ ko:'말로 적을 잡으세요!', en:'Capture the enemy with the Knight!' }},
    // Stage 5: 여러 적 잡기
    { type:'capture', piece:'wN', start:[3,3], goals:[], blocks:[], enemies:[], targets:[[1,2,'bP'],[1,4,'bP'],[5,2,'bP']], minMoves:5,
      hint:[3,3,1,2],
      desc:{ ko:'말로 적을 모두 잡으세요!', en:'Capture all enemies with the Knight!' }},
    // Stage 6: 나이트 투어
    { type:'reach', piece:'wN', start:[5,0], goals:[[0,5]], blocks:[], enemies:[], targets:[], minMoves:4,
      hint:[5,0,3,1],
      desc:{ ko:'말로 반대편 끝까지 이동하세요!', en:'Move the Knight to the opposite corner!' }},
    // Stage 7: 포크 (두 적 사이)
    { type:'capture', piece:'wN', start:[5,2], goals:[], blocks:[], enemies:[], targets:[[2,0,'bR'],[2,4,'bR']], minMoves:5,
      hint:[5,2,3,3],
      desc:{ ko:'말로 두 적을 모두 잡으세요!', en:'Capture both enemies with the Knight!' }},
    // Stage 8: 나이트 마스터
    { type:'capture', piece:'wN', start:[5,0], goals:[], blocks:[], enemies:[], targets:[[3,1,'bP'],[1,2,'bP'],[2,5,'bP']], minMoves:4,
      hint:[5,0,3,1],
      desc:{ ko:'나이트 마스터 도전! 모든 적을 잡으세요!', en:'Knight Master! Capture all enemies!' }},
  ],

  // ===== 월드 4: 비숍의 모험 =====
  B: [
    // Stage 1: 대각선 이동
    { type:'reach', piece:'wB', start:[5,0], goals:[[2,3]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[5,0,2,3],
      desc:{ ko:'주교를 대각선으로 이동시켜 목표에 도달하세요!', en:'Move the Bishop diagonally to the goal!' }},
    // Stage 2: 반대 대각선
    { type:'reach', piece:'wB', start:[5,5], goals:[[2,2]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[5,5,2,2],
      desc:{ ko:'반대 방향 대각선으로 이동하세요!', en:'Move diagonally the other way!' }},
    // Stage 3: 적 잡기
    { type:'capture', piece:'wB', start:[5,0], goals:[], blocks:[], enemies:[], targets:[[3,2,'bP']], minMoves:1,
      hint:[5,0,3,2],
      desc:{ ko:'주교로 적을 잡으세요!', en:'Capture the enemy with the Bishop!' }},
    // Stage 4: 장애물 회피
    { type:'reach', piece:'wB', start:[5,1], goals:[[0,4]], blocks:[[3,3]], enemies:[], targets:[], minMoves:2,
      hint:[5,1,4,2],
      desc:{ ko:'장애물을 피해 대각선으로 이동하세요!', en:'Avoid obstacles and move diagonally!' }},
    // Stage 5: 연속 캡처
    { type:'capture', piece:'wB', start:[5,2], goals:[], blocks:[], enemies:[], targets:[[3,0,'bP'],[3,4,'bP'],[1,0,'bP']], minMoves:5,
      hint:[5,2,3,0],
      desc:{ ko:'주교로 적을 모두 잡으세요!', en:'Capture all enemies with the Bishop!' }},
    // Stage 6: 두 대각선 활용
    { type:'reach', piece:'wB', start:[5,0], goals:[[0,5]], blocks:[[2,3]], enemies:[], targets:[], minMoves:5,
      hint:[5,0,4,1],
      desc:{ ko:'여러 대각선을 활용해 목표에 도달하세요!', en:'Use multiple diagonals to reach the goal!' }},
    // Stage 7: 비숍 체크 (적 킹 위협)
    { type:'reach', piece:'wB', start:[5,0], goals:[[2,3],[4,1]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[5,0,2,3],
      desc:{ ko:'목표 칸 중 하나에 도달하세요!', en:'Reach one of the goal squares!' }},
    // Stage 8: 비숍 마스터
    { type:'capture', piece:'wB', start:[5,1], goals:[], blocks:[[3,3]], enemies:[], targets:[[4,2,'bP'],[2,4,'bP'],[0,2,'bP']], minMoves:4,
      hint:[5,1,4,2],
      desc:{ ko:'비숍 마스터 도전! 모든 적을 잡으세요!', en:'Bishop Master! Capture all enemies!' }},
  ],

  // ===== 월드 5: 퀸의 모험 =====
  Q: [
    // Stage 1: 자유로운 이동
    { type:'reach', piece:'wQ', start:[5,0], goals:[[0,5]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[5,0,0,5],
      desc:{ ko:'여왕은 어디든 갈 수 있어요! 목표에 도달하세요!', en:'The Queen can go anywhere! Reach the goal!' }},
    // Stage 2: 가로세로 이동
    { type:'reach', piece:'wQ', start:[5,0], goals:[[0,0]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[5,0,0,0],
      desc:{ ko:'여왕을 세로로 이동시켜 보세요!', en:'Move the Queen vertically!' }},
    // Stage 3: 적 잡기
    { type:'capture', piece:'wQ', start:[3,3], goals:[], blocks:[], enemies:[], targets:[[3,0,'bR'],[0,3,'bB']], minMoves:2,
      hint:[3,3,3,0],
      desc:{ ko:'여왕으로 적을 모두 잡으세요!', en:'Capture all enemies with the Queen!' }},
    // Stage 4: 장애물 미로
    { type:'reach', piece:'wQ', start:[5,0], goals:[[0,5]], blocks:[[3,2],[2,3],[5,3]], enemies:[], targets:[], minMoves:2,
      hint:[5,0,3,0],
      desc:{ ko:'장애물을 피해 목표에 도달하세요!', en:'Navigate around obstacles!' }},
    // Stage 5: 연속 캡처
    { type:'capture', piece:'wQ', start:[5,0], goals:[], blocks:[], enemies:[], targets:[[5,5,'bP'],[0,5,'bP'],[0,0,'bP']], minMoves:3,
      hint:[5,0,5,5],
      desc:{ ko:'여왕으로 적을 모두 잡으세요!', en:'Capture all enemies with the Queen!' }},
    // Stage 6: 포크
    { type:'capture', piece:'wQ', start:[5,2], goals:[], blocks:[], enemies:[], targets:[[0,2,'bR'],[2,0,'bN'],[2,4,'bB']], minMoves:3,
      hint:[5,2,0,2],
      desc:{ ko:'여왕의 강력한 힘으로 모두 잡으세요!', en:'Use the Queen\'s power to capture all!' }},
    // Stage 7: 체크메이트 느낌
    { type:'reach', piece:'wQ', start:[5,0], goals:[[0,4]], blocks:[[3,2],[2,3]], enemies:[], targets:[], minMoves:2,
      hint:[5,0,2,0],
      desc:{ ko:'목표 칸에 도달하세요!', en:'Reach the target square!' }},
    // Stage 8: 퀸 마스터
    { type:'capture', piece:'wQ', start:[5,0], goals:[], blocks:[[3,3]], enemies:[], targets:[[0,0,'bN'],[0,5,'bR'],[5,5,'bB'],[2,0,'bP']], minMoves:4,
      hint:[5,0,0,0],
      desc:{ ko:'퀸 마스터 도전! 모든 적을 잡으세요!', en:'Queen Master! Capture all enemies!' }},
  ],

  // ===== 월드 6: 킹의 모험 =====
  K: [
    // Stage 1: 한 칸씩 이동
    { type:'reach', piece:'wK', start:[4,2], goals:[[2,2]], blocks:[], enemies:[], targets:[], minMoves:2,
      hint:[4,2,3,2],
      desc:{ ko:'왕을 한 칸씩 이동시켜 목표에 도달하세요!', en:'Move the King one square at a time!' }},
    // Stage 2: 대각선 이동
    { type:'reach', piece:'wK', start:[4,0], goals:[[2,2]], blocks:[], enemies:[], targets:[], minMoves:2,
      hint:[4,0,3,1],
      desc:{ ko:'왕은 대각선으로도 이동할 수 있어요!', en:'The King can move diagonally too!' }},
    // Stage 3: 적 잡기
    { type:'capture', piece:'wK', start:[3,3], goals:[], blocks:[], enemies:[], targets:[[2,3,'bP'],[3,4,'bP']], minMoves:2,
      hint:[3,3,2,3],
      desc:{ ko:'왕으로 옆에 있는 적을 잡으세요!', en:'Capture nearby enemies with the King!' }},
    // Stage 4: 위험 피하기
    { type:'escape', piece:'wK', start:[3,3], goals:[[3,5],[5,3],[5,5]], blocks:[], enemies:[[0,3,'bR'],[3,0,'bR']], targets:[], minMoves:2,
      hint:[3,3,4,4],
      desc:{ ko:'왕이 위험해요! 안전한 칸으로 피하세요!', en:'The King is in danger! Move to safety!' }},
    // Stage 5: 안전 지대 찾기
    { type:'escape', piece:'wK', start:[2,2], goals:[[4,4],[4,0],[0,4]], blocks:[], enemies:[[0,2,'bR'],[2,5,'bR']], targets:[], minMoves:2,
      hint:[2,2,3,3],
      desc:{ ko:'적의 공격을 피해 안전한 곳으로 이동하세요!', en:'Find a safe zone away from enemy attacks!' }},
    // Stage 6: 킹 vs 폰
    { type:'capture', piece:'wK', start:[4,2], goals:[], blocks:[], enemies:[], targets:[[3,2,'bP'],[3,3,'bP'],[2,2,'bP']], minMoves:3,
      hint:[4,2,3,2],
      desc:{ ko:'왕으로 적 병사를 모두 잡으세요!', en:'Capture all enemy Pawns with the King!' }},
    // Stage 7: 위험 속 캡처
    { type:'capture', piece:'wK', start:[3,3], goals:[], blocks:[], enemies:[[0,0,'bB']], targets:[[2,4,'bP'],[4,2,'bP']], minMoves:3,
      hint:[3,3,2,4],
      desc:{ ko:'적의 위협을 피하면서 적을 잡으세요!', en:'Capture enemies while avoiding threats!' }},
    // Stage 8: 킹 마스터
    { type:'capture', piece:'wK', start:[5,0], goals:[], blocks:[[3,1]], enemies:[], targets:[[4,0,'bP'],[4,1,'bP'],[3,0,'bP']], minMoves:3,
      hint:[5,0,4,0],
      desc:{ ko:'킹 마스터 도전! 모든 적을 잡으세요!', en:'King Master! Capture all enemies!' }},
  ]
};

// ===== 미션 진행도 관리 =====
function getMissionProgress() {
  try {
    return JSON.parse(localStorage.getItem('mission_progress_v2')) || {};
  } catch { return {}; }
}

function saveMissionProgress(pieceKey, missionIdx, stars) {
  const progress = getMissionProgress();
  if (!progress[pieceKey]) progress[pieceKey] = {};
  const prev = progress[pieceKey][missionIdx] || 0;
  progress[pieceKey][missionIdx] = Math.max(prev, stars);
  localStorage.setItem('mission_progress_v2', JSON.stringify(progress));
}

function getMissionStars(pieceKey, missionIdx) {
  const progress = getMissionProgress();
  return (progress[pieceKey] && progress[pieceKey][missionIdx]) || 0;
}

function isMissionCleared(pieceKey, missionIdx) {
  return getMissionStars(pieceKey, missionIdx) > 0;
}

function getPieceClearCount(pieceKey) {
  const progress = getMissionProgress();
  if (!progress[pieceKey]) return 0;
  return Object.values(progress[pieceKey]).filter(v => v > 0).length;
}

function getPieceTotalStars(pieceKey) {
  const progress = getMissionProgress();
  if (!progress[pieceKey]) return 0;
  return Object.values(progress[pieceKey]).reduce((a, b) => a + b, 0);
}

function getTotalStars() {
  const progress = getMissionProgress();
  let total = 0;
  for (const key of Object.keys(progress)) {
    total += Object.values(progress[key]).reduce((a, b) => a + b, 0);
  }
  return total;
}

function calculateStars(moveCount, minMoves) {
  if (moveCount <= minMoves) return 3;
  if (moveCount <= minMoves + 1) return 2;
  return 1;
}
