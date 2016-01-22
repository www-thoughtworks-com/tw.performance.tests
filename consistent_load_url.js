require('coffee-script')
var Scenario = require('http-benchmark')
var base_url = process.env.TEST_URL || 'http://perf.webteam.thoughtworks.com';
var path = process.argv[2];

new Scenario()
  .get(base_url + path)
  .concurrency(1)
  .actions(1)
  .throttle(10)
  .report()
  .start();
