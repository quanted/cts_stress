// +++++++++++++++++++++++++++++++++++++++++++++++
// Main JS file for cts_stress
// +++++++++++++++++++++++++++++++++++++++++++++++

// External libraries:
global.jQuery = require('jquery');
var $ = global.jQuery;
var bootstrap = require('bootstrap');

// Configuration:
const config = require('../../config');

// Internal modules:
var ctsStressTester = require('./cts_stress_test');
var ctsPdfGenerator = require('./generate_pdf');
require('./jsPDF_plugin');

// DOM Elements:
var DomElements = {
	downloadPdfButton: $('#download-pdf-button'),
	downloadHtmlButton: $('#download-html-button')
};



var CtsStressMain = {

	init: function() {

		ctsPdfGenerator.init();
		ctsStressTester.init();

		CtsStressMain.setup();

	},

	setup: function() {
		// Main UI events

		DomElements.downloadPdfButton.on('click', function () {

			console.log("Generating PDF...");
			ctsPdfGenerator.generatePdf();
			console.log("PDF generated.");

		});

		DomElements.downloadHtmlButton.on('click', function () {

			console.log("Generating HTML file...");

			$('table.gethtml').html("");

			// var htmlFileObjects = $('.container')[0];
			var htmlFileObjects = $('html');
			var htmlFileObjectsClone = $(htmlFileObjects).clone();
  			$(htmlFileObjectsClone).find('.no-download').remove();  // removes any element not meant for file downloads

  			var fileDownloadForm = $('form.post_form');

  			var htmlFileContent = $(htmlFileObjectsClone).prop('outerHTML');

  			// $(fileDownloadForm).append(htmlFileObjectsClone);

  			$('<tr style="display:none"><td><input type="hidden" name="stress_html"></td></tr>')
				.appendTo('.gethtml')
				.find('input')
				.val(htmlFileContent);

  			$(fileDownloadForm).attr({'action': '/cts/stress/html'}).submit();

			console.log("HTML file generated.");

		});

	}

};



// Initiate CTS Stress module after page loads:
$(document).ready(function() { CtsStressMain.init(); });