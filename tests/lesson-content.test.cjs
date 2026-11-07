// 체스 수업 교재 45판(3수업 × 5단계 × 3판)과 판정 (docs/lessons/LESSON_REDESIGN_V2.md)
// 판 배치는 scripts/generate-lesson-levels.cjs가 만든 js/lesson-levels.js. 여기서는 저장된 판을 엔진으로 다시 확인한다.
const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
const J=(run,expr)=>JSON.parse(run(`JSON.stringify(${expr})`));

test('45판 모두 합법적인 시작이고, 저장된 안전한 수 개수가 엔진 결과와 같으며, 예시 정답은 성공·함정은 실제 잡기로 실패한다',()=>{
 const {run}=load();
 assert.deepEqual(J(run,'LESSONS.map(l=>[l.id,l.version,l.levels.length])'),[['protect-escape-v3',3,15],['protect-capture-v3',3,15],['protect-all-v3',3,15]]);
 const all=J(run,`LESSONS.map(lesson=>lesson.levels.map((level,i)=>{const g=lessonLevelGame(level),moves=g.allMoves(),outs=moves.map(m=>[m,lessonOutcome(g,m,level)]);
   const w=lessonOutcome(g,level.witness,level),t=lessonOutcome(g,level.trap,level),kings=[];g.board.forEach((row,r)=>row.forEach((p,c)=>{if(p&&p[1]==='K')kings.push([p,r]);}));
   const threats=lessonThreats(g),replyLegal=t.reply&&t.after.clone().legalMoves(t.reply[0],t.reply[1]).some(([r,c])=>r===t.reply[2]&&c===t.reply[3]);
   return {lesson:lesson.id,id:level.id,tier:level.tier,score:level.score,goal:level.goal,mustCapture:!!level.mustCapture,status:g.status,turn:g.turn,castle:g.castlingKey(),blackCheck:g.isAttacked(g.board,...g.findKing('b'),'w'),
    kings:kings.sort(),moves:moves.length,dataMoves:level.moves,safe:outs.filter(([,o])=>o.result==='success').length,dataSafe:level.safe,checkOnly:outs.filter(([,o])=>o.check).length,
    goalMoves:outs.filter(([,o])=>o.result==='goal').length,failCaps:outs.filter(([m,o])=>g.board[m[2]][m[3]]&&o.result==='fail').length,threats:threats.length,
    kingAttacker:threats.some(m=>g.board[m[0]][m[1]][1]==='K'),kingCapture:outs.some(([m])=>g.board[m[2]][m[3]]&&g.board[m[0]][m[1]][1]==='K'),
    witness:w.result,trap:t.result,replyLegal,victim:t.victim,promo:moves.some(m=>m[4])};}))`);
 for(const levels of all){
  const key=levels[0].lesson.replace(/^protect-|-v3$/g,'');
  assert.deepEqual(levels.map(l=>l.id),Array.from({length:15},(_,i)=>`${key}-${String(i+1).padStart(2,'0')}`));
  assert.deepEqual(levels.map(l=>l.tier),[1,1,1,2,2,2,3,3,3,4,4,4,5,5,5],'5단계 × 3판');
  for(let i=1;i<15;i++)assert.ok(levels[i].score>=levels[i-1].score,`${levels[i].id} 난이도 점수가 앞 판보다 낮지 않음 (${levels[i-1].score} → ${levels[i].score})`);
  for(const l of levels){
   const label=l.id;
   assert.equal(l.status,'playing',label);assert.equal(l.turn,'w');assert.equal(l.castle,'-');assert.equal(l.blackCheck,false,label);assert.equal(l.promo,false,label);
   assert.deepEqual(l.kings.map(k=>k[0]),['bK','wK'],label);assert.ok(l.kings[0][1]<=1&&l.kings[1][1]>=6,label+' 킹은 자기 진영(흰색 아래·검은색 위)');
   assert.equal(l.moves,l.dataMoves,label+' 전체 수');assert.equal(l.safe,l.dataSafe,label+' 안전한 수');assert.ok(l.safe>=1,label);assert.equal(l.checkOnly,0,label+' 체크 덕분에만 안전한 수 없음');
   assert.equal(l.witness,'success',label);assert.equal(l.trap,'fail',label);assert.equal(l.replyLegal,true,label+' 응수는 실제 합법 수');assert.equal(l.victim[0],'w');
   assert.equal(l.kingAttacker,false,label+' 상대 킹이 공격자가 아님');assert.equal(l.kingCapture,false,label+' 내 킹으로 잡는 수 없음');
   assert.ok([...l.goal].length<=40,label+' 목표는 두 줄 안');
   if(l.mustCapture){assert.ok(l.goalMoves>0,label+' 잡지 않는 수는 목표 미달');assert.ok(l.failCaps>=1,label+' 되잡히는 잡기');}
   else assert.ok(l.threats>=1,label+' 처음부터 노려지는 내 말');
  }
  // 단계가 오를수록 평균적으로 안전한 수의 비율이 낮아지거나 말이 많아진다(점수 평균 상승).
  const avg=t=>levels.filter(l=>l.tier===t).reduce((s,l)=>s+l.score,0)/3;
  for(let t=2;t<=5;t++)assert.ok(avg(t)>avg(t-1),`${key} ${t}단계 평균 난이도 상승`);
 }
 assert.equal(run('LESSON_TIER_NAMES.join()'),'첫걸음,쉬움,보통,어려움,도전');
});

