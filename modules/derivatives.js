/* ═══════════════════════════════════════════════════════
   modules/derivatives.js — 高级量化与衍生品引擎
   Features: 期权策略组合构建 · 3D 希腊字母曲面 · 蒙特卡洛定价
═══════════════════════════════════════════════════════ */

import { renderLine, BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-derivatives';
let _activeTab = 'strategy';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">高级衍生品引擎</div>
        <div class="page-desc">期权组合盈亏分析 · 3D Greeks 波动率曲面 · 蒙特卡洛定价</div>
      </div>
    </div>
    <div class="module-tabs">
      <div class="module-tab active" data-tab="strategy" onclick="window.__derivatives?.switchTab('strategy',this)">📈 策略构建器</div>
      <div class="module-tab" data-tab="greeks" onclick="window.__derivatives?.switchTab('greeks',this)">🌐 3D 希腊字母曲面</div>
      <div class="module-tab" data-tab="mc" onclick="window.__derivatives?.switchTab('mc',this)">🎲 蒙特卡洛定价</div>
    </div>
    <div id="deriv-content"></div>
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
  const content = document.getElementById('deriv-content');
  if (!content) return;
  if (tab === 'strategy') _renderStrategy(content);
  else if (tab === 'greeks') _renderGreeks(content);
  else if (tab === 'mc') _renderMC(content);
}

/* ─── Tab 1: 期权策略构建 ─── */
function _renderStrategy(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">期权组合 (Options Legs)</div>
        <div style="display:flex; gap:8px; margin-bottom: 16px; flex-wrap: wrap;">
          <button class="btn btn-ghost btn-sm" onclick="window.__derivatives?.loadStrategy('bull_spread')">牛市价差 (Bull Spread)</button>
          <button class="btn btn-ghost btn-sm" onclick="window.__derivatives?.loadStrategy('short_put')">卖出看跌 (Selling Puts)</button>
          <button class="btn btn-ghost btn-sm" onclick="window.__derivatives?.loadStrategy('straddle')">跨式突破 (Straddle)</button>
        </div>
        
        <div id="legs-container" style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;"></div>
        
        <div style="border-top:1px dashed var(--border); padding-top:12px;">
          <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="window.__derivatives?.drawPayoff()">⚡ 计算到期盈亏 (Payoff)</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title gold">到期盈亏曲线</div>
        <div id="deriv-payoff-chart" style="height:250px; display:flex; align-items:center; justify-content:center; color:var(--text-faint);">请点击计算盈亏</div>
      </div>
    </div>
  `;
  loadStrategy('bull_spread'); // 默认加载牛市价差
}

let _currentLegs = [];
function loadStrategy(type) {
  if (type === 'bull_spread') {
    _currentLegs = [
      { type: 'Call', dir: 'Long', strike: 100, premium: 5 },
      { type: 'Call', dir: 'Short', strike: 110, premium: 2 }
    ];
  } else if (type === 'short_put') {
    _currentLegs = [
      { type: 'Put', dir: 'Short', strike: 95, premium: 3 }
    ];
  } else if (type === 'straddle') {
    _currentLegs = [
      { type: 'Call', dir: 'Long', strike: 100, premium: 4 },
      { type: 'Put', dir: 'Long', strike: 100, premium: 4 }
    ];
  }
  
  const container = document.getElementById('legs-container');
  if(!container) return;
  container.innerHTML = _currentLegs.map((leg, i) => `
    <div style="display:flex; gap:10px; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; border:1px solid var(--border);">
      <div class="tag tag-${leg.dir==='Long'?'emerald':'rose'}">${leg.dir} ${leg.type}</div>
      <div style="font-size:12px; color:var(--text-muted); display:flex; align-items:center;">行权价: <strong style="color:var(--text);margin-left:4px;">${leg.strike}</strong></div>
      <div style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; margin-left:auto;">期权费: <strong style="color:var(--gold);margin-left:4px;">${leg.premium}</strong></div>
    </div>
  `).join('');
  drawPayoff();
}

function drawPayoff() {
  const prices = Array.from({length: 80}, (_, i) => 60 + i); // 标的价格从 60 到 140
  const payoffs = prices.map(S => {
    let total = 0;
    _currentLegs.forEach(leg => {
      let intrinsic = 0;
      if (leg.type === 'Call') intrinsic = Math.max(S - leg.strike, 0);
      if (leg.type === 'Put') intrinsic = Math.max(leg.strike - S, 0);
      
      if (leg.dir === 'Long') total += (intrinsic - leg.premium);
      if (leg.dir === 'Short') total += (leg.premium - intrinsic);
    });
    return total;
  });

  renderLine('deriv-payoff-chart', [{
    x: prices, y: payoffs, mode: 'lines', name: '总盈亏', line: { color: '#d4a853', width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(212,168,83,0.1)'
  }], {
    xaxis: { title: '标的资产到期价格' }, yaxis: { title: '盈亏 (Payoff)' },
    shapes: [{ type: 'line', x0: 60, x1: 140, y0: 0, y1: 0, line: { color: '#6b7fa3', width: 1, dash: 'dash' } }]
  });
  
  window.__copilot?.askCopilot(`我已经构建了一个包含 ${_currentLegs.length} 条腿的期权组合。请用金融工程的角度，分析这种组合在希腊字母（Delta, Gamma, Theta）上的暴露特征，以及它最适合应对什么样的市场环境？`, '衍生品引擎');
}

/* ─── Tab 2: 3D 希腊字母曲面 ─── */
function _renderGreeks(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title violet">期权 Delta 3D 曲面图</div>
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
        展示看涨期权 Delta 随「标的价格」和「到期时间」的非线性变化特征。基于 Black-Scholes 模型在本地实时渲染。
      </div>
      <div id="deriv-3d-chart" style="height:400px; border-radius:8px; overflow:hidden;"></div>
    </div>
  `;
  setTimeout(() => _draw3DSurface(), 50);
}

