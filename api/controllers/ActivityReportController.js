/**
 * ActivityReportController
 *
 * @description :: Server-side logic for managing Userteams
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var AD = require('ad-utils');

module.exports = {
	

    _config: {},


    // /activityreport/activities/:teamid
    activities:function(req, res) {


        // what is the current language_code of the User
        var langCode = ADCore.user.current(req).getLanguageCode();



        var minId = req.param('team');
        // if no minId provided, return an error.
        if (!minId) {

            var err = new Error('No Team provided.');
            ADCore.comm.error(res, err, 500);
            return;
        }



        var listActivities = [];
        var listProjects = [];
        var hashProjects = {};  // minID : [FCFProject]
        var FinalData = [];


        async.series([

            // Find all the activities for the given Team
            // -- only ongoing activities  (date_end == null)
            // -- or have ended no more than 120 days ago
            function(next) {

                var fourMonthsAgo = new Date();
                fourMonthsAgo.setDate(fourMonthsAgo.getDate() - 120 )

                FCFActivity.find({team:minId,  'or': [ { date_end: { '>=': fourMonthsAgo }}, { date_end:null}]})
                .populate('translations')
                .populate('team')
                .fail(function(err){
                    next(err);
                })
                .then(function(data){

                    // Translate these entries:
                    data.forEach(function(activity){
                        activity.translate(langCode);
                    })
                    listActivities = data;
                    next();
                })
            },


            // now lookup the Projects for these Activities
            // when we are done we want hashProjects [ minID ] = project
            function(next) {

                var ids = [];
                var tempHash = {};  // projID : minID

                // collect all the project id's to look up:
                listActivities.forEach(function(activity){
                    if(activity.team) {
                        ids.push(activity.team.IDProject);

                        // a reverse lookup for our projectID : ministryID
                        tempHash[activity.team.IDProject] = activity.team.IDMinistry;
                    }
                })

                // if we have some peojects to lookup:
                if ( ids.length > 0) {

                    FCFProject.find({IDProject:ids})
                    .then(function(list){

                        // for each project, populate our hashProjects
                        list.forEach(function(project){
                            var minID = tempHash[project.IDProject];
                            hashProjects[ minID ] = project;
                        })

                        next();

                    })
                    .catch(function(err){
                        next(err);
                    })

                } else {

                    next();
                }
                

            },



            // now take info and compile into FinalData 
            // we only want:  id, activity_name, team_name, PersonName
            function(next) {

                listActivities.forEach(function(entry){
                    var obj = {};
                    obj.id = entry.id;
                    obj.activity_name = entry.activity_name;
                    obj.team_name = entry.team.MinistryDisplayName;
                    obj.imageURL =  entry.default_image || '/data/fcf/images/activities/placeholder_activity.jpg';
                    obj.ProjectOwner = '?';
                    if (hashProjects[entry.team.IDMinistry]) {
                        obj.ProjectOwner = hashProjects[entry.team.IDMinistry].displayName(langCode);
                    }
                    

                    FinalData.push(obj);
                })

                next();
            }



        ], function(err, results) {

            if (err) {

                ADCore.comm.error(res, err, 500);
            } else {

                ADCore.comm.success(res, FinalData);
            }

        });
        
    },


    teammembers: function (req, res) {

        // what is the current language_code of the User
        var langCode = ADCore.user.current(req).getLanguageCode();

        var teamID = req.param('teamID');

        if (!teamID) {

            // if no team provided, just retun empty []
            ADCore.comm.success(res, []);

        } else {

            var peopleIDs = [];
            var listPeople = null;

            async.series([

                // step1 get all the people references
                function(next) {

                    FCFMinistryTeamMember.find({IDMinistry:teamID})
                    .then(function(list){

                        if (list) {

                            list.forEach(function(entry){
                                if (entry.IDPerson) {
                                    peopleIDs.push(entry.IDPerson);
                                }
                            })

                        }

                        next();
                    })
                    .catch(function(err){
                        AD.log(err);
                        next(err);
                    })

                },  

                // step 2: now look up all those people:
                function(next) {

                    AD.log('... teammembers looking up people:', peopleIDs );

                    FCFPerson.find({IDPerson:peopleIDs})
                    .then(function(list){


                        list.forEach(function(person){
                            person.display_name = person.displayName(langCode);
                            person.avatar = '/images/activities_person_avatar.jpeg';
                        })
                        listPeople = list;
                        next();

                    })
                    .catch(function(err){
                        AD.log(err);
                        next(err);
                    })
                }

            ], function(err, results){

                if (err) {
                    ADCore.comm.error(res, err);
                } else {
                    ADCore.comm.success(res, listPeople );
                }

            })

            
        }
    },



    whoami:function(req, res) {

        AD.log('<green>whoami:</green>');

        FCFCore.personForSession(req)
        .fail(function(err){
            AD.log.error('... error finding personForSession():', err);
            ADCore.comm.error(res, err);
        })
        .then(function(data){

            if (!data) {
                AD.log.error('... did not match a person');
            } else {
                AD.log('... found');
            }

            var simplePerson = {
                IDPerson:data.IDPerson,
                display_name: data.displayName()
            }

            ADCore.comm.success(res, simplePerson );
        })

    },



    // http://localhost:1337/fcf_activities/activityreport/relevantTags?activities=24&activities=25&activities=26&activities=27&activities=28&activities=29
    relevantTags: function(req, res) {

        AD.log('<green>relevantTags():</green>');

        var activities = req.param('activities');
        AD.log('... activities:'+activities);
        if (!activities) {
            var err = new Error('param[activities] required');
            AD.log.error('... no activity ids provided!');
            ADCore.comm.error(res,err);
            return;
        } 


        // FinalData is a hash of activity_id : [ peopleID, peopleID...]
        var finalData = {};

        // listOldActivities: [] of activity.id for past activities
        var listOldActivities = [];

        // listCurrentActivities: [] of activitiy.id
        var listCurrentActivities = [];


        var dateToday = new Date();
        AD.log('... today\'s date:', dateToday)


        async.series([

            // Step 1) get all activities with end date in the past
            function(next) {
                
                FCFActivity.find({ id:activities, date_end: { '<=': dateToday }})
                .then(function(activities){
                    AD.log('... activities in the past:');
                    activities.forEach(function(a){
                        AD.log('    id:'+a.id+' date_end:'+ a.date_end);
                        listOldActivities.push(a.id)
                    })                   
                    next();
                })
            },


            // step 2) get all activities with end date in future (or null)
            function(next) {
                FCFActivity.find({ id:activities,  'or': [ { date_end: { '>': dateToday }}, { date_end:null}] })
                .then(function(activities){
                    AD.log('... activities current:');
                    activities.forEach(function(a){
                        AD.log('    id:'+a.id+' date_end:'+ a.date_end);
                        listCurrentActivities.push(a.id)
                    })                   
                    next();
                })
            },

            // step 3) now gather all the people in parallel
            function(next) {


                var activityHash = {};  // this is our final Hash of { activityID : [IDPerson,...]}
                var currDate =  new Date(); // today:

                async.parallel([

                    // task 1: handle the old activities
                    function(done) {

                        // if there are none to lookup, then skip
                        if (listOldActivities.length == 0) {

                            done();

                        } else {

                            var fourMonthsAgo = new Date();
                            fourMonthsAgo.setDate(fourMonthsAgo.getDate() - 120 )
                            AD.log('... fourMonthsAgo:', fourMonthsAgo);

                            peopleTaggedInPhotos(activityHash, listOldActivities, fourMonthsAgo)
                            .fail(function(err){
                                AD.log.error('error finding peopleTaggedInPhotos fourMonthsAgo');
                                done(err);
                            })
                            .then(function( hash ) {

                                // convert the peopleID hash to an array of ids
                                for (var id in hash) {
                                    var personHash = hash[id];
                                    var personArry = _.keys(personHash);

                                    finalData[id] = personArry;

                                }

                                done();
                            })
                        }

                    },

                    // task 2: handle the current activities

                    function(done) {

                        // if there are none to lookup, then skip
                        if (listCurrentActivities.length == 0) {

                            done();

                        } else {
                            var twoMonthsAgo = new Date();
                            twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60 )
                            AD.log('... twoMonthsAgo:', twoMonthsAgo);

                            peopleTaggedInPhotos(activityHash, listCurrentActivities, twoMonthsAgo)
                            .fail(function(err){
                                AD.log.error('error finding peopleTaggedInPhotos twoMonthsAgo');
                                done(err);
                            })
                            .then(function( hash ) {

                                // convert the peopleID hash to an array of ids
                                for (var id in hash) {
                                    var personHash = hash[id];
                                    var personArry = _.keys(personHash);

                                    finalData[id] = personArry;
                                }

                                done();
                            })
                        }


                    },

                ], function(error, results) {

                    next();

                })

            }


        ], function(err, results) {

            if (err) {
                AD.log.error(err)
                ADCore.comm.error(res,err);
            } else {
                AD.log('<green>relevantTags done:</green> finalData:', finalData);
                ADCore.comm.success(res, finalData);
            }

        })
        // get activities with end date past
            // get images from 120 days  ago
            // compile all people taged with these images

        // get activities with no end date
            // get images from 60 days ago
            // compile all people tagged with these images

        // for


        var peopleTaggedInPhotos = function( activityHash, activityIDs, afterDate ) {
            var dfd = AD.sal.Deferred();

            // a recursive fn to process a single activityID
            var processCurrent = function(cb) {

                // if there are no more items in our array
                if (activityIDs.length < 1) {
                    // we'er done
                    if (cb) cb();
                } else {

                    // shift off the next activity id
                    var actID = activityIDs.shift();

                    // create a hash to hold all the people ids
                    activityHash[actID] = {};

                    // find all images related to this activity after our date
                    FCFActivityImages.find({ activity:actID, date: {'>=': afterDate }})
                    .populate('taggedPeople')
                    .then(function(images){

                        // for each image returned
                        images.forEach(function(image){

                            // for each person in the image
                            image.taggedPeople.forEach(function(person){

                                // mark that person as tagged
                                activityHash[actID][person.IDPerson] = true;
                            })

                        })

                        // now recurse through this fn() again
                        processCurrent(cb);

                    })

                }
            }


            
            var numDone = 0;

            // start no more than 5 of these in parallel
            // if there are < 5 activityIDs, then only do that many
            var numStarted = 5;
            if (numStarted > activityIDs.length) numStarted = activityIDs.length;

            for(var i=0; i< numStarted; i++) {
                processCurrent(function(){

                    numDone++;
                    // if all of our parallel processes have finished:
                    if (numDone >= numStarted) {

                        // resolve() our data
                        dfd.resolve(activityHash);
                    }
                })
            }


            return dfd
        }

    }

    // , create:function(req, res) {
    //   ADCore.comm.success(res,{ status:'created' })
    // }

    // , update:function(req, res) {
    //   ADCore.comm.success(res,{status:'updated'})
    // }

    // , destroy:function(req, res) {
    //   ADCore.comm.success(res,{status:'destroyed'})
    // }
  
  
};

