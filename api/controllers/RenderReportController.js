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

function populateStaffInfo(persons) {
	var dfd = AD.sal.Deferred(),
		result = [];

	if (!persons) {
		dfd.resolve(result);
		return dfd;
	}

	var personIds = _.map(persons, function(p) { return p.IDPerson; });

	async.waterfall([
		// Get address info
		function(next) {
			FCFAddress.find({ IDPerson: personIds })
				.populate('IDTambon')
				.populate('IDAmphur')
				.populate('IDProvince')
				.fail(next)
				.then(function (addrInfo) {
					next(null, addrInfo);
				});
		},
		function(addresses, next) {
			persons.forEach(function(p) {
				var reportData = {};

				reportData.person_id = p.IDPerson;
				reportData.person_name = (p.NameTitleThai ? p.NameTitleThai : '') +
					(p.NameFirstThai ? p.NameFirstThai + ' ' : '') +
					(p.NameMiddleThai ? p.NameMiddleThai + ' ' : '') +
					(p.NameLastThai ? p.NameLastThai : '');

				reportData.person_name_en = (p.NameTitleEng ? p.NameTitleEng + ' ' : '') +
					(p.NameFirstEng ? p.NameFirstEng + ' ' : '') +
					(p.NameMiddleEng ? p.NameMiddleEng + ' ' : '') +
					(p.NameLastEng ? p.NameLastEng : '');

				reportData.person_age = p.DateBirth ? getAge(p.DateBirth) : 'N/A (Age)';
				reportData.person_passport_number = p.PPNumber ? p.PPNumber : 'N/A (PP Number)';
				reportData.person_work_number = p.WPNumber ? p.WPNumber : 'N/A (Work Number)';
				reportData.person_work_address = p.WorkAddress ? p.WorkAddress : 'N/A (Work address)';

				reportData.person_visa_start_date = p.VisaDateIssuedMostRecent ? p.VisaDateIssuedMostRecent :'N/A (Visa date issue)';
				reportData.person_visa_expire_date = p.VisaDateExpire ? p.VisaDateExpire : 'N/A (Visa expire date)';

				reportData.person_job_title = p.JobTitle ? p.JobTitle : 'N/A (Job title)';
				reportData.person_job_description = p.JobDescSimple ? p.JobDescSimple : 'N/A (Job description)';

				reportData.project_title = p.Project;

				reportData.organization_name = 'N/A (Organization name)';
				reportData.organization_chief_name = 'N/A (Chief name)';
				reportData.organization_chief_position = 'N/A (Chief position)';
				reportData.workplace_name = 'N/A (Workplace name)';

				if (p.codeNationality) {
					if (p.codeNationality.NationalityDescThai)
						reportData.person_nationality = p.codeNationality.NationalityDescThai;
					else if (p.codeNationality.CountryDescThai)
						reportData.person_nationality = p.codeNationality.CountryDescThai;
					else
						reportData.person_nationality = 'N/A (Nationality)';
				}
				else
					reportData.person_nationality = 'N/A (Nationality)';

				reportData.number_of_approved_images = (p.taggedInImages && p.taggedInImages.length ? p.taggedInImages.length : 0);
				if (reportData.number_of_approved_images > 0) {
					var activityIds = _.map(p.taggedInImages, function(img) { return img.activity; });
					reportData.number_of_approved_activities = _.uniq(activityIds).length;
				}
				else
					reportData.number_of_approved_activities = 0;

				if (p.address) {
					var address = addresses.filter(function(addr) {
						return addr.IDPerson == p.IDPerson;
					});

					reportData.person_home_address = '';

					if (address[0] && address[0].codeAddressType == 'TH') {
						reportData.person_home_address += address[0].Address1Thai ? (address[0].Address1Thai + ' ') : '';
						reportData.person_home_address += address[0].Address2Thai ? (address[0].Address2Thai + ' ') : '';
						reportData.person_home_address += address[0].NeighborhoodThai ? (address[0].NeighborhoodThai + ' ') : '';

						if (address[0].IDTambon)
							reportData.person_home_address += 'ต.' + address[0].IDTambon.NAME_PRI + ' ';

						if (address[0].IDAmphur)
							reportData.person_home_address += 'อ.' + address[0].IDAmphur.NAME_PRI + ' ';

						if (address[0].IDProvince)
							reportData.person_home_address += 'จ.' + address[0].IDProvince.NAME_PRI + ' ';

						if (address[0].Zip)
							reportData.person_home_address += address[0].Zip;
					}
				}

				result.push(reportData);
			});

			next();
		}
	], function(err) {
		if (err)
			dfd.reject(err);
		else
			dfd.resolve(result);
	});

	return dfd;
}

