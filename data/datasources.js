/* ═══════════════════════════════════════════════════════
   data/datasources.js — 经管研究数据源库
   每个 category 包含若干 variables，每个 variable 对应多个 sources
═══════════════════════════════════════════════════════ */

export const DATA_CATEGORIES = [
  {
    id: 'macro',
    icon: '🏛',
    label: '宏观经济',
    color: 'gold',
    desc: 'GDP、CPI、货币政策、景气指数等宏观变量',
    variables: [
      {
        name: 'GDP / 经济增长',
        tags: ['时间序列', '面板数据'],
        sources: [
          { name: '国家统计局', url: 'https://data.stats.gov.cn', access: '免费', format: 'CSV/API', note: '年度/季度 GDP、分省市数据' },
          { name: 'Wind 数据库', url: 'https://www.wind.com.cn', access: '付费', format: 'Excel/API', note: '实时宏观数据，高校可申请授权' },
          { name: 'World Bank Open Data', url: 'https://data.worldbank.org', access: '免费', format: 'CSV/API', note: '跨国 GDP 面板，1960年至今' },
          { name: 'CEIC', url: 'https://www.ceicdata.com', access: '付费', format: 'Excel', note: '中国及亚太宏观数据库' },
        ],
      },
      {
        name: 'CPI / PPI / 通货膨胀',
        tags: ['月频', '时间序列'],
        sources: [
          { name: '国家统计局', url: 'https://data.stats.gov.cn', access: '免费', format: 'CSV', note: '分类别 CPI、PPI 月度数据' },
          { name: 'IMF Data', url: 'https://data.imf.org', access: '免费', format: 'CSV/API', note: '全球通胀面板数据' },
          { name: 'FRED（圣路易斯联储）', url: 'https://fred.stlouisfed.org', access: '免费', format: 'CSV/API', note: '美国及全球宏观序列，API 友好' },
        ],
      },
      {
        name: 'M2 / 货币供应 / 信贷',
        tags: ['月频', '货币政策'],
        sources: [
          { name: '中国人民银行', url: 'https://www.pbc.gov.cn/diaochatongjisi/resource/cms/2024', access: '免费', format: 'Excel', note: 'M0/M1/M2 月度数据，官方权威来源' },
          { name: 'Wind', url: 'https://www.wind.com.cn', access: '付费', format: 'API', note: '信贷结构、社会融资规模' },
          { name: 'BIS Statistics', url: 'https://www.bis.org/statistics', access: '免费', format: 'CSV', note: '跨国信贷与债务数据' },
        ],
      },
      {
        name: 'PMI / 经济景气',
        tags: ['月频', '前瞻指标'],
        sources: [
          { name: '国家统计局 PMI', url: 'https://data.stats.gov.cn', access: '免费', format: 'CSV', note: '官方制造业/非制造业 PMI' },
          { name: 'Caixin PMI（财新）', url: 'https://pmi.caixin.com', access: '部分免费', format: '网页', note: '市场口径 PMI，与官方互为补充' },
          { name: 'OECD Composite Leading Indicators', url: 'https://stats.oecd.org', access: '免费', format: 'CSV/API', note: '跨国经济景气指标' },
        ],
      },
    ],
  },
  {
    id: 'firm',
    icon: '🏢',
    label: '企业财务',
    color: 'cyan',
    desc: '三大财务报表、盈利能力、资本结构等企业层面变量',
    variables: [
      {
        name: '财务三表（利润表 / 资产负债表 / 现金流量表）',
        tags: ['年度/季度', '企业面板'],
        sources: [
          { name: 'CSMAR（国泰安）', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV/Stata', note: '中国上市公司最权威数据库，覆盖 A/B/H 股' },
          { name: 'Wind', url: 'https://www.wind.com.cn', access: '付费', format: 'Excel/API', note: '实时财报，支持自定义字段导出' },
          { name: 'CNRDS（中国研究数据服务平台）', url: 'https://www.cnrds.com', access: '高校付费', format: 'CSV', note: '含文本、专利、公告等多维数据' },
          { name: 'Compustat（全球上市公司）', url: 'https://wrds-www.wharton.upenn.edu', access: '高校付费', format: 'CSV/SAS', note: 'WRDS 旗下，覆盖全球上市公司' },
        ],
      },
      {
        name: 'ROA / ROE / Tobin Q / 盈利能力',
        tags: ['衍生变量', '需自计算'],
        sources: [
          { name: 'CSMAR 财务指标库', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV', note: '已计算好的盈利、效率、偿债指标' },
          { name: '同花顺 iFinD', url: 'https://www.51ifind.com', access: '付费', format: 'Excel/API', note: '适合快速验证，界面友好' },
          { name: 'Refinitiv Eikon', url: 'https://www.refinitiv.com', access: '付费', format: 'Excel/Python API', note: '全球覆盖，适合国际比较研究' },
        ],
      },
      {
        name: '股权结构 / 控股股东 / 实际控制人',
        tags: ['公司治理', '股权集中度'],
        sources: [
          { name: 'CSMAR 公司治理库', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV', note: '股东穿透、持股比例历史变化' },
          { name: '天眼查（企业图谱）', url: 'https://www.tianyancha.com', access: '部分免费', format: '网页/API', note: '企业股权关系图谱，实时更新' },
          { name: '企查查', url: 'https://www.qichacha.com', access: '部分免费', format: '网页', note: '工商登记、股权变更记录' },
        ],
      },
    ],
  },
  {
    id: 'market',
    icon: '📈',
    label: '资本市场',
    color: 'violet',
    desc: '股票收益率、波动率、市值、交易量等市场微观结构变量',
    variables: [
      {
        name: '日/月收益率 / 超额收益',
        tags: ['高频', '时间序列'],
        sources: [
          { name: 'CSMAR 股票市场库', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV/Stata', note: '日收益率、市值加权收益率，含 Fama-French 因子' },
          { name: 'Tushare Pro', url: 'https://tushare.pro', access: '积分制免费', format: 'Python API', note: '日线行情，积分兑换，适合量化研究' },
          { name: 'CRSP（美国市场）', url: 'https://wrds-www.wharton.upenn.edu', access: '高校付费', format: 'CSV/SAS', note: '美国股票日月收益率，学术标准数据库' },
          { name: 'AKShare', url: 'https://akshare.akfamily.xyz', access: '开源免费', format: 'Python API', note: '开源 A 股数据接口，适合快速原型' },
        ],
      },
      {
        name: '股票波动率 / VIX / 已实现波动率',
        tags: ['风险度量', '资产定价'],
        sources: [
          { name: 'CSMAR', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV', note: '含 IVOL（特质波动率）计算好的指标' },
          { name: 'CBOE VIX', url: 'https://www.cboe.com/tradable_products/vix', access: '免费', format: 'CSV', note: '美国 VIX 历史数据，官方下载' },
          { name: 'Oxford-Man RV Library', url: 'https://realized.oxford-man.ox.ac.uk', access: '免费', format: 'CSV', note: '已实现波动率，覆盖全球主要指数' },
        ],
      },
      {
        name: '分析师预测 / 机构持仓 / 信息环境',
        tags: ['信息不对称', '公司金融'],
        sources: [
          { name: 'CSMAR 分析师预测库', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV', note: '分析师盈利预测、评级历史' },
          { name: 'I/B/E/S（WRDS）', url: 'https://wrds-www.wharton.upenn.edu', access: '高校付费', format: 'CSV', note: '全球分析师预测数据库，学术标准' },
          { name: '万得基金持仓', url: 'https://www.wind.com.cn', access: '付费', format: 'Excel', note: '季度机构持仓、基金仓位' },
        ],
      },
    ],
  },
  {
    id: 'governance',
    icon: '⚖️',
    label: '公司治理',
    color: 'emerald',
    desc: '董事会、高管薪酬、两职合一、股东大会等治理变量',
    variables: [
      {
        name: '董事会规模 / 独立董事 / 两职合一',
        tags: ['治理结构', '年度数据'],
        sources: [
          { name: 'CSMAR 公司治理库', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV', note: '董事会组成、独董比例、会议次数' },
          { name: 'BoardEx', url: 'https://wrds-www.wharton.upenn.edu', access: '高校付费', format: 'CSV', note: '全球高管/董事网络连接数据' },
          { name: 'ISS Directors Database', url: 'https://www.issgovernance.com', access: '付费', format: 'Excel', note: '股东投票、董事会质量评级' },
        ],
      },
      {
        name: '高管薪酬 / 激励机制 / 持股',
        tags: ['代理理论', '薪酬契约'],
        sources: [
          { name: 'CSMAR 高管数据库', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV', note: '高管个人背景、薪酬、持股变化' },
          { name: 'Execucomp（美国）', url: 'https://wrds-www.wharton.upenn.edu', access: '高校付费', format: 'CSV', note: 'S&P 1500 高管薪酬，1992年至今' },
        ],
      },
    ],
  },
  {
    id: 'policy',
    icon: '📜',
    label: '政策与制度',
    color: 'rose',
    desc: '政策文本、法律法规、地方政府行为等制度环境变量',
    variables: [
      {
        name: '政策文本 / 法规条例',
        tags: ['文本数据', '政策冲击'],
        sources: [
          { name: '北大法宝', url: 'https://www.pkulaw.com', access: '高校付费', format: '网页/全文导出', note: '中国法律法规全文检索，支持批量下载' },
          { name: '中国政府网法规库', url: 'https://www.gov.cn/zhengce', access: '免费', format: '网页', note: '国务院及各部委政策原文' },
          { name: '中国裁判文书网', url: 'https://wenshu.court.gov.cn', access: '免费', format: '网页/API', note: '司法判决文本，适合法律经济学研究' },
        ],
      },
      {
        name: '地方政府行为 / 官员数据',
        tags: ['政治经济学', '面板数据'],
        sources: [
          { name: 'CNRDS 官员数据库', url: 'https://www.cnrds.com', access: '高校付费', format: 'CSV', note: '市委书记、市长任期、晋升轨迹' },
          { name: '地方财政数据（预决算公开）', url: 'https://yss.mof.gov.cn', access: '免费', format: 'PDF/Excel', note: '财政部及各省预算报告' },
        ],
      },
      {
        name: '经济政策不确定性 EPU',
        tags: ['不确定性', '宏观金融'],
        sources: [
          { name: 'EPU Index（Baker et al.）', url: 'https://www.policyuncertainty.com', access: '免费', format: 'CSV', note: '基于媒体词频构建，中国/全球指数' },
          { name: 'CCTV 财经新闻文本库', url: 'https://cnrds.com', access: '高校付费', format: 'CSV', note: '国内基于媒体的不确定性指数' },
        ],
      },
    ],
  },
  {
    id: 'labor',
    icon: '👷',
    label: '劳动力市场',
    color: 'gold',
    desc: '工资收入、就业结构、人力资本、家庭调查等变量',
    variables: [
      {
        name: '家庭收入 / 消费 / 贫困',
        tags: ['微观调查', '个体数据'],
        sources: [
          { name: 'CFPS（中国家庭追踪调查）', url: 'https://www.isss.pku.edu.cn/cfps', access: '注册免费', format: 'Stata/CSV', note: '北大社会调查中心，双年追踪，覆盖全国' },
          { name: 'CHNS（中国健康与营养调查）', url: 'https://www.cpc.unc.edu/projects/china', access: '注册免费', format: 'Stata', note: '9省追踪数据，1989-2015，含膳食/体检' },
          { name: 'CGSS（中国综合社会调查）', url: 'https://cgss.ruc.edu.cn', access: '注册免费', format: 'SPSS/CSV', note: '人大主导，截面调查，社会态度数据' },
          { name: 'CLDS（中国劳动力动态调查）', url: 'https://css.sysu.edu.cn/Data', access: '注册免费', format: 'Stata', note: '中山大学，劳动参与、工资、迁移' },
        ],
      },
      {
        name: '城镇失业率 / 就业结构',
        tags: ['月频/年度', '宏观就业'],
        sources: [
          { name: '国家统计局月度数据', url: 'https://data.stats.gov.cn', access: '免费', format: 'CSV', note: '城镇调查失业率（2018年后扩大口径）' },
          { name: 'ILO 劳工组织数据库', url: 'https://ilostat.ilo.org', access: '免费', format: 'CSV/API', note: '国际可比就业指标' },
        ],
      },
    ],
  },
  {
    id: 'esg',
    icon: '🌿',
    label: 'ESG / 环境',
    color: 'emerald',
    desc: 'ESG 评级、碳排放、环境违规、绿色金融等变量',
    variables: [
      {
        name: 'ESG 评级 / 评分',
        tags: ['企业面板', '可持续发展'],
        sources: [
          { name: '华证 ESG', url: 'https://www.chinabond.com.cn', access: '高校付费', format: 'CSV', note: 'A 股上市公司 ESG 评级，覆盖最广' },
          { name: 'MSCI ESG Ratings', url: 'https://www.msci.com/our-solutions/esg-investing', access: '付费', format: 'Excel/API', note: '国际机构 ESG 标准，全球覆盖' },
          { name: 'Bloomberg ESG', url: 'https://www.bloomberg.com/professional/solution/esg', access: '付费', format: 'Excel/API', note: 'Bloomberg Terminal 内置，含原始 ESG 数据' },
          { name: 'CSMAR 企业社会责任库', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV', note: '企业 CSR 报告文本、关键词提取' },
        ],
      },
      {
        name: '碳排放 / 污染物排放',
        tags: ['工厂/城市级', '环境政策'],
        sources: [
          { name: '中国工业企业污染数据库（CIEP）', url: 'https://www.cnrds.com', access: '高校付费', format: 'CSV', note: '工厂级污染物排放，2000-2013' },
          { name: 'CEADs（中国碳排放账户）', url: 'https://www.ceads.net.cn', access: '免费', format: 'Excel', note: '省/市级 CO₂排放，1997年至今' },
          { name: 'EDGAR 全球排放库', url: 'https://edgar.jrc.ec.europa.eu', access: '免费', format: 'CSV', note: 'EU JRC 出品，国家级碳排放' },
        ],
      },
      {
        name: '环境违规 / 处罚记录',
        tags: ['事件研究', '监管合规'],
        sources: [
          { name: '生态环境部监管数据', url: 'https://www.mee.gov.cn', access: '免费', format: '网页', note: '企业环境违规公告，需爬取' },
          { name: 'CNRDS 企业违规库', url: 'https://www.cnrds.com', access: '高校付费', format: 'CSV', note: '结构化处罚记录，含罚款金额' },
        ],
      },
    ],
  },
  {
    id: 'trade',
    icon: '🌐',
    label: '国际贸易',
    color: 'cyan',
    desc: '进出口、关税、贸易摩擦、GVC 参与度等变量',
    variables: [
      {
        name: '进出口贸易额 / 贸易伙伴',
        tags: ['HS 编码', '双边贸易'],
        sources: [
          { name: 'UN Comtrade', url: 'https://comtradeplus.un.org', access: '免费', format: 'CSV/API', note: '全球双边贸易最权威来源，HS 6位码' },
          { name: 'WITS（World Bank）', url: 'https://wits.worldbank.org', access: '免费', format: 'CSV', note: '含关税数据，Comtrade 简化界面' },
          { name: 'CEPII BACI', url: 'https://www.cepii.fr/CEPII/en/bdd_modele', access: '免费注册', format: 'CSV', note: '调和后高质量贸易数据，学术常用' },
          { name: '中国海关数据（CCTS）', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV', note: '企业-产品级出口数据（极细粒度）' },
        ],
      },
      {
        name: '关税 / 贸易壁垒 / NTM',
        tags: ['贸易政策', '保护主义'],
        sources: [
          { name: 'WTO Tariff Download Facility', url: 'https://tariffdata.wto.org', access: '免费', format: 'CSV', note: '各国实际执行关税税率' },
          { name: 'TRAINS（UNCTAD）', url: 'https://unctad.org/topic/trade-analysis/trains', access: '免费', format: 'CSV', note: '非关税措施数据库（NTM）' },
        ],
      },
    ],
  },
  {
    id: 'text',
    icon: '📰',
    label: '文本大数据',
    color: 'violet',
    desc: '新闻媒体、年报披露、社交媒体、专利等非结构化数据',
    variables: [
      {
        name: '企业年报 / MD&A 文本',
        tags: ['文本分析', 'NLP'],
        sources: [
          { name: '巨潮资讯（CNINF）', url: 'https://www.cninfo.com.cn', access: '免费', format: 'PDF/HTML', note: 'A 股全量公告，机器可读，可批量爬取' },
          { name: 'CNRDS 文本库', url: 'https://www.cnrds.com', access: '高校付费', format: 'TXT/CSV', note: '已解析的年报文本，含情感词典标注' },
          { name: 'SEC EDGAR（美国年报）', url: 'https://efts.sec.gov/LATEST/search-index', access: '免费', format: 'TXT/HTML', note: '美股 10-K 全文，API 友好' },
        ],
      },
      {
        name: '财经媒体新闻 / 情感分析',
        tags: ['媒体关注度', '投资者情绪'],
        sources: [
          { name: 'CNRDS 新闻库', url: 'https://www.cnrds.com', access: '高校付费', format: 'CSV', note: '主流财经媒体新闻，含情感得分' },
          { name: '万得资讯新闻（Wind）', url: 'https://www.wind.com.cn', access: '付费', format: 'Excel/API', note: '实时新闻推送与历史存档' },
          { name: 'RavenPack（英文媒体）', url: 'https://www.ravenpack.com', access: '付费', format: 'API', note: '全球英文财经新闻情感分析' },
        ],
      },
      {
        name: '专利数据',
        tags: ['创新能力', '知识产权'],
        sources: [
          { name: '国家知识产权局（CNIPA）', url: 'https://pss-system.cponline.cnipa.gov.cn', access: '免费', format: '网页', note: '中国专利全文检索，可批量下载' },
          { name: 'PATSTAT（EPO）', url: 'https://www.epo.org/searching-for-patents/business/patstat.html', access: '付费', format: 'SQL', note: '全球专利数据库，学术合作可申请' },
          { name: 'CNRDS 专利库', url: 'https://www.cnrds.com', access: '高校付费', format: 'CSV', note: '已匹配到企业层面的专利数据' },
        ],
      },
    ],
  },
  {
    id: 'survey',
    icon: '📋',
    label: '调查与行政数据',
    color: 'rose',
    desc: '工业企业普查、人口普查、抽样调查等大型数据集',
    variables: [
      {
        name: '中国工业企业数据库（CIED）',
        tags: ['企业普查', '1998-2013'],
        sources: [
          { name: '国家统计局（需申请）', url: 'https://data.stats.gov.cn', access: '申请制', format: 'Stata', note: '规模以上工业企业年报，微观数据黄金标准' },
          { name: '北大数字金融研究中心', url: 'https://idf.pku.edu.cn', access: '合作申请', format: 'Stata', note: '含清洗版本，部分合作机构可获取' },
        ],
      },
      {
        name: '人口普查 / 流动人口',
        tags: ['人口结构', '地理数据'],
        sources: [
          { name: '国家统计局人口数据', url: 'https://www.stats.gov.cn/sj/pcsj', access: '免费', format: 'Excel', note: '七普数据公开，县区级人口结构' },
          { name: 'IPUMS China', url: 'https://international.ipums.org/international', access: '注册免费', format: 'CSV', note: '历次人口普查微观样本' },
        ],
      },
      {
        name: '农村土地 / 农业生产',
        tags: ['农业经济', '乡村振兴'],
        sources: [
          { name: 'CHARLS（中国健康与养老追踪）', url: 'https://charls.pku.edu.cn', access: '注册免费', format: 'Stata', note: '45岁以上农村老人追踪，含土地/收入' },
          { name: 'CLES（中国土地经济调查）', url: 'https://www.lnd.com.cn', access: '合作申请', format: 'Stata', note: '农地流转、宅基地数据' },
          { name: 'FAO FAOSTAT', url: 'https://www.fao.org/faostat', access: '免费', format: 'CSV/API', note: '全球农业生产、粮食安全数据' },
        ],
      },
    ],
  },
];

/** 快速通过 id 查找 category */
export function getCategoryById(id) {
  return DATA_CATEGORIES.find(c => c.id === id) ?? null;
}

/** 获取所有 source 的扁平列表（供搜索） */
export function getAllSources() {
  return DATA_CATEGORIES.flatMap(cat =>
    cat.variables.flatMap(v =>
      v.sources.map(s => ({ ...s, categoryId: cat.id, categoryLabel: cat.label, variableName: v.name }))
    )
  );
}

// ── 补充分类：产业经济 ──────────────────────────────
DATA_CATEGORIES.push({
  id: 'industry',
  icon: '🏭',
  label: '产业经济',
  color: 'gold',
  desc: '行业集中度、产业链、供应链、区域经济等产业层面变量',
  variables: [
    {
      name: 'HHI / CR4 / 行业集中度',
      tags: ['产业组织', '市场结构'],
      sources: [
        { name: 'CSMAR 行业数据库', url: 'https://www.gtarsc.com', access: '高校付费', format: 'CSV', note: '按证监会行业分类的年度集中度指标' },
        { name: '国家统计局工业统计', url: 'https://data.stats.gov.cn', access: '免费', format: 'Excel', note: '分行业工业总产值、企业数量' },
        { name: 'ORBIS（Bureau van Dijk）', url: 'https://orbis.bvdinfo.com', access: '高校付费', format: 'Excel', note: '全球企业财务，可自行计算行业集中度' },
      ],
    },
    {
      name: '投入产出表 / 产业链关联',
      tags: ['供应链', '产业关联'],
      sources: [
        { name: '国家统计局投入产出表', url: 'https://www.stats.gov.cn/sj/tjbz/tjypflml/202302/t20230213_1902717.html', access: '免费', format: 'Excel', note: '5年一更新（2017、2022），42/149部门' },
        { name: 'WIOD（世界投入产出库）', url: 'https://www.rug.nl/ggdc/valuechain/wiod', access: '免费', format: 'Excel/R', note: '跨国产业链，GVC 研究核心数据源' },
        { name: 'OECD TiVA（增加值贸易）', url: 'https://www.oecd.org/en/topics/sub-issues/trade-in-value-added.html', access: '免费', format: 'CSV/API', note: '各国出口中的国内增加值' },
        { name: 'ADB MRIO', url: 'https://mrio.adbx.online', access: '免费', format: 'Excel', note: '亚洲开发银行多区域投入产出表' },
      ],
    },
    {
      name: '专精特新 / 高新技术企业',
      tags: ['政策标签', '创新型企业'],
      sources: [
        { name: '工信部专精特新名单', url: 'https://www.miit.gov.cn', access: '免费', format: 'PDF/Excel', note: '历批次小巨人企业名单，需手工整理' },
        { name: 'CNRDS 高企认定库', url: 'https://www.cnrds.com', access: '高校付费', format: 'CSV', note: '上市公司高新技术资质历史变化' },
      ],
    },
    {
      name: '区域经济 / 城市层级数据',
      tags: ['空间经济', '城市经济学'],
      sources: [
        { name: '城市统计年鉴', url: 'https://data.stats.gov.cn', access: '免费', format: 'Excel', note: '地级市 GDP、人口、固投等年度数据' },
        { name: 'CHFS（家庭金融调查）', url: 'https://chfs.swufe.edu.cn', access: '注册免费', format: 'Stata', note: '西南财大，家庭金融资产与负债' },
        { name: '夜间灯光数据（DMSP/NPP-VIIRS）', url: 'https://ngdc.noaa.gov/eog/viirs', access: '免费', format: 'GeoTIFF', note: '代理 GDP，县/格网级经济活动强度' },
      ],
    },
  ],
});

// ── 补充分类：金融科技与数字经济 ────────────────────
DATA_CATEGORIES.push({
  id: 'fintech',
  icon: '💳',
  label: '金融科技',
  color: 'violet',
  desc: '数字普惠金融、移动支付、P2P、加密资产、数字经济指数等',
  variables: [
    {
      name: '数字普惠金融指数（北大数字金融）',
      tags: ['县市级', '数字金融'],
      sources: [
        { name: '北大数字金融研究中心', url: 'https://idf.pku.edu.cn/yjcg/zsbg/index.htm', access: '免费注册', format: 'Excel', note: '郭峰等人构建，覆盖2011-2021县区级，引用率极高' },
        { name: 'CNRDS 金融科技库', url: 'https://www.cnrds.com', access: '高校付费', format: 'CSV', note: '企业层面金融科技应用度量' },
      ],
    },
    {
      name: '数字经济规模 / 互联网渗透率',
      tags: ['省市级', '数字化转型'],
      sources: [
        { name: '中国信通院数字经济报告', url: 'https://www.caict.ac.cn', access: '免费', format: 'PDF/Excel', note: '省级数字经济占比，年度发布' },
        { name: 'CNNIC 互联网统计', url: 'https://www.cnnic.com.cn/IDR/ReportDownloads', access: '免费', format: 'PDF', note: '互联网用户、移动支付渗透率' },
        { name: 'ITU 数字发展指数', url: 'https://www.itu.int/itu-d/sites/statistics', access: '免费', format: 'CSV', note: '跨国数字基础设施与应用指数' },
      ],
    },
    {
      name: 'P2P 借贷 / 互联网金融',
      tags: ['网络借贷', '风险'],
      sources: [
        { name: '网贷之家历史数据', url: 'https://www.wdzj.com', access: '部分免费', format: '网页/CSV', note: 'P2P 平台运营数据（2012-2020）' },
        { name: 'LendingClub 数据集', url: 'https://www.kaggle.com/datasets/wordsforthewise/lending-club', access: '免费', format: 'CSV', note: '美国 P2P 贷款记录，含违约标签，Kaggle下载' },
      ],
    },
    {
      name: '股权众筹 / VC 投资数据',
      tags: ['初创企业', '风险投资'],
      sources: [
        { name: 'CVSource 投中数据', url: 'https://www.cvsource.com', access: '付费', format: 'Excel', note: '中国 VC/PE 投资数据库' },
        { name: 'Crunchbase', url: 'https://www.crunchbase.com', access: '部分免费/付费', format: 'CSV/API', note: '全球初创企业融资，API 可访问' },
        { name: 'VentureXpert（Thomson）', url: 'https://wrds-www.wharton.upenn.edu', access: '高校付费', format: 'CSV', note: 'WRDS 内，美国 VC 投资标准库' },
      ],
    },
  ],
});

// ── 补充分类：人工智能与机器学习研究 ────────────────
DATA_CATEGORIES.push({
  id: 'ai_data',
  icon: '🤖',
  label: 'AI / 机器学习',
  color: 'emerald',
  desc: 'AI 采用度、算法数据集、LLM 评估、劳动力替代风险等研究数据',
  variables: [
    {
      name: 'AI 采用度 / 企业数字化转型',
      tags: ['文本构建', '企业层面'],
      sources: [
        { name: 'CNRDS AI 词典（年报文本）', url: 'https://www.cnrds.com', access: '高校付费', format: 'CSV', note: '基于年报 MD&A 的 AI 关键词频率度量' },
        { name: '巨潮资讯（年报原文）', url: 'https://www.cninfo.com.cn', access: '免费', format: 'PDF', note: '自行构建 AI 词典后文本分析' },
        { name: 'Stanford AI Index', url: 'https://aiindex.stanford.edu/report', access: '免费', format: 'PDF/Excel', note: '全球 AI 投资、研究、采用趋势年报' },
      ],
    },
    {
      name: '职业自动化风险 / 任务替代',
      tags: ['劳动经济', '技能替代'],
      sources: [
        { name: 'Frey & Osborne 自动化概率', url: 'https://www.oxfordmartin.ox.ac.uk/downloads/academic/The_Future_of_Employment.pdf', access: '免费', format: 'PDF附表', note: '702个职业的自动化概率（2013），经典引用' },
        { name: 'O*NET 职业任务数据库', url: 'https://www.onetonline.org', access: '免费', format: 'CSV', note: '美国职业技能要求，构建任务变量基础' },
        { name: 'ISCO-O*NET 国际职业映射', url: 'https://ilostat.ilo.org/resources/concepts-and-definitions/classification-occupation', access: '免费', format: 'Excel', note: '将 O*NET 映射到国际职业分类标准' },
      ],
    },
    {
      name: 'LLM 能力评估数据集',
      tags: ['NLP Benchmark', 'LLM评估'],
      sources: [
        { name: 'MMLU（大规模多任务）', url: 'https://huggingface.co/datasets/cais/mmlu', access: '免费', format: 'JSON/Python', note: '57个学科，14000题，Hugging Face 下载' },
        { name: 'C-Eval（中文大模型评测）', url: 'https://cevalbenchmark.com', access: '免费', format: 'JSON', note: '52个中文学科，首个系统性中文 LLM 评测集' },
        { name: 'FinEval（金融领域）', url: 'https://huggingface.co/datasets/SUFE-AIFLM-Lab/FinEval', access: '免费', format: 'JSON', note: '金融专业知识评测，含证券/会计/经济' },
        { name: 'LMSYS Chatbot Arena', url: 'https://huggingface.co/datasets/lmsys/chatbot_arena_conversations', access: '免费', format: 'JSON', note: '人类偏好对话数据，ELO 排行榜原始数据' },
      ],
    },
    {
      name: '专利 / 技术创新（AI 相关）',
      tags: ['创新测度', '技术分类'],
      sources: [
        { name: 'PATSTAT AI 专利分类（CPC Y04S）', url: 'https://www.epo.org/searching-for-patents/business/patstat.html', access: '付费/学术申请', format: 'SQL', note: '按 IPC/CPC 代码筛选 AI 相关专利' },
        { name: 'WIPO AI 专利数据库', url: 'https://www.wipo.int/tech_trends/en/artificial_intelligence', access: '免费', format: 'CSV', note: 'WIPO 整理的 AI 专利趋势数据' },
      ],
    },
    {
      name: '机器学习标准数据集（实证/实验用）',
      tags: ['Benchmark', '方法对比'],
      sources: [
        { name: 'UCI Machine Learning Repository', url: 'https://archive.ics.uci.edu', access: '免费', format: 'CSV/ArFF', note: '600+经典数据集，算法测试标准来源' },
        { name: 'Kaggle Datasets', url: 'https://www.kaggle.com/datasets', access: '免费注册', format: 'CSV', note: '竞赛数据集，含金融/经济/文本多类型' },
        { name: 'Hugging Face Datasets', url: 'https://huggingface.co/datasets', access: '免费', format: 'Python API', note: 'NLP/多模态数据集，与 transformers 无缝集成' },
        { name: 'OpenML', url: 'https://www.openml.org', access: '免费', format: 'Python API', note: '可复现 ML 实验平台，含数据+流程' },
      ],
    },
  ],
});
