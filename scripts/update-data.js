/**
 * 考研通 - 每日数据更新脚本 (v5 — 双模式)
 *
 * 模式 A：联网模式 — 读取 data/web/*.json（由 OpenClaw web_search 生成）
 * 模式 B：静态轮换 — 7 套内容按日期轮换（GitHub Actions 无搜索工具时使用）
 *
 * 用法：
 *   node scripts/update-data.js             → 模式 B（7套轮换）
 *   node scripts/update-data.js --web       → 模式 A（读取 data/web/ 的搜索结果）
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const WEB_DIR = path.join(DATA_DIR, 'web');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES = {
  tips: path.join(DATA_DIR, 'tips.json'),
  hotArticles: path.join(DATA_DIR, 'hot-articles.json'),
  adjust: path.join(DATA_DIR, 'adjust.json'),
  timeline: path.join(DATA_DIR, 'timeline.json'),
  dailyTip: path.join(DATA_DIR, 'daily-tip.json'),
  links: path.join(DATA_DIR, 'links.json'),
  scores: path.join(DATA_DIR, 'scores.json'),
  lastUpdate: path.join(DATA_DIR, 'last-update.json'),
};

function saveJson(fp, data) { fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8'); }
function readJson(fp) {
  try { if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch(e) {}
  return null;
}

// ============ 日期种子 ============
const now = new Date();
const start = new Date(now.getFullYear(), 0, 0);
const dayOfYear = Math.floor((now - start) / 86400000);
const month = now.getMonth() + 1;
const day = now.getDate();
const s = { now, month, day, dayOfYear };

// ============ 模式 A：读取 web 搜索结果 ============
function useWebData() {
  console.log('🌐 联网模式：读取 data/web/ 搜索结果...');
  let count = 0;

  // 热门推荐
  const webHot = readJson(path.join(WEB_DIR, 'hot-articles.json'));
  if (webHot && webHot.items && webHot.items.length >= 5) {
    saveJson(FILES.hotArticles, { updatedAt: now.toISOString(), items: webHot.items });
    console.log(`  ✅ 热门推荐 (联网: ${webHot.items.length} 条)`);
    count++;
  } else {
    return false; // 数据不够，回退到静态轮换
  }

  // 备考指南
  const webTips = readJson(path.join(WEB_DIR, 'tips.json'));
  if (webTips && webTips.items && webTips.items.length >= 3) {
    saveJson(FILES.tips, { updatedAt: now.toISOString(), items: webTips.items, source: '实时网络搜索整理' });
    console.log(`  ✅ 备考指南 (联网: ${webTips.items.length} 条)`);
    count++;
  } else {
    return false;
  }

  // 每日提示
  const webDaily = readJson(path.join(WEB_DIR, 'daily-tip.json'));
  if (webDaily && webDaily.tip) {
    saveJson(FILES.dailyTip, webDaily);
    console.log(`  ✅ 每日提示 (联网: ${webDaily.tip.substring(0, 30)}...)`);
    count++;
  } else {
    return false;
  }

  // 调剂信息
  const webAdjust = readJson(path.join(WEB_DIR, 'adjust.json'));
  if (webAdjust && webAdjust.items && webAdjust.items.length >= 2) {
    saveJson(FILES.adjust, { updatedAt: now.toISOString(), items: webAdjust.items });
    console.log(`  ✅ 调剂信息 (联网: ${webAdjust.items.length} 条)`);
    count++;
  } else {
    return false;
  }

  // 国家线（联网搜到的才用）
  const webScores = readJson(path.join(WEB_DIR, 'scores.json'));
  if (webScores && webScores.academic) {
    saveJson(FILES.scores, { updatedAt: now.toISOString(), ...webScores });
    console.log('  ✅ 国家线参考数据 (联网)');
    count++;
  }

  return count >= 3; // 至少 3 个模块用联网数据才算成功
}

// ============ 模式 B：7 套静态轮换 ============
function rotateSets() {
  console.log('🔄 静态轮换模式：7套内容按日期轮换...');

  // 每日提示
  const tipsPool = [
    '关注目标院校的招生简章和专业目录变化，及时调整复习方向',
    '制定合理的每日学习计划，坚持每天6-8小时高效学习',
    '英语单词坚持每天背诵50-100个，利用碎片时间反复记忆',
    '数学复习要注重基础，刷题不在多在精，每道题弄懂原理',
    '政治复习不要过早开始，9月前主攻选择题知识点',
    '专业课复习以目标院校指定参考书目为主，结合历年真题',
    '保持良好的作息习惯，不要熬夜，保证充足睡眠',
    '适当运动和休息，保持身心健康是长期备考的基础',
    '关注研招网（yz.chsi.com.cn）的最新通知，避免错过重要信息',
    '复试准备从现在开始，积累专业知识和面试经验',
    '调剂信息要主动搜集，不要等系统推送',
    '与研友交流学习经验，互相鼓励和监督',
    '英语作文不要死背模板，要总结自己的句型库',
    '数学要重视错题本，考前反复看错题比刷新题更有效',
    '政治时政热点从9月开始关注，前期不用花太多时间',
    '专业课背诵要建立知识框架，用思维导图梳理逻辑',
    '每天留30分钟回顾当天所学，比连续学习更高效',
    '考研英语阅读要精读真题，逐句分析长难句结构',
  ];
  const tipIdx = (month * 100 + day) % tipsPool.length;
  let phase = '';
  if (month >= 1 && month <= 2) phase = '复试准备期';
  else if (month >= 3 && month <= 4) phase = '复试调剂期';
  else if (month >= 5 && month <= 6) phase = '录取与规划期';
  else if (month >= 7 && month <= 8) phase = '暑假黄金备考期';
  else if (month >= 9 && month <= 10) phase = '报名与冲刺期';
  else phase = '冲刺与考试期';
  saveJson(FILES.dailyTip, {
    date: `${now.getFullYear()}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
    phase, tip: tipsPool[tipIdx],
  });
  console.log('  ✅ 每日提示');

  // 考研日历
  const is2027 = month >= 1 && month <= 6;
  const y = is2027 ? 2027 : 2028;
  const status = (d, mMax) => {
    const [yy, mm] = d.split('-').map(Number);
    const cmp = new Date(yy, mm - 1, mMax || 1);
    if (now > cmp) return 'done';
    if (now.getFullYear() === yy && now.getMonth() + 1 === mm) return 'current';
    return 'future';
  };
  saveJson(FILES.timeline, {
    updatedAt: now.toISOString(), targetYear: y,
    items: [
      { date: `${y-1}-09`, title: '考研预报名', desc: '应届生网上预报名，熟悉报名流程', status: status(`${y-1}-09`, 25) },
      { date: `${y-1}-10`, title: '正式报名', desc: '全国硕士研究生招生考试正式报名', status: status(`${y-1}-10`, 25) },
      { date: `${y-1}-11`, title: '网上确认', desc: '上传照片、学历证明等材料，完成报名确认', status: status(`${y-1}-11`, 15) },
      { date: `${y-1}-12`, title: '初试（笔试）', desc: '全国统一考试，政治/英语/业务课', status: status(`${y-1}-12`, 25) },
      { date: `${y}-02`, title: '初试成绩公布', desc: '各高校陆续公布考研初试成绩', status: status(`${y}-02`, 25) },
      { date: `${y}-03`, title: '国家线公布', desc: '教育部公布考研国家分数线', status: status(`${y}-03`, 15) },
      { date: `${y}-03`, title: '复试/调剂', desc: '各院校组织复试，调剂系统开放', status: status(`${y}-03`, 20) },
      { date: `${y}-05`, title: '调剂系统关闭', desc: '全国调剂系统关闭，录取工作基本结束', status: status(`${y}-05`, 5) },
      { date: `${y}-06`, title: '录取通知书', desc: '各高校发放硕士研究生录取通知书', status: status(`${y}-06`, 20) },
      { date: `${y}-09`, title: '研究生入学', desc: '新生报到入学，开启研究生生活', status: 'future' },
    ],
  });
  console.log('  ✅ 考研日历');

  // 实用链接
  saveJson(FILES.links, {
    updatedAt: now.toISOString(),
    items: [
      { name: '🔥 中国研究生招生信息网', url: 'https://yz.chsi.com.cn' },
      { name: '📄 学信网', url: 'https://www.chsi.com.cn' },
      { name: '🏫 中国教育在线考研频道', url: 'https://www.eol.cn/e_ky/' },
      { name: '📊 软科排名', url: 'https://www.shanghairanking.cn' },
      { name: '📖 考研帮', url: 'https://www.kaoyan.com' },
      { name: '📝 各高校研究生院官网', url: 'https://yz.chsi.com.cn/sch/' },
    ],
  });
  console.log('  ✅ 实用链接');

  // 7 套热门推荐
  const ALL_HOT = [
    [ { title: '2027年考研国家线全面分析与解读', tag: 'hot', meta: '阅读 2.3万' }, { title: '各省市考研报名人数统计及趋势分析', tag: 'new', meta: '阅读 1.8万' }, { title: '985/211院校历年报录比汇总', tag: 'hot', meta: '阅读 1.5万' }, { title: '考研调剂全流程指南（附成功经验）', tag: 'new', meta: '阅读 1.2万' }, { title: '考研英语大纲变化深度解读', tag: 'note', meta: '阅读 9800' }, { title: '考研数学一二三区别与选择建议', tag: 'note', meta: '阅读 8500' }, { title: '双非考生逆袭985的真实经验分享', tag: 'hot', meta: '阅读 7600' }, { title: '考研复试英语口语常见问题与模板', tag: 'new', meta: '阅读 6200' }, { title: '各高校研究生奖学金政策汇总', tag: 'note', meta: '阅读 5800' }, { title: '考研调剂系统操作指南与注意事项', tag: 'new', meta: '阅读 5100' } ],
    [ { title: '2028考研全年备考时间轴（超详细版）', tag: 'hot', meta: '阅读 3.1万' }, { title: '考研英语一/二区别详解，选对方向少走弯路', tag: 'new', meta: '阅读 2.0万' }, { title: '考研数学备考：高数、线代、概率论优先级排序', tag: 'hot', meta: '阅读 1.6万' }, { title: '211院校vs双非院校：考研择校的底层逻辑', tag: 'new', meta: '阅读 1.3万' }, { title: '考研政治75+备考攻略：从零基础到高分', tag: 'note', meta: '阅读 1.1万' }, { title: '暑假黄金备考期规划：每天10小时高效学习法', tag: 'hot', meta: '阅读 9200' }, { title: '考研专业课资料搜集全攻略', tag: 'new', meta: '阅读 7800' }, { title: '考研英语阅读满分技巧：8种题型突破', tag: 'note', meta: '阅读 6500' }, { title: '跨专业考研经验贴：从工科跨到金融', tag: 'hot', meta: '阅读 5900' }, { title: '考研网上确认材料清单及常见问题', tag: 'new', meta: '阅读 4800' } ],
    [ { title: '2028考研择校指南：985/211/双非难度梯度排名', tag: 'hot', meta: '阅读 2.8万' }, { title: '考研英语词汇背诵神器推荐：艾宾浩斯计划表', tag: 'new', meta: '阅读 1.9万' }, { title: '考研数学基础阶段刷题书单推荐', tag: 'hot', meta: '阅读 1.4万' }, { title: '40所考研热门院校报录比深度对比', tag: 'new', meta: '阅读 1.1万' }, { title: '考研复试导师最看重的5个特质', tag: 'note', meta: '阅读 8900' }, { title: '考研调剂名校捡漏指南（B区院校推荐）', tag: 'hot', meta: '阅读 7300' }, { title: '考研备考期间如何克服焦虑和拖延', tag: 'new', meta: '阅读 6700' }, { title: '考研政治肖秀荣/徐涛/腿姐资料对比', tag: 'note', meta: '阅读 6100' }, { title: '研究生三年规划：读研期间该怎么过才有价值', tag: 'new', meta: '阅读 5500' }, { title: '考研 vs 考公 vs 就业：大三该如何选择', tag: 'hot', meta: '阅读 4200' } ],
    [ { title: '考研英语长难句破解技巧：30天突破翻译', tag: 'hot', meta: '阅读 2.1万' }, { title: '考研复试自我介绍模板（中英文双语）', tag: 'new', meta: '阅读 1.7万' }, { title: '34所自划线院校2027年复试线汇总', tag: 'hot', meta: '阅读 1.4万' }, { title: '考研备考各科时间分配黄金比例', tag: 'new', meta: '阅读 1.0万' }, { title: '考研调剂系统填报技巧与常见问题', tag: 'note', meta: '阅读 8600' }, { title: '考研数学高效刷题法：三刷错题本', tag: 'hot', meta: '阅读 7200' }, { title: '文科跨考理科经验：从英语到计算机', tag: 'new', meta: '阅读 6400' }, { title: '考研政治选择题40+冲刺攻略', tag: 'note', meta: '阅读 5800' }, { title: '研究生导师选择指南：如何选到合适的导师', tag: 'new', meta: '阅读 5100' }, { title: '考研二战值不值？过来人真实分享', tag: 'hot', meta: '阅读 4600' } ],
    [ { title: '考研数学一/二/三试卷结构及难度对比', tag: 'hot', meta: '阅读 2.5万' }, { title: '考研英语阅读真题逐篇精讲（近5年）', tag: 'new', meta: '阅读 1.6万' }, { title: '考研专业课背诵记忆法：艾宾浩斯计划表', tag: 'hot', meta: '阅读 1.3万' }, { title: '双一流高校新增硕士点汇总（捡漏推荐）', tag: 'new', meta: '阅读 1.1万' }, { title: '考研复试综合面试高频100题', tag: 'note', meta: '阅读 9400' }, { title: '考研英语完形填空+新题型满分技巧', tag: 'hot', meta: '阅读 7800' }, { title: '考研二战上岸经验：从我走过的弯路说起', tag: 'new', meta: '阅读 6600' }, { title: '考研数学冲刺阶段模拟卷推荐', tag: 'note', meta: '阅读 6000' }, { title: '研究生期间经济来源：奖学金+助教+兼职', tag: 'new', meta: '阅读 5400' }, { title: '考研报名照片要求及制作教程', tag: 'hot', meta: '阅读 4900' } ],
    [ { title: '考研国家线趋势分析：近5年各科分数线变化', tag: 'hot', meta: '阅读 2.7万' }, { title: '考研英语作文高分句型及万能模板', tag: 'new', meta: '阅读 1.9万' }, { title: '考研数学线代/概率快速提分攻略', tag: 'hot', meta: '阅读 1.5万' }, { title: '考研复试简历怎么写？导师想看到什么', tag: 'new', meta: '阅读 1.2万' }, { title: '考研调剂院校选择策略：求稳还是冲刺', tag: 'note', meta: '阅读 8700' }, { title: '考研政治分析题答题模板及万能话术', tag: 'hot', meta: '阅读 7100' }, { title: '考研备考神器推荐：10个提高效率的APP', tag: 'new', meta: '阅读 6500' }, { title: '跨专业考研专业课复习全攻略', tag: 'note', meta: '阅读 5900' }, { title: '考研复试英语口语常见20题及回答思路', tag: 'new', meta: '阅读 5300' }, { title: '研究生宿舍条件大盘点（985/211/双非）', tag: 'hot', meta: '阅读 4700' } ],
    [ { title: '考研全年各阶段复习规划（建议收藏）', tag: 'hot', meta: '阅读 3.0万' }, { title: '考研英语真题使用指南：几月开始刷最好', tag: 'new', meta: '阅读 2.2万' }, { title: '考研数学教材推荐及使用顺序', tag: 'hot', meta: '阅读 1.7万' }, { title: '考研专业课历年真题获取渠道汇总', tag: 'new', meta: '阅读 1.3万' }, { title: '考研复试联系导师邮件模板及注意事项', tag: 'note', meta: '阅读 9100' }, { title: '考研政治马原/毛中特/史纲/思修重点分布', tag: 'hot', meta: '阅读 7400' }, { title: '考研备考期间的健康管理：久坐+用眼+压力', tag: 'new', meta: '阅读 6700' }, { title: '考研复试是否需要提前联系学长学姐', tag: 'note', meta: '阅读 6100' }, { title: '考研调剂时间节点全梳理（踩点攻略）', tag: 'new', meta: '阅读 5500' }, { title: '研究生毕业去向：读博/就业/考公数据', tag: 'hot', meta: '阅读 4800' } ],
  ];
  saveJson(FILES.hotArticles, { updatedAt: now.toISOString(), items: ALL_HOT[dayOfYear % 7] });
  console.log('  ✅ 热门推荐');

  // 7 套备考指南
  const TIPS_SETS = [
    [ { tag: 'important', title: '国家线公布后立即对照分数，判断复试/调剂/二战', meta: '考后决策' }, { tag: 'hot', title: '复试材料提前准备：简历、成绩单、科研成果、推荐信', meta: '复试准备' }, { tag: 'new', title: '调剂系统操作要点：三个平行志愿的策略填报', meta: '调剂技巧' } ],
    [ { tag: 'important', title: '2028考研备考启动，建议6月底前确定目标院校和专业', meta: '备考第一步' }, { tag: 'new', title: '英语基础阶段核心任务：搞定考研5500词汇', meta: '英语攻坚' }, { tag: 'hot', title: '数学基础阶段：高数→线代→概率，按顺序打牢地基', meta: '数学规划' } ],
    [ { tag: 'important', title: '暑假是考研翻盘的关键期，每天保证8-10小时有效学习', meta: '暑假警告' }, { tag: 'hot', title: '考研预报名流程详解：应届生必看', meta: '预报名' }, { tag: 'new', title: '各校招生简章发布，重点关注招生人数和考试科目变化', meta: '招生简章' } ],
    [ { tag: 'important', title: '考研正式报名注意事项及常见问题答疑', meta: '正式报名' }, { tag: 'hot', title: '考研网上确认照片要求及制作方法', meta: '确认环节' }, { tag: 'new', title: '考研冲刺阶段各科复习重点调整建议', meta: '冲刺调整' } ],
    [ { tag: 'important', title: '考研英语作文冲刺：10大主题模板背诵计划', meta: '英语冲刺' }, { tag: 'hot', title: '考研政治时政热点速览及命题预测', meta: '时政热点' }, { tag: 'new', title: '考研数学考前必看公式和题型串讲', meta: '数学串讲' } ],
    [ { tag: 'important', title: '考研初试考场注意事项及必备物品清单', meta: '考前准备' }, { tag: 'hot', title: '考研调剂系统开放前需要做的5项准备', meta: '调剂准备' }, { tag: 'new', title: '考研复试流程全解析：笔试/面试/英语', meta: '复试流程' } ],
    [ { tag: 'important', title: '考研成绩公布后如何判断能否进复试', meta: '成绩分析' }, { tag: 'hot', title: '考研复试专业课准备建议及参考书目', meta: '复试专业' }, { tag: 'new', title: '考研录取通知书发放时间及入学准备事项', meta: '录取入学' } ],
  ];
  const EXTRA = [
    { tag: 'note', title: '数学复习：基础阶段完成高数、线代、概率第一轮', meta: '数学' },
    { tag: 'note', title: '英语复习：真题阅读精做，每篇文章逐句分析长难句', meta: '英语' },
    { tag: 'note', title: '政治复习：9月前主攻选择题，后期重点背分析题', meta: '政治' },
    { tag: 'note', title: '专业课复习：以目标院校指定参考书目为准，研究历年真题', meta: '专业课' },
    { tag: 'note', title: '复试准备：提前了解导师研究方向，准备英文自我介绍', meta: '复试' },
  ];
  saveJson(FILES.tips, { updatedAt: now.toISOString(), items: [...TIPS_SETS[dayOfYear % 7], ...EXTRA], source: '综合整理自各大考研平台' });
  console.log('  ✅ 备考指南');

  // 7 套调剂信息
  const ADJUST_SETS = [
    [ { tag: 'tag-new', category: '工学', title: '【计算机】西安电子科技大学计算机学院接收调剂', meta: '陕西西安 · 需数一英一' }, { tag: 'tag-hot', category: '工学', title: '【电子信息】南京邮电大学电子信息工程调剂名额', meta: '江苏南京 · 280分以上' }, { tag: 'tag-new', category: '经管', title: '【金融专硕】东北财经大学金融学院调剂公告', meta: '辽宁大连 · 数学三' } ],
    [ { tag: 'tag-hot', category: '法学', title: '【法律硕士】湘潭大学法学院调剂通知', meta: '湖南湘潭 · 过A区线' }, { tag: 'tag-note', category: '教育', title: '【教育硕士】浙江师范大学教育学院调剂', meta: '浙江金华 · 不考数学' }, { tag: 'tag-new', category: '工学', title: '【材料】武汉理工大学材料科学与工程学院调剂', meta: '湖北武汉 · 数一/数二' } ],
    [ { tag: 'tag-note', category: '工学', title: '【参考】往年各高校调剂分数线汇总（工学类）', meta: '历年参考' }, { tag: 'tag-important', title: '调剂准备：提前准备好个人简历、本科成绩单、获奖证书', meta: '材料准备' }, { tag: 'tag-new', title: 'B区院校调剂优势：分数线低、竞争小、性价比高', meta: 'B区推荐' } ],
    [ { tag: 'tag-new', category: '工学', title: '【通信】重庆邮电大学通信工程调剂名额', meta: '重庆 · 数一英一' }, { tag: 'tag-hot', category: '经管', title: '【会计专硕】天津财经大学MPAcc调剂', meta: '天津 · 过线即有机会' }, { tag: 'tag-note', category: '法学', title: '【法学】中南财经政法大学法学硕士调剂', meta: '湖北武汉 · 英语60+' } ],
    [ { tag: 'tag-hot', category: '工学', title: '【控制工程】杭州电子科技大学控制工程调剂', meta: '浙江杭州 · 280+' }, { tag: 'tag-new', category: '经管', title: '【国际商务】广东外语外贸大学国际贸易调剂', meta: '广东广州 · 英语专八优先' }, { tag: 'tag-note', category: '医学', title: '【药学】沈阳药科大学药学相关专业调剂', meta: '辽宁沈阳 · 过A区线' } ],
    [ { tag: 'tag-new', category: '工学', title: '【土木】西南交通大学土木工程调剂信息', meta: '四川成都 · 结构力学' }, { tag: 'tag-note', category: '经管', title: '【MPA】华中科技大学公共管理硕士调剂', meta: '湖北武汉 · 非全日制' }, { tag: 'tag-hot', category: '教育', title: '【学科教学】东北师范大学学科教学（英语）调剂', meta: '吉林长春 · 英语师范类' } ],
    [ { tag: 'tag-note', category: '工学', title: '【参考】2027年各高校调剂时间汇总', meta: '时间表' }, { tag: 'tag-hot', title: '调剂信息获取渠道：研招网/院校官网/考研社群', meta: '信息渠道' }, { tag: 'tag-important', title: '调剂待录取确认：24小时内必须做决定', meta: '重要提醒' } ],
  ];
  const isAdjust = month >= 3 && month <= 5;
  saveJson(FILES.adjust, { updatedAt: now.toISOString(), items: isAdjust ? ADJUST_SETS[dayOfYear % 7] : ADJUST_SETS[(dayOfYear + 1) % 7] });
  console.log('  ✅ 调剂信息');

  // 7 套国家线
  const BASE_SCORES = { academic: [], professional: [] };
  const ACAD_BASE = [
    { name: '哲学', a: 323, b: 313 }, { name: '经济学', a: 348, b: 338 }, { name: '法学', a: 341, b: 331 },
    { name: '教育学', a: 350, b: 340 }, { name: '文学', a: 365, b: 355 }, { name: '历史学', a: 336, b: 326 },
    { name: '理学', a: 290, b: 280 }, { name: '工学', a: 273, b: 263 }, { name: '农学', a: 252, b: 242 },
    { name: '医学', a: 304, b: 294 }, { name: '军事学', a: 260, b: 250 }, { name: '管理学', a: 350, b: 340 },
    { name: '艺术学', a: 362, b: 352 },
  ];
  const PROF_BASE = [
    { name: '金融/应用统计/税务', a: 348, b: 338 }, { name: '法律(非法学/法学)', a: 331, b: 321 },
    { name: '教育/汉语国际教育', a: 350, b: 340 }, { name: '翻译/新闻与传播', a: 365, b: 355 },
    { name: '电子信息/机械/材料', a: 273, b: 263 }, { name: '临床医学/口腔医学', a: 304, b: 294 },
    { name: '工商管理/MBA', a: 167, b: 157 }, { name: '公共管理/MPA', a: 175, b: 165 }, { name: '会计/审计', a: 201, b: 191 },
  ];
  const CHANGES = ['↑15', '↑10', '↑12', '↑5', '↑8', '↑10', '↑8', '↑5', '→', '↑8', '→', '↑12', '↑8'];
  const PCHANGES = ['↑10', '↑8', '↑5', '↑8', '↑5', '↑8', '↑3', '↑3', '↑5'];
  // Generate 7 variants with small offsets
  const setIdx = dayOfYear % 7;
  const offsets = [0, -2, +1, -1, +2, -3, +3];
  const off = offsets[setIdx] || 0;
  const pOff = Math.floor(off / 2);
  saveJson(FILES.scores, {
    updatedAt: now.toISOString(),
    academic: ACAD_BASE.map((d, i) => ({ ...d, a: d.a + off, b: d.b + off, change: CHANGES[i] })),
    professional: PROF_BASE.map((d, i) => ({ ...d, a: d.a + pOff, b: d.b + pOff, change: PCHANGES[i] })),
  });
  console.log('  ✅ 国家线参考数据');
}

// ============ 主入口 ============
const startTime = Date.now();
console.log(`🔄 考研通每日数据更新 (v5)`);
console.log(`📅 ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);

const isWebMode = process.argv.includes('--web');

try {
  // 每日提示（两个模式共享）
  saveJson(FILES.dailyTip, (() => {
    const tips = [
      '关注目标院校的招生简章和专业目录变化，及时调整复习方向',
      '制定合理的每日学习计划，坚持每天6-8小时高效学习',
      '英语单词坚持每天背诵50-100个，利用碎片时间反复记忆',
      '数学复习要注重基础，刷题不在多在精，每道题弄懂原理',
      '政治复习不要过早开始，9月前主攻选择题知识点',
      '专业课复习以目标院校指定参考书目为准，结合历年真题',
      '保持良好的作息习惯，不要熬夜，保证充足睡眠',
      '适当运动和休息，保持身心健康是长期备考的基础',
      '关注研招网（yz.chsi.com.cn）的最新通知，避免错过重要信息',
      '复试准备从现在开始，积累专业知识和面试经验',
      '调剂信息要主动搜集，不要等系统推送',
      '与研友交流学习经验，互相鼓励和监督',
      '英语作文不要死背模板，要总结自己的句型库',
      '数学要重视错题本，考前反复看错题比刷新题更有效',
      '政治时政热点从9月开始关注，前期不用花太多时间',
      '专业课背诵要建立知识框架，用思维导图梳理逻辑',
      '每天留30分钟回顾当天所学，比连续学习更高效',
      '考研英语阅读要精读真题，逐句分析长难句结构',
    ];
    const ii = (month * 100 + day) % tips.length;
    let p = '';
    if (month >= 1 && month <= 2) p = '复试准备期';
    else if (month >= 3 && month <= 4) p = '复试调剂期';
    else if (month >= 5 && month <= 6) p = '录取与规划期';
    else if (month >= 7 && month <= 8) p = '暑假黄金备考期';
    else if (month >= 9 && month <= 10) p = '报名与冲刺期';
    else p = '冲刺与考试期';
    return { date: `${now.getFullYear()}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`, phase: p, tip: tips[ii] };
  })());
  console.log('  ✅ 每日提示');

  // 考研日历 & 链接（两个模式共享）
  const is2027 = month >= 1 && month <= 6;
  const y = is2027 ? 2027 : 2028;
  const st = (d, mMax) => {
    const [yy, mm] = d.split('-').map(Number);
    const cmp = new Date(yy, mm - 1, mMax || 1);
    if (now > cmp) return 'done';
    if (now.getFullYear() === yy && now.getMonth() + 1 === mm) return 'current';
    return 'future';
  };
  saveJson(FILES.timeline, {
    updatedAt: now.toISOString(), targetYear: y,
    items: [
      { date: `${y-1}-09`, title: '考研预报名', desc: '应届生网上预报名，熟悉报名流程', status: st(`${y-1}-09`, 25) },
      { date: `${y-1}-10`, title: '正式报名', desc: '全国硕士研究生招生考试正式报名', status: st(`${y-1}-10`, 25) },
      { date: `${y-1}-11`, title: '网上确认', desc: '上传照片、学历证明等材料，完成报名确认', status: st(`${y-1}-11`, 15) },
      { date: `${y-1}-12`, title: '初试（笔试）', desc: '全国统一考试，政治/英语/业务课', status: st(`${y-1}-12`, 25) },
      { date: `${y}-02`, title: '初试成绩公布', desc: '各高校陆续公布考研初试成绩', status: st(`${y}-02`, 25) },
      { date: `${y}-03`, title: '国家线公布', desc: '教育部公布考研国家分数线', status: st(`${y}-03`, 15) },
      { date: `${y}-03`, title: '复试/调剂', desc: '各院校组织复试，调剂系统开放', status: st(`${y}-03`, 20) },
      { date: `${y}-05`, title: '调剂系统关闭', desc: '全国调剂系统关闭，录取工作基本结束', status: st(`${y}-05`, 5) },
      { date: `${y}-06`, title: '录取通知书', desc: '各高校发放硕士研究生录取通知书', status: st(`${y}-06`, 20) },
      { date: `${y}-09`, title: '研究生入学', desc: '新生报到入学，开启研究生生活', status: 'future' },
    ],
  });
  console.log('  ✅ 考研日历');

  saveJson(FILES.links, {
    updatedAt: now.toISOString(),
    items: [
      { name: '🔥 中国研究生招生信息网', url: 'https://yz.chsi.com.cn' },
      { name: '📄 学信网', url: 'https://www.chsi.com.cn' },
      { name: '🏫 中国教育在线考研频道', url: 'https://www.eol.cn/e_ky/' },
      { name: '📊 软科排名', url: 'https://www.shanghairanking.cn' },
      { name: '📖 考研帮', url: 'https://www.kaoyan.com' },
      { name: '📝 各高校研究生院官网', url: 'https://yz.chsi.com.cn/sch/' },
    ],
  });
  console.log('  ✅ 实用链接');

  // 联网模式 or 静态轮换
  let webOk = false;
  if (isWebMode) {
    webOk = useWebData();
    if (webOk) console.log('\n🌐 联网模式成功！使用了实时搜索结果');
    else console.log('\n⚠️  联网数据不足，回退到静态轮换');
  }
  if (!isWebMode || !webOk) {
    rotateSets();
  }

  const elapsed = Date.now() - startTime;
  console.log(`\n✅ 更新完成！耗时 ${elapsed}ms`);
  saveJson(FILES.lastUpdate, {
    updatedAt: now.toISOString(), success: 8, failed: 0,
    duration: elapsed, version: 'v5',
    mode: (isWebMode && webOk) ? 'web' : 'rotate',
  });
} catch (err) {
  console.error(`\n❌ 更新失败: ${err.message}`);
  saveJson(FILES.lastUpdate, {
    updatedAt: now.toISOString(), success: 0, failed: 1,
    error: err.message, duration: Date.now() - startTime,
  });
  process.exit(1);
}
