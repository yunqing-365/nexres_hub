/* ═══════════════════════════════════════════════════════
   modules/exp-log.js — Experiment Log Module
   Features: structured records · version tracking
             AI comparison · result chart
═══════════════════════════════════════════════════════ */

import { EXPERIMENTS, addExperiment, markBest, deleteExperiment } from '../data/experiments.js';
import { renderCoefPlot } from '../utils/charts.js';

const CONTAINER = 'module-explog';
let _selected   = new Set();  // ids of checked experiments for comparison

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">实验记录本</div>
        <div class="page-desc">结构化记录 · 版本追踪 · AI 对比分析</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost" onclick="window.__explog?.clearSelection()">取消选择</button>
        <button class="btn btn-primary" onclick="window.__explog?.showForm()">+ 新建记录</button>
      </div>
    </div>

    <!-- New entry form (hidden by default) -->
    <div id="exp-form" class="card" style="display:none;">
      <div class="card-title rose">新建实验记录</div>
      <div class="grid-2" style="gap:12px;margin-bottom:12px;">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;font-family:var(--font-mono);">实验名称 *</div>
          <input type="text" id="ef-name" placeholder="e.g. DID 基准回归 v3">
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;font-family:var(--font-mono);">研究方法</div>
<select id="ef-method" style="width:100%;" onchange="window.__explog?._onMethodChange()">
  <optgroup label="统计与因果推断">
    <option>双重差分 (DID)</option>
    <option>倾向得分匹配 (PSM)</option>
    <option>合成控制法 (SCM)</option>
    <option>断点回归 (RDD)</option>
    <option>工具变量 (IV)</option>
  </optgroup>
  <optgroup label="质性与理论研究">
    <option>单/多案例研究分析</option>
    <option>扎根理论 (三级编码)</option>
    <option>话语分析 / 文本细读</option>
    <option>博弈论均衡推导</option>
  </optgroup>
  <optgroup label="计算与前沿模型">
    <option>Transformer / LLM</option>
    <option>图神经网络 (GNN)</option>
    <option>随机森林 / GBDT</option>
    <option>卷积神经网络</option>
  </optgroup>
  <optgroup label="物理与控制系统">
    <option>数值方程求解优化</option>
    <option>系统动力学仿真</option>
    <option>最速下降/共轭梯度优化</option>
    <option>PDE / 差分方程求解</option>
  </optgroup>
  <optgroup label="硬件与控制">
    <option>RTOS 任务时序仿真</option>
    <option>STM32 中断响应测试</option>
  </optgroup>
