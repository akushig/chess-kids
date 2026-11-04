const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
test('first launch has one editable profile and every newly created profile has identical game defaults',()=>{
 const {run}=load();assert.equal(run('allProfiles().length'),1);
 const baseline=run('JSON.stringify([getPlaySettings(),preferredKnightMode(),currentSkin,readData("experience",null)])');
 for(const name of ['엄마','아이','아빠']){run(`switchProfile(createProfile('${name}','🐱').id)`);assert.equal(run('JSON.stringify([getPlaySettings(),preferredKnightMode(),currentSkin,readData("experience",null)])'),baseline);}
});
test('legacy named slots migrate only where used and keep independent saves without age defaults',()=>{
 const {run}=load({'chess.child.progress_v3':JSON.stringify({version:3,missions:{'rook.horizontal.v1':3},puzzles:{},mini:{}}),'chess.adult.play_settings':JSON.stringify({level:2,levelVersion:2}),'chess_active_profile':'adult'});
 assert.equal(run('allProfiles().length'),2);assert.equal(run('profileInfo().name'),'플레이어 2');assert.equal(run('getPlaySettings().level'),2);
 run("switchProfile('child')");assert.equal(run('getAllStars()'),3);assert.equal(run('preferredKnightMode()'),'walk');
 run("switchProfile('adult');safeStore.removeItem('play_settings')");assert.equal(run('getPlaySettings().level'),0);assert.equal(run('preferredKnightMode()'),'walk');
});
test('editing keeps ID and data, duplicate names fail, and deleting never touches another profile or recreates a legacy slot',()=>{
 const a=load();a.run("writeData('custom',123);const second=createProfile('이름2');switchProfile(second.id);writeData('custom',456);updateProfile(second.id,'새 이름','🚀')");const id=a.run('activeProfile');assert.equal(a.run('profileInfo().name'),'새 이름');assert.equal(a.run('readData("custom",null)'),456);
 assert.throws(()=>a.run("createProfile('새 이름')"),/이미/);a.run("deleteProfile('child')");assert.equal(a.run('allProfiles().length'),1);assert.equal(a.run('activeProfile'),id);assert.equal(a.run('readData("custom",null)'),456);assert.throws(()=>a.run(`deleteProfile('${id}')`),/하나/);
 const b=load(Object.fromEntries(a.storage));assert.equal(b.run('allProfiles().length'),1);assert.equal(b.run('activeProfile'),id);assert.equal(b.storage.has('chess.child.migrated'),false);
});
test('profile backup moves all game types, undo history, stars, cosmetics and settings to an isolated new device',()=>{
 const a=load();a.run("writeData('preferences',{motion:false,voice:true});savePlaySettings({...getPlaySettings(),level:6});setSkin('classic');goMissionPlay('R',0);missionClick(3,3);goMissionPlay('R',1);missionClick(0,3);goMissionPlay('B',3);missionClick(...findMissionSolvePath()[1]);goKnightTour(1,'tour');knightTourClick(...getKnightMoves(...state.kt.pos,state.kt.size,state.kt.board)[0]);goCollector(1);collectorClick(...getCollectorMoves(state.cl)[0]);goBomb(1);bombClick(...getBombMoves(state.bm)[0]);goDefense(1);defenseClick(...getDefenseMoves(state.df)[0]);goSurvival(1);survivalClick(...getSurvivalSafeMoves(state.sv)[0]);playStart();playCommitMove([6,4,4,4]);goPuzzleLevel(4);const move=puzzleWinningMoves(state.puzzleGame,PUZZLES[state.puzzleIndex],2)[0];puzzleClick(move[0],move[1]);puzzleClick(move[2],move[3]);leaveActivity()");
 const text=a.run('JSON.stringify(createProfileBackup())');assert.equal(JSON.parse(text).data['chess_active_profile'],undefined);
 const b=load();b.run(`const imported=importProfileBackup(parseProfileBackup(${JSON.stringify(text)}));switchProfile(imported.id)`);
 assert.equal(b.run('getAllStars()'),a.run('getAllStars()'));assert.equal(b.run('currentSkin'),'classic');assert.equal(b.run('readData("pending_skin",null)'),a.run('readData("pending_skin",null)'));assert.equal(b.run('getPlaySettings().level'),6);assert.equal(b.run('readData("preferences",{}).voice'),true);
 for(const kind of ['mission','knight','collector','bomb','defense','survival','play']){
  b.run(`resumeActivity('${kind}')`);assert.equal(b.run('state.activeKind'),kind);assert.equal(b.run('state.actionHistory.length'),1,kind);b.run('undoActivity()');assert.equal(b.run('state.actionHistory.length'),0,kind);
 }
 assert.equal(b.run("activitySaved('puzzle').snapshot.values.puzzleMoveCount"),1);
 assert.equal(b.run('allProfiles().length'),2);
});
test('duplicate imports get distinct names and IDs and never overwrite existing profiles',()=>{
 const {run}=load();run("writeData('custom',7);const backup=JSON.stringify(createProfileBackup());const first=importProfileBackup(parseProfileBackup(backup)),second=importProfileBackup(parseProfileBackup(backup))");assert.equal(run('first.name'),'플레이어 1 (2)');assert.equal(run('second.name'),'플레이어 1 (3)');assert.notEqual(run('first.id'),run('second.id'));assert.equal(run('readData("custom",null)'),7);
});
test('invalid, foreign, future, oversized, executable and corrupt session backups are rejected before any writes',()=>{
 const a=load();a.run("goKnightTour(0,'tour');knightTourClick(2,1);leaveActivity()");const original=JSON.parse(a.run('JSON.stringify(createProfileBackup())'));
 const before=JSON.stringify([...a.storage]);
 const variants=['{','{}',JSON.stringify({...original,version:99}),JSON.stringify({...original,format:'other'})];
 for(const change of [b=>b.data.sessions='{}broken',b=>b.data.preferences=JSON.stringify({voice:'<img src=x onerror=alert(1)>'}),b=>{let s=JSON.parse(b.data.sessions);s.knight.snapshot.values.kt.mode="tour');alert(1);//";b.data.sessions=JSON.stringify(s);},b=>b.data.progress_v3='[]',b=>Object.defineProperty(b.data,'__proto__',{value:'{}',enumerable:true})]){
  const v=JSON.parse(JSON.stringify(original));change(v);variants.push(JSON.stringify(v));
 }
 for(const v of variants)assert.throws(()=>a.run(`parseProfileBackup(${JSON.stringify(v)})`));
 assert.throws(()=>a.run("parseProfileBackup('x'.repeat(PROFILE_BACKUP_LIMIT+1))"),/10MB/);assert.equal(JSON.stringify([...a.storage]),before);
});
test('an import that hits storage quota rolls back partial data and registry changes',()=>{
 const {run,storage}=load();run("const parsed=parseProfileBackup(JSON.stringify(createProfileBackup()));parsed.data.custom='123';const originalSet=localStorage.setItem;let writes=0;localStorage.setItem=(k,v)=>{if(++writes===2)throw Error('quota');originalSet(k,v)}");const before=JSON.stringify([...storage]);assert.throws(()=>run('importProfileBackup(parsed)'),/저장/);assert.equal(run('allProfiles().length'),1);assert.equal(JSON.stringify([...storage]),before);
});

