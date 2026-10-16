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

const storageKey = "zhixing-course-demo-v1";

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
};

addEvent("本地模拟课程加载完成");
render();
