const test=require('node:test'),assert=require('node:assert/strict'),load=require('./harness.cjs');
const home=(run,elements)=>{run('renderHome()');return elements.get('screen-home').innerHTML;};

test('home groups all activities into play, study and playground while keeping a direct knight entry',()=>{
 const {run,elements}=load();const html=home(run,elements);
 for(const action of ['goPlay()','goStudy()','goMiniMenu()',"enterActivity('knight')",'goWorkshop()','goReward()'])assert.ok(html.includes(`onclick="${action}"`),action);
 assert.equal((html.match(/class="destination-card /g)||[]).length,2);
 assert.doesNotMatch(html,/experience-picker|어디서 시작할까요|resume-card/);
 run('goStudy()');const study=elements.get('screen-study').innerHTML;
 for(const action of ["enterActivity('mission')",'goAdventure()',"goLessons('study')","goCourse('study')",'goCoach()'])assert.ok(study.includes(`onclick="${action}"`),action);
 assert.match(study,/체스 처음 배우기/);assert.match(study,/체스 수업/);assert.match(study,/승급 과정/);
 run('renderMiniMenu()');const mini=elements.get('screen-mini').innerHTML;
 for(const kind of ['knight','puzzle','collector','bomb','defense','survival','solo','challenge'])assert.ok(mini.includes(`enterActivity('${kind}')`),kind);
 for(const category of ['explore','challenge','path','safety','match'])assert.ok(mini.includes(`renderMiniMenu('${category}')`),category);
});

test('the knight entry opens the existing goal and controls screen without lessons and resumes its own board exactly',()=>{
 const a=load();a.run("enterActivity('knight')");assert.equal(a.run('state.activeKind'),'knight');assert.equal(a.run('state.kt.mode'),'walk');
 assert.match(a.elements.get('screen-mini').innerHTML,/kt-mode-nav/);assert.equal(a.run('progressLedger().missions.length||Object.keys(progressLedger().missions).length'),0);
 a.run("goKnightTour(0,'tour');knightTourClick(...getKnightMoves(...state.kt.pos,state.kt.size,state.kt.board)[0]);showScreen('home');renderHome()");
 assert.match(a.elements.get('screen-home').innerHTML,/▶ 이어하기<\/b> 전체 투어 · 5×5 · 1번 점프/);
 const before=a.run('JSON.stringify([activitySaved("knight").snapshot,activitySaved("knight").history])');
 const b=load(Object.fromEntries(a.storage));b.run('renderHome()');b.run("enterActivity('knight')");
 assert.equal(b.run('JSON.stringify([activitySnapshot(),state.actionHistory])'),before);assert.equal(b.run('state.kt.moveCount'),1);
 b.run('undoActivity()');assert.equal(b.run('state.kt.moveCount'),0);
});

test('the knight back button returns to where the board was opened',()=>{
 const {run,elements}=load();run("renderHome();enterActivity('knight')");assert.match(elements.get('screen-mini').innerHTML,/← 홈/);
 run("goMiniMenu();enterActivity('knight')");assert.match(elements.get('screen-mini').innerHTML,/← 놀이터/);
});

test('first lessons start the next basic rook lesson, resume a saved lesson, and open the map once rook basics are done',()=>{
 const a=load();a.run("enterActivity('mission')");assert.equal(a.run('state.activeKind'),'mission');assert.equal(a.run('state.missionPiece'),'R');assert.equal(a.run("state.missionIdx"),a.run("MISSIONS.R.findIndex(m=>!m.optional)"));
 a.run("goMissionPlay('R',2);showScreen('home');renderHome()");assert.match(a.elements.get('screen-home').innerHTML,/룩 3단계 · 모험/);
 const b=load(Object.fromEntries(a.storage));b.run("enterActivity('mission')");assert.equal(b.run('state.missionIdx'),2);
 const c=load();c.run("MISSIONS.R.forEach((m,i)=>{if(!m.optional)awardStars('missions',m.id,3);});enterActivity('mission')");
 assert.equal(c.run('state.screen'),'learn');assert.match(c.elements.get('screen-learn').innerHTML,/world-card/);assert.equal(c.run('state.activeKind'),null);
});

test('the play entry shows the saved game, a computer game and same-device play without replacing the save early',()=>{
 const a=load();a.run("savePlaySettings({...getPlaySettings(),mode:'ai',level:4,small:true});playStart();playCommitMove([6,2,5,2]);showScreen('home');renderHome()");
 assert.match(a.elements.get('screen-home').innerHTML,/컴퓨터 5단계 · 보통 · 짧은 판/);
 const saved=a.run("JSON.stringify(readData('sessions',{}).play.snapshot)");
 a.run('goPlay()');let html=a.elements.get('screen-play').innerHTML;
 assert.match(html,/▶ 하던 판 이어하기 · 🤖 컴퓨터 5단계/);assert.match(html,/컴퓨터와 두기/);assert.match(html,/같은 기기에서 함께 두기/);assert.match(html,/컴퓨터와 새 판 시작/);
 assert.doesNotMatch(html,/새 판 고르기|온라인/);
 a.run("playSetOption('mode','friend');playSetOption('timer',30)");html=a.elements.get('screen-play').innerHTML;assert.match(html,/같은 기기에서 함께 두기 시작/);assert.match(html,/인터넷 연결 없이/);
 assert.equal(a.run("JSON.stringify(readData('sessions',{}).play.snapshot)"),saved,'changing options keeps the saved game');
 a.run("globalThis.choice=null;showChoice=(m,c)=>{choice={m,c};};requestNewActivity('play',playStart)");assert.match(a.run('choice.m'),/하던 판이 바뀌어요/);
 assert.equal(a.run("JSON.stringify(readData('sessions',{}).play.snapshot)"),saved,'nothing is replaced before the new game starts');
 a.run("choice.c[0].action()");assert.equal(a.run('state.play.level'),4);assert.equal(a.run('state.play.mode'),'ai');assert.equal(a.run('state.actionHistory.length'),1,'continuing restores the same game and undo');
 a.run("goPlay();choice=null;requestNewActivity('play',playStart)");a.run("choice.c[1].action()");assert.equal(a.run('state.play.mode'),'friend');assert.equal(a.run('state.play.timer'),30);assert.equal(a.run('state.actionHistory.length'),0);
});

test('the global continue card and next-step suggestions remain while generic suggestions are not repeated',()=>{
 const a=load();a.run("goDefense(0);defenseClick(...getDefenseMoves(state.df)[0])");assert.match(home(a.run,a.elements),/이어서 놀기/);assert.match(home(a.run,a.elements),/성 지키기 · 하던 판/);
 const b=load();b.run("goPuzzleLevel(2);const m=puzzleWinningMoves(state.puzzleGame,PUZZLES[state.puzzleIndex])[0];puzzleClick(m[0],m[1]);puzzleClick(m[2],m[3]);goMiniMenu()");
 const html=home(b.run,b.elements);assert.match(html,/resume-card/);assert.match(html,/같은 기술, 새로운 장면/);
 const c=load();c.run("writeData('experience','challenge')");assert.doesNotMatch(home(c.run,c.elements),/resume-card/);
});

test('lesson collections initially show a saved replay even when that unit was already completed',()=>{
 const a=load();
 a.run("LESSONS.filter(l=>l.unit==='protect').forEach(l=>lessonProgressUpdate(l.id,p=>({completed:true,solved:l.levels.map(v=>v.id)})));startLesson('protect-escape-v3');leaveActivity()");
 const b=load(Object.fromEntries(a.storage));b.run("goLessons('study')");
 assert.equal(b.run('lessonUnitTab'),'protect');
 assert.equal(b.run("lessonSavedSession('protect-escape-v3').snapshot.values.lesson.levelIndex"),0);
});
