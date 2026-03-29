/* ═══════════════════════════════════════════════════════
   modules/causal-engine.js — 因果计算引擎 (Causal Engine)
   Features: 有向无环图 (DAG) 偏误分析 · 交互式平行趋势检验
═══════════════════════════════════════════════════════ */

import { BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-causal-engine';
let _activeTab = 'dag';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">因果计算引擎 (Causal Engine)</div>
        <div class="page-desc">告别“见变量就加”的盲目控制，利用 DAG 与事件研究法实现精准因果识别。</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="dag" onclick="window.__causalEngine?.switchTab('dag',this)">🔗 有向无环图 (DAG) 分析</div>
      <div class="module-tab" data-tab="eventstudy" onclick="window.__causalEngine?.switchTab('eventstudy',this)">📊 动态平行趋势 (Event Study)</div>
    </div>

    <div id="causal-content"></div>
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
  const content = document.getElementById('causal-content');
  if (!content) return;
  
  if (tab === 'dag') _renderDAG(content);
  else if (tab === 'eventstudy') _renderEventStudy(content);
}

/* ─── Tab 1: 有向无环图 (DAG) 偏误分析 ─── */
function _renderDAG(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">因果路径结构 (Causal Graph)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          假设我们要研究 <strong>ESG 评级 (X)</strong> 对 <strong>企业价值 (Y)</strong> 的真实因果效应。<br>
          图中有另外两个变量：<strong>企业规模 (C)</strong> 和 <strong>媒体报道 (M)</strong>。
        </div>
        
        <div style="position:relative; height:200px; background:rgba(0,0,0,0.2); border-radius:8px; border:1px solid var(--border); margin-bottom:20px;">
          <svg style="position:absolute; top:0; left:0; width:100%; height:100%;">
            <line x1="250" y1="40" x2="110" y2="120" stroke="var(--text-faint)" stroke-width="2" marker-end="url(#arrow)" />
            <line x1="250" y1="40" x2="390" y2="120" stroke="var(--text-faint)" stroke-width="2" marker-end="url(#arrow)" />
            <line x1="120" y1="140" x2="380" y2="140" stroke="var(--gold)" stroke-width="3" marker-end="url(#arrow-gold)" stroke-dasharray="5,5" />
            <line x1="110" y1="160" x2="250" y2="240" stroke="var(--text-faint)" stroke-width="2" marker-end="url(#arrow)" />
            <line x1="390" y1="160" x2="250" y2="240" stroke="var(--text-faint)" stroke-width="2" marker-end="url(#arrow)" />
            
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="var(--text-faint)" />
              </marker>
              <marker id="arrow-gold" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="var(--gold)" />
              </marker>
            </defs>
          </svg>
          
          <div style="position:absolute; top:20px; left:250px; transform:translate(-50%,0); background:var(--card); padding:6px 12px; border:1px solid var(--violet); border-radius:20px; color:var(--violet); font-size:12px; font-weight:bold;">企业规模 (C)</div>
          <div style="position:absolute; top:125px; left:100px; transform:translate(-50%,0); background:var(--card); padding:6px 12px; border:1px solid var(--cyan); border-radius:20px; color:var(--cyan); font-size:12px; font-weight:bold;">ESG 评级 (X)</div>
          <div style="position:absolute; top:125px; left:400px; transform:translate(-50%,0); background:var(--card); padding:6px 12px; border:1px solid var(--emerald); border-radius:20px; color:var(--emerald); font-size:12px; font-weight:bold;">企业价值 (Y)</div>
          <div style="position:absolute; top:230px; left:250px; transform:translate(-50%,0); background:var(--card); padding:6px 12px; border:1px solid var(--rose); border-radius:20px; color:var(--rose); font-size:12px; font-weight:bold;">媒体报道 (M)</div>
        </div>

        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">请勾选你在回归模型中打算<strong>控制 (Control)</strong> 的变量：</div>
        <div style="display:flex; gap:16px;">
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="checkbox" id="ctrl-c" onchange="window.__causalEngine?.analyzeDAG()"> 控制「企业规模 (C)」
          </label>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="checkbox" id="ctrl-m" onchange="window.__causalEngine?.analyzeDAG()"> 控制「媒体报道 (M)」
          </label>
        </div>
      </div>

      <div class="card">
        <div class="card-title violet">因果识别诊断报告</div>
        <div id="dag-result" style="font-size:13px; line-height:1.8; color:var(--text); padding:16px; background:rgba(0,0,0,0.2); border-radius:8px; border:1px solid var(--border); min-height:220px;">
          请在左侧勾选你打算控制的变量，系统将分析你的回归模型是否存在偏差。
        </div>
        
        <div style="margin-top:16px; border-top:1px dashed var(--border); padding-top:16px;">
          <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('在实证经济学中，什么是“混淆偏误 (Confounding Bias)”和“碰撞子偏差 (Collider Bias)”？为什么盲目加入所有控制变量（即“厨房水槽式回归”）是错误的？', '因果引擎', true)">
            🤖 问 AI：控制变量该怎么选？
          </button>
        </div>
      </div>
    </div>
  `;
  analyzeDAG();
}

function analyzeDAG() {
  const ctrlC = document.getElementById('ctrl-c')?.checked;
  const ctrlM = document.getElementById('ctrl-m')?.checked;
  const resultEl = document.getElementById('dag-result');
  if (!resultEl) return;

  let html = '';

  if (ctrlC && !ctrlM) {
    html = `
      <div style="color:var(--emerald); font-size:16px; font-weight:bold; margin-bottom:8px;">✅ 因果效应已成功识别！</div>
      <div><strong>诊断分析：</strong></div>
      <ul style="color:var(--text-muted); padding-left:20px;">
        <li>你控制了「企业规模(C)」，关闭了 <span style="color:var(--violet);">X ← C → Y</span> 这条混淆的<strong>后门路径 (Backdoor Path)</strong>。</li>
        <li>你没有控制「媒体报道(M)」，避免了打开碰撞子路径。</li>
        <li>此时，X 对 Y 的回归系数代表了真实的因果效应！</li>
      </ul>
    `;
  } else if (!ctrlC && !ctrlM) {
    html = `
      <div style="color:var(--rose); font-size:16px; font-weight:bold; margin-bottom:8px;">❌ 存在混淆偏误 (Confounding Bias)</div>
      <div><strong>诊断分析：</strong></div>
      <ul style="color:var(--text-muted); padding-left:20px;">
        <li>「企业规模(C)」同时影响 X 和 Y，是一条未被阻断的<strong>后门路径</strong> (<span style="color:var(--violet);">X ← C → Y</span>)。</li>
        <li>如果不控制 C，你观察到的 X 和 Y 的相关性，部分是由大企业本身更容易获得高 ESG 且价值更高导致的（虚假相关）。</li>
      </ul>
      <div style="color:var(--gold); font-size:12px; margin-top:8px;">💡 建议：请勾选控制「企业规模 (C)」。</div>
    `;
  } else if (ctrlM) {
    html = `
      <div style="color:var(--rose); font-size:16px; font-weight:bold; margin-bottom:8px;">❌ 引入了碰撞子偏差 (Collider Bias)</div>
      <div><strong>诊断分析：</strong></div>
      <ul style="color:var(--text-muted); padding-left:20px;">
        <li>「媒体报道(M)」是由 X 和 Y 共同导致的（即 <strong>碰撞子 Collider</strong>：<span style="color:var(--rose);">X → M ← Y</span>）。</li>
        <li><strong>警告：</strong>控制碰撞子会强行在 X 和 Y 之间打开一条虚假的非因果路径！这会导致原本没有关系的变量变得相关，或者扭曲原有的因果效应（也叫伯克森悖论）。</li>
        ${!ctrlC ? '<li>同时，你也没有阻断由 C 带来的后门路径。</li>' : ''}
      </ul>
      <div style="color:var(--gold); font-size:12px; margin-top:8px;">💡 建议：永远不要控制受处理变量 (X) 和结果变量 (Y) 共同影响的下游变量！</div>
    `;
  }

  resultEl.innerHTML = html;
}

/* ─── Tab 2: 交互式平行趋势 (Event Study) ─── */
function _renderEventStudy(container) {
  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div class="card-title gold" style="margin-bottom:0;">双重差分法 (DID) 动态效应与平行趋势检验</div>
        <button class="btn btn-primary btn-sm" onclick="window.__causalEngine?.runEventStudy()">▶ 运行 Event Study 回归</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;margin-top:8px;">
        展示政策实施前后各期的动态处理效应（含 95% 置信区间）。检验政策前系数是否显著异于 0（平行趋势），以及政策后效应的持续性。
      </div>
      
      <div id="event-study-chart" style="height:350px; background:rgba(0,0,0,0.1); border-radius:8px; border:1px solid var(--border);"></div>
      
      <div style="margin-top:16px; display:flex; gap:10px;">
        <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('在这张平行趋势图中，政策发生前（Pre-treatment）的系数置信区间包含了 0，这意味着什么？政策发生后（Post-treatment）的系数呈现出什么趋势？这能支持双重差分法（DID）的有效性吗？', '因果引擎', true)">
          🤖 AI 解读平行趋势图
        </button>
      </div>
    </div>
  `;
  setTimeout(() => runEventStudy(true), 50);
}

