/* ═══════════════════════════════════════════════════════
   modules/literature.js — Literature Module
   Tabs: list · knowledge map · reader · cite generator
═══════════════════════════════════════════════════════ */

import { PAPERS, filterPapers, getPaperById } from '../data/papers.js';
import { toAPA, toBibTeX } from '../utils/storage.js';

const CONTAINER = 'module-literature';
let _activeTab = 'list';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;
  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">文献星系</div>
        <div class="page-desc">管理、阅读、连接你的研究脉络</div>
      </div>
      <button class="btn btn-cyan" onclick="window.__literature?.addPaper()">+ 导入文献</button>
    </div>
    <div class="module-tabs">
      <div class="module-tab active" data-tab="list"   onclick="window.__literature?.switchTab('list',this)">文献列表</div>
      <div class="module-tab"        data-tab="map"    onclick="window.__literature?.switchTab('map',this)">知识图谱</div>
      <div class="module-tab"        data-tab="reader" onclick="window.__literature?.switchTab('reader',this)">精读模式</div>
      <div class="module-tab"        data-tab="cite"   onclick="window.__literature?.switchTab('cite',this)">引用生成</div>
    </div>
    <div id="lit-content"></div>`;

  _renderTab('list');
}

function switchTab(tab, el) {
  _activeTab = tab;
  document.querySelectorAll(`#${CONTAINER} .module-tab`).forEach(t => t.classList.remove('active'));
  el?.classList.add('active');
  _renderTab(tab);
}

function _renderTab(tab) {
  const content = document.getElementById('lit-content');
  if (!content) return;
  const renderers = { list: _renderList, map: _renderMap, reader: _renderReader, cite: _renderCite };
  (renderers[tab] ?? _renderList)(content);
}

function _renderList(el) {
  const papers = filterPapers();
  el.innerHTML = `
    <div style="display:flex;gap:10px;margin-bottom:16px;">
      <input class="search-input" type="text" placeholder="搜索标题、作者、关键词…"
        oninput="window.__literature?._search(this.value)" id="paper-search">
      <select style="min-width:110px;">
        <option>全部类型</option><option>因果推断</option><option>机器学习</option><option>计量经济</option>
      </select>
    </div>
    <div class="card" id="paper-list-card">
      <div class="card-title">已归档 · ${papers.length} 篇</div>
      ${_paperRows(papers)}
    </div>`;
}

function _paperRows(list) {
  return list.map((p, i) => `
    <div class="paper-row" onclick="window.__literature?.openPaper(${p.id})">
      <div class="paper-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="paper-info">
        <div class="paper-title">${p.title}</div>
        <div class="paper-meta">${p.authors} · ${p.year} · ${p.journal}</div>
        <div class="paper-tags">${p.tags.map(t => `<span class="tag tag-cyan">${t}</span>`).join('')}</div>
      </div>
      <div class="paper-score">
        <span style="color:var(--gold);font-size:16px;font-weight:700;">${p.score}</span>
        <span style="font-size:9px;color:var(--text-faint);">评分</span>
      </div>
    </div>`).join('');
}

function _search(q) {
  const card = document.getElementById('paper-list-card');
  if (!card) return;
  const list = filterPapers(q);
  card.innerHTML = `<div class="card-title">已归档 · ${list.length} 篇</div>` + _paperRows(list);
}

