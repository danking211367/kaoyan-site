const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

// Extract all script code and run a comprehensive logic test
// Simulate the init() function execution

// First, separate the scripts
const scripts = [];
let pos = 0;
while ((pos = c.indexOf('<script>', pos)) !== -1) {
  const end = c.indexOf('</script>', pos + 8);
  const code = c.substring(pos + 8, end);
  scripts.push(code);
  pos = end + 9;
}

// Simulate minimal browser environment
global.document = {
  getElementById: function(id) {
    // Find the id in the HTML
    const search = 'id="' + id + '"';
    if (c.includes(search)) {
      console.log('  ✅ getElementById("' + id + '") - found in HTML');
      return {
        innerHTML: '',
        textContent: '',
        style: {},
        querySelectorAll: function(sel) { return []; },
        setAttribute: function() {},
        getAttribute: function() { return ''; },
        onclick: null,
        addEventListener: function() {},
      };
    }
    // Try single-quote version
    const search2 = "id='" + id + "'";
    if (c.includes(search2)) {
      return { innerHTML: '', textContent: '', style: {}, querySelectorAll: function() { return []; } };
    }
    console.log('  ❌ getElementById("' + id + '") - NOT found in HTML');
    return null;
  },
  querySelectorAll: function() { return []; },
  querySelector: function() { return null; },
  addEventListener: function() {},
};

global.window = {
  open: function() {},
  addEventListener: function() {},
};

// Execute each script in order
for (let i = 0; i < scripts.length; i++) {
  try {
    new Function(scripts[i])();
    console.log('Script ' + i + ' executed successfully ✅');
  } catch (e) {
    console.log('Script ' + i + ' runtime error ❌');
    console.log('  ' + e.message.substring(0, 200));
    // Extract trace
    const lines = e.stack.split('\n');
    for (const l of lines) {
      if (l.includes('<anonymous>')) {
        console.log('  at line ~' + l.match(/:(\d+):/)?.[1] || '?');
      }
    }
  }
}
