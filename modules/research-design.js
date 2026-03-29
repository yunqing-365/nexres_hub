/* ═══════════════════════════════════════════════════════
   modules/research-design.js — 研究设计助手
   Blocks: 问卷诊断 · 混合方法模板 · AI顾问 · 已保存方案
═══════════════════════════════════════════════════════ */

const CONTAINER  = 'module-resdesign';
const PLANS_KEY  = 'nexres:resplans';

// ── 问卷状态 ──
let _answers = {};   // { q1, q2, q3, q4, q5 }
let _step    = 1;
let _recs    = [];   // 推荐结果

// ── 问卷定义 ──
const QUESTIONS = [
  {
    id: 'q1', label: '研究问题类型',
    options: ['因果推断', '预测建模', '描述统计', '探索性研究'],
  },
  {
    id: 'q2', label: '数据类型',
    options: ['面板数据', '截面数据', '时间序列', '文本/图像', '混合'],
  },
  {
    id: 'q3', label: '处理变量能否随机分配',
    options: ['能（RCT）', '不能（准实验）', '不涉及'],
  },
  {
    id: 'q4', label: '样本量',
    options: ['< 100', '100-1000', '1000-10万', '> 10万'],
  },
  {
    id: 'q5', label: '研究目标',
    options: ['学术发表', '政策建议', '商业决策'],
  },
];

// ── 方法库 ──
const METHOD_DB = {
  DID: {
    name: '双重差分法 (DID)',
    reason: '面板数据 + 准实验设计的首选，可控制不可观测的个体固定效应。',
    limit: '需要平行趋势假设，处理效应异质性时需谨慎。',
    refs: 'Card & Krueger (1994), AER; Callaway & Sant\'Anna (2021), JoE',
  },
  IV: {
    name: '工具变量法 (IV/2SLS)',
    reason: '存在内生性问题时的经典解决方案，适用于截面和面板数据。',
    limit: '好的工具变量难以找到，弱工具变量会导致估计偏误。',
    refs: 'Angrist & Pischke (2009), MHE; Stock & Yogo (2005)',
  },
  SCM: {
    name: '合成控制法 (SCM)',
    reason: '处理单一或少数处理单元的因果推断，构造反事实对照组。',
    limit: '样本量要求较高，外推性有限。',
    refs: 'Abadie et al. (2010), JASA; Abadie (2021), JEL',
  },
  RDD: {
    name: '断点回归设计 (RDD)',
    reason: '利用政策阈值产生的准随机分配，内部效度高。',
    limit: '仅估计阈值附近的局部平均处理效应，外部效度有限。',
    refs: 'Imbens & Lemieux (2008), JoE; Calonico et al. (2014), Econometrica',
  },
  PSM: {
    name: '倾向得分匹配 (PSM)',
    reason: '通过匹配可观测协变量减少选择偏误，适合截面数据。',
    limit: '无法控制不可观测混淆变量，依赖强可忽略性假设。',
    refs: 'Rosenbaum & Rubin (1983), Biometrika; Caliendo & Kopeinig (2008)',
  },
  Transformer: {
    name: 'Transformer / BERT',
    reason: '文本和序列数据的当前最优架构，预训练模型迁移效果显著。',
    limit: '计算资源需求大，可解释性较弱。',
    refs: 'Vaswani et al. (2017), NeurIPS; Devlin et al. (2019), NAACL',
  },
  CNN: {
    name: '卷积神经网络 (CNN)',
    reason: '图像和局部特征提取的标准方法，参数共享效率高。',
    limit: '对长程依赖建模能力弱于Transformer。',
    refs: 'LeCun et al. (1998); He et al. (2016), CVPR (ResNet)',
  },
  BERT: {
    name: 'BERT 微调',
    reason: '中文/英文文本分类、情感分析的强基线，预训练知识丰富。',
    limit: '推理速度慢，部署成本高，需要标注数据微调。',
    refs: 'Devlin et al. (2019), NAACL; Cui et al. (2021), TASLP (MacBERT)',
  },
  RF: {
    name: '随机森林 / GBDT',
    reason: '表格数据预测的稳健基线，自动处理非线性和交互效应。',
    limit: '可解释性不如线性模型，超参数调优耗时。',
    refs: 'Breiman (2001), ML; Friedman (2001), AoS',
  },
  XGBoost: {
    name: 'XGBoost / LightGBM',
    reason: '结构化数据竞赛和工业预测的首选，速度快、精度高。',
    limit: '对稀疏高维数据效果不稳定，需要特征工程。',
    refs: 'Chen & Guestrin (2016), KDD; Ke et al. (2017), NeurIPS',
  },
  LR: {
    name: '线性/逻辑回归',
    reason: '可解释性强，适合小样本和需要系数解读的场景。',
    limit: '无法自动捕捉非线性关系，对异常值敏感。',
    refs: 'Hastie et al. (2009), ESL; Wooldridge (2010), Econometric Analysis',
  },
  Mixed: {
    name: '混合方法设计',
    reason: '定量+定性互补，适合探索复杂社会现象的机制和意义。',
    limit: '研究周期长，需要跨范式方法论训练。',
    refs: 'Creswell & Plano Clark (2018); Tashakkori & Teddlie (2010)',
  },
  Desc: {
    name: '描述性统计分析',
    reason: '系统呈现数据分布、趋势和结构，是所有实证研究的基础。',
    limit: '不能建立因果关系，结论外推受限。',
    refs: 'Tukey (1977), EDA; Agresti & Finlay (2009)',
  },
  TS: {
    name: '时间序列分析 (ARIMA/VAR)',
    reason: '专为时序数据设计，可建模自相关、季节性和动态关系。',
    limit: '平稳性假设严格，长期预测误差累积。',
    refs: 'Box & Jenkins (1976); Hamilton (1994), Time Series Analysis',
  },
  General: {
    name: '文献综述 + 理论框架构建',
    reason: '探索性研究阶段的核心工作，为后续实证奠定概念基础。',
    limit: '主观性较强，需要系统化文献检索策略。',
    refs: 'Webster & Watson (2002), MISQ; Tranfield et al. (2003), BJOM',
  },
};

