/* ═══════════════════════════════════════════════════════
   modules/exp-log.js — Experiment Log Module
   Features: structured records · version tracking
             AI comparison · result chart
═══════════════════════════════════════════════════════ */

import { EXPERIMENTS, addExperiment, markBest } from '../data/experiments.js';

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
<select id="ef-method" style="width:100%;">
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
    <option>Transformer</option>
    <option>卷积神经网络</option>
  </optgroup>
  <optgroup label="物理与控制系统">
    <option>数值方程求解优化</option>
    <option>系统动力学仿真</option>
    <option>最速下降/共轭梯度优化</option>
    <option>PDE / 差分方程求解</option>
  </optgroup>
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
    <tr class="${e.best ? 'best' : ''}">
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
      <td>
        <button class="btn btn-ghost btn-sm"
          onclick="window.__explog?.markBestEntry(${e.id}, '${e.project}')">★ 标优</button>
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
    method:  document.getElementById('ef-method').value,
    project: document.getElementById('ef-project').value.trim() || '未分类',
    params:  document.getElementById('ef-params').value.trim(),
    result:  document.getElementById('ef-result').value.trim() || '待记录',
    notes:   document.getElementById('ef-notes').value.trim(),
    obs:     parseInt(document.getElementById('ef-obs').value) || null,
  });

  hideForm();
  renderTable();
  window.__copilot?.addMessage('sys', `✓ 实验「<strong>${name}</strong>」已保存。`);
}

function aiReview() {
  const name   = document.getElementById('ef-name').value;
  const method = document.getElementById('ef-method').value;
  const params = document.getElementById('ef-params').value;
  const result = document.getElementById('ef-result').value;
  window.__copilot?.askCopilot(
    `请评估这次实验设计是否合理：\n方法：${method}\n假设/参数：${params}\n结果：${result}\n\n请指出潜在的方法论问题和改进建议。`,
    '实验记录本'
  );
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
    '实验记录本 - 对比分析'
  );
}

function compareAll() {
  const summary = EXPERIMENTS.map(e => `[${e.id}] ${e.name}（${e.method}）：${e.result}`).join('\n');
  window.__copilot?.askCopilot(
    `请分析以下所有实验记录的整体趋势，总结哪类参数设置效果更好，并给出未来实验方向建议：\n${summary}`,
    '实验记录本 - 全局分析'
  );
}

function markBestEntry(id, project) {
  markBest(id, project);
  renderTable();
  window.__copilot?.addMessage('sys', `✓ 实验 #${id} 已标记为项目最优结果。`);
}

window.__explog = {
  init, renderTable,
  showForm, hideForm, saveEntry, aiReview,
  toggleSelect, clearSelection,
  compareSelected, compareAll, markBestEntry,
};
