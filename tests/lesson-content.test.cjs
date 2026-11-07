// 체스 수업 교재 9장면과 판정 술어 (docs/lessons/INTERACTIVE_LESSONS_DESIGN.md §5·§10)
const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
const scenesJSON=require('../docs/lessons/LESSON_SCENES_V1.json').scenes;
const J=(run,expr)=>JSON.parse(run(`JSON.stringify(${expr})`));

test('교재 9장면: 왕 각 1개, 백 차례·진행 중, 캐슬링 없음, 변환 배치 고정, 목표와 성공 수가 실제로 있다',()=>{
 const {run}=load();
 assert.deepEqual(J(run,"[lessonMirrorFEN(LESSON_BASE_FENS.B),lessonMirrorFEN(LESSON_BASE_FENS.C),lessonMirrorFEN(LESSON_BASE_FENS.D)]"),['k6r/8/8/8/8/7B/8/3K4 w - - 0 1','k7/8/2n5/4R3/8/8/8/7K w - - 0 1','k7/6b1/8/8/3p4/8/p2R4/7K w - - 0 1']);
 const scenes=J(run,"LESSONS.flatMap(l=>l.scenes.map(s=>({lesson:l.id,task:l.task,...s})))");assert.equal(scenes.length,9);
 for(const [i,s] of scenes.entries()){
  const fromJSON=scenesJSON[i];assert.equal(s.id,fromJSON.id);assert.equal(s.fen,fromJSON.fen);assert.deepEqual(s.focusSquare,fromJSON.focusSquare);assert.equal(s.role,fromJSON.role);
  const r=J(run,`(()=>{const l=lessonById('${s.lesson}'),s=lessonScene(l,'${s.id}'),g=lessonSceneGame(s);return {kings:g.board.flat().filter(p=>p&&p[1]==='K').sort(),status:g.status,turn:g.turn,castle:g.castlingKey(),focusMoves:lessonLegalMoves(g,s.focusSquare).length,
   targets:l.task==='spot'?lessonSpotTargets(g):null,safe:l.task==='spot'?null:lessonSafeMoves(g,s,l.task),cands:l.task==='spot'?null:lessonCandidates(g,s,l.task).map(m=>[m,lessonOutcome(g,m).reply])};})()`);
  assert.deepEqual(r.kings,['bK','wK'],s.id);assert.equal(r.status,'playing',s.id);assert.equal(r.turn,'w');assert.equal(r.castle,'-');assert.ok(r.focusMoves>0,s.id+' 핀·체크로 대상 말이 묶이지 않음');
  if(s.task==='spot'){assert.deepEqual(r.targets,[s.focusSquare],s.id);assert.deepEqual(fromJSON.validation.targetCaptures.map(m=>m.slice(2)),r.targets);}
  else{
   assert.ok(r.safe.length>=1,s.id);
   // JSON에 기록한 분기와 엔진 결과가 같다. 위험한 수의 응수는 항상 그 말을 잡는 실제 합법 수.
   const expected=fromJSON.validation.moves.filter(m=>s.task==='escape'||r.cands.some(([c])=>String(c)===String(m.move)));assert.deepEqual(r.cands.map(([m,reply])=>[m,reply]),expected.map(m=>[m.move,m.reply]));
   if(s.witnessFailure)assert.deepEqual(r.cands.find(([m])=>String(m)===String(s.witnessFailure.move))[1],s.witnessFailure.reply);
   assert.ok(r.safe.some(m=>String(m)===String(s.witnessSuccess.move)));
  }
 }
});
