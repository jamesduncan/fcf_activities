// Dependencies
steal(
    "opstools/FCFActivities/models/UserTeam.js"
)

// Initialization
.then(function(){


    //Define the unit tests
    describe('testing model AD.models.opstools.FCFActivities.UserTeam ', function(){


        before(function(){


        });


        it('model definition exists ', function(){
            assert.isDefined(AD.models.opstools , ' :=> should have been defined ');
            assert.isDefined(AD.models.opstools.FCFActivities , ' :=> should have been defined ');
            assert.isDefined(AD.models.opstools.FCFActivities.UserTeam, ' :=> should have been defined ');
               assert.isNotNull(AD.Model.get("opstools.FCFActivities.UserTeam"), ' :=> did not return null');
        });

    });


});