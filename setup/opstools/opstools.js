/**
 * This file specifies any default Ops Portal Tool Definitions 
 * provided by this modlue.
 *  
 */
module.exports = [

    { 
        key:'adroit.activities', 
        permissions:'fcf.activities', 
        icon:'fa-file-image-o', 
        controller:'FCFActivities',
        label:'Adroit Activity Reporting',
        // context:'opstool-FCFActivities',
        isController:true, 
        options:{}, 
        version:'0' 
    }

];
