/* ═══════════════════════════════════════════════════════
   modules/xai-studio.js — 可解释机器学习 (XAI)
   Features: SHAP 特征重要性 · 交互式 ROC 与 混淆矩阵
═══════════════════════════════════════════════════════ */

import { BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-xai-studio';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">可解释机器学习 (XAI Studio)</div>
        <div class="page-desc">打开算法黑盒：SHAP 归因分析 · 动态阈值混淆矩阵 · 决策逻辑可视化</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="shap" onclick="window.__xaiStudio?.switchTab('shap',this)">💧 SHAP 瀑布归因</div>
      <div class="module-tab" data-tab="roc" onclick="window.__xaiStudio?.switchTab('roc',this)">🎯 交互式评估 (ROC/CM)</div>
    </div>
    <div id="xai-content"></div>
  `;
  _renderTab('shap');
}

function switchTab(tab, el) {
  document.querySelectorAll(`#${CONTAINER} .module-tab`).forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderTab(tab);
}

function _renderTab(tab) {
  const content = document.getElementById('xai-content');
  if (!content) return;
  if (tab === 'shap') _renderSHAP(content);
  else if (tab === 'roc') _renderROC(content);
}

function _renderSHAP(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">单样本决策归因 (SHAP Waterfall)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          当前分析场景：<strong>边缘设备传感器异常检测</strong>。<br>
          模型基准输出为 0.15 (正常)，此样本最终输出为 0.88 (判定为异常)。各传感特征对此次异常判定的贡献值如下：
        </div>
        <div id="xai-shap-chart" style="height:280px;"></div>
      </div>
      
      <div class="card">
        <div class="card-title violet">特征鲁棒性诊断</div>
        <div style="font-size:12px;color:var(--text-muted);line-height:1.8;background:rgba(0,0,0,0.2);padding:12px;border-radius:6px;border:1px solid var(--border);margin-bottom:16px;">
          <strong style="color:var(--rose);">发现高敏特征：</strong><br>
          在当前的异常预测中，<code style="color:var(--cyan);">Temp_Spike (温度尖峰)</code> 和 <code style="color:var(--cyan);">Vibration_Freq (振动频率)</code> 提供了超过 70% 的正向推力。
        </div>
        <button class="btn btn-ghost" style="width:100%;text-align:left;" onclick="window.__copilot?.askCopilot('对于部署在边缘设备上的异常检测模型，如果 SHAP 值显示温度尖峰（Temp_Spike）是最重要的判定特征，但在实际工业现场，温度传感器极易受到物理环境干扰而产生噪点。这种过度依赖单一特征的模型在落地部署时会面临什么风险？我该如何通过特征工程（如滑动窗口平滑）或多模态数据融合来提高模型的鲁棒性？', 'XAI 工作台', true)">
          🤖 问 AI：过度依赖环境特征的落地风险与对策？
        </button>
      </div>
    </div>
  `;
  setTimeout(_drawSHAP, 50);
}

function _drawSHAP() {
  const container = document.getElementById('xai-shap-chart');
  if (!container || typeof Plotly === 'undefined') return;

  const features = ['基准值 (Base)', 'CPU_Load', 'Voltage_Drop', 'Vibration_Freq', 'Temp_Spike', '最终输出'];
  const values = [0.15, -0.05, 0.12, 0.28, 0.38, 0.88];
  
  Plotly.newPlot('xai-shap-chart', [{
    type: 'waterfall', x: features, y: values,
    measure: ['absolute', 'relative', 'relative', 'relative', 'relative', 'total'],
    decreasing: { marker: { color: '#e05c7a' } },
    increasing: { marker: { color: '#00d4aa' } },
    totals: { marker: { color: '#d4a853' } },
    text: values.map(v => v > 0 ? `+${v}` : v), textposition: 'outside'
  }], {
    ...BASE_LAYOUT, margin: { t: 20, b: 30, l: 40, r: 20 },
    xaxis: { title: '' }, yaxis: { title: 'Log Odds 贡献值' }
  }, BASE_CONFIG);
}

function _renderROC(container) {
  container.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="card-title gold">动态评估矩阵 (ROC & Confusion Matrix)</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:11px;color:var(--text-muted);">分类阈值 (Threshold):</span>
          <input type="range" id="xai-thresh" min="0" max="1" step="0.01" value="0.5" style="width:120px;" oninput="window.__xaiStudio?.updateThreshold(this.value)">
          <strong id="xai-thresh-val" style="color:var(--gold);font-family:var(--font-mono);font-size:12px;width:30px;">0.50</strong>
        </div>
      </div>
      
      <div class="grid-2" style="margin-top:16px;">
        <div id="xai-roc-chart" style="height:250px;border-right:1px dashed var(--border);"></div>
        <div style="padding-left:20px;display:flex;flex-direction:column;justify-content:center;">
          <div style="text-align:center;margin-bottom:12px;font-size:12px;color:var(--text-faint);">混淆矩阵 (Confusion Matrix)</div>
          <div style="display:grid;grid-template-columns:50px 1fr 1fr;grid-template-rows:50px 80px 80px;text-align:center;gap:4px;">
            <div></div><div style="align-self:end;color:var(--text-muted);font-size:11px;">预测: 阴性</div><div style="align-self:end;color:var(--text-muted);font-size:11px;">预测: 阳性</div>
            <div style="align-self:center;color:var(--text-muted);font-size:11px;writing-mode:vertical-rl;">实际: 阴性</div>
            <div id="cm-tn" style="background:rgba(0,212,170,0.15);border:1px solid var(--cyan);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:20px;font-family:var(--font-mono);color:var(--cyan);">850</div>
            <div id="cm-fp" style="background:rgba(224,92,122,0.15);border:1px solid var(--rose);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:20px;font-family:var(--font-mono);color:var(--rose);">150</div>
            <div style="align-self:center;color:var(--text-muted);font-size:11px;writing-mode:vertical-rl;">实际: 阳性</div>
            <div id="cm-fn" style="background:rgba(224,92,122,0.15);border:1px solid var(--rose);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:20px;font-family:var(--font-mono);color:var(--rose);">45</div>
            <div id="cm-tp" style="background:rgba(0,212,170,0.15);border:1px solid var(--cyan);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:20px;font-family:var(--font-mono);color:var(--cyan);">955</div>
          </div>
        </div>
      </div>
    </div>
  `;
  setTimeout(_drawROC, 50);
}