module.exports = {

	// /fcf_activities/renderreport/staffs
	staffs: function(req, res) {
		AD.log('<green>::: renderreport.staffs() :::</green>');

		// Set member name filter
		var memberNameFilter = { codeWorkFlowPhase: 'OG' };
		var memberName = req.param('memberName');
		if (memberName) {
			memberNameFilter.and = [
				memberNameFilter,
				{
					or: [
						{ NameFirstThai: { contains: memberName } },
						{ NameMiddleThai: { contains: memberName } },
						{ NameLastThai: { contains: memberName } }
					]
				}
			];
		};

		var persons = [];
		var results = [];

		async.series([

			function(next) {

				// Find person object
				FCFPerson.find(memberNameFilter)
					.populate('taggedInImages', { status: ['approved', 'ready'] })
					.populate('codeNationality')
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
				populateStaffInfo(persons).fail(next)
					.then(function (personInfos) {
						results = personInfos;
						next();
					});
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

	// /fcf_activities/renderreport/activestaffs
	activestaffs: function(req, res) {
		AD.log('<green>::: renderreport.activestaffs() :::</green>');

		var userGuids = [],
			staffIds = [],
			persons = [],
			results = [];

		async.series([

			function(next) {
				// Get guid of active users
				SiteUser.find({ isActive: 1 }, { select: ['guid'] })
					.then(function(result) {
						userGuids = _.map(result, function(r) { return r.guid; });

						next();
					});
			},

			function(next) {
				// Get id of staffs
				GUID2Person.find({ guid: userGuids }, { select: ['person'] })
					.then(function(result) {
						staffIds = _.map(result, function(r) { return r.person; });

						next();
					});
			},

			function(next) {
				// Set member name filter
				var memberFilter = {
					codeWorkFlowPhase: 'OG',
					IDPerson: staffIds
				};
				var memberName = req.param('memberName');
				if (memberName) {
					memberFilter.and = [
						memberFilter,
						{
							or: [
								{ NameFirstThai: { contains: memberName } },
								{ NameMiddleThai: { contains: memberName } },
								{ NameLastThai: { contains: memberName } }
							]
						}
					];
				};

				// Find person object
				FCFPerson.find(memberFilter)
					.populate('codeNationality')
					.fail(function(err) {
						AD.log(err);
						next(err);
					})
					.then(function(p) {
						if (!p || p.length < 1)
							next('Could not found any person.');

						persons = p;
						next();
					});
			},

			function(next) {
				populateStaffInfo(persons).fail(next)
					.then(function(personInfos) {
						results = personInfos;
						next();
					});
			}
		], function(err, r) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end renderreport.activestaffs() :::</green>');
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

		var personFilter = { codeWorkFlowPhase: 'OG' },
			persons = [],
			results = [];

		async.series([
			function(next) {

				// Find person object
				FCFPerson.find(personFilter, { fields: ['IDPerson'] })
					.populate('taggedInImages', { status: ['approved', 'ready'] })
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
										'person_id': p.IDPerson,
										'activity_id': act.id,
										'activity_name': act.translations[0].activity_name,
										'activity_name_govt': act.translations[0].activity_name_govt,
										'startDate': act.date_start,
										'endDate': act.date_end,
										'order': index + 1
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

		var personFilter = { codeWorkFlowPhase: 'OG' },
			persons = [],
			images = [],
			results = [];

		async.series([
			function(next) {

				// Find person object
				FCFPerson.find(personFilter, { fields: ['IDPerson'] })
					.populate('taggedInImages', { status: ['approved', 'ready'] })
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
				// Find image caption
				persons.forEach(function(p) {
					p.taggedInImages.forEach(function(img) {
						var imageFile = img.image;

						if (imageFile.indexOf('_scaled.') > -1)
							imageFile = imageFile.replace('_scaled.', '_print.');

						images.push({
							'image_id': img.id,
							'person_id': p.IDPerson,
							'activity_id': img.activity,
							'activity_image_file_name': imageFile
						});
					});
				});

				var imageIds = _.map(images, function(r) {
					return r.image_id;
				});

				FCFActivityImages.find({ id: _.uniq(imageIds) })
					.populate('translations', { language_code: langCode })
					.then(function(resultImages) {
						resultImages.forEach(function(img) {
							images.forEach(function(image) {
								if (image.image_id == img.id) {
									image.caption = img.translations[0] ? img.translations[0].caption : '';
									image.caption_govt = img.translations[0] ? img.translations[0].caption_govt : '';
								}
							});
						});

						next();
					});
			},
			function(next) {
				var activityIds = _.map(images, function(r) {
					return r.activity_id;
				});

				// Find activity name
				FCFActivity.find({ id: _.uniq(activityIds) })
					.populate('translations', { language_code: langCode })
					.then(function(activities) {
						images.forEach(function(r) {
							var act = _.find(activities, { 'id': r.activity_id });
							if (act && act.translations && act.translations[0]) {
								r.activity_name = act.translations[0].activity_name;
								r.activity_name_govt = act.translations[0].activity_name_govt;
								r.activity_description = act.translations[0].activity_description;
								r.activity_description_govt = act.translations[0].activity_description_govt;
							}
							r.activity_start_date = act.date_start;
							r.acitivity_end_date = act.date_end;
						});

						next();
					});
			},

			function(next) {
				var groupedImages = _.groupBy(_.uniq(images), function(img) {
					return img.activity_id + '&' + img.person_id;
				});

				for (var actId in groupedImages) {
					var img = groupedImages[actId];
					for (var i = 0; i < img.length; i += 2) {

						var result = {
							'person_id': img[i].person_id,
							'activity_id': img[i].activity_id,
							'activity_name': img[i].activity_name,
							'activity_name_govt': img[i].activity_name_govt,
							'activity_description': img[i].activity_description,
							'activity_description_govt': img[i].activity_description_govt,
							'activity_start_date': img[i].activity_start_date,
							'activity_end_date': img[i].acitivity_end_date,
							'activity_image_file_name_left_column': img[i].activity_image_file_name,
							'activity_image_caption_left_column': img[i].caption,
							'activity_image_caption_govt_left_column': img[i].caption_govt
						};

						var right_column_img = img[i + 1];
						if (right_column_img) {
							result.activity_image_file_name_right_column = right_column_img.activity_image_file_name;
							result.activity_image_caption_right_column = right_column_img.caption;
							result.activity_image_caption_govt_right_column = right_column_img.caption_govt;
						}
						else {
							result.activity_image_file_name_right_column = 'blank.jpg';
						}

						results.push(result);
					}
				}

				next();
			}
		], function(err, r) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end renderreport.acitivity_images() :::</green>');
				ADCore.comm.success(res, results);
			}
		});
	},

	// /fcf_activities/renderreport/approved_images
	approved_images: function(req, res) {
		var results = [],
			persons = [];

		async.series([

			function (next) {
				// Find person object
				FCFPerson.find({ codeWorkFlowPhase: 'OG' }, { fields: ['IDPerson'] })
					.populate('taggedInImages', { status: ['approved', 'ready'] })
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

				// Find image caption
				persons.forEach(function (p) {
					p.taggedInImages.forEach(function (img) {
						results.push({
							'image_id': img.id,
							'person_id': p.IDPerson,
							'activity_id': img.activity,
							'date': img.date
						});
					});
				});

				next();
			}

		], function (err, r) {

			if (err) {

				ADCore.comm.error(res, err, 500);
			} else {

				AD.log('<green>::: end renderreport.approved_images() :::</green>');
				ADCore.comm.success(res, results);
			}
		});
	}

};