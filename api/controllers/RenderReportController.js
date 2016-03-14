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

			function (next) {
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

					reportData.person_age = p.DateBirth ? getAge(p.DateBirth) : 'N/A';
					reportData.person_nationality = p.PlaceOfBirth ? p.PlaceOfBirth : 'N/A';
					reportData.person_passport_number = p.PPNumber ? p.PPNumber : 'N/A';
					reportData.person_work_address = p.WorkAddress ? p.WorkAddress : 'N/A';
					reportData.person_home_address = p.PhysicalAddress ? p.PhysicalAddress : 'N/A';

					reportData.person_visa_start_date = 'TODO - Visa start date';
					reportData.person_visa_expire_date = p.VisaDateExpire ? p.VisaDateExpire : 'N/A';

					reportData.person_job_title = p.JobTitle ? p.JobTitle : 'N/A';
					reportData.person_job_description = p.JobDescSimple ? p.JobDescSimple : 'N/A';

					reportData.organization_name = 'TODO - Organization name';
					reportData.organization_chief_name = 'TODO - Chief name';
					reportData.organization_chief_position = 'TODO - Chief position';
					reportData.workplace_name = 'TODO - Workplace name';

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

	}
};