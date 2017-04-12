//
//	rescalePhotos.js
//
//  this script will re render the FCF Activity photos into our desired output formats.
//
//  To use:
//  copy this to the server:  /fcf_activities/setup/rescalePhotos.js
//  cd /fcf_activities/setup
//  node rescalePhotos.js




var jimp = require('jimp');
var fs = require('fs-extra');  // fs but with copy!
var path = require('path');
var async = require('async');
var _ = require('lodash');


var renderDir = 'activities_render';
var pathImageDir = path.join(__dirname, '..', '..', '..', 'assets', 'data', 'fcf', 'images');
var pathFromDir = path.join(pathImageDir, 'activities');
var pathRenderDir 	= path.join(pathImageDir, renderDir);


// ignore these files in the directory:
var filesToIgnore = ['.DS_Store', 'placeholder_activity.jpg'];


// Renders
// Perform an image render according to each of these
// criteria:
//	.name 	: append this to the root file name
//  .width  : final width of the file
//  .height : final height of the file
// 
// To add another output format, insert another entry here:
var renders = [

    // Web Site Version
    // 160x120
    {
        name: '_scaled',
        quality:40,
        width: 160,
        height: 120,
        'default': true     // use this version by default
    },

    // Print Versions
    // 1800x1350
    {
        name: '_print',
        quality:60,
        width: 1800,
        height: 1350,
        'default':false
    }
]


// convert our Renders into an array of renderNames
// to easily check if a file is a rendered file.
var renderNames = [];
renders.forEach(function(r){
	renderNames.push(r.name);
});


/*
 * @function readFromDir
 *
 * return an array of all the files in a given directory path
 *
 * @param {string} fromDirPath  the current directory to read from
 * @param {fn} cb  node style callback function.
 */
function readFromDir(fromDirPath, cb) {
	fs.readdir(fromDirPath, function(err, files){
		if (err) { 
			cb(err); 
		} else {
// console.log('... files to process:', files);
			cb(null, files);
		}
	})
}


/*
 * @function copyFiles
 *
 * recursively copies the list of files from the pathSrc
 * directory to the pathDest directory.
 *
 * @param {array} list  array of filenames to copy
 * @param {string} pathSrc  the source directory to copy from
 * @param {string} pathDest the destination directory to copy TO
 * @param {fn} cb  node style callback when finished.
 */
function copyFiles(list, pathSrc, pathDest, cb) {
// console.log('... pathSrc:'+pathSrc);
// console.log('... pathDest:'+pathDest);

	if (list.length == 0) {
		cb();
	} else {
		var file = list.shift();
		
		if(isIgnoredFile(file)) {
			// move along
			copyFiles(list, pathSrc, pathDest, cb);

		} else {
			
			console.log('... copy file:'+file);
			var src = path.join(pathSrc, file);
			var dst = path.join(pathDest, file);
			fs.copy(src, dst, function(err){
				if (err) {
					cb(err);
					return;
				}
				copyFiles(list, pathSrc, pathDest, cb);
			})

		}
	}
}


/*
 * @function isIgnoredFile
 *
 * checks if a given filename matches one of our ignored files
 *
 * @param {string} fileName  the filename to check
 * @return {bool} 
 */
function isIgnoredFile(fileName) {

	return (filesToIgnore.indexOf(fileName) != -1);
}


/*
 * @function isRenderedFile
 *
 * checks if a given filename follows one of our renderd output name
 * formats.
 *
 * @param {string} fileName  the filename to check
 * @return {bool} 
 */
function isRenderedFile(fileName) {
	var found = false;
	renderNames.forEach(function(r){
		if (fileName.indexOf(r) != -1) {
			found = true;
		}
	})
	return found;
}


/*
 * @function removeScaledFiles
 *
 * recursively process a list of files and delete any that follow one
 * of our rendered output name formats.
 *
 * @param {array} list  an array of Filenames to check
 * @param {fn} cb  node style callback 
 */
function removeScaledFiles(list, cb) {
	if (list.length == 0) {
		cb();
	} else {

		var fileName = list.shift();
		if (isRenderedFile(fileName)) {

			// remove file
			console.log('... removing scaled file:'+ fileName);
			fs.unlink(path.join(pathRenderDir, fileName), function(err){

				if (err) {
					cb(err);
				} else {
					removeScaledFiles(list, cb);
				}
			});
		} else {

			removeScaledFiles(list, cb);
		}
	}
}


