steal(
// List your Page's dependencies here:
// 'can/control/route'
// ).then(
	'opstools/FCFActivities/controllers/FCFActivities.js',
	'opstools/FCFActivities/FCFActivities.css',
	'opstools/FCFActivities/opsportal-theme-fcf.css',
	function () {
		System.import('appdev').then(function () {
            AD.ui.loading.resources(3);

			steal.import('site/labels/opstool-FCFActivities').then(function () {
				AD.ui.loading.completed(3);
			});
		});
		// can.route("#!control/:type");
		// can.route.ready();
	});