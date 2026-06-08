/**
 * 考研通 - 静态站点生成器
 * 
 * 将最新的数据文件（data/*.json）注入到 index.html 中，
 * 生成完全自包含的静态 HTML 文件。
 * 
 * 生成的 index.html 不需要后端服务器也能展示最新数据，
 * 适合部署到 GitHub Pages 等静态托管平台。
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

// 将数据转换为 HTML 可内嵌的 JS 代码
function generateEmbedScript(data) {
  const parts = [];
  
  // 将 API 数据映射回前端能使用的格式
  if (data.tips && data.tips.items) {
    const items = data.tips.items;
    parts.push(`window.__dynamicTips = ${JSON.stringify(items)};`);
  }
  
  if (data.hotArticles && data.hotArticles.items) {
    const items = data.hotArticles.items;
    parts.push(`window.__dynamicHotArticles = ${JSON.stringify(items)};`);
  }
  
  if (data.adjust && data.adjust.items) {
    const items = data.adjust.items;
    parts.push(`window.__dynamicAdjustData = ${JSON.stringify(items)};`);
  }
  
  if (data.timeline && data.timeline.items) {
    const items = data.timeline.items;
    parts.push(`window.__dynamicTimelineData = ${JSON.stringify(items)};`);
  }
  
  if (data.links && data.links.items) {
    const items = data.links.items;
    parts.push(`window.__dynamicLinks = ${JSON.stringify(items)};`);
  }
  
  if (data.scores) {
    parts.push(`window.__dynamicScores = ${JSON.stringify(data.scores)};`);
  }
  
  if (data.dailyTip) {
    parts.push(`window.__dailyTip = ${JSON.stringify(data.dailyTip)};`);
  }
  
  return parts.join('\n');
}

// 生成 banner 上的更新时间
function generateBannerHTML(data) {
  const tip = data.dailyTip;
  if (!tip) return '';
  
  const dateStr = tip.date || '';
  const phase = tip.phase || '';
  const tipText = tip.tip || '';
  
  // 生成更新时间标签
  const now = new Date();
  const updateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  
  return tipText ? `${tipText} 【${phase}】` : '';
}

// 读取原始 HTML
function readIndexHtml() {
  if (!fs.existsSync(INDEX_HTML)) {
    console.error(`❌ 找不到 ${INDEX_HTML}`);
    process.exit(1);
  }
  return fs.readFileSync(INDEX_HTML, 'utf8');
}

// 注入数据到 HTML
function injectData(html, data, tipText) {
  let result = html;
  
  // 1. 在 </head> 前注入数据脚本
  const embedScript = generateEmbedScript(data);
  const scriptTag = `\n<script>\n// ===== 静态构建注入数据 (${new Date().toISOString()}) =====\n${embedScript}\n</script>\n`;
  result = result.replace('</head>', scriptTag + '</head>');
  
  // 2. 更新 banner 上的提示文字
  if (tipText) {
    // 匹配每日提示所在的 banner 区域
    const bannerRegex = /(<div class="banner"[^>]*>[\s\S]*?<div[^>]*>)([\s\S]*?)(<\/div>[\s\S]*?<\/div>\s*<\/div>)/;
    const match = result.match(bannerRegex);
    if (match) {
      const newBannerContent = match[1] + 
        '<span style="font-weight: 600;">💡 每日提示：</span>' + tipText +
        ' <span style="float: right; font-size: 12px; opacity: 0.7;">更新：' + new Date().toISOString().slice(0, 10).replace(/-/g, '/').split('/').reverse().join('/') + '</span>' +
        match[3];
      result = result.replace(match[0], newBannerContent);
    }
  }
  
  // 3. 更新 banner 上的更新时间
  const now = new Date();
  const updateTimeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  result = result.replace(/更新：[\d\-:\s]+/g, (match) => {
    // 只替换 banner 中的更新时间，保留其他地方的日期
    return `更新：${updateTimeStr} `;
  });
  
  return result;
}

// ============ 主流程 ============
console.log('🏗️  考研通静态站点生成器');
console.log('══════════════════════════');
console.log(`📅 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);

const startTime = Date.now();

// 读取所有数据文件
const data = {
  tips: loadData('tips.json'),
  hotArticles: loadData('hot-articles.json'),
  adjust: loadData('adjust.json'),
  timeline: loadData('timeline.json'),
  dailyTip: loadData('daily-tip.json'),
  scores: loadData('scores.json'),
  links: loadData('links.json'),
};

const tipData = loadData('daily-tip.json');
const tipText = tipData ? `${tipData.tip || ''}` : '';

// 读取并注入数据
console.log('📖 读取模板 HTML...');
const html = readIndexHtml();

console.log('💉 注入动态数据...');
const output = injectData(html, data, tipText);

console.log('💾 写入静态 HTML...');
fs.writeFileSync(OUTPUT_HTML, output, 'utf8');

// 同时生成一个 index_static.html 作为备份/验证
const staticHtmlPath = path.join(PUBLIC_DIR, 'index_static.html');
fs.writeFileSync(staticHtmlPath, output, 'utf8');

const elapsed = Date.now() - startTime;
const size = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);

console.log(`\n✅ 静态站点生成完成！`);
console.log(`   📄 ${OUTPUT_HTML}`);
console.log(`   📄 ${staticHtmlPath}`);
console.log(`   📏 ${size} KB`);
console.log(`   ⏱  ${elapsed}ms`);
console.log(`\n💡 这个 HTML 文件已包含全部最新数据，可以直接用浏览器打开，`);
console.log(`   也可以在 GitHub Pages 等静态托管上直接部署。`);
