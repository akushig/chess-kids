// 두 기기 대전 (docs/TWO_DEVICE_PLAY.md): 브라우저 두 개를 두 기기로 쓴다.
// 같은 방: 가짜 카메라 영상(y4m)에 상대 화면의 QR을 비춰 실제로 찍는다. 한쪽은 브라우저 QR 인식, 한쪽은 jsQR(아이폰 사파리와 같은 경로).
// 수는 판을 탭해서 둔다. 잠깐 끊김(메시지 버림) → 저절로 복구, 연결 객체 닫힘 → 끊긴 동안 둔 수 → QR로 다시 연결,
// 새로고침 → 코드로 다시 연결, 비기기·한 판 더·기권, 멀리서(보호자 확인) → 연결 없이 편지로 이어 두기 · 링크로 연 새 탭의 코드 넘기기.
// 360×640(A)·1280×900(B): 가로 넘침 없음, 연결 상태가 바뀌어도 판 위치 그대로, 주요 버튼 44px 이상.
const { chromium } = require(process.env.CHESS_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), qrcode = require('../js/vendor/qrcode.js');
const output = process.env.CHESS_NET_QA_OUTPUT || '/tmp/chess-net-qa'; fs.mkdirSync(output, { recursive: true });
const URL = process.env.CHESS_TEST_URL || 'http://127.0.0.1:8765/';

function writeQR(file, text) {
  const qr = qrcode(0, 'M'); qr.addData(text, 'Byte'); qr.make();
  const n = qr.getModuleCount(), W = 640, H = 480, scale = Math.floor(Math.min(W, H) / (n + 8)), size = scale * (n + 8), ox = (W - size) >> 1, oy = (H - size) >> 1;
  const Y = Buffer.alloc(W * H, 235);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) for (let y = 0; y < scale; y++) { const row = (oy + (r + 4) * scale + y) * W + ox; Y.fill(16, row + (c + 4) * scale, row + (c + 5) * scale); }
  const UV = Buffer.alloc(W * H / 4, 128), frame = Buffer.concat([Buffer.from('FRAME\n'), Y, UV, UV]);
  fs.writeFileSync(file, Buffer.concat([Buffer.from(`YUV4MPEG2 W${W} H${H} F10:1 Ip A1:1 C420jpeg\n`), frame, frame]));
}

