/* ═══════════════════════════════════════════════════════
   modules/sensor-dsp-hub.js — 实时信号与传感器数据流
   Features: 动态时序数据流监控 · 实时滤波与 DSP 管道
═══════════════════════════════════════════════════════ */

import { renderLine, BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-sensor-dsp';
let _activeTab = 'oscilloscope';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">实时信号与 DSP 管道 (Sensor & DSP Hub)</div>
        <div class="page-desc">高速时序数据流监控 · 实时数字信号处理 (去噪、滤波、特征提取)</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="oscilloscope" onclick="window.__sensorDSP?.switchTab('oscilloscope',this)">🔌 串口示波器 (Oscilloscope)</div>
      <div class="module-tab" data-tab="dsp" onclick="window.__sensorDSP?.switchTab('dsp',this)">🎛️ 信号处理管道 (DSP Pipeline)</div>
    </div>

    <div id="sensor-content"></div>
  `;

  _renderTab(_activeTab);
}

function switchTab(tab, el) {
  _activeTab = tab;
  // 切换 Tab 时停止数据流，避免后台持续耗费性能
  stopStream();
  document.querySelectorAll(`#${CONTAINER} .module-tab`).forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderTab(tab);
}

function _renderTab(tab) {
  const content = document.getElementById('sensor-content');
  if (!content) return;
  
  if (tab === 'oscilloscope') _renderOscilloscope(content);
  else if (tab === 'dsp') _renderDSP(content);
}

/* ─── Tab 1: 串口示波器 (Oscilloscope) ─── */
let _streamInterval = null;
let _timeBuffer = [];
let _rawBuffer = [];
let _filteredBuffer = [];
let _t = 0;

function _renderOscilloscope(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">WebSerial 连接与数据流</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          在此模拟连接外部传感器设备（如高频交易接口、物理传感器）。开启数据流后，系统将以 50Hz 的频率接收带有高频噪声的原始信号。
        </div>
        
        <div style="display:flex;gap:10px;margin-bottom:16px;">
          <button class="btn btn-emerald" id="btn-start-stream" onclick="window.__sensorDSP?.startStream()">▶ 连接并开始接收数据</button>
          <button class="btn btn-rose" id="btn-stop-stream" onclick="window.__sensorDSP?.stopStream()" disabled style="opacity:0.5;">■ 停止接收</button>
          <button class="btn btn-ghost" onclick="window.__sensorDSP?.clearStream()">✕ 清空画布</button>
        </div>

        <div style="background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:6px; padding:12px; font-family:var(--font-mono); font-size:11px; color:var(--emerald); height:150px; overflow-y:auto;" id="serial-terminal">
          [System] 端口已就绪，等待连接...
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="card-title gold" style="margin-bottom:0;">实时动态波形图</div>
          <div style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);">更新频率: 20ms</div>
        </div>
        <div id="sensor-plot" style="height:280px;"></div>
      </div>
    </div>
  `;
  setTimeout(initPlot, 50);
}

function initPlot() {
  _timeBuffer = Array.from({length: 100}, (_, i) => i);
  _rawBuffer = Array(100).fill(0);
  _t = 100;
  
  Plotly.newPlot('sensor-plot', [{
    x: _timeBuffer, y: _rawBuffer, mode: 'lines', name: 'Raw Signal', line: { color: '#00d4aa', width: 1.5 }
  }], {
    ...BASE_LAYOUT,
    margin: { t: 20, b: 30, l: 40, r: 20 },
    xaxis: { title: 'Time (t)', gridcolor: '#1e2d4a', range: [0, 100] },
    yaxis: { title: 'Amplitude', gridcolor: '#1e2d4a', range: [-3, 3] },
    showlegend: false
  }, BASE_CONFIG);
}

function startStream() {
  document.getElementById('btn-start-stream').disabled = true;
  document.getElementById('btn-start-stream').style.opacity = '0.5';
  document.getElementById('btn-stop-stream').disabled = false;
  document.getElementById('btn-stop-stream').style.opacity = '1';
  
  const term = document.getElementById('serial-terminal');
  term.innerHTML += '<br>[System] 已连接。开始接收高频数据流...';
  
  // 每 40ms 更新一次图表 (25 FPS 视觉刷新率)
  _streamInterval = setInterval(() => {
    // 生成 2 个新数据点 (模拟 50Hz 采样)
    for(let i=0; i<2; i++) {
      _t++;
      // 生成带有高频白噪声的低频正弦波，偶尔夹杂尖峰噪声
      const baseSignal = Math.sin(_t * 0.05) * 1.5;
      const noise = (Math.random() - 0.5) * 0.8;
      const spike = Math.random() > 0.98 ? (Math.random() > 0.5 ? 2 : -2) : 0;
      
      const val = baseSignal + noise + spike;
      
      _timeBuffer.push(_t);
      _rawBuffer.push(val);
      
      // 保持窗口大小为 100
      if (_timeBuffer.length > 100) {
        _timeBuffer.shift();
        _rawBuffer.shift();
      }
    }

    Plotly.update('sensor-plot', {
      x: [_timeBuffer], y: [_rawBuffer]
    }, {
      xaxis: { range: [_timeBuffer[0], _timeBuffer[_timeBuffer.length - 1]] }
    });

    // 终端滚动
    if(Math.random() > 0.8) {
      term.innerHTML += `<br><span style="color:var(--text-muted);">[DATA] t=${_t} | val=${_rawBuffer[_rawBuffer.length-1].toFixed(3)}</span>`;
      term.scrollTop = term.scrollHeight;
    }

  }, 40);
}

function stopStream() {
  clearInterval(_streamInterval);
  document.getElementById('btn-start-stream').disabled = false;
  document.getElementById('btn-start-stream').style.opacity = '1';
  document.getElementById('btn-stop-stream').disabled = true;
  document.getElementById('btn-stop-stream').style.opacity = '0.5';
  const term = document.getElementById('serial-terminal');
  if(term) {
    term.innerHTML += '<br><span style="color:var(--rose);">[System] 数据流已断开。</span>';
    term.scrollTop = term.scrollHeight;
  }
}

function clearStream() {
  stopStream();
  initPlot();
  const term = document.getElementById('serial-terminal');
  if(term) term.innerHTML = '[System] 缓冲区已清空。';
}

/* ─── Tab 2: 信号处理管道 (DSP Pipeline) ─── */
function _renderDSP(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title violet">数字信号处理 (DSP) 与降噪</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
        现实世界采集的数据往往充满噪声。我们可以在送入机器学习模型前，利用数字滤波器提取核心特征。
      </div>
      
      <div style="display:flex;gap:16px;margin-bottom:20px;align-items:center;">
        <button class="btn btn-primary" onclick="window.__sensorDSP?.applyFilter()">⚡ 运用滑动平均滤波 (SMA)</button>
        <span style="font-size:11px;color:var(--text-faint);font-family:var(--font-mono);">窗口大小 (Window Size) = 5</span>
      </div>

      <div id="dsp-plot" style="height:300px; background:rgba(0,0,0,0.1); border-radius:8px; border:1px solid var(--border);"></div>
      
      <div style="margin-top:16px; border-top:1px dashed var(--border); padding-top:16px; display:flex; gap:10px;">
        <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('在处理高频时序数据时，简单滑动平均（SMA）、指数加权移动平均（EMA）和卡尔曼滤波（Kalman Filter）在去噪原理上有什么本质区别？对于包含突发性随机尖峰（Spikes）的传感器数据，哪种算法的鲁棒性更好？', '信号处理', true)">
          🤖 问 AI：滤波算法的选取与对比
        </button>
        <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('如果我想分析这段信号的频域特征，如何使用 Python 中的 np.fft 进行快速傅里叶变换（FFT），并绘制出其频谱图以发现隐藏的周期性规律？', '信号处理', true)">
          🤖 问 AI：频域转换与 FFT 代码
        </button>
      </div>
    </div>
  `;
  setTimeout(drawStaticDSP, 50);
}

