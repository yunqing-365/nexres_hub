/* ═══════════════════════════════════════════════════════
   modules/dl-lab.js — 深度学习实验室
   Features: 实验配置 · 真实日志解析 · 模型对比 · 消融实验
═══════════════════════════════════════════════════════ */

import { renderLine, renderRadar } from '../utils/charts.js';
import { addExperiment } from '../data/experiments.js';

const CONTAINER = 'module-dl-lab'; // 确保与 index.html 匹配，如果你的 html 里面是 module-dllab，请把这里改成 module-dllab
let _activeTab = 'tracker';
let _trainLogs = []; 

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">深度学习实验室</div>
        <div class="page-desc">告别模拟：解析真实训练日志 · 对比模型指标 · 撰写消融实验</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab" data-tab="config" onclick="window.__dllab?.switchTab('config',this)">⚙️ 实验配置</div>
      <div class="module-tab active" data-tab="tracker" onclick="window.__dllab?.switchTab('tracker',this)">📈 训练追踪 (Real Logs)</div>
      <div class="module-tab" data-tab="compare" onclick="window.__dllab?.switchTab('compare',this)">📊 模型对比</div>
      <div class="module-tab" data-tab="ablation" onclick="window.__dllab?.switchTab('ablation',this)">🧩 消融实验</div>
    </div>

    <div id="dl-content"></div>
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
  const content = document.getElementById('dl-content');
  if (!content) return;
  if (tab === 'config') _renderConfig(content);
  else if (tab === 'tracker') _renderTracker(content);
  else if (tab === 'compare') _renderCompare(content);
  else if (tab === 'ablation') _renderAblation(content);
}

/* ─── Tab 1: 实验配置 (恢复原版) ─── */
function _renderConfig(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">模型与架构配置</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">模型架构</div><input type="text" id="dl-arch" class="copilot-input" value="ResNet-50"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">学习率</div><input type="text" id="dl-lr" class="copilot-input" value="1e-4"></div>
            <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">批大小</div><input type="number" id="dl-batch" class="copilot-input" value="64"></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title violet">数据集信息 & 归档</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">数据集名称</div><input type="text" id="dl-dataset" class="copilot-input" value="ImageNet-Subset"></div>
          <button class="btn btn-primary" style="margin-top:12px;justify-content:center;" onclick="window.__dllab?.saveConfig()">💾 写入全局实验记录本</button>
        </div>
      </div>
    </div>
  `;
}

function saveConfig() {
  const get = id => document.getElementById(id)?.value || '';
  addExperiment({
    name: `${get('dl-arch')} 真实训练配置`,
    method: '深度学习', project: get('dl-dataset'),
    params: `LR=${get('dl-lr')} | Batch=${get('dl-batch')}`,
    result: '等待日志解析'
  });
  window.__copilot?.addMessage('sys', '✓ 实验超参已成功归档。');
}

/* ─── Tab 2: 真实日志追踪 (正则引擎) ─── */
function _renderTracker(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title">真实日志正则解析器 (PyTorch / TF)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
          直接从服务器终端复制包含 Epoch、loss、val_loss 的输出粘贴到下方：
        </div>
        <textarea id="tr-log-text" class="copilot-input" style="height:140px;font-family:var(--font-mono);font-size:11px;"
          placeholder="Epoch 1/50 - loss: 0.682 - val_loss: 0.651\nEpoch 2/50 - loss: 0.554 - val_loss: 0.590..."></textarea>
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="btn btn-cyan" onclick="window.__dllab?.parseLogs()">⚡ 正则解析并绘图</button>
          <button class="btn btn-ghost" onclick="window.__dllab?.clearLogs()">✕ 清空缓存</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title gold">真实学习曲线 (Learning Curve)</div>
        <div id="dl-tracker-chart" style="height:220px;display:flex;align-items:center;justify-content:center;color:var(--text-faint);">等待解析日志...</div>
      </div>
    </div>
  `;
  setTimeout(() => _drawTrackerChart(), 50);
}

