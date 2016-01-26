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


    });


        // create a listner for when our Image entries are approved
    ADCore.queue.subscribe('fcf.activities.image', function(message, data){

    	// data.status    : {string}  'approved'  or 'rejected'
    	// data.data      : {obj} any updated values from the ProcessApproval form
    	// data.reference : {obj} the reference info we sent


AD.log('FCF Image Approval Result:', data);


    });


};