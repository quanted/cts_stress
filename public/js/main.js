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
	downloadPdfButton: $('#download-pdf-button')
};



var CtsStressMain = {

	init: function() {

		ctsPdfGenerator.init();
		ctsStressTester.init();

		CtsStressMain.setup();

	},

	setup: function() {
		// Main UI events (example)
		// DomElements.goToGoalButton.on('click', function () {
		// // TODO: When clicked, drive Jackal to the flag's position..
		// });

		DomElements.downloadPdfButton.on('click', function () {

			console.log("Generating PDF...");
			ctsPdfGenerator.generatePdf();
			console.log("PDF generated.");

		});

	}

};



// Initiate CTS Stress module after page loads:
$(document).ready(function() { CtsStressMain.init(); });