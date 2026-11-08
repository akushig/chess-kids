// 두 기기 대전 (docs/TWO_DEVICE_PLAY.md): 연결 코드 · 수 목록 맞추기 · 메시지 처리 · 편지 · QR · 저장 범위
const test = require('node:test'), assert = require('node:assert/strict'), harness = require('./harness.cjs');
const { webcrypto } = require('node:crypto'), jsQR = require('../js/vendor/jsQR.js');
const J = (run, expr) => JSON.parse(run(`JSON.stringify(${expr})`));
const flush = timers => { for (let n = 0; timers.length && n < 2000; n++) timers.splice(0).forEach(cb => cb()); };
function load(initial) {
  const h = harness(initial);
  Object.assign(h.context, { btoa, atob }); h.context.window.crypto = webcrypto;
  return h;
}
const CHROME_OFFER = ['v=0', 'o=- 4215775240449105457 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0', 'a=extmap-allow-mixed', 'a=msid-semantic: WMS',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0',
  'a=candidate:3442447574 1 udp 2122260223 1f8a7c2e-5b3d-4e6f-9a01-23456789abcd.local 54400 typ host generation 0 network-id 1',
  'a=candidate:2101183354 1 tcp 1518280447 1f8a7c2e-5b3d-4e6f-9a01-23456789abcd.local 9 typ host tcptype active generation 0 network-id 1',
  'a=candidate:842163049 1 udp 1686052607 211.234.10.20 61234 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-id 1',
  'a=candidate:1 1 udp 2122194687 2001:db8::1234 50000 typ host generation 0', 'a=candidate:2 1 udp 2122194687 fe80::1 50001 typ host generation 0',
  'a=candidate:3 2 udp 2122194686 192.168.0.9 50002 typ host generation 0',
  'a=ice-ufrag:Ab3/', 'a=ice-pwd:Zx9+longpasswordvalue123456', 'a=ice-options:trickle',
  'a=fingerprint:sha-256 75:32:A1:FC:20:40:6C:CE:D4:34:B1:9B:38:F0:50:34:AC:45:0A:5F:B8:82:68:AE:A2:3B:0E:3D:92:EB:A3:54',
  'a=setup:actpass', 'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144', ''].join('\r\n');
// Firefox 모양: 지문이 세션 줄에 있고 집 안 IPv4 주소를 그대로 쓴다.
const FIREFOX_ANSWER = ['v=0', 'o=mozilla...THIS_IS_SDPARTA-99.0 1 0 IN IP4 0.0.0.0', 's=-', 't=0 0',
  'a=fingerprint:sha-256 0A:1B:2C:3D:4E:5F:60:71:82:93:A4:B5:C6:D7:E8:F9:0A:1B:2C:3D:4E:5F:60:71:82:93:A4:B5:C6:D7:E8:F9',
  'a=group:BUNDLE 0', 'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0',
  'a=candidate:0 1 UDP 2122252543 192.168.0.5 51001 typ host', 'a=ice-pwd:0123456789abcdef0123456789abcdef', 'a=ice-ufrag:89abcdef',
  'a=mid:0', 'a=setup:active', 'a=sctp-port:5000', ''].join('\r\n');

