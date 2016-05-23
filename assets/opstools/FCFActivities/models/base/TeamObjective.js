System.import('appdev').then(function () {
	steal.import('appdev/model/model').then(function () {

		// Namespacing conventions:
		// AD.Model.Base.extend("[application].[Model]" , { static }, {instance} );  --> Object
		AD.Model.Base.extend("opstools.FCFActivities.TeamObjective", {
			findAll: 'GET /fcf_activities/teamobjectives',
			// findOne: 'GET /fcfactivities/teamobjectives/{id}',
			// create:  'POST /fcfactivities/teamobjectives/create',
			// update:  'PUT /fcfactivities/teamobjectives/update/{id}',
			// destroy: 'DELETE /fcfactivities/teamobjectives/destroy/{id}.json',
			describe: function () {
				return {
					"description": "string"
				};
			},
			fieldId: 'id',
			fieldLabel: 'description'
		}, {
				model: function () {
					return AD.Model.get('opstools.FCFActivities.TeamObjective'); //AD.models.opstools.FCFActivities.TeamActivity;
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