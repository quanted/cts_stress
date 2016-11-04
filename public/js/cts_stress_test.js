
var StressTest = {

	default_request: {
		'chemical': 'CCC',
		'pchem_request': {'chemaxon': ['water_sol']},
		'calc': 'chemaxon',
		'ph': null
	},

	init: function (settings) {
		StressTest.config = {
			test_host: '134.67.114.1',
			test_port: 80,
			num_users: 10,
			user_rate: 2
		};

		// allow overriding of default config
		$.extend(StressTest.config, settings);

		// show post json in textarea
		var pretty_request = JSON.stringify(StressTest.default_request, undefined, 4);
		$('#post-data').val(pretty_request);

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

			var num_users = $('#num-users').val();
			var user_rate = $('#user-rate').val();
			var delay = Math.round(1000 / user_rate);  // delay in ms

			StressTest.runScenario(num_users, delay, 'test');

		});

		$('#stop-test').on('click', function () {
			stop_test = true;
		});

	},


	runScenario: function(num_users, delay, scenario) {

		function singlePchemRequest() {

			setTimeout(function () {    

				var request = StressTest.default_request;
				request['start_time'] = Date.now();
				// socketWhisperer(request, num_users);  // creates socket conn and listens
				StressTest.socketHandler(request, num_users);

				StressTest.scenario.calls_sent++;
				if (StressTest.scenario.calls_sent < num_users && StressTest.scenario.stop_test != true) {
					// StressTest.runScenario.singlePchemRequest();  
					singlePchemRequest();           
				}
				else { 
					StressTest.scenario.requests_complete = true;
				}

			}, delay);

		}

		function chemicalInfoRequest() {
			setTimeout(function () {    
				// mol info request goes here 
			}, delay);
		}


		StressTest.scenario = {
			stop_test:  false,
			calls_sent:  0,
			calls_received:  0,
			requests_complete:  false,
			data:  []
		}

		if (scenario == 'test') {
			singlePchemRequest();
		} 


	},


	socketHandler: function (request, total_calls) {

		var socket;
		var host = StressTest.config.test_host;
		var port = StressTest.config.test_port;

		if (typeof port === 'number') {
			socket = io.connect(host, {'port': port, 'force new connection': true});
		}
		else {
			socket = io.connect(host, {'force new connection': true});
		}

		socket.emit('get_data', JSON.stringify(request));

		socket.on('message', function(data){

			StressTest.scenario.calls_received++;
			StressTest.updateProgressBar(StressTest.scenario.calls_received, total_calls);  // num_users == total_calls

			var data_obj = JSON.parse(data);

			var start_time = data_obj['request_post']['start_time'];
			var stop_time = Date.now();

			var latency = stop_time - start_time;  // diff in ms

			if (!(typeof latency === "number")) {
				// could count as a failure?
				alert("latency value " + latency + " is NaN..");
			}
			else {
				StressTest.scenario.data.push(latency);
			}

			console.log("latency: " + latency);

			if (StressTest.scenario.calls_received == StressTest.scenario.calls_sent && StressTest.scenario.requests_complete) {
				// transfor list to indexed list of list for d3:
				// var d3_lat_array = [];
				// for (var j = 0; j < StressTest.scenario.data.length; j++) {
				// 	var xypair = [j + 1, StressTest.scenario.data[j]];
				// 	d3_lat_array.push(xypair);
				// }
				StressTest.blockInterface(false);

				// startup stress testing results:
				StressResults.init(StressTest.scenario.data);  // plot latency data

				// StressResults.computeStats();
				// StressResults.plotScatterChart(d3_lat_array, StressTest.scenario.latency_array);
			} 
		});

		socket.on('close', function(){
			socket.close();
			console.log("socket closed.");
		});

		socket.on('disconnect', function() {
			console.log("user disconnected");
		});
	},

	updateProgressBar: function(calls_tracker, total_calls) {
	    // var progress = 100 * (1 - (calls_tracker / total_calls));
	    var progress = 100 * (calls_tracker / total_calls);
	    $('#progressbar').progressbar({
	        value: progress
	    });  
	},

	cancelRequest: function() {
	    console.log("canceling request");
	    socket.emit('get_data', JSON.stringify({'cancel': true, 'pchem_request': null}));
	    blockInterface(false);
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
	            message: '<div id="pchem_wait"><h3 class="popup_header">Retrieving data...</h2><br><img src="/images/loader.gif" style="margin-top:-16px" id="load_wheel"><br><br><div id="progressbar"></div><br><input onclick="cancelRequest()" type="button" value="Cancel" id="btn-pchem-cancel"><br></div>',
	            fadeIn: 500
	        });
	    }
	    else { $.unblockUI(); }
	}

};


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
			var xypair = [j + 1, StressResults.data[j]];
			StressResults.scatter_data.push(xypair);
		}

		StressResults.plotScatterChart();
		StressResults.plotHistoChart(StressResults.data);
		StressResults.computeStats();

	},

	computeStats: function() {
		// min, max, and avg latency
		var sum = 0;
		var max_lat = 0;
		var min_lat = StressResults.data[0];
		for (var i = 0; i < StressResults.data.length; i++) {
			var val = StressResults.data[i];
			sum += val;  // for avg
			if (val > max_lat) { max_lat = val; }
			if (val < min_lat) { min_lat = val; }
		}
		var avg_lat = sum / StressResults.data.length;
		var stats = {
			min: min_lat,
			max: max_lat,
			avg: avg_lat.toFixed(1)
		};
		// return result_obj;
		$('div#avg-lat').html('<b>Average Latency (ms): </b>' + stats.avg);
		$('div#max-lat').html('<b>Max Latency (ms): </b>' + stats.max);
		$('div#min-lat').html('<b>Min Latency (ms): </b>' + stats.min);
	},

	plotScatterChart: function () {

		var x = d3.scaleLinear()
			  .domain([0, d3.max(StressResults.scatter_data, function(d) { return d[0]; })])
			  .range([ 0, StressResults.width ]);

		var y = d3.scaleLinear()
				  .domain([0, d3.max(StressResults.scatter_data, function(d) { return d[1]; })])
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

		// var valueline = d3.line()
		//     .x(function(d) { return x(d[0]); })
		//     .y(function(d) { return y(d[1]); });

		// main.append('path')
		// 	.attr('class', 'line')
		// 	.attr('d', valueline(latency_data));

		var g = main.append("svg:g"); 

		g.selectAll("scatter-dots")
		  .data(StressResults.scatter_data)
		  .enter().append("svg:circle")
			  .attr("cx", function (d,i) { return x(d[0]); } )
			  .attr("cy", function (d) { return y(d[1]); } )
			  .attr("r", 8);

		// now add titles to the axes
        scatter_chart.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (StressResults.padding/4) +","+(StressResults.height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
            .text("Latency (ms)");

        scatter_chart.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("+ (StressResults.dyn_width/2) +","+(StressResults.height + StressResults.padding)+")")  // centre below axis
            .text("User Requests");
	},

	plotHistoChart: function (histo_data) {

		var max_val = d3.max(histo_data);
		var min_val = d3.min(histo_data);

		var formatCount = d3.format(",.0f");

		var histo_chart = d3.select('div.histo-content')
			.append('svg:svg')
			.attr('width', StressResults.width + StressResults.margin.right + StressResults.margin.left)
			.attr('height', StressResults.height + StressResults.margin.top + StressResults.margin.bottom)
			.attr('class', 'chart')
			.attr('id', 'histo-chart')

		var main = histo_chart.append('g')
			.attr("transform", "translate(" + StressResults.margin.left + "," + StressResults.margin.top + ")")
			.attr('width', StressResults.width)
			.attr('height', StressResults.height)
			.attr('class', 'main')

		var x = d3.scaleLinear()
		            .domain([min_val - 1, max_val + 1])
		            .range([0, StressResults.width]);

		var x_buff = Math.round((max_val - min_val) / 10);


		var bins = d3.histogram()
		            .domain([min_val - x_buff, max_val + x_buff])
		            // .thresholds(min_val + max_val + 2)  // use domain diff for ticks (hopefully forces bin size to 1)
		            .thresholds(x_buff)
		            (histo_data);



		var y = d3.scaleLinear()
		    .domain([0, d3.max(bins, function(d) { return d.length; })])
		    .range([StressResults.height, 0]);

		var bar = main.selectAll(".bar")
		  .data(bins)
		  .enter().append("g")
		    .attr("class", "bar")
		    .attr("transform", function(d) { return "translate(" + x(d.x0 - 0.25) + "," + y(d.length) + ")"; });

		bar.append("rect")
		    .attr("x", 1)
		    // .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
		    .attr("width", x(bins[0].x1) - x(bins[0].x0))
		    .attr("height", function(d) { return StressResults.height - y(d.length); });

		bar.append("text")
		    .attr("dy", ".75em")
		    .attr("y", 6)
		    .attr("x", (x(bins[0].x1) - x(bins[0].x0)) / 2)
		    .attr("text-anchor", "middle")
		    .text(function(d) { 
		    	if (d.length > 0) {
		    		return formatCount(d.length);
		    	}
		    })

		main.append("g")
		    .attr("class", "axis axis--x")
		    .attr("transform", "translate(0," + StressResults.height + ")")
		    .call(d3.axisBottom(x));

		histo_chart.append("text")
			.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
			.attr("transform", "translate("+ (StressResults.dyn_width/2) +","+(StressResults.height+StressResults.padding)+")")  // centre below axis
			.text("Latency (ms)");
	}

};

$(document).ready(StressTest.init);