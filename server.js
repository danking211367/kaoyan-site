/**
 * 考研通 - 信息聚合平台 后端服务器
 * 
 * 功能：
 * 1. 提供静态页面服务
 * 2. 提供 RESTful API 接口获取动态数据
 * 3. 定时执行数据更新任务
 * 
 * 启动：node server.js
 * 默认端口：3000
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ============ 数据加载 ============

function loadData(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`读取数据文件失败 [${filename}]: ${err.message}`);
  }
  return null;
}

// ============ API 缓存中间件 ============

// 定期重新读取数据（避免每次都读盘）
let dataCache = {};
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60秒

function getData(filename) {
  const now = Date.now();
  if (now - cacheTime > CACHE_TTL) {
    dataCache = {};
    cacheTime = now;
  }
  if (!dataCache[filename]) {
    dataCache[filename] = loadData(filename);
  }
  return dataCache[filename];
}

// ============ API 路由 ============

// CORS 中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// API: 获取所有最新数据（前端一次性加载）
app.get('/api/all', (req, res) => {
  const data = {
    tips: getData('tips.json'),
    hotArticles: getData('hot-articles.json'),
    adjust: getData('adjust.json'),
    timeline: getData('timeline.json'),
    dailyTip: getData('daily-tip.json'),
    links: getData('links.json'),
    scores: getData('scores.json'),
    lastUpdate: getData('last-update.json'),
  };
  
  // 如果没有数据文件，尝试首次生成
  if (!data.tips || !data.dailyTip) {
    return res.json({ status: 'initializing', message: '数据正在初始化，请稍后刷新' });
  }
  
  res.json({ status: 'ok', ...data });
});

// API: 备考指南
app.get('/api/tips', (req, res) => {
  const data = getData('tips.json');
  if (!data) return res.json({ status: 'empty', items: [] });
  res.json(data);
});

// API: 热门推荐
app.get('/api/hot-articles', (req, res) => {
  const data = getData('hot-articles.json');
  if (!data) return res.json({ status: 'empty', items: [] });
  res.json(data);
});

// API: 调剂信息
app.get('/api/adjust', (req, res) => {
  const data = getData('adjust.json');
  if (!data) return res.json({ status: 'empty', items: [] });
  res.json(data);
});

// API: 考研日历
app.get('/api/timeline', (req, res) => {
  const data = getData('timeline.json');
  if (!data) return res.json({ status: 'empty', items: [] });
  res.json(data);
});

// API: 每日提示
app.get('/api/daily-tip', (req, res) => {
  const data = getData('daily-tip.json');
  if (!data) return res.json({ status: 'empty', tip: '', date: '' });
  res.json(data);
});

// API: 国家线
app.get('/api/scores', (req, res) => {
  const data = getData('scores.json');
  if (!data) return res.json({ status: 'empty', items: [] });
  res.json(data);
});

// API: 实用链接
app.get('/api/links', (req, res) => {
  const data = getData('links.json');
  if (!data) return res.json({ status: 'empty', items: [] });
  res.json(data);
});

// API: 状态检查
app.get('/api/status', (req, res) => {
  const lastUpdate = getData('last-update.json');
  res.json({
    server: 'running',
    port: PORT,
    lastUpdate: lastUpdate || { updatedAt: 'never' },
    dataFiles: fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR) : [],
  });
});

// API: 手动触发数据更新
app.post('/api/update', async (req, res) => {
  try {
    const { runUpdate } = require('./scripts/update-data');
    const result = await runUpdate();
    // 清除缓存
    dataCache = {};
    cacheTime = 0;
    res.json({ status: 'ok', ...result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============ 静态文件服务 ============

// 服务 data 目录下的 JSON 文件（只读）
app.use('/data', express.static(DATA_DIR, {
  setHeaders: (res) => {
    res.set('Content-Type', 'application/json');
  },
}));

// 服务 public 目录（HTML 页面）
app.use(express.static(PUBLIC_DIR));

// 所有未匹配路由返回 index.html（SPA 友好）
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ============ 启动 ============

async function startServer() {
  console.log('🎓 考研通信息聚合平台');
  console.log('═══════════════════════');
  
  // 检查数据目录
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 创建数据目录');
  }

  // 检查是否有数据文件，如果没有则运行初始更新
  const dataFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  if (dataFiles.length < 3) {
    console.log('🔄 首次启动，正在生成初始数据...');
    try {
      const { runUpdate } = require('./scripts/update-data');
      await runUpdate();
      console.log('✅ 初始数据生成完成');
    } catch (err) {
      console.error('⚠️ 初始数据生成失败:', err.message);
      console.log('  服务器仍将启动，部分功能可能不可用');
    }
  } else {
    console.log(`📊 已有 ${dataFiles.length} 个数据文件`);
  }

  // 启动服务器
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📡 API 地址: http://localhost:${PORT}/api/status`);
    console.log(`🕒 按 Ctrl+C 停止服务器`);
  });
}

// 如果直接运行（非 Vercel 环境），启动服务器
if (require.main === module) {
  startServer().catch(err => {
    console.error('启动失败:', err);
    process.exit(1);
  });
}

// 导出 Express app 供 Vercel 使用
module.exports = app;
