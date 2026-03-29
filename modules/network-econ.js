/* ═══════════════════════════════════════════════════════
   modules/network-econ.js — 复杂网络与空间计量 (Network & Spatial Econ)
   Features: 企业关联网络构建 · 风险传染(Contagion)仿真 · 空间权重矩阵
═══════════════════════════════════════════════════════ */

import { BASE_LAYOUT, BASE_CONFIG } from '../utils/charts.js';

const CONTAINER = 'module-network-econ';
let _activeTab = 'topology';
let _simInterval = null;

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">复杂网络与空间计量 (Network & Spatial Econ)</div>
        <div class="page-desc">打破“独立同分布”假设：董事网络交叉 · 供应链风险传染 · 空间溢出效应</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="topology" onclick="window.__networkEcon?.switchTab('topology',this)">🕸️ 企业关联网络拓扑</div>
      <div class="module-tab" data-tab="contagion" onclick="window.__networkEcon?.switchTab('contagion',this)">🦠 风险传染仿真 (Contagion)</div>
      <div class="module-tab" data-tab="spatial" onclick="window.__networkEcon?.switchTab('spatial',this)">🗺️ 空间权重矩阵 (W)</div>
    </div>

    <div id="network-econ-content"></div>
  `;

  _renderTab(_activeTab);
}

function switchTab(tab, el) {
  _activeTab = tab;
  clearInterval(_simInterval); // 切换时停止可能的仿真动画
  document.querySelectorAll(`#${CONTAINER} .module-tab`).forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderTab(tab);
}

function _renderTab(tab) {
  const content = document.getElementById('network-econ-content');
  if (!content) return;
  if (tab === 'topology') _renderTopology(content);
  else if (tab === 'contagion') _renderContagion(content);
  else if (tab === 'spatial') _renderSpatial(content);
}

