/* global NameMiddleThai */
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

	// /fcf_activities/renderreport/staffs
	staffs: function(req, res) {
		AD.log('<green>::: renderreport.staffs() :::</green>');

		// Set member name filter
		var memberNameFilter = { status: 'Active (In Country)' }; // TODO : Filter status
		var memberName = req.param('memberName');
		if (memberName) {
			memberNameFilter = {
				or: [
					{ NameFirstThai: { contains: memberName } },
					{ NameMiddleThai: { contains: memberName } },
					{ NameLastThai: { contains: memberName } }
				]
			};
		}

		var persons = [];
		var results = [];

		async.series([

			function(next) {

				// Find person object
				FCFPerson.find(memberNameFilter)
					.populate('taggedInImages')
					.fail(function(err) {
						AD.log(err);
						next(err);
					})
					.then(function(p) {
						if (p.length < 1)
							next('Could not found any person.');

						persons = p;
						next();
					});
			},

			function(next) {
				// Remove persons who does not have any activities
				_.remove(persons, function(p) {
					return !p.taggedInImages || p.taggedInImages.length < 1;
				});

				next();
			},

			function(next) {

				// Subtract fields
				results = _.map(persons, function(p) {
					var reportData = {};

					reportData.person_id = p.IDPerson;
					reportData.person_name = (p.NameTitleThai ? p.NameTitleThai + ' ' : '') +
						(p.NameFirstThai ? p.NameFirstThai + ' ' : '') +
						(p.NameMiddleThai ? p.NameMiddleThai + ' ' : '') +
						(p.NameLastThai ? p.NameLastThai + ' ' : '');

					reportData.person_name_en = (p.NameTitleEng ? p.NameTitleEng + ' ' : '') +
						(p.NameFirstEng ? p.NameFirstEng + ' ' : '') +
						(p.NameMiddleEng ? p.NameMiddleEng + ' ' : '') +
						(p.NameLastEng ? p.NameLastEng + ' ' : '');

					reportData.person_age = p.DateBirth ? getAge(p.DateBirth) : 'N/A (Age)';
					reportData.person_nationality = p.PlaceOfBirth ? p.PlaceOfBirth : 'N/A (Nationality)';
					reportData.person_passport_number = p.PPNumber ? p.PPNumber : 'N/A (PP Number)';
					reportData.person_work_number = p.WPNumber ? p.WPNumber : 'N/A (Work Number)';
					reportData.person_work_address = p.WorkAddress ? p.WorkAddress : 'N/A (Work address)';
					reportData.person_home_address = p.PhysicalAddress ? p.PhysicalAddress : 'N/A (Home Address)';

					reportData.person_visa_start_date = 'N/A (Visa start date)';
					reportData.person_visa_expire_date = p.VisaDateExpire ? p.VisaDateExpire : 'N/A (Visa expire date)';

					reportData.person_job_title = p.JobTitle ? p.JobTitle : 'N/A (Job title)';
					reportData.person_job_description = p.JobDescSimple ? p.JobDescSimple : 'N/A (Job description)';

					reportData.organization_name = 'N/A (Organization name)';
					reportData.organization_chief_name = 'N/A (Chief name)';
					reportData.organization_chief_position = 'N/A (Chief position)';
					reportData.workplace_name = 'N/A (Workplace name)';

					reportData.project_description = 'N/A (Project description)';

					return reportData;
				});

				next();
			}
		], function(err, r) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end renderreport.staffs() :::</green>');
				ADCore.comm.success(res, results);
			}
		});
	},

	// /fcf_activities/renderreport/activities
	activities: function(req, res) {
		AD.log('<green>::: renderreport.activities() :::</green>');

		// what is the current language_code of the User
		// var langCode = ADCore.user.current(req).getLanguageCode();
		var langCode = 'th'; // TODO

		var personFilter = { status: 'Active (In Country)' }, // TODO : Filter status
			persons = [],
			results = [];

		async.series([
			function(next) {

				// Find person object
				FCFPerson.find(personFilter, { fields: ['IDPerson'] })
					.populate('taggedInImages')
					.fail(function(err) {
						AD.log(err);
						next(err);
					})
					.then(function(p) {
						if (p.length < 1)
							next('Could not found any person.');

						persons = p;
						next();
					});
			},
			function(next) {

				async.map(persons, function(p, callback) {
					var activityIds = _.map(p.taggedInImages, function(img) {
						return img.activity;
					});

					if (activityIds && activityIds.length > 0) {
						// Find activities
						FCFActivity.find({ id: _.uniq(activityIds) })
							.populate('translations', { language_code: langCode })
							.then(function(a) {
								p = _.map(a, function(act, index) {
									return {
										'order': index + 1,
										'activity_name': act.translations[0].activity_name,
										'startDate': act.date_start,
										'endDate': act.date_end,
										'person_id': p.IDPerson
									}
								});
								callback(null, p);
							});
					}
					else {
						callback(null, null);
					}
				}, function(err, r) {
					_.remove(r, function(t) { return !t; });
					results = _.flatten(r);
					next();
				});
			}

		], function(err, r) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end renderreport.activities() :::</green>');
				ADCore.comm.success(res, results);
			}
		});
	},

	// /fcf_activities/renderreport/acitivity_images
	acitivity_images: function(req, res) {
		AD.log('<green>::: renderreport.acitivity_images() :::</green>');

		// what is the current language_code of the User
		// var langCode = ADCore.user.current(req).getLanguageCode();
		var langCode = 'th'; // TODO

		var personFilter = { status: 'Active (In Country)' }, // TODO : Filter status
			persons = [],
			results = [];

		async.series([
			function(next) {

				// Find person object
				FCFPerson.find(personFilter, { fields: ['IDPerson'] })
					.populate('taggedInImages')
					.fail(function(err) {
						AD.log(err);
						next(err);
					})
					.then(function(p) {
						if (p.length < 1)
							next('Could not found any person.');

						persons = p;
						next();
					});
			},
			function(next) {
				persons.forEach(function(p) {
					p.taggedInImages.forEach(function(img) {
						results.push({
							'person_id': p.IDPerson,
							'activity_id': img.activity,
							'activity_image_file_name': img.image
						});
					});
				});

				var activityIds = _.map(results, function(r) {
					return r.activity_id;
				});

				// Find activity name
				FCFActivity.find({ id: _.uniq(activityIds) })
					.populate('translations', { language_code: langCode })
					.then(function(activities) {

						results.forEach(function(r) {
							r.activity_name = _.find(activities, { 'id': r.activity_id }).translations[0].activity_name;
						});

						next();
					});
			}
		], function(err, r) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end renderreport.acitivity_images() :::</green>');
				ADCore.comm.success(res, results);
			}
		});
	}

};