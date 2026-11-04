const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
// White mates with Qg6-g7 (row 2,col 6 -> row 1,col 6). LOSS is already mate against White; DRAW is stalemate.
const WIN='7k/8/5KQ1/8/8/8/8/8 w - - 0 1',WIN_MOVE='[2,6,1,6]';
const LOSS='8/8/8/8/8/6k1/6q1/7K w - - 0 1';
const DRAW='7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
const SMALL='3rk3/2ppp3/8/8/8/8/2PPP3/3RK3 w - - 0 1';
const captureDialog="globalThis.dialogActions=null;globalThis.dialogBody='';playShowDialog=(kind,title,html,actions)=>{dialogBody=html;dialogActions=actions.map(a=>({label:a.label,secondary:!!a.secondary,tone:a.tone||'',acts:!!a.action}));};";
const settings=run=>JSON.parse(run('JSON.stringify(getPlaySettings())'));
const config=run=>JSON.parse(run('JSON.stringify(playConfigOf(state.play))'));

test('a rematch after restoring a saved game uses that game settings, never the current global settings',()=>{
 const a=load();a.run("savePlaySettings({...getPlaySettings(),mode:'ai',level:6,help:false,small:true});playStart();playCommitMove([6,2,5,2]);goMiniMenu()");
 const b=load(Object.fromEntries(a.storage));
 b.run("savePlaySettings({...getPlaySettings(),mode:'friend',level:0,help:true,small:false,timer:15,face:false})");
 b.run("resumeActivity('play')");assert.equal(b.run('state.play.level'),6);assert.equal(b.run('state.actionHistory.length'),1);
 b.run(`state.game=ChessGame.fromFEN('${WIN}');playCommitMove(${WIN_MOVE})`);assert.equal(b.run('state.game.status'),'checkmate');
 b.run('playRematch()');
 assert.deepEqual(config(b.run),{mode:'ai',level:6,levelVersion:2,timer:0,help:false,autoMove:false,small:true,face:true});
 assert.equal(b.run('state.game.positionKey()'),b.run(`ChessGame.fromFEN('${SMALL}').positionKey()`),'normal starting position of the short game');assert.equal(b.run('state.game.lastMove==null'),true);
 assert.equal(b.run('state.game.turn'),'w');assert.equal(b.run('state.game.selected'),null);assert.equal(b.run('state.actionHistory.length'),0);assert.equal(b.run('state.play.moveEvent'),undefined);
 // The friend-mode choices made in the setup screen survive an AI rematch.
 const s=settings(b.run);assert.equal(s.mode,'ai');assert.equal(s.level,6);assert.equal(s.small,true);assert.equal(s.help,false);assert.equal(s.timer,15);assert.equal(s.face,false);
});

test('the next level is offered only after beating the computer and only applies when chosen',()=>{
 const {run}=load();run(`savePlaySettings({...getPlaySettings(),mode:'ai',level:3,help:false,small:true});playStart();state.game=ChessGame.fromFEN('${WIN}');${captureDialog}playCommitMove(${WIN_MOVE})`);
 assert.equal(run('playNextLevelIndex()'),4);assert.equal(run('state.play.level'),3,'no automatic level change');assert.equal(settings(run).level,3);
 const actions=JSON.parse(run('JSON.stringify(dialogActions)'));
 assert.deepEqual(actions.map(a=>a.label),['확인했어요 · 마지막 판 보기','같은 상대와 다시 두기','다음 단계 도전 · 5단계','설정 바꾸기']);
 assert.equal(actions[0].acts,false,'the focused first action only closes the result');assert.match(run('dialogBody'),/다시 두면/);assert.match(run('dialogBody'),/4단계/);
 assert.match(run('playActionsHTML()'),/playNextLevel\(\)/);assert.match(run('playActionsHTML()'),/playRematch\(\)/);assert.doesNotMatch(run('playActionsHTML()'),/playRestartRequest/);
 run('playNextLevel()');assert.deepEqual(config(run),{mode:'ai',level:4,levelVersion:2,timer:0,help:false,autoMove:false,small:true,face:true});
 assert.equal(settings(run).level,4);assert.equal(run('state.actionHistory.length'),0);assert.equal(run('state.game.status'),'playing');
 assert.equal(run('playNextLevelIndex()'),null,'a fresh game offers nothing');
});

test('the highest level, losses, draws and same-device games never change the level',()=>{
 const top=load();top.run(`savePlaySettings({...getPlaySettings(),mode:'ai',level:9});playStart();state.game=ChessGame.fromFEN('${WIN}');${captureDialog}playCommitMove(${WIN_MOVE})`);
 assert.equal(top.run('playNextLevelIndex()'),null);assert.doesNotMatch(top.run('playActionsHTML()'),/다음 단계/);assert.doesNotMatch(top.run('JSON.stringify(dialogActions)'),/다음 단계/);
 assert.match(top.run('dialogBody'),/가장 높은 10단계/);top.run('playNextLevel()');assert.equal(top.run('state.game.status'),'checkmate','nothing beyond level 10');
 top.run('playRematch()');assert.equal(top.run('state.play.level'),9);
 for(const [fen,mode,move]of [[LOSS,'ai',''],[DRAW,'ai',''],[WIN,'friend',WIN_MOVE]]){
  const {run}=load();run(`savePlaySettings({...getPlaySettings(),mode:'${mode}',level:5,timer:30});playStart();state.game=ChessGame.fromFEN('${fen}');${captureDialog}${move?`playCommitMove(${move})`:'renderPlay()'}`);
  assert.ok(run('playIsOver()'),fen);assert.equal(run('playNextLevelIndex()'),null,fen);assert.doesNotMatch(run('JSON.stringify(dialogActions)'),/다음 단계/,fen);assert.match(run('JSON.stringify(dialogActions)'),/같은 상대와 다시 두기/,fen);
  run('playRematch()');assert.equal(run('state.play.level'),5,fen);assert.equal(run('state.play.mode'),mode,fen);
 }
});

