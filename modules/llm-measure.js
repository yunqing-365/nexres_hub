/* ═══════════════════════════════════════════════════════
   modules/llm-measure.js — 文本量化测量仪 (LLM as a Measurement Tool)
   Features: Prompt 工程测试 · 批量文本打分 · 情感与不确定性指数构建
═══════════════════════════════════════════════════════ */

import { renderLine, BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-llm-measure';
let _activeTab = 'prompt';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">文本量化测量仪 (LLM Measurement)</div>
        <div class="page-desc">将 LLM 作为科研测量工具，从年报、新闻、访谈中自动提取情绪打分与面板变量。</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="prompt" onclick="window.__llmMeasure?.switchTab('prompt',this)">🎯 测量标准与 Prompt 标定</div>
      <div class="module-tab" data-tab="batch" onclick="window.__llmMeasure?.switchTab('batch',this)">📊 批量提取与指数构建</div>
    </div>

    <div id="llm-measure-content"></div>
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
  const content = document.getElementById('llm-measure-content');
  if (!content) return;
  if (tab === 'prompt') _renderPromptSetup(content);
  else if (tab === 'batch') _renderBatchProcess(content);
}

/* ─── Tab 1: 测量标准与 Prompt 标定 ─── */
function _renderPromptSetup(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">第 1 步：定义测量 Prompt</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          你需要像训练人工标注员一样，给 LLM 下达极其清晰的打分标准（Rubric）和输出格式约束。
        </div>
        
        <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">系统指令 (System Prompt) & 测量维度</div>
        <textarea id="measure-prompt" class="copilot-input" style="height:140px;margin-bottom:12px;line-height:1.6;">你是一个专业的金融文本分析专家。请阅读下方的企业年报 MD&A 段落，并在 0 到 100 分之间，评估该企业管理层的【数字化转型意愿】。
评分标准：
- 0-20分：完全没有提及或仅停留于泛泛而谈。
- 50分左右：有明确规划，但缺乏实质性资金投入或底层技术改造。
- 80-100分：将数字化作为核心战略，有明确的AI、大数据项目落地并重塑了业务流程。
【输出要求】：请仅输出一个 JSON，格式为 {"score": 打分数值, "reason": "一句话理由"}</textarea>
        
        <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">测试样本 (Sample Text)</div>
        <textarea id="measure-sample" class="copilot-input" style="height:80px;margin-bottom:12px;line-height:1.6;">报告期内，公司积极响应国家号召，逐步推进业务线上化。我们在部分车间引入了自动化设备，但受限于行业大环境，整体信息系统的全面升级仍需谨慎论证。</textarea>
        
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="window.__llmMeasure?.testPrompt()">
          ⚡ 在右侧 AI 面板进行零样本 (Zero-shot) 测试
        </button>
      </div>

      <div class="card">
        <div class="card-title violet">LLM 测量学诊断 (Measurement Validity)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          在将 LLM 用于批量打分前，必须在学术上论证其测量的信度（Reliability）和效度（Validity）。
        </div>
        
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-ghost" style="text-align:left;line-height:1.5;" onclick="window.__copilot?.askCopilot('在社会科学和经济学实证研究中，如果我使用大语言模型（如 GPT-4 或 Claude）对企业的年报文本进行自动打分以构建一个“数字化转型指数”，我该如何在论文的方法论章节中，向审稿人论证这种基于 LLM 测量的【建构效度 (Construct Validity)】和【信度 (Reliability)】？请给我一个标准的回应话术。', '文本测量仪', true)">
            🤖 问 AI：如何向审稿人论证 LLM 打分的有效性？
          </button>
          
          <button class="btn btn-ghost" style="text-align:left;line-height:1.5;" onclick="window.__copilot?.askCopilot('LLM 在处理长文本时存在“幻觉（Hallucination）”和“位置偏见（Lost in the Middle）”。为了保证批量打分的数据质量，在 Prompt 工程和分块策略（Chunking）上，我应该采取哪些具体的技术手段来降低噪声？', '文本测量仪', true)">
            🤖 问 AI：如何减少 LLM 提取时的幻觉和噪声？
          </button>
        </div>
      </div>
    </div>
  `;
}

function testPrompt() {
  const sysPrompt = document.getElementById('measure-prompt')?.value.trim();
  const sample = document.getElementById('measure-sample')?.value.trim();
  if (!sysPrompt || !sample) {
    alert("请填写 Prompt 和测试样本！");
    return;
  }
  const fullPrompt = `${sysPrompt}\n\n待测量文本：\n"""\n${sample}\n"""`;
  window.__copilot?.askCopilot(fullPrompt, '文本量化测试', true);
}

/* ─── Tab 2: 批量提取与指数构建 ─── */
function _renderBatchProcess(container) {
  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="card-title gold" style="margin-bottom:0;">批量处理与数据汇表</div>
        <button class="btn btn-primary btn-sm" onclick="window.__llmMeasure?.runBatch()">▶ 执行批量打分</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;margin-top:8px;">
        模拟系统并发出并发请求，对 500 份企业年度文本进行打分。提取的分数将自动聚合成可导出的 CSV 面板数据。
      </div>
      
      <table class="exp-table">
        <thead>
          <tr><th>企业代码</th><th>年份</th><th>文本片段缩略</th><th style="color:var(--gold);">数字化打分 (0-100)</th><th>LLM 提取理由</th></tr>
        </thead>
        <tbody id="batch-table-body">
          <tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:20px;">点击上方按钮执行批量打分...</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-title emerald">行业/宏观层面指数合成 (Index Construction)</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
        将企业微观的 LLM 打分按时间轴取均值，即可构建出行业的时序指数（类似著名的 EPU 经济政策不确定性指数）。
      </div>
      <div id="measure-index-chart" style="height:250px; background:rgba(0,0,0,0.1); border-radius:8px; border:1px solid var(--border);"></div>
    </div>
  `;
  setTimeout(() => drawIndexChart(true), 50);
}

