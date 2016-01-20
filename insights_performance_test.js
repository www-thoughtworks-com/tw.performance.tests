require('coffee-script')
var Scenario = require('http-benchmark')

scenario = new Scenario()

scenario
  .get('http://perf.webteam.thoughtworks.com/insights')
  .concurrency(20)
  .actions(2)
  .throttle(100)
  .report()
  .start();
