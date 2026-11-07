// 나의 체스 공방: 꾸미기 (docs/PREMIUM_COURSE.md §8)
// 말 모양(스킨) · 판 색 · 성공 효과 · 칭호를 따로 골라 나만의 체스 세트를 만든다.
// 모두 놀이와 배움으로 연다(별, 수업·과정·코치 기록). 돈으로 사는 꾸미기는 없다.
const WORKSHOP_BOARDS = [
  { id: 'wood', name: '나무 판', light: '#F5DEB3', dark: '#C4944A', border: '#8B6914', stars: 0 },
  { id: 'grass', name: '잔디 운동장', light: '#eaf6d3', dark: '#86b86a', border: '#4f7a3a', stars: 8 },
  { id: 'ocean', name: '바다', light: '#e0f3fb', dark: '#62acd7', border: '#2f6f99', stars: 20 },
  { id: 'candy', name: '사탕 가게', light: '#ffe8f1', dark: '#ef9bbb', border: '#c4577f', stars: 35 },
  { id: 'night', name: '밤하늘', light: '#dcdff6', dark: '#6468a8', border: '#2e3266', stars: 55 },
  { id: 'marble', name: '대리석', light: '#f5f5f3', dark: '#aab1b9', border: '#5f6770', stars: 80 },
];
const WORKSHOP_EFFECTS = [
  { id: 'confetti', name: '색종이', icon: '🎊', need: null },
  { id: 'stars', name: '별똥별', icon: '⭐', need: 'lesson1' },
  { id: 'hearts', name: '하트', icon: '💖', need: 'win1' },
  { id: 'bubbles', name: '비눗방울', icon: '🫧', need: 'course5' },
  { id: 'fireworks', name: '불꽃놀이', icon: '🎆', need: 'cert1' },
];
const WORKSHOP_TITLES = [
  { id: 'sprout', name: '새싹 기사', icon: '🌱', need: null },
  { id: 'firstwin', name: '첫 승리', icon: '🏆', need: 'win1' },
  { id: 'explorer', name: '수업 탐험가', icon: '📘', need: 'lesson5' },
  { id: 'forkdoc', name: '포크 박사', icon: '🍴', need: 'fork' },
  { id: 'student', name: '코치의 제자', icon: '🔍', need: 'coach3' },
  { id: 'stage1', name: '두 수 박사', icon: '⚔️', need: 'cert:stage1' },
  { id: 'stage2', name: '끝내기 달인', icon: '👑', need: 'cert:stage2' },
  { id: 'stage3', name: '초반 박사', icon: '🏰', need: 'cert:stage3' },
  { id: 'graduate', name: '승급 과정 졸업', icon: '🎓', need: 'certAll' },
];
const WORKSHOP_NEED_TEXT = { lesson1: '체스 수업 한 주제 마치기', lesson5: '체스 수업 5주제 마치기', fork: '체스 수업 ‘포크’ 마치기', win1: '컴퓨터에게 한 번 이기기', course5: '승급 과정 5판 성공', coach3: '코치 장면 3개 다시 두어 찾기', cert1: '승급 시험 하나 통과', 'cert:stage1': '1단계 승급 시험 통과', 'cert:stage2': '2단계 승급 시험 통과', 'cert:stage3': '3단계 승급 시험 통과', certAll: '세 단계 승급 시험 모두 통과' };

