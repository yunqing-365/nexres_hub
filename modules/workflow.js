/* ═══════════════════════════════════════════════════════
   modules/workflow.js — 科研全链路导航仪 (SOP Wizard)
   Features: 步骤拆解 · 核心痛点引导 · 模块快捷跳转
═══════════════════════════════════════════════════════ */

const CONTAINER = 'module-workflow';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">科研全链路导航仪 (SOP)</div>
        <div class="page-desc">不知道下一步该做什么？跟着这里的标准动作一步步推进。</div>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:20px; max-width: 900px;">
      
      <div class="card" style="border-left: 4px solid var(--violet);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="font-size:18px; font-weight:600; color:var(--text);">Phase 1: 破局与输入 (文献与选题)</div>
          <span class="tag tag-violet">基础构建</span>
        </div>
        <div style="font-size:13px; color:var(--text-muted); line-height:1.6; margin-bottom:16px;">
          <strong>目标：</strong>找到一个有价值、且在你能力范围内能做出来的问题。<br>
          <strong>常见困惑：</strong>不知道搜什么词？看了一堆论文还是脑子空空？
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('我目前的研究大方向是关于底层系统的控制和调度，但我不知道具体该怎么切入。请教我如何使用 Semantic Scholar 和 arXiv 寻找该领域的最新综述（Review），并给出 5 个精确的英文检索关键词。', 'SOP 引导', true)">
            🗣️ 问 AI：如何定关键词找文献？
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.__shell?.switchTab('literature')">
            跳转 ➔ 去「文献星系」看引文网络
          </button>
        </div>
      </div>

      <div class="card" style="border-left: 4px solid var(--cyan);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="font-size:18px; font-weight:600; color:var(--text);">Phase 2: 弹药准备 (数据获取与清洗)</div>
          <span class="tag tag-cyan">硬核攻坚</span>
        </div>
        <div style="font-size:13px; color:var(--text-muted); line-height:1.6; margin-bottom:16px;">
          <strong>目标：</strong>拿到干净的、可以直接喂给模型或统计软件的数据表格。<br>
          <strong>常见困惑：</strong>硬件导出来的日志全是乱码？数据维度对不上怎么办？
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('我手头有一批杂乱的时序数据记录，包含时间戳、状态码和数值。我应该按照什么标准步骤（SOP）用 Python 和 Pandas 把它们清洗成标准的特征矩阵？请给我一个清洗的 Checklist。', 'SOP 引导', true)">
            🗣️ 问 AI：数据清洗的标准流程
          </button>
          <button class="btn btn-cyan btn-sm" onclick="window.__shell?.switchTab('agent-studio')">
            跳转 ➔ 让「Agent 工坊」帮你写清洗代码
          </button>
        </div>
      </div>

      <div class="card" style="border-left: 4px solid var(--gold);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="font-size:18px; font-weight:600; color:var(--text);">Phase 3: 核心验证 (模型与实验)</div>
          <span class="tag tag-gold">迭代优化</span>
        </div>
        <div style="font-size:13px; color:var(--text-muted); line-height:1.6; margin-bottom:16px;">
          <strong>目标：</strong>建立有效的模型，对比 Baseline，找出性能提升的来源。<br>
          <strong>常见困惑：</strong>Loss 降不下去怎么办？怎么设计消融实验才显得高级？
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('我在做模型训练时，到底该怎么科学地调参？请按优先级告诉我：应该先调架构深度、Learning Rate，还是 Batch Size？请给出一个系统的调参策略。', 'SOP 引导', true)">
            🗣️ 问 AI：科学调参的优先级是什么？
          </button>
          <button class="btn btn-primary btn-sm" style="background:linear-gradient(135deg, #b88a2a, #d4a853); color:#0a0e1a;" onclick="window.__shell?.switchTab('dl-lab')">
            跳转 ➔ 进「深度学习实验室」跑模型
          </button>
        </div>
      </div>

      <div class="card" style="border-left: 4px solid var(--rose);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="font-size:18px; font-weight:600; color:var(--text);">Phase 4: 知识封测 (写作与产出)</div>
          <span class="tag tag-rose">收官冲刺</span>
        </div>
        <div style="font-size:13px; color:var(--text-muted); line-height:1.6; margin-bottom:16px;">
          <strong>目标：</strong>将实验结果转化为严谨的学术语言，完成大论文框架。<br>
          <strong>常见困惑：</strong>第一笔不知从何写起？摘要到底要涵盖哪几个要素？
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('我正在着手写大论文的初稿。为了避免后续大规模返工，我在搭提纲时应该遵循怎样的时间分配和逻辑主线？先写实验结果还是先写引言？', 'SOP 引导', true)">
            🗣️ 问 AI：学术写作的正确顺序
          </button>
          <button class="btn btn-primary btn-sm" style="background:linear-gradient(135deg, #b04060, #e05c7a); color:#fff;" onclick="window.__shell?.switchTab('writing')">
            跳转 ➔ 打开「论文工坊」结构向导
          </button>
        </div>
      </div>

    </div>
  `;
}

window.__workflow = { init };