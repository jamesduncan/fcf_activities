steal(
        'appdev'
).then( function(){

    // Namespacing conventions:
    // AD.Model.Base.extend("[application].[Model]" , { static }, {instance} );  --> Object
    AD.Model.Base.extend("opstools.FCFActivities.ActivityImage", {
        findAll: 'GET /fcf_activities/activityimage',
        findOne: 'GET /fcf_activities/activityimage/{id}',
        create:  'POST /fcf_activities/activityimage/create',
        update:  'PUT /fcf_activities/activityimage/update/{id}',
        destroy: 'DELETE /fcf_activities/activityimage/destroy/{id}',
        describe: function() {
            return {
                      "image": "string",
                      "caption": "string",
                      "date": "date",
                      "uploadedBy": "string",
                      "tags": "string"
            };
        },
        fieldId:'id',
        fieldLabel:'caption'
    },{
        model: function() {
            return AD.Model.get('opstools.FCFActivities.ActivityImage'); //AD.models.opstools.FCFActivities.FCFActivityImages;
        },
        getID: function() {
            return this.attr(this.model().fieldId) || 'unknown id field';
        },
        getLabel: function() {
            return this.attr(this.model().fieldLabel) || 'unknown label field';
        }
    });


});