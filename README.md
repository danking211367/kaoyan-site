# 🎓 考研通 — 考研信息聚合平台

一站式考研信息平台，整合院校库、国家线、调剂信息、备考指南、考研日历等核心功能。

## ✨ 功能特色

- 📋 **院校库** — 985/211 院校信息，支持筛选、对比、专业详情查看
- 📊 **国家线** — 学术学位/专业学位分数线，历年趋势对比
- 🔄 **调剂信息** — 调剂季实时更新，非调剂季备参考
- 📅 **考研日历** — 从预报名到入学的完整时间线，自动标记状态
- 💡 **每日提示** — 每天一条考研提醒
- 📰 **热门推荐** — 最新考研资讯聚合
- 🎯 **专业详情** — 热门专业介绍、就业前景、发展方向

## 🚀 快速开始

### 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 生成初始数据
node scripts/update-data-v2.js

# 3. 启动服务
node server.js

# 4. 打开浏览器访问
open http://localhost:3000
```

### 一键部署到 Vercel（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/kaoyan-info)

或者手动部署：

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 部署
vercel
```

部署后会自动获得一个 `.vercel.app` 域名，所有人可以访问。

## 📡 API 接口

| 接口 | 说明 |
|------|------|
| `GET /api/all` | 获取全部动态数据 |
| `GET /api/tips` | 备考指南 |
| `GET /api/hot-articles` | 热门推荐 |
| `GET /api/adjust` | 调剂信息 |
| `GET /api/timeline` | 考研日历 |
| `GET /api/daily-tip` | 每日提示 |
| `GET /api/scores` | 国家线 |
| `GET /api/status` | 服务器状态 |

## 📁 项目结构

```
kaoyan/
├── server.js              # Express 服务器
├── vercel.json            # Vercel 部署配置
├── package.json
├── start.bat              # Windows 一键启动
├── public/
│   └── index.html         # 网站前端
├── scripts/
│   ├── update-data.js     # 基础数据更新
│   └── update-data-v2.js  # 进阶数据更新（推荐）
└── data/                  # 动态数据文件（每日更新）
    ├── tips.json
    ├── hot-articles.json
    ├── adjust.json
    ├── timeline.json
    ├── daily-tip.json
    ├── scores.json
    ├── links.json
    └── last-update.json
```

## 🔄 每日数据更新

数据可以自动更新，支持两种方式：

### 方式一：GitHub Actions（推荐）

创建 `.github/workflows/update-data.yml`，GitHub 会自动在每天 8:00 和 20:00 运行更新脚本并推送到仓库：

```yaml
name: 每日数据更新
on:
  schedule:
    - cron: '0 0,12 * * *'
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: node scripts/update-data-v2.js
      - run: |
          git config user.name "github-actions"
          git config user.email "github-actions@github.com"
          git add data/
          git diff --staged --quiet || git commit -m "📊 每日数据自动更新 $(date +'%Y-%m-%d')"
          git push
```

### 方式二：本地定时任务

Windows 下创建计划任务，每天定时运行：

```bash
node scripts/update-data-v2.js
```

## 🛠 技术栈

- **前端**: 原生 HTML/CSS/JavaScript（无框架依赖）
- **后端**: Node.js + Express
- **数据**: 每日自动生成的 JSON 文件
- **部署**: Vercel / 自托管

## 📄 许可证

MIT
