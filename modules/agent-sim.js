/* ═══════════════════════════════════════════════════════
   modules/agent-sim.js — 大模型经济沙盘 (LLM Agentic Simulation)
   Features: 多智能体环境配置 · 宏观涌现行为仿真 · 长鞭效应/挤兑模拟
═══════════════════════════════════════════════════════ */

import { renderLine, BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-agent-sim';
let _activeTab = 'config';
let _simInterval = null;

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">大模型经济沙盘 (Agentic Simulation)</div>
        <div class="page-desc">让多个 LLM 扮演消费者、企业或交易员，模拟经济系统的宏观涌现现象。</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="config" onclick="window.__agentSim?.switchTab('config',this)">🎮 环境与智能体配置</div>
      <div class="module-tab" data-tab="sim" onclick="window.__agentSim?.switchTab('sim',this)">💬 实时交互与涌现观测</div>
    </div>

    <div id="agent-sim-content"></div>
  `;

  _renderTab(_activeTab);
}

function switchTab(tab, el) {
  _activeTab = tab;
  clearInterval(_simInterval); // 切换 Tab 时停止仿真
  document.querySelectorAll(`#${CONTAINER} .module-tab`).forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderTab(tab);
}

function _renderTab(tab) {
  const content = document.getElementById('agent-sim-content');
  if (!content) return;
  if (tab === 'config') _renderConfig(content);
  else if (tab === 'sim') _renderSim(content);
}

/* ─── Tab 1: 环境与智能体配置 ─── */
function _renderConfig(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">宏观经济剧本 (Scenario)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          设定智能体所处的外部环境冲击。不同的冲击会激发 LLM 不同的决策逻辑。
        </div>
        
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">选择剧本</div>
            <select id="sim-scenario" class="copilot-input" onchange="window.__agentSim?.updateScenarioDesc()">
              <option value="bullwhip">供应链长鞭效应 (Bullwhip Effect)</option>
              <option value="bankrun">金融市场恐慌挤兑 (Bank Run)</option>
              <option value="inflation">通胀预期下的价格螺旋 (Inflation Spiral)</option>
            </select>
          </div>
          <div id="scenario-desc" style="background:rgba(0,0,0,0.2);border:1px dashed var(--border);border-radius:6px;padding:10px;font-size:12px;color:var(--text);line-height:1.6;">
            <strong>剧本设定：</strong> 市场突然出现微小的需求波动。由于信息不对称，处于供应链不同节点（零售商、批发商、制造商）的 LLM 智能体只能根据本地库存和上下游订单进行决策。
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">全局信息透明度</div>
            <input type="range" min="0" max="100" value="20" style="width:100%;">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);"><span>低 (信息隔离)</span><span>高 (完全信息)</span></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title violet">LLM 智能体设定 (Agent Persona)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          为参与仿真的大模型分配角色 Prompt。
        </div>
        
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;background:rgba(124,111,205,0.1);padding:8px;border-radius:6px;border:1px solid var(--violet);">
            <div style="font-size:24px;">🏪</div>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:bold;color:var(--text);">零售商 Agents (N=50)</div>
              <div style="font-size:11px;color:var(--text-faint);">"你是一个零售商。你面临随机的消费者需求，需要向批发商订货以维持库存..."</div>
            </div>
          </div>
          
          <div style="display:flex;align-items:center;gap:10px;background:rgba(0,212,170,0.1);padding:8px;border-radius:6px;border:1px solid var(--cyan);">
            <div style="font-size:24px;">🏢</div>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:bold;color:var(--text);">批发商 Agents (N=10)</div>
              <div style="font-size:11px;color:var(--text-faint);">"你是一个批发商。你汇总零售商的订单，并向制造商下达大宗采购请求..."</div>
            </div>
          </div>
          
          <div style="display:flex;align-items:center;gap:10px;background:rgba(212,168,83,0.1);padding:8px;border-radius:6px;border:1px solid var(--gold);">
            <div style="font-size:24px;">🏭</div>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:bold;color:var(--text);">制造商 Agents (N=2)</div>
              <div style="font-size:11px;color:var(--text-faint);">"你是源头制造商。生产存在时间滞后，你需要根据批发商的订单安排排产..."</div>
            </div>
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:16px;justify-content:center;" onclick="window.__agentSim?.startSimulation()">
          🚀 初始化沙盘并开始推演
        </button>
      </div>
    </div>
  `;
}

function updateScenarioDesc() {
  const val = document.getElementById('sim-scenario').value;
  const desc = document.getElementById('scenario-desc');
  if (val === 'bullwhip') {
    desc.innerHTML = '<strong>剧本设定：</strong> 市场突然出现微小的需求波动。由于信息不对称，处于供应链不同节点的 LLM 智能体只能根据本地库存进行决策，观察波动是否会被逐级放大。';
  } else if (val === 'bankrun') {
    desc.innerHTML = '<strong>剧本设定：</strong> 市场上出现一条关于某银行流动性不足的谣言。LLM 投资者智能体需要根据自身风险偏好（Risk Aversion）和周围人的提款排队行为做出是否跟风提款的决策。';
  } else {
    desc.innerHTML = '<strong>剧本设定：</strong> 央行宣布释放流动性，企业 Agent 和 消费者 Agent 开始就商品定价和工资要求展开博弈，观察是否会涌现出螺旋上升的通胀。';
  }
}

function startSimulation() {
  switchTab('sim', document.querySelector(`#${CONTAINER} .module-tab[data-tab="sim"]`));
}

