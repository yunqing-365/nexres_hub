/* ═══════════════════════════════════════════════════════
   modules/literature.js — Literature Module
   Tabs: list · knowledge map · reader
   Features: DOI auto-fetch · manual import · persistent storage
═══════════════════════════════════════════════════════ */

import { PAPERS, filterPapers, getPaperById, addPaper, deletePaper } from '../data/papers.js';
import { toAPA, toBibTeX } from '../utils/formatters.js';

const CONTAINER = 'module-literature';
let _activeTab = 'list';
let _showingImport = false;

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;
  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">文献星系</div>
        <div class="page-desc">管理、阅读、连接你的研究脉络</div>
      </div>
      <button class="btn btn-cyan" onclick="window.__literature?.toggleImport()">+ 导入文献</button>
    </div>

    <!-- Import panel (hidden by default) -->
    <div id="lit-import-panel" style="display:none;"></div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="list"   onclick="window.__literature?.switchTab('list',this)">文献列表</div>
      <div class="module-tab"        data-tab="map"    onclick="window.__literature?.switchTab('map',this)">知识图谱</div>
      <div class="module-tab"        data-tab="reader" onclick="window.__literature?.switchTab('reader',this)">精读模式</div>
    </div>
    <div id="lit-content"></div>`;

  _renderTab('list');
}

/* ── Import panel ── */
function toggleImport() {
  _showingImport = !_showingImport;
  const panel = document.getElementById('lit-import-panel');
  if (!panel) return;
  if (_showingImport) {
    panel.style.display = 'block';
    _renderImportPanel(panel);
  } else {
    panel.style.display = 'none';
  }
}

function _renderImportPanel(el) {
  el.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title cyan">导入文献</div>

      <!-- DOI auto-fetch -->
      <div style="margin-bottom:16px;">
        <div style="font-size:11px;color:var(--text-faint);margin-bottom:6px;font-family:var(--font-mono);">
          通过 DOI 自动抓取元数据（CrossRef）
        </div>
        <div style="display:flex;gap:8px;">
          <input id="doi-input" class="copilot-input" style="flex:1;"
            placeholder="e.g. 10.1257/aer.20150572"
            onkeydown="if(event.key==='Enter') window.__literature?.fetchDOI()">
          <button class="btn btn-primary btn-sm" onclick="window.__literature?.fetchDOI()">
            🔍 自动抓取
          </button>
        </div>
        <div id="doi-status" style="font-size:11px;margin-top:6px;font-family:var(--font-mono);min-height:16px;"></div>
      </div>

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="flex:1;height:1px;background:var(--border);"></div>
        <span style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);">或手动填写</span>
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>

      <!-- Manual form -->
      <div class="grid-2" style="gap:10px;margin-bottom:10px;">
        <div>
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;font-family:var(--font-mono);">标题 *</div>
          <input id="pf-title" class="copilot-input" placeholder="论文标题">
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;font-family:var(--font-mono);">作者 *</div>
          <input id="pf-authors" class="copilot-input" placeholder="e.g. Angrist & Pischke">
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;font-family:var(--font-mono);">年份</div>
          <input id="pf-year" class="copilot-input" type="number" placeholder="${new Date().getFullYear()}">
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;font-family:var(--font-mono);">期刊 / 出版物</div>
          <input id="pf-journal" class="copilot-input" placeholder="e.g. American Economic Review">
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;font-family:var(--font-mono);">DOI</div>
          <input id="pf-doi" class="copilot-input" placeholder="10.xxxx/xxxxx">
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;font-family:var(--font-mono);">评分 (0-10)</div>
          <input id="pf-score" class="copilot-input" type="number" min="0" max="10" step="0.1" placeholder="8.0">
        </div>
      </div>
      <div style="margin-bottom:10px;">
        <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;font-family:var(--font-mono);">标签（逗号分隔）</div>
        <input id="pf-tags" class="copilot-input" placeholder="e.g. 因果推断, DID, 政策评估">
      </div>
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;font-family:var(--font-mono);">摘要</div>
        <textarea id="pf-abstract" style="height:70px;" placeholder="论文摘要（可选）"></textarea>
      </div>

      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="window.__literature?.saveImport()">💾 保存文献</button>
        <button class="btn btn-ghost"   onclick="window.__literature?.toggleImport()">取消</button>
      </div>
    </div>`;
}

