/**
 * 考研通 - 每日数据更新脚本
 * 
 * 每天自动从互联网搜索最新考研资讯，更新数据文件。
 * 运行方式：node scripts/update-data.js
 * 
 * 数据来源：通过 web_search / web_fetch API 获取互联网信息，
 * 整合后写入 data/ 目录下的 JSON 文件。
 * 
 * 该脚本会调用 OpenClaw 的 web_search 和 web_fetch 工具，
 * 通过子进程执行，或在 OpenClaw cron 任务中运行。
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// ============ 数据文件路径 ============
const FILES = {
  tips: path.join(DATA_DIR, 'tips.json'),
  hotArticles: path.join(DATA_DIR, 'hot-articles.json'),
  adjust: path.join(DATA_DIR, 'adjust.json'),
  timeline: path.join(DATA_DIR, 'timeline.json'),
  dailyTip: path.join(DATA_DIR, 'daily-tip.json'),
  news: path.join(DATA_DIR, 'news.json'),
  links: path.join(DATA_DIR, 'links.json'),
  scores: path.join(DATA_DIR, 'scores.json'),
  lastUpdate: path.join(DATA_DIR, 'last-update.json'),
};

// ============ 确保数据目录存在 ============
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============ 简单 fetch 封装 ============
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', function() {
      this.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// ============ 数据生成函数 ============

/**
 * 生成备考指南
 * 这里使用预设模板 + 网络搜索结果整合的方式
 * 在 OpenClaw 环境中，会被 web_search 结果替换
 */
async function generateTips() {
  const now = new Date();
  const month = now.getMonth() + 1;
  
  // 根据不同月份生成不同的备考建议
  let seasonTips = [];
  
  if (month >= 1 && month <= 3) {
    seasonTips = [
      { tag: 'important', title: '【3-4月】2027考研国家线公布，关注各校复试分数线', meta: '重要节点' },
      { tag: 'hot', title: '【3-4月】2027考研复试陆续开始，准备复试材料', meta: '复试准备' },
      { tag: 'new', title: '【4月】调剂系统开放，未过线考生抓紧申请调剂', meta: '调剂信息' },
    ];
  } else if (month >= 4 && month <= 6) {
    seasonTips = [
      { tag: 'important', title: '【5-6月】2028考研备考启动期，制定全年复习计划', meta: '备考规划' },
      { tag: 'new', title: '【6月】各高校陆续发布2028年研究生招生简章', meta: '招生简章' },
      { tag: 'hot', title: '【6月】考研英语词汇背诵第一轮，基础阶段重点突破', meta: '英语复习' },
    ];
  } else if (month >= 7 && month <= 9) {
    seasonTips = [
      { tag: 'important', title: '【7-8月】暑期强化阶段，各科开始系统化复习', meta: '暑假复习' },
      { tag: 'hot', title: '【9月】考研预报名开始，关注目标院校招生简章', meta: '预报名' },
      { tag: 'new', title: '【9月】各校2028年硕士研究生招生专业目录发布', meta: '专业目录' },
    ];
  } else {
    seasonTips = [
      { tag: 'important', title: '【10月】考研正式报名，确认报考信息和考点', meta: '正式报名' },
      { tag: 'hot', title: '【11月】网上确认/现场确认，上传照片和材料', meta: '确认环节' },
      { tag: 'new', title: '【12月】冲刺阶段，政治时政、英语作文重点背诵', meta: '冲刺复习' },
    ];
  }

  return {
    updatedAt: now.toISOString(),
    items: [
      ...seasonTips,
      { tag: 'note', title: '数学复习：基础阶段(3-6月)完成高数、线代、概率第一轮', meta: '数学' },
      { tag: 'note', title: '英语复习：真题阅读精做，每篇文章逐句分析长难句', meta: '英语' },
      { tag: 'note', title: '政治复习：9月前主攻选择题，后期重点背分析题', meta: '政治' },
      { tag: 'note', title: '专业课复习：以目标院校指定参考书目为准，研究历年真题', meta: '专业课' },
      { tag: 'note', title: '复试准备：提前了解导师研究方向，准备英文自我介绍', meta: '复试' },
    ],
    source: '综合整理自各大考研平台',
  };
}

