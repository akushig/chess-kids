// ===== 두 기기 직접 연결 (docs/TWO_DEVICE_PLAY.md) =====
// 서버 없이 WebRTC 데이터 채널로 두 기기를 잇는다. 연결 정보는 사람이 옮긴다: 같은 방은 QR, 멀리서는 메신저.
// 코드: 'CK1' + 종류(o 초대 · a 답장 · m 편지) + '.' + base64url(본문). 본문은 '|'로 나눈 ASCII 글이다.
// 초대·답장 본문: 1|종류|연결번호|대국번호|정보|ice-ufrag|ice-pwd|지문(sha-256, base64url)|setup|mid|후보들
const NET_CODE_RE = /CK1([oam])\.([A-Za-z0-9_-]{8,4000})/;
const NET_DEFAULT_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
const NET_PUBLIC_URL = 'https://akushig.github.io/chess-kids/';
const NET_LIMITS = { message: 16384, moves: 600, candidates: 8 };
// ping: 살아 있다는 신호 간격 · weak: 이만큼 조용하면 '약함' · lost: 약함이 이만큼 이어지면 '끊김'
// away: 상대가 앱을 내린 동안 기다리는 시간 · stall: 답장을 넣은 뒤 이 시간 안에 안 붙으면 안내
const NET_TIMING = { ping: 2000, weak: 6000, lost: 20000, away: 180000, stall: 20000 };
const NET_MDNS_RE = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\.local$/i;

function netIceServers() { return Array.isArray(window.NET_ICE_SERVERS) ? window.NET_ICE_SERVERS : NET_DEFAULT_ICE; }
function netRandom(n) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', bytes = new Uint8Array(n);
  (window.crypto || globalThis.crypto).getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}
function netBytesToB64url(bytes) { let bin = ''; for (const b of bytes) bin += String.fromCharCode(b); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function netB64urlToBytes(s) { return Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0)); }
// 본문은 ASCII만 쓴다(이름 같은 글은 코드에 넣지 않고 연결된 뒤 데이터 채널로 보낸다).
function netEncodeText(text) { if (!/^[\x20-\x7e]*$/.test(text)) throw Error('ascii'); return netBytesToB64url(Array.from(text, ch => ch.charCodeAt(0))); }
function netDecodeText(s) { return String.fromCharCode(...netB64urlToBytes(s)); }

