const fs = require('fs');
const html = fs.readFileSync('C:/Users/13058/.openclaw/workspace/kaoyan/public/index.html', 'utf8');

const checks = {
  tipsData: /const tipsData = \[([\s\S]*?)\];/,
  hotArticles: /const hotArticles = \[([\s\S]*?)\];/,
  adjustData: /var adjustData = \[([\s\S]*?)\];/,
  timelineData: /const timelineData = \[([\s\S]*?)\];/,
  lineData: /const lineData = \[([\s\S]*?)\];/,
};

for (const [name, re] of Object.entries(checks)) {
  const m = html.match(re);
  if (m) {
    const tm = m[1].match(/"title":\s*"([^"]+)"/);
    const cnt = (m[1].match(/\{/g) || []).length;
    if (tm) console.log('OK', name, cnt + '条, title=' + tm[1].substring(0, 50));
    else console.log('OK', name, cnt + '条, (no title match)');
  } else {
    console.log('FAIL', name);
  }
}

const timeMatch = html.match(/更新：(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
if (timeMatch) console.log('TIME: ' + timeMatch[1]);
const tipMatch = html.match(/💡 每日提示：([^<]+)/);
if (tipMatch) console.log('TIP: ' + tipMatch[1].trim().substring(0, 60));
