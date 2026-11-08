// 검사용 가짜 Nostr 릴레이 (docs/TWO_DEVICE_PLAY.md §저절로 다시 연결)
// 진짜 공개 릴레이처럼 메시지 번호(SHA-256)와 BIP-340 서명을 검사하고, 맞는 메시지만 같은 주제를 듣는 쪽에 전한다.
// 서명 검사는 앱 코드(js/net-meet.js)와 따로 만든 것이라, 앱의 서명이 진짜 릴레이에서도 통과하는지 확인하는 역할도 한다.
const http = require('node:http'), crypto = require('node:crypto');

const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn, N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const G = [0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n, 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n];
const mod = (a, m = P) => ((a % m) + m) % m;
const pow = (b, e, m = P) => { let r = 1n; b = mod(b, m); while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; };
// 아핀 좌표 덧셈(느리지만 검사에는 충분하다). null은 무한원점.
function add(a, b) {
  if (!a) return b; if (!b) return a;
  if (a[0] === b[0] && mod(a[1] + b[1]) === 0n) return null;
  const l = a[0] === b[0] ? mod(3n * a[0] * a[0] * pow(2n * a[1], P - 2n)) : mod((b[1] - a[1]) * pow(b[0] - a[0], P - 2n));
  const x = mod(l * l - a[0] - b[0]); return [x, mod(l * (a[0] - x) - a[1])];
}
function mul(pt, k) { let r = null; for (; k > 0n; k >>= 1n, pt = add(pt, pt)) if (k & 1n) r = add(r, pt); return r; }
const big = buf => BigInt('0x' + buf.toString('hex'));
const sha = (...parts) => crypto.createHash('sha256').update(Buffer.concat(parts)).digest();
const tagged = (tag, ...parts) => { const t = sha(Buffer.from(tag)); return sha(t, t, ...parts); };
function verify(pubHex, msg, sigHex) {
  const x = BigInt('0x' + pubHex); if (x >= P) return false;
  const y0 = pow(mod(x * x * x + 7n), (P + 1n) / 4n); if (mod(y0 * y0) !== mod(x * x * x + 7n)) return false;
  const pt = [x, y0 % 2n === 0n ? y0 : P - y0], sig = Buffer.from(sigHex, 'hex'), r = big(sig.subarray(0, 32)), s = big(sig.subarray(32));
  if (r >= P || s >= N) return false;
  const e = mod(big(tagged('BIP0340/challenge', sig.subarray(0, 32), Buffer.from(pubHex, 'hex'), msg)), N);
  const R = add(mul(G, s), mul(pt, N - e));
  return !!R && R[1] % 2n === 0n && R[0] === r;
}
function eventValid(ev) {
  if (!ev || typeof ev !== 'object' || !/^[0-9a-f]{64}$/.test(ev.id) || !/^[0-9a-f]{64}$/.test(ev.pubkey) || !/^[0-9a-f]{128}$/.test(ev.sig)) return false;
  const id = sha(Buffer.from(JSON.stringify([0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content])));
  return id.toString('hex') === ev.id && verify(ev.pubkey, id, ev.sig);
}

// --- 아주 작은 웹소켓 서버(글 프레임만) ---
function frame(text) {
  const body = Buffer.from(text), n = body.length, head = n < 126 ? Buffer.from([0x81, n]) : n < 65536 ? Buffer.from([0x81, 126, n >> 8, n & 255]) : null;
  if (!head) throw Error('too long');
  return Buffer.concat([head, body]);
}
function start() {
  const clients = new Set(), stats = { events: 0, bad: 0, delivered: 0, pubkeys: new Set() };
  const server = http.createServer((req, res) => { res.writeHead(426); res.end(); });
  server.on('upgrade', (req, socket) => {
    const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    const c = { socket, subs: new Map(), buf: Buffer.alloc(0) }; clients.add(c);
    const send = arr => { try { socket.write(frame(JSON.stringify(arr))); } catch {} };
    socket.on('data', chunk => {
      c.buf = Buffer.concat([c.buf, chunk]);
      for (;;) {
        if (c.buf.length < 2) return;
        const op = c.buf[0] & 15, masked = c.buf[1] & 128; let len = c.buf[1] & 127, off = 2;
        if (len === 126) { if (c.buf.length < 4) return; len = c.buf.readUInt16BE(2); off = 4; } else if (len === 127) { if (c.buf.length < 10) return; len = Number(c.buf.readBigUInt64BE(2)); off = 10; }
        const need = off + (masked ? 4 : 0) + len; if (c.buf.length < need) return;
        const mask = masked ? c.buf.subarray(off, off + 4) : null, data = Buffer.from(c.buf.subarray(need - len, need)); c.buf = c.buf.subarray(need);
        if (mask) for (let i = 0; i < data.length; i++) data[i] ^= mask[i & 3];
        if (op === 8) { try { socket.end(Buffer.from([0x88, 0])); } catch {} return; }
        if (op === 9) { try { socket.write(Buffer.concat([Buffer.from([0x8a, data.length]), data])); } catch {} continue; }
        if (op !== 1) continue;
        let m; try { m = JSON.parse(data.toString()); } catch { continue; }
        if (m[0] === 'REQ') c.subs.set(m[1], m[2] || {});
        else if (m[0] === 'CLOSE') c.subs.delete(m[1]);
        else if (m[0] === 'EVENT') {
          const ev = m[1], ok = eventValid(ev); stats.events++;
          send(['OK', ev?.id || '', ok, ok ? '' : 'invalid: bad signature or id']);
          if (!ok) { stats.bad++; continue; }
          stats.pubkeys.add(ev.pubkey);
          for (const o of clients) for (const [sub, f] of o.subs) {
            if (f.kinds && !f.kinds.includes(ev.kind)) continue;
            if (f['#x'] && !ev.tags.some(t => t[0] === 'x' && f['#x'].includes(t[1]))) continue;
            try { o.socket.write(frame(JSON.stringify(['EVENT', sub, ev]))); stats.delivered++; } catch {}
          }
        }
      }
    });
    socket.on('close', () => clients.delete(c)); socket.on('error', () => clients.delete(c));
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    url: `ws://127.0.0.1:${server.address().port}`, stats,
    // 잠깐 끊기: 붙어 있던 모든 기기의 연결을 끊는다(앱은 다시 붙어야 한다).
    drop() { for (const c of clients) try { c.socket.destroy(); } catch {} clients.clear(); },
    close() { for (const c of clients) try { c.socket.destroy(); } catch {} return new Promise(r => server.close(r)); },
  })));
}
module.exports = { start, verify, eventValid };
