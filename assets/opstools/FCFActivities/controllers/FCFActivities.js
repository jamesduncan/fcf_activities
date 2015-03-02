
steal(
        // List your Controller's dependencies here:
        'appdev',
        '//OpsPortal/classes/OpsTool.js',
        'opstools/FCFActivities/controllers/Portal.js',
        'opstools/FCFActivities/controllers/AddChooseMinistry.js',
        'opstools/FCFActivities/controllers/AddChooseActivity.js',
        'opstools/FCFActivities/controllers/ActivityReport.js',
        '//opstools/FCFActivities/views/FCFActivities/FCFActivities.ejs',
function(){

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


        init: function (element, options) {
            var self = this;
            options = AD.defaults({
                    templateDOM: '//opstools/FCFActivities/views/FCFActivities/FCFActivities.ejs',
                    resize_notification: 'FCFActivities.resize',
                    tool:null   // the parent opsPortal Tool() object
            }, options);
            this.options = options;

            // Call parent init
// AD.classes.opsportal.OpsTool.prototype.init.apply(this, arguments);
            this._super(element, options);


            this.dataSource = this.options.dataSource; 

            this.initDOM();

            this.initPortals();

            this.initEvents();
            
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

            AD.comm.hub.subscribe('fcf.activity.new', function() {
                self.newActivity();
            })

        },



        initDOM: function () {

            this.element.html(can.view(this.options.templateDOM, {} ));

        },




        initEvents: function() {

            var self = this;
            

            // The Choose Ministry Controller will publish a NEXT
            // event when finished.
            this.portals.Add1.element.on(this.portals.Add1.CONST.NEXT, function() {

                var model = self.portals.Add1.value();
                console.log(' ... Team Selected: '+model.getID());

                self.portals.Add2.loadData(model);
                self.showPortal('Add2');

                self.portals.Report.setTeam(model);

            })


            //// Choose Activity Controller
            // The Choose Activity Controller will publish a NEXT
            // event when finished.
            this.portals.Add2.element.on(this.portals.Add2.CONST.NEXT, function() {

                var model = self.portals.Add2.value();
                console.log(' ... Activity Selected: '+model.getID());
                self.portals.Report.loadData(model);
                self.showPortal('Report');
            })
            // if they press [Previous] then go back
            this.portals.Add2.element.on(this.portals.Add2.CONST.PREV, function() {
                self.showPortal('Add1');
            })


            //// The Activity Report Controller

            // if they press [Previous] then go back
            this.portals.Report.element.on(this.portals.Report.CONST.PREV, function() {
                self.showPortal('Add2');
            })


        },




        initPortals: function() {
            this.portals = {};


            // attach the Portal Controller
            var Portal = AD.Control.get('opstools.FCFActivities.Portal');
            this.portals.Portal = new Portal(this.element.find('#fcf-activity-portal'));


            // attach The Add Choose Ministry Controller
            var Add1 = AD.Control.get('opstools.FCFActivities.AddChooseMinistry');
            this.portals.Add1 = new Add1(this.element.find('#fcf-activity-add-chooseTeam'));

            // attach The Add Choose Activity Controller
            var Add2 = AD.Control.get('opstools.FCFActivities.AddChooseActivity');
            this.portals.Add2 = new Add2(this.element.find('#fcf-activity-add-chooseActivity'));


            var Report = AD.Control.get('opstools.FCFActivities.ActivityReport');
            this.portals.Report = new Report(this.element.find('#fcf-activity-add-report'));
        },




        newActivity: function() {

            this.showPortal('Add1');
        },


        showPortal:function(key) {

            for (var k in this.portals) {

                if (k == key) {
                    this.portals[k].show();
                } else {
                    this.portals[k].hide();
                }
            }

        },



        '.ad-item-add click': function ($el, ev) {

            ev.preventDefault();
        }


    });


});