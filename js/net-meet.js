// ===== 만남 장소: 짝 맺은 두 기기가 '다시 연결 정보'를 주고받는 곳 (docs/TWO_DEVICE_PLAY.md §저절로 다시 연결) =====
// 처음 연결(QR·초대장)이 되면 두 기기가 짝 열쇠(32바이트)를 데이터 채널로 나눠 갖는다. 연결이 끊기면 그 열쇠로 암호화한
// 메시지를 공개 Nostr 릴레이 여러 곳에 '잠깐 메시지'(종류 20000~29999: 릴레이가 저장하지 않고 그 순간 듣는 쪽에만 전한다)로 올려
// 서로 찾고, 새 연결 정보(초대·답장 코드)를 주고받는다. 릴레이는 암호문과 주제 해시, 접속한 기기의 IP만 본다.
// 나중에 우리 서버(Cloudflare)로 바꿀 때는 netMeetTransport 한 곳만 바꾸면 된다. 짝 열쇠·메시지 형식은 그대로 쓴다.
const NET_RELAYS = ['wss://relay.primal.net', 'wss://offchain.pub', 'wss://relay.snort.social', 'wss://nostr-pub.wellorder.net', 'wss://nostr.oxtr.dev', 'wss://nostr.data.haus'];
const NET_MEET_KIND = 21761;
const NET_MEET_LIMITS = { content: 8000, frame: 65536, seen: 300, age: 5 * 60 * 1000 };
// 검사는 window.NET_RELAYS로 가짜 릴레이를 쓴다. 웹 주소로 열린 화면이 아니면(Node 검사 등) 릴레이에 붙지 않는다.
function netRelayUrls() {
  if (Array.isArray(window.NET_RELAYS)) return window.NET_RELAYS;
  return /^https?:$/.test(window.location?.protocol || '') ? NET_RELAYS : [];
}

// --- 바이트 도구 (보내는 글은 모두 ASCII다) ---
function netAscii(s) { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); if (c > 127) throw Error('ascii'); b[i] = c; } return b; }
function netConcat(...parts) { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; }
function netHex(b) { return Array.from(b, x => x.toString(16).padStart(2, '0')).join(''); }
function netCrypto() { return window.crypto || globalThis.crypto; }
function netRandomBytes(n) { const b = new Uint8Array(n); netCrypto().getRandomValues(b); return b; }
async function netSha256(bytes) { return new Uint8Array(await netCrypto().subtle.digest('SHA-256', bytes)); }
function netPairKey() { return netBytesToB64url(netRandomBytes(32)); }
function netPairValid(k) { return typeof k === 'string' && /^[A-Za-z0-9_-]{43}$/.test(k); }

