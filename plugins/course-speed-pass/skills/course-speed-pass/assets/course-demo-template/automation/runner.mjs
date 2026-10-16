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

  await page.locator("#run-quiz").click();
  await page.waitForFunction(
    () =>
      document.body.dataset.quizCoverage === "100" &&
      document.body.dataset.quizState === "review" &&
      document.body.dataset.quizReview === "1",
  );

  const reviewResult = await page.evaluate(() => window.courseDemo.quiz.getState());
  if (reviewResult.coverage !== 100 || reviewResult.pendingReview !== 1) {
    throw new Error(
      `复核断言失败：coverage=${reviewResult.coverage}, pendingReview=${reviewResult.pendingReview}`,
    );
  }

  await page.locator("#approve-review").click();
  await page.locator("#submit-quiz").click();
  await page.waitForFunction(
    () => document.body.dataset.quizState === "complete" && document.body.dataset.quizScore === "100",
  );

  const quizResult = await page.evaluate(() => window.courseDemo.quiz.getState());
  if (
    quizResult.answered !== 6 ||
    quizResult.correctCount !== 6 ||
    quizResult.score !== 100 ||
    quizResult.pendingReview !== 0
  ) {
    throw new Error(
      `答题断言失败：answered=${quizResult.answered}, correct=${quizResult.correctCount}, score=${quizResult.score}, pending=${quizResult.pendingReview}`,
    );
  }

  await page.locator('[data-question-id="q1"] input').first().check();
  await page.locator("#submit-quiz").click();
  await page.waitForFunction(() => document.body.dataset.quizScore === "83");
  if (await page.locator("#retry-wrong").isDisabled()) {
    throw new Error("错题重试断言失败：按钮未启用");
  }

  await page.locator("#retry-wrong").click();
  await page.locator("#submit-quiz").click();
  await page.waitForFunction(() => document.body.dataset.quizScore === "100");

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-quiz-report").click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().startsWith("quiz-lab-report-")) {
    throw new Error(`报告导出断言失败：${download.suggestedFilename()}`);
  }

  await mkdir(dirname(screenshotPath), { recursive: true });
  await page.evaluate(() => {
    const quizLab = document.querySelector(".quiz-lab");
    window.scrollTo({
      left: 0,
      top: quizLab.getBoundingClientRect().top + window.scrollY - 105,
      behavior: "instant",
    });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: screenshotPath });

  console.log("✓ 页面成功加载");
  console.log("✓ 自动播放与章节切换完成");
  console.log("✓ 结果断言通过：6/6 节，100%");
  console.log("✓ 答题覆盖断言通过：6/6 题，100%");
  console.log("✓ 低置信度复核断言通过：1 题拦截并确认");
  console.log("✓ 模拟评分断言通过：6/6 题，100 分");
  console.log("✓ 错题重试断言通过：83 分恢复为 100 分");
  console.log("✓ JSON 报告导出断言通过");
  console.log(`✓ 截图：${screenshotPath}`);
} catch (error) {
  console.error(`✗ 自动化测试失败：${error.message}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
