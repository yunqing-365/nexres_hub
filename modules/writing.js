/* ═══════════════════════════════════════════════════════
   modules/writing.js — Writing Workshop Module
   Features: paper type templates · structure guide
             toolbar snippets · AI inline review
             word count · draft save/load
═══════════════════════════════════════════════════════ */

import { PAPER_STRUCTURES, PAPER_TYPES, SNIPPETS } from '../data/writing.js';
import { storage, KEYS } from '../utils/storage.js';

const CONTAINER = 'module-writing';
let _currentType = 'empirical';
let _autosaveTimer = null;

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">论文工坊</div>
        <div class="page-desc">结构向导 · AI 辅助写作 · 多论文类型模板</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="paper-type-select" onchange="window.__writing?.changeType(this.value)">
          ${Object.entries(PAPER_TYPES).map(([k, v]) =>
            `<option value="${k}">${v.icon} ${v.label}</option>`
          ).join('')}
        </select>
        <button class="btn btn-ghost btn-sm" onclick="window.__writing?.saveDraft()">💾 保存</button>
        <button class="btn btn-ghost btn-sm" onclick="window.__writing?.loadDraft()">📂 加载</button>
      </div>
    </div>

    <div class="grid-2" style="align-items:start;gap:20px;">

      <!-- Left: structure guide + AI tools -->
      <div>
        <div class="card" style="position:sticky;top:0;">
          <div class="card-title">
            📐 结构向导
            <span id="paper-type-label"
              style="color:var(--cyan);font-size:9px;margin-left:4px;font-family:var(--font-mono);">
              ${PAPER_TYPES.empirical.label}
            </span>
          </div>
          <div id="structure-guide" class="structure-guide"></div>

          <!-- Section jump buttons -->
          <div id="section-jumps" style="display:flex;flex-direction:column;gap:5px;margin-top:10px;"></div>

          <!-- AI Tools -->
          <div style="border-top:1px solid var(--border);margin-top:14px;padding-top:14px;">
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-faint);letter-spacing:0.15em;margin-bottom:8px;">AI 写作助手</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <button class="btn btn-ghost btn-sm"
                onclick="window.__writing?.aiReview('logic')">🔍 逻辑审查</button>
              <button class="btn btn-ghost btn-sm"
                onclick="window.__writing?.aiReview('polish')">✍️ 学术润色</button>
              <button class="btn btn-ghost btn-sm"
                onclick="window.__writing?.aiReview('cite')">📚 文献建议</button>
              <button class="btn btn-ghost btn-sm"
                onclick="window.__writing?.aiReview('abstract')">📄 生成摘要</button>
            </div>
          </div>

          <!-- Writing stats -->
          <div style="border-top:1px solid var(--border);margin-top:14px;padding-top:12px;
            font-family:var(--font-mono);font-size:10px;color:var(--text-faint);display:flex;gap:14px;">
            <span id="word-count">0 字</span>
            <span id="para-count">0 段</span>
            <span id="save-status" style="margin-left:auto;color:var(--cyan);">已保存</span>
          </div>
        </div>
      </div>

      <!-- Right: toolbar + editor -->
      <div>
        <div class="writing-toolbar">
          ${Object.keys(SNIPPETS).map(k => `
            <button class="toolbar-btn"
              onclick="window.__writing?.insertSnippet('${k}')">
              ${_snippetLabel(k)}
            </button>`).join('<div class="toolbar-sep"></div>')}
        </div>

        <div
          class="writing-editor"
          id="writing-editor"
          contenteditable="true"
          spellcheck="false"
          oninput="window.__writing?.onInput()"
          onkeydown="window.__writing?.onKey(event)"
          data-placeholder="在此开始写作，或从左侧结构向导选择要撰写的章节…">
        </div>

        <!-- AI suggestion banner (appears contextually) -->
        <div id="ai-suggestion" style="display:none;margin-top:10px;" class="card">
          <div class="card-title violet">AI 建议</div>
          <div id="ai-suggestion-text" style="font-size:13px;color:var(--text-muted);line-height:1.8;"></div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button class="btn btn-primary btn-sm"
              onclick="window.__writing?.applySuggestion()">✓ 采纳</button>
            <button class="btn btn-ghost btn-sm"
              onclick="document.getElementById('ai-suggestion').style.display='none'">✗ 忽略</button>
          </div>
        </div>
      </div>
    </div>`;

  _renderStructureGuide('empirical');
  _loadDraftIfExists();
}

/* ── Structure guide ── */
function _renderStructureGuide(type) {
  const sections = PAPER_STRUCTURES[type] ?? PAPER_STRUCTURES.empirical;

  document.getElementById('structure-guide').innerHTML = sections.map(s => `
    <div class="sg-item${s.done ? ' sg-done' : ''}" id="sg-${s.n}">
      <div class="sg-num" style="color:${s.done ? 'var(--cyan)' : 'var(--text-faint)'};">
        ${s.done ? '✓' : s.n}
      </div>
      <div class="sg-text">
        <strong>${s.t}</strong>
        <div style="font-size:11px;color:var(--text-faint);margin-top:2px;">${s.desc}</div>
      </div>
    </div>`).join('');

  // Section jump buttons
  const jumps = document.getElementById('section-jumps');
  if (jumps) {
    jumps.innerHTML = sections.map(s => `
      <button class="btn btn-ghost btn-sm" style="text-align:left;justify-content:flex-start;"
        onclick="window.__writing?.jumpToSection('${s.t}')">
        ${s.n}. ${s.t}
      </button>`).join('');
  }
}

function changeType(type) {
  _currentType = type;
  const info = PAPER_TYPES[type];
  document.getElementById('paper-type-label').textContent = info.label;
  _renderStructureGuide(type);
  window.__copilot?.addMessage('sys',
    `已切换至 <strong>${info.label}</strong> 模板。结构向导已更新为对应章节框架。`);
}

/* ── Toolbar snippets ── */
function insertSnippet(key) {
  const editor = document.getElementById('writing-editor');
  if (!editor) return;
  const snip = SNIPPETS[key] ?? '';

  // Insert at cursor or append
  editor.focus();
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode('\n\n' + snip + '\n\n');
    range.insertNode(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    editor.textContent += '\n\n' + snip;
  }
  onInput();
}

function jumpToSection(sectionName) {
  const editor = document.getElementById('writing-editor');
  if (!editor) return;
  const text = editor.innerText || '';
  if (!text.includes(sectionName)) {
    editor.focus();
    const placeholder = `\n\n=== ${sectionName} ===\n\n`;
    editor.textContent += placeholder;
  }
  editor.focus();
  onInput();
}

/* ── Input handlers ── */
function onInput() {
  _updateStats();
  _scheduleSave();
}

function onKey(e) {
  // Ctrl+Enter → AI review
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault();
    aiReview('logic');
  }
}

function _updateStats() {
  const text  = document.getElementById('writing-editor')?.innerText ?? '';
  const words = text.trim().length;
  const paras = (text.match(/\n\n/g) ?? []).length + 1;
  const wc    = document.getElementById('word-count');
  const pc    = document.getElementById('para-count');
  const ss    = document.getElementById('save-status');
  if (wc) wc.textContent = `${words} 字`;
  if (pc) pc.textContent = `${paras} 段`;
  if (ss) ss.textContent = '未保存 ●';
}

/* ── AI Reviews ── */
function aiReview(type) {
  const text = document.getElementById('writing-editor')?.innerText?.trim() ?? '';
  const slice = text.slice(0, 800);

  const prompts = {
    logic:    `请审阅以下写作内容，找出逻辑漏洞、论证跳跃或表达不清的地方（控制在 150 字以内）：\n\n${slice}`,
    polish:   `请将以下内容改写成更学术、更规范的表达方式，保持核心意思不变（控制在 200 字）：\n\n${slice}`,
    cite:     `根据以下写作内容，推荐 3 篇最相关的参考文献（说明为什么相关）：\n\n${slice}`,
    abstract: `根据以下内容，帮我起草一个 150 字的学术摘要（包含：研究问题、方法、发现、贡献）：\n\n${slice}`,
  };

  const prompt = prompts[type] ?? prompts.logic;
  if (!text) {
    window.__copilot?.addMessage('sys', '⚠️ 编辑器内容为空，请先写一些内容。');
    return;
  }
  window.__copilot?.askCopilot(prompt, `论文工坊 - ${_currentType}`);
}

let _lastSuggestion = '';
function applySuggestion() {
  if (!_lastSuggestion) return;
  const editor = document.getElementById('writing-editor');
  if (editor) {
    editor.textContent += '\n\n' + _lastSuggestion;
    document.getElementById('ai-suggestion').style.display = 'none';
    onInput();
  }
}

/* ── Save / Load ── */
function _scheduleSave() {
  clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(saveDraft, 3000);
}

function saveDraft() {
  const editor = document.getElementById('writing-editor');
  if (!editor) return;
  const drafts = storage.get(KEYS.DRAFTS, {});
  drafts[_currentType] = {
    content: editor.innerHTML,
    savedAt: new Date().toISOString(),
  };
  storage.set(KEYS.DRAFTS, drafts);
  const ss = document.getElementById('save-status');
  if (ss) ss.textContent = '已保存 ✓';
}

function loadDraft() {
  const drafts = storage.get(KEYS.DRAFTS, {});
  const draft  = drafts[_currentType];
  if (!draft) { window.__copilot?.addMessage('sys', '当前论文类型暂无已保存草稿。'); return; }
  const editor = document.getElementById('writing-editor');
  if (editor) {
    editor.innerHTML = draft.content;
    onInput();
    window.__copilot?.addMessage('sys', `✓ 已加载草稿（保存于 ${draft.savedAt.slice(0, 16)}）。`);
  }
}

function _loadDraftIfExists() {
  const drafts = storage.get(KEYS.DRAFTS, {});
  const draft  = drafts[_currentType];
  if (!draft) return;
  const editor = document.getElementById('writing-editor');
  if (editor) { editor.innerHTML = draft.content; _updateStats(); }
}

/* ── Helpers ── */
function _snippetLabel(key) {
  const labels = {
    abstract:  '摘要',
    hypothesis:'假设',
    results:   '结果呈现',
    robustness:'稳健性',
    table:     '表格注释',
    equation:  '公式',
    mechansim: '机制分析',
  };
  return labels[key] ?? key;
}

window.__writing = {
  init, changeType, insertSnippet, jumpToSection,
  onInput, onKey, aiReview, applySuggestion,
  saveDraft, loadDraft,
};
