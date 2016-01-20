var args = process.argv.slice(2);
var fs = require('fs')

var raw_results_file = args[0];

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

console.log("By average:")
results_stats.sort(averageSorter).forEach(function(stats) {
    console.log(JSON.stringify(stats))
});

console.log("By max:")
results_stats.sort(maxSorter).forEach(function(stats) {
    console.log(JSON.stringify(stats))
});

