/* ═══════════════════════════════════════════════════════
   core/shell.js — Application Shell & Router
   Responsibilities:
     · Tab switching & module lifecycle (init on first visit)
     · Keyboard shortcuts
     · Research mode state
     · Global error boundary
     · URL hash routing (optional)
   Must be loaded LAST (after all modules are registered).
═══════════════════════════════════════════════════════ */

import { setActiveNav } from '../components/sidebar.js';
import { setCurrentModule } from '../components/copilot.js';

/* ── Module registry ── */
// Each module exports an `init()` that renders its content.
// The shell calls init() the FIRST time a tab is visited.
const MODULE_INITS = {
  workflow:   () => window.__workflow?.init(),
  dashboard:  () => window.__dashboard?.init(),
  dashboard:  () => window.__dashboard?.init(),
  literature: () => window.__literature?.init(),
  methods:    () => window.__methods?.init(),
  ml:         () => window.__mllab?.init(),
  explog:     () => window.__explog?.init(),
  llm:        () => window.__llmarena?.init(),
  writing:    () => window.__writing?.init(),
  skillmap:   () => window.__skillmap?.init(),
  datahub:    () => window.__datahub?.init(),
  dllab:      () => window.__dllab?.init(),
  qualstudio: () => window.__qualStudio?.init(),
  fintech:    () => window.__fintech?.init(),
  resdesign:  () => window.__resdesign?.init(),
  derivatives: () => window.__derivatives?.init(),
  'agent-studio': () => window.__agentStudio?.init(),
  'causal-engine': () => window.__causalEngine?.init(),
  'xai-studio': () => window.__xaiStudio?.init(),
  'bayesian-lab': () => window.__bayesianLab?.init(),
  'sensor-dsp': () => window.__sensorDSP?.init(),
  'lit-matrix': () => window.__litMatrix?.init(),
  'academic-compiler': () => window.__academicCompiler?.init(),
  
  'causal-ml':    () => window.__causalML?.init(),
  'agent-sim':    () => window.__agentSim?.init(),
  'llm-measure':  () => window.__llmMeasure?.init(),
  'network-econ': () => window.__networkEcon?.init(),
};

/* ── State ── */
let _currentTab   = 'dashboard';
let _researchMode = 'quant';  // 'quant' | 'qual' | 'comp' | 'theory'
const _initialized = new Set();  // track which modules have been init'd

/* ── Tab Switching ── */
/**
 * Switch to a module tab.
 * @param {string} tabId  - module id, e.g. 'dashboard'
 * @param {HTMLElement} [navEl] - the nav item element (for active styling)
 */
function switchTab(tabId, navEl) {
  if (!MODULE_INITS[tabId]) {
    console.warn(`[Shell] Unknown tab: ${tabId}`);
    return;
  }

  // Hide all modules
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));

  // Show target module
  const target = document.getElementById(`module-${tabId}`);
  if (target) target.classList.add('active');

  // Update nav highlight
  if (navEl) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    navEl.classList.add('active');
  } else {
    setActiveNav(tabId);
  }

  // Init module on first visit
  if (!_initialized.has(tabId)) {
    try {
      MODULE_INITS[tabId]();
      _initialized.add(tabId);
    } catch (err) {
      console.error(`[Shell] Failed to init module "${tabId}":`, err);
      _showModuleError(tabId, err);
    }
  }

  // Update copilot context
  setCurrentModule(tabId);
  _currentTab = tabId;

  // Update URL hash for bookmarking
  history.replaceState(null, '', `#${tabId}`);
}

/* ── Error boundary ── */
function _showModuleError(tabId, err) {
  const el = document.getElementById(`module-${tabId}`);
  if (!el) return;
  el.innerHTML = `
    <div style="padding:40px;text-align:center;color:var(--text-faint);">
      <div style="font-size:28px;margin-bottom:12px;">⚠</div>
      <div style="font-size:14px;color:var(--rose);">模块加载失败：${tabId}</div>
      <div style="font-size:12px;margin-top:8px;font-family:var(--font-mono);">${err.message}</div>
      <button class="btn btn-ghost btn-sm" style="margin-top:16px;"
        onclick="window.__shell?.retryModule('${tabId}')">重试</button>
    </div>`;
}

function retryModule(tabId) {
  _initialized.delete(tabId);
  switchTab(tabId);
}

/* ── Research Mode ── */
function setResearchMode(mode) {
  _researchMode = mode;
  // Could propagate to modules that adapt to research mode
  document.dispatchEvent(new CustomEvent('nexres:modechange', { detail: { mode } }));
}

function getResearchMode() { return _researchMode; }

/* ── Keyboard Shortcuts ── */
function _initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Alt + 1..8 → switch tabs
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const tabs = Object.keys(MODULE_INITS);
      const idx  = parseInt(e.key) - 1;
      if (idx >= 0 && idx < tabs.length) {
        e.preventDefault();
        switchTab(tabs[idx]);
      }
    }
    // Ctrl+K → focus copilot input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('copilot-in')?.focus();
    }
  });
}

/* ── Hash Routing ── */
function _initHashRouting() {
  const hash = window.location.hash.slice(1);
  if (hash && MODULE_INITS[hash]) {
    // Delay slightly to ensure modules are registered
    setTimeout(() => switchTab(hash), 50);
  }
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.slice(1);
    if (h && MODULE_INITS[h] && h !== _currentTab) switchTab(h);
  });
}

/* ── Boot ── */
function _boot() {
  // Init the default tab (dashboard)
  try {
    MODULE_INITS.dashboard();
    _initialized.add('dashboard');
    setCurrentModule('dashboard');
  } catch (err) {
    console.error('[Shell] Dashboard init failed:', err);
  }

  _initKeyboardShortcuts();
  _initHashRouting();

  console.info('[NexRes Hub v3] Shell booted. Alt+1–8 to switch tabs, Ctrl+K to focus AI.');
}

/* ── Expose globally ── */
window.__shell = { switchTab, retryModule, setResearchMode, getResearchMode };

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _boot);
} else {
  _boot();
}
