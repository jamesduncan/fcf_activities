
steal(
        // List your Controller's dependencies here:
        'appdev',
//        'opstools/FCFActivities/models/Projects.js',
//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
        // '//opstools/FCFActivities/views/ConfirmStep/ConfirmStep.ejs',
function(){


    //
    // ConfirmStep 
    // 
    // This controller manages the confirm popup.
    // 
    // it is responsible for displaying each of the actions performed by the user.
    //


    // Namespacing conventions:
    // AD.Control.extend('[application].[controller]', [{ static },] {instance} );
    AD.Control.extend('opstools.FCFActivities.ConfirmStep', {  


        init: function (element, options) {
            var self = this;
            options = AD.defaults({
                    templateDOM: '//opstools/FCFActivities/views/ConfirmStep/ConfirmStep.ejs'
            }, options);
            this.options = options;

            // Call parent init
            this._super(element, options);


            this.initDOM();
        },



        initDOM: function () {

            // this.element.html(can.view(this.options.templateDOM, {} ));


        },


        // clicking the [confirm] button 
        '.fcf-activity-confirm click': function ($el, ev) {
            this.element.modal('hide');
            this.element.trigger('confirmed');
            ev.preventDefault();
        }


    });


});