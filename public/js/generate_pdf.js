const config = require('../../config');  // import cts_stress config

// Requirements:
var $ = require('jquery');
var html2canvas = require('html2canvas');
var jsPDF = require('jspdf');

window.html2canvas = html2canvas;



/****************************
Generates PDF
****************************/
var PdfGenerator = {

	// default_request: {
	// 	'chemical': 'CCC',
	// 	'pchem_request': {'chemaxon': ['water_sol']},
	// 	'calc': 'chemaxon'
	// },

	// result_obj: {
	// 	x: null,
	// 	latency: null,
	// 	sessionid: null,
	// 	calc: null
	// },

	options: {
		format: 'Letter'
	},

	init: function (settings) {
		PdfGenerator.config = {
			// test_host: 'localhost',
			// test_port: 4000

		};

		// allow overriding of default config
		// $.extend(PdfGenerator.config, settings);

		PdfGenerator.setup();  // run setup after init

	},



	setup: function () {

	},



	generatePdf: function (res) {

		var pdfHtml = "";

		// jsPDF method
  		// var pdfHtml = $('.container').prop('outerHTML');
  		var pdfHtmlObj = $('.container')[0];

  		var origPageHtmlObj = $(pdfHtmlObj).clone();  // for restoring original page after pdf creation

  		// var pdf = new jsPDF('p', 'pt', 'letter');
		// var options = {
		// 	pagesplit: true,
		// 	orientation: 'portrait',
		// 	unit: 'in',
		// 	format: 'letter'
		// };


		// $(pdfHtmlObj).find(':first').remove();
		// $(pdfHtmlObj).prepend('<h2>CTS Stress Test Results</h2>');


		pdfHtml += '<h1>CTS Stress Test Results</h1>';
		pdfHtml += PdfGenerator.getUserInputs();

		// pdf.addHTML(pdfHtmlObj, 0, 0, options, function(){
		//     pdf.save("test.pdf");
		// });
		// pdf.fromHTML(pdfHtml, 0, 0, options, function(){
		//     pdf.save("test.pdf");
		// });



		// jsPDF method 2 (this works relatively well):
		html2canvas(pdfHtmlObj, {
			onrendered: function(canvas) {
				const contentDataUrl = canvas.toDataURL('image/png');
				let pdf = new jsPDF('p', 'mm', [canvas.width, canvas.height]);
				pdf.addImage(contentDataUrl, 'JPEG', 20, 20);
				pdf.save('test.pdf');

			}
		});


	},



	getUserInputs: function () {
		var pdfInputNames = $('.pdf-input-name');
		var pdfInputVals = $('.pdf-input-val');
		var html = "";

		for(var i = 0; i < pdfInputNames.length; i++) {
			// builds html for pdf:
			var pdfName = $(pdfInputNames[i])[0];
			var pdfVal = $(pdfInputVals[i])[0];
			html += '<p>' + $(pdfName).children('b').text() + " " + $(pdfVal).children('input').val() + '</p>';
		}

		return html;
	}

};



module.exports = PdfGenerator;