</select>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;font-family:var(--font-mono);">所属项目</div>
          <input type="text" id="ef-project" placeholder="e.g. ESG 因果效应">
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;font-family:var(--font-mono);">观测量 / 样本量</div>
          <input type="text" id="ef-obs" placeholder="e.g. 4280">
        </div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;font-family:var(--font-mono);">关键参数 & 假设设定</div>
      <textarea id="ef-params" style="height:70px;margin-bottom:10px;"
        placeholder="e.g. 平行趋势假设成立；控制变量：行业FE、年份FE；Winsorize 1%"></textarea>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;font-family:var(--font-mono);">主要结果 & 系数</div>
      <textarea id="ef-result" style="height:55px;margin-bottom:10px;"
        placeholder="e.g. β=0.043 (SE=0.011, p<0.001)；R²=0.72；通过平行趋势检验"></textarea>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;font-family:var(--font-mono);">备注 / 发现</div>
      <textarea id="ef-notes" style="height:45px;margin-bottom:12px;"
        placeholder="这次实验的特殊发现或与上次的对比…"></textarea>

      <!-- 代码辅助折叠区 -->
      <div style="border:1px solid var(--border);border-radius:8px;margin-bottom:12px;overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;
          background:rgba(0,212,170,0.04);cursor:pointer;"
          onclick="window.__explog?._toggleCodePanel()">
          <span style="font-size:12px;color:var(--cyan);font-family:var(--font-mono);">▶ 代码辅助</span>
          <span style="font-size:10px;color:var(--text-faint);">生成分析框架 · 粘贴运行结果</span>
        </div>
        <div id="ef-code-panel" style="display:none;padding:12px;border-top:1px solid var(--border);">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
            <span style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);">语言：</span>
            <select id="ef-lang" style="font-size:11px;padding:3px 8px;">
              <option value="python">Python</option>
              <option value="r">R</option>
              <option value="stata">Stata</option>
            </select>
            <button class="btn btn-ghost btn-sm" onclick="window.__explog?.genCode()">
              ⚙ 生成代码框架
            </button>
          </div>
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;font-family:var(--font-mono);">生成的代码框架</div>
          <textarea id="ef-code" style="height:100px;margin-bottom:10px;font-family:var(--font-mono);font-size:11px;"
            placeholder="点击「生成代码框架」自动填入，或手动粘贴你的分析代码…"></textarea>
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;font-family:var(--font-mono);">粘贴外部软件运行结果</div>
          <textarea id="ef-run-result" style="height:70px;font-family:var(--font-mono);font-size:11px;"
            placeholder="将 R/Python/Stata 的输出结果粘贴到这里，保存后可让 AI 解读…"></textarea>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px;"
            onclick="window.__explog?.aiInterpretResult()">🤖 AI 解读运行结果</button>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="window.__explog?.saveEntry()">💾 保存记录</button>
        <button class="btn btn-ghost"   onclick="window.__explog?.hideForm()">取消</button>
        <button class="btn btn-ghost btn-sm" style="margin-left:auto;"
          onclick="window.__explog?.aiReview()">🤖 AI 评估设计</button>
      </div>
    </div>

    <!-- Experiment table -->
    <div class="card">
      <div class="card-title">
        实验历史
        <span id="exp-count" style="color:var(--text-muted);font-weight:400;margin-left:4px;">· ${EXPERIMENTS.length} 条</span>
        <span style="margin-left:auto;font-size:10px;color:var(--text-faint);">勾选 ≥2 条可对比分析</span>
      </div>
      <table class="exp-table">
        <thead>
          <tr>
            <th style="width:28px;"></th>
            <th>#</th>
            <th>实验名称</th>
            <th>方法</th>
            <th>关键参数</th>
            <th>核心结果</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="exp-tbody"></tbody>
      </table>
    </div>

    <!-- AI comparison panel -->
    <div class="card">
      <div class="card-title violet">AI 实验对比分析</div>
      <div id="exp-compare-out" style="font-size:13px;line-height:1.8;color:var(--text-muted);">
        勾选至少两条实验记录，AI 将对比分析差异并给出改进建议。
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        <button class="btn btn-violet btn-sm" onclick="window.__explog?.compareSelected()">
          ⚡ 对比选中实验
        </button>
        <button class="btn btn-ghost btn-sm" onclick="window.__explog?.compareAll()">
          📊 分析所有实验趋势
        </button>
      </div>
    </div>`;

  renderTable();
}

/* ── Table ── */
export function renderTable() {
  const tbody = document.getElementById('exp-tbody');
  if (!tbody) return;

  if (EXPERIMENTS.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-faint);padding:24px;">暂无记录，点击「新建记录」开始</td></tr>`;
    return;
  }

  tbody.innerHTML = EXPERIMENTS.map(e => `
    <tr class="${e.best ? 'best' : ''}" id="exp-row-${e.id}">
      <td>
        <input type="checkbox" ${_selected.has(e.id) ? 'checked' : ''}
          onchange="window.__explog?.toggleSelect(${e.id}, this.checked)"
          style="accent-color:var(--cyan);cursor:pointer;">
      </td>
      <td style="color:var(--text-faint);">${e.id}</td>
      <td style="color:var(--text);">${e.name}${e.best ? ' <span style="color:var(--gold);">★</span>' : ''}</td>
      <td><span class="tag tag-gold" style="white-space:nowrap;">${e.method}</span></td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;"
        title="${e.params}">${e.params}</td>
      <td style="color:${e.best ? 'var(--cyan)' : 'var(--text-muted)'};font-family:var(--font-mono);font-size:11px;">
        ${e.result}
      </td>
      <td>
        <span class="tag ${e.status === '完成' ? 'tag-emerald' : 'tag-gold'}">${e.status}</span>
      </td>
      <td style="white-space:nowrap;">
        <button class="btn btn-ghost btn-sm"
          onclick="window.__explog?.markBestEntry(${e.id}, '${e.project}')">★ 标优</button>
        <button class="btn btn-ghost btn-sm" style="margin-left:4px;"
          onclick="window.__explog?.toggleViz(${e.id})">📊</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--rose);margin-left:4px;"
          onclick="window.__explog?.removeEntry(${e.id})">删除</button>
      </td>
    </tr>
    <tr id="exp-viz-${e.id}" style="display:none;">
      <td colspan="8" style="padding:0;">
        <div style="padding:12px 16px;background:rgba(0,0,0,0.15);border-top:1px solid var(--border);">
          <div id="exp-viz-chart-${e.id}" style="height:160px;"></div>
          <div id="exp-viz-msg-${e.id}" style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);margin-top:6px;"></div>
        </div>
      </td>
    </tr>`).join('');

  const countEl = document.getElementById('exp-count');
  if (countEl) countEl.textContent = `· ${EXPERIMENTS.length} 条`;
}

