/* ═══════════════════════════════════════════════════════
   modules/dashboard.js — Dashboard Module
   Renders: flow guide · stat cards · real projects · daily plan
   Lifecycle: init() called by shell on tab switch
═══════════════════════════════════════════════════════ */

import { statCard, card } from '../components/card.js';
import { setApiKey, hasApiKey } from '../utils/api.js';
import { PROJECTS, addProject } from '../data/projects.js';
import { PAPERS } from '../data/papers.js';
import { EXPERIMENTS } from '../data/experiments.js';

const CONTAINER = 'module-dashboard';

const DAILY_PLAN = [
  { done: true,  text: '<strong>文献综述</strong> — 补充 3 篇 DiD 相关文献，更新引用' },
  { done: false, text: '<strong>数据清洗</strong> — 处理 ESG 数据集缺失值 & 异常值' },
  { done: false, text: '<strong>模型运行</strong> — 跑基准回归，记录 β 系数和 SE' },
  { done: false, text: '<strong>写作</strong> — 完善方法论章节（预计 500 字）' },
];

const TAG_COLORS = ['gold', 'cyan', 'violet', 'rose', 'emerald'];

/* ── Render ── */
export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;
  _render(root);
  setTimeout(_checkApiKey, 800);
}

function _render(root) {
  const activeProjects = PROJECTS.filter(p => p.status !== 'done');

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

    <!-- Research flow guide -->
    <div class="card" style="margin-bottom:16px;padding:12px 16px;">
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-faint);letter-spacing:0.15em;margin-bottom:10px;">研究流程</div>
      <div style="display:flex;align-items:center;gap:0;overflow-x:auto;">
        ${[
          { id:'literature', icon:'◎', label:'文献',  step:1 },
          { id:'datahub',    icon:'⊞', label:'数据',  step:2 },
          { id:'methods',    icon:'⟁', label:'方法',  step:3 },
          { id:'explog',     icon:'◫', label:'实验',  step:4 },
          { id:'writing',    icon:'✦', label:'写作',  step:5 },
        ].map((s, i, arr) => `
          <div style="display:flex;align-items:center;flex-shrink:0;">
            <div onclick="window.__shell?.switchTab('${s.id}')"
              style="display:flex;flex-direction:column;align-items:center;gap:4px;
                     padding:8px 14px;border-radius:8px;cursor:pointer;
                     border:1px solid var(--border);background:var(--surface-2);
                     transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--cyan)';this.style.color='var(--cyan)'"
              onmouseout="this.style.borderColor='var(--border)';this.style.color=''">
              <span style="font-size:16px;">${s.icon}</span>
              <span style="font-size:10px;font-family:var(--font-mono);">${s.step}. ${s.label}</span>
            </div>
            ${i < arr.length - 1 ? `<div style="width:24px;height:1px;background:var(--border);flex-shrink:0;"></div>` : ''}
          </div>`).join('')}
      </div>
    </div>

    <!-- Stats (live from data) -->
    <div class="grid-3" style="margin-bottom:16px;">
      ${statCard({ num: String(activeProjects.length), label: '进行中项目', change: `共 ${PROJECTS.length} 个项目`, accent: 'gold', onclick: "document.getElementById('dash-projects')?.scrollIntoView({behavior:'smooth'})" })}
      ${statCard({ num: String(PAPERS.length),      label: '归档文献',   change: '点击进入文献库', accent: 'cyan',   onclick: "window.__shell?.switchTab('literature')" })}
      ${statCard({ num: String(EXPERIMENTS.length), label: '实验记录',   change: '点击查看全部',   accent: 'violet', onclick: "window.__shell?.switchTab('explog')" })}
    </div>

    <div class="grid-2">
      <!-- Projects (real data) -->
      <div>
        ${card({
          title: '活跃研究项目',
          id: 'dash-projects',
          content: `
            ${activeProjects.length === 0
              ? '<div style="text-align:center;color:var(--text-faint);padding:24px;">暂无项目，点击下方新建</div>'
              : activeProjects.map(p => _projectCard(p)).join('')
            }
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;justify-content:center;"
              onclick="window.__dashboard?.showNewProjectForm()">
              + 新建项目
            </button>
            <div id="new-project-form" style="display:none;margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">
              ${_newProjectFormHTML()}
            </div>`,
        })}
      </div>

      <!-- Daily plan -->
      <div>
        ${card({
          title: '今日科研计划',
          titleColor: 'cyan',
          content: DAILY_PLAN.map((item, i) => `
            <div class="sg-item${item.done ? ' sg-done' : ''}" style="border:none;padding:8px 0;">
              <div class="sg-num">${['①','②','③','④'][i]}</div>
              <div class="sg-text">${item.text}</div>
            </div>`).join('') +
            `<button class="btn btn-ghost btn-sm" style="margin-top:8px;"
              onclick="window.__copilot?.askCopilot('帮我优化今日科研计划，让每项任务更具体、可执行', '', true)">
              🤖 AI 优化计划
            </button>`,
        })}
      </div>
    </div>`;
}

function _projectCard(p) {
  const colors = (p.tags ?? []).map((_, i) => TAG_COLORS[i % TAG_COLORS.length]);
  const statusColor = { active: 'cyan', paused: 'gold', done: 'emerald' }[p.status] ?? 'cyan';
  const paperCount = (p.paperIds ?? []).length;
  const expCount   = (p.expIds ?? []).length;

  return `
    <div class="project-item" style="cursor:default;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
        <div class="project-name" style="flex:1;">${p.name}</div>
        <span class="tag tag-${statusColor}" style="flex-shrink:0;font-size:9px;">
          ${{ active:'进行中', paused:'暂停', done:'完成' }[p.status] ?? p.status}
        </span>
      </div>
      ${p.desc ? `<div style="font-size:11px;color:var(--text-faint);margin:4px 0 6px;">${p.desc}</div>` : ''}
      <div class="project-meta" style="margin-bottom:8px;">
        ${(p.tags ?? []).map((t, i) => `<span class="tag tag-${colors[i]}">${t}</span>`).join('')}
        <span class="tag tag-violet" style="margin-left:4px;">📄 ${paperCount} 篇</span>
        <span class="tag tag-gold"   style="margin-left:2px;">🧪 ${expCount} 条</span>
      </div>
      <div class="project-progress">
        <div class="project-progress-fill" style="width:${p.progress ?? 0}%;background:var(--${colors[0] ?? 'cyan'});"></div>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" style="font-size:10px;"
          onclick="window.__shell?.switchTab('literature')">文献</button>
        <button class="btn btn-ghost btn-sm" style="font-size:10px;"
          onclick="window.__shell?.switchTab('explog')">实验</button>
        <button class="btn btn-ghost btn-sm" style="font-size:10px;"
          onclick="window.__shell?.switchTab('writing')">写作</button>
        <button class="btn btn-ghost btn-sm" style="font-size:10px;color:var(--rose);margin-left:auto;"
          onclick="window.__dashboard?.deleteProject(${p.id})">删除</button>
      </div>
    </div>`;
}

function _newProjectFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <input id="np-name" class="copilot-input" placeholder="项目名称 *">
      <input id="np-desc" class="copilot-input" placeholder="简介（可选）">
      <input id="np-tags" class="copilot-input" placeholder="标签，逗号分隔（如：DID, 定量）">
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button class="btn btn-primary btn-sm" onclick="window.__dashboard?.saveNewProject()">保存</button>
        <button class="btn btn-ghost btn-sm"   onclick="window.__dashboard?.hideNewProjectForm()">取消</button>
      </div>
    </div>`;
}

