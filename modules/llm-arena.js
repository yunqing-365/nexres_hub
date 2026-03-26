/* ═══════════════════════════════════════════════════════
   modules/llm-arena.js — LLM Arena (Prompt Engineering Lab)
   Features: prompt editor · technique loader
             dual-model comparison · academic benchmark
═══════════════════════════════════════════════════════ */

import { estimateTokens } from '../utils/storage.js';

const CONTAINER = 'module-llm';

/* ── Preset prompts ── */
const EXAMPLES = [
  '请用因果推断的视角解释「工具变量法 (IV)」的核心逻辑，为什么普通 OLS 在存在内生性时会失效？',
  '请解释 Transformer 中自注意力机制的数学原理：Q、K、V 矩阵分别代表什么？为什么要除以 √d_k？',
  '请解释双重差分法 (DID) 中「平行趋势假设」的含义，以及如何通过事件研究图检验该假设。',
];

const TECHNIQUES = {
  cot: {
    label: '思维链 (CoT)',
    prompt: `请一步步思考以下问题（先分析背景假设，再推导逻辑链，最后给出结论）：

在工具变量法中，为什么「排他性约束」比「相关性条件」更难验证，且无法直接从数据中检验？`,
  },
  fewshot: {
    label: '少样本 (Few-Shot)',
    prompt: `以下是将统计概念解释给非专业人士的示例：

概念：标准差
解释：就像测量一群人身高时，有的人高有的人矮，标准差告诉你这群人身高的"平均分散程度"。

概念：P 值
解释：假设药物完全无效，还能碰巧观察到这么好实验结果的概率。小于 0.05 说明纯属巧合的概率很低。

请用同样方式解释：
概念：双重差分法 (DID)`,
  },
  persona: {
    label: '角色扮演 (Persona)',
    prompt: `你是一位在哈佛经济学系任教 30 年、研究领域为因果推断和政策评估的资深教授。

现在请你向一位刚入门的硕士生解释：什么是「处理效应的异质性」？为什么这对政策设计至关重要？请举一个具体的政策例子。`,
  },
  structured: {
    label: '结构化输出',
    prompt: `请以以下 JSON 格式返回对「随机森林」和「梯度提升树」的对比分析：
{
  "method_a": { "name": "...", "strengths": [...], "weaknesses": [...], "best_use_case": "..." },
  "method_b": { "name": "...", "strengths": [...], "weaknesses": [...], "best_use_case": "..." },
  "key_differences": "...",
  "recommendation": "..."
}`,
  },
};

