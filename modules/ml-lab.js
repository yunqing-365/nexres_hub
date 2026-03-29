/* ═══════════════════════════════════════════════════════
   modules/ml-lab.js — Machine Learning Lab
   Tabs: 梯度下降 · 过拟合探索 · 网络架构可视化
   Uses utils/charts.js for Plotly rendering
═══════════════════════════════════════════════════════ */

import { renderGradientDescent, renderLine, BASE_CONFIG, BASE_LAYOUT } from '../utils/charts.js';

const CONTAINER = 'module-ml';
let _running = false;

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">机器学习实验室</div>
        <div class="page-desc">交互式参数探索 · 在实验中建立直觉</div>
      </div>
    </div>


    <div class="module-tabs">
      <div class="module-tab active" data-tab="gd"
        onclick="window.__mllab?.switchTab('gd',this)">梯度下降</div>
      <div class="module-tab" data-tab="overfit"
        onclick="window.__mllab?.switchTab('overfit',this)">过拟合探索</div>
      <div class="module-tab" data-tab="optim"
        onclick="window.__mllab?.switchTab('optim',this)">数值优化</div>
    </div>

    <div id="ml-gd">      ${_gdHTML()}</div>
    <div id="ml-overfit"  style="display:none;">${_overfitHTML()}</div>
    <div id="ml-optim"    style="display:none;">${_optimHTML()}</div>`;
  _initEpochMeter();
  _renderBaseline();
}

/* ── Tab switching ── */
function switchTab(tab, el) {
  ['gd', 'overfit', 'optim'].forEach(t => {
    document.getElementById(`ml-${t}`).style.display = t === tab ? '' : 'none';
  });
  document.querySelectorAll(`#${CONTAINER} .module-tab`).forEach(t => t.classList.remove('active'));
  el?.classList.add('active');
  if (tab === 'gd') { _initEpochMeter(); _renderBaseline(); }
  if (tab === 'overfit') _initOverfit();
  if (tab === 'optim') _initOptim();
}