function parseLogs() {
  const text = document.getElementById('tr-log-text')?.value || '';
  const lines = text.split('\n');
  let added = 0;
  
  lines.forEach(line => {
    const epMatch = line.match(/Epoch\s*\[?(\d+)/i);
    const tlMatch = line.match(/(?:train_)?loss[:\s=]+([\d\.]+)/i);
    const vlMatch = line.match(/val_loss[:\s=]+([\d\.]+)/i);
    
    if (epMatch && tlMatch && vlMatch) {
      _trainLogs.push({ epoch: parseInt(epMatch[1]), train_loss: parseFloat(tlMatch[1]), val_loss: parseFloat(vlMatch[1]) });
      added++;
    }
  });
  
  if(added > 0) {
    _trainLogs.sort((a,b) => a.epoch - b.epoch);
    _drawTrackerChart();
    window.__copilot?.addMessage('sys', `✓ 成功解析 ${added} 条真实日志记录，曲线已更新。`);
  } else {
    alert("未能解析出标准数据，请检查终端输出格式。");
  }
}

function clearLogs() { _trainLogs = []; _drawTrackerChart(); }

function _drawTrackerChart() {
  const container = document.getElementById('dl-tracker-chart');
  if(!container) return;
  if(_trainLogs.length === 0) { container.innerHTML = '等待解析日志...'; return; }
  
  const epochs = _trainLogs.map(l => l.epoch);
  const tLoss = _trainLogs.map(l => l.train_loss);
  const vLoss = _trainLogs.map(l => l.val_loss);
  
  renderLine('dl-tracker-chart', [
    { x: epochs, y: tLoss, mode: 'lines+markers', name: 'Train Loss', line: { color: '#00d4aa' } },
    { x: epochs, y: vLoss, mode: 'lines+markers', name: 'Val Loss', line: { color: '#e05c7a' } }
  ], { xaxis: { title: 'Epoch' }, yaxis: { title: 'Loss' }, showlegend: true });
}

/* ─── Tab 3: 模型对比 (恢复原版) ─── */
function _renderCompare(container) {
  const models = [
    { name: 'CNN Base', acc: 0.82, f1: 0.80, auc: 0.85, param: 12 },
    { name: 'ResNet-18', acc: 0.91, f1: 0.89, auc: 0.94, param: 11 },
    { name: 'ViT Tiny', acc: 0.93, f1: 0.92, auc: 0.96, param: 5 }
  ];

  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">性能指标矩阵</div>
        <table class="exp-table">
          <thead><tr><th>模型</th><th>Acc</th><th>F1</th><th>AUC</th><th>Params(M)</th><th>表现</th></tr></thead>
          <tbody>
            ${models.map((m, i) => `
              <tr class="${i===2 ? 'best': ''}">
                <td>${m.name}</td><td>${m.acc}</td><td>${m.f1}</td><td>${m.auc}</td><td>${m.param}</td>
                <td>${i===2 ? '<span class="tag tag-gold">最优</span>' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="card-title violet">综合性能雷达图</div>
        <div id="dl-compare-radar" style="height:250px;"></div>
      </div>
    </div>
  `;
  setTimeout(() => renderRadar('dl-compare-radar', [93, 92, 96, 80, 70], ['Accuracy', 'F1 Score', 'AUC', 'Parameter Eff.', 'Speed'], '#7c6fcd'), 50);
}

/* ─── Tab 4: 消融实验 (恢复原版) ─── */
function _renderAblation(container) {
  const rows = [
    { base: '✓', att: '', drop: '', bn: '', acc: 0.78 },
    { base: '✓', att: '✓', drop: '', bn: '', acc: 0.84 },
    { base: '✓', att: '✓', drop: '✓', bn: '', acc: 0.86 },
    { base: '✓', att: '✓', drop: '✓', bn: '✓', acc: 0.91 }
  ];

  container.innerHTML = `
    <div class="card">
      <div class="card-title">组件消融分析 (Ablation Study)</div>
      <table class="exp-table" style="text-align:center; margin-top: 16px;">
        <thead>
          <tr><th>Base</th><th>+ Attention</th><th>+ Dropout</th><th>+ BatchNorm</th><th style="color:var(--gold);">Accuracy</th></tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr><td>${r.base}</td><td>${r.att}</td><td>${r.drop}</td><td>${r.bn}</td><td style="color:var(--gold);font-weight:bold;">${r.acc}</td></tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

window.__dllab = { init, switchTab, saveConfig, parseLogs, clearLogs };