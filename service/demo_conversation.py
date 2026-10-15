"""Self-contained demo conversation using fictional shop data.

The demo never calls Pinduoduo tools or sends messages. When an LLM profile is
configured it uses the shared LLM transport with tools disabled; otherwise it
returns a clearly labeled, evidence-grounded local response.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass


@dataclass(frozen=True)
class DemoKnowledge:
    title: str
    content: str
    category: str
    triggers: tuple[str, ...]


@dataclass(frozen=True)
class DemoReply:
    answer: str
    mode: str
    evidence: tuple[DemoKnowledge, ...]
    handoff_recommended: bool = False


DEMO_SHOP_NAME = "Duncan 演示小店（虚构数据）"

KNOWLEDGE = (
    DemoKnowledge(
        title="轻氧棉T恤 · 商品资料",
        content="面料为 95% 精梳棉、5% 氨纶；可机洗，建议与深色衣物分开洗涤。",
        category="商品知识",
        triggers=("面料", "材质", "成分", "棉", "清洗", "洗", "t恤"),
    ),
    DemoKnowledge(
        title="发货时效 · 店铺规则",
        content="工作日下单后通常 48 小时内发出；节假日或活动期间可能延迟，具体以订单页面为准。",
        category="客服知识",
        triggers=("发货", "几天", "多久", "物流", "快递", "订单", "什么时候"),
    ),
    DemoKnowledge(
        title="退换货 · 店铺规则",
        content="商品未穿洗、吊牌齐全且符合平台规则时，可在签收后 7 天内申请退货；已穿洗商品需由客服核实，不能仅凭演示资料承诺一定可退。",
        category="客服知识",
        triggers=("退货", "退款", "换货", "退换", "穿过", "拆封", "质量", "售后"),
    ),
)

HANDOFF_TRIGGERS = ("转人工", "人工客服", "投诉", "赔偿", "差评")


def retrieve_knowledge(query: str, limit: int = 2) -> tuple[DemoKnowledge, ...]:
    """Retrieve demo facts by explicit domain trigger matches."""
    normalized = (query or "").strip().lower()
    if not normalized:
        return ()
    scored = []
    for item in KNOWLEDGE:
        hits = [trigger for trigger in item.triggers if trigger.lower() in normalized]
        if hits:
            scored.append((len(hits), item))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return tuple(item for _, item in scored[:limit])


def _offline_answer(query: str, evidence: tuple[DemoKnowledge, ...], handoff: bool) -> str:
    if handoff:
        return "我已记录您希望联系人工客服。当前是本地演示，不会真的发起转接；正式接入后可由客服处理您的诉求。"
    if not evidence:
        return "我暂时没有在演示知识库中找到可靠依据。为避免误答，建议转人工核实后再回复您。"
    if len(evidence) == 1:
        return f"亲，{evidence[0].content}"
    return "亲，\n" + "\n".join(item.content for item in evidence)


def _configured_api_key() -> str:
    try:
        from config import get_config

        return str(get_config("llm.api_key", "") or "").strip()
    except Exception:
        return ""


async def _generate_with_model(query: str, evidence: tuple[DemoKnowledge, ...]) -> str:
    from Agent.CustomerAgent.custom.agent_config import AgentConfig
    from Agent.CustomerAgent.custom.llm_client import LLMClient

    profile = AgentConfig.load_from_config().profile
    client = LLMClient(profile=profile, temperature=0.2)
    try:
        await client.initialize()
        facts = "\n".join(f"- {item.title}: {item.content}" for item in evidence)
        if not facts:
            facts = "知识库未检索到相关资料，不要编造商品、物流或售后信息，应建议人工核实。"
        response = await client.chat(
            [
                {
                    "role": "system",
                    "content": (
                        f"你是{DEMO_SHOP_NAME}的电商客服。只根据提供的知识回答，不得编造；"
                        "如信息不足就明确说明并建议人工核实。回复简洁、礼貌。"
                    ),
                },
                {"role": "user", "content": f"【本地知识资料】\n{facts}\n\n【客户问题】\n{query}"},
            ],
            use_tools=False,
        )
        answer = (response.content or "").strip()
        if not answer:
            raise RuntimeError("模型没有返回文本内容")
        return answer
    finally:
        await client.close()


async def process_demo_message(query: str, *, use_configured_model: bool = True) -> DemoReply:
    """Retrieve fictional shop knowledge and produce a safe demo reply."""
    query = (query or "").strip()
    if not query:
        raise ValueError("请输入客户问题")

    evidence = retrieve_knowledge(query)
    handoff = any(trigger in query for trigger in HANDOFF_TRIGGERS)

    if use_configured_model and _configured_api_key():
        answer = await _generate_with_model(query, evidence)
        return DemoReply(answer, "真实模型生成（未调用平台工具）", evidence, handoff)

    return DemoReply(_offline_answer(query, evidence, handoff), "离线知识匹配（未调用模型）", evidence, handoff)


def run_demo_message(query: str, *, use_configured_model: bool = True) -> DemoReply:
    """Synchronous entry point for a UI worker thread."""
    return asyncio.run(process_demo_message(query, use_configured_model=use_configured_model))


__all__ = [
    "DEMO_SHOP_NAME",
    "KNOWLEDGE",
    "DemoKnowledge",
    "DemoReply",
    "process_demo_message",
    "retrieve_knowledge",
    "run_demo_message",
]