/*
 * @function processFile
 *
 * recursively process a list of files and make sure each one has 
 * been rendered.
 *
 * @param {array} allFiles  an array of Filenames to check
 * @param {fn} cb  node style callback 
 */
function processFile(allFiles, cb) {

	if (allFiles.length == 0) {
		cb();
	} else {

		var fileName = allFiles.shift();
		// var scaledName = fileName.replace('.', '_scaled.');

		if (isIgnoredFile(fileName)		// ignore these files
			|| (isRenderedFile(fileName))) { // this was the name of the previous scaled file

			// skip this one
			processFile(allFiles, cb);

		} else {

			// make this a path
			var fromFile = path.join(pathRenderDir, fileName);


			console.log('... converting file:'+fileName);

			// // get image in jimp:
			// jimp.read(fromFile)
			// .then(function(image) {

				var listRenders = _.clone(renders);

				renderFile(listRenders, fromFile, function(err){
					if (err) {
						cb(err);
					}else {
						processFile(allFiles, cb);
					}
				})

			// })
			// .catch(function(err){
			// 	cb(err);
			// })
		}
	}
}


/*
 * @function renderFile
 *
 * recursively process a list of Render Commands on a given
 * file.
 *
 * the output of the render'ed file will match the original Filename
 * + a render.name tag at the end.
 *
 * @param {array} list  an array of renders to perform
 * @param {string} origFile  the name of the original file being rendered
 * @param {jimp.image} image  the jimp image object to perform the renders with.
 * @param {fn} cb  node style callback 
 */
function renderFile(list, origFile, cb) {
	if (list.length == 0) {
		cb();
	} else {

		var render = list.shift();
		var toFile = origFile.replace('.', render.name+'.');

		jimp.read(origFile)
        .then(function(image){

			image
			.quality(render.quality)
		    .scaleToFit( render.width, render.height )
		    .write(toFile, function(err){
				if (err) {
					cb(err);
				} else {
					renderFile(list, origFile, cb);
				}
			})
		})
        .catch(function(err){
            cb(err);
        });

	}
}



// main
async.series([

	// step 1) make the temporary render directory:
	function (next) {
		console.log();
		console.log('*** Ensure our render directory exists:')
		console.log('    (and is clean)');
		console.log();
		fs.remove(pathRenderDir, function(err){
			if (err) {
				next(err);
				return;
			}

			fs.ensureDir(pathRenderDir, next);
		})
		

	},


	// step 2) copy files to our temp dir:
	function(next) {

		console.log();
		console.log('*** Copy Original Files');
		console.log();
		readFromDir(pathFromDir, function(err, allFiles) {

			copyFiles(allFiles, pathFromDir, pathRenderDir, function(err){
				next(err);
			})
			
		})
	},

	// in our render directory
	// step 3) remove existing scaled files:
	function(next) {
		console.log();
		console.log('*** Removing previously rendered files:')
		console.log();
		readFromDir(pathRenderDir, function(err, allFiles) {
			if (err) {
				next(err);
				return;
			} 
			removeScaledFiles(allFiles, next);
		});
		
	},


	// step 4) Process Each Image File
	function(next) {
		console.log();
		console.log('*** Render remaining files:')
		console.log();
		readFromDir(pathRenderDir, function(err, allFiles) {
			if (err) {
				next(err);
				return;
			} 
			processFile(allFiles, next);
		});
		
	},


	// step 5) copy RENDERED files back to original when done:
	function(next) {
		console.log();
		console.log('*** Copy back RENDERED files:')
		console.log();
		readFromDir(pathRenderDir, function(err, allFiles) {

			var onlyRenderedFiles = _.filter(allFiles, function(n){ return !isIgnoredFile(n); }).filter(isRenderedFile);

			copyFiles(onlyRenderedFiles, pathRenderDir, pathFromDir, function(err){
				next(err);
			})
			
		})
	}
	

], function(err, res){

	if (err) {
		console.log('... ERROR: ', err);
		return;
	}
	console.log('... rescalePhotos done!');
})
