/* ═══════════════════════════════════════════════════════
   modules/fintech.js — 金融科技与量化分析模块
   Features: 因子分析 · 回测框架 · 风险指标 · 事件研究
═══════════════════════════════════════════════════════ */

import { renderLine, renderRadar, BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-fintech';
let _activeTab = 'factor';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">金融科技与量化分析</div>
        <div class="page-desc">因子评估 · 策略回测 · 风险归因 · 事件研究框架</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="factor" onclick="window.__fintech?.switchTab('factor',this)">🧬 因子分析</div>
      <div class="module-tab" data-tab="backtest" onclick="window.__fintech?.switchTab('backtest',this)">📈 回测框架</div>
      <div class="module-tab" data-tab="risk" onclick="window.__fintech?.switchTab('risk',this)">⚠️ 风险指标</div>
      <div class="module-tab" data-tab="event" onclick="window.__fintech?.switchTab('event',this)">📅 事件研究</div>
    </div>

    <div id="fintech-content"></div>
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
  const content = document.getElementById('fintech-content');
  if (!content) return;
  
  if (tab === 'factor') _renderFactor(content);
  else if (tab === 'backtest') _renderBacktest(content);
  else if (tab === 'risk') _renderRisk(content);
  else if (tab === 'event') _renderEvent(content);
}

/* ─── Tab 1: 因子分析 (Factor Analysis) ─── */
function _renderFactor(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">风格因子暴露度 (Factor Exposure)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">当前投资组合在经典 Barra 风格因子上的暴露情况。</div>
        <div id="ft-factor-radar" style="height:250px;"></div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('我的组合在【动量(Momentum)】和【波动率(Volatility)】上暴露很高，在当前宏观市场环境下，这会有什么潜在风险？')">
            🤖 AI 分析因子暴露风险
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title violet">信息系数 (IC / ICIR) 评估</div>
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">
          <div style="display:flex;gap:10px;align-items:center;">
            <div style="flex:1;">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">测试因子名称</div>
              <input type="text" class="copilot-input" placeholder="e.g. 净利润断层 (Net Profit Surprise)">
            </div>
            <div style="flex:1;">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">预测周期 (调仓频率)</div>
              <select class="copilot-input"><option>20个交易日 (月频)</option><option>5个交易日 (周频)</option></select>
            </div>
          </div>
          <button class="btn btn-primary" style="justify-content:center;" onclick="window.__fintech?.runICAnalysis()">⚡ 计算因子 IC 值</button>
        </div>
        
        <table class="exp-table" style="text-align:center;">
          <thead>
            <tr><th>Rank IC (均值)</th><th>ICIR</th><th>胜率 (IC > 0)</th><th>t-stat</th></tr>
          </thead>
          <tbody>
            <tr>
              <td id="ic-val" style="color:var(--gold);font-weight:bold;">0.045</td>
              <td id="icir-val">0.62</td>
              <td id="ic-win">58%</td>
              <td id="ic-t">2.14</td>
            </tr>
          </tbody>
        </table>
        <div id="ic-comment" style="margin-top:12px;font-size:11px;color:var(--emerald);background:rgba(16,185,129,0.08);padding:8px;border-radius:4px;display:none;">
          ✓ 该因子 IC 均值大于 0.03 且 t值 > 2，具备显著的选股预测能力。
        </div>
      </div>
    </div>
  `;
  setTimeout(() => _drawFactorRadar(), 50);
}

function _drawFactorRadar() {
  const container = document.getElementById('ft-factor-radar');
  if(!container) return;
  const theta = ['Size (规模)', 'Value (价值)', 'Momentum (动量)', 'Quality (质量)', 'Volatility (波动)'];
  // 模拟暴露度数据 [-3, 3] 映射到 [0, 100] 方便展示
  renderRadar('ft-factor-radar', [20, 85, 90, 60, 15], theta, '#00d4aa');
}

function runICAnalysis() {
  document.getElementById('ic-val').textContent = '0.052';
  document.getElementById('icir-val').textContent = '0.81';
  document.getElementById('ic-win').textContent = '61%';
  document.getElementById('ic-t').textContent = '2.85';
  document.getElementById('ic-comment').style.display = 'block';
  window.__copilot?.addMessage('sys', '因子分析已完成。通常在A股市场，Rank IC 绝对值大于 0.03 且 ICIR 大于 0.5 即可认为是有效因子。');
}

/* ─── Tab 2: 回测框架 (Backtest) ─── */
function _renderBacktest(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title">策略参数与运行</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">初始资金</div><input type="text" class="copilot-input" value="1,000,000"></div>
          <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">手续费率 (双边)</div><input type="text" class="copilot-input" value="0.0015"></div>
          <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">回测开始日期</div><input type="date" class="copilot-input" value="2020-01-01"></div>
          <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">基准指数</div><select class="copilot-input"><option>沪深300</option><option>中证500</option></select></div>
        </div>
        <button class="btn btn-cyan" style="width:100%;justify-content:center;margin-bottom:16px;" onclick="window.__fintech?.runBacktest()">▶ 运行策略回测</button>
        
        <div class="grid-2">
          <div class="stat-card gold-accent" style="padding:12px;">
            <div class="stat-num gold" style="font-size:22px;" id="bt-ann">15.4%</div>
            <div class="stat-label">年化收益率</div>
          </div>
          <div class="stat-card rose-accent" style="padding:12px;">
            <div class="stat-num rose" style="font-size:22px;" id="bt-mdd">-18.2%</div>
            <div class="stat-label">最大回撤</div>
          </div>
          <div class="stat-card cyan-accent" style="padding:12px;">
            <div class="stat-num cyan" style="font-size:22px;" id="bt-sharpe">1.24</div>
            <div class="stat-label">夏普比率 (Sharpe)</div>
          </div>
          <div class="stat-card violet-accent" style="padding:12px;">
            <div class="stat-num violet" style="font-size:22px;" id="bt-win">56.5%</div>
            <div class="stat-label">交易胜率</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title gold">累计收益率曲线 (Cumulative Returns)</div>
        <div id="ft-backtest-chart" style="height:280px;"></div>
      </div>
    </div>
  `;
  setTimeout(() => runBacktest(true), 50); // 初始默认画一条
}

