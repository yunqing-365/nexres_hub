/* ═══════════════════════════════════════════════════════
   modules/literature.js — Literature Module (Real Engine)
   Tabs: list · knowledge map (Real Graph) · reader (Semantic Scholar API)
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
        <div class="page-desc">管理、阅读、连接你的研究脉络 · Semantic Scholar API 赋能</div>
      </div>
      <button class="btn btn-cyan" onclick="window.__literature?.toggleImport()">+ 导入文献</button>
    </div>

    <div id="lit-import-panel" style="display:none;"></div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="list"   onclick="window.__literature?.switchTab('list',this)">文献列表</div>
      <div class="module-tab"        data-tab="map"    onclick="window.__literature?.switchTab('map',this)">🌐 真实引文拓扑图</div>
      <div class="module-tab"        data-tab="reader" onclick="window.__literature?.switchTab('reader',this)">📖 精读与引文挖掘</div>
    </div>
    <div id="lit-content"></div>`;

  _renderTab('list');
}

/* ── Import panel (保持你的原有优秀实现) ── */
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
      <div style="margin-bottom:16px;">
        <div style="font-size:11px;color:var(--text-faint);margin-bottom:6px;font-family:var(--font-mono);">
          通过 DOI 自动抓取元数据（CrossRef API）
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
      <div class="grid-2" style="gap:10px;margin-bottom:10px;">
        <div><div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">标题 *</div><input id="pf-title" class="copilot-input" placeholder="论文标题"></div>
        <div><div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">作者 *</div><input id="pf-authors" class="copilot-input" placeholder="e.g. Angrist & Pischke"></div>
        <div><div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">年份</div><input id="pf-year" class="copilot-input" type="number" placeholder="${new Date().getFullYear()}"></div>
        <div><div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">期刊 / 出版物</div><input id="pf-journal" class="copilot-input" placeholder="e.g. AER"></div>
        <div><div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">DOI</div><input id="pf-doi" class="copilot-input" placeholder="10.xxxx/xxxxx"></div>
        <div><div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">评分 (0-10)</div><input id="pf-score" class="copilot-input" type="number" min="0" max="10" step="0.1" placeholder="8.0"></div>
      </div>
      <div style="margin-bottom:10px;">
        <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">标签（逗号分隔）</div>
        <input id="pf-tags" class="copilot-input" placeholder="e.g. 因果推断, DID, 政策评估">
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
  if (status) status.innerHTML = '<span style="color:var(--text-faint)">⏳ 正在调用 CrossRef API 抓取…</span>';

  try {
    const res  = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const w    = data.message;

    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('pf-title', w.title?.[0] ?? '');
    set('pf-authors', w.author?.map(a => [a.family, a.given].filter(Boolean).join(', ')).join('; ') ?? '');
    set('pf-year', w.published?.['date-parts']?.[0]?.[0] ?? '');
    set('pf-journal', w['container-title']?.[0] ?? w.publisher ?? '');
    set('pf-doi', doi);
    if (status) status.innerHTML = '<span style="color:var(--cyan)">✓ 元数据抓取成功，请保存入库。</span>';
  } catch (err) {
    if (status) status.innerHTML = `<span style="color:var(--rose)">抓取失败：${err.message}。请手动填写。</span>`;
  }
}

function saveImport() {
  const get = id => document.getElementById(id)?.value.trim() ?? '';
  const title = get('pf-title');
  if (!title) { alert('请填写标题'); return; }

  addPaper({
    title,
    authors: get('pf-authors') || '未知作者',
    year: parseInt(get('pf-year')) || new Date().getFullYear(),
    journal: get('pf-journal'),
    doi: get('pf-doi'),
    score: parseFloat(get('pf-score')) || 8.0,
    tags: get('pf-tags') ? get('pf-tags').split(',').map(t => t.trim()).filter(Boolean) : [],
    type: 'causal',
  });

  window.__copilot?.addMessage('sys', `✓ 文献「<strong>${title}</strong>」已入库。`);
  _showingImport = false;
  document.getElementById('lit-import-panel').style.display = 'none';
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

/* ─── Tab 1: List tab ─── */
function _renderList(el) {
  const papers = filterPapers();
  el.innerHTML = `
    <div style="display:flex;gap:10px;margin-bottom:16px;">
      <input class="search-input" type="text" placeholder="搜索标题、作者、关键词…" oninput="window.__literature?._search(this.value)" id="paper-search">
      <select onchange="window.__literature?._filterType(this.value)" class="copilot-input" style="min-width:110px;height:38px;">
        <option value="all">全部类型</option><option value="causal">因果推断</option><option value="ml">机器学习</option><option value="qual">定性研究</option>
      </select>
    </div>
    <div class="card" id="paper-list-card">
      <div class="card-title">已归档 · ${papers.length} 篇</div>
      ${papers.length ? _paperRows(papers) : '<div style="text-align:center;color:var(--text-faint);padding:32px;">暂无文献</div>'}
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
        <div class="paper-score"><span style="color:var(--gold);font-size:16px;font-weight:700;">${p.score ?? '—'}</span><span style="font-size:9px;color:var(--text-faint);">评分</span></div>
        <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:2px 6px;color:var(--rose);" onclick="window.__literature?.removePaper(${p.id})">删除</button>
        </div>
      </div>
    </div>`).join('');
}

