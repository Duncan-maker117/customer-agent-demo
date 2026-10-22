/** Static experience only. No model, platform request, or persistent storage. */
export const INITIAL_KNOWLEDGE = [
  { id: 'product-fabric', title: '轻氧棉 T 恤 · 商品资料', category: '商品知识', content: '面料为 95% 精梳棉、5% 氨纶；可机洗，建议与深色衣物分开洗涤。', triggers: ['面料', '材质', '成分', '棉', '清洗', '洗涤', '怎么洗', '机洗', '洗衣机', 't恤', 't 恤'] },
  { id: 'shipping-policy', title: '发货时效 · 店铺规则', category: '客服知识', content: '工作日下单后通常 48 小时内发出；节假日或活动期间可能延迟，具体以订单页面为准。这里无法查询真实订单或物流。', triggers: ['发货', '几天', '多久', '物流', '快递', '订单', '什么时候', '配送', '送到', '周末', '节假日'] },
  { id: 'return-policy', title: '退换货 · 店铺规则', category: '客服知识', content: '商品未穿洗、吊牌齐全且符合平台规则时，可在签收后 7 天内申请退货；已穿洗商品需由客服核实，不能仅凭示例资料承诺一定可退。', triggers: ['退货', '退款', '换货', '退换', '穿过', '穿了', '拆封', '质量', '售后', '能退', '可以退'] },
];

export const SCENARIOS = [
  { id: 'product', title: '商品咨询', subtitle: '了解面料与日常洗护', icon: 'shirt', tag: '知识匹配', greeting: '你好，欢迎来到轻氧生活。\n想了解这件 T 恤的面料或洗护方式？可以直接输入问题，我会根据当前示例知识提供回复，并在右侧展示依据。', prompts: ['这件 T 恤是什么面料？', '可以用洗衣机洗吗？', '你们有蓝牙耳机吗？'] },
  { id: 'shipping', title: '物流时效', subtitle: '查询店铺发货规则', icon: 'truck', tag: '规则查询', greeting: '你好，这里可以体验发货时效咨询。\n当前使用虚构的店铺规则，不会查询真实订单。你可以询问发货时间，或换一种说法试试。', prompts: ['下单之后多久发货？', '周末和节假日也一样吗？', '我的快递现在到哪了？'] },
  { id: 'support', title: '售后处理', subtitle: '退换货与人工协同', icon: 'headphones', tag: '人工协同', greeting: '你好，这里可以体验退换货咨询和人工接管。\n涉及需要核实的售后问题时，我会展示规则边界；你也可以输入“转人工”，看看后续如何处理。', prompts: ['衣服穿过一次还能退吗？', '退货有什么条件？', '我要投诉，转人工客服。'] },
];

const normalize = text => String(text || '').trim().toLowerCase();
const injectionPattern = /忽略.{0,10}(规则|提示|指令)|系统提示词|api[\s_-]?key|密钥|cookie|其他店铺.{0,6}(数据|资料)/i;
const humanPattern = /转人工|人工客服|找人工|联系人工|投诉|赔偿|差评/;
const negatedHumanPattern = /(不要|不用|不想|别|无需|不需要).{0,3}(转|找|联系)?人工(?:客服)?/g;

export function retrieveKnowledge(query, knowledge) {
  const text = normalize(query);
  if (!text) return [];
  return knowledge.map((item, index) => ({ item, index, score: item.triggers.filter(word => text.includes(normalize(word))).length }))
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2).map(match => ({ ...match.item, triggers: [...match.item.triggers] }));
}

export function createReply(query, knowledge, previousEvidence = []) {
  const text = normalize(query);
  if (!text) throw new Error('请输入问题');
  if (text.length > 500) throw new Error('问题请控制在 500 个字符以内');
  if (injectionPattern.test(text)) return { kind: 'boundary', evidence: [], handoff: false, answer: '当前体验只使用虚构店铺的商品和客服知识，不提供密钥、系统提示或其他店铺资料。你可以询问面料、发货、退换货，或体验人工接管。' };
  if (humanPattern.test(text.replace(negatedHumanPattern, ''))) return { kind: 'handoff', evidence: [], handoff: true, answer: '已在当前演示中标记为“等待人工”。\n点击下方“模拟人工接管”即可继续体验；这里没有真人客服在线，也不会向平台发起真实转接。' };
  if (/快递.{0,8}(哪|哪里|位置)|物流.{0,6}(轨迹|进度)|查.{0,6}(单号|订单)|订单.{0,6}(状态|进度|编号)|[A-Z]{2}\d{8,}/i.test(text)) return { kind: 'unknown', evidence: [], handoff: false, answer: '当前静态体验无法查询真实订单或物流轨迹。你可以询问店铺的发货规则；具体订单需要由有权限的客服在业务系统中核实。' };
  let evidence = retrieveKnowledge(text, knowledge);
  const isFollowUp = /^(那|它|这|还有|能|可以)|呢[？?]?$/.test(text);
  if (!evidence.length && isFollowUp && /周末|节假日|假期|平时/.test(text) && previousEvidence.includes('shipping-policy')) {
    evidence = knowledge.filter(item => item.id === 'shipping-policy').map(item => ({ ...item, triggers: [...item.triggers] }));
  }
  if (!evidence.length) return { kind: 'unknown', evidence: [], handoff: false, answer: '当前示例知识库中没有找到可靠依据，我暂时无法确认。\n建议由人工核实，或先在“知识库”新增相应资料及匹配关键词，再回到这里提问。' };
  return { kind: 'grounded', evidence, handoff: false, answer: `根据当前店铺资料：\n${evidence.map(item => item.content).join('\n\n')}` };
}
