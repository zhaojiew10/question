const DATA_URL = "./data/questions/ai-llm-inference.json";
const STORAGE_KEY = "zhiku-progress-v1";

const state = {
  questions: [],
  currentIndex: 0,
  records: {},
};

const $ = (id) => document.getElementById(id);
const elements = {
  loading: $("loadingCard"),
  card: $("questionCard"),
  error: $("errorCard"),
  nav: $("questionNav"),
  tags: $("knowledgeTags"),
  questionTags: $("questionTags"),
  number: $("questionNumber"),
  type: $("questionType"),
  difficulty: $("difficulty"),
  stem: $("questionStem"),
  options: $("optionsList"),
  explanation: $("explanation"),
  explanationResult: $("explanationResult"),
  explanationText: $("explanationText"),
  previous: $("previousButton"),
  primary: $("primaryButton"),
  hint: $("answerHint"),
};

function loadRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return records && typeof records === "object" ? records : {};
  } catch {
    return {};
  }
}

function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  } catch {
    // The quiz remains usable when browser storage is unavailable.
  }
}

function currentQuestion() {
  return state.questions[state.currentIndex];
}

function currentRecord() {
  return state.records[currentQuestion().id] || {};
}

function submittedRecords() {
  return state.questions
    .map((question) => state.records[question.id])
    .filter((record) => record?.submitted);
}

function createSvgIcon(path) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathElement.setAttribute("d", path);
  svg.append(pathElement);
  return svg;
}

function renderNavigation() {
  elements.nav.replaceChildren();
  state.questions.forEach((question, index) => {
    const record = state.records[question.id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "question-nav-button";
    button.textContent = String(index + 1).padStart(2, "0");
    button.title = `第 ${index + 1} 题：${question.stem}`;
    button.setAttribute("aria-label", `前往第 ${index + 1} 题`);
    if (index === state.currentIndex) {
      button.classList.add("current");
      button.setAttribute("aria-current", "true");
    } else if (record?.submitted) {
      button.classList.add(record.correct ? "correct" : "wrong");
    }
    button.addEventListener("click", () => showQuestion(index));
    elements.nav.append(button);
  });
}

function renderKnowledgeTags() {
  const counts = new Map();
  state.questions.forEach((question) => {
    question.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  const preferred = ["KV Cache", "Decode", "Continuous Batching", "PagedAttention", "GQA", "显存管理", "性能优化"];
  const tags = preferred.filter((tag) => counts.has(tag));
  elements.tags.replaceChildren();
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag;
    elements.tags.append(span);
  });
}

function renderOptions(question, record) {
  elements.options.replaceChildren();
  question.options.forEach((option) => {
    const selected = record.selected === option.key;
    const isAnswer = question.answer.includes(option.key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.disabled = Boolean(record.submitted);
    button.setAttribute("aria-pressed", String(selected));

    if (record.submitted) {
      if (isAnswer) button.classList.add("correct");
      else if (selected) button.classList.add("wrong");
      else button.classList.add("unrevealed");
    } else if (selected) {
      button.classList.add("selected");
    }

    const key = document.createElement("span");
    key.className = "option-key";
    key.textContent = option.key;
    const text = document.createElement("span");
    text.className = "option-text";
    text.textContent = option.text;
    const status = document.createElement("span");
    status.className = "option-state";

    if (record.submitted && isAnswer) {
      status.append(createSvgIcon("m5 12 4 4L19 6"));
    } else if (record.submitted && selected) {
      status.append(createSvgIcon("m7 7 10 10M17 7 7 17"));
    }

    button.append(key, text, status);
    button.addEventListener("click", () => selectOption(option.key));
    elements.options.append(button);
  });
}

function renderExplanation(question, record) {
  elements.explanation.hidden = !record.submitted;
  if (!record.submitted) return;
  const answer = question.answer.join("、");
  elements.explanation.classList.toggle("incorrect", !record.correct);
  elements.explanationResult.textContent = record.correct
    ? `回答正确 · 正确答案 ${answer}`
    : `回答错误 · 正确答案 ${answer}`;
  elements.explanationText.textContent = question.explanation;
}

function updatePrimaryButton(record) {
  const label = elements.primary.querySelector("span");
  if (!record.submitted) {
    label.textContent = "确认答案";
    elements.primary.disabled = !record.selected;
    elements.hint.textContent = record.selected ? `已选择 ${record.selected}，请确认答案` : "选择答案后确认";
  } else {
    label.textContent = state.currentIndex === state.questions.length - 1 ? "回到第一题" : "下一题";
    elements.primary.disabled = false;
    elements.hint.textContent = "本题结果已保存到本地";
  }
}

function renderQuestion() {
  const question = currentQuestion();
  const record = currentRecord();
  elements.number.textContent = `QUESTION ${String(state.currentIndex + 1).padStart(2, "0")}`;
  elements.type.textContent = question.type === "single" ? "单选题" : "多选题";
  elements.difficulty.textContent = { easy: "简单", medium: "中等", hard: "困难" }[question.difficulty] || "未分级";
  elements.stem.textContent = question.stem;
  elements.questionTags.replaceChildren();
  question.knowledgePoints.slice(0, 3).forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag;
    elements.questionTags.append(span);
  });
  elements.previous.disabled = state.currentIndex === 0;
  renderOptions(question, record);
  renderExplanation(question, record);
  updatePrimaryButton(record);
  renderNavigation();
}

