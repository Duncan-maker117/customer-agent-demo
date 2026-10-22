/** Browser acceptance checks. Start serve_web_demo.mjs first; Playwright is optional QA tooling. */
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = process.env.DEMO_PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(process.env.DEMO_PLAYWRIGHT_MODULE).href)
  : await import('playwright');
const baseUrl = process.env.DEMO_BASE_URL || 'http://127.0.0.1:4178/customer-agent-demo/';
const browser = await chromium.launch({ channel: process.env.DEMO_BROWSER_CHANNEL || 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
const requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => requests.push(request.url()));
const lastAnswer = () => page.locator('.message.assistant:not(.loading-message) .message-bubble').last().textContent();
async function send(question) {
  await page.locator('#message-input').fill(question);
  await page.locator('#send-button').click();
  await page.waitForSelector('#send-button:not([disabled])');
}
async function nav(name) {
  await page.getByRole('link', { name, exact: true }).click();
}
async function noHorizontalOverflow() {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `horizontal overflow at ${page.viewportSize().width}px`);
}
try {
  const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  assert.ok((await page.title()).includes('客服工作台'));
  await page.getByRole('button', { name: '这件 T 恤是什么面料？', exact: true }).click();
  await page.waitForSelector('#send-button:not([disabled])');
  assert.ok((await lastAnswer()).includes('95%'));
  assert.equal(await page.locator('#evidence-count').textContent(), '1');
  await send('你们有蓝牙耳机吗？');
  assert.ok((await lastAnswer()).includes('没有找到可靠依据'));
  await send('<img src=x onerror="window.demoXss=true">');
  assert.equal(await page.evaluate(() => window.demoXss), undefined);
  assert.equal(await page.locator('.messages img').count(), 0);
  assert.ok((await page.locator('.message.user .message-bubble').last().textContent()).includes('<img'));

  await page.getByRole('button', { name: '售后处理：退换货与人工协同', exact: true }).click();
  await send('我要投诉，转人工客服。');
  assert.equal(await page.locator('#handoff-bar').isVisible(), true);
  await page.getByRole('button', { name: '模拟人工接管', exact: true }).click();
  const answersBeforePause = await page.locator('.message.assistant').count();
  await send('告诉我怎么退货');
  assert.equal(await page.locator('.message.assistant').count(), answersBeforePause);
  await page.getByRole('button', { name: '恢复自动回复', exact: true }).click();
  await send('衣服穿过一次还能退吗？');
  assert.ok((await lastAnswer()).includes('不能仅凭示例资料承诺一定可退'));

  await nav('知识库');
  await page.getByRole('button', { name: '编辑 轻氧棉 T 恤 · 商品资料', exact: true }).click();
  await page.locator('#edit-content').fill('当前虚构商品更新为 100% 亚麻，请低温轻柔洗涤。');
  await page.getByRole('button', { name: '保存并用于匹配', exact: true }).click();
  await nav('会话中心');
  await page.getByRole('button', { name: '商品咨询：了解面料与日常洗护', exact: true }).click();
  await send('这件衣服是什么面料？');
  assert.ok((await lastAnswer()).includes('100% 亚麻'));

  await nav('知识库');
  await page.getByRole('button', { name: '新增知识', exact: true }).click();
  await page.locator('#edit-title').fill('示例尺码');
  await page.locator('#edit-triggers').fill('尺码，尺寸');
  await page.locator('#edit-content').fill('当前虚构商品提供 S、M、L 三个尺码。');
  await page.getByRole('button', { name: '保存并用于匹配', exact: true }).click();
  await page.locator('#knowledge-search').fill('尺码');
  assert.equal(await page.locator('.knowledge-row').count(), 1);
  await nav('会话中心');
  await send('有哪些尺码？');
  assert.ok((await lastAnswer()).includes('S、M、L'));
  await nav('处理记录');
  assert.ok(Number(await page.locator('#metric-questions').textContent()) >= 8);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出记录', exact: true }).click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  assert.equal(exported.mode, 'static-rule-demo');
  assert.ok(exported.activities.length > 8);
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);

  await page.getByRole('button', { name: '重置体验', exact: true }).click();
  await page.locator('#confirm-reset').click();
  await send('这件 T 恤是什么面料？');
  assert.ok((await lastAnswer()).includes('95%'));
  await send('下单后多久能发货？');
  assert.ok((await lastAnswer()).includes('48 小时'));
  assert.ok(await page.evaluate(() => document.querySelector('.composer-area').getBoundingClientRect().bottom <= document.querySelector('.conversation-layout').getBoundingClientRect().bottom), 'composer clipped after conversation grows');
  const screenshotDir = fileURLToPath(new URL('../demo/', import.meta.url));
  await mkdir(screenshotDir, { recursive: true });
  await page.waitForSelector('#toast[hidden]', { state: 'attached' });
  await noHorizontalOverflow();
  await page.screenshot({ path: `${screenshotDir}/web-desktop.png`, fullPage: true });
  for (const width of [1024, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await noHorizontalOverflow();
  }
  await page.locator('#evidence-toggle').click();
  assert.equal(await page.locator('#evidence-panel').isVisible(), true);
  await page.locator('#evidence-toggle').click();
  await page.screenshot({ path: `${screenshotDir}/web-mobile.png`, fullPage: true });
  await nav('知识库');
  await noHorizontalOverflow();
  await nav('处理记录');
  await noHorizontalOverflow();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#metric-questions').textContent(), '0');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  const origin = new URL(baseUrl).origin;
  assert.ok(requests.every(url => url.startsWith(origin)), 'unexpected external request');
  console.log(JSON.stringify({ result: 'passed', checks: ['grounded/unknown replies', 'text input safety', 'human pause/resume', 'edit/add/search knowledge', 'activity export', 'reset/reload', '1440/1024/768/390 responsive layouts', 'mobile evidence', 'no storage/external request', 'no browser errors'], screenshots: ['demo/web-desktop.png', 'demo/web-mobile.png'] }, null, 2));
} finally {
  await browser.close();
}
