Scenario = require 'http-benchmark'

scenario = new Scenario()

scenario
  .get('https://integration.webteam.thoughtworks.com/insights')
  .concurrency(2)
  .actions(2)
  .throttle(1000)
  .report()
  .start();
