#!/usr/bin/env node
// 체스 수업 판 생성기 실행 (docs/lessons/LESSON_EXPANSION_V4.md §2·§3)
// 생성 규칙은 js/lesson-gen.js(앱의 무한 연습과 같은 코드)에 있다. 여기서는 고정 시드로 단계마다 후보를 모아
// 수업마다 5단계 × 3판 = 15판을 고르고(난이도 점수가 판 번호를 따라 오르도록), 무한 연습 난이도 범위를 정한다.
// 원래 세 수업은 v3와 같은 시드(20261107)·순서라 같은 45판이 나온다. 새 수업은 수업마다 자기 시드를 쓴다.
// 사용: node scripts/generate-lesson-levels.cjs [--check] [--only id,id]
//   --check  파일을 쓰지 않고 결과만 비교   --only  그 수업만 다시 만들고 나머지는 지금 파일 그대로
const fs = require('node:fs'), path = require('node:path');
const load = require('../tests/harness.cjs');
const { run, context: C } = load();
const J = expr => JSON.parse(run(`JSON.stringify(${expr})`));
const ORIGINAL = ['protect-escape-v3', 'protect-capture-v3', 'protect-all-v3'];
const ORDER = J('LESSON_ORDER');
const TIER_NAMES = J('LG_TIER_NAMES');
const sq = ([r, c]) => 'abcdefgh'[c] + (8 - r);

function generate(id, poolMax) {
  const spec = C.lgSpec(id), levels = [], seen = new Set(), bands = [];
  let floor = 0;
  spec.tiers.forEach((tier, ti) => {
    const pool = [], started = Date.now();
    for (let n = 0; n < (tier.attempts || 60000) && pool.length < poolMax; n++) {
      const a = C.lgCandidate(id, ti, seen); if (!a) continue;
      pool.push(a); seen.add(a.fen);
    }
    // 단계 안에서는 서로 다른 구성으로 세 판을 쉬운 순서대로 고른다. 단계 사이의 난이도 상승은 검사로 확인한다.
    pool.sort((x, y) => x.score - y.score);
    if (pool.length < 3) throw Error(`${id} ${ti + 1}단계 후보 부족: ${pool.length}개`);
    const above = pool.filter(a => a.score >= floor), sorted = above.length >= 3 ? above : pool;
    if (sorted === pool && floor) console.warn(`${id} ${ti + 1}단계: 앞 판(${floor})보다 어려운 후보가 부족해 단계 안 순서로 고름`);
    // 20%·50%·80% 지점에서 고르되 구성이 다른 판을 먼저 찾는다. 후보가 적어 끝까지 밀리면 구성 조건 없이 다시 고른다.
    const pick3 = diverse => {
      const chosen = [], sigs = new Set();
      for (const q of [0.2, 0.5, 0.8]) {
        const start = Math.floor(q * (sorted.length - 1)), fits = a => !chosen.includes(a) && (!chosen.length || a.score >= chosen.at(-1).score);
        const cand = (diverse && sorted.slice(start).find(a => fits(a) && !sigs.has(a.sig))) || sorted.slice(start).find(fits);
        if (!cand) return null;
        chosen.push(cand); sigs.add(cand.sig);
      }
      return chosen;
    };
    const chosen = pick3(true) || pick3(false);
    if (!chosen) throw Error(`${id} ${ti + 1}단계 고르기 실패`);
    floor = chosen.at(-1).score;
    // 무한 연습은 이 단계 후보 점수의 15%~90% 범위 안의 판만 쓴다(너무 쉽거나 어려운 판 제외).
    bands.push([pool[Math.floor(0.15 * (pool.length - 1))].score, pool[Math.floor(0.9 * (pool.length - 1))].score]);
    chosen.forEach(a => { const index = levels.length; levels.push({ id: `${spec.key}-${String(index + 1).padStart(2, '0')}`, ...C.lgLevelOf(id, ti, a, index) }); });
    if (!ORIGINAL.includes(id)) console.log(`  ${id} ${ti + 1}단계 후보 ${pool.length}개 (${((Date.now() - started) / 1000).toFixed(1)}초)`);
  });
  return { levels, bands };
}

const onlyArg = process.argv.indexOf('--only'), only = onlyArg > 0 ? process.argv[onlyArg + 1].split(',') : null;
const data = only ? J('LESSON_LEVEL_DATA') : {}, bands = only ? J('typeof LESSON_DRILL_BANDS === "undefined" ? {} : LESSON_DRILL_BANDS') : {};
const want = id => !only || only.includes(id) || ORIGINAL.includes(id) && only.some(x => ORIGINAL.includes(x));
// 원래 세 수업: 하나의 난수 흐름을 이어 쓴다.
if (want(ORIGINAL[0])) { run('lgSeed = 20261107'); for (const id of ORIGINAL) ({ levels: data[id], bands: bands[id] } = generate(id, 120)); }
for (const id of ORDER) {
  if (ORIGINAL.includes(id) || !want(id)) continue;
  run(`lgSeed = ${C.lgSpec(id).seed}`);
  ({ levels: data[id], bands: bands[id] } = generate(id, 80));
}
const out = Object.fromEntries(ORDER.map(id => [id, data[id]])), outBands = Object.fromEntries(ORDER.map(id => [id, bands[id]]));
const file = path.join(__dirname, '..', 'js', 'lesson-levels.js');
const compact = json => json.replace(/\[\n\s+(-?\d+),\n\s+(-?\d+),\n\s+(-?\d+),\n\s+(-?\d+)\n\s+\]/g, '[$1, $2, $3, $4]');
const body = `// 자동 생성: node scripts/generate-lesson-levels.cjs (직접 고치지 말고 js/lesson-gen.js를 고친다)\n// 수업마다 5단계(${TIER_NAMES.join('·')}) × 3판. score는 난이도 점수, safe/moves는 성공하는 수/전체 수.\nconst LESSON_TIER_NAMES = ${JSON.stringify(TIER_NAMES)};\nconst LESSON_LEVEL_DATA = ${compact(JSON.stringify(out, null, 1))};\n// 무한 연습 난이도 범위(단계별 [최소, 최대] 점수)\nconst LESSON_DRILL_BANDS = ${JSON.stringify(outBands)};\n`;
if (process.argv.includes('--check')) { const same = fs.existsSync(file) && fs.readFileSync(file, 'utf8') === body; console.log(same ? '생성 결과가 저장된 파일과 같습니다.' : '생성 결과가 저장된 파일과 다릅니다.'); process.exitCode = same ? 0 : 1; }
else { fs.writeFileSync(file, body); console.log('저장:', path.relative(process.cwd(), file)); }
for (const id of ORDER) {
  if (only && !want(id)) continue;
  console.log(`\n${id}`);
  for (const l of out[id]) console.log(` ${l.id} ${TIER_NAMES[l.tier - 1]} 점수 ${l.score} 성공 ${l.safe}/${l.moves}  ${l.fen.split(' ')[0]}  예시 ${sq(l.witness)}${sq(l.witness.slice(2))} 함정 ${sq(l.trap)}${sq(l.trap.slice(2))}  ${l.goal}`);
}
