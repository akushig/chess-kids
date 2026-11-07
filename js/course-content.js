// 승급 과정 교재 (docs/PREMIUM_COURSE.md §2)
// 무료 체스 수업(한 수 + 상대의 바로 다음 대응)의 다음 단계. 세 단계 × 네 주제 × 15판.
// 판 배치는 scripts/generate-course-levels.cjs가 js/course-gen.js로 만든 js/course-levels.js(COURSE_LEVEL_DATA)에서 온다.
const COURSE_CONTENT_VERSION = 1;
const COURSE_STAGES = [
  { id: 'stage1', number: 1, title: '두 수로 이기기', icon: '⚔️', entitlement: 'course_stage1', matchLevel: 2,
    summary: '두 수 앞을 내다보고 체크메이트와 이득을 만들어요.', title2: '두 수 박사' },
  { id: 'stage2', number: 2, title: '끝내기 달인', icon: '👑', entitlement: 'course_stage2', matchLevel: 3,
    summary: '말이 적게 남았을 때 확실하게 이기는 방법을 익혀요.', title2: '끝내기 달인' },
  { id: 'stage3', number: 3, title: '첫 수부터 잘 두기', icon: '🏰', entitlement: 'course_stage3', matchLevel: 4,
    summary: '게임 처음 몇 수를 원칙대로 두는 습관을 만들어요.', title2: '초반 박사' },
];
const COURSE_CATALOG = [
  { id: 'm2-check', stage: 'stage1', free: true, title: '체크로 몰아 메이트', skill: '체크를 이어서 두 수 만에 체크메이트해요',
    learned: '체크를 이어 두면 상대는 킹을 지키는 수만 둘 수 있어요. 두 번째 체크가 메이트가 되도록 길을 내다봐요.' },
  { id: 'm2-quiet', stage: 'stage1', title: '길을 막고 메이트', skill: '체크가 아닌 조용한 수로 킹의 길을 먼저 막아요',
    learned: '체크가 아니어도 상대 킹이 도망갈 칸을 먼저 막으면, 다음 수에 피할 곳이 없어요.' },
  { id: 'm2-sac', stage: 'stage1', title: '내주고 메이트', skill: '내 말을 내주어 상대 말을 끌어낸 뒤 메이트해요',
    learned: '내 말을 내주면 상대가 원하지 않는 칸으로 끌려와요. 잡힌 뒤의 메이트까지 내다보면 희생도 작전이에요.' },
  { id: 'remove-defender', stage: 'stage1', title: '두 수로 말 얻기', skill: '첫 수로 흔들고(체크·공격), 두 번째 수에 말을 잡아요',
    learned: '지켜진 말은 바로 잡으면 손해예요. 체크나 공격으로 먼저 흔들면, 두 번째 수에 지켜지지 않은 말을 잡을 수 있어요.' },
  { id: 'eg-kqk', stage: 'stage2', free: true, title: '퀸으로 메이트', skill: '퀸과 킹으로 상대 킹을 가장자리로 몰아 메이트해요',
    learned: '퀸은 상대 킹과 나이트 한 번 거리에서 따라가며 가장자리로 몰아요. 마지막에는 내 킹이 다가와 도와요. 스테일메이트 조심!' },
  { id: 'eg-krk', stage: 'stage2', title: '룩으로 메이트', skill: '룩으로 상자를 만들고 킹과 함께 줄여요',
    learned: '룩으로 줄을 막아 상자를 만들고, 킹으로 룩을 지키며 상자를 한 줄씩 줄여요.' },
  { id: 'eg-krrk', stage: 'stage2', title: '두 룩 사다리 메이트', skill: '두 룩이 번갈아 한 줄씩 밀어 메이트해요',
    learned: '두 룩이 한 줄씩 번갈아 막으며 사다리처럼 밀어요. 룩이 상대 킹 바로 옆에 서면 잡혀요.' },
  { id: 'eg-kpk', stage: 'stage2', title: '폰을 퀸으로', skill: '킹이 폰을 도와 끝 줄까지 보내요',
    learned: '폰 혼자 달릴 때 상대 킹이 따라잡을 수 있는지 봐요. 못 달리면 킹이 폰 앞에서 길을 열어 줘요.' },
  { id: 'op-center', stage: 'stage3', free: true, title: '가운데 차지하기', skill: '폰과 나이트로 가운데 네 칸을 차지하거나 노려요',
    learned: '처음에는 가운데 네 칸(d4·e4·d5·e5)을 폰과 나이트로 차지하거나 노려요. 가장자리 폰은 나중에!' },
  { id: 'op-develop', stage: 'stage3', title: '작은 말 꺼내기', skill: '나이트와 비숍을 안전한 칸으로 꺼내요',
    learned: '나이트와 비숍을 먼저 꺼내요. 나이트는 가장자리보다 가운데 쪽이 좋아요. 퀸은 나중에 나와요.' },
  { id: 'op-castle', stage: 'stage3', title: '캐슬링으로 킹 지키기', skill: '킹을 두 칸 옮겨 룩과 자리를 바꿔요',
    learned: '킹이 가운데 오래 있으면 위험해요. 캐슬링으로 킹은 구석으로, 룩은 가운데로 보내요.' },
  { id: 'op-trap', stage: 'stage3', title: '초반 함정 막기', skill: '상대 퀸이 노리는 체크메이트를 미리 막아요',
    learned: '초반에 상대 퀸과 비숍이 내 킹 옆 칸(f2)을 노리면 위험해요. 그 칸을 지키거나 길을 막아요.' },
];
const COURSE_TOPICS = COURSE_CATALOG.filter(t => COURSE_LEVEL_DATA[t.id] && CG_TOPICS[t.id]).map(t => {
  const spec = CG_TOPICS[t.id], stage = COURSE_STAGES.find(s => s.id === t.stage);
  return { ...t, mode: spec.mode, piece: spec.piece || null, topic: spec.topic || null, stageNumber: stage.number, entitlement: stage.entitlement,
    number: COURSE_CATALOG.filter(x => x.stage === t.stage).indexOf(t) + 1,
    levels: COURSE_LEVEL_DATA[t.id].map(level => ({ ...level })) };
});
const COURSE_FREE_LEVELS = 3;  // 잠긴 주제도 처음 3판(첫걸음 단계)은 무료로 해 볼 수 있다
function courseTopic(id) { return typeof id === 'string' ? COURSE_TOPICS.find(t => t.id === id) || null : null; }
function courseStage(id) { return COURSE_STAGES.find(s => s.id === id) || null; }
function courseStageTopics(stageId) { return COURSE_TOPICS.filter(t => t.stage === stageId); }
function courseOwnsStage(stageId) { const s = courseStage(stageId); return !!s && storeOwns(s.entitlement); }
// 판 하나를 열 수 있는가: 단계를 샀거나, 무료 주제이거나, 처음 3판.
function courseLevelOpen(topic, index) { return courseOwnsStage(topic.stage) || topic.free || index < COURSE_FREE_LEVELS; }
function courseDrillOpen(topic) { return courseOwnsStage(topic.stage) || topic.free; }
function courseGame(level) { return ChessGame.fromFEN(level.fen); }

