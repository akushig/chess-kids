// 배운 말로 첫 대전 (docs/STARTER_BATTLES.md)
const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
const WIN='7k/8/5KQ1/8/8/8/8/8 w - - 0 1',WIN_MOVE='[2,6,1,6]';
const KEYS=['R','B','N','Q'];

test('네 판은 대칭이고, 시작할 때 양쪽 모두 잡을 말이 없으며, 캐슬링이 없고, 컴퓨터가 첫 수를 둔다',()=>{
 const {run}=load();assert.deepEqual(JSON.parse(run('JSON.stringify(Object.keys(PLAY_PRESETS))')),KEYS);
 for(const key of KEYS){
  const r=JSON.parse(run(`(()=>{const p=PLAY_PRESETS['${key}'],out={};for(const side of ['w','b']){const g=ChessGame.fromFEN(p.fen.replace(' w ',' '+side+' '));const m=g.allMoves();out[side]={status:g.status,captures:m.filter(x=>g.board[x[2]][x[3]]).length,moves:m.length};}
   const g=ChessGame.fromFEN(p.fen),pieces=g.board.flat().filter(Boolean);out.types=[...new Set(pieces.map(x=>x[1]))].sort().join('');
   out.mirror=g.board.every((row,r)=>row.every((x,c)=>{const y=g.board[7-r][c];return (!x&&!y)||(x&&y&&x[1]===y[1]&&x[0]!==y[0]);}));
   out.castle=['king','queen'].some(s=>g.castlingStatus('w',s).allowed||g.castlingStatus('b',s).allowed);out.ai=!!aiChooseMove(playPosition(g),1);return JSON.stringify(out);})()`));
  for(const side of ['w','b']){assert.equal(r[side].status,'playing',key);assert.equal(r[side].captures,0,key+side);assert.ok(r[side].moves>=10);}
  assert.equal(r.types,['K','P',key].sort().join(''),key+' 왕·폰·그 말만');assert.equal(r.mirror,true,key);assert.equal(r.castle,false,key);assert.equal(r.ai,true,key);
 }
});

test('대전 입구와 시작: 판·제목·첫 안내·단계·캐슬링 안내가 맞고, 설정 화면 선택은 바뀌지 않는다',()=>{
 const {run,elements}=load();run("savePlaySettings({...getPlaySettings(),mode:'friend',level:3,small:true,timer:30});goPlay()");
 const html=elements.get('screen-play').innerHTML;for(const key of KEYS)assert.ok(html.includes(`playStarterBattle('${key}')`),key);assert.match(html,/배운 말로 첫 대전/);
 run("playStarterBattle('B')");
 assert.equal(run('state.play.preset'),'B');assert.equal(run('state.play.mode'),'ai');assert.equal(run('state.play.level'),3);assert.equal(run('state.play.small'),false);
 assert.equal(run('state.game.positionKey()'),run("ChessGame.fromFEN(PLAY_PRESETS.B.fen).positionKey()"));assert.match(run('state.play.notice'),/대각선/);
 assert.match(elements.get('screen-play').innerHTML,/<h2>비숍 첫 대전<\/h2>/);assert.match(run("playCastlingReason(state.game.castlingStatus('w','king'))"),/첫 대전에서는 캐슬링을 하지 않아요/);
 const s=JSON.parse(run('JSON.stringify(getPlaySettings())'));assert.deepEqual([s.mode,s.small,s.timer],['friend',true,30],'모드·짧은 판·시간 선택 유지');
});

test('끝까지 두면 별과 성장 기록이 남고, 재대결과 다음 단계는 같은 첫 대전으로 이어진다',()=>{
 const {run}=load();run(`savePlaySettings({...getPlaySettings(),level:2});playStarterBattle('R');state.game=ChessGame.fromFEN('${WIN}');playCommitMove(${WIN_MOVE})`);
 assert.equal(run("progressLedger().achievements['starter-rook-v1']"),1);assert.ok(run("learningSummary().some(r=>r.label==='룩 첫 대전 완료')"));
 assert.match(run('playConfigSummary(playConfigOf(state.play))'),/룩 첫 대전/);
 run('playRematch()');assert.equal(run('state.play.preset'),'R');assert.equal(run('state.play.level'),2);assert.equal(run('state.game.positionKey()'),run("ChessGame.fromFEN(PLAY_PRESETS.R.fen).positionKey()"));
 run(`state.game=ChessGame.fromFEN('${WIN}');playCommitMove(${WIN_MOVE});playNextLevel()`);assert.equal(run('state.play.preset'),'R');assert.equal(run('state.play.level'),3);
 assert.equal(run('getPlaySettings().level'),3);assert.equal(run('getPlaySettings().small'),false);
 run('playChangeSettings()');assert.equal(run("JSON.stringify(getPlaySettings().mode)"),'"ai"');
});

