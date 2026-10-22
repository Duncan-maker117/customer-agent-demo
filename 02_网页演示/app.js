import { INITIAL_KNOWLEDGE, SCENARIOS, createReply } from "./engine.js";
import { initManagement } from "./management.js";

const ICONS = {
  back: '<path d="m12 5-7 7 7 7M5 12h15"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  edit: '<path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5"/>',
  users:
    '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/>',
  document:
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6"/>',
  history: '<path d="M3 11a9 9 0 1 1 2.6 7M3 4v7h7M12 7v5l3 2"/>',
  settings:
    '<path d="m9 3-1 3-3 1v3l-2 2 2 2v3l3 1 1 3h6l1-3 3-1v-3l2-2-2-2V7l-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
  play: '<path d="m7 3 14 9-14 9V3Z"/>',
  pause: '<path d="M7 4v16M17 4v16"/>',
  stop: '<path d="M7 4a8 8 0 1 1-3 10M3 4v5h5M9 10h6v6H9z"/>',
  import: '<path d="M3 8V5h7l2 3h9v12H3V8Zm9 2v7m-3-3 3 3 3-3"/>',
  save: '<path d="M4 3h13l4 4v14H3V3h1Zm3 0v6h10V3M7 21v-8h10v8"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  messages:
    '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.4 8.4 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 3H20v19H6.5A2.5 2.5 0 0 1 4 19.5v-14A2.5 2.5 0 0 1 6.5 3Z"/><path d="M8 7h8M8 11h6"/>',
  activity:
    '<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M9 13l3 3L22 6M8 7h6M8 11h2"/>',
  sparkles:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4M18 4h4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  refresh:
    '<path d="M20 7a9 9 0 0 0-15-1L2 9m0-6v6h6M4 17a9 9 0 0 0 15 1l3-3m0 6v-6h-6"/>',
  shirt: '<path d="m16 3 6 4-3 5-3-2v11H8V10l-3 2-3-5 6-4a4 4 0 0 0 8 0Z"/>',
  truck:
    '<path d="M1 3h14v14H1zM15 8h4l3 4v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  headphones:
    '<path d="M3 14v-3a9 9 0 0 1 18 0v3M21 16v2a3 3 0 0 1-3 3h-3"/><rect x="2" y="11" width="4" height="7" rx="2"/><rect x="18" y="11" width="4" height="7" rx="2"/>',
  store:
    '<path d="M3 10v10h18V10M2 10l2-7h16l2 7M2 10a3 3 0 0 0 5 2 3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 5-2M9 20v-6h6v6"/>',
  shield:
    '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
  "arrow-up": '<path d="M12 19V5m-6 6 6-6 6 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const icon = (name) => {
  const span = document.createElement("span");
  span.dataset.icon = name;
  span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
  return span;
};
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
$$("[data-icon]").forEach((node) =>
  node.replaceChildren(...icon(node.dataset.icon).childNodes),
);

let knowledge = structuredClone(INITIAL_KNOWLEDGE);
let sessions = makeSessions();
let activeScenario = SCENARIOS[0].id;
let activities = [];
let activeCategory = "商品知识";
let editingId = null;
let busy = false;
let processingScenario = null;
let epoch = 0;
let toastTimer;
let selectedEvidence = null;
let management;

function makeSessions() {
  return Object.fromEntries(
    SCENARIOS.map((scenario) => [
      scenario.id,
      { messages: [], mode: "auto", previousEvidence: [] },
    ]),
  );
}
const session = () => sessions[activeScenario];
const timeLabel = (timestamp) =>
  new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
function notify(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("#toast").hidden = true;
  }, 2600);
}
function addActivity(title, detail, type = "activity", scope = activeScenario) {
  activities.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    title,
    detail,
    type,
    scenario: scope,
  });
  $("#activity-dot").hidden = false;
  if (location.hash === "#activity") renderActivity();
}