/* ════════════════════════════════
   TAB 1 — 梯度下降
════════════════════════════════ */
function _gdHTML() {
  return `
    <div class="grid-2">
      <div class="card">
        <div class="card-title">超参数控制台</div>

        <div class="range-group">
          <div class="range-label">
            <span>学习率 (η)</span>
            <span class="range-val" id="lr-val">0.10</span>
          </div>
          <input type="range" id="lr-slider" min="0.01" max="1" step="0.01" value="0.1"
            oninput="window.__mllab?.updateParam('lr',this.value)">
          <div id="lr-hint" style="font-size:11px;margin-top:5px;font-family:var(--font-mono);"></div>
        </div>

        <div class="range-group">
          <div class="range-label">
            <span>训练轮数 (Epoch)</span>
            <span class="range-val" id="ep-val">50</span>
          </div>
          <input type="range" id="ep-slider" min="10" max="200" step="10" value="50"
            oninput="window.__mllab?.updateParam('ep',this.value)">
        </div>

        <div class="range-group">
          <div class="range-label">
            <span>L2 正则化 (λ)</span>
            <span class="range-val" id="reg-val">0.00</span>
          </div>
          <input type="range" id="reg-slider" min="0" max="1" step="0.05" value="0"
            oninput="window.__mllab?.updateParam('reg',this.value)">
        </div>

        <div style="display:flex;gap:8px;margin-top:14px;">
          <button class="btn btn-primary" onclick="window.__mllab?.runGD()">▶ 运行训练</button>
          <button class="btn btn-ghost"   onclick="window.__mllab?.resetGD()">↺ 重置</button>
        </div>

        <div class="epoch-meter" id="epoch-meter" style="margin-top:14px;"></div>
        <div id="epoch-status"
          style="font-size:11px;color:var(--text-muted);margin-top:8px;font-family:var(--font-mono);">
          等待运行…
        </div>
      </div>

      <div class="card">
        <div class="card-title cyan">Loss 曲面可视化</div>
        <div id="ml-gd-chart" style="height:230px;"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title violet">AI 实时解析</div>
      <div id="gd-explanation" style="font-size:13px;line-height:1.8;color:var(--text-muted);">
        调整左侧滑块并点击「运行训练」，AI 将实时解析你的参数选择 ↗
      </div>
    </div>

    <!-- Experiment recorder -->
    <div class="card">
      <div class="card-title">实验快照</div>
      <table class="exp-table" id="gd-snap-table">
        <thead>
          <tr>
            <th>#</th><th>学习率</th><th>Epoch</th><th>λ</th>
            <th>Final Loss</th><th>结果</th>
          </tr>
        </thead>
        <tbody id="gd-snap-body">
          <tr>
            <td colspan="6" style="text-align:center;color:var(--text-faint);padding:20px;">
              运行训练后自动记录…
            </td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

function _initEpochMeter() {
  const el = document.getElementById('epoch-meter');
  if (el) el.innerHTML = Array.from({ length: 20 }, (_, i) =>
    `<div class="epoch-block" id="eb-${i}"></div>`).join('');
}

function _renderBaseline() {
  const w = Array.from({ length: 100 }, (_, i) => -5 + i * 0.1);
  Plotly.newPlot(
    'ml-gd-chart',
    [{
      x: w, y: w.map(x => x * x + 0.5),
      mode: 'lines',
      line: { color: '#1e2d4a', width: 2 },
      fill: 'tozeroy', fillcolor: 'rgba(99,102,241,0.04)',
    }],
    { ...BASE_LAYOUT, xaxis: { ...BASE_LAYOUT.xaxis, title: 'θ' }, yaxis: { ...BASE_LAYOUT.yaxis, title: 'Loss' } },
    BASE_CONFIG,
  );
}

function updateParam(param, val) {
  const parsed = parseFloat(val);
  if (param === 'lr') {
    document.getElementById('lr-val').textContent = parsed.toFixed(2);
    const hint = document.getElementById('lr-hint');
    if (parsed > 0.5)
      hint.innerHTML = '<span style="color:var(--rose)">⚠ 学习率过大，可能梯度爆炸</span>';
    else if (parsed < 0.05)
      hint.innerHTML = '<span style="color:var(--gold)">⚠ 学习率过小，收敛缓慢</span>';
    else
      hint.innerHTML = '<span style="color:var(--cyan)">✓ 合理范围</span>';
  }
  if (param === 'ep')  document.getElementById('ep-val').textContent  = parseInt(val);
  if (param === 'reg') document.getElementById('reg-val').textContent = parsed.toFixed(2);
}

function runGD() {
  if (_running) return;
  _running = true;

  const lr     = parseFloat(document.getElementById('lr-slider').value);
  const epochs = parseInt(document.getElementById('ep-slider').value);
  const lambda = parseFloat(document.getElementById('reg-slider').value);

  // Simulate gradient descent on f(w) = w² + λw²
  let w = -4.5;
  const pathW    = [w];
  const pathLoss = [w * w + lambda * w * w];

  for (let i = 0; i < epochs; i++) {
    const grad = 2 * w + 2 * lambda * w;
    w = w - lr * grad;
    pathW.push(w);
    pathLoss.push(w * w + lambda * w * w);
    if (Math.abs(w) > 20) break;
  }

  const diverged   = Math.abs(w) > 10;
  const finalLoss  = pathLoss[pathLoss.length - 1].toFixed(4);

  // Plot
  renderGradientDescent('ml-gd-chart', pathW, pathLoss, lambda, diverged);

  // Animate epoch meter
  _animateEpochMeter(() => { _running = false; });

  // Status
  document.getElementById('epoch-status').innerHTML = diverged
    ? `<span style="color:var(--rose)">⚠ 发散（Final Loss = ${finalLoss}）</span>`
    : `<span style="color:var(--cyan)">✓ 完成，Final Loss = ${finalLoss}</span>`;

  // Explanation
  const explanation = _gdExplanation(lr, epochs, pathLoss, finalLoss, diverged);
  document.getElementById('gd-explanation').innerHTML = explanation;

  // Record snapshot
  _addSnapshot(lr, epochs, lambda, finalLoss, diverged);
}

function _gdExplanation(lr, epochs, pathLoss, finalLoss, diverged) {
  if (diverged)
    return `⚠️ <strong>梯度爆炸！</strong>学习率 η=${lr} 太大，参数在 Loss 山谷两侧震荡发散。
      <div class="hint">💡 建议将学习率降到 0.05~0.20 重试，或使用学习率调度器（Warmup + Cosine Decay）。</div>`;
  if (lr < 0.05)
    return `🐢 <strong>收敛缓慢。</strong>η=${lr} 太小，${epochs} 轮后 Loss 仅从 ${pathLoss[0].toFixed(2)} 降到 ${finalLoss}，效率低下。
      <div class="hint">💡 适当增大学习率（0.05~0.2），或搭配 Adam 优化器自适应调整步长。</div>`;
  return `🎉 <strong>收敛良好！</strong>η=${lr} 选取合理，Loss: ${pathLoss[0].toFixed(2)} → ${finalLoss}，下降 ${(100 * (1 - parseFloat(finalLoss) / pathLoss[0])).toFixed(1)}%。
    <div class="hint">💡 实际深度学习中通常使用学习率调度器：先大步找方向，再小步精确收敛。</div>`;
}

function _animateEpochMeter(onDone) {
  const blocks = document.getElementById('epoch-meter')?.querySelectorAll('.epoch-block');
  if (!blocks) { onDone(); return; }
  let i = 0;
  const interval = setInterval(() => {
    if (i < blocks.length) {
      if (i > 0) blocks[i - 1].classList.remove('current');
      blocks[i].classList.add(i < blocks.length - 1 ? 'current' : 'done');
      i++;
    } else {
      clearInterval(interval);
      blocks.forEach(b => { b.classList.remove('current'); b.classList.add('done'); });
      onDone();
    }
  }, 100);
}

let _snapCount = 0;
function _addSnapshot(lr, epochs, lambda, finalLoss, diverged) {
  const tbody = document.getElementById('gd-snap-body');
  if (!tbody) return;
  if (_snapCount === 0) tbody.innerHTML = '';
  _snapCount++;
  const tr = document.createElement('tr');
  if (!diverged) tr.classList.add('best');
  tr.innerHTML = `
    <td>${_snapCount}</td>
    <td>${lr}</td>
    <td>${epochs}</td>
    <td>${lambda.toFixed(2)}</td>
    <td style="color:${diverged ? 'var(--rose)' : 'var(--cyan)'};">${diverged ? '发散' : finalLoss}</td>
    <td><span class="tag ${diverged ? 'tag-rose' : 'tag-cyan'}">${diverged ? '梯度爆炸' : '稳定收敛'}</span></td>
    <td>
      <button class="btn btn-ghost btn-sm" style="font-size:10px;white-space:nowrap;"
        onclick="window.__mllab?.saveToExpLog('gd', ${lr}, ${epochs}, ${lambda}, '${diverged ? '发散' : finalLoss}', ${diverged})">
        📋 存入记录本
      </button>
    </td>`;
  tbody.appendChild(tr);
}

function resetGD() {
  _renderBaseline();
  _initEpochMeter();
  document.getElementById('epoch-status').textContent    = '等待运行…';
  document.getElementById('gd-explanation').textContent  = '调整滑块并点击「运行训练」';
  _snapCount = 0;
  const tbody = document.getElementById('gd-snap-body');
  if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-faint);padding:20px;">运行训练后自动记录…</td></tr>`;
}