/* ── Simulated model responses ── */
const MOCK_RESPONSES = {
  default: {
    alpha: {
      speed: '72', depth: '5.8', math: '65%', academic: '70%',
      out: '【简洁版】当 Cov(X,ε)≠0 时 OLS 产生有偏估计。IV 的做法：找工具变量 Z，满足①Z 与 X 相关②Z 与 ε 无关，通过 Z 预测 X，再用预测值做回归。',
    },
    omega: {
      speed: '29', depth: '9.6', math: '96%', academic: '95%',
      out: `【深度版】设真实模型 Y=βX+ε，若 Cov(X,ε)≠0：<br>
<span class="formula">plim β̂_OLS = β + Cov(X,ε)/Var(X) ≠ β</span><br>
工具变量需满足：①<strong>相关性</strong>：Cov(Z,X)≠0（可检验，F>10 为强 IV）②<strong>排他性</strong>：Cov(Z,ε)=0（不可直接检验）<br>
2SLS：第一阶段 X̂=Zπ，第二阶段 Y=X̂β，得：<span class="formula">β̂_IV = Cov(Z,Y)/Cov(Z,X)</span>`,
    },
  },
  transformer: {
    alpha: {
      speed: '68', depth: '6.2', math: '71%', academic: '75%',
      out: '【简洁版】Q=我在找什么, K=我有什么, V=实际内容。注意力权重 = softmax(QK^T/√d)·V。除以 √d 是为了防止点积过大导致 softmax 梯度消失。',
    },
    omega: {
      speed: '28', depth: '9.7', math: '97%', academic: '96%',
      out: `【深度版】输入 X∈ℝ^{n×d}，线性变换：<span class="formula">Q=XW_Q, K=XW_K, V=XW_V</span><br>
注意力权重：<span class="formula">A = softmax(QK^T/√d_k)</span>&nbsp;&nbsp;输出：<span class="formula">Z = AV</span><br>
<strong>为什么除以 √d_k？</strong>点积的方差随 d_k 增大，导致 softmax 输出极端（近似 one-hot），梯度趋零。除以 √d_k 将方差归一化到 O(1)。<br>
多头：<span class="formula">MultiHead = Concat(head_1,…,head_h)W_O</span>，h 个头并行捕捉不同语义子空间。`,
    },
  },
};

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">LLM 竞技场</div>
        <div class="page-desc">提示工程实验 · 模型能力对比 · 学术专项测评</div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:16px;">
      <!-- Prompt editor -->
      <div class="card">
        <div class="card-title">Prompt 编辑器</div>

        <!-- Example buttons -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
          ${EXAMPLES.map((_, i) => `
            <button class="btn btn-ghost btn-sm"
              onclick="window.__llmarena?.loadExample(${i})">例 ${i + 1}</button>`).join('')}
        </div>

        <!-- Technique buttons -->
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-faint);margin-bottom:6px;letter-spacing:0.1em;">PROMPT 技巧</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
          ${Object.entries(TECHNIQUES).map(([k, v]) => `
            <button class="btn btn-ghost btn-sm"
              onclick="window.__llmarena?.loadTechnique('${k}')">${v.label}</button>`).join('')}
        </div>

        <textarea id="prompt-input" style="height:130px;margin-bottom:10px;"
          placeholder="输入你的学术问题或 Prompt…"
          oninput="window.__llmarena?.updateCount()"></textarea>

        <div style="display:flex;align-items:center;gap:10px;">
          <button class="btn btn-primary" onclick="window.__llmarena?.runArena()">▶ 并发对比生成</button>
          <button class="btn btn-ghost"   onclick="window.__llmarena?.clearAll()">✕ 清空</button>
          <span id="token-count"
            style="font-family:var(--font-mono);font-size:10px;color:var(--text-faint);margin-left:auto;">
            Token: ~0
          </span>
        </div>
      </div>

      <!-- Evaluation dimensions -->
      <div class="card">
        <div class="card-title cyan">学术评测维度</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">专为学术场景设计的四维评测体系：</div>
        ${[
          { icon: '⚡', label: '响应速度',   desc: 'tokens/sec，影响实际使用体验', color: 'gold' },
          { icon: '🎯', label: '推理深度',   desc: '逻辑链完整性，1–10 分', color: 'cyan' },
          { icon: '∑',  label: '数学精确度', desc: '公式、推导的正确率', color: 'violet' },
          { icon: '📖', label: '学术规范度', desc: '术语使用、引用意识、概念准确性', color: 'gold' },
        ].map(d => `
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <span style="color:var(--${d.color});font-size:16px;flex-shrink:0;">${d.icon}</span>
            <div>
              <div style="font-size:13px;color:var(--text);">${d.label}</div>
              <div style="font-size:11px;color:var(--text-faint);">${d.desc}</div>
            </div>
          </div>`).join('')}
        <div style="margin-top:8px;padding-top:10px;border-top:1px solid var(--border);">
          <button class="btn btn-ghost btn-sm"
            onclick="window.__copilot?.askCopilot('对于学术研究场景，如何选择合适的 LLM？速度和深度如何权衡？')">
            🤖 如何选择 LLM？
          </button>
        </div>
      </div>
    </div>

    <!-- Dual model output -->
    <div style="display:flex;gap:16px;">
      <!-- Alpha model -->
      <div class="model-card">
        <div class="model-header">
          <div class="model-dot" style="background:var(--gold);box-shadow:0 0 6px rgba(212,168,83,0.5);"></div>
          <span class="model-name">Alpha 模型</span>
          <span class="model-size">7B · 快速</span>
          <span id="alpha-status" class="tag tag-gold" style="margin-left:auto;">就绪</span>
        </div>
        <div class="model-output" id="model-alpha">等待输入 Prompt…</div>
        <div class="metric-row">
          <div class="metric-item">
            <div class="metric-val" id="alpha-speed" style="color:var(--gold);">—</div>
            <div class="metric-key">速度</div>
          </div>
          <div class="metric-item">
            <div class="metric-val" id="alpha-depth" style="color:var(--cyan);">—</div>
            <div class="metric-key">深度</div>
          </div>
          <div class="metric-item">
            <div class="metric-val" id="alpha-math" style="color:var(--violet);">—</div>
            <div class="metric-key">数学</div>
          </div>
          <div class="metric-item">
            <div class="metric-val" id="alpha-academic" style="color:var(--rose);">—</div>
            <div class="metric-key">学术</div>
          </div>
        </div>
      </div>

      <!-- Omega model -->
      <div class="model-card">
        <div class="model-header">
          <div class="model-dot" style="background:var(--cyan);box-shadow:0 0 6px rgba(0,212,170,0.5);"></div>
          <span class="model-name">Omega 模型</span>
          <span class="model-size">70B · 深度</span>
          <span id="omega-status" class="tag tag-cyan" style="margin-left:auto;">就绪</span>
        </div>
        <div class="model-output" id="model-omega">等待输入 Prompt…</div>
        <div class="metric-row">
          <div class="metric-item">
            <div class="metric-val" id="omega-speed" style="color:var(--gold);">—</div>
            <div class="metric-key">速度</div>
          </div>
          <div class="metric-item">
            <div class="metric-val" id="omega-depth" style="color:var(--cyan);">—</div>
            <div class="metric-key">深度</div>
          </div>
          <div class="metric-item">
            <div class="metric-val" id="omega-math" style="color:var(--violet);">—</div>
            <div class="metric-key">数学</div>
          </div>
          <div class="metric-item">
            <div class="metric-val" id="omega-academic" style="color:var(--rose);">—</div>
            <div class="metric-key">学术</div>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── Actions ── */