function renderScenarios() {
  $("#scenario-list").replaceChildren(
    ...SCENARIOS.map((scenario) => {
      const button = element(
        "button",
        `scenario-item${scenario.id === activeScenario ? " active" : ""}`,
      );
      button.type = "button";
      button.setAttribute(
        "aria-pressed",
        String(scenario.id === activeScenario),
      );
      button.setAttribute(
        "aria-label",
        `${scenario.title}：${scenario.subtitle}`,
      );
      const avatar = element("span", `scenario-avatar ${scenario.id}`);
      avatar.append(icon(scenario.icon));
      const copy = element("span", "scenario-copy");
      copy.append(
        element("strong", "", scenario.title),
        element("small", "", scenario.subtitle),
        element("span", "scenario-chip", scenario.tag),
      );
      button.append(avatar, copy);
      button.addEventListener("click", () => {
        activeScenario = scenario.id;
        selectedEvidence = null;
        $("#evidence-panel").classList.remove("mobile-open");
        $("#evidence-toggle").setAttribute("aria-expanded", "false");
        renderChat();
      });
      return button;
    }),
  );
}

function messageNode(message) {
  if (message.role === "system")
    return element("div", "message system", message.text);
  const row = element(
    "div",
    `message ${message.role}${message.loading ? " loading-message" : ""}`,
  );
  const avatar = element("div", "message-avatar");
  avatar.append(icon(message.role === "user" ? "user" : "sparkles"));
  const body = element("div", "message-body");
  const meta = element("div", "message-meta");
  meta.append(
    element("strong", "", message.role === "user" ? "模拟客户" : "客服助手"),
    element("time", "", timeLabel(message.timestamp)),
  );
  body.append(meta, element("div", "message-bubble", message.text));
  if (message.result && !message.loading) {
    const label = message.result.evidence.length
      ? `引用 ${message.result.evidence.length} 条知识 · 查看依据`
      : message.result.handoff
        ? "人工协同 · 查看处理方式"
        : "未匹配知识 · 查看处理方式";
    const button = element("button", "message-evidence");
    button.type = "button";
    button.append(
      icon(message.result.evidence.length ? "book" : "info"),
      document.createTextNode(label),
    );
    button.addEventListener("click", () => {
      selectedEvidence = message.result;
      renderEvidence();
      if (matchMedia("(max-width: 900px)").matches) {
        $("#evidence-panel").classList.add("mobile-open");
        $("#evidence-toggle").setAttribute("aria-expanded", "true");
      }
    });
    body.append(button);
  }
  row.append(avatar, body);
  return row;
}

function renderMessages() {
  const scenario = SCENARIOS.find((item) => item.id === activeScenario);
  const greeting = {
    role: "assistant",
    text: scenario.greeting,
    timestamp: Date.now(),
  };
  const children = [
    element("div", "conversation-date", "当前体验 · 示例资料"),
    messageNode(greeting),
  ];
  if (!session().messages.length) {
    const guide = element("div", "starter-guide");
    const tag = element("span");
    tag.append(
      icon("shield"),
      document.createTextNode("浏览器内运行，无需配置 API"),
    );
    guide.append(tag);
    children.push(guide);
  }
  children.push(...session().messages.map(messageNode));
  if (busy && processingScenario === activeScenario)
    children.push(
      messageNode({
        role: "assistant",
        text: "正在匹配本地知识…",
        timestamp: Date.now(),
        loading: true,
      }),
    );
  $("#messages").replaceChildren(...children);
  $("#messages").scrollTop = $("#messages").scrollHeight;
}

function renderHandoff() {
  const mode = session().mode;
  $("#handoff-bar").hidden = mode === "auto";
  $("#handoff-text").textContent =
    mode === "pending"
      ? "等待人工确认（模拟），自动回复已暂停。"
      : "人工接管中（模拟），机器人保持暂停。";
  $("#accept-handoff").hidden = mode !== "pending";
  $("#conversation-status").textContent =
    mode === "auto"
      ? "自动回复体验"
      : mode === "pending"
        ? "等待人工 · 已暂停自动回复"
        : "人工接管 · 已暂停自动回复";
}

function renderChat() {
  renderScenarios();
  const scenario = SCENARIOS.find((item) => item.id === activeScenario);
  $("#chat-title").textContent = `轻氧生活 · ${scenario.title}`;
  $("#message-input").placeholder =
    `输入你的问题，例如：${scenario.prompts[0]}`;
  $("#quick-prompts").replaceChildren(
    ...scenario.prompts.map((prompt) => {
      const button = element("button", "prompt-button", prompt);
      button.type = "button";
      button.disabled = busy;
      button.addEventListener("click", () => submitQuestion(prompt));
      return button;
    }),
  );
  renderMessages();
  renderHandoff();
  renderEvidence();
  $("#send-button").disabled = busy;
  $("#message-input").disabled = busy;
}

