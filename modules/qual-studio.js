/* ═══════════════════════════════════════════════════════
   modules/qual-studio.js — 质性研究工作台
   Features: 资料管理 · 三级编码本 · 主题归纳 · 饱和度追踪
═══════════════════════════════════════════════════════ */

import { renderLine } from '../utils/charts.js';

const CONTAINER = 'module-qual-studio';
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
      <div class="module-tab active" data-tab="data" onclick="window.__qualStudio?.switchTab('data',this)">📁 资料管理</div>
      <div class="module-tab" data-tab="coding" onclick="window.__qualStudio?.switchTab('coding',this)">🏷️ 编码本</div>
      <div class="module-tab" data-tab="themes" onclick="window.__qualStudio?.switchTab('themes',this)">🧩 主题归纳</div>
      <div class="module-tab" data-tab="saturation" onclick="window.__qualStudio?.switchTab('saturation',this)">📈 饱和度追踪</div>
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
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">受访者背景 (行业/职级等)</div>
              <input type="text" class="copilot-input" placeholder="例如: 制造业/中层管理">
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">访谈时长 (分钟)</div>
              <input type="number" class="copilot-input" placeholder="60">
            </div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">转录文本粘贴区</div>
            <textarea id="qual-transcript" class="copilot-input" style="height:180px;line-height:1.6;" placeholder="在此粘贴访谈录音转文字的内容..."></textarea>
          </div>
          <button class="btn btn-primary" style="justify-content:center;" onclick="window.__qualStudio?.saveTranscript()">💾 存入资料库</button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title violet">文本预处理 & AI 提炼</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          录入原始文本后，可在此进行初步的清洗和结构化提取。
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-ghost" onclick="window.__copilot?.askCopilot('请帮我去除这段访谈文本中的语气词（如“啊”、“那个”）、重复结巴和无效寒暄，保留核心信息，但绝对不要改变受访者的原意。')">
            🧹 自动去除语气词与冗余
          </button>
          <button class="btn btn-ghost" onclick="window.__copilot?.askCopilot('请阅读这段访谈记录，帮我提炼出受访者表达的 3 到 5 个核心观点，并用一句话概括每个观点。')">
            💡 AI 核心观点提炼
          </button>
          <button class="btn btn-ghost" onclick="window.__copilot?.askCopilot('在这段访谈中，受访者是否表现出了强烈的情感倾向（如焦虑、抗拒、积极）？请找出对应的句子作为证据。')">
            🎭 情感与态度侦测
          </button>
        </div>
      </div>
    </div>
  `;
}

function saveTranscript() {
  const text = document.getElementById('qual-transcript')?.value;
  if (!text) { alert('请输入转录文本'); return; }
  window.__copilot?.addMessage('sys', '✓ 访谈记录已保存。你可以切换到「🏷️ 编码本」进行逐句打标签了。');
}

/* ─── Tab 2: 三级编码本 ─── */
function _renderCoding(container) {
  // 模拟扎根理论三级编码结构
  const codes = [
    { select: '数字化转型阵痛', axis: '技术焦虑', open: ['系统难用', '学习成本高', '老员工抗拒'] },
    { select: '数字化转型阵痛', axis: '流程冲突', open: ['线上线下两套账', '跨部门推诿'] },
    { select: '组织韧性', axis: '柔性管理', open: ['领导授权', '容错机制'] }
  ];

  container.innerHTML = `
    <div class="card">
      <div class="card-title">扎根理论 (Grounded Theory) 三级编码本</div>
      
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <button class="btn btn-cyan btn-sm" onclick="window.__copilot?.askCopilot('我有一段访谈文本，请帮我进行【开放式编码】（Open Coding），将其拆解为独立的概念标签，尽量使用受访者的原话（本土概念）。')">
          🤖 AI 辅助开放编码
        </button>
        <button class="btn btn-violet btn-sm" onclick="window.__copilot?.askCopilot('我有以下开放编码标签，请帮我进行【主轴编码】（Axial Coding），找出它们之间的逻辑关联（如因果、条件、策略），并将它们聚类为更高的类属。')">
          🤖 AI 辅助主轴编码
        </button>
        <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('如何计算两名研究者独立编码的信度（Cohen\\'s Kappa）？请给出具体的计算步骤或工具推荐。')">
          🧮 编码信度 (IRR) 计算
        </button>
      </div>

      <table class="exp-table">
        <thead>
          <tr>
            <th style="color:var(--rose);">选择性编码 (核心范畴)</th>
            <th style="color:var(--violet);">主轴编码 (副范畴)</th>
            <th style="color:var(--cyan);">开放性编码 (初始概念)</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${codes.map(c => `
            <tr>
              <td style="font-weight:600;color:var(--text);">${c.select}</td>
              <td style="color:var(--text-muted);">${c.axis}</td>
              <td>${c.open.map(o => `<span class="tag tag-cyan" style="margin:2px;">${o}</span>`).join('')}</td>
              <td><button class="btn btn-ghost btn-sm">溯源原文</button></td>
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
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
        展示不同受访者对核心主题的提及情况，有助于判断理论的普适性或异质性。
      </div>
      
      <table class="exp-table" style="text-align:center;">
        <thead>
          <tr>
            <th style="text-align:left;">归纳主题 / 受访者</th>
            <th>INT-01 (高管)</th>
            <th>INT-02 (基层)</th>
            <th>INT-03 (中层)</th>
            <th>INT-04 (基层)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="text-align:left;color:var(--text);">技术焦虑</td><td style="color:var(--cyan);">提及 (高频)</td><td style="color:var(--cyan);">提及</td><td style="color:var(--text-faint);">未提及</td><td style="color:var(--cyan);">提及</td></tr>
          <tr><td style="text-align:left;color:var(--text);">流程重组阵痛</td><td style="color:var(--text-faint);">未提及</td><td style="color:var(--cyan);">提及</td><td style="color:var(--cyan);">提及 (高频)</td><td style="color:var(--cyan);">提及</td></tr>
          <tr><td style="text-align:left;color:var(--text);">管理层支持不足</td><td style="color:var(--text-faint);">未提及</td><td style="color:var(--rose);">强烈抱怨</td><td style="color:var(--cyan);">提及</td><td style="color:var(--rose);">强烈抱怨</td></tr>
        </tbody>
      </table>

      <div style="margin-top:20px;padding-top:16px;border-top:1px dashed var(--border);">
        <button class="btn btn-gold" onclick="window.__copilot?.askCopilot('请根据上述的主题覆盖矩阵，帮我生成一段描述性的理论框架段落，特别指出不同职级员工（高管 vs 基层）在认知上的差异。')">
          🤖 AI 生成理论框架草案
        </button>
      </div>
    </div>
  `;
}

/* ─── Tab 4: 饱和度追踪 ─── */
function _renderSaturation(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">理论饱和度追踪</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          理论饱和（Theoretical Saturation）是停止访谈的重要标准：当新加入的访谈不再产生新的概念或逻辑时，即达到饱和。
        </div>
        
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <input type="number" id="sat-int" class="copilot-input" placeholder="访谈轮次" style="width:80px;">
          <input type="number" id="sat-new" class="copilot-input" placeholder="提取的新概念数量" style="width:140px;">
          <button class="btn btn-ghost" onclick="window.__qualStudio?.addSaturationData()">记录</button>
        </div>
        
        <div id="sat-warn" style="font-size:12px;color:var(--emerald);min-height:20px;"></div>
      </div>
      
      <div class="card">
        <div class="card-title rose">新概念递减曲线</div>
        <div id="qual-sat-chart" style="height:220px;"></div>
      </div>
    </div>
  `;
  
  setTimeout(() => _drawSaturationChart(), 50);
}

let _satData = [
  { round: 1, count: 24 },
  { round: 2, count: 18 },
  { round: 3, count: 11 },
  { round: 4, count: 7 },
  { round: 5, count: 3 }
];

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
  if(!container) return;
  
  const x = _satData.map(d => d.round);
  const y = _satData.map(d => d.count);
  
  renderLine('qual-sat-chart', [
    { x: x, y: y, mode: 'lines+markers', name: '新概念数量', line: { color: '#e05c7a', width: 2 }, marker: { size: 6 } }
  ], {
    xaxis: { title: '访谈轮次 (N)' },
    yaxis: { title: '新增初始概念数', rangemode: 'tozero' },
  });
  
  const lastVal = y[y.length - 1];
  const warn = document.getElementById('sat-warn');
  if(warn) {
    if(lastVal <= 2) {
      warn.innerHTML = `✓ 最新一轮仅产生 ${lastVal} 个新概念，<strong>已接近或达到理论饱和</strong>，可以考虑停止数据收集。`;
    } else {
      warn.innerHTML = '';
    }
  }
}

window.__qualStudio = { init, switchTab, saveTranscript, addSaturationData };