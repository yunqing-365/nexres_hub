/* ═══════════════════════════════════════════════════════
   components/card.js — Card Builder Helper
   Factory functions for generating card HTML strings.
   Used by modules to avoid duplicating markup.
═══════════════════════════════════════════════════════ */

/**
 * 生成标准 .card HTML 字符串
 * @param {Object} opts
 * @param {string}  opts.title        - 卡片标题
 * @param {'gold'|'cyan'|'violet'|'rose'} [opts.titleColor=''] - 标题色
 * @param {string}  opts.content      - 内部 HTML
 * @param {string}  [opts.id]         - 卡片 id
 * @param {string}  [opts.extraClass] - 额外 CSS class
 */
export function card({ title, titleColor = '', content, id = '', extraClass = '' }) {
  const idAttr    = id ? ` id="${id}"` : '';
  const classAttr = extraClass ? ` ${extraClass}` : '';
  const colorMod  = titleColor ? ` ${titleColor}` : '';
  return `
    <div class="card${classAttr}"${idAttr}>
      ${title ? `<div class="card-title${colorMod}">${title}</div>` : ''}
      ${content}
    </div>`;
}

/**
 * 生成统计数字卡片
 */
export function statCard({ num, label, change, accent = 'gold', onclick = '' }) {
  const cls = `${accent}-accent`;
  const direction = change?.startsWith('+') || change?.startsWith('↑') ? 'up' : 'down';
  return `
    <div class="stat-card ${cls}" ${onclick ? `onclick="${onclick}"` : ''}>
      <div class="stat-num ${accent}">${num}</div>
      <div class="stat-label">${label}</div>
      ${change ? `<div class="stat-change ${direction}">${change}</div>` : ''}
    </div>`;
}

/**
 * 生成标签列表
 * @param {string[]} tags
 * @param {'gold'|'cyan'|'violet'|'rose'|'emerald'} color
 */
export function tagList(tags, color = 'cyan') {
  return tags.map(t => `<span class="tag tag-${color}">${t}</span>`).join('');
}

/**
 * 生成假设检验行
 */
export function assumptionRow({ icon, status, label, desc }) {
  return `
    <div class="assumption-check ${status}">
      <div class="check-icon">${icon}</div>
      <div class="check-text">
        <strong>${label}</strong>
        <div style="font-size:12px;color:var(--text-faint);margin-top:3px;">${desc}</div>
      </div>
    </div>`;
}

/**
 * 生成空状态占位
 */
export function emptyState({ icon = '📭', title, subtitle = '' }) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-text">
        ${title}
        ${subtitle ? `<br><span style="color:var(--text-faint)">${subtitle}</span>` : ''}
      </div>
    </div>`;
}