test('연결 코드: SDP의 필요한 값만 담고(TCP·링크 로컬·2번 구성요소 제외), 다시 만든 SDP가 같은 자격·지문·후보를 가진다', () => {
  const { run } = load();
  const s = J(run, `netSdpSummary(${JSON.stringify(CHROME_OFFER)})`);
  assert.deepEqual(s.cands, ['m1f8a7c2e5b3d4e6f9a0123456789abcd,54400', 's211.234.10.20,61234', 'h2001:db8::1234,50000']);
  assert.equal(s.ufrag, 'Ab3/'); assert.equal(s.setup, 'actpass'); assert.equal(s.mid, '0');
  const code = run(`netMakeCode('o','Ab12Cd','Game1234',netInfoText('remote','b',true,'new'),${JSON.stringify(CHROME_OFFER)})`);
  assert.match(code, /^CK1o\.[A-Za-z0-9_-]+$/); assert.ok(code.length < 320, '짧은 코드 ' + code.length);
  const p = J(run, `netParseCode(${JSON.stringify('친구가 보낸 메시지 https://x/#net=' + code + ' 끝')})`);
  assert.equal(p.kind, 'o'); assert.equal(p.gid, 'Game1234'); assert.deepEqual(p.info, { method: 'remote', hostColor: 'b', small: true, purpose: 'new' });
  const sdp = run(`netBuildSdp(netParseCode(${JSON.stringify(code)}))`);
  for (const line of ['a=ice-ufrag:Ab3/', 'a=ice-pwd:Zx9+longpasswordvalue123456', 'a=fingerprint:sha-256 75:32:A1:FC:20:40:6C:CE:D4:34:B1:9B:38:F0:50:34:AC:45:0A:5F:B8:82:68:AE:A2:3B:0E:3D:92:EB:A3:54', 'a=setup:actpass', 'a=mid:0', 'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'a=sctp-port:5000'])
    assert.ok(sdp.includes(line), line);
  assert.match(sdp, /a=candidate:1 1 udp \d+ 1f8a7c2e-5b3d-4e6f-9a01-23456789abcd\.local 54400 typ host\r\n/);
  assert.match(sdp, /211\.234\.10\.20 61234 typ srflx raddr 0\.0\.0\.0 rport 0/);
  assert.deepEqual(J(run, `netSdpSummary(${JSON.stringify(sdp)})`), s, '다시 만든 SDP를 줄여도 같은 값');
  const answer = J(run, `netParseCode(netMakeCode('a','Ab12Cd','Game1234','-',${JSON.stringify(FIREFOX_ANSWER)}))`);
  assert.equal(answer.setup, 'active'); assert.deepEqual(answer.cands, ['h192.168.0.5,51001']); assert.equal(answer.ufrag, '89abcdef');
});

test('연결 코드: 고치거나 잘린 코드는 거절한다', () => {
  const { run } = load();
  const code = run(`netMakeCode('o','Ab12Cd','Game1234',netInfoText('room','w',false,'new'),${JSON.stringify(CHROME_OFFER)})`);
  const body = run(`netDecodeText(${JSON.stringify(code.slice(5))})`), f = body.split('|');
  const remake = fields => 'CK1o.' + run(`netEncodeText(${JSON.stringify(fields.join('|'))})`);
  assert.equal(run(`netParseCode(${JSON.stringify(code.slice(0, 60))})`), null, '잘린 코드');
  assert.equal(run(`netParseCode('CK1o.!!!!!!!!!!!!')`), null, 'base64url이 아님');
  assert.equal(run(`netParseCode(${JSON.stringify(remake(f.map((x, i) => i === 1 ? 'a' : x)))})`), null, '머리와 본문 종류가 다름');
  assert.equal(run(`netParseCode(${JSON.stringify(remake(f.map((x, i) => i === 8 ? 'active' : x)))})`), null, '초대인데 역할이 active');
  assert.equal(run(`netParseCode(${JSON.stringify(remake(f.map((x, i) => i === 7 ? 'short' : x)))})`), null, '지문 길이');
  assert.equal(run(`netParseCode(${JSON.stringify(remake(f.map((x, i) => i === 10 ? 'h<script>,1' : x)))})`), null, '후보 주소');
  assert.equal(run(`netParseCode(${JSON.stringify(remake(f.map((x, i) => i === 10 ? '' : x)))})`), null, '후보 없음');
  assert.equal(run(`netParseCode(${JSON.stringify(remake(f.map((x, i) => i === 4 ? 'zw0n' : x)))})`), null, '정보 칸');
  assert.throws(() => run(`netSdpSummary(${JSON.stringify(CHROME_OFFER.replace('sha-256', 'sha-1'))})`));
});

test('편지: 수 목록·판·받는 색·끝을 담고 되읽는다. 규칙에 맞지 않는 수 목록은 다시 둬 보면 걸러진다', () => {
  const { run } = load();
  const code = run(`netMakeLetter('Game1234',false,'b',['6444','1434','7655'],null)`);
  assert.deepEqual(J(run, `netParseCode(${JSON.stringify(code)})`), { kind: 'm', gid: 'Game1234', small: false, toColor: 'b', moves: ['6444', '1434', '7655'], end: null });
  const resign = J(run, `netParseCode(netMakeLetter('Game1234',true,'w',['6343'],{type:'resign',winner:'w',n:1}))`);
  assert.deepEqual(resign.end, { type: 'resign', winner: 'w', n: 1 }); assert.equal(resign.small, true);
  assert.equal(run(`netParseCode('CK1m.'+netEncodeText('1|Game1234|0|b|6444,9999|-'))`), null, '칸 번호 밖');
  assert.ok(run(`!!netReplay(false,['6444','1434','7655'])`));
  assert.equal(run(`netReplay(false,['6444','6343'])`), null, '흰색이 두 번');
  assert.equal(run(`netReplay(false,['6444','1434','7746'])`), null, '비숍이 막힌 길');
  // 승격 수에는 말 글자가 꼭 있어야 하고, 아니면 없어야 한다.
  const promo = "ChessGame.fromFEN('8/4P3/8/8/8/8/k7/4K3 w - - 0 1')";
  assert.equal(run(`(()=>{const g=${promo};return g.move(1,4,0,4,'N')})()`), 'moved');
  assert.equal(run(`netReplay(false,['6444','14'])`), null);
});

test('수 목록 맞추기: 앞부분이면 긴 쪽, 서로 다르면 처음 초대한 쪽', () => {
  const { run } = load();
  const m = (a, b, mi, ti) => J(run, `netMergeMoves(${JSON.stringify(a)},${JSON.stringify(b)},${mi},${ti})`);
  assert.deepEqual(m(['6444'], ['6444', '1434'], true, false), { moves: ['6444', '1434'], changed: true, conflict: false });
  assert.deepEqual(m(['6444', '1434'], ['6444'], false, true), { moves: ['6444', '1434'], changed: false, conflict: false });
  assert.deepEqual(m(['6444', '1434'], ['6444', '1333'], false, true), { moves: ['6444', '1333'], changed: true, conflict: true });
  assert.deepEqual(m(['6444', '1434'], ['6444', '1333'], true, false), { moves: ['6444', '1434'], changed: false, conflict: true });
});

function connected(h, record) {
  h.run(`net.link={profile:activeProfile,state:'open',peerAway:false,weakSince:0,sent:[],send(m){this.sent.push(JSON.parse(JSON.stringify(m)));return true;},close(){this.state='closed';},wake(){}}`);
  h.run(`netSave(${JSON.stringify({ v: 1, gid: 'Game1234', method: 'room', inviter: true, color: 'w', small: false, moves: [], end: null, acked: 0, peer: { name: '친구', icon: '🙂' }, startedAt: 1, ...record })});netOpenGame()`);
  // 대국 화면을 열면 '돌아왔어요'와 맞추기 인사를 보낸다.
  assert.deepEqual(J(h.run, 'net.link.sent.splice(0).map(m=>m.t)'), ['back', 'hello']);
}
const sent = h => J(h.run, 'net.link.sent.splice(0)');

test('메시지: 내 수는 보내고, 친구 수는 규칙을 확인해 두고 받았다고 알린다. 겹친 수·빠진 수·차례가 아닌 수를 처리한다', () => {
  const h = load(); connected(h, {});
  assert.equal(h.run('state.play.mode'), 'net');
  h.run('playCommitMove([6,4,4,4])'); flush(h.timers);
  assert.deepEqual(sent(h), [{ t: 'move', n: 0, m: '6444' }]);
  assert.equal(h.run('net.record.acked'), 0);
  h.run(`netOnMessage({t:'ack',n:1})`); assert.equal(h.run('net.record.acked'), 1);
  h.run(`netOnMessage({t:'move',n:1,m:'1434'})`); flush(h.timers);
  assert.deepEqual(J(h.run, 'net.record.moves'), ['6444', '1434']); assert.equal(h.run('state.game.board[3][4]'), 'bP');
  assert.deepEqual(sent(h), [{ t: 'ack', n: 2 }]);
  h.run(`netOnMessage({t:'move',n:1,m:'1434'})`); assert.deepEqual(sent(h), [{ t: 'ack', n: 2 }], '겹친 수는 다시 받았다고만');
  h.run(`netOnMessage({t:'move',n:2,m:'0122'})`); assert.equal(sent(h)[0].reply, true, '내 차례에 온 친구 수는 거절하고 맞추기를 부탁');
  h.run(`netOnMessage({t:'move',n:7,m:'0122'})`); assert.equal(sent(h)[0].t, 'hello', '빠진 수가 있으면 맞추기');
  h.run(`netOnMessage({t:'move',n:1,m:'1333'})`); assert.equal(sent(h)[0].t, 'hello', '같은 번호에 다른 수면 맞추기');
  assert.deepEqual(J(h.run, 'net.record.moves'), ['6444', '1434']);
  // 친구 차례가 아닐 때 판을 클릭하면 안내만
  h.run('playCommitMove([7,6,5,5])'); flush(h.timers); sent(h);
  h.run('playClick(6,0)'); assert.match(h.run('state.play.notice'), /친구 차례/);
  assert.equal(h.run('state.game.selected'), null);
});

test('다시 연결: 인사(hello)로 수 목록을 맞추고, 다른 대국·다른 색이면 연결을 끊는다', () => {
  const h = load(); connected(h, { moves: ['6444'], inviter: false, color: 'b' });
  const hello = (extra = {}) => `netOnMessage(${JSON.stringify({ t: 'hello', v: 1, reply: true, gid: 'Game1234', color: 'w', small: false, inviter: true, moves: ['6444'], end: null, name: '민수', icon: '🐻', ...extra })})`;
  h.run(hello({ moves: ['6444', '1434', '7655'] }));
  assert.deepEqual(J(h.run, 'net.record.moves'), ['6444', '1434', '7655'], '끊긴 동안 친구가 둔 수까지');
  assert.deepEqual(J(h.run, 'net.record.peer'), { name: '민수', icon: '🐻' });
  const out = sent(h); assert.deepEqual(out[0], { t: 'ack', n: 3 }); assert.equal(out[1].t, 'hello'); assert.equal(out[1].reply, false);
  // 내가 끊긴 동안 둔 수: 친구 목록이 내 목록의 앞부분이면 내 목록을 그대로 두고 친구가 내 인사로 맞춘다.
  h.run(`net.record.moves.push('0122');netSave()`);
  h.run(hello({ moves: ['6444', '1434', '7655'], reply: false })); assert.deepEqual(J(h.run, 'net.record.moves'), ['6444', '1434', '7655', '0122']);
  assert.equal(h.run('net.record.acked'), 3);
  // 서로 다르면 처음 초대한 쪽(친구) 목록
  h.run(hello({ moves: ['6444', '1434', '7655', '0625'] })); assert.deepEqual(J(h.run, 'net.record.moves'), ['6444', '1434', '7655', '0625']);
  assert.match(h.run('state.play.notice'), /처음 초대한 쪽/);
  // 규칙에 맞지 않는 목록은 받지 않는다
  h.run(hello({ moves: ['6444', '1434', '7655', '0625', '0000'] })); assert.equal(h.run('net.record.moves.length'), 4);
  // 이름은 짧게, 아이콘은 정해진 것만, HTML은 화면에 그대로 넣지 않는다
  h.run(hello({ moves: ['6444', '1434', '7655', '0625'], name: '<img src=x onerror=alert(1)>길고긴이름입니다', icon: '<b>' }));
  assert.equal(h.run('net.record.peer.icon'), '🙂'); assert.equal(h.run('net.record.peer.name.length'), 12);
  assert.ok(!h.run('netPeerName()').includes('<'));
  h.run(hello({ gid: 'Other123' })); assert.equal(h.run('net.link'), null, '다른 대국');
});

test('기권·비기기·한 판 더: 친구의 기권은 내 승리, 비기기는 둘 다 동의해야, 한 판 더는 색을 바꿔 새 기록', () => {
  const h = load(); connected(h, { moves: ['6444', '1434'] });
  h.run(`netOnMessage({t:'resign',n:2})`);
  assert.deepEqual(J(h.run, 'net.record.end'), { type: 'resign', winner: 'w', n: 2 }); assert.equal(h.run('playIsOver()'), true);
  assert.match(h.run('netStatusCopy().title'), /내가 이겼어요/);
  h.run(`netOnMessage({t:'draw!'})`); assert.equal(h.run('net.record.end.type'), 'resign', '제안하지 않은 비기기 수락은 무시');
  // 한 판 더 제안은 확인 창으로 묻는다(검사 틀에는 창이 없어 수락을 직접 부른다). 끝나지 않은 판에서는 거절한다.
  h.run(`netOnMessage({t:'rematch?',gid:'Next5678',color:'w'})`); assert.deepEqual(sent(h), []);
  h.run(`netSend({t:'rematch!',gid:'Next5678'});netStartRematch('Next5678','b',false)`);
  assert.equal(h.run('net.record.gid'), 'Next5678'); assert.equal(h.run('net.record.color'), 'b'); assert.equal(h.run('net.record.moves.length'), 0);
  assert.equal(h.run('state.play.net.color'), 'b'); assert.equal(h.run('playIsOver()'), false);
  // 둘이 동시에 한 판 더: 대국 번호가 작은 제안으로 정한다
  h.run(`net.record.end={type:'resign',winner:'w',n:0};netSave();net.rematchOffer={gid:'Zzzz9999',color:'w'}`);
  h.run(`netOnMessage({t:'rematch?',gid:'Aaaa1111',color:'w'})`);
  assert.equal(h.run('net.record.gid'), 'Aaaa1111'); assert.equal(h.run('net.record.color'), 'b'); assert.ok(sent(h).some(m => m.t === 'rematch!' && m.gid === 'Aaaa1111'));
  h.run(`net.record.end={type:'resign',winner:'w',n:0};netSave();net.rematchOffer={gid:'Bbbb2222',color:'w'}`);
  h.run(`netOnMessage({t:'rematch?',gid:'Yyyy8888',color:'b'})`);
  assert.equal(h.run('net.record.gid'), 'Aaaa1111', '내 제안이 더 작으면 친구 제안은 무시'); assert.deepEqual(sent(h), []);
  h.run(`netOnMessage({t:'rematch!',gid:'Bbbb2222'})`); assert.equal(h.run('net.record.gid'), 'Bbbb2222'); assert.equal(h.run('net.record.color'), 'w');
  // 비기기: 내가 제안 → 친구 수락
  h.run('netDrawOffer()'); assert.equal(sent(h).some(m => m.t === 'draw?'), true);
  h.run(`netOnMessage({t:'draw!'})`); assert.equal(h.run('net.record.end.type'), 'draw');
});

test('편지: 같은 대국이면 새 수만 더하고, 내가 보낸 편지·다른 판은 거절한다. 모르는 대국은 확인 뒤 연다', () => {
  const h = load(); connected(h, { moves: ['6444'], method: 'remote' });
  h.run('net.link=null');
  h.run(`netApplyLetter(netParseCode(netMakeLetter('Game1234',false,'w',['6444','1434'],null)))`);
  assert.deepEqual(J(h.run, 'net.record.moves'), ['6444', '1434']);
  h.run(`netApplyLetter(netParseCode(netMakeLetter('Game1234',false,'b',['6444','1434'],null)))`);
  assert.deepEqual(J(h.run, 'net.record.moves'), ['6444', '1434'], '내가 보낸 편지(받는 색이 친구)는 무시');
  h.run(`netSendLetter()`); assert.deepEqual(J(h.run, 'netParseCode(net.letter)').toColor, 'b');
  // 모르는 대국: 확인 창의 '편지 대국 열기'를 누르면 받는 색으로 연다
  h.run(`net.record=null;writeData('${'net_game_v1'}',null);net.recordProfile=null`);
  h.run(`netApplyLetter(netParseCode(netMakeLetter('Fresh123',true,'b',['6353'],null)))`);
  assert.equal(h.run('net.record'), null, '확인 전에는 열지 않음');
});

test('저장 범위: 두 기기 대국은 놀이 저장에 섞이지 않고, 프로필 파일 검사를 통과하며, 고친 기록은 거절한다', () => {
  const h = load(); connected(h, { moves: ['6444', '1434'] });
  h.run('saveActiveSession()');
  assert.equal(J(h.run, "readData('sessions',{})").play, undefined); assert.equal(J(h.run, "readData('last_session',null)"), null);
  h.run("savePlaySettings({...getPlaySettings(),view:'net',netMethod:'remote',netColor:'random'})");
  const backup = J(h.run, 'createProfileBackup()');
  assert.ok(backup.data.net_game_v1);
  assert.doesNotThrow(() => h.run(`parseProfileBackup(${JSON.stringify(JSON.stringify(backup))})`));
  const bad = JSON.parse(JSON.stringify(backup)); const rec = JSON.parse(bad.data.net_game_v1); rec.moves = ['6444', '6343']; bad.data.net_game_v1 = JSON.stringify(rec);
  assert.throws(() => h.run(`parseProfileBackup(${JSON.stringify(JSON.stringify(bad))})`), /두 기기 대국/);
  const bad2 = JSON.parse(JSON.stringify(backup)); const st = JSON.parse(bad2.data.play_settings); st.view = 'online'; bad2.data.play_settings = JSON.stringify(st);
  assert.throws(() => h.run(`parseProfileBackup(${JSON.stringify(JSON.stringify(bad2))})`), /대전 설정/);
  // 설정의 상대 모드는 그대로(컴퓨터·함께 두기만) 둔다
  assert.ok(['ai', 'friend'].includes(h.run('getPlaySettings().mode')));
});

test('QR: 만든 QR 그림을 그대로 읽으면 같은 연결 코드가 나온다', () => {
  const { run } = load();
  const code = run(`netMakeCode('o','Ab12Cd','Game1234',netInfoText('room','w',false,'new'),${JSON.stringify(CHROME_OFFER)})`);
  const svg = run(`netQrSvg(${JSON.stringify(code)})`), size = Number(/viewBox="0 0 (\d+) /.exec(svg)[1]), scale = 6, W = size * scale;
  const px = new Uint8ClampedArray(W * W * 4).fill(255);
  for (const [, x, y] of svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g))
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) { const i = ((Number(y) * scale + dy) * W + Number(x) * scale + dx) * 4; px[i] = px[i + 1] = px[i + 2] = 0; }
  assert.equal(jsQR(px, W, W)?.data, code);
});
