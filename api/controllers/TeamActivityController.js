/**
 * TeamActivityController
 *
 * @description :: Server-side logic for managing Userteams
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var AD = require('ad-utils');


var hashTeamUpdates = {
    // team id : [ socket_id's]
}


module.exports = {
	

    _config: {}

    // Return the list of Activities for a given Ministry
    , find:function(req, res) {


        var FinalData = [];
        var listActivities = null;


        // which IDMinistry are we looking for Activities for?
        var minId = req.param('team');

        // what is the current language_code of the User
        var langCode = ADCore.user.current(req).getLanguageCode();


        // if no minId provided, return an error.
        if (!minId) {

            var err = new Error('No Team provided.');
            ADCore.comm.error(res, err, 500);
            return;
        }



        // save this socket id associated with this team:
        var id = ADCore.socket.id(req);
        if (id) {
AD.log('... registering for TeamUpdates:');
            if (hashTeamUpdates[minId]) {
                hashTeamUpdates[minId].push(id);
            } else {
                hashTeamUpdates[minId] = [ id ];
            }
AD.log('hashTeamUpdates:', hashTeamUpdates);
        }

        async.series([

            // get the user's Person Entry
            function(next) {

                FCFActivity.find({team:minId})
                .populate('translations')
                .populate('createdBy')
                .populate('approvedBy')
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


            // Flatten this out to our essential data:
            function(next) {
                listActivities.forEach(function(activity){

                    var obj = {};
                    obj.id = activity.id;
                    obj.team = activity.team;
                    obj.activity_name = activity.activity_name;
                    obj.createdBy = activity.createdBy ? activity.createdBy.displayName(langCode) : '';
                    obj.approvedBy = activity.approvedBy ? activity.approvedBy.displayName(langCode): '';

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
        
    }

    , create:function(req, res) {

        var data = {};
        data.activity_name = req.param('name');
        data.activity_description = req.param('description');
        data.date_start = req.param('startDate');
        data.date_end = req.param('endDate');
        data.team = req.param('team');


        var objectives = req.param('objective');


        var langCode = ADCore.user.current(req).getLanguageCode();


        var newActivity = null;
        var ReturnData = {};

        async.series([

            function(next) {
                FCFCore.personForSession(req)
                .fail(function(err){
                    next(err);
                })
                .then(function(person){
                    data.createdBy = person.IDPerson;
                    next();
                })
            },


            function(next) {

                Multilingual.model.create({ model: FCFActivity, data:data})
                .fail(function(err){
                    next(err);
                })
                .then(function(activity){

                    newActivity = activity;
// AD.log('activity:', activity);

                    // associate our objectives with the new activity
                    objectives.forEach(function(objective){
                        activity.objectives.add(objective);
                    })
                    activity.save()
                    .fail(function(err){
                        next(err);
                    })
                    .then(function(){
                        next();
                    })
                    
                })
            },


            function(next) {

                FCFActivity.findOne({id:newActivity.id})
                .populate('translations')
                .populate('createdBy')
                .populate('approvedBy')
                .fail(function(err){
                    next(err);
                })
                .then(function(activity){

                    // Translate these entries:
                    activity.translate(langCode);

                    // now create a new entry to return:
                    ReturnData.id = activity.id;
                    ReturnData.activity_name = activity.activity_name;
                    ReturnData.createdBy = activity.createdBy ? activity.createdBy.displayName(langCode) : '';
                    ReturnData.approvedBy = activity.approvedBy ? activity.approvedBy.displayName(langCode): '';
                    ReturnData.team  = activity.team;
                    next();
                })

            },


            //  Announce this new Activity to any socket that had requested a list
            //  of activitiys for this same team
            function(next) {
//// TODO: refactor the socket functionality using subscriptions to the model itself.
/*
                var currentSocketId = ADCore.socket.id(req);
AD.log('currentSocketID:'+currentSocketId);

                // send this new entry to anyone else :
                var team = data.team;
AD.log('hashTeamUpdates:',hashTeamUpdates);

                if (hashTeamUpdates[team]) {
                    hashTeamUpdates[team].forEach(function(id){

                        // don't send a message to the current connection's socket.
                        if (id != currentSocketId) {
                            sails.sockets.emit(id, 'fcf_activity_new_external', {
                                team:team,
                                activity:ReturnData
                            });
                        }
                    })
                }
*/
                next();
            }

        ], function(err, results){

            if (err) {

                ADCore.comm.error(res, err, 500);
            } else {

                ADCore.comm.success(res, ReturnData);
            }

        })
    }

    // , update:function(req, res) {
    //   ADCore.comm.success(res,{status:'updated'})
    // }

    // , destroy:function(req, res) {
    //   ADCore.comm.success(res,{status:'destroyed'})
    // }
  
  
};

