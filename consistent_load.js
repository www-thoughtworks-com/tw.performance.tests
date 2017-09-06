var fs = require('fs');
var mkdirp = require('mkdirp');
var https = require('https');
var async = require('async');

var pipelineLabel = process.env.GO_PIPELINE_LABEL || Math.floor(Date.now() / 1000);
var maxResponseTime = 3500;
var lastRunData = [];
var results = [];
var testFailed = false;
var verbose = false;
var targetHost = process.env.TEST_HOST || 'perf.webteam.thoughtworks.com';
var baseUrl = 'https://' + targetHost;

try {
  var lastRun = fs.readdirSync(__dirname + '/results/average').reverse()[0];
  lastRun = './results/average/' + lastRun;
  lastRunData = JSON.parse(fs.readFileSync(lastRun, 'utf8'));
} catch(ex) {
  console.warn('WARNING: Unable to load last run data');
}

var pathResponseTime = {
  // DO NOT JUST INCREASE THESE BECAUSE THE BUILD GOES RED!
  // Fix the performance issue.

  '/': 4000, // has insights
  '/es': 6000,  // has insights
  '/clients': maxResponseTime,
  '/services': maxResponseTime,
  '/products': maxResponseTime,
  '/insights': 5000, // is insights
  '/insights/blogs?page=2': maxResponseTime, // is insights
  '/insights/technology': 5000, // is insights
  '/api/v1/insights/technology?page=2': 5000, // is insights
  '/careers': maxResponseTime,
  '/careers/browse-jobs': 5000, // greenhouse / avature
  '/about-us': maxResponseTime,
  '/contact-us': maxResponseTime,
  '/blogs': maxResponseTime,
  '/events': maxResponseTime,
  // Other
  '/radar': maxResponseTime,
  '/radar/platforms': maxResponseTime,
  '/radar/a-z': 5000, // has insights
  '/profiles/martin-fowler': 4000 // A profile with insights
};
var paths = Object.keys(pathResponseTime);

var raiseError = function(item, msg) {
  console.log('ERROR: ' + msg);
  console.log('Target URL: ' + item.label);
  console.error('ERROR: ' + msg);
  console.error('Target URL: ' + item.label);
  testFailed = true
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

var generateRequests = function(callback) {
  var requests = paths.map(function(path) {
    var request = function(done) {
      var url = baseUrl + path;
      https.get(url, function(res) {
        verbose && console.log(url + ': ' + res.statusCode);
        done();
      });
    }
    return request;
  });

  callback(null, requests);
}

var processRequests = function(requests, callback) {
  console.log('\nWarming up to cache the pages before running the tests...');
  async.parallel(requests, function(error) {
    if(error) {
      console.error(error);
    }
    else {
      callback();
    }
  });
}

var runTests = function(callback) {
  console.log('\nStarting performance tests...');
  paths.forEach(function(path) {
    var responseTime = pathResponseTime[path];
    var cp = require('child_process');
    var result = cp.execSync('node ' + __dirname + '/consistent_load_url.js ' + (baseUrl + path));
    result = result.toString().split("\n");
    result = result[result.length - 2];
    result = result.substring(3);
    result = result.substring(0, result.length - 3);
    result = JSON.parse(result);
    verbose && console.log(result);

    validateStatusCodes(result);
    validateMaximumAverageResponseTime(result, responseTime);
    validateVsLastRunData(result);
    results.push(result);
  });
  callback();
};

var writeResults = function(callback) {
  var maxSorter = function (a, b) {
    return b.max - a.max;
  };

  var averageSorter = function (a, b) {
      return b.avg - a.avg;
  };

  console.log('Saving results to file system...');
  mkdirp.sync('./results/average');
  mkdirp.sync('./results/max');

  results.sort(averageSorter);
  fs.writeFileSync('./results/average/' + pipelineLabel + '_average.json', JSON.stringify(results));

  results.sort(maxSorter);
  fs.writeFileSync('./results/max/' + pipelineLabel + '_max.json', JSON.stringify(results));

  callback();
};

if(process.argv[2] === '--verbose' || process.argv[2] == '-v') {
  verbose = true;
}

console.log('Looking up test host...');
console.log('Using ' + targetHost + ' as the target');

async.waterfall([generateRequests, processRequests, runTests, writeResults], function() {
  console.log('Performance tests complete!');

  if(testFailed) {
    process.exit(1);
  }
});
