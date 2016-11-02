$(document).ready(function () {

	var pchem_request = {
		'chemical': 'CCC',
		'pchem_request': {'chemaxon': ['water_sol']},
		'calc': 'chemaxon',
		'ph': null
	};

	var stop_test = false;
	var start_time, stop_time, latency;
	var avg_lat, min_lat, max_lat;
	var lat_array = [];

	var pretty_request = JSON.stringify(pchem_request, undefined, 4);
	$('#post-data').val(pretty_request);

	$('#start-test').on('click', function () {

		blockInterface(true);

		stop_test = false;
		$('svg.chart').remove();  // clear charts from page
		$('.stats').html('');  // clear stat divs
		lat_array = [];  // latency array

		var host = $('#host').val();
		var port = $('#port').val();

		var num_users = $('#num-users').val();
		var user_rate = $('#user-rate').val();
		var delay = Math.round(1000 / user_rate);  // delay in ms

		var calls_sent = 0;
		var calls_received = 0;
		var requests_complete = false;

		function loopCalls() {          

			setTimeout(function () {    

				var request = pchem_request;
				request['start_time'] = Date.now();
				socketWhisperer(request);

				calls_sent++;
				if (calls_sent < num_users && stop_test != true) {
					loopCalls();             
				}
				else { 
					requests_complete = true;
				} 

			}, delay)

		}
		loopCalls();


		function socketWhisperer(request) {

			var socket;
			if (typeof port === 'number') {
				socket = io.connect(host, {'force new connection': true});
			}
			else {
				socket = io.connect(host, {'port': port, 'force new connection': true});
			}

			socket.emit('get_data', JSON.stringify(request));

			socket.on('message', function(data){
				// calls_sent--;  // decrement call counter
				calls_received++;
				updateProgressBar(calls_received, num_users);  // num_users == total_calls

				var data_obj = JSON.parse(data);
				start_time = data_obj['request_post']['start_time'];
				stop_time = Date.now();
				latency = stop_time - start_time;  // diff in ms

				if (!(typeof latency === "number")) {
					// could this count as a failure?
					alert("latency value " + latency + " is NaN..");
				}
				else {
					lat_array.push(latency);
				}
				console.log("latency: " + latency);
				if (calls_received == calls_sent && requests_complete) {
					// all responses in, start workin w/ data:
					
					computeStats();

					// transfor list to indexed list of list for d3:
					var d3_lat_array = [];
					for (var j = 0; j < lat_array.length; j++) {
						var xypair = [j + 1, lat_array[j]];
						d3_lat_array.push(xypair);
					}

					plotStressData(d3_lat_array);
					blockInterface(false);
					
				} 
			});

			socket.on('close', function(){
				console.log("socket closed.");
				socket.close();
			});

		}

		function computeStats() {
			// min, max, and avg latency
			var sum = 0;
			max_lat = 0;
			min_lat = lat_array[0];
			for (var i = 0; i < lat_array.length; i++) {
				var val = lat_array[i];
				sum += val;  // for avg

				// determine max:
				if (val > max_lat) {
					max_lat = val;
				}
				// determine min:
				if (val < min_lat) {
					min_lat = val;
				}

			}
			var avg_lat = sum / lat_array.length;
			$('div#avg-lat').html('<b>Average Latency (ms): </b>' + avg_lat.toFixed(1));
			$('div#max-lat').html('<b>Max Latency (ms): </b>' + max_lat);
			$('div#min-lat').html('<b>Min Latency (ms): </b>' + min_lat);
		}

	});

	$('#stop-test').on('click', function () {
		stop_test = true;
	});



	function plotStressData(latency_data) {

		// var data = [[5,3], [10,17], [15,4], [2,8]];
		var data = latency_data;

		// var dyn_height = $('div#scatter-chart').height();
		// var dyn_width = $('div.chart-row').width() / 2;
		var dyn_width = $('div#scatter-chart').width();
	   
		var margin = {top: 30, right: 15, bottom: 60, left: 60}
		  , width = dyn_width - margin.left - margin.right
		  , height = 500 - margin.top - margin.bottom
		  , padding = 64;

		var plotScatterChart = function () {
			var x = d3.scaleLinear()
				  .domain([0, d3.max(data, function(d) { return d[0]; })])
				  .range([ 0, width ]);

			var y = d3.scaleLinear()
					  .domain([0, d3.max(data, function(d) { return d[1]; })])
					  .range([ height, 0 ]);

			// appends chart to body of page:
			// var scatter_chart = d3.select('body')
			var scatter_chart = d3.select('div.content')
				.append('svg:svg')
				.attr('width', width + margin.right + margin.left)
				.attr('height', height + margin.top + margin.bottom)
				.attr('class', 'chart')
				.attr('id', 'scatter-chart')

			var main = scatter_chart.append('g')
				.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
				.attr('width', width)
				.attr('height', height)
				.attr('class', 'main')   
				
			var xAxis = d3.axisBottom(x);

			main.append('g')
				.attr('transform', 'translate(0,' + height + ')')
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
			  .data(data)
			  .enter().append("svg:circle")
				  .attr("cx", function (d,i) { return x(d[0]); } )
				  .attr("cy", function (d) { return y(d[1]); } )
				  .attr("r", 8);

			// now add titles to the axes
	        scatter_chart.append("text")
	            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
	            .attr("transform", "translate("+ (padding/4) +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
	            .text("Latency (ms)");

	        scatter_chart.append("text")
	            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
	            .attr("transform", "translate("+ (dyn_width/2) +","+(height + padding)+")")  // centre below axis
	            .text("User Requests");
			};

		var plotHistoChart = function (histo_data, min_val, max_val) {

			var max_val = d3.max(histo_data);
			var min_val = d3.min(histo_data);

			var formatCount = d3.format(",.0f");

			var histo_chart = d3.select('div.histo-content')
				.append('svg:svg')
				.attr('width', width + margin.right + margin.left)
				.attr('height', height + margin.top + margin.bottom)
				.attr('class', 'chart')
				.attr('id', 'histo-chart')

			var main = histo_chart.append('g')
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.attr('width', width)
				.attr('height', height)
				.attr('class', 'main')

			var x = d3.scaleLinear()
			            .domain([min_val - 1, max_val + 1])
			            .range([0, width]);

			var x_buff = Math.round((max_val - min_val) / 10);

			var bins = d3.histogram()
			            .domain([min_val - x_buff, max_val + x_buff])
			            // .thresholds(min_val + max_val + 2)  // use domain diff for ticks (hopefully forces bin size to 1)
			            .thresholds(x_buff)
			            (histo_data);



			var y = d3.scaleLinear()
			    .domain([0, d3.max(bins, function(d) { return d.length; })])
			    .range([height, 0]);

			var bar = main.selectAll(".bar")
			  .data(bins)
			  .enter().append("g")
			    .attr("class", "bar")
			    .attr("transform", function(d) { return "translate(" + x(d.x0 - 0.25) + "," + y(d.length) + ")"; });

			bar.append("rect")
			    .attr("x", 1)
			    // .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
			    .attr("width", x(bins[0].x1) - x(bins[0].x0))
			    .attr("height", function(d) { return height - y(d.length); });

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
			    .attr("transform", "translate(0," + height + ")")
			    .call(d3.axisBottom(x));

			histo_chart.append("text")
				.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
				.attr("transform", "translate("+ (dyn_width/2) +","+(height+padding)+")")  // centre below axis
				.text("Latency (ms)");
		};

		plotScatterChart();
		plotHistoChart(lat_array, min_lat, max_lat);

	}


	function updateProgressBar(calls_tracker, total_calls) {
	    // var progress = 100 * (1 - (calls_tracker / total_calls));
	    var progress = 100 * (calls_tracker / total_calls);
	    $('#progressbar').progressbar({
	        value: progress
	    });  
	}


	function blockInterface(block) {
	    if (block) {
	        $.blockUI({
	            css: {
	                // "top": "" + $(window).scrollTop() + "",
	                // "left": "" + $(window).scrollLeft() + "",
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


	function cancelRequest() {
	    console.log("canceling request");
	    socket.emit('get_data', JSON.stringify({'cancel': true, 'pchem_request': null}));
	    $.unblockUI();
	}


});