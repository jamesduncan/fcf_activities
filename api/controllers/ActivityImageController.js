/**
 * FCFActivityImageController
 *
 * @description :: Server-side logic for managing Fcfactivityimages
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var AD = require('ad-utils');
var path = require('path');
var fs = require('fs');

module.exports = {


	// get /fcf_activities/activityimage?[filterCondition]
	find:function(req, res) {

AD.log('-----------------');
AD.log('params:', req.params);
AD.log('body:', req.body);
AD.log('query:', req.query);

		var filter = req.query;


//// TODO: filter off additional params: 
    // "_cas_retry": "23708552",
    // "ticket": "ST-31676-WKdNW3YZMJeDxNOBBcla-cas"

		// what is the current language_code of the User
        var langCode = ADCore.user.current(req).getLanguageCode();

		FCFActivityImages.find(filter)
		.populate('translations')
		.populate('uploadedBy')
		.populate('taggedPeople')
		.then(function(list){

			var fields = [ 'id', 'image', 'date', 'activity', 'caption' ];
			var simpleList = [];

			list.forEach(function(activity){

				var simpleActivity = {};
				

				// translate the activity
				activity.translate(langCode);


				// copy over the base fields
				fields.forEach(function(field){
					simpleActivity[field] = activity[field];
				});

AD.log('date.toString():', simpleActivity.date.toString());
				// simpleActivity.date = simpleActivity.date.toString().split('T')[0];


				// reduce the taggedPeople to a list of [ids]
				var taggedPeopleIDs = [];
				activity.taggedPeople.forEach(function(person){
					taggedPeopleIDs.push(person.IDPerson);
				})
				simpleActivity.taggedPeople = taggedPeopleIDs;
				

				// reduce uploadedBy => { IDPerson, display_name }
				if (activity.uploadedBy) {
					simpleActivity.uploadedBy = {
						IDPerson: activity.uploadedBy.IDPerson,
						displayName: activity.uploadedBy.displayName(langCode)
					}
				}


				simpleList.push(simpleActivity);
			})

			ADCore.comm.success(res,simpleList);
		})
		.catch(function(err){

			ADCore.comm.error(res, err);

			err._model = 'FCFActivityImages';
			err._filter = filter;
			err._langCode = langCode;
			AD.log.error('<bold>error:</bold> error looking up FCFActivityImages', err);

		});

	},


	// get /fcf_activities/activityimage/:id?[filter]
	// normal:  get /fcf_activities/activityimage/:id
	// optional: get /fcf_activities/activityimage/?param=X
	// 
	findOne:function(req, res) {

		var id = req.param('id');

		var filter = req.query;
		if (id) filter.id = id;


		FCFActivityImages.findOne(filter)
		.populate('traslations')
		.populate('uploadedBy')
		.populate('taggedPeople')
		.then(function(image){
			image.translate(langCode);
			ADCore.comm.success(res, image);
		})
		.catch(function(err){
			ADCore.comm.error(res, err);
			err._model = 'FCFActivityImages';
			err._id = id;
		});

	},

	create:function(req, res) {

		ADCore.comm.success(res,{ status:'created' })

	},

	update:function(req, res) {

		ADCore.comm.success(res,{ status:'updated' })

	},

	destroy:function(req, res) {

		ADCore.comm.success(res,{ status:'destroyed' });
	},

	upload:function(req, res) {

		req.file('imageFile').upload({}, function(err, list){

			if (err) {
				ADCore.comm.error(res, err);
			} else {

				var tempFile = list[0].fd;
				var parts = list[0].fd.split(path.sep)
				var tempName = parts[parts.length-1];

				var processPath = process.cwd();
				var newFile = path.join(processPath, 'assets', 'data', 'fcf', 'images', 'temp', tempName);

				// the return name should be the path after assets/
				var returnName = newFile.replace(path.join(processPath, 'assets'), '');

				fs.rename(tempFile, newFile, function(err){

					if (err) {
						ADCore.comm.error(res, err);
					} else {
						ADCore.comm.success(res, { path:returnName, name:tempName });
					}
					
				});

			}
		})


	}
	
};

