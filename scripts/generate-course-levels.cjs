#!/usr/bin/env node
// 승급 과정 판 생성기 실행 (docs/PREMIUM_COURSE.md §4)
// 생성 규칙은 js/course-gen.js(앱의 연습·시험과 같은 코드)에 있다. 주제마다 고정 시드로 단계별 후보를 모아
// 5단계 × 3판 = 15판을 고르고(난이도 점수가 판 번호를 따라 오르도록), 연습 판의 난이도 범위를 정한다.
// 사용: node scripts/generate-course-levels.cjs [--only id,id]   (--only: 그 주제만 다시 만들고 나머지는 지금 파일 그대로)
const fs = require('node:fs'), path = require('node:path');
const fastLoad = require('./fast-load.cjs');
const APP = fastLoad(['js/course-rules.js', 'js/course-gen.js'], ['CG_TOPICS', 'CG_TIER_NAMES', 'cgCandidate', 'cgLevelOf', 'crTable', 'lgSeed']);
const { run } = APP;
const OUT = path.join(__dirname, '..', 'js', 'course-levels.js');
const onlyArg = process.argv.indexOf('--only'), only = onlyArg > 0 ? process.argv[onlyArg + 1].split(',') : null;
const ids = Object.keys(APP.CG_TOPICS);
run("crTable('Q');crTable('R');crTable('P')");
let previous = {};
if (only && fs.existsSync(OUT)) { const m = fs.readFileSync(OUT, 'utf8'); previous = JSON.parse(m.match(/const COURSE_LEVEL_DATA = (\{[\s\S]*?\});\nconst COURSE_DRILL_BANDS/)[1]); previous.__bands = JSON.parse(m.match(/const COURSE_DRILL_BANDS = (\{.*\});/)[1]); }
const data = {}, bands = {};
for (const id of ids) {
  if (only && !only.includes(id) && previous[id]) { data[id] = previous[id]; bands[id] = previous.__bands[id]; continue; }
  const spec = APP.CG_TOPICS[id], slow = spec.mode === 'opening' || spec.mode === 'ladder' || id === 'remove-defender' || id === 'm2-quiet' || id === 'm2-sac';
  const poolMax = slow ? 24 : 40, levels = [], seen = new Set(), tierBands = [];
  run(`lgSeed = ${spec.seed}`);
  let floor = 0;
  for (let ti = 0; ti < 5; ti++) {
    const pool = [], started = Date.now(), limit = spec.attempts || 80000;
    for (let n = 0; n < limit && pool.length < poolMax && Date.now() - started < 240000; n++) {
      const a = APP.cgCandidate(id, ti, seen); if (!a) continue;
      pool.push(a); seen.add(a.fen);
    }
    if (pool.length < 3) throw Error(`${id} ${ti + 1}단계 후보 부족: ${pool.length}개`);
    pool.sort((x, y) => x.score - y.score);
    const above = pool.filter(a => a.score >= floor), sorted = above.length >= 3 ? above : pool;
    const pick3 = diverse => {
      const chosen = [], sigs = new Set();
      for (const q of [0.2, 0.5, 0.8]) {
        const start = Math.floor(q * (sorted.length - 1)), fits = a => !chosen.includes(a) && (!chosen.length || a.score >= chosen.at(-1).score);
        const cand = (diverse && sorted.slice(start).find(a => fits(a) && !sigs.has(a.sig))) || sorted.slice(start).find(fits) || sorted.find(fits);
        if (!cand) return null;
        chosen.push(cand); sigs.add(cand.sig);
      }
      return chosen;
    };
    const chosen = pick3(true) || pick3(false);
    if (!chosen) throw Error(`${id} ${ti + 1}단계 고르기 실패`);
    floor = chosen.at(-1).score;
    tierBands.push([pool[Math.floor(0.1 * (pool.length - 1))].score, pool[Math.floor(0.95 * (pool.length - 1))].score]);
    chosen.forEach(a => { const index = levels.length; levels.push({ id: `${spec.key}-${String(index + 1).padStart(2, '0')}`, ...APP.cgLevelOf(id, ti, a, index) }); });
    console.log(`  ${id} ${ti + 1}단계 후보 ${pool.length}개 (${((Date.now() - started) / 1000).toFixed(1)}초)`);
  }
  data[id] = levels; bands[id] = tierBands;
}
const text = `// 자동 생성: node scripts/generate-course-levels.cjs (직접 고치지 말고 js/course-gen.js를 고친다)
// 주제마다 5단계(첫걸음·쉬움·보통·어려움·도전) × 3판. score는 난이도 점수, witness는 검사용 예시 첫 수(유일한 정답이 아니다).
// limit은 끝내기의 제한 수, distance는 끝내기 계산표의 거리(반수)다.
const COURSE_LEVEL_DATA = ${JSON.stringify(data, null, 1)};
const COURSE_DRILL_BANDS = ${JSON.stringify(bands)};
`;
fs.writeFileSync(OUT, text);
console.log('저장:', path.relative(process.cwd(), OUT), Object.values(data).reduce((n, l) => n + l.length, 0) + '판');