/* ─── Tab 1: 企业关联网络拓扑 ─── */
function _renderTopology(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="card-title cyan" style="margin-bottom:0;">供应链与董事兼任网络</div>
          <button class="btn btn-primary btn-sm" onclick="window.__networkEcon?.generateNetwork()">🔄 重新生成网络</button>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          在资本市场中，企业通过<strong>共同高管（连锁董事）</strong>或<strong>供应链上下游</strong>形成复杂的拓扑结构。图中大节点代表“核心枢纽企业”。
        </div>
        
        <div id="econ-network-chart" style="height:350px; background:rgba(0,0,0,0.15); border-radius:8px; border:1px solid var(--border);"></div>
      </div>

      <div class="card">
        <div class="card-title violet">网络中心性特征测度</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          在将网络结构引入回归模型前，我们需要将图数据降维成可量化的面板特征。
        </div>
        
        <table class="exp-table" style="text-align:left;">
          <thead>
            <tr><th>网络特征 (Network Metrics)</th><th style="text-align:right;">当前网络均值</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style="color:var(--cyan);">度中心性 (Degree Centrality)</strong><br><span style="font-size:10px;color:var(--text-faint);">衡量企业的直接关联伙伴数量</span></td>
              <td style="text-align:right;color:var(--text);">4.2</td>
            </tr>
            <tr>
              <td><strong style="color:var(--violet);">中介中心性 (Betweenness Centrality)</strong><br><span style="font-size:10px;color:var(--text-faint);">衡量企业作为“中间人/桥梁”控制信息流的能力</span></td>
              <td style="text-align:right;color:var(--text);">0.15</td>
            </tr>
            <tr>
              <td><strong style="color:var(--gold);">结构洞 (Structural Holes / Constraint)</strong><br><span style="font-size:10px;color:var(--text-faint);">Burt (1992) 提出，衡量企业是否占据非冗余的优势位置</span></td>
              <td style="text-align:right;color:var(--text);">0.38</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:16px; border-top:1px dashed var(--border); padding-top:16px;">
          <button class="btn btn-ghost" style="width:100%;text-align:left;line-height:1.6;" onclick="window.__copilot?.askCopilot('在公司金融研究中，如果我构建了上市公司之间的“连锁董事网络（Board Interlock Network）”，我应该如何利用企业的“度中心性”或“结构洞”特征，来设计一个关于【企业创新绩效】或【并购决策传染】的实证模型？请给我一个具体的研究设计思路。', '网络计量', true)">
            🤖 问 AI：如何利用网络特征构思顶级论文？
          </button>
        </div>
      </div>
    </div>
  `;
  setTimeout(generateNetwork, 50);
}

function generateNetwork() {
  const container = document.getElementById('econ-network-chart');
  if(!container || typeof Plotly === 'undefined') return;

  const N = 40;
  const nodes = Array.from({length: N}, (_, i) => ({
    id: i,
    x: Math.random(),
    y: Math.random(),
    degree: 0,
    isHub: false
  }));

  // 设置 3 个枢纽节点
  nodes[0].isHub = true; nodes[0].x = 0.5; nodes[0].y = 0.5;
  nodes[1].isHub = true; nodes[1].x = 0.2; nodes[1].y = 0.8;
  nodes[2].isHub = true; nodes[2].x = 0.8; nodes[2].y = 0.2;

  const edges = [];
  for (let i = 0; i < N; i++) {
    // 随机连接到枢纽
    if (!nodes[i].isHub) {
      const hubTarget = Math.floor(Math.random() * 3);
      edges.push([i, hubTarget]);
      nodes[i].degree++; nodes[hubTarget].degree++;
    }
    // 随机普通连接
    if (Math.random() > 0.85 && i > 2) {
      const target = Math.floor(Math.random() * N);
      if (target !== i) {
        edges.push([i, target]);
        nodes[i].degree++; nodes[target].degree++;
      }
    }
  }

  const edgeX = [], edgeY = [];
  edges.forEach(([u, v]) => {
    edgeX.push(nodes[u].x, nodes[v].x, null);
    edgeY.push(nodes[u].y, nodes[v].y, null);
  });

  const edgeTrace = { x: edgeX, y: edgeY, mode: 'lines', line: { width: 1, color: '#2a3f6a' }, hoverinfo: 'none' };
  
  const nodeTrace = {
    x: nodes.map(n => n.x), y: nodes.map(n => n.y),
    mode: 'markers',
    marker: { 
      size: nodes.map(n => n.isHub ? 24 : 8 + n.degree * 2),
      color: nodes.map(n => n.isHub ? '#d4a853' : '#00d4aa'), 
      line: { width: 1.5, color: '#1e2d4a' } 
    },
    hoverinfo: 'text',
    text: nodes.map(n => `企业 ${n.id}<br>关联数: ${n.degree}`)
  };

  Plotly.newPlot('econ-network-chart', [edgeTrace, nodeTrace], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', showlegend: false,
    xaxis: { showgrid: false, zeroline: false, showticklabels: false },
    yaxis: { showgrid: false, zeroline: false, showticklabels: false },
    margin: { t: 10, b: 10, l: 10, r: 10 }, hovermode: 'closest'
  }, { displayModeBar: false });
}

/* ─── Tab 2: 风险传染仿真 (Contagion) ─── */
function _renderContagion(container) {
  container.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="card-title rose" style="margin-bottom:0;">金融危机与风险传染仿真 (Financial Contagion)</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-rose btn-sm" onclick="window.__networkEcon?.startContagion()">▶ 触发违约冲击</button>
          <button class="btn btn-ghost btn-sm" onclick="window.__networkEcon?.resetContagion()">↺ 重置系统</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;margin-top:8px;">
        模拟单点企业发生财务造假或债务违约（<span style="color:var(--rose);">红点</span>），如何通过复杂的借贷网络或供应链关系，导致其他原本健康的企业（<span style="color:var(--emerald);">绿点</span>）遭遇流动性危机并产生连锁破产反应。
      </div>
      
      <div class="grid-2">
        <div id="contagion-chart" style="height:320px; background:rgba(0,0,0,0.15); border-radius:8px; border:1px solid var(--border);"></div>
        <div style="padding:16px; display:flex; flex-direction:column; justify-content:center;">
          <div class="stat-card rose-accent" style="margin-bottom:16px; padding:12px;">
            <div class="stat-num rose" style="font-size:24px;" id="infected-count">1</div>
            <div class="stat-label">已违约企业数量</div>
          </div>
          <div style="font-size:12px;color:var(--text);line-height:1.6;background:rgba(224,92,122,0.08);border:1px solid rgba(224,92,122,0.3);border-radius:6px;padding:12px;">
            <strong>溢出效应 (Spillover Effect) 分析：</strong><br>
            通过观测破产传染路径可以发现，占据网络核心枢纽（High Centrality）的企业一旦倒闭，其破坏力呈指数级扩散。这也解释了为什么金融监管机构对“大而不能倒（Too Big To Fail）”的系统重要性机构如此关注。
          </div>
        </div>
      </div>
    </div>
  `;
  setTimeout(resetContagion, 50);
}

let _cNodes = [], _cEdges = [];

function resetContagion() {
  clearInterval(_simInterval);
  const container = document.getElementById('contagion-chart');
  if(!container || typeof Plotly === 'undefined') return;

  const N = 50;
  _cNodes = Array.from({length: N}, (_, i) => ({
    id: i, x: Math.random(), y: Math.random(), status: 'healthy', neighbors: []
  }));
  
  _cEdges = [];
  for(let i=0; i<N; i++) {
    for(let j=i+1; j<N; j++) {
      if(Math.random() < 0.08) { // 连通概率
        _cEdges.push([i, j]);
        _cNodes[i].neighbors.push(j);
        _cNodes[j].neighbors.push(i);
      }
    }
  }

  // 初始感染一个中心节点
  _cNodes[0].status = 'infected';
  _cNodes[0].x = 0.5; _cNodes[0].y = 0.5;
  document.getElementById('infected-count').textContent = '1';

  _drawContagion();
}