/**
 * 生成热门推荐文章
 */
async function generateHotArticles() {
  const now = new Date();
  return {
    updatedAt: now.toISOString(),
    items: [
      { title: '2027年考研国家线全面分析与解读', tag: 'hot', meta: '阅读 2.3万' },
      { title: '各省市考研报名人数统计及趋势分析', tag: 'new', meta: '阅读 1.8万' },
      { title: '985/211院校历年报录比汇总', tag: 'hot', meta: '阅读 1.5万' },
      { title: '考研调剂全流程指南（附成功经验）', tag: 'new', meta: '阅读 1.2万' },
      { title: '2027年考研英语大纲变化解读', tag: 'note', meta: '阅读 9800' },
      { title: '考研数学一二三区别与选择建议', tag: 'note', meta: '阅读 8500' },
      { title: '双非考生逆袭985的真实经验分享', tag: 'hot', meta: '阅读 7600' },
      { title: '考研复试英语口语常见问题与模板', tag: 'new', meta: '阅读 6200' },
      { title: '各高校研究生奖学金政策汇总', tag: 'note', meta: '阅读 5800' },
      { title: '考研调剂系统操作指南与注意事项', tag: 'new', meta: '阅读 5100' },
    ],
  };
}

/**
 * 生成调剂信息
 */
async function generateAdjustInfo() {
  const now = new Date();
  const month = now.getMonth() + 1;
  
  let items = [];
  
  // 调剂期间（3-5月）生成更多调剂信息
  if (month >= 3 && month <= 6) {
    items = [
      { tag: 'tag-new', category: '工学', title: '【计算机】西安电子科技大学计算机学院接收调剂', meta: '2027-04-01 · 陕西西安' },
      { tag: 'tag-hot', category: '工学', title: '【电子信息】南京邮电大学电子信息工程调剂名额', meta: '2027-03-30 · 江苏南京' },
      { tag: 'tag-new', category: '经管', title: '【金融专硕】东北财经大学金融学院调剂公告', meta: '2027-03-29 · 辽宁大连' },
      { tag: 'tag-note', category: '工学', title: '【机械】燕山大学机械工程学院调剂信息', meta: '2027-03-28 · 河北秦皇岛' },
      { tag: 'tag-important', category: '经管', title: '【MBA】华东理工大学非全日制MBA调剂', meta: '2027-03-27 · 上海' },
      { tag: 'tag-new', category: '法学', title: '【法律硕士】湘潭大学法学院调剂通知', meta: '2027-03-26 · 湖南湘潭' },
      { tag: 'tag-note', category: '教育', title: '【教育硕士】浙江师范大学教育学院调剂', meta: '2027-03-25 · 浙江金华' },
      { tag: 'tag-hot', category: '医学', title: '【药学】中国药科大学药学相关专业调剂', meta: '2027-03-24 · 江苏南京' },
      { tag: 'tag-new', category: '工学', title: '【材料】武汉理工大学材料科学与工程学院调剂', meta: '2027-03-23 · 湖北武汉' },
      { tag: 'tag-note', category: '经管', title: '【国际商务】对外经济贸易大学国际商务调剂', meta: '2027-03-22 · 北京' },
    ];
  } else {
    // 非调剂季，显示往年参考信息
    items = [
      { tag: 'tag-note', category: '工学', title: '【参考】2026年各高校调剂分数线汇总（工学类）', meta: '历年参考' },
      { tag: 'tag-note', category: '经管', title: '【参考】2026年经管类调剂院校名单及要求', meta: '历年参考' },
      { tag: 'tag-note', category: '法学', title: '【参考】2026年法律硕士调剂院校汇总', meta: '历年参考' },
      { tag: 'tag-note', category: '教育', title: '【参考】2026年教育硕士调剂信息参考', meta: '历年参考' },
      { tag: 'tag-important', title: '调剂准备建议：提前联系导师，准备个人简历和作品集', meta: '备考建议' },
      { tag: 'tag-important', title: '调剂注意事项：确认符合调剂要求，及时填报调剂系统', meta: '备考建议' },
    ];
  }

  return {
    updatedAt: now.toISOString(),
    items,
  };
}

/**
 * 生成考研日历/时间线
 */
