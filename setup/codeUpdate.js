var path = require('path');
var AD = require('ad-utils');

var sails,
    cwd;



AD.test.sails.lift({
    models:{
        connection:'test',
        migrate:'drop'
    }
})
.fail(function(err){
    AD.log.error(err);
    process.exit(1);
})
.then(function(server) {

  sails = server;


    async.series([

        // make sure these ministries have objectives assigned
        function(next) {

            var ministries = [82, 13, 43, 70, 71, 72];
            var numDone = 0;

            ministries.forEach(function(ministryID) {

                checkMinistry(ministryID, function(err){

                    // exit immediatly on error
                    if (err) {
                        next(err);
                    } else {

                        // wait for all ministries to be done before continuing on
                        numDone++;
                        if (numDone >= ministries.length) {
                            next();
                        }
                    }
                })

            })
        }

    ],function(err, results){

        sails.lower(function() {

            if (err) {
                AD.log.error(err);
                process.exit(1);
            } else {
                process.exit(0);
            }
        });
    })


      
});



function checkMinistry (id, cb) {

    var ProjectID = null;
    var foundObjectives = [];
    var projectObjectives = [];
    async.series([

        // find the Project ID
        function(next) {
            FCFMinistry.findOne(id)
            .then(function(ministry){
                ProjectID = ministry.IDProject;
                next();
            })
            .catch(function(err){
                next(err);
            })
        },

        // lookup all objectives for this ministry
        function(next) {
            FCFObjective.find({ IDProject: ProjectID, IDMinistry:id })
            .then(function(objectives){
                foundObjectives = objectives;
                next();
            })
            .catch(function(err){
                next(err);
            })
        },

        // if no objectives, then find all objectives for Project
        function(next){
            if (foundObjectives.length > 0) {
                console.log('... Ministry['+ id+'] already had objectives associated.');
                next();
            } else {

                FCFObjective.find({ IDProject: ProjectID, IDMinistry:null })
                .exec(function(err, objectives) {
                    if (err) {
                        next(err);
                    } else {
                        projectObjectives = objectives;
                        next();
                    }
                })

            }
        },

        // create new entries with this ministry ID set:
        function(next) {
            if (foundObjectives.length > 0) {
                next();
            } else {

                console.log('... Ministry['+ id+'] will get '+projectObjectives.length+' spiffy new objectives');

                var numDone = 0;
                projectObjectives.forEach(function(objective){

                    var data = objective.toJSON();
                    delete data.IDObjective;
                    data.IDMinistry = id;
                    FCFObjective.create(data)
                    .exec(function(err, newObjective) {

                        if (err) {
                            next(err);
                        } else {

                            numDone++;
                            if (numDone >= projectObjectives.length) {
                                next();
                            }
                        }
                    })

                })

            }
        }

    ],function(err, results) {

        cb(err);
    });


}