/* ─── Tab 2: 实时交互与涌现观测 ─── */
function _renderSim(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card" style="display:flex;flex-direction:column;">
        <div class="card-title cyan">多智能体实时决策流 (Agent Logs)</div>
        <div id="sim-terminal" style="flex:1;background:#050810;border:1px solid var(--border);border-radius:6px;padding:12px;font-family:var(--font-mono);font-size:11px;color:#a8c0e8;overflow-y:auto;height:320px;">
          [System] 正在唤醒 62 个 LLM 智能体实例...<br>
          [System] 剧本「供应链长鞭效应」已加载。T=1 回合开始。<br>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="card-title gold" style="margin-bottom:0;">宏观涌现：订单波动方差 (Variance)</div>
          <span style="font-size:11px;color:var(--rose);" id="sim-status">🔴 正在推演...</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;margin-top:4px;">
          观察末端消费者的微小需求扰动，是如何被层层放大，导致制造商接到极端波动的订单的。
        </div>
        <div id="sim-chart" style="height:280px;"></div>
      </div>
    </div>
    
    <div style="margin-top:16px;display:flex;gap:10px;">
      <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('在上述的多智能体沙盘推演中，LLM 完美复现了经典的“长鞭效应（Bullwhip Effect）”。请从经济学和运筹学的角度分析，导致信息在供应链中被扭曲并逐级放大的核心原因是什么？在现实中，企业（如沃尔玛或丰田）是如何利用信息共享机制来打破这个魔咒的？', 'Agent经济沙盘', true)">
        🤖 问 AI：解析长鞭效应的经济学本质
      </button>
      <button class="btn btn-rose btn-sm" onclick="window.__agentSim?.stopSimulation()">
        ⏹️ 终止推演
      </button>
    </div>
  `;

  setTimeout(runSimulation, 100);
}

function runSimulation() {
  const terminal = document.getElementById('sim-terminal');
  const chartEl = document.getElementById('sim-chart');
  if (!terminal || !chartEl || typeof Plotly === 'undefined') return;

  // 初始数据
  let time = [];
  let consumerReq = [];
  let retailerOrd = [];
  let wholesalerOrd = [];
  let makerOrd = [];
  
  let t = 0;

  Plotly.newPlot('sim-chart', [
    { x: time, y: consumerReq, mode: 'lines', name: '消费者实际需求', line: { color: '#6b7fa3', dash: 'dash', width: 2 } },
    { x: time, y: retailerOrd, mode: 'lines', name: '零售商向外订货量', line: { color: '#7c6fcd', width: 1.5 } },
    { x: time, y: wholesalerOrd, mode: 'lines', name: '批发商向外订货量', line: { color: '#00d4aa', width: 2 } },
    { x: time, y: makerOrd, mode: 'lines', name: '制造商排产计划', line: { color: '#e05c7a', width: 2.5 } }
  ], {
    ...BASE_LAYOUT,
    margin: { t: 20, b: 30, l: 30, r: 20 },
    xaxis: { title: '时间回合 (T)', gridcolor: '#1e2d4a' },
    yaxis: { title: '订单数量', gridcolor: '#1e2d4a', range: [0, 100] },
    legend: { orientation: 'h', y: -0.2, bgcolor: 'transparent', font: { size: 10, color: '#dde4f0' } }
  }, BASE_CONFIG);

  const logs = [
    { role: 'Retailer-12', msg: '消费者需求突然涨了2个单位。为了安全起见，我向批发商多订5个。' },
    { role: 'Retailer-34', msg: '库存见底了，虽然今天只卖了12个，但我决定订购20个防止缺货。' },
    { role: 'Wholesaler-03', msg: '发现多个零售商订单激增。考虑到交货延迟，我向制造商翻倍下达采购单！' },
    { role: 'Maker-01', msg: '接到了海量订单。立刻启动备用生产线，产能全开！' },
    { role: 'Retailer-05', msg: '需求回落了。仓库堆满了上周到的货，今天暂停进货。' },
    { role: 'Wholesaler-02', msg: '突然没有零售商下单了？但我上周向制造商订的货还在路上，立刻取消后续订单！' },
    { role: 'Maker-02', msg: '订单断崖式下跌，但原材料已经采购，只能停工消化库存，损失惨重。' }
  ];

  _simInterval = setInterval(() => {
    if (t > 40) {
      stopSimulation();
      return;
    }
    t++;
    time.push(t);

    // 模拟长鞭效应：方差逐级放大
    const base = 50 + Math.sin(t * 0.5) * 5; // 消费者需求只有极小的正弦波动
    consumerReq.push(base);
    
    retailerOrd.push(base + (Math.random() - 0.5) * 15 * (t / 10)); 
    wholesalerOrd.push(base + (Math.random() - 0.5) * 30 * (t / 10));
    makerOrd.push(base + (Math.random() - 0.5) * 50 * (t / 10));

    Plotly.update('sim-chart', {
      x: [time, time, time, time],
      y: [consumerReq, retailerOrd, wholesalerOrd, makerOrd]
    });

    // 随机打印智能体日志
    if (t % 2 === 0) {
      const log = logs[Math.floor(Math.random() * logs.length)];
      let color = log.role.includes('Retailer') ? 'var(--violet)' : log.role.includes('Wholesaler') ? 'var(--cyan)' : 'var(--rose)';
      terminal.innerHTML += `<br><span style="color:${color};">[${log.role}]</span> ${log.msg}`;
      terminal.scrollTop = terminal.scrollHeight;
    }

  }, 400);
}

function stopSimulation() {
  clearInterval(_simInterval);
  const status = document.getElementById('sim-status');
  if (status) status.innerHTML = '<span style="color:var(--emerald);">✅ 推演完成</span>';
  const term = document.getElementById('sim-terminal');
  if (term) {
    term.innerHTML += '<br><br>[System] 仿真结束。<strong style="color:var(--rose);">结论：微观智能体的防御性库存策略，导致宏观系统涌现出严重的长鞭效应。</strong>';
    term.scrollTop = term.scrollHeight;
  }
}

window.__agentSim = { init, switchTab, updateScenarioDesc, startSimulation, stopSimulation };