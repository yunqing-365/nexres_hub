/* ═══════════════════════════════════════════════════════
   data/projects.js — Project Database
   Persisted to localStorage.
   Export: PROJECTS, addProject(), updateProject(),
           deleteProject(), linkPaper(), linkExp()
═══════════════════════════════════════════════════════ */

import { storage, KEYS } from '../utils/storage.js';

const DEFAULTS = [
  {
    id: 1,
    name: '气候政策对企业 ESG 评分的因果效应',
    desc: '利用双重差分法识别碳排放政策对上市公司 ESG 评分的净效应',
    tags: ['DID / PSM', '定量'],
    status: 'active',
    createdAt: '2024-10-01',
    paperIds: [1, 2, 4],
    expIds: [1, 2, 3],
    draftKey: 'empirical',
    progress: 65,
  },
  {
    id: 2,
    name: 'ResNet-50 卫星图像贫困指数预测',
    desc: '使用卷积神经网络从卫星图像中提取特征，预测地区贫困指数',
    tags: ['Deep Learning', '计算'],
    status: 'active',
    createdAt: '2024-10-15',
    paperIds: [3, 5],
    expIds: [4, 5],
    draftKey: 'method',
    progress: 90,
  },
  {
    id: 3,
    name: '大模型在经济政策解读中的能力边界',
    desc: '评估 LLM 在理解和解读经济政策文本方面的能力与局限',
    tags: ['LLM Eval', '进行中'],
    status: 'active',
    createdAt: '2024-11-01',
    paperIds: [],
    expIds: [],
    draftKey: 'review',
    progress: 30,
  },
];

/* ── Load from storage, fall back to defaults ── */
export let PROJECTS = storage.get(KEYS.PROJECTS, DEFAULTS);
PROJECTS = PROJECTS.map(p => ({ ...p, id: Number(p.id) }));

let _nextId = PROJECTS.length > 0 ? Math.max(...PROJECTS.map(p => p.id)) + 1 : 1;

function _save() {
  storage.set(KEYS.PROJECTS, PROJECTS);
}

/**
 * 新增项目
 * @param {Object} entry - { name, desc, tags, status, draftKey, progress }
 */
export function addProject(entry) {
  const project = {
    desc: '',
    tags: [],
    status: 'active',
    createdAt: new Date().toISOString().slice(0, 10),
    paperIds: [],
    expIds: [],
    draftKey: 'empirical',
    progress: 0,
    ...entry,
    id: _nextId++,
  };
  PROJECTS.push(project);
  _save();
  return project;
}

/**
 * 更新项目字段
 * @param {number} id
 * @param {Object} patch
 */
export function updateProject(id, patch) {
  const idx = PROJECTS.findIndex(p => p.id === Number(id));
  if (idx === -1) return;
  PROJECTS[idx] = { ...PROJECTS[idx], ...patch };
  _save();
}

/**
 * 删除项目
 * @param {number} id
 */
export function deleteProject(id) {
  PROJECTS = PROJECTS.filter(p => p.id !== Number(id));
  _save();
}

/**
 * 关联文献到项目
 * @param {number} projectId
 * @param {number} paperId
 */
export function linkPaper(projectId, paperId) {
  const p = PROJECTS.find(p => p.id === Number(projectId));
  if (!p) return;
  if (!p.paperIds.includes(Number(paperId))) {
    p.paperIds.push(Number(paperId));
    _save();
  }
}

/**
 * 关联实验到项目
 * @param {number} projectId
 * @param {number} expId
 */
export function linkExp(projectId, expId) {
  const p = PROJECTS.find(p => p.id === Number(projectId));
  if (!p) return;
  if (!p.expIds.includes(Number(expId))) {
    p.expIds.push(Number(expId));
    _save();
  }
}