/* ════════════════════════════════
   TAB 2 — 过拟合探索
════════════════════════════════ */
function _overfitHTML() {
  return `
    <div class="grid-2">
      <div class="card">
        <div class="card-title">多项式回归 vs 正则化</div>
        <div class="range-group">
          <div class="range-label">
            <span>多项式次数</span>
            <span class="range-val" id="poly-val">3</span>
          </div>
          <input type="range" id="poly-slider" min="1" max="12" step="1" value="3"
            oninput="window.__mllab?.updateOverfit(this.value)">
        </div>
        <div class="range-group">
          <div class="range-label">
            <span>样本数量</span>
            <span class="range-val" id="nsamples-val">20</span>
          </div>
          <input type="range" id="nsamples-slider" min="10" max="100" step="5" value="20"
            oninput="window.__mllab?.updateOverfit(null, this.value)">
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;">
          <button class="btn btn-primary" onclick="window.__mllab?.runOverfit()">▶ 拟合</button>
          <button class="btn btn-ghost"   onclick="window.__mllab?.resetOverfit()">↺ 重置</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title cyan">拟合结果</div>
        <div id="ml-overfit-chart" style="height:230px;"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title violet">过拟合 vs 欠拟合解析</div>
      <div id="overfit-explanation" style="font-size:13px;color:var(--text-muted);line-height:1.8;">
        调整多项式次数和样本数量，观察拟合曲线的变化。<br>
        <strong style="color:var(--gold);">低次多项式</strong> → 欠拟合（高偏差）&nbsp;&nbsp;
        <strong style="color:var(--rose);">高次多项式</strong> → 过拟合（高方差）&nbsp;&nbsp;
        <strong style="color:var(--cyan);">适中</strong> → 偏差-方差权衡的最优点
      </div>
    </div>`;
}

