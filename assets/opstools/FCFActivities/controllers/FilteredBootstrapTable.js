
steal(
        // List your Controller's dependencies here:
        'appdev',
        'js/typeahead.jquery.min.js',
//        'opstools/FCFActivities/models/Projects.js',
//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
        // '//opstools/FCFActivities/views/AddChooseMinistry/AddChooseMinistry.ejs',
function(){


    /*
     *  FilteredBootstrapTable
     *
     *  This controller coordinates the actions of a Typeahead filter with an
     *  instance of bootstrap-table.  
     *
     *
     *  to use:
     *  -------
     *  @codestart
     *  var Filter = AD.Control.get('opstools.FCFActivities.FilteredBootstrapTable');
     *  this.Filter = new Filter(this.element, {
     *      tagFilter: '.fcf-team-filter',
     *      tagBootstrapTable: '.fcf-team-list',
     *      scrollToSelect:true,
     *  
     *      // filterTable:true,
     *  
     *      rowClicked:function(data) {
     *          if (data) {
     *              self.selectedData = data;
     *          }
     *      },
     *      rowDblClicked: function(data) {
     *          if (data) {
     *              self.selectedData = data;
     *              self.continue();
     *          }
     *      },
     *      termSelected:function(data) {
     *          if (data) {
     *              self.selectedData = data;
     *              self.continue();
     *          }
     *      },
     *      dataToTerm: function(data) {  
     *          if (data) {
     *              return data.name;
     *          } else {
     *              return '';
     *          }
     *      }
     *  });
     *
     *  this.filter.load( [ {id:1, name:'name 1'}, {id:2, name:'name 2'}, ... {id:N, name:'name N'}])
     *  @codeend
     *  
     *  @codestart
     *  <input type="text" class="form-control fcf-team-filter" placeholder="Search for Team">
     *  <table class="fcf-team-list table" data-toggle="table" data-cache="false" data-height="299" >
     *      <thead>
     *          <tr>
     *              <th data-field="name" >Name</th>
     *          </tr>
     *      </thead>
     *      <tbody>
     *      </tbody>
     *  </table>
     *  @codeend
     *
     *  NOTE: on bootstrap-table, you need to have a <th> column defined with a data-field="name" 
     *  properties that match the object properties you want to display in the table.
     *
     *
     *
     *  events:
     *  -------
     *  FilteredElements publishes these events on the given element:
     *
     *
     *
     *  Params:
     *  -------
     *  $el         {dom} a DOM element for this controller to attach to
     *  options     {obj} a json object representing the different options for this instance:
     *  
     *      tagFilter         {string} a jQuery selector for which textbox to use as the filter
     *      tagBootstrapTable {string} a jQuery selector for the table
     *      scrollToSelect    {bool}   scroll table to match selected filter value?
     *      filterTable       {bool}   only show rows in table that match current filter options?
     *      
     *      dataCursorOn        {fn}   a callback fn(data) called every time a possible entry is 
     *                                 highlighted in the dropdown
     *      rowClicked          {fn}   a callback fn(data) called when a table row is clicked
     *      rowDblClicked       {fn}   a callback fn(data) called when a table row is double clicked
     *      termSelected        {fn}   a callback fn() called when a typeahead value is 
     *                                 selected/autocompleted.
     *      dataToTerm          {fn}   a fn(data) called on each data entry provided.  should return 
     *                                 a {string} search term representing that data obj. 
     *     
     *
     *  Methods:
     *  --------
     *  load( [data] )       : loads the provided array of objects into the table and converts each
     *                         item into a search term for the typeahead filter. 
     */


    // Namespacing conventions:
    // AD.Control.extend('[application].[controller]', [{ static },] {instance} );
    AD.Control.extend('opstools.FCFActivities.FilteredBootstrapTable', {  


        init: function (element, options) {
            var self = this;
            options = AD.defaults({
                tagFilter:'.fe-filter',         // tag to find the typeahead textbox
                tagBootstrapTable:'.fe-el',     // tag to find the bootstrap-table entry
                scrollToSelect:true,            // scroll to bootstrap-table entry upon selection
                filterTable:false,              // auto filter bootstrap-table data to match typeahead

                // callbacks:
                dataCursorOn:function(el) {},   // fn() called when typeahead cursor is on an option
                rowClicked:function(el) {},     // fn() called when table row clicked
                rowDblClicked:function(el) {},  // fn() called when table row double clicked
                termSelected:function(el) {},   // fn() called when a typeahead term is selected

                // 
                dataToTerm:function(data) { return data+''; }, // fn() to return a typeahead searchterm

                tableOptions: {},               // the bootstrap-table options param.

                data:null                       // initial data for table
            }, options);
            this.options = options;

            // Call parent init
            // this._super(element, options);

            this.searchTerms = [];    // an array of search terms gathered from the found [el]
            this.dataHash = {};       // term :  { data }
            this.posHash = {};        // term :  # position (0 - data.length -1)

            this.table = null;
            this.listData = this.options.data;

            this.attachDOM();   // Attach Typeahead.js

            if (this.options.data) {
                this.load(this.options.data);
            } else {
//// TODO: do we load from an existing bootstrap-table data?

// console.warn('** TODO: load from existing bootstrap-table instance');
            }

        },



        attachDOM: function() {
            var self = this;


            ////
            //// Attach to DOM elements
            ////

            // Typeahead.js filter box
            this.textFilter = this.element.find(this.options.tagFilter)
                        .typeahead({
                            hint: true,
                            highlight: true,
                            minLength: 0
                        },
                        {
                            name: 'teams',
                            displayKey: 'value',
                            source: function(q,cb) {
                                self.filter(q,cb);
                            }
                        });

            this.textFilter.on('typeahead:closed', function(){
// console.log('typeahead:closed');

                // if there is a selected row, then just continue on:

            });

            this.textFilter.on('typeahead:cursorchanged', function(){
// console.log('typeahead:cursorchanged');

                var val = self.textFilter.typeahead('val');
                var data = self.dataHash[val];
                if (data) {
                    self.options.dataCursorOn(data);
                }

            });

            this.textFilter.on('typeahead:selected', function(){
// console.log('typeahead:selected');

                var val = self.textFilter.typeahead('val');
                
                if (self.options.scrollToSelect) {
                    self.table.bootstrapTable('scrollTo', self.posHash[val]);
                }

                var data = self.dataHash[val];
                if (data) {
                    self.options.termSelected(data);
                }

            });

            this.textFilter.on('typeahead:autocompleted', function(){
// console.log('typeahead:autocompleted');

                var val = self.textFilter.typeahead('val');

                if (self.options.scrollToSelect) {
                    self.table.bootstrapTable('scrollTo', self.posHash[val]);
                }

                var data = self.dataHash[val];
                if (data) {
                    self.textFilter.typeahead('close');
                    self.options.termSelected(data);
                }

            });




            this.table = this.element.find(this.options.tagBootstrapTable);
            this.table.bootstrapTable(this.options.tableOptions);
            this.table
            .on('click-row.bs.table', function (e, row, $element) {
// console.log('bootstraptable:row clicked');
                self.options.rowClicked(row);
            })
            .on('dbl-click-row.bs.table', function (e, row, $element) {
// console.log('bootstraptable:row double-clicked');
                self.options.rowDblClicked(row);
            });



        },




        filter: function(q,cb) {

            var matches, substrRegex;
 
            // an array that will be populated with substring matches
            matches = [];
         
            // if there is a q value
            if (q != '') {

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

                // if we are filtering the table then update table data:
                if (this.options.filterTable) {
                    this.filterElements(matches);
                }

            } else {

                // q value empty so redisplay all data in table if we are 
                // filtering the Table
                if (this.options.filterTable) {

                    // redisplay all the data in the table
                    this.table.bootstrapTable('load', this.listData);
                }
            }

            cb(matches);

        },



        // only show data rows that are part of the matches:
        filterElements: function( matches ) {
            var self = this;

            // // only show rows that match what is typed:

            var toShow = [];

            // create a Hash of id's that should be shown:
            matches.forEach(function(match) {
                var data = self.dataHash[match.value];
                if (data) {
                    toShow.push(data);
                }
            })

            this.table.bootstrapTable('load', toShow);

        },



        /**
         * @load
         *
         * reset our terms and BootstrapTable according to the given array of data items.
         */
        load:function(list) {
            var self = this;


            this.searchTerms = [];  // 'searchable text'
            this.dataHash = {};       // term : $tr of matching row
            this.posHash = {};


            this.listData  = list;


            // tell bootstrap-table to load this list of data
            this.table.bootstrapTable('load', list);


            // now figure out each of our hashes:
            var i = 0;
            list.forEach(function(data) { 
            // list.each(function(data, i){

                // what is the search tearm for this data item?
                var term = self.options.dataToTerm(data);
                self.searchTerms.push(term);

                // use term to create hashes:
                self.dataHash[term] = data;
                self.posHash[term] = i;

                i++;

            })

        },



        busy:function() {
            this.table.bootstrapTable('showLoading');
        },

        ready:function() {
            this.table.bootstrapTable('hideLoading');
        }



    });


});