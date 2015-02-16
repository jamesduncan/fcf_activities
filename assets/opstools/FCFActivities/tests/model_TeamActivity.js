// Dependencies
steal(
    "opstools/FCFActivities/models/TeamActivity.js"
)

// Initialization
.then(function(){


    //Define the unit tests
    describe('testing model AD.models.opstools.FCFActivities.TeamActivity ', function(){


        before(function(){


        });


        it('model definition exists ', function(){
            assert.isDefined(AD.models.opstools , ' :=> should have been defined ');
            assert.isDefined(AD.models.opstools.FCFActivities , ' :=> should have been defined ');
            assert.isDefined(AD.models.opstools.FCFActivities.TeamActivity, ' :=> should have been defined ');
               assert.isNotNull(AD.Model.get("opstools.FCFActivities.TeamActivity"), ' :=> did not return null');
        });

    });


});