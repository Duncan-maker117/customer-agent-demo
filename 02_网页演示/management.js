/** Browser-only management interactions. No platform login, secrets, or network. */
const INITIAL_KEYWORDS = [
  "转人工",
  "人工客服",
  "真人",
  "客服",
  "人工",
  "工单",
  "好评",
  "取消订单",
  "改地址",
  "转售后客服",
  "转售后",
  "返现",
  "过敏",
  "退款",
  "没有效果",
  "骗人",
  "投诉",
  "纠纷",
  "开发票",
  "开票",
  "烂",
  "取消",
  "备注",
];
const INITIAL_ACCOUNTS = [
  {
    id: "DEMO-001",
    shop: "轻氧生活（演示店铺）",
    name: "示例客服 01",
    status: "未验证",
    running: false,
  },
];
const DEFAULT_SETTINGS = {
  provider: "OpenAI-compatible",
  prompt:
    "1. 根据店铺知识回复客户问题。\n2. 信息不足时明确说明，并建议人工核实。\n3. 不编造商品、物流、退款或赔偿承诺。\n4. 当前网页仅展示配置，回复由本地规则生成。",
  start: "08:00",
  end: "23:00",
};

export function initManagement({ element, icon, notify, onActivity }) {
  const $ = (selector) => document.querySelector(selector);
  let accounts = structuredClone(INITIAL_ACCOUNTS);
  let keywords = [...INITIAL_KEYWORDS];
  let settings = { ...DEFAULT_SETTINGS };
  let editingAccount = null;
  let editingKeyword = null;
  let currentView = "auto-reply";
  let confirmCallback = null;

  function button(
    text,
    iconName,
    action,
    primary = false,
    accessibleName = text,
  ) {
    const node = element(
      "button",
      `button ${primary ? "button-primary" : "button-secondary"}`,
    );
    node.type = "button";
    node.setAttribute("aria-label", accessibleName);
    if (iconName) node.append(icon(iconName));
    node.append(document.createTextNode(text));
    node.addEventListener("click", action);
    return node;
  }
  function confirm(title, text, callback) {
    $("#confirm-title").textContent = title;
    $("#confirm-text").textContent = text;
    confirmCallback = callback;
    $("#confirm-dialog").showModal();
  }
  $("#confirm-action").addEventListener("click", () => {
    const callback = confirmCallback;
    confirmCallback = null;
    $("#confirm-dialog").close();
    callback?.();
  });
  $("#confirm-dialog").addEventListener("close", () => {
    confirmCallback = null;
  });

  function updateCounts() {
    if (currentView === "auto-reply" || currentView === "accounts")
      $("#page-description").textContent = `共 ${accounts.length} 个账号`;
    if (currentView === "keywords")
      $("#page-description").textContent = `共 ${keywords.length} 个关键词`;
    $("#running-stats").textContent =
      `运行中: ${accounts.filter((item) => item.running).length} 个（模拟）`;
  }
  function setAccountState(account, status, running = account.running) {
    account.status = status;
    account.running = running;
    onActivity(
      `账号状态：${status}`,
      `${account.name}；仅本地模拟，未连接平台。`,
    );
    renderAccounts();
    renderAuto();
    notify(`已模拟${status === "在线" ? "上线" : "离线"}，未连接真实店铺。`);
  }
  function accountCard(account, forAuto) {
    const card = element("article", "account-card");
    card.dataset.accountId = account.id;
    const logo = element("div", "account-logo", "演示店铺");
    const info = element("div", "account-info");
    const title = element("div", "account-title");
    title.append(
      element("h2", "", account.shop),
      element("span", "platform-badge", "拼多多 · 模拟"),
    );
    const id = element("p", "", "店铺 ID：");
    id.append(element("span", "", account.id));
    const name = element("p", "", "账号：");
    name.append(element("span", "", account.name));
    info.append(title, id, name);
    const actions = element("div", "account-actions");
    actions.append(
      element(
        "span",
        `status-badge${account.status === "在线" ? " online" : ""}`,
        `${account.status}（模拟）${account.running ? " · 回复运行中" : ""}`,
      ),
    );
    const buttons = element("div", "account-buttons");
    if (forAuto) {
      buttons.append(
        button(
          "上线",
          "play",
          () => setAccountState(account, "在线"),
          false,
          `上线 ${account.name}`,
        ),
      );
      buttons.append(
        button(
          "离线",
          "pause",
          () => setAccountState(account, "离线", false),
          false,
          `离线 ${account.name}`,
        ),
      );
      buttons.append(
        button(
          account.running ? "停止回复" : "开始回复",
          account.running ? "stop" : "messages",
          () => {
            account.running = !account.running;
            if (account.running) account.status = "在线";
            onActivity(
              account.running ? "开始模拟回复" : "停止模拟回复",
              `${account.name}；没有平台连接或自动发送。`,
            );
            renderAuto();
            renderAccounts();
            notify(
              account.running
                ? "已模拟启动。点击客服对话演示可提问。"
                : "已停止模拟回复。",
            );
          },
          true,
          `${account.running ? "停止回复" : "开始回复"} ${account.name}`,
        ),
      );
    } else {
      buttons.append(
        button(
          "验证",
          "refresh",
          () => {
            if (account.status === "未验证") account.status = "离线";
            onActivity(
              "检查演示账号",
              `${account.name}：示例字段完整；未验证真实登录。`,
            );
            renderAccounts();
            renderAuto();
            notify("示例字段完整；未验证真实平台登录。");
          },
          false,
          `验证 ${account.name}`,
        ),
      );
      buttons.append(
        button(
          "编辑",
          "edit",
          () => openAccountEditor(account),
          false,
          `编辑 ${account.name}`,
        ),
      );
      buttons.append(
        button(
          "删除",
          "trash",
          () =>
            confirm(
              "删除演示账号？",
              `将从当前页面移除“${account.name}”，刷新后可恢复初始示例。`,
              () => {
                accounts = accounts.filter((item) => item.id !== account.id);
                onActivity("删除演示账号", account.name);
                renderAccounts();
                renderAuto();
              },
            ),
          false,
          `删除 ${account.name}`,
        ),
      );
    }
    actions.append(buttons);
    card.append(logo, info, actions);
    return card;
  }
  function renderAuto() {
    $("#auto-account-list").replaceChildren(
      ...accounts.map((item) => accountCard(item, true)),
    );
    $("#auto-empty").hidden = accounts.length > 0;
    $("#start-all").disabled = !accounts.length;
    $("#stop-all").disabled = !accounts.some((item) => item.running);
    updateCounts();
  }
  function renderAccounts() {
    $("#managed-account-list").replaceChildren(
      ...accounts.map((item) => accountCard(item, false)),
    );
    $("#accounts-empty").hidden = accounts.length > 0;
    updateCounts();
  }
  function openAccountEditor(account = null) {
    editingAccount = account?.id || null;
    $("#account-dialog-title").textContent = account
      ? "编辑演示账号"
      : "添加演示账号";
    $("#account-shop").value = account?.shop || "";
    $("#account-name").value = account?.name || "";
    $("#account-error").hidden = true;
    $("#account-dialog").showModal();
  }
  $("#add-account").addEventListener("click", () => openAccountEditor());
  $("#account-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const shop = $("#account-shop").value.trim();
    const name = $("#account-name").value.trim();
    if (
      !shop ||
      !name ||
      accounts.some(
        (item) =>
          item.id !== editingAccount &&
          item.shop === shop &&
          item.name === name,
      )
    ) {
      $("#account-error").textContent = "请填写店铺与昵称，并避免重复账号。";
      $("#account-error").hidden = false;
      return;
    }
    const previous = accounts.find((item) => item.id === editingAccount);
    if (previous) {
      previous.shop = shop;
      previous.name = name;
    } else
      accounts.push({
        id: `DEMO-${crypto.randomUUID().slice(0, 8)}`,
        shop,
        name,
        status: "未验证",
        running: false,
      });
    onActivity(
      previous ? "编辑演示账号" : "添加演示账号",
      `${shop} / ${name}；未发起平台登录。`,
    );
    $("#account-dialog").close();
    renderAccounts();
    renderAuto();
    notify("已保存虚构账号，仅当前页面生效。");
  });
  $("#refresh-auto").addEventListener("click", () => {
    renderAuto();
    notify("已刷新本地演示状态。");
  });
  $("#refresh-accounts").addEventListener("click", () => {
    renderAccounts();
    notify("已刷新本地演示账号。");
  });
  $("#start-all").addEventListener("click", () => {
    accounts.forEach((item) => {
      item.running = true;
      item.status = "在线";
    });
    onActivity(
      "开始所有模拟回复",
      `${accounts.length} 个示例账号切换为运行中，未连接平台。`,
    );
    renderAuto();
    renderAccounts();
    notify(`已启动 ${accounts.length} 个演示账号（模拟）。`);
  });
  $("#stop-all").addEventListener("click", () => {
    accounts.forEach((item) => {
      item.running = false;
    });
    onActivity("停止所有模拟回复", "所有示例账号停止本地运行状态。");
    renderAuto();
    renderAccounts();
    notify("所有演示账号已停止。");
  });

  function renderKeywords() {
    $("#keyword-list").replaceChildren(
      ...keywords.map((word) => {
        const row = element("tr");
        const cell = element("td", "", word);
        const actionCell = element("td");
        const actions = element("div", "row-actions");
        actions.append(
          button(
            "编辑",
            "edit",
            () => openKeywordEditor(word),
            false,
            `编辑关键词 ${word}`,
          ),
        );
        actions.append(
          button(
            "删除",
            "trash",
            () =>
              confirm("删除关键词？", `将从当前页面移除“${word}”。`, () => {
                keywords = keywords.filter((item) => item !== word);
                onActivity("删除关键词", word);
                renderKeywords();
              }),
            false,
            `删除关键词 ${word}`,
          ),
        );
        actionCell.append(actions);
        row.append(cell, actionCell);
        return row;
      }),
    );
    updateCounts();
  }
  function openKeywordEditor(word = null) {
    editingKeyword = word;
    $("#keyword-dialog-title").textContent = word ? "编辑关键词" : "添加关键词";
    $("#keyword-input").value = word || "";
    $("#keyword-error").hidden = true;
    $("#keyword-dialog").showModal();
  }
  $("#add-keyword").addEventListener("click", () => openKeywordEditor());
  $("#keyword-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const word = $("#keyword-input").value.trim();
    if (
      !word ||
      (word !== editingKeyword && keywords.includes(word)) ||
      (!editingKeyword && keywords.length >= 200)
    ) {
      $("#keyword-error").textContent =
        "关键词不能为空或重复，最多保留 200 个。";
      $("#keyword-error").hidden = false;
      return;
    }
    if (editingKeyword) keywords[keywords.indexOf(editingKeyword)] = word;
    else keywords.push(word);
    onActivity(editingKeyword ? "编辑关键词" : "添加关键词", word);
    $("#keyword-dialog").close();
    renderKeywords();
    notify("关键词已保存，仅当前页面生效。");
  });
  $("#import-keywords").addEventListener("click", () => {
    $("#import-input").value = "";
    $("#import-error").hidden = true;
    $("#import-dialog").showModal();
  });
  $("#import-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const words = [
      ...new Set(
        $("#import-input")
          .value.split(/[,，、\n]+/)
          .map((word) => word.trim())
          .filter(Boolean),
      ),
    ];
    const additions = words.filter((word) => !keywords.includes(word));
    if (
      !words.length ||
      words.some((word) => word.length > 40) ||
      additions.length + keywords.length > 200
    ) {
      $("#import-error").textContent =
        "每个关键词最多 40 字，导入后总数不得超过 200。";
      $("#import-error").hidden = false;
      return;
    }
    keywords.push(...additions);
    onActivity(
      "批量导入关键词",
      `新增 ${additions.length} 个，跳过 ${words.length - additions.length} 个重复项。`,
    );
    $("#import-dialog").close();
    renderKeywords();
    notify(`已新增 ${additions.length} 个关键词。`);
  });

  function renderSettings() {
    $("#setting-provider").value = settings.provider;
    $("#setting-prompt").value = settings.prompt;
    $("#setting-start").value = settings.start;
    $("#setting-end").value = settings.end;
    $("#settings-error").hidden = true;
    $("#settings-saved").hidden = true;
  }
  $("#save-settings").addEventListener("click", () => {
    const start = $("#setting-start").value;
    const end = $("#setting-end").value;
    const prompt = $("#setting-prompt").value.trim();
    if (!start || !end || start === end || !prompt) {
      $("#settings-error").textContent =
        "请填写有效且不同的开始/结束时间，以及非空行为指令。";
      $("#settings-error").hidden = false;
      $("#settings-saved").hidden = true;
      return;
    }
    settings = { provider: $("#setting-provider").value, prompt, start, end };
    $("#settings-error").hidden = true;
    $("#settings-saved").hidden = false;
    onActivity(
      "保存演示设置",
      `供应商：${settings.provider}；业务时间 ${start}—${end}；未调用模型。`,
    );
    notify("设置已保存至当前页面，未连接模型服务。");
  });
  $("#reset-settings").addEventListener("click", () => {
    settings = { ...DEFAULT_SETTINGS };
    renderSettings();
    onActivity("重置演示设置", "恢复初始设置；没有网络或数据库操作。");
    notify("已恢复默认演示设置。");
  });
  $("#restore-provider").addEventListener("click", () => {
    $("#setting-provider").value = DEFAULT_SETTINGS.provider;
    notify("已恢复演示供应商默认选项。");
  });

  return {
    render(view) {
      currentView = view;
      if (view === "auto-reply") renderAuto();
      if (view === "accounts") renderAccounts();
      if (view === "keywords") renderKeywords();
      if (view === "settings") renderSettings();
    },
    reset() {
      accounts = structuredClone(INITIAL_ACCOUNTS);
      keywords = [...INITIAL_KEYWORDS];
      settings = { ...DEFAULT_SETTINGS };
      confirmCallback = null;
      renderSettings();
      renderAuto();
      renderAccounts();
      renderKeywords();
    },
    snapshot() {
      return {
        accounts: structuredClone(accounts),
        keywords: [...keywords],
        settings: { ...settings },
      };
    },
    confirm,
  };
}
