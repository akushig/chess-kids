// 내 대국 코치 · 유료 권한 · 나의 체스 공방 (docs/PREMIUM_COURSE.md §6~§8)
const test = require('node:test'), assert = require('node:assert/strict'), harness = require('./harness.cjs');
const J = (run, expr) => JSON.parse(run(`JSON.stringify(${expr})`));
const flush = timers => { for (let n = 0; timers.length && n < 2000; n++) timers.splice(0).forEach(cb => cb()); };
const inspect = (run, fen, move) => J(run, `coachInspect(ChessGame.fromFEN('${fen}'),${JSON.stringify(move)})`);

test('코치의 장면 찾기: 메이트를 놓침·메이트를 허용·말을 공짜로 줌·공짜 말을 놓침·포크를 놓침·이기던 판을 비김·잘한 수', () => {
  const { run } = harness();
  // 룩 a1→a8 체크메이트가 있는데 다른 수
  assert.equal(inspect(run, '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', [6, 7, 5, 7]).type, 'missedMate');
  assert.equal(inspect(run, '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', [7, 0, 0, 0]).type, 'good');
  // 내 킹 앞 폰을 움직여 뒷줄 메이트를 허용: 흑 룩 e8이 e1으로
  assert.equal(inspect(run, '4r1k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1', [7, 1, 6, 1]).type, 'allowedMate');
  // 퀸을 지켜진 폰 앞에 공짜로 둠
  assert.equal(inspect(run, '4k3/8/2p5/1p6/8/8/8/3QK3 w - - 0 1', [7, 3, 3, 3]).type, 'hung');
  // 공짜 룩을 잡지 않음
  assert.equal(inspect(run, '4k3/8/8/3r4/8/8/3Q4/4K3 w - - 0 1', [6, 3, 6, 2]).type, 'missedCapture');
  // 나이트 포크(킹+룩)를 놓침
  const fork = inspect(run, 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', [7, 4, 7, 3]);
  assert.equal(fork.type, 'missedTactic'); assert.equal(fork.shape, 'fork');
  // 이기는 중인데 스테일메이트
  assert.equal(inspect(run, 'k7/8/1K6/8/8/8/8/2Q5 w - - 0 1', [7, 2, 1, 2]).type, 'stalemated');
});

test('대국 기록: 컴퓨터 대전의 수가 기록되고, 끝나면 저장된다. 친구와 두기는 기록하지 않는다', () => {
  const h = harness();
  h.run("playStart({...getPlaySettings(),mode:'ai',small:false,preset:null,level:0,content:{version:1,type:'scene',id:'finish-1-v1',achieved:false}})");
  assert.ok(h.run('state.play.record.id'));
  h.run('playCommitMove([2,6,1,6])'); flush(h.timers);
  assert.equal(h.run('state.game.status'), 'checkmate');
  const games = J(h.run, "readData('game_records_v1',{}).games"); assert.equal(games.length, 1); assert.equal(games[0].result, 'win'); assert.deepEqual(games[0].moves, ['2616']);
  assert.match(h.run('playFinishActionsHTML()'), /코치와 이 대국 다시 보기/);
  const f = harness(); f.run("playStart({...getPlaySettings(),mode:'friend',small:false,preset:null})"); assert.equal(f.run('state.play.record'), undefined);
});

function seedGame(h) {
  // 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7# — 메이트 장면(잘한 수)과, 3.Qh5 대신 놓친 것이 없도록 만든 판에 일부러 실수 하나를 더한 기록
  const moves = ['6444', '1434', '7542', '0122', '7337', '0625', '3715'];
  h.run(`writeData('game_records_v1',{version:1,games:[{id:'demo1',at:${Date.now()},result:'win',level:2,fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',moves:${JSON.stringify(moves)},content:null}]})`);
}
test('코치 화면: 대국을 끝까지 살펴 장면과 잘한 수를 보여 주고, 장면에서 다시 두어 성공하면 기록한다', () => {
  const h = harness(); seedGame(h);
  h.run("goCoach('demo1')"); flush(h.timers);
  const a = J(h.run, 'state.coach.analysis'); assert.ok(a, '분석 완료');
  assert.equal(a.good?.kind, 'mate', '4.Qxf7# 잘한 수');
  const html = h.elements.get('screen-coach').innerHTML; assert.match(html, /잘한 수/);
  // 장면이 없으면 칭찬, 있으면 다시 두기
  if (a.scenes.length) {
    h.run('openCoachScene(0)'); assert.equal(h.run('state.coach.phase'), 'scene');
    const s = a.scenes[0], best = J(h.run, `(()=>{const s=state.coach.analysis.scenes[0],g=ChessGame.fromFEN(s.fen);return g.allMoves().map(m=>m.slice(0,4)).find(m=>coachSceneJudge(s,g,m).result==='success');})()`);
    h.run(`coachClick(${best[0]},${best[1]});coachClick(${best[2]},${best[3]})`); flush(h.timers);
    assert.equal(h.run('state.coach.scene.result'), 'success'); assert.equal(J(h.run, 'coachStats()').solved, 1, s.type);
  }
});

test('코치 무료/전체: 잠금 미리보기에서는 가장 중요한 장면 하나만 열리고, 지난 대국 목록은 최근 한 판만', () => {
  const h = harness({ chess_store_preview_locked: '1' });
  h.run("globalThis.dialogs=[];showActivityDialog=(title,html,actions)=>{dialogs.push({title,html});}");
  // 실수가 두 개 있는 판: 퀸을 상대 룩 앞에 두 번 공짜로 둠(상대가 잡지 않고 킹만 움직인 기록)
  const fen = '4k3/8/8/3r4/8/8/3Q4/4K3 w - - 0 1';
  h.run(`writeData('game_records_v1',{version:1,games:[{id:'demo2',at:${Date.now()},result:'draw',level:1,fen:'${fen}',moves:['6353','0405','5343','0506'],content:null},{id:'old1',at:1,result:'loss',level:1,fen:'${fen}',moves:['6353','0405'],content:null}]})`);
  h.run("goCoach('demo2')"); flush(h.timers);
  const scenes = J(h.run, 'state.coach.analysis.scenes'); assert.ok(scenes.length >= 2, '장면 2개 이상');
  h.run('openCoachScene(1)'); assert.notEqual(h.run('state.coach.phase'), 'scene'); assert.match(J(h.run, 'dialogs.at(-1)').title, /보호자와 함께/);
  assert.equal((h.elements.get('screen-coach').innerHTML.match(/class="coach-game( current)?"/g) || []).length, 1);
  const open = harness(); open.run(`writeData('game_records_v1',${h.run("JSON.stringify(readData('game_records_v1',{}))")})`); open.run("goCoach('demo2')"); flush(open.timers);
  open.run('openCoachScene(1)'); assert.equal(open.run('state.coach.phase'), 'scene');
});

test('구매 권한: 웹 미리보기는 모두 열림, 앱(인앱 결제 다리)에서는 산 상품만. 구매·복원은 보호자 확인 뒤', async () => {
  const h = harness();
  assert.equal(h.run('storeMode()'), 'preview'); assert.equal(h.run("storeOwns('course_stage2')"), true);
  h.run(`window.ChessKidsStore={owned:[],getOwned(){return Promise.resolve(this.owned)},getProducts(){return Promise.resolve([{id:'course_all',price:'₩19,900'}])},purchase(id){this.owned.push(id);return Promise.resolve({owned:this.owned})},restore(){return Promise.resolve({owned:['coach_full']})}};storeOwnedCache=null`);
  assert.equal(h.run('storeMode()'), 'native'); assert.equal(h.run("storeOwns('course_stage2')"), false);
  await h.run('storeRefresh()'); assert.equal(h.run("storePriceLabel('course_all')"), '₩19,900');
  h.run("globalThis.dialogs=[];showActivityDialog=(title,html,actions)=>{dialogs.push({title,html,actions});}");
  h.run("openStoreSheet('course_stage2')"); assert.equal(J(h.run, 'dialogs.at(-1)').title, '보호자 확인');
  h.run("document.getElementById('store-gate-input').value='1';storeGateCheck()"); assert.equal(h.run('dialogs.length'), 1, '틀린 답이면 그대로');
  h.run("document.getElementById('store-gate-input').value=String(storeGateAnswer);closeActivityDialog=()=>{};storeGateCheck()");
  assert.equal(J(h.run, 'dialogs.at(-1)').title, '보호자 · 구매와 복원'); assert.match(J(h.run, 'dialogs.at(-1)').html, /course_stage2|2단계/);
  await h.run("storeBuy('course_all')"); await new Promise(r => setTimeout(r, 0));
  assert.equal(h.run("storeOwns('course_stage2')"), true); assert.equal(h.run("storeOwns('coach_full')"), false);
  assert.ok(!h.run("Object.keys(profileData(activeProfile)).includes('chess_store_owned_v1')"), '구매 권한은 프로필 파일에 넣지 않는다');
  await h.run('storeRestoreRequest()'); await new Promise(r => setTimeout(r, 0)); assert.equal(h.run("storeOwns('coach_full')"), true);
});

test('공방: 판 색은 별로, 효과·칭호는 배움 기록으로 열린다. 앱 판에서는 다른 회사 캐릭터 스킨이 보이지 않는다', () => {
  const h = harness();
  h.run("globalThis.dialogs=[];showActivityDialog=(title,html,actions)=>{dialogs.push({title,html});}");
  h.run('goWorkshop()'); assert.equal(h.run('state.screen'), 'workshop');
  assert.match(h.elements.get('screen-workshop').innerHTML, /나의 체스 공방/);
  h.run("workshopPick('board','ocean')"); assert.equal(J(h.run, 'workshopData()').board, 'wood', '별이 부족하면 못 고름');
  h.run("awardStars('achievements','test-a',3);awardStars('achievements','test-b',3);awardStars('achievements','test-c',3)");
  h.run("workshopPick('board','grass')"); assert.equal(J(h.run, 'workshopData()').board, 'grass');
  assert.equal(h.run("workshopHas('cert:stage1')"), false);
  h.run("courseProgressSave(p=>{p.tests.stage1={passed:true,score:5,total:5,at:Date.now()};})");
  assert.equal(h.run("workshopHas('cert:stage1')"), true); assert.equal(h.run("workshopHas('cert1')"), true);
  h.run("workshopPick('title','stage1')"); assert.equal(h.run('workshopTitle().name'), '두 수 박사');
  h.run('workshopUnlockCheck()'); assert.match(J(h.run, "readData('workshop_new',[])").join(' '), /두 수 박사|불꽃놀이/);
  h.run('showScreen("home");renderHome()'); assert.match(h.elements.get('screen-home').innerHTML, /두 수 박사/);
  assert.equal(h.run("SKIN_ORDER.filter(workshopSkinVisible).length"), 7, '웹 미리보기는 모두');
  h.run("window.ChessKidsStore={purchase(){},getOwned(){return Promise.resolve([])}}");
  assert.deepEqual(J(h.run, 'SKIN_ORDER.filter(workshopSkinVisible)'), ['cute', 'classic', 'dino', 'robot']);
  const file = h.run('JSON.stringify(createProfileBackup())'); assert.ok(JSON.parse(file).version < 7, '공방 기록만 있으면 파일 형식을 올리지 않는다');
  const b = harness(); b.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(file)})).id)`); assert.equal(J(b.run, 'workshopData()').title, 'stage1');
});
