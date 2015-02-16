// Dependencies
steal(
    "opstools/FCFActivities/controllers/Portal.js"
)

// Initialization
.then(function(){

    // the div to attach the controller to
    var divID = 'test_Portal';

    // add the div to the window
    var buildHTML = function() {
        var html = [
                    '<div id="'+divID+'">',
                    '</div>'
                    ].join('\n');

        $('body').append($(html));
    }
    

    //Define the unit tests
    describe('testing controller AD.controllers.opstools.FCFActivities.Portal ', function(){

        var testController = null;

        before(function(){

            buildHTML();

            // Initialize the controller
            testController = new AD.controllers.opstools.FCFActivities.Portal($('#'+divID), { some:'data' });

        });



        it('controller definition exists ', function(){
            assert.isDefined(AD.controllers.opstools , ' :=> should have been defined ');
            assert.isDefined(AD.controllers.opstools.FCFActivities , ' :=> should have been defined ');
            assert.isDefined(AD.controllers.opstools.FCFActivities.Portal, ' :=> should have been defined ');
              assert.isNotNull(AD.Control.get('Portal'), ' :=> returns our controller. ');
        });


    });


});