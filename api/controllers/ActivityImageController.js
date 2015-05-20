/**
 * FCFActivityImageController
 *
 * @description :: Server-side logic for managing Fcfactivityimages
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var AD = require('ad-utils');
var path = require('path');
var fs = require('fs');

module.exports = {


	// get /fcf_activities/activityimage?[filterCondition]
	find:function(req, res) {

AD.log('-----------------');
AD.log('params:', req.params);
AD.log('body:', req.body);
AD.log('query:', req.query);

		var filter = req.query;


//// TODO: filter off additional params: 
    // "_cas_retry": "23708552",
    // "ticket": "ST-31676-WKdNW3YZMJeDxNOBBcla-cas"
    	if(filter.ticket) delete filter.ticket;
    	if(filter._cas_retry) delete filter._cas_retry;


		// what is the current language_code of the User
        var langCode = ADCore.user.current(req).getLanguageCode();

		FCFActivityImages.find(filter)
		.populate('translations')
		.populate('uploadedBy')
		.populate('taggedPeople')
		.then(function(list){

			var simpleList = FCFActivityImages.toClientList(list, langCode);
			ADCore.comm.success(res,simpleList);
		})
		.catch(function(err){

			ADCore.comm.error(res, err);

			err._model = 'FCFActivityImages';
			err._filter = filter;
			err._langCode = langCode;
			AD.log.error('<bold>error:</bold> error looking up FCFActivityImages', err);

		});

	},


	// get /fcf_activities/activityimage/:id?[filter]
	// normal:  get /fcf_activities/activityimage/:id
	// optional: get /fcf_activities/activityimage/?param=X
	// 
	findOne:function(req, res) {

		var id = req.param('id');

		var filter = req.query;
		if (id) filter.id = id;


		FCFActivityImages.findOne(filter)
		.populate('traslations')
		.populate('uploadedBy')
		.populate('taggedPeople')
		.then(function(image){
			image.translate(langCode);
			ADCore.comm.success(res, image.toClient() );
		})
		.catch(function(err){
			ADCore.comm.error(res, err);
			err._model = 'FCFActivityImages';
			err._id = id;
		});

	},

	create:function(req, res) {

		var fields = ['image', 'activity', 'date', 'caption' ];
		var tags = req.param('taggedPeople');

		var values = {};
		fields.forEach(function(f){
			values[f] = req.param(f);

			if (!values[f]) {
				var err = new Error('Missing required field:'+f);
				ADCore.comm.error(res, err, 400);
				return;
			}
		})

		var newImage = null;
		var finalData = null;


		async.series([

			// 1) figure out who is doing this:
			function(next) {

                FCFCore.personForSession(req)
                .fail(function(err){
                    next(err);
                })
                .then(function(person){
                    values.uploadedBy = person.IDPerson;
                    next();
                })
            },


            // 2) perform a Multilingual.create() on this one:
			function(next) {


				AD.log('... creating ML entry for Activity Image:', values);

				// Save Image entry
				Multilingual.model.create({ model:FCFActivityImages, data: values })
				.then(function(image) {

					AD.log('... Multilingual.model.created() : ', image);

					newImage = image;
					next();

				})
				.fail(function(err){

					AD.log('   --- error creating ML data:', err);
					next(err);
					
				})


			},


			// 3) relocate the temp image to a proper ActivityImage:
			function(next) {

				// now we have our image id, so:

				if (!newImage) {
					AD.log.error('error: somehow we lost track of our new image!!!');
					next(new Error('No New Image!'));
				} else {


					// relocate the image to actual filesystem location
					// Naming Convention:  [Activity.id]_[Image.id]_[uuid].ext
					// var newName = [values.activity, '_', newImage.id, '_', values.image].join('');
					// 
					// NOTE: .toSavedFileName() will internally update the .image to the new name
					//       but the instance isn't saved yet.
					//		 This FCFCore....tempToActivity() has a chance to fail and if it does we
					//		 don't .save() that name change.
					//       else we will .save() the image in the next step.
					var newName = newImage.toSavedFileName(values.image);
					FCFCore.files.images.tempToActivity(values.image, newName)
					.fail(function(err){

						AD.log.error('error: can\'t move file: ['+values.image+'] -> ['+newName+']');
						// remove this entry!
						newImage.destroy();
						next(err);
						
					})
					.then(function(){

						AD.log('... temp file moved: ['+values.image+'] -> ['+newName+']');
						next();

					})

				}
				
			},


			// 4) update tags for this newImage
			function(next) {

				// relocation successful -> now update name and add tags
				// newImage.image = newName;

				if (tags) {
					tags.forEach(function(tag){
						newImage.taggedPeople.add(tag)
					})
				}

				newImage.save()
				.then(function(data){

					AD.log('... newImage.save() : data:', data);
					finalData = data.toClient();
					next();

				})
				.catch(function(err){
					AD.log.error('error: can\'t .save() chages to ActivityImage', err);
					newImage.destroy();
					next(err);
				});

			},


			// 5) if this is the 1st image for an Activity, then use this image name
			//    for the Activity.defaultImage
			function(next) {

				FCFActivity.findOne({ id: newImage.activity})
				.then(function(activity){

					if (!activity.default_image) {

						activity.default_image = newImage.image;
						activity.save()
						.then(function(data) {
							AD.log('... activity.default_image = '+data.default_image);
							finalData.default_image = finalData.image; // --> should already be converted to proper path
							next();
						})
						.catch(function(err){
							AD.log.error('error: updating activity.default_image: activity.save() failed: ', err);
							next(err);
						})
					} else {
						finalData.default_image = false;  // <-- no update happened.
						next();
					}
				})
				.catch(function(err){
					AD.log.error('error: can\'t FCFActivity.findOne() id:'+newImage.activity+' ', err);
					next(err);
				})

			}
			

		], function(err, results) {

			if (err) {
				ADCore.comm.error(res, err);
			} else {
				AD.log('... returning data to client:', finalData);
				ADCore.comm.success(res, finalData );
			}

		});

	},

	update:function(req, res) {

		// what is the current language_code of the User
        var langCode = ADCore.user.current(req).getLanguageCode();

		var tags = req.param('taggedPeople');

		var origImage = null;       // {string} name of original image
		var currImage = null;
		var updatedImage = null;

		var isImageSwap = false;	// are they swapping out an image?

		var finalData = null;		// this is what we will send back

		var id = req.param('id');
		if (!id) {

			AD.comm.error(res, new Error('no id provided'));
			return;
		}

		async.series([

			// 1) get the current Image instance
			function(next) {

				FCFActivityImages.findOne({ id:id })
				.populate('translations')
				.populate('uploadedBy')
				.populate('taggedPeople')
				.then(function( image ) {

					currImage = image;
					currImage.translate(langCode)
					.fail(function(err){
						AD.log.error('... failed translating into lang['+langCode+']');
						next(err);
					})
					.then(function(){
						next();
					})

				})
				.catch(function(err){
					next(err);
				})

			},



			// 2) check for updated image reference and remove old image
			function(next) {
				var newImage = req.param('image');

				// remove any provide path section
				newImage = newImage.split('/').pop(); 

				if (typeof newImage == 'undefined') {

					// no image data was submitted, so move along
					next();

				} else {

					// there is image data sent

					origImage = currImage.image;  // track our original image name

					// if they are the same
					if (currImage.image == newImage) {

						// AD.log('... image reference unchanged.');
						// nope, they are the same.
						// move along
						next();
						
					} else {

						AD.log('... looks like an imageSwap!');
						// we must be replacing the image
						// mark that we are doing an imageSwap:
						isImageSwap = true;

						next();
					}
				} 

			},

			// 3.1) Image Swap:  remove current image
			function(next) {

				// if we are not swapping images, then continue
				if (!isImageSwap) {

					next();

				} else {
					AD.log('... removing original image ['+ FCFCore.paths.images.activities(currImage.image) + ']' );
					fs.unlink(FCFCore.paths.images.activities(currImage.image), function(err){

						// ok so what if there was an error?
						next();
					})

				}
			},

			// 3.2) Now move the new file to the right location
			function(next) {


				if (!isImageSwap) {
					next();
				} else {


					var newImage = req.param('image');

					// is this a temp file name?  (ie no '_')
					if (newImage.indexOf('_') != -1) {

						// this looks like a converted file already.
						next();

					} else {


						// NOTE: this will also save the new image value to currImage
						var newName = currImage.toSavedFileName(newImage);

						AD.log('... swapping image: temp image:'+newImage);
						AD.log('... swapping image: new image :'+newName);

						FCFCore.files.images.tempToActivity(newImage, newName)
						.fail(function(err){

							AD.log('   ---> failed:', err);
							// failed transaction!
							next(err);
	
						})
						.then(function(){

							// ok, file moved so go next:
							next();
						});
					}
				}

			},

			// 4) Did they change the activity for this image?
			function(next) {

				var newActivity = req.param('activity');
				if (newActivity == currImage.activity) {
					// no change
					next();
				} else {

					// move photo to proper new name
					AD.log('... image ['+currImage.id+'] changed to new activity: from ['+currImage.activity+'] to ['+newActivity+']');

					var undoImage = currImage.image;  // in case file op goes bad.

					var currFile = FCFCore.paths.images.activities(currImage.image);
					var newName = currImage.toSavedFileName();
					var newFile  = FCFCore.paths.images.activities(newName);

					FCFCore.files.move(currFile, newfile)
					.fail(function(err){

						// transaction failed
						AD.log.error('    --- renaming file failed!', err);
						next(err);

					})
					.then(function(){

						next();
					})
				}

			},


			//

			// 4) check for changes in taggedPeople and update currImage
			function(next) {

				var tags = req.param('taggedPeople');

				if (typeof tags == 'undefined') {

					// no tags provided, so continue on
					next();

				} else {

					// tags represents the official list of who should be tagged

					var currListTags = []; // collect any tags that didn't get removed.
// AD.log('... given tags:', tags);

// AD.log('... currently tagged people:');
// AD.log(currImage.taggedPeople);
					// foreach tag in currImage that isn't in provide list -> remove
					currImage.taggedPeople.forEach(function(person){
// AD.log('... person:', person.IDPerson);
						// note: the values in tags are strings,
						// so convert person.IDPerson to string here:
						var personID = person.IDPerson + '';  
						if (tags.indexOf(personID) == -1) {
							AD.log('... removing tag for person['+ person.IDPerson+']');
							currImage.taggedPeople.remove(person.IDPerson);
						} else {
							currListTags.push( personID );
						}
					});
// AD.log('... currListTags:', currListTags);

					// for each provided tag that isn't in our currListTags -> add
					tags.forEach(function(id){
// AD.log('... tags:', id);
						if (currListTags.indexOf(id) == -1) {
							AD.log('... adding tag for person ['+id+']');
							currImage.taggedPeople.add(id);
						}
					})

					// ok, tags synced!
					next();

				}

			},

			// 5) now update the remaining values and save
			function(next) {

				// var fields = [ 'date', 'caption' ];
				var newDate = req.param('date');
				if (newDate) {
					currImage.date = new Date(newDate);
				}

				currImage.save()
				.then(function(savedImg){

					// this is what we'll send back to the client
					finalData = savedImg.toClient(langCode);

					// now save any caption change:
					var newCaption = req.param('caption');
					if (newCaption == currImage.caption) {

						// no change, so done!
						next();
					} else {

						FCFActivityImagesTrans.findOne({ fcfactivityimages: currImage.id, language_code:langCode })
						.then(function( trans ){
							trans.caption = newCaption;
							finalData.caption = newCaption;

							trans.save()
							.then(function(){

								// all done!
								next();
							})
							.catch(function(err){
								AD.log('   --- error saving image translation:', err);
								next(err);
							})
						})
					}
				})
				.catch(function(err){
					AD.log('   --- error attempting to save current changes to Activity Image:', err);
					next(err);
				})

			},


			// 6) if we changed images, and our image was the Activity's default image
			//    update the activity.default_image
			function(next) {

				if (!isImageSwap) {
					next();
				} else {


					// get Activity
					FCFActivity.findOne({ id: currImage.activity})
					.then(function(activity){

						if (activity.default_image == origImage ) {

							AD.log('... image\'s activity.default_image was linked to our old image.');
							activity.default_image = currImage.image;
							activity.save()
							.then(function(data) {
								AD.log('... activity.default_image = '+data.default_image);
								finalData.default_image = finalData.image; // --> should already be converted to proper path
								next();
							})
							.catch(function(err){
								AD.log.error('error: updating activity.default_image: activity.save() failed: ', err);
								next(err);
							})
						} else {
							finalData.default_image = false;  // <-- no update happened.
							next();
						}
					})
					.catch(function(err){
						AD.log.error('error: can\'t FCFActivity.findOne() id:'+currImage.activity+' ', err);
						next(err);
					})

				}

			}

		], function(err, results){ 

			if (err) {	
				err._model = 'FCFActivityImages';
				ADCore.comm.error(res, err);
			} else {
				AD.log('... finalData:', finalData);
				AD.log("<green>activityimage.update() finished</green>");
				// res.send(finalData);
				ADCore.comm.success(res,finalData);

			}

		})

	},



	destroy:function(req, res) {

		var currImage = null;

		var imageName = null;

		var finalData = {};  

		AD.log('<green>ActivityImageController.destroy()</green>');

		var id = req.param('id');
		if (!id) {

			AD.comm.error(res, new Error('no id provided'));
			return;
		}

		async.series([

			// 1) get the current Image instance
			function(next) {

				AD.log('... finding current Image by id['+id+']');
				FCFActivityImages.findOne({ id:id })
				.populate('taggedPeople')
				.populate('activity')
				.then(function( image ) {

					currImage = image;
					imageName = currImage.image;
					next();

// currImage.translate(langCode)
// .fail(function(err){
// 	AD.log.error('... failed translating into lang['+langCode+']');
// 	next(err);
// })
// .then(function(){
// 	next();
// })

				})
				.catch(function(err){
					next(err);
				})

			},



			// 2) remove current image
			function(next) {


				AD.log('... removing existing image ['+ FCFCore.paths.images.activities(currImage.image) + ']' );
				fs.unlink(FCFCore.paths.images.activities(currImage.image), function(err){

					// ok so what if there was an error?
					next();
				})

			
			},


			// 3) now, if the image's activity is using this image for it's default image
			//    choose another!
			function(next) {

				// get Activity
				var activity = currImage.activity;
				if (!activity) {

					AD.log.error('our image did not return an activity!  Why?  image:', currImage);
					next();  // just keep on going for now.
				} else {

					// if they are not the same, then move along
					if (activity.default_image != currImage.image) {

						next();

					} else {


						// ok, we need to find another image and choose that one!
//// TODO:  in future we might want to simply emit an event that Activity lost an image
//// TODO:  in future there will be an interface to manage Activity Data and setting an image will be that responsibility
////        we should not have to do this here.

						AD.log('... this image was the Activity.default_image');
						FCFActivityImages.find({ id:{ '!':currImage.id }, activity: activity.id })
						.then(function(list){

							// if there are other images then choose first image
							if ((list) && (list.length > 0)) {

								activity.default_image = list[0].image; 
							} else {

								// else return to null
								activity.default_image = null;
								AD.log('... no other images found')
							}

							AD.log("... updating default_image:"+activity.default_image);
							activity.save()
							.then(function(a) {

								finalData.default_image = a.imageURL();

								// all done
								next();
							})
							.catch(function(err) {
								AD.log.error('error: cant save activity change. ', err);

								// next(err);
								next();  // <-- just move along for now since this is a secondary issue!
							})
						})
						.catch(function(err){

							AD.log.error('error: cant find additional images for activity:', err, activity);
							// next(err);
							next();
						})
					}
				}
			},

			


			// 4) now destroy the image translations
			function(next) {

				AD.log('... removing image translations');

				FCFActivityImagesTrans.destroy({ fcfactivityimages: currImage.id })
				.then(function( trans ){

					AD.log('... removing the image entry');

					// and now the actual image entry!
					currImage.destroy()
					.then(function(removedImg){

						next();

					})
					.catch(function(err){
						AD.log('   --- error attempting to destroy() Activity Image:', err);
						next(err);
					})
	
				})
				.catch(function(err){
					AD.log.error('   --- error removing image translations');
					next(err);
				})

			}




		], function(err, results){ 

			if (err) {	
				err._model = 'FCFActivityImages';
				ADCore.comm.error(res, err);
			} else {

				AD.log('<green> activityimage.delete() complete. </green>');
				ADCore.comm.success(res, finalData );
			}

		})
	},




	upload:function(req, res) {

		req.file('imageFile').upload({}, function(err, list){

			if (err) {
				ADCore.comm.error(res, err);
			} else {

				var tempFile = list[0].fd;
				var parts = list[0].fd.split(path.sep)
				var tempName = parts[parts.length-1];

				var processPath = process.cwd();
				var newFile = path.join(processPath, 'assets', 'data', 'fcf', 'images', 'temp', tempName);

				// the return name should be the path after assets/
				var returnName = newFile.replace(path.join(processPath, 'assets'), '');

				fs.rename(tempFile, newFile, function(err){

					if (err) {
						ADCore.comm.error(res, err);
					} else {
						ADCore.comm.success(res, { path:returnName, name:tempName });
					}
					
				});

			}
		})


	}
	
};

