/**
 * Bootstrap
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#documentation
 */
var path = require('path');
var AD = require('ad-utils');
module.exports = function (cb) {

    AD.module.permissions(path.join(__dirname, '..', 'setup', 'permissions'), cb);
    // cb(err);   // in case of an unrecoverable error


    // create a listner for when our Activity entries are approved
    ADCore.queue.subscribe('fcf.activities.activity', function(message, data){

    	// data.status    : {string}  'approved'  or 'rejected'
    	// data.data      : {obj} any updated values from the ProcessApproval form
    	// data.reference : {obj} the reference info we sent


AD.log('FCF Activity Approval Result:', data);

        // if activity is approved, then pass this on to the Translation Request tool.
        if (data.status == 'approved') {
// AD.log('... setting approved:');

            var updatedValues = JSON.parse(data.data);
            if (updatedValues) {
                FCFActivity.findOne(data.reference.id)
                .populate('objectives')
                .populate('translations')
                .then(function(activity){

//// LEFT OFF HERE:  update entry with values returned.
console.log();
console.log('----------------------');
console.log('... updatedValues:', updatedValues);

console.log();
console.log('... activity:', activity);
console.log();

                    async.series([

                        // update all the activity values
                        function(done) {

                            // update base fields
                            var fields = modelAttributes({model:activity}); // get the base fields for model
                            var dates = modelAttributes({model:activity, type:'date'}); 

        // console.log('... fields1:', fields);
                            fields = _.difference(fields, ['id', 'createdAt', 'updatedAt']); // remove these fields:
                            fields = _.difference(fields, dates);
        // console.log('... fields:', fields);
                            fields.forEach(function(f){
                                if (typeof updatedValues[f] != 'undefined') {
        // console.log('    .... f:activity.'+f+':', updatedValues[f]);
                                    activity[f] = updatedValues[f];
                                }
                                
                            })

                            
                            // update the dates
                            dates.forEach(function(date){
                                activity[date] = AD.util.moment(new Date(updatedValues[date])).format('YYYY-MM-DD')+'';
                            })


                            // find each of our collections:  hasMany relationships
                            var collections = modelCollections({model:activity});
                            collections.forEach(function(field){
        // console.log('... collection:', field);

                                // if we've been given updatedValues
                                if (updatedValues[field]) {
console.log('... updatedValues['+field+']:', updatedValues[field]);

                                    //// convert current values into an array of IDs
                                    var currentValues = activity[field];
                                    var currentIDs = [];
                                    currentValues.forEach(function(cv){
        // console.log('... cv:', cv);
                                        if (typeof cv == 'string') {
                                            currentIDs.push( parseInt(cv) );
                                        } else {
                                            if (cv.IDObjective) {
                                                currentIDs.push( cv.IDObjective );
                                            }
                                        }
                                    })


                                    //// convert the updatedValues to an array of IDs:
                                    var newIDs = [];
                                    if ( !_.isArray( updatedValues[field] ) ){
                                        updatedValues[field] = [ updatedValues[field] ];
                                    }
                                    updatedValues[field].forEach(function(nv){
                                        if (typeof nv == 'string') {
                                            newIDs.push( parseInt(nv) );
                                        } else if(typeof nv == 'object') {
                                            if (cv.IDObjective) {
                                                newIDs.push( cv.IDObjective );
                                            }
                                        } else {
                                            // must just be integers:
                                            newIDs.push(cv);
                                        }
                                    });

                                    var idsToAdd = _.difference(newIDs, currentIDs);
                                    var idsToRemove = _.difference(currentIDs, newIDs);
// console.log('... currentIDs:', currentIDs);
// console.log('... newIDs:', newIDs);
// console.log('... idsToAdd:', idsToAdd);
// console.log('... idsToRemove:', idsToRemove);

                                    idsToAdd.forEach(function(id){
                                        activity[field].add(id);
                                    })

                                    idsToRemove.forEach(function(id){
                                        activity[field].remove(id);
                                    })

                                }
                            });

                        // final save and then call to Trans
console.log('     B4 .save():', activity);

                            activity.save()
                            .then(function(updatedActivity){
console.log('         .... updatedActivity:', updatedActivity);
                                activity = updatedActivity;
                                done();
                            });

                        },


                        // update the multilingual entry
                        function(done) {

                            var multilingualFields = modelMultilingualFields({model:activity});
console.log('... multilingual:', multilingualFields);
                            if (updatedValues.language_code) {
console.log('... multilingual label to update:');
console.log('    .... all translations:', activity.translations);
                                var trans = null;
                                activity.translations.forEach(function(t){
                                    if (t.language_code == updatedValues.language_code) {
                                        trans = t;
                                    }
                                })
                                if (trans) {
console.log('   ... found translation:', trans);

                                    var transModel = modelTransModel({model:activity});
                                    transModel.findOne(trans.id)
                                    .then(function(transEntry){

                                        multilingualFields.forEach(function(field){
                                            if (typeof updatedValues[field] != 'undefined') {
                                                transEntry[field] = updatedValues[field];
                                            }
                                        });

                                        transEntry.save()
                                        .then(function(updatedTrans){

                                            done();
                                        })
                                        .catch(function(err){

                                            ADCore.error.log('Error updating translation entry:', {
                                                transEntry:transEntry,
                                                error:err
                                            })
                                            done(err);
                                        })


                                    })

                                } else {

                                    // no matching translation for given language_code
                                    ADCore.error.log('No matching translation for given language_code', {
                                        updatedValue:updatedValues,
                                        activity:activity
                                    });
                                    done();
                                    
                                }

                            } else {

                                // nothing to translate
                                done();
                            }

                        }


                    ], function(err, results) {


                        FCFCommonApprovalHandler ({
                            Model:      FCFActivity,
                            id:         data.reference.id,
                            pops:       [ "objectives", "translations" ],
                            transType:  "activity",
                            // sourceLang: updatedValues.language_code || Multilingual.languages.default()
                        });
                   

                    })


//// LEFT OFF HERE:
////  - migrate logic to Multilingual.model.sync() 


                    // Multilingual.model.sync({
                    //     model:activity,
                    //     data:updatedValues
                    // })
                    // .fail(function(err){

                    // })
                    // .done(function(updatedActivity){

                    //     FCFCommonApprovalHandler ({
                    //         Model:      FCFActivity,
                    //         id:         data.reference.id,
                    //         pops:       [ "objectives", "translations" ],
                    //         transType:  "activity",
                    //         // sourceLang: updatedValues.language_code || Multilingual.languages.default()
                    //     });

                    // })


                })

            } else {

                // no values to update, so just pass along call to translations:
                FCFCommonApprovalHandler ({
                    Model:      FCFActivity,
                    id:         data.reference.id,
                    pops:       [ "objectives", "translations" ],
                    transType:  "activity"
                });    
            }


        } else {

// AD.log('... not approved?  ', data);
        }


    });


    // create a listner for when our Image entries are approved
    ADCore.queue.subscribe('fcf.activities.image', function(message, data){

    	// data.status    : {string}  'approved'  or 'rejected'
    	// data.data      : {obj} any updated values from the ProcessApproval form
    	// data.reference : {obj} the reference info we sent


AD.log('FCF Image Approval Result:', data);

        // if activity is approved, then pass this on to the Translation Request tool.
        if (data.status == 'approved') {
// AD.log('... setting approved:');

            FCFCommonApprovalHandler ({
                Model:      FCFActivityImages,
                id:         data.reference.id,
                pops:       [ "uploadedBy", "translations" ],
                transType:  "image"
            });

        } else {
            
// AD.log('... not approved?  ', data);
        }
    });



    // create a listner for when our Activities are translated
    ADCore.queue.subscribe('fcf.activities.translated', function(message, data){

        // data.reference
        // data.language_code   // toLanguage
        // data.fields : {  fieldName: 'translation ', fieldName2:'translation2'}     


        // if data.reference is a string:
        if ( typeof data.reference == 'string') {
            data.reference = JSON.parse(data.reference);
        }

        FCFCommonTranslationHandler({
            Model: FCFActivity,
            id: data.reference.id, 
            fields:    data.fields,
            language_code:  data.language_code,
            fieldName: 'activity_name' 
        });
// AD.log('... FCF Activity Translated:', data);

    });


    // create a listner for when our Images are translated
    ADCore.queue.subscribe('fcf.activities.image.translated', function(message, data){

        // data.reference
        // data.language_code   // toLanguage
        // data.fields : {  fieldName: 'translation ', fieldName2:'translation2'}     


        // if data.reference is a string:
        if ( typeof data.reference == 'string') {
            data.reference = JSON.parse(data.reference);
        }

        FCFCommonTranslationHandler({
            Model: FCFActivityImages,
            id: data.reference.id, 
            fields:    data.fields,
            language_code:  data.language_code,
            fieldName: 'caption' 
        });
// AD.log('... FCF Activity Translated:', data);

    });


};


