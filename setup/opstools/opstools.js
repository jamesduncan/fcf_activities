/**
 * This file specifies any default Ops Portal Tool Definitions 
 * provided by this modlue.
 *  
 */
module.exports = [

    { 
        key:'adroit.activities', 
        permissions:'fcf.activities, adcore.developer', 
        icon:'fa-file-image-o', 
        controller:'FCFActivities',
        label:'opp.toolActivityReporting',
        context:'opstool-FCFActivities',
        isController:true, 
        options:{}, 
        version:'0' 
    }

];
