var fs = require('fs')
var pipelineLabel = process.env.GO_PIPELINE_LABEL || Math.floor(Date.now() / 1000);
var mkdirp = require('mkdirp');
var maxResponseTime = 3000;

var lastRunData = [];

try { 
  var lastRun = fs.readdirSync(__dirname + '/results/average').reverse()[0];
  lastRun = './results/average/' + lastRun;
  lastRunData = JSON.parse(fs.readFileSync(lastRun, 'utf8'));
} catch(ex) {
  console.warn('WARNING: Unable to load last run data');
}

var paths = [
  // Top level
  ['/', 4000],
  ['/es', 6500],
  ['/clients', maxResponseTime],
  ['/services', maxResponseTime],
  ['/products', maxResponseTime],
  ['/insights', 10000],
  ['/insights/blogs?page=2', 3500],
  ['/insights/technology', 20000],
  ['/api/v1/insights/technology?page=2', 8000],
  ['/careers', 4000],
  ['/careers/browse-jobs', 5000],
  ['/about-us', maxResponseTime],
  ['/contact-us', maxResponseTime],
  ['/blogs', 4000],
  ['/sitemap-en.xml', maxResponseTime],
  ['/events', maxResponseTime], 
  // Other
  ['/radar', maxResponseTime],
  ['/radar/platforms', maxResponseTime],
  ['/radar/a-z', 5000],
  ['/profiles/martin-fowler', 4000] // A profile with insights
];

var results = [];

var raiseError = function(item, msg) {
  console.error('ERROR: ' + msg);
  console.error('Target URL: ' + item.label);
	process.exit(1);
}

var raiseWarning = function(item, msg) {
  console.warn('WARNING: ' + msg);
  console.info('Target URL: ' + item.label);
}

var validateStatusCodes = function(item, msg) {
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

console.log('Looking up test host...');
process.env.TEST_URL=require('child_process').execSync("rake nodes | grep -i imageperf | grep -i $GO_PIPELINE_LABEL | awk '{print $1}'", { env: process.env }).toString().trim();
process.env.TEST_URL = 'http://' + process.env.TEST_URL;
console.log('Using ' + process.env.TEST_URL + ' as the target host');
console.log('Starting performance tests...');

for(var x = 0; x < paths.length; x++) {
  var path = paths[x][0];
  var responseTime = paths[x][1];
  var cp = require('child_process');
  var result = cp.execSync('node ' + __dirname + '/consistent_load_url.js ' + path, { env: process.env }); 
  result = result.toString().split("\n");
  result = result[result.length -2];
  result = result.substring(3);
  result = result.substring(0, result.length -3);
  result = JSON.parse(result);
  console.log(result);

  validateStatusCodes(result);
  validateMaximumAverageResponseTime(result, responseTime);
  validateVsLastRunData(result);
  results.push(result);
}

var maxSorter = function (a, b) {
    return b.max - a.max;
};
var averageSorter = function (a, b) {
    return b.avg - a.avg;
};

var average = results.sort(averageSorter);
var max = results.sort(maxSorter);

console.log('Saving results to file system...');
mkdirp.sync('./results/average');
mkdirp.sync('./results/max');

fs.writeFileSync('./results/average/' + pipelineLabel + '_average.json', JSON.stringify(average));
fs.writeFileSync('./results/max/' + pipelineLabel + '_max.json', JSON.stringify(max));

console.log('Performance tests complete!');
