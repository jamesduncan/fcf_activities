
steal(
        // List your Controller's dependencies here:
        'appdev',
        'js/typeahead.jquery.min.js',
//        'opstools/FCFActivities/models/Projects.js',
//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
        // '//opstools/FCFActivities/views/AddChooseMinistry/AddChooseMinistry.ejs',
function(){


    /*
     *  FilteredElements
     *
     *  A controller that allows the user to enter a text filter in a textbox
     *  and then the resulting elements will be show() or hide() 
     *
     *  to use:
     *  var Filter = AD.Control.get('opstools.FCFActivities.FilteredElements');
     *  filter = new Filter(this.element, {
     *      tagFilter: '.filter-selector',
     *      tagEl: 'tr',
     *      classSelected:'el-selected',
     *      elCursorOn:function(el) {},
     *      elSelected:function(el) {},
     *      elToTerm: function(el) {  return el.data('model').Name }
     *  });
     *
     *  events:
     *  FilteredElements publishes these events on the given element:
     *
     *  options:
     *  tagFilter {string} a jQuery selector for which textbox to use as the filter
     *  tagEl {string} a jQuery selector for which elements to filter
     *  elCursorOn {fn} a callback fn() called every time a possible entry is 
     *                  highlighted in the dropdown
     *  elSelected {fn} a callback fn() called when a value is selected/autocompleted.
     *  elToTerm {fn} called on each el found.  should return a {string} search term
     *                representing that el. 
     *      
     */


    // Namespacing conventions:
    // AD.Control.extend('[application].[controller]', [{ static },] {instance} );
    AD.Control.extend('opstools.FCFActivities.FilteredElements', {  


        init: function (element, options) {
            var self = this;
            options = AD.defaults({
                tagFilter:'.fe-filter',
                tagEl:'.fe-el',
// classSelected:'.fe-selected',
                elCursorOn:function(el) {},
                elSelected:function(el) {},
                elToTerm:function(el) { return el.innerHtml(); }
            }, options);
            this.options = options;

            // Call parent init
            // this._super(element, options);

            this.searchTerms = [];    // an array of search terms gathered from the found [el]
            this.elHash = {};   // term :  $el


            this.attachDOM();   // Attach Typeahead.js

            this.refresh(); // scans the DOM and initializes our search info.

        },



        attachDOM: function() {
            var self = this;


            ////
            //// Attach to DOM elements
            ////

            // Typeahead.js filter box
            this.teamFilter = this.element.find(this.options.tagFilter)
                        .typeahead({
                            hint: true,
                            highlight: true,
                            minLength: 1
                        },
                        {
                            name: 'teams',
                            displayKey: 'value',
                            source: function(q,cb) {
                                self.filter(q,cb);
                            }
                        });

            this.teamFilter.on('typeahead:closed', function(){
console.log('typeahead:closed');

                // if there is a selected row, then just continue on:

            })

            this.teamFilter.on('typeahead:cursorchanged', function(){
console.log('typeahead:cursorchanged');

                var val = self.teamFilter.typeahead('val');
                var el = self.elHash[val];
                if (el) {
                    self.options.elCursorOn(el);
                }

            })

            this.teamFilter.on('typeahead:selected', function(){
console.log('typeahead:selected');

                var val = self.teamFilter.typeahead('val');
                var el = self.elHash[val];
                if (el) {
                    self.options.elSelected(el);
                }

            })

            this.teamFilter.on('typeahead:autocompleted', function(){
console.log('typeahead:autocompleted');

                var val = self.teamFilter.typeahead('val');
                var el = self.elHash[val];
                if (el) {
                    self.teamFilter.typeahead('close');
                    self.options.elSelected(el);
                }

            })


        },




        filter: function(q,cb) {

            var matches, substrRegex;
 
            // an array that will be populated with substring matches
            matches = [];
         
            // regex used to determine if a string contains the substring `q`
            substrRegex = new RegExp(AD.util.string.quoteRegExp(q), 'i');
         
            // iterate through the pool of strings and for any string that
            // contains the substring `q`, add it to the `matches` array
            $.each(this.searchTerms, function(i, str) {
              if (substrRegex.test(str)) {
                // the typeahead jQuery plugin expects suggestions to a
                // JavaScript object, refer to typeahead docs for more info
                matches.push({ value: str });
              }
            });
         
            cb(matches);
            this.filterElements(matches);
        },



        // only show el's that are part of the matches:
        filterElements: function( matches ) {
            var self = this;

            // only show rows that match what is typed:

            var toShow = [];

            // create a Hash of id's that should be shown:
            matches.forEach(function(match) {
                var el = self.elHash[match.value];
                if (el) {
                    toShow.push(el);
                }
            })

            // now go through each of our rows and determine if that row should be 
            // shown or hidden:
            for (var k in self.elHash) {
                var el = self.elHash[k];

                // well, did this el show up in our toShow list?
                if (toShow.indexOf(el) != -1) {
                    el.show();
                } else {
                    el.hide();
                }
            }

        },



        /**
         * @refresh
         *
         * reset our terms and [el] based upon the current state of the DOM.
         */
        refresh:function() {
            var self = this;


            this.searchTerms = [];  // 'searchable text'
            this.elHash = {};       // term : $tr of matching row

            this.element.find(this.options.tagEl).each(function(i, el){
                var $el = $(el);

                var term = self.options.elToTerm($el);
                self.searchTerms.push(term);
                self.elHash[term] = $el;

            })

        },



        /**
         * @function selectedEl
         *
         * return the $el that matches the current text filter
         *
         * @return {$el} or undefined
         */
        selectedEl: function() {

            var val = this.teamFilter.typeahead('val');
            return this.elHash[val];

        }



    });


});