test('a same-device rematch keeps the move timer, seating and helper with a fresh full timer',()=>{
 const {run}=load();run(`savePlaySettings({...getPlaySettings(),mode:'friend',level:2,timer:30,face:false,autoMove:true,small:true,help:false});playStart();playCommitMove([6,2,5,2]);state.play.pausedLeft=1200;state.game=ChessGame.fromFEN('${WIN}');state.play.mode='friend';playCommitMove(${WIN_MOVE})`);
 run("savePlaySettings({...getPlaySettings(),mode:'ai',level:8,timer:0})");
 run('playRematch()');
 assert.deepEqual(config(run),{mode:'friend',level:2,levelVersion:2,timer:30,help:false,autoMove:true,small:true,face:false});
 assert.equal(run('state.play.pausedLeft===null&&state.play.deadline-Date.now()>29000'),true,'the new game starts with the full move time');assert.equal(run('state.play.timeoutSide'),null);
 const s=settings(run);assert.equal(s.mode,'friend');assert.equal(s.timer,30);assert.equal(s.level,8,'the AI level choice is kept');
});

test('restarting during a game keeps the replacement confirmation and the game settings',()=>{
 const {run}=load();run("globalThis.choice=null;showChoice=(message,choices,onDismiss)=>{choice={message,labels:choices.map(c=>c.label),choices,onDismiss};};savePlaySettings({...getPlaySettings(),mode:'ai',level:7,small:true});playStart();playCommitMove([6,2,5,2])");
 run("savePlaySettings({...getPlaySettings(),level:1,small:false})");const before=run('JSON.stringify(state.game.board)');
 run('playRestartRequest()');assert.match(run('choice.message'),/같은 설정으로 새 판/);assert.equal(run('typeof choice.onDismiss'),'function','escape resumes the clock');
 assert.equal(run('JSON.stringify(state.game.board)'),before,'nothing replaced before confirming');assert.equal(run('state.actionHistory.length'),1);
 run('choice.choices[0].action()');assert.equal(run('state.play.level'),7);assert.equal(run('state.play.small'),true);assert.equal(run('state.actionHistory.length'),0);
 run(`state.game=ChessGame.fromFEN('${LOSS}');renderPlay();choice=null;playRestartRequest()`);assert.equal(run('choice'),null,'a finished game restarts without an extra confirmation');assert.equal(run('state.game.status'),'playing');
});

test('a computer reply requested by the finished or replaced game never reaches the new game',()=>{
 const {run,timers}=load();run('playStart();playCommitMove([6,4,4,4])');assert.equal(run("state.game.turn"),'b');assert.ok(timers.length>0,'computer reply pending');
 run('playStart(state.play)');const fresh=run('JSON.stringify(state.game.board)');
 for(const cb of timers.splice(0))cb();for(const cb of timers.splice(0))cb();
 assert.equal(run('JSON.stringify(state.game.board)'),fresh);assert.equal(run('state.game.turn'),'w');assert.equal(run('state.actionHistory.length'),0);
});

test('changing settings after a restored game starts the setup from that game, keeping the other mode choices',()=>{
 const a=load();a.run("savePlaySettings({...getPlaySettings(),mode:'ai',level:7,small:true,help:false});playStart();playCommitMove([6,2,5,2]);goMiniMenu()");
 const b=load(Object.fromEntries(a.storage));b.run("savePlaySettings({...getPlaySettings(),mode:'friend',level:0,timer:60,small:false,help:true});resumeActivity('play')");
 b.run(`state.game=ChessGame.fromFEN('${WIN}');playCommitMove(${WIN_MOVE})`);assert.match(b.run('playActionsHTML()'),/playChangeSettings\(\)/);
 b.run('playChangeSettings()');const s=settings(b.run);
 assert.deepEqual([s.mode,s.level,s.small,s.help,s.timer],['ai',7,true,false,60]);assert.equal(b.run('state.screen'),'play');assert.equal(b.run('state.activeKind'),null);
 assert.match(b.elements.get('screen-play').innerHTML,/aria-label="8단계 · [^"]+" aria-pressed="true"/);
 assert.equal(b.run("activitySaved('play')"),null,'the finished game is not offered as a game to continue');
});

test('the short board starts with nothing capturable for either side, so no rook is lost on move one',()=>{
 const {run}=load();run("savePlaySettings({...getPlaySettings(),small:true});playStart()");
 for(const side of ['w','b']){const n=run(`(()=>{const g=ChessGame.fromFEN(PLAY_SMALL_FEN.replace(' w ',' ${side} '));return g.allMoves().filter(m=>g.board[m[2]][m[3]]).length;})()`);assert.equal(n,0,side);}
 assert.equal(run('state.game.positionKey()'),run('ChessGame.fromFEN(PLAY_SMALL_FEN).positionKey()'));assert.equal(run("state.game.board[6][3]"),'wP','the d-file between the rooks is closed');
});
