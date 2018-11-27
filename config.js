// Configuration for cts_stress.
// Things like host, ports, etc., but
// no secret stuff..
// (np) Oct. 2016


var config = {};

// nodejs server config
config.server = {
	'host': 'localhost',
	'port': 80
};

// cts-django config
config.cts = {
	'host': process.env.DJANGO_HOST || 'localhost',
	'port': process.env.DJANGO_PORT || 8081,
	'endpoints': {
		'cheminfo': '/cts/rest/molecule',
		'transproducts': '/cts/rest/metabolizer/run'
	}
};

// config.cts.calcMap = {
// 	'chemaxon': {
// 		'props': ['water_sol', 'ion_con', 'kow_no_ph', 'kow_wph', 'water_sol_ph'],
// 		'propMap': {
// 			'water_sol': { 'methods': null },
// 			'ion_con': { 'methods': null },
// 			'kow_no_ph': { 'methods': ['KLOP', 'PHYS', 'VG'] },
// 			'kow_wph': { 'methods': ['KLOP', 'PHYS', 'VG'] },
// 			'water_sol_ph': { 'methods': null }
// 		}
// 	},
// 	'epi': {
// 		'props': ['melting_point', 'boiling_point', 'water_sol', 'vapor_press', 'henrys_law_con', 'kow_no_ph', 'koc', 'log_bcf', 'log_baf'],
// 		'propMap': {
// 			'melting_point': { 'methods': null },
// 			'boiling_point': { 'methods': null },
// 			'water_sol': { 'methods': ['WSKOW', 'WATERNT'] },
// 			'vapor_press': { 'methods': null },
// 			'henrys_law_con': { 'methods': null },
// 			'kow_no_ph': { 'methods': null },
// 			'koc': { 'methods': null },
// 			'log_bcf': { 'methods': null },
// 			'log_baf': { 'methods': null }
// 		},
// 	'test': {
// 		'props': ['melting_point', 'boiling_point', 'water_sol', 'vapor_press', 'log_bcf'],
// 		'propMap': {
// 			'melting_point': { 'methods': null },
// 			'boiling_point': { 'methods': null },
// 			'water_sol': { 'methods': null },
// 			'vapor_press': { 'methods': null },
// 			'log_bcf': { 'methods': null }
// 		}
// 	'sparc': {
// 		'props': ['boiling_point', 'water_sol', 'vapor_press', 'mol_diss', 'mol_diss_air', 'ion_con', 'henrys_law_con', 'kow_no_ph', 'kow_wph'],
// 		'propMap': {
// 			'boiling_point': { 'methods': null },
// 			'water_sol': { 'methods': null },
// 			'vapor_press': { 'methods': null },
// 			'mol_diss': { 'methods': null },
// 			'mol_diss_air': { 'methods': null },
// 			'ion_con': { 'methods': null },
// 			'henrys_law_con': { 'methods': null },
// 			'kow_no_ph': { 'methods': null },
// 			'kow_wph': { 'methods': null }
// 		}
// 	'measured': {
// 		'props': ['melting_point', 'boiling_point', 'water_sol', 'vapor_press', 'henrys_law_con', 'kow_no_ph'],
// 		'propMap': {
// 			'melting_point': { 'methods': null },
// 			'boiling_point': { 'methods': null },
// 			'water_sol': { 'methods': null },
// 			'vapor_press': { 'methods': null },
// 			'henrys_law_con': { 'methods': null },
// 			'kow_no_ph': { 'methods': null }
// 		}
// };

module.exports = config;  // makes config obj a module!