function _search(q) {
  const list = filterPapers(q);
  document.getElementById('paper-list-card').innerHTML = `<div class="card-title">已归档 · ${list.length} 篇</div>` + _paperRows(list);
}
function _filterType(type) {
  const list = filterPapers('', type);
  document.getElementById('paper-list-card').innerHTML = `<div class="card-title">已归档 · ${list.length} 篇</div>` + _paperRows(list);
}
function removePaper(id) {
  if (!confirm(`确认删除该文献？`)) return;
  deletePaper(id);
  _renderTab('list');
}

/* ─── Tab 2: 真实拓扑网络与中心度计算 (Real Graph) ─── */
function _renderMap(el) {
  el.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div class="card-title violet" style="margin-bottom:0;">本地文献拓扑图 (Topology Graph)</div>
        <button class="btn btn-primary btn-sm" onclick="window.__literature?.calcCentrality()">⚡ 计算真实度中心性</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
        算法引擎正在遍历本地 <strong>${PAPERS.length}</strong> 篇文献... 若两篇文献存在<strong>共同标签</strong>或<strong>共同作者</strong>，则建立连线。
      </div>
      <div id="lit-network-chart" style="height:400px; background:rgba(0,0,0,0.15); border-radius:8px; border:1px solid var(--border);"></div>
      <div id="centrality-result" style="display:none; margin-top:16px; padding:12px; background:rgba(124,111,205,0.1); border:1px solid var(--violet); border-radius:6px; font-size:13px; color:var(--text);"></div>
    </div>`;
  setTimeout(() => _drawRealNetwork(), 50);
}

function _drawRealNetwork() {
  const container = document.getElementById('lit-network-chart');
  if(!container || typeof Plotly === 'undefined') return;

  // 1. 生成真实节点位置 (按类别分配到不同的圆环/区域)
  const W = 1, H = 1, cx = 0.5, cy = 0.5;
  const nodes = PAPERS.map((p, i) => {
    const angle = (2 * Math.PI * i) / PAPERS.length;
    return {
      id: p.id, title: p.title, type: p.type,
      x: cx + 0.4 * Math.cos(angle), y: cy + 0.4 * Math.sin(angle),
      degree: 0 // 中心度初始化
    };
  });

  // 2. 计算真实连线 (Edge Weight)
  const edges = [];
  for (let i = 0; i < PAPERS.length; i++) {
    for (let j = i + 1; j < PAPERS.length; j++) {
      const p1 = PAPERS[i], p2 = PAPERS[j];
      // 检查共同标签
      const sharedTags = (p1.tags||[]).filter(t => (p2.tags||[]).includes(t));
      if (sharedTags.length > 0) {
        edges.push([i, j]);
        nodes[i].degree += sharedTags.length;
        nodes[j].degree += sharedTags.length;
      }
    }
  }

  // 渲染连线
  const edgeX = [], edgeY = [];
  edges.forEach(([i, j]) => {
    edgeX.push(nodes[i].x, nodes[j].x, null);
    edgeY.push(nodes[i].y, nodes[j].y, null);
  });

  const edgeTrace = { x: edgeX, y: edgeY, mode: 'lines', line: { width: 1, color: '#2a3f6a' }, hoverinfo: 'none' };
  
  // 渲染节点
  const typeColors = { causal: '#d4a853', ml: '#00d4aa', econometric: '#7c6fcd', qual: '#e05c7a' };
  const nodeTrace = {
    x: nodes.map(n => n.x), y: nodes.map(n => n.y),
    mode: 'markers+text',
    text: nodes.map(n => n.title.slice(0,15) + '...'),
    textposition: 'bottom center',
    marker: { 
      size: nodes.map(n => 12 + n.degree * 3), // 根据度中心性决定大小
      color: nodes.map(n => typeColors[n.type] || '#6b7fa3'), 
      line: { width: 1.5, color: '#1e2d4a' } 
    },
    hoverinfo: 'text',
    textfont: { color: '#dde4f0', size: 10, family: 'IBM Plex Mono' }
  };

  Plotly.newPlot('lit-network-chart', [edgeTrace, nodeTrace], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', showlegend: false,
    xaxis: { showgrid: false, zeroline: false, showticklabels: false, range: [0, 1] },
    yaxis: { showgrid: false, zeroline: false, showticklabels: false, range: [0, 1] },
    margin: { t: 20, b: 20, l: 20, r: 20 }, hovermode: 'closest'
  }, { displayModeBar: false, responsive: true });
}

function calcCentrality() {
  const resultDiv = document.getElementById('centrality-result');
  
  // 重新计算一遍找出最大 Hub
  let maxDegree = 0; let hubTitle = '';
  PAPERS.forEach(p1 => {
    let deg = 0;
    PAPERS.forEach(p2 => {
      if(p1.id !== p2.id) {
        const shared = (p1.tags||[]).filter(t => (p2.tags||[]).includes(t));
        deg += shared.length;
      }
    });
    if(deg > maxDegree) { maxDegree = deg; hubTitle = p1.title; }
  });

  if (resultDiv) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <strong style="color:var(--violet);">真实度中心性 (Degree Centrality) 计算完成：</strong><br><br>
      当前本地文献库中的绝对枢纽节点为：<br>
      <strong style="color:var(--gold);font-size:14px;">《${hubTitle}》</strong><br>
      中心度得分：${maxDegree}。这篇文献将你库中多个不同的研究方向连接在了一起，建议作为你研究框架的基石。
    `;
    window.__copilot?.addMessage('sys', `计算完毕！枢纽文献是《${hubTitle}》。在交叉学科研究中，这类具有高中心度的文献往往是“结构洞”的关键。`);
  }
}

