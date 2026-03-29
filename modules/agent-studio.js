/* ═══════════════════════════════════════════════════════
   modules/agent-studio.js — Agent 自动化工坊
   Features: 智能数据清洗脚本生成 · 爬虫代码生成 · 终端沙盒
═══════════════════════════════════════════════════════ */

const CONTAINER = 'module-agent-studio';
let _activeTab = 'cleaner';

export function init() {
  const root = document.getElementById(CONTAINER);
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Agent 自动化工坊</div>
        <div class="page-desc">让 AI 从“聊天顾问”变成“帮你写代码干活的打工人”</div>
      </div>
    </div>

    <div class="module-tabs">
      <div class="module-tab active" data-tab="cleaner" onclick="window.__agentStudio?.switchTab('cleaner',this)">🧹 数据清洗 Agent</div>
      <div class="module-tab" data-tab="scraper" onclick="window.__agentStudio?.switchTab('scraper',this)">🕸️ 智能爬虫 Agent</div>
      <div class="module-tab" data-tab="sandbox" onclick="window.__agentStudio?.switchTab('sandbox',this)">💻 本地执行沙盒</div>
    </div>

    <div id="agent-content"></div>
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
  const content = document.getElementById('agent-content');
  if (!content) return;
  
  if (tab === 'cleaner') _renderCleaner(content);
  else if (tab === 'scraper') _renderScraper(content);
  else if (tab === 'sandbox') _renderSandbox(content);
}

/* ─── Tab 1: 数据清洗 Agent (Data Cleaner) ─── */
function _renderCleaner(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title cyan">第 1 步：上传杂乱的原始数据</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          上传任意 CSV 文件。引擎会在本地读取<strong>前 5 行</strong>和<strong>表头字段</strong>，供 AI 分析数据结构，绝不上传完整数据。
        </div>
        <input type="file" id="agent-csv" accept=".csv" class="copilot-input" style="width:100%; margin-bottom:12px;" onchange="window.__agentStudio?.previewCSV()">
        
        <div id="csv-preview-area" style="display:none;">
          <div style="font-size:11px;color:var(--gold);margin-bottom:4px;font-family:var(--font-mono);">数据结构预览 (前 3 行)：</div>
          <div id="csv-preview-table" style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:6px;padding:8px;overflow-x:auto;font-family:var(--font-mono);font-size:10px;color:var(--text-muted);white-space:pre;"></div>
        </div>
      </div>

      <div class="card" id="clean-action-area" style="opacity:0.4; pointer-events:none;">
        <div class="card-title violet">第 2 步：指挥 AI 生成清洗脚本</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          告诉 AI 你想怎么处理这些数据（比如：处理缺失值、合并日期列、剔除异常值等）。
        </div>
        <textarea id="clean-instruction" class="copilot-input" style="height:80px;margin-bottom:12px;" placeholder="例如：把 'date' 列转换成 YYYY-MM-DD 格式，用均值填充 'revenue' 列的缺失值，并剔除 'status' 为 0 的行。"></textarea>
        
        <button class="btn btn-violet" style="width:100%;justify-content:center;" onclick="window.__agentStudio?.generateCleanScript()">
          ⚡ 生成完整的 Python (Pandas) 清洗代码
        </button>
      </div>
    </div>
  `;
}

let _csvSample = ""; // 缓存提取的CSV样本

function previewCSV() {
  const fileInput = document.getElementById('agent-csv');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
  
  const file = fileInput.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n').filter(l => l.trim());
    
    if (lines.length === 0) return;
    
    // 提取表头和前 3 行
    const sampleLines = lines.slice(0, 4);
    _csvSample = sampleLines.join('\n');
    
    // 显示预览
    const previewArea = document.getElementById('csv-preview-area');
    const previewTable = document.getElementById('csv-preview-table');
    previewArea.style.display = 'block';
    
    // 简单的表格对齐展示
    let formattedHtml = '';
    sampleLines.forEach((line, idx) => {
      if (idx === 0) formattedHtml += `<strong style="color:var(--cyan);">${line}</strong>\n`;
      else formattedHtml += `${line}\n`;
    });
    previewTable.innerHTML = formattedHtml;

    // 解锁右侧操作区
    const actionArea = document.getElementById('clean-action-area');
    actionArea.style.opacity = '1';
    actionArea.style.pointerEvents = 'auto';
    
    window.__copilot?.addMessage('sys', '✓ 成功读取数据结构。你可以告诉我想怎么清洗它了。');
  };
  
  reader.readAsText(file);
}

function generateCleanScript() {
  const instruction = document.getElementById('clean-instruction')?.value.trim();
  if (!instruction) {
    alert("请先描述你需要如何清洗数据！");
    return;
  }
  
  const prompt = `我有一个 CSV 文件，其表头和前三行数据样本如下：\n\n${_csvSample}\n\n我的清洗需求是：\n${instruction}\n\n请你扮演一个资深数据工程师，直接为我写一段完整、可运行的 Python (使用 Pandas) 代码来完成上述任务。代码应包含读取 'data.csv'、执行清洗、以及保存为 'cleaned_data.csv' 的步骤，并为关键步骤添加中文注释。除此之外，不要说多余的废话。`;
  
  window.__copilot?.askCopilot(prompt, '数据清洗 Agent', true);
}

/* ─── Tab 2: 智能爬虫 Agent (Web Scraper) ─── */
function _renderScraper(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title emerald">定制专属爬虫脚本</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
        输入目标网站特征和需要抓取的字段，AI 将为你生成带有反爬策略（Headers/Sleep）的 Python 爬虫代码。
      </div>
      
      <div class="grid-2" style="gap:12px;margin-bottom:16px;">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">目标网站类型</div>
          <select id="scrape-type" class="copilot-input">
            <option value="requests">静态网页 (Requests + BeautifulSoup)</option>
            <option value="selenium">动态渲染网页 (Selenium + ChromeDriver)</option>
            <option value="api">API 接口抓取 (Requests + JSON)</option>
          </select>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">需要抓取的目标字段</div>
          <input type="text" id="scrape-fields" class="copilot-input" placeholder="例如：文章标题, 发布时间, 正文内容, 作者">
        </div>
      </div>
      
      <button class="btn btn-emerald" onclick="window.__agentStudio?.generateScraper()">
        🕸️ 生成爬虫代码
      </button>
    </div>
  `;
}

