/**
 * 考研通 - 静态站点生成器
 * 
 * 读取 data/*.json 的最新数据，转换为原始 HTML 数据格式，
 * 替换 index.html 中的硬编码数据数组。
 * 
 * 这样原始渲染函数无需任何修改，
 * 生成的 HTML 完全自包含，无需后端。
 * 
 * 用法：node scripts/build-static.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const INDEX_HTML = path.join(PUBLIC_DIR, 'index.html');
const OUTPUT_HTML = path.join(PUBLIC_DIR, 'index.html');

// 读取 JSON 数据
function loadData(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
  } catch (err) {
    console.error(`  ⚠️ 读取 ${filename} 失败: ${err.message}`);
  }
  return null;
}

// ============ 格式转换：API 数据 -> 原始 HTML 数据格式 ============

// 备考指南: API {tag,title,meta} -> 原始 {icon,title,content,tag}
function convertTips(apiItems) {
  const iconMap = ['💡', '📌', '⭐', '🎯', '📚', '✍️', '🎤', '🔥'];
  return (apiItems || []).map((item, i) => ({
    icon: iconMap[i % iconMap.length],
    title: item.title || '',
    content: item.meta || '',
    tag: item.tag === 'important' ? 'hot' : (item.tag || 'note'),
  }));
}

// 热门推荐: API {title,tag,meta} -> 原始 {title,tag,meta,summary,points}
function convertHotArticles(apiItems) {
  return (apiItems || []).map(item => ({
    title: item.title || '',
    tag: item.tag || 'note',
    meta: item.meta || '',
    summary: '',
    points: [],
  }));
}

// 调剂信息: API {tag,category,title,meta} -> 原始 {cat,title,content,time,tag}
function convertAdjust(apiItems) {
  // 分类映射
  const catMap = {
    '工学': 'cs',
    '经管': 'econ',
    '法学': 'law',
    '教育': 'edu',
    '医学': 'med',
  };
  return (apiItems || []).map(item => {
    const catName = item.category || '其他';
    return {
      cat: catMap[catName] || 'cs',
      title: item.title || '',
      content: item.meta || '',
      time: (item.meta || '').split('·')[0]?.trim() || '',
      tag: (item.tag || '').replace('tag-', '') || 'note',
    };
  });
}

// 考研日历: 格式一致 {date,title,desc,status}
function convertTimeline(apiItems) {
  return (apiItems || []).map(item => ({
    date: item.date || '',
    title: item.title || '',
    desc: item.desc || '',
    status: item.status || 'future',
  }));
}

// 实用链接: API {name,url} -> 原始 {name,url,icon}
function convertLinks(apiItems) {
  return (apiItems || []).map((item, i) => ({
    name: item.name || '',
    url: item.url || '',
    icon: ['🎓', '📋', '🏆', '📊', '📖', '🔗'][i] || '🔗',
  }));
}

// 国家线: API {name,a,b,change} -> 原始 {cat,aTotal,bTotal,subA,subB,trend}
function convertScores(scores) {
  if (!scores) return null;
  const extractTrend = (change) => {
    if (!change) return 0;
    const num = parseInt(change.replace('↑', '').replace('↓', ''));
    if (change.includes('↑')) return num;
    if (change.includes('↓')) return -num;
    return 0;
  };
  return (scores.academic || []).map(item => ({
    cat: item.name || '',
    aTotal: item.a || 0,
    bTotal: item.b || 0,
    subA: Math.round((item.a || 0) * 0.13),
    subB: Math.round((item.b || 0) * 0.13),
    trend: extractTrend(item.change),
  }));
}

function convertDegreeScores(scores) {
  if (!scores || !scores.professional) return null;
  const extractTrend = (change) => {
    if (!change) return 0;
    const num = parseInt(change.replace('↑', '').replace('↓', ''));
    if (change.includes('↑')) return num;
    if (change.includes('↓')) return -num;
    return 0;
  };
  return (scores.professional || []).map(item => ({
    cat: item.name || '',
    aTotal: item.a || 0,
    bTotal: item.b || 0,
    subA: Math.round((item.a || 0) * 0.13),
    subB: Math.round((item.b || 0) * 0.13),
    trend: extractTrend(item.change),
  }));
}

// ============ 替换 HTML 中的数据 ============

function replaceDataInHtml(html, replacements) {
  let result = html;
  for (const [pattern, newValue] of replacements) {
    const regex = new RegExp(pattern, 'g');
    const prevCount = (result.match(regex) || []).length;
    result = result.replace(regex, newValue);
    if (prevCount > 0) {
      console.log(`  ✅ 替换 "${pattern.substring(0, 50)}..." → ${prevCount} 处`);
    }
  }
  return result;
}

// ============ 主流程 ============
console.log('🏗️  考研通静态站点生成器');
console.log('══════════════════════════');
console.log(`📅 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);

const startTime = Date.now();

// 1. 读取所有数据
const data_tips = loadData('tips.json');
const data_hot = loadData('hot-articles.json');
const data_adjust = loadData('adjust.json');
const data_timeline = loadData('timeline.json');
const data_dailyTip = loadData('daily-tip.json');
const data_scores = loadData('scores.json');
const data_links = loadData('links.json');

// 2. 格式转换
const newTips = convertTips(data_tips?.items);
const newHot = convertHotArticles(data_hot?.items);
const newAdjust = convertAdjust(data_adjust?.items);
const newTimeline = convertTimeline(data_timeline?.items);
const newLinks = convertLinks(data_links?.items);
const newLineData = convertScores(data_scores);
const newDegreeData = convertDegreeScores(data_scores);

console.log('📖 读取 HTML...');
const html = fs.readFileSync(INDEX_HTML, 'utf8');

// 3. 检查各部分数量
const sections = [
  ['tipsData', newTips, '备考指南'],
  ['hotArticles', newHot, '热门推荐'],
  ['adjustData', newAdjust, '调剂信息'],
  ['timelineData', newTimeline, '考研日历'],
  ['linksData', newLinks, '实用链接'],
  ['lineData (lineTableBody)', newLineData, '国家线(学术)'],
];

for (const [name, data, label] of sections) {
  const count = data ? data.length : 0;
  console.log(`  📊 ${label}: ${count} 条`);
}

// 4. 替换数据
console.log('\n💉 替换数据...');

// 由于 JSON.stringify 会输出带引号的键名，而原始数据是 const 声明的不带引号对象
// 我们生成 const data = [...] 格式的代码来替换
function generateConstArrayCode(varName, items) {
  return `const ${varName} = ${JSON.stringify(items, null, 2)};`;
}

const replacements = [];

if (newTips) {
  const oldMatch = /const tipsData\s*=\s*\[[\s\S]*?\];/;
  const newCode = generateConstArrayCode('tipsData', newTips);
  if (oldMatch.test(html)) {
    replacements.push([oldMatch.source, newCode]);
  }
}

if (newHot) {
  const oldMatch = /const hotArticles\s*=\s*\[[\s\S]*?\];/;
  const newCode = generateConstArrayCode('hotArticles', newHot);
  if (oldMatch.test(html)) {
    replacements.push([oldMatch.source, newCode]);
  }
}

if (newAdjust) {
  const oldMatch = /var adjustData\s*=\s*\[[\s\S]*?\];/;
  const newCode = `var adjustData = ${JSON.stringify(newAdjust, null, 2)};`;
  if (oldMatch.test(html)) {
    replacements.push([oldMatch.source, newCode]);
  }
}

if (newTimeline) {
  const oldMatch = /const timelineData\s*=\s*\[[\s\S]*?\];/;
  const newCode = generateConstArrayCode('timelineData', newTimeline);
  if (oldMatch.test(html)) {
    replacements.push([oldMatch.source, newCode]);
  }
}

if (newLinks) {
  const oldMatch = /const linksData\s*=\s*\[[\s\S]*?\];/;
  const newCode = generateConstArrayCode('linksData', newLinks);
  if (oldMatch.test(html)) {
    replacements.push([oldMatch.source, newCode]);
  }
}

if (newLineData) {
  const oldMatch = /const lineData\s*=\s*\[[\s\S]*?\];/;
  const newCode = `const lineData = ${JSON.stringify(newLineData, null, 2)};`;
  if (oldMatch.test(html)) {
    replacements.push([oldMatch.source, newCode]);
  }
}

if (newDegreeData) {
  const oldMatch = /const degreeData\s*=\s*\[[\s\S]*?\];/;
  const newCode = `const degreeData = ${JSON.stringify(newDegreeData, null, 2)};`;
  if (oldMatch.test(html)) {
    replacements.push([oldMatch.source, newCode]);
  }
}

// 更新 banner 上的每日提示
if (data_dailyTip) {
  const tip = data_dailyTip;
  const dateStr = `${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${String(new Date().getDate()).padStart(2,'0')}`;
  const tipHtml = `<span style="font-weight: 600;">💡 每日提示：</span>${tip.tip || ''} <span style="float: right; font-size: 12px; opacity: 0.7;">${tip.phase ? '【' + tip.phase + '】' : ''}更新：${dateStr}</span>`;
  
  // 匹配 banner 内每日提示的 div
  const bannerTipRegex = /(<div class="banner"[^>]*>[\s\S]*?)(<span style="font-weight: 600;">💡 每日提示：<\/span>)([\s\S]*?)(<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>)/;
  const bannerMatch = html.match(bannerTipRegex);
  if (bannerMatch) {
    // 取更精确的替换 - 找到 banner 外层容器
    const fullBannerMatch = html.match(/(<div class="banner"[^>]*>[\s\S]*?每日提示：<\/span>)([\s\S]*?)(<span style="float: right)/);
    if (fullBannerMatch) {
      replacements.push([
        escapeRegex(fullBannerMatch[2]),
        `${tip.tip || ''} ${tip.phase ? '【' + tip.phase + '】' : ''}`
      ]);
    }
  }
  
  // 更新 "更新：YYYY-MM-DD HH:mm:ss" 的时间
  const now = new Date();
  const updateTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  
  // 匹配类似 "更新：2026-05-01 20:33:00" 
  const timeRegex = /更新：\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;
  if (timeRegex.test(html)) {
    replacements.push([timeRegex.source, `更新：${updateTime}`]);
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 执行替换
let output = html;
for (const [pattern, newValue] of replacements) {
  try {
    const r = new RegExp(pattern, 'g');
    const before = (output.match(r) || []).length;
    output = output.replace(r, newValue);
    if (before === 0) {
      console.log(`  ⚠️ 未找到匹配: ${pattern.substring(0, 60)}...`);
    } else {
      console.log(`  ✅ 已替换: ${pattern.substring(0, 40)}... (${before}处)`);
    }
  } catch (e) {
    console.log(`  ❌ 替换失败: ${e.message}`);
  }
}

// 5. 写入
console.log('\n💾 写入...');
fs.writeFileSync(OUTPUT_HTML, output, 'utf8');
fs.writeFileSync(path.join(PUBLIC_DIR, 'index_static.html'), output, 'utf8');

const elapsed = Date.now() - startTime;
const size = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
console.log(`\n✅ 静态站点生成完成！`);
console.log(`   📄 ${OUTPUT_HTML}`);
console.log(`   📏 ${size} KB`);
console.log(`   ⏱  ${elapsed}ms`);