function runBatch() {
  const tbody = document.getElementById('batch-table-body');
  if(!tbody) return;
  
  // 模拟 LLM 批量处理完成后的结果
  const results = [
    { code: '000001', year: 2021, text: '启动云端迁移，设立数字化转型办公室...', score: 85, reason: '有核心战略与专门组织架构' },
    { code: '000002', year: 2021, text: '引入自动化产线，部分设备实现物联...', score: 60, reason: '偏向底层硬件改造，缺乏顶层软件设计' },
    { code: '600000', year: 2021, text: '宏观经济承压，公司决定缩减IT开支...', score: 15, reason: '数字化投入存在倒退' },
    { code: '000001', year: 2022, text: '全面建成数据中台，AI算法赋能信贷审批...', score: 95, reason: 'AI核心项目落地并重塑业务' }
  ];

  tbody.innerHTML = results.map(r => `
    <tr>
      <td style="color:var(--cyan);font-family:var(--font-mono);">${r.code}</td>
      <td>${r.year}</td>
      <td style="color:var(--text-muted);font-size:11px;">${r.text}</td>
      <td style="color:var(--gold);font-weight:bold;font-size:14px;">${r.score}</td>
      <td style="color:var(--text-faint);font-size:11px;">${r.reason}</td>
    </tr>
  `).join('');

  drawIndexChart(false);
  window.__copilot?.addMessage('sys', '✓ 批量打分完成。面板数据已生成，你可以直接将其作为自变量/因变量导入 Stata 或 Python 跑回归了！');
}

function drawIndexChart(isInit) {
  const container = document.getElementById('measure-index-chart');
  if(!container || typeof Plotly === 'undefined') return;

  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
  // 模拟从海量文本中提取出的全行业指数趋势
  const indexVals = [35, 38, 42, 45, 55, 72, 85, 88]; 

  Plotly.newPlot('measure-index-chart', [{
    x: years, y: indexVals, mode: 'lines+markers', name: '行业数字化意愿指数',
    line: { color: '#10b981', width: 3 }, marker: { size: 8, color: '#10b981' },
    fill: 'tozeroy', fillcolor: 'rgba(16,185,129,0.1)'
  }], {
    ...BASE_LAYOUT,
    margin: { t: 20, b: 30, l: 40, r: 20 },
    xaxis: { title: '年份', tickformat: 'd', gridcolor: '#1e2d4a' },
    yaxis: { title: 'LLM 综合打分', gridcolor: '#1e2d4a' }
  }, BASE_CONFIG);
}

window.__llmMeasure = { init, switchTab, testPrompt, runBatch };