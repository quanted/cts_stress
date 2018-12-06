/****************************
Stress Test Results Module
****************************/

var $ = require('jquery');
var d3 = require('d3');
var simpleGraph = require('./simple-graph');  // local requirement

var StressResults = {

	results_by_calc: {
		'chemaxon': [],
		'epi': [],
		'test': [],
		'sparc': [],
		'measured': []
	},

	calcColors: {
		'chemaxon': '#c82300;',
		'epi': '#ffaf00;',
		'test': '#73b432;',
		'sparc': '#005be0;',
		'measured': '#8e44ad;'
	},

	properCalcNames: {
		'chemaxon': "ChemAxon",
		'epi': "EPI Suite",
		'test': "TESTWS",
		'sparc': "SPARC",
		'measured': "Measured"
	},

	init: function (data) {

		StressResults.data = data;
		StressResults.dyn_width = $('div#scatter-chart').width();
		StressResults.margin = {top: 30, right: 15, bottom: 60, left: 60};
		StressResults.width = StressResults.dyn_width - StressResults.margin.left - StressResults.margin.right;
		StressResults.height = 500 - StressResults.margin.top - StressResults.margin.bottom;
		StressResults.padding = 64;

		StressResults.setup();

	},

	setup: function () {

		StressResults.addIndexByResponse();  // adds 'x' key to data

		// StressResults.plotScatterChart();  // Plots original StressResults plot

		var arrayLength = StressResults.data.length;

		// var xMin = StressResults.data[0]['x'];
		var xMax = StressResults.data[arrayLength - 1]['x'];
		// var yMin = StressResults.data[0]['latency'];
		var yMax = StressResults.data[arrayLength - 1]['latency'];

		// Plots graph with rescale, pan, and zoom:
		graph = new simpleGraph('scatter-chart', {
			"xmax": xMax + 1, "xmin": 0,
			"ymax": yMax + 1, "ymin": 0, 
			"title": "CTS Stress Results",
			"xlabel": "User Response Number",
			"ylabel": "Response Latency (s)"  
		}, StressResults.data);

		StressResults.computeStats();

	},

	computeStats: function() {

		var colorCodesHtml = '<p style="color:#c82300;"><b>ChemAxon</b></p><p style="color:#ffaf00;"><b>EPI</b></p><p style="color:#73b432;"><b>TEST</b></p><p style="color:#005be0;"><b>SPARC</b></p><p style="color:#8e44ad;"><b>Measured</b></p>';
		
		// var statsHtml = '<div class="row"><div class="col-md-12">' + colorCodesHtml + '</div></div>';
		var statsHtml = '<div class="row"><div class="col-md-12">';

		var resultsByCalc = StressResults.parseDataByCalculator();

		for (var calcName in resultsByCalc) {

			var calcData = resultsByCalc[calcName];

			if (calcData.length < 1) { continue; }

			// min, max, and avg latency
			var sum = 0;
			var max_lat = 0;
			var min_lat = calcData[0]['latency'];
			for (var i = 0; i < calcData.length; i++) {
				var val = calcData[i]['latency'];
				sum += val;  // for avg
				if (val > max_lat) { max_lat = val; }
				if (val < min_lat) { min_lat = val; }
			}
			var avg_lat = sum / calcData.length;
			var stats = {
				min: min_lat.toFixed(2),
				max: max_lat.toFixed(2),
				avg: avg_lat.toFixed(2)
			};

			statsHtml += '<p style="color:' + StressResults.calcColors[calcName] + '">';
			statsHtml += '<b>' + StressResults.properCalcNames[calcName] + '</b><br>';
			statsHtml += '<b>Average Latency (s): </b>' + stats.avg + '<br>';
			statsHtml += '<b>Max Latency (s): </b>' + stats.max + '<br>';
			statsHtml += '<b>Min Latency (s): </b>' + stats.min + '<br>';
			statsHtml += '</p>';

		}

		statsHtml += '</div></div>';

		$('div#color-codes').html(statsHtml);		

		// $('div#avg-lat').html('<b>Average Latency (s): </b>' + stats.avg);
		// $('div#max-lat').html('<b>Max Latency (s): </b>' + stats.max);
		// $('div#min-lat').html('<b>Min Latency (s): </b>' + stats.min);

		// $('div#color-codes').html('<p style="color:#c82300;"><b>ChemAxon</b></p><p style="color:#ffaf00;"><b>EPI</b></p><p style="color:#73b432;"><b>TEST</b></p><p style="color:#005be0;"><b>SPARC</b></p><p style="color:#8e44ad;"><b>Measured</b></p>');
		
	},

	addIndexByResponse: function () {
		// Adds 'x' key that's indexed by response number
		for (var j = 0; j < StressResults.data.length; j++) {
			StressResults.data[j]['x'] = j + 1;
		}
	},

	parseDataByCalculator: function () {
		
		var calcResponseData = StressResults.results_by_calc;
		var calcKeys = Object.keys(calcResponseData);

		for (var j = 0; j < StressResults.data.length; j++) {
			var scatter_datum = StressResults.data[j];
			if (calcKeys.indexOf(scatter_datum.calc) > -1) {
				// Adds response data obj to calc's list:
				calcResponseData[scatter_datum.calc].push(scatter_datum);
			}
		}

		return calcResponseData;

	}


};



module.exports = StressResults;