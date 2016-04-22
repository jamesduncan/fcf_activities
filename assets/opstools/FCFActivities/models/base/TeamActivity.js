System.import('appdev').then(function () {
	steal.import('appdev/model/model').then(function () {

		// Namespacing conventions:
		// AD.Model.Base.extend("[application].[Model]" , { static }, {instance} );  --> Object
		AD.Model.Base.extend("opstools.FCFActivities.TeamActivity", {
			findAll: 'GET /fcfactivities/teamactivities',
			// findOne: 'GET /teamactivity/{id}',
			create: 'POST /fcfactivities/teamactivities',
			// update:  'PUT /teamactivity/update/{id}',
			// destroy: 'DELETE /teamactivity/destroy/{id}.json',
			describe: function () {
				return {
					"activity_name": "string",
					"activity_name_govt" : "string",
					"activity_description": "string",
					"activity_description_govt" : "string",
					"date_start": "date",
					"date_end": "date"
				};
			},
			validations: {
				"activity_name": ['notEmpty'],
				"activity_name_govt": [],
				"activity_description": ['notEmpty'],
				"activity_description_govt": [],
				"date_start": ['notEmpty', 'date:{"format":"mm/dd/yyyy"}'],
				"date_end": ['date:{"format":"mm/dd/yyyy"}']
			},
			fieldId: 'id',
			fieldLabel: 'activity_name'
		}, {
				model: function () {
					return AD.Model.get('opstools.FCFActivities.TeamActivity'); //AD.models.opstools.FCFActivities.TeamActivity;
				},
				getID: function () {
					return this.attr(this.model().fieldId) || 'unknown id field';
				},
				getLabel: function () {
					return this.attr(this.model().fieldLabel) || 'unknown label field';
				}
			});


	});
});