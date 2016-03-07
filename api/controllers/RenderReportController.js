/**
 * RenderReportController
 *
 * @description :: Server-side logic for managing render reports
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var AD = require('ad-utils');
var _ = require('lodash');
var async = require('async');

function getAge(birthDate) {
    var today = new Date();
    birthDate = (typeof birthDate === 'string' ? new Date(birthDate) : birthDate);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

module.exports = {
	
	// /fcf_activities/renderreport/activities?personId=:personId
	activities: function (req, res) {
		AD.log('<green>::: renderreport.activities() :::</green>');

		// what is the current language_code of the User
		// var langCode = ADCore.user.current(req).getLanguageCode();
		var langCode = 'th'; // TODO

		var personId = req.param('personId');

		// if no personId provided, return an error.
		if (!personId) {
			var err = new Error('No Person id provided.');
			ADCore.comm.error(res, err, 500);
			return;
		}

		var person = {};
		var activities = [];
		var reportData = {};

		async.series([

			function (next) {

				// Find person object
				FCFPerson.find({ IDPerson: personId })
					.populate('taggedInImages')
					.fail(function (err) {
						AD.log(err);
						next(err);
					})
					.then(function (p) {
						if (p.length > 0) {
							person = p[0];
							next();
						}
						else {
							next('Could not found any person.');
						}
					});
			},

			function (next) {
				var activityIds = _.map(person.taggedInImages, function (img) {
					return img.activity;
				});
				
				// Find activities
				FCFActivity.find({ id: _.uniq(activityIds) })
					.populate('translations', { language_code: langCode })
					.fail(function (err) {
						AD.log(err);
						next(err);
					})
					.then(function (a) {
						activities = a;
						next();
					});
			},

			function (next) {
				// Subtract fields
				reportData.person_name = (person.NameTitleThai ? person.NameTitleThai + ' ' : '') +
				(person.NameFirstThai ? person.NameFirstThai + ' ' : '') +
				(person.NameMiddleThai ? person.NameMiddleThai + ' ' : '') +
				(person.NameLastThai ? person.NameLastThai + ' ' : '');

				reportData.person_age = person.DateBirth ? getAge(person.DateBirth) : 'N/A';
				reportData.person_nationality = person.PlaceOfBirth ? person.PlaceOfBirth : 'N/A';
				reportData.person_passport_number = person.PPNumber ? person.PPNumber : 'N/A';
				reportData.person_work_address = person.WorkAddress ? person.WorkAddress : 'N/A';
				reportData.person_home_address = person.PhysicalAddress ? person.PhysicalAddress : 'N/A';

				reportData.person_visa_start_date = 'TODO - Visa start date';
				reportData.person_visa_expire_date = person.VisaDateExpire ? person.VisaDateExpire : 'N/A';

				reportData.person_job_title = person.JobTitle ? person.JobTitle : 'N/A';
				reportData.person_job_description = person.JobDescSimple ? person.JobDescSimple : 'N/A';

				reportData.person_activities = _.map(activities, function (a, index) {
					return {
						'order': index + 1,
						'title' : a.translations[0].activity_name
					};
				});

				reportData.organization_name = 'TODO - Organization name';
				reportData.organization_chief_name = 'TODO - Chief name';
				reportData.organization_chief_position = 'TODO - Chief position';
				reportData.workplace_name = 'TODO - Workplace name';

				next();
			}
		], function (err, results) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end renderreport.activities() :::</green>');
				ADCore.comm.success(res, reportData);
			}
		});
	}
};