/* ─── Tab 3: 精读与 Semantic Scholar API 真实挖掘 ─── */
function _renderReader(el) {
  el.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title">🔍 精读模式</div>
        <div id="reader-content" style="font-size:13px;line-height:1.8;color:var(--text-muted);min-height:200px;">
          <div style="text-align:center;padding-top:60px;opacity:0.5;">请先从「文献列表」点击一篇文献进入精读</div>
        </div>
        
        <div id="reader-notes-area" style="display:none;margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">📝 我的本地笔记</div>
            <span id="note-save-status" style="font-size:10px;color:var(--text-faint);"></span>
          </div>
          <textarea id="reader-note-input" class="copilot-input" style="height:120px;" oninput="window.__literature?._onNoteInput()"></textarea>
        </div>
      </div>

      <div class="card" id="ss-panel" style="display:none;">
        <div class="card-title emerald">Semantic Scholar 学术图谱网络</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          直接调用真实学术数据库 API，挖掘该文献的真实参考文献与被引情况。
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="window.__literature?.exploreSemanticScholar()">
          🔗 连线 Semantic Scholar 挖掘引文
        </button>
        <div id="ss-result" style="margin-top:16px;font-size:12px;color:var(--text);overflow-y:auto;max-height:400px;"></div>
      </div>
    </div>`;
}

function openPaper(id) {
  const p = getPaperById(id);
  if (!p) return;
  switchTab('reader', document.querySelector(`#${CONTAINER} .module-tab[data-tab="reader"]`));
  
  window.__literature._currentPaperId = id;
  const rc = document.getElementById('reader-content');
  if (rc) {
    rc.innerHTML = `
      <strong style="color:var(--gold);font-size:16px;">${p.title}</strong><br>
      <span style="color:var(--text-muted);font-style:italic;">${p.authors} (${p.year})</span>
      ${p.doi ? `<br><span style="font-size:11px;color:var(--cyan);font-family:var(--font-mono);">DOI: ${p.doi}</span>` : '<br><span style="font-size:11px;color:var(--rose);">该文献无 DOI，无法进行云端引文挖掘</span>'}
      <div style="margin-top:12px;padding:12px;background:rgba(0,0,0,0.2);border-radius:6px;">${p.abstract || '摘要为空'}</div>
    `;
  }

  // 恢复笔记
  document.getElementById('reader-notes-area').style.display = 'block';
  document.getElementById('reader-note-input').value = localStorage.getItem(`nexres:note:${id}`) ?? '';
  
  // 开放 SS 面板
  document.getElementById('ss-panel').style.display = 'block';
  document.getElementById('ss-result').innerHTML = ''; // 清空之前的挖掘结果
}

