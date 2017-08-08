var fs = require('fs');
var mkdirp = require('mkdirp');

var pipelineLabel = process.env.GO_PIPELINE_LABEL || Math.floor(Date.now() / 1000);
var maxResponseTime = 3500;
var lastRunData = [];
var results = [];
var test_failed = false;
var target_host = process.env.TEST_HOST || 'perf.webteam.thoughtworks.com';
var base_url = 'https://' + target_host;

try {
  var lastRun = fs.readdirSync(__dirname + '/results/average').reverse()[0];
  lastRun = './results/average/' + lastRun;
  lastRunData = JSON.parse(fs.readFileSync(lastRun, 'utf8'));
} catch(ex) {
  console.warn('WARNING: Unable to load last run data');
}

var paths = [
  // DO NOT JUST INCREASE THESE BECAUSE THE BUILD GOES RED!
  // Fix the performance issue.

  ['/', 4000], // has insights
  ['/es', 6000],  // has insights
  ['/clients', maxResponseTime],
  ['/services', maxResponseTime],
  ['/products', maxResponseTime],
  ['/insights', 5000], // is insights
  ['/insights/blogs?page=2', maxResponseTime], // is insights
  ['/insights/technology', 5000], // is insights
  ['/api/v1/insights/technology?page=2', 5000], // is insights
  ['/careers', maxResponseTime],
  ['/careers/browse-jobs', 5000], // greenhouse / avature 
  ['/about-us', maxResponseTime],
  ['/contact-us', maxResponseTime],
  ['/blogs', maxResponseTime],
  ['/sitemap-en.xml', maxResponseTime],
  ['/events', maxResponseTime], 
  // Other
  ['/radar', maxResponseTime],
  ['/radar/platforms', maxResponseTime],
  ['/radar/a-z', 5000], // has insights
  ['/profiles/martin-fowler', 4000] // A profile with insights
];

var raiseError = function(item, msg) {
  console.log('ERROR: ' + msg);
  console.log('Target URL: ' + item.label);
  console.error('ERROR: ' + msg);
  console.error('Target URL: ' + item.label);
  test_failed = true
};

var raiseWarning = function(item, msg) {
  console.warn('WARNING: ' + msg);
  console.info('Target URL: ' + item.label);
};

var validateStatusCodes = function (item) {
  var array = Object.keys(item.statuses);
	var index = array.indexOf('200');
	if (index > -1) {
  	array.splice(index, 1);
	}

	if(array.length > 0) {
		// unexpected status codes!
    raiseError(item, 'Unexpected status codes (' + array.join(', ') + ')')
	}
};

var validateMaximumAverageResponseTime = function(item, responseTime) {
  if(parseFloat(item.avg) > parseFloat(responseTime)) {
    raiseError(item, 'Average response time (' + item.avg.toString() + 'ms) exceeded maximum response time (' + responseTime.toString() + 'ms)');
  }
};

var validateVsLastRunData = function(item) {
  var lastResult = lastRunData.find(function(a) { return a.label == item.label; });
  if(lastResult) {
    var avg = parseInt(item.avg);
    var newMaximum = parseFloat(lastResult.avg) * 1.1; // 1.1 = 10% increase
    if(avg > newMaximum) {
      raiseWarning(item, 'Average response time (' + item.avg.toString() + 'ms) was more than 10% more than the previous response time (' + lastResult.avg + 'ms)');
    }
  }
};

var runTests = function() {
  console.log('Starting performance tests...');
  for (var x = 0; x < paths.length; x++) {
    var path = paths[x][0];
    var responseTime = paths[x][1];
    var cp = require('child_process');
    var result = cp.execSync('node ' + __dirname + '/consistent_load_url.js ' + (base_url + path));
    result = result.toString().split("\n");
    result = result[result.length - 2];
    result = result.substring(3);
    result = result.substring(0, result.length - 3);
    result = JSON.parse(result);
    console.log(result);

    validateStatusCodes(result);
    validateMaximumAverageResponseTime(result, responseTime);
    validateVsLastRunData(result);
    results.push(result);
  }
};

var maxSorter = function (a, b) {
    return b.max - a.max;
};
var averageSorter = function (a, b) {
    return b.avg - a.avg;
};

var writeResults = function() {
  console.log('Saving results to file system...');
  mkdirp.sync('./results/average');
  mkdirp.sync('./results/max');

  results.sort(averageSorter);
  fs.writeFileSync('./results/average/' + pipelineLabel + '_average.json', JSON.stringify(results));

  results.sort(maxSorter);
  fs.writeFileSync('./results/max/' + pipelineLabel + '_max.json', JSON.stringify(results));
};

var init = function() {
  console.log('Looking up test host...');
  console.log('Using ' + target_host + ' as the target');

  runTests();
  writeResults();

  console.log('Performance tests complete!');

  if(test_failed) {
    process.exit(1);
  }
};

init();