function _drawROC() {
  const container = document.getElementById('xai-roc-chart');
  if (!container || typeof Plotly === 'undefined') return;

  const fpr = [0, 0.05, 0.15, 0.3, 0.5, 0.8, 1];
  const tpr = [0, 0.65, 0.85, 0.93, 0.97, 0.99, 1];

  Plotly.newPlot('xai-roc-chart', [
    { x: fpr, y: tpr, mode: 'lines', name: 'ROC Curve', line: { color: '#7c6fcd', width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(124,111,205,0.1)' },
    { x: [0, 1], y: [0, 1], mode: 'lines', name: 'Random', line: { color: '#6b7fa3', dash: 'dash', width: 1 } },
    { x: [0.15], y: [0.85], mode: 'markers', name: 'Current Threshold', marker: { size: 10, color: '#d4a853' } }
  ], {
    ...BASE_LAYOUT, margin: { t: 10, b: 30, l: 40, r: 10 },
    xaxis: { title: '假阳性率 (FPR)' }, yaxis: { title: '真阳性率 (TPR)' },
    showlegend: false
  }, BASE_CONFIG);
}

function updateThreshold(val) {
  document.getElementById('xai-thresh-val').textContent = parseFloat(val).toFixed(2);
  // 模拟阈值改变导致混淆矩阵变化
  const t = parseFloat(val);
  const totalPos = 1000, totalNeg = 1000;
  const tp = Math.round(totalPos * (1 - t*0.8)); // 简单模拟
  const fn = totalPos - tp;
  const tn = Math.round(totalNeg * t*1.2 > totalNeg ? totalNeg : totalNeg * t*1.2);
  const fp = totalNeg - tn;
  
  document.getElementById('cm-tp').textContent = tp;
  document.getElementById('cm-fn').textContent = fn;
  document.getElementById('cm-tn').textContent = tn;
  document.getElementById('cm-fp').textContent = fp;
  
  // 更新 ROC 图上的点
  const fpr_point = fp / totalNeg;
  const tpr_point = tp / totalPos;
  Plotly.restyle('xai-roc-chart', { x: [[fpr_point]], y: [[tpr_point]] }, [2]);
}

window.__xaiStudio = { init, switchTab, updateThreshold };