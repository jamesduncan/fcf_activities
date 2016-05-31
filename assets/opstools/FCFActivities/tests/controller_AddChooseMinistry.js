// Dependencies
steal(
    "opstools/FCFActivities/controllers/AddChooseMinistry.js"
)

// Initialization
.then(function(){

    // the div to attach the controller to
    var divID = 'test_AddChooseMinistry';

    // add the div to the window
    var buildHTML = function() {
        var html = [
                    '<div id="'+divID+'">',
                    '</div>'
                    ].join('\n');

        $('body').append($(html));
    }
    

    //Define the unit tests
    describe('testing controller AD.controllers.opstools.FCFActivities.AddChooseMinistry ', function(){

        var testController = null;

        before(function(){

            buildHTML();

            // Initialize the controller
            testController = new AD.controllers.opstools.FCFActivities.AddChooseMinistry($('#'+divID), { some:'data' });

        });



        it('controller definition exists ', function(){
            assert.isDefined(AD.controllers.opstools , ' :=> should have been defined ');
            assert.isDefined(AD.controllers.opstools.FCFActivities , ' :=> should have been defined ');
            assert.isDefined(AD.controllers.opstools.FCFActivities.AddChooseMinistry, ' :=> should have been defined ');
              assert.isNotNull(AD.Control.get('opstools.FCFActivities.AddChooseMinistry'), ' :=> returns our controller. ');
        });


    });


});