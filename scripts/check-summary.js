const fs = require('fs');
const html = fs.readFileSync('C:/Users/13058/.openclaw/workspace/kaoyan/public/index.html', 'utf8');

// 提取 hotArticles
const m = html.match(/const hotArticles = \[([\s\S]*?)\];/);
if (m) {
  const summaries = m[1].match(/"summary": "([^"]+)"/g);
  if (summaries) {
    console.log('热门推荐摘要:');
    summaries.forEach((s, i) => {
      const text = s.replace('"summary": "', '').replace('"', '');
      console.log((i+1) + '. ' + text.substring(0, 60));
    });
  }
}

// 检查 template
const t = html.match(/article-summary[\s\S]{0,200}/);
if (t) console.log('\n渲染模板摘要: ' + t[0].substring(0, 100));