// --- SDP 줄이기 / 다시 만들기 ---
// 데이터 채널 하나만 쓰므로 SDP에서 바뀌는 값은 ICE 자격, DTLS 지문, 역할, mid, 후보 주소뿐이다.
function netSdpSummary(sdp) {
  const lines = String(sdp).split(/\r?\n/), val = prefix => { const l = lines.find(x => x.startsWith(prefix)); return l ? l.slice(prefix.length).trim() : ''; };
  const fp = val('a=fingerprint:').split(/\s+/), hex = (fp[1] || '').split(':');
  if ((fp[0] || '').toLowerCase() !== 'sha-256' || hex.length !== 32 || hex.some(h => !/^[0-9a-f]{2}$/i.test(h))) throw Error('fingerprint');
  const found = [], seen = new Set();
  for (const line of lines) {
    if (!line.startsWith('a=candidate:')) continue;
    const p = line.slice(12).trim().split(/\s+/);
    if (p.length < 8 || p[1] !== '1' || p[2].toLowerCase() !== 'udp' || p[6] !== 'typ') continue;
    const type = { host: 'h', srflx: 's', prflx: 's', relay: 'r' }[p[7]], addr = p[4], port = Number(p[5]);
    if (!type || !(port > 0 && port < 65536) || /^169\.254\./.test(addr) || /^fe80:/i.test(addr)) continue;
    const m = addr.match(NET_MDNS_RE), enc = (m ? 'm' + m.slice(1).join('').toLowerCase() : type + addr) + ',' + port;
    if (seen.has(enc)) continue; seen.add(enc);
    const v6 = !m && addr.includes(':');
    found.push({ enc, rank: (type === 'r' ? 30 : v6 ? 20 : type === 's' ? 10 : 0) + found.length });
  }
  const summary = { ufrag: val('a=ice-ufrag:'), pwd: val('a=ice-pwd:'), fp: netBytesToB64url(Uint8Array.from(hex, h => parseInt(h, 16))), setup: val('a=setup:'), mid: val('a=mid:') || '0', cands: found.sort((a, b) => a.rank - b.rank).slice(0, NET_LIMITS.candidates).map(c => c.enc) };
  if (!netSummaryValid(summary)) throw Error('sdp');
  return summary;
}
function netCandidateValid(c) {
  const m = /^([hsrm])([^,]{1,64}),(\d{1,5})$/.exec(c); if (!m || !(Number(m[3]) > 0 && Number(m[3]) < 65536)) return false;
  if (m[1] === 'm') return /^[0-9a-f]{32}$/.test(m[2]);
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(m[2]) || /^[0-9a-f:]{2,45}$/i.test(m[2]) && m[2].includes(':');
}
function netSummaryValid(s) {
  return /^[A-Za-z0-9+/]{4,256}$/.test(s.ufrag) && /^[A-Za-z0-9+/]{22,256}$/.test(s.pwd) && /^[A-Za-z0-9_-]{43}$/.test(s.fp)
    && ['actpass', 'active', 'passive'].includes(s.setup) && /^[A-Za-z0-9_-]{1,16}$/.test(s.mid) && Array.isArray(s.cands) && s.cands.length <= NET_LIMITS.candidates && s.cands.every(netCandidateValid);
}
function netBuildSdp(s) {
  const hex = Array.from(netB64urlToBytes(s.fp), b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
  const cands = s.cands.map((c, i) => {
    const [a, port] = c.split(','), kind = a[0]; let addr = a.slice(1), typ = 'host';
    if (kind === 'm') addr = `${addr.slice(0, 8)}-${addr.slice(8, 12)}-${addr.slice(12, 16)}-${addr.slice(16, 20)}-${addr.slice(20)}.local`;
    else if (kind === 's') typ = 'srflx'; else if (kind === 'r') typ = 'relay';
    const prio = (typ === 'host' ? 2122260223 : typ === 'srflx' ? 1686052607 : 41885439) - i;
    return `a=candidate:${i + 1} 1 udp ${prio} ${addr} ${port} typ ${typ}${typ === 'host' ? '' : ' raddr 0.0.0.0 rport 0'}`;
  });
  const id = String(Date.now()) + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  return ['v=0', `o=- ${id} 2 IN IP4 127.0.0.1`, 's=-', 't=0 0', `a=group:BUNDLE ${s.mid}`, 'a=msid-semantic: WMS', 'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0',
    `a=ice-ufrag:${s.ufrag}`, `a=ice-pwd:${s.pwd}`, 'a=ice-options:trickle', `a=fingerprint:sha-256 ${hex}`, `a=setup:${s.setup}`, `a=mid:${s.mid}`, 'a=sctp-port:5000', 'a=max-message-size:262144', ...cands, 'a=end-of-candidates', ''].join('\r\n');
}

// --- 코드 만들기 / 읽기 ---
// info(초대): 방법(r 같은 방 · m 멀리서) + 초대한 쪽 색(w·b) + 판(0 모든 말 · 1 짧은 판) + 목적(n 새 대국 · c 이어 두기)
function netMakeCode(kind, nonce, gid, info, sdp) {
  const s = netSdpSummary(sdp);
  return 'CK1' + kind + '.' + netEncodeText(['1', kind, nonce, gid, info, s.ufrag, s.pwd, s.fp, s.setup, s.mid, s.cands.join(';')].join('|'));
}
function netParseInfo(info) {
  const m = /^([rm])([wb])([01])([nc])$/.exec(info);
  return m ? { method: m[1] === 'r' ? 'room' : 'remote', hostColor: m[2], small: m[3] === '1', purpose: m[4] === 'n' ? 'new' : 'continue' } : null;
}
function netInfoText(method, hostColor, small, purpose) { return (method === 'room' ? 'r' : 'm') + hostColor + (small ? '1' : '0') + (purpose === 'new' ? 'n' : 'c'); }
// 편지 본문: 1|대국번호|판|받는 쪽 색|수 목록(,)|끝(- 또는 r:이긴 색 · d)
function netMakeLetter(gid, small, toColor, moves, end) {
  const e = !end ? '-' : end.type === 'resign' ? 'r:' + end.winner : 'd';
  return 'CK1m.' + netEncodeText(['1', gid, small ? '1' : '0', toColor, moves.join(','), e].join('|'));
}
function netParseCode(text) {
  const m = NET_CODE_RE.exec(String(text || '').replace(/\s+/g, '')); if (!m) return null;
  let body; try { body = netDecodeText(m[2]); } catch { return null; }
  if (!/^[\x20-\x7e]*$/.test(body)) return null;
  const f = body.split('|');
  if (m[1] === 'm') {
    if (f.length !== 6 || f[0] !== '1' || !/^[A-Za-z0-9]{8}$/.test(f[1]) || !['0', '1'].includes(f[2]) || !['w', 'b'].includes(f[3])) return null;
    const moves = f[4] ? f[4].split(',') : [];
    if (moves.length > NET_LIMITS.moves || !moves.every(netMoveCodeValid)) return null;
    const end = f[5] === '-' ? null : f[5] === 'd' ? { type: 'draw', n: moves.length } : /^r:[wb]$/.test(f[5]) ? { type: 'resign', winner: f[5][2], n: moves.length } : undefined;
    if (end === undefined) return null;
    return { kind: 'm', gid: f[1], small: f[2] === '1', toColor: f[3], moves, end };
  }
  if (f.length !== 11 || f[0] !== '1' || f[1] !== m[1] || !/^[A-Za-z0-9]{6}$/.test(f[2]) || !/^[A-Za-z0-9]{8}$/.test(f[3])) return null;
  const s = { ufrag: f[5], pwd: f[6], fp: f[7], setup: f[8], mid: f[9], cands: f[10] ? f[10].split(';') : [] };
  if (!netSummaryValid(s) || !s.cands.length) return null;
  const info = m[1] === 'o' ? netParseInfo(f[4]) : f[4] === '-' ? {} : null;
  if (!info || (m[1] === 'o') !== (s.setup === 'actpass')) return null;
  return { kind: m[1], nonce: f[2], gid: f[3], info, ...s };
}
function netMoveCodeValid(m) { return typeof m === 'string' && /^[0-7]{4}[QRBN]?$/.test(m); }
function netShareURL(code) {
  const loc = window.location, base = /^https?:$/.test(loc?.protocol || '') ? loc.origin + loc.pathname : NET_PUBLIC_URL;
  return base + '#net=' + code;
}

// ICE 후보를 모은다. 같은 방은 집 안 주소만 있어도 되니 짧게, 멀리서는 공인 주소(srflx)를 조금 더 기다린다.
function netGather(pc, method) {
  return new Promise(resolve => {
    if (pc.iceGatheringState === 'complete') return resolve();
    let early = null;
    const done = () => { clearTimeout(timer); clearTimeout(early); pc.removeEventListener('icegatheringstatechange', onState); pc.removeEventListener('icecandidate', onCand); resolve(); };
    const onState = () => { if (pc.iceGatheringState === 'complete') done(); };
    const onCand = e => { if (!e.candidate) return done(); if (/ typ srflx /.test(e.candidate.candidate) && !early) early = setTimeout(done, 500); };
    const timer = setTimeout(done, method === 'remote' ? 6000 : 2500);
    pc.addEventListener('icegatheringstatechange', onState); pc.addEventListener('icecandidate', onCand);
  });
}

// --- 연결 하나 ---
// state: new → connecting → open ⇄ weak → lost (→ open으로 스스로 돌아올 수 있음) · closed(직접 닫음)
// 데이터 채널이 살아 있으면 SCTP가 메시지를 다시 보내 준다. 끊긴 동안 잃은 수는 앱이 다시 연결할 때 수 목록으로 맞춘다.
class NetLink {
  constructor(handlers = {}) {
    Object.assign(this, { h: handlers, state: 'new', pc: null, dc: null, nonce: null, kind: null, code: '', lastHeard: 0, lastPing: 0, weakSince: 0, timer: null, connectAt: 0, stalled: false, peerAway: false, muteUntil: 0, reason: '' });
  }
  _setup() {
    const pc = this.pc = new RTCPeerConnection({ iceServers: netIceServers() });
    const dc = this.dc = pc.createDataChannel('chess', { negotiated: true, id: 0, ordered: true });
    dc.onopen = () => this._open();
    dc.onclose = () => this._lost('closed');
    dc.onmessage = e => this._receive(e.data);
    pc.onconnectionstatechange = () => { const s = pc.connectionState; if (s === 'failed' || s === 'closed') this._broken(s); else if (s === 'disconnected') this._weak(); };
    pc.oniceconnectionstatechange = () => { const s = pc.iceConnectionState; if (s === 'failed') this._broken('failed'); else if (s === 'disconnected') this._weak(); };
    this.timer = setInterval(() => this._tick(), 1000);
  }
  async createOffer(gid, info, method) {
    this.kind = 'o'; this.nonce = netRandom(6); this.method = method; this._setup();
    await this.pc.setLocalDescription(await this.pc.createOffer());
    await netGather(this.pc, method);
    return this.code = netMakeCode('o', this.nonce, gid, info, this.pc.localDescription.sdp);
  }
  async acceptOffer(parsed, method) {
    this.kind = 'a'; this.nonce = parsed.nonce; this.method = method; this._setup();
    await this.pc.setRemoteDescription({ type: 'offer', sdp: netBuildSdp(parsed) });
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    await netGather(this.pc, method);
    this._connecting();
    return this.code = netMakeCode('a', this.nonce, parsed.gid, '-', this.pc.localDescription.sdp);
  }
  async acceptAnswer(parsed) {
    if (this.kind !== 'o' || parsed.kind !== 'a' || parsed.nonce !== this.nonce || this.pc?.signalingState !== 'have-local-offer') throw Error('nonce');
    await this.pc.setRemoteDescription({ type: 'answer', sdp: netBuildSdp(parsed) });
    this._connecting();
  }
  _connecting() { if (this.state === 'new') { this.state = 'connecting'; this.connectAt = Date.now(); this._emit(); } }
  _emit() { this.h.onState?.(this); }
  _open() {
    if (this.state === 'closed') return;
    this.state = 'open'; this.lastHeard = Date.now(); this.stalled = false;
    this.h.onOpen?.(this); this._emit();
  }
  _touch() {
    this.lastHeard = Date.now();
    if ((this.state === 'weak' || this.state === 'lost') && this.dc?.readyState === 'open') { this.state = 'open'; this.weakSince = 0; this.h.onRecover?.(this); this._emit(); }
  }
  _weak() { if (this.state === 'open') { this.state = 'weak'; this.weakSince = Date.now(); this._emit(); } }
  // 데이터 채널이나 연결 자체가 죽으면 더 기다려도 소용없다. 연결 중(답장을 기다리는 동안)에는 상대가 늦게 넣을 수 있어 기다린다.
  _broken(reason) { if (this.state === 'connecting' || this.state === 'new') return; this._lost(reason); }
  _lost(reason) {
    if (this.state === 'lost' || this.state === 'closed' || this.state === 'new' || this.state === 'connecting') return;
    this.state = 'lost'; this.reason = reason; this._emit();
  }
  _tick() {
    const now = Date.now();
    this.h.onTick?.(this);
    // 연결 중 안내: 답장을 넣은 쪽은 20초, 답장을 보낸 쪽은 상대가 넣을 시간을 더해 90초 뒤에 보인다.
    if (this.state === 'connecting' && !this.stalled && now - this.connectAt > NET_TIMING.stall * (this.kind === 'o' ? 1 : 4.5)) { this.stalled = true; this._emit(); }
    // 오래 조용해서 '끊김'이 됐어도 통로가 살아 있으면 계속 신호를 보낸다(양쪽이 모두 끊김이 되어도 인터넷이 돌아오면 되살아나게).
    const lingering = this.state === 'lost' && this.dc?.readyState === 'open' && this.pc?.connectionState !== 'closed';
    if (this.state !== 'open' && this.state !== 'weak' && !lingering) return;
    // 이 기기에서 연결 객체가 닫히면 닫힘 알림이 오지 않을 수 있다(브라우저 규칙). 직접 확인한다.
    if (this.dc?.readyState === 'closed' || this.pc?.connectionState === 'closed') return this._lost('closed');
    if (now - this.lastPing >= NET_TIMING.ping) { this.lastPing = now; this.send({ t: 'ping' }); }
    if (lingering) return;
    const quiet = now - this.lastHeard, limit = this.peerAway ? NET_TIMING.away : NET_TIMING.weak;
    if (this.state === 'open' && quiet > limit) this._weak();
    else if (this.state === 'weak' && quiet > limit + NET_TIMING.lost) this._lost('timeout');
    else if (this.state === 'weak') this._emit();
  }
  _receive(data) {
    if (Date.now() < this.muteUntil || typeof data !== 'string' || data.length > NET_LIMITS.message) return;
    let msg; try { msg = JSON.parse(data); } catch { return; }
    if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') return;
    this._touch();
    if (msg.t === 'ping') return void this.send({ t: 'pong' });
    if (msg.t === 'pong') return;
    if (msg.t === 'away' || msg.t === 'back') { this.peerAway = msg.t === 'away'; this._emit(); return; }
    this.h.onMessage?.(msg, this);
  }
  send(obj) {
    if (this.dc?.readyState !== 'open' || Date.now() < this.muteUntil) return false;
    try { this.dc.send(JSON.stringify(obj)); return true; } catch { return false; }
  }
  // 앱이 다시 보일 때: 멈춰 있던 동안의 조용함을 끊김으로 세지 않는다.
  wake() { if (this.state === 'open' || this.state === 'weak') this.lastHeard = Date.now(); }
  close() {
    if (this.state === 'closed') return;
    this.state = 'closed'; clearInterval(this.timer);
    try { this.dc?.close(); } catch {} try { this.pc?.close(); } catch {}
  }
  // 검사용: ms 동안 이 기기에서 오가는 메시지를 모두 버린다(잠깐 인터넷이 끊긴 것과 같다).
  debugMute(ms) { this.muteUntil = Date.now() + ms; }
}

// --- QR 그림 ---
function netQrSvg(text) {
  if (typeof qrcode !== 'function') return '';
  const qr = qrcode(0, 'M'); qr.addData(text, 'Byte'); qr.make();
  const n = qr.getModuleCount(), q = 4; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
  return `<svg class="net-qr-svg" viewBox="0 0 ${n + q * 2} ${n + q * 2}" role="img" aria-label="연결 QR 코드" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

// --- QR 찍기 ---
// 휴대폰 브라우저의 QR 인식(BarcodeDetector)이 있으면 쓰고, 없으면(아이폰 사파리 등) jsQR로 읽는다.
const netScan = { stream: null, timer: null, token: 0 };
function netLoadJsQR() {
  if (window.jsQR) return Promise.resolve(true);
  return new Promise(resolve => { const s = document.createElement('script'); s.src = 'js/vendor/jsQR.js'; s.onload = () => resolve(!!window.jsQR); s.onerror = () => resolve(false); document.head.appendChild(s); });
}
async function netScanStart(video, onText, onError) {
  netScanStop(); const token = ++netScan.token;
  if (!navigator.mediaDevices?.getUserMedia) return onError('nocamera');
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
  catch (e) { if (token === netScan.token) onError(e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'denied' : 'nocamera'); return; }
  if (token !== netScan.token || !video.isConnected) { stream.getTracks().forEach(t => t.stop()); return; }
  netScan.stream = stream; video.setAttribute('playsinline', ''); video.muted = true; video.srcObject = stream;
  try { await video.play(); } catch {}
  let detector = null;
  try { if ('BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats()).includes('qr_code')) detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch {}
  if (!detector && !(await netLoadJsQR())) { netScanStop(); return onError('nodecoder'); }
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
  const loop = async () => {
    if (token !== netScan.token) return;
    let text = null;
    try {
      if (video.readyState >= 2 && video.videoWidth) {
        if (detector) text = (await detector.detect(video))[0]?.rawValue || null;
        if (!text && window.jsQR) {
          const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
          canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          text = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })?.data || null;
        }
      }
    } catch {}
    if (token !== netScan.token) return;
    if (text && NET_CODE_RE.test(text)) { netScanStop(); onText(text); return; }
    netScan.timer = setTimeout(loop, 160);
  };
  loop();
}
function netScanStop() {
  netScan.token++; clearTimeout(netScan.timer); netScan.timer = null;
  netScan.stream?.getTracks().forEach(t => t.stop()); netScan.stream = null;
}