function generateScraper() {
  const type = document.getElementById('scrape-type')?.value;
  const fields = document.getElementById('scrape-fields')?.value;
  
  if (!fields) { alert("请输入你需要抓取的字段！"); return; }
  
  let tool = type === 'selenium' ? 'Selenium' : type === 'api' ? 'Requests 读取 JSON' : 'Requests 加上 BeautifulSoup4';
  
  const prompt = `我需要编写一个 Python 爬虫脚本。目标是抓取包含以下字段的数据：【${fields}】。\n请使用 ${tool} 库来编写。\n请提供一个完整、结构良好的 Python 脚本，要求：\n1. 包含必要的随机 User-Agent 和 time.sleep() 以应对基本反爬。\n2. 将抓取结果保存为 Pandas DataFrame 导出为 CSV。\n3. 使用 try-except 块处理潜在的解析异常。\n直接输出代码即可。`;
  
  window.__copilot?.askCopilot(prompt, '爬虫 Agent', true);
}

/* ─── Tab 3: 本地执行沙盒 (Terminal Sandbox) ─── */
function _renderSandbox(container) {
  container.innerHTML = `
    <div class="card" style="background:#050810; border-color:#2a3f6a;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="font-family:var(--font-mono);color:var(--cyan);font-size:12px;">nexus@research-machine:~ $</div>
        <div class="tag tag-rose">环境未连接</div>
      </div>
      
      <div style="font-family:var(--font-mono);font-size:13px;line-height:1.6;color:#a8c0e8;min-height:200px;">
        [System] 正在初始化本地沙盒环境...<br>
        [System] 检测本地 Python 路径... <span style="color:var(--rose);">未配置</span><br><br>
        <span style="color:var(--text-faint);">
          这是 NexRes Hub v4.0 的预留接口。<br>
          未来版本中，通过启动本地 Node.js / Python 桥接服务，<br>
          你可以在这里直接运行 AI 生成的清洗、回测和爬虫脚本，<br>
          让系统彻底从“浏览器前端”进化为“本地操作系统级别的超级 AI 工作站”。
        </span>
      </div>
    </div>
  `;
}

window.__agentStudio = { init, switchTab, previewCSV, generateCleanScript, generateScraper };