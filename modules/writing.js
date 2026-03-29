/* ═══════════════════════════════════════════════════════
   modules/writing.js — Writing Workshop Module
   Features: Markdown + KaTeX editor (split pane)
             paper type templates · structure guide
             toolbar snippets · AI inline review
             word count · draft save/load
═══════════════════════════════════════════════════════ */

import { PAPER_STRUCTURES, PAPER_TYPES, SNIPPETS } from '../data/writing.js';
import { storage, KEYS } from '../utils/storage.js';

const CONTAINER = 'module-writing';
let _currentType = 'empirical';
let _autosaveTimer = null;

/* ── Markdown + KaTeX renderer ── */
function _renderPreview(src) {
  const preview = document.getElementById('writing-preview');
  if (!preview) return;

  // marked.js: Markdown → HTML
  const html = (typeof marked !== 'undefined')
    ? marked.parse(src)
    : src.replace(/\n/g, '<br>');

  preview.innerHTML = html;

  // KaTeX: render $...$ and $$...$$ in preview
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(preview, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$',  right: '$',  display: false },
      ],
      throwOnError: false,
    });
  }
}

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">论文工坊</div>
        <div class="page-desc">Markdown 编辑 · KaTeX 公式 · AI 辅助写作</div>
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

    <div style="display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start;">

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
          <div id="section-jumps" style="display:flex;flex-direction:column;gap:5px;margin-top:10px;"></div>

          <!-- AI Tools -->
          <div style="border-top:1px solid var(--border);margin-top:14px;padding-top:14px;">
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-faint);letter-spacing:0.15em;margin-bottom:8px;">AI 写作助手</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <button class="btn btn-ghost btn-sm" onclick="window.__writing?.aiReview('logic')">🔍 逻辑审查</button>
              <button class="btn btn-ghost btn-sm" onclick="window.__writing?.aiReview('polish')">✍️ 学术润色</button>
              <button class="btn btn-ghost btn-sm" onclick="window.__writing?.aiReview('cite')">📚 文献建议</button>
              <button class="btn btn-ghost btn-sm" onclick="window.__writing?.aiReview('abstract')">📄 生成摘要</button>
            </div>
          </div>

          <!-- Writing stats -->
          <div style="border-top:1px solid var(--border);margin-top:14px;padding-top:12px;
            font-family:var(--font-mono);font-size:10px;color:var(--text-faint);display:flex;gap:14px;flex-wrap:wrap;">
            <span id="word-count">0 字</span>
            <span id="para-count">0 段</span>
            <span id="save-status" style="margin-left:auto;color:var(--cyan);">已保存</span>
          </div>
        </div>
      </div>

      <!-- Right: toolbar + split editor -->
      <div>
        <!-- Toolbar -->
        <div class="writing-toolbar" style="margin-bottom:8px;">
          ${Object.keys(SNIPPETS).map(k => `
            <button class="toolbar-btn" onclick="window.__writing?.insertSnippet('${k}')">
              ${_snippetLabel(k)}
            </button>`).join('<div class="toolbar-sep"></div>')}
          <div class="toolbar-sep"></div>
          <button class="toolbar-btn" onclick="window.__writing?.insertMath()" title="插入行内公式">∑ 公式</button>
          <button class="toolbar-btn" onclick="window.__writing?.insertMathBlock()" title="插入块级公式">∑∑ 块公式</button>
        </div>

        <!-- Split pane: source | preview -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
          <!-- Source (Markdown) -->
          <div style="border-right:1px solid var(--border);">
            <div style="padding:6px 12px;background:var(--surface-2);border-bottom:1px solid var(--border);
              font-family:var(--font-mono);font-size:10px;color:var(--text-faint);letter-spacing:0.1em;">
              MARKDOWN
            </div>
            <textarea
              id="writing-src"
              spellcheck="false"
              oninput="window.__writing?.onInput()"
              onkeydown="window.__writing?.onKey(event)"
              placeholder="在此输入 Markdown…&#10;&#10;# 标题&#10;**粗体** _斜体_&#10;$公式$ 或 $$块公式$$"
              style="width:100%;min-height:420px;padding:16px;resize:vertical;
                     background:rgba(0,0,0,0.25);border:none;outline:none;
                     font-family:var(--font-mono);font-size:13px;line-height:1.8;
                     color:var(--text);caret-color:var(--gold);box-sizing:border-box;">
            </textarea>
          </div>

          <!-- Preview (rendered) -->
          <div>
            <div style="padding:6px 12px;background:var(--surface-2);border-bottom:1px solid var(--border);
              font-family:var(--font-mono);font-size:10px;color:var(--text-faint);letter-spacing:0.1em;">
              PREVIEW
            </div>
            <div
              id="writing-preview"
              class="writing-preview"
              style="min-height:420px;padding:16px;overflow-y:auto;">
              <span style="color:var(--text-faint);font-size:12px;">开始输入后实时预览…</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  _renderStructureGuide('empirical');
  _loadDraftIfExists();
  _injectPreviewStyles();
}

