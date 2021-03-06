steal(
	'opstools/FCFActivities/models/base/UserTeam.js',
	function () {
		System.import('appdev').then(function () {
			steal.import('appdev/model/model').then(function () {

				// Namespacing conventions:
				// AD.Model.extend('[application].[Model]', {static}, {instance} );  --> Object
				AD.Model.extend('opstools.FCFActivities.UserTeam', {
					/*
							findAll: 'GET /userteam/find',
							findOne: 'GET /userteam/{id}',
							create:  'POST /userteam/create',
							update:  'PUT /userteam/update/{id}',
							destroy: 'DELETE /userteam/destroy/{id}.json',
							describe: function() {},   // returns an object describing the Model definition
							fieldId: 'fieldName',       // which field is the ID
							fieldLabel:'fieldName'      // which field is considered the Label
					*/
				}, {
						/*
								// Already Defined:
								model: function() {},   // returns the Model Class for an instance
								getID: function() {},   // returns the unique ID of this row
								getLabel: function() {} // returns the defined label value
						*/
					});

			});
		});
	});