async function fetchDOI() {
  const doi = document.getElementById('doi-input')?.value.trim();
  const status = document.getElementById('doi-status');
  if (!doi) { if (status) status.innerHTML = '<span style="color:var(--rose)">请输入 DOI</span>'; return; }
  if (status) status.innerHTML = '<span style="color:var(--text-faint)">⏳ 正在抓取…</span>';

  try {
    const res  = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const w    = data.message;

    const title   = w.title?.[0] ?? '';
    const authors = w.author?.map(a => [a.family, a.given].filter(Boolean).join(', ')).join('; ') ?? '';
    const year    = w.published?.['date-parts']?.[0]?.[0] ?? '';
    const journal = w['container-title']?.[0] ?? w.publisher ?? '';
    const abstract = w.abstract?.replace(/<[^>]+>/g, '') ?? '';

    // Fill form fields
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('pf-title',    title);
    set('pf-authors',  authors);
    set('pf-year',     year);
    set('pf-journal',  journal);
    set('pf-doi',      doi);
    set('pf-abstract', abstract);

    if (status) status.innerHTML = '<span style="color:var(--cyan)">✓ 元数据已填入，请确认后保存</span>';
  } catch (err) {
    if (status) status.innerHTML = `<span style="color:var(--rose)">抓取失败：${err.message}。请手动填写。</span>`;
  }
}

function saveImport() {
  const get = id => document.getElementById(id)?.value.trim() ?? '';
  const title = get('pf-title');
  if (!title) { alert('请填写标题'); return; }

  const tagsRaw = get('pf-tags');
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  const paper = addPaper({
    title,
    authors:  get('pf-authors') || '未知作者',
    year:     parseInt(get('pf-year')) || new Date().getFullYear(),
    journal:  get('pf-journal'),
    doi:      get('pf-doi'),
    abstract: get('pf-abstract'),
    score:    parseFloat(get('pf-score')) || 8.0,
    tags,
    type:     'causal',
    notes:    '',
    citedBy:  0,
  });

  window.__copilot?.addMessage('sys', `✓ 文献「<strong>${paper.title}</strong>」已保存。`);
  _showingImport = false;
  document.getElementById('lit-import-panel').style.display = 'none';
  // re-render list to show new paper
  if (_activeTab === 'list') _renderTab('list');
}

/* ── Tab switching ── */
function switchTab(tab, el) {
  _activeTab = tab;
  document.querySelectorAll(`#${CONTAINER} .module-tab`).forEach(t => t.classList.remove('active'));
  el?.classList.add('active');
  _renderTab(tab);
}

function _renderTab(tab) {
  const content = document.getElementById('lit-content');
  if (!content) return;
  const renderers = { list: _renderList, map: _renderMap, reader: _renderReader };
  (renderers[tab] ?? _renderList)(content);
}

/* ── List tab ── */
function _renderList(el) {
  const papers = filterPapers();
  el.innerHTML = `
    <div style="display:flex;gap:10px;margin-bottom:16px;">
      <input class="search-input" type="text" placeholder="搜索标题、作者、关键词…"
        oninput="window.__literature?._search(this.value)" id="paper-search">
      <select onchange="window.__literature?._filterType(this.value)" style="min-width:110px;">
        <option value="all">全部类型</option>
        <option value="causal">因果推断</option>
        <option value="ml">机器学习</option>
        <option value="econometric">计量经济</option>
        <option value="qual">定性研究</option>
      </select>
    </div>
    <div class="card" id="paper-list-card">
      <div class="card-title">已归档 · ${papers.length} 篇</div>
      ${papers.length ? _paperRows(papers) : '<div style="text-align:center;color:var(--text-faint);padding:32px;">暂无文献，点击「+ 导入文献」开始</div>'}
    </div>`;
}

function _paperRows(list) {
  return list.map((p, i) => `
    <div class="paper-row" onclick="window.__literature?.openPaper(${p.id})">
      <div class="paper-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="paper-info">
        <div class="paper-title">${p.title}</div>
        <div class="paper-meta">${p.authors} · ${p.year} · ${p.journal}</div>
        <div class="paper-tags">${(p.tags ?? []).map(t => `<span class="tag tag-cyan">${t}</span>`).join('')}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
        <div class="paper-score">
          <span style="color:var(--gold);font-size:16px;font-weight:700;">${p.score ?? '—'}</span>
          <span style="font-size:9px;color:var(--text-faint);">评分</span>
        </div>
        <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:2px 6px;"
            onclick="window.__literature?.showCitePanel(${p.id})">引用</button>
          <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:2px 6px;color:var(--rose);"
            onclick="window.__literature?.removePaper(${p.id})">删除</button>
        </div>
      </div>
    </div>`).join('');
}