/* ── Preview styles (injected once) ── */
function _injectPreviewStyles() {
  if (document.getElementById('writing-preview-style')) return;
  const s = document.createElement('style');
  s.id = 'writing-preview-style';
  s.textContent = `
    .writing-preview { font-family: var(--font-body); font-size:14px; line-height:1.9; color:var(--text); }
    .writing-preview h1 { font-family:var(--font-display); font-size:20px; color:var(--gold); margin:20px 0 10px; }
    .writing-preview h2 { font-family:var(--font-display); font-size:16px; color:var(--cyan); margin:16px 0 8px; }
    .writing-preview h3 { font-family:var(--font-mono); font-size:13px; color:var(--violet); margin:12px 0 6px; text-transform:uppercase; letter-spacing:0.08em; }
    .writing-preview p  { margin:0 0 10px; }
    .writing-preview ul, .writing-preview ol { padding-left:20px; margin:0 0 10px; }
    .writing-preview li { margin-bottom:4px; }
    .writing-preview strong { color:var(--text); font-weight:600; }
    .writing-preview em { color:var(--text-muted); font-style:italic; }
    .writing-preview code { font-family:var(--font-mono); font-size:12px; background:rgba(0,0,0,0.3); padding:1px 5px; border-radius:3px; color:var(--cyan); }
    .writing-preview pre { background:rgba(0,0,0,0.35); border:1px solid var(--border); border-radius:6px; padding:12px; overflow-x:auto; margin:10px 0; }
    .writing-preview pre code { background:none; padding:0; color:var(--text-muted); }
    .writing-preview blockquote { border-left:3px solid var(--gold); margin:10px 0; padding:6px 14px; color:var(--text-muted); background:rgba(212,168,83,0.05); }
    .writing-preview table { border-collapse:collapse; width:100%; margin:10px 0; font-size:13px; }
    .writing-preview th { background:var(--surface-2); color:var(--text-muted); padding:6px 10px; border:1px solid var(--border); font-family:var(--font-mono); font-size:11px; }
    .writing-preview td { padding:6px 10px; border:1px solid var(--border); color:var(--text-muted); }
    .writing-preview hr { border:none; border-top:1px solid var(--border); margin:16px 0; }
    .writing-preview .katex { color:var(--gold); }
    .writing-preview .katex-display { margin:12px 0; }
  `;
  document.head.appendChild(s);
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
  const src = document.getElementById('writing-src');
  if (!src) return;
  const snip = SNIPPETS[key] ?? '';
  const pos = src.selectionStart;
  const before = src.value.slice(0, pos);
  const after  = src.value.slice(src.selectionEnd);
  src.value = before + '\n\n' + snip + '\n\n' + after;
  src.selectionStart = src.selectionEnd = pos + snip.length + 4;
  src.focus();
  onInput();
}

function insertMath() {
  const src = document.getElementById('writing-src');
  if (!src) return;
  const pos = src.selectionStart;
  const sel = src.value.slice(src.selectionStart, src.selectionEnd) || 'E = mc^2';
  const before = src.value.slice(0, pos);
  const after  = src.value.slice(src.selectionEnd);
  src.value = before + `$${sel}$` + after;
  src.focus();
  onInput();
}