/* ── Form ── */
function showForm() {
  document.getElementById('exp-form').style.display = 'block';
  document.getElementById('ef-name').focus();
}

function hideForm() {
  document.getElementById('exp-form').style.display = 'none';
}

function saveEntry() {
  const name = document.getElementById('ef-name').value.trim();
  if (!name) { alert('请填写实验名称'); return; }

  addExperiment({
    name,
    method:     document.getElementById('ef-method').value,
    project:    document.getElementById('ef-project').value.trim() || '未分类',
    params:     document.getElementById('ef-params').value.trim(),
    result:     document.getElementById('ef-result').value.trim() || '待记录',
    notes:      document.getElementById('ef-notes').value.trim(),
    obs:        parseInt(document.getElementById('ef-obs').value) || null,
    code:       document.getElementById('ef-code')?.value.trim() || '',
    runResult:  document.getElementById('ef-run-result')?.value.trim() || '',
  });

  hideForm();
  renderTable();
  window.__copilot?.addMessage('sys', `✓ 实验「<strong>${name}</strong>」已保存。`);
}

function aiReview() {
  const method = document.getElementById('ef-method').value;
  const params = document.getElementById('ef-params').value;
  const result = document.getElementById('ef-result').value;
  window.__copilot?.askCopilot(
    `请评估这次实验设计是否合理：\n方法：${method}\n假设/参数：${params}\n结果：${result}\n\n请指出潜在的方法论问题和改进建议。`,
    '实验记录本',
    true
  );
}

/* ── Code panel helpers ── */
function _toggleCodePanel() {
  const panel = document.getElementById('ef-code-panel');
  if (!panel) return;
  const open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  const toggle = panel.previousElementSibling?.querySelector('span:first-child');
  if (toggle) toggle.textContent = open ? '▶ 代码辅助' : '▼ 代码辅助';
}

function genCode() {
  const method = document.getElementById('ef-method')?.value ?? '';
  const lang   = document.getElementById('ef-lang')?.value ?? 'python';
  window.__copilot?.askCopilot(
    `请为「${method}」生成一个完整的 ${lang.toUpperCase()} 分析代码框架，包含：数据读入、变量构造、模型估计、结果输出的关键步骤，代码要可直接运行。`,
    '实验记录本 - 代码辅助',
    true
  );
}

function aiInterpretResult() {
  const method    = document.getElementById('ef-method')?.value ?? '';
  const runResult = document.getElementById('ef-run-result')?.value.trim() ?? '';
  if (!runResult) { window.__copilot?.addMessage('sys', '⚠️ 请先粘贴运行结果。'); return; }
  window.__copilot?.askCopilot(
    `我用「${method}」跑出了以下结果，请帮我解读：\n\n${runResult}\n\n请说明：1）系数的经济学含义 2）统计显著性 3）是否有需要注意的问题`,
    '实验记录本 - 结果解读',
    true
  );
}

