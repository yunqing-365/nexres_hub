/* ═══════════════════════════════════════════════════════
   utils/charts.js — Plotly Chart Helpers
   Shared Plotly layout presets and chart factory fns.
═══════════════════════════════════════════════════════ */

/** 通用 Plotly 布局基础配置（暗色主题） */
export const BASE_LAYOUT = {
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'rgba(0,0,0,0.12)',
  font: { color: '#94a3b8', family: "'IBM Plex Mono', monospace", size: 10 },
  margin: { t: 12, b: 36, l: 44, r: 12 },
  xaxis: { gridcolor: '#1e2d4a', tickcolor: '#6b7fa3', zerolinecolor: '#1e2d4a' },
  yaxis: { gridcolor: '#1e2d4a', tickcolor: '#6b7fa3', zerolinecolor: '#1e2d4a' },
  showlegend: false,
};

export const BASE_CONFIG = { displayModeBar: false, responsive: true };

/**
 * 渲染折线图
 * @param {string} containerId
 * @param {Array}  traces        - Plotly trace 对象数组
 * @param {Object} layoutOverride - 覆盖 BASE_LAYOUT 的字段
 */
export function renderLine(containerId, traces, layoutOverride = {}) {
  Plotly.newPlot(
    containerId,
    traces,
    { ...BASE_LAYOUT, ...layoutOverride },
    BASE_CONFIG,
  );
}

/**
 * 渲染分组柱状图
 */
export function renderBar(containerId, traces, layoutOverride = {}) {
  Plotly.newPlot(
    containerId,
    traces,
    { ...BASE_LAYOUT, barmode: 'group', ...layoutOverride },
    BASE_CONFIG,
  );
}

/**
 * 渲染雷达图（技能图谱专用）
 */
export function renderRadar(containerId, r, theta, color = '#00d4aa') {
  Plotly.newPlot(
    containerId,
    [{
      type: 'scatterpolar',
      r,
      theta,
      fill: 'toself',
      fillcolor: `${color}1e`,
      line: { color, width: 2 },
    }],
    {
      polar: {
        bgcolor: 'transparent',
        radialaxis: {
          visible: true,
          range: [0, 100],
          gridcolor: '#2a3f6a',
          color: '#6b7fa3',
          tickfont: { size: 9 },
        },
        angularaxis: {
          gridcolor: '#2a3f6a',
          color: '#94a3b8',
          tickfont: { size: 11 },
        },
      },
      paper_bgcolor: 'transparent',
      margin: { t: 20, b: 20, l: 20, r: 20 },
      showlegend: false,
    },
    BASE_CONFIG,
  );
}

/**
 * Loss 曲面 + 下降路径（ML Lab 专用）
 */
export function renderGradientDescent(containerId, pathW, pathLoss, lambda = 0, diverged = false) {
  const bgW    = Array.from({ length: 100 }, (_, i) => -5 + i * 0.1);
  const bgLoss = bgW.map(x => x * x + lambda * x * x);

  const traces = [
    {
      x: bgW,    y: bgLoss,
      mode: 'lines', name: 'Loss 曲面',
      line: { color: '#1e2d4a', width: 2 },
      fill: 'tozeroy', fillcolor: 'rgba(99,102,241,0.04)',
    },
    {
      x: pathW,  y: pathLoss,
      mode: 'lines+markers', name: '下降轨迹',
      line: { color: diverged ? '#ef4444' : '#00d4aa', width: 2 },
      marker: { size: 5, color: diverged ? '#ef4444' : '#00d4aa' },
    },
  ];

  Plotly.newPlot(
    containerId,
    traces,
    {
      ...BASE_LAYOUT,
      xaxis: { ...BASE_LAYOUT.xaxis, title: 'θ' },
      yaxis: { ...BASE_LAYOUT.yaxis, title: 'Loss' },
      showlegend: true,
      legend: { font: { size: 10 }, bgcolor: 'transparent' },
    },
    BASE_CONFIG,
  );
}
