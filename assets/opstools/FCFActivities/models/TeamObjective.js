steal(
        'appdev',
        'opstools/FCFActivities/models/base/TeamObjective.js'
).then( function(){

    // Namespacing conventions:
    // AD.Model.extend('[application].[Model]', {static}, {instance} );  --> Object
    AD.Model.extend('opstools.FCFActivities.TeamObjective', {
/*
        findAll: 'GET /fcfactivities/teamobjectives',
        findOne: 'GET /fcfactivities/teamobjectives/{id}',
        create:  'POST /fcfactivities/teamobjectives/create',
        update:  'PUT /fcfactivities/teamobjectives/update/{id}',
        destroy: 'DELETE /fcfactivities/teamobjectives/destroy/{id}.json',
        describe: function() {},   // returns an object describing the Model definition
        fieldId: 'fieldName',       // which field is the ID
        fieldLabel:'fieldName'      // which field is considered the Label
*/
    },{
/*
        // Already Defined:
        model: function() {},   // returns the Model Class for an instance
        getID: function() {},   // returns the unique ID of this row
        getLabel: function() {} // returns the defined label value
*/
    });


});