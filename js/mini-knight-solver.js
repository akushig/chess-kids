// ===== 나이트 투어 솔버 =====
// 현재 위치에서 남은 칸을 모두 한 번씩 도는 경로를 찾거나, 불가능함을 증명

const KNIGHT_DELTAS = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const KT_NEIGHBORS = {};

// 칸 번호(r*size+c)별 나이트 이웃 목록 (크기별 캐시)
function ktNeighbors(size) {
  if (!KT_NEIGHBORS[size]) {
    const list = [];
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) {
        const nb = [];
        for (const [dr, dc] of KNIGHT_DELTAS) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < size && cc >= 0 && cc < size) nb.push(rr * size + cc);
        }
        list.push(nb);
      }
    KT_NEIGHBORS[size] = list;
  }
  return KT_NEIGHBORS[size];
}

// board: true = 이미 방문한 칸, start: 현재 위치 [r, c]
// 반환: { path: [[r,c], ...] } 완주 경로(현재 위치 포함)
//       { path: null }          완주 불가 확정
//       { timeout: true }       탐색 한도 초과 (판단 보류)
function ktFindPath(board, size, start, nodeLimit) {
  const nb = ktNeighbors(size);
  const N = size * size;
  const used = new Uint8Array(N);
  const color = new Uint8Array(N);
  let left = 0;
  for (let i = 0; i < N; i++) {
    const r = (i / size) | 0, c = i % size;
    used[i] = board[r][c] ? 1 : 0;
    color[i] = (r + c) & 1;
    if (!used[i]) left++;
  }
  const s = start[0] * size + start[1];
  used[s] = 1;
  if (left === 0) return { path: [start] };

  // 나이트는 매번 칸 색이 바뀌므로, 남은 칸의 색 개수가 맞지 않으면 불가능
  let opp = 0, own = 0;
  for (let i = 0; i < N; i++) if (!used[i]) color[i] !== color[s] ? opp++ : own++;
  if (opp !== own && opp !== own + 1) return { path: null };

  // deg[i] = 아직 안 간 이웃 칸 수
  const deg = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (!used[i]) for (const j of nb[i]) if (!used[j]) deg[i]++;
  // Warnsdorff 동점일 때 가장자리 칸 우선
  const center = (size - 1) / 2;
  const far = new Float64Array(N);
  for (let i = 0; i < N; i++) far[i] = Math.abs((i / size | 0) - center) + Math.abs(i % size - center);

  const adj = new Uint8Array(N);
  const seen = new Uint32Array(N);
  const queue = new Int32Array(N);
  let stamp = 0;
  let endV = -1;

  // 가지치기: 이 상태에서 완주가 명백히 불가능하면 false
  function feasible(cur, left) {
    for (const j of nb[cur]) adj[j] = 1;
    let ends = 0, first = -1, ok = true;
    endV = -1;
    for (let i = 0; i < N && ok; i++) {
      if (used[i]) continue;
      if (first < 0) first = i;
      const d = deg[i] + adj[i];
      if (d === 0) ok = false;              // 들어갈 길이 없는 칸
      else if (d === 1) {                   // 막다른 칸 = 반드시 마지막 칸
        endV = i;
        if (++ends > 1 || (adj[i] && left > 1)) ok = false;
      }
    }
    for (const j of nb[cur]) adj[j] = 0;
    if (!ok) return false;
    // 마지막 칸이 정해졌다면 그 칸의 색이 남은 이동 횟수와 맞아야 함
    if (endV >= 0 && (color[endV] ^ color[cur]) !== (left & 1)) return false;

    // 남은 칸이 하나로 이어져 있어야 함
    stamp++;
    let head = 0, tail = 0, count = 1;
    queue[tail++] = first; seen[first] = stamp;
    while (head < tail) {
      const x = queue[head++];
      for (const y of nb[x]) if (!used[y] && seen[y] !== stamp) { seen[y] = stamp; count++; queue[tail++] = y; }
    }
    if (count !== left) return false;
    return noBadCut(cur);
  }

  // 현재 위치를 뿌리로 DFS: 어떤 칸 p를 지나야만 들어갈 수 있는 덩어리는 경로의 마지막 구간이 됨
  // → 그런 덩어리가 p마다 하나 이하, 마지막 칸을 포함, 색 개수가 맞아야 함
  const disc = new Int32Array(N), low = new Int32Array(N), parent = new Int32Array(N);
  const iter = new Int32Array(N), cuts = new Int32Array(N), hasEnd = new Uint8Array(N);
  const c0 = new Int32Array(N), c1 = new Int32Array(N), stack = new Int32Array(N);
  function noBadCut(cur) {
    stamp++;
    let time = 0, sp = 0;
    stack[sp++] = cur; seen[cur] = stamp; disc[cur] = low[cur] = ++time;
    parent[cur] = -1; iter[cur] = 0; cuts[cur] = 0; hasEnd[cur] = 0; c0[cur] = c1[cur] = 0;
    while (sp) {
      const x = stack[sp - 1];
      if (iter[x] < nb[x].length) {
        const y = nb[x][iter[x]++];
        if (used[y] && y !== cur) continue;
        if (seen[y] !== stamp) {
          seen[y] = stamp; disc[y] = low[y] = ++time; parent[y] = x; iter[y] = 0; cuts[y] = 0;
          hasEnd[y] = y === endV ? 1 : 0;
          c0[y] = color[y] === 0 ? 1 : 0; c1[y] = 1 - c0[y];
          stack[sp++] = y;
        } else if (y !== parent[x] && disc[y] < low[x]) low[x] = disc[y];
      } else {
        sp--;
        const p = parent[x];
        if (p < 0) continue;
        if (low[x] < low[p]) low[p] = low[x];
        if (hasEnd[x]) hasEnd[p] = 1;
        c0[p] += c0[x]; c1[p] += c1[x];
        if (p !== cur && low[x] >= disc[p]) {
          if (++cuts[p] > 1) return false;
          if (endV >= 0 && !hasEnd[x]) return false;
          const o = color[p] === 0 ? c1[x] : c0[x], m = color[p] === 0 ? c0[x] : c1[x];
          if (o !== m && o !== m + 1) return false;
        }
      }
    }
    return true;
  }

  // 같은 (방문한 칸 집합, 현재 위치)는 순서와 무관하게 결과가 같으므로 실패한 상태를 기억
  const failed = Array.from({ length: N }, () => new Set());
  let lo = 0, hi = 0;
  const flip = i => { if (i < 30) lo ^= 1 << i; else hi ^= 1 << (i - 30); };
  for (let i = 0; i < N; i++) if (used[i]) flip(i);

  const path = [s];
  let nodes = 0, timedOut = false;

  function dfs(cur, left) {
    if (left === 0) return true;
    const key = hi * 1073741824 + lo;
    if (failed[cur].has(key)) return false;
    if (++nodes > nodeLimit) { timedOut = true; return false; }
    if (!feasible(cur, left)) { failed[cur].add(key); return false; }
    const cands = nb[cur].filter(j => !used[j]).sort((a, b) => deg[a] - deg[b] || far[b] - far[a]);
    for (const v of cands) {
      used[v] = 1; flip(v);
      for (const w of nb[v]) deg[w]--;
      path.push(v);
      if (dfs(v, left - 1)) return true;
      if (timedOut) return false;
      path.pop();
      for (const w of nb[v]) deg[w]++;
      used[v] = 0; flip(v);
    }
    failed[cur].add(key);
    return false;
  }

  if (dfs(s, left)) return { path: path.map(i => [(i / size) | 0, i % size]) };
  return timedOut ? { timeout: true } : { path: null };
}