function _onMethodChange() {
  // 当方法改变时，清空代码框提示用户重新生成
  const codeEl = document.getElementById('ef-code');
  if (codeEl && codeEl.value) {
    codeEl.placeholder = '方法已更改，点击「生成代码框架」重新生成…';
  }
}

/* ── prefillForm — called by data-hub and ml-lab to pre-populate the form ── */
export function prefillForm({ name = '', project = '', params = '', method = '', result = '' } = {}) {
  // ensure module is initialized
  const root = document.getElementById(CONTAINER);
  if (!root || !root.innerHTML.trim()) init();

  showForm();
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  set('ef-name',    name);
  set('ef-project', project);
  set('ef-params',  params);
  set('ef-result',  result);
  // match method select option
  if (method) {
    const sel = document.getElementById('ef-method');
    if (sel) {
      const opt = Array.from(sel.options).find(o => o.value.includes(method) || method.includes(o.value.split(' ')[0]));
      if (opt) sel.value = opt.value;
    }
  }
  document.getElementById('ef-name')?.focus();
}

/* ── Selection & Comparison ── */
function toggleSelect(id, checked) {
  checked ? _selected.add(id) : _selected.delete(id);
}

function clearSelection() {
  _selected.clear();
  renderTable();
}

function compareSelected() {
  if (_selected.size < 2) {
    window.__copilot?.addMessage('sys', '⚠️ 请至少勾选 2 条实验记录再对比。');
    return;
  }
  const exps    = EXPERIMENTS.filter(e => _selected.has(e.id));
  const summary = exps.map(e => `[${e.id}] ${e.name}（${e.method}）：${e.result}`).join('\n');
  window.__copilot?.askCopilot(
    `请对比以下实验记录，分析差异原因，找出最优配置并给出下一步改进建议：\n${summary}`,
    '实验记录本 - 对比分析',
    true
  );
}

function compareAll() {
  const summary = EXPERIMENTS.map(e => `[${e.id}] ${e.name}（${e.method}）：${e.result}`).join('\n');
  window.__copilot?.askCopilot(
    `请分析以下所有实验记录的整体趋势，总结哪类参数设置效果更好，并给出未来实验方向建议：\n${summary}`,
    '实验记录本 - 全局分析',
    true
  );
}

function markBestEntry(id, project) {
  markBest(id, project);
  renderTable();
  window.__copilot?.addMessage('sys', `✓ 实验 #${id} 已标记为项目最优结果。`);
}

function removeEntry(id) {
  if (!confirm(`确认删除实验记录 #${id}？`)) return;
  deleteExperiment(id);
  _selected.delete(id);
  renderTable();
  window.__copilot?.addMessage('sys', `✓ 实验记录 #${id} 已删除。`);
}

/* ── Coefficient visualization ── */

/**
 * 从 result 字符串解析系数和标准误
 * 支持格式：β=0.043 (SE=0.011) / β = 0.043 (SE=0.011, p<0.001)
 *           ATT = 0.038 (SE=0.013) / coef=0.043 se=0.011
 */
function _parseCoef(resultStr, label) {
  if (!resultStr) return null;
  const s = resultStr.replace(/\s/g, '');

  // 匹配系数：β= / b= / coef= / ATT= / ATE=
  const coefMatch = s.match(/(?:β|b|coef|ATT|ATE|estimate)=?\s*([-\d.]+)/i);
  // 匹配标准误：SE= / se= / std=
  const seMatch   = s.match(/SE=?\s*([\d.]+)/i);
  // 匹配 R²
  const r2Match   = s.match(/R[²2]=?\s*([\d.]+)/i);

  if (!coefMatch) return null;
  const coef = parseFloat(coefMatch[1]);
  const se   = seMatch ? parseFloat(seMatch[1]) : null;

  return {
    label: label ?? resultStr.slice(0, 20),
    coef,
    lower: se != null ? coef - 1.96 * se : null,
    upper: se != null ? coef + 1.96 * se : null,
    r2:    r2Match ? parseFloat(r2Match[1]) : null,
    hasSE: se != null,
  };
}

