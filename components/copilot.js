/* ═══════════════════════════════════════════════════════
   components/copilot.js — AI Copilot Panel Component
   Renders the right-side chat panel.
   Integrates with utils/api.js for real Claude calls.
   Exposes: addMessage(role, html), askCopilot(text)
═══════════════════════════════════════════════════════ */

import { sendMessage, MODE_PROMPTS } from '../utils/api.js';
import { mdToHtml } from '../utils/formatters.js';   // Bug Fix #1 & #2

/* ── State ── */
let _currentMode = 'tutor';
let _currentModule = 'dashboard';
let _silentMode = true;  // default: don't auto-fire AI on module actions

/* ── Mode labels ── */
const MODE_LABELS = {
  tutor:      '导师',
  critic:     '评审',
  brainstorm: '头脑风暴',
  socratic:   '苏格拉底',
  peer:       '同伴',
  reviewer:   '期刊编辑',   // Bug Fix #3: 补全缺失模式
};

/* ── Render ── */
function renderCopilot() {
  const root = document.getElementById('copilot-root');
  if (!root) return;

  const chips = Object.entries(MODE_LABELS).map(([k, v]) =>
    `<div class="context-chip${k === 'tutor' ? ' active' : ''}" data-mode="${k}" onclick="window.__copilot?.setMode('${k}', this)">${v}</div>`
  ).join('');

  root.innerHTML = `
    <div class="copilot">
      <div class="copilot-header">
        <div class="copilot-avatar">🧠</div>
        <div style="flex:1;">
          <div class="copilot-name">Nexus</div>
          <div class="copilot-status"><span class="status-dot"></span>AI 导师 · 在线</div>
        </div>
        <button id="silent-toggle" title="切换自动触发"
          onclick="window.__copilot?.toggleSilent()"
          style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 8px;
                 cursor:pointer;font-size:11px;color:var(--text-faint);transition:all 0.15s;">
          ${_silentMode ? '🔕 静默' : '🔔 自动'}
        </button>
      </div>

      <div class="context-bar">${chips}</div>

      <div class="copilot-messages" id="copilot-msgs">
        <div class="msg">
          <div class="msg-label sys">NEXUS</div>
          <div class="msg-body">
            你好！我是 <strong>Nexus</strong>，你的 AI 科研助手。
            我可以帮你：解析研究方法、审阅论文逻辑、对比实验结果，或回答任何学术问题。
            <div class="hint">💡 切换上方模式可改变交互风格——「苏格拉底」会用问题引导你独立思考。</div>
          </div>
        </div>
      </div>

      <div class="copilot-input-area">
        <input
          class="copilot-input"
          id="copilot-in"
          placeholder="问 Nexus 任何问题…"
          onkeydown="if(event.key==='Enter') window.__copilot?.send()"
        >
        <button class="copilot-send" onclick="window.__copilot?.send()">↑</button>
      </div>
    </div>`;
}

/* ── Public API ── */

/** 向对话区追加消息 */
export function addMessage(role, html) {
  const msgs = document.getElementById('copilot-msgs');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'msg';
  const labelClass = role === 'user' ? 'user' : role === 'sys' ? 'sys' : 'ai';
  const labelText  = role === 'user' ? 'YOU' : 'NEXUS';
  div.innerHTML = `
    <div class="msg-label ${labelClass}">${labelText}</div>
    <div class="msg-body">${html}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

/** 显示加载占位，返回占位元素 id */
function showTyping() {
  const msgs = document.getElementById('copilot-msgs');
  const id   = 'typing-' + Date.now();
  const div  = document.createElement('div');
  div.className = 'msg';
  div.id = id;
  div.innerHTML = `<div class="msg-label ai">NEXUS</div><div class="msg-body"><span class="spinner"></span>思考中…</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

/** 向 Claude 发送并显示响应
 *  @param {string} text
 *  @param {string} context
 *  @param {boolean} [force=false] — 传 true 时忽略静默模式，直接发送（用户主动触发）
 */
export async function askCopilot(text, context = '', force = false) {
  if (!text.trim()) return;
  // 静默模式下，非用户主动触发的调用直接忽略
  if (_silentMode && !force) return;
  addMessage('user', text);
  const typingId = showTyping();
  try {
    const reply = await sendMessage(text, _currentMode, { extraContext: context || _currentModule });
    document.getElementById(typingId)?.remove();
    addMessage('ai', mdToHtml(reply));
  } catch (err) {
    document.getElementById(typingId)?.remove();
    addMessage('sys', `⚠️ 连接失败：${err.message}`);
  }
}

/** 设置当前激活模块（供 shell 调用，提供 AI 上下文） */
export function setCurrentModule(moduleId) {
  _currentModule = moduleId;
}

/** 切换 copilot 模式 */
function setMode(mode, el) {
  _currentMode = mode;
  document.querySelectorAll('.context-chip').forEach(c => c.classList.remove('active'));
  el?.classList.add('active');
  addMessage('sys', `已切换至 <strong>${MODE_LABELS[mode] ?? mode}</strong> 模式。`);
}

/** 读取输入框并发送（用户主动，忽略静默模式） */
function send() {
  const inp = document.getElementById('copilot-in');
  const val = inp?.value.trim();
  if (!val) return;
  inp.value = '';
  askCopilot(val, '', true);
}

/** 切换静默模式 */
function toggleSilent() {
  _silentMode = !_silentMode;
  const btn = document.getElementById('silent-toggle');
  if (btn) btn.textContent = _silentMode ? '🔕 静默' : '🔔 自动';
  addMessage('sys', _silentMode
    ? '已开启静默模式，AI 不会自动响应模块操作，点击各模块的「问 AI」按钮手动触发。'
    : '已关闭静默模式，AI 将自动响应模块操作。');
}

/* Expose to global for inline onclick handlers */
window.__copilot = { addMessage, askCopilot, setMode, send, setCurrentModule, toggleSilent };

// Auto-render
renderCopilot();
