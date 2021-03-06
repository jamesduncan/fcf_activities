
steal(
// List your Controller's dependencies here:
//        'opstools/FCFActivities/models/Projects.js',
//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
	'opstools/FCFActivities/views/Portal/Portal.ejs',
	function () {
		System.import('appdev').then(function () {
			steal.import(
				'appdev/ad',
				'appdev/control/control',
				'appdev/comm/hub').then(function () {

				// Namespacing conventions:
				// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
				AD.Control.extend('opstools.FCFActivities.Portal', {


					init: function (element, options) {
						var self = this;
						options = AD.defaults({
							// templateDOM: '//opstools/FCFActivities/views/Portal/Portal.ejs'
						}, options);
						this.options = options;

						// Call parent init
						this._super(element, options);


						this.dataSource = this.options.dataSource; // AD.models.Projects;

						this.element.hide(); // Hide portal page

						this.initDOM();

					},



					initDOM: function () {

						// this.element.html(can.view(this.options.templateDOM, {} ));

					},

					//         '{can.route} change': function() {

					// console.log(' ******* can.route changed ********');
					//         },

					//         'fcf-control/:type route': function() {

					// console.log(' !!!!!!! ROUTE CALLED !!!!!!');

					//         },

					//         ':type route': function(data){
					// console.log(' !!!!!!! ROUTE fcfActivityPanel CALLED !!!!!!');
					//         },


					resize: function (height) {

						// we don't do anything ...
					},



					'.fcf-activity-new click': function ($el, ev) {

						AD.comm.hub.publish('fcf.activity.new', {});

						ev.preventDefault();
					}


				});
			});
		});

	});