function _search(q) {
  const card = document.getElementById('paper-list-card');
  if (!card) return;
  const list = filterPapers(q);
  card.innerHTML = `<div class="card-title">已归档 · ${list.length} 篇</div>` +
    (list.length ? _paperRows(list) : '<div style="text-align:center;color:var(--text-faint);padding:32px;">无匹配结果</div>');
}

function _filterType(type) {
  const card = document.getElementById('paper-list-card');
  if (!card) return;
  const list = filterPapers('', type);
  card.innerHTML = `<div class="card-title">已归档 · ${list.length} 篇</div>` +
    (list.length ? _paperRows(list) : '<div style="text-align:center;color:var(--text-faint);padding:32px;">暂无此类文献</div>');
}

function removePaper(id) {
  const p = getPaperById(id);
  if (!p) return;
  if (!confirm(`确认删除「${p.title}」？`)) return;
  deletePaper(id);
  _renderTab('list');
  window.__copilot?.addMessage('sys', `✓ 文献已删除。`);
}

/* ── Map tab — dynamic from real papers ── */
function _renderMap(el) {
  // Build tag frequency map from actual papers
  const tagCount = {};
  const tagPapers = {};
  PAPERS.forEach(p => {
    (p.tags ?? []).forEach(t => {
      tagCount[t] = (tagCount[t] ?? 0) + 1;
      if (!tagPapers[t]) tagPapers[t] = [];
      tagPapers[t].push(p.id);
    });
  });

  // Only show tags that appear in ≥1 paper (show all if library is small)
  const minCount = PAPERS.length >= 6 ? 2 : 1;
  const topTags = Object.entries(tagCount)
    .filter(([, c]) => c >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([tag, count]) => ({ tag, count }));

  if (topTags.length === 0) {
    el.innerHTML = `<div class="card"><div class="card-title violet">文献知识图谱</div>
      <div style="text-align:center;color:var(--text-faint);padding:40px;">
        导入更多文献后，图谱将自动生成节点和连接。
      </div></div>`;
    return;
  }

  // Layout: arrange nodes in a circle
  const W = 500, H = 300, cx = W / 2, cy = H / 2, r = 110;
  const COLORS = ['var(--gold)','var(--cyan)','var(--violet)','var(--rose)','var(--emerald)'];
  const nodes = topTags.map((t, i) => {
    const angle = (2 * Math.PI * i) / topTags.length - Math.PI / 2;
    const radius = r + (t.count > 3 ? 0 : 20);
    return {
      tag:   t.tag,
      count: t.count,
      color: COLORS[i % COLORS.length],
      x:     Math.round(cx + radius * Math.cos(angle)),
      y:     Math.round(cy + radius * Math.sin(angle)),
    };
  });

  // Edges: connect tags that share ≥1 paper
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const shared = (tagPapers[nodes[i].tag] ?? [])
        .filter(id => (tagPapers[nodes[j].tag] ?? []).includes(id));
      if (shared.length > 0) edges.push([i, j, shared.length]);
    }
  }

  el.innerHTML = `
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div class="card-title violet" style="margin-bottom:0;">文献知识图谱 · ${PAPERS.length} 篇 · ${topTags.length} 个标签</div>
        <span style="font-size:10px;color:var(--text-faint);font-family:var(--font-mono);">节点大小 = 文献数量</span>
      </div>
      <div class="kmap-container" style="position:relative;height:300px;overflow:hidden;">
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;" viewBox="0 0 ${W} ${H}">
          ${edges.map(([i, j, w]) => `
            <line x1="${nodes[i].x}" y1="${nodes[i].y}"
                  x2="${nodes[j].x}" y2="${nodes[j].y}"
                  stroke="#2a3f6a" stroke-width="${Math.min(w + 0.5, 3)}" opacity="0.6"/>`
          ).join('')}
        </svg>
        ${nodes.map(n => {
          const size = Math.min(36 + n.count * 6, 72);
          return `
            <div style="position:absolute;left:${n.x}px;top:${n.y}px;transform:translate(-50%,-50%);
              width:${size}px;height:${size}px;border-radius:50%;
              border:1.5px solid ${n.color};background:${n.color}18;
              display:flex;flex-direction:column;align-items:center;justify-content:center;
              cursor:pointer;transition:all 0.15s;font-family:var(--font-mono);"
              title="${n.count} 篇文献"
              onclick="window.__literature?._showTagPapers('${n.tag}')"
              onmouseover="this.style.background='${n.color}35'"
              onmouseout="this.style.background='${n.color}18'">
              <span style="font-size:${Math.max(8, size / 5)}px;color:${n.color};text-align:center;
                padding:2px;line-height:1.2;word-break:break-all;">${n.tag}</span>
              <span style="font-size:9px;color:${n.color};opacity:0.7;">${n.count}</span>
            </div>`;
        }).join('')}
      </div>
      <div id="tag-papers-panel" style="display:none;margin-top:12px;border-top:1px solid var(--border);padding-top:12px;"></div>
      <p style="font-size:11px;color:var(--text-faint);margin-top:8px;">点击节点查看相关文献 · 连线表示共同文献</p>
    </div>`;
}