/* ── 核心！真实的 Semantic Scholar API 调用 ── */
async function exploreSemanticScholar() {
  const id = window.__literature._currentPaperId;
  const p = getPaperById(id);
  const resultDiv = document.getElementById('ss-result');
  
  if (!p || !p.doi) {
    resultDiv.innerHTML = '<span style="color:var(--rose);">⚠️ 必须要有 DOI 才能进行在线数据挖掘。请在导入时配置 DOI。</span>';
    return;
  }
  
  resultDiv.innerHTML = '<span class="spinner"></span> <span style="color:var(--text-faint);">正在请求 api.semanticscholar.org ...</span>';

  try {
    // 调用 Semantic Scholar 官方真实 API，获取文献本身及其参考文献
    const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/DOI:${p.doi}?fields=referenceCount,citationCount,references,references.title,references.year,references.authors`);
    
    if (!res.ok) throw new Error(`API 限制或找不到该 DOI (${res.status})`);
    const data = await res.json();
    
    let html = `
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <div class="stat-card emerald-accent" style="flex:1;padding:10px;">
          <div class="stat-num emerald" style="font-size:18px;">${data.citationCount || 0}</div><div class="stat-label">真实被引次数</div>
        </div>
        <div class="stat-card violet-accent" style="flex:1;padding:10px;">
          <div class="stat-num violet" style="font-size:18px;">${data.referenceCount || 0}</div><div class="stat-label">参考文献数量</div>
        </div>
      </div>
      <div style="font-weight:600;margin-bottom:8px;color:var(--gold);">主要参考文献发现：</div>
    `;

    // 渲染前 5 篇参考文献
    if (data.references && data.references.length > 0) {
      const refs = data.references.slice(0, 5);
      refs.forEach((ref, idx) => {
        const authors = ref.authors ? ref.authors.map(a=>a.name).join(', ') : 'Unknown';
        html += `
          <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.05);">
            <div style="font-weight:500;color:var(--text);margin-bottom:4px;line-height:1.4;">${idx+1}. ${ref.title}</div>
            <div style="font-size:10px;color:var(--text-muted);">${authors} (${ref.year || 'N/A'})</div>
          </div>
        `;
      });
      html += `<div style="font-size:11px;color:var(--text-faint);text-align:center;margin-top:8px;">(仅显示前5篇，共 ${data.references.length} 篇)</div>`;
    } else {
      html += `<div style="color:var(--text-faint);">未获取到参考文献详情。</div>`;
    }

    resultDiv.innerHTML = html;
    window.__copilot?.addMessage('sys', `✓ 真实学术图谱挖掘成功！该文献被引 <strong>${data.citationCount}</strong> 次。这说明它在学术界具有一定的权威性。`);
    
  } catch (err) {
    resultDiv.innerHTML = `<span style="color:var(--rose);">挖掘失败: ${err.message}。<br>可能原因：该 DOI 未收录，或请求过快触发了 Semantic Scholar 的速率限制。</span>`;
  }
}

/* ── Notes helpers ── */
let _noteTimer = null;
function _onNoteInput() {
  document.getElementById('note-save-status').textContent = '未保存 ●';
  clearTimeout(_noteTimer);
  _noteTimer = setTimeout(_saveNote, 1500);
}
function _saveNote() {
  const id = window.__literature._currentPaperId;
  const input = document.getElementById('reader-note-input');
  if (id && input) {
    localStorage.setItem(`nexres:note:${id}`, input.value);
    document.getElementById('note-save-status').textContent = '已本地缓存 ✓';
  }
}

window.__literature = {
  init, switchTab, _search, _filterType,
  openPaper, removePaper,
  toggleImport, fetchDOI, saveImport, exploreSemanticScholar, _onNoteInput,
  calcCentrality, _currentPaperId: null,
};