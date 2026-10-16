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

const quizQuestions = [
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
let quizState = loadQuizState();
let timerId = null;
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
  questionList: document.querySelector("#question-list"),
  retryWrong: document.querySelector("#retry-wrong"),
  resetQuiz: document.querySelector("#reset-quiz"),
  exportQuizReport: document.querySelector("#export-quiz-report"),
  quizMessage: document.querySelector("#quiz-message"),
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
      .filter((question) => profiles[question.id])
      .map((question) => [fingerprint(question.prompt), profiles[question.id]]),
  );
}

function seedAnswerCache() {
  const cache = loadAnswerCache();
  const catalog = answerCatalog();
  ["q1", "q3"].forEach((id) => {
    const question = quizQuestions.find((item) => item.id === id);
    const key = fingerprint(question.prompt);
    if (!cache[key]) cache[key] = { ...catalog[key], source: "题目指纹缓存" };
  });
  localStorage.setItem(answerCacheKey, JSON.stringify(cache));
}

function resolveAnswer(question) {
  const key = fingerprint(question.prompt);
  const cache = loadAnswerCache();
  if (cache[key]) return { ...cache[key], source: "题目指纹缓存", fingerprint: key, cacheHit: true };

  const catalog = answerCatalog();
  if (catalog[key]) {
    const result = { ...catalog[key], source: "本地题库", fingerprint: key, cacheHit: false };
    cache[key] = result;
    localStorage.setItem(answerCacheKey, JSON.stringify(cache));
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
    cache[key] = result;
    localStorage.setItem(answerCacheKey, JSON.stringify(cache));
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
        return `<label class="option-row"><input type="${inputType}" name="answer-${question.id}" value="${option}" ${
          checked ? "checked" : ""
        } /><span>${option}</span></label>`;
      })
      .join("")}</div>`;
  }

  return `<input class="question-input" type="text" value="${answer || ""}" placeholder="在这里填写答案" aria-label="${question.prompt}" />`;
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
        ? `<div class="answer-trace"><span>${decision.source}</span><span class="confidence">置信度 ${Math.round(
            decision.confidence * 100,
          )}%</span>${needsReview ? '<strong class="review-flag">待复核</strong>' : ""}</div>`
        : '<div class="answer-trace"><span>尚未匹配答案</span></div>';
      const explanation = hasResult
        ? `<p class="explanation"><strong>${correct ? "回答正确" : `正确答案：${
            Array.isArray(question.answer) ? question.answer.join("、") : question.answer
          }`}</strong>${question.explanation}</p>`
        : "";

      return `<article class="question-card ${resultClass}" data-question-id="${question.id}">
        <div class="question-top"><span class="question-number">${String(index + 1).padStart(2, "0")}</span><span class="question-type">${
          question.typeLabel
        }</span></div>
        <h3>${question.prompt}</h3>
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
    run: () => runQuizAutomation(),
    approveReview: approvePendingReviews,
    submit: submitQuizAnswers,
    reset: () => resetQuizLab(),
    exportReport: exportQuizReport,
  },
};

seedAnswerCache();
addEvent("本地模拟课程加载完成");
render();
renderQuiz();