function _initOverfit() {
  runOverfit();
}

let _polyDeg = 3, _nSamples = 20;

function updateOverfit(deg, n) {
  if (deg != null) { _polyDeg = parseInt(deg); document.getElementById('poly-val').textContent = _polyDeg; }
  if (n   != null) { _nSamples = parseInt(n);  document.getElementById('nsamples-val').textContent = _nSamples; }
}

function runOverfit() {
  // Generate noisy sine data
  const xData = Array.from({ length: _nSamples }, () => (Math.random() * 2 - 1));
  const yData = xData.map(x => Math.sin(Math.PI * x) + (Math.random() - 0.5) * 0.4);

  // True function
  const xLine = Array.from({ length: 100 }, (_, i) => -1 + 2 * i / 99);
  const yTrue = xLine.map(x => Math.sin(Math.PI * x));

  // Polynomial fit (crude Vandermonde — for visualization only)
  const yFit = _polyFit(xData, yData, _polyDeg, xLine);

  const color = _polyDeg <= 2 ? '#f59e0b' : _polyDeg >= 8 ? '#e05c7a' : '#00d4aa';

  renderLine('ml-overfit-chart', [
    { x: xLine, y: yTrue,  mode: 'lines', name: '真实函数', line: { color: '#6b7fa3', width: 1.5, dash: 'dash' } },
    { x: xData, y: yData,  mode: 'markers', name: '样本点', marker: { color: '#d4a853', size: 6 } },
    { x: xLine, y: yFit,   mode: 'lines', name: `多项式 d=${_polyDeg}`, line: { color, width: 2 } },
  ], {
    showlegend: true,
    legend: { font: { size: 10 }, bgcolor: 'transparent' },
    xaxis: { ...BASE_LAYOUT.xaxis, range: [-1.1, 1.1], title: 'x' },
    yaxis: { ...BASE_LAYOUT.yaxis, range: [-2, 2], title: 'y' },
  });

  const expl = _polyDeg <= 2
    ? `📉 <strong>欠拟合（高偏差）：</strong>d=${_polyDeg} 次多项式太简单，无法捕捉正弦曲线的非线性特征。训练误差和测试误差都较高。`
    : _polyDeg >= 8
    ? `📈 <strong>过拟合（高方差）：</strong>d=${_polyDeg} 次多项式过于复杂，开始拟合噪声而非信号。训练误差很低但泛化性差。<div class="hint">💡 解决方案：增加正则化（Ridge/Lasso）或增大样本量</div>`
    : `✅ <strong>拟合良好：</strong>d=${_polyDeg} 次多项式在偏差-方差之间取得平衡，曲线平滑且接近真实函数。`;
  document.getElementById('overfit-explanation').innerHTML = expl +
    `<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('多项式次数 d=${_polyDeg}，样本量 ${_nSamples}，当前拟合状态：${_polyDeg <= 2 ? '欠拟合' : _polyDeg >= 8 ? '过拟合' : '良好'}。请解释偏差-方差权衡，并给出改进建议。', 'ML实验室', true)">🤖 问 AI</button>
      <button class="btn btn-primary btn-sm" onclick="window.__mllab?.saveOverfitToExpLog()">📋 存入记录本</button>
    </div>`;
}