// 静态画出带噪声的数据及其滤波后结果
function drawStaticDSP() {
  const container = document.getElementById('dsp-plot');
  if(!container || typeof Plotly === 'undefined') return;

  const N = 200;
  const time = Array.from({length: N}, (_, i) => i);
  const raw = time.map(t => Math.sin(t * 0.1) * 2 + (Math.random()-0.5)*1.2 + (Math.random()>0.95 ? 2.5 : 0));
  
  Plotly.newPlot('dsp-plot', [{
    x: time, y: raw, mode: 'lines', name: '原始含噪信号', line: { color: '#6b7fa3', width: 1, opacity: 0.6 }
  }], {
    ...BASE_LAYOUT,
    margin: { t: 20, b: 30, l: 40, r: 20 },
    xaxis: { title: 'Time' }, yaxis: { title: 'Amplitude' },
    showlegend: true, legend: { x: 0, y: 1, bgcolor: 'transparent' }
  }, BASE_CONFIG);
  
  // 缓存给 applyFilter 用
  window.__sensorDSP._staticRaw = raw;
  window.__sensorDSP._staticTime = time;
}

function applyFilter() {
  const raw = window.__sensorDSP._staticRaw;
  const time = window.__sensorDSP._staticTime;
  if(!raw) return;

  const windowSize = 5;
  const filtered = [];
  
  // 简单的滑动平均 (SMA) 算法实现
  for(let i=0; i<raw.length; i++) {
    let sum = 0;
    let count = 0;
    for(let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
      sum += raw[j];
      count++;
    }
    filtered.push(sum / count);
  }

  // 追加滤波后的曲线到图表中
  Plotly.addTraces('dsp-plot', {
    x: time, y: filtered, mode: 'lines', name: '滑动平均滤波 (SMA)', line: { color: '#d4a853', width: 2.5 }
  });
  
  window.__copilot?.addMessage('sys', '✓ 滤波处理已应用。可以明显看出滑动平均抹平了大部分高频白噪声，但也使得信号的峰值产生了些许滞后（Lag）。');
}

window.__sensorDSP = { init, switchTab, startStream, stopStream, clearStream, applyFilter };a