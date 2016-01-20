require('coffee-script')
var Scenario = require('http-benchmark')

scenario = new Scenario()

scenario
  .get('http://perf.webteam.thoughtworks.com/insights')
  .get('http://perf.webteam.thoughtworks.com/insights/technology')
  .get('http://perf.webteam.thoughtworks.com/radar')
  .get('http://perf.webteam.thoughtworks.com/radar/platforms')
  .get('http://perf.webteam.thoughtworks.com/')
  .get('http://perf.webteam.thoughtworks.com/careers')
  .get('http://perf.webteam.thoughtworks.com/events')
  .get('http://perf.webteam.thoughtworks.com/about-us')
  .get('http://perf.webteam.thoughtworks.com/products')
  .concurrency(8)
  .actions(10)
  .throttle(5000)
  .report()
  .start();
