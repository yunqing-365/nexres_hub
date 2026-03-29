/* ═══════════════════════════════════════════════════════
   components/sidebar.js — Sidebar Navigation Component
   Renders the left nav and mounts it into #sidebar-root.
   Exposes: updateBadge(moduleId, count)
═══════════════════════════════════════════════════════ */

/** Nav item definitions — drives rendering and routing */


// 修改 components/sidebar.js 中的 NAV_ITEMS 数组
const NAV_ITEMS = [
  // 工作台
  { id: 'dashboard',  icon: '◈', label: '总览大盘',     section: '工作台' },
  { id: 'literature', icon: '◎', label: '文献星系',     section: null,    badge: '12篇' },
  { id: 'methods',    icon: '⟁', label: '研究方法库',   section: null },
  { id: 'research-design', icon: '✦', label: '研究设计助手', section: null, badge: 'NEW', badgeClass: 'new' }, // ← NEW
  // 实验工坊
  { id: 'ml',         icon: '⬡', label: 'ML 实验室',   section: '实验工坊' },
  { id: 'dl-lab',     icon: '◈', label: '深度学习实验室', section: null, badge: 'NEW', badgeClass: 'new' }, // ← NEW
  { id: 'explog',     icon: '◫', label: '实验记录本',   section: null },
  { id: 'llm',        icon: '◇', label: 'LLM 竞技场',  section: null },
  // 创作与输出
  { id: 'writing',   icon: '✦', label: '论文工坊',   section: '创作与输出' },
  { id: 'skillmap',  icon: '▷', label: '技能图谱',   section: null },
  // 研究工具 (新分组)
  { id: 'qual-studio', icon: '◎', label: '质性研究工作台', section: '研究工具', badge: 'NEW', badgeClass: 'new' }, // ← NEW
  { id: 'fintech',     icon: '⬡', label: '金融科技模块',   section: null, badge: 'NEW', badgeClass: 'new' }, // ← NEW
  // 数据管理
  { id: 'datahub',   icon: '⊞', label: '数据中心',   section: '数据管理' },
];


function renderSidebar() {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  let html = `
    <div class="sidebar">
      <div class="logo-area">
        <div class="logo-title">⟨ NexRes Hub ⟩</div>
        <div class="logo-sub">Research · Learning · Discovery</div>
        <div class="logo-version">v3.0 · 2025 Enhanced</div>
      </div>`;

  for (const item of NAV_ITEMS) {
    if (item.section) {
      html += `<div class="nav-section">${item.section}</div>`;
    }

    const badge = item.badge
      ? `<span class="nav-badge ${item.badgeClass ?? ''}" id="badge-${item.id}">${item.badge}</span>`
      : '';

    html += `
      <div
        class="nav-item${item.id === 'dashboard' ? ' active' : ''}"
        id="nav-${item.id}"
        data-module="${item.id}"
        onclick="window.__shell?.switchTab('${item.id}', this)"
      >
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
        ${badge}
      </div>`;
  }

  html += `
      <div class="sidebar-footer">
        <span class="status-dot"></span>AI 导师在线
        <br><span style="margin-top:4px;display:block;opacity:0.6">Claude Sonnet · 实时响应</span>
      </div>
    </div>`;

  root.innerHTML = html;
}

/**
 * 更新侧边栏 badge 数字
 * @param {string} moduleId - e.g. 'literature'
 * @param {string|number} text
 */
export function updateBadge(moduleId, text) {
  const el = document.getElementById(`badge-${moduleId}`);
  if (el) el.textContent = String(text);
}

/** 高亮激活项 */
export function setActiveNav(moduleId) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.module === moduleId);
  });
}

// Auto-render on script load
renderSidebar();