function loadExample(i) {
  const el = document.getElementById('prompt-input');
  if (el) { el.value = EXAMPLES[i]; updateCount(); }
}

function loadTechnique(key) {
  const t  = TECHNIQUES[key];
  const el = document.getElementById('prompt-input');
  if (el && t) { el.value = t.prompt; updateCount(); }
  window.__copilot?.addMessage('sys',
    `已加载 <strong>${t.label}</strong> 模板。点击「并发对比生成」查看效果差异。`);
}

function updateCount() {
  const val = document.getElementById('prompt-input')?.value ?? '';
  const el  = document.getElementById('token-count');
  if (el) el.textContent = `Token: ~${estimateTokens(val)}`;
}

function runArena() {
  const prompt = document.getElementById('prompt-input')?.value.trim();
  if (!prompt) { alert('请输入 Prompt'); return; }

  // Pick response template
  const key  = (prompt.includes('Transformer') || prompt.includes('注意力')) ? 'transformer' : 'default';
  const data = MOCK_RESPONSES[key];

  // Set loading states
  _setLoading();

  setTimeout(() => {
    _setResult('alpha', data.alpha);
  }, 1200 + Math.random() * 400);

  setTimeout(() => {
    _setResult('omega', data.omega);
    // AI commentary after both finish
    window.__copilot?.askCopilot(
      `在以下场景中，轻量模型（7B）和大模型（70B）的回答质量差异是什么？什么时候应该选择哪个？\n场景：${prompt.slice(0, 100)}`,
      'LLM 竞技场'
    );
  }, 3000 + Math.random() * 500);
}

function _setLoading() {
  ['alpha', 'omega'].forEach(m => {
    document.getElementById(`model-${m}`).innerHTML = `<span class="spinner"></span>生成中…`;
    document.getElementById(`${m}-status`).innerHTML = `<span class="tag tag-${m === 'alpha' ? 'gold' : 'cyan'}">生成中</span>`;
    ['speed', 'depth', 'math', 'academic'].forEach(k =>
      document.getElementById(`${m}-${k}`).textContent = '…'
    );
  });
}

function _setResult(model, d) {
  document.getElementById(`model-${model}`).innerHTML    = d.out;
  document.getElementById(`${model}-status`).innerHTML   =
    `<span class="tag tag-${model === 'alpha' ? 'gold' : 'cyan'}">完成</span>`;
  document.getElementById(`${model}-speed`).textContent   = d.speed;
  document.getElementById(`${model}-depth`).textContent   = d.depth;
  document.getElementById(`${model}-math`).textContent    = d.math;
  document.getElementById(`${model}-academic`).textContent = d.academic;
}

function clearAll() {
  const el = document.getElementById('prompt-input');
  if (el) { el.value = ''; updateCount(); }
  ['alpha', 'omega'].forEach(m => {
    document.getElementById(`model-${m}`).textContent = '等待输入 Prompt…';
    document.getElementById(`${m}-status`).innerHTML =
      `<span class="tag tag-${m === 'alpha' ? 'gold' : 'cyan'}">就绪</span>`;
    ['speed', 'depth', 'math', 'academic'].forEach(k =>
      document.getElementById(`${m}-${k}`).textContent = '—'
    );
  });
}

window.__llmarena = { init, loadExample, loadTechnique, updateCount, runArena, clearAll };
