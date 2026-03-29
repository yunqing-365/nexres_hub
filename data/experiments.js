/* ═══════════════════════════════════════════════════════
   data/experiments.js — Experiment Log Database
   Persisted to localStorage. Falls back to built-in defaults.
   Export: EXPERIMENTS, addExperiment(), markBest(), deleteExperiment()
═══════════════════════════════════════════════════════ */

import { storage, KEYS } from '../utils/storage.js';

const DEFAULTS = [
  {
    id: 1,
    name: 'DID 基准回归 v1',
    method: '双重差分 (DID)',
    project: 'ESG 因果效应',
    params: '平行趋势假设；行业 FE；样本 2010-2022',
    result: 'β = 0.031 (SE=0.014, p=0.028)',
    r2: 0.61,
    obs: 4280,
    status: '完成',
    best: false,
    createdAt: '2024-11-01',
    notes: '基准版本，尚未加年份 FE',
  },
  {
    id: 2,
    name: 'DID 基准回归 v2',
    method: '双重差分 (DID)',
    project: 'ESG 因果效应',
    params: '增加年份 FE；Winsorize 1%；样本 2010-2022',
    result: 'β = 0.043 (SE=0.011, p<0.001)',
    r2: 0.72,
    obs: 4280,
    status: '完成',
    best: true,
    createdAt: '2024-11-05',
    notes: '加入年份固定效应后系数显著增大，说明之前存在时间趋势偏误',
  },
  {
    id: 3,
    name: 'PSM 匹配估计',
    method: '倾向得分匹配 (PSM)',
    project: 'ESG 因果效应',
    params: '1:3 最近邻匹配；Caliper=0.001；Logit 估计倾向得分',
    result: 'ATT = 0.038 (SE=0.013)',
    r2: null,
    obs: 1820,
    status: '进行中',
    best: false,
    createdAt: '2024-11-10',
    notes: '平行趋势需进一步验证',
  },
  {
    id: 4,
    name: 'ResNet-50 Baseline',
    method: '卷积神经网络 (CNN)',
    project: '卫星图像贫困预测',
    params: 'lr=0.001; epochs=50; batch=32; 无数据增强',
    result: 'Test R²=0.71, MAE=0.18',
    r2: 0.71,
    obs: 12000,
    status: '完成',
    best: false,
    createdAt: '2024-10-20',
    notes: '未使用预训练权重，作为 baseline',
  },
  {
    id: 5,
    name: 'ResNet-50 + 数据增强',
    method: '卷积神经网络 (CNN)',
    project: '卫星图像贫困预测',
    params: 'lr=0.0005; epochs=80; 随机裁剪+翻转; 预训练权重',
    result: 'Test R²=0.84, MAE=0.11',
    r2: 0.84,
    obs: 12000,
    status: '完成',
    best: true,
    createdAt: '2024-10-28',
    notes: '预训练 + 数据增强效果显著，R² 从 0.71 提升至 0.84',
  },
];

/* ── Load from storage, fall back to defaults ── */
export let EXPERIMENTS = storage.get(KEYS.EXPERIMENTS, DEFAULTS);
EXPERIMENTS = EXPERIMENTS.map(e => ({ ...e, id: Number(e.id) }));

let _nextId = EXPERIMENTS.length > 0 ? Math.max(...EXPERIMENTS.map(e => e.id)) + 1 : 1;

function _save() {
  storage.set(KEYS.EXPERIMENTS, EXPERIMENTS);
}

/**
 * 新增实验记录，持久化到 localStorage
 * @param {Object} entry - { name, method, project, params, result, notes, ... }
 */
export function addExperiment(entry) {
  const newExp = {
    status: '完成',
    best: false,
    createdAt: new Date().toISOString().slice(0, 10),
    r2: null,
    obs: null,
    notes: '',
    code: '',
    runResult: '',
    ...entry,
    id: _nextId++,
  };
  EXPERIMENTS.push(newExp);
  _save();
  return newExp;
}

/** 将某条记录标为最优，同项目其他记录取消最优标记，持久化 */
export function markBest(id, project) {
  EXPERIMENTS = EXPERIMENTS.map(e => ({
    ...e,
    best: e.id === Number(id) ? true : (e.project === project ? false : e.best),
  }));
  _save();
}

/**
 * 删除实验记录
 * @param {number} id
 */
export function deleteExperiment(id) {
  EXPERIMENTS = EXPERIMENTS.filter(e => e.id !== Number(id));
  _save();
}