function workshopData() {
  const d = readData('workshop_v1', null);
  return workshopValid(d) ? d : { version: 1, board: 'wood', effect: 'confetti', title: 'sprout', flags: {}, seen: [] };
}
function workshopValid(d) {
  return !!d && typeof d === 'object' && !Array.isArray(d) && d.version === 1 && WORKSHOP_BOARDS.some(b => b.id === d.board) && WORKSHOP_EFFECTS.some(e => e.id === d.effect) && WORKSHOP_TITLES.some(t => t.id === d.title)
    && !!d.flags && typeof d.flags === 'object' && !Array.isArray(d.flags) && Object.entries(d.flags).every(([k, v]) => k === 'win1' && typeof v === 'boolean')
    && Array.isArray(d.seen) && d.seen.length <= 60 && d.seen.every(x => typeof x === 'string' && x.length <= 40);
}
function workshopSave(change) { const d = workshopData(); change(d); writeData('workshop_v1', d); return d; }
function workshopHas(need) {
  if (!need) return true;
  const lessons = typeof lessonProgressAll === 'function' ? lessonProgressAll() : {}, done = Object.values(lessons).filter(p => p.completed).length;
  const course = typeof courseProgress === 'function' ? courseProgress() : null, tests = course ? course.tests : {};
  if (need === 'lesson1') return done >= 1;
  if (need === 'lesson5') return done >= 5;
  if (need === 'fork') return !!lessons['fork-v1']?.completed;
  if (need === 'win1') return !!workshopData().flags.win1 || (typeof coachRecords === 'function' && coachRecords().some(g => g.result === 'win'));
  if (need === 'course5') return !!course && Object.values(course.topics).reduce((n, t) => n + (t.solved?.length || 0) + (t.helped?.length || 0), 0) >= 5;
  if (need === 'coach3') return typeof coachStats === 'function' && coachStats().solved >= 3;
  if (need === 'cert1') return Object.values(tests).some(t => t.passed);
  if (need === 'certAll') return COURSE_STAGES.every(s => tests[s.id]?.passed);
  if (need.startsWith('cert:')) return !!tests[need.slice(5)]?.passed;
  return false;
}
function workshopBoardOpen(b) { return getAllStars() >= b.stars; }
function workshopSkinVisible(name) { return !SKIN_META[name]?.licensed || storeMode() !== 'native'; }
// 새로 열린 꾸미기를 찾아 홈에서 알려 준다(한 번만).
function workshopUnlockCheck() {
  try {
    // 바뀐 것이 있을 때만 저장한다(아무것도 안 한 프로필의 파일 형식을 올리지 않게).
    const d = workshopData(); let changed = false;
    if (state.play?.mode === 'ai' && state.game?.status === 'checkmate' && state.game.turn === 'b' && !d.flags.win1) { d.flags.win1 = true; changed = true; }
    const items = [...WORKSHOP_EFFECTS.map(e => ['effect:' + e.id, workshopHas(e.need), e.icon + ' ' + e.name + ' 효과']), ...WORKSHOP_TITLES.map(t => ['title:' + t.id, workshopHas(t.need), t.icon + ' ' + t.name + ' 칭호']), ...WORKSHOP_BOARDS.map(b => ['board:' + b.id, workshopBoardOpen(b), b.name])];
    const fresh = items.filter(([id, open]) => open && !d.seen.includes(id) && !/(confetti|sprout|wood)$/.test(id));
    if (fresh.length) { d.seen.push(...fresh.map(f => f[0])); d.seen = d.seen.slice(-60); writeData('workshop_new', fresh.map(f => f[2]).slice(0, 4)); changed = true; }
    if (changed) writeData('workshop_v1', d);
  } catch {}
}
function applyWorkshop() {
  const root = document.documentElement; if (!root?.style?.setProperty) return;
  const d = workshopData(), b = WORKSHOP_BOARDS.find(x => x.id === d.board) || WORKSHOP_BOARDS[0], open = workshopBoardOpen(b) ? b : WORKSHOP_BOARDS[0];
  root.style.setProperty('--board-light', open.light); root.style.setProperty('--board-dark', open.dark); root.style.setProperty('--board-border', open.border);
  if (!workshopSkinVisible(currentSkin)) setSkin('cute');
}
function workshopEffect() { const d = workshopData(), e = WORKSHOP_EFFECTS.find(x => x.id === d.effect); return e && workshopHas(e.need) ? e.id : 'confetti'; }
function workshopTitle() { const d = workshopData(), t = WORKSHOP_TITLES.find(x => x.id === d.title); return t && workshopHas(t.need) ? t : WORKSHOP_TITLES[0]; }

