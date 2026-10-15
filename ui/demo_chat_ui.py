"""Interview demo page for a synthetic ecommerce support conversation."""

from PyQt6.QtCore import QThread, pyqtSignal, Qt
from PyQt6.QtWidgets import (
    QCheckBox,
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QPlainTextEdit,
    QPushButton,
    QSplitter,
    QVBoxLayout,
    QWidget,
)

from qfluentwidgets import BodyLabel, CaptionLabel, SubtitleLabel

from service.demo_conversation import DEMO_SHOP_NAME, run_demo_message


SAMPLE_QUESTIONS = (
    "这件T恤是什么面料？",
    "下单后几天能发货？",
    "衣服穿过一次还能退吗？",
    "我要投诉，转人工客服。",
    "你们店里有蓝牙耳机吗？",
)


class DemoWorker(QThread):
    completed = pyqtSignal(object, object)

    def __init__(self, query: str, use_model: bool, parent=None):
        super().__init__(parent)
        self.query = query
        self.use_model = use_model

    def run(self):
        try:
            self.completed.emit(run_demo_message(self.query, use_configured_model=self.use_model), None)
        except Exception as exc:
            self.completed.emit(None, exc)


class DemoChatUI(QWidget):
    """A local, non-sending customer conversation demo."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.worker = None
        self.setObjectName("demo-chat")
        self._build_ui()

    def _build_ui(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(32, 24, 32, 24)
        root.setSpacing(14)

        title = SubtitleLabel("客服对话演示", self)
        root.addWidget(title)
        root.addWidget(BodyLabel(f"当前店铺：{DEMO_SHOP_NAME}", self))

        notice = QLabel(
            "本页使用虚构资料。回复会调用已配置的模型（如有），否则使用离线知识匹配；不会连接拼多多或发送真实消息。",
            self,
        )
        notice.setWordWrap(True)
        notice.setStyleSheet(
            "QLabel { background: #fff4ce; color: #5c4300; padding: 10px 14px; border-radius: 6px; }"
        )
        root.addWidget(notice)

        examples = QFrame(self)
        examples_layout = QVBoxLayout(examples)
        examples_layout.setContentsMargins(0, 4, 0, 4)
        examples_layout.addWidget(CaptionLabel("点击示例问题，现场展示不同处理结果", self))
        question_row = QHBoxLayout()
        for question in SAMPLE_QUESTIONS:
            button = QPushButton(question, self)
            button.setCursor(Qt.CursorShape.PointingHandCursor)
            button.clicked.connect(lambda checked=False, value=question: self._submit_question(value))
            question_row.addWidget(button)
        examples_layout.addLayout(question_row)
        root.addWidget(examples)

        splitter = QSplitter(Qt.Orientation.Horizontal, self)
        self.conversation = QPlainTextEdit(self)
        self.conversation.setReadOnly(True)
        self.conversation.setPlaceholderText("客户问题和客服回复会显示在这里。先点一个示例，或在下方输入问题。")
        self.conversation.setStyleSheet("QPlainTextEdit { font-size: 15px; padding: 10px; }")
        splitter.addWidget(self.conversation)

        evidence_panel = QWidget(self)
        evidence_layout = QVBoxLayout(evidence_panel)
        evidence_layout.setContentsMargins(12, 0, 0, 0)
        evidence_layout.addWidget(BodyLabel("本轮处理信息", self))
        self.mode_label = QLabel("等待客户提问", self)
        self.mode_label.setWordWrap(True)
        self.mode_label.setStyleSheet("font-weight: 600; color: #176b45;")
        evidence_layout.addWidget(self.mode_label)
        self.evidence = QPlainTextEdit(self)
        self.evidence.setReadOnly(True)
        self.evidence.setPlaceholderText("检索到的商品或客服知识会显示在这里。")
        evidence_layout.addWidget(self.evidence, 1)
        self.handoff_label = QLabel("未触发人工升级", self)
        self.handoff_label.setWordWrap(True)
        evidence_layout.addWidget(self.handoff_label)
        splitter.addWidget(evidence_panel)
        splitter.setSizes([720, 400])
        root.addWidget(splitter, 1)

        composer = QHBoxLayout()
        self.input = QLineEdit(self)
        self.input.setPlaceholderText("输入客户问题，例如：这件衣服什么时候发货？")
        self.input.returnPressed.connect(self._send_current)
        composer.addWidget(self.input, 1)
        self.use_model = QCheckBox("使用已配置模型", self)
        self.use_model.setChecked(True)
        composer.addWidget(self.use_model)
        self.send_button = QPushButton("处理问题", self)
        self.send_button.setDefault(True)
        self.send_button.clicked.connect(self._send_current)
        composer.addWidget(self.send_button)
        root.addLayout(composer)

    def _send_current(self):
        self._submit_question(self.input.text())

    def _submit_question(self, query: str):
        query = (query or "").strip()
        if not query or (self.worker is not None and self.worker.isRunning()):
            return
        self.input.clear()
        self.conversation.appendPlainText(f"客户：{query}\n客服：正在检索知识并生成回复…\n")
        self.send_button.setEnabled(False)
        self.mode_label.setText("正在处理：知识检索 → 回复生成")
        self.evidence.clear()
        self.handoff_label.setText("处理中…")

        self.worker = DemoWorker(query, self.use_model.isChecked(), self)
        self.worker.completed.connect(lambda result, error, q=query: self._on_completed(q, result, error))
        self.worker.start()

    def _on_completed(self, query, result, error):
        self.send_button.setEnabled(True)
        if error is not None:
            self.conversation.appendPlainText(
                f"系统：处理失败（{type(error).__name__}）。请检查模型设置，或关闭“使用已配置模型”后重试。\n"
            )
            self.mode_label.setText("处理失败；未生成客服回复")
            self.evidence.setPlainText("本次失败不会自动降级成模板答案，避免把模型故障伪装成成功。")
            self.handoff_label.setText("请修正设置后重试，或转人工处理。")
            return

        self.conversation.appendPlainText(f"客服：{result.answer}\n")
        self.mode_label.setText(result.mode)
        if result.evidence:
            details = []
            for item in result.evidence:
                details.append(f"[{item.category}] {item.title}\n{item.content}")
            self.evidence.setPlainText("\n\n".join(details))
        else:
            self.evidence.setPlainText("没有检索到匹配资料；系统按缺少证据的方式处理，没有编造商品信息。")
        if result.handoff_recommended:
            self.handoff_label.setText("建议人工接管（本页面只演示，不会真的发起转接）。")
        elif result.evidence:
            self.handoff_label.setText("已找到可引用的演示知识。")
        else:
            self.handoff_label.setText("未找到可靠知识，建议人工核实。")


__all__ = ["DemoChatUI"]
