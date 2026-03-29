/* ═══════════════════════════════════════════════════════
   modules/bayesian-lab.js — 贝叶斯与统计仿真
   Features: 先验-后验更新过程 (Beta-Binomial) · MCMC 概念演示
═══════════════════════════════════════════════════════ */

import { renderLine, BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-bayesian-lab';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">贝叶斯与统计仿真实验室</div>
        <div class="page-desc">告别 P 值崇拜：动态后验更新 · 不确定性量化 · 马尔可夫链蒙特卡洛 (MCMC)</div>
      </div>
    </div>
    <div id="bayesian-content"></div>
  `;
  _renderBayesianUpdate(document.getElementById('bayesian-content'));
}

function _renderBayesianUpdate(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">贝叶斯后验更新 (Beta-Binomial 模型)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          当前分析场景：<strong>评估一套基于边缘视觉的「射箭计分系统」的识别准确率 (θ)</strong>。<br>
          系统在出厂前的历史经验构成了<strong>先验 (Prior)</strong>。现在我们在靶场进行了若干次实弹射击，命中的识别结果构成了<strong>似然 (Likelihood)</strong>。通过贝叶斯定理，我们得到更新后的对准确率的认知——<strong>后验 (Posterior)</strong>。
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:rgba(0,0,0,0.2);padding:12px;border-radius:6px;border:1px solid var(--border);margin-bottom:16px;">
          <div>
            <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">先验 (Prior) Beta(α, β)</div>
            <div style="display:flex;gap:4px;">
              <input type="number" id="prior-a" class="copilot-input" value="10" title="先验成功次数" onchange="window.__bayesianLab?.updatePlot()">
              <input type="number" id="prior-b" class="copilot-input" value="2" title="先验失败次数" onchange="window.__bayesianLab?.updatePlot()">
            </div>
            <div style="font-size:10px;color:var(--text-faint);margin-top:4px;">(基于出厂内测：大致认为准确率在80%左右)</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">新观测数据 (Observation)</div>
            <div style="display:flex;gap:4px;">
              <input type="number" id="obs-k" class="copilot-input" value="8" title="实际命中识别数" onchange="window.__bayesianLab?.updatePlot()">
              <input type="number" id="obs-n" class="copilot-input" value="10" title="射箭总次数" onchange="window.__bayesianLab?.updatePlot()">
            </div>
            <div style="font-size:10px;color:var(--text-faint);margin-top:4px;">(靶场实测：射击10次，成功识别8次)</div>
          </div>
        </div>
        
        <button class="btn btn-ghost" style="width:100%;text-align:left;line-height:1.6;" onclick="window.__copilot?.askCopilot('我正在评估一套新开发的射箭计分视觉识别系统。在只有少量实弹测试数据（例如：测试了10箭，系统成功准确识别了8箭）的情况下，为什么使用引入了出厂内测经验的「贝叶斯后验估计」，比直接使用频率学派的“80%准确率”结论更加科学合理？贝叶斯推断如何帮助我们量化这套视觉系统在实际落地部署时的不确定性风险？', '贝叶斯实验室', true)">
          🤖 问 AI：为什么小样本测试下贝叶斯比传统统计更可靠？
        </button>
      </div>

      <div class="card">
        <div class="card-title gold">概率密度函数演化图</div>
        <div id="bayesian-plot" style="height:320px;"></div>
      </div>
    </div>
  `;
  setTimeout(updatePlot, 50);
}

// 计算 Beta 分布的 PDF
function betaPDF(x, alpha, beta) {
  const logGamma = (z) => {
    let sum = 0;
    for (let i = 1; i < 10000; i++) sum += Math.log((1 + 1/i)**z / (1 + z/i));
    return sum - 0.5772156649 * z;
  };
  const lnBeta = logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
  return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - lnBeta);
}

function updatePlot() {
  const get = id => parseInt(document.getElementById(id)?.value) || 1;
  const a0 = get('prior-a');
  const b0 = get('prior-b');
  const k = get('obs-k');
  const n = get('obs-n');
  
  // 后验分布参数
  const a1 = a0 + k;
  const b1 = b0 + (n - k);

  const x = Array.from({length: 100}, (_, i) => i / 100 + 0.001); // 避免 0/1 奇点
  const priorY = x.map(val => betaPDF(val, a0, b0));
  const postY = x.map(val => betaPDF(val, a1, b1));

  // 似然函数 (缩放到可视化高度)
  const likY = x.map(val => Math.pow(val, k) * Math.pow(1-val, n-k) * 1000); 

  Plotly.newPlot('bayesian-plot', [
    { x: x, y: priorY, mode: 'lines', name: '先验 (Prior)', line: { color: '#6b7fa3', dash: 'dash', width: 2 } },
    { x: x, y: likY, mode: 'lines', name: '似然 (Likelihood)', line: { color: '#d4a853', width: 1.5 }, fill: 'tozeroy', fillcolor: 'rgba(212,168,83,0.1)' },
    { x: x, y: postY, mode: 'lines', name: '后验 (Posterior)', line: { color: '#00d4aa', width: 3 }, fill: 'tozeroy', fillcolor: 'rgba(0,212,170,0.2)' }
  ], {
    ...BASE_LAYOUT, margin: { t: 20, b: 40, l: 30, r: 10 },
    xaxis: { ...BASE_LAYOUT.xaxis, title: '系统识别准确率 (θ)', range: [0, 1] },
    yaxis: { ...BASE_LAYOUT.yaxis, title: '概率密度', showticklabels: false },
    legend: { x: 0, y: 1, bgcolor: 'transparent', font: { size: 10, color: '#dde4f0' } }
  }, BASE_CONFIG);
}

window.__bayesianLab = { init, updatePlot };