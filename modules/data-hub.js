/* ═══════════════════════════════════════════════════════
   modules/data-hub.js — 数据中心模块
   Tabs:
     · 数据源导航  — 按研究变量分类的数据库链接
     · 我的数据集  — 本地存储、管理已收集的数据
     · 学习指引    — 各数据库的访问与清洗教程（AI 增强）
═══════════════════════════════════════════════════════ */

import { DATA_CATEGORIES, getCategoryById, getAllSources } from '../data/datasources.js';
import { storage, KEYS } from '../utils/storage.js';
import { card } from '../components/card.js';

const CONTAINER = 'module-datahub';

/* ── State ── */
let _activeTab      = 'nav';
let _activeCatId    = DATA_CATEGORIES[0].id;
let _activeVarIdx   = 0;
let _searchQuery    = '';
let _datasets       = [];   // 用户存储的数据集列表

/* ═══ Main Init ═══ */
export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;
  _datasets = storage.get(KEYS.DATASETS, []);
  _render(root);
}

function _render(root) {
  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">数据中心</div>
        <div class="page-desc">经管研究变量数据源导航 · 数据集管理 · 使用指引</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input
          id="dh-search"
          class="copilot-input"
          style="width:200px;height:32px;font-size:12px;"
          placeholder="搜索数据源…"
          oninput="window.__datahub?.onSearch(this.value)"
        >
        <button class="btn btn-primary btn-sm" onclick="window.__datahub?.openAddDataset()">
          ＋ 添加数据集
        </button>
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="tab-bar" style="margin-bottom:16px;">
      ${['nav:🗂 数据源导航', 'datasets:📦 我的数据集', 'guide:📚 学习指引'].map(t => {
        const [id, label] = t.split(':');
        return `<div class="tab-item${_activeTab === id ? ' active' : ''}"
          onclick="window.__datahub?.switchTab('${id}')">${label}</div>`;
      }).join('')}
    </div>

    <!-- Tab Content -->
    <div id="dh-content"></div>

    <!-- Dataset Modal -->
    <div id="dh-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:none;align-items:center;justify-content:center;">
      <div class="card" style="width:480px;max-width:90vw;" id="dh-modal-inner"></div>
    </div>
  `;

  _renderTab();
  _attachTabBarStyle();
}

function _renderTab() {
  const content = document.getElementById('dh-content');
  if (!content) return;
  if (_searchQuery.trim()) {
    _renderSearch(content);
  } else if (_activeTab === 'nav') {
    _renderNav(content);
  } else if (_activeTab === 'datasets') {
    _renderDatasets(content);
  } else {
    _renderGuide(content);
  }
}

/* ═══ Tab: 数据源导航 ═══ */
function _renderNav(container) {
  const cat = getCategoryById(_activeCatId) ?? DATA_CATEGORIES[0];
  const variable = cat.variables[_activeVarIdx] ?? cat.variables[0];

  container.innerHTML = `
    <div style="display:flex;gap:12px;height:calc(100vh - 200px);min-height:420px;">

      <!-- Left: Category List -->
      <div class="card" style="width:160px;flex-shrink:0;padding:8px;overflow-y:auto;">
        ${DATA_CATEGORIES.map(c => `
          <div
            class="nav-item${c.id === _activeCatId ? ' active' : ''}"
            style="font-size:12px;padding:8px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;"
            onclick="window.__datahub?.selectCat('${c.id}')"
          >
            <span>${c.icon}</span>
            <span>${c.label}</span>
          </div>
        `).join('')}
      </div>

      <!-- Middle: Variable List + Source Cards -->
      <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;">

        <!-- Category Header -->
        <div class="card" style="padding:12px 16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">${cat.icon}</span>
            <div>
              <div class="card-title ${cat.color}" style="margin:0;">${cat.label}</div>
              <div style="font-size:12px;color:var(--text-faint);margin-top:2px;">${cat.desc}</div>
            </div>
          </div>
          <!-- Variable Tabs -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;">
            ${cat.variables.map((v, i) => `
              <div
                class="tag tag-${cat.color}${i === _activeVarIdx ? '' : ''}"
                style="cursor:pointer;padding:4px 10px;border-radius:12px;font-size:11px;
                       ${i === _activeVarIdx ? `background:var(--${cat.color});color:#0d1117;font-weight:600;` : 'opacity:0.7;'}"
                onclick="window.__datahub?.selectVar(${i})"
              >${v.name}</div>
            `).join('')}
          </div>
        </div>

        <!-- Source Cards for selected variable -->
        <div style="font-size:11px;color:var(--text-faint);padding:0 2px;">
          <strong style="color:var(--text-normal);">「${variable.name}」</strong> 共 ${variable.sources.length} 个数据源
          ${variable.tags.map(t => `<span class="tag tag-${cat.color}" style="margin-left:6px;">${t}</span>`).join('')}
        </div>

        ${variable.sources.map((src, si) => `
          <div class="card" style="padding:14px 16px;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
              <div style="flex:1;">
                <div style="font-weight:600;font-size:13px;color:var(--text-normal);margin-bottom:4px;">${src.name}</div>
                <div style="font-size:12px;color:var(--text-faint);margin-bottom:8px;">${src.note}</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <span class="tag tag-${_accessColor(src.access)}">${src.access}</span>
                  <span class="tag tag-cyan">格式: ${src.format}</span>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
                <a href="${src.url}" target="_blank" rel="noopener"
                   class="btn btn-primary btn-sm" style="text-decoration:none;font-size:11px;">
                  🔗 访问数据源
                </a>
                <button class="btn btn-ghost btn-sm" style="font-size:11px;"
                  onclick="window.__datahub?.quickAddDataset('${_esc(src.name)}', '${_esc(src.url)}', '${_esc(variable.name)}')">
                  ＋ 加入我的数据集
                </button>
              </div>
            </div>
          </div>
        `).join('')}

        <!-- AI 讲解按钮 -->
        <div class="card" style="padding:12px 16px;border:1px dashed var(--border);background:rgba(0,212,170,0.03);">
          <div style="font-size:12px;color:var(--text-faint);margin-bottom:8px;">
            🤖 让 AI 帮你了解这类数据的获取、清洗和使用方法
          </div>
          <button class="btn btn-ghost btn-sm"
            onclick="window.__copilot?.askCopilot('请详细介绍「${variable.name}」数据的：1）主要来源和可靠性对比 2）常见清洗步骤 3）在经管研究中的典型用法和注意事项')">
            📖 AI 讲解：${variable.name}
          </button>
          <button class="btn btn-ghost btn-sm" style="margin-left:8px;"
            onclick="window.__copilot?.askCopilot('在经管学术论文中，「${variable.name}」最常用作哪类研究的核心变量或控制变量？请举3篇代表性文献说明。')">
            🎓 典型文献用法
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ═══ Tab: 我的数据集 ═══ */
function _renderDatasets(container) {
  const statuses = ['全部', '收集中', '已清洗', '建模中', '完成'];
  const total    = _datasets.length;
  const byStatus = status => _datasets.filter(d => status === '全部' || d.status === status).length;

  container.innerHTML = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
      ${statuses.map(s => `
        <div class="stat-card" style="min-width:100px;cursor:pointer;padding:10px 14px;"
          onclick="window.__datahub?.filterDatasets('${s}')">
          <div class="stat-num cyan" style="font-size:20px;">${byStatus(s)}</div>
          <div class="stat-label">${s}</div>
        </div>
      `).join('')}
    </div>

    ${total === 0 ? `
      <div class="card" style="text-align:center;padding:48px;color:var(--text-faint);">
        <div style="font-size:32px;margin-bottom:12px;">📦</div>
        <div>还没有添加任何数据集</div>
        <div style="font-size:12px;margin-top:6px;">从「数据源导航」点击「＋ 加入我的数据集」，或点击右上角「添加数据集」</div>
      </div>
    ` : `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${_datasets.map((ds, i) => _datasetCard(ds, i)).join('')}
      </div>
    `}
  `;
}

function _datasetCard(ds, i) {
  const statusColors = { '收集中': 'rose', '已清洗': 'gold', '建模中': 'violet', '完成': 'emerald' };
  const color = statusColors[ds.status] ?? 'cyan';
  return `
    <div class="card" style="padding:14px 16px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
        <div style="flex:1;">
          <div style="font-weight:600;font-size:13px;color:var(--text-normal);">${ds.name}</div>
          <div style="font-size:12px;color:var(--text-faint);margin:4px 0;">${ds.variable ?? ''}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
            <span class="tag tag-${color}">${ds.status}</span>
            ${ds.format ? `<span class="tag tag-cyan">${ds.format}</span>` : ''}
            ${ds.obs    ? `<span class="tag tag-gold">N = ${ds.obs}</span>` : ''}
            ${ds.period ? `<span class="tag tag-violet">${ds.period}</span>` : ''}
          </div>
          ${ds.notes ? `<div style="font-size:11px;color:var(--text-faint);margin-top:6px;font-style:italic;">${ds.notes}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
          ${ds.url ? `<a href="${ds.url}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:11px;text-decoration:none;">🔗 来源</a>` : ''}
          <button class="btn btn-ghost btn-sm" style="font-size:11px;"
            onclick="window.__datahub?.editDataset(${i})">✏️ 编辑</button>
          <button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--rose);"
            onclick="window.__datahub?.deleteDataset(${i})">🗑</button>
        </div>
      </div>
      <!-- Progress Bar -->
      <div style="margin-top:10px;height:3px;background:var(--border);border-radius:2px;">
        <div style="height:100%;border-radius:2px;background:var(--${color});
          width:${{'收集中':20,'已清洗':50,'建模中':75,'完成':100}[ds.status]??0}%;
          transition:width 0.4s;"></div>
      </div>
    </div>
  `;
}

/* ═══ Tab: 学习指引 ═══ */
function _renderGuide(container) {
  const guides = [
    {
      icon: '🚀', title: '快速上手：学校数据库访问',
      steps: ['登录学校图书馆 VPN/IP 白名单', '进入数据库首页（建议收藏 CSMAR、CNRDS、Wind）', '注册账号或用学校账号登录', '选择数据范围 → 下载 CSV/Stata 格式'],
      tip: '大多数数据库支持批量导出，建议按「研究区间」一次下载完毕，避免反复登录。',
      aiPrompt: '我是经济学研究生，如何高效利用学校图书馆的数据库资源？请给出具体的访问和管理建议。',
    },
    {
      icon: '🔧', title: 'Stata 数据清洗基础',
      steps: ['`import delimited` 读入 CSV', '`describe` 检查变量类型和缺失值', '`winsorize` 或 `replace` 处理极端值', '`encode` / `destring` 转换变量类型', '`xtset id year` 声明面板结构'],
      tip: '经管数据常见陷阱：股票代码前导零丢失、日期格式不统一、合并键冲突。',
      aiPrompt: '请给我一个完整的 Stata 数据清洗流程模板，适用于中国上市公司面板数据（CSMAR 来源）。',
    },
    {
      icon: '🐍', title: 'Python 数据获取与处理',
      steps: ['用 `pandas` 读取并合并多张表', '用 `tushare` / `akshare` 拉取市场数据', '用 `requests + BeautifulSoup` 爬取公告', '用 `jieba + sklearn` 做文本分析'],
      tip: '对于 Wind API 用户，`WindPy` 可直接在 Python 中调用，效率远高于手动导出。',
      aiPrompt: '帮我写一个 Python 脚本，使用 AKShare 获取 A 股日收益率数据，并计算各股票的年化波动率。',
    },
    {
      icon: '🔗', title: '数据合并：多源数据匹配',
      steps: ['统一企业标识符（股票代码/统一社会信用代码）', '统一时间频率（年度/季度/月度对齐）', '用 `merge m:1` 或 `joinby` 合并', '检查合并后缺失率和样本损失'],
      tip: '跨库合并最常见的问题是股票代码格式不一致（如 000001 vs 1），统一前需逐库检查。',
      aiPrompt: '在 Stata 中如何合并 CSMAR 财务数据和 Wind 股价数据？请给出完整代码和注意事项。',
    },
    {
      icon: '📊', title: '变量构造与描述性统计',
      steps: ['计算 Tobin Q、ROA 等衍生指标', '`winsor2` 对连续变量缩尾', '`tabstat` 生成描述性统计表', '`corr` 检查多重共线性', '`estout` / `outreg2` 导出 LaTeX 表格'],
      tip: '顶刊要求描述性统计包含均值、标准差、P25、P75 和 N，建议用 `estpost tabstat` 一步完成。',
      aiPrompt: '如何用 Stata 生成符合顶级期刊格式要求的描述性统计表？请给出完整代码。',
    },
  ];

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${guides.map(g => `
        <div class="card" style="padding:16px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <span style="font-size:22px;">${g.icon}</span>
            <div class="card-title" style="margin:0;">${g.title}</div>
          </div>
          <ol style="margin:0;padding-left:18px;font-size:12px;color:var(--text-faint);line-height:1.8;">
            ${g.steps.map(s => `<li><code style="color:var(--cyan);font-size:11px;">${s}</code></li>`).join('')}
          </ol>
          <div style="margin-top:10px;padding:8px 12px;background:rgba(0,212,170,0.05);border-left:2px solid var(--cyan);border-radius:4px;font-size:11px;color:var(--text-faint);">
            💡 ${g.tip}
          </div>
          <button class="btn btn-ghost btn-sm" style="margin-top:10px;"
            onclick="window.__copilot?.askCopilot('${g.aiPrompt.replace(/'/g, "\\'")}')">
            🤖 让 AI 详细讲解
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

/* ═══ Search ═══ */
function _renderSearch(container) {
  const q       = _searchQuery.toLowerCase();
  const results = getAllSources().filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.variableName.toLowerCase().includes(q) ||
    s.categoryLabel.toLowerCase().includes(q) ||
    s.note.toLowerCase().includes(q)
  );

  container.innerHTML = `
    <div style="font-size:12px;color:var(--text-faint);margin-bottom:12px;">
      搜索「${_searchQuery}」：找到 ${results.length} 个数据源
    </div>
    ${results.length === 0 ? `<div class="card" style="text-align:center;padding:32px;color:var(--text-faint);">没有匹配的数据源</div>` : ''}
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${results.map(src => `
        <div class="card" style="padding:14px 16px;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;">
            <div>
              <div style="font-weight:600;font-size:13px;color:var(--text-normal);">${src.name}</div>
              <div style="font-size:11px;color:var(--text-faint);margin:3px 0;">
                ${src.categoryLabel} → ${src.variableName}
              </div>
              <div style="font-size:12px;color:var(--text-faint);">${src.note}</div>
              <div style="display:flex;gap:6px;margin-top:6px;">
                <span class="tag tag-${_accessColor(src.access)}">${src.access}</span>
                <span class="tag tag-cyan">${src.format}</span>
              </div>
            </div>
            <a href="${src.url}" target="_blank" class="btn btn-primary btn-sm"
               style="text-decoration:none;font-size:11px;flex-shrink:0;">🔗 访问</a>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ═══ Modal: 添加/编辑数据集 ═══ */
function openAddDataset(prefill = {}) {
  const modal = document.getElementById('dh-modal');
  const inner = document.getElementById('dh-modal-inner');
  if (!modal || !inner) return;

  inner.innerHTML = `
    <div class="card-title">📦 ${prefill.name ? '编辑' : '添加'}数据集</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
      <input id="ds-name"     class="copilot-input" placeholder="数据集名称 *" value="${prefill.name ?? ''}">
      <input id="ds-variable" class="copilot-input" placeholder="对应研究变量（如：ROA、碳排放）" value="${prefill.variable ?? ''}">
      <input id="ds-url"      class="copilot-input" placeholder="数据来源 URL" value="${prefill.url ?? ''}">
      <div style="display:flex;gap:8px;">
        <select id="ds-status" class="copilot-input" style="flex:1;">
          ${['收集中','已清洗','建模中','完成'].map(s =>
            `<option${s === (prefill.status ?? '收集中') ? ' selected' : ''}>${s}</option>`
          ).join('')}
        </select>
        <input id="ds-format" class="copilot-input" style="flex:1;" placeholder="格式 (CSV/Stata…)" value="${prefill.format ?? ''}">
      </div>
      <div style="display:flex;gap:8px;">
        <input id="ds-obs"    class="copilot-input" style="flex:1;" placeholder="样本量 N" value="${prefill.obs ?? ''}">
        <input id="ds-period" class="copilot-input" style="flex:1;" placeholder="时间区间 (如 2010-2023)" value="${prefill.period ?? ''}">
      </div>
      <textarea id="ds-notes" class="copilot-input" rows="2" placeholder="备注（变量说明、清洗记录…）" style="resize:vertical;">${prefill.notes ?? ''}</textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px;">
        <button class="btn btn-ghost btn-sm" onclick="window.__datahub?.closeModal()">取消</button>
        <button class="btn btn-primary btn-sm" onclick="window.__datahub?.saveDataset(${prefill._idx ?? -1})">保存</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('dh-modal');
  if (modal) modal.style.display = 'none';
}

function saveDataset(editIdx = -1) {
  const get = id => document.getElementById(id)?.value.trim() ?? '';
  const name = get('ds-name');
  if (!name) { alert('请填写数据集名称'); return; }

  const ds = {
    name,
    variable: get('ds-variable'),
    url:      get('ds-url'),
    status:   get('ds-status') || '收集中',
    format:   get('ds-format'),
    obs:      get('ds-obs'),
    period:   get('ds-period'),
    notes:    get('ds-notes'),
    addedAt:  editIdx >= 0 ? _datasets[editIdx]?.addedAt : new Date().toISOString().slice(0, 10),
  };

  if (editIdx >= 0 && editIdx < _datasets.length) {
    _datasets[editIdx] = ds;
  } else {
    _datasets.push(ds);
  }
  storage.set(KEYS.DATASETS, _datasets);
  closeModal();
  _activeTab = 'datasets';
  const root = document.getElementById(CONTAINER);
  if (root) _render(root);
}

function quickAddDataset(name, url, variable) {
  openAddDataset({ name, url, variable, status: '收集中' });
}

function editDataset(i) {
  openAddDataset({ ..._datasets[i], _idx: i });
}

function deleteDataset(i) {
  if (!confirm(`确认删除「${_datasets[i]?.name}」？`)) return;
  _datasets.splice(i, 1);
  storage.set(KEYS.DATASETS, _datasets);
  const root = document.getElementById(CONTAINER);
  if (root) _render(root);
}

/* ═══ Helpers ═══ */
function _accessColor(access) {
  if (access === '免费' || access === '注册免费') return 'emerald';
  if (access === '高校付费') return 'gold';
  if (access === '部分免费' || access === '积分制免费') return 'cyan';
  return 'rose';
}

function _esc(str) {
  return (str ?? '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function _attachTabBarStyle() {
  if (document.getElementById('dh-tab-style')) return;
  const s = document.createElement('style');
  s.id = 'dh-tab-style';
  s.textContent = `
    .tab-bar { display:flex; gap:4px; border-bottom:1px solid var(--border); padding-bottom:0; }
    .tab-item {
      padding:8px 16px; font-size:12px; cursor:pointer;
      color:var(--text-faint); border-radius:6px 6px 0 0;
      border:1px solid transparent; border-bottom:none;
      transition: all 0.15s;
    }
    .tab-item:hover { color:var(--text-normal); background:var(--surface-2); }
    .tab-item.active {
      color:var(--cyan); border-color:var(--border);
      background:var(--surface-1); font-weight:600;
      border-bottom-color:var(--surface-1);
      margin-bottom:-1px;
    }
  `;
  document.head.appendChild(s);
}

/* ═══ Public API ═══ */
function switchTab(id) {
  _activeTab = id;
  _searchQuery = '';
  const input = document.getElementById('dh-search');
  if (input) input.value = '';
  _renderTab();
  // Re-render tab bar active state
  document.querySelectorAll(`#${CONTAINER} .tab-item`).forEach(el => {
    el.classList.toggle('active', el.textContent.includes({ nav: '导航', datasets: '数据集', guide: '指引' }[id] ?? ''));
  });
}

function selectCat(id) {
  _activeCatId  = id;
  _activeVarIdx = 0;
  _renderTab();
}

function selectVar(i) {
  _activeVarIdx = i;
  _renderTab();
}

function onSearch(q) {
  _searchQuery = q;
  _renderTab();
}

function filterDatasets(status) {
  // 简单高亮，未来可扩展过滤
  _renderTab();
}

window.__datahub = {
  init, switchTab, selectCat, selectVar, onSearch, filterDatasets,
  openAddDataset, closeModal, saveDataset, quickAddDataset,
  editDataset, deleteDataset,
};
