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

  		var pdfHtmlObj = $('.container')[0];
  		$(pdfHtmlObj).find('.no-download').remove();  // removes any element not meant for file downloads

		html2canvas(pdfHtmlObj, {
			onrendered: function(canvas) {
				const contentDataUrl = canvas.toDataURL('image/png');
				let pdf = new jsPDF('p', 'mm', [canvas.width, canvas.height]);
				let filename = PdfGenerator.createFilename();
				pdf.addImage(contentDataUrl, 'JPEG', 20, 20);
				pdf.save(filename);
			}
		});

	},



	createFilename: function () {
		var filename = "cts_stress_results_";
		filename += PdfGenerator.generateTimestamp();
		return filename	
	},



	generateTimestamp: function () {
		var timestamp = new Date(Date.now()).toString();
		timestamp = timestamp.replace(/\s/g, '');  // removes all spaces in timestamp
		return timestamp
	},

};



module.exports = PdfGenerator;