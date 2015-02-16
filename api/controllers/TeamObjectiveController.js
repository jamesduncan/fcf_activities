/**
 * TeamObjectiveController
 *
 * @description :: Server-side logic for managing Userteams
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var AD = require('ad-utils');

module.exports = {
	

    _config: {}

    // Return the list of Activities for a given Ministry
    , find:function(req, res) {


        var FinalData = [];
        var listObjectives = null;


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



        async.series([

            // get the user's Person Entry
            function(next) {

                FCFObjective.find({IDMinistry:minId})
                .fail(function(err){
                    next(err);
                })
                .then(function(data){

                    listObjectives = data;
                    next();
                })
            },


            // Flatten this out to our essential data:
            function(next) {
                listObjectives.forEach(function(objective){

                    var obj = {};
                    obj.id = objective.IDObjective;
                    obj.description = objective.description(langCode);

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

