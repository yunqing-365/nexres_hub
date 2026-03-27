/* ═══════════════════════════════════════════════════════
   modules/dashboard.js — Dashboard Module
   Renders: stat cards · project list · daily plan · weekly chart
   Lifecycle: init() called by shell on tab switch
═══════════════════════════════════════════════════════ */

import { renderBar }    from '../utils/charts.js';
import { statCard, card } from '../components/card.js';
import { setApiKey, hasApiKey } from '../utils/api.js';

const CONTAINER = 'module-dashboard';

/* ── Static data (replace with storage in full impl) ── */
const PROJECTS = [
  { name: '气候政策对企业 ESG 评分的因果效应', tags: ['DID / PSM', '定量'],   colors: ['gold', 'cyan'],  progress: 65, target: 'methods' },
  { name: 'ResNet-50 卫星图像贫困指数预测',    tags: ['Deep Learning', '计算'], colors: ['violet', 'emerald'], progress: 90, target: 'ml' },
  { name: '大模型在经济政策解读中的能力边界',   tags: ['LLM Eval', '进行中'],   colors: ['rose', 'cyan'],  progress: 30, target: 'writing' },
];

const DAILY_PLAN = [
  { done: true,  text: '<strong>文献综述</strong> — 补充 3 篇 DiD 相关文献，更新引用' },
  { done: false, text: '<strong>数据清洗</strong> — 处理 ESG 数据集缺失值 & 异常值' },
  { done: false, text: '<strong>模型运行</strong> — 跑基准回归，记录 β 系数和 SE' },
  { done: false, text: '<strong>写作</strong> — 完善方法论章节（预计 500 字）' },
];