function renderEvidence() {
  const lastReply = [...session().messages]
    .reverse()
    .find((message) => message.result);
  const result = selectedEvidence || lastReply?.result;
  const container = $("#evidence-content");
  $("#evidence-count").textContent = String(result?.evidence.length || 0);
  if (!result) {
    const empty = element("div", "evidence-empty");
    empty.append(
      icon("search"),
      element("p", "", "回复的依据，也可以看见。"),
      element(
        "small",
        "",
        "发送一个问题，这里会展示命中的知识条目与处理方式。",
      ),
    );
    container.replaceChildren(empty);
    return;
  }
  const summary = result.handoff
    ? "人工协同建议 · 未发起真实转接"
    : result.kind === "grounded"
      ? `命中 ${result.evidence.length} 条知识 · 本地规则匹配`
      : result.kind === "boundary"
        ? "已提示功能边界 · 未读取其他资料"
        : "没有可靠依据 · 建议人工核实";
  const children = [
    element(
      "div",
      `evidence-result${result.kind !== "grounded" ? " warning" : ""}`,
      summary,
    ),
  ];
  if (!result.evidence.length)
    children.push(
      element(
        "p",
        "subtle-label",
        "当前回复没有引用知识条目。系统不会据此编造商品、订单或售后承诺。",
      ),
    );
  for (const item of result.evidence) {
    const block = element("article", "evidence-item");
    block.append(
      element("span", "subtle-label", `${item.category} · 示例资料`),
      element("h4", "", item.title),
      element("p", "", item.content),
    );
    children.push(block);
  }
  container.replaceChildren(...children);
}

async function submitQuestion(raw) {
  const query = String(raw || "").trim();
  if (busy) return;
  if (!query) {
    $("#message-input").focus();
    notify("先输入一个问题，或选择上方示例。");
    return;
  }
  if (query.length > 500) {
    notify("问题请控制在 500 个字符以内。");
    return;
  }
  const target = session();
  const scenarioId = activeScenario;
  const runEpoch = epoch;
  target.messages.push({ role: "user", text: query, timestamp: Date.now() });
  $("#message-input").value = "";
  $("#input-counter").textContent = "0 / 500";
  selectedEvidence = null;
  addActivity("收到客户问题", query, "messages");
  if (target.mode !== "auto") {
    target.messages.push({
      role: "system",
      text: "自动回复已暂停。此处仅模拟人工流程，没有真人客服在线。",
      timestamp: Date.now(),
    });
    addActivity("保持人工处理状态", "未生成或发送自动回复。", "user");
    renderChat();
    return;
  }
  busy = true;
  processingScenario = scenarioId;
  renderChat();
  await new Promise((resolve) =>
    setTimeout(
      resolve,
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 320,
    ),
  );
  if (runEpoch !== epoch) return;
  try {
    const result = createReply(query, knowledge, target.previousEvidence);
    target.messages.push({
      role: "assistant",
      text: result.answer,
      result,
      timestamp: Date.now(),
    });
    target.previousEvidence = result.evidence.map((item) => item.id);
    if (result.handoff) target.mode = "pending";
    activities.unshift({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      title: result.handoff
        ? "建议人工协同"
        : result.kind === "grounded"
          ? "完成本地知识匹配"
          : "返回边界说明",
      detail: result.evidence.length
        ? result.evidence.map((item) => item.title).join("、")
        : result.answer,
      type: result.handoff ? "user" : "book",
      scenario: scenarioId,
      level: ["unknown", "boundary"].includes(result.kind) ? "WARN" : "INFO",
    });
  } catch {
    target.messages.push({
      role: "system",
      text: "本次处理未完成，请重新输入问题或重置体验。",
      timestamp: Date.now(),
    });
    notify("处理未完成，请重试。");
  } finally {
    if (runEpoch === epoch) {
      busy = false;
      processingScenario = null;
      renderChat();
      renderActivity();
    }
  }
}

