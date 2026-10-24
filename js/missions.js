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
      desc:{ ko:'폰을 앞으로 이동시켜 목표에 도달하세요!', en:'Move the Pawn forward to the goal!' }},
    // Stage 2: 두 칸 점프
    { type:'reach', piece:'wP', start:[4,3], goals:[[2,3]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[4,3,2,3],
      desc:{ ko:'폰은 처음에 두 칸을 갈 수 있어요!', en:'Pawns can move two squares on their first move!' }},
    // Stage 3: 대각선 공격
    { type:'capture', piece:'wP', start:[4,2], goals:[], blocks:[], enemies:[], targets:[[3,3,'bP']], minMoves:1,
      hint:[4,2,3,3],
      desc:{ ko:'폰은 대각선으로 상대를 잡아요!', en:'Pawns capture diagonally!' }},
    // Stage 4: 장애물 피하기
    { type:'reach', piece:'wP', start:[4,2], goals:[[2,3]], blocks:[[3,2]], enemies:[], targets:[[3,3,'bP']], minMoves:2,
      hint:[4,2,3,3],
      desc:{ ko:'장애물을 피해 상대를 잡으며 전진하세요!', en:'Avoid the obstacle and capture to advance!' }},
    // Stage 5: 적을 모두 잡아라
    { type:'capture', piece:'wP', start:[4,2], goals:[], blocks:[], enemies:[], targets:[[3,3,'bP'],[2,2,'bP']], minMoves:2,
      hint:[4,2,3,3],
      desc:{ ko:'대각선 공격으로 적을 모두 잡으세요!', en:'Capture all enemies with diagonal attacks!' }},
    // Stage 6: 미로 탈출
    { type:'reach', piece:'wP', start:[4,1], goals:[[1,4]], blocks:[[3,1]], enemies:[], targets:[[3,2,'bP'],[2,3,'bP'],[1,4,'bP']], minMoves:3,
      hint:[4,1,3,2],
      desc:{ ko:'적을 잡으며 미로를 통과하세요!', en:'Capture enemies to navigate through!' }},
    // Stage 7: 끝까지 전진 (프로모션 느낌)
    { type:'reach', piece:'wP', start:[4,2], goals:[[0,2]], blocks:[], enemies:[], targets:[], minMoves:3,
      hint:[4,2,2,2],
      desc:{ ko:'끝줄까지 전진하세요! 폰이 강해져요!', en:'Advance to the last row! The Pawn gets promoted!' }},
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
      desc:{ ko:'룩을 가로로 이동시켜 목표에 도달하세요!', en:'Move the Rook horizontally to the goal!' }},
    // Stage 2: 세로 이동
    { type:'reach', piece:'wR', start:[5,2], goals:[[0,2]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[5,2,0,2],
      desc:{ ko:'룩을 세로로 이동시켜 목표에 도달하세요!', en:'Move the Rook vertically to the goal!' }},
    // Stage 3: 적 잡기
    { type:'capture', piece:'wR', start:[5,0], goals:[], blocks:[], enemies:[], targets:[[5,4,'bP']], minMoves:1,
      hint:[5,0,5,4],
      desc:{ ko:'룩으로 적을 잡으세요!', en:'Capture the enemy with the Rook!' }},
    // Stage 4: 장애물 미로
    { type:'reach', piece:'wR', start:[5,0], goals:[[0,5]], blocks:[[5,3],[2,0]], enemies:[], targets:[], minMoves:3,
      hint:[5,0,5,2],
      desc:{ ko:'장애물을 피해 목표에 도달하세요!', en:'Navigate around obstacles to the goal!' }},
    // Stage 5: 연속 캡처
    { type:'capture', piece:'wR', start:[5,0], goals:[], blocks:[], enemies:[], targets:[[5,4,'bP'],[1,0,'bP'],[1,4,'bP']], minMoves:3,
      hint:[5,0,5,4],
      desc:{ ko:'룩으로 적을 모두 잡으세요!', en:'Capture all enemies with the Rook!' }},
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
      desc:{ ko:'나이트를 L자로 이동시켜 목표에 도달하세요!', en:'Move the Knight in an L-shape!' }},
    // Stage 2: 장애물 뛰어넘기
    { type:'reach', piece:'wN', start:[5,0], goals:[[3,1]], blocks:[[4,0],[4,1],[5,1]], enemies:[], targets:[], minMoves:1,
      hint:[5,0,3,1],
      desc:{ ko:'나이트는 장애물을 뛰어넘을 수 있어요!', en:'Knights can jump over obstacles!' }},
    // Stage 3: 2수 목표 도달
    { type:'reach', piece:'wN', start:[5,0], goals:[[2,3]], blocks:[], enemies:[], targets:[], minMoves:2,
      hint:[5,0,3,1],
      desc:{ ko:'두 번 이동해서 목표에 도달하세요!', en:'Reach the goal in two moves!' }},
    // Stage 4: 적 잡기
    { type:'capture', piece:'wN', start:[4,1], goals:[], blocks:[], enemies:[], targets:[[2,2,'bP']], minMoves:1,
      hint:[4,1,2,2],
      desc:{ ko:'나이트로 적을 잡으세요!', en:'Capture the enemy with the Knight!' }},
    // Stage 5: 여러 적 잡기
    { type:'capture', piece:'wN', start:[3,3], goals:[], blocks:[], enemies:[], targets:[[1,2,'bP'],[1,4,'bP'],[5,2,'bP']], minMoves:5,
      hint:[3,3,1,2],
      desc:{ ko:'나이트로 적을 모두 잡으세요!', en:'Capture all enemies with the Knight!' }},
    // Stage 6: 나이트 투어
    { type:'reach', piece:'wN', start:[5,0], goals:[[0,5]], blocks:[], enemies:[], targets:[], minMoves:4,
      hint:[5,0,3,1],
      desc:{ ko:'나이트로 반대편 끝까지 이동하세요!', en:'Move the Knight to the opposite corner!' }},
    // Stage 7: 포크 (두 적 사이)
    { type:'capture', piece:'wN', start:[5,2], goals:[], blocks:[], enemies:[], targets:[[2,0,'bR'],[2,4,'bR']], minMoves:5,
      hint:[5,2,3,3],
      desc:{ ko:'나이트로 두 적을 모두 잡으세요!', en:'Capture both enemies with the Knight!' }},
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
      desc:{ ko:'비숍을 대각선으로 이동시켜 목표에 도달하세요!', en:'Move the Bishop diagonally to the goal!' }},
    // Stage 2: 반대 대각선
    { type:'reach', piece:'wB', start:[5,5], goals:[[2,2]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[5,5,2,2],
      desc:{ ko:'반대 방향 대각선으로 이동하세요!', en:'Move diagonally the other way!' }},
    // Stage 3: 적 잡기
    { type:'capture', piece:'wB', start:[5,0], goals:[], blocks:[], enemies:[], targets:[[3,2,'bP']], minMoves:1,
      hint:[5,0,3,2],
      desc:{ ko:'비숍으로 적을 잡으세요!', en:'Capture the enemy with the Bishop!' }},
    // Stage 4: 장애물 회피
    { type:'reach', piece:'wB', start:[5,1], goals:[[0,4]], blocks:[[3,3]], enemies:[], targets:[], minMoves:2,
      hint:[5,1,4,2],
      desc:{ ko:'장애물을 피해 대각선으로 이동하세요!', en:'Avoid obstacles and move diagonally!' }},
    // Stage 5: 연속 캡처
    { type:'capture', piece:'wB', start:[5,2], goals:[], blocks:[], enemies:[], targets:[[3,0,'bP'],[3,4,'bP'],[1,0,'bP']], minMoves:5,
      hint:[5,2,3,0],
      desc:{ ko:'비숍으로 적을 모두 잡으세요!', en:'Capture all enemies with the Bishop!' }},
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
      desc:{ ko:'퀸은 어디든 갈 수 있어요! 목표에 도달하세요!', en:'The Queen can go anywhere! Reach the goal!' }},
    // Stage 2: 가로세로 이동
    { type:'reach', piece:'wQ', start:[5,0], goals:[[0,0]], blocks:[], enemies:[], targets:[], minMoves:1,
      hint:[5,0,0,0],
      desc:{ ko:'퀸을 세로로 이동시켜 보세요!', en:'Move the Queen vertically!' }},
    // Stage 3: 적 잡기
    { type:'capture', piece:'wQ', start:[3,3], goals:[], blocks:[], enemies:[], targets:[[3,0,'bR'],[0,3,'bB']], minMoves:2,
      hint:[3,3,3,0],
      desc:{ ko:'퀸으로 적을 모두 잡으세요!', en:'Capture all enemies with the Queen!' }},
    // Stage 4: 장애물 미로
    { type:'reach', piece:'wQ', start:[5,0], goals:[[0,5]], blocks:[[3,2],[2,3],[5,3]], enemies:[], targets:[], minMoves:2,
      hint:[5,0,3,0],
      desc:{ ko:'장애물을 피해 목표에 도달하세요!', en:'Navigate around obstacles!' }},
    // Stage 5: 연속 캡처
    { type:'capture', piece:'wQ', start:[5,0], goals:[], blocks:[], enemies:[], targets:[[5,5,'bP'],[0,5,'bP'],[0,0,'bP']], minMoves:3,
      hint:[5,0,5,5],
      desc:{ ko:'퀸으로 적을 모두 잡으세요!', en:'Capture all enemies with the Queen!' }},
    // Stage 6: 포크
    { type:'capture', piece:'wQ', start:[5,2], goals:[], blocks:[], enemies:[], targets:[[0,2,'bR'],[2,0,'bN'],[2,4,'bB']], minMoves:3,
      hint:[5,2,0,2],
      desc:{ ko:'퀸의 강력한 힘으로 모두 잡으세요!', en:'Use the Queen\'s power to capture all!' }},
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
      desc:{ ko:'킹을 한 칸씩 이동시켜 목표에 도달하세요!', en:'Move the King one square at a time!' }},
    // Stage 2: 대각선 이동
    { type:'reach', piece:'wK', start:[4,0], goals:[[2,2]], blocks:[], enemies:[], targets:[], minMoves:2,
      hint:[4,0,3,1],
      desc:{ ko:'킹은 대각선으로도 이동할 수 있어요!', en:'The King can move diagonally too!' }},
    // Stage 3: 적 잡기
    { type:'capture', piece:'wK', start:[3,3], goals:[], blocks:[], enemies:[], targets:[[2,3,'bP'],[3,4,'bP']], minMoves:2,
      hint:[3,3,2,3],
      desc:{ ko:'킹으로 옆에 있는 적을 잡으세요!', en:'Capture nearby enemies with the King!' }},
    // Stage 4: 위험 피하기
    { type:'escape', piece:'wK', start:[3,3], goals:[[3,5],[5,3],[5,5]], blocks:[], enemies:[[0,3,'bR'],[3,0,'bR']], targets:[], minMoves:2,
      hint:[3,3,4,4],
      desc:{ ko:'킹이 위험해요! 안전한 칸으로 피하세요!', en:'The King is in danger! Move to safety!' }},
    // Stage 5: 안전 지대 찾기
    { type:'escape', piece:'wK', start:[2,2], goals:[[4,4],[4,0],[0,4]], blocks:[], enemies:[[0,2,'bR'],[2,5,'bR']], targets:[], minMoves:2,
      hint:[2,2,3,3],
      desc:{ ko:'적의 공격을 피해 안전한 곳으로 이동하세요!', en:'Find a safe zone away from enemy attacks!' }},
    // Stage 6: 킹 vs 폰
    { type:'capture', piece:'wK', start:[4,2], goals:[], blocks:[], enemies:[], targets:[[3,2,'bP'],[3,3,'bP'],[2,2,'bP']], minMoves:3,
      hint:[4,2,3,2],
      desc:{ ko:'킹으로 적 폰을 모두 잡으세요!', en:'Capture all enemy Pawns with the King!' }},
    // Stage 7: 위험 속 캡처
    { type:'capture', piece:'wK', start:[3,3], goals:[], blocks:[], enemies:[[0,0,'bB']], targets:[[2,4,'bP'],[4,2,'bP']], minMoves:4,
      hint:[3,3,2,4],
      desc:{ ko:'적의 위협을 피하면서 적을 잡으세요!', en:'Capture enemies while avoiding threats!' }},
    // Stage 8: 킹 마스터
    { type:'capture', piece:'wK', start:[5,0], goals:[], blocks:[[3,1]], enemies:[], targets:[[4,0,'bP'],[4,1,'bP'],[3,0,'bP']], minMoves:3,
      hint:[5,0,4,0],
      desc:{ ko:'킹 마스터 도전! 모든 적을 잡으세요!', en:'King Master! Capture all enemies!' }},
  ]
};

