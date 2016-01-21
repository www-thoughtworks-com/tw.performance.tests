var fs = require('fs')
var pipelineLabel = process.env.GO_PIPELINE_LABEL || Math.floor(Date.now() / 1000);
var mkdirp = require('mkdirp');

var paths = [
  '/',
  '/insights',
  '/insights/technology',
  '/radar',
  '/radar/platforms',
  '/careers',
  '/events',
  '/about-us',
  '/products'
];

var results = [];
console.log('Starting performance tests...');

for(var x = 0; x < paths.length; x++) {
  var path = paths[x];
  var cp = require('child_process');
  var result = cp.execSync('/usr/local/bin/node ' + __dirname + '/test_url.js ' + path); 
  result = result.toString().split("\n");
  result = result[result.length -2];
  result = result.substring(3);
  result = result.substring(0, result.length -3);
  result = JSON.parse(result);
  console.log(result);
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

average.forEach(function(item) {
  var array = Object.keys(item.statuses);
	var index = array.indexOf('200');
	if (index > -1) {
  	array.splice(index, 1);
	}

	if(array.length > 0) {
		// unexpected status codes!
		console.error('ERROR: Unexpected status codes "' + array.join(', ') + '"');
		console.error('Target URL: ' + item.label);
		process.exit(1);
	}
});

mkdirp.sync('./results/average');
mkdirp.sync('./results/max');

fs.writeFileSync('./results/average/' + pipelineLabel + '_average.json', JSON.stringify(average));
fs.writeFileSync('./results/max/' + pipelineLabel + '_max.json', JSON.stringify(max));