function FCFCommonApprovalHandler (options) {
    var Model     = options.Model;
    var id        = options.id;
    var pops      = options.populations || [];
    var transType = options.transType;


    // find the model
    var def = Model.findOne(id);

    // populate all the necessary fields
    pops.forEach(function(key){
        def.populate(key);
    });

    def.then(function(model){

        if (model) {
// AD.log('... found it');
            // set status to 'approved'
            model.status = 'approved';
            model.save()
            .then(function(updatedModel){
// AD.log('... updatedActivity:', updatedActivity);
                // Now send this off to be translated:
                FCFActivities.translations[transType](updatedModel);

            })
        } else {

// should let someone know about this error!
            ADCore.error.log('Error looking up FCFActivity:',{ id: data.reference.id });

        }
    })
}


function FCFCommonTranslationHandler (options) {

    var Model = options.Model;
    var id = options.id;
    var fields = options.fields;
    var language_code = options.language_code;
    var fieldName = options.fieldName;

// get the indicated activity
    Model.findOne(id)
    .populate('translations')
    .then(function(model){
// AD.log('... activity:', activity);
        var allDone = true;

        // update the provided translation:
        model.translations.forEach(function(trans){
// AD.log('    ... trans:', trans);

            // update current one if it is the one given.
            if (trans.language_code == language_code) {
                _.forOwn(fields, function(value, key){
// AD.log('    ... trans key:'+key+'  value:'+value);
                    trans[key] = value;
                });
// AD.log('   ... updatedTrans:', trans);
                trans.save();
            }

            // if current one has our language marker, then we 
            // are not allDone:
            var tag = '['+trans.language_code+']';
            if (trans[fieldName].indexOf(tag) == 0) {
                allDone = false;
            }
        })


        // if all translations have been updated
        if (allDone) {

            // mark this activity as 'ready'
            model.status = 'ready';  // 'translated' : if there is going to be another step.
            model.save();
        }

    })
    .catch(function(err){
        ADCore.error.log('FCFActivities: Can\'t lookup Model from provided reference:', { error:err, reference:data.reference, note:'this is a catch, so it might be catching another error from somewhere else!' });
    })
}


