const lessons = [
  {
    number: "01",
    group: "第一章 · 建立实验",
    title: "自动化究竟在控制什么？",
    description: "认识页面元素、状态与事件，先看懂自动化的控制对象。",
    duration: 12,
  },
  {
    number: "02",
    group: "第一章 · 建立实验",
    title: "定位按钮与读取状态",
    description: "观察稳定的元素标识，理解测试脚本如何找到并操作按钮。",
    duration: 14,
  },
  {
    number: "03",
    group: "第二章 · 流程控制",
    title: "播放、暂停与时间推进",
    description: "用一个可预测的计时器模拟媒体播放状态，避免真实视频依赖。",
    duration: 16,
  },
  {
    number: "04",
    group: "第二章 · 流程控制",
    title: "检测完成并切换章节",
    description: "当当前章节完成时发出事件，再由状态机决定是否前往下一节。",
    duration: 13,
  },
  {
    number: "05",
    group: "第三章 · 外部测试",
    title: "用 Playwright 驱动页面",
    description: "从浏览器外部执行点击、等待与断言，形成可重复的端到端测试。",
    duration: 15,
  },
  {
    number: "06",
    group: "第三章 · 外部测试",
    title: "验证结果与保存截图",
    description: "检查六节是否全部完成，并保存自动化运行成功的页面截图。",
    duration: 12,
  },
];

const starterQuizQuestions = [
  {
    id: "q1",
    type: "single",
    typeLabel: "单选题",
    prompt: "Playwright 自动化中，哪一种定位方式通常最稳定？",
    options: ["依赖第几个 div", "页面中的随机 class", "专用 data-testid", "鼠标绝对坐标"],
    answer: "专用 data-testid",
    explanation: "稳定、语义明确的测试标识不依赖页面层级或坐标，更适合端到端测试。",
  },
  {
    id: "q2",
    type: "multiple",
    typeLabel: "多选题",
    prompt: "这个本地实验允许自动化完成哪些操作？",
    options: ["推进模拟播放", "记录事件日志", "保存验收截图", "向真实平台提交学习进度"],
    answer: ["推进模拟播放", "记录事件日志", "保存验收截图"],
    explanation: "实验只控制自建页面，不向真实平台提交任何数据。",
  },
  {
    id: "q3",
    type: "truefalse",
    typeLabel: "判断题",
    prompt: "localStorage 保存的数据只属于当前浏览器环境。",
    options: ["正确", "错误"],
    answer: "正确",
    explanation: "本例的数据保存在当前浏览器的本地存储中，不会同步到网课平台。",
  },
  {
    id: "q4",
    type: "fill",
    typeLabel: "填空题",
    prompt: "Playwright 打开页面常用的方法名是 ______。",
    answer: "page.goto",
    aliases: ["page.goto()"],
    explanation: "page.goto(url) 用于让页面导航到指定地址。",
  },
  {
    id: "q5",
    type: "single",
    typeLabel: "单选题",
    prompt: "课程全部完成时，本实验会派发哪个自定义事件？",
    options: ["course-demo-start", "course-demo-complete", "quiz-real-submit", "login-success"],
    answer: "course-demo-complete",
    explanation: "播放器完成最后一节后会派发 course-demo-complete，供测试脚本监听。",
  },
  {
    id: "q6",
    type: "fill",
    typeLabel: "填空题",
    prompt: "本地静态服务器默认地址是 http://______。",
    answer: "127.0.0.1:4173",
    aliases: ["localhost:4173"],
    explanation: "启动脚本默认只监听本机 127.0.0.1 的 4173 端口。",
  },
];

const storageKey = "zhixing-course-demo-v1";
const quizStorageKey = "zhixing-quiz-lab-v1";
const answerCacheKey = "zhixing-quiz-answer-cache-v1";
const questionBankKey = "zhixing-question-bank-v1";
const questionBankStatsKey = "zhixing-question-bank-stats-v1";
const queueSettingsKey = "zhixing-userscript-console-settings-v1";

const initialState = () => ({
  currentIndex: 0,
  progress: lessons.map(() => 0),
  isPlaying: false,
  speed: 4,
  autoNext: true,
  eventCount: 0,
  mode: "idle",
});

let state = loadState();
let quizQuestions = loadQuestionBank();
let bankStats = loadBankStats();
let quizState = loadQuizState();
let queueSettings = loadQueueSettings();
let queueState = initialQueueState();
let timerId = null;
let queueTimer = null;
let lastTick = 0;
let toastTimer = null;

const elements = {
  lessonList: document.querySelector("#lesson-list"),
  chapterNumber: document.querySelector("#chapter-number"),
  lessonKicker: document.querySelector("#lesson-kicker"),
  lessonTitle: document.querySelector("#lesson-title"),
  lessonDescription: document.querySelector("#lesson-description"),
  playingIndicator: document.querySelector("#playing-indicator"),
  currentTime: document.querySelector("#current-time"),
  durationTime: document.querySelector("#duration-time"),
  timeline: document.querySelector("#timeline"),
  timelineFill: document.querySelector("#timeline-fill"),
  playButton: document.querySelector("#play-button"),
  playIcon: document.querySelector("#play-icon"),
  playLabel: document.querySelector("#play-label"),
  restartLesson: document.querySelector("#restart-lesson"),
  speedSelect: document.querySelector("#speed-select"),
  autoNext: document.querySelector("#auto-next"),
  runDemo: document.querySelector("#run-demo"),
  resetDemo: document.querySelector("#reset-demo"),
  clearLog: document.querySelector("#clear-log"),
  eventLog: document.querySelector("#event-log"),
  progressRing: document.querySelector("#progress-ring"),
  overallPercent: document.querySelector("#overall-percent"),
  completedSummary: document.querySelector("#completed-summary"),
  overviewStatus: document.querySelector("#overview-status"),
  automationStatus: document.querySelector("#automation-status"),
  metricCompleted: document.querySelector("#metric-completed"),
  metricCurrent: document.querySelector("#metric-current"),
  metricEvents: document.querySelector("#metric-events"),
  metricMessage: document.querySelector("#metric-message"),
  quizStatus: document.querySelector("#quiz-status"),
  quizMode: document.querySelector("#quiz-mode"),
  confidenceThreshold: document.querySelector("#confidence-threshold"),
  reviewLowConfidence: document.querySelector("#review-low-confidence"),
  runQuiz: document.querySelector("#run-quiz"),
  approveReview: document.querySelector("#approve-review"),
  submitQuiz: document.querySelector("#submit-quiz"),
  quizCoverage: document.querySelector("#quiz-coverage"),
  quizScore: document.querySelector("#quiz-score"),
  quizReviewCount: document.querySelector("#quiz-review-count"),
  quizCacheHits: document.querySelector("#quiz-cache-hits"),
  bankTotal: document.querySelector("#bank-total"),
  bankImported: document.querySelector("#bank-imported"),
  bankDuplicates: document.querySelector("#bank-duplicates"),
  bankRejected: document.querySelector("#bank-rejected"),
  bankImportMode: document.querySelector("#bank-import-mode"),
  bankFileInput: document.querySelector("#bank-file-input"),
  importBank: document.querySelector("#import-bank"),
  downloadBankExample: document.querySelector("#download-bank-example"),
  exportBank: document.querySelector("#export-bank"),
  restoreStarterBank: document.querySelector("#restore-starter-bank"),
  bankMessage: document.querySelector("#bank-message"),
  queueStatus: document.querySelector("#queue-status"),
  queueProfile: document.querySelector("#queue-profile"),
  queueScope: document.querySelector("#queue-scope"),
  queueDelay: document.querySelector("#queue-delay"),
  queueRetries: document.querySelector("#queue-retries"),
  queueDryRun: document.querySelector("#queue-dry-run"),
  buildQueue: document.querySelector("#build-queue"),
  startQueue: document.querySelector("#start-queue"),
  pauseQueue: document.querySelector("#pause-queue"),
  stopQueue: document.querySelector("#stop-queue"),
  exportQueueSettings: document.querySelector("#export-queue-settings"),
  importQueueSettings: document.querySelector("#import-queue-settings"),
  queueSettingsFile: document.querySelector("#queue-settings-file"),
  queueProgressFill: document.querySelector("#queue-progress-fill"),
  queueProgressText: document.querySelector("#queue-progress-text"),
  queuePending: document.querySelector("#queue-pending"),
  queueRunning: document.querySelector("#queue-running"),
  queueReview: document.querySelector("#queue-review"),
  queueDone: document.querySelector("#queue-done"),
  queueFailed: document.querySelector("#queue-failed"),
  queueDomCount: document.querySelector("#queue-dom-count"),
  queueList: document.querySelector("#queue-list"),
  queueMessage: document.querySelector("#queue-message"),
  questionList: document.querySelector("#question-list"),
  retryWrong: document.querySelector("#retry-wrong"),
  resetQuiz: document.querySelector("#reset-quiz"),
  exportQuizReport: document.querySelector("#export-quiz-report"),
  quizMessage: document.querySelector("#quiz-message"),
  aiQuestionSelect: document.querySelector("#ai-question-select"),
  generateAiPrompt: document.querySelector("#generate-ai-prompt"),
  copyAiPrompt: document.querySelector("#copy-ai-prompt"),
  aiPromptPreview: document.querySelector("#ai-prompt-preview"),
  aiResponseInput: document.querySelector("#ai-response-input"),
  applyAiResponse: document.querySelector("#apply-ai-response"),
  aiReviewMessage: document.querySelector("#ai-review-message"),
  toast: document.querySelector("#toast"),
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || !Array.isArray(saved.progress) || saved.progress.length !== lessons.length) {
      return initialState();
    }

    return {
      ...initialState(),
      ...saved,
      isPlaying: false,
      currentIndex: Math.max(0, Math.min(lessons.length - 1, Number(saved.currentIndex) || 0)),
      progress: saved.progress.map((value, index) =>
        Math.max(0, Math.min(lessons[index].duration, Number(value) || 0)),
      ),
    };
  } catch {
    return initialState();
  }
}

