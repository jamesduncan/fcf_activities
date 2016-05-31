// Dependencies
steal(
    "opstools/FCFActivities/models/FCFActivityImages.js"
)

// Initialization
.then(function(){


    //Define the unit tests
    describe('testing model AD.models.opstools.FCFActivities.FCFActivityImages ', function(){


        before(function(){


        });


        it('model definition exists ', function(){
            assert.isDefined(AD.models.opstools , ' :=> should have been defined ');
            assert.isDefined(AD.models.opstools.FCFActivities , ' :=> should have been defined ');
            assert.isDefined(AD.models.opstools.FCFActivities.FCFActivityImages, ' :=> should have been defined ');
               assert.isNotNull(AD.Model.get("opstools.FCFActivities.FCFActivityImages"), ' :=> did not return null');
        });

    });


});