function modelAttributes (options) {
    var model = options.model;
    var Model = options.Model || model._Klass();
    options.type = options.type || 'all';

    var attributes = Model.attributes;

    var fields = [];
    _.forOwn(attributes, function(value, key){
        if (value.type) {

            if ((options.type == 'all') || (value.type == options.type)) {
// console.log('   :modelAttributes(): value.type:'+value.type+" options.type:"+options.type);
                fields.push(key);
            }
        }
    })

    return fields;

}


function modelCollections (options) {
    var model = options.model;
    var Model = options.Model || model._Klass();

    var attributes = Model.attributes;

    var fields = [];
    _.forOwn(attributes, function(value, key){
        if (value.collection) {
            fields.push(key);
        }
    })

    return fields;

}


function modelMultilingualFields (options) {
    var fields = [];

    var model = options.model;
    var Model = options.Model || model._Klass();

    var ModelTrans = modelTransModel(options);

    if (ModelTrans) {


        var attributes = ModelTrans.attributes;

        var ignoreFields = ['id', 'createdAt', 'updatedAt' ];
        ignoreFields.push(Model.attributes.translations.via);

        
        _.forOwn(attributes, function(value, key){

            if (ignoreFields.indexOf(key) == -1) {
                fields.push(key);
            }
        })
    }

    return fields;
}


function modelTransModel(options){
    var model = options.model;
    var Model = options.Model || model._Klass();

    if (Model._attributes.translations) {

        var transKey = Model._attributes.translations.collection.toLowerCase();
        return sails.models[transKey];
    }
console.log('....  ??? no translations:', Model);
    
    // if we get here then this model doesn't have a translation Model:
    return null;
};