// --- secp256k1 Schnorr 서명 (BIP-340) ---
// Nostr 릴레이는 서명이 맞는 메시지만 받는다. 서명 열쇠는 앱을 열 때마다 새로 만드는 일회용이라 누구인지 드러나지 않는다.
const NET_SECP = {
  P: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn,
  N: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n,
  GX: 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n,
  GY: 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n,
};
function netMod(a, m) { const r = a % m; return r < 0n ? r + m : r; }
function netInv(a, m) {
  let lm = 1n, hm = 0n, low = netMod(a, m), high = m;
  while (low > 1n) { const q = high / low, nm = hm - lm * q, nw = high - low * q; hm = lm; high = low; lm = nm; low = nw; }
  return netMod(lm, m);
}
// 야코비안 좌표(X, Y, Z). Z가 0이면 무한원점.
function netPtDouble([X, Y, Z]) {
  const P = NET_SECP.P; if (Y === 0n || Z === 0n) return [0n, 1n, 0n];
  const A = X * X % P, B = Y * Y % P, C = B * B % P, D = netMod(2n * ((X + B) * (X + B) - A - C), P), E = 3n * A % P, F = E * E % P;
  const X3 = netMod(F - 2n * D, P);
  return [X3, netMod(E * (D - X3) - 8n * C, P), 2n * Y * Z % P];
}
function netPtAdd(p1, p2) {
  const P = NET_SECP.P, [X1, Y1, Z1] = p1, [X2, Y2, Z2] = p2;
  if (Z1 === 0n) return p2; if (Z2 === 0n) return p1;
  const Z1Z1 = Z1 * Z1 % P, Z2Z2 = Z2 * Z2 % P, U1 = X1 * Z2Z2 % P, U2 = X2 * Z1Z1 % P, S1 = Y1 * Z2 % P * Z2Z2 % P, S2 = Y2 * Z1 % P * Z1Z1 % P;
  if (U1 === U2) return S1 === S2 ? netPtDouble(p1) : [0n, 1n, 0n];
  const H = netMod(U2 - U1, P), I = 4n * H * H % P, J = H * I % P, r = netMod(2n * (S2 - S1), P), V = U1 * I % P, X3 = netMod(r * r - J - 2n * V, P);
  return [X3, netMod(r * (V - X3) - 2n * S1 * J, P), netMod(((Z1 + Z2) * (Z1 + Z2) - Z1Z1 - Z2Z2) * H, P)];
}
function netPtMulG(k) {
  let R = [0n, 1n, 0n], Q = [NET_SECP.GX, NET_SECP.GY, 1n];
  while (k > 0n) { if (k & 1n) R = netPtAdd(R, Q); Q = netPtDouble(Q); k >>= 1n; }
  const P = NET_SECP.P, zi = netInv(R[2], P), zi2 = zi * zi % P;
  return { x: R[0] * zi2 % P, y: R[1] * zi2 % P * zi % P };
}
function netBig(bytes) { return BigInt('0x' + (netHex(bytes) || '0')); }
function netBig32(n) { const h = n.toString(16).padStart(64, '0'), b = new Uint8Array(32); for (let i = 0; i < 32; i++) b[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16); return b; }
async function netTaggedHash(tag, ...parts) { const t = await netSha256(netAscii(tag)); return netSha256(netConcat(t, t, ...parts)); }
async function netSchnorrSign(msg, sk, aux) {
  const { N } = NET_SECP, d0 = netBig(sk);
  if (d0 <= 0n || d0 >= N) throw Error('key');
  const pt = netPtMulG(d0), d = pt.y % 2n === 0n ? d0 : N - d0, px = netBig32(pt.x);
  const ah = await netTaggedHash('BIP0340/aux', aux), t = netBig32(d).map((b, i) => b ^ ah[i]);
  const k0 = netMod(netBig(await netTaggedHash('BIP0340/nonce', t, px, msg)), N);
  if (k0 === 0n) throw Error('nonce');
  const R = netPtMulG(k0), k = R.y % 2n === 0n ? k0 : N - k0, rx = netBig32(R.x);
  const e = netMod(netBig(await netTaggedHash('BIP0340/challenge', rx, px, msg)), N);
  return netConcat(rx, netBig32(netMod(k + e * d, N)));
}
function netNostrKey() {
  for (;;) { const sk = netRandomBytes(32), d = netBig(sk); if (d > 0n && d < NET_SECP.N) return { sk, pub: netHex(netBig32(netPtMulG(d).x)) }; }
}
async function netNostrEvent(key, topic, content) {
  const created_at = Math.floor(Date.now() / 1000), tags = [['x', topic]];
  const id = await netSha256(netAscii(JSON.stringify([0, key.pub, created_at, NET_MEET_KIND, tags, content])));
  return { id: netHex(id), pubkey: key.pub, created_at, kind: NET_MEET_KIND, tags, content, sig: netHex(await netSchnorrSign(id, key.sk, netRandomBytes(32))) };
}

// --- 짝 열쇠로 주제·암호 열쇠 만들기, 봉하기·열기 (AES-GCM) ---
async function netMeetKeys(pair) {
  const secret = netB64urlToBytes(pair);
  const topic = netHex(await netSha256(netConcat(netAscii('chess-kids|meet-topic|1|'), secret)));
  const raw = await netSha256(netConcat(netAscii('chess-kids|meet-key|1|'), secret));
  return { topic, aes: await netCrypto().subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']) };
}
async function netMeetSeal(k, text) {
  const iv = netRandomBytes(12), ct = new Uint8Array(await netCrypto().subtle.encrypt({ name: 'AES-GCM', iv, additionalData: netAscii(k.topic) }, k.aes, netAscii(text)));
  return netBytesToB64url(netConcat(iv, ct));
}
async function netMeetOpen(k, content) {
  if (typeof content !== 'string' || content.length > NET_MEET_LIMITS.content || !/^[A-Za-z0-9_-]{40,}$/.test(content)) return null;
  try {
    const b = netB64urlToBytes(content);
    const pt = new Uint8Array(await netCrypto().subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12), additionalData: netAscii(k.topic) }, k.aes, b.slice(12)));
    let s = ''; for (const c of pt) { if (c > 127) return null; s += String.fromCharCode(c); }
    return s;
  } catch { return null; }
}

