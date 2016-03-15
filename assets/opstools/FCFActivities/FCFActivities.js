steal(
// List your Page's dependencies here:
// 'can/control/route'
// ).then(
	'opstools/FCFActivities/FCFActivities.css',
	'opstools/FCFActivities/opsportal-theme-fcf.css',
    'site/labels/opstool-FCFActivities.js',
	function () {
		System.import('appdev').then(function () {
            AD.ui.loading.resources(3);

			steal.import('opstools/FCFActivities/controllers/FCFActivities').then(function () {
				AD.ui.loading.completed(3);
			});
		});
		// can.route("#!control/:type");
		// can.route.ready();
	});