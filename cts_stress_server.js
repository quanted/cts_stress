var path = require('path');
var express = require('express');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var querystring = require('querystring');
// var request = require('request');

var config = require('./config');

// Local requirements:
// var ctsPdfGenerator = require('./generate_pdf');

var app = express();

app.use(express.static(path.join(__dirname + '/public/css')));
app.use(express.static(path.join(__dirname + '/dist')));
app.use('/bootstrap/css', express.static(path.join(__dirname + '/node_modules/bootstrap/dist/css')));
app.use('/images', express.static(path.join(__dirname + '/public/images')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/html/cts_stress_page.html'));
});

app.post('/ajax', function(request, response) {

	var values = querystring.stringify({
        message: JSON.stringify(request.body)
    });

	var options = {
        host: config.cts.host,
        port: config.cts.port,
        path: null,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': values.length
        }
    };

    console.log("scenario: " + request.body.scenario);
    console.log("cts endpoint: " + config.cts.endpoints.cheminfo);

    if (request.body.scenario == 'Chemical Info') {
        console.log("is chemical information");
		options.path = config.cts.endpoints.cheminfo;
	}
	else if (request.body.scenario == 'Transformation Requests') {
		options.path = config.cts.endpoints.transproducts;
		console.log("trans products scenario");
	}

    console.log("CTS Endpoint: " + options.path);

    // Send message to CTS server:
    var req = http.request(options, function(res){
    // var req = https.request(options, function(res){
        res.setEncoding('utf8');        
        var response_string = '';
        res.on('data', function(message){
            response_string += message;
        });
        res.on('end', function() {
        	console.log("CTS request complete");
        	response.send(response_string);  // send to browser
        });
    });
    req.write(values);
    req.end();

});


app.listen(config.server.port, function () {
  console.log('CTS_STRESS server running!');
  console.log('Stress test page hosted at: ' + config.server.host + ':' + config.server.port);
  console.log('Test server located at ' + config.cts.host + ':' + config.cts.port);
});