function saveState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      currentIndex: state.currentIndex,
      progress: state.progress,
      speed: state.speed,
      autoNext: state.autoNext,
      eventCount: state.eventCount,
      mode: state.mode,
    }),
  );
}

function cloneStarterBank() {
  return starterQuizQuestions.map((question) => ({
    ...question,
    options: question.options ? [...question.options] : undefined,
    aliases: question.aliases ? [...question.aliases] : undefined,
    origin: "starter",
  }));
}

function loadQuestionBank() {
  try {
    const saved = JSON.parse(localStorage.getItem(questionBankKey));
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch {
    // Fall back to the bundled bank.
  }
  return cloneStarterBank();
}

function loadBankStats() {
  const fallback = { imported: 0, duplicates: 0, rejected: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(questionBankStatsKey));
    return saved && typeof saved === "object" ? { ...fallback, ...saved } : fallback;
  } catch {
    return fallback;
  }
}

function saveQuestionBank() {
  localStorage.setItem(questionBankKey, JSON.stringify(quizQuestions));
  localStorage.setItem(questionBankStatsKey, JSON.stringify(bankStats));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function listFromValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return String(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveChoiceToken(value, options) {
  const token = String(value ?? "").trim();
  const letterIndex = /^[A-Za-z]$/.test(token) ? token.toUpperCase().charCodeAt(0) - 65 : -1;
  return letterIndex >= 0 && letterIndex < options.length ? options[letterIndex] : token;
}

function normalizeImportedQuestion(raw, index) {
  if (!raw || typeof raw !== "object") throw new Error(`第 ${index + 1} 条不是对象`);
  const typeMap = {
    single: "single",
    单选: "single",
    单选题: "single",
    multiple: "multiple",
    多选: "multiple",
    多选题: "multiple",
    truefalse: "truefalse",
    judge: "truefalse",
    判断: "truefalse",
    判断题: "truefalse",
    fill: "fill",
    blank: "fill",
    填空: "fill",
    填空题: "fill",
  };
  const type = typeMap[String(raw.type ?? "").trim().toLowerCase()] || typeMap[String(raw.type ?? "").trim()];
  const prompt = String(raw.prompt ?? raw.question ?? "").trim();
  if (!prompt) throw new Error(`第 ${index + 1} 条缺少 prompt`);
  if (!type) throw new Error(`第 ${index + 1} 条题型不支持`);

  let options = listFromValue(raw.options);
  if (type === "truefalse" && options.length === 0) options = ["正确", "错误"];
  if (["single", "multiple", "truefalse"].includes(type) && options.length < 2) {
    throw new Error(`第 ${index + 1} 条选择题至少需要两个选项`);
  }

  let answer;
  if (type === "multiple") {
    answer = listFromValue(raw.answer).map((item) => resolveChoiceToken(item, options));
    if (answer.length === 0) throw new Error(`第 ${index + 1} 条缺少多选答案`);
    if (answer.some((item) => !options.includes(item))) throw new Error(`第 ${index + 1} 条答案不在选项中`);
  } else {
    answer = resolveChoiceToken(raw.answer, options);
    if (!answer) throw new Error(`第 ${index + 1} 条缺少答案`);
    if (["single", "truefalse"].includes(type) && !options.includes(answer)) {
      throw new Error(`第 ${index + 1} 条答案不在选项中`);
    }
  }

  const confidenceValue = Number(raw.confidence);
  const confidence = Number.isFinite(confidenceValue) ? Math.max(0, Math.min(1, confidenceValue)) : 0.85;
  const typeLabels = { single: "单选题", multiple: "多选题", truefalse: "判断题", fill: "填空题" };
  const key = fingerprint(prompt);
  return {
    id: `import-${key.slice(2)}`,
    type,
    typeLabel: typeLabels[type],
    prompt,
    options: options.length ? options : undefined,
    answer,
    aliases: listFromValue(raw.aliases),
    explanation: String(raw.explanation ?? "导入题库未提供解析。").trim(),
    confidence,
    origin: "imported",
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length < 2) throw new Error("CSV 至少需要表头和一条题目");

  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

async function readQuestionBankFile(file) {
  const text = await file.text();
  if (file.name.toLowerCase().endsWith(".csv")) return parseCsv(text);
  const parsed = JSON.parse(text);
  const questions = Array.isArray(parsed) ? parsed : parsed.questions;
  if (!Array.isArray(questions)) throw new Error("JSON 应为题目数组，或包含 questions 数组");
  return questions;
}

function renderBankStatus(message = null, tone = "") {
  elements.bankTotal.textContent = String(quizQuestions.length);
  elements.bankImported.textContent = String(bankStats.imported || 0);
  elements.bankDuplicates.textContent = String(bankStats.duplicates || 0);
  elements.bankRejected.textContent = String(bankStats.rejected || 0);
  if (message !== null) elements.bankMessage.textContent = message;
  elements.bankMessage.className = `bank-message ${tone}`.trim();
  document.body.dataset.bankTotal = String(quizQuestions.length);
  document.body.dataset.bankImported = String(bankStats.imported || 0);
  document.body.dataset.bankDuplicates = String(bankStats.duplicates || 0);
  document.body.dataset.bankRejected = String(bankStats.rejected || 0);
}

function replaceQuestionBank(nextQuestions, stats, message) {
  quizQuestions = nextQuestions;
  bankStats = stats;
  saveQuestionBank();
  localStorage.removeItem(answerCacheKey);
  quizState = initialQuizState();
  localStorage.removeItem(quizStorageKey);
  seedAnswerCache();
  renderBankStatus(message, "success");
  renderAiQuestionOptions();
  resetQuestionQueue("题库已变化，请重新生成任务队列。");
  renderQuiz();
}

async function importQuestionBank(file) {
  try {
    const rawQuestions = await readQuestionBankFile(file);
    const normalized = [];
    const errors = [];
    rawQuestions.forEach((raw, index) => {
      try {
        normalized.push(normalizeImportedQuestion(raw, index));
      } catch (error) {
        errors.push(error.message);
      }
    });

    const mode = elements.bankImportMode.value;
    const base = mode === "replace" ? [] : [...quizQuestions];
    const fingerprints = new Set(base.map((question) => fingerprint(question.prompt)));
    const accepted = [];
    let duplicates = 0;
    normalized.forEach((question) => {
      const key = fingerprint(question.prompt);
      if (fingerprints.has(key)) {
        duplicates += 1;
        return;
      }
      fingerprints.add(key);
      accepted.push(question);
    });

    if (base.length + accepted.length === 0) throw new Error("没有可用题目，已保留原题库");
    const next = [...base, ...accepted];
    const stats = { imported: accepted.length, duplicates, rejected: errors.length };
    replaceQuestionBank(
      next,
      stats,
      `导入完成：新增 ${accepted.length}，重复 ${duplicates}，拒绝 ${errors.length}。${
        errors.length ? ` 首个问题：${errors[0]}` : ""
      }`,
    );
    addEvent(`题库导入完成：当前 ${next.length} 题，新增 ${accepted.length} 题`, "success");
  } catch (error) {
    renderBankStatus(`导入失败：${error.message}`, "error");
    showToast("题库导入失败，请检查文件格式");
  } finally {
    elements.bankFileInput.value = "";
  }
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadQuestionBankExample() {
  const example = {
    format: "course-speed-pass-question-bank-v1",
    note: "CSV 列名相同；options、answer、aliases 的多值使用 | 分隔。",
    questions: [
      {
        type: "single",
        prompt: "本地模拟题：2 + 2 等于多少？",
        options: ["3", "4", "5"],
        answer: "4",
        aliases: [],
        explanation: "基础加法示例。",
        confidence: 0.95,
      },
      {
        type: "multiple",
        prompt: "本地模拟题：以下哪些是偶数？",
        options: ["2", "3", "4"],
        answer: ["2", "4"],
        explanation: "2 和 4 都能被 2 整除。",
        confidence: 0.92,
      },
    ],
  };
  downloadJson("course-speed-pass-question-bank-example.json", example);
}

function exportQuestionBank() {
  downloadJson("course-speed-pass-question-bank.json", {
    format: "course-speed-pass-question-bank-v1",
    exportedAt: new Date().toISOString(),
    questions: quizQuestions.map(({ id: _id, typeLabel: _typeLabel, origin: _origin, ...question }) => question),
  });
  showToast("当前题库已导出");
}

function restoreStarterQuestionBank() {
  quizQuestions = cloneStarterBank();
  bankStats = { imported: 0, duplicates: 0, rejected: 0 };
  localStorage.removeItem(questionBankKey);
  localStorage.removeItem(questionBankStatsKey);
  localStorage.removeItem(answerCacheKey);
  quizState = initialQuizState();
  localStorage.removeItem(quizStorageKey);
  seedAnswerCache();
  renderBankStatus("已恢复 6 道内置模拟题。", "success");
  renderAiQuestionOptions();
  resetQuestionQueue("题库已恢复，请重新生成任务队列。");
  renderQuiz();
  addEvent("已恢复内置模拟题库", "automation");
}

function defaultQueueSettings() {
  return {
    profile: "balanced",
    scope: "all",
    delay: 250,
    retries: 1,
    dryRun: false,
  };
}

function normalizeQueueSettings(value) {
  const defaults = defaultQueueSettings();
  const delays = [0, 250, 600];
  const retries = [0, 1, 2];
  const scopes = ["all", "unanswered", "wrong"];
  const profiles = ["balanced", "cautious", "fast", "custom"];
  return {
    profile: profiles.includes(value?.profile) ? value.profile : defaults.profile,
    scope: scopes.includes(value?.scope) ? value.scope : defaults.scope,
    delay: delays.includes(Number(value?.delay)) ? Number(value.delay) : defaults.delay,
    retries: retries.includes(Number(value?.retries)) ? Number(value.retries) : defaults.retries,
    dryRun: Boolean(value?.dryRun),
  };
}

function loadQueueSettings() {
  try {
    return normalizeQueueSettings(JSON.parse(localStorage.getItem(queueSettingsKey)));
  } catch {
    return defaultQueueSettings();
  }
}

function saveQueueSettings() {
  localStorage.setItem(queueSettingsKey, JSON.stringify(queueSettings));
}

function initialQueueState(message = "设置会保存在当前浏览器；先生成队列，再开始运行。") {
  return {
    status: "idle",
    items: [],
    message,
    startedAt: null,
    completedAt: null,
  };
}

function queueProfiles() {
  return {
    balanced: { delay: 250, retries: 1, threshold: 0.75, reviewLowConfidence: true },
    cautious: { delay: 600, retries: 1, threshold: 0.9, reviewLowConfidence: true },
    fast: { delay: 0, retries: 2, threshold: 0.6, reviewLowConfidence: true },
  };
}

function applyQueueProfile(profile) {
  const preset = queueProfiles()[profile];
  if (!preset) return;
  queueSettings = { ...queueSettings, profile, delay: preset.delay, retries: preset.retries };
  quizState.threshold = preset.threshold;
  quizState.reviewLowConfidence = preset.reviewLowConfidence;
  saveQueueSettings();
  renderQueueConsole();
  renderQuiz();
}

function syncQueueSettingsFromControls({ markCustom = true } = {}) {
  queueSettings = normalizeQueueSettings({
    profile: markCustom ? "custom" : elements.queueProfile.value,
    scope: elements.queueScope.value,
    delay: Number(elements.queueDelay.value),
    retries: Number(elements.queueRetries.value),
    dryRun: elements.queueDryRun.checked,
  });
  saveQueueSettings();
}

function queueStatusLabel(status) {
  const labels = {
    pending: "等待",
    running: "运行",
    review: "复核",
    done: "完成",
    failed: "失败",
  };
  return labels[status] || status.toUpperCase();
}

function renderQueueConsole() {
  const total = queueState.items.length;
  const counts = queueState.items.reduce(
    (result, item) => {
      result[item.status] = (result[item.status] || 0) + 1;
      return result;
    },
    { pending: 0, running: 0, review: 0, done: 0, failed: 0 },
  );
  const finished = counts.review + counts.done + counts.failed;
  const percent = total ? Math.round((finished / total) * 100) : 0;

  elements.queueProfile.value = queueSettings.profile;
  elements.queueScope.value = queueSettings.scope;
  elements.queueDelay.value = String(queueSettings.delay);
  elements.queueRetries.value = String(queueSettings.retries);
  elements.queueDryRun.checked = queueSettings.dryRun;
  elements.queueStatus.textContent = queueState.status.toUpperCase();
  elements.queueStatus.className = `status-pill ${queueState.status}`;
  elements.queuePending.textContent = String(counts.pending);
  elements.queueRunning.textContent = String(counts.running);
  elements.queueReview.textContent = String(counts.review);
  elements.queueDone.textContent = String(counts.done);
  elements.queueFailed.textContent = String(counts.failed);
  elements.queueProgressFill.style.width = `${percent}%`;
  elements.queueProgressText.textContent = `${finished} / ${total}`;
  elements.queueMessage.textContent = queueState.message;
  elements.startQueue.textContent = queueState.status === "paused" ? "继续运行" : "开始运行";
  elements.pauseQueue.disabled = queueState.status !== "running";
  elements.stopQueue.disabled = !["running", "paused"].includes(queueState.status);

  elements.queueList.innerHTML = queueState.items
    .map((item, index) => {
      const question = quizQuestions.find((candidate) => candidate.id === item.id);
      return `<li class="${item.status}">
        <span class="queue-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="queue-title">${escapeHtml(question?.prompt || item.id)}</span>
        <span class="queue-item-status">${queueStatusLabel(item.status)}${item.attempts ? ` · ${item.attempts}` : ""}</span>
      </li>`;
    })
    .join("");

  document.body.dataset.queueState = queueState.status;
  document.body.dataset.queueTotal = String(total);
  document.body.dataset.queueFinished = String(finished);
  document.body.dataset.queueReview = String(counts.review);
  document.body.dataset.queueFailed = String(counts.failed);
}

function resetQuestionQueue(message = "队列已清空，请重新生成。") {
  window.clearTimeout(queueTimer);
  queueTimer = null;
  queueState = initialQueueState(message);
  if (elements.queueList) renderQueueConsole();
}

function questionsForQueueScope(scope) {
  if (scope === "unanswered") {
    return quizQuestions.filter((question) => {
      const answer = quizState.answers[question.id];
      return Array.isArray(answer) ? answer.length === 0 : !String(answer ?? "").trim();
    });
  }
  if (scope === "wrong") {
    return quizQuestions.filter((question) => quizState.wrongIds.includes(question.id));
  }
  return quizQuestions;
}

function buildQuestionQueue() {
  window.clearTimeout(queueTimer);
  queueTimer = null;
  syncQueueSettingsFromControls({ markCustom: false });
  const preset = queueProfiles()[queueSettings.profile];
  if (preset) {
    quizState.threshold = preset.threshold;
    quizState.reviewLowConfidence = preset.reviewLowConfidence;
  }
  const targets = questionsForQueueScope(queueSettings.scope);
  if (!queueSettings.dryRun) {
    const targetIds = new Set(targets.map((question) => question.id));
    quizState.approvedReviews = quizState.approvedReviews.filter((id) => !targetIds.has(id));
    quizState.score = null;
    quizState.correctCount = 0;
    quizState.wrongIds = [];
  }
  queueState = {
    status: targets.length ? "ready" : "idle",
    items: targets.map((question) => ({
      id: question.id,
      status: "pending",
      attempts: 0,
      message: "等待运行",
      previewDecision: null,
    })),
    message: targets.length
      ? `已生成 ${targets.length} 个本地任务；可开始、暂停或停止。`
      : "当前范围没有可运行的题目。",
    startedAt: null,
    completedAt: null,
  };
  renderQueueConsole();
  addEvent(`本地任务队列已生成：${targets.length} 项`, "automation");
}

function scheduleNextQueueItem() {
  if (queueState.status !== "running") return;
  const item = queueState.items.find((candidate) => candidate.status === "pending");
  if (!item) {
    completeQuestionQueue();
    return;
  }
  item.status = "running";
  item.message = "正在匹配本地答案";
  renderQueueConsole();
  queueTimer = window.setTimeout(() => executeQueueItem(item), queueSettings.delay);
}

function executeQueueItem(item) {
  queueTimer = null;
  if (queueState.status !== "running") {
    item.status = "pending";
    renderQueueConsole();
    return;
  }

  const question = quizQuestions.find((candidate) => candidate.id === item.id);
  item.attempts += 1;
  try {
    if (!question) throw new Error("题目已不存在");
    const decision = resolveAnswer(question, { persist: !queueSettings.dryRun });
    const hasAnswer = Array.isArray(decision.answer)
      ? decision.answer.length > 0
      : String(decision.answer ?? "").trim().length > 0;
    if (!hasAnswer) throw new Error("没有匹配到答案");

    if (queueSettings.dryRun) {
      item.previewDecision = decision;
      item.status = "done";
      item.message = `预演命中：${decision.source}`;
    } else {
      quizState.answers[question.id] = decision.answer;
      quizState.decisions[question.id] = decision;
      const needsReview = quizState.reviewLowConfidence && decision.confidence < quizState.threshold;
      item.status = needsReview ? "review" : "done";
      item.message = needsReview ? "低置信度，等待复核" : `完成：${decision.source}`;
      if (decision.cacheHit) quizState.cacheHits += 1;
    }
  } catch (error) {
    if (item.attempts <= queueSettings.retries) {
      item.status = "pending";
      item.message = `失败，准备第 ${item.attempts} 次重试：${error.message}`;
    } else {
      item.status = "failed";
      item.message = error.message;
    }
  }

  if (!queueSettings.dryRun) {
    quizState.score = null;
    quizState.correctCount = 0;
    quizState.wrongIds = [];
    renderQuiz();
  }
  renderQueueConsole();
  scheduleNextQueueItem();
}

function startQuestionQueue() {
  if (!queueState.items.length || ["complete", "stopped"].includes(queueState.status)) buildQuestionQueue();
  if (!queueState.items.length) return;
  syncQueueSettingsFromControls({ markCustom: false });
  if (!queueState.startedAt) queueState.startedAt = new Date().toISOString();
  queueState.status = "running";
  queueState.message = queueSettings.dryRun
    ? "预演运行中：只显示匹配结果，不写入答案。"
    : "队列运行中：每一步都会显示状态。";
  renderQueueConsole();
  scheduleNextQueueItem();
}

function pauseQuestionQueue() {
  if (queueState.status !== "running") return;
  window.clearTimeout(queueTimer);
  queueTimer = null;
  queueState.items.filter((item) => item.status === "running").forEach((item) => (item.status = "pending"));
  queueState.status = "paused";
  queueState.message = "队列已暂停，点击“继续运行”从下一项恢复。";
  renderQueueConsole();
}

function stopQuestionQueue() {
  if (!["running", "paused"].includes(queueState.status)) return;
  window.clearTimeout(queueTimer);
  queueTimer = null;
  queueState.items.filter((item) => item.status === "running").forEach((item) => (item.status = "pending"));
  queueState.status = "stopped";
  queueState.message = "队列已停止；重新开始会按当前范围生成新队列。";
  renderQueueConsole();
}

function completeQuestionQueue() {
  queueState.status = "complete";
  queueState.completedAt = new Date().toISOString();
  const reviewCount = queueState.items.filter((item) => item.status === "review").length;
  const failedCount = queueState.items.filter((item) => item.status === "failed").length;
  if (queueSettings.dryRun) {
    queueState.message = `预演完成：${queueState.items.length - failedCount} 项可匹配，未写入答案。`;
  } else {
    quizState.status = reviewCount ? "review" : answeredCount() ? "filled" : "idle";
    quizState.message = reviewCount
      ? `队列完成：${reviewCount} 题需要人工复核。`
      : `队列完成：已填答 ${answeredCount()} 题，可以模拟提交。`;
    renderQuiz();
    queueState.message = `队列完成：复核 ${reviewCount}，失败 ${failedCount}。`;
  }
  renderQueueConsole();
  addEvent(`本地任务队列完成：复核 ${reviewCount}，失败 ${failedCount}`, "success");
  showToast(queueSettings.dryRun ? "预演队列完成，答案未改动" : "本地任务队列完成");
}

function exportQueueSettingsFile() {
  downloadJson("course-speed-pass-runtime-settings.json", {
    format: "course-speed-pass-runtime-settings-v1",
    exportedAt: new Date().toISOString(),
    settings: queueSettings,
  });
  showToast("运行台设置已导出");
}

async function importQueueSettingsFile(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (parsed.format !== "course-speed-pass-runtime-settings-v1" || !parsed.settings) {
      throw new Error("不是受支持的运行台设置文件");
    }
    queueSettings = normalizeQueueSettings(parsed.settings);
    saveQueueSettings();
    applyQueueProfile(queueSettings.profile);
    queueState.message = "运行台设置已导入；请重新生成任务队列。";
    renderQueueConsole();
  } catch (error) {
    queueState.message = `设置导入失败：${error.message}`;
    renderQueueConsole();
  } finally {
    elements.queueSettingsFile.value = "";
  }
}

function getQueueState() {
  return {
    status: queueState.status,
    total: queueState.items.length,
    finished: queueState.items.filter((item) => ["review", "done", "failed"].includes(item.status)).length,
    review: queueState.items.filter((item) => item.status === "review").length,
    failed: queueState.items.filter((item) => item.status === "failed").length,
    dryRun: queueSettings.dryRun,
    settings: { ...queueSettings },
  };
}

function initialQuizState() {
  return {
    answers: {},
    decisions: {},
    approvedReviews: [],
    wrongIds: [],
    status: "idle",
    score: null,
    correctCount: 0,
    attempts: 0,
    cacheHits: 0,
    mode: "fill",
    threshold: 0.75,
    reviewLowConfidence: true,
    message: "题库已加载，等待运行。",
  };
}

function loadQuizState() {
  try {
    const saved = JSON.parse(localStorage.getItem(quizStorageKey));
    if (!saved || typeof saved !== "object") return initialQuizState();
    return {
      ...initialQuizState(),
      ...saved,
      answers: saved.answers || {},
      decisions: saved.decisions || {},
      approvedReviews: Array.isArray(saved.approvedReviews) ? saved.approvedReviews : [],
      wrongIds: Array.isArray(saved.wrongIds) ? saved.wrongIds : [],
      status: saved.status === "running" ? "filled" : saved.status || "idle",
    };
  } catch {
    return initialQuizState();
  }
}

function saveQuizState() {
  localStorage.setItem(quizStorageKey, JSON.stringify(quizState));
}

function fingerprint(text) {
  const normalized = text.toLowerCase().replace(/\s+/g, "").replace(/[？?。，、：:（）()]/g, "");
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `q-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function loadAnswerCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(answerCacheKey));
    return cache && typeof cache === "object" ? cache : {};
  } catch {
    return {};
  }
}

function answerCatalog() {
  const profiles = {
    q1: { answer: "专用 data-testid", confidence: 0.99 },
    q2: { answer: ["推进模拟播放", "记录事件日志", "保存验收截图"], confidence: 0.94 },
    q3: { answer: "正确", confidence: 0.97 },
    q4: { answer: "page.goto", confidence: 0.91 },
    q6: { answer: "127.0.0.1:4173", confidence: 0.88 },
  };
  return Object.fromEntries(
    quizQuestions
      .filter((question) => profiles[question.id] || question.origin === "imported")
      .map((question) => [
        fingerprint(question.prompt),
        profiles[question.id] || { answer: question.answer, confidence: question.confidence ?? 0.85 },
      ]),
  );
}

function seedAnswerCache() {
  const cache = loadAnswerCache();
  const catalog = answerCatalog();
  ["q1", "q3"].forEach((id) => {
    const question = quizQuestions.find((item) => item.id === id);
    if (!question || !catalog[fingerprint(question.prompt)]) return;
    const key = fingerprint(question.prompt);
    if (!cache[key]) cache[key] = { ...catalog[key], source: "题目指纹缓存" };
  });
  localStorage.setItem(answerCacheKey, JSON.stringify(cache));
}

function resolveAnswer(question, { persist = true } = {}) {
  const key = fingerprint(question.prompt);
  const cache = loadAnswerCache();
  if (cache[key]) return { ...cache[key], source: "题目指纹缓存", fingerprint: key, cacheHit: true };

  const catalog = answerCatalog();
  if (catalog[key]) {
    const result = {
      ...catalog[key],
      source: question.origin === "imported" ? "导入题库" : "本地题库",
      fingerprint: key,
      cacheHit: false,
    };
    if (persist) {
      cache[key] = result;
      localStorage.setItem(answerCacheKey, JSON.stringify(cache));
    }
    return result;
  }

  if (question.id === "q5" && question.prompt.includes("自定义事件")) {
    const result = {
      answer: "course-demo-complete",
      confidence: 0.68,
      source: "规则匹配",
      fingerprint: key,
      cacheHit: false,
    };
    if (persist) {
      cache[key] = result;
      localStorage.setItem(answerCacheKey, JSON.stringify(cache));
    }
    return result;
  }

  return {
    answer: "",
    confidence: 0,
    source: "未命中",
    fingerprint: key,
    cacheHit: false,
  };
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[：:。]/g, "");
}

function isAnswerCorrect(question, value) {
  if (question.type === "multiple") {
    const actual = Array.isArray(value) ? [...value].sort() : [];
    const expected = [...question.answer].sort();
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
  const accepted = [question.answer, ...(question.aliases || [])].map(normalizeText);
  return accepted.includes(normalizeText(value));
}

function answeredCount() {
  return quizQuestions.filter((question) => {
    const answer = quizState.answers[question.id];
    return Array.isArray(answer) ? answer.length > 0 : String(answer ?? "").trim().length > 0;
  }).length;
}

function pendingReviewIds() {
  if (!quizState.reviewLowConfidence) return [];
  return quizQuestions
    .filter((question) => {
      const decision = quizState.decisions[question.id];
      return decision && decision.confidence < quizState.threshold && !quizState.approvedReviews.includes(question.id);
    })
    .map((question) => question.id);
}

function collectAnswerFromCard(question) {
  const card = elements.questionList.querySelector(`[data-question-id="${question.id}"]`);
  if (!card) return;
  if (question.type === "multiple") {
    quizState.answers[question.id] = [...card.querySelectorAll("input:checked")].map((input) => input.value);
  } else if (question.type === "single" || question.type === "truefalse") {
    quizState.answers[question.id] = card.querySelector("input:checked")?.value || "";
  } else {
    quizState.answers[question.id] = card.querySelector("input[type='text']")?.value || "";
  }
  quizState.score = null;
  quizState.status = pendingReviewIds().length ? "review" : answeredCount() ? "filled" : "idle";
  quizState.message = "检测到手动修改，提交前可继续检查。";
  saveQuizState();
  renderQuiz();
}

function questionInputMarkup(question, answer) {
  if (question.type === "single" || question.type === "truefalse" || question.type === "multiple") {
    const inputType = question.type === "multiple" ? "checkbox" : "radio";
    return `<div class="question-options">${question.options
      .map((option) => {
        const checked = Array.isArray(answer) ? answer.includes(option) : answer === option;
        return `<label class="option-row"><input type="${inputType}" name="answer-${escapeHtml(question.id)}" value="${escapeHtml(option)}" ${
          checked ? "checked" : ""
        } /><span>${escapeHtml(option)}</span></label>`;
      })
      .join("")}</div>`;
  }

  return `<input class="question-input" type="text" value="${escapeHtml(answer || "")}" placeholder="在这里填写答案" aria-label="${escapeHtml(question.prompt)}" />`;
}

function renderQuiz() {
  const pending = pendingReviewIds();
  const answered = answeredCount();
  const coverage = Math.round((answered / quizQuestions.length) * 100);
  const status = quizState.status || "idle";

  elements.quizMode.value = quizState.mode;
  elements.confidenceThreshold.value = String(quizState.threshold);
  elements.reviewLowConfidence.checked = quizState.reviewLowConfidence;
  elements.quizStatus.textContent = status.toUpperCase();
  elements.quizStatus.className = `status-pill ${status}`;
  elements.quizCoverage.textContent = `${coverage}%`;
  elements.quizScore.textContent = quizState.score === null ? "--" : `${quizState.correctCount}/${quizQuestions.length} · ${quizState.score}%`;
  elements.quizReviewCount.textContent = String(pending.length);
  elements.quizCacheHits.textContent = String(quizState.cacheHits);
  elements.quizMessage.textContent = quizState.message;
  elements.approveReview.disabled = pending.length === 0;
  elements.retryWrong.disabled = quizState.wrongIds.length === 0;

  elements.questionList.innerHTML = quizQuestions
    .map((question, index) => {
      const decision = quizState.decisions[question.id];
      const answer = quizState.answers[question.id];
      const needsReview = pending.includes(question.id);
      const hasResult = quizState.score !== null;
      const correct = hasResult && isAnswerCorrect(question, answer);
      const resultClass = hasResult ? (correct ? "correct" : "incorrect") : needsReview ? "review" : "";
      const trace = decision
        ? `<div class="answer-trace"><span>${escapeHtml(decision.source)}</span><span class="confidence">置信度 ${Math.round(
            decision.confidence * 100,
          )}%</span>${needsReview ? '<strong class="review-flag">待复核</strong>' : ""}${
            decision.explanation ? `<span class="decision-note">${escapeHtml(decision.explanation)}</span>` : ""
          }</div>`
        : '<div class="answer-trace"><span>尚未匹配答案</span></div>';
      const explanation = hasResult
        ? `<p class="explanation"><strong>${correct ? "回答正确" : `正确答案：${escapeHtml(
            Array.isArray(question.answer) ? question.answer.join("、") : question.answer,
          )}`}</strong>${escapeHtml(question.explanation)}</p>`
        : "";

      return `<article class="question-card ${resultClass}" data-question-id="${escapeHtml(question.id)}">
        <div class="question-top"><span class="question-number">${String(index + 1).padStart(2, "0")}</span><span class="question-type">${
          escapeHtml(question.typeLabel)
        }</span></div>
        <h3>${escapeHtml(question.prompt)}</h3>
        ${questionInputMarkup(question, answer)}
        ${trace}
        ${explanation}
      </article>`;
    })
    .join("");

  elements.questionList.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const card = input.closest("[data-question-id]");
      const question = quizQuestions.find((item) => item.id === card.dataset.questionId);
      collectAnswerFromCard(question);
    });
  });

  document.body.dataset.quizState = status;
  document.body.dataset.quizScore = String(quizState.score ?? 0);
  document.body.dataset.quizCoverage = String(coverage);
  document.body.dataset.quizReview = String(pending.length);
  saveQuizState();
}

function runQuizAutomation({ onlyIds = null } = {}) {
  if (["running", "paused"].includes(queueState.status)) resetQuestionQueue("已切换为直接自动填答模式。");
  quizState.mode = elements.quizMode.value;
  quizState.threshold = Number(elements.confidenceThreshold.value);
  quizState.reviewLowConfidence = elements.reviewLowConfidence.checked;
  quizState.status = "running";
  quizState.score = null;
  quizState.correctCount = 0;
  quizState.wrongIds = [];
  quizState.attempts += 1;
  quizState.cacheHits = 0;
  quizState.approvedReviews = quizState.approvedReviews.filter((id) => !onlyIds || !onlyIds.includes(id));

  const targets = onlyIds ? quizQuestions.filter((question) => onlyIds.includes(question.id)) : quizQuestions;
  targets.forEach((question) => {
    const decision = resolveAnswer(question);
    quizState.answers[question.id] = decision.answer;
    quizState.decisions[question.id] = decision;
    if (decision.cacheHit) quizState.cacheHits += 1;
  });

  const pending = pendingReviewIds();
  quizState.status = pending.length ? "review" : "filled";
  quizState.message = pending.length
    ? `已填答 ${answeredCount()} 题，其中 ${pending.length} 题低于置信度阈值，请先复核。`
    : `已填答 ${answeredCount()} 题，可以模拟提交。`;
  addEvent(`答题引擎完成匹配：覆盖 ${answeredCount()}/${quizQuestions.length}，缓存命中 ${quizState.cacheHits}`, "automation");
  renderQuiz();

  if (quizState.mode === "submit" && pending.length === 0) submitQuizAnswers();
}

function approvePendingReviews() {
  const pending = pendingReviewIds();
  quizState.approvedReviews = [...new Set([...quizState.approvedReviews, ...pending])];
  quizState.status = answeredCount() ? "filled" : "idle";
  quizState.message = `已人工确认 ${pending.length} 题，可以模拟提交。`;
  addEvent(`人工复核通过：${pending.length} 题`, "success");
  renderQuiz();
  if (quizState.mode === "submit") submitQuizAnswers();
}

function submitQuizAnswers() {
  const pending = pendingReviewIds();
  if (pending.length) {
    quizState.status = "review";
    quizState.message = `仍有 ${pending.length} 题等待复核，暂不模拟提交。`;
    showToast(quizState.message);
    renderQuiz();
    return false;
  }

  const wrongIds = quizQuestions
    .filter((question) => !isAnswerCorrect(question, quizState.answers[question.id]))
    .map((question) => question.id);
  quizState.wrongIds = wrongIds;
  quizState.correctCount = quizQuestions.length - wrongIds.length;
  quizState.score = Math.round((quizState.correctCount / quizQuestions.length) * 100);
  quizState.status = "complete";
  quizState.message = wrongIds.length
    ? `模拟评分完成：${quizState.correctCount}/${quizQuestions.length}，可重试错题。`
    : `模拟评分完成：${quizState.correctCount}/${quizQuestions.length}，全部正确。`;
  addEvent(`模拟答题提交完成：${quizState.correctCount}/${quizQuestions.length}，得分 ${quizState.score}`, "success");
  showToast(quizState.message);
  renderQuiz();
  window.dispatchEvent(new CustomEvent("quiz-demo-complete", { detail: getQuizState() }));
  return true;
}

function resetQuizLab({ clearCache = false } = {}) {
  quizState = initialQuizState();
  resetQuestionQueue("答题已重置，请重新生成任务队列。");
  if (clearCache) localStorage.removeItem(answerCacheKey);
  seedAnswerCache();
  addEvent("答题实验已重置", "automation");
  renderQuiz();
}

function retryWrongAnswers() {
  if (!quizState.wrongIds.length) return;
  const targets = [...quizState.wrongIds];
  targets.forEach((id) => delete quizState.answers[id]);
  quizState.message = `正在重新匹配 ${targets.length} 道错题。`;
  runQuizAutomation({ onlyIds: targets });
}

function getQuizState() {
  const answered = answeredCount();
  return {
    status: quizState.status,
    answered,
    total: quizQuestions.length,
    coverage: Math.round((answered / quizQuestions.length) * 100),
    score: quizState.score,
    correctCount: quizState.correctCount,
    pendingReview: pendingReviewIds().length,
    cacheHits: quizState.cacheHits,
    attempts: quizState.attempts,
    mode: quizState.mode,
  };
}

function getBankState() {
  return {
    total: quizQuestions.length,
    imported: bankStats.imported || 0,
    duplicates: bankStats.duplicates || 0,
    rejected: bankStats.rejected || 0,
    fingerprints: quizQuestions.map((question) => fingerprint(question.prompt)),
  };
}

function exportQuizReport() {
  const report = {
    exportedAt: new Date().toISOString(),
    environment: "local-simulation-only",
    summary: getQuizState(),
    questions: quizQuestions.map((question) => ({
      id: question.id,
      fingerprint: fingerprint(question.prompt),
      type: question.type,
      prompt: question.prompt,
      answer: quizState.answers[question.id] ?? null,
      correct: quizState.score === null ? null : isAnswerCorrect(question, quizState.answers[question.id]),
      source: quizState.decisions[question.id]?.source || null,
      confidence: quizState.decisions[question.id]?.confidence ?? null,
    })),
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `quiz-lab-report-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("本地答题报告已导出");
}

function renderAiQuestionOptions() {
  const selected = elements.aiQuestionSelect.value;
  elements.aiQuestionSelect.innerHTML = quizQuestions
    .map(
      (question, index) =>
        `<option value="${escapeHtml(question.id)}">${String(index + 1).padStart(2, "0")} · ${escapeHtml(
          question.prompt,
        )}</option>`,
    )
    .join("");
  if (quizQuestions.some((question) => question.id === selected)) elements.aiQuestionSelect.value = selected;
}

function selectedAiQuestion() {
  return quizQuestions.find((question) => question.id === elements.aiQuestionSelect.value) || quizQuestions[0];
}

function buildAiReviewPrompt(question) {
  const options = question.options?.length
    ? question.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join("\n")
    : "无选项";
  return [
    "你正在协助检查一个完全本地、虚构的教学测试题。请独立判断，不要假设网页中的既有答案正确。",
    `题型：${question.typeLabel}`,
    `题目：${question.prompt}`,
    `选项：\n${options}`,
    "只返回一个 JSON 对象，不要使用 Markdown 代码块。格式：",
    '{"answer":"单选/判断/填空答案；多选时使用字符串数组","confidence":0到1之间的小数,"explanation":"简短依据"}',
  ].join("\n\n");
}

function generateAiReviewPrompt() {
  const question = selectedAiQuestion();
  elements.aiPromptPreview.value = buildAiReviewPrompt(question);
  elements.aiReviewMessage.textContent = "提示词已生成；复制后可手动打开官方 DeepSeek 网页。";
}

async function copyAiReviewPrompt() {
  if (!elements.aiPromptPreview.value) generateAiReviewPrompt();
  try {
    await navigator.clipboard.writeText(elements.aiPromptPreview.value);
    elements.aiReviewMessage.textContent = "提示词已复制。外部网页仍需由你手动粘贴和查询。";
    showToast("复核提示词已复制");
  } catch {
    elements.aiPromptPreview.focus();
    elements.aiPromptPreview.select();
    document.execCommand("copy");
    elements.aiReviewMessage.textContent = "提示词已选中并尝试复制。";
  }
}

function normalizeAiAnswer(question, value) {
  if (question.type === "multiple") {
    const answers = listFromValue(value).map((item) => resolveChoiceToken(item, question.options || []));
    if (!answers.length || answers.some((answer) => !(question.options || []).includes(answer))) {
      throw new Error("多选答案应为选项文字或字母数组");
    }
    return answers;
  }

  const answer = resolveChoiceToken(value, question.options || []);
  if (!answer) throw new Error("answer 不能为空");
  if (["single", "truefalse"].includes(question.type) && !(question.options || []).includes(answer)) {
    throw new Error("答案不在当前选项中");
  }
  return answer;
}

function applyAiReviewResponse() {
  try {
    const question = selectedAiQuestion();
    const parsed = JSON.parse(elements.aiResponseInput.value);
    const answer = normalizeAiAnswer(question, parsed.answer);
    const confidenceValue = Number(parsed.confidence);
    const confidence = Number.isFinite(confidenceValue) ? Math.max(0, Math.min(1, confidenceValue)) : 0.5;
    quizState.answers[question.id] = answer;
    quizState.decisions[question.id] = {
      answer,
      confidence,
      source: "DeepSeek 手动复核",
      fingerprint: fingerprint(question.prompt),
      cacheHit: false,
      explanation: String(parsed.explanation ?? "未提供说明").trim(),
    };
    quizState.approvedReviews = quizState.approvedReviews.filter((id) => id !== question.id);
    quizState.score = null;
    quizState.correctCount = 0;
    quizState.wrongIds = [];
    quizState.status = pendingReviewIds().length ? "review" : "filled";
    quizState.message = `已应用第 ${quizQuestions.indexOf(question) + 1} 题的外部复核结果，提交前请人工检查。`;
    elements.aiReviewMessage.textContent = `已应用，置信度 ${Math.round(confidence * 100)}%；结果未写入永久题库。`;
    addEvent(`已应用一条 DeepSeek 手动复核结果（置信度 ${Math.round(confidence * 100)}%）`, "automation");
    renderQuiz();
  } catch (error) {
    elements.aiReviewMessage.textContent = `无法应用：${error.message}`;
    showToast("外部结果格式不正确");
  }
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const remaining = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

function isLessonComplete(index) {
  return state.progress[index] >= lessons[index].duration;
}

function completedCount() {
  return lessons.filter((_, index) => isLessonComplete(index)).length;
}

function totalPercent() {
  const total = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  const watched = state.progress.reduce((sum, value) => sum + value, 0);
  return Math.round((watched / total) * 100);
}

function renderLessonList() {
  elements.lessonList.innerHTML = lessons
    .map((lesson, index) => {
      const percent = Math.round((state.progress[index] / lesson.duration) * 100);
      const classes = [
        "lesson-item",
        index === state.currentIndex ? "active" : "",
        isLessonComplete(index) ? "complete" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <button class="${classes}" type="button" data-lesson-index="${index}" aria-current="${
          index === state.currentIndex ? "true" : "false"
        }">
          <span class="lesson-index">${lesson.number}</span>
          <span class="lesson-name">
            <strong>${lesson.title}</strong>
            <small>${isLessonComplete(index) ? "已完成" : `${percent}% · ${formatTime(lesson.duration)}`}</small>
          </span>
          <span class="lesson-check" aria-label="${isLessonComplete(index) ? "已完成" : "未完成"}">✓</span>
          <span class="lesson-mini-progress" aria-hidden="true"><span style="width:${percent}%"></span></span>
        </button>
      `;
    })
    .join("");

  elements.lessonList.querySelectorAll("[data-lesson-index]").forEach((button) => {
    button.addEventListener("click", () => selectLesson(Number(button.dataset.lessonIndex)));
  });
}

function render() {
  const lesson = lessons[state.currentIndex];
  const progress = state.progress[state.currentIndex];
  const percent = Math.min(100, Math.round((progress / lesson.duration) * 100));
  const completed = completedCount();
  const overall = totalPercent();

  renderLessonList();
  elements.chapterNumber.textContent = lesson.number;
  elements.lessonKicker.textContent = lesson.group;
  elements.lessonTitle.textContent = lesson.title;
  elements.lessonDescription.textContent = lesson.description;
  elements.currentTime.textContent = formatTime(progress);
  elements.durationTime.textContent = formatTime(lesson.duration);
  elements.timelineFill.style.width = `${percent}%`;
  elements.timeline.setAttribute("aria-valuenow", String(percent));
  elements.playIcon.textContent = state.isPlaying ? "Ⅱ" : "▶";
  elements.playLabel.textContent = state.isPlaying ? "暂停播放" : isLessonComplete(state.currentIndex) ? "本节已完成" : "开始播放";
  elements.playingIndicator.classList.toggle("playing", state.isPlaying);
  elements.playingIndicator.querySelector("em").textContent = state.isPlaying ? "PLAYING" : "PAUSED";
  elements.speedSelect.value = String(state.speed);
  elements.autoNext.checked = state.autoNext;

  elements.progressRing.style.setProperty("--progress", `${overall * 3.6}deg`);
  elements.overallPercent.textContent = `${overall}%`;
  elements.completedSummary.textContent = `${completed} / ${lessons.length} 节`;
  elements.overviewStatus.textContent =
    completed === lessons.length ? "自动化实验已完成" : state.isPlaying ? `正在运行第 ${lesson.number} 节` : "实验进度保存在本机";

  elements.metricCompleted.textContent = String(completed);
  elements.metricCurrent.textContent = lesson.number;
  elements.metricEvents.textContent = String(state.eventCount);
  elements.metricMessage.textContent =
    completed === lessons.length ? "全部断言条件已经满足" : state.isPlaying ? `计时器以 ${state.speed}× 推进` : "系统就绪，等待操作";

  const statusText = completed === lessons.length ? "COMPLETE" : state.isPlaying ? "RUNNING" : "IDLE";
  elements.automationStatus.textContent = statusText;
  elements.automationStatus.className = `status-pill ${statusText.toLowerCase()}`;

  document.body.dataset.currentLesson = lesson.number;
  document.body.dataset.completedLessons = String(completed);
  document.body.dataset.automationState = statusText.toLowerCase();
  saveState();
}

function addEvent(message, type = "info") {
  const now = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
  const item = document.createElement("li");
  item.className = type;
  item.innerHTML = `<time>${now}</time><span class="event-dot"></span><strong>${message}</strong>`;
  elements.eventLog.prepend(item);
  state.eventCount += 1;
  elements.metricEvents.textContent = String(state.eventCount);
  saveState();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2200);
}

function startPlayback({ source = "manual" } = {}) {
  if (isLessonComplete(state.currentIndex)) {
    const nextIncomplete = lessons.findIndex((_, index) => !isLessonComplete(index));
    if (nextIncomplete === -1) {
      showToast("全部章节已经完成，可重置后再次实验");
      return;
    }
    state.currentIndex = nextIncomplete;
  }

  if (state.isPlaying) return;
  state.isPlaying = true;
  state.mode = source === "automation" ? "automation" : "manual";
  lastTick = performance.now();
  timerId = window.setInterval(tick, 80);
  addEvent(`开始播放第 ${lessons[state.currentIndex].number} 节（${state.speed}×）`, source === "automation" ? "automation" : "info");
  render();
}

function pausePlayback({ silent = false } = {}) {
  if (!state.isPlaying) return;
  state.isPlaying = false;
  window.clearInterval(timerId);
  timerId = null;
  if (!silent) addEvent(`暂停第 ${lessons[state.currentIndex].number} 节`);
  render();
}

function tick() {
  if (!state.isPlaying) return;
  const now = performance.now();
  const deltaSeconds = ((now - lastTick) / 1000) * state.speed;
  lastTick = now;

  const current = state.currentIndex;
  state.progress[current] = Math.min(lessons[current].duration, state.progress[current] + deltaSeconds);

  if (isLessonComplete(current)) {
    window.clearInterval(timerId);
    timerId = null;
    state.isPlaying = false;
    addEvent(`第 ${lessons[current].number} 节播放完成`, "success");

    if (current === lessons.length - 1) {
      state.mode = "complete";
      render();
      showToast("自动化实验完成：6 个章节全部通过");
      window.dispatchEvent(new CustomEvent("course-demo-complete"));
      return;
    }

    if (state.autoNext) {
      state.currentIndex += 1;
      addEvent(`检测到完成状态，自动切换至第 ${lessons[state.currentIndex].number} 节`, "automation");
      render();
      window.setTimeout(() => startPlayback({ source: "automation" }), 260);
      return;
    }
  }

  render();
}

function selectLesson(index) {
  if (!Number.isInteger(index) || index < 0 || index >= lessons.length) return;
  const wasPlaying = state.isPlaying;
  pausePlayback({ silent: true });
  state.currentIndex = index;
  addEvent(`手动切换至第 ${lessons[index].number} 节`);
  render();
  if (wasPlaying && !isLessonComplete(index)) startPlayback();
}

function restartCurrentLesson() {
  pausePlayback({ silent: true });
  state.progress[state.currentIndex] = 0;
  addEvent(`已重置第 ${lessons[state.currentIndex].number} 节`);
  render();
}

function resetAll({ announce = true } = {}) {
  pausePlayback({ silent: true });
  const speed = state.speed;
  const autoNext = state.autoNext;
  state = { ...initialState(), speed, autoNext };
  elements.eventLog.innerHTML = "";
  if (announce) addEvent("实验已重置，所有章节回到未完成状态", "automation");
  render();
}

function runAutomationDemo() {
  resetAll({ announce: false });
  state.autoNext = true;
  state.mode = "automation";
  addEvent("自动演示启动：从第 01 节开始", "automation");
  render();
  startPlayback({ source: "automation" });
}

elements.playButton.addEventListener("click", () => {
  if (state.isPlaying) pausePlayback();
  else startPlayback();
});

elements.restartLesson.addEventListener("click", restartCurrentLesson);

elements.speedSelect.addEventListener("change", (event) => {
  state.speed = Number(event.target.value);
  addEvent(`演示速度调整为 ${state.speed}×`);
  render();
});

elements.autoNext.addEventListener("change", (event) => {
  state.autoNext = event.target.checked;
  addEvent(`自动切换章节已${state.autoNext ? "开启" : "关闭"}`);
  render();
});

elements.runDemo.addEventListener("click", runAutomationDemo);
elements.resetDemo.addEventListener("click", () => resetAll());
elements.clearLog.addEventListener("click", () => {
  elements.eventLog.innerHTML = "";
  state.eventCount = 0;
  render();
});

elements.quizMode.addEventListener("change", (event) => {
  quizState.mode = event.target.value;
  quizState.message = quizState.mode === "submit" ? "模拟提交模式：复核通过后自动评分。" : "仅填答模式：需要手动点击模拟提交。";
  renderQuiz();
});

elements.confidenceThreshold.addEventListener("change", (event) => {
  quizState.threshold = Number(event.target.value);
  quizState.status = pendingReviewIds().length ? "review" : answeredCount() ? "filled" : "idle";
  quizState.message = `复核阈值已调整为 ${Math.round(quizState.threshold * 100)}%。`;
  renderQuiz();
});

elements.reviewLowConfidence.addEventListener("change", (event) => {
  quizState.reviewLowConfidence = event.target.checked;
  quizState.status = pendingReviewIds().length ? "review" : answeredCount() ? "filled" : "idle";
  quizState.message = quizState.reviewLowConfidence ? "低置信度复核已开启。" : "低置信度复核已关闭，仍建议人工检查。";
  renderQuiz();
});

elements.runQuiz.addEventListener("click", () => runQuizAutomation());
elements.approveReview.addEventListener("click", approvePendingReviews);
elements.submitQuiz.addEventListener("click", submitQuizAnswers);
elements.retryWrong.addEventListener("click", retryWrongAnswers);
elements.resetQuiz.addEventListener("click", () => resetQuizLab());
elements.exportQuizReport.addEventListener("click", exportQuizReport);
elements.importBank.addEventListener("click", () => elements.bankFileInput.click());
elements.bankFileInput.addEventListener("change", () => {
  const [file] = elements.bankFileInput.files;
  if (file) importQuestionBank(file);
});
elements.downloadBankExample.addEventListener("click", downloadQuestionBankExample);
elements.exportBank.addEventListener("click", exportQuestionBank);
elements.restoreStarterBank.addEventListener("click", restoreStarterQuestionBank);
elements.queueProfile.addEventListener("change", (event) => {
  if (event.target.value === "custom") {
    syncQueueSettingsFromControls({ markCustom: false });
    renderQueueConsole();
  } else {
    applyQueueProfile(event.target.value);
  }
});
[elements.queueScope, elements.queueDelay, elements.queueRetries, elements.queueDryRun].forEach((control) => {
  control.addEventListener("change", () => {
    syncQueueSettingsFromControls();
    queueState.message = "设置已保存；重新生成队列后生效。";
    renderQueueConsole();
  });
});
elements.buildQueue.addEventListener("click", buildQuestionQueue);
elements.startQueue.addEventListener("click", startQuestionQueue);
elements.pauseQueue.addEventListener("click", pauseQuestionQueue);
elements.stopQueue.addEventListener("click", stopQuestionQueue);
elements.exportQueueSettings.addEventListener("click", exportQueueSettingsFile);
elements.importQueueSettings.addEventListener("click", () => elements.queueSettingsFile.click());
elements.queueSettingsFile.addEventListener("change", () => {
  const [file] = elements.queueSettingsFile.files;
  if (file) importQueueSettingsFile(file);
});
elements.generateAiPrompt.addEventListener("click", generateAiReviewPrompt);
elements.copyAiPrompt.addEventListener("click", copyAiReviewPrompt);
elements.applyAiResponse.addEventListener("click", applyAiReviewResponse);
elements.aiQuestionSelect.addEventListener("change", () => {
  elements.aiPromptPreview.value = "";
  elements.aiResponseInput.value = "";
  elements.aiReviewMessage.textContent = "题目已切换，请重新生成复核提示词。";
});

window.courseDemo = {
  getState: () => ({
    ...state,
    completed: completedCount(),
    totalPercent: totalPercent(),
  }),
  reset: () => resetAll(),
  start: () => startPlayback({ source: "automation" }),
  pause: () => pausePlayback(),
  run: () => runAutomationDemo(),
  selectLesson,
  setSpeed: (speed) => {
    const allowed = [1, 2, 4, 8];
    if (!allowed.includes(Number(speed))) throw new Error("速度只能是 1、2、4 或 8");
    state.speed = Number(speed);
    render();
  },
  quiz: {
    getState: getQuizState,
    getBankState,
    getQueueState,
    run: () => runQuizAutomation(),
    approveReview: approvePendingReviews,
    submit: submitQuizAnswers,
    reset: () => resetQuizLab(),
    exportReport: exportQuizReport,
    restoreStarterBank: restoreStarterQuestionBank,
    buildQueue: buildQuestionQueue,
    startQueue: startQuestionQueue,
    pauseQueue: pauseQuestionQueue,
    stopQueue: stopQuestionQueue,
    applyAiResponse: (questionId, response) => {
      elements.aiQuestionSelect.value = questionId;
      elements.aiResponseInput.value = JSON.stringify(response);
      applyAiReviewResponse();
    },
  },
};

const questionListObserver = new MutationObserver(() => {
  elements.queueDomCount.textContent = String(elements.questionList.children.length);
  document.body.dataset.detectedQuestionCards = String(elements.questionList.children.length);
});
questionListObserver.observe(elements.questionList, { childList: true });

seedAnswerCache();
addEvent("本地模拟课程加载完成");
render();
renderBankStatus();
renderAiQuestionOptions();
renderQuiz();
renderQueueConsole();
