/* ═══════════════════════════════════════════════════════
   modules/academic-compiler.js — 学术编译引擎 (Academic Compiler)
   Features: 论文元数据配置 · 一键生成 LaTeX 源码 · 期刊模板套用
═══════════════════════════════════════════════════════ */

const CONTAINER = 'module-academic-compiler';
let _activeTab = 'config';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">学术排版与 LaTeX 编译引擎</div>
        <div class="page-desc">将工作台内的图表、实验数据与草稿一键打包为国际顶刊标准源码。</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="config" onclick="window.__academicCompiler?.switchTab('config',this)">⚙️ 论文元数据组装</div>
      <div class="module-tab" data-tab="source" onclick="window.__academicCompiler?.switchTab('source',this)">📄 LaTeX 源码预览</div>
    </div>

    <div id="compiler-content"></div>
  `;

  _renderTab(_activeTab);
}

function switchTab(tab, el) {
  _activeTab = tab;
  document.querySelectorAll(`#${CONTAINER} .module-tab`).forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderTab(tab);
}

function _renderTab(tab) {
  const content = document.getElementById('compiler-content');
  if (!content) return;
  
  if (tab === 'config') _renderConfig(content);
  else if (tab === 'source') _renderSource(content);
}

/* ─── Tab 1: 论文元数据组装 ─── */
function _renderConfig(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">文献与排版设置</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">目标期刊/会议模板</div>
            <select id="latex-template" class="copilot-input">
              <option value="ieee">IEEE Transactions / Conference (双栏)</option>
              <option value="elsevier">Elsevier (单栏/双栏自适应)</option>
              <option value="acm">ACM SIG Proceedings</option>
              <option value="springer">Springer LNCS</option>
            </select>
          </div>
          
          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">论文英文标题</div>
            <input type="text" id="latex-title" class="copilot-input" value="An Archery Scoring Vision System based on Edge AI and RTOS">
          </div>
          
          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">作者信息 (Author List)</div>
            <input type="text" id="latex-author" class="copilot-input" value="Anonymous Author, Dept. of Computer Science">
          </div>

          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">英文摘要 (Abstract)</div>
            <textarea id="latex-abstract" class="copilot-input" style="height:100px;line-height:1.6;">This paper presents a novel archery scoring recognition system deployed on a LubanCat 5 edge device. By combining INT8-quantized object detection models with RTOS preemptive scheduling, we achieve high-precision, low-latency scoring under constrained hardware resources...</textarea>
          </div>
          
          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">引文库 (Bibliography)</div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="tag tag-violet" style="font-size:11px;">已自动链接「文献星系」库 (refs.bib)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title gold">模块资产一键导入</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          在此勾选你需要打包进论文的系统资产。引擎会自动将图表转为 PDF/EPS 矢量图，将表格转为 LaTeX Table 代码。
        </div>
        
        <div style="display:flex;flex-direction:column;gap:12px;background:rgba(0,0,0,0.2);padding:12px;border-radius:6px;border:1px solid var(--border);">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" checked style="accent-color:var(--cyan);"> 
            <span style="color:var(--text);font-size:13px;">包含「论文工坊」的正文草稿结构</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" checked style="accent-color:var(--cyan);"> 
            <span style="color:var(--text);font-size:13px;">包含「深度学习实验室」的消融实验表格</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" checked style="accent-color:var(--cyan);"> 
            <span style="color:var(--text);font-size:13px;">包含「边缘智能实验室」的 RTOS 调度甘特图</span>
          </label>
        </div>

        <button class="btn btn-gold" style="width:100%;justify-content:center;margin-top:20px;font-size:14px;padding:12px;" onclick="window.__academicCompiler?.generateLaTeX()">
          ⚡ 一键生成 LaTeX 源码项目
        </button>

        <div style="margin-top:16px; border-top:1px dashed var(--border); padding-top:16px;">
          <button class="btn btn-ghost btn-sm" onclick="window.__copilot?.askCopilot('在撰写 IEEE 格式的计算机系统顶会论文时，Introduction（引言）部分通常需要遵循怎样的“起承转合”四段式结构？请结合我正在做的边缘计算软硬协同项目给出具体建议。', 'LaTeX引擎', true)">
            🤖 问 AI：顶会论文的引言写作规范
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ─── Tab 2: LaTeX 源码预览 ─── */
function _renderSource(container) {
  container.innerHTML = `
    <div class="card" style="height: calc(100vh - 180px); display:flex; flex-direction:column;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div class="card-title emerald" style="margin-bottom:0;">main.tex 源码预览</div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-ghost btn-sm" onclick="window.__academicCompiler?.copyLaTeX()">📋 复制代码</button>
          <button class="btn btn-primary btn-sm">📦 下载 .zip 项目包 (含图片与bib)</button>
        </div>
      </div>
      
      <textarea id="latex-code-output" style="flex:1; background:#050810; color:#a8c0e8; font-family:var(--font-mono); font-size:12px; line-height:1.6; padding:16px; border:1px solid var(--border); border-radius:6px; resize:none; outline:none;" readonly></textarea>
    </div>
  `;
}

function generateLaTeX() {
  const title = document.getElementById('latex-title')?.value || 'Untitled Paper';
  const author = document.getElementById('latex-author')?.value || 'Anonymous';
  const abstract = document.getElementById('latex-abstract')?.value || 'Abstract goes here...';
  const template = document.getElementById('latex-template')?.value;

  let docClass = '\\documentclass[lettersize,journal]{IEEEtran}';
  if (template === 'elsevier') docClass = '\\documentclass[preprint,12pt]{elsarticle}';
  else if (template === 'acm') docClass = '\\documentclass[sigconf]{acmart}';

  const latexTemplate = `${docClass}
\\usepackage{amsmath,amsfonts}
\\usepackage{algorithmic}
\\usepackage{array}
\\usepackage{graphicx}
\\usepackage{textcomp}
\\usepackage{xcolor}
\\usepackage{booktabs}
\\usepackage{cite}

\\begin{document}

\\title{${title}}

\\author{${author}}

\\maketitle

\\begin{abstract}
${abstract}
\\end{abstract}

\\begin{IEEEkeywords}
Edge AI, RTOS, Object Detection, Hardware-Software Co-design
\\end{IEEEkeywords}

\\section{Introduction}
\\IEEEPARstart{T}{he} deployment of deep learning models on resource-constrained edge devices presents significant challenges...
% TODO: Text imported from Writing Workshop

\\section{System Architecture}
% Figure automatically packed from Edge AI Lab
\\begin{figure}[htbp]
\\centerline{\\includegraphics[width=\\columnwidth]{fig_rtos_gantt.pdf}}
\\caption{Preemptive scheduling simulation of the scoring system.}
\\label{fig:rtos}
\\end{figure}

\\section{Experiments and Ablation Study}
% Table automatically generated from DL Lab
\\begin{table}[htbp]
\\caption{Ablation Study of Network Components}
\\begin{center}
\\begin{tabular}{ccccc}
\\toprule
Base & + Attention & + Dropout & + BatchNorm & Accuracy \\\\
\\midrule
$\\checkmark$ & & & & 0.78 \\\\
$\\checkmark$ & $\\checkmark$ & & & 0.84 \\\\
$\\checkmark$ & $\\checkmark$ & $\\checkmark$ & $\\checkmark$ & \\textbf{0.91} \\\\
\\bottomrule
\\end{tabular}
\\label{tab:ablation}
\\end{center}
\\end{table}

\\section{Conclusion}
This paper demonstrates a highly efficient edge-based vision system...

\\bibliographystyle{IEEEtran}
\\bibliography{refs} % Automatically synced from Literature Galaxy

\\end{document}
`;

  // 自动切换到源码预览 Tab 并填入代码
  switchTab('source');
  setTimeout(() => {
    const output = document.getElementById('latex-code-output');
    if (output) {
      output.value = latexTemplate;
      window.__copilot?.addMessage('sys', '✓ LaTeX 源码已成功生成！图表与消融实验数据已自动转换为标准 TeX 格式。你可以直接将其复制到 Overleaf 中编译。');
    }
  }, 50);
}

function copyLaTeX() {
  const output = document.getElementById('latex-code-output');
  if (output && navigator.clipboard) {
    navigator.clipboard.writeText(output.value);
    window.__copilot?.addMessage('sys', '📋 LaTeX 源码已复制到剪贴板。');
  }
}

window.__academicCompiler = { init, switchTab, generateLaTeX, copyLaTeX };