// ── 推荐逻辑 ──
function _recommend(a) {
  const { q1, q2, q3 } = a;
  if (q1 === '因果推断') {
    if (q2 === '面板数据' && q3 === '不能（准实验）') return ['DID', 'IV', 'SCM'];
    if (q2 === '截面数据' && q3 === '不能（准实验）') return ['RDD', 'IV', 'PSM'];
    if (q3 === '能（RCT）') return ['DID', 'IV', 'LR'];
    if (q2 === '时间序列') return ['TS', 'IV', 'DID'];
    return ['DID', 'IV', 'PSM'];
  }
  if (q1 === '预测建模') {
    if (q2 === '文本/图像') return ['Transformer', 'CNN', 'BERT'];
    if (q2 === '时间序列') return ['TS', 'RF', 'XGBoost'];
    return ['RF', 'XGBoost', 'LR'];
  }
  if (q1 === '描述统计') {
    if (q2 === '时间序列') return ['TS', 'Desc', 'LR'];
    return ['Desc', 'LR', 'RF'];
  }
  if (q1 === '探索性研究') {
    if (q2 === '混合') return ['Mixed', 'General', 'Desc'];
    return ['General', 'Mixed', 'Desc'];
  }
  return ['General', 'Desc', 'Mixed'];
}

// ══════════════════════════════════════════════════════
//  init
// ══════════════════════════════════════════════════════
export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">研究设计助手</div>
        <div class="page-desc">问卷诊断 · 混合方法模板 · AI 顾问 · 方案管理</div>
      </div>
    </div>

    <!-- Block 1: 研究问题诊断 -->
    <div class="card" id="rd-quiz-card">
      <div class="card-title">研究问题诊断</div>
      <div id="rd-quiz-body"></div>
    </div>

    <!-- Block 2: 混合方法设计模板 -->
    <div class="card">
      <div class="card-title cyan">混合方法设计模板</div>
      <div id="rd-templates"></div>
    </div>

    <!-- Block 3: AI 研究顾问 -->
    <div class="card">
      <div class="card-title violet">AI 研究顾问</div>
      <textarea id="rd-ai-input" placeholder="描述你的研究问题，例如：我想研究碳排放交易政策对企业创新的影响，数据是2010-2022年A股上市公司面板数据……"
        style="width:100%;box-sizing:border-box;min-height:100px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;padding:10px 12px;resize:vertical;outline:none;transition:border-color var(--transition-fast);"
        onfocus="this.style.borderColor='var(--violet)'" onblur="this.style.borderColor='var(--border)'"></textarea>
      <div style="margin-top:10px;">
        <button class="btn btn-violet" onclick="window.__resdesign?.askAI()">🤖 获取方法论建议</button>
      </div>
    </div>

    <!-- Block 4: 已保存的研究方案 -->
    <div class="card">
      <div class="card-title rose">已保存的研究方案</div>
      <div id="rd-plans-list"></div>
      <div style="margin-top:12px;">
        <button class="btn btn-ghost" onclick="window.__resdesign?.savePlan()">💾 保存当前方案</button>
      </div>
    </div>`;

  _renderQuiz();
  _renderTemplates();
  _renderPlans();
}

// ══════════════════════════════════════════════════════
//  Block 1 — 问卷
// ══════════════════════════════════════════════════════
function _renderQuiz() {
  const body = document.getElementById('rd-quiz-body');
  if (!body) return;

  if (_step > QUESTIONS.length) {
    _renderResults(body);
    return;
  }

  const q = QUESTIONS[_step - 1];
  body.innerHTML = `
    <div style="margin-bottom:8px;">
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-faint);">步骤 ${_step} / ${QUESTIONS.length}</span>
      <div style="height:3px;background:var(--border);border-radius:2px;margin-top:6px;margin-bottom:14px;">
        <div style="height:100%;width:${(_step-1)/QUESTIONS.length*100}%;background:var(--gold);border-radius:2px;transition:width 0.3s;"></div>
      </div>
    </div>
    <div style="font-size:14px;color:var(--text);margin-bottom:14px;font-family:var(--font-body);">${q.label}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${q.options.map(opt => `
        <button class="btn btn-ghost" style="font-family:var(--font-body);font-size:12px;"
          onclick="window.__resdesign?.answer('${q.id}','${opt}')">${opt}</button>
      `).join('')}
    </div>
    ${_step > 1 ? `<div style="margin-top:14px;">
      <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px;" onclick="window.__resdesign?.back()">← 上一步</button>
    </div>` : ''}`;
}

function answer(qid, val) {
  _answers[qid] = val;
  _step++;
  if (_step > QUESTIONS.length) {
    _recs = _recommend(_answers);
  }
  _renderQuiz();
}

function back() {
  if (_step > 1) { _step--; _renderQuiz(); }
}

function resetQuiz() {
  _answers = {}; _step = 1; _recs = [];
  _renderQuiz();
}

function _renderResults(body) {
  const methods = _recs.map(id => METHOD_DB[id]).filter(Boolean);
  const colors  = ['var(--gold)', 'var(--cyan)', 'var(--violet)'];
  const labels  = ['首选方法', '备选方法', '补充方法'];

  body.innerHTML = `
    <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div style="font-size:13px;color:var(--text-muted);">
        基于你的回答，推荐以下 <span style="color:var(--gold);font-weight:500;">Top 3</span> 研究方法：
      </div>
      <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px;" onclick="window.__resdesign?.resetQuiz()">重新诊断</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${methods.map((m, i) => `
        <div style="border:1px solid ${colors[i]}33;border-left:3px solid ${colors[i]};border-radius:var(--radius-sm);padding:12px 14px;background:${colors[i]}08;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:${colors[i]};border:1px solid ${colors[i]}55;padding:2px 7px;border-radius:3px;">${labels[i]}</span>
            <span style="font-size:13px;color:var(--text);font-family:var(--font-body);">${m.name}</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">✦ ${m.reason}</div>
          <div style="font-size:11px;color:var(--rose);margin-bottom:4px;">⚠ ${m.limit}</div>
          <div style="font-size:10px;color:var(--text-faint);font-family:var(--font-mono);">📚 ${m.refs}</div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:var(--surface);border-radius:var(--radius-sm);font-size:11px;color:var(--text-faint);">
      <span style="color:var(--text-muted);">你的选择：</span>
      ${QUESTIONS.map(q => `<span style="margin-right:10px;">${q.label}：<span style="color:var(--cyan);">${_answers[q.id] ?? '-'}</span></span>`).join('')}
    </div>`;
}

// ══════════════════════════════════════════════════════
//  Block 2 — 混合方法模板
// ══════════════════════════════════════════════════════
const TEMPLATES = [
  {
    id: 'seq-exp',
    name: '顺序解释型',
    color: 'var(--gold)',
    tagline: '定量先 → 定性解释，适合"为什么"问题',
    scene: '已有大样本量化结果，需要深入理解机制和情境意义。',
    pros: '量化结论有统计支撑；定性阶段聚焦于解释异常或意外发现。',
    cons: '研究周期长；两阶段衔接需要精心设计。',
    flow: [
      { label: '阶段一', desc: '定量数据收集与分析', color: 'var(--gold)' },
      { label: '→', desc: '', color: '' },
      { label: '衔接', desc: '识别需解释的结果', color: 'var(--border-bright)' },
      { label: '→', desc: '', color: '' },
      { label: '阶段二', desc: '定性访谈/案例分析', color: 'var(--cyan)' },
      { label: '→', desc: '', color: '' },
      { label: '整合', desc: '综合解释与报告', color: 'var(--violet)' },
    ],
  },
  {
    id: 'seq-exp2',
    name: '顺序探索型',
    color: 'var(--cyan)',
    tagline: '定性先 → 定量验证，适合新兴领域',
    scene: '研究领域较新，缺乏成熟量表或理论框架，需先探索再验证。',
    pros: '定性阶段生成扎根于数据的理论；定量阶段检验推广性。',
    cons: '定性阶段耗时；量表开发需要额外验证步骤。',
    flow: [
      { label: '阶段一', desc: '定性探索（访谈/观察）', color: 'var(--cyan)' },
      { label: '→', desc: '', color: '' },
      { label: '衔接', desc: '构建量表/假设', color: 'var(--border-bright)' },
      { label: '→', desc: '', color: '' },
      { label: '阶段二', desc: '定量调查/实验', color: 'var(--gold)' },
      { label: '→', desc: '', color: '' },
      { label: '整合', desc: '理论建构与验证', color: 'var(--violet)' },
    ],
  },
  {
    id: 'parallel',
    name: '并行三角型',
    color: 'var(--violet)',
    tagline: '同时进行互相印证，适合复杂社会现象',
    scene: '研究问题复杂，需要从多角度同时获取证据，时间资源充足。',
    pros: '两类数据互相印证，结论更稳健；节省顺序设计的等待时间。',
    cons: '协调两条研究线索难度大；整合阶段需要处理矛盾结果。',
    flow: [
      { label: '定量线', desc: '问卷/实验/二手数据', color: 'var(--gold)' },
      { label: '‖', desc: '同步进行', color: 'var(--border-bright)' },
      { label: '定性线', desc: '访谈/民族志/文档', color: 'var(--cyan)' },
      { label: '→', desc: '', color: '' },
      { label: '整合', desc: '三角验证与综合', color: 'var(--violet)' },
    ],
  },
];

function _renderTemplates() {
  const el = document.getElementById('rd-templates');
  if (!el) return;
  el.innerHTML = TEMPLATES.map(t => `
    <div style="border:1px solid ${t.color}33;border-radius:var(--radius-sm);margin-bottom:10px;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;cursor:pointer;background:${t.color}08;"
        onclick="window.__resdesign?.toggleTemplate('${t.id}')">
        <div>
          <span style="font-size:13px;color:${t.color};font-family:var(--font-body);">${t.name}</span>
          <span style="font-size:11px;color:var(--text-faint);margin-left:10px;">${t.tagline}</span>
        </div>
        <span id="rd-tpl-arrow-${t.id}" style="color:var(--text-faint);font-size:12px;transition:transform 0.2s;">▼</span>
      </div>
      <div id="rd-tpl-body-${t.id}" style="display:none;padding:14px;border-top:1px solid ${t.color}22;">
        <!-- 流程图 -->
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:14px;">
          ${t.flow.map(f => f.label === '→' || f.label === '‖'
            ? `<span style="color:var(--text-faint);font-size:14px;">${f.label}</span>`
            : `<div style="border:1px solid ${f.color};border-radius:var(--radius-xs);padding:5px 10px;text-align:center;min-width:80px;">
                <div style="font-size:10px;color:${f.color};font-family:var(--font-mono);">${f.label}</div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${f.desc}</div>
               </div>`
          ).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;">
          <div>
            <div style="color:var(--text-muted);margin-bottom:4px;font-family:var(--font-mono);font-size:10px;">适用场景</div>
            <div style="color:var(--text-faint);">${t.scene}</div>
          </div>
          <div>
            <div style="color:var(--emerald);margin-bottom:4px;font-family:var(--font-mono);font-size:10px;">优点</div>
            <div style="color:var(--text-faint);margin-bottom:8px;">${t.pros}</div>
            <div style="color:var(--rose);margin-bottom:4px;font-family:var(--font-mono);font-size:10px;">局限</div>
            <div style="color:var(--text-faint);">${t.cons}</div>
          </div>
        </div>
      </div>
    </div>`).join('');
}

function toggleTemplate(id) {
  const body  = document.getElementById(`rd-tpl-body-${id}`);
  const arrow = document.getElementById(`rd-tpl-arrow-${id}`);
  if (!body) return;
  const open = body.style.display === 'none';
  body.style.display  = open ? 'block' : 'none';
  if (arrow) arrow.style.transform = open ? 'rotate(180deg)' : '';
}

// ══════════════════════════════════════════════════════
//  Block 3 — AI 顾问
// ══════════════════════════════════════════════════════
function askAI() {
  const input = document.getElementById('rd-ai-input');
  const text  = input?.value?.trim();
  if (!text) { input?.focus(); return; }

  const prompt = `我的研究问题是：${text}
请给出完整的方法论建议，包括：
1. 推荐的主要研究方法及理由
2. 需要满足的关键假设
3. 潜在的方法论挑战和应对策略
4. 3-5篇最相关的参考文献
5. 如果要结合定量和定性方法，如何设计？`;

  window.__copilot?.askCopilot(prompt, '研究设计助手', true);
}

// ══════════════════════════════════════════════════════
//  Block 4 — 已保存方案
// ══════════════════════════════════════════════════════
function _loadPlans() {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY)) ?? []; }
  catch { return []; }
}

function _savePlans(plans) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

function _renderPlans() {
  const el    = document.getElementById('rd-plans-list');
  if (!el) return;
  const plans = _loadPlans();
  if (!plans.length) {
    el.innerHTML = `<div style="color:var(--text-faint);font-size:12px;padding:8px 0;">暂无保存的方案。完成问卷诊断后可保存。</div>`;
    return;
  }
  el.innerHTML = plans.map((p, i) => `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:8px;gap:10px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;color:var(--text);margin-bottom:3px;">${p.title}</div>
        <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">${p.createdAt}</div>
        <div style="font-size:11px;color:var(--cyan);">${p.summary}</div>
      </div>
      <button class="btn btn-ghost" style="font-size:10px;padding:4px 10px;flex-shrink:0;"
        onclick="window.__resdesign?.deletePlan(${i})">删除</button>
    </div>`).join('');
}

function savePlan() {
  if (_step <= QUESTIONS.length) {
    alert('请先完成问卷诊断再保存方案。');
    return;
  }
  const title = prompt('为这个方案起个名字：', `研究方案 ${new Date().toLocaleDateString('zh-CN')}`);
  if (!title) return;

  const summary = _recs.map(id => METHOD_DB[id]?.name ?? id).join(' · ');
  const plan = {
    title,
    createdAt: new Date().toLocaleString('zh-CN'),
    answers: { ..._answers },
    recs: [..._recs],
    summary,
  };
  const plans = _loadPlans();
  plans.unshift(plan);
  _savePlans(plans);
  _renderPlans();
}

function deletePlan(index) {
  const plans = _loadPlans();
  plans.splice(index, 1);
  _savePlans(plans);
  _renderPlans();
}

// ── 全局暴露 ──
window.__resdesign = { init, answer, back, resetQuiz, toggleTemplate, askAI, savePlan, deletePlan };
