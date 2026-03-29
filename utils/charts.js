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
 * 系数图 / Forest Plot（实验记录可视化专用）
 * @param {string} containerId
 * @param {Array}  entries  - [{ label, coef, lower, upper, color? }]
 * @param {Object} layoutOverride
 */
export function renderCoefPlot(containerId, entries, layoutOverride = {}) {
  const colors = entries.map(e => e.color ?? '#00d4aa');

  const traces = [
    // 置信区间横线
    ...entries.map((e, i) => ({
      x: [e.lower, e.upper],
      y: [e.label, e.label],
      mode: 'lines',
      line: { color: colors[i], width: 2 },
      showlegend: false,
      hoverinfo: 'skip',
    })),
    // 系数点
    {
      x: entries.map(e => e.coef),
      y: entries.map(e => e.label),
      mode: 'markers',
      marker: {
        size: 10,
        color: colors,
        symbol: 'diamond',
        line: { color: '#0a1628', width: 1.5 },
      },
      text: entries.map(e => `β = ${e.coef?.toFixed(3)}<br>95% CI: [${e.lower?.toFixed(3)}, ${e.upper?.toFixed(3)}]`),
      hovertemplate: '%{text}<extra></extra>',
      showlegend: false,
    },
    // 零线
    {
      x: [0, 0],
      y: [-0.5, entries.length - 0.5],
      mode: 'lines',
      line: { color: '#e05c7a', width: 1.5, dash: 'dash' },
      showlegend: false,
      hoverinfo: 'skip',
    },
  ];

  Plotly.newPlot(
    containerId,
    traces,
    {
      ...BASE_LAYOUT,
      height: Math.max(160, entries.length * 52 + 60),
      margin: { t: 16, b: 40, l: 140, r: 20 },
      xaxis: {
        ...BASE_LAYOUT.xaxis,
        title: '系数估计值',
        zeroline: true,
        zerolinecolor: '#e05c7a',
        zerolinewidth: 1,
      },
      yaxis: {
        ...BASE_LAYOUT.yaxis,
        autorange: 'reversed',
        tickfont: { size: 11 },
      },
      ...layoutOverride,
    },
    BASE_CONFIG,
  );
}
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