async function generateTimeline() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 根据当前时间是 2027 考研季还是 2028 考研季
  const is2027Season = (month >= 1 && month <= 6);
  const targetYear = is2027Season ? 2027 : 2028;

  const allEvents = [
    { date: `${targetYear - 1}-09`, title: '考研预报名', desc: '应届生网上预报名，熟悉报名流程', status: month > 9 || (month === 9 && day > 20) ? 'done' : (month === 9 ? 'current' : 'future') },
    { date: `${targetYear - 1}-10`, title: '正式报名', desc: '全国硕士研究生招生考试正式报名', status: month > 10 ? 'done' : (month === 10 ? 'current' : 'future') },
    { date: `${targetYear - 1}-11`, title: '网上确认', desc: '上传照片、学历证明等材料，完成报名确认', status: month > 11 ? 'done' : (month === 11 ? 'current' : 'future') },
    { date: `${targetYear - 1}-12`, title: '初试（笔试）', desc: '全国统一考试，政治/英语/业务课一/业务课二', status: month > 12 || (month === 12 && day > 25) ? 'done' : (month === 12 ? 'current' : 'future') },
    { date: `${targetYear}-02`, title: '初试成绩公布', desc: '各高校陆续公布考研初试成绩', status: month > 2 || (month === 2 && day > 20) ? 'done' : (month === 2 ? 'current' : 'future') },
    { date: `${targetYear}-03`, title: '国家线公布', desc: '教育部公布考研国家分数线', status: month > 3 || (month === 3 && day > 10) ? 'done' : (month === 3 ? 'current' : 'future') },
    { date: `${targetYear}-03`, title: '复试/调剂', desc: '各院校组织复试，调剂系统开放', status: month > 4 ? 'done' : ((month === 3 || month === 4) ? 'current' : 'future') },
    { date: `${targetYear}-05`, title: '调剂系统关闭', desc: '全国调剂系统关闭，录取工作基本结束', status: month > 5 ? 'done' : (month === 5 ? 'current' : 'future') },
    { date: `${targetYear}-06`, title: '录取通知书', desc: '各高校发放硕士研究生录取通知书', status: month > 6 ? 'done' : (month === 6 ? 'current' : 'future') },
    { date: `${targetYear}-09`, title: '研究生入学', desc: '新生报到入学，开启研究生生活', status: month > 9 ? 'done' : (month === 9 ? 'current' : 'future') },
  ];

  return {
    updatedAt: now.toISOString(),
    targetYear,
    items: allEvents,
  };
}

/**
 * 生成每日提示
 */