function _renderMap(el) {
  const nodes = [
    { id:'iv', label:'工具变量', color:'var(--rose)',   x:200, y:80 },
    { id:'did',label:'双重差分', color:'var(--gold)',   x:120, y:160 },
    { id:'rdd',label:'断点回归', color:'var(--gold)',   x:320, y:140 },
    { id:'rct',label:'随机对照', color:'var(--cyan)',   x:50,  y:80 },
    { id:'ols',label:'线性回归', color:'var(--violet)', x:200, y:230 },
    { id:'ml', label:'机器学习', color:'var(--cyan)',   x:380, y:220 },
  ];
  const edges = [['rct','iv'],['rct','did'],['did','ols'],['iv','ols'],['rdd','ols'],['ml','ols']];
  el.innerHTML = `
    <div class="card">
      <div class="card-title violet">概念知识图谱</div>
      <div class="kmap-container" id="kmap-wrap">
        <svg class="kmap-svg" viewBox="0 0 500 280" id="kmap-svg">
          ${edges.map(([a,b]) => {
            const na = nodes.find(n=>n.id===a), nb = nodes.find(n=>n.id===b);
            return `<line x1="${na.x+40}" y1="${na.y+14}" x2="${nb.x+40}" y2="${nb.y+14}" stroke="#2a3f6a" stroke-width="1"/>`;
          }).join('')}
        </svg>
        ${nodes.map(n => `
          <div class="kmap-node" style="left:${n.x}px;top:${n.y}px;border-color:${n.color};color:${n.color};background:${n.color}18;"
            onclick="window.__copilot?.askCopilot('请解释「${n.label}」的核心原理及其与其他方法的关系')">
            ${n.label}
          </div>`).join('')}
      </div>
      <p style="font-size:12px;color:var(--text-faint);margin-top:8px;">点击节点向 AI 提问</p>
    </div>`;
}

function _renderReader(el) {
  el.innerHTML = `
    <div class="card">
      <div class="card-title">🔍 精读模式</div>
      <div id="reader-content" style="background:rgba(0,0,0,0.2);border-radius:8px;padding:16px;font-size:13px;line-height:2;color:var(--text-muted);min-height:200px;">
        从文献列表中点击一篇文献进入精读模式。<br>
        精读模式支持：<strong>逐段 AI 解析</strong> · <strong>公式推导展开</strong> · <strong>关联度分析</strong>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('请帮我分析这篇文献的核心贡献和局限性')">AI 核心解析</button>
        <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('这篇文献与我的ESG研究有何关联？')">关联我的研究</button>
        <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('这篇文献引用了哪些重要前期工作？')">引用脉络</button>
      </div>
    </div>`;
}

function _renderCite(el) {
  el.innerHTML = `
    <div class="card">
      <div class="card-title rose">引用格式生成器</div>
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" onclick="window.__literature?.genCite('apa')">APA 7th</button>
        <button class="btn btn-ghost btn-sm" onclick="window.__literature?.genCite('bibtex')">BibTeX</button>
        <button class="btn btn-ghost btn-sm" onclick="window.__literature?.genCite('gb')">GB/T 7714</button>
      </div>
      <div id="cite-output" class="code-block" style="min-height:80px;color:var(--text-muted);">选择格式后在此显示…</div>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;"
        onclick="navigator.clipboard?.writeText(document.getElementById('cite-output').textContent); window.__copilot?.addMessage('sys','✓ 引用已复制')">
        📋 复制
      </button>
    </div>`;
}

function openPaper(id) {
  const p = getPaperById(id);
  if (!p) return;
  switchTab('reader', document.querySelector(`#${CONTAINER} .module-tab[data-tab="reader"]`));
  const rc = document.getElementById('reader-content');
  if (rc) rc.innerHTML = `
    <strong style="color:var(--gold);font-size:15px;">${p.title}</strong><br>
    <span style="color:var(--text-muted);font-style:italic;">${p.authors} (${p.year})</span>
    <div style="margin-top:14px;color:var(--text-muted);">${p.abstract}</div>`;
  window.__copilot?.askCopilot(`我正在阅读「${p.title}」（${p.authors}, ${p.year}），请帮我简要梳理其核心贡献和研究方法。`);
}

function genCite(fmt) {
  const p = PAPERS[0]; // 示例：始终引用第一篇
  const out = document.getElementById('cite-output');
  if (!out) return;
  if (fmt === 'apa')    out.textContent = toAPA(p);
  else if (fmt === 'bibtex') out.textContent = toBibTeX(p);
  else out.textContent = `${p.authors}. ${p.title}[M]. ${p.year}.`;
}

function addPaper() {
  window.__copilot?.askCopilot('我想添加一篇新文献，请帮我整理信息格式（标题、作者、年份、期刊、关键词）。');
}

window.__literature = { init, switchTab, _search, openPaper, genCite, addPaper };