// --- 공개 릴레이 여러 곳에 동시에 붙기 ---
// 하나라도 붙어 있으면 메시지가 오간다. 끊긴 곳은 2초 → 5초 → 15초 → 30초 간격으로 다시 붙는다.
class NetRelayPool {
  constructor(urls, topic, onContent, onStatus) {
    Object.assign(this, { topic, onContent, onStatus, key: netNostrKey(), sub: 'ck' + netRandom(10), closed: false, last: null, seen: new Set(), socks: urls.map(url => ({ url, ws: null, open: false, retry: 0, timer: null, rejected: '' })) });
    for (const s of this.socks) this._connect(s);
  }
  _connect(s) {
    if (this.closed) return;
    let ws; try { ws = new WebSocket(s.url); } catch { return this._retry(s); }
    s.ws = ws;
    ws.onopen = () => {
      if (this.closed || s.ws !== ws) return;
      s.open = true; s.retry = 0;
      try { ws.send(JSON.stringify(['REQ', this.sub, { kinds: [NET_MEET_KIND], '#x': [this.topic], since: Math.floor(Date.now() / 1000) - 120 }])); } catch {}
      // 붙기 전에 보낸 메시지가 방금(10초 안)이면 이 릴레이에도 보낸다.
      if (this.last && Date.now() - this.last.at < 10000) try { ws.send(JSON.stringify(['EVENT', this.last.ev])); } catch {}
      this.onStatus?.();
    };
    ws.onmessage = e => this._message(s, e.data);
    ws.onclose = () => { if (s.ws !== ws) return; const was = s.open; s.open = false; s.ws = null; if (was) this.onStatus?.(); this._retry(s); };
    ws.onerror = () => {};
  }
  _retry(s) { if (this.closed) return; clearTimeout(s.timer); s.timer = setTimeout(() => this._connect(s), [2000, 5000, 15000, 30000][Math.min(s.retry++, 3)]); }
  _message(s, data) {
    if (typeof data !== 'string' || data.length > NET_MEET_LIMITS.frame) return;
    let m; try { m = JSON.parse(data); } catch { return; }
    if (!Array.isArray(m)) return;
    if (m[0] === 'EVENT' && m[1] === this.sub) {
      const ev = m[2];
      if (!ev || typeof ev.id !== 'string' || ev.pubkey === this.key.pub || ev.kind !== NET_MEET_KIND || typeof ev.content !== 'string' || this.seen.has(ev.id)) return;
      if (!Array.isArray(ev.tags) || !ev.tags.some(t => Array.isArray(t) && t[0] === 'x' && t[1] === this.topic)) return;
      this.seen.add(ev.id); if (this.seen.size > NET_MEET_LIMITS.seen) this.seen.delete(this.seen.values().next().value);
      this.onContent(ev.content);
    } else if (m[0] === 'OK' && m[2] === false) s.rejected = String(m[3] || '').slice(0, 80);
  }
  async publish(content) {
    if (this.closed) return 0;
    const ev = await netNostrEvent(this.key, this.topic, content); this.last = { ev, at: Date.now() };
    let sent = 0; for (const s of this.socks) if (s.open) try { s.ws.send(JSON.stringify(['EVENT', ev])); sent++; } catch {}
    return sent;
  }
  openCount() { return this.socks.filter(s => s.open).length; }
  close() { this.closed = true; for (const s of this.socks) { clearTimeout(s.timer); const ws = s.ws; s.ws = null; s.open = false; try { ws?.close(); } catch {} } }
}
// 만남 장소를 고르는 한 곳. 우리 서버로 바꿀 때 같은 모양({publish, openCount, close})을 돌려주는 전송기로 바꾼다.
function netMeetTransport(topic, onContent, onStatus) { return new NetRelayPool(netRelayUrls(), topic, onContent, onStatus); }

// --- 만남: 봉한 메시지를 보내고 받는다 ---
// 메시지 {k: knock(나 여기 있어) | offer(초대 코드) | answer(답장 코드), g: 대국 번호, c: 코드} + {v, s: 이 화면 번호, q: 순번, ts}
class NetMeet {
  constructor(pair, handlers = {}) {
    Object.assign(this, { h: handlers, session: netRandom(8), q: 0, seen: new Map(), closed: false, k: null, transport: null, failed: false });
    this.ready = netMeetKeys(pair).then(k => {
      if (this.closed) return;
      this.k = k; this.transport = netMeetTransport(k.topic, c => this._in(c), () => this.h.onStatus?.(this));
    }).catch(() => { this.failed = true; this.h.onStatus?.(this); });
  }
  async send(obj) {
    await this.ready; if (this.closed || !this.transport) return 0;
    try { return await this.transport.publish(await netMeetSeal(this.k, JSON.stringify({ ...obj, v: 1, s: this.session, q: ++this.q, ts: Date.now() }))); } catch { return 0; }
  }
  async _in(content) {
    if (this.closed || !this.k) return;
    const text = await netMeetOpen(this.k, content); if (!text || this.closed) return;
    let m; try { m = JSON.parse(text); } catch { return; }
    if (!m || m.v !== 1 || typeof m.s !== 'string' || m.s === this.session || !Number.isInteger(m.q) || typeof m.k !== 'string' || !Number.isFinite(m.ts)) return;
    if (Math.abs(Date.now() - m.ts) > NET_MEET_LIMITS.age) return;
    const id = m.s + ':' + m.q; if (this.seen.has(id)) return;
    this.seen.set(id, 1); if (this.seen.size > NET_MEET_LIMITS.seen) this.seen.delete(this.seen.keys().next().value);
    this.h.onMessage?.(m, this);
  }
  relays() { return this.transport ? this.transport.openCount() : 0; }
  close() { this.closed = true; this.transport?.close(); this.transport = null; }
}
