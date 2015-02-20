
steal(
        // List your Controller's dependencies here:
        'appdev',
        'opstools/FCFActivities/models/UserTeam.js',
        'opstools/FCFActivities/models/TeamActivity.js',
        'opstools/FCFActivities/controllers/FilteredElements.js',
//        'opstools/FCFActivities/models/Projects.js',
//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
        // '//opstools/FCFActivities/views/AddChooseMinistry/AddChooseMinistry.ejs',
function(){

    // AddChooseMinistry Controller
    //
    // This controller is responsible for the operation of the "Choose Ministry"
    // step in adding an Activity.
    //
    // We display a list of UserTeams
    // We use a Typeahead.js widget to allow quick searching for entries
    // Once the user selects a team, they can continue to the [Next] page
    //
    // When [Next] is clicked/activated, this widget triggers a 'team.selected'
    // event to alert the Main FCFActivities Controller
    //
    // the .value() method will return the current model instance of the 
    // entry that was selected.
    //


    // Namespacing conventions:
    // AD.Control.extend('[application].[controller]', [{ static },] {instance} );
    AD.Control.extend('opstools.FCFActivities.AddChooseMinistry', {  


        CONST: {
            NEXT: 'team.selected'
        },

        init: function (element, options) {
            var self = this;
            options = AD.defaults({
//                    templateDOM: '//opstools/FCFActivities/views/AddChooseMinistry/AddChooseMinistry.ejs'
            }, options);
            this.options = options;

            // Call parent init
            this._super(element, options);


            // this.dataSource = this.options.dataSource; // AD.models.Projects;

            this.element.hide();

            this.initDOM();

            this.loadData();
            

        },



        initDOM: function () {
            var self = this;

//            this.element.html(can.view(this.options.templateDOM, {} ));

            ////
            //// Create our table entry Template
            ////

            // pull the row template from the current table
            var rowTemplate = this.domToString( this.element.find('.template') ).replace("template", "");

            rowTemplate = AD.util.string.replaceAll(rowTemplate, '[[=', '<%= ');
            rowTemplate = AD.util.string.replaceAll(rowTemplate, ']]', '%>');

            // make sure the model instance gets Dreturned for this <tr> element:
            // oh, and insert the IDMinistry as data-team-id attrib to the <tr> element
            rowTemplate = rowTemplate.replace('addata=""', '<%= (el) -> can.data(el, "team", team) %>  data-team-id="<%= team.attr(\'IDMinistry\') %>"')

            // remove the existing <tr> in the table
            this.element.find('.fcf-team-list tbody:last tr').remove();

            // now create the list template
            var templateString = [
                '<% teams.each(function(team) { %>',
                rowTemplate,
                '<% }) %>'
            ].join('\n');

            // register template as :  'FCFActivities_AddChosenMinistry'
            //  NOTE:  DON'T USE '.' as seperators here!!!  -> can.ejs thinks they are file names then... doh!
            can.view.ejs('FCFActivities_AddChooseMinistry', templateString);



            ////
            //// Attach to DOM elements
            ////


            // attach to the <table>
            this.tableMinistryTeams = this.element.find('.fcf-team-list');


            // attach to the [Next] button && disable it
            this.buttons = {};
            this.buttons.next = this.element.find('#fcf-activity-add-chooseteam-next');
            this.buttons.next.attr('disabled', 'disabled');
            this.buttons.next.addClass('disabled');


            // attach the FilteredElements Controller
            var Filter = AD.Control.get('opstools.FCFActivities.FilteredElements');
            this.Filter = new Filter(this.element, {
                tagFilter: '.fcf-team-filter',
                tagEl: '.fcf-team-list tr',
classSelected:'el-selected',
                elSelected:function(el) {
                    if (el) {
                        self.selectRow(el);
                        self.buttons.next.click();
                    }
                },
                elToTerm: function(el) {  
                    var team = el.data('team');
                    if (team) {
                        return team.MinistryDisplayName+', '+ team.ProjectOwner;
                    } else {
                        console.error(' Ministry Team Row not setup properly.');
                        return '';
                    }
                }
            });

        },



        loadData:function() {
            var self = this;

            var modelUserTeam = AD.Model.get('opstools.FCFActivities.UserTeam');

            this.listTeams = null;
            this.searchTerms = [];  // 'searchable text'
            this.searchHash = {};   // term : $tr of matching row

            modelUserTeam.findAll()
            .fail(function(err) {
                console.log(err);
            })
            .then(function(list){

                self.listTeams = list;

                self.element.find('.fcf-team-list > tbody:last').append(can.view('FCFActivities_AddChooseMinistry', {teams:list}));

                // self.listTeams.forEach(function(team){
                //     var term = team.MinistryDisplayName+', '+ team.ProjectOwner;
                //     self.searchTerms.push( term );

                //     var rowFilter = 'tr[data-team-id="'+team.attr("IDMinistry")+'"]';
                //     var teamRow = self.element.find(rowFilter)[0];
                //     self.searchHash[term] = $(teamRow);
                // })


                // tell our Filter to scan the DOM and initialize
                self.Filter.refresh();

//// Search Box :  https://github.com/riklomas/quicksearch#readme
//// image based selector:  http://websemantics.github.io/Image-Select/
//// multi select: "Select3" : https://arendjr.github.io/select3/
//// 
/////  ----->>>   http://twitter.github.io/typeahead.js/examples/   



            })

        },


        selectRow:function($row) {

            this.tableMinistryTeams.find('.selected').removeClass('selected');

            if ($row) {
                $row.addClass('selected');

                // once a Row is selected, we can
                // enable the [Next] button
                this.buttons.next.removeAttr('disabled');
                this.buttons.next.removeClass('disabled');
            } else {

                // if nothing is selected, then disable the next button
                this.buttons.next.attr('disabled', 'disabled');
                this.buttons.next.addClass('disabled');
            }
        },


        // return the model instace of the UserTeam entry selected by this page
        value: function() {

            var selectedModel = this.tableMinistryTeams.find('.selected').data('team');
            if (selectedModel) {
                return selectedModel;
            } else {
                return null;
            }
        },


        // when an entry is clicked on, mark it as selected.
        '.fcf-team-list tbody tr click': function($el, ev) {

            this.selectRow($el);

            ev.preventDefault();
        },


        // when the [Next] button is clicked, then trigger our event:
        '#fcf-activity-add-chooseteam-next click': function($el, ev) {
            this.element.trigger(this.CONST.NEXT);
        }


    });


});