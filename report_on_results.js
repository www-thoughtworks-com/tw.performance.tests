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
fs.writeFileSync('./results/average/' + pipelineLabel + '_average.json', JSON.stringify(average));
console.log("By average:");
console.log(JSON.stringify(average));

max = results_stats.sort(maxSorter);
fs.writeFileSync('./results/max/' + pipelineLabel + '_max.json', JSON.stringify(max));
console.log("By max:");
console.log(JSON.stringify(max));
