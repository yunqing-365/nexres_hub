/* ═══════════════════════════════════════════════════════
   modules/lit-matrix.js — 文献矩阵与 Gap 嗅探器
   Features: 二维文献对比矩阵 · 自动化 Research Gap 发掘
═══════════════════════════════════════════════════════ */

import { PAPERS } from '../data/papers.js';

const CONTAINER = 'module-lit-matrix';
let _activeTab = 'matrix';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">文献矩阵与 Gap 嗅探器 (Literature Matrix)</div>
        <div class="page-desc">横向对比多篇核心文献，让未被研究的“结构空白”自动浮现。</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="matrix" onclick="window.__litMatrix?.switchTab('matrix',this)">📊 自动化综述矩阵</div>
      <div class="module-tab" data-tab="gap" onclick="window.__litMatrix?.switchTab('gap',this)">🎯 Research Gap 定位</div>
    </div>

    <div id="lit-matrix-content"></div>
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
  const content = document.getElementById('lit-matrix-content');
  if (!content) return;
  
  if (tab === 'matrix') _renderMatrix(content);
  else if (tab === 'gap') _renderGap(content);
}

/* ─── Tab 1: 自动化综述矩阵 ─── */
function _renderMatrix(container) {
  // 模拟从本地勾选了 4 篇相关文献生成的横向对比矩阵
  const matrixData = [
    {
      author: "Wang et al. (2024)",
      title: "Real-time Target Detection for Sports Scoring",
      method: "YOLOv8-Nano + NPU 加速",
      dataset: "自建靶标数据集 (N=15,000)",
      limit: "硬件资源占用高，端侧发热严重"
    },
    {
      author: "Li & Chen (2023)",
      title: "Optimizing CNNs for RTOS Environments",
      method: "INT8 训练后量化 (PTQ)",
      dataset: "ImageNet-1K Subset",
      limit: "量化掉点明显，缺乏硬件与算法的协同设计"
    },
    {
      author: "Smith et al. (2025)",
      title: "Task Scheduling in Industrial IoT",
      method: "抢占式调度 + 优先级继承",
      dataset: "物理仿真时序日志",
      limit: "未考虑高并发视觉识别任务对 CPU 锁的抢占"
    },
    {
      author: "Zhang (2023)",
      title: "Edge-based Scoring Vision System",
      method: "MobileNet V3 + 传统边缘提取",
      dataset: "标准比赛录像帧",
      limit: "对光照和阴影极度敏感，鲁棒性差"
    }
  ];

  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div class="card-title cyan" style="margin-bottom:0;">核心文献降维对比 (2D Matrix)</div>
        <button class="btn btn-primary btn-sm" onclick="window.__copilot?.askCopilot('请帮我从我现有的文献库中，筛选出关于“嵌入式视觉系统”和“边缘部署”的 Top 5 论文，并自动提取它们的【使用算法】、【硬件平台】、【局限性】生成 markdown 格式的对比大表。', '文献矩阵', true)">
          ⚡ 扫描文献库自动生成
        </button>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
        将文献的“核心变量”横向拉开，是避免在综述里记流水账的最有效方法。
      </div>

      <div style="overflow-x:auto;">
        <table class="exp-table" style="min-width: 800px;">
          <thead>
            <tr>
              <th style="width:15%;">文献 / 作者</th>
              <th style="width:20%; color:var(--cyan);">核心算法 / 方法</th>
              <th style="width:20%; color:var(--violet);">数据集 / 硬件依托</th>
              <th style="width:25%; color:var(--rose);">局限性 (Limitations)</th>
              <th style="width:20%; color:var(--gold);">潜在扩展点</th>
            </tr>
          </thead>
          <tbody>
            ${matrixData.map(r => `
              <tr>
                <td style="font-weight:600; color:var(--text); line-height:1.4;">
                  ${r.author}<br>
                  <span style="font-size:10px; color:var(--text-faint); font-weight:normal;">${r.title}</span>
                </td>
                <td style="color:var(--text-muted);">${r.method}</td>
                <td style="color:var(--text-muted);">${r.dataset}</td>
                <td style="color:var(--text-muted);">${r.limit}</td>
                <td><button class="btn btn-ghost btn-sm" style="font-size:10px;">AI 推演</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ─── Tab 2: Research Gap 定位 ─── */
function _renderGap(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title gold">Gap 嗅探与创新点合成</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          基于前序大表的对比，系统自动锚定研究领域的交叉空白。
        </div>
        
        <div style="background:rgba(212,168,83,0.08); border:1px solid var(--gold-dim); border-radius:6px; padding:16px; margin-bottom:20px;">
          <strong style="color:var(--gold); font-size:14px; display:block; margin-bottom:8px;">🎯 探测到极具价值的跨界 Research Gap：</strong>
          <div style="font-size:13px; color:var(--text); line-height:1.7;">
            当前研究存在明显割裂：搞视觉算法的文献（如 Wang, 2024; Zhang, 2023）严重依赖服务器算力，端侧发热高；而搞底层系统的文献（如 Li, 2023; Smith, 2025）又缺乏对高并发视觉识别任务调度优化的探讨。<br><br>
            <strong style="color:var(--cyan);">创新切入点：</strong><br>
            针对边缘单板计算机（搭载轻量 NPU），提出一种<strong>「结合 INT8 量化感知与 RTOS 任务动态优先级的视觉识别系统方案」</strong>。这种既懂软件算法又深入底层硬件的软硬协同设计，是目前领域的显著空白。
          </div>
        </div>

        <button class="btn btn-gold" style="width:100%; justify-content:center;" onclick="window.__copilot?.askCopilot('基于上述探测到的“软硬结合” Research Gap，如果我要依托一块带有 NPU 的单板计算机开发一套射箭靶标计分系统，请帮我起草一份具有顶级学术视野的【开题报告核心框架】。要求包含：1. 痛点分析；2. 软硬协同的系统架构设计；3. 预期解决的工程难点。', 'Gap 嗅探器', true)">
          🤖 让 AI 直接生成开题报告大纲
        </button>
      </div>

      <div class="card">
        <div class="card-title violet">Gap 维度雷达</div>
        <div style="display:flex; justify-content:center; align-items:center; height: 250px; border:1px solid var(--border); background:rgba(0,0,0,0.15); border-radius:8px; margin-bottom:12px;" id="gap-radar-container">
          <div style="font-size:11px; color:var(--text-faint);">[ 雷达图：方法创新 vs 数据创新 vs 硬件部署 vs 理论突破 ]</div>
        </div>
        <div style="font-size:12px; color:var(--text-muted); line-height:1.6;">
          你在 <strong>硬件部署与协同调度</strong> 维度的创新度极高，有效规避了纯算法领域“内卷”的算力比拼。这是一个兼具学术价值和工业落地前景的绝佳方向！
        </div>
      </div>
    </div>
  `;
  
  // 稍作延时渲染雷达图
  setTimeout(() => {
    if (window.Plotly) {
      const container = document.getElementById('gap-radar-container');
      if (container) container.innerHTML = '';
      import('../utils/charts.js').then(module => {
        module.renderRadar('gap-radar-container', [40, 30, 95, 60], ['纯算法创新', '数据集独特性', '硬件部署/软硬协同', '理论框架延展'], '#d4a853');
      });
    }
  }, 100);
}

window.__litMatrix = { init, switchTab };