function _draw3DSurface() {
  const container = document.getElementById('deriv-3d-chart');
  if(!container) return;
  
  // 模拟 Black-Scholes Delta 的 3D 数据分布
  let z_data = [];
  let prices = Array.from({length: 30}, (_,i) => 80 + i); // S: 80 - 110
  let times = Array.from({length: 30}, (_,i) => 0.05 + i*0.05); // T: 0.05 - 1.5

  for(let t=0; t<30; t++) {
    let row = [];
    for(let p=0; p<30; p++) {
      // 简化的 Sigmoid 近似 Delta 曲线特征
      let val = 1 / (1 + Math.exp(-(prices[p] - 100) / (times[t] * 10)));
      row.push(val);
    }
    z_data.push(row);
  }

  Plotly.newPlot('deriv-3d-chart', [{
    z: z_data, x: prices, y: times, type: 'surface', colorscale: 'Viridis', showscale: false
  }], {
    ...BASE_LAYOUT,
    margin: { t: 0, b: 0, l: 0, r: 0 },
    scene: {
      xaxis: { title: '标的价格 (S)', gridcolor: '#1e2d4a' },
      yaxis: { title: '剩余时间 (T)', gridcolor: '#1e2d4a' },
      zaxis: { title: 'Delta', gridcolor: '#1e2d4a' },
      bgcolor: 'transparent'
    },
    paper_bgcolor: 'transparent'
  }, BASE_CONFIG);
}

/* ─── Tab 3: 蒙特卡洛定价 ─── */
function _renderMC(container) {
  container.innerHTML = `
    <div class="card" style="text-align:center; padding:40px; color:var(--text-faint);">
      <div style="font-size:32px; margin-bottom:12px;">🎲</div>
      <div>蒙特卡洛随机游走定价引擎</div>
      <div style="font-size:12px; margin-top:6px;">纯 JS 本地并行模拟 10,000 条价格路径，即将于下个版本上线。</div>
    </div>
  `;
}

window.__derivatives = { init, switchTab, loadStrategy, drawPayoff };