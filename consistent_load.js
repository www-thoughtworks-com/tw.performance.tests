var fs = require('fs')
var pipelineLabel = process.env.GO_PIPELINE_LABEL || Math.floor(Date.now() / 1000);
var mkdirp = require('mkdirp');
var maxResponseTime = 3500;

var paths = [
  ['/', maxResponseTime],
  ['/insights', maxResponseTime],
  ['/insights/technology', maxResponseTime],
  ['/radar', maxResponseTime],
  ['/radar/platforms', maxResponseTime],
  ['/careers', maxResponseTime],
  ['/events', 6000], // Events seems to average around 5500
  ['/about-us', maxResponseTime],
  ['/products', maxResponseTime]
];

var results = [];
console.log('Starting performance tests...');

var raiseError = function(item, msg) {
  console.error('ERROR: ' + msg);
  console.error('Target URL: ' + item.label);
	process.exit(1);
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
