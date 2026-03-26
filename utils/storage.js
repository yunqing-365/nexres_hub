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
};


/* ═══════════════════════════════════════════════════════
   utils/formatters.js — Text & Data Formatters
═══════════════════════════════════════════════════════ */

/**
 * 将 AI Markdown 粗体语法转为 HTML <strong>
 * 也处理换行符
 */
export function mdToHtml(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

/**
 * 生成 APA 7th 格式引用
 * @param {Object} paper - { authors, year, title, journal }
 */
export function toAPA(paper) {
  const { authors, year, title, journal } = paper;
  return `${authors} (${year}). ${title}. ${journal}.`;
}

/**
 * 生成 BibTeX 条目
 */
export function toBibTeX(paper) {
  const key = paper.authors.split(' ')[0].toLowerCase() + paper.year;
  return `@article{${key},\n  author  = {${paper.authors}},\n  title   = {${paper.title}},\n  journal = {${paper.journal}},\n  year    = {${paper.year}}\n}`;
}

/**
 * Token 数估算（中英文混合）
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 3.5);
}

/**
 * 格式化日期 → 'YYYY-MM-DD'
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

/**
 * 截断长文本，尾部加省略号
 */
export function truncate(text, maxLen = 60) {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}