function insertMathBlock() {
  const src = document.getElementById('writing-src');
  if (!src) return;
  const pos = src.selectionStart;
  const before = src.value.slice(0, pos);
  const after  = src.value.slice(src.selectionEnd);
  const block = '\n\n$$\nY_{it} = \\alpha + \\beta X_{it} + \\varepsilon_{it}\n$$\n\n';
  src.value = before + block + after;
  src.selectionStart = src.selectionEnd = pos + block.length;
  src.focus();
  onInput();
}

function jumpToSection(sectionName) {
  const src = document.getElementById('writing-src');
  if (!src) return;
  if (!src.value.includes(sectionName)) {
    src.value += `\n\n## ${sectionName}\n\n`;
  }
  src.focus();
  onInput();
}

/* ── Input handlers ── */
function onInput() {
  const src = document.getElementById('writing-src');
  if (!src) return;
  _renderPreview(src.value);
  _updateStats(src.value);
  _scheduleSave();
}

function onKey(e) {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault();
    aiReview('logic');
  }
  // Tab → insert 2 spaces instead of focus-out
  if (e.key === 'Tab') {
    e.preventDefault();
    const src = e.target;
    const pos = src.selectionStart;
    src.value = src.value.slice(0, pos) + '  ' + src.value.slice(src.selectionEnd);
    src.selectionStart = src.selectionEnd = pos + 2;
  }
}

function _updateStats(text = '') {
  const words = text.trim().length;
  const paras = (text.match(/\n\n/g) ?? []).length + 1;
  const wc = document.getElementById('word-count');
  const pc = document.getElementById('para-count');
  const ss = document.getElementById('save-status');
  if (wc) wc.textContent = `${words} 字`;
  if (pc) pc.textContent = `${paras} 段`;
  if (ss) ss.textContent = '未保存 ●';
}

/* ── AI Reviews ── */
function aiReview(type) {
  const src   = document.getElementById('writing-src');
  const text  = src?.value?.trim() ?? '';
  const slice = text.slice(0, 800);

  const prompts = {
    logic:    `请审阅以下写作内容，找出逻辑漏洞、论证跳跃或表达不清的地方（控制在 150 字以内）：\n\n${slice}`,
    polish:   `请将以下内容改写成更学术、更规范的表达方式，保持核心意思不变（控制在 200 字）：\n\n${slice}`,
    cite:     `根据以下写作内容，推荐 3 篇最相关的参考文献（说明为什么相关）：\n\n${slice}`,
    abstract: `根据以下内容，帮我起草一个 150 字的学术摘要（包含：研究问题、方法、发现、贡献）：\n\n${slice}`,
  };

  if (!text) { window.__copilot?.addMessage('sys', '⚠️ 编辑器内容为空，请先写一些内容。'); return; }
  window.__copilot?.askCopilot(prompts[type] ?? prompts.logic, `论文工坊 - ${_currentType}`, true);
}

/* ── Save / Load ── */
function _scheduleSave() {
  clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(saveDraft, 3000);
}

function saveDraft() {
  const src = document.getElementById('writing-src');
  if (!src) return;
  const drafts = storage.get(KEYS.DRAFTS, {});
  drafts[_currentType] = {
    content: src.value,   // store Markdown source, not HTML
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
  const src = document.getElementById('writing-src');
  if (src) {
    src.value = draft.content;
    onInput();
    window.__copilot?.addMessage('sys', `✓ 已加载草稿（保存于 ${draft.savedAt.slice(0, 16)}）。`);
  }
}

function _loadDraftIfExists() {
  const drafts = storage.get(KEYS.DRAFTS, {});
  const draft  = drafts[_currentType];
  if (!draft) return;
  const src = document.getElementById('writing-src');
  if (src) {
    src.value = draft.content;
    _renderPreview(src.value);
    _updateStats(src.value);
    const ss = document.getElementById('save-status');
    if (ss) ss.textContent = '已保存 ✓';
  }
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
  init, changeType, insertSnippet, insertMath, insertMathBlock, jumpToSection,
  onInput, onKey, aiReview,
  saveDraft, loadDraft,
};
