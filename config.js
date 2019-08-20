// Configuration for cts_stress.
// Things like host, ports, etc., but
// no secret stuff..
// (np) Oct. 2016


var config = {};

// nodejs server config
config.server = {
	'host': process.env.STRESS_SERVER_HOST || 'localhost',
	'port': process.env.STRESS_SERVER_PORT || 8081
};

// cts-django config
config.cts = {
	'host': process.env.DJANGO_HOST || 'localhost',
	'port': process.env.DJANGO_PORT || 8000,
	'endpoints': {
		'cheminfo': '/cts/rest/molecule',
		'transproducts': '/cts/rest/metabolizer/run'
	}
};

module.exports = config;  // makes config obj a module!