// ===== 화면 =====
let workshopTab = 'skin', workshopBack = 'home';
function goWorkshop(tab, back) {
  if (tab) workshopTab = tab; workshopBack = back || (state.screen === 'reward' ? 'reward' : 'home');
  leaveActivity(); safeStore.removeItem('workshop_new'); workshopUnlockCheck(); safeStore.removeItem('workshop_new');
  showScreen('workshop'); renderWorkshop();
}
function workshopPreviewHTML() {
  const d = workshopData(), b = WORKSHOP_BOARDS.find(x => x.id === d.board && workshopBoardOpen(x)) || WORKSHOP_BOARDS[0], title = workshopTitle(), p = profileInfo();
  const layout = [['bR', null, 'bK', null], [null, 'bN', null, 'bP'], ['wP', null, 'wB', null], [null, 'wQ', null, 'wK']];
  const cells = layout.flatMap((row, r) => row.map((pc, c) => `<span style="background:${(r + c) % 2 ? b.dark : b.light}">${pc ? getPieceSVG(pc, 40) : ''}</span>`)).join('');
  return `<section class="workshop-preview" aria-label="지금 꾸민 체스 세트"><div class="workshop-board" style="border-color:${b.border}" role="img" aria-label="${b.name} 위의 ${t(SKIN_META[currentSkin]?.nameKey || 'skinCute')} 말">${cells}</div><div class="workshop-tag"><span class="workshop-avatar" aria-hidden="true">${p.icon}</span><strong>${profileText(p.name)}</strong><span class="workshop-title-badge">${title.icon} ${title.name}</span><button class="play-chip workshop-effect-btn" onclick="workshopPlayEffect()">▶ 효과 보기</button></div></section>`;
}
function workshopCard({ id, selected, open, label, sub, preview, action }) {
  return `<button class="workshop-card${selected ? ' active' : ''}${open ? '' : ' locked'}" aria-pressed="${selected}" aria-label="${label}${selected ? ' · 사용 중' : open ? '' : ' · 잠김 · ' + sub}" onclick="${action}">${preview}<strong>${label}</strong><small>${selected ? '✓ 사용 중' : open ? '눌러서 쓰기' : '🔒 ' + sub}</small></button>`;
}
function renderWorkshop() {
  const d = workshopData(), stars = getAllStars();
  const tabs = [['skin', '말'], ['board', '판'], ['effect', '효과'], ['title', '칭호']];
  let grid = '';
  if (workshopTab === 'skin') grid = SKIN_ORDER.filter(workshopSkinVisible).map(name => workshopCard({ id: name, selected: currentSkin === name, open: isSkinUnlocked(name), label: t(SKIN_META[name].nameKey), sub: `별 ${SKIN_UNLOCK[name] || 0}개`, preview: `<span class="workshop-pieces">${['wK', 'wQ', 'bN'].map(pc => getPieceSVGForSkin(name, pc, 30)).join('')}</span>`, action: isSkinUnlocked(name) ? `workshopPick('skin','${name}')` : `openSkinDetail('${name}')` })).join('');
  if (workshopTab === 'board') grid = WORKSHOP_BOARDS.map(b => workshopCard({ id: b.id, selected: d.board === b.id, open: workshopBoardOpen(b), label: b.name, sub: `별 ${b.stars}개 (지금 ${stars})`, preview: `<span class="workshop-swatch" style="border-color:${b.border}"><i style="background:${b.light}"></i><i style="background:${b.dark}"></i><i style="background:${b.dark}"></i><i style="background:${b.light}"></i></span>`, action: workshopBoardOpen(b) ? `workshopPick('board','${b.id}')` : `workshopLocked('별 ${b.stars}개를 모으면 열려요. 지금 ${stars}개예요.')` })).join('');
  if (workshopTab === 'effect') grid = WORKSHOP_EFFECTS.map(e => workshopCard({ id: e.id, selected: d.effect === e.id, open: workshopHas(e.need), label: e.name, sub: WORKSHOP_NEED_TEXT[e.need] || '', preview: `<span class="workshop-emoji" aria-hidden="true">${e.icon}</span>`, action: workshopHas(e.need) ? `workshopPick('effect','${e.id}')` : `workshopLocked('${WORKSHOP_NEED_TEXT[e.need]}을(를) 하면 열려요.')` })).join('');
  if (workshopTab === 'title') grid = WORKSHOP_TITLES.map(x => workshopCard({ id: x.id, selected: d.title === x.id, open: workshopHas(x.need), label: x.name, sub: WORKSHOP_NEED_TEXT[x.need] || '', preview: `<span class="workshop-emoji" aria-hidden="true">${x.icon}</span>`, action: workshopHas(x.need) ? `workshopPick('title','${x.id}')` : `workshopLocked('${WORKSHOP_NEED_TEXT[x.need]}을(를) 하면 받아요.')` })).join('');
  const back = workshopBack === 'reward' ? `<button class="back-btn" onclick="goReward()">← 내가 모은 별</button>` : `<button class="back-btn" onclick="showScreen('home');renderHome()">← 홈</button>`;
  document.getElementById('screen-workshop').innerHTML = `<div class="screen-wrap workshop-screen"><div class="screen-header">${back}<h2>나의 체스 공방</h2></div>${workshopPreviewHTML()}
    <div class="workshop-tabs" role="tablist" aria-label="꾸밀 것">${tabs.map(([id, label]) => `<button role="tab" aria-selected="${workshopTab === id}" class="workshop-tab${workshopTab === id ? ' active' : ''}" onclick="workshopTab='${id}';renderWorkshop()">${label}</button>`).join('')}</div>
    <div class="workshop-grid" role="tabpanel">${grid}</div>
    <p class="section-note">⭐ ${stars} · 꾸미기는 놀이와 배움으로 열어요. 돈으로 사는 꾸미기는 없어요.</p></div>`;
}
function workshopPick(kind, id) {
  if (kind === 'skin') { if (!isSkinUnlocked(id) || !workshopSkinVisible(id)) return; setSkin(id); }
  else workshopSave(d => { if (kind === 'board' && WORKSHOP_BOARDS.some(b => b.id === id && workshopBoardOpen(b))) d.board = id; if (kind === 'effect' && WORKSHOP_EFFECTS.some(e => e.id === id && workshopHas(e.need))) d.effect = id; if (kind === 'title' && WORKSHOP_TITLES.some(t => t.id === id && workshopHas(t.need))) d.title = id; });
  applyWorkshop(); renderWorkshop();
  if (kind === 'effect') workshopPlayEffect();
}
function workshopLocked(text) { showActivityDialog('🔒 아직 잠겨 있어요', `<p>${text}</p>`, [{ label: '알겠어요', action: () => {} }]); }
function workshopPlayEffect() { spawnParticles(); }