function _drawContagion() {
  const edgeX = [], edgeY = [];
  _cEdges.forEach(([u, v]) => {
    edgeX.push(_cNodes[u].x, _cNodes[v].x, null);
    edgeY.push(_cNodes[u].y, _cNodes[v].y, null);
  });

  const colors = _cNodes.map(n => n.status === 'healthy' ? '#10b981' : '#e05c7a');
  
  Plotly.react('contagion-chart', [
    { x: edgeX, y: edgeY, mode: 'lines', line: { width: 0.5, color: '#2a3f6a' }, hoverinfo: 'none' },
    { x: _cNodes.map(n => n.x), y: _cNodes.map(n => n.y), mode: 'markers', marker: { size: 10, color: colors, line: { width: 1, color: '#1e2d4a' } }, hoverinfo: 'none' }
  ], {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', showlegend: false,
    xaxis: { showgrid: false, zeroline: false, showticklabels: false },
    yaxis: { showgrid: false, zeroline: false, showticklabels: false },
    margin: { t: 0, b: 0, l: 0, r: 0 }, hovermode: 'closest'
  });
}

function startContagion() {
  clearInterval(_simInterval);
  _simInterval = setInterval(() => {
    let newInfected = 0;
    const toInfect = [];
    _cNodes.forEach(node => {
      if (node.status === 'healthy') {
        const infectedNeighbors = node.neighbors.filter(nid => _cNodes[nid].status === 'infected').length;
        // 如果邻居有违约的，自己有概率违约（感染）
        if (infectedNeighbors > 0 && Math.random() < 0.3 * infectedNeighbors) {
          toInfect.push(node.id);
        }
      }
    });

    if (toInfect.length === 0) {
      clearInterval(_simInterval);
      return;
    }

    toInfect.forEach(id => _cNodes[id].status = 'infected');
    const totalInfected = _cNodes.filter(n => n.status === 'infected').length;
    document.getElementById('infected-count').textContent = totalInfected;
    
    _drawContagion();
  }, 800);
}

/* ─── Tab 3: 空间计量模型 (Spatial Econometrics) ─── */
function _renderSpatial(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">空间权重矩阵 W (Spatial Weight Matrix)</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          在处理区域经济、房价、环境污染等数据时，“邻居的行为会影响你”。我们需要定义一个矩阵 $W$ 来量化个体间的“距离”。
        </div>
        
        <div style="background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:16px;">
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:8px;">常见的 $W$ 矩阵构造方式：</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);"><input type="radio" name="w-type" checked style="accent-color:var(--cyan);"> 0-1 邻接矩阵 (Contiguity)：地理上接壤则为 1，否则为 0</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);"><input type="radio" name="w-type" style="accent-color:var(--cyan);"> 地理距离反比矩阵 (Inverse Distance)：距离越近权重越大</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);"><input type="radio" name="w-type" style="accent-color:var(--cyan);"> 经济距离矩阵 (Economic Distance)：GDP差异越小权重越大</label>
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="window.__copilot?.askCopilot('在空间计量经济学中，如果我要研究某省各市的【房价】是否存在空间溢出效应，我应该如何用 Python 的 PySAL 库或 Stata 来构建并标准化一个空间权重矩阵 $W$？请给我具体的代码和步骤。', '空间计量', true)">
          🤖 问 AI：如何构建空间权重矩阵代码？
        </button>
      </div>

      <div class="card">
        <div class="card-title gold">三大经典空间模型诊断</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          根据溢出发生的途径不同，学术界常用的三个核心模型：
        </div>
        
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="border-left:3px solid var(--rose);padding-left:10px;">
            <div style="font-size:13px;color:var(--text);font-weight:bold;">空间自回归模型 (SAR)</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">$Y = \\rho WY + X\\beta + \\varepsilon$</div>
            <div style="font-size:11px;color:var(--text-faint);margin-top:4px;">含义：邻居的<strong>结果(Y)</strong>直接影响你的结果（如：邻省的房价拉高了本省的房价）。</div>
          </div>
          
          <div style="border-left:3px solid var(--cyan);padding-left:10px;">
            <div style="font-size:13px;color:var(--text);font-weight:bold;">空间误差模型 (SEM)</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">$Y = X\\beta + u, \\quad u = \\lambda Wu + \\varepsilon$</div>
            <div style="font-size:11px;color:var(--text-faint);margin-top:4px;">含义：不可观测的<strong>随机冲击(Error)</strong>具有空间相关性（如：一场大雾霾同时影响了周边几个市的交通）。</div>
          </div>

          <div style="border-left:3px solid var(--violet);padding-left:10px;">
            <div style="font-size:13px;color:var(--text);font-weight:bold;">空间德宾模型 (SDM)</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">$Y = \\rho WY + X\\beta + WX\\theta + \\varepsilon$</div>
            <div style="font-size:11px;color:var(--text-faint);margin-top:4px;">含义：邻居的<strong>特征(X)</strong>也影响你的结果（如：邻省加大教育投入，吸引了本省的人才）。</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.__networkEcon = { init, switchTab, generateNetwork, startContagion, resetContagion };