(async () => {
  const errors = [], browsers = [];
  const device = async (tag, viewport, { detector, name, icon }) => {
    const cam = path.join(output, `cam-${tag}.y4m`); writeQR(cam, 'CK1o.waiting-for-a-real-code');
    const browser = await chromium.launch({ headless: true, ...(process.env.CHESS_BROWSER_EXECUTABLE ? { executablePath: process.env.CHESS_BROWSER_EXECUTABLE } : {}), args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=' + cam] });
    browsers.push(browser);
    const context = await browser.newContext({ viewport, serviceWorkers: 'block', permissions: ['camera', 'clipboard-read', 'clipboard-write'] });
    // 검사는 한 컴퓨터 안이라 공개 STUN이 필요 없다. 아이폰처럼 브라우저 QR 인식이 없는 경우도 흉내 낸다.
    await context.addInitScript(d => { window.NET_ICE_SERVERS = []; if (!d) delete window.BarcodeDetector; }, detector);
    const open = async () => {
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(`${tag}: ${e.message}`)); await page.route('https://fonts.googleapis.com/**', r => r.abort());
      await page.goto(URL, { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ name, icon }) => { writeData('preferences', { motion: false, voice: false }); applyPreferences(); updateProfile(activeProfile, name, icon); }, { name, icon });
      return page;
    };
    const page = await open();
    return { tag, viewport, cam, context, page, open };
  };
  try {
    const A = await device('A', { width: 360, height: 640 }, { detector: true, name: '민준', icon: '🐻' });
    const B = await device('B', { width: 1280, height: 900 }, { detector: false, name: '서연', icon: '🐰' });
    const ev = (d, fn, arg) => d.page.evaluate(fn, arg), shot = (d, name) => d.page.screenshot({ path: `${output}/${d.tag}-${name}.png` });
    const until = (d, fn, arg, timeout = 15000) => d.page.waitForFunction(fn, arg, { timeout });
    const tap = (d, r, c) => d.page.locator('#screen-play .board-cell').nth(r * 8 + c).click();
    const move = async (d, m, other) => { const before = await ev(other, () => net.record.moves.length); await tap(d, m[0], m[1]); await tap(d, m[2], m[3]); return before; };
    const noScroll = async (d, label) => assert.equal(await ev(d, () => document.documentElement.scrollWidth > innerWidth), false, `${d.tag} ${label}: 가로 넘침`);
    const base = {};
    const check = async (d, label) => {
      const info = await ev(d, () => {
        const box = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height, text: e.textContent.trim().slice(0, 24) }; };
        const status = document.querySelector('#screen-play .play-state');
        return { board: box(document.querySelector('#screen-play .chess-board')), vh: innerHeight, status: status.scrollHeight - status.clientHeight,
          buttons: [...document.querySelectorAll('#screen-play .back-btn,#screen-play .net-fix .action-btn,#screen-play .net-emoji-btn,#screen-play .mission-actions>.icon-btn,#screen-play .finish-actions .action-btn')].filter(b => b.offsetParent).map(box) };
      });
      const b = info.board; base[d.tag] ||= b;
      for (const k of ['x', 'y', 'w', 'h']) assert.ok(Math.abs(b[k] - base[d.tag][k]) < .6, `${d.tag} ${label}: 판 ${k} ${base[d.tag][k]} → ${b[k]}`);
      assert.ok(b.y >= 0 && b.y + b.h <= info.vh + .5, `${d.tag} ${label}: 판이 첫 화면 안에 있어야 해요 ${JSON.stringify(b)}`);
      for (const x of info.buttons) assert.ok(x.h >= 44, `${d.tag} ${label}: ${x.text} 높이 ${x.h}`);
      assert.ok(info.status <= 1, `${d.tag} ${label}: 상태 문구 넘침`);
      await noScroll(d, label);
    };
    const pill = d => ev(d, () => document.querySelector('#screen-play .net-pill')?.className.match(/net-pill--(\w+)/)?.[1]);
    const gate = async d => { await d.page.waitForSelector('#store-gate'); const q = await d.page.locator('#store-gate label').innerText(), [a, b] = q.match(/\d+/g).map(Number); await d.page.fill('#store-gate-input', String(a * b)); await d.page.locator('#store-gate button[type=submit]').click(); };
    const codeOf = async (d, selector) => { await d.page.waitForSelector(selector + '[data-code]', { state: 'attached', timeout: 15000 }); return d.page.locator(selector).first().getAttribute('data-code'); };
    const closeResult = async d => { if (await d.page.locator('#play-dialog .play-dialog-close').count()) await d.page.locator('#play-dialog .play-dialog-close').click(); };
    const same = async () => assert.deepEqual(await ev(A, () => net.record.moves), await ev(B, () => net.record.moves), '두 기기의 수 목록이 같아야 해요');

    // 1. 같은 방: A가 QR을 보여 주고 B가 카메라로 찍는다 → B의 답장 QR을 A가 찍는다.
    for (const d of [A, B]) { await ev(d, () => goPlay()); await d.page.locator('.play-mode-net').click(); await noScroll(d, '설정'); }
    await shot(A, 'setup');
    await A.page.locator('.play-start').click();
    const offer = await codeOf(A, '.net-qr'); assert.match(offer, /^CK1o\./); await noScroll(A, '내 QR'); await shot(A, 'room-offer');
    writeQR(B.cam, offer);
    await B.page.locator('.play-cta .action-btn.secondary', { hasText: '친구 QR 찍기' }).click();
    const answer = await codeOf(B, '.net-qr'); assert.match(answer, /^CK1a\./);
    assert.equal(await ev(B, () => !!window.jsQR), true, 'B는 jsQR로 읽었어요'); await shot(B, 'room-answer');
    writeQR(A.cam, answer);
    await A.page.locator('.net-big').click(); await shot(A, 'room-scan');
    for (const d of [A, B]) await until(d, () => state.screen === 'play' && state.play?.mode === 'net' && net.link?.state === 'open');
    assert.equal(await ev(A, () => state.play.net.color), 'w'); assert.equal(await ev(B, () => state.play.net.color), 'b');
    assert.equal(await ev(B, () => document.querySelector('#screen-play .chess-board').classList.contains('flipped')), true, '검은색은 판을 돌려 봐요');
    await until(A, () => /서연/.test(document.querySelector('#captured-top')?.textContent || '')); await until(B, () => /민준/.test(document.querySelector('#captured-top')?.textContent || ''));
    assert.equal(await pill(A), 'open'); await check(A, '연결됨'); await check(B, '연결됨');

    // 2. 탭으로 두기 · 받았다는 알림 · 표정
    await move(A, [6, 4, 4, 4], B); await until(B, () => net.record.moves.length === 1 && state.game.board[4][4] === 'wP'); await until(A, () => net.record.acked === 1);
    await move(B, [1, 4, 3, 4], A); await until(A, () => net.record.moves.length === 2 && state.game.board[3][4] === 'bP');
    await A.page.locator('.net-emoji-btn').first().click(); await B.page.waitForSelector('.net-emoji-bubble', { timeout: 5000 });
    await shot(A, 'play'); await shot(B, 'play'); await check(A, '두 수 뒤'); await check(B, '두 수 뒤');

    // 3. 잠깐 끊김: A가 9초 동안 메시지를 모두 잃는다. 그동안 A가 둔 수는 복구된 뒤 맞추기로 전해진다.
    await ev(A, () => net.link.debugMute(9000));
    await move(A, [7, 6, 5, 5], B);
    await until(B, () => net.link.state === 'weak', null, 12000); assert.equal(await pill(B), 'weak');
    await check(B, '약함'); await shot(B, 'weak');
    await until(B, () => net.link.state === 'open' && net.record.moves.length === 3, null, 20000);
    await until(A, () => net.record.acked === 3); await same(); await check(B, '복구'); assert.equal(await pill(B), 'open');
    // 오래 끊김(30초): 양쪽 모두 '끊김'이 된 뒤에도 인터넷이 돌아오면 다시 연결 없이 되살아난다.
    await ev(A, () => net.link.debugMute(30000));
    for (const d of [A, B]) await until(d, () => net.link.state === 'lost', null, 40000);
    await check(A, '오래 끊김'); assert.equal(await pill(A), 'lost');
    for (const d of [A, B]) await until(d, () => net.link.state === 'open', null, 20000);
    await same();

    // 4. 연결 객체가 닫힘(앱이 죽은 것과 같다) → 끊긴 동안 B가 둔 수 → QR로 다시 연결하면 A에게 전해진다.
    await ev(B, () => net.link.pc.close());
    for (const d of [A, B]) await until(d, () => ['lost', 'none'].includes(netConnState()), null, 15000);
    await check(A, '끊김'); await check(B, '끊김'); await shot(A, 'lost');
    await move(B, [0, 1, 2, 2], A); assert.equal(await ev(B, () => net.record.moves.length), 4); assert.equal(await ev(A, () => net.record.moves.length), 3);
    await A.page.locator('.net-fix .action-btn', { hasText: '다시 연결' }).click(); await A.page.locator('#net-reconnect-overlay .action-btn', { hasText: '새 QR' }).click();
    const again = await codeOf(A, '.net-qr'); writeQR(B.cam, again);
    await B.page.locator('.net-fix .action-btn', { hasText: '다시 연결' }).click(); await B.page.locator('#net-reconnect-overlay .action-btn', { hasText: '친구 QR 찍기' }).click();
    const againAnswer = await codeOf(B, '.net-qr'); writeQR(A.cam, againAnswer);
    await A.page.locator('.net-big').click();
    for (const d of [A, B]) await until(d, () => state.screen === 'play' && net.link?.state === 'open' && net.record.moves.length === 4);
    await same(); await check(A, '다시 연결'); await check(B, '다시 연결');

    // 5. B 새로고침 → 하던 대국 카드 → 코드로 다시 연결(멀리서 방식)
    await B.page.reload({ waitUntil: 'domcontentloaded' }); await until(A, () => ['lost', 'none'].includes(netConnState()), null, 15000);
    await ev(B, () => goPlay()); await B.page.locator('.net-saved-card').click(); await until(B, () => state.play?.mode === 'net');
    assert.equal(await pill(B), 'none'); await check(B, '새로고침 뒤');
    await A.page.locator('.net-fix .action-btn', { hasText: '다시 연결' }).click(); await A.page.locator('#net-reconnect-overlay .action-btn', { hasText: '멀리서 코드로' }).click();
    const remoteOffer = await codeOf(A, '.net-code-text'); await shot(A, 'remote-offer');
    await B.page.locator('.net-fix .action-btn', { hasText: '받은 코드 넣기' }).click();
    await B.page.fill('#net-paste-overlay textarea', '♟ 체스 대전 초대장이에요!\n' + 'https://example.invalid/#net=' + remoteOffer);
    await B.page.locator('#net-paste-overlay button[type=submit]').click();
    const remoteAnswer = await codeOf(B, '.net-code-text'); await shot(B, 'remote-answer');
    await A.page.fill('.net-paste textarea', remoteAnswer); await A.page.locator('.net-paste button[type=submit]').click();
    for (const d of [A, B]) await until(d, () => state.screen === 'play' && net.link?.state === 'open');
    await same(); assert.equal(await ev(A, () => net.record.method), 'remote');

    // 6. 비기기 → 한 판 더(색 바꿈) → 기권
    await move(A, [7, 5, 4, 2], B); await until(B, () => net.record.moves.length === 5);
    await B.page.locator('.mission-actions .icon-btn', { hasText: '비기기 제안' }).click();
    await A.page.waitForSelector('#choice-overlay'); await A.page.locator('#choice-overlay .action-btn', { hasText: '비기기 좋아요' }).click();
    for (const d of [A, B]) { await until(d, () => net.record.end?.type === 'draw'); await closeResult(d); }
    assert.match(await A.page.locator('#screen-play .play-state').innerText(), /비기기로 했어요/);
    await A.page.locator('.finish-actions .action-btn', { hasText: '한 판 더' }).click();
    await B.page.waitForSelector('#choice-overlay'); await B.page.locator('#choice-overlay .action-btn', { hasText: '좋아요' }).click();
    for (const d of [A, B]) await until(d, () => net.record.moves.length === 0 && !net.record.end && state.play.net.gid === net.record.gid);
    assert.equal(await ev(A, () => state.play.net.color), 'b'); assert.equal(await ev(B, () => state.play.net.color), 'w');
    assert.equal(await ev(A, () => document.querySelector('#screen-play .chess-board').classList.contains('flipped')), true);
    base.A = null; base.B = null; await check(A, '한 판 더(검은색)'); await check(B, '한 판 더(흰색)'); await shot(A, 'rematch-black');
    await move(B, [6, 3, 4, 3], A); await until(A, () => net.record.moves.length === 1);
    await A.page.locator('.mission-actions .icon-btn', { hasText: '기권' }).click(); await A.page.locator('#choice-overlay .action-btn', { hasText: '기권할게요' }).click();
    await until(B, () => net.record.end?.type === 'resign' && net.record.end.winner === 'w'); await closeResult(B);
    assert.match(await B.page.locator('#screen-play .play-state').innerText(), /내가 이겼어요/);
    await closeResult(A);

    // 7. 멀리서 새 대국(보호자 확인) → 연결이 모두 끊김 → 편지로 이어 두기 · 링크로 연 새 탭은 열려 있던 화면에 넘긴다.
    await ev(A, () => { goPlay(); playSetOption('netMethod', 'remote'); });
    await A.page.locator('.play-start', { hasText: '초대장 만들기' }).click(); await gate(A);
    const invite = await codeOf(A, '.net-code-text');
    await ev(B, () => { goPlay(); playSetOption('mode', 'net'); playSetOption('netMethod', 'remote'); });
    await B.page.locator('.play-cta .action-btn.secondary', { hasText: '받은 코드 넣기' }).click();
    await B.page.fill('#net-paste-overlay textarea', invite); await B.page.locator('#net-paste-overlay button[type=submit]').click(); await gate(B);
    const reply = await codeOf(B, '.net-code-text');
    await A.page.fill('.net-paste textarea', reply); await A.page.locator('.net-paste button[type=submit]').click();
    for (const d of [A, B]) await until(d, () => state.screen === 'play' && net.link?.state === 'open' && net.record.moves.length === 0);
    assert.equal(await ev(A, () => state.play.net.color), 'w');
    await ev(A, () => net.link.pc.close()); for (const d of [A, B]) await until(d, () => ['lost', 'none'].includes(netConnState()), null, 15000);
    await move(A, [6, 4, 4, 4], B);
    await A.page.locator('.net-fix .action-btn', { hasText: '편지로 보내기' }).click();
    const letter = await codeOf(A, '#net-letter-overlay .net-code-text'); await shot(A, 'letter'); await A.page.locator('#net-letter-overlay .dialog-close').click();
    const tab = await B.open();
    await tab.goto(URL + '#net=' + letter, { waitUntil: 'domcontentloaded' });
    await tab.waitForSelector('#choice-overlay', { timeout: 5000 }); assert.match(await tab.locator('#choice-overlay').innerText(), /열려 있던 체스 화면/);
    await tab.close();
    await until(B, () => net.record.moves.length === 1 && state.game.board[4][4] === 'wP');
    await move(B, [1, 4, 3, 4], A);
    await B.page.locator('.net-fix .action-btn', { hasText: '편지로 보내기' }).click();
    const back = await codeOf(B, '#net-letter-overlay .net-code-text'); await B.page.locator('#net-letter-overlay .dialog-close').click();
    await A.page.locator('.net-fix .action-btn', { hasText: '받은 코드 넣기' }).click();
    await A.page.fill('#net-paste-overlay textarea', 'garbage'); await A.page.locator('#net-paste-overlay button[type=submit]').click();
    assert.match(await A.page.locator('#net-paste-overlay .net-paste-error').innerText(), /읽지 못했어요/);
    await A.page.fill('#net-paste-overlay textarea', back); await A.page.locator('#net-paste-overlay button[type=submit]').click();
    await until(A, () => net.record.moves.length === 2 && state.game.board[3][4] === 'bP'); await same();
    await check(A, '편지 뒤'); await shot(A, 'after-letter');
    console.log(JSON.stringify({ passed: ['같은 방 QR(카메라)', '탭으로 두기·표정', '잠깐 끊김 복구', '오래 끊김(양쪽 끊김) 뒤 저절로 복구', '닫힘 → QR 다시 연결', '새로고침 → 코드 다시 연결', '비기기·한 판 더·기권', '멀리서·보호자 확인·편지·새 탭 넘기기'], screenshots: output }));
  } finally { for (const b of browsers) await b.close(); }
  if (errors.length) throw Error(errors.join('\n'));
})().catch(e => { console.error(e); process.exit(1); });
