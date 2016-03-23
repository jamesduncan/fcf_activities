module.exports = {
	"map": {
		"selectivity": "js/selectivity/selectivity-full.min",
		"selectivity.css": "js/selectivity/selectivity-full.min.css",
		"dropzone": "js/dropzone/dropzone.min",
        "dropzone.css": "js/dropzone/dropzone.min.css"
	},
	"paths": {
		"opstools/FCFActivities": "opstools/FCFActivities/FCFActivities.js",
		"selectivity": "js/selectivity/selectivity-full.min.js",
		"selectivity.css": "js/selectivity/selectivity-full.min.css"
	},
	"bundle": [
		"opstools/FCFActivities"
	],
	"meta": {
		"opstools/FCFActivities": {
			"deps": [
				"dropzone",
				"selectivity"
			]
		},
		"js/selectivity/selectivity-full.min": {
			"format": "global",
			"deps": [
				"js/selectivity/selectivity-full.min.css"
			],
			"sideBundle": true
		},
		"js/dropzone/dropzone.min": {
			"exports": "Dropzone",
			"format": "global",
			"deps": [
				"js/dropzone/dropzone.min.css"
			],
			"sideBundle": true
		}
	}
};