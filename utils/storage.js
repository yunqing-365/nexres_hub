/* ═══════════════════════════════════════════════════════
   utils/storage.js — Local Persistence
   Thin wrapper around localStorage with JSON support.
   Keys are namespaced under 'nexres:'.
═══════════════════════════════════════════════════════ */

const NS = 'nexres:';

export const storage = {
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(NS + key);
  },

  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(NS))
      .forEach(k => localStorage.removeItem(k));
  },
};

/* Specific persisted keys */
export const KEYS = {
  EXPERIMENTS: 'experiments',
  PAPERS:      'papers',
  DRAFTS:      'drafts',
  SKILL_DATA:  'skillData',
  SETTINGS:    'settings',
  DATASETS:    'datasets',   // 新增：数据集管理
};