function renderKnowledge() {
  const search = $("#knowledge-search").value.trim().toLowerCase();
  const filtered = knowledge.filter(
    (item) =>
      (activeCategory === "all" || item.category === activeCategory) &&
      `${item.title} ${item.content} ${item.triggers.join(" ")}`
        .toLowerCase()
        .includes(search),
  );
  $("#knowledge-total").textContent = String(knowledge.length);
  $("#add-knowledge").textContent =
    activeCategory === "商品知识" ? "添加产品知识" : "添加客服知识";
  $("#knowledge-empty").hidden = filtered.length > 0;
  $("#knowledge-list").replaceChildren(
    ...filtered.map((item) => {
      const row = element("tr", "knowledge-row");
      const title = element("td", "", item.title);
      const body = element("td", "knowledge-content", item.content);
      const tags = element("td");
      tags.append(
        element("span", "tag", item.category),
        ...item.triggers
          .slice(0, 3)
          .map((word) => element("span", "tag", word)),
      );
      const enabled = element("td", "enabled-state", "已启用");
      const action = element("td");
      const buttons = element("div", "row-actions");
      const edit = element("button", "button button-secondary", "编辑");
      edit.type = "button";
      edit.setAttribute("aria-label", `编辑 ${item.title}`);
      edit.addEventListener("click", () => openKnowledgeEditor(item));
      const remove = element("button", "text-button", "删除");
      remove.type = "button";
      remove.setAttribute("aria-label", `删除知识 ${item.title}`);
      remove.addEventListener("click", () =>
        management.confirm(
          "删除知识？",
          `将从当前页面移除“${item.title}”，已产生的回复仍保留原引用快照。`,
          () => {
            knowledge = knowledge.filter((entry) => entry.id !== item.id);
            addActivity("删除示例知识", item.title, "book", null);
            renderKnowledge();
          },
        ),
      );
      buttons.append(edit, remove);
      action.append(buttons);
      row.append(title, body, tags, enabled, action);
      return row;
    }),
  );
}

function openKnowledgeEditor(item = null) {
  editingId = item?.id || null;
  $("#knowledge-dialog-title").textContent = item
    ? "编辑示例知识"
    : "新增示例知识";
  $("#edit-title").value = item?.title || "";
  $("#edit-category").value = item?.category || activeCategory;
  $("#edit-triggers").value = item?.triggers.join("，") || "";
  $("#edit-content").value = item?.content || "";
  $("#knowledge-form-error").hidden = true;
  $("#knowledge-dialog").showModal();
}

function renderActivity() {
  $("#export-activity").disabled = !activities.length;
  const search = $("#log-search").value.trim().toLowerCase();
  const level = $("#log-level").value;
  const filtered = activities.filter(
    (item) =>
      (level === "all" || (item.level || "INFO") === level) &&
      `${item.title} ${item.detail}`.toLowerCase().includes(search),
  );
  $("#log-count").textContent =
    `本次体验共 ${activities.length} 条日志，当前显示 ${filtered.length} 条；刷新后清空。`;
  $("#activity-list").replaceChildren(
    ...filtered.map((item) => {
      const row = element("tr", "activity-row");
      const scenarioName =
        SCENARIOS.find((scenario) => scenario.id === item.scenario)?.title ||
        "管理操作";
      const severity = item.level || "INFO";
      row.append(
        element("td", "", timeLabel(item.timestamp)),
        element(
          "td",
          severity === "WARN" ? "level-warn" : "level-info",
          severity,
        ),
        element("td", "", scenarioName),
        element("td", "", `${item.title}：${item.detail}`),
      );
      return row;
    }),
  );
}