/* ── Project actions ── */
function showNewProjectForm() {
  document.getElementById('new-project-form').style.display = 'block';
  document.getElementById('np-name')?.focus();
}

function hideNewProjectForm() {
  document.getElementById('new-project-form').style.display = 'none';
}

function saveNewProject() {
  const name = document.getElementById('np-name')?.value.trim();
  if (!name) { alert('请填写项目名称'); return; }
  const desc = document.getElementById('np-desc')?.value.trim() ?? '';
  const tagsRaw = document.getElementById('np-tags')?.value.trim() ?? '';
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  addProject({ name, desc, tags });

  // re-render dashboard to show new project
  const root = document.getElementById(CONTAINER);
  if (root) _render(root);
  window.__copilot?.addMessage('sys', `✓ 项目「<strong>${name}</strong>」已创建。`);
}

function deleteProject(id) {
  const { deleteProject: del } = window.__projects ?? {};
  // import dynamically since we can't use top-level await
  import('../data/projects.js').then(({ deleteProject: delFn }) => {
    delFn(id);
    const root = document.getElementById(CONTAINER);
    if (root) _render(root);
  });
}

/* ── API Key ── */
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

function setMode(mode) {
  const labels = { quant: '定量研究', qual: '定性研究', comp: '计算研究', theory: '理论研究' };
  window.__copilot?.addMessage('sys', `已切换为 <strong>${labels[mode]}</strong> 模式，相关工具和建议将针对性调整。`);
}

window.__dashboard = {
  init, setMode, saveApiKey,
  showNewProjectForm, hideNewProjectForm, saveNewProject, deleteProject,
};
