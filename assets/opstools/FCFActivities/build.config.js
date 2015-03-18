module.exports={
    // map: {
    //     "*": {
    //       "jquery/jquery.js" : "jquery",
    //       "can/util/util.js": "can/util/jquery/jquery.js"
    //     }
    // },
    paths: {


        "selectivity.js"   : "js/selectivity/selectivity-full.min.js",
        "selectivity.css"  : "js/selectivity/selectivity-full.min.css"
    },
    shim : {


        'selectivity.js'  : { packaged:false },
        'selectivity.css' : { packaged:false },


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
    


