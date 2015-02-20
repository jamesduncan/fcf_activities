module.exports={
    // map: {
    //     "*": {
    //       "jquery/jquery.js" : "jquery",
    //       "can/util/util.js": "can/util/jquery/jquery.js"
    //     }
    // },
    paths: {


        // "dropzone.js"  : "dropzone/dropzone.min.js",
        // "dropzone.css" : "dropzone/dropzone.css",
        "select3.js"   : "js/select3/select3-full.min.js",
        "select3.css"  : "js/select3/select3.css"
    },
    shim : {

        // 'dropzone.js'  : { packaged:false },
        // 'dropzone.css' : { packaged:false },

        'select3.js'  : { packaged:false },
        'select3.css' : { packaged:false },


        //// Don't include our labels in our production.js
        'site/labels/opstool-FCFActivities.js' : { packaged:false, ignore:true },


    }
    // ext: {
    //     js: "js",
    //     css: "css",
    //     less: "steal/less/less.js",
    //     coffee: "steal/coffee/coffee.js",
    // }
};
    


