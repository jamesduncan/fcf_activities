var path = require('path');
// var $ = require('jquery-deferred');
var AD = require('ad-utils');
var fs = require('fs');



var Log = function() {
    var newArgs = [];
    for (var i=0; i<arguments.length; i++) {
        newArgs.push(arguments[i]);
    }
    newArgs.unshift('<green>FCFCore:</green> ');
    AD.log.apply( null , newArgs);
}


///// TODO:
///// Move this into the FCFPerson Model object!


var _allAvatars = [];
var _avatarHash = {};

function allAvatars (cb) {
    if (_allAvatars.length == 0) {
        fs.readdir(FCFCore.paths.images.avatars(''), function(err, avatars){

            if (err) {
                cb(err);
            } else {
                _allAvatars = avatars;

                // turn this into a hash:  
                //  ID    :  Name
                // '0001' : '0001.jpg'
                for (var i = avatars.length - 1; i >= 0; i--) {
                    var parts = avatars[i].split('.');
                    _avatarHash[parts[0]] = avatars[i];
                };

                cb(null, _allAvatars);
            }

        });
    } else {
        cb(null, _allAvatars);
    }
} 


function addAvatar(listPeople, cb) {

    allAvatars(function(err, avatars) {

        if (err) {
            cb(err);
            return;
        }


        // now for each listPerson:
        for (var i = listPeople.length - 1; i >= 0; i--) {
            var person = listPeople[i];
            var id = person.getID();

            // encode the id into a hashID: 0999, 0099, 0009 
            var hashID = '' + id;    // '9'
            var attempt = 1;
            while (attempt <= 4) {
                if (!_avatarHash[hashID]) {
                    hashID = '0'+hashID;  // 09, 009
                    attempt++;
                } else {
                    // found a match so:
                    attempt = 5;  // stop the loop
                }
            }

            if (_avatarHash[hashID]) {

                var foundName = _avatarHash[hashID];
                person.avatar = FCFCore.paths.images.avatars(foundName);

                // remove the path before 'assets'
                person.avatar = person.avatar.split('assets')[1];

            }


        };

        cb();

    });
}




module.exports= {

    approvals : {

        /* 
         * return the base approval request layout:
         *
         * 
         */
        base:function(options) {
            // options.creator.id   : IDPerson of action creator
            // options.creator.guid : GUID of action creator

            // options.action    : the action on object needing approval
            // options.createdAt : the date this action happened

            // options.callback  : the callback object definition
            // options.permission : the permission object definition


            var dfd = AD.sal.Deferred();


            var creatorID = options.creator.id || null;
            var creatorGUID = options.creator.guid || null;

            if ((!creatorID) && (!creatorGUID)) {
                dfd.reject(new Error('creator.id or creator.guid is required!'));
                return dfd;
            }


            var creator = null;
            var ministryTeams = null;

            async.series([


                // get the GUID of the actor (creator, or updator)
                function(next) {

                    // only do this if ! creatorGUID
                    if (creatorGUID) {
                        next();
                    } else {

                        GUID2Person.find({ person:creatorID })
                        .exec(function(err, guid){
                            if (err) {
                                var myErr = new Error('Error looking up creator.guid');
                                myErr.error = err;
                                myErr.data = { person:creatorID };

                                next(myErr);

                            } else {
            // console.log('... found guid:', guid);
                                creatorGUID = guid[0].guid;
                                next();
                            }
                        });
                    }

                },


                // step : get actual person object from creator id:
                function(next) {

                    FCFPerson.findOne(creatorID)
                    .exec(function(err, person){

                        if (err) {
                            var myErr = new Error('Error looking up object creator');
                            myErr.error = err;
                            next(myErr);
                        } else {
        // console.log('... found uploader:', person);
                            creator = person;


                            // add an avatar to this person:
                            addAvatar([creator], function(err){
        // console.log('... creator with avatar:', creator);

                                next(err);
                            })

                        }
                    })
                },



                // step : look up ministry teams:
                function(next) {

                    creator.ministryTeams()
                    .fail(function(err){
                        var myErr = new Error('Error looking up ministry teams:');
                        myErr.error = err;
                        next(myErr);
                    })
                    .then(function(teams) {
                        ministryTeams = teams;
                        next();
                    })
                }


            ],function(err, results){


                if (err) {
                    dfd.reject(err);
                    return;
                }



                // clean up Dates:

                var createdAt = AD.util.moment(options.createdAt).format('LL');


                var request = {

                    "menu":{
                        "icon":options.icon || 'fa-file-image-o',
                        "action": {
                          "key":options.action,
                          "context":"fcf.activity"
                        },
                        // "instanceRef":"caption",
                        "createdBy":creator.displayName(),
                        "date":createdAt
                    },


                    // "form":{
                    //     "data":image,
                    //     "view":"//opstools/FCFActivities/views/FCFActivities/imageApproval.ejs",
                    //     "viewData":{
                    //         "taggedPeople":listTeammatesTagged
                    //         // "objectives":objectives
                    //     }
                    // },


                    "relatedInfo":{
                        "viewData":{
                            "user":{
                                "displayName":creator.displayName(),
                                "avatar":creator.avatar,
                                "teams":ministryTeams
                            },
                            "createdAt":createdAt,
                        }
                    },

                    "callback":options.callback,

                    "permission":{
                        actionKey:options.permissionKey,
                        userID: creatorGUID
                    }

                };

                dfd.resolve(request);

            });

            return dfd;

        }
    }
}