// 설명 문장은 판 데이터와 무관하게 고정한 배치로 확인한다.
const FIX={escape:{fen:'7k/6b1/8/8/3R4/8/K7/8 w - - 0 1'},knight:{fen:'k7/8/2n5/4R3/8/8/8/7K w - - 0 1'},guard:{fen:'7k/1b6/8/8/4p3/8/4R2p/K7 w - - 0 1',mustCapture:true},
 king:{fen:'6k1/2p2p2/8/1N6/8/1B6/8/7K w - - 0 1',mustCapture:true},queen:{fen:'6k1/8/2n4p/8/1b6/8/3Q4/K7 w - - 0 1',mustCapture:true},two:{fen:'6k1/8/2n5/4p3/3Q4/8/8/6K1 w - - 0 1'},fork:{fen:'8/5pk1/8/1R3B2/3n4/4P3/8/K7 w - - 0 1'}};
test('설명은 무엇이 일어났는지와 상대 말의 움직임을 말하고, 여러 공격자·되잡기·공격자 잡기·잡기 미달·체크를 구분한다',()=>{
 const {run}=load();
 const explain=(fix,move)=>run(`(()=>{const level=${JSON.stringify(fix)},g=lessonLevelGame(level),m=${JSON.stringify(move)};return lessonExplain(level,g,m,lessonOutcome(g,m,level));})()`);
 assert.equal(explain(FIX.escape,[6,0,5,0]),'상대 비숍이 내 룩을 잡았어요. 처음부터 노려지던 룩이에요. 비숍은 대각선으로 끝까지 와요.');
 assert.equal(explain(FIX.escape,[4,3,3,3]),'내 룩이 상대 비숍의 길에서 벗어났어요.');
 assert.equal(explain(FIX.knight,[3,4,1,4]),'상대 나이트가 내 룩을 잡았어요. 나이트는 L자로 뛰어 다른 말을 넘어와요.');
 assert.equal(explain(FIX.guard,[6,4,4,4]),'폰은 잡았지만 상대 비숍이 내 룩을 다시 잡았어요. 비숍은 대각선으로 끝까지 와요.');
 assert.equal(explain(FIX.guard,[6,4,6,7]),'폰을 잡았고, 상대는 내 말을 다시 잡을 수 없어요.','체크가 걸려도 원래 안전하면 체크 문구 없음');
 assert.equal(explain(FIX.guard,[6,4,5,4]),'이번에는 상대 말을 하나 잡아야 해요. 테두리 칸이 잡을 수 있는 곳이에요.');
 assert.equal(explain(FIX.king,[5,1,1,5]),'폰은 잡았지만 상대 킹이 내 비숍을 다시 잡았어요. 킹은 바로 옆 칸을 잡아요.');
 assert.equal(explain(FIX.queen,[6,3,2,7]),'폰을 잡으면서 내 퀸도 안전한 칸으로 피했어요.');
 assert.equal(explain(FIX.two,[4,3,5,2]),'내 퀸이 상대 나이트와 폰의 길에서 벗어났어요.');
 assert.equal(explain(FIX.fork,[5,4,4,3]),'나를 노리던 상대 나이트를 먼저 잡아서 위협을 없앴어요.');
 assert.equal(explain(FIX.fork,[3,1,0,1]),'상대 나이트가 내 비숍을 잡았어요. 처음부터 노려지던 비숍이에요. 나이트는 L자로 뛰어 다른 말을 넘어와요.');
 // 응수는 가장 값진 내 말을 잡는다: 포크에서 룩(5)이 비숍(3)보다 먼저.
 assert.equal(run(`(()=>{const level=${JSON.stringify(FIX.fork)},g=lessonLevelGame(level);return lessonOutcome(g,[7,0,6,0],level).victim;})()`),'wR');
});

test('흑의 잡기를 조사해도 원래 판의 차례·기록은 그대로이고, 예전 v1·v2 수업 ID는 버릴 대상으로만 인식한다',()=>{
 const {run}=load();
 const before=run("(()=>{globalThis.g=lessonLevelGame(LESSONS[0].levels[0]);return JSON.stringify([g.turn,g.positionCounts]);})()");
 run('lessonThreats(g);lessonCaptures(g,"w");lessonDefended(g)');assert.equal(run('JSON.stringify([g.turn,g.positionCounts])'),before);
 assert.deepEqual(J(run,"['protect-spot-v1','protect-escape-v1','protect-capture-v1','protect-escape-v2','protect-capture-v2','protect-all-v2','protect-escape-v3','x'].map(lessonRetired)"),[true,true,true,true,true,true,false,false]);
 assert.equal(run("lessonById('protect-escape-v2')"),null);
});