function resetOverfit() {
  _polyDeg = 3; _nSamples = 20;
  const ps = document.getElementById('poly-slider');
  const ns = document.getElementById('nsamples-slider');
  if (ps) { ps.value = 3;  document.getElementById('poly-val').textContent = 3; }
  if (ns) { ns.value = 20; document.getElementById('nsamples-val').textContent = 20; }
  runOverfit();
}

/** 极简多项式回归 (least squares via normal equations, small degree only) */
function _polyFit(xd, yd, deg, xLine) {
  // Build Vandermonde matrix
  const n = xd.length, m = deg + 1;
  const A = xd.map(x => Array.from({ length: m }, (_, k) => Math.pow(x, k)));
  // Normal equations: (A^T A) coef = A^T y
  const AtA = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => A.reduce((s, row) => s + row[i] * row[j], 0)));
  const Aty = Array.from({ length: m }, (_, i) => A.reduce((s, row, r) => s + row[i] * yd[r], 0));
  // Solve via Gaussian elimination
  const coef = _gaussElim(AtA, Aty);
  // Predict
  return xLine.map(x => coef.reduce((s, c, k) => s + c * Math.pow(x, k), 0));
}

function _gaussElim(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

/* ════════════════════════════════
   TAB 3 — 网络架构可视化
════════════════════════════════ */
function _archHTML() {
  return `
    <div class="card">
      <div class="card-title">神经网络结构可视化</div>
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-family:var(--font-mono);">隐藏层数</div>
          <input type="range" id="arch-layers" min="1" max="5" step="1" value="2"
            oninput="window.__mllab?.drawArch()" style="width:120px;">
          <span id="arch-layers-val" style="font-family:var(--font-mono);font-size:11px;color:var(--gold);margin-left:6px;">2</span>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-family:var(--font-mono);">每层神经元</div>
          <input type="range" id="arch-width" min="2" max="8" step="1" value="4"
            oninput="window.__mllab?.drawArch()" style="width:120px;">
          <span id="arch-width-val" style="font-family:var(--font-mono);font-size:11px;color:var(--gold);margin-left:6px;">4</span>
        </div>
        <div style="display:flex;align-items:flex-end;">
          <button class="btn btn-ghost btn-sm"
            onclick="window.__copilot?.askCopilot('当我增加神经网络的层数和宽度时，参数量如何变化？各自对模型能力的影响有何不同？', 'ML实验室', true)">
            🤖 AI 解析深度 vs 宽度
          </button>
        </div>
      </div>
      <canvas id="arch-canvas" style="width:100%;height:280px;background:rgba(0,0,0,0.15);border-radius:8px;border:1px solid var(--border);"></canvas>
      <div id="arch-info" style="margin-top:10px;font-family:var(--font-mono);font-size:11px;color:var(--text-muted);"></div>
    </div>`;
}

function _initArch() {
  drawArch();
}

function drawArch() {
  const layersEl = document.getElementById('arch-layers');
  const widthEl  = document.getElementById('arch-width');
  if (!layersEl || !widthEl) return;

  const hiddenLayers = parseInt(layersEl.value);
  const width        = parseInt(widthEl.value);
  document.getElementById('arch-layers-val').textContent = hiddenLayers;
  document.getElementById('arch-width-val').textContent  = width;

  const canvas = document.getElementById('arch-canvas');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const W = canvas.offsetWidth; const H = canvas.offsetHeight;
  canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, W, H);

  // Layer sizes: input(3) + hidden layers + output(2)
  const layers = [3, ...Array(hiddenLayers).fill(width), 2];
  const totalLayers = layers.length;
  const xStep = W / (totalLayers + 1);
  const maxN  = Math.max(...layers);
  const yStep = (H - 40) / (maxN + 1);

  // Draw connections
  for (let l = 0; l < totalLayers - 1; l++) {
    const x1 = xStep * (l + 1);
    const x2 = xStep * (l + 2);
    for (let i = 0; i < layers[l]; i++) {
      const y1 = (H / 2) + (i - (layers[l] - 1) / 2) * Math.min(yStep, 36);
      for (let j = 0; j < layers[l + 1]; j++) {
        const y2 = (H / 2) + (j - (layers[l + 1] - 1) / 2) * Math.min(yStep, 36);
        ctx.strokeStyle = 'rgba(42, 63, 106, 0.6)';
        ctx.lineWidth   = 0.8;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }
  }

  // Draw neurons
  const colors = ['#d4a853', '#00d4aa', '#7c6fcd', '#00d4aa', '#e05c7a'];
  for (let l = 0; l < totalLayers; l++) {
    const x = xStep * (l + 1);
    const color = l === 0 ? colors[0] : l === totalLayers - 1 ? colors[4] : colors[1];
    for (let i = 0; i < layers[l]; i++) {
      const y = (H / 2) + (i - (layers[l] - 1) / 2) * Math.min(yStep, 36);
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fillStyle   = color + '22';
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.fill(); ctx.stroke();
    }
    // Layer label
    ctx.fillStyle = '#6b7fa3';
    ctx.font      = '10px IBM Plex Mono';
    ctx.textAlign = 'center';
    const lbl = l === 0 ? 'Input' : l === totalLayers - 1 ? 'Output' : `H${l}`;
    ctx.fillText(lbl, x, H - 8);
  }

  // Parameter count
  let params = 0;
  for (let l = 0; l < totalLayers - 1; l++) params += layers[l] * layers[l + 1] + layers[l + 1];
  document.getElementById('arch-info').textContent =
    `总参数量：${params.toLocaleString()} · 层结构：[${layers.join(', ')}]`;
}

/* ════════════════════════════════
   TAB 4 — 数值优化 (最速下降 vs 共轭梯度)
════════════════════════════════ */
function _optimHTML() {
  return `
    <div class="grid-2">
      <div class="card">
        <div class="card-title">算法寻优轨迹对比</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;line-height:1.6;">
          在求解物理稳态方程（如 Gross-Pitaevskii 方程）或训练大模型时，算法选择极其重要。<br>
          尝试对比在极度狭长（Ill-conditioned）的等高线地形下，两种数值方法的收敛效率。
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
          <button class="btn btn-rose" onclick="window.__mllab?.runOptim('steepest')">▶ 最速下降法</button>
          <button class="btn btn-cyan" onclick="window.__mllab?.runOptim('cg')">▶ 共轭梯度法</button>
          <button class="btn btn-ghost" onclick="window.__mllab?.resetOptim()">↺ 重置地形</button>
        </div>
        <div id="optim-explanation" style="margin-top:20px;font-size:12px;color:var(--text-muted);">
          点击上方按钮观察算法演进轨迹...
        </div>
      </div>
      <div class="card">
        <div class="card-title violet">优化地形等高线 (Contour Map)</div>
        <div id="ml-optim-chart" style="height:280px;"></div>
      </div>
    </div>`;
}

let _lastSD = null, _lastCG = null;

function _initOptim() {
  _renderOptimContour();
}

function _renderOptimContour(pathSD = null, pathCG = null) {
  // 生成一个病态的二次型矩阵等高线 z = x^2 + 10y^2
  const x = Array.from({length: 60}, (_, i) => -2.5 + i * 5/59);
  const y = Array.from({length: 60}, (_, i) => -2.5 + i * 5/59);
  const z = y.map(yVal => x.map(xVal => 0.5 * (xVal*xVal + 15*yVal*yVal))); 

  const traces = [{
    z: z, x: x, y: y,
    type: 'contour',
    colorscale: 'Viridis',
    showscale: false,
    contours: { coloring: 'lines', start: 0, end: 20, size: 1.5 }
  }];

  if (pathSD) {
    traces.push({
      x: pathSD.x, y: pathSD.y,
      mode: 'lines+markers', name: '最速下降 (Zig-zag)',
      line: { color: '#e05c7a', width: 2 }, marker: { size: 5 }
    });
  }
  if (pathCG) {
    traces.push({
      x: pathCG.x, y: pathCG.y,
      mode: 'lines+markers', name: '共轭梯度 (CG)',
      line: { color: '#00d4aa', width: 2 }, marker: { size: 6, symbol: 'diamond' }
    });
  }

  Plotly.newPlot('ml-optim-chart', traces, {
    ...BASE_LAYOUT, margin: {t:10, b:24, l:24, r:10},
    xaxis: { ...BASE_LAYOUT.xaxis, range: [-2.2, 2.2] },
    yaxis: { ...BASE_LAYOUT.yaxis, range: [-2.2, 2.2] },
    showlegend: true, legend: { font: { size: 10 }, bgcolor: 'transparent', x: 0, y: 1 }
  }, BASE_CONFIG);
}

function runOptim(method) {
  const path = {x: [], y: []};
  // 统一初始点
  let cx = -2.0, cy = 1.8;
  path.x.push(cx); path.y.push(cy);

  if (method === 'steepest') {
    // 模拟最速下降的锯齿震荡特性
    for(let i=0; i<15; i++) {
      cx = cx * 0.5; cy = -cy * 0.5;
      path.x.push(cx); path.y.push(cy);
    }
    _lastSD = path;
    document.getElementById('optim-explanation').innerHTML = `📉 <strong>最速下降法：</strong>沿着局部梯度下降，但在狭长地形（如高度非线性的 PDE 中）会产生严重的锯齿状震荡，收敛极慢。`;
  } else {
    // 模拟共轭梯度法快速抵达极小值
    path.x.push(-0.4); path.y.push(-0.1); // 中间正交步骤
    path.x.push(0); path.y.push(0);       // 直达原点
    _lastCG = path;
    document.getElementById('optim-explanation').innerHTML = `🚀 <strong>共轭梯度法：</strong>利用历史梯度构造共轭方向。理论上 N 维二次型最多 N 步即可精确收敛，非常适合求解大型稀疏系统。`;
  }
  _renderOptimContour(_lastSD, _lastCG);
}

function resetOptim() {
  _lastSD = null; _lastCG = null;
  _renderOptimContour();
  document.getElementById('optim-explanation').innerHTML = '点击上方按钮观察算法演进轨迹...';
}

/* ── Save to ExpLog helpers ── */
function saveToExpLog(type, lr, epochs, lambda, finalLoss, diverged) {
  window.__shell?.switchTab('explog');
  setTimeout(() => {
    window.__explog?.prefillForm({
      name:    `梯度下降实验 #${_snapCount} (lr=${lr})`,
      method:  '梯度下降优化',
      params:  `学习率 η=${lr}；Epoch=${epochs}；L2 λ=${lambda}；初始点 w=-4.5`,
      result:  diverged ? '发散（梯度爆炸）' : `Final Loss = ${finalLoss}`,
    });
  }, 80);
}

function saveOverfitToExpLog() {
  const status = _polyDeg <= 2 ? '欠拟合' : _polyDeg >= 8 ? '过拟合' : '拟合良好';
  window.__shell?.switchTab('explog');
  setTimeout(() => {
    window.__explog?.prefillForm({
      name:    `多项式回归实验 d=${_polyDeg}`,
      method:  '随机森林 / GBDT',
      params:  `多项式次数 d=${_polyDeg}；样本量 N=${_nSamples}`,
      result:  status,
    });
  }, 80);
}

window.__mllab = {
  init, switchTab, updateParam, runGD, resetGD,
  updateOverfit, runOverfit, resetOverfit, drawArch,
  runOptim, resetOptim,
  saveToExpLog, saveOverfitToExpLog,
};
