/** Acceptance checks for the desktop-style static demo. Run the local server first. */
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const { chromium } = process.env.DEMO_PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(process.env.DEMO_PLAYWRIGHT_MODULE).href)
  : await import("playwright");
const baseUrl =
  process.env.DEMO_BASE_URL || "http://127.0.0.1:4178/customer-agent-demo/";
const browser = await chromium.launch({
  channel: process.env.DEMO_BROWSER_CHANNEL || "chrome",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [],
  requests = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => requests.push(request.url()));
const lastAnswer = () =>
  page
    .locator(".message.assistant:not(.loading-message) .message-bubble")
    .last()
    .textContent();
const description = () => page.locator("#page-description").textContent();
async function send(question) {
  await page.locator("#message-input").fill(question);
  await page.locator("#send-button").click();
  await page.waitForSelector("#send-button:not([disabled])");
}
async function nav(name) {
  await page.getByRole("link", { name, exact: true }).click();
}
async function noOverflow() {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    `overflow at ${page.viewportSize().width}px`,
  );
}
async function confirm() {
  await page.locator("#confirm-action").click();
}
const screenshotDir = fileURLToPath(new URL("../demo/", import.meta.url));
async function shot(name) {
  await page.waitForSelector("#toast[hidden]", { state: "attached" });
  await page.screenshot({ path: `${screenshotDir}/${name}`, fullPage: true });
}

