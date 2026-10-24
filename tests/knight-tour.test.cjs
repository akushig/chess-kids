const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./harness.cjs');

const branchPrefix = [[2,1],[0,0],[1,2],[2,4]];

test('the familiar tour opens directly, with its alert control above the board', () => {
  const { run, elements } = load();
  run('goKnightSetup()');
  assert.equal(run('state.kt.mode'), 'tour');
  const html = elements.get('screen-mini').innerHTML;
  assert.ok(html.indexOf('id="kt-branch-alert"') < html.indexOf('chess-board'));
  assert.match(html, /갈림길 알림/);
  assert.doesNotMatch(html, /시범|한 점프 보기|다른 시작점 켜짐/);
  assert.equal(run('getKnightTourSettings().branchWarn'), true);
});

test('mixed branches and a non-terminal impossible route are distinguished', () => {
  const { run } = load();
  run(`goKnightTour(0);for(const p of ${JSON.stringify(branchPrefix)})knightTourClick(...p)`);
  assert.equal(run('ktStatus(state.kt,ktAnalyze(state.kt)).tone'), 'branch');
  assert.ok(run('ktAnalyze(state.kt).fatal.some(([r,c])=>r===3&&c===2)'));
  run('knightTourClick(3,2)');
  assert.ok(run('getKnightMoves(...state.kt.pos,state.kt.size,state.kt.board).length') > 0);
  assert.equal(run('ktStatus(state.kt,ktAnalyze(state.kt)).tone'), 'blocked');
  run('undoActivity()');
  assert.equal(run('ktStatus(state.kt,ktAnalyze(state.kt)).tone'), 'branch');
});

test('alert settings persist, including an existing explicit off preference', () => {
  const a = load({ knight_tour_settings: JSON.stringify({size:6,branchWarn:false}) });
  a.run('goKnightSetup()');
  assert.equal(a.run('getKnightTourSettings().branchWarn'), false);
  assert.equal(a.run('state.kt.size'), 6);
  a.run("ktToggleOption('branchWarn')");
  const b = load(Object.fromEntries(a.storage));
  assert.equal(b.run('getKnightTourSettings().branchWarn'), true);
});

test('hint defaults to a complete numbered route, with a distinct one-move option', () => {
  const { run, elements } = load();
  run('goKnightTour(0)');
  const before = run('JSON.stringify([state.kt.board,state.kt.pos,state.kt.visited])');
  run('knightTourHint()');
  assert.equal(run('state.kt.hint.style'), 'path');
  assert.equal(run('state.kt.hint.path.length'), 25);
  assert.equal((elements.get('screen-mini').innerHTML.match(/class="kt-route-number"/g)||[]).length, 24);
  assert.equal(run('JSON.stringify([state.kt.board,state.kt.pos,state.kt.visited])'), before);
  run("knightTourHint('next')");
  assert.equal((elements.get('screen-mini').innerHTML.match(/class="kt-route-number"/g)||[]).length, 1);
  run("knightTourHint('path');knightTourHint()");
  assert.equal(run('state.kt.hintOpen'), false);
  assert.equal(run('state.kt.hint'), null);
});

test('moving clears obsolete hints and undo restores the matching previous route', () => {
  const { run } = load();
  run('goKnightTour(0);knightTourHint();const next=state.kt.hint.path[1];knightTourClick(...next)');
  assert.equal(run('state.kt.hint'), null);
  run('undoActivity()');
  assert.equal(run('state.kt.hint.at'), 0);
  assert.equal(run('state.kt.hint.path.length'), 25);
});

test('random-start preference affects new games while retry keeps the same board', () => {
  const { run } = load();
  run('goKnightTour(0);knightTourClick(2,1)');
  const before = run('JSON.stringify([state.kt.board,state.kt.pos,state.kt.moveCount])');
  run("ktSetStartMode('random')");
  assert.equal(run('JSON.stringify([state.kt.board,state.kt.pos,state.kt.moveCount])'), before);
  run('showChoice=(message,choices)=>choices[0].action();ktRestart()');
  assert.equal(run("state.kt.startPos.join(',')"), '4,0');
  assert.equal(run('state.kt.visited'), 1);
  run('goKnightTour(0)');
  assert.notEqual(run("state.kt.startPos.join(',')"), '4,0');
  assert.ok(run('!!knightGoalPath().path'));
});

test('size persists and a search timeout never becomes an impossible-route warning', () => {
  const { run } = load();
  run('goKnightTour(1);goKnightSetup()');
  assert.equal(run('state.kt.size'), 6);
  run('ktFindPath=()=>({timeout:true});state.kt.analysis=null');
  assert.ok(run('ktAnalyze(state.kt).unknown.length') > 0);
  assert.equal(run('ktStatus(state.kt,ktAnalyze(state.kt)).tone'), 'calm');
  run("knightTourHint('path')");
  assert.match(run('state.kt.hintMessage'), /아직 찾지 못했어요/);
  assert.equal(run('state.kt.hint'), null);
  run('knightTourHint()');
  assert.equal(run('state.kt.hintOpen'), false);
});

test('an in-progress tour from the previous release resumes with the restored controls', () => {
  const a = load();
  a.run('goKnightTour(0);knightTourClick(2,1);knightTourClick(0,0);saveActiveSession()');
  const data = Object.fromEntries(a.storage);
  const key = 'chess.child.last_session';
  const saved = JSON.parse(data[key]);
  for (const field of ['hint', 'hintOpen', 'hintMessage', 'settingsOpen']) delete saved.snapshot.values.kt[field];
  saved.snapshot.values.kt.analysis = { at: 2, fatal: [], safe: 1 };
  data[key] = JSON.stringify(saved);
  const b = load(data);
  b.run('resumeActivity();knightTourHint()');
  assert.equal(b.run('state.kt.visited'), 3);
  assert.equal(b.run('state.kt.moveCount'), 2);
  assert.equal(b.run('state.kt.hint.path.length'), 23);
  assert.equal(b.run('state.kt.hint.style'), 'path');
});
