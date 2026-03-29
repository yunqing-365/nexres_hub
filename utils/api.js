/* ═══════════════════════════════════════════════════════
   utils/api.js — DeepSeek API Wrapper (OpenAI-compatible)
   Handles: mode system prompts · message history · error states
═══════════════════════════════════════════════════════ */

const API_ENDPOINT = 'http://localhost:3001/chat/completions';
const MODEL        = 'deepseek-chat';
const MAX_TOKENS   = 1000;

/* ── API Key 管理 ── */
let _apiKey = localStorage.getItem('nexres:apiKey') ?? '';

export function setApiKey(key) {
  _apiKey = key.trim();
  localStorage.setItem('nexres:apiKey', _apiKey);
}
export function getApiKey() { return _apiKey; }
export function hasApiKey()  { return _apiKey.length > 0; }

function _headers() {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${_apiKey}`,
  };
}

/* ── Copilot Mode Prompts ── */
export const MODE_PROMPTS = {
  tutor: `你是一位经验丰富的学术导师，专精经济学、计量统计和机器学习。
用清晰、友好的中文回答，适当使用公式和例子。回答控制在 200 字以内。
当解释复杂概念时，先给直觉理解，再给正式定义。`,

  critic: `你是一位严格的论文匿名评审者（peer reviewer），主要关注：
1. 识别策略的逻辑严密性；2. 数据和变量的质量问题；3. 结论与证据的一致性。
直接、具体、建设性。找 3 个最重要的问题，每个给出改进建议。回答控制在 200 字以内。`,

  brainstorm: `你是创意型研究伙伴，擅长发散思维。
提出 3-5 个新颖的研究角度、扩展方向或跨学科联系。
每个方向一句话说明核心创新点，不需要展开。回答控制在 180 字以内。`,

  socratic: `你使用苏格拉底式对话法，只用问题回应。
不直接给答案，通过 1-2 个精准的问题引导用户自己发现答案。
问题要具体，指向思维盲点，而非宽泛提问。`,

  peer: `你是一位同级研究生，用轻松对话的语气交流。
偶尔分享自己的困惑和经验，承认不确定性，不过分权威。
把复杂内容用日常语言讲清楚。回答控制在 150 字以内。`,

  reviewer: `你是一位资深期刊编辑，帮助作者改进投稿。
重点关注：论文定位是否清晰、与顶刊已有文献的差异化贡献、
写作的清晰度和学术规范。给出 3 条具体的修改建议。回答控制在 250 字以内。`,
};

/* ── 消息历史（多轮对话） ── */
let _history = [];

export function clearHistory() {
  _history = [];
}

/**
 * 发送消息，返回响应文本
 * @param {string} userMessage
 * @param {string} mode
 * @param {Object} [options] - { extraContext: string }
 * @returns {Promise<string>}
 */
export async function sendMessage(userMessage, mode = 'tutor', options = {}) {
  const fullMessage = options.extraContext
    ? `[当前上下文: ${options.extraContext}]\n\n${userMessage}`
    : userMessage;

  _history.push({ role: 'user', content: fullMessage });

  const systemPrompt = MODE_PROMPTS[mode] ?? MODE_PROMPTS.tutor;

  // DeepSeek / OpenAI 格式：system 放在 messages 数组第一条
  const messages = [
    { role: 'system', content: systemPrompt },
    ..._history,
  ];

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${response.status}`);
  }

  const data  = await response.json();
  // OpenAI 兼容格式：choices[0].message.content
  const reply = data.choices?.[0]?.message?.content ?? '（无响应）';

  _history.push({ role: 'assistant', content: reply });

  return reply;
}

/**
 * 快速单次问答（不记入历史）
 */
export async function quickAsk(prompt, systemOverride = '') {
  const system = systemOverride || '你是一位经济学和机器学习领域的专家，用简洁中文回答学术问题，200 字以内。';

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system',  content: system },
        { role: 'user',    content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '（无响应）';
}

export function getHistory() {
  return [..._history];
}
