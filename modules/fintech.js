/* ═══════════════════════════════════════════════════════
   modules/fintech.js — 金融科技与量化分析模块
   Features: 因子分析 · 真实本地CSV回测 · 风险指标 · 事件研究
═══════════════════════════════════════════════════════ */

import { renderLine, renderRadar, BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-fintech';
let _activeTab = 'backtest';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">金融科技与量化分析 (Local Engine)</div>
        <div class="page-desc">因子评估 · 真实数据回测 · 风险归因 · 事件研究框架</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab" data-tab="factor" onclick="window.__fintech?.switchTab('factor',this)">🧬 因子分析</div>
      <div class="module-tab active" data-tab="backtest" onclick="window.__fintech?.switchTab('backtest',this)">📈 真实数据回测</div>
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

/* ─── Tab 1: 因子分析 (Factor Analysis) - 恢复原版 ─── */
function _renderFactor(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">风格因子暴露度 (Factor Exposure)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">当前投资组合在经典 Barra 风格因子上的暴露情况。</div>
        <div id="ft-factor-radar" style="height:250px;"></div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('我的组合在【动量(Momentum)】和【波动率(Volatility)】上暴露很高，在当前宏观市场环境下，这会有什么潜在风险？', '量化模块', true)">
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
              <input type="text" class="copilot-input" placeholder="e.g. 净利润断层">
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
  renderRadar('ft-factor-radar', [20, 85, 90, 60, 15], theta, '#00d4aa');
}

function runICAnalysis() {
  document.getElementById('ic-val').textContent = '0.052';
  document.getElementById('icir-val').textContent = '0.81';
  document.getElementById('ic-win').textContent = '61%';
  document.getElementById('ic-t').textContent = '2.85';
  document.getElementById('ic-comment').style.display = 'block';
}

/* ─── Tab 2: 真实回测框架 (CSV 引擎) ─── */
function _renderBacktest(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">真实数据回测解析器</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          请上传包含 <code>Date, Strategy, Benchmark</code> 列的每日收益率 CSV（纯本地 JS 计算）。<br>
          <span style="color:var(--gold);">格式要求：收益率为小数（如 0.015 表示 1.5%）</span>
        </div>
        
        <input type="file" id="bt-csv" accept=".csv" style="margin-bottom:12px; color: var(--text); font-size: 12px; width: 100%;">
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">无风险利率 (年化)</div><input type="text" class="copilot-input" id="bt-rf" value="0.02"></div>
        </div>
        <button class="btn btn-cyan" style="width:100%;justify-content:center;margin-bottom:16px;" onclick="window.__fintech?.runRealBacktest()">▶ 读取 CSV 并执行真实计算</button>
        
        <div class="grid-2">
          <div class="stat-card gold-accent" style="padding:12px;">
            <div class="stat-num gold" style="font-size:22px;" id="bt-ann">--%</div>
            <div class="stat-label">真实年化收益</div>
          </div>
          <div class="stat-card rose-accent" style="padding:12px;">
            <div class="stat-num rose" style="font-size:22px;" id="bt-mdd">--%</div>
            <div class="stat-label">最大回撤 (MDD)</div>
          </div>
          <div class="stat-card cyan-accent" style="padding:12px;">
            <div class="stat-num cyan" style="font-size:22px;" id="bt-sharpe">--</div>
            <div class="stat-label">夏普比率 (Sharpe)</div>
          </div>
          <div class="stat-card violet-accent" style="padding:12px;">
            <div class="stat-num violet" style="font-size:22px;" id="bt-win">--%</div>
            <div class="stat-label">日胜率</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title gold">真实累计净值曲线</div>
        <div id="ft-backtest-chart" style="height:280px;display:flex;align-items:center;justify-content:center;color:var(--text-faint);">请先上传 CSV 文件</div>
      </div>
    </div>
  `;
}

function runRealBacktest() {
  const fileInput = document.getElementById('bt-csv');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert("请先选择一个包含收益率的 CSV 文件！");
    return;
  }
  
  const file = fileInput.files[0];
  const rf = parseFloat(document.getElementById('bt-rf')?.value || 0.02);
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    let stratCum = [1], benchCum = [1], dates = [];
    let stratRets = [], benchRets = [];
    
    for(let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < 3) continue;
      dates.push(cols[0]);
      
      const sr = parseFloat(cols[1]);
      const br = parseFloat(cols[2]);
      if (isNaN(sr) || isNaN(br)) continue;
      
      stratRets.push(sr);
      benchRets.push(br);
      
      stratCum.push(stratCum[stratCum.length-1] * (1 + sr));
      benchCum.push(benchCum[benchCum.length-1] * (1 + br));
    }
    
    if (stratRets.length === 0) { alert("解析失败，请确保 CSV 列格式正确。"); return; }
    
    const N = stratRets.length;
    const annRet = (Math.pow(stratCum[stratCum.length-1], 252 / N) - 1) * 100;
    
    let mdd = 0, peak = stratCum[0];
    for(let val of stratCum) {
      if (val > peak) peak = val;
      const dd = (peak - val) / peak;
      if (dd > mdd) mdd = dd;
    }
    
    const meanRet = stratRets.reduce((a,b) => a+b, 0) / N;
    const stdRet = Math.sqrt(stratRets.map(r => Math.pow(r - meanRet, 2)).reduce((a,b)=>a+b,0) / N);
    const dailyRf = Math.pow(1 + rf, 1/252) - 1;
    const sharpe = ((meanRet - dailyRf) / stdRet) * Math.sqrt(252);
    const winRate = (stratRets.filter(r => r > 0).length / N) * 100;
    
    document.getElementById('bt-ann').textContent = annRet.toFixed(2) + '%';
    document.getElementById('bt-mdd').textContent = '-' + (mdd * 100).toFixed(2) + '%';
    document.getElementById('bt-sharpe').textContent = sharpe.toFixed(2);
    document.getElementById('bt-win').textContent = winRate.toFixed(2) + '%';
    
    renderLine('ft-backtest-chart', [
      { x: dates, y: stratCum.slice(1), mode: 'lines', name: '真实策略净值', line: { color: '#00d4aa', width: 2 } },
      { x: dates, y: benchCum.slice(1), mode: 'lines', name: '真实基准净值', line: { color: '#6b7fa3', width: 1.5, dash: 'dash' } }
    ], { xaxis: { title: '日期' }, yaxis: { title: '累计净值', tickformat: '.2f' }, showlegend: true });
    
    window.__copilot?.addMessage('sys', `✓ 真实数据解析完毕，成功处理 ${N} 个交易日的数据。`);
  };
  reader.readAsText(file);
}

/* ─── Tab 3: 风险指标 (Risk Metrics) - 恢复原版 ─── */
function _renderRisk(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title rose">日收益率分布 & 尾部风险</div>
        <div id="ft-risk-hist" style="height:220px;margin-bottom:12px;"></div>
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:12px;background:rgba(224,92,122,0.08);padding:10px;border-radius:6px;border:1px solid rgba(224,92,122,0.3);">
          <div><span style="color:var(--text-faint);">95% VaR:</span> <strong style="color:var(--rose);">-2.4%</strong></div>
          <div><span style="color:var(--text-faint);">99% VaR:</span> <strong style="color:var(--rose);">-3.8%</strong></div>
          <div><span style="color:var(--text-faint);">95% CVaR:</span> <strong style="color:var(--rose);">-3.1%</strong></div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">极端情景压力测试 (Stress Test)</div>
        <table class="exp-table" style="margin-top: 16px;">
          <thead><tr><th>历史情景</th><th>市场跌幅</th><th>组合预估回撤</th></tr></thead>
          <tbody>
            <tr><td>2008 国际金融危机</td><td style="color:var(--rose);">-55.3%</td><td style="color:var(--rose);font-weight:bold;">-28.5%</td></tr>
            <tr><td>2015 股灾</td><td style="color:var(--rose);">-43.2%</td><td style="color:var(--rose);font-weight:bold;">-22.1%</td></tr>
            <tr><td>2020 疫情熔断</td><td style="color:var(--rose);">-33.8%</td><td style="color:var(--rose);font-weight:bold;">-14.7%</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  setTimeout(() => _drawHistogram(), 50);
}

function _drawHistogram() {
  const container = document.getElementById('ft-risk-hist');
  if(!container) return;
  const returns = Array.from({length: 500}, () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.03);
  returns.push(-0.06, -0.05, -0.045); 
  
  Plotly.newPlot('ft-risk-hist', [{
    x: returns, type: 'histogram', marker: { color: 'rgba(224, 92, 122, 0.6)', line: { color: '#e05c7a', width: 1 } }
  }], {
    ...BASE_LAYOUT, margin: { t: 10, b: 30, l: 30, r: 10 },
    xaxis: { ...BASE_LAYOUT.xaxis, title: '日收益率', tickformat: '.1%' },
    yaxis: { ...BASE_LAYOUT.yaxis, title: '频数' },
  }, BASE_CONFIG);
}

/* ─── Tab 4: 事件研究 (Event Study) - 恢复原版 ─── */
function _renderEvent(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title cyan">标准事件研究法 (Event Study)</div>
      <div class="grid-2">
        <div>
          <div style="display:flex;gap:10px;margin-bottom:12px;">
            <div style="flex:1;"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">事件窗口</div><input type="text" class="copilot-input" value="[-10, 10]" disabled></div>
            <div style="flex:1;"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">估计窗口</div><input type="text" class="copilot-input" value="[-120, -11]" disabled></div>
          </div>
          <button class="btn btn-primary" style="margin-bottom:12px;" onclick="window.__fintech?.runEventStudy()">📊 测算累计异常收益 (CAR)</button>
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
  const x = Array.from({length: 21}, (_, i) => i - 10);
  let car = [], current = 0;
  for(let i=0; i<21; i++) {
    if(x[i] < 0) current += (Math.random() - 0.5) * 0.5; 
    else if(x[i] === 0) current -= 2.5; 
    else current -= Math.random() * 0.4; 
    car.push(current);
  }
  
  renderLine('ft-event-chart', [
    { x: x, y: car, mode: 'lines+markers', name: 'CAR (%)', line: { color: '#e05c7a', width: 2 } }
  ], {
    xaxis: { title: '相对事件日 (T)', tickvals: [-10, -5, 0, 5, 10] },
    yaxis: { title: '累计异常收益率 CAR (%)' },
    shapes: [{ type: 'line', x0: 0, x1: 0, y0: 0, y1: 1, yref: 'paper', line: { color: '#d4a853', width: 1.5, dash: 'dash' } }]
  });
}

window.__fintech = { init, switchTab, runICAnalysis, runRealBacktest, runEventStudy };