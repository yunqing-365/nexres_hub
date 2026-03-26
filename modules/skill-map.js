/* ═══════════════════════════════════════════════════════
   modules/skill-map.js — Skill Map & Learning Path
   Features: radar chart · skill breakdown
             recommended next steps · AI learning plan
═══════════════════════════════════════════════════════ */

import { renderRadar } from '../utils/charts.js';
import { storage, KEYS } from '../utils/storage.js';

const CONTAINER = 'module-skillmap';

const DEFAULT_SKILLS = {
  causal:      { label: '因果推断',   score: 85, target: 95, color: 'gold' },
  econometrics:{ label: '计量经济学', score: 70, target: 90, color: 'cyan' },
  ml:          { label: '机器学习',   score: 60, target: 80, color: 'violet' },
  reading:     { label: '文献阅读',   score: 90, target: 95, color: 'cyan' },
  coding:      { label: '编程能力',   score: 55, target: 80, color: 'rose' },
  writing:     { label: '论文写作',   score: 75, target: 92, color: 'gold' },
  stats:       { label: '数理统计',   score: 80, target: 90, color: 'violet' },
};

const LEARNING_RESOURCES = {
  causal:       ['📖 Angrist & Pischke (2009) — Mostly Harmless', '🎓 MIT 14.32 (OCW)', '💻 R: did · fixest · rdrobust'],
  econometrics: ['📖 Greene (2018) — Econometric Analysis', '🎓 Coursera: Econometrics', '💻 Stata · R: ivreg2'],
  ml:           ['📖 Bishop — Pattern Recognition', '🎓 fast.ai Part 2', '💻 Python: PyTorch · sklearn'],
  reading:      ['🔑 每周精读 1 篇顶刊论文', '📝 Obsidian 知识库积累', '🔗 Connected Papers 追踪引用网络'],
  coding:       ['💻 Python for Data Analysis (Wes McKinney)', '🎓 Missing Semester (MIT)', '🔧 Git · Docker · Linux'],
  writing:      ['📖 精读 5 篇 AER/QJE 论文引言结构', '✍️ 每周写 500 字学术英文', '🤖 使用 AI Copilot 润色'],
  stats:        ['📖 Casella & Berger — Statistical Inference', '🎓 Stanford Stats110 (YouTube)', '💻 R: distributions · simulations'],
};

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  // Load saved skills or use defaults
  const skills = storage.get(KEYS.SKILL_DATA, DEFAULT_SKILLS);

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">技能图谱</div>
        <div class="page-desc">你的科研能力全景 · 个性化学习路径规划</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" onclick="window.__skillmap?.resetSkills()">↺ 重置</button>
        <button class="btn btn-primary btn-sm"
          onclick="window.__copilot?.askCopilot('根据我的技能图谱（因果推断85分、计量经济70分、机器学习60分、编程55分、论文写作75分），请为我制定一份4周的科研能力提升计划，每天2小时。', '技能图谱')">
          🤖 AI 制定提升计划
        </button>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:18px;">
      <!-- Radar chart -->
      <div class="card">
        <div class="card-title">技能雷达图</div>
        <div id="skill-radar" style="height:300px;"></div>
      </div>

      <!-- Score editor -->
      <div class="card">
        <div class="card-title cyan">自评分 & 目标</div>
        <div id="skill-sliders"></div>
        <button class="btn btn-cyan btn-sm" style="margin-top:12px;"
          onclick="window.__skillmap?.saveAndRedraw()">更新图谱</button>
      </div>
    </div>

    <!-- Learning path -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title violet">学习路径建议</div>
        <div id="learning-path"></div>
      </div>

      <!-- Milestone tracker -->
      <div class="card">
        <div class="card-title">📍 里程碑追踪</div>
        <div id="milestones"></div>
        <button class="btn btn-ghost btn-sm" style="margin-top:10px;"
          onclick="window.__copilot?.askCopilot('如何知道我的因果推断能力已经达到了发表顶级期刊的水平？有哪些具体的检测标准？')">
          🤖 如何评估自己的水平？
        </button>
      </div>
    </div>`;

  _renderRadar(skills);
  _renderSliders(skills);
  _renderLearningPath(skills);
  _renderMilestones();
}

/* ── Radar ── */
function _renderRadar(skills) {
  const keys   = Object.keys(skills);
  const theta  = keys.map(k => skills[k].label);
  const r      = keys.map(k => skills[k].score);
  renderRadar('skill-radar', r, theta, '#00d4aa');
}

/* ── Sliders ── */
function _renderSliders(skills) {
  const el = document.getElementById('skill-sliders');
  if (!el) return;
  el.innerHTML = Object.entries(skills).map(([k, s]) => `
    <div class="range-group">
      <div class="range-label">
        <span>${s.label}</span>
        <span>
          <span class="range-val" id="sv-${k}">${s.score}</span>
          <span style="color:var(--text-faint);"> / 目标 ${s.target}</span>
        </span>
      </div>
      <input type="range" id="sr-${k}" min="0" max="100" value="${s.score}"
        oninput="document.getElementById('sv-${k}').textContent=this.value">
      <div class="progress-bar" style="margin-top:4px;">
        <div class="progress-fill" style="width:${s.target}%;background:var(--border-bright);"></div>
      </div>
    </div>`).join('');
}

/* ── Learning path ── */
function _renderLearningPath(skills) {
  const el = document.getElementById('learning-path');
  if (!el) return;

  // Sort by gap (target - score), biggest gap first
  const sorted = Object.entries(skills)
    .map(([k, s]) => ({ k, ...s, gap: s.target - s.score }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 4);

  el.innerHTML = sorted.map(s => `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:13px;color:var(--text);">${s.label}</span>
        <span style="font-family:var(--font-mono);font-size:11px;color:var(--${s.color});">
          ${s.score} → ${s.target} <span style="color:var(--rose);">(差 ${s.gap})</span>
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${s.score}%;background:var(--${s.color});"></div>
      </div>
      <div style="margin-top:7px;font-size:11px;color:var(--text-faint);">
        ${(LEARNING_RESOURCES[s.k] ?? []).map(r => `<div style="margin-bottom:3px;">→ ${r}</div>`).join('')}
      </div>
    </div>`).join('');
}

/* ── Milestones ── */
function _renderMilestones() {
  const el = document.getElementById('milestones');
  if (!el) return;
  const items = [
    { done: true,  text: '读完 Angrist & Pischke《基本无害》全书' },
    { done: true,  text: '独立实现 DID + 事件研究图（R/Python）' },
    { done: false, text: '完成一篇 Working Paper 初稿' },
    { done: false, text: '在组会汇报并获得有效反馈' },
    { done: false, text: '投稿至会议或期刊' },
    { done: false, text: '完整复现一篇顶刊论文结果' },
  ];
  el.innerHTML = items.map((item, i) => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;
      border-bottom:1px solid rgba(255,255,255,0.03);cursor:pointer;"
      onclick="window.__skillmap?.toggleMilestone(${i}, this)">
      <span style="color:${item.done ? 'var(--cyan)' : 'var(--text-faint)'};font-size:14px;flex-shrink:0;">
        ${item.done ? '✓' : '○'}
      </span>
      <span style="font-size:13px;${item.done ? 'text-decoration:line-through;color:var(--text-faint);' : ''}"
        id="ms-text-${i}">${item.text}</span>
    </div>`).join('');
}

/* ── Actions ── */
function saveAndRedraw() {
  const skills = storage.get(KEYS.SKILL_DATA, DEFAULT_SKILLS);
  Object.keys(skills).forEach(k => {
    const sl = document.getElementById(`sr-${k}`);
    if (sl) skills[k].score = parseInt(sl.value);
  });
  storage.set(KEYS.SKILL_DATA, skills);
  _renderRadar(skills);
  _renderLearningPath(skills);
  window.__copilot?.addMessage('sys', '✓ 技能图谱已更新。');
}

function resetSkills() {
  storage.remove(KEYS.SKILL_DATA);
  init();
}

function toggleMilestone(i, el) {
  const text = el.querySelector(`#ms-text-${i}`);
  const icon = el.querySelector('span:first-child');
  const done = icon.textContent.trim() === '✓';
  icon.style.color = done ? 'var(--text-faint)' : 'var(--cyan)';
  icon.textContent = done ? '○' : '✓';
  text.style.textDecoration = done ? 'none' : 'line-through';
  text.style.color = done ? '' : 'var(--text-faint)';
}

window.__skillmap = { init, saveAndRedraw, resetSkills, toggleMilestone };
