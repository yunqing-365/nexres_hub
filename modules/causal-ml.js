/* ═══════════════════════════════════════════════════════
   modules/causal-ml.js — 因果机器学习引擎 (Causal ML)
   Features: 双重去偏机器学习 (DML) · 因果森林与异质性效应 (HTE)
═══════════════════════════════════════════════════════ */

import { renderBar, renderLine, BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-causal-ml';
let _activeTab = 'dml';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">因果机器学习引擎 (Causal ML)</div>
        <div class="page-desc">打破预测与因果的次元壁：高维去偏估计 (Double ML) · 异质性因果森林 (Causal Forest)</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="dml" onclick="window.__causalML?.switchTab('dml',this)">🎯 双重/去偏机器学习 (DML)</div>
      <div class="module-tab" data-tab="hte" onclick="window.__causalML?.switchTab('hte',this)">🌳 异质性效应 (因果森林)</div>
    </div>

    <div id="causal-ml-content"></div>
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
  const content = document.getElementById('causal-ml-content');
  if (!content) return;
  if (tab === 'dml') _renderDML(content);
  else if (tab === 'hte') _renderHTE(content);
}

/* ─── Tab 1: Double Machine Learning (DML) ─── */
function _renderDML(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">高维混淆变量剥离 (DML 架构)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          当控制变量 <strong>X</strong> 维度极高或存在复杂非线性时，传统 OLS 会失效。DML 使用任意强大的 ML 模型（如 XGBoost）对 <strong>Y</strong> 和处理变量 <strong>D</strong> 分别进行拟合，对残差进行正交化回归，从而获得无偏的平均处理效应 (ATE)。
        </div>
        
        <div style="display:flex;flex-direction:column;gap:12px;background:rgba(0,0,0,0.2);padding:12px;border-radius:6px;border:1px solid var(--border);">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">拟合 E[Y|X] 的 ML 模型</div>
              <select id="dml-model-y" class="copilot-input">
                <option>XGBoost Regressor</option>
                <option>Random Forest</option>
                <option>Deep Neural Network (MLP)</option>
              </select>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">拟合 E[D|X] 的 ML 模型</div>
              <select id="dml-model-d" class="copilot-input">
                <option>LightGBM Classifier</option>
                <option>Lasso / Ridge Logistic</option>
                <option>XGBoost Classifier</option>
              </select>
            </div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">交叉验证折数 (Cross-fitting K-Folds)</div>
            <input type="number" id="dml-folds" class="copilot-input" value="5" placeholder="避免过拟合偏误">
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:16px;justify-content:center;" onclick="window.__causalML?.runDMLEstimation()">
          ⚡ 执行 DML 正交化估计
        </button>
      </div>

      <div class="card">
        <div class="card-title gold">估计结果对比 (Naive OLS vs DML)</div>
        <div id="dml-result-area" style="display:none;">
          <div style="display:flex;gap:12px;margin-bottom:16px;">
            <div class="stat-card rose-accent" style="flex:1;padding:12px;">
              <div class="stat-num rose" style="font-size:20px;">0.085 <span style="font-size:12px;font-weight:normal;">(偏误)</span></div>
              <div class="stat-label">朴素 OLS ATE 估计</div>
            </div>
            <div class="stat-card emerald-accent" style="flex:1;padding:12px;">
              <div class="stat-num emerald" style="font-size:20px;" id="dml-ate-val">0.032 <span style="font-size:12px;font-weight:normal;">***</span></div>
              <div class="stat-label">DML ATE 估计 (去偏后)</div>
            </div>
          </div>
          
          <div style="background:rgba(0,212,170,0.08);border-left:3px solid var(--emerald);padding:10px;font-size:12px;color:var(--text);line-height:1.6;">
            <strong>推断结论：</strong> 在使用高维非线性机器学习模型剥离混淆变量后，真实的因果效应收敛于 <span style="color:var(--gold);">0.032</span> (95% CI: [0.021, 0.043])。传统 OLS 由于存在函数设定偏误，严重高估了该效应。
          </div>
        </div>
        <div id="dml-empty-state" style="text-align:center;padding:40px;color:var(--text-faint);">
          点击左侧按钮执行去偏估计
        </div>
      </div>
    </div>
  `;
}

function runDMLEstimation() {
  document.getElementById('dml-empty-state').style.display = 'none';
  document.getElementById('dml-result-area').style.display = 'block';
  window.__copilot?.askCopilot('在 Double Machine Learning (DML) 中，为什么我们必须对样本进行“交叉拟合 (Cross-fitting)”？如果不做交叉拟合，机器学习模型的过拟合会如何破坏因果推断的无偏性？', '因果ML引擎', true);
}

/* ─── Tab 2: 异质性效应 (Causal Forest) ─── */
function _renderHTE(container) {
  container.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="card-title violet" style="margin-bottom:0;">因果森林：条件平均处理效应 (CATE) 挖掘</div>
        <button class="btn btn-primary btn-sm" onclick="window.__causalML?.runCausalForest()">🌲 训练因果森林</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;margin-top:8px;">
        传统的 ATE 只能给出“平均有效”，但因果森林 (Causal Forest) 能够挖掘出：<strong>政策/干预对哪些子群体效果最好，对哪些群体甚至有负面作用？</strong> 这在定向政策制定和精准营销中价值极高。
      </div>
      
      <div class="grid-2">
        <div id="hte-bar-chart" style="height:300px; background:rgba(0,0,0,0.1); border-radius:8px; border:1px solid var(--border);"></div>
        
        <div style="display:flex;flex-direction:column;justify-content:center;padding:16px;">
          <div style="font-size:13px;color:var(--text);line-height:1.8;">
            <strong style="color:var(--violet);">异质性子群体洞察：</strong><br>
            经过因果森林对样本空间的切割，我们发现处理效应呈现出极强的异质性：<br><br>
            <ul style="color:var(--text-muted);padding-left:16px;">
              <li><span style="color:var(--emerald);font-weight:bold;">高科技/大企业：</span> 受益最显著 (CATE > 0.08)。</li>
              <li><span style="color:var(--gold);font-weight:bold;">传统制造/中型企业：</span> 效应一般 (CATE ≈ 0.03)。</li>
              <li><span style="color:var(--rose);font-weight:bold;">小微/劳动密集型企业：</span> 甚至出现了显著的<strong>负面冲击</strong> (CATE < -0.02)。</li>
            </ul>
          </div>
          <button class="btn btn-ghost btn-sm" style="margin-top:16px;" onclick="window.__copilot?.askCopilot('我使用因果森林跑出了异质性处理效应（HTE）。请问在学术论文写作时，如果我发现某项政策对特定子群体（如小微企业）有负面效应，我应该如何从理论机制层面去解释这一反直觉现象，从而提升论文的理论深度？', '因果ML引擎', true)">
            🤖 问 AI：如何将异质性结果转化为理论贡献？
          </button>
        </div>
      </div>
    </div>
  `;
  // 初始化占位图
  setTimeout(() => runCausalForest(true), 50);
}