/* ── Render ── */
export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">欢迎回来，研究员</div>
        <div class="page-desc">今天是科研的好日子 · 已连续工作 12 天</div>
      </div>
      <div style="display:flex;gap:8px;">
        <select onchange="window.__dashboard?.setMode(this.value)" style="font-size:11px;">
          <option value="quant">定量研究模式</option>
          <option value="qual">定性研究模式</option>
          <option value="comp">计算研究模式</option>
          <option value="theory">理论研究模式</option>
        </select>
        <button class="btn btn-primary" onclick="window.__shell?.switchTab('writing')">✦ 新建草稿</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid-4" style="margin-bottom:16px;">
      ${statCard({ num: '3',  label: '进行中项目',  change: '↑ 本周新增 1', accent: 'gold',   onclick: "window.__shell?.switchTab('methods')" })}
      ${statCard({ num: '47', label: '归档文献',    change: '↑ 本周 +8 篇', accent: 'cyan',   onclick: "window.__shell?.switchTab('literature')" })}
      ${statCard({ num: '24', label: '实验记录',    change: '↑ 今日 +3 条', accent: 'violet', onclick: "window.__shell?.switchTab('explog')" })}
      ${statCard({ num: '2',  label: '论文草稿',    change: '⏱ 距 DDL 18天', accent: 'rose',  onclick: "window.__shell?.switchTab('writing')" })}
    </div>

    <div class="grid-2">
      ${card({
        title: '活跃研究项目',
        content: PROJECTS.map(p => `
          <div class="project-item" onclick="window.__shell?.switchTab('${p.target}')">
            <div class="project-name">${p.name}</div>
            <div class="project-meta">
              ${p.tags.map((t, i) => `<span class="tag tag-${p.colors[i]}">${t}</span>`).join('')}
            </div>
            <div class="project-progress">
              <div class="project-progress-fill" style="width:${p.progress}%;background:var(--${p.colors[0]});"></div>
            </div>
          </div>`).join(''),
      })}

      ${card({
        title: '今日科研计划',
        titleColor: 'cyan',
        content: DAILY_PLAN.map((item, i) => `
          <div class="sg-item${item.done ? ' sg-done' : ''}" style="border:none;padding:8px 0;">
            <div class="sg-num">${['①','②','③','④'][i]}</div>
            <div class="sg-text">${item.text}</div>
          </div>`).join('') +
          `<button class="btn btn-ghost btn-sm" style="margin-top:8px;"
            onclick="window.__copilot?.askCopilot('帮我优化今日科研计划，让每项任务更具体、可执行')">
            🤖 AI 优化计划
          </button>`,
      })}
    </div>

    ${card({
      title: '本周科研进展',
      id: 'dash-chart-card',
      content: '<div id="dash-chart" style="height:160px;"></div>',
    })}`;

  // Render chart after DOM is ready
  requestAnimationFrame(_renderWeekChart);

  // Show API key prompt if not yet configured
  setTimeout(_checkApiKey, 800);
}

function _checkApiKey() {
  if (hasApiKey()) return;
  const notice = document.createElement('div');
  notice.id = 'apikey-notice';
  notice.style.cssText = [
    'position:fixed','bottom:24px','right:316px','z-index:999',
    'background:var(--surface-2)','border:1px solid var(--gold)',
    'border-radius:10px','padding:14px 18px','max-width:300px',
    'font-size:12px','color:var(--text-normal)',
    'box-shadow:0 4px 24px rgba(0,0,0,0.5)',
  ].join(';');
  notice.innerHTML = `
    <div style="font-weight:600;color:var(--gold);margin-bottom:8px;">⚙️ 配置 Claude API Key</div>
    <div style="color:var(--text-faint);margin-bottom:10px;line-height:1.5;">
      输入 Anthropic API Key 启用 AI 功能<br>
      <span style="font-size:10px;">Key 仅存储在本地 localStorage，不上传</span>
    </div>
    <input id="apikey-input" type="password" placeholder="sk-ant-api03-..."
      class="copilot-input" style="width:100%;margin-bottom:8px;font-size:11px;">
    <div style="display:flex;gap:8px;">
      <button class="btn btn-primary btn-sm" style="flex:1;"
        onclick="window.__dashboard?.saveApiKey()">✓ 保存</button>
      <button class="btn btn-ghost btn-sm"
        onclick="document.getElementById('apikey-notice')?.remove()">稍后</button>
    </div>`;
  document.body.appendChild(notice);
}

function saveApiKey() {
  const k = document.getElementById('apikey-input')?.value.trim() ?? '';
  if (!k.startsWith('sk-')) { alert('Key 格式不正确，应以 sk- 开头'); return; }
  setApiKey(k);
  document.getElementById('apikey-notice')?.remove();
  window.__copilot?.addMessage('sys', '✅ API Key 已配置，AI 功能已就绪！');
}

function _renderWeekChart() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  renderBar(
    'dash-chart',
    [
      { x: days, y: [2,3,1,4,2,5,3], type: 'bar', name: '文献阅读', marker: { color: 'rgba(0,212,170,0.6)',   line: { color: '#00d4aa', width: 1 } } },
      { x: days, y: [1,2,1,2,1,2,1], type: 'bar', name: '实验运行', marker: { color: 'rgba(212,168,83,0.6)',  line: { color: '#d4a853', width: 1 } } },
      { x: days, y: [0,1,0,1,0,2,1], type: 'bar', name: '写作小时', marker: { color: 'rgba(124,111,205,0.6)', line: { color: '#7c6fcd', width: 1 } } },
    ],
    {
      legend: { font: { size: 10 }, bgcolor: 'transparent', orientation: 'h', y: -0.2 },
      margin: { t: 8, b: 40, l: 30, r: 8 },
    },
  );
}

function setMode(mode) {
  const labels = { quant: '定量研究', qual: '定性研究', comp: '计算研究', theory: '理论研究' };
  window.__copilot?.addMessage('sys', `已切换为 <strong>${labels[mode]}</strong> 模式，相关工具和建议将针对性调整。`);
}

window.__dashboard = { init, setMode, saveApiKey };
