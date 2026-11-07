// 생성 스크립트용 빠른 불러오기: 앱 스크립트를 함수 하나 안에서 실행해 전역 이름 찾기 비용을 없앤다.
// (tests/harness.cjs의 vm 전역은 정확하지만 느리다. 판 생성처럼 수백만 번 계산할 때만 쓴다.)
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
module.exports = function fastLoad(extra = [], names = []) {
  const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  for (const f of extra) if (!scripts.includes(f)) scripts.push(f);
  const store = new Map();
  const el = () => ({ innerHTML: '', classList: { add() {}, remove() {}, toggle() {} }, querySelector() { return null; }, querySelectorAll() { return []; }, remove() {}, appendChild() {}, setAttribute() {}, style: {} });
  const env = {
    window: {}, navigator: {}, console, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    document: { addEventListener() {}, querySelectorAll: () => [], getElementById: el, querySelector: () => null, body: { appendChild() {} }, createElement: el, documentElement: { classList: { toggle() {} }, setAttribute() {}, dataset: {} } },
    localStorage: { get length() { return store.size; }, key: i => [...store.keys()][i] ?? null, getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
  };
  const body = scripts.map(p => fs.readFileSync(path.join(root, p), 'utf8')).join('\n;\n');
  const exportNames = ['run', ...names];
  const fn = new Function(...Object.keys(env), `${body}\n;return { run: s => eval(s), ${names.join(', ')} };`);
  return fn(...Object.values(env));
};
