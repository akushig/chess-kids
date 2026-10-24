const { chromium } = require(process.env.CHESS_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const output = process.env.CHESS_KNIGHT_QA_OUTPUT || '/tmp/chess-knight-qa';

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHESS_BROWSER_EXECUTABLE ? { executablePath: process.env.CHESS_BROWSER_EXECUTABLE } : {}) });
  const errors = [], results = [];
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const viewport of [{ width: 360, height: 780 }, { width: 768, height: 1024 }]) {
      const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://fonts.googleapis.com/**', route => route.abort());
      await page.goto(process.env.CHESS_TEST_URL || 'http://127.0.0.1:8765', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => { writeData('preferences', { motion: false }); applyPreferences(); goKnightSetup(); });
      const suffix = viewport.width === 360 ? 'mobile' : 'tablet';
      const alert = page.getByRole('switch', { name: '갈림길 알림', exact: true });
      await alert.waitFor(); assert.equal(await alert.isChecked(), true);
      assert.ok((await alert.boundingBox()).y < (await page.locator('.kt-board').boundingBox()).y);
      assert.equal(await page.locator('.kt-actions > button').count(), 3);
      assert.equal(await page.getByRole('button', { name: /시범|한 점프 보기/ }).count(), 0);
      const actions = await page.locator('.kt-actions').boundingBox();
      assert.ok(actions.y + actions.height <= viewport.height, 'primary controls fit the viewport');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${output}/tour-${suffix}.png`, fullPage: true, animations: 'disabled' });

      await page.getByRole('button', { name: '힌트 보기', exact: true }).click();
      assert.equal(await page.locator('.kt-route-number').count(), 24);
      assert.equal(await page.getByRole('button', { name: '전체 경로', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.evaluate(() => state.kt.visited), 1);
      const aligned = await page.locator('.kt-route-number').evaluateAll(numbers => numbers.every(number => {
        const a = number.getBoundingClientRect(), b = number.parentElement.getBoundingClientRect();
        return Math.abs(a.x + a.width / 2 - b.x - b.width / 2) < 1 && Math.abs(a.y + a.height / 2 - b.y - b.height / 2) < 1;
      }));
      assert.equal(aligned, true, 'path numbers align with actual cells');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${output}/full-path-${suffix}.png`, fullPage: true, animations: 'disabled' });
      await page.getByRole('button', { name: '다음 한 수', exact: true }).click();
      assert.equal(await page.locator('.kt-route-number').count(), 1);
      await page.getByRole('button', { name: '힌트 닫기', exact: true }).click();
      assert.equal(await page.locator('.kt-route-number').count(), 0);

      for (const [r, c] of [[2,1], [0,0], [1,2], [2,4]]) {
        await page.locator('.kt-board .board-cell').nth(r * 5 + c).click();
      }
      assert.match(await page.locator('.kt-status').innerText(), /갈림길이에요/);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${output}/branch-${suffix}.png`, fullPage: true, animations: 'disabled' });
      await alert.uncheck(); assert.equal(await page.locator('.kt-status--branch').count(), 0);
      await page.getByRole('switch', { name: '갈림길 알림', exact: true }).check();
      assert.equal(await page.locator('.kt-status--branch').count(), 1);
      await page.locator('.kt-board .board-cell').nth(17).click();
      assert.match(await page.locator('.kt-status').innerText(), /완주할 수 없어요/);
      assert.ok(await page.locator('.kt-board .move-hint').count() > 0);
      await page.getByRole('button', { name: '되돌리기', exact: true }).click();
      assert.equal(await page.locator('.kt-status--branch').count(), 1);
      await page.getByRole('button', { name: '힌트 보기', exact: true }).click();
      await page.getByRole('button', { name: '전체 경로', exact: true }).click();
      assert.equal(await page.locator('.kt-route-number').count(), 20);
      await page.reload({ waitUntil: 'domcontentloaded' }); await page.evaluate(() => resumeActivity());
      assert.equal(await page.locator('.kt-route-number').count(), 20);
      assert.equal(await page.locator('.kt-status--branch').count(), 1);

      await page.locator('.kt-settings > summary').click();
      const before = await page.evaluate(() => JSON.stringify([state.kt.pos, state.kt.visited, state.kt.board]));
      await page.getByRole('radio', { name: '무작위', exact: true }).check();
      assert.equal(await page.evaluate(() => JSON.stringify([state.kt.pos, state.kt.visited, state.kt.board])), before);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${output}/settings-${suffix}.png`, fullPage: true, animations: 'disabled' });
      await page.getByRole('button', { name: '다시 하기', exact: true }).click();
      await page.getByRole('button', { name: '같은 판 다시 하기', exact: true }).click();
      assert.equal(await page.evaluate(() => state.kt.startPos.join(',')), '4,0');
      await page.locator('.kt-settings > summary').click();
      await page.getByRole('button', { name: '설정대로 새 판 시작', exact: true }).click();
      assert.notEqual(await page.evaluate(() => state.kt.startPos.join(',')), '4,0');
      await page.getByRole('button', { name: '6×6 판', exact: true }).click();
      assert.equal(await page.evaluate(() => getKnightTourSettings().levelIdx), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
      results.push({ ...viewport, fullPath: true, branchAlert: true, impossibleRoute: true, restore: true, startSettings: true });
      await context.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
    console.log('Knight tour browser QA passed:', JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
