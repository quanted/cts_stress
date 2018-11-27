const config = require('../../config');  // import cts_stress config

// Requirements:
var $ = require('jquery');
var blockUI = require('block-ui');
var eventemitter2 = require('eventemitter2');
var socketio = require('socket.io-client');
var d3 = require('d3');



/****************************
Stress Test Module
****************************/
var StressTest = {

	default_request: {
		'chemical': 'CCC',
		'pchem_request': {'chemaxon': ['water_sol']},
		'calc': 'chemaxon'
	},

	chemical_info_request: {
		'chemical': 'CCC'
	},

	pchem_request: {
		'chemical': 'CCC',
		'pchem_request': {},
		'ph': 7.4
	},

	transformation_request: {
		"structure": "CCC",
		"generationLimit": 2,
		'populationLimit': 0,
        'likelyLimit': 0.001,
        'excludeCondition': ""
	},

	available_props: {
		'chemaxon': ['water_sol', 'ion_con', 'kow_no_ph', 'kow_wph', 'water_sol_ph'],
		'epi': ['melting_point', 'boiling_point', 'water_sol', 'vapor_press', 'henrys_law_con', 'kow_no_ph', 'koc', 'log_bcf', 'log_baf'],
		'test': ['melting_point', 'boiling_point', 'water_sol', 'vapor_press', 'log_bcf'],
		'sparc': ['boiling_point', 'water_sol', 'vapor_press', 'mol_diss', 'mol_diss_air', 'ion_con', 'henrys_law_con', 'kow_no_ph', 'kow_wph'],
		'measured': ['melting_point', 'boiling_point', 'water_sol', 'vapor_press', 'henrys_law_con', 'kow_no_ph']
	},

	selected_calcs: [],

	scenario: {
		stop_test:  false,
		calls_sent:  0,
		calls_received:  0,
		requests_complete:  false,
		total_calls: 0,
		data:  []
	},

	result_obj: {
		x: null,
		latency: null,
		sessionid: null,
		calc: null
	},



	init: function (settings) {
		StressTest.config = {
			test_host: 'localhost',
			test_port: 4000,
			num_users: 1,
			user_rate: 2,
			ajax_path: '/ajax'
		};

		// allow overriding of default config
		$.extend(StressTest.config, settings);

		StressTest.setup();  // run setup after init

	},



	setup: function () {

		$('#host').val(StressTest.config.test_host);
		$('#port').val(StressTest.config.test_port);
		$('#num-users').val(StressTest.config.num_users);
		$('#user-rate').val(StressTest.config.user_rate);

		$('#start-test').on('click', function () {

			StressTest.blockInterface(true);

			$('svg.chart').remove();  // clear charts from page
			$('.stats').html('');  // clear stat divs
			// $('div#color-codes').hide();
			$('div#color-codes').html('');
			StressTest.selected_calcs = []; // start with fresh array

			var host = $('#host').val();
			var port = parseFloat($('#port').val());

			StressTest.config.test_host = host;
			StressTest.config.test_port = port;

			var num_users = $('#num-users').val();
			var user_rate = $('#user-rate').val();
			var delay = Math.round(1000 / user_rate);  // delay in ms
			var user_scenario = $('.selectpicker').children(':selected').text();

			// populate selected_calcs array from calc buttons:
			$('.calc-options .active').each(function() {StressTest.selected_calcs.push($(this).html())});

			StressTest.runScenario(num_users, delay, user_scenario);

		});

		$('#stop-test').on('click', function () {
			stop_test = true;
		});

		$('.selectpicker').change(function () {
			var selected_scenario = $(this).children(':selected').text();
			if (selected_scenario == 'P-chem Requests') {
				$('.calc-options').show();
				$('#batch-upload-div').hide();
			}
			else if (selected_scenario == 'P-chem Requests (batch)') {
				$('#batch-upload-div').show();
				$('.calc-options').show();	
			}
			else {
				$('#batch-upload-div').hide();
				$('.calc-options').hide();
			}
		});

		// Do this stuff once file is uploaded:
		$('#upfile1').change(function () {

			var file = this.files[0];
			var textType = /text.*/;

			if (file.type.match(textType)) {
				var reader = new FileReader();
				reader.onload = function (e) {
					StressTest.batch_data = StressTest.readBatchInputFile(reader.result);
				}
				reader.readAsText(file);
			}
			else {
				$('#fileDisplayArea').html("File not supported!");
			}

		});

		$('#download-pdf-button').on('click', function() {
			// Submit PDF POST form
			$('form.post_form').submit();
		});


	},



	runScenario: function(num_users, delay, scenario) {

		function start() {

			setTimeout(function () {    

				var request = {};

				switch(scenario) {

					case 'Chemical Info':
						request = StressTest.chemical_info_request;
						request['start_time'] = Date.now();
						request['scenario'] = scenario
						StressTest.ajaxHandler(request);
						break;

					case 'P-chem Requests':
						// each user requesting multiple calcs:
						request = StressTest.pchem_request;
						for (var i = 0; i < StressTest.selected_calcs.length; i++) {
							var calc = StressTest.selected_calcs[i];
							request['pchem_request'][calc] = StressTest.available_props[calc];
						}
						request['start_time'] = Date.now();
						StressTest.socketHandler(request);
						break;

					case 'P-chem Requests (batch)':
						// each user requesting multiple calcs:
						if (StressTest.batch_data.length < 1) {
							alert("Upload a list of batch chemicals before running the P-chem Requests batch scenario.");
							return;
						}
						request = StressTest.pchem_request;
						for (var i = 0; i < StressTest.selected_calcs.length; i++) {
							var calc = StressTest.selected_calcs[i];
							request['pchem_request'][calc] = StressTest.available_props[calc];
						}
						request['nodes'] = StressTest.batch_data;
						request['start_time'] = Date.now();
						StressTest.socketHandler(request);
						break;

					case 'Transformation Requests':
						// each user requesting trans products
						request = StressTest.transformation_request;
						request['start_time'] = Date.now();
						request['scenario'] = scenario
						StressTest.socketHandler(request);
						break;
					case 'Test':
					default:
						request = StressTest.default_request;
						request['start_time'] = Date.now();
						StressTest.socketHandler(request);
						break;

				}

				StressTest.scenario.calls_sent++;
				if (StressTest.scenario.calls_sent < num_users && StressTest.scenario.stop_test != true) {
					start();  // continues looping requests           
				}
				else { 
					StressTest.scenario.requests_complete = true;
				}

			}, delay);

		}


		StressTest.scenario = {
			stop_test:  false,
			calls_sent:  0,
			calls_received:  0,
			requests_complete:  false,
			total_calls: 0,
			data:  []
		}

		// Determines total calls before scenario loop:
		StressTest.calculateTotalCalls(num_users, scenario);

		start();  // starts request loop

	},



	socketHandler: function (request) {

		var socket;
		var host = StressTest.config.test_host;
		var port = StressTest.config.test_port;

		if (typeof port === 'number') {
			socket = socketio.connect('http://' + host + ':' + port, {'force new connection': true});
		}
		else {
			socket = socketio.connect(host, {'force new connection': true});
		}

		socket.emit('get_data', JSON.stringify(request));

		socket.on('message', function(data){

			StressTest.scenario.calls_received++;
			StressTest.updateProgressBar();  // num_users == total_calls

			var data_obj = JSON.parse(data);

			StressTest.trackProgress(data_obj);

		});

		socket.on('close', function(){
			socket.close();
			console.log("socket closed.");
		});

		socket.on('disconnect', function() {
			console.log("user disconnected");
		});

		socket.on('error', function() {
			console.log("socket error event triggered!");
		});
	},



	ajaxHandler: function(request) {
		$.ajax({
			url: StressTest.config.ajax_path,
			type: 'POST',
			data: request,
			// timeout: 5000,
			success: function(data) {
				StressTest.scenario.calls_received++;
				StressTest.updateProgressBar();

				console.log("Returned data: " + data);  // actual data, or error?

				var data_obj = JSON.parse(data);
				StressTest.trackProgress(data_obj);

			},
			error: function(jqXHR, textStatus, errorThrown) {
				// TODO: add to failures count instead of null start_time
				console.log("Ajax error: " + textStatus);
				StressTest.scenario.calls_received++;

				var error_data = {'request_post': {'start_time': null}};

				StressTest.trackProgress();
				StressTest.updateProgressBar();
			}
		});
	},



	trackProgress: function (data_obj) {
		var start_time = data_obj['request_post']['start_time'];
		var stop_time = Date.now();

		// var latency = stop_time - start_time;  // diff in ms
		var latency = (stop_time - start_time) / 1000;  // diff in s

		var d3_data_obj = {
			latency: latency,
			sessionid: data_obj['request_post']['sessionid'],
			calc: data_obj['request_post']['calc']
		};


		if (!(typeof d3_data_obj.latency === "number")) {
			// could count as a failure?
			alert("latency value " + d3_data_obj.latency + " is NaN..");
		}
		else {
			StressTest.scenario.data.push(d3_data_obj);
		}

		console.log("latency: " + d3_data_obj.latency);
		console.log("received: " + StressTest.scenario.calls_received + " out of " + StressTest.scenario.total_calls);

		if (StressTest.scenario.calls_received == StressTest.scenario.total_calls && StressTest.scenario.requests_complete) {
			StressTest.blockInterface(false);
			StressResults.init(StressTest.scenario.data);
		}

	},



	calculateTotalCalls: function (num_users, scenario) {
		
		switch(scenario) {

			case 'P-chem Requests':
				StressTest.calculateNumberOfPchemRequests(num_users, 1);
				break;

			case 'P-chem Requests (batch)':
				StressTest.calculateNumberOfPchemRequests(num_users, StressTest.batch_data.length);
				break;

			// Below cases all use the default case
			case 'Transformation Requests':
			case 'Chemical Info':
			case 'Test':
			default:
				StressTest.scenario.total_calls = num_users;
				break;

		}

	},



	calculateNumberOfPchemRequests: function(num_users, num_chems=1) {
		// each user requesting multiple props/calcs:
		for (var i = 0; i < StressTest.selected_calcs.length; i++) {
			var calc = StressTest.selected_calcs[i];
			if (calc == "chemaxon") {
				StressTest.scenario.total_calls += 9;
			}
			else if (calc == "sparc") {
				StressTest.scenario.total_calls += 9;	
			}
			else if (calc == "epi" ) {
				StressTest.scenario.total_calls += 12;
			}
			else if (calc == "test") {
				StressTest.scenario.total_calls += 16;
			}
			else if (calc == "measured") {
				StressTest.scenario.total_calls += 6;
			}
		}

		StressTest.scenario.total_calls *= num_users;  // accounts for num of users
		StressTest.scenario.total_calls *= num_chems;  // accounts for num of chemicals (e.g., batch mode)

		console.log(StressTest.scenario.total_calls);
		return;
	},



	updateProgressBar: function() {
	    var progress = 100 * (StressTest.scenario.calls_received / StressTest.scenario.total_calls);
	    $('#progressbar').html("<h3>" + parseInt(progress) + "%</h3>");
	},



	cancelRequest: function() {
	    console.log("canceling request");
	    socket.emit('get_data', JSON.stringify({'cancel': true, 'pchem_request': null}));
	    StressTest.blockInterface(false);
	},



	blockInterface: function(block) {
	    if (block) {
	        $.blockUI({
	            css: {
	                "padding": "30px 20px",
	                "width": "400px",
	                "height": "250px",
	                "border": "0 none",
	                "border-radius": "4px",
	                "-webkit-border-radius": "4px",
	                "-moz-border-radius": "4px",
	                "box-shadow": "3px 3px 15px #333",
	                "-webkit-box-shadow": "3px 3px 15px #333",
	                "-moz-box-shadow": "3px 3px 15px #333"
	            },
	            message: '<div id="pchem_wait"><h3 class="popup_header">Retrieving data...</h3><br><div id="progressbar"><h3>0%</h3></div><br><input onclick="StressTest.cancelRequest()" type="button" value="Cancel" id="btn-pchem-cancel"><br></div>',
	            fadeIn: 500
	        });
	    }
	    else { $.unblockUI(); }
	},



	readBatchInputFile: function(file_content) {

		var batchData = [];
		var batchChems = file_content.replace(/\n/g, ",").split(",");  // chemicals in array

		// Adds data to batch chems:
		for (var chemInd in batchChems) {
			var chemObj = {};
			chemObj['smiles'] = batchChems[chemInd];
			chemObj['mass'] = 0.0;
			batchData.push(chemObj);
		}

		return batchData;

	}

};