// Original IDs remain archived in the ledger when a lesson is redesigned.
for(const [piece,missions] of Object.entries(MISSIONS)) missions.forEach((m,i)=>{m.id=`adventure-${piece.toLowerCase()}-${i+1}-v1`;m.version=1;});
// Keep each original ID when making the learning sequence gentler.
MISSIONS.P[0].goals=[[3,2]];MISSIONS.P[0].hint=[4,2,3,2];MISSIONS.P[0].desc.ko='폰을 앞으로 한 칸 움직여요.';
MISSIONS.N[4].targets=[[1,2,'bP'],[3,1,'bP']];MISSIONS.N[4].minMoves=2;
MISSIONS.B[4].targets=[[3,0,'bP'],[1,2,'bP']];MISSIONS.B[4].minMoves=2;
MISSIONS.B=[0,1,6,2,3,4,5,7].map(i=>MISSIONS.B[i]);
MISSIONS.B[6].optional=true;MISSIONS.N[6].optional=true;MISSIONS.N[7].optional=true;MISSIONS.K[6].optional=true;
MISSIONS.Q[0].desc.ko='퀸은 가로·세로·대각선으로 가요. 깃발을 찾아요.';
const ROOK_LESSONS = [{"id": "rook.horizontal.v1", "size": 4, "start": [3, 0], "goals": [[3, 3]], "targets": [], "blocks": [], "objective": "reach", "par": 1, "prompt": "룩을 반짝이는 깃발로 보내요."}, {"id": "rook.vertical.v1", "size": 4, "start": [3, 3], "goals": [[0, 3]], "targets": [], "blocks": [], "objective": "reach", "par": 1, "prompt": "이번에는 위로 쭉 가요."}, {"id": "rook.capture.v1", "size": 4, "start": [3, 0], "goals": [], "targets": [[3, 3]], "blocks": [], "objective": "captureAll", "par": 1, "prompt": "같은 줄의 연습 말을 잡아요."}, {"id": "rook.capture-chain.v1", "size": 4, "start": [3, 0], "goals": [], "targets": [[3, 3], [0, 3]], "blocks": [], "objective": "captureAll", "par": 2, "prompt": "연습 말 두 개를 잡아요."}, {"id": "rook.turn.v1", "size": 4, "start": [3, 0], "goals": [[0, 3]], "targets": [], "blocks": [], "objective": "reach", "par": 2, "prompt": "한 번 꺾어서 깃발로 가요."}, {"id": "rook.obstacle.v1", "size": 4, "start": [3, 0], "goals": [[3, 3]], "targets": [], "blocks": [[3, 1]], "objective": "reach", "par": 3, "prompt": "상자가 없는 길로 돌아가요."}, {"id": "rook.transfer.v1", "size": 5, "start": [4, 0], "goals": [[0, 4]], "targets": [], "blocks": [[2, 0], [4, 2]], "objective": "reach", "par": 3, "prompt": "새로운 길에서도 깃발을 찾아요."}, {"id": "rook.challenge.v1", "size": 5, "start": [4, 0], "goals": [], "targets": [[4, 4], [0, 4], [0, 0]], "blocks": [], "objective": "captureAll", "par": 3, "optional": true, "prompt": "연습 말 세 개를 어떤 순서로 잡을까요?"}];
MISSIONS.R = ROOK_LESSONS.map(m=>({...m,piece:'wR',type:m.objective==='reach'?'reach':'capture',targets:m.targets.map(([r,c])=>[r,c,'bP']),enemies:[],minMoves:m.par,desc:{ko:m.prompt,en:m.prompt},version:1}));