function toggleViz(id) {
  const row = document.getElementById(`exp-viz-${id}`);
  if (!row) return;
  const isOpen = row.style.display !== 'none';
  if (isOpen) { row.style.display = 'none'; return; }

  row.style.display = '';
  const chartEl = document.getElementById(`exp-viz-chart-${id}`);
  const msgEl   = document.getElementById(`exp-viz-msg-${id}`);
  const exp     = EXPERIMENTS.find(e => e.id === id);
  if (!exp || !chartEl) return;

  const parsed = _parseCoef(exp.result, exp.name);

  if (!parsed) {
    chartEl.style.display = 'none';
    if (msgEl) msgEl.innerHTML = `
      <span style="color:var(--gold);">⚠ 无法自动解析系数。</span>
      结果格式建议：<code style="color:var(--cyan);">β=0.043 (SE=0.011, p&lt;0.001)</code>`;
    return;
  }

  if (!parsed.hasSE) {
    chartEl.style.display = 'none';
    if (msgEl) msgEl.innerHTML = `
      系数 <strong style="color:var(--cyan);">${parsed.coef}</strong>
      ${parsed.r2 != null ? `· R² = <strong style="color:var(--gold);">${parsed.r2}</strong>` : ''}
      <br><span style="color:var(--text-faint);">未检测到标准误（SE），无法绘制置信区间。建议在结果中加入 SE=xxx。</span>`;
    return;
  }

  if (msgEl) msgEl.innerHTML = `
    β = <strong style="color:var(--cyan);">${parsed.coef.toFixed(4)}</strong>
    &nbsp;·&nbsp; 95% CI: [${parsed.lower.toFixed(4)}, ${parsed.upper.toFixed(4)}]
    ${parsed.r2 != null ? `&nbsp;·&nbsp; R² = <strong style="color:var(--gold);">${parsed.r2}</strong>` : ''}`;

  renderCoefPlot(`exp-viz-chart-${id}`, [{
    label: exp.name,
    coef:  parsed.coef,
    lower: parsed.lower,
    upper: parsed.upper,
    color: exp.best ? '#00d4aa' : '#d4a853',
  }]);
}

/* ── Multi-experiment coefficient comparison ── */
function vizSelected() {
  if (_selected.size < 2) {
    window.__copilot?.addMessage('sys', '⚠️ 请至少勾选 2 条实验记录再对比可视化。');
    return;
  }
  const exps    = EXPERIMENTS.filter(e => _selected.has(e.id));
  const entries = exps.map(e => {
    const p = _parseCoef(e.result, e.name);
    return p?.hasSE ? { label: e.name, coef: p.coef, lower: p.lower, upper: p.upper } : null;
  }).filter(Boolean);

  if (entries.length < 2) {
    window.__copilot?.addMessage('sys', '⚠️ 选中的实验中可解析系数+SE的不足2条，无法对比。');
    return;
  }

  // render in compare panel
  const out = document.getElementById('exp-compare-out');
  if (out) {
    out.innerHTML = `<div id="exp-multi-viz" style="height:${entries.length * 52 + 80}px;"></div>`;
    renderCoefPlot('exp-multi-viz', entries.map((e, i) => ({
      ...e,
      color: ['#00d4aa','#d4a853','#7c6fcd','#e05c7a','#4ade80'][i % 5],
    })));
  }
}

window.__explog = {
  init, renderTable,
  showForm, hideForm, saveEntry, aiReview,
  toggleSelect, clearSelection,
  compareSelected, compareAll, markBestEntry, removeEntry,
  prefillForm, genCode, aiInterpretResult,
  _toggleCodePanel, _onMethodChange,
  toggleViz, vizSelected,
};
