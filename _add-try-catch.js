const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Add console error logging at the top of init()
// Find the init function
const initIdx = c.lastIndexOf('function init()');
const braceIdx = c.indexOf('{', initIdx);

// Wrap each render call in try-catch to isolate failures
const oldInit = c.substring(initIdx, braceIdx + 1);
const newInit = oldInit + `
  try {
    renderTimeline();
  } catch(e) { console.error('renderTimeline failed:', e); }
  try {
    uniFilteredData = [...universities];
    uniCurrentPage = 1;
    renderUniPage();
  } catch(e) { console.error('renderUniPage failed:', e); }
  try {
    renderLineTable(lineData);
  } catch(e) { console.error('renderLineTable failed:', e); }
  try {
    renderScoreTable(lineData);
  } catch(e) { console.error('renderScoreTable failed:', e); }
  try {
    renderMajors();
  } catch(e) { console.error('renderMajors failed:', e); }
  try {
    renderTips();
  } catch(e) { console.error('renderTips failed:', e); }
  try {
    renderCountdown();
  } catch(e) { console.error('renderCountdown failed:', e); }
  try {
    renderStudyPlan();
  } catch(e) { console.error('renderStudyPlan failed:', e); }
  try {
    renderSchedule();
  } catch(e) { console.error('renderSchedule failed:', e); }
  try {
    renderResources();
  } catch(e) { console.error('renderResources failed:', e); }
  try {
    renderHotArticles();
  } catch(e) { console.error('renderHotArticles failed:', e); }
  try {
    renderLinks();
  } catch(e) { console.error('renderLinks failed:', e); }
  try {
    renderExamTable(examData);
  } catch(e) { console.error('renderExamTable failed:', e); }
  try {
    renderAdjustList(adjustData);
  } catch(e) { console.error('renderAdjustList failed:', e); }
  try {
    renderAdjustTimeline();
  } catch(e) { console.error('renderAdjustTimeline failed:', e); }
  try {
    initCompareSelects();
  } catch(e) { console.error('initCompareSelects failed:', e); }
  console.log('✅ init() complete');
`;

c = c.replace(
  c.substring(initIdx, c.indexOf(';', braceIdx + 10)),
  newInit
);

fs.writeFileSync('index.html', c, 'utf8');
fs.writeFileSync('public/index.html', c, 'utf8');
console.log('✅ Added try-catch wrappers to init()');
