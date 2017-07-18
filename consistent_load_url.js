require('coffee-script')
var Scenario = require('http-benchmark');
var url = process.argv[2]

new Scenario()
  .get(url)
  .concurrency(2)
  .actions(50)
  .throttle(10)
  .report()
  .start();
