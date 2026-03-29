/* ═══════════════════════════════════════════════════════
   components/sidebar.js — Sidebar Navigation Component
   Features: Dynamic Workspaces (场景化工作区过滤)
═══════════════════════════════════════════════════════ */

// 给每个模块打上适用的场景标签 modes
const NAV_ITEMS = [
  // 基础基建 (所有模式可见)
  { id: 'workflow', icon: '🗺️', label: '全链路导航仪', section: '基础基建', modes: ['all', 'quant', 'qual', 'comp'] },
  { id: 'dashboard',  icon: '◈', label: '总览大盘', modes: ['all', 'quant', 'qual', 'comp'] },
  { id: 'literature', icon: '◎', label: '文献星系', modes: ['all', 'quant', 'qual', 'comp'] },
  { id: 'lit-matrix', icon: '⚴', label: '文献 Gap 嗅探器', section: '工作台', modes: ['all', 'quant', 'comp', 'qual'], badge: 'Matrix', badgeClass: 'new' },
  { id: 'research-design', icon: '✦', label: '研究设计助手', modes: ['all', 'quant', 'qual', 'comp'] },

  // 数据与推断 (量化、计算主导)
  { id: 'datahub',   icon: '⊞', label: '数据中心', section: '数据与推断', modes: ['all', 'quant', 'comp'] },
  { id: 'causal-engine', icon: '🔗', label: '因果计算引擎', modes: ['all', 'quant'] },
  { id: 'methods',    icon: '⟁', label: '研究方法库', modes: ['all', 'quant', 'qual', 'comp'] },
  { id: 'bayesian-lab', icon: '🎲', label: '贝叶斯与统计仿真', section: '数据与推断', modes: ['all', 'quant', 'comp'], badge: 'MCMC', badgeClass: 'new' },
  { id: 'sensor-dsp', icon: '📡', label: '实时信号与 DSP', section: '数据与推断', modes: ['all', 'quant', 'comp'], badge: 'IoT', badgeClass: 'new' },  

// 金融量化专区
  { id: 'fintech',     icon: '⬡', label: '量化回测与风险', section: '金融量化', modes: ['all', 'quant'] },
  { id: 'derivatives', icon: '📈', label: '高级衍生品引擎', modes: ['all', 'quant'] },

  // 算法与计算 (AI与深度学习主导)
  { id: 'dl-lab',     icon: '◈', label: '深度学习实验室', section: '算法与计算', modes: ['all', 'comp'] },
  { id: 'ml',         icon: '⬡', label: 'ML 实验室', modes: ['all', 'comp', 'quant'] },
  { id: 'agent-studio', icon: '⚡', label: 'Agent 自动化工坊', modes: ['all', 'comp', 'quant'] },
  { id: 'llm',        icon: '◇', label: 'LLM 竞技场', modes: ['all', 'comp', 'qual'] },
  { id: 'xai-studio', icon: '👁️', label: '可解释机器学习 (XAI)', section: '算法与计算', modes: ['all', 'comp', 'quant'], badge: 'SHAP', badgeClass: 'new' },
  // 质性与调研
  { id: 'qual-studio', icon: '◎', label: '质性研究工作台', section: '质性与调研', modes: ['all', 'qual'] },

  // 归档与输出 (所有模式可见)
  { id: 'explog',     icon: '◫', label: '实验记录本', section: '归档与输出', modes: ['all', 'quant', 'comp'] },
  { id: 'writing',   icon: '✍️', label: '论文工坊', modes: ['all', 'quant', 'qual', 'comp'] },
  { id: 'skillmap',  icon: '▷', label: '技能图谱', modes: ['all', 'quant', 'qual', 'comp'] },
  // 在 NAV_ITEMS 数组的 "归档与输出" 分组中加入：
  { id: 'academic-compiler', icon: '🖨️', label: 'LaTeX 编译引擎', section: '归档与输出', modes: ['all', 'quant', 'comp', 'qual'], badge: 'TeX', badgeClass: 'new' },
];

let _currentWorkspace = 'all';

function renderSidebar() {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  // 过滤出当前工作区下可见的模块
  const visibleItems = NAV_ITEMS.filter(item => item.modes.includes(_currentWorkspace));

  let html = `
    <div class="sidebar">
      <div class="logo-area" style="padding-bottom: 12px; border-bottom: none;">
        <div class="logo-title">⟨ NexRes Hub ⟩</div>
        <div class="logo-sub">Research · Learning · Discovery</div>
        <div class="logo-version">v4.0 · Pro Edition</div>
      </div>
      
      <div style="padding: 0 16px 12px; border-bottom: 1px solid var(--border);">
        <select class="copilot-input" style="width: 100%; font-size: 12px; font-weight: 600; color: var(--gold); border-color: var(--border-bright); background: rgba(0,0,0,0.2); cursor: pointer;" onchange="window.__sidebar?.setWorkspace(this.value)">
          <option value="all" ${(_currentWorkspace === 'all') ? 'selected' : ''}>🌐 全栈模式 (显示全部)</option>
          <option value="quant" ${(_currentWorkspace === 'quant') ? 'selected' : ''}>📊 量化与实证研究</option>
          <option value="comp" ${(_currentWorkspace === 'comp') ? 'selected' : ''}>🤖 深度学习与算法</option>
          <option value="qual" ${(_currentWorkspace === 'qual') ? 'selected' : ''}>🗣️ 质性与田野调查</option>
        </select>
      </div>
      
      <div style="flex:1; overflow-y:auto; padding-top:4px;">
  `;

  let currentSection = null;

  for (const item of visibleItems) {
    // 处理 Section 标题的渲染（只在有对应子项时才渲染该标题）
    if (item.section && item.section !== currentSection) {
      html += `<div class="nav-section">${item.section}</div>`;
      currentSection = item.section;
    }

    const badge = item.badge ? `<span class="nav-badge ${item.badgeClass ?? ''}" id="badge-${item.id}">${item.badge}</span>` : '';

    html += `
      <div class="nav-item" id="nav-${item.id}" data-module="${item.id}" onclick="window.__shell?.switchTab('${item.id}', this)">
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
        ${badge}
      </div>`;
  }

  html += `
      </div>
      <div class="sidebar-footer">
        <span class="status-dot"></span>AI 导师在线
        <br><span style="margin-top:4px;display:block;opacity:0.6">Nexus Core · 实时响应</span>
      </div>
    </div>`;

  root.innerHTML = html;
}

export function updateBadge(moduleId, text) {
  const el = document.getElementById(`badge-${moduleId}`);
  if (el) el.textContent = String(text);
}

export function setActiveNav(moduleId) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.module === moduleId);
  });
}

function setWorkspace(mode) {
  _currentWorkspace = mode;
  renderSidebar();
  
  // 重新渲染侧边栏后，恢复当前选中模块的高亮状态
  const activeModulePanel = document.querySelector('.module.active');
  if (activeModulePanel) {
    const moduleId = activeModulePanel.id.replace('module-', '');
    setActiveNav(moduleId);
  }
}

// 暴露给全局供 select 的 onchange 调用
window.__sidebar = { setWorkspace };

// 初始渲染
renderSidebar();