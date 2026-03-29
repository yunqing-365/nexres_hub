/* ═══════════════════════════════════════════════════════
   modules/methods.js — Research Methods Navigator
   Tabs: card grid (filterable) + detail panel
═══════════════════════════════════════════════════════ */

import { METHODS, filterMethods, getMethodById } from '../data/methods.js';
import { card, assumptionRow } from '../components/card.js';

const CONTAINER = 'module-methods';

const FILTER_LABELS = {
  all:          '全部方法',
  causal:       '因果推断',
  ml:           '机器学习',
  econometric:  '计量经济',
  qual:         '定性方法',
  theory:       '理论建模',
  text:         '文本分析',
  comp:         '计算方法',
};

const STATUS_ICON = { checkable: '✓', theoretical: '⚠', required: '✗' };
const STATUS_CLS  = { checkable: 'pass', theoretical: 'warn', required: 'fail' };

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">研究方法库</div>
        <div class="page-desc">适配定量 · 定性 · 计算 · 理论 四种研究范式</div>
      </div>
    </div>

    <!-- Filter pills -->
    <div class="rtype-pills" id="method-filters">
      ${Object.entries(FILTER_LABELS).map(([k, v]) =>
        `<button class="rtype-pill${k === 'all' ? ' active' : ''}"
          onclick="window.__methods?.filter('${k}', this)">${v}</button>`
      ).join('')}
    </div>

    <!-- Method cards grid -->
    <div id="methods-grid" class="grid-3"></div>

    <!-- Detail panel (hidden until a card is clicked) -->
    <div id="method-detail" style="display:none;"></div>`;

  _renderGrid(METHODS);
}

/* ── Grid ── */
function filter(tag, el) {
  document.querySelectorAll('.rtype-pill').forEach(p => p.classList.remove('active'));
  el?.classList.add('active');
  _renderGrid(filterMethods(tag));
  document.getElementById('method-detail').style.display = 'none';
}

function _renderGrid(list) {
  const grid = document.getElementById('methods-grid');
  if (!grid) return;
  if (list.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-faint);padding:40px;">暂无匹配方法</div>`;
    return;
  }
  grid.innerHTML = list.map(m => `
    <div class="method-card" id="mc-${m.id}" onclick="window.__methods?.showDetail('${m.id}')">
      <div class="method-icon">${m.icon}</div>
      <div class="method-name">${m.name}</div>
      <div class="method-desc">${m.desc}</div>
      <div class="method-tags">
        ${m.tags.map(t => `<span class="tag tag-${m.color}">${t}</span>`).join('')}
        <span class="tag tag-gold">${_diffLabel(m.difficulty)}</span>
      </div>
    </div>`).join('');
}

function _diffLabel(d) {
  return { easy: '⭐ 入门', medium: '⭐⭐ 进阶', hard: '⭐⭐⭐ 高级' }[d] ?? d;
}

