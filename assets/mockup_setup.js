steal(
	'jquery-1.11.1.min.js'
).then(
	'jquery-ui.js'
).then(
	'bootstrap.min.js',
	'bootstraptable/bootstrap-table.js',
	'jquery.sidr.min.js',
	'typeahead.jquery.min.js',
	'selectivity/selectivity-full.min.css',
	'selectivity/selectivity-full.min.js'
).then(function() {


// $( document ).ready(function() {

	//  Find all the displayable <divs>
	var allDisplays = $('.rbac-display');


	var showIt = function( whichOne ) {

		allDisplays.each(function(indx, el){

			var $el = $(el);
			if ($el.hasClass(whichOne)) {
				$el.show();
			} else { 
				$el.hide();
			}
		})

	}

	// for each element that has a rbac-show="displayableDiv" attribute
	$('[rbac-show]').each(function(indx, el){

		// when it is clicked, then make sure only that div is shown
		var $el = $(el);
		$el.click(function(){
			showIt($el.attr('rbac-show'));
		})
	})

// });

 //Active InActive of Links
// $(document).ready(function () {
    
    $("ul.art-hmenu>li").on("click", "a", function (event) {
        $("#menu_wrapper .activelink").removeClass("activelink");
        $(this).addClass("activelink");
    });



// });

// $(function () {
  $('[data-toggle="tooltip"]').tooltip()
// })



 
/////
///// Setup Typeahead Search Bars
/////
// $(document).ready(function () {
    
    var inputs = [ '.fcf-team-filter', '.fcf-activity-filter'];
    inputs.forEach(function(tag){

		$(tag)
		.typeahead({
	        hint: true,
	        highlight: true,
	        minLength: 1
	    },
	    {
	        name: 'filter',
	        displayKey: 'value',
	        source: function(q,cb) {
	            cb([
	            	{ value: 'example 1'},
	            	{ value: 'examine'},
	            	{ value: 'exajerate'}
	            ]);
	        }
	    });

	});

// });


/////
///// Setup bootstrap-table on these tables:
/////
// $(document).ready(function () {

	var tables = [ '.fcf-team-list', '.fcf-activity-list', ]
    
    tables.forEach(function(tag){
    	$(tag).bootstrapTable({});
    })

// });



////
//// Setup selctivity on this input:
////
// $(document).ready(function(){

	var inputs = ['#image-tags'];
	inputs.forEach(function(el){
		var $el = $(el);

		$el.selectivity({
            items: [ {id:0, text:'no items loaded' }],
            multiple: true,
            placeholder:'people in photo'
        });
        // $el.on('change', function(obj, a, b) {
                
        // })
        $el.on('selectivity-close', function() {
        	$el.css('z-index', 999);  // fix z position bug!
        })
        $el.css('z-index', 999);
	})
// })


 //For Testing Display with lots of entries in our Tables:  
 // copy the last row x20 
// $(document).ready(function () {
    
    var allTables = $('table');
    allTables.each(function(i, table){
    	var $table = $(table);
    	var lastRow = $table.find('tr:last');
    	var tBody = $table.find('tbody');
    	for (var i=1; i<=20; i++) {
    		tBody.append(lastRow.clone());
    	} 
    })
	


// });


//Responsiveness of table scroll
// $(document).ready(function () {
    $(window).resize(function () {
        $('table[data-toggle="table"]').add($('table[id]')).bootstrapTable('resetView');
    });	

// });


// Document Resizing:
// $(document).ready(function(){
	$(window).resize(function(){

		// figure out the availableHeight to our Tool
		var hWindow = $(window).height();
		var hMasthead = $('.opsportal-container-masthead').outerHeight(true);
		var availableHeight = hWindow  - hMasthead; 

		// find all elements with a [resize-adj] attribute
		$('[resize-adj]').each(function(indx, el){

			var $el = $(el);
			var adj = parseInt($el.attr('resize-adj'), 10);

			$el.css('height', (availableHeight+adj) + 'px');
		})


	})
// })


})  // end steal()
