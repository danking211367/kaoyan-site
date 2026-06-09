const fs = require('fs');
const c = fs.readFileSync('public/index.html', 'utf8');
const block = c.match(/const universities = \[([\s\S]*?)\];/)[1];
const names = block.match(/\{ name: '([^']+)'/g).map(s => s.match(/'([^']+)'/)[1]);
console.log('当前院校数: ' + names.length);
names.forEach((n,i) => console.log((i+1) + '. ' + n));
