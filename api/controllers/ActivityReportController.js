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

            // get the user's Person Entry
            function(next) {

                FCFActivity.find({team:minId})
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


            // Now get the list of people tagged in photos
            // for this activity:
            //   - in past 90 days
            function(next) {
//// TODO: when we have activity images and people tags...
next();

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