const VIEW_COPY = {
  "auto-reply": ["自动回复", "自动回复管理", "共 1 个账号"],
  conversations: [
    "客服对话演示",
    "客服对话演示",
    "使用示例资料体验知识检索、离线回复与人工协同",
  ],
  keywords: ["关键词管理", "关键词管理", "共 23 个关键词"],
  accounts: ["账号管理", "账号管理", "共 1 个账号"],
  knowledge: ["知识库", "知识库", ""],
  activity: ["日志管理", "日志管理", "查看当前页面的本地模拟操作日志"],
  settings: ["设置", "系统设置", "配置 AI 客服的基本参数和工作时间"],
};
function showView() {
  const requested = location.hash.slice(1);
  const view = Object.hasOwn(VIEW_COPY, requested) ? requested : "auto-reply";
  $$(".view").forEach((node) => {
    const active = node.id === `view-${view}`;
    node.classList.toggle("active", active);
    node.hidden = !active;
  });
  $$(".nav-item").forEach((node) => {
    const active = node.dataset.view === view;
    node.classList.toggle("active", active);
    if (active) node.setAttribute("aria-current", "page");
    else node.removeAttribute("aria-current");
  });
  const [title, heading, description] = VIEW_COPY[view];
  $("#page-heading").hidden = view === "knowledge";
  $("#running-stats").hidden = view !== "auto-reply";
  $$("[data-for-view]").forEach((node) => {
    node.hidden = node.dataset.forView !== view;
  });
  $("#page-title").textContent = heading;
  $("#page-description").textContent = description;
  if (view === "knowledge") renderKnowledge();
  if (view === "activity") {
    renderActivity();
    $("#activity-dot").hidden = true;
  }
  if (view === "conversations") renderChat();
  management.render(view);
  document.body.classList.remove("mobile-nav-open");
  $("#nav-backdrop").hidden = true;
  $("#nav-toggle").setAttribute(
    "aria-expanded",
    String(
      !matchMedia("(max-width: 800px)").matches &&
        !document.body.classList.contains("nav-collapsed"),
    ),
  );
}

