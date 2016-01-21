var args = process.argv.slice(2);
var fs = require('fs')
var raw_results_file = args[0];
var pipelineLabel = process.env.GO_PIPELINE_LABEL || Math.floor(Date.now() / 1000);
var mkdirp = require('mkdirp');

function extractResultsStatsFromLog(logfile) {
    var results_log = fs.readFileSync(logfile, "utf8")
    var stats_json = ('[' + results_log.split("\n[ '")[1]).replace(/'/g, "");
    return JSON.parse(stats_json);
}

var results_stats = extractResultsStatsFromLog(raw_results_file);

var maxSorter = function (a, b) {
    return b.max - a.max;
};
var averageSorter = function (a, b) {
    return b.avg - a.avg;
};

mkdirp.sync('./results/average');
mkdirp.sync('./results/max');

average = results_stats.sort(averageSorter);
max = results_stats.sort(maxSorter);

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



// Output results to Go
console.log("By average:");
console.log(JSON.stringify(average));

console.log("By max:");
console.log(JSON.stringify(max));

// Write results to file
fs.writeFileSync('./results/average/' + pipelineLabel + '_average.json', JSON.stringify(average));
fs.writeFileSync('./results/max/' + pipelineLabel + '_max.json', JSON.stringify(max));
