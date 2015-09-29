steal(
        // List your Page's dependencies here:
// 'can/control/route'
// ).then(
		'appdev',
        function() {
            AD.ui.loading.resources(3);
        },
        '//opstools/FCFActivities/controllers/FCFActivities.js',
        '//opstools/FCFActivities/FCFActivities.css',
        '/site/labels/opstool-FCFActivities.js'
).then(function(){

	AD.ui.loading.completed(3);
	// can.route("#!control/:type");
	// can.route.ready();
});