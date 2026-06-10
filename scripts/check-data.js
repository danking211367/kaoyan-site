const fs = require('fs');
const c = fs.readFileSync('public/index.html', 'utf8');

// 院校 - simpler approach
const um = c.match(/const universities = \[([\s\S]*?)\];/);
if (um) {
  const lines = um[1].split('\n');
  const names = [];
  for (const line of lines) {
    const m = line.match(/"name":\s*"([^"]+)"/);
    if (m) names.push(m[1]);
  }
  console.log('=== 院校 (' + names.length + ') ===');
  names.forEach((n, i) => console.log((i+1) + '. ' + n));
}

// 专业
const mm = c.match(/const majorData = \[([\s\S]*?)\];/);
if (mm) {
  const lines = mm[1].split('\n');
  const mnames = [];
  for (const line of lines) {
    const m = line.match(/"name":\s*"([^"]+)"/);
    if (m) mnames.push(m[1]);
  }
  console.log('\n=== 专业 (' + mnames.length + ') ===');
  mnames.forEach((n, i) => console.log((i+1) + '. ' + n));
}
