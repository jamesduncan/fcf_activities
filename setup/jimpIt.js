//
//	jimpIt.js
//
//  runs jimp on a given image file:
//
//  To use:
//  $ node jimpIt.js origFile:file/name/here.jpg quality:60 width:200 height:300 name:_scaled


var jimp = require('jimp');
var fs = require('fs-extra');  // fs but with copy!



//// Parse any command line arguments:
var options = {
	origFile:'??',
	quality:'??',
	width:'??',
	height:'??',
	name:'??'
}


process.argv.forEach(function(a){

	var parts = a.split(':');
	if (options[parts[0]]) {
		options[parts[0]] = parts[1];
	}

})

var missingParams = [];
for (var o in options) {
	if (options[o] == '??') {
		missingParams.push('missing parameter:'+o);
	}
}

if (missingParams.length > 0) {
	missingParams.forEach(function(mp){
		console.log(mp);
	})

	process.exit(1);
}



var toFile = options.origFile.replace('.', options.name+'.');

jimp.read(options.origFile)
.then(function(image){

	image
	.quality(parseInt(options.quality))
    .scaleToFit( parseInt(options.width), parseInt(options.height) )
    .write(toFile, function(err){
		if (err) {
			console.log('*** error: ', err);
			process.exit(1);
			return;
		} 

		console.log('render complete!');
		process.exit();
	})
})
.catch(function(err){
    console.log('*** error: ', err);
	process.exit(1);
});