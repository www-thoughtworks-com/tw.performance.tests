require('coffee-script')
var Scenario = require('http-benchmark')
var base_url = 'http://perf.webteam.thoughtworks.com';
var path = process.argv[2];

new Scenario()
  .get(base_url + path)
  .concurrency(1)
  .actions(2)
  .throttle(1)
  .report()
  .start();
