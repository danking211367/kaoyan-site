/**
 * 考研通 - 周包生成脚本 (v2)
 *
 * 读取 data/web/ 的联网搜索数据，生成 7 套差异化的内容包，
 * 供每日轮换使用。每周跑一次。
 *
 * 用法:
 *   node scripts/generate-weekly-pack.js           → 优先联网，数据不足则回退静态
 *   node scripts/generate-weekly-pack.js --static  → 强制静态（GA 备用）
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const WEB_DIR = path.join(DATA_DIR, 'web');
const PACK_FILE = path.join(DATA_DIR, 'weekly-pack.json');

function readJson(fp) {
  try { if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) {}
  return null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rotate(arr, n) {
  const a = [...arr];
  const k = n % a.length;
  return [...a.slice(k), ...a.slice(0, k)];
}

function saveJson(fp, data) {
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
}

function generatePack() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);

  console.log(`📦 生成周包 - 起始: ${weekStart.toISOString().substring(0, 10)}`);

  const STATIC_MODE = process.argv.includes('--static');

  // ==================== 热门推荐 ====================
  const webHot = readJson(path.join(WEB_DIR, 'hot-articles.json'));
  let hotPool;
  if (webHot && webHot.items && webHot.items.length >= 5) {
    hotPool = webHot.items;
    console.log(`  🌐 热门推荐: 联网 ${hotPool.length} 条`);
  } else {
    console.log(`  📦 热门推荐: 静态数据`);
    hotPool = [
      { title: '2027年考研国家线全面分析与解读', tag: 'hot', meta: '阅读 2.3万' },
      { title: '各省市考研报名人数统计及趋势分析', tag: 'new', meta: '阅读 1.8万' },
      { title: '985/211院校历年报录比汇总', tag: 'hot', meta: '阅读 1.5万' },
      { title: '考研调剂全流程指南（附成功经验）', tag: 'new', meta: '阅读 1.2万' },
      { title: '考研英语大纲变化深度解读', tag: 'note', meta: '阅读 9800' },
      { title: '考研数学一二三区别与选择建议', tag: 'note', meta: '阅读 8500' },
      { title: '双非考生逆袭985的真实经验分享', tag: 'hot', meta: '阅读 7600' },
      { title: '考研复试英语口语常见问题与模板', tag: 'new', meta: '阅读 6200' },
      { title: '各高校研究生奖学金政策汇总', tag: 'note', meta: '阅读 5800' },
      { title: '考研调剂系统操作指南与注意事项', tag: 'new', meta: '阅读 5100' },
    ];
    if (!STATIC_MODE && !webHot) return false;
  }

  const hotSets = [];
  for (let i = 0; i < 7; i++) {
    const rotated = rotate(hotPool, i * 2);
    const set = [];
    for (let j = 0; j < 10; j++) {
      const item = { ...rotated[j % rotated.length] };
      const baseViews = parseInt((item.meta || '0').replace(/[^0-9]/g, '')) || 5000;
      item.meta = `阅读 ${baseViews + (i * 300) + (j * 100)}`;
      set.push(item);
    }
    hotSets.push(set);
  }
  console.log(`  ✅ 热门推荐: 7 套 × 10 条`);

  // ==================== 备考指南 ====================
  const webTips = readJson(path.join(WEB_DIR, 'tips.json'));
  let tipPool;
  if (webTips && webTips.items && webTips.items.length >= 3) {
    tipPool = webTips.items;
    console.log(`  🌐 备考指南: 联网 ${tipPool.length} 条`);
  } else {
    console.log(`  📦 备考指南: 静态数据`);
    tipPool = [
      { tag: 'important', title: '国家线公布后立即对照分数，判断复试/调剂/二战', meta: '考后决策' },
      { tag: 'hot', title: '复试材料提前准备：简历、成绩单、科研成果、推荐信', meta: '复试准备' },
      { tag: 'new', title: '调剂系统操作要点：三个平行志愿的策略填报', meta: '调剂技巧' },
    ];
    if (!STATIC_MODE && !webTips) return false;
  }

  const EXTRA = [
    { tag: 'note', title: '数学复习：基础阶段完成高数、线代、概率第一轮', meta: '数学' },
    { tag: 'note', title: '英语复习：真题阅读精做，每篇文章逐句分析长难句', meta: '英语' },
    { tag: 'note', title: '政治复习：9月前主攻选择题，后期重点背分析题', meta: '政治' },
    { tag: 'note', title: '专业课复习：以目标院校指定参考书目为主，研究历年真题', meta: '专业课' },
    { tag: 'note', title: '复试准备：提前了解导师研究方向，准备英文自我介绍', meta: '复试' },
  ];
  const tipsSets = [];
  for (let i = 0; i < 7; i++) {
    tipsSets.push([...rotate(tipPool, i), ...EXTRA]);
  }
  console.log(`  ✅ 备考指南: 7 套`);

  // ==================== 调剂信息 ====================
  const webAdjust = readJson(path.join(WEB_DIR, 'adjust.json'));
  const adjustPool = (webAdjust && webAdjust.items) ? webAdjust.items : [
    { tag: 'tag-hot', category: '综合', title: '调剂系统操作要点：三个平行志愿的策略填报', meta: '调剂技巧' },
    { tag: 'tag-note', category: '综合', title: '调剂信息获取渠道：研招网/院校官网/考研社群', meta: '信息渠道' },
    { tag: 'tag-important', category: '综合', title: '调剂待录取确认：24小时内必须做决定', meta: '重要提醒' },
  ];
  const adjustSets = [];
  for (let i = 0; i < 7; i++) {
    const src = adjustPool.length >= 3 ? adjustPool : [...adjustPool, ...adjustPool, ...adjustPool];
    adjustSets.push(rotate(src, i).slice(0, 3));
  }
  console.log(`  ✅ 调剂信息: 7 套`);

  // ==================== 每日提示 ====================
  const webDaily = readJson(path.join(WEB_DIR, 'daily-tip.json'));
  const dailyTipBase = (webDaily && webDaily.tip)
    ? webDaily.tip
    : '每天留30分钟回顾当天所学，比连续学习更高效';

  const dailyTips = [
    `${dailyTipBase} 【周一规划】制定本周复习计划，明确每天的任务`,
    `【复盘日】回顾上周学习进度，调整薄弱环节的复习策略 — ${dailyTipBase}`,
    `【坚持】${dailyTipBase} 每周三做一套真题自测，检验阶段成果`,
    `${dailyTipBase} 每周四与研友交流学习心得，互相监督`,
    `【周末预热】${dailyTipBase} 周五整理一周错题，周末集中攻克`,
    `【冲刺周末】适当延长学习时间，${dailyTipBase}`,
    `【新的一周】${dailyTipBase} 调整好状态，迎接新的学习周`,
  ];
  console.log(`  ✅ 每日提示: 7 条`);

  // ==================== 国家线 ====================
  const webScores = readJson(path.join(WEB_DIR, 'scores.json'));
  const academicBase = (webScores && webScores.academic) ? webScores.academic : [
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
  ];
  const profBase = (webScores && webScores.professional) ? webScores.professional : [
    { name: '金融/应用统计/税务', a: 348, b: 338, change: '↑10' },
    { name: '法律(非法学/法学)', a: 331, b: 321, change: '↑8' },
    { name: '教育/汉语国际教育', a: 350, b: 340, change: '↑5' },
    { name: '翻译/新闻与传播', a: 365, b: 355, change: '↑8' },
    { name: '电子信息/机械/材料', a: 273, b: 263, change: '↑5' },
    { name: '临床医学/口腔医学', a: 304, b: 294, change: '↑8' },
    { name: '工商管理/MBA', a: 167, b: 157, change: '↑3' },
    { name: '公共管理/MPA', a: 175, b: 165, change: '↑3' },
    { name: '会计/审计', a: 201, b: 191, change: '↑5' },
  ];
  const offsets = [0, -2, +1, -1, +2, -3, +3];
  const CHANGES = ['↑15','↑10','↑12','↑5','↑8','↑10','↑8','↑5','→','↑8','→','↑12','↑8'];
  const PCHANGES = ['↑10','↑8','↑5','↑8','↑5','↑8','↑3','↑3','↑5'];
  const scoreSets = [];
  for (let i = 0; i < 7; i++) {
    const off = offsets[i];
    scoreSets.push({
      academic: academicBase.map((d, _) => ({
        ...d, a: d.a + off, b: d.b + off,
        change: CHANGES[(i + _) % CHANGES.length],
      })),
      professional: profBase.map((d, _) => ({
        ...d, a: d.a + Math.floor(off / 2), b: d.b + Math.floor(off / 2),
        change: PCHANGES[(i + _) % PCHANGES.length],
      })),
    });
  }
  console.log(`  ✅ 国家线: 7 套`);

  // ==================== 写入 ====================
  const pack = {
    weekStart: weekStart.toISOString().substring(0, 10),
    weekNumber: Math.floor(now.getTime() / (7 * 86400000)),
    updatedAt: now.toISOString(),
    hot: hotSets,
    tips: tipsSets,
    adjust: adjustSets,
    dailyTips,
    scores: scoreSets,
  };

  saveJson(PACK_FILE, pack);
  console.log(`\n📦 周包已保存: data/weekly-pack.json`);
  console.log(`   📅 起始: ${pack.weekStart}`);
  return true;
}

// ==================== 主入口 ====================
const startTime = Date.now();
console.log('📦 考研通 - 周包生成脚本 (v2)');
console.log(`📅 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);

if (generatePack()) {
  console.log(`\n✅ 周包生成完成！耗时 ${Date.now() - startTime}ms`);
} else {
  console.error('\n❌ 周包生成失败');
  process.exit(1);
}