function updateStats() {
  const total = state.questions.length;
  const submitted = submittedRecords();
  const correct = submitted.filter((record) => record.correct).length;
  const progress = total ? (submitted.length / total) * 100 : 0;
  $("sidebarTotal").textContent = total;
  $("sidebarProgressText").textContent = `${submitted.length} / ${total}`;
  $("sidebarProgressBar").style.width = `${progress}%`;
  $("answeredCount").textContent = `${submitted.length} 已答`;
  $("totalStat").textContent = total;
  $("completedStat").textContent = submitted.length;
  $("accuracyStat").textContent = submitted.length ? `${Math.round((correct / submitted.length) * 100)}%` : "—";
}

function showQuestion(index) {
  state.currentIndex = Math.max(0, Math.min(index, state.questions.length - 1));
  renderQuestion();
  if (window.innerWidth <= 760) {
    elements.card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function selectOption(key) {
  const question = currentQuestion();
  const record = currentRecord();
  if (record.submitted) return;
  state.records[question.id] = { selected: key, submitted: false };
  saveRecords();
  renderOptions(question, state.records[question.id]);
  updatePrimaryButton(state.records[question.id]);
}

function handlePrimaryAction() {
  const question = currentQuestion();
  const record = currentRecord();
  if (!record.submitted) {
    if (!record.selected) return;
    state.records[question.id] = {
      selected: record.selected,
      submitted: true,
      correct: question.answer.length === 1 && question.answer[0] === record.selected,
    };
    saveRecords();
    renderQuestion();
    updateStats();
    elements.explanation.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    showQuestion((state.currentIndex + 1) % state.questions.length);
  }
}

function resetProgress() {
  if (Object.keys(state.records).length && !window.confirm("确定要清除所有答题记录并重新开始吗？")) return;
  state.records = {};
  localStorage.removeItem(STORAGE_KEY);
  state.currentIndex = 0;
  renderQuestion();
  updateStats();
}

async function initialize() {
  state.records = loadRecords();
  elements.previous.addEventListener("click", () => showQuestion(state.currentIndex - 1));
  elements.primary.addEventListener("click", handlePrimaryAction);
  $("resetButton").addEventListener("click", resetProgress);

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const questions = await response.json();
    if (!Array.isArray(questions) || questions.length === 0) throw new Error("题库为空或格式不正确");
    state.questions = questions;
    elements.loading.hidden = true;
    elements.card.hidden = false;
    renderKnowledgeTags();
    renderQuestion();
    updateStats();
  } catch (error) {
    elements.loading.hidden = true;
    elements.error.hidden = false;
    $("errorMessage").textContent = `无法读取题库数据（${error.message}）。请通过本地 HTTP 服务打开页面。`;
  }
}

initialize();
