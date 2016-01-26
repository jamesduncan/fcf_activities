steal(
        'appdev'
).then( function(){

    // Namespacing conventions:
    // AD.Model.Base.extend("[application].[Model]" , { static }, {instance} );  --> Object
    AD.Model.Base.extend("opstools.FCFActivities.UserTeam", {
        findAll: 'GET /fcf_activities/userteam/find',
        // findOne: 'GET /userteam/{id}',
        // create:  'POST /userteam/create',
        // update:  'PUT /userteam/update/{id}',
        // destroy: 'DELETE /userteam/destroy/{id}.json',
        describe: function() {
            return {
          "ministry_name": "string",
          "project_owner": "string"
};
        },
        fieldId:'IDMinistry',
        fieldLabel:'ministry_name'
    },{
        model: function() {
            return AD.Model.get('opstools.FCFActivities.UserTeam'); //AD.models.opstools.FCFActivities.UserTeam;
        },
        getID: function() {
            return this.attr(this.model().fieldId) || 'unknown id field';
        },
        getLabel: function() {
            return this.attr(this.model().fieldLabel) || 'unknown label field';
        }
    });


});