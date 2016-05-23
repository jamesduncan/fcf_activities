
steal(
	// List your Controller's dependencies here:
	'opstools/FCFActivities/controllers/Portal.js',
	'opstools/FCFActivities/controllers/AddChooseMinistry.js',
	'opstools/FCFActivities/controllers/AddChooseActivity.js',
	'opstools/FCFActivities/controllers/ActivityReport.js',
	'opstools/FCFActivities/controllers/ConfirmStep.js',
	'opstools/FCFActivities/views/FCFActivities/FCFActivities.ejs',
	function() {
		System.import('appdev').then(function() {
            AD.ui.loading.resources(7);
			steal.import(
				'site/labels/opstool-FCFActivities',
				'dropzone',
				'dropzone.css',
				'selectivity',
				'selectivity.css',
				'appdev/ad',
				'appdev/control/control',
				'OpsPortal/classes/OpsTool').then(function() {

					AD.ui.loading.completed(7);

					//
					// FCFActivities 
					// 
					// This is the main controller for the Activity review, creation tool.
					//
					// it is responsible for showing the proper tool in the Activity Portal, and 
					// managing State:
					// 
					//    each sub controller triggers events
					//    this Controller listens for those events and then responds accordingly
					//
					//
					// 
					// also for search rows filtering, look at:  http://ejohn.org/blog/jquery-livesearch/#postcomment
					//
					//  Tagging:
					//  for image tagging:  http://demonstration.easy-development.com/jquery-mt-select/  ??
					//         or :  http://websemantics.github.io/Image-Select/
					//   or without images:  https://arendjr.github.io/select3/
					//         or :  http://goodies.pixabay.com/jquery/tag-editor/demo.html
					// 
					//
					//  picture editor:  https://github.com/andyvr/picEdit,
					//  formbuilder: https://github.com/viveleroi/jquery.formbuilder
					// 
					//  Tours:
					//    tourist:  http://easelinc.github.io/tourist/
					//    shephardjs : http://github.hubspot.com/shepherd/docs/welcome/
					//
					//  Timeline:  http://timeline.knightlab.com
					//
					// 

					AD.Control.OpsTool.extend('FCFActivities', {


						init: function(element, options) {
							var self = this;

							// this is what gets published when this tool should resize:
							var NOTIFICATION_RESIZE = 'FCFActivities.resize';

							options = AD.defaults({
								templateDOM: '/opstools/FCFActivities/views/FCFActivities/FCFActivities.ejs',
								resize_notification: NOTIFICATION_RESIZE,
								tool: null   // the parent opsPortal Tool() object
							}, options);
							this.options = options;

							// Call parent init
							// AD.classes.opsportal.OpsTool.prototype.init.apply(this, arguments);
							this._super(element, options);


							this.keyVisiblePortal = 'Portal';    // keep track of which portal is visible
							this.resizePortals = {};

							this.dataSource = this.options.dataSource;

							this.initDOM();

							this.initPortals();

							this.initEvents();

							// this.on('opsportal.tool.hide', function(data){
							//     console.log('FCFActivities told to hide.');
							// })

							// this.on('opsportal.tool.show', function(data){
							//     console.log('FCFActivities told to show.');
							// })

							// for Testing:
							// this.showPortal('Report');
							// var team = {
							//     id:4,
							//     attr:function() { return 'Team Name '},
							//     getID:function() { return this.id }
							// }
							// this.portals.Report.setTeam(team);

							// var activity = {
							//     id:1,
							//     team:4,
							//     getID:function() { return this.id}
							// }
							// this.portals.Report.loadData(activity);

							// end testing


							// on a tool.show event for this tool ... consider this a reset 
							// to the Portal screen.
							AD.comm.hub.subscribe('opsportal.tool.show', function(key, data) {

								if (data.tool == 'FCFActivities') {
									// self.showPortal('Portal');
									self.showPortal('Add1');
								}
							})


							AD.comm.hub.subscribe('fcf.activity.new', function() {
								self.newActivity();
							})

							AD.comm.hub.subscribe(NOTIFICATION_RESIZE, function(key, data) {

								var height = data.height;   // the available height in our displayable area.

								self.resizeActivePortal(height);


								//// TODO: mark the other portals as needing a resize!
							})


							// gather which person the user is & pass off to Controllers
							AD.comm.service.get({ url: '/fcf_activities/activityreport/whoami' })
								.fail(function(err) {
									console.error('!!!! FCFActivities: error getting /whoami', err);
								})
								.then(function(data) {

									if (data) {

										self.portals.Report.setWhoami(data);

									} else {

										console.warn('... FCFActivities: /whoami did not find an entry!');
									}


								});


							this.translate();  // translate our area interface.
						},



						initDOM: function() {

							this.element.html(can.view(this.options.templateDOM, {}));

						},




						initEvents: function() {

							var self = this;


							// The Choose Ministry Controller will publish a NEXT
							// event when finished.
							this.portals.Add1.element.on(this.portals.Add1.CONST.NEXT, function() {

								var model = self.portals.Add1.value();
								console.log(' ... Team Selected: ' + model.getID());

								self.portals.Add2.loadData(model);
								self.showPortal('Add2');

								self.portals.Report.setTeam(model);

							})


							//// Choose Activity Controller
							// The Choose Activity Controller will publish a NEXT
							// event when finished.
							this.portals.Add2.element.on(this.portals.Add2.CONST.NEXT, function() {

								var model = self.portals.Add2.value();
								console.log(' ... Activity Selected: ' + model.getID());
								self.portals.Report.loadData(model);
								self.showPortal('Report');
							})
							// if they press [Previous] then go back
							this.portals.Add2.element.on(this.portals.Add2.CONST.PREV, function() {
								self.showPortal('Add1');
							})


							//// The Activity Report Controller

							// if they press [Finish] then go back
							this.portals.Report.element.on(this.portals.Report.CONST.FINISH, function() {
								// self.showPortal('Portal');
								self.showPortal('Add1');
							})

							// if they press [Previous] then go back
							this.portals.Report.element.on(this.portals.Report.CONST.PREV, function() {
								self.showPortal('Add2');
							})



							//// The Confirm Step 
							// this.portals.Confirm.element.on('confirmed', function() {
							//     self.showPortal('Portal');
							// })

						},




						initPortals: function() {
							this.portals = {};


							// attach the Portal Controller
							var Portal = AD.Control.get('opstools.FCFActivities.Portal');
							this.portals.Portal = new Portal(this.element.find('#fcf-activity-portal'));
							this.resizePortals['Portal'] = true;

							// attach The Add Choose Ministry Controller
							var Add1 = AD.Control.get('opstools.FCFActivities.AddChooseMinistry');
							this.portals.Add1 = new Add1(this.element.find('#fcf-activity-add-chooseTeam'));
							this.resizePortals['Add1'] = true;

							// attach The Add Choose Activity Controller
							var Add2 = AD.Control.get('opstools.FCFActivities.AddChooseActivity');
							this.portals.Add2 = new Add2(this.element.find('#fcf-activity-add-chooseActivity'));
							this.resizePortals['Add2'] = true;

							var Report = AD.Control.get('opstools.FCFActivities.ActivityReport');
							this.portals.Report = new Report(this.element.find('#fcf-activity-add-report'));
							this.resizePortals['Report'] = true;

							// var Confirm = AD.Control.get('opstools.FCFActivities.ConfirmStep');
							// this.portals.Confirm = new Confirm(this.element.find('#confirmstep'));
						},




						newActivity: function() {

							this.showPortal('Add1');
						},


						resizeActivePortal: function(height) {

							// height is the total available to our OpsTool

							// however, our outer <div> has a padding set: so remove 

							var hAvailable = height - 20; // todo: get this from the <div>

							// tell the currently visible portal to resize to this available height:
							var portal = this.portals[this.keyVisiblePortal];
							if (portal.resize) portal.resize(hAvailable);

							// mark all other portals as needing a resize()
							for (var k in this.resizePortals) {
								this.resizePortals[k] = (k != portal);
							}

							this.lastResizeValue = hAvailable;

						},


						showPortal: function(key) {

							for (var k in this.portals) {

								if (k == key) {
									this.portals[k].show();
									if (this.resizePortals[k]) {
										this.portals[k].resize(this.lastResizeValue);
										this.resizePortals[k] = false;
									}
								} else {
									this.portals[k].hide();
								}
							}

							this.keyVisiblePortal = key;

						},



						'.ad-item-add click': function($el, ev) {

							ev.preventDefault();
						}


					});

				});

		});

	});