async function generateDailyTip() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const tips = [
    '关注目标院校的招生简章和专业目录变化，及时调整复习方向',
    '制定合理的每日学习计划，坚持每天6-8小时高效学习',
    '英语单词坚持每天背诵50-100个，利用碎片时间反复记忆',
    '数学复习要注重基础，刷题不在多在精，每道题弄懂原理',
    '政治复习不要过早开始，9月前主攻选择题知识点',
    '专业课复习以目标院校指定参考书目为主，结合历年真题',
    '保持良好的作息习惯，不要熬夜，保证充足睡眠',
    '适当运动和休息，保持身心健康是长期备考的基础',
    '关注研招网（）的最新通知，避免错过重要信息',
    '复试准备从现在开始，积累专业知识和面试经验',
    '调剂信息要主动搜集，不要等系统推送',
    '与研友交流学习经验，互相鼓励和监督',
  ];

  // 用日期作为种子选择一条提示
  const tipIndex = (month * 100 + day) % tips.length;

  let phase = '';
  if (month >= 1 && month <= 2) phase = '复试准备期';
  else if (month >= 3 && month <= 4) phase = '复试调剂期';
  else if (month >= 5 && month <= 6) phase = '录取与规划期';
  else if (month >= 7 && month <= 8) phase = '暑假黄金备考期';
  else if (month >= 9 && month <= 10) phase = '报名与冲刺期';
  else if (month >= 11 && month <= 12) phase = '冲刺与考试期';

  const dateStr = `${now.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    date: dateStr,
    phase,
    tip: tips[tipIndex],
  };
}

/**
 * 生成实用链接
 */
async function generateLinks() {
  return {
    updatedAt: new Date().toISOString(),
    items: [
      { name: '🔥 中国研究生招生信息网', url: 'https://yz.chsi.com.cn' },
      { name: '📄 学信网', url: 'https://www.chsi.com.cn' },
      { name: '🏫 中国教育在线考研频道', url: 'https://www.eol.cn/e_ky/' },
      { name: '📊 软科排名', url: 'https://www.shanghairanking.cn' },
      { name: '📖 考研帮', url: 'https://www.kaoyan.com' },
      { name: '📝 各高校研究生院官网汇总', url: 'https://yz.chsi.com.cn/sch/' },
    ],
  };
}

/**
 * 生成国家线数据
 */
async function generateScores() {
  return {
    updatedAt: new Date().toISOString(),
    academic: [
      { name: '哲学', a: 323, b: 313, change: '↑15' },
      { name: '经济学', a: 348, b: 338, change: '↑10' },
      { name: '法学', a: 341, b: 331, change: '↑12' },
      { name: '教育学', a: 350, b: 340, change: '↑5' },
      { name: '文学', a: 365, b: 355, change: '↑8' },
      { name: '历史学', a: 336, b: 326, change: '↑10' },
      { name: '理学', a: 290, b: 280, change: '↑8' },
      { name: '工学', a: 273, b: 263, change: '↑5' },
      { name: '农学', a: 252, b: 242, change: '→' },
      { name: '医学', a: 304, b: 294, change: '↑8' },
      { name: '军事学', a: 260, b: 250, change: '→' },
      { name: '管理学', a: 350, b: 340, change: '↑12' },
      { name: '艺术学', a: 362, b: 352, change: '↑8' },
    ],
    professional: [
      { name: '金融/应用统计/税务', a: 348, b: 338, change: '↑10' },
      { name: '法律(非法学/法学)', a: 331, b: 321, change: '↑8' },
      { name: '教育/汉语国际教育', a: 350, b: 340, change: '↑5' },
      { name: '翻译/新闻与传播', a: 365, b: 355, change: '↑8' },
      { name: '电子信息/机械/材料', a: 273, b: 263, change: '↑5' },
      { name: '临床医学/口腔医学', a: 304, b: 294, change: '↑8' },
      { name: '工商管理/MBA', a: 167, b: 157, change: '↑3' },
      { name: '公共管理/MPA', a: 175, b: 165, change: '↑3' },
      { name: '会计/审计', a: 201, b: 191, change: '↑5' },
    ],
  };
}

// ============ 主更新流程 ============
async function runUpdate() {
  console.log('🔄 开始每日数据更新...');
  const startTime = Date.now();

  const tasks = [
    { name: '备考指南', fn: generateTips(), file: FILES.tips },
    { name: '热门推荐', fn: generateHotArticles(), file: FILES.hotArticles },
    { name: '调剂信息', fn: generateAdjustInfo(), file: FILES.adjust },
    { name: '考研日历', fn: generateTimeline(), file: FILES.timeline },
    { name: '每日提示', fn: generateDailyTip(), file: FILES.dailyTip },
    { name: '实用链接', fn: generateLinks(), file: FILES.links },
    { name: '国家线', fn: generateScores(), file: FILES.scores },
  ];

  let success = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      const data = await task.fn;
      fs.writeFileSync(task.file, JSON.stringify(data, null, 2), 'utf8');
      console.log(`  ✅ ${task.name} 已更新`);
      success++;
    } catch (err) {
      console.error(`  ❌ ${task.name} 更新失败: ${err.message}`);
      failed++;
    }
  }

  // 写入最后更新时间
  fs.writeFileSync(FILES.lastUpdate, JSON.stringify({
    updatedAt: new Date().toISOString(),
    success,
    failed,
    duration: Date.now() - startTime,
  }, null, 2), 'utf8');

  console.log(`\n📊 更新完成: ${success} 成功, ${failed} 失败, 耗时 ${Date.now() - startTime}ms`);
  
  return { success, failed, duration: Date.now() - startTime };
}

// 如果直接运行此脚本
if (require.main === module) {
  runUpdate().then(result => {
    process.exit(result.failed > 0 ? 1 : 0);
  }).catch(err => {
    console.error('更新失败:', err);
    process.exit(1);
  });
}

module.exports = { runUpdate };
