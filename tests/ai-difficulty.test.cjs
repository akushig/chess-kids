const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
const legacy=[0,2,4,6,7];
test('ten levels keep the original five settings as anchors and add stronger search budgets',()=>{
 const {run}=load();assert.equal(run('AI_LEVELS.length'),10);
 const anchors=[{random:true},{depth:1,quiesce:false,margin:150,timeMs:250},{depth:2,quiesce:true,margin:60,timeMs:600},{depth:3,quiesce:true,margin:20,timeMs:1500},{depth:6,quiesce:true,margin:5,timeMs:1200}];
 legacy.forEach((idx,i)=>assert.deepEqual(JSON.parse(run(`JSON.stringify(AI_LEVELS[${idx}])`)),anchors[i]));
 assert.equal(run('AI_LEVELS[1].randomChance'),.5);
 assert.equal(run('AI_LEVELS[8].depth>AI_LEVELS[7].depth&&AI_LEVELS[9].depth>AI_LEVELS[8].depth'),true);
 assert.equal(run('AI_LEVELS[8].timeMs>AI_LEVELS[7].timeMs&&AI_LEVELS[9].timeMs>AI_LEVELS[8].timeMs'),true);
 assert.equal(run('AI_LEVELS[8].margin+AI_LEVELS[9].margin'),0);
});
test('level one stays random and level two alternates between free and evaluated play',()=>{
 const {run}=load();run('state.game=new ChessGame()');
 run('Math.random=()=>.25;aiChooseMove(playPosition(state.game),0)');assert.equal(run('aiLastSearch.random&&aiLastSearch.nodes===0'),true);
 run('aiChooseMove(playPosition(state.game),1)');assert.equal(run('aiLastSearch.random'),true);
 run('Math.random=()=>.75;aiChooseMove(playPosition(state.game),1)');assert.equal(run('aiLastSearch.random'),false);assert.equal(run('aiLastSearch.completedDepth'),1);
});
test('all ten levels return legal moves without mutating the supplied board, including promotion and castling positions',()=>{
 const {run}=load();
 for(const fen of ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1','7k/P7/8/8/8/8/8/3K4 w - - 0 1','4r2k/8/8/8/8/8/R7/4K3 w - - 0 1'])for(let level=0;level<10;level++){
  assert.equal(run(`(()=>{const g=ChessGame.fromFEN('${fen}'),before=JSON.stringify(g),m=aiChooseMove(playPosition(g),${level},{timeLimitMs:15});return JSON.stringify(g)===before&&g.allMoves().some(legal=>JSON.stringify(legal)===JSON.stringify(m));})()`),true,`${fen} level ${level+1}`);
 }
});
test('levels nine and ten actually complete deeper searches than the old highest level',()=>{
 const {run}=load();const depths=[];
 for(const level of [7,8,9]){run(`aiChooseMove(playPosition(ChessGame.fromFEN('k7/8/8/8/8/8/4P3/4K3 w - - 0 1')),${level})`);depths.push(run('aiLastSearch.completedDepth'));}
 assert.deepEqual(depths,[6,8,10]);
});
test('legacy difficulty settings migrate per profile; current levels and defaults stay stable',()=>{
 for(let level=0;level<5;level++){
  const {run,storage}=load({'chess.child.play_settings':JSON.stringify({level,small:true})});assert.equal(run('getPlaySettings().level'),legacy[level]);
  run('savePlaySettings(getPlaySettings())');const settings=JSON.parse(storage.get('chess.child.play_settings'));assert.equal(settings.levelVersion,2);assert.equal(settings.level,legacy[level]);assert.equal(run('getPlaySettings().level'),legacy[level]);
 }
 const {run}=load({'chess.adult.play_settings':JSON.stringify({level:4})});assert.equal(run("activeProfile='adult';getPlaySettings().level"),7);
 assert.equal(run("activeProfile='child';getPlaySettings().level"),0);assert.equal(run("activeProfile='sibling';getPlaySettings().level"),0);
 assert.equal(run("activeProfile='adult';safeStore.removeItem('play_settings');getPlaySettings().level"),4);
 for(let level=0;level<10;level++){run(`savePlaySettings({...getPlaySettings(),level:${level}})`);assert.equal(run('getPlaySettings().level'),level);}
});
test('an old ongoing game and its undo history keep their equivalent difficulty through reload and undo',()=>{
 const a=load();a.run('playStart();playCommitMove([6,4,4,4]);playCommitMove([1,4,3,4]);saveActiveSession()');
 const saved=JSON.parse(a.storage.get('chess.child.last_session'));
 for(const snap of [saved.snapshot,...saved.history]){snap.values.play.level=4;delete snap.values.play.levelVersion;}
 const b=load({'chess.child.last_session':JSON.stringify(saved)});b.run('resumeActivity()');assert.equal(b.run('state.play.level'),7);assert.equal(b.run('state.game.board[4][4]'),'wP');
 b.run('undoActivity()');assert.equal(b.run('state.play.level'),7);assert.equal(b.run('state.play.levelVersion'),2);assert.equal(b.run('state.game.board[6][4]'),'wP');
 b.run('saveActiveSession()');const c=load(Object.fromEntries(b.storage));c.run('resumeActivity()');assert.equal(c.run('state.play.level'),7);
});
test('new top-level games survive resume and undo without being mistaken for five-level settings',()=>{
 const a=load();a.run('savePlaySettings({...getPlaySettings(),level:9});playStart();playCommitMove([6,4,4,4]);playCommitMove([1,4,3,4]);saveActiveSession()');
 const b=load(Object.fromEntries(a.storage));b.run('resumeActivity();undoActivity()');assert.equal(b.run('state.play.level'),9);
});
test('helpers keep their original strength and a worker-less fallback has a short computation budget',()=>{
 const {run,timers}=load();assert.equal(run('AI_HINT_LEVEL'),2);assert.equal(run('PLAY_TIMEOUT_LEVEL'),4);
 run('aiChooseMove=(p,l,options)=>{globalThis.fallbackBudget=options.timeLimitMs;return null};playAiWorker=false;playRequestAi({},9,()=>{})');timers.at(-1)();assert.equal(run('fallbackBudget'),250);
});
test('setup and game labels expose all ten numbered levels in both languages',()=>{
 const {run,elements}=load();
 for(const lang of ['ko','en']){
  run(`currentLang='${lang}';goPlay()`);const html=elements.get('screen-play').innerHTML;assert.equal((html.match(/class="play-level /g)||[]).length,10);assert.ok(!html.includes('undefined'));assert.ok(html.includes('aria-pressed="true"'));
  for(let level=0;level<10;level++)assert.ok(run(`playLevelLabel(${level})`).includes(String(level+1)));
 }
 run('savePlaySettings({...getPlaySettings(),level:9});playStart()');assert.match(elements.get('screen-play').innerHTML,/Level 10/);
});