$("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitQuestion($("#message-input").value);
});
$("#message-input").addEventListener("input", (event) => {
  $("#input-counter").textContent = `${event.target.value.length} / 500`;
});
$("#message-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    submitQuestion(event.target.value);
  }
});
$("#about-button").addEventListener("click", () =>
  $("#about-dialog").showModal(),
);
$$("[data-close-dialog]").forEach((button) =>
  button.addEventListener("click", () => button.closest("dialog").close()),
);
$("#evidence-toggle").addEventListener("click", () => {
  const open = $("#evidence-panel").classList.toggle("mobile-open");
  $("#evidence-toggle").setAttribute("aria-expanded", String(open));
});
$("#accept-handoff").addEventListener("click", () => {
  if (session().mode !== "pending") return;
  session().mode = "human";
  session().messages.push({
    role: "system",
    text: "模拟人工已接管，自动回复保持暂停。可以继续发送问题验证停答，或点击“恢复自动回复”。",
    timestamp: Date.now(),
  });
  addActivity("模拟人工接管", "会话归属切换为人工，自动回复保持暂停。", "user");
  renderChat();
});
$("#resume-auto").addEventListener("click", () => {
  session().mode = "auto";
  session().messages.push({
    role: "system",
    text: "已恢复本地规则自动回复。",
    timestamp: Date.now(),
  });
  addActivity("恢复自动回复", "后续问题重新执行本地知识匹配。", "refresh");
  renderChat();
});
$("#knowledge-search").addEventListener("input", renderKnowledge);
$$("[data-category]").forEach((button) =>
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    $$("[data-category]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderKnowledge();
  }),
);
$("#add-knowledge").addEventListener("click", () => openKnowledgeEditor());
$("#knowledge-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("#edit-title").value.trim();
  const content = $("#edit-content").value.trim();
  const triggers = [
    ...new Set(
      $("#edit-triggers")
        .value.split(/[,，、\n]+/)
        .map((word) => word.trim())
        .filter(Boolean),
    ),
  ];
  if (
    !title ||
    !content ||
    !triggers.length ||
    triggers.some((word) => word.length > 30) ||
    triggers.length > 25
  ) {
    $("#knowledge-form-error").textContent =
      "请填写标题、内容与 1—25 个关键词，每个关键词不超过 30 字。";
    $("#knowledge-form-error").hidden = false;
    return;
  }
  const item = {
    id: editingId || `custom-${crypto.randomUUID()}`,
    title,
    category: $("#edit-category").value,
    content,
    triggers,
  };
  const index = knowledge.findIndex((entry) => entry.id === editingId);
  if (index >= 0) knowledge[index] = item;
  else knowledge.push(item);
  activeCategory = item.category;
  $$("[data-category]").forEach((button) => {
    const active = button.dataset.category === activeCategory;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  addActivity(
    index >= 0 ? "更新示例知识" : "新增示例知识",
    `${title}；仅当前页面生效。`,
    "book",
    null,
  );
  $("#knowledge-dialog").close();
  renderKnowledge();
  notify("知识已保存，回到客服对话演示提问即可使用。");
});
$("#export-activity").addEventListener("click", () => {
  const exportData = {
    product: "Duncan 的 AI 客服系统",
    mode: "static-rule-demo",
    notice: "虚构资料的本地交互记录，未调用模型或真实平台。",
    exportedAt: new Date().toISOString(),
    activities,
    conversations: sessions,
    management: management.snapshot(),
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json;charset=utf-8",
    }),
  );
  const link = element("a");
  link.href = url;
  link.download = "客服工作台-体验记录.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("当前体验记录已导出。");
});
$("#reset-button").addEventListener("click", () =>
  $("#reset-dialog").showModal(),
);
$("#confirm-reset").addEventListener("click", () => {
  epoch++;
  busy = false;
  processingScenario = null;
  knowledge = structuredClone(INITIAL_KNOWLEDGE);
  sessions = makeSessions();
  activities = [];
  activeScenario = SCENARIOS[0].id;
  selectedEvidence = null;
  activeCategory = "商品知识";
  $("#message-input").value = "";
  $("#input-counter").textContent = "0 / 500";
  $("#knowledge-search").value = "";
  $$("[data-category]").forEach((button) => {
    const active = button.dataset.category === "商品知识";
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#log-search").value = "";
  $("#log-level").value = "all";
  management.reset();
  $("#activity-dot").hidden = true;
  $("#evidence-panel").classList.remove("mobile-open");
  $("#evidence-toggle").setAttribute("aria-expanded", "false");
  $("#reset-dialog").close();
  location.hash = "auto-reply";
  showView();
  notify("已恢复初始体验。");
});
window.addEventListener("hashchange", showView);
window.addEventListener("resize", () =>
  requestAnimationFrame(() => {
    $("#messages").scrollTop = $("#messages").scrollHeight;
  }),
);
$("#nav-toggle").addEventListener("click", () => {
  if (matchMedia("(max-width: 800px)").matches) {
    const open = document.body.classList.toggle("mobile-nav-open");
    $("#nav-backdrop").hidden = !open;
    $("#nav-toggle").setAttribute("aria-expanded", String(open));
  } else {
    const collapsed = document.body.classList.toggle("nav-collapsed");
    $("#nav-toggle").setAttribute("aria-expanded", String(!collapsed));
  }
});
$("#nav-backdrop").addEventListener("click", () => {
  document.body.classList.remove("mobile-nav-open");
  $("#nav-backdrop").hidden = true;
  $("#nav-toggle").setAttribute("aria-expanded", "false");
});
$$(".nav-item[data-view]").forEach((link) =>
  link.addEventListener("click", () => {
    document.body.classList.remove("mobile-nav-open");
    $("#nav-backdrop").hidden = true;
    if (matchMedia("(max-width: 800px)").matches)
      $("#nav-toggle").setAttribute("aria-expanded", "false");
  }),
);
$("#back-button").addEventListener("click", () => {
  location.hash = "auto-reply";
});
$("#log-search").addEventListener("input", renderActivity);
$("#log-level").addEventListener("change", renderActivity);
$("#clear-activity").addEventListener("click", () =>
  management.confirm(
    "清空本次日志？",
    "只清空当前页面的操作日志，不清空会话、知识或账号。",
    () => {
      activities = [];
      renderActivity();
      $("#activity-dot").hidden = true;
      notify("本次日志已清空。");
    },
  ),
);
$("#export-knowledge").addEventListener("click", () => {
  const data = {
    mode: "static-demo-knowledge",
    notice: "虚构店铺的示例知识",
    items: knowledge.filter((item) => item.category === activeCategory),
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8",
    }),
  );
  const link = element("a");
  link.href = url;
  link.download = "客服系统-示例知识.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
management = initManagement({
  element,
  icon,
  notify,
  onActivity: (title, detail) => addActivity(title, detail, "activity", null),
});
showView();
renderActivity();
