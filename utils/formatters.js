/* ═══════════════════════════════════════════════════════
   utils/formatters.js — Text & Data Formatters
   Split out from storage.js (Bug Fix #1)
═══════════════════════════════════════════════════════ */

/** 将 AI Markdown 粗体语法转为 HTML <strong>，也处理换行符 */
export function mdToHtml(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

/** 生成 APA 7th 格式引用 */
export function toAPA({ authors, year, title, journal }) {
  return `${authors} (${year}). ${title}. <em>${journal}</em>.`;
}

/** 生成 BibTeX 条目 */
export function toBibTeX({ authors, year, title, journal }) {
  const key = authors.split(' ')[0].toLowerCase() + year;
  return `@article{${key},\n  author  = {${authors}},\n  title   = {${title}},\n  journal = {${journal}},\n  year    = {${year}}\n}`;
}

/** Token 数估算（中英文混合） */
export function estimateTokens(text) {
  return Math.ceil(text.length / 3.5);
}

/** 格式化日期 → 'YYYY-MM-DD' */
export function formatDate(dateStr) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

/** 截断长文本 */
export function truncate(text, maxLen = 60) {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}
