/* ═══════════════════════════════════════════════════════
   modules/dl-lab.js — 深度学习实验室
   Features: 实验配置 · 训练追踪 · 模型对比 · 消融实验
═══════════════════════════════════════════════════════ */

import { renderLine, renderRadar } from '../utils/charts.js';
import { addExperiment } from '../data/experiments.js';

const CONTAINER = 'module-dl-lab';
let _activeTab = 'config';
let _trainLogs = []; 

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">深度学习实验室</div>
        <div class="page-desc">真实实验记录 + 训练过程可视化，专为科研设计的模型工具</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="config" onclick="window.__dllab?.switchTab('config',this)">⚙️ 实验配置</div>
      <div class="module-tab" data-tab="tracker" onclick="window.__dllab?.switchTab('tracker',this)">📈 训练追踪</div>
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

/* ─── Tab 1: 实验配置 ─── */
function _renderConfig(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">模型与架构配置</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">模型架构</div>
            <select id="dl-arch" class="copilot-input">
              <option>CNN (卷积神经网络)</option>
              <option>RNN / LSTM</option>
              <option>Transformer</option>
              <option>MLP (多层感知机)</option>
              <option>GNN (图神经网络)</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">学习率 (LR)</div>
              <input type="text" id="dl-lr" class="copilot-input" placeholder="例如: 1e-4">
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">批大小 (Batch Size)</div>
              <input type="number" id="dl-batch" class="copilot-input" placeholder="例如: 32">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">优化器</div>
              <select id="dl-opt" class="copilot-input">
                <option>Adam</option><option>AdamW</option><option>SGD</option><option>RMSprop</option>
              </select>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">损失函数</div>
              <select id="dl-loss" class="copilot-input">
                <option>CrossEntropyLoss</option><option>MSELoss</option><option>BCEWithLogitsLoss</option>
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">总 Epoch</div>
              <input type="number" id="dl-epoch" class="copilot-input" placeholder="例如: 100">
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">正则化 (Weight Decay)</div>
              <input type="text" id="dl-wd" class="copilot-input" placeholder="例如: 1e-5">
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title violet">数据集信息 & 归档</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">数据集名称</div>
            <input type="text" id="dl-dataset" class="copilot-input" placeholder="例如: 图像分类/文本情感集">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">总样本量</div>
              <input type="number" id="dl-samples" class="copilot-input" placeholder="例如: 50000">
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">类别数/输出维度</div>
              <input type="number" id="dl-classes" class="copilot-input" placeholder="例如: 10">
            </div>
          </div>
          
          <div style="margin-top:20px;padding-top:16px;border-top:1px dashed var(--border);">
            <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="window.__dllab?.saveConfig()">💾 写入实验记录本</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function saveConfig() {
  const get = id => document.getElementById(id)?.value || '';
  const arch = get('dl-arch');
  const params = `LR=${get('dl-lr')} | Batch=${get('dl-batch')} | Opt=${get('dl-opt')} | Loss=${get('dl-loss')} | WD=${get('dl-wd')}`;
  const dataset = get('dl-dataset');
  
  // 联动全局的实验记录本系统
  addExperiment({
    name: `${arch} 模型基础训练`,
    method: arch,
    project: dataset ? `${dataset} 任务` : '深度学习实验',
    params: params,
    result: '准备训练',
    notes: `Epoch: ${get('dl-epoch')}, 样本量: ${get('dl-samples')}, 类别: ${get('dl-classes')}`
  });
  
  window.__copilot?.addMessage('sys', '✓ 模型超参已归档至「实验记录本」。你可以前往「📈 训练追踪」录入训练日志。');
}

/* ─── Tab 2: 训练追踪 ─── */
function _renderTracker(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title">日志智能解析</div>
        
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">手动添加单轮数据</div>
          <div style="display:flex;gap:6px;">
            <input type="number" id="tr-ep" class="copilot-input" placeholder="Epoch" style="width:60px;">
            <input type="number" id="tr-tl" class="copilot-input" placeholder="Train Loss">
            <input type="number" id="tr-vl" class="copilot-input" placeholder="Val Loss">
            <button class="btn btn-ghost btn-sm" onclick="window.__dllab?.addLogEntry()">添加</button>
          </div>
        </div>

        <div style="margin-bottom:12px;border-top:1px dashed var(--border);padding-top:12px;">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">粘贴 PyTorch / TF 终端输出日志，自动提取曲线数据</div>
          <textarea id="tr-log-text" class="copilot-input" style="height:100px;font-family:var(--font-mono);font-size:10px;"
            placeholder="Epoch 1/50 - loss: 0.68 - val_loss: 0.65\nEpoch 2/50 - loss: 0.55 - val_loss: 0.59..."></textarea>
          <div style="margin-top:8px;display:flex;gap:8px;">
            <button class="btn btn-cyan btn-sm" onclick="window.__dllab?.parseLogs()">⚡ 解析日志并绘图</button>
            <button class="btn btn-ghost btn-sm" onclick="window.__dllab?.clearLogs()">清空数据</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title gold">学习曲线 (Learning Curve)</div>
        <div id="dl-tracker-chart" style="height:220px;"></div>
        <div id="dl-tracker-warn" style="margin-top:10px;font-size:12px;color:var(--rose);min-height:18px;"></div>
      </div>
    </div>
  `;
  setTimeout(() => _drawTrackerChart(), 50);
}

function addLogEntry() {
  const ep = document.getElementById('tr-ep')?.value;
  const tl = document.getElementById('tr-tl')?.value;
  const vl = document.getElementById('tr-vl')?.value;
  if(ep && tl && vl) {
    _trainLogs.push({ epoch: parseInt(ep), train_loss: parseFloat(tl), val_loss: parseFloat(vl) });
    _trainLogs.sort((a,b) => a.epoch - b.epoch);
    _drawTrackerChart();
    _checkOverfitting();
  }
}

function parseLogs() {
  const text = document.getElementById('tr-log-text')?.value || '';
  const lines = text.split('\n');
  let added = 0;
  
  lines.forEach(line => {
    // 简单的正则匹配提取 Epoch 和 Loss
    const epMatch = line.match(/Epoch\s*(\d+)/i);
    const tlMatch = line.match(/(?:train_)?loss[:\s=]+([\d\.]+)/i);
    const vlMatch = line.match(/val_loss[:\s=]+([\d\.]+)/i);
    
    if (epMatch && tlMatch && vlMatch) {
      _trainLogs.push({
        epoch: parseInt(epMatch[1]),
        train_loss: parseFloat(tlMatch[1]),
        val_loss: parseFloat(vlMatch[1])
      });
      added++;
    }
  });
  
  if(added > 0) {
    _trainLogs.sort((a,b) => a.epoch - b.epoch);
    _drawTrackerChart();
    _checkOverfitting();
    window.__copilot?.addMessage('sys', `已成功解析 <strong>${added}</strong> 条日志记录，学习曲线已更新。`);
  } else {
    alert("未能解析出标准的 Epoch / Loss 格式，请检查你粘贴的终端输出。");
  }
}

function clearLogs() {
  _trainLogs = [];
  _drawTrackerChart();
  document.getElementById('dl-tracker-warn').textContent = '';
}

function _drawTrackerChart() {
  const container = document.getElementById('dl-tracker-chart');
  if(!container) return;
  if(_trainLogs.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding-top:80px;color:var(--text-faint);">暂无数据，请录入或粘贴解析日志</div>';
    return;
  }
  
  const epochs = _trainLogs.map(l => l.epoch);
  const tLoss = _trainLogs.map(l => l.train_loss);
  const vLoss = _trainLogs.map(l => l.val_loss);
  
  renderLine('dl-tracker-chart', [
    { x: epochs, y: tLoss, mode: 'lines+markers', name: 'Train Loss', line: { color: '#00d4aa' } },
    { x: epochs, y: vLoss, mode: 'lines+markers', name: 'Val Loss', line: { color: '#e05c7a' } }
  ], {
    xaxis: { title: 'Epoch' },
    yaxis: { title: 'Loss' },
    showlegend: true, legend: { x: 0, y: 1, bgcolor: 'transparent' }
  });
}

function _checkOverfitting() {
  const warnEl = document.getElementById('dl-tracker-warn');
  if(!warnEl || _trainLogs.length < 3) return;
  
  let overfitCount = 0;
  for(let i = _trainLogs.length - 1; i >= 1; i--) {
    if(_trainLogs[i].val_loss > _trainLogs[i-1].val_loss) {
      overfitCount++;
    } else {
      break;
    }
  }
  
  if (overfitCount >= 3) {
    warnEl.innerHTML = '⚠️ <strong>发现过拟合风险！</strong> 验证集 Loss 已连续上升 ' + overfitCount + ' 轮。';
    window.__copilot?.askCopilot("在当前的模型训练中，验证集 Loss 已经连续多轮上升，这说明模型可能陷入了过拟合。除了 Early Stopping，你建议我还可以尝试哪些正则化方法？");
  } else {
    warnEl.innerHTML = '';
  }
}

/* ─── Tab 3: 模型对比 ─── */
function _renderCompare(container) {
  // 模拟记录在案的多模型数据
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
          <thead>
            <tr><th>模型名称</th><th>Accuracy</th><th>F1 Score</th><th>AUC</th><th>Params(M)</th><th>表现</th></tr>
          </thead>
          <tbody>
            ${models.map((m, i) => `
              <tr class="${i===2 ? 'best': ''}">
                <td>${m.name}</td>
                <td>${m.acc}</td><td>${m.f1}</td><td>${m.auc}</td><td>${m.param}</td>
                <td>${i===2 ? '<span class="tag tag-gold">最优</span>' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top:16px;">
          <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('对于医疗图像分类等假阴性代价极高的场景，我在对比多个模型时，应该优先看重 Accuracy、F1 还是 Recall？为什么？')">
            🤖 询问指标评估标准
          </button>
        </div>
      </div>
      <div class="card">
        <div class="card-title violet">综合性能雷达图</div>
        <div id="dl-compare-radar" style="height:250px;"></div>
      </div>
    </div>
  `;
  setTimeout(() => _drawCompareRadar(), 50);
}

function _drawCompareRadar() {
  const container = document.getElementById('dl-compare-radar');
  if(!container) return;
  const theta = ['Accuracy', 'F1 Score', 'AUC', 'Parameter Eff.', 'Inference Speed'];
  // 以 ViT Tiny 为例绘制雷达图
  renderRadar('dl-compare-radar', [93, 92, 96, 80, 70], theta, '#7c6fcd');
}

/* ─── Tab 4: 消融实验 ─── */
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
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">自动生成符合顶会（如 CVPR / NeurIPS）格式的消融实验表格，便于论文写作。</div>
      <table class="exp-table" style="text-align:center;">
        <thead>
          <tr>
            <th style="text-align:center;">Base Network</th>
            <th style="text-align:center;">+ Attention</th>
            <th style="text-align:center;">+ Dropout</th>
            <th style="text-align:center;">+ BatchNorm</th>
            <th style="text-align:center;color:var(--gold);">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${r.base}</td><td>${r.att}</td><td>${r.drop}</td><td>${r.bn}</td>
              <td style="color:var(--gold);font-weight:bold;">${r.acc}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top:16px;border-top:1px dashed var(--border);padding-top:16px;display:flex;gap:10px;">
         <button class="btn btn-violet" onclick="window.__copilot?.askCopilot('请帮我分析上述消融实验的结果，并写一段论文中用于解释各组件（Attention, Dropout, BatchNorm）为何能带来性能提升的段落。')">
          🤖 AI 生成论文解读段落
         </button>
      </div>
    </div>
  `;
}

window.__dllab = { init, switchTab, saveConfig, addLogEntry, parseLogs, clearLogs };