/****************************
Stress Test Results Module
****************************/
var StressResults = {

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
		// d3ize data (array --> array of xypairs)
		StressResults.scatter_data = [];
		for (var j = 0; j < StressTest.scenario.data.length; j++) {
			var scatter_datum = StressTest.scenario.data[j];
			scatter_datum['x'] = j + 1;
			StressResults.scatter_data.push(scatter_datum);
		}

		StressResults.plotScatterChart();
		StressResults.computeStats();

	},

	computeStats: function() {
		// min, max, and avg latency
		var sum = 0;
		var max_lat = 0;
		var min_lat = StressResults.data[0]['latency'];
		for (var i = 0; i < StressResults.data.length; i++) {
			var val = StressResults.data[i]['latency'];
			sum += val;  // for avg
			if (val > max_lat) { max_lat = val; }
			if (val < min_lat) { min_lat = val; }
		}
		var avg_lat = sum / StressResults.data.length;
		var stats = {
			min: min_lat.toFixed(2),
			max: max_lat.toFixed(2),
			avg: avg_lat.toFixed(2)
		};
		// return result_obj;
		$('div#avg-lat').html('<b>Average Latency (s): </b>' + stats.avg);
		$('div#max-lat').html('<b>Max Latency (s): </b>' + stats.max);
		$('div#min-lat').html('<b>Min Latency (s): </b>' + stats.min);

		$('div#color-codes').html('<p style="color:#c82300;"><b>ChemAxon</b></p><p style="color:#ffaf00;"><b>EPI</b></p><p style="color:#73b432;"><b>TEST</b></p><p style="color:#005be0;"><b>SPARC</b></p><p style="color:#8e44ad;"><b>Measured</b></p>');
		
	},

	plotScatterChart: function () {

		var x = d3.scaleLinear()
			  .domain([0, d3.max(StressResults.scatter_data, function(d) { return d.x; })])
			  .range([ 0, StressResults.width ]);

		var y = d3.scaleLinear()
				  .domain([0, d3.max(StressResults.scatter_data, function(d) { return d.latency; })])
				  .range([ StressResults.height, 0 ]);

		// appends chart to body of page:
		// var scatter_chart = d3.select('body')
		var scatter_chart = d3.select('div.content')
			.append('svg:svg')
			.attr('width', StressResults.width + StressResults.margin.right + StressResults.margin.left)
			.attr('height', StressResults.height + StressResults.margin.top + StressResults.margin.bottom)
			.attr('class', 'chart')
			.attr('id', 'scatter-chart')

		var main = scatter_chart.append('g')
			.attr('transform', 'translate(' + StressResults.margin.left + ',' + StressResults.margin.top + ')')
			.attr('width', StressResults.width)
			.attr('height', StressResults.height)
			.attr('class', 'main')   
			
		var xAxis = d3.axisBottom(x);

		main.append('g')
			.attr('transform', 'translate(0,' + StressResults.height + ')')
			.attr('class', 'main axis date')
			.call(xAxis);

		var yAxis = d3.axisLeft(y);

		main.append('g')
			.attr('transform', 'translate(0,0)')
			.attr('class', 'main axis date')
			.call(yAxis);

		var g = main.append("svg:g"); 

		g.selectAll("scatter-dots")
		  .data(StressResults.scatter_data)
		  .enter().append("svg:circle")
			  .attr("cx", function (d,i) { return x(d.x); } )
			  .attr("cy", function (d) { return y(d.latency); } )
			  .attr("r", 3)  // radius of dots for scatter plot
			  .style("fill", function (d, i) {
			  	// want to color code by calc here.
			  	if (d.calc == "chemaxon") {
			  		return "#c82300";
			  	}
			  	else if (d.calc == "epi") {
			  		return "#ffaf00";
			  	}
			  	else if (d.calc == "test") {
			  		return "#73b432";
			  	}
			  	else if (d.calc == "sparc") {
			  		return "#005be0";
			  	}
			  	else if (d.calc == "measured") {
			  		return " #8e44ad";
			  	}
			  	else {
			  		return "black";
			  	}
			  });

		// now add titles to the axes
        scatter_chart.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (StressResults.padding/4) +","+(StressResults.height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
            .text("Latency (s)");

        scatter_chart.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (StressResults.dyn_width/2) +","+(StressResults.height + StressResults.padding)+")")  // centre below axis
            .text("User Requests");
	},

};



module.exports = StressTest;