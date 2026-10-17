import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "http://127.0.0.1:4173";
const screenshotPath = join(projectRoot, "artifacts", "automation-success.png");
const aiScreenshotPath = join(projectRoot, "artifacts", "ai-review-success.png");
const queueScreenshotPath = join(projectRoot, "artifacts", "userscript-console-success.png");

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
let testDataDir;

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

  testDataDir = await mkdtemp(join(tmpdir(), "course-speed-pass-bank-"));
  const questionBankPath = join(testDataDir, "test-question-bank.json");
  await writeFile(
    questionBankPath,
    JSON.stringify(
      {
        questions: [
          {
            type: "single",
            prompt: "Playwright 自动化中，哪一种定位方式通常最稳定？",
            options: ["依赖第几个 div", "页面中的随机 class", "专用 data-testid", "鼠标绝对坐标"],
            answer: "C",
            explanation: "用于验证题目指纹去重。",
            confidence: 0.96,
          },
          {
            type: "single",
            prompt: "本地导入题：6 × 7 等于多少？",
            options: ["36", "42", "48"],
            answer: "B",
            explanation: "6 乘以 7 等于 42。",
            confidence: 0.93,
          },
          {
            type: "unsupported",
            prompt: "这条记录应被拒绝",
            answer: "无",
          },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  await page.locator("#bank-file-input").setInputFiles(questionBankPath);
  await page.waitForFunction(
    () =>
      document.body.dataset.bankTotal === "7" &&
      document.body.dataset.bankImported === "1" &&
      document.body.dataset.bankDuplicates === "1" &&
      document.body.dataset.bankRejected === "1",
  );
  const bankResult = await page.evaluate(() => window.courseDemo.quiz.getBankState());
  if (
    bankResult.total !== 7 ||
    bankResult.imported !== 1 ||
    bankResult.duplicates !== 1 ||
    bankResult.rejected !== 1
  ) {
    throw new Error(`题库导入断言失败：${JSON.stringify(bankResult)}`);
  }

  const bankDownloadPromise = page.waitForEvent("download");
  await page.locator("#export-bank").click();
  const bankDownload = await bankDownloadPromise;
  if (bankDownload.suggestedFilename() !== "course-speed-pass-question-bank.json") {
    throw new Error(`题库导出断言失败：${bankDownload.suggestedFilename()}`);
  }

  const exampleDownloadPromise = page.waitForEvent("download");
  await page.locator("#download-bank-example").click();
  const exampleDownload = await exampleDownloadPromise;
  if (exampleDownload.suggestedFilename() !== "course-speed-pass-question-bank-example.json") {
    throw new Error(`题库示例下载断言失败：${exampleDownload.suggestedFilename()}`);
  }

  await page.locator("#run-quiz").click();
  await page.waitForFunction(
    () => document.body.dataset.quizCoverage === "100" && document.body.dataset.quizReview === "1",
  );
  await page.locator("#approve-review").click();
  await page.locator("#submit-quiz").click();
  await page.waitForFunction(() => document.body.dataset.quizScore === "100");
  const importedQuizResult = await page.evaluate(() => window.courseDemo.quiz.getState());
  if (importedQuizResult.total !== 7 || importedQuizResult.correctCount !== 7) {
    throw new Error(`导入题库答题断言失败：${JSON.stringify(importedQuizResult)}`);
  }

  const importedOptionValue = await page.locator("#ai-question-select option").last().getAttribute("value");
  await page.locator("#ai-question-select").selectOption(importedOptionValue);
  await page.locator("#generate-ai-prompt").click();
  const generatedPrompt = await page.locator("#ai-prompt-preview").inputValue();
  if (!generatedPrompt.includes("本地导入题：6 × 7 等于多少？") || !generatedPrompt.includes("JSON")) {
    throw new Error("DeepSeek 复核提示词断言失败");
  }
  await page
    .locator("#ai-response-input")
    .fill(JSON.stringify({ answer: "B", confidence: 0.86, explanation: "6 × 7 = 42。" }));
  await page.locator("#apply-ai-response").click();
  const importedQuestionId = await page.locator("#ai-question-select").inputValue();
  if (!(await page.locator(`[data-question-id="${importedQuestionId}"] .answer-trace`).textContent()).includes("DeepSeek 手动复核")) {
    throw new Error("DeepSeek 手动复核结果未应用到题目");
  }
  await page.locator("#submit-quiz").click();
  await page.waitForFunction(() => document.body.dataset.quizScore === "100");

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

  await page.evaluate(() => {
    const aiPanel = document.querySelector(".ai-review-panel");
    window.scrollTo({ left: 0, top: aiPanel.getBoundingClientRect().top + window.scrollY - 105, behavior: "instant" });
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: aiScreenshotPath });

  await page.locator("#restore-starter-bank").click();
  await page.waitForFunction(() => document.body.dataset.bankTotal === "6");

  await page.locator("#reset-quiz").click();
  await page.locator("#queue-profile").selectOption("cautious");
  await page.locator("#queue-dry-run").check();
  await page.locator("#build-queue").click();
  await page.locator("#start-queue").click();
  await page.waitForFunction(() => document.body.dataset.queueState === "running");
  await page.locator("#pause-queue").click();
  await page.waitForFunction(() => document.body.dataset.queueState === "paused");
  await page.locator("#start-queue").click();
  await page.waitForFunction(
    () => document.body.dataset.queueState === "complete" && document.body.dataset.queueFinished === "6",
    undefined,
    { timeout: 10_000 },
  );
  const dryRunQueueResult = await page.evaluate(() => ({
    queue: window.courseDemo.quiz.getQueueState(),
    quiz: window.courseDemo.quiz.getState(),
  }));
  if (!dryRunQueueResult.queue.dryRun || dryRunQueueResult.quiz.answered !== 0) {
    throw new Error(`预演队列断言失败：${JSON.stringify(dryRunQueueResult)}`);
  }

  const runtimeSettingsDownloadPromise = page.waitForEvent("download");
  await page.locator("#export-queue-settings").click();
  const runtimeSettingsDownload = await runtimeSettingsDownloadPromise;
  if (runtimeSettingsDownload.suggestedFilename() !== "course-speed-pass-runtime-settings.json") {
    throw new Error(`运行台设置导出断言失败：${runtimeSettingsDownload.suggestedFilename()}`);
  }

  await page.locator("#queue-dry-run").uncheck();
  await page.locator("#build-queue").click();
  await page.locator("#start-queue").click();
  await page.waitForFunction(() => document.body.dataset.queueState === "running");
  await page.locator("#stop-queue").click();
  await page.waitForFunction(() => document.body.dataset.queueState === "stopped");

  const runtimeSettingsPath = join(testDataDir, "runtime-settings.json");
  await writeFile(
    runtimeSettingsPath,
    JSON.stringify(
      {
        format: "course-speed-pass-runtime-settings-v1",
        settings: { profile: "fast", scope: "all", delay: 0, retries: 2, dryRun: false },
      },
      null,
      2,
    ),
    "utf8",
  );
  await page.locator("#queue-settings-file").setInputFiles(runtimeSettingsPath);
  await page.waitForFunction(
    () =>
      document.querySelector("#queue-profile").value === "fast" &&
      document.querySelector("#queue-delay").value === "0" &&
      document.querySelector("#queue-retries").value === "2",
  );
  await page.locator("#reset-quiz").click();
  await page.locator("#build-queue").click();
  await page.locator("#start-queue").click();
  await page.waitForFunction(
    () => document.body.dataset.queueState === "complete" && document.body.dataset.queueFinished === "6",
  );
  const liveQueueResult = await page.evaluate(() => window.courseDemo.quiz.getQueueState());
  if (liveQueueResult.total !== 6 || liveQueueResult.failed !== 0 || liveQueueResult.review !== 0) {
    throw new Error(`实时队列断言失败：${JSON.stringify(liveQueueResult)}`);
  }
  await page.locator("#submit-quiz").click();
  await page.waitForFunction(() => document.body.dataset.quizScore === "100");
  const detectedCards = await page.locator("#queue-dom-count").textContent();
  if (detectedCards !== "6") throw new Error(`动态题卡检测断言失败：${detectedCards}`);

  await page.evaluate(() => {
    const consolePanel = document.querySelector(".script-console");
    window.scrollTo({ left: 0, top: consolePanel.getBoundingClientRect().top + window.scrollY - 105, behavior: "instant" });
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: queueScreenshotPath });

  const csvBankPath = join(testDataDir, "test-question-bank.csv");
  await writeFile(
    csvBankPath,
    [
      "type,prompt,options,answer,aliases,explanation,confidence",
      'fill,"CSV 本地导入题：自动化测试工具名称是？",,Playwright,,"用于验证 CSV 与替换模式。",0.9',
    ].join("\n"),
    "utf8",
  );
  await page.locator("#bank-import-mode").selectOption("replace");
  await page.locator("#bank-file-input").setInputFiles(csvBankPath);
  await page.waitForFunction(
    () => document.body.dataset.bankTotal === "1" && document.body.dataset.bankImported === "1",
  );
  const csvBankResult = await page.evaluate(() => window.courseDemo.quiz.getBankState());
  if (csvBankResult.total !== 1 || csvBankResult.imported !== 1) {
    throw new Error(`CSV 替换题库断言失败：${JSON.stringify(csvBankResult)}`);
  }
  await page.locator("#restore-starter-bank").click();
  await page.waitForFunction(() => document.body.dataset.bankTotal === "6");

  console.log("✓ 页面成功加载");
  console.log("✓ 自动播放与章节切换完成");
  console.log("✓ 结果断言通过：6/6 节，100%");
  console.log("✓ 答题覆盖断言通过：6/6 题，100%");
  console.log("✓ 低置信度复核断言通过：1 题拦截并确认");
  console.log("✓ 模拟评分断言通过：6/6 题，100 分");
  console.log("✓ 错题重试断言通过：83 分恢复为 100 分");
  console.log("✓ JSON 报告导出断言通过");
  console.log("✓ 题库导入断言通过：新增 1、重复 1、拒绝 1");
  console.log("✓ 导入题库答题断言通过：7/7，100 分");
  console.log("✓ DeepSeek 手动复核提示词与结果回填断言通过");
  console.log("✓ JSON 合并、CSV 替换、题库导出与恢复断言通过");
  console.log("✓ 油猴式运行台断言通过：预演、暂停/恢复、停止、快速队列");
  console.log("✓ 运行台设置导入导出与动态题卡检测断言通过");
  console.log(`✓ 截图：${screenshotPath}`);
  console.log(`✓ AI 复核截图：${aiScreenshotPath}`);
  console.log(`✓ 运行台截图：${queueScreenshotPath}`);
} catch (error) {
  console.error(`✗ 自动化测试失败：${error.message}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  if (testDataDir) await rm(testDataDir, { recursive: true, force: true });
}