function runEventStudy(isInit = false) {
  const container = document.getElementById('event-study-chart');
  if(!container || typeof Plotly === 'undefined') return;

  const periods = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  const coefs = [0.01, -0.02, 0.03, -0.01, 0, 0.15, 0.22, 0.35, 0.40, 0.42, 0.41]; 
  const errors = [0.04, 0.05, 0.04, 0.03, 0, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10]; 
  const error_y = errors.map(se => se * 1.96);

  const trace = {
    x: periods, y: coefs, mode: 'markers+lines', name: '回归系数 (β)',
    marker: { color: '#d4a853', size: 8 }, line: { color: '#d4a853', width: 2 },
    error_y: { type: 'data', array: error_y, visible: true, color: '#6b7fa3', thickness: 1.5, width: 4 }
  };

  Plotly.newPlot('event-study-chart', [trace], {
    ...BASE_LAYOUT,
    margin: { t: 30, b: 40, l: 50, r: 20 },
    xaxis: { 
      title: '相对政策实施的年份', tickmode: 'array', tickvals: periods,
      ticktext: periods.map(p => p < 0 ? `Pre ${p}` : (p === 0 ? 'Current (0)' : `Post ${p}`)),
      gridcolor: '#1e2d4a', zerolinecolor: '#e05c7a', zerolinewidth: 2
    },
    yaxis: { title: '点估计值 (Point Estimate)', gridcolor: '#1e2d4a', zerolinecolor: '#6b7fa3', zerolinewidth: 1.5 },
    shapes: [{ type: 'line', x0: -1, x1: -1, y0: -0.2, y1: 0.6, line: { color: '#2a3f6a', width: 1, dash: 'dash' } }],
    annotations: [
      { x: -2.5, y: 0.5, xref: 'x', yref: 'y', text: '政策前 (平行趋势成立)', showarrow: false, font: { color: '#6b7fa3', size: 12 } },
      { x: 2.5, y: 0.5, xref: 'x', yref: 'y', text: '政策后 (处理效应显现)', showarrow: false, font: { color: '#00d4aa', size: 12 } }
    ]
  }, BASE_CONFIG);

  if(!isInit) {
    window.__copilot?.addMessage('sys', 'Event Study 回归运行完毕。注意查看图形：政策前（Pre）的系数置信区间均穿过 0 轴，说明平行趋势检验通过；政策后（Post）系数显著大于 0，说明具有正向的动态因果效应。');
  }
}

window.__causalEngine = { init, switchTab, analyzeDAG, runEventStudy };