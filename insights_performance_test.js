require('coffee-script')
var Scenario = require('http-benchmark')
var base_url = 'http://perf.webteam.thoughtworks.com';

scenario = new Scenario()

var paths = [
  '/insights',
  '/insights/technology',
  '/radar',
  '/radar/platforms',
  '/', 
  '/careers',
  '/events',
  '/about-us',
  '/products'
]

paths.forEach(function(path) {
  scenario.get(base_url + path)
})

scenario.concurrency(8)
  .actions(3)
  .throttle(5000)
  .report()
  .start();