function runBacktest(isInit = false) {
  if(!isInit) {
    document.getElementById('bt-ann').textContent = (Math.random() * 10 + 10).toFixed(1) + '%';
    document.getElementById('bt-mdd').textContent = '-' + (Math.random() * 15 + 10).toFixed(1) + '%';
    document.getElementById('bt-sharpe').textContent = (Math.random() * 1 + 1).toFixed(2);
  }
  
  // 生成模拟回测曲线 (随机游走 + 漂移)
  let strat = [1], bench = [1];
  const days = Array.from({length: 100}, (_, i) => i);
  for(let i=1; i<100; i++) {
    strat.push(strat[i-1] * (1 + (Math.random() - 0.45) * 0.03)); // 偏正向
    bench.push(bench[i-1] * (1 + (Math.random() - 0.48) * 0.03));
  }
  
  renderLine('ft-backtest-chart', [
    { x: days, y: strat, mode: 'lines', name: '策略收益', line: { color: '#d4a853', width: 2 } },
    { x: days, y: bench, mode: 'lines', name: '基准收益', line: { color: '#6b7fa3', width: 1.5, dash: 'dash' } }
  ], {
    xaxis: { title: '交易日', showgrid: false },
    yaxis: { title: '净值', tickformat: '.2f' },
    showlegend: true, legend: { x: 0, y: 1, bgcolor: 'transparent' }
  });
}