// ===== 기록 =====
// course_progress_v1: 주제별 혼자 성공(solved)·힌트 성공(helped) 판 ID, 연습 기록, 승급 시험, 실전 승급전.
function courseProgressEmpty() { return { version: 1, topics: {}, drill: {}, tests: {}, matches: {} }; }
function courseProgressValid(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p) || p.version !== 1) return false;
  const obj = v => !!v && typeof v === 'object' && !Array.isArray(v), count = (n, max = 1e7) => Number.isInteger(n) && n >= 0 && n <= max, time = n => Number.isFinite(n) && n > 0 && n < 4102444800000;
  if (!['topics', 'drill', 'tests', 'matches'].every(k => obj(p[k]))) return false;
  if (!Object.entries(p.topics).every(([id, t]) => { const topic = courseTopic(id); return !!topic && obj(t) && ['solved', 'helped'].every(k => t[k] === undefined || Array.isArray(t[k]) && t[k].length <= topic.levels.length && new Set(t[k]).size === t[k].length && t[k].every(x => topic.levels.some(l => l.id === x))) && !(t.helped || []).some(x => (t.solved || []).includes(x)) && (t.completed === undefined || typeof t.completed === 'boolean'); })) return false;
  if (!Object.entries(p.drill).every(([id, s]) => !!courseTopic(id) && obj(s) && ['solved', 'helped', 'best'].every(k => Array.isArray(s[k]) && s[k].length === 5 && s[k].every(n => count(n))))) return false;
  if (!Object.entries(p.tests).every(([id, t]) => !!courseStage(id) && obj(t) && typeof t.passed === 'boolean' && count(t.score, 10) && count(t.total, 10) && t.score <= t.total && time(t.at) && (t.best === undefined || count(t.best, 10)))) return false;
  return Object.entries(p.matches).every(([id, at]) => !!courseStage(id) && time(at));
}
function courseProgress() { const p = readData('course_progress_v1', null); return courseProgressValid(p) ? p : courseProgressEmpty(); }
function courseProgressSave(change) { const p = courseProgress(); change(p); writeData('course_progress_v1', p); return p; }
function courseTopicMarks(topic) {
  const t = courseProgress().topics[topic.id] || {}, solved = new Set(t.solved || []), helped = new Set(t.helped || []);
  return topic.levels.map(l => solved.has(l.id) ? 'solved' : helped.has(l.id) ? 'helped' : null);
}
function courseRecordSolve(topic, level, hinted) {
  courseProgressSave(p => {
    const t = p.topics[topic.id] || {}, solved = new Set(t.solved || []), helped = new Set(t.helped || []);
    if (hinted) { if (!solved.has(level.id)) helped.add(level.id); } else { solved.add(level.id); helped.delete(level.id); }
    const done = topic.levels.every(l => solved.has(l.id) || helped.has(l.id));
    p.topics[topic.id] = { solved: [...solved], ...(helped.size ? { helped: [...helped] } : {}), ...(done || t.completed ? { completed: true } : {}) };
  });
}
function courseTopicDone(topic) { return !!courseProgress().topics[topic.id]?.completed; }
function courseDrillStats(id) { return courseProgress().drill[id] || { solved: [0, 0, 0, 0, 0], helped: [0, 0, 0, 0, 0], best: [0, 0, 0, 0, 0] }; }
function courseStageSummary(stageId) {
  const topics = courseStageTopics(stageId), p = courseProgress();
  const cleared = topics.reduce((n, t) => n + courseTopicMarks(t).filter(Boolean).length, 0), total = topics.reduce((n, t) => n + t.levels.length, 0);
  return { topics, cleared, total, done: topics.filter(t => p.topics[t.id]?.completed).length, test: p.tests[stageId] || null, match: p.matches[stageId] || null };
}
function courseCertificateReady(stageId) { return !!courseProgress().tests[stageId]?.passed; }
