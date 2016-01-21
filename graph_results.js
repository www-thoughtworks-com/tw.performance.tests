var fs = require('fs')
var mkdirp = require('mkdirp');

var template = fs.readFileSync('./report_template.html').toString();

function readFiles(dirname) {
  var fileNames = fs.readdirSync(dirname);
	var data = [];
  for(var x = 0; x < fileNames.length; x++) {
		var fileName = fileNames[x];
		var content = fs.readFileSync(dirname + fileName, 'utf-8');
		var label = fileName.replace('_average.json', '');
		data.push({
			label: label,
			data: JSON.parse(content)
		});
	}
	return data;
}

data = readFiles('./results/average/');

template = template.replace('%alldata%', JSON.stringify(data));
fs.writeFileSync('./results/report.html', template);

console.log('Report generated at: ' + __dirname + '/results/report.html');
