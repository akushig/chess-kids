// 체스 수업 v2 교재 15판과 판정 (docs/lessons/LESSON_REDESIGN_V2.md)
const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
const J=(run,expr)=>JSON.parse(run(`JSON.stringify(${expr})`));
// 설계 때 엔진으로 센 판별 안전한 수의 개수. 판이 바뀌면 이 숫자와 설계 문서를 함께 고친다.
const SAFE_COUNTS={'protect-escape-v2':[14,6,12,2,13],'protect-capture-v2':[1,1,1,1,1],'protect-all-v2':[7,18,1,7,5]};

test('15판 모두 합법적인 시작(왕 각 1개·백 차례·흑 체크 아님·캐슬링 없음)이고, 예시 정답은 성공·함정은 실제 잡기로 실패한다',()=>{
 const {run}=load();
 assert.deepEqual(J(run,'LESSONS.map(l=>[l.id,l.version,l.levels.length])'),[['protect-escape-v2',2,5],['protect-capture-v2',2,5],['protect-all-v2',2,5]]);
 for(const lesson of J(run,'LESSONS'))for(const [i,level] of lesson.levels.entries()){
  const r=J(run,`(()=>{const lesson=lessonById('${lesson.id}'),level=lesson.levels[${i}],g=lessonLevelGame(level);
   const all=g.allMoves().map(m=>[m,lessonOutcome(g,m,level)]),safe=all.filter(([,o])=>o.result==='success');
   const w=lessonOutcome(g,level.witness,level),t=lessonOutcome(g,level.trap,level);
   const replyLegal=t.reply&&(()=>{const a=t.after.clone();return a.legalMoves(t.reply[0],t.reply[1]).some(([r,c])=>r===t.reply[2]&&c===t.reply[3]);})();
   return {kings:g.board.flat().filter(p=>p&&p[1]==='K').sort(),status:g.status,turn:g.turn,castle:g.castlingKey(),blackCheck:g.isAttacked(g.board,...g.findKing('b'),'w'),
    threats:lessonThreats(g).length,safe:safe.length,checkOnly:safe.filter(([,o])=>o.check).length,goal:all.filter(([,o])=>o.result==='goal').length,
    witness:w.result,trap:t.result,replyLegal,victim:t.victim,unsafeCaptures:all.filter(([m,o])=>g.board[m[2]][m[3]]&&o.result==='fail').length};})()`);
  const label=`${lesson.id} ${i+1}`;
  assert.deepEqual(r.kings,['bK','wK'],label);assert.equal(r.status,'playing',label);assert.equal(r.turn,'w');assert.equal(r.castle,'-');assert.equal(r.blackCheck,false,label);
  assert.equal(r.safe,SAFE_COUNTS[lesson.id][i],label+' 안전한 수 개수');assert.equal(r.checkOnly,0,label+' 체크 덕분에만 안전한 수 없음');
  assert.equal(r.witness,'success',label);assert.equal(r.trap,'fail',label);assert.equal(r.replyLegal,true,label+' 응수는 실제 합법 수');assert.equal(r.victim[0],'w');
  if(lesson.id==='protect-capture-v2'){assert.ok(r.goal>0,'잡지 않는 수는 목표 미달');assert.ok(r.unsafeCaptures>=1,label+' 되잡히는 잡기');}
  else assert.ok(r.threats>=1,label+' 처음부터 노려지는 내 말');
 }
});

test('설명은 무엇이 일어났는지와 상대 말의 움직임을 말하고, 여러 공격자·되잡기·공격자 잡기·체크를 구분한다',()=>{
 const {run}=load();
 const explain=(id,i,move)=>run(`(()=>{const level=lessonById('${id}').levels[${i}],g=lessonLevelGame(level),m=${JSON.stringify(move)};return lessonExplain(level,g,m,lessonOutcome(g,m,level));})()`);
 assert.equal(explain('protect-escape-v2',0,[6,0,5,0]),'상대 비숍이 내 룩을 잡았어요. 처음부터 노려지던 룩이에요. 비숍은 대각선으로 끝까지 와요.');
 assert.equal(explain('protect-escape-v2',0,[4,3,3,3]),'내 룩이 상대 비숍의 길에서 벗어났어요.');
 assert.equal(explain('protect-escape-v2',2,[3,4,1,4]),'상대 나이트가 내 룩을 잡았어요. 나이트는 L자로 뛰어 다른 말을 넘어와요.');
 assert.equal(explain('protect-capture-v2',0,[6,4,4,4]),'폰은 잡았지만 상대 비숍이 내 룩을 다시 잡았어요. 비숍은 대각선으로 끝까지 와요.');
 assert.equal(explain('protect-capture-v2',0,[6,4,6,7]),'폰을 잡았고, 상대는 내 말을 다시 잡을 수 없어요.','체크가 걸려도 원래 안전하면 체크 문구 없음');
 assert.equal(explain('protect-capture-v2',0,[6,4,5,4]),'이번에는 상대 말을 하나 잡아야 해요. 테두리 칸이 잡을 수 있는 곳이에요.');
 assert.equal(explain('protect-capture-v2',2,[5,1,1,5]),'폰은 잡았지만 상대 킹이 내 비숍을 다시 잡았어요. 킹은 바로 옆 칸을 잡아요.');
 assert.equal(explain('protect-capture-v2',4,[6,3,2,7]),'폰을 잡으면서 내 퀸도 안전한 칸으로 피했어요.');
 assert.equal(explain('protect-all-v2',1,[4,3,5,2]),'내 퀸이 상대 나이트와 폰의 길에서 벗어났어요.');
 assert.equal(explain('protect-all-v2',2,[5,4,4,3]),'나를 노리던 상대 나이트를 먼저 잡아서 위협을 없앴어요.');
 assert.equal(explain('protect-all-v2',2,[3,1,0,1]),'상대 나이트가 내 비숍을 잡았어요. 처음부터 노려지던 비숍이에요. 나이트는 L자로 뛰어 다른 말을 넘어와요.');
 // 응수는 가장 값진 내 말을 잡는다: 포크에서 룩(5)이 비숍(3)보다 먼저.
 assert.deepEqual(J(run,"(()=>{const level=lessonById('protect-all-v2').levels[2],g=lessonLevelGame(level);return lessonOutcome(g,[0+7,0,6,0],level).victim;})()"),'wR');
});

test('흑의 잡기를 조사해도 원래 판의 차례·기록은 그대로이고, 예전 v1 수업 ID는 버릴 대상으로만 인식한다',()=>{
 const {run}=load();
 const before=run("(()=>{globalThis.g=lessonLevelGame(lessonById('protect-escape-v2').levels[0]);return JSON.stringify([g.turn,g.positionCounts]);})()");
 run('lessonThreats(g);lessonCaptures(g,"w");lessonReach(g,[1,6]);lessonDefended(g)');assert.equal(run('JSON.stringify([g.turn,g.positionCounts])'),before);
 assert.deepEqual(J(run,"['protect-spot-v1','protect-escape-v1','protect-capture-v1','protect-escape-v2','x'].map(lessonRetired)"),[true,true,true,false,false]);
 assert.equal(run("lessonById('protect-spot-v1')"),null);
});
