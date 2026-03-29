/* ═══════════════════════════════════════════════════════
   data/papers.js — Literature Database
   Persisted to localStorage. Falls back to built-in defaults.
   Export: PAPERS, getPaperById(), filterPapers(),
           addPaper(), updatePaper(), deletePaper()
═══════════════════════════════════════════════════════ */

import { storage, KEYS } from '../utils/storage.js';

const DEFAULTS = [
  {
    id: 1,
    title: "Mostly Harmless Econometrics: An Empiricist's Companion",
    authors: 'Angrist & Pischke',
    year: 2009,
    journal: 'Princeton University Press',
    doi: '',
    tags: ['计量经济', '工具书', '因果推断'],
    type: 'econometric',
    score: 9.8,
    abstract: '经典计量经济学教材，系统介绍 IV、DID、RDD 等识别策略。',
    notes: '',
    citedBy: 45000,
  },
  {
    id: 2,
    title: 'Identification and Estimation of Treatment Effects with a Regression-Discontinuity Design',
    authors: 'Imbens & Lemieux',
    year: 2008,
    journal: 'Journal of Econometrics',
    doi: '10.1016/j.jeconom.2007.05.001',
    tags: ['RDD', '因果推断', '识别策略'],
    type: 'causal',
    score: 9.5,
    abstract: '断点回归设计的权威综述，提供估计和推断的实用指南。',
    notes: '',
    citedBy: 12000,
  },
  {
    id: 3,
    title: 'Attention Is All You Need',
    authors: 'Vaswani et al.',
    year: 2017,
    journal: 'NeurIPS',
    doi: '10.48550/arXiv.1706.03762',
    tags: ['Transformer', 'NLP', 'Deep Learning'],
    type: 'ml',
    score: 9.9,
    abstract: '提出 Transformer 架构，完全依赖自注意力机制，舍弃循环和卷积。',
    notes: '',
    citedBy: 80000,
  },
  {
    id: 4,
    title: 'Double/Debiased Machine Learning for Treatment and Structural Parameters',
    authors: 'Chernozhukov et al.',
    year: 2018,
    journal: 'Econometrics Journal',
    doi: '10.1111/ectj.12097',
    tags: ['DML', '因果推断', '机器学习'],
    type: 'causal',
    score: 9.2,
    abstract: '结合机器学习与因果推断，提出双重去偏机器学习估计量。',
    notes: '',
    citedBy: 5000,
  },
  {
    id: 5,
    title: 'Predicting Poverty and Wealth from Mobile Phone Metadata',
    authors: 'Blumenstock et al.',
    year: 2015,
    journal: 'Science',
    doi: '10.1126/science.aac4420',
    tags: ['计算社科', '贫困预测', 'ML'],
    type: 'ml',
    score: 8.7,
    abstract: '利用手机通话数据预测非洲国家财富分布，示范计算社会科学方法。',
    notes: '',
    citedBy: 2100,
  },
  {
    id: 6,
    title: 'The Design of Experiments',
    authors: 'Fisher',
    year: 1935,
    journal: 'Oliver & Boyd',
    doi: '',
    tags: ['RCT', '经典', '实验设计'],
    type: 'econometric',
    score: 9.0,
    abstract: '随机实验设计的奠基著作，确立现代实验统计学框架。',
    notes: '',
    citedBy: 30000,
  },
  {
    id: 7,
    title: 'Synthetic Control Methods for Comparative Case Studies',
    authors: 'Abadie, Diamond, & Hainmueller',
    year: 2010,
    journal: 'Journal of the American Statistical Association',
    doi: '10.1198/jasa.2009.ap08746',
    tags: ['合成控制法', '因果推断', '政策评估'],
    type: 'econometric',
    score: 9.6,
    abstract: '提出合成控制法，通过对对照组进行加权拟合处理组的干预前特征，为单一干预对象的政策评估提供了严格的统计推断框架。',
    notes: '加州控烟法案的经典实证。',
    citedBy: 9500,
  },
  {
    id: 8,
    title: 'Building Theories from Case Study Research',
    authors: 'Kathleen M. Eisenhardt',
    year: 1989,
    journal: 'Academy of Management Review',
    doi: '10.5465/amr.1989.4308385',
    tags: ['案例研究', '质性方法', '理论构建'],
    type: 'qual',
    score: 9.7,
    abstract: '系统性地提出了从案例研究中构建理论的路线图（Roadmap），包括案例选择、工具设计、数据收集、跨案例分析和文献对比。',
    notes: '经管领域定性研究的必读文献。',
    citedBy: 68000,
  },
];

/* ── Load from storage, fall back to defaults ── */
export let PAPERS = storage.get(KEYS.PAPERS, DEFAULTS);

/* ensure ids are numbers after JSON round-trip */
PAPERS = PAPERS.map(p => ({ ...p, id: Number(p.id) }));

let _nextId = PAPERS.length > 0 ? Math.max(...PAPERS.map(p => p.id)) + 1 : 1;

function _save() {
  storage.set(KEYS.PAPERS, PAPERS);
}

/** 根据 id 获取单篇论文 */
export function getPaperById(id) {
  return PAPERS.find(p => p.id === Number(id)) ?? null;
}

/**
 * 多维过滤
 * @param {string} query  - 搜索关键词（标题/作者/标签）
 * @param {string} type   - 论文类型，'all' 不过滤
 * @param {number|null} year - 年份过滤，null 不过滤
 */
export function filterPapers(query = '', type = 'all', year = null) {
  const q = query.toLowerCase();
  return PAPERS.filter(p => {
    const matchQ = !q
      || p.title.toLowerCase().includes(q)
      || p.authors.toLowerCase().includes(q)
      || p.tags.some(t => t.toLowerCase().includes(q));
    const matchT = type === 'all' || p.type === type;
    const matchY = !year || p.year === year;
    return matchQ && matchT && matchY;
  });
}

/**
 * 新增文献，自动分配 id，持久化到 localStorage
 * @param {Object} entry
 * @returns {Object} 新增的文献对象
 */
export function addPaper(entry) {
  const paper = {
    doi: '',
    tags: [],
    type: 'causal',
    score: 8.0,
    abstract: '',
    notes: '',
    citedBy: 0,
    ...entry,
    id: _nextId++,
    year: Number(entry.year) || new Date().getFullYear(),
  };
  PAPERS.push(paper);
  _save();
  return paper;
}

/**
 * 更新文献字段
 * @param {number} id
 * @param {Object} patch
 */
export function updatePaper(id, patch) {
  const idx = PAPERS.findIndex(p => p.id === Number(id));
  if (idx === -1) return;
  PAPERS[idx] = { ...PAPERS[idx], ...patch };
  _save();
}

/**
 * 删除文献
 * @param {number} id
 */
export function deletePaper(id) {
  PAPERS = PAPERS.filter(p => p.id !== Number(id));
  _save();
}
