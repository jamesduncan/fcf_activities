var path = require('path');
// var $ = require('jquery-deferred');
var AD = require('ad-utils');
var fs = require('fs');
var _  = require('lodash');  // * until Sails upgrades to lodash v3.x +



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
                          "context":"opstool-FCFActivities"
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
    },



    icons:{
        activity:'fa-file-image-o',
        image:'fa-photo'
    },


    translations: {

        base:function(options) {

            // options.actionKey    : permissions action.key
            // options.userID       : GUID of action creator
            // options.callback     : message queue callback key
            // options.reference    : (json) object to return to us to find our current activity.


            // options.modelKey     : (string) the sails model key
            // options.modelCond    : (json) obj filter to pull the tranlsations

            // options.toLang       : (string) the language_code to translate into.

            // options.icon         : (string) icon .class reference
            // options.labelKey     : (string) the multilingual key for the label

            // options.fromLanguage : (string) language_code of the from language
            // options.toLanguage   : (string) language_code of the to language

            // options.fields       : (obj) object for 
            // options.labels       : (obj) object for displaying the labels the above fields

            // options.view         : (string) the url to any view to display
            // options.viewData     : (obj) any data to send to the view.


            // options.person       : (int) the IDPerson of the person creating the object.
            // options.object       : (model instance) the multilingual model being translated
            // options.objectFieldRef : (optional) (string) one of the fields so we can check the sourceLanguage
            // options.fieldNames   : (array) of field names to translate
            // options.fieldsToLabelKeys: (json) obj hash 'fieldName' : 'multilingual label key'


            var dfd = AD.sal.Deferred();

            var allLanguages = null;
            var sourceLang = null;
// AD.log('... FCFActivities.translations.base():');


            options.objectFieldRef = options.objectFieldRef  || options.fieldNames[0];  // just use the 1st one

            async.parallel([

                // need to resove createdBy into a GUID & store as userID
                function(done) {

                    GUID2Person.find({ person:options.person })
                    .exec(function(err, lookup){
                        if (err) {
                            var myErr = new Error('Error looking up person.guid');
                            myErr.error = err;
                            myErr.data = { 
                                person:options.person,
                                model:model
                             };

                            done(myErr);

                        } else {
// AD.log('... lookup:', lookup);
                            options.userID = lookup[0].guid;
// AD.log('... guidFound:', request.userID);
                            done();
                        }
                    });

                },


                // determine sourceLanguage and store as .fromLanguage
                function(done){

                    // this should be the language without a [language_code] tag in it.
                    options.object.translations.forEach(function(trans){
                        var tag = '['+trans.language_code+']';
                        if (trans[options.objectFieldRef].indexOf(tag) != 0) {  // we skip instances where [en] is at pos 0

                            // found it
                            sourceLang = trans.language_code;
                            options.fromLanguage = sourceLang;
                        }

                    });

                    if (sourceLang == null) {
                        var myError = new Error('Error determining which translation was the source.');
                        ADCore.error.log('Error determining which translation was the source.', { err: myError, translations: options.object.translations });
                        done(myError);
                    } else {
// AD.log('... sourceLang:'+ sourceLang);
                        done();
                    }
                    
                },

                // compile fields
                function(done) {
                    /*
                        {
                            "caption": {
                                "languageCode": "translation",
                                "en": "my english translation 1",
                                "ko": "[ko]my english translation 1",
                                "zh-hans": "[zh-hans]my english translation 1",
                                "th": "[th]my english translation 1"
                            },
                            "description": {
                                "languageCode": "translation",
                                "en": "my english translation 1",
                                "ko": "[ko]my english translation 1",
                                "zh-hans": "[zh-hans]my english translation 1",
                                "th": "[th]my english translation 1"
                            }
                        }
                    */
                    var fields = {};
                    

                    options.fieldNames.forEach(function(key) {
                        fields[key] = {};
                        options.object.translations.forEach(function(trans){
                            fields[key][trans.language_code] = trans[key];
                        })
                    })

                    options.fields = fields;
// AD.log('... request.fields:', request.fields);
                    done();
                },


                // compile labels
                function(done) {
                    /*
                        "caption": {
                            "en": "Caption",
                            "ko": "표제",
                            "zh-hans": "标题",
                            "th": "คำอธิบาย"
                        },
                        "description": {
                            "en": "Description",
                            "ko": "기술",
                            "zh-hans": "描述",
                            "th": "รายละเอียด"
                        }
                    */

                    var labels = {};

                    var numDone = 0;
                    options.fieldNames.forEach(function(key){
                        labels[key] = {};
                        var cond = {label_key:options.fieldsToLabelKeys[key], label_context:'opstool-FCFActivities' };
                        SiteMultilingualLabel.find(cond)
                        .then(function(list){
                            list.forEach(function(label){
                                labels[key][label.language_code] = label.label_label
                            })

                            numDone ++;
                            if (numDone >= options.fieldNames.length) {

                                options.labels = labels;
// AD.log('... request.labels:', request.labels);
                                done();
                            }
                        })
                        // .catch(function(err){

                        //     ADCore.error.log('Failed to lookup SiteMultilingualLabels', { error: err, cond:cond });
                        //     done(err);
                        // })
                    })

                },


                // get all the Languages in the system:
                function(done){

                    Multilingual.languages.all()
                    .then(function(list){

                        allLanguages = {};
                        if ((list) && (list.length>0)) {
                            list.forEach(function(lang){
                                allLanguages[lang.language_code] = lang.language_label;
                            })
// AD.log('... allLanguages:', allLanguages);
                            done(); 
                        } else {

                            var err = new Error('Can\'t pull a valid list of Multilingual.languages!');
                            ADCore.error.log('FCFActivities.translation.base(): problem getting language from system.', { error: err, list:list });
                            done(err);
                        }

                    })
                    .fail(function(err){
                        ADCore.error.log('Error looking up Multilingual.languages.all():',{ error: err });
                        done(err);
                    })
                }


                // 

            ], function(err, results){

// AD.log('... base.final:', err, results);
                if (err) {
                    dfd.reject(err);
                    return;
                }


                // now compile Translation Request
                var request = {

                    "actionKey": options.actionKey,
                    "userID": options.userID,
                    "callback": options.callback,
                    "reference": options.reference,
            
                    "model": options.modelKey,
                    "modelCond": options.modelCond,

                    // "toLanguageCode": options.toLanguage,

                    "menu": {
                        "icon": options.icon,
                        "action": {
                            "key": options.labelKey,
                            "context": "opstool-FCFActivities"
                        },
                        "fromLanguage": allLanguages[options.fromLanguage],
                        // "toLanguage": allLanguages[options.toLanguage]
                    },
                    "form": {
                        "data": {
                            "fields": options.fields,
                            "labels": options.labels,
                            "optionalInfo": options.viewData
                        },
                        "view": options.view
                    }
                }

// AD.log('... .base() preparing to send translation requests:');
// AD.log('... options.object:', options.object);
                // for each language in system
                options.object.translations.forEach(function(trans){
// AD.log('... trans:', trans);
// AD.log('... sourceLang:'+sourceLang+ '  language_code:'+trans.language_code);

                    // if not sourceLang
                    if (trans.language_code != sourceLang) {
// AD.log('    ---> generating request!');
                        // generate a request for this as toLanguage
                        var currReq = _.cloneDeep(request);
                        currReq.toLanguageCode = trans.language_code;
                        currReq.menu.toLanguage = allLanguages[trans.language_code]
    // console.log('... Translation Request:', currReq);
                        ADCore.queue.publish('opsportal.translation.create', currReq);
                        
                    } // end if

                }) // next

                
                dfd.resolve();

// console.log('... Translation.base():  request:', request);


            });




            // format:
            /*

        {

            "actionKey": "translation.tool.view",
            "userID": "user.1",


            "callback": "return.message.queue.1",
            "reference": {
                id:X
            },
    
            "model": "sailsModelNameTrans",
            "modelCond": {
                "tableForeignKeyField": 4
            },

            "toLanguageCode": "ko",

            "menu": {
                "icon": "fa-photo",
                "action": {
                    "key": "Activity One",
                    "context": "application.context"
                },
                "fromLanguage": "English",
                "toLanguage": "Korean"
            },
            "form": {
                "data": {
                    "fields": {
                        "caption": {
                            "languageCode": "translation",
                            "en": "my english translation 1",
                            "ko": "[ko]my english translation 1",
                            "zh-hans": "[zh-hans]my english translation 1",
                            "th": "[th]my english translation 1"
                        },
                        "description": {
                            "languageCode": "translation",
                            "en": "my english translation 1",
                            "ko": "[ko]my english translation 1",
                            "zh-hans": "[zh-hans]my english translation 1",
                            "th": "[th]my english translation 1"
                        }
                    },
                    "labels": {
                        "caption": {
                            "en": "Caption",
                            "ko": "표제",
                            "zh-hans": "标题",
                            "th": "คำอธิบาย"
                        },
                        "description": {
                            "en": "Description",
                            "ko": "기술",
                            "zh-hans": "描述",
                            "th": "รายละเอียด"
                        }
                    },
                    "optionalInfo": {
                        "image": "/opstools/ProcessTranslation/views/testImage.jpg"
                    }
                },
                "view": "/opstools/ProcessTranslation/views/testActivity.ejs"
            }
        }
            */



            return dfd;
        },


        activity:function(activity) {
// AD.log('... FCFActivities.translations.activity()');


            // options.actionKey    : permissions action.key
            // options.userID       : GUID of action creator
            // options.callback     : message queue callback key
            // options.reference    : (json) object to return to us to find our current activity.

            // options.modelKey     : (string) the sails TRANSLATION model key
            // options.modelCond    : (json) obj filter to pull the tranlsations

            // options.icon         : (string) icon .class reference
            // options.labelKey     : (string) the multilingual key for the label

            // options.fromLanguage : (string) language_code of the from language
            // options.toLanguage   : (string) language_code of the to language

            // options.fields       : (obj) object for 
            // options.labels       : (obj) object for displaying the labels the above fields

            // options.view         : (string) the url to any view to display
            // options.viewData     : (obj) any data to send to the view.

            // options.person       : (int) the IDPerson of the person creating the object.
            // options.object       : (model instance) the multilingual model being translated
            // options.objectFieldRef : (string) one of the fields so we can check the sourceLanguage
            // options.fieldNames   : (array) of field names to translate
            // options.fieldsToLabelKeys: (json) obj hash 'fieldName' : 'multilingual label key'

            var request = {
                actionKey : 'fcf.activities.translate',
                callback : 'fcf.activities.translated',
                reference:{
                    id:activity.id
                },

                modelKey : 'fcfactivitytrans',  // sails TRANS model reference
                modelCond: {
                    fcfactivity: activity.id
                },

                icon:FCFActivities.icons.activity,
                labelKey:'fcf.activity.activity',

                view:'',
                viewData:{},

                person:activity.createdBy,

                object:activity,
                // objectFieldRef: 'activity_name',     // (string) field to check for sourceLange
                fieldNames:['activity_name', 'activity_name_govt','activity_description', 'activity_description_govt' ],
//// TODO: just pull fieldNames from Multilingual.model.util.getTransFields(activity);
////       and put that in the FCFActivities.translations.base() section.
                fieldsToLabelKeys : {
                    'activity_name' : 'fcf.assignment.Choose.ActivityName',
                    'activity_description' : 'fcf.assignment.Choose.Description',
                    'activity_name_govt' : 'fcf.assignment.Choose.ActivityName_govt',
                    'activity_description_govt' : 'fcf.assignment.Choose.Description_govt'
                }
            };

            // make sure person is an .id value, not an object:
            if (typeof request.person == 'object') {
                request.person = request.person.IDPerson;
            }


            return FCFActivities.translations.base(request);

        },


        image:function(image) {
// AD.log('... FCFActivities.translations.activity()');


            // options.actionKey    : permissions action.key
            // options.userID       : GUID of action creator
            // options.callback     : message queue callback key
            // options.reference    : (json) object to return to us to find our current activity.

            // options.modelKey     : (string) the sails TRANSLATION model key
            // options.modelCond    : (json) obj filter to pull the tranlsations

            // options.icon         : (string) icon .class reference
            // options.labelKey     : (string) the multilingual key for the label

            // options.fromLanguage : (string) language_code of the from language
            // options.toLanguage   : (string) language_code of the to language

            // options.fields       : (obj) object for 
            // options.labels       : (obj) object for displaying the labels the above fields

            // options.view         : (string) the url to any view to display
            // options.viewData     : (obj) any data to send to the view.

            // options.person       : (int) the IDPerson of the person creating the object.
            // options.object       : (model instance) the multilingual model being translated
            // options.objectFieldRef : (string) one of the fields so we can check the sourceLanguage
            // options.fieldNames   : (array) of field names to translate
            // options.fieldsToLabelKeys: (json) obj hash 'fieldName' : 'multilingual label key'

            var request = {
                actionKey : 'fcf.activities.translate',
                callback : 'fcf.activities.image.translated',
                reference:{
                    id:image.id
                },

                modelKey : 'fcfactivityimagestrans',  // sails TRANS model reference
                modelCond: {
                    fcfactivityimages: image.id
                },

                icon:FCFActivities.icons.image,
                labelKey:'fcf.activityapproval.newImage',

                view:'/opstools/FCFActivities/views/FCFActivities/imageTranslation.ejs',
                viewData:{ image: FCFCore.paths.forURL(FCFCore.paths.images.activities(image.image)) },

                person:image.uploadedBy,

                object:image,
                // objectFieldRef: 'activity_name',     // (string) field to check for sourceLange
                fieldNames:['caption', 'caption_govt' ],
//// TODO: just pull fieldNames from Multilingual.model.util.getTransFields(activity);
////       and put that in the FCFActivities.translations.base() section.
                fieldsToLabelKeys : {
                    'caption' : 'fcf.imageapproval.caption',
                    'caption_govt' : 'fcf.imageapproval.caption_govt'
                }
            };

            // make sure person is an .id value, not an object:
            if (typeof request.person == 'object') {
                request.person = request.person.IDPerson;
            }


            return FCFActivities.translations.base(request);

        }
    }
}