/* ─── Tab 3: 风险指标 (Risk Metrics) ─── */
function _renderRisk(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title rose">日收益率分布 & 尾部风险 (Tail Risk)</div>
        <div id="ft-risk-hist" style="height:220px;margin-bottom:12px;"></div>
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:12px;background:rgba(224,92,122,0.08);padding:10px;border-radius:6px;border:1px solid rgba(224,92,122,0.3);">
          <div><span style="color:var(--text-faint);">95% VaR:</span> <strong style="color:var(--rose);">-2.4%</strong></div>
          <div><span style="color:var(--text-faint);">99% VaR:</span> <strong style="color:var(--rose);">-3.8%</strong></div>
          <div><span style="color:var(--text-faint);">95% CVaR:</span> <strong style="color:var(--rose);">-3.1%</strong></div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">极端情景压力测试 (Stress Test)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">模拟历史极端黑天鹅事件发生时，当前投资组合的预估回撤。</div>
        <table class="exp-table">
          <thead><tr><th>历史情景</th><th>市场跌幅</th><th>组合预估回撤</th></tr></thead>
          <tbody>
            <tr><td>2008 国际金融危机</td><td style="color:var(--rose);">-55.3%</td><td style="color:var(--rose);font-weight:bold;">-28.5%</td></tr>
            <tr><td>2015 股灾 (千股跌停)</td><td style="color:var(--rose);">-43.2%</td><td style="color:var(--rose);font-weight:bold;">-22.1%</td></tr>
            <tr><td>2020 疫情熔断</td><td style="color:var(--rose);">-33.8%</td><td style="color:var(--rose);font-weight:bold;">-14.7%</td></tr>
          </tbody>
        </table>
        <div style="margin-top:16px;">
          <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('在量化风控中，VaR（在险价值）和 CVaR（条件在险价值）有什么本质区别？为什么在尾部风险（如黑天鹅事件）测量中，CVaR 往往被认为比 VaR 更严谨？')">
            🤖 AI 解析 VaR vs CVaR
          </button>
        </div>
      </div>
    </div>
  `;
  setTimeout(() => _drawHistogram(), 50);
}

function _drawHistogram() {
  const container = document.getElementById('ft-risk-hist');
  if(!container) return;
  // 生成近似正态分布但有左偏尾部的数据
  const returns = Array.from({length: 500}, () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.03);
  returns.push(-0.06, -0.05, -0.045); // 添加几个左侧极端值
  
  Plotly.newPlot('ft-risk-hist', [{
    x: returns, type: 'histogram', marker: { color: 'rgba(224, 92, 122, 0.6)', line: { color: '#e05c7a', width: 1 } }
  }], {
    ...BASE_LAYOUT,
    margin: { t: 10, b: 30, l: 30, r: 10 },
    xaxis: { ...BASE_LAYOUT.xaxis, title: '日收益率', tickformat: '.1%' },
    yaxis: { ...BASE_LAYOUT.yaxis, title: '频数' },
  }, BASE_CONFIG);
}

/* ─── Tab 4: 事件研究 (Event Study) ─── */
function _renderEvent(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title cyan">标准事件研究法 (Event Study)</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
        常用于衡量某类突发事件（如并购重组、高管辞职、财务造假曝光）对股票价值的影响。通过市场模型测算异常收益率（AR）和累计异常收益率（CAR）。
      </div>
      
      <div class="grid-2">
        <div>
          <div style="display:flex;gap:10px;margin-bottom:12px;">
            <div style="flex:1;">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">事件窗口设定</div>
              <input type="text" class="copilot-input" value="[-10, 10]" disabled>
            </div>
            <div style="flex:1;">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">估计窗口 (Estimation Window)</div>
              <input type="text" class="copilot-input" value="[-120, -11]" disabled>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-bottom:12px;" onclick="window.__fintech?.runEventStudy()">📊 测算累计异常收益 (CAR)</button>
          
          <div style="font-size:12px;color:var(--text);margin-bottom:8px;">事件日前后 CAR 检验结果：</div>
          <table class="exp-table">
            <thead><tr><th>窗口</th><th>Mean CAR</th><th>t-stat</th><th>显著性</th></tr></thead>
            <tbody>
              <tr><td>[-1, 1]</td><td style="color:var(--rose);">-2.14%</td><td>-3.12</td><td>***</td></tr>
              <tr><td>[-5, 5]</td><td style="color:var(--rose);">-4.38%</td><td>-4.56</td><td>***</td></tr>
            </tbody>
          </table>
        </div>
        
        <div>
          <div id="ft-event-chart" style="height:250px;border:1px solid var(--border);border-radius:6px;background:rgba(0,0,0,0.1);"></div>
        </div>
      </div>
    </div>
  `;
  setTimeout(() => runEventStudy(true), 50);
}

function runEventStudy(isInit = false) {
  // 生成典型的事件研究 V 型或跳水曲线
  const x = Array.from({length: 21}, (_, i) => i - 10);
  let car = [];
  let current = 0;
  for(let i=0; i<21; i++) {
    if(x[i] < 0) current += (Math.random() - 0.5) * 0.5; // 事件前随机震荡
    else if(x[i] === 0) current -= 2.5; // 事件日(T=0)大幅跳水
    else current -= Math.random() * 0.4; // 事件后持续发酵
    car.push(current);
  }
  
  renderLine('ft-event-chart', [
    { x: x, y: car, mode: 'lines+markers', name: 'CAR (%)', line: { color: '#e05c7a', width: 2 } }
  ], {
    xaxis: { title: '相对事件日 (T)', tickvals: [-10, -5, 0, 5, 10] },
    yaxis: { title: '累计异常收益率 CAR (%)' },
    shapes: [{
      type: 'line', x0: 0, x1: 0, y0: 0, y1: 1, yref: 'paper',
      line: { color: '#d4a853', width: 1.5, dash: 'dash' }
    }]
  });
  
  if(!isInit) {
    window.__copilot?.addMessage('sys', '事件研究测算完成。CAR在 T=0 处出现显著下降，且 [-5, 5] 窗口的 t 检验高度显著，说明该事件具有显著的负面市场反应。');
  }
}

window.__fintech = { init, switchTab, runICAnalysis, runBacktest, runEventStudy };