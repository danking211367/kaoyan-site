const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');

const critical = [
  ['function init()', 'init function'],
  ['function renderCountdown', 'countdown renderer'],
  ['function renderUniPage', 'uni page renderer'],
  ['function renderUniList', 'uni list renderer'],
  ['function renderMajors', 'majors renderer'],
  ['function renderTips', 'tips renderer'],
  ['function renderSchedule', 'schedule renderer'],
  ['function renderResources', 'resources renderer'],
  ['function renderHotArticles', 'hot articles renderer'],
  ['function renderLineTable', 'line table renderer'],
  ['function renderScoreTable', 'score table renderer'],
  ['function switchTab', 'tab switcher'],
  ['function filterUni', 'uni filter'],
  ['function filterScoreLine', 'score filter'],
  ['function showUniDetail', 'uni detail modal'],
  ['function showMajorDetail', 'major detail modal'],
  ['const universities =', 'universities array'],
  ['const majorData =', 'majors array'],
  ['const lineData =', 'line data'],
  ['var adjustData =', 'adjust data'],
  ['id="uniGrid"', 'uni grid element'],
  ['id="majorFullGrid"', 'major full grid element'],
  ['id="tab-prepare"', 'prepare tab element'],
  ['id="countdownDays"', 'countdown element'],
  ['id="tipsList"', 'tips list element'],
  ['id="studyPlanList"', 'study plan element'],
  ['id="scheduleDisplay"', 'schedule element'],
  ['id="resourceList"', 'resources element'],
  ['renderCountdown();', 'renderCountdown called'],
  ['renderStudyPlan();', 'renderStudyPlan called'],
  ['renderSchedule();', 'renderSchedule called'],
  ['renderResources();', 'renderResources called'],
  ['init();', 'init() called at end'],
];

let ok = 0, fail = 0;
for (const [search, label] of critical) {
  if (c.includes(search)) {
    ok++;
  } else {
    console.log('MISSING: ' + label);
    fail++;
  }
}
console.log(ok + ' checks passed, ' + fail + ' failed');