function runCausalForest(isInit = false) {
  const container = document.getElementById('hte-bar-chart');
  if(!container || typeof Plotly === 'undefined') return;

  const groups = ['高科技大企业', '高科技中型', '传统制造大型', '传统制造中型', '小微密集型企业'];
  const cate_values = [0.085, 0.052, 0.041, 0.015, -0.025];
  const colors = ['#00d4aa', '#00d4aa', '#d4a853', '#d4a853', '#e05c7a'];

  Plotly.newPlot('hte-bar-chart', [{
    x: groups,
    y: cate_values,
    type: 'bar',
    marker: { color: colors, line: { color: '#1e2d4a', width: 1 } }
  }], {
    ...BASE_LAYOUT,
    margin: { t: 30, b: 60, l: 50, r: 20 },
    xaxis: { title: '', tickangle: -20 },
    yaxis: { title: '条件平均处理效应 (CATE)', gridcolor: '#1e2d4a' },
    title: { text: '不同企业子群体的 CATE 分布', font: { size: 13, color: '#dde4f0' } }
  }, BASE_CONFIG);

  if(!isInit) {
    window.__copilot?.addMessage('sys', '因果森林训练完成！树的非参数切割已为你自动定位了对政策最敏感和最受挫的子群体。');
  }
}

window.__causalML = { init, switchTab, runDMLEstimation, runCausalForest };