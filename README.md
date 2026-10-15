# 拼多多 AI 客服系统

基于 PyQt6 的 Windows 电商客服桌面应用，集成拼多多消息接入、AI Agent、商品与客服知识库以及人工接管能力。项目以拼多多为当前平台渠道，模型服务和店铺账号需按实际部署环境配置。

本项目基于 [JC0v0/Customer-Agent](https://github.com/JC0v0/Customer-Agent) 进行修改，保留上游 Git 历史。当前改动包括应用信息、项目入口和本地对话验证页。

## 下载安装

> 当前仓库提供源码启动方式，尚未发布独立安装包。

如需使用桌面应用，请按下文安装依赖并启动。项目中现有上游打包产物不代表当前修改版已完成发布验证。

## 功能特性

- **拼多多消息接入**：使用 WebSocket 接收客服消息，支持断线重连和心跳检测
- **AI 智能回复**：通过 Agent 会话和工具调用处理客户问题；使用前需配置模型服务和店铺账号
- **商品主动推荐**：获取商品列表并向客户发送商品卡片
- **双知识库体系**：商品知识与客服知识分开管理，覆盖商品属性、售后、物流和退款政策
- **商品知识同步**：从平台同步商品资料，并支持调用多模态模型提取商品知识
- **关键词转人工**：根据客服关键词规则触发人工接管
- **异步消息处理**：使用消息队列和处理器链组织消息处理
- **本地对话验证**：使用独立标注的虚构资料检查知识检索、回复依据、未命中处理和人工升级建议；此模式不连接平台，也不发送消息

### AI Agent 可用工具

| 工具名称 | 功能描述 |
|----------|----------|
| `get_shop_products` | 获取店铺商品列表并按条件筛选 |
| `send_goods_link` | 向客户发送商品卡片 |
| `get_product_knowledge` | 查询商品属性、规格、用法和价格等知识 |
| `search_customer_service_knowledge` | 搜索售后、物流和退款等客服知识 |
| `transfer_conversation` | 将会话转接给人工客服 |

## 环境要求

- Python >= 3.11
- Windows 操作系统
- `uv` 包管理器
- 拼多多客服账号和受支持的模型服务（仅实时业务功能需要）

## 安装

```bash
uv sync
```

## 启动

```bash
uv run python app.py
```

启动后可在“客服对话演示”页面使用预设问题检查本地检索流程。要测试真实模型生成，请先完成下方模型配置。

## 配置

首次运行后会生成本地 `config.json`。在“设置 → LLM 模型配置”中选择服务商、填写模型标识和 API Key。API Key 使用 Windows DPAPI 保护后保存在本机配置中。

应用通过 LiteLLM 直接调用 Chat Completions，不需要单独启动 LiteLLM Proxy。当前支持的供应商包括：

| 设置页供应商 | LiteLLM 路由前缀 | 默认 Base URL |
| --- | --- | --- |
| DeepSeek | `deepseek/` | `https://api.deepseek.com` |
| 火山引擎 | `volcengine/` | `https://ark.cn-beijing.volces.com/api/v3` |
| OpenAI-compatible | `openai/` | 需填写兼容端点 |
| Kimi/Moonshot | `moonshot/` | `https://api.moonshot.cn/v1` |
| 智谱/Z.AI | `zai/` | `https://open.bigmodel.cn/api/paas/v4` |
| Qwen/DashScope | `dashscope/` | `https://dashscope.aliyuncs.com/compatible-mode/v1` |

远程模型端点必须使用 HTTPS 并进行证书校验。本地或私有端点（如本机 Ollama、LM Studio）需在设置页明确允许后使用。未知模型能力或自定义端点启用工具前，需要按设置页提示确认能力与工具策略。

本地对话验证页使用当前模型配置生成回复时会关闭工具调用，不会触发拼多多发送、转接或订单查询。若没有配置 API Key，该页使用固定知识资料执行离线匹配，并明确显示当前模式；离线回复不是 LLM 生成。

商品知识同步会将必要的商品文本和图片发送给所选模型服务商。请根据实际业务评估服务商的数据处理、留存和跨境传输规则。不要把 API Key、Cookie 或真实客户对话提交到代码仓库。

## 开发规范

### 新增或修改平台接口前

1. 先核实真实请求参数、请求头和响应结构。
2. 根据实际响应实现解析逻辑，不凭猜测补字段。
3. 使用隔离的模拟数据或测试账号验证解析结果。

## 构建 Windows 安装包

在 Windows 环境运行：

```bash
python scripts/build_win_exe.py --clean
```

构建脚本会使用 PyInstaller 打包应用；是否生成安装程序取决于本机是否安装 Inno Setup。发布前应在干净环境验证安装、模型配置和账号登录流程。

### CI 自动构建

仓库中的 GitHub Actions 工作流会按已配置的 tag 规则执行构建。推送发布 tag 前，应先确认工作流配置、版本号和发布内容。

## 项目结构

```text
Customer-Agent/
├── Agent/                  # Agent 会话、模型客户端与工具
├── Channel/                # 渠道集成，当前包括拼多多
├── Message/                # 消息队列、路由和处理器
├── bridge/                 # 消息上下文、回复和发送桥接
├── core/                   # 依赖注入和连接状态
├── database/               # SQLAlchemy 模型、SQLite 与知识服务
├── demo/                   # 本地对话验证说明和界面截图
├── scripts/                # 构建和辅助脚本
├── service/                # 账号、关键词和对话服务
├── ui/                     # PyQt6 桌面界面
├── utils/                  # 日志、配置、路径与安全工具
└── app.py                  # 应用入口
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 桌面界面 | PyQt6 + pyqt6-fluent-widgets |
| Agent 与模型 | 自研 Agent + LiteLLM |
| 数据库 | SQLAlchemy + SQLite |
| 中文检索 | jieba |
| 异步消息 | asyncio + websockets |
| 文档解析 | pypdf + python-docx + openpyxl + xlrd |
| 日志 | Loguru |
| 配置 | Pydantic |

## License

上游 README 声明 MIT；当前仓库快照没有独立 `LICENSE` 文件。公开发布前应核对授权范围并补齐许可文本及版权声明。