/* ── Detail Panel ── */
function showDetail(id) {
  const m = getMethodById(id);
  if (!m) return;

  // Highlight selected card
  document.querySelectorAll('.method-card').forEach(c =>
    c.classList.toggle('selected', c.id === `mc-${id}`)
  );

  const det = document.getElementById('method-detail');
  det.style.display = 'block';

  det.innerHTML = `
    <div class="method-detail-panel">
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
        <span style="font-size:28px;">${m.icon}</span>
        <div style="flex:1;">
          <div style="font-family:var(--font-display);font-size:18px;color:var(--gold);">${m.name}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${m.desc}</div>
        </div>
        <div style="text-align:right;font-family:var(--font-mono);font-size:11px;color:var(--text-faint);">
          <div>${_diffLabel(m.difficulty)}</div>
          <div style="margin-top:4px;">数据：${m.dataType}</div>
        </div>
      </div>

      <div class="grid-2" style="gap:20px;align-items:start;">
        <!-- Left: assumptions + formula -->
        <div>
          <div class="card-title">核心假设 & 可检验性</div>
          ${m.assumptions.map(a => assumptionRow({
            icon:   STATUS_ICON[a.status] ?? '?',
            status: STATUS_CLS[a.status]  ?? 'warn',
            label:  a.label,
            desc:   a.desc,
          })).join('')}

          ${m.formulae.length ? `
            <div class="card-title" style="margin-top:16px;">关键公式</div>
            ${m.formulae.map(f => `<div class="formula-box">${f}</div>`).join('')}
          ` : ''}
        </div>

        <!-- Right: software + pitfalls + refs -->
        <div>
          <div class="card-title cyan">常用软件包</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.9;margin-bottom:14px;">
            ${m.software.join('<br>')}
          </div>

          <div class="card-title rose">常见陷阱</div>
          ${m.pitfalls.map(p => `
            <div style="display:flex;gap:8px;margin-bottom:7px;font-size:12px;color:var(--text-muted);">
              <span style="color:var(--rose);flex-shrink:0;">⚠</span>${p}
            </div>`).join('')}

          ${m.keyRefs.length ? `
            <div class="card-title" style="margin-top:14px;">关键参考文献</div>
            ${m.keyRefs.map(r => `
              <div style="font-size:12px;color:var(--text-faint);margin-bottom:5px;">• ${r}</div>`
            ).join('')}
          ` : ''}
        </div>
      </div>

      <!-- Related methods -->
      ${m.relatedMethods?.length ? `
        <div style="margin-top:18px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-faint);letter-spacing:0.12em;">相关方法：</span>
          ${m.relatedMethods.map(rid => {
            const rm = getMethodById(rid);
            return rm ? `<span class="tag tag-violet" style="cursor:pointer;"
              onclick="window.__methods?.showDetail('${rid}')">${rm.shortName ?? rm.name}</span>` : '';
          }).join('')}
        </div>` : ''}

      <!-- Checks section -->
      ${m.checks?.length ? `
        <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:0.15em;text-transform:uppercase;">
              ✓ 检验清单
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span id="checks-progress-${m.id}" style="font-family:var(--font-mono);font-size:11px;color:var(--cyan);">
                ${_checksProgress(m)}
              </span>
              <button class="btn btn-ghost btn-sm" onclick="window.__methods?.reportChecks('${m.id}')">
                🤖 生成检验报告
              </button>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${m.checks.map(c => {
              const checked = _isChecked(m.id, c.id);
              return `
                <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;
                  border-radius:6px;border:1px solid ${c.required ? 'rgba(224,92,122,0.2)' : 'var(--border)'};
                  background:${checked ? 'rgba(0,212,170,0.05)' : 'transparent'};
                  transition:background 0.15s;">
                  <input type="checkbox" ${checked ? 'checked' : ''}
                    style="accent-color:var(--cyan);cursor:pointer;margin-top:2px;flex-shrink:0;"
                    onchange="window.__methods?.toggleCheck('${m.id}','${c.id}',this.checked)">
                  <div style="flex:1;">
                    <div style="font-size:12px;color:var(--text);display:flex;align-items:center;gap:6px;">
                      ${c.label}
                      ${c.required ? '<span style="font-size:9px;color:var(--rose);font-family:var(--font-mono);border:1px solid rgba(224,92,122,0.4);padding:1px 5px;border-radius:3px;">必做</span>' : ''}
                    </div>
                    <div style="font-size:11px;color:var(--text-faint);margin-top:3px;">${c.desc}</div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>` : ''}

      <!-- AI action buttons -->
      <div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap;border-top:1px solid var(--border);padding-top:16px;">
        <button class="btn btn-primary btn-sm"
          onclick="window.__copilot?.askCopilot('请详细解释「${m.name}」的核心原理、适用场景和主要局限性，并给出一个经济学研究的具体例子', '研究方法库', true)">
          🤖 深度解析
        </button>
        <button class="btn btn-ghost btn-sm"
          onclick="window.__copilot?.askCopilot('在ESG政策效应研究中，「${m.name}」是否合适？请分析优劣并建议最佳实践', '研究方法库', true)">
          适用性评估
        </button>
        <button class="btn btn-ghost btn-sm"
          onclick="window.__copilot?.askCopilot('请给出使用「${m.name}」的Python和R代码框架，包括关键假设检验步骤', '研究方法库', true)">
          代码框架
        </button>
        <button class="btn btn-ghost btn-sm"
          onclick="window.__copilot?.askCopilot('「${m.name}」最常见的误用和陷阱是什么？如何避免？', '研究方法库', true)">
          避坑指南
        </button>
      </div>
    </div>`;

/* ── Checks helpers ── */
function _checksKey(methodId) { return `nexres:checks:${methodId}`; }

function _loadChecks(methodId) {
  try { return JSON.parse(localStorage.getItem(_checksKey(methodId))) ?? {}; }
  catch { return {}; }
}

function _isChecked(methodId, checkId) {
  return !!_loadChecks(methodId)[checkId];
}

function _checksProgress(m) {
  if (!m.checks?.length) return '';
  const done = m.checks.filter(c => _isChecked(m.id, c.id)).length;
  const req  = m.checks.filter(c => c.required).length;
  const reqDone = m.checks.filter(c => c.required && _isChecked(m.id, c.id)).length;
  return `必做 ${reqDone}/${req} · 全部 ${done}/${m.checks.length}`;
}

function toggleCheck(methodId, checkId, checked) {
  const state = _loadChecks(methodId);
  state[checkId] = checked;
  localStorage.setItem(_checksKey(methodId), JSON.stringify(state));
  // update progress label
  const m = getMethodById(methodId);
  const el = document.getElementById(`checks-progress-${methodId}`);
  if (el && m) el.textContent = _checksProgress(m);
}

function reportChecks(methodId) {
  const m = getMethodById(methodId);
  if (!m?.checks?.length) return;
  const state = _loadChecks(methodId);
  const lines = m.checks.map(c =>
    `${state[c.id] ? '✅' : '❌'} ${c.label}${c.required ? '（必做）' : ''}：${c.desc}`
  ).join('\n');
  window.__copilot?.askCopilot(
    `我在使用「${m.name}」，以下是我的检验完成情况：\n\n${lines}\n\n请评估我的检验是否充分，对未完成的必做项给出具体操作建议。`,
    '研究方法库 - 检验报告',
    true
  );
}

window.__methods = { init, filter, showDetail, toggleCheck, reportChecks };