try {
  await mkdir(screenshotDir, { recursive: true });
  const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  assert.ok((await page.title()).includes("AI 客服系统"));
  assert.equal(
    await page
      .getByRole("heading", { name: "自动回复管理", exact: true })
      .isVisible(),
    true,
  );
  assert.equal(await description(), "共 1 个账号");
  assert.ok(
    await page.evaluate(() => {
      const color = getComputedStyle(
        document.querySelector(".sidebar"),
      ).backgroundColor;
      return color.includes(".963") || color === "rgb(243, 243, 243)";
    }),
    "sidebar should use the light desktop theme",
  );
  await page.getByRole("button", { name: "开始所有", exact: true }).click();
  assert.ok(
    (await page.locator("#running-stats").textContent()).includes("1 个"),
  );
  await page.getByRole("button", { name: "停止所有", exact: true }).click();
  assert.ok(
    (await page.locator("#running-stats").textContent()).includes("0 个"),
  );

  await nav("账号管理");
  await page
    .getByRole("button", { name: "验证 示例客服 01", exact: true })
    .click();
  assert.ok(
    (await page.locator("#managed-account-list").textContent()).includes(
      "在线（模拟）",
    ),
  );
  assert.ok(
    (await page.locator("#toast").textContent()).includes("未验证真实平台登录"),
  );
  await page.getByRole("button", { name: "添加账号", exact: true }).click();
  await page.locator("#account-shop").fill("虚构测试店");
  await page.locator("#account-name").fill("测试客服");
  await page
    .locator("#account-form")
    .getByRole("button", { name: "确定", exact: true })
    .click();
  assert.equal(await description(), "共 2 个账号");
  await nav("自动回复");
  assert.equal(
    await page.locator("#auto-account-list .account-card").count(),
    2,
  );
  await nav("账号管理");
  await page
    .getByRole("button", { name: "编辑 测试客服", exact: true })
    .click();
  await page.locator("#account-name").fill("改名客服");
  await page
    .locator("#account-form")
    .getByRole("button", { name: "确定", exact: true })
    .click();
  await page
    .getByRole("button", { name: "删除 改名客服", exact: true })
    .click();
  await confirm();
  assert.equal(await description(), "共 1 个账号");

  await nav("关键词管理");
  assert.equal(await page.locator("#keyword-list tr").count(), 23);
  await page.getByRole("button", { name: "添加关键词", exact: true }).click();
  await page.locator("#keyword-input").fill("转人工");
  await page
    .locator("#keyword-form")
    .getByRole("button", { name: "确定", exact: true })
    .click();
  assert.equal(await page.locator("#keyword-error").isVisible(), true);
  await page.locator("#keyword-input").fill("需要经理");
  await page
    .locator("#keyword-form")
    .getByRole("button", { name: "确定", exact: true })
    .click();
  assert.equal(await page.locator("#keyword-list tr").count(), 24);
  await page
    .getByRole("button", { name: "编辑关键词 需要经理", exact: true })
    .click();
  await page.locator("#keyword-input").fill("请找经理");
  await page
    .locator("#keyword-form")
    .getByRole("button", { name: "确定", exact: true })
    .click();
  await page
    .getByRole("button", { name: "删除关键词 请找经理", exact: true })
    .click();
  await confirm();
  await page.getByRole("button", { name: "批量导入", exact: true }).click();
  await page
    .locator("#import-input")
    .fill("转人工\n示例词一\n示例词二\n示例词一");
  await page
    .locator("#import-form")
    .getByRole("button", { name: "导入", exact: true })
    .click();
  assert.equal(await page.locator("#keyword-list tr").count(), 25);

  await nav("设置");
  assert.equal(await page.locator("#setting-key").isDisabled(), true);
  await page.locator("#setting-provider").selectOption("DeepSeek");
  await page.locator("#setting-start").fill("09:00");
  await page.locator("#setting-end").fill("09:00");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  assert.equal(await page.locator("#settings-error").isVisible(), true);
  await page.locator("#setting-end").fill("22:00");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  assert.equal(await page.locator("#settings-saved").isVisible(), true);
  await nav("账号管理");
  await nav("设置");
  assert.equal(
    await page.locator("#setting-provider").inputValue(),
    "DeepSeek",
  );
  assert.equal(await page.locator("#setting-start").inputValue(), "09:00");

  await nav("客服对话演示");
  await page
    .getByRole("button", { name: "这件 T 恤是什么面料？", exact: true })
    .click();
  await page.waitForSelector("#send-button:not([disabled])");
  assert.ok((await lastAnswer()).includes("95%"));
  assert.equal(await page.locator("#evidence-count").textContent(), "1");
  await send("你们有蓝牙耳机吗？");
  assert.ok((await lastAnswer()).includes("没有找到可靠依据"));
  await send('<img src=x onerror="window.demoXss=true">');
  assert.equal(await page.evaluate(() => window.demoXss), undefined);
  assert.equal(await page.locator(".messages img").count(), 0);
  await page
    .getByRole("button", { name: "售后处理：退换货与人工协同", exact: true })
    .click();
  await send("我要投诉，转人工客服。");
  await page.getByRole("button", { name: "模拟人工接管", exact: true }).click();
  const answersBeforePause = await page.locator(".message.assistant").count();
  await send("告诉我怎么退货");
  assert.equal(
    await page.locator(".message.assistant").count(),
    answersBeforePause,
  );
  await page.getByRole("button", { name: "恢复自动回复", exact: true }).click();
  await send("衣服穿过一次还能退吗？");
  assert.ok((await lastAnswer()).includes("不能仅凭示例资料承诺一定可退"));

  await nav("知识库");
  await page
    .getByRole("button", { name: "编辑 轻氧棉 T 恤 · 商品资料", exact: true })
    .click();
  await page
    .locator("#edit-content")
    .fill("当前虚构商品更新为 100% 亚麻，请低温轻柔洗涤。");
  await page
    .getByRole("button", { name: "保存并用于匹配", exact: true })
    .click();
  await nav("客服对话演示");
  await page
    .getByRole("button", { name: "商品咨询：了解面料与日常洗护", exact: true })
    .click();
  await send("这件衣服是什么面料？");
  assert.ok((await lastAnswer()).includes("100% 亚麻"));
  await nav("知识库");
  await page.getByRole("button", { name: "添加产品知识", exact: true }).click();
  await page.locator("#edit-title").fill("示例尺码");
  await page.locator("#edit-triggers").fill("尺码，尺寸");
  await page
    .locator("#edit-content")
    .fill("当前虚构商品提供 S、M、L 三个尺码。");
  await page
    .getByRole("button", { name: "保存并用于匹配", exact: true })
    .click();
  await page.locator("#knowledge-search").fill("尺码");
  assert.equal(await page.locator(".knowledge-row").count(), 1);
  await nav("客服对话演示");
  await send("有哪些尺码？");
  assert.ok((await lastAnswer()).includes("S、M、L"));

  await nav("日志管理");
  assert.ok((await page.locator("#activity-list tr").count()) > 15);
  await page.locator("#log-level").selectOption("WARN");
  assert.ok((await page.locator("#activity-list tr").count()) > 0);
  assert.equal(await page.locator("#activity-list .level-info").count(), 0);
  await page.locator("#log-level").selectOption("all");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出", exact: true }).click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile(await download.path(), "utf8"));
  assert.equal(exported.mode, "static-rule-demo");
  assert.equal(exported.management.keywords.length, 25);
  assert.equal(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
    0,
  );
  await page.getByRole("button", { name: "清空", exact: true }).click();
  await confirm();
  assert.equal(await page.locator("#activity-list tr").count(), 0);

  await page.getByRole("button", { name: "重置体验", exact: true }).click();
  await page.locator("#confirm-reset").click();
  assert.equal(
    await page
      .getByRole("heading", { name: "自动回复管理", exact: true })
      .isVisible(),
    true,
  );
  await noOverflow();
  await shot("web-desktop.png");
  await nav("关键词管理");
  assert.equal(await page.locator("#keyword-list tr").count(), 23);
  await shot("web-keywords.png");
  await nav("设置");
  assert.equal(await page.locator("#setting-start").inputValue(), "08:00");
  await shot("web-settings.png");
  await nav("客服对话演示");
  await send("这件 T 恤是什么面料？");
  assert.ok((await lastAnswer()).includes("95%"));
  assert.ok(
    await page.evaluate(
      () =>
        document.querySelector(".composer").getBoundingClientRect().bottom <
        innerHeight,
    ),
    "desktop composer should remain in the window",
  );
  await shot("web-chat.png");
  for (const width of [1024, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const name of [
      "自动回复",
      "关键词管理",
      "账号管理",
      "知识库",
      "日志管理",
      "设置",
      "客服对话演示",
    ]) {
      await nav(name);
      await noOverflow();
    }
  }
  await page.locator("#nav-toggle").click();
  assert.equal(await page.locator("#nav-backdrop").isVisible(), true);
  await nav("客服对话演示");
  assert.equal(await page.locator("#nav-backdrop").isVisible(), false);
  await page.locator("#evidence-toggle").click();
  assert.equal(await page.locator("#evidence-panel").isVisible(), true);
  await page.locator("#evidence-toggle").click();
  await nav("自动回复");
  await shot("web-mobile.png");
  await page.reload({ waitUntil: "networkidle" });
  assert.ok(
    (await page.locator("#running-stats").textContent()).includes("0 个"),
  );
  assert.equal(errors.length, 0, JSON.stringify(errors));
  const origin = new URL(baseUrl).origin;
  assert.ok(
    requests.every((url) => url.startsWith(origin)),
    "unexpected external request",
  );
  console.log(
    JSON.stringify(
      {
        result: "passed",
        checks: [
          "original light navigation/default auto reply",
          "account start/stop/add/edit/delete/verify",
          "keyword duplicate/edit/delete/bulk import",
          "settings validation/save/reset",
          "grounded/unknown replies",
          "input text safety",
          "human pause/resume",
          "knowledge edit/add/search",
          "log filter/export/clear",
          "reset/reload",
          "1400/1024/768/390 layouts",
          "mobile navigation/evidence",
          "no storage/external request/browser errors",
        ],
        screenshots: [
          "web-desktop.png",
          "web-keywords.png",
          "web-settings.png",
          "web-chat.png",
          "web-mobile.png",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