test('backup of an inactive profile includes only its own data and does not change the selected person',()=>{
 const {run}=load();run("writeData('custom',11);const other=createProfile('다른이름');switchProfile(other.id);writeData('custom',22);const backup=createProfileBackup('child')");assert.equal(run('backup.data.custom'),'11');assert.equal(run('backup.profile.name'),'플레이어 1');assert.equal(run('activeProfile===other.id'),true);
});
test('an old adventure save without a curriculum snapshot transfers using its archived board definition',()=>{
 const a=load();a.run("goMissionPlay('B',0);state.missionBoard=buildMissionBoard(LEGACY_MISSIONS.B[0]);state.missionPlayerPos=[...LEGACY_MISSIONS.B[0].start];delete state.missionSpec;delete state.activityParams.curriculumVersion;leaveActivity()");const text=a.run('JSON.stringify(createProfileBackup())');
 const b=load();b.run(`switchProfile(importProfileBackup(parseProfileBackup(${JSON.stringify(text)})).id);resumeActivity('mission')`);assert.equal(b.run('missionSize()'),6);assert.equal(b.run('currentMission().version'),1);b.run('for(const p of findMissionSolvePath().slice(1))missionClick(...p)');assert.equal(b.run('state.missionSolved'),true);
});

test('deleting the original legacy profile also removes its unprefixed migration copies',()=>{
 const {run,storage}=load({mission_progress_v2:JSON.stringify({R:{0:3}})});run("const replacement=createProfile('남길 프로필');deleteProfile('child')");assert.equal(storage.has('mission_progress_v2'),false);assert.equal(storage.has('chess.child.mission_progress_v2'),false);assert.equal(storage.get('chess_profiles_legacy_copied'),'1');assert.equal(run('allProfiles().length'),1);
});