test('첫 대전은 저장·새 앱 복원·되돌리기를 거쳐도 같은 판이고, 잘못된 값은 거부한다',()=>{
 const a=load();a.run("playStarterBattle('N');playCommitMove([7,1,5,2]);goMiniMenu()");
 const b=load(Object.fromEntries(a.storage));b.run("resumeActivity('play')");assert.equal(b.run('state.play.preset'),'N');assert.equal(b.run('state.actionHistory.length'),1);
 assert.match(b.run("activitySaved('play')?'':''")+b.run("playSavedDetail(state.play)"),/나이트 첫 대전/);
 b.run('undoActivity()');assert.equal(b.run('state.game.positionKey()'),b.run("ChessGame.fromFEN(PLAY_PRESETS.N.fen).positionKey()"));
 const record=JSON.parse(a.run("JSON.stringify(readData('sessions',{}).play)"));
 for(const change of [r=>{r.snapshot.values.play.preset='X';},r=>{r.snapshot.values.play.preset='__proto__';},r=>{r.snapshot.values.play.mode='friend';}]){const r=JSON.parse(JSON.stringify(record));change(r);assert.equal(a.run(`getSavedSession(${JSON.stringify(r)})`),null,change.toString());}
 const file=JSON.parse(a.run('JSON.stringify(createProfileBackup())'));assert.equal(file.version,1,'파일 버전은 그대로');
 const c=load();c.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(JSON.stringify(file))})).id);resumeActivity('play')`);assert.equal(c.run('state.play.preset'),'N');
 const sessions=JSON.parse(file.data.sessions);sessions.play.snapshot.values.play.preset='Z';file.data.sessions=JSON.stringify(sessions);
 assert.throws(()=>c.run(`parseProfileBackup(${JSON.stringify(JSON.stringify(file))})`),/진행 중인 판/);
});

test('대전 중 말 움직임 보기: 내 말을 고를 때만 버튼이 생기고, 그림의 칸 수가 맞고, 시계를 멈췄다가 다시 켠다',()=>{
 const {run}=load();run("globalThis.dialog=null;showActivityDialog=(title,html,actions,id,onDismiss)=>{dialog={title,html,labels:actions.map(a=>a.label),actions,onDismiss};};playStart()");
 assert.doesNotMatch(run('playActionsHTML()'),/움직임 보기/);run('playClick(7,6)');assert.match(run('playActionsHTML()'),/playPieceGuide\('N'\)">.*나이트 움직임 보기/s);
 const count=type=>JSON.parse(run(`(()=>{playPieceGuide('${type}');const h=dialog.html;return JSON.stringify([(h.match(/pg-dot/g)||[]).length,(h.match(/pg-capture/g)||[]).length]);})()`));
 assert.deepEqual(count('N'),[8,0]);assert.deepEqual(count('R'),[8,0]);assert.deepEqual(count('B'),[8,0]);assert.deepEqual(count('Q'),[16,0]);assert.deepEqual(count('K'),[8,0]);assert.deepEqual(count('P'),[2,2]);
 assert.deepEqual(JSON.parse(run('JSON.stringify(dialog.labels)')),['계속 두기','모험에서 연습하기']);assert.equal(run('typeof dialog.onDismiss'),'function');
 run("savePlaySettings({...getPlaySettings(),mode:'friend',timer:30});playStart();playTimerStart();playClick(6,4)");assert.notEqual(run('playTimerHandle'),null);
 run("playPieceGuide('P')");assert.equal(run('playTimerHandle'),null,'읽는 동안 시계 멈춤');run('dialog.onDismiss()');assert.notEqual(run('playTimerHandle'),null,'닫으면 다시 켜짐');
 run("playPieceGuide('P');dialog.actions[1].action()");assert.equal(run('state.screen'),'learn');assert.equal(run('state.missionPiece'),'P');assert.ok(run("!!activitySaved('play')"),'대전은 저장됨');
});

test('모험을 마치면 첫 대전으로 이어진다: 비숍·퀸은 첫 버튼, 룩·나이트는 기존 연결 다음 버튼',()=>{
 const last=(run,piece)=>run(`MISSIONS.${piece}.reduce((a,m,i)=>m.optional?a:i,-1)`);
 for(const piece of ['B','Q','R','N']){
  const {run,timers}=load();run(`globalThis.dialog=null;showActivityDialog=(title,html,actions)=>{dialog={title,labels:actions.map(a=>a.label),actions};};goMissionPlay('${piece}',${last(run,piece)});for(const p of findMissionSolvePath().slice(1))missionClick(...p)`);
  for(const cb of timers.splice(0))cb();const labels=JSON.parse(run('JSON.stringify(dialog.labels)')),title=run(`playPresetTitle('${piece}')`);
  if(piece==='B'||piece==='Q')assert.equal(labels[0],title,piece);else{assert.notEqual(labels[0],title);assert.equal(labels[1],title,piece);}
  run(`dialog.actions[${labels.indexOf(title)}].action()`);assert.equal(run('state.play.preset'),piece);
  if(piece==='B'){run("goMiniMenu()");}
 }
 const {run}=load();run("goMissionPlay('Q',MISSIONS.Q.reduce((a,m,i)=>m.optional?a:i,-1));for(const p of findMissionSolvePath().slice(1))missionClick(...p);goMiniMenu()");assert.equal(run('recommendedActivity().action'),"playStarterBattle('Q')");
});