function progressLedger() {
  let saved=readData('progress_v3',null);
  if(saved?.version===3 && saved.missions && saved.puzzles && saved.mini){saved.achievements ||= {};return saved;}
  saved={version:3,missions:{},puzzles:{},mini:{},achievements:{}};
  const legacy=readData('mission_progress_v2',{});
  for(const [piece,stages]of Object.entries(legacy||{})) for(const [index,stars]of Object.entries(stages||{}))
    saved.missions[`adventure-${piece.toLowerCase()}-${Number(index)+1}-v1`]=Math.min(3,Math.max(0,Number(stars)||0));
  for(const [id,stars]of Object.entries(readData('puzzle_stars',{})))saved.puzzles['legacy-'+id]=Math.min(3,Math.max(0,Number(stars)||0));
  for(const [id,stars]of Object.entries(readData('minigame_stars',{})))saved.mini[id]=Math.min(3,Math.max(0,Number(stars)||0));
  writeData('progress_v3',saved);return saved;
}
function awardStars(section,id,stars) {
  const p=progressLedger(),before=getAllStars();p[section][id]=Math.max(p[section][id]||0,stars);p.completions ||= {};
  const assisted=(state.supportLevel||0)>0 || !!state.kt?.demoUsed && state.activeKind==='knight';
  const joint=state.activeKind==='knight'&&state.kt?.family;
  const previous=p.completions[id]||{};
  p.completions[id]={completedAt:Date.now(),assisted,joint,independent:previous.independent||(!assisted&&!joint),count:(previous.count||0)+1};
  writeData('progress_v3',p);
  const after=getAllStars();
  if(typeof SKIN_UNLOCK!=='undefined')for(const [name,required]of Object.entries(SKIN_UNLOCK))if(before<required&&after>=required)writeData('pending_skin',name);
}
function getMissionProgress() {
  const ledger=progressLedger();return Object.fromEntries(Object.entries(MISSIONS).map(([piece,ms])=>[piece,Object.fromEntries(ms.map((m,i)=>[i,ledger.missions[m.id]||0]))]));
}
function saveMissionProgress(piece,index,stars){awardStars('missions',MISSIONS[piece][index].id,stars);}
function getMissionStars(piece,index){return progressLedger().missions[MISSIONS[piece][index].id]||0;}
function isMissionCleared(piece,index){return getMissionStars(piece,index)>0;}
function getPieceClearCount(piece){return MISSIONS[piece].filter((m,i)=>isMissionCleared(piece,i)).length;}
function getPieceTotalStars(piece){return MISSIONS[piece].reduce((sum,m,i)=>sum+getMissionStars(piece,i),0);}
function getTotalStars(){return Object.values(progressLedger().missions).reduce((a,b)=>a+b,0);}
function calculateStars(count,par){return count<=par?3:count<=par+1?2:1;}
function getPuzzleProgress(){return progressLedger().puzzles;}
function savePuzzleStars(level,index,stars){awardStars('puzzles',PUZZLES[index].id,stars);}
function getTotalPuzzleStars(){return Object.values(getPuzzleProgress()).reduce((a,b)=>a+b,0);}
function getMiniGameProgress(){return progressLedger().mini;}
function saveMiniGameStars(type,id,stars){const key=type==='collector'?COLLECTOR_LEVELS[id].id:type+'_'+id;awardStars('mini',key,stars);}
function getTotalMiniGameStars(){return Object.values(getMiniGameProgress()).reduce((a,b)=>a+b,0);}
function getAllStars(){const p=progressLedger();return [...Object.values(p.missions),...Object.values(p.puzzles),...Object.values(p.mini),...Object.values(p.achievements||{})].reduce((a,b)=>a+b,0);}
