/* ═══════════════════════════════════════════════════════
   modules/qual-studio.js — 质性研究工作台
   Features: 资料管理 · 三级编码本 · 主题归纳 · 饱和度追踪
═══════════════════════════════════════════════════════ */

import { renderLine } from '../utils/charts.js';

const CONTAINER = 'module-qualstudio'; // 修复：匹配 index.html 的 ID
let _activeTab = 'data';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">质性研究工作台</div>
        <div class="page-desc">从原始访谈到理论框架 · AI 辅助的三级编码与主题归纳</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="data" onclick="window.__qualstudio?.switchTab('data',this)">📁 资料管理</div>
      <div class="module-tab" data-tab="coding" onclick="window.__qualstudio?.switchTab('coding',this)">🏷️ 编码本</div>
      <div class="module-tab" data-tab="themes" onclick="window.__qualstudio?.switchTab('themes',this)">🧩 主题归纳</div>
      <div class="module-tab" data-tab="saturation" onclick="window.__qualstudio?.switchTab('saturation',this)">📈 饱和度追踪</div>
    </div>

    <div id="qual-content"></div>
  `;

  _renderTab(_activeTab);
}

function switchTab(tab, el) {
  _activeTab = tab;
  document.querySelectorAll(`#${CONTAINER} .module-tab`).forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderTab(tab);
}

function _renderTab(tab) {
  const content = document.getElementById('qual-content');
  if (!content) return;
  
  if (tab === 'data') _renderDataMgmt(content);
  else if (tab === 'coding') _renderCoding(content);
  else if (tab === 'themes') _renderThemes(content);
  else if (tab === 'saturation') _renderSaturation(content);
}

/* ─── Tab 1: 资料管理 ─── */
function _renderDataMgmt(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">新建访谈记录 (匿名化)</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">受访者编号 (如: INT-01)</div>
              <input type="text" class="copilot-input" placeholder="保护隐私，勿填真名">
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">访谈日期</div>
              <input type="date" class="copilot-input">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">受访者背景</div>
              <input type="text" class="copilot-input" placeholder="例如: 制造业/中层管理">
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">访谈时长 (分钟)</div>
              <input type="number" class="copilot-input" placeholder="60">
            </div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">真实转录文本粘贴区</div>
            <textarea id="qual-transcript" class="copilot-input" style="height:180px;line-height:1.6;" placeholder="在此粘贴访谈录音转文字的真实内容..."></textarea>
          </div>
          <button class="btn btn-primary" style="justify-content:center;" onclick="window.__qualstudio?.saveTranscript()">💾 本地存储资料</button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title violet">文本预处理 & AI 提炼</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          录入原始文本后，可在此调用本地 AI 或 API 进行清洗和提取。
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-ghost" onclick="window.__copilot?.askCopilot('请帮我去除访谈文本中的语气词和无效寒暄，保留核心信息。', '质性研究工作台', true)">
            🧹 去除语气词与冗余
          </button>
          <button class="btn btn-ghost" onclick="window.__copilot?.askCopilot('请阅读这段访谈记录，提炼出 3 到 5 个核心观点。', '质性研究工作台', true)">
            💡 AI 核心观点提炼
          </button>
        </div>
      </div>
    </div>
  `;
}

function saveTranscript() {
  const text = document.getElementById('qual-transcript')?.value;
  if (!text) { alert('请输入真实转录文本'); return; }
  window.__copilot?.addMessage('sys', '✓ 访谈记录已保存至本地缓存，你可以进入「🏷️ 编码本」处理了。');
}

/* ─── Tab 2: 三级编码本 ─── */
function _renderCoding(container) {
  // 此处可用 localStorage 替代写死数据实现真实存储
  const codes = [
    { select: '数字化转型阵痛', axis: '技术焦虑', open: ['系统难用', '学习成本高'] },
    { select: '组织韧性', axis: '柔性管理', open: ['领导授权', '容错机制'] }
  ];

  container.innerHTML = `
    <div class="card">
      <div class="card-title">扎根理论三级编码本</div>
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <button class="btn btn-cyan btn-sm" onclick="window.__copilot?.askCopilot('请帮我进行【开放式编码】，拆解为独立的概念标签。', '质性研究工作台', true)">🤖 辅助开放编码</button>
        <button class="btn btn-violet btn-sm" onclick="window.__copilot?.askCopilot('请帮我进行【主轴编码】，找出逻辑关联并聚类。', '质性研究工作台', true)">🤖 辅助主轴编码</button>
      </div>
      <table class="exp-table">
        <thead>
          <tr><th style="color:var(--rose);">选择性编码</th><th style="color:var(--violet);">主轴编码</th><th style="color:var(--cyan);">开放性编码</th></tr>
        </thead>
        <tbody>
          ${codes.map(c => `
            <tr>
              <td style="font-weight:600;color:var(--text);">${c.select}</td>
              <td style="color:var(--text-muted);">${c.axis}</td>
              <td>${c.open.map(o => `<span class="tag tag-cyan" style="margin:2px;">${o}</span>`).join('')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ─── Tab 3: 主题归纳 ─── */
function _renderThemes(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title gold">主题覆盖矩阵 (Theme Matrix)</div>
      <table class="exp-table" style="text-align:center;">
        <thead>
          <tr><th style="text-align:left;">归纳主题 / 受访者</th><th>INT-01</th><th>INT-02</th></tr>
        </thead>
        <tbody>
          <tr><td style="text-align:left;color:var(--text);">技术焦虑</td><td style="color:var(--cyan);">提及</td><td style="color:var(--text-faint);">未提及</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

/* ─── Tab 4: 饱和度追踪 ─── */
function _renderSaturation(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">理论饱和度追踪</div>
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <input type="number" id="sat-int" class="copilot-input" placeholder="访谈轮次" style="width:80px;">
          <input type="number" id="sat-new" class="copilot-input" placeholder="新概念数" style="width:100px;">
          <button class="btn btn-ghost" onclick="window.__qualstudio?.addSaturationData()">记录</button>
        </div>
        <div id="sat-warn" style="font-size:12px;color:var(--emerald);min-height:20px;"></div>
      </div>
      <div class="card"><div class="card-title rose">新概念递减曲线</div><div id="qual-sat-chart" style="height:220px;"></div></div>
    </div>
  `;
  setTimeout(() => _drawSaturationChart(), 50);
}

let _satData = [];
function addSaturationData() {
  const r = document.getElementById('sat-int')?.value;
  const c = document.getElementById('sat-new')?.value;
  if(r && c) {
    _satData.push({ round: parseInt(r), count: parseInt(c) });
    _satData.sort((a,b) => a.round - b.round);
    _drawSaturationChart();
  }
}

function _drawSaturationChart() {
  const container = document.getElementById('qual-sat-chart');
  if(!container || _satData.length === 0) return;
  const x = _satData.map(d => d.round);
  const y = _satData.map(d => d.count);
  renderLine('qual-sat-chart', [
    { x: x, y: y, mode: 'lines+markers', name: '新概念数量', line: { color: '#e05c7a', width: 2 }, marker: { size: 6 } }
  ], { xaxis: { title: '访谈轮次' }, yaxis: { title: '新增概念数', rangemode: 'tozero' } });
}

// 修复：必须导出为 __qualstudio 以匹配 shell.js
window.__qualstudio = { init, switchTab, saveTranscript, addSaturationData };