function _showTagPapers(tag) {
  const panel = document.getElementById('tag-papers-panel');
  if (!panel) return;
  const list = PAPERS.filter(p => (p.tags ?? []).includes(tag));
  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="font-family:var(--font-mono);font-size:10px;color:var(--cyan);margin-bottom:8px;">
      「${tag}」相关文献 · ${list.length} 篇
    </div>
    ${list.map(p => `
      <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);cursor:pointer;"
        onclick="window.__literature?.openPaper(${p.id})">
        <span style="font-size:12px;color:var(--text);flex:1;">${p.title}</span>
        <span style="font-size:11px;color:var(--text-faint);flex-shrink:0;">${p.authors} · ${p.year}</span>
      </div>`).join('')}`;
}
}

/* ── Reader tab ── */
function _renderReader(el) {
  el.innerHTML = `
    <div class="card">
      <div class="card-title">🔍 精读模式</div>
      <div id="reader-content" style="background:rgba(0,0,0,0.2);border-radius:8px;padding:16px;font-size:13px;line-height:2;color:var(--text-muted);min-height:200px;">
        从文献列表中点击一篇文献进入精读模式。<br>
        精读模式支持：<strong>逐段 AI 解析</strong> · <strong>公式推导展开</strong> · <strong>关联度分析</strong>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('请帮我分析这篇文献的核心贡献和局限性', '精读模式', true)">🤖 AI 核心解析</button>
        <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('这篇文献与我的ESG研究有何关联？', '精读模式', true)">关联我的研究</button>
        <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('这篇文献引用了哪些重要前期工作？', '精读模式', true)">引用脉络</button>
      </div>
      <!-- Notes area (shown after paper is opened) -->
      <div id="reader-notes-area" style="display:none;margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:0.12em;">📝 我的笔记</div>
          <span id="note-save-status" style="font-size:10px;color:var(--text-faint);font-family:var(--font-mono);"></span>
        </div>
        <textarea id="reader-note-input"
          style="width:100%;min-height:120px;padding:10px 12px;
            background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:6px;
            font-family:var(--font-body);font-size:13px;line-height:1.8;color:var(--text);
            resize:vertical;box-sizing:border-box;outline:none;"
          placeholder="在此记录阅读笔记、核心论点、与自己研究的关联…"
          oninput="window.__literature?._onNoteInput()"></textarea>
        <div style="display:flex;align-items:center;gap:10px;margin-top:6px;">
          <span id="note-word-count" style="font-size:10px;color:var(--text-faint);font-family:var(--font-mono);">0 字</span>
          <button class="btn btn-ghost btn-sm" style="margin-left:auto;"
            onclick="window.__copilot?.askCopilot('请根据我的笔记内容，帮我提炼3个核心要点，并指出可以深入研究的方向：\n\n' + (document.getElementById('reader-note-input')?.value ?? ''), '精读笔记', true)">
            🤖 AI 提炼要点
          </button>
        </div>
      </div>

      <!-- Inline cite panel -->
      <div id="reader-cite-panel" style="display:none;margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">
        <div class="card-title rose" style="margin-bottom:8px;">引用格式</div>
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="window.__literature?.genCite('apa')">APA 7th</button>
          <button class="btn btn-ghost btn-sm" onclick="window.__literature?.genCite('bibtex')">BibTeX</button>
          <button class="btn btn-ghost btn-sm" onclick="window.__literature?.genCite('gb')">GB/T 7714</button>
        </div>
        <div id="cite-output" class="code-block" style="min-height:60px;color:var(--text-muted);font-size:11px;">选择格式后在此显示…</div>
        <button class="btn btn-ghost btn-sm" style="margin-top:8px;"
          onclick="navigator.clipboard?.writeText(document.getElementById('cite-output').textContent); window.__copilot?.addMessage('sys','✓ 引用已复制')">
          📋 复制
        </button>
      </div>
    </div>`;
}

/* ── Paper actions ── */
function openPaper(id) {
  const p = getPaperById(id);
  if (!p) return;
  switchTab('reader', document.querySelector(`#${CONTAINER} .module-tab[data-tab="reader"]`));
  const rc = document.getElementById('reader-content');
  if (rc) rc.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px;">
      <div>
        <strong style="color:var(--gold);font-size:15px;">${p.title}</strong><br>
        <span style="color:var(--text-muted);font-style:italic;">${p.authors} (${p.year})</span>
        ${p.doi ? `<br><span style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);">DOI: ${p.doi}</span>` : ''}
      </div>
      <button class="btn btn-ghost btn-sm" style="flex-shrink:0;"
        onclick="window.__literature?.showCitePanel(${p.id})">引用</button>
    </div>
    <div style="color:var(--text-muted);">${p.abstract || '（暂无摘要）'}</div>`;

  window.__literature._currentPaperId = id;

  // Show notes area and load saved note
  const notesArea = document.getElementById('reader-notes-area');
  if (notesArea) {
    notesArea.style.display = 'block';
    const noteInput = document.getElementById('reader-note-input');
    const savedNote = localStorage.getItem(`nexres:note:${id}`) ?? '';
    if (noteInput) {
      noteInput.value = savedNote;
      _updateNoteWordCount(savedNote);
    }
    const status = document.getElementById('note-save-status');
    if (status) status.textContent = savedNote ? '已有笔记 ✓' : '';
  }
}

function showCitePanel(id) {
  window.__literature._currentPaperId = id;
  if (_activeTab === 'reader') {
    const panel = document.getElementById('reader-cite-panel');
    if (panel) { panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; return; }
  }
  openPaper(id);
  setTimeout(() => {
    const panel = document.getElementById('reader-cite-panel');
    if (panel) panel.style.display = 'block';
  }, 50);
}

function genCite(fmt) {
  const id = window.__literature._currentPaperId;
  const p  = id ? getPaperById(id) : PAPERS[0];
  const out = document.getElementById('cite-output');
  if (!out || !p) return;
  if (fmt === 'apa')         out.textContent = toAPA(p);
  else if (fmt === 'bibtex') out.textContent = toBibTeX(p);
  else out.textContent = `${p.authors}. ${p.title}[M]. ${p.year}.`;
}

/* ── Notes helpers ── */
let _noteTimer = null;

function _onNoteInput() {
  const input = document.getElementById('reader-note-input');
  if (!input) return;
  _updateNoteWordCount(input.value);
  const status = document.getElementById('note-save-status');
  if (status) status.textContent = '未保存 ●';
  clearTimeout(_noteTimer);
  _noteTimer = setTimeout(_saveNote, 1500);
}

function _saveNote() {
  const id    = window.__literature._currentPaperId;
  const input = document.getElementById('reader-note-input');
  if (!id || !input) return;
  localStorage.setItem(`nexres:note:${id}`, input.value);
  const status = document.getElementById('note-save-status');
  if (status) status.textContent = '已保存 ✓';
}

function _updateNoteWordCount(text) {
  const wc = document.getElementById('note-word-count');
  if (wc) wc.textContent = `${(text ?? '').length} 字`;
}

window.__literature = {
  init, switchTab, _search, _filterType,
  openPaper, genCite, showCitePanel, removePaper,
  toggleImport, fetchDOI, saveImport,
  _showTagPapers, _onNoteInput,
  _currentPaperId: null,
};
