import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "http://127.0.0.1:4173";
const screenshotPath = join(projectRoot, "artifacts", "automation-success.png");

async function waitForServer(url, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`本地服务器未在 ${timeout}ms 内启动`);
}

const server = spawn(process.execPath, ["scripts/server.mjs"], {
  cwd: projectRoot,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: "4173", HOST: "127.0.0.1" },
});

let browser;

try {
  await waitForServer(baseUrl);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("#speed-select").selectOption("8");
  await page.locator("#run-demo").click();

  await page.waitForFunction(
    () => document.body.dataset.completedLessons === "6" && document.body.dataset.automationState === "complete",
    undefined,
    { timeout: 30_000 },
  );

  const result = await page.evaluate(() => window.courseDemo.getState());
  if (result.completed !== 6 || result.totalPercent !== 100) {
    throw new Error(`断言失败：completed=${result.completed}, totalPercent=${result.totalPercent}`);
  }

  await mkdir(dirname(screenshotPath), { recursive: true });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(2_300);
  await page.screenshot({ path: screenshotPath });

  console.log("✓ 页面成功加载");
  console.log("✓ 自动播放与章节切换完成");
  console.log("✓ 结果断言通过：6/6 节，100%");
  console.log(`✓ 截图：${screenshotPath}`);
} catch (error) {
  console.error(`✗ 自动化测试失败：${error.message}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
