// Configuration for cts_stress.
// Things like host, ports, etc.
// (np) Oct. 2016


var config = {};

// nodejs server config
config.server = {
	'host': 'localhost',
	'port': 80
};

// cts-django config
config.cts = {
	// 'host': process.env.DJANGO_HOST || 'localhost',
	// 'port': process.env.DJANGO_PORT || 8081,
	'host': '134.67.114.1',
	'port': 80,
	'endpoints': {
		'cheminfo': '/cts/rest/molecule',
		'transproducts': '/cts/rest/metabolizer/run'
	}
};

